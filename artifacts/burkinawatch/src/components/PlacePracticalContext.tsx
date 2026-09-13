import { useQuery } from "@tanstack/react-query";
import { CalendarDays, Gift, Eye, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { PracticalConfirmationActions, type PracticalConfirmationSummary } from "./PracticalConfirmationActions";
import type { Offer, Signalement } from "@shared/schema";

type OfferContext = Offer & {
  confirmations?: PracticalConfirmationSummary;
};

type SignalContext = Signalement & {
  signalType?: string | null;
  sourceName?: string | null;
  confirmations?: PracticalConfirmationSummary;
};

const signalLabels: Record<string, string> = {
  route_bloquee: "Route bloquée",
  travaux: "Travaux",
  inondation: "Inondation",
  embouteillage: "Embouteillage",
  etablissement_ferme: "Établissement fermé",
  service_indisponible: "Service indisponible",
  mobile_money_retrait: "Retrait Mobile Money",
  mobile_money_depot: "Dépôt Mobile Money",
  mobile_money_liquidite: "Liquidité Mobile Money",
};

export function PlacePracticalContext({
  placeId,
  freshness,
}: {
  placeId: string;
  freshness: { tone: "recent" | "confirm" | "old" | "contested"; label: string; detail: string };
}) {
  const { data: offers = [] } = useQuery<OfferContext[]>({
    queryKey: ["/api/pratique/offers", { placeId }],
    queryFn: async () => {
      const response = await fetch(`/api/pratique/offers?placeId=${encodeURIComponent(placeId)}&limit=3`);
      if (!response.ok) return [];
      return response.json();
    },
    staleTime: 60 * 1000,
  });

  const { data: signals = [] } = useQuery<SignalContext[]>({
    queryKey: ["/api/pratique/signals", { placeId }],
    queryFn: async () => {
      const response = await fetch(`/api/pratique/signals?placeId=${encodeURIComponent(placeId)}&limit=3`);
      if (!response.ok) return [];
      return response.json();
    },
    staleTime: 60 * 1000,
  });

  return (
    <div className="space-y-3 rounded-lg border border-emerald-900/10 bg-emerald-50/50 p-3 dark:bg-emerald-950/10" data-testid={`place-practical-context-${placeId}`}>
      <div>
        <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-emerald-900 dark:text-emerald-200">
          <ShieldCheck className="h-3.5 w-3.5" /> Contexte de sécurité
        </div>
        <div className={`rounded-md border p-2 text-xs ${
          freshness.tone === "recent"
            ? "border-green-200 bg-green-50 text-green-800 dark:border-green-900 dark:bg-green-950/30 dark:text-green-300"
            : freshness.tone === "contested"
              ? "border-red-200 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300"
              : freshness.tone === "old"
                ? "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-800 dark:bg-slate-950/30 dark:text-slate-300"
                : "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300"
        }`}>
          <p className="font-semibold">{freshness.label}</p>
          <p className="mt-0.5">{freshness.detail}</p>
          <p className="mt-1 opacity-80">Contexte indicatif, temporel et non garanti. Ce n’est pas un score de sécurité.</p>
        </div>
      </div>

      {offers.length ? (
        <div>
          <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-emerald-800 dark:text-emerald-300">
            <Gift className="h-3.5 w-3.5" /> Offres disponibles
          </div>
          <div className="space-y-2">
            {offers.map((offer) => (
              <div key={offer.id} className="border-l-2 border-amber-400 pl-2">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium">{offer.title}</p>
                  <Badge variant={offer.status === "ACTIVE" ? "default" : "secondary"} className="text-[10px]">
                    {offer.status === "ACTIVE" ? "Active" : "À vérifier"}
                  </Badge>
                </div>
                {offer.price !== null && offer.price !== undefined ? (
                  <p className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">{Number(offer.price).toLocaleString("fr-FR")} {offer.currency || "XOF"}</p>
                ) : null}
                <p className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground"><CalendarDays className="h-3 w-3" />{offer.endsAt ? `Valable jusqu’au ${new Date(offer.endsAt).toLocaleDateString("fr-FR")}` : "Date de fin inconnue"}</p>
                <div className="mt-2"><PracticalConfirmationActions offerId={offer.id} initialSummary={offer.confirmations} compact /></div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {signals.length ? (
        <div className={offers.length ? "border-t border-emerald-900/10 pt-3" : ""}>
          <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-sky-800 dark:text-sky-300">
            <Eye className="h-3.5 w-3.5" /> Signaux récents
          </div>
          <div className="space-y-2">
            {signals.map((signal) => (
              <div key={signal.id} className="border-l-2 border-sky-400 pl-2">
                <p className="text-sm font-medium">{signalLabels[signal.signalType || ""] || signal.titre}</p>
                <p className="line-clamp-2 text-xs text-muted-foreground">{signal.description}</p>
                <div className="mt-2"><PracticalConfirmationActions signalementId={signal.id} initialSummary={signal.confirmations} compact /></div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}