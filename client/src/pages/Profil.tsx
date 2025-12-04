import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { User, LogOut, Loader2, Save, Camera, Trash2, MapPin, Calendar, Navigation, PlayCircle, StopCircle, Clock, Activity, Copy, ExternalLink, Briefcase, Mail, Shield, Plus, Trophy, Smartphone, Download } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import type { UpdateUserProfile, Signalement, TrackingSession, LocationPoint, TrackingSessionWithTrajectory, EmergencyContact } from "@shared/schema";
import { isUnauthorizedError } from "@/lib/authUtils";
import EditSignalementDialog from "@/components/EditSignalementDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { LevelBadge } from "@/components/LevelBadge";
import { LevelProgress } from "@/components/LevelProgress";
import { useTranslation } from "react-i18next";
import { getLevelInfo } from "@shared/pointsSystem";
import { useRef } from "react";


export default function Profil() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [trackingActive, setTrackingActive] = useState(false);
  const [trackingInterval, setTrackingInterval] = useState<NodeJS.Timeout | null>(null);
  const [locationPointsCount, setLocationPointsCount] = useState(0);
  const [newContact, setNewContact] = useState({ name: "", phone: "", email: "" });
  const [fileInputRef, setFileInputRef] = useState<HTMLInputElement | null>(null);
  const [selectedContact, setSelectedContact] = useState<EmergencyContact | null>(null);
  const [lockscreenStyle, setLockscreenStyle] = useState<"light" | "dark">("light");
  const [isGeneratingLockscreen, setIsGeneratingLockscreen] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const generateLockscreenImage = async () => {
    if (!selectedContact || !canvasRef.current) return;

    setIsGeneratingLockscreen(true);

    try {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Dimensions pour mobile (9:16 ratio)
      canvas.width = 1080;
      canvas.height = 1920;

      // Couleurs selon le style
      const colors = lockscreenStyle === "light"
        ? {
            bg: '#FFFFFF',
            primary: '#DC2626',
            secondary: '#FBBF24',
            accent: '#10B981',
            text: '#1F2937',
            textSecondary: '#6B7280'
          }
        : {
            bg: '#1F2937',
            primary: '#DC2626',
            secondary: '#FBBF24',
            accent: '#10B981',
            text: '#FFFFFF',
            textSecondary: '#D1D5DB'
          };

      // Fond
      ctx.fillStyle = colors.bg;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Bande tricolore en haut
      const bandHeight = 40;
      ctx.fillStyle = colors.primary;
      ctx.fillRect(0, 0, canvas.width / 3, bandHeight);
      ctx.fillStyle = colors.secondary;
      ctx.fillRect(canvas.width / 3, 0, canvas.width / 3, bandHeight);
      ctx.fillStyle = colors.accent;
      ctx.fillRect((canvas.width / 3) * 2, 0, canvas.width / 3, bandHeight);

      // Logo BurkinaWatch
      ctx.fillStyle = colors.text;
      ctx.font = 'bold 48px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('🇧🇫 BURKINA WATCH', canvas.width / 2, 140);

      // Titre "URGENCE"
      ctx.fillStyle = colors.primary;
      ctx.font = 'bold 80px Arial';
      ctx.fillText('URGENCE', canvas.width / 2, 280);

      // Icône d'urgence
      ctx.font = '200px Arial';
      ctx.fillText('🚨', canvas.width / 2, 520);

      // Nom du contact
      ctx.fillStyle = colors.text;
      ctx.font = 'bold 64px Arial';
      const contactName = selectedContact.name.toUpperCase();
      const maxWidth = canvas.width - 100;

      const words = contactName.split(' ');
      let line = '';
      let y = 680;
      const lineHeight = 75;

      for (let i = 0; i < words.length; i++) {
        const testLine = line + words[i] + ' ';
        const metrics = ctx.measureText(testLine);

        if (metrics.width > maxWidth && i > 0) {
          ctx.fillText(line, canvas.width / 2, y);
          line = words[i] + ' ';
          y += lineHeight;
        } else {
          line = testLine;
        }
      }
      ctx.fillText(line, canvas.width / 2, y);

      // Numéro (ajusté pour rentrer dans le cadre)
      y += 150;
      ctx.fillStyle = colors.primary;

      // Calculer la taille de police optimal pour que le numéro rentre
      let fontSize = 140;
      const padding = 80; // Padding gauche-droite
      const maxPhoneWidth = canvas.width - padding;

      // Vérifier et réduire la police si nécessaire
      while (fontSize > 60) {
        ctx.font = `bold ${fontSize}px Arial`;
        const phoneMetrics = ctx.measureText(selectedContact.phone);
        if (phoneMetrics.width <= maxPhoneWidth) {
          break;
        }
        fontSize -= 10;
      }

      ctx.fillText(selectedContact.phone, canvas.width / 2, y);

      // Instructions en bas
      y = canvas.height - 200;
      ctx.fillStyle = colors.accent;
      ctx.font = 'bold 42px Arial';
      ctx.fillText('APPELER IMMÉDIATEMENT', canvas.width / 2, y);

      // Footer
      y = canvas.height - 100;
      ctx.fillStyle = colors.textSecondary;
      ctx.font = '32px Arial';
      ctx.fillText('Généré par BurkinaWatch • Burkina Faso', canvas.width / 2, y);

      // Bande tricolore en bas
      ctx.fillStyle = colors.primary;
      ctx.fillRect(0, canvas.height - bandHeight, canvas.width / 3, bandHeight);
      ctx.fillStyle = colors.secondary;
      ctx.fillRect(canvas.width / 3, canvas.height - bandHeight, canvas.width / 3, bandHeight);
      ctx.fillStyle = colors.accent;
      ctx.fillRect((canvas.width / 3) * 2, canvas.height - bandHeight, canvas.width / 3, bandHeight);

      // Télécharger l'image
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `contact-urgence-${selectedContact.phone}-lockscreen.png`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);

          toast({
            title: "Image générée !",
            description: "L'image a été téléchargée. Définissez-la comme fond d'écran de verrouillage dans les paramètres de votre téléphone.",
          });

          setSelectedContact(null);
        }
      }, 'image/png');

    } catch (error) {
      console.error('Erreur génération image:', error);
      toast({
        title: "Erreur",
        description: "Impossible de générer l'image",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingLockscreen(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Vérifier le type de fichier
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner une image valide.",
        variant: "destructive",
      });
      return;
    }

    // Vérifier la taille (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Erreur",
        description: "L'image ne doit pas dépasser 5MB.",
        variant: "destructive",
      });
      return;
    }

    // Convertir en base64
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setFormData({ ...formData, profileImageUrl: base64String });

      // Sauvegarder automatiquement la nouvelle photo
      updateMutation.mutate({ profileImageUrl: base64String });
    };
    reader.readAsDataURL(file);
  };

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Connexion requise",
        description: "Vous devez vous connecter pour accéder à votre profil.",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
    }
  }, [isAuthenticated, isLoading, toast]);

  // Fetch user's signalements
  const { data: userSignalements = [], isLoading: signalementsLoading } = useQuery<Signalement[]>({
    queryKey: ["/api/auth/user/signalements"],
    enabled: isAuthenticated,
  });

  // Synchroniser les points lors du chargement
  const syncPointsMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/auth/user/sync-points"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    },
  });

  // Synchroniser automatiquement les points quand les signalements sont chargés
  useEffect(() => {
    if (isAuthenticated && userSignalements.length >= 0 && !signalementsLoading) {
      syncPointsMutation.mutate();
    }
  }, [isAuthenticated, userSignalements.length, signalementsLoading]);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    telephone: "",
    bio: "",
    ville: "",
    metier: "", // Added metier field
    profileImageUrl: "",
  });

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        telephone: user.telephone || "",
        bio: user.bio || "",
        ville: user.ville || "",
        metier: user.metier || "", // Initialize metier
        profileImageUrl: user.profileImageUrl || "",
      });
    }
  }, [user]);


  const updateMutation = useMutation({
    mutationFn: (data: UpdateUserProfile) => apiRequest("PATCH", "/api/auth/user", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({
        title: "Profil mis à jour",
        description: "Vos informations ont été mises à jour avec succès.",
      });
      setIsEditing(false);
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Non autorisé",
          description: "Vous êtes déconnecté. Reconnexion...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la mise à jour.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/signalements/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user/signalements"] });
      queryClient.invalidateQueries({ queryKey: ["/api/signalements"] });
      toast({
        title: "Signalement supprimé",
        description: "Le signalement a été supprimé avec succès.",
      });
    },
    onError: (error: any) => {
      const errorMessage = error?.error || error?.message || "Une erreur est survenue lors de la suppression.";
      toast({
        title: "Erreur",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  const { data: activeSession, isLoading: sessionLoading } = useQuery<TrackingSession>({
    queryKey: ["/api/tracking/session"],
    enabled: isAuthenticated,
    retry: false,
  });

  const { data: trackingSessions = [], isLoading: sessionsLoading } = useQuery<TrackingSessionWithTrajectory[]>({
    queryKey: ["/api/tracking/sessions"],
    enabled: isAuthenticated,
    retry: false,
  });

  const { data: activeSessionPoints = [] } = useQuery<LocationPoint[]>({
    queryKey: ["/api/tracking/sessions", activeSession?.id, "points"],
    enabled: isAuthenticated && !!activeSession?.id,
  });

  useEffect(() => {
    if (activeSession?.isActive) {
      setTrackingActive(true);
      setLocationPointsCount(activeSessionPoints.length);
    } else {
      setTrackingActive(false);
      setLocationPointsCount(0);
    }
  }, [activeSession, activeSessionPoints]);

  const startTrackingMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/tracking/start"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tracking/session"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tracking/sessions"] });
      toast({
        title: "Tracking démarré",
        description: "Votre position est maintenant suivie en temps réel.",
      });
      setTrackingActive(true);
      setLocationPointsCount(0);
      startLocationTracking();
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error?.error || "Impossible de démarrer le tracking.",
        variant: "destructive",
      });
    },
  });

  const stopTrackingMutation = useMutation({
    mutationFn: () => {
      if (!activeSession?.id) {
        throw new Error("Aucune session active à arrêter");
      }
      return apiRequest("POST", "/api/tracking/stop");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tracking/session"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tracking/sessions"] });
      toast({
        title: "Tracking arrêté",
        description: `Session terminée avec ${locationPointsCount} points enregistrés.`,
      });
      setTrackingActive(false);
      stopLocationTracking();
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error?.error || error?.message || "Impossible d'arrêter le tracking.",
        variant: "destructive",
      });
      // Réinitialiser l'état local si la session n'existe plus côté serveur
      setTrackingActive(false);
      stopLocationTracking();
    },
  });

  const addLocationPointMutation = useMutation({
    mutationFn: (data: { latitude: number; longitude: number; accuracy?: number }) =>
      apiRequest("POST", "/api/tracking/location", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tracking/sessions", activeSession?.id, "points"] });
      setLocationPointsCount(prev => prev + 1);
    },
  });

  const startLocationTracking = () => {
    if (trackingInterval) {
      return;
    }

    if (!navigator.geolocation) {
      toast({
        title: "Non supporté",
        description: "La géolocalisation n'est pas supportée par votre navigateur.",
        variant: "destructive",
      });
      return;
    }

    const interval = setInterval(() => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          addLocationPointMutation.mutate({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
          });
        },
        (error) => {
          console.error("Erreur de géolocalisation:", error);
          toast({
            title: "Erreur de position",
            description: "Impossible d'obtenir votre position actuelle.",
            variant: "destructive",
          });
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    }, 30000);

    setTrackingInterval(interval);
  };

  const stopLocationTracking = () => {
    if (trackingInterval) {
      clearInterval(trackingInterval);
      setTrackingInterval(null);
    }
  };

  useEffect(() => {
    if (activeSession?.isActive && trackingActive) {
      startLocationTracking();
    } else {
      stopLocationTracking();
    }

    return () => {
      stopLocationTracking();
    };
  }, [activeSession?.isActive, trackingActive]);

  useEffect(() => {
    return () => {
      if (trackingInterval) {
        clearInterval(trackingInterval);
      }
    };
  }, [trackingInterval]);

  const getCategorieColor = (categorie: string) => {
    const colors: Record<string, string> = {
      urgence: "bg-red-500",
      securite: "bg-orange-500",
      sante: "bg-blue-500",
      environnement: "bg-green-500",
      corruption: "bg-purple-500",
      infrastructure: "bg-yellow-600",
    };
    return colors[categorie] || "bg-gray-500";
  };

  const getUrgenceColor = (urgence: string | null) => {
    if (!urgence) return "bg-gray-500";
    const colors: Record<string, string> = {
      faible: "bg-green-500",
      moyen: "bg-orange-500",
      critique: "bg-red-500",
    };
    return colors[urgence] || "bg-gray-500";
  };

  const getStatutBadge = (statut: string | null) => {
    const statutMap: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
      en_attente: { label: "En attente", variant: "outline" },
      en_cours: { label: "En cours", variant: "default" },
      resolu: { label: "Résolu", variant: "secondary" },
      rejete: { label: "Rejeté", variant: "destructive" },
    };
    return statutMap[statut || "en_attente"] || { label: "En attente", variant: "outline" };
  };

  // Emergency Contacts Queries and Mutations
  const { data: emergencyContacts } = useQuery<EmergencyContact[]>({
    queryKey: ["/api/emergency-contacts"],
    enabled: !!user,
  });

  const createContactMutation = useMutation({
    mutationFn: async (contact: { name: string; phone: string; email?: string }) => {
      const res = await apiRequest("POST", "/api/emergency-contacts", contact);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/emergency-contacts"] });
      setNewContact({ name: "", phone: "", email: "" });
      toast({
        title: "Contact ajouté",
        description: "Le contact d'urgence a été ajouté avec succès",
      });
    },
  });

  const deleteContactMutation = useMutation({
    mutationFn: async (contactId: string) => {
      const res = await apiRequest("DELETE", `/api/emergency-contacts/${contactId}`, {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/emergency-contacts"] });
      toast({
        title: "Contact supprimé",
        description: "Le contact d'urgence a été supprimé",
      });
    },
  });

  const deleteSessionMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      const res = await apiRequest("DELETE", `/api/tracking/sessions/${sessionId}`, {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tracking/sessions"] });
      toast({
        title: "Session supprimée",
        description: "La session de localisation a été supprimée avec succès",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error?.error || "Impossible de supprimer la session",
        variant: "destructive",
      });
    },
  });


  if (isLoading || !user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const getInitials = () => {
    const first = user.firstName?.[0] || "";
    const last = user.lastName?.[0] || "";
    return (first + last).toUpperCase() || "U";
  };

  // Calcul des points et badges
  const calculateUserStats = () => {
    const validatedCount = userSignalements.filter(s => s.statut === 'resolu').length;
    const totalSignalements = userSignalements.length;

    // Points: +10 par signalement validé, estimation pour les confirmations
    const points = (validatedCount * 10) + (totalSignalements * 5);

    let badge = { icon: "🟢", label: "Citoyen Actif", color: "bg-green-100 text-green-800 border-green-300" };

    if (points >= 200) {
      badge = { icon: "🔴", label: "Ambassadeur Local", color: "bg-red-100 text-red-800 border-red-300" };
    } else if (points >= 100) {
      badge = { icon: "🟡", label: "Reporter Fiable", color: "bg-yellow-100 text-yellow-800 border-yellow-300" };
    } else if (points >= 50) {
      badge = { icon: "🔵", label: "Veilleur Régional", color: "bg-blue-100 text-blue-800 border-blue-300" };
    }

    return { points, badge, validatedCount };
  };

  const { points, badge } = calculateUserStats();

  // Get current level info for LevelProgress component
  const currentLevelName = getLevelInfo(String(user?.userPoints || 0))?.name || 'sentinelle';


  return (
    <div className="min-h-screen bg-background pb-24">
      <Header />

      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                {t('profile.personalInfo')}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row items-start gap-6">
                <div className="relative">
                  <Avatar className="w-32 h-32">
                    <AvatarImage src={formData.profileImageUrl} style={{ objectFit: "cover" }} />
                    <AvatarFallback className="text-2xl">{getInitials()}</AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-2 -right-2 text-4xl" title={badge.label}>
                    {badge.icon}
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    ref={setFileInputRef}
                    onChange={handleImageUpload}
                    data-testid="input-profile-photo"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    className="absolute bottom-0 right-0 rounded-full"
                    onClick={() => fileInputRef?.click()}
                    data-testid="button-change-photo"
                    disabled={updateMutation.isPending}
                  >
                    {updateMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Camera className="w-4 h-4" />
                    )}
                  </Button>
                </div>
                <div className="flex-1">
                  {!isEditing ? (
                    <>
                      <h2 className="text-2xl font-bold mb-1">
                        {user.firstName || user.lastName
                          ? `${user.firstName || ""} ${user.lastName || ""}`.trim()
                          : "Utilisateur"}
                      </h2>
                      <p className="text-muted-foreground mb-2">{user.email || "Pas d'email"}</p>
                      {user.ville && (
                        <p className="text-sm text-muted-foreground mb-2">📍 {user.ville}</p>
                      )}
                      {user.telephone && (
                        <p className="text-sm text-muted-foreground mb-2">📞 {user.telephone}</p>
                      )}
                      {user.metier && ( // Display metier in read mode
                        <div className="flex items-center gap-2 mb-2">
                          <Briefcase className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">{user.metier}</span>
                        </div>
                      )}
                      {user.bio && (
                        <p className="text-sm mt-4">{user.bio}</p>
                      )}

                      {/* Badge et Points */}
                      <div className="mt-4 p-3 bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg border border-primary/20">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-3xl">{badge.icon}</span>
                          <div className="flex-1">
                            <Badge className={`${badge.color} border`}>
                              {badge.label}
                            </Badge>
                            <p className="text-sm text-muted-foreground mt-1">
                              <span className="font-bold text-primary">{points} points</span> au total
                            </p>
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground space-y-1">
                          <p>• +10 points par signalement validé</p>
                          <p>• +5 points par confirmation d'autres citoyens</p>
                        </div>
                      </div>

                      <Button
                        variant="outline"
                        className="mt-4"
                        onClick={() => setIsEditing(true)}
                        data-testid="button-edit-profile"
                      >
                        <User className="w-4 h-4 mr-2" />
                        Modifier le profil
                      </Button>
                    </>
                  ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="firstName">Prénom</Label>
                          <Input
                            id="firstName"
                            value={formData.firstName}
                            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                            data-testid="input-firstname"
                          />
                        </div>
                        <div>
                          <Label htmlFor="lastName">Nom</Label>
                          <Input
                            id="lastName"
                            value={formData.lastName}
                            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                            data-testid="input-lastname"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="telephone">Téléphone</Label>
                          <Input
                            id="telephone"
                            type="tel"
                            value={formData.telephone}
                            onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                            placeholder="+226 XX XX XX XX"
                            data-testid="input-telephone"
                          />
                        </div>
                        <div>
                          <Label htmlFor="ville">Ville</Label>
                          <Input
                            id="ville"
                            value={formData.ville}
                            onChange={(e) => setFormData({ ...formData, ville: e.target.value })}
                            placeholder="Ouagadougou"
                            data-testid="input-ville"
                          />
                        </div>
                      </div>
                      {/* Add metier input field */}
                      <div className="space-y-2">
                        <Label htmlFor="metier">Métier</Label>
                        <Input
                          id="metier"
                          value={formData.metier || ""}
                          onChange={(e) => setFormData({ ...formData, metier: e.target.value })}
                          placeholder="Votre profession"
                          data-testid="input-metier"
                        />
                      </div>
                      <div>
                        <Label htmlFor="bio">Bio</Label>
                        <Textarea
                          id="bio"
                          value={formData.bio}
                          onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                          placeholder="Parlez-nous de vous..."
                          className="min-h-24"
                          data-testid="input-bio"
                        />
                      </div>
                      <div>
                        <Label htmlFor="profileImageUrl">URL de la photo de profil</Label>
                        <Input
                          id="profileImageUrl"
                          value={formData.profileImageUrl}
                          onChange={(e) => setFormData({ ...formData, profileImageUrl: e.target.value })}
                          placeholder="https://..."
                          data-testid="input-profile-image"
                        />
                      </div>
                      <div className="flex gap-3">
                        <Button
                          type="submit"
                          disabled={updateMutation.isPending}
                          data-testid="button-save"
                        >
                          {updateMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                          <Save className="w-4 h-4 mr-2" />
                          Enregistrer
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setIsEditing(false);
                            if (user) {
                              setFormData({
                                firstName: user.firstName || "",
                                lastName: user.lastName || "",
                                telephone: user.telephone || "",
                                bio: user.bio || "",
                                ville: user.ville || "",
                                metier: user.metier || "", // Reset metier
                                profileImageUrl: user.profileImageUrl || "",
                              });
                            }
                          }}
                          data-testid="button-cancel"
                        >
                          Annuler
                        </Button>
                      </div>
                    </form>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="signalements" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="signalements">Mes Publications</TabsTrigger>
            <TabsTrigger value="suivi">Suivi GPS</TabsTrigger>
            <TabsTrigger value="urgence">Urgence</TabsTrigger>
          </TabsList>

          <TabsContent value="signalements" className="mt-0 border-b border-l border-r rounded-b-lg p-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="w-5 h-5" />
                  Mes Publications ({userSignalements.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {signalementsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  </div>
                ) : userSignalements.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>Vous n'avez pas encore publié de signalement.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {userSignalements.map((signalement) => {
                      const statutBadge = getStatutBadge(signalement.statut);
                      return (
                        <Card key={signalement.id} className="hover-elevate" data-testid={`signalement-card-${signalement.id}`}>
                          <CardContent className="p-4">
                            <div className="flex flex-wrap justify-between items-start gap-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <Badge className={getCategorieColor(signalement.categorie)} data-testid={`badge-categorie-${signalement.id}`}>
                                    {signalement.categorie}
                                  </Badge>
                                  <Badge variant={statutBadge.variant} data-testid={`badge-statut-${signalement.id}`}>
                                    {statutBadge.label}
                                  </Badge>
                                  <div className={`w-2 h-2 rounded-full ${getUrgenceColor(signalement.niveauUrgence)}`}
                                       data-testid={`urgence-indicator-${signalement.id}`} />
                                </div>
                                <h3 className="font-semibold mb-2" data-testid={`titre-${signalement.id}`}>
                                  {signalement.titre}
                                </h3>
                                <p className="text-sm text-muted-foreground mb-2 line-clamp-2" data-testid={`description-${signalement.id}`}>
                                  {signalement.description}
                                </p>
                                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                  <span className="flex items-center gap-1">
                                    <MapPin className="w-3 h-3" />
                                    {signalement.localisation || "Position GPS"}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    {new Date(signalement.createdAt!).toLocaleDateString('fr-FR')}
                                  </span>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <EditSignalementDialog signalement={signalement} />
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button
                                      variant="outline"
                                      size="icon"
                                      data-testid={`button-delete-${signalement.id}`}
                                    >
                                      <Trash2 className="w-4 h-4 text-destructive" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Êtes-vous sûr de vouloir supprimer ce signalement ? Cette action est irréversible.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel data-testid="button-cancel-delete">Annuler</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => deleteMutation.mutate(signalement.id)}
                                        disabled={deleteMutation.isPending}
                                        className="bg-destructive hover:bg-destructive/90"
                                        data-testid="button-confirm-delete"
                                      >
                                        {deleteMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                        Supprimer
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Section Rang Citoyen compacte */}
            <Card className="mt-6">
              <CardHeader className="pb-3 bg-gradient-to-r from-green-500/10 via-yellow-500/10 to-red-500/10">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Trophy className="w-4 h-4" />
                  {t('profile.citizenRank')}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <LevelBadge level={currentLevelName} />
                    <span className="text-sm text-muted-foreground">{t(`profile.${currentLevelName.toLowerCase().replace(/\s+/g, '')}`, currentLevelName)}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-primary">{user?.userPoints || 0}</div>
                    <div className="text-xs text-muted-foreground">{t('common.points', 'points')}</div>
                  </div>
                </div>
                <div className="mt-4">
                  <LevelProgress points={user?.userPoints || 0} />
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full mt-3"
                  onClick={() => setLocation('/leaderboard')}
                >
                  <Trophy className="w-4 h-4 mr-2" />
                  {t('profile.viewRanking')}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="suivi" className="mt-0 border-b border-l border-r rounded-b-lg p-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Navigation className="w-5 h-5" />
                  Suivi de Localisation en Direct
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-card rounded-md border">
                    <div className="flex items-center gap-3">
                      {trackingActive ? (
                        <>
                          <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
                          <div>
                            <p className="font-medium">Tracking actif</p>
                            <p className="text-sm text-muted-foreground">
                              {locationPointsCount} points enregistrés
                            </p>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="w-3 h-3 rounded-full bg-gray-400" />
                          <div>
                            <p className="font-medium">Tracking inactif</p>
                            <p className="text-sm text-muted-foreground">
                              Cliquez pour démarrer
                            </p>
                          </div>
                        </>
                      )}
                    </div>
                    {trackingActive ? (
                      <Button
                        variant="destructive"
                        onClick={() => stopTrackingMutation.mutate()}
                        disabled={stopTrackingMutation.isPending || !activeSession?.id}
                        data-testid="button-stop-tracking"
                      >
                        {stopTrackingMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        <StopCircle className="w-4 h-4 mr-2" />
                        Arrêter
                      </Button>
                    ) : (
                      <Button
                        onClick={() => startTrackingMutation.mutate()}
                        disabled={startTrackingMutation.isPending}
                        data-testid="button-start-tracking"
                      >
                        {startTrackingMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        <PlayCircle className="w-4 h-4 mr-2" />
                        Démarrer
                      </Button>
                    )}
                  </div>

                  <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded-md p-4">
                    <div className="flex items-start gap-3">
                      <Activity className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                      <div className="flex-1">
                        <p className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                          Sécurité et traçabilité
                        </p>
                        <p className="text-sm text-blue-800 dark:text-blue-200">
                          Le suivi de localisation enregistre votre position toutes les 30 secondes.
                          En cas d'incident ou d'accident, cette trajectoire peut aider les secours à vous retrouver rapidement.
                        </p>
                      </div>
                    </div>
                  </div>

                  {!sessionsLoading && trackingSessions && trackingSessions.length > 0 && (
                    <>
                      <Separator />
                      <div>
                        <h3 className="font-medium mb-3 flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          Historique des sessions
                        </h3>
                        <div className="space-y-2">
                          {trackingSessions.slice(0, 5).map((session) => (
                            <div
                              key={session.id}
                              className="p-3 bg-card rounded-md border"
                              data-testid={`session-card-${session.id}`}
                            >
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-3">
                                  <div className={`w-2 h-2 rounded-full ${session.isActive ? 'bg-green-500' : 'bg-gray-400'}`} />
                                  <div>
                                    <p className="text-sm font-medium">
                                      {new Date(session.startTime).toLocaleDateString('fr-FR', {
                                        day: 'numeric',
                                        month: 'long',
                                        year: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit',
                                      })}
                                    </p>
                                    {session.endTime && (
                                      <p className="text-xs text-muted-foreground">
                                        Durée: {Math.round((new Date(session.endTime).getTime() - new Date(session.startTime).getTime()) / 1000 / 60)} min
                                      </p>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Badge variant={session.isActive ? "default" : "outline"}>
                                    {session.isActive ? "Active" : "Terminée"}
                                  </Badge>
                                  {!session.isActive && (
                                    <AlertDialog>
                                      <AlertDialogTrigger asChild>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-7 w-7"
                                          data-testid={`button-delete-session-${session.id}`}
                                        >
                                          <Trash2 className="w-4 h-4 text-destructive" />
                                        </Button>
                                      </AlertDialogTrigger>
                                      <AlertDialogContent>
                                        <AlertDialogHeader>
                                          <AlertDialogTitle>Supprimer cette session ?</AlertDialogTitle>
                                          <AlertDialogDescription>
                                            Tous les points de localisation de cette session seront définitivement supprimés.
                                          </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                          <AlertDialogCancel>Annuler</AlertDialogCancel>
                                          <AlertDialogAction
                                            onClick={() => deleteSessionMutation.mutate(session.id)}
                                            className="bg-destructive hover:bg-destructive/90"
                                          >
                                            Supprimer
                                          </AlertDialogAction>
                                        </AlertDialogFooter>
                                      </AlertDialogContent>
                                    </AlertDialog>
                                  )}
                                </div>
                              </div>

                              {session.trajectoryUrl && session.pointCount > 0 && (
                                <div className="mt-3 pt-3 border-t">
                                  <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                      <MapPin className="w-3 h-3" />
                                      <span>{session.pointCount} point{session.pointCount > 1 ? 's' : ''} enregistré{session.pointCount > 1 ? 's' : ''}</span>
                                    </div>
                                    <div className="flex gap-1">
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="h-7 px-2"
                                        onClick={() => {
                                          if (session.trajectoryUrl) {
                                            navigator.clipboard.writeText(session.trajectoryUrl);
                                            toast({
                                              title: "Lien copié",
                                              description: "Le lien de la trajectoire a été copié dans le presse-papier.",
                                            });
                                          }
                                        }}
                                        data-testid={`button-copy-trajectory-${session.id}`}
                                      >
                                        <Copy className="w-3 h-3 mr-1" />
                                        Copier
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="h-7 px-2"
                                        onClick={() => {
                                          if (session.trajectoryUrl) {
                                            window.open(session.trajectoryUrl, '_blank');
                                          }
                                        }}
                                        data-testid={`button-open-trajectory-${session.id}`}
                                      >
                                        <ExternalLink className="w-3 h-3 mr-1" />
                                        Voir carte
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="urgence" className="mt-0 border-b border-l border-r rounded-b-lg p-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Contacts d'Urgence (Bouton Panique)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Ces contacts recevront votre position GPS en cas d'activation du bouton panique (3 pressions rapides).
                </p>

                <div className="space-y-2">
                  <Label>Ajouter un contact</Label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    <Input
                      placeholder="Nom"
                      value={newContact.name}
                      onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                    />
                    <Input
                      placeholder="Téléphone"
                      value={newContact.phone}
                      onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                    />
                    <Input
                      placeholder="Email (optionnel)"
                      value={newContact.email}
                      onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
                    />
                  </div>
                  <Button
                    onClick={() => createContactMutation.mutate(newContact)}
                    disabled={!newContact.name || !newContact.phone || createContactMutation.isPending}
                  >
                    {createContactMutation.isPending ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Plus className="w-4 h-4 mr-2" />
                    )}
                    Ajouter
                  </Button>
                </div>

                <div className="space-y-2">
                  {emergencyContacts?.map((contact) => (
                    <div
                      key={contact.id}
                      className="flex items-center justify-between p-3 bg-muted rounded-lg gap-2"
                    >
                      <div className="flex-1">
                        <p className="font-medium">{contact.name}</p>
                        <p className="text-sm text-muted-foreground">{contact.phone}</p>
                        {contact.email && (
                          <p className="text-xs text-muted-foreground">{contact.email}</p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => setSelectedContact(contact)}
                          className="gap-2"
                          data-testid="button-lockscreen-contact"
                        >
                          <Smartphone className="w-4 h-4" />
                          Écran de veille
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteContactMutation.mutate(contact.id)}
                          disabled={deleteContactMutation.isPending}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {(!emergencyContacts || emergencyContacts.length === 0) && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Aucun contact d'urgence configuré
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Paramètres du compte</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm font-medium">Email</Label>
              <p className="text-sm text-muted-foreground mt-1">{user.email || "Pas d'email"}</p>
              <p className="text-xs text-muted-foreground mt-1">
                L'email ne peut pas être modifié
              </p>
            </div>

            <Separator />

            <div>
              <Label className="text-sm font-medium">Rôle</Label>
              <p className="text-sm text-muted-foreground mt-1 capitalize">{user.role || "Citoyen"}</p>
            </div>

            <Separator />

            <Button
              variant="outline"
              className="w-full text-destructive"
              onClick={handleLogout}
              data-testid="button-logout"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Se déconnecter
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Modal de génération d'image écran de veille */}
      <Dialog open={!!selectedContact} onOpenChange={(open) => !open && setSelectedContact(null)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Smartphone className="w-5 h-5" />
              Générer image d'urgence
            </DialogTitle>
            <DialogDescription>
              Créez une image pour votre écran de verrouillage avec ce contact d'urgence
            </DialogDescription>
          </DialogHeader>

          {selectedContact && (
            <div className="space-y-4 py-4">
              <div className="bg-muted p-4 rounded-lg">
                <p className="font-semibold">{selectedContact.name}</p>
                <p className="text-2xl font-bold text-primary mt-2">{selectedContact.phone}</p>
              </div>

              <div className="space-y-3">
                <Label>Style de l'image</Label>
                <RadioGroup value={lockscreenStyle} onValueChange={(value) => setLockscreenStyle(value as "light" | "dark")}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="light" id="light-contact" />
                    <Label htmlFor="light-contact" className="cursor-pointer">Clair (fond blanc)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="dark" id="dark-contact" />
                    <Label htmlFor="dark-contact" className="cursor-pointer">Sombre (fond noir)</Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 p-3 rounded-lg">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  <strong>Comment l'utiliser :</strong> Après téléchargement, allez dans les paramètres de votre téléphone → Fond d'écran → Écran de verrouillage → Sélectionnez l'image téléchargée.
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedContact(null)}>
              Annuler
            </Button>
            <Button onClick={generateLockscreenImage} disabled={isGeneratingLockscreen}>
              {isGeneratingLockscreen ? (
                <>Génération...</>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Générer et télécharger
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Canvas caché pour la génération d'image */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      <BottomNav />
    </div>
  );
}