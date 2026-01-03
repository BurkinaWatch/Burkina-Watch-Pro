export interface Movie {
  id: string;
  title: string;
  genre: string;
  duration: string;
  director: string;
  synopsis: string;
  rating: string;
  posterUrl?: string;
}

export interface Screening {
  id: string;
  movieId: string;
  cinema: "Ciné Burkina" | "Ciné Nerwaya";
  time: string;
  date: string;
  price: number;
}

export const MOVIES: Movie[] = [
  {
    id: "movie-1",
    title: "Sira",
    genre: "Drame",
    duration: "2h 01min",
    director: "Apolline Traoré",
    synopsis: "Sira, une jeune nomade, refuse de se laisser abattre par le destin après une attaque terroriste.",
    rating: "4.8",
  },
  {
    id: "movie-2",
    title: "Wallay",
    genre: "Comédie Dramatique",
    duration: "1h 24min",
    director: "Berni Goldblat",
    synopsis: "Ady, 13 ans, vit en France. Son père décide de l'envoyer chez son oncle au Burkina Faso le temps d'un été.",
    rating: "4.5",
  }
];

export const SCREENINGS: Screening[] = [
  {
    id: "scr-1",
    movieId: "movie-1",
    cinema: "Ciné Burkina",
    time: "18:30",
    date: "2026-01-02",
    price: 1500
  },
  {
    id: "scr-2",
    movieId: "movie-1",
    cinema: "Ciné Burkina",
    time: "20:30",
    date: "2026-01-02",
    price: 1500
  },
  {
    id: "scr-3",
    movieId: "movie-2",
    cinema: "Ciné Nerwaya",
    time: "19:00",
    date: "2026-01-02",
    price: 1000
  },
  {
    id: "scr-4",
    movieId: "movie-2",
    cinema: "Ciné Nerwaya",
    time: "21:00",
    date: "2026-01-02",
    price: 1000
  }
];
