import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Phone, Clock, Navigation, Globe, Mail, ExternalLink, Locate, Activity, ShieldCheck, UtensilsCrossed, Star, DollarSign, Share2, MessageCircle, Camera, Pencil, AlertTriangle } from "lucide-react";
import type { Place } from "@shared/schema";
import { SourceBadge } from "./SourceBadge";
import { LocationValidator } from "./LocationValidator";
import { useToast } from "@/hooks/use-toast";
import { getCurrentMobileMoneyStatus, getFreshnessClasses, getPlaceFreshness } from "@/lib/placeFreshness";

interface PlaceWithDistance extends Place {
  distance?: number;
}

interface PlaceCardProps {
  place: PlaceWithDistance;
}

const PLACE_TYPE_LABELS: Record<string, string> = {
  pharmacy: "Pharmacie",
  restaurant: "Restaurant",
  fuel: "Station-service",
  marketplace: "Marché",
  shop: "Boutique",
};

const PLACE_TYPE_COLORS: Record<string, string> = {
  pharmacy: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  restaurant: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  fuel: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  marketplace: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  shop: "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-400",
};

export function PlaceCard({ place }: PlaceCardProps) {
  const { toast } = useToast();
  const typeLabel = PLACE_TYPE_LABELS[place.placeType] || place.placeType;
  const typeColor = PLACE_TYPE_COLORS[place.placeType] || "bg-muted text-muted-foreground";
  
  const tags = (place.tags || {}) as Record<string, string>;
  
  // Extraire les noms si place.name est vide (souvent le cas dans les tags OSM)
  const displayName = place.name || tags.name || tags["name:fr"] || tags["name:en"] || tags.operator || tags.brand || tags.owner || tags.ref || "Établissement sans nom";
  
  // Liste des plats vendus (si disponible dans les tags)
  const plats = tags.plats || tags.menu || tags.dishes || tags.cuisine;
  
  // Extraire les spécialités et services pour l'affichage enrichi
  const specialites = tags.specialites || tags.cuisine || tags.speciality;
  const services = tags.services || (place.placeType === "hospital" ? "Urgences, Consultations, Hospitalisation" : null);

  // Données Google Places
  const rating = tags.rating ? parseFloat(tags.rating) : null;
  const ratingCount = tags.ratingCount ? parseInt(tags.ratingCount) : null;
  const priceLevel = tags.priceLevel || null;
  const description = tags.description || null;

  // Nom de l'établissement pour la source si c'est une donnée enrichie
  const sourceName = place.source && place.source !== "OSM" && place.source !== "Fallback" && place.source !== "OpenStreetMap" ? place.source : "DATABASE";

  const imageUrl = place.imageUrl || tags.photoUrl || tags.image || tags.photo || tags["image:url"] || null;
  const website = tags.website || tags["contact:website"] || null;
  const email = tags.email || tags["contact:email"] || null;
  const phone = place.telephone || tags.phone || tags["contact:phone"] || tags["phone:mobile"] || null;
  const openingHours = place.horaires || tags.opening_hours || tags["service_times"] || null;
  const brand = tags.brand || tags.operator || null;
  const freshness = getPlaceFreshness(place);
  const mobileMoneyStatus = getCurrentMobileMoneyStatus(tags);
  const budget = tags.budget || tags.price || tags.priceRange || null;
  const listedServices = tags.services || tags.service || null;
  const citizenMedia = Array.isArray(tags.citizenMedia) ? tags.citizenMedia : [];

  const cleanPhone = phone ? String(phone).replace(/[^\d+]/g, "") : null;

  const openInMaps = () => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${place.latitude},${place.longitude}`;
    window.open(url, "_blank");
  };

  const openLocation = () => {
    const url = `https://www.google.com/maps?q=${place.latitude},${place.longitude}`;
    window.open(url, "_blank");
  };

  const sharePlace = async () => {
    const mapsUrl = `https://www.google.com/maps?q=${place.latitude},${place.longitude}`;
    const shareData = { title: displayName, text: `${displayName} — ${place.address || "Burkina Faso"}`, url: mapsUrl };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(mapsUrl);
        toast({ title: "Lien copié", description: "Le lien de la carte a été copié." });
      }
    } catch {
      // Annuler le partage natif ne doit pas afficher une erreur.
    }
  };

  const openContribution = (kind: "correction" | "photo") => {
    const params = new URLSearchParams({
      contribution: kind,
      placeId: place.id,
      placeName: displayName,
    });
    window.location.assign(`/publier?${params.toString()}`);
  };

  return (
    <Card data-testid={`card-place-${place.id}`} className="overflow-hidden">
      {imageUrl && (
        <div className="relative h-40 w-full overflow-hidden bg-muted">
          <img 
            src={imageUrl} 
            alt={place.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        </div>
      )}
      
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <CardTitle className="text-base font-semibold leading-tight" data-testid={`text-place-name-${place.id}`}>
            {displayName}
          </CardTitle>
          <Badge className={`text-xs ${typeColor}`} variant="secondary">
            {typeLabel}
          </Badge>
        </div>
        {brand && (
          <p className="text-xs text-muted-foreground">{brand}</p>
        )}
        {(rating || priceLevel) && (
          <div className="flex items-center gap-3 mt-1">
            {rating && (
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                <span className="text-sm font-medium">{rating.toFixed(1)}</span>
                {ratingCount && (
                  <span className="text-xs text-muted-foreground">({ratingCount})</span>
                )}
              </div>
            )}
            {priceLevel && (
              <Badge variant="outline" className="text-xs py-0 h-5">
                <DollarSign className="w-3 h-3 mr-1" />
                {priceLevel}
              </Badge>
            )}
          </div>
        )}
        {description && (
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{description}</p>
        )}
        <div className="mt-2">
          <SourceBadge 
            source={sourceName}
            confidenceScore={place.confidenceScore}
            verificationStatus={place.verificationStatus}
            confirmations={place.confirmations}
            reports={place.reports}
            size="sm"
          />
        </div>
        <div className={`mt-2 rounded-md border px-2.5 py-1.5 text-xs ${getFreshnessClasses(freshness.tone)}`}>
          <div className="flex items-center gap-1.5 font-medium">
            <span aria-hidden="true">
              {freshness.tone === "recent" ? "🟢" : freshness.tone === "contested" ? "🔴" : freshness.tone === "old" ? "⚪" : "🟡"}
            </span>
            <span>{freshness.label}</span>
          </div>
          <p className="mt-0.5 opacity-85">{freshness.detail}</p>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {place.distance !== undefined && (
          <div className="bg-primary/10 border border-primary/20 rounded-md p-2 flex items-center gap-2">
            <Locate className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold text-primary">
              {place.distance < 1 
                ? `${Math.round(place.distance * 1000)} m` 
                : `${place.distance.toFixed(1)} km`}
            </span>
            <span className="text-xs text-muted-foreground">de vous</span>
          </div>
        )}
        <button
          onClick={openLocation}
          className="flex items-start gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-full text-left group"
          data-testid={`button-location-${place.id}`}
        >
          <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5 text-primary" />
          <span className="group-hover:underline" data-testid={`text-place-location-${place.id}`}>
            {place.address || [place.quartier, place.ville, place.region].filter(Boolean).join(", ") || "Voir sur la carte"}
          </span>
        </button>
        
        {openingHours && (
          <div className="flex items-start gap-2 text-sm text-muted-foreground">
            <Clock className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span className="break-words">{openingHours}</span>
          </div>
        )}

        {budget && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <DollarSign className="w-4 h-4 flex-shrink-0 text-primary/70" />
            <span>Budget indiqué : {String(budget)}</span>
          </div>
        )}

        {listedServices && (
          <div className="flex items-start gap-2 text-sm text-muted-foreground">
            <ShieldCheck className="w-4 h-4 flex-shrink-0 text-primary/70" />
            <span>{String(listedServices)}</span>
          </div>
        )}

        {mobileMoneyStatus && (
          <div className={`flex items-start gap-2 rounded-md border p-2 text-xs ${
            mobileMoneyStatus.tone === "available"
              ? "border-green-200 bg-green-50 text-green-800 dark:border-green-900 dark:bg-green-950/30 dark:text-green-300"
              : mobileMoneyStatus.tone === "closed"
                ? "border-red-200 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300"
                : "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300"
          }`}>
            <span aria-hidden="true">{mobileMoneyStatus.tone === "available" ? "✓" : mobileMoneyStatus.tone === "closed" ? "✕" : "⚠"}</span>
            <span>{mobileMoneyStatus.label}</span>
          </div>
        )}

        {specialites && (
          <div className="flex items-start gap-2 text-sm text-muted-foreground">
            <Activity className="w-4 h-4 flex-shrink-0 mt-0.5 text-primary/70" />
            <div className="flex flex-wrap gap-1">
              {String(specialites).split(/[,;]/).map((s, i) => (
                <Badge key={i} variant="outline" className="text-[10px] py-0 h-4 bg-primary/5 border-primary/20">
                  {s.trim()}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {services && (
          <div className="flex items-start gap-2 text-sm text-muted-foreground">
            <ShieldCheck className="w-4 h-4 flex-shrink-0 mt-0.5 text-primary/70" />
            <span className="text-xs line-clamp-2 italic">{String(services)}</span>
          </div>
        )}

        {plats && (
          <div className="flex items-start gap-2 text-sm text-muted-foreground">
            <UtensilsCrossed className="w-4 h-4 flex-shrink-0 mt-0.5 text-primary/70" />
            <div className="flex flex-col gap-1">
              <span className="text-xs font-semibold">Au menu :</span>
              <span className="text-xs line-clamp-2">{String(plats)}</span>
            </div>
          </div>
        )}
        
        {phone && (
          <div className="flex items-center gap-2 text-sm">
            <Phone className="w-4 h-4 flex-shrink-0 text-muted-foreground" />
            <a 
              href={`tel:${phone.replace(/\s/g, '')}`} 
              className="text-primary hover:underline"
              data-testid={`link-phone-${place.id}`}
            >
              {phone}
            </a>
          </div>
        )}

        {cleanPhone && (
          <a
            href={`https://wa.me/${cleanPhone.replace(/^\+/, "")}?text=${encodeURIComponent(`Bonjour, je souhaite vérifier les informations de ${displayName}.`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-green-700 hover:underline dark:text-green-400"
          >
            <MessageCircle className="w-4 h-4 flex-shrink-0" />
            WhatsApp
          </a>
        )}
        
        {email && (
          <div className="flex items-center gap-2 text-sm">
            <Mail className="w-4 h-4 flex-shrink-0 text-muted-foreground" />
            <a 
              href={`mailto:${email}`} 
              className="text-primary hover:underline truncate"
              data-testid={`link-email-${place.id}`}
            >
              {email}
            </a>
          </div>
        )}
        
        {website && (
          <div className="flex items-center gap-2 text-sm">
            <Globe className="w-4 h-4 flex-shrink-0 text-muted-foreground" />
            <a 
              href={website.startsWith('http') ? website : `https://${website}`} 
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline truncate"
              data-testid={`link-website-${place.id}`}
            >
              {website.replace(/^https?:\/\//, '').replace(/\/$/, '')}
            </a>
          </div>
        )}

        {citizenMedia.length > 0 && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Camera className="w-4 h-4 flex-shrink-0 text-primary/70" />
            <span>Vu récemment · {citizenMedia.length} média{citizenMedia.length > 1 ? "s" : ""} citoyen{citizenMedia.length > 1 ? "s" : ""}</span>
          </div>
        )}

        <div className="pt-3 border-t space-y-3">
          <LocationValidator
            placeId={place.id}
            initialConfirmations={place.confirmations || 0}
            initialReports={place.reports || 0}
            compact
          />
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" className="gap-1.5" onClick={sharePlace}>
              <Share2 className="w-3.5 h-3.5" />
              Partager
            </Button>
            <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => openContribution("correction")}>
              <Pencil className="w-3.5 h-3.5" />
              Corriger
            </Button>
            <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => openContribution("photo")}>
              <Camera className="w-3.5 h-3.5" />
              Ajouter une photo
            </Button>
          </div>
          <Button
            onClick={openInMaps}
            className="w-full gap-2"
            variant="default"
            data-testid={`button-directions-${place.id}`}
          >
            <Navigation className="w-4 h-4" />
            Itinéraire
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function PlaceCardSkeleton() {
  return (
    <Card className="animate-pulse overflow-hidden">
      <div className="h-40 bg-muted" />
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="h-5 w-2/3 bg-muted rounded" />
          <div className="h-5 w-16 bg-muted rounded" />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 bg-muted rounded" />
          <div className="h-4 w-3/4 bg-muted rounded" />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 bg-muted rounded" />
          <div className="h-4 w-1/2 bg-muted rounded" />
        </div>
        <div className="pt-3 border-t">
          <div className="h-9 w-full bg-muted rounded" />
        </div>
      </CardContent>
    </Card>
  );
}
