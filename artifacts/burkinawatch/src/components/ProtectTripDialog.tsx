import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { ShieldCheck, Loader2, Users } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { EmergencyContact } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";

interface ProtectTripDialogProps {
  placeId: string;
  placeName: string;
  latitude: string;
  longitude: string;
}

export function ProtectTripDialog({ placeId, placeName, latitude, longitude }: ProtectTripDialogProps) {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [open, setOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isStarting, setIsStarting] = useState(false);

  const { data: contacts = [], isLoading: contactsLoading } = useQuery<EmergencyContact[]>({
    queryKey: ["/api/emergency-contacts"],
    enabled: Boolean(user && open),
  });

  useEffect(() => {
    if (!open || selectedIds.length > 0 || contacts.length === 0) return;
    const primary = contacts.find((contact) => contact.isPrimary);
    setSelectedIds([primary?.id || contacts[0].id]);
  }, [contacts, open, selectedIds.length]);

  const startProtection = async () => {
    if (selectedIds.length === 0) {
      toast({
        title: "Choisissez un contact",
        description: "Sélectionnez au moins un contact à prévenir.",
        variant: "destructive",
      });
      return;
    }

    setIsStarting(true);
    try {
      if (!navigator.geolocation) throw new Error("La localisation est nécessaire pour partager le départ.");
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          maximumAge: 5_000,
          timeout: 12_000,
        });
      });

      await apiRequest("POST", "/api/tracking/start", {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        destinationLabel: placeName,
        destinationPlaceId: placeId,
        destinationLatitude: Number(latitude),
        destinationLongitude: Number(longitude),
        contactIds: selectedIds,
      });
      setOpen(false);
      navigate("/tracking-live");
    } catch (error: any) {
      toast({
        title: "Protection non démarrée",
        description: error?.message || "Autorisez la localisation puis réessayez.",
        variant: "destructive",
      });
    } finally {
      setIsStarting(false);
    }
  };

  if (authLoading || !user) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5 border-emerald-700/30 text-emerald-800 dark:text-emerald-300">
          <ShieldCheck className="h-3.5 w-3.5" />
          Protéger mon déplacement
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-emerald-700" />Protéger mon déplacement</DialogTitle>
          <DialogDescription>
            Destination : <strong>{placeName}</strong>. BurkinaWatch partage uniquement ce que vous confirmez avec les contacts choisis. Cela ne garantit pas la sécurité du lieu.
          </DialogDescription>
        </DialogHeader>
        {contactsLoading ? (
          <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Chargement des contacts…</div>
        ) : contacts.length === 0 ? (
          <div className="space-y-3 rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
            <p>Ajoutez d’abord un contact de confiance dans votre profil.</p>
            <Button asChild variant="outline" onClick={() => setOpen(false)}><Link href="/profil"><Users className="mr-2 h-4 w-4" />Gérer mes contacts</Link></Button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm font-medium">Qui souhaitez-vous prévenir ?</p>
            <div className="space-y-2">
              {contacts.map((contact) => (
                <label key={contact.id} className="flex cursor-pointer items-center gap-3 rounded-md border p-3 hover:bg-muted/50">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(contact.id)}
                    onChange={(event) => setSelectedIds((current) => event.target.checked ? [...new Set([...current, contact.id])] : current.filter((id) => id !== contact.id))}
                    className="h-4 w-4 accent-emerald-700"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{contact.name}{contact.isPrimary ? " · principal" : ""}</span>
                    <span className="block truncate text-xs text-muted-foreground">{contact.phone}</span>
                  </span>
                </label>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">La localisation sera demandée au démarrage. Vous pourrez arrêter le partage ou confirmer votre arrivée à tout moment.</p>
          </div>
        )}
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
          {contacts.length > 0 ? <Button type="button" disabled={isStarting || contactsLoading} onClick={() => void startProtection()}>{isStarting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Démarrage…</> : "Démarrer la protection"}</Button> : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}