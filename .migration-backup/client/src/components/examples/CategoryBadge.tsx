import CategoryBadge from "../CategoryBadge";

export default function CategoryBadgeExample() {
  return (
    <div className="flex flex-wrap gap-2 p-4">
      <CategoryBadge categorie="urgence" />
      <CategoryBadge categorie="securite" />
      <CategoryBadge categorie="sante" />
      <CategoryBadge categorie="environnement" />
      <CategoryBadge categorie="corruption" />
      <CategoryBadge categorie="infrastructure" />
    </div>
  );
}
