import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sparkles, X, Send, Loader2, Shield, Mic, MicOff } from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { nanoid } from "nanoid";

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sessionId] = useState(() => nanoid());
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const recognitionRef = useRef<any>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      setSpeechSupported(true);
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'fr-FR';

      recognitionRef.current.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0].transcript)
          .join('');
        setInput(transcript);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        if (event.error === 'not-allowed') {
          toast({
            title: "Microphone non autorisé",
            description: "Veuillez autoriser l'accès au microphone dans votre navigateur.",
            variant: "destructive",
          });
        }
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, [toast]);

  const toggleListening = () => {
    if (!speechSupported) {
      toast({
        title: "Non supporté",
        description: "La reconnaissance vocale n'est pas disponible sur votre navigateur.",
        variant: "destructive",
      });
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current?.start();
        setIsListening(true);
        toast({
          title: "🎤 Écoute en cours...",
          description: "Parlez maintenant. Votre message sera transcrit automatiquement.",
        });
      } catch (error) {
        console.error('Failed to start speech recognition:', error);
        setIsListening(false);
      }
    }
  };

  // Charger l'historique de la conversation
  const { data: history, isLoading: historyLoading, isError: historyError } = useQuery<Message[]>({
    queryKey: ["/api/chat/history", sessionId],
    queryFn: async () => {
      const res = await fetch(`/api/chat/history/${sessionId}`);
      if (!res.ok) throw new Error("Erreur lors du chargement de l'historique");
      return res.json();
    },
    enabled: isOpen,
    retry: 1,
  });

  // Afficher une erreur si le chargement de l'historique échoue
  useEffect(() => {
    if (historyError && isOpen) {
      toast({
        title: "Erreur de chargement",
        description: "Impossible de charger l'historique des conversations précédentes.",
        variant: "destructive",
      });
    }
  }, [historyError, isOpen, toast]);

  // Fusionner l'historique chargé avec les messages locaux
  // Seulement charger l'historique si aucun message local n'existe
  useEffect(() => {
    if (history && history.length > 0 && messages.length === 0) {
      setMessages(history);
    }
  }, [history, messages.length]);

  const chatMutation = useMutation({
    mutationFn: async (message: string) => {
      const res = await apiRequest("POST", "/api/chat", {
        sessionId,
        userId: user?.id || null,
        content: message,
        role: "user",
      });
      return res.json();
    },
    onSuccess: (data) => {
      const engineInfo = data.engine === "gemini" ? " 🟢" : data.engine === "groq" ? " 🔵" : "";
      setMessages(prev => [...prev, { role: "assistant", content: data.message + engineInfo }]);
    },
    onError: (error: any) => {
      console.error("Chat error:", error);
      
      // Parser l'erreur pour extraire les détails
      const errorMessage = error?.message || "";
      let errorDetails: { error?: string; quotaExceeded?: boolean } = {};
      
      try {
        // Format de l'erreur: "503: {\"error\":\"...\",\"quotaExceeded\":true}"
        const match = errorMessage.match(/\d+:\s*({.*})/);
        if (match && match[1]) {
          errorDetails = JSON.parse(match[1]);
        }
      } catch (e) {
        // Si parsing échoue, utiliser le message générique
      }
      
      // Afficher un toast différencié selon le type d'erreur
      if (errorDetails.quotaExceeded) {
        toast({
          title: "Quota d'IA épuisé",
          description: errorDetails.error || "Le quota d'utilisation de l'assistant est temporairement épuisé. Veuillez réessayer dans quelques instants.",
          variant: "destructive",
        });
        
        // Ajouter un message système dans le chat
        setMessages(prev => [...prev, {
          role: "assistant",
          content: "⚠️ Désolé, le quota d'utilisation de l'assistant IA est temporairement épuisé. Veuillez réessayer dans quelques instants. Pour toute urgence, n'hésitez pas à appeler le 17 (Police) ou 18 (Pompiers).",
        }]);
      } else {
        toast({
          title: "Erreur",
          description: errorDetails.error || "Impossible d'envoyer le message. Veuillez réessayer.",
          variant: "destructive",
        });
      }
    },
  });

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || chatMutation.isPending) return;

    const userMessage = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: userMessage }]);
    chatMutation.mutate(userMessage);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isOpen) {
    return (
      <div className="fixed bottom-[248px] md:bottom-[280px] right-4 z-50 animate-float">
        <div className="relative">
          {/* Anneau pulsant aux couleurs du Burkina */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-red-500 via-yellow-400 to-green-600 animate-pulse opacity-40 blur-sm"></div>
          
          {/* Bouton principal */}
          <Button
            onClick={() => setIsOpen(true)}
            className="relative w-16 h-16 md:w-20 md:h-20 rounded-full shadow-2xl bg-gradient-to-br from-red-600 via-yellow-500 to-green-600 hover:from-red-700 hover:via-yellow-600 hover:to-green-700 transition-all duration-300 hover:scale-110 hover:shadow-3xl border-2 border-yellow-400/50"
            size="lg"
            data-testid="button-open-chatbot"
          >
            {/* Étoile symbolisant l'excellence burkinabé */}
            <div className="absolute -top-1 -right-1 w-5 h-5 md:w-6 md:h-6">
              <svg viewBox="0 0 24 24" className="fill-yellow-300 animate-spin-slow">
                <path d="M12 2l2.4 7.4h7.6l-6 4.6 2.3 7.4-6.3-4.6-6.3 4.6 2.3-7.4-6-4.6h7.6z"/>
              </svg>
            </div>
            
            <div className="flex flex-col items-center gap-0.5 text-white">
              <Sparkles className="w-6 h-6 md:w-7 md:h-7 drop-shadow-lg" />
              <span className="text-[10px] md:text-xs font-bold tracking-wide">ASSISTANT</span>
            </div>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Card className="fixed bottom-4 left-4 right-4 md:left-6 md:right-auto md:w-96 h-[500px] md:h-[600px] shadow-2xl flex flex-col z-50 border-2 border-primary/20">
      <CardHeader className="bg-gradient-to-r from-primary to-green-600 text-white p-3 md:p-4 rounded-t-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 md:w-5 md:h-5" />
            <CardTitle className="text-sm md:text-lg font-bold" data-testid="text-chatbot-title">
              Assistance Burkina Watch
            </CardTitle>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsOpen(false)}
            className="text-white hover:bg-white/20"
            data-testid="button-close-chatbot"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>
        <p className="text-[10px] md:text-xs text-white/90 mt-1">
          Votre assistant pour signaler et rester en sécurité
        </p>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
        <ScrollArea className="flex-1 p-2 md:p-4" ref={scrollRef}>
          {historyLoading ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-3 md:p-6 space-y-2 md:space-y-4">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
              <p className="text-sm text-muted-foreground">Chargement de l'historique...</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-3 md:p-6 space-y-2 md:space-y-4">
              <Shield className="w-12 h-12 md:w-16 md:h-16 text-primary/30" />
              <div>
                <h3 className="font-semibold text-base md:text-lg mb-1 md:mb-2">Bonjour ! 👋</h3>
                <p className="text-xs md:text-sm text-muted-foreground">
                  Je suis là pour vous aider à utiliser Burkina Watch.
                </p>
                <p className="text-[10px] md:text-xs text-muted-foreground mt-1 md:mt-2">
                  Posez-moi des questions sur :
                </p>
                <ul className="text-[10px] md:text-xs text-muted-foreground mt-1 md:mt-2 space-y-0.5 md:space-y-1">
                  <li>• Comment créer un signalement</li>
                  <li>• Les conseils de sécurité</li>
                  <li>• Comment fonctionne l'anonymat</li>
                  <li>• Les numéros d'urgence</li>
                </ul>
                <p className="text-xs text-muted-foreground mt-3 flex items-center gap-2">
                  <span>Propulsé par:</span>
                  <span className="flex items-center gap-1">
                    <span>🟢 Gemini</span>
                    <span className="text-muted-foreground/50">|</span>
                    <span>🔵 Groq</span>
                  </span>
                </p>
              </div>
            </div>
          ) : null}

          <div className="space-y-2 md:space-y-4">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                data-testid={`message-${msg.role}-${idx}`}
              >
                <div
                  className={`max-w-[85%] rounded-lg px-3 py-2 md:px-4 ${
                    msg.role === "user"
                      ? "bg-primary text-white"
                      : "bg-muted text-foreground"
                  }`}
                >
                  <p className="text-xs md:text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                </div>
              </div>
            ))}
            {chatMutation.isPending && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-lg px-4 py-2 flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm text-muted-foreground">En train d'écrire...</span>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="border-t p-2 md:p-4 bg-background">
          <div className="flex gap-1.5 md:gap-2">
            <Button
              onClick={toggleListening}
              disabled={chatMutation.isPending || historyLoading}
              size="icon"
              variant={isListening ? "destructive" : "outline"}
              className={`h-9 w-9 md:h-10 md:w-10 transition-all duration-300 ${
                isListening 
                  ? "animate-pulse bg-red-500 hover:bg-red-600 border-red-600" 
                  : "hover:bg-primary/10 hover:border-primary"
              }`}
              data-testid="button-voice-input"
              title={isListening ? "Arrêter l'écoute" : "Parler au lieu d'écrire"}
            >
              {isListening ? (
                <MicOff className="w-3.5 h-3.5 md:w-4 md:h-4" />
              ) : (
                <Mic className="w-3.5 h-3.5 md:w-4 md:h-4" />
              )}
            </Button>
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={isListening ? "🎤 Écoute en cours..." : historyLoading ? "Chargement..." : "Tapez ou parlez..."}
              disabled={chatMutation.isPending || historyLoading}
              className={`flex-1 text-xs md:text-sm h-9 md:h-10 transition-all duration-300 ${
                isListening ? "border-red-500 ring-1 ring-red-500/50" : ""
              }`}
              data-testid="input-chat-message"
            />
            <Button
              onClick={handleSend}
              disabled={!input.trim() || chatMutation.isPending || historyLoading}
              size="icon"
              className="bg-primary hover:bg-primary/90 h-9 w-9 md:h-10 md:w-10"
              data-testid="button-send-message"
            >
              {chatMutation.isPending ? (
                <Loader2 className="w-3.5 h-3.5 md:w-4 md:h-4 animate-spin" />
              ) : (
                <Send className="w-3.5 h-3.5 md:w-4 md:h-4" />
              )}
            </Button>
          </div>
          <p className="text-[10px] md:text-xs text-muted-foreground text-center mt-1.5 md:mt-2">
            🎤 Cliquez sur le micro pour parler | ⚠️ Urgence: 17 (Police) ou 18 (Pompiers)
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
