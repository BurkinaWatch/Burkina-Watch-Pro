import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Categorie, Signalement, Statut } from "@shared/schema";

interface SignalementStatusControlProps {
  signalementId: string;
  statut: Statut;
  categorie: Categorie;
  compact?: boolean;
}

const getStatutLabel = (statut: Statut, categorie?: Categorie) => {
  if (statut === "resolu" && categorie === "personne_recherchee") {
    return "Retrouvée";
  }

  const labels: Record<Statut, string> = {
    en_attente: "En attente",
    en_cours: "En cours",
    resolu: "Résolu",
    rejete: "Rejeté",
  };

  return labels[statut];
};

export default function SignalementStatusControl({
  signalementId,
  statut,
  categorie,
  compact = false,
}: SignalementStatusControlProps) {
  const { toast } = useToast();

  const mutation = useMutation({
    mutationFn: async (nextStatut: Statut) => {
      const res = await apiRequest("PATCH", `/api/signalements/${signalementId}/statut`, {
        statut: nextStatut,
      });
      return res.json() as Promise<Signalement>;
    },
    onSuccess: (updatedSignalement) => {
      queryClient.setQueryData([`/api/signalements/${signalementId}`], updatedSignalement);
      queryClient.invalidateQueries({ queryKey: ["/api/signalements"] });
      queryClient.invalidateQueries({ queryKey: [`/api/signalements/${signalementId}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user/signalements"] });
      toast({
        title: "Statut mis à jour",
        description: `Le signalement est maintenant ${getStatutLabel((updatedSignalement.statut || "en_attente") as Statut, categorie).toLowerCase()}.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error?.message || "Impossible de modifier le statut du signalement.",
        variant: "destructive",
      });
    },
  });

  const handleChange = (nextStatut: string) => {
    if (nextStatut === statut) return;
    mutation.mutate(nextStatut as Statut);
  };

  return (
    <div className={compact ? "w-full sm:w-48" : "w-full sm:w-56"} data-testid={`status-control-${signalementId}`}>
      <Select value={statut} onValueChange={handleChange} disabled={mutation.isPending}>
        <SelectTrigger data-testid={`select-status-${signalementId}`} className={compact ? "h-9 text-xs" : ""}>
          <SelectValue placeholder="Changer le statut" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="en_attente" data-testid={`option-status-en-attente-${signalementId}`}>{getStatutLabel("en_attente", categorie)}</SelectItem>
          <SelectItem value="en_cours" data-testid={`option-status-en-cours-${signalementId}`}>{getStatutLabel("en_cours", categorie)}</SelectItem>
          <SelectItem value="resolu" data-testid={`option-status-resolu-${signalementId}`}>{getStatutLabel("resolu", categorie)}</SelectItem>
          <SelectItem value="rejete" data-testid={`option-status-rejete-${signalementId}`}>{getStatutLabel("rejete", categorie)}</SelectItem>
        </SelectContent>
      </Select>
      {mutation.isPending && (
        <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground" data-testid={`status-updating-${signalementId}`}>
          <Loader2 className="h-3 w-3 animate-spin" />
          Mise à jour...
        </div>
      )}
    </div>
  );
}