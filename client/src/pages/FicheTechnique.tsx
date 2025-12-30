import { useEffect } from "react";
import { jsPDF } from "jspdf";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, ArrowLeft, FileText } from "lucide-react";
import { Link } from "wouter";

function generatePDF() {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let y = 20;

  const addTitle = (text: string, size: number = 16) => {
    doc.setFontSize(size);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(34, 139, 34);
    doc.text(text, margin, y);
    y += size * 0.5;
  };

  const addSubtitle = (text: string) => {
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 100, 0);
    doc.text(text, margin, y);
    y += 6;
  };

  const addText = (text: string, indent: number = 0) => {
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(0, 0, 0);
    const lines = doc.splitTextToSize(text, contentWidth - indent);
    doc.text(lines, margin + indent, y);
    y += lines.length * 5;
  };

  const addBullet = (text: string) => {
    addText("• " + text, 5);
  };

  const checkPage = () => {
    if (y > 270) {
      doc.addPage();
      y = 20;
    }
  };

  addTitle("FICHE TECHNIQUE - BURKINA WATCH", 18);
  y += 5;
  addText("Application Nationale de Veille Citoyenne");
  y += 10;

  addTitle("1. INFORMATIONS GENERALES", 14);
  y += 3;
  addText("Nom: Burkina Watch");
  addText("Slogan: Voir. Agir. Proteger.");
  addText("Type: Application web full-stack progressive (PWA)");
  addText("Public cible: Citoyens du Burkina Faso, institutions publiques");
  addText("Couverture: 13 regions du Burkina Faso");
  addText("Langues: 5 langues (Francais, Anglais, Moore, Dioula, Fulfulde)");
  y += 8;

  checkPage();
  addTitle("2. STACK TECHNOLOGIQUE", 14);
  y += 3;
  addSubtitle("Frontend");
  addBullet("Framework: React 18 avec TypeScript");
  addBullet("Build Tool: Vite");
  addBullet("Routage: Wouter");
  addBullet("Etat serveur: TanStack Query v5 avec persistance offline");
  addBullet("UI Components: Shadcn/ui (Radix UI + Tailwind CSS)");
  addBullet("Icones: Lucide React");
  addBullet("Formulaires: React Hook Form + Zod Resolver");
  addBullet("Cartes: Leaflet.js, Google Maps API, Mapillary");
  addBullet("SEO: React Helmet Async");
  y += 5;

  checkPage();
  addSubtitle("Backend");
  addBullet("Runtime: Node.js avec Express.js");
  addBullet("Langage: TypeScript");
  addBullet("ORM: Drizzle ORM");
  addBullet("Validation: Zod + drizzle-zod");
  addBullet("Sessions: Express-session avec PostgreSQL store (TTL 7 jours)");
  y += 5;

  checkPage();
  addSubtitle("Base de donnees");
  addBullet("SGBD: PostgreSQL (Neon Serverless)");
  addBullet("Tables: users, signalements, signalement_likes, commentaires, sessions, trackingSessions, locationPoints, onlineSessions, notifications, chatMessages, streetviewPoints, pushSubscriptions");
  addBullet("Migrations: Drizzle Kit");
  y += 8;

  checkPage();
  addTitle("3. FONCTIONNALITES PRINCIPALES", 14);
  y += 3;
  addSubtitle("3.1 Signalements Citoyens");
  addBullet("Creation de signalements avec geolocalisation");
  addBullet("Categories multiples (securite, infrastructure, sante, etc.)");
  addBullet("Systeme d'urgence par code couleur (feu tricolore)");
  addBullet("Edition par l'auteur, compression automatique des images");
  addBullet("Systeme de likes, commentaires et partage");
  y += 5;

  checkPage();
  addSubtitle("3.2 Systeme SOS");
  addBullet("Publication de demandes d'aide");
  addBullet("Offres d'assistance");
  addBullet("Bouton Panique pour alertes d'urgence");
  y += 5;

  checkPage();
  addSubtitle("3.3 Carte Interactive");
  addBullet("Visualisation temps reel des signalements");
  addBullet("Clustering de marqueurs");
  addBullet("Integration Google Maps et Leaflet");
  addBullet("Vue panoramique Mapillary");
  y += 5;

  checkPage();
  addSubtitle("3.4 Recherche Vocale");
  addBullet("API Web Speech (navigateur natif)");
  addBullet("Support francais (fr-FR)");
  addBullet("Indicateur visuel anime pendant l'ecoute");
  addBullet("Integree sur: Accueil, Banques, Pharmacies, Restaurants, Stations-service");
  y += 5;

  checkPage();
  addSubtitle("3.5 Mode Hors-ligne");
  addBullet("Stockage IndexedDB pour signalements");
  addBullet("Synchronisation automatique au retour de connexion");
  addBullet("Indicateur visuel de statut reseau");
  y += 5;

  checkPage();
  addSubtitle("3.6 Notifications Push");
  addBullet("API Web Push avec cles VAPID");
  addBullet("Ciblage geographique (rayon 1-50 km)");
  addBullet("Service Worker pour notifications en arriere-plan");
  y += 5;

  checkPage();
  addSubtitle("3.7 Assistant IA");
  addBullet("Modele: OpenAI gpt-4o-mini");
  addBullet("Historique de conversation persistant");
  addBullet("FAQ et assistance contextuelle");
  y += 5;

  checkPage();
  addSubtitle("3.8 Analyse des Risques");
  addBullet("Prediction des zones a risque (scoring pondere)");
  addBullet("Tendances (hausse/stable/baisse)");
  addBullet("Recommandations personnalisees selon metier/ville/role");
  y += 5;

  checkPage();
  addSubtitle("3.9 Alertes Meteo");
  addBullet("13 villes majeures couvertes");
  addBullet("Saisonnalite: Harmattan (Nov-Fev), Saison des pluies (Juin-Oct), Canicule (Mars-Mai)");
  addBullet("Indicateurs de severite (Faible/Modere/Severe/Critique)");
  y += 8;

  doc.addPage();
  y = 20;

  addTitle("4. SECURITE", 14);
  y += 3;
  addBullet("Authentification: OpenID Connect via Replit Auth (Google, GitHub, X, Apple, email)");
  addBullet("Autorisation: RBAC (roles: citoyen, admin, institution)");
  addBullet("Chiffrement: AES-256-GCM (envelope encryption), Google Cloud KMS");
  addBullet("Protection API: Helmet, express-rate-limit, xss-clean, hpp, CORS strict");
  addBullet("Tokens: SHA-256 hashing pour refresh tokens");
  addBullet("Sessions: PostgreSQL-backed, TTL 7 jours");
  addBullet("Audit: Journalisation complete des operations sensibles");
  y += 8;

  checkPage();
  addTitle("5. DONNEES INTEGREES", 14);
  y += 3;
  addBullet("Pharmacies: 167+ (noms verifies, horaires, services 24h)");
  addBullet("Stations-service: 90+ (TotalEnergies, Shell, Oryx, SOB Petrol, Sonabhy, Barka Energies)");
  addBullet("Restaurants: 65+ (Africain, Burkinabe, Francais, Libanais, Asiatique, etc.)");
  addBullet("Boutiques: 60+ (Marina Market, KIABI, Village Artisanal, Orange Boutique)");
  addBullet("Banques: 102 (16 banques officielles BCEAO, 60 agences, 40 caisses populaires RCPB)");
  addBullet("Marches: Marches traditionnels avec jours d'ouverture");
  addBullet("Contacts d'urgence: 106 numeros verifies");
  y += 5;
  addText("Caracteristiques: Coordonnees GPS verifiees, noms et telephones reels (2024), couverture 13 regions, 450+ etablissements");
  y += 8;

  checkPage();
  addTitle("6. SERVICES EXTERNES", 14);
  y += 3;
  addBullet("Google Maps API: Cartes, geocodage, MarkerClusterer");
  addBullet("OpenStreetMap/Nominatim: Geocodage fallback");
  addBullet("Mapillary: Vues panoramiques street-level");
  addBullet("OpenWeatherMap: Alertes meteo");
  addBullet("OpenAI: Assistant IA (gpt-4o-mini)");
  addBullet("Resend: Emails transactionnels");
  addBullet("Neon: Base de donnees PostgreSQL");
  addBullet("Overpass API: Donnees OSM en temps reel");
  y += 8;

  checkPage();
  addTitle("7. ACCESSIBILITE ET DESIGN", 14);
  y += 3;
  addBullet("Conformite: WCAG AA");
  addBullet("Theme: Ecologique, vert primaire (HSL 142 deg 65% 45%)");
  addBullet("Mode sombre: Supporte avec basculement");
  addBullet("Police: Inter");
  addBullet("Responsive: Mobile-first, optimise bas debit");
  addBullet("Couleurs nationales: Integrees au slogan");
  y += 8;

  checkPage();
  addTitle("8. DEPLOIEMENT", 14);
  y += 3;
  addBullet("Developpement: npm run dev (Express + Vite middleware)");
  addBullet("Production: Vite (frontend) + esbuild (backend Node.js)");
  addBullet("Port: 5000 (frontend et API)");
  addBullet("Hebergement: Replit avec deploiement integre");
  y += 10;

  doc.setFontSize(9);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(128, 128, 128);
  doc.text("Document genere le " + new Date().toLocaleDateString("fr-FR"), margin, 280);
  doc.text("Burkina Watch - Application Nationale de Veille Citoyenne", margin, 285);

  doc.save("Fiche_Technique_BurkinaWatch.pdf");
}

export default function FicheTechnique() {
  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/">
            <Button variant="ghost" size="icon" data-testid="button-back">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Fiche Technique Burkina Watch</h1>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Telecharger la Fiche Technique
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Telechargez la fiche technique complete de l'application Burkina Watch au format PDF. 
              Ce document contient toutes les informations techniques sur l'architecture, 
              les fonctionnalites, la securite et les donnees integrees.
            </p>
            <Button 
              onClick={generatePDF} 
              className="w-full md:w-auto"
              data-testid="button-download-pdf"
            >
              <Download className="h-4 w-4 mr-2" />
              Telecharger le PDF
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Contenu du document</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>1. Informations generales</li>
              <li>2. Stack technologique (Frontend, Backend, Base de donnees)</li>
              <li>3. Fonctionnalites principales (Signalements, SOS, Carte, Recherche vocale, Mode hors-ligne, Notifications, IA, Risques, Meteo)</li>
              <li>4. Securite (Authentification, Chiffrement, Protection API)</li>
              <li>5. Donnees integrees (450+ etablissements verifies)</li>
              <li>6. Services externes</li>
              <li>7. Accessibilite et design</li>
              <li>8. Deploiement</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
