import { useState, useMemo, useCallback } from "react";
import { Helmet } from "react-helmet-async";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import EmergencyPanel from "@/components/EmergencyPanel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, MapPin, Phone, Clock, Navigation, RefreshCw, Fuel, Droplets, Locate, ChevronLeft, ArrowLeft, Building2 } from "lucide-react";
import { Link } from "wouter";
import { VoiceSearchButton } from "@/components/VoiceSearchButton";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { LocationValidator } from "@/components/LocationValidator";

interface StationService {
  id: string;
  nom: string;
  adresse: string;
  ville: string;
  quartier: string;
  region: string;
  telephone: string;
  marque: "total" | "shell" | "oryx" | "barka" | "petrofa" | "star-oil" | "libya-oil" | "sipe" | "sonabhy";
  services: string[];
  horaires: string;
  latitude: number;
  longitude: number;
  placeId?: string;
  confirmations?: number;
  reports?: number;
}

const STATIONS_DATA: StationService[] = [
  // OUAGADOUGOU - BARKA ENERGIES (ex-Total) - 25 stations
  { id: "st_1", nom: "Barka Energies Centre-Ville", adresse: "Avenue Kwame N'Krumah", ville: "Ouagadougou", quartier: "Centre-ville", region: "Kadiogo", telephone: "+226 25 31 10 10", marque: "barka", services: ["Carburant", "Lavage", "Boutique"], horaires: "6h-22h", latitude: 12.3714, longitude: -1.5197 },
  { id: "st_2", nom: "Barka Energies Ouaga 2000", adresse: "Boulevard Thomas Sankara", ville: "Ouagadougou", quartier: "Ouaga 2000", region: "Kadiogo", telephone: "+226 25 37 10 10", marque: "barka", services: ["Carburant", "Lavage", "Boutique", "Restaurant"], horaires: "24h/24", latitude: 12.3280, longitude: -1.4780 },
  { id: "st_3", nom: "Barka Energies Patte d'Oie", adresse: "Avenue de l'Indépendance", ville: "Ouagadougou", quartier: "Patte d'Oie", region: "Kadiogo", telephone: "+226 25 38 10 10", marque: "barka", services: ["Carburant", "Lavage", "Boutique"], horaires: "6h-23h", latitude: 12.3550, longitude: -1.5050 },
  { id: "st_4", nom: "Barka Energies Tampouy", adresse: "Boulevard Bassawarga", ville: "Ouagadougou", quartier: "Tampouy", region: "Kadiogo", telephone: "+226 25 41 10 10", marque: "barka", services: ["Carburant", "Lavage", "Boutique"], horaires: "6h-22h", latitude: 12.4200, longitude: -1.5200 },
  { id: "st_5", nom: "Barka Energies Gounghin", adresse: "Avenue de Gounghin", ville: "Ouagadougou", quartier: "Gounghin", region: "Kadiogo", telephone: "+226 25 31 20 20", marque: "barka", services: ["Carburant", "Boutique"], horaires: "6h-22h", latitude: 12.3680, longitude: -1.5260 },
  { id: "st_6", nom: "Barka Energies Cissin", adresse: "Route de Kaya", ville: "Ouagadougou", quartier: "Cissin", region: "Kadiogo", telephone: "+226 25 36 10 10", marque: "barka", services: ["Carburant", "Lavage", "Boutique"], horaires: "6h-22h", latitude: 12.4000, longitude: -1.5000 },
  { id: "st_7", nom: "Barka Energies Somgandé", adresse: "Avenue Pascal Zagré", ville: "Ouagadougou", quartier: "Somgandé", region: "Kadiogo", telephone: "+226 25 38 20 20", marque: "barka", services: ["Carburant", "Boutique"], horaires: "6h-22h", latitude: 12.3950, longitude: -1.5300 },
  { id: "st_8", nom: "Barka Energies Pissy", adresse: "Route de Bobo", ville: "Ouagadougou", quartier: "Pissy", region: "Kadiogo", telephone: "+226 25 38 30 30", marque: "barka", services: ["Carburant", "Lavage", "Boutique"], horaires: "24h/24", latitude: 12.3450, longitude: -1.5400 },
  { id: "st_9", nom: "Barka Energies Tanghin", adresse: "Avenue Babanguida", ville: "Ouagadougou", quartier: "Tanghin", region: "Kadiogo", telephone: "+226 25 41 20 20", marque: "barka", services: ["Carburant", "Boutique"], horaires: "6h-22h", latitude: 12.4100, longitude: -1.5100 },
  { id: "st_10", nom: "Barka Energies Karpala", adresse: "Rue Oumarou Kanazoé", ville: "Ouagadougou", quartier: "Karpala", region: "Kadiogo", telephone: "+226 25 36 20 20", marque: "barka", services: ["Carburant", "Boutique"], horaires: "6h-22h", latitude: 12.3580, longitude: -1.4780 },
  { id: "st_11", nom: "Barka Energies Wemtenga", adresse: "Avenue Yennenga", ville: "Ouagadougou", quartier: "Wemtenga", region: "Kadiogo", telephone: "+226 25 36 30 30", marque: "barka", services: ["Carburant", "Lavage"], horaires: "6h-22h", latitude: 12.3800, longitude: -1.5100 },
  { id: "st_12", nom: "Barka Energies Dapoya", adresse: "Rue du Commerce", ville: "Ouagadougou", quartier: "Dapoya", region: "Kadiogo", telephone: "+226 25 30 10 10", marque: "barka", services: ["Carburant", "Boutique"], horaires: "6h-21h", latitude: 12.3900, longitude: -1.4900 },
  
  // OUAGADOUGOU - SHELL (Vivo Energy) - 15 stations
  { id: "st_13", nom: "Shell Nations Unies", adresse: "Rond-Point des Nations Unies", ville: "Ouagadougou", quartier: "Zone du Bois", region: "Kadiogo", telephone: "+226 25 36 40 40", marque: "shell", services: ["Carburant", "Lavage", "Boutique", "Café"], horaires: "24h/24", latitude: 12.3850, longitude: -1.4950 },
  { id: "st_14", nom: "Shell Koulouba", adresse: "Avenue de la Chance", ville: "Ouagadougou", quartier: "Koulouba", region: "Kadiogo", telephone: "+226 25 33 40 40", marque: "shell", services: ["Carburant", "Lavage", "Boutique"], horaires: "6h-23h", latitude: 12.3800, longitude: -1.5050 },
  { id: "st_15", nom: "Shell Paspanga", adresse: "Boulevard Charles de Gaulle", ville: "Ouagadougou", quartier: "Paspanga", region: "Kadiogo", telephone: "+226 25 30 40 40", marque: "shell", services: ["Carburant", "Boutique"], horaires: "6h-22h", latitude: 12.3745, longitude: -1.5180 },
  { id: "st_16", nom: "Shell Ouaga 2000 Sud", adresse: "Route de Ouaga 2000", ville: "Ouagadougou", quartier: "Ouaga 2000", region: "Kadiogo", telephone: "+226 25 37 40 40", marque: "shell", services: ["Carburant", "Lavage", "Boutique", "Restaurant"], horaires: "24h/24", latitude: 12.3300, longitude: -1.4800 },
  { id: "st_17", nom: "Shell Bilbalogho", adresse: "Avenue de la Liberté", ville: "Ouagadougou", quartier: "Bilbalogho", region: "Kadiogo", telephone: "+226 25 32 40 40", marque: "shell", services: ["Carburant", "Boutique"], horaires: "6h-22h", latitude: 12.3780, longitude: -1.5220 },
  { id: "st_18", nom: "Shell 1200 Logements", adresse: "Boulevard de la Révolution", ville: "Ouagadougou", quartier: "1200 Logements", region: "Kadiogo", telephone: "+226 25 38 40 40", marque: "shell", services: ["Carburant", "Lavage"], horaires: "6h-22h", latitude: 12.3520, longitude: -1.5320 },
  { id: "st_19", nom: "Shell Bogodogo", adresse: "Rue de Bogodogo", ville: "Ouagadougou", quartier: "Bogodogo", region: "Kadiogo", telephone: "+226 25 36 50 50", marque: "shell", services: ["Carburant", "Boutique"], horaires: "6h-22h", latitude: 12.3620, longitude: -1.4850 },
  { id: "st_20", nom: "Shell Bassinko", adresse: "Route de Kamboinse", ville: "Ouagadougou", quartier: "Bassinko", region: "Kadiogo", telephone: "+226 25 41 40 40", marque: "shell", services: ["Carburant", "Lavage", "Boutique"], horaires: "6h-22h", latitude: 12.4500, longitude: -1.5000 },
  { id: "st_21", nom: "Shell Zogona", adresse: "Rue de la Mosquée", ville: "Ouagadougou", quartier: "Zogona", region: "Kadiogo", telephone: "+226 25 31 50 50", marque: "shell", services: ["Carburant", "Boutique"], horaires: "6h-21h", latitude: 12.3650, longitude: -1.5150 },
  
  // OUAGADOUGOU - ORYX ENERGIES - 10 stations
  { id: "st_22", nom: "Oryx Oscar Yaar", adresse: "Rue Emile Nonbila Damiba", ville: "Ouagadougou", quartier: "Centre-ville", region: "Kadiogo", telephone: "+226 25 31 60 60", marque: "oryx", services: ["Carburant", "Lavage", "Boutique"], horaires: "6h-22h", latitude: 12.3720, longitude: -1.5180 },
  { id: "st_23", nom: "Oryx Koulweeghin", adresse: "Avenue de la Concorde Nationale", ville: "Ouagadougou", quartier: "Koulweeghin", region: "Kadiogo", telephone: "+226 25 36 60 60", marque: "oryx", services: ["Carburant", "Boutique"], horaires: "6h-22h", latitude: 12.3880, longitude: -1.5020 },
  { id: "st_24", nom: "Oryx Route Kongoussi", adresse: "RN 22 Ouaga-Kongoussi", ville: "Ouagadougou", quartier: "Kamboinsé", region: "Kadiogo", telephone: "+226 25 41 60 60", marque: "oryx", services: ["Carburant", "Lavage", "Boutique"], horaires: "6h-21h", latitude: 12.4600, longitude: -1.4900 },
  { id: "st_25", nom: "Oryx ZAD Bogodogo", adresse: "Rue Tiemtora", ville: "Ouagadougou", quartier: "Bogodogo", region: "Kadiogo", telephone: "+226 25 36 70 70", marque: "oryx", services: ["Carburant", "Boutique"], horaires: "6h-22h", latitude: 12.3600, longitude: -1.4820 },
  { id: "st_26", nom: "Oryx Samandin", adresse: "Route de Fada", ville: "Ouagadougou", quartier: "Samandin", region: "Kadiogo", telephone: "+226 25 36 80 80", marque: "oryx", services: ["Carburant", "Lavage"], horaires: "6h-21h", latitude: 12.3750, longitude: -1.4700 },
  { id: "st_27", nom: "Oryx Dassasgho", adresse: "Avenue de l'Est", ville: "Ouagadougou", quartier: "Dassasgho", region: "Kadiogo", telephone: "+226 25 36 90 90", marque: "oryx", services: ["Carburant", "Boutique"], horaires: "6h-22h", latitude: 12.3650, longitude: -1.4750 },
  
  // OUAGADOUGOU - SONABHY - 5 stations
  { id: "st_28", nom: "SONABHY Dépôt Central", adresse: "Zone Industrielle", ville: "Ouagadougou", quartier: "Zone Industrielle", region: "Kadiogo", telephone: "+226 25 34 10 10", marque: "sonabhy", services: ["Carburant", "GPL"], horaires: "6h-18h", latitude: 12.3600, longitude: -1.5350 },
  { id: "st_29", nom: "SONABHY Yalgado", adresse: "Rue de Yalgado", ville: "Ouagadougou", quartier: "Yalgado", region: "Kadiogo", telephone: "+226 25 31 80 80", marque: "sonabhy", services: ["Carburant"], horaires: "6h-20h", latitude: 12.3700, longitude: -1.5280 },
  { id: "st_30", nom: "SONABHY Secteur 30", adresse: "Avenue Principale", ville: "Ouagadougou", quartier: "Secteur 30", region: "Kadiogo", telephone: "+226 25 41 80 80", marque: "sonabhy", services: ["Carburant", "GPL"], horaires: "6h-20h", latitude: 12.4150, longitude: -1.5150 },
  
  // OUAGADOUGOU - PETROFA - 3 stations
  { id: "st_31", nom: "Petrofa Koulouba", adresse: "Boulevard de la Révolution", ville: "Ouagadougou", quartier: "Koulouba", region: "Kadiogo", telephone: "+226 25 33 70 70", marque: "petrofa", services: ["Carburant", "Boutique"], horaires: "6h-22h", latitude: 12.3790, longitude: -1.5070 },
  { id: "st_32", nom: "Petrofa Tanghin", adresse: "Route de Kongoussi", ville: "Ouagadougou", quartier: "Tanghin", region: "Kadiogo", telephone: "+226 25 41 70 70", marque: "petrofa", services: ["Carburant"], horaires: "6h-21h", latitude: 12.4080, longitude: -1.5080 },
  { id: "st_33", nom: "Petrofa Pissy", adresse: "Route de Léo", ville: "Ouagadougou", quartier: "Pissy", region: "Kadiogo", telephone: "+226 25 38 70 70", marque: "petrofa", services: ["Carburant", "Lavage"], horaires: "6h-21h", latitude: 12.3420, longitude: -1.5450 },
  
  // OUAGADOUGOU - SIPE - 3 stations
  { id: "st_34", nom: "SIPE Patte d'Oie", adresse: "Carrefour Patte d'Oie", ville: "Ouagadougou", quartier: "Patte d'Oie", region: "Kadiogo", telephone: "+226 25 38 80 80", marque: "sipe", services: ["Carburant", "Boutique"], horaires: "6h-22h", latitude: 12.3560, longitude: -1.5040 },
  { id: "st_35", nom: "SIPE Somgandé", adresse: "Route de Kossodo", ville: "Ouagadougou", quartier: "Somgandé", region: "Kadiogo", telephone: "+226 25 38 90 90", marque: "sipe", services: ["Carburant"], horaires: "6h-21h", latitude: 12.3980, longitude: -1.5280 },
  { id: "st_36", nom: "SIPE Karpala", adresse: "Boulevard de l'Est", ville: "Ouagadougou", quartier: "Karpala", region: "Kadiogo", telephone: "+226 25 36 95 95", marque: "sipe", services: ["Carburant", "Lavage"], horaires: "6h-21h", latitude: 12.3560, longitude: -1.4760 },
  
  // BOBO-DIOULASSO - 20 stations
  { id: "st_37", nom: "Barka Energies Centre Bobo", adresse: "Avenue de la Révolution", ville: "Bobo-Dioulasso", quartier: "Centre-ville", region: "Houet", telephone: "+226 20 97 10 10", marque: "barka", services: ["Carburant", "Lavage", "Boutique"], horaires: "24h/24", latitude: 11.1800, longitude: -4.2920 },
  { id: "st_38", nom: "Barka Energies Accart Ville", adresse: "Boulevard Mouammar Kadhafi", ville: "Bobo-Dioulasso", quartier: "Accart Ville", region: "Houet", telephone: "+226 20 97 20 20", marque: "barka", services: ["Carburant", "Lavage", "Boutique", "Restaurant"], horaires: "24h/24", latitude: 11.1771, longitude: -4.2897 },
  { id: "st_39", nom: "Barka Energies Lafiabougou", adresse: "Rue de Sikasso", ville: "Bobo-Dioulasso", quartier: "Lafiabougou", region: "Houet", telephone: "+226 20 97 30 30", marque: "barka", services: ["Carburant", "Boutique"], horaires: "6h-22h", latitude: 11.1900, longitude: -4.2980 },
  { id: "st_40", nom: "Barka Energies Koko", adresse: "Avenue Ouezzin Coulibaly", ville: "Bobo-Dioulasso", quartier: "Koko", region: "Houet", telephone: "+226 20 97 40 40", marque: "barka", services: ["Carburant", "Lavage"], horaires: "6h-22h", latitude: 11.1850, longitude: -4.3000 },
  { id: "st_41", nom: "Barka Energies Tounouma", adresse: "Boulevard de la Liberté", ville: "Bobo-Dioulasso", quartier: "Tounouma", region: "Houet", telephone: "+226 20 97 50 50", marque: "barka", services: ["Carburant", "Boutique"], horaires: "6h-22h", latitude: 11.1720, longitude: -4.2850 },
  { id: "st_42", nom: "Shell Bobo Centre", adresse: "Avenue de la Nation", ville: "Bobo-Dioulasso", quartier: "Belle Ville", region: "Houet", telephone: "+226 20 98 10 10", marque: "shell", services: ["Carburant", "Lavage", "Boutique", "Café"], horaires: "24h/24", latitude: 11.1750, longitude: -4.2880 },
  { id: "st_43", nom: "Shell Sarfalao", adresse: "Rue de l'Artisanat", ville: "Bobo-Dioulasso", quartier: "Sarfalao", region: "Houet", telephone: "+226 20 98 20 20", marque: "shell", services: ["Carburant", "Boutique"], horaires: "6h-22h", latitude: 11.1700, longitude: -4.2830 },
  { id: "st_44", nom: "Shell Hamdalaye", adresse: "Avenue de la Nation", ville: "Bobo-Dioulasso", quartier: "Hamdalaye", region: "Houet", telephone: "+226 20 98 30 30", marque: "shell", services: ["Carburant", "Lavage"], horaires: "6h-22h", latitude: 11.1830, longitude: -4.3050 },
  { id: "st_45", nom: "Oryx Route Ouaga", adresse: "RN 1 Sortie Ouagadougou", ville: "Bobo-Dioulasso", quartier: "Secteur 25", region: "Houet", telephone: "+226 20 98 40 40", marque: "oryx", services: ["Carburant", "Lavage", "Boutique", "Restaurant"], horaires: "24h/24", latitude: 11.1950, longitude: -4.2700 },
  { id: "st_46", nom: "Oryx Secteur 22", adresse: "Rue des Arts et de la Culture", ville: "Bobo-Dioulasso", quartier: "Secteur 22", region: "Houet", telephone: "+226 61 89 30 88", marque: "oryx", services: ["Carburant", "Boutique"], horaires: "6h-22h", latitude: 11.1680, longitude: -4.2900 },
  { id: "st_47", nom: "Barka Energies Bindougousso", adresse: "Rue du Marché", ville: "Bobo-Dioulasso", quartier: "Bindougousso", region: "Houet", telephone: "+226 20 97 60 60", marque: "barka", services: ["Carburant"], horaires: "6h-21h", latitude: 11.1780, longitude: -4.2900 },
  { id: "st_48", nom: "Shell Colma", adresse: "Route de Dédougou", ville: "Bobo-Dioulasso", quartier: "Colma", region: "Houet", telephone: "+226 20 98 50 50", marque: "shell", services: ["Carburant", "Lavage", "Boutique"], horaires: "6h-22h", latitude: 11.1950, longitude: -4.2850 },
  { id: "st_49", nom: "Barka Energies Aéroport", adresse: "Route de l'Aéroport", ville: "Bobo-Dioulasso", quartier: "Secteur 25", region: "Houet", telephone: "+226 20 97 70 70", marque: "barka", services: ["Carburant", "Boutique"], horaires: "6h-22h", latitude: 11.1600, longitude: -4.3200 },
  { id: "st_50", nom: "SONABHY Bobo", adresse: "Zone Industrielle", ville: "Bobo-Dioulasso", quartier: "Zone Industrielle", region: "Houet", telephone: "+226 20 98 60 60", marque: "sonabhy", services: ["Carburant", "GPL"], horaires: "6h-18h", latitude: 11.1650, longitude: -4.3100 },
  { id: "st_51", nom: "Shell Diarradougou", adresse: "Rue de Banfora", ville: "Bobo-Dioulasso", quartier: "Diarradougou", region: "Houet", telephone: "+226 20 98 70 70", marque: "shell", services: ["Carburant", "Boutique"], horaires: "6h-21h", latitude: 11.1820, longitude: -4.2950 },
  { id: "st_52", nom: "Barka Energies Bolmakoté", adresse: "Avenue du Fleuve", ville: "Bobo-Dioulasso", quartier: "Bolmakoté", region: "Houet", telephone: "+226 20 97 80 80", marque: "barka", services: ["Carburant", "Lavage"], horaires: "6h-22h", latitude: 11.1680, longitude: -4.2920 },
  { id: "st_53", nom: "Petrofa Bobo", adresse: "Boulevard de la Liberté", ville: "Bobo-Dioulasso", quartier: "Tounouma", region: "Houet", telephone: "+226 20 98 80 80", marque: "petrofa", services: ["Carburant", "Boutique"], horaires: "6h-21h", latitude: 11.1740, longitude: -4.2870 },
  { id: "st_54", nom: "Oryx Sikasso-Cira", adresse: "Rue de Ouagadougou", ville: "Bobo-Dioulasso", quartier: "Sikasso-Cira", region: "Houet", telephone: "+226 20 98 90 90", marque: "oryx", services: ["Carburant"], horaires: "6h-21h", latitude: 11.1870, longitude: -4.2780 },
  
  // BANFORA - 6 stations
  { id: "st_55", nom: "Barka Energies Banfora Centre", adresse: "Avenue de la Révolution", ville: "Banfora", quartier: "Centre", region: "Comoé", telephone: "+226 20 91 10 10", marque: "barka", services: ["Carburant", "Lavage", "Boutique"], horaires: "6h-22h", latitude: 10.6334, longitude: -4.7619 },
  { id: "st_56", nom: "Shell Banfora", adresse: "Route de Bobo", ville: "Banfora", quartier: "Secteur 1", region: "Comoé", telephone: "+226 20 91 20 20", marque: "shell", services: ["Carburant", "Boutique"], horaires: "6h-22h", latitude: 10.6380, longitude: -4.7550 },
  { id: "st_57", nom: "Oryx Banfora RN 2", adresse: "RN 2 Route de Bobo", ville: "Banfora", quartier: "Secteur 2", region: "Comoé", telephone: "+226 20 91 30 30", marque: "oryx", services: ["Carburant", "Lavage", "Boutique"], horaires: "6h-21h", latitude: 10.6400, longitude: -4.7500 },
  { id: "st_58", nom: "Barka Energies Bounouna", adresse: "Route de Bounouna", ville: "Banfora", quartier: "Secteur 3", region: "Comoé", telephone: "+226 20 91 40 40", marque: "barka", services: ["Carburant"], horaires: "6h-20h", latitude: 10.6280, longitude: -4.7700 },
  { id: "st_59", nom: "SONABHY Banfora", adresse: "Zone Industrielle", ville: "Banfora", quartier: "Zone Industrielle", region: "Comoé", telephone: "+226 20 91 50 50", marque: "sonabhy", services: ["Carburant", "GPL"], horaires: "6h-18h", latitude: 10.6300, longitude: -4.7650 },
  { id: "st_60", nom: "Petrofa Banfora", adresse: "Avenue Principale", ville: "Banfora", quartier: "Centre", region: "Comoé", telephone: "+226 20 91 60 60", marque: "petrofa", services: ["Carburant", "Boutique"], horaires: "6h-21h", latitude: 10.6350, longitude: -4.7580 },
  
  // KOUDOUGOU - 6 stations
  { id: "st_61", nom: "Barka Energies Koudougou Centre", adresse: "Rue de l'Indépendance", ville: "Koudougou", quartier: "Centre-ville", region: "Boulkiemdé", telephone: "+226 25 44 10 10", marque: "barka", services: ["Carburant", "Lavage", "Boutique"], horaires: "6h-22h", latitude: 12.2525, longitude: -2.3622 },
  { id: "st_62", nom: "Shell Koudougou", adresse: "Avenue de la Nation", ville: "Koudougou", quartier: "Secteur 3", region: "Boulkiemdé", telephone: "+226 25 44 20 20", marque: "shell", services: ["Carburant", "Boutique"], horaires: "6h-22h", latitude: 12.2500, longitude: -2.3650 },
  { id: "st_63", nom: "Oryx Koudougou", adresse: "Avenue du Président Maurice Yameogo", ville: "Koudougou", quartier: "Secteur 8", region: "Boulkiemdé", telephone: "+226 25 44 30 30", marque: "oryx", services: ["Carburant", "Lavage"], horaires: "6h-21h", latitude: 12.2600, longitude: -2.3500 },
  { id: "st_64", nom: "Barka Energies Route Dédougou", adresse: "Sortie Route de Dédougou", ville: "Koudougou", quartier: "Secteur 5", region: "Boulkiemdé", telephone: "+226 25 44 40 40", marque: "barka", services: ["Carburant", "Boutique"], horaires: "6h-21h", latitude: 12.2550, longitude: -2.3580 },
  { id: "st_65", nom: "SONABHY Koudougou", adresse: "Zone Industrielle", ville: "Koudougou", quartier: "Zone Industrielle", region: "Boulkiemdé", telephone: "+226 25 44 50 50", marque: "sonabhy", services: ["Carburant", "GPL"], horaires: "6h-18h", latitude: 12.2480, longitude: -2.3680 },
  { id: "st_66", nom: "Petrofa Koudougou", adresse: "Boulevard de la Révolution", ville: "Koudougou", quartier: "Secteur 2", region: "Boulkiemdé", telephone: "+226 25 44 60 60", marque: "petrofa", services: ["Carburant"], horaires: "6h-20h", latitude: 12.2510, longitude: -2.3640 },
  
  // OUAHIGOUYA - 5 stations
  { id: "st_67", nom: "Barka Energies Ouahigouya", adresse: "Route de Djibo", ville: "Ouahigouya", quartier: "Centre-ville", region: "Yatenga", telephone: "+226 24 55 10 10", marque: "barka", services: ["Carburant", "Lavage", "Boutique"], horaires: "6h-22h", latitude: 13.5828, longitude: -2.4214 },
  { id: "st_68", nom: "Shell Ouahigouya", adresse: "Avenue de la Liberté", ville: "Ouahigouya", quartier: "Secteur 1", region: "Yatenga", telephone: "+226 24 55 20 20", marque: "shell", services: ["Carburant", "Boutique"], horaires: "6h-21h", latitude: 13.5850, longitude: -2.4200 },
  { id: "st_69", nom: "Oryx Ouahigouya", adresse: "Route de Ouagadougou", ville: "Ouahigouya", quartier: "Secteur 7", region: "Yatenga", telephone: "+226 24 55 30 30", marque: "oryx", services: ["Carburant", "Lavage"], horaires: "6h-21h", latitude: 13.5780, longitude: -2.4280 },
  { id: "st_70", nom: "Barka Energies Secteur 5", adresse: "Avenue de l'Indépendance", ville: "Ouahigouya", quartier: "Secteur 5", region: "Yatenga", telephone: "+226 24 55 40 40", marque: "barka", services: ["Carburant"], horaires: "6h-20h", latitude: 13.5870, longitude: -2.4180 },
  { id: "st_71", nom: "SONABHY Ouahigouya", adresse: "Zone de dépôt", ville: "Ouahigouya", quartier: "Secteur 3", region: "Yatenga", telephone: "+226 24 55 50 50", marque: "sonabhy", services: ["Carburant", "GPL"], horaires: "6h-18h", latitude: 13.5800, longitude: -2.4250 },
  
  // FADA N'GOURMA - 4 stations
  { id: "st_72", nom: "Barka Energies Fada", adresse: "Avenue Nationale", ville: "Fada N'Gourma", quartier: "Centre", region: "Gourma", telephone: "+226 24 77 10 10", marque: "barka", services: ["Carburant", "Lavage", "Boutique"], horaires: "6h-21h", latitude: 12.0614, longitude: 0.3581 },
  { id: "st_73", nom: "Shell Fada", adresse: "Route de Niamey", ville: "Fada N'Gourma", quartier: "Secteur 4", region: "Gourma", telephone: "+226 24 77 20 20", marque: "shell", services: ["Carburant", "Boutique"], horaires: "6h-21h", latitude: 12.0580, longitude: 0.3620 },
  { id: "st_74", nom: "Oryx Fada", adresse: "RN 4 Route du Niger", ville: "Fada N'Gourma", quartier: "Secteur 1", region: "Gourma", telephone: "+226 24 77 30 30", marque: "oryx", services: ["Carburant", "Lavage"], horaires: "6h-20h", latitude: 12.0650, longitude: 0.3600 },
  { id: "st_75", nom: "SONABHY Fada", adresse: "Zone de dépôt", ville: "Fada N'Gourma", quartier: "Secteur 2", region: "Gourma", telephone: "+226 24 77 40 40", marque: "sonabhy", services: ["Carburant", "GPL"], horaires: "6h-18h", latitude: 12.0630, longitude: 0.3550 },
  
  // KAYA - 4 stations
  { id: "st_76", nom: "Barka Energies Kaya", adresse: "Avenue Principale", ville: "Kaya", quartier: "Centre", region: "Sanmatenga", telephone: "+226 24 45 10 10", marque: "barka", services: ["Carburant", "Lavage", "Boutique"], horaires: "6h-21h", latitude: 13.0900, longitude: -1.0800 },
  { id: "st_77", nom: "Shell Kaya", adresse: "Route de Dori", ville: "Kaya", quartier: "Secteur 4", region: "Sanmatenga", telephone: "+226 24 45 20 20", marque: "shell", services: ["Carburant", "Boutique"], horaires: "6h-21h", latitude: 13.0880, longitude: -1.0820 },
  { id: "st_78", nom: "Oryx Kaya", adresse: "Route de Ouagadougou", ville: "Kaya", quartier: "Secteur 2", region: "Sanmatenga", telephone: "+226 24 45 30 30", marque: "oryx", services: ["Carburant"], horaires: "6h-20h", latitude: 13.0920, longitude: -1.0780 },
  { id: "st_79", nom: "SONABHY Kaya", adresse: "Zone de dépôt", ville: "Kaya", quartier: "Secteur 1", region: "Sanmatenga", telephone: "+226 24 45 40 40", marque: "sonabhy", services: ["Carburant", "GPL"], horaires: "6h-18h", latitude: 13.0940, longitude: -1.0760 },
  
  // DORI - 3 stations
  { id: "st_80", nom: "Barka Energies Dori", adresse: "Avenue Principale", ville: "Dori", quartier: "Centre", region: "Séno", telephone: "+226 24 46 10 10", marque: "barka", services: ["Carburant", "Boutique"], horaires: "6h-20h", latitude: 14.0353, longitude: -0.0345 },
  { id: "st_81", nom: "Shell Dori", adresse: "Route de Djibo", ville: "Dori", quartier: "Secteur 2", region: "Séno", telephone: "+226 24 46 20 20", marque: "shell", services: ["Carburant"], horaires: "6h-20h", latitude: 14.0380, longitude: -0.0300 },
  { id: "st_82", nom: "SONABHY Dori", adresse: "Zone de dépôt", ville: "Dori", quartier: "Secteur 1", region: "Séno", telephone: "+226 24 46 30 30", marque: "sonabhy", services: ["Carburant", "GPL"], horaires: "6h-18h", latitude: 14.0320, longitude: -0.0380 },
  
  // TENKODOGO - 4 stations
  { id: "st_83", nom: "Barka Energies Tenkodogo", adresse: "Avenue de la Nation", ville: "Tenkodogo", quartier: "Centre", region: "Boulgou", telephone: "+226 40 71 10 10", marque: "barka", services: ["Carburant", "Lavage", "Boutique"], horaires: "6h-21h", latitude: 11.7800, longitude: -0.3700 },
  { id: "st_84", nom: "Shell Tenkodogo", adresse: "Route de Fada", ville: "Tenkodogo", quartier: "Secteur 5", region: "Boulgou", telephone: "+226 40 71 20 20", marque: "shell", services: ["Carburant", "Boutique"], horaires: "6h-21h", latitude: 11.7850, longitude: -0.3650 },
  { id: "st_85", nom: "Oryx Tenkodogo", adresse: "Route de Ouagadougou", ville: "Tenkodogo", quartier: "Secteur 3", region: "Boulgou", telephone: "+226 40 71 30 30", marque: "oryx", services: ["Carburant"], horaires: "6h-20h", latitude: 11.7780, longitude: -0.3720 },
  { id: "st_86", nom: "SONABHY Tenkodogo", adresse: "Zone de dépôt", ville: "Tenkodogo", quartier: "Secteur 1", region: "Boulgou", telephone: "+226 40 71 40 40", marque: "sonabhy", services: ["Carburant", "GPL"], horaires: "6h-18h", latitude: 11.7820, longitude: -0.3680 },
  
  // ZINIARÉ - 3 stations
  { id: "st_87", nom: "Barka Energies Ziniaré", adresse: "Route Nationale", ville: "Ziniaré", quartier: "Centre", region: "Oubritenga", telephone: "+226 25 30 90 10", marque: "barka", services: ["Carburant", "Lavage", "Boutique"], horaires: "6h-21h", latitude: 12.5833, longitude: -1.3000 },
  { id: "st_88", nom: "Shell Ziniaré", adresse: "Route de Ouagadougou", ville: "Ziniaré", quartier: "Secteur 1", region: "Oubritenga", telephone: "+226 25 30 90 20", marque: "shell", services: ["Carburant", "Boutique"], horaires: "6h-21h", latitude: 12.5810, longitude: -1.3020 },
  { id: "st_89", nom: "Oryx Ziniaré", adresse: "Avenue de Ouagadougou", ville: "Ziniaré", quartier: "Secteur 2", region: "Oubritenga", telephone: "+226 25 30 90 30", marque: "oryx", services: ["Carburant"], horaires: "6h-20h", latitude: 12.5850, longitude: -1.2980 },
  
  // DÉDOUGOU - 4 stations
  { id: "st_90", nom: "Barka Energies Dédougou", adresse: "Avenue Principale", ville: "Dédougou", quartier: "Centre", region: "Mouhoun", telephone: "+226 20 52 10 10", marque: "barka", services: ["Carburant", "Lavage", "Boutique"], horaires: "6h-21h", latitude: 12.4633, longitude: -3.4600 },
  { id: "st_91", nom: "Shell Dédougou", adresse: "Route de Bobo", ville: "Dédougou", quartier: "Secteur 1", region: "Mouhoun", telephone: "+226 20 52 20 20", marque: "shell", services: ["Carburant", "Boutique"], horaires: "6h-21h", latitude: 12.4610, longitude: -3.4620 },
  { id: "st_92", nom: "Oryx Dédougou", adresse: "Route de Ouagadougou", ville: "Dédougou", quartier: "Secteur 3", region: "Mouhoun", telephone: "+226 20 52 30 30", marque: "oryx", services: ["Carburant"], horaires: "6h-20h", latitude: 12.4650, longitude: -3.4580 },
  { id: "st_93", nom: "SONABHY Dédougou", adresse: "Zone de dépôt", ville: "Dédougou", quartier: "Zone Industrielle", region: "Mouhoun", telephone: "+226 20 52 40 40", marque: "sonabhy", services: ["Carburant", "GPL"], horaires: "6h-18h", latitude: 12.4600, longitude: -3.4650 },
  
  // GAOUA - 3 stations
  { id: "st_94", nom: "Barka Energies Gaoua", adresse: "Avenue de l'Indépendance", ville: "Gaoua", quartier: "Centre", region: "Poni", telephone: "+226 20 87 10 10", marque: "barka", services: ["Carburant", "Boutique"], horaires: "6h-20h", latitude: 10.3250, longitude: -3.1750 },
  { id: "st_95", nom: "Shell Gaoua", adresse: "Route de Bobo", ville: "Gaoua", quartier: "Secteur 2", region: "Poni", telephone: "+226 20 87 20 20", marque: "shell", services: ["Carburant"], horaires: "6h-20h", latitude: 10.3270, longitude: -3.1730 },
  { id: "st_96", nom: "SONABHY Gaoua", adresse: "Zone de dépôt", ville: "Gaoua", quartier: "Secteur 1", region: "Poni", telephone: "+226 20 87 30 30", marque: "sonabhy", services: ["Carburant", "GPL"], horaires: "6h-18h", latitude: 10.3230, longitude: -3.1770 },
  
  // PÔ - 2 stations
  { id: "st_97", nom: "Barka Energies Pô", adresse: "Avenue Principale", ville: "Pô", quartier: "Centre", region: "Nahouri", telephone: "+226 40 48 10 10", marque: "barka", services: ["Carburant", "Boutique"], horaires: "6h-20h", latitude: 11.1667, longitude: -1.1500 },
  { id: "st_98", nom: "Shell Pô", adresse: "Route de Ouagadougou", ville: "Pô", quartier: "Secteur 1", region: "Nahouri", telephone: "+226 40 48 20 20", marque: "shell", services: ["Carburant"], horaires: "6h-20h", latitude: 11.1680, longitude: -1.1480 },
  
  // HOUNDÉ - 2 stations
  { id: "st_99", nom: "Barka Energies Houndé", adresse: "Route Nationale", ville: "Houndé", quartier: "Centre", region: "Tuy", telephone: "+226 20 94 10 10", marque: "barka", services: ["Carburant", "Boutique"], horaires: "6h-20h", latitude: 11.4900, longitude: -3.5200 },
  { id: "st_100", nom: "Oryx Houndé", adresse: "RN 1 Route de Bobo", ville: "Houndé", quartier: "Secteur 2", region: "Tuy", telephone: "+226 20 94 20 20", marque: "oryx", services: ["Carburant", "Lavage"], horaires: "6h-20h", latitude: 11.4920, longitude: -3.5180 },
  
  // ORODARA - 2 stations
  { id: "st_101", nom: "Barka Energies Orodara", adresse: "Route de Bobo", ville: "Orodara", quartier: "Centre", region: "Kénédougou", telephone: "+226 20 93 10 10", marque: "barka", services: ["Carburant", "Boutique"], horaires: "6h-20h", latitude: 10.9750, longitude: -4.9100 },
  { id: "st_102", nom: "Oryx Orodara", adresse: "RN 8", ville: "Orodara", quartier: "Secteur 1", region: "Kénédougou", telephone: "+226 20 93 20 20", marque: "oryx", services: ["Carburant"], horaires: "6h-19h", latitude: 10.9770, longitude: -4.9080 },
  
  // LÉNA - 1 station
  { id: "st_103", nom: "Barka Energies Léna", adresse: "RN 1", ville: "Léna", quartier: "Centre", region: "Houet", telephone: "+226 20 96 10 10", marque: "barka", services: ["Carburant"], horaires: "6h-19h", latitude: 11.3500, longitude: -4.0200 },
  
  // BOROMO - 2 stations
  { id: "st_104", nom: "Barka Energies Boromo", adresse: "RN 1", ville: "Boromo", quartier: "Centre", region: "Balé", telephone: "+226 20 51 10 10", marque: "barka", services: ["Carburant", "Boutique"], horaires: "6h-20h", latitude: 11.7450, longitude: -2.9300 },
  { id: "st_105", nom: "Shell Boromo", adresse: "Route de Ouagadougou", ville: "Boromo", quartier: "Secteur 1", region: "Balé", telephone: "+226 20 51 20 20", marque: "shell", services: ["Carburant"], horaires: "6h-20h", latitude: 11.7470, longitude: -2.9280 },
  
  // SABOU - 1 station
  { id: "st_106", nom: "Barka Energies Sabou", adresse: "RN 1", ville: "Sabou", quartier: "Centre", region: "Boulkiemdé", telephone: "+226 25 45 10 10", marque: "barka", services: ["Carburant"], horaires: "6h-19h", latitude: 12.0700, longitude: -2.2400 },
  
  // MANGA - 2 stations
  { id: "st_107", nom: "Barka Energies Manga", adresse: "Avenue Principale", ville: "Manga", quartier: "Centre", region: "Zoundwéogo", telephone: "+226 40 47 10 10", marque: "barka", services: ["Carburant", "Boutique"], horaires: "6h-20h", latitude: 11.6600, longitude: -1.0700 },
  { id: "st_108", nom: "Shell Manga", adresse: "Route de Pô", ville: "Manga", quartier: "Secteur 1", region: "Zoundwéogo", telephone: "+226 40 47 20 20", marque: "shell", services: ["Carburant"], horaires: "6h-20h", latitude: 11.6620, longitude: -1.0680 },
  
  // KONGOUSSI - 2 stations
  { id: "st_109", nom: "Barka Energies Kongoussi", adresse: "RN 22", ville: "Kongoussi", quartier: "Centre", region: "Bam", telephone: "+226 24 42 10 10", marque: "barka", services: ["Carburant", "Boutique"], horaires: "6h-20h", latitude: 13.3250, longitude: -1.5300 },
  { id: "st_110", nom: "Oryx Kongoussi", adresse: "Route de Ouahigouya", ville: "Kongoussi", quartier: "Secteur 1", region: "Bam", telephone: "+226 24 42 20 20", marque: "oryx", services: ["Carburant"], horaires: "6h-19h", latitude: 13.3270, longitude: -1.5280 }
];

import { REGION_NAMES } from "@/lib/regions";

const REGIONS = REGION_NAMES;

const MARQUES = [
  { value: "all", label: "Toutes les marques" },
  { value: "barka", label: "⛽ Barka Energies (ex-Total)" },
  { value: "shell", label: "🐚 Shell" },
  { value: "oryx", label: "🦌 Oryx Energies" },
  { value: "sonabhy", label: "🏭 SONABHY" },
  { value: "petrofa", label: "⛽ Petrofa" },
  { value: "sipe", label: "⛽ SIPE" }
];

export default function StationsService() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRegion, setSelectedRegion] = useState<string>("all");
  const [selectedMarque, setSelectedMarque] = useState<string>("all");
  const [showNearestOnly, setShowNearestOnly] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const calculateDistance = useCallback((lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }, []);

  const handleNearestFilter = useCallback(() => {
    if (showNearestOnly) {
      setShowNearestOnly(false);
      return;
    }
    if (userLocation) {
      setShowNearestOnly(true);
      return;
    }
    setIsLocating(true);
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const loc = { lat: position.coords.latitude, lng: position.coords.longitude };
          setUserLocation(loc);
          setShowNearestOnly(true);
          setIsLocating(false);
          toast({ title: "Position trouvee", description: "Affichage des stations les plus proches" });
        },
        () => {
          setIsLocating(false);
          toast({ title: "Erreur de localisation", description: "Impossible d'obtenir votre position", variant: "destructive" });
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
      );
    } else {
      setIsLocating(false);
      toast({ title: "Non supporte", description: "Geolocalisation non supportee", variant: "destructive" });
    }
  }, [showNearestOnly, userLocation, toast]);

  const filteredStations = useMemo(() => {
    let filtered = STATIONS_DATA;

    if (selectedRegion !== "all") {
      filtered = filtered.filter(s => s.region === selectedRegion);
    }

    if (selectedMarque !== "all") {
      filtered = filtered.filter(s => s.marque === selectedMarque);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(s =>
        s.nom.toLowerCase().includes(query) ||
        s.ville.toLowerCase().includes(query) ||
        s.quartier.toLowerCase().includes(query) ||
        s.adresse.toLowerCase().includes(query)
      );
    }

    if (showNearestOnly && userLocation) {
      filtered = filtered
        .map(s => ({
          ...s,
          distance: calculateDistance(userLocation.lat, userLocation.lng, s.latitude, s.longitude)
        }))
        .sort((a, b) => (a.distance || 0) - (b.distance || 0))
        .slice(0, 20);
    }

    return filtered;
  }, [searchQuery, selectedRegion, selectedMarque, showNearestOnly, userLocation, calculateDistance]);

  const openInMaps = (station: StationService) => {
    const url = `https://www.google.com/maps/search/?api=1&query=${station.latitude},${station.longitude}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const getMarqueColor = (marque: string) => {
    switch (marque) {
      case "barka": return "bg-red-600 text-white";
      case "shell": return "bg-yellow-500 text-black";
      case "oryx": return "bg-orange-500 text-white";
      case "sonabhy": return "bg-blue-600 text-white";
      case "petrofa": return "bg-green-600 text-white";
      case "sipe": return "bg-purple-600 text-white";
      case "star-oil": return "bg-indigo-600 text-white";
      case "libya-oil": return "bg-teal-600 text-white";
      default: return "bg-gray-500 text-white";
    }
  };

  const getMarqueLabel = (marque: string) => {
    switch (marque) {
      case "barka": return "Barka Energies";
      case "shell": return "Shell";
      case "oryx": return "Oryx";
      case "sonabhy": return "SONABHY";
      case "petrofa": return "Petrofa";
      case "sipe": return "SIPE";
      case "star-oil": return "Star Oil";
      case "libya-oil": return "Libya Oil";
      default: return marque;
    }
  };

  const stats = useMemo(() => {
    const byMarque = STATIONS_DATA.reduce((acc, s) => {
      acc[s.marque] = (acc[s.marque] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const byVille = STATIONS_DATA.reduce((acc, s) => {
      acc[s.ville] = (acc[s.ville] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return { byMarque, byVille, total: STATIONS_DATA.length };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white dark:from-gray-900 dark:to-gray-800 pb-20">
      <Helmet>
        <title>Stations-Service - Burkina Watch</title>
      </Helmet>
      <Header />

      <main className="container mx-auto px-4 py-6">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/">
            <Button variant="ghost" size="icon" data-testid="button-back">
              <ChevronLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2 text-foreground">
              <Fuel className="w-7 h-7 text-orange-600" />
              Stations-Service
            </h1>
            <p className="text-muted-foreground text-sm">
              {stats.total} stations répertoriées au Burkina Faso
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card className="relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 group bg-gradient-to-br from-orange-500/10 to-orange-500/5 border-orange-500/20">
            <CardContent className="p-4 relative z-10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Stations</p>
                  <span className="text-2xl font-bold tracking-tight">{filteredStations.length}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-orange-500/10 group-hover:scale-110 transition-transform">
                  <Fuel className="w-5 h-5 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 group bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20">
            <CardContent className="p-4 relative z-10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">24h/24</p>
                  <span className="text-2xl font-bold tracking-tight">{filteredStations.filter(s => s.horaires === "24h/24").length}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-blue-500/10 group-hover:scale-110 transition-transform">
                  <Clock className="w-5 h-5 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 group bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
            <CardContent className="p-4 relative z-10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Villes</p>
                  <span className="text-2xl font-bold tracking-tight">{new Set(filteredStations.map(s => s.ville)).size}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-green-500/10 group-hover:scale-110 transition-transform">
                  <MapPin className="w-5 h-5 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 group bg-gradient-to-br from-cyan-500/10 to-cyan-500/5 border-cyan-500/20">
            <CardContent className="p-4 relative z-10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">GPL/Gaz</p>
                  <span className="text-2xl font-bold tracking-tight">{filteredStations.filter(s => s.services.includes("GPL")).length}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-cyan-500/10 group-hover:scale-110 transition-transform">
                  <Droplets className="w-5 h-5 text-cyan-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 group bg-gradient-to-br from-red-500/10 to-red-500/5 border-red-500/20">
            <CardContent className="p-4 relative z-10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Marques</p>
                  <span className="text-2xl font-bold tracking-tight">{new Set(filteredStations.map(s => s.marque)).size}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-red-500/10 group-hover:scale-110 transition-transform">
                  <Building2 className="w-5 h-5 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtres */}
        <Card className="mb-6 border-orange-200 dark:border-orange-800">
          <CardContent className="p-4">
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Rechercher une station..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-10"
                  data-testid="input-search-stations"
                />
                <VoiceSearchButton
                  onResult={setSearchQuery}
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <Select value={selectedRegion} onValueChange={setSelectedRegion}>
                  <SelectTrigger data-testid="select-region">
                    <SelectValue placeholder="Région" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes les régions</SelectItem>
                    {REGIONS.map(region => (
                      <SelectItem key={region} value={region}>{region}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={selectedMarque} onValueChange={setSelectedMarque}>
                  <SelectTrigger data-testid="select-marque">
                    <SelectValue placeholder="Marque" />
                  </SelectTrigger>
                  <SelectContent>
                    {MARQUES.map(marque => (
                      <SelectItem key={marque.value} value={marque.value}>{marque.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex gap-2 mt-3">
                <Button
                  variant={showNearestOnly ? "default" : "outline"}
                  onClick={handleNearestFilter}
                  disabled={isLocating}
                  data-testid="button-nearest-filter"
                >
                  {isLocating ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Locate className="h-4 w-4 mr-2" />
                  )}
                  {showNearestOnly ? "Voir tout" : "Les plus proches"}
                </Button>
                {showNearestOnly && (
                  <Badge className="bg-primary text-white self-center">
                    20 plus proches
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Résultats */}
        <div className="mb-4">
          <p className="text-sm text-muted-foreground">
            {filteredStations.length} station{filteredStations.length > 1 ? 's' : ''} trouvée{filteredStations.length > 1 ? 's' : ''}
          </p>
        </div>

        {/* Liste des stations */}
        <div className="space-y-4">
          {filteredStations.map((station) => (
            <Card 
              key={station.id} 
              className="overflow-hidden hover:shadow-lg transition-shadow border-l-4"
              style={{ borderLeftColor: station.marque === 'barka' ? '#dc2626' : station.marque === 'shell' ? '#eab308' : station.marque === 'oryx' ? '#f97316' : '#3b82f6' }}
              data-testid={`card-station-${station.id}`}
            >
              <CardContent className="p-4">
                {(station as any).distance !== undefined && (
                  <div className="bg-primary/10 border border-primary/20 rounded-md p-2 flex items-center gap-2 mb-3">
                    <Locate className="h-4 w-4 text-primary" />
                    <span className="text-sm font-semibold text-primary">
                      {(station as any).distance < 1 
                        ? `${Math.round((station as any).distance * 1000)} m` 
                        : `${(station as any).distance.toFixed(1)} km`}
                    </span>
                    <span className="text-xs text-muted-foreground">de vous</span>
                  </div>
                )}
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-foreground">{station.nom}</h3>
                      <Badge className={`text-xs ${getMarqueColor(station.marque)}`}>
                        {getMarqueLabel(station.marque)}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <MapPin className="w-3 h-3" />
                      <span>{station.adresse}, {station.quartier}</span>
                    </div>
                    <p className="text-sm font-medium text-orange-600 dark:text-orange-400">{station.ville}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 mb-3 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="w-4 h-4" />
                    <a href={`tel:${station.telephone}`} className="hover:text-primary">
                      {station.telephone}
                    </a>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    <span className={station.horaires === "24h/24" ? "text-green-600 font-medium" : ""}>
                      {station.horaires}
                    </span>
                  </div>
                </div>

                {/* Services */}
                <div className="flex flex-wrap gap-1 mb-3">
                  {station.services.map((service, idx) => (
                    <Badge key={idx} variant="outline" className="text-xs">
                      {service === "Carburant" && <Fuel className="w-3 h-3 mr-1" />}
                      {service === "Lavage" && <Droplets className="w-3 h-3 mr-1" />}
                      {service}
                    </Badge>
                  ))}
                </div>

                <LocationValidator placeId={station.placeId || station.id} initialConfirmations={station.confirmations || 0} initialReports={station.reports || 0} compact />
                <Button
                  size="sm"
                  className="w-full gap-2 bg-orange-600 hover:bg-orange-700 text-white"
                  onClick={() => openInMaps(station)}
                  data-testid={`button-maps-${station.id}`}
                >
                  <Navigation className="w-4 h-4" />
                  Voir sur Google Maps
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredStations.length === 0 && (
          <Card className="p-8 text-center">
            <Fuel className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Aucune station trouvée</h3>
            <p className="text-muted-foreground">
              Essayez de modifier vos critères de recherche
            </p>
          </Card>
        )}
      </main>

      <BottomNav />
      <EmergencyPanel />
    </div>
  );
}
