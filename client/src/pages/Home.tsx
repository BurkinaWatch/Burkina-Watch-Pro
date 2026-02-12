import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import EmergencyPanel from "@/components/EmergencyPanel";
import SignalementCard from "@/components/SignalementCard";
import StatCard from "@/components/StatCard";
import MessageDuJour from "@/components/MessageDuJour";
import { RiskZonesPanel, RecommendationsPanel } from "@/components/RiskAnalysis";
import { WeatherAlertsBanner } from "@/components/WeatherAlerts";
import { NewsTicker } from "@/components/NewsTicker";
import { AlertCircle, Shield, Users, TrendingUp, ArrowRight, Loader2, Heart, AlertTriangle, Search, X, MapPin, Filter, BookOpen, Download, Phone, MessageCircle, Mail } from "lucide-react";
import { VoiceSearchButton } from "@/components/VoiceSearchButton";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import type { Signalement } from "@shared/schema";
import heroImage from "@assets/generated_images/Citizens_collaborating_with_smartphones_in_Burkina_68dc35a5.png";
import { useTranslation } from "react-i18next";
import { useState, useEffect } from "react";

interface Stats {
  totalSignalements: number;
  sosCount: number;
  totalUsers: number;
  onlineUsers: number;
}

// Données géographiques complètes du Burkina Faso - 17 régions et 47 provinces
const BURKINA_REGIONS = [
  {
    name: 'Bankui',
    chefLieu: 'Dédougou',
    provinces: [
      { name: 'Mouhoun', chefLieu: 'Dédougou', communes: ['Bondokuy', 'Dédougou', 'Douroula', 'Kona', 'Ouarkoye', 'Safané', 'Tchériba'] },
      { name: 'Balé', chefLieu: 'Boromo', communes: ['Bagassi', 'Bana', 'Boromo', 'Fara', 'Pa', 'Pompoï', 'Poura', 'Oury', 'Siby', 'Yaho'] },
      { name: 'Banwa', chefLieu: 'Solenzo', communes: ['Balavé', 'Kouka', 'Sami', 'Sanaba', 'Solenzo', 'Tansila'] },
      { name: 'Kossi', chefLieu: 'Nouna', communes: ['Barani', 'Bomborokuy', 'Dédougou', 'Djibasso', 'Doumbala', 'Kombori', 'Madouba', 'Nouna', 'Sont', 'Toma'] },
      { name: 'Nayala', chefLieu: 'Toma', communes: ['Gassan', 'Gossina', 'Kougny', 'Toma', 'Yaba', 'Yé'] },
      { name: 'Sourou', chefLieu: 'Tougan', communes: ['Di', 'Gomboro', 'Kassoum', 'Kiembara', 'Lanfièra', 'Lankoué', 'Tougan'] }
    ]
  },
  {
    name: 'Djôrô',
    chefLieu: 'Gaoua',
    provinces: [
      { name: 'Bougouriba', chefLieu: 'Diébougou', communes: ['Gbondjigui', 'Diébougou', 'Dolo', 'Nioronioro', 'Tiankoura'] },
      { name: 'Ioba', chefLieu: 'Dano', communes: ['Dano', 'Dissihn', 'Guéguéré', 'Koper', 'Niégo', 'Oronkua', 'Ouéssa', 'Zambo'] },
      { name: 'Noumbiel', chefLieu: 'Batié', communes: ['Batié', 'Boussoukoula', 'Kpéré', 'Legmoin', 'Midebdo'] },
      { name: 'Poni', chefLieu: 'Gaoua', communes: ['Bouroum-Bouroum', 'Bousséra', 'Djigouè', 'Gaoua', 'Gbomblora', 'Kampti', 'Loropéni', 'Malba', 'Nako', 'Périgban'] }
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
      { name: 'Houet', chefLieu: 'Bobo-Dioulasso', communes: ['Bama', 'Bobo-Dioulasso', 'Dandé', 'Karangasso-Sambla', 'Karangasso-Viguè', 'Koundougou', 'Faramana', 'Fô', 'Léna', 'Padéma', 'Péni', 'Satiri', 'Toussiana'] },
      { name: 'Kénédougou', chefLieu: 'Orodara', communes: ['Banzon', 'Djigouèra', 'Kangala', 'Kayan', 'Koloko', 'Kourouma', 'Kourinion', 'Morolaba', 'N\'Dorola', 'Orodara', 'Samôgôyiri', 'Samorogouan', 'Sindo'] },
      { name: 'Tuy', chefLieu: 'Houndé', communes: ['Béréba', 'Boni', 'Boura', 'Houndé', 'Koti', 'Koumbia'] }
    ]
  },
  {
    name: 'Kadiogo',
    chefLieu: 'Ouagadougou',
    provinces: [
      { name: 'Kadiogo', chefLieu: 'Ouagadougou', communes: ['Ouagadougou', 'Komki-Ipala', 'Komsilga', 'Koubri', 'Pabré', 'Saaba', 'Tanghin-Dassouri'] }
    ]
  },
  {
    name: 'Koom-Kuuli',
    chefLieu: 'Réo',
    provinces: [
      { name: 'Boulkiemdé', chefLieu: 'Koudougou', communes: ['Bingo', 'Imasgo', 'Kindi', 'Kokologho', 'Koudougou', 'Kokologo', 'Nanoro', 'Pella', 'Poa', 'Ramongo', 'Sabou', 'Siglé', 'Soaw', 'Sourgou', 'Thyou'] },
      { name: 'Sanguié', chefLieu: 'Réo', communes: ['Dassa', 'Didyr', 'Godyr', 'Kordié', 'Kyon', 'Pouni', 'Réo', 'Ténado', 'Zawara'] },
      { name: 'Sissili', chefLieu: 'Léo', communes: ['Biéha', 'Boura', 'Lèo', 'Nébiélianayou', 'Niabouri', 'Silly', 'Tô'] },
      { name: 'Ziro', chefLieu: 'Sapouy', communes: ['Bakata', 'Bougnounou', 'Cassou', 'Dalo', 'Gao', 'Sapouy'] }
    ]
  },
  {
    name: 'Kom-Pangala',
    chefLieu: 'Tenkodogo',
    provinces: [
      { name: 'Boulgou', chefLieu: 'Tenkodogo', communes: ['Bané', 'Bittou', 'Bagré', 'Béguédo', 'Bissiga', 'Garango', 'Komtoéga', 'Niaogho', 'Tenkodogo', 'Zabré', 'Zoaga', 'Zonsé'] },
      { name: 'Koulpélogo', chefLieu: 'Ouargaye', communes: ['Comin-Yanga', 'Lalgaye', 'Ouargaye', 'Sangha', 'Soudougui', 'Yargatenga'] },
      { name: 'Kouritenga', chefLieu: 'Koupéla', communes: ['Andemtenga', 'Baskouré', 'Dialgaye', 'Gounghin', 'Kando', 'Koupéla', 'Pouytenga', 'Tensobentenga', 'Yargo'] }
    ]
  },
  {
    name: 'Nakambga',
    chefLieu: 'Ziniaré',
    provinces: [
      { name: 'Ganzourgou', chefLieu: 'Zorgho', communes: ['Boudry', 'Cognoré', 'Méguet', 'Mogtédo', 'Zam', 'Zorgho', 'Zoungou'] },
      { name: 'Kourwéogo', chefLieu: 'Boussé', communes: ['Boussé', 'Laye', 'Niou', 'Sourgoubila'] },
      { name: 'Oubritenga', chefLieu: 'Ziniaré', communes: ['Absouya', 'Dapélogo', 'Loumbila', 'Nagréongo', 'Ziniaré', 'Zitenga'] }
    ]
  },
  {
    name: 'Passoré',
    chefLieu: 'Yako',
    provinces: [
      { name: 'Passoré', chefLieu: 'Yako', communes: ['Arbollé', 'Bagaré', 'Bokin', 'Bourzanga', 'Gomponsom', 'Kirsi', 'La-Todin', 'Pilimpikou', 'Samba', 'Yako'] }
    ]
  },
  {
    name: 'Poni-Tiari',
    chefLieu: 'Banfora',
    provinces: [
      { name: 'Comoé', chefLieu: 'Banfora', communes: ['Banfora', 'Bérégadougou', 'Douna', 'Mangodara', 'Moussodougou', 'Niangoloko', 'Ouo', 'Sidéradougou', 'Soubakaniédougou', 'Tiéfora'] },
      { name: 'Léraba', chefLieu: 'Sindou', communes: ['Dakoro', 'Doussié', 'Loumana', 'Niankorodougou', 'Ouéléni', 'Sindou', 'Wolonkoto'] }
    ]
  },
  {
    name: 'Sahel',
    chefLieu: 'Dori',
    provinces: [
      { name: 'Oudalan', chefLieu: 'Gorom-Gorom', communes: ['Déou', 'Gorom-Gorom', 'Markoye', 'Oursi', 'Tin-Akof'] },
      { name: 'Séno', chefLieu: 'Dori', communes: ['Bani', 'Boundoré', 'Dori', 'Falagountou', 'Gandafabou', 'Gorgadji', 'Sampelga', 'Seytenga'] },
      { name: 'Soum', chefLieu: 'Djibo', communes: ['Aribinda', 'Baraboulé', 'Djibo', 'Tongomayel', 'Kelbo', 'Nassoumbou', 'Pobé-Mengao'] },
      { name: 'Yagha', chefLieu: 'Sebba', communes: ['Boundoré', 'Mansila', 'Sebba', 'Sollé', 'Tankougounadié', 'Titabé'] }
    ]
  },
  {
    name: 'Taar-Soomba',
    chefLieu: 'Manga',
    provinces: [
      { name: 'Bazèga', chefLieu: 'Kombissiri', communes: ['Doulougou', 'Gaongo', 'Ipelcé', 'Kayao', 'Kombissiri', 'Saponé', 'Toécé'] },
      { name: 'Nahouri', chefLieu: 'Pô', communes: ['Guiaro', 'Pô', 'Tiébélé', 'Ziou'] },
      { name: 'Zoundwéogo', chefLieu: 'Manga', communes: ['Béré', 'Bindé', 'Gogo', 'Gomboussougou', 'Guiba', 'Manga'] }
    ]
  },
  {
    name: 'Taoud-Weogo',
    chefLieu: 'Ouahigouya',
    provinces: [
      { name: 'Loroum', chefLieu: 'Titao', communes: ['Ouindigui', 'Sollé', 'Soum', 'Titao'] },
      { name: 'Yatenga', chefLieu: 'Ouahigouya', communes: ['Bahn', 'Kalsaka', 'Kaïn', 'Koumbri', 'Namissiguima', 'Ouahigouya', 'Oula', 'Rambo', 'Séguénéga', 'Tangaye', 'Thiou', 'Zogoré'] },
      { name: 'Zandoma', chefLieu: 'Gourcy', communes: ['Bassi', 'Boussou', 'Gourcy', 'Léba', 'Soubou', 'Tougo'] }
    ]
  },
  {
    name: 'Tondeka',
    chefLieu: 'Kaya',
    provinces: [
      { name: 'Bam', chefLieu: 'Kongoussi', communes: ['Bourzanga', 'Guibaré', 'Kongoussi', 'Nasséré', 'Rollo', 'Rouko', 'Sabcé', 'Tikaré', 'Zimtenga'] },
      { name: 'Namentenga', chefLieu: 'Boulsa', communes: ['Boala', 'Boulsa', 'Bouroum', 'Dargo', 'Nagbingou', 'Tougouri', 'Yalgo', 'Zéguédéguin'] },
      { name: 'Sanmatenga', chefLieu: 'Kaya', communes: ['Barsalogho', 'Boussouma', 'Dablo', 'Kaya', 'Korsimoro', 'Mané', 'Pensa', 'Pibaoré', 'Pibaroré', 'Pissila'] }
    ]
  },
  {
    name: 'Wètemga',
    chefLieu: 'Manga',
    provinces: [
      { name: 'Gnagna', chefLieu: 'Bogandé', communes: ['Bilanga', 'Bogandé', 'Coalla', 'Liptougou', 'Manni', 'Piéla', 'Thion'] },
      { name: 'Komondjari', chefLieu: 'Gayéri', communes: ['Bartiébougou', 'Foutouri', 'Gayéri'] }
    ]
  },
  {
    name: 'Yirka-Gaongo',
    chefLieu: 'Koudougou',
    provinces: [
      { name: 'Balé', chefLieu: 'Boromo', communes: ['Bagassi', 'Bana', 'Boromo', 'Fara', 'Pa', 'Pompoï', 'Poura', 'Oury', 'Siby', 'Yaho'] }
    ]
  },
  {
    name: 'Yonyoosé',
    chefLieu: 'Fada N\'Gourma',
    provinces: [
      { name: 'Gnagna', chefLieu: 'Bogandé', communes: ['Bilanga', 'Bogandé', 'Coalla', 'Liptougou', 'Manni', 'Piéla', 'Thion'] }
    ]
  }
];

function SecurityNotesDialog() {
  const exportToPDF = async () => {
    // Import dynamique de jsPDF
    const { default: jsPDF } = await import('jspdf');
    
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    const maxWidth = pageWidth - 2 * margin;
    let yPosition = margin;

    // Fonction pour ajouter du texte avec retour à la ligne automatique
    const addText = (text: string, fontSize: number = 10, isBold: boolean = false, isTitle: boolean = false) => {
      doc.setFontSize(fontSize);
      if (isBold) {
        doc.setFont('helvetica', 'bold');
      } else {
        doc.setFont('helvetica', 'normal');
      }

      const lines = doc.splitTextToSize(text, maxWidth);
      
      for (let i = 0; i < lines.length; i++) {
        if (yPosition + 7 > pageHeight - margin) {
          doc.addPage();
          yPosition = margin;
        }
        
        if (isTitle) {
          doc.setTextColor(200, 0, 0);
        } else {
          doc.setTextColor(0, 0, 0);
        }
        
        doc.text(lines[i], margin, yPosition);
        yPosition += fontSize * 0.5;
      }
      
      yPosition += 3;
    };

    const addSeparator = () => {
      yPosition += 2;
      doc.setDrawColor(200, 200, 200);
      doc.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 4;
    };

    // En-tête
    doc.setFillColor(220, 38, 38);
    doc.rect(0, 0, pageWidth, 25, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('NOTES IMPORTANTES', pageWidth / 2, 12, { align: 'center' });
    doc.setFontSize(12);
    doc.text('Conseils de sécurité pour utiliser BurkinaWatch', pageWidth / 2, 19, { align: 'center' });
    
    yPosition = 35;
    doc.setTextColor(0, 0, 0);

    // Contenu
    addText('Cette page rassemble conseils pratiques, règles et bonnes pratiques pour utiliser BurkinaWatch en toute sécurité — protéger ta personne, tes proches et la crédibilité des signalements.', 9);
    addSeparator();

    // Contact en haut
    doc.setFillColor(240, 240, 240);
    doc.rect(margin, yPosition, maxWidth, 20, 'F');
    yPosition += 5;
    addText('CONTACT & SUPPORT', 11, true);
    addText('Email: contact@burkinawatch.com', 9);
    addText('Téléphone: +226 65511323', 9);
    addText('WhatsApp: +226 70019540', 9);
    yPosition += 3;
    addSeparator();

    // Sections
    const sections = [
      { title: '1) RAPPEL : OBJECTIF DE L\'APPLICATION', content: 'BurkinaWatch permet de signaler, alerter et partager des faits d\'intérêt public (danger, incivilités, urgences, etc.). L\'objectif est d\'augmenter la sécurité collective — pas de remplacer les secours.' },
      { title: '2) AVANT DE FILMER / PRENDRE UNE PHOTO : ÉVALUE TA SÉCURITÉ', content: '• Priorité : ta vie d\'abord. Si dangereuse (violence, attaque, incendie), recule et appelle les secours.\n• Ne provoque pas : ne t\'expose pas physiquement.\n• Filme depuis un endroit sûr.\n• Évite les confrontations.' },
      { title: '3) PROTÉGER TON ANONYMAT', content: '• Active l\'option Anonyme lors de la publication.\n• N\'inclus jamais ton nom complet ou adresse.\n• Préfère le canal sécurisé pour contacter les autorités.' },
      { title: '4) LORS DE LA CAPTURE D\'IMAGES / VIDÉOS', content: '• Stabilise l\'image au maximum.\n• Capture l\'essentiel : personnes, lieu, date/heure.\n• Ne retouche pas la réalité.\n• Utilise le floutage pour protéger l\'identité.\n• Conserve l\'original.' },
      { title: '5) MÉTADONNÉES ET GÉOLOCALISATION', content: '• Les photos contiennent des métadonnées (EXIF).\n• Conserve-les pour prouver un fait.\n• Supprime-les pour protéger un témoin.' },
      { title: '6) RÉDIGER UN SIGNALEMENT UTILE', content: 'Fournis des informations claires et factuelles :\n• Titre précis\n• Description détaillée avec localisation\n• Pièces jointes pertinentes\n• Choix anonymat' },
      { title: '7) VÉRIFIER AVANT DE PUBLIER', content: '• Ne publie pas de rumeur.\n• Vérifie la source et la date.\n• Utilise le signalement interne si doute.' },
      { title: '8) SI TU ES VICTIME OU TÉMOIN D\'UN CRIME', content: '• Appelle immédiatement les forces de l\'ordre.\n• Filme depuis un endroit sûr.\n• N\'essaye pas de juger toi-même.' },
      { title: '9) PROTÉGER LES MINEURS ET PERSONNES VULNÉRABLES', content: '• Ne publie jamais d\'image d\'enfant sans consentement.\n• Utilise le canal SOS pour violences sexuelles.' },
      { title: '10) UTILISATION INTELLIGENTE DU BOUTON SOS', content: '• Réserve le SOS aux urgences réelles.\n• Pour incidents non urgents, utilise Signalement normal.\n• L\'abus retarde les véritables interventions.' },
      { title: '11) INTERACTION AVEC D\'AUTRES UTILISATEURS', content: '• Respecte la charte : pas d\'insultes, propos haineux.\n• Signale les abus.\n• Ne diffuse pas d\'infos personnelles sans consentement.' },
      { title: '12) RÉCEPTION D\'UNE RÉPONSE / SUIVI', content: '• Suis le statut : Reçu → En revue → Pris en charge → Résolu.\n• Utilise la fonction appel si insuffisant.\n• Conserve les preuves.' },
      { title: '13) SÉCURITÉ NUMÉRIQUE ET MOT DE PASSE', content: '• Mot de passe fort et unique.\n• Active 2FA si disponible.\n• Ne partage jamais tes identifiants.' },
      { title: '14) QUE FAIRE SI QUELQU\'UN TE MENACE ?', content: '• Ne réponds pas aux menaces.\n• Capture les preuves.\n• Signale dans l\'app et contacte la police.' },
      { title: '15) SÉCURITÉ ÉCRAN DE VEILLE', content: '• Ne mets que le numéro essentiel.\n• Teste avant utilisation critique.' },
      { title: '16) PROTECTION DES PREUVES', content: '• Garde une copie non compressée.\n• Ne supprime pas tant que l\'enquête n\'est pas terminée.\n• Utilise le canal sécurisé.' },
      { title: '17) RÈGLES À RESPECTER — RÉSUMÉ', content: 'DO ✓ : Signaler rapidement, Protéger ta sécurité, Masquer visages, Utiliser anonymat, Conserver originaux\n\nDON\'T ✗ : Risques physiques, Rumeurs, Harcèlement, Données personnelles sans consentement' },
      { title: '18) QUESTIONS FRÉQUENTES (FAQ)', content: 'Q : Rester anonyme ?\nR : Active "Publier anonymement"\n\nQ : Données fournies à la police ?\nR : Données chiffrées, accès encadré légalement\n\nQ : Flouter un visage ?\nR : Outil intégré avant publication\n\nQ : Menaces après signalement ?\nR : Capture preuves, signale, contacte police' },
      { title: '19) REMARQUE FINALE', content: 'BurkinaWatch est un outil collectif : son efficacité dépend de la qualité et de la responsabilité des signalements. En respectant ces conseils, tu protèges ta sécurité, tu aides les autres et tu renforces la confiance entre citoyens et autorités.\n\nMerci d\'agir avec responsabilité — ta vigilance sauve des vies.' }
    ];

    sections.forEach((section, index) => {
      if (yPosition > pageHeight - 50) {
        doc.addPage();
        yPosition = margin;
      }
      addText(section.title, 11, true, true);
      addText(section.content, 9);
      if (index < sections.length - 1) {
        addSeparator();
      }
    });

    // Footer avec contact
    doc.addPage();
    yPosition = margin;
    doc.setFillColor(240, 240, 240);
    doc.rect(margin, yPosition, maxWidth, 25, 'F');
    yPosition += 5;
    addText('CONTACT & SUPPORT', 11, true);
    addText('Email: contact@burkinawatch.com', 9);
    addText('Téléphone: +226 65511323', 9);
    addText('WhatsApp: +226 70019540', 9);
    yPosition += 5;
    addSeparator();

    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text(`© ${new Date().getFullYear()} BurkinaWatch - Tous droits réservés`, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 5;
    doc.text(`Document généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}`, pageWidth / 2, yPosition, { align: 'center' });

    // Télécharger le PDF
    doc.save(`BurkinaWatch_Notes_Securite_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button 
          size="default"
          className="relative gap-2 bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 hover:from-amber-600 hover:via-orange-600 hover:to-red-600 text-white border-2 border-amber-600 shadow-[0_0_20px_rgba(251,146,60,0.5)] hover:shadow-[0_0_30px_rgba(251,146,60,0.7)] transition-all duration-300 font-bold text-sm sm:text-base px-4 sm:px-8 animate-pulse-slow hover:animate-none w-full sm:w-auto hover:scale-105 group overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
          <Shield className="w-5 h-5 sm:w-6 sm:h-6 drop-shadow-lg relative z-10 group-hover:rotate-12 transition-transform" />
          <span className="relative z-10">Notes de securite importantes</span>
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-ping"></div>
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></div>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between gap-2 text-xl">
            <div className="flex items-center gap-2">
              <Shield className="w-6 h-6 text-primary" />
              Notes importantes — Conseils de sécurité pour utiliser BurkinaWatch
            </div>
            <Button
              size="sm"
              onClick={exportToPDF}
              className="gap-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 font-semibold border-0"
              data-testid="button-download-pdf"
            >
              <Download className="w-4 h-4 animate-bounce" />
              Télécharger PDF
            </Button>
          </DialogTitle>
          <DialogDescription className="sr-only">
            Conseils et bonnes pratiques pour utiliser BurkinaWatch en toute sécurité
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-[70vh] pr-4">
          <div className="space-y-6 text-sm">
            <p className="text-muted-foreground">
              Cette page rassemble <strong>conseils pratiques, règles et bonnes pratiques</strong> pour utiliser BurkinaWatch en toute sécurité — protéger ta personne, tes proches et la crédibilité des signalements. Lis attentivement et applique ce qui correspond à ta situation.
            </p>

            <section>
              <h3 className="font-bold text-lg mb-2 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-primary" />
                1) Rappel : objectif de l'application
              </h3>
              <p>
                BurkinaWatch permet de <strong>signaler</strong>, <strong>alerter</strong> et <strong>partager</strong> des faits d'intérêt public (danger, incivilités, urgences, etc.).
                L'objectif est d'augmenter la sécurité collective — pas de remplacer les secours. Utilise toujours l'application de façon responsable.
              </p>
            </section>

            <section>
              <h3 className="font-bold text-lg mb-2 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-destructive" />
                2) Avant de filmer / prendre une photo : évalue ta sécurité
              </h3>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li><strong>Priorité : ta vie d'abord.</strong> Si la situation est dangereuse (violence, attaque, incendie), <strong>recule</strong> et appelle les secours (police, pompiers, SAMU) plutôt que d'intervenir.</li>
                <li><strong>Ne provoque pas</strong> : ne t'expose pas physiquement pour obtenir une meilleure vidéo.</li>
                <li>Si possible, <strong>filme depuis un endroit sûr</strong> (fenêtre, voiture, distance protégée).</li>
                <li>Évite les confrontations verbales ou physiques avec des personnes en crise.</li>
              </ul>
            </section>

            <section>
              <h3 className="font-bold text-lg mb-2">3) Protéger ton anonymat (si tu le souhaites)</h3>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Active l'option <strong>Anonyme</strong> lors de la publication si tu crains des représailles.</li>
                <li>N'inclus <strong>jamais</strong> ton nom complet, adresse personnelle ou autres informations identifiantes dans la description si tu veux rester anonyme.</li>
                <li>Si tu dois donner plus d'informations aux autorités, préfère le canal sécurisé prévu (escrow ou contact officiel), pas le fil public.</li>
              </ul>
            </section>

            <section>
              <h3 className="font-bold text-lg mb-2">4) Lors de la capture d'images / vidéos — bonnes pratiques techniques</h3>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li><strong>Stabilise</strong> l'image au maximum (pose le téléphone si possible).</li>
                <li><strong>Capture l'essentiel</strong> : personne(s) impliquée(s), lieu (repères visibles), date/heure si possible.</li>
                <li><strong>Ne retouche pas</strong> l'image de façon à modifier la réalité (pas de filtres trompeurs).</li>
                <li>Si tu veux protéger l'identité de tiers (enfants, victimes), utilise le <strong>floutage</strong> avant de publier.</li>
                <li>Si tu veux préserver la preuve légale, <strong>conserve l'original</strong> (non compressé) en cas de demande des autorités.</li>
              </ul>
            </section>

            <section>
              <h3 className="font-bold text-lg mb-2">5) Métadonnées et géolocalisation</h3>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Les photos/vidéos contiennent souvent des métadonnées (EXIF) — date, heure, coordonnées.</li>
                <li>Si tu veux <strong>prouver</strong> un fait, conserve les métadonnées.</li>
                <li>Si tu veux <strong>protéger un témoin</strong>, supprime/édites les métadonnées avant publication ou utilise l'option d'anonymat.</li>
                <li>BurkinaWatch propose (ou proposera) une option "supprimer EXIF" — utilise-la selon ton besoin.</li>
              </ul>
            </section>

            <section>
              <h3 className="font-bold text-lg mb-2">6) Rédiger un signalement utile (modèle)</h3>
              <p className="mb-2">Fournis des informations claires et factuelles, sans dramatisation :</p>
              <div className="bg-muted p-3 rounded-md space-y-1">
                <p><strong>Titre</strong> : Éboulement sur la route Ziniaré – kilomètre 12</p>
                <p><strong>Description</strong> : « Glissement de terrain bloquant la RN3, voitures immobilisées, risque d'accident. Localisation : intersection X (voir pin). Heure : 08:12. »</p>
                <p><strong>Pièce jointe</strong> : 2 photos + courte vidéo 15s</p>
                <p><strong>Anonymat</strong> : Oui / Non</p>
              </div>
              <p className="mt-2 italic">Exemple court prêt à envoyer : "Feu de brousse près du village Y, rive nord de la route, flammes visibles sur 50m. Demande intervention pompiers. Coordonnées : [pin]."</p>
            </section>

            <section>
              <h3 className="font-bold text-lg mb-2">7) Vérifier avant de publier — lutte contre la désinformation</h3>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li><strong>Ne publie pas</strong> une rumeur. Si tu n'es pas sûr, mentionne clairement : <em>"À vérifier — témoin sur place"</em>.</li>
                <li>Vérifie la <strong>source</strong> et la <strong>date</strong> (évite de republier des vidéos anciennes comme si elles étaient actuelles).</li>
                <li>Si tu trouves une information douteuse, utilises le <strong>signalement interne</strong> "vérifier" pour demander une revue modérateurs.</li>
              </ul>
            </section>

            <section>
              <h3 className="font-bold text-lg mb-2">8) Si tu es victime ou témoin d'un crime</h3>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li><strong>Appelle immédiatement</strong> les forces de l'ordre si la situation est en cours.</li>
                <li>Si tu filmes, fais-le depuis un endroit sûr, puis <strong>fournis la vidéo</strong> au service compétent via le canal sécurisé.</li>
                <li>N'essaye pas de "juger" ou d'infliger la justice toi-même. BurkinaWatch n'encourage aucune action violente.</li>
              </ul>
            </section>

            <section>
              <h3 className="font-bold text-lg mb-2">9) Protéger les mineurs et les personnes vulnérables</h3>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Ne publie <strong>jamais</strong> d'image d'un enfant sans le consentement des responsables légaux, sauf si c'est strictement nécessaire pour une urgence (disparition) — et alors masque le visage si possible.</li>
                <li>Les signalements impliquant violences sexuelles ou exploitation doivent être envoyés via le canal <strong>SOS — catégorie protection enfant / femme</strong> pour priorisation et confidentialité.</li>
              </ul>
            </section>

            <section>
              <h3 className="font-bold text-lg mb-2">10) Utilisation intelligente du bouton SOS</h3>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Réserve le SOS aux <strong>urgences réelles</strong> (danger immédiat, personne disparue, agression, incendie).</li>
                <li>Pour incidents non urgents, préfère la rubrique Signalement normale.</li>
                <li>L'abus du bouton SOS peut retarder les véritables interventions : <strong>n'en abuse pas</strong>.</li>
              </ul>
            </section>

            <section>
              <h3 className="font-bold text-lg mb-2">11) Interaction avec d'autres utilisateurs</h3>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Respecte la charte citoyenne : pas d'insultes, pas de propos haineux, pas d'appels à la violence.</li>
                <li>Si un utilisateur publie des propos abusifs, utilise le <strong>signalement</strong> intégré.</li>
                <li>Ne diffuse pas des informations personnelles d'autrui sans consentement.</li>
              </ul>
            </section>

            <section>
              <h3 className="font-bold text-lg mb-2">12) Réception d'une réponse / suivi d'un signalement</h3>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Suis le statut de ton signalement via la page de suivi : <em>Reçu → En revue → Pris en charge → Résolu</em>.</li>
                <li>Si tu estimes que la réponse est insuffisante, utilise la fonction <strong>appel</strong> ou <strong>contacter le modérateur</strong> (prévoir délai raisonnable).</li>
                <li>Conserve les preuves originales au cas où les autorités les demanderaient.</li>
              </ul>
            </section>

            <section>
              <h3 className="font-bold text-lg mb-2">13) Sécurité numérique et mot de passe</h3>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Utilise un mot de passe fort et unique pour ton compte. Active 2FA si disponible.</li>
                <li>Ne partage jamais ton identifiant et mot de passe.</li>
                <li>Si tu utilises l'option "compte anonyme", sache que l'anonymat est géré par l'app : ne partage pas d'infos qui te identifient.</li>
              </ul>
            </section>

            <section>
              <h3 className="font-bold text-lg mb-2">14) Que faire si quelqu'un te menace après une publication ?</h3>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Ne réponds pas aux menaces. Capture les messages (screenshots).</li>
                <li>Utilise le signalement d'abus dans l'application.</li>
                <li>Si la menace est grave, contacte immédiatement les forces de l'ordre et fournis les preuves.</li>
              </ul>
            </section>

            <section>
              <h3 className="font-bold text-lg mb-2">15) Sécurité lors du téléchargement d'une image "écran de veille"</h3>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Si tu génères une carte d'urgence pour ton lockscreen : <strong>ne mets que le numéro essentiel</strong> (évite d'y mettre ton adresse personnelle).</li>
                <li>Teste le téléchargement et l'affichage avant de l'utiliser en situation critique.</li>
              </ul>
            </section>

            <section>
              <h3 className="font-bold text-lg mb-2">16) Protection des preuves (si nécessaire pour enquête)</h3>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Garde une <strong>copie non compressée</strong> (originale) des médias si l'affaire doit être utilisée par la justice.</li>
                <li>Ne supprime pas les fichiers tant que l'enquête n'est pas terminée.</li>
                <li>Utilise le canal sécurisé pour transmettre aux autorités (si disponible).</li>
              </ul>
            </section>

            <section>
              <h3 className="font-bold text-lg mb-2">17) Règles à respecter — résumé rapide (Do / Don't)</h3>
              <div className="grid md:grid-cols-2 gap-4 mt-2">
                <div className="bg-green-50 dark:bg-green-950/20 p-3 rounded-md">
                  <h4 className="font-semibold text-green-700 dark:text-green-400 mb-2">Do ✓</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>Signaler rapidement et factuellement</li>
                    <li>Protéger ta sécurité</li>
                    <li>Masquer les visages si besoin</li>
                    <li>Utiliser anonymat quand nécessaire</li>
                    <li>Conserver originaux</li>
                  </ul>
                </div>
                <div className="bg-red-50 dark:bg-red-950/20 p-3 rounded-md">
                  <h4 className="font-semibold text-red-700 dark:text-red-400 mb-2">Don't ✗</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>Ne pas prendre de risques physiques</li>
                    <li>Ne pas diffuser des rumeurs</li>
                    <li>Ne pas harceler d'autres utilisateurs</li>
                    <li>Ne pas publier de données personnelles sans consentement</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h3 className="font-bold text-lg mb-2">18) Questions fréquentes (FAQ courte)</h3>
              <div className="space-y-2">
                <div>
                  <p className="font-semibold">Q : Je veux rester anonyme, comment faire ?</p>
                  <p className="text-muted-foreground ml-4">R : Active l'option "Publier anonymement" avant d'envoyer.</p>
                </div>
                <div>
                  <p className="font-semibold">Q : Mes données peuvent-elles être fournies à la police ?</p>
                  <p className="text-muted-foreground ml-4">R : Les données sont chiffrées ; un accès officiel peut être encadré par la procédure légale/escrow.</p>
                </div>
                <div>
                  <p className="font-semibold">Q : Comment flouter un visage ?</p>
                  <p className="text-muted-foreground ml-4">R : Utilise l'outil de floutage intégré avant publication ou recadre/masque la zone sensible.</p>
                </div>
                <div>
                  <p className="font-semibold">Q : J'ai subi des menaces après un signalement — que faire ?</p>
                  <p className="text-muted-foreground ml-4">R : Capture les preuves, signale dans l'app et contacte la police.</p>
                </div>
              </div>
            </section>

            <section className="bg-primary/5 p-4 rounded-lg border-l-4 border-primary">
              <h3 className="font-bold text-lg mb-2">19) Remarque finale</h3>
              <p>
                BurkinaWatch est un <strong>outil collectif</strong> : son efficacité dépend de la qualité et de la responsabilité des signalements. En respectant ces conseils, tu protèges ta sécurité, tu aides les autres et tu renforces la confiance entre citoyens et autorités.
              </p>
              <p className="mt-2 font-semibold text-primary">
                Merci d'agir avec responsabilité — <strong>ta vigilance sauve des vies</strong>.
              </p>
            </section>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

export default function Home() {
  const { t } = useTranslation();
  const [, setLocation] = useLocation();

  // Images pour le carrousel
  const heroImages = [
    heroImage,
    heroImage, // Vous pouvez ajouter d'autres images ici
  ];

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showSearchResults, setShowSearchResults] = useState<boolean>(false);
  const [selectedSearchFilters, setSelectedSearchFilters] = useState<{
    categorie?: string;
    region?: string;
    province?: string;
    dateDebut?: string;
    dateFin?: string;
    statut?: string;
  }>({});
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);

  // Récupérer les signalements
  const { data: signalements = [], isLoading } = useQuery<Signalement[]>({
    queryKey: ["/api/signalements"],
    queryFn: async () => {
      const response = await fetch("/api/signalements");
      if (!response.ok) throw new Error("Erreur lors du chargement");
      return response.json();
    },
  });

  // Changer l'image toutes les 30 secondes
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => 
        (prevIndex + 1) % heroImages.length
      );
    }, 30000); // 30 secondes

    return () => clearInterval(interval);
  }, [heroImages.length]);

  // Recherche améliorée avec filtres multiples
  useEffect(() => {
    if (!searchQuery.trim() && Object.keys(selectedSearchFilters).length === 0) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    const query = searchQuery.toLowerCase().trim();
    const results: any[] = [];

    // Rechercher dans les signalements avec filtres
    signalements.forEach(signalement => {
      const localisation = signalement.localisation?.toLowerCase() || '';
      const titre = signalement.titre?.toLowerCase() || '';
      const description = signalement.description?.toLowerCase() || '';

      // Vérifier si le signalement correspond aux critères
      let matches = true;

      // Filtre par texte de recherche
      if (query) {
        const matchesSearch = localisation.includes(query) || 
                            titre.includes(query) || 
                            description.includes(query);
        if (!matchesSearch) matches = false;
      }

      // Filtre par catégorie
      if (selectedSearchFilters.categorie && signalement.categorie !== selectedSearchFilters.categorie) {
        matches = false;
      }

      // Filtre par région
      if (selectedSearchFilters.region) {
        const regionMatch = BURKINA_REGIONS.find(r => r.name === selectedSearchFilters.region);
        if (regionMatch) {
          const inRegion = localisation.includes(regionMatch.name.toLowerCase()) || 
                          localisation.includes(regionMatch.chefLieu.toLowerCase());
          if (!inRegion) matches = false;
        }
      }

      // Filtre par province
      if (selectedSearchFilters.province) {
        if (!localisation.includes(selectedSearchFilters.province.toLowerCase())) {
          matches = false;
        }
      }

      // Filtre par date
      if (selectedSearchFilters.dateDebut) {
        const signalementDate = new Date(signalement.createdAt!);
        const dateDebut = new Date(selectedSearchFilters.dateDebut);
        if (signalementDate < dateDebut) matches = false;
      }

      if (selectedSearchFilters.dateFin) {
        const signalementDate = new Date(signalement.createdAt!);
        const dateFin = new Date(selectedSearchFilters.dateFin);
        if (signalementDate > dateFin) matches = false;
      }

      // Filtre par statut
      if (selectedSearchFilters.statut) {
        if (selectedSearchFilters.statut === 'sos' && !signalement.isSOS) matches = false;
        if (selectedSearchFilters.statut === 'resolu' && signalement.statut !== 'resolu') matches = false;
        if (selectedSearchFilters.statut === 'en_cours' && signalement.statut !== 'en_cours') matches = false;
      }

      if (matches) {
        results.push({
          type: 'signalement',
          id: signalement.id,
          titre: signalement.titre,
          description: signalement.description,
          localisation: signalement.localisation,
          latitude: signalement.latitude,
          longitude: signalement.longitude,
          categorie: signalement.categorie,
          isSOS: signalement.isSOS,
          statut: signalement.statut,
          createdAt: signalement.createdAt,
          likes: signalement.likes || 0
        });
      }
    });

    // Ajouter des suggestions géographiques si recherche textuelle
    if (query && query.length >= 2) {
      BURKINA_REGIONS.forEach(region => {
        if (region.name.toLowerCase().includes(query) || region.chefLieu.toLowerCase().includes(query)) {
          results.push({
            type: 'region',
            name: region.name,
            chefLieu: region.chefLieu,
            nbProvinces: region.provinces.length
          });
        }

        region.provinces.forEach(province => {
          if (province.name.toLowerCase().includes(query) || province.chefLieu.toLowerCase().includes(query)) {
            results.push({
              type: 'province',
              name: province.name,
              chefLieu: province.chefLieu,
              region: region.name
            });
          }

          province.communes.forEach(commune => {
            if (commune.toLowerCase().includes(query)) {
              results.push({
                type: 'commune',
                name: commune,
                province: province.name,
                region: region.name
              });
            }
          });
        });
      });
    }

    // Trier les résultats : SOS en premier, puis par popularité
    results.sort((a, b) => {
      if (a.type === 'signalement' && b.type === 'signalement') {
        if (a.isSOS && !b.isSOS) return -1;
        if (!a.isSOS && b.isSOS) return 1;
        return (b.likes || 0) - (a.likes || 0);
      }
      if (a.type === 'signalement') return -1;
      if (b.type === 'signalement') return 1;
      return 0;
    });

    setSearchResults(results.slice(0, 20));
    setShowSearchResults(true);
  }, [searchQuery, signalements, selectedSearchFilters]);

  const { data: stats } = useQuery<Stats>({
    queryKey: ["/api/stats"],
    queryFn: async () => {
      const response = await fetch("/api/stats");
      if (!response.ok) throw new Error("Erreur lors du chargement des statistiques");
      return response.json();
    },
  });

  const recentReports = signalements.slice(0, 3);

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Burkina Watch - Veille Citoyenne et Alerte Sociale</title>
      </Helmet>
      <Header />

      <section className="relative h-[50vh] sm:h-[60vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={heroImages[currentImageIndex]}
            alt="Citoyens burkinabè engagés"
            className="w-full h-full object-cover transition-opacity duration-1000"
            key={currentImageIndex}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-background" />
        </div>

        <div className="relative z-10 text-center px-4 text-white w-full max-w-7xl mx-auto">
          <h1 className="text-4xl sm:text-6xl md:text-8xl font-black mb-4 sm:mb-6 tracking-tight drop-shadow-2xl">
            <span className="bg-gradient-to-r from-white via-gray-100 to-white bg-clip-text text-transparent">
              Burkina Watch
            </span>
          </h1>
          <p className="text-lg sm:text-2xl md:text-4xl mb-3 sm:mb-4 font-bold drop-shadow-lg">
            <span className="text-red-500 dark:text-red-400">Voir.</span>{" "}
            <span className="text-yellow-400 dark:text-yellow-300">Agir.</span>{" "}
            <span className="text-green-500 dark:text-green-400">Protéger.</span>
          </p>
          <p className="text-base sm:text-xl md:text-2xl mb-6 sm:mb-8 max-w-3xl mx-auto font-medium text-green-100 drop-shadow-md px-2">
            Canal de Veille Citoyenne et d'Alerte Sociale
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4">
            <Link href="/publier">
              <Button size="lg" className="w-full sm:w-auto backdrop-blur-sm bg-red-600 hover:bg-red-700 text-white border-red-700" data-testid="button-new-report">
                <AlertCircle className="w-5 h-5 mr-2" />
                Nouveau signalement
              </Button>
            </Link>
            <Link href="/carte">
              <Button size="lg" variant="outline" className="w-full sm:w-auto backdrop-blur-sm bg-background/10 border-white text-white hover:bg-background/20" data-testid="button-view-map">
                Voir la carte
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Bande déroulante des communiqués officiels */}
      <NewsTicker />

      {/* Stats Section */}
      <section className="py-12 sm:py-16 md:py-20 px-4 bg-gradient-to-b from-background via-muted/30 to-background relative overflow-hidden">
        <div className="absolute top-0 left-1/4 w-64 h-64 sm:w-96 sm:h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-64 h-64 sm:w-96 sm:h-96 bg-destructive/5 rounded-full blur-3xl" />

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 sm:mb-3 bg-gradient-to-r from-primary via-destructive to-primary bg-clip-text text-transparent px-2">
              Statistiques en temps réel
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto px-4">
              Découvrez l'engagement de notre communauté dans la surveillance citoyenne
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8" data-testid="container-stats">
            <StatCard
              title="Signalements actifs"
              value={stats?.totalSignalements ?? 0}
              icon={TrendingUp}
              description="Dans la base de données"
              trend="up"
            />
            <StatCard
              title="Alertes SOS"
              value={stats?.sosCount ?? 0}
              icon={AlertTriangle}
              description="Nécessitant attention urgente"
              variant="destructive"
              trend={(stats?.sosCount ?? 0) > 0 ? "up" : "neutral"}
            />
            <StatCard
              title="Citoyens engagés"
              value={stats?.totalUsers ?? 0}
              icon={Users}
              description="Utilisateurs inscrits"
              variant="success"
              trend="up"
            />
            <StatCard
              title="En ligne maintenant"
              value={stats?.onlineUsers ?? 0}
              icon={Users}
              description="Utilisateurs connectés"
              variant="info"
              trend={(stats?.onlineUsers ?? 0) > 0 ? "up" : "neutral"}
            />
          </div>

          <div className="mt-6 sm:mt-8 text-center">
            <p className="text-xs sm:text-sm text-muted-foreground">
              Mis à jour en temps réel • Données vérifiées
            </p>
          </div>
        </div>
      </section>

      {/* Section de recherche géographique */}
      <section className="max-w-7xl mx-auto px-4 py-8 sm:py-12">
        <Card className="p-4 sm:p-6 bg-card shadow-xl border-2">
          <div className="mb-4">
            <h2 className="text-xl sm:text-2xl font-bold mb-2 flex items-center gap-2">
              <Search className="w-6 h-6 text-primary" />
              Recherche géographique
            </h2>
            <p className="text-sm text-muted-foreground">
              Trouvez les signalements par région, province ou commune
            </p>
          </div>



          {/* Filtres rapides */}
          <div className="flex gap-2 mb-3 flex-wrap">
            <Button
              variant={showAdvancedFilters ? "default" : "outline"}
              size="sm"
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className="gap-2"
            >
              <Filter className="w-4 h-4" />
              Filtres avancés
              {Object.keys(selectedSearchFilters).length > 0 && (
                <span className="ml-1 bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs">
                  {Object.keys(selectedSearchFilters).length}
                </span>
              )}
            </Button>

            {Object.keys(selectedSearchFilters).length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedSearchFilters({})}
                className="gap-2"
              >
                <X className="w-4 h-4" />
                Effacer filtres
              </Button>
            )}
          </div>

          {/* Filtres avancés */}
          {showAdvancedFilters && (
            <div className="mb-3 p-4 border rounded-lg bg-muted/50 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Filtre par catégorie */}
                <div>
                  <label className="text-xs font-medium mb-1 block">Catégorie</label>
                  <Select
                    value={selectedSearchFilters.categorie || 'all'}
                    onValueChange={(value) => setSelectedSearchFilters({...selectedSearchFilters, categorie: value === 'all' ? undefined : value})}
                  >
                    <SelectTrigger className="text-sm">
                      <SelectValue placeholder="Toutes les catégories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toutes les catégories</SelectItem>
                      <SelectItem value="insecurite">Insécurité</SelectItem>
                      <SelectItem value="infrastructure">Infrastructure</SelectItem>
                      <SelectItem value="sante">Santé</SelectItem>
                      <SelectItem value="environnement">Environnement</SelectItem>
                      <SelectItem value="social">Social</SelectItem>
                      <SelectItem value="autre">Autre</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Filtre par région */}
                <div>
                  <label className="text-xs font-medium mb-1 block">Région</label>
                  <Select
                    value={selectedSearchFilters.region || 'all'}
                    onValueChange={(value) => setSelectedSearchFilters({...selectedSearchFilters, region: value === 'all' ? undefined : value})}
                  >
                    <SelectTrigger className="text-sm">
                      <SelectValue placeholder="Toutes les régions" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toutes les régions</SelectItem>
                      {BURKINA_REGIONS.map(region => (
                        <SelectItem key={region.name} value={region.name}>
                          {region.name} ({region.chefLieu})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Filtre par statut */}
                <div>
                  <label className="text-xs font-medium mb-1 block">Statut</label>
                  <Select
                    value={selectedSearchFilters.statut || 'all'}
                    onValueChange={(value) => setSelectedSearchFilters({...selectedSearchFilters, statut: value === 'all' ? undefined : value})}
                  >
                    <SelectTrigger className="text-sm">
                      <SelectValue placeholder="Tous les statuts" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les statuts</SelectItem>
                      <SelectItem value="sos">🚨 SOS uniquement</SelectItem>
                      <SelectItem value="en_cours">En cours</SelectItem>
                      <SelectItem value="resolu">Résolu</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Filtre par date */}
                <div>
                  <label className="text-xs font-medium mb-1 block">Période</label>
                  <div className="flex gap-2">
                    <Input
                      type="date"
                      value={selectedSearchFilters.dateDebut || ''}
                      onChange={(e) => setSelectedSearchFilters({...selectedSearchFilters, dateDebut: e.target.value || undefined})}
                      className="text-sm"
                      placeholder="Début"
                    />
                    <Input
                      type="date"
                      value={selectedSearchFilters.dateFin || ''}
                      onChange={(e) => setSelectedSearchFilters({...selectedSearchFilters, dateFin: e.target.value || undefined})}
                      className="text-sm"
                      placeholder="Fin"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Barre de recherche */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Rechercher par adresse, titre ou description..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (e.target.value.trim() && !searchHistory.includes(e.target.value.trim())) {
                  setSearchHistory([e.target.value.trim(), ...searchHistory].slice(0, 5));
                }
              }}
              className="pl-10 pr-20"
              data-testid="input-search-home"
            />
            <div className="absolute right-1 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
              <VoiceSearchButton
                onResult={(transcript) => {
                  setSearchQuery(transcript);
                  if (transcript.trim() && !searchHistory.includes(transcript.trim())) {
                    setSearchHistory([transcript.trim(), ...searchHistory].slice(0, 5));
                  }
                }}
                size="icon"
                variant="ghost"
                className="h-7 w-7"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => {
                    setSearchQuery('');
                    setShowSearchResults(false);
                  }}
                  data-testid="button-clear-search"
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Résultats de recherche */}
          {showSearchResults && searchResults.length > 0 && (
            <div className="mt-4 max-h-[500px] overflow-y-auto border rounded-md bg-background shadow-lg">
              <div className="p-2 border-b bg-muted/50 sticky top-0 z-10">
                <p className="text-xs font-medium text-muted-foreground">
                  {searchResults.filter(r => r.type === 'signalement').length} signalement{searchResults.filter(r => r.type === 'signalement').length > 1 ? 's' : ''} 
                  {searchResults.filter(r => r.type !== 'signalement').length > 0 && 
                    ` + ${searchResults.filter(r => r.type !== 'signalement').length} suggestion${searchResults.filter(r => r.type !== 'signalement').length > 1 ? 's' : ''} géographique${searchResults.filter(r => r.type !== 'signalement').length > 1 ? 's' : ''}`
                  }
                </p>
              </div>

              {/* Signalements */}
              {searchResults.filter(r => r.type === 'signalement').length > 0 && (
                <div className="border-b">
                  <div className="p-2 bg-muted/30">
                    <p className="text-xs font-semibold uppercase tracking-wide">Signalements</p>
                  </div>
                  {searchResults.filter(r => r.type === 'signalement').map((result, index) => (
                    <button
                      key={`sig-${index}`}
                      onClick={() => {
                        setSearchQuery('');
                        setShowSearchResults(false);
                        setLocation(`/carte?lat=${result.latitude}&lng=${result.longitude}&id=${result.id}`);
                      }}
                      className="w-full text-left px-3 py-3 hover:bg-accent transition-colors flex items-start gap-3 border-b last:border-b-0"
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${result.isSOS ? 'bg-destructive/10' : 'bg-primary/10'}`}>
                        {result.isSOS ? (
                          <AlertTriangle className="w-4 h-4 text-destructive" />
                        ) : (
                          <MapPin className="w-4 h-4 text-primary" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm flex items-center gap-2">
                          {result.titre}
                          {result.isSOS && (
                            <span className="text-[10px] font-bold text-destructive bg-destructive/10 px-1.5 py-0.5 rounded">SOS</span>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1 space-y-0.5">
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {result.localisation}
                          </div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="bg-muted px-1.5 py-0.5 rounded text-[10px]">{result.categorie}</span>
                            <span className="text-[10px]">❤️ {result.likes || 0}</span>
                            <span className="text-[10px]">
                              {new Date(result.createdAt).toLocaleDateString('fr-FR', { 
                                day: 'numeric', 
                                month: 'short' 
                              })}
                            </span>
                          </div>
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-1" />
                    </button>
                  ))}
                </div>
              )}

              {/* Suggestions géographiques */}
              {searchResults.filter(r => r.type !== 'signalement').length > 0 && (
                <div>
                  <div className="p-2 bg-muted/30">
                    <p className="text-xs font-semibold uppercase tracking-wide">Suggestions géographiques</p>
                  </div>
                  {searchResults.filter(r => r.type !== 'signalement').map((result, index) => (
                    <button
                      key={`geo-${index}`}
                      onClick={() => {
                        if (result.type === 'region') {
                          setSelectedSearchFilters({...selectedSearchFilters, region: result.name});
                        } else if (result.type === 'province') {
                          setSearchQuery(result.name);
                        } else if (result.type === 'commune') {
                          setSearchQuery(result.name);
                        }
                        setShowSearchResults(false);
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-accent transition-colors flex items-center gap-3 border-b last:border-b-0"
                    >
                      <MapPin className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm">{result.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {result.type === 'region' && `${result.nbProvinces} provinces • Chef-lieu: ${result.chefLieu}`}
                          {result.type === 'province' && `Province • ${result.region} • Chef-lieu: ${result.chefLieu}`}
                          {result.type === 'commune' && `Commune • ${result.province}, ${result.region}`}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {showSearchResults && searchResults.length === 0 && (
            <div className="mt-4 p-6 text-center border rounded-md bg-muted/20">
              <Search className="w-8 h-8 mx-auto mb-2 text-muted-foreground opacity-50" />
              <p className="text-sm font-medium text-muted-foreground">
                Aucun résultat trouvé
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Essayez de modifier vos filtres ou votre recherche
              </p>
            </div>
          )}
        </Card>
      </section>

      <section className="max-w-7xl mx-auto px-4 py-8 sm:py-12 pb-24 sm:pb-28">
        <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold">Signalements récents</h2>
            <p className="text-sm sm:text-base text-muted-foreground">Dernières alertes de la communauté</p>
          </div>
          <Link href="/feed">
            <Button
              variant="default"
              className="w-full sm:w-auto bg-primary hover:bg-primary/90 shadow-lg hover:shadow-xl transition-all duration-200 font-semibold"
              data-testid="button-view-all"
            >
              Voir tout
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {recentReports.map((report) => (
              <SignalementCard
                key={report.id}
                {...report}
                createdAt={new Date(report.createdAt!)}
              />
            ))}
          </div>
        )}

        <div className="mt-8 sm:mt-12 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <RiskZonesPanel />
          <RecommendationsPanel />
        </div>

        <div className="mt-6 sm:mt-8">
          <WeatherAlertsBanner />
        </div>

        <div className="mt-6 sm:mt-8">
          <MessageDuJour />
        </div>

        <Card className="mt-8 sm:mt-12 bg-primary/5 border-primary/20">
          <CardContent className="p-6 sm:p-8 text-center">
            <Shield className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 text-primary" />
            <h3 className="text-xl sm:text-2xl font-bold mb-2">Ensemble, protégeons notre pays</h3>
            <p className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6 max-w-2xl mx-auto px-2">
              Signalez les problèmes dans votre quartier, aidez ceux dans le besoin, et contribuez à bâtir un Burkina Faso plus sûr et plus solidaire.
            </p>
            <Link href="/contribuer">
              <Button size="lg" data-testid="button-contribute" className="gap-2 w-full sm:w-auto">
                <Heart className="w-5 h-5" />
                Contribuer maintenant
              </Button>
            </Link>
            <div className="mt-6 pt-6 border-t-2 border-amber-200/50 dark:border-amber-800/50">
              <div className="flex flex-col items-center gap-4 bg-gradient-to-b from-amber-50/50 to-transparent dark:from-amber-950/20 dark:to-transparent p-4 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-ping"></div>
                  <p className="text-sm text-foreground font-bold text-center uppercase tracking-wide">
                    ⚠️ Informations cruciales pour votre sécurité
                  </p>
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-ping"></div>
                </div>
                <p className="text-xs text-muted-foreground text-center max-w-md">
                  Consultez les conseils de sécurité avant de publier un signalement
                </p>
                <SecurityNotesDialog />
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      <EmergencyPanel />

      {/* Footer */}
      <footer className="border-t bg-muted/30 py-6 sm:py-8 mt-8 sm:mt-16 mb-20 sm:mb-0">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center space-y-4">
            {/* Contact Info */}
            <div className="flex flex-wrap justify-center items-center gap-3 sm:gap-4">
              <a
                href="tel:+22665511323"
                className="flex items-center gap-2 px-3 py-2 rounded-full bg-green-500/10 hover:bg-green-500/20 text-green-600 dark:text-green-400 transition-all hover:scale-105"
                title="Appeler"
              >
                <Phone className="w-4 h-4" />
                <span className="text-xs font-medium hidden sm:inline">+226 65511323</span>
              </a>
              <a
                href="https://wa.me/22670019540"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 py-2 rounded-full bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 transition-all hover:scale-105"
                title="WhatsApp"
              >
                <MessageCircle className="w-4 h-4" />
                <span className="text-xs font-medium hidden sm:inline">WhatsApp</span>
              </a>
              <a
                href="mailto:contact@burkinawatch.com"
                className="flex items-center gap-2 px-3 py-2 rounded-full bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 transition-all hover:scale-105"
                title="Email"
              >
                <Mail className="w-4 h-4" />
                <span className="text-xs font-medium hidden sm:inline">Email</span>
              </a>
            </div>

            {/* Legal Links */}
            <div className="flex flex-wrap justify-center items-center gap-3 sm:gap-6 text-xs sm:text-sm">
              <Link href="/a-propos">
                <span className="text-muted-foreground hover:text-primary transition-colors cursor-pointer">
                  À propos
                </span>
              </Link>
              <span className="text-muted-foreground">•</span>
              <Link href="/conditions">
                <span className="text-muted-foreground hover:text-primary transition-colors cursor-pointer">
                  Conditions d'utilisation
                </span>
              </Link>
              <span className="text-muted-foreground">•</span>
              <Link href="/conditions">
                <span className="text-muted-foreground hover:text-primary transition-colors cursor-pointer">
                  Mentions légales
                </span>
              </Link>
            </div>

            {/* Copyright */}
            <div className="pt-2 border-t border-border/50">
              <p className="text-xs text-muted-foreground">
                © {new Date().getFullYear()} Burkina Watch. Tous droits réservés.
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Plateforme citoyenne de veille et d'engagement pour le Burkina Faso
              </p>
            </div>
          </div>
        </div>
      </footer>

      <BottomNav />
    </div>
  );
}