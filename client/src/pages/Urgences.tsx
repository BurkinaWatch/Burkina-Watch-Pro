
import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { Helmet } from "react-helmet-async";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import EmergencyPanel from "@/components/EmergencyPanel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Search, MapPin, Phone, AlertTriangle, Shield, Activity, Heart, Users, ArrowLeft, RefreshCw, Download, Smartphone, Loader2, Navigation } from "lucide-react";
import { VoiceSearchButton } from "@/components/VoiceSearchButton";
import { SiWhatsapp } from "react-icons/si";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

interface EmergencyService {
  id: string;
  name: string;
  type: "Police" | "Gendarmerie" | "Pompiers" | "Hôpitaux" | "Services sociaux" | "ONG" | "Ambulance" | "Croix-Rouge";
  city: string;
  region?: string;
  address?: string;
  phone: string;
  email?: string;
  latitude?: number;
  longitude?: number;
  available24h?: boolean;
  services?: string[];
}

export default function Urgences() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [, setLocation] = useLocation();
  const [selectedService, setSelectedService] = useState<EmergencyService | null>(null);
  const [imageStyle, setImageStyle] = useState<"light" | "dark">("light");
  const [isGenerating, setIsGenerating] = useState(false);
  const [urgencesData, setUrgencesData] = useState<EmergencyService[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();
  const lastRefreshRef = useRef<number>(0);
  
  // Proximity sorting state
  const [sortByProximity, setSortByProximity] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  // Calculate distance between two points using Haversine formula
  const calculateDistance = useCallback((lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }, []);

  // Handle proximity sorting
  const handleSortByProximity = useCallback(() => {
    if (sortByProximity) {
      setSortByProximity(false);
      setUserLocation(null);
      return;
    }

    if (!navigator.geolocation) {
      toast({
        title: "Géolocalisation non disponible",
        description: "Votre navigateur ne supporte pas la géolocalisation",
        variant: "destructive",
      });
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setSortByProximity(true);
        setIsLocating(false);
        toast({
          title: "Position trouvée",
          description: "Services d'urgence triés par distance",
        });
      },
      (error) => {
        setIsLocating(false);
        let message = "Impossible d'obtenir votre position";
        if (error.code === error.PERMISSION_DENIED) {
          message = "Veuillez autoriser l'accès à votre position";
        }
        toast({
          title: "Erreur de localisation",
          description: message,
          variant: "destructive",
        });
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [sortByProximity, toast]);

  // Chargement initial des données - exécuté une seule fois au montage
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const response = await fetch("/api/urgences");
        if (!response.ok) throw new Error("Erreur lors du chargement");
        const data = await response.json();
        console.log("Urgences chargées:", data.length, "services");
        setUrgencesData(data);
      } catch (error) {
        console.error("Erreur chargement urgences:", error);
        setUrgencesData([]);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  // Auto-refresh on visibility/focus (avec debounce de 5 secondes)
  useEffect(() => {
    const refreshData = async () => {
      const now = Date.now();
      if (now - lastRefreshRef.current < 5000) return;
      lastRefreshRef.current = now;
      
      try {
        const response = await fetch("/api/urgences");
        if (response.ok) {
          const data = await response.json();
          setUrgencesData(data);
        }
      } catch (error) {
        console.error("Erreur refresh:", error);
      }
    };
    
    const handleVisibilityChange = () => {
      if (!document.hidden) refreshData();
    };
    const handleFocus = () => refreshData();
    
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleFocus);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleFocus);
    };
  }, []);

  const handleRefresh = async () => {
    setIsLoading(true);
    try {
      await fetch("/api/urgences/refresh", { method: "POST" });
      const response = await fetch("/api/urgences");
      if (response.ok) {
        const data = await response.json();
        setUrgencesData(data);
      }
      toast({
        title: "Données actualisées",
        description: "Les services d'urgence ont été mis à jour",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible d'actualiser les données",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredServices = useMemo(() => {
    if (!Array.isArray(urgencesData) || urgencesData.length === 0) {
      return [];
    }
    
    let services = urgencesData.filter(service => {
      if (!service) return false;
      
      const name = service.name || "";
      const city = service.city || "";
      const phone = service.phone || "";
      const type = service.type || "";
      const region = service.region || "";
      const address = service.address || "";
      const search = searchTerm.toLowerCase();
      
      const matchesSearch = !searchTerm || 
        name.toLowerCase().includes(search) ||
        city.toLowerCase().includes(search) ||
        phone.includes(searchTerm) ||
        type.toLowerCase().includes(search) ||
        region.toLowerCase().includes(search) ||
        address.toLowerCase().includes(search);
      
      const matchesType = selectedType === "all" || type === selectedType;
      
      return matchesSearch && matchesType;
    });

    // Sort by proximity if enabled
    if (sortByProximity && userLocation) {
      services = services.map(service => ({
        ...service,
        distance: service.latitude && service.longitude
          ? calculateDistance(userLocation.lat, userLocation.lng, service.latitude, service.longitude)
          : Infinity,
      })).sort((a, b) => (a.distance || Infinity) - (b.distance || Infinity));
    }

    return services;
  }, [urgencesData, searchTerm, selectedType, sortByProximity, userLocation, calculateDistance]);

  // Get distance for a service
  const getServiceDistance = useCallback((service: EmergencyService): number | null => {
    if (!sortByProximity || !userLocation || !service.latitude || !service.longitude) {
      return null;
    }
    return calculateDistance(userLocation.lat, userLocation.lng, service.latitude, service.longitude);
  }, [sortByProximity, userLocation, calculateDistance]);

  // Format distance for display
  const formatDistance = (distance: number): string => {
    if (distance < 1) {
      return `${Math.round(distance * 1000)} m`;
    }
    return `${distance.toFixed(1)} km`;
  };

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

  const generateLockscreenImage = async () => {
    if (!selectedService || !canvasRef.current) return;

    setIsGenerating(true);

    try {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Dimensions pour mobile (9:16 ratio)
      canvas.width = 1080;
      canvas.height = 1920;

      // Couleurs selon le style
      const colors = imageStyle === "light" 
        ? {
            bg: '#FFFFFF',
            primary: '#DC2626', // Rouge
            secondary: '#FBBF24', // Jaune
            accent: '#10B981', // Vert
            text: '#1F2937',
            textSecondary: '#6B7280'
          }
        : {
            bg: '#1F2937',
            primary: '#DC2626',
            secondary: '#FBBF24',
            accent: '#10B981',
            text: '#FFFFFF',
            textSecondary: '#D1D5DB'
          };

      // Fond
      ctx.fillStyle = colors.bg;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Bande tricolore en haut
      const bandHeight = 40;
      ctx.fillStyle = colors.primary;
      ctx.fillRect(0, 0, canvas.width / 3, bandHeight);
      ctx.fillStyle = colors.secondary;
      ctx.fillRect(canvas.width / 3, 0, canvas.width / 3, bandHeight);
      ctx.fillStyle = colors.accent;
      ctx.fillRect((canvas.width / 3) * 2, 0, canvas.width / 3, bandHeight);

      // Logo BurkinaWatch
      ctx.fillStyle = colors.text;
      ctx.font = 'bold 48px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('🇧🇫 BURKINA WATCH', canvas.width / 2, 140);

      // Titre "URGENCE"
      ctx.fillStyle = colors.primary;
      ctx.font = 'bold 80px Arial';
      ctx.fillText('URGENCE', canvas.width / 2, 280);

      // Icône d'urgence
      ctx.font = '200px Arial';
      ctx.fillText('🚨', canvas.width / 2, 520);

      // Nom du service
      ctx.fillStyle = colors.text;
      ctx.font = 'bold 64px Arial';
      const serviceName = selectedService.name.toUpperCase();
      const maxWidth = canvas.width - 100;
      
      // Découper le texte si trop long
      const words = serviceName.split(' ');
      let line = '';
      let y = 680;
      const lineHeight = 75;

      for (let i = 0; i < words.length; i++) {
        const testLine = line + words[i] + ' ';
        const metrics = ctx.measureText(testLine);
        
        if (metrics.width > maxWidth && i > 0) {
          ctx.fillText(line, canvas.width / 2, y);
          line = words[i] + ' ';
          y += lineHeight;
        } else {
          line = testLine;
        }
      }
      ctx.fillText(line, canvas.width / 2, y);

      // Numéro d'urgence (très gros)
      y += 150;
      ctx.fillStyle = colors.primary;
      ctx.font = 'bold 180px Arial';
      ctx.fillText(selectedService.phone, canvas.width / 2, y);

      // Ville
      y += 120;
      ctx.fillStyle = colors.textSecondary;
      ctx.font = '48px Arial';
      ctx.fillText(selectedService.city, canvas.width / 2, y);

      // Adresse si disponible
      if (selectedService.address) {
        y += 70;
        ctx.font = '36px Arial';
        ctx.fillText(selectedService.address, canvas.width / 2, y);
      }

      // Instructions en bas
      y = canvas.height - 200;
      ctx.fillStyle = colors.accent;
      ctx.font = 'bold 42px Arial';
      ctx.fillText('APPELER EN CAS D\'URGENCE', canvas.width / 2, y);

      // Footer
      y = canvas.height - 100;
      ctx.fillStyle = colors.textSecondary;
      ctx.font = '32px Arial';
      ctx.fillText('Généré par BurkinaWatch • Burkina Faso', canvas.width / 2, y);

      // Bande tricolore en bas
      ctx.fillStyle = colors.primary;
      ctx.fillRect(0, canvas.height - bandHeight, canvas.width / 3, bandHeight);
      ctx.fillStyle = colors.secondary;
      ctx.fillRect(canvas.width / 3, canvas.height - bandHeight, canvas.width / 3, bandHeight);
      ctx.fillStyle = colors.accent;
      ctx.fillRect((canvas.width / 3) * 2, canvas.height - bandHeight, canvas.width / 3, bandHeight);

      // Télécharger l'image
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `urgence-${selectedService.phone}-lockscreen.png`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);

          toast({
            title: "Image générée !",
            description: "L'image a été téléchargée. Définissez-la comme fond d'écran de verrouillage dans les paramètres de votre téléphone.",
          });

          setSelectedService(null);
        }
      }, 'image/png');

    } catch (error) {
      console.error('Erreur génération image:', error);
      toast({
        title: "Erreur",
        description: "Impossible de générer l'image",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <Helmet>
        <title>Numeros d'Urgence - Burkina Watch</title>
      </Helmet>
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
            onClick={handleRefresh}
            className="gap-2 ml-auto"
          >
            <RefreshCw className="w-4 h-4" />
            Actualiser
          </Button>
        </div>

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

        {/* Brigade Laabal Card */}
        <Card className="mb-6 border-blue-500/30 bg-blue-500/5">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                  <Shield className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">Brigade Laabal</h3>
                  <p className="text-muted-foreground">Restauration de l'ordre public et lutte contre l'incivisme</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/20">Numéro Vert</Badge>
                    <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/20">24H/24</Badge>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                <Button 
                  size="lg" 
                  className="flex-1 md:flex-none gap-2 bg-blue-600 hover:bg-blue-700"
                  onClick={() => window.location.href = "tel:50400504"}
                >
                  <Phone className="w-5 h-5" />
                  <span className="text-lg font-bold">Appeler le 50 40 05 04</span>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* CNA Card */}
        <Card className="mb-6 border-primary/30 bg-primary/5">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <Phone className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">Centre National d'Appel (CNA)</h3>
                  <p className="text-muted-foreground">Signaler tout fait suspect ou acte de terrorisme</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">24H/24</Badge>
                    <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">7J/7</Badge>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                <Button 
                  size="lg" 
                  className="flex-1 md:flex-none gap-2 bg-primary hover:bg-primary/90"
                  onClick={() => window.location.href = "tel:199"}
                >
                  <Phone className="w-5 h-5" />
                  <span className="text-lg font-bold">Appeler le 199</span>
                </Button>
                
                <div className="flex flex-col gap-2">
                  <Button 
                    variant="outline" 
                    size="lg"
                    className="flex-1 md:flex-none gap-2 border-green-500 text-green-600 hover:bg-green-50 dark:hover:bg-green-950/20"
                    onClick={() => window.open("https://wa.me/22671203333", "_blank")}
                  >
                    <SiWhatsapp className="w-5 h-5" />
                    <span>WhatsApp 71 20 33 33</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    size="lg"
                    className="flex-1 md:flex-none gap-2 border-green-500 text-green-600 hover:bg-green-50 dark:hover:bg-green-950/20"
                    onClick={() => window.open("https://wa.me/22668244444", "_blank")}
                  >
                    <SiWhatsapp className="w-5 h-5" />
                    <span>WhatsApp 68 24 44 44</span>
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Filtres et Recherche */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Rechercher par nom, ville ou numéro..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <VoiceSearchButton onQueryChange={setSearchTerm} />
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
              <Button
                variant={sortByProximity ? "default" : "outline"}
                onClick={handleSortByProximity}
                disabled={isLocating}
                className={`gap-2 ${sortByProximity ? "bg-green-600 hover:bg-green-700" : ""}`}
                data-testid="button-sort-proximity"
              >
                {isLocating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Navigation className="w-4 h-4" />
                )}
                Les plus proches
              </Button>
            </div>
            <div className="mt-4 text-sm text-muted-foreground flex items-center gap-2">
              <span>{filteredServices.length} service{filteredServices.length > 1 ? 's' : ''} trouvé{filteredServices.length > 1 ? 's' : ''}</span>
              {sortByProximity && (
                <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                  Triés par proximité
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Loader */}
        {isLoading && (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <span className="ml-2 text-muted-foreground">Chargement des services d'urgence...</span>
          </div>
        )}

        {/* Liste des Services d'Urgence */}
        {!isLoading && (
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
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge className={`w-fit ${getTypeColor(service.type)}`}>
                    {service.type}
                  </Badge>
                  {(() => {
                    const distance = getServiceDistance(service);
                    return distance !== null ? (
                      <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                        <Navigation className="w-3 h-3 mr-1" />
                        {formatDistance(distance)}
                      </Badge>
                    ) : null;
                  })()}
                </div>
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

                <Button
                  onClick={() => setSelectedService(service)}
                  variant="outline"
                  className="w-full mt-2 gap-2"
                >
                  <Smartphone className="w-4 h-4" />
                  Mettre sur écran de veille
                </Button>
              </CardContent>
            </Card>
          ))}
          </div>
        )}

        {/* Message si aucun résultat */}
        {!isLoading && filteredServices.length === 0 && (
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

      {/* Modal de génération d'image */}
      <Dialog open={!!selectedService} onOpenChange={(open) => !open && setSelectedService(null)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Smartphone className="w-5 h-5" />
              Générer image d'urgence
            </DialogTitle>
            <DialogDescription>
              Créez une image pour votre écran de verrouillage avec ce numéro d'urgence
            </DialogDescription>
          </DialogHeader>

          {selectedService && (
            <div className="space-y-4 py-4">
              <div className="bg-muted p-4 rounded-lg">
                <p className="font-semibold">{selectedService.name}</p>
                <p className="text-2xl font-bold text-primary mt-2">{selectedService.phone}</p>
                <p className="text-sm text-muted-foreground mt-1">{selectedService.city}</p>
              </div>

              <div className="space-y-3">
                <Label>Style de l'image</Label>
                <RadioGroup value={imageStyle} onValueChange={(value) => setImageStyle(value as "light" | "dark")}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="light" id="light" />
                    <Label htmlFor="light" className="cursor-pointer">Clair (fond blanc)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="dark" id="dark" />
                    <Label htmlFor="dark" className="cursor-pointer">Sombre (fond noir)</Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 p-3 rounded-lg">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  <strong>Comment l'utiliser :</strong> Après téléchargement, allez dans les paramètres de votre téléphone → Fond d'écran → Écran de verrouillage → Sélectionnez l'image téléchargée.
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedService(null)}>
              Annuler
            </Button>
            <Button onClick={generateLockscreenImage} disabled={isGenerating}>
              {isGenerating ? (
                <>Génération...</>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Générer et télécharger
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Canvas caché pour la génération d'image */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      <EmergencyPanel />
      <BottomNav />
    </div>
  );
}
