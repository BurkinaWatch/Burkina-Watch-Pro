
import { useState, useMemo } from "react";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import EmergencyPanel from "@/components/EmergencyPanel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, MapPin, Phone, AlertTriangle, Shield, Activity, Heart, Users } from "lucide-react";

interface EmergencyService {
  id: string;
  name: string;
  type: "Police" | "Gendarmerie" | "Pompiers" | "Hôpitaux" | "Services sociaux" | "ONG";
  city: string;
  address?: string;
  phone: string;
  latitude?: number;
  longitude?: number;
}

// Base de données complète des urgences du Burkina Faso
const urgencesData: EmergencyService[] = [
  // Police Nationale
  { id: "1", name: "Police Nationale - Numéro d'urgence", type: "Police", city: "National", phone: "17", latitude: 12.3714, longitude: -1.5197 },
  { id: "2", name: "Commissariat Central de Ouagadougou", type: "Police", city: "Ouagadougou", address: "Avenue Kwame Nkrumah", phone: "25306024", latitude: 12.3714, longitude: -1.5197 },
  { id: "3", name: "Commissariat de Police de Bobo-Dioulasso", type: "Police", city: "Bobo-Dioulasso", address: "Avenue de la République", phone: "20970017", latitude: 11.1770, longitude: -4.2979 },
  { id: "4", name: "Commissariat de Koudougou", type: "Police", city: "Koudougou", address: "Centre-ville", phone: "25441010", latitude: 12.2529, longitude: -2.3622 },
  { id: "5", name: "Commissariat de Ouahigouya", type: "Police", city: "Ouahigouya", address: "Rue principale", phone: "24550017", latitude: 13.5828, longitude: -2.4214 },
  
  // Gendarmerie
  { id: "6", name: "Gendarmerie Nationale - Centre d'appel", type: "Gendarmerie", city: "National", phone: "50494949", latitude: 12.3714, longitude: -1.5197 },
  { id: "7", name: "Brigade de Gendarmerie de Ouagadougou", type: "Gendarmerie", city: "Ouagadougou", address: "Route de Kaya", phone: "25308484", latitude: 12.3714, longitude: -1.5197 },
  { id: "8", name: "Compagnie de Gendarmerie de Bobo-Dioulasso", type: "Gendarmerie", city: "Bobo-Dioulasso", address: "Quartier Sarfalao", phone: "20970100", latitude: 11.1770, longitude: -4.2979 },
  { id: "9", name: "Brigade Laabal - Lutte contre criminalité", type: "Gendarmerie", city: "Ouagadougou", address: "Zone militaire", phone: "50400504", latitude: 12.3714, longitude: -1.5197 },
  
  // Pompiers
  { id: "10", name: "Sapeurs-Pompiers - Urgence incendie", type: "Pompiers", city: "National", phone: "18", latitude: 12.3714, longitude: -1.5197 },
  { id: "11", name: "Brigade des Sapeurs-Pompiers de Ouagadougou", type: "Pompiers", city: "Ouagadougou", address: "Avenue Charles De Gaulle", phone: "25306018", latitude: 12.3714, longitude: -1.5197 },
  { id: "12", name: "Caserne des Pompiers de Bobo-Dioulasso", type: "Pompiers", city: "Bobo-Dioulasso", address: "Avenue Loudun", phone: "20970018", latitude: 11.1770, longitude: -4.2979 },
  
  // Hôpitaux et Services de Santé
  { id: "13", name: "SAMU - Service d'Aide Médicale Urgente", type: "Hôpitaux", city: "Ouagadougou", phone: "25366824", latitude: 12.3714, longitude: -1.5197 },
  { id: "14", name: "CHU Yalgado Ouédraogo", type: "Hôpitaux", city: "Ouagadougou", address: "Avenue Gamal Abdel Nasser", phone: "25306401", latitude: 12.3834, longitude: -1.5169 },
  { id: "15", name: "CHU Tengandogo", type: "Hôpitaux", city: "Ouagadougou", address: "Quartier Tengandogo", phone: "25402424", latitude: 12.3422, longitude: -1.4819 },
  { id: "16", name: "CHU Sourô Sanou", type: "Hôpitaux", city: "Bobo-Dioulasso", address: "Avenue de la Liberté", phone: "20970217", latitude: 11.1835, longitude: -4.2887 },
  { id: "17", name: "Centre Médical avec Antenne Chirurgicale Schiphra", type: "Hôpitaux", city: "Ouagadougou", address: "Secteur 30", phone: "25375015", latitude: 12.4018, longitude: -1.4760 },
  { id: "18", name: "Clinique Yeredon", type: "Hôpitaux", city: "Ouagadougou", address: "Avenue Kwame Nkrumah", phone: "25360088", latitude: 12.3714, longitude: -1.5197 },
  { id: "19", name: "Centre Médical de Koudougou", type: "Hôpitaux", city: "Koudougou", phone: "25441215", latitude: 12.2529, longitude: -2.3622 },
  { id: "20", name: "Centre Hospitalier Régional de Fada N'Gourma", type: "Hôpitaux", city: "Fada N'Gourma", phone: "24770017", latitude: 12.0614, longitude: 0.3581 },
  
  // Services Sociaux
  { id: "21", name: "Action Sociale - Enfance en danger", type: "Services sociaux", city: "Ouagadougou", phone: "116", latitude: 12.3714, longitude: -1.5197 },
  { id: "22", name: "Ministère de la Femme et de la Famille", type: "Services sociaux", city: "Ouagadougou", address: "Koulouba", phone: "25324901", latitude: 12.3714, longitude: -1.5197 },
  { id: "23", name: "Centre d'Écoute pour Femmes Victimes de Violence", type: "Services sociaux", city: "Ouagadougou", phone: "25306767", latitude: 12.3714, longitude: -1.5197 },
  
  // ONG et Organisations
  { id: "24", name: "Croix-Rouge Burkinabè", type: "ONG", city: "Ouagadougou", address: "Avenue Kwame Nkrumah", phone: "25306313", latitude: 12.3714, longitude: -1.5197 },
  { id: "25", name: "Médecins Sans Frontières", type: "ONG", city: "Ouagadougou", phone: "25361424", latitude: 12.3714, longitude: -1.5197 },
  { id: "26", name: "SOS Enfants Burkina", type: "ONG", city: "Ouagadougou", phone: "25361010", latitude: 12.3714, longitude: -1.5197 },
];

export default function Urgences() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");

  const filteredServices = useMemo(() => {
    return urgencesData.filter(service => {
      const matchesSearch = 
        service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        service.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
        service.phone.includes(searchTerm) ||
        service.type.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesType = selectedType === "all" || service.type === selectedType;
      
      return matchesSearch && matchesType;
    });
  }, [searchTerm, selectedType]);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "Police":
      case "Gendarmerie":
        return <Shield className="w-4 h-4" />;
      case "Pompiers":
        return <AlertTriangle className="w-4 h-4" />;
      case "Hôpitaux":
        return <Activity className="w-4 h-4" />;
      case "Services sociaux":
        return <Heart className="w-4 h-4" />;
      case "ONG":
        return <Users className="w-4 h-4" />;
      default:
        return <Phone className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "Police":
      case "Gendarmerie":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "Pompiers":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "Hôpitaux":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "Services sociaux":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
      case "ONG":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  const handleCall = (phone: string) => {
    window.location.href = `tel:${phone}`;
  };

  const handleViewOnMap = (service: EmergencyService) => {
    if (service.latitude && service.longitude) {
      const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${service.latitude},${service.longitude}`;
      window.open(mapsUrl, '_blank');
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <Header />

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* En-tête */}
        <Card className="mb-6 bg-gradient-to-r from-red-500/10 to-yellow-500/10 border-red-500/20">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold mb-2">Urgences Burkina</h2>
                <p className="text-muted-foreground">
                  Contacts officiels pour les situations critiques au Burkina Faso
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Filtres et Recherche */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Rechercher par nom, ville ou numéro..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="Type de service" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les services</SelectItem>
                  <SelectItem value="Police">Police</SelectItem>
                  <SelectItem value="Gendarmerie">Gendarmerie</SelectItem>
                  <SelectItem value="Pompiers">Pompiers</SelectItem>
                  <SelectItem value="Hôpitaux">Hôpitaux</SelectItem>
                  <SelectItem value="Services sociaux">Services sociaux</SelectItem>
                  <SelectItem value="ONG">ONG</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="mt-4 text-sm text-muted-foreground">
              {filteredServices.length} service{filteredServices.length > 1 ? 's' : ''} trouvé{filteredServices.length > 1 ? 's' : ''}
            </div>
          </CardContent>
        </Card>

        {/* Liste des Services d'Urgence */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredServices.map((service) => (
            <Card key={service.id} className="hover-elevate transition-all">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base font-semibold leading-tight flex-1">
                    {service.name}
                  </CardTitle>
                  {getTypeIcon(service.type)}
                </div>
                <Badge className={`w-fit mt-2 ${getTypeColor(service.type)}`}>
                  {service.type}
                </Badge>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <span className="text-muted-foreground">{service.city}</span>
                </div>
                
                {service.address && (
                  <div className="text-sm text-muted-foreground">
                    {service.address}
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-primary flex-shrink-0" />
                  <a 
                    href={`tel:${service.phone}`}
                    className="text-lg font-bold text-primary hover:underline"
                  >
                    {service.phone}
                  </a>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    onClick={() => handleCall(service.phone)}
                    className="flex-1"
                    variant="default"
                  >
                    <Phone className="w-4 h-4 mr-2" />
                    Appeler
                  </Button>
                  
                  {service.latitude && service.longitude && (
                    <Button
                      onClick={() => handleViewOnMap(service)}
                      variant="outline"
                      size="icon"
                    >
                      <MapPin className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Message si aucun résultat */}
        {filteredServices.length === 0 && (
          <Card className="p-12 text-center">
            <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
            <p className="text-muted-foreground text-lg font-medium">Aucun service trouvé</p>
            <p className="text-muted-foreground/70 text-sm mt-1">
              Essayez de modifier vos critères de recherche
            </p>
          </Card>
        )}

        {/* Note importante */}
        <Card className="mt-6 bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800">
          <CardContent className="p-4">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              <strong>Note importante :</strong> En cas d'urgence vitale, composez le <strong>17</strong> (Police), 
              <strong> 18</strong> (Pompiers) ou <strong> 116</strong> (Enfance en danger). 
              Ces numéros sont gratuits et disponibles 24h/24.
            </p>
          </CardContent>
        </Card>
      </div>

      <EmergencyPanel />
      <BottomNav />
    </div>
  );
}
