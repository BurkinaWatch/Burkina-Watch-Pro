import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ThumbsUp, Flag, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface LocationValidatorProps {
  placeId: string;
  initialConfirmations?: number;
  initialReports?: number;
  compact?: boolean;
}

export function LocationValidator({
  placeId,
  initialConfirmations = 0,
  initialReports = 0,
}: LocationValidatorProps) {
  const { toast } = useToast();
  const [confirmations, setConfirmations] = useState(initialConfirmations);
  const [reports, setReports] = useState(initialReports);
  const [confirmed, setConfirmed] = useState(false);
  const [reported, setReported] = useState(false);
  const [loading, setLoading] = useState<"confirm" | "report" | null>(null);

  if (!placeId) return null;

  const handleAction = async (action: "confirm" | "report") => {
    if ((action === "confirm" && confirmed) || (action === "report" && reported) || loading) return;
    setLoading(action);
    try {
      const res = await fetch(`/api/places/${placeId}/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));

      if (res.ok && data.success) {
        if (action === "confirm") {
          setConfirmations((c) => c + 1);
          setConfirmed(true);
          toast({ title: "Localisation confirmee", description: "Merci pour votre contribution !" });
        } else {
          setReports((r) => r + 1);
          setReported(true);
          toast({ title: "Signalement enregistre", description: "Merci, nous allons verifier cette localisation." });
        }
      } else if (res.status === 400) {
        if (action === "confirm") setConfirmed(true);
        else setReported(true);
        toast({
          title: action === "confirm" ? "Deja confirme" : "Deja signale",
          description: data.error || "Vous avez deja effectue cette action.",
          variant: "destructive",
        });
      } else {
        toast({ title: "Erreur", description: data.error || "Action impossible pour le moment.", variant: "destructive" });
      }
    } catch {
      toast({ title: "Erreur", description: "Verifiez votre connexion et reessayez.", variant: "destructive" });
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="flex flex-col gap-2" data-testid={`location-validator-${placeId}`}>
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <ThumbsUp className="w-3.5 h-3.5" />
          {confirmations} confirmation{confirmations !== 1 ? "s" : ""}
        </span>
        <span className="text-muted-foreground/40">|</span>
        <span className="flex items-center gap-1.5">
          <Flag className="w-3.5 h-3.5" />
          {reports} signalement{reports !== 1 ? "s" : ""}
        </span>
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        <Button
          variant={confirmed ? "default" : "outline"}
          size="sm"
          onClick={() => handleAction("confirm")}
          disabled={confirmed || loading !== null}
          className="gap-1.5 text-xs"
          data-testid={`button-confirm-${placeId}`}
        >
          {loading === "confirm" ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <ThumbsUp className="w-3.5 h-3.5" />
          )}
          {confirmed ? "Confirme" : "Confirmer"}
        </Button>
        <Button
          variant={reported ? "destructive" : "outline"}
          size="sm"
          onClick={() => handleAction("report")}
          disabled={reported || loading !== null}
          className="gap-1.5 text-xs"
          data-testid={`button-report-${placeId}`}
        >
          {loading === "report" ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Flag className="w-3.5 h-3.5" />
          )}
          {reported ? "Signale" : "Signaler une erreur"}
        </Button>
      </div>
    </div>
  );
}
