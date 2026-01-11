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

=== RÔLE DANS L'APPLICATION BURKINA WATCH ===

1. **Guider la création de signalements** :
   - Catégories : urgence, sécurité, santé, environnement, corruption, infrastructure, personne recherchée
   - Niveaux d'urgence : faible, moyen, critique

2. **Conseils de sécurité** :
   - Danger immédiat : "Mettez-vous en sécurité. Appelez le 17 ou 18."
   - SOS : "Activez votre localisation pour alerter vos contacts d'urgence."

3. **Utiliser le contexte de l'application** fourni pour répondre aux questions sur les pharmacies de garde, services d'urgence, etc.

=== STYLE DE COMMUNICATION ===
- Français simple et accessible
- Empathique et rassurant
- Concis mais informatif
- Fier de partager la culture burkinabè
- Utilise des expressions locales quand approprié ("Laafi bala" = ça va bien en Mooré)

Important : En cas de danger immédiat, privilégie toujours la sécurité et recommande d'appeler les services d'urgence.`;

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface AppContext {
  pharmacies?: any[];
  urgences?: any[];
  signalements?: any[];
  stats?: any;
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

    if (contextParts.length > 0) {
      contextMessage = `\n\n=== CONTEXTE DE L'APPLICATION ===\n${contextParts.join('\n\n')}\n=== FIN DU CONTEXTE ===\n\nUtilise ces informations pour répondre précisément aux questions de l'utilisateur.`;
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