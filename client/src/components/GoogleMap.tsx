import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import 'leaflet.markercluster';
import 'leaflet.heat';
import type { Categorie } from '@shared/schema';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MapPin, AlertTriangle, Locate, Flame, Navigation, GripVertical, Search, X, Layers } from 'lucide-react';
import { Card } from '@/components/ui/card';
import Draggable from 'react-draggable';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  categorie: Categorie;
  titre: string;
  isSOS?: boolean;
  niveauUrgence?: string | null;
}

interface GoogleMapProps {
  markers: MapMarker[];
  className?: string;
  highlightMarkerId?: string | null;
  centerLat?: number | null;
  centerLng?: number | null;
  heatmapMode?: boolean;
}

const BURKINA_FASO_CENTER: [number, number] = [12.3714, -1.5197];

const BURKINA_FASO_BOUNDS: L.LatLngBoundsExpression = [
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
  { name: 'Bankui', chefLieu: 'Dédougou', lat: 12.4667, lng: -3.4667, provinces: [
    { name: 'Mouhoun', chefLieu: 'Dédougou', communes: ['Bondokuy', 'Dédougou', 'Douroula', 'Kona', 'Ouarkoye', 'Safané', 'Tchériba'] },
    { name: 'Balé', chefLieu: 'Boromo', communes: ['Bagassi', 'Bana', 'Boromo', 'Fara', 'Pa', 'Pompoï', 'Poura', 'Oury', 'Siby', 'Yaho'] },
    { name: 'Banwa', chefLieu: 'Solenzo', communes: ['Balavé', 'Kouka', 'Sami', 'Sanaba', 'Solenzo', 'Tansila'] }
  ]},
  { name: 'Djôrô', chefLieu: 'Gaoua', lat: 10.3333, lng: -3.1833, provinces: [
    { name: 'Bougouriba', chefLieu: 'Diébougou', communes: ['Gbondjigui', 'Diébougou', 'Dolo', 'Nioronioro', 'Tiankoura'] },
    { name: 'Ioba', chefLieu: 'Dano', communes: ['Dano', 'Dissihn', 'Guéguéré', 'Koper', 'Niégo', 'Oronkua', 'Ouéssa', 'Zambo'] },
    { name: 'Noumbiel', chefLieu: 'Batié', communes: ['Batié', 'Boussoukoula', 'Kpéré', 'Legmoin', 'Midebdo'] },
    { name: 'Poni', chefLieu: 'Gaoua', communes: ['Bouroum-Bouroum', 'Bousséra', 'Djigouè', 'Gaoua', 'Gbomblora', 'Kampti', 'Loropéni', 'Malba', 'Nako', 'Périgban'] }
  ]},
  { name: 'Goulmou', chefLieu: "Fada N'Gourma", lat: 12.0614, lng: 0.3578, provinces: [
    { name: 'Gourma', chefLieu: "Fada N'Gourma", communes: ['Diabo', 'Diapangou', "Fada N'Gourma", 'Matiacoali', 'Tibga', 'Yamba'] },
    { name: 'Kompienga', chefLieu: 'Pama', communes: ['Kompienga', 'Pama', 'Madjoari'] }
  ]},
  { name: 'Guiriko', chefLieu: 'Bobo-Dioulasso', lat: 11.1827, lng: -4.2967, provinces: [
    { name: 'Houet', chefLieu: 'Bobo-Dioulasso', communes: ['Bama', 'Bobo-Dioulasso', 'Dandé', 'Karangasso-Sambla', 'Karangasso-Viguè', 'Koundougou', 'Faramana', 'Fô', 'Léna', 'Padéma', 'Péni', 'Satiri', 'Toussiana'] },
    { name: 'Kénédougou', chefLieu: 'Orodara', communes: ['Banzon', 'Djigouèra', 'Kangala', 'Kayan', 'Koloko', 'Kourouma', 'Kourinion', 'Morolaba', "N'Dorola", 'Orodara', 'Samôgôyiri', 'Samorogouan', 'Sindo'] },
    { name: 'Tuy', chefLieu: 'Houndé', communes: ['Békuy', 'Béréba', 'Boni', 'Founzan', 'Houndé', 'Koti', 'Koumbia'] }
  ]},
  { name: 'Kadiogo', chefLieu: 'Ouagadougou', lat: 12.3714, lng: -1.5197, provinces: [
    { name: 'Kadiogo', chefLieu: 'Ouagadougou', communes: ['Komki-Ipala', 'Komsilga', 'Koubri', 'Pabré', 'Saaba', 'Tanghin-Dassouri'] }
  ]},
  { name: 'Kuilsé', chefLieu: 'Kaya', lat: 13.0906, lng: -1.0844, provinces: [
    { name: 'Bam', chefLieu: 'Kongoussi', communes: ['Bourzanga', 'Guibaré', 'Kongoussi', 'Nasséré', 'Tikaré', 'Sabcé', 'Rollo', 'Rouko', 'Zimtenga'] },
    { name: 'Namentenga', chefLieu: 'Boulsa', communes: ['Boala', 'Boulsa', 'Bouroum', 'Dargo', 'Tougouri', 'Nagbingou', 'Yalgo', 'Zéguédéguin'] },
    { name: 'Sandbondtenga', chefLieu: 'Kaya', communes: ['Barsalogho', 'Boussouma', 'Dablo', 'Kaya', 'Korsimoro', 'Mané', 'Namissiguima', 'Pensa', 'Pibaoré', 'Pissila', 'Ziga'] }
  ]},
  { name: 'Liptako', chefLieu: 'Dori', lat: 14.0333, lng: -0.0333, provinces: [
    { name: 'Oudalan', chefLieu: 'Gorom-Gorom', communes: ['Déou', 'Gorom-Gorom', 'Markoye', 'Oursi', 'Tinakoff'] },
    { name: 'Séno', chefLieu: 'Dori', communes: ['Bani', 'Dori', 'Falangountou', 'Gorgadji', 'Sampelga', 'Seytenga'] },
    { name: 'Yagha', chefLieu: 'Sebba', communes: ['Boundoré', 'Mansila', 'Sebba', 'Solhan', 'Tankougounadié', 'Titabé'] }
  ]},
  { name: 'Nakambé', chefLieu: 'Tenkodogo', lat: 11.7833, lng: -0.3667, provinces: [
    { name: 'Boulgou', chefLieu: 'Tenkodogo', communes: ['Bagré', 'Bané', 'Béguédo', 'Bittou', 'Bissiga', 'Boussouma', 'Garango', 'Komtoèga', 'Niaogho', 'Tenkodogo', 'Zabré', 'Zoaga', 'Zonsé'] },
    { name: 'Koulpelogo', chefLieu: 'Ouargaye', communes: ['Comin-Yanga', 'Dourtenga', 'Lalgaye', 'Ouargaye', 'Sangha', 'Soudougui', 'Yargatenga', 'Yondé'] },
    { name: 'Kourittenga', chefLieu: 'Koupèla', communes: ['Andemtenga', 'Baskouré', 'Dialgaye', 'Gounghin', 'Kando', 'Koupèla', 'Pouytenga', 'Tansobentenga', 'Yargo'] }
  ]},
  { name: 'Nando', chefLieu: 'Koudougou', lat: 12.2514, lng: -2.3622, provinces: [
    { name: 'Boulkiemdé', chefLieu: 'Koudougou', communes: ['Bingo', 'Imasgo', 'Kindi', 'Kokologo', 'Koudougou', 'Nanoro', 'Nandiala', 'Pella', 'Poa', 'Ramongo', 'Sabou', 'Siglé', 'Soaw', 'Sourgou', 'Thiou'] },
    { name: 'Sanguié', chefLieu: 'Réo', communes: ['Dassa', 'Didyr', 'Godyr', 'Kordié', 'Kyon', 'Pouni', 'Réo', 'Ténado', 'Zamo', 'Zawara'] },
    { name: 'Sissili', chefLieu: 'Léo', communes: ['Biéha', 'Boura', 'Léo', 'Nébiélianayou', 'Niambouri', 'Silly', 'Tô'] },
    { name: 'Ziro', chefLieu: 'Sapouy', communes: ['Bakata', 'Bougnounou', 'Dalô', 'Gaô', 'Kassou', 'Sapouy'] }
  ]},
  { name: 'Nazinon', chefLieu: 'Manga', lat: 11.6667, lng: -1.0667, provinces: [
    { name: 'Bazèga', chefLieu: 'Kombissiri', communes: ['Doulougou', 'Gaongo', 'Ipelcé', 'Kayao', 'Kombissiri', 'Saponé', 'Toécé'] },
    { name: 'Nahouri', chefLieu: 'Pô', communes: ['Guiaro', 'Pô', 'Tiébélé', 'Zecco', 'Ziou'] },
    { name: 'Zoundwéogo', chefLieu: 'Manga', communes: ['Béré', 'Bindé', 'Gogo', 'Gomboussougou', 'Guiba', 'Manga', 'Nobéré'] }
  ]},
  { name: 'Oubri', chefLieu: 'Ziniaré', lat: 12.5833, lng: -1.3, provinces: [
    { name: 'Bassitenga', chefLieu: 'Ziniaré', communes: ['Absouya', 'Dapélogo', 'Loumbila', 'Nagréongo', 'Ourgou-Manega', 'Ziniaré', 'Zitenga'] },
    { name: 'Ganzourgou', chefLieu: 'Zorgho', communes: ['Boudry', 'Kogho', 'Méguet', 'Mogtédo', 'Salogo', 'Zam', 'Zorgho', 'Zoungou'] },
    { name: 'Kourwéogo', chefLieu: 'Boussé', communes: ['Boussé', 'Laye', 'Niou', 'Sourgoubila', 'Toéghin'] }
  ]},
  { name: 'Sirba', chefLieu: 'Bogandé', lat: 12.9833, lng: -0.15, provinces: [
    { name: 'Gnagna', chefLieu: 'Bogandé', communes: ['Bilanga', 'Bogandé', 'Coalla', 'Liptougou', 'Mani', 'Pièla', 'Thion'] },
    { name: 'Komondjari', chefLieu: 'Gayéri', communes: ['Bartiébougou', 'Gayéri', 'Foutouri'] }
  ]},
  { name: 'Soum', chefLieu: 'Djibo', lat: 14.1, lng: -1.6333, provinces: [
    { name: 'Djelgodji', chefLieu: 'Djibo', communes: ['Baraboulé', 'Diguel', 'Djibo', 'Kelbo', 'Nassoumbou', 'Pobé-Mengao', 'Tongomayel'] },
    { name: 'Karo-Peli', chefLieu: 'Arbinda', communes: ['Arbinda', 'Koutougou'] }
  ]},
  { name: 'Sourou', chefLieu: 'Tougan', lat: 13.0667, lng: -3.0667, provinces: [
    { name: 'Koosin', chefLieu: 'Nouna', communes: ['Barani', 'Bomborokuy', 'Bourasso', 'Djibasso', 'Dokuy', 'Doumbala', 'Kombori', 'Madouba', 'Nouna', 'Sono'] },
    { name: 'Nayala', chefLieu: 'Toma', communes: ['Gassan', 'Gossina', 'Kougny', 'Toma', 'Yaba', 'Yé'] },
    { name: 'Sourou', chefLieu: 'Tougan', communes: ['Di', 'Gomboro', 'Kassoum', 'Kiembara', 'Lanfièra', 'Lankoué', 'Toéni', 'Tougan'] }
  ]},
  { name: 'Tannounyan', chefLieu: 'Banfora', lat: 10.6333, lng: -4.7667, provinces: [
    { name: 'Comoé', chefLieu: 'Banfora', communes: ['Banfora', 'Bérégadougou', 'Mangodara', 'Moussodougou', 'Niangoloko', 'Ouô', 'Sidéradougou', 'Soubakaniédougou', 'Tiéfora'] },
    { name: 'Léraba', chefLieu: 'Sindou', communes: ['Dakôrô', 'Douna', 'Kankalaba', 'Loumana', 'Niankôrôdougou', 'Ouéléni', 'Sindou', 'Wolonkoto'] }
  ]},
  { name: 'Tapoa', chefLieu: 'Diapaga', lat: 12.0667, lng: 1.7833, provinces: [
    { name: 'Dyamongou', chefLieu: 'Kantchari', communes: ['Botou', 'Kantchari'] },
    { name: 'Gobnangou', chefLieu: 'Diapaga', communes: ['Diapaga', 'Logobou', 'Namounou', 'Partiaga', 'Tambaga', 'Tansarga'] }
  ]},
  { name: 'Yaadga', chefLieu: 'Ouahigouya', lat: 13.5783, lng: -2.4211, provinces: [
    { name: 'Lorum', chefLieu: 'Titao', communes: ['Banh', 'Ouindigui', 'Titao', 'Sollé'] },
    { name: 'Passoré', chefLieu: 'Yako', communes: ['Arbollé', 'Bagaré', 'Bokin', 'Gompomsom', 'Kirsi', 'La-Toden', 'Pilimpikou', 'Samba', 'Yako'] },
    { name: 'Yatenga', chefLieu: 'Ouahigouya', communes: ['Barga', 'Kalsaka', 'Kaïn', 'Kossouka', 'Koumbri', 'Namissiguima', 'Ouahigouya', 'Oula', 'Rambo', 'Séguénéga', 'Tangaye', 'Thiou', 'Zogoré'] },
    { name: 'Zondoma', chefLieu: 'Gourcy', communes: ['Bassi', 'Boussou', 'Gourcy', 'Léba', 'Tougo'] }
  ]}
];

function createMarkerIcon(color: string, isSOS: boolean, niveauUrgence?: string | null): L.DivIcon {
  const urgencyColor = niveauUrgence ? urgencyColors[niveauUrgence] || urgencyColors.moyen : urgencyColors.moyen;
  const size = isSOS ? 36 : 30;
  const glowIntensity = niveauUrgence === 'critique' ? 0.8 : niveauUrgence === 'moyen' ? 0.6 : 0.4;
  const glowHex = Math.round(glowIntensity * 255).toString(16).padStart(2, '0');
  const glowHalfHex = Math.round(glowIntensity * 128).toString(16).padStart(2, '0');

  const html = `
    <div style="position:relative;width:${size + 30}px;height:${size + 30}px;display:flex;align-items:center;justify-content:center;">
      <div style="position:absolute;width:${size}px;height:${size}px;background:${color};opacity:0.4;border-radius:50%;animation:pulse ${isSOS ? '1s' : '2s'} ease-in-out infinite;"></div>
      ${isSOS ? `<div style="position:absolute;width:${size + 24}px;height:${size + 24}px;background:${color};opacity:0.3;border-radius:50%;animation:ping 1.5s cubic-bezier(0,0,0.2,1) infinite;"></div>` : ''}
      <div style="width:${size}px;height:${size}px;background:${color};border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:3px solid white;box-shadow:0 0 15px ${color}${glowHex},0 0 30px ${color}${glowHalfHex},0 4px 12px rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;position:relative;z-index:5;">
        <svg style="transform:rotate(45deg);filter:drop-shadow(0 0 1px rgba(255,255,255,0.6));" width="${isSOS ? 16 : 14}" height="${isSOS ? 16 : 14}" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          ${isSOS
            ? '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line>'
            : '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path><circle cx="12" cy="10" r="3"></circle>'
          }
        </svg>
      </div>
      <div style="position:absolute;top:2px;right:2px;width:14px;height:14px;background:${urgencyColor};border-radius:50%;border:2px solid white;box-shadow:0 0 8px ${urgencyColor},0 0 15px ${urgencyColor}80;z-index:10;animation:pulse ${niveauUrgence === 'critique' ? '0.8s' : '1.5s'} ease-in-out infinite;"></div>
    </div>
  `;

  return L.divIcon({
    html,
    className: 'custom-leaflet-marker',
    iconSize: [size + 30, size + 30],
    iconAnchor: [(size + 30) / 2, (size + 30) / 2],
    popupAnchor: [0, -(size + 30) / 2 + 5]
  });
}

function createClusterIcon(count: number): L.DivIcon {
  const color = count > 10 ? '#ef4444' : count > 5 ? '#f97316' : '#22c55e';
  const size = Math.min(40 + (count * 2), 70);
  return L.divIcon({
    html: `<div style="width:${size}px;height:${size}px;background:${color};border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;color:white;font-weight:bold;font-size:14px;">${count}</div>`,
    className: 'custom-cluster-icon',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2]
  });
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

function HeatmapLayer({ markers, show }: { markers: MapMarker[]; show: boolean }) {
  const map = useMap();
  const heatLayerRef = useRef<any>(null);

  useEffect(() => {
    if (!show) {
      if (heatLayerRef.current) {
        map.removeLayer(heatLayerRef.current);
        heatLayerRef.current = null;
      }
      return;
    }

    const heatData = markers.map(marker => {
      let weight = 0.5;
      if (marker.isSOS) weight = 1;
      else if (marker.niveauUrgence === 'critique') weight = 0.8;
      else if (marker.niveauUrgence === 'moyen') weight = 0.6;
      return [marker.lat, marker.lng, weight] as [number, number, number];
    });

    if (heatLayerRef.current) {
      map.removeLayer(heatLayerRef.current);
    }

    // @ts-expect-error - leaflet.heat adds L.heatLayer
    heatLayerRef.current = L.heatLayer(heatData, {
      radius: 25,
      blur: 15,
      maxZoom: 17,
      gradient: { 0.2: '#00ff00', 0.4: '#ffff00', 0.6: '#ffa500', 0.8: '#ff4500', 1.0: '#ff0000' }
    }).addTo(map);

    return () => {
      if (heatLayerRef.current) {
        map.removeLayer(heatLayerRef.current);
        heatLayerRef.current = null;
      }
    };
  }, [map, markers, show]);

  return null;
}

function MarkerClusterLayer({ markers, onMarkerClick, show }: { markers: MapMarker[]; onMarkerClick: (m: MapMarker) => void; show: boolean }) {
  const map = useMap();
  const clusterGroupRef = useRef<any>(null);

  useEffect(() => {
    if (clusterGroupRef.current) {
      map.removeLayer(clusterGroupRef.current);
      clusterGroupRef.current = null;
    }

    if (!show || markers.length === 0) return;

    // @ts-expect-error - leaflet.markercluster adds L.markerClusterGroup
    const clusterGroup = L.markerClusterGroup({
      chunkedLoading: true,
      maxClusterRadius: 50,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      zoomToBoundsOnClick: true,
      iconCreateFunction: (cluster: any) => createClusterIcon(cluster.getChildCount())
    });

    markers.forEach(m => {
      const icon = createMarkerIcon(
        m.isSOS ? '#E30613' : categoryColors[m.categorie],
        m.isSOS || false,
        m.niveauUrgence
      );
      const leafletMarker = L.marker([m.lat, m.lng], { icon });
      leafletMarker.on('click', () => onMarkerClick(m));
      clusterGroup.addLayer(leafletMarker);
    });

    map.addLayer(clusterGroup);
    clusterGroupRef.current = clusterGroup;

    return () => {
      if (clusterGroupRef.current) {
        map.removeLayer(clusterGroupRef.current);
        clusterGroupRef.current = null;
      }
    };
  }, [map, markers, show, onMarkerClick]);

  return null;
}

function MapController({ center, zoom, highlightMarkerId, markers, onSelectMarker }: {
  center: [number, number];
  zoom: number;
  highlightMarkerId?: string | null;
  markers: MapMarker[];
  onSelectMarker: (m: MapMarker | null) => void;
}) {
  const map = useMap();
  const prevCenterRef = useRef<string>('');
  const prevZoomRef = useRef<number>(zoom);

  useEffect(() => {
    const key = `${center[0]},${center[1]},${zoom}`;
    if (key !== prevCenterRef.current || zoom !== prevZoomRef.current) {
      map.setView(center, zoom, { animate: true });
      prevCenterRef.current = key;
      prevZoomRef.current = zoom;
    }
  }, [map, center, zoom]);

  useEffect(() => {
    if (highlightMarkerId) {
      const marker = markers.find(m => m.id === highlightMarkerId);
      if (marker) {
        map.setView([marker.lat, marker.lng], 15, { animate: true });
        onSelectMarker(marker);
      }
    }
  }, [highlightMarkerId, markers, map, onSelectMarker]);

  return null;
}

export default function GoogleMap({ markers, className = '', highlightMarkerId = null, centerLat = null, centerLng = null, heatmapMode = false }: GoogleMapProps) {
  const [selectedMarker, setSelectedMarker] = useState<MapMarker | null>(null);
  const [showHeatmap, setShowHeatmap] = useState<boolean>(heatmapMode);
  const [radiusFilter, setRadiusFilter] = useState<number | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{lat: number; lng: number} | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showSearchResults, setShowSearchResults] = useState<boolean>(false);
  const [mapCenter, setMapCenter] = useState<[number, number]>(
    centerLat && centerLng ? [centerLat, centerLng] : BURKINA_FASO_CENTER
  );
  const [mapZoom, setMapZoom] = useState<number>(centerLat && centerLng ? 15 : 6.5);
  const [selectedCategory, setSelectedCategory] = useState<string>('tous');

  useEffect(() => {
    if (centerLat && centerLng) {
      setMapCenter([centerLat, centerLng]);
      setMapZoom(15);
    }
  }, [centerLat, centerLng]);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({ lat: position.coords.latitude, lng: position.coords.longitude });
        },
        () => {}
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
        results.push({ type: 'région', name: region.name, chefLieu: region.chefLieu, lat: region.lat, lng: region.lng });
      }
      region.provinces.forEach(province => {
        if (province.name.toLowerCase().includes(query) || province.chefLieu.toLowerCase().includes(query)) {
          results.push({ type: 'province', name: province.name, chefLieu: province.chefLieu, region: region.name, lat: region.lat, lng: region.lng });
        }
        province.communes.forEach(commune => {
          if (commune.toLowerCase().includes(query)) {
            results.push({ type: 'commune', name: commune, province: province.name, region: region.name, lat: region.lat, lng: region.lng });
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
      filtered = filtered.filter(marker => calculateDistance(userLocation.lat, userLocation.lng, marker.lat, marker.lng) <= radiusFilter);
    }
    if (selectedRegion && selectedRegion !== "all") {
      const region = BURKINA_REGIONS.find(r => r.name === selectedRegion);
      if (region) {
        filtered = filtered.filter(marker => calculateDistance(region.lat, region.lng, marker.lat, marker.lng) <= 100);
      }
    }
    if (selectedCategory !== "tous") {
      filtered = filtered.filter(marker => marker.categorie === selectedCategory);
    }
    return filtered;
  }, [markers, radiusFilter, selectedRegion, userLocation, selectedCategory]);

  const filteredCount = filteredMarkers.length;

  const handleRecenter = useCallback(() => {
    setMapCenter([...BURKINA_FASO_CENTER]);
    setMapZoom(6.5);
  }, []);

  const handleSearchResultClick = useCallback((result: any) => {
    setMapCenter([result.lat, result.lng]);
    setMapZoom(12);
    setSelectedRegion(result.region || result.name);
    setSearchQuery('');
    setShowSearchResults(false);
  }, []);

  const handleMarkerClick = useCallback((marker: MapMarker) => {
    setSelectedMarker(marker);
    setMapCenter([marker.lat, marker.lng]);
  }, []);

  return (
    <div className={`relative ${className}`}>
      <style>{`
        .custom-leaflet-marker { background: none !important; border: none !important; }
        .custom-cluster-icon { background: none !important; border: none !important; }
        @keyframes pulse { 0%, 100% { opacity: 0.4; transform: scale(1); } 50% { opacity: 0.2; transform: scale(1.1); } }
        @keyframes ping { 75%, 100% { transform: scale(2); opacity: 0; } }
        .leaflet-popup-content-wrapper { border-radius: 8px !important; box-shadow: 0 4px 15px rgba(0,0,0,0.15) !important; }
        .leaflet-popup-content { margin: 0 !important; }
      `}</style>

      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] w-full max-w-lg px-4">
        <div className="relative">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <Input
              type="text"
              placeholder="Rechercher une région, province ou commune..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full shadow-lg pl-9 pr-9"
              data-testid="input-search-map"
            />
            {searchQuery && (
              <button
                className="absolute right-3 top-1/2 -translate-y-1/2"
                onClick={() => setSearchQuery('')}
                data-testid="button-clear-search"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            )}
          </div>
          {showSearchResults && searchResults.length > 0 && (
            <Card className="absolute top-full left-0 right-0 mt-2 p-2 shadow-lg z-[1001] max-h-60 overflow-y-auto">
              {searchResults.map((result, index) => (
                <Button
                  key={index}
                  variant="ghost"
                  className="w-full justify-start text-left text-sm h-auto p-2"
                  onClick={() => handleSearchResultClick(result)}
                  data-testid={`button-search-result-${index}`}
                >
                  <div>
                    <span className="font-semibold">{result.name}</span>
                    {result.province && <span className="text-muted-foreground"> ({result.province})</span>}
                    {result.region && <span className="text-muted-foreground"> - {result.region}</span>}
                    <p className="text-xs text-muted-foreground">{result.type}</p>
                  </div>
                </Button>
              ))}
            </Card>
          )}
        </div>
      </div>

      <Draggable handle=".drag-handle">
        <div className="absolute z-[1000] max-w-md space-y-2 cursor-move" style={{ top: '60px', left: '10px' }}>
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
                        data-testid={`button-radius-${radius}`}
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
                <Select value={selectedRegion || 'all'} onValueChange={(value) => setSelectedRegion(value === 'all' ? null : value)}>
                  <SelectTrigger className="flex-1 text-xs bg-transparent border-none focus:ring-0 focus:shadow-none p-0 h-auto" data-testid="select-region">
                    <SelectValue placeholder="Toutes les régions" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes les régions</SelectItem>
                    {BURKINA_REGIONS.map(region => (
                      <SelectItem key={region.name} value={region.name}>{region.name} ({region.chefLieu})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="p-2 border-b">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-primary" />
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="flex-1 text-xs bg-transparent border-none focus:ring-0 focus:shadow-none p-0 h-auto" data-testid="select-category">
                    <SelectValue placeholder="Toutes les catégories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tous">Toutes catégories</SelectItem>
                    {Object.keys(categoryColors).map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="p-2">
              <Button
                variant={showHeatmap ? "default" : "outline"}
                size="sm"
                className="w-full text-xs"
                onClick={() => setShowHeatmap(!showHeatmap)}
                data-testid="button-toggle-heatmap"
              >
                <Flame className="w-4 h-4 mr-2" />
                Carte thermique
              </Button>
            </div>
          </Card>
        </div>
      </Draggable>

      <MapContainer
        center={mapCenter}
        zoom={mapZoom}
        maxBounds={BURKINA_FASO_BOUNDS}
        maxBoundsViscosity={1.0}
        minZoom={6}
        maxZoom={18}
        zoomControl={true}
        style={{ height: '100%', width: '100%' }}
        className="z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapController
          center={mapCenter}
          zoom={mapZoom}
          highlightMarkerId={highlightMarkerId}
          markers={markers}
          onSelectMarker={setSelectedMarker}
        />

        <HeatmapLayer markers={filteredMarkers} show={showHeatmap} />

        <MarkerClusterLayer
          markers={filteredMarkers}
          onMarkerClick={handleMarkerClick}
          show={!showHeatmap}
        />

        {selectedMarker && (
          <Popup
            position={[selectedMarker.lat, selectedMarker.lng]}
            onClose={() => setSelectedMarker(null)}
          >
            <div className="p-3 min-w-[240px]" data-testid={`popup-marker-${selectedMarker.id}`}>
              <h3 className="font-semibold text-sm mb-2">{selectedMarker.titre}</h3>
              <div className="flex gap-2 items-center flex-wrap mb-3">
                <Badge
                  variant="outline"
                  className="text-xs"
                  style={{ borderColor: categoryColors[selectedMarker.categorie], color: categoryColors[selectedMarker.categorie] }}
                >
                  {selectedMarker.categorie}
                </Badge>
                {selectedMarker.isSOS && (
                  <Badge variant="destructive" className="text-xs">SOS</Badge>
                )}
                {selectedMarker.niveauUrgence && (
                  <Badge
                    variant="outline"
                    className="text-xs flex items-center gap-1"
                    style={{ borderColor: urgencyColors[selectedMarker.niveauUrgence] || urgencyColors.moyen, color: urgencyColors[selectedMarker.niveauUrgence] || urgencyColors.moyen }}
                  >
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: urgencyColors[selectedMarker.niveauUrgence] || urgencyColors.moyen }} />
                    {selectedMarker.niveauUrgence}
                  </Badge>
                )}
              </div>
              <button
                onClick={() => {
                  window.open(`https://www.openstreetmap.org/?mlat=${selectedMarker.lat}&mlon=${selectedMarker.lng}#map=17/${selectedMarker.lat}/${selectedMarker.lng}`, '_blank', 'noopener,noreferrer');
                }}
                className="text-xs text-muted-foreground flex items-center gap-1 hover:text-primary transition-colors w-full"
                data-testid={`button-open-maps-${selectedMarker.id}`}
              >
                <MapPin className="w-3 h-3" />
                {selectedMarker.lat.toFixed(4)}, {selectedMarker.lng.toFixed(4)}
                <span className="ml-auto text-primary">Ouvrir</span>
              </button>
            </div>
          </Popup>
        )}

        {userLocation && radiusFilter && (
          <Circle
            center={[userLocation.lat, userLocation.lng]}
            radius={radiusFilter * 1000}
            pathOptions={{ color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.1, weight: 2, dashArray: '5 5' }}
          />
        )}
      </MapContainer>

      <div className="absolute bottom-4 right-4 z-[1000]">
        <Button
          onClick={handleRecenter}
          size="icon"
          variant="secondary"
          className="shadow-lg"
          title="Recentrer sur le Burkina Faso"
          data-testid="button-recenter-map"
        >
          <Locate className="w-5 h-5" />
        </Button>
      </div>

      {(radiusFilter || selectedRegion || selectedCategory !== "tous") && (
        <div className="absolute bottom-4 left-4 z-[1000]">
          <Card className="p-2 bg-background/95 backdrop-blur text-xs">
            <div className="font-medium flex items-center gap-2">
              <span className="text-lg font-bold text-primary">{filteredCount}</span>
              signalements trouvés
            </div>
            {selectedRegion && selectedRegion !== "all" && <div className="mt-1">Région: {selectedRegion}</div>}
            {selectedCategory && selectedCategory !== "tous" && <div className="mt-1">Catégorie: {selectedCategory}</div>}
            {radiusFilter && <div className="mt-1">Rayon: {radiusFilter}km</div>}
          </Card>
        </div>
      )}
    </div>
  );
}