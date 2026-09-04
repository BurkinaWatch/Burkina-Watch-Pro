import { useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  Film,
  Globe2,
  Loader2,
  MapPin,
  Plus,
  ShieldCheck,
  Upload,
  Video,
  X,
} from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { getQueryFn } from "@/lib/queryClient";
import "leaflet/dist/leaflet.css";

type FlowMode = "home" | "explore" | "add";

type StreetviewConfig = {
  maxVideoBytes: number;
  minDurationSeconds: number;
  maxDurationSeconds: number;
  allowedMimeTypes: string[];
};

type VideoInspection = {
  durationMs: number;
  width: number;
  height: number;
  orientation: string;
  thumbnailData: string | null;
};

type Contribution = {
  id: string;
  title: string;
  city: string;
  quartier: string | null;
  status: string;
  progress: number;
  statusMessage: string | null;
  thumbnailKey: string | null;
  fileSizeBytes: number | null;
  durationMs: number | null;
  createdAt: string;
};

type Scene = {
  id: string;
  quadkey: string;
  lodLevel: number;
  tileUrl: string | null;
  boundingBox: { minLat?: number; maxLat?: number; minLng?: number; maxLng?: number } | null;
};

const defaultCenter: [number, number] = [12.3657, -1.5228];
const markerIcon = new L.Icon({
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const statusLabels: Record<string, string> = {
  DRAFT: "Brouillon",
  UPLOADING: "Upload en cours",
  UPLOADED: "Vidéo reçue",
  VALIDATING: "Validation en cours",
  QUEUED: "En file de traitement",
  WAITING_FOR_3D: "En attente de reconstruction 3D",
  UPLOAD_FAILED: "Upload échoué",
  VALIDATION_FAILED: "Validation échouée",
  PROCESSING_FAILED: "Préparation échouée",
};

function formatBytes(bytes: number | null | undefined): string {
  if (!bytes) return "—";
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

function formatDuration(durationMs: number | null | undefined): string {
  if (!durationMs) return "—";
  const seconds = Math.round(durationMs / 1000);
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

function errorMessage(error: unknown): string {
  if (error instanceof Error) {
    try {
      const parsed = JSON.parse(error.message.replace(/^\d+:\s*/, ""));
      return parsed.message || error.message;
    } catch {
      return error.message;
    }
  }
  return "Une erreur inattendue est survenue.";
}

function LocationPicker({
  position,
  onChange,
}: {
  position: [number, number];
  onChange: (position: [number, number]) => void;
}) {
  useMapEvents({
    click(event) {
      onChange([event.latlng.lat, event.latlng.lng]);
    },
  });
  return <Marker position={position} icon={markerIcon} />;
}

function statusTone(status: string): "default" | "secondary" | "destructive" {
  if (status.includes("FAILED")) return "destructive";
  if (status === "WAITING_FOR_3D") return "secondary";
  return "default";
}

function inspectVideo(file: File): Promise<VideoInspection> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.preload = "metadata";
    video.muted = true;
    video.playsInline = true;

    const cleanup = () => {
      URL.revokeObjectURL(url);
      video.remove();
    };

    video.onloadedmetadata = () => {
      if (!Number.isFinite(video.duration) || video.videoWidth <= 0 || video.videoHeight <= 0) {
        cleanup();
        reject(new Error("Cette vidéo ne contient pas de métadonnées exploitables."));
        return;
      }

      const canvas = document.createElement("canvas");
      const maxWidth = 640;
      const ratio = Math.min(maxWidth / video.videoWidth, 1);
      canvas.width = Math.max(1, Math.round(video.videoWidth * ratio));
      canvas.height = Math.max(1, Math.round(video.videoHeight * ratio));
      const drawThumbnail = () => {
        const context = canvas.getContext("2d");
        const thumbnailData = context
          ? (() => {
              context.drawImage(video, 0, 0, canvas.width, canvas.height);
              return canvas.toDataURL("image/jpeg", 0.72);
            })()
          : null;
        const result = {
          durationMs: Math.round(video.duration * 1000),
          width: video.videoWidth,
          height: video.videoHeight,
          orientation: video.videoWidth >= video.videoHeight ? "landscape" : "portrait",
          thumbnailData,
        };
        cleanup();
        resolve(result);
      };

      video.onseeked = drawThumbnail;
      try {
        video.currentTime = Math.min(Math.max(video.duration / 2, 0.1), 1);
      } catch {
        drawThumbnail();
      }
    };
    video.onerror = () => {
      cleanup();
      reject(new Error("Cette vidéo est illisible ou son format n'est pas pris en charge."));
    };
    video.src = url;
  });
}

function ContributionCard({ contribution }: { contribution: Contribution }) {
  return (
    <div className="flex gap-3 rounded-xl border bg-card p-3">
      {contribution.thumbnailKey ? (
        <img
          src={contribution.thumbnailKey}
          alt=""
          className="h-16 w-24 rounded-lg object-cover"
        />
      ) : (
        <div className="flex h-16 w-24 items-center justify-center rounded-lg bg-primary/10">
          <Film className="h-6 w-6 text-primary" />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className="truncate font-medium">{contribution.title}</p>
          <Badge variant={statusTone(contribution.status)} className="shrink-0 text-[10px]">
            {statusLabels[contribution.status] || contribution.status}
          </Badge>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          {contribution.city}{contribution.quartier ? ` · ${contribution.quartier}` : ""}
        </p>
        <div className="mt-2 flex items-center gap-3 text-[11px] text-muted-foreground">
          <span>{formatBytes(contribution.fileSizeBytes)}</span>
          <span>{formatDuration(contribution.durationMs)}</span>
          {contribution.status !== "WAITING_FOR_3D" && (
            <span className="flex items-center gap-1">
              <Clock3 className="h-3 w-3" />
              {contribution.progress}%
            </span>
          )}
        </div>
        {contribution.statusMessage && (
          <p className="mt-1 text-xs text-muted-foreground">{contribution.statusMessage}</p>
        )}
        {contribution.status !== "WAITING_FOR_3D" && contribution.progress > 0 && (
          <Progress value={contribution.progress} className="mt-2 h-1" />
        )}
      </div>
    </div>
  );
}

export default function StreetViewContributionFlow() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<FlowMode>("home");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [inspection, setInspection] = useState<VideoInspection | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isInspecting, setIsInspecting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [city, setCity] = useState("Ouagadougou");
  const [quartier, setQuartier] = useState("");
  const [position, setPosition] = useState<[number, number]>(defaultCenter);
  const [hasAutomaticLocation, setHasAutomaticLocation] = useState(false);

  const { data: config } = useQuery<StreetviewConfig>({
    queryKey: ["/api/streetview/config"],
    queryFn: getQueryFn({ on401: "throw" }),
  });
  const { data: contributions = [], isLoading: contributionsLoading } = useQuery<Contribution[]>({
    queryKey: ["/api/streetview/contributions"],
    queryFn: getQueryFn({ on401: "throw" }),
    refetchInterval: mode === "home" ? 10000 : false,
  });
  const { data: scenes = [], isLoading: scenesLoading } = useQuery<Scene[]>({
    queryKey: ["/api/streetview/scenes"],
    queryFn: getQueryFn({ on401: "throw" }),
    enabled: mode === "explore",
  });

  const maxVideoBytes = config?.maxVideoBytes || 100 * 1024 * 1024;
  const allowedMimeTypes = config?.allowedMimeTypes || ["video/mp4", "video/webm", "video/quicktime"];
  const locationLabel = useMemo(
    () => `${position[0].toFixed(6)}, ${position[1].toFixed(6)}`,
    [position],
  );

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (current) => {
        setPosition([current.coords.latitude, current.coords.longitude]);
        setHasAutomaticLocation(true);
      },
      () => undefined,
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 },
    );
  }, []);

  const resetForm = () => {
    setSelectedFile(null);
    setInspection(null);
    setFileError(null);
    setTitle("");
    setDescription("");
    setCity("Ouagadougou");
    setQuartier("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setFileError(null);
    setInspection(null);
    setSelectedFile(file);

    if (!allowedMimeTypes.includes(file.type) || !file.type.startsWith("video/")) {
      setFileError("Le format de cette vidéo n'est pas pris en charge.");
      return;
    }
    if (file.size > maxVideoBytes) {
      setFileError(`Cette vidéo dépasse la taille maximale autorisée (${formatBytes(maxVideoBytes)}).`);
      return;
    }

    setIsInspecting(true);
    try {
      const result = await inspectVideo(file);
      if (result.durationMs < (config?.minDurationSeconds || 2) * 1000) {
        throw new Error("Cette vidéo est trop courte.");
      }
      if (result.durationMs > (config?.maxDurationSeconds || 180) * 1000) {
        throw new Error("Cette vidéo dépasse la durée maximale autorisée.");
      }
      setInspection(result);
    } catch (error) {
      setFileError(errorMessage(error));
    } finally {
      setIsInspecting(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedFile || !inspection || !title.trim() || !city.trim()) {
      toast({
        title: "Informations manquantes",
        description: "Ajoutez une vidéo valide, un titre et une ville.",
        variant: "destructive",
      });
      return;
    }
    if (fileError) {
      toast({ title: "Vidéo invalide", description: fileError, variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      const createResponse = await fetch("/api/streetview/contributions", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
          city: city.trim(),
          quartier: quartier.trim() || null,
          latitude: position[0],
          longitude: position[1],
          originalFileName: selectedFile.name,
          mediaType: selectedFile.type,
          durationMs: inspection.durationMs,
          width: inspection.width,
          height: inspection.height,
          orientation: inspection.orientation,
          thumbnailData: inspection.thumbnailData,
        }),
      });
      if (!createResponse.ok) {
        throw new Error(`${createResponse.status}: ${await createResponse.text()}`);
      }
      const created = await createResponse.json() as { id: string };

      const uploadResponse = await fetch(`/api/streetview/contributions/${created.id}/upload`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": selectedFile.type },
        body: selectedFile,
      });
      if (!uploadResponse.ok) {
        throw new Error(`${uploadResponse.status}: ${await uploadResponse.text()}`);
      }

      await queryClient.invalidateQueries({ queryKey: ["/api/streetview/contributions"] });
      toast({
        title: "Contribution envoyée",
        description: "Votre vidéo est validée et attend la future reconstruction 3D.",
      });
      resetForm();
      setMode("home");
    } catch (error) {
      toast({
        title: "Échec de la contribution",
        description: errorMessage(error),
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const openAdd = () => {
    resetForm();
    setMode("add");
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
        <div className="container flex h-14 items-center justify-between gap-4 px-4">
          <Button variant="ghost" size="sm" onClick={() => navigate("/")} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Retour
          </Button>
          <h1 className="flex items-center gap-2 text-lg font-semibold">
            <Globe2 className="h-5 w-5 text-primary" />
            Street View
          </h1>
          <div className="w-16" />
        </div>
      </header>

      <main className="container mx-auto max-w-5xl space-y-6 px-4 py-6">
        {mode === "home" && (
          <>
            <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-primary/10 via-background to-yellow-500/10">
              <CardContent className="grid gap-6 p-6 md:grid-cols-[1fr_auto] md:items-center">
                <div>
                  <Badge variant="secondary" className="mb-3">Projet citoyen</Badge>
                  <h2 className="text-2xl font-bold tracking-tight md:text-3xl">
                    Explorez et construisez progressivement le Burkina Faso en 3D.
                  </h2>
                  <p className="mt-3 max-w-2xl text-muted-foreground">
                    Documentez un lieu avec une vidéo. Elle sera préparée maintenant et pourra
                    alimenter une future reconstruction 3D, sans transformation automatique à cette étape.
                  </p>
                  <div className="mt-5 flex flex-col gap-2 sm:flex-row">
                    <Button onClick={() => setMode("explore")} className="gap-2">
                      <Globe2 className="h-4 w-4" />
                      Explorer
                    </Button>
                    <Button onClick={openAdd} variant="outline" className="gap-2">
                      <Plus className="h-4 w-4" />
                      Ajouter une contribution
                    </Button>
                  </div>
                </div>
                <div className="hidden rounded-2xl border bg-background/70 p-5 md:block">
                  <ShieldCheck className="h-10 w-10 text-primary" />
                  <p className="mt-3 max-w-[180px] text-sm font-medium">
                    Vos vidéos restent associées à votre contribution et ne sont pas publiées automatiquement.
                  </p>
                </div>
              </CardContent>
            </Card>

            <section>
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold">Mes contributions</h2>
                  <p className="text-sm text-muted-foreground">Suivez la préparation de vos vidéos.</p>
                </div>
                <Button variant="outline" size="sm" onClick={openAdd} className="gap-2">
                  <Upload className="h-4 w-4" />
                  Ajouter
                </Button>
              </div>
              {contributionsLoading ? (
                <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin" /></div>
              ) : contributions.length > 0 ? (
                <div className="grid gap-3 md:grid-cols-2">
                  {contributions.map((contribution) => (
                    <ContributionCard key={contribution.id} contribution={contribution} />
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="py-10 text-center">
                    <Video className="mx-auto h-10 w-10 text-muted-foreground" />
                    <p className="mt-3 font-medium">Aucune contribution pour le moment</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Soyez parmi les premiers à documenter un lieu.
                    </p>
                  </CardContent>
                </Card>
              )}
            </section>
          </>
        )}

        {mode === "explore" && (
          <section className="space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <Button variant="ghost" size="sm" onClick={() => setMode("home")} className="-ml-3 mb-2 gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Street View
                </Button>
                <h2 className="text-2xl font-bold">Explorer les scènes</h2>
                <p className="mt-1 text-muted-foreground">Seules les scènes réellement publiées apparaissent ici.</p>
              </div>
              <Button onClick={openAdd} className="shrink-0 gap-2">
                <Plus className="h-4 w-4" />
                Ajouter
              </Button>
            </div>
            {scenesLoading ? (
              <Card><CardContent className="flex justify-center py-14"><Loader2 className="h-7 w-7 animate-spin" /></CardContent></Card>
            ) : scenes.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="py-16 text-center">
                  <Globe2 className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-semibold">Le Burkina Faso 3D se construit progressivement.</h3>
                  <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
                    Aucune scène 3D publiée n’est encore disponible. Soyez parmi les premiers à documenter un lieu.
                  </p>
                  <Button onClick={openAdd} className="mt-5 gap-2">
                    <Plus className="h-4 w-4" />
                    Documenter un lieu
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {scenes.map((scene) => (
                  <Card key={scene.id}>
                    <CardHeader>
                      <CardTitle className="text-base">Scène publiée</CardTitle>
                      <CardDescription>Tuile {scene.quadkey} · niveau {scene.lodLevel}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        Le viewer 3D sera chargé lorsque le format de scène sera disponible.
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </section>
        )}

        {mode === "add" && (
          <section className="mx-auto max-w-3xl space-y-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <Button variant="ghost" size="sm" onClick={() => setMode("home")} className="-ml-3 mb-2 gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Annuler
                </Button>
                <h2 className="text-2xl font-bold">Ajouter une contribution</h2>
                <p className="mt-1 text-muted-foreground">
                  Choisissez une vidéo existante, vérifiez ses informations puis localisez le lieu.
                </p>
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Video className="h-5 w-5 text-primary" />1. Choisir une vidéo</CardTitle>
                <CardDescription>Formats acceptés : MP4, WebM ou QuickTime. La vidéo sera stockée séparément de la base de données.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/mp4,video/webm,video/quicktime"
                  onChange={handleFileChange}
                  className="hidden"
                  data-testid="input-streetview-video"
                />
                <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="w-full gap-2">
                  <Upload className="h-4 w-4" />
                  {selectedFile ? "Changer la vidéo" : "Sélectionner une vidéo"}
                </Button>
                {selectedFile && (
                  <div className="rounded-xl border bg-muted/30 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        {inspection?.thumbnailData ? (
                          <img src={inspection.thumbnailData} alt="" className="h-14 w-20 rounded-lg object-cover" />
                        ) : (
                          <div className="flex h-14 w-20 items-center justify-center rounded-lg bg-primary/10"><Film className="h-5 w-5 text-primary" /></div>
                        )}
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{selectedFile.name}</p>
                          <p className="text-xs text-muted-foreground">{formatBytes(selectedFile.size)} · {inspection ? formatDuration(inspection.durationMs) : "analyse en cours"}</p>
                        </div>
                      </div>
                      {isInspecting && <Loader2 className="h-5 w-5 animate-spin text-primary" />}
                    </div>
                    {inspection && (
                      <p className="mt-2 text-xs text-muted-foreground">
                        {inspection.width} × {inspection.height} · {inspection.orientation}
                      </p>
                    )}
                  </div>
                )}
                {fileError && <p className="text-sm text-destructive">{fileError}</p>}
                <p className="text-xs text-muted-foreground">
                  Limite actuelle : {formatBytes(maxVideoBytes)} · durée : {config?.minDurationSeconds || 2}s à {config?.maxDurationSeconds || 180}s.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>2. Informations du lieu</CardTitle>
                <CardDescription>Ces informations servent à retrouver et préparer la contribution.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="streetview-title">Titre</Label>
                  <Input id="streetview-title" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Ex. Marché de Ouagadougou" maxLength={160} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="streetview-city">Ville</Label>
                  <Input id="streetview-city" value={city} onChange={(event) => setCity(event.target.value)} placeholder="Ouagadougou" maxLength={120} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="streetview-quartier">Quartier</Label>
                  <Input id="streetview-quartier" value={quartier} onChange={(event) => setQuartier(event.target.value)} placeholder="Quartier (optionnel)" maxLength={160} />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="streetview-description">Description facultative</Label>
                  <Textarea id="streetview-description" value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Décrivez brièvement le lieu..." maxLength={2000} rows={3} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><MapPin className="h-5 w-5 text-primary" />3. Localiser le lieu</CardTitle>
                <CardDescription>
                  {hasAutomaticLocation ? "Position GPS détectée automatiquement. Cliquez sur la carte pour la corriger." : "La position GPS est indisponible : choisissez le lieu sur la carte."}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="h-64 overflow-hidden rounded-xl border">
                  <MapContainer center={position} zoom={13} className="h-full w-full">
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap contributors' />
                    <LocationPicker position={position} onChange={(next) => { setPosition(next); setHasAutomaticLocation(false); }} />
                  </MapContainer>
                </div>
                <p className="flex items-center gap-2 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3 text-primary" />
                  Coordonnées sélectionnées : {locationLabel}
                </p>
              </CardContent>
            </Card>

            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="flex items-start gap-3 p-4">
                <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <p className="text-sm text-muted-foreground">
                  La contribution sera contrôlée puis placée en attente de reconstruction 3D.
                  Aucun moteur de reconstruction ne sera exécuté pendant cette phase.
                </p>
              </CardContent>
            </Card>

            <div className="flex flex-col-reverse gap-2 pb-6 sm:flex-row sm:justify-end">
              <Button variant="outline" onClick={() => setMode("home")} disabled={isSubmitting}>Annuler</Button>
              <Button onClick={handleSubmit} disabled={isSubmitting || isInspecting || !inspection || !!fileError} className="gap-2">
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                {isSubmitting ? "Envoi en cours..." : "Envoyer la contribution"}
              </Button>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}