import { Helmet } from "react-helmet-async";
import { ArrowLeft, Film, Clock, Ticket, Info, Calendar, CalendarDays } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useLocation } from "wouter";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MOVIES, SCREENINGS } from "../../../server/cineData";

export default function Cine() {
  const [, setLocation] = useLocation();

  const cinemas = ["Ciné Burkina", "Ciné Neerwaya", "CanalOlympia Yennenga"];

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

        <Tabs defaultValue="Ciné Burkina" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            {cinemas.map((cinema) => (
              <TabsTrigger key={cinema} value={cinema} className="rounded-xl">
                {cinema}
              </TabsTrigger>
            ))}
          </TabsList>

          {cinemas.map((cinema) => (
            <TabsContent key={cinema} value={cinema}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {MOVIES.map((movie) => {
                  const movieScreenings = SCREENINGS.filter(
                    (s) => s.movieId === movie.id && s.cinema === cinema
                  );

                  if (movieScreenings.length === 0) return null;

                  return (
                    <Card key={`${cinema}-${movie.id}`} className="overflow-hidden hover-elevate transition-all border-none shadow-sm bg-card/50 backdrop-blur-sm">
                      <div className="flex flex-col sm:flex-row">
                        <div className="w-full sm:w-1/3 aspect-[3/4] bg-muted relative">
                          {movie.posterUrl ? (
                            <img 
                              src={movie.posterUrl} 
                              alt={movie.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-pink-100 dark:bg-pink-900/20">
                              <Film className="w-12 h-12 text-pink-600/20" />
                            </div>
                          )}
                          <Badge className="absolute top-2 left-2 bg-pink-600 text-white border-none">
                            {movie.rating} ★
                          </Badge>
                        </div>
                        <div className="flex-1 p-4 flex flex-col">
                          <div className="flex-1">
                            <h3 className="text-lg font-bold mb-1">{movie.title}</h3>
                            <p className="text-xs text-muted-foreground mb-3 flex items-center gap-1">
                              <Badge variant="secondary" className="text-[10px] h-4">
                                {movie.genre}
                              </Badge>
                              <span>•</span>
                              <span>{movie.duration}</span>
                            </p>
                            <p className="text-sm text-muted-foreground line-clamp-3 mb-4 italic">
                              "{movie.synopsis}"
                            </p>
                          </div>

                          <div className="space-y-3 pt-2 border-t border-border/50">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-1">
                                <CalendarDays className="w-3 h-3" />
                                {format(new Date(movieScreenings[0].date), "EEEE d MMMM", { locale: fr })}
                              </span>
                              <span className="text-xs font-bold text-pink-600 bg-pink-50 dark:bg-pink-900/20 px-2 py-0.5 rounded-full">
                                {movieScreenings[0].price} FCFA
                              </span>
                            </div>
                            <div className="flex items-center gap-1 mb-1">
                              <Clock className="w-3 h-3 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground">Séances :</span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {movieScreenings.map((s) => (
                                <Badge 
                                  key={s.id} 
                                  variant="outline" 
                                  className="h-8 px-3 rounded-lg border-pink-200 dark:border-pink-800 hover:bg-pink-50 dark:hover:bg-pink-900/20 cursor-default transition-colors"
                                >
                                  {s.time}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>
          ))}
        </Tabs>

        <Card className="mt-8 border-none bg-blue-50 dark:bg-blue-950/20 shadow-none">
          <CardContent className="p-4 flex gap-3 items-start">
            <Info className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
            <div className="space-y-1">
              <p className="text-sm font-bold text-blue-900 dark:text-blue-100">Informations Pratiques</p>
              <p className="text-xs text-blue-800/80 dark:text-blue-200/80 leading-relaxed">
                Les programmes sont mis à jour chaque mercredi. Les tarifs peuvent varier lors des festivals (FESPACO) ou avant-premières. 
                Veuillez vous présenter 30 minutes avant le début de la séance.
              </p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
