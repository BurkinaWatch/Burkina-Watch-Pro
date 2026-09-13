import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BellRing, MapPin, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { registerServiceWorker, requestPushPermission, subscribeToPush } from "@/lib/pushNotifications";

type PlaceExperienceConfigResponse = {
  config: { enabled: boolean; dwellThresholdSeconds: number };
  readiness: {
    enabled: boolean;
    locationPermissionGranted: boolean;
    pushSubscriptionActive: boolean;
  };
};

type PresenceResponse = {
  checkInEligible?: boolean;
  visit?: { id: string; status: string };
  place?: { name?: string };
};

export function PlaceExperienceSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [eligibleVisit, setEligibleVisit] = useState<PresenceResponse["visit"] & { placeName?: string }>();
  const lastPresenceAt = useRef(0);

  const configQuery = useQuery<PlaceExperienceConfigResponse>({
    queryKey: ["/api/place-experience/config"],
    staleTime: 60 * 1000,
  });

  const consentMutation = useMutation({
    mutationFn: (body: { enabled: boolean; locationPermissionGranted: boolean }) =>
      apiRequest("PUT", "/api/place-experience/consent", body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["/api/place-experience/config"] });
    },
  });

  useEffect(() => {
    const readiness = configQuery.data?.readiness;
    if (!readiness?.enabled || !readiness.locationPermissionGranted || !readiness.pushSubscriptionActive) return;
    if (!navigator.geolocation) return;

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const now = Date.now();
        if (now - lastPresenceAt.current < 60_000) return;
        lastPresenceAt.current = now;
        void apiRequest("POST", "/api/place-experience/presence", {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracyMeters: position.coords.accuracy,
          speedMps: position.coords.speed ?? 0,
        }).then(async (response) => {
          const result = (await response.json()) as PresenceResponse;
          if (result.checkInEligible && result.visit) {
            setEligibleVisit({ ...result.visit, placeName: result.place?.name });
          }
        }).catch(() => {
          // Presence is opt-in and best-effort while the page is open.
        });
      },
      () => undefined,
      { enableHighAccuracy: true, maximumAge: 30_000, timeout: 15_000 },
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [configQuery.data?.readiness]);

  async function toggleExperience(enabled: boolean) {
    setBusy(true);
    try {
      if (!enabled) {
        await consentMutation.mutateAsync({
          enabled: false,
          locationPermissionGranted: Boolean(configQuery.data?.readiness.locationPermissionGranted),
        });
        toast({ title: "Expérience du lieu désactivée", description: "Aucune présence ne sera observée." });
        return;
      }

      if (!navigator.geolocation) throw new Error("La géolocalisation n'est pas disponible dans ce navigateur.");
      const permission = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 15_000 });
      });
      await registerServiceWorker();
      const pushPermission = await requestPushPermission();
      if (pushPermission !== "granted" || !(await subscribeToPush())) {
        throw new Error("Les notifications push doivent être activées pour utiliser cette fonctionnalité.");
      }
      await consentMutation.mutateAsync({
        enabled: true,
        locationPermissionGranted: permission.coords.accuracy >= 0,
      });
      toast({
        title: "Expérience du lieu activée",
        description: "La présence reste volontaire et limitée à l’utilisation active de BurkinaWatch.",
      });
    } catch (error) {
      toast({
        title: "Activation impossible",
        description: error instanceof Error ? error.message : "Vérifiez les permissions puis réessayez.",
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  }

  async function submitResponse(perception: "SAFE" | "UNCERTAIN" | "UNSAFE") {
    if (!eligibleVisit) return;
    try {
      await apiRequest("POST", `/api/place-experience/visits/${eligibleVisit.id}/response`, { perception });
      setEligibleVisit(undefined);
      toast({ title: "Contribution enregistrée", description: "Votre perception reste séparée des incidents." });
    } catch {
      toast({ title: "Réponse non enregistrée", description: "Réessayez lorsque la connexion sera disponible.", variant: "destructive" });
    }
  }

  async function deferResponse() {
    if (!eligibleVisit) return;
    try {
      await apiRequest("POST", `/api/place-experience/visits/${eligibleVisit.id}/defer`);
      setEligibleVisit(undefined);
    } catch {
      toast({ title: "Report impossible", description: "Réessayez lorsque la connexion sera disponible.", variant: "destructive" });
    }
  }

  if (!configQuery.data) return null;

  const enabled = configQuery.data.readiness.enabled;
  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <ShieldCheck className="h-4 w-4" /> Expérience du lieu
        </CardTitle>
        <CardDescription>
          Partagez volontairement une perception après une présence prolongée. Aucune trajectoire complète ni garantie de sécurité n’est produite.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between gap-4 rounded-md border p-3">
          <div className="flex items-start gap-3">
            <MapPin className="mt-0.5 h-4 w-4 text-emerald-700" />
            <div>
              <p className="text-sm font-medium">Présence locale volontaire</p>
              <p className="text-xs text-muted-foreground">
                La localisation active et les notifications sont nécessaires. Délai actuel : {Math.round(configQuery.data.config.dwellThresholdSeconds / 60)} minutes.
              </p>
            </div>
          </div>
          <Switch checked={enabled} disabled={busy || !configQuery.data.config.enabled} onCheckedChange={(value) => void toggleExperience(value)} />
        </div>
        {!configQuery.data.readiness.pushSubscriptionActive && enabled ? (
          <p className="flex items-center gap-2 text-xs text-amber-700"><BellRing className="h-3.5 w-3.5" /> Les notifications push ne sont pas prêtes.</p>
        ) : null}
        {eligibleVisit ? (
          <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3">
            <p className="text-sm font-medium">Comment avez-vous vécu {eligibleVisit.placeName || "ce lieu"} ?</p>
            <p className="mt-1 text-xs text-muted-foreground">Votre réponse est une perception citoyenne, pas un incident.</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button size="sm" variant="outline" onClick={() => void submitResponse("SAFE")}>SAFE</Button>
              <Button size="sm" variant="outline" onClick={() => void submitResponse("UNCERTAIN")}>INCERTAIN</Button>
              <Button size="sm" variant="outline" onClick={() => void submitResponse("UNSAFE")}>UNSAFE</Button>
              <Button size="sm" variant="ghost" onClick={() => void deferResponse()}>Plus tard</Button>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}