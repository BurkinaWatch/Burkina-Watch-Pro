import { Helmet } from "react-helmet-async";
import { ArrowLeft, Film, Clock, Info, CalendarDays, RefreshCw, MapPin } from "lucide-react";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";

interface Movie {
  id: string;
  title: string;
  genre: string;
  duration: string;
  director: string;
  synopsis: string;
  rating: string;
  posterUrl?: string;
  country?: string;
}

interface Screening {
  id: string;
  movieId: string;
  cinema: string;
  time: string;
  date: string;
  price: number;
}

interface CinemaProgram {
  movies: Movie[];
  screenings: Screening[];
  weekLabel: string;
  generatedAt: string;
  validUntil: string;
}

const CINEMAS = ["Ciné Burkina", "Ciné Neerwaya"];

const CINEMA_INFO: Record<string, { address: string; type: string }> = {
  "Ciné Burkina": { address: "Avenue de la Nation, Ouagadougou", type: "Films burkinabè & africains" },
  "Ciné Neerwaya": { address: "Secteur 4, Ouagadougou", type: "Films africains & art" },
};

function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {[1, 2, 3].map((i) => (
        <Card key={i} className="overflow-hidden border-none shadow-sm">
          <div className="flex flex-col sm:flex-row">
            <Skeleton className="w-full sm:w-1/3 aspect-[3/4]" />
            <div className="flex-1 p-4 space-y-3">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

export default function Cine() {
  const [, setLocation] = useLocation();

  const { data: program, isLoading, isError } = useQuery<CinemaProgram>({
    queryKey: ["/api/cinema/program"],
    staleTime: 1000 * 60 * 30,
    refetchOnWindowFocus: false,
  });

  const movies = program?.movies || [];
  const screenings = program?.screenings || [];

  function getUniqueScreeningDates(cinema: string, movieId: string): string[] {
    const dates = screenings
      .filter((s) => s.cinema === cinema && s.movieId === movieId)
      .map((s) => s.date);
    return Array.from(new Set(dates)).sort();
  }

  function getScreeningsForDate(cinema: string, movieId: string, date: string): Screening[] {
    return screenings.filter(
      (s) => s.cinema === cinema && s.movieId === movieId && s.date === date
    );
  }

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
              Programme Ciné
            </h1>
            <p className="text-sm text-muted-foreground">
              Horaires des séances à Ouagadougou
            </p>
          </div>
        </div>

        {program?.weekLabel && (
          <div className="flex flex-wrap items-center justify-between gap-2 mb-6 px-3 py-2 rounded-lg bg-pink-50 dark:bg-pink-950/20">
            <div className="flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-pink-600" />
              <span className="text-sm font-medium text-pink-800 dark:text-pink-200" data-testid="text-week-label">
                Semaine du {program.weekLabel}
              </span>
            </div>
            <Badge variant="secondary" className="text-[10px]" data-testid="badge-auto-update">
              <RefreshCw className="w-3 h-3 mr-1" />
              Mise à jour auto chaque mercredi
            </Badge>
          </div>
        )}

        {isError && (
          <Card className="mb-6 border-none bg-red-50 dark:bg-red-950/20 shadow-none">
            <CardContent className="p-4 text-center">
              <p className="text-sm text-red-800 dark:text-red-200">
                Impossible de charger le programme. Veuillez réessayer plus tard.
              </p>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="Ciné Burkina" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            {CINEMAS.map((cinema) => (
              <TabsTrigger key={cinema} value={cinema} className="rounded-xl text-xs sm:text-sm" data-testid={`tab-${cinema.replace(/\s+/g, "-").toLowerCase()}`}>
                {cinema}
              </TabsTrigger>
            ))}
          </TabsList>

          {CINEMAS.map((cinema) => (
            <TabsContent key={cinema} value={cinema}>
              {CINEMA_INFO[cinema] && (
                <div className="flex flex-wrap items-center gap-3 mb-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {CINEMA_INFO[cinema].address}
                  </span>
                  <Badge variant="outline" className="text-[10px]">{CINEMA_INFO[cinema].type}</Badge>
                </div>
              )}

              {isLoading ? (
                <LoadingSkeleton />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {movies.map((movie) => {
                    const movieDates = getUniqueScreeningDates(cinema, movie.id);
                    if (movieDates.length === 0) return null;

                    const firstDateScreenings = getScreeningsForDate(cinema, movie.id, movieDates[0]);
                    if (firstDateScreenings.length === 0) return null;

                    return (
                      <Card key={`${cinema}-${movie.id}`} className="overflow-visible hover-elevate transition-all border-none shadow-sm bg-card/50 backdrop-blur-sm" data-testid={`card-movie-${movie.id}`}>
                        <div className="flex flex-col sm:flex-row">
                          <div className="w-full sm:w-1/3 aspect-[3/4] bg-muted relative rounded-tl-md rounded-bl-md overflow-hidden">
                            {movie.posterUrl ? (
                              <img
                                src={movie.posterUrl}
                                alt={movie.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex flex-col items-center justify-center bg-pink-100 dark:bg-pink-900/20 gap-2">
                                <Film className="w-12 h-12 text-pink-600/30" />
                                <span className="text-[10px] text-pink-600/50 font-medium px-2 text-center">{movie.title}</span>
                              </div>
                            )}
                            <Badge className="absolute top-2 left-2 bg-pink-600 text-white border-none">
                              {movie.rating} ★
                            </Badge>
                            {movie.country && (
                              <Badge variant="secondary" className="absolute bottom-2 left-2 text-[9px] h-4">
                                {movie.country}
                              </Badge>
                            )}
                          </div>
                          <div className="flex-1 p-4 flex flex-col">
                            <div className="flex-1">
                              <h3 className="text-lg font-bold mb-1" data-testid={`text-movie-title-${movie.id}`}>{movie.title}</h3>
                              <p className="text-xs text-muted-foreground mb-1">
                                Réalisateur : {movie.director}
                              </p>
                              <div className="text-xs text-muted-foreground mb-3 flex flex-wrap items-center gap-1">
                                <Badge variant="secondary" className="text-[10px] h-4">
                                  {movie.genre}
                                </Badge>
                                <span>·</span>
                                <span>{movie.duration}</span>
                              </div>
                              <p className="text-sm text-muted-foreground line-clamp-3 mb-4 italic">
                                "{movie.synopsis}"
                              </p>
                            </div>

                            <div className="space-y-3 pt-2 border-t border-border/50">
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <span className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-1">
                                  <CalendarDays className="w-3 h-3" />
                                  {movieDates.length > 1
                                    ? `${format(parseISO(movieDates[0]), "EEE d", { locale: fr })} - ${format(parseISO(movieDates[movieDates.length - 1]), "EEE d MMM", { locale: fr })}`
                                    : format(parseISO(movieDates[0]), "EEEE d MMMM", { locale: fr })}
                                </span>
                                <span className="text-xs font-bold text-pink-600 bg-pink-50 dark:bg-pink-900/20 px-2 py-0.5 rounded-full">
                                  {firstDateScreenings[0].price} FCFA
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="w-3 h-3 text-muted-foreground" />
                                <span className="text-xs text-muted-foreground">Séances quotidiennes :</span>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {firstDateScreenings.map((s) => (
                                  <Badge
                                    key={s.id}
                                    variant="outline"
                                    className="h-8 px-3 rounded-lg border-pink-200 dark:border-pink-800 cursor-default"
                                    data-testid={`badge-screening-${s.id}`}
                                  >
                                    {s.time}
                                  </Badge>
                                ))}
                              </div>
                              {movieDates.length > 1 && (
                                <div className="flex flex-wrap gap-1 pt-1">
                                  {movieDates.map((d) => (
                                    <Badge key={d} variant="secondary" className="text-[10px] h-5">
                                      {format(parseISO(d), "EEE d", { locale: fr })}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>

        <Card className="mt-8 border-none bg-blue-50 dark:bg-blue-950/20 shadow-none">
          <CardContent className="p-4 flex gap-3 items-start">
            <Info className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
            <div className="space-y-1">
              <p className="text-sm font-bold text-blue-900 dark:text-blue-100">Informations Pratiques</p>
              <p className="text-xs text-blue-800/80 dark:text-blue-200/80 leading-relaxed">
                Les programmes sont générés et mis à jour automatiquement chaque mercredi.
                Les tarifs peuvent varier lors des festivals (FESPACO) ou avant-premières.
                Veuillez vous présenter 30 minutes avant le début de la séance.
              </p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
