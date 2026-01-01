
import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import EmergencyPanel from "@/components/EmergencyPanel";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, MapPin, Phone, Clock, Navigation, ArrowLeft, RefreshCw, AlertCircle, Shield, Calendar, ExternalLink } from "lucide-react";
import { VoiceSearchButton } from "@/components/VoiceSearchButton";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";

interface PharmacieDeGarde {
  nom: string;
  telephone: string;
  groupe: 1 | 2 | 3 | 4;
  ville: "Ouagadougou" | "Bobo-Dioulasso";
}

interface PharmaciesDeGardeResponse {
  date: string;
  groupeOuagadougou: number;
  groupeBobo: number;
  pharmacies: PharmacieDeGarde[];
  total: number;
  info: {
    source: string;
    lastUpdate: string;
    description: string;
    totalPharmacies: number;
  };
}

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

// Données complètes des pharmacies de garde du Burkina Faso - Base élargie 150+ pharmacies
export const PHARMACIES_DATA: Pharmacie[] = [
  // =====================================================
  // REGION KADIOGO (Ouagadougou) - 35 pharmacies
  // =====================================================
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
  {
    id: "ph_ouaga_16",
    nom: "Pharmacie Bilbalgho",
    adresse: "Avenue Yatenga",
    ville: "Ouagadougou",
    quartier: "Bilbalgho",
    region: "Kadiogo",
    telephone: "+226 25 31 89 45",
    typeGarde: "jour",
    latitude: 12.3720,
    longitude: -1.5050
  },
  {
    id: "ph_ouaga_17",
    nom: "Pharmacie Pissy",
    adresse: "Route de Pissy",
    ville: "Ouagadougou",
    quartier: "Pissy",
    region: "Kadiogo",
    telephone: "+226 25 35 67 89",
    typeGarde: "nuit",
    latitude: 12.3580,
    longitude: -1.5700
  },
  {
    id: "ph_ouaga_18",
    nom: "Pharmacie Samandin",
    adresse: "Boulevard du 11 Décembre",
    ville: "Ouagadougou",
    quartier: "Samandin",
    region: "Kadiogo",
    telephone: "+226 25 34 12 34",
    typeGarde: "24h",
    latitude: 12.3400,
    longitude: -1.5100
  },
  {
    id: "ph_ouaga_19",
    nom: "Pharmacie Kossodo",
    adresse: "Zone Industrielle",
    ville: "Ouagadougou",
    quartier: "Kossodo",
    region: "Kadiogo",
    telephone: "+226 25 35 78 90",
    typeGarde: "jour",
    latitude: 12.4300,
    longitude: -1.4600
  },
  {
    id: "ph_ouaga_20",
    nom: "Pharmacie Patte d'Oie",
    adresse: "Carrefour Patte d'Oie",
    ville: "Ouagadougou",
    quartier: "Patte d'Oie",
    region: "Kadiogo",
    telephone: "+226 25 36 45 67",
    typeGarde: "24h",
    latitude: 12.3480,
    longitude: -1.5380
  },
  {
    id: "ph_ouaga_21",
    nom: "Pharmacie Hamdallaye",
    adresse: "Avenue de la Jeunesse",
    ville: "Ouagadougou",
    quartier: "Hamdallaye",
    region: "Kadiogo",
    telephone: "+226 25 37 23 45",
    typeGarde: "nuit",
    latitude: 12.3950,
    longitude: -1.5150
  },
  {
    id: "ph_ouaga_22",
    nom: "Pharmacie Dassasgho",
    adresse: "Route de Fada",
    ville: "Ouagadougou",
    quartier: "Dassasgho",
    region: "Kadiogo",
    telephone: "+226 25 38 56 78",
    typeGarde: "jour",
    latitude: 12.3880,
    longitude: -1.4850
  },
  {
    id: "ph_ouaga_23",
    nom: "Pharmacie Bendogo",
    adresse: "Avenue de l'Espoir",
    ville: "Ouagadougou",
    quartier: "Bendogo",
    region: "Kadiogo",
    telephone: "+226 25 39 87 65",
    typeGarde: "nuit",
    latitude: 12.4050,
    longitude: -1.5300
  },
  {
    id: "ph_ouaga_24",
    nom: "Pharmacie Kalgondin",
    adresse: "Boulevard Thomas Sankara",
    ville: "Ouagadougou",
    quartier: "Kalgondin",
    region: "Kadiogo",
    telephone: "+226 25 40 34 56",
    typeGarde: "24h",
    latitude: 12.3650,
    longitude: -1.4950
  },
  {
    id: "ph_ouaga_25",
    nom: "Pharmacie Nonsin",
    adresse: "Rue de la Paix",
    ville: "Ouagadougou",
    quartier: "Nonsin",
    region: "Kadiogo",
    telephone: "+226 25 41 67 89",
    typeGarde: "jour",
    latitude: 12.3780,
    longitude: -1.5080
  },
  {
    id: "ph_ouaga_26",
    nom: "Pharmacie Gounghin Nord",
    adresse: "Avenue du Progrès",
    ville: "Ouagadougou",
    quartier: "Gounghin Nord",
    region: "Kadiogo",
    telephone: "+226 25 42 90 12",
    typeGarde: "nuit",
    latitude: 12.3700,
    longitude: -1.5320
  },
  {
    id: "ph_ouaga_27",
    nom: "Pharmacie Bogodogo",
    adresse: "Route de Fada N'Gourma",
    ville: "Ouagadougou",
    quartier: "Bogodogo",
    region: "Kadiogo",
    telephone: "+226 25 43 21 43",
    typeGarde: "24h",
    latitude: 12.3920,
    longitude: -1.4780
  },
  {
    id: "ph_ouaga_28",
    nom: "Pharmacie Boulmiougou",
    adresse: "Avenue du Stade",
    ville: "Ouagadougou",
    quartier: "Boulmiougou",
    region: "Kadiogo",
    telephone: "+226 25 44 54 76",
    typeGarde: "jour",
    latitude: 12.3520,
    longitude: -1.5550
  },
  {
    id: "ph_ouaga_29",
    nom: "Pharmacie Sig-Nonghin",
    adresse: "Boulevard de la Révolution",
    ville: "Ouagadougou",
    quartier: "Sig-Nonghin",
    region: "Kadiogo",
    telephone: "+226 25 45 87 09",
    typeGarde: "nuit",
    latitude: 12.4000,
    longitude: -1.5200
  },
  {
    id: "ph_ouaga_30",
    nom: "Pharmacie Nongr-Massom",
    adresse: "Avenue des Nations Unies",
    ville: "Ouagadougou",
    quartier: "Nongr-Massom",
    region: "Kadiogo",
    telephone: "+226 25 46 10 32",
    typeGarde: "24h",
    latitude: 12.4150,
    longitude: -1.5100
  },
  {
    id: "ph_saaba_1",
    nom: "Pharmacie de Saaba",
    adresse: "Route Nationale",
    ville: "Saaba",
    quartier: "Centre",
    region: "Kadiogo",
    telephone: "+226 25 47 43 65",
    typeGarde: "jour",
    latitude: 12.3833,
    longitude: -1.4167
  },
  {
    id: "ph_koubri_1",
    nom: "Pharmacie de Koubri",
    adresse: "Avenue Principale",
    ville: "Koubri",
    quartier: "Centre",
    region: "Kadiogo",
    telephone: "+226 25 48 76 98",
    typeGarde: "jour",
    latitude: 12.2167,
    longitude: -1.5667
  },
  {
    id: "ph_komsilga_1",
    nom: "Pharmacie de Komsilga",
    adresse: "Route de Ouagadougou",
    ville: "Komsilga",
    quartier: "Centre",
    region: "Kadiogo",
    telephone: "+226 25 49 09 21",
    typeGarde: "nuit",
    latitude: 12.2833,
    longitude: -1.5333
  },
  {
    id: "ph_pabre_1",
    nom: "Pharmacie de Pabré",
    adresse: "Route Nationale",
    ville: "Pabré",
    quartier: "Centre",
    region: "Kadiogo",
    telephone: "+226 25 50 32 54",
    typeGarde: "jour",
    latitude: 12.5000,
    longitude: -1.5833
  },
  {
    id: "ph_tanghin_1",
    nom: "Pharmacie de Tanghin-Dassouri",
    adresse: "Avenue du Village",
    ville: "Tanghin-Dassouri",
    quartier: "Centre",
    region: "Kadiogo",
    telephone: "+226 25 51 65 87",
    typeGarde: "jour",
    latitude: 12.3333,
    longitude: -1.6500
  },

  // =====================================================
  // REGION GUIRIKO (Bobo-Dioulasso) - 20 pharmacies
  // =====================================================
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
  {
    id: "ph_bobo_6",
    nom: "Pharmacie Sarfalao",
    adresse: "Rue de Sarfalao",
    ville: "Bobo-Dioulasso",
    quartier: "Sarfalao",
    region: "Guiriko",
    telephone: "+226 20 97 33 44",
    typeGarde: "nuit",
    latitude: 11.1700,
    longitude: -4.2850
  },
  {
    id: "ph_bobo_7",
    nom: "Pharmacie Tounouma",
    adresse: "Avenue de Tounouma",
    ville: "Bobo-Dioulasso",
    quartier: "Tounouma",
    region: "Guiriko",
    telephone: "+226 20 98 66 77",
    typeGarde: "jour",
    latitude: 11.1900,
    longitude: -4.3050
  },
  {
    id: "ph_bobo_8",
    nom: "Pharmacie Ouezzinville",
    adresse: "Boulevard de l'Indépendance",
    ville: "Bobo-Dioulasso",
    quartier: "Ouezzinville",
    region: "Guiriko",
    telephone: "+226 20 99 88 99",
    typeGarde: "24h",
    latitude: 11.1780,
    longitude: -4.2980
  },
  {
    id: "ph_bobo_9",
    nom: "Pharmacie Sikasso-Cira",
    adresse: "Route de Sikasso",
    ville: "Bobo-Dioulasso",
    quartier: "Sikasso-Cira",
    region: "Guiriko",
    telephone: "+226 20 97 44 55",
    typeGarde: "nuit",
    latitude: 11.1650,
    longitude: -4.2800
  },
  {
    id: "ph_bobo_10",
    nom: "Pharmacie Bindougousso",
    adresse: "Rue de Bindougousso",
    ville: "Bobo-Dioulasso",
    quartier: "Bindougousso",
    region: "Guiriko",
    telephone: "+226 20 98 77 88",
    typeGarde: "jour",
    latitude: 11.1720,
    longitude: -4.2750
  },
  {
    id: "ph_bobo_11",
    nom: "Pharmacie Lafiabougou",
    adresse: "Avenue de Lafiabougou",
    ville: "Bobo-Dioulasso",
    quartier: "Lafiabougou",
    region: "Guiriko",
    telephone: "+226 20 99 00 11",
    typeGarde: "24h",
    latitude: 11.1830,
    longitude: -4.2700
  },
  {
    id: "ph_bobo_12",
    nom: "Pharmacie Hamdalaye",
    adresse: "Rue de Hamdalaye",
    ville: "Bobo-Dioulasso",
    quartier: "Hamdalaye",
    region: "Guiriko",
    telephone: "+226 20 97 55 66",
    typeGarde: "nuit",
    latitude: 11.1880,
    longitude: -4.3100
  },
  {
    id: "ph_bobo_13",
    nom: "Pharmacie Secteur 25",
    adresse: "Boulevard du Secteur 25",
    ville: "Bobo-Dioulasso",
    quartier: "Secteur 25",
    region: "Guiriko",
    telephone: "+226 20 98 22 33",
    typeGarde: "jour",
    latitude: 11.1600,
    longitude: -4.2950
  },
  {
    id: "ph_hounde_1",
    nom: "Pharmacie de Houndé",
    adresse: "Avenue Principale",
    ville: "Houndé",
    quartier: "Centre",
    region: "Guiriko",
    telephone: "+226 20 95 11 22",
    typeGarde: "24h",
    latitude: 11.4917,
    longitude: -3.5153
  },
  {
    id: "ph_hounde_2",
    nom: "Pharmacie du Tuy",
    adresse: "Route de Bobo",
    ville: "Houndé",
    quartier: "Secteur 2",
    region: "Guiriko",
    telephone: "+226 20 95 33 44",
    typeGarde: "jour",
    latitude: 11.4950,
    longitude: -3.5100
  },
  {
    id: "ph_orodara_2",
    nom: "Pharmacie Kénédougou",
    adresse: "Avenue du Marché",
    ville: "Orodara",
    quartier: "Centre",
    region: "Guiriko",
    telephone: "+226 20 95 55 66",
    typeGarde: "nuit",
    latitude: 10.9750,
    longitude: -4.9100
  },
  {
    id: "ph_peni_1",
    nom: "Pharmacie de Péni",
    adresse: "Route Nationale",
    ville: "Péni",
    quartier: "Centre",
    region: "Guiriko",
    telephone: "+226 20 95 77 88",
    typeGarde: "jour",
    latitude: 11.1167,
    longitude: -4.2000
  },
  {
    id: "ph_bama_1",
    nom: "Pharmacie de Bama",
    adresse: "Avenue du Village",
    ville: "Bama",
    quartier: "Centre",
    region: "Guiriko",
    telephone: "+226 20 95 99 00",
    typeGarde: "jour",
    latitude: 11.3833,
    longitude: -4.4167
  },
  {
    id: "ph_lena_1",
    nom: "Pharmacie de Léna",
    adresse: "Route de Bobo",
    ville: "Léna",
    quartier: "Centre",
    region: "Guiriko",
    telephone: "+226 20 96 11 22",
    typeGarde: "nuit",
    latitude: 11.3167,
    longitude: -4.1500
  },
  {
    id: "ph_satiri_1",
    nom: "Pharmacie de Satiri",
    adresse: "Avenue Principale",
    ville: "Satiri",
    quartier: "Centre",
    region: "Guiriko",
    telephone: "+226 20 96 33 44",
    typeGarde: "jour",
    latitude: 11.4833,
    longitude: -3.9500
  },

  // =====================================================
  // REGION PONI-TIARI (Banfora, Gaoua) - 12 pharmacies
  // =====================================================
  {
    id: "6",
    nom: "Pharmacie de la Comoé",
    adresse: "Avenue de la Révolution",
    ville: "Banfora",
    quartier: "Centre",
    region: "Poni-Tiari",
    telephone: "+226 20 91 02 34",
    typeGarde: "24h",
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
    id: "ph_banfora_3",
    nom: "Pharmacie du Pont",
    adresse: "Avenue du Pont",
    ville: "Banfora",
    quartier: "Secteur 1",
    region: "Poni-Tiari",
    telephone: "+226 20 91 66 77",
    typeGarde: "nuit",
    latitude: 10.6280,
    longitude: -4.7580
  },
  {
    id: "ph_banfora_4",
    nom: "Pharmacie Sanogo",
    adresse: "Rue du Commerce",
    ville: "Banfora",
    quartier: "Centre-ville",
    region: "Poni-Tiari",
    telephone: "+226 20 91 88 99",
    typeGarde: "24h",
    latitude: 10.6350,
    longitude: -4.7550
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
  {
    id: "ph_gaoua_2",
    nom: "Pharmacie de la Bougouriba",
    adresse: "Route de Diébougou",
    ville: "Gaoua",
    quartier: "Secteur 1",
    region: "Poni-Tiari",
    telephone: "+226 20 90 33 44",
    typeGarde: "jour",
    latitude: 10.3300,
    longitude: -3.1780
  },
  {
    id: "ph_sindou_1",
    nom: "Pharmacie de Sindou",
    adresse: "Avenue du Marché",
    ville: "Sindou",
    quartier: "Centre",
    region: "Poni-Tiari",
    telephone: "+226 20 91 11 22",
    typeGarde: "jour",
    latitude: 10.6667,
    longitude: -5.1667
  },
  {
    id: "ph_niangoloko_1",
    nom: "Pharmacie de Niangoloko",
    adresse: "Route de Côte d'Ivoire",
    ville: "Niangoloko",
    quartier: "Centre",
    region: "Poni-Tiari",
    telephone: "+226 20 92 11 22",
    typeGarde: "24h",
    latitude: 9.9833,
    longitude: -4.9167
  },
  {
    id: "ph_diebougou_1",
    nom: "Pharmacie de Diébougou",
    adresse: "Avenue Centrale",
    ville: "Diébougou",
    quartier: "Centre",
    region: "Poni-Tiari",
    telephone: "+226 20 90 55 66",
    typeGarde: "nuit",
    latitude: 10.9667,
    longitude: -3.2500
  },
  {
    id: "ph_diebougou_2",
    nom: "Pharmacie de l'Ioba",
    adresse: "Route de Dano",
    ville: "Diébougou",
    quartier: "Secteur 2",
    region: "Poni-Tiari",
    telephone: "+226 20 90 77 88",
    typeGarde: "jour",
    latitude: 10.9700,
    longitude: -3.2450
  },
  {
    id: "ph_dano_1",
    nom: "Pharmacie de Dano",
    adresse: "Avenue du Village",
    ville: "Dano",
    quartier: "Centre",
    region: "Poni-Tiari",
    telephone: "+226 20 90 99 00",
    typeGarde: "jour",
    latitude: 11.1500,
    longitude: -3.0667
  },
  {
    id: "ph_loropeni_1",
    nom: "Pharmacie de Loropéni",
    adresse: "Route Nationale",
    ville: "Loropéni",
    quartier: "Centre",
    region: "Poni-Tiari",
    telephone: "+226 20 91 21 32",
    typeGarde: "nuit",
    latitude: 10.2500,
    longitude: -3.5833
  },

  // =====================================================
  // REGION KOOM-KUULI (Koudougou, Réo) - 10 pharmacies
  // =====================================================
  {
    id: "7",
    nom: "Pharmacie Faso",
    adresse: "Rue de l'Indépendance",
    ville: "Koudougou",
    quartier: "Centre-ville",
    region: "Koom-Kuuli",
    telephone: "+226 25 44 01 56",
    typeGarde: "24h",
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
  {
    id: "ph_koudou_4",
    nom: "Pharmacie de l'Espoir",
    adresse: "Avenue du 11 Décembre",
    ville: "Koudougou",
    quartier: "Secteur 5",
    region: "Koom-Kuuli",
    telephone: "+226 25 44 77 88",
    typeGarde: "24h",
    latitude: 12.2480,
    longitude: -2.3700
  },
  {
    id: "ph_koudou_5",
    nom: "Pharmacie Populaire",
    adresse: "Rue du Marché",
    ville: "Koudougou",
    quartier: "Secteur 2",
    region: "Koom-Kuuli",
    telephone: "+226 25 44 99 00",
    typeGarde: "jour",
    latitude: 12.2560,
    longitude: -2.3580
  },
  {
    id: "ph_reo_1",
    nom: "Pharmacie de Réo",
    adresse: "Avenue du Centre",
    ville: "Réo",
    quartier: "Centre",
    region: "Koom-Kuuli",
    telephone: "+226 25 48 11 22",
    typeGarde: "24h",
    latitude: 12.3192,
    longitude: -2.4708
  },
  {
    id: "ph_reo_2",
    nom: "Pharmacie du Sanguié",
    adresse: "Route de Koudougou",
    ville: "Réo",
    quartier: "Secteur 1",
    region: "Koom-Kuuli",
    telephone: "+226 25 48 33 44",
    typeGarde: "jour",
    latitude: 12.3220,
    longitude: -2.4680
  },
  {
    id: "ph_leo_1",
    nom: "Pharmacie de Léo",
    adresse: "Avenue Principale",
    ville: "Léo",
    quartier: "Centre",
    region: "Koom-Kuuli",
    telephone: "+226 25 43 11 22",
    typeGarde: "nuit",
    latitude: 11.1000,
    longitude: -2.1000
  },
  {
    id: "ph_sapouy_1",
    nom: "Pharmacie de Sapouy",
    adresse: "Route Nationale",
    ville: "Sapouy",
    quartier: "Centre",
    region: "Koom-Kuuli",
    telephone: "+226 25 43 33 44",
    typeGarde: "jour",
    latitude: 11.5500,
    longitude: -1.7667
  },
  {
    id: "ph_nanoro_1",
    nom: "Pharmacie de Nanoro",
    adresse: "Avenue du Village",
    ville: "Nanoro",
    quartier: "Centre",
    region: "Koom-Kuuli",
    telephone: "+226 25 44 43 54",
    typeGarde: "jour",
    latitude: 12.6833,
    longitude: -2.2333
  },

  // =====================================================
  // REGION GOULMOU (Fada N'Gourma) - 8 pharmacies
  // =====================================================
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
  {
    id: "ph_fada_3",
    nom: "Pharmacie du Gulmu",
    adresse: "Avenue de la Paix",
    ville: "Fada N'Gourma",
    quartier: "Secteur 3",
    region: "Goulmou",
    telephone: "+226 24 77 55 66",
    typeGarde: "nuit",
    latitude: 12.0580,
    longitude: 0.3550
  },
  {
    id: "ph_fada_4",
    nom: "Pharmacie Populaire Fada",
    adresse: "Rue du Marché",
    ville: "Fada N'Gourma",
    quartier: "Centre-ville",
    region: "Goulmou",
    telephone: "+226 24 77 77 88",
    typeGarde: "24h",
    latitude: 12.0630,
    longitude: 0.3620
  },
  {
    id: "ph_pama_1",
    nom: "Pharmacie de Pama",
    adresse: "Avenue Principale",
    ville: "Pama",
    quartier: "Centre",
    region: "Goulmou",
    telephone: "+226 24 78 11 22",
    typeGarde: "jour",
    latitude: 11.2500,
    longitude: 0.7000
  },
  {
    id: "ph_diapaga_1",
    nom: "Pharmacie de Diapaga",
    adresse: "Route de Fada",
    ville: "Diapaga",
    quartier: "Centre",
    region: "Goulmou",
    telephone: "+226 24 79 11 22",
    typeGarde: "24h",
    latitude: 12.0667,
    longitude: 1.7833
  },
  {
    id: "ph_diapaga_2",
    nom: "Pharmacie de la Tapoa",
    adresse: "Avenue du Village",
    ville: "Diapaga",
    quartier: "Secteur 1",
    region: "Goulmou",
    telephone: "+226 24 79 33 44",
    typeGarde: "nuit",
    latitude: 12.0700,
    longitude: 1.7800
  },
  {
    id: "ph_kantchari_1",
    nom: "Pharmacie de Kantchari",
    adresse: "Route Nationale",
    ville: "Kantchari",
    quartier: "Centre",
    region: "Goulmou",
    telephone: "+226 24 79 55 66",
    typeGarde: "jour",
    latitude: 12.4833,
    longitude: 1.5167
  },

  // =====================================================
  // REGION TAOUD-WEOGO (Ouahigouya) - 10 pharmacies
  // =====================================================
  {
    id: "9",
    nom: "Pharmacie du Nord",
    adresse: "Route de Djibo",
    ville: "Ouahigouya",
    quartier: "Centre-ville",
    region: "Taoud-Weogo",
    telephone: "+226 24 55 03 21",
    typeGarde: "24h",
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
    typeGarde: "jour",
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
  {
    id: "ph_ouahi_4",
    nom: "Pharmacie de l'Amitié",
    adresse: "Rue du Commerce",
    ville: "Ouahigouya",
    quartier: "Secteur 2",
    region: "Taoud-Weogo",
    telephone: "+226 24 55 88 99",
    typeGarde: "24h",
    latitude: 13.5880,
    longitude: -2.4180
  },
  {
    id: "ph_ouahi_5",
    nom: "Pharmacie Populaire Nord",
    adresse: "Avenue du Marché",
    ville: "Ouahigouya",
    quartier: "Secteur 4",
    region: "Taoud-Weogo",
    telephone: "+226 24 56 00 11",
    typeGarde: "jour",
    latitude: 13.5780,
    longitude: -2.4280
  },
  {
    id: "ph_gourcy_1",
    nom: "Pharmacie de Gourcy",
    adresse: "Route de Ouahigouya",
    ville: "Gourcy",
    quartier: "Centre",
    region: "Taoud-Weogo",
    telephone: "+226 24 56 22 33",
    typeGarde: "24h",
    latitude: 13.2000,
    longitude: -2.3667
  },
  {
    id: "ph_gourcy_2",
    nom: "Pharmacie du Zandoma",
    adresse: "Avenue Principale",
    ville: "Gourcy",
    quartier: "Secteur 1",
    region: "Taoud-Weogo",
    telephone: "+226 24 56 44 55",
    typeGarde: "jour",
    latitude: 13.2050,
    longitude: -2.3620
  },
  {
    id: "ph_titao_1",
    nom: "Pharmacie de Titao",
    adresse: "Route Nationale",
    ville: "Titao",
    quartier: "Centre",
    region: "Taoud-Weogo",
    telephone: "+226 24 57 11 22",
    typeGarde: "nuit",
    latitude: 13.7667,
    longitude: -2.0667
  },
  {
    id: "ph_seguenega_1",
    nom: "Pharmacie de Séguénéga",
    adresse: "Avenue du Village",
    ville: "Séguénéga",
    quartier: "Centre",
    region: "Taoud-Weogo",
    telephone: "+226 24 57 33 44",
    typeGarde: "jour",
    latitude: 13.4333,
    longitude: -1.9667
  },
  {
    id: "ph_thiou_1",
    nom: "Pharmacie de Thiou",
    adresse: "Route de Ouahigouya",
    ville: "Thiou",
    quartier: "Centre",
    region: "Taoud-Weogo",
    telephone: "+226 24 57 55 66",
    typeGarde: "jour",
    latitude: 13.8167,
    longitude: -2.4000
  },

  // =====================================================
  // REGION KOM-PANGALA (Tenkodogo) - 8 pharmacies
  // =====================================================
  {
    id: "10",
    nom: "Pharmacie Tenkodogo",
    adresse: "Avenue de la Nation",
    ville: "Tenkodogo",
    quartier: "Centre",
    region: "Kom-Pangala",
    telephone: "+226 40 71 02 89",
    typeGarde: "24h",
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
  {
    id: "ph_tenko_3",
    nom: "Pharmacie de l'Union",
    adresse: "Avenue du 11 Décembre",
    ville: "Tenkodogo",
    quartier: "Secteur 1",
    region: "Kom-Pangala",
    telephone: "+226 40 71 55 66",
    typeGarde: "nuit",
    latitude: 11.7780,
    longitude: -0.3750
  },
  {
    id: "ph_koupela_1",
    nom: "Pharmacie de Koupéla",
    adresse: "Route Nationale",
    ville: "Koupéla",
    quartier: "Centre",
    region: "Kom-Pangala",
    telephone: "+226 40 70 11 22",
    typeGarde: "24h",
    latitude: 12.1833,
    longitude: -0.3500
  },
  {
    id: "ph_koupela_2",
    nom: "Pharmacie du Kouritenga",
    adresse: "Avenue du Marché",
    ville: "Koupéla",
    quartier: "Secteur 1",
    region: "Kom-Pangala",
    telephone: "+226 40 70 33 44",
    typeGarde: "jour",
    latitude: 12.1870,
    longitude: -0.3450
  },
  {
    id: "ph_pouytenga_1",
    nom: "Pharmacie de Pouytenga",
    adresse: "Avenue Principale",
    ville: "Pouytenga",
    quartier: "Centre",
    region: "Kom-Pangala",
    telephone: "+226 40 70 55 66",
    typeGarde: "24h",
    latitude: 12.2500,
    longitude: -0.4167
  },
  {
    id: "ph_garango_1",
    nom: "Pharmacie de Garango",
    adresse: "Route de Tenkodogo",
    ville: "Garango",
    quartier: "Centre",
    region: "Kom-Pangala",
    telephone: "+226 40 71 77 88",
    typeGarde: "nuit",
    latitude: 11.8000,
    longitude: -0.5500
  },
  {
    id: "ph_ouargaye_1",
    nom: "Pharmacie de Ouargaye",
    adresse: "Avenue du Village",
    ville: "Ouargaye",
    quartier: "Centre",
    region: "Kom-Pangala",
    telephone: "+226 40 72 11 22",
    typeGarde: "jour",
    latitude: 11.5000,
    longitude: 0.0500
  },

  // =====================================================
  // REGION SAHEL (Dori, Djibo) - 10 pharmacies
  // =====================================================
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
    id: "ph_dori_3",
    nom: "Pharmacie du Séno",
    adresse: "Avenue de la Paix",
    ville: "Dori",
    quartier: "Secteur 2",
    region: "Sahel",
    telephone: "+226 24 46 44 55",
    typeGarde: "nuit",
    latitude: 14.0320,
    longitude: -0.0400
  },
  {
    id: "ph_gorom_1",
    nom: "Pharmacie Gorom-Gorom",
    adresse: "Avenue Centrale",
    ville: "Gorom-Gorom",
    quartier: "Centre",
    region: "Sahel",
    telephone: "+226 24 45 11 22",
    typeGarde: "24h",
    latitude: 14.4436,
    longitude: -0.2353
  },
  {
    id: "ph_gorom_2",
    nom: "Pharmacie de l'Oudalan Nord",
    adresse: "Route de Markoye",
    ville: "Gorom-Gorom",
    quartier: "Secteur 1",
    region: "Sahel",
    telephone: "+226 24 45 33 44",
    typeGarde: "jour",
    latitude: 14.4480,
    longitude: -0.2300
  },
  {
    id: "ph_djibo_1",
    nom: "Pharmacie de Djibo",
    adresse: "Avenue Principale",
    ville: "Djibo",
    quartier: "Centre",
    region: "Sahel",
    telephone: "+226 24 47 11 22",
    typeGarde: "24h",
    latitude: 14.1000,
    longitude: -1.6333
  },
  {
    id: "ph_djibo_2",
    nom: "Pharmacie du Soum",
    adresse: "Route de Ouagadougou",
    ville: "Djibo",
    quartier: "Secteur 1",
    region: "Sahel",
    telephone: "+226 24 47 33 44",
    typeGarde: "nuit",
    latitude: 14.1050,
    longitude: -1.6280
  },
  {
    id: "ph_sebba_1",
    nom: "Pharmacie de Sebba",
    adresse: "Avenue du Village",
    ville: "Sebba",
    quartier: "Centre",
    region: "Sahel",
    telephone: "+226 24 48 11 22",
    typeGarde: "jour",
    latitude: 13.4333,
    longitude: 0.5333
  },
  {
    id: "ph_aribinda_1",
    nom: "Pharmacie d'Aribinda",
    adresse: "Route Nationale",
    ville: "Aribinda",
    quartier: "Centre",
    region: "Sahel",
    telephone: "+226 24 48 33 44",
    typeGarde: "jour",
    latitude: 14.2167,
    longitude: -0.8667
  },
  {
    id: "ph_markoye_1",
    nom: "Pharmacie de Markoye",
    adresse: "Avenue Principale",
    ville: "Markoye",
    quartier: "Centre",
    region: "Sahel",
    telephone: "+226 24 48 55 66",
    typeGarde: "nuit",
    latitude: 14.6500,
    longitude: 0.0333
  },

  // =====================================================
  // REGION NAKAMBGA (Ziniaré) - 8 pharmacies
  // =====================================================
  {
    id: "ph_ziniare_1",
    nom: "Pharmacie de Ziniaré",
    adresse: "Route Nationale",
    ville: "Ziniaré",
    quartier: "Centre",
    region: "Nakambga",
    telephone: "+226 25 30 88 99",
    typeGarde: "24h",
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
    typeGarde: "jour",
    latitude: 12.5850,
    longitude: -1.2950
  },
  {
    id: "ph_ziniare_3",
    nom: "Pharmacie du Naaba Oubri",
    adresse: "Avenue de la Paix",
    ville: "Ziniaré",
    quartier: "Secteur 2",
    region: "Nakambga",
    telephone: "+226 25 30 66 77",
    typeGarde: "nuit",
    latitude: 12.5800,
    longitude: -1.3050
  },
  {
    id: "ph_zorgho_1",
    nom: "Pharmacie de Zorgho",
    adresse: "Route Nationale",
    ville: "Zorgho",
    quartier: "Centre",
    region: "Nakambga",
    telephone: "+226 24 50 11 22",
    typeGarde: "24h",
    latitude: 12.2500,
    longitude: -0.6167
  },
  {
    id: "ph_zorgho_2",
    nom: "Pharmacie du Ganzourgou",
    adresse: "Avenue du Marché",
    ville: "Zorgho",
    quartier: "Secteur 1",
    region: "Nakambga",
    telephone: "+226 24 50 33 44",
    typeGarde: "jour",
    latitude: 12.2550,
    longitude: -0.6120
  },
  {
    id: "ph_bousse_1",
    nom: "Pharmacie de Boussé",
    adresse: "Avenue Principale",
    ville: "Boussé",
    quartier: "Centre",
    region: "Nakambga",
    telephone: "+226 25 31 11 22",
    typeGarde: "nuit",
    latitude: 12.6667,
    longitude: -1.8833
  },
  {
    id: "ph_mogtedo_1",
    nom: "Pharmacie de Mogtédo",
    adresse: "Route de Ouagadougou",
    ville: "Mogtédo",
    quartier: "Centre",
    region: "Nakambga",
    telephone: "+226 24 51 11 22",
    typeGarde: "jour",
    latitude: 12.3167,
    longitude: -0.8333
  },
  {
    id: "ph_loumbila_1",
    nom: "Pharmacie de Loumbila",
    adresse: "Avenue du Lac",
    ville: "Loumbila",
    quartier: "Centre",
    region: "Nakambga",
    telephone: "+226 25 32 11 22",
    typeGarde: "jour",
    latitude: 12.5000,
    longitude: -1.4000
  },

  // =====================================================
  // REGION WÈTEMGA (Kaya, Boulsa) - 8 pharmacies
  // =====================================================
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
  {
    id: "ph_kaya_3",
    nom: "Pharmacie Naaba Koom",
    adresse: "Avenue de la Liberté",
    ville: "Kaya",
    quartier: "Secteur 1",
    region: "Wètemga",
    telephone: "+226 24 45 66 77",
    typeGarde: "nuit",
    latitude: 13.0880,
    longitude: -1.0900
  },
  {
    id: "ph_kaya_4",
    nom: "Pharmacie Populaire Kaya",
    adresse: "Rue du Marché",
    ville: "Kaya",
    quartier: "Secteur 3",
    region: "Wètemga",
    telephone: "+226 24 45 88 99",
    typeGarde: "24h",
    latitude: 13.0960,
    longitude: -1.0780
  },
  {
    id: "ph_boulsa_1",
    nom: "Pharmacie de Boulsa",
    adresse: "Avenue Principale",
    ville: "Boulsa",
    quartier: "Centre",
    region: "Wètemga",
    telephone: "+226 24 44 11 22",
    typeGarde: "24h",
    latitude: 12.6667,
    longitude: -0.5667
  },
  {
    id: "ph_boulsa_2",
    nom: "Pharmacie du Namentenga",
    adresse: "Route de Kaya",
    ville: "Boulsa",
    quartier: "Secteur 1",
    region: "Wètemga",
    telephone: "+226 24 44 33 44",
    typeGarde: "jour",
    latitude: 12.6700,
    longitude: -0.5620
  },
  {
    id: "ph_kongoussi_1",
    nom: "Pharmacie de Kongoussi",
    adresse: "Route Nationale",
    ville: "Kongoussi",
    quartier: "Centre",
    region: "Wètemga",
    telephone: "+226 24 43 11 22",
    typeGarde: "nuit",
    latitude: 13.3333,
    longitude: -1.5333
  },
  {
    id: "ph_tougouri_1",
    nom: "Pharmacie de Tougouri",
    adresse: "Avenue du Village",
    ville: "Tougouri",
    quartier: "Centre",
    region: "Wètemga",
    telephone: "+226 24 44 55 66",
    typeGarde: "jour",
    latitude: 13.3167,
    longitude: -0.5167
  },

  // =====================================================
  // REGION PASSORÉ (Yako) - 5 pharmacies
  // =====================================================
  {
    id: "ph_yako_1",
    nom: "Pharmacie de Yako",
    adresse: "Avenue Principale",
    ville: "Yako",
    quartier: "Centre",
    region: "Passoré",
    telephone: "+226 24 54 11 22",
    typeGarde: "24h",
    latitude: 12.9589,
    longitude: -2.2611
  },
  {
    id: "ph_yako_2",
    nom: "Pharmacie du Passoré",
    adresse: "Route de Ouahigouya",
    ville: "Yako",
    quartier: "Secteur 1",
    region: "Passoré",
    telephone: "+226 24 54 33 44",
    typeGarde: "jour",
    latitude: 12.9620,
    longitude: -2.2580
  },
  {
    id: "ph_yako_3",
    nom: "Pharmacie Populaire Yako",
    adresse: "Rue du Marché",
    ville: "Yako",
    quartier: "Secteur 2",
    region: "Passoré",
    telephone: "+226 24 54 55 66",
    typeGarde: "nuit",
    latitude: 12.9550,
    longitude: -2.2650
  },
  {
    id: "ph_gomponsom_1",
    nom: "Pharmacie de Gomponsom",
    adresse: "Route Nationale",
    ville: "Gomponsom",
    quartier: "Centre",
    region: "Passoré",
    telephone: "+226 24 54 77 88",
    typeGarde: "jour",
    latitude: 13.0500,
    longitude: -2.4333
  },
  {
    id: "ph_arbole_1",
    nom: "Pharmacie d'Arbollé",
    adresse: "Avenue du Village",
    ville: "Arbollé",
    quartier: "Centre",
    region: "Passoré",
    telephone: "+226 24 54 99 00",
    typeGarde: "jour",
    latitude: 13.1333,
    longitude: -2.3000
  },

  // =====================================================
  // REGION TONDEKA (Dédougou) - 8 pharmacies
  // =====================================================
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
  {
    id: "ph_dedou_3",
    nom: "Pharmacie Populaire Dédougou",
    adresse: "Rue du Marché",
    ville: "Dédougou",
    quartier: "Secteur 2",
    region: "Tondeka",
    telephone: "+226 20 52 55 66",
    typeGarde: "nuit",
    latitude: 12.4600,
    longitude: -3.4650
  },
  {
    id: "ph_dedou_4",
    nom: "Pharmacie de l'Amitié",
    adresse: "Avenue de la Paix",
    ville: "Dédougou",
    quartier: "Secteur 3",
    region: "Tondeka",
    telephone: "+226 20 52 77 88",
    typeGarde: "24h",
    latitude: 12.4680,
    longitude: -3.4550
  },
  {
    id: "ph_nouna_1",
    nom: "Pharmacie de Nouna",
    adresse: "Avenue Principale",
    ville: "Nouna",
    quartier: "Centre",
    region: "Tondeka",
    telephone: "+226 20 53 11 22",
    typeGarde: "24h",
    latitude: 12.7333,
    longitude: -3.8667
  },
  {
    id: "ph_nouna_2",
    nom: "Pharmacie du Kossi",
    adresse: "Route de Dédougou",
    ville: "Nouna",
    quartier: "Secteur 1",
    region: "Tondeka",
    telephone: "+226 20 53 33 44",
    typeGarde: "jour",
    latitude: 12.7370,
    longitude: -3.8620
  },
  {
    id: "ph_solenzo_1",
    nom: "Pharmacie de Solenzo",
    adresse: "Route Nationale",
    ville: "Solenzo",
    quartier: "Centre",
    region: "Tondeka",
    telephone: "+226 20 54 11 22",
    typeGarde: "nuit",
    latitude: 12.1833,
    longitude: -4.0833
  },
  {
    id: "ph_boromo_1",
    nom: "Pharmacie de Boromo",
    adresse: "Avenue Principale",
    ville: "Boromo",
    quartier: "Centre",
    region: "Tondeka",
    telephone: "+226 20 55 11 22",
    typeGarde: "24h",
    latitude: 11.7500,
    longitude: -2.9333
  },

  // =====================================================
  // REGION TAAR-SOOMBA (Tougan) - 5 pharmacies
  // =====================================================
  {
    id: "ph_tougan_1",
    nom: "Pharmacie de Tougan",
    adresse: "Avenue Centrale",
    ville: "Tougan",
    quartier: "Centre",
    region: "Taar-Soomba",
    telephone: "+226 24 53 11 22",
    typeGarde: "24h",
    latitude: 13.0667,
    longitude: -3.0667
  },
  {
    id: "ph_tougan_2",
    nom: "Pharmacie du Sourou",
    adresse: "Route de Dédougou",
    ville: "Tougan",
    quartier: "Secteur 1",
    region: "Taar-Soomba",
    telephone: "+226 24 53 33 44",
    typeGarde: "jour",
    latitude: 13.0700,
    longitude: -3.0620
  },
  {
    id: "ph_tougan_3",
    nom: "Pharmacie Populaire Tougan",
    adresse: "Rue du Marché",
    ville: "Tougan",
    quartier: "Secteur 2",
    region: "Taar-Soomba",
    telephone: "+226 24 53 55 66",
    typeGarde: "nuit",
    latitude: 13.0630,
    longitude: -3.0700
  },
  {
    id: "ph_di_1",
    nom: "Pharmacie de Di",
    adresse: "Route Nationale",
    ville: "Di",
    quartier: "Centre",
    region: "Taar-Soomba",
    telephone: "+226 24 53 77 88",
    typeGarde: "jour",
    latitude: 13.2167,
    longitude: -3.3500
  },
  {
    id: "ph_kassoum_1",
    nom: "Pharmacie de Kassoum",
    adresse: "Avenue du Village",
    ville: "Kassoum",
    quartier: "Centre",
    region: "Taar-Soomba",
    telephone: "+226 24 53 99 00",
    typeGarde: "jour",
    latitude: 13.0000,
    longitude: -3.5000
  },

  // =====================================================
  // REGION BANKUI (Orodara) - 5 pharmacies
  // =====================================================
  {
    id: "ph_orodara_1",
    nom: "Pharmacie d'Orodara",
    adresse: "Route de Bobo",
    ville: "Orodara",
    quartier: "Centre",
    region: "Bankui",
    telephone: "+226 20 95 11 22",
    typeGarde: "24h",
    latitude: 10.9833,
    longitude: -4.9167
  },
  {
    id: "ph_orodara_3",
    nom: "Pharmacie du Kénédougou",
    adresse: "Avenue du Marché",
    ville: "Orodara",
    quartier: "Secteur 1",
    region: "Bankui",
    telephone: "+226 20 95 33 44",
    typeGarde: "jour",
    latitude: 10.9870,
    longitude: -4.9120
  },
  {
    id: "ph_koloko_1",
    nom: "Pharmacie de Koloko",
    adresse: "Route de Mali",
    ville: "Koloko",
    quartier: "Centre",
    region: "Bankui",
    telephone: "+226 20 95 55 66",
    typeGarde: "nuit",
    latitude: 11.0833,
    longitude: -5.3333
  },
  {
    id: "ph_ndorola_1",
    nom: "Pharmacie de N'Dorola",
    adresse: "Avenue Principale",
    ville: "N'Dorola",
    quartier: "Centre",
    region: "Bankui",
    telephone: "+226 20 95 77 88",
    typeGarde: "jour",
    latitude: 11.0667,
    longitude: -4.8333
  },
  {
    id: "ph_samorogouan_1",
    nom: "Pharmacie de Samorogouan",
    adresse: "Route de Bobo",
    ville: "Samorogouan",
    quartier: "Centre",
    region: "Bankui",
    telephone: "+226 20 95 99 00",
    typeGarde: "jour",
    latitude: 11.2167,
    longitude: -4.9500
  },

  // =====================================================
  // REGION YIRKA-GAONGO (Manga) - 5 pharmacies
  // =====================================================
  {
    id: "ph_manga_1",
    nom: "Pharmacie de Manga",
    adresse: "Avenue Principale",
    ville: "Manga",
    quartier: "Centre",
    region: "Yirka-Gaongo",
    telephone: "+226 25 70 11 22",
    typeGarde: "24h",
    latitude: 11.6667,
    longitude: -1.0667
  },
  {
    id: "ph_manga_2",
    nom: "Pharmacie du Zoundwéogo",
    adresse: "Route de Ouagadougou",
    ville: "Manga",
    quartier: "Secteur 1",
    region: "Yirka-Gaongo",
    telephone: "+226 25 70 33 44",
    typeGarde: "jour",
    latitude: 11.6700,
    longitude: -1.0620
  },
  {
    id: "ph_po_1",
    nom: "Pharmacie de Pô",
    adresse: "Avenue Principale",
    ville: "Pô",
    quartier: "Centre",
    region: "Yirka-Gaongo",
    telephone: "+226 25 71 11 22",
    typeGarde: "24h",
    latitude: 11.1667,
    longitude: -1.1500
  },
  {
    id: "ph_kombissiri_1",
    nom: "Pharmacie de Kombissiri",
    adresse: "Route Nationale",
    ville: "Kombissiri",
    quartier: "Centre",
    region: "Yirka-Gaongo",
    telephone: "+226 25 72 11 22",
    typeGarde: "nuit",
    latitude: 12.0667,
    longitude: -1.3333
  },
  {
    id: "ph_tiebele_1",
    nom: "Pharmacie de Tiébélé",
    adresse: "Avenue du Village",
    ville: "Tiébélé",
    quartier: "Centre",
    region: "Yirka-Gaongo",
    telephone: "+226 25 71 33 44",
    typeGarde: "jour",
    latitude: 11.1000,
    longitude: -1.0333
  },

  // =====================================================
  // REGION DJÔRÔ (Diébougou) - 5 pharmacies
  // =====================================================
  {
    id: "ph_djoro_dieb_1",
    nom: "Pharmacie Centrale Diébougou",
    adresse: "Avenue de l'Indépendance",
    ville: "Diébougou",
    quartier: "Centre",
    region: "Djôrô",
    telephone: "+226 20 90 21 32",
    typeGarde: "24h",
    latitude: 10.9700,
    longitude: -3.2480
  },
  {
    id: "ph_batie_1",
    nom: "Pharmacie de Batié",
    adresse: "Route Nationale",
    ville: "Batié",
    quartier: "Centre",
    region: "Djôrô",
    telephone: "+226 20 90 43 54",
    typeGarde: "jour",
    latitude: 9.8833,
    longitude: -2.9167
  },
  {
    id: "ph_batie_2",
    nom: "Pharmacie du Noumbiel",
    adresse: "Avenue du Village",
    ville: "Batié",
    quartier: "Secteur 1",
    region: "Djôrô",
    telephone: "+226 20 90 65 76",
    typeGarde: "nuit",
    latitude: 9.8870,
    longitude: -2.9120
  },
  {
    id: "ph_dissin_1",
    nom: "Pharmacie de Dissin",
    adresse: "Route de Dano",
    ville: "Dissin",
    quartier: "Centre",
    region: "Djôrô",
    telephone: "+226 20 90 87 98",
    typeGarde: "jour",
    latitude: 11.1000,
    longitude: -2.9500
  },
  {
    id: "ph_nako_1",
    nom: "Pharmacie de Nako",
    adresse: "Avenue Principale",
    ville: "Nako",
    quartier: "Centre",
    region: "Djôrô",
    telephone: "+226 20 91 09 20",
    typeGarde: "jour",
    latitude: 10.0667,
    longitude: -3.3000
  },

  // =====================================================
  // REGION YONYOOSÉ (Bogandé) - 5 pharmacies
  // =====================================================
  {
    id: "ph_bogande_1",
    nom: "Pharmacie de Bogandé",
    adresse: "Avenue Principale",
    ville: "Bogandé",
    quartier: "Centre",
    region: "Yonyoosé",
    telephone: "+226 24 78 11 22",
    typeGarde: "24h",
    latitude: 12.9833,
    longitude: 0.1333
  },
  {
    id: "ph_bogande_2",
    nom: "Pharmacie de la Gnagna",
    adresse: "Route de Fada",
    ville: "Bogandé",
    quartier: "Secteur 1",
    region: "Yonyoosé",
    telephone: "+226 24 78 33 44",
    typeGarde: "jour",
    latitude: 12.9870,
    longitude: 0.1380
  },
  {
    id: "ph_manni_1",
    nom: "Pharmacie de Manni",
    adresse: "Avenue du Village",
    ville: "Manni",
    quartier: "Centre",
    region: "Yonyoosé",
    telephone: "+226 24 78 55 66",
    typeGarde: "nuit",
    latitude: 13.0667,
    longitude: 0.0667
  },
  {
    id: "ph_piela_1",
    nom: "Pharmacie de Piéla",
    adresse: "Route Nationale",
    ville: "Piéla",
    quartier: "Centre",
    region: "Yonyoosé",
    telephone: "+226 24 78 77 88",
    typeGarde: "jour",
    latitude: 12.8000,
    longitude: 0.1167
  },
  {
    id: "ph_gayeri_1",
    nom: "Pharmacie de Gayéri",
    adresse: "Avenue Principale",
    ville: "Gayéri",
    quartier: "Centre",
    region: "Yonyoosé",
    telephone: "+226 24 79 11 22",
    typeGarde: "24h",
    latitude: 12.6167,
    longitude: 0.4833
  }
];

const REGIONS = [
  "Bankui", "Djôrô", "Goulmou", "Guiriko", "Kadiogo", "Koom-Kuuli",
  "Kom-Pangala", "Nakambga", "Passoré", "Poni-Tiari", "Sahel",
  "Taar-Soomba", "Taoud-Weogo", "Tondeka", "Wètemga", "Yirka-Gaongo", "Yonyoosé"
];

export default function Pharmacies() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRegion, setSelectedRegion] = useState<string>("all");
  const [selectedVilleGarde, setSelectedVilleGarde] = useState<"all" | "Ouagadougou" | "Bobo-Dioulasso">("all");
  const [, setLocation] = useLocation();
  const [pharmacies, setPharmacies] = useState<Pharmacie[]>(PHARMACIES_DATA);
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const { toast } = useToast();
  const lastFetchRef = useRef<number>(0);

  const { data: pharmaciesDeGarde, isLoading: isLoadingGarde } = useQuery<PharmaciesDeGardeResponse>({
    queryKey: ["/api/pharmacies-de-garde"],
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: true,
  });

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
    const pharmaciesArray = Array.isArray(pharmacies) ? pharmacies : [];
    let filtered = pharmaciesArray;

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
            <Shield className="w-8 h-8 text-primary" />
            Pharmacies de Garde
          </h1>
          <p className="text-muted-foreground">
            Liste des pharmacies de garde au Burkina Faso
          </p>
        </div>

        {/* Section Pharmacies de Garde - Données officielles Orange BF */}
        <Card className="mb-6 border-2 border-primary/30 bg-primary/5">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <AlertCircle className="w-5 h-5 text-green-600" />
                  Pharmacies Ouvertes Maintenant
                </CardTitle>
                <CardDescription className="mt-1">
                  {pharmaciesDeGarde?.date ? (
                    <>Semaine du {new Date(pharmaciesDeGarde.date).toLocaleDateString('fr-FR', { 
                      day: 'numeric', 
                      month: 'long', 
                      year: 'numeric' 
                    })}</>
                  ) : (
                    "Chargement..."
                  )}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="gap-1">
                  <Calendar className="w-3 h-3" />
                  Source: Orange BF
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoadingGarde ? (
              <div className="animate-pulse space-y-2">
                <div className="h-8 bg-muted rounded w-1/3"></div>
                <div className="h-4 bg-muted rounded w-1/2"></div>
              </div>
            ) : pharmaciesDeGarde ? (
              <>
                {/* Filtres par ville */}
                <div className="flex gap-2 mb-4 flex-wrap">
                  <Button
                    variant={selectedVilleGarde === "all" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedVilleGarde("all")}
                    data-testid="button-filter-all"
                  >
                    Toutes ({pharmaciesDeGarde.total})
                  </Button>
                  <Button
                    variant={selectedVilleGarde === "Ouagadougou" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedVilleGarde("Ouagadougou")}
                    data-testid="button-filter-ouaga"
                  >
                    Ouagadougou (Groupe {pharmaciesDeGarde.groupeOuagadougou})
                  </Button>
                  <Button
                    variant={selectedVilleGarde === "Bobo-Dioulasso" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedVilleGarde("Bobo-Dioulasso")}
                    data-testid="button-filter-bobo"
                  >
                    Bobo-Dioulasso (Groupe {pharmaciesDeGarde.groupeBobo})
                  </Button>
                </div>

                {/* Liste des pharmacies de garde */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-80 overflow-y-auto">
                  {pharmaciesDeGarde.pharmacies
                    .filter(p => selectedVilleGarde === "all" || p.ville === selectedVilleGarde)
                    .map((pharmacie, index) => (
                      <div 
                        key={`garde-${pharmacie.ville}-${index}`}
                        className="bg-background rounded-lg p-3 border hover-elevate"
                        data-testid={`card-pharmacie-garde-${index}`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{pharmacie.nom}</p>
                            <p className="text-xs text-muted-foreground">{pharmacie.ville}</p>
                          </div>
                          <Badge variant="secondary" className="text-xs shrink-0">
                            G{pharmacie.groupe}
                          </Badge>
                        </div>
                        <div className="mt-2">
                          <a 
                            href={`tel:${pharmacie.telephone}`}
                            className="inline-flex items-center gap-1 text-primary text-sm font-medium"
                            data-testid={`link-call-pharmacie-${index}`}
                          >
                            <Phone className="w-3 h-3" />
                            {pharmacie.telephone}
                          </a>
                        </div>
                      </div>
                    ))}
                </div>

                {/* Info source */}
                <div className="mt-4 pt-3 border-t flex items-center justify-between gap-2 text-xs text-muted-foreground flex-wrap">
                  <span>{pharmaciesDeGarde.info.description}</span>
                  <a 
                    href="https://www.orange.bf" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-primary"
                  >
                    <ExternalLink className="w-3 h-3" />
                    orange.bf
                  </a>
                </div>
              </>
            ) : (
              <p className="text-muted-foreground">Impossible de charger les pharmacies de garde</p>
            )}
          </CardContent>
        </Card>

        {/* Divider */}
        <div className="my-6 flex items-center gap-4">
          <div className="flex-1 h-px bg-border"></div>
          <span className="text-sm text-muted-foreground">Toutes les pharmacies par region</span>
          <div className="flex-1 h-px bg-border"></div>
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
                  className="pl-10 pr-10"
                  data-testid="input-search-pharmacies"
                />
                <VoiceSearchButton
                  onResult={setSearchQuery}
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
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
            {Array.isArray(filteredPharmacies) && filteredPharmacies.map((pharmacie) => (
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
