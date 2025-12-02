
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

4. **Ton style de communication** :
   - Français simple et accessible
   - Empathique et rassurant
   - Concis mais complet
   - Adapté au contexte burkinabé

Important : Si l'utilisateur est en danger immédiat, privilégie toujours la sécurité et recommande d'appeler les services d'urgence (17, 18, 112).`;

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
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
  messages: ChatMessage[]
): Promise<{ message: string; engine: "gemini" | "groq" | "unavailable" }> {
  // Try Gemini first (primary engine)
  if (geminiClient) {
    try {
      const model = geminiClient.getGenerativeModel({ 
        model: "gemini-2.0-flash",
        systemInstruction: SYSTEM_PROMPT
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
        { role: "system" as const, content: SYSTEM_PROMPT },
        ...messages.map(msg => ({
          role: msg.role as "user" | "assistant",
          content: msg.content,
        }))
      ];

      const completion = await groqClient.chat.completions.create({
        model: "llama3-70b-8192",
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
