import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MessageCircle, Send, Loader2 } from "lucide-react";
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import ModerationDialog from "./ModerationDialog";
import { useTranslation } from "react-i18next";

interface CommentDialogProps {
  signalementId: string;
  commentCount: number;
}

interface Commentaire {
  id: string;
  contenu: string;
  auteur: string | null;
  createdAt: string;
}

export default function CommentDialog({ signalementId, commentCount }: CommentDialogProps) {
  const [open, setOpen] = useState(false);
  const [newComment, setNewComment] = useState("");
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();
  const [moderationOpen, setModerationOpen] = useState(false);
  const [moderationData, setModerationData] = useState<any>(null);
  const { t, i18n } = useTranslation();

  const { data: comments = [], isLoading } = useQuery<Commentaire[]>({
    queryKey: ["/api/signalements", signalementId, "commentaires"],
    enabled: open,
  });

  const createCommentMutation = useMutation({
    mutationFn: async (contenu: string) => {
      const res = await apiRequest("POST", "/api/commentaires", {
        signalementId,
        contenu,
        auteur: user?.firstName && user?.lastName 
          ? `${user.firstName} ${user.lastName}` 
          : user?.email || "Utilisateur",
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ["/api/signalements", signalementId, "commentaires"] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ["/api/signalements"] 
      });
      setNewComment("");
      toast({
        title: "Commentaire ajouté",
        description: "Votre commentaire a été publié avec succès.",
      });
    },
    onError: (error: any) => {
      if (error?.error === "content_moderated") {
        setModerationData(error);
        setModerationOpen(true);
        return;
      }
      toast({
        title: "Erreur",
        description: error?.message || "Impossible d'ajouter le commentaire",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = () => {
    if (!newComment.trim()) {
      toast({
        title: "Commentaire vide",
        description: "Veuillez écrire un commentaire",
        variant: "destructive",
      });
      return;
    }

    if (!isAuthenticated) {
      toast({
        title: "Connexion requise",
        description: "Vous devez être connecté pour commenter",
        variant: "destructive",
      });
      window.location.href = "/connexion";
      return;
    }

    createCommentMutation.mutate(newComment);
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <>
      <ModerationDialog
        open={moderationOpen}
        severity={moderationData?.severity || "warning"}
        flaggedWords={moderationData?.flaggedWords || []}
        reason={moderationData?.reason}
        suggestion={moderationData?.suggestion}
        onTryAgain={() => {
          setModerationOpen(false);
          setModerationData(null);
        }}
        onCancel={() => {
          setModerationOpen(false);
          setModerationData(null);
          setNewComment("");
        }}
      />
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="flex items-center gap-1"
          data-testid="button-comment-dialog"
        >
          <MessageCircle className="w-4 h-4" />
          <span className="text-xs">{commentCount}</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Commentaires</DialogTitle>
          <DialogDescription>
            {commentCount} {commentCount > 1 ? "commentaires" : "commentaire"}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 py-4">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Aucun commentaire pour le moment. Soyez le premier à commenter !
            </div>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="flex gap-3">
                <Avatar className="w-8 h-8">
                  <AvatarFallback className="text-xs">
                    {getInitials(comment.auteur || "U")}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="bg-muted rounded-lg p-3">
                    <p className="font-semibold text-sm mb-1">
                      {comment.auteur || "Utilisateur"}
                    </p>
                    <p className="text-sm">{comment.contenu}</p>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 ml-3">
                    {formatDistanceToNow(new Date(comment.createdAt), {
                      addSuffix: true,
                      locale: fr,
                    })}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="border-t pt-4 mt-4">
          <div className="flex gap-2">
            <Textarea
              placeholder="Écrivez votre commentaire..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="resize-none min-h-[80px]"
              data-testid="textarea-comment"
            />
          </div>
          <div className="flex justify-end mt-2">
            <Button
              onClick={handleSubmit}
              disabled={createCommentMutation.isPending || !newComment.trim()}
              data-testid="button-submit-comment"
            >
              {createCommentMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Envoi...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Commenter
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
      </Dialog>
    </>
  );
}
