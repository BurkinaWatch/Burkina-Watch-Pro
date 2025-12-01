import { Badge } from "@/components/ui/badge";
import type { Statut } from "@shared/schema";
import { Clock, CheckCircle2, AlertCircle, XCircle } from "lucide-react";

const statutConfig: Record<Statut, { label: string; icon: typeof Clock; className: string }> = {
  en_attente: { label: "En attente", icon: Clock, className: "bg-gray-500 text-white" },
  en_cours: { label: "En cours", icon: AlertCircle, className: "bg-blue-600 text-white" },
  resolu: { label: "Résolu", icon: CheckCircle2, className: "bg-category-securite text-white" },
  rejete: { label: "Rejeté", icon: XCircle, className: "bg-gray-400 text-white" },
};

interface StatutBadgeProps {
  statut: Statut;
  showIcon?: boolean;
  className?: string;
}

export default function StatutBadge({ statut, showIcon = true, className = "" }: StatutBadgeProps) {
  const config = statutConfig[statut];
  const Icon = config.icon;
  
  return (
    <Badge className={`${config.className} ${className} no-default-hover-elevate no-default-active-elevate`}>
      {showIcon && <Icon className="w-3 h-3 mr-1" />}
      {config.label}
    </Badge>
  );
}
