import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Phone, Clock, Navigation, Globe, Mail, ExternalLink, Locate, Activity, ShieldCheck } from "lucide-react";
import type { Place } from "@shared/schema";
import { SourceBadge } from "./SourceBadge";

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
  const typeLabel = PLACE_TYPE_LABELS[place.placeType] || place.placeType;
  const typeColor = PLACE_TYPE_COLORS[place.placeType] || "bg-muted text-muted-foreground";
  
  const tags = (place.tags || {}) as Record<string, string>;
  
  // Extraire les spécialités et services pour l'affichage enrichi
  const specialites = tags.specialites || tags.cuisine || tags.speciality;
  const services = tags.services || (place.placeType === "hospital" ? "Urgences, Consultations, Hospitalisation" : null);

  const imageUrl = tags.image || tags.photo || tags["image:url"] || null;
  const website = tags.website || tags["contact:website"] || null;
  const email = tags.email || tags["contact:email"] || null;
  const phone = place.telephone || tags.phone || tags["contact:phone"] || null;
  const openingHours = place.horaires || tags.opening_hours || null;
  const brand = tags.brand || tags.operator || null;

  const openInMaps = () => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${place.latitude},${place.longitude}`;
    window.open(url, "_blank");
  };

  const openLocation = () => {
    const url = `https://www.google.com/maps?q=${place.latitude},${place.longitude}`;
    window.open(url, "_blank");
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
            {place.name}
          </CardTitle>
          <Badge className={`text-xs ${typeColor}`} variant="secondary">
            {typeLabel}
          </Badge>
        </div>
        {brand && (
          <p className="text-xs text-muted-foreground">{brand}</p>
        )}
        <div className="mt-2">
          <SourceBadge 
            source={place.source || "OSM"}
            confidenceScore={place.confidenceScore}
            verificationStatus={place.verificationStatus}
            confirmations={place.confirmations}
            reports={place.reports}
            size="sm"
          />
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

        <div className="pt-3 border-t">
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
