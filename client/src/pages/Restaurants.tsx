import { useState } from "react";
import { PlacesListPage } from "@/components/PlacesListPage";
import { Utensils, Star, Soup, Beer, Coffee, Store, Wine, Building2 } from "lucide-react";
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
          const specialized = places.filter(p => (p.tags as any)?.cuisine).length;
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
            <>
              <Card 
                className={`hover-elevate transition-all border-primary/10 cursor-pointer ${selectedType === "all" ? "ring-2 ring-primary" : ""}`}
                onClick={() => setSelectedType("all")}
              >
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Building2 className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{places.length}</p>
                      <p className="text-xs text-muted-foreground">Total</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card 
                className={`hover-elevate transition-all border-blue-100 dark:border-blue-900 cursor-pointer ${selectedType === "café" ? "ring-2 ring-blue-500" : ""}`}
                onClick={() => setSelectedType("café")}
              >
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                      <Coffee className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{cafeKiosqueCount}</p>
                      <p className="text-xs text-muted-foreground">Café & Kiosque</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card 
                className={`hover-elevate transition-all border-amber-100 dark:border-amber-900 cursor-pointer ${selectedType === "specialité" ? "ring-2 ring-amber-500" : ""}`}
                onClick={() => setSelectedType("specialité")}
              >
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                      <Soup className="h-5 w-5 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{specialized}</p>
                      <p className="text-xs text-muted-foreground">Spécialités</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card 
                className={`hover-elevate transition-all border-orange-100 dark:border-orange-900 cursor-pointer ${selectedType === "maquis" ? "ring-2 ring-orange-500" : ""}`}
                onClick={() => setSelectedType("maquis")}
              >
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                      <Beer className="h-5 w-5 text-orange-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{maquisCount}</p>
                      <p className="text-xs text-muted-foreground">Maquis, Bar & Cave</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          );
        }}
      />
    </>
  );
}
