import { useState } from "react";
import { Check, Flag, Loader2, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

export type PracticalConfirmationSummary = {
  confirm: number;
  report: number;
  contest: number;
  currentAction: string | null;
  state: "confirmed" | "reported" | "contested" | "mixed" | "unknown";
};

interface PracticalConfirmationActionsProps {
  offerId?: string;
  signalementId?: string;
  initialSummary?: PracticalConfirmationSummary;
  compact?: boolean;
}

const emptySummary: PracticalConfirmationSummary = {
  confirm: 0,
  report: 0,
  contest: 0,
  currentAction: null,
  state: "unknown",
};

export function PracticalConfirmationActions({
  offerId,
  signalementId,
  initialSummary = emptySummary,
  compact = false,
}: PracticalConfirmationActionsProps) {
  const { toast } = useToast();
  const [summary, setSummary] = useState(initialSummary);
  const [pendingAction, setPendingAction] = useState<string | null>(null);

  const submit = async (action: "confirm" | "report" | "contest") => {
    setPendingAction(action);
    try {
      const response = await apiRequest("POST", "/api/pratique/confirmations", {
        ...(offerId ? { offerId } : { signalementId }),
        action,
      });
      const next = await response.json() as PracticalConfirmationSummary;
      setSummary(next);
      await queryClient.invalidateQueries({ queryKey: ["/api/pratique/offers"] });
    } catch (error: any) {
      toast({
        title: "Action non enregistrée",
        description: error?.message || "Connectez-vous pour donner votre avis.",
        variant: "destructive",
      });
    } finally {
      setPendingAction(null);
    }
  };

  const stateLabel = summary.state === "mixed"
    ? "À confirmer"
    : summary.state === "confirmed"
      ? "Confirmée par la communauté"
      : summary.state === "reported"
        ? "Information signalée"
        : summary.state === "contested"
          ? "Information contestée"
          : null;

  return (
    <div className="space-y-2" data-testid="practical-confirmation-actions">
      {stateLabel ? (
        <p className="text-xs font-medium text-muted-foreground">{stateLabel} · les avis citoyens ne remplacent pas une vérification.</p>
      ) : null}
      <div className={`flex flex-wrap gap-2 ${compact ? "" : "items-center"}`}>
        <Button
          type="button"
          size="sm"
          variant={summary.currentAction === "confirm" ? "default" : "outline"}
          className="gap-1.5"
          disabled={Boolean(pendingAction)}
          onClick={() => void submit("confirm")}
        >
          {pendingAction === "confirm" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
          Confirmer {summary.confirm > 0 ? `(${summary.confirm})` : ""}
        </Button>
        <Button
          type="button"
          size="sm"
          variant={summary.currentAction === "report" ? "destructive" : "outline"}
          className="gap-1.5"
          disabled={Boolean(pendingAction)}
          onClick={() => void submit("report")}
        >
          {pendingAction === "report" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Flag className="h-3.5 w-3.5" />}
          Signaler {summary.report > 0 ? `(${summary.report})` : ""}
        </Button>
        <Button
          type="button"
          size="sm"
          variant={summary.currentAction === "contest" ? "secondary" : "ghost"}
          className="gap-1.5"
          disabled={Boolean(pendingAction)}
          onClick={() => void submit("contest")}
        >
          {pendingAction === "contest" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <TriangleAlert className="h-3.5 w-3.5" />}
          Contester {summary.contest > 0 ? `(${summary.contest})` : ""}
        </Button>
      </div>
    </div>
  );
}