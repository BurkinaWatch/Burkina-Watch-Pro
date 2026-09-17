import AsyncStorage from '@react-native-async-storage/async-storage';
import { PropsWithChildren, createContext, useContext, useEffect, useMemo, useState } from 'react';

const INTERFACE_MODE_KEY = '@burkinawatch/interface-mode';

export type InterfaceMode = 'simple' | 'web';

type InterfaceModeContextValue = {
  mode: InterfaceMode | null;
  isReady: boolean;
  selectMode: (mode: InterfaceMode) => Promise<void>;
};

const InterfaceModeContext = createContext<InterfaceModeContextValue | null>(null);

export function InterfaceModeProvider({ children }: PropsWithChildren) {
  const [mode, setMode] = useState<InterfaceMode | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let active = true;
    void AsyncStorage.getItem(INTERFACE_MODE_KEY)
      .then((savedMode) => {
        if (!active) return;
        setMode(savedMode === 'simple' || savedMode === 'web' ? savedMode : null);
      })
      .finally(() => {
        if (active) setIsReady(true);
      });

    return () => {
      active = false;
    };
  }, []);

  async function selectMode(nextMode: InterfaceMode) {
    setMode(nextMode);
    try {
      await AsyncStorage.setItem(INTERFACE_MODE_KEY, nextMode);
    } catch {
      // The current session still follows the selected mode if persistence is unavailable.
    }
  }

  const value = useMemo(
    () => ({ mode, isReady, selectMode }),
    [isReady, mode],
  );

  return <InterfaceModeContext.Provider value={value}>{children}</InterfaceModeContext.Provider>;
}

export function useInterfaceMode() {
  const context = useContext(InterfaceModeContext);
  if (!context) {
    throw new Error('useInterfaceMode doit être utilisé dans InterfaceModeProvider.');
  }
  return context;
}