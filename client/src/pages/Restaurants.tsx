import { PlacesListPage } from "@/components/PlacesListPage";
import { UtensilsCrossed } from "lucide-react";

export default function Restaurants() {
  return (
    <PlacesListPage
      placeType="restaurant"
      title="Restaurants"
      description="Restaurants du Burkina Faso via OpenStreetMap"
      icon={<UtensilsCrossed className="h-8 w-8 text-orange-600" />}
    />
  );
}
