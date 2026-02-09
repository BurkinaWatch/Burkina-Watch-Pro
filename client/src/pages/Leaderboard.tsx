
import { useQuery } from "@tanstack/react-query";
import { Helmet } from "react-helmet-async";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LevelBadge } from "@/components/LevelBadge";
import { useTranslation } from "react-i18next";
import { Trophy, Medal, Award, ArrowLeft } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

interface LeaderboardUser {
  id: string;
  name: string;
  avatar?: string;
  userPoints: number;
  userLevel: string;
}

export default function Leaderboard() {
  const { t } = useTranslation();
  const [, setLocation] = useLocation();
  
  const { data: topUsers = [], isLoading } = useQuery<LeaderboardUser[]>({
    queryKey: ["/api/leaderboard"],
  });
  
  const getRankIcon = (index: number) => {
    if (index === 0) return <Trophy className="w-6 h-6 text-yellow-500" />;
    if (index === 1) return <Medal className="w-6 h-6 text-gray-400" />;
    if (index === 2) return <Award className="w-6 h-6 text-amber-700" />;
    return <span className="w-6 h-6 flex items-center justify-center font-bold">{index + 1}</span>;
  };
  
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">{t('common.loading')}</div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Helmet>
        <title>Classement - Burkina Watch</title>
      </Helmet>
      <div className="mb-4">
        <Button
          variant="ghost"
          onClick={() => setLocation("/")}
          className="gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          {t('common.back') || 'Retour'}
        </Button>
      </div>
      
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold mb-2">{t('leaderboard.title')}</h1>
        <p className="text-muted-foreground">{t('leaderboard.subtitle')}</p>
      </div>
      
      <Card>
        <CardHeader className="bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 text-white">
          <CardTitle className="text-center text-2xl">
            🇧🇫 {t('leaderboard.national')} 🇧🇫
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {topUsers.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Trophy className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p className="text-lg font-medium">Aucun citoyen classé pour le moment</p>
              <p className="text-sm mt-2">Soyez le premier à gagner des points en signalant des incidents !</p>
            </div>
          ) : (
          <div className="divide-y">
            {topUsers.map((user, index) => (
              <div
                key={user.id}
                className={`flex items-center gap-4 p-4 hover:bg-accent/50 transition-colors ${
                  index < 3 ? 'bg-accent/20' : ''
                }`}
              >
                <div className="flex-shrink-0 w-12 flex justify-center">
                  {getRankIcon(index)}
                </div>
                
                <Avatar className="w-12 h-12">
                  <AvatarImage src={user.avatar} />
                  <AvatarFallback>
                    {user.name?.charAt(0).toUpperCase() || "?"}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{user.name || t('common.anonymous')}</p>
                  <div className="mt-1">
                    <LevelBadge level={user.userLevel} size="sm" showTitle={false} />
                  </div>
                </div>
                
                <div className="text-right">
                  <p className="text-2xl font-bold text-primary">{user.userPoints}</p>
                  <p className="text-xs text-muted-foreground">{t('leaderboard.points')}</p>
                </div>
              </div>
            ))}
          </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
