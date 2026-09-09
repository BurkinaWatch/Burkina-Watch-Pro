
import { createContext, useContext, useState, useEffect } from "react";

type StealthModeContextType = {
  isStealthMode: boolean;
  toggleStealthMode: () => void;
};

const StealthModeContext = createContext<StealthModeContextType | undefined>(undefined);

export function StealthModeProvider({ children }: { children: React.ReactNode }) {
  const [isStealthMode, setIsStealthMode] = useState(() => {
    const stored = localStorage.getItem("stealthMode");
    return stored === "true";
  });

  useEffect(() => {
    localStorage.setItem("stealthMode", isStealthMode.toString());
    
    if (isStealthMode) {
      document.body.classList.add("stealth-mode");
    } else {
      document.body.classList.remove("stealth-mode");
    }
  }, [isStealthMode]);

  const toggleStealthMode = () => {
    setIsStealthMode((prev) => !prev);
  };

  return (
    <StealthModeContext.Provider value={{ isStealthMode, toggleStealthMode }}>
      {children}
    </StealthModeContext.Provider>
  );
}

export function useStealthMode() {
  const context = useContext(StealthModeContext);
  if (!context) {
    throw new Error("useStealthMode must be used within StealthModeProvider");
  }
  return context;
}
