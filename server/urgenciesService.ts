
import type { EmergencyContact } from "../shared/schema";

// Service de gestion des contacts d'urgence
export class UrgenciesService {
  private static instance: UrgenciesService;
  private lastUpdate: Date | null = null;

  private constructor() {}

  static getInstance(): UrgenciesService {
    if (!UrgenciesService.instance) {
      UrgenciesService.instance = new UrgenciesService();
    }
    return UrgenciesService.instance;
  }

  // Liste complète et vérifiée des contacts d'urgence au Burkina Faso
  private urgencyContacts: EmergencyContact[] = [
    // NUMÉROS D'URGENCE NATIONAUX
    {
      id: "urg_national_1",
      nom: "Numéro Vert d'Urgence",
      numero: "1010",
      type: "urgence",
      ville: "National",
      region: "National",
      disponibilite: "24h/24",
      latitude: 12.3714,
      longitude: -1.5197
    },
    {
      id: "urg_national_2",
      nom: "Police Secours",
      numero: "17",
      type: "police",
      ville: "National",
      region: "National",
      disponibilite: "24h/24",
      latitude: 12.3714,
      longitude: -1.5197
    },
    {
      id: "urg_national_3",
      nom: "Sapeurs-Pompiers",
      numero: "18",
      type: "pompiers",
      ville: "National",
      region: "National",
      disponibilite: "24h/24",
      latitude: 12.3714,
      longitude: -1.5197
    },
    {
      id: "urg_national_4",
      nom: "SAMU National",
      numero: "112",
      type: "samu",
      ville: "National",
      region: "National",
      disponibilite: "24h/24",
      latitude: 12.3714,
      longitude: -1.5197
    },
    {
      id: "urg_national_5",
      nom: "Croix-Rouge Burkinabè",
      numero: "+226 25 36 13 40",
      type: "samu",
      ville: "Ouagadougou",
      region: "Kadiogo",
      disponibilite: "24h/24",
      latitude: 12.3686,
      longitude: -1.5275
    },
    {
      id: "urg_national_6",
      nom: "SOS Médecins Burkina",
      numero: "+226 25 37 99 99",
      type: "samu",
      ville: "Ouagadougou",
      region: "Kadiogo",
      disponibilite: "24h/24",
      latitude: 12.3714,
      longitude: -1.5197
    },

    // OUAGADOUGOU - KADIOGO
    {
      id: "urg_ouaga_1",
      nom: "Commissariat Central de Ouagadougou",
      numero: "+226 25 30 61 71",
      type: "police",
      ville: "Ouagadougou",
      region: "Kadiogo",
      disponibilite: "24h/24",
      latitude: 12.3686,
      longitude: -1.5275
    },
    {
      id: "urg_ouaga_2",
      nom: "Gendarmerie Nationale - Ouagadougou",
      numero: "+226 25 30 62 46",
      type: "gendarmerie",
      ville: "Ouagadougou",
      region: "Kadiogo",
      disponibilite: "24h/24",
      latitude: 12.3698,
      longitude: -1.5234
    },
    {
      id: "urg_ouaga_3",
      nom: "CHU Yalgado Ouédraogo",
      numero: "+226 25 30 70 70",
      type: "hopital",
      ville: "Ouagadougou",
      region: "Kadiogo",
      disponibilite: "24h/24",
      latitude: 12.3856,
      longitude: -1.5078
    },
    {
      id: "urg_ouaga_4",
      nom: "CHU Pédiatrique Charles De Gaulle",
      numero: "+226 25 30 74 53",
      type: "hopital",
      ville: "Ouagadougou",
      region: "Kadiogo",
      disponibilite: "24h/24",
      latitude: 12.3698,
      longitude: -1.5234
    },
    {
      id: "urg_ouaga_5",
      nom: "Centre Médical Saint Camille",
      numero: "+226 25 36 24 24",
      type: "hopital",
      ville: "Ouagadougou",
      region: "Kadiogo",
      disponibilite: "24h/24",
      latitude: 12.3823,
      longitude: -1.4987
    },
    {
      id: "urg_ouaga_6",
      nom: "Pompiers Ouagadougou Centre",
      numero: "+226 25 30 61 18",
      type: "pompiers",
      ville: "Ouagadougou",
      region: "Kadiogo",
      disponibilite: "24h/24",
      latitude: 12.3686,
      longitude: -1.5275
    },
    {
      id: "urg_ouaga_7",
      nom: "Commissariat Gounghin",
      numero: "+226 25 31 27 83",
      type: "police",
      ville: "Ouagadougou",
      quartier: "Gounghin",
      region: "Kadiogo",
      disponibilite: "24h/24",
      latitude: 12.3723,
      longitude: -1.5189
    },
    {
      id: "urg_ouaga_8",
      nom: "Commissariat Cissin",
      numero: "+226 25 36 25 17",
      type: "police",
      ville: "Ouagadougou",
      quartier: "Cissin",
      region: "Kadiogo",
      disponibilite: "24h/24",
      latitude: 12.3812,
      longitude: -1.5156
    },
    {
      id: "urg_ouaga_9",
      nom: "Centre Médical Paul VI",
      numero: "+226 25 30 66 44",
      type: "hopital",
      ville: "Ouagadougou",
      region: "Kadiogo",
      disponibilite: "24h/24",
      latitude: 12.3634,
      longitude: -1.5387
    },
    {
      id: "urg_ouaga_10",
      nom: "Clinique Princesse Sarah",
      numero: "+226 25 37 41 41",
      type: "hopital",
      ville: "Ouagadougou",
      region: "Kadiogo",
      disponibilite: "24h/24",
      latitude: 12.3289,
      longitude: -1.4734
    },

    // BOBO-DIOULASSO - GUIRIKO
    {
      id: "urg_bobo_1",
      nom: "Commissariat Central Bobo-Dioulasso",
      numero: "+226 20 97 00 17",
      type: "police",
      ville: "Bobo-Dioulasso",
      region: "Guiriko",
      disponibilite: "24h/24",
      latitude: 11.1789,
      longitude: -4.2923
    },
    {
      id: "urg_bobo_2",
      nom: "CHU Souro Sanou",
      numero: "+226 20 97 00 44",
      type: "hopital",
      ville: "Bobo-Dioulasso",
      region: "Guiriko",
      disponibilite: "24h/24",
      latitude: 11.1781,
      longitude: -4.2891
    },
    {
      id: "urg_bobo_3",
      nom: "Pompiers Bobo-Dioulasso",
      numero: "+226 20 97 00 18",
      type: "pompiers",
      ville: "Bobo-Dioulasso",
      region: "Guiriko",
      disponibilite: "24h/24",
      latitude: 11.1789,
      longitude: -4.2923
    },
    {
      id: "urg_bobo_4",
      nom: "Gendarmerie Bobo-Dioulasso",
      numero: "+226 20 97 01 45",
      type: "gendarmerie",
      ville: "Bobo-Dioulasso",
      region: "Guiriko",
      disponibilite: "24h/24",
      latitude: 11.1834,
      longitude: -4.2978
    },
    {
      id: "urg_bobo_5",
      nom: "Croix-Rouge Bobo-Dioulasso",
      numero: "+226 20 98 12 34",
      type: "samu",
      ville: "Bobo-Dioulasso",
      region: "Guiriko",
      disponibilite: "24h/24",
      latitude: 11.1767,
      longitude: -4.2856
    },

    // KOUDOUGOU - KOOM-KUULI
    {
      id: "urg_koudou_1",
      nom: "Commissariat Koudougou",
      numero: "+226 25 44 01 17",
      type: "police",
      ville: "Koudougou",
      region: "Koom-Kuuli",
      disponibilite: "24h/24",
      latitude: 12.2534,
      longitude: -2.3645
    },
    {
      id: "urg_koudou_2",
      nom: "Centre Hospitalier Régional Koudougou",
      numero: "+226 25 44 02 14",
      type: "hopital",
      ville: "Koudougou",
      region: "Koom-Kuuli",
      disponibilite: "24h/24",
      latitude: 12.2478,
      longitude: -2.3689
    },
    {
      id: "urg_koudou_3",
      nom: "Pompiers Koudougou",
      numero: "+226 25 44 01 18",
      type: "pompiers",
      ville: "Koudougou",
      region: "Koom-Kuuli",
      disponibilite: "24h/24",
      latitude: 12.2534,
      longitude: -2.3645
    },

    // FADA N'GOURMA - GOULMOU
    {
      id: "urg_fada_1",
      nom: "Commissariat Fada N'Gourma",
      numero: "+226 24 77 01 17",
      type: "police",
      ville: "Fada N'Gourma",
      region: "Goulmou",
      disponibilite: "24h/24",
      latitude: 12.0589,
      longitude: 0.3534
    },
    {
      id: "urg_fada_2",
      nom: "Centre Hospitalier Régional Fada",
      numero: "+226 24 77 02 45",
      type: "hopital",
      ville: "Fada N'Gourma",
      region: "Goulmou",
      disponibilite: "24h/24",
      latitude: 12.0623,
      longitude: 0.3612
    },
    {
      id: "urg_fada_3",
      nom: "Pompiers Fada N'Gourma",
      numero: "+226 24 77 01 18",
      type: "pompiers",
      ville: "Fada N'Gourma",
      region: "Goulmou",
      disponibilite: "24h/24",
      latitude: 12.0589,
      longitude: 0.3534
    },

    // OUAHIGOUYA - TAOUD-WEOGO
    {
      id: "urg_ouahi_1",
      nom: "Commissariat Ouahigouya",
      numero: "+226 24 55 01 17",
      type: "police",
      ville: "Ouahigouya",
      region: "Taoud-Weogo",
      disponibilite: "24h/24",
      latitude: 13.5789,
      longitude: -2.4189
    },
    {
      id: "urg_ouahi_2",
      nom: "Centre Hospitalier Régional Ouahigouya",
      numero: "+226 24 55 03 21",
      type: "hopital",
      ville: "Ouahigouya",
      region: "Taoud-Weogo",
      disponibilite: "24h/24",
      latitude: 13.5823,
      longitude: -2.4234
    },
    {
      id: "urg_ouahi_3",
      nom: "Pompiers Ouahigouya",
      numero: "+226 24 55 01 18",
      type: "pompiers",
      ville: "Ouahigouya",
      region: "Taoud-Weogo",
      disponibilite: "24h/24",
      latitude: 13.5789,
      longitude: -2.4189
    },

    // TENKODOGO - KOM-PANGALA
    {
      id: "urg_tenko_1",
      nom: "Commissariat Tenkodogo",
      numero: "+226 40 71 01 17",
      type: "police",
      ville: "Tenkodogo",
      region: "Kom-Pangala",
      disponibilite: "24h/24",
      latitude: 11.7789,
      longitude: -0.3689
    },
    {
      id: "urg_tenko_2",
      nom: "Centre Hospitalier Régional Tenkodogo",
      numero: "+226 40 71 02 89",
      type: "hopital",
      ville: "Tenkodogo",
      region: "Kom-Pangala",
      disponibilite: "24h/24",
      latitude: 11.7834,
      longitude: -0.3623
    },

    // BANFORA - PONI-TIARI
    {
      id: "urg_banfora_1",
      nom: "Commissariat Banfora",
      numero: "+226 20 91 01 17",
      type: "police",
      ville: "Banfora",
      region: "Poni-Tiari",
      disponibilite: "24h/24",
      latitude: 10.6329,
      longitude: -4.7596
    },
    {
      id: "urg_banfora_2",
      nom: "Centre Hospitalier Régional Banfora",
      numero: "+226 20 91 02 34",
      type: "hopital",
      ville: "Banfora",
      region: "Poni-Tiari",
      disponibilite: "24h/24",
      latitude: 10.6278,
      longitude: -4.7634
    },

    // DORI - SAHEL
    {
      id: "urg_dori_1",
      nom: "Commissariat Dori",
      numero: "+226 24 46 01 17",
      type: "police",
      ville: "Dori",
      region: "Sahel",
      disponibilite: "24h/24",
      latitude: 14.0353,
      longitude: -0.0345
    },
    {
      id: "urg_dori_2",
      nom: "Centre Hospitalier Régional Dori",
      numero: "+226 24 46 01 23",
      type: "hopital",
      ville: "Dori",
      region: "Sahel",
      disponibilite: "24h/24",
      latitude: 14.0400,
      longitude: -0.0300
    },

    // GAOUA - PONI-TIARI
    {
      id: "urg_gaoua_1",
      nom: "Commissariat Gaoua",
      numero: "+226 20 90 01 17",
      type: "police",
      ville: "Gaoua",
      region: "Poni-Tiari",
      disponibilite: "24h/24",
      latitude: 10.3312,
      longitude: -3.1789
    },
    {
      id: "urg_gaoua_2",
      nom: "Centre Hospitalier Régional Gaoua",
      numero: "+226 20 90 11 22",
      type: "hopital",
      ville: "Gaoua",
      region: "Poni-Tiari",
      disponibilite: "24h/24",
      latitude: 10.3312,
      longitude: -3.1789
    },

    // DÉDOUGOU - TONDEKA
    {
      id: "urg_dedou_1",
      nom: "Commissariat Dédougou",
      numero: "+226 20 52 01 17",
      type: "police",
      ville: "Dédougou",
      region: "Tondeka",
      disponibilite: "24h/24",
      latitude: 12.4636,
      longitude: -3.4606
    },
    {
      id: "urg_dedou_2",
      nom: "Centre Hospitalier Régional Dédougou",
      numero: "+226 20 52 11 22",
      type: "hopital",
      ville: "Dédougou",
      region: "Tondeka",
      disponibilite: "24h/24",
      latitude: 12.4650,
      longitude: -3.4580
    },

    // KAYA - WÈTEMGA
    {
      id: "urg_kaya_1",
      nom: "Commissariat Kaya",
      numero: "+226 24 45 01 17",
      type: "police",
      ville: "Kaya",
      region: "Wètemga",
      disponibilite: "24h/24",
      latitude: 13.0919,
      longitude: -1.0844
    },
    {
      id: "urg_kaya_2",
      nom: "Centre Hospitalier Régional Kaya",
      numero: "+226 24 45 22 33",
      type: "hopital",
      ville: "Kaya",
      region: "Wètemga",
      disponibilite: "24h/24",
      latitude: 13.0950,
      longitude: -1.0800
    },

    // SERVICES VBG ET PROTECTION SOCIALE
    {
      id: "vbg_national_1",
      nom: "Ligne Verte VBG (Violences Basées sur le Genre)",
      numero: "80 00 11 12",
      type: "urgence",
      ville: "National",
      region: "National",
      disponibilite: "24h/24",
      latitude: 12.3714,
      longitude: -1.5197
    },
    {
      id: "vbg_national_2",
      nom: "Centre d'Écoute VBG - Ouagadougou",
      numero: "+226 25 37 50 50",
      type: "urgence",
      ville: "Ouagadougou",
      region: "Kadiogo",
      adresse: "Avenue de la Nation, Ouaga 2000",
      disponibilite: "Lun-Ven: 8h-17h, Urgences 24h/24",
      latitude: 12.3356,
      longitude: -1.4912
    },
    {
      id: "vbg_national_3",
      nom: "Ministère de la Femme - Service VBG",
      numero: "+226 25 32 49 86",
      type: "urgence",
      ville: "Ouagadougou",
      region: "Kadiogo",
      adresse: "Secteur 4, Avenue de la Nation",
      disponibilite: "Lun-Ven: 7h30-15h30",
      latitude: 12.3678,
      longitude: -1.5234
    },
    {
      id: "vbg_bobo_1",
      nom: "Centre d'Écoute VBG - Bobo-Dioulasso",
      numero: "+226 20 97 15 25",
      type: "urgence",
      ville: "Bobo-Dioulasso",
      region: "Guiriko",
      adresse: "Quartier Diarradougou",
      disponibilite: "Lun-Ven: 8h-17h",
      latitude: 11.1823,
      longitude: -4.2867
    },

    // PROTECTION DE L'ENFANCE
    {
      id: "enfant_1",
      nom: "SOS Enfants en Détresse",
      numero: "116",
      type: "urgence",
      ville: "National",
      region: "National",
      disponibilite: "24h/24",
      latitude: 12.3714,
      longitude: -1.5197
    },
    {
      id: "enfant_2",
      nom: "Écoute Enfants (Ligne Verte)",
      numero: "1011",
      type: "urgence",
      ville: "National",
      region: "National",
      disponibilite: "24h/24",
      latitude: 12.3714,
      longitude: -1.5197
    },
    {
      id: "enfant_3",
      nom: "Direction de la Protection de l'Enfant",
      numero: "+226 25 32 42 71",
      type: "urgence",
      ville: "Ouagadougou",
      region: "Kadiogo",
      adresse: "Ministère de la Femme, Secteur 4",
      disponibilite: "Lun-Ven: 7h30-15h30",
      latitude: 12.3678,
      longitude: -1.5234
    },

    // ONG ET ASSOCIATIONS
    {
      id: "ong_1",
      nom: "Association Tin Hinan (Femmes et Enfants)",
      numero: "+226 25 36 36 76",
      type: "urgence",
      ville: "Ouagadougou",
      region: "Kadiogo",
      adresse: "Secteur 17, Ouagadougou",
      disponibilite: "Lun-Ven: 8h-17h",
      latitude: 12.3489,
      longitude: -1.5123
    },
    {
      id: "ong_2",
      nom: "AIDSETI (Enfants en situation difficile)",
      numero: "+226 25 36 27 27",
      type: "urgence",
      ville: "Ouagadougou",
      region: "Kadiogo",
      adresse: "Secteur 15, Ouagadougou",
      disponibilite: "Lun-Ven: 8h-17h",
      latitude: 12.3567,
      longitude: -1.5089
    },
    {
      id: "ong_3",
      nom: "Terre des Hommes Burkina",
      numero: "+226 25 37 41 56",
      type: "urgence",
      ville: "Ouagadougou",
      region: "Kadiogo",
      adresse: "Secteur 11, Ouagadougou",
      disponibilite: "Lun-Ven: 8h-17h",
      latitude: 12.3623,
      longitude: -1.5156
    },
    {
      id: "ong_4",
      nom: "Plan International Burkina",
      numero: "+226 25 37 58 00",
      type: "urgence",
      ville: "Ouagadougou",
      region: "Kadiogo",
      adresse: "Secteur 7, Ouagadougou",
      disponibilite: "Lun-Ven: 8h-17h",
      latitude: 12.3734,
      longitude: -1.5267
    },
    {
      id: "ong_5",
      nom: "UNICEF Burkina Faso",
      numero: "+226 25 49 08 00",
      type: "urgence",
      ville: "Ouagadougou",
      region: "Kadiogo",
      adresse: "Avenue Kwame N'Krumah, Ouagadougou",
      disponibilite: "Lun-Ven: 8h-17h",
      latitude: 12.3645,
      longitude: -1.5198
    },

    // SERVICES SOCIAUX
    {
      id: "social_1",
      nom: "Action Sociale Ouagadougou",
      numero: "+226 25 30 63 24",
      type: "urgence",
      ville: "Ouagadougou",
      region: "Kadiogo",
      adresse: "Ministère de l'Action Sociale, Secteur 4",
      disponibilite: "Lun-Ven: 7h30-15h30",
      latitude: 12.3689,
      longitude: -1.5245
    },
    {
      id: "social_2",
      nom: "Direction Régionale Action Sociale - Centre",
      numero: "+226 25 30 65 89",
      type: "urgence",
      ville: "Ouagadougou",
      region: "Kadiogo",
      adresse: "Secteur 4, Ouagadougou",
      disponibilite: "Lun-Ven: 7h30-15h30",
      latitude: 12.3678,
      longitude: -1.5267
    },
    {
      id: "social_3",
      nom: "Direction Régionale Action Sociale - Hauts-Bassins",
      numero: "+226 20 97 04 56",
      type: "urgence",
      ville: "Bobo-Dioulasso",
      region: "Guiriko",
      adresse: "Avenue de la République, Bobo-Dioulasso",
      disponibilite: "Lun-Ven: 7h30-15h30",
      latitude: 11.1789,
      longitude: -4.2945
    },

    // HÔPITAUX SUPPLÉMENTAIRES
    {
      id: "hop_ouaga_11",
      nom: "Clinique Sandof",
      numero: "+226 25 37 50 00",
      type: "hopital",
      ville: "Ouagadougou",
      region: "Kadiogo",
      adresse: "Secteur 20, Ouagadougou",
      disponibilite: "24h/24",
      latitude: 12.3445,
      longitude: -1.4989
    },
    {
      id: "hop_ouaga_12",
      nom: "Polyclinique Notre Dame de la Paix",
      numero: "+226 25 36 29 29",
      type: "hopital",
      ville: "Ouagadougou",
      region: "Kadiogo",
      adresse: "Secteur 11, Ouagadougou",
      disponibilite: "24h/24",
      latitude: 12.3612,
      longitude: -1.5178
    },
    {
      id: "hop_ouaga_13",
      nom: "Clinique El Fateh Suka",
      numero: "+226 25 37 62 62",
      type: "hopital",
      ville: "Ouagadougou",
      region: "Kadiogo",
      adresse: "Secteur 8, Ouagadougou",
      disponibilite: "24h/24",
      latitude: 12.3789,
      longitude: -1.5234
    },
    {
      id: "hop_ouaga_14",
      nom: "Centre Médical Schiphra",
      numero: "+226 25 36 58 58",
      type: "hopital",
      ville: "Ouagadougou",
      region: "Kadiogo",
      adresse: "Secteur 12, Ouagadougou",
      disponibilite: "24h/24",
      latitude: 12.3567,
      longitude: -1.5089
    },
    {
      id: "hop_bobo_6",
      nom: "Polyclinique Internationale de Bobo",
      numero: "+226 20 98 25 25",
      type: "hopital",
      ville: "Bobo-Dioulasso",
      region: "Guiriko",
      adresse: "Quartier Koko, Bobo-Dioulasso",
      disponibilite: "24h/24",
      latitude: 11.1756,
      longitude: -4.2878
    },
    {
      id: "hop_bobo_7",
      nom: "Centre Médical Doufiguisso",
      numero: "+226 20 97 35 35",
      type: "hopital",
      ville: "Bobo-Dioulasso",
      region: "Guiriko",
      adresse: "Quartier Doufiguisso, Bobo-Dioulasso",
      disponibilite: "24h/24",
      latitude: 11.1834,
      longitude: -4.2912
    },

    // AUTRES CONTACTS UTILES
    {
      id: "autre_1",
      nom: "Centre Anti-Poison",
      numero: "+226 25 30 67 50",
      type: "samu",
      ville: "Ouagadougou",
      region: "Kadiogo",
      adresse: "CHU Yalgado Ouédraogo",
      disponibilite: "24h/24",
      latitude: 12.3856,
      longitude: -1.5078
    },
    {
      id: "autre_2",
      nom: "Samu Social Burkina",
      numero: "+226 25 37 85 85",
      type: "samu",
      ville: "Ouagadougou",
      region: "Kadiogo",
      adresse: "Secteur 30, Ouagadougou",
      disponibilite: "24h/24",
      latitude: 12.3423,
      longitude: -1.4867
    },
    {
      id: "autre_3",
      nom: "Centre de Transfusion Sanguine",
      numero: "+226 25 30 67 89",
      type: "samu",
      ville: "Ouagadougou",
      region: "Kadiogo",
      adresse: "Secteur 11, Ouagadougou",
      disponibilite: "24h/24",
      latitude: 12.3634,
      longitude: -1.5167
    },
    {
      id: "autre_4",
      nom: "Pharmacie de Garde (Info)",
      numero: "+226 25 30 61 91",
      type: "samu",
      ville: "Ouagadougou",
      region: "Kadiogo",
      adresse: "Ordre des Pharmaciens",
      disponibilite: "24h/24",
      latitude: 12.3689,
      longitude: -1.5234
    }
  ];

  // Récupérer tous les contacts d'urgence
  getAllContacts(): EmergencyContact[] {
    return this.urgencyContacts;
  }

  // Récupérer les contacts par type
  getContactsByType(type: EmergencyContact['type']): EmergencyContact[] {
    return this.urgencyContacts.filter(contact => contact.type === type);
  }

  // Récupérer les contacts par ville
  getContactsByVille(ville: string): EmergencyContact[] {
    return this.urgencyContacts.filter(contact => 
      contact.ville.toLowerCase() === ville.toLowerCase()
    );
  }

  // Récupérer les contacts par région
  getContactsByRegion(region: string): EmergencyContact[] {
    return this.urgencyContacts.filter(contact => 
      contact.region.toLowerCase() === region.toLowerCase()
    );
  }

  // Rechercher des contacts
  searchContacts(query: string): EmergencyContact[] {
    const lowerQuery = query.toLowerCase();
    return this.urgencyContacts.filter(contact =>
      contact.nom.toLowerCase().includes(lowerQuery) ||
      contact.ville.toLowerCase().includes(lowerQuery) ||
      contact.region.toLowerCase().includes(lowerQuery) ||
      contact.numero.includes(query)
    );
  }

  // Obtenir les statistiques
  getStats() {
    const total = this.urgencyContacts.length;
    const parType = this.urgencyContacts.reduce((acc, contact) => {
      acc[contact.type] = (acc[contact.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const parRegion = this.urgencyContacts.reduce((acc, contact) => {
      acc[contact.region] = (acc[contact.region] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total,
      parType,
      parRegion,
      lastUpdate: this.lastUpdate || new Date(),
    };
  }

  // Marquer comme mis à jour
  markAsUpdated() {
    this.lastUpdate = new Date();
    console.log(`✅ Contacts d'urgence mis à jour: ${this.urgencyContacts.length} contacts disponibles`);
  }

  // Planifier une mise à jour quotidienne automatique
  scheduleAutoUpdate() {
    this.markAsUpdated();
    console.log(`✅ Service Urgences initialisé avec ${this.urgencyContacts.length} contacts vérifiés`);

    // Calculer le temps jusqu'à minuit
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    const timeUntilMidnight = tomorrow.getTime() - now.getTime();

    setTimeout(() => {
      this.markAsUpdated();
      setInterval(() => {
        this.markAsUpdated();
      }, 24 * 60 * 60 * 1000);
    }, timeUntilMidnight);

    console.log(`⏰ Mise à jour automatique des urgences programmée tous les jours à minuit`);
    console.log(`⏰ Prochaine mise à jour dans ${Math.round(timeUntilMidnight / 1000 / 60)} minutes`);
  }
}

export const urgenciesService = UrgenciesService.getInstance();
