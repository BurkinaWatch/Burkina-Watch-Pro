import { PlacesListPage } from "@/components/PlacesListPage";
import { Utensils, Star, Soup, UtensilsCrossed } from "lucide-react";
import { Helmet } from "react-helmet-async";
import { Card, CardContent } from "@/components/ui/card";

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
        renderStats={(places) => {
          const specialized = places.filter(p => (p.tags as any)?.cuisine).length;
          const maquisCount = places.filter(p => 
            p.name.toLowerCase().includes('maquis') || 
            (p.tags as any)?.amenity === 'bar' ||
            (p.tags as any)?.cuisine === 'bar'
          ).length;

          return (
            <>
              <Card className="hover-elevate transition-all border-amber-100 dark:border-amber-900">
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
              <Card className="hover-elevate transition-all border-orange-100 dark:border-orange-900">
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                      <UtensilsCrossed className="h-5 w-5 text-orange-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{maquisCount}</p>
                      <p className="text-xs text-muted-foreground">Maquis/Bars</p>
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
