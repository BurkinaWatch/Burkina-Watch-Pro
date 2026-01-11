import { useState, useEffect, useCallback, useRef } from "react";
import { Mic, MicOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface SpeechRecognitionResult {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: { 0: SpeechRecognitionResult; isFinal: boolean };
}

interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent {
  error: string;
}

interface SpeechRecognitionInstance {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

interface VoiceSearchButtonProps {
  onResult?: (transcript: string) => void;
  onQueryChange?: (transcript: string) => void;
  onListeningChange?: (isListening: boolean) => void;
  className?: string;
  size?: "default" | "sm" | "lg" | "icon";
  variant?: "default" | "outline" | "ghost" | "secondary";
  language?: string;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognitionInstance;
    webkitSpeechRecognition: new () => SpeechRecognitionInstance;
  }
}

export function VoiceSearchButton({
  onResult,
  onQueryChange,
  onListeningChange,
  className,
  size = "icon",
  variant = "ghost",
  language = "fr-FR",
}: VoiceSearchButtonProps) {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  // Support both onResult and onQueryChange (alias)
  const resultHandler = onResult || onQueryChange;
  const onResultRef = useRef(resultHandler);
  const onListeningChangeRef = useRef(onListeningChange);
  const { toast } = useToast();

  onResultRef.current = resultHandler;
  onListeningChangeRef.current = onListeningChange;

  useEffect(() => {
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognitionAPI) {
      setIsSupported(false);
      return;
    }

    const recognitionInstance = new SpeechRecognitionAPI();
    recognitionInstance.continuous = false;
    recognitionInstance.interimResults = true;
    recognitionInstance.lang = language;
    recognitionInstance.maxAlternatives = 1;

    recognitionInstance.onresult = (event) => {
      const last = event.results.length - 1;
      const transcript = event.results[last][0].transcript;
      
      if (event.results[last].isFinal) {
        onResultRef.current?.(transcript.trim());
        setIsListening(false);
        onListeningChangeRef.current?.(false);
      }
    };

    recognitionInstance.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
      setIsListening(false);
      onListeningChangeRef.current?.(false);
      
      if (event.error === "not-allowed") {
        toast({
          title: "Microphone non autorise",
          description: "Veuillez autoriser l'acces au microphone dans les parametres de votre navigateur.",
          variant: "destructive",
        });
      } else if (event.error === "no-speech") {
        toast({
          title: "Aucune voix detectee",
          description: "Essayez de parler plus fort ou rapprochez-vous du microphone.",
        });
      } else if (event.error !== "aborted") {
        toast({
          title: "Erreur de reconnaissance",
          description: "Une erreur s'est produite. Veuillez reessayer.",
          variant: "destructive",
        });
      }
    };

    recognitionInstance.onend = () => {
      setIsListening(false);
      onListeningChangeRef.current?.(false);
    };

    recognitionRef.current = recognitionInstance;

    return () => {
      recognitionInstance.abort();
    };
  }, [language, toast]);

  const toggleListening = useCallback(() => {
    const recognition = recognitionRef.current;
    if (!recognition) return;

    if (isListening) {
      recognition.stop();
      setIsListening(false);
      onListeningChangeRef.current?.(false);
    } else {
      try {
        recognition.start();
        setIsListening(true);
        onListeningChangeRef.current?.(true);
        toast({
          title: "Ecoute en cours...",
          description: "Parlez maintenant pour rechercher",
        });
      } catch (error) {
        console.error("Failed to start recognition:", error);
        toast({
          title: "Erreur",
          description: "Impossible de demarrer la reconnaissance vocale.",
          variant: "destructive",
        });
      }
    }
  }, [isListening, toast]);

  if (!isSupported) {
    return null;
  }

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      onClick={toggleListening}
      className={cn(
        "relative",
        isListening && "text-destructive",
        className
      )}
      data-testid="button-voice-search"
      aria-label={isListening ? "Arreter l'ecoute" : "Recherche vocale"}
    >
      {isListening ? (
        <>
          <MicOff className="h-4 w-4" />
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-destructive"></span>
          </span>
        </>
      ) : (
        <Mic className="h-4 w-4" />
      )}
    </Button>
  );
}

export function VoiceSearchInput({
  value,
  onChange,
  placeholder = "Rechercher...",
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}) {
  const [isListening, setIsListening] = useState(false);

  return (
    <div className={cn("relative flex items-center gap-2", className)}>
      <div className="relative flex-1">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={cn(
            "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors",
            "file:border-0 file:bg-transparent file:text-sm file:font-medium",
            "placeholder:text-muted-foreground",
            "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
            "disabled:cursor-not-allowed disabled:opacity-50",
            "pr-10",
            isListening && "ring-2 ring-destructive animate-pulse"
          )}
          data-testid="input-voice-search"
        />
        <div className="absolute right-1 top-1/2 -translate-y-1/2">
          <VoiceSearchButton
            onResult={onChange}
            onListeningChange={setIsListening}
            size="sm"
            variant="ghost"
          />
        </div>
      </div>
    </div>
  );
}
