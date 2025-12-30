import { useState, useEffect, useRef, useCallback } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { 
  Camera, 
  MapPin, 
  Plus,
  Eye,
  ArrowLeft,
  ArrowRight,
  X,
  Upload,
  Image as ImageIcon,
  Globe,
  Loader2,
  Play,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  RotateCcw,
  Video,
  Square,
  Circle,
  Timer,
  AlertTriangle,
  Shield,
  Users,
  Info,
  Navigation
} from "lucide-react";
import { useLocation } from "wouter";
import "leaflet/dist/leaflet.css";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

const tourIcon = new L.Icon({
  iconUrl: "data:image/svg+xml," + encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32">
      <circle cx="16" cy="16" r="14" fill="#16a34a" stroke="#fff" stroke-width="2"/>
      <circle cx="16" cy="16" r="6" fill="white"/>
      <circle cx="16" cy="16" r="3" fill="#16a34a"/>
    </svg>
  `),
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

interface VirtualTour {
  id: string;
  name: string;
  description: string | null;
  quartier: string | null;
  latitude: string;
  longitude: string;
  photoCount: number;
  viewCount: number;
  createdAt: string;
}

interface TourPhoto {
  id: string;
  tourId: string;
  latitude: string;
  longitude: string;
  imageData: string;
  thumbnailData: string | null;
  orderIndex: number;
  capturedAt: string;
}

interface VirtualTourWithPhotos extends VirtualTour {
  photos: TourPhoto[];
}

function MapCenterUpdater({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
}

function TourViewer({ 
  tour, 
  onClose 
}: { 
  tour: VirtualTourWithPhotos; 
  onClose: () => void;
}) {
  const { toast } = useToast();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const photos = tour.photos.sort((a, b) => a.orderIndex - b.orderIndex);
  
  const handleReport = async () => {
    try {
      await apiRequest("POST", `/api/virtual-tours/${tour.id}/report`);
      toast({
        title: "Signalement enregistre",
        description: "Merci pour votre vigilance. Nous allons verifier ce contenu.",
      });
      setShowReportDialog(false);
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible d'enregistrer le signalement. Reessayez plus tard.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (isPlaying && photos.length > 1) {
      intervalRef.current = setInterval(() => {
        setCurrentIndex(prev => (prev + 1) % photos.length);
      }, 3000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPlaying, photos.length]);

  const goNext = () => setCurrentIndex(prev => (prev + 1) % photos.length);
  const goPrev = () => setCurrentIndex(prev => (prev - 1 + photos.length) % photos.length);
  const togglePlay = () => setIsPlaying(!isPlaying);

  if (photos.length === 0) {
    return (
      <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center">
        <div className="text-center text-white">
          <ImageIcon className="h-16 w-16 mx-auto mb-4 opacity-50" />
          <p>Aucune photo dans ce tour</p>
          <Button variant="outline" className="mt-4" onClick={onClose}>
            Fermer
          </Button>
        </div>
      </div>
    );
  }

  const currentPhoto = photos[currentIndex];

  return (
    <div className={`fixed inset-0 z-50 bg-black flex flex-col ${isFullscreen ? '' : 'p-4 md:p-8'}`}>
      {/* Citizen disclaimer banner */}
      <div className="bg-amber-500/90 text-black px-4 py-2 flex items-center justify-center gap-2 text-sm">
        <Users className="h-4 w-4" />
        <span>Vue citoyenne - Cette vue a ete creee par des citoyens et peut ne pas refleter l'etat actuel</span>
      </div>
      
      <div className="flex items-center justify-between p-4 text-white">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onClose} className="text-white">
            <X className="h-5 w-5" />
          </Button>
          <div>
            <h2 className="font-semibold">{tour.name}</h2>
            <div className="flex items-center gap-2">
              <p className="text-sm text-white/70">{tour.quartier || "Ouagadougou"}</p>
              <Badge variant="outline" className="text-xs bg-primary/20 border-primary text-primary-foreground">
                <Shield className="h-3 w-3 mr-1" />
                Vue citoyenne
              </Badge>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="bg-white/20">
            {currentIndex + 1} / {photos.length}
          </Badge>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setShowReportDialog(true)}
            className="text-white"
            title="Signaler un probleme"
            data-testid="button-report-tour"
          >
            <AlertTriangle className="h-5 w-5" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="text-white"
          >
            <Maximize2 className="h-5 w-5" />
          </Button>
        </div>
      </div>
      
      {/* Report dialog */}
      {showReportDialog && (
        <div className="absolute inset-0 z-60 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-card rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Signaler un probleme
            </h3>
            <p className="text-muted-foreground text-sm mb-4">
              Si ce contenu est inapproprie, obsolete ou contient des informations personnelles visibles, 
              vous pouvez le signaler. Notre equipe verifiera et prendra les mesures necessaires.
            </p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowReportDialog(false)} className="flex-1">
                Annuler
              </Button>
              <Button variant="destructive" onClick={handleReport} className="flex-1 gap-2">
                <AlertTriangle className="h-4 w-4" />
                Signaler
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 relative flex items-center justify-center overflow-hidden">
        <img
          src={currentPhoto.imageData}
          alt={`Photo ${currentIndex + 1}`}
          className="max-h-full max-w-full object-contain"
          data-testid={`img-tour-photo-${currentIndex}`}
        />
        
        {photos.length > 1 && (
          <>
            <Button
              variant="ghost"
              size="icon"
              onClick={goPrev}
              className="absolute left-4 text-white bg-black/50 hover:bg-black/70"
              data-testid="button-prev-photo"
            >
              <ChevronLeft className="h-8 w-8" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={goNext}
              className="absolute right-4 text-white bg-black/50 hover:bg-black/70"
              data-testid="button-next-photo"
            >
              <ChevronRight className="h-8 w-8" />
            </Button>
          </>
        )}
      </div>

      {photos.length > 1 && (
        <div className="p-4">
          <div className="flex items-center justify-center gap-4 mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={togglePlay}
              className="gap-2"
              data-testid="button-toggle-play"
            >
              {isPlaying ? (
                <>
                  <RotateCcw className="h-4 w-4" />
                  Pause
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" />
                  Lecture auto
                </>
              )}
            </Button>
          </div>
          
          <div className="flex gap-2 overflow-x-auto pb-2 justify-center">
            {photos.map((photo, idx) => (
              <button
                key={photo.id}
                onClick={() => {
                  setCurrentIndex(idx);
                  setIsPlaying(false);
                }}
                className={`flex-shrink-0 w-16 h-16 rounded-md overflow-hidden border-2 transition-all ${
                  idx === currentIndex ? 'border-primary ring-2 ring-primary' : 'border-transparent opacity-60 hover:opacity-100'
                }`}
                data-testid={`button-thumbnail-${idx}`}
              >
                <img
                  src={photo.thumbnailData || photo.imageData}
                  alt={`Thumbnail ${idx + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const MIN_PHOTOS_REQUIRED = 5;

interface CapturedPhoto {
  data: string;
  thumbnail: string;
  latitude?: number;
  longitude?: number;
  capturedAt: Date;
}

function RotationGuide({ photoCount, minRequired }: { photoCount: number; minRequired: number }) {
  const progress = Math.min((photoCount / minRequired) * 100, 100);
  const segments = 8;
  const filledSegments = Math.floor((photoCount / minRequired) * segments);
  
  return (
    <div className="absolute top-20 left-1/2 -translate-x-1/2 bg-black/70 rounded-lg p-3 text-white text-center">
      <div className="flex items-center justify-center gap-2 mb-2">
        <RotateCcw className="h-5 w-5 animate-spin" style={{ animationDuration: '3s' }} />
        <span className="text-sm font-medium">Tournez lentement sur 360</span>
      </div>
      <div className="flex gap-1 justify-center mb-2">
        {Array.from({ length: segments }).map((_, i) => (
          <div
            key={i}
            className={`w-6 h-2 rounded-full transition-colors ${
              i < filledSegments ? 'bg-primary' : 'bg-white/30'
            }`}
          />
        ))}
      </div>
      <p className="text-xs text-white/70">
        {photoCount < minRequired 
          ? `${photoCount}/${minRequired} photos (min. ${minRequired} requises)`
          : `${photoCount} photos capturees`
        }
      </p>
      {progress >= 100 && (
        <Badge className="mt-2 bg-primary">Pret a publier</Badge>
      )}
    </div>
  );
}

function CameraCapture({
  onPhotosCapture,
  onClose,
  maxPhotos,
  currentPhotoCount,
}: {
  onPhotosCapture: (photos: CapturedPhoto[]) => void;
  onClose: () => void;
  maxPhotos: number;
  currentPhotoCount: number;
}) {
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const [isStreaming, setIsStreaming] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [capturedPhotos, setCapturedPhotos] = useState<CapturedPhoto[]>([]);
  const [countdown, setCountdown] = useState(3);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [geoLocation, setGeoLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [geoError, setGeoError] = useState<string | null>(null);

  const remainingSlots = maxPhotos - currentPhotoCount - capturedPhotos.length;
  const hasMinPhotos = capturedPhotos.length >= MIN_PHOTOS_REQUIRED;

  const requestGeolocation = (): Promise<{ lat: number; lng: number }> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocalisation non supportee"));
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          reject(error);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    });
  };

  const startCamera = async () => {
    try {
      setCameraError(null);
      setGeoError(null);
      
      // Request geolocation first
      try {
        const location = await requestGeolocation();
        setGeoLocation(location);
      } catch (geoErr) {
        console.error("Geolocation error:", geoErr);
        setGeoError("La geolocalisation est requise pour creer un tour. Activez-la dans les parametres.");
        toast({
          title: "Geolocalisation requise",
          description: "Activez la geolocalisation pour capturer des photos geolocalisees.",
          variant: "destructive",
        });
        return;
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setIsStreaming(true);
    } catch (err) {
      console.error("Camera error:", err);
      setCameraError("Impossible d'acceder a la camera. Verifiez les permissions.");
      toast({
        title: "Erreur camera",
        description: "Impossible d'acceder a la camera. Verifiez les permissions dans votre navigateur.",
        variant: "destructive",
      });
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsStreaming(false);
    setIsRecording(false);
  };

  const createThumbnail = (imageData: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const maxWidth = 150;
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
      img.src = imageData;
    });
  };

  const capturePhoto = async () => {
    if (!videoRef.current || !canvasRef.current || remainingSlots <= 0) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(video, 0, 0);
      const imageData = canvas.toDataURL("image/jpeg", 0.8);
      const thumbnail = await createThumbnail(imageData);
      
      // Get current geolocation for this photo
      let currentLat = geoLocation?.lat;
      let currentLng = geoLocation?.lng;
      try {
        const location = await requestGeolocation();
        currentLat = location.lat;
        currentLng = location.lng;
        setGeoLocation(location);
      } catch (e) {
        // Use last known location
      }
      
      const newPhoto: CapturedPhoto = {
        data: imageData,
        thumbnail,
        latitude: currentLat,
        longitude: currentLng,
        capturedAt: new Date(),
      };
      
      setCapturedPhotos(prev => {
        if (prev.length >= remainingSlots) return prev;
        return [...prev, newPhoto];
      });
    }
  };

  const startAutoCapture = () => {
    if (remainingSlots <= 0) {
      toast({ title: "Limite atteinte", description: `Maximum ${maxPhotos} photos`, variant: "destructive" });
      return;
    }
    
    setIsRecording(true);
    setCountdown(3);
    
    let count = 3;
    const countdownInterval = setInterval(() => {
      count--;
      setCountdown(count);
      if (count <= 0) {
        clearInterval(countdownInterval);
        capturePhoto();
        
        intervalRef.current = setInterval(() => {
          setCapturedPhotos(prev => {
            if (prev.length >= remainingSlots) {
              if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
              }
              setIsRecording(false);
              return prev;
            }
            return prev;
          });
          capturePhoto();
        }, 3000);
      }
    }, 1000);
  };

  const stopAutoCapture = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsRecording(false);
  };

  const handleDone = () => {
    stopCamera();
    onPhotosCapture(capturedPhotos);
    onClose();
  };

  const removePhoto = (index: number) => {
    setCapturedPhotos(prev => prev.filter((_, i) => i !== index));
  };

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  return (
    <div className="fixed inset-0 bg-black flex flex-col" style={{ zIndex: 99999 }}>
      <div className="flex items-center justify-between p-4 bg-black/80">
        <Button variant="ghost" size="sm" onClick={() => { stopCamera(); onClose(); }} className="text-white gap-2">
          <X className="h-4 w-4" />
          Fermer
        </Button>
        <div className="flex items-center gap-2 text-white">
          <Camera className="h-5 w-5" />
          <span className="font-semibold">Capture 3D</span>
        </div>
        <Badge variant="secondary" className="text-sm">
          {capturedPhotos.length}/{remainingSlots + capturedPhotos.length}
        </Badge>
      </div>

      <div className="flex-1 relative">
        {geoError ? (
          <div className="absolute inset-0 flex items-center justify-center text-white text-center p-4">
            <div>
              <MapPin className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg mb-4">{geoError}</p>
              <Button onClick={startCamera} variant="outline">
                Reessayer
              </Button>
            </div>
          </div>
        ) : cameraError ? (
          <div className="absolute inset-0 flex items-center justify-center text-white text-center p-4">
            <div className="max-w-md">
              <Camera className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg mb-2">{cameraError}</p>
              {window.self !== window.top && (
                <p className="text-sm text-white/70 mb-4">
                  L'acces camera est bloque dans l'apercu integre. Ouvrez l'application dans un nouvel onglet.
                </p>
              )}
              <div className="flex flex-col gap-2 items-center">
                <Button onClick={startCamera} variant="outline">
                  Reessayer
                </Button>
                {window.self !== window.top && (
                  <Button 
                    onClick={() => window.open(window.location.href, '_blank')}
                    variant="default"
                    className="gap-2"
                  >
                    <Globe className="h-4 w-4" />
                    Ouvrir dans un nouvel onglet
                  </Button>
                )}
              </div>
            </div>
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            <canvas ref={canvasRef} className="hidden" />
            
            {/* Rotation guide overlay */}
            {isStreaming && !isRecording && (
              <RotationGuide photoCount={capturedPhotos.length} minRequired={MIN_PHOTOS_REQUIRED} />
            )}
            
            {isRecording && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-red-500 text-white px-4 py-2 rounded-full flex items-center gap-2 animate-pulse">
                <Circle className="h-3 w-3 fill-current" />
                {countdown > 0 ? `Demarrage dans ${countdown}s` : "Capture toutes les 3s"}
              </div>
            )}

            {isRecording && countdown <= 0 && (
              <RotationGuide photoCount={capturedPhotos.length} minRequired={MIN_PHOTOS_REQUIRED} />
            )}
          </>
        )}
      </div>

      <div className="p-4 bg-black/80 space-y-4">
        {capturedPhotos.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-2">
            {capturedPhotos.map((photo, idx) => (
              <div key={idx} className="relative flex-shrink-0">
                <img
                  src={photo.thumbnail}
                  alt={`Capture ${idx + 1}`}
                  className="w-16 h-16 rounded-md object-cover"
                />
                <button
                  onClick={() => removePhoto(idx)}
                  className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center"
                >
                  <X className="h-3 w-3 text-white" />
                </button>
                <Badge className="absolute bottom-0 left-0 text-xs">{idx + 1}</Badge>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center justify-center gap-4">
          {isStreaming && !isRecording && (
            <>
              <Button
                size="lg"
                variant="outline"
                onClick={capturePhoto}
                disabled={remainingSlots <= 0}
                className="gap-2"
              >
                <Camera className="h-5 w-5" />
                Photo manuelle
              </Button>
              <Button
                size="lg"
                onClick={startAutoCapture}
                disabled={remainingSlots <= 0}
                className="gap-2 bg-red-500 hover:bg-red-600"
              >
                <Video className="h-5 w-5" />
                Capture auto (3s)
              </Button>
            </>
          )}
          
          {isRecording && (
            <Button
              size="lg"
              variant="destructive"
              onClick={stopAutoCapture}
              className="gap-2"
            >
              <Square className="h-5 w-5" />
              Arreter
            </Button>
          )}
        </div>

        {capturedPhotos.length > 0 && (
          <div className="space-y-2">
            {!hasMinPhotos && (
              <p className="text-center text-amber-400 text-sm">
                Minimum {MIN_PHOTOS_REQUIRED} photos requises ({MIN_PHOTOS_REQUIRED - capturedPhotos.length} restantes)
              </p>
            )}
            <Button 
              onClick={handleDone} 
              className="w-full gap-2" 
              size="lg"
              disabled={!hasMinPhotos}
              data-testid="button-validate-photos"
            >
              <Plus className="h-5 w-5" />
              {hasMinPhotos 
                ? `Valider ${capturedPhotos.length} photos` 
                : `${capturedPhotos.length}/${MIN_PHOTOS_REQUIRED} photos`
              }
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

interface PhotoWithGPS {
  data: string;
  thumbnail: string;
  latitude?: number;
  longitude?: number;
  capturedAt?: string;
}

function CreateTourDialog({
  open,
  onOpenChange,
  position: initialPosition,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  position: { lat: number; lng: number };
}) {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [quartier, setQuartier] = useState("");
  const [photos, setPhotos] = useState<PhotoWithGPS[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [userPosition, setUserPosition] = useState<{ lat: number; lng: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const MAX_PHOTOS_PER_TOUR = 20;

  useEffect(() => {
    if (open && !userPosition) {
      setIsGettingLocation(true);
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            setUserPosition({
              lat: pos.coords.latitude,
              lng: pos.coords.longitude
            });
            setIsGettingLocation(false);
          },
          (error) => {
            console.error("Erreur GPS:", error);
            toast({
              title: "Position GPS indisponible",
              description: "Utilisation de la position par defaut",
              variant: "destructive"
            });
            setUserPosition(initialPosition);
            setIsGettingLocation(false);
          },
          { enableHighAccuracy: true, timeout: 10000 }
        );
      } else {
        setUserPosition(initialPosition);
        setIsGettingLocation(false);
      }
    }
  }, [open]);

  useEffect(() => {
    if (!open) {
      setUserPosition(null);
    }
  }, [open]);

  const position = userPosition || initialPosition;

  const createTourMutation = useMutation({
    mutationFn: async (data: {
      name: string;
      description: string;
      quartier: string;
      latitude: number;
      longitude: number;
      photos: { imageData: string; thumbnailData: string; latitude?: number; longitude?: number; capturedAt?: string }[];
    }) => {
      return apiRequest("POST", "/api/virtual-tours", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/virtual-tours"] });
      toast({
        title: "Tour virtuel cree",
        description: `${photos.length} photos ajoutees a "${name}"`,
      });
      onOpenChange(false);
      setName("");
      setDescription("");
      setQuartier("");
      setPhotos([]);
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de creer le tour virtuel",
        variant: "destructive",
      });
    },
  });

  const compressImage = (file: File, maxWidth: number = 1200): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const ratio = Math.min(maxWidth / img.width, 1);
          canvas.width = img.width * ratio;
          canvas.height = img.height * ratio;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            resolve(canvas.toDataURL("image/jpeg", 0.8));
          } else {
            resolve(e.target?.result as string);
          }
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  const createThumbnail = (imageData: string, maxWidth: number = 150): Promise<string> => {
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
      img.src = imageData;
    });
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const remainingSlots = MAX_PHOTOS_PER_TOUR - photos.length;
    if (remainingSlots <= 0) {
      toast({ 
        title: "Limite atteinte", 
        description: `Maximum ${MAX_PHOTOS_PER_TOUR} photos par tour`, 
        variant: "destructive" 
      });
      return;
    }

    setIsUploading(true);
    const newPhotos: { data: string; thumbnail: string }[] = [];
    const filesToProcess = Array.from(files).slice(0, remainingSlots);

    for (const file of filesToProcess) {
      if (file.type.startsWith("image/")) {
        const compressed = await compressImage(file);
        const thumbnail = await createThumbnail(compressed);
        newPhotos.push({ data: compressed, thumbnail });
      }
    }

    if (files.length > remainingSlots) {
      toast({ 
        title: "Limite de photos", 
        description: `Seulement ${filesToProcess.length} photos ajoutees (max ${MAX_PHOTOS_PER_TOUR})` 
      });
    }

    setPhotos(prev => [...prev, ...newPhotos]);
    setIsUploading(false);
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    if (!name.trim()) {
      toast({ title: "Erreur", description: "Donnez un nom au tour", variant: "destructive" });
      return;
    }
    if (photos.length < MIN_PHOTOS_REQUIRED) {
      toast({ 
        title: "Photos insuffisantes", 
        description: `Minimum ${MIN_PHOTOS_REQUIRED} photos requises (${photos.length} actuellement)`, 
        variant: "destructive" 
      });
      return;
    }

    createTourMutation.mutate({
      name: name.trim(),
      description: description.trim(),
      quartier: quartier.trim(),
      latitude: position.lat,
      longitude: position.lng,
      photos: photos.map(p => ({ 
        imageData: p.data, 
        thumbnailData: p.thumbnail,
        latitude: p.latitude,
        longitude: p.longitude,
        capturedAt: p.capturedAt
      })),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto z-[9999]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5 text-primary" />
            Creer un tour virtuel
          </DialogTitle>
          <DialogDescription>
            Ajoutez une serie de photos pour creer une visite virtuelle de cet endroit
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="tour-name">Nom du lieu</Label>
              <Input
                id="tour-name"
                placeholder="Ex: Marche Rood Woko"
                value={name}
                onChange={(e) => setName(e.target.value)}
                data-testid="input-tour-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tour-quartier">Quartier</Label>
              <Input
                id="tour-quartier"
                placeholder="Ex: Patte d'Oie"
                value={quartier}
                onChange={(e) => setQuartier(e.target.value)}
                data-testid="input-tour-quartier"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tour-description">Description (optionnel)</Label>
            <Textarea
              id="tour-description"
              placeholder="Decrivez ce lieu..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              data-testid="input-tour-description"
            />
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Navigation className="h-4 w-4 text-primary" />
              Votre position GPS actuelle
            </Label>
            {isGettingLocation ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Localisation en cours...</span>
              </div>
            ) : (
              <div className="flex flex-wrap gap-4 text-sm p-2 bg-primary/10 rounded-md">
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3 text-primary" />
                  Lat: <strong>{position.lat.toFixed(6)}</strong>
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3 text-primary" />
                  Lng: <strong>{position.lng.toFixed(6)}</strong>
                </span>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>Photos ({photos.length}/{MAX_PHOTOS_PER_TOUR})</Label>
            <div className="border-2 border-dashed rounded-lg p-6 text-center">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileSelect}
                className="hidden"
                data-testid="input-photos"
              />
              <div className="flex flex-col sm:flex-row gap-2 justify-center">
                <Button
                  variant="default"
                  onClick={() => setShowCamera(true)}
                  disabled={isUploading || photos.length >= MAX_PHOTOS_PER_TOUR}
                  className="gap-2"
                  data-testid="button-capture-photo"
                >
                  <Video className="h-4 w-4" />
                  Capture 3D (auto)
                </Button>
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading || photos.length >= MAX_PHOTOS_PER_TOUR}
                  className="gap-2"
                  data-testid="button-add-photos"
                >
                  <Upload className="h-4 w-4" />
                  Galerie
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Capture 3D prend des photos toutes les 3 secondes pour creer une vue immersive
              </p>
            </div>

            {photos.length > 0 && (
              <div className="grid grid-cols-4 gap-2 mt-3">
                {photos.map((photo, idx) => (
                  <div key={idx} className="relative group">
                    <img
                      src={photo.thumbnail}
                      alt={`Photo ${idx + 1}`}
                      className="w-full aspect-square object-cover rounded-md"
                    />
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => removePhoto(idx)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                    <Badge className="absolute bottom-1 left-1 text-xs">
                      {idx + 1}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {photos.length < MIN_PHOTOS_REQUIRED && photos.length > 0 && (
            <p className="text-sm text-amber-500 flex items-center gap-1 mr-auto">
              <Info className="h-4 w-4" />
              Minimum {MIN_PHOTOS_REQUIRED} photos ({MIN_PHOTOS_REQUIRED - photos.length} restantes)
            </p>
          )}
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={createTourMutation.isPending || photos.length < MIN_PHOTOS_REQUIRED}
              className="gap-2"
              data-testid="button-create-tour"
            >
              {createTourMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              {photos.length >= MIN_PHOTOS_REQUIRED
                ? `Creer le tour (${photos.length} photos)`
                : `${photos.length}/${MIN_PHOTOS_REQUIRED} photos`
              }
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>

      {showCamera && (
        <CameraCapture
          onPhotosCapture={(newPhotos) => {
            const photosWithGPS: PhotoWithGPS[] = newPhotos.map(p => ({
              data: p.data,
              thumbnail: p.thumbnail,
              latitude: p.latitude,
              longitude: p.longitude,
              capturedAt: p.capturedAt instanceof Date ? p.capturedAt.toISOString() : p.capturedAt
            }));
            setPhotos(prev => [...prev, ...photosWithGPS].slice(0, MAX_PHOTOS_PER_TOUR));
          }}
          onClose={() => setShowCamera(false)}
          maxPhotos={MAX_PHOTOS_PER_TOUR}
          currentPhotoCount={photos.length}
        />
      )}
    </Dialog>
  );
}

export default function StreetView() {
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const [mapCenter, setMapCenter] = useState<[number, number]>([12.3657, -1.5228]);
  const [selectedPosition, setSelectedPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [viewingTour, setViewingTour] = useState<VirtualTourWithPhotos | null>(null);
  const [selectedTourId, setSelectedTourId] = useState<string | null>(null);

  const { data: tours = [], isLoading } = useQuery<VirtualTour[]>({
    queryKey: ["/api/virtual-tours"],
    refetchInterval: 30000,
  });

  const { data: tourWithPhotos, isLoading: loadingTourPhotos } = useQuery<VirtualTourWithPhotos>({
    queryKey: ["/api/virtual-tours", selectedTourId],
    enabled: !!selectedTourId,
  });

  useEffect(() => {
    if (tourWithPhotos && selectedTourId) {
      setViewingTour(tourWithPhotos);
      setSelectedTourId(null);
    }
  }, [tourWithPhotos, selectedTourId]);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setMapCenter([pos.coords.latitude, pos.coords.longitude]);
        },
        () => {}
      );
    }
  }, []);

  const handleMapClick = useCallback((e: L.LeafletMouseEvent) => {
    setSelectedPosition({ lat: e.latlng.lat, lng: e.latlng.lng });
    setShowCreateDialog(true);
  }, []);

  const handleViewTour = (tour: VirtualTour) => {
    setSelectedTourId(tour.id);
  };

  const publishedTours = tours.filter(t => t.photoCount > 0);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center justify-between gap-4 px-4">
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
            StreetView Ouaga
          </h1>
          <div className="w-20"></div>
        </div>
      </header>

      {viewingTour && (
        <TourViewer tour={viewingTour} onClose={() => setViewingTour(null)} />
      )}

      <div className="container mx-auto px-4 py-6 space-y-6">
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <Camera className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-semibold text-primary">Contribuez a StreetView Ouaga</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Prenez plusieurs photos d'un lieu pour creer une visite interactive 360°
                  que tous les utilisateurs pourront explorer.
                </p>
              </div>
              <Button 
                onClick={() => {
                  setSelectedPosition({ lat: mapCenter[0], lng: mapCenter[1] });
                  setShowCreateDialog(true);
                }}
                className="gap-2 flex-shrink-0"
                data-testid="button-start-capture"
              >
                <Camera className="h-4 w-4" />
                Nouvelle capture
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Carte des tours virtuels
                  </div>
                  <Badge variant="secondary">{publishedTours.length} tours</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[500px] rounded-lg overflow-hidden">
                  <MapWithClick 
                    center={mapCenter} 
                    tours={publishedTours}
                    onMapClick={handleMapClick}
                    onTourClick={handleViewTour}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  Cliquez sur un marqueur vert pour voir le tour, ou cliquez ailleurs pour en creer un nouveau
                </p>
              </CardContent>
            </Card>
          </div>

          <div>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Eye className="h-5 w-5" />
                  Tours recents
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : publishedTours.length > 0 ? (
                  <div className="space-y-3">
                    {publishedTours.slice(0, 8).map((tour) => (
                      <div
                        key={tour.id}
                        className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover-elevate cursor-pointer"
                        onClick={() => handleViewTour(tour)}
                        data-testid={`card-tour-${tour.id}`}
                      >
                        <div className="w-12 h-12 rounded-md bg-primary/20 flex items-center justify-center flex-shrink-0">
                          <Camera className="h-6 w-6 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{tour.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {tour.quartier || "Ouagadougou"} - {tour.photoCount} photos
                          </p>
                        </div>
                        <Button variant="ghost" size="icon">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Globe className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground">Aucun tour virtuel pour le moment</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Soyez le premier a contribuer!
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="mt-4">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Comment ca marche?</CardTitle>
              </CardHeader>
              <CardContent>
                <ol className="space-y-3 text-sm">
                  <li className="flex gap-3">
                    <Badge className="h-6 w-6 rounded-full flex-shrink-0">1</Badge>
                    <span>Cliquez sur la carte pour choisir un emplacement</span>
                  </li>
                  <li className="flex gap-3">
                    <Badge className="h-6 w-6 rounded-full flex-shrink-0">2</Badge>
                    <span>Ajoutez plusieurs photos du lieu (angles differents)</span>
                  </li>
                  <li className="flex gap-3">
                    <Badge className="h-6 w-6 rounded-full flex-shrink-0">3</Badge>
                    <span>Votre tour est publie et visible par tous</span>
                  </li>
                </ol>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {selectedPosition && (
        <CreateTourDialog
          open={showCreateDialog}
          onOpenChange={setShowCreateDialog}
          position={selectedPosition}
        />
      )}

      {loadingTourPhotos && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center">
          <div className="text-center text-white">
            <Loader2 className="h-10 w-10 animate-spin mx-auto mb-3" />
            <p>Chargement du tour...</p>
          </div>
        </div>
      )}
    </div>
  );
}

function MapWithClick({
  center,
  tours,
  onMapClick,
  onTourClick,
}: {
  center: [number, number];
  tours: VirtualTour[];
  onMapClick: (e: L.LeafletMouseEvent) => void;
  onTourClick: (tour: VirtualTour) => void;
}) {
  return (
    <MapContainer
      center={center}
      zoom={13}
      className="h-full w-full"
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      />
      <MapCenterUpdater center={center} />
      <MapClickHandler onClick={onMapClick} />
      
      {tours.map((tour) => (
        <Marker
          key={tour.id}
          position={[parseFloat(tour.latitude), parseFloat(tour.longitude)]}
          icon={tourIcon}
          eventHandlers={{
            click: (e) => {
              e.originalEvent.stopPropagation();
              onTourClick(tour);
            }
          }}
        >
          <Popup>
            <div className="text-sm">
              <p className="font-semibold">{tour.name}</p>
              <p className="text-muted-foreground">{tour.photoCount} photos</p>
              <Button 
                size="sm" 
                className="w-full mt-2 gap-1"
                onClick={() => onTourClick(tour)}
              >
                <Eye className="h-3 w-3" />
                Voir le tour
              </Button>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}

function MapClickHandler({ onClick }: { onClick: (e: L.LeafletMouseEvent) => void }) {
  const map = useMap();
  
  useEffect(() => {
    map.on("click", onClick);
    return () => {
      map.off("click", onClick);
    };
  }, [map, onClick]);

  return null;
}
