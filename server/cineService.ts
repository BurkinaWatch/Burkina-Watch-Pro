import Groq from "groq-sdk";
import OpenAI from "openai";
import { addDays, startOfWeek, format, isAfter } from "date-fns";
import { fr } from "date-fns/locale";

export interface Movie {
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

export interface Screening {
  id: string;
  movieId: string;
  cinema: string;
  time: string;
  date: string;
  price: number;
}

export interface CinemaProgram {
  movies: Movie[];
  screenings: Screening[];
  weekLabel: string;
  generatedAt: string;
  validUntil: string;
}

let cachedProgram: CinemaProgram | null = null;

const CINEMAS = ["Ciné Burkina", "Ciné Neerwaya"];

function getWeekDates(): { start: Date; end: Date; dates: string[] } {
  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const dates: string[] = [];
  for (let i = 0; i < 7; i++) {
    dates.push(format(addDays(weekStart, i), "yyyy-MM-dd"));
  }
  const end = addDays(weekStart, 6);
  return { start: weekStart, end, dates };
}

function getNextWednesday(): Date {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const daysUntilWed = (3 - dayOfWeek + 7) % 7 || 7;
  const nextWed = addDays(now, daysUntilWed);
  nextWed.setHours(6, 0, 0, 0);
  return nextWed;
}

function isCacheValid(): boolean {
  if (!cachedProgram) return false;
  const validUntil = new Date(cachedProgram.validUntil);
  return !isAfter(new Date(), validUntil);
}

async function generateWithAI(): Promise<{ movies: any[]; error?: string }> {
  const { dates } = getWeekDates();
  const weekLabel = `${format(new Date(dates[0]), "d MMMM", { locale: fr })} - ${format(new Date(dates[6]), "d MMMM yyyy", { locale: fr })}`;

  const prompt = `Génère un programme cinéma RÉALISTE pour Ouagadougou, Burkina Faso pour la semaine du ${weekLabel}.

Tu dois retourner UNIQUEMENT un JSON valide (pas de texte autour, pas de markdown).

Le JSON doit avoir cette structure exacte:
{
  "movies": [
    {
      "id": "movie-1",
      "title": "Nom du Film",
      "genre": "Genre",
      "duration": "Xh XXmin",
      "director": "Nom du Réalisateur",
      "synopsis": "Description courte du film (2-3 phrases max)",
      "rating": "4.5",
      "country": "Pays d'origine"
    }
  ]
}

Règles:
- Génère exactement 8 films
- 4 films africains/burkinabè (films récents du cinéma africain, FESPACO, etc.)
- 4 films internationaux populaires actuellement en salle (Hollywood, animation, etc.)
- Les notes entre 3.5 et 5.0
- Synopsis en français, 2-3 phrases maximum
- Films réalistes et crédibles qui pourraient être à l'affiche en Afrique de l'Ouest en 2025-2026
- IDs de movie-1 à movie-8

IMPORTANT: Retourne UNIQUEMENT le JSON, rien d'autre.`;

  const groqClient = process.env.GROQ_API_KEY
    ? new Groq({ apiKey: process.env.GROQ_API_KEY })
    : null;

  const openaiClient = process.env.AI_INTEGRATIONS_OPENAI_API_KEY
    ? new OpenAI({
        apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
        baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
      })
    : null;

  if (groqClient) {
    try {
      const completion = await groqClient.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: "Tu es un expert du cinéma en Afrique de l'Ouest. Tu réponds uniquement en JSON valide." },
          { role: "user", content: prompt }
        ],
        temperature: 0.8,
        max_tokens: 3000,
      });
      const text = completion.choices[0]?.message?.content?.trim() || "";
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return { movies: parsed.movies };
      }
    } catch (error: any) {
      console.error("Groq cinema error:", error?.message);
    }
  }

  if (openaiClient) {
    try {
      const completion = await openaiClient.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "Tu es un expert du cinéma en Afrique de l'Ouest. Tu réponds uniquement en JSON valide." },
          { role: "user", content: prompt }
        ],
        temperature: 0.8,
        max_tokens: 3000,
      });
      const text = completion.choices[0]?.message?.content?.trim() || "";
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return { movies: parsed.movies };
      }
    } catch (error: any) {
      console.error("OpenAI cinema error:", error?.message);
    }
  }

  return { movies: [], error: "Aucun service IA disponible" };
}

function safeIndex(movies: Movie[], idx: number): Movie {
  return movies[idx % movies.length];
}

function generateScreenings(movies: Movie[], dates: string[]): Screening[] {
  if (movies.length === 0) return [];

  const screenings: Screening[] = [];
  let scrId = 1;

  const half = Math.ceil(movies.length / 2);

  const cinemaSlots: { cinema: string; moviePicks: number[]; times: string[][]; prices: number[] }[] = [
    {
      cinema: "Ciné Burkina",
      moviePicks: [0, 1, Math.min(2, half - 1)],
      times: [["18:00", "20:30"], ["17:00", "19:30"], ["20:00"]],
      prices: [2000, 1500, 1500]
    },
    {
      cinema: "Ciné Neerwaya",
      moviePicks: [0, 1, Math.min(3, half - 1)],
      times: [["18:30", "20:30"], ["19:00"], ["17:00", "21:00"]],
      prices: [1500, 1000, 1000]
    },
  ];

  const showDays = dates.slice(2);

  for (const slot of cinemaSlots) {
    const usedMovieIds = new Set<string>();

    slot.moviePicks.forEach((pickIdx, i) => {
      const movie = safeIndex(movies, pickIdx);
      if (usedMovieIds.has(movie.id)) return;
      usedMovieIds.add(movie.id);

      const times = slot.times[i] || ["18:00"];
      const price = slot.prices[i] || 1500;

      for (const date of showDays) {
        for (const time of times) {
          screenings.push({
            id: `scr-${scrId++}`,
            movieId: movie.id,
            cinema: slot.cinema,
            time,
            date,
            price
          });
        }
      }
    });
  }

  return screenings;
}

function getFallbackMovies(): Movie[] {
  return [
    {
      id: "movie-1",
      title: "Le PPS de Soum le Sapeur",
      genre: "Comédie",
      duration: "1h 45min",
      director: "Ousmane Bamogo",
      synopsis: "Soum, convaincu par sa compagne qu'il pourrait devenir propriétaire, décide avec sa bande de passer le fameux PPS. Une comédie burkinabè hilarante.",
      rating: "4.9",
      country: "Burkina Faso"
    },
    {
      id: "movie-2",
      title: "Sira",
      genre: "Drame",
      duration: "2h 02min",
      director: "Apolline Traoré",
      synopsis: "Sira, jeune femme peule, est enlevée lors d'une attaque terroriste. Abandonnée dans le désert, elle lutte pour sa survie. Un récit de résistance féminine.",
      rating: "4.8",
      country: "Burkina Faso"
    },
    {
      id: "movie-3",
      title: "Katanga, la Danse des Scorpions",
      genre: "Drame Épique",
      duration: "2h 15min",
      director: "Dani Kouyaté",
      synopsis: "Drame épique inspiré de Shakespeare, tourné au Burkina Faso. Lauréat de l'Étalon d'or de Yennenga au FESPACO.",
      rating: "4.7",
      country: "Burkina Faso"
    },
    {
      id: "movie-4",
      title: "Wallay",
      genre: "Comédie Dramatique",
      duration: "1h 24min",
      director: "Berni Goldblat",
      synopsis: "Ady, 13 ans, Franco-Burkinabè turbulent, est envoyé chez son oncle au Burkina Faso. Privé de téléphone, il découvre ses racines.",
      rating: "4.5",
      country: "Burkina Faso"
    },
    {
      id: "movie-5",
      title: "Gladiator II",
      genre: "Action/Aventure",
      duration: "2h 28min",
      director: "Ridley Scott",
      synopsis: "Lucius, élevé hors de Rome, est contraint d'entrer dans le Colisée. Il doit se battre pour l'honneur et l'avenir de Rome.",
      rating: "4.6",
      country: "USA"
    },
    {
      id: "movie-6",
      title: "Sonic 3 : Le Film",
      genre: "Action/Aventure",
      duration: "1h 50min",
      director: "Jeff Fowler",
      synopsis: "Sonic, Knuckles et Tails affrontent Shadow, un mystérieux méchant aux pouvoirs inégalés. Une course contre la montre pour sauver la planète.",
      rating: "4.4",
      country: "USA"
    },
    {
      id: "movie-7",
      title: "Vaiana 2",
      genre: "Animation",
      duration: "1h 40min",
      director: "David Derrick Jr.",
      synopsis: "Vaiana reçoit un appel de ses ancêtres navigateurs et voyage vers les mers lointaines d'Océanie pour une aventure inédite.",
      rating: "4.5",
      country: "USA"
    },
    {
      id: "movie-8",
      title: "Mufasa : Le Roi Lion",
      genre: "Animation",
      duration: "1h 58min",
      director: "Barry Jenkins",
      synopsis: "L'histoire des origines de Mufasa, orphelin perdu, jusqu'à sa rencontre avec Taka. Une aventure épique sur la famille et le destin.",
      rating: "4.6",
      country: "USA"
    }
  ];
}

export async function getCinemaProgram(): Promise<CinemaProgram> {
  if (isCacheValid() && cachedProgram) {
    return cachedProgram;
  }

  const { dates } = getWeekDates();
  const weekLabel = `${format(new Date(dates[0]), "d MMMM", { locale: fr })} - ${format(new Date(dates[6]), "d MMMM yyyy", { locale: fr })}`;

  let movies: Movie[];

  const aiResult = await generateWithAI();
  if (aiResult.movies && Array.isArray(aiResult.movies) && aiResult.movies.length >= 4) {
    const validated = aiResult.movies.filter(
      (m: any) => m && typeof m.title === "string" && m.title.length > 0
    );
    if (validated.length >= 4) {
      movies = validated.map((m: any, i: number) => ({
        id: m.id || `movie-${i + 1}`,
        title: m.title,
        genre: typeof m.genre === "string" ? m.genre : "Drame",
        duration: typeof m.duration === "string" ? m.duration : "1h 30min",
        director: typeof m.director === "string" ? m.director : "Inconnu",
        synopsis: typeof m.synopsis === "string" ? m.synopsis : "",
        rating: typeof m.rating === "string" ? m.rating : "4.0",
        posterUrl: typeof m.posterUrl === "string" ? m.posterUrl : undefined,
        country: typeof m.country === "string" ? m.country : "Burkina Faso"
      }));
    } else {
      console.log("AI returned invalid movie data, using fallback");
      movies = getFallbackMovies();
    }
  } else {
    console.log("Using fallback cinema data (AI unavailable or insufficient)");
    movies = getFallbackMovies();
  }

  const screenings = generateScreenings(movies, dates);
  const validUntil = getNextWednesday().toISOString();

  cachedProgram = {
    movies,
    screenings,
    weekLabel,
    generatedAt: new Date().toISOString(),
    validUntil
  };

  return cachedProgram;
}

export function clearCinemaCache(): void {
  cachedProgram = null;
}
