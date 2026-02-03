/**
 * Nouveau decoupage administratif du Burkina Faso - 17 regions
 * Conforme a la nouvelle carte administrative (Juillet 2025)
 * 17 Regions, 45 Provinces principales et 350 Departements
 * Note: La liste des provinces peut evoluer avec les reformes administratives
 */

export interface Region {
  name: string;
  chefLieu: string;
  provinces: Province[];
  bounds?: { south: number; north: number; west: number; east: number };
}

export interface Province {
  name: string;
  chefLieu: string;
  communes: string[];
}

export const BURKINA_REGIONS: Region[] = [
  {
    name: 'Bankui',
    chefLieu: 'Dedougou',
    bounds: { south: 11.8, north: 13.5, west: -4.5, east: -2.8 },
    provinces: [
      { name: 'Mouhoun', chefLieu: 'Dedougou', communes: ['Bondokuy', 'Dedougou', 'Douroula', 'Kona', 'Ouarkoye', 'Safane', 'Tcheriba'] },
      { name: 'Bale', chefLieu: 'Boromo', communes: ['Bagassi', 'Bana', 'Boromo', 'Fara', 'Pa', 'Pompoi', 'Poura', 'Oury', 'Siby', 'Yaho'] },
      { name: 'Banwa', chefLieu: 'Solenzo', communes: ['Balave', 'Kouka', 'Sami', 'Sanaba', 'Solenzo', 'Tansila'] },
      { name: 'Kossi', chefLieu: 'Nouna', communes: ['Barani', 'Bomborokuy', 'Djibasso', 'Doumbala', 'Kombori', 'Madouba', 'Nouna', 'Sont'] },
      { name: 'Nayala', chefLieu: 'Toma', communes: ['Gassan', 'Gossina', 'Kougny', 'Toma', 'Yaba', 'Ye'] }
    ]
  },
  {
    name: 'Djoro',
    chefLieu: 'Gaoua',
    bounds: { south: 9.5, north: 11.5, west: -4.0, east: -2.5 },
    provinces: [
      { name: 'Bougouriba', chefLieu: 'Diebougou', communes: ['Gbondjigui', 'Diebougou', 'Dolo', 'Nioronioro', 'Tiankoura'] },
      { name: 'Ioba', chefLieu: 'Dano', communes: ['Dano', 'Dissihn', 'Gueguere', 'Koper', 'Niego', 'Oronkua', 'Ouessa', 'Zambo'] },
      { name: 'Noumbiel', chefLieu: 'Batie', communes: ['Batie', 'Boussoukoula', 'Kpere', 'Legmoin', 'Midebdo'] },
      { name: 'Poni', chefLieu: 'Gaoua', communes: ['Bouroum-Bouroum', 'Boussera', 'Djigoue', 'Gaoua', 'Gbomblora', 'Kampti', 'Loropeni', 'Malba', 'Nako', 'Perigban'] }
    ]
  },
  {
    name: 'Goulmou',
    chefLieu: 'Fada N\'Gourma',
    bounds: { south: 11.0, north: 12.8, west: -0.5, east: 1.0 },
    provinces: [
      { name: 'Gourma', chefLieu: 'Fada N\'Gourma', communes: ['Diabo', 'Diapangou', 'Fada N\'Gourma', 'Matiacoali', 'Tibga', 'Yamba'] },
      { name: 'Kompienga', chefLieu: 'Pama', communes: ['Kompienga', 'Pama', 'Madjoari'] }
    ]
  },
  {
    name: 'Guiriko',
    chefLieu: 'Bobo-Dioulasso',
    bounds: { south: 10.5, north: 12.0, west: -5.5, east: -3.5 },
    provinces: [
      { name: 'Houet', chefLieu: 'Bobo-Dioulasso', communes: ['Bama', 'Bobo-Dioulasso', 'Dande', 'Karangasso-Sambla', 'Karangasso-Vigue', 'Koundougou', 'Faramana', 'Fo', 'Lena', 'Padema', 'Peni', 'Satiri', 'Toussiana'] },
      { name: 'Kenedougou', chefLieu: 'Orodara', communes: ['Banzon', 'Djigouera', 'Kangala', 'Kayan', 'Koloko', 'Kourouma', 'Kourinion', 'Morolaba', 'N\'Dorola', 'Orodara', 'Samogoyiri', 'Samorogouan', 'Sindo'] },
      { name: 'Tuy', chefLieu: 'Hounde', communes: ['Bereba', 'Boni', 'Boura', 'Hounde', 'Koti', 'Koumbia'] }
    ]
  },
  {
    name: 'Kadiogo',
    chefLieu: 'Ouagadougou',
    bounds: { south: 12.2, north: 12.6, west: -1.8, east: -1.3 },
    provinces: [
      { name: 'Kadiogo', chefLieu: 'Ouagadougou', communes: ['Ouagadougou', 'Komki-Ipala', 'Komsilga', 'Koubri', 'Pabre', 'Saaba', 'Tanghin-Dassouri'] }
    ]
  },
  {
    name: 'Kuilse',
    chefLieu: 'Kaya',
    bounds: { south: 12.8, north: 14.0, west: -1.5, east: -0.3 },
    provinces: [
      { name: 'Bam', chefLieu: 'Kongoussi', communes: ['Bourzanga', 'Guibare', 'Kongoussi', 'Nassere', 'Rollo', 'Rouko', 'Sabce', 'Tikare', 'Zimtenga'] },
      { name: 'Namentenga', chefLieu: 'Boulsa', communes: ['Boala', 'Boulsa', 'Bouroum', 'Dargo', 'Nagbingou', 'Tougouri', 'Yalgo', 'Zeguedeguin'] },
      { name: 'Sanmatenga', chefLieu: 'Kaya', communes: ['Barsalogho', 'Boussouma', 'Dablo', 'Kaya', 'Korsimoro', 'Mane', 'Pensa', 'Pibaore', 'Pissila'] }
    ]
  },
  {
    name: 'Liptako',
    chefLieu: 'Dori',
    bounds: { south: 13.5, north: 15.1, west: -0.5, east: 1.0 },
    provinces: [
      { name: 'Oudalan', chefLieu: 'Gorom-Gorom', communes: ['Deou', 'Gorom-Gorom', 'Markoye', 'Oursi', 'Tin-Akof'] },
      { name: 'Seno', chefLieu: 'Dori', communes: ['Bani', 'Boundore', 'Dori', 'Falagountou', 'Gandafabou', 'Gorgadji', 'Sampelga', 'Seytenga'] },
      { name: 'Yagha', chefLieu: 'Sebba', communes: ['Boundore', 'Mansila', 'Sebba', 'Solle', 'Tankougounadie', 'Titabe'] }
    ]
  },
  {
    name: 'Nakambe',
    chefLieu: 'Tenkodogo',
    bounds: { south: 11.0, north: 12.5, west: -0.8, east: 0.5 },
    provinces: [
      { name: 'Boulgou', chefLieu: 'Tenkodogo', communes: ['Bane', 'Bittou', 'Bagre', 'Beguedo', 'Bissiga', 'Garango', 'Komtoega', 'Niaogho', 'Tenkodogo', 'Zabre', 'Zoaga', 'Zonse'] },
      { name: 'Koulpelogo', chefLieu: 'Ouargaye', communes: ['Comin-Yanga', 'Lalgaye', 'Ouargaye', 'Sangha', 'Soudougui', 'Yargatenga'] },
      { name: 'Kouritenga', chefLieu: 'Koupela', communes: ['Andemtenga', 'Baskoure', 'Dialgaye', 'Gounghin', 'Kando', 'Koupela', 'Pouytenga', 'Tensobentenga', 'Yargo'] }
    ]
  },
  {
    name: 'Nando',
    chefLieu: 'Koudougou',
    bounds: { south: 11.5, north: 12.8, west: -2.8, east: -1.8 },
    provinces: [
      { name: 'Boulkiemde', chefLieu: 'Koudougou', communes: ['Bingo', 'Imasgo', 'Kindi', 'Kokologho', 'Koudougou', 'Kokologo', 'Nanoro', 'Pella', 'Poa', 'Ramongo', 'Sabou', 'Sigle', 'Soaw', 'Sourgou', 'Thyou'] },
      { name: 'Sanguie', chefLieu: 'Reo', communes: ['Dassa', 'Didyr', 'Godyr', 'Kordie', 'Kyon', 'Pouni', 'Reo', 'Tenado', 'Zawara'] }
    ]
  },
  {
    name: 'Nazinon',
    chefLieu: 'Leo',
    bounds: { south: 10.8, north: 12.0, west: -2.5, east: -1.5 },
    provinces: [
      { name: 'Sissili', chefLieu: 'Leo', communes: ['Bieha', 'Boura', 'Leo', 'Nebielianayou', 'Niabouri', 'Silly', 'To'] },
      { name: 'Ziro', chefLieu: 'Sapouy', communes: ['Bakata', 'Bougnounou', 'Cassou', 'Dalo', 'Gao', 'Sapouy'] },
      { name: 'Nahouri', chefLieu: 'Po', communes: ['Guiaro', 'Po', 'Tiebele', 'Ziou'] },
      { name: 'Bazega', chefLieu: 'Kombissiri', communes: ['Doulougou', 'Gaongo', 'Ipelce', 'Kayao', 'Kombissiri', 'Sapone', 'Toece'] },
      { name: 'Zoundweogo', chefLieu: 'Manga', communes: ['Bere', 'Binde', 'Gogo', 'Gomboussougou', 'Guiba', 'Manga'] }
    ]
  },
  {
    name: 'Oubri',
    chefLieu: 'Ziniare',
    bounds: { south: 12.2, north: 13.0, west: -1.5, east: -0.5 },
    provinces: [
      { name: 'Ganzourgou', chefLieu: 'Zorgho', communes: ['Boudry', 'Cognore', 'Meguet', 'Mogtedo', 'Zam', 'Zorgho', 'Zoungou'] },
      { name: 'Kourweogo', chefLieu: 'Bousse', communes: ['Bousse', 'Laye', 'Niou', 'Sourgoubila'] },
      { name: 'Oubritenga', chefLieu: 'Ziniare', communes: ['Absouya', 'Dapelogo', 'Loumbila', 'Nagreongo', 'Ziniare', 'Zitenga'] }
    ]
  },
  {
    name: 'Sirba',
    chefLieu: 'Bogande',
    bounds: { south: 12.5, north: 14.0, west: -0.3, east: 1.0 },
    provinces: [
      { name: 'Gnagna', chefLieu: 'Bogande', communes: ['Bilanga', 'Bogande', 'Coalla', 'Liptougou', 'Manni', 'Piela', 'Thion'] },
      { name: 'Komondjari', chefLieu: 'Gayeri', communes: ['Bartiebougou', 'Foutouri', 'Gayeri'] }
    ]
  },
  {
    name: 'Soum',
    chefLieu: 'Djibo',
    bounds: { south: 13.5, north: 15.0, west: -1.5, east: -0.3 },
    provinces: [
      { name: 'Soum', chefLieu: 'Djibo', communes: ['Aribinda', 'Baraboule', 'Djibo', 'Tongomayel', 'Kelbo', 'Nassoumbou', 'Pobe-Mengao'] }
    ]
  },
  {
    name: 'Sourou',
    chefLieu: 'Tougan',
    bounds: { south: 12.8, north: 14.0, west: -3.5, east: -2.5 },
    provinces: [
      { name: 'Sourou', chefLieu: 'Tougan', communes: ['Di', 'Gomboro', 'Kassoum', 'Kiembara', 'Lanfiera', 'Lankoue', 'Tougan'] },
      { name: 'Passore', chefLieu: 'Yako', communes: ['Arbolle', 'Bagare', 'Bokin', 'Gomponsom', 'Kirsi', 'La-Todin', 'Pilimpikou', 'Samba', 'Yako'] }
    ]
  },
  {
    name: 'Tannounyan',
    chefLieu: 'Banfora',
    bounds: { south: 9.4, north: 11.0, west: -5.5, east: -4.0 },
    provinces: [
      { name: 'Comoe', chefLieu: 'Banfora', communes: ['Banfora', 'Beregadougou', 'Douna', 'Mangodara', 'Moussodougou', 'Niangoloko', 'Ouo', 'Sideradougou', 'Soubakaniédougou', 'Tiefora'] },
      { name: 'Leraba', chefLieu: 'Sindou', communes: ['Dakoro', 'Doussie', 'Loumana', 'Niankorodougou', 'Oueleni', 'Sindou', 'Wolonkoto'] }
    ]
  },
  {
    name: 'Tapoa',
    chefLieu: 'Diapaga',
    bounds: { south: 11.5, north: 13.0, west: 0.8, east: 2.4 },
    provinces: [
      { name: 'Tapoa', chefLieu: 'Diapaga', communes: ['Bottou', 'Diapaga', 'Kantchari', 'Logobou', 'Namounou', 'Partiaga', 'Tambaga', 'Tansarga'] }
    ]
  },
  {
    name: 'Yaadga',
    chefLieu: 'Ouahigouya',
    bounds: { south: 12.8, north: 14.5, west: -3.0, east: -1.8 },
    provinces: [
      { name: 'Loroum', chefLieu: 'Titao', communes: ['Ouindigui', 'Solle', 'Titao'] },
      { name: 'Yatenga', chefLieu: 'Ouahigouya', communes: ['Bahn', 'Kalsaka', 'Kain', 'Koumbri', 'Namissiguima', 'Ouahigouya', 'Oula', 'Rambo', 'Seguenenga', 'Tangaye', 'Thiou', 'Zogore'] },
      { name: 'Zandoma', chefLieu: 'Gourcy', communes: ['Bassi', 'Boussou', 'Gourcy', 'Leba', 'Soubou', 'Tougo'] }
    ]
  }
];

export const REGION_NAMES = BURKINA_REGIONS.map(r => r.name);

export function getChefLieu(regionName: string): string | undefined {
  const region = BURKINA_REGIONS.find(r => r.name.toLowerCase() === regionName.toLowerCase());
  return region?.chefLieu;
}

export function getProvinces(regionName: string): Province[] {
  const region = BURKINA_REGIONS.find(r => r.name.toLowerCase() === regionName.toLowerCase());
  return region?.provinces || [];
}

export function findRegionByCity(city: string): Region | undefined {
  const lowerCity = city.toLowerCase();
  return BURKINA_REGIONS.find(region => {
    if (region.chefLieu.toLowerCase() === lowerCity) return true;
    return region.provinces.some(p => 
      p.chefLieu.toLowerCase() === lowerCity ||
      p.communes.some(c => c.toLowerCase() === lowerCity)
    );
  });
}

export function getRegionBounds(regionName: string): { south: number; north: number; west: number; east: number } | undefined {
  const region = BURKINA_REGIONS.find(r => r.name.toLowerCase() === regionName.toLowerCase());
  return region?.bounds;
}

export function getAllCitiesInRegion(regionName: string): string[] {
  const region = BURKINA_REGIONS.find(r => r.name.toLowerCase() === regionName.toLowerCase());
  if (!region) return [];
  
  const cities: string[] = [region.chefLieu];
  region.provinces.forEach(p => {
    cities.push(p.chefLieu);
    cities.push(...p.communes);
  });
  return Array.from(new Set(cities));
}

export const OLD_TO_NEW_REGION_MAPPING: Record<string, string> = {
  'Centre': 'Kadiogo',
  'Hauts-Bassins': 'Guiriko',
  'Cascades': 'Tannounyan',
  'Centre-Nord': 'Kuilse',
  'Centre-Ouest': 'Nando',
  'Centre-Est': 'Nakambe',
  'Centre-Sud': 'Nazinon',
  'Est': 'Goulmou',
  'Nord': 'Yaadga',
  'Sahel': 'Liptako',
  'Sud-Ouest': 'Djoro',
  'Boucle du Mouhoun': 'Bankui',
  'Plateau-Central': 'Oubri'
};

export function mapOldRegionToNew(oldRegion: string): string {
  return OLD_TO_NEW_REGION_MAPPING[oldRegion] || oldRegion;
}
