import { db } from '../server/db';
import { 
  signalementLikes, 
  panicAlerts, 
  emergencyContacts, 
  locationPoints,
  trackingSessions,
  onlineSessions,
  otpCodes, 
  sessions, 
  commentaires,
  notifications,
  signalements, 
  users 
} from '../shared/schema';

async function resetData() {
  console.log('🧹 Réinitialisation des données...\n');
  
  try {
    console.log('Suppression des likes...');
    await db.delete(signalementLikes);
    
    console.log('Suppression des alertes panic...');
    await db.delete(panicAlerts);
    
    console.log('Suppression des contacts d\'urgence...');
    await db.delete(emergencyContacts);
    
    console.log('Suppression des points de localisation...');
    await db.delete(locationPoints);
    
    console.log('Suppression des sessions de tracking...');
    await db.delete(trackingSessions);
    
    console.log('Suppression des sessions en ligne...');
    await db.delete(onlineSessions);
    
    console.log('Suppression des codes OTP...');
    await db.delete(otpCodes);
    
    console.log('Suppression des sessions...');
    await db.delete(sessions);
    
    console.log('Suppression des commentaires...');
    await db.delete(commentaires);
    
    console.log('Suppression des notifications...');
    await db.delete(notifications);
    
    console.log('Suppression des signalements...');
    await db.delete(signalements);
    
    console.log('Suppression des utilisateurs...');
    await db.delete(users);
    
    console.log('\n✅ Toutes les données utilisateur ont été supprimées!');
    console.log('📊 Les statistiques sont maintenant à zéro.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

resetData();
