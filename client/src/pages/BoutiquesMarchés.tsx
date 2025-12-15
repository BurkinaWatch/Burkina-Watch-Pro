import { useState, useMemo } from "react";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import EmergencyPanel from "@/components/EmergencyPanel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, MapPin, Phone, Clock, Navigation, ArrowLeft, RefreshCw, Store, ShoppingBag } from "lucide-react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

interface Boutique {
  id: string;
  nom: string;
  adresse: string;
  ville: string;
  quartier: string;
  region: string;
  telephone: string;
  categorie: "marche" | "supermarche" | "vetements" | "electronique" | "artisanat" | "alimentation" | "divers";
  horaires: string;
  latitude?: number;
  longitude?: number;
}

const BOUTIQUES_DATA: Boutique[] = [
  // MARCHÉS OUAGADOUGOU (12)
  { id: "march_1", nom: "Grand Marché Rood Woko", adresse: "Avenue de la Liberté", ville: "Ouagadougou", quartier: "Centre-ville", region: "Kadiogo", telephone: "+226 25 30 00 00", categorie: "marche", horaires: "6h-18h", latitude: 12.3710, longitude: -1.5190 },
  { id: "march_2", nom: "Marché de Sankariaré", adresse: "Rue de Sankariaré", ville: "Ouagadougou", quartier: "Sankariaré", region: "Kadiogo", telephone: "+226 70 00 00 01", categorie: "marche", horaires: "6h-18h", latitude: 12.3750, longitude: -1.5100 },
  { id: "march_3", nom: "Marché de Gounghin", adresse: "Avenue de Gounghin", ville: "Ouagadougou", quartier: "Gounghin", region: "Kadiogo", telephone: "+226 70 00 00 02", categorie: "marche", horaires: "6h-18h", latitude: 12.3680, longitude: -1.5260 },
  { id: "march_4", nom: "Marché de Tampouy", adresse: "Boulevard Bassawarga", ville: "Ouagadougou", quartier: "Tampouy", region: "Kadiogo", telephone: "+226 70 11 22 33", categorie: "marche", horaires: "6h-18h", latitude: 12.4200, longitude: -1.5200 },
  { id: "march_5", nom: "Marché de Pissy", adresse: "Route de Bobo", ville: "Ouagadougou", quartier: "Pissy", region: "Kadiogo", telephone: "+226 70 22 33 44", categorie: "marche", horaires: "6h-18h", latitude: 12.3450, longitude: -1.5400 },
  { id: "march_6", nom: "Marché de Tanghin", adresse: "Avenue Babanguida", ville: "Ouagadougou", quartier: "Tanghin", region: "Kadiogo", telephone: "+226 70 33 44 55", categorie: "marche", horaires: "6h-18h", latitude: 12.4100, longitude: -1.5100 },
  { id: "march_7", nom: "Marché de Karpala", adresse: "Rue Oumarou Kanazoé", ville: "Ouagadougou", quartier: "Karpala", region: "Kadiogo", telephone: "+226 70 44 55 66", categorie: "marche", horaires: "6h-18h", latitude: 12.3580, longitude: -1.4780 },
  { id: "march_8", nom: "Marché de Wemtenga", adresse: "Avenue Yennenga", ville: "Ouagadougou", quartier: "Wemtenga", region: "Kadiogo", telephone: "+226 70 55 66 77", categorie: "marche", horaires: "6h-18h", latitude: 12.3800, longitude: -1.5100 },
  { id: "march_9", nom: "Marché de Dapoya", adresse: "Rue du Commerce", ville: "Ouagadougou", quartier: "Dapoya", region: "Kadiogo", telephone: "+226 70 66 77 88", categorie: "marche", horaires: "6h-18h", latitude: 12.3900, longitude: -1.4900 },
  { id: "march_10", nom: "Marché de Patte d'Oie", adresse: "Avenue de l'Indépendance", ville: "Ouagadougou", quartier: "Patte d'Oie", region: "Kadiogo", telephone: "+226 70 77 88 99", categorie: "marche", horaires: "6h-18h", latitude: 12.3550, longitude: -1.5050 },
  { id: "march_11", nom: "Marché de Somgandé", adresse: "Avenue Pascal Zagré", ville: "Ouagadougou", quartier: "Somgandé", region: "Kadiogo", telephone: "+226 70 88 99 00", categorie: "marche", horaires: "6h-18h", latitude: 12.3950, longitude: -1.5300 },
  { id: "march_12", nom: "Marché de Cissin", adresse: "Route de Kaya", ville: "Ouagadougou", quartier: "Cissin", region: "Kadiogo", telephone: "+226 70 99 00 11", categorie: "marche", horaires: "6h-18h", latitude: 12.4000, longitude: -1.5000 },
  
  // MARCHÉS BOBO-DIOULASSO (5)
  { id: "march_13", nom: "Grand Marché de Bobo", adresse: "Avenue de la Révolution", ville: "Bobo-Dioulasso", quartier: "Centre-ville", region: "Guiriko", telephone: "+226 20 97 00 00", categorie: "marche", horaires: "6h-18h", latitude: 11.1800, longitude: -4.2920 },
  { id: "march_14", nom: "Marché de Lafiabougou", adresse: "Rue de Sikasso", ville: "Bobo-Dioulasso", quartier: "Lafiabougou", region: "Guiriko", telephone: "+226 20 97 11 22", categorie: "marche", horaires: "6h-18h", latitude: 11.1900, longitude: -4.2980 },
  { id: "march_15", nom: "Marché de Koko", adresse: "Avenue Ouezzin Coulibaly", ville: "Bobo-Dioulasso", quartier: "Koko", region: "Guiriko", telephone: "+226 20 97 22 33", categorie: "marche", horaires: "6h-18h", latitude: 11.1850, longitude: -4.3000 },
  { id: "march_16", nom: "Marché de Sarfalao", adresse: "Rue de l'Artisanat", ville: "Bobo-Dioulasso", quartier: "Sarfalao", region: "Guiriko", telephone: "+226 20 97 33 44", categorie: "marche", horaires: "6h-18h", latitude: 11.1700, longitude: -4.2830 },
  { id: "march_17", nom: "Marché de Tounouma", adresse: "Boulevard de la Liberté", ville: "Bobo-Dioulasso", quartier: "Tounouma", region: "Guiriko", telephone: "+226 20 97 44 55", categorie: "marche", horaires: "6h-18h", latitude: 11.1720, longitude: -4.2850 },
  
  // MARCHÉS AUTRES VILLES (10)
  { id: "march_18", nom: "Marché de Banfora", adresse: "Avenue Principale", ville: "Banfora", quartier: "Centre", region: "Comoé", telephone: "+226 20 91 00 00", categorie: "marche", horaires: "6h-17h", latitude: 10.6334, longitude: -4.7619 },
  { id: "march_19", nom: "Marché de Koudougou", adresse: "Rue de l'Indépendance", ville: "Koudougou", quartier: "Centre", region: "Boulkiemdé", telephone: "+226 25 44 00 00", categorie: "marche", horaires: "6h-18h", latitude: 12.2525, longitude: -2.3622 },
  { id: "march_20", nom: "Marché de Ouahigouya", adresse: "Route de Djibo", ville: "Ouahigouya", quartier: "Centre", region: "Yatenga", telephone: "+226 24 55 00 00", categorie: "marche", horaires: "6h-18h", latitude: 13.5828, longitude: -2.4214 },
  { id: "march_21", nom: "Marché de Fada N'Gourma", adresse: "Avenue Nationale", ville: "Fada N'Gourma", quartier: "Centre", region: "Gourma", telephone: "+226 24 77 00 00", categorie: "marche", horaires: "6h-17h", latitude: 12.0614, longitude: 0.3581 },
  { id: "march_22", nom: "Marché de Tenkodogo", adresse: "Avenue de la Nation", ville: "Tenkodogo", quartier: "Centre", region: "Boulgou", telephone: "+226 40 71 00 00", categorie: "marche", horaires: "6h-17h", latitude: 11.7800, longitude: -0.3700 },
  { id: "march_23", nom: "Marché de Kaya", adresse: "Avenue Principale", ville: "Kaya", quartier: "Centre", region: "Sanmatenga", telephone: "+226 24 45 00 00", categorie: "marche", horaires: "6h-18h", latitude: 13.0900, longitude: -1.0800 },
  { id: "march_24", nom: "Marché de Dori", adresse: "Avenue Principale", ville: "Dori", quartier: "Centre", region: "Séno", telephone: "+226 24 46 00 00", categorie: "marche", horaires: "6h-17h", latitude: 14.0353, longitude: -0.0345 },
  { id: "march_25", nom: "Marché de Ziniaré", adresse: "Route Nationale", ville: "Ziniaré", quartier: "Centre", region: "Oubritenga", telephone: "+226 25 30 88 00", categorie: "marche", horaires: "6h-18h", latitude: 12.5833, longitude: -1.3000 },
  { id: "march_26", nom: "Marché de Dédougou", adresse: "Avenue Principale", ville: "Dédougou", quartier: "Centre", region: "Mouhoun", telephone: "+226 20 52 00 00", categorie: "marche", horaires: "6h-18h", latitude: 12.4633, longitude: -3.4600 },
  { id: "march_27", nom: "Marché de Gaoua", adresse: "Avenue de l'Indépendance", ville: "Gaoua", quartier: "Centre", region: "Poni", telephone: "+226 20 87 00 00", categorie: "marche", horaires: "6h-17h", latitude: 10.3250, longitude: -3.1750 },
  
  // SUPERMARCHÉS OUAGADOUGOU (10)
  { id: "super_1", nom: "Marina Market", adresse: "Avenue Kwame N'Krumah", ville: "Ouagadougou", quartier: "Centre-ville", region: "Kadiogo", telephone: "+226 25 31 55 66", categorie: "supermarche", horaires: "8h-21h", latitude: 12.3714, longitude: -1.5197 },
  { id: "super_2", nom: "Orca Supermarché", adresse: "Boulevard Thomas Sankara", ville: "Ouagadougou", quartier: "Ouaga 2000", region: "Kadiogo", telephone: "+226 25 37 22 33", categorie: "supermarche", horaires: "8h-22h", latitude: 12.3300, longitude: -1.4800 },
  { id: "super_3", nom: "Casino Supermarché", adresse: "Avenue de l'UEMOA", ville: "Ouagadougou", quartier: "Zone du Bois", region: "Kadiogo", telephone: "+226 25 36 44 55", categorie: "supermarche", horaires: "8h-21h", latitude: 12.3850, longitude: -1.4950 },
  { id: "super_4", nom: "Yaar Supermarché", adresse: "Boulevard Charles de Gaulle", ville: "Ouagadougou", quartier: "Paspanga", region: "Kadiogo", telephone: "+226 25 30 66 77", categorie: "supermarche", horaires: "8h-21h", latitude: 12.3745, longitude: -1.5180 },
  { id: "super_5", nom: "Le Champion", adresse: "Avenue Pascal Zagré", ville: "Ouagadougou", quartier: "Cissin", region: "Kadiogo", telephone: "+226 25 38 88 99", categorie: "supermarche", horaires: "8h-21h", latitude: 12.3480, longitude: -1.5100 },
  { id: "super_6", nom: "Soprim Supermarché", adresse: "Boulevard Bassawarga", ville: "Ouagadougou", quartier: "Tampouy", region: "Kadiogo", telephone: "+226 25 41 99 00", categorie: "supermarche", horaires: "8h-21h", latitude: 12.4200, longitude: -1.5200 },
  { id: "super_7", nom: "Super Marché du Bonheur", adresse: "Avenue de la Résistance", ville: "Ouagadougou", quartier: "Zone du Bois", region: "Kadiogo", telephone: "+226 25 36 00 11", categorie: "supermarche", horaires: "8h-20h", latitude: 12.3750, longitude: -1.5100 },
  { id: "super_8", nom: "Alimentation Générale", adresse: "Rue de la Chance", ville: "Ouagadougou", quartier: "Koulouba", region: "Kadiogo", telephone: "+226 25 33 11 22", categorie: "supermarche", horaires: "7h-20h", latitude: 12.3800, longitude: -1.5050 },
  { id: "super_9", nom: "Express Market", adresse: "Avenue de l'Indépendance", ville: "Ouagadougou", quartier: "Patte d'Oie", region: "Kadiogo", telephone: "+226 25 38 22 33", categorie: "supermarche", horaires: "7h-22h", latitude: 12.3550, longitude: -1.5050 },
  { id: "super_10", nom: "Maxi Marché", adresse: "Route de Ouaga 2000", ville: "Ouagadougou", quartier: "Ouaga 2000", region: "Kadiogo", telephone: "+226 25 37 33 44", categorie: "supermarche", horaires: "8h-22h", latitude: 12.3300, longitude: -1.4800 },
  
  // SUPERMARCHÉS AUTRES VILLES (5)
  { id: "super_11", nom: "Eden Supermarché", adresse: "Boulevard Mouammar Kadhafi", ville: "Bobo-Dioulasso", quartier: "Accart Ville", region: "Guiriko", telephone: "+226 20 97 55 66", categorie: "supermarche", horaires: "8h-21h", latitude: 11.1771, longitude: -4.2897 },
  { id: "super_12", nom: "Supermarché du Houet", adresse: "Avenue de la Révolution", ville: "Bobo-Dioulasso", quartier: "Centre-ville", region: "Guiriko", telephone: "+226 20 97 66 77", categorie: "supermarche", horaires: "8h-20h", latitude: 11.1800, longitude: -4.2920 },
  { id: "super_13", nom: "Supermarché Cascades", adresse: "Avenue de la Révolution", ville: "Banfora", quartier: "Centre", region: "Comoé", telephone: "+226 20 91 55 66", categorie: "supermarche", horaires: "8h-20h", latitude: 10.6334, longitude: -4.7619 },
  { id: "super_14", nom: "Supermarché Central", adresse: "Avenue de la Nation", ville: "Koudougou", quartier: "Centre", region: "Boulkiemdé", telephone: "+226 25 44 55 66", categorie: "supermarche", horaires: "8h-20h", latitude: 12.2500, longitude: -2.3650 },
  { id: "super_15", nom: "Supermarché du Nord", adresse: "Avenue de la Liberté", ville: "Ouahigouya", quartier: "Centre", region: "Yatenga", telephone: "+226 24 55 55 66", categorie: "supermarche", horaires: "8h-20h", latitude: 13.5850, longitude: -2.4200 },
  
  // ARTISANAT (8)
  { id: "art_1", nom: "Village Artisanal de Ouaga", adresse: "Route de Kaya", ville: "Ouagadougou", quartier: "Cissin", region: "Kadiogo", telephone: "+226 25 36 11 22", categorie: "artisanat", horaires: "8h-18h", latitude: 12.4000, longitude: -1.5000 },
  { id: "art_2", nom: "Centre National de l'Artisanat", adresse: "Avenue de la Chance", ville: "Ouagadougou", quartier: "Koulouba", region: "Kadiogo", telephone: "+226 25 33 88 99", categorie: "artisanat", horaires: "8h-17h", latitude: 12.3800, longitude: -1.5050 },
  { id: "art_3", nom: "Marché de l'Artisanat de Bobo", adresse: "Rue de l'Artisanat", ville: "Bobo-Dioulasso", quartier: "Koko", region: "Guiriko", telephone: "+226 20 99 33 44", categorie: "artisanat", horaires: "8h-18h", latitude: 11.1850, longitude: -4.3000 },
  { id: "art_4", nom: "Galerie Artisanale", adresse: "Avenue Kwame N'Krumah", ville: "Ouagadougou", quartier: "Centre-ville", region: "Kadiogo", telephone: "+226 25 31 99 00", categorie: "artisanat", horaires: "9h-19h", latitude: 12.3714, longitude: -1.5197 },
  { id: "art_5", nom: "Atelier Bronze Ouaga", adresse: "Boulevard de la Révolution", ville: "Ouagadougou", quartier: "1200 Logements", region: "Kadiogo", telephone: "+226 70 11 22 33", categorie: "artisanat", horaires: "8h-17h", latitude: 12.3520, longitude: -1.5320 },
  { id: "art_6", nom: "Artisanat Lobi", adresse: "Avenue de l'Indépendance", ville: "Gaoua", quartier: "Centre", region: "Poni", telephone: "+226 20 87 33 44", categorie: "artisanat", horaires: "8h-17h", latitude: 10.3250, longitude: -3.1750 },
  { id: "art_7", nom: "Poterie de Banfora", adresse: "Route de Sindou", ville: "Banfora", quartier: "Secteur 2", region: "Comoé", telephone: "+226 20 91 44 55", categorie: "artisanat", horaires: "8h-17h", latitude: 10.6300, longitude: -4.7650 },
  { id: "art_8", nom: "Tissage Traditionnel", adresse: "Rue du Marché", ville: "Koudougou", quartier: "Centre", region: "Boulkiemdé", telephone: "+226 25 44 66 77", categorie: "artisanat", horaires: "8h-18h", latitude: 12.2525, longitude: -2.3622 },
  
  // VÊTEMENTS (8)
  { id: "vet_1", nom: "Faso Fani", adresse: "Avenue Kwame N'Krumah", ville: "Ouagadougou", quartier: "Centre-ville", region: "Kadiogo", telephone: "+226 25 31 77 88", categorie: "vetements", horaires: "9h-19h", latitude: 12.3720, longitude: -1.5180 },
  { id: "vet_2", nom: "Boutique Africaine", adresse: "Rue du Commerce", ville: "Ouagadougou", quartier: "Dapoya", region: "Kadiogo", telephone: "+226 70 55 66 77", categorie: "vetements", horaires: "9h-19h", latitude: 12.3900, longitude: -1.4900 },
  { id: "vet_3", nom: "Mode Express", adresse: "Boulevard de la Révolution", ville: "Bobo-Dioulasso", quartier: "Belle Ville", region: "Guiriko", telephone: "+226 20 98 77 88", categorie: "vetements", horaires: "9h-19h", latitude: 11.1750, longitude: -4.2880 },
  { id: "vet_4", nom: "Élégance Mode", adresse: "Avenue de l'UEMOA", ville: "Ouagadougou", quartier: "Zone du Bois", region: "Kadiogo", telephone: "+226 25 36 88 99", categorie: "vetements", horaires: "9h-19h", latitude: 12.3850, longitude: -1.4950 },
  { id: "vet_5", nom: "Bazin Royal", adresse: "Boulevard Charles de Gaulle", ville: "Ouagadougou", quartier: "Paspanga", region: "Kadiogo", telephone: "+226 25 30 99 00", categorie: "vetements", horaires: "9h-19h", latitude: 12.3745, longitude: -1.5180 },
  { id: "vet_6", nom: "Style Africain", adresse: "Avenue de la Nation", ville: "Bobo-Dioulasso", quartier: "Hamdalaye", region: "Guiriko", telephone: "+226 20 97 00 11", categorie: "vetements", horaires: "9h-19h", latitude: 11.1830, longitude: -4.3050 },
  { id: "vet_7", nom: "Couture Moderne", adresse: "Rue de l'Indépendance", ville: "Koudougou", quartier: "Centre", region: "Boulkiemdé", telephone: "+226 25 44 11 22", categorie: "vetements", horaires: "9h-18h", latitude: 12.2525, longitude: -2.3622 },
  { id: "vet_8", nom: "Fashion House", adresse: "Route de Ouaga 2000", ville: "Ouagadougou", quartier: "Ouaga 2000", region: "Kadiogo", telephone: "+226 25 37 11 22", categorie: "vetements", horaires: "10h-20h", latitude: 12.3300, longitude: -1.4800 },
  
  // ÉLECTRONIQUE (7)
  { id: "elec_1", nom: "Techno Center", adresse: "Avenue de l'UEMOA", ville: "Ouagadougou", quartier: "Zone du Bois", region: "Kadiogo", telephone: "+226 25 36 99 00", categorie: "electronique", horaires: "9h-19h", latitude: 12.3850, longitude: -1.4950 },
  { id: "elec_2", nom: "Digital Store", adresse: "Boulevard Charles de Gaulle", ville: "Ouagadougou", quartier: "Paspanga", region: "Kadiogo", telephone: "+226 25 30 11 22", categorie: "electronique", horaires: "9h-19h", latitude: 12.3745, longitude: -1.5180 },
  { id: "elec_3", nom: "Mobile World", adresse: "Avenue Ouezzin Coulibaly", ville: "Bobo-Dioulasso", quartier: "Sarfalao", region: "Guiriko", telephone: "+226 20 97 88 99", categorie: "electronique", horaires: "9h-19h", latitude: 11.1700, longitude: -4.2850 },
  { id: "elec_4", nom: "Phone Express", adresse: "Avenue Kwame N'Krumah", ville: "Ouagadougou", quartier: "Centre-ville", region: "Kadiogo", telephone: "+226 25 31 22 33", categorie: "electronique", horaires: "9h-20h", latitude: 12.3714, longitude: -1.5197 },
  { id: "elec_5", nom: "IT Solutions", adresse: "Boulevard Thomas Sankara", ville: "Ouagadougou", quartier: "Ouaga 2000", region: "Kadiogo", telephone: "+226 25 37 44 55", categorie: "electronique", horaires: "9h-19h", latitude: 12.3300, longitude: -1.4800 },
  { id: "elec_6", nom: "Tech Bobo", adresse: "Boulevard Mouammar Kadhafi", ville: "Bobo-Dioulasso", quartier: "Accart Ville", region: "Guiriko", telephone: "+226 20 97 99 00", categorie: "electronique", horaires: "9h-19h", latitude: 11.1771, longitude: -4.2897 },
  { id: "elec_7", nom: "Smartphone Store", adresse: "Rue de la Liberté", ville: "Ouagadougou", quartier: "Gounghin", region: "Kadiogo", telephone: "+226 70 33 44 55", categorie: "electronique", horaires: "9h-19h", latitude: 12.3680, longitude: -1.5260 },
  
  // ALIMENTATION (8)
  { id: "alim_1", nom: "Boulangerie Centrale", adresse: "Rue de la Liberté", ville: "Ouagadougou", quartier: "Gounghin", region: "Kadiogo", telephone: "+226 25 31 22 33", categorie: "alimentation", horaires: "6h-20h", latitude: 12.3680, longitude: -1.5260 },
  { id: "alim_2", nom: "Le Pain Quotidien", adresse: "Boulevard Bassawarga", ville: "Ouagadougou", quartier: "Tampouy", region: "Kadiogo", telephone: "+226 25 41 44 55", categorie: "alimentation", horaires: "6h-21h", latitude: 12.4200, longitude: -1.5200 },
  { id: "alim_3", nom: "Boulangerie Moderne", adresse: "Avenue Kwame N'Krumah", ville: "Ouagadougou", quartier: "Centre-ville", region: "Kadiogo", telephone: "+226 25 31 55 66", categorie: "alimentation", horaires: "6h-21h", latitude: 12.3714, longitude: -1.5197 },
  { id: "alim_4", nom: "Pâtisserie Délice", adresse: "Avenue de l'UEMOA", ville: "Ouagadougou", quartier: "Zone du Bois", region: "Kadiogo", telephone: "+226 25 36 66 77", categorie: "alimentation", horaires: "7h-20h", latitude: 12.3850, longitude: -1.4950 },
  { id: "alim_5", nom: "Boulangerie du Houet", adresse: "Avenue de la Révolution", ville: "Bobo-Dioulasso", quartier: "Centre-ville", region: "Guiriko", telephone: "+226 20 97 77 88", categorie: "alimentation", horaires: "6h-20h", latitude: 11.1800, longitude: -4.2920 },
  { id: "alim_6", nom: "Le Fournil", adresse: "Boulevard de la Liberté", ville: "Bobo-Dioulasso", quartier: "Tounouma", region: "Guiriko", telephone: "+226 20 97 88 99", categorie: "alimentation", horaires: "6h-20h", latitude: 11.1720, longitude: -4.2850 },
  { id: "alim_7", nom: "Pain et Saveurs", adresse: "Route de Ouaga 2000", ville: "Ouagadougou", quartier: "Ouaga 2000", region: "Kadiogo", telephone: "+226 25 37 99 00", categorie: "alimentation", horaires: "6h-22h", latitude: 12.3300, longitude: -1.4800 },
  { id: "alim_8", nom: "Boulangerie Express", adresse: "Avenue Pascal Zagré", ville: "Ouagadougou", quartier: "Cissin", region: "Kadiogo", telephone: "+226 25 38 00 11", categorie: "alimentation", horaires: "6h-20h", latitude: 12.3480, longitude: -1.5100 },
  
  // DIVERS (10)
  { id: "div_1", nom: "Quincaillerie Centrale", adresse: "Rue du Commerce", ville: "Ouagadougou", quartier: "Dapoya", region: "Kadiogo", telephone: "+226 25 30 88 99", categorie: "divers", horaires: "8h-18h", latitude: 12.3900, longitude: -1.4900 },
  { id: "div_2", nom: "Librairie Mercury", adresse: "Avenue Kwame N'Krumah", ville: "Ouagadougou", quartier: "Centre-ville", region: "Kadiogo", telephone: "+226 25 31 99 00", categorie: "divers", horaires: "8h-19h", latitude: 12.3714, longitude: -1.5197 },
  { id: "div_3", nom: "Pharmacie Plus", adresse: "Boulevard Charles de Gaulle", ville: "Ouagadougou", quartier: "Paspanga", region: "Kadiogo", telephone: "+226 25 30 00 11", categorie: "divers", horaires: "8h-22h", latitude: 12.3745, longitude: -1.5180 },
  { id: "div_4", nom: "Matériaux de Construction", adresse: "Route de Bobo", ville: "Ouagadougou", quartier: "Pissy", region: "Kadiogo", telephone: "+226 25 38 11 22", categorie: "divers", horaires: "7h-18h", latitude: 12.3450, longitude: -1.5400 },
  { id: "div_5", nom: "Boutique Multi-Services", adresse: "Avenue de la Nation", ville: "Koudougou", quartier: "Centre", region: "Boulkiemdé", telephone: "+226 25 44 22 33", categorie: "divers", horaires: "8h-18h", latitude: 12.2500, longitude: -2.3650 },
  { id: "div_6", nom: "Commerce Général", adresse: "Route de Djibo", ville: "Ouahigouya", quartier: "Centre", region: "Yatenga", telephone: "+226 24 55 33 44", categorie: "divers", horaires: "8h-18h", latitude: 13.5828, longitude: -2.4214 },
  { id: "div_7", nom: "Magasin de l'Est", adresse: "Avenue Nationale", ville: "Fada N'Gourma", quartier: "Centre", region: "Gourma", telephone: "+226 24 77 44 55", categorie: "divers", horaires: "8h-17h", latitude: 12.0614, longitude: 0.3581 },
  { id: "div_8", nom: "Quincaillerie Bobo", adresse: "Boulevard Mouammar Kadhafi", ville: "Bobo-Dioulasso", quartier: "Accart Ville", region: "Guiriko", telephone: "+226 20 97 55 66", categorie: "divers", horaires: "8h-18h", latitude: 11.1771, longitude: -4.2897 },
  { id: "div_9", nom: "Fournitures Scolaires", adresse: "Rue de l'Indépendance", ville: "Koudougou", quartier: "Centre", region: "Boulkiemdé", telephone: "+226 25 44 33 44", categorie: "divers", horaires: "8h-18h", latitude: 12.2525, longitude: -2.3622 },
  { id: "div_10", nom: "Bazin et Tissus", adresse: "Avenue de la Nation", ville: "Tenkodogo", quartier: "Centre", region: "Boulgou", telephone: "+226 40 71 44 55", categorie: "divers", horaires: "8h-18h", latitude: 11.7800, longitude: -0.3700 }
];

const REGIONS = [
  "Kadiogo", "Guiriko", "Comoé", "Boulkiemdé", "Yatenga", "Gourma",
  "Séno", "Boulgou", "Oubritenga", "Sanmatenga", "Mouhoun", "Poni"
];

const CATEGORIES = [
  { value: "all", label: "Toutes les catégories" },
  { value: "marche", label: "🏪 Marchés" },
  { value: "supermarche", label: "🛒 Supermarchés" },
  { value: "vetements", label: "👕 Vêtements" },
  { value: "electronique", label: "📱 Électronique" },
  { value: "artisanat", label: "🎨 Artisanat" },
  { value: "alimentation", label: "🥖 Alimentation" },
  { value: "divers", label: "🛍️ Divers" }
];

export default function BoutiquesMarchés() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRegion, setSelectedRegion] = useState<string>("all");
  const [selectedCategorie, setSelectedCategorie] = useState<string>("all");
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const filteredBoutiques = useMemo(() => {
    let filtered = BOUTIQUES_DATA;

    if (selectedRegion !== "all") {
      filtered = filtered.filter(b => b.region === selectedRegion);
    }

    if (selectedCategorie !== "all") {
      filtered = filtered.filter(b => b.categorie === selectedCategorie);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(b =>
        b.nom.toLowerCase().includes(query) ||
        b.ville.toLowerCase().includes(query) ||
        b.quartier.toLowerCase().includes(query) ||
        b.adresse.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [searchQuery, selectedRegion, selectedCategorie]);

  const openInMaps = (boutique: Boutique) => {
    if (boutique.latitude && boutique.longitude) {
      const url = `https://www.google.com/maps/search/?api=1&query=${boutique.latitude},${boutique.longitude}`;
      window.open(url, '_blank', 'noopener,noreferrer');
    } else {
      const query = encodeURIComponent(`${boutique.nom} ${boutique.ville} ${boutique.adresse}`);
      const url = `https://www.google.com/maps/search/?api=1&query=${query}`;
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  const getCategorieColor = (categorie: string) => {
    switch (categorie) {
      case "marche": return "bg-amber-600 text-white";
      case "supermarche": return "bg-blue-500 text-white";
      case "vetements": return "bg-pink-500 text-white";
      case "electronique": return "bg-purple-500 text-white";
      case "artisanat": return "bg-orange-500 text-white";
      case "alimentation": return "bg-green-600 text-white";
      case "divers": return "bg-gray-500 text-white";
      default: return "bg-gray-500 text-white";
    }
  };

  const getCategorieLabel = (categorie: string) => {
    switch (categorie) {
      case "marche": return "Marché";
      case "supermarche": return "Supermarché";
      case "vetements": return "Vêtements";
      case "electronique": return "Électronique";
      case "artisanat": return "Artisanat";
      case "alimentation": return "Alimentation";
      case "divers": return "Divers";
      default: return categorie;
    }
  };

  const handleReset = () => {
    setSearchQuery("");
    setSelectedRegion("all");
    setSelectedCategorie("all");
    toast({
      title: "Filtres réinitialisés",
      description: `${BOUTIQUES_DATA.length} commerces disponibles`,
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
            data-testid="button-back"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour
          </Button>
          <Button
            variant="outline"
            onClick={handleReset}
            className="gap-2 ml-auto"
            data-testid="button-reset"
          >
            <RefreshCw className="w-4 h-4" />
            Réinitialiser
          </Button>
        </div>

        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
            <span className="text-2xl">🛍️</span>
            Boutiques & Marchés
          </h1>
          <p className="text-muted-foreground">
            Trouvez les meilleurs commerces et marchés du Burkina Faso
          </p>
        </div>

        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Rechercher un commerce..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                  data-testid="input-search"
                />
              </div>

              <Select value={selectedRegion} onValueChange={setSelectedRegion}>
                <SelectTrigger data-testid="select-region">
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

              <Select value={selectedCategorie} onValueChange={setSelectedCategorie}>
                <SelectTrigger data-testid="select-categorie">
                  <SelectValue placeholder="Toutes les catégories" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(cat => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="mt-3 text-sm text-muted-foreground">
              {filteredBoutiques.length} commerce{filteredBoutiques.length > 1 ? 's' : ''} trouvé{filteredBoutiques.length > 1 ? 's' : ''}
            </div>
          </CardContent>
        </Card>

        {filteredBoutiques.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Store className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                Aucun commerce trouvé avec ces critères
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredBoutiques.map((boutique) => (
              <Card key={boutique.id} className="hover:shadow-lg transition-shadow" data-testid={`card-boutique-${boutique.id}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-2">{boutique.nom}</CardTitle>
                      <Badge className={getCategorieColor(boutique.categorie)}>
                        <Store className="w-3 h-3 mr-1" />
                        {getCategorieLabel(boutique.categorie)}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 mb-4">
                    <div className="flex items-start gap-2 text-sm">
                      <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium">{boutique.adresse}</p>
                        <p className="text-muted-foreground">
                          {boutique.quartier}, {boutique.ville}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      <span className="text-muted-foreground">{boutique.horaires}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      <a
                        href={`tel:${boutique.telephone}`}
                        className="text-primary hover:underline"
                      >
                        {boutique.telephone}
                      </a>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={() => openInMaps(boutique)}
                      className="flex-1 gap-2"
                      variant="default"
                      data-testid={`button-map-${boutique.id}`}
                    >
                      <Navigation className="w-4 h-4" />
                      Itinéraire
                    </Button>
                    <Button
                      asChild
                      variant="outline"
                      className="gap-2"
                    >
                      <a href={`tel:${boutique.telephone}`} data-testid={`button-call-${boutique.id}`}>
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
