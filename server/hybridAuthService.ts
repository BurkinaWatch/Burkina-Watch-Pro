import crypto from "node:crypto";
import { storage } from "./storage";
import { sendOtpEmail, isEmailServiceAvailable } from "./emailService";

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
    if (!isEmailServiceAvailable()) {
      return {
        success: false,
        message: "Service email non configuré. Veuillez configurer les identifiants SMTP (GMAIL_USER/GMAIL_APP_PASSWORD ou SMTP_USER/SMTP_PASS).",
      };
    }

    const code = generateOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await storage.deleteExpiredOtpCodes(email.toLowerCase(), 'email');
    await storage.createOtpCode({
      identifier: email.toLowerCase(),
      type: 'email',
      code,
      expiresAt,
    });

    const result = await sendOtpEmail(email, code);
    return result;
  } catch (error: any) {
    console.error('❌ Error sending email OTP:', error);
    return { success: false, message: error?.message || "Erreur lors de l'envoi du code" };
  }
}

export async function sendSmsOtp(phone: string): Promise<{ success: boolean; message: string }> {
  return {
    success: false,
    message: "Le service SMS n'est pas disponible. Veuillez utiliser l'authentification par email.",
  };
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

export function checkEmailAvailability(): boolean {
  return isEmailServiceAvailable();
}

export async function checkTwilioAvailability(): Promise<boolean> {
  return false;
}
