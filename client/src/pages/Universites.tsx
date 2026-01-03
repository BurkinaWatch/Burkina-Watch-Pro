import { PlacesListPage } from "@/components/PlacesListPage";
import { GraduationCap } from "lucide-react";
import { Helmet } from "react-helmet-async";

export default function Universites() {
  return (
    <>
      <Helmet>
        <title>Universités et Instituts Supérieurs - Burkina Faso | Burkina Watch</title>
        <meta name="description" content="Liste des universités publiques, privées et instituts d'enseignement supérieur au Burkina Faso avec filières et contacts." />
      </Helmet>
      <PlacesListPage
        placeType="university"
        title="Universités"
        description="Universités, Instituts et Grandes Écoles"
        icon={<GraduationCap className="h-8 w-8 text-blue-600" />}
      />
    </>
  );
}
