
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { Loader2, ExternalLink, RefreshCw, Search, Filter, Calendar, FileText, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";

interface BulletinItem {
  id: string;
  source: string;
  titre: string;
  description: string;
  lien: string;
  date: string;
  categorie?: string;
}

const SOURCES = [
  { value: "all", label: "Toutes les sources" },
  { value: "aib", label: "AIB (Agence d'Information du Burkina)" },
  { value: "lefaso", label: "Lefaso.net" },
  { value: "burkina24", label: "Burkina24" },
  { value: "rtb", label: "RTB (Radiodiffusion Télévision du Burkina)" },
  { value: "bf1", label: "BF1" },
  { value: "sidwaya", label: "Sidwaya" },
  { value: "gouvernement", label: "Site du Gouvernement" },
];

export default function Bulletin() {
  const [bulletins, setBulletins] = useState<BulletinItem[]>([]);
  const [filteredBulletins, setFilteredBulletins] = useState<BulletinItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSource, setSelectedSource] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const fetchBulletins = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/bulletin-citoyen");
      if (!response.ok) throw new Error("Erreur lors du chargement");
      const data = await response.json();
      setBulletins(data);
      setFilteredBulletins(data);
    } catch (error) {
      console.error("Erreur:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les bulletins",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBulletins();
  }, []);

  useEffect(() => {
    let filtered = bulletins;

    // Filtre par source
    if (selectedSource !== "all") {
      filtered = filtered.filter(
        (b) => b.source.toLowerCase().includes(selectedSource.toLowerCase())
      );
    }

    // Filtre par recherche
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (b) =>
          b.titre.toLowerCase().includes(query) ||
          b.description.toLowerCase().includes(query)
      );
    }

    setFilteredBulletins(filtered);
  }, [selectedSource, searchQuery, bulletins]);

  const getSourceBadgeColor = (source: string) => {
    const colors: Record<string, string> = {
      aib: "bg-blue-500",
      lefaso: "bg-green-500",
      burkina24: "bg-yellow-500",
      rtb: "bg-red-500",
      bf1: "bg-purple-500",
      sidwaya: "bg-orange-500",
      gouvernement: "bg-indigo-500",
    };
    return colors[source.toLowerCase()] || "bg-gray-500";
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="max-w-7xl mx-auto px-4 py-8 pb-24">
        {/* Bouton Retour */}
        <div className="mb-4">
          <Button
            variant="ghost"
            onClick={() => setLocation("/")}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour
          </Button>
        </div>

        {/* En-tête */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-2 flex items-center gap-3">
            <FileText className="w-8 h-8 text-primary" />
            Bulletin Citoyen
          </h1>
          <p className="text-muted-foreground text-lg">
            Informations officielles et communiqués vérifiés du Burkina Faso
          </p>
        </div>

        {/* Barre de contrôle */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Recherche */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher dans les bulletins..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Filtre par source */}
              <div className="w-full md:w-64">
                <Select value={selectedSource} onValueChange={setSelectedSource}>
                  <SelectTrigger>
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Filtrer par source" />
                  </SelectTrigger>
                  <SelectContent>
                    {SOURCES.map((source) => (
                      <SelectItem key={source.value} value={source.value}>
                        {source.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Bouton Actualiser */}
              <Button
                onClick={fetchBulletins}
                disabled={loading}
                variant="outline"
                className="gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                Actualiser
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Statistiques */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-primary">{bulletins.length}</div>
              <div className="text-sm text-muted-foreground">Total bulletins</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{filteredBulletins.length}</div>
              <div className="text-sm text-muted-foreground">Résultats</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{SOURCES.length - 1}</div>
              <div className="text-sm text-muted-foreground">Sources</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-orange-600">
                {bulletins.length > 0
                  ? new Date(bulletins[0]?.date).toLocaleDateString("fr-FR", {
                      day: "numeric",
                      month: "short",
                    })
                  : "-"}
              </div>
              <div className="text-sm text-muted-foreground">Dernière MAJ</div>
            </CardContent>
          </Card>
        </div>

        {/* Liste des bulletins */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filteredBulletins.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <FileText className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-xl font-semibold mb-2">Aucun bulletin trouvé</h3>
              <p className="text-muted-foreground">
                {searchQuery || selectedSource !== "all"
                  ? "Essayez de modifier vos filtres de recherche"
                  : "Les bulletins seront affichés ici une fois disponibles"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBulletins.map((bulletin) => (
              <Card
                key={bulletin.id}
                className="hover:shadow-lg transition-shadow cursor-pointer"
              >
                <CardHeader>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <Badge className={`${getSourceBadgeColor(bulletin.source)} text-white`}>
                      {bulletin.source}
                    </Badge>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="w-3 h-3" />
                      {new Date(bulletin.date).toLocaleDateString("fr-FR")}
                    </div>
                  </div>
                  <CardTitle className="text-lg leading-tight">
                    {bulletin.titre}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                    {bulletin.description}
                  </p>
                  <Button
                    variant="outline"
                    className="w-full gap-2"
                    onClick={() => window.open(bulletin.lien, "_blank")}
                  >
                    <ExternalLink className="w-4 h-4" />
                    Lire l'article
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
