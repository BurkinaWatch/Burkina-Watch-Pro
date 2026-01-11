import nodemailer from 'nodemailer';

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
  const fromName = process.env.SMTP_FROM_NAME || 'Burkina Secure';

  return {
    host,
    port,
    secure,
    auth: { user, pass },
    fromEmail,
    fromName,
  };
}

let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter | null {
  if (transporter) return transporter;
  
  const config = getEmailConfig();
  if (!config) return null;

  transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: config.auth,
  });

  return transporter;
}

export function isEmailServiceAvailable(): boolean {
  return getEmailConfig() !== null;
}

export async function sendOtpEmail(
  toEmail: string,
  code: string
): Promise<{ success: boolean; message: string }> {
  try {
    const config = getEmailConfig();
    const transport = getTransporter();

    if (!config || !transport) {
      return {
        success: false,
        message: "Service email non configuré. Veuillez configurer les identifiants SMTP (GMAIL_USER/GMAIL_APP_PASSWORD ou SMTP_USER/SMTP_PASS).",
      };
    }

    console.log(`📧 Sending OTP email to ${toEmail} via SMTP`);

    const result = await transport.sendMail({
      from: `"${config.fromName}" <${config.fromEmail}>`,
      to: toEmail,
      subject: 'Votre code de connexion Burkina Secure',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #16a34a;">Burkina Secure</h2>
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

    console.log('✅ Email OTP sent successfully:', result.messageId);
    return { success: true, message: 'Code envoyé par email' };
  } catch (error: any) {
    console.error('❌ Error sending email OTP:', error);
    return {
      success: false,
      message: error?.message || "Erreur lors de l'envoi de l'email",
    };
  }
}

export async function sendLocationEmail(
  toEmail: string,
  userName: string,
  address: string,
  locationCount: number,
  gpxContent?: string,
  sessionId?: string
): Promise<any> {
  try {
    const config = getEmailConfig();
    const transport = getTransporter();

    if (!config || !transport) {
      throw new Error("Service email non configuré");
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
      subject: 'Burkina Watch - Votre Position de Sécurité',
      html: `
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
      `,
      attachments,
    });

    console.log('✅ Location email sent:', result.messageId);
    return result;
  } catch (error) {
    console.error('❌ Error sending location email:', error);
    throw error;
  }
}

export async function sendEmergencyTrackingStartEmail(
  toEmail: string,
  contactName: string,
  userName: string,
  liveTrackingUrl: string,
  initialLocation?: { latitude: number; longitude: number; address?: string }
): Promise<any> {
  try {
    const config = getEmailConfig();
    const transport = getTransporter();

    if (!config || !transport) {
      throw new Error("Service email non configuré");
    }

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

    const result = await transport.sendMail({
      from: `"${config.fromName}" <${config.fromEmail}>`,
      to: toEmail,
      subject: `ALERTE: ${userName} a activé le suivi de sécurité en direct`,
      html: `
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
      `,
    });

    console.log(`✅ Emergency tracking email sent to ${toEmail}`);
    return result;
  } catch (error) {
    console.error(`❌ Error sending emergency tracking email:`, error);
    throw error;
  }
}
