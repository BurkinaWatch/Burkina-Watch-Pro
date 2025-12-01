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
import { AlertCircle, CheckCircle2, Clock, Users, FileText, Download } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

export default function Admin() {
  const signalements = [
    {
      id: "1",
      titre: "Accident de circulation",
      categorie: "urgence" as const,
      localisation: "Avenue Kwame Nkrumah",
      statut: "en_cours" as const,
      createdAt: new Date(Date.now() - 1000 * 60 * 15),
    },
    {
      id: "2",
      titre: "Déchets non collectés",
      categorie: "environnement" as const,
      localisation: "Secteur 15",
      statut: "en_attente" as const,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2),
    },
    {
      id: "3",
      titre: "Lampadaires défectueux",
      categorie: "infrastructure" as const,
      localisation: "Rue 13.25, Secteur 13",
      statut: "resolu" as const,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
    },
    {
      id: "4",
      titre: "Problème d'eau potable",
      categorie: "infrastructure" as const,
      localisation: "Secteur 22",
      statut: "en_cours" as const,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5),
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header showNotifications={false} />

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Tableau de bord administrateur</h1>
          <p className="text-muted-foreground">
            Gestion et suivi des signalements citoyens
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Signalements"
            value="1,247"
            icon={AlertCircle}
            description="+12 aujourd'hui"
            trend={{ value: 8, isPositive: true }}
          />
          <StatCard
            title="En attente"
            value="156"
            icon={Clock}
            description="Nécessitent attention"
          />
          <StatCard
            title="En cours"
            value="199"
            icon={FileText}
            description="En traitement"
          />
          <StatCard
            title="Résolus ce mois"
            value="892"
            icon={CheckCircle2}
            trend={{ value: 15, isPositive: true }}
          />
        </div>

        <Card className="mb-6">
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <CardTitle>Signalements récents</CardTitle>
              <Button variant="outline" size="sm" data-testid="button-export">
                <Download className="w-4 h-4 mr-2" />
                Exporter PDF
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Titre</TableHead>
                  <TableHead>Catégorie</TableHead>
                  <TableHead>Localisation</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {signalements.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.titre}</TableCell>
                    <TableCell>
                      <CategoryBadge categorie={item.categorie} />
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {item.localisation}
                    </TableCell>
                    <TableCell>
                      <StatutBadge statut={item.statut} />
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDistanceToNow(item.createdAt, { addSuffix: true, locale: fr })}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" data-testid={`button-respond-${item.id}`}>
                          Répondre
                        </Button>
                        {item.statut !== "resolu" && (
                          <Button variant="default" size="sm" data-testid={`button-resolve-${item.id}`}>
                            Résoudre
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Statistiques par catégorie</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CategoryBadge categorie="infrastructure" />
                    <span className="text-sm">Infrastructure</span>
                  </div>
                  <span className="font-bold">342</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CategoryBadge categorie="environnement" />
                    <span className="text-sm">Environnement</span>
                  </div>
                  <span className="font-bold">298</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CategoryBadge categorie="securite" />
                    <span className="text-sm">Sécurité</span>
                  </div>
                  <span className="font-bold">267</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CategoryBadge categorie="urgence" />
                    <span className="text-sm">Urgence</span>
                  </div>
                  <span className="font-bold">189</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Zones les plus actives</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Secteur 15, Ouagadougou</span>
                  <span className="font-bold">89</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Secteur 13, Ouagadougou</span>
                  <span className="font-bold">76</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Avenue Kwame Nkrumah</span>
                  <span className="font-bold">64</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Secteur 22, Ouagadougou</span>
                  <span className="font-bold">52</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
