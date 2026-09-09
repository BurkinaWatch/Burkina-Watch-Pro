import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  MapPin, 
  Users, 
  Building, 
  Check, 
  AlertTriangle, 
  Clock,
  ThumbsUp,
  Flag,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Calendar
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface ReliabilityBadgeProps {
  placeId: string;
  placeType: string;
  source: string;
  confidenceScore?: string | number;
  verificationStatus?: string;
  confirmations?: number;
  reports?: number;
  lastUpdated?: string | Date;
  showActions?: boolean;
  showDate?: boolean;
  size?: "sm" | "default" | "lg";
  layout?: "horizontal" | "vertical" | "compact";
}

export function ReliabilityBadge({
  placeId,
  placeType,
  source,
  confidenceScore,
  verificationStatus = "pending",
  confirmations = 0,
  reports = 0,
  lastUpdated,
  showActions = true,
  showDate = true,
  size = "default",
  layout = "horizontal"
}: ReliabilityBadgeProps) {
  const { toast } = useToast();
  const [localConfirmations, setLocalConfirmations] = useState(confirmations);
  const [localReports, setLocalReports] = useState(reports);
  const [hasConfirmed, setHasConfirmed] = useState(false);
  const [hasReported, setHasReported] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isReporting, setIsReporting] = useState(false);

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
          color: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800",
          description: "Donnees importees d'OpenStreetMap"
        };
      case "COMMUNAUTE":
        return {
          icon: Users,
          label: "Communaute",
          shortLabel: "Citoyen",
          color: "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800",
          description: "Signale par la communaute burkinabe"
        };
      case "OFFICIEL":
        return {
          icon: Building,
          label: "Officielle",
          shortLabel: "Officiel",
          color: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800",
          description: "Donnees officielles verifiees"
        };
      case "A_VERIFIER":
        return {
          icon: AlertTriangle,
          label: "A verifier",
          shortLabel: "A verifier",
          color: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800",
          description: "Information necessitant verification"
        };
      default:
        return {
          icon: MapPin,
          label: source || "Inconnue",
          shortLabel: source || "?",
          color: "bg-muted text-muted-foreground",
          description: "Source non specifiee"
        };
    }
  };

  const getReliabilityInfo = () => {
    if (confidence >= 0.8) {
      return {
        icon: ShieldCheck,
        label: "Elevee",
        color: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300",
        description: "Information hautement fiable"
      };
    } else if (confidence >= 0.5) {
      return {
        icon: Shield,
        label: "Moyenne",
        color: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300",
        description: "Information partiellement verifiee"
      };
    } else {
      return {
        icon: ShieldAlert,
        label: "Faible",
        color: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300",
        description: "Information a verifier"
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

  const formatDate = (date: string | Date | undefined) => {
    if (!date) return "Non disponible";
    const d = new Date(date);
    return d.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      year: "numeric"
    });
  };

  const handleConfirm = async () => {
    if (hasConfirmed) return;
    setIsConfirming(true);
    try {
      const response = await apiRequest("POST", `/api/places/${placeType}/${placeId}/confirm`);
      const data = await response.json();
      setLocalConfirmations(data.confirmations || localConfirmations + 1);
      setHasConfirmed(true);
      toast({
        title: "Merci pour votre confirmation",
        description: "Votre contribution aide la communaute burkinabe",
      });
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error?.message || "Impossible de confirmer. Reessayez plus tard.",
        variant: "destructive",
      });
    } finally {
      setIsConfirming(false);
    }
  };

  const handleReport = async () => {
    if (hasReported) return;
    setIsReporting(true);
    try {
      const response = await apiRequest("POST", `/api/places/${placeType}/${placeId}/report`);
      const data = await response.json();
      setLocalReports(data.reports || localReports + 1);
      setHasReported(true);
      toast({
        title: "Signalement enregistre",
        description: "Nous verifierons cette information",
      });
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error?.message || "Impossible de signaler. Reessayez plus tard.",
        variant: "destructive",
      });
    } finally {
      setIsReporting(false);
    }
  };

  const sourceInfo = getSourceInfo();
  const reliabilityInfo = getReliabilityInfo();
  const SourceIcon = sourceInfo.icon;
  const ReliabilityIcon = reliabilityInfo.icon;

  if (size === "sm" || layout === "compact") {
    return (
      <div className="flex flex-wrap items-center gap-1.5">
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="outline" className={`text-xs ${sourceInfo.color}`} data-testid="badge-source">
              <SourceIcon className="w-3 h-3 mr-1" />
              {sourceInfo.shortLabel}
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>{sourceInfo.description}</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="outline" className={`text-xs ${reliabilityInfo.color}`} data-testid="badge-reliability">
              <ReliabilityIcon className="w-3 h-3 mr-1" />
              {reliabilityInfo.label}
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>{reliabilityInfo.description}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {localConfirmations} confirmation{localConfirmations !== 1 ? "s" : ""}
            </p>
          </TooltipContent>
        </Tooltip>
      </div>
    );
  }

  return (
    <div className={`space-y-2 ${layout === "vertical" ? "" : ""}`}>
      <div className="flex flex-wrap items-center gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="outline" className={sourceInfo.color} data-testid="badge-source">
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
            <Badge variant="outline" className={reliabilityInfo.color} data-testid="badge-reliability">
              <ReliabilityIcon className="w-3.5 h-3.5 mr-1" />
              Fiabilite {reliabilityInfo.label}
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <div className="space-y-1">
              <p>{reliabilityInfo.description}</p>
              <p className="text-xs text-muted-foreground">
                Score: {Math.round(confidence * 100)}%
              </p>
            </div>
          </TooltipContent>
        </Tooltip>

        {showDate && lastUpdated && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge variant="outline" className="text-muted-foreground" data-testid="badge-date">
                <Calendar className="w-3.5 h-3.5 mr-1" />
                {formatDate(lastUpdated)}
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p>Derniere mise a jour</p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>

      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <ThumbsUp className="w-3 h-3" />
          {localConfirmations} confirmation{localConfirmations !== 1 ? "s" : ""}
        </span>
        <span className="text-muted-foreground/50">|</span>
        <span className="flex items-center gap-1">
          <Flag className="w-3 h-3" />
          {localReports} signalement{localReports !== 1 ? "s" : ""}
        </span>
      </div>

      {showActions && (
        <div className="flex flex-wrap gap-2 pt-1">
          <Button
            variant="outline"
            size="sm"
            onClick={handleConfirm}
            disabled={hasConfirmed || isConfirming}
            className={hasConfirmed ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300" : ""}
            data-testid="button-confirm"
          >
            <ThumbsUp className="w-3.5 h-3.5 mr-1.5" />
            {hasConfirmed ? "Confirme" : "Confirmer l'information"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleReport}
            disabled={hasReported || isReporting}
            className={hasReported ? "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300" : ""}
            data-testid="button-report"
          >
            <Flag className="w-3.5 h-3.5 mr-1.5" />
            {hasReported ? "Signale" : "Signaler une erreur"}
          </Button>
        </div>
      )}
    </div>
  );
}

export function TrustMessage({ variant = "default" }: { variant?: "default" | "sources" | "daily" }) {
  const messages = {
    default: {
      icon: ShieldCheck,
      text: "Informations verifiees quotidiennement",
      color: "text-green-600 dark:text-green-400"
    },
    sources: {
      icon: Building,
      text: "Sources officielles prioritaires",
      color: "text-blue-600 dark:text-blue-400"
    },
    daily: {
      icon: Clock,
      text: "Mise a jour reguliere des donnees",
      color: "text-muted-foreground"
    }
  };

  const message = messages[variant];
  const Icon = message.icon;

  return (
    <div className={`flex items-center gap-2 text-xs ${message.color}`}>
      <Icon className="w-3.5 h-3.5" />
      <span>{message.text}</span>
    </div>
  );
}
