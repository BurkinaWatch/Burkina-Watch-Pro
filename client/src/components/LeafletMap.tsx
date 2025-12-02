
/**
 * LeafletMap Component - OpenStreetMap with Leaflet
 * 100% Free and unlimited - no API keys required
 * 
 * Features:
 * - OpenStreetMap tiles (free)
 * - Marker clustering
 * - Heatmap layer
 * - Search by region/province/commune
 * - Radius filtering
 */
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle } from 'react-leaflet';
import { useState, useEffect, useMemo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import MarkerClusterGroup from 'react-leaflet-cluster';
import type { Categorie } from '@shared/schema';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MapPin, AlertTriangle, Locate, Flame, Navigation, GripVertical, Search, X } from 'lucide-react';
import { Card } from '@/components/ui/card';
import Draggable from 'react-draggable';

// Fix for default marker icons in Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  categorie: Categorie;
  titre: string;
  isSOS?: boolean;
  niveauUrgence?: string | null;
}

interface LeafletMapProps {
  markers: MapMarker[];
  className?: string;
  highlightMarkerId?: string | null;
  centerLat?: number | null;
  centerLng?: number | null;
}

const BURKINA_FASO_CENTER: [number, number] = [12.3714, -1.5197];

const BURKINA_FASO_BOUNDS: [[number, number], [number, number]] = [
  [9.410, -5.523],
  [15.086, 2.407]
];

const categoryColors: Record<Categorie, string> = {
  urgence: '#E30613',
  securite: '#FF6B35',
  sante: '#4ECDC4',
  environnement: '#007A33',
  corruption: '#95E1D3',
  infrastructure: '#FFD100',
  personne_recherchee: '#D97706'
};

const urgencyColors: Record<string, string> = {
  faible: '#22c55e',
  moyen: '#f97316',
  critique: '#ef4444'
};

const BURKINA_REGIONS = [
  {
    name: 'Bankui',
    chefLieu: 'Dédougou',
    lat: 12.4667,
    lng: -3.4667,
    provinces: [
      { name: 'Mouhoun', chefLieu: 'Dédougou', communes: ['Bondokuy', 'Dédougou', 'Douroula', 'Kona', 'Ouarkoye', 'Safané', 'Tchériba'] },
      { name: 'Balé', chefLieu: 'Boromo', communes: ['Bagassi', 'Bana', 'Boromo', 'Fara', 'Pa', 'Pompoï', 'Poura', 'Oury', 'Siby', 'Yaho'] },
      { name: 'Banwa', chefLieu: 'Solenzo', communes: ['Balavé', 'Kouka', 'Sami', 'Sanaba', 'Solenzo', 'Tansila'] }
    ]
  },
  {
    name: 'Djôrô',
    chefLieu: 'Gaoua',
    lat: 10.3333,
    lng: -3.1833,
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
    lat: 12.0614,
    lng: 0.3578,
    provinces: [
      { name: 'Gourma', chefLieu: 'Fada N\'Gourma', communes: ['Diabo', 'Diapangou', 'Fada N\'Gourma', 'Matiacoali', 'Tibga', 'Yamba'] },
      { name: 'Kompienga', chefLieu: 'Pama', communes: ['Kompienga', 'Pama', 'Madjoari'] }
    ]
  },
  {
    name: 'Guiriko',
    chefLieu: 'Bobo-Dioulasso',
    lat: 11.1827,
    lng: -4.2967,
    provinces: [
      { name: 'Houet', chefLieu: 'Bobo-Dioulasso', communes: ['Bama', 'Bobo-Dioulasso', 'Dandé', 'Karangasso-Sambla', 'Karangasso-Viguè', 'Koundougou', 'Faramana', 'Fô', 'Léna', 'Padéma', 'Péni', 'Satiri', 'Toussiana'] },
      { name: 'Kénédougou', chefLieu: 'Orodara', communes: ['Banzon', 'Djigouèra', 'Kangala', 'Kayan', 'Koloko', 'Kourouma', 'Kourinion', 'Morolaba', 'N\'Dorola', 'Orodara', 'Samôgôyiri', 'Samorogouan', 'Sindo'] },
      { name: 'Tuy', chefLieu: 'Houndé', communes: ['Békuy', 'Béréba', 'Boni', 'Founzan', 'Houndé', 'Koti', 'Koumbia'] }
    ]
  },
  {
    name: 'Kadiogo',
    chefLieu: 'Ouagadougou',
    lat: 12.3714,
    lng: -1.5197,
    provinces: [
      { name: 'Kadiogo', chefLieu: 'Ouagadougou', communes: ['Komki-Ipala', 'Komsilga', 'Koubri', 'Pabré', 'Saaba', 'Tanghin-Dassouri'] }
    ]
  },
  {
    name: 'Kuilsé',
    chefLieu: 'Kaya',
    lat: 13.0906,
    lng: -1.0844,
    provinces: [
      { name: 'Bam', chefLieu: 'Kongoussi', communes: ['Bourzanga', 'Guibaré', 'Kongoussi', 'Nasséré', 'Tikaré', 'Sabcé', 'Rollo', 'Rouko', 'Zimtenga'] },
      { name: 'Namentenga', chefLieu: 'Boulsa', communes: ['Boala', 'Boulsa', 'Bouroum', 'Dargo', 'Tougouri', 'Nagbingou', 'Yalgo', 'Zéguédéguin'] },
      { name: 'Sandbondtenga', chefLieu: 'Kaya', communes: ['Barsalogho', 'Boussouma', 'Dablo', 'Kaya', 'Korsimoro', 'Mané', 'Namissiguima', 'Pensa', 'Pibaoré', 'Pissila', 'Ziga'] }
    ]
  },
  {
    name: 'Liptako',
    chefLieu: 'Dori',
    lat: 14.0333,
    lng: -0.0333,
    provinces: [
      { name: 'Oudalan', chefLieu: 'Gorom-Gorom', communes: ['Déou', 'Gorom-Gorom', 'Markoye', 'Oursi', 'Tinakoff'] },
      { name: 'Séno', chefLieu: 'Dori', communes: ['Bani', 'Dori', 'Falangountou', 'Gorgadji', 'Sampelga', 'Seytenga'] },
      { name: 'Yagha', chefLieu: 'Sebba', communes: ['Boundoré', 'Mansila', 'Sebba', 'Solhan', 'Tankougounadié', 'Titabé'] }
    ]
  },
  {
    name: 'Nakambé',
    chefLieu: 'Tenkodogo',
    lat: 11.7833,
    lng: -0.3667,
    provinces: [
      { name: 'Boulgou', chefLieu: 'Tenkodogo', communes: ['Bagré', 'Bané', 'Béguédo', 'Bittou', 'Bissiga', 'Boussouma', 'Garango', 'Komtoèga', 'Niaogho', 'Tenkodogo', 'Zabré', 'Zoaga', 'Zonsé'] },
      { name: 'Koulpelogo', chefLieu: 'Ouargaye', communes: ['Comin-Yanga', 'Dourtenga', 'Lalgaye', 'Ouargaye', 'Sangha', 'Soudougui', 'Yargatenga', 'Yondé'] },
      { name: 'Kourittenga', chefLieu: 'Koupèla', communes: ['Andemtenga', 'Baskouré', 'Dialgaye', 'Gounghin', 'Kando', 'Koupèla', 'Pouytenga', 'Tansobentenga', 'Yargo'] }
    ]
  },
  {
    name: 'Nando',
    chefLieu: 'Koudougou',
    lat: 12.2514,
    lng: -2.3622,
    provinces: [
      { name: 'Boulkiemdé', chefLieu: 'Koudougou', communes: ['Bingo', 'Imasgo', 'Kindi', 'Kokologo', 'Koudougou', 'Nanoro', 'Nandiala', 'Pella', 'Poa', 'Ramongo', 'Sabou', 'Siglé', 'Soaw', 'Sourgou', 'Thiou'] },
      { name: 'Sanguié', chefLieu: 'Réo', communes: ['Dassa', 'Didyr', 'Godyr', 'Kordié', 'Kyon', 'Pouni', 'Réo', 'Ténado', 'Zamo', 'Zawara'] },
      { name: 'Sissili', chefLieu: 'Léo', communes: ['Biéha', 'Boura', 'Léo', 'Nébiélianayou', 'Niambouri', 'Silly', 'Tô'] },
      { name: 'Ziro', chefLieu: 'Sapouy', communes: ['Bakata', 'Bougnounou', 'Dalô', 'Gaô', 'Kassou', 'Sapouy'] }
    ]
  },
  {
    name: 'Nazinon',
    chefLieu: 'Manga',
    lat: 11.6667,
    lng: -1.0667,
    provinces: [
      { name: 'Bazèga', chefLieu: 'Kombissiri', communes: ['Doulougou', 'Gaongo', 'Ipelcé', 'Kayao', 'Kombissiri', 'Saponé', 'Toécé'] },
      { name: 'Nahouri', chefLieu: 'Pô', communes: ['Guiaro', 'Pô', 'Tiébélé', 'Zecco', 'Ziou'] },
      { name: 'Zoundwéogo', chefLieu: 'Manga', communes: ['Béré', 'Bindé', 'Gogo', 'Gomboussougou', 'Guiba', 'Manga', 'Nobéré'] }
    ]
  },
  {
    name: 'Oubri',
    chefLieu: 'Ziniaré',
    lat: 12.5833,
    lng: -1.3,
    provinces: [
      { name: 'Bassitenga', chefLieu: 'Ziniaré', communes: ['Absouya', 'Dapélogo', 'Loumbila', 'Nagréongo', 'Ourgou-Manega', 'Ziniaré', 'Zitenga'] },
      { name: 'Ganzourgou', chefLieu: 'Zorgho', communes: ['Boudry', 'Kogho', 'Méguet', 'Mogtédo', 'Salogo', 'Zam', 'Zorgho', 'Zoungou'] },
      { name: 'Kourwéogo', chefLieu: 'Boussé', communes: ['Boussé', 'Laye', 'Niou', 'Sourgoubila', 'Toéghin'] }
    ]
  },
  {
    name: 'Sirba',
    chefLieu: 'Bogandé',
    lat: 12.9833,
    lng: -0.15,
    provinces: [
      { name: 'Gnagna', chefLieu: 'Bogandé', communes: ['Bilanga', 'Bogandé', 'Coalla', 'Liptougou', 'Mani', 'Pièla', 'Thion'] },
      { name: 'Komondjari', chefLieu: 'Gayéri', communes: ['Bartiébougou', 'Gayéri', 'Foutouri'] }
    ]
  },
  {
    name: 'Soum',
    chefLieu: 'Djibo',
    lat: 14.1,
    lng: -1.6333,
    provinces: [
      { name: 'Djelgodji', chefLieu: 'Djibo', communes: ['Baraboulé', 'Diguel', 'Djibo', 'Kelbo', 'Nassoumbou', 'Pobé-Mengao', 'Tongomayel'] },
      { name: 'Karo-Peli', chefLieu: 'Arbinda', communes: ['Arbinda', 'Koutougou'] }
    ]
  },
  {
    name: 'Sourou',
    chefLieu: 'Tougan',
    lat: 13.0667,
    lng: -3.0667,
    provinces: [
      { name: 'Koosin', chefLieu: 'Nouna', communes: ['Barani', 'Bomborokuy', 'Bourasso', 'Djibasso', 'Dokuy', 'Doumbala', 'Kombori', 'Madouba', 'Nouna', 'Sono'] },
      { name: 'Nayala', chefLieu: 'Toma', communes: ['Gassan', 'Gossina', 'Kougny', 'Toma', 'Yaba', 'Yé'] },
      { name: 'Sourou', chefLieu: 'Tougan', communes: ['Di', 'Gomboro', 'Kassoum', 'Kiembara', 'Lanfièra', 'Lankoué', 'Toéni', 'Tougan'] }
    ]
  },
  {
    name: 'Tannounyan',
    chefLieu: 'Banfora',
    lat: 10.6333,
    lng: -4.7667,
    provinces: [
      { name: 'Comoé', chefLieu: 'Banfora', communes: ['Banfora', 'Bérégadougou', 'Mangodara', 'Moussodougou', 'Niangoloko', 'Ouô', 'Sidéradougou', 'Soubakaniédougou', 'Tiéfora'] },
      { name: 'Léraba', chefLieu: 'Sindou', communes: ['Dakôrô', 'Douna', 'Kankalaba', 'Loumana', 'Niankôrôdougou', 'Ouéléni', 'Sindou', 'Wolonkoto'] }
    ]
  },
  {
    name: 'Tapoa',
    chefLieu: 'Diapaga',
    lat: 12.0667,
    lng: 1.7833,
    provinces: [
      { name: 'Dyamongou', chefLieu: 'Kantchari', communes: ['Botou', 'Kantchari'] },
      { name: 'Gobnangou', chefLieu: 'Diapaga', communes: ['Diapaga', 'Logobou', 'Namounou', 'Partiaga', 'Tambaga', 'Tansarga'] }
    ]
  },
  {
    name: 'Yaadga',
    chefLieu: 'Ouahigouya',
    lat: 13.5783,
    lng: -2.4211,
    provinces: [
      { name: 'Lorum', chefLieu: 'Titao', communes: ['Banh', 'Ouindigui', 'Titao', 'Sollé'] },
      { name: 'Passoré', chefLieu: 'Yako', communes: ['Arbollé', 'Bagaré', 'Bokin', 'Gompomsom', 'Kirsi', 'La-Toden', 'Pilimpikou', 'Samba', 'Yako'] },
      { name: 'Yatenga', chefLieu: 'Ouahigouya', communes: ['Barga', 'Kalsaka', 'Kaïn', 'Kossouka', 'Koumbri', 'Namissiguima', 'Ouahigouya', 'Oula', 'Rambo', 'Séguénéga', 'Tangaye', 'Thiou', 'Zogoré'] },
      { name: 'Zondoma', chefLieu: 'Gourcy', communes: ['Bassi', 'Boussou', 'Gourcy', 'Léba', 'Tougo'] }
    ]
  }
];

function createCustomIcon(color: string, isSOS: boolean, niveauUrgence?: string | null) {
  const urgencyColor = niveauUrgence ? urgencyColors[niveauUrgence] || urgencyColors.moyen : urgencyColors.moyen;
  const iconSize = isSOS ? 36 : 30;
  
  const svgIcon = `
    <svg width="${iconSize}" height="${iconSize + 10}" viewBox="0 0 ${iconSize} ${iconSize + 10}" xmlns="http://www.w3.org/2000/svg">
      ${isSOS ? `
        <circle cx="${iconSize/2}" cy="${iconSize/2}" r="${iconSize * 0.8}" fill="${color}" opacity="0.3">
          <animate attributeName="r" from="${iconSize * 0.8}" to="${iconSize * 1.2}" dur="2s" repeatCount="indefinite"/>
          <animate attributeName="opacity" from="0.3" to="0" dur="2s" repeatCount="indefinite"/>
        </circle>
        <circle cx="${iconSize/2}" cy="${iconSize/2}" r="${iconSize * 0.6}" fill="${color}" opacity="0.5">
          <animate attributeName="r" from="${iconSize * 0.6}" to="${iconSize}" dur="1.5s" repeatCount="indefinite"/>
          <animate attributeName="opacity" from="0.5" to="0" dur="1.5s" repeatCount="indefinite"/>
        </circle>
      ` : ''}
      <path d="M ${iconSize/2} ${iconSize} 
               Q ${iconSize/2} ${iconSize} 
               ${iconSize} ${iconSize/2} 
               Q ${iconSize} 0 ${iconSize/2} 0 
               Q 0 0 0 ${iconSize/2} 
               Q 0 ${iconSize} ${iconSize/2} ${iconSize} Z" 
            fill="${color}" 
            stroke="white" 
            stroke-width="2"
            filter="drop-shadow(0px 2px 4px rgba(0,0,0,0.3))"/>
      <circle cx="${iconSize * 0.8}" cy="${iconSize * 0.2}" r="6" fill="${urgencyColor}" stroke="white" stroke-width="2"/>
      ${isSOS ? `
        <path d="M ${iconSize/2 - 5} ${iconSize/2 - 8} L ${iconSize/2} ${iconSize/2 - 2} L ${iconSize/2 + 5} ${iconSize/2 - 8} 
                 M ${iconSize/2} ${iconSize/2 - 2} L ${iconSize/2} ${iconSize/2 + 6}" 
              stroke="white" stroke-width="2" stroke-linecap="round"/>
      ` : `
        <circle cx="${iconSize/2}" cy="${iconSize/2 - 2}" r="3" fill="white"/>
        <path d="M ${iconSize/2} ${iconSize/2 + 2} L ${iconSize/2} ${iconSize/2 + 7}" stroke="white" stroke-width="2" stroke-linecap="round"/>
      `}
    </svg>
  `;

  return L.divIcon({
    html: svgIcon,
    className: 'custom-marker-icon',
    iconSize: [iconSize, iconSize + 10],
    iconAnchor: [iconSize / 2, iconSize + 10],
    popupAnchor: [0, -(iconSize + 10)]
  });
}

function RecenterControl({ center }: { center: [number, number] }) {
  const map = useMap();

  const handleRecenter = () => {
    map.setView(center, 6.5);
  };

  return (
    <div className="leaflet-top leaflet-right" style={{ marginTop: '80px', marginRight: '10px' }}>
      <div className="leaflet-control">
        <Button
          onClick={handleRecenter}
          size="icon"
          variant="secondary"
          className="shadow-lg"
          title="Recentrer sur le Burkina Faso"
        >
          <Locate className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
}

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export default function LeafletMap({ 
  markers, 
  className = '', 
  highlightMarkerId = null, 
  centerLat = null, 
  centerLng = null 
}: LeafletMapProps) {
  const [radiusFilter, setRadiusFilter] = useState<number | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{lat: number; lng: number} | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showSearchResults, setShowSearchResults] = useState<boolean>(false);
  const [mapCenter, setMapCenter] = useState<[number, number]>(BURKINA_FASO_CENTER);
  const [mapZoom, setMapZoom] = useState<number>(6.5);

  useEffect(() => {
    if (highlightMarkerId && centerLat && centerLng) {
      setMapCenter([parseFloat(centerLat.toString()), parseFloat(centerLng.toString())]);
      setMapZoom(15);
    }
  }, [highlightMarkerId, centerLat, centerLng]);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.log('Geolocation error:', error);
        }
      );
    }
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    const query = searchQuery.toLowerCase().trim();
    const results: any[] = [];

    BURKINA_REGIONS.forEach(region => {
      if (region.name.toLowerCase().includes(query) || region.chefLieu.toLowerCase().includes(query)) {
        results.push({
          type: 'région',
          name: region.name,
          chefLieu: region.chefLieu,
          lat: region.lat,
          lng: region.lng
        });
      }

      region.provinces.forEach(province => {
        if (province.name.toLowerCase().includes(query) || province.chefLieu.toLowerCase().includes(query)) {
          results.push({
            type: 'province',
            name: province.name,
            chefLieu: province.chefLieu,
            region: region.name,
            lat: region.lat,
            lng: region.lng
          });
        }

        province.communes.forEach(commune => {
          if (commune.toLowerCase().includes(query)) {
            results.push({
              type: 'commune',
              name: commune,
              province: province.name,
              region: region.name,
              lat: region.lat,
              lng: region.lng
            });
          }
        });
      });
    });

    setSearchResults(results.slice(0, 10));
    setShowSearchResults(true);
  }, [searchQuery]);

  const filteredMarkers = useMemo(() => {
    let filtered = markers;

    if (radiusFilter !== null && userLocation) {
      filtered = filtered.filter(marker => {
        const distance = calculateDistance(
          userLocation.lat,
          userLocation.lng,
          marker.lat,
          marker.lng
        );
        return distance <= radiusFilter;
      });
    }

    if (selectedRegion) {
      const region = BURKINA_REGIONS.find(r => r.name === selectedRegion);
      if (region) {
        filtered = filtered.filter(marker => {
          const distance = calculateDistance(
            region.lat,
            region.lng,
            marker.lat,
            marker.lng
          );
          return distance <= 100;
        });
      }
    }

    return filtered;
  }, [markers, radiusFilter, selectedRegion, userLocation]);

  const handleSearchResultClick = (result: any) => {
    setSelectedRegion(result.region || result.name);
    setSearchQuery('');
    setShowSearchResults(false);
  };

  return (
    <div className={`relative ${className}`}>
      <Draggable
        handle=".drag-handle"
        bounds="parent"
        defaultPosition={{ x: 8, y: 80 }}
      >
        <div className="absolute z-[1000] max-w-md space-y-2 cursor-move">
          <Card className="bg-background/95 backdrop-blur shadow-lg">
            <div className="drag-handle p-2 flex items-center justify-center border-b cursor-grab active:cursor-grabbing">
              <GripVertical className="w-4 h-4 text-muted-foreground" />
            </div>
            
            {userLocation && (
              <div className="p-2 border-b">
                <div className="flex items-center gap-2">
                  <Navigation className="w-4 h-4 text-primary" />
                  <span className="text-xs font-medium">Rayon:</span>
                  <div className="flex gap-1 flex-1">
                    {[1, 5, 10].map(radius => (
                      <Button
                        key={radius}
                        variant={radiusFilter === radius ? "default" : "outline"}
                        size="sm"
                        className="text-xs px-2 py-1 h-auto"
                        onClick={() => setRadiusFilter(radiusFilter === radius ? null : radius)}
                      >
                        {radius}km
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className="p-2 border-b">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary" />
                <select
                  value={selectedRegion || ''}
                  onChange={(e) => setSelectedRegion(e.target.value || null)}
                  className="flex-1 text-xs bg-transparent border-none focus:outline-none"
                >
                  <option value="">Toutes les régions</option>
                  {BURKINA_REGIONS.map(region => (
                    <option key={region.name} value={region.name}>
                      {region.name} ({region.chefLieu})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </Card>
        </div>
      </Draggable>

      <MapContainer
        center={mapCenter}
        zoom={mapZoom}
        maxBounds={BURKINA_FASO_BOUNDS}
        minZoom={6}
        maxZoom={18}
        className={className}
        zoomControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MarkerClusterGroup
          chunkedLoading
          maxClusterRadius={50}
          spiderfyOnMaxZoom={true}
          showCoverageOnHover={false}
          zoomToBoundsOnClick={true}
        >
          {filteredMarkers.map((marker) => (
            <Marker
              key={marker.id}
              position={[marker.lat, marker.lng]}
              icon={createCustomIcon(categoryColors[marker.categorie], marker.isSOS || false, marker.niveauUrgence)}
            >
              <Popup>
                <div className="p-2 min-w-[240px]">
                  <h3 className="font-semibold text-sm mb-2">{marker.titre}</h3>
                  <div className="flex gap-2 items-center flex-wrap mb-3">
                    <Badge 
                      variant="outline" 
                      className="text-xs"
                      style={{ 
                        borderColor: categoryColors[marker.categorie],
                        color: categoryColors[marker.categorie]
                      }}
                    >
                      {marker.categorie}
                    </Badge>
                    {marker.isSOS && (
                      <Badge variant="destructive" className="text-xs">
                        SOS
                      </Badge>
                    )}
                    {marker.niveauUrgence && (
                      <Badge 
                        variant="outline" 
                        className="text-xs flex items-center gap-1"
                        style={{ 
                          borderColor: urgencyColors[marker.niveauUrgence] || urgencyColors.moyen,
                          color: urgencyColors[marker.niveauUrgence] || urgencyColors.moyen
                        }}
                      >
                        <div 
                          className="w-2 h-2 rounded-full" 
                          style={{ 
                            backgroundColor: urgencyColors[marker.niveauUrgence] || urgencyColors.moyen 
                          }}
                        />
                        {marker.niveauUrgence}
                      </Badge>
                    )}
                  </div>

                  <button
                    onClick={() => {
                      const mapsUrl = `https://www.openstreetmap.org/?mlat=${marker.lat}&mlon=${marker.lng}&zoom=15`;
                      window.open(mapsUrl, '_blank', 'noopener,noreferrer');
                    }}
                    className="text-xs text-muted-foreground flex items-center gap-1 hover:text-primary transition-colors w-full"
                  >
                    <MapPin className="w-3 h-3" />
                    {marker.lat.toFixed(4)}, {marker.lng.toFixed(4)}
                    <span className="ml-auto text-primary">Ouvrir →</span>
                  </button>
                </div>
              </Popup>
            </Marker>
          ))}
        </MarkerClusterGroup>

        {userLocation && radiusFilter && (
          <Circle
            center={[userLocation.lat, userLocation.lng]}
            radius={radiusFilter * 1000}
            pathOptions={{
              color: '#3b82f6',
              fillColor: '#3b82f6',
              fillOpacity: 0.1
            }}
          />
        )}

        <RecenterControl center={BURKINA_FASO_CENTER} />
      </MapContainer>

      {(radiusFilter || selectedRegion) && (
        <div className="absolute bottom-4 left-4 z-[1000]">
          <Card className="p-2 bg-background/95 backdrop-blur text-xs">
            {filteredMarkers.length} / {markers.length} signalements affichés
            {selectedRegion && <div className="font-medium mt-1">Région: {selectedRegion}</div>}
          </Card>
        </div>
      )}

      <style>{`
        .custom-marker-icon {
          background: transparent;
          border: none;
        }
        .leaflet-container {
          font-family: inherit;
        }
      `}</style>
    </div>
  );
}
