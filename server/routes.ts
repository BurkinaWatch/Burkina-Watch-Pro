// ============================================
// IMPORTS
// ============================================
import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertSignalementSchema, updateSignalementSchema, insertCommentaireSchema, updateUserProfileSchema, insertLocationPointSchema, insertEmergencyContactSchema, insertChatMessageSchema } from "@shared/schema";
import { fromZodError } from "zod-validation-error";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { reverseGeocode } from "./geocoding";
import { sendLocationEmail } from "./resend";
import OpenAI from "openai";
import { verifySignalement } from "./aiVerification";
import { moderateContent, logModerationAction } from "./contentModeration";
import { signalementMutationLimiter } from "./securityHardening";

// ============================================
// ENREGISTREMENT DES ROUTES
// ============================================
export async function registerRoutes(app: Express): Promise<Server> {
  await setupAuth(app);

  // ----------------------------------------
  // ROUTES D'AUTHENTIFICATION
  // ----------------------------------------
  app.get("/api/auth/user", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  app.patch("/api/auth/user", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validationResult = updateUserProfileSchema.safeParse(req.body);

      if (!validationResult.success) {
        const errorMessage = fromZodError(validationResult.error).toString();
        return res.status(400).json({ error: errorMessage });
      }

      const user = await storage.updateUserProfile(userId, validationResult.data);

      if (!user) {
        return res.status(404).json({ error: "Utilisateur non trouvé" });
      }

      res.json(user);
    } catch (error) {
      console.error("Error updating user profile:", error);
      res.status(500).json({ error: "Erreur lors de la mise à jour du profil" });
    }
  });

  // Get leaderboard
  app.get("/api/leaderboard", async (req, res) => {
    try {
      const topUsers = await storage.getTopUsersByPoints(50);
      res.json(topUsers);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Sync user points based on signalements
  app.post("/api/auth/user/sync-points", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const result = await storage.syncUserPointsFromSignalements(userId);
      res.json(result);
    } catch (error: any) {
      console.error("Error syncing user points:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Award points to user
  app.post("/api/users/:userId/award-points", isAuthenticated, async (req: any, res) => {
    try {
      const { userId } = req.params;
      const { points, reason } = req.body;

      // Only allow awarding points to self or if admin
      const user = await storage.getUser(req.user.claims.sub);
      if (userId !== req.user.claims.sub && user?.role !== "admin") {
        return res.status(403).json({ error: "Non autorisé" });
      }

      const updatedUser = await storage.awardPointsToUser(userId, points);
      res.json(updatedUser);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ----------------------------------------
  // ROUTES STATISTIQUES
  // ----------------------------------------
  app.get("/api/stats", async (req, res) => {
    try {
      const stats = await storage.getStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching stats:", error);
      res.status(500).json({ error: "Erreur lors de la récupération des statistiques" });
    }
  });

  // ----------------------------------------
  // ROUTES SIGNALEMENTS
  // ----------------------------------------
  app.get("/api/signalements", async (req, res) => {
    try {
      const { categorie, statut, isSOS, limit } = req.query;

      const signalements = await storage.getSignalements({
        categorie: categorie as string | undefined,
        statut: statut as string | undefined,
        isSOS: isSOS === "true" ? true : isSOS === "false" ? false : undefined,
        limit: limit ? parseInt(limit as string) : 50, // Limite par défaut de 50 pour réduire la charge
      });

      // Ajouter les headers de cache
      res.set('Cache-Control', 'public, max-age=300'); // Cache 5 minutes
      res.json(signalements);
    } catch (error) {
      console.error("Error fetching signalements:", error);
      res.status(500).json({ error: "Erreur lors de la récupération des signalements" });
    }
  });

  app.get("/api/signalements/:id", async (req, res) => {
    try {
      const signalement = await storage.getSignalement(req.params.id);

      if (!signalement) {
        return res.status(404).json({ error: "Signalement non trouvé" });
      }

      res.json(signalement);
    } catch (error) {
      console.error("Error fetching signalement:", error);
      res.status(500).json({ error: "Erreur lors de la récupération du signalement" });
    }
  });

  app.post("/api/signalements", isAuthenticated, signalementMutationLimiter, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;

      // 🔍 Modération du contenu
      const moderationResult = await moderateContent(
        `${req.body.titre} ${req.body.description}`,
        req.body.isSOS ? "sos" : "signalement",
        req.body.language || "fr"
      );

      // Log de l'action de modération
      await logModerationAction(userId, req.body.titre, moderationResult, "signalement");

      if (!moderationResult.isApproved) {
        return res.status(400).json({
          error: "content_moderated",
          severity: moderationResult.severity,
          flaggedWords: moderationResult.flaggedWords,
          reason: moderationResult.reason,
          suggestion: moderationResult.suggestion,
        });
      }

      const validationResult = insertSignalementSchema.safeParse({
        ...req.body,
        userId,
      });

      if (!validationResult.success) {
        const errorMessage = fromZodError(validationResult.error).toString();
        return res.status(400).json({ error: errorMessage });
      }

      // Vérification IA en arrière-plan
      const verificationPromise = (async () => {
        try {
          const verification = await verifySignalement(validationResult.data);

          await storage.updateSignalement(signalement.id, {
            reliabilityScore: verification.score,
            verificationStatus: verification.status,
          });

          console.log(`✅ Signalement ${signalement.id} vérifié: ${verification.score}/100 (${verification.status})`);
        } catch (error) {
          console.error("❌ Erreur vérification IA:", error);
        }
      });

      const signalement = await storage.createSignalement(validationResult.data);

      // Lancer la vérification sans bloquer la réponse
      verificationPromise();

      // 🔒 Audit logging (non-bloquant)
      storage.logAudit({
        userId,
        action: signalement.isSOS ? "CREATE_SOS" : "CREATE_SIGNALEMENT",
        resourceType: "signalement",
        resourceId: signalement.id,
        details: {
          categorie: signalement.categorie,
          isSOS: signalement.isSOS,
          niveauUrgence: signalement.niveauUrgence,
        },
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        severity: signalement.isSOS ? "warning" : "info",
      }).catch(err => console.error("[AUDIT] Erreur log:", err));

      // Broadcast notification to all users about new post
      if (signalement.userId !== "demo-user") {
        const notifType = signalement.isSOS ? "urgence" : "info";
        const notifTitle = signalement.isSOS ? "🚨 Nouveau SOS" : "📍 Nouveau signalement";
        const notifDesc = signalement.isSOS
          ? `Un nouveau signal d'urgence a été publié: ${signalement.titre}`
          : `Nouveau signalement publié: ${signalement.titre}`;

        await storage.broadcastNotification(
          notifType,
          notifTitle,
          notifDesc,
          signalement.id,
          userId // Exclude the author
        );
      }

      // Renvoyer le signalement sans les données base64 volumineuses
      const { medias, ...signalementWithoutMedia } = signalement;
      res.status(201).json({
        ...signalementWithoutMedia,
        medias: medias ? medias.map(() => "[MEDIA_DATA]") : [],
      });
    } catch (error) {
      console.error("Error creating signalement:", error);
      res.status(500).json({ error: "Erreur lors de la création du signalement" });
    }
  });

  app.get("/api/auth/user/signalements", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const signalements = await storage.getUserSignalements(userId);
      res.json(signalements);
    } catch (error) {
      console.error("Error fetching user signalements:", error);
      res.status(500).json({ error: "Erreur lors de la récupération des signalements" });
    }
  });

  app.patch("/api/signalements/:id", signalementMutationLimiter, async (req: any, res) => {
    try {
      const signalement = await storage.getSignalement(req.params.id);

      if (!signalement) {
        return res.status(404).json({ error: "Signalement non trouvé" });
      }

      // Demo mode: Allow editing signalements created by demo-user
      // Authenticated mode: Only the owner can edit their own signalements
      const userId = req.user?.claims?.sub || "demo-user";

      // Security check: Only allow editing if:
      // 1. Signalement belongs to demo-user (demo mode), OR
      // 2. User is authenticated AND owns this signalement
      const isDemoSignalement = signalement.userId === "demo-user";
      const isOwner = signalement.userId === userId;

      if (!isDemoSignalement && !isOwner) {
        return res.status(403).json({ error: "Vous n'êtes pas autorisé à modifier ce signalement" });
      }

      // If signalement is not a demo signalement, require authentication
      if (!isDemoSignalement && !req.user) {
        return res.status(401).json({ error: "Authentification requise" });
      }

      const validationResult = updateSignalementSchema.safeParse(req.body);

      if (!validationResult.success) {
        const errorMessage = fromZodError(validationResult.error).toString();
        return res.status(400).json({ error: errorMessage });
      }

      const updatedSignalement = await storage.updateSignalement(req.params.id, validationResult.data);

      // 🔒 Audit logging (non-bloquant)
      if (updatedSignalement) {
        storage.logAudit({
          userId,
          action: "UPDATE_SIGNALEMENT",
          resourceType: "signalement",
          resourceId: updatedSignalement.id,
          details: {
            modifications: validationResult.data,
          },
          ipAddress: req.ip,
          userAgent: req.get('user-agent'),
          severity: "info",
        }).catch(err => console.error("[AUDIT] Erreur log:", err));
      }

      // Notify all users about the modification
      if (updatedSignalement && userId !== "demo-user") {
        await storage.broadcastNotification(
          "info",
          "✏️ Signalement modifié",
          `Un signalement a été mis à jour: ${updatedSignalement.titre}`,
          updatedSignalement.id,
          userId
        );
      }

      res.json(updatedSignalement);
    } catch (error) {
      console.error("Error updating signalement:", error);
      res.status(500).json({ error: "Erreur lors de la mise à jour du signalement" });
    }
  });

  app.delete("/api/signalements/:id", signalementMutationLimiter, async (req: any, res) => {
    try {
      const signalement = await storage.getSignalement(req.params.id);

      if (!signalement) {
        return res.status(404).json({ error: "Signalement non trouvé" });
      }

      // Demo mode: Allow deleting signalements created by demo-user
      // Authenticated mode: Only the owner can delete their own signalements
      const userId = req.user?.claims?.sub || "demo-user";

      // Security check: Only allow deleting if:
      // 1. Signalement belongs to demo-user (demo mode), OR
      // 2. User is authenticated AND owns this signalement
      const isDemoSignalement = signalement.userId === "demo-user";
      const isOwner = signalement.userId === userId;

      if (!isDemoSignalement && !isOwner) {
        return res.status(403).json({ error: "Vous n'êtes pas autorisé à supprimer ce signalement" });
      }

      // If signalement is not a demo signalement, require authentication
      if (!isDemoSignalement && !req.user) {
        return res.status(401).json({ error: "Authentification requise" });
      }

      const success = await storage.deleteSignalement(req.params.id);

      if (!success) {
        return res.status(404).json({ error: "Signalement non trouvé" });
      }

      // 🔒 Audit logging (non-bloquant) - Log après suppression réussie
      storage.logAudit({
        userId,
        action: "DELETE_SIGNALEMENT",
        resourceType: "signalement",
        resourceId: req.params.id,
        details: {
          titre: signalement.titre,
          categorie: signalement.categorie,
          isSOS: signalement.isSOS,
        },
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        severity: "warning",
      }).catch(err => console.error("[AUDIT] Erreur log:", err));

      res.json({ message: "Signalement supprimé avec succès" });
    } catch (error) {
      console.error("Error deleting signalement:", error);
      res.status(500).json({ error: "Erreur lors de la suppression du signalement" });
    }
  });

  app.patch("/api/signalements/:id/statut", isAuthenticated, async (req: any, res) => {
    try {
      const { statut } = req.body;
      const userId = req.user.claims.sub;

      if (!statut || !["en_attente", "en_cours", "resolu", "rejete"].includes(statut)) {
        return res.status(400).json({ error: "Statut invalide" });
      }

      // Vérifier que l'utilisateur a les droits (admin ou auteur du signalement)
      const existingSignalement = await storage.getSignalement(req.params.id);
      if (!existingSignalement) {
        return res.status(404).json({ error: "Signalement non trouvé" });
      }

      const user = await storage.getUser(userId);
      if (existingSignalement.userId !== userId && user?.role !== "admin") {
        return res.status(403).json({ error: "Vous n'avez pas les droits pour modifier ce signalement" });
      }

      const signalement = await storage.updateSignalementStatut(req.params.id, statut);

      if (!signalement) {
        return res.status(404).json({ error: "Signalement non trouvé" });
      }

      // Les points sont attribués automatiquement dans updateSignalementStatut
      // +10 points quand le statut passe à "résolu"

      // Notify signalement owner
      const statusMessages: Record<string, string> = {
        en_attente: "Votre signalement est en attente de traitement",
        en_cours: "Votre signalement est en cours de traitement",
        resolu: "Votre signalement a été résolu",
        rejete: "Votre signalement a été rejeté"
      };

      await storage.notifySignalementOwner(
        req.params.id,
        statut === "resolu" ? "resolu" : "info",
        "Mise à jour du statut",
        statusMessages[statut] || "Le statut de votre signalement a été mis à jour"
      );

      res.json(signalement);
    } catch (error) {
      console.error("Error updating signalement statut:", error);
      res.status(500).json({ error: "Erreur lors de la mise à jour du statut" });
    }
  });

  app.post("/api/signalements/:id/like", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const signalement = await storage.getSignalement(req.params.id);

      if (!signalement) {
        return res.status(404).json({ error: "Signalement non trouvé" });
      }

      const { signalement: updatedSignalement, isLiked } = await storage.likeSignalement(req.params.id, userId);

      if (!updatedSignalement) {
        return res.status(404).json({ error: "Signalement non trouvé" });
      }

      // Notify signalement owner only on like (not unlike)
      if (isLiked) {
        await storage.notifySignalementOwner(
          req.params.id,
          "like",
          "❤️ Nouveau like",
          "Quelqu'un a aimé votre signalement"
        );
      }

      res.json({ ...updatedSignalement, isLiked });
    } catch (error) {
      console.error("Error liking signalement:", error);
      res.status(500).json({ error: "Erreur lors du like" });
    }
  });

  app.post("/api/signalements/:id/share", async (req, res) => {
    try {
      const signalement = await storage.shareSignalement(req.params.id);

      if (!signalement) {
        return res.status(404).json({ error: "Signalement non trouvé" });
      }

      // Notify signalement owner about share
      await storage.notifySignalementOwner(
        req.params.id,
        "info",
        "🔗 Partage",
        "Quelqu'un a partagé votre signalement"
      );

      res.json(signalement);
    } catch (error) {
      console.error("Error sharing signalement:", error);
      res.status(500).json({ error: "Erreur lors du partage" });
    }
  });

  // ----------------------------------------
  // ROUTES COMMENTAIRES
  // ----------------------------------------
  app.get("/api/signalements/:id/commentaires", async (req, res) => {
    try {
      const commentaires = await storage.getCommentaires(req.params.id);
      res.json(commentaires);
    } catch (error) {
      console.error("Error fetching commentaires:", error);
      res.status(500).json({ error: "Erreur lors de la récupération des commentaires" });
    }
  });

  app.post("/api/commentaires", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const { signalementId, contenu, auteur } = req.body;

      // 🔍 Modération du commentaire
      const moderationResult = await moderateContent(
        contenu,
        "commentaire",
        req.body.language || "fr"
      );

      await logModerationAction(userId, contenu, moderationResult, "commentaire");

      if (!moderationResult.isApproved) {
        return res.status(400).json({
          error: "content_moderated",
          severity: moderationResult.severity,
          flaggedWords: moderationResult.flaggedWords,
          reason: moderationResult.reason,
          suggestion: moderationResult.suggestion,
        });
      }

      const validationResult = insertCommentaireSchema.safeParse({
        ...req.body,
        userId: userId, // Use authenticated user ID
      });

      if (!validationResult.success) {
        const errorMessage = fromZodError(validationResult.error).toString();
        return res.status(400).json({ error: errorMessage });
      }

      const commentaire = await storage.createCommentaire(validationResult.data);

      // Notify signalement owner about new comment
      await storage.notifySignalementOwner(
        validationResult.data.signalementId,
        "comment",
        "💬 Nouveau commentaire",
        "Quelqu'un a commenté votre signalement"
      );

      res.status(201).json(commentaire);
    } catch (error) {
      console.error("Error creating commentaire:", error);
      res.status(500).json({ error: "Erreur lors de la création du commentaire" });
    }
  });

  // ----------------------------------------
  // ROUTES NOTIFICATIONS
  // ----------------------------------------
  app.get("/api/notifications", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const notifications = await storage.getUserNotifications(userId);
      res.json(notifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ error: "Erreur lors de la récupération des notifications" });
    }
  });

  app.get("/api/notifications/unread-count", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const count = await storage.getUnreadNotificationsCount(userId);
      res.json({ count });
    } catch (error) {
      console.error("Error fetching unread count:", error);
      res.status(500).json({ error: "Erreur lors de la récupération du nombre de notifications non lues" });
    }
  });

  app.patch("/api/notifications/:id/read", isAuthenticated, async (req: any, res) => {
    try {
      const notification = await storage.markNotificationAsRead(req.params.id);
      if (!notification) {
        return res.status(404).json({ error: "Notification non trouvée" });
      }
      res.json(notification);
    } catch (error) {
      console.error("Error marking notification as read:", error);
      res.status(500).json({ error: "Erreur lors de la mise à jour de la notification" });
    }
  });

  app.post("/api/notifications/mark-all-read", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      await storage.markAllNotificationsAsRead(userId);
      res.json({ message: "Toutes les notifications ont été marquées comme lues" });
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      res.status(500).json({ error: "Erreur lors de la mise à jour des notifications" });
    }
  });

  app.delete("/api/notifications/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const notificationId = req.params.id;

      const notification = await storage.getNotificationById(notificationId);

      if (!notification) {
        return res.status(404).json({ error: "Notification non trouvée" });
      }

      if (notification.userId !== userId) {
        return res.status(403).json({ error: "Non autorisé" });
      }

      const success = await storage.deleteNotification(notificationId);

      if (!success) {
        return res.status(500).json({ error: "Erreur lors de la suppression" });
      }

      res.json({ message: "Notification supprimée avec succès" });
    } catch (error) {
      console.error("Error deleting notification:", error);
      res.status(500).json({ error: "Erreur lors de la suppression de la notification" });
    }
  });

  app.delete("/api/notifications", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      await storage.deleteAllUserNotifications(userId);
      res.json({ message: "Toutes les notifications ont été supprimées" });
    } catch (error) {
      console.error("Error deleting all notifications:", error);
      res.status(500).json({ error: "Erreur lors de la suppression des notifications" });
    }
  });

  // ----------------------------------------
  // ROUTES PROFIL PUBLIC
  // ----------------------------------------
  app.get("/api/users/:userId", async (req, res) => {
    try {
      const user = await storage.getUserById(req.params.userId);
      if (!user) {
        return res.status(404).json({ error: "Utilisateur non trouvé" });
      }
      // Ne retourner que les informations publiques
      const publicUser = {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        ville: user.ville,
        metier: user.metier,
        bio: user.bio,
        profileImageUrl: user.profileImageUrl,
        createdAt: user.createdAt,
      };
      res.json(publicUser);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ error: "Erreur lors de la récupération de l'utilisateur" });
    }
  });

  app.get("/api/users/:userId/signalements", async (req, res) => {
    try {
      const signalements = await storage.getSignalementsByUserId(req.params.userId);
      res.json(signalements);
    } catch (error) {
      console.error("Error fetching user signalements:", error);
      res.status(500).json({ error: "Erreur lors de la récupération des signalements" });
    }
  });

  // ----------------------------------------
  // ROUTES TRACKING GPS
  // ----------------------------------------
  app.post("/api/tracking/start", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const session = await storage.startTrackingSession(userId);
      res.status(201).json(session);
    } catch (error) {
      console.error("Error starting tracking session:", error);
      res.status(500).json({ error: "Erreur lors du démarrage du tracking" });
    }
  });

  // Stop tracking session
  app.post("/api/tracking/stop", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;

      // Récupérer la session active
      const activeSession = await storage.getActiveTrackingSession(userId);

      if (!activeSession) {
        return res.status(404).json({ error: "Aucune session de tracking active trouvée" });
      }

      // Arrêter la session en utilisant l'ID de la session
      const session = await storage.stopTrackingSession(activeSession.id);

      if (!session) {
        return res.status(404).json({ error: "Erreur lors de l'arrêt de la session" });
      }

      // Récupérer les points de localisation de cette session
      const locations = await storage.getLocationPointsBySession(session.id);

      // Send email with location address and GPX file
      if (locations.length > 0) {
        // Get the last location point for address
        const lastLocation = locations[locations.length - 1];

        // Get user info for email
        const user = await storage.getUser(userId);

        if (user?.email) {
          // Reverse geocode the last location to get address
          const geocodeResult = await reverseGeocode(lastLocation.latitude, lastLocation.longitude);

          // Générer le fichier GPX
          const gpxContent = generateGPX(locations);

          // Send email with address and GPX file
          try {
            await sendLocationEmail(
              user.email,
              `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Utilisateur',
              geocodeResult.address,
              locations.length,
              gpxContent,
              session.id
            );
            console.log(`✅ Email envoyé à ${user.email} avec l'adresse: ${geocodeResult.address} et le fichier GPX`);
          } catch (emailError) {
            console.error('❌ Échec de l\'envoi de l\'email:', emailError);
            // Don't fail the request if email fails
          }
        } else {
          console.log(`⚠️ Aucun email configuré pour l'utilisateur ${userId}`);
        }
      }

      // Récupérer les contacts d'urgence
      const contacts = await storage.getEmergencyContacts(userId);

      // Si des contacts existent, créer les URLs WhatsApp
      if (contacts && contacts.length > 0) {
        // Récupérer les points de localisation de cette session
        const locationPoints = await storage.getSessionLocationPoints(session.id);

        if (locationPoints && locationPoints.length > 0) {
          const lastPoint = locationPoints[locationPoints.length - 1];
          const mapsUrl = `https://www.google.com/maps?q=${lastPoint.latitude},${lastPoint.longitude}`;

          const user = await storage.getUser(userId);
          const userName = `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Un utilisateur';

          const message = `🚨 ${userName} a terminé son suivi de localisation.\n\n📍 Position finale:\n${mapsUrl}\n\nSuivi terminé avec succès.`;

          const whatsappUrls = contacts.map(contact => {
            const cleanPhone = contact.phone.replace(/[^\d+]/g, '');
            return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
          });

          return res.json({ ...session, whatsappUrls });
        }
      }

      res.json(session);
    } catch (error) {
      console.error("Error stopping tracking session:", error);
      res.status(500).json({ error: "Erreur lors de l'arrêt du tracking" });
    }
  });

  // Helper function to generate GPX file
  function generateGPX(locations: any[]): string {
    const gpxHeader = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="Burkina Watch" xmlns="http://www.topografix.com/GPX/1/1">
  <trk>
    <name>Session de localisation en direct</name>
    <trkseg>`;

    const gpxPoints = locations.map(loc =>
      `      <trkpt lat="${loc.latitude}" lon="${loc.longitude}">
        <time>${new Date(loc.timestamp).toISOString()}</time>
      </trkpt>`
    ).join('\n');

    const gpxFooter = `
    </trkseg>
  </trk>
</gpx>`;

    return gpxHeader + '\n' + gpxPoints + gpxFooter;
  }

  app.get("/api/tracking/session", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const session = await storage.getActiveTrackingSession(userId);

      if (!session) {
        return res.status(404).json({ error: "Aucune session de tracking active" });
      }

      res.json(session);
    } catch (error) {
      console.error("Error fetching active tracking session:", error);
      res.status(500).json({ error: "Erreur lors de la récupération de la session" });
    }
  });

  app.post("/api/tracking/location", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const activeSession = await storage.getActiveTrackingSession(userId);

      if (!activeSession) {
        return res.status(404).json({ error: "Aucune session de tracking active" });
      }

      const validationResult = insertLocationPointSchema.safeParse({
        ...req.body,
        sessionId: activeSession.id,
        userId,
      });

      if (!validationResult.success) {
        const errorMessage = fromZodError(validationResult.error).toString();
        return res.status(400).json({ error: errorMessage });
      }

      const locationPoint = await storage.addLocationPoint(validationResult.data);
      res.status(201).json(locationPoint);
    } catch (error) {
      console.error("Error adding location point:", error);
      res.status(500).json({ error: "Erreur lors de l'ajout du point de localisation" });
    }
  });

  app.get("/api/tracking/sessions", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const sessions = await storage.getUserTrackingSessions(userId);

      const sessionsWithTrajectory = await Promise.all(
        sessions.map(async (session) => {
          const points = await storage.getSessionLocationPoints(session.id);

          let trajectoryUrl = null;
          if (points.length > 0) {
            const sortedPoints = points.sort((a, b) =>
              new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
            );

            if (sortedPoints.length === 1) {
              const point = sortedPoints[0];
              trajectoryUrl = `https://www.google.com/maps?q=${point.latitude},${point.longitude}`;
            } else {
              const firstPoint = sortedPoints[0];
              const lastPoint = sortedPoints[sortedPoints.length - 1];

              const waypoints = sortedPoints.slice(1, -1)
                .filter((_, index) => index % Math.max(1, Math.floor((sortedPoints.length - 2) / 8)) === 0)
                .map(p => `${p.latitude},${p.longitude}`)
                .join('|');

              const origin = `${firstPoint.latitude},${firstPoint.longitude}`;
              const destination = `${lastPoint.latitude},${lastPoint.longitude}`;

              if (waypoints) {
                trajectoryUrl = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&waypoints=${waypoints}&travelmode=walking`;
              } else {
                trajectoryUrl = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&travelmode=walking`;
              }
            }
          }

          return {
            ...session,
            trajectoryUrl,
            pointCount: points.length
          };
        })
      );

      res.json(sessionsWithTrajectory);
    } catch (error) {
      console.error("Error fetching tracking sessions:", error);
      res.status(500).json({ error: "Erreur lors de la récupération des sessions" });
    }
  });

  app.get("/api/tracking/sessions/:id/points", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const sessionId = req.params.id;

      const session = await storage.getActiveTrackingSession(userId);
      if (!session || session.id !== sessionId) {
        const sessions = await storage.getUserTrackingSessions(userId);
        const sessionExists = sessions.find(s => s.id === sessionId);

        if (!sessionExists) {
          return res.status(403).json({ error: "Session non trouvée ou non autorisée" });
        }
      }

      const points = await storage.getSessionLocationPoints(sessionId);
      res.json(points);
    } catch (error) {
      console.error("Error fetching session location points:", error);
      res.status(500).json({ error: "Erreur lors de la récupération des points" });
    }
  });

  app.delete("/api/tracking/sessions/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const sessionId = req.params.id;

      const sessions = await storage.getUserTrackingSessions(userId);
      const sessionExists = sessions.find(s => s.id === sessionId);

      if (!sessionExists) {
        return res.status(404).json({ error: "Session non trouvée" });
      }

      const success = await storage.deleteTrackingSession(sessionId);

      if (!success) {
        return res.status(500).json({ error: "Erreur lors de la suppression de la session" });
      }

      res.json({ message: "Session supprimée avec succès" });
    } catch (error) {
      console.error("Error deleting tracking session:", error);
      res.status(500).json({ error: "Erreur lors de la suppression de la session" });
    }
  });

  // New routes for emergency contacts and panic alerts
  app.get("/api/emergency-contacts", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const contacts = await storage.getEmergencyContacts(userId);
      res.json(contacts);
    } catch (error) {
      console.error("Error fetching emergency contacts:", error);
      res.status(500).json({ error: "Erreur lors de la récupération des contacts" });
    }
  });

  app.post("/api/emergency-contacts", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validationResult = insertEmergencyContactSchema.safeParse({
        ...req.body,
        userId,
      });

      if (!validationResult.success) {
        const errorMessage = fromZodError(validationResult.error).toString();
        return res.status(400).json({ error: errorMessage });
      }

      const contact = await storage.createEmergencyContact(validationResult.data);
      res.status(201).json(contact);
    } catch (error) {
      console.error("Error creating emergency contact:", error);
      res.status(500).json({ error: "Erreur lors de la création du contact" });
    }
  });

  app.delete("/api/emergency-contacts/:id", isAuthenticated, async (req: any, res) => {
    try {
      const success = await storage.deleteEmergencyContact(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Contact non trouvé" });
      }
      res.json({ message: "Contact supprimé avec succès" });
    } catch (error) {
      console.error("Error deleting emergency contact:", error);
      res.status(500).json({ error: "Erreur lors de la suppression du contact" });
    }
  });

  app.post("/api/panic-alert", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { latitude, longitude, address } = req.body;

      const contacts = await storage.getEmergencyContacts(userId);

      if (contacts.length === 0) {
        return res.status(400).json({ error: "Aucun contact d'urgence configuré" });
      }

      const user = await storage.getUser(userId);
      const userName = `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Un utilisateur';

      const sentTo = contacts.map(c => c.phone);

      // Créer le lien Google Maps
      const mapsUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;

      // Message à envoyer
      const message = `🚨 ALERTE URGENCE - ${userName} a besoin d'aide!\n\nPosition: ${mapsUrl}\n\nRéagissez rapidement!`;

      // Envoyer via WhatsApp pour chaque contact
      const whatsappPromises = contacts.map(contact => {
        // Nettoyer le numéro de téléphone (enlever espaces et caractères spéciaux)
        const cleanPhone = contact.phone.replace(/[^\d+]/g, '');
        const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;

        console.log(`WhatsApp URL pour ${contact.name}: ${whatsappUrl}`);
        return whatsappUrl;
      });

      const alert = await storage.createPanicAlert({
        userId,
        latitude,
        longitude,
        address: address || null,
        sentTo,
      });

      await storage.createNotification({
        userId,
        type: "panic_alert",
        title: "🚨 Alerte de sécurité émise",
        description: `Alerte panique envoyée à ${contacts.length} contact(s) d'urgence`,
      });

      // Retourner les URLs WhatsApp pour que le client puisse les ouvrir
      res.status(201).json({
        ...alert,
        whatsappUrls: whatsappPromises,
        message: `Alerte envoyée. ${contacts.length} lien(s) WhatsApp générés.`
      });
    } catch (error) {
      console.error("Error creating panic alert:", error);
      res.status(500).json({ error: "Erreur lors de l'envoi de l'alerte" });
    }
  });

  app.get("/api/panic-alerts", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const alerts = await storage.getUserPanicAlerts(userId);
      res.json(alerts);
    } catch (error) {
      console.error("Error fetching panic alerts:", error);
      res.status(500).json({ error: "Erreur lors de la récupération des alertes" });
    }
  });

  // ----------------------------------------
  // ROUTES CHATBOT
  // ----------------------------------------
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || process.env.REPLIT_AI_API_KEY,
    baseURL: process.env.REPLIT_AI_API_KEY ? "https://api.replit.ai/v1beta1" : undefined,
  });

  const SYSTEM_PROMPT = `Tu es "Assistance Burkina Watch", un assistant intelligent et bienveillant qui aide les citoyens du Burkina Faso à utiliser la plateforme de veille citoyenne Burkina Watch.

Ton rôle :

1. **Guider la création de signalements** :
   - Pose des questions claires et simples : "Que voulez-vous signaler ?", "Où cela s'est-il produit ?", "Quand cela s'est-il passé ?"
   - Aide à choisir la bonne catégorie : urgence, sécurité, santé, environnement, corruption, infrastructure, personne recherchée
   - Guide sur le niveau d'urgence : faible, moyen, critique
   - Rappelle l'importance de fournir des détails précis et des photos si possible

2. **Fournir des conseils de sécurité** :
   - En cas de danger immédiat : "Restez à distance. Mettez-vous en sécurité. Appelez le 17 (police) ou le 18 (pompiers) immédiatement."
   - Pour les signalements SOS : "Activez votre localisation. Vos contacts d'urgence seront alertés."
   - Rappelle les numéros d'urgence au Burkina Faso : Police 17, Pompiers 18, SAMU 112

3. **Répondre aux questions fréquentes** :
   - Comment fonctionne l'anonymat ? "Vos signalements peuvent être anonymes. Votre identité ne sera pas révélée publiquement."
   - Qui reçoit les alertes ? "Les alertes SOS sont envoyées à vos contacts d'urgence configurés dans votre profil."
   - Comment suivre un signalement ? "Vous pouvez voir le statut de vos signalements dans votre profil."

4. **Ton style de communication** :
   - Français simple et accessible
   - Empathique et rassurant
   - Concis mais complet
   - Adapté au contexte burkinabé

Important : Si l'utilisateur est en danger immédiat, privilégie toujours la sécurité et recommande d'appeler les services d'urgence (17, 18, 112).`;

  app.post("/api/chat", async (req: any, res) => {
    try {
      const validationResult = insertChatMessageSchema.safeParse(req.body);

      if (!validationResult.success) {
        const errorMessage = fromZodError(validationResult.error).toString();
        return res.status(400).json({ error: errorMessage });
      }

      const { sessionId, userId, content } = validationResult.data;

      // Sauvegarder le message de l'utilisateur
      await storage.saveChatMessage({
        sessionId,
        userId: userId || null,
        role: "user",
        content,
      });

      // Récupérer l'historique de la conversation
      const history = await storage.getChatHistory(sessionId);

      // Préparer les messages pour OpenAI
      const messages = [
        { role: "system" as const, content: SYSTEM_PROMPT },
        ...history.map(msg => ({
          role: msg.role as "user" | "assistant",
          content: msg.content,
        }))
      ];

      // Appeler OpenAI
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages,
        temperature: 0.7,
        max_tokens: 500,
      });

      const assistantMessage = completion.choices[0]?.message?.content || "Désolé, je n'ai pas pu générer une réponse.";

      // Sauvegarder la réponse de l'assistant
      await storage.saveChatMessage({
        sessionId,
        userId: userId || null,
        role: "assistant",
        content: assistantMessage,
      });

      res.json({ message: assistantMessage });
    } catch (error: any) {
      console.error("Error in chat:", error);

      // Détection spécifique des erreurs de quota OpenAI
      if (error?.status === 429 || error?.code === 'insufficient_quota' || error?.type === 'insufficient_quota') {
        return res.status(503).json({
          error: "Le quota d'utilisation de l'assistant IA est temporairement épuisé. Veuillez réessayer dans quelques instants ou contacter l'administrateur.",
          quotaExceeded: true
        });
      }

      // Autres erreurs OpenAI
      if (error?.status || error?.code) {
        return res.status(500).json({
          error: "L'assistant IA rencontre des difficultés techniques. Veuillez réessayer dans quelques instants.",
        });
      }

      // Erreur générique
      res.status(500).json({ error: "Erreur lors du traitement de votre message" });
    }
  });

  app.get("/api/chat/history/:sessionId", async (req, res) => {
    try {
      const { sessionId } = req.params;
      const history = await storage.getChatHistory(sessionId);
      res.json(history);
    } catch (error) {
      console.error("Error fetching chat history:", error);
      res.status(500).json({ error: "Erreur lors de la récupération de l'historique" });
    }
  });

  // Route de santé
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Marquer un utilisateur comme en ligne
  app.post("/api/user/online", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      await storage.userConnected(userId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error updating online status:", error);
      res.status(500).json({ error: "Erreur lors de la mise à jour du statut" });
    }
  });

  // Marquer un utilisateur comme hors ligne
  app.post("/api/user/offline", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      await storage.userDisconnected(userId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error removing online status:", error);
      res.status(500).json({ error: "Erreur lors de la suppression du statut" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}