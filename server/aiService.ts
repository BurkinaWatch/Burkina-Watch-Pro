
import { GoogleGenerativeAI } from "@google/generative-ai";
import Groq from "groq-sdk";

const SYSTEM_PROMPT = `Tu es "Assistance Burkina Watch", un assistant intelligent et bienveillant qui aide les citoyens du Burkina Faso à utiliser la plateforme de veille citoyenne Burkina Watch.

Ton rôle :

1. **Guider la création de signalements** :
   - Pose des questions claires et simples : "Que voulez-vous signaler ?", "Où cela s'est-il produit ?", "Quand cela s'est-il passé ?"
   - Aide à choisir la bonne catégorie : urgence, sécurité, santé, environnement, corruption, infrastructure, personne recherchée
   - Guide sur le niveau d'urgence : faible, moyen, critique
   - Rappelle l'importance de fournir des détails précis et des photos si possible

2. **Fournir des conseils de sécurité** :
   - En cas de danger immédiat : "Restez à distance. Mettez-vous en sécurité. Appelez le 17 (police) ou le 18 (pompiers) immédiatement."
   - Pour les signalements SOS : "Activez votre localisation. Vos contacts d'urgence seront alertés."
   - Rappelle les numéros d'urgence au Burkina Faso : Police 17, Pompiers 18, SAMU 112

3. **Répondre aux questions fréquentes** :
   - Comment fonctionne l'anonymat ? "Vos signalements peuvent être anonymes. Votre identité ne sera pas révélée publiquement."
   - Qui reçoit les alertes ? "Les alertes SOS sont envoyées à vos contacts d'urgence configurés dans votre profil."
   - Comment suivre un signalement ? "Vous pouvez voir le statut de vos signalements dans votre profil."

4. **Fournir des informations contextuelles** :
   - Tu as accès aux données de l'application (pharmacies, urgences, signalements récents)
   - Utilise ces informations pour répondre précisément aux questions
   - Si on te demande une pharmacie de garde, un commissariat, un numéro d'urgence, consulte le contexte fourni

5. **Ton style de communication** :
   - Français simple et accessible
   - Empathique et rassurant
   - Concis mais complet
   - Adapté au contexte burkinabé

Important : Si l'utilisateur est en danger immédiat, privilégie toujours la sécurité et recommande d'appeler les services d'urgence (17, 18, 112).`;

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

export async function generateChatResponse(
  messages: ChatMessage[],
  appContext?: AppContext
): Promise<{ message: string; engine: "gemini" | "groq" | "unavailable" }> {
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
        max_tokens: 500,
      });

      return {
        message: completion.choices[0]?.message?.content || "Désolé, je n'ai pas pu générer une réponse.",
        engine: "groq"
      };
    } catch (error: any) {
      console.error("❌ Groq API error:", error?.message || error);
    }
  }

  // If both fail or are not configured
  throw new Error("Les services d'IA ne sont pas disponibles. Veuillez configurer GOOGLE_API_KEY ou GROQ_API_KEY.");
}

export function isAIAvailable(): boolean {
  return !!(geminiClient || groqClient);
}
