import { PlacesListPage } from "@/components/PlacesListPage";
import { Cross } from "lucide-react";

export default function PharmaciesOSM() {
  return (
    <PlacesListPage
      placeType="pharmacy"
      title="Pharmacies"
      description="Trouvez les pharmacies vérifiées par la communauté"
      icon={<Cross className="h-8 w-8 text-green-600" />}
    />
  );
}
