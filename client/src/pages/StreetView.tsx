import { useState, useEffect, useRef, useCallback } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  Image as ImageIcon,
  X,
  ChevronLeft,
  ChevronRight,
  Eye
} from "lucide-react";
import { useTranslation } from "react-i18next";
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

export default function StreetView() {
  const { t } = useTranslation();
  const { toast } = useToast();
  
  const [isCapturing, setIsCapturing] = useState(false);
  const [currentPosition, setCurrentPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [localHistory, setLocalHistory] = useState<LocalHistoryItem[]>(getLocalHistory());
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isPageVisible, setIsPageVisible] = useState(true);
  const [captureCount, setCaptureCount] = useState(0);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const captureIntervalRef = useRef<NodeJS.Timeout | null>(null);

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
  }, [isCapturing]);

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
          setCurrentPosition({ lat: 12.3714, lng: -1.5197 });
        }
      );
    }
  }, []);

  const startCapture = useCallback(async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      toast({
        title: "Non supporté",
        description: "Votre navigateur ne supporte pas la capture de photos. Veuillez utiliser un navigateur moderne (Chrome, Firefox, Safari).",
        variant: "destructive",
      });
      return;
    }

    // Vérifier si on est en HTTPS (requis pour getUserMedia)
    if (window.location.protocol !== "https:" && window.location.hostname !== "localhost") {
      toast({
        title: "Connexion non sécurisée",
        description: "La caméra nécessite une connexion HTTPS sécurisée.",
        variant: "destructive",
      });
      return;
    }

    try {
      // D'abord essayer avec la caméra arrière
      let stream: MediaStream | null = null;
      
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: "environment" },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });
      } catch (backCameraError) {
        console.warn("Caméra arrière non disponible, tentative avec n'importe quelle caméra:", backCameraError);
        // Fallback: essayer avec n'importe quelle caméra
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
      }

      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.muted = true;
        await videoRef.current.play();
      }

      setIsCapturing(true);
      setCaptureCount(0);

      captureIntervalRef.current = setInterval(() => {
        capturePhoto();
      }, 5000);

      toast({
        title: "Capture démarrée",
        description: "Les photos sont capturées automatiquement toutes les 5 secondes.",
      });

    } catch (error: any) {
      console.error("Erreur accès caméra - nom:", error?.name, "message:", error?.message, "erreur complète:", error);
      
      let errorMessage = "Impossible d'accéder à la caméra.";
      
      if (error?.name === "NotAllowedError" || error?.name === "PermissionDeniedError") {
        errorMessage = "Veuillez autoriser l'accès à la caméra dans les paramètres de votre navigateur.";
      } else if (error?.name === "NotFoundError" || error?.name === "DevicesNotFoundError") {
        errorMessage = "Aucune caméra détectée sur cet appareil.";
      } else if (error?.name === "NotReadableError" || error?.name === "TrackStartError") {
        errorMessage = "La caméra est déjà utilisée par une autre application.";
      } else if (error?.name === "OverconstrainedError") {
        errorMessage = "La caméra ne supporte pas les paramètres demandés.";
      } else if (error?.name === "TypeError") {
        errorMessage = "Erreur de configuration de la caméra.";
      } else if (error?.name === "AbortError") {
        errorMessage = "L'accès à la caméra a été interrompu.";
      } else if (error?.name === "SecurityError") {
        errorMessage = "Accès à la caméra bloqué pour des raisons de sécurité. Vérifiez les permissions du site.";
      }
      
      toast({
        title: "Erreur caméra",
        description: errorMessage,
        variant: "destructive",
      });
    }
  }, [toast]);

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
  }, []);

  const capturePhoto = useCallback(async () => {
    if (!videoRef.current || !currentPosition || !isPageVisible) return;

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

  }, [currentPosition, isPageVisible, uploadMutation]);

  const handleDeleteHistory = () => {
    clearLocalHistory();
    setLocalHistory([]);
    toast({
      title: "Historique supprimé",
      description: "Toutes les images locales ont été supprimées.",
    });
  };

  const defaultCenter: [number, number] = currentPosition 
    ? [currentPosition.lat, currentPosition.lng] 
    : [12.3714, -1.5197];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-6 space-y-6">
        <Card className="border-yellow-500/50 bg-yellow-50 dark:bg-yellow-950/20">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-6 w-6 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-yellow-800 dark:text-yellow-200">
                  Avertissement de sécurité
                </h3>
                <p className="text-sm text-yellow-700 dark:text-yellow-300">
                  Ne pas utiliser en conduisant — laissez le téléphone fixé. 
                  Toutes les images sont anonymisées automatiquement.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" />
                  Carte StreetView
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[400px] rounded-lg overflow-hidden border">
                  {currentPosition && (
                    <MapContainer
                      center={defaultCenter}
                      zoom={14}
                      className="h-full w-full"
                      scrollWheelZoom={true}
                    >
                      <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      />
                      <MapCenterUpdater center={defaultCenter} />
                      
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
                                alt="StreetView"
                                className="w-full h-32 object-cover rounded cursor-pointer"
                                onClick={() => setSelectedImage(point.imageData)}
                              />
                              <p className="text-xs text-muted-foreground mt-2">
                                {new Date(point.capturedAt).toLocaleString("fr-FR")}
                              </p>
                              <Button
                                size="sm"
                                variant="outline"
                                className="w-full mt-2"
                                onClick={() => setSelectedImage(point.imageData)}
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                Voir en grand
                              </Button>
                            </div>
                          </Popup>
                        </Marker>
                      ))}

                      {currentPosition && (
                        <Marker position={[currentPosition.lat, currentPosition.lng]}>
                          <Popup>Votre position actuelle</Popup>
                        </Marker>
                      )}
                    </MapContainer>
                  )}
                  {!currentPosition && (
                    <div className="h-full flex items-center justify-center bg-muted">
                      <p className="text-muted-foreground">Chargement de la carte...</p>
                    </div>
                  )}
                </div>

                {isLoadingPoints && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Chargement des points...
                  </p>
                )}
                <p className="text-sm text-muted-foreground mt-2">
                  {mapPoints.length} point(s) sur la carte
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2">
                  <Camera className="h-5 w-5 text-primary" />
                  Capture
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="aspect-video bg-black rounded-lg overflow-hidden relative">
                  <video
                    ref={videoRef}
                    className="w-full h-full object-cover"
                    playsInline
                    muted
                  />
                  {!isCapturing && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                      <Camera className="h-12 w-12 text-white/50" />
                    </div>
                  )}
                  {isCapturing && (
                    <Badge className="absolute top-2 right-2 bg-red-500 animate-pulse">
                      REC • {captureCount} photos
                    </Badge>
                  )}
                </div>

                <div className="flex gap-2">
                  {!isCapturing ? (
                    <Button 
                      onClick={startCapture} 
                      className="flex-1 bg-green-600 hover:bg-green-700"
                      disabled={!currentPosition}
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Démarrer
                    </Button>
                  ) : (
                    <Button 
                      onClick={stopCapture} 
                      variant="destructive"
                      className="flex-1"
                    >
                      <Square className="h-4 w-4 mr-2" />
                      Arrêter
                    </Button>
                  )}
                </div>

                <p className="text-xs text-muted-foreground text-center">
                  Mode anonyme activé • Aucune donnée personnelle
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <History className="h-5 w-5 text-primary" />
                    Historique local
                  </CardTitle>
                  <Badge variant="outline">{localHistory.length}/{MAX_HISTORY_ITEMS}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setShowHistory(!showHistory)}
                >
                  <ImageIcon className="h-4 w-4 mr-2" />
                  {showHistory ? "Masquer" : "Afficher"} la galerie
                </Button>

                {showHistory && (
                  <div className="space-y-3">
                    {localHistory.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        Aucune image dans l'historique
                      </p>
                    ) : (
                      <>
                        <div className="grid grid-cols-3 gap-2">
                          {localHistory.map((item) => (
                            <div
                              key={item.id}
                              className="aspect-square rounded-md overflow-hidden cursor-pointer hover:ring-2 hover:ring-primary transition-all"
                              onClick={() => setSelectedImage(item.imageData)}
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
                          variant="destructive"
                          size="sm"
                          className="w-full"
                          onClick={handleDeleteHistory}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Supprimer l'historique
                        </Button>
                      </>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {selectedImage && (
        <div 
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 text-white hover:bg-white/20"
            onClick={() => setSelectedImage(null)}
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