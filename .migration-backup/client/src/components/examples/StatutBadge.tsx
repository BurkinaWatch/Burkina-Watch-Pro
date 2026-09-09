import StatutBadge from "../StatutBadge";

export default function StatutBadgeExample() {
  return (
    <div className="flex flex-wrap gap-2 p-4">
      <StatutBadge statut="en_attente" />
      <StatutBadge statut="en_cours" />
      <StatutBadge statut="resolu" />
      <StatutBadge statut="rejete" />
    </div>
  );
}
