import { Cross } from "lucide-react";
import { PlacesListPage } from "@/components/PlacesListPage";
import { useTranslation } from "react-i18next";

export default function Pharmacies() {
  const { t } = useTranslation();
  
  return (
    <PlacesListPage
      placeType="pharmacy"
      title={t("nav.pharmacies") || "Pharmacies"}
      description="Pharmacies du Burkina Faso via OpenStreetMap"
      icon={<Cross className="h-8 w-8 text-red-500" />}
    />
  );
}
