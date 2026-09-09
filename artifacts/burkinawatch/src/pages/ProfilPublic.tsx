
import { Helmet } from "react-helmet-async";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, MapPin, Briefcase, Mail, Calendar } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useRoute } from "wouter";
import type { User, Signalement } from "@shared/schema";
import SignalementCard from "@/components/SignalementCard";

export default function ProfilPublic() {
  const [, params] = useRoute("/profil/:userId");
  const userId = params?.userId;

  const { data: user, isLoading: userLoading } = useQuery<User>({
    queryKey: [`/api/users/${userId}`],
    enabled: !!userId,
  });

  const { data: userSignalements = [], isLoading: signalementsLoading } = useQuery<Signalement[]>({
    queryKey: [`/api/users/${userId}/signalements`],
    enabled: !!userId,
  });

  if (userLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <Header />
        <div className="max-w-4xl mx-auto px-4 py-6">
          <p className="text-center text-muted-foreground">Utilisateur non trouvé</p>
        </div>
        <BottomNav />
      </div>
    );
  }

  const getInitials = () => {
    const first = user.firstName?.[0] || "";
    const last = user.lastName?.[0] || "";
    return (first + last).toUpperCase() || "U";
  };

  const calculateUserStats = () => {
    const validatedCount = userSignalements.filter(s => s.statut === 'resolu').length;
    const totalSignalements = userSignalements.length;
    const points = (validatedCount * 10) + (totalSignalements * 5);
    
    let badge = { icon: "🟢", label: "Citoyen Actif", color: "bg-green-100 text-green-800 border-green-300" };
    
    if (points >= 200) {
      badge = { icon: "🔴", label: "Ambassadeur Local", color: "bg-red-100 text-red-800 border-red-300" };
    } else if (points >= 100) {
      badge = { icon: "🟡", label: "Reporter Fiable", color: "bg-yellow-100 text-yellow-800 border-yellow-300" };
    } else if (points >= 50) {
      badge = { icon: "🔵", label: "Veilleur Régional", color: "bg-blue-100 text-blue-800 border-blue-300" };
    }
    
    return { points, badge };
  };

  const { points, badge } = calculateUserStats();

  return (
    <div className="min-h-screen bg-background pb-24">
      <Helmet>
        <title>Profil Public - Burkina Watch</title>
      </Helmet>
      <Header />

      <div className="max-w-4xl mx-auto px-4 py-6">
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-start gap-6">
              <div className="relative">
                <Avatar className="w-32 h-32">
                  <AvatarImage src={user.profileImageUrl || undefined} style={{ objectFit: "cover" }} />
                  <AvatarFallback className="text-2xl">{getInitials()}</AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-2 -right-2 text-4xl" title={badge.label}>
                  {badge.icon}
                </div>
              </div>

              <div className="flex-1">
                <h2 className="text-2xl font-bold mb-1">
                  {user.firstName || user.lastName
                    ? `${user.firstName || ""} ${user.lastName || ""}`.trim()
                    : "Utilisateur"}
                </h2>
                
                {user.ville && (
                  <div className="flex items-center gap-2 mb-2 text-muted-foreground">
                    <MapPin className="w-4 h-4" />
                    <span className="text-sm">{user.ville}</span>
                  </div>
                )}

                {user.metier && (
                  <div className="flex items-center gap-2 mb-2 text-muted-foreground">
                    <Briefcase className="w-4 h-4" />
                    <span className="text-sm">{user.metier}</span>
                  </div>
                )}

                {user.bio && (
                  <p className="text-sm mt-4">{user.bio}</p>
                )}
                
                <div className="mt-4 p-3 bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg border border-primary/20">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-3xl">{badge.icon}</span>
                    <div className="flex-1">
                      <Badge className={`${badge.color} border`}>
                        {badge.label}
                      </Badge>
                      <p className="text-sm text-muted-foreground mt-1">
                        <span className="font-bold text-primary">{points} points</span> au total
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Publications ({userSignalements.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {signalementsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : userSignalements.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>Aucune publication pour le moment.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {userSignalements.map((signalement) => (
                  <SignalementCard 
                    key={signalement.id} 
                    {...signalement}
                    createdAt={new Date(signalement.createdAt!)}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <BottomNav />
    </div>
  );
}
