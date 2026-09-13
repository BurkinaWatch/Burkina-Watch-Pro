import { useQuery } from "@tanstack/react-query";
import { CalendarDays, Gift, Eye, ShieldCheck, AlertTriangle, Info } from "lucide-react";
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

type SecurityEntry = {
  id?: string;
  title?: string | null;
  label?: string | null;
  value?: string | null;
  description?: string | null;
  source?: string | null;
  sourceName?: string | null;
  sourceLabel?: string | null;
  status?: string | null;
  freshness?: string | null;
  freshnessLabel?: string | null;
  observedAt?: string | Date | null;
  occurredAt?: string | Date | null;
  createdAt?: string | Date | null;
  lastUpdatedAt?: string | Date | null;
};

type SecurityContext = {
  perceptions?: SecurityEntry[];
  signals?: SecurityEntry[];
  incidents?: SecurityEntry[];
  source?: string | null;
  status?: string | null;
  freshness?: string | null;
  hasRecentData?: boolean | null;
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

const toFrenchStatus = (status?: string | null) => {
  if (!status) return null;
  const labels: Record<string, string> = {
    VERIFIED: "Vérifié",
    CONFIRMED: "Confirmé",
    ACTIVE: "Actif",
    OPEN: "Ouvert",
    CLOSED: "Clôturé",
    RESOLVED: "Résolu",
    PENDING: "En attente",
    UNVERIFIED: "Non vérifié",
  };
  return labels[status.toUpperCase()] || status;
};

const toFrenchFreshness = (freshness?: string | null) => {
  if (!freshness) return null;
  const labels: Record<string, string> = {
    RECENT: "Récente",
    FRESH: "Récente",
    OLD: "Ancienne",
    STALE: "Ancienne",
    UNKNOWN: "Inconnue",
  };
  return labels[freshness.toUpperCase()] || freshness;
};

const formatDate = (value?: string | Date | null) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toLocaleDateString("fr-FR");
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

  const { data: securityContext } = useQuery<SecurityContext | null>({
    queryKey: ["/api/places/security-context", placeId],
    queryFn: async () => {
      const response = await fetch(`/api/places/${encodeURIComponent(placeId)}/security-context`);
      if (!response.ok) return null;
      const payload = await response.json();
      return payload?.data || payload || null;
    },
    staleTime: 60 * 1000,
  });

  const securitySections = [
    { key: "perceptions", label: "PERCEPTIONS", entries: securityContext?.perceptions || [], icon: Info, tone: "border-violet-400", titleTone: "text-violet-800 dark:text-violet-300" },
    { key: "signals", label: "SIGNAUX", entries: securityContext?.signals || [], icon: Eye, tone: "border-sky-400", titleTone: "text-sky-800 dark:text-sky-300" },
    { key: "incidents", label: "INCIDENTS", entries: securityContext?.incidents || [], icon: AlertTriangle, tone: "border-red-400", titleTone: "text-red-800 dark:text-red-300" },
  ] as const;
  const hasSecurityContext = Boolean(securityContext);
  const hasRecentSecurityData = securityContext?.hasRecentData !== false && (
    Boolean(securityContext?.freshness) || securitySections.some((section) =>
      section.entries.some((entry) => Boolean(entry.observedAt || entry.occurredAt || entry.createdAt)),
    )
  );

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

      {hasSecurityContext ? (
        <div className="space-y-3 border-t border-emerald-900/10 pt-3" aria-labelledby={`security-context-title-${placeId}`}>
          <div>
            <div id={`security-context-title-${placeId}`} className="flex items-center gap-1.5 text-xs font-semibold text-emerald-900 dark:text-emerald-200">
              <ShieldCheck className="h-3.5 w-3.5" /> Repères de sécurité du lieu
            </div>
            <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
              {securityContext?.source ? <span>Source : {securityContext.source}</span> : null}
              {securityContext?.status ? <span>Statut : {toFrenchStatus(securityContext.status)}</span> : null}
              {securityContext?.freshness ? <span>Fraîcheur : {toFrenchFreshness(securityContext.freshness)}</span> : null}
            </div>
            {!hasRecentSecurityData ? (
              <p className="mt-2 rounded-md border border-amber-200 bg-amber-50 p-2 text-xs text-amber-900 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
                Peu de données récentes disponibles
              </p>
            ) : null}
          </div>
          {securitySections.map((section) => section.entries.length ? (
            <section key={section.key} aria-labelledby={`security-${section.key}-${placeId}`}>
              <h4 id={`security-${section.key}-${placeId}`} className={`mb-2 flex items-center gap-1.5 text-xs font-semibold ${section.titleTone}`}>
                <section.icon className="h-3.5 w-3.5" /> {section.label}
              </h4>
              <div className="space-y-2">
                {section.entries.map((entry, index) => {
                  const date = formatDate(entry.observedAt || entry.occurredAt || entry.lastUpdatedAt || entry.createdAt);
                  const source = entry.sourceLabel || entry.sourceName || entry.source;
                  const entryFreshness = toFrenchFreshness(entry.freshnessLabel || entry.freshness);
                  return (
                    <div key={entry.id || `${section.key}-${index}`} className={`border-l-2 ${section.tone} pl-2`}>
                      <p className="text-sm font-medium">{entry.title || entry.label || entry.value || "Information disponible"}</p>
                      {entry.description ? <p className="line-clamp-3 text-xs text-muted-foreground">{entry.description}</p> : null}
                      <p className="mt-1 flex flex-wrap gap-x-2 gap-y-0.5 text-[11px] text-muted-foreground">
                        {source ? <span>Source : {source}</span> : null}
                        {entry.status ? <span>Statut : {toFrenchStatus(entry.status)}</span> : null}
                        {entryFreshness ? <span>Fraîcheur : {entryFreshness}</span> : null}
                        {date ? <span>Actualisé : {date}</span> : null}
                      </p>
                    </div>
                  );
                })}
              </div>
            </section>
          ) : null)}
          <p className="text-[11px] text-muted-foreground">
            Ces éléments sont indicatifs et temporels : ils ne constituent ni une garantie de sécurité ni un score.
          </p>
        </div>
      ) : null}

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
            <Eye className="h-3.5 w-3.5" /> Signaux pratiques récents
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