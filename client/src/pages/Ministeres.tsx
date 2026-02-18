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
import { Search, MapPin, Phone, Clock, ArrowLeft, RefreshCw, Globe, Mail, Building2, Crown, Star, Users, Navigation, Briefcase, Shield, ExternalLink, ChevronDown, ChevronUp, Landmark, BookOpen, Award } from "lucide-react";
import { VoiceSearchInput } from "@/components/VoiceSearchInput";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";

interface Ministere {
  id: string;
  nom: string;
  nomCourt: string;
  ministre: string;
  rang: "Presidence" | "Primature" | "Ministre d'Etat" | "Ministre" | "Ministre Delegue";
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
  titreComplet?: string;
  dateNomination?: string;
  biographie?: string[];
  reseauxSociaux?: { plateforme: string; url: string }[];
  servicesRattaches?: string[];
}

interface ApiResponse {
  institutions: Ministere[];
  ministeres: Ministere[];
  total: number;
  ministresEtat: number;
  ministresCount: number;
  deleguesCount: number;
}

const rangColors: Record<string, string> = {
  "Presidence": "bg-amber-700 text-white",
  "Primature": "bg-emerald-700 text-white",
  "Ministre d'Etat": "bg-red-600 text-white",
  "Ministre": "bg-blue-600 text-white",
  "Ministre Delegue": "bg-purple-600 text-white",
};

const rangIcons: Record<string, typeof Crown> = {
  "Presidence": Shield,
  "Primature": Landmark,
  "Ministre d'Etat": Crown,
  "Ministre": Briefcase,
  "Ministre Delegue": Users,
};

function InstitutionCard({ institution, isExpanded, onToggle }: { institution: Ministere; isExpanded: boolean; onToggle: () => void }) {
  const isPresidence = institution.rang === "Presidence";
  const borderColor = isPresidence ? "border-amber-600/30" : "border-emerald-600/30";
  const gradientBg = isPresidence
    ? "bg-gradient-to-br from-amber-600/5 via-red-600/5 to-green-600/5"
    : "bg-gradient-to-br from-emerald-600/5 via-blue-600/5 to-green-600/5";
  const iconColor = isPresidence ? "text-amber-700 dark:text-amber-500" : "text-emerald-700 dark:text-emerald-500";
  const badgeColor = rangColors[institution.rang];

  return (
    <Card
      className={`cursor-pointer transition-all hover-elevate border-2 ${borderColor} ${gradientBg} ${isExpanded ? "ring-2 ring-primary" : ""}`}
      onClick={onToggle}
      data-testid={`card-institution-${institution.id}`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <Badge className={`${badgeColor} text-xs`}>
                {isPresidence ? <Shield className="h-3 w-3 mr-1" /> : <Landmark className="h-3 w-3 mr-1" />}
                {institution.rang}
              </Badge>
              {institution.dateNomination && (
                <Badge variant="outline" className="text-xs">
                  Depuis {institution.dateNomination}
                </Badge>
              )}
            </div>
            <CardTitle className="text-lg leading-tight">{institution.nom}</CardTitle>
          </div>
          <div className={`p-2.5 rounded-xl ${isPresidence ? "bg-amber-500/10" : "bg-emerald-500/10"}`}>
            {isPresidence ? <Shield className={`w-6 h-6 ${iconColor}`} /> : <Landmark className={`w-6 h-6 ${iconColor}`} />}
          </div>
        </div>
        <div className="flex items-center gap-2 mt-2">
          <Award className="h-4 w-4 text-amber-500 shrink-0" />
          <span className="text-sm font-bold text-foreground">{institution.ministre}</span>
        </div>
        {institution.titreComplet && (
          <p className="text-xs text-muted-foreground mt-1 italic">{institution.titreComplet}</p>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-1">
          {institution.domaines.map((d, i) => (
            <Badge key={i} variant="outline" className="text-xs">
              {d}
            </Badge>
          ))}
        </div>

        {isExpanded && (
          <div className="space-y-4 pt-3 border-t">
            {institution.biographie && institution.biographie.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                  <BookOpen className="h-3 w-3" /> Biographie :
                </p>
                <div className="space-y-1">
                  {institution.biographie.map((line, i) => (
                    <p key={i} className="text-xs text-foreground flex items-start gap-2">
                      <span className="shrink-0 mt-1 w-1.5 h-1.5 rounded-full bg-muted-foreground/50" />
                      {line}
                    </p>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-start gap-2 text-sm">
              <MapPin className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
              <div>
                <p className="text-foreground">{institution.adresse}</p>
                <p className="text-muted-foreground text-xs">{institution.quartier}, {institution.ville}</p>
                {institution.bp && (
                  <p className="text-muted-foreground text-xs">{institution.bp}</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-foreground text-xs">{institution.horaires}</span>
            </div>

            {institution.telephone && (
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="text-foreground text-xs">{institution.telephone}</span>
                {institution.telephoneSecondaire && (
                  <span className="text-muted-foreground text-xs">/ {institution.telephoneSecondaire}</span>
                )}
              </div>
            )}

            {institution.email && (
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-foreground text-xs">{institution.email}</span>
              </div>
            )}

            {institution.website && (
              <div className="flex items-center gap-2 text-sm">
                <Globe className="h-4 w-4 text-muted-foreground" />
                <a
                  href={institution.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary text-xs underline"
                  onClick={(e) => e.stopPropagation()}
                  data-testid={`link-website-${institution.id}`}
                >
                  {institution.website.replace("https://", "").replace("www.", "")}
                </a>
              </div>
            )}

            {institution.reseauxSociaux && institution.reseauxSociaux.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">Reseaux sociaux et liens :</p>
                <div className="flex flex-wrap gap-2">
                  {institution.reseauxSociaux.map((rs, i) => (
                    <a
                      key={i}
                      href={rs.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1"
                      onClick={(e) => e.stopPropagation()}
                      data-testid={`link-social-${institution.id}-${i}`}
                    >
                      <Badge variant="outline" className="text-xs cursor-pointer">
                        <ExternalLink className="h-2.5 w-2.5 mr-1" />
                        {rs.plateforme}
                      </Badge>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {institution.servicesRattaches && institution.servicesRattaches.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">Services et institutions rattaches :</p>
                <div className="flex flex-wrap gap-1">
                  {institution.servicesRattaches.map((s, i) => (
                    <Badge key={i} variant="secondary" className="text-xs">
                      {s}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">Attributions principales :</p>
              <div className="flex flex-wrap gap-1">
                {institution.attributions.map((a, i) => (
                  <Badge key={i} variant="secondary" className="text-xs">
                    {a}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              {institution.telephone && (
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    window.location.href = `tel:${institution.telephone}`;
                  }}
                  data-testid={`button-call-${institution.id}`}
                >
                  <Phone className="h-3 w-3 mr-1" />
                  Appeler
                </Button>
              )}
              {institution.email && (
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    window.location.href = `mailto:${institution.email}`;
                  }}
                  data-testid={`button-email-${institution.id}`}
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
                  const url = `https://www.google.com/maps/dir/?api=1&destination=${institution.latitude},${institution.longitude}`;
                  window.open(url, "_blank");
                }}
                data-testid={`button-navigate-${institution.id}`}
              >
                <Navigation className="h-3 w-3 mr-1" />
                Itineraire
              </Button>
            </div>
          </div>
        )}

        {!isExpanded && (
          <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground pt-1">
            <ChevronDown className="h-3 w-3" />
            Appuyez pour voir les details complets
          </div>
        )}
        {isExpanded && (
          <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground pt-1">
            <ChevronUp className="h-3 w-3" />
            Reduire
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function Ministeres() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRang, setSelectedRang] = useState("all");
  const [expandedMinistere, setExpandedMinistere] = useState<string | null>(null);
  const [expandedInstitution, setExpandedInstitution] = useState<string | null>(null);

  const { data: apiData, isLoading, refetch } = useQuery<ApiResponse>({
    queryKey: ["/api/ministeres"],
  });

  const ministeres = apiData?.ministeres || [];
  const institutions = apiData?.institutions || [];

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
        <title>Presidence, Primature & Ministeres - Burkina Watch</title>
        <meta name="description" content="Presidence du Faso, Primature et annuaire complet des ministeres du Burkina Faso - Contacts, attributions et informations detaillees" />
        <meta property="og:title" content="Presidence, Primature & Ministeres du Burkina Faso - Burkina Watch" />
        <meta property="og:description" content="Presidence du Faso, Primature et annuaire complet des ministeres du Burkina Faso" />
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
              Institutions du Burkina Faso
            </h1>
            <p className="text-sm text-muted-foreground">
              Presidence, Primature & Gouvernement
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
                <p className="text-xs text-muted-foreground">La Patrie ou la Mort, nous Vaincrons</p>
                <p className="text-xs text-muted-foreground">Remaniement du 12 janvier 2026 - {(apiData?.total || 0) + (apiData?.institutions?.length || 0)} institutions</p>
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Badge className="bg-amber-700 text-white no-default-hover-elevate">
                <Shield className="h-3 w-3 mr-1" />
                Presidence
              </Badge>
              <Badge className="bg-emerald-700 text-white no-default-hover-elevate">
                <Landmark className="h-3 w-3 mr-1" />
                Primature
              </Badge>
              <Badge className="bg-red-600 text-white no-default-hover-elevate">
                <Crown className="h-3 w-3 mr-1" />
                {apiData?.ministresEtat || 0} Min. d'Etat
              </Badge>
              <Badge className="bg-blue-600 text-white no-default-hover-elevate">
                <Briefcase className="h-3 w-3 mr-1" />
                {apiData?.ministresCount || 0} Ministres
              </Badge>
              <Badge className="bg-purple-600 text-white no-default-hover-elevate">
                <Users className="h-3 w-3 mr-1" />
                {apiData?.deleguesCount || 0} Delegues
              </Badge>
            </div>
          </div>
        </div>

        {institutions.length > 0 && (
          <div className="space-y-4 mb-8">
            <h2 className="text-lg font-semibold flex items-center gap-2" data-testid="text-institutions-header">
              <Shield className="h-5 w-5 text-amber-700 dark:text-amber-500" />
              Presidence & Primature
            </h2>
            {institutions.map(inst => (
              <InstitutionCard
                key={inst.id}
                institution={inst}
                isExpanded={expandedInstitution === inst.id}
                onToggle={() => setExpandedInstitution(expandedInstitution === inst.id ? null : inst.id)}
              />
            ))}
          </div>
        )}

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