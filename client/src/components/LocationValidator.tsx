import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ThumbsUp, AlertTriangle, Loader2 } from "lucide-react";
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
  compact = false,
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

  const renderButtons = (iconSize: string, textSize: string) => (
    <>
      <Button
        variant={confirmed ? "default" : "outline"}
        size="sm"
        onClick={() => handleAction("confirm")}
        disabled={confirmed || loading !== null}
        className={`gap-1.5 ${textSize}`}
        data-testid={`button-confirm-${placeId}`}
      >
        {loading === "confirm" ? (
          <Loader2 className={`${iconSize} animate-spin`} />
        ) : (
          <ThumbsUp className={iconSize} />
        )}
        {confirmed ? "Confirme" : "Valider"}
        {confirmations > 0 && (
          <Badge variant="secondary" className="ml-1 text-[10px] px-1 py-0 h-4">{confirmations}</Badge>
        )}
      </Button>
      <Button
        variant={reported ? "destructive" : "outline"}
        size="sm"
        onClick={() => handleAction("report")}
        disabled={reported || loading !== null}
        className={`gap-1.5 ${textSize}`}
        data-testid={`button-report-${placeId}`}
      >
        {loading === "report" ? (
          <Loader2 className={`${iconSize} animate-spin`} />
        ) : (
          <AlertTriangle className={iconSize} />
        )}
        {reported ? "Signale" : "Signaler"}
        {reports > 0 && (
          <Badge variant="secondary" className="ml-1 text-[10px] px-1 py-0 h-4">{reports}</Badge>
        )}
      </Button>
    </>
  );

  return (
    <div className="flex items-center gap-2 flex-wrap" data-testid={`location-validator-${placeId}`}>
      {!compact && <span className="text-xs text-muted-foreground mr-1">Localisation correcte ?</span>}
      {renderButtons(compact ? "w-3.5 h-3.5" : "w-4 h-4", compact ? "text-xs" : "")}
    </div>
  );
}
