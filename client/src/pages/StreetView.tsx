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
  Timer
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
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const photos = tour.photos.sort((a, b) => a.orderIndex - b.orderIndex);

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
      <div className="flex items-center justify-between p-4 text-white">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onClose} className="text-white">
            <X className="h-5 w-5" />
          </Button>
          <div>
            <h2 className="font-semibold">{tour.name}</h2>
            <p className="text-sm text-white/70">{tour.quartier || "Ouagadougou"}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="bg-white/20">
            {currentIndex + 1} / {photos.length}
          </Badge>
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

function CameraCapture({
  onPhotosCapture,
  onClose,
  maxPhotos,
  currentPhotoCount,
}: {
  onPhotosCapture: (photos: { data: string; thumbnail: string }[]) => void;
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
  const [capturedPhotos, setCapturedPhotos] = useState<{ data: string; thumbnail: string }[]>([]);
  const [countdown, setCountdown] = useState(3);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const remainingSlots = maxPhotos - currentPhotoCount - capturedPhotos.length;

  const startCamera = async () => {
    try {
      setCameraError(null);
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
      
      setCapturedPhotos(prev => {
        if (prev.length >= remainingSlots) return prev;
        return [...prev, { data: imageData, thumbnail }];
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
    <div className="fixed inset-0 z-[9999] bg-black flex flex-col">
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
        {cameraError ? (
          <div className="absolute inset-0 flex items-center justify-center text-white text-center p-4">
            <div>
              <Camera className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg mb-4">{cameraError}</p>
              <Button onClick={startCamera} variant="outline">
                Reessayer
              </Button>
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
            
            {isRecording && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-red-500 text-white px-4 py-2 rounded-full flex items-center gap-2 animate-pulse">
                <Circle className="h-3 w-3 fill-current" />
                {countdown > 0 ? `Demarrage dans ${countdown}s` : "Capture toutes les 3s"}
              </div>
            )}

            {isRecording && countdown <= 0 && (
              <div className="absolute top-16 left-1/2 -translate-x-1/2 bg-black/60 text-white px-3 py-1 rounded-full flex items-center gap-2">
                <Timer className="h-4 w-4" />
                Prochaine photo dans 3s
              </div>
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
          <Button onClick={handleDone} className="w-full gap-2" size="lg">
            <Plus className="h-5 w-5" />
            Utiliser {capturedPhotos.length} photos
          </Button>
        )}
      </div>
    </div>
  );
}

function CreateTourDialog({
  open,
  onOpenChange,
  position,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  position: { lat: number; lng: number };
}) {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [quartier, setQuartier] = useState("");
  const [photos, setPhotos] = useState<{ data: string; thumbnail: string }[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const MAX_PHOTOS_PER_TOUR = 20;

  const createTourMutation = useMutation({
    mutationFn: async (data: {
      name: string;
      description: string;
      quartier: string;
      latitude: number;
      longitude: number;
      photos: { imageData: string; thumbnailData: string }[];
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
    if (photos.length === 0) {
      toast({ title: "Erreur", description: "Ajoutez au moins une photo", variant: "destructive" });
      return;
    }

    createTourMutation.mutate({
      name: name.trim(),
      description: description.trim(),
      quartier: quartier.trim(),
      latitude: position.lat,
      longitude: position.lng,
      photos: photos.map(p => ({ imageData: p.data, thumbnailData: p.thumbnail })),
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
            <Label>Position GPS</Label>
            <div className="flex gap-4 text-sm text-muted-foreground">
              <span>Lat: {position.lat.toFixed(6)}</span>
              <span>Lng: {position.lng.toFixed(6)}</span>
            </div>
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

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={createTourMutation.isPending || photos.length === 0}
            className="gap-2"
            data-testid="button-create-tour"
          >
            {createTourMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            Creer le tour ({photos.length} photos)
          </Button>
        </DialogFooter>
      </DialogContent>

      {showCamera && (
        <CameraCapture
          onPhotosCapture={(newPhotos) => {
            setPhotos(prev => [...prev, ...newPhotos].slice(0, MAX_PHOTOS_PER_TOUR));
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
              <div>
                <h4 className="font-semibold text-primary">Contribuez a StreetView Ouaga</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Cliquez sur la carte pour ajouter un tour virtuel. Prenez plusieurs photos d'un lieu
                  pour creer une visite interactive que tous les utilisateurs pourront explorer.
                </p>
              </div>
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
