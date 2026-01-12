import { useState, useEffect, useCallback } from 'react';
import { Bell, BellOff, MapPin, Loader2, Shield, Cloud, Building2, Newspaper } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import {
  registerServiceWorker,
  subscribeToPush,
  unsubscribeFromPush,
  checkPushPermission,
  requestPushPermission,
  isPushSubscribed,
} from '@/lib/pushNotifications';

interface NotificationPreferences {
  id: string;
  userId: string;
  securityAlerts: boolean;
  weatherAlerts: boolean;
  pharmacyUpdates: boolean;
  generalNews: boolean;
  radiusKm: number;
}

interface PushNotificationManagerProps {
  compact?: boolean;
}

export function PushNotificationManager({ compact = false }: PushNotificationManagerProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isLoading, setIsLoading] = useState(false);
  const [locationEnabled, setLocationEnabled] = useState(false);
  const [radiusKm, setRadiusKm] = useState(5);
  const [prefRadiusKm, setPrefRadiusKm] = useState(50);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  const { data: preferences } = useQuery<NotificationPreferences>({
    queryKey: ['/api/push/preferences'],
    enabled: isSubscribed,
  });

  const updatePreferencesMutation = useMutation({
    mutationFn: async (prefs: Partial<NotificationPreferences>) => {
      return apiRequest('PUT', '/api/push/preferences', prefs);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/push/preferences'] });
      toast({
        title: 'Préférences mises à jour',
        description: 'Vos préférences de notification ont été enregistrées.',
      });
    },
  });

  const handlePreferenceChange = (key: keyof NotificationPreferences, value: boolean | number) => {
    updatePreferencesMutation.mutate({ [key]: value });
  };

  // Sync prefRadiusKm with preferences when loaded
  useEffect(() => {
    if (preferences?.radiusKm) {
      setPrefRadiusKm(preferences.radiusKm);
    }
  }, [preferences?.radiusKm]);

  useEffect(() => {
    const init = async () => {
      const supported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
      setIsSupported(supported);

      if (supported) {
        await registerServiceWorker();
        const perm = await checkPushPermission();
        setPermission(perm);
        const subscribed = await isPushSubscribed();
        setIsSubscribed(subscribed);
      }
    };
    init();
  }, []);

  const handleSubscribe = useCallback(async () => {
    setIsLoading(true);
    try {
      const perm = await requestPushPermission();
      setPermission(perm);

      if (perm !== 'granted') {
        toast({
          title: 'Permission refusee',
          description: 'Vous devez autoriser les notifications pour recevoir des alertes.',
          variant: 'destructive',
        });
        return;
      }

      let lat: number | undefined;
      let lng: number | undefined;

      if (locationEnabled && navigator.geolocation) {
        try {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              enableHighAccuracy: true,
              timeout: 10000,
            });
          });
          lat = position.coords.latitude;
          lng = position.coords.longitude;
          setUserLocation({ lat, lng });
        } catch {
          toast({
            title: 'Localisation indisponible',
            description: 'Les alertes seront envoyees sans filtre de localisation.',
          });
        }
      }

      const subscription = await subscribeToPush();
      
      if (subscription) {
        if (lat && lng) {
          await fetch('/api/push/update-location', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              endpoint: subscription.endpoint,
              latitude: lat,
              longitude: lng,
              radiusKm,
            }),
            credentials: 'include',
          });
        }
        
        setIsSubscribed(true);
        toast({
          title: 'Notifications activées',
          description: locationEnabled && lat
            ? `Vous recevrez des alertes dans un rayon de ${radiusKm} km.`
            : 'Vous recevrez des alertes pour les incidents importants.',
        });
      } else {
        toast({
          title: 'Configuration requise',
          description: 'Les notifications push ne sont pas encore configurées sur le serveur. Contactez l\'administrateur.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Subscription error:', error);
      toast({
        title: 'Erreur',
        description: "Impossible d'activer les notifications.",
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [locationEnabled, radiusKm, toast]);

  const handleUnsubscribe = useCallback(async () => {
    setIsLoading(true);
    try {
      await unsubscribeFromPush();
      setIsSubscribed(false);
      toast({
        title: 'Notifications desactivees',
        description: 'Vous ne recevrez plus de notifications push.',
      });
    } catch (error) {
      console.error('Unsubscribe error:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de desactiver les notifications.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  if (!isSupported) {
    return null;
  }

  if (compact) {
    return (
      <Button
        variant={isSubscribed ? 'default' : 'outline'}
        size="sm"
        onClick={isSubscribed ? handleUnsubscribe : handleSubscribe}
        disabled={isLoading}
        className="gap-2"
        data-testid="button-push-toggle"
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : isSubscribed ? (
          <>
            <Bell className="w-4 h-4" />
            <span className="hidden sm:inline">Alertes actives</span>
          </>
        ) : (
          <>
            <BellOff className="w-4 h-4" />
            <span className="hidden sm:inline">Activer alertes</span>
          </>
        )}
      </Button>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-primary" />
          Notifications Push
        </CardTitle>
        <CardDescription>
          Recevez des alertes en temps reel pour les incidents pres de vous
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Label>Notifications push</Label>
            <p className="text-sm text-muted-foreground">
              {isSubscribed ? 'Alertes activees' : 'Alertes desactivees'}
            </p>
          </div>
          <Switch
            checked={isSubscribed}
            onCheckedChange={(checked) => {
              if (checked) handleSubscribe();
              else handleUnsubscribe();
            }}
            disabled={isLoading || permission === 'denied'}
            data-testid="switch-push-notifications"
          />
        </div>

        {permission === 'denied' && (
          <p className="text-sm text-destructive">
            Les notifications sont bloquees. Veuillez les autoriser dans les parametres de votre navigateur.
          </p>
        )}

        {!isSubscribed && permission !== 'denied' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Switch
                id="location-filter"
                checked={locationEnabled}
                onCheckedChange={setLocationEnabled}
                data-testid="switch-location-filter"
              />
              <Label htmlFor="location-filter" className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Filtrer par localisation
              </Label>
            </div>

            {locationEnabled && (
              <div className="space-y-2">
                <Label>Rayon d'alerte: {radiusKm} km</Label>
                <Slider
                  value={[radiusKm]}
                  onValueChange={(v) => setRadiusKm(v[0])}
                  min={5}
                  max={200}
                  step={5}
                  className="w-full"
                  data-testid="slider-radius"
                />
                <p className="text-xs text-muted-foreground">
                  Recevez des alertes pour les incidents dans ce rayon autour de votre position
                </p>
              </div>
            )}

            <Button
              onClick={handleSubscribe}
              disabled={isLoading}
              className="w-full gap-2"
              data-testid="button-subscribe-push"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Bell className="w-4 h-4" />
              )}
              Activer les notifications
            </Button>
          </div>
        )}

        {isSubscribed && userLocation && (
          <div className="text-sm text-muted-foreground">
            Position enregistrée. Rayon: {radiusKm} km
          </div>
        )}

        {isSubscribed && preferences && (
          <div className="space-y-4 pt-4 border-t">
            <h4 className="font-medium">Types d'alertes à recevoir</h4>

            <div className="flex items-center justify-between">
              <Label htmlFor="security-alerts" className="flex items-center gap-2 cursor-pointer">
                <Shield className="w-4 h-4 text-red-500" />
                <div>
                  <p className="font-medium">Alertes de sécurité</p>
                  <p className="text-xs text-muted-foreground">Signalements et incidents</p>
                </div>
              </Label>
              <Switch
                id="security-alerts"
                checked={preferences.securityAlerts}
                onCheckedChange={(checked) => handlePreferenceChange('securityAlerts', checked)}
                data-testid="switch-security-alerts"
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="weather-alerts" className="flex items-center gap-2 cursor-pointer">
                <Cloud className="w-4 h-4 text-blue-500" />
                <div>
                  <p className="font-medium">Alertes météo</p>
                  <p className="text-xs text-muted-foreground">Conditions météorologiques</p>
                </div>
              </Label>
              <Switch
                id="weather-alerts"
                checked={preferences.weatherAlerts}
                onCheckedChange={(checked) => handlePreferenceChange('weatherAlerts', checked)}
                data-testid="switch-weather-alerts"
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="pharmacy-updates" className="flex items-center gap-2 cursor-pointer">
                <Building2 className="w-4 h-4 text-green-500" />
                <div>
                  <p className="font-medium">Pharmacies de garde</p>
                  <p className="text-xs text-muted-foreground">Mises à jour des gardes</p>
                </div>
              </Label>
              <Switch
                id="pharmacy-updates"
                checked={preferences.pharmacyUpdates}
                onCheckedChange={(checked) => handlePreferenceChange('pharmacyUpdates', checked)}
                data-testid="switch-pharmacy-updates"
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="general-news" className="flex items-center gap-2 cursor-pointer">
                <Newspaper className="w-4 h-4 text-yellow-500" />
                <div>
                  <p className="font-medium">Actualités officielles</p>
                  <p className="text-xs text-muted-foreground">Communications gouvernementales</p>
                </div>
              </Label>
              <Switch
                id="general-news"
                checked={preferences.generalNews}
                onCheckedChange={(checked) => handlePreferenceChange('generalNews', checked)}
                data-testid="switch-general-news"
              />
            </div>

            <div className="space-y-2 pt-2">
              <Label className="flex items-center justify-between">
                <span>Rayon de notification</span>
                <span className="text-sm font-normal text-muted-foreground">
                  {prefRadiusKm} km
                </span>
              </Label>
              <Slider
                value={[prefRadiusKm]}
                min={5}
                max={200}
                step={5}
                onValueChange={(value) => setPrefRadiusKm(value[0])}
                onValueCommit={(value) => handlePreferenceChange('radiusKm', value[0])}
                data-testid="slider-radius-pref"
              />
              <p className="text-xs text-muted-foreground">
                Recevez les alertes dans un rayon de {prefRadiusKm} km.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
