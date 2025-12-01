import { Button } from "@/components/ui/button";
import type { Categorie } from "@shared/schema";
import { useState } from "react";
import { useTranslation } from 'react-i18next';

interface FilterChipsProps {
  onFilterChange?: (filter: Categorie | "tous") => void;
}

const FilterChips = ({ onFilterChange }: FilterChipsProps) => {
  const { t } = useTranslation();
  const [selected, setSelected] = useState<Categorie | "tous">("tous");

  const categories: { value: Categorie | "tous"; label: string }[] = [
    { value: "tous", label: t('common.all') || "Tous" },
    { value: "urgence", label: t('report.categories.urgence') || "Urgence" },
    { value: "securite", label: t('report.categories.securite') || "Sécurité" },
    { value: "sante", label: t('report.categories.sante') || "Santé" },
    { value: "environnement", label: t('report.categories.environnement') || "Environnement" },
    { value: "corruption", label: t('report.categories.corruption') || "Corruption" },
    { value: "infrastructure", label: t('report.categories.infrastructure') || "Infrastructure" },
    { value: "personne_recherchee", label: t('report.categories.personne_recherchee') || "Personne recherchée" },
  ];

  const handleSelect = (value: Categorie | "tous") => {
    setSelected(value);
    onFilterChange?.(value);
    console.log("Filter changed to:", value);
  };

  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
      {categories.map((category) => (
        <Button
          key={category.value}
          variant={selected === category.value ? "default" : "outline"}
          size="sm"
          onClick={() => handleSelect(category.value)}
          className="whitespace-nowrap toggle-elevate"
          data-testid={`filter-${category.value}`}
        >
          {category.label}
        </Button>
      ))}
    </div>
  );
};

export default FilterChips;
