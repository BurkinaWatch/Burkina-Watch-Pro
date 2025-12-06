import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Pencil, Loader2, Trash2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { updateSignalementSchema, type UpdateSignalement, type Signalement } from "@shared/schema";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

interface EditSignalementDialogProps {
  signalement: Signalement;
}

export default function EditSignalementDialog({ signalement }: EditSignalementDialogProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [, setLocation] = useLocation();

  const form = useForm<UpdateSignalement>({
    resolver: zodResolver(updateSignalementSchema),
    defaultValues: {
      titre: signalement.titre,
      description: signalement.description,
      categorie: signalement.categorie,
      latitude: signalement.latitude,
      longitude: signalement.longitude,
      localisation: signalement.localisation || "",
      niveauUrgence: signalement.niveauUrgence || "moyen",
      statut: (signalement.statut || "en_attente") as "en_attente" | "en_cours" | "resolu" | "rejete",
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: UpdateSignalement) => {
      const res = await apiRequest("PATCH", `/api/signalements/${signalement.id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/signalements"] });
      queryClient.invalidateQueries({ queryKey: [`/api/signalements/${signalement.id}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user/signalements"] });
      toast({
        title: "Signalement modifié",
        description: "Vos modifications ont été enregistrées.",
      });
      setOpen(false);
    },
    onError: (error: any) => {
      const errorMessage = error?.error || error?.message || "Une erreur est survenue lors de la modification.";
      toast({
        title: "Erreur",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("DELETE", `/api/signalements/${signalement.id}`, {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/signalements"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user/signalements"] });
      toast({
        title: "Signalement supprimé",
        description: "Votre signalement a été supprimé avec succès.",
      });
      setOpen(false);
      setDeleteDialogOpen(false);
      setLocation("/");
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

  const onSubmit = (data: UpdateSignalement) => {
    updateMutation.mutate(data);
  };

  const handleDelete = () => {
    deleteMutation.mutate();
  };

  const getStatutBadgeColor = (statut: string) => {
    switch (statut) {
      case "en_attente":
        return "bg-gray-500";
      case "en_cours":
        return "bg-orange-500";
      case "resolu":
        return "bg-green-500";
      case "rejete":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatutLabel = (statut: string) => {
    switch (statut) {
      case "en_attente":
        return "En attente";
      case "en_cours":
        return "En cours";
      case "resolu":
        return "Résolu";
      case "rejete":
        return "Rejeté";
      default:
        return statut;
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" data-testid="button-edit-signalement">
          <Pencil className="w-4 h-4 mr-1" />
          Modifier
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Modifier le signalement</DialogTitle>
          <DialogDescription>
            Modifiez les informations de votre signalement et changez son statut
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="titre"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Titre</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Titre du signalement"
                      {...field}
                      data-testid="input-edit-titre"
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
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Décrivez la situation en détail"
                      {...field}
                      rows={4}
                      data-testid="textarea-edit-description"
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
                  <FormLabel>Catégorie</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-edit-categorie">
                        <SelectValue placeholder="Sélectionnez une catégorie" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="urgence">🚨 Urgence</SelectItem>
                      <SelectItem value="securite">🔒 Sécurité</SelectItem>
                      <SelectItem value="sante">🏥 Santé</SelectItem>
                      <SelectItem value="environnement">🌳 Environnement</SelectItem>
                      <SelectItem value="corruption">⚖️ Corruption</SelectItem>
                      <SelectItem value="infrastructure">🏗️ Infrastructure</SelectItem>
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
                  <FormLabel>Localisation</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ville, quartier, rue..."
                      {...field}
                      data-testid="input-edit-localisation"
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
                  <FormLabel>Niveau d'urgence</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-edit-urgence">
                        <SelectValue placeholder="Sélectionnez un niveau" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="faible">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-green-500" />
                          Faible - Voyant Vert
                        </div>
                      </SelectItem>
                      <SelectItem value="moyen">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-orange-500" />
                          Moyen - Voyant Orange
                        </div>
                      </SelectItem>
                      <SelectItem value="critique">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-red-500" />
                          Critique - Voyant Rouge
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="statut"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Statut</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-edit-statut">
                        <SelectValue placeholder="Sélectionnez un statut" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="en_attente">
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${getStatutBadgeColor("en_attente")}`} />
                          {getStatutLabel("en_attente")}
                        </div>
                      </SelectItem>
                      <SelectItem value="en_cours">
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${getStatutBadgeColor("en_cours")}`} />
                          {getStatutLabel("en_cours")}
                        </div>
                      </SelectItem>
                      <SelectItem value="resolu">
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${getStatutBadgeColor("resolu")}`} />
                          {getStatutLabel("resolu")}
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="flex-col sm:flex-row gap-2">
              <div className="flex-1 flex justify-start">
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => setDeleteDialogOpen(true)}
                  data-testid="button-delete-signalement"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Supprimer
                </Button>
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                  data-testid="button-cancel-edit"
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  disabled={updateMutation.isPending}
                  data-testid="button-submit-edit"
                >
                  {updateMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Enregistrer
                </Button>
              </div>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Êtes-vous sûr de vouloir supprimer ce signalement ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Le signalement et tous ses commentaires seront définitivement supprimés.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete"
            >
              {deleteMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Supprimer définitivement
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}
