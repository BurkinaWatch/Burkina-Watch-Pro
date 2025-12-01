
import { Button } from "@/components/ui/button";
import { AlertTriangle, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { EmergencyContact } from "@shared/schema";

interface PanicButtonProps {
  className?: string;
}

export default function PanicButton({ className }: PanicButtonProps) {
  const { toast } = useToast();
  const [pressCount, setPressCount] = useState(0);
  const [lastPressTime, setLastPressTime] = useState(0);
  const [isActivating, setIsActivating] = useState(false);

  const { data: contacts } = useQuery<EmergencyContact[]>({
    queryKey: ["/api/emergency-contacts"],
  });

  const panicMutation = useMutation({
    mutationFn: async () => {
      // Vérifier que la géolocalisation est disponible
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
      
      // Ouvrir les URLs WhatsApp
      if (data.whatsappUrls && data.whatsappUrls.length > 0) {
        data.whatsappUrls.forEach((url: string, index: number) => {
          setTimeout(() => {
            window.open(url, '_blank');
          }, index * 500); // Délai entre chaque ouverture
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

  const handlePress = () => {
    // Un seul clic suffit
    activatePanic();
  };

  const activatePanic = () => {
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

    setIsActivating(true);
    panicMutation.mutate();
  };

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
