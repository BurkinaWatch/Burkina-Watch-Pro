export interface CinemaInfo {
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

export interface RecentFilm {
  id: string;
  title: string;
  cinema: string;
  genre?: string;
  country?: string;
  source: string;
}

export const CINEMAS_INFO: CinemaInfo[] = [
  {
    id: "cine-burkina",
    name: "Cine Burkina",
    address: "En face de la Grande Mosquee, centre-ville, Ouagadougou",
    phone: "70 61 64 52",
    type: "Films burkinabe & internationaux",
    description: "Salle de cinema historique de Ouagadougou, anciennement appelee 'Film Volta'. Renovee pour le festival Zimba 2007, elle est un lieu emblematique du cinema burkinabe et accueille des projections lors du FESPACO.",
    showtimes: ["Plusieurs seances quotidiennes", "Programme disponible sur place ou par telephone"],
    prices: [
      { label: "Tarif standard", amount: 1000 },
      { label: "Tarif special / evenement", amount: 2000 },
    ],
    features: ["Climatisation", "Projection numerique", "Son de qualite", "Lieu du FESPACO"],
    mapUrl: "https://www.google.com/maps/dir/?api=1&destination=12.3674,-1.5226",
    lat: 12.3674,
    lon: -1.5226,
  },
  {
    id: "cine-neerwaya",
    name: "Cine Neerwaya",
    address: "Cite An III (secteur 3), cote ouest de l'agence ONATEL, Ouagadougou",
    phone: "70 71 70 47",
    type: "Films africains & spectacles",
    description: "Salle de cinema en plein air situee dans le quartier populaire de la Cite An III. Connue pour ses projections de films africains et ses soirees culturelles. Espace maquis/restaurant a l'entree.",
    showtimes: ["18h30", "20h30", "22h30"],
    prices: [
      { label: "Place standard", amount: 1000 },
      { label: "Loge", amount: 1500 },
    ],
    features: ["Cinema en plein air", "Maquis/restaurant", "Ambiance populaire", "Ouvert 9h - minuit"],
    mapUrl: "https://www.google.com/maps/dir/?api=1&destination=12.3631,-1.5341",
    lat: 12.3631,
    lon: -1.5341,
  },
];

export const RECENT_FILMS: RecentFilm[] = [
  { id: "rf-1", title: "C'est mon pain croustillant", cinema: "Cine Burkina", genre: "Comedie", country: "Burkina Faso", source: "sortir.bf" },
  { id: "rf-2", title: "Ingratitude", cinema: "Cine Burkina", genre: "Drame", country: "Burkina Faso", source: "sortir.bf" },
  { id: "rf-3", title: "Trahison du peuple", cinema: "Cine Burkina", genre: "Drame", country: "Burkina Faso", source: "sortir.bf" },
  { id: "rf-4", title: "Epines du Sahel", cinema: "Cine Burkina", genre: "Drame", country: "Burkina Faso", source: "sortir.bf" },
  { id: "rf-5", title: "Oeil pour oeil, dent pour dent", cinema: "Cine Burkina", genre: "Drame", country: "Burkina Faso", source: "sortir.bf" },
  { id: "rf-6", title: "Ma femme mon combat", cinema: "Cine Burkina", genre: "Drame", country: "Burkina Faso", source: "sortir.bf" },
  { id: "rf-7", title: "Sacre Madou", cinema: "Cine Burkina", genre: "Comedie", country: "Burkina Faso", source: "sortir.bf" },
  { id: "rf-8", title: "Les mains de l'ombre", cinema: "Cine Burkina", genre: "Thriller", country: "Burkina Faso", source: "sortir.bf" },
  { id: "rf-9", title: "Nina", cinema: "Cine Burkina", genre: "Drame", country: "Burkina Faso", source: "sortir.bf" },
  { id: "rf-10", title: "Le PPS de Soum le Sapeur", cinema: "Cine Burkina", genre: "Comedie", country: "Burkina Faso", source: "sortir.bf" },
  { id: "rf-11", title: "Ivanna", cinema: "Cine Neerwaya", genre: "Drame", country: "Burkina Faso", source: "sortir.bf" },
  { id: "rf-12", title: "Bambino Show : Edition speciale", cinema: "Cine Neerwaya", genre: "Spectacle", country: "Burkina Faso", source: "sortir.bf" },
  { id: "rf-13", title: "Malla, aussi loin que dure la nuit", cinema: "Cine Neerwaya", genre: "Drame", country: "Burkina Faso", source: "sortir.bf" },
  { id: "rf-14", title: "Erreur conjugale", cinema: "Cine Neerwaya", genre: "Drame", country: "Burkina Faso", source: "sortir.bf" },
  { id: "rf-15", title: "Jeux d'amour", cinema: "Cine Neerwaya", genre: "Romance", country: "Burkina Faso", source: "sortir.bf" },
  { id: "rf-16", title: "Trahison profonde", cinema: "Cine Neerwaya", genre: "Drame", country: "Burkina Faso", source: "sortir.bf" },
  { id: "rf-17", title: "Pizaroro devance le Pere Noel", cinema: "Cine Neerwaya", genre: "Comedie", country: "Burkina Faso", source: "sortir.bf" },
  { id: "rf-18", title: "Le dragueur de Ouaga", cinema: "Cine Neerwaya", genre: "Comedie", country: "Burkina Faso", source: "sortir.bf" },
];
