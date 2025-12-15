import { Heart, Smartphone, ArrowLeft, Copy, Check } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Mail } from "lucide-react";

export default function Contribuer() {
  const { toast } = useToast();
  const [copiedNumber, setCopiedNumber] = useState<string | null>(null);

  const handleCopy = (number: string, service: string) => {
    navigator.clipboard.writeText(number);
    setCopiedNumber(number);
    toast({
      title: "Numéro copié !",
      description: `Le numéro ${service} a été copié dans votre presse-papier.`,
    });
    setTimeout(() => setCopiedNumber(null), 2000);
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header />

      <section className="container max-w-4xl mx-auto px-4 pt-24">
        <Link href="/">
          <Button variant="ghost" className="mb-6" data-testid="button-back-home">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour à l'accueil
          </Button>
        </Link>

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-100 dark:bg-red-900/20 mb-4">
            <Heart className="w-10 h-10 text-red-600 fill-red-600" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            Soutenez Burkina Watch
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Votre contribution nous aide à maintenir cette plateforme citoyenne gratuite 
            et à améliorer la sécurité de tous les Burkinabés.
          </p>
        </div>

        <Card className="mb-8 border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-primary" />
              Transfert Mobile Money
            </CardTitle>
            <CardDescription>
              Envoyez votre contribution via les services de mobile money
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Orange Money */}
            <div className="p-4 rounded-lg border bg-card hover-elevate">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center">
                      <span className="text-white font-bold text-sm">OM</span>
                    </div>
                    <div>
                      <h3 className="font-semibold">Orange Money</h3>
                      <p className="text-sm text-muted-foreground">Service Orange</p>
                    </div>
                  </div>
                  <p className="text-lg font-mono font-semibold text-foreground">
                    +226 65 51 13 23
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCopy("+226 65 51 13 23", "Orange Money")}
                  data-testid="button-copy-orange"
                >
                  {copiedNumber === "+226 65 51 13 23" ? (
                    <Check className="w-4 h-4 text-green-600" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>

            {/* Moov Money */}
            <div className="p-4 rounded-lg border bg-card hover-elevate">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center">
                      <span className="text-white font-bold text-sm">MM</span>
                    </div>
                    <div>
                      <h3 className="font-semibold">Moov Money</h3>
                      <p className="text-sm text-muted-foreground">Service Moov Africa</p>
                    </div>
                  </div>
                  <p className="text-lg font-mono font-semibold text-foreground">
                    +226 70 01 95 40
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCopy("+226 70 01 95 40", "Moov Money")}
                  data-testid="button-copy-moov"
                >
                  {copiedNumber === "+226 70 01 95 40" ? (
                    <Check className="w-4 h-4 text-green-600" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>

            {/* Coris Money */}
            <div className="p-4 rounded-lg border bg-card hover-elevate">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center">
                      <span className="text-white font-bold text-sm">CM</span>
                    </div>
                    <div>
                      <h3 className="font-semibold">Coris Money</h3>
                      <p className="text-sm text-muted-foreground">Service Coris Bank</p>
                    </div>
                  </div>
                  <p className="text-lg font-mono font-semibold text-foreground">
                    +226 ZZ ZZ ZZ ZZ
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCopy("+226 ZZ ZZ ZZ ZZ", "Coris Money")}
                  data-testid="button-copy-coris"
                >
                  {copiedNumber === "+226 ZZ ZZ ZZ ZZ" ? (
                    <Check className="w-4 h-4 text-green-600" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800 mb-8">
          <CardHeader>
            <CardTitle className="text-green-700 dark:text-green-400">
              Nous contacter
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm">help-burkinawatch@outlook.fr</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
          <CardHeader>
            <CardTitle className="text-green-700 dark:text-green-400">
              Comment votre contribution aide
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-3">
              <div className="w-2 h-2 rounded-full bg-green-600 mt-2 flex-shrink-0" />
              <p className="text-sm">
                <span className="font-semibold">Maintenance de la plateforme :</span> Serveurs, 
                hébergement, et sécurité des données
              </p>
            </div>
            <div className="flex gap-3">
              <div className="w-2 h-2 rounded-full bg-green-600 mt-2 flex-shrink-0" />
              <p className="text-sm">
                <span className="font-semibold">Amélioration continue :</span> Nouvelles 
                fonctionnalités et optimisations
              </p>
            </div>
            <div className="flex gap-3">
              <div className="w-2 h-2 rounded-full bg-green-600 mt-2 flex-shrink-0" />
              <p className="text-sm">
                <span className="font-semibold">Sensibilisation :</span> Campagnes pour 
                encourager l'engagement citoyen
              </p>
            </div>
            <div className="flex gap-3">
              <div className="w-2 h-2 rounded-full bg-green-600 mt-2 flex-shrink-0" />
              <p className="text-sm">
                <span className="font-semibold">Support communautaire :</span> Assistance aux 
                utilisateurs et modération
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>
            Burkina Watch est une initiative citoyenne au service du peuple burkinabé.
            <br />
            Merci pour votre générosité et votre engagement ! 🇧🇫
          </p>
        </div>
      </section>

      <BottomNav />
    </div>
  );
}