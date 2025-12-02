import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import CategoryBadge from "./CategoryBadge";
import StatutBadge from "./StatutBadge";
import EditSignalementDialog from "./EditSignalementDialog";
import CommentDialog from "./CommentDialog";
import type { Categorie, Statut, Signalement } from "@shared/schema";
import { Heart, Share2, MapPin, AlertCircle, ShieldCheck, ShieldAlert, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Link, useLocation } from "wouter";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface SignalementCardProps {
  id: string;
  titre: string;
  description: string;
  categorie: string;
  localisation: string | null;
  latitude: string;
  longitude: string;
  photo?: string | null;
  isSOS?: boolean | null;
  isAnonymous?: boolean | null;
  niveauUrgence?: string | null;
  statut?: string | null;
  likes: number | null;
  commentairesCount?: number | null;
  sharesCount?: number | null;
  createdAt: Date;
  userId?: string | null;
  auteurFirstName?: string | null;
  auteurLastName?: string | null;
}

export default function SignalementCard({
  id,
  titre,
  description,
  categorie,
  localisation,
  latitude,
  longitude,
  photo,
  isSOS = false,
  isAnonymous = false,
  niveauUrgence = "moyen",
  statut = "en_attente",
  likes,
  commentairesCount = 0,
  sharesCount = 0,
  createdAt,
  userId,
  auteurFirstName,
  auteurLastName,
}: SignalementCardProps) {
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(likes || 0);
  const [shareCount, setShareCount] = useState(sharesCount || 0);
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const auteur = isAnonymous 
    ? "Anonyme" 
    : (auteurFirstName || auteurLastName)
      ? `${auteurFirstName || ""} ${auteurLastName || ""}`.trim()
      : "Anonyme";

  const likeMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/signalements/${id}/like`, {});
      return res.json();
    },
    onSuccess: (data) => {
      // Use the isLiked state from server response
      setIsLiked(data.isLiked);
      setLikeCount(data.likes || 0);
      
      queryClient.invalidateQueries({ queryKey: ["/api/signalements"] });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de modifier le like",
        variant: "destructive",
      });
    },
  });

  const handleLike = () => {
    if (!isAuthenticated) {
      toast({
        title: "Connexion requise",
        description: "Vous devez être connecté pour aimer un signalement",
        variant: "destructive",
      });
      window.location.href = "/api/login";
      return;
    }
    likeMutation.mutate();
  };

  const shareMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/signalements/${id}/share`, {});
      return res.json();
    },
    onSuccess: (data) => {
      setShareCount(data.sharesCount || 0);
      queryClient.invalidateQueries({ queryKey: ["/api/signalements"] });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible d'enregistrer le partage",
        variant: "destructive",
      });
    },
  });

  const handleShare = async () => {
    const shareData = {
      title: titre,
      text: description,
      url: `${window.location.origin}/signalement/${id}`,
    };

    if (navigator.share && navigator.canShare?.(shareData)) {
      try {
        await navigator.share(shareData);
        shareMutation.mutate();
        toast({
          title: "Partagé",
          description: "Le signalement a été partagé avec succès",
        });
      } catch (error: any) {
        if (error.name !== "AbortError") {
          handleCopyLink();
        }
      }
    } else {
      handleCopyLink();
    }
  };

  const handleCopyLink = () => {
    const url = `${window.location.origin}/signalement/${id}`;
    navigator.clipboard.writeText(url).then(() => {
      shareMutation.mutate();
      toast({
        title: "Lien copié",
        description: "Le lien du signalement a été copié dans le presse-papiers",
      });
    }).catch(() => {
      toast({
        title: "Erreur",
        description: "Impossible de copier le lien",
        variant: "destructive",
      });
    });
  };

  const canEdit = userId === "demo-user" || (user && userId && user.id === userId);

  const handleOpenGoogleMaps = () => {
    if (latitude && longitude) {
      const mapsUrl = `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}&zoom=15`;
      window.open(mapsUrl, '_blank', 'noopener,noreferrer');
    } else if (localisation) {
      const mapsUrl = `https://www.openstreetmap.org/search?query=${encodeURIComponent(localisation)}`;
      window.open(mapsUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <Link href={`/signalement/${id}`} className="block">
      <Card className={`overflow-hidden ${isSOS ? "border-2 border-category-urgence" : ""} hover:shadow-lg transition-shadow cursor-pointer`}>
        {photo && (
          <div className="relative w-full h-48">
            <img
              src={photo}
              alt={titre}
              className="w-full h-full object-cover"
              loading="lazy"
            />
            <div className="absolute top-2 right-2 flex gap-2">
              <CategoryBadge categorie={categorie as Categorie} />
              {isSOS && (
                <span className="flex items-center gap-1 bg-category-urgence text-white px-3 py-1 rounded-full text-xs font-semibold animate-pulse">
                  <AlertCircle className="w-3 h-3" />
                  SOS
                </span>
              )}
            </div>
          </div>
        )}
        <CardContent className="p-4">
        {!photo && (
          <div className="flex flex-wrap gap-2 mb-3">
            <CategoryBadge categorie={categorie as Categorie} />
            {isSOS && (
              <span className="flex items-center gap-1 bg-category-urgence text-white px-3 py-1 rounded-full text-xs font-semibold animate-pulse">
                <AlertCircle className="w-3 h-3" />
                SOS
              </span>
            )}
          </div>
        )}

        <h3 className="text-lg font-semibold mb-2 line-clamp-2" data-testid={`link-signalement-${id}`}>
          {titre}
        </h3>
        <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                {description}
              </p>

              {userId && auteur !== "Anonyme" && (
                <div 
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setLocation(`/profil/${userId}`);
                  }}
                  className="flex items-center gap-2 mb-2 hover:opacity-80 cursor-pointer"
                  data-testid={`link-profile-${userId}`}
                >
                  <Avatar className="w-6 h-6">
                    <AvatarImage src="" />
                    <AvatarFallback className="text-xs">
                      {auteurFirstName?.[0]}{auteurLastName?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-xs text-muted-foreground">
                    {auteur}
                  </span>
                </div>
              )}

        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleOpenGoogleMaps();
          }}
          className="flex items-center gap-2 text-sm text-muted-foreground mb-3 hover-elevate active-elevate-2 rounded px-2 py-1 -ml-2 transition-colors"
          data-testid={`button-location-${id}`}
        >
          <MapPin className="w-4 h-4 flex-shrink-0" />
          <span className="line-clamp-1">{localisation || "Localisation inconnue"}</span>
        </button>

        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <StatutBadge statut={(statut || "en_attente") as Statut} />
          </div>
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(createdAt, { addSuffix: true, locale: fr })}
          </span>
        </div>

        {canEdit && (
          <div className="mb-3" onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
            <EditSignalementDialog 
              signalement={{
                id,
                titre,
                description,
                categorie,
                localisation,
                latitude,
                longitude,
                photo,
                video: null,
                isSOS,
                isAnonymous,
                niveauUrgence,
                statut,
                likes,
                userId,
                createdAt,
              } as Signalement}
            />
          </div>
        )}

        <div className="flex items-center gap-1 pt-3 border-t" onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
          <Button
            variant="ghost"
            size="sm"
            className={`flex items-center gap-1 ${isLiked ? "text-destructive" : ""}`}
            onClick={handleLike}
            disabled={likeMutation.isPending}
            data-testid={`button-like-${titre}`}
          >
            <Heart className={`w-4 h-4 ${isLiked ? "fill-current" : ""}`} />
            <span className="text-xs">{likeCount}</span>
          </Button>
          <CommentDialog signalementId={id} commentCount={commentairesCount || 0} />
          <Button
            variant="ghost"
            size="sm"
            className="flex items-center gap-1"
            onClick={handleShare}
            data-testid={`button-share-${titre}`}
          >
            <Share2 className="w-4 h-4" />
            <span className="text-xs">{shareCount}</span>
          </Button>
        </div>
      </CardContent>
    </Card>
    </Link>
  );
}