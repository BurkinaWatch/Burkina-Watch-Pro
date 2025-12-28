/**
 * Nouveau decoupage administratif du Burkina Faso - 17 regions
 * Conforme a la reforme territoriale
 */

export interface Region {
  name: string;
  chefLieu: string;
  provinces: Province[];
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
    provinces: [
      { name: 'Mouhoun', chefLieu: 'Dedougou', communes: ['Bondokuy', 'Dedougou', 'Douroula', 'Kona', 'Ouarkoye', 'Safane', 'Tcheriba'] },
      { name: 'Bale', chefLieu: 'Boromo', communes: ['Bagassi', 'Bana', 'Boromo', 'Fara', 'Pa', 'Pompoi', 'Poura', 'Oury', 'Siby', 'Yaho'] },
      { name: 'Banwa', chefLieu: 'Solenzo', communes: ['Balave', 'Kouka', 'Sami', 'Sanaba', 'Solenzo', 'Tansila'] },
      { name: 'Kossi', chefLieu: 'Nouna', communes: ['Barani', 'Bomborokuy', 'Dedougou', 'Djibasso', 'Doumbala', 'Kombori', 'Madouba', 'Nouna', 'Sont', 'Toma'] },
      { name: 'Nayala', chefLieu: 'Toma', communes: ['Gassan', 'Gossina', 'Kougny', 'Toma', 'Yaba', 'Ye'] },
      { name: 'Sourou', chefLieu: 'Tougan', communes: ['Di', 'Gomboro', 'Kassoum', 'Kiembara', 'Lanfiera', 'Lankoue', 'Tougan'] }
    ]
  },
  {
    name: 'Djoro',
    chefLieu: 'Gaoua',
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
    provinces: [
      { name: 'Gourma', chefLieu: 'Fada N\'Gourma', communes: ['Diabo', 'Diapangou', 'Fada N\'Gourma', 'Matiacoali', 'Tibga', 'Yamba'] },
      { name: 'Kompienga', chefLieu: 'Pama', communes: ['Kompienga', 'Pama', 'Madjoari'] },
      { name: 'Tapoa', chefLieu: 'Diapaga', communes: ['Bottou', 'Diapaga', 'Kantchari', 'Logobou', 'Namounou', 'Partiaga', 'Tambaga', 'Tansarga'] }
    ]
  },
  {
    name: 'Guiriko',
    chefLieu: 'Bobo-Dioulasso',
    provinces: [
      { name: 'Houet', chefLieu: 'Bobo-Dioulasso', communes: ['Bama', 'Bobo-Dioulasso', 'Dande', 'Karangasso-Sambla', 'Karangasso-Vigue', 'Koundougou', 'Faramana', 'Fo', 'Lena', 'Padema', 'Peni', 'Satiri', 'Toussiana'] },
      { name: 'Kenedougou', chefLieu: 'Orodara', communes: ['Banzon', 'Djigouera', 'Kangala', 'Kayan', 'Koloko', 'Kourouma', 'Kourinion', 'Morolaba', 'N\'Dorola', 'Orodara', 'Samogoyiri', 'Samorogouan', 'Sindo'] },
      { name: 'Tuy', chefLieu: 'Hounde', communes: ['Bereba', 'Boni', 'Boura', 'Hounde', 'Koti', 'Koumbia'] }
    ]
  },
  {
    name: 'Kadiogo',
    chefLieu: 'Ouagadougou',
    provinces: [
      { name: 'Kadiogo', chefLieu: 'Ouagadougou', communes: ['Ouagadougou', 'Komki-Ipala', 'Komsilga', 'Koubri', 'Pabre', 'Saaba', 'Tanghin-Dassouri'] }
    ]
  },
  {
    name: 'Koom-Kuuli',
    chefLieu: 'Reo',
    provinces: [
      { name: 'Boulkiemde', chefLieu: 'Koudougou', communes: ['Bingo', 'Imasgo', 'Kindi', 'Kokologho', 'Koudougou', 'Kokologo', 'Nanoro', 'Pella', 'Poa', 'Ramongo', 'Sabou', 'Sigle', 'Soaw', 'Sourgou', 'Thyou'] },
      { name: 'Sanguie', chefLieu: 'Reo', communes: ['Dassa', 'Didyr', 'Godyr', 'Kordie', 'Kyon', 'Pouni', 'Reo', 'Tenado', 'Zawara'] },
      { name: 'Sissili', chefLieu: 'Leo', communes: ['Bieha', 'Boura', 'Leo', 'Nebielianayou', 'Niabouri', 'Silly', 'To'] },
      { name: 'Ziro', chefLieu: 'Sapouy', communes: ['Bakata', 'Bougnounou', 'Cassou', 'Dalo', 'Gao', 'Sapouy'] }
    ]
  },
  {
    name: 'Kom-Pangala',
    chefLieu: 'Tenkodogo',
    provinces: [
      { name: 'Boulgou', chefLieu: 'Tenkodogo', communes: ['Bane', 'Bittou', 'Bagre', 'Beguedo', 'Bissiga', 'Garango', 'Komtoega', 'Niaogho', 'Tenkodogo', 'Zabre', 'Zoaga', 'Zonse'] },
      { name: 'Koulpelogo', chefLieu: 'Ouargaye', communes: ['Comin-Yanga', 'Lalgaye', 'Ouargaye', 'Sangha', 'Soudougui', 'Yargatenga'] },
      { name: 'Kouritenga', chefLieu: 'Koupela', communes: ['Andemtenga', 'Baskoure', 'Dialgaye', 'Gounghin', 'Kando', 'Koupela', 'Pouytenga', 'Tensobentenga', 'Yargo'] }
    ]
  },
  {
    name: 'Nakambga',
    chefLieu: 'Ziniare',
    provinces: [
      { name: 'Ganzourgou', chefLieu: 'Zorgho', communes: ['Boudry', 'Cognore', 'Meguet', 'Mogtedo', 'Zam', 'Zorgho', 'Zoungou'] },
      { name: 'Kourweogo', chefLieu: 'Bousse', communes: ['Bousse', 'Laye', 'Niou', 'Sourgoubila'] },
      { name: 'Oubritenga', chefLieu: 'Ziniare', communes: ['Absouya', 'Dapelogo', 'Loumbila', 'Nagreongo', 'Ziniare', 'Zitenga'] }
    ]
  },
  {
    name: 'Passore',
    chefLieu: 'Yako',
    provinces: [
      { name: 'Passore', chefLieu: 'Yako', communes: ['Arbolle', 'Bagare', 'Bokin', 'Bourzanga', 'Gomponsom', 'Kirsi', 'La-Todin', 'Pilimpikou', 'Samba', 'Yako'] }
    ]
  },
  {
    name: 'Poni-Tiari',
    chefLieu: 'Banfora',
    provinces: [
      { name: 'Comoe', chefLieu: 'Banfora', communes: ['Banfora', 'Beregadougou', 'Douna', 'Mangodara', 'Moussodougou', 'Niangoloko', 'Ouo', 'Sideradougou', 'Soubakaniédougou', 'Tiefora'] },
      { name: 'Leraba', chefLieu: 'Sindou', communes: ['Dakoro', 'Doussie', 'Loumana', 'Niankorodougou', 'Oueleni', 'Sindou', 'Wolonkoto'] }
    ]
  },
  {
    name: 'Sahel',
    chefLieu: 'Dori',
    provinces: [
      { name: 'Oudalan', chefLieu: 'Gorom-Gorom', communes: ['Deou', 'Gorom-Gorom', 'Markoye', 'Oursi', 'Tin-Akof'] },
      { name: 'Seno', chefLieu: 'Dori', communes: ['Bani', 'Boundore', 'Dori', 'Falagountou', 'Gandafabou', 'Gorgadji', 'Sampelga', 'Seytenga'] },
      { name: 'Soum', chefLieu: 'Djibo', communes: ['Aribinda', 'Baraboule', 'Djibo', 'Tongomayel', 'Kelbo', 'Nassoumbou', 'Pobe-Mengao'] },
      { name: 'Yagha', chefLieu: 'Sebba', communes: ['Boundore', 'Mansila', 'Sebba', 'Solle', 'Tankougounadie', 'Titabe'] }
    ]
  },
  {
    name: 'Taar-Soomba',
    chefLieu: 'Manga',
    provinces: [
      { name: 'Bazega', chefLieu: 'Kombissiri', communes: ['Doulougou', 'Gaongo', 'Ipelce', 'Kayao', 'Kombissiri', 'Sapone', 'Toece'] },
      { name: 'Nahouri', chefLieu: 'Po', communes: ['Guiaro', 'Po', 'Tiebele', 'Ziou'] },
      { name: 'Zoundweogo', chefLieu: 'Manga', communes: ['Bere', 'Binde', 'Gogo', 'Gomboussougou', 'Guiba', 'Manga'] }
    ]
  },
  {
    name: 'Taoud-Weogo',
    chefLieu: 'Ouahigouya',
    provinces: [
      { name: 'Loroum', chefLieu: 'Titao', communes: ['Ouindigui', 'Solle', 'Soum', 'Titao'] },
      { name: 'Yatenga', chefLieu: 'Ouahigouya', communes: ['Bahn', 'Kalsaka', 'Kain', 'Koumbri', 'Namissiguima', 'Ouahigouya', 'Oula', 'Rambo', 'Seguenenga', 'Tangaye', 'Thiou', 'Zogore'] },
      { name: 'Zandoma', chefLieu: 'Gourcy', communes: ['Bassi', 'Boussou', 'Gourcy', 'Leba', 'Soubou', 'Tougo'] }
    ]
  },
  {
    name: 'Tondeka',
    chefLieu: 'Kaya',
    provinces: [
      { name: 'Bam', chefLieu: 'Kongoussi', communes: ['Bourzanga', 'Guibare', 'Kongoussi', 'Nassere', 'Rollo', 'Rouko', 'Sabce', 'Tikare', 'Zimtenga'] },
      { name: 'Namentenga', chefLieu: 'Boulsa', communes: ['Boala', 'Boulsa', 'Bouroum', 'Dargo', 'Nagbingou', 'Tougouri', 'Yalgo', 'Zeguedeguin'] },
      { name: 'Sanmatenga', chefLieu: 'Kaya', communes: ['Barsalogho', 'Boussouma', 'Dablo', 'Kaya', 'Korsimoro', 'Mane', 'Pensa', 'Pibaore', 'Pibarore', 'Pissila'] }
    ]
  },
  {
    name: 'Wetemga',
    chefLieu: 'Bogande',
    provinces: [
      { name: 'Gnagna', chefLieu: 'Bogande', communes: ['Bilanga', 'Bogande', 'Coalla', 'Liptougou', 'Manni', 'Piela', 'Thion'] },
      { name: 'Komondjari', chefLieu: 'Gayeri', communes: ['Bartiebougou', 'Foutouri', 'Gayeri'] }
    ]
  },
  {
    name: 'Yirka-Gaongo',
    chefLieu: 'Boromo',
    provinces: [
      { name: 'Bale', chefLieu: 'Boromo', communes: ['Bagassi', 'Bana', 'Boromo', 'Fara', 'Pa', 'Pompoi', 'Poura', 'Oury', 'Siby', 'Yaho'] }
    ]
  },
  {
    name: 'Yonyoose',
    chefLieu: 'Fada N\'Gourma',
    provinces: [
      { name: 'Gnagna', chefLieu: 'Bogande', communes: ['Bilanga', 'Bogande', 'Coalla', 'Liptougou', 'Manni', 'Piela', 'Thion'] }
    ]
  }
];

// Liste simple des noms de regions pour les filtres
export const REGION_NAMES = BURKINA_REGIONS.map(r => r.name);

// Fonction pour obtenir le chef-lieu d'une region
export function getChefLieu(regionName: string): string | undefined {
  const region = BURKINA_REGIONS.find(r => r.name === regionName);
  return region?.chefLieu;
}

// Fonction pour obtenir les provinces d'une region
export function getProvinces(regionName: string): Province[] {
  const region = BURKINA_REGIONS.find(r => r.name === regionName);
  return region?.provinces || [];
}

// Fonction pour rechercher une region par ville
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
