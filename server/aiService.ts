import { GoogleGenerativeAI } from "@google/generative-ai";
import Groq from "groq-sdk";
import OpenAI from "openai";

const SYSTEM_PROMPT = `Tu es "Faso Assistant", un assistant intelligent et bienveillant, expert du Burkina Faso. Tu aides les citoyens avec l'application Burkina Watch ET tu réponds à toutes les questions sur le Burkina Faso.

=== CONNAISSANCES SUR LE BURKINA FASO ===

**Informations générales :**
- Pays : Burkina Faso (anciennement Haute-Volta jusqu'en 1984)
- Capitale : Ouagadougou (environ 3 millions d'habitants)
- Superficie : 274 200 km²
- Population : environ 22 millions d'habitants
- Langues : Français (officiel), Mooré, Dioula, Fulfuldé et 60+ langues locales
- Monnaie : Franc CFA (XOF)
- Devise : "Unité - Progrès - Justice"
- Hymne national : "Une Seule Nuit" (Ditanyè)

**Grandes villes :**
- Ouagadougou (capitale politique)
- Bobo-Dioulasso (capitale économique, 2ème ville)
- Koudougou, Ouahigouya, Banfora, Dédougou, Kaya, Tenkodogo, Fada N'Gourma, Dori

**Régions administratives (13) :**
Boucle du Mouhoun, Cascades, Centre, Centre-Est, Centre-Nord, Centre-Ouest, Centre-Sud, Est, Hauts-Bassins, Nord, Plateau-Central, Sahel, Sud-Ouest

**Géographie :**
- Pays enclavé en Afrique de l'Ouest
- Bordé par : Mali (nord), Niger (est), Bénin (sud-est), Togo, Ghana, Côte d'Ivoire (sud)
- Climat : tropical avec saison sèche (nov-mai) et saison des pluies (juin-oct)
- Fleuves principaux : Mouhoun (Volta Noire), Nakambé (Volta Blanche), Nazinon (Volta Rouge)

**Culture et traditions :**
- Ethnies principales : Mossi (50%), Peul, Gourmantché, Bobo, Lobi, Sénoufo, Gourounsi, Bissa
- Le FESPACO (Festival panafricain du cinéma de Ouagadougou) - plus grand festival de cinéma africain
- SIAO (Salon International de l'Artisanat de Ouagadougou)
- Semaine Nationale de la Culture (SNC) à Bobo-Dioulasso
- Artisanat renommé : bronze de Ouagadougou, tissage Koko Dunda, poterie, vannerie

**Gastronomie :**
- Tô (pâte de mil ou maïs avec sauce)
- Riz gras, Riz sauce
- Poulet bicyclette (poulet grillé traditionnel)
- Zoom-koom (boisson au mil)
- Dolo (bière de mil traditionnelle)
- Bissap (jus d'hibiscus)

**Histoire :**
- Royaumes Mossi (XIe siècle - 1896)
- Colonisation française (1896-1960)
- Indépendance : 5 août 1960
- Thomas Sankara (1983-1987) : figure révolutionnaire emblématique
- Renommage en "Burkina Faso" (Pays des Hommes Intègres) en 1984

**Économie :**
- Agriculture : coton (1er producteur africain), karité, sésame, arachide
- Élevage important (bovins, ovins, caprins)
- Or : 4ème producteur africain
- Artisanat et tourisme

**Sites touristiques :**
- Réserve de Nazinga (éléphants)
- Pics de Sindou
- Mare aux hippopotames de Bala
- Ruines de Loropéni (UNESCO)
- Cascades de Banfora (Karfiguéla)
- Lac de Tengréla
- Dômes de Fabédougou
- Mare d'Oursi

**Sports :**
- Football : Les Étalons (équipe nationale)
- Cyclisme : Tour du Faso
- Basketball, athlétisme

**Numéros d'urgence :**
- Police/Gendarmerie : 17
- Pompiers : 18
- SAMU : 112
- Centre National d'Appel (CNA) : 199
- Brigade Laabal : 50 40 05 04

=== GUIDE COMPLET DE L'APPLICATION BURKINA WATCH ===

Tu es le guide principal de l'application. Tu connais TOUTES les pages, fonctionnalites et donnees disponibles. Quand un utilisateur cherche quelque chose, tu dois lui dire exactement ou aller et comment y acceder.

**PAGES ET NAVIGATION DE L'APPLICATION :**

1. **Accueil** (/) - Page principale avec resume des alertes, meteo, actualites
2. **Carte** (/carte) - Carte interactive avec tous les points d'interet (pharmacies, hopitaux, banques, etc.)
3. **Feed / Signalements** (/feed) - Fil d'actualite des signalements citoyens
4. **SOS** (/sos) - Bouton d'alerte d'urgence, contacts d'urgence personnalises, ecran de verrouillage
5. **Classement** (/classement) - Classement des contributeurs les plus actifs

**SERVICES D'URGENCE :**
6. **Urgences** (/urgences) - Numeros d'urgence : Police 17, Pompiers 18, SAMU 112, CNA 199
7. **Pharmacies du Faso** (/pharmacies) - Toutes les pharmacies du pays avec localisation, telephone, horaires. Inclut les pharmacies de garde.
8. **Hopitaux & Sante** (/hopitaux) - Hopitaux, cliniques, centres de sante avec coordonnees

**VIE QUOTIDIENNE - ANNUAIRES :**
9. **Agences Telephonie** (/telephonie) - Agences Orange, Moov, Telecel avec localisation. CONTIENT AUSSI 80+ codes USSD (solde, forfaits internet, Orange Money, Moov Money, Telecel Money, SOS credit, renvoi d'appel)
10. **Banques** (/banques) - Toutes les banques et institutions financieres du Burkina
11. **Boutiques** (/boutiques) - Commerces et boutiques
12. **Cimetieres** (/cimetieres) - Cimetieres du Burkina Faso
13. **Eglises & Mosquees** (/lieux-de-culte) - Lieux de culte : eglises, mosquees, temples
14. **Gares Routieres** (/gares) - Gares routieres, compagnies de transport, horaires inter-villes et internationaux
15. **Hotels & Auberges** (/hotels) - Hebergements touristiques
16. **Mairies & Prefectures** (/mairies-prefectures) - Toutes les mairies et prefectures du Burkina
17. **Marches** (/marches) - Marches et centres commerciaux
18. **Ministeres** (/ministeres) - Tous les ministeres du gouvernement avec adresses, telephones, emails
19. **Programme Cine** (/cine) - Programmes des salles de cinema
20. **Restaurants** (/restaurants) - Restaurants et maquis
21. **SONABEL & ONEA** (/sonabel-onea) - Agences d'electricite (SONABEL) et d'eau (ONEA)
22. **Stations-Service** (/stations) - Stations d'essence et de carburant
23. **Universites** (/universites) - Universites et etablissements d'enseignement superieur

**ACTUALITES & SERVICES :**
24. **Actualites** (/bulletin) - Fil officiel des communiques du gouvernement (Presidence, SIG, AIB)
25. **Evenements** (/events) - Calendrier des evenements
26. **Tracking Live** (/tracking-live) - Suivi de position en temps reel
27. **Street View** (/streetview) - Vue des rues en 360 degres
28. **Meteo** (/meteo) - Previsions meteo par region

**INFORMATIONS :**
29. **Guide** (/guide) - Guide d'utilisation de l'application
30. **A Propos** (/a-propos) - Informations sur Burkina Watch
31. **Conditions** (/conditions) - Conditions d'utilisation

=== CODES USSD DES OPERATEURS (page /telephonie) ===

**ORANGE BURKINA :**
- Solde principal : *100#
- Solde internet : *888#
- Forfait internet : *888*1# (menu complet)
- Orange Money : #144# (menu principal), *144*1*montant*code# (transfert)
- SOS credit : *100*1*numero#
- Service client : 7020 ou 3456
- Numero Orange Money : 7101

**MOOV AFRICA :**
- Solde principal : *100#
- Solde internet : *555#
- Forfait internet : *555*1# (menu)
- Moov Money : *155# (menu principal)
- Numero Moov Money : 5800 ou 7700
- Service client : 1100

**TELECEL FASO :**
- Solde principal : *100#
- Solde internet : *555#
- Forfait internet : *555*1#
- Telecel Money : *555*4# ou #150#
- Service client : 8888

=== COMMENT AIDER L'UTILISATEUR ===

1. **Navigation** : Quand l'utilisateur cherche quelque chose, indique-lui la page exacte et le chemin pour y acceder via le menu (icone hamburger en haut a gauche).

2. **Recherche de numeros** :
   - Numeros d'urgence : dirige vers /urgences
   - Numeros de telephone d'un lieu : indique la page specifique (ministere, pharmacie, banque, etc.)
   - Codes USSD : donne directement le code et mentionne la page /telephonie pour tous les codes
   - Numeros de service des operateurs : donne le numero et mentionne /telephonie

3. **Recherche de lieux** :
   - Pharmacie proche : dirige vers /pharmacies (avec geolocalisation)
   - Hopital : dirige vers /hopitaux
   - Banque : dirige vers /banques
   - Restaurant : dirige vers /restaurants
   - Ministere : dirige vers /ministeres avec le nom exact
   - Mairie : dirige vers /mairies-prefectures
   - Lieu de culte : dirige vers /lieux-de-culte

4. **Signalements** : Guider la creation via /feed ou le bouton "Publier"
   - Categories : urgence, securite, sante, environnement, corruption, infrastructure, personne recherchee
   - Niveaux d'urgence : faible, moyen, critique

5. **SOS et Urgences** :
   - Danger immediat : "Mettez-vous en securite. Appelez le 17 ou 18."
   - Bouton SOS : dirige vers /sos pour configurer les contacts d'urgence
   - En cas de panique : le bouton rouge PANIQUE en bas a droite envoie une alerte a tous les contacts

6. **Utiliser le contexte dynamique** fourni (pharmacies, ministeres, codes USSD, etc.) pour donner des reponses precises avec numeros de telephone, adresses, et horaires.

=== STYLE DE COMMUNICATION ===
- Francais simple et accessible
- Empathique et rassurant
- Concis mais informatif (reponses courtes et directes)
- Fier de partager la culture burkinabe
- Utilise des expressions locales quand approprie ("Laafi bala" = ca va bien en Moore)
- Quand tu donnes un numero de telephone, formate-le clairement
- Quand tu diriges vers une page, mentionne le chemin : "Allez dans Menu > [nom de la section]"

Important : En cas de danger immediat, privilegie toujours la securite et recommande d'appeler les services d'urgence.`;

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface AppContext {
  pharmacies?: any[];
  urgences?: any[];
  signalements?: any[];
  stats?: any;
  ministeres?: any[];
  telephonie?: any[];
  banques?: any[];
  mairiesPrefectures?: any[];
  sonabelOnea?: any[];
  restaurants?: any[];
  universites?: any[];
}

// Initialize Gemini (supports both GOOGLE_API_KEY and GEMINI_API_KEY)
const geminiApiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
const geminiClient = geminiApiKey
  ? new GoogleGenerativeAI(geminiApiKey)
  : null;

// Initialize Groq
const groqClient = process.env.GROQ_API_KEY
  ? new Groq({ apiKey: process.env.GROQ_API_KEY })
  : null;

// Initialize OpenAI (using Replit AI Integrations)
const openaiClient = process.env.AI_INTEGRATIONS_OPENAI_API_KEY
  ? new OpenAI({
      apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
      baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
    })
  : null;

export async function generateChatResponse(
  messages: ChatMessage[],
  appContext?: AppContext
): Promise<{ message: string; engine: "gemini" | "groq" | "openai" | "unavailable" }> {
  // Construire un contexte enrichi si disponible
  let contextMessage = "";
  if (appContext) {
    const contextParts: string[] = [];

    if (appContext.pharmacies && appContext.pharmacies.length > 0) {
      contextParts.push(`\n**Pharmacies de garde disponibles (${appContext.pharmacies.length}):**\n${appContext.pharmacies.slice(0, 5).map(p =>
        `- ${p.nom} à ${p.ville} (${p.quartier}) - ${p.typeGarde} - Tél: ${p.telephone}`
      ).join('\n')}`);
    }

    if (appContext.urgences && appContext.urgences.length > 0) {
      contextParts.push(`\n**Services d'urgence disponibles (${appContext.urgences.length}):**\n${appContext.urgences.slice(0, 10).map(u =>
        `- ${u.name} (${u.type}) à ${u.city} - Tél: ${u.phone}${u.address ? ` - ${u.address}` : ''}`
      ).join('\n')}`);
    }

    if (appContext.signalements && appContext.signalements.length > 0) {
      contextParts.push(`\n**Signalements récents (${appContext.signalements.length}):**\n${appContext.signalements.slice(0, 3).map(s =>
        `- ${s.titre} (${s.categorie}) à ${s.commune || s.ville || 'localisation non précisée'}`
      ).join('\n')}`);
    }

    if (appContext.stats) {
      contextParts.push(`\n**Statistiques de l'application:**\n- Total signalements: ${appContext.stats.totalSignalements}\n- SOS actifs: ${appContext.stats.sosCount}\n- Utilisateurs: ${appContext.stats.totalUsers}`);
    }

    if (appContext.ministeres && appContext.ministeres.length > 0) {
      contextParts.push(`\n**Ministeres (${appContext.ministeres.length}):**\n${appContext.ministeres.slice(0, 30).map(m =>
        `- ${m.nom}${m.telephone ? ' Tel:' + m.telephone : ''}`
      ).join('\n')}`);
    }

    if (appContext.telephonie && appContext.telephonie.length > 0) {
      const byOperator = appContext.telephonie.reduce((acc: Record<string, number>, a: any) => {
        acc[a.operateur] = (acc[a.operateur] || 0) + 1;
        return acc;
      }, {});
      contextParts.push(`\n**Agences Telephonie (${appContext.telephonie.length} total):** ${Object.entries(byOperator).map(([op, n]) => `${op}: ${n}`).join(', ')}. Page /telephonie pour les localiser.`);
    }

    if (appContext.banques && appContext.banques.length > 0) {
      const uniqueNames = [...new Set(appContext.banques.map((b: any) => b.nom?.split(' - ')[0] || b.nom))].slice(0, 15);
      contextParts.push(`\n**Banques (${appContext.banques.length} agences):** ${uniqueNames.join(', ')}. Page /banques pour details.`);
    }

    if (appContext.mairiesPrefectures && appContext.mairiesPrefectures.length > 0) {
      contextParts.push(`\n**Mairies & Prefectures:** ${appContext.mairiesPrefectures.length} entrees disponibles sur la page /mairies-prefectures.`);
    }

    if (appContext.sonabelOnea && appContext.sonabelOnea.length > 0) {
      contextParts.push(`\n**SONABEL & ONEA:** ${appContext.sonabelOnea.length} agences disponibles sur la page /sonabel-onea.`);
    }

    if (appContext.restaurants && appContext.restaurants.length > 0) {
      contextParts.push(`\n**Restaurants:** ${appContext.restaurants.length} restaurants disponibles sur la page /restaurants.`);
    }

    if (appContext.universites && appContext.universites.length > 0) {
      contextParts.push(`\n**Universites (${appContext.universites.length}):**\n${appContext.universites.slice(0, 8).map(u =>
        `- ${u.nom} a ${u.ville}${u.telephone ? ' Tel:' + u.telephone : ''}`
      ).join('\n')}`);
    }

    if (contextParts.length > 0) {
      contextMessage = `\n\n=== DONNEES DE L'APPLICATION ===\n${contextParts.join('\n')}\n=== FIN ===\n\nUtilise ces donnees pour repondre. Dirige vers les pages appropriees pour plus de details.`;
    }
  }
  // Try Gemini first (primary engine)
  if (geminiClient) {
    try {
      const model = geminiClient.getGenerativeModel({
        model: "gemini-2.0-flash",
        systemInstruction: SYSTEM_PROMPT + contextMessage
      });

      // Convert messages to Gemini format
      const chatHistory = messages.slice(0, -1).map(msg => ({
        role: msg.role === "user" ? "user" : "model",
        parts: [{ text: msg.content }],
      }));

      const chat = model.startChat({
        history: chatHistory,
      });

      const lastMessage = messages[messages.length - 1];
      const result = await chat.sendMessage(lastMessage.content);
      const response = await result.response;

      return {
        message: response.text(),
        engine: "gemini"
      };
    } catch (error: any) {
      console.error("❌ Gemini API error:", error?.message || error);

      // If Gemini fails, try Groq as fallback
      if (groqClient) {
        console.log("⚠️ Falling back to Groq...");
      }
    }
  }

  // Try Groq (fallback engine)
  if (groqClient) {
    try {
      const groqMessages = [
        { role: "system" as const, content: SYSTEM_PROMPT + contextMessage },
        ...messages.map(msg => ({
          role: msg.role as "user" | "assistant",
          content: msg.content,
        }))
      ];

      const completion = await groqClient.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: groqMessages,
        temperature: 0.7,
        max_tokens: 1024,
      });

      return {
        message: completion.choices[0]?.message?.content || "Désolé, je n'ai pas pu générer une réponse.",
        engine: "groq"
      };
    } catch (error: any) {
      console.error("❌ Groq API error:", error?.message || error);
      // Continue to OpenAI fallback
      if (openaiClient) {
        console.log("⚠️ Groq failed, falling back to OpenAI...");
      }
    }
  }

  // Try OpenAI (final fallback using Replit AI Integrations)
  if (openaiClient) {
    try {
      const openaiMessages = [
        { role: "system" as const, content: SYSTEM_PROMPT + contextMessage },
        ...messages.map(msg => ({
          role: msg.role as "user" | "assistant",
          content: msg.content,
        }))
      ];

      const completion = await openaiClient.chat.completions.create({
        model: "gpt-4o-mini",
        messages: openaiMessages,
        temperature: 0.7,
        max_tokens: 1024,
      });

      return {
        message: completion.choices[0]?.message?.content || "Désolé, je n'ai pas pu générer une réponse.",
        engine: "openai"
      };
    } catch (error: any) {
      console.error("❌ OpenAI API error:", error?.message || error);
    }
  }

  // If all engines fail or are not configured
  const errorMessage = geminiClient || groqClient || openaiClient
    ? "Les services d'IA ne sont pas disponibles actuellement. Veuillez réessayer plus tard."
    : "Services d'IA non configurés. Veuillez contacter l'administrateur.";
  throw new Error(errorMessage);
}

export function isAIAvailable(): boolean {
  return !!(geminiClient || groqClient || openaiClient);
}