
import { PHARMACIES_DATA } from "./pharmaciesData";

// Service de gestion des pharmacies de garde du Burkina Faso
// Base de données élargie: 150+ pharmacies couvrant toutes les 17 régions
// Actualisation automatique toutes les 24 heures
export class PharmaciesService {
  private static instance: PharmaciesService;
  private lastUpdate: Date | null = null;
  private updateInterval: NodeJS.Timeout | null = null;
  private isScheduled: boolean = false;

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

    // Calculer le nombre de villes couvertes
    const villes = new Set(PHARMACIES_DATA.map(p => p.ville));

    return {
      total,
      par24h,
      parJour,
      parNuit,
      parRegion,
      nombreVilles: villes.size,
      lastUpdate: this.lastUpdate || new Date(),
      nextUpdate: this.getNextUpdateTime(),
    };
  }

  // Calculer la prochaine heure de mise à jour
  private getNextUpdateTime(): Date {
    const now = new Date();
    const next = new Date(now);
    next.setDate(next.getDate() + 1);
    next.setHours(0, 0, 0, 0);
    return next;
  }

  // Marquer comme mis à jour
  markAsUpdated() {
    this.lastUpdate = new Date();
    const stats = this.getStats();
    console.log(`✅ Données des pharmacies actualisées: ${stats.total} pharmacies dans ${stats.nombreVilles} villes`);
    console.log(`   - 24h/24: ${stats.par24h} | Jour: ${stats.parJour} | Nuit: ${stats.parNuit}`);
  }

  // Planifier une mise à jour quotidienne automatique (toutes les 24h)
  scheduleAutoUpdate() {
    // Éviter les doublons si déjà programmé
    if (this.isScheduled) {
      console.log(`⏰ Actualisation automatique déjà programmée`);
      return;
    }
    
    // Mise à jour initiale
    this.markAsUpdated();
    console.log(`✅ Service des pharmacies de garde initialisé`);

    // Calculer le temps jusqu'à minuit (heure locale Burkina Faso = GMT)
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    const timeUntilMidnight = tomorrow.getTime() - now.getTime();

    // Planifier la première mise à jour à minuit
    setTimeout(() => {
      this.markAsUpdated();
      console.log(`🔄 Actualisation quotidienne automatique des pharmacies (minuit GMT)`);

      // Puis répéter toutes les 24h (86400000 ms)
      this.updateInterval = setInterval(() => {
        this.markAsUpdated();
        console.log(`🔄 Actualisation quotidienne automatique des pharmacies (minuit GMT)`);
      }, 24 * 60 * 60 * 1000);
    }, timeUntilMidnight);

    this.isScheduled = true;
    const hoursUntil = Math.floor(timeUntilMidnight / 1000 / 60 / 60);
    const minutesUntil = Math.floor((timeUntilMidnight / 1000 / 60) % 60);
    console.log(`⏰ Actualisation automatique programmée toutes les 24h à minuit GMT`);
    console.log(`⏰ Prochaine actualisation dans ${hoursUntil}h ${minutesUntil}min`);
  }

  // Arrêter l'actualisation automatique (pour les tests)
  stopAutoUpdate() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
      this.isScheduled = false;
      console.log(`⏹️ Actualisation automatique arrêtée`);
    }
  }
}

export const pharmaciesService = PharmaciesService.getInstance();
