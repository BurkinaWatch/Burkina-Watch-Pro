import { ArrowLeft, FileText, Scale, Shield, AlertTriangle, CheckCircle } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";

export default function Conditions() {
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
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <FileText className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Conditions d'Utilisation
          </h1>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Dernière mise à jour : 7 novembre 2024
          </p>
        </div>

        {/* Introduction */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-2xl">
              <Scale className="w-6 h-6 text-primary" />
              1. Acceptation des Conditions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-muted-foreground">
            <p className="leading-relaxed">
              En accédant et en utilisant la plateforme <strong className="text-foreground">Burkina Watch</strong>, 
              vous acceptez d'être lié par les présentes conditions d'utilisation, toutes les lois et 
              réglementations applicables, et vous reconnaissez que vous êtes responsable du respect 
              des lois locales applicables.
            </p>
            <p className="leading-relaxed">
              Si vous n'acceptez pas l'une de ces conditions, vous n'êtes pas autorisé à utiliser 
              ou à accéder à cette plateforme. Les documents contenus dans cette plateforme sont 
              protégés par les lois applicables sur le droit d'auteur et les marques commerciales.
            </p>
          </CardContent>
        </Card>

        {/* Utilisation de la Plateforme */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-2xl">
              <CheckCircle className="w-6 h-6 text-primary" />
              2. Utilisation de la Plateforme
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <h3 className="font-semibold text-lg text-foreground">2.1 Licence d'Utilisation</h3>
            <p className="text-muted-foreground leading-relaxed">
              Burkina Watch vous accorde une licence limitée, non exclusive, non transférable et 
              révocable pour utiliser la plateforme à des fins personnelles et non commerciales, 
              conformément aux présentes conditions.
            </p>

            <h3 className="font-semibold text-lg text-foreground mt-6">2.2 Restrictions d'Utilisation</h3>
            <p className="text-muted-foreground leading-relaxed">Il est strictement interdit de :</p>
            <ul className="space-y-2 ml-6 text-muted-foreground">
              <li className="flex gap-3">
                <span className="text-red-600 font-bold">✗</span>
                <span>Publier de faux signalements ou des informations intentionnellement trompeuses</span>
              </li>
              <li className="flex gap-3">
                <span className="text-red-600 font-bold">✗</span>
                <span>Utiliser la plateforme pour harceler, menacer ou diffamer autrui</span>
              </li>
              <li className="flex gap-3">
                <span className="text-red-600 font-bold">✗</span>
                <span>Publier du contenu illégal, obscène, diffamatoire ou portant atteinte aux droits d'autrui</span>
              </li>
              <li className="flex gap-3">
                <span className="text-red-600 font-bold">✗</span>
                <span>Tenter d'accéder de manière non autorisée aux systèmes de la plateforme</span>
              </li>
              <li className="flex gap-3">
                <span className="text-red-600 font-bold">✗</span>
                <span>Utiliser des robots, scripts ou autres moyens automatisés pour accéder à la plateforme</span>
              </li>
              <li className="flex gap-3">
                <span className="text-red-600 font-bold">✗</span>
                <span>Revendre, redistribuer ou exploiter commercialement le contenu de la plateforme</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Comptes Utilisateurs */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-2xl">
              <Shield className="w-6 h-6 text-primary" />
              3. Comptes Utilisateurs
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <h3 className="font-semibold text-lg text-foreground">3.1 Création de Compte</h3>
            <p className="text-muted-foreground leading-relaxed">
              Pour accéder à certaines fonctionnalités, vous devez créer un compte. Vous vous engagez 
              à fournir des informations exactes et à jour lors de la création de votre compte et à 
              maintenir ces informations à jour.
            </p>

            <h3 className="font-semibold text-lg text-foreground mt-6">3.2 Sécurité du Compte</h3>
            <p className="text-muted-foreground leading-relaxed">
              Vous êtes responsable de la confidentialité de vos identifiants de connexion. Vous 
              acceptez de nous informer immédiatement de toute utilisation non autorisée de votre compte.
            </p>

            <h3 className="font-semibold text-lg text-foreground mt-6">3.3 Suspension et Résiliation</h3>
            <p className="text-muted-foreground leading-relaxed">
              Burkina Watch se réserve le droit de suspendre ou de résilier votre compte si vous 
              violez les présentes conditions d'utilisation ou si votre comportement est jugé 
              préjudiciable à la plateforme ou à d'autres utilisateurs.
            </p>
          </CardContent>
        </Card>

        {/* Protection des Données */}
        <Card className="mb-8 bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-2xl text-green-700 dark:text-green-400">
              <Shield className="w-6 h-6" />
              4. Protection des Données Personnelles
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <h3 className="font-semibold text-lg text-foreground">4.1 Collecte de Données</h3>
            <p className="text-muted-foreground leading-relaxed">
              Nous collectons et traitons vos données personnelles conformément à notre politique 
              de confidentialité. Les informations collectées incluent :
            </p>
            <ul className="space-y-2 ml-6 text-muted-foreground">
              <li className="flex gap-3">
                <span className="text-green-600 font-bold">•</span>
                <span>Informations d'identification (nom, email, photo de profil)</span>
              </li>
              <li className="flex gap-3">
                <span className="text-green-600 font-bold">•</span>
                <span>Données de géolocalisation (pour les signalements)</span>
              </li>
              <li className="flex gap-3">
                <span className="text-green-600 font-bold">•</span>
                <span>Contenu publié (signalements, commentaires, photos)</span>
              </li>
              <li className="flex gap-3">
                <span className="text-green-600 font-bold">•</span>
                <span>Données d'utilisation et analytiques</span>
              </li>
            </ul>

            <h3 className="font-semibold text-lg text-foreground mt-6">4.2 Utilisation des Données</h3>
            <p className="text-muted-foreground leading-relaxed">
              Vos données sont utilisées uniquement pour fournir et améliorer nos services. 
              Nous ne vendons jamais vos données à des tiers. Les signalements publics peuvent 
              être consultés par d'autres utilisateurs et les institutions partenaires.
            </p>

            <h3 className="font-semibold text-lg text-foreground mt-6">4.3 Anonymat</h3>
            <p className="text-muted-foreground leading-relaxed">
              Vous pouvez choisir de publier des signalements de manière anonyme. Dans ce cas, 
              votre identité ne sera pas visible publiquement, mais sera conservée dans nos 
              systèmes pour prévenir les abus.
            </p>
          </CardContent>
        </Card>

        {/* Contenu Utilisateur */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-2xl">
              <FileText className="w-6 h-6 text-primary" />
              5. Contenu Utilisateur
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <h3 className="font-semibold text-lg text-foreground">5.1 Propriété du Contenu</h3>
            <p className="text-muted-foreground leading-relaxed">
              Vous conservez tous les droits de propriété sur le contenu que vous publiez sur 
              Burkina Watch. Cependant, en publiant du contenu, vous accordez à Burkina Watch 
              une licence mondiale, non exclusive, libre de droits pour utiliser, reproduire, 
              modifier et distribuer ce contenu dans le cadre de la fourniture de nos services.
            </p>

            <h3 className="font-semibold text-lg text-foreground mt-6">5.2 Responsabilité du Contenu</h3>
            <p className="text-muted-foreground leading-relaxed">
              Vous êtes seul responsable du contenu que vous publiez. Burkina Watch ne garantit 
              pas l'exactitude, la qualité ou la fiabilité du contenu des utilisateurs et décline 
              toute responsabilité à cet égard.
            </p>

            <h3 className="font-semibold text-lg text-foreground mt-6">5.3 Modération</h3>
            <p className="text-muted-foreground leading-relaxed">
              Burkina Watch se réserve le droit, mais n'a pas l'obligation, de surveiller, modifier 
              ou supprimer tout contenu qui viole les présentes conditions ou qui est jugé inapproprié.
            </p>
          </CardContent>
        </Card>

        {/* Limitation de Responsabilité */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-2xl">
              <AlertTriangle className="w-6 h-6 text-yellow-600" />
              6. Limitation de Responsabilité
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-muted-foreground">
            <p className="leading-relaxed">
              Burkina Watch est fourni "tel quel" sans garantie d'aucune sorte. Nous ne garantissons 
              pas que la plateforme sera toujours disponible, ininterrompue, sécurisée ou exempte d'erreurs.
            </p>
            <p className="leading-relaxed">
              En aucun cas Burkina Watch, ses administrateurs, employés ou partenaires ne pourront 
              être tenus responsables de tout dommage direct, indirect, accessoire, spécial ou 
              consécutif résultant de :
            </p>
            <ul className="space-y-2 ml-6">
              <li className="flex gap-3">
                <span className="text-yellow-600 font-bold">•</span>
                <span>L'utilisation ou l'impossibilité d'utiliser la plateforme</span>
              </li>
              <li className="flex gap-3">
                <span className="text-yellow-600 font-bold">•</span>
                <span>L'exactitude ou la fiabilité du contenu des utilisateurs</span>
              </li>
              <li className="flex gap-3">
                <span className="text-yellow-600 font-bold">•</span>
                <span>La perte de données ou l'accès non autorisé à vos données</span>
              </li>
              <li className="flex gap-3">
                <span className="text-yellow-600 font-bold">•</span>
                <span>Les interactions entre utilisateurs</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Modifications */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-2xl">
              <FileText className="w-6 h-6 text-primary" />
              7. Modifications des Conditions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-muted-foreground">
            <p className="leading-relaxed">
              Burkina Watch se réserve le droit de modifier les présentes conditions d'utilisation 
              à tout moment. Les modifications entrent en vigueur dès leur publication sur la plateforme. 
              Votre utilisation continue de la plateforme après la publication des modifications 
              constitue votre acceptation des nouvelles conditions.
            </p>
            <p className="leading-relaxed">
              Nous vous encourageons à consulter régulièrement cette page pour rester informé 
              des éventuelles modifications.
            </p>
          </CardContent>
        </Card>

        {/* Droit Applicable */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-2xl">
              <Scale className="w-6 h-6 text-primary" />
              8. Droit Applicable et Juridiction
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-muted-foreground">
            <p className="leading-relaxed">
              Les présentes conditions d'utilisation sont régies et interprétées conformément 
              aux lois du <strong className="text-foreground">Burkina Faso</strong>. Tout litige 
              découlant de ou en relation avec ces conditions sera soumis à la juridiction 
              exclusive des tribunaux burkinabés.
            </p>
          </CardContent>
        </Card>

        {/* Contact */}
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-8">
            <h3 className="text-xl font-bold mb-4 text-center">Questions ou Préoccupations ?</h3>
            <p className="text-center text-muted-foreground mb-4">
              Si vous avez des questions concernant ces conditions d'utilisation, 
              n'hésitez pas à nous contacter.
            </p>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                Email : <span className="font-semibold text-foreground">contact@burkinawatch.com</span>
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Burkina Watch - Initiative Citoyenne
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="mt-8 p-6 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <p className="text-sm text-center text-muted-foreground">
            <strong className="text-foreground">Important :</strong> En utilisant Burkina Watch, 
            vous reconnaissez avoir lu, compris et accepté les présentes conditions d'utilisation 
            dans leur intégralité.
          </p>
        </div>
      </section>

      <BottomNav />
    </div>
  );
}
