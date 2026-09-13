import { CalendarDays, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export type PublicSourceItem = {
  id: string;
  title: string;
  description: string;
  sourceName: string;
  sourceUrl: string;
  publishedAt: string | null;
};

function formatDate(value: string | null) {
  if (!value) return "date inconnue";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "date inconnue" : date.toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
}

export function PublicSourceCard({ item }: { item: PublicSourceItem }) {
  return (
    <Card className="border-sky-900/10" data-testid={`card-public-source-${item.id}`}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-3">
          <CardTitle className="text-base leading-tight">{item.title}</CardTitle>
          <Badge variant="secondary">Source publique</Badge>
        </div>
        <p className="text-xs text-muted-foreground">Source : {item.sourceName}</p>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm leading-5 text-muted-foreground">{item.description}</p>
        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5"><CalendarDays className="h-3.5 w-3.5" />Publié le {formatDate(item.publishedAt)}</span>
          <a href={item.sourceUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-primary hover:underline">
            <ExternalLink className="h-3.5 w-3.5" />Voir la source
          </a>
        </div>
        <p className="rounded-md border border-sky-200 bg-sky-50/70 p-2 text-xs text-sky-900 dark:border-sky-900/60 dark:bg-sky-950/20 dark:text-sky-200">
          Cette information externe doit être vérifiée auprès de la source avant toute décision.
        </p>
      </CardContent>
    </Card>
  );
}