import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface OnboardingContextType {
  showTips: boolean;
  setShowTips: (show: boolean) => void;
  hasSeenTip: (tipId: string) => boolean;
  markTipAsSeen: (tipId: string) => void;
  resetTips: () => void;
  dismissAllTips: () => void;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

const STORAGE_KEY = 'burkinawatch_onboarding';
const TIPS_ENABLED_KEY = 'burkinawatch_tips_enabled';

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [showTips, setShowTipsState] = useState(true);
  const [seenTips, setSeenTips] = useState<Set<string>>(new Set());

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setSeenTips(new Set(JSON.parse(stored)));
      } catch {
        setSeenTips(new Set());
      }
    }
    
    const tipsEnabled = localStorage.getItem(TIPS_ENABLED_KEY);
    if (tipsEnabled !== null) {
      setShowTipsState(tipsEnabled === 'true');
    }
  }, []);

  const setShowTips = (show: boolean) => {
    setShowTipsState(show);
    localStorage.setItem(TIPS_ENABLED_KEY, String(show));
  };

  const hasSeenTip = (tipId: string) => seenTips.has(tipId);

  const markTipAsSeen = (tipId: string) => {
    setSeenTips(prev => {
      const newSet = new Set(prev);
      newSet.add(tipId);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(newSet)));
      return newSet;
    });
  };

  const resetTips = () => {
    setSeenTips(new Set());
    localStorage.removeItem(STORAGE_KEY);
    setShowTips(true);
  };

  const dismissAllTips = () => {
    setShowTips(false);
  };

  return (
    <OnboardingContext.Provider value={{ 
      showTips, 
      setShowTips, 
      hasSeenTip, 
      markTipAsSeen, 
      resetTips,
      dismissAllTips 
    }}>
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error('useOnboarding must be used within OnboardingProvider');
  }
  return context;
}
