import { useAuth } from "@/hooks/useAuth";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Shield, UserPlus, Lock, ArrowRight, Sparkles, Clock, CheckCircle2 } from "lucide-react";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";

interface AuthGuardProps {
  children: React.ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background" data-testid="loading-auth">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (isAuthenticated) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 via-background to-yellow-50/30 dark:from-green-950/20 dark:via-background dark:to-yellow-950/10">
      <Header />
      <div className="flex items-center justify-center px-4 pt-20 pb-32">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-green-100 to-yellow-100 dark:from-green-900/30 dark:to-yellow-900/30 mb-6 shadow-lg">
              <Lock className="w-10 h-10 text-green-600 dark:text-green-400" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-3" data-testid="text-auth-title">
              Contenu réservé aux membres
            </h1>
            <p className="text-muted-foreground text-base leading-relaxed" data-testid="text-auth-description">
              Connectez-vous pour accéder à toutes les informations et services de Burkina Watch.
            </p>
          </div>

          <div className="bg-card rounded-2xl border shadow-sm p-6 mb-6">
            <div className="space-y-4 mb-6">
              <div className="flex items-start gap-3" data-testid="benefit-speed">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <Clock className="w-4 h-4 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="font-medium text-sm text-foreground">Inscription en 30 secondes</p>
                  <p className="text-xs text-muted-foreground">Juste votre email ou numéro de téléphone, c'est tout !</p>
                </div>
              </div>

              <div className="flex items-start gap-3" data-testid="benefit-security">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <Shield className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="font-medium text-sm text-foreground">100% sécurisé</p>
                  <p className="text-xs text-muted-foreground">Pas de mot de passe requis. Un code unique vous est envoyé à chaque connexion.</p>
                </div>
              </div>

              <div className="flex items-start gap-3" data-testid="benefit-free">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                </div>
                <div>
                  <p className="font-medium text-sm text-foreground">Accès complet & gratuit</p>
                  <p className="text-xs text-muted-foreground">Pharmacies, hôpitaux, restaurants, banques, et bien plus encore.</p>
                </div>
              </div>

              <div className="flex items-start gap-3" data-testid="benefit-privacy">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="font-medium text-sm text-foreground">Aucune donnée partagée</p>
                  <p className="text-xs text-muted-foreground">Vos informations restent privées et ne sont jamais vendues.</p>
                </div>
              </div>
            </div>

            <Link href="/connexion">
              <Button
                className="w-full h-12 text-base font-semibold rounded-xl bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-md hover:shadow-lg transition-all duration-200"
                data-testid="button-login-prompt"
              >
                <UserPlus className="w-5 h-5 mr-2" />
                Créer un compte ou se connecter
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </div>

          <p className="text-center text-xs text-muted-foreground">
            En continuant, vous acceptez nos{" "}
            <Link href="/conditions" className="underline hover:text-foreground transition-colors" data-testid="link-conditions">
              conditions d'utilisation
            </Link>{" "}
            et notre{" "}
            <Link href="/confidentialite" className="underline hover:text-foreground transition-colors" data-testid="link-privacy">
              politique de confidentialité
            </Link>
            .
          </p>
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
