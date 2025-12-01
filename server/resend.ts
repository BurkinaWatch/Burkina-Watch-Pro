import { Resend } from 'resend';

let connectionSettings: any;

async function getCredentials() {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=resend',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  if (!connectionSettings || (!connectionSettings.settings.api_key)) {
    throw new Error('Resend not connected');
  }
  return {apiKey: connectionSettings.settings.api_key, fromEmail: connectionSettings.settings.from_email};
}

export async function getUncachableResendClient() {
  const credentials = await getCredentials();
  return {
    client: new Resend(credentials.apiKey),
    fromEmail: connectionSettings.settings.from_email
  };
}

export async function sendLocationEmail(toEmail: string, userName: string, address: string, locationCount: number, gpxContent?: string, sessionId?: string) {
  try {
    const { client, fromEmail } = await getUncachableResendClient();
    
    const emailData: any = {
      from: fromEmail,
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
            .info-box h2 { margin-top: 0; color: #16a34a; font-size: 18px; }
            .address { font-size: 16px; font-weight: 600; color: #1f2937; margin: 10px 0; }
            .stats { display: flex; gap: 20px; margin: 20px 0; }
            .stat { flex: 1; text-align: center; padding: 15px; background: white; border-radius: 8px; }
            .stat-value { font-size: 24px; font-weight: bold; color: #16a34a; }
            .stat-label { font-size: 12px; color: #6b7280; margin-top: 5px; }
            .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #6b7280; }
            .slogan { font-weight: 600; margin-top: 10px; }
            .slogan .voir { color: #dc2626; }
            .slogan .agir { color: #eab308; }
            .slogan .proteger { color: #22c55e; }
            .attachment-note { background: #dbeafe; border: 1px solid #3b82f6; padding: 15px; border-radius: 8px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🛡️ Burkina Watch</h1>
              <p style="margin: 10px 0 0 0; opacity: 0.9;">Votre Sécurité, Notre Priorité</p>
            </div>
            <div class="content">
              <p>Bonjour <strong>${userName}</strong>,</p>
              
              <div class="info-box">
                <h2>📍 Votre Position de Sécurité</h2>
                <p>Vous avez arrêté votre suivi de localisation en direct. Voici un résumé de votre session :</p>
                
                <div class="stats">
                  <div class="stat">
                    <div class="stat-value">${locationCount}</div>
                    <div class="stat-label">Points enregistrés</div>
                  </div>
                </div>
                
                <p><strong>Adresse approximative :</strong></p>
                <div class="address">${address}</div>
              </div>
              
              ${gpxContent ? `
              <div class="attachment-note">
                <p style="margin: 0; color: #1e40af;">
                  📎 <strong>Fichier de trajectoire joint</strong><br>
                  Vous trouverez en pièce jointe le fichier GPX contenant votre parcours complet. 
                  Vous pouvez l'ouvrir avec Google Maps, Google Earth ou toute autre application de cartographie.
                </p>
              </div>
              ` : ''}
              
              <p style="margin-top: 20px;">
                Cette information a été sauvegardée et peut être utilisée par les services d'urgence en cas de besoin.
              </p>
              
              <p style="margin-top: 20px;">
                Merci d'utiliser Burkina Watch pour votre sécurité.
              </p>
              
              <div class="footer">
                <p class="slogan">
                  <span class="voir">Voir.</span> 
                  <span class="agir">Agir.</span> 
                  <span class="proteger">Protéger.</span>
                </p>
                <p>© ${new Date().getFullYear()} Burkina Watch - Plateforme Nationale de Veille Citoyenne</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    // Ajouter le fichier GPX en pièce jointe si disponible
    if (gpxContent && sessionId) {
      emailData.attachments = [
        {
          filename: `burkina-watch-tracking-${sessionId}.gpx`,
          content: Buffer.from(gpxContent).toString('base64'),
        }
      ];
    }
    
    const result = await client.emails.send(emailData);
    
    console.log('✅ Email envoyé avec succès:', result);
    return result;
  } catch (error) {
    console.error('❌ Erreur lors de l\'envoi de l\'email:', error);
    throw error;
  }
}
