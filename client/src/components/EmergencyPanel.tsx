import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, AlertCircle, Loader2, Radio, Shield, Minimize2, Ambulance } from "lucide-react";
import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation, Link } from "wouter";
import type { EmergencyContact } from "@shared/schema";
import { playPanicSound, playSuccessSound } from "@/lib/notificationSound";

// Placeholder for PanicButton component, assuming it exists elsewhere and handles panic logic
function PanicButton({ className }: { className?: string }) {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [pressCount, setPressCount] = useState(0);
  const [lastPressTime, setLastPressTime] = useState(0);
  const [isActivating, setIsActivating] = useState(false);

  const { data: contacts, isLoading: contactsLoading } = useQuery<EmergencyContact[]>({
    queryKey: ["/api/emergency-contacts"],
  });

  const panicMutation = useMutation({
    mutationFn: async () => {
      if (!navigator.geolocation) {
        throw new Error("La géolocalisation n'est pas supportée par votre navigateur");
      }

      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              console.log("Position obtenue:", pos.coords);
              resolve(pos);
            },
            (error) => {
              console.error("Erreur géolocalisation:", error);
              let errorMsg = "Impossible d'obtenir votre position";
              switch(error.code) {
                case error.PERMISSION_DENIED:
                  errorMsg = "🚫 Accès à la localisation refusé.\n\nPour utiliser cette fonction:\n1. Cliquez sur l'icône 🔒 dans la barre d'adresse\n2. Autorisez l'accès à la localisation\n3. Actualisez la page";
                  break;
                case error.POSITION_UNAVAILABLE:
                  errorMsg = "📍 Position non disponible.\n\nAssurez-vous que:\n• Le GPS est activé sur votre appareil\n• Vous êtes à l'extérieur ou près d'une fenêtre\n• Le mode 'Précision élevée' est activé dans les paramètres de localisation";
                  break;
                case error.TIMEOUT:
                  errorMsg = "⏱️ Demande de localisation expirée.\n\nVeuillez:\n1. Activer le GPS sur votre appareil\n2. Vous placer dans un endroit avec une meilleure réception\n3. Réessayer dans quelques secondes";
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
      } catch (error) {
        console.error("Erreur dans panicMutation:", error);
        throw error;
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/panic-alerts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread-count"] });

      playSuccessSound();

      // Ouvrir les URLs WhatsApp
      if (data.whatsappUrls && data.whatsappUrls.length > 0) {
        data.whatsappUrls.forEach((url: string, index: number) => {
          setTimeout(() => {
            window.open(url, '_blank');
          }, index * 500);
        });
      }

      toast({
        title: "🚨 Alerte envoyée",
        description: `Vos contacts d'urgence ont été notifiés de votre position.`,
        variant: "destructive",
      });
      setIsActivating(false);
    },
    onError: (error: any) => {
      console.error("Erreur alerte panique:", error);
      const errorMessage = error?.message || "Impossible d'envoyer l'alerte panique. Vérifiez votre connexion et vos paramètres de localisation.";
      toast({
        title: "❌ Erreur",
        description: errorMessage,
        variant: "destructive",
        duration: 8000, // Longer duration for permission instructions
      });
      setIsActivating(false);
    },
  });

  useEffect(() => {
    const resetTimer = setTimeout(() => {
      setPressCount(0);
    }, 1000);

    return () => clearTimeout(resetTimer);
  }, [lastPressTime]);

  const handlePanicPress = () => {
    if (!contacts || contacts.length === 0) {
      toast({
        title: "Aucun contact d'urgence",
        description: "Configurez vos contacts dans les paramètres de votre profil",
        variant: "destructive",
      });
      return;
    }

    if (!navigator.geolocation) {
      toast({
        title: "Géolocalisation non disponible",
        description: "Votre appareil ne supporte pas la géolocalisation",
        variant: "destructive",
      });
      return;
    }

    playPanicSound();
    setIsActivating(true);
    panicMutation.mutate();
  };

  const activatePanic = () => {
    if (contactsLoading) {
      toast({
        title: "Chargement...",
        description: "Veuillez patienter pendant le chargement des contacts",
      });
      return;
    }

    // This part is now handled by handlePanicPress
    // if (!contacts || contacts.length === 0) {
    //   toast({
    //     title: "Aucun contact d'urgence",
    //     description: "Configurez vos contacts dans les paramètres",
    //     variant: "destructive",
    //   });
    //   return;
    // }

    setIsActivating(true);
    panicMutation.mutate();
  };

  return (
    <Button
      size="lg"
      variant="destructive"
      className={`${className} bg-gradient-to-br from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 dark:from-red-700 dark:to-red-800 dark:hover:from-red-800 dark:hover:to-red-900 shadow-md border border-red-400/50 dark:border-red-500/50 transition-all duration-200 hover:scale-105 active:scale-95`}
      onClick={handlePanicPress}
      disabled={isActivating || contactsLoading}
      data-testid="button-panic"
    >
      <div className="flex flex-col items-center gap-0.5">
        {contactsLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-[10px] font-bold">...</span>
          </>
        ) : isActivating ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-[10px] font-bold">Envoi</span>
          </>
        ) : (
          <>
            <AlertTriangle className="w-4 h-4" />
            <span className="text-xs font-bold">PANIQUE</span>
          </>
        )}
      </div>
    </Button>
  );
}


export default function EmergencyPanel() {
  return (
    <div className="fixed bottom-24 right-4 z-50 flex flex-col gap-3">
      <Link href="/sos/publier">
        <Button
          className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-orange-600 hover:bg-orange-700 font-bold shadow-2xl hover:shadow-orange-500/50 transition-all duration-300 hover:scale-110 flex flex-col items-center justify-center p-0"
          size="lg"
        >
          <Ambulance className="w-7 h-7 md:w-8 md:h-8" />
          <span className="text-xs font-bold mt-1">SOS</span>
        </Button>
      </Link>

      <div className="relative group">
        <PanicButton className="w-16 h-16 md:w-20 md:h-20 rounded-full shadow-2xl hover:shadow-red-500/50 transition-all duration-300 hover:scale-110 flex flex-col items-center justify-center p-0 text-xs" />
      </div>
    </div>
  );
}