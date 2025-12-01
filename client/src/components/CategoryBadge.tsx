import { Badge } from "@/components/ui/badge";
import type { Categorie } from "@shared/schema";

const categorieConfig: Record<Categorie, { label: string; color: string }> = {
  urgence: { label: "Urgence", color: "bg-category-urgence text-white" },
  securite: { label: "Sécurité", color: "bg-category-securite text-white" },
  sante: { label: "Santé", color: "bg-category-sante text-gray-900" },
  environnement: { label: "Environnement", color: "bg-category-environnement text-white" },
  corruption: { label: "Corruption", color: "bg-category-corruption text-white" },
  infrastructure: { label: "Infrastructure", color: "bg-gray-600 text-white" },
  personne_recherchee: { label: "Personne recherchée", color: "bg-amber-600 text-white" },
};

interface CategoryBadgeProps {
  categorie: Categorie | string;
  className?: string;
}

export default function CategoryBadge({ categorie, className = "" }: CategoryBadgeProps) {
  const config = categorieConfig[categorie as Categorie] || {
    label: String(categorie || "Non classé"),
    color: "bg-muted text-muted-foreground"
  };
  
  return (
    <Badge className={`${config.color} ${className} no-default-hover-elevate no-default-active-elevate`}>
      {config.label}
    </Badge>
  );
}
