import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Shield, AlertCircle, Map, Users } from "lucide-react";
import logo from "@assets/burkina_watch_logo.png";
import heroImage from "@assets/generated_images/Citizens_collaborating_with_smartphones_in_Burkina_68dc35a5.png";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-16 items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-3">
            <img src={logo} alt="Burkina Watch" className="w-10 h-10" />
            <div>
              <h1 className="text-lg font-bold text-primary">Burkina Watch</h1>
              <p className="text-xs">
                <span className="text-red-600 dark:text-red-500">Voir.</span>{" "}
                <span className="text-yellow-700 dark:text-yellow-400">Agir.</span>{" "}
                <span className="text-green-700 dark:text-green-500">Protéger.</span>
              </p>
            </div>
          </div>
          <Button onClick={() => window.location.href = "/connexion"} data-testid="button-login">
            Se connecter
          </Button>
        </div>
      </header>

      <section className="relative h-[70vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={heroImage}
            alt="Citoyens burkinabè engagés"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-background" />
        </div>
        
        <div className="relative z-10 text-center px-4 text-white max-w-4xl">
          <h1 className="text-5xl md:text-7xl font-bold mb-4">
            Burkina Watch
          </h1>
          <p className="text-2xl md:text-3xl mb-3 font-semibold">
            <span className="text-red-500 dark:text-red-400">Voir.</span>{" "}
            <span className="text-yellow-300 dark:text-yellow-400">Agir.</span>{" "}
            <span className="text-green-400 dark:text-green-400">Protéger.</span>
          </p>
          <p className="text-lg md:text-xl mb-8">
            Application nationale de veille citoyenne et d'alerte sociale
          </p>
          <p className="text-base md:text-lg mb-8 max-w-2xl mx-auto">
            Signalez les problèmes dans votre quartier, aidez ceux dans le besoin, 
            et contribuez à bâtir un Burkina Faso plus sûr et plus solidaire.
          </p>
          <Button 
            size="lg" 
            onClick={() => window.location.href = "/connexion"}
            className="backdrop-blur-sm"
            data-testid="button-get-started"
          >
            Commencer maintenant
          </Button>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">
          Comment ça marche ?
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card>
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2">1. Signaler</h3>
              <p className="text-muted-foreground">
                Identifiez un problème dans votre quartier et créez un signalement avec photo et localisation
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Map className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2">2. Partager</h3>
              <p className="text-muted-foreground">
                Votre signalement est visible par la communauté et les institutions sur la carte interactive
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2">3. Résoudre</h3>
              <p className="text-muted-foreground">
                Les autorités prennent en charge votre signalement et travaillent à résoudre le problème
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="bg-primary/5 py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <Users className="w-16 h-16 mx-auto mb-4 text-primary" />
          <h2 className="text-3xl font-bold mb-4">
            Rejoignez la communauté
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Des milliers de citoyens burkinabè utilisent déjà Burkina Watch pour améliorer leur quotidien
          </p>
          <Button 
            size="lg"
            onClick={() => window.location.href = "/connexion"}
            data-testid="button-join"
          >
            Créer mon compte gratuitement
          </Button>
        </div>
      </section>

      <footer className="border-t py-8">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>&copy; 2024 Burkina Watch. Tous droits réservés.</p>
          <p className="mt-2">Application citoyenne pour un Burkina Faso plus sûr et solidaire</p>
        </div>
      </footer>
    </div>
  );
}
