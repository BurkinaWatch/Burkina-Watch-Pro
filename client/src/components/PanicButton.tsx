import { Button } from "@/components/ui/button";
import { AlertTriangle, Loader2, Radio } from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { EmergencyContact } from "@shared/schema";

interface PanicButtonProps {
  className?: string;
}

// Intervalle minimum entre les mises a jour (5 secondes)
const MIN_UPDATE_INTERVAL = 5000;
// Distance minimum pour envoyer une mise a jour (10 metres)
const MIN_DISTANCE_METERS = 10;

function getDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

export default function PanicButton({ className }: PanicButtonProps) {
  const { toast } = useToast();
  const [isActivating, setIsActivating] = useState(false);
  const [isTracking, setIsTracking] = useState(false);
  const [trackingSessionId, setTrackingSessionId] = useState<string | null>(null);
  const [locationCount, setLocationCount] = useState(0);
  const watchIdRef = useRef<number | null>(null);
  const lastUpdateRef = useRef<{ time: number; lat: number; lng: number } | null>(null);

  const { data: contacts } = useQuery<EmergencyContact[]>({
    queryKey: ["/api/emergency-contacts"],
  });

  const updateLocationMutation = useMutation({
    mutationFn: async (position: { latitude: number; longitude: number; accuracy: number }) => {
      const res = await apiRequest("POST", "/api/tracking/location", {
        latitude: position.latitude.toString(),
        longitude: position.longitude.toString(),
        accuracy: position.accuracy?.toString() || "10",
      });
      return res.json();
    },
    onSuccess: () => {
      setLocationCount(prev => prev + 1);
    },
    onError: (error) => {
      console.error("Erreur mise a jour position:", error);
    },
  });

  const stopTrackingMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/tracking/stop", {});
      return res.json();
    },
    onSuccess: () => {
      setIsTracking(false);
      setTrackingSessionId(null);
      setLocationCount(0);
      
      toast({
        title: "Suivi arrete",
        description: "Vos contacts ont ete informes de votre position finale.",
      });
    },
    onError: (error) => {
      console.error("Erreur arret tracking:", error);
    },
  });

  const panicMutation = useMutation({
    mutationFn: async () => {
      if (!navigator.geolocation) {
        throw new Error("La geolocalisation n'est pas supportee par votre navigateur");
      }

      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            console.log("Position obtenue:", pos.coords);
            resolve(pos);
          },
          (error) => {
            console.error("Erreur geolocalisation:", error);
            let errorMsg = "Impossible d'obtenir votre position";
            switch(error.code) {
              case error.PERMISSION_DENIED:
                errorMsg = "Acces a la localisation refuse. Autorisez l'acces dans les parametres.";
                break;
              case error.POSITION_UNAVAILABLE:
                errorMsg = "Position non disponible. Activez le GPS.";
                break;
              case error.TIMEOUT:
                errorMsg = "Demande de localisation expiree. Reessayez.";
                break;
            }
            reject(new Error(errorMsg));
          },
          {
            enableHighAccuracy: true,
            timeout: 30000,
            maximumAge: 5000
          }
        );
      });

      const res = await apiRequest("POST", "/api/panic-alert", {
        latitude: position.coords.latitude.toString(),
        longitude: position.coords.longitude.toString(),
      });
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/panic-alerts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread-count"] });
      
      // Ouvrir les URLs WhatsApp
      if (data.whatsappUrls && data.whatsappUrls.length > 0) {
        data.whatsappUrls.forEach((url: string, index: number) => {
          setTimeout(() => {
            window.open(url, '_blank');
          }, index * 500);
        });
      }
      
      // Demarrer le suivi continu
      setTrackingSessionId(data.trackingSessionId);
      setIsTracking(true);
      setLocationCount(1);
      startContinuousTracking();
      
      toast({
        title: "Alerte envoyee avec suivi en direct",
        description: `Vos contacts peuvent suivre votre position en temps reel.`,
        variant: "destructive",
      });
      setIsActivating(false);
    },
    onError: (error: any) => {
      console.error("Erreur alerte panique:", error);
      const errorMessage = error?.message || "Impossible d'envoyer l'alerte panique.";
      toast({
        title: "Erreur",
        description: errorMessage,
        variant: "destructive",
        duration: 8000,
      });
      setIsActivating(false);
    },
  });

  const startContinuousTracking = useCallback(() => {
    if (!navigator.geolocation) return;

    // Utiliser watchPosition pour un suivi continu avec throttling
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const now = Date.now();
        const last = lastUpdateRef.current;
        
        // Throttling: verifier le temps et la distance depuis la derniere mise a jour
        if (last) {
          const timeSinceLastUpdate = now - last.time;
          const distance = getDistanceMeters(
            last.lat, last.lng,
            position.coords.latitude, position.coords.longitude
          );
          
          // Ignorer si moins de 5 secondes ET moins de 10 metres de deplacement
          if (timeSinceLastUpdate < MIN_UPDATE_INTERVAL && distance < MIN_DISTANCE_METERS) {
            return;
          }
        }
        
        // Mettre a jour la reference
        lastUpdateRef.current = {
          time: now,
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };

        updateLocationMutation.mutate({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
      },
      (error) => {
        console.error("Erreur watchPosition:", error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 3000,
      }
    );

    watchIdRef.current = watchId;
  }, [updateLocationMutation]);

  const stopTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    stopTrackingMutation.mutate();
  }, [stopTrackingMutation]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  const handlePress = () => {
    if (isTracking) {
      stopTracking();
      return;
    }

    if (!contacts || contacts.length === 0) {
      toast({
        title: "Aucun contact d'urgence",
        description: "Configurez vos contacts dans les parametres de votre profil",
        variant: "destructive",
      });
      return;
    }

    if (!navigator.geolocation) {
      toast({
        title: "Geolocalisation non disponible",
        description: "Votre appareil ne supporte pas la geolocalisation",
        variant: "destructive",
      });
      return;
    }

    setIsActivating(true);
    panicMutation.mutate();
  };

  if (isTracking) {
    return (
      <Button
        size="lg"
        variant="destructive"
        className={`${className} bg-red-700 font-bold shadow-2xl animate-pulse`}
        onClick={handlePress}
        data-testid="button-panic-stop"
      >
        <div className="flex flex-col items-center justify-center">
          <div className="relative">
            <Radio className="w-7 h-7 md:w-8 md:h-8 animate-ping absolute opacity-75" />
            <Radio className="w-7 h-7 md:w-8 md:h-8 relative" />
          </div>
          <span className="text-xs font-bold mt-1">STOP ({locationCount})</span>
        </div>
      </Button>
    );
  }

  return (
    <Button
      size="lg"
      variant="destructive"
      className={`${className} bg-red-600 hover:bg-red-700 font-bold shadow-2xl`}
      onClick={handlePress}
      disabled={isActivating}
      data-testid="button-panic"
    >
      {isActivating ? (
        <div className="flex flex-col items-center justify-center">
          <Loader2 className="w-7 h-7 md:w-8 md:h-8 animate-spin" />
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center">
          <AlertTriangle className="w-7 h-7 md:w-8 md:h-8" />
          <span className="text-xs font-bold mt-1">PANIQUE</span>
        </div>
      )}
    </Button>
  );
}
