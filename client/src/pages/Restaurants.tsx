import { PlacesListPage } from "@/components/PlacesListPage";
import { Utensils } from "lucide-react";
import { Helmet } from "react-helmet-async";

export default function Restaurants() {
  return (
    <>
      <Helmet>
        <title>Restaurants et Maquis - Burkina Faso | Burkina Watch</title>
        <meta name="description" content="Découvrez les meilleurs restaurants, maquis et cafés au Burkina Faso avec localisation et spécialités." />
      </Helmet>
      <PlacesListPage
        placeType="restaurant"
        title="Restaurants"
        description="Restaurants, Maquis et Cafés"
        icon={<Utensils className="h-8 w-8 text-amber-600" />}
      />
    </>
  );
}
