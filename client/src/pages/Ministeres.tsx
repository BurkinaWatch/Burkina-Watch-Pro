import { useState, useMemo, useCallback } from "react";
import { Helmet } from "react-helmet-async";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import EmergencyPanel from "@/components/EmergencyPanel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, MapPin, Phone, Clock, ArrowLeft, RefreshCw, Globe, Mail, Building2, Crown, Star, Users, Navigation, Briefcase, Shield } from "lucide-react";
import { VoiceSearchInput } from "@/components/VoiceSearchInput";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";

interface Ministere {
  id: string;
  nom: string;
  nomCourt: string;
  ministre: string;
  rang: "Ministre d'Etat" | "Ministre" | "Ministre Delegue";
  domaines: string[];
  adresse: string;
  quartier: string;
  ville: string;
  telephone?: string;
  telephoneSecondaire?: string;
  email?: string;
  website?: string;
  bp?: string;
  horaires: string;
  latitude: number;
  longitude: number;
  porteparole?: boolean;
  gardeDesSceaux?: boolean;
  attributions: string[];
}

interface ApiResponse {
  ministeres: Ministere[];
  total: number;
  ministresEtat: number;
  ministresCount: number;
  deleguesCount: number;
}

const rangColors: Record<string, string> = {
  "Ministre d'Etat": "bg-red-600 text-white",
  "Ministre": "bg-blue-600 text-white",
  "Ministre Delegue": "bg-purple-600 text-white",
};

const rangIcons: Record<string, typeof Crown> = {
  "Ministre d'Etat": Crown,
  "Ministre": Briefcase,
  "Ministre Delegue": Users,
};

export default function Ministeres() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRang, setSelectedRang] = useState("all");
  const [expandedMinistere, setExpandedMinistere] = useState<string | null>(null);

  const { data: apiData, isLoading, refetch } = useQuery<ApiResponse>({
    queryKey: ["/api/ministeres"],
  });

  const ministeres = apiData?.ministeres || [];

  const filteredMinisteres = useMemo(() => {
    let result = Array.isArray(ministeres) ? ministeres : [];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(m =>
        m.nom.toLowerCase().includes(query) ||
        m.nomCourt.toLowerCase().includes(query) ||
        m.ministre.toLowerCase().includes(query) ||
        m.domaines.some(d => d.toLowerCase().includes(query)) ||
        m.attributions.some(a => a.toLowerCase().includes(query))
      );
    }

    if (selectedRang !== "all") {
      result = result.filter(m => m.rang === selectedRang);
    }

    const rangOrder: Record<string, number> = { "Ministre d'Etat": 0, "Ministre": 1, "Ministre Delegue": 2 };
    result = [...result].sort((a, b) => {
      const diff = (rangOrder[a.rang] ?? 99) - (rangOrder[b.rang] ?? 99);
      if (diff !== 0) return diff;
      return a.nom.localeCompare(b.nom);
    });

    return result;
  }, [ministeres, searchQuery, selectedRang]);

  const handleCall = useCallback((telephone?: string) => {
    if (telephone) {
      window.location.href = `tel:${telephone}`;
    }
  }, []);

  const handleNavigate = useCallback((ministere: Ministere) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${ministere.latitude},${ministere.longitude}`;
    window.open(url, "_blank");
  }, []);

  const handleRefresh = async () => {
    try {
      await refetch();
      toast({ title: "Actualisation", description: "Donnees des ministeres actualisees" });
    } catch (error) {
      toast({ title: "Erreur", description: "Impossible d'actualiser les donnees", variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Helmet>
        <title>Ministeres du Burkina Faso - Burkina Watch</title>
        <meta name="description" content="Annuaire complet des ministeres du Burkina Faso - Contacts, attributions et informations detaillees" />
        <meta property="og:title" content="Ministeres du Burkina Faso - Burkina Watch" />
        <meta property="og:description" content="Annuaire complet des ministeres du Burkina Faso - Contacts, attributions et informations detaillees" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="/ministeres" />
        <meta name="twitter:card" content="summary" />
      </Helmet>
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-6 pb-24">
        <div className="flex items-center gap-3 mb-6">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => setLocation("/")}
            data-testid="button-back"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold flex items-center gap-2" data-testid="text-page-title">
              <Building2 className="h-6 w-6 text-red-600 dark:text-red-500" />
              Ministeres du Burkina Faso
            </h1>
            <p className="text-sm text-muted-foreground">
              Gouvernement du Premier Ministre Rimtalba Jean Emmanuel OUEDRAOGO
            </p>
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={handleRefresh}
            data-testid="button-refresh"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>

        <div className="bg-gradient-to-r from-red-600/10 via-green-600/10 to-red-600/10 border border-red-600/20 rounded-lg p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="h-8 w-8 text-red-600 dark:text-red-500" />
              <div>
                <p className="text-sm font-semibold">Republique du Burkina Faso</p>
                <p className="text-xs text-muted-foreground">President du Faso: Capitaine Ibrahim TRAORE</p>
                <p className="text-xs text-muted-foreground">Remaniement du 12 janvier 2026 - {apiData?.total || 0} ministres</p>
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Badge className="bg-red-600 text-white">
                <Crown className="h-3 w-3 mr-1" />
                {apiData?.ministresEtat || 0} Ministres d'Etat
              </Badge>
              <Badge className="bg-blue-600 text-white">
                <Briefcase className="h-3 w-3 mr-1" />
                {apiData?.ministresCount || 0} Ministres
              </Badge>
              <Badge className="bg-purple-600 text-white">
                <Users className="h-3 w-3 mr-1" />
                {apiData?.deleguesCount || 0} Delegues
              </Badge>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-4 mb-6">
          <Card 
            className={`hover-elevate cursor-pointer flex-1 min-w-[140px] ${selectedRang === "Ministre d'Etat" ? "ring-2 ring-red-500" : ""}`}
            onClick={() => setSelectedRang(selectedRang === "Ministre d'Etat" ? "all" : "Ministre d'Etat")}
            data-testid="card-stat-etat"
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between gap-1">
                <div>
                  <p className="text-xs text-muted-foreground">Ministres d'Etat</p>
                  <span className="text-2xl font-bold tracking-tight" data-testid="text-etat-count">{apiData?.ministresEtat || 0}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-red-500/10">
                  <Crown className="w-5 h-5 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card 
            className={`hover-elevate cursor-pointer flex-1 min-w-[140px] ${selectedRang === "Ministre" ? "ring-2 ring-blue-500" : ""}`}
            onClick={() => setSelectedRang(selectedRang === "Ministre" ? "all" : "Ministre")}
            data-testid="card-stat-ministres"
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between gap-1">
                <div>
                  <p className="text-xs text-muted-foreground">Ministres</p>
                  <span className="text-2xl font-bold tracking-tight" data-testid="text-ministres-count">{apiData?.ministresCount || 0}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-blue-500/10">
                  <Briefcase className="w-5 h-5 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card 
            className={`hover-elevate cursor-pointer flex-1 min-w-[140px] ${selectedRang === "Ministre Delegue" ? "ring-2 ring-purple-500" : ""}`}
            onClick={() => setSelectedRang(selectedRang === "Ministre Delegue" ? "all" : "Ministre Delegue")}
            data-testid="card-stat-delegues"
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between gap-1">
                <div>
                  <p className="text-xs text-muted-foreground">Ministres Delegues</p>
                  <span className="text-2xl font-bold tracking-tight" data-testid="text-delegues-count">{apiData?.deleguesCount || 0}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-purple-500/10">
                  <Users className="w-5 h-5 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 relative z-50">
            <div className="relative flex gap-2 md:col-span-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher un ministere, un ministre, un domaine..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                  data-testid="input-search"
                />
              </div>
              <VoiceSearchInput onQueryChange={setSearchQuery} />
            </div>

            <div className="relative z-50">
              <Select value={selectedRang} onValueChange={setSelectedRang}>
                <SelectTrigger data-testid="select-rang">
                  <SelectValue placeholder="Tous les rangs" />
                </SelectTrigger>
                <SelectContent className="z-[60]">
                  <SelectItem value="all">Tous les rangs</SelectItem>
                  <SelectItem value="Ministre d'Etat">Ministres d'Etat</SelectItem>
                  <SelectItem value="Ministre">Ministres</SelectItem>
                  <SelectItem value="Ministre Delegue">Ministres Delegues</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between mb-4 mt-6">
          <h2 className="text-lg font-semibold" data-testid="text-results-count">
            {filteredMinisteres.length} ministere{filteredMinisteres.length !== 1 ? "s" : ""} trouve{filteredMinisteres.length !== 1 ? "s" : ""}
          </h2>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-4">
            {Array.isArray(filteredMinisteres) && filteredMinisteres.map(ministere => {
              const isExpanded = expandedMinistere === ministere.id;
              const RangIcon = rangIcons[ministere.rang] || Briefcase;
              return (
                <Card 
                  key={ministere.id} 
                  className={`cursor-pointer transition-all hover-elevate ${isExpanded ? "ring-2 ring-primary" : ""}`}
                  onClick={() => setExpandedMinistere(isExpanded ? null : ministere.id)}
                  data-testid={`card-ministere-${ministere.id}`}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <Badge className={`${rangColors[ministere.rang]} text-xs`}>
                            <RangIcon className="h-3 w-3 mr-1" />
                            {ministere.rang}
                          </Badge>
                          {ministere.porteparole && (
                            <Badge variant="outline" className="text-xs border-amber-500 text-amber-700 dark:text-amber-400">
                              Porte-parole
                            </Badge>
                          )}
                          {ministere.gardeDesSceaux && (
                            <Badge variant="outline" className="text-xs border-blue-500 text-blue-700 dark:text-blue-400">
                              Garde des Sceaux
                            </Badge>
                          )}
                        </div>
                        <CardTitle className="text-base leading-tight">{ministere.nom}</CardTitle>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <Star className="h-4 w-4 text-amber-500 shrink-0" />
                      <span className="text-sm font-medium text-foreground">{ministere.ministre}</span>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex flex-wrap gap-1">
                      {ministere.domaines.map((d, i) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {d}
                        </Badge>
                      ))}
                    </div>

                    {isExpanded && (
                      <div className="space-y-3 pt-2 border-t">
                        <div className="flex items-start gap-2 text-sm">
                          <MapPin className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                          <div>
                            <p className="text-foreground">{ministere.adresse}</p>
                            <p className="text-muted-foreground text-xs">{ministere.quartier}, {ministere.ville}</p>
                            {ministere.bp && (
                              <p className="text-muted-foreground text-xs">{ministere.bp}</p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span className="text-foreground text-xs">{ministere.horaires}</span>
                        </div>

                        {ministere.telephone && (
                          <div className="flex items-center gap-2 text-sm">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            <span className="text-foreground text-xs">{ministere.telephone}</span>
                            {ministere.telephoneSecondaire && (
                              <span className="text-muted-foreground text-xs">/ {ministere.telephoneSecondaire}</span>
                            )}
                          </div>
                        )}

                        {ministere.email && (
                          <div className="flex items-center gap-2 text-sm">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <span className="text-foreground text-xs">{ministere.email}</span>
                          </div>
                        )}

                        {ministere.website && (
                          <div className="flex items-center gap-2 text-sm">
                            <Globe className="h-4 w-4 text-muted-foreground" />
                            <a 
                              href={ministere.website} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="text-primary text-xs underline"
                              onClick={(e) => e.stopPropagation()}
                              data-testid={`link-website-${ministere.id}`}
                            >
                              {ministere.website.replace("https://", "").replace("www.", "")}
                            </a>
                          </div>
                        )}

                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-2">Attributions principales :</p>
                          <div className="flex flex-wrap gap-1">
                            {ministere.attributions.map((a, i) => (
                              <Badge key={i} variant="secondary" className="text-xs">
                                {a}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        <div className="flex gap-2 pt-2">
                          {ministere.telephone && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCall(ministere.telephone);
                              }}
                              data-testid={`button-call-${ministere.id}`}
                            >
                              <Phone className="h-3 w-3 mr-1" />
                              Appeler
                            </Button>
                          )}
                          {ministere.email && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1"
                              onClick={(e) => {
                                e.stopPropagation();
                                window.location.href = `mailto:${ministere.email}`;
                              }}
                              data-testid={`button-email-${ministere.id}`}
                            >
                              <Mail className="h-3 w-3 mr-1" />
                              Email
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleNavigate(ministere);
                            }}
                            data-testid={`button-navigate-${ministere.id}`}
                          >
                            <Navigation className="h-3 w-3 mr-1" />
                            Itineraire
                          </Button>
                        </div>
                      </div>
                    )}

                    {!isExpanded && (
                      <p className="text-xs text-muted-foreground">
                        Appuyez pour voir les details et contacts
                      </p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {!isLoading && filteredMinisteres.length === 0 && (
          <Card className="p-12 text-center">
            <CardContent>
              <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Aucun ministere trouve</h3>
              <p className="text-sm text-muted-foreground">
                Essayez de modifier vos filtres ou votre recherche
              </p>
            </CardContent>
          </Card>
        )}
      </main>

      <BottomNav />
      <EmergencyPanel />
    </div>
  );
}
