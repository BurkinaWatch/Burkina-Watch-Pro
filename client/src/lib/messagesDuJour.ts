/**
 * Collection de messages d'encouragement, proverbes et conseils du jour
 * pour la plateforme Burkina Watch
 */

export interface MessageDuJour {
  texte: string;
  auteur?: string;
  type: 'proverbe' | 'conseil' | 'encouragement';
}

export const messagesDuJour: MessageDuJour[] = [
  {
    texte: "L'union fait la force. Ensemble, nous bâtissons un Burkina Faso meilleur.",
    type: 'encouragement'
  },
  {
    texte: "Un seul doigt ne peut ramasser la farine.",
    auteur: "Proverbe burkinabé",
    type: 'proverbe'
  },
  {
    texte: "Signalez les problèmes de votre quartier, vous contribuez au bien-être de tous.",
    type: 'conseil'
  },
  {
    texte: "La vigilance citoyenne est le premier pas vers le changement.",
    type: 'encouragement'
  },
  {
    texte: "Si tu ne sais pas où tu vas, regarde d'où tu viens.",
    auteur: "Proverbe africain",
    type: 'proverbe'
  },
  {
    texte: "Votre voix compte. Chaque signalement aide à améliorer notre communauté.",
    type: 'conseil'
  },
  {
    texte: "Quand les termites se rassemblent, elles peuvent soulever un éléphant.",
    auteur: "Proverbe burkinabé",
    type: 'proverbe'
  },
  {
    texte: "La sécurité de notre nation commence par la vigilance de chaque citoyen.",
    type: 'encouragement'
  },
  {
    texte: "N'hésitez pas à utiliser la fonction SOS en cas d'urgence réelle.",
    type: 'conseil'
  },
  {
    texte: "Un village propre est le reflet de ses habitants engagés.",
    type: 'encouragement'
  },
  {
    texte: "L'eau chaude n'oublie pas qu'elle a été froide.",
    auteur: "Proverbe africain",
    type: 'proverbe'
  },
  {
    texte: "Ajoutez des photos à vos signalements pour une action plus rapide.",
    type: 'conseil'
  },
  {
    texte: "Ce que tu fais pour ta communauté aujourd'hui, elle le fera pour toi demain.",
    type: 'encouragement'
  },
  {
    texte: "Si tu veux aller vite, marche seul. Si tu veux aller loin, marchons ensemble.",
    auteur: "Proverbe africain",
    type: 'proverbe'
  },
  {
    texte: "Vérifiez régulièrement les signalements de votre zone pour rester informé.",
    type: 'conseil'
  },
  {
    texte: "Chaque signalement est une pierre pour construire un Burkina Faso plus sûr.",
    type: 'encouragement'
  },
  {
    texte: "La bouche qui mange ne parle pas, mais l'œil qui voit ne dort pas.",
    auteur: "Proverbe burkinabé",
    type: 'proverbe'
  },
  {
    texte: "Utilisez la carte interactive pour visualiser les problèmes de votre région.",
    type: 'conseil'
  },
  {
    texte: "Voir, agir, protéger : ensemble pour un avenir meilleur.",
    type: 'encouragement'
  },
  {
    texte: "Même le plus long voyage commence par un premier pas.",
    auteur: "Proverbe africain",
    type: 'proverbe'
  },
  {
    texte: "Précisez toujours le niveau d'urgence de vos signalements.",
    type: 'conseil'
  },
  {
    texte: "Votre engagement civique inspire les autres à agir.",
    type: 'encouragement'
  },
  {
    texte: "Celui qui cherche trouve, celui qui demande reçoit.",
    auteur: "Proverbe burkinabé",
    type: 'proverbe'
  },
  {
    texte: "Commentez et soutenez les signalements importants de votre communauté.",
    type: 'conseil'
  },
  {
    texte: "Ensemble, nous sommes plus forts. Votre voix compte.",
    type: 'encouragement'
  },
  {
    texte: "Un arbre ne fait pas une forêt.",
    auteur: "Proverbe africain",
    type: 'proverbe'
  },
  {
    texte: "Signalez les infrastructures défectueuses pour prévenir les accidents.",
    type: 'conseil'
  },
  {
    texte: "La transparence et la vigilance sont les piliers de notre démocratie.",
    type: 'encouragement'
  },
  {
    texte: "On ne peut pas empêcher les oiseaux de voler au-dessus de sa tête, mais on peut les empêcher d'y faire leur nid.",
    auteur: "Proverbe burkinabé",
    type: 'proverbe'
  },
  {
    texte: "Restez anonyme si nécessaire, votre sécurité est notre priorité.",
    type: 'conseil'
  }
];

/**
 * Retourne le message du jour basé sur la date actuelle
 * Le message change automatiquement chaque jour à minuit
 * @param offset - Offset pour changer le message (utilisé pour le rafraîchissement)
 */
export function getMessageDuJour(offset: number = 0): MessageDuJour {
  const aujourdHui = new Date();
  const debutAnnee = new Date(aujourdHui.getFullYear(), 0, 0);
  const diff = aujourdHui.getTime() - debutAnnee.getTime();
  const jourDeLAnnee = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  const index = (jourDeLAnnee + offset) % messagesDuJour.length;
  
  return messagesDuJour[index];
}
