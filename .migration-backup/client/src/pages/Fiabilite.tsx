import Header from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Shield, 
  ShieldCheck, 
  ShieldAlert, 
  Building, 
  MapPin, 
  Users, 
  AlertTriangle,
  ThumbsUp,
  Flag,
  CheckCircle,
  Clock,
  RefreshCw,
  ChevronLeft,
  Heart,
  Eye,
  Lock
} from "lucide-react";
import { Link } from "wouter";
import { Helmet } from "react-helmet-async";

export default function Fiabilite() {
  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Fiabilite et Sources | Burkina Watch</title>
        <meta name="description" content="Decouvrez comment Burkina Watch garantit la fiabilite des informations grace a un systeme transparent de verification et de sources officielles." />
      </Helmet>
      
      <Header />
      
      <main className="container mx-auto px-4 py-6 pb-24 max-w-4xl">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/">
            <Button variant="ghost" size="icon" data-testid="button-back">
              <ChevronLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Shield className="w-6 h-6 text-primary" />
              Fiabilite et Sources
            </h1>
            <p className="text-muted-foreground">
              Comment nous garantissons la qualite des informations
            </p>
          </div>
        </div>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-primary" />
                Notre engagement
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Burkina Watch s'engage a fournir des informations fiables et a jour pour tous les citoyens du Burkina Faso. 
                Notre systeme de verification combine plusieurs sources pour garantir la qualite des donnees.
              </p>
              <div className="grid sm:grid-cols-3 gap-4 pt-2">
                <div className="flex flex-col items-center text-center p-4 rounded-lg bg-muted/50">
                  <RefreshCw className="w-8 h-8 text-primary mb-2" />
                  <span className="font-medium">Mise a jour quotidienne</span>
                  <span className="text-xs text-muted-foreground">Donnees actualisees regulierement</span>
                </div>
                <div className="flex flex-col items-center text-center p-4 rounded-lg bg-muted/50">
                  <Building className="w-8 h-8 text-primary mb-2" />
                  <span className="font-medium">Sources officielles</span>
                  <span className="text-xs text-muted-foreground">Priorite aux donnees verifiees</span>
                </div>
                <div className="flex flex-col items-center text-center p-4 rounded-lg bg-muted/50">
                  <Users className="w-8 h-8 text-primary mb-2" />
                  <span className="font-medium">Verification communautaire</span>
                  <span className="text-xs text-muted-foreground">Validee par les citoyens</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="w-5 h-5" />
                Nos sources de donnees
              </CardTitle>
              <CardDescription>
                Chaque information provient d'une source identifiee et tracable
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 rounded-lg border">
                  <Badge className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200">
                    <Building className="w-3.5 h-3.5 mr-1" />
                    Officielle
                  </Badge>
                  <div className="flex-1">
                    <p className="font-medium">Sources officielles</p>
                    <p className="text-sm text-muted-foreground">
                      Donnees provenant d'organismes officiels du Burkina Faso : ministeres, mairies, BCEAO, 
                      Ordre des pharmaciens, registres commerciaux. Ces sources beneficient de la plus haute fiabilite.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-lg border">
                  <Badge className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200">
                    <MapPin className="w-3.5 h-3.5 mr-1" />
                    OpenStreetMap
                  </Badge>
                  <div className="flex-1">
                    <p className="font-medium">OpenStreetMap (OSM)</p>
                    <p className="text-sm text-muted-foreground">
                      Base de donnees geographique collaborative mondiale. Les informations sont regulierement 
                      mises a jour par des contributeurs locaux et internationaux.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-lg border">
                  <Badge className="bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-200">
                    <Users className="w-3.5 h-3.5 mr-1" />
                    Communaute
                  </Badge>
                  <div className="flex-1">
                    <p className="font-medium">Contributions citoyennes</p>
                    <p className="text-sm text-muted-foreground">
                      Informations signalees par les utilisateurs de Burkina Watch. Ces donnees sont 
                      verifiees par la communaute et notre equipe avant validation.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-lg border">
                  <Badge className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 border-yellow-200">
                    <AlertTriangle className="w-3.5 h-3.5 mr-1" />
                    A verifier
                  </Badge>
                  <div className="flex-1">
                    <p className="font-medium">En cours de verification</p>
                    <p className="text-sm text-muted-foreground">
                      Nouvelles informations en attente de validation. Nous vous encourageons a 
                      confirmer ou signaler ces donnees pour accelerer le processus.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Niveaux de fiabilite
              </CardTitle>
              <CardDescription>
                Chaque lieu ou service dispose d'un indicateur de fiabilite
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 rounded-lg border border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-900/10">
                  <Badge className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">
                    <ShieldCheck className="w-3.5 h-3.5 mr-1" />
                    Elevee
                  </Badge>
                  <div className="flex-1">
                    <p className="font-medium">Fiabilite elevee (80-100%)</p>
                    <p className="text-sm text-muted-foreground">
                      Information verifiee par des sources officielles ou confirmee par de nombreux utilisateurs. 
                      Vous pouvez vous y fier en toute confiance.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-lg border border-yellow-200 dark:border-yellow-800 bg-yellow-50/50 dark:bg-yellow-900/10">
                  <Badge className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300">
                    <Shield className="w-3.5 h-3.5 mr-1" />
                    Moyenne
                  </Badge>
                  <div className="flex-1">
                    <p className="font-medium">Fiabilite moyenne (50-79%)</p>
                    <p className="text-sm text-muted-foreground">
                      Information partiellement verifiee. Certains details peuvent avoir change. 
                      N'hesitez pas a confirmer ou signaler sur place.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-lg border border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-900/10">
                  <Badge className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300">
                    <ShieldAlert className="w-3.5 h-3.5 mr-1" />
                    Faible
                  </Badge>
                  <div className="flex-1">
                    <p className="font-medium">Fiabilite faible (moins de 50%)</p>
                    <p className="text-sm text-muted-foreground">
                      Information a verifier avant utilisation. Des signalements ont ete effectues 
                      ou les donnees n'ont pas ete mises a jour recemment.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="w-5 h-5 text-red-500" />
                Comment vous pouvez aider
              </CardTitle>
              <CardDescription>
                Participez a l'amelioration des donnees pour tous les Burkinabe
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg border bg-card">
                  <div className="flex items-center gap-2 mb-2">
                    <ThumbsUp className="w-5 h-5 text-green-600" />
                    <span className="font-medium">Confirmer une information</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Si vous avez verifie qu'une information est correcte (horaires, adresse, services), 
                    cliquez sur "Confirmer" pour aider les autres utilisateurs.
                  </p>
                </div>

                <div className="p-4 rounded-lg border bg-card">
                  <div className="flex items-center gap-2 mb-2">
                    <Flag className="w-5 h-5 text-red-600" />
                    <span className="font-medium">Signaler une erreur</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Si vous constatez une erreur (lieu ferme, adresse incorrecte, horaires changes), 
                    signalez-la pour que nous puissions corriger rapidement.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                <p className="text-sm">
                  <strong>Ensemble, construisons une base de donnees fiable pour le Burkina Faso.</strong>
                  <br />
                  Chaque confirmation et chaque signalement ameliore la qualite des informations 
                  pour tous les citoyens.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="w-5 h-5" />
                Confidentialite et securite
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-muted-foreground">
                Vos contributions sont anonymes. Nous ne partageons jamais vos informations personnelles 
                sans votre consentement. Les donnees de localisation ne sont utilisees que pour 
                ameliorer votre experience.
              </p>
              <div className="flex flex-wrap gap-2 pt-2">
                <Badge variant="outline">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Contributions anonymes
                </Badge>
                <Badge variant="outline">
                  <Lock className="w-3 h-3 mr-1" />
                  Donnees protegees
                </Badge>
                <Badge variant="outline">
                  <Shield className="w-3 h-3 mr-1" />
                  Conforme RGPD
                </Badge>
              </div>
            </CardContent>
          </Card>

          <div className="text-center py-6">
            <p className="text-sm text-muted-foreground mb-4">
              Des questions sur notre systeme de fiabilite ?
            </p>
            <Link href="/contact">
              <Button variant="outline" data-testid="button-contact">
                Nous contacter
              </Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
