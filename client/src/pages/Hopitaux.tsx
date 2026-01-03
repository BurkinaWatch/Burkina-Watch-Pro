import { PlacesListPage } from "@/components/PlacesListPage";
import { Hospital } from "lucide-react";
import { Helmet } from "react-helmet-async";

export default function Hopitaux() {
  return (
    <>
      <Helmet>
        <title>Hôpitaux et Centres de Santé - Burkina Faso | Burkina Watch</title>
        <meta name="description" content="Liste complète des hôpitaux, CMA, Centres de Santé et Cliniques au Burkina Faso avec localisation et contacts." />
      </Helmet>
      <PlacesListPage
        placeType="hospital"
        title="Hôpitaux et Santé"
        description="Hôpitaux, CMA, CSPS et Cliniques"
        icon={<Hospital className="h-8 w-8 text-red-600" />}
      />
    </>
  );
}
