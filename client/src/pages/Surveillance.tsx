import { useCallback, useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Camera,
  CheckCircle2,
  CircleAlert,
  Loader2,
  Pencil,
  Power,
  Plus,
  RefreshCw,
  ShieldCheck,
  Trash2,
  Video,
  Wifi,
  WifiOff,
  X,
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type ConnectionType = "rtsp" | "onvif";
type CameraStatus = "unknown" | "online" | "offline" | "disabled" | "error";

interface SurveillanceCamera {
  id: string;
  name: string;
  description: string | null;
  connectionType: ConnectionType;
  host: string;
  port: number;
  streamPath: string | null;
  status: CameraStatus;
  lastSeenAt: string | null;
  createdAt: string;
  updatedAt: string;
  hasCredentials: boolean;
}

interface CameraFormState {
  name: string;
  description: string;
  connectionType: ConnectionType;
  host: string;
  port: string;
  username: string;
  password: string;
  streamPath: string;
}

type LiveState =
  | "idle"
  | "connecting"
  | "live"
  | "offline"
  | "error"
  | "reconnecting";

type StreamStatus = "unknown" | "connecting" | "online" | "offline" | "error";

interface TestCameraResponse {
  enabled: boolean;
  camera?: {
    id: string;
    name: string;
    description: string;
    connectionType: "rtsp";
    host: string;
    port: number;
    streamPath: string;
    status: "unknown";
    isTest: true;
  };
}

interface LiveAccessResponse {
  cameraId: string;
  status: StreamStatus;
  cameraStatus: CameraStatus;
  streamStatus: StreamStatus;
  whepUrl: string;
  viewerToken: string;
  expiresAt: number;
  sessionId: string;
}

const emptyForm: CameraFormState = {
  name: "",
  description: "",
  connectionType: "rtsp",
  host: "",
  port: "554",
  username: "",
  password: "",
  streamPath: "",
};

function statusLabel(status: CameraStatus): string {
  return {
    unknown: "Non vérifiée",
    online: "En ligne",
    offline: "Hors ligne",
    disabled: "Désactivée",
    error: "Erreur",
  }[status];
}

function statusVariant(
  status: CameraStatus,
): "default" | "secondary" | "destructive" | "outline" {
  if (status === "online") return "default";
  if (status === "offline" || status === "error") return "destructive";
  if (status === "disabled") return "secondary";
  return "outline";
}

function cameraToForm(camera: SurveillanceCamera): CameraFormState {
  return {
    name: camera.name,
    description: camera.description ?? "",
    connectionType: camera.connectionType,
    host: camera.host,
    port: String(camera.port),
    username: "",
    password: "",
    streamPath: camera.streamPath ?? "",
  };
}

function liveStateLabel(state: LiveState): string {
  return {
    idle: "Prêt à démarrer",
    connecting: "Connexion à la caméra…",
    live: "En direct",
    offline: "Caméra hors ligne",
    error: "Erreur de connexion",
    reconnecting: "Reconnexion en cours",
  }[state];
}

function streamStatusLabel(status: StreamStatus): string {
  return {
    unknown: "Inconnu",
    connecting: "Connexion",
    online: "En ligne",
    offline: "Hors ligne",
    error: "Erreur",
  }[status];
}

function waitForIceGatheringComplete(
  peerConnection: RTCPeerConnection,
): Promise<void> {
  if (peerConnection.iceGatheringState === "complete") {
    return Promise.resolve();
  }
  return new Promise((resolve) => {
    const handleStateChange = () => {
      if (peerConnection.iceGatheringState === "complete") {
        peerConnection.removeEventListener(
          "icegatheringstatechange",
          handleStateChange,
        );
        resolve();
      }
    };
    peerConnection.addEventListener(
      "icegatheringstatechange",
      handleStateChange,
    );
  });
}

function LiveCameraPlayer({
  cameraId,
  cameraStatus,
}: {
  cameraId: string;
  cameraStatus?: CameraStatus;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);
  const reconnectAttemptRef = useRef(0);
  const [state, setState] = useState<LiveState>("idle");
  const [gatewayStatus, setGatewayStatus] = useState<StreamStatus>("unknown");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const revokeSession = useCallback(async () => {
    const sessionId = sessionIdRef.current;
    sessionIdRef.current = null;
    if (!sessionId) return;
    try {
      await apiRequest(
        "POST",
        `/api/surveillance/live/${encodeURIComponent(sessionId)}/revoke`,
      );
    } catch {
      // The grant is short-lived; an unavailable control plane cannot make
      // the browser continue receiving media after the peer is closed.
    }
  }, []);

  const closePeerConnection = useCallback(async () => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
    const peerConnection = peerConnectionRef.current;
    peerConnectionRef.current = null;
    if (peerConnection) {
      peerConnection.ontrack = null;
      peerConnection.onconnectionstatechange = null;
      peerConnection.oniceconnectionstatechange = null;
      peerConnection.close();
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    await revokeSession();
  }, [revokeSession]);

  const connect = useCallback(async () => {
    await closePeerConnection();
    if (!mountedRef.current) return;

    setState("connecting");
    setErrorMessage(null);
    try {
      const accessResponse = await apiRequest(
        "GET",
        `/api/surveillance/cameras/${encodeURIComponent(cameraId)}/live`,
      );
      const access = (await accessResponse.json()) as LiveAccessResponse;
      sessionIdRef.current = access.sessionId;
      setGatewayStatus(access.streamStatus ?? access.status);

      if (access.status === "offline") {
        await closePeerConnection();
        if (mountedRef.current) setState("offline");
        return;
      }

      const peerConnection = new RTCPeerConnection({ iceServers: [] });
      peerConnectionRef.current = peerConnection;
      peerConnection.addTransceiver("video", { direction: "recvonly" });
      peerConnection.addTransceiver("audio", { direction: "recvonly" });

      peerConnection.ontrack = (event) => {
        if (!videoRef.current) return;
        const [stream] = event.streams;
        if (stream) {
          videoRef.current.srcObject = stream;
        }
        void videoRef.current.play().catch(() => {
          // The video is muted and inline; this handles stricter autoplay
          // policies without pretending that the connection is live.
        });
      };
      peerConnection.onconnectionstatechange = () => {
        if (!mountedRef.current) return;
        if (peerConnection.connectionState === "connected") {
          reconnectAttemptRef.current = 0;
          setState("live");
        } else if (
          peerConnection.connectionState === "failed" ||
          peerConnection.connectionState === "disconnected"
        ) {
          setState("reconnecting");
        }
      };
      peerConnection.oniceconnectionstatechange = () => {
        if (!mountedRef.current) return;
        if (peerConnection.iceConnectionState === "failed") {
          setState("error");
        }
      };

      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);
      await waitForIceGatheringComplete(peerConnection);
      const localDescription = peerConnection.localDescription;
      if (!localDescription?.sdp) {
        throw new Error("Offre WebRTC absente");
      }

      const whepResponse = await fetch(access.whepUrl, {
        method: "POST",
        headers: {
          Accept: "application/sdp",
          Authorization: `Bearer ${access.viewerToken}`,
          "Content-Type": "application/sdp",
        },
        body: localDescription.sdp,
      });
      if (!whepResponse.ok) {
        throw new Error(`WHEP ${whepResponse.status}`);
      }
      const answer = await whepResponse.text();
      await peerConnection.setRemoteDescription({
        type: "answer",
        sdp: answer,
      });
    } catch (error) {
      await closePeerConnection();
      if (!mountedRef.current) return;
      const message =
        error instanceof Error ? error.message : "Connexion impossible";
      setErrorMessage(
        message.includes("503") || message.includes("offline")
          ? "La caméra de test est hors ligne."
          : "Le lecteur WebRTC n'a pas pu se connecter.",
      );
      setState(message.includes("503") ? "offline" : "error");
    }
  }, [cameraId, closePeerConnection]);

  const scheduleReconnect = useCallback(() => {
    if (!mountedRef.current || reconnectTimerRef.current) return;
    if (reconnectAttemptRef.current >= 3) {
      setState("error");
      return;
    }
    const delay = 1500 * 2 ** reconnectAttemptRef.current;
    reconnectAttemptRef.current += 1;
    reconnectTimerRef.current = setTimeout(() => {
      reconnectTimerRef.current = null;
      void connect();
    }, delay);
  }, [connect]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      void closePeerConnection();
    };
  }, [closePeerConnection]);

  useEffect(() => {
    if (state === "reconnecting") scheduleReconnect();
  }, [scheduleReconnect, state]);

  const stop = async () => {
    reconnectAttemptRef.current = 3;
    await closePeerConnection();
    if (mountedRef.current) setState("idle");
  };

  return (
    <div className="overflow-hidden rounded-xl border bg-black" data-testid="live-camera-player">
      <div className="relative aspect-video">
        <video
          ref={videoRef}
          className="h-full w-full object-contain"
          autoPlay
          muted
          playsInline
          aria-label="Flux vidéo de la caméra de test"
        />
        {state !== "live" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-950/90 px-4 text-center text-white">
            {state === "connecting" ? (
              <Loader2 className="h-7 w-7 animate-spin text-primary" aria-hidden="true" />
            ) : state === "offline" ? (
              <WifiOff className="h-7 w-7 text-amber-300" aria-hidden="true" />
            ) : state === "error" ? (
              <CircleAlert className="h-7 w-7 text-red-300" aria-hidden="true" />
            ) : (
              <Video className="h-7 w-7 text-slate-300" aria-hidden="true" />
            )}
            <p className="text-sm font-medium">{liveStateLabel(state)}</p>
            {errorMessage && (
              <p className="max-w-xs text-xs text-slate-300">{errorMessage}</p>
            )}
          </div>
        )}
        {state === "live" && (
          <div className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-red-600 px-2.5 py-1 text-xs font-semibold text-white">
            <span className="h-1.5 w-1.5 rounded-full bg-white" aria-hidden="true" />
            EN DIRECT
          </div>
        )}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 bg-background p-3">
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span>Lecteur : {liveStateLabel(state)}</span>
          <span>Gateway : {streamStatusLabel(gatewayStatus)}</span>
          {cameraStatus && <span>Caméra : {statusLabel(cameraStatus)}</span>}
        </div>
        <div className="flex gap-2">
          {(state === "idle" ||
            state === "offline" ||
            state === "error") && (
            <Button size="sm" onClick={() => void connect()}>
              <RefreshCw className="mr-2 h-3.5 w-3.5" aria-hidden="true" />
              {state === "idle" ? "Démarrer le live" : "Réessayer"}
            </Button>
          )}
          {(state === "connecting" ||
            state === "live" ||
            state === "reconnecting") && (
            <Button size="sm" variant="outline" onClick={() => void stop()}>
              Arrêter
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Surveillance() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [editingCamera, setEditingCamera] = useState<SurveillanceCamera | null>(
    null,
  );
  const [form, setForm] = useState<CameraFormState>(emptyForm);

  const camerasQuery = useQuery<SurveillanceCamera[]>({
    queryKey: ["/api/surveillance/cameras"],
  });
  const testCameraQuery = useQuery<TestCameraResponse>({
    queryKey: ["/api/surveillance/test-camera"],
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const body: Record<string, unknown> = {
        name: form.name,
        description: form.description,
        connectionType: form.connectionType,
        host: form.host,
        port: Number(form.port),
        username: form.username,
        streamPath: form.streamPath,
      };

      if (!editingCamera || form.password.trim() !== "") {
        body.password = form.password;
      }

      const response = await apiRequest(
        editingCamera
          ? "PATCH"
          : "POST",
        editingCamera
          ? `/api/surveillance/cameras/${editingCamera.id}`
          : "/api/surveillance/cameras",
        body,
      );
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/surveillance/cameras"],
      });
      setFormOpen(false);
      setEditingCamera(null);
      setForm(emptyForm);
      toast({
        title: editingCamera ? "Caméra mise à jour" : "Caméra ajoutée",
        description: "Les informations ont été enregistrées de façon sécurisée.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Impossible d'enregistrer la caméra",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (cameraId: string) => {
      await apiRequest("DELETE", `/api/surveillance/cameras/${cameraId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/surveillance/cameras"],
      });
      toast({ title: "Caméra supprimée" });
    },
    onError: (error: Error) => {
      toast({
        title: "Suppression impossible",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const statusMutation = useMutation({
    mutationFn: async ({
      cameraId,
      status,
    }: {
      cameraId: string;
      status: "unknown" | "disabled";
    }) => {
      const response = await apiRequest(
        "PATCH",
        `/api/surveillance/cameras/${cameraId}`,
        { status },
      );
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/surveillance/cameras"],
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Modification impossible",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const connectionTestMutation = useMutation({
    mutationFn: async (cameraId: string) => {
      const response = await apiRequest(
        "POST",
        `/api/surveillance/cameras/${encodeURIComponent(cameraId)}/test-connection`,
      );
      return (await response.json()) as {
        success: boolean;
        status: CameraStatus;
      };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({
        queryKey: ["/api/surveillance/cameras"],
      });
      toast({
        title: result.success ? "Caméra accessible" : "Caméra inaccessible",
        description: result.success
          ? "La connexion RTSP a été vérifiée."
          : "Le serveur n'a pas pu joindre cette caméra.",
        variant: result.success ? "default" : "destructive",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Test de connexion impossible",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const openCreateForm = () => {
    setEditingCamera(null);
    setForm(emptyForm);
    setFormOpen(true);
  };

  const openEditForm = (camera: SurveillanceCamera) => {
    setEditingCamera(camera);
    setForm(cameraToForm(camera));
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditingCamera(null);
    setForm(emptyForm);
  };

  const updateForm = (field: keyof CameraFormState, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleDelete = (camera: SurveillanceCamera) => {
    if (
      window.confirm(
        `Supprimer définitivement la caméra « ${camera.name} » ?`,
      )
    ) {
      deleteMutation.mutate(camera.id);
    }
  };

  const cameras = camerasQuery.data ?? [];

  return (
    <main className="min-h-screen bg-background px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-primary/10 p-3 text-primary">
              <Camera className="h-6 w-6" aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm font-medium text-primary">Services</p>
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                Surveillance
              </h1>
              <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                 Gérez vos caméras privées et regardez leur flux live lorsque le
                 gateway contrôlé est activé pour cet environnement.
              </p>
            </div>
          </div>
          <Button onClick={openCreateForm} data-testid="button-add-camera">
            <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
            Ajouter une caméra
          </Button>
        </header>

        <Card className="border-primary/20 bg-primary/[0.03]">
          <CardContent className="flex items-start gap-3 p-4">
            <ShieldCheck
              className="mt-0.5 h-5 w-5 shrink-0 text-primary"
              aria-hidden="true"
            />
            <div className="text-sm">
              <p className="font-medium">Vos accès restent privés</p>
              <p className="mt-1 text-muted-foreground">
                Les mots de passe caméra sont chiffrés côté serveur et ne sont
                 jamais renvoyés à votre navigateur. Le flux RTSP reste isolé
                 dans le gateway et seul le visionnage authentifié est exposé.
              </p>
            </div>
          </CardContent>
        </Card>

        {testCameraQuery.data?.enabled && testCameraQuery.data.camera && (
          <Card className="border-amber-500/30 bg-amber-500/[0.04]" data-testid="test-camera-card">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="rounded-lg bg-amber-500/15 p-2 text-amber-600">
                    <Video className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">
                      {testCameraQuery.data.camera.name}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      RTSP synthétique local · Phase 5
                    </CardDescription>
                  </div>
                </div>
                <Badge variant="outline" className="border-amber-500/40 text-amber-700">
                  TEST LOCAL
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {testCameraQuery.data.camera.description}
              </p>
              <LiveCameraPlayer cameraId={testCameraQuery.data.camera.id} />
            </CardContent>
          </Card>
        )}

        {formOpen && (
          <Card data-testid="camera-form">
            <CardHeader className="flex-row items-start justify-between gap-4">
              <div>
                <CardTitle className="text-xl">
                  {editingCamera ? "Modifier la caméra" : "Ajouter une caméra"}
                </CardTitle>
                <CardDescription className="mt-2">
                   Décrivez l'endpoint privé de votre caméra. Le test réseau
                   reste une action explicite via le bouton dédié.
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={closeForm}
                aria-label="Fermer le formulaire"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </Button>
            </CardHeader>
            <CardContent>
              <form
                className="grid gap-4 md:grid-cols-2"
                onSubmit={(event) => {
                  event.preventDefault();
                  saveMutation.mutate();
                }}
              >
                <div className="space-y-2">
                  <Label htmlFor="camera-name">Nom de la caméra</Label>
                  <Input
                    id="camera-name"
                    value={form.name}
                    onChange={(event) => updateForm("name", event.target.value)}
                    placeholder="Caméra de l'entrée"
                    required
                    maxLength={120}
                    data-testid="input-camera-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="camera-type">Type de connexion</Label>
                  <select
                    id="camera-type"
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    value={form.connectionType}
                    onChange={(event) =>
                      updateForm(
                        "connectionType",
                        event.target.value as ConnectionType,
                      )
                    }
                    data-testid="select-camera-type"
                  >
                    <option value="rtsp">RTSP</option>
                    <option value="onvif">ONVIF</option>
                  </select>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="camera-description">Description</Label>
                  <Textarea
                    id="camera-description"
                    value={form.description}
                    onChange={(event) =>
                      updateForm("description", event.target.value)
                    }
                    placeholder="Entrée principale, atelier..."
                    maxLength={500}
                    rows={2}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="camera-host">Adresse / Host</Label>
                  <Input
                    id="camera-host"
                    value={form.host}
                    onChange={(event) => updateForm("host", event.target.value)}
                    placeholder="camera-test.local ou 192.168.50.20"
                    required
                    maxLength={253}
                    autoComplete="off"
                    data-testid="input-camera-host"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="camera-port">Port</Label>
                  <Input
                    id="camera-port"
                    type="number"
                    min={1}
                    max={65535}
                    value={form.port}
                    onChange={(event) => updateForm("port", event.target.value)}
                    required
                    data-testid="input-camera-port"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="camera-path">Chemin du flux</Label>
                  <Input
                    id="camera-path"
                    value={form.streamPath}
                    onChange={(event) =>
                      updateForm("streamPath", event.target.value)
                    }
                    placeholder="/stream1"
                    maxLength={2048}
                    autoComplete="off"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="camera-username">
                    Nom utilisateur caméra
                  </Label>
                  <Input
                    id="camera-username"
                    value={form.username}
                    onChange={(event) =>
                      updateForm("username", event.target.value)
                    }
                    placeholder={
                      editingCamera ? "Laisser vide pour conserver" : "Utilisateur"
                    }
                    maxLength={255}
                    autoComplete="off"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="camera-password">Mot de passe caméra</Label>
                  <Input
                    id="camera-password"
                    type="password"
                    value={form.password}
                    onChange={(event) =>
                      updateForm("password", event.target.value)
                    }
                    placeholder={
                      editingCamera
                        ? "Laisser vide pour conserver"
                        : "Mot de passe"
                    }
                    required={!editingCamera}
                    maxLength={512}
                    autoComplete="new-password"
                    data-testid="input-camera-password"
                  />
                  {editingCamera && (
                    <p className="text-xs text-muted-foreground">
                      Le mot de passe existant n'est jamais prérempli.
                    </p>
                  )}
                </div>
                <div className="flex flex-col-reverse gap-2 pt-2 sm:col-span-2 sm:flex-row sm:justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={closeForm}
                    disabled={saveMutation.isPending}
                  >
                    Annuler
                  </Button>
                  <Button
                    type="submit"
                    disabled={saveMutation.isPending}
                    data-testid="button-save-camera"
                  >
                    {saveMutation.isPending && (
                      <Loader2
                        className="mr-2 h-4 w-4 animate-spin"
                        aria-hidden="true"
                      />
                    )}
                    Enregistrer
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {camerasQuery.isLoading ? (
          <div className="flex min-h-40 items-center justify-center">
            <Loader2
              className="h-7 w-7 animate-spin text-primary"
              aria-label="Chargement des caméras"
            />
          </div>
        ) : camerasQuery.isError ? (
          <Card>
            <CardContent className="flex items-start gap-3 p-6">
              <CircleAlert
                className="h-5 w-5 text-destructive"
                aria-hidden="true"
              />
              <div>
                <p className="font-medium">Caméras indisponibles</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Impossible de charger vos caméras pour le moment.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : cameras.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center px-6 py-14 text-center">
              <div className="rounded-full bg-muted p-4">
                <Video className="h-7 w-7 text-muted-foreground" aria-hidden="true" />
              </div>
              <h2 className="mt-4 text-lg font-semibold">
                Aucune caméra configurée
              </h2>
              <p className="mt-2 max-w-md text-sm text-muted-foreground">
                 Ajoutez une caméra IP privée pour préparer votre espace
                  Surveillance. Les credentials sont conservés chiffrés côté
                  serveur et le live reste soumis à l'authentification.
              </p>
              <Button className="mt-5" onClick={openCreateForm}>
                <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
                Ajouter ma première caméra
              </Button>
            </CardContent>
          </Card>
        ) : (
          <section className="grid gap-4 md:grid-cols-2" aria-label="Mes caméras">
            {cameras.map((camera) => {
              const isDisabled = camera.status === "disabled";
              const isMutating =
                statusMutation.isPending &&
                statusMutation.variables?.cameraId === camera.id;
              return (
                <Card key={camera.id} data-testid={`camera-card-${camera.id}`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-start gap-3">
                        <div className="rounded-lg bg-muted p-2">
                          <Camera className="h-5 w-5 text-primary" aria-hidden="true" />
                        </div>
                        <div className="min-w-0">
                          <CardTitle className="truncate text-lg">
                            {camera.name}
                          </CardTitle>
                          <CardDescription className="mt-1">
                            {camera.connectionType.toUpperCase()} · {camera.host}:
                            {camera.port}
                          </CardDescription>
                        </div>
                      </div>
                      <Badge variant={statusVariant(camera.status)}>
                        {camera.status === "online" && (
                          <CheckCircle2 className="mr-1 h-3 w-3" aria-hidden="true" />
                        )}
                        {statusLabel(camera.status)}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="min-h-10 text-sm text-muted-foreground">
                      {camera.description || "Aucune description"}
                    </p>
                    <LiveCameraPlayer cameraId={camera.id} />
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditForm(camera)}
                        disabled={deleteMutation.isPending || isMutating}
                      >
                        <Pencil className="mr-2 h-3.5 w-3.5" aria-hidden="true" />
                        Modifier
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          statusMutation.mutate({
                            cameraId: camera.id,
                            status: isDisabled ? "unknown" : "disabled",
                          })
                        }
                        disabled={deleteMutation.isPending || isMutating}
                      >
                        {isMutating ? (
                          <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Power className="mr-2 h-3.5 w-3.5" aria-hidden="true" />
                        )}
                        {isDisabled ? "Activer" : "Désactiver"}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => connectionTestMutation.mutate(camera.id)}
                        disabled={
                          deleteMutation.isPending ||
                          isMutating ||
                          connectionTestMutation.isPending
                        }
                      >
                        {connectionTestMutation.isPending &&
                        connectionTestMutation.variables === camera.id ? (
                          <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Wifi className="mr-2 h-3.5 w-3.5" aria-hidden="true" />
                        )}
                        Tester la connexion
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDelete(camera)}
                        disabled={deleteMutation.isPending || isMutating}
                      >
                        <Trash2 className="mr-2 h-3.5 w-3.5" aria-hidden="true" />
                        Supprimer
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </section>
        )}
      </div>
    </main>
  );
}