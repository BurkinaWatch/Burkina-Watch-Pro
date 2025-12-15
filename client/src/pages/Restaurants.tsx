import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import EmergencyPanel from "@/components/EmergencyPanel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, MapPin, Phone, Clock, Navigation, ArrowLeft, RefreshCw, Star, Utensils } from "lucide-react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

interface Restaurant {
  id: string;
  nom: string;
  adresse: string;
  ville: string;
  quartier: string;
  region: string;
  telephone: string;
  categorie: "africain" | "international" | "fast-food" | "maquis" | "gastronomique" | "grillades";
  prixMoyen: "€" | "€€" | "€€€";
  horaires: string;
  note?: number;
  latitude?: number;
  longitude?: number;
}

const RESTAURANTS_DATA: Restaurant[] = [
  // OUAGADOUGOU
  {
    id: "rest_1",
    nom: "Le Verdoyant",
    adresse: "Avenue Kwame N'Krumah",
    ville: "Ouagadougou",
    quartier: "Centre-ville",
    region: "Kadiogo",
    telephone: "+226 25 31 45 67",
    categorie: "gastronomique",
    prixMoyen: "€€€",
    horaires: "12h-15h, 19h-23h",
    note: 4.5,
    latitude: 12.3714,
    longitude: -1.5197
  },
  {
    id: "rest_2",
    nom: "Maquis Chez Tanti",
    adresse: "Rue de la Liberté",
    ville: "Ouagadougou",
    quartier: "Gounghin",
    region: "Kadiogo",
    telephone: "+226 70 12 34 56",
    categorie: "maquis",
    prixMoyen: "€",
    horaires: "10h-22h",
    note: 4.2,
    latitude: 12.3680,
    longitude: -1.5260
  },
  {
    id: "rest_3",
    nom: "L'Eau Vive",
    adresse: "Avenue de la Résistance du 17 Mai",
    ville: "Ouagadougou",
    quartier: "Zone du Bois",
    region: "Kadiogo",
    telephone: "+226 25 30 63 63",
    categorie: "international",
    prixMoyen: "€€",
    horaires: "11h30-14h30, 18h30-22h",
    note: 4.3,
    latitude: 12.3750,
    longitude: -1.5100
  },
  {
    id: "rest_4",
    nom: "La Forêt",
    adresse: "Route de Ouaga 2000",
    ville: "Ouagadougou",
    quartier: "Ouaga 2000",
    region: "Kadiogo",
    telephone: "+226 25 37 88 99",
    categorie: "africain",
    prixMoyen: "€€",
    horaires: "11h-23h",
    note: 4.4,
    latitude: 12.3300,
    longitude: -1.4800
  },
  {
    id: "rest_5",
    nom: "Chez Fatou Grillades",
    adresse: "Boulevard Charles de Gaulle",
    ville: "Ouagadougou",
    quartier: "Paspanga",
    region: "Kadiogo",
    telephone: "+226 70 23 45 67",
    categorie: "grillades",
    prixMoyen: "€",
    horaires: "17h-00h",
    note: 4.6,
    latitude: 12.3745,
    longitude: -1.5180
  },
  {
    id: "rest_6",
    nom: "Pizza Express",
    adresse: "Avenue de l'UEMOA",
    ville: "Ouagadougou",
    quartier: "Zone du Bois",
    region: "Kadiogo",
    telephone: "+226 25 36 77 88",
    categorie: "fast-food",
    prixMoyen: "€€",
    horaires: "10h-22h",
    note: 4.0,
    latitude: 12.3850,
    longitude: -1.4950
  },
  {
    id: "rest_7",
    nom: "Le Café de Rome",
    adresse: "Rue de la Chance",
    ville: "Ouagadougou",
    quartier: "Koulouba",
    region: "Kadiogo",
    telephone: "+226 25 33 22 11",
    categorie: "international",
    prixMoyen: "€€€",
    horaires: "7h-23h",
    note: 4.7,
    latitude: 12.3800,
    longitude: -1.5050
  },
  {
    id: "rest_8",
    nom: "Maquis Le Palmier",
    adresse: "Avenue Yennenga",
    ville: "Ouagadougou",
    quartier: "Wemtenga",
    region: "Kadiogo",
    telephone: "+226 70 34 56 78",
    categorie: "maquis",
    prixMoyen: "€",
    horaires: "10h-23h",
    note: 4.1,
    latitude: 12.3800,
    longitude: -1.5100
  },
  {
    id: "rest_9",
    nom: "Le Riz Gras",
    adresse: "Rue du Commerce",
    ville: "Ouagadougou",
    quartier: "Dapoya",
    region: "Kadiogo",
    telephone: "+226 70 45 67 89",
    categorie: "africain",
    prixMoyen: "€",
    horaires: "11h-21h",
    note: 4.3,
    latitude: 12.3900,
    longitude: -1.4900
  },
  {
    id: "rest_10",
    nom: "Le Gondwana",
    adresse: "Boulevard Bassawarga",
    ville: "Ouagadougou",
    quartier: "Tampouy",
    region: "Kadiogo",
    telephone: "+226 25 41 55 66",
    categorie: "gastronomique",
    prixMoyen: "€€€",
    horaires: "12h-14h30, 19h-22h30",
    note: 4.8,
    latitude: 12.4200,
    longitude: -1.5200
  },
  // BOBO-DIOULASSO
  {
    id: "rest_11",
    nom: "Le Bambou",
    adresse: "Boulevard Mouammar Kadhafi",
    ville: "Bobo-Dioulasso",
    quartier: "Accart Ville",
    region: "Guiriko",
    telephone: "+226 20 97 11 22",
    categorie: "international",
    prixMoyen: "€€",
    horaires: "11h-22h",
    note: 4.4,
    latitude: 11.1771,
    longitude: -4.2897
  },
  {
    id: "rest_12",
    nom: "Maquis Le Fromager",
    adresse: "Rue de Banfora",
    ville: "Bobo-Dioulasso",
    quartier: "Diarradougou",
    region: "Guiriko",
    telephone: "+226 70 56 78 90",
    categorie: "maquis",
    prixMoyen: "€",
    horaires: "10h-23h",
    note: 4.2,
    latitude: 11.1820,
    longitude: -4.2950
  },
  {
    id: "rest_13",
    nom: "Chez Moussa",
    adresse: "Avenue de la Révolution",
    ville: "Bobo-Dioulasso",
    quartier: "Centre-ville",
    region: "Guiriko",
    telephone: "+226 20 97 33 44",
    categorie: "africain",
    prixMoyen: "€",
    horaires: "11h-22h",
    note: 4.5,
    latitude: 11.1800,
    longitude: -4.2920
  },
  {
    id: "rest_14",
    nom: "Le Sababougnouma",
    adresse: "Rue du Commerce",
    ville: "Bobo-Dioulasso",
    quartier: "Belle Ville",
    region: "Guiriko",
    telephone: "+226 20 98 55 66",
    categorie: "grillades",
    prixMoyen: "€€",
    horaires: "18h-00h",
    note: 4.6,
    latitude: 11.1750,
    longitude: -4.2880
  },
  {
    id: "rest_15",
    nom: "Le Petit Resto",
    adresse: "Avenue Ouezzin Coulibaly",
    ville: "Bobo-Dioulasso",
    quartier: "Koko",
    region: "Guiriko",
    telephone: "+226 20 99 11 22",
    categorie: "fast-food",
    prixMoyen: "€",
    horaires: "8h-21h",
    note: 3.9,
    latitude: 11.1850,
    longitude: -4.3000
  },
  // BANFORA
  {
    id: "rest_16",
    nom: "Le Karité",
    adresse: "Avenue de la Révolution",
    ville: "Banfora",
    quartier: "Centre",
    region: "Poni-Tiari",
    telephone: "+226 20 91 22 33",
    categorie: "africain",
    prixMoyen: "€",
    horaires: "11h-22h",
    note: 4.3,
    latitude: 10.6334,
    longitude: -4.7619
  },
  {
    id: "rest_17",
    nom: "Auberge des Cascades",
    adresse: "Route de Sindou",
    ville: "Banfora",
    quartier: "Secteur 2",
    region: "Poni-Tiari",
    telephone: "+226 20 91 44 55",
    categorie: "gastronomique",
    prixMoyen: "€€€",
    horaires: "12h-14h, 19h-22h",
    note: 4.7,
    latitude: 10.6300,
    longitude: -4.7650
  },
  // KOUDOUGOU
  {
    id: "rest_18",
    nom: "Chez Aminata",
    adresse: "Rue de l'Indépendance",
    ville: "Koudougou",
    quartier: "Centre-ville",
    region: "Koom-Kuuli",
    telephone: "+226 25 44 11 22",
    categorie: "maquis",
    prixMoyen: "€",
    horaires: "10h-22h",
    note: 4.2,
    latitude: 12.2525,
    longitude: -2.3622
  },
  {
    id: "rest_19",
    nom: "Le Relais",
    adresse: "Avenue de la Nation",
    ville: "Koudougou",
    quartier: "Secteur 3",
    region: "Koom-Kuuli",
    telephone: "+226 25 44 33 44",
    categorie: "international",
    prixMoyen: "€€",
    horaires: "11h-22h",
    note: 4.0,
    latitude: 12.2500,
    longitude: -2.3650
  },
  // OUAHIGOUYA
  {
    id: "rest_20",
    nom: "Le Sahel",
    adresse: "Route de Djibo",
    ville: "Ouahigouya",
    quartier: "Centre-ville",
    region: "Taoud-Weogo",
    telephone: "+226 24 55 11 22",
    categorie: "africain",
    prixMoyen: "€",
    horaires: "10h-22h",
    note: 4.1,
    latitude: 13.5828,
    longitude: -2.4214
  },
  {
    id: "rest_21",
    nom: "Restaurant du Nord",
    adresse: "Avenue de la Liberté",
    ville: "Ouahigouya",
    quartier: "Secteur 1",
    region: "Taoud-Weogo",
    telephone: "+226 24 55 33 44",
    categorie: "grillades",
    prixMoyen: "€€",
    horaires: "17h-23h",
    note: 4.4,
    latitude: 13.5850,
    longitude: -2.4200
  },
  // FADA N'GOURMA
  {
    id: "rest_22",
    nom: "L'Oasis de l'Est",
    adresse: "Avenue Nationale",
    ville: "Fada N'Gourma",
    quartier: "Centre",
    region: "Goulmou",
    telephone: "+226 24 77 11 22",
    categorie: "africain",
    prixMoyen: "€",
    horaires: "11h-21h",
    note: 4.0,
    latitude: 12.0614,
    longitude: 0.3581
  },
  // DORI
  {
    id: "rest_23",
    nom: "Le Campement",
    adresse: "Avenue Principale",
    ville: "Dori",
    quartier: "Centre",
    region: "Sahel",
    telephone: "+226 24 46 11 22",
    categorie: "maquis",
    prixMoyen: "€",
    horaires: "10h-21h",
    note: 3.8,
    latitude: 14.0353,
    longitude: -0.0345
  },
  // TENKODOGO
  {
    id: "rest_24",
    nom: "Chez Mamadou",
    adresse: "Avenue de la Nation",
    ville: "Tenkodogo",
    quartier: "Centre",
    region: "Kom-Pangala",
    telephone: "+226 40 71 11 22",
    categorie: "grillades",
    prixMoyen: "€",
    horaires: "17h-23h",
    note: 4.3,
    latitude: 11.7800,
    longitude: -0.3700
  },
  // ZINIARÉ
  {
    id: "rest_25",
    nom: "Le Naaba",
    adresse: "Route Nationale",
    ville: "Ziniaré",
    quartier: "Centre",
    region: "Nakambga",
    telephone: "+226 25 30 99 00",
    categorie: "africain",
    prixMoyen: "€€",
    horaires: "11h-22h",
    note: 4.2,
    latitude: 12.5833,
    longitude: -1.3000
  }
];

const REGIONS = [
  "Kadiogo", "Guiriko", "Poni-Tiari", "Koom-Kuuli", "Goulmou",
  "Taoud-Weogo", "Kom-Pangala", "Sahel", "Nakambga"
];

const CATEGORIES = [
  { value: "all", label: "Toutes les catégories" },
  { value: "africain", label: "🍲 Cuisine Africaine" },
  { value: "international", label: "🌍 International" },
  { value: "fast-food", label: "🍔 Fast-Food" },
  { value: "maquis", label: "🏠 Maquis" },
  { value: "gastronomique", label: "⭐ Gastronomique" },
  { value: "grillades", label: "🔥 Grillades" }
];

export default function Restaurants() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRegion, setSelectedRegion] = useState<string>("all");
  const [selectedCategorie, setSelectedCategorie] = useState<string>("all");
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const filteredRestaurants = useMemo(() => {
    let filtered = RESTAURANTS_DATA;

    if (selectedRegion !== "all") {
      filtered = filtered.filter(r => r.region === selectedRegion);
    }

    if (selectedCategorie !== "all") {
      filtered = filtered.filter(r => r.categorie === selectedCategorie);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(r =>
        r.nom.toLowerCase().includes(query) ||
        r.ville.toLowerCase().includes(query) ||
        r.quartier.toLowerCase().includes(query) ||
        r.adresse.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [searchQuery, selectedRegion, selectedCategorie]);

  const openInMaps = (restaurant: Restaurant) => {
    if (restaurant.latitude && restaurant.longitude) {
      const url = `https://www.google.com/maps/search/?api=1&query=${restaurant.latitude},${restaurant.longitude}`;
      window.open(url, '_blank', 'noopener,noreferrer');
    } else {
      const query = encodeURIComponent(`${restaurant.nom} ${restaurant.ville} ${restaurant.adresse}`);
      const url = `https://www.google.com/maps/search/?api=1&query=${query}`;
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  const getCategorieColor = (categorie: string) => {
    switch (categorie) {
      case "africain": return "bg-amber-500 text-white";
      case "international": return "bg-blue-500 text-white";
      case "fast-food": return "bg-orange-500 text-white";
      case "maquis": return "bg-green-600 text-white";
      case "gastronomique": return "bg-purple-500 text-white";
      case "grillades": return "bg-red-500 text-white";
      default: return "bg-gray-500 text-white";
    }
  };

  const getCategorieLabel = (categorie: string) => {
    switch (categorie) {
      case "africain": return "Africain";
      case "international": return "International";
      case "fast-food": return "Fast-Food";
      case "maquis": return "Maquis";
      case "gastronomique": return "Gastronomique";
      case "grillades": return "Grillades";
      default: return categorie;
    }
  };

  const handleReset = () => {
    setSearchQuery("");
    setSelectedRegion("all");
    setSelectedCategorie("all");
    toast({
      title: "Filtres réinitialisés",
      description: `${RESTAURANTS_DATA.length} restaurants disponibles`,
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
            <span className="text-2xl">🍽️</span>
            Restaurants
          </h1>
          <p className="text-muted-foreground">
            Découvrez les meilleurs restaurants du Burkina Faso
          </p>
        </div>

        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Rechercher un restaurant..."
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
              {filteredRestaurants.length} restaurant{filteredRestaurants.length > 1 ? 's' : ''} trouvé{filteredRestaurants.length > 1 ? 's' : ''}
            </div>
          </CardContent>
        </Card>

        {filteredRestaurants.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Utensils className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                Aucun restaurant trouvé avec ces critères
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredRestaurants.map((restaurant) => (
              <Card key={restaurant.id} className="hover:shadow-lg transition-shadow" data-testid={`card-restaurant-${restaurant.id}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-2">{restaurant.nom}</CardTitle>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge className={getCategorieColor(restaurant.categorie)}>
                          <Utensils className="w-3 h-3 mr-1" />
                          {getCategorieLabel(restaurant.categorie)}
                        </Badge>
                        <Badge variant="outline" className="font-bold">
                          {restaurant.prixMoyen}
                        </Badge>
                        {restaurant.note && (
                          <Badge variant="secondary" className="gap-1">
                            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                            {restaurant.note}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 mb-4">
                    <div className="flex items-start gap-2 text-sm">
                      <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium">{restaurant.adresse}</p>
                        <p className="text-muted-foreground">
                          {restaurant.quartier}, {restaurant.ville}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      <span className="text-muted-foreground">{restaurant.horaires}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      <a
                        href={`tel:${restaurant.telephone}`}
                        className="text-primary hover:underline"
                      >
                        {restaurant.telephone}
                      </a>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={() => openInMaps(restaurant)}
                      className="flex-1 gap-2"
                      variant="default"
                      data-testid={`button-map-${restaurant.id}`}
                    >
                      <Navigation className="w-4 h-4" />
                      Itinéraire
                    </Button>
                    <Button
                      asChild
                      variant="outline"
                      className="gap-2"
                    >
                      <a href={`tel:${restaurant.telephone}`} data-testid={`button-call-${restaurant.id}`}>
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
