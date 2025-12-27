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
  // Proverbes burkinabe
  {
    texte: "Un seul doigt ne peut ramasser la farine.",
    auteur: "Proverbe burkinabe",
    type: 'proverbe'
  },
  {
    texte: "Quand les termites se rassemblent, elles peuvent soulever un elephant.",
    auteur: "Proverbe burkinabe",
    type: 'proverbe'
  },
  {
    texte: "La bouche qui mange ne parle pas, mais l'oeil qui voit ne dort pas.",
    auteur: "Proverbe burkinabe",
    type: 'proverbe'
  },
  {
    texte: "Celui qui cherche trouve, celui qui demande recoit.",
    auteur: "Proverbe burkinabe",
    type: 'proverbe'
  },
  {
    texte: "On ne peut pas empecher les oiseaux de voler au-dessus de sa tete, mais on peut les empecher d'y faire leur nid.",
    auteur: "Proverbe burkinabe",
    type: 'proverbe'
  },
  {
    texte: "Le mensonge donne des fleurs mais pas de fruits.",
    auteur: "Proverbe burkinabe",
    type: 'proverbe'
  },
  {
    texte: "L'arbre qui pousse dans un lieu balaye par le vent a des racines solides.",
    auteur: "Proverbe burkinabe",
    type: 'proverbe'
  },
  {
    texte: "La force du baobab est dans ses racines.",
    auteur: "Proverbe burkinabe",
    type: 'proverbe'
  },
  {
    texte: "Celui qui a ete mordu par un serpent craint meme le ver de terre.",
    auteur: "Proverbe burkinabe",
    type: 'proverbe'
  },
  {
    texte: "Le feu qui te brulera, c'est celui que tu allumes.",
    auteur: "Proverbe burkinabe",
    type: 'proverbe'
  },
  {
    texte: "Quand on suit l'elephant, on ne se mouille pas dans la rosee.",
    auteur: "Proverbe burkinabe",
    type: 'proverbe'
  },
  {
    texte: "L'eau qui coule ne retourne jamais a sa source.",
    auteur: "Proverbe burkinabe",
    type: 'proverbe'
  },
  {
    texte: "Le margouillat qui tombe de l'arbre hoche la tete pour s'applaudir.",
    auteur: "Proverbe burkinabe",
    type: 'proverbe'
  },
  {
    texte: "La calebasse ne flotte pas avec la pierre.",
    auteur: "Proverbe burkinabe",
    type: 'proverbe'
  },
  {
    texte: "Le soleil n'ignore aucun village.",
    auteur: "Proverbe burkinabe",
    type: 'proverbe'
  },

  // Proverbes africains
  {
    texte: "Si tu ne sais pas ou tu vas, regarde d'ou tu viens.",
    auteur: "Proverbe africain",
    type: 'proverbe'
  },
  {
    texte: "L'eau chaude n'oublie pas qu'elle a ete froide.",
    auteur: "Proverbe africain",
    type: 'proverbe'
  },
  {
    texte: "Si tu veux aller vite, marche seul. Si tu veux aller loin, marchons ensemble.",
    auteur: "Proverbe africain",
    type: 'proverbe'
  },
  {
    texte: "Meme le plus long voyage commence par un premier pas.",
    auteur: "Proverbe africain",
    type: 'proverbe'
  },
  {
    texte: "Un arbre ne fait pas une foret.",
    auteur: "Proverbe africain",
    type: 'proverbe'
  },
  {
    texte: "Seul on va plus vite, ensemble on va plus loin.",
    auteur: "Proverbe africain",
    type: 'proverbe'
  },
  {
    texte: "L'enfant qui ne sort pas de la maison croit que seule sa mere sait cuisiner.",
    auteur: "Proverbe africain",
    type: 'proverbe'
  },
  {
    texte: "La patience est un arbre dont les racines sont ameres mais dont les fruits sont tres doux.",
    auteur: "Proverbe africain",
    type: 'proverbe'
  },
  {
    texte: "Quand tu ne sais pas ou tu vas, retourne-toi pour savoir d'ou tu viens.",
    auteur: "Proverbe africain",
    type: 'proverbe'
  },
  {
    texte: "Le vieux qui est assis voit plus loin que le jeune qui est debout.",
    auteur: "Proverbe africain",
    type: 'proverbe'
  },
  {
    texte: "L'oiseau fait son nid brin apres brin.",
    auteur: "Proverbe africain",
    type: 'proverbe'
  },
  {
    texte: "La parole qui sort de ta bouche, tu ne peux plus la rattraper.",
    auteur: "Proverbe africain",
    type: 'proverbe'
  },
  {
    texte: "C'est celui qui n'a pas traverse le fleuve qui dit que le crocodile a une bosse sur le front.",
    auteur: "Proverbe africain",
    type: 'proverbe'
  },
  {
    texte: "Un vieillard qui meurt, c'est une bibliotheque qui brule.",
    auteur: "Proverbe africain",
    type: 'proverbe'
  },
  {
    texte: "Quand on tire un cheveu de la farine, il sort toujours blanc.",
    auteur: "Proverbe africain",
    type: 'proverbe'
  },

  // Encouragements
  {
    texte: "L'union fait la force. Ensemble, nous batissons un Burkina Faso meilleur.",
    type: 'encouragement'
  },
  {
    texte: "La vigilance citoyenne est le premier pas vers le changement.",
    type: 'encouragement'
  },
  {
    texte: "La securite de notre nation commence par la vigilance de chaque citoyen.",
    type: 'encouragement'
  },
  {
    texte: "Un village propre est le reflet de ses habitants engages.",
    type: 'encouragement'
  },
  {
    texte: "Ce que tu fais pour ta communaute aujourd'hui, elle le fera pour toi demain.",
    type: 'encouragement'
  },
  {
    texte: "Chaque signalement est une pierre pour construire un Burkina Faso plus sur.",
    type: 'encouragement'
  },
  {
    texte: "Voir, agir, proteger : ensemble pour un avenir meilleur.",
    type: 'encouragement'
  },
  {
    texte: "Votre engagement civique inspire les autres a agir.",
    type: 'encouragement'
  },
  {
    texte: "Ensemble, nous sommes plus forts. Votre voix compte.",
    type: 'encouragement'
  },
  {
    texte: "La transparence et la vigilance sont les piliers de notre democratie.",
    type: 'encouragement'
  },
  {
    texte: "Chaque action compte, chaque citoyen compte.",
    type: 'encouragement'
  },
  {
    texte: "Votre contribution renforce le tissu social de notre nation.",
    type: 'encouragement'
  },
  {
    texte: "Les petits gestes d'aujourd'hui construisent le grand Burkina de demain.",
    type: 'encouragement'
  },
  {
    texte: "La solidarite est notre plus grande richesse.",
    type: 'encouragement'
  },
  {
    texte: "Soyez le changement que vous voulez voir dans votre communaute.",
    type: 'encouragement'
  },
  {
    texte: "Chaque voix compte dans la construction de notre avenir commun.",
    type: 'encouragement'
  },
  {
    texte: "L'engagement citoyen est la force de notre nation.",
    type: 'encouragement'
  },
  {
    texte: "Ensemble, rendons notre pays plus sur pour nos enfants.",
    type: 'encouragement'
  },
  {
    texte: "Votre vigilance protege des vies.",
    type: 'encouragement'
  },
  {
    texte: "Chaque signalement est un acte de courage civique.",
    type: 'encouragement'
  },

  // Conseils
  {
    texte: "Signalez les problemes de votre quartier, vous contribuez au bien-etre de tous.",
    type: 'conseil'
  },
  {
    texte: "Votre voix compte. Chaque signalement aide a ameliorer notre communaute.",
    type: 'conseil'
  },
  {
    texte: "N'hesitez pas a utiliser la fonction SOS en cas d'urgence reelle.",
    type: 'conseil'
  },
  {
    texte: "Ajoutez des photos a vos signalements pour une action plus rapide.",
    type: 'conseil'
  },
  {
    texte: "Verifiez regulierement les signalements de votre zone pour rester informe.",
    type: 'conseil'
  },
  {
    texte: "Utilisez la carte interactive pour visualiser les problemes de votre region.",
    type: 'conseil'
  },
  {
    texte: "Precisez toujours le niveau d'urgence de vos signalements.",
    type: 'conseil'
  },
  {
    texte: "Commentez et soutenez les signalements importants de votre communaute.",
    type: 'conseil'
  },
  {
    texte: "Signalez les infrastructures defectueuses pour prevenir les accidents.",
    type: 'conseil'
  },
  {
    texte: "Restez anonyme si necessaire, votre securite est notre priorite.",
    type: 'conseil'
  },
  {
    texte: "Partagez les signalements importants avec vos proches.",
    type: 'conseil'
  },
  {
    texte: "Activez les notifications pour etre alerte des urgences dans votre zone.",
    type: 'conseil'
  },
  {
    texte: "Consultez le Bulletin Citoyen pour rester informe de l'actualite.",
    type: 'conseil'
  },
  {
    texte: "Ajoutez vos contacts d'urgence dans votre profil pour une alerte rapide.",
    type: 'conseil'
  },
  {
    texte: "Explorez les pharmacies de garde pour connaitre celles qui sont ouvertes.",
    type: 'conseil'
  },
  {
    texte: "Utilisez l'agenda culturel pour decouvrir les evenements pres de chez vous.",
    type: 'conseil'
  },
  {
    texte: "Creez des tours virtuels pour partager les beaux endroits de votre ville.",
    type: 'conseil'
  },
  {
    texte: "Gardez l'application a jour pour beneficier des dernieres fonctionnalites.",
    type: 'conseil'
  },
  {
    texte: "Invitez vos amis a rejoindre Burkina Watch pour une meilleure couverture.",
    type: 'conseil'
  },
  {
    texte: "Consultez les numeros d'urgence pour savoir qui contacter en cas de besoin.",
    type: 'conseil'
  }
];

/**
 * Retourne un message aleatoire de la collection
 * @param seed - Graine pour la selection (utilisee pour le rafraichissement)
 */
export function getMessageDuJour(seed: number = 0): MessageDuJour {
  const index = Math.abs(seed) % messagesDuJour.length;
  return messagesDuJour[index];
}

/**
 * Retourne un message aleatoire different a chaque appel
 */
export function getRandomMessage(): MessageDuJour {
  const randomIndex = Math.floor(Math.random() * messagesDuJour.length);
  return messagesDuJour[randomIndex];
}
