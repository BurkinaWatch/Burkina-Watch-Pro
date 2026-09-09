import { useState } from "react";
import { PlacesListPage } from "@/components/PlacesListPage";
import { Utensils, Star, Soup, Beer, Coffee, Store, Wine, Building2, MapPin } from "lucide-react";
import { Helmet } from "react-helmet-async";
import { Card, CardContent } from "@/components/ui/card";

export default function Restaurants() {
  const [selectedType, setSelectedType] = useState<string>("all");

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
        hideDefaultStats={true}
        searchTerm={selectedType !== "all" ? selectedType : undefined}
        renderStats={(places) => {
          const villesCount = new Set(places.map(p => p.ville || (p.tags as any)?.city || "")).size;
          const maquisCount = places.filter(p => {
            const name = p.name.toLowerCase();
            const tags = p.tags as any || {};
            return name.includes('maquis') || 
                   name.includes('bar') || 
                   name.includes('cave') ||
                   name.includes('vin') ||
                   tags.amenity === 'bar' || 
                   tags.cuisine === 'bar' ||
                   tags.amenity === 'pub' ||
                   tags.shop === 'wine' ||
                   tags.shop === 'alcohol';
          }).length;
          
          const cafeKiosqueCount = places.filter(p => {
            const tags = p.tags as any || {};
            const name = p.name.toLowerCase();
            return tags.amenity === 'cafe' || 
                   tags.cuisine === 'coffee_shop' || 
                   tags.amenity === 'kiosk' ||
                   name.includes('café') ||
                   name.includes('kiosque');
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
                className={`hover-elevate transition-all border-blue-100 dark:border-blue-900 cursor-pointer flex-1 min-w-[140px] ${selectedType === "café" ? "ring-2 ring-blue-500" : ""}`}
                onClick={() => setSelectedType("café")}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg shrink-0">
                      <Coffee className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-2xl font-bold truncate">{cafeKiosqueCount}</p>
                      <p className="text-xs text-muted-foreground truncate">Café & Kiosque</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card 
                className="hover-elevate transition-all border-green-100 dark:border-green-900 flex-1 min-w-[140px]"
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg shrink-0">
                      <MapPin className="h-5 w-5 text-green-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-2xl font-bold truncate">{villesCount}</p>
                      <p className="text-xs text-muted-foreground truncate">Villes</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card 
                className={`hover-elevate transition-all border-orange-100 dark:border-orange-900 cursor-pointer flex-1 min-w-[140px] ${selectedType === "maquis" ? "ring-2 ring-orange-500" : ""}`}
                onClick={() => setSelectedType("maquis")}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg shrink-0">
                      <Beer className="h-5 w-5 text-orange-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-2xl font-bold truncate">{maquisCount}</p>
                      <p className="text-xs text-muted-foreground truncate">Maquis, Bar & Cave</p>
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
