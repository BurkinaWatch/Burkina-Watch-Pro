import { CalendarDays, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Signalement } from "@shared/schema";
import { PracticalConfirmationActions, type PracticalConfirmationSummary } from "./PracticalConfirmationActions";

type PracticalSignal = Signalement & {
  signalType?: string | null;
  sourceType?: string | null;
  sourceName?: string | null;
  expiresAt?: string | Date | null;
  freshnessExpiresAt?: string | Date | null;
  confirmations?: PracticalConfirmationSummary;
};

const signalLabels: Record<string, string> = {
  route_bloquee: "Route bloquée",
  travaux: "Travaux",
  inondation: "Inondation",
  embouteillage: "Embouteillage",
  acces_difficile: "Accès difficile",
  etablissement_ferme: "Établissement fermé",
  service_indisponible: "Service indisponible",
  information_contestee: "Information contestée",
  mobile_money_retrait: "Retrait Mobile Money",
  mobile_money_depot: "Dépôt Mobile Money",
  mobile_money_liquidite: "Liquidité Mobile Money",
};

function formatDate(value: string | Date | null | undefined) {
  if (!value) return "date inconnue";
  return new Date(value).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
}

export function PracticalSignalCard({ signal }: { signal: PracticalSignal }) {
  const label = signalLabels[signal.signalType || ""] || signal.titre || "Signal citoyen";
  const source = signal.sourceName || (signal.sourceType === "OFFICIAL" ? "Page officielle" : "Utilisateur BurkinaWatch");
  const isFresh = signal.freshnessExpiresAt ? new Date(signal.freshnessExpiresAt).getTime() > Date.now() : true;

  return (
    <Card className="border-sky-900/10" data-testid={`card-practical-signal-${signal.id}`}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base leading-tight">{label}</CardTitle>
          <Badge variant={isFresh ? "default" : "secondary"}>{isFresh ? "Récent" : "À actualiser"}</Badge>
        </div>
        <p className="text-xs text-muted-foreground">Source : {source}</p>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm leading-5 text-muted-foreground">{signal.description}</p>
        <div className="space-y-1 text-xs text-muted-foreground">
          <p className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" />{signal.localisation || "Localisation à confirmer"}</p>
          <p className="flex items-center gap-1.5"><CalendarDays className="h-3.5 w-3.5" />Publié le {formatDate(signal.createdAt)}</p>
        </div>
        <div className="border-t pt-3">
          <PracticalConfirmationActions signalementId={signal.id} initialSummary={signal.confirmations} compact />
        </div>
      </CardContent>
    </Card>
  );
}