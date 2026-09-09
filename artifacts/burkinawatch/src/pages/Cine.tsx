import { Helmet } from "react-helmet-async";
import { ArrowLeft, Film, Clock, Info, MapPin, Phone, Navigation, Star, ExternalLink } from "lucide-react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface CinemaInfo {
  id: string;
  name: string;
  address: string;
  phone: string;
  type: string;
  description: string;
  showtimes: string[];
  prices: { label: string; amount: number }[];
  features: string[];
  mapUrl: string;
  lat: number;
  lon: number;
}

interface RecentFilm {
  id: string;
  title: string;
  cinema: string;
  genre?: string;
  country?: string;
  source: string;
}

interface CinemaData {
  cinemas: CinemaInfo[];
  recentFilms: RecentFilm[];
}

export default function Cine() {
  const [, setLocation] = useLocation();

  const { data, isLoading } = useQuery<CinemaData>({
    queryKey: ["/api/cinema/info"],
    staleTime: 1000 * 60 * 60,
    refetchOnWindowFocus: false,
  });

  const cinemas = data?.cinemas || [];
  const recentFilms = data?.recentFilms || [];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Helmet>
        <title>Cinemas - Burkina Watch</title>
      </Helmet>
      <Header />

      <main className="flex-1 container mx-auto px-4 py-6 pb-24">
        <div className="flex items-center gap-3 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation("/")}
            data-testid="button-back"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold flex items-center gap-2" data-testid="text-page-title">
              <Film className="h-6 w-6 text-pink-600" />
              Cinemas de Ouagadougou
            </h1>
            <p className="text-sm text-muted-foreground">
              Salles de cinema, horaires et films recents
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <Card key={i} className="h-48 animate-pulse bg-muted/50" />
            ))}
          </div>
        ) : (
          <Tabs defaultValue={cinemas[0]?.id || "cine-burkina"} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              {cinemas.map((cinema) => (
                <TabsTrigger
                  key={cinema.id}
                  value={cinema.id}
                  className="rounded-xl text-xs sm:text-sm"
                  data-testid={`tab-${cinema.id}`}
                >
                  {cinema.name}
                </TabsTrigger>
              ))}
            </TabsList>

            {cinemas.map((cinema) => {
              const films = recentFilms.filter((f) => f.cinema === cinema.name);

              return (
                <TabsContent key={cinema.id} value={cinema.id} className="space-y-4">
                  <Card className="bg-gradient-to-r from-pink-500/10 to-pink-600/5 border-pink-500/20">
                    <CardContent className="p-4 sm:p-6">
                      <div className="flex items-start gap-4">
                        <div className="p-3 bg-pink-500/20 rounded-lg shrink-0">
                          <Film className="w-8 h-8 text-pink-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h2 className="font-bold text-lg">{cinema.name}</h2>
                          <p className="text-sm text-muted-foreground mt-1">
                            {cinema.description}
                          </p>
                          <div className="flex flex-wrap gap-2 mt-3">
                            {cinema.features.map((f, i) => (
                              <Badge key={i} variant="outline" className="text-xs">
                                {f}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <div className="grid gap-4 md:grid-cols-2">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-pink-600" />
                          Adresse et Contact
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <p className="text-sm text-muted-foreground">{cinema.address}</p>
                        <a href={`tel:${cinema.phone.replace(/\s/g, "")}`} className="flex items-center gap-2 text-sm text-primary hover:underline" data-testid={`link-phone-${cinema.id}`}>
                          <Phone className="w-4 h-4" />
                          {cinema.phone}
                        </a>
                        <Badge variant="secondary" className="text-xs">{cinema.type}</Badge>
                        <div className="flex gap-2 pt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 text-xs"
                            onClick={() => window.open(cinema.mapUrl)}
                            data-testid={`button-map-${cinema.id}`}
                          >
                            <Navigation className="w-3 h-3 mr-1" />
                            Itineraire
                          </Button>
                          <a href={`tel:${cinema.phone.replace(/\s/g, "")}`} className="flex-1">
                            <Button variant="default" size="sm" className="w-full text-xs" data-testid={`button-call-${cinema.id}`}>
                              <Phone className="w-3 h-3 mr-1" />
                              Appeler
                            </Button>
                          </a>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base flex items-center gap-2">
                          <Clock className="w-4 h-4 text-pink-600" />
                          Seances et Tarifs
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-2">Horaires des seances :</p>
                          <div className="flex flex-wrap gap-2">
                            {cinema.showtimes.map((s, i) => {
                              const isTime = /^\d{2}h\d{2}$/.test(s);
                              return isTime ? (
                                <Badge key={i} variant="outline" className="h-8 px-3 rounded-lg border-pink-200 dark:border-pink-800 text-sm font-mono">
                                  {s}
                                </Badge>
                              ) : (
                                <p key={i} className="text-xs text-muted-foreground italic">{s}</p>
                              );
                            })}
                          </div>
                        </div>
                        <div className="pt-2 border-t">
                          <p className="text-xs font-medium text-muted-foreground mb-2">Tarifs :</p>
                          <div className="space-y-1.5">
                            {cinema.prices.map((p, i) => (
                              <div key={i} className="flex items-center justify-between">
                                <span className="text-sm">{p.label}</span>
                                <span className="font-bold text-pink-600">{p.amount.toLocaleString()} FCFA</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <Card>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <CardTitle className="text-base flex items-center gap-2">
                            <Star className="w-4 h-4 text-pink-600" />
                            Films recemment projetes
                          </CardTitle>
                          <CardDescription className="text-xs">
                            Source : sortir.bf - Pour le programme du jour, appelez le cinema
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {films.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          Aucun film recent enregistre pour cette salle
                        </p>
                      ) : (
                        <div className="grid gap-2 sm:grid-cols-2">
                          {films.map((film) => (
                            <div
                              key={film.id}
                              className="flex items-center gap-3 p-3 rounded-md bg-muted/30"
                              data-testid={`card-film-${film.id}`}
                            >
                              <div className="p-2 bg-pink-100 dark:bg-pink-900/20 rounded-md shrink-0">
                                <Film className="w-4 h-4 text-pink-600" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{film.title}</p>
                                <div className="flex items-center gap-2 mt-0.5">
                                  {film.genre && (
                                    <Badge variant="secondary" className="text-[10px] h-4">{film.genre}</Badge>
                                  )}
                                  {film.country && (
                                    <span className="text-[10px] text-muted-foreground">{film.country}</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card className="border-none bg-amber-50 dark:bg-amber-950/20 shadow-none">
                    <CardContent className="p-4 flex gap-3 items-start">
                      <Phone className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
                      <div className="space-y-1">
                        <p className="text-sm font-bold text-amber-900 dark:text-amber-100">Programme du jour</p>
                        <p className="text-xs text-amber-800/80 dark:text-amber-200/80 leading-relaxed">
                          Le programme des films change regulierement. Pour connaitre les films projetes aujourd'hui,
                          appelez directement le <a href={`tel:${cinema.phone.replace(/\s/g, "")}`} className="font-bold underline">{cinema.phone}</a>.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              );
            })}
          </Tabs>
        )}

        <Card className="mt-8 border-none bg-blue-50 dark:bg-blue-950/20 shadow-none">
          <CardContent className="p-4 flex gap-3 items-start">
            <Info className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
            <div className="space-y-1">
              <p className="text-sm font-bold text-blue-900 dark:text-blue-100">Informations Pratiques</p>
              <p className="text-xs text-blue-800/80 dark:text-blue-200/80 leading-relaxed">
                Ouagadougou est consideree comme la capitale du cinema africain grace au FESPACO
                (Festival panafricain du cinema et de la television), organise tous les deux ans (annees impaires).
                Les tarifs peuvent varier lors des festivals ou avant-premieres.
                Les films listes proviennent de sortir.bf et representent les projections recentes, pas necessairement le programme actuel.
              </p>
              <a
                href="https://sortir.bf"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline mt-1"
                data-testid="link-sortir-bf"
              >
                <ExternalLink className="w-3 h-3" />
                sortir.bf - Evenements a Ouagadougou
              </a>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
