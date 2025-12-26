import { PlacesListPage } from "@/components/PlacesListPage";
import { Store } from "lucide-react";

export default function Marches() {
  return (
    <PlacesListPage
      placeType="marketplace"
      title="Marchés"
      description="Trouvez les marchés vérifiés par la communauté"
      icon={<Store className="h-8 w-8 text-amber-600" />}
    />
  );
}
