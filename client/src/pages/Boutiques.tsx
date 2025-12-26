import { PlacesListPage } from "@/components/PlacesListPage";
import { ShoppingBag } from "lucide-react";

export default function Boutiques() {
  return (
    <PlacesListPage
      placeType="shop"
      title="Boutiques"
      description="Découvrez les boutiques vérifiées par la communauté"
      icon={<ShoppingBag className="h-8 w-8 text-purple-600" />}
    />
  );
}
