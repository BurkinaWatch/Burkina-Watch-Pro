/**
 * GoogleMap Component - Version améliorée avec données géographiques complètes du Burkina Faso
 * 
 * Nouvelles fonctionnalités :
 * - Données complètes des 17 régions et 47 provinces du Burkina Faso
 * - Barre de recherche pour filtrer par région, province ou commune
 * - Carte thermique (heatmap) montrant les zones à forte densité
 * - Filtres géographiques par rayon (1km, 5km, 10km)
 */
import { APIProvider, Map, AdvancedMarker, InfoWindow, useMap } from '@vis.gl/react-google-maps';
import { useState, useEffect, useRef, useMemo } from 'react';
import { MarkerClusterer } from '@googlemaps/markerclusterer';
import type { Marker } from '@googlemaps/markerclusterer';
import type { Categorie } from '@shared/schema';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MapPin, AlertTriangle, Locate, Flame, Navigation, GripVertical, Search, X, Filter, Layers } from 'lucide-react';
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

const BURKINA_FASO_CENTER = {
  lat: 12.3714,
  lng: -1.5197
};

const BURKINA_FASO_BOUNDS = {
  north: 15.086,
  south: 9.410,
  east: 2.407,
  west: -5.523
};

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

// Données géographiques complètes du Burkina Faso - 17 régions et 47 provinces
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

function CustomMarker({ color, isSOS, niveauUrgence }: { color: string; isSOS: boolean; niveauUrgence?: string | null }) {
  const urgencyColor = niveauUrgence ? urgencyColors[niveauUrgence] || urgencyColors.moyen : urgencyColors.moyen;

  // Intensité du glow basée sur l'urgence
  const glowIntensity = niveauUrgence === 'critique' ? 0.8 : niveauUrgence === 'moyen' ? 0.6 : 0.4;
  const glowSize = niveauUrgence === 'critique' ? '70px' : niveauUrgence === 'moyen' ? '60px' : '50px';

  return (
    <div style={{ position: 'relative' }}>
      {/* Halo externe permanent pour TOUS les signalements */}
      <div 
        className="absolute inset-0 rounded-full"
        style={{
          width: glowSize,
          height: glowSize,
          background: `radial-gradient(circle, ${color}${Math.round(glowIntensity * 255).toString(16)} 0%, transparent 70%)`,
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          filter: 'blur(8px)',
          pointerEvents: 'none'
        }}
      />

      {/* Animation pulsante pour tous les signalements */}
      <div 
        className="absolute inset-0 rounded-full animate-pulse"
        style={{
          width: '48px',
          height: '48px',
          backgroundColor: color,
          opacity: 0.4,
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          animationDuration: isSOS ? '1s' : '2s'
        }}
      />

      {/* Animation supplémentaire pour SOS */}
      {isSOS && (
        <div 
          className="absolute inset-0 rounded-full animate-ping"
          style={{
            width: '60px',
            height: '60px',
            backgroundColor: color,
            opacity: 0.5,
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            animationDuration: '1.5s'
          }}
        />
      )}

      {/* Marker principal avec effet de brillance */}
      <div 
        style={{
          width: isSOS ? '36px' : '30px',
          height: isSOS ? '36px' : '30px',
          backgroundColor: color,
          borderRadius: '50% 50% 50% 0',
          transform: 'rotate(-45deg)',
          border: '3px solid white',
          boxShadow: `
            0 0 15px ${color}${Math.round(glowIntensity * 255).toString(16)},
            0 0 30px ${color}${Math.round(glowIntensity * 128).toString(16)},
            0 4px 12px rgba(0,0,0,0.4)
          `,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          position: 'relative',
          zIndex: 5
        }}
      >
        {isSOS ? (
          <AlertTriangle 
            size={16} 
            color="white" 
            style={{ 
              transform: 'rotate(45deg)',
              filter: 'drop-shadow(0 0 2px rgba(255,255,255,0.8))'
            }}
          />
        ) : (
          <MapPin 
            size={14} 
            color="white" 
            style={{ 
              transform: 'rotate(45deg)',
              filter: 'drop-shadow(0 0 1px rgba(255,255,255,0.6))'
            }}
          />
        )}
      </div>

      {/* Voyant d'urgence avec effet lumineux */}
      <div 
        className="animate-pulse"
        style={{
          position: 'absolute',
          top: '-4px',
          right: '-4px',
          width: '14px',
          height: '14px',
          backgroundColor: urgencyColor,
          borderRadius: '50%',
          border: '2px solid white',
          boxShadow: `
            0 0 8px ${urgencyColor},
            0 0 15px ${urgencyColor}80,
            0 2px 6px rgba(0,0,0,0.4)
          `,
          zIndex: 10,
          animationDuration: niveauUrgence === 'critique' ? '0.8s' : '1.5s'
        }}
        title={`Niveau d'urgence: ${niveauUrgence || 'moyen'}`}
      />
    </div>
  );
}

function RecenterControl({ onRecenter }: { onRecenter: () => void }) {
  return (
    <Button
      onClick={onRecenter}
      size="icon"
      variant="secondary"
      className="shadow-lg hover-elevate active-elevate-2"
      title="Recentrer sur le Burkina Faso"
      data-testid="button-recenter-map"
    >
      <Locate className="w-5 h-5" />
    </Button>
  );
}

function HeatmapLayer({ markers, showHeatmap }: { markers: MapMarker[]; showHeatmap: boolean }) {
  const map = useMap();
  const heatmapRef = useRef<google.maps.visualization.HeatmapLayer | null>(null);

  useEffect(() => {
    if (!map || !showHeatmap) {
      if (heatmapRef.current) {
        heatmapRef.current.setMap(null);
        heatmapRef.current = null;
      }
      return;
    }

    // @ts-expect-error - Google Maps API types
    if (!window.google?.maps?.visualization) {
      console.error('Google Maps Visualization library not loaded');
      return;
    }

    const heatmapData = markers.map(marker => {
      let weight = 1;
      if (marker.isSOS) weight = 5;
      else if (marker.niveauUrgence === 'critique') weight = 3;
      else if (marker.niveauUrgence === 'moyen') weight = 2;

      // @ts-expect-error - Google Maps API types
      return {
        location: new window.google.maps.LatLng(marker.lat, marker.lng),
        weight: weight
      };
    });

    if (heatmapRef.current) {
      heatmapRef.current.setData(heatmapData);
    } else {
      // @ts-expect-error - Google Maps API types
      heatmapRef.current = new window.google.maps.visualization.HeatmapLayer({
        data: heatmapData,
        map: map,
        radius: 30,
        opacity: 0.6,
        gradient: [
          'rgba(0, 255, 0, 0)',
          'rgba(255, 255, 0, 1)',
          'rgba(255, 165, 0, 1)',
          'rgba(255, 0, 0, 1)'
        ]
      });
    }

    return () => {
      if (heatmapRef.current) {
        heatmapRef.current.setMap(null);
        heatmapRef.current = null;
      }
    };
  }, [map, markers, showHeatmap]);

  return null;
}

interface ClusteredMarkersProps {
  markers: MapMarker[];
  onMarkerClick: (marker: MapMarker) => void;
  showMarkers: boolean;
}

function ClusteredMarkers({ markers, onMarkerClick, showMarkers }: ClusteredMarkersProps) {
  const map = useMap();
  const [markerRefs, setMarkerRefs] = useState<{[key: string]: Marker}>({});
  const clusterer = useRef<MarkerClusterer | null>(null);

  useEffect(() => {
    if (!map || !showMarkers) return;

    if (!clusterer.current) {
      clusterer.current = new MarkerClusterer({ 
        map,
        renderer: {
          render: ({ count, position }) => {
            const color = count > 10 ? '#ef4444' : count > 5 ? '#f97316' : '#22c55e';
            // @ts-expect-error - Google Maps API types
            return new window.google.maps.Marker({
              position,
              icon: {
                // @ts-expect-error - Google Maps API types
                path: window.google.maps.SymbolPath.CIRCLE,
                scale: Math.min(20 + (count * 2), 50),
                fillColor: color,
                fillOpacity: 0.85,
                strokeColor: 'white',
                strokeWeight: 3,
              },
              label: {
                text: String(count),
                color: 'white',
                fontSize: '14px',
                fontWeight: 'bold',
              },
              // @ts-expect-error - Google Maps API types
              zIndex: Number(window.google.maps.Marker.MAX_ZINDEX) + count,
            });
          },
        },
      });
    }
  }, [map, showMarkers]);

  useEffect(() => {
    if (!clusterer.current) return;

    clusterer.current.clearMarkers();
    if (showMarkers) {
      clusterer.current.addMarkers(Object.values(markerRefs));
    }
  }, [markerRefs, showMarkers]);

  const setMarkerRef = (marker: Marker | null, key: string) => {
    if (marker && markerRefs[key]) return;
    if (!marker && !markerRefs[key]) return;

    setMarkerRefs(prev => {
      if (marker) {
        return {...prev, [key]: marker};
      } else {
        const newMarkers = {...prev};
        delete newMarkers[key];
        return newMarkers;
      }
    });
  };

  if (!showMarkers) return null;

  const nonSOSMarkers = markers.filter(m => !m.isSOS);

  return (
    <>
      {nonSOSMarkers.map((marker) => (
        <AdvancedMarker
          key={marker.id}
          position={{ lat: marker.lat, lng: marker.lng }}
          ref={(markerRef) => setMarkerRef(markerRef, marker.id)}
          onClick={() => onMarkerClick(marker)}
        >
          <CustomMarker 
            color={categoryColors[marker.categorie]}
            isSOS={false}
            niveauUrgence={marker.niveauUrgence}
          />
        </AdvancedMarker>
      ))}
    </>
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

export default function GoogleMap({ markers, className = '', highlightMarkerId = null, centerLat = null, centerLng = null, heatmapMode = false }: GoogleMapProps) {
  const [selectedMarker, setSelectedMarker] = useState<MapMarker | null>(null);
  const [mapError, setMapError] = useState<boolean>(false);
  const [mapLoaded, setMapLoaded] = useState<boolean>(false);
  const [showHeatmap, setShowHeatmap] = useState<boolean>(heatmapMode);
  const [radiusFilter, setRadiusFilter] = useState<number | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{lat: number; lng: number} | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showSearchResults, setShowSearchResults] = useState<boolean>(false);
  const [mapCenter, setMapCenter] = useState<{lat: number; lng: number}>(BURKINA_FASO_CENTER);
  const [mapZoom, setMapZoom] = useState<number>(6.5);
  const [filteredCount, setFilteredCount] = useState<number>(0);
  const [selectedCategory, setSelectedCategory] = useState<string>('tous'); // Added state for category filter

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  // Centrer sur le marqueur recherché
  useEffect(() => {
    if (highlightMarkerId && centerLat && centerLng) {
      setMapCenter({ lat: parseFloat(centerLat.toString()), lng: parseFloat(centerLng.toString()) });
      setMapZoom(15);

      // Ouvrir automatiquement l'info window du marqueur
      const marker = markers.find(m => m.id === highlightMarkerId);
      if (marker) {
        setSelectedMarker(marker);
      }
    }
  }, [highlightMarkerId, centerLat, centerLng, markers]);

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

  // Recherche dans les régions, provinces et communes
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

    if (selectedRegion && selectedRegion !== "all") {
      const region = BURKINA_REGIONS.find(r => r.name === selectedRegion);
      if (region) {
        filtered = filtered.filter(marker => {
          const distance = calculateDistance(
            region.lat,
            region.lng,
            marker.lat,
            marker.lng
          );
          return distance <= 100; // Arbitrary large radius to approximate region inclusion
        });
      }
    }

    // Apply category filter
    if (selectedCategory !== "tous") {
      filtered = filtered.filter(marker => marker.categorie === selectedCategory);
    }

    return filtered;
  }, [markers, radiusFilter, selectedRegion, userLocation, selectedCategory]);

  // Effect to update filteredCount whenever filteredMarkers change
  useEffect(() => {
    setFilteredCount(filteredMarkers.length);
  }, [filteredMarkers]);


  useEffect(() => {
    const checkInterval = setInterval(() => {
      const errorElement = document.querySelector('.gm-err-message, .gm-err-content, .gm-err-title');
      const errorDialog = document.querySelector('[role="dialog"]');

      if (errorElement || (errorDialog && errorDialog.textContent?.includes('Google Maps'))) {
        console.error('Google Maps error detected in DOM');
        setMapError(true);
        clearInterval(checkInterval);
      }
    }, 300);

    const forceErrorTimeout = setTimeout(() => {
      if (!mapLoaded && !mapError) {
        console.error('Google Maps failed to load within timeout, showing fallback');
        setMapError(true);
      }
      clearInterval(checkInterval);
    }, 5000);

    return () => {
      clearInterval(checkInterval);
      clearTimeout(forceErrorTimeout);
    };
  }, [mapLoaded, mapError]);

  const handleApiError = (error: unknown) => {
    console.error('Google Maps API loading error:', error);
    setMapError(true);
  };

  const handleApiLoad = () => {
    console.log('Google Maps API loaded successfully');
    setMapLoaded(true);
  };

  const handleRecenter = () => {
    setMapCenter(BURKINA_FASO_CENTER);
    setMapZoom(6.5);
  };

  const handleSearchResultClick = (result: any) => {
    setMapCenter({ lat: result.lat, lng: result.lng });
    setMapZoom(12);
    setSelectedRegion(result.region || result.name);
    setSearchQuery('');
    setShowSearchResults(false);
  };

  if (!apiKey) {
    return (
      <div className={`flex flex-col items-center justify-center bg-muted/10 p-8 ${className}`}>
        <AlertTriangle className="w-12 h-12 mb-4 text-destructive" />
        <p className="text-muted-foreground text-center">Clé API Google Maps non configurée</p>
      </div>
    );
  }

  if (mapError) {
    return (
      <div className={`flex flex-col items-center justify-center bg-muted/10 p-8 ${className}`}>
        <AlertTriangle className="w-12 h-12 mb-4 text-destructive" />
        <h3 className="font-semibold text-lg mb-2">Erreur de chargement de la carte</h3>
        <p className="text-muted-foreground text-center max-w-md mb-4">
          La carte Google Maps n'a pas pu être chargée.
        </p>
        <div className="bg-card p-4 rounded-md border max-w-md">
          <h4 className="font-medium mb-2 text-sm">Données disponibles :</h4>
          <p className="text-sm text-muted-foreground">
            {markers.length} signalement{markers.length > 1 ? 's' : ''} géolocalisé{markers.length > 1 ? 's' : ''}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {/* Barre de recherche */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 w-full max-w-lg px-4">
        <div className="relative">
          <Input
            type="text"
            placeholder="Rechercher une région, province ou commune..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full shadow-lg"
            startIcon={<Search className="w-4 h-4 text-muted-foreground" />}
            endIcon={searchQuery && <X className="w-4 h-4 text-muted-foreground cursor-pointer" onClick={() => setSearchQuery('')} />}
          />
          {showSearchResults && searchResults.length > 0 && (
            <Card className="absolute top-full left-0 right-0 mt-2 p-2 shadow-lg z-30 max-h-60 overflow-y-auto">
              {searchResults.map((result, index) => (
                <Button
                  key={index}
                  variant="ghost"
                  className="w-full justify-start text-left text-sm h-auto p-2"
                  onClick={() => handleSearchResultClick(result)}
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

      {/* Floating Controls Panel */}
      <Draggable handle=".drag-handle">
        <div className="absolute z-30 max-w-md space-y-2 cursor-move">
          <Card className="bg-background/95 backdrop-blur shadow-lg">
            <div className="drag-handle p-2 flex items-center justify-center border-b cursor-grab active:cursor-grabbing">
              <GripVertical className="w-4 h-4 text-muted-foreground" />
            </div>

            {/* Filtre par rayon */}
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

            {/* Filtre par région */}
            <div className="p-2 border-b">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary" />
                <Select value={selectedRegion || 'all'} onValueChange={(value) => setSelectedRegion(value === 'all' ? null : value)}>
                  <SelectTrigger className="flex-1 text-xs bg-transparent border-none focus:ring-0 focus:shadow-none p-0 h-auto">
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
            </div>
            
            {/* Filtre par catégorie */}
            <div className="p-2 border-b">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-primary" />
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="flex-1 text-xs bg-transparent border-none focus:ring-0 focus:shadow-none p-0 h-auto">
                    <SelectValue placeholder="Toutes les catégories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tous">Toutes catégories</SelectItem>
                    {Object.keys(categoryColors).map(cat => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Toggle carte thermique */}
            <div className="p-2">
              <Button
                variant={showHeatmap ? "default" : "outline"}
                size="sm"
                className="w-full text-xs"
                onClick={() => setShowHeatmap(!showHeatmap)}
              >
                <Flame className="w-4 h-4 mr-2" />
                Carte thermique
              </Button>
            </div>
          </Card>
        </div>
      </Draggable>

      <APIProvider 
        apiKey={apiKey}
        onLoad={handleApiLoad}
        onError={handleApiError}
        libraries={['visualization']}
      >
        <Map
          center={mapCenter}
          zoom={mapZoom}
          gestureHandling="greedy"
          disableDefaultUI={false}
          restriction={{
            latLngBounds: BURKINA_FASO_BOUNDS,
            strictBounds: true
          }}
          mapId="burkina-watch-map"
        >
          <HeatmapLayer markers={filteredMarkers} showHeatmap={showHeatmap} />

          <ClusteredMarkers 
            markers={filteredMarkers} 
            onMarkerClick={setSelectedMarker}
            showMarkers={!showHeatmap}
          />

          {!showHeatmap && filteredMarkers.filter(m => m.isSOS).map((marker) => (
            <AdvancedMarker
              key={marker.id}
              position={{ lat: marker.lat, lng: marker.lng }}
              onClick={() => setSelectedMarker(marker)}
            >
              <CustomMarker 
                color="#E30613"
                isSOS={true}
                niveauUrgence={marker.niveauUrgence}
              />
            </AdvancedMarker>
          ))}

          {selectedMarker && (
            <InfoWindow
              position={{ lat: selectedMarker.lat, lng: selectedMarker.lng }}
              onCloseClick={() => setSelectedMarker(null)}
              data-testid={`infowindow-${selectedMarker.id}`}
            >
              <div className="p-2 min-w-[240px]">
                <h3 className="font-semibold text-sm mb-2">{selectedMarker.titre}</h3>
                <div className="flex gap-2 items-center flex-wrap mb-3">
                  <Badge 
                    variant="outline" 
                    className="text-xs"
                    style={{ 
                      borderColor: categoryColors[selectedMarker.categorie],
                      color: categoryColors[selectedMarker.categorie]
                    }}
                  >
                    {selectedMarker.categorie}
                  </Badge>
                  {selectedMarker.isSOS && (
                    <Badge variant="destructive" className="text-xs">
                      SOS
                    </Badge>
                  )}
                  {selectedMarker.niveauUrgence && (
                    <Badge 
                      variant="outline" 
                      className="text-xs flex items-center gap-1"
                      style={{ 
                        borderColor: urgencyColors[selectedMarker.niveauUrgence] || urgencyColors.moyen,
                        color: urgencyColors[selectedMarker.niveauUrgence] || urgencyColors.moyen
                      }}
                    >
                      <div 
                        className="w-2 h-2 rounded-full" 
                        style={{ 
                          backgroundColor: urgencyColors[selectedMarker.niveauUrgence] || urgencyColors.moyen 
                        }}
                      />
                      {selectedMarker.niveauUrgence}
                    </Badge>
                  )}
                </div>

                <button
                  onClick={() => {
                    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${selectedMarker.lat},${selectedMarker.lng}`;
                    window.open(mapsUrl, '_blank', 'noopener,noreferrer');
                  }}
                  className="text-xs text-muted-foreground flex items-center gap-1 hover:text-primary transition-colors w-full"
                  data-testid={`button-open-maps-${selectedMarker.id}`}
                >
                  <MapPin className="w-3 h-3" />
                  {selectedMarker.lat.toFixed(4)}, {selectedMarker.lng.toFixed(4)}
                  <span className="ml-auto text-primary">Ouvrir →</span>
                </button>
              </div>
            </InfoWindow>
          )}

          <div className="absolute bottom-4 right-4 z-20">
            <RecenterControl onRecenter={handleRecenter} />
          </div>
        </Map>
      </APIProvider>

      {/* Indicateur de filtrage actif */}
      {(radiusFilter || selectedRegion || selectedCategory !== "tous") && (
        <div className="absolute bottom-4 left-4 z-20">
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