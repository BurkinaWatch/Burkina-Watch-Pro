
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { Loader2, ExternalLink, RefreshCw, Search, Filter, Calendar, FileText, Sparkles, TrendingUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface BulletinItem {
  id: string;
  source: string;
  titre: string;
  description: string;
  lien: string;
  date: string;
  categorie?: string;
}

interface AnalyzedArticle {
  id: string;
  titre: string;
  resume: string;
  categorie: string;
  source: string;
  lien: string;
  date: string;
  pertinence: number;
  motsCles: string[];
}

const CATEGORIES = [
  "Tous",
  "Sécurité",
  "Routes",
  "Santé",
  "Gouvernement",
  "Social",
  "Économie",
  "Culture",
  "Éducation",
  "Environnement",
  "Justice"
];

export default function Bulletin() {
  const [bulletins, setBulletins] = useState<BulletinItem[]>([]);
  const [analyzedArticles, setAnalyzedArticles] = useState<AnalyzedArticle[]>([]);
  const [filteredBulletins, setFilteredBulletins] = useState<BulletinItem[]>([]);
  const [filteredAnalyzed, setFilteredAnalyzed] = useState<AnalyzedArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("Tous");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"simple" | "ai">("ai");
  const [aiAvailable, setAiAvailable] = useState(false);
  const { toast } = useToast();

  // Vérifier si l'IA est disponible
  useEffect(() => {
    fetch("/api/bulletin-citoyen/ai/status")
      .then(res => res.json())
      .then(data => setAiAvailable(data.available))
      .catch(() => setAiAvailable(false));
  }, []);

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

  const fetchAnalyzedArticles = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/bulletin-citoyen/ai");
      if (!response.ok) throw new Error("Erreur lors de l'analyse");
      const data = await response.json();
      setAnalyzedArticles(data);
      setFilteredAnalyzed(data);
    } catch (error) {
      console.error("Erreur:", error);
      toast({
        title: "Erreur",
        description: "Impossible d'analyser les articles",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "simple") {
      fetchBulletins();
    } else {
      fetchAnalyzedArticles();
    }
  }, [activeTab]);

  // Filtrage des bulletins simples
  useEffect(() => {
    let filtered = bulletins;

    if (selectedCategory !== "Tous") {
      filtered = filtered.filter(b => 
        b.source.toLowerCase().includes(selectedCategory.toLowerCase())
      );
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(b =>
        b.titre.toLowerCase().includes(query) ||
        b.description.toLowerCase().includes(query)
      );
    }

    setFilteredBulletins(filtered);
  }, [selectedCategory, searchQuery, bulletins]);

  // Filtrage des articles analysés
  useEffect(() => {
    let filtered = analyzedArticles;

    if (selectedCategory !== "Tous") {
      filtered = filtered.filter(a => a.categorie === selectedCategory);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(a =>
        a.titre.toLowerCase().includes(query) ||
        a.resume.toLowerCase().includes(query) ||
        a.motsCles.some(m => m.toLowerCase().includes(query))
      );
    }

    setFilteredAnalyzed(filtered);
  }, [selectedCategory, searchQuery, analyzedArticles]);

  const getCategoryColor = (categorie: string) => {
    const colors: Record<string, string> = {
      Sécurité: "bg-red-500",
      Routes: "bg-orange-500",
      Santé: "bg-green-500",
      Gouvernement: "bg-blue-500",
      Social: "bg-purple-500",
      Économie: "bg-yellow-500",
      Culture: "bg-pink-500",
      Éducation: "bg-indigo-500",
      Environnement: "bg-teal-500",
      Justice: "bg-gray-500",
    };
    return colors[categorie] || "bg-gray-500";
  };

  const handleRefresh = async () => {
    if (activeTab === "simple") {
      await fetchBulletins();
      toast({ title: "✅ Actualisé", description: "Bulletins rechargés" });
    } else {
      await fetchAnalyzedArticles();
      toast({ title: "✅ Actualisé", description: "Articles analysés à nouveau" });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="max-w-7xl mx-auto px-4 py-8 pb-24">
        {/* En-tête */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <FileText className="w-8 h-8 text-primary" />
            <h1 className="text-3xl md:text-4xl font-bold">Bulletin Citoyen</h1>
            {aiAvailable && (
              <Badge variant="outline" className="gap-1">
                <Sparkles className="w-3 h-3" />
                IA activée
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground text-lg">
            Informations officielles vérifiées et analysées du Burkina Faso
          </p>
        </div>

        {/* Onglets */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "simple" | "ai")} className="mb-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="simple">
              <FileText className="w-4 h-4 mr-2" />
              Flux RSS
            </TabsTrigger>
            <TabsTrigger value="ai" disabled={!aiAvailable}>
              <Sparkles className="w-4 h-4 mr-2" />
              Analyse IA
            </TabsTrigger>
          </TabsList>

          {/* Barre de contrôle commune */}
          <Card className="mt-6">
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4">
                {/* Recherche */}
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {/* Filtre catégorie */}
                <div className="w-full md:w-64">
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger>
                      <Filter className="w-4 h-4 mr-2" />
                      <SelectValue placeholder="Catégorie" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Bouton Actualiser */}
                <Button
                  onClick={handleRefresh}
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

          {/* Contenu Flux RSS Simple */}
          <TabsContent value="simple" className="mt-6">
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
                    Modifiez vos filtres ou réessayez plus tard
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredBulletins.map((bulletin) => (
                  <Card key={bulletin.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <Badge variant="secondary">{bulletin.source}</Badge>
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
          </TabsContent>

          {/* Contenu Analyse IA */}
          <TabsContent value="ai" className="mt-6">
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : filteredAnalyzed.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Sparkles className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <h3 className="text-xl font-semibold mb-2">Aucun article analysé</h3>
                  <p className="text-muted-foreground">
                    L'IA n'a trouvé aucun article correspondant à vos critères
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredAnalyzed.map((article) => (
                  <Card key={article.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <Badge className={`${getCategoryColor(article.categorie)} text-white`}>
                          {article.categorie}
                        </Badge>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Calendar className="w-3 h-3" />
                          {new Date(article.date).toLocaleDateString("fr-FR")}
                        </div>
                      </div>
                      
                      {/* Pertinence */}
                      <div className="mb-3">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-muted-foreground">Pertinence</span>
                          <span className="font-semibold">{article.pertinence}%</span>
                        </div>
                        <Progress value={article.pertinence} className="h-1" />
                      </div>

                      <CardTitle className="text-lg leading-tight">
                        {article.titre}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {/* Résumé IA */}
                      <div className="mb-3 p-3 bg-muted/50 rounded-md">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                          <Sparkles className="w-3 h-3" />
                          Résumé IA
                        </div>
                        <p className="text-sm">{article.resume}</p>
                      </div>

                      {/* Mots-clés */}
                      {article.motsCles.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-4">
                          {article.motsCles.map((mot, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {mot}
                            </Badge>
                          ))}
                        </div>
                      )}

                      {/* Source et lien */}
                      <div className="flex items-center justify-between">
                        <Badge variant="secondary" className="text-xs">
                          {article.source}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="gap-1"
                          onClick={() => window.open(article.lien, "_blank")}
                        >
                          <ExternalLink className="w-3 h-3" />
                          Lire
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Statistiques */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-primary">
                {activeTab === "simple" ? bulletins.length : analyzedArticles.length}
              </div>
              <div className="text-sm text-muted-foreground">Total articles</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">
                {activeTab === "simple" ? filteredBulletins.length : filteredAnalyzed.length}
              </div>
              <div className="text-sm text-muted-foreground">Résultats</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">
                {CATEGORIES.length - 1}
              </div>
              <div className="text-sm text-muted-foreground">Catégories</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-orange-600">
                <TrendingUp className="w-6 h-6 mx-auto" />
              </div>
              <div className="text-sm text-muted-foreground">Actualisé</div>
            </CardContent>
          </Card>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
