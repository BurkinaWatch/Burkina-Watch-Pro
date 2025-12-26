import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useMutation, useQuery } from "@tanstack/react-query";
import { CheckCircle, Flag, MapPin, Phone, Clock, ExternalLink, ThumbsUp, AlertTriangle, Shield, Loader2 } from "lucide-react";
import type { Place } from "@shared/schema";

interface PlaceCardProps {
  place: Place;
  showVerification?: boolean;
  isAuthenticated?: boolean;
}

const PLACE_TYPE_LABELS: Record<string, string> = {
  pharmacy: "Pharmacie",
  restaurant: "Restaurant",
  fuel: "Station-service",
  marketplace: "Marché",
  shop: "Boutique",
};

const VERIFICATION_STATUS_BADGES: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "Non vérifié", variant: "secondary" },
  verified: { label: "Vérifié", variant: "default" },
  needs_review: { label: "À vérifier", variant: "destructive" },
};

export function PlaceCard({ place, showVerification = true, isAuthenticated = false }: PlaceCardProps) {
  const { toast } = useToast();
  
  const { data: userVerifications } = useQuery<{ confirmed: boolean; reported: boolean }>({
    queryKey: ['/api/places', place.id, 'verifications'],
    enabled: isAuthenticated && showVerification,
  });

  const confirmMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/places/${place.id}/confirm`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Merci !",
        description: "Votre confirmation a été enregistrée.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/places'] });
      queryClient.invalidateQueries({ queryKey: ['/api/places', place.id] });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Vous avez déjà confirmé ce lieu",
        variant: "destructive",
      });
    },
  });

  const reportMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/places/${place.id}/report`, { comment: "Signalement de l'utilisateur" });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Signalement enregistré",
        description: "Nous examinerons ce lieu.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/places'] });
      queryClient.invalidateQueries({ queryKey: ['/api/places', place.id] });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Vous avez déjà signalé ce lieu",
        variant: "destructive",
      });
    },
  });

  const typeLabel = PLACE_TYPE_LABELS[place.placeType] || place.placeType;
  const statusInfo = VERIFICATION_STATUS_BADGES[place.verificationStatus] || VERIFICATION_STATUS_BADGES.pending;

  const openInMaps = () => {
    const url = `https://www.google.com/maps?q=${place.latitude},${place.longitude}`;
    window.open(url, "_blank");
  };

  return (
    <Card data-testid={`card-place-${place.id}`} className="group">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <CardTitle className="text-base font-medium leading-tight" data-testid={`text-place-name-${place.id}`}>
            {place.name}
          </CardTitle>
          <div className="flex items-center gap-1 flex-wrap">
            <Badge variant={statusInfo.variant} className="text-xs" data-testid={`badge-verification-${place.id}`}>
              {place.verificationStatus === "verified" && <Shield className="w-3 h-3 mr-1" />}
              {place.verificationStatus === "needs_review" && <AlertTriangle className="w-3 h-3 mr-1" />}
              {statusInfo.label}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {typeLabel}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {place.ville && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="w-4 h-4 flex-shrink-0" />
            <span data-testid={`text-place-location-${place.id}`}>
              {[place.quartier, place.ville, place.region].filter(Boolean).join(", ")}
            </span>
          </div>
        )}
        
        {place.address && (
          <div className="text-sm text-muted-foreground">
            {place.address}
          </div>
        )}
        
        {place.telephone && (
          <div className="flex items-center gap-2 text-sm">
            <Phone className="w-4 h-4 flex-shrink-0 text-muted-foreground" />
            <a 
              href={`tel:${place.telephone}`} 
              className="text-primary hover:underline"
              data-testid={`link-phone-${place.id}`}
            >
              {place.telephone}
            </a>
          </div>
        )}
        
        {place.horaires && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="w-4 h-4 flex-shrink-0" />
            <span>{place.horaires}</span>
          </div>
        )}

        <div className="flex items-center justify-between gap-2 pt-2 flex-wrap">
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <ThumbsUp className="w-3 h-3" />
              {place.confirmations} confirmations
            </span>
            {place.reports > 0 && (
              <span className="flex items-center gap-1 text-orange-500">
                <Flag className="w-3 h-3" />
                {place.reports} signalements
              </span>
            )}
          </div>
          
          <Button
            size="sm"
            variant="outline"
            onClick={openInMaps}
            data-testid={`button-map-${place.id}`}
          >
            <ExternalLink className="w-3 h-3 mr-1" />
            Carte
          </Button>
        </div>

        {showVerification && (
          <div className="flex items-center gap-2 pt-2 border-t flex-wrap">
            <Button
              size="sm"
              variant={userVerifications?.confirmed ? "default" : "outline"}
              onClick={() => confirmMutation.mutate()}
              disabled={confirmMutation.isPending || userVerifications?.confirmed}
              className={userVerifications?.confirmed ? "bg-green-600 hover:bg-green-700" : ""}
              data-testid={`button-confirm-${place.id}`}
            >
              {confirmMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-1" />
                  {userVerifications?.confirmed ? "Confirmé" : "Confirmer"}
                </>
              )}
            </Button>
            
            <Button
              size="sm"
              variant={userVerifications?.reported ? "destructive" : "ghost"}
              onClick={() => reportMutation.mutate()}
              disabled={reportMutation.isPending || userVerifications?.reported}
              data-testid={`button-report-${place.id}`}
            >
              {reportMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Flag className="w-4 h-4 mr-1" />
                  {userVerifications?.reported ? "Signalé" : "Signaler"}
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function PlaceCardSkeleton() {
  return (
    <Card className="animate-pulse">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="h-5 w-2/3 bg-muted rounded" />
          <div className="h-5 w-16 bg-muted rounded" />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 bg-muted rounded" />
          <div className="h-4 w-1/2 bg-muted rounded" />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 bg-muted rounded" />
          <div className="h-4 w-1/3 bg-muted rounded" />
        </div>
        <div className="flex items-center justify-between pt-2">
          <div className="h-4 w-24 bg-muted rounded" />
          <div className="h-8 w-16 bg-muted rounded" />
        </div>
      </CardContent>
    </Card>
  );
}
