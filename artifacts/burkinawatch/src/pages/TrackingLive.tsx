
import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { MapPin, StopCircle, Loader2, Share2, ArrowLeft, RefreshCw } from "lucide-react";
import type { TrackingSession, EmergencyContact } from "@shared/schema";

export default function TrackingLive() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isTracking, setIsTracking] = useState(false);
  const [currentPosition, setCurrentPosition] = useState<{ lat: number; lng: number } | null>(null);

  const { data: activeSession } = useQuery<TrackingSession>({
    queryKey: ["/api/tracking/session"],
    retry: false,
  });

  const { data: contacts } = useQuery<EmergencyContact[]>({
    queryKey: ["/api/emergency-contacts"],
  });

  const startTrackingMutation = useMutation({
    mutationFn: async () => {
      if (!navigator.geolocation) {
        throw new Error("La géolocalisation n'est pas supportée par votre navigateur");
      }

      await new Promise<GeolocationPosition>((resolve, reject) => {
        const timeoutId = setTimeout(() => {
          reject(new Error("La demande de localisation a pris trop de temps. Réessayez."));
        }, 15000);

        navigator.geolocation.getCurrentPosition(
          (position) => {
            clearTimeout(timeoutId);
            resolve(position);
          },
          (error) => {
            clearTimeout(timeoutId);
            let errorMsg = "Impossible d'obtenir votre position";
            switch(error.code) {
              case error.PERMISSION_DENIED:
                errorMsg = "Vous devez autoriser l'accès à votre localisation dans les paramètres de votre navigateur";
                break;
              case error.POSITION_UNAVAILABLE:
                errorMsg = "Position non disponible. Assurez-vous que le GPS est activé";
                break;
              case error.TIMEOUT:
                errorMsg = "La demande de localisation a expiré. Réessayez";
                break;
            }
            reject(new Error(errorMsg));
          },
          {
            enableHighAccuracy: true,
            timeout: 12000,
            maximumAge: 5000,
          }
        );
      });

      const res = await apiRequest("POST", "/api/tracking/start");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tracking/session"] });
      setIsTracking(true);
      toast({
        title: "Tracking démarré",
        description: "Votre position est maintenant partagée en direct",
      });
    },
    onError: (error: any) => {
      console.error("Erreur démarrage tracking:", error);
      toast({
        title: "Erreur",
        description: error?.message || "Impossible de démarrer le tracking",
        variant: "destructive",
      });
    },
  });

  const stopTrackingMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/tracking/stop");
      const data = await res.json();
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/tracking/session"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tracking/sessions"] });
      
      if (data.whatsappUrls && data.whatsappUrls.length > 0) {
        data.whatsappUrls.forEach((url: string, index: number) => {
          setTimeout(() => {
            window.open(url, '_blank');
          }, index * 500);
        });
        
        const addressInfo = data.address ? `\n📍 ${data.address}` : "";
        toast({
          title: "Tracking arrêté",
          description: `Position finale partagée avec ${data.whatsappUrls.length} contact(s) d'urgence via WhatsApp${addressInfo}`,
          duration: 6000,
        });
      } else {
        toast({
          title: "Tracking arrêté",
          description: "Session terminée avec succès",
        });
      }
      
      setIsTracking(false);
      setCurrentPosition(null);
    },
    onError: (error: any) => {
      console.error("Erreur arrêt tracking:", error);
      toast({
        title: "Erreur",
        description: error?.message || "Impossible d'arrêter le tracking",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (activeSession?.isActive) {
      setIsTracking(true);
    } else {
      setIsTracking(false);
    }
  }, [activeSession]);

  useEffect(() => {
    let watchId: number | null = null;

    if (isTracking && activeSession?.isActive) {
      watchId = navigator.geolocation.watchPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          setCurrentPosition({ lat: latitude, lng: longitude });

          try {
            await apiRequest("POST", "/api/tracking/location", {
              latitude: latitude.toString(),
              longitude: longitude.toString(),
            });
          } catch (error) {
            console.error("Error sending location:", error);
          }
        },
        (error) => {
          console.error("Geolocation error:", error);
        },
        {
          enableHighAccuracy: true,
          maximumAge: 0,
          timeout: 5000,
        }
      );
    }

    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [isTracking, activeSession]);

  const shareCurrentPosition = () => {
    if (!currentPosition) {
      toast({
        title: "Position non disponible",
        description: "Impossible d'obtenir votre position actuelle",
        variant: "destructive",
      });
      return;
    }

    if (!contacts || contacts.length === 0) {
      toast({
        title: "Aucun contact d'urgence",
        description: "Configurez vos contacts dans votre profil",
        variant: "destructive",
      });
      return;
    }

    const mapsUrl = `https://www.google.com/maps?q=${currentPosition.lat},${currentPosition.lng}`;
    const message = `📍 Ma position actuelle:\n\n${mapsUrl}\n\nTracking en cours...`;

    contacts.forEach((contact, index) => {
      const cleanPhone = contact.phone.replace(/[^\d+]/g, '');
      const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
      
      setTimeout(() => {
        window.open(whatsappUrl, '_blank');
      }, index * 500);
    });

    toast({
      title: "Position partagée",
      description: "Position envoyée à vos contacts d'urgence",
    });
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <Helmet>
        <title>Suivi GPS - Burkina Watch</title>
      </Helmet>
      <Header />

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="mb-4 flex items-center gap-2">
          <Button
            variant="ghost"
            onClick={() => setLocation("/profil")}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              queryClient.invalidateQueries({ queryKey: ["/api/tracking/session"] });
              queryClient.invalidateQueries({ queryKey: ["/api/tracking/sessions"] });
            }}
            className="gap-2 ml-auto"
          >
            <RefreshCw className="w-4 h-4" />
            Actualiser
          </Button>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-6 h-6" />
              Suivi de Localisation en Direct
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2 flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Sécurité et traçabilité
              </h3>
              <p className="text-sm text-blue-800 dark:text-blue-200">
                Le suivi de localisation enregistre votre position toutes les 30 secondes. En cas d'incident ou d'accident, cette trajectoire peut aider les secours à vous retrouver rapidement.
              </p>
            </div>

            {currentPosition && (
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm font-medium mb-2">Position actuelle:</p>
                <p className="text-xs text-muted-foreground">
                  Lat: {currentPosition.lat.toFixed(6)}, Lng: {currentPosition.lng.toFixed(6)}
                </p>
              </div>
            )}

            <div className="flex flex-col gap-3">
              {!isTracking ? (
                <Button
                  size="lg"
                  onClick={() => startTrackingMutation.mutate()}
                  disabled={startTrackingMutation.isPending}
                  className="w-full"
                >
                  {startTrackingMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Démarrage...
                    </>
                  ) : (
                    <>
                      <MapPin className="w-4 h-4 mr-2" />
                      Démarrer le Tracking
                    </>
                  )}
                </Button>
              ) : (
                <>
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={shareCurrentPosition}
                    disabled={!currentPosition || !contacts || contacts.length === 0}
                    className="w-full"
                  >
                    <Share2 className="w-4 h-4 mr-2" />
                    Partager Position Actuelle
                  </Button>

                  <Button
                    size="lg"
                    variant="destructive"
                    onClick={() => stopTrackingMutation.mutate()}
                    disabled={stopTrackingMutation.isPending}
                    className="w-full"
                  >
                    {stopTrackingMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Arrêt en cours...
                      </>
                    ) : (
                      <>
                        <StopCircle className="w-4 h-4 mr-2" />
                        Arrêter et Partager Position Finale
                      </>
                    )}
                  </Button>
                </>
              )}
            </div>

            {(!contacts || contacts.length === 0) && (
              <p className="text-sm text-muted-foreground text-center">
                Configurez vos contacts d'urgence dans votre profil pour partager votre position
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <BottomNav />
    </div>
  );
}
