import { useState, useMemo } from "react";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import EmergencyPanel from "@/components/EmergencyPanel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, MapPin, Phone, Clock, Navigation, ArrowLeft, RefreshCw, Store, ShoppingBag } from "lucide-react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

interface Boutique {
  id: string;
  nom: string;
  adresse: string;
  ville: string;
  quartier: string;
  region: string;
  telephone: string;
  categorie: "marche" | "supermarche" | "vetements" | "electronique" | "artisanat" | "alimentation" | "divers";
  horaires: string;
  latitude?: number;
  longitude?: number;
}

const BOUTIQUES_DATA: Boutique[] = [
  // MARCHÉS PRINCIPAUX
  {
    id: "march_1",
    nom: "Grand Marché Rood Woko",
    adresse: "Avenue de la Liberté",
    ville: "Ouagadougou",
    quartier: "Centre-ville",
    region: "Kadiogo",
    telephone: "+226 25 30 00 00",
    categorie: "marche",
    horaires: "6h-18h",
    latitude: 12.3710,
    longitude: -1.5190
  },
  {
    id: "march_2",
    nom: "Marché de Sankariaré",
    adresse: "Rue de Sankariaré",
    ville: "Ouagadougou",
    quartier: "Sankariaré",
    region: "Kadiogo",
    telephone: "+226 70 00 00 01",
    categorie: "marche",
    horaires: "6h-18h",
    latitude: 12.3750,
    longitude: -1.5100
  },
  {
    id: "march_3",
    nom: "Marché de Gounghin",
    adresse: "Avenue de Gounghin",
    ville: "Ouagadougou",
    quartier: "Gounghin",
    region: "Kadiogo",
    telephone: "+226 70 00 00 02",
    categorie: "marche",
    horaires: "6h-18h",
    latitude: 12.3680,
    longitude: -1.5260
  },
  {
    id: "march_4",
    nom: "Grand Marché de Bobo",
    adresse: "Avenue de la Révolution",
    ville: "Bobo-Dioulasso",
    quartier: "Centre-ville",
    region: "Guiriko",
    telephone: "+226 20 97 00 00",
    categorie: "marche",
    horaires: "6h-18h",
    latitude: 11.1800,
    longitude: -4.2920
  },
  {
    id: "march_5",
    nom: "Marché de Banfora",
    adresse: "Avenue Principale",
    ville: "Banfora",
    quartier: "Centre",
    region: "Poni-Tiari",
    telephone: "+226 20 91 00 00",
    categorie: "marche",
    horaires: "6h-17h",
    latitude: 10.6334,
    longitude: -4.7619
  },
  // SUPERMARCHÉS
  {
    id: "super_1",
    nom: "Marina Market",
    adresse: "Avenue Kwame N'Krumah",
    ville: "Ouagadougou",
    quartier: "Centre-ville",
    region: "Kadiogo",
    telephone: "+226 25 31 55 66",
    categorie: "supermarche",
    horaires: "8h-21h",
    latitude: 12.3714,
    longitude: -1.5197
  },
  {
    id: "super_2",
    nom: "Orca Supermarché",
    adresse: "Boulevard Thomas Sankara",
    ville: "Ouagadougou",
    quartier: "Ouaga 2000",
    region: "Kadiogo",
    telephone: "+226 25 37 22 33",
    categorie: "supermarche",
    horaires: "8h-22h",
    latitude: 12.3300,
    longitude: -1.4800
  },
  {
    id: "super_3",
    nom: "Casino Supermarché",
    adresse: "Avenue de l'UEMOA",
    ville: "Ouagadougou",
    quartier: "Zone du Bois",
    region: "Kadiogo",
    telephone: "+226 25 36 44 55",
    categorie: "supermarche",
    horaires: "8h-21h",
    latitude: 12.3850,
    longitude: -1.4950
  },
  {
    id: "super_4",
    nom: "Eden Supermarché",
    adresse: "Boulevard Mouammar Kadhafi",
    ville: "Bobo-Dioulasso",
    quartier: "Accart Ville",
    region: "Guiriko",
    telephone: "+226 20 97 55 66",
    categorie: "supermarche",
    horaires: "8h-21h",
    latitude: 11.1771,
    longitude: -4.2897
  },
  // ARTISANAT
  {
    id: "art_1",
    nom: "Village Artisanal de Ouaga",
    adresse: "Route de Kaya",
    ville: "Ouagadougou",
    quartier: "Cissin",
    region: "Kadiogo",
    telephone: "+226 25 36 11 22",
    categorie: "artisanat",
    horaires: "8h-18h",
    latitude: 12.4000,
    longitude: -1.5000
  },
  {
    id: "art_2",
    nom: "Centre National de l'Artisanat",
    adresse: "Avenue de la Chance",
    ville: "Ouagadougou",
    quartier: "Koulouba",
    region: "Kadiogo",
    telephone: "+226 25 33 88 99",
    categorie: "artisanat",
    horaires: "8h-17h",
    latitude: 12.3800,
    longitude: -1.5050
  },
  {
    id: "art_3",
    nom: "Marché de l'Artisanat de Bobo",
    adresse: "Rue de l'Artisanat",
    ville: "Bobo-Dioulasso",
    quartier: "Koko",
    region: "Guiriko",
    telephone: "+226 20 99 33 44",
    categorie: "artisanat",
    horaires: "8h-18h",
    latitude: 11.1850,
    longitude: -4.3000
  },
  // VÊTEMENTS
  {
    id: "vet_1",
    nom: "Faso Fani",
    adresse: "Avenue Kwame N'Krumah",
    ville: "Ouagadougou",
    quartier: "Centre-ville",
    region: "Kadiogo",
    telephone: "+226 25 31 77 88",
    categorie: "vetements",
    horaires: "9h-19h",
    latitude: 12.3720,
    longitude: -1.5180
  },
  {
    id: "vet_2",
    nom: "Boutique Africaine",
    adresse: "Rue du Commerce",
    ville: "Ouagadougou",
    quartier: "Dapoya",
    region: "Kadiogo",
    telephone: "+226 70 55 66 77",
    categorie: "vetements",
    horaires: "9h-19h",
    latitude: 12.3900,
    longitude: -1.4900
  },
  {
    id: "vet_3",
    nom: "Mode Express",
    adresse: "Boulevard de la Révolution",
    ville: "Bobo-Dioulasso",
    quartier: "Belle Ville",
    region: "Guiriko",
    telephone: "+226 20 98 77 88",
    categorie: "vetements",
    horaires: "9h-19h",
    latitude: 11.1750,
    longitude: -4.2880
  },
  // ÉLECTRONIQUE
  {
    id: "elec_1",
    nom: "Techno Center",
    adresse: "Avenue de l'UEMOA",
    ville: "Ouagadougou",
    quartier: "Zone du Bois",
    region: "Kadiogo",
    telephone: "+226 25 36 99 00",
    categorie: "electronique",
    horaires: "9h-19h",
    latitude: 12.3850,
    longitude: -1.4950
  },
  {
    id: "elec_2",
    nom: "Digital Store",
    adresse: "Boulevard Charles de Gaulle",
    ville: "Ouagadougou",
    quartier: "Paspanga",
    region: "Kadiogo",
    telephone: "+226 25 30 11 22",
    categorie: "electronique",
    horaires: "9h-19h",
    latitude: 12.3745,
    longitude: -1.5180
  },
  {
    id: "elec_3",
    nom: "Mobile World",
    adresse: "Avenue Ouezzin Coulibaly",
    ville: "Bobo-Dioulasso",
    quartier: "Sarfalao",
    region: "Guiriko",
    telephone: "+226 20 97 88 99",
    categorie: "electronique",
    horaires: "9h-19h",
    latitude: 11.1700,
    longitude: -4.2850
  },
  // ALIMENTATION
  {
    id: "alim_1",
    nom: "Boulangerie Centrale",
    adresse: "Rue de la Liberté",
    ville: "Ouagadougou",
    quartier: "Gounghin",
    region: "Kadiogo",
    telephone: "+226 25 31 22 33",
    categorie: "alimentation",
    horaires: "6h-20h",
    latitude: 12.3680,
    longitude: -1.5260
  },
  {
    id: "alim_2",
    nom: "Le Pain Quotidien",
    adresse: "Boulevard Bassawarga",
    ville: "Ouagadougou",
    quartier: "Tampouy",
    region: "Kadiogo",
    telephone: "+226 25 41 44 55",
    categorie: "alimentation",
    horaires: "6h-21h",
    latitude: 12.4200,
    longitude: -1.5200
  },
  // DIVERS - AUTRES VILLES
  {
    id: "div_1",
    nom: "Boutique du Centre",
    adresse: "Rue de l'Indépendance",
    ville: "Koudougou",
    quartier: "Centre-ville",
    region: "Koom-Kuuli",
    telephone: "+226 25 44 66 77",
    categorie: "divers",
    horaires: "8h-18h",
    latitude: 12.2525,
    longitude: -2.3622
  },
  {
    id: "div_2",
    nom: "Magasin du Nord",
    adresse: "Route de Djibo",
    ville: "Ouahigouya",
    quartier: "Centre-ville",
    region: "Taoud-Weogo",
    telephone: "+226 24 55 66 77",
    categorie: "divers",
    horaires: "8h-18h",
    latitude: 13.5828,
    longitude: -2.4214
  },
  {
    id: "div_3",
    nom: "Commerce de l'Est",
    adresse: "Avenue Nationale",
    ville: "Fada N'Gourma",
    quartier: "Centre",
    region: "Goulmou",
    telephone: "+226 24 77 66 77",
    categorie: "divers",
    horaires: "8h-17h",
    latitude: 12.0614,
    longitude: 0.3581
  },
  {
    id: "div_4",
    nom: "Bazin Express",
    adresse: "Avenue de la Nation",
    ville: "Tenkodogo",
    quartier: "Centre",
    region: "Kom-Pangala",
    telephone: "+226 40 71 66 77",
    categorie: "divers",
    horaires: "8h-18h",
    latitude: 11.7800,
    longitude: -0.3700
  }
];

const REGIONS = [
  "Kadiogo", "Guiriko", "Poni-Tiari", "Koom-Kuuli", "Goulmou",
  "Taoud-Weogo", "Kom-Pangala"
];

const CATEGORIES = [
  { value: "all", label: "Toutes les catégories" },
  { value: "marche", label: "🏪 Marchés" },
  { value: "supermarche", label: "🛒 Supermarchés" },
  { value: "vetements", label: "👕 Vêtements" },
  { value: "electronique", label: "📱 Électronique" },
  { value: "artisanat", label: "🎨 Artisanat" },
  { value: "alimentation", label: "🥖 Alimentation" },
  { value: "divers", label: "🛍️ Divers" }
];

export default function BoutiquesMarchés() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRegion, setSelectedRegion] = useState<string>("all");
  const [selectedCategorie, setSelectedCategorie] = useState<string>("all");
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const filteredBoutiques = useMemo(() => {
    let filtered = BOUTIQUES_DATA;

    if (selectedRegion !== "all") {
      filtered = filtered.filter(b => b.region === selectedRegion);
    }

    if (selectedCategorie !== "all") {
      filtered = filtered.filter(b => b.categorie === selectedCategorie);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(b =>
        b.nom.toLowerCase().includes(query) ||
        b.ville.toLowerCase().includes(query) ||
        b.quartier.toLowerCase().includes(query) ||
        b.adresse.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [searchQuery, selectedRegion, selectedCategorie]);

  const openInMaps = (boutique: Boutique) => {
    if (boutique.latitude && boutique.longitude) {
      const url = `https://www.google.com/maps/search/?api=1&query=${boutique.latitude},${boutique.longitude}`;
      window.open(url, '_blank', 'noopener,noreferrer');
    } else {
      const query = encodeURIComponent(`${boutique.nom} ${boutique.ville} ${boutique.adresse}`);
      const url = `https://www.google.com/maps/search/?api=1&query=${query}`;
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  const getCategorieColor = (categorie: string) => {
    switch (categorie) {
      case "marche": return "bg-amber-600 text-white";
      case "supermarche": return "bg-blue-500 text-white";
      case "vetements": return "bg-pink-500 text-white";
      case "electronique": return "bg-purple-500 text-white";
      case "artisanat": return "bg-orange-500 text-white";
      case "alimentation": return "bg-green-600 text-white";
      case "divers": return "bg-gray-500 text-white";
      default: return "bg-gray-500 text-white";
    }
  };

  const getCategorieLabel = (categorie: string) => {
    switch (categorie) {
      case "marche": return "Marché";
      case "supermarche": return "Supermarché";
      case "vetements": return "Vêtements";
      case "electronique": return "Électronique";
      case "artisanat": return "Artisanat";
      case "alimentation": return "Alimentation";
      case "divers": return "Divers";
      default: return categorie;
    }
  };

  const handleReset = () => {
    setSearchQuery("");
    setSelectedRegion("all");
    setSelectedCategorie("all");
    toast({
      title: "Filtres réinitialisés",
      description: `${BOUTIQUES_DATA.length} commerces disponibles`,
    });
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <Header />

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="mb-4 flex items-center gap-2">
          <Button
            variant="ghost"
            onClick={() => setLocation("/")}
            className="gap-2"
            data-testid="button-back"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour
          </Button>
          <Button
            variant="outline"
            onClick={handleReset}
            className="gap-2 ml-auto"
            data-testid="button-reset"
          >
            <RefreshCw className="w-4 h-4" />
            Réinitialiser
          </Button>
        </div>

        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
            <span className="text-2xl">🛍️</span>
            Boutiques & Marchés
          </h1>
          <p className="text-muted-foreground">
            Trouvez les meilleurs commerces et marchés du Burkina Faso
          </p>
        </div>

        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Rechercher un commerce..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                  data-testid="input-search"
                />
              </div>

              <Select value={selectedRegion} onValueChange={setSelectedRegion}>
                <SelectTrigger data-testid="select-region">
                  <SelectValue placeholder="Toutes les régions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les régions</SelectItem>
                  {REGIONS.map(region => (
                    <SelectItem key={region} value={region}>
                      {region}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedCategorie} onValueChange={setSelectedCategorie}>
                <SelectTrigger data-testid="select-categorie">
                  <SelectValue placeholder="Toutes les catégories" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(cat => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="mt-3 text-sm text-muted-foreground">
              {filteredBoutiques.length} commerce{filteredBoutiques.length > 1 ? 's' : ''} trouvé{filteredBoutiques.length > 1 ? 's' : ''}
            </div>
          </CardContent>
        </Card>

        {filteredBoutiques.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Store className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                Aucun commerce trouvé avec ces critères
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredBoutiques.map((boutique) => (
              <Card key={boutique.id} className="hover:shadow-lg transition-shadow" data-testid={`card-boutique-${boutique.id}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-2">{boutique.nom}</CardTitle>
                      <Badge className={getCategorieColor(boutique.categorie)}>
                        <Store className="w-3 h-3 mr-1" />
                        {getCategorieLabel(boutique.categorie)}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 mb-4">
                    <div className="flex items-start gap-2 text-sm">
                      <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium">{boutique.adresse}</p>
                        <p className="text-muted-foreground">
                          {boutique.quartier}, {boutique.ville}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      <span className="text-muted-foreground">{boutique.horaires}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      <a
                        href={`tel:${boutique.telephone}`}
                        className="text-primary hover:underline"
                      >
                        {boutique.telephone}
                      </a>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={() => openInMaps(boutique)}
                      className="flex-1 gap-2"
                      variant="default"
                      data-testid={`button-map-${boutique.id}`}
                    >
                      <Navigation className="w-4 h-4" />
                      Itinéraire
                    </Button>
                    <Button
                      asChild
                      variant="outline"
                      className="gap-2"
                    >
                      <a href={`tel:${boutique.telephone}`} data-testid={`button-call-${boutique.id}`}>
                        <Phone className="w-4 h-4" />
                        Appeler
                      </a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <EmergencyPanel />
      <BottomNav />
    </div>
  );
}
