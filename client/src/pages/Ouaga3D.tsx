import { useState, useEffect } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { Viewer } from "mapillary-js";
import "mapillary-js/dist/mapillary.css";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/Header";
import { 
  Globe, 
  MapPin, 
  Camera, 
  BarChart3, 
  RefreshCw,
  Play,
  ArrowLeft,
  Eye,
  Loader2,
  AlertTriangle,
  Navigation,
  Image as ImageIcon,
  TrendingUp,
  Clock,
  Database
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useLocation } from "wouter";
import "leaflet/dist/leaflet.css";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

interface Ouaga3dStats {
  totalImages: number;
  totalScenes: number;
  coveragePercent: number;
  lastUpdate: string | null;
  imagesBySource: Record<string, number>;
  jobsCompleted: number;
  jobsPending: number;
}

interface CoverageZone {
  id: string;
  quadkey: string;
  centerLat: string;
  centerLng: string;
  imageCount: number;
  hasSceneTile: boolean;
  coveragePercent: number | null;
}

interface ImageAsset {
  id: string;
  source: string;
  latitude: string;
  longitude: string;
  imageUrl: string | null;
  thumbnailUrl: string | null;
  captureDate: string | null;
  license: string | null;
  addedAt: string;
}

interface ZonesData {
  bounds: { minLat: number; maxLat: number; minLng: number; maxLng: number };
  zones: { name: string; lat: number; lng: number }[];
}

function MapCenterUpdater({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
}

function CoverageHeatmap({ coverage, onZoneClick }: { coverage: CoverageZone[]; onZoneClick: (zone: CoverageZone) => void }) {
  return (
    <>
      {coverage.map((zone) => {
        const lat = parseFloat(zone.centerLat);
        const lng = parseFloat(zone.centerLng);
        const intensity = Math.min(zone.imageCount / 10, 1);
        const color = zone.hasSceneTile 
          ? `rgba(34, 197, 94, ${0.4 + intensity * 0.5})`
          : `rgba(234, 179, 8, ${0.3 + intensity * 0.4})`;
        
        return (
          <CircleMarker
            key={zone.id}
            center={[lat, lng]}
            radius={12 + zone.imageCount}
            pathOptions={{
              fillColor: color,
              fillOpacity: 0.7,
              color: zone.hasSceneTile ? "#16a34a" : "#ca8a04",
              weight: 2,
            }}
            eventHandlers={{
              click: () => onZoneClick(zone)
            }}
          >
            <Popup>
              <div className="text-sm">
                <p className="font-semibold">{zone.imageCount} images</p>
                <p className="text-muted-foreground">
                  {zone.hasSceneTile ? "✅ Scène 3D disponible" : "⏳ En attente de reconstruction"}
                </p>
              </div>
            </Popup>
          </CircleMarker>
        );
      })}
    </>
  );
}

export default function Ouaga3D() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const [activeTab, setActiveTab] = useState<string>("explorer");
  const [selectedZone, setSelectedZone] = useState<CoverageZone | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>([12.3657, -1.5228]);

  const { data: stats, isLoading: loadingStats } = useQuery<Ouaga3dStats>({
    queryKey: ["/api/ouaga3d/stats"],
    refetchInterval: 30000,
  });

  const { data: coverage = [], isLoading: loadingCoverage } = useQuery<CoverageZone[]>({
    queryKey: ["/api/ouaga3d/coverage"],
    refetchInterval: 60000,
  });

  const { data: assets = [], isLoading: loadingAssets } = useQuery<ImageAsset[]>({
    queryKey: ["/api/ouaga3d/assets"],
    refetchInterval: 60000,
  });

  const { data: zonesData } = useQuery<ZonesData>({
    queryKey: ["/api/ouaga3d/zones"],
  });

  const { data: mapillaryConfig } = useQuery<{ token: string }>({
    queryKey: ["/api/config/mapillary-token"],
    staleTime: Infinity,
  });

  const handleZoneClick = (zone: CoverageZone) => {
    setSelectedZone(zone);
    setMapCenter([parseFloat(zone.centerLat), parseFloat(zone.centerLng)]);
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const sourceColors: Record<string, string> = {
    mapillary: "bg-green-500",
    openstreetcam: "bg-blue-500",
    wikimedia: "bg-purple-500",
    citizen: "bg-orange-500"
  };

  const sourceLabels: Record<string, string> = {
    mapillary: "Mapillary",
    openstreetcam: "OpenStreetCam",
    wikimedia: "Wikimedia",
    citizen: "Contributions citoyennes"
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center justify-between px-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/")}
            className="gap-2"
            data-testid="button-back"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour
          </Button>
          <h1 className="text-lg font-semibold flex items-center gap-2">
            <Globe className="h-5 w-5 text-primary" />
            Ouaga en 3D
          </h1>
          <div className="w-20"></div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 space-y-6">
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <ImageIcon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats?.totalImages ?? 0}</p>
                  <p className="text-xs text-muted-foreground">Images collectées</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/10 rounded-lg">
                  <Database className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats?.totalScenes ?? 0}</p>
                  <p className="text-xs text-muted-foreground">Scènes 3D</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-500/10 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-yellow-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats?.coveragePercent ?? 0}%</p>
                  <p className="text-xs text-muted-foreground">Couverture</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <Clock className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm font-medium truncate">
                    {stats?.lastUpdate ? formatDate(stats.lastUpdate) : "Jamais"}
                  </p>
                  <p className="text-xs text-muted-foreground">Dernière mise à jour</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="explorer" className="flex items-center gap-2" data-testid="tab-explorer">
              <Globe className="h-4 w-4" />
              Explorer (3D)
            </TabsTrigger>
            <TabsTrigger value="couverture" className="flex items-center gap-2" data-testid="tab-couverture">
              <MapPin className="h-4 w-4" />
              Couverture
            </TabsTrigger>
            <TabsTrigger value="sources" className="flex items-center gap-2" data-testid="tab-sources">
              <BarChart3 className="h-4 w-4" />
              Sources
            </TabsTrigger>
          </TabsList>

          <TabsContent value="explorer" className="mt-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Eye className="h-5 w-5" />
                  Vue panoramique 3D
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="aspect-video bg-muted rounded-lg overflow-hidden relative">
                  {mapillaryConfig?.token ? (
                    <div className="w-full h-full flex items-center justify-center">
                      <MapillaryExplorer 
                        token={mapillaryConfig.token}
                        lat={mapCenter[0]}
                        lng={mapCenter[1]}
                      />
                    </div>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="text-center">
                        <Globe className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">
                          Chargement du viewer 3D...
                        </p>
                      </div>
                    </div>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                  <Navigation className="h-3 w-3" />
                  Utilisez la souris pour naviguer dans la vue 3D. Cliquez sur les flèches pour avancer.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="couverture" className="mt-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <MapPin className="h-5 w-5" />
                  Carte de couverture - Ouagadougou
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[500px] rounded-lg overflow-hidden">
                  <MapContainer
                    center={mapCenter}
                    zoom={13}
                    className="h-full w-full"
                  >
                    <TileLayer
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    />
                    <MapCenterUpdater center={mapCenter} />
                    <CoverageHeatmap coverage={coverage} onZoneClick={handleZoneClick} />
                    
                    {zonesData?.zones.map((zone, i) => (
                      <CircleMarker
                        key={i}
                        center={[zone.lat, zone.lng]}
                        radius={6}
                        pathOptions={{
                          fillColor: "#1e40af",
                          fillOpacity: 0.8,
                          color: "#fff",
                          weight: 2,
                        }}
                      >
                        <Popup>
                          <p className="font-semibold">{zone.name}</p>
                          <p className="text-xs text-muted-foreground">Zone de collecte</p>
                        </Popup>
                      </CircleMarker>
                    ))}
                  </MapContainer>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <Badge variant="outline" className="gap-1">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    Scène 3D disponible
                  </Badge>
                  <Badge variant="outline" className="gap-1">
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    Images collectées
                  </Badge>
                  <Badge variant="outline" className="gap-1">
                    <div className="w-3 h-3 rounded-full bg-blue-800"></div>
                    Points de collecte
                  </Badge>
                </div>

                {selectedZone && (
                  <Card className="mt-4 border-primary/50">
                    <CardContent className="pt-4">
                      <h4 className="font-semibold mb-2">Zone sélectionnée</h4>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <p><span className="text-muted-foreground">Images:</span> {selectedZone.imageCount}</p>
                        <p><span className="text-muted-foreground">Statut:</span> {selectedZone.hasSceneTile ? "✅ 3D prête" : "⏳ En attente"}</p>
                        <p><span className="text-muted-foreground">Lat:</span> {parseFloat(selectedZone.centerLat).toFixed(4)}</p>
                        <p><span className="text-muted-foreground">Lng:</span> {parseFloat(selectedZone.centerLng).toFixed(4)}</p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sources" className="mt-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Camera className="h-5 w-5" />
                    Sources d'images
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {stats?.imagesBySource && Object.keys(stats.imagesBySource).length > 0 ? (
                    Object.entries(stats.imagesBySource).map(([source, count]) => (
                      <div key={source} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${sourceColors[source] || "bg-gray-500"}`}></div>
                          <span>{sourceLabels[source] || source}</span>
                        </div>
                        <Badge variant="secondary">{count}</Badge>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted-foreground text-center py-4">
                      Aucune image collectée pour le moment.<br />
                      L'ingestion automatique s'exécute à 02h00.
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <RefreshCw className="h-5 w-5" />
                    Jobs de reconstruction
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Terminés</span>
                      <Badge className="bg-green-500">{stats?.jobsCompleted ?? 0}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">En attente</span>
                      <Badge variant="outline">{stats?.jobsPending ?? 0}</Badge>
                    </div>
                  </div>

                  <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                    <h4 className="font-medium mb-2">Comment ça fonctionne ?</h4>
                    <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                      <li>Collecte quotidienne d'images publiques</li>
                      <li>Filtrage et dédoublonnage automatique</li>
                      <li>Estimation des positions spatiales</li>
                      <li>Reconstruction 3D incrémentale</li>
                      <li>Génération des tuiles navigables</li>
                    </ol>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="text-lg">Images récentes</CardTitle>
              </CardHeader>
              <CardContent>
                {loadingAssets ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : assets.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                    {assets.slice(0, 12).map((asset) => (
                      <div key={asset.id} className="relative group">
                        {asset.thumbnailUrl ? (
                          <img
                            src={asset.thumbnailUrl}
                            alt="Image collectée"
                            className="w-full aspect-square object-cover rounded-lg"
                          />
                        ) : (
                          <div className="w-full aspect-square bg-muted rounded-lg flex items-center justify-center">
                            <ImageIcon className="h-8 w-8 text-muted-foreground" />
                          </div>
                        )}
                        <Badge 
                          className={`absolute top-1 left-1 text-[10px] ${sourceColors[asset.source] || "bg-gray-500"}`}
                        >
                          {asset.source}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">
                    Aucune image disponible pour le moment.
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <Globe className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-primary">À propos de Ouaga en 3D</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Ce projet collecte automatiquement des images publiques sous licence libre (Mapillary, OpenStreetCam, Wikimedia) 
                  pour créer progressivement une vue 3D navigable de Ouagadougou. Les images sont traitées quotidiennement 
                  pour estimer leurs positions et reconstruire des scènes 3D cohérentes. La couverture s'enrichit chaque jour.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function MapillaryExplorer({ token, lat, lng }: { token: string; lat: number; lng: number }) {
  const [state, setState] = useState<"loading" | "ready" | "no_images" | "error">("loading");
  const containerRef = React.useRef<HTMLDivElement>(null);
  const viewerRef = React.useRef<Viewer | null>(null);

  useEffect(() => {
    if (!containerRef.current || !token) return;

    const initViewer = async () => {
      setState("loading");

      const bbox = 0.02;
      const url = `https://graph.mapillary.com/images?fields=id&bbox=${(lng - bbox).toFixed(3)},${(lat - bbox).toFixed(3)},${(lng + bbox).toFixed(3)},${(lat + bbox).toFixed(3)}&limit=1`;

      try {
        const response = await fetch(url, {
          headers: { "Authorization": `OAuth ${token}` }
        });
        const data = await response.json();

        if (!data.data || data.data.length === 0) {
          setState("no_images");
          return;
        }

        if (viewerRef.current) {
          viewerRef.current.remove();
        }

        if (!containerRef.current) return;

        const viewer = new Viewer({
          accessToken: token,
          container: containerRef.current as HTMLElement,
          imageId: data.data[0].id,
          component: {
            cover: false,
            direction: true,
            sequence: true,
            zoom: true,
          },
        });

        viewerRef.current = viewer;
        viewer.on("image", () => setState("ready"));
      } catch (error) {
        console.error("Mapillary error:", error);
        setState("error");
      }
    };

    initViewer();

    return () => {
      if (viewerRef.current) {
        viewerRef.current.remove();
        viewerRef.current = null;
      }
    };
  }, [token, lat, lng]);

  return (
    <div className="relative w-full h-full">
      <div ref={containerRef} className="w-full h-full" />
      {state === "loading" && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60">
          <Loader2 className="h-10 w-10 text-white animate-spin" />
        </div>
      )}
      {state === "no_images" && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/90">
          <div className="text-center">
            <Globe className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
            <p>Aucune image 3D dans cette zone</p>
          </div>
        </div>
      )}
      {state === "error" && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/90">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-2" />
            <p>Erreur de chargement</p>
          </div>
        </div>
      )}
    </div>
  );
}

import React from "react";
