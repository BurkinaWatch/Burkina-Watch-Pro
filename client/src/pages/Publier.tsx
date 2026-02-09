import { Helmet } from "react-helmet-async";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Upload, MapPin, Camera, Loader2, X, WifiOff, Cloud } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertSignalementSchema, type InsertSignalement } from "@shared/schema";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useEffect, useState, useRef } from "react";
import { z } from "zod";
import ModerationDialog from "@/components/ModerationDialog";
import { useTranslation } from "react-i18next";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { offlineStorage } from "@/lib/offlineStorage";
import { syncService } from "@/lib/syncService";
import { Alert, AlertDescription } from "@/components/ui/alert";

const frontendSignalementSchema = insertSignalementSchema.omit({ userId: true });
type FrontendSignalement = z.infer<typeof frontendSignalementSchema>;

export default function Publier() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { user, isLoading } = useAuth();
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [mediaPreviews, setMediaPreviews] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [moderationOpen, setModerationOpen] = useState(false);
  const [moderationData, setModerationData] = useState<any>(null);
  const { t, i18n } = useTranslation();
  const { isOnline } = useNetworkStatus();
  const [savedOffline, setSavedOffline] = useState(false);

  const form = useForm<FrontendSignalement>({
    resolver: zodResolver(frontendSignalementSchema),
    defaultValues: {
      titre: "",
      description: "",
      categorie: "",
      latitude: "12.3714",
      longitude: "-1.5197",
      localisation: "",
      medias: [],
      isAnonymous: false,
      isSOS: false,
      niveauUrgence: "moyen",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: FrontendSignalement) => {
      console.log("🚀 Mutation démarrée, envoi des données:", data);
      
      if (!navigator.onLine) {
        console.log("📴 Hors ligne - Sauvegarde locale");
        const offlineData = {
          titre: data.titre,
          description: data.description,
          categorie: data.categorie,
          latitude: parseFloat(data.latitude),
          longitude: parseFloat(data.longitude),
          adresse: data.localisation,
          urgence: data.niveauUrgence || "moyen",
          anonyme: data.isAnonymous || false,
          images: data.medias,
        };
        await offlineStorage.saveSignalement(offlineData);
        return { offline: true };
      }
      
      try {
        const res = await apiRequest("POST", "/api/signalements", data);
        console.log("✅ Réponse reçue:", res.status);
        return res.json();
      } catch (error) {
        console.error("❌ Erreur dans mutationFn:", error);
        if (!navigator.onLine) {
          const offlineData = {
            titre: data.titre,
            description: data.description,
            categorie: data.categorie,
            latitude: parseFloat(data.latitude),
            longitude: parseFloat(data.longitude),
            adresse: data.localisation,
            urgence: data.niveauUrgence || "moyen",
            anonyme: data.isAnonymous || false,
            images: data.medias,
          };
          await offlineStorage.saveSignalement(offlineData);
          return { offline: true };
        }
        throw error;
      }
    },
    onSuccess: (result) => {
      if (result?.offline) {
        console.log("📴 Signalement sauvegardé hors ligne");
        setSavedOffline(true);
        toast({
          title: "Sauvegarde hors ligne",
          description: "Votre signalement sera envoyé automatiquement dès que la connexion sera rétablie.",
        });
        form.reset();
        setTimeout(() => {
          setLocation("/feed");
        }, 2000);
        return;
      }
      
      console.log("✅ Mutation réussie");
      queryClient.invalidateQueries({ queryKey: ["/api/signalements"] });
      toast({
        title: "Signalement créé",
        description: "Votre signalement a été publié avec succès.",
      });
      form.reset();
      setLocation("/feed");
    },
    onError: (error: any) => {
      console.error("❌ Erreur complète dans onError:", error);
      if (isUnauthorizedError(error)) {
        toast({
          title: "Non autorisé",
          description: "Vous êtes déconnecté. Reconnexion...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/connexion";
        }, 500);
        return;
      }

      // Gestion spécifique de la modération
      if (error?.error === "content_moderated") {
        setModerationData(error);
        setModerationOpen(true);
        return;
      }

      const errorMessage = error?.message || error?.error || "Une erreur est survenue lors de la création du signalement.";
      toast({
        title: "Erreur",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const handleGetLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          form.setValue("latitude", position.coords.latitude.toString());
          form.setValue("longitude", position.coords.longitude.toString());
          form.setValue("localisation", `${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}`);
          toast({
            title: "Position obtenue",
            description: "Votre localisation a été détectée.",
          });
        },
        () => {
          toast({
            title: "Erreur",
            description: "Impossible d'obtenir votre position.",
            variant: "destructive",
          });
        }
      );
    }
  };

  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          // Dimensions optimisées pour le mobile
          const MAX_WIDTH = 800;
          const MAX_HEIGHT = 800;
          let width = img.width;
          let height = img.height;
          
          // Redimensionnement proportionnel
          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          ctx?.drawImage(img, 0, 0, width, height);
          
          // Compression progressive selon la taille
          let quality = 0.7;
          let compressedBase64 = canvas.toDataURL('image/jpeg', quality);
          
          // Réduire la qualité si l'image est encore trop grande (> 500KB)
          const MAX_SIZE = 500 * 1024; // 500KB en base64
          while (compressedBase64.length > MAX_SIZE && quality > 0.3) {
            quality -= 0.1;
            compressedBase64 = canvas.toDataURL('image/jpeg', quality);
          }
          
          resolve(compressedBase64);
        };
        img.onerror = reject;
        img.src = e.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const maxFiles = 5;
    if (mediaPreviews.length + files.length > maxFiles) {
      toast({
        title: "Limite atteinte",
        description: `Vous pouvez ajouter maximum ${maxFiles} médias`,
        variant: "destructive",
      });
      return;
    }

    const newPreviews: string[] = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      if (file.size > 20 * 1024 * 1024) {
        toast({
          title: "Fichier trop volumineux",
          description: `${file.name} dépasse 20 MB`,
          variant: "destructive",
        });
        continue;
      }

      try {
        if (file.type.startsWith('image/')) {
          const compressedBase64 = await compressImage(file);
          newPreviews.push(compressedBase64);
          console.log("Image compressée:", compressedBase64.substring(0, 50) + "...");
        } else if (file.type.startsWith('video/')) {
          // Pour les vidéos, on crée un data URL
          const reader = new FileReader();
          const videoBase64 = await new Promise<string>((resolve, reject) => {
            reader.onload = (e) => resolve(e.target?.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });
          newPreviews.push(videoBase64);
          console.log("Vidéo ajoutée:", videoBase64.substring(0, 50) + "...");
        }
      } catch (error) {
        console.error("Erreur traitement fichier:", error);
        toast({
          title: "Erreur",
          description: `Impossible de traiter ${file.name}`,
          variant: "destructive",
        });
      }
    }

    const updatedPreviews = [...mediaPreviews, ...newPreviews];
    console.log("Previews mises à jour:", updatedPreviews.length, "fichiers");
    setMediaPreviews(updatedPreviews);
    form.setValue("medias", updatedPreviews);
    
    toast({
      title: "Médias ajoutés",
      description: `${newPreviews.length} fichier(s) ajouté(s)`,
    });
  };

  const handleRemoveMedia = (index: number) => {
    const updatedPreviews = mediaPreviews.filter((_, i) => i !== index);
    setMediaPreviews(updatedPreviews);
    form.setValue("medias", updatedPreviews);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleCameraClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const onSubmit = (data: FrontendSignalement) => {
    console.log("📝 onSubmit appelé");
    console.log("Données du formulaire:", data);
    console.log("Erreurs du formulaire:", form.formState.errors);
    console.log("État de la mutation avant:", { isPending: createMutation.isPending, isError: createMutation.isError });
    createMutation.mutate(data);
    console.log("État de la mutation après mutate:", { isPending: createMutation.isPending });
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <Helmet>
        <title>Publier un Signalement - Burkina Watch</title>
      </Helmet>
      <Header />

      <ModerationDialog
        open={moderationOpen}
        severity={moderationData?.severity || "warning"}
        flaggedWords={moderationData?.flaggedWords || []}
        reason={moderationData?.reason}
        suggestion={moderationData?.suggestion}
        onTryAgain={() => {
          setModerationOpen(false);
          setModerationData(null);
        }}
        onCancel={() => {
          setModerationOpen(false);
          setModerationData(null);
        }}
      />

      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Nouveau signalement</h1>
          <p className="text-muted-foreground">
            Signalez un problème ou une situation nécessitant attention
          </p>
        </div>

        {!isOnline && (
          <Alert className="mb-4 border-yellow-500 bg-yellow-50 dark:bg-yellow-950/30">
            <WifiOff className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800 dark:text-yellow-200">
              Vous etes hors ligne. Votre signalement sera sauvegarde localement et envoye automatiquement des que la connexion sera retablie.
            </AlertDescription>
          </Alert>
        )}

        {savedOffline && (
          <Alert className="mb-4 border-green-500 bg-green-50 dark:bg-green-950/30">
            <Cloud className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800 dark:text-green-200">
              Signalement sauvegarde localement. Il sera envoye automatiquement des que vous serez connecte.
            </AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <Card>
              <CardHeader>
                <CardTitle>Informations du signalement</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField
                  control={form.control}
                  name="titre"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Titre *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Décrivez brièvement le problème"
                          {...field}
                          data-testid="input-title"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description *</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Donnez plus de détails sur la situation..."
                          className="min-h-32"
                          {...field}
                          data-testid="input-description"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="categorie"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Catégorie *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-category">
                            <SelectValue placeholder="Sélectionnez une catégorie" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="urgence">Urgence</SelectItem>
                          <SelectItem value="securite">Sécurité</SelectItem>
                          <SelectItem value="sante">Santé</SelectItem>
                          <SelectItem value="environnement">Environnement</SelectItem>
                          <SelectItem value="corruption">Corruption</SelectItem>
                          <SelectItem value="infrastructure">Infrastructure</SelectItem>
                          <SelectItem value="personne_recherchee">Personne recherchée</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="niveauUrgence"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Niveau d'urgence *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || "moyen"}>
                        <FormControl>
                          <SelectTrigger data-testid="select-urgency">
                            <SelectValue placeholder="Sélectionnez le niveau d'urgence" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="faible">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full bg-green-500" />
                              <span>Faible - Voyant Vert</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="moyen">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full bg-orange-500" />
                              <span>Moyen - Voyant Orange</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="critique">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full bg-red-500" />
                              <span>Critique - Voyant Rouge</span>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        Ce voyant sera affiché sur la carte pour indiquer le niveau de priorité
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="localisation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Localisation *</FormLabel>
                      <div className="flex flex-wrap gap-2">
                        <FormControl>
                          <Input
                            placeholder="Adresse ou coordonnées GPS"
                            {...field}
                            value={field.value || ""}
                            data-testid="input-location"
                            className="flex-1 min-w-[200px]"
                          />
                        </FormControl>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleGetLocation}
                          data-testid="button-get-location"
                        >
                          <MapPin className="w-4 h-4" />
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Cliquez sur l'icône pour utiliser votre position actuelle
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-2">
                  <Label>Photos et vidéos (max 5)</Label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,video/*"
                    multiple
                    onChange={handleFileChange}
                    className="hidden"
                    data-testid="input-file"
                  />
                  
                  {mediaPreviews.length > 0 ? (
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        {mediaPreviews.map((preview, index) => (
                          <div key={index} className="relative border rounded-lg overflow-hidden">
                            {preview.startsWith('data:video/') ? (
                              <video
                                src={preview}
                                className="w-full h-32 object-cover"
                                controls
                              />
                            ) : (
                              <img
                                src={preview}
                                alt={`Média ${index + 1}`}
                                className="w-full h-32 object-cover"
                              />
                            )}
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              className="absolute top-1 right-1"
                              onClick={() => handleRemoveMedia(index)}
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                      {mediaPreviews.length < 5 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="w-full"
                          onClick={handleCameraClick}
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          Ajouter plus de médias ({mediaPreviews.length}/5)
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div 
                      className="border-2 border-dashed rounded-lg p-8 text-center hover-elevate cursor-pointer"
                      onClick={handleCameraClick}
                    >
                      <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground mb-1">
                        Cliquez pour ajouter des photos ou vidéos
                      </p>
                      <p className="text-xs text-muted-foreground">
                        PNG, JPG, MP4 jusqu'à 20 MB par fichier (max 5 fichiers)
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="mt-4"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCameraClick();
                        }}
                        data-testid="button-upload-media"
                      >
                        <Camera className="w-4 h-4 mr-2" />
                        Choisir des médias
                      </Button>
                    </div>
                  )}
                </div>

                <FormField
                  control={form.control}
                  name="isAnonymous"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-muted/50 rounded-lg">
                        <div className="space-y-0.5">
                          <FormLabel>Publier anonymement</FormLabel>
                          <p className="text-xs text-muted-foreground">
                            Votre identité ne sera pas révélée
                          </p>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value || false}
                            onCheckedChange={field.onChange}
                            data-testid="switch-anonymous"
                          />
                        </FormControl>
                      </div>
                    </FormItem>
                  )}
                />

                <div className="flex flex-col sm:flex-row gap-3">
                  <Button 
                    type="submit" 
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white" 
                    disabled={createMutation.isPending}
                    data-testid="button-submit"
                  >
                    {createMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Publier le signalement
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setLocation("/feed")}
                    data-testid="button-cancel"
                  >
                    Annuler
                  </Button>
                </div>
              </CardContent>
            </Card>
          </form>
        </Form>
      </div>

      <BottomNav />
    </div>
  );
}
