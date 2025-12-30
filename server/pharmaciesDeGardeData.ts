// Données officielles des pharmacies de garde du Burkina Faso
// Source: Orange Burkina Faso (https://www.orange.bf)
// Mise à jour: Décembre 2024
// Les pharmacies sont organisées en 4 groupes qui assurent la garde à tour de rôle chaque semaine

export interface PharmacieDeGarde {
  nom: string;
  telephone: string;
  groupe: 1 | 2 | 3 | 4;
  ville: "Ouagadougou" | "Bobo-Dioulasso";
}

// Pharmacies de Ouagadougou - Groupe 1
const OUAGA_GROUPE_1: PharmacieDeGarde[] = [
  { nom: "Pharmacie Avenir", telephone: "+226 25 36 13 38", groupe: 1, ville: "Ouagadougou" },
  { nom: "Pharmacie Baowendsom", telephone: "+226 25 41 44 99", groupe: 1, ville: "Ouagadougou" },
  { nom: "Pharmacie Barkwende", telephone: "+226 25 40 85 90", groupe: 1, ville: "Ouagadougou" },
  { nom: "Pharmacie Beatitudes", telephone: "+226 25 37 47 11", groupe: 1, ville: "Ouagadougou" },
  { nom: "Pharmacie Benaia", telephone: "+226 25 37 28 30", groupe: 1, ville: "Ouagadougou" },
  { nom: "Pharmacie Bonheur", telephone: "+226 72 94 55 26", groupe: 1, ville: "Ouagadougou" },
  { nom: "Pharmacie Camille", telephone: "+226 25 36 61 27", groupe: 1, ville: "Ouagadougou" },
  { nom: "Pharmacie du Centre", telephone: "+226 25 31 16 60", groupe: 1, ville: "Ouagadougou" },
  { nom: "Pharmacie Crystal", telephone: "+226 60 46 08 08", groupe: 1, ville: "Ouagadougou" },
  { nom: "Pharmacie Des Apotres", telephone: "+226 25 38 03 82", groupe: 1, ville: "Ouagadougou" },
  { nom: "Pharmacie Desa", telephone: "+226 25 47 50 50", groupe: 1, ville: "Ouagadougou" },
  { nom: "Pharmacie Diaby", telephone: "+226 25 33 50 00", groupe: 1, ville: "Ouagadougou" },
  { nom: "Pharmacie Dominique Kabore", telephone: "+226 25 38 48 84", groupe: 1, ville: "Ouagadougou" },
  { nom: "Pharmacie El Wanogo", telephone: "+226 25 40 70 22", groupe: 1, ville: "Ouagadougou" },
  { nom: "Pharmacie Elite", telephone: "+226 25 41 91 77", groupe: 1, ville: "Ouagadougou" },
  { nom: "Pharmacie Hope", telephone: "+226 71 14 22 22", groupe: 1, ville: "Ouagadougou" },
  { nom: "Pharmacie Jober", telephone: "+226 25 45 51 75", groupe: 1, ville: "Ouagadougou" },
  { nom: "Pharmacie Katra", telephone: "+226 25 37 20 13", groupe: 1, ville: "Ouagadougou" },
  { nom: "Pharmacie Keneya", telephone: "+226 25 46 82 47", groupe: 1, ville: "Ouagadougou" },
  { nom: "Pharmacie Kossodo", telephone: "+226 25 35 63 04", groupe: 1, ville: "Ouagadougou" },
  { nom: "Pharmacie Koumajer", telephone: "+226 70 88 14 10", groupe: 1, ville: "Ouagadougou" },
  { nom: "Pharmacie Lanibougna", telephone: "+226 25 48 07 97", groupe: 1, ville: "Ouagadougou" },
  { nom: "Pharmacie Lanzane", telephone: "+226 25 47 10 65", groupe: 1, ville: "Ouagadougou" },
  { nom: "Pharmacie Les Champions", telephone: "+226 51 00 15 25", groupe: 1, ville: "Ouagadougou" },
  { nom: "Pharmacie Liberte", telephone: "+226 25 41 01 31", groupe: 1, ville: "Ouagadougou" },
  { nom: "Pharmacie Lina", telephone: "+226 73 48 35 65", groupe: 1, ville: "Ouagadougou" },
  { nom: "Pharmacie Magnificat", telephone: "+226 25 41 29 90", groupe: 1, ville: "Ouagadougou" },
  { nom: "Pharmacie Mare", telephone: "+226 25 34 11 28", groupe: 1, ville: "Ouagadougou" },
  { nom: "Pharmacie Minitche", telephone: "+226 72 25 76 76", groupe: 1, ville: "Ouagadougou" },
  { nom: "Pharmacie Monderou", telephone: "+226 25 34 05 28", groupe: 1, ville: "Ouagadougou" },
  { nom: "Pharmacie Nouvelle", telephone: "+226 25 31 61 34", groupe: 1, ville: "Ouagadougou" },
  { nom: "Pharmacie Pelega", telephone: "+226 25 35 05 01", groupe: 1, ville: "Ouagadougou" },
  { nom: "Pharmacie Rachel Yagma", telephone: "+226 25 40 70 09", groupe: 1, ville: "Ouagadougou" },
  { nom: "Pharmacie Rayib-Tiga", telephone: "+226 62 32 11 53", groupe: 1, ville: "Ouagadougou" },
  { nom: "Pharmacie Rivage", telephone: "+226 25 34 19 39", groupe: 1, ville: "Ouagadougou" },
  { nom: "Pharmacie Saint Bernard", telephone: "+226 25 45 14 82", groupe: 1, ville: "Ouagadougou" },
  { nom: "Pharmacie Saint Francois D'Assise", telephone: "+226 25 36 85 85", groupe: 1, ville: "Ouagadougou" },
  { nom: "Pharmacie Saint Jean", telephone: "+226 25 37 00 33", groupe: 1, ville: "Ouagadougou" },
  { nom: "Pharmacie Siloe", telephone: "+226 25 40 27 46", groupe: 1, ville: "Ouagadougou" },
  { nom: "Pharmacie Song Taaba", telephone: "+226 25 36 64 62", groupe: 1, ville: "Ouagadougou" },
  { nom: "Pharmacie Tale", telephone: "+226 71 62 08 08", groupe: 1, ville: "Ouagadougou" },
  { nom: "Pharmacie Tenedia", telephone: "+226 63 93 00 19", groupe: 1, ville: "Ouagadougou" },
  { nom: "Pharmacie Tengandogo", telephone: "+226 11 83 38 2", groupe: 1, ville: "Ouagadougou" },
  { nom: "Pharmacie Trypano", telephone: "+226 25 33 29 41", groupe: 1, ville: "Ouagadougou" },
  { nom: "Pharmacie Wend la Laafi", telephone: "+226 25 43 12 13", groupe: 1, ville: "Ouagadougou" },
  { nom: "Pharmacie Wend la Mita", telephone: "+226 78 83 63 41", groupe: 1, ville: "Ouagadougou" },
  { nom: "Pharmacie Yathrib", telephone: "+226 25 40 23 88", groupe: 1, ville: "Ouagadougou" },
  { nom: "Pharmacie Yentema", telephone: "+226 56 56 00 00", groupe: 1, ville: "Ouagadougou" },
];

// Pharmacies de Ouagadougou - Groupe 2
const OUAGA_GROUPE_2: PharmacieDeGarde[] = [
  { nom: "Pharmacie Adadoa", telephone: "+226 63 88 39 39", groupe: 2, ville: "Ouagadougou" },
  { nom: "Pharmacie Aeroport", telephone: "+226 25 31 42 22", groupe: 2, ville: "Ouagadougou" },
  { nom: "Pharmacie Agora-Rood Wooko", telephone: "+226 25 30 88 90", groupe: 2, ville: "Ouagadougou" },
  { nom: "Pharmacie Amaro", telephone: "+226 25 34 33 28", groupe: 2, ville: "Ouagadougou" },
  { nom: "Pharmacie Ar-Rahma", telephone: "+226 25 35 09 86", groupe: 2, ville: "Ouagadougou" },
  { nom: "Pharmacie Augustine", telephone: "+226 25 37 61 00", groupe: 2, ville: "Ouagadougou" },
  { nom: "Pharmacie Boulmiougou", telephone: "+226 25 43 12 68", groupe: 2, ville: "Ouagadougou" },
  { nom: "Pharmacie Cite An III", telephone: "+226 25 33 19 66", groupe: 2, ville: "Ouagadougou" },
  { nom: "Pharmacie Danouma", telephone: "+226 25 39 55 54", groupe: 2, ville: "Ouagadougou" },
  { nom: "Pharmacie Dapoya", telephone: "+226 25 31 32 01", groupe: 2, ville: "Ouagadougou" },
  { nom: "Pharmacie Delwinde", telephone: "+226 25 36 72 80", groupe: 2, ville: "Ouagadougou" },
  { nom: "Pharmacie Denisa", telephone: "+226 71 82 76 60", groupe: 2, ville: "Ouagadougou" },
  { nom: "Pharmacie Faso", telephone: "+226 25 38 19 29", groupe: 2, ville: "Ouagadougou" },
  { nom: "Pharmacie Flayiri", telephone: "+226 25 40 73 44", groupe: 2, ville: "Ouagadougou" },
  { nom: "Pharmacie Hamdalaye", telephone: "+226 25 34 36 94", groupe: 2, ville: "Ouagadougou" },
  { nom: "Pharmacie Heera", telephone: "+226 25 31 66 10", groupe: 2, ville: "Ouagadougou" },
  { nom: "Pharmacie Jabneel", telephone: "+226 25 36 66 01", groupe: 2, ville: "Ouagadougou" },
  { nom: "Pharmacie Jourdain", telephone: "+226 25 36 06 86", groupe: 2, ville: "Ouagadougou" },
  { nom: "Pharmacie Karpala", telephone: "+226 25 37 14 14", groupe: 2, ville: "Ouagadougou" },
  { nom: "Pharmacie Koulouba", telephone: "+226 25 31 19 18", groupe: 2, ville: "Ouagadougou" },
  { nom: "Pharmacie La Roche", telephone: "+226 25 39 51 32", groupe: 2, ville: "Ouagadougou" },
  { nom: "Pharmacie Les Lauriers", telephone: "+226 25 48 37 55", groupe: 2, ville: "Ouagadougou" },
  { nom: "Pharmacie Marlass", telephone: "+226 78 55 00 52", groupe: 2, ville: "Ouagadougou" },
  { nom: "Pharmacie Martin", telephone: "+226 25 50 84 59", groupe: 2, ville: "Ouagadougou" },
  { nom: "Pharmacie Meira", telephone: "+226 25 65 12 46", groupe: 2, ville: "Ouagadougou" },
  { nom: "Pharmacie Meteba", telephone: "+226 25 33 53 33", groupe: 2, ville: "Ouagadougou" },
  { nom: "Pharmacie Nayyira", telephone: "+226 63 78 44 44", groupe: 2, ville: "Ouagadougou" },
  { nom: "Pharmacie Neima", telephone: "+226 25 65 56 82", groupe: 2, ville: "Ouagadougou" },
  { nom: "Pharmacie Nemadis", telephone: "+226 25 48 09 66", groupe: 2, ville: "Ouagadougou" },
  { nom: "Pharmacie Progres", telephone: "+226 25 43 01 62", groupe: 2, ville: "Ouagadougou" },
  { nom: "Pharmacie Rakismanegre", telephone: "+226 62 50 58 18", groupe: 2, ville: "Ouagadougou" },
  { nom: "Pharmacie Sangoule Lamizana", telephone: "+226 25 41 13 00", groupe: 2, ville: "Ouagadougou" },
  { nom: "Pharmacie Schifeyi", telephone: "+226 25 40 27 42", groupe: 2, ville: "Ouagadougou" },
  { nom: "Pharmacie Sig-Noghin", telephone: "+226 25 35 09 77", groupe: 2, ville: "Ouagadougou" },
  { nom: "Pharmacie Sigri", telephone: "+226 25 34 64 22", groupe: 2, ville: "Ouagadougou" },
  { nom: "Pharmacie Sud", telephone: "+226 25 38 42 82", groupe: 2, ville: "Ouagadougou" },
  { nom: "Pharmacie Talba", telephone: "+226 25 36 22 25", groupe: 2, ville: "Ouagadougou" },
  { nom: "Pharmacie Tanko", telephone: "+226 25 35 15 57", groupe: 2, ville: "Ouagadougou" },
  { nom: "Pharmacie Univers", telephone: "+226 25 41 99 65", groupe: 2, ville: "Ouagadougou" },
  { nom: "Pharmacie Viim", telephone: "+226 19 28 88 8", groupe: 2, ville: "Ouagadougou" },
  { nom: "Pharmacie Wati", telephone: "+226 25 38 52 92", groupe: 2, ville: "Ouagadougou" },
  { nom: "Pharmacie Yobi", telephone: "+226 25 31 16 30", groupe: 2, ville: "Ouagadougou" },
  { nom: "Pharmacie Zidou", telephone: "+226 61 07 88 60", groupe: 2, ville: "Ouagadougou" },
];

// Pharmacies de Ouagadougou - Groupe 3
const OUAGA_GROUPE_3: PharmacieDeGarde[] = [
  { nom: "Pharmacie Aimevo", telephone: "+226 25 39 63 99", groupe: 3, ville: "Ouagadougou" },
  { nom: "Pharmacie Arzouma", telephone: "+226 25 48 01 53", groupe: 3, ville: "Ouagadougou" },
  { nom: "Pharmacie Ave Maria", telephone: "+226 25 47 98 88", groupe: 3, ville: "Ouagadougou" },
  { nom: "Pharmacie Balkuy", telephone: "+226 25 37 51 36", groupe: 3, ville: "Ouagadougou" },
  { nom: "Pharmacie Baraka", telephone: "+226 25 33 02 72", groupe: 3, ville: "Ouagadougou" },
  { nom: "Pharmacie Belle Ville", telephone: "+226 25 40 84 14", groupe: 3, ville: "Ouagadougou" },
  { nom: "Pharmacie Carrefour", telephone: "+226 25 33 23 10", groupe: 3, ville: "Ouagadougou" },
  { nom: "Pharmacie Charis", telephone: "+226 25 47 98 78", groupe: 3, ville: "Ouagadougou" },
  { nom: "Pharmacie Concorde", telephone: "+226 25 31 29 49", groupe: 3, ville: "Ouagadougou" },
  { nom: "Pharmacie Coura", telephone: "+226 25 38 83 90", groupe: 3, ville: "Ouagadougou" },
  { nom: "Pharmacie Djabal", telephone: "+226 25 30 05 76", groupe: 3, ville: "Ouagadougou" },
  { nom: "Pharmacie Djimbia", telephone: "+226 78 83 62 74", groupe: 3, ville: "Ouagadougou" },
  { nom: "Pharmacie Dunia", telephone: "+226 25 36 20 51", groupe: 3, ville: "Ouagadougou" },
  { nom: "Pharmacie Ecoles", telephone: "+226 25 31 52 32", groupe: 3, ville: "Ouagadougou" },
  { nom: "Pharmacie Fraternite", telephone: "+226 25 36 48 00", groupe: 3, ville: "Ouagadougou" },
  { nom: "Pharmacie Galiam", telephone: "+226 25 35 28 44", groupe: 3, ville: "Ouagadougou" },
  { nom: "Pharmacie Georgette", telephone: "+226 25 50 05 28", groupe: 3, ville: "Ouagadougou" },
  { nom: "Pharmacie Hamamickely", telephone: "+226 73 78 32 99", groupe: 3, ville: "Ouagadougou" },
  { nom: "Pharmacie Hosanna", telephone: "+226 25 41 26 48", groupe: 3, ville: "Ouagadougou" },
  { nom: "Pharmacie Independance", telephone: "+226 25 31 27 17", groupe: 3, ville: "Ouagadougou" },
  { nom: "Pharmacie Jeunesse", telephone: "+226 25 34 35 04", groupe: 3, ville: "Ouagadougou" },
  { nom: "Pharmacie Kamboinsin", telephone: "+226 62 57 49 49", groupe: 3, ville: "Ouagadougou" },
  { nom: "Pharmacie Kamin", telephone: "+226 25 34 30 28", groupe: 3, ville: "Ouagadougou" },
  { nom: "Pharmacie Kilwin", telephone: "+226 25 50 84 62", groupe: 3, ville: "Ouagadougou" },
  { nom: "Pharmacie La Famille", telephone: "+226 25 43 06 85", groupe: 3, ville: "Ouagadougou" },
  { nom: "Pharmacie La Sainte Trinite", telephone: "+226 25 41 26 46", groupe: 3, ville: "Ouagadougou" },
  { nom: "Pharmacie Naab Raga", telephone: "+226 70 14 39 77", groupe: 3, ville: "Ouagadougou" },
  { nom: "Pharmacie Naaba-Koom", telephone: "+226 25 48 33 34", groupe: 3, ville: "Ouagadougou" },
  { nom: "Pharmacie Nagrin", telephone: "+226 25 46 90 48", groupe: 3, ville: "Ouagadougou" },
  { nom: "Pharmacie Ninrwa", telephone: "+226 25 41 80 38", groupe: 3, ville: "Ouagadougou" },
  { nom: "Pharmacie Noom-Wende", telephone: "+226 25 50 31 17", groupe: 3, ville: "Ouagadougou" },
  { nom: "Pharmacie Pissy", telephone: "+226 25 43 13 35", groupe: 3, ville: "Ouagadougou" },
  { nom: "Pharmacie Sacre Coeur", telephone: "+226 25 34 60 60", groupe: 3, ville: "Ouagadougou" },
  { nom: "Pharmacie Saint Julien", telephone: "+226 25 38 06 10", groupe: 3, ville: "Ouagadougou" },
  { nom: "Pharmacie Saint Lazare", telephone: "+226 25 36 86 48", groupe: 3, ville: "Ouagadougou" },
  { nom: "Pharmacie Saint Michel", telephone: "+226 25 45 48 08", groupe: 3, ville: "Ouagadougou" },
  { nom: "Pharmacie Sante-Vitalite", telephone: "+226 25 40 94 13", groupe: 3, ville: "Ouagadougou" },
  { nom: "Pharmacie Savane", telephone: "+226 70 85 01 61", groupe: 3, ville: "Ouagadougou" },
  { nom: "Pharmacie Taoko", telephone: "+226 25 36 69 27", groupe: 3, ville: "Ouagadougou" },
  { nom: "Pharmacie Teranga", telephone: "+226 25 36 09 70", groupe: 3, ville: "Ouagadougou" },
  { nom: "Pharmacie Ti-Yeele", telephone: "+226 64 36 46 36", groupe: 3, ville: "Ouagadougou" },
  { nom: "Pharmacie Wend Denda", telephone: "+226 71 50 94 92", groupe: 3, ville: "Ouagadougou" },
  { nom: "Pharmacie Yennenga", telephone: "+226 25 37 03 37", groupe: 3, ville: "Ouagadougou" },
  { nom: "Pharmacie Zone I", telephone: "+226 25 48 15 13", groupe: 3, ville: "Ouagadougou" },
  { nom: "Pharmacie Zoungrana", telephone: "+226 25 40 98 75", groupe: 3, ville: "Ouagadougou" },
];

// Pharmacies de Ouagadougou - Groupe 4
const OUAGA_GROUPE_4: PharmacieDeGarde[] = [
  { nom: "Pharmacie 1200 Logements", telephone: "+226 25 36 02 52", groupe: 4, ville: "Ouagadougou" },
  { nom: "Pharmacie Adama", telephone: "+226 62 33 77 77", groupe: 4, ville: "Ouagadougou" },
  { nom: "Pharmacie Afiya", telephone: "+226 25 48 83 47", groupe: 4, ville: "Ouagadougou" },
  { nom: "Pharmacie Amitie Miyougou", telephone: "+226 25 38 52 36", groupe: 4, ville: "Ouagadougou" },
  { nom: "Pharmacie Angele", telephone: "+226 25 35 07 17", groupe: 4, ville: "Ouagadougou" },
  { nom: "Pharmacie Bethania", telephone: "+226 25 31 31 41", groupe: 4, ville: "Ouagadougou" },
  { nom: "Pharmacie Choukroullah", telephone: "+226 25 40 93 76", groupe: 4, ville: "Ouagadougou" },
  { nom: "Pharmacie Circulaire Sede", telephone: "+226 25 38 44 91", groupe: 4, ville: "Ouagadougou" },
  { nom: "Pharmacie De l'Alliance", telephone: "+226 66 06 35 39", groupe: 4, ville: "Ouagadougou" },
  { nom: "Pharmacie Diawara", telephone: "+226 25 30 61 68", groupe: 4, ville: "Ouagadougou" },
  { nom: "Pharmacie Espoir", telephone: "+226 25 31 54 12", groupe: 4, ville: "Ouagadougou" },
  { nom: "Pharmacie Gare", telephone: "+226 25 31 62 06", groupe: 4, ville: "Ouagadougou" },
  { nom: "Pharmacie Hamid", telephone: "+226 25 38 44 27", groupe: 4, ville: "Ouagadougou" },
  { nom: "Pharmacie Hippodrome", telephone: "+226 25 31 02 32", groupe: 4, ville: "Ouagadougou" },
  { nom: "Pharmacie Hopital", telephone: "+226 25 30 66 41", groupe: 4, ville: "Ouagadougou" },
  { nom: "Pharmacie Jean Paul II", telephone: "+226 25 31 87 88", groupe: 4, ville: "Ouagadougou" },
  { nom: "Pharmacie Kadiogo", telephone: "+226 25 39 34 40", groupe: 4, ville: "Ouagadougou" },
  { nom: "Pharmacie Kamalia", telephone: "+226 73 20 77 87", groupe: 4, ville: "Ouagadougou" },
  { nom: "Pharmacie Kawsar", telephone: "+226 25 38 54 42", groupe: 4, ville: "Ouagadougou" },
  { nom: "Pharmacie Kouma", telephone: "+226 25 34 12 64", groupe: 4, ville: "Ouagadougou" },
  { nom: "Pharmacie La Croix", telephone: "+226 25 45 67 25", groupe: 4, ville: "Ouagadougou" },
  { nom: "Pharmacie Lalle", telephone: "+226 25 40 83 87", groupe: 4, ville: "Ouagadougou" },
  { nom: "Pharmacie Le Rocher", telephone: "+226 60 80 80 77", groupe: 4, ville: "Ouagadougou" },
  { nom: "Pharmacie Les Graces", telephone: "+226 25 33 58 67", groupe: 4, ville: "Ouagadougou" },
  { nom: "Pharmacie Louis Pasteur", telephone: "+226 78 83 61 36", groupe: 4, ville: "Ouagadougou" },
  { nom: "Pharmacie Maignon", telephone: "+226 25 65 22 64", groupe: 4, ville: "Ouagadougou" },
  { nom: "Pharmacie Misericorde", telephone: "+226 25 36 68 41", groupe: 4, ville: "Ouagadougou" },
  { nom: "Pharmacie Musee", telephone: "+226 25 37 28 00", groupe: 4, ville: "Ouagadougou" },
  { nom: "Pharmacie Natilge", telephone: "+226 25 40 84 88", groupe: 4, ville: "Ouagadougou" },
  { nom: "Pharmacie Nongui", telephone: "+226 25 37 16 52", groupe: 4, ville: "Ouagadougou" },
  { nom: "Pharmacie Ouedraogo", telephone: "+226 25 37 16 52", groupe: 4, ville: "Ouagadougou" },
  { nom: "Pharmacie Pierre Tapsoba", telephone: "+226 25 50 81 48", groupe: 4, ville: "Ouagadougou" },
  { nom: "Pharmacie Principale", telephone: "+226 25 37 54 15", groupe: 4, ville: "Ouagadougou" },
  { nom: "Pharmacie Providence", telephone: "+226 25 31 86 48", groupe: 4, ville: "Ouagadougou" },
  { nom: "Pharmacie Saaba", telephone: "+226 25 40 86 99", groupe: 4, ville: "Ouagadougou" },
  { nom: "Pharmacie Sahel", telephone: "+226 25 31 81 95", groupe: 4, ville: "Ouagadougou" },
  { nom: "Pharmacie Sainte Odile", telephone: "+226 51 69 77 77", groupe: 4, ville: "Ouagadougou" },
  { nom: "Pharmacie Sira", telephone: "+226 25 43 17 78", groupe: 4, ville: "Ouagadougou" },
  { nom: "Pharmacie Somgande", telephone: "+226 70 14 39 25", groupe: 4, ville: "Ouagadougou" },
  { nom: "Pharmacie Sotisse", telephone: "+226 25 36 41 48", groupe: 4, ville: "Ouagadougou" },
  { nom: "Pharmacie Unite", telephone: "+226 25 34 39 42", groupe: 4, ville: "Ouagadougou" },
  { nom: "Pharmacie Venegre", telephone: "+226 25 43 05 87", groupe: 4, ville: "Ouagadougou" },
  { nom: "Pharmacie Vidal Bafa", telephone: "+226 25 31 52 88", groupe: 4, ville: "Ouagadougou" },
  { nom: "Pharmacie Viel", telephone: "+226 25 45 98 25", groupe: 4, ville: "Ouagadougou" },
  { nom: "Pharmacie Wayalghin", telephone: "+226 25 39 52 08", groupe: 4, ville: "Ouagadougou" },
  { nom: "Pharmacie Wend Kuuni", telephone: "+226 25 36 20 15", groupe: 4, ville: "Ouagadougou" },
  { nom: "Pharmacie Wend Yam", telephone: "+226 25 48 30 47", groupe: 4, ville: "Ouagadougou" },
];

// Pharmacies de Bobo-Dioulasso - Groupe 1
const BOBO_GROUPE_1: PharmacieDeGarde[] = [
  { nom: "Pharmacie Aoudi", telephone: "+226 20 98 18 98", groupe: 1, ville: "Bobo-Dioulasso" },
  { nom: "Pharmacie Belleville", telephone: "+226 20 98 22 00", groupe: 1, ville: "Bobo-Dioulasso" },
  { nom: "Pharmacie Bethel", telephone: "+226 20 97 37 39", groupe: 1, ville: "Bobo-Dioulasso" },
  { nom: "Pharmacie Colombre", telephone: "+226 20 97 28 29", groupe: 1, ville: "Bobo-Dioulasso" },
  { nom: "Pharmacie Esperance", telephone: "+226 20 97 47 17", groupe: 1, ville: "Bobo-Dioulasso" },
  { nom: "Pharmacie Fanyansa", telephone: "+226 20 97 14 80", groupe: 1, ville: "Bobo-Dioulasso" },
  { nom: "Pharmacie Harmonie", telephone: "+226 20 97 07 17", groupe: 1, ville: "Bobo-Dioulasso" },
  { nom: "Pharmacie Jolean", telephone: "+226 20 98 21 20", groupe: 1, ville: "Bobo-Dioulasso" },
  { nom: "Pharmacie Levant", telephone: "+226 20 97 03 33", groupe: 1, ville: "Bobo-Dioulasso" },
  { nom: "Pharmacie Moderne", telephone: "+226 20 97 02 50", groupe: 1, ville: "Bobo-Dioulasso" },
  { nom: "Pharmacie Orlea", telephone: "+226 25 39 25 33", groupe: 1, ville: "Bobo-Dioulasso" },
  { nom: "Pharmacie Remedis", telephone: "+226 20 97 09 52", groupe: 1, ville: "Bobo-Dioulasso" },
  { nom: "Pharmacie Sala", telephone: "+226 20 97 18 89", groupe: 1, ville: "Bobo-Dioulasso" },
  { nom: "Pharmacie Sibiri", telephone: "+226 20 97 79 02", groupe: 1, ville: "Bobo-Dioulasso" },
  { nom: "Pharmacie Wobi", telephone: "+226 20 97 36 97", groupe: 1, ville: "Bobo-Dioulasso" },
];

// Pharmacies de Bobo-Dioulasso - Groupe 2
const BOBO_GROUPE_2: PharmacieDeGarde[] = [
  { nom: "Pharmacie Aeroport", telephone: "+226 20 97 50 14", groupe: 2, ville: "Bobo-Dioulasso" },
  { nom: "Pharmacie Boulevard", telephone: "+226 20 95 20 93", groupe: 2, ville: "Bobo-Dioulasso" },
  { nom: "Pharmacie Christ-Roi", telephone: "+226 20 95 58 53", groupe: 2, ville: "Bobo-Dioulasso" },
  { nom: "Pharmacie Dafra", telephone: "+226 20 97 79 92", groupe: 2, ville: "Bobo-Dioulasso" },
  { nom: "Pharmacie Djena", telephone: "+226 20 98 38 98", groupe: 2, ville: "Bobo-Dioulasso" },
  { nom: "Pharmacie Houet", telephone: "+226 20 97 10 80", groupe: 2, ville: "Bobo-Dioulasso" },
  { nom: "Pharmacie Lafia", telephone: "+226 20 95 54 37", groupe: 2, ville: "Bobo-Dioulasso" },
  { nom: "Pharmacie Lucien", telephone: "+226 20 97 51 32", groupe: 2, ville: "Bobo-Dioulasso" },
  { nom: "Pharmacie Mah-Ta", telephone: "+226 20 98 28 25", groupe: 2, ville: "Bobo-Dioulasso" },
  { nom: "Pharmacie Nazindi-Gouba", telephone: "+226 20 97 57 57", groupe: 2, ville: "Bobo-Dioulasso" },
  { nom: "Pharmacie Nazounki", telephone: "+226 20 97 31 00", groupe: 2, ville: "Bobo-Dioulasso" },
  { nom: "Pharmacie Safalao", telephone: "+226 20 97 01 35", groupe: 2, ville: "Bobo-Dioulasso" },
  { nom: "Pharmacie Sifoma", telephone: "+226 20 97 19 65", groupe: 2, ville: "Bobo-Dioulasso" },
  { nom: "Pharmacie Zoe", telephone: "+226 63 10 07 75", groupe: 2, ville: "Bobo-Dioulasso" },
];

// Pharmacies de Bobo-Dioulasso - Groupe 3
const BOBO_GROUPE_3: PharmacieDeGarde[] = [
  { nom: "Pharmacie Amirbouba", telephone: "+226 25 39 34 64", groupe: 3, ville: "Bobo-Dioulasso" },
  { nom: "Pharmacie Becy", telephone: "+226 20 95 58 41", groupe: 3, ville: "Bobo-Dioulasso" },
  { nom: "Pharmacie Boyam", telephone: "+226 20 95 64 29", groupe: 3, ville: "Bobo-Dioulasso" },
  { nom: "Pharmacie Entente", telephone: "+226 20 97 19 16", groupe: 3, ville: "Bobo-Dioulasso" },
  { nom: "Pharmacie Hayatt", telephone: "+226 20 97 00 00", groupe: 3, ville: "Bobo-Dioulasso" },
  { nom: "Pharmacie Hereso", telephone: "+226 20 97 09 95", groupe: 3, ville: "Bobo-Dioulasso" },
  { nom: "Pharmacie Medine", telephone: "+226 20 97 09 10", groupe: 3, ville: "Bobo-Dioulasso" },
  { nom: "Pharmacie Saint-Antoine", telephone: "+226 20 95 13 01", groupe: 3, ville: "Bobo-Dioulasso" },
  { nom: "Pharmacie Saint-Raphael", telephone: "+226 20 98 63 91", groupe: 3, ville: "Bobo-Dioulasso" },
  { nom: "Pharmacie Samhita", telephone: "+226 25 93 34 81", groupe: 3, ville: "Bobo-Dioulasso" },
  { nom: "Pharmacie Sanitas", telephone: "+226 20 97 22 42", groupe: 3, ville: "Bobo-Dioulasso" },
  { nom: "Pharmacie Soudia", telephone: "+226 20 97 14 49", groupe: 3, ville: "Bobo-Dioulasso" },
  { nom: "Pharmacie Souligne", telephone: "+226 20 97 08 16", groupe: 3, ville: "Bobo-Dioulasso" },
  { nom: "Pharmacie Vitalis", telephone: "+226 20 98 12 17", groupe: 3, ville: "Bobo-Dioulasso" },
  { nom: "Pharmacie Yamba", telephone: "+226 20 97 77 78", groupe: 3, ville: "Bobo-Dioulasso" },
];

// Pharmacies de Bobo-Dioulasso - Groupe 4
const BOBO_GROUPE_4: PharmacieDeGarde[] = [
  { nom: "Pharmacie Abby", telephone: "+226 20 97 63 64", groupe: 4, ville: "Bobo-Dioulasso" },
  { nom: "Pharmacie Amine", telephone: "+226 20 97 19 97", groupe: 4, ville: "Bobo-Dioulasso" },
  { nom: "Pharmacie Audrey", telephone: "+226 20 95 44 69", groupe: 4, ville: "Bobo-Dioulasso" },
  { nom: "Pharmacie Bien-Etre", telephone: "+226 20 97 20 79", groupe: 4, ville: "Bobo-Dioulasso" },
  { nom: "Pharmacie Colma", telephone: "+226 20 95 17 02", groupe: 4, ville: "Bobo-Dioulasso" },
  { nom: "Pharmacie Dogona", telephone: "+226 20 95 64 48", groupe: 4, ville: "Bobo-Dioulasso" },
  { nom: "Pharmacie Ekossines", telephone: "+226 20 98 25 61", groupe: 4, ville: "Bobo-Dioulasso" },
  { nom: "Pharmacie Grace Divine", telephone: "+226 20 97 48 25", groupe: 4, ville: "Bobo-Dioulasso" },
  { nom: "Pharmacie Hadim", telephone: "+226 20 95 42 00", groupe: 4, ville: "Bobo-Dioulasso" },
  { nom: "Pharmacie Hopital", telephone: "+226 20 98 37 47", groupe: 4, ville: "Bobo-Dioulasso" },
  { nom: "Pharmacie Jigiya", telephone: "+226 20 97 12 04", groupe: 4, ville: "Bobo-Dioulasso" },
  { nom: "Pharmacie Kanta", telephone: "+226 20 66 10 51", groupe: 4, ville: "Bobo-Dioulasso" },
  { nom: "Pharmacie Lafiabougou", telephone: "+226 20 95 64 27", groupe: 4, ville: "Bobo-Dioulasso" },
  { nom: "Pharmacie Lakari", telephone: "+226 20 97 47 51", groupe: 4, ville: "Bobo-Dioulasso" },
  { nom: "Pharmacie Siyara", telephone: "+226 20 97 13 73", groupe: 4, ville: "Bobo-Dioulasso" },
  { nom: "Pharmacie Solidarite", telephone: "+226 20 97 17 26", groupe: 4, ville: "Bobo-Dioulasso" },
];

// Export de toutes les pharmacies
export const ALL_PHARMACIES_DE_GARDE: PharmacieDeGarde[] = [
  ...OUAGA_GROUPE_1,
  ...OUAGA_GROUPE_2,
  ...OUAGA_GROUPE_3,
  ...OUAGA_GROUPE_4,
  ...BOBO_GROUPE_1,
  ...BOBO_GROUPE_2,
  ...BOBO_GROUPE_3,
  ...BOBO_GROUPE_4,
];

// Date de reference pour le calcul des groupes de garde (semaine 1 = groupe 1)
// Semaine du 30 decembre 2024: Groupe 1 a Ouagadougou, Groupe 3 a Bobo-Dioulasso (selon Orange BF)
const REFERENCE_DATE = new Date("2024-12-30");
const OUAGA_REFERENCE_GROUP = 1;
const BOBO_REFERENCE_GROUP = 3;

// Calcule le numero de semaine depuis la date de reference
function getWeeksSinceReference(date: Date): number {
  const diffTime = date.getTime() - REFERENCE_DATE.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return Math.floor(diffDays / 7);
}

// Determine le groupe actuellement de garde pour une ville donnee
export function getCurrentGardeGroup(ville: "Ouagadougou" | "Bobo-Dioulasso", date: Date = new Date()): 1 | 2 | 3 | 4 {
  const weeksSince = getWeeksSinceReference(date);
  const referenceGroup = ville === "Ouagadougou" ? OUAGA_REFERENCE_GROUP : BOBO_REFERENCE_GROUP;
  const currentGroup = ((referenceGroup - 1 + weeksSince) % 4) + 1;
  return currentGroup as 1 | 2 | 3 | 4;
}

// Retourne les pharmacies actuellement de garde
export function getPharmaciesDeGarde(ville?: "Ouagadougou" | "Bobo-Dioulasso", date: Date = new Date()): PharmacieDeGarde[] {
  if (ville) {
    const currentGroup = getCurrentGardeGroup(ville, date);
    return ALL_PHARMACIES_DE_GARDE.filter(p => p.ville === ville && p.groupe === currentGroup);
  }
  
  // Retourne les pharmacies de garde des deux villes
  const ouagaGroup = getCurrentGardeGroup("Ouagadougou", date);
  const boboGroup = getCurrentGardeGroup("Bobo-Dioulasso", date);
  
  return ALL_PHARMACIES_DE_GARDE.filter(
    p => (p.ville === "Ouagadougou" && p.groupe === ouagaGroup) ||
         (p.ville === "Bobo-Dioulasso" && p.groupe === boboGroup)
  );
}

// Retourne toutes les pharmacies d'un groupe specifique
export function getPharmaciesByGroup(ville: "Ouagadougou" | "Bobo-Dioulasso", groupe: 1 | 2 | 3 | 4): PharmacieDeGarde[] {
  return ALL_PHARMACIES_DE_GARDE.filter(p => p.ville === ville && p.groupe === groupe);
}

// Retourne les dates de garde pour un groupe donne (4 prochaines semaines)
export function getGardeDatesForGroup(ville: "Ouagadougou" | "Bobo-Dioulasso", groupe: 1 | 2 | 3 | 4): Date[] {
  const dates: Date[] = [];
  const today = new Date();
  
  for (let i = 0; i < 16; i++) { // Cherche dans les 16 prochaines semaines
    const checkDate = new Date(today);
    checkDate.setDate(today.getDate() + (i * 7));
    
    if (getCurrentGardeGroup(ville, checkDate) === groupe) {
      dates.push(checkDate);
      if (dates.length >= 4) break;
    }
  }
  
  return dates;
}

// Source et informations sur le systeme de garde
export const GARDE_INFO = {
  source: "Orange Burkina Faso (https://www.orange.bf)",
  lastUpdate: "Decembre 2024",
  description: "Les pharmacies sont organisees en 4 groupes qui assurent la garde a tour de role chaque semaine (du lundi au dimanche).",
  cities: ["Ouagadougou", "Bobo-Dioulasso"],
  totalPharmacies: ALL_PHARMACIES_DE_GARDE.length,
  ouagadougouCount: ALL_PHARMACIES_DE_GARDE.filter(p => p.ville === "Ouagadougou").length,
  boboDioulassoCount: ALL_PHARMACIES_DE_GARDE.filter(p => p.ville === "Bobo-Dioulasso").length,
};
