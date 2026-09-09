import { useState } from "react";
import { PlacesListPage } from "@/components/PlacesListPage";
import { Hotel, Building2, Bed, Home as HomeIcon } from "lucide-react";
import { Helmet } from "react-helmet-async";
import { Card, CardContent } from "@/components/ui/card";

export default function Hotels() {
  const [selectedType, setSelectedType] = useState<string>("all");

  return (
    <>
      <Helmet>
        <title>Hôtels et Auberges - Burkina Faso | Burkina Watch</title>
        <meta name="description" content="Découvrez les hôtels et auberges au Burkina Faso avec localisation et services." />
      </Helmet>
      <PlacesListPage
        placeType="hotel"
        title="Hôtels et Auberges"
        description="Hôtels, Auberges et Hébergements"
        icon={<Hotel className="h-8 w-8 text-blue-600" />}
        hideDefaultStats={true}
        searchTerm={selectedType !== "all" ? selectedType : undefined}
        renderStats={(places) => {
          const hotelCount = places.filter(p => {
            const tags = p.tags as any || {};
            const name = p.name.toLowerCase();
            return tags.tourism === 'hotel' || name.includes('hôtel') || name.includes('hotel');
          }).length;

          const aubergeCount = places.filter(p => {
            const tags = p.tags as any || {};
            const name = p.name.toLowerCase();
            return tags.tourism === 'guest_house' || tags.tourism === 'hostel' || name.includes('auberge');
          }).length;

          const resCount = places.filter(p => {
            const name = p.name.toLowerCase();
            return name.includes('résidence') || name.includes('residence');
          }).length;

          return (
            <div className="flex flex-wrap gap-4 mb-6">
              <Card 
                className={`hover-elevate transition-all border-primary/10 cursor-pointer flex-1 min-w-[140px] ${selectedType === "all" ? "ring-2 ring-primary" : ""}`}
                onClick={() => setSelectedType("all")}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-primary/10 rounded-lg shrink-0">
                      <Building2 className="h-5 w-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-2xl font-bold truncate">{places.length}</p>
                      <p className="text-xs text-muted-foreground truncate">Total</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card 
                className={`hover-elevate transition-all border-blue-100 dark:border-blue-900 cursor-pointer flex-1 min-w-[140px] ${selectedType === "hôtel" ? "ring-2 ring-blue-500" : ""}`}
                onClick={() => setSelectedType("hôtel")}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg shrink-0">
                      <Hotel className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-2xl font-bold truncate">{hotelCount}</p>
                      <p className="text-xs text-muted-foreground truncate">Hôtels</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card 
                className={`hover-elevate transition-all border-green-100 dark:border-green-900 cursor-pointer flex-1 min-w-[140px] ${selectedType === "auberge" ? "ring-2 ring-green-500" : ""}`}
                onClick={() => setSelectedType("auberge")}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg shrink-0">
                      <Bed className="h-5 w-5 text-green-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-2xl font-bold truncate">{aubergeCount}</p>
                      <p className="text-xs text-muted-foreground truncate">Auberges</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card 
                className={`hover-elevate transition-all border-purple-100 dark:border-purple-900 cursor-pointer flex-1 min-w-[140px] ${selectedType === "résidence" ? "ring-2 ring-purple-500" : ""}`}
                onClick={() => setSelectedType("résidence")}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg shrink-0">
                      <HomeIcon className="h-5 w-5 text-purple-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-2xl font-bold truncate">{resCount}</p>
                      <p className="text-xs text-muted-foreground truncate">Résidences</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          );
        }}
      />
    </>
  );
}
