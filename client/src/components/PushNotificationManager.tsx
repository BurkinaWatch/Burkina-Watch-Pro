import { useState, useEffect, useCallback } from 'react';
import { Bell, BellOff, MapPin, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import {
  registerServiceWorker,
  subscribeToPush,
  unsubscribeFromPush,
  checkPushPermission,
  requestPushPermission,
  isPushSubscribed,
} from '@/lib/pushNotifications';

interface PushNotificationManagerProps {
  compact?: boolean;
}

export function PushNotificationManager({ compact = false }: PushNotificationManagerProps) {
  const { toast } = useToast();
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isLoading, setIsLoading] = useState(false);
  const [locationEnabled, setLocationEnabled] = useState(false);
  const [radiusKm, setRadiusKm] = useState(5);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

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
          title: 'Notifications activees',
          description: locationEnabled && lat
            ? `Vous recevrez des alertes dans un rayon de ${radiusKm} km.`
            : 'Vous recevrez des alertes pour les incidents importants.',
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
                  min={1}
                  max={50}
                  step={1}
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
            Position enregistree. Rayon: {radiusKm} km
          </div>
        )}
      </CardContent>
    </Card>
  );
}
