
import { OpenAI } from "openai";
import { storage } from "./storage";
import type { Signalement } from "@shared/schema";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
});

interface VerificationResult {
  score: number;
  status: "verified" | "unverified" | "suspicious";
  reasons: string[];
}

// Calculer la distance entre deux points GPS (formule Haversine)
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Rayon de la Terre en km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Vérifier les doublons géographiques et temporels
async function checkForDuplicates(
  signalement: Partial<Signalement>
): Promise<{ isDuplicate: boolean; similarSignalements: any[] }> {
  const recentSignalements = await storage.getSignalements({
    categorie: signalement.categorie,
    limit: 50,
  });

  const similarSignalements = [];
  const currentLat = parseFloat(signalement.latitude as string);
  const currentLon = parseFloat(signalement.longitude as string);
  const currentTime = new Date();

  for (const sig of recentSignalements) {
    if (sig.id === signalement.id) continue;

    const sigLat = parseFloat(sig.latitude);
    const sigLon = parseFloat(sig.longitude);
    const distance = calculateDistance(currentLat, currentLon, sigLat, sigLon);
    const timeDiff =
      Math.abs(currentTime.getTime() - new Date(sig.createdAt).getTime()) /
      (1000 * 60 * 60); // en heures

    // Doublon si même catégorie, < 500m de distance, et < 24h d'écart
    if (distance < 0.5 && timeDiff < 24) {
      similarSignalements.push({
        id: sig.id,
        titre: sig.titre,
        distance,
        timeDiff,
      });
    }
  }

  return {
    isDuplicate: similarSignalements.length > 0,
    similarSignalements,
  };
}

// Analyser le texte avec GPT
async function analyzeTextCoherence(
  titre: string,
  description: string
): Promise<{ score: number; analysis: string }> {
  if (!process.env.OPENAI_API_KEY) {
    console.warn("⚠️ OPENAI_API_KEY non configurée, analyse de texte ignorée");
    return { score: 70, analysis: "Analyse non disponible (clé API manquante)" };
  }

  try {
    const prompt = `Analyse ce signalement citoyen pour Burkina Faso et évalue sa fiabilité (0-100):

Titre: ${titre}
Description: ${description}

Évalue:
1. Cohérence du texte
2. Clarté et précision des informations
3. Détection de spam ou contenu inapproprié
4. Vraisemblance de l'incident

Réponds uniquement en JSON:
{
  "score": <nombre entre 0 et 100>,
  "analysis": "<explication courte>"
}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
      max_tokens: 200,
    });

    const result = JSON.parse(completion.choices[0].message.content || "{}");
    return {
      score: result.score || 50,
      analysis: result.analysis || "Analyse GPT non disponible",
    };
  } catch (error) {
    console.error("❌ Erreur analyse GPT:", error);
    return { score: 50, analysis: "Erreur lors de l'analyse" };
  }
}

// Analyser l'image avec Vision API
async function analyzeImageQuality(imageBase64: string): Promise<number> {
  if (!process.env.OPENAI_API_KEY) {
    return 70; // Score par défaut
  }

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4-vision-preview",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Évalue la clarté et la qualité de cette image (0-100). Réponds uniquement avec un nombre.",
            },
            {
              type: "image_url",
              image_url: { url: imageBase64 },
            },
          ],
        },
      ],
      max_tokens: 10,
    });

    const score = parseInt(completion.choices[0].message.content || "70");
    return isNaN(score) ? 70 : Math.min(100, Math.max(0, score));
  } catch (error) {
    console.error("❌ Erreur analyse image:", error);
    return 70;
  }
}

// Fonction principale de vérification
export async function verifySignalement(
  signalement: Partial<Signalement>
): Promise<VerificationResult> {
  const reasons: string[] = [];
  let totalScore = 0;
  let scoreCount = 0;

  // 1. Vérifier les doublons
  const { isDuplicate, similarSignalements } = await checkForDuplicates(
    signalement
  );
  if (isDuplicate) {
    reasons.push(
      `${similarSignalements.length} signalement(s) similaire(s) détecté(s)`
    );
    totalScore += 30;
    scoreCount++;
  } else {
    totalScore += 80;
    scoreCount++;
  }

  // 2. Analyser le texte
  const textAnalysis = await analyzeTextCoherence(
    signalement.titre || "",
    signalement.description || ""
  );
  totalScore += textAnalysis.score;
  scoreCount++;
  reasons.push(textAnalysis.analysis);

  // 3. Analyser l'image si présente
  if (signalement.photo) {
    const imageScore = await analyzeImageQuality(signalement.photo);
    totalScore += imageScore;
    scoreCount++;
    reasons.push(`Qualité image: ${imageScore}/100`);
  }

  // Calculer le score final
  const finalScore = Math.round(totalScore / scoreCount);

  // Déterminer le statut
  let status: "verified" | "unverified" | "suspicious";
  if (finalScore >= 70) {
    status = "verified";
  } else if (finalScore >= 40) {
    status = "unverified";
  } else {
    status = "suspicious";
  }

  return {
    score: finalScore,
    status,
    reasons,
  };
}
