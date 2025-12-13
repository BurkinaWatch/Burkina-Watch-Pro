import { useState, useEffect, useRef, useCallback } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { Viewer } from "mapillary-js";
import "mapillary-js/dist/mapillary.css";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import Header from "@/components/Header";
import { 
  Camera, 
  MapPin, 
  Trash2, 
  History, 
  AlertTriangle, 
  Play, 
  Square,
  ImageIcon,
  X,
  Eye,
  Navigation,
  Globe,
  Loader2,
  Info,
  RefreshCw,
  ArrowLeft
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

const cameraIcon = new L.Icon({
  iconUrl: "data:image/svg+xml," + encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#16a34a" width="32" height="32">
      <circle cx="12" cy="12" r="10" fill="#16a34a"/>
      <path d="M12 9a3 3 0 100 6 3 3 0 000-6z" fill="white"/>
      <path d="M5 7h2l1-2h8l1 2h2a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9a2 2 0 012-2z" fill="none" stroke="white" stroke-width="1.5"/>
    </svg>
  `),
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

interface StreetviewPoint {
  id: string;
  latitude: string;
  longitude: string;
  imageData: string;
  thumbnailData?: string;
  heading?: string;
  pitch?: string;
  capturedAt: string;
  deviceInfo?: string;
}

interface LocalHistoryItem {
  id: string;
  imageData: string;
  thumbnailData: string;
  latitude: number;
  longitude: number;
  capturedAt: string;
}

const HISTORY_KEY = "burkina_streetview_history";
const MAX_HISTORY_ITEMS = 20;

function getLocalHistory(): LocalHistoryItem[] {
  try {
    const stored = localStorage.getItem(HISTORY_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveToLocalHistory(item: LocalHistoryItem): void {
  try {
    const history = getLocalHistory();
    const newHistory = [item, ...history.filter(h => h.id !== item.id)].slice(0, MAX_HISTORY_ITEMS);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(newHistory));
  } catch (e) {
    console.error("Erreur sauvegarde historique:", e);
  }
}

function clearLocalHistory(): void {
  localStorage.removeItem(HISTORY_KEY);
}

function createThumbnail(imageData: string, maxWidth: number = 150): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ratio = maxWidth / img.width;
      canvas.width = maxWidth;
      canvas.height = img.height * ratio;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.6));
      } else {
        resolve(imageData);
      }
    };
    img.onerror = () => resolve(imageData);
    img.src = imageData;
  });
}

function MapCenterUpdater({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
}

type MapillaryResult = 
  | { success: true; imageId: string }
  | { success: false; error: "invalid_token" | "no_images" | "network_error" };

async function findNearestMapillaryImage(lat: number, lng: number, token: string): Promise<MapillaryResult> {
  const bbox = 0.02;
  const minLng = (lng - bbox).toFixed(3);
  const minLat = (lat - bbox).toFixed(3);
  const maxLng = (lng + bbox).toFixed(3);
  const maxLat = (lat + bbox).toFixed(3);
  const url = `https://graph.mapillary.com/images?fields=id&bbox=${minLng},${minLat},${maxLng},${maxLat}&limit=1`;

  try {
    const response = await fetch(url, {
      headers: {
        "Authorization": `OAuth ${token}`
      }
    });
    const data = await response.json();

    if (data.error) {
      console.error("Mapillary API error:", data.error.message);
      if (data.error.code === 190 || data.error.message?.includes("OAuth")) {
        return { success: false, error: "invalid_token" };
      }
      return { success: false, error: "network_error" };
    }

    if (!response.ok) {
      console.error("Mapillary API error:", response.status);
      return { success: false, error: "network_error" };
    }

    if (data.data && data.data.length > 0) {
      return { success: true, imageId: data.data[0].id };
    }
    return { success: false, error: "no_images" };
  } catch (error) {
    console.error("Error fetching Mapillary images:", error);
    return { success: false, error: "network_error" };
  }
}

type ViewerState = "loading" | "ready" | "no_images" | "invalid_token" | "network_error";

function MapillaryViewer({ 
  latitude, 
  longitude, 
  token,
  onError 
}: { 
  latitude: number; 
  longitude: number;
  token: string;
  onError: (message: string) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<Viewer | null>(null);
  const [viewerState, setViewerState] = useState<ViewerState>("loading");
  const [currentLocation, setCurrentLocation] = useState({ lat: latitude, lng: longitude });

  const initViewer = useCallback(async () => {
    if (!containerRef.current || !token) {
      if (!token) {
        setViewerState("invalid_token");
        onError("Token Mapillary non configuré");
      }
      return;
    }

    setViewerState("loading");

    if (viewerRef.current) {
      viewerRef.current.remove();
      viewerRef.current = null;
    }

    try {
      const result = await findNearestMapillaryImage(latitude, longitude, token);

      if (!result.success) {
        setViewerState(result.error);
        return;
      }

      const viewer = new Viewer({
        accessToken: token,
        container: containerRef.current,
        imageId: result.imageId,
        component: {
          cover: false,
          direction: true,
          sequence: true,
          zoom: true,
        },
      });

      viewerRef.current = viewer;

      viewer.on("image", (event: any) => {
        setViewerState("ready");
        if (event.image && event.image.lngLat) {
          setCurrentLocation({
            lat: event.image.lngLat.lat,
            lng: event.image.lngLat.lng,
          });
        }
      });

    } catch (error) {
      console.error("Erreur initialisation Mapillary:", error);
      setViewerState("network_error");
      onError("Erreur initialisation du viewer");
    }
  }, [latitude, longitude, token, onError]);

  useEffect(() => {
    initViewer();

    return () => {
      if (viewerRef.current) {
        viewerRef.current.remove();
        viewerRef.current = null;
      }
    };
  }, [initViewer]);

  const handleRefresh = async () => {
    if (!viewerRef.current) {
      initViewer();
      return;
    }

    setViewerState("loading");

    try {
      const result = await findNearestMapillaryImage(latitude, longitude, token);

      if (!result.success) {
        setViewerState(result.error);
        return;
      }

      viewerRef.current.moveTo(result.imageId).catch(() => {
        setViewerState("no_images");
      });
    } catch {
      setViewerState("network_error");
    }
  };

  if (!token) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-muted/50 rounded-lg">
        <div className="text-center p-4">
          <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-3" />
          <p className="text-muted-foreground">Token Mapillary non configuré</p>
          <p className="text-xs text-muted-foreground mt-1">
            Contactez l'administrateur pour activer cette fonctionnalité
          </p>
        </div>
      </div>
    );
  }

  const renderOverlay = () => {
    switch (viewerState) {
      case "loading":
        return (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-lg">
            <div className="text-center">
              <Loader2 className="h-10 w-10 text-white animate-spin mx-auto mb-2" />
              <p className="text-white text-sm">Chargement des images...</p>
            </div>
          </div>
        );

      case "invalid_token":
        return (
          <div className="absolute inset-0 flex items-center justify-center bg-muted/90 rounded-lg">
            <div className="text-center p-6">
              <AlertTriangle className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
              <h3 className="font-semibold text-lg mb-2">Token Mapillary invalide</h3>
              <p className="text-muted-foreground text-sm mb-4">
                Le token d'accès à Mapillary est invalide ou expiré.<br />
                Un token Client valide est requis depuis<br />
                <a 
                  href="https://www.mapillary.com/developer" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary underline"
                >
                  mapillary.com/developer
                </a>
              </p>
              <Button onClick={handleRefresh} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Réessayer
              </Button>
            </div>
          </div>
        );

      case "no_images":
        return (
          <div className="absolute inset-0 flex items-center justify-center bg-muted/90 rounded-lg">
            <div className="text-center p-6">
              <Globe className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold text-lg mb-2">Aucune image disponible</h3>
              <p className="text-muted-foreground text-sm mb-4">
                Pas d'images panoramiques dans cette zone.<br />
                Utilisez la capture citoyenne pour contribuer!
              </p>
              <Button onClick={handleRefresh} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Réessayer
              </Button>
            </div>
          </div>
        );

      case "network_error":
        return (
          <div className="absolute inset-0 flex items-center justify-center bg-muted/90 rounded-lg">
            <div className="text-center p-6">
              <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
              <h3 className="font-semibold text-lg mb-2">Erreur de connexion</h3>
              <p className="text-muted-foreground text-sm mb-4">
                Impossible de se connecter au service Mapillary.<br />
                Vérifiez votre connexion internet.
              </p>
              <Button onClick={handleRefresh} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Réessayer
              </Button>
            </div>
          </div>
        );

      case "ready":
        return (
          <div className="absolute bottom-3 left-3 bg-black/70 text-white text-xs px-2 py-1 rounded">
            <Navigation className="h-3 w-3 inline mr-1" />
            {currentLocation.lat.toFixed(4)}, {currentLocation.lng.toFixed(4)}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="relative w-full h-full">
      <div ref={containerRef} className="w-full h-full rounded-lg overflow-hidden" />
      {renderOverlay()}
    </div>
  );
}

export default function StreetView() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const [activeTab, setActiveTab] = useState<string>("explore");
  const [isCapturing, setIsCapturing] = useState(false);
  const [currentPosition, setCurrentPosition] = useState<{ lat: number; lng: number }>({ lat: 12.3769, lng: -1.5160 });
  const [showHistory, setShowHistory] = useState(false);
  const [localHistory, setLocalHistory] = useState<LocalHistoryItem[]>(getLocalHistory());
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isPageVisible, setIsPageVisible] = useState(true);
  const [captureCount, setCaptureCount] = useState(0);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const captureIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const { data: mapillaryConfig, isLoading: isLoadingToken } = useQuery<{ token: string }>({
    queryKey: ["/api/config/mapillary-token"],
    retry: 1,
    staleTime: Infinity,
  });

  const { data: mapPoints = [], isLoading: isLoadingPoints } = useQuery<StreetviewPoint[]>({
    queryKey: ["/api/streetview/map-points"],
    refetchInterval: 30000,
  });

  const uploadMutation = useMutation({
    mutationFn: async (data: { imageData: string; thumbnailData: string; latitude: number; longitude: number; heading?: number }) => {
      return apiRequest("POST", "/api/streetview/upload", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/streetview/map-points"] });
      setCaptureCount(prev => prev + 1);
    },
  });

  const stopCapture = useCallback(() => {
    if (captureIntervalRef.current) {
      clearInterval(captureIntervalRef.current);
      captureIntervalRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setIsCapturing(false);

    toast({
      title: "Capture arrêtée",
      description: `${captureCount} photo(s) capturée(s) et enregistrée(s).`,
    });
  }, [captureCount, toast]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      const visible = document.visibilityState === "visible";
      setIsPageVisible(visible);

      if (!visible && isCapturing) {
        stopCapture();
        toast({
          title: "Capture arrêtée",
          description: "La capture a été arrêtée car vous avez quitté la page.",
          variant: "default",
        });
      }
    };

    const handleBeforeUnload = () => {
      stopCapture();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      stopCapture();
    };
  }, [isCapturing, stopCapture, toast]);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCurrentPosition({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          });
        },
        (error) => {
          console.error("Erreur géolocalisation:", error);
          setCurrentPosition({ lat: 12.3769, lng: -1.5160 });
        }
      );
    } else {
      setCurrentPosition({ lat: 12.3769, lng: -1.5160 });
    }
  }, []);

  const capturePhoto = useCallback(async () => {
    if (!videoRef.current || !isPageVisible) return;

    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(videoRef.current, 0, 0);

    const imageData = canvas.toDataURL("image/jpeg", 0.8);
    const thumbnailData = await createThumbnail(imageData);

    const historyItem: LocalHistoryItem = {
      id: `local-${Date.now()}`,
      imageData,
      thumbnailData,
      latitude: currentPosition.lat,
      longitude: currentPosition.lng,
      capturedAt: new Date().toISOString(),
    };

    saveToLocalHistory(historyItem);
    setLocalHistory(getLocalHistory());

    uploadMutation.mutate({
      imageData,
      thumbnailData,
      latitude: currentPosition.lat,
      longitude: currentPosition.lng,
    });
  }, [isPageVisible, uploadMutation, currentPosition]);

  const startCapture = useCallback(async () => {
    setCameraError(null);
    setCaptureCount(0);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      const error = "Votre navigateur ne supporte pas la capture de photos.";
      setCameraError(error);
      toast({
        title: "Non supporté",
        description: error,
        variant: "destructive",
      });
      return;
    }

    try {
      let stream: MediaStream | null = null;

      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        });
      } catch (err1) {
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: { ideal: "environment" } },
            audio: false,
          });
        } catch (err2) {
          stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        }
      }

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.muted = true;
        await videoRef.current.play();
      }

      captureIntervalRef.current = setInterval(() => {
        capturePhoto();
      }, 5000);

      setIsCapturing(true);

      toast({
        title: "Capture démarrée ✓",
        description: "Les photos sont capturées toutes les 5 secondes.",
      });

    } catch (error: any) {
      let errorMessage = "Impossible d'accéder à la caméra.";

      if (error?.name === "NotAllowedError" || error?.name === "PermissionDeniedError") {
        errorMessage = "Permission refusée - Vérifiez les permissions caméra du navigateur";
      } else if (error?.name === "NotFoundError") {
        errorMessage = "Aucune caméra détectée sur cet appareil";
      } else if (error?.name === "NotReadableError") {
        errorMessage = "La caméra est déjà utilisée par une autre application";
      }

      setCameraError(errorMessage);
      toast({
        title: "Erreur caméra",
        description: errorMessage,
        variant: "destructive",
      });
    }
  }, [toast, capturePhoto]);

  const handleDeleteHistory = useCallback(() => {
    clearLocalHistory();
    setLocalHistory([]);
    toast({
      title: "Historique supprimé",
      description: "Toutes les images locales ont été supprimées.",
    });
  }, [toast]);

  const handleMapillaryError = useCallback((message: string) => {
    console.error("Mapillary error:", message);
  }, []);

  const create3DVideo = useCallback(async () => {
    if (localHistory.length < 2) {
      toast({
        title: "Pas assez d'images",
        description: "Vous avez besoin d'au moins 2 images pour créer une vidéo 3D",
        variant: "destructive",
      });
      return;
    }

    try {
      const canvas = document.createElement("canvas");
      canvas.width = 1280;
      canvas.height = 720;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const images = await Promise.all(
        localHistory.map(item => {
          return new Promise<HTMLImageElement>((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = item.imageData;
          });
        })
      );

      const frames: string[] = [];
      for (const img of images) {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        frames.push(canvas.toDataURL("image/jpeg", 0.7));
      }

      const blob = new Blob([JSON.stringify({
        frames,
        metadata: {
          count: localHistory.length,
          created: new Date().toISOString(),
          positions: localHistory.map(h => ({ lat: h.latitude, lng: h.longitude }))
        }
      })], { type: "application/json" });

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `video-3d-${Date.now()}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Vidéo 3D créée ✓",
        description: `${localHistory.length} images compilées en vidéo 3D`,
      });
    } catch (error) {
      console.error("Erreur création vidéo 3D:", error);
      toast({
        title: "Erreur",
        description: "Impossible de créer la vidéo 3D",
        variant: "destructive",
      });
    }
  }, [localHistory, toast]);

  const mapCenter: [number, number] = [currentPosition.lat, currentPosition.lng];

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center justify-between px-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/")}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Quitter
          </Button>
          <h1 className="text-lg font-semibold">Vue Street 360°</h1>
          <div className="w-20"></div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 space-y-4">
        <Card className="border-yellow-500/50 bg-yellow-500/10">
          <CardContent className="py-3 px-4 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-yellow-600 dark:text-yellow-400">
                Avertissement de sécurité
              </p>
              <p className="text-sm text-muted-foreground">
                Ne pas utiliser en conduisant — laissez le téléphone fixé. Toutes les images sont anonymisées automatiquement.
              </p>
            </div>
          </CardContent>
        </Card>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="explore" className="flex items-center gap-2" data-testid="tab-explore">
              <Globe className="h-4 w-4" />
              Explorer (3D)
            </TabsTrigger>
            <TabsTrigger value="capture" className="flex items-center gap-2" data-testid="tab-capture">
              <Camera className="h-4 w-4" />
              Capture citoyenne
            </TabsTrigger>
          </TabsList>

          <TabsContent value="explore" className="mt-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2">
                      <Eye className="h-5 w-5 text-primary" />
                      Vue panoramique 3D
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="aspect-video rounded-lg overflow-hidden bg-muted">
                      {isLoadingToken ? (
                        <div className="w-full h-full flex items-center justify-center">
                          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                          <span className="ml-2 text-muted-foreground">Chargement...</span>
                        </div>
                      ) : !mapillaryConfig?.token ? (
                        <div className="w-full h-full flex items-center justify-center bg-muted/50">
                          <div className="text-center p-6">
                            <Globe className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                            <h3 className="font-semibold text-lg mb-2">Service non disponible</h3>
                            <p className="text-muted-foreground text-sm mb-4">
                              La vue panoramique 3D n'est pas encore configurée.<br />
                              Utilisez l'onglet "Capture citoyenne" pour contribuer!
                            </p>
                          </div>
                        </div>
                      ) : (
                        <MapillaryViewer 
                          latitude={currentPosition.lat} 
                          longitude={currentPosition.lng}
                          token={mapillaryConfig.token}
                          onError={handleMapillaryError}
                        />
                      )}
                    </div>
                    <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                      <Info className="h-4 w-4" />
                      <span>Utilisez la souris pour naviguer dans la vue 3D. Cliquez sur les flèches pour avancer.</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-primary" />
                      Carte des contributions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="aspect-square rounded-lg overflow-hidden">
                      <MapContainer
                          center={mapCenter}
                          zoom={14}
                          className="w-full h-full"
                          scrollWheelZoom={true}
                        >
                          <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                          />
                          <MapCenterUpdater center={mapCenter} />

                          <Marker position={mapCenter}>
                            <Popup>Votre position</Popup>
                          </Marker>

                          {mapPoints.map((point) => (
                            <Marker
                              key={point.id}
                              position={[parseFloat(point.latitude), parseFloat(point.longitude)]}
                              icon={cameraIcon}
                            >
                              <Popup>
                                <div className="w-48">
                                  <img 
                                    src={point.thumbnailData || point.imageData} 
                                    alt="Capture"
                                    className="w-full rounded mb-2"
                                  />
                                  <p className="text-xs text-gray-500">
                                    {new Date(point.capturedAt).toLocaleString("fr-FR")}
                                  </p>
                                </div>
                              </Popup>
                            </Marker>
                          ))}
                        </MapContainer>
                    </div>
                    <p className="text-sm text-muted-foreground mt-2 text-center">
                      {mapPoints.length} contribution(s) citoyenne(s)
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="capture" className="mt-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2">
                    <Camera className="h-5 w-5 text-primary" />
                    Capture en direct
                    {isCapturing && (
                      <Badge className="ml-auto bg-red-500 animate-pulse">
                        REC • {captureCount} photos
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="aspect-video bg-black rounded-lg overflow-hidden relative">
                    <video
                      ref={videoRef}
                      className="w-full h-full object-cover"
                      playsInline
                      muted
                      data-testid="video-capture"
                    />
                    {!isCapturing && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                        <div className="text-center px-4 max-w-md">
                          <Camera className="h-12 w-12 text-white/50 mx-auto mb-2" />
                          {cameraError ? (
                            <div className="bg-red-900/80 rounded-lg p-4 text-left">
                              <p className="text-red-200 text-sm font-semibold mb-2 whitespace-pre-line">{cameraError}</p>
                              <Button
                                onClick={startCapture}
                                variant="outline"
                                size="sm"
                                className="mt-2 w-full"
                              >
                                Réessayer
                              </Button>
                            </div>
                          ) : (
                            <p className="text-white/70 text-sm">Prêt à démarrer la capture</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    {!isCapturing ? (
                      <Button 
                        onClick={startCapture}
                        className="flex-1 bg-green-600 hover:bg-green-700"
                        disabled={!currentPosition}
                        data-testid="button-start-capture"
                      >
                        <Play className="h-4 w-4 mr-2" />
                        Démarrer la capture
                      </Button>
                    ) : (
                      <Button 
                        onClick={stopCapture}
                        className="flex-1 bg-red-600 hover:bg-red-700"
                        data-testid="button-stop-capture"
                      >
                        <Square className="h-4 w-4 mr-2" />
                        Arrêter la capture
                      </Button>
                    )}
                  </div>

                  <div className="bg-muted/50 rounded-lg p-3 text-center">
                    <p className="text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                        Mode anonyme activé
                      </span>
                      <span className="mx-2">•</span>
                      Aucune donnée personnelle collectée
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <History className="h-5 w-5 text-primary" />
                      Historique local
                    </CardTitle>
                    <div className="flex gap-2">
                      <Badge variant="outline">{localHistory.length}/{MAX_HISTORY_ITEMS}</Badge>
                      <Badge variant="secondary" className="gap-1">
                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                        {((localHistory.reduce((acc, item) => acc + item.imageData.length, 0)) / 1024 / 1024).toFixed(1)} MB
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => setShowHistory(!showHistory)}
                    data-testid="button-toggle-gallery"
                  >
                    <ImageIcon className="h-4 w-4 mr-2" />
                    {showHistory ? "Masquer" : "Afficher"} la galerie
                  </Button>

                  {showHistory && (
                    <div className="space-y-3">
                      {localHistory.length === 0 ? (
                        <div className="text-center py-8 bg-muted/30 rounded-lg">
                          <ImageIcon className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                          <p className="text-sm text-muted-foreground">
                            Aucune image dans l'historique
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Démarrez une capture pour ajouter des images
                          </p>
                        </div>
                      ) : (
                        <>
                          <div className="grid grid-cols-3 gap-2 max-h-64 overflow-y-auto">
                            {localHistory.map((item) => (
                              <div
                                key={item.id}
                                className="aspect-square rounded-md overflow-hidden cursor-pointer hover:ring-2 hover:ring-primary transition-all"
                                onClick={() => setSelectedImage(item.imageData)}
                                data-testid={`gallery-item-${item.id}`}
                              >
                                <img
                                  src={item.thumbnailData}
                                  alt="Historique"
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            ))}
                          </div>

                          <Button
                            onClick={create3DVideo}
                            className="w-full bg-purple-600 hover:bg-purple-700 gap-2"
                            disabled={localHistory.length < 2}
                            data-testid="button-create-3d-video"
                          >
                            <Globe className="h-4 w-4" />
                            Créer vidéo 3D ({localHistory.length} images)
                          </Button>

                          <Button
                            variant="destructive"
                            size="sm"
                            className="w-full"
                            onClick={handleDeleteHistory}
                            data-testid="button-delete-history"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Supprimer l'historique
                          </Button>
                        </>
                      )}
                    </div>
                  )}

                  <Card className="bg-blue-500/10 border-blue-500/30">
                    <CardContent className="py-3 px-4">
                      <div className="flex items-start gap-3">
                        <Info className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                        <div className="text-sm">
                          <p className="font-medium text-blue-600 dark:text-blue-400">
                            Comment ça marche?
                          </p>
                          <ul className="text-muted-foreground mt-1 space-y-1 text-xs">
                            <li>• Les photos sont prises toutes les 5 secondes</li>
                            <li>• Elles sont géolocalisées automatiquement</li>
                            <li>• Stockées localement (max {MAX_HISTORY_ITEMS})</li>
                            <li>• Uploadées anonymement sur la carte</li>
                          </ul>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {selectedImage && (
        <div 
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
          data-testid="image-modal"
        >
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 text-white hover:bg-white/20"
            onClick={() => setSelectedImage(null)}
            data-testid="button-close-modal"
          >
            <X className="h-6 w-6" />
          </Button>
          <img
            src={selectedImage}
            alt="Vue agrandie"
            className="max-w-full max-h-full object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}