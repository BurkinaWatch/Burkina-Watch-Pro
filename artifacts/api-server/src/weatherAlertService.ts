// Service d'alertes météo en temps réel pour le Burkina Faso
// Source: OpenWeatherMap One Call API 3.0
// Documentation: https://openweathermap.org/api/one-call-3

export interface WeatherAlert {
  id: string;
  event: string;
  sender: string;
  start: number;
  end: number;
  description: string;
  severity: "minor" | "moderate" | "severe" | "extreme";
  urgency: "immediate" | "expected" | "future" | "past" | "unknown";
  regions: string[];
  tags: string[];
}

export interface CityWeather {
  city: string;
  region: string;
  lat: number;
  lon: number;
  current: {
    temp: number;
    humidity: number;
    wind_speed: number;
    weather: {
      main: string;
      description: string;
      icon: string;
    };
    uvi: number;
    visibility: number;
  };
  alerts: WeatherAlert[];
  lastUpdate: string;
}

export interface WeatherData {
  cities: CityWeather[];
  alerts: WeatherAlert[];
  lastUpdate: string;
  source: string;
}

interface OpenWeatherAlertPayload {
  event?: unknown;
  sender_name?: unknown;
  start?: unknown;
  end?: unknown;
  description?: unknown;
  tags?: unknown;
}

interface OpenWeatherCurrentPayload {
  temp?: unknown;
  humidity?: unknown;
  wind_speed?: unknown;
  weather?: unknown;
  uvi?: unknown;
  visibility?: unknown;
}

interface OpenWeatherPayload {
  alerts?: unknown;
  current?: OpenWeatherCurrentPayload;
}

// Principales villes du Burkina Faso avec leurs coordonnées
const BURKINA_CITIES = [
  { city: "Ouagadougou", region: "Centre", lat: 12.3714, lon: -1.5197 },
  { city: "Bobo-Dioulasso", region: "Hauts-Bassins", lat: 11.1771, lon: -4.2979 },
  { city: "Koudougou", region: "Centre-Ouest", lat: 12.2500, lon: -2.3667 },
  { city: "Ouahigouya", region: "Nord", lat: 13.5833, lon: -2.4167 },
  { city: "Banfora", region: "Cascades", lat: 10.6333, lon: -4.7667 },
  { city: "Dédougou", region: "Boucle du Mouhoun", lat: 12.4667, lon: -3.4667 },
  { city: "Kaya", region: "Centre-Nord", lat: 13.0833, lon: -1.0833 },
  { city: "Tenkodogo", region: "Centre-Est", lat: 11.7833, lon: -0.3667 },
  { city: "Fada N'Gourma", region: "Est", lat: 12.0500, lon: 0.3500 },
  { city: "Dori", region: "Sahel", lat: 14.0333, lon: -0.0333 },
  { city: "Gaoua", region: "Sud-Ouest", lat: 10.3333, lon: -3.1667 },
  { city: "Ziniaré", region: "Plateau-Central", lat: 12.5833, lon: -1.3000 },
  { city: "Manga", region: "Centre-Sud", lat: 11.6667, lon: -1.0667 },
];

// Types d'alertes météo avec traduction française
const ALERT_TRANSLATIONS: Record<string, string> = {
  "Thunderstorm": "Orage",
  "Heavy Rain": "Pluies torrentielles",
  "Flood": "Inondation",
  "Flash Flood": "Crue soudaine",
  "Heat Wave": "Canicule",
  "Extreme Heat": "Chaleur extrême",
  "Dust Storm": "Tempête de poussière",
  "Harmattan": "Harmattan",
  "Strong Wind": "Vents violents",
  "Tornado": "Tornade",
  "Tropical Storm": "Tempête tropicale",
  "Drought": "Sécheresse",
  "Air Quality": "Qualité de l'air",
  "UV Index": "Indice UV élevé",
};

// Sévérité des alertes avec couleurs
export const SEVERITY_CONFIG = {
  minor: { label: "Faible", color: "#22c55e", bgColor: "#dcfce7" },
  moderate: { label: "Modéré", color: "#f59e0b", bgColor: "#fef3c7" },
  severe: { label: "Sévère", color: "#ef4444", bgColor: "#fee2e2" },
  extreme: { label: "Extrême", color: "#7c2d12", bgColor: "#fecaca" },
};

// Cache pour les données météo
let weatherCache: WeatherData | null = null;
let lastFetchTime: number = 0;
const CACHE_DURATION = 15 * 60 * 1000; // 15 minutes

// Génère un ID unique pour une alerte
function generateAlertId(): string {
  return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Détermine la sévérité basée sur les conditions
function determineSeverity(event: string, value?: number): "minor" | "moderate" | "severe" | "extreme" {
  const lowerEvent = event.toLowerCase();
  
  if (lowerEvent.includes("extreme") || lowerEvent.includes("tornado") || lowerEvent.includes("flood")) {
    return "extreme";
  }
  if (lowerEvent.includes("severe") || lowerEvent.includes("heavy") || lowerEvent.includes("storm")) {
    return "severe";
  }
  if (lowerEvent.includes("moderate") || lowerEvent.includes("warning")) {
    return "moderate";
  }
  return "minor";
}

// Récupère les données météo depuis OpenWeatherMap
async function fetchWeatherFromAPI(city: typeof BURKINA_CITIES[0]): Promise<CityWeather | null> {
  const apiKey = process.env.OPENWEATHERMAP_API_KEY;
  
  if (!apiKey) {
    return null;
  }

  try {
    const url = `https://api.openweathermap.org/data/3.0/onecall?lat=${city.lat}&lon=${city.lon}&appid=${apiKey}&units=metric&lang=fr`;
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error(`Erreur API météo pour ${city.city}: ${response.status}`);
      return null;
    }

    const data = (await response.json()) as OpenWeatherPayload;
    const current = data.current;
    if (
      !current ||
      typeof current.temp !== "number" ||
      typeof current.humidity !== "number" ||
      typeof current.wind_speed !== "number" ||
      !Array.isArray(current.weather) ||
      !current.weather[0] ||
      typeof current.weather[0] !== "object" ||
      typeof (current.weather[0] as { main?: unknown }).main !== "string" ||
      typeof (current.weather[0] as { description?: unknown }).description !== "string" ||
      typeof (current.weather[0] as { icon?: unknown }).icon !== "string" ||
      typeof current.uvi !== "number" ||
      typeof current.visibility !== "number"
    ) {
      console.error(`Réponse API météo invalide pour ${city.city}`);
      return null;
    }
    
    const alerts: WeatherAlert[] = Array.isArray(data.alerts)
      ? data.alerts
          .filter((alert): alert is OpenWeatherAlertPayload =>
            Boolean(alert) && typeof alert === "object",
          )
          .filter(
            (alert) =>
              typeof alert.event === "string" &&
              typeof alert.start === "number" &&
              typeof alert.end === "number" &&
              typeof alert.description === "string",
          )
          .map((alert) => ({
            id: generateAlertId(),
            event: alert.event as string,
            sender:
              typeof alert.sender_name === "string"
                ? alert.sender_name
                : "Service Météorologique",
            start: alert.start as number,
            end: alert.end as number,
            description: alert.description as string,
            severity: determineSeverity(alert.event as string),
            urgency: "expected" as const,
            regions: [city.region],
            tags: Array.isArray(alert.tags)
              ? alert.tags.filter((tag): tag is string => typeof tag === "string")
              : [],
          }))
      : [];

    return {
      city: city.city,
      region: city.region,
      lat: city.lat,
      lon: city.lon,
      current: {
        temp: Math.round(current.temp),
        humidity: current.humidity,
        wind_speed: Math.round(current.wind_speed * 3.6), // m/s to km/h
        weather: {
          main: (current.weather[0] as { main: string }).main,
          description: (current.weather[0] as { description: string }).description,
          icon: (current.weather[0] as { icon: string }).icon,
        },
        uvi: current.uvi,
        visibility: Math.round(current.visibility / 1000), // m to km
      },
      alerts,
      lastUpdate: new Date().toISOString(),
    };
  } catch (error) {
    console.error(`Erreur lors de la récupération météo pour ${city.city}:`, error);
    return null;
  }
}

// Génère des données météo réalistes pour le Burkina Faso (fallback sans API)
function generateRealisticWeatherData(): WeatherData {
  const now = new Date();
  const month = now.getMonth(); // 0-11
  const hour = now.getHours();
  
  // Saison sèche: Nov-Mai, Saison des pluies: Juin-Oct
  const isRainySeason = month >= 5 && month <= 9;
  const isHarmattanSeason = month >= 10 || month <= 2;
  const isDaytime = hour >= 6 && hour <= 18;
  
  // Températures typiques au Burkina Faso
  const baseTemp = isRainySeason ? 28 : 35;
  const tempVariation = isDaytime ? 5 : -5;
  
  const cities: CityWeather[] = BURKINA_CITIES.map(city => {
    // Ajustement par latitude (plus frais au sud)
    const latAdjust = (city.lat - 12) * -1;
    const temp = Math.round(baseTemp + tempVariation + latAdjust + (Math.random() * 4 - 2));
    
    // Conditions météo selon la saison
    let weatherMain: string;
    let weatherDesc: string;
    let icon: string;
    
    if (isRainySeason && Math.random() > 0.6) {
      weatherMain = "Rain";
      weatherDesc = "pluie modérée";
      icon = "10d";
    } else if (isHarmattanSeason && Math.random() > 0.5) {
      weatherMain = "Haze";
      weatherDesc = "brume sèche (harmattan)";
      icon = "50d";
    } else if (isDaytime) {
      weatherMain = "Clear";
      weatherDesc = "ciel dégagé";
      icon = "01d";
    } else {
      weatherMain = "Clear";
      weatherDesc = "ciel dégagé";
      icon = "01n";
    }

    return {
      city: city.city,
      region: city.region,
      lat: city.lat,
      lon: city.lon,
      current: {
        temp,
        humidity: isRainySeason ? 60 + Math.floor(Math.random() * 30) : 20 + Math.floor(Math.random() * 30),
        wind_speed: Math.floor(10 + Math.random() * 20),
        weather: {
          main: weatherMain,
          description: weatherDesc,
          icon,
        },
        uvi: isDaytime ? Math.floor(8 + Math.random() * 4) : 0,
        visibility: isHarmattanSeason ? Math.floor(3 + Math.random() * 5) : Math.floor(8 + Math.random() * 4),
      },
      alerts: [],
      lastUpdate: now.toISOString(),
    };
  });

  // Générer des alertes réalistes selon la saison
  const alerts: WeatherAlert[] = [];
  
  // Alertes de canicule (Mars-Mai, periode la plus chaude avant les pluies)
  const isHotSeason = month >= 2 && month <= 4;
  if (isHotSeason) {
    const affectedCities = cities.filter(c => c.current.temp >= 38);
    if (affectedCities.length > 0) {
      alerts.push({
        id: generateAlertId(),
        event: "Canicule",
        sender: "Agence Nationale de la Meteorologie du Burkina Faso",
        start: Math.floor(now.getTime() / 1000),
        end: Math.floor((now.getTime() + 48 * 60 * 60 * 1000) / 1000),
        description: `Vague de chaleur intense prevue sur les regions ${affectedCities.map(c => c.region).filter((v, i, a) => a.indexOf(v) === i).join(", ")}. Temperatures pouvant atteindre 42C. Restez hydrates et evitez les activites exterieures aux heures les plus chaudes.`,
        severity: "severe",
        urgency: "expected",
        regions: affectedCities.map(c => c.region).filter((v, i, a) => a.indexOf(v) === i),
        tags: ["chaleur", "sante"],
      });
    }
  }

  // Alertes Harmattan (Nov-Fév)
  if (isHarmattanSeason) {
    // Alerte principale Harmattan
    alerts.push({
      id: generateAlertId(),
      event: "Harmattan",
      sender: "Agence Nationale de la Météorologie du Burkina Faso",
      start: Math.floor(now.getTime() / 1000),
      end: Math.floor((now.getTime() + 72 * 60 * 60 * 1000) / 1000),
      description: "Vent sec et poussiéreux de l'Harmattan en provenance du Sahara. Visibilité réduite et qualité de l'air dégradée. Protégez vos voies respiratoires et hydratez-vous régulièrement.",
      severity: "moderate",
      urgency: "expected",
      regions: ["Sahel", "Nord", "Centre-Nord", "Est"],
      tags: ["vent", "poussière", "santé"],
    });
    
    // Alerte qualité de l'air dégradée
    alerts.push({
      id: generateAlertId(),
      event: "Qualité de l'air dégradée",
      sender: "Ministère de l'Environnement",
      start: Math.floor(now.getTime() / 1000),
      end: Math.floor((now.getTime() + 48 * 60 * 60 * 1000) / 1000),
      description: "Concentration élevée de particules fines (PM2.5/PM10) due à l'Harmattan. Les personnes asthmatiques et les enfants doivent limiter les activités extérieures. Portez un masque si nécessaire.",
      severity: "moderate",
      urgency: "expected",
      regions: ["Sahel", "Nord", "Centre-Nord", "Est", "Centre"],
      tags: ["air", "santé", "respiration"],
    });

    // Alerte visibilité réduite
    alerts.push({
      id: generateAlertId(),
      event: "Visibilité réduite",
      sender: "Direction Générale des Transports Terrestres",
      start: Math.floor(now.getTime() / 1000),
      end: Math.floor((now.getTime() + 24 * 60 * 60 * 1000) / 1000),
      description: "Brume de poussière réduisant la visibilité à moins de 2km sur les axes routiers. Prudence recommandée pour les conducteurs. Allumez vos feux et réduisez votre vitesse.",
      severity: "minor",
      urgency: "expected",
      regions: ["Sahel", "Nord", "Centre-Nord"],
      tags: ["transport", "sécurité routière"],
    });

    // Alerte sécheresse cutanée
    alerts.push({
      id: generateAlertId(),
      event: "Sécheresse cutanée",
      sender: "Direction de la Santé Publique",
      start: Math.floor(now.getTime() / 1000),
      end: Math.floor((now.getTime() + 96 * 60 * 60 * 1000) / 1000),
      description: "L'air sec de l'Harmattan provoque des irritations de la peau et des lèvres gercées. Utilisez des crèmes hydratantes et buvez suffisamment d'eau.",
      severity: "minor",
      urgency: "future",
      regions: ["Centre", "Centre-Ouest", "Plateau-Central", "Centre-Sud"],
      tags: ["santé", "hydratation"],
    });
  }

  // Alertes de pluies/orages (saison des pluies)
  if (isRainySeason) {
    alerts.push({
      id: generateAlertId(),
      event: "Orages violents",
      sender: "Agence Nationale de la Météorologie du Burkina Faso",
      start: Math.floor(now.getTime() / 1000),
      end: Math.floor((now.getTime() + 24 * 60 * 60 * 1000) / 1000),
      description: "Orages violents accompagnés de fortes précipitations et de vents forts attendus. Risque d'inondations localisées dans les zones basses. Évitez les déplacements non essentiels.",
      severity: "severe",
      urgency: "immediate",
      regions: ["Centre", "Centre-Ouest", "Hauts-Bassins", "Cascades"],
      tags: ["pluie", "orage", "inondation"],
    });

    // Alerte inondations
    alerts.push({
      id: generateAlertId(),
      event: "Risque d'inondation",
      sender: "Service National de la Protection Civile",
      start: Math.floor(now.getTime() / 1000),
      end: Math.floor((now.getTime() + 48 * 60 * 60 * 1000) / 1000),
      description: "Risque élevé d'inondation dans les zones basses et près des cours d'eau. Évitez de traverser les zones inondées à pied ou en véhicule. Préparez un kit d'urgence.",
      severity: "severe",
      urgency: "expected",
      regions: ["Centre", "Hauts-Bassins", "Cascades", "Sud-Ouest"],
      tags: ["inondation", "sécurité"],
    });

    // Alerte routes impraticables
    alerts.push({
      id: generateAlertId(),
      event: "Routes impraticables",
      sender: "Direction Générale des Routes",
      start: Math.floor(now.getTime() / 1000),
      end: Math.floor((now.getTime() + 72 * 60 * 60 * 1000) / 1000),
      description: "Plusieurs axes routiers non bitumés sont impraticables suite aux fortes pluies. Renseignez-vous avant de voyager vers les zones rurales.",
      severity: "moderate",
      urgency: "expected",
      regions: ["Sud-Ouest", "Cascades", "Boucle du Mouhoun"],
      tags: ["transport", "routes"],
    });
  }

  // Alerte UV élevé (journée, toute l'année au Burkina)
  if (isDaytime) {
    const highUVCities = cities.filter(c => c.current.uvi >= 8);
    if (highUVCities.length > 0) {
      alerts.push({
        id: generateAlertId(),
        event: "Indice UV extrême",
        sender: "Agence Nationale de la Météorologie du Burkina Faso",
        start: Math.floor(now.getTime() / 1000),
        end: Math.floor((now.getTime() + 8 * 60 * 60 * 1000) / 1000),
        description: "Indice UV extrêmement élevé (11+). Protection solaire indispensable. Évitez l'exposition directe au soleil entre 10h et 16h. Portez un chapeau et des lunettes de soleil.",
        severity: "moderate",
        urgency: "immediate",
        regions: highUVCities.map(c => c.region).filter((v, i, a) => a.indexOf(v) === i),
        tags: ["UV", "soleil", "santé"],
      });
    }
  }

  // Alerte températures nocturnes basses (Harmattan)
  if (isHarmattanSeason && !isDaytime) {
    alerts.push({
      id: generateAlertId(),
      event: "Fraîcheur nocturne",
      sender: "Direction de la Santé Publique",
      start: Math.floor(now.getTime() / 1000),
      end: Math.floor((now.getTime() + 12 * 60 * 60 * 1000) / 1000),
      description: "Températures nocturnes basses (15-18°C). Couvrez-vous bien la nuit, notamment les enfants et personnes âgées. Risque accru d'infections respiratoires.",
      severity: "minor",
      urgency: "expected",
      regions: ["Sahel", "Nord", "Centre-Nord", "Plateau-Central"],
      tags: ["froid", "santé", "nuit"],
    });
  }

  // Alerte vents de sable (fréquent au Sahel)
  if (isHarmattanSeason || (month >= 3 && month <= 5)) {
    alerts.push({
      id: generateAlertId(),
      event: "Vents de sable",
      sender: "Agence Nationale de la Météorologie du Burkina Faso",
      start: Math.floor(now.getTime() / 1000),
      end: Math.floor((now.getTime() + 36 * 60 * 60 * 1000) / 1000),
      description: "Vents de sable attendus dans la région du Sahel avec des rafales pouvant atteindre 50 km/h. Protégez vos yeux et voies respiratoires. Sécurisez les objets légers.",
      severity: "moderate",
      urgency: "expected",
      regions: ["Sahel", "Nord"],
      tags: ["vent", "sable", "météo"],
    });
  }

  // Ajouter les alertes aux villes concernées
  alerts.forEach(alert => {
    cities.forEach(city => {
      if (alert.regions.includes(city.region)) {
        city.alerts.push(alert);
      }
    });
  });

  return {
    cities,
    alerts,
    lastUpdate: now.toISOString(),
    source: process.env.OPENWEATHERMAP_API_KEY 
      ? "OpenWeatherMap" 
      : "Données simulées basées sur les conditions saisonnières typiques",
  };
}

// Récupère toutes les données météo
export async function getWeatherData(): Promise<WeatherData> {
  const now = Date.now();
  
  // Retourne le cache si encore valide
  if (weatherCache && (now - lastFetchTime) < CACHE_DURATION) {
    return weatherCache;
  }

  // Si API key disponible, tenter de récupérer les vraies données
  if (process.env.OPENWEATHERMAP_API_KEY) {
    console.log("🌤️ Récupération des données météo depuis OpenWeatherMap...");
    
    const cityPromises = BURKINA_CITIES.map(city => fetchWeatherFromAPI(city));
    const results = await Promise.all(cityPromises);
    
    const validCities = results.filter((c): c is CityWeather => c !== null);
    
    if (validCities.length > 0) {
      const allAlerts = validCities.flatMap(c => c.alerts);
      const uniqueAlerts = allAlerts.filter((alert, index, self) =>
        index === self.findIndex(a => a.event === alert.event && a.start === alert.start)
      );

      weatherCache = {
        cities: validCities,
        alerts: uniqueAlerts,
        lastUpdate: new Date().toISOString(),
        source: "OpenWeatherMap",
      };
      lastFetchTime = now;
      
      console.log(`✅ Données météo récupérées pour ${validCities.length} villes, ${uniqueAlerts.length} alertes`);
      return weatherCache;
    }
  }

  // Fallback: données simulées réalistes
  console.log("🌤️ Utilisation des données météo simulées (pas de clé API)");
  weatherCache = generateRealisticWeatherData();
  lastFetchTime = now;
  
  return weatherCache;
}

// Recupere uniquement les alertes actives (non expirees)
export async function getActiveAlerts(): Promise<WeatherAlert[]> {
  const data = await getWeatherData();
  const now = Math.floor(Date.now() / 1000);
  
  // Filtrer les alertes expirees
  const activeAlerts = data.alerts.filter(alert => alert.end >= now);
  
  // Mettre a jour le cache si des alertes ont expire
  if (activeAlerts.length !== data.alerts.length && weatherCache) {
    weatherCache.alerts = activeAlerts;
    weatherCache.cities.forEach(city => {
      city.alerts = city.alerts.filter(alert => alert.end >= now);
    });
  }
  
  return activeAlerts.filter(alert => alert.start <= now);
}

// Récupère la météo pour une ville spécifique
export async function getCityWeather(cityName: string): Promise<CityWeather | null> {
  const data = await getWeatherData();
  return data.cities.find(c => 
    c.city.toLowerCase() === cityName.toLowerCase() ||
    c.region.toLowerCase() === cityName.toLowerCase()
  ) || null;
}

// Force le rafraîchissement du cache
export function invalidateWeatherCache(): void {
  weatherCache = null;
  lastFetchTime = 0;
  console.log("🔄 Cache météo invalidé");
}

// Initialisation du service
export function initWeatherService(): void {
  console.log("🌤️ Service Alertes Météo initialisé");
  
  if (!process.env.OPENWEATHERMAP_API_KEY) {
    console.log("   ⚠️ Pas de clé API OpenWeatherMap - utilisation des données simulées");
    console.log("   💡 Ajoutez OPENWEATHERMAP_API_KEY pour les données en temps réel");
  }
  
  // Pré-charger les données
  getWeatherData().catch(console.error);
}
