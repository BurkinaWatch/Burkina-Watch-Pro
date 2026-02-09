import Header from "@/components/Header";
import StatCard from "@/components/StatCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import CategoryBadge from "@/components/CategoryBadge";
import StatutBadge from "@/components/StatutBadge";
import { AlertCircle, CheckCircle2, Clock, Users, FileText, Download, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { useQuery } from "@tanstack/react-query";
import { Helmet } from "react-helmet-async";
import type { Signalement } from "@shared/schema";

interface AdminStats {
  totalSignalements: number;
  sosCount: number;
  totalUsers: number;
  onlineUsers: number;
}

export default function Admin() {
  const { data: stats, isLoading: statsLoading } = useQuery<AdminStats>({
    queryKey: ["/api/stats"],
    queryFn: async () => {
      const response = await fetch("/api/stats");
      if (!response.ok) throw new Error("Erreur stats");
      return response.json();
    },
  });

  const { data: signalements = [], isLoading: sigLoading } = useQuery<Signalement[]>({
    queryKey: ["/api/signalements"],
    queryFn: async () => {
      const response = await fetch("/api/signalements");
      if (!response.ok) throw new Error("Erreur signalements");
      return response.json();
    },
  });

  const enAttente = signalements.filter(s => s.statut === "en_attente").length;
  const enCours = signalements.filter(s => s.statut === "en_cours").length;
  const resolus = signalements.filter(s => s.statut === "resolu").length;

  const recentSignalements = signalements.slice(0, 10);

  const categoryCounts: Record<string, number> = {};
  signalements.forEach(s => {
    categoryCounts[s.categorie] = (categoryCounts[s.categorie] || 0) + 1;
  });

  const locationCounts: Record<string, number> = {};
  signalements.forEach(s => {
    const loc = s.localisation || "Non specifie";
    locationCounts[loc] = (locationCounts[loc] || 0) + 1;
  });
  const topLocations = Object.entries(locationCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 4);

  const isLoading = statsLoading || sigLoading;

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Administration - Burkina Watch</title>
        <meta name="description" content="Tableau de bord administrateur pour la gestion des signalements citoyens au Burkina Faso." />
      </Helmet>
      <Header showNotifications={false} />

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Tableau de bord administrateur</h1>
          <p className="text-muted-foreground">
            Gestion et suivi des signalements citoyens
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <span className="ml-3 text-muted-foreground">Chargement des donnees...</span>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <StatCard
                title="Total Signalements"
                value={stats?.totalSignalements || 0}
                icon={AlertCircle}
                description="Dans la base de donnees"
                trend={signalements.length > 0 ? "up" : "neutral"}
              />
              <StatCard
                title="En attente"
                value={enAttente}
                icon={Clock}
                description="Necessitent attention"
              />
              <StatCard
                title="En cours"
                value={enCours}
                icon={FileText}
                description="En traitement"
              />
              <StatCard
                title="Resolus"
                value={resolus}
                icon={CheckCircle2}
                trend={resolus > 0 ? "up" : "neutral"}
              />
            </div>

            <Card className="mb-6">
              <CardHeader>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <CardTitle>Signalements recents</CardTitle>
                  <Button variant="outline" size="sm" data-testid="button-export">
                    <Download className="w-4 h-4 mr-2" />
                    Exporter PDF
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {recentSignalements.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    Aucun signalement pour le moment
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Titre</TableHead>
                        <TableHead>Categorie</TableHead>
                        <TableHead>Localisation</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recentSignalements.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">{item.titre}</TableCell>
                          <TableCell>
                            <CategoryBadge categorie={item.categorie as any} />
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {item.localisation || "Non specifie"}
                          </TableCell>
                          <TableCell>
                            <StatutBadge statut={item.statut as any} />
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {item.createdAt ? formatDistanceToNow(new Date(item.createdAt), { addSuffix: true, locale: fr }) : "-"}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button variant="outline" size="sm" data-testid={`button-respond-${item.id}`}>
                                Repondre
                              </Button>
                              {item.statut !== "resolu" && (
                                <Button variant="default" size="sm" data-testid={`button-resolve-${item.id}`}>
                                  Resoudre
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Statistiques par categorie</CardTitle>
                </CardHeader>
                <CardContent>
                  {Object.keys(categoryCounts).length === 0 ? (
                    <p className="text-center text-muted-foreground py-4">Aucune donnee</p>
                  ) : (
                    <div className="space-y-4">
                      {Object.entries(categoryCounts)
                        .sort(([, a], [, b]) => b - a)
                        .map(([cat, count]) => (
                          <div key={cat} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <CategoryBadge categorie={cat as any} />
                              <span className="text-sm capitalize">{cat}</span>
                            </div>
                            <span className="font-bold">{count}</span>
                          </div>
                        ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Zones les plus actives</CardTitle>
                </CardHeader>
                <CardContent>
                  {topLocations.length === 0 ? (
                    <p className="text-center text-muted-foreground py-4">Aucune donnee</p>
                  ) : (
                    <div className="space-y-4">
                      {topLocations.map(([loc, count]) => (
                        <div key={loc} className="flex items-center justify-between">
                          <span className="text-sm">{loc}</span>
                          <span className="font-bold">{count}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
