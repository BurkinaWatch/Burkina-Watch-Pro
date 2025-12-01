import { ArrowLeft, Shield, Eye, Zap, Users, Heart, Target, Award } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";

export default function APropos() {
  return (
    <div className="min-h-screen bg-background pb-20">
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
            Une plateforme citoyenne dédiée à la protection et au développement du Burkina Faso
          </p>
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
              <strong className="text-foreground">Burkina Watch</strong> est une initiative citoyenne innovante 
              qui vise à renforcer la sécurité, la transparence et la solidarité au Burkina Faso. 
              Notre plateforme permet à chaque Burkinabé de devenir un acteur du changement en 
              signalant les problèmes, en demandant de l'aide, et en contribuant à bâtir 
              un pays plus sûr et plus juste.
            </p>
            <p className="text-lg leading-relaxed">
              Nous croyons fermement que la force d'une nation réside dans l'engagement de ses citoyens. 
              En donnant à chacun les outils pour s'exprimer et agir, nous créons un écosystème 
              de veille citoyenne où l'information circule librement et où les institutions 
              peuvent répondre rapidement aux besoins de la population.
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
                  les problèmes et où les institutions sont responsables devant le peuple.
                </p>
              </CardContent>
            </Card>

            <Card className="hover-elevate">
              <CardContent className="pt-6">
                <div className="w-12 h-12 rounded-full bg-yellow-100 dark:bg-yellow-900/20 flex items-center justify-center mb-4">
                  <Zap className="w-6 h-6 text-yellow-600" />
                </div>
                <h3 className="text-xl font-bold mb-2 text-yellow-700 dark:text-yellow-400">Action Rapide</h3>
                <p className="text-muted-foreground">
                  Chaque signalement compte. Nous facilitons une réponse rapide aux urgences 
                  et aux besoins de la communauté grâce à notre système d'alerte SOS.
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
                  Nous protégeons la confidentialité des utilisateurs avec des options de 
                  signalement anonyme et une sécurité renforcée des données personnelles.
                </p>
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
              Nous aspirons à un <strong>Burkina Faso</strong> où chaque citoyen se sent en sécurité, 
              écouté et respecté. Un pays où la technologie sert le bien commun, où la solidarité 
              est au cœur de chaque action, et où les institutions travaillent main dans la main 
              avec la population pour résoudre les défis du quotidien.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              <div className="flex gap-3">
                <div className="w-2 h-2 rounded-full bg-green-600 mt-2 flex-shrink-0" />
                <p className="text-sm">
                  Réduire les temps de réponse aux urgences et incidents
                </p>
              </div>
              <div className="flex gap-3">
                <div className="w-2 h-2 rounded-full bg-green-600 mt-2 flex-shrink-0" />
                <p className="text-sm">
                  Renforcer la confiance entre citoyens et institutions
                </p>
              </div>
              <div className="flex gap-3">
                <div className="w-2 h-2 rounded-full bg-green-600 mt-2 flex-shrink-0" />
                <p className="text-sm">
                  Promouvoir une culture d'engagement civique actif
                </p>
              </div>
              <div className="flex gap-3">
                <div className="w-2 h-2 rounded-full bg-green-600 mt-2 flex-shrink-0" />
                <p className="text-sm">
                  Créer un écosystème de solidarité nationale
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Fonctionnalités Principales */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold mb-6 text-center">Ce que nous offrons</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="hover-elevate">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-primary" />
                  Signalements Géolocalisés
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Signalez les accidents, la corruption, les infrastructures défectueuses, 
                  et bien plus, avec localisation GPS précise pour une intervention rapide.
                </p>
              </CardContent>
            </Card>

            <Card className="hover-elevate">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-destructive" />
                  Système SOS d'Urgence
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Envoyez des alertes SOS en cas d'urgence avec géolocalisation automatique 
                  et visibilité maximale pour une aide immédiate.
                </p>
              </CardContent>
            </Card>

            <Card className="hover-elevate">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="w-5 h-5 text-primary" />
                  Carte Interactive
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Visualisez tous les signalements sur une carte interactive avec 
                  regroupement intelligent et statistiques locales en temps réel.
                </p>
              </CardContent>
            </Card>

            <Card className="hover-elevate">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  Plateforme Communautaire
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Interagissez avec d'autres citoyens, partagez des informations, 
                  et coordonnez des efforts pour améliorer votre communauté.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Engagement Citoyen */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-2xl">
              <Users className="w-7 h-7 text-primary" />
              Notre Engagement envers les Citoyens
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-muted-foreground">
            <p className="text-lg leading-relaxed">
              <strong className="text-foreground">Burkina Watch</strong> s'engage à rester une 
              plateforme gratuite, accessible à tous les Burkinabés. Nous garantissons :
            </p>
            <ul className="space-y-3 ml-6">
              <li className="flex gap-3">
                <span className="text-green-600 font-bold">✓</span>
                <span>
                  <strong className="text-foreground">Protection des données :</strong> Vos informations 
                  personnelles sont cryptées et jamais vendues à des tiers.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-green-600 font-bold">✓</span>
                <span>
                  <strong className="text-foreground">Anonymat possible :</strong> Vous pouvez signaler 
                  des problèmes de manière anonyme si vous le souhaitez.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-green-600 font-bold">✓</span>
                <span>
                  <strong className="text-foreground">Neutralité :</strong> Nous ne prenons pas parti 
                  et servons tous les citoyens sans discrimination.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-green-600 font-bold">✓</span>
                <span>
                  <strong className="text-foreground">Amélioration continue :</strong> Nous écoutons 
                  vos retours pour améliorer constamment la plateforme.
                </span>
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Contact et Soutien */}
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-8 text-center">
            <Heart className="w-16 h-16 mx-auto mb-4 text-red-600 fill-red-600" />
            <h3 className="text-2xl font-bold mb-2">Soutenez Notre Mission</h3>
            <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
              Burkina Watch est une initiative citoyenne qui dépend du soutien de la communauté. 
              Vos contributions nous aident à maintenir et améliorer cette plateforme essentielle.
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
          <p className="italic">
            "Ensemble, nous bâtissons un Burkina Faso plus fort, plus transparent, et plus solidaire."
          </p>
          <p className="mt-4 font-semibold text-foreground">
            Burkina Watch - Au service du peuple burkinabé 🇧🇫
          </p>
        </div>
      </section>

      <BottomNav />
    </div>
  );
}
