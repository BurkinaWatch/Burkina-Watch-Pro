
import { useEffect, useRef } from 'react';

export function useOnlineStatus(isAuthenticated: boolean) {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isOnlineRef = useRef(false);
  const isUnloadingRef = useRef(false);

  useEffect(() => {
    if (!isAuthenticated) {
      isOnlineRef.current = false;
      return;
    }

    // Fonction pour mettre à jour le statut
    const updateOnlineStatus = async () => {
      if (isUnloadingRef.current) return;
      
      try {
        await fetch('/api/user/online', {
          method: 'POST',
          credentials: 'include',
        });
        isOnlineRef.current = true;
      } catch (error) {
        console.error('Erreur mise à jour statut en ligne:', error);
      }
    };

    // Fonction pour supprimer le statut
    const removeOnlineStatus = async () => {
      if (!isOnlineRef.current || isUnloadingRef.current) return;

      try {
        await fetch('/api/user/offline', {
          method: 'POST',
          credentials: 'include',
        });
        isOnlineRef.current = false;
      } catch (error) {
        console.error('Erreur suppression statut en ligne:', error);
      }
    };

    // Mettre à jour immédiatement
    updateOnlineStatus();

    // Mettre à jour toutes les 2 minutes
    intervalRef.current = setInterval(updateOnlineStatus, 120000);

    // Gérer la déconnexion
    const handleBeforeUnload = () => {
      isUnloadingRef.current = true;
      if (isOnlineRef.current) {
        navigator.sendBeacon('/api/user/offline');
      }
    };

    const handleVisibilityChange = () => {
      if (isUnloadingRef.current) return;
      
      if (document.visibilityState === 'hidden') {
        // Ne pas se déconnecter immédiatement, juste arrêter les mises à jour
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      } else if (document.visibilityState === 'visible') {
        // Reprendre les mises à jour
        updateOnlineStatus();
        if (!intervalRef.current) {
          intervalRef.current = setInterval(updateOnlineStatus, 120000);
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      
      // Déconnexion finale seulement si pas en cours de déchargement
      if (!isUnloadingRef.current) {
        removeOnlineStatus();
      }
    };
  }, [isAuthenticated]);
}
