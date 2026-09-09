
import { OpenAI } from "openai";

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  : null;

export interface ModerationResult {
  isApproved: boolean;
  severity: "safe" | "warning" | "blocked";
  flaggedWords: string[];
  suggestion?: string;
  reason?: string;
}

// Dictionnaire multilingue de mots sensibles
const SENSITIVE_WORDS = {
  fr: [
    // Violence
    "tuer", "assassiner", "brutaliser", "torturer", "massacrer",
    // Ethniques/discriminatoires
    "mossi", "peul", "dioula", "gourmantché", "fulani", "bobo", "sénoufo", "bissa", "lobi",
    // Religieux haineux
    "infidèle", "mécréant", "païen",
    // Sexistes/obscènes
    "pute", "salope", "con", "connard", "enculé", "merde",
    // Politiques extrêmes
    "révolution violente", "renverser", "coup d'état",
  ],
  moore: ["tũud", "kũum", "bãng"], // Exemples en mooré
  dioula: ["faga", "baliya"], // Exemples en dioula
};

async function analyzeWithAI(text: string, language: string = "fr"): Promise<ModerationResult> {
  if (!openai) {
    console.warn("⚠️ OPENAI_API_KEY non configurée, modération de base utilisée");
    return basicModeration(text);
  }

  try {
    const prompt = `Tu es un modérateur bienveillant pour une plateforme citoyenne au Burkina Faso.
Analyse ce texte et détermine s'il contient:
1. Des incitations à la violence
2. Des propos haineux (ethniques, religieux, sexistes)
3. Des insultes ou diffamations
4. Des menaces

Contexte: Le texte peut mentionner des groupes ethniques dans un contexte informatif/neutre (ex: "Les Mossi et les Peuls vivent en harmonie").
Ne bloque PAS si le contexte est neutre ou positif.

Texte à analyser: "${text}"

Réponds UNIQUEMENT en JSON:
{
  "isApproved": true/false,
  "severity": "safe" | "warning" | "blocked",
  "flaggedWords": ["mot1", "mot2"],
  "suggestion": "Reformulation suggérée si nécessaire",
  "reason": "Explication courte et bienveillante"
}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
      max_tokens: 300,
    });

    const result = JSON.parse(completion.choices[0].message.content || "{}");
    return {
      isApproved: result.isApproved ?? true,
      severity: result.severity || "safe",
      flaggedWords: result.flaggedWords || [],
      suggestion: result.suggestion,
      reason: result.reason,
    };
  } catch (error) {
    console.error("❌ Erreur analyse IA modération:", error);
    return basicModeration(text);
  }
}

function basicModeration(text: string): ModerationResult {
  const lowerText = text.toLowerCase();
  const flaggedWords: string[] = [];

  // Vérification basique avec dictionnaire - mots entiers uniquement
  for (const [lang, words] of Object.entries(SENSITIVE_WORDS)) {
    for (const word of words) {
      // Utiliser une regex avec limites de mots pour éviter les faux positifs
      // Par exemple, "con" ne matchera pas "concernant" ou "confiance"
      const wordRegex = new RegExp(`\\b${word.toLowerCase()}\\b`, 'i');
      if (wordRegex.test(lowerText)) {
        flaggedWords.push(word);
      }
    }
  }

  // Patterns de violence explicite
  const violentPatterns = [
    /mort\s+à/i,
    /il\s+faut\s+(tuer|éliminer|brutaliser)/i,
    /on\s+va\s+(les\s+)?(massacrer|détruire)/i,
  ];

  const hasViolentPattern = violentPatterns.some(pattern => pattern.test(text));

  if (hasViolentPattern) {
    return {
      isApproved: false,
      severity: "blocked",
      flaggedWords: ["violence explicite"],
      reason: "Incitation à la violence détectée",
    };
  }

  if (flaggedWords.length > 3) {
    return {
      isApproved: false,
      severity: "blocked",
      flaggedWords,
      reason: "Langage inapproprié détecté",
    };
  }

  if (flaggedWords.length > 0) {
    return {
      isApproved: false,
      severity: "warning",
      flaggedWords,
      suggestion: "Reformulez en utilisant un langage respectueux",
      reason: "Certains mots peuvent être perçus comme offensants",
    };
  }

  return {
    isApproved: true,
    severity: "safe",
    flaggedWords: [],
  };
}

export async function moderateContent(
  content: string,
  type: "signalement" | "commentaire" | "sos",
  language: string = "fr"
): Promise<ModerationResult> {
  // Pour les SOS, on est plus permissif (urgence)
  if (type === "sos") {
    const basicCheck = basicModeration(content);
    if (basicCheck.severity !== "blocked") {
      return { ...basicCheck, isApproved: true };
    }
  }

  return await analyzeWithAI(content, language);
}

export async function logModerationAction(
  userId: string,
  content: string,
  result: ModerationResult,
  type: string
) {
  // Log pour historique (sera stocké en base de données)
  console.log("📋 Modération:", {
    userId,
    type,
    severity: result.severity,
    approved: result.isApproved,
    flaggedWords: result.flaggedWords,
    timestamp: new Date().toISOString(),
  });
}
