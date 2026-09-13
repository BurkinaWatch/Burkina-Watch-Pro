import { CalendarDays, ExternalLink, MapPin, MessageCircle, Phone } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Offer } from "@shared/schema";
import { PracticalConfirmationActions, type PracticalConfirmationSummary } from "./PracticalConfirmationActions";

type OfferWithContext = Offer & {
  placeName?: string | null;
  confirmations?: PracticalConfirmationSummary;
};

const statusLabels: Record<string, string> = {
  ACTIVE: "Active",
  PENDING: "En attente de validation",
  UNVERIFIED: "Non vérifiée",
  EXPIRED: "Expirée",
  CANCELLED: "Annulée",
};

const sourceLabels: Record<string, string> = {
  INTERNAL: "Source interne",
  OFFICIAL: "Page officielle",
  EXTERNAL: "Source externe",
  RSS: "Flux RSS",
  USER: "Utilisateur BurkinaWatch",
};

function formatDate(value: string | Date | null | undefined) {
  if (!value) return "date inconnue";
  return new Date(value).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
}

export function OfferCard({ offer }: { offer: OfferWithContext }) {
  const phone = offer.phone || null;
  const whatsapp = offer.whatsapp || phone;
  const status = offer.status || "UNVERIFIED";

  return (
    <Card className="overflow-hidden border-amber-900/10" data-testid={`card-offer-${offer.id}`}>
      {offer.mediaUrl ? (
        <img src={offer.mediaUrl} alt="" className="h-36 w-full object-cover" loading="lazy" />
      ) : null}
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base leading-tight">{offer.title}</CardTitle>
          <Badge variant={status === "ACTIVE" ? "default" : "secondary"}>{statusLabels[status] || status}</Badge>
        </div>
        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
          <span>Source : {sourceLabels[offer.sourceType] || offer.sourceType}</span>
          <span>· collectée le {formatDate(offer.collectedAt)}</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm leading-5 text-muted-foreground">{offer.description}</p>
        {offer.price !== null && offer.price !== undefined ? (
          <p className="text-lg font-bold text-emerald-800 dark:text-emerald-300">
            {Number(offer.price).toLocaleString("fr-FR")} {offer.currency || "XOF"}
          </p>
        ) : null}
        <div className="space-y-1.5 text-xs text-muted-foreground">
          {offer.availability ? <p>Disponibilité indiquée : {offer.availability}</p> : null}
          {offer.zone ? <p className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" />Zone : {offer.zone}</p> : null}
          {offer.placeName ? <p className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" />Lieu associé : {offer.placeName}</p> : null}
          <p className="flex items-center gap-1.5"><CalendarDays className="h-3.5 w-3.5" />Publié le {formatDate(offer.publishedAt)}</p>
          {offer.endsAt ? <p>Valable jusqu’au {formatDate(offer.endsAt)}</p> : null}
        </div>
        {status !== "ACTIVE" ? (
          <p className="rounded-md border border-amber-200 bg-amber-50/70 p-2 text-xs text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/20 dark:text-amber-200">
            Cette information n’est pas présentée comme une disponibilité confirmée.
          </p>
        ) : null}
        <div className="flex flex-wrap gap-2">
          {phone ? <a href={`tel:${phone}`} className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"><Phone className="h-3.5 w-3.5" />Téléphoner</a> : null}
          {whatsapp ? <a href={`https://wa.me/${whatsapp.replace(/[^\d]/g, "")}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-sm text-green-700 hover:underline dark:text-green-400"><MessageCircle className="h-3.5 w-3.5" />WhatsApp</a> : null}
          {offer.sourceUrl ? <a href={offer.sourceUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"><ExternalLink className="h-3.5 w-3.5" />Source</a> : null}
        </div>
        <div className="border-t pt-3">
          <PracticalConfirmationActions offerId={offer.id} initialSummary={offer.confirmations} compact />
        </div>
      </CardContent>
    </Card>
  );
}