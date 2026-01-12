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
  cinema: "Ciné Burkina" | "Ciné Neerwaya" | "CanalOlympia Yennenga";
  time: string;
  date: string;
  price: number;
}

export const MOVIES: Movie[] = [
  {
    id: "movie-1",
    title: "Le PPS de Soum le Sapeur",
    genre: "Comédie",
    duration: "1h 45min",
    director: "Ousmane Bamogo",
    synopsis: "Soum, convaincu par sa compagne qu'il pourrait devenir propriétaire d'une cave à liqueurs en l'épousant, décide avec sa bande de passer le fameux PPS. Une comédie sur l'alcoolisme et la quête du gain facile.",
    rating: "4.9",
    country: "Burkina Faso"
  },
  {
    id: "movie-2",
    title: "Sira",
    genre: "Drame",
    duration: "2h 02min",
    director: "Apolline Traoré",
    synopsis: "Sira, jeune femme peule nomade, est enlevée lors d'une attaque terroriste. Abandonnée dans le désert, elle refuse de se rendre et lutte pour sa survie. Un récit de résistance féminine face au terrorisme.",
    rating: "4.8",
    country: "Burkina Faso"
  },
  {
    id: "movie-3",
    title: "Katanga, la Danse des Scorpions",
    genre: "Drame Épique",
    duration: "2h 15min",
    director: "Dani Kouyaté",
    synopsis: "Drame épique inspiré de Shakespeare, tourné entièrement au Burkina Faso. Lauréat de l'Étalon d'or de Yennenga au FESPACO 2025.",
    rating: "4.7",
    country: "Burkina Faso"
  },
  {
    id: "movie-4",
    title: "Wallay",
    genre: "Comédie Dramatique",
    duration: "1h 24min",
    director: "Berni Goldblat",
    synopsis: "Ady, 13 ans, turbulent Franco-Burkinabè, est envoyé chez son oncle au Burkina Faso. Privé de téléphone dans un village sans électricité, il découvre ses racines africaines.",
    rating: "4.5",
    country: "Burkina Faso"
  },
  {
    id: "movie-5",
    title: "Mufasa : Le Roi Lion",
    genre: "Animation",
    duration: "1h 58min",
    director: "Barry Jenkins",
    synopsis: "L'histoire des origines de Mufasa, orphelin perdu et seul, jusqu'à sa rencontre avec Taka, héritier d'une lignée royale. Une aventure épique sur la famille et le destin.",
    rating: "4.6",
    country: "USA"
  },
  {
    id: "movie-6",
    title: "Sonic 3 : Le Film",
    genre: "Action/Aventure",
    duration: "1h 50min",
    director: "Jeff Fowler",
    synopsis: "Sonic, Knuckles et Tails affrontent un nouvel adversaire puissant : Shadow, un mystérieux méchant aux pouvoirs inégalés. Une course contre la montre pour sauver la planète.",
    rating: "4.4",
    country: "USA"
  },
  {
    id: "movie-7",
    title: "Vaiana 2",
    genre: "Animation",
    duration: "1h 40min",
    director: "David Derrick Jr.",
    synopsis: "Vaiana reçoit un appel inattendu de ses ancêtres navigateurs et doit voyager vers les mers lointaines d'Océanie, dans des eaux dangereuses, pour une aventure inédite.",
    rating: "4.5",
    country: "USA"
  }
];

export const SCREENINGS: Screening[] = [
  // Ciné Burkina - Films burkinabè
  {
    id: "scr-1",
    movieId: "movie-1",
    cinema: "Ciné Burkina",
    time: "18:30",
    date: "2026-01-12",
    price: 2000
  },
  {
    id: "scr-2",
    movieId: "movie-1",
    cinema: "Ciné Burkina",
    time: "20:30",
    date: "2026-01-12",
    price: 2000
  },
  {
    id: "scr-3",
    movieId: "movie-2",
    cinema: "Ciné Burkina",
    time: "17:00",
    date: "2026-01-12",
    price: 1500
  },
  {
    id: "scr-4",
    movieId: "movie-2",
    cinema: "Ciné Burkina",
    time: "19:30",
    date: "2026-01-12",
    price: 1500
  },
  {
    id: "scr-5",
    movieId: "movie-3",
    cinema: "Ciné Burkina",
    time: "20:00",
    date: "2026-01-12",
    price: 1500
  },

  // Ciné Neerwaya - Films burkinabè et africains
  {
    id: "scr-6",
    movieId: "movie-1",
    cinema: "Ciné Neerwaya",
    time: "18:30",
    date: "2026-01-12",
    price: 1500
  },
  {
    id: "scr-7",
    movieId: "movie-1",
    cinema: "Ciné Neerwaya",
    time: "20:30",
    date: "2026-01-12",
    price: 1500
  },
  {
    id: "scr-8",
    movieId: "movie-2",
    cinema: "Ciné Neerwaya",
    time: "19:00",
    date: "2026-01-12",
    price: 1000
  },
  {
    id: "scr-9",
    movieId: "movie-4",
    cinema: "Ciné Neerwaya",
    time: "17:00",
    date: "2026-01-12",
    price: 1000
  },
  {
    id: "scr-10",
    movieId: "movie-4",
    cinema: "Ciné Neerwaya",
    time: "21:00",
    date: "2026-01-12",
    price: 1000
  },

  // CanalOlympia Yennenga - Films internationaux
  {
    id: "scr-11",
    movieId: "movie-5",
    cinema: "CanalOlympia Yennenga",
    time: "14:00",
    date: "2026-01-12",
    price: 2000
  },
  {
    id: "scr-12",
    movieId: "movie-5",
    cinema: "CanalOlympia Yennenga",
    time: "17:00",
    date: "2026-01-12",
    price: 2000
  },
  {
    id: "scr-13",
    movieId: "movie-5",
    cinema: "CanalOlympia Yennenga",
    time: "20:00",
    date: "2026-01-12",
    price: 2000
  },
  {
    id: "scr-14",
    movieId: "movie-6",
    cinema: "CanalOlympia Yennenga",
    time: "14:00",
    date: "2026-01-12",
    price: 2000
  },
  {
    id: "scr-15",
    movieId: "movie-6",
    cinema: "CanalOlympia Yennenga",
    time: "17:00",
    date: "2026-01-12",
    price: 2000
  },
  {
    id: "scr-16",
    movieId: "movie-6",
    cinema: "CanalOlympia Yennenga",
    time: "20:00",
    date: "2026-01-12",
    price: 2000
  },
  {
    id: "scr-17",
    movieId: "movie-7",
    cinema: "CanalOlympia Yennenga",
    time: "14:00",
    date: "2026-01-12",
    price: 1000
  },
  {
    id: "scr-18",
    movieId: "movie-7",
    cinema: "CanalOlympia Yennenga",
    time: "17:00",
    date: "2026-01-12",
    price: 2000
  }
];
