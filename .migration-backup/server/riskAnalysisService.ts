import { db } from "./db";
import { signalements, users } from "@shared/schema";
import { sql, desc, and, gte, eq, count } from "drizzle-orm";

interface RiskZone {
  id: string;
  latitude: number;
  longitude: number;
  localisation: string;
  riskLevel: "faible" | "moyen" | "eleve" | "critique";
  riskScore: number;
  incidentCount: number;
  categories: { categorie: string; count: number }[];
  lastIncident: string | null;
  trend: "hausse" | "stable" | "baisse";
  description: string;
}

interface PersonalizedRecommendation {
  id: string;
  type: "alerte" | "conseil" | "info" | "action";
  priority: "haute" | "moyenne" | "basse";
  title: string;
  description: string;
  actionUrl?: string;
  icon: string;
  category?: string;
  location?: string;
}

interface UserProfile {
  id: string;
  ville?: string | null;
  metier?: string | null;
  role?: string | null;
}

const RISK_CATEGORIES_WEIGHTS: Record<string, number> = {
  urgence: 10,
  securite: 8,
  sante: 7,
  corruption: 5,
  infrastructure: 4,
  environnement: 3,
  personne_recherchee: 6,
};

const URGENCY_WEIGHTS: Record<string, number> = {
  critique: 3,
  moyen: 2,
  faible: 1,
};

function calculateRiskLevel(score: number): RiskZone["riskLevel"] {
  if (score >= 80) return "critique";
  if (score >= 50) return "eleve";
  if (score >= 25) return "moyen";
  return "faible";
}

function generateRiskDescription(zone: Partial<RiskZone>): string {
  const topCategory = zone.categories?.[0]?.categorie || "divers";
  const level = zone.riskLevel || "faible";
  
  const descriptions: Record<string, Record<string, string>> = {
    critique: {
      securite: "Zone presentant des risques de securite importants. Restez vigilant et evitez les deplacements non essentiels.",
      urgence: "Plusieurs situations d'urgence signalees recemment. Soyez prudent et suivez les consignes des autorites.",
      sante: "Risques sanitaires eleves dans cette zone. Prenez les precautions necessaires.",
      default: "Zone a risque critique. Evitez si possible et restez informe.",
    },
    eleve: {
      securite: "Des incidents de securite ont ete signales. Soyez prudent lors de vos deplacements.",
      infrastructure: "Problemes d'infrastructure frequents. Attention aux routes et installations.",
      default: "Zone a surveiller. Restez attentif a votre environnement.",
    },
    moyen: {
      default: "Quelques incidents signales. Vigilance normale recommandee.",
    },
    faible: {
      default: "Zone relativement calme selon les signalements recents.",
    },
  };
  
  return descriptions[level]?.[topCategory] || descriptions[level]?.default || descriptions.faible.default;
}

export async function analyzeRiskZones(): Promise<RiskZone[]> {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const sixtyDaysAgo = new Date();
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
  
  const recentSignalements = await db
    .select({
      localisation: signalements.localisation,
      latitude: signalements.latitude,
      longitude: signalements.longitude,
      categorie: signalements.categorie,
      niveauUrgence: signalements.niveauUrgence,
      createdAt: signalements.createdAt,
      isSOS: signalements.isSOS,
    })
    .from(signalements)
    .where(gte(signalements.createdAt, sixtyDaysAgo))
    .orderBy(desc(signalements.createdAt));
  
  const locationGroups: Record<string, typeof recentSignalements> = {};
  
  for (const s of recentSignalements) {
    if (!s.latitude || !s.longitude) continue;
    
    const lat = parseFloat(s.latitude);
    const lng = parseFloat(s.longitude);
    if (isNaN(lat) || isNaN(lng)) continue;
    
    const key = s.localisation || `${lat.toFixed(3)},${lng.toFixed(3)}`;
    if (!locationGroups[key]) {
      locationGroups[key] = [];
    }
    locationGroups[key].push(s);
  }
  
  const riskZones: RiskZone[] = [];
  
  for (const location of Object.keys(locationGroups)) {
    const incidents = locationGroups[location];
    if (incidents.length < 2) continue;
    
    const recentIncidents = incidents.filter((i: typeof incidents[0]) => i.createdAt && i.createdAt >= thirtyDaysAgo);
    const olderIncidents = incidents.filter((i: typeof incidents[0]) => i.createdAt && i.createdAt < thirtyDaysAgo && i.createdAt >= sixtyDaysAgo);
    
    let riskScore = 0;
    const categoryCount = new Map<string, number>();
    
    for (const incident of recentIncidents) {
      const categoryWeight = RISK_CATEGORIES_WEIGHTS[incident.categorie] || 3;
      const urgencyWeight = URGENCY_WEIGHTS[incident.niveauUrgence || "faible"] || 1;
      const sosBonus = incident.isSOS ? 5 : 0;
      
      riskScore += categoryWeight * urgencyWeight + sosBonus;
      categoryCount.set(incident.categorie, (categoryCount.get(incident.categorie) || 0) + 1);
    }
    
    riskScore = Math.min(100, riskScore);
    
    let trend: RiskZone["trend"] = "stable";
    if (recentIncidents.length > olderIncidents.length * 1.5) {
      trend = "hausse";
    } else if (recentIncidents.length < olderIncidents.length * 0.5) {
      trend = "baisse";
    }
    
    const categories = Array.from(categoryCount.entries())
      .map(([categorie, count]) => ({ categorie, count }))
      .sort((a, b) => b.count - a.count);
    
    const firstIncident = incidents[0];
    const lat = parseFloat(firstIncident.latitude);
    const lng = parseFloat(firstIncident.longitude);
    
    if (isNaN(lat) || isNaN(lng)) continue;
    
    const safeLocation = (firstIncident.localisation || location || "Zone inconnue").trim();
    const safeId = `zone-${safeLocation.replace(/[^a-zA-Z0-9]/g, "-").substring(0, 50)}`;
    
    const zone: RiskZone = {
      id: safeId,
      latitude: lat,
      longitude: lng,
      localisation: safeLocation,
      riskLevel: calculateRiskLevel(riskScore),
      riskScore,
      incidentCount: recentIncidents.length,
      categories,
      lastIncident: recentIncidents[0]?.createdAt ? recentIncidents[0].createdAt.toISOString() : null,
      trend,
      description: "",
    };
    
    zone.description = generateRiskDescription(zone);
    riskZones.push(zone);
  }
  
  return riskZones.sort((a, b) => b.riskScore - a.riskScore).slice(0, 20);
}

export async function getPersonalizedRecommendations(userId: string): Promise<PersonalizedRecommendation[]> {
  const recommendations: PersonalizedRecommendation[] = [];
  
  const [user] = await db
    .select({
      id: users.id,
      ville: users.ville,
      metier: users.metier,
      role: users.role,
      userLevel: users.userLevel,
      userPoints: users.userPoints,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  
  if (!user) {
    return getDefaultRecommendations();
  }
  
  const userVille = user.ville?.toLowerCase() || "";
  
  const riskZones = await analyzeRiskZones();
  const nearbyRiskZones = riskZones.filter(zone => {
    const zoneLocation = zone.localisation.toLowerCase();
    return zoneLocation.includes(userVille) || (userVille && userVille.includes(zoneLocation.split(",")[0]));
  });
  
  for (const zone of nearbyRiskZones.slice(0, 3)) {
    if (zone.riskLevel === "critique" || zone.riskLevel === "eleve") {
      recommendations.push({
        id: `alert-${zone.id}`,
        type: "alerte",
        priority: zone.riskLevel === "critique" ? "haute" : "moyenne",
        title: `Zone a risque: ${zone.localisation}`,
        description: zone.description,
        actionUrl: "/carte",
        icon: "AlertTriangle",
        location: zone.localisation,
      });
    }
  }
  
  const metier = user.metier?.toLowerCase() || "";
  
  if (metier.includes("sante") || metier.includes("medecin") || metier.includes("infirmier")) {
    recommendations.push({
      id: "conseil-sante-pro",
      type: "conseil",
      priority: "moyenne",
      title: "Alertes sante dans votre region",
      description: "Consultez les signalements de sante recents pour rester informe des situations sanitaires locales.",
      actionUrl: "/feed?categorie=sante",
      icon: "Stethoscope",
      category: "sante",
    });
  }
  
  if (metier.includes("securite") || metier.includes("police") || metier.includes("gendarme")) {
    recommendations.push({
      id: "conseil-securite-pro",
      type: "conseil",
      priority: "haute",
      title: "Incidents de securite recents",
      description: "Des signalements de securite necessitent votre attention dans votre zone d'activite.",
      actionUrl: "/feed?categorie=securite",
      icon: "Shield",
      category: "securite",
    });
  }
  
  if (metier.includes("transport") || metier.includes("chauffeur") || metier.includes("taxi")) {
    recommendations.push({
      id: "conseil-transport-pro",
      type: "conseil",
      priority: "moyenne",
      title: "Etat des routes",
      description: "Verifiez les signalements d'infrastructure pour planifier vos trajets en toute securite.",
      actionUrl: "/feed?categorie=infrastructure",
      icon: "Car",
      category: "infrastructure",
    });
  }
  
  if (user.userLevel === "sentinelle" && user.userPoints && user.userPoints < 50) {
    recommendations.push({
      id: "action-contribution",
      type: "action",
      priority: "basse",
      title: "Contribuez a la communaute",
      description: "Signalez un incident dans votre quartier pour aider vos concitoyens et gagner des points.",
      actionUrl: "/publier",
      icon: "Plus",
    });
  }
  
  recommendations.push({
    id: "info-pharmacies",
    type: "info",
    priority: "basse",
    title: "Pharmacies de garde",
    description: "Consultez les pharmacies ouvertes 24h/24 dans votre ville.",
    actionUrl: "/pharmacies-garde",
    icon: "Pill",
  });
  
  recommendations.push({
    id: "info-urgences",
    type: "info",
    priority: "basse",
    title: "Numeros d'urgence",
    description: "Gardez a portee de main les contacts d'urgence officiels du Burkina Faso.",
    actionUrl: "/urgences",
    icon: "Phone",
  });
  
  if (user.role === "admin" || user.role === "moderateur") {
    const pendingCount = await db
      .select({ count: count() })
      .from(signalements)
      .where(eq(signalements.statut, "en_attente"));
    
    if (pendingCount[0]?.count && pendingCount[0].count > 0) {
      recommendations.push({
        id: "action-moderation",
        type: "action",
        priority: "haute",
        title: `${pendingCount[0].count} signalements en attente`,
        description: "Des signalements necessitent votre validation.",
        actionUrl: "/feed?statut=en_attente",
        icon: "ClipboardCheck",
      });
    }
  }
  
  return recommendations.sort((a, b) => {
    const priorityOrder = { haute: 0, moyenne: 1, basse: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });
}

function getDefaultRecommendations(): PersonalizedRecommendation[] {
  return [
    {
      id: "default-securite",
      type: "conseil",
      priority: "moyenne",
      title: "Restez informe",
      description: "Consultez regulierement les signalements de votre region pour rester au courant de la situation.",
      actionUrl: "/feed",
      icon: "Bell",
    },
    {
      id: "default-contribution",
      type: "action",
      priority: "basse",
      title: "Signalez un incident",
      description: "Aidez votre communaute en signalant les incidents que vous observez.",
      actionUrl: "/publier",
      icon: "Plus",
    },
    {
      id: "default-urgences",
      type: "info",
      priority: "basse",
      title: "Numeros d'urgence",
      description: "Acces rapide aux contacts d'urgence officiels.",
      actionUrl: "/urgences",
      icon: "Phone",
    },
  ];
}

export async function getRiskStats() {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const stats = await db
    .select({
      categorie: signalements.categorie,
      count: count(),
    })
    .from(signalements)
    .where(gte(signalements.createdAt, thirtyDaysAgo))
    .groupBy(signalements.categorie);
  
  const totalIncidents = stats.reduce((sum, s) => sum + Number(s.count), 0);
  const topCategories = stats
    .sort((a, b) => Number(b.count) - Number(a.count))
    .slice(0, 5);
  
  return {
    totalIncidents,
    topCategories,
    analysisDate: new Date(),
  };
}
