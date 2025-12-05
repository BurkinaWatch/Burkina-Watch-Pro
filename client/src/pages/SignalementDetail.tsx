import { Helmet } from "react-helmet-async";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Loader2, MapPin, Calendar, User, ArrowLeft, ZoomIn, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import CategoryBadge from "@/components/CategoryBadge";
import StatutBadge from "@/components/StatutBadge";
import CommentDialog from "@/components/CommentDialog";
import type { Signalement, Categorie, Statut } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { useState } from "react";

export default function SignalementDetail() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [isImageDialogOpen, setIsImageDialogOpen] = useState(false);

  const { data: signalement, isLoading } = useQuery<Signalement>({
    queryKey: [`/api/signalements/${id}`],
    queryFn: async () => {
      const res = await fetch(`/api/signalements/${id}`);
      if (!res.ok) throw new Error("Signalement non trouvé");
      return res.json();
    },
    staleTime: 2 * 60 * 1000,
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <Header />
        <div className="flex justify-center items-center h-[calc(100vh-4rem)]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
        <BottomNav />
      </div>
    );
  }

  if (!signalement) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <Header />
        <div className="max-w-4xl mx-auto px-4 py-6">
          <p className="text-center text-muted-foreground">Signalement non trouvé</p>
        </div>
        <BottomNav />
      </div>
    );
  }

  const pageUrl = `https://${window.location.host}/signalement/${id}`;
  const pageTitle = `${signalement.titre} | Burkina Watch`;
  const pageDescription = signalement.description.substring(0, 160);

  return (
    <>
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        
        <meta property="og:type" content="article" />
        <meta property="og:url" content={pageUrl} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        {signalement.photo && <meta property="og:image" content={signalement.photo} />}
        
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content={pageUrl} />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={pageDescription} />
        {signalement.photo && <meta name="twitter:image" content={signalement.photo} />}
      </Helmet>

      <div className="min-h-screen bg-background pb-24">
        <Header />

      <div className="max-w-4xl mx-auto px-4 py-6">
        <Button
          variant="ghost"
          onClick={() => setLocation("/feed")}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour
        </Button>

        <Card>
          {(() => {
            const displayMedias = signalement.medias && signalement.medias.length > 0 
              ? signalement.medias 
              : (signalement.photo ? [signalement.photo] : []);
            
            if (displayMedias.length > 0) {
              return (
                <div className="relative w-full h-96">
                  {displayMedias.length === 1 ? (
                    displayMedias[0].startsWith('data:video/') ? (
                      <video
                        src={displayMedias[0]}
                        className="w-full h-full object-cover"
                        controls
                      />
                    ) : (
                      <div className="relative w-full h-full group cursor-pointer">
                        <img
                          src={displayMedias[0]}
                          alt={signalement.titre}
                          className="w-full h-full object-cover"
                          loading="lazy"
                          onClick={() => {
                            setSelectedImageIndex(0);
                            setIsImageDialogOpen(true);
                          }}
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center">
                          <ZoomIn className="w-12 h-12 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </div>
                    )
                  ) : (
                    <div className="relative w-full h-full overflow-x-auto flex gap-1 snap-x snap-mandatory">
                      {displayMedias.map((media, index) => (
                        <div key={index} className="flex-shrink-0 w-full h-full snap-center">
                          {media.startsWith('data:video/') ? (
                            <video
                              src={media}
                              className="w-full h-full object-cover"
                              controls
                            />
                          ) : (
                            <div className="relative w-full h-full group cursor-pointer">
                              <img
                                src={media}
                                alt={`${signalement.titre} - ${index + 1}`}
                                className="w-full h-full object-cover"
                                loading="lazy"
                                onClick={() => {
                                  setSelectedImageIndex(index);
                                  setIsImageDialogOpen(true);
                                }}
                              />
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center">
                                <ZoomIn className="w-12 h-12 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            }
            return null;
          })()}

          <CardContent className="p-6">
            <div className="flex gap-2 mb-4">
              <CategoryBadge categorie={signalement.categorie as Categorie} />
              <StatutBadge statut={(signalement.statut || "en_attente") as Statut} />
            </div>

            <h1 className="text-3xl font-bold mb-4">{signalement.titre}</h1>

            <p className="text-lg text-muted-foreground mb-6 whitespace-pre-wrap">
              {signalement.description}
            </p>

            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="w-4 h-4" />
                <span>{signalement.localisation || "Localisation inconnue"}</span>
              </div>

              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="w-4 h-4" />
                <span>
                  {formatDistanceToNow(new Date(signalement.createdAt!), {
                    addSuffix: true,
                    locale: fr,
                  })}
                </span>
              </div>

              {signalement.userId && !signalement.isAnonymous && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <User className="w-4 h-4" />
                  <span>Publié par un citoyen</span>
                </div>
              )}
            </div>

            <div className="border-t pt-4">
              <CommentDialog
                signalementId={signalement.id}
                commentCount={signalement.commentairesCount || 0}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <BottomNav />
    </div>

    {/* Dialogue de zoom d'image */}
    <Dialog open={isImageDialogOpen} onOpenChange={setIsImageDialogOpen}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] w-auto h-auto p-0 bg-black/95">
        <div className="relative w-full h-full flex items-center justify-center">
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 z-50 text-white hover:bg-white/20"
            onClick={() => setIsImageDialogOpen(false)}
          >
            <X className="w-6 h-6" />
          </Button>
          
          {selectedImageIndex !== null && (() => {
            const displayMedias = signalement?.medias && signalement.medias.length > 0 
              ? signalement.medias 
              : (signalement?.photo ? [signalement.photo] : []);
            
            const selectedMedia = displayMedias[selectedImageIndex];
            
            if (!selectedMedia) return null;
            
            return selectedMedia.startsWith('data:video/') ? (
              <video
                src={selectedMedia}
                className="max-w-full max-h-[90vh] object-contain"
                controls
                autoPlay
              />
            ) : (
              <img
                src={selectedMedia}
                alt={`Image ${selectedImageIndex + 1}`}
                className="max-w-full max-h-[90vh] object-contain cursor-zoom-in"
                style={{ imageRendering: 'high-quality' }}
                onClick={(e) => {
                  const img = e.currentTarget;
                  if (img.style.transform === 'scale(2)') {
                    img.style.transform = 'scale(1)';
                    img.style.cursor = 'zoom-in';
                  } else {
                    img.style.transform = 'scale(2)';
                    img.style.cursor = 'zoom-out';
                  }
                }}
              />
            );
          })()}
          
          {/* Navigation entre les images */}
          {signalement && (() => {
            const displayMedias = signalement.medias && signalement.medias.length > 0 
              ? signalement.medias 
              : (signalement.photo ? [signalement.photo] : []);
            
            if (displayMedias.length > 1) {
              return (
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2 bg-black/50 p-2 rounded-lg">
                  {displayMedias.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImageIndex(index)}
                      className={`w-3 h-3 rounded-full transition-all ${
                        index === selectedImageIndex ? 'bg-white scale-125' : 'bg-white/50'
                      }`}
                    />
                  ))}
                </div>
              );
            }
            return null;
          })()}
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
}