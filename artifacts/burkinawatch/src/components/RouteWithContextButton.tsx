import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, Navigation } from "lucide-react";
import type { Signalement } from "@shared/schema";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

type RouteSignal = Signalement & {
  signalType?: string | null;
  freshnessExpiresAt?: string | Date | null;
};

const relevantTypes = new Set([
  "travaux",
  "acces_difficile",
  "inondation",
  "route_bloquee",
  "embouteillage",
]);

const labels: Record<string, string> = {
  travaux: "Travaux signalés",
  acces_difficile: "Accès perturbé",
  inondation: "Inondation signalée",
  route_bloquee: "Route bloquée signalée",
  embouteillage: "Embouteillage signalé",
};

function formatDate(value: string | Date | null | undefined) {
  if (!value) return "date inconnue";
  return new Date(value).toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short" });
}

export function RouteWithContextButton({
  placeId,
  latitude,
  longitude,
}: {
  placeId: string;
  latitude: string;
  longitude: string;
}) {
  const [showWarning, setShowWarning] = useState(false);
  const { data: signals = [] } = useQuery<RouteSignal[]>({
    queryKey: ["/api/pratique/signals", { placeId, route: true }],
    queryFn: async () => {
      const response = await fetch(`/api/pratique/signals?placeId=${encodeURIComponent(placeId)}&limit=8`);
      if (!response.ok) return [];
      return response.json();
    },
    staleTime: 60 * 1000,
  });

  const relevantSignals = signals.filter((signal) => relevantTypes.has(signal.signalType || ""));
  const openMaps = () => {
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="space-y-2">
      {showWarning && relevantSignals.length > 0 ? (
        <Alert className="border-amber-300 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/20">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Contexte du trajet à vérifier</AlertTitle>
          <AlertDescription className="space-y-2">
            {relevantSignals.map((signal) => (
              <p key={signal.id}>
                <strong>{labels[signal.signalType || ""] || "Événement pertinent"}</strong>
                {" · "}
                {formatDate(signal.createdAt)}
                {signal.description ? ` — ${signal.description}` : ""}
              </p>
            ))}
            <div className="flex flex-wrap gap-2 pt-1">
              <Button size="sm" onClick={openMaps}>Continuer vers l’itinéraire</Button>
              <Button size="sm" variant="ghost" onClick={() => setShowWarning(false)}>Annuler</Button>
            </div>
          </AlertDescription>
        </Alert>
      ) : null}
      <Button
        onClick={() => relevantSignals.length > 0 ? setShowWarning(true) : openMaps()}
        className="w-full gap-2"
        variant="default"
      >
        <Navigation className="h-4 w-4" />
        Itinéraire
      </Button>
    </div>
  );
}