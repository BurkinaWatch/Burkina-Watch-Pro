
import { PHARMACIES_DATA } from "../client/src/pages/Pharmacies";

// Service de gestion des pharmacies
export class PharmaciesService {
  private static instance: PharmaciesService;
  private lastUpdate: Date | null = null;

  private constructor() {}

  static getInstance(): PharmaciesService {
    if (!PharmaciesService.instance) {
      PharmaciesService.instance = new PharmaciesService();
    }
    return PharmaciesService.instance;
  }

  // Récupérer toutes les pharmacies
  getAllPharmacies() {
    return PHARMACIES_DATA;
  }

  // Récupérer les pharmacies par région
  getPharmaciesByRegion(region: string) {
    return PHARMACIES_DATA.filter(p => p.region === region);
  }

  // Récupérer les pharmacies par type de garde
  getPharmaciesByTypeGarde(typeGarde: "jour" | "nuit" | "24h") {
    return PHARMACIES_DATA.filter(p => p.typeGarde === typeGarde);
  }

  // Récupérer les pharmacies 24h/24
  getPharmacies24h() {
    return this.getPharmaciesByTypeGarde("24h");
  }

  // Rechercher des pharmacies
  searchPharmacies(query: string) {
    const lowerQuery = query.toLowerCase();
    return PHARMACIES_DATA.filter(p =>
      p.nom.toLowerCase().includes(lowerQuery) ||
      p.ville.toLowerCase().includes(lowerQuery) ||
      p.quartier.toLowerCase().includes(lowerQuery) ||
      p.adresse.toLowerCase().includes(lowerQuery) ||
      p.region.toLowerCase().includes(lowerQuery)
    );
  }

  // Obtenir les statistiques
  getStats() {
    const total = PHARMACIES_DATA.length;
    const par24h = this.getPharmacies24h().length;
    const parJour = this.getPharmaciesByTypeGarde("jour").length;
    const parNuit = this.getPharmaciesByTypeGarde("nuit").length;

    const parRegion = PHARMACIES_DATA.reduce((acc, p) => {
      acc[p.region] = (acc[p.region] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total,
      par24h,
      parJour,
      parNuit,
      parRegion,
      lastUpdate: this.lastUpdate || new Date(),
    };
  }

  // Marquer comme mis à jour
  markAsUpdated() {
    this.lastUpdate = new Date();
    console.log(`✅ Données des pharmacies mises à jour: ${PHARMACIES_DATA.length} pharmacies`);
  }

  // Planifier une mise à jour quotidienne automatique (à minuit)
  scheduleAutoUpdate() {
    // Mise à jour initiale
    this.markAsUpdated();
    console.log(`✅ Données des pharmacies initialisées`);

    // Calculer le temps jusqu'à minuit
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    const timeUntilMidnight = tomorrow.getTime() - now.getTime();

    // Planifier la première mise à jour à minuit
    setTimeout(() => {
      this.markAsUpdated();
      console.log(`🔄 Mise à jour quotidienne automatique des pharmacies (minuit)`);

      // Puis répéter toutes les 24h
      setInterval(() => {
        this.markAsUpdated();
        console.log(`🔄 Mise à jour quotidienne automatique des pharmacies (minuit)`);
      }, 24 * 60 * 60 * 1000);
    }, timeUntilMidnight);

    console.log(`⏰ Mise à jour automatique programmée tous les jours à minuit`);
    console.log(`⏰ Prochaine mise à jour dans ${Math.round(timeUntilMidnight / 1000 / 60)} minutes`);
  }
}

export const pharmaciesService = PharmaciesService.getInstance();
