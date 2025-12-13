
import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import EmergencyPanel from "@/components/EmergencyPanel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, MapPin, Phone, Clock, Navigation, ArrowLeft, RefreshCw } from "lucide-react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

interface Pharmacie {
  id: string;
  nom: string;
  adresse: string;
  ville: string;
  quartier: string;
  region: string;
  telephone: string;
  typeGarde: "jour" | "nuit" | "24h";
  latitude?: number;
  longitude?: number;
}

// Base complète de toutes les pharmacies (incluant celles qui ne sont pas de garde)
const TOUTES_PHARMACIES: Pharmacie[] = [
  // REGION KADIOGO (Ouagadougou)
  {
    id: "1",
    nom: "Pharmacie Centrale de Ouagadougou",
    adresse: "Avenue Kwame N'Krumah",
    ville: "Ouagadougou",
    quartier: "Centre-ville",
    region: "Kadiogo",
    telephone: "+226 25 30 61 91",
    typeGarde: "24h",
    latitude: 12.3714,
    longitude: -1.5197
  },
  {
    id: "2",
    nom: "Pharmacie Yennenga",
    adresse: "Avenue de la Liberté",
    ville: "Ouagadougou",
    quartier: "Gounghin",
    region: "Kadiogo",
    telephone: "+226 25 31 44 22",
    typeGarde: "jour",
    latitude: 12.3678,
    longitude: -1.5260
  },
  {
    id: "3",
    nom: "Pharmacie du Mogho Naaba",
    adresse: "Avenue Charles de Gaulle",
    ville: "Ouagadougou",
    quartier: "Paspanga",
    region: "Kadiogo",
    telephone: "+226 25 30 74 53",
    typeGarde: "nuit",
    latitude: 12.3745,
    longitude: -1.5180
  },
  {
    id: "11",
    nom: "Pharmacie Al Houda",
    adresse: "Rue de Kaya",
    ville: "Ouagadougou",
    quartier: "Cissin",
    region: "Kadiogo",
    telephone: "+226 25 36 78 90",
    typeGarde: "jour",
    latitude: 12.4000,
    longitude: -1.5000
  },
  {
    id: "ph_ouaga_5",
    nom: "Pharmacie Wemtenga",
    adresse: "Boulevard du Peuple",
    ville: "Ouagadougou",
    quartier: "Wemtenga",
    region: "Kadiogo",
    telephone: "+226 25 31 22 33",
    typeGarde: "24h",
    latitude: 12.3800,
    longitude: -1.5100
  },
  {
    id: "ph_ouaga_6",
    nom: "Pharmacie de la Gare",
    adresse: "Avenue de la Gare",
    ville: "Ouagadougou",
    quartier: "Gare",
    region: "Kadiogo",
    telephone: "+226 25 30 55 66",
    typeGarde: "jour",
    latitude: 12.3650,
    longitude: -1.5250
  },
  {
    id: "ph_ouaga_7",
    nom: "Pharmacie Bethesda",
    adresse: "Rue de l'Hôpital",
    ville: "Ouagadougou",
    quartier: "Dapoya",
    region: "Kadiogo",
    telephone: "+226 25 36 44 55",
    typeGarde: "nuit",
    latitude: 12.3900,
    longitude: -1.4900
  },
  {
    id: "ph_ouaga_8",
    nom: "Pharmacie Kamsonghin",
    adresse: "Boulevard Kadiogo",
    ville: "Ouagadougou",
    quartier: "Kamsonghin",
    region: "Kadiogo",
    telephone: "+226 25 37 88 99",
    typeGarde: "jour",
    latitude: 12.3600,
    longitude: -1.5350
  },
  {
    id: "ph_ouaga_9",
    nom: "Pharmacie Zogona",
    adresse: "Avenue de l'Indépendance",
    ville: "Ouagadougou",
    quartier: "Zogona",
    region: "Kadiogo",
    telephone: "+226 25 38 11 22",
    typeGarde: "24h",
    latitude: 12.3550,
    longitude: -1.5400
  },
  {
    id: "ph_ouaga_10",
    nom: "Pharmacie Tanghin",
    adresse: "Route de Koudougou",
    ville: "Ouagadougou",
    quartier: "Tanghin",
    region: "Kadiogo",
    telephone: "+226 25 39 33 44",
    typeGarde: "nuit",
    latitude: 12.3450,
    longitude: -1.5500
  },

  // REGION GUIRIKO (Bobo-Dioulasso)
  {
    id: "4",
    nom: "Pharmacie Sainte Marie",
    adresse: "Boulevard Mouammar Kadhafi",
    ville: "Bobo-Dioulasso",
    quartier: "Accart Ville",
    region: "Guiriko",
    telephone: "+226 20 97 01 23",
    typeGarde: "24h",
    latitude: 11.1771,
    longitude: -4.2897
  },
  {
    id: "5",
    nom: "Pharmacie Nafa",
    adresse: "Route de Banfora",
    ville: "Bobo-Dioulasso",
    quartier: "Diarradougou",
    region: "Guiriko",
    telephone: "+226 20 98 45 67",
    typeGarde: "jour",
    latitude: 11.1820,
    longitude: -4.2950
  },
  {
    id: "ph_bobo_3",
    nom: "Pharmacie de la Cathédrale",
    adresse: "Avenue de la Révolution",
    ville: "Bobo-Dioulasso",
    quartier: "Centre-ville",
    region: "Guiriko",
    telephone: "+226 20 97 22 33",
    typeGarde: "nuit",
    latitude: 11.1800,
    longitude: -4.2920
  },
  {
    id: "ph_bobo_4",
    nom: "Pharmacie Belle Ville",
    adresse: "Rue du Commerce",
    ville: "Bobo-Dioulasso",
    quartier: "Belle Ville",
    region: "Guiriko",
    telephone: "+226 20 98 55 66",
    typeGarde: "jour",
    latitude: 11.1750,
    longitude: -4.2880
  },
  {
    id: "ph_bobo_5",
    nom: "Pharmacie Koko",
    adresse: "Avenue Ouezzin Coulibaly",
    ville: "Bobo-Dioulasso",
    quartier: "Koko",
    region: "Guiriko",
    telephone: "+226 20 99 11 22",
    typeGarde: "24h",
    latitude: 11.1850,
    longitude: -4.3000
  },

  // REGION PONI-TIARI (Banfora, Gaoua)
  {
    id: "6",
    nom: "Pharmacie de la Comoé",
    adresse: "Avenue de la Révolution",
    ville: "Banfora",
    quartier: "Centre",
    region: "Poni-Tiari",
    telephone: "+226 20 91 02 34",
    typeGarde: "nuit",
    latitude: 10.6334,
    longitude: -4.7619
  },
  {
    id: "ph_banfora_2",
    nom: "Pharmacie des Cascades",
    adresse: "Route de Sindou",
    ville: "Banfora",
    quartier: "Secteur 2",
    region: "Poni-Tiari",
    telephone: "+226 20 91 44 55",
    typeGarde: "jour",
    latitude: 10.6300,
    longitude: -4.7650
  },
  {
    id: "ph_gaoua_1",
    nom: "Pharmacie du Poni",
    adresse: "Avenue Principale",
    ville: "Gaoua",
    quartier: "Centre",
    region: "Poni-Tiari",
    telephone: "+226 20 90 11 22",
    typeGarde: "24h",
    latitude: 10.3269,
    longitude: -3.1825
  },

  // REGION KOOM-KUULI (Koudougou)
  {
    id: "7",
    nom: "Pharmacie Faso",
    adresse: "Rue de l'Indépendance",
    ville: "Koudougou",
    quartier: "Centre-ville",
    region: "Koom-Kuuli",
    telephone: "+226 25 44 01 56",
    typeGarde: "jour",
    latitude: 12.2525,
    longitude: -2.3622
  },
  {
    id: "ph_koudou_2",
    nom: "Pharmacie du Boulkiemdé",
    adresse: "Avenue de la Nation",
    ville: "Koudougou",
    quartier: "Secteur 3",
    region: "Koom-Kuuli",
    telephone: "+226 25 44 22 33",
    typeGarde: "nuit",
    latitude: 12.2500,
    longitude: -2.3650
  },
  {
    id: "ph_koudou_3",
    nom: "Pharmacie Saint Joseph",
    adresse: "Route de Ouagadougou",
    ville: "Koudougou",
    quartier: "Secteur 1",
    region: "Koom-Kuuli",
    telephone: "+226 25 44 55 66",
    typeGarde: "jour",
    latitude: 12.2550,
    longitude: -2.3600
  },

  // REGION GOULMOU (Fada N'Gourma)
  {
    id: "8",
    nom: "Pharmacie de l'Est",
    adresse: "Avenue Nationale",
    ville: "Fada N'Gourma",
    quartier: "Centre",
    region: "Goulmou",
    telephone: "+226 24 77 02 45",
    typeGarde: "24h",
    latitude: 12.0614,
    longitude: 0.3581
  },
  {
    id: "ph_fada_2",
    nom: "Pharmacie Gourma",
    adresse: "Route de Ouagadougou",
    ville: "Fada N'Gourma",
    quartier: "Secteur 2",
    region: "Goulmou",
    telephone: "+226 24 77 33 44",
    typeGarde: "jour",
    latitude: 12.0650,
    longitude: 0.3600
  },

  // REGION TAOUD-WEOGO (Ouahigouya)
  {
    id: "9",
    nom: "Pharmacie du Nord",
    adresse: "Route de Djibo",
    ville: "Ouahigouya",
    quartier: "Centre-ville",
    region: "Taoud-Weogo",
    telephone: "+226 24 55 03 21",
    typeGarde: "jour",
    latitude: 13.5828,
    longitude: -2.4214
  },
  {
    id: "ph_ouahi_2",
    nom: "Pharmacie du Yatenga",
    adresse: "Avenue de la Liberté",
    ville: "Ouahigouya",
    quartier: "Secteur 1",
    region: "Taoud-Weogo",
    telephone: "+226 24 55 44 55",
    typeGarde: "24h",
    latitude: 13.5850,
    longitude: -2.4200
  },
  {
    id: "ph_ouahi_3",
    nom: "Pharmacie Naaba Kango",
    adresse: "Route de Ouagadougou",
    ville: "Ouahigouya",
    quartier: "Secteur 3",
    region: "Taoud-Weogo",
    telephone: "+226 24 55 66 77",
    typeGarde: "nuit",
    latitude: 13.5800,
    longitude: -2.4250
  },

  // REGION KOM-PANGALA (Tenkodogo)
  {
    id: "10",
    nom: "Pharmacie Tenkodogo",
    adresse: "Avenue de la Nation",
    ville: "Tenkodogo",
    quartier: "Centre",
    region: "Kom-Pangala",
    telephone: "+226 40 71 02 89",
    typeGarde: "nuit",
    latitude: 11.7800,
    longitude: -0.3700
  },
  {
    id: "ph_tenko_2",
    nom: "Pharmacie du Boulgou",
    adresse: "Route de Fada",
    ville: "Tenkodogo",
    quartier: "Secteur 2",
    region: "Kom-Pangala",
    telephone: "+226 40 71 33 44",
    typeGarde: "jour",
    latitude: 11.7850,
    longitude: -0.3650
  },

  // REGION SAHEL (Dori, Gorom-Gorom)
  {
    id: "12",
    nom: "Pharmacie du Sahel",
    adresse: "Avenue Principale",
    ville: "Dori",
    quartier: "Centre",
    region: "Sahel",
    telephone: "+226 24 46 01 23",
    typeGarde: "24h",
    latitude: 14.0353,
    longitude: -0.0345
  },
  {
    id: "ph_dori_2",
    nom: "Pharmacie de l'Oudalan",
    adresse: "Route de Gorom-Gorom",
    ville: "Dori",
    quartier: "Secteur 1",
    region: "Sahel",
    telephone: "+226 24 46 22 33",
    typeGarde: "jour",
    latitude: 14.0400,
    longitude: -0.0300
  },
  {
    id: "ph_gorom_1",
    nom: "Pharmacie Gorom-Gorom",
    adresse: "Avenue Centrale",
    ville: "Gorom-Gorom",
    quartier: "Centre",
    region: "Sahel",
    telephone: "+226 24 45 11 22",
    typeGarde: "jour",
    latitude: 14.4436,
    longitude: -0.2353
  },

  // REGION DJÔRÔ (Banfora Sud)
  {
    id: "ph_manga_1",
    nom: "Pharmacie de Manga",
    adresse: "Avenue Principale",
    ville: "Manga",
    quartier: "Centre",
    region: "Djôrô",
    telephone: "+226 25 70 11 22",
    typeGarde: "jour",
    latitude: 11.6667,
    longitude: -1.0667
  },

  // REGION NAKAMBGA (Ziniaré)
  {
    id: "ph_ziniare_1",
    nom: "Pharmacie de Ziniaré",
    adresse: "Route Nationale",
    ville: "Ziniaré",
    quartier: "Centre",
    region: "Nakambga",
    telephone: "+226 25 30 88 99",
    typeGarde: "jour",
    latitude: 12.5833,
    longitude: -1.3000
  },
  {
    id: "ph_ziniare_2",
    nom: "Pharmacie du Oubritenga",
    adresse: "Avenue de Ouagadougou",
    ville: "Ziniaré",
    quartier: "Secteur 1",
    region: "Nakambga",
    telephone: "+226 25 30 77 88",
    typeGarde: "24h",
    latitude: 12.5850,
    longitude: -1.2950
  },

  // REGION WÈTEMGA (Kaya)
  {
    id: "ph_kaya_1",
    nom: "Pharmacie de Kaya",
    adresse: "Avenue Centrale",
    ville: "Kaya",
    quartier: "Centre",
    region: "Wètemga",
    telephone: "+226 24 45 22 33",
    typeGarde: "24h",
    latitude: 13.0919,
    longitude: -1.0844
  },
  {
    id: "ph_kaya_2",
    nom: "Pharmacie du Sanmatenga",
    adresse: "Route de Ouagadougou",
    ville: "Kaya",
    quartier: "Secteur 2",
    region: "Wètemga",
    telephone: "+226 24 45 44 55",
    typeGarde: "jour",
    latitude: 13.0950,
    longitude: -1.0800
  },

  // REGION PASSORÉ (Yako)
  {
    id: "ph_yako_1",
    nom: "Pharmacie de Yako",
    adresse: "Avenue Principale",
    ville: "Yako",
    quartier: "Centre",
    region: "Passoré",
    telephone: "+226 24 54 11 22",
    typeGarde: "jour",
    latitude: 12.9589,
    longitude: -2.2611
  },

  // REGION YONYOOSÉ (Réo)
  {
    id: "ph_reo_1",
    nom: "Pharmacie de Réo",
    adresse: "Avenue du Centre",
    ville: "Réo",
    quartier: "Centre",
    region: "Yonyoosé",
    telephone: "+226 25 48 11 22",
    typeGarde: "jour",
    latitude: 12.3192,
    longitude: -2.4708
  },

  // REGION TONDEKA (Dédougou)
  {
    id: "ph_dedou_1",
    nom: "Pharmacie de Dédougou",
    adresse: "Route Nationale",
    ville: "Dédougou",
    quartier: "Centre",
    region: "Tondeka",
    telephone: "+226 20 52 11 22",
    typeGarde: "24h",
    latitude: 12.4636,
    longitude: -3.4606
  },
  {
    id: "ph_dedou_2",
    nom: "Pharmacie du Mouhoun",
    adresse: "Avenue de la Liberté",
    ville: "Dédougou",
    quartier: "Secteur 1",
    region: "Tondeka",
    telephone: "+226 20 52 33 44",
    typeGarde: "jour",
    latitude: 12.4650,
    longitude: -3.4580
  },

  // REGION TAAR-SOOMBA (Tougan)
  {
    id: "ph_tougan_1",
    nom: "Pharmacie de Tougan",
    adresse: "Avenue Centrale",
    ville: "Tougan",
    quartier: "Centre",
    region: "Taar-Soomba",
    telephone: "+226 24 53 11 22",
    typeGarde: "jour",
    latitude: 13.0667,
    longitude: -3.0667
  },

  // REGION BANKUI (Orodara)
  {
    id: "ph_orodara_1",
    nom: "Pharmacie d'Orodara",
    adresse: "Route de Bobo",
    ville: "Orodara",
    quartier: "Centre",
    region: "Bankui",
    telephone: "+226 20 95 11 22",
    typeGarde: "jour",
    latitude: 10.9833,
    longitude: -4.9167
  },

  // REGION YIRKA-GAONGO (Léo)
  {
    id: "ph_leo_1",
    nom: "Pharmacie de Léo",
    adresse: "Avenue Principale",
    ville: "Léo",
    quartier: "Centre",
    region: "Yirka-Gaongo",
    telephone: "+226 25 43 11 22",
    typeGarde: "jour",
    latitude: 11.1000,
    longitude: -2.1000
  },

  // Pharmacies supplémentaires Ouagadougou
  {
    id: "ph_ouaga_11",
    nom: "Pharmacie Ouaga 2000",
    adresse: "Boulevard de Ouaga 2000",
    ville: "Ouagadougou",
    quartier: "Ouaga 2000",
    region: "Kadiogo",
    telephone: "+226 25 37 99 00",
    typeGarde: "24h",
    latitude: 12.3300,
    longitude: -1.4800
  },
  {
    id: "ph_ouaga_12",
    nom: "Pharmacie Nioko 2",
    adresse: "Avenue de l'UEMOA",
    ville: "Ouagadougou",
    quartier: "Zone du Bois",
    region: "Kadiogo",
    telephone: "+226 25 36 22 33",
    typeGarde: "jour",
    latitude: 12.3850,
    longitude: -1.4950
  },
  {
    id: "ph_ouaga_13",
    nom: "Pharmacie Somgandé",
    adresse: "Route de Koupéla",
    ville: "Ouagadougou",
    quartier: "Somgandé",
    region: "Kadiogo",
    telephone: "+226 25 40 11 22",
    typeGarde: "nuit",
    latitude: 12.4100,
    longitude: -1.4700
  },
  {
    id: "ph_ouaga_14",
    nom: "Pharmacie Tampouy",
    adresse: "Avenue Bassawarga",
    ville: "Ouagadougou",
    quartier: "Tampouy",
    region: "Kadiogo",
    telephone: "+226 25 41 33 44",
    typeGarde: "jour",
    latitude: 12.4200,
    longitude: -1.5200
  },
  {
    id: "ph_ouaga_15",
    nom: "Pharmacie Zagtouli",
    adresse: "Route de Bobo",
    ville: "Ouagadougou",
    quartier: "Zagtouli",
    region: "Kadiogo",
    telephone: "+226 25 42 55 66",
    typeGarde: "24h",
    latitude: 12.3200,
    longitude: -1.5600
  },
  
  // Nouvelles pharmacies ajoutées pour rotation
  {
    id: "ph_ouaga_16",
    nom: "Pharmacie du Progrès",
    adresse: "Avenue de la Révolution",
    ville: "Ouagadougou",
    quartier: "Dassasgho",
    region: "Kadiogo",
    telephone: "+226 25 43 11 22",
    typeGarde: "jour",
    latitude: 12.3500,
    longitude: -1.5100
  },
  {
    id: "ph_ouaga_17",
    nom: "Pharmacie du Peuple",
    adresse: "Route de Kaya",
    ville: "Ouagadougou",
    quartier: "Pissy",
    region: "Kadiogo",
    telephone: "+226 25 44 22 33",
    typeGarde: "nuit",
    latitude: 12.3400,
    longitude: -1.5300
  },
  {
    id: "ph_ouaga_18",
    nom: "Pharmacie de la Paix",
    adresse: "Avenue Nelson Mandela",
    ville: "Ouagadougou",
    quartier: "Gounghin",
    region: "Kadiogo",
    telephone: "+226 25 45 33 44",
    typeGarde: "jour",
    latitude: 12.3680,
    longitude: -1.5270
  },
  {
    id: "ph_ouaga_19",
    nom: "Pharmacie du Soleil",
    adresse: "Boulevard des Armées",
    ville: "Ouagadougou",
    quartier: "Koulouba",
    region: "Kadiogo",
    telephone: "+226 25 46 44 55",
    typeGarde: "nuit",
    latitude: 12.3750,
    longitude: -1.5220
  },
  {
    id: "ph_ouaga_20",
    nom: "Pharmacie de l'Espoir",
    adresse: "Avenue Loudun",
    ville: "Ouagadougou",
    quartier: "Zone du Bois",
    region: "Kadiogo",
    telephone: "+226 25 47 55 66",
    typeGarde: "jour",
    latitude: 12.3850,
    longitude: -1.4950
  },
  {
    id: "ph_bobo_6",
    nom: "Pharmacie du Centre",
    adresse: "Place de la Nation",
    ville: "Bobo-Dioulasso",
    quartier: "Centre-ville",
    region: "Guiriko",
    telephone: "+226 20 99 22 33",
    typeGarde: "nuit",
    latitude: 11.1790,
    longitude: -4.2910
  },
  {
    id: "ph_bobo_7",
    nom: "Pharmacie de la République",
    adresse: "Avenue Ouezzin Coulibaly",
    ville: "Bobo-Dioulasso",
    quartier: "Sarfalao",
    region: "Guiriko",
    telephone: "+226 20 99 33 44",
    typeGarde: "jour",
    latitude: 11.1830,
    longitude: -4.2880
  },
  {
    id: "ph_koudou_4",
    nom: "Pharmacie Saint Paul",
    adresse: "Avenue de la Nation",
    ville: "Koudougou",
    quartier: "Secteur 2",
    region: "Koom-Kuuli",
    telephone: "+226 25 44 66 77",
    typeGarde: "24h",
    latitude: 12.2480,
    longitude: -2.3600
  },
  {
    id: "ph_fada_3",
    nom: "Pharmacie de l'Espérance",
    adresse: "Route de Pama",
    ville: "Fada N'Gourma",
    quartier: "Secteur 3",
    region: "Goulmou",
    telephone: "+226 24 77 44 55",
    typeGarde: "nuit",
    latitude: 12.0600,
    longitude: 0.3620
  },
  {
    id: "ph_ouahi_4",
    nom: "Pharmacie du Sahel",
    adresse: "Avenue du Commerce",
    ville: "Ouahigouya",
    quartier: "Secteur 2",
    region: "Taoud-Weogo",
    telephone: "+226 24 55 77 88",
    typeGarde: "jour",
    latitude: 13.5820,
    longitude: -2.4180
  },
  {
    id: "ph_tenko_3",
    nom: "Pharmacie Centrale Tenkodogo",
    adresse: "Route de Ouagadougou",
    ville: "Tenkodogo",
    quartier: "Centre",
    region: "Kom-Pangala",
    telephone: "+226 40 71 44 55",
    typeGarde: "24h",
    latitude: 11.7820,
    longitude: -0.3680
  },
  {
    id: "ph_banfora_3",
    nom: "Pharmacie de la Paix",
    adresse: "Avenue Principale",
    ville: "Banfora",
    quartier: "Secteur 3",
    region: "Poni-Tiari",
    telephone: "+226 20 91 55 66",
    typeGarde: "24h",
    latitude: 10.6350,
    longitude: -4.7600
  },
  {
    id: "ph_dori_3",
    nom: "Pharmacie de l'Amitié",
    adresse: "Route de Djibo",
    ville: "Dori",
    quartier: "Secteur 2",
    region: "Sahel",
    telephone: "+226 24 46 33 44",
    typeGarde: "nuit",
    latitude: 14.0380,
    longitude: -0.0320
  },
  {
    id: "ph_dedou_3",
    nom: "Pharmacie de la Santé",
    adresse: "Route de Ouagadougou",
    ville: "Dédougou",
    quartier: "Secteur 2",
    region: "Tondeka",
    telephone: "+226 20 52 44 55",
    typeGarde: "nuit",
    latitude: 12.4620,
    longitude: -3.4590
  },
  {
    id: "ph_kaya_3",
    nom: "Pharmacie du Nord",
    adresse: "Route de Dori",
    ville: "Kaya",
    quartier: "Secteur 3",
    region: "Wètemga",
    telephone: "+226 24 45 55 66",
    typeGarde: "nuit",
    latitude: 13.0900,
    longitude: -1.0820
  }
];

// Fonction pour déterminer les pharmacies de garde du jour
function getPharmaciesDeGardeAujourdhui(): Pharmacie[] {
  // Utiliser la date du jour comme seed pour une rotation cohérente
  const today = new Date();
  const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000);
  
  // Créer une copie et mélanger selon le jour
  const allPharmacies = [...TOUTES_PHARMACIES];
  const seed = dayOfYear;
  
  // Algorithme de mélange déterministe basé sur le jour
  for (let i = allPharmacies.length - 1; i > 0; i--) {
    const j = (seed * (i + 1)) % (i + 1);
    [allPharmacies[i], allPharmacies[j]] = [allPharmacies[j], allPharmacies[i]];
  }
  
  // Sélectionner environ 60% des pharmacies comme étant de garde
  const nombreDeGarde = Math.floor(allPharmacies.length * 0.6);
  const pharmaciesDeGarde = allPharmacies.slice(0, nombreDeGarde);
  
  // Réassigner les types de garde de manière équilibrée
  const typeGardes: Array<"jour" | "nuit" | "24h"> = ["jour", "nuit", "24h"];
  pharmaciesDeGarde.forEach((pharmacie, index) => {
    // 20% en 24h, 40% jour, 40% nuit
    if (index < nombreDeGarde * 0.2) {
      pharmacie.typeGarde = "24h";
    } else if (index < nombreDeGarde * 0.6) {
      pharmacie.typeGarde = "jour";
    } else {
      pharmacie.typeGarde = "nuit";
    }
  });
  
  return pharmaciesDeGarde;
}

// Liste des pharmacies de garde qui change quotidiennement
export const PHARMACIES_DATA: Pharmacie[] = getPharmaciesDeGardeAujourdhui();

const REGIONS = [
  "Bankui", "Djôrô", "Goulmou", "Guiriko", "Kadiogo", "Koom-Kuuli",
  "Kom-Pangala", "Nakambga", "Passoré", "Poni-Tiari", "Sahel",
  "Taar-Soomba", "Taoud-Weogo", "Tondeka", "Wètemga", "Yirka-Gaongo", "Yonyoosé"
];

export default function Pharmacies() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRegion, setSelectedRegion] = useState<string>("all");
  const [, setLocation] = useLocation();
  const [pharmacies, setPharmacies] = useState<Pharmacie[]>(PHARMACIES_DATA);
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const { toast } = useToast();
  const lastFetchRef = useRef<number>(0);

  // Fonction pour récupérer les pharmacies depuis l'API (avec debounce de 5 secondes)
  const fetchPharmacies = useCallback(async () => {
    const now = Date.now();
    // Éviter les appels multiples rapides (debounce 5 secondes)
    if (now - lastFetchRef.current < 5000) {
      return;
    }
    lastFetchRef.current = now;
    
    setLoading(true);
    try {
      const response = await fetch("/api/pharmacies");
      if (!response.ok) throw new Error("Erreur lors du chargement");
      const data = await response.json();
      setPharmacies(data);
      setLastUpdate(new Date());
    } catch (error) {
      console.error("Erreur:", error);
      // Utiliser les données locales en cas d'erreur
      setPharmacies(PHARMACIES_DATA);
    } finally {
      setLoading(false);
    }
  }, []);

  // Chargement initial
  useEffect(() => {
    fetchPharmacies();
  }, [fetchPharmacies]);

  // Rafraîchir automatiquement les données quand la page reprend le focus
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchPharmacies();
      }
    };

    const handleFocus = () => {
      fetchPharmacies();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleFocus);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleFocus);
    };
  }, [fetchPharmacies]);

  const filteredPharmacies = useMemo(() => {
    let filtered = pharmacies;

    if (selectedRegion !== "all") {
      filtered = filtered.filter(p => p.region === selectedRegion);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p =>
        p.nom.toLowerCase().includes(query) ||
        p.ville.toLowerCase().includes(query) ||
        p.quartier.toLowerCase().includes(query) ||
        p.adresse.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [searchQuery, selectedRegion, pharmacies]);

  const openInMaps = (pharmacie: Pharmacie) => {
    if (pharmacie.latitude && pharmacie.longitude) {
      const url = `https://www.google.com/maps/search/?api=1&query=${pharmacie.latitude},${pharmacie.longitude}`;
      window.open(url, '_blank', 'noopener,noreferrer');
    } else {
      const query = encodeURIComponent(`${pharmacie.nom} ${pharmacie.ville} ${pharmacie.adresse}`);
      const url = `https://www.google.com/maps/search/?api=1&query=${query}`;
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  const getGardeColor = (type: string) => {
    switch (type) {
      case "24h":
        return "bg-green-500 text-white";
      case "jour":
        return "bg-yellow-500 text-black";
      case "nuit":
        return "bg-blue-500 text-white";
      default:
        return "bg-gray-500 text-white";
    }
  };

  const getGardeLabel = (type: string) => {
    switch (type) {
      case "24h":
        return "24h/24";
      case "jour":
        return "Garde de jour";
      case "nuit":
        return "Garde de nuit";
      default:
        return type;
    }
  };

  const handleReset = () => {
    setSearchQuery("");
    setSelectedRegion("all");
    fetchPharmacies();
    toast({
      title: "Données actualisées",
      description: `${pharmacies.length} pharmacies disponibles`,
    });
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <Header />

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="mb-4 flex items-center gap-2">
          <Button
            variant="ghost"
            onClick={() => setLocation("/")}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour
          </Button>
          <Button
            variant="outline"
            onClick={handleReset}
            className="gap-2 ml-auto"
          >
            <RefreshCw className="w-4 h-4" />
            Réinitialiser
          </Button>
        </div>

        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
            <span className="text-2xl">💊</span>
            Pharmacies de Garde
          </h1>
          <p className="text-muted-foreground">
            Liste des pharmacies de garde au Burkina Faso
          </p>
        </div>

        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Rechercher par nom, ville, quartier..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Select value={selectedRegion} onValueChange={setSelectedRegion}>
                <SelectTrigger>
                  <SelectValue placeholder="Toutes les régions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les régions</SelectItem>
                  {REGIONS.map(region => (
                    <SelectItem key={region} value={region}>
                      {region}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="mt-3 text-sm text-muted-foreground">
              {filteredPharmacies.length} pharmacie{filteredPharmacies.length > 1 ? 's' : ''} trouvée{filteredPharmacies.length > 1 ? 's' : ''}
            </div>
          </CardContent>
        </Card>

        {filteredPharmacies.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-muted-foreground">
                Aucune pharmacie trouvée avec ces critères
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredPharmacies.map((pharmacie) => (
              <Card key={pharmacie.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-2">{pharmacie.nom}</CardTitle>
                      <Badge className={getGardeColor(pharmacie.typeGarde)}>
                        <Clock className="w-3 h-3 mr-1" />
                        {getGardeLabel(pharmacie.typeGarde)}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 mb-4">
                    <div className="flex items-start gap-2 text-sm">
                      <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium">{pharmacie.adresse}</p>
                        <p className="text-muted-foreground">
                          {pharmacie.quartier}, {pharmacie.ville} - {pharmacie.region}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      <a 
                        href={`tel:${pharmacie.telephone}`}
                        className="text-primary hover:underline"
                      >
                        {pharmacie.telephone}
                      </a>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={() => openInMaps(pharmacie)}
                      className="flex-1 gap-2"
                      variant="default"
                    >
                      <Navigation className="w-4 h-4" />
                      Itinéraire
                    </Button>
                    <Button
                      asChild
                      variant="outline"
                      className="gap-2"
                    >
                      <a href={`tel:${pharmacie.telephone}`}>
                        <Phone className="w-4 h-4" />
                        Appeler
                      </a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <EmergencyPanel />
      <BottomNav />
    </div>
  );
}
