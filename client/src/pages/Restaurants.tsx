import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import EmergencyPanel from "@/components/EmergencyPanel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, MapPin, Phone, Clock, Navigation, ArrowLeft, RefreshCw, Star, Utensils } from "lucide-react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

interface Restaurant {
  id: string;
  nom: string;
  adresse: string;
  ville: string;
  quartier: string;
  region: string;
  telephone: string;
  categorie: "africain" | "international" | "fast-food" | "maquis" | "gastronomique" | "grillades";
  prixMoyen: "€" | "€€" | "€€€";
  horaires: string;
  note?: number;
  latitude?: number;
  longitude?: number;
}

const RESTAURANTS_DATA: Restaurant[] = [
  // OUAGADOUGOU (25 restaurants)
  { id: "rest_1", nom: "Le Verdoyant", adresse: "Avenue Kwame N'Krumah", ville: "Ouagadougou", quartier: "Centre-ville", region: "Kadiogo", telephone: "+226 25 31 45 67", categorie: "gastronomique", prixMoyen: "€€€", horaires: "12h-15h, 19h-23h", note: 4.5, latitude: 12.3714, longitude: -1.5197 },
  { id: "rest_2", nom: "Maquis Chez Tanti", adresse: "Rue de la Liberté", ville: "Ouagadougou", quartier: "Gounghin", region: "Kadiogo", telephone: "+226 70 12 34 56", categorie: "maquis", prixMoyen: "€", horaires: "10h-22h", note: 4.2, latitude: 12.3680, longitude: -1.5260 },
  { id: "rest_3", nom: "L'Eau Vive", adresse: "Avenue de la Résistance du 17 Mai", ville: "Ouagadougou", quartier: "Zone du Bois", region: "Kadiogo", telephone: "+226 25 30 63 63", categorie: "international", prixMoyen: "€€", horaires: "11h30-14h30, 18h30-22h", note: 4.3, latitude: 12.3750, longitude: -1.5100 },
  { id: "rest_4", nom: "La Forêt", adresse: "Route de Ouaga 2000", ville: "Ouagadougou", quartier: "Ouaga 2000", region: "Kadiogo", telephone: "+226 25 37 88 99", categorie: "africain", prixMoyen: "€€", horaires: "11h-23h", note: 4.4, latitude: 12.3300, longitude: -1.4800 },
  { id: "rest_5", nom: "Chez Fatou Grillades", adresse: "Boulevard Charles de Gaulle", ville: "Ouagadougou", quartier: "Paspanga", region: "Kadiogo", telephone: "+226 70 23 45 67", categorie: "grillades", prixMoyen: "€", horaires: "17h-00h", note: 4.6, latitude: 12.3745, longitude: -1.5180 },
  { id: "rest_6", nom: "Pizza Express", adresse: "Avenue de l'UEMOA", ville: "Ouagadougou", quartier: "Zone du Bois", region: "Kadiogo", telephone: "+226 25 36 77 88", categorie: "fast-food", prixMoyen: "€€", horaires: "10h-22h", note: 4.0, latitude: 12.3850, longitude: -1.4950 },
  { id: "rest_7", nom: "Le Café de Rome", adresse: "Rue de la Chance", ville: "Ouagadougou", quartier: "Koulouba", region: "Kadiogo", telephone: "+226 25 33 22 11", categorie: "international", prixMoyen: "€€€", horaires: "7h-23h", note: 4.7, latitude: 12.3800, longitude: -1.5050 },
  { id: "rest_8", nom: "Maquis Le Palmier", adresse: "Avenue Yennenga", ville: "Ouagadougou", quartier: "Wemtenga", region: "Kadiogo", telephone: "+226 70 34 56 78", categorie: "maquis", prixMoyen: "€", horaires: "10h-23h", note: 4.1, latitude: 12.3800, longitude: -1.5100 },
  { id: "rest_9", nom: "Le Riz Gras", adresse: "Rue du Commerce", ville: "Ouagadougou", quartier: "Dapoya", region: "Kadiogo", telephone: "+226 70 45 67 89", categorie: "africain", prixMoyen: "€", horaires: "11h-21h", note: 4.3, latitude: 12.3900, longitude: -1.4900 },
  { id: "rest_10", nom: "Le Gondwana", adresse: "Boulevard Bassawarga", ville: "Ouagadougou", quartier: "Tampouy", region: "Kadiogo", telephone: "+226 25 41 55 66", categorie: "gastronomique", prixMoyen: "€€€", horaires: "12h-14h30, 19h-22h30", note: 4.8, latitude: 12.4200, longitude: -1.5200 },
  { id: "rest_11", nom: "Le Zaka", adresse: "Avenue de l'Indépendance", ville: "Ouagadougou", quartier: "Patte d'Oie", region: "Kadiogo", telephone: "+226 25 38 11 22", categorie: "africain", prixMoyen: "€€", horaires: "11h-22h", note: 4.4, latitude: 12.3550, longitude: -1.5050 },
  { id: "rest_12", nom: "Burger House", adresse: "Avenue Pascal Zagré", ville: "Ouagadougou", quartier: "Somgandé", region: "Kadiogo", telephone: "+226 70 55 66 77", categorie: "fast-food", prixMoyen: "€", horaires: "9h-22h", note: 4.0, latitude: 12.3950, longitude: -1.5300 },
  { id: "rest_13", nom: "Maquis Le Baobab", adresse: "Rue de Yalgado", ville: "Ouagadougou", quartier: "Pissy", region: "Kadiogo", telephone: "+226 76 11 22 33", categorie: "maquis", prixMoyen: "€", horaires: "10h-23h", note: 4.3, latitude: 12.3450, longitude: -1.5400 },
  { id: "rest_14", nom: "Le Diplomate", adresse: "Boulevard de la Présidence", ville: "Ouagadougou", quartier: "Ouaga 2000", region: "Kadiogo", telephone: "+226 25 37 99 00", categorie: "gastronomique", prixMoyen: "€€€", horaires: "12h-14h30, 19h-22h30", note: 4.9, latitude: 12.3280, longitude: -1.4750 },
  { id: "rest_15", nom: "Grillades du Sahel", adresse: "Avenue Babanguida", ville: "Ouagadougou", quartier: "Tanghin", region: "Kadiogo", telephone: "+226 78 22 33 44", categorie: "grillades", prixMoyen: "€€", horaires: "17h-00h", note: 4.5, latitude: 12.4100, longitude: -1.5100 },
  { id: "rest_16", nom: "Chez Binta", adresse: "Rue de la Mosquée", ville: "Ouagadougou", quartier: "Zogona", region: "Kadiogo", telephone: "+226 70 88 99 00", categorie: "africain", prixMoyen: "€", horaires: "11h-21h", note: 4.2, latitude: 12.3650, longitude: -1.5150 },
  { id: "rest_17", nom: "Le Terroir", adresse: "Avenue de la Liberté", ville: "Ouagadougou", quartier: "Bilbalogho", region: "Kadiogo", telephone: "+226 25 32 44 55", categorie: "africain", prixMoyen: "€€", horaires: "11h-22h", note: 4.4, latitude: 12.3780, longitude: -1.5220 },
  { id: "rest_18", nom: "Maquis Sous le Manguier", adresse: "Rue de Bogodogo", ville: "Ouagadougou", quartier: "Bogodogo", region: "Kadiogo", telephone: "+226 76 33 44 55", categorie: "maquis", prixMoyen: "€", horaires: "10h-23h", note: 4.1, latitude: 12.3620, longitude: -1.4850 },
  { id: "rest_19", nom: "Restaurant Thai Ouaga", adresse: "Boulevard de la Nation", ville: "Ouagadougou", quartier: "Zone du Bois", region: "Kadiogo", telephone: "+226 25 36 88 99", categorie: "international", prixMoyen: "€€€", horaires: "12h-14h30, 19h-22h", note: 4.6, latitude: 12.3820, longitude: -1.4980 },
  { id: "rest_20", nom: "Chicken King", adresse: "Avenue de l'UEMOA", ville: "Ouagadougou", quartier: "Zone du Bois", region: "Kadiogo", telephone: "+226 25 36 55 66", categorie: "fast-food", prixMoyen: "€", horaires: "8h-22h", note: 3.9, latitude: 12.3840, longitude: -1.4920 },
  { id: "rest_21", nom: "Le Jardin Secret", adresse: "Route de Kamboinse", ville: "Ouagadougou", quartier: "Bassinko", region: "Kadiogo", telephone: "+226 70 99 00 11", categorie: "gastronomique", prixMoyen: "€€€", horaires: "12h-15h, 19h-23h", note: 4.7, latitude: 12.4500, longitude: -1.5000 },
  { id: "rest_22", nom: "Grillades de Ouaga", adresse: "Rue Oumarou Kanazoé", ville: "Ouagadougou", quartier: "Karpala", region: "Kadiogo", telephone: "+226 78 44 55 66", categorie: "grillades", prixMoyen: "€", horaires: "17h-01h", note: 4.4, latitude: 12.3580, longitude: -1.4780 },
  { id: "rest_23", nom: "Maquis L'Olivier", adresse: "Boulevard de la Révolution", ville: "Ouagadougou", quartier: "1200 Logements", region: "Kadiogo", telephone: "+226 70 66 77 88", categorie: "maquis", prixMoyen: "€", horaires: "10h-22h", note: 4.0, latitude: 12.3520, longitude: -1.5320 },
  { id: "rest_24", nom: "Restaurant Le Massa", adresse: "Avenue Léo Frobenius", ville: "Ouagadougou", quartier: "Koulouba", region: "Kadiogo", telephone: "+226 25 33 66 77", categorie: "africain", prixMoyen: "€€", horaires: "11h-22h", note: 4.3, latitude: 12.3790, longitude: -1.5070 },
  { id: "rest_25", nom: "Pizza Palace", adresse: "Avenue Pascal Zagré", ville: "Ouagadougou", quartier: "Cissin", region: "Kadiogo", telephone: "+226 25 38 77 88", categorie: "fast-food", prixMoyen: "€€", horaires: "10h-22h", note: 4.1, latitude: 12.3480, longitude: -1.5100 },
  
  // BOBO-DIOULASSO (15 restaurants)
  { id: "rest_26", nom: "Le Bambou", adresse: "Boulevard Mouammar Kadhafi", ville: "Bobo-Dioulasso", quartier: "Accart Ville", region: "Guiriko", telephone: "+226 20 97 11 22", categorie: "international", prixMoyen: "€€", horaires: "11h-22h", note: 4.4, latitude: 11.1771, longitude: -4.2897 },
  { id: "rest_27", nom: "Maquis Le Fromager", adresse: "Rue de Banfora", ville: "Bobo-Dioulasso", quartier: "Diarradougou", region: "Guiriko", telephone: "+226 70 56 78 90", categorie: "maquis", prixMoyen: "€", horaires: "10h-23h", note: 4.2, latitude: 11.1820, longitude: -4.2950 },
  { id: "rest_28", nom: "Chez Moussa", adresse: "Avenue de la Révolution", ville: "Bobo-Dioulasso", quartier: "Centre-ville", region: "Guiriko", telephone: "+226 20 97 33 44", categorie: "africain", prixMoyen: "€", horaires: "11h-22h", note: 4.5, latitude: 11.1800, longitude: -4.2920 },
  { id: "rest_29", nom: "Le Sababougnouma", adresse: "Rue du Commerce", ville: "Bobo-Dioulasso", quartier: "Belle Ville", region: "Guiriko", telephone: "+226 20 98 55 66", categorie: "grillades", prixMoyen: "€€", horaires: "18h-00h", note: 4.6, latitude: 11.1750, longitude: -4.2880 },
  { id: "rest_30", nom: "Le Petit Resto", adresse: "Avenue Ouezzin Coulibaly", ville: "Bobo-Dioulasso", quartier: "Koko", region: "Guiriko", telephone: "+226 20 99 11 22", categorie: "fast-food", prixMoyen: "€", horaires: "8h-21h", note: 3.9, latitude: 11.1850, longitude: -4.3000 },
  { id: "rest_31", nom: "Le Kapokier", adresse: "Boulevard de la Liberté", ville: "Bobo-Dioulasso", quartier: "Tounouma", region: "Guiriko", telephone: "+226 20 97 66 77", categorie: "gastronomique", prixMoyen: "€€€", horaires: "12h-14h30, 19h-22h", note: 4.7, latitude: 11.1720, longitude: -4.2850 },
  { id: "rest_32", nom: "Maquis Chez Daouda", adresse: "Rue de Sikasso", ville: "Bobo-Dioulasso", quartier: "Lafiabougou", region: "Guiriko", telephone: "+226 76 11 22 33", categorie: "maquis", prixMoyen: "€", horaires: "10h-23h", note: 4.3, latitude: 11.1900, longitude: -4.2980 },
  { id: "rest_33", nom: "Restaurant du Fleuve", adresse: "Avenue du Fleuve", ville: "Bobo-Dioulasso", quartier: "Bolmakoté", region: "Guiriko", telephone: "+226 20 98 88 99", categorie: "africain", prixMoyen: "€€", horaires: "11h-22h", note: 4.4, latitude: 11.1680, longitude: -4.2920 },
  { id: "rest_34", nom: "Grillades du Houet", adresse: "Route de Dédougou", ville: "Bobo-Dioulasso", quartier: "Colma", region: "Guiriko", telephone: "+226 78 22 33 44", categorie: "grillades", prixMoyen: "€", horaires: "17h-00h", note: 4.5, latitude: 11.1950, longitude: -4.2850 },
  { id: "rest_35", nom: "Fast Food Bobo", adresse: "Rue du Marché", ville: "Bobo-Dioulasso", quartier: "Bindougousso", region: "Guiriko", telephone: "+226 70 33 44 55", categorie: "fast-food", prixMoyen: "€", horaires: "8h-21h", note: 3.8, latitude: 11.1780, longitude: -4.2900 },
  { id: "rest_36", nom: "Le Djoliba", adresse: "Avenue de la Nation", ville: "Bobo-Dioulasso", quartier: "Hamdalaye", region: "Guiriko", telephone: "+226 20 97 99 00", categorie: "international", prixMoyen: "€€", horaires: "11h-22h", note: 4.3, latitude: 11.1830, longitude: -4.3050 },
  { id: "rest_37", nom: "Maquis La Terrasse", adresse: "Rue de l'Artisanat", ville: "Bobo-Dioulasso", quartier: "Sarfalao", region: "Guiriko", telephone: "+226 76 44 55 66", categorie: "maquis", prixMoyen: "€", horaires: "10h-23h", note: 4.1, latitude: 11.1700, longitude: -4.2830 },
  { id: "rest_38", nom: "Restaurant de l'Aéroport", adresse: "Route de l'Aéroport", ville: "Bobo-Dioulasso", quartier: "Secteur 25", region: "Guiriko", telephone: "+226 20 98 00 11", categorie: "international", prixMoyen: "€€€", horaires: "6h-22h", note: 4.2, latitude: 11.1600, longitude: -4.3200 },
  { id: "rest_39", nom: "Chez Awa", adresse: "Rue de Ouagadougou", ville: "Bobo-Dioulasso", quartier: "Sikasso-Cira", region: "Guiriko", telephone: "+226 70 55 66 77", categorie: "africain", prixMoyen: "€", horaires: "11h-21h", note: 4.4, latitude: 11.1870, longitude: -4.2780 },
  { id: "rest_40", nom: "Le Mogho", adresse: "Avenue Nelson Mandela", ville: "Bobo-Dioulasso", quartier: "Secteur 22", region: "Guiriko", telephone: "+226 20 99 22 33", categorie: "gastronomique", prixMoyen: "€€€", horaires: "12h-15h, 19h-22h30", note: 4.6, latitude: 11.1650, longitude: -4.2900 },
  
  // BANFORA (8 restaurants)
  { id: "rest_41", nom: "Le Karité", adresse: "Avenue de la Révolution", ville: "Banfora", quartier: "Centre", region: "Comoé", telephone: "+226 20 91 22 33", categorie: "africain", prixMoyen: "€", horaires: "11h-22h", note: 4.3, latitude: 10.6334, longitude: -4.7619 },
  { id: "rest_42", nom: "Auberge des Cascades", adresse: "Route de Sindou", ville: "Banfora", quartier: "Secteur 2", region: "Comoé", telephone: "+226 20 91 44 55", categorie: "gastronomique", prixMoyen: "€€€", horaires: "12h-14h, 19h-22h", note: 4.7, latitude: 10.6300, longitude: -4.7650 },
  { id: "rest_43", nom: "Maquis Le Paysan", adresse: "Rue du Marché", ville: "Banfora", quartier: "Secteur 3", region: "Comoé", telephone: "+226 70 66 77 88", categorie: "maquis", prixMoyen: "€", horaires: "10h-22h", note: 4.2, latitude: 10.6350, longitude: -4.7580 },
  { id: "rest_44", nom: "Restaurant du Lac", adresse: "Route du Lac Tengréla", ville: "Banfora", quartier: "Secteur 5", region: "Comoé", telephone: "+226 20 91 66 77", categorie: "international", prixMoyen: "€€", horaires: "11h-22h", note: 4.5, latitude: 10.6280, longitude: -4.7700 },
  { id: "rest_45", nom: "Grillades Comoé", adresse: "Avenue de Bobo", ville: "Banfora", quartier: "Secteur 1", region: "Comoé", telephone: "+226 78 77 88 99", categorie: "grillades", prixMoyen: "€", horaires: "17h-23h", note: 4.4, latitude: 10.6380, longitude: -4.7550 },
  { id: "rest_46", nom: "Chez Mariam", adresse: "Rue de la Gare", ville: "Banfora", quartier: "Secteur 4", region: "Comoé", telephone: "+226 70 88 99 00", categorie: "africain", prixMoyen: "€", horaires: "11h-21h", note: 4.1, latitude: 10.6320, longitude: -4.7600 },
  { id: "rest_47", nom: "Fast Food Cascades", adresse: "Avenue Principale", ville: "Banfora", quartier: "Centre", region: "Comoé", telephone: "+226 76 99 00 11", categorie: "fast-food", prixMoyen: "€", horaires: "8h-21h", note: 3.8, latitude: 10.6340, longitude: -4.7610 },
  { id: "rest_48", nom: "Le Sindou", adresse: "Route de Sindou", ville: "Banfora", quartier: "Secteur 6", region: "Comoé", telephone: "+226 20 91 88 99", categorie: "maquis", prixMoyen: "€", horaires: "10h-23h", note: 4.0, latitude: 10.6260, longitude: -4.7680 },
  
  // KOUDOUGOU (6 restaurants)
  { id: "rest_49", nom: "Chez Aminata", adresse: "Rue de l'Indépendance", ville: "Koudougou", quartier: "Centre-ville", region: "Boulkiemdé", telephone: "+226 25 44 11 22", categorie: "maquis", prixMoyen: "€", horaires: "10h-22h", note: 4.2, latitude: 12.2525, longitude: -2.3622 },
  { id: "rest_50", nom: "Le Relais", adresse: "Avenue de la Nation", ville: "Koudougou", quartier: "Secteur 3", region: "Boulkiemdé", telephone: "+226 25 44 33 44", categorie: "international", prixMoyen: "€€", horaires: "11h-22h", note: 4.0, latitude: 12.2500, longitude: -2.3650 },
  { id: "rest_51", nom: "Grillades du Centre", adresse: "Boulevard de la Révolution", ville: "Koudougou", quartier: "Secteur 5", region: "Boulkiemdé", telephone: "+226 78 00 11 22", categorie: "grillades", prixMoyen: "€", horaires: "17h-00h", note: 4.3, latitude: 12.2550, longitude: -2.3580 },
  { id: "rest_52", nom: "Restaurant Universitaire", adresse: "Route de l'Université", ville: "Koudougou", quartier: "Secteur 8", region: "Boulkiemdé", telephone: "+226 25 44 55 66", categorie: "africain", prixMoyen: "€", horaires: "11h-21h", note: 4.1, latitude: 12.2600, longitude: -2.3500 },
  { id: "rest_53", nom: "Le Moaga", adresse: "Avenue Thomas Sankara", ville: "Koudougou", quartier: "Secteur 2", region: "Boulkiemdé", telephone: "+226 70 11 22 33", categorie: "africain", prixMoyen: "€€", horaires: "11h-22h", note: 4.4, latitude: 12.2480, longitude: -2.3680 },
  { id: "rest_54", nom: "Fast Koud", adresse: "Rue du Commerce", ville: "Koudougou", quartier: "Secteur 1", region: "Boulkiemdé", telephone: "+226 76 22 33 44", categorie: "fast-food", prixMoyen: "€", horaires: "8h-21h", note: 3.9, latitude: 12.2510, longitude: -2.3640 },
  
  // OUAHIGOUYA (6 restaurants)
  { id: "rest_55", nom: "Le Sahel", adresse: "Route de Djibo", ville: "Ouahigouya", quartier: "Centre-ville", region: "Yatenga", telephone: "+226 24 55 11 22", categorie: "africain", prixMoyen: "€", horaires: "10h-22h", note: 4.1, latitude: 13.5828, longitude: -2.4214 },
  { id: "rest_56", nom: "Restaurant du Nord", adresse: "Avenue de la Liberté", ville: "Ouahigouya", quartier: "Secteur 1", region: "Yatenga", telephone: "+226 24 55 33 44", categorie: "grillades", prixMoyen: "€€", horaires: "17h-23h", note: 4.4, latitude: 13.5850, longitude: -2.4200 },
  { id: "rest_57", nom: "Maquis Yatenga", adresse: "Rue du Marché", ville: "Ouahigouya", quartier: "Secteur 3", region: "Yatenga", telephone: "+226 70 22 33 44", categorie: "maquis", prixMoyen: "€", horaires: "10h-22h", note: 4.2, latitude: 13.5800, longitude: -2.4250 },
  { id: "rest_58", nom: "Le Naaba Kango", adresse: "Avenue de l'Indépendance", ville: "Ouahigouya", quartier: "Secteur 5", region: "Yatenga", telephone: "+226 24 55 66 77", categorie: "gastronomique", prixMoyen: "€€€", horaires: "12h-14h30, 19h-22h", note: 4.6, latitude: 13.5870, longitude: -2.4180 },
  { id: "rest_59", nom: "Chez Issa", adresse: "Route de Ouagadougou", ville: "Ouahigouya", quartier: "Secteur 7", region: "Yatenga", telephone: "+226 76 33 44 55", categorie: "africain", prixMoyen: "€", horaires: "11h-21h", note: 4.0, latitude: 13.5780, longitude: -2.4280 },
  { id: "rest_60", nom: "Fast Food Yatenga", adresse: "Rue Principale", ville: "Ouahigouya", quartier: "Centre", region: "Yatenga", telephone: "+226 78 44 55 66", categorie: "fast-food", prixMoyen: "€", horaires: "8h-21h", note: 3.7, latitude: 13.5820, longitude: -2.4220 },
  
  // FADA N'GOURMA (5 restaurants)
  { id: "rest_61", nom: "L'Oasis de l'Est", adresse: "Avenue Nationale", ville: "Fada N'Gourma", quartier: "Centre", region: "Gourma", telephone: "+226 24 77 11 22", categorie: "africain", prixMoyen: "€", horaires: "11h-21h", note: 4.0, latitude: 12.0614, longitude: 0.3581 },
  { id: "rest_62", nom: "Maquis Gourma", adresse: "Rue du Marché", ville: "Fada N'Gourma", quartier: "Secteur 2", region: "Gourma", telephone: "+226 70 55 66 77", categorie: "maquis", prixMoyen: "€", horaires: "10h-22h", note: 4.1, latitude: 12.0630, longitude: 0.3550 },
  { id: "rest_63", nom: "Restaurant de l'Est", adresse: "Route de Niamey", ville: "Fada N'Gourma", quartier: "Secteur 4", region: "Gourma", telephone: "+226 24 77 33 44", categorie: "international", prixMoyen: "€€", horaires: "11h-22h", note: 4.2, latitude: 12.0580, longitude: 0.3620 },
  { id: "rest_64", nom: "Grillades du Gourma", adresse: "Avenue de la Paix", ville: "Fada N'Gourma", quartier: "Secteur 1", region: "Gourma", telephone: "+226 78 66 77 88", categorie: "grillades", prixMoyen: "€", horaires: "17h-23h", note: 4.3, latitude: 12.0650, longitude: 0.3600 },
  { id: "rest_65", nom: "Chez Abdoulaye", adresse: "Rue de la Mosquée", ville: "Fada N'Gourma", quartier: "Secteur 3", region: "Gourma", telephone: "+226 76 77 88 99", categorie: "africain", prixMoyen: "€", horaires: "11h-21h", note: 4.0, latitude: 12.0600, longitude: 0.3560 },
  
  // DORI (4 restaurants)
  { id: "rest_66", nom: "Le Campement", adresse: "Avenue Principale", ville: "Dori", quartier: "Centre", region: "Séno", telephone: "+226 24 46 11 22", categorie: "maquis", prixMoyen: "€", horaires: "10h-21h", note: 3.8, latitude: 14.0353, longitude: -0.0345 },
  { id: "rest_67", nom: "Restaurant du Sahel", adresse: "Route de Djibo", ville: "Dori", quartier: "Secteur 2", region: "Séno", telephone: "+226 24 46 33 44", categorie: "africain", prixMoyen: "€", horaires: "11h-21h", note: 4.0, latitude: 14.0380, longitude: -0.0300 },
  { id: "rest_68", nom: "Grillades Peulh", adresse: "Rue du Marché", ville: "Dori", quartier: "Secteur 1", region: "Séno", telephone: "+226 70 88 99 00", categorie: "grillades", prixMoyen: "€", horaires: "17h-22h", note: 4.2, latitude: 14.0320, longitude: -0.0380 },
  { id: "rest_69", nom: "Chez Hamidou", adresse: "Avenue de l'Indépendance", ville: "Dori", quartier: "Secteur 3", region: "Séno", telephone: "+226 76 99 00 11", categorie: "africain", prixMoyen: "€", horaires: "11h-21h", note: 3.9, latitude: 14.0400, longitude: -0.0320 },
  
  // TENKODOGO (4 restaurants)
  { id: "rest_70", nom: "Chez Mamadou", adresse: "Avenue de la Nation", ville: "Tenkodogo", quartier: "Centre", region: "Boulgou", telephone: "+226 40 71 11 22", categorie: "grillades", prixMoyen: "€", horaires: "17h-23h", note: 4.3, latitude: 11.7800, longitude: -0.3700 },
  { id: "rest_71", nom: "Restaurant du Centre", adresse: "Rue Principale", ville: "Tenkodogo", quartier: "Secteur 1", region: "Boulgou", telephone: "+226 40 71 33 44", categorie: "africain", prixMoyen: "€", horaires: "11h-21h", note: 4.1, latitude: 11.7820, longitude: -0.3680 },
  { id: "rest_72", nom: "Maquis Boulgou", adresse: "Avenue de Ouagadougou", ville: "Tenkodogo", quartier: "Secteur 3", region: "Boulgou", telephone: "+226 70 00 11 22", categorie: "maquis", prixMoyen: "€", horaires: "10h-22h", note: 4.0, latitude: 11.7780, longitude: -0.3720 },
  { id: "rest_73", nom: "Le Carrefour", adresse: "Route de Fada", ville: "Tenkodogo", quartier: "Secteur 5", region: "Boulgou", telephone: "+226 40 71 55 66", categorie: "international", prixMoyen: "€€", horaires: "11h-22h", note: 4.2, latitude: 11.7850, longitude: -0.3650 },
  
  // ZINIARÉ (3 restaurants)
  { id: "rest_74", nom: "Le Naaba", adresse: "Route Nationale", ville: "Ziniaré", quartier: "Centre", region: "Oubritenga", telephone: "+226 25 30 99 00", categorie: "africain", prixMoyen: "€€", horaires: "11h-22h", note: 4.2, latitude: 12.5833, longitude: -1.3000 },
  { id: "rest_75", nom: "Maquis Royal", adresse: "Rue du Palais", ville: "Ziniaré", quartier: "Secteur 2", region: "Oubritenga", telephone: "+226 70 22 33 44", categorie: "maquis", prixMoyen: "€", horaires: "10h-22h", note: 4.1, latitude: 12.5850, longitude: -1.2980 },
  { id: "rest_76", nom: "Grillades du Mogho", adresse: "Avenue de Ouagadougou", ville: "Ziniaré", quartier: "Secteur 1", region: "Oubritenga", telephone: "+226 78 33 44 55", categorie: "grillades", prixMoyen: "€", horaires: "17h-23h", note: 4.3, latitude: 12.5810, longitude: -1.3020 },
  
  // KAYA (4 restaurants)
  { id: "rest_77", nom: "Restaurant Sanmatenga", adresse: "Avenue Principale", ville: "Kaya", quartier: "Centre", region: "Sanmatenga", telephone: "+226 24 45 11 22", categorie: "africain", prixMoyen: "€", horaires: "11h-21h", note: 4.0, latitude: 13.0900, longitude: -1.0800 },
  { id: "rest_78", nom: "Maquis du Nord", adresse: "Rue du Marché", ville: "Kaya", quartier: "Secteur 2", region: "Sanmatenga", telephone: "+226 70 44 55 66", categorie: "maquis", prixMoyen: "€", horaires: "10h-22h", note: 4.1, latitude: 13.0920, longitude: -1.0780 },
  { id: "rest_79", nom: "Grillades Kaya", adresse: "Route de Dori", ville: "Kaya", quartier: "Secteur 4", region: "Sanmatenga", telephone: "+226 78 55 66 77", categorie: "grillades", prixMoyen: "€", horaires: "17h-23h", note: 4.2, latitude: 13.0880, longitude: -1.0820 },
  { id: "rest_80", nom: "Le Relais du Nord", adresse: "Avenue de l'Indépendance", ville: "Kaya", quartier: "Secteur 1", region: "Sanmatenga", telephone: "+226 24 45 33 44", categorie: "international", prixMoyen: "€€", horaires: "11h-22h", note: 4.3, latitude: 13.0940, longitude: -1.0760 },
  
  // DEDOUGOU (3 restaurants)
  { id: "rest_81", nom: "Le Mouhoun", adresse: "Avenue Principale", ville: "Dédougou", quartier: "Centre", region: "Mouhoun", telephone: "+226 20 52 11 22", categorie: "africain", prixMoyen: "€", horaires: "11h-21h", note: 4.1, latitude: 12.4633, longitude: -3.4600 },
  { id: "rest_82", nom: "Maquis du Fleuve", adresse: "Rue du Marché", ville: "Dédougou", quartier: "Secteur 3", region: "Mouhoun", telephone: "+226 70 66 77 88", categorie: "maquis", prixMoyen: "€", horaires: "10h-22h", note: 4.0, latitude: 12.4650, longitude: -3.4580 },
  { id: "rest_83", nom: "Grillades Mouhoun", adresse: "Route de Bobo", ville: "Dédougou", quartier: "Secteur 1", region: "Mouhoun", telephone: "+226 78 77 88 99", categorie: "grillades", prixMoyen: "€", horaires: "17h-23h", note: 4.2, latitude: 12.4610, longitude: -3.4620 },
  
  // HOUNDÉ (2 restaurants)
  { id: "rest_84", nom: "Le Tuy", adresse: "Route Nationale", ville: "Houndé", quartier: "Centre", region: "Tuy", telephone: "+226 20 94 11 22", categorie: "africain", prixMoyen: "€", horaires: "11h-21h", note: 4.0, latitude: 11.4900, longitude: -3.5200 },
  { id: "rest_85", nom: "Maquis Houndé", adresse: "Rue du Marché", ville: "Houndé", quartier: "Secteur 2", region: "Tuy", telephone: "+226 70 88 99 00", categorie: "maquis", prixMoyen: "€", horaires: "10h-22h", note: 3.9, latitude: 11.4920, longitude: -3.5180 },
  
  // PÔ (2 restaurants)
  { id: "rest_86", nom: "Le Nahouri", adresse: "Avenue Principale", ville: "Pô", quartier: "Centre", region: "Nahouri", telephone: "+226 40 48 11 22", categorie: "africain", prixMoyen: "€", horaires: "11h-21h", note: 4.0, latitude: 11.1667, longitude: -1.1500 },
  { id: "rest_87", nom: "Grillades du Sud", adresse: "Route de Ouagadougou", ville: "Pô", quartier: "Secteur 1", region: "Nahouri", telephone: "+226 78 99 00 11", categorie: "grillades", prixMoyen: "€", horaires: "17h-22h", note: 4.1, latitude: 11.1680, longitude: -1.1480 },
  
  // GAOUA (2 restaurants)
  { id: "rest_88", nom: "Le Poni", adresse: "Avenue de l'Indépendance", ville: "Gaoua", quartier: "Centre", region: "Poni", telephone: "+226 20 87 11 22", categorie: "africain", prixMoyen: "€", horaires: "11h-21h", note: 4.1, latitude: 10.3250, longitude: -3.1750 },
  { id: "rest_89", nom: "Maquis Lobi", adresse: "Rue du Marché", ville: "Gaoua", quartier: "Secteur 2", region: "Poni", telephone: "+226 70 00 11 22", categorie: "maquis", prixMoyen: "€", horaires: "10h-22h", note: 4.0, latitude: 10.3270, longitude: -3.1730 }
];

const REGIONS = [
  "Kadiogo", "Guiriko", "Comoé", "Boulkiemdé", "Yatenga", "Gourma",
  "Séno", "Boulgou", "Oubritenga", "Sanmatenga", "Mouhoun", "Tuy", "Nahouri", "Poni"
];

const CATEGORIES = [
  { value: "all", label: "Toutes les catégories" },
  { value: "africain", label: "🍲 Cuisine Africaine" },
  { value: "international", label: "🌍 International" },
  { value: "fast-food", label: "🍔 Fast-Food" },
  { value: "maquis", label: "🏠 Maquis" },
  { value: "gastronomique", label: "⭐ Gastronomique" },
  { value: "grillades", label: "🔥 Grillades" }
];

export default function Restaurants() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRegion, setSelectedRegion] = useState<string>("all");
  const [selectedCategorie, setSelectedCategorie] = useState<string>("all");
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const filteredRestaurants = useMemo(() => {
    let filtered = RESTAURANTS_DATA;

    if (selectedRegion !== "all") {
      filtered = filtered.filter(r => r.region === selectedRegion);
    }

    if (selectedCategorie !== "all") {
      filtered = filtered.filter(r => r.categorie === selectedCategorie);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(r =>
        r.nom.toLowerCase().includes(query) ||
        r.ville.toLowerCase().includes(query) ||
        r.quartier.toLowerCase().includes(query) ||
        r.adresse.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [searchQuery, selectedRegion, selectedCategorie]);

  const openInMaps = (restaurant: Restaurant) => {
    if (restaurant.latitude && restaurant.longitude) {
      const url = `https://www.google.com/maps/search/?api=1&query=${restaurant.latitude},${restaurant.longitude}`;
      window.open(url, '_blank', 'noopener,noreferrer');
    } else {
      const query = encodeURIComponent(`${restaurant.nom} ${restaurant.ville} ${restaurant.adresse}`);
      const url = `https://www.google.com/maps/search/?api=1&query=${query}`;
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  const getCategorieColor = (categorie: string) => {
    switch (categorie) {
      case "africain": return "bg-amber-500 text-white";
      case "international": return "bg-blue-500 text-white";
      case "fast-food": return "bg-orange-500 text-white";
      case "maquis": return "bg-green-600 text-white";
      case "gastronomique": return "bg-purple-500 text-white";
      case "grillades": return "bg-red-500 text-white";
      default: return "bg-gray-500 text-white";
    }
  };

  const getCategorieLabel = (categorie: string) => {
    switch (categorie) {
      case "africain": return "Africain";
      case "international": return "International";
      case "fast-food": return "Fast-Food";
      case "maquis": return "Maquis";
      case "gastronomique": return "Gastronomique";
      case "grillades": return "Grillades";
      default: return categorie;
    }
  };

  const handleReset = () => {
    setSearchQuery("");
    setSelectedRegion("all");
    setSelectedCategorie("all");
    toast({
      title: "Filtres réinitialisés",
      description: `${RESTAURANTS_DATA.length} restaurants disponibles`,
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
            <span className="text-2xl">🍽️</span>
            Restaurants
          </h1>
          <p className="text-muted-foreground">
            Découvrez les meilleurs restaurants du Burkina Faso
          </p>
        </div>

        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Rechercher un restaurant..."
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
              {filteredRestaurants.length} restaurant{filteredRestaurants.length > 1 ? 's' : ''} trouvé{filteredRestaurants.length > 1 ? 's' : ''}
            </div>
          </CardContent>
        </Card>

        {filteredRestaurants.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Utensils className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                Aucun restaurant trouvé avec ces critères
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredRestaurants.map((restaurant) => (
              <Card key={restaurant.id} className="hover:shadow-lg transition-shadow" data-testid={`card-restaurant-${restaurant.id}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-2">{restaurant.nom}</CardTitle>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge className={getCategorieColor(restaurant.categorie)}>
                          <Utensils className="w-3 h-3 mr-1" />
                          {getCategorieLabel(restaurant.categorie)}
                        </Badge>
                        <Badge variant="outline" className="font-bold">
                          {restaurant.prixMoyen}
                        </Badge>
                        {restaurant.note && (
                          <Badge variant="secondary" className="gap-1">
                            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                            {restaurant.note}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 mb-4">
                    <div className="flex items-start gap-2 text-sm">
                      <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium">{restaurant.adresse}</p>
                        <p className="text-muted-foreground">
                          {restaurant.quartier}, {restaurant.ville}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      <span className="text-muted-foreground">{restaurant.horaires}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      <a
                        href={`tel:${restaurant.telephone}`}
                        className="text-primary hover:underline"
                      >
                        {restaurant.telephone}
                      </a>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={() => openInMaps(restaurant)}
                      className="flex-1 gap-2"
                      variant="default"
                      data-testid={`button-map-${restaurant.id}`}
                    >
                      <Navigation className="w-4 h-4" />
                      Itinéraire
                    </Button>
                    <Button
                      asChild
                      variant="outline"
                      className="gap-2"
                    >
                      <a href={`tel:${restaurant.telephone}`} data-testid={`button-call-${restaurant.id}`}>
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
