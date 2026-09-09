import { Helmet } from "react-helmet-async";
import { ArrowLeft, Shield, Eye, Zap, Users, Heart, Target, Award, HelpCircle, MapPin, Phone, Bot, Newspaper, Calendar, Navigation, Building2, Pill, Clock, Globe, Sparkles, CheckCircle } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { TutorialTrigger } from "@/components/InteractiveTutorial";

export default function APropos() {
  return (
    <div className="min-h-screen bg-background pb-20">
      <Helmet>
        <title>A Propos - Burkina Watch</title>
      </Helmet>
      <Header />
      
      <section className="container max-w-5xl mx-auto px-4 pt-24 pb-12">
        <Link href="/">
          <Button variant="ghost" className="mb-6" data-testid="button-back-home">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour à l'accueil
          </Button>
        </Link>

        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            À propos de <span className="text-red-600 dark:text-red-500">Burkina Watch</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            La plateforme citoyenne de référence pour la sécurité, l'information et les services au Burkina Faso
          </p>
          <div className="flex flex-wrap justify-center gap-2 mt-6">
            <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">Version 1.2</span>
            <span className="px-3 py-1 bg-green-500/10 text-green-600 dark:text-green-400 rounded-full text-sm font-medium">11 000+ Points d'intérêt</span>
            <span className="px-3 py-1 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-full text-sm font-medium">135 Pharmacies</span>
            <span className="px-3 py-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-full text-sm font-medium">106 Services d'urgence</span>
          </div>
        </div>

        {/* Notre Mission */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-2xl">
              <Target className="w-7 h-7 text-primary" />
              Notre Mission
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-muted-foreground">
            <p className="text-lg leading-relaxed">
              <strong className="text-foreground">Burkina Watch</strong> est bien plus qu'une simple application : 
              c'est un écosystème numérique complet au service du peuple burkinabè. Notre plateforme 
              centralise les informations essentielles, facilite l'accès aux services de proximité, 
              et renforce la solidarité entre citoyens à travers les 13 régions du pays.
            </p>
            <p className="text-lg leading-relaxed">
              Née de la volonté de rendre la technologie accessible à tous, Burkina Watch connecte 
              les citoyens aux ressources dont ils ont besoin : urgences médicales, pharmacies de garde, 
              actualités locales, événements culturels, et bien plus encore. Notre vision est celle 
              d'un Burkina Faso connecté, informé et solidaire.
            </p>
          </CardContent>
        </Card>

        {/* Nos Valeurs */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold mb-6 text-center">Nos Valeurs Fondamentales</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="hover-elevate">
              <CardContent className="pt-6">
                <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center mb-4">
                  <Eye className="w-6 h-6 text-red-600" />
                </div>
                <h3 className="text-xl font-bold mb-2 text-red-600 dark:text-red-500">Transparence</h3>
                <p className="text-muted-foreground">
                  Nous promouvons une culture de transparence où chaque citoyen peut signaler 
                  les problèmes et accéder librement aux informations publiques.
                </p>
              </CardContent>
            </Card>

            <Card className="hover-elevate">
              <CardContent className="pt-6">
                <div className="w-12 h-12 rounded-full bg-yellow-100 dark:bg-yellow-900/20 flex items-center justify-center mb-4">
                  <Zap className="w-6 h-6 text-yellow-600" />
                </div>
                <h3 className="text-xl font-bold mb-2 text-yellow-700 dark:text-yellow-400">Réactivité</h3>
                <p className="text-muted-foreground">
                  Chaque seconde compte en situation d'urgence. Notre système d'alerte SOS 
                  et nos données en temps réel permettent une intervention rapide.
                </p>
              </CardContent>
            </Card>

            <Card className="hover-elevate">
              <CardContent className="pt-6">
                <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center mb-4">
                  <Shield className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="text-xl font-bold mb-2 text-green-700 dark:text-green-500">Protection</h3>
                <p className="text-muted-foreground">
                  Nous protégeons la confidentialité des utilisateurs avec le chiffrement des données, 
                  l'authentification sécurisée et l'option de signalement anonyme.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Fonctionnalités Principales - Section Étendue */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold mb-2 text-center">Fonctionnalités Complètes</h2>
          <p className="text-muted-foreground text-center mb-8 max-w-2xl mx-auto">
            Burkina Watch offre un écosystème complet de services pour répondre aux besoins quotidiens des Burkinabè
          </p>
          
          {/* Services d'Urgence */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2 text-red-600 dark:text-red-400">
              <Phone className="w-5 h-5" />
              Urgences & Sécurité
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="hover-elevate">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-900/20 flex items-center justify-center flex-shrink-0">
                      <Phone className="w-5 h-5 text-red-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold">Numéros d'Urgence</h4>
                      <p className="text-sm text-muted-foreground">
                        106 contacts vérifiés : Police (17), Pompiers (18), SAMU (112), CNA (199), Brigade Laabal (50 40 05 04)
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="hover-elevate">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-900/20 flex items-center justify-center flex-shrink-0">
                      <Zap className="w-5 h-5 text-red-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold">Système SOS</h4>
                      <p className="text-sm text-muted-foreground">
                        Alertes géolocalisées instantanées avec notification aux contacts d'urgence configurés
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="hover-elevate">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center flex-shrink-0">
                      <Navigation className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold">Suivi en Direct</h4>
                      <p className="text-sm text-muted-foreground">
                        Partagez votre position en temps réel avec vos proches pour plus de sécurité
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="hover-elevate">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/20 flex items-center justify-center flex-shrink-0">
                      <Shield className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold">Signalements Citoyens</h4>
                      <p className="text-sm text-muted-foreground">
                        Signalez incidents, accidents, corruption ou infrastructures défectueuses avec photos et géolocalisation
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Santé */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2 text-green-600 dark:text-green-400">
              <Pill className="w-5 h-5" />
              Santé & Pharmacies
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="hover-elevate">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/20 flex items-center justify-center flex-shrink-0">
                      <Pill className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold">Pharmacies du Faso</h4>
                      <p className="text-sm text-muted-foreground">
                        135 pharmacies dans 33 villes : 29 ouvertes 24h/24, 30 de jour, 105 de nuit. Mise à jour quotidienne.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="hover-elevate">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/20 flex items-center justify-center flex-shrink-0">
                      <Building2 className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold">Hôpitaux & Cliniques</h4>
                      <p className="text-sm text-muted-foreground">
                        Cartographie complète des établissements de santé avec adresses et numéros de téléphone
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Information & Culture */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2 text-blue-600 dark:text-blue-400">
              <Newspaper className="w-5 h-5" />
              Information & Culture
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="hover-elevate">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center flex-shrink-0">
                      <Newspaper className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold">Actualités (Hot News)</h4>
                      <p className="text-sm text-muted-foreground">
                        Flux d'informations en temps réel sur l'actualité nationale et internationale
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="hover-elevate">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center flex-shrink-0">
                      <Calendar className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold">Événements</h4>
                      <p className="text-sm text-muted-foreground">
                        Agenda culturel : FESPACO, SIAO, SNC et tous les événements à ne pas manquer
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="hover-elevate">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-pink-100 dark:bg-pink-900/20 flex items-center justify-center flex-shrink-0">
                      <Clock className="w-5 h-5 text-pink-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold">Programme Ciné</h4>
                      <p className="text-sm text-muted-foreground">
                        Programmation des cinémas de Ouagadougou et Bobo-Dioulasso
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="hover-elevate">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-cyan-100 dark:bg-cyan-900/20 flex items-center justify-center flex-shrink-0">
                      <Globe className="w-5 h-5 text-cyan-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold">StreetView</h4>
                      <p className="text-sm text-muted-foreground">
                        Explorez les rues du Burkina Faso avec notre intégration Mapillary
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Vie Quotidienne */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2 text-amber-600 dark:text-amber-400">
              <MapPin className="w-5 h-5" />
              Vie Quotidienne - 11 000+ Points d'Intérêt
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { name: "Restaurants", icon: "restaurant" },
                { name: "Marchés", icon: "market" },
                { name: "Boutiques", icon: "shop" },
                { name: "Banques", icon: "bank" },
                { name: "Stations-Service", icon: "fuel" },
                { name: "Hôtels", icon: "hotel" },
                { name: "Écoles", icon: "school" },
                { name: "Mosquées & Églises", icon: "worship" },
              ].map((item, index) => (
                <Card key={index} className="hover-elevate">
                  <CardContent className="p-3 text-center">
                    <MapPin className="w-5 h-5 mx-auto mb-1 text-amber-600" />
                    <p className="text-sm font-medium">{item.name}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
            <p className="text-sm text-muted-foreground text-center mt-4">
              Données synchronisées depuis OpenStreetMap avec 80+ catégories de lieux
            </p>
          </div>

          {/* Intelligence Artificielle */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2 text-purple-600 dark:text-purple-400">
              <Bot className="w-5 h-5" />
              Intelligence Artificielle
            </h3>
            <Card className="hover-elevate bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20 border-purple-200 dark:border-purple-800">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row items-center gap-6">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-10 h-10 text-white" />
                  </div>
                  <div className="text-center md:text-left">
                    <h4 className="text-xl font-bold mb-2">Faso Assistant</h4>
                    <p className="text-muted-foreground mb-3">
                      Notre assistant IA alimenté par Groq (Llama 3.3 70B) est un véritable expert du Burkina Faso. 
                      Il peut répondre à toutes vos questions sur :
                    </p>
                    <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                      <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded text-xs">Géographie</span>
                      <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded text-xs">Histoire</span>
                      <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded text-xs">Culture</span>
                      <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded text-xs">Gastronomie</span>
                      <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded text-xs">Tourisme</span>
                      <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded text-xs">Économie</span>
                      <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded text-xs">Urgences</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Notre Vision */}
        <Card className="mb-8 bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-2xl text-green-700 dark:text-green-400">
              <Award className="w-7 h-7" />
              Notre Vision
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-lg leading-relaxed text-foreground">
              Nous aspirons à un <strong>Burkina Faso</strong> où chaque citoyen a accès à l'information, 
              se sent en sécurité et connecté à sa communauté. Un pays où la technologie sert le bien commun 
              et où la solidarité est au cœur de chaque action.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              <div className="flex gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm">
                  Réduire les temps de réponse aux urgences grâce à la géolocalisation
                </p>
              </div>
              <div className="flex gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm">
                  Faciliter l'accès aux services de santé 24h/24
                </p>
              </div>
              <div className="flex gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm">
                  Promouvoir la culture et les événements burkinabè
                </p>
              </div>
              <div className="flex gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm">
                  Créer un écosystème de solidarité nationale
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Engagement Citoyen */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-2xl">
              <Users className="w-7 h-7 text-primary" />
              Notre Engagement
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-muted-foreground">
            <p className="text-lg leading-relaxed">
              <strong className="text-foreground">Burkina Watch</strong> s'engage à offrir une 
              plateforme accessible et au service de tous les Burkinabè. Nous garantissons :
            </p>
            <ul className="space-y-3 ml-2">
              <li className="flex gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span>
                  <strong className="text-foreground">Protection des données :</strong> Authentification 
                  sécurisée par OTP (code à usage unique) et chiffrement des données personnelles.
                </span>
              </li>
              <li className="flex gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span>
                  <strong className="text-foreground">Mode visiteur :</strong> Naviguez librement sans 
                  compte. Connexion requise uniquement pour publier, commenter ou liker.
                </span>
              </li>
              <li className="flex gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span>
                  <strong className="text-foreground">Signalement anonyme :</strong> Possibilité de 
                  signaler des problèmes sans révéler votre identité.
                </span>
              </li>
              <li className="flex gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span>
                  <strong className="text-foreground">Données à jour :</strong> Synchronisation 
                  quotidienne avec OpenStreetMap et les sources officielles.
                </span>
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Aide et Tutoriel */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-2xl">
              <HelpCircle className="w-7 h-7 text-primary" />
              Besoin d'aide ?
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Découvrez toutes les fonctionnalités de Burkina Watch grâce à notre tutoriel interactif 
              en 9 étapes. De la création de signalements à l'utilisation de l'assistant IA, nous vous 
              guidons pas à pas.
            </p>
            <TutorialTrigger />
          </CardContent>
        </Card>

        {/* Contact et Soutien */}
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-8 text-center">
            <Heart className="w-16 h-16 mx-auto mb-4 text-red-600 fill-red-600" />
            <h3 className="text-2xl font-bold mb-2">Soutenez Notre Mission</h3>
            <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
              Burkina Watch est une initiative citoyenne indépendante. Vos contributions nous permettent 
              de maintenir les serveurs, améliorer les fonctionnalités et étendre notre couverture 
              à toutes les régions du Burkina Faso.
            </p>
            <Link href="/contribuer">
              <Button size="lg" className="gap-2" data-testid="button-contribute">
                <Heart className="w-5 h-5" />
                Contribuer maintenant
              </Button>
            </Link>
          </CardContent>
        </Card>

        <div className="mt-12 text-center text-sm text-muted-foreground">
          <p className="italic text-lg">
            "Ensemble, bâtissons un Burkina Faso connecté, informé et solidaire."
          </p>
          <p className="mt-4 font-semibold text-foreground">
            Burkina Watch v1.2 - Au service du peuple burkinabè
          </p>
          <p className="mt-2 text-xs">
            La patrie ou la mort, nous vaincrons
          </p>
        </div>
      </section>

      <BottomNav />
    </div>
  );
}
