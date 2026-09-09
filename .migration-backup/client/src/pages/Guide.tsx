import { Helmet } from "react-helmet-async";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Download,
  Shield,
  MapPin,
  AlertCircle,
  Phone,
  Pill,
  Building2,
  GraduationCap,
  Utensils,
  Fuel,
  Hotel,
  Landmark,
  Bus,
  Store,
  ShoppingBag,
  Newspaper,
  Users,
  Eye,
  Lock,
  Wifi,
  WifiOff,
  Mic,
  Camera,
  MessageSquare,
  Star,
  CheckCircle,
  Globe,
  Smartphone,
  Heart,
  Bell,
  Search,
  Navigation,
  Film,
  CloudSun,
  Trophy,
} from "lucide-react";
import BurkinaWatchLogo from "@/components/BurkinaWatchLogo";

function PagePreview({
  title,
  icon: Icon,
  color,
  statCards,
  elements,
}: {
  title: string;
  icon: any;
  color: string;
  statCards?: { value: string; label: string; color: string }[];
  elements?: string[];
}) {
  return (
    <div className="border rounded-lg overflow-hidden bg-white dark:bg-gray-900 shadow-sm print:border-gray-300 print:bg-white mb-4" data-testid={`preview-${title.toLowerCase().replace(/\s+/g, "-")}`}>
      <div className="flex items-center gap-2 px-3 py-2 border-b bg-muted/30 print:bg-gray-50">
        <div className="flex gap-1">
          <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
          <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
        </div>
        <span className="text-xs text-muted-foreground print:text-gray-500 ml-1">
          Apercu - {title}
        </span>
      </div>
      <div className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <div
            className={`w-8 h-8 rounded-md flex items-center justify-center ${color}`}
          >
            <Icon className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-sm text-foreground print:text-black">
            {title}
          </span>
        </div>
        {statCards && statCards.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {statCards.map((s, i) => (
              <div
                key={i}
                className={`px-3 py-2 rounded-md border print:border-gray-200 ${s.color}`}
              >
                <div className="text-lg font-bold print:text-black">
                  {s.value}
                </div>
                <div className="text-[10px] text-muted-foreground print:text-gray-500">
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        )}
        {elements && elements.length > 0 && (
          <div className="space-y-1.5">
            {elements.map((el, i) => (
              <div
                key={i}
                className="flex items-center gap-2 px-2 py-1.5 rounded bg-muted/40 print:bg-gray-100 text-xs text-muted-foreground print:text-gray-600"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />
                {el}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function FeatureSection({
  icon: Icon,
  title,
  description,
  features,
  color,
  stats,
  preview,
}: {
  icon: any;
  title: string;
  description: string;
  features: string[];
  color: string;
  stats?: { label: string; value: string }[];
  preview?: {
    statCards?: { value: string; label: string; color: string }[];
    elements?: string[];
  };
}) {
  return (
    <div className="mb-8 print:mb-6 print:break-inside-avoid">
      <div className="flex items-start gap-4 mb-3">
        <div
          className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${color}`}
        >
          <Icon className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="text-xl font-bold text-foreground print:text-black">
            {title}
          </h3>
          <p className="text-sm text-muted-foreground mt-1 print:text-gray-600">
            {description}
          </p>
        </div>
      </div>
      {preview && (
        <div className="ml-16 print:ml-16 mb-3">
          <PagePreview
            title={title}
            icon={Icon}
            color={color}
            statCards={preview.statCards}
            elements={preview.elements}
          />
        </div>
      )}
      {stats && stats.length > 0 && !preview && (
        <div className="flex flex-wrap gap-3 mb-3 ml-16 print:ml-16">
          {stats.map((stat, i) => (
            <div
              key={i}
              className="px-3 py-1.5 rounded-md bg-muted/50 print:bg-gray-100 print:border print:border-gray-200"
            >
              <span className="text-lg font-bold text-foreground print:text-black">
                {stat.value}
              </span>
              <span className="text-xs text-muted-foreground ml-1.5 print:text-gray-500">
                {stat.label}
              </span>
            </div>
          ))}
        </div>
      )}
      <ul className="space-y-1.5 ml-16 print:ml-16">
        {features.map((feature, i) => (
          <li key={i} className="flex items-start gap-2 text-sm">
            <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 shrink-0 print:text-green-700" />
            <span className="text-muted-foreground print:text-gray-700">
              {feature}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function Guide() {
  const handleDownloadPDF = () => {
    window.print();
  };

  return (
    <>
      <Helmet>
        <title>Guide Utilisateur - Burkina Watch</title>
        <meta
          name="description"
          content="Guide complet de Burkina Watch : fonctionnalites, services et mode d'emploi de la plateforme citoyenne du Burkina Faso."
        />
      </Helmet>

      <style>{`
        @media print {
          .no-print {
            display: none !important;
          }
          header, footer, nav, .floating-buttons, [data-testid="assistant-button"],
          [data-testid="sos-button"], [data-testid="panic-button"] {
            display: none !important;
          }
          #guide-content {
            max-width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          body {
            background: white !important;
            color: black !important;
          }
          @page {
            margin: 15mm 20mm;
            size: A4;
          }
          h1, h2, h3 {
            color: black !important;
          }
        }
      `}</style>

      <div className="no-print flex items-center gap-3 p-4 border-b">
        <Link href="/">
          <Button variant="ghost" size="sm" data-testid="button-back-home">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Accueil
          </Button>
        </Link>
        <div className="flex-1" />
        <Button
          onClick={handleDownloadPDF}
          className="bg-green-600 text-white"
          data-testid="button-download-pdf"
        >
          <Download className="w-4 h-4 mr-2" />
          Telecharger en PDF
        </Button>
      </div>

      <div
        id="guide-content"
        className="max-w-4xl mx-auto px-4 py-8 print:px-0 print:py-0"
      >
        <div className="text-center mb-10 print:mb-8">
          <div className="flex justify-center mb-4">
            <BurkinaWatchLogo className="w-20 h-20 print:w-16 print:h-16" />
          </div>
          <h1 className="text-4xl font-extrabold text-foreground mb-2 print:text-black print:text-3xl">
            Burkina Watch
          </h1>
          <p className="text-xl font-semibold mb-1">
            <span className="text-red-600">Voir.</span>{" "}
            <span className="text-yellow-600">Agir.</span>{" "}
            <span className="text-green-600">Proteger.</span>
          </p>
          <p className="text-muted-foreground text-lg print:text-gray-600">
            Canal de Veille Citoyenne et d'Alerte Sociale
          </p>
          <div className="flex justify-center gap-2 mt-4 flex-wrap">
            <Badge variant="secondary">Gratuit</Badge>
            <Badge variant="secondary">Open Source</Badge>
            <Badge variant="secondary">Made in Burkina Faso</Badge>
          </div>
        </div>

        <Separator className="my-6 print:border-gray-300" />

        <div className="mb-8 print:mb-6">
          <h2 className="text-2xl font-bold text-foreground mb-3 print:text-black">
            Presentation
          </h2>
          <p className="text-muted-foreground leading-relaxed print:text-gray-700">
            Burkina Watch est une plateforme citoyenne de veille securitaire et
            d'information locale concue pour le Burkina Faso. L'application
            permet aux citoyens de signaler des incidents, d'acceder aux
            services d'urgence, de localiser des lieux utiles (pharmacies,
            hopitaux, banques, stations-service, etc.) et de rester informes en
            temps reel. Disponible sur mobile et ordinateur, elle fonctionne
            meme hors connexion grace a un systeme de cache intelligent.
          </p>
        </div>

        <Separator className="my-6 print:border-gray-300" />

        <h2 className="text-2xl font-bold text-foreground mb-6 print:text-black">
          Fonctionnalites principales
        </h2>

        <FeatureSection
          icon={AlertCircle}
          title="Signalements Citoyens"
          description="Publiez et suivez les incidents en temps reel dans votre communaute."
          color="bg-red-600"
          features={[
            "Publication de signalements avec photo, localisation et categorie",
            "Categories : Securite, Sante, Environnement, Corruption, Infrastructure, Personne disparue",
            "Fil d'actualite en temps reel avec filtres (Recents, Populaires, SOS)",
            "Commentaires et interactions communautaires",
            "Floutage d'images integre pour proteger les visages et la vie privee",
            "Verification communautaire des signalements",
          ]}
        />

        <FeatureSection
          icon={Phone}
          title="Urgences Burkina"
          description="Acces rapide aux contacts officiels pour les situations critiques."
          color="bg-orange-600"
          preview={{
            statCards: [
              { value: "113", label: "Services", color: "bg-orange-50 dark:bg-orange-950/20 print:bg-orange-50" },
            ],
            elements: [
              "Brigade Laabal - 50 40 05 04 - Numero Vert 24H/24",
              "Centre National d'Appel (CNA) - 199 - 24H/24 7J/7",
              "WhatsApp 71 20 33 .. / 68 24 44 ..",
            ],
          }}
          features={[
            "Brigade Laabal (50 40 05 04) - Numero vert 24h/24",
            "Centre National d'Appel CNA (199) - Signaler tout fait suspect",
            "Numeros WhatsApp officiels pour alertes",
            "Recherche vocale et filtrage par type de service",
            "Bouton d'appel direct en un clic",
          ]}
        />

        <FeatureSection
          icon={Shield}
          title="Boutons SOS et PANIQUE"
          description="Alertes d'urgence instantanees accessibles depuis n'importe quelle page."
          color="bg-red-700"
          features={[
            "Bouton SOS flottant permanent - Alerte rapide avec geolocalisation",
            "Bouton PANIQUE - Envoi d'urgence aux contacts de confiance",
            "Ecran de verrouillage avec vos contacts d'urgence (image telechargeable)",
            "Partage de position en temps reel avec vos proches",
          ]}
        />

        <div className="print:break-before-page" />

        <FeatureSection
          icon={Pill}
          title="Pharmacies du Faso"
          description="Trouvez les pharmacies ouvertes et de garde dans tout le pays."
          color="bg-green-600"
          preview={{
            statCards: [
              { value: "135", label: "Pharmacies", color: "bg-green-50 dark:bg-green-950/20 print:bg-green-50" },
              { value: "105", label: "De Garde", color: "bg-yellow-50 dark:bg-yellow-950/20 print:bg-yellow-50" },
              { value: "33", label: "Villes", color: "bg-blue-50 dark:bg-blue-950/20 print:bg-blue-50" },
            ],
            elements: [
              "Pharmacie du Centre - Centre-ville - De Garde",
              "Pharmacie Nouvelle - 1200 Logements - 24h/24",
              "Pharmacie du Progres - Secteur 4",
            ],
          }}
          features={[
            "Filtrage par type : Toutes, De Garde, 24h/24, Jour, Nuit",
            "Recherche par nom, quartier ou ville",
            "Filtre par region (17 regions du Burkina Faso)",
            "Geolocalisation : trouver les pharmacies les plus proches",
            "Recherche vocale integree",
            "Informations detaillees : adresse, telephone, horaires",
          ]}
        />

        <FeatureSection
          icon={Building2}
          title="Hopitaux et Centres de Sante"
          description="Repertoire complet des etablissements de sante via OpenStreetMap."
          color="bg-red-500"
          features={[
            "Hopitaux, cliniques, centres de sante et dispensaires",
            "Localisation sur carte interactive",
            "Itineraire vers l'etablissement le plus proche",
            "Donnees enrichies via OpenStreetMap (OSM)",
          ]}
        />

        <FeatureSection
          icon={Landmark}
          title="Banques et Caisses Populaires"
          description="Trouvez les etablissements financiers et distributeurs automatiques."
          color="bg-blue-600"
          preview={{
            statCards: [
              { value: "531", label: "Total", color: "bg-blue-50 dark:bg-blue-950/20 print:bg-blue-50" },
              { value: "438", label: "Banques", color: "bg-indigo-50 dark:bg-indigo-950/20 print:bg-indigo-50" },
              { value: "84", label: "GAB", color: "bg-cyan-50 dark:bg-cyan-950/20 print:bg-cyan-50" },
              { value: "9", label: "Caisses", color: "bg-green-50 dark:bg-green-950/20 print:bg-green-50" },
            ],
          }}
          features={[
            "Banques, caisses populaires et distributeurs automatiques (GAB)",
            "Carte interactive avec localisation de tous les points",
            "Filtrage par type (Banques, Caisses, GAB, EBIS)",
            "Filtrage par region et recherche textuelle",
            "Geolocalisation : trouver les plus proches",
          ]}
        />

        <FeatureSection
          icon={Fuel}
          title="Stations-Service"
          description="Localisez les stations-service dans tout le Burkina Faso."
          color="bg-amber-600"
          preview={{
            statCards: [
              { value: "1 203", label: "Total stations", color: "bg-amber-50 dark:bg-amber-950/20 print:bg-amber-50" },
              { value: "165", label: "Barka Energies", color: "bg-orange-50 dark:bg-orange-950/20 print:bg-orange-50" },
              { value: "55", label: "Shell", color: "bg-yellow-50 dark:bg-yellow-950/20 print:bg-yellow-50" },
              { value: "23", label: "Oryx", color: "bg-green-50 dark:bg-green-950/20 print:bg-green-50" },
              { value: "12", label: "24h/24", color: "bg-blue-50 dark:bg-blue-950/20 print:bg-blue-50" },
            ],
          }}
          features={[
            "Toutes les marques : Barka Energies, Shell, Oryx, Sonaphy, etc.",
            "Filtre 24h/24 pour les stations ouvertes la nuit",
            "Carte interactive avec marqueurs par marque",
            "Filtrage par region et par marque",
            "Recherche vocale et textuelle",
          ]}
        />

        <div className="print:break-before-page" />

        <FeatureSection
          icon={Hotel}
          title="Hotels et Auberges"
          description="Repertoire des hebergements au Burkina Faso."
          color="bg-indigo-600"
          preview={{
            statCards: [
              { value: "530", label: "Total", color: "bg-indigo-50 dark:bg-indigo-950/20 print:bg-indigo-50" },
              { value: "530", label: "Hotels", color: "bg-blue-50 dark:bg-blue-950/20 print:bg-blue-50" },
              { value: "31", label: "Auberges", color: "bg-purple-50 dark:bg-purple-950/20 print:bg-purple-50" },
              { value: "29", label: "Residences", color: "bg-pink-50 dark:bg-pink-950/20 print:bg-pink-50" },
            ],
          }}
          features={[
            "Hotels, auberges et residences",
            "Recherche par nom et filtrage par region",
            "Geolocalisation : les hebergements les plus proches",
            "Bouton itineraire pour navigation directe",
          ]}
        />

        <FeatureSection
          icon={Utensils}
          title="Restaurants"
          description="Decouvrez les restaurants, maquis et cafes du Burkina Faso."
          color="bg-amber-700"
          features={[
            "Restaurants, fast-food, cafes, bars et maquis",
            "Donnees enrichies via OpenStreetMap (2 900+ lieux)",
            "Recherche par nom et filtrage par region",
            "Informations : cuisine, horaires, contacts",
          ]}
        />

        <FeatureSection
          icon={GraduationCap}
          title="Education Superieure"
          description="Universites et instituts de formation au Burkina Faso."
          color="bg-purple-600"
          preview={{
            statCards: [
              { value: "384", label: "Total", color: "bg-purple-50 dark:bg-purple-950/20 print:bg-purple-50" },
              { value: "81", label: "Universites", color: "bg-indigo-50 dark:bg-indigo-950/20 print:bg-indigo-50" },
              { value: "303", label: "Instituts", color: "bg-violet-50 dark:bg-violet-950/20 print:bg-violet-50" },
              { value: "7", label: "Regions", color: "bg-blue-50 dark:bg-blue-950/20 print:bg-blue-50" },
            ],
          }}
          features={[
            "Universites, grandes ecoles, instituts et centres de formation",
            "Filtrage par filiere et par region",
            "Types : Universite, Institut, Grande Ecole, Centre de Formation",
            "Donnees synchronisees depuis OpenStreetMap",
          ]}
        />

        <FeatureSection
          icon={Bus}
          title="Gares Routieres et Transport"
          description="Planifiez vos deplacements interurbains et internationaux."
          color="bg-blue-700"
          features={[
            "15 villes de depart avec horaires et tarifs detailles",
            "65 trajets avec compagnies de transport",
            "Destinations internationales : Abidjan, Bamako, Lome, Cotonou, Niamey, Accra",
            "Geolocalisation pour trouver la gare la plus proche",
            "Selection intuitive des villes de depart et d'arrivee",
          ]}
        />

        <div className="print:break-before-page" />

        <FeatureSection
          icon={Store}
          title="Marches et Boutiques"
          description="Decouvrez les marches et commerces pres de chez vous."
          color="bg-orange-700"
          features={[
            "Marches, supermarches et boutiques",
            "Localisation sur carte interactive",
            "Recherche par nom et filtrage par region",
          ]}
        />

        <FeatureSection
          icon={Film}
          title="Programme Cinema"
          description="Decouvrez les films a l'affiche dans les cinemas de Ouagadougou."
          color="bg-pink-600"
          features={[
            "3 cinemas : Cine Burkina, Cine Neerwaya, CanalOlympia Yennenga",
            "Programmes generes par IA et mis a jour chaque mercredi",
            "Horaires, genres et descriptions des films",
          ]}
        />

        <FeatureSection
          icon={CloudSun}
          title="Meteo"
          description="Suivi meteorologique regional pour tout le Burkina Faso."
          color="bg-sky-600"
          features={[
            "Previsions meteorologiques par region",
            "Alertes en cas de conditions extremes",
            "Temperatures, precipitations et vent",
          ]}
        />

        <Separator className="my-8 print:border-gray-300" />

        <h2 className="text-2xl font-bold text-foreground mb-6 print:text-black">
          Fonctionnalites Techniques
        </h2>

        <FeatureSection
          icon={MapPin}
          title="Carte Interactive"
          description="Visualisez les signalements et lieux d'interet sur une carte."
          color="bg-green-700"
          features={[
            "Carte OpenStreetMap avec 20 000+ points d'interet",
            "Signalements geolocalises en temps reel",
            "Itineraire vers n'importe quel point d'interet",
            "Clustering intelligent pour les zones denses",
          ]}
        />

        <FeatureSection
          icon={Mic}
          title="Recherche Vocale"
          description="Recherchez par la voix dans toutes les sections de l'application."
          color="bg-violet-600"
          features={[
            "Reconnaissance vocale integree dans chaque page de recherche",
            "Support du francais et des langues locales",
            "Conversion automatique voix-texte pour la recherche",
          ]}
        />

        <FeatureSection
          icon={WifiOff}
          title="Mode Hors-Ligne"
          description="Utilisez l'application meme sans connexion internet."
          color="bg-gray-700"
          features={[
            "Cache IndexedDB pour les donnees essentielles",
            "Synchronisation automatique au retour de la connexion",
            "Acces aux contacts d'urgence en mode hors-ligne",
            "Indicateur de statut de connexion en temps reel",
          ]}
        />

        <FeatureSection
          icon={Smartphone}
          title="Application Progressive (PWA)"
          description="Installez Burkina Watch comme une application native sur votre telephone."
          color="bg-emerald-600"
          features={[
            "Installation depuis le navigateur (Android et iOS)",
            "Acces rapide depuis l'ecran d'accueil",
            "Fonctionnement hors-ligne",
            "Notifications d'alertes de securite",
            "Gratuit - Aucune donnee personnelle collectee",
          ]}
        />

        <div className="print:break-before-page" />

        <FeatureSection
          icon={Lock}
          title="Securite et Confidentialite"
          description="Votre securite et votre vie privee sont notre priorite absolue."
          color="bg-slate-700"
          features={[
            "Authentification par code OTP (email) - sans mot de passe",
            "Floutage d'images avant publication pour proteger l'identite",
            "Mode invite : navigation libre sans compte obligatoire",
            "Aucune donnee vendue a des tiers",
            "Mode furtif disponible pour les utilisateurs sensibles",
            "Conformite aux standards de protection des donnees",
          ]}
        />

        <FeatureSection
          icon={Users}
          title="Communaute et Engagement"
          description="Participez activement a la securite de votre communaute."
          color="bg-yellow-600"
          features={[
            "Systeme de points et classement des contributeurs",
            "Validation communautaire des localisations",
            "Commentaires et interactions sur les signalements",
            "Profils publics des contributeurs actifs",
          ]}
        />

        <FeatureSection
          icon={Newspaper}
          title="Actualites Officielles"
          description="Restez informe des communiques officiels du gouvernement."
          color="bg-yellow-700"
          features={[
            "Bandeau defilant avec les communiques officiels",
            "Sources : Presidence du Faso, SIG, AIB",
            "Mise a jour automatique toutes les 30 minutes",
            "Bulletin d'actualites complet",
          ]}
        />

        <FeatureSection
          icon={Globe}
          title="Donnees OpenStreetMap"
          description="Toutes les donnees geographiques proviennent d'OpenStreetMap."
          color="bg-teal-600"
          features={[
            "20 000+ points d'interet synchronises",
            "80+ categories de lieux (hopitaux, ecoles, police, etc.)",
            "Donnees libres et communautaires",
            "Mise a jour reguliere via l'API Overpass",
            "17 regions administratives du Burkina Faso (reforme de juillet 2025)",
          ]}
        />

        <Separator className="my-8 print:border-gray-300" />

        <div className="print:break-inside-avoid">
          <h2 className="text-2xl font-bold text-foreground mb-4 print:text-black">
            Comment utiliser Burkina Watch
          </h2>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-950/30 flex items-center justify-center shrink-0 print:bg-red-100">
                <span className="text-sm font-bold text-red-700">1</span>
              </div>
              <div>
                <h4 className="font-semibold text-foreground print:text-black">
                  Ouvrez l'application
                </h4>
                <p className="text-sm text-muted-foreground print:text-gray-600">
                  Accedez a Burkina Watch depuis votre navigateur ou installez
                  l'application PWA sur votre telephone.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-yellow-100 dark:bg-yellow-950/30 flex items-center justify-center shrink-0 print:bg-yellow-100">
                <span className="text-sm font-bold text-yellow-700">2</span>
              </div>
              <div>
                <h4 className="font-semibold text-foreground print:text-black">
                  Explorez les services
                </h4>
                <p className="text-sm text-muted-foreground print:text-gray-600">
                  Utilisez le menu pour acceder aux pharmacies, hopitaux,
                  banques, stations-service, restaurants et plus encore.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-950/30 flex items-center justify-center shrink-0 print:bg-green-100">
                <span className="text-sm font-bold text-green-700">3</span>
              </div>
              <div>
                <h4 className="font-semibold text-foreground print:text-black">
                  Signalez un incident
                </h4>
                <p className="text-sm text-muted-foreground print:text-gray-600">
                  Cliquez sur "Nouveau signalement" pour publier un incident
                  avec photo et localisation. Vos images peuvent etre floutees
                  avant publication.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-950/30 flex items-center justify-center shrink-0 print:bg-blue-100">
                <span className="text-sm font-bold text-blue-700">4</span>
              </div>
              <div>
                <h4 className="font-semibold text-foreground print:text-black">
                  En cas d'urgence
                </h4>
                <p className="text-sm text-muted-foreground print:text-gray-600">
                  Utilisez les boutons SOS ou PANIQUE visibles sur chaque page
                  pour envoyer une alerte instantanee avec votre position.
                </p>
              </div>
            </div>
          </div>
        </div>

        <Separator className="my-8 print:border-gray-300" />

        <div className="text-center print:break-inside-avoid">
          <div className="flex justify-center mb-3">
            <BurkinaWatchLogo className="w-12 h-12 print:w-10 print:h-10" />
          </div>
          <p className="text-lg font-bold text-foreground print:text-black">
            Burkina Watch
          </p>
          <p className="text-sm text-muted-foreground print:text-gray-500">
            Voir. Agir. Proteger.
          </p>
          <p className="text-xs text-muted-foreground mt-2 print:text-gray-400">
            Plateforme citoyenne gratuite et open source pour le Burkina Faso
          </p>
          <p className="text-xs text-muted-foreground mt-1 print:text-gray-400">
            Donnees : OpenStreetMap | Contacts : Sources officielles
          </p>
          <p className="text-xs text-muted-foreground mt-1 print:text-gray-400">
            Document genere le{" "}
            {new Date().toLocaleDateString("fr-FR", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>

        <div className="mt-8 no-print">
          <Card className="p-6 bg-gradient-to-r from-green-50 to-yellow-50 dark:from-green-950/20 dark:to-yellow-950/20 border-green-200 dark:border-green-800">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="flex-1 text-center sm:text-left">
                <h3 className="font-bold text-lg text-foreground">
                  Telecharger ce guide en PDF
                </h3>
                <p className="text-sm text-muted-foreground">
                  Sauvegardez ce document pour le consulter hors-ligne ou le
                  partager.
                </p>
              </div>
              <Button
                onClick={handleDownloadPDF}
                className="bg-green-600 text-white"
                data-testid="button-download-pdf-bottom"
              >
                <Download className="w-4 h-4 mr-2" />
                Telecharger en PDF
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
