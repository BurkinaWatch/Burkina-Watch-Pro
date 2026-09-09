import { Helmet } from "react-helmet-async";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
import { Upload, MapPin, Camera, Loader2, X, AlertTriangle, Phone } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertSignalementSchema } from "@shared/schema";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { useState, useRef } from "react";
import { z } from "zod";
import ModerationDialog from "@/components/ModerationDialog";
import { useTranslation } from "react-i18next";

const frontendSignalementSchema = insertSignalementSchema.omit({ userId: true });
type FrontendSignalement = z.infer<typeof frontendSignalementSchema>;

export default function SOSPublier() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [mediaPreviews, setMediaPreviews] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [moderationOpen, setModerationOpen] = useState(false);
  const [moderationData, setModerationData] = useState<any>(null);
  const { t, i18n } = useTranslation();

  const form = useForm<FrontendSignalement>({
    resolver: zodResolver(frontendSignalementSchema),
    defaultValues: {
      titre: "",
      description: "",
      categorie: "urgence",
      latitude: "12.3714",
      longitude: "-1.5197",
      localisation: "",
      medias: [],
      isAnonymous: false,
      isSOS: true,
      niveauUrgence: "critique",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: FrontendSignalement) => {
      const res = await apiRequest("POST", "/api/signalements", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/signalements"] });
      toast({
        title: "🚨 SOS Envoyé",
        description: "Votre alerte d'urgence a été diffusée. Les autorités ont été notifiées.",
      });
      form.reset();
      setLocation("/sos");
    },
    onError: (error: any) => {
      console.error("Erreur complète:", error);
      if (error?.error === "content_moderated") {
        setModerationData(error);
        setModerationOpen(true);
        return;
      }
      const errorMessage = error?.message || error?.error || "Une erreur est survenue lors de l'envoi du SOS.";
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
            description: "Votre localisation a été détectée automatiquement.",
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

          const MAX_WIDTH = 800;
          const MAX_HEIGHT = 800;
          let width = img.width;
          let height = img.height;

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

          let quality = 0.7;
          let compressedBase64 = canvas.toDataURL('image/jpeg', quality);

          const MAX_SIZE = 500 * 1024;
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
    createMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-destructive/5 pb-24">
      <Helmet>
        <title>Alerte SOS - Burkina Watch</title>
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
        <Card className="mb-6 bg-destructive border-destructive">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1 text-white">
                <h2 className="text-xl font-bold mb-2">🚨 Alerte SOS d'Urgence</h2>
                <p className="text-white/90 text-sm">
                  Ce formulaire est destiné aux <strong>situations d'urgence réelle</strong> nécessitant une intervention immédiate des autorités.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <a href="tel:17" className="block">
            <Card className="bg-card hover-elevate cursor-pointer transition-all hover:shadow-lg">
              <CardContent className="p-4 text-center">
                <Phone className="w-8 h-8 mx-auto mb-2 text-primary" />
                <p className="font-semibold">Police</p>
                <p className="text-2xl font-bold text-primary">17</p>
              </CardContent>
            </Card>
          </a>
          <a href="tel:18" className="block">
            <Card className="bg-card hover-elevate cursor-pointer transition-all hover:shadow-lg">
              <CardContent className="p-4 text-center">
                <Phone className="w-8 h-8 mx-auto mb-2 text-destructive" />
                <p className="font-semibold">Pompiers</p>
                <p className="text-2xl font-bold text-destructive">18</p>
              </CardContent>
            </Card>
          </a>
          <a href="tel:50400504" className="block">
            <Card className="bg-card hover-elevate cursor-pointer transition-all hover:shadow-lg">
              <CardContent className="p-4 text-center">
                <Phone className="w-8 h-8 mx-auto mb-2 text-green-600" />
                <p className="font-semibold">Brigade Laabal</p>
                <p className="text-2xl font-bold text-green-600">50.40.05.04</p>
              </CardContent>
            </Card>
          </a>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <Card>
              <CardHeader className="bg-destructive/10">
                <CardTitle className="text-destructive">Détails de l'urgence</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                <FormField
                  control={form.control}
                  name="titre"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Titre de l'urgence *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Ex: Accident grave, Incendie, Personne en danger..."
                          {...field}
                          data-testid="input-sos-title"
                          className="border-destructive/50"
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
                      <FormLabel>Description détaillée *</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Décrivez la situation d'urgence en détail : que s'est-il passé ? Combien de personnes ? Blessés ?"
                          className="min-h-32 border-destructive/50"
                          {...field}
                          data-testid="input-sos-description"
                        />
                      </FormControl>
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
                      <Select onValueChange={field.onChange} value={field.value || "critique"}>
                        <FormControl>
                          <SelectTrigger data-testid="select-urgence-level" className="border-destructive/50">
                            <SelectValue placeholder="Sélectionnez le niveau" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="critique">🔴 Critique - Danger immédiat</SelectItem>
                          <SelectItem value="moyen">🟡 Moyen - Intervention rapide</SelectItem>
                          <SelectItem value="faible">🟢 Faible - Non urgent</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="localisation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Localisation exacte *</FormLabel>
                      <div className="flex flex-wrap gap-2">
                        <FormControl>
                          <Input
                            placeholder="Adresse précise ou points de repère"
                            {...field}
                            value={field.value || ""}
                            data-testid="input-sos-location"
                            className="border-destructive/50 flex-1 min-w-[200px]"
                          />
                        </FormControl>
                        <Button
                          type="button"
                          variant="destructive"
                          onClick={handleGetLocation}
                          data-testid="button-get-location-sos"
                        >
                          <MapPin className="w-4 h-4" />
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Cliquez sur l'icône pour utiliser votre position GPS actuelle
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-2">
                  <Label>Photos et vidéos de la situation (max 5)</Label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,video/*"
                    multiple
                    onChange={handleFileChange}
                    className="hidden"
                    data-testid="input-sos-file"
                  />

                  {mediaPreviews.length > 0 ? (
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        {mediaPreviews.map((preview, index) => (
                          <div key={index} className="relative border-2 border-destructive rounded-lg overflow-hidden">
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
                          variant="destructive"
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
                      className="border-2 border-dashed border-destructive rounded-lg p-8 text-center hover-elevate cursor-pointer bg-destructive/5"
                      onClick={handleCameraClick}
                    >
                      <Upload className="w-12 h-12 mx-auto mb-4 text-destructive" />
                      <p className="text-sm text-muted-foreground mb-1">
                        Cliquez pour ajouter des photos ou vidéos
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Les médias aident les secours à évaluer la situation (max 20 MB/fichier)
                      </p>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="mt-4"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCameraClick();
                        }}
                        data-testid="button-upload-photo-sos"
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
                          <FormLabel>Rester anonyme</FormLabel>
                          <p className="text-xs text-muted-foreground">
                            Votre identité ne sera pas révélée publiquement
                          </p>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value || false}
                            onCheckedChange={field.onChange}
                            data-testid="switch-anonymous-sos"
                          />
                        </FormControl>
                      </div>
                    </FormItem>
                  )}
                />

                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    type="submit"
                    className="flex-1 bg-destructive hover:bg-destructive/90"
                    disabled={createMutation.isPending}
                    data-testid="button-submit-sos"
                  >
                    {createMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    Envoyer l'alerte SOS
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setLocation("/sos")}
                    data-testid="button-cancel-sos"
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