import { AlertTriangle, CheckCircle2, Clock3 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface VerificationBadgeProps {
  mode?: string | null;
  status?: string | null;
  score?: number | string | null;
}

export default function VerificationBadge({
  mode,
  status,
  score,
}: VerificationBadgeProps) {
  if (mode === "pending" || status === "pending" || (!mode && !status)) {
    return (
      <Badge
        variant="outline"
        className="gap-1 border-muted-foreground/30 text-muted-foreground"
        title="La vérification automatique est en cours."
        data-testid="badge-verification-pending"
      >
        <Clock3 className="h-3.5 w-3.5" />
        Vérification en cours
      </Badge>
    );
  }

  if (mode === "fallback") {
    return (
      <Badge
        variant="outline"
        className="gap-1 border-amber-500/50 text-amber-700 dark:text-amber-300"
        title="Ce résultat utilise un score de secours. Il doit être interprété avec prudence."
        data-testid="badge-verification-fallback"
      >
        <AlertTriangle className="h-3.5 w-3.5" />
        Score de secours{score != null ? ` · ${score}/100` : ""}
      </Badge>
    );
  }

  return (
    <Badge
      variant="outline"
      className="gap-1 border-emerald-500/50 text-emerald-700 dark:text-emerald-300"
      title="Ce résultat provient de l'analyse automatique complète."
      data-testid="badge-verification-full"
    >
      <CheckCircle2 className="h-3.5 w-3.5" />
      Analyse complète{score != null ? ` · ${score}/100` : ""}
    </Badge>
  );
}