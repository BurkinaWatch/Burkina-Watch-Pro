import { useState, type FormEvent } from "react";
import { Helmet } from "react-helmet-async";
import { Link, useLocation } from "wouter";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";

type OfferForm = {
  title: string;
  description: string;
  category: string;
  price: string;
  zone: string;
  availability: string;
  placeId: string;
  phone: string;
  whatsapp: string;
  sourceUrl: string;
  startsAt: string;
  endsAt: string;
};

const initialForm: OfferForm = {
  title: "",
  description: "",
  category: "service",
  price: "",
  zone: "",
  availability: "",
  placeId: "",
  phone: "",
  whatsapp: "",
  sourceUrl: "",
  startsAt: "",
  endsAt: "",
};

export default function PublierOffre() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [form, setForm] = useState<OfferForm>(initialForm);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const update = (key: keyof OfferForm, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = Object.fromEntries(
        Object.entries({
          ...form,
          price: form.price ? Number(form.price) : undefined,
          placeId: form.placeId || undefined,
          sourceUrl: form.sourceUrl || undefined,
          startsAt: form.startsAt ? new Date(form.startsAt).toISOString() : undefined,
          endsAt: form.endsAt ? new Date(form.endsAt).toISOString() : undefined,
        }).filter(([, value]) => value !== undefined && value !== ""),
      );
      const response = await apiRequest("POST", "/api/pratique/offers", payload);
      await response.json();
      await queryClient.invalidateQueries({ queryKey: ["/api/pratique/offers"] });
      toast({
        title: "Offre envoyée",
        description: "Elle est en attente de validation et n'est pas encore présentée comme active.",
      });
      setForm(initialForm);
      navigate("/burkina-pratique");
    } catch (error: any) {
      toast({
        title: "Offre non envoyée",
        description: error?.message || "Vérifiez les champs puis réessayez.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading) {
    return <div className="min-h-screen bg-background" />;
  }

  return (
    <>
      <Helmet>
        <title>Proposer une offre | BurkinaWatch</title>
        <meta name="description" content="Proposer une offre vérifiable à Burkina Pratique." />
      </Helmet>
      <div className="min-h-screen bg-background pb-24">
        <Header />
        <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
          <div className="mb-6">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">Burkina Pratique</p>
            <h1 className="mt-2 text-3xl font-bold text-emerald-950 dark:text-emerald-50">Proposer une offre</h1>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Décrivez uniquement une information dont vous connaissez la source. L’offre sera marquée en attente avant d’être considérée comme active.
            </p>
          </div>

          {!user ? (
            <Card>
              <CardContent className="space-y-4 py-8 text-center">
                <p className="text-sm text-muted-foreground">Connectez-vous pour proposer une offre et en conserver la provenance.</p>
                <Button asChild><Link href="/connexion">Se connecter</Link></Button>
              </CardContent>
            </Card>
          ) : (
            <form onSubmit={submit} className="space-y-5">
              <Card>
                <CardHeader><CardTitle>Informations de l’offre</CardTitle></CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <Label htmlFor="offer-title">Titre</Label>
                    <Input id="offer-title" value={form.title} onChange={(event) => update("title", event.target.value)} required minLength={3} maxLength={160} placeholder="Ex. Plombier disponible aujourd’hui" />
                  </div>
                  <div className="sm:col-span-2">
                    <Label htmlFor="offer-description">Description</Label>
                    <Textarea id="offer-description" value={form.description} onChange={(event) => update("description", event.target.value)} required minLength={3} maxLength={4000} placeholder="Décrivez ce qui est proposé, sans inventer la disponibilité." />
                  </div>
                  <div>
                    <Label htmlFor="offer-category">Catégorie</Label>
                    <select id="offer-category" value={form.category} onChange={(event) => update("category", event.target.value)} className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                      <option value="service">Service</option>
                      <option value="restaurant">Restaurant</option>
                      <option value="commerce">Commerce</option>
                      <option value="hébergement">Hébergement</option>
                      <option value="mobile_money">Mobile Money</option>
                      <option value="transport">Transport</option>
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="offer-price">Prix en FCFA (optionnel)</Label>
                    <Input id="offer-price" type="number" min="0" step="1" value={form.price} onChange={(event) => update("price", event.target.value)} placeholder="2500" />
                  </div>
                  <div>
                    <Label htmlFor="offer-zone">Zone</Label>
                    <Input id="offer-zone" value={form.zone} onChange={(event) => update("zone", event.target.value)} placeholder="Quartier, ville" />
                  </div>
                  <div>
                    <Label htmlFor="offer-availability">Disponibilité indiquée</Label>
                    <Input id="offer-availability" value={form.availability} onChange={(event) => update("availability", event.target.value)} placeholder="Aujourd’hui, sur réservation..." />
                  </div>
                  <div>
                    <Label htmlFor="offer-starts">Valable à partir du</Label>
                    <Input id="offer-starts" type="datetime-local" value={form.startsAt} onChange={(event) => update("startsAt", event.target.value)} />
                  </div>
                  <div>
                    <Label htmlFor="offer-ends">Valable jusqu’au</Label>
                    <Input id="offer-ends" type="datetime-local" value={form.endsAt} onChange={(event) => update("endsAt", event.target.value)} />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle>Source et contact</CardTitle></CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="offer-place">Identifiant du lieu associé (optionnel)</Label>
                    <Input id="offer-place" value={form.placeId} onChange={(event) => update("placeId", event.target.value)} placeholder="ID de la fiche existante" />
                  </div>
                  <div>
                    <Label htmlFor="offer-source">URL source (optionnel)</Label>
                    <Input id="offer-source" type="url" value={form.sourceUrl} onChange={(event) => update("sourceUrl", event.target.value)} placeholder="https://..." />
                  </div>
                  <div>
                    <Label htmlFor="offer-phone">Téléphone</Label>
                    <Input id="offer-phone" type="tel" value={form.phone} onChange={(event) => update("phone", event.target.value)} />
                  </div>
                  <div>
                    <Label htmlFor="offer-whatsapp">WhatsApp</Label>
                    <Input id="offer-whatsapp" type="tel" value={form.whatsapp} onChange={(event) => update("whatsapp", event.target.value)} />
                  </div>
                </CardContent>
              </Card>

              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <Button type="button" variant="outline" onClick={() => navigate("/burkina-pratique")}>Annuler</Button>
                <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Envoi..." : "Envoyer pour validation"}</Button>
              </div>
            </form>
          )}
        </main>
        <BottomNav />
      </div>
    </>
  );
}