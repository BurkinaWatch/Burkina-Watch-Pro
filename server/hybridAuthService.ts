import crypto from "node:crypto";
import { storage } from "./storage";
import { getUncachableResendClient } from "./resend";

interface TwilioCredentials {
  accountSid: string;
  authToken: string;
  phoneNumber: string;
}

async function getTwilioCredentials(): Promise<TwilioCredentials> {
  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE_NUMBER) {
    return {
      accountSid: process.env.TWILIO_ACCOUNT_SID,
      authToken: process.env.TWILIO_AUTH_TOKEN,
      phoneNumber: process.env.TWILIO_PHONE_NUMBER,
    };
  }

  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY
    ? 'repl ' + process.env.REPL_IDENTITY
    : process.env.WEB_REPL_RENEWAL
    ? 'depl ' + process.env.WEB_REPL_RENEWAL
    : null;

  if (!xReplitToken || !hostname) {
    throw new Error('Twilio credentials not configured');
  }

  const response = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=twilio',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  );

  const data = await response.json();
  const connectorSettings = data.items?.[0];

  if (!connectorSettings?.settings?.account_sid) {
    throw new Error('Twilio not connected');
  }

  return {
    accountSid: connectorSettings.settings.account_sid,
    authToken: connectorSettings.settings.auth_token,
    phoneNumber: connectorSettings.settings.phone_number,
  };
}

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function normalizePhoneNumber(phone: string): string {
  let cleaned = phone.replace(/\D/g, '');
  
  if (cleaned.startsWith('00')) {
    cleaned = cleaned.substring(2);
  }
  
  if (cleaned.startsWith('226') && cleaned.length === 11) {
    return '+' + cleaned;
  }
  
  if (cleaned.length === 8 && (cleaned.startsWith('5') || cleaned.startsWith('6') || cleaned.startsWith('7'))) {
    return '+226' + cleaned;
  }
  
  if (!cleaned.startsWith('+')) {
    return '+' + cleaned;
  }
  
  return cleaned;
}

export async function sendEmailOtp(email: string): Promise<{ success: boolean; message: string }> {
  try {
    const code = generateOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await storage.deleteExpiredOtpCodes(email, 'email');
    await storage.createOtpCode({
      identifier: email.toLowerCase(),
      type: 'email',
      code,
      expiresAt,
    });

    const { client, fromEmail } = await getUncachableResendClient();
    
    await client.emails.send({
      from: fromEmail,
      to: email,
      subject: 'Votre code de connexion Burkina Secure',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #1a365d;">Burkina Secure</h2>
          <p>Bonjour,</p>
          <p>Votre code de connexion est :</p>
          <div style="background-color: #f0f4f8; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #2d3748;">${code}</span>
          </div>
          <p>Ce code expire dans <strong>10 minutes</strong>.</p>
          <p>Si vous n'avez pas demandé ce code, ignorez ce message.</p>
          <hr style="margin: 20px 0; border: none; border-top: 1px solid #e2e8f0;">
          <p style="font-size: 12px; color: #718096;">Burkina Secure - Votre sécurité, notre priorité</p>
        </div>
      `,
    });

    return { success: true, message: 'Code envoyé par email' };
  } catch (error: any) {
    console.error('Error sending email OTP:', error);
    return { success: false, message: error.message || 'Erreur lors de l\'envoi du code' };
  }
}

export async function sendSmsOtp(phone: string): Promise<{ success: boolean; message: string }> {
  try {
    const normalizedPhone = normalizePhoneNumber(phone);
    const code = generateOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await storage.deleteExpiredOtpCodes(normalizedPhone, 'sms');
    await storage.createOtpCode({
      identifier: normalizedPhone,
      type: 'sms',
      code,
      expiresAt,
    });

    const credentials = await getTwilioCredentials();
    
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${credentials.accountSid}/Messages.json`;
    const auth = Buffer.from(`${credentials.accountSid}:${credentials.authToken}`).toString('base64');
    
    const response = await fetch(twilioUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        To: normalizedPhone,
        From: credentials.phoneNumber,
        Body: `Burkina Secure: Votre code de connexion est ${code}. Il expire dans 10 minutes.`,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Erreur Twilio');
    }

    return { success: true, message: 'Code envoyé par SMS' };
  } catch (error: any) {
    console.error('Error sending SMS OTP:', error);
    return { success: false, message: error.message || 'Erreur lors de l\'envoi du SMS' };
  }
}

export async function verifyOtp(
  identifier: string,
  code: string,
  type: 'email' | 'sms'
): Promise<{ success: boolean; userId?: string; message: string }> {
  try {
    const normalizedIdentifier = type === 'sms' 
      ? normalizePhoneNumber(identifier)
      : identifier.toLowerCase();

    const otpRecord = await storage.getValidOtpCode(normalizedIdentifier, type);
    
    if (!otpRecord) {
      return { success: false, message: 'Code invalide ou expiré' };
    }

    if (otpRecord.attempts >= 5) {
      await storage.deleteOtpCode(otpRecord.id);
      return { success: false, message: 'Trop de tentatives. Demandez un nouveau code.' };
    }

    if (otpRecord.code !== code) {
      await storage.incrementOtpAttempts(otpRecord.id);
      return { success: false, message: 'Code incorrect' };
    }

    await storage.deleteOtpCode(otpRecord.id);

    let user;
    if (type === 'email') {
      user = await storage.getUserByEmail(normalizedIdentifier);
    } else {
      user = await storage.getUserByPhone(normalizedIdentifier);
    }

    if (!user) {
      const userId = crypto.randomUUID();
      const userData: any = {
        id: userId,
        isAnonymous: false,
        authProvider: type === 'email' ? 'email' : 'phone',
        role: 'user',
      };
      
      if (type === 'email') {
        userData.email = normalizedIdentifier;
      } else {
        userData.telephone = normalizedIdentifier;
      }
      
      user = await storage.upsertUser(userData);
    } else if (user.isAnonymous) {
      const updateData: any = {
        isAnonymous: false,
        authProvider: type === 'email' ? 'email' : 'phone',
        role: user.role === 'guest' ? 'user' : user.role,
      };
      
      if (type === 'email') {
        updateData.email = normalizedIdentifier;
      } else {
        updateData.telephone = normalizedIdentifier;
      }
      
      user = await storage.updateUserProfile(user.id, updateData);
    }

    return { 
      success: true, 
      userId: user!.id,
      message: 'Connexion réussie' 
    };
  } catch (error: any) {
    console.error('Error verifying OTP:', error);
    return { success: false, message: error.message || 'Erreur de vérification' };
  }
}

export async function checkTwilioAvailability(): Promise<boolean> {
  try {
    await getTwilioCredentials();
    return true;
  } catch {
    return false;
  }
}
