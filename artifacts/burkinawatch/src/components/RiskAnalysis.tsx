import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import {
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Minus,
  MapPin,
  Shield,
  Stethoscope,
  Phone,
  Plus,
  Bell,
  ClipboardCheck,
  Car,
  Pill,
  ChevronRight,
  Info,
  Lightbulb,
  AlertCircle,
} from "lucide-react";

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

interface Recommendation {
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

const iconMap: Record<string, typeof AlertTriangle> = {
  AlertTriangle,
  Shield,
  Stethoscope,
  Phone,
  Plus,
  Bell,
  ClipboardCheck,
  Car,
  Pill,
  Info,
  Lightbulb,
};

const riskLevelColors: Record<string, string> = {
  faible: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  moyen: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  eleve: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  critique: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

const riskLevelLabels: Record<string, string> = {
  faible: "Faible",
  moyen: "Moyen",
  eleve: "Eleve",
  critique: "Critique",
};

const priorityColors: Record<string, string> = {
  haute: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  moyenne: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  basse: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
};

function TrendIcon({ trend }: { trend: string }) {
  if (trend === "hausse") return <TrendingUp className="w-4 h-4 text-red-500" />;
  if (trend === "baisse") return <TrendingDown className="w-4 h-4 text-green-500" />;
  return <Minus className="w-4 h-4 text-muted-foreground" />;
}

function RiskZoneCard({ zone }: { zone: RiskZone }) {
  return (
    <Card className="overflow-visible" data-testid={`card-risk-zone-${zone.id}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <span className="font-medium text-sm" data-testid="text-zone-location">{zone.localisation}</span>
          </div>
          <Badge className={riskLevelColors[zone.riskLevel]} data-testid="badge-risk-level">
            {riskLevelLabels[zone.riskLevel]}
          </Badge>
        </div>
        
        <p className="text-sm text-muted-foreground mt-2">{zone.description}</p>
        
        <div className="flex items-center justify-between gap-2 mt-3 flex-wrap">
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span>{zone.incidentCount} incidents</span>
            <span className="flex items-center gap-1">
              <TrendIcon trend={zone.trend} />
              {zone.trend === "hausse" ? "En hausse" : zone.trend === "baisse" ? "En baisse" : "Stable"}
            </span>
          </div>
          <div className="flex flex-wrap gap-1">
            {zone.categories.slice(0, 2).map(cat => (
              <Badge key={cat.categorie} variant="outline" className="text-xs">
                {cat.categorie}
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function RecommendationCard({ rec }: { rec: Recommendation }) {
  const IconComponent = iconMap[rec.icon] || Info;
  
  const typeConfig = {
    alerte: { bg: "bg-red-50 dark:bg-red-950", border: "border-red-200 dark:border-red-800" },
    conseil: { bg: "bg-blue-50 dark:bg-blue-950", border: "border-blue-200 dark:border-blue-800" },
    info: { bg: "bg-gray-50 dark:bg-gray-900", border: "border-gray-200 dark:border-gray-700" },
    action: { bg: "bg-green-50 dark:bg-green-950", border: "border-green-200 dark:border-green-800" },
  };
  
  const config = typeConfig[rec.type] || typeConfig.info;
  
  return (
    <Card className={`overflow-visible ${config.bg} border ${config.border}`} data-testid={`card-recommendation-${rec.id}`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-md bg-background">
            <IconComponent className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 flex-wrap">
              <h4 className="font-medium text-sm" data-testid="text-recommendation-title">{rec.title}</h4>
              <Badge className={`${priorityColors[rec.priority]} text-xs`} data-testid="badge-priority">
                {rec.priority === "haute" ? "!" : rec.priority === "moyenne" ? "i" : ""}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1" data-testid="text-recommendation-description">{rec.description}</p>
            {rec.actionUrl && (
              <Link href={rec.actionUrl}>
                <Button variant="ghost" size="sm" className="mt-2 -ml-2" data-testid="button-recommendation-action">
                  Voir plus
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function RiskZonesPanel() {
  const { data: zones, isLoading, error } = useQuery<RiskZone[]>({
    queryKey: ["/api/risk-zones"],
    staleTime: 5 * 60 * 1000,
  });
  
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Zones a risque
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }
  
  if (error || !zones) {
    return null;
  }
  
  if (zones.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Zones a risque
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Aucune zone a risque detectee pour le moment.
          </p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card data-testid="container-risk-zones">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-orange-500" />
          Zones a risque ({zones.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {zones.slice(0, 5).map(zone => (
          <RiskZoneCard key={zone.id} zone={zone} />
        ))}
        {zones.length > 5 && (
          <Link href="/carte">
            <Button variant="outline" className="w-full" data-testid="button-view-all-zones">
              Voir toutes les zones sur la carte
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        )}
      </CardContent>
    </Card>
  );
}

export function RecommendationsPanel() {
  const { user } = useAuth();
  
  const { data: recommendations, isLoading, error } = useQuery<Recommendation[]>({
    queryKey: ["/api/recommendations"],
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });
  
  if (!user) {
    return null;
  }
  
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5" />
            Recommandations
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }
  
  if (error || !recommendations || recommendations.length === 0) {
    return null;
  }
  
  return (
    <Card data-testid="container-recommendations">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-yellow-500" />
          Pour vous
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {recommendations.slice(0, 5).map(rec => (
          <RecommendationCard key={rec.id} rec={rec} />
        ))}
      </CardContent>
    </Card>
  );
}

export function RiskAnalysisSummary() {
  const { data: stats, isLoading } = useQuery<{
    totalIncidents: number;
    topCategories: { categorie: string; count: number }[];
    analysisDate: string;
  }>({
    queryKey: ["/api/risk-stats"],
    staleTime: 10 * 60 * 1000,
  });
  
  if (isLoading || !stats) {
    return null;
  }
  
  return (
    <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
      <span className="flex items-center gap-1">
        <AlertCircle className="w-4 h-4" />
        {stats.totalIncidents} incidents (30j)
      </span>
      {stats.topCategories.slice(0, 2).map(cat => (
        <Badge key={cat.categorie} variant="outline">
          {cat.categorie}: {cat.count}
        </Badge>
      ))}
    </div>
  );
}
