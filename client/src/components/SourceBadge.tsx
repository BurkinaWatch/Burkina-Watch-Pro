import { Badge } from "@/components/ui/badge";
import { 
  MapPin, 
  Users, 
  Building, 
  Check, 
  AlertTriangle, 
  Clock 
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface SourceBadgeProps {
  source: string;
  confidenceScore?: string | number;
  verificationStatus?: string;
  confirmations?: number;
  reports?: number;
  showConfidence?: boolean;
  size?: "sm" | "default";
}

export function SourceBadge({
  source,
  confidenceScore,
  verificationStatus = "pending",
  confirmations = 0,
  reports = 0,
  showConfidence = false,
  size = "default"
}: SourceBadgeProps) {
  const confidence = typeof confidenceScore === "string" 
    ? parseFloat(confidenceScore) 
    : confidenceScore ?? 0.5;

  const getSourceInfo = () => {
    switch (source) {
      case "OSM":
        return {
          icon: MapPin,
          label: "OpenStreetMap",
          shortLabel: "OSM",
          variant: "secondary" as const,
          description: "Donnees importees d'OpenStreetMap"
        };
      case "COMMUNAUTE":
        return {
          icon: Users,
          label: "Communaute",
          shortLabel: "Citoyen",
          variant: "outline" as const,
          description: "Signale par la communaute"
        };
      case "OFFICIEL":
        return {
          icon: Building,
          label: "Officiel",
          shortLabel: "Officiel",
          variant: "default" as const,
          description: "Donnees officielles verifiees"
        };
      default:
        return {
          icon: MapPin,
          label: source,
          shortLabel: source,
          variant: "secondary" as const,
          description: "Source inconnue"
        };
    }
  };

  const getVerificationInfo = () => {
    switch (verificationStatus) {
      case "verified":
        return {
          icon: Check,
          color: "text-green-600 dark:text-green-400",
          bgColor: "bg-green-100 dark:bg-green-900/30",
          label: "Verifie"
        };
      case "needs_review":
        return {
          icon: AlertTriangle,
          color: "text-yellow-600 dark:text-yellow-400",
          bgColor: "bg-yellow-100 dark:bg-yellow-900/30",
          label: "A verifier"
        };
      default:
        return {
          icon: Clock,
          color: "text-muted-foreground",
          bgColor: "bg-muted",
          label: "En attente"
        };
    }
  };

  const sourceInfo = getSourceInfo();
  const verificationInfo = getVerificationInfo();
  const SourceIcon = sourceInfo.icon;
  const VerificationIcon = verificationInfo.icon;

  const confidencePercent = Math.round(confidence * 100);
  const confidenceColor = confidence >= 0.8 
    ? "text-green-600" 
    : confidence >= 0.6 
      ? "text-yellow-600" 
      : "text-red-600";

  if (size === "sm") {
    return (
      <div className="flex items-center gap-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant={sourceInfo.variant} className="text-xs px-1.5 py-0.5">
              <SourceIcon className="w-3 h-3 mr-1" />
              {sourceInfo.shortLabel}
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>{sourceInfo.description}</p>
            {showConfidence && (
              <p className={confidenceColor}>Fiabilite: {confidencePercent}%</p>
            )}
          </TooltipContent>
        </Tooltip>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant={sourceInfo.variant} data-testid="badge-source">
            <SourceIcon className="w-3.5 h-3.5 mr-1" />
            {sourceInfo.label}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p>{sourceInfo.description}</p>
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Badge 
            variant="outline" 
            className={`${verificationInfo.bgColor} ${verificationInfo.color}`}
            data-testid="badge-verification"
          >
            <VerificationIcon className="w-3.5 h-3.5 mr-1" />
            {verificationInfo.label}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <div className="space-y-1">
            <p>Statut de verification</p>
            <p className="text-xs text-muted-foreground">
              {confirmations} confirmation{confirmations !== 1 ? "s" : ""} | {reports} signalement{reports !== 1 ? "s" : ""}
            </p>
          </div>
        </TooltipContent>
      </Tooltip>

      {showConfidence && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="outline" className={confidenceColor} data-testid="badge-confidence">
              {confidencePercent}%
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>Score de fiabilite des donnees</p>
          </TooltipContent>
        </Tooltip>
      )}
    </div>
  );
}
