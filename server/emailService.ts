import nodemailer from 'nodemailer';
import { Resend } from 'resend';

interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
  fromEmail: string;
  fromName: string;
}

function logEmailConfig() {
  console.log('📧 Email service check:');
  console.log('  - RESEND_API_KEY:', process.env.RESEND_API_KEY ? `✅ (${process.env.RESEND_API_KEY.substring(0, 8)}...)` : '❌ not set');
  console.log('  - GMAIL_USER:', process.env.GMAIL_USER ? '✅ configured' : '❌ not set');
  console.log('  - GMAIL_APP_PASSWORD:', process.env.GMAIL_APP_PASSWORD ? '✅ configured' : '❌ not set');
}

function getEmailConfig(): EmailConfig | null {
  const user = process.env.SMTP_USER || process.env.GMAIL_USER;
  const pass = process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD;
  
  if (!user || !pass) {
    return null;
  }

  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const secure = process.env.SMTP_SECURE === 'true' || port === 465;
  const fromEmail = process.env.SMTP_FROM_EMAIL || user;
  const fromName = process.env.SMTP_FROM_NAME || 'Burkina Watch';

  return {
    host,
    port,
    secure,
    auth: { user, pass },
    fromEmail,
    fromName,
  };
}

function createTransporter(): nodemailer.Transporter | null {
  const config = getEmailConfig();
  if (!config) return null;

  return nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: config.auth,
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
  });
}

function getResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.log('❌ RESEND_API_KEY not found in environment');
    return null;
  }
  console.log(`✅ Creating Resend client with key: ${apiKey.substring(0, 8)}...`);
  return new Resend(apiKey);
}

function getResendFromEmail(): string {
  return process.env.RESEND_FROM_EMAIL || 'noreply@burkinawatch.com';
}

export function isEmailServiceAvailable(): boolean {
  const hasSmtp = !!(process.env.SMTP_USER || process.env.GMAIL_USER) && 
                  !!(process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD);
  const hasResend = !!process.env.RESEND_API_KEY;
  
  console.log(`📧 Email availability check: SMTP=${hasSmtp}, Resend=${hasResend}`);
  return hasSmtp || hasResend;
}

async function sendViaResend(
  toEmail: string,
  subject: string,
  html: string
): Promise<{ success: boolean; message: string }> {
  const resend = getResendClient();
  if (!resend) {
    return { success: false, message: 'Resend non configuré' };
  }

  try {
    console.log(`📧 Sending email via Resend to ${toEmail}`);
    const fromEmail = getResendFromEmail();
    console.log(`📧 From: Burkina Watch <${fromEmail}>`);
    
    const result = await resend.emails.send({
      from: `Burkina Watch <${fromEmail}>`,
      to: toEmail,
      subject,
      html,
    });

    if (result.error) {
      console.error('❌ Resend error:', result.error);
      return { success: false, message: result.error.message };
    }

    console.log('✅ Email sent via Resend:', result.data?.id);
    return { success: true, message: 'Email envoyé' };
  } catch (error: any) {
    console.error('❌ Resend exception:', error);
    return { success: false, message: error?.message || 'Erreur Resend' };
  }
}

async function sendViaSMTP(
  toEmail: string,
  subject: string,
  html: string,
  fromEmail: string,
  fromName: string
): Promise<{ success: boolean; message: string }> {
  const transport = createTransporter();
  if (!transport) {
    return { success: false, message: 'SMTP non configuré' };
  }

  try {
    console.log(`📧 Sending email via SMTP to ${toEmail}`);
    const result = await transport.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to: toEmail,
      subject,
      html,
    });

    console.log('✅ Email sent via SMTP:', result.messageId);
    return { success: true, message: 'Email envoyé' };
  } catch (error: any) {
    console.error('❌ SMTP error:', error);
    return { success: false, message: error?.message || 'Erreur SMTP' };
  }
}

export async function sendOtpEmail(
  toEmail: string,
  code: string
): Promise<{ success: boolean; message: string }> {
  logEmailConfig();
  
  const subject = 'Votre code de connexion Burkina Watch';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #16a34a;">Burkina Watch</h2>
      <p>Bonjour,</p>
      <p>Votre code de connexion est :</p>
      <div style="background-color: #f0f4f8; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
        <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #2d3748;">${code}</span>
      </div>
      <p>Ce code expire dans <strong>10 minutes</strong>.</p>
      <p>Si vous n'avez pas demandé ce code, ignorez ce message.</p>
      <hr style="margin: 20px 0; border: none; border-top: 1px solid #e2e8f0;">
      <p style="font-size: 12px; color: #718096;">Burkina Watch - Votre sécurité, notre priorité</p>
    </div>
  `;

  const resendKey = process.env.RESEND_API_KEY;
  console.log(`📧 RESEND_API_KEY present: ${!!resendKey}`);
  
  if (resendKey) {
    console.log('📧 Using Resend API (priority)...');
    const result = await sendViaResend(toEmail, subject, html);
    console.log(`📧 Resend result: success=${result.success}, message=${result.message}`);
    if (result.success) {
      return result;
    }
    console.log('⚠️ Resend failed, will try SMTP as fallback...');
  } else {
    console.log('📧 No RESEND_API_KEY, skipping Resend');
  }

  const config = getEmailConfig();
  if (config) {
    console.log('📧 Trying SMTP fallback...');
    const result = await sendViaSMTP(toEmail, subject, html, config.fromEmail, config.fromName);
    if (result.success) return result;
  }

  return {
    success: false,
    message: "Service email non disponible. Configurez RESEND_API_KEY ou GMAIL_USER/GMAIL_APP_PASSWORD.",
  };
}

export async function sendLocationEmail(
  toEmail: string,
  userName: string,
  address: string,
  locationCount: number,
  gpxContent?: string,
  sessionId?: string
): Promise<any> {
  const subject = 'Burkina Watch - Votre Position de Sécurité';
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Inter', Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .header h1 { margin: 0; font-size: 24px; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
        .info-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #22c55e; }
        .address { font-size: 16px; font-weight: 600; color: #1f2937; margin: 10px 0; }
        .stats { display: flex; gap: 20px; margin: 20px 0; }
        .stat { flex: 1; text-align: center; padding: 15px; background: white; border-radius: 8px; }
        .stat-value { font-size: 24px; font-weight: bold; color: #16a34a; }
        .stat-label { font-size: 12px; color: #6b7280; margin-top: 5px; }
        .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #6b7280; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Burkina Watch</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">Votre Sécurité, Notre Priorité</p>
        </div>
        <div class="content">
          <p>Bonjour <strong>${userName}</strong>,</p>
          <div class="info-box">
            <h2>Votre Position de Sécurité</h2>
            <p>Vous avez arrêté votre suivi de localisation en direct.</p>
            <div class="stats">
              <div class="stat">
                <div class="stat-value">${locationCount}</div>
                <div class="stat-label">Points enregistrés</div>
              </div>
            </div>
            <p><strong>Adresse approximative :</strong></p>
            <div class="address">${address}</div>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Burkina Watch</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  if (process.env.RESEND_API_KEY) {
    const result = await sendViaResend(toEmail, subject, html);
    if (result.success) return result;
  }

  const config = getEmailConfig();
  if (!config) {
    throw new Error("Service email non configuré");
  }

  const transport = createTransporter();
  if (!transport) {
    throw new Error("Transport SMTP non disponible");
  }

  const attachments = gpxContent && sessionId
    ? [{
        filename: `burkina-watch-tracking-${sessionId}.gpx`,
        content: gpxContent,
      }]
    : [];

  const result = await transport.sendMail({
    from: `"${config.fromName}" <${config.fromEmail}>`,
    to: toEmail,
    subject,
    html,
    attachments,
  });

  console.log('✅ Location email sent:', result.messageId);
  return result;
}

export async function sendEmergencyTrackingStartEmail(
  toEmail: string,
  contactName: string,
  userName: string,
  liveTrackingUrl: string,
  initialLocation?: { latitude: number; longitude: number; address?: string }
): Promise<any> {
  const locationInfo = initialLocation
    ? `
      <div style="background: #ecfdf5; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #22c55e;">
        <h3 style="margin-top: 0; color: #16a34a;">Position de départ</h3>
        <p><strong>Adresse:</strong> ${initialLocation.address || 'Localisation en cours...'}</p>
        <p><strong>Coordonnées GPS:</strong> ${initialLocation.latitude.toFixed(6)}, ${initialLocation.longitude.toFixed(6)}</p>
        <a href="https://www.google.com/maps?q=${initialLocation.latitude},${initialLocation.longitude}"
           style="display: inline-block; background: #22c55e; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; margin-top: 10px;">
          Voir sur Google Maps
        </a>
      </div>
    `
    : '';

  const subject = `ALERTE: ${userName} a activé le suivi de sécurité en direct`;
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Inter', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .urgent-badge { background: #fef2f2; border: 2px solid #dc2626; color: #dc2626; padding: 15px; text-align: center; font-weight: bold; font-size: 18px; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
        .info-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626; }
        .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #6b7280; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>ALERTE DE SÉCURITÉ</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">Burkina Watch - Suivi en Direct Activé</p>
        </div>
        <div class="urgent-badge">
          ${userName} a activé le suivi de localisation en direct
        </div>
        <div class="content">
          <p>Bonjour <strong>${contactName}</strong>,</p>
          <div class="info-box">
            <p>Vous avez été désigné(e) comme <strong>contact d'urgence</strong> par <strong>${userName}</strong>.</p>
            <p>Cette personne vient d'activer le <strong>suivi de localisation en temps réel</strong>.</p>
          </div>
          <div style="background: #fef3c7; padding: 10px 15px; border-radius: 6px; margin: 15px 0; text-align: center;">
            Activé le: <strong>${new Date().toLocaleString('fr-FR', {
              timeZone: 'Africa/Ouagadougou',
              dateStyle: 'full',
              timeStyle: 'medium'
            })}</strong>
          </div>
          ${locationInfo}
          <div class="footer">
            <p>© ${new Date().getFullYear()} Burkina Watch</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  if (process.env.RESEND_API_KEY) {
    const result = await sendViaResend(toEmail, subject, html);
    if (result.success) return result;
  }

  const config = getEmailConfig();
  if (!config) {
    throw new Error("Service email non configuré");
  }

  const transport = createTransporter();
  if (!transport) {
    throw new Error("Transport SMTP non disponible");
  }

  const result = await transport.sendMail({
    from: `"${config.fromName}" <${config.fromEmail}>`,
    to: toEmail,
    subject,
    html,
  });

  console.log(`✅ Emergency tracking email sent to ${toEmail}`);
  return result;
}
