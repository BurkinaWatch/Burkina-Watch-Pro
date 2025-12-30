import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  CloudLightning
} from "lucide-react";
import { useState } from "react";
import { format, formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

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
  minor: { label: "Faible", color: "bg-green-500/20 text-green-700 dark:text-green-400 border-green-500/30" },
  moderate: { label: "Modere", color: "bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 border-yellow-500/30" },
  severe: { label: "Severe", color: "bg-orange-500/20 text-orange-700 dark:text-orange-400 border-orange-500/30" },
  extreme: { label: "Critique", color: "bg-red-500/20 text-red-700 dark:text-red-400 border-red-500/30" },
};

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
                Alertes Meteo Actives
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
              Mis a jour {weatherData.lastUpdate ? formatDistanceToNow(new Date(weatherData.lastUpdate), { locale: fr, addSuffix: true }) : "recemment"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {displayAlerts.map((alert) => (
              <div
                key={alert.id}
                className={`p-4 rounded-lg border ${SEVERITY_CONFIG[alert.severity].color}`}
                data-testid={`card-alert-${alert.id}`}
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
                  </div>
                </div>
              </div>
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

      {/* Conditions actuelles par ville */}
      {showCities && !compact && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <CloudSun className="w-5 h-5 text-primary" />
              Conditions Actuelles
            </CardTitle>
            <CardDescription>
              Meteo dans les principales villes du Burkina Faso
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {weatherData.cities.slice(0, 8).map((city) => (
                <div
                  key={city.city}
                  className={`p-3 rounded-lg border hover-elevate cursor-pointer transition-colors ${
                    selectedCity === city.city ? 'bg-primary/10 border-primary/30' : 'bg-muted/30'
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
                      <Badge variant="destructive" className="text-xs">
                        {city.alerts.length}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 capitalize truncate">
                    {city.current.weather.description}
                  </p>
                </div>
              ))}
            </div>

            {/* Details de la ville selectionnee */}
            {selectedCity && (
              <div className="mt-4 p-4 rounded-lg bg-muted/30 border">
                {(() => {
                  const city = weatherData.cities.find(c => c.city === selectedCity);
                  if (!city) return null;

                  return (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold">{city.city}, {city.region}</h4>
                        {getWeatherIcon(city.current.weather.main)}
                      </div>
                      
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="flex items-center gap-2">
                          <Thermometer className="w-4 h-4 text-orange-500" />
                          <div>
                            <p className="text-xs text-muted-foreground">Temperature</p>
                            <p className="font-medium">{city.current.temp}°C</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Droplets className="w-4 h-4 text-blue-500" />
                          <div>
                            <p className="text-xs text-muted-foreground">Humidite</p>
                            <p className="font-medium">{city.current.humidity}%</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Wind className="w-4 h-4 text-cyan-500" />
                          <div>
                            <p className="text-xs text-muted-foreground">Vent</p>
                            <p className="font-medium">{city.current.wind_speed} km/h</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Eye className="w-4 h-4 text-gray-500" />
                          <div>
                            <p className="text-xs text-muted-foreground">Visibilite</p>
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
                              <Badge variant="destructive" className="ml-2 text-xs">Tres eleve</Badge>
                            )}
                          </span>
                        </div>
                      )}

                      {city.alerts.length > 0 && (
                        <div className="pt-2 border-t">
                          <p className="text-sm text-muted-foreground mb-2">Alertes actives:</p>
                          {city.alerts.map(alert => (
                            <Badge 
                              key={alert.id} 
                              className={`mr-1 mb-1 ${SEVERITY_CONFIG[alert.severity].color}`}
                            >
                              {alert.event}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Info source */}
      <p className="text-xs text-muted-foreground text-center">
        Source: {weatherData.source}
      </p>
    </div>
  );
}

// Composant compact pour la page d'accueil
export function WeatherAlertsBanner() {
  const { data: weatherData, isLoading } = useQuery<WeatherData>({
    queryKey: ["/api/weather"],
    staleTime: 1000 * 60 * 5,
  });

  if (isLoading || !weatherData || weatherData.alerts.length === 0) {
    return null;
  }

  const topAlert = weatherData.alerts[0];

  return (
    <div 
      className={`p-3 rounded-lg border flex items-center gap-3 ${SEVERITY_CONFIG[topAlert.severity].color}`}
      data-testid="banner-weather-alert"
    >
      {getAlertIcon(topAlert.event)}
      <div className="flex-1 min-w-0">
        <span className="font-medium">{topAlert.event}</span>
        <span className="text-sm text-muted-foreground ml-2">
          - {topAlert.regions.slice(0, 2).join(", ")}
        </span>
      </div>
      <Badge variant="outline" className="shrink-0">
        {weatherData.alerts.length} alerte{weatherData.alerts.length > 1 ? 's' : ''}
      </Badge>
    </div>
  );
}
