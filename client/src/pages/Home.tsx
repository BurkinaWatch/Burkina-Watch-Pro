import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import EmergencyPanel from "@/components/EmergencyPanel";
import SignalementCard from "@/components/SignalementCard";
import StatCard from "@/components/StatCard";
import MessageDuJour from "@/components/MessageDuJour";
import { AlertCircle, Shield, Users, TrendingUp, ArrowRight, Loader2, Heart, AlertTriangle, Search, X, MapPin, Filter } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import type { Signalement } from "@shared/schema";
import heroImage from "@assets/generated_images/Citizens_collaborating_with_smartphones_in_Burkina_68dc35a5.png";
import { useTranslation } from "react-i18next";
import { useState, useEffect } from "react";

interface Stats {
  totalSignalements: number;
  sosCount: number;
  totalUsers: number;
  onlineUsers: number;
}

// Données géographiques complètes du Burkina Faso - 17 régions et 47 provinces
const BURKINA_REGIONS = [
  {
    name: 'Bankui',
    chefLieu: 'Dédougou',
    provinces: [
      { name: 'Mouhoun', chefLieu: 'Dédougou', communes: ['Bondokuy', 'Dédougou', 'Douroula', 'Kona', 'Ouarkoye', 'Safané', 'Tchériba'] },
      { name: 'Balé', chefLieu: 'Boromo', communes: ['Bagassi', 'Bana', 'Boromo', 'Fara', 'Pa', 'Pompoï', 'Poura', 'Oury', 'Siby', 'Yaho'] },
      { name: 'Banwa', chefLieu: 'Solenzo', communes: ['Balavé', 'Kouka', 'Sami', 'Sanaba', 'Solenzo', 'Tansila'] },
      { name: 'Kossi', chefLieu: 'Nouna', communes: ['Barani', 'Bomborokuy', 'Dédougou', 'Djibasso', 'Doumbala', 'Kombori', 'Madouba', 'Nouna', 'Sont', 'Toma'] },
      { name: 'Nayala', chefLieu: 'Toma', communes: ['Gassan', 'Gossina', 'Kougny', 'Toma', 'Yaba', 'Yé'] },
      { name: 'Sourou', chefLieu: 'Tougan', communes: ['Di', 'Gomboro', 'Kassoum', 'Kiembara', 'Lanfièra', 'Lankoué', 'Tougan'] }
    ]
  },
  {
    name: 'Djôrô',
    chefLieu: 'Gaoua',
    provinces: [
      { name: 'Bougouriba', chefLieu: 'Diébougou', communes: ['Gbondjigui', 'Diébougou', 'Dolo', 'Nioronioro', 'Tiankoura'] },
      { name: 'Ioba', chefLieu: 'Dano', communes: ['Dano', 'Dissihn', 'Guéguéré', 'Koper', 'Niégo', 'Oronkua', 'Ouéssa', 'Zambo'] },
      { name: 'Noumbiel', chefLieu: 'Batié', communes: ['Batié', 'Boussoukoula', 'Kpéré', 'Legmoin', 'Midebdo'] },
      { name: 'Poni', chefLieu: 'Gaoua', communes: ['Bouroum-Bouroum', 'Bousséra', 'Djigouè', 'Gaoua', 'Gbomblora', 'Kampti', 'Loropéni', 'Malba', 'Nako', 'Périgban'] }
    ]
  },
  {
    name: 'Goulmou',
    chefLieu: 'Fada N\'Gourma',
    provinces: [
      { name: 'Gourma', chefLieu: 'Fada N\'Gourma', communes: ['Diabo', 'Diapangou', 'Fada N\'Gourma', 'Matiacoali', 'Tibga', 'Yamba'] },
      { name: 'Kompienga', chefLieu: 'Pama', communes: ['Kompienga', 'Pama', 'Madjoari'] },
      { name: 'Tapoa', chefLieu: 'Diapaga', communes: ['Bottou', 'Diapaga', 'Kantchari', 'Logobou', 'Namounou', 'Partiaga', 'Tambaga', 'Tansarga'] }
    ]
  },
  {
    name: 'Guiriko',
    chefLieu: 'Bobo-Dioulasso',
    provinces: [
      { name: 'Houet', chefLieu: 'Bobo-Dioulasso', communes: ['Bama', 'Bobo-Dioulasso', 'Dandé', 'Karangasso-Sambla', 'Karangasso-Viguè', 'Koundougou', 'Faramana', 'Fô', 'Léna', 'Padéma', 'Péni', 'Satiri', 'Toussiana'] },
      { name: 'Kénédougou', chefLieu: 'Orodara', communes: ['Banzon', 'Djigouèra', 'Kangala', 'Kayan', 'Koloko', 'Kourouma', 'Kourinion', 'Morolaba', 'N\'Dorola', 'Orodara', 'Samôgôyiri', 'Samorogouan', 'Sindo'] },
      { name: 'Tuy', chefLieu: 'Houndé', communes: ['Béréba', 'Boni', 'Boura', 'Houndé', 'Koti', 'Koumbia'] }
    ]
  },
  {
    name: 'Kadiogo',
    chefLieu: 'Ouagadougou',
    provinces: [
      { name: 'Kadiogo', chefLieu: 'Ouagadougou', communes: ['Ouagadougou', 'Komki-Ipala', 'Komsilga', 'Koubri', 'Pabré', 'Saaba', 'Tanghin-Dassouri'] }
    ]
  },
  {
    name: 'Koom-Kuuli',
    chefLieu: 'Réo',
    provinces: [
      { name: 'Boulkiemdé', chefLieu: 'Koudougou', communes: ['Bingo', 'Imasgo', 'Kindi', 'Kokologho', 'Koudougou', 'Kokologo', 'Nanoro', 'Pella', 'Poa', 'Ramongo', 'Sabou', 'Siglé', 'Soaw', 'Sourgou', 'Thyou'] },
      { name: 'Sanguié', chefLieu: 'Réo', communes: ['Dassa', 'Didyr', 'Godyr', 'Kordié', 'Kyon', 'Pouni', 'Réo', 'Ténado', 'Zawara'] },
      { name: 'Sissili', chefLieu: 'Léo', communes: ['Biéha', 'Boura', 'Lèo', 'Nébiélianayou', 'Niabouri', 'Silly', 'Tô'] },
      { name: 'Ziro', chefLieu: 'Sapouy', communes: ['Bakata', 'Bougnounou', 'Cassou', 'Dalo', 'Gao', 'Sapouy'] }
    ]
  },
  {
    name: 'Kom-Pangala',
    chefLieu: 'Tenkodogo',
    provinces: [
      { name: 'Boulgou', chefLieu: 'Tenkodogo', communes: ['Bané', 'Bittou', 'Bagré', 'Béguédo', 'Bissiga', 'Garango', 'Komtoéga', 'Niaogho', 'Tenkodogo', 'Zabré', 'Zoaga', 'Zonsé'] },
      { name: 'Koulpélogo', chefLieu: 'Ouargaye', communes: ['Comin-Yanga', 'Lalgaye', 'Ouargaye', 'Sangha', 'Soudougui', 'Yargatenga'] },
      { name: 'Kouritenga', chefLieu: 'Koupéla', communes: ['Andemtenga', 'Baskouré', 'Dialgaye', 'Gounghin', 'Kando', 'Koupéla', 'Pouytenga', 'Tensobentenga', 'Yargo'] }
    ]
  },
  {
    name: 'Nakambga',
    chefLieu: 'Ziniaré',
    provinces: [
      { name: 'Ganzourgou', chefLieu: 'Zorgho', communes: ['Boudry', 'Cognoré', 'Méguet', 'Mogtédo', 'Zam', 'Zorgho', 'Zoungou'] },
      { name: 'Kourwéogo', chefLieu: 'Boussé', communes: ['Boussé', 'Laye', 'Niou', 'Sourgoubila'] },
      { name: 'Oubritenga', chefLieu: 'Ziniaré', communes: ['Absouya', 'Dapélogo', 'Loumbila', 'Nagréongo', 'Ziniaré', 'Zitenga'] }
    ]
  },
  {
    name: 'Passoré',
    chefLieu: 'Yako',
    provinces: [
      { name: 'Passoré', chefLieu: 'Yako', communes: ['Arbollé', 'Bagaré', 'Bokin', 'Bourzanga', 'Gomponsom', 'Kirsi', 'La-Todin', 'Pilimpikou', 'Samba', 'Yako'] }
    ]
  },
  {
    name: 'Poni-Tiari',
    chefLieu: 'Banfora',
    provinces: [
      { name: 'Comoé', chefLieu: 'Banfora', communes: ['Banfora', 'Bérégadougou', 'Douna', 'Mangodara', 'Moussodougou', 'Niangoloko', 'Ouo', 'Sidéradougou', 'Soubakaniédougou', 'Tiéfora'] },
      { name: 'Léraba', chefLieu: 'Sindou', communes: ['Dakoro', 'Doussié', 'Loumana', 'Niankorodougou', 'Ouéléni', 'Sindou', 'Wolonkoto'] }
    ]
  },
  {
    name: 'Sahel',
    chefLieu: 'Dori',
    provinces: [
      { name: 'Oudalan', chefLieu: 'Gorom-Gorom', communes: ['Déou', 'Gorom-Gorom', 'Markoye', 'Oursi', 'Tin-Akof'] },
      { name: 'Séno', chefLieu: 'Dori', communes: ['Bani', 'Boundoré', 'Dori', 'Falagountou', 'Gandafabou', 'Gorgadji', 'Sampelga', 'Seytenga'] },
      { name: 'Soum', chefLieu: 'Djibo', communes: ['Aribinda', 'Baraboulé', 'Djibo', 'Tongomayel', 'Kelbo', 'Nassoumbou', 'Pobé-Mengao'] },
      { name: 'Yagha', chefLieu: 'Sebba', communes: ['Boundoré', 'Mansila', 'Sebba', 'Sollé', 'Tankougounadié', 'Titabé'] }
    ]
  },
  {
    name: 'Taar-Soomba',
    chefLieu: 'Manga',
    provinces: [
      { name: 'Bazèga', chefLieu: 'Kombissiri', communes: ['Doulougou', 'Gaongo', 'Ipelcé', 'Kayao', 'Kombissiri', 'Saponé', 'Toécé'] },
      { name: 'Nahouri', chefLieu: 'Pô', communes: ['Guiaro', 'Pô', 'Tiébélé', 'Ziou'] },
      { name: 'Zoundwéogo', chefLieu: 'Manga', communes: ['Béré', 'Bindé', 'Gogo', 'Gomboussougou', 'Guiba', 'Manga'] }
    ]
  },
  {
    name: 'Taoud-Weogo',
    chefLieu: 'Ouahigouya',
    provinces: [
      { name: 'Loroum', chefLieu: 'Titao', communes: ['Ouindigui', 'Sollé', 'Soum', 'Titao'] },
      { name: 'Yatenga', chefLieu: 'Ouahigouya', communes: ['Bahn', 'Kalsaka', 'Kaïn', 'Koumbri', 'Namissiguima', 'Ouahigouya', 'Oula', 'Rambo', 'Séguénéga', 'Tangaye', 'Thiou', 'Zogoré'] },
      { name: 'Zandoma', chefLieu: 'Gourcy', communes: ['Bassi', 'Boussou', 'Gourcy', 'Léba', 'Soubou', 'Tougo'] }
    ]
  },
  {
    name: 'Tondeka',
    chefLieu: 'Kaya',
    provinces: [
      { name: 'Bam', chefLieu: 'Kongoussi', communes: ['Bourzanga', 'Guibaré', 'Kongoussi', 'Nasséré', 'Rollo', 'Rouko', 'Sabcé', 'Tikaré', 'Zimtenga'] },
      { name: 'Namentenga', chefLieu: 'Boulsa', communes: ['Boala', 'Boulsa', 'Bouroum', 'Dargo', 'Nagbingou', 'Tougouri', 'Yalgo', 'Zéguédéguin'] },
      { name: 'Sanmatenga', chefLieu: 'Kaya', communes: ['Barsalogho', 'Boussouma', 'Dablo', 'Kaya', 'Korsimoro', 'Mané', 'Pensa', 'Pibaoré', 'Pibaroré', 'Pissila'] }
    ]
  },
  {
    name: 'Wètemga',
    chefLieu: 'Manga',
    provinces: [
      { name: 'Gnagna', chefLieu: 'Bogandé', communes: ['Bilanga', 'Bogandé', 'Coalla', 'Liptougou', 'Manni', 'Piéla', 'Thion'] },
      { name: 'Komondjari', chefLieu: 'Gayéri', communes: ['Bartiébougou', 'Foutouri', 'Gayéri'] }
    ]
  },
  {
    name: 'Yirka-Gaongo',
    chefLieu: 'Koudougou',
    provinces: [
      { name: 'Balé', chefLieu: 'Boromo', communes: ['Bagassi', 'Bana', 'Boromo', 'Fara', 'Pa', 'Pompoï', 'Poura', 'Oury', 'Siby', 'Yaho'] }
    ]
  },
  {
    name: 'Yonyoosé',
    chefLieu: 'Fada N\'Gourma',
    provinces: [
      { name: 'Gnagna', chefLieu: 'Bogandé', communes: ['Bilanga', 'Bogandé', 'Coalla', 'Liptougou', 'Manni', 'Piéla', 'Thion'] }
    ]
  }
];

export default function Home() {
  const { t } = useTranslation();
  const [, setLocation] = useLocation();
  
  // Images pour le carrousel
  const heroImages = [
    heroImage,
    heroImage, // Vous pouvez ajouter d'autres images ici
  ];
  
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showSearchResults, setShowSearchResults] = useState<boolean>(false);
  const [selectedSearchFilters, setSelectedSearchFilters] = useState<{
    categorie?: string;
    region?: string;
    province?: string;
    dateDebut?: string;
    dateFin?: string;
    statut?: string;
  }>({});
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  
  // Récupérer les signalements
  const { data: signalements = [], isLoading } = useQuery<Signalement[]>({
    queryKey: ["/api/signalements"],
    queryFn: async () => {
      const response = await fetch("/api/signalements");
      if (!response.ok) throw new Error("Erreur lors du chargement");
      return response.json();
    },
  });

  // Changer l'image toutes les 30 secondes
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => 
        (prevIndex + 1) % heroImages.length
      );
    }, 30000); // 30 secondes

    return () => clearInterval(interval);
  }, [heroImages.length]);

  // Recherche améliorée avec filtres multiples
  useEffect(() => {
    if (!searchQuery.trim() && Object.keys(selectedSearchFilters).length === 0) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    const query = searchQuery.toLowerCase().trim();
    const results: any[] = [];

    // Rechercher dans les signalements avec filtres
    signalements.forEach(signalement => {
      const localisation = signalement.localisation?.toLowerCase() || '';
      const titre = signalement.titre?.toLowerCase() || '';
      const description = signalement.description?.toLowerCase() || '';
      
      // Vérifier si le signalement correspond aux critères
      let matches = true;
      
      // Filtre par texte de recherche
      if (query) {
        const matchesSearch = localisation.includes(query) || 
                            titre.includes(query) || 
                            description.includes(query);
        if (!matchesSearch) matches = false;
      }
      
      // Filtre par catégorie
      if (selectedSearchFilters.categorie && signalement.categorie !== selectedSearchFilters.categorie) {
        matches = false;
      }
      
      // Filtre par région
      if (selectedSearchFilters.region) {
        const regionMatch = BURKINA_REGIONS.find(r => r.name === selectedSearchFilters.region);
        if (regionMatch) {
          const inRegion = localisation.includes(regionMatch.name.toLowerCase()) || 
                          localisation.includes(regionMatch.chefLieu.toLowerCase());
          if (!inRegion) matches = false;
        }
      }
      
      // Filtre par province
      if (selectedSearchFilters.province) {
        if (!localisation.includes(selectedSearchFilters.province.toLowerCase())) {
          matches = false;
        }
      }
      
      // Filtre par date
      if (selectedSearchFilters.dateDebut) {
        const signalementDate = new Date(signalement.createdAt!);
        const dateDebut = new Date(selectedSearchFilters.dateDebut);
        if (signalementDate < dateDebut) matches = false;
      }
      
      if (selectedSearchFilters.dateFin) {
        const signalementDate = new Date(signalement.createdAt!);
        const dateFin = new Date(selectedSearchFilters.dateFin);
        if (signalementDate > dateFin) matches = false;
      }
      
      // Filtre par statut
      if (selectedSearchFilters.statut) {
        if (selectedSearchFilters.statut === 'sos' && !signalement.isSOS) matches = false;
        if (selectedSearchFilters.statut === 'resolu' && signalement.statut !== 'resolu') matches = false;
        if (selectedSearchFilters.statut === 'en_cours' && signalement.statut !== 'en_cours') matches = false;
      }
      
      if (matches) {
        results.push({
          type: 'signalement',
          id: signalement.id,
          titre: signalement.titre,
          description: signalement.description,
          localisation: signalement.localisation,
          latitude: signalement.latitude,
          longitude: signalement.longitude,
          categorie: signalement.categorie,
          isSOS: signalement.isSOS,
          statut: signalement.statut,
          createdAt: signalement.createdAt,
          likes: signalement.likes || 0
        });
      }
    });

    // Ajouter des suggestions géographiques si recherche textuelle
    if (query && query.length >= 2) {
      BURKINA_REGIONS.forEach(region => {
        if (region.name.toLowerCase().includes(query) || region.chefLieu.toLowerCase().includes(query)) {
          results.push({
            type: 'region',
            name: region.name,
            chefLieu: region.chefLieu,
            nbProvinces: region.provinces.length
          });
        }

        region.provinces.forEach(province => {
          if (province.name.toLowerCase().includes(query) || province.chefLieu.toLowerCase().includes(query)) {
            results.push({
              type: 'province',
              name: province.name,
              chefLieu: province.chefLieu,
              region: region.name
            });
          }

          province.communes.forEach(commune => {
            if (commune.toLowerCase().includes(query)) {
              results.push({
                type: 'commune',
                name: commune,
                province: province.name,
                region: region.name
              });
            }
          });
        });
      });
    }

    // Trier les résultats : SOS en premier, puis par popularité
    results.sort((a, b) => {
      if (a.type === 'signalement' && b.type === 'signalement') {
        if (a.isSOS && !b.isSOS) return -1;
        if (!a.isSOS && b.isSOS) return 1;
        return (b.likes || 0) - (a.likes || 0);
      }
      if (a.type === 'signalement') return -1;
      if (b.type === 'signalement') return 1;
      return 0;
    });

    setSearchResults(results.slice(0, 20));
    setShowSearchResults(true);
  }, [searchQuery, signalements, selectedSearchFilters]);

  const { data: stats } = useQuery<Stats>({
    queryKey: ["/api/stats"],
    queryFn: async () => {
      const response = await fetch("/api/stats");
      if (!response.ok) throw new Error("Erreur lors du chargement des statistiques");
      return response.json();
    },
  });

  const recentReports = signalements.slice(0, 3);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <section className="relative h-[50vh] sm:h-[60vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={heroImages[currentImageIndex]}
            alt="Citoyens burkinabè engagés"
            className="w-full h-full object-cover transition-opacity duration-1000"
            key={currentImageIndex}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-background" />
        </div>

        <div className="relative z-10 text-center px-4 text-white w-full max-w-7xl mx-auto">
          <h1 className="text-4xl sm:text-6xl md:text-8xl font-black mb-4 sm:mb-6 tracking-tight drop-shadow-2xl">
            <span className="bg-gradient-to-r from-white via-gray-100 to-white bg-clip-text text-transparent">
              Burkina Watch
            </span>
          </h1>
          <p className="text-lg sm:text-2xl md:text-4xl mb-3 sm:mb-4 font-bold drop-shadow-lg">
            <span className="text-red-500 dark:text-red-400">Voir.</span>{" "}
            <span className="text-yellow-400 dark:text-yellow-300">Agir.</span>{" "}
            <span className="text-green-500 dark:text-green-400">Protéger.</span>
          </p>
          <p className="text-base sm:text-xl md:text-2xl mb-6 sm:mb-8 max-w-3xl mx-auto font-medium text-green-100 drop-shadow-md px-2">
            {t('app.description')}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4">
            <Link href="/publier">
              <Button size="lg" className="w-full sm:w-auto backdrop-blur-sm bg-red-600 hover:bg-red-700 text-white border-red-700" data-testid="button-new-report">
                <AlertCircle className="w-5 h-5 mr-2" />
                {t('home.newReport')}
              </Button>
            </Link>
            <Link href="/carte">
              <Button size="lg" variant="outline" className="w-full sm:w-auto backdrop-blur-sm bg-background/10 border-white text-white hover:bg-background/20" data-testid="button-view-map">
                {t('home.viewMap')}
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Section de recherche géographique */}
      <section className="max-w-7xl mx-auto px-4 py-8 sm:py-12">
        <Card className="p-4 sm:p-6 bg-card shadow-xl border-2">
          <div className="mb-4">
            <h2 className="text-xl sm:text-2xl font-bold mb-2 flex items-center gap-2">
              <Search className="w-6 h-6 text-primary" />
              Recherche géographique
            </h2>
            <p className="text-sm text-muted-foreground">
              Trouvez les signalements par région, province ou commune
            </p>
          </div>

          

          {/* Filtres rapides */}
          <div className="flex gap-2 mb-3 flex-wrap">
            <Button
              variant={showAdvancedFilters ? "default" : "outline"}
              size="sm"
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className="gap-2"
            >
              <Filter className="w-4 h-4" />
              Filtres avancés
              {Object.keys(selectedSearchFilters).length > 0 && (
                <span className="ml-1 bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs">
                  {Object.keys(selectedSearchFilters).length}
                </span>
              )}
            </Button>
            
            {Object.keys(selectedSearchFilters).length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedSearchFilters({})}
                className="gap-2"
              >
                <X className="w-4 h-4" />
                Effacer filtres
              </Button>
            )}
          </div>

          {/* Filtres avancés */}
          {showAdvancedFilters && (
            <div className="mb-3 p-4 border rounded-lg bg-muted/50 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Filtre par catégorie */}
                <div>
                  <label className="text-xs font-medium mb-1 block">Catégorie</label>
                  <Select
                    value={selectedSearchFilters.categorie || 'all'}
                    onValueChange={(value) => setSelectedSearchFilters({...selectedSearchFilters, categorie: value === 'all' ? undefined : value})}
                  >
                    <SelectTrigger className="text-sm">
                      <SelectValue placeholder="Toutes les catégories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toutes les catégories</SelectItem>
                      <SelectItem value="insecurite">Insécurité</SelectItem>
                      <SelectItem value="infrastructure">Infrastructure</SelectItem>
                      <SelectItem value="sante">Santé</SelectItem>
                      <SelectItem value="environnement">Environnement</SelectItem>
                      <SelectItem value="social">Social</SelectItem>
                      <SelectItem value="autre">Autre</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Filtre par région */}
                <div>
                  <label className="text-xs font-medium mb-1 block">Région</label>
                  <Select
                    value={selectedSearchFilters.region || 'all'}
                    onValueChange={(value) => setSelectedSearchFilters({...selectedSearchFilters, region: value === 'all' ? undefined : value})}
                  >
                    <SelectTrigger className="text-sm">
                      <SelectValue placeholder="Toutes les régions" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toutes les régions</SelectItem>
                      {BURKINA_REGIONS.map(region => (
                        <SelectItem key={region.name} value={region.name}>
                          {region.name} ({region.chefLieu})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Filtre par statut */}
                <div>
                  <label className="text-xs font-medium mb-1 block">Statut</label>
                  <Select
                    value={selectedSearchFilters.statut || 'all'}
                    onValueChange={(value) => setSelectedSearchFilters({...selectedSearchFilters, statut: value === 'all' ? undefined : value})}
                  >
                    <SelectTrigger className="text-sm">
                      <SelectValue placeholder="Tous les statuts" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les statuts</SelectItem>
                      <SelectItem value="sos">🚨 SOS uniquement</SelectItem>
                      <SelectItem value="en_cours">En cours</SelectItem>
                      <SelectItem value="resolu">Résolu</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Filtre par date */}
                <div>
                  <label className="text-xs font-medium mb-1 block">Période</label>
                  <div className="flex gap-2">
                    <Input
                      type="date"
                      value={selectedSearchFilters.dateDebut || ''}
                      onChange={(e) => setSelectedSearchFilters({...selectedSearchFilters, dateDebut: e.target.value || undefined})}
                      className="text-sm"
                      placeholder="Début"
                    />
                    <Input
                      type="date"
                      value={selectedSearchFilters.dateFin || ''}
                      onChange={(e) => setSelectedSearchFilters({...selectedSearchFilters, dateFin: e.target.value || undefined})}
                      className="text-sm"
                      placeholder="Fin"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Barre de recherche */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Rechercher par adresse, titre ou description..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (e.target.value.trim() && !searchHistory.includes(e.target.value.trim())) {
                  setSearchHistory([e.target.value.trim(), ...searchHistory].slice(0, 5));
                }
              }}
              className="pl-10 pr-10"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7"
                onClick={() => {
                  setSearchQuery('');
                  setShowSearchResults(false);
                }}
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>

          {/* Résultats de recherche */}
          {showSearchResults && searchResults.length > 0 && (
            <div className="mt-4 max-h-[500px] overflow-y-auto border rounded-md bg-background shadow-lg">
              <div className="p-2 border-b bg-muted/50 sticky top-0 z-10">
                <p className="text-xs font-medium text-muted-foreground">
                  {searchResults.filter(r => r.type === 'signalement').length} signalement{searchResults.filter(r => r.type === 'signalement').length > 1 ? 's' : ''} 
                  {searchResults.filter(r => r.type !== 'signalement').length > 0 && 
                    ` + ${searchResults.filter(r => r.type !== 'signalement').length} suggestion${searchResults.filter(r => r.type !== 'signalement').length > 1 ? 's' : ''} géographique${searchResults.filter(r => r.type !== 'signalement').length > 1 ? 's' : ''}`
                  }
                </p>
              </div>
              
              {/* Signalements */}
              {searchResults.filter(r => r.type === 'signalement').length > 0 && (
                <div className="border-b">
                  <div className="p-2 bg-muted/30">
                    <p className="text-xs font-semibold uppercase tracking-wide">Signalements</p>
                  </div>
                  {searchResults.filter(r => r.type === 'signalement').map((result, index) => (
                    <button
                      key={`sig-${index}`}
                      onClick={() => {
                        setSearchQuery('');
                        setShowSearchResults(false);
                        setLocation(`/carte?lat=${result.latitude}&lng=${result.longitude}&id=${result.id}`);
                      }}
                      className="w-full text-left px-3 py-3 hover:bg-accent transition-colors flex items-start gap-3 border-b last:border-b-0"
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${result.isSOS ? 'bg-destructive/10' : 'bg-primary/10'}`}>
                        {result.isSOS ? (
                          <AlertTriangle className="w-4 h-4 text-destructive" />
                        ) : (
                          <MapPin className="w-4 h-4 text-primary" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm flex items-center gap-2">
                          {result.titre}
                          {result.isSOS && (
                            <span className="text-[10px] font-bold text-destructive bg-destructive/10 px-1.5 py-0.5 rounded">SOS</span>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1 space-y-0.5">
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {result.localisation}
                          </div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="bg-muted px-1.5 py-0.5 rounded text-[10px]">{result.categorie}</span>
                            <span className="text-[10px]">❤️ {result.likes || 0}</span>
                            <span className="text-[10px]">
                              {new Date(result.createdAt).toLocaleDateString('fr-FR', { 
                                day: 'numeric', 
                                month: 'short' 
                              })}
                            </span>
                          </div>
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-1" />
                    </button>
                  ))}
                </div>
              )}

              {/* Suggestions géographiques */}
              {searchResults.filter(r => r.type !== 'signalement').length > 0 && (
                <div>
                  <div className="p-2 bg-muted/30">
                    <p className="text-xs font-semibold uppercase tracking-wide">Suggestions géographiques</p>
                  </div>
                  {searchResults.filter(r => r.type !== 'signalement').map((result, index) => (
                    <button
                      key={`geo-${index}`}
                      onClick={() => {
                        if (result.type === 'region') {
                          setSelectedSearchFilters({...selectedSearchFilters, region: result.name});
                        } else if (result.type === 'province') {
                          setSearchQuery(result.name);
                        } else if (result.type === 'commune') {
                          setSearchQuery(result.name);
                        }
                        setShowSearchResults(false);
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-accent transition-colors flex items-center gap-3 border-b last:border-b-0"
                    >
                      <MapPin className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm">{result.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {result.type === 'region' && `${result.nbProvinces} provinces • Chef-lieu: ${result.chefLieu}`}
                          {result.type === 'province' && `Province • ${result.region} • Chef-lieu: ${result.chefLieu}`}
                          {result.type === 'commune' && `Commune • ${result.province}, ${result.region}`}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {showSearchResults && searchResults.length === 0 && (
            <div className="mt-4 p-6 text-center border rounded-md bg-muted/20">
              <Search className="w-8 h-8 mx-auto mb-2 text-muted-foreground opacity-50" />
              <p className="text-sm font-medium text-muted-foreground">
                Aucun résultat trouvé
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Essayez de modifier vos filtres ou votre recherche
              </p>
            </div>
          )}
        </Card>
      </section>

      {/* Stats Section */}
      <section className="py-12 sm:py-16 md:py-20 px-4 bg-gradient-to-b from-background via-muted/30 to-background relative overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute top-0 left-1/4 w-64 h-64 sm:w-96 sm:h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-64 h-64 sm:w-96 sm:h-96 bg-destructive/5 rounded-full blur-3xl" />

        <div className="max-w-7xl mx-auto relative z-10">
          {/* Section Header */}
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 sm:mb-3 bg-gradient-to-r from-primary via-destructive to-primary bg-clip-text text-transparent px-2">
              Statistiques en temps réel
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto px-4">
              Découvrez l'engagement de notre communauté dans la surveillance citoyenne
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8" data-testid="container-stats">
            <StatCard
              title="Signalements actifs"
              value={stats?.totalSignalements || 0}
              icon={TrendingUp}
              description="Dans la base de données"
              trend="up"
            />
            <StatCard
              title="Alertes SOS"
              value={stats?.sosCount || 0}
              icon={AlertTriangle}
              description="Nécessitant attention urgente"
              variant="destructive"
              trend={(stats?.sosCount ?? 0) > 0 ? "up" : "neutral"}
            />
            <StatCard
              title="Citoyens engagés"
              value={stats?.totalUsers || 0}
              icon={Users}
              description="Utilisateurs inscrits"
              variant="success"
              trend="up"
            />
            <StatCard
              title="En ligne maintenant"
              value={stats?.onlineUsers || 0}
              icon={Users}
              description="Utilisateurs connectés"
              variant="info"
              trend={(stats?.onlineUsers ?? 0) > 0 ? "up" : "neutral"}
            />
          </div>

          {/* Additional Info */}
          <div className="mt-6 sm:mt-8 text-center">
            <p className="text-xs sm:text-sm text-muted-foreground">
              Mis à jour en temps réel • Données vérifiées
            </p>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 py-8 sm:py-12 pb-24 sm:pb-28">
        <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold">Signalements récents</h2>
            <p className="text-sm sm:text-base text-muted-foreground">Dernières alertes de la communauté</p>
          </div>
          <Link href="/feed">
            <Button
              variant="default"
              className="w-full sm:w-auto bg-primary hover:bg-primary/90 shadow-lg hover:shadow-xl transition-all duration-200 font-semibold"
              data-testid="button-view-all"
            >
              Voir tout
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {recentReports.map((report) => (
              <SignalementCard
                key={report.id}
                {...report}
                createdAt={new Date(report.createdAt!)}
              />
            ))}
          </div>
        )}

        <div className="mt-8 sm:mt-12">
          <MessageDuJour />
        </div>

        <Card className="mt-8 sm:mt-12 bg-primary/5 border-primary/20">
          <CardContent className="p-6 sm:p-8 text-center">
            <Shield className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 text-primary" />
            <h3 className="text-xl sm:text-2xl font-bold mb-2">Ensemble, protégeons notre pays</h3>
            <p className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6 max-w-2xl mx-auto px-2">
              Signalez les problèmes dans votre quartier, aidez ceux dans le besoin, et contribuez à bâtir un Burkina Faso plus sûr et plus solidaire.
            </p>
            <Link href="/contribuer">
              <Button size="lg" data-testid="button-contribute" className="gap-2 w-full sm:w-auto">
                <Heart className="w-5 h-5" />
                Contribuer maintenant
              </Button>
            </Link>
          </CardContent>
        </Card>
      </section>

      <EmergencyPanel />

      {/* Footer */}
      <footer className="border-t bg-muted/30 py-6 sm:py-8 mt-8 sm:mt-16 mb-20 sm:mb-0">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center space-y-4">
            {/* Contact Info */}
            <div className="flex flex-col sm:flex-row flex-wrap justify-center items-center gap-2 sm:gap-4 text-xs sm:text-sm">
              <p className="text-muted-foreground">
                Tel: <span className="text-foreground font-medium">+226 65511323</span>
              </p>
              <span className="hidden sm:inline text-muted-foreground">•</span>
              <p className="text-muted-foreground">
                WhatsApp: <span className="text-foreground font-medium">+226 70019540</span>
              </p>
            </div>

            {/* Legal Links */}
            <div className="flex flex-wrap justify-center items-center gap-3 sm:gap-6 text-xs sm:text-sm">
              <Link href="/a-propos">
                <span className="text-muted-foreground hover:text-primary transition-colors cursor-pointer">
                  À propos
                </span>
              </Link>
              <span className="text-muted-foreground">•</span>
              <Link href="/conditions">
                <span className="text-muted-foreground hover:text-primary transition-colors cursor-pointer">
                  Conditions d'utilisation
                </span>
              </Link>
              <span className="text-muted-foreground">•</span>
              <Link href="/conditions">
                <span className="text-muted-foreground hover:text-primary transition-colors cursor-pointer">
                  Mentions légales
                </span>
              </Link>
            </div>

            {/* Copyright */}
            <div className="pt-2 border-t border-border/50">
              <p className="text-xs text-muted-foreground">
                © {new Date().getFullYear()} Burkina Watch. Tous droits réservés.
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Plateforme citoyenne de veille et d'engagement pour le Burkina Faso
              </p>
            </div>
          </div>
        </div>
      </footer>

      <BottomNav />
    </div>
  );
}