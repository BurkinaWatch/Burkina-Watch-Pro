import { Helmet } from "react-helmet-async";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import SignalementCard from "@/components/SignalementCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, Users, HelpCircle, Loader2 } from "lucide-react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import type { Signalement } from "@shared/schema";
import { useMemo } from "react";

export default function SOS() {
  const { data: signalements, isLoading } = useQuery<Signalement[]>({
    queryKey: ["/api/signalements"],
  });

  // Filtrer les signalements selon les onglets
  const { urgences, demandesAide, personnesRecherchees } = useMemo(() => {
    if (!signalements) {
      return { urgences: [], demandesAide: [], personnesRecherchees: [] };
    }

    // Urgences: tous les signalements SOS
    const urgences = signalements.filter((s) => s.isSOS === true && s.categorie !== "personne_recherchee");

    // Demandes d'aide: signalements non-SOS qui ne sont pas des personnes recherchées
    const demandesAide = signalements.filter((s) => s.isSOS === false && s.categorie !== "personne_recherchee");

    // Personnes recherchées: catégorie spécifique
    const personnesRecherchees = signalements.filter((s) => s.categorie === "personne_recherchee");

    return { urgences, demandesAide, personnesRecherchees };
  }, [signalements]);

  return (
    <div className="min-h-screen bg-background pb-24">
      <Helmet>
        <title>Urgences SOS - Burkina Watch</title>
      </Helmet>
      <Header />

      <div className="max-w-7xl mx-auto px-4 py-6">
        <Card className="mb-6 bg-destructive/5 border-destructive/20">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-6 h-6 text-destructive" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold mb-2">Centre SOS - Assistance & Urgences</h2>
                <p className="text-muted-foreground mb-4">
                  Signalez une urgence ou apportez votre aide à ceux qui en ont besoin
                </p>
                <Link href="/sos/publier">
                  <Button variant="destructive" size="lg" data-testid="button-launch-sos">
                    <AlertCircle className="w-4 h-4 mr-2" />
                    Lancer un SOS
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <Tabs defaultValue="urgences" className="w-full">
            <TabsList className="w-full justify-start mb-6 gap-1">
              <TabsTrigger value="urgences" data-testid="tab-urgences" className="text-xs sm:text-sm px-2 sm:px-3 flex-1 sm:flex-none">
                <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Urgences signalées</span>
                <span className="sm:hidden">Urgences</span>
                <span className="ml-1.5 px-1.5 py-0.5 text-xs bg-destructive/20 text-destructive rounded-full">
                  {urgences.length}
                </span>
              </TabsTrigger>
              <TabsTrigger value="aide" data-testid="tab-aide" className="text-xs sm:text-sm px-2 sm:px-3 flex-1 sm:flex-none">
                <HelpCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Demandes d'aide</span>
                <span className="sm:hidden">Aide</span>
                <span className="ml-1.5 px-1.5 py-0.5 text-xs bg-primary/20 text-primary rounded-full">
                  {demandesAide.length}
                </span>
              </TabsTrigger>
              <TabsTrigger value="recherches" data-testid="tab-recherches" className="text-xs sm:text-sm px-2 sm:px-3 flex-1 sm:flex-none">
                <Users className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Personnes recherchées</span>
                <span className="sm:hidden">Recherches</span>
                <span className="ml-1.5 px-1.5 py-0.5 text-xs bg-amber-600/20 text-amber-700 dark:text-amber-400 rounded-full">
                  {personnesRecherchees.length}
                </span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="urgences" className="mt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {urgences.map((report) => (
                  <SignalementCard key={report.id} {...report} createdAt={report.createdAt || new Date()} />
                ))}
              </div>
              {urgences.length === 0 && (
                <div className="text-center py-12">
                  <AlertCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                  <p className="text-muted-foreground text-lg font-medium">Aucune urgence active</p>
                  <p className="text-muted-foreground/70 text-sm mt-1">Les urgences SOS apparaîtront ici</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="aide" className="mt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {demandesAide.map((report) => (
                  <SignalementCard key={report.id} {...report} createdAt={report.createdAt || new Date()} />
                ))}
              </div>
              {demandesAide.length === 0 && (
                <div className="text-center py-12">
                  <HelpCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                  <p className="text-muted-foreground text-lg font-medium">Aucune demande d'aide active</p>
                  <p className="text-muted-foreground/70 text-sm mt-1">Les demandes d'aide apparaîtront ici</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="recherches" className="mt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {personnesRecherchees.map((report) => (
                  <SignalementCard key={report.id} {...report} createdAt={report.createdAt || new Date()} />
                ))}
              </div>
              {personnesRecherchees.length === 0 && (
                <div className="text-center py-12">
                  <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                  <p className="text-muted-foreground text-lg font-medium">Aucune recherche en cours</p>
                  <p className="text-muted-foreground/70 text-sm mt-1">Les personnes recherchées apparaîtront ici</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
