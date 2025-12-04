
import { useState, useMemo } from "react";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import EmergencyPanel from "@/components/EmergencyPanel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, MapPin, Phone, Clock, Navigation, ArrowLeft, RefreshCw } from "lucide-react";
import { useLocation } from "wouter";

interface Pharmacie {
  id: string;
  nom: string;
  adresse: string;
  ville: string;
  quartier: string;
  region: string;
  telephone: string;
  typeGarde: "jour" | "nuit" | "24h";
  latitude?: number;
  longitude?: number;
}

// Données des pharmacies de garde du Burkina Faso
const PHARMACIES_DATA: Pharmacie[] = [
  {
    id: "1",
    nom: "Pharmacie Centrale de Ouagadougou",
    adresse: "Avenue Kwame N'Krumah",
    ville: "Ouagadougou",
    quartier: "Centre-ville",
    region: "Kadiogo",
    telephone: "+226 25 30 61 91",
    typeGarde: "24h",
    latitude: 12.3714,
    longitude: -1.5197
  },
  {
    id: "2",
    nom: "Pharmacie Yennenga",
    adresse: "Avenue de la Liberté",
    ville: "Ouagadougou",
    quartier: "Gounghin",
    region: "Kadiogo",
    telephone: "+226 25 31 44 22",
    typeGarde: "jour",
    latitude: 12.3678,
    longitude: -1.5260
  },
  {
    id: "3",
    nom: "Pharmacie du Mogho Naaba",
    adresse: "Avenue Charles de Gaulle",
    ville: "Ouagadougou",
    quartier: "Paspanga",
    region: "Kadiogo",
    telephone: "+226 25 30 74 53",
    typeGarde: "nuit",
    latitude: 12.3745,
    longitude: -1.5180
  },
  {
    id: "4",
    nom: "Pharmacie Sainte Marie",
    adresse: "Boulevard Mouammar Kadhafi",
    ville: "Bobo-Dioulasso",
    quartier: "Accart Ville",
    region: "Guiriko",
    telephone: "+226 20 97 01 23",
    typeGarde: "24h",
    latitude: 11.1771,
    longitude: -4.2897
  },
  {
    id: "5",
    nom: "Pharmacie Nafa",
    adresse: "Route de Banfora",
    ville: "Bobo-Dioulasso",
    quartier: "Diarradougou",
    region: "Guiriko",
    telephone: "+226 20 98 45 67",
    typeGarde: "jour",
    latitude: 11.1820,
    longitude: -4.2950
  },
  {
    id: "6",
    nom: "Pharmacie de la Comoé",
    adresse: "Avenue de la Révolution",
    ville: "Banfora",
    quartier: "Centre",
    region: "Poni-Tiari",
    telephone: "+226 20 91 02 34",
    typeGarde: "nuit",
    latitude: 10.6334,
    longitude: -4.7619
  },
  {
    id: "7",
    nom: "Pharmacie Faso",
    adresse: "Rue de l'Indépendance",
    ville: "Koudougou",
    quartier: "Centre-ville",
    region: "Koom-Kuuli",
    telephone: "+226 25 44 01 56",
    typeGarde: "jour",
    latitude: 12.2525,
    longitude: -2.3622
  },
  {
    id: "8",
    nom: "Pharmacie de l'Est",
    adresse: "Avenue Nationale",
    ville: "Fada N'Gourma",
    quartier: "Centre",
    region: "Goulmou",
    telephone: "+226 24 77 02 45",
    typeGarde: "24h",
    latitude: 12.0614,
    longitude: 0.3581
  },
  {
    id: "9",
    nom: "Pharmacie du Nord",
    adresse: "Route de Djibo",
    ville: "Ouahigouya",
    quartier: "Centre-ville",
    region: "Taoud-Weogo",
    telephone: "+226 24 55 03 21",
    typeGarde: "jour",
    latitude: 13.5828,
    longitude: -2.4214
  },
  {
    id: "10",
    nom: "Pharmacie Tenkodogo",
    adresse: "Avenue de la Nation",
    ville: "Tenkodogo",
    quartier: "Centre",
    region: "Kom-Pangala",
    telephone: "+226 40 71 02 89",
    typeGarde: "nuit",
    latitude: 11.7800,
    longitude: -0.3700
  },
  {
    id: "11",
    nom: "Pharmacie Al Houda",
    adresse: "Rue de Kaya",
    ville: "Ouagadougou",
    quartier: "Cissin",
    region: "Kadiogo",
    telephone: "+226 25 36 78 90",
    typeGarde: "jour",
    latitude: 12.4000,
    longitude: -1.5000
  },
  {
    id: "12",
    nom: "Pharmacie du Sahel",
    adresse: "Avenue Principale",
    ville: "Dori",
    quartier: "Centre",
    region: "Sahel",
    telephone: "+226 24 46 01 23",
    typeGarde: "24h",
    latitude: 14.0353,
    longitude: -0.0345
  }
];

const REGIONS = [
  "Bankui", "Djôrô", "Goulmou", "Guiriko", "Kadiogo", "Koom-Kuuli",
  "Kom-Pangala", "Nakambga", "Passoré", "Poni-Tiari", "Sahel",
  "Taar-Soomba", "Taoud-Weogo", "Tondeka", "Wètemga", "Yirka-Gaongo", "Yonyoosé"
];

export default function Pharmacies() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRegion, setSelectedRegion] = useState<string>("all");
  const [, setLocation] = useLocation();

  const filteredPharmacies = useMemo(() => {
    let filtered = PHARMACIES_DATA;

    // Filtre par région
    if (selectedRegion !== "all") {
      filtered = filtered.filter(p => p.region === selectedRegion);
    }

    // Filtre par recherche
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p =>
        p.nom.toLowerCase().includes(query) ||
        p.ville.toLowerCase().includes(query) ||
        p.quartier.toLowerCase().includes(query) ||
        p.adresse.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [searchQuery, selectedRegion]);

  const openInMaps = (pharmacie: Pharmacie) => {
    if (pharmacie.latitude && pharmacie.longitude) {
      const url = `https://www.google.com/maps/search/?api=1&query=${pharmacie.latitude},${pharmacie.longitude}`;
      window.open(url, '_blank', 'noopener,noreferrer');
    } else {
      const query = encodeURIComponent(`${pharmacie.nom} ${pharmacie.ville} ${pharmacie.adresse}`);
      const url = `https://www.google.com/maps/search/?api=1&query=${query}`;
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  const getGardeColor = (type: string) => {
    switch (type) {
      case "24h":
        return "bg-green-500 text-white";
      case "jour":
        return "bg-yellow-500 text-black";
      case "nuit":
        return "bg-blue-500 text-white";
      default:
        return "bg-gray-500 text-white";
    }
  };

  const getGardeLabel = (type: string) => {
    switch (type) {
      case "24h":
        return "24h/24";
      case "jour":
        return "Garde de jour";
      case "nuit":
        return "Garde de nuit";
      default:
        return type;
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <Header />

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Boutons Retour et Actualiser */}
        <div className="mb-4 flex items-center gap-2">
          <Button
            variant="ghost"
            onClick={() => setLocation("/")}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setSearchQuery("");
              setSelectedRegion("all");
            }}
            className="gap-2 ml-auto"
          >
            <RefreshCw className="w-4 h-4" />
            Réinitialiser
          </Button>
        </div>

        {/* En-tête */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
            <span className="text-2xl">💊</span>
            Pharmacies de Garde
          </h1>
          <p className="text-muted-foreground">
            Liste des pharmacies de garde au Burkina Faso
          </p>
        </div>

        {/* Filtres */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Recherche */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Rechercher par nom, ville, quartier..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Filtre par région */}
              <Select value={selectedRegion} onValueChange={setSelectedRegion}>
                <SelectTrigger>
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
            </div>

            {/* Compteur de résultats */}
            <div className="mt-3 text-sm text-muted-foreground">
              {filteredPharmacies.length} pharmacie{filteredPharmacies.length > 1 ? 's' : ''} trouvée{filteredPharmacies.length > 1 ? 's' : ''}
            </div>
          </CardContent>
        </Card>

        {/* Liste des pharmacies */}
        {filteredPharmacies.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-muted-foreground">
                Aucune pharmacie trouvée avec ces critères
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredPharmacies.map((pharmacie) => (
              <Card key={pharmacie.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-2">{pharmacie.nom}</CardTitle>
                      <Badge className={getGardeColor(pharmacie.typeGarde)}>
                        <Clock className="w-3 h-3 mr-1" />
                        {getGardeLabel(pharmacie.typeGarde)}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 mb-4">
                    <div className="flex items-start gap-2 text-sm">
                      <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium">{pharmacie.adresse}</p>
                        <p className="text-muted-foreground">
                          {pharmacie.quartier}, {pharmacie.ville} - {pharmacie.region}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      <a 
                        href={`tel:${pharmacie.telephone}`}
                        className="text-primary hover:underline"
                      >
                        {pharmacie.telephone}
                      </a>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={() => openInMaps(pharmacie)}
                      className="flex-1 gap-2"
                      variant="default"
                    >
                      <Navigation className="w-4 h-4" />
                      Itinéraire
                    </Button>
                    <Button
                      asChild
                      variant="outline"
                      className="gap-2"
                    >
                      <a href={`tel:${pharmacie.telephone}`}>
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
