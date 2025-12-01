
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Shield, AlertTriangle, XCircle } from "lucide-react";
import { useTranslation } from "react-i18next";

interface ModerationDialogProps {
  open: boolean;
  severity: "warning" | "blocked";
  flaggedWords: string[];
  reason?: string;
  suggestion?: string;
  onTryAgain: () => void;
  onCancel: () => void;
}

export default function ModerationDialog({
  open,
  severity,
  flaggedWords,
  reason,
  suggestion,
  onTryAgain,
  onCancel,
}: ModerationDialogProps) {
  const { t } = useTranslation();

  const icon = severity === "blocked" 
    ? <XCircle className="w-12 h-12 text-destructive" />
    : <AlertTriangle className="w-12 h-12 text-orange-500" />;

  const title = severity === "blocked" 
    ? t("moderation.blockedTitle")
    : t("moderation.warningTitle");

  return (
    <AlertDialog open={open}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
              {icon}
            </div>
          </div>
          <AlertDialogTitle className="text-center text-xl">
            <Shield className="w-5 h-5 inline mr-2 text-primary" />
            {t("moderation.title")}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-center pt-4">
            <p className="text-base mb-4">{title}</p>
            <p className="text-sm text-muted-foreground mb-4">
              {severity === "blocked" 
                ? t("moderation.blockedMessage")
                : t("moderation.warningMessage")}
            </p>
            
            {reason && (
              <div className="bg-muted p-3 rounded-lg text-left mb-4">
                <p className="text-xs font-semibold mb-1">
                  {t("moderation.reason")}:
                </p>
                <p className="text-sm">{reason}</p>
              </div>
            )}

            {suggestion && (
              <div className="bg-primary/10 p-3 rounded-lg text-left">
                <p className="text-xs font-semibold mb-1 text-primary">
                  💡 {t("moderation.suggestion")}:
                </p>
                <p className="text-sm italic">{suggestion}</p>
              </div>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
          <AlertDialogCancel onClick={onCancel}>
            {t("moderation.cancel")}
          </AlertDialogCancel>
          {severity === "warning" && (
            <AlertDialogAction onClick={onTryAgain} className="bg-primary">
              {t("moderation.tryAgain")}
            </AlertDialogAction>
          )}
          {severity === "blocked" && (
            <AlertDialogAction onClick={onCancel} className="bg-destructive">
              {t("common.close")}
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
