import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  AlertTriangle, 
  CloudRain, 
  Sun, 
  Wind, 
  Thermometer, 
  Droplets,
  Eye,
  RefreshCw,
  MapPin,
  Clock,
  ChevronRight,
  CloudSun,
  Flame,
  CloudLightning,
  Shield,
  Info,
  X,
  Umbrella,
  Home,
  Car,
  Phone,
  Heart
} from "lucide-react";
import { useState } from "react";
import { format, formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";

interface WeatherAlert {
  id: string;
  event: string;
  sender: string;
  start: number;
  end: number;
  description: string;
  severity: "minor" | "moderate" | "severe" | "extreme";
  urgency: string;
  regions: string[];
  tags: string[];
}

interface CityWeather {
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

interface WeatherData {
  cities: CityWeather[];
  alerts: WeatherAlert[];
  lastUpdate: string;
  source: string;
}

const SEVERITY_CONFIG = {
  minor: { label: "Faible", color: "bg-green-500/20 text-green-700 dark:text-green-400 border-green-500/30", pulseColor: "bg-green-500" },
  moderate: { label: "Modéré", color: "bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 border-yellow-500/30", pulseColor: "bg-yellow-500" },
  severe: { label: "Sévère", color: "bg-orange-500/20 text-orange-700 dark:text-orange-400 border-orange-500/30", pulseColor: "bg-orange-500" },
  extreme: { label: "Critique", color: "bg-red-500/20 text-red-700 dark:text-red-400 border-red-500/30", pulseColor: "bg-red-500" },
};

const SAFETY_RECOMMENDATIONS: Record<string, { icon: React.ReactNode; tips: string[] }> = {
  harmattan: {
    icon: <Wind className="w-5 h-5" />,
    tips: [
      "Portez un masque ou un foulard pour protéger vos voies respiratoires",
      "Hydratez-vous régulièrement et utilisez une crème hydratante",
      "Protégez vos yeux avec des lunettes",
      "Évitez les activités en plein air prolongées",
      "Fermez portes et fenêtres pour limiter la poussière"
    ]
  },
  canicule: {
    icon: <Flame className="w-5 h-5" />,
    tips: [
      "Restez à l'ombre et évitez de sortir aux heures les plus chaudes (12h-16h)",
      "Buvez au moins 2 litres d'eau par jour",
      "Portez des vêtements légers et de couleur claire",
      "Prenez des nouvelles des personnes âgées et vulnérables",
      "Ne laissez jamais d'enfant ou d'animal dans un véhicule"
    ]
  },
  orage: {
    icon: <CloudLightning className="w-5 h-5" />,
    tips: [
      "Restez à l'intérieur et éloignez-vous des fenêtres",
      "Débranchez les appareils électriques",
      "Évitez de vous abriter sous les arbres isolés",
      "Ne traversez pas les zones inondées",
      "Attendez 30 minutes après le dernier éclair avant de sortir"
    ]
  },
  pluie: {
    icon: <CloudRain className="w-5 h-5" />,
    tips: [
      "Évitez les déplacements non essentiels",
      "Ne traversez jamais une route inondée à pied ou en voiture",
      "Éloignez-vous des cours d'eau et des zones basses",
      "Préparez une trousse d'urgence avec lampe et radio",
      "Signalez les inondations aux autorités locales"
    ]
  },
  default: {
    icon: <Shield className="w-5 h-5" />,
    tips: [
      "Restez informé via les médias officiels",
      "Suivez les consignes des autorités locales",
      "Préparez un kit d'urgence avec eau, nourriture et médicaments",
      "Gardez votre téléphone chargé",
      "Identifiez les abris et points de rassemblement de votre quartier"
    ]
  }
};

function getSafetyRecommendations(event: string) {
  const lower = event.toLowerCase();
  if (lower.includes("harmattan") || lower.includes("vent") || lower.includes("poussière")) {
    return SAFETY_RECOMMENDATIONS.harmattan;
  }
  if (lower.includes("canicule") || lower.includes("chaleur") || lower.includes("heat")) {
    return SAFETY_RECOMMENDATIONS.canicule;
  }
  if (lower.includes("orage") || lower.includes("storm") || lower.includes("thunder")) {
    return SAFETY_RECOMMENDATIONS.orage;
  }
  if (lower.includes("pluie") || lower.includes("rain") || lower.includes("flood") || lower.includes("inondation")) {
    return SAFETY_RECOMMENDATIONS.pluie;
  }
  return SAFETY_RECOMMENDATIONS.default;
}

function getAlertIcon(event: string) {
  const lower = event.toLowerCase();
  if (lower.includes("canicule") || lower.includes("chaleur") || lower.includes("heat")) {
    return <Flame className="w-5 h-5 text-orange-500" />;
  }
  if (lower.includes("orage") || lower.includes("storm") || lower.includes("thunder")) {
    return <CloudLightning className="w-5 h-5 text-purple-500" />;
  }
  if (lower.includes("pluie") || lower.includes("rain") || lower.includes("flood")) {
    return <CloudRain className="w-5 h-5 text-blue-500" />;
  }
  if (lower.includes("vent") || lower.includes("harmattan") || lower.includes("wind")) {
    return <Wind className="w-5 h-5 text-cyan-500" />;
  }
  if (lower.includes("uv") || lower.includes("soleil")) {
    return <Sun className="w-5 h-5 text-yellow-500" />;
  }
  return <AlertTriangle className="w-5 h-5 text-red-500" />;
}

function getWeatherIcon(main: string) {
  switch (main.toLowerCase()) {
    case "clear":
      return <Sun className="w-6 h-6 text-yellow-500" />;
    case "clouds":
      return <CloudSun className="w-6 h-6 text-gray-500" />;
    case "rain":
    case "drizzle":
      return <CloudRain className="w-6 h-6 text-blue-500" />;
    case "thunderstorm":
      return <CloudLightning className="w-6 h-6 text-purple-500" />;
    case "haze":
    case "mist":
    case "fog":
      return <Wind className="w-6 h-6 text-gray-400" />;
    default:
      return <CloudSun className="w-6 h-6 text-gray-500" />;
  }
}

interface WeatherAlertsProps {
  compact?: boolean;
  showCities?: boolean;
  maxAlerts?: number;
  onViewAll?: () => void;
}

export default function WeatherAlerts({ 
  compact = false, 
  showCities = true,
  maxAlerts = 3,
  onViewAll
}: WeatherAlertsProps) {
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [selectedAlert, setSelectedAlert] = useState<WeatherAlert | null>(null);

  const { data: weatherData, isLoading, refetch, isFetching } = useQuery<WeatherData>({
    queryKey: ["/api/weather"],
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: true,
  });

  if (isLoading) {
    return (
      <Card className="animate-pulse">
        <CardHeader className="pb-3">
          <div className="h-6 bg-muted rounded w-1/3"></div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="h-20 bg-muted rounded"></div>
            <div className="h-20 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!weatherData) {
    return null;
  }

  const displayAlerts = weatherData.alerts.slice(0, maxAlerts);
  const hasMoreAlerts = weatherData.alerts.length > maxAlerts;

  return (
    <div className="space-y-4">
      {/* Alertes actives */}
      {weatherData.alerts.length > 0 && (
        <Card className="border-2 border-orange-500/30 bg-orange-500/5">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <CardTitle className="flex items-center gap-2 text-lg">
                <AlertTriangle className="w-5 h-5 text-orange-500" />
                Alertes Météo Actives
                <Badge variant="secondary" className="ml-2">
                  {weatherData.alerts.length}
                </Badge>
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => refetch()}
                disabled={isFetching}
                data-testid="button-refresh-weather"
              >
                <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
              </Button>
            </div>
            <CardDescription>
              Mis à jour {weatherData.lastUpdate ? formatDistanceToNow(new Date(weatherData.lastUpdate), { locale: fr, addSuffix: true }) : "récemment"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {displayAlerts.map((alert) => (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-4 rounded-lg border cursor-pointer hover-elevate transition-all ${SEVERITY_CONFIG[alert.severity].color}`}
                onClick={() => setSelectedAlert(alert)}
                data-testid={`card-alert-${alert.id}`}
              >
                <div className="flex items-start gap-3">
                  <div className="relative">
                    {getAlertIcon(alert.event)}
                    {(alert.severity === "severe" || alert.severity === "extreme") && (
                      <span className={`absolute -top-1 -right-1 w-2 h-2 rounded-full ${SEVERITY_CONFIG[alert.severity].pulseColor} animate-ping`} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold">{alert.event}</span>
                      <Badge variant="outline" className="text-xs">
                        {SEVERITY_CONFIG[alert.severity].label}
                      </Badge>
                    </div>
                    
                    <p className="text-sm mt-1 text-muted-foreground line-clamp-2">
                      {alert.description}
                    </p>
                    
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground flex-wrap">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {alert.regions.slice(0, 3).join(", ")}
                        {alert.regions.length > 3 && ` +${alert.regions.length - 3}`}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Jusqu'au {format(new Date(alert.end * 1000), "d MMM HH:mm", { locale: fr })}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 mt-2 text-xs text-primary">
                      <Info className="w-3 h-3" />
                      <span>Cliquez pour voir les recommandations de sécurité</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}

            {hasMoreAlerts && onViewAll && (
              <Button
                variant="outline"
                className="w-full gap-2"
                onClick={onViewAll}
                data-testid="button-view-all-alerts"
              >
                Voir toutes les alertes ({weatherData.alerts.length})
                <ChevronRight className="w-4 h-4" />
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Modal détails alerte */}
      <Dialog open={!!selectedAlert} onOpenChange={() => setSelectedAlert(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedAlert && getAlertIcon(selectedAlert.event)}
              {selectedAlert?.event}
            </DialogTitle>
          </DialogHeader>
          {selectedAlert && (
            <ScrollArea className="max-h-[60vh] pr-4">
              <div className="space-y-4">
                <div className={`p-3 rounded-lg ${SEVERITY_CONFIG[selectedAlert.severity].color}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline">{SEVERITY_CONFIG[selectedAlert.severity].label}</Badge>
                    <span className="text-sm">
                      Jusqu'au {format(new Date(selectedAlert.end * 1000), "EEEE d MMMM à HH:mm", { locale: fr })}
                    </span>
                  </div>
                  <p className="text-sm">{selectedAlert.description}</p>
                </div>

                <div>
                  <h4 className="font-semibold flex items-center gap-2 mb-2">
                    <MapPin className="w-4 h-4" />
                    Régions concernées
                  </h4>
                  <div className="flex flex-wrap gap-1">
                    {selectedAlert.regions.map((region, i) => (
                      <Badge key={i} variant="secondary">{region}</Badge>
                    ))}
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-semibold flex items-center gap-2 mb-3 text-green-600 dark:text-green-400">
                    <Shield className="w-4 h-4" />
                    Recommandations de sécurité
                  </h4>
                  <ul className="space-y-2">
                    {getSafetyRecommendations(selectedAlert.event).tips.map((tip, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <span className="text-green-500 mt-0.5">•</span>
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-3">Numéros d'urgence</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center gap-2 p-2 rounded bg-muted/50">
                      <Phone className="w-4 h-4 text-red-500" />
                      <div>
                        <p className="font-medium">Pompiers</p>
                        <p className="text-muted-foreground">18</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 p-2 rounded bg-muted/50">
                      <Heart className="w-4 h-4 text-red-500" />
                      <div>
                        <p className="font-medium">SAMU</p>
                        <p className="text-muted-foreground">112</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 p-2 rounded bg-muted/50">
                      <Shield className="w-4 h-4 text-blue-500" />
                      <div>
                        <p className="font-medium">Police</p>
                        <p className="text-muted-foreground">17</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 p-2 rounded bg-muted/50">
                      <AlertTriangle className="w-4 h-4 text-orange-500" />
                      <div>
                        <p className="font-medium">Protection Civile</p>
                        <p className="text-muted-foreground">1010</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>

      {/* Conditions actuelles par ville */}
      {showCities && !compact && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <CloudSun className="w-5 h-5 text-primary" />
              Conditions Actuelles
            </CardTitle>
            <CardDescription>
              Météo dans les principales villes du Burkina Faso
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {weatherData.cities.slice(0, 8).map((city) => (
                <motion.div
                  key={city.city}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedCity === city.city ? 'bg-primary/10 border-primary/30' : 'bg-muted/30 hover:bg-muted/50'
                  }`}
                  onClick={() => setSelectedCity(selectedCity === city.city ? null : city.city)}
                  data-testid={`card-city-weather-${city.city}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-sm truncate">{city.city}</span>
                    {getWeatherIcon(city.current.weather.main)}
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-2xl font-bold">{city.current.temp}°</span>
                    {city.alerts.length > 0 && (
                      <Badge variant="destructive" className="text-xs animate-pulse">
                        {city.alerts.length}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 capitalize truncate">
                    {city.current.weather.description}
                  </p>
                </motion.div>
              ))}
            </div>

            {/* Détails de la ville sélectionnée */}
            <AnimatePresence>
              {selectedCity && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4 p-4 rounded-lg bg-muted/30 border overflow-hidden"
                >
                  {(() => {
                    const city = weatherData.cities.find(c => c.city === selectedCity);
                    if (!city) return null;

                    return (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold">{city.city}, {city.region}</h4>
                          <div className="flex items-center gap-2">
                            {getWeatherIcon(city.current.weather.main)}
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-6 w-6"
                              onClick={() => setSelectedCity(null)}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          <div className="flex items-center gap-2 p-2 rounded-lg bg-background/50">
                            <Thermometer className="w-4 h-4 text-orange-500" />
                            <div>
                              <p className="text-xs text-muted-foreground">Température</p>
                              <p className="font-medium">{city.current.temp}°C</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 p-2 rounded-lg bg-background/50">
                            <Droplets className="w-4 h-4 text-blue-500" />
                            <div>
                              <p className="text-xs text-muted-foreground">Humidité</p>
                              <p className="font-medium">{city.current.humidity}%</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 p-2 rounded-lg bg-background/50">
                            <Wind className="w-4 h-4 text-cyan-500" />
                            <div>
                              <p className="text-xs text-muted-foreground">Vent</p>
                              <p className="font-medium">{city.current.wind_speed} km/h</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 p-2 rounded-lg bg-background/50">
                            <Eye className="w-4 h-4 text-gray-500" />
                            <div>
                              <p className="text-xs text-muted-foreground">Visibilité</p>
                              <p className="font-medium">{city.current.visibility} km</p>
                            </div>
                          </div>
                        </div>

                        {city.current.uvi > 0 && (
                          <div className="flex items-center gap-2 pt-2 border-t">
                            <Sun className="w-4 h-4 text-yellow-500" />
                            <span className="text-sm">
                              Indice UV: <strong>{city.current.uvi}</strong>
                              {city.current.uvi >= 8 && (
                                <Badge variant="destructive" className="ml-2 text-xs">Très élevé - Protégez-vous!</Badge>
                              )}
                              {city.current.uvi >= 6 && city.current.uvi < 8 && (
                                <Badge variant="secondary" className="ml-2 text-xs bg-orange-500/20 text-orange-700">Élevé</Badge>
                              )}
                            </span>
                          </div>
                        )}

                        {city.alerts.length > 0 && (
                          <div className="pt-2 border-t">
                            <p className="text-sm text-muted-foreground mb-2 flex items-center gap-1">
                              <AlertTriangle className="w-4 h-4 text-orange-500" />
                              Alertes actives:
                            </p>
                            <div className="flex flex-wrap gap-1">
                              {city.alerts.map(alert => (
                                <Badge 
                                  key={alert.id} 
                                  className={`cursor-pointer ${SEVERITY_CONFIG[alert.severity].color}`}
                                  onClick={() => setSelectedAlert(alert)}
                                >
                                  {alert.event}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      )}

      {/* Info source */}
      <p className="text-xs text-muted-foreground text-center">
        Source: {weatherData.source} • Actualisé automatiquement toutes les 5 minutes
      </p>
    </div>
  );
}

// Composant compact pour la page d'accueil - Version améliorée
export function WeatherAlertsBanner() {
  const [isExpanded, setIsExpanded] = useState(false);
  const { data: weatherData, isLoading } = useQuery<WeatherData>({
    queryKey: ["/api/weather"],
    staleTime: 1000 * 60 * 5,
  });

  if (isLoading || !weatherData || weatherData.alerts.length === 0) {
    return null;
  }

  const topAlert = weatherData.alerts[0];
  const safetyTips = getSafetyRecommendations(topAlert.event);

  return (
    <Dialog open={isExpanded} onOpenChange={setIsExpanded}>
      <DialogTrigger asChild>
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-3 rounded-lg border flex items-center gap-3 cursor-pointer hover-elevate transition-all ${SEVERITY_CONFIG[topAlert.severity].color}`}
          data-testid="banner-weather-alert"
        >
          <div className="relative">
            {getAlertIcon(topAlert.event)}
            {(topAlert.severity === "severe" || topAlert.severity === "extreme") && (
              <span className={`absolute -top-1 -right-1 w-2 h-2 rounded-full ${SEVERITY_CONFIG[topAlert.severity].pulseColor} animate-ping`} />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium">{topAlert.event}</span>
              <Badge variant="outline" className="text-xs hidden sm:inline-flex">
                {SEVERITY_CONFIG[topAlert.severity].label}
              </Badge>
            </div>
            <span className="text-sm text-muted-foreground block truncate">
              {topAlert.regions.slice(0, 2).join(", ")}
              {topAlert.regions.length > 2 && ` +${topAlert.regions.length - 2}`}
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Badge variant="outline">
              {weatherData.alerts.length} alerte{weatherData.alerts.length > 1 ? 's' : ''}
            </Badge>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </div>
        </motion.div>
      </DialogTrigger>

      <DialogContent className="max-w-lg max-h-[90vh] overflow-hidden" aria-describedby="weather-alert-description">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-500" />
            Alertes Météo Actives ({weatherData.alerts.length})
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh] pr-4">
          <div className="space-y-4" id="weather-alert-description">
            {weatherData.alerts.map((alert) => (
              <div
                key={alert.id}
                className={`p-4 rounded-lg border ${SEVERITY_CONFIG[alert.severity].color}`}
              >
                <div className="flex items-start gap-3">
                  {getAlertIcon(alert.event)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold">{alert.event}</span>
                      <Badge variant="outline" className="text-xs">
                        {SEVERITY_CONFIG[alert.severity].label}
                      </Badge>
                    </div>
                    
                    <p className="text-sm mt-1">{alert.description}</p>
                    
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground flex-wrap">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {alert.regions.join(", ")}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Jusqu'au {format(new Date(alert.end * 1000), "d MMM HH:mm", { locale: fr })}
                      </span>
                    </div>

                    {/* Recommandations rapides */}
                    <div className="mt-3 pt-3 border-t border-current/10">
                      <p className="text-xs font-medium flex items-center gap-1 mb-2">
                        <Shield className="w-3 h-3" />
                        Conseils de sécurité:
                      </p>
                      <ul className="text-xs space-y-1">
                        {getSafetyRecommendations(alert.event).tips.slice(0, 3).map((tip, i) => (
                          <li key={i} className="flex items-start gap-1">
                            <span className="text-green-500">•</span>
                            {tip}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Numéros d'urgence */}
            <div className="p-4 rounded-lg bg-muted/50 border">
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <Phone className="w-4 h-4 text-red-500" />
                Numéros d'urgence
              </h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex items-center gap-2">
                  <span className="font-medium">Pompiers:</span>
                  <a href="tel:18" className="text-primary underline">18</a>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">SAMU:</span>
                  <a href="tel:112" className="text-primary underline">112</a>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">Police:</span>
                  <a href="tel:17" className="text-primary underline">17</a>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">Protection Civile:</span>
                  <a href="tel:1010" className="text-primary underline">1010</a>
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
