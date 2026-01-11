import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  X, 
  ChevronRight, 
  ChevronLeft, 
  MapPin, 
  AlertTriangle,
  Heart,
  Bell,
  User,
  Map,
  MessageCircle,
  Shield,
  Sparkles,
  CheckCircle2,
  Menu
} from "lucide-react";

interface TutorialStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  targetSelector?: string;
  position?: "top" | "bottom" | "left" | "right" | "center";
}

const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: "welcome",
    title: "Bienvenue sur Burkina Watch",
    description: "Decouvrez comment utiliser cette application pour signaler des incidents, demander de l'aide et rester informe sur votre communaute.",
    icon: <Sparkles className="w-8 h-8 text-primary" />,
    position: "center"
  },
  {
    id: "signalement",
    title: "Signaler un incident",
    description: "Utilisez le bouton 'Nouveau signalement' pour reporter un probleme dans votre quartier: accidents, pannes, inondations, ou tout autre incident.",
    icon: <AlertTriangle className="w-8 h-8 text-amber-500" />,
    targetSelector: "[data-testid='button-new-report']",
    position: "bottom"
  },
  {
    id: "carte",
    title: "Explorer la carte",
    description: "Visualisez tous les signalements sur une carte interactive. Cliquez sur un marqueur pour voir les details.",
    icon: <Map className="w-8 h-8 text-blue-500" />,
    targetSelector: "[data-testid='link-carte']",
    position: "bottom"
  },
  {
    id: "sos",
    title: "SOS - Demander de l'aide",
    description: "En cas d'urgence, utilisez la fonction SOS pour demander ou offrir de l'aide a la communaute.",
    icon: <Heart className="w-8 h-8 text-red-500" />,
    targetSelector: "[data-testid='button-sos']",
    position: "left"
  },
  {
    id: "notifications",
    title: "Restez informe",
    description: "Activez les notifications pour recevoir des alertes sur les incidents dans votre zone et les reponses a vos signalements.",
    icon: <Bell className="w-8 h-8 text-primary" />,
    position: "center"
  },
  {
    id: "profil",
    title: "Votre profil",
    description: "Connectez-vous pour suivre vos signalements, accumuler des points et monter dans le classement des citoyens engages.",
    icon: <User className="w-8 h-8 text-primary" />,
    position: "center"
  },
  {
    id: "assistant",
    title: "Assistant IA",
    description: "Besoin d'aide? Cliquez sur le bouton Assistant pour poser vos questions. Notre IA vous guidera dans l'utilisation de l'application.",
    icon: <MessageCircle className="w-8 h-8 text-green-500" />,
    targetSelector: "[data-testid='button-chatbot']",
    position: "left"
  },
  {
    id: "securite",
    title: "Votre securite compte",
    description: "Vos signalements peuvent etre anonymes. Nous protegens votre identite et vos donnees personnelles.",
    icon: <Shield className="w-8 h-8 text-primary" />,
    position: "center"
  },
  {
    id: "navigation",
    title: "Menu de navigation",
    description: "Explorez le menu lateral pour acceder a toutes les fonctionnalites: Actualites, Evenements, Suivi en direct, Numeros d'urgence, Pharmacies, Hopitaux, Restaurants, Cinemas, Marches, Boutiques, Banques et Stations-service.",
    icon: <Menu className="w-8 h-8 text-primary" />,
    targetSelector: "[data-testid='button-sidebar-toggle']",
    position: "right"
  }
];

const STORAGE_KEY = "burkina_watch_tutorial_completed";
const STORAGE_KEY_DONT_SHOW = "burkina_watch_tutorial_dont_show";

export function InteractiveTutorial() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  useEffect(() => {
    const completed = localStorage.getItem(STORAGE_KEY);
    const dontShow = localStorage.getItem(STORAGE_KEY_DONT_SHOW);
    
    if (!completed && !dontShow) {
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleNext = useCallback(() => {
    if (currentStep < TUTORIAL_STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleComplete();
    }
  }, [currentStep]);

  const handlePrevious = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  }, [currentStep]);

  const handleComplete = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, "true");
    if (dontShowAgain) {
      localStorage.setItem(STORAGE_KEY_DONT_SHOW, "true");
    }
    setIsOpen(false);
  }, [dontShowAgain]);

  const handleSkip = useCallback(() => {
    if (dontShowAgain) {
      localStorage.setItem(STORAGE_KEY_DONT_SHOW, "true");
    }
    setIsOpen(false);
  }, [dontShowAgain]);

  if (!isOpen) return null;

  const step = TUTORIAL_STEPS[currentStep];
  const isLastStep = currentStep === TUTORIAL_STEPS.length - 1;
  const progress = ((currentStep + 1) / TUTORIAL_STEPS.length) * 100;

  return (
    <div className="fixed inset-0 z-[100]" data-testid="tutorial-overlay">
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleSkip}
      />
      
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-card border-2 border-primary/20 shadow-2xl animate-in fade-in zoom-in duration-300">
          <CardContent className="p-0">
            <div className="h-1 bg-muted rounded-t-lg overflow-hidden">
              <div 
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            
            <div className="p-6">
              <div className="flex items-start justify-between gap-4 mb-4">
                <Badge variant="outline" className="text-xs">
                  Etape {currentStep + 1} / {TUTORIAL_STEPS.length}
                </Badge>
                <Button 
                  size="icon" 
                  variant="ghost" 
                  onClick={handleSkip}
                  className="shrink-0 -mt-1 -mr-2"
                  data-testid="button-tutorial-close"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <div className="flex flex-col items-center text-center mb-6">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  {step.icon}
                </div>
                <h3 className="text-xl font-bold mb-2">{step.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {step.description}
                </p>
              </div>

              <div className="flex items-center gap-2 mb-4">
                {TUTORIAL_STEPS.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentStep(index)}
                    className={`h-2 rounded-full transition-all ${
                      index === currentStep 
                        ? "w-6 bg-primary" 
                        : index < currentStep 
                          ? "w-2 bg-primary/50" 
                          : "w-2 bg-muted"
                    }`}
                    data-testid={`tutorial-dot-${index}`}
                  />
                ))}
              </div>

              <div className="flex items-center justify-between gap-3">
                <Button
                  variant="outline"
                  onClick={handlePrevious}
                  disabled={currentStep === 0}
                  className="gap-1"
                  data-testid="button-tutorial-previous"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Precedent
                </Button>
                
                <Button
                  onClick={handleNext}
                  className="gap-1"
                  data-testid="button-tutorial-next"
                >
                  {isLastStep ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      Terminer
                    </>
                  ) : (
                    <>
                      Suivant
                      <ChevronRight className="w-4 h-4" />
                    </>
                  )}
                </Button>
              </div>

              <div className="mt-4 pt-4 border-t">
                <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
                  <input
                    type="checkbox"
                    checked={dontShowAgain}
                    onChange={(e) => setDontShowAgain(e.target.checked)}
                    className="rounded border-muted"
                    data-testid="checkbox-dont-show-again"
                  />
                  Ne plus afficher ce tutoriel
                </label>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export function TutorialTrigger() {
  const [, setForceUpdate] = useState(0);

  const handleRestart = () => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(STORAGE_KEY_DONT_SHOW);
    setForceUpdate(prev => prev + 1);
    window.location.reload();
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleRestart}
      className="gap-2"
      data-testid="button-restart-tutorial"
    >
      <Sparkles className="w-4 h-4" />
      Revoir le tutoriel
    </Button>
  );
}
