import { Helmet } from "react-helmet-async";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import EmergencyPanel from "@/components/EmergencyPanel";
import SignalementCard from "@/components/SignalementCard";
import FilterChips from "@/components/FilterChips";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Categorie, Signalement } from "@shared/schema";
import { Loader2, ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function Feed() {
  const [filter, setFilter] = useState<Categorie | "tous">("tous");

  const { data: signalements = [], isLoading } = useQuery<Signalement[]>({
    queryKey: ["/api/signalements", filter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filter !== "tous") {
        params.append("categorie", filter);
      }
      const response = await fetch(`/api/signalements?${params}`);
      if (!response.ok) throw new Error("Erreur lors du chargement");
      return response.json();
    },
    staleTime: 30 * 1000, // 30 secondes - données toujours fraîches pour tous les utilisateurs
    gcTime: 60 * 1000, // 1 minute avant de supprimer du cache
    refetchInterval: 60 * 1000, // Rafraîchir automatiquement toutes les 60 secondes
  });

  const filteredReports = filter === "tous" 
    ? signalements 
    : signalements.filter(r => r.categorie === filter);

  const sosReports = signalements.filter(r => r.isSOS);
  const popularReports = [...signalements].sort((a, b) => (b.likes || 0) - (a.likes || 0));

  return (
    <div className="min-h-screen bg-background pb-24">
      <Helmet>
        <title>Fil d'Actualite - Burkina Watch</title>
      </Helmet>
      <Header />

      <div className="max-w-7xl mx-auto px-4 py-6">
        <Link href="/">
          <Button variant="ghost" className="mb-4" data-testid="button-back-home">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Accueil
          </Button>
        </Link>
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Fil d'actualité</h1>
          <p className="text-muted-foreground">
            Suivez les signalements de la communauté en temps réel
          </p>
        </div>

        <Tabs defaultValue="recents" className="w-full">
          <TabsList className="w-full justify-start mb-6">
            <TabsTrigger value="recents" data-testid="tab-recent">Récents</TabsTrigger>
            <TabsTrigger value="populaires" data-testid="tab-popular">Populaires</TabsTrigger>
            <TabsTrigger value="sos" data-testid="tab-sos">SOS</TabsTrigger>
          </TabsList>

          <div className="mb-6">
            <FilterChips onFilterChange={setFilter} />
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              <TabsContent value="recents" className="mt-0">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredReports.map((report) => (
                    <SignalementCard 
                      key={report.id} 
                      {...report}
                      createdAt={new Date(report.createdAt!)}
                      medias={report.medias}
                    />
                  ))}
                </div>
                {filteredReports.length === 0 && (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">Aucun signalement dans cette catégorie</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="populaires" className="mt-0">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {popularReports.map((report) => (
                    <SignalementCard 
                      key={report.id} 
                      {...report}
                      createdAt={new Date(report.createdAt!)}
                      medias={report.medias}
                    />
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="sos" className="mt-0">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {sosReports.map((report) => (
                    <SignalementCard 
                      key={report.id} 
                      {...report}
                      createdAt={new Date(report.createdAt!)}
                      medias={report.medias}
                    />
                  ))}
                </div>
                {sosReports.length === 0 && (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">Aucune alerte SOS active</p>
                  </div>
                )}
              </TabsContent>
            </>
          )}
        </Tabs>
      </div>

      <EmergencyPanel />
      <BottomNav />
    </div>
  );
}