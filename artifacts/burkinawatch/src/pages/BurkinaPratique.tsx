import { useMemo, useState, type ComponentType, type FormEvent } from "react";
import { Link, useLocation } from "wouter";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight,
  Banknote,
  Bus,
  Building2,
  ChevronRight,
  CircleAlert,
  Compass,
  Cross,
  Fuel,
  Film,
  GraduationCap,
  Hotel,
  Landmark,
  MapPin,
  Search,
  ShieldCheck,
  ShoppingBag,
  Smartphone,
  Sparkles,
  Store,
  Utensils,
  Zap,
} from "lucide-react";
import {
  buildPracticalRoute,
  parsePracticalSearch,
  practicalFilterLabel,
} from "@/lib/practicalSearch";

type Icon = ComponentType<{ className?: string }>;

type Category = {
  href: string;
  label: string;
  description: string;
  icon: Icon;
  tone: string;
  keywords: string[];
};

const quickAccess: Category[] = [
  {
    href: "/pharmacies",
    label: "Pharmacies",
    description: "Trouver une pharmacie du Faso",
    icon: Cross,
    tone: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300",
    keywords: ["pharmacie", "pharmacies", "garde", "médicament", "medicament"],
  },
  {
    href: "/urgences",
    label: "Urgences",
    description: "Les contacts qui comptent maintenant",
    icon: CircleAlert,
    tone: "bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-300",
    keywords: ["urgence", "urgences", "secours", "ambulance", "police", "pompiers"],
  },
  {
    href: "/banques",
    label: "Retrait d'argent",
    description: "Agences, banques et guichets",
    icon: Banknote,
    tone: "bg-sky-100 text-sky-800 dark:bg-sky-950/50 dark:text-sky-300",
    keywords: ["banque", "banques", "agence", "atm", "guichet", "bicec", "coris"],
  },
  {
    href: "/stations",
    label: "Station-service",
    description: "Carburant et stations-service",
    icon: Fuel,
    tone: "bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300",
    keywords: ["station", "stations", "essence", "carburant", "gaz", "fuel"],
  },
  {
    href: "/boutiques",
    label: "Dépannage",
    description: "Artisans, commerces et services de proximité",
    icon: Fuel,
    tone: "bg-orange-100 text-orange-800 dark:bg-orange-950/50 dark:text-orange-300",
    keywords: ["dépannage", "depannage", "panne", "voiture", "mécanique", "mecanique"],
  },
  {
    href: "/restaurants",
    label: "Manger",
    description: "Maquis, restaurants, bars et cafés",
    icon: Utensils,
    tone: "bg-orange-100 text-orange-800 dark:bg-orange-950/50 dark:text-orange-300",
    keywords: ["restaurant", "restaurants", "maquis", "bar", "café", "cafe", "manger"],
  },
  {
    href: "/gares",
    label: "Transport",
    description: "Gares routières et départs",
    icon: Bus,
    tone: "bg-violet-100 text-violet-800 dark:bg-violet-950/50 dark:text-violet-300",
    keywords: ["gare", "gares", "bus", "transport", "départ", "depart", "voyage"],
  },
  {
    href: "/telephonie",
    label: "Réparation",
    description: "Téléphones, agences et services mobiles",
    icon: Smartphone,
    tone: "bg-cyan-100 text-cyan-800 dark:bg-cyan-950/50 dark:text-cyan-300",
    keywords: ["réparation", "reparation", "téléphonie", "telephonie", "téléphone", "telephone", "mobile"],
  },
];

const allCategories: Category[] = [
  ...quickAccess,
  {
    href: "/hopitaux",
    label: "Hôpitaux & santé",
    description: "Établissements de santé",
    icon: ShieldCheck,
    tone: "bg-teal-100 text-teal-800 dark:bg-teal-950/50 dark:text-teal-300",
    keywords: ["hôpital", "hopital", "hôpitaux", "santé", "sante"],
  },
  {
    href: "/marches",
    label: "Marchés",
    description: "Marchés et lieux de commerce",
    icon: Store,
    tone: "bg-yellow-100 text-yellow-800 dark:bg-yellow-950/50 dark:text-yellow-300",
    keywords: ["marché", "marche", "marchés"],
  },
  {
    href: "/boutiques-marches",
    label: "Boutiques & marchés",
    description: "Commerces, étals et marchés de proximité",
    icon: Store,
    tone: "bg-orange-100 text-orange-800 dark:bg-orange-950/50 dark:text-orange-300",
    keywords: ["boutiques marchés", "boutique marche", "commerce marché"],
  },
  {
    href: "/boutiques",
    label: "Commerces & artisans",
    description: "Acheter, réparer et trouver un service de proximité",
    icon: ShoppingBag,
    tone: "bg-pink-100 text-pink-800 dark:bg-pink-950/50 dark:text-pink-300",
    keywords: ["boutique", "commerce", "magasin", "ciment", "matériaux", "plombier", "artisan"],
  },
  {
    href: "/hotels",
    label: "Hôtels & auberges",
    description: "Où dormir au Burkina Faso",
    icon: Hotel,
    tone: "bg-indigo-100 text-indigo-800 dark:bg-indigo-950/50 dark:text-indigo-300",
    keywords: ["hôtel", "hotel", "auberge", "hébergement", "hebergement"],
  },
  {
    href: "/mairies-prefectures",
    label: "Mairies & préfectures",
    description: "Services administratifs de proximité",
    icon: Landmark,
    tone: "bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300",
    keywords: ["mairie", "préfecture", "prefecture", "administration"],
  },
  {
    href: "/ministeres",
    label: "Ministères",
    description: "Institutions et services publics",
    icon: Building2,
    tone: "bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-300",
    keywords: ["ministère", "ministere", "ministères", "service public"],
  },
  {
    href: "/lieux-de-culte",
    label: "Lieux de culte",
    description: "Églises et mosquées",
    icon: Compass,
    tone: "bg-lime-100 text-lime-800 dark:bg-lime-950/50 dark:text-lime-300",
    keywords: ["église", "eglise", "mosquée", "mosquee", "culte"],
  },
  {
    href: "/universites",
    label: "Universités & instituts",
    description: "Étudier et se former",
    icon: GraduationCap,
    tone: "bg-purple-100 text-purple-800 dark:bg-purple-950/50 dark:text-purple-300",
    keywords: ["université", "universite", "institut", "école", "ecole", "étudier"],
  },
  {
    href: "/sonabel-onea",
    label: "SONABEL & ONEA",
    description: "Électricité et eau",
    icon: Zap,
    tone: "bg-yellow-100 text-yellow-800 dark:bg-yellow-950/50 dark:text-yellow-300",
    keywords: ["sonabel", "onea", "eau", "électricité", "electricite"],
  },
  {
    href: "/cine",
    label: "Programme ciné",
    description: "Séances et salles de cinéma",
    icon: Film,
    tone: "bg-fuchsia-100 text-fuchsia-800 dark:bg-fuchsia-950/50 dark:text-fuchsia-300",
    keywords: ["ciné", "cine", "cinéma", "cinema", "film", "séance", "seance"],
  },
  {
    href: "/cimetieres",
    label: "Cimetières",
    description: "Repères et lieux de recueillement",
    icon: MapPin,
    tone: "bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-300",
    keywords: ["cimetière", "cimetiere", "cimetières"],
  },
];

const normalize = (value: string) =>
  value
    .toLocaleLowerCase("fr-FR")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim();

function CategoryIcon({ category, size = "md" }: { category: Category; size?: "sm" | "md" }) {
  const Icon = category.icon;
  return (
    <span className={`flex shrink-0 items-center justify-center rounded-2xl ${size === "sm" ? "h-10 w-10" : "h-12 w-12"} ${category.tone}`}>
      <Icon className={size === "sm" ? "h-5 w-5" : "h-6 w-6"} aria-hidden="true" />
    </span>
  );
}

export default function BurkinaPratique() {
  const [, navigate] = useLocation();
  const [query, setQuery] = useState("");
  const normalizedQuery = normalize(query);
  const intent = useMemo(() => parsePracticalSearch(query), [query]);

  const searchResults = useMemo(() => {
    if (!normalizedQuery) return [];
    const matches = allCategories
      .filter((category) => {
        const haystack = normalize(`${category.label} ${category.description} ${category.keywords.join(" ")}`);
        return haystack.includes(normalizedQuery) || normalizedQuery.split(/\s+/).some((word) => haystack.includes(word));
      });
    const intentCategory = intent.matched ? allCategories.find((category) => category.href === intent.href && (category.label === intent.label || intent.key === "commerces")) : undefined;
    return [...(intentCategory ? [intentCategory] : []), ...matches.filter((category) => category !== intentCategory)].slice(0, 5);
  }, [intent, normalizedQuery]);

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const route = intent.matched ? buildPracticalRoute(intent) : searchResults[0]?.href;
    if (route) navigate(route);
  };

  return (
    <div className="min-h-[100dvh] bg-background text-foreground">
      <Header />
      <main className="relative overflow-hidden pb-28">
        <section className="border-b border-primary/10 bg-gradient-to-br from-amber-50 via-background to-emerald-50/80 dark:from-amber-950/30 dark:via-background dark:to-emerald-950/20">
          <div className="mx-auto max-w-6xl px-4 pb-12 pt-10 sm:px-6 md:pb-16 md:pt-16">
            <div className="grid items-center gap-10 lg:grid-cols-[1.08fr_.92fr]">
              <div className="pr-0 lg:pr-8">
                <div className="pratique-reveal inline-flex items-center gap-2 rounded-full border border-amber-300/60 bg-background/70 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-amber-800 shadow-sm dark:border-amber-700/60 dark:text-amber-300">
                  <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                  La vie pratique, en un geste
                </div>
                <h1 className="pratique-reveal pratique-reveal-delay-1 mt-5 max-w-2xl font-display text-4xl font-extrabold leading-[0.98] tracking-tight text-emerald-950 dark:text-emerald-50 sm:text-5xl md:text-6xl">
                  Trouvez ce qu&apos;il vous faut au Burkina.
                </h1>
                <p className="pratique-reveal pratique-reveal-delay-2 mt-5 max-w-xl text-base leading-7 text-emerald-950/70 dark:text-emerald-50/70 md:text-lg">
                  Un point de départ simple pour les lieux, services et solutions déjà disponibles dans BurkinaWatch.
                </p>

                <form onSubmit={handleSearch} className="pratique-reveal pratique-reveal-delay-3 relative mt-7 max-w-2xl" role="search">
                  <label htmlFor="burkina-pratique-search" className="sr-only">
                    Rechercher un service ou un lieu
                  </label>
                  <Search className="pointer-events-none absolute left-4 top-1/2 z-10 h-5 w-5 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                  <Input
                    id="burkina-pratique-search"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Pharmacie, station, banque, restaurant..."
                    className="h-14 rounded-2xl border-emerald-900/15 bg-background/95 pl-12 pr-28 text-base shadow-lg shadow-emerald-950/5 focus-visible:ring-amber-500"
                    autoComplete="off"
                    data-testid="input-burkina-pratique-search"
                  />
                  <Button type="submit" className="absolute right-1.5 top-1.5 h-11 rounded-xl bg-emerald-800 px-4 text-sm text-emerald-50 hover:bg-emerald-900 dark:bg-emerald-500 dark:text-emerald-950 dark:hover:bg-emerald-400" data-testid="button-burkina-pratique-search">
                    Rechercher
                  </Button>
                  {normalizedQuery && (
                    <div className="absolute left-0 right-0 top-[4.25rem] z-20 overflow-hidden rounded-2xl border bg-background p-2 shadow-xl" data-testid="search-results">
                      {searchResults.length > 0 ? (
                        searchResults.map((category) => (
                          <Link
                            key={`${category.href}-${category.label}`}
                            href={category.href === intent.href && intent.matched ? buildPracticalRoute(intent) : category.href}
                            className="flex items-center gap-3 rounded-xl p-3 text-left transition-colors hover:bg-muted"
                            data-testid={`link-search-result-${category.href.slice(1)}`}
                          >
                            <CategoryIcon category={category} size="sm" />
                            <span className="min-w-0 flex-1">
                              <span className="block text-sm font-semibold">{category.label}</span>
                              <span className="block truncate text-xs text-muted-foreground">{category.description}</span>
                            </span>
                            <ChevronRight className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                          </Link>
                        ))
                      ) : (
                        <p className="px-3 py-4 text-sm text-muted-foreground">Aucun accès connu pour cette recherche. Essayez une catégorie.</p>
                      )}
                    </div>
                  )}
                </form>
                <p className="mt-3 text-xs text-emerald-950/60 dark:text-emerald-50/60">
                  Recherchez par mot-clé, nom de service ou besoin.
                </p>
                {normalizedQuery && intent.matched ? (
                  <div className="mt-4 rounded-2xl border border-emerald-900/10 bg-background/80 p-4 shadow-sm" data-testid="practical-intent-summary">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-bold uppercase tracking-[0.16em] text-primary">Intention comprise</span>
                      <Badge variant="secondary">{intent.label}</Badge>
                    </div>
                    {intent.filters.length ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {intent.filters.map((filter) => (
                          <Badge key={filter} variant="outline" className="font-normal">
                            {practicalFilterLabel(filter, intent.budget)}
                          </Badge>
                        ))}
                      </div>
                    ) : null}
                    <p className="mt-3 text-xs leading-5 text-muted-foreground">
                      Les résultats restent ceux de la catégorie existante. Une information d’ouverture, de récence ou de disponibilité inconnue sera affichée comme inconnue et non comme positive.
                    </p>
                  </div>
                ) : normalizedQuery ? (
                  <div className="mt-4 rounded-2xl border border-amber-300/60 bg-amber-50/70 p-4 text-xs leading-5 text-amber-950 dark:bg-amber-950/30 dark:text-amber-100" data-testid="practical-unknown-search">
                    Je n’ai pas identifié de catégorie existante pour cette demande. Aucun résultat n’est inventé ; essayez une catégorie ou un lieu connu.
                  </div>
                ) : null}
              </div>

              <div className="pratique-reveal pratique-reveal-delay-2 relative hidden min-h-[300px] lg:block" aria-hidden="true">
                <div className="absolute right-0 top-0 h-72 w-72 rounded-[3rem] border border-amber-400/30 bg-amber-300/20 rotate-6" />
                <div className="absolute bottom-2 left-10 h-56 w-56 rounded-[2.5rem] border border-emerald-500/20 bg-emerald-500/10 -rotate-6" />
                <div className="absolute inset-8 flex rotate-3 items-center justify-center rounded-[2.5rem] border border-background/80 bg-background/75 p-8 shadow-2xl shadow-emerald-950/10 backdrop-blur">
                  <div className="w-full rounded-3xl border border-emerald-900/10 bg-emerald-950 p-6 text-emerald-50 shadow-xl">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-200/70">Autour de vous</span>
                      <MapPin className="h-5 w-5 text-amber-300" />
                    </div>
                    <div className="mt-8 flex items-end gap-2">
                      <span className="font-display text-5xl font-bold">8</span>
                      <span className="pb-1 text-sm text-emerald-100/70">catégories<br />à explorer</span>
                    </div>
                    <div className="mt-6 flex gap-1.5">
                      <span className="h-1.5 flex-1 rounded-full bg-rose-400" />
                      <span className="h-1.5 flex-1 rounded-full bg-amber-300" />
                      <span className="h-1.5 flex-1 rounded-full bg-emerald-400" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 pt-10 sm:px-6 md:pt-14">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Commencer maintenant</p>
              <h2 className="mt-2 font-display text-3xl font-bold tracking-tight md:text-4xl">Les accès les plus utiles</h2>
              <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">Les services recherchés au quotidien, sans détour.</p>
            </div>
            <Button variant="outline" className="w-full gap-2 rounded-xl sm:w-auto" onClick={() => navigate("/carte")} data-testid="button-open-map">
              <MapPin className="h-4 w-4" aria-hidden="true" />
              Autour de moi
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>

          <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-4 md:gap-4">
            {quickAccess.map((category) => (
              <Link
                key={`${category.href}-${category.label}`}
                href={category.href}
                className="group flex min-h-[148px] flex-col justify-between rounded-2xl border border-border/70 bg-card p-4 shadow-sm transition-transform duration-200 hover:-translate-y-1 hover:border-primary/30 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:p-5"
                data-testid={`link-quick-${category.href.slice(1)}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <CategoryIcon category={category} size="sm" />
                  <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" aria-hidden="true" />
                </div>
                <div className="mt-5">
                  <h3 className="text-sm font-bold sm:text-base">{category.label}</h3>
                  <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">{category.description}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 pt-14 sm:px-6 md:pt-20">
          <div className="rounded-[2rem] border border-emerald-900/10 bg-emerald-950 p-6 text-emerald-50 shadow-xl shadow-emerald-950/10 sm:p-8 md:flex md:items-center md:justify-between md:gap-10">
            <div className="flex items-start gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-300 text-emerald-950">
                <Compass className="h-6 w-6" aria-hidden="true" />
              </span>
              <div>
                <Badge className="border-0 bg-emerald-800 text-emerald-100">Carte BurkinaWatch</Badge>
                <h2 className="mt-3 font-display text-2xl font-bold tracking-tight sm:text-3xl">Vous ne savez pas encore quoi chercher ?</h2>
                <p className="mt-2 max-w-xl text-sm leading-6 text-emerald-100/70">Ouvrez la carte existante pour regarder autour de vous et repérer les lieux à proximité.</p>
              </div>
            </div>
            <Button onClick={() => navigate("/carte")} className="mt-6 h-12 w-full gap-2 rounded-xl bg-amber-300 text-emerald-950 hover:bg-amber-200 md:mt-0 md:w-auto" data-testid="button-explore-map">
              Explorer la carte
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-4 pt-14 sm:px-6 md:pt-20">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Tout explorer</p>
              <h2 className="mt-2 font-display text-3xl font-bold tracking-tight md:text-4xl">Toutes les catégories</h2>
            </div>
            <span className="hidden text-sm text-muted-foreground sm:block">{allCategories.length} accès disponibles</span>
          </div>
          <div className="mt-7 divide-y divide-border/70 rounded-2xl border border-border/70 bg-card">
            {allCategories.map((category) => (
              <Link
              key={`${category.href}-${category.label}`}
                href={category.href}
                className="group flex items-center gap-3 p-4 transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring sm:gap-4 sm:p-5"
                data-testid={`link-category-${category.href.slice(1)}`}
              >
                <CategoryIcon category={category} size="sm" />
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold">{category.label}</span>
                  <span className="mt-0.5 block truncate text-sm text-muted-foreground">{category.description}</span>
                </span>
                <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1" aria-hidden="true" />
              </Link>
            ))}
          </div>
        </section>
      </main>
      <BottomNav />
    </div>
  );
}