import { Card, CardContent } from "@/components/ui/card";
import { Lightbulb, Quote, Sparkles, RefreshCw } from "lucide-react";
import { getMessageDuJour } from "@/lib/messagesDuJour";
import { useState } from "react";
import { useTranslation } from "react-i18next";

const iconMap = {
  proverbe: Quote,
  conseil: Lightbulb,
  encouragement: Sparkles,
};

export default function MessageDuJour() {
  const { t } = useTranslation();
  const [refresh, setRefresh] = useState(0);
  const message = getMessageDuJour(refresh);
  const Icon = iconMap[message.type];

  const handleRefresh = () => {
    setRefresh(prev => prev + 1);
  };

  return (
    <Card 
      className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 hover-elevate cursor-pointer" 
      data-testid="card-message-du-jour"
      onClick={handleRefresh}
    >
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Icon className="w-6 h-6 text-primary" />
            </div>
          </div>
          <div className="flex-1 relative">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-semibold text-sm uppercase tracking-wide text-primary">
                {t(`messageDuJour.${message.type}`)}
              </h3>
            </div>
            <blockquote className="text-foreground text-lg font-medium leading-relaxed italic">
              "{message.texte}"
            </blockquote>
            {message.auteur && (
              <p className="text-sm text-muted-foreground mt-3">
                — {message.auteur}
              </p>
            )}
            <div className="absolute top-0 right-0">
              <RefreshCw className="w-4 h-4 text-primary/50 hover:text-primary transition-colors" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
