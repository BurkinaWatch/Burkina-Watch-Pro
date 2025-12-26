import { PlacesListPage } from "@/components/PlacesListPage";
import { Store } from "lucide-react";

export default function Marches() {
  return (
    <PlacesListPage
      placeType="marketplace"
      title="Marchés"
      description="Marchés du Burkina Faso via OpenStreetMap"
      icon={<Store className="h-8 w-8 text-amber-600" />}
    />
  );
}
