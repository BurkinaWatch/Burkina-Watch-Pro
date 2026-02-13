import { Helmet } from "react-helmet-async";
import { ArrowLeft, Shield, Lock, Eye, EyeOff, Database, Share2, Clock, UserCheck, Users, RefreshCw, AlertTriangle, Mail } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";

export default function Confidentialite() {
  return (
    <div className="min-h-screen bg-background pb-20">
      <Helmet>
        <title>Politique de Confidentialite - Burkina Watch</title>
        <meta name="description" content="Politique de confidentialite de BurkinaWatch. Securite, confidentialite et responsabilite pour la protection de vos donnees personnelles." />
      </Helmet>
      <Header />
      <section className="container max-w-4xl mx-auto px-4 pt-24 pb-12">
        <Link href="/">
          <Button variant="ghost" className="mb-6" data-testid="button-back-home">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </Button>
        </Link>

        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/10 mb-4">
            <Shield className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-2" data-testid="text-privacy-title">
            Politique de Confidentialite
          </h1>
          <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider mb-2">
            BurkinaWatch
          </p>
          <p className="text-sm text-muted-foreground italic">
            Securite, confidentialite et responsabilite
          </p>
          <p className="text-xs text-muted-foreground mt-3">
            Derniere mise a jour : Fevrier 2026
          </p>
        </div>

        <Card className="mb-8 border-emerald-200 dark:border-emerald-800/40 bg-emerald-50/50 dark:bg-emerald-950/20">
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground leading-relaxed">
              Dans le contexte securitaire actuel au Burkina Faso, la protection des donnees personnelles est une
              <strong className="text-foreground"> priorite absolue</strong> pour BurkinaWatch.
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed mt-3">
              Nous sommes conscients que signaler une situation, partager une information ou utiliser un bouton
              d'alerte peut exposer l'utilisateur a des risques si ses donnees ne sont pas correctement protegees.
              C'est pourquoi nous avons mis en place des mesures strictes pour garantir la confidentialite,
              la securite et la discretion des informations traitees.
            </p>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-xl">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                <Shield className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              1. Notre engagement
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground leading-relaxed">
              BurkinaWatch est une plateforme citoyenne independante destinee a renforcer la vigilance
              communautaire et la circulation d'informations utiles.
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed font-medium">
              Nous nous engageons a :
            </p>
            <ul className="space-y-3">
              {[
                "Ne jamais exposer inutilement l'identite d'un utilisateur",
                "Ne jamais vendre ou exploiter les donnees a des fins commerciales",
                "Limiter strictement l'acces aux informations sensibles",
                "Proteger les utilisateurs contre toute utilisation abusive de leurs donnees",
              ].map((item, i) => (
                <li key={i} className="flex gap-3 items-start">
                  <div className="w-5 h-5 rounded-full bg-emerald-500/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  </div>
                  <span className="text-sm text-muted-foreground">{item}</span>
                </li>
              ))}
            </ul>
            <div className="p-3 rounded-lg bg-muted/50 border border-border/50 mt-4">
              <p className="text-xs text-muted-foreground font-medium text-center italic">
                La securite des citoyens passe aussi par la securite numerique.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-xl">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                <Database className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
              2. Donnees collectees : uniquement le strict necessaire
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <p className="text-sm text-muted-foreground leading-relaxed">
              Nous appliquons le principe de <strong className="text-foreground">minimisation des donnees</strong>.
            </p>

            <div>
              <h4 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-blue-500" />
                Donnees d'identification
              </h4>
              <p className="text-xs text-muted-foreground mb-2 italic">Uniquement si vous creez un compte :</p>
              <ul className="space-y-1.5 ml-6">
                {["Nom ou pseudonyme", "Adresse e-mail", "Numero de telephone"].map((item, i) => (
                  <li key={i} className="text-sm text-muted-foreground flex gap-2 items-center">
                    <div className="w-1 h-1 rounded-full bg-blue-400 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                Donnees liees aux signalements
              </h4>
              <ul className="space-y-1.5 ml-6">
                {[
                  "Description des faits",
                  "Localisation (uniquement si vous l'activez volontairement)",
                  "Photos ou videos jointes",
                ].map((item, i) => (
                  <li key={i} className="text-sm text-muted-foreground flex gap-2 items-center">
                    <div className="w-1 h-1 rounded-full bg-amber-400 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                <Lock className="w-4 h-4 text-gray-500" />
                Donnees techniques
              </h4>
              <p className="text-sm text-muted-foreground ml-6">
                Informations necessaires au fonctionnement et a la securite du service
              </p>
            </div>

            <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/40">
              <p className="text-xs text-blue-700 dark:text-blue-300 font-medium text-center">
                Aucune donnee n'est collectee a votre insu.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-xl">
              <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center flex-shrink-0">
                <EyeOff className="w-4 h-4 text-violet-600 dark:text-violet-400" />
              </div>
              3. Confidentialite des signalements
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground leading-relaxed">
              Les signalements peuvent, selon les fonctionnalites activees, etre :
            </p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: "Anonymes", icon: EyeOff, color: "text-violet-500" },
                { label: "Confidentiels", icon: Lock, color: "text-emerald-500" },
                { label: "Restreints", icon: Users, color: "text-blue-500" },
              ].map((item, i) => (
                <div key={i} className="flex flex-col items-center gap-2 p-3 rounded-xl bg-muted/50 border border-border/50">
                  <item.icon className={`w-5 h-5 ${item.color}`} />
                  <span className="text-xs text-muted-foreground text-center">{item.label}</span>
                </div>
              ))}
            </div>
            <div className="p-3 rounded-lg bg-violet-50 dark:bg-violet-950/20 border border-violet-200 dark:border-violet-800/40">
              <p className="text-xs text-violet-700 dark:text-violet-300 font-medium text-center">
                L'identite d'un utilisateur n'est jamais rendue publique sans son consentement explicite.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-xl">
              <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center flex-shrink-0">
                <Lock className="w-4 h-4 text-red-600 dark:text-red-400" />
              </div>
              4. Securite renforcee des donnees
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground leading-relaxed">
              BurkinaWatch met en oeuvre :
            </p>
            <ul className="space-y-3">
              {[
                "Des systemes de protection contre les intrusions",
                "Des protocoles de chiffrement des donnees sensibles",
                "Des acces internes strictement controles",
                "Une surveillance technique continue",
              ].map((item, i) => (
                <li key={i} className="flex gap-3 items-start">
                  <Shield className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-muted-foreground">{item}</span>
                </li>
              ))}
            </ul>
            <p className="text-xs text-muted-foreground italic leading-relaxed mt-2">
              Seules les personnes autorisees et formees peuvent acceder aux informations necessaires au traitement des alertes.
            </p>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-xl">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                <Share2 className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              </div>
              5. Partage encadre des informations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 mb-3">
              <p className="text-xs text-amber-700 dark:text-amber-300 font-semibold text-center">
                Les donnees ne sont jamais vendues ni utilisees a des fins commerciales.
              </p>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Elles peuvent etre transmises uniquement :
            </p>
            <ul className="space-y-3">
              {[
                "Aux equipes internes responsables du traitement des alertes",
                "Aux autorites competentes lorsque la loi l'exige ou en cas de danger grave",
                "A des prestataires techniques lies par des obligations strictes de confidentialite",
              ].map((item, i) => (
                <li key={i} className="flex gap-3 items-start">
                  <div className="w-5 h-5 rounded-full bg-amber-500/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  </div>
                  <span className="text-sm text-muted-foreground">{item}</span>
                </li>
              ))}
            </ul>
            <p className="text-xs text-muted-foreground italic mt-2">
              Toute transmission est limitee au strict necessaire.
            </p>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-xl">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center flex-shrink-0">
                <Clock className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
              </div>
              6. Conservation limitee
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground leading-relaxed">
              Les donnees sont conservees uniquement pendant la duree necessaire :
            </p>
            <ul className="space-y-2">
              {[
                "Pour traiter le signalement",
                "Pour assurer la securite du systeme",
                "Pour respecter les obligations legales",
              ].map((item, i) => (
                <li key={i} className="flex gap-3 items-center">
                  <Clock className="w-3.5 h-3.5 text-cyan-500 flex-shrink-0" />
                  <span className="text-sm text-muted-foreground">{item}</span>
                </li>
              ))}
            </ul>
            <p className="text-xs text-muted-foreground italic">
              Les donnees inutiles ou obsoletes sont supprimees regulierement.
            </p>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-xl">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center flex-shrink-0">
                <UserCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              </div>
              7. Vos droits
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground leading-relaxed">
              Vous pouvez a tout moment :
            </p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "Acces a vos donnees", icon: Eye },
                { label: "Modification", icon: RefreshCw },
                { label: "Suppression", icon: AlertTriangle },
                { label: "Limiter le traitement", icon: Lock },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2.5 p-3 rounded-xl bg-muted/50 border border-border/50">
                  <item.icon className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                  <span className="text-xs text-muted-foreground">{item.label}</span>
                </div>
              ))}
            </div>
            <div className="p-3 rounded-lg bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-800/40">
              <p className="text-xs text-indigo-700 dark:text-indigo-300 font-medium text-center">
                BurkinaWatch respecte votre droit au controle de vos informations personnelles.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-xl">
              <div className="w-8 h-8 rounded-lg bg-teal-500/10 flex items-center justify-center flex-shrink-0">
                <Users className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              </div>
              8. Responsabilite et usage citoyen
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground leading-relaxed">
            <p>
              BurkinaWatch est un outil citoyen. Il ne remplace pas les autorites competentes mais peut
              contribuer a renforcer la vigilance collective.
            </p>
            <p>
              Chaque utilisateur est responsable de l'usage qu'il fait de la plateforme et s'engage a ne
              pas transmettre de fausses informations ou de contenus malveillants.
            </p>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-xl">
              <div className="w-8 h-8 rounded-lg bg-gray-500/10 flex items-center justify-center flex-shrink-0">
                <RefreshCw className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              </div>
              9. Mise a jour de la politique
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground leading-relaxed">
            <p>
              Cette politique peut evoluer pour s'adapter aux realites securitaires, techniques ou legales
              du Burkina Faso.
            </p>
            <p>
              Toute modification importante sera communiquee clairement aux utilisateurs.
            </p>
          </CardContent>
        </Card>

        <Card className="border-red-200 dark:border-red-800/40 bg-red-50/50 dark:bg-red-950/20">
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-foreground mb-2">Message important aux utilisateurs</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  <strong className="text-foreground">Votre securite est notre priorite.</strong> Si vous estimez
                  qu'une information que vous avez transmise presente un risque pour vous, PRIORISEZ VOTRE SECURITE.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mt-6 bg-primary/5 border-primary/20">
          <CardContent className="p-6">
            <div className="flex flex-col items-center gap-3 text-center">
              <Mail className="w-6 h-6 text-primary" />
              <h3 className="font-semibold text-foreground">Contact</h3>
              <p className="text-sm text-muted-foreground">
                Pour toute question relative a vos donnees personnelles :
              </p>
              <p className="text-sm font-semibold text-foreground">contact@burkinawatch.com</p>
              <p className="text-xs text-muted-foreground">BurkinaWatch - Initiative Citoyenne</p>
            </div>
          </CardContent>
        </Card>

      </section>
      <BottomNav />
    </div>
  );
}
