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
import { verifySignalement } from "./aiVerification";
import { moderateContent, logModerationAction } from "./contentModeration";
import { signalementMutationLimiter } from "./securityHardening";
import { generateChatResponse, isAIAvailable } from "./aiService";
import { fetchBulletins, clearCache } from "./rssService";
import { fetchEvents, clearEventsCache } from "./eventsService";
import { overpassService } from "./overpassService";
import type { Place } from "@shared/schema";

// ============================================
// HELPERS POUR TRANSFORMER LES DONNÉES OSM
// ============================================

function transformOsmToRestaurant(place: Place, index: number) {
  const tags = place.tags as Record<string, string> || {};
  return {
    id: `osm-rest-${place.id}`,
    nom: place.name,
    type: mapOsmCuisineToType(tags.cuisine || tags.amenity || "restaurant") as any,
    adresse: place.address || "Adresse à vérifier",
    quartier: place.quartier || "Quartier non spécifié",
    ville: place.ville || "Ville non spécifiée",
    region: place.region || "Région non spécifiée",
    latitude: parseFloat(place.latitude),
    longitude: parseFloat(place.longitude),
    telephone: place.telephone || undefined,
    email: place.email || undefined,
    siteWeb: place.website || undefined,
    horaires: place.horaires || "Horaires à vérifier",
    gammePrix: "Moyen" as const,
    services: [],
    specialites: tags.cuisine ? tags.cuisine.split(";").map(c => c.trim()) : [],
    wifi: tags.internet_access === "wlan" || tags.internet_access === "yes",
    climatisation: false,
    parking: tags.parking === "yes",
    terrasse: tags.outdoor_seating === "yes",
    livraison: tags.delivery === "yes",
    source: "OSM" as const
  };
}

function mapOsmCuisineToType(cuisine: string): string {
  const cuisineMap: Record<string, string> = {
    "african": "Africain",
    "burkinabe": "Burkinabè",
    "french": "Français",
    "lebanese": "Libanais",
    "asian": "Asiatique",
    "chinese": "Asiatique",
    "vietnamese": "Asiatique",
    "japanese": "Asiatique",
    "fast_food": "Fast-food",
    "pizza": "Pizzeria",
    "grill": "Grillades",
    "cafe": "Café",
    "coffee": "Café",
    "pastry": "Pâtisserie",
    "international": "International",
    "italian": "Italien",
    "restaurant": "Africain",
    "bar": "Maquis"
  };
  return cuisineMap[cuisine.toLowerCase()] || "Africain";
}

function transformOsmToPharmacy(place: Place) {
  const tags = place.tags as Record<string, string> || {};
  return {
    id: `osm-pharm-${place.id}`,
    nom: place.name,
    adresse: place.address || "Adresse à vérifier",
    quartier: place.quartier || "Quartier non spécifié",
    ville: place.ville || "Ville non spécifiée",
    region: place.region || "Région non spécifiée",
    latitude: parseFloat(place.latitude),
    longitude: parseFloat(place.longitude),
    telephone: place.telephone || undefined,
    horaires: place.horaires || "Horaires à vérifier",
    typeGarde: tags.opening_hours?.includes("24") ? "24h" : "jour" as "jour" | "nuit" | "24h",
    services: [],
    source: "OSM" as const
  };
}

function transformOsmToBoutique(place: Place) {
  const tags = place.tags as Record<string, string> || {};
  const shopType = tags.shop || place.placeType;
  return {
    id: `osm-bout-${place.id}`,
    nom: place.name,
    categorie: mapOsmShopToCategory(shopType),
    adresse: place.address || "Adresse à vérifier",
    quartier: place.quartier || "Quartier non spécifié",
    ville: place.ville || "Ville non spécifiée",
    region: place.region || "Région non spécifiée",
    latitude: parseFloat(place.latitude),
    longitude: parseFloat(place.longitude),
    telephone: place.telephone || undefined,
    horaires: place.horaires || "Horaires à vérifier",
    produits: [],
    services: [],
    source: "OSM" as const
  };
}

function mapOsmShopToCategory(shop: string): string {
  const shopMap: Record<string, string> = {
    "supermarket": "Supermarché",
    "convenience": "Alimentation",
    "grocery": "Alimentation",
    "butcher": "Alimentation",
    "bakery": "Alimentation",
    "electronics": "Électronique",
    "mobile_phone": "Téléphonie",
    "clothes": "Mode",
    "shoes": "Mode",
    "hardware": "Quincaillerie",
    "cosmetics": "Cosmétiques",
    "furniture": "Ameublement",
    "books": "Librairie",
    "sports": "Sport",
    "jewelry": "Bijouterie",
    "hairdresser": "Cosmétiques",
    "beauty": "Cosmétiques"
  };
  return shopMap[shop.toLowerCase()] || "Divers";
}

function transformOsmToMarche(place: Place) {
  const tags = place.tags as Record<string, string> || {};
  return {
    id: `osm-march-${place.id}`,
    nom: place.name,
    type: "Marché général",
    adresse: place.address || "Adresse à vérifier",
    quartier: place.quartier || "Quartier non spécifié",
    ville: place.ville || "Ville non spécifiée",
    region: place.region || "Région non spécifiée",
    latitude: parseFloat(place.latitude),
    longitude: parseFloat(place.longitude),
    telephone: place.telephone || undefined,
    horaires: place.horaires || "Tous les jours",
    joursOuverture: ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"],
    produits: [],
    source: "OSM" as const
  };
}

function transformOsmToBanque(place: Place) {
  const tags = place.tags as Record<string, string> || {};
  return {
    id: `osm-bank-${place.id}`,
    nom: place.name,
    type: place.placeType === "atm" ? "GAB" : "Banque",
    categorie: "Commerciale",
    adresse: place.address || "Adresse à vérifier",
    quartier: place.quartier || "Quartier non spécifié",
    ville: place.ville || "Ville non spécifiée",
    region: place.region || "Région non spécifiée",
    latitude: parseFloat(place.latitude),
    longitude: parseFloat(place.longitude),
    telephone: place.telephone || undefined,
    horaires: place.horaires || "8h-16h",
    services: [],
    nombreGAB: place.placeType === "atm" ? 1 : 0,
    source: "OSM" as const
  };
}

function transformOsmToStation(place: Place) {
  const tags = place.tags as Record<string, string> || {};
  const brand = tags.brand || tags.operator || tags.name || "Station";
  return {
    id: `osm-fuel-${place.id}`,
    nom: place.name,
    marque: mapOsmBrandToMarque(brand),
    adresse: place.address || "Adresse à vérifier",
    quartier: place.quartier || "Quartier non spécifié",
    ville: place.ville || "Ville non spécifiée",
    region: place.region || "Région non spécifiée",
    latitude: parseFloat(place.latitude),
    longitude: parseFloat(place.longitude),
    telephone: place.telephone || undefined,
    horaires: place.horaires || "6h-22h",
    is24h: tags.opening_hours?.includes("24") || false,
    services: [],
    carburants: ["Essence", "Gasoil"],
    source: "OSM" as const
  };
}

function mapOsmBrandToMarque(brand: string): string {
  const brandLower = brand.toLowerCase();
  if (brandLower.includes("total")) return "TotalEnergies";
  if (brandLower.includes("shell")) return "Shell";
  if (brandLower.includes("oryx")) return "Oryx";
  if (brandLower.includes("sob")) return "SOB Petrol";
  if (brandLower.includes("sonabhy")) return "Sonabhy";
  if (brandLower.includes("barka")) return "Barka Energies";
  return "Autre";
}

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
      console.log("📝 PATCH /api/signalements/:id - Données reçues:", req.body);
      
      const signalement = await storage.getSignalement(req.params.id);

      if (!signalement) {
        console.log("❌ Signalement non trouvé:", req.params.id);
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
        console.log("❌ Non autorisé - userId:", userId, "signalement.userId:", signalement.userId);
        return res.status(403).json({ error: "Vous n'êtes pas autorisé à modifier ce signalement" });
      }

      // If signalement is not a demo signalement, require authentication
      if (!isDemoSignalement && !req.user) {
        console.log("❌ Authentification requise");
        return res.status(401).json({ error: "Authentification requise" });
      }

      const validationResult = updateSignalementSchema.safeParse(req.body);

      if (!validationResult.success) {
        const errorMessage = fromZodError(validationResult.error).toString();
        console.log("❌ Erreur validation:", errorMessage);
        console.log("Erreurs détaillées:", validationResult.error.errors);
        return res.status(400).json({ error: errorMessage });
      }

      console.log("✅ Données validées:", validationResult.data);

      const updatedSignalement = await storage.updateSignalement(req.params.id, validationResult.data);

      console.log("✅ Signalement mis à jour:", updatedSignalement);

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
      console.error("❌ Error updating signalement:", error);
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
        console.log(`⚠️ Tentative d'arrêt de tracking sans session active pour l'utilisateur ${userId}`);
        return res.status(404).json({ error: "Aucune session de tracking active" });
      }

      // Arrêter la session en utilisant l'ID de la session
      const session = await storage.stopTrackingSession(activeSession.id);

      if (!session) {
        return res.status(404).json({ error: "Erreur lors de l'arrêt de la session" });
      }

      // Récupérer les points de localisation de cette session
      const locations = await storage.getLocationPointsBySession(session.id);

      let geocodedAddress = "Adresse non disponible";
      let lastLocation: any = null;

      // Send email with location address and GPX file
      if (locations.length > 0) {
        // Get the last location point for address
        lastLocation = locations[locations.length - 1];

        // Get user info for email
        const user = await storage.getUser(userId);

        // Reverse geocode the last location to get address
        const geocodeResult = await reverseGeocode(lastLocation.latitude, lastLocation.longitude);
        geocodedAddress = geocodeResult.address;

        if (user?.email) {
          // Générer le fichier GPX
          const gpxContent = generateGPX(locations);

          // Send email with address and GPX file
          try {
            await sendLocationEmail(
              user.email,
              `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Utilisateur',
              geocodedAddress,
              locations.length,
              gpxContent,
              session.id
            );
            console.log(`✅ Email envoyé à ${user.email} avec l'adresse: ${geocodedAddress} et le fichier GPX`);
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

      // Si des contacts existent, créer les URLs WhatsApp avec l'adresse géocodée
      if (contacts && contacts.length > 0 && lastLocation) {
        const mapsUrl = `https://www.google.com/maps?q=${lastLocation.latitude},${lastLocation.longitude}`;

        const user = await storage.getUser(userId);
        const userName = `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Un utilisateur';

        // Message avec l'adresse géocodée
        const message = `🚨 ${userName} a terminé son suivi de localisation.\n\n📍 Position finale:\n${geocodedAddress}\n\n🗺️ Voir sur la carte:\n${mapsUrl}\n\n${locations.length} points enregistrés.`;

        const whatsappUrls = contacts.map(contact => {
          const cleanPhone = contact.phone.replace(/[^\d+]/g, '');
          return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
        });

        console.log(`✅ ${whatsappUrls.length} URLs WhatsApp générées avec l'adresse: ${geocodedAddress}`);
        return res.json({ ...session, whatsappUrls, address: geocodedAddress });
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
  const chatRequestSchema = insertChatMessageSchema.omit({ role: true });

  app.post("/api/chat", async (req: any, res) => {
    try {
      if (!isAIAvailable()) {
        return res.status(503).json({
          error: "L'assistant IA n'est pas disponible. Veuillez configurer GOOGLE_API_KEY ou GROQ_API_KEY.",
          unavailable: true
        });
      }

      const validationResult = chatRequestSchema.safeParse(req.body);

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

      // Mapper l'historique au format attendu par le service IA
      const chatMessages = history.map(msg => ({
        role: msg.role as "user" | "assistant",
        content: msg.content
      }));

      // Récupérer le contexte de l'application pour enrichir la réponse
      const appContext: any = {};
      
      try {
        // Récupérer les données pertinentes de l'application
        const [stats, recentSignalements] = await Promise.all([
          storage.getStats(),
          storage.getSignalements({ limit: 5 })
        ]);
        
        appContext.stats = stats;
        appContext.signalements = recentSignalements;
        
        // Importer les données statiques
        const { PHARMACIES_DATA } = await import('../client/src/pages/Pharmacies');
        const { urgencesData } = await import('../client/src/pages/Urgences');
        
        appContext.pharmacies = PHARMACIES_DATA;
        appContext.urgences = urgencesData;
      } catch (contextError) {
        console.error("Erreur récupération contexte:", contextError);
        // Continuer même si le contexte n'est pas disponible
      }

      // Appeler le service IA (Gemini avec fallback Groq) avec le contexte
      const { message: assistantMessage, engine } = await generateChatResponse(chatMessages, appContext);

      console.log(`✅ Réponse générée par ${engine === "gemini" ? "Google Gemini" : "Groq LLaMA3"}`);

      // Sauvegarder la réponse de l'assistant
      await storage.saveChatMessage({
        sessionId,
        userId: userId || null,
        role: "assistant",
        content: assistantMessage,
      });

      res.json({ message: assistantMessage, engine });
    } catch (error: any) {
      console.error("Error in chat:", error);

      // Erreur de quota ou service indisponible (case-insensitive)
      const errorMsg = error?.message?.toLowerCase() || "";
      if (errorMsg.includes("quota") || errorMsg.includes("rate limit") || error?.status === 429) {
        return res.status(503).json({
          error: "Le quota d'utilisation de l'assistant IA est temporairement épuisé. Veuillez réessayer dans quelques instants.",
          quotaExceeded: true
        });
      }

      // Erreur générique
      res.status(500).json({ 
        error: error?.message || "Erreur lors du traitement de votre message"
      });
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

  // ----------------------------------------
  // ROUTES PHARMACIES
  // ----------------------------------------
  app.get("/api/pharmacies", async (req, res) => {
    try {
      const { pharmaciesService } = await import("./pharmaciesService");
      const { region, typeGarde, search } = req.query;

      // Récupérer les données du service existant
      let pharmacies: any[] = pharmaciesService.getAllPharmacies();

      // Ajouter les données OSM (pharmacies, hospitals, clinics)
      try {
        const osmPharmacies = await overpassService.getPlaces({ placeType: "pharmacy" });
        const osmHospitals = await overpassService.getPlaces({ placeType: "hospital" });
        const osmClinics = await overpassService.getPlaces({ placeType: "clinic" });
        
        const allOsmPlaces = [...osmPharmacies, ...osmHospitals, ...osmClinics];
        const osmTransformed = allOsmPlaces.map(p => transformOsmToPharmacy(p));
        pharmacies = [...pharmacies, ...osmTransformed];
      } catch (osmError) {
        console.error("Erreur chargement OSM pharmacies:", osmError);
      }

      // Appliquer les filtres
      if (search) {
        const query = (search as string).toLowerCase();
        pharmacies = pharmacies.filter(p =>
          p.nom?.toLowerCase().includes(query) ||
          p.ville?.toLowerCase().includes(query) ||
          p.quartier?.toLowerCase().includes(query) ||
          p.adresse?.toLowerCase().includes(query)
        );
      }

      if (region && region !== "all") {
        pharmacies = pharmacies.filter(p => p.region === region);
      }

      if (typeGarde && typeGarde !== "all") {
        pharmacies = pharmacies.filter(p => p.typeGarde === typeGarde);
      }

      res.set('Cache-Control', 'public, max-age=3600'); // Cache 1 heure
      res.json(pharmacies);
    } catch (error) {
      console.error("Erreur récupération pharmacies:", error);
      res.status(500).json({ error: "Erreur lors de la récupération des pharmacies" });
    }
  });

  app.get("/api/pharmacies/stats", async (req, res) => {
    try {
      const { pharmaciesService } = await import("./pharmaciesService");
      const localStats = pharmaciesService.getStats();
      
      // Compter les données OSM
      let osmCount = 0;
      try {
        const osmPharmacies = await overpassService.getPlaces({ placeType: "pharmacy" });
        const osmHospitals = await overpassService.getPlaces({ placeType: "hospital" });
        const osmClinics = await overpassService.getPlaces({ placeType: "clinic" });
        osmCount = osmPharmacies.length + osmHospitals.length + osmClinics.length;
      } catch (e) {}
      
      res.json({
        ...localStats,
        total: localStats.total + osmCount,
        osmCount,
        source: "OSM + Local"
      });
    } catch (error) {
      console.error("Erreur stats pharmacies:", error);
      res.status(500).json({ error: "Erreur lors de la récupération des statistiques" });
    }
  });

  app.post("/api/pharmacies/refresh", async (req, res) => {
    try {
      const { pharmaciesService } = await import("./pharmaciesService");
      pharmaciesService.markAsUpdated();
      const stats = pharmaciesService.getStats();
      res.json({ 
        message: "Données des pharmacies actualisées",
        ...stats
      });
    } catch (error) {
      console.error("Erreur actualisation pharmacies:", error);
      res.status(500).json({ error: "Erreur lors de l'actualisation" });
    }
  });

  // Route de santé
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // ----------------------------------------
  // ROUTES RESTAURANTS
  // ----------------------------------------
  app.get("/api/restaurants", async (req, res) => {
    try {
      const { RESTAURANTS_DATA } = await import("./restaurantsData");
      const { region, type, gammePrix, search, livraison, wifi } = req.query;

      // Récupérer les données codées en dur
      let restaurants: any[] = [...RESTAURANTS_DATA];

      // Ajouter les données OSM (restaurants, fast_food, cafe, bar)
      try {
        const osmRestaurants = await overpassService.getPlaces({ placeType: "restaurant" });
        const osmFastFood = await overpassService.getPlaces({ placeType: "fast_food" });
        const osmCafe = await overpassService.getPlaces({ placeType: "cafe" });
        const osmBar = await overpassService.getPlaces({ placeType: "bar" });
        
        const allOsmPlaces = [...osmRestaurants, ...osmFastFood, ...osmCafe, ...osmBar];
        const osmTransformed = allOsmPlaces.map((p, i) => transformOsmToRestaurant(p, i));
        restaurants = [...restaurants, ...osmTransformed];
      } catch (osmError) {
        console.error("Erreur chargement OSM restaurants:", osmError);
      }

      if (search) {
        const query = (search as string).toLowerCase();
        restaurants = restaurants.filter(r =>
          r.nom.toLowerCase().includes(query) ||
          r.ville?.toLowerCase().includes(query) ||
          r.quartier?.toLowerCase().includes(query) ||
          r.type?.toLowerCase().includes(query) ||
          (r.specialites && r.specialites.some((s: string) => s.toLowerCase().includes(query)))
        );
      }

      if (region && region !== "all") {
        restaurants = restaurants.filter(r => r.region === region);
      }

      if (type && type !== "all") {
        restaurants = restaurants.filter(r => r.type === type);
      }

      if (gammePrix && gammePrix !== "all") {
        restaurants = restaurants.filter(r => r.gammePrix === gammePrix);
      }

      if (livraison === "true") {
        restaurants = restaurants.filter(r => r.livraison);
      }

      if (wifi === "true") {
        restaurants = restaurants.filter(r => r.wifi);
      }

      res.set('Cache-Control', 'public, max-age=3600');
      res.json(restaurants);
    } catch (error) {
      console.error("Erreur récupération restaurants:", error);
      res.status(500).json({ error: "Erreur lors de la récupération des restaurants" });
    }
  });

  app.get("/api/restaurants/stats", async (req, res) => {
    try {
      const { RESTAURANTS_DATA } = await import("./restaurantsData");
      
      // Compter les données OSM
      let osmCount = 0;
      try {
        const osmRestaurants = await overpassService.getPlaces({ placeType: "restaurant" });
        const osmCafes = await overpassService.getPlaces({ placeType: "cafe" });
        const osmBars = await overpassService.getPlaces({ placeType: "bar" });
        const osmFastFood = await overpassService.getPlaces({ placeType: "fast_food" });
        osmCount = osmRestaurants.length + osmCafes.length + osmBars.length + osmFastFood.length;
      } catch (e) {}
      
      const total = RESTAURANTS_DATA.length + osmCount;
      const avecWifi = RESTAURANTS_DATA.filter(r => r.wifi).length;
      const avecLivraison = RESTAURANTS_DATA.filter(r => r.livraison).length;
      const cuisineLocale = RESTAURANTS_DATA.filter(r => r.type === "Burkinabè" || r.type === "Africain").length;
      
      res.json({
        total,
        localCount: RESTAURANTS_DATA.length,
        osmCount,
        avecWifi,
        avecLivraison,
        cuisineLocale
      });
    } catch (error) {
      console.error("Erreur stats restaurants:", error);
      res.status(500).json({ error: "Erreur lors de la récupération des statistiques" });
    }
  });

  // ----------------------------------------
  // ROUTES MARCHÉS
  // ----------------------------------------
  app.get("/api/marches", async (req, res) => {
    try {
      const { MARCHES_DATA } = await import("./marchesData");
      const { region, type, search } = req.query;

      // Récupérer les données codées en dur
      let marches: any[] = [...MARCHES_DATA];

      // Ajouter les données OSM (marketplaces)
      try {
        const osmMarches = await overpassService.getPlaces({ placeType: "marketplace" });
        const osmTransformed = osmMarches.map(p => transformOsmToMarche(p));
        marches = [...marches, ...osmTransformed];
      } catch (osmError) {
        console.error("Erreur chargement OSM marchés:", osmError);
      }

      if (search) {
        const query = (search as string).toLowerCase();
        marches = marches.filter(m =>
          m.nom.toLowerCase().includes(query) ||
          m.ville?.toLowerCase().includes(query) ||
          m.quartier?.toLowerCase().includes(query) ||
          m.type?.toLowerCase().includes(query) ||
          (m.produits && m.produits.some((p: string) => p.toLowerCase().includes(query)))
        );
      }

      if (region && region !== "all") {
        marches = marches.filter(m => m.region === region);
      }

      if (type && type !== "all") {
        marches = marches.filter(m => m.type === type);
      }

      res.set('Cache-Control', 'public, max-age=3600');
      res.json(marches);
    } catch (error) {
      console.error("Erreur récupération marchés:", error);
      res.status(500).json({ error: "Erreur lors de la récupération des marchés" });
    }
  });

  app.get("/api/marches/stats", async (req, res) => {
    try {
      const { MARCHES_DATA } = await import("./marchesData");
      
      // Compter les données OSM
      let osmCount = 0;
      try {
        const osmMarches = await overpassService.getPlaces({ placeType: "marketplace" });
        osmCount = osmMarches.length;
      } catch (e) {}
      
      const total = MARCHES_DATA.length + osmCount;
      const regions = [...new Set(MARCHES_DATA.map(m => m.region))].length;
      
      res.json({
        total,
        localCount: MARCHES_DATA.length,
        osmCount,
        regions,
        source: "OSM + Local"
      });
    } catch (error) {
      console.error("Erreur stats marchés:", error);
      res.status(500).json({ error: "Erreur lors de la récupération des statistiques" });
    }
  });

  // ----------------------------------------
  // ROUTES BOUTIQUES
  // ----------------------------------------
  app.get("/api/boutiques", async (req, res) => {
    try {
      const { BOUTIQUES_DATA } = await import("./boutiquesData");
      const { region, categorie, search, livraison, climatisation } = req.query;

      // Récupérer les données codées en dur
      let boutiques: any[] = [...BOUTIQUES_DATA];

      // Ajouter les données OSM (type "shop" dans la base)
      try {
        const osmShops = await overpassService.getPlaces({ placeType: "shop" });
        const osmTransformed = osmShops.map(p => transformOsmToBoutique(p));
        boutiques = [...boutiques, ...osmTransformed];
      } catch (osmError) {
        console.error("Erreur chargement OSM boutiques:", osmError);
      }

      if (search) {
        const query = (search as string).toLowerCase();
        boutiques = boutiques.filter(b =>
          b.nom.toLowerCase().includes(query) ||
          b.ville?.toLowerCase().includes(query) ||
          b.quartier?.toLowerCase().includes(query) ||
          b.categorie?.toLowerCase().includes(query) ||
          (b.produits && b.produits.some((p: string) => p.toLowerCase().includes(query))) ||
          (b.marques && b.marques.some((m: string) => m.toLowerCase().includes(query)))
        );
      }

      if (region && region !== "all") {
        boutiques = boutiques.filter(b => b.region === region);
      }

      if (categorie && categorie !== "all") {
        boutiques = boutiques.filter(b => b.categorie === categorie);
      }

      if (livraison === "true") {
        boutiques = boutiques.filter(b => b.livraison);
      }

      if (climatisation === "true") {
        boutiques = boutiques.filter(b => b.climatisation);
      }

      res.set('Cache-Control', 'public, max-age=3600');
      res.json(boutiques);
    } catch (error) {
      console.error("Erreur récupération boutiques:", error);
      res.status(500).json({ error: "Erreur lors de la récupération des boutiques" });
    }
  });

  app.get("/api/boutiques/stats", async (req, res) => {
    try {
      const { BOUTIQUES_DATA } = await import("./boutiquesData");
      
      // Compter les données OSM (type "shop" dans la base)
      let osmCount = 0;
      try {
        const osmShops = await overpassService.getPlaces({ placeType: "shop" });
        osmCount = osmShops.length;
      } catch (e) {}
      
      const total = BOUTIQUES_DATA.length + osmCount;
      
      res.json({
        total,
        localCount: BOUTIQUES_DATA.length,
        osmCount,
        source: "OSM + Local"
      });
    } catch (error) {
      console.error("Erreur stats boutiques:", error);
      res.status(500).json({ error: "Erreur lors de la récupération des statistiques" });
    }
  });

  // ----------------------------------------
  // ROUTES BANQUES ET CAISSES POPULAIRES
  // ----------------------------------------
  app.get("/api/banques", async (req, res) => {
    try {
      const { BANQUES_DATA } = await import("./banquesData");
      const { region, type, categorie, search, hasGAB, importanceSystemique } = req.query;

      // Récupérer les données codées en dur
      let banques: any[] = [...BANQUES_DATA];

      // Ajouter les données OSM (banques, bureaux de change, transferts d'argent)
      try {
        const osmBanks = await overpassService.getPlaces({ placeType: "bank" });
        const osmBureauChange = await overpassService.getPlaces({ placeType: "bureau_de_change" });
        const osmMoneyTransfer = await overpassService.getPlaces({ placeType: "money_transfer" });
        
        const allOsmPlaces = [...osmBanks, ...osmBureauChange, ...osmMoneyTransfer];
        const osmTransformed = allOsmPlaces.map(p => transformOsmToBanque(p));
        banques = [...banques, ...osmTransformed];
      } catch (osmError) {
        console.error("Erreur chargement OSM banques:", osmError);
      }

      if (search) {
        const query = (search as string).toLowerCase();
        banques = banques.filter(b =>
          b.nom.toLowerCase().includes(query) ||
          b.sigle?.toLowerCase().includes(query) ||
          b.ville?.toLowerCase().includes(query) ||
          b.quartier?.toLowerCase().includes(query) ||
          b.type?.toLowerCase().includes(query) ||
          (b.services && b.services.some((s: string) => s.toLowerCase().includes(query)))
        );
      }

      if (region && region !== "all") {
        banques = banques.filter(b => b.region === region);
      }

      if (type && type !== "all") {
        banques = banques.filter(b => b.type === type);
      }

      if (categorie && categorie !== "all") {
        banques = banques.filter(b => b.categorie === categorie);
      }

      if (hasGAB === "true") {
        banques = banques.filter(b => b.hasGAB || b.nombreGAB > 0);
      }

      if (importanceSystemique === "true") {
        banques = banques.filter(b => b.importanceSystemique);
      }

      res.set('Cache-Control', 'public, max-age=3600');
      res.json(banques);
    } catch (error) {
      console.error("Erreur récupération banques:", error);
      res.status(500).json({ error: "Erreur lors de la récupération des banques" });
    }
  });

  app.get("/api/banques/stats", async (req, res) => {
    try {
      const { BANQUES_DATA } = await import("./banquesData");
      
      // Récupérer les données OSM
      let osmBanques: any[] = [];
      try {
        const osmBanks = await overpassService.getPlaces({ placeType: "bank" });
        const osmBureauChange = await overpassService.getPlaces({ placeType: "bureau_de_change" });
        const osmMoneyTransfer = await overpassService.getPlaces({ placeType: "money_transfer" });
        osmBanques = [...osmBanks, ...osmBureauChange, ...osmMoneyTransfer].map(p => transformOsmToBanque(p));
      } catch (e) {}
      
      // Combiner les données locales et OSM
      const allBanques = [...BANQUES_DATA, ...osmBanques];
      
      // Calculer les statistiques attendues par le frontend
      const banques = allBanques.filter(b => b.type === "Banque").length;
      const caissesPopulaires = allBanques.filter(b => b.type === "Caisse Populaire").length;
      const microfinance = allBanques.filter(b => b.type === "Microfinance").length;
      const avecGAB = allBanques.filter(b => b.hasGAB || (b.nombreGAB && b.nombreGAB > 0)).length;
      const totalGAB = allBanques.reduce((sum, b) => sum + (b.nombreGAB || 0), 0);
      const importanceSystemique = allBanques.filter(b => b.importanceSystemique).length;
      
      // Répartitions
      const parType: Record<string, number> = {};
      const parCategorie: Record<string, number> = {};
      const parRegion: Record<string, number> = {};
      const villes = new Set<string>();
      
      allBanques.forEach(b => {
        if (b.type) parType[b.type] = (parType[b.type] || 0) + 1;
        if (b.categorie) parCategorie[b.categorie] = (parCategorie[b.categorie] || 0) + 1;
        if (b.region) parRegion[b.region] = (parRegion[b.region] || 0) + 1;
        if (b.ville) villes.add(b.ville);
      });
      
      res.json({
        total: allBanques.length,
        banques,
        caissesPopulaires,
        microfinance,
        avecGAB,
        totalGAB,
        totalAgences: allBanques.length,
        importanceSystemique,
        parType,
        parCategorie,
        parRegion,
        nombreVilles: villes.size,
        localCount: BANQUES_DATA.length,
        osmCount: osmBanques.length,
        source: "OSM + Local"
      });
    } catch (error) {
      console.error("Erreur stats banques:", error);
      res.status(500).json({ error: "Erreur lors de la récupération des statistiques" });
    }
  });

  // ----------------------------------------
  // ROUTES PHARMACIES (nouvelle version avec données hardcodées)
  // ----------------------------------------
  app.get("/api/pharmacies/v2", async (req, res) => {
    try {
      const { PHARMACIES_DATA } = await import("./pharmaciesData");
      const { region, type, search, is24h, gardeNuit } = req.query;

      let pharmacies = [...PHARMACIES_DATA];

      if (search) {
        const query = (search as string).toLowerCase();
        pharmacies = pharmacies.filter(p =>
          p.nom.toLowerCase().includes(query) ||
          p.ville.toLowerCase().includes(query) ||
          p.quartier.toLowerCase().includes(query) ||
          p.type.toLowerCase().includes(query) ||
          p.services.some(s => s.toLowerCase().includes(query)) ||
          p.specialites.some(s => s.toLowerCase().includes(query))
        );
      }

      if (region && region !== "all") {
        pharmacies = pharmacies.filter(p => p.region === region);
      }

      if (type && type !== "all") {
        pharmacies = pharmacies.filter(p => p.type === type);
      }

      if (is24h === "true") {
        pharmacies = pharmacies.filter(p => p.is24h);
      }

      if (gardeNuit === "true") {
        pharmacies = pharmacies.filter(p => p.gardeNuit);
      }

      res.set('Cache-Control', 'public, max-age=3600');
      res.json(pharmacies);
    } catch (error) {
      console.error("Erreur récupération pharmacies v2:", error);
      res.status(500).json({ error: "Erreur lors de la récupération des pharmacies" });
    }
  });

  app.get("/api/pharmacies/v2/stats", async (req, res) => {
    try {
      const { getPharmaciesStats } = await import("./pharmaciesData");
      const stats = getPharmaciesStats();
      res.json(stats);
    } catch (error) {
      console.error("Erreur stats pharmacies v2:", error);
      res.status(500).json({ error: "Erreur lors de la récupération des statistiques" });
    }
  });

  // ----------------------------------------
  // ROUTES STATIONS-SERVICE
  // ----------------------------------------
  app.get("/api/stations", async (req, res) => {
    try {
      const { stationsService } = await import("./stationsService");
      const { region, marque, ville, search, is24h } = req.query;

      // Récupérer les données du service existant
      let stations: any[] = stationsService.getAllStations();

      // Ajouter les données OSM (fuel, car_wash)
      try {
        const osmFuel = await overpassService.getPlaces({ placeType: "fuel" });
        const osmCarWash = await overpassService.getPlaces({ placeType: "car_wash" });
        
        const allOsmPlaces = [...osmFuel, ...osmCarWash];
        const osmTransformed = allOsmPlaces.map(p => transformOsmToStation(p));
        stations = [...stations, ...osmTransformed];
      } catch (osmError) {
        console.error("Erreur chargement OSM stations:", osmError);
      }

      // Appliquer les filtres
      if (search) {
        const query = (search as string).toLowerCase();
        stations = stations.filter(s =>
          s.nom?.toLowerCase().includes(query) ||
          s.ville?.toLowerCase().includes(query) ||
          s.quartier?.toLowerCase().includes(query) ||
          s.marque?.toLowerCase().includes(query) ||
          s.adresse?.toLowerCase().includes(query)
        );
      }

      if (region && region !== "all") {
        stations = stations.filter(s => s.region === region);
      }

      if (marque && marque !== "all") {
        stations = stations.filter(s => s.marque === marque);
      }

      if (ville) {
        stations = stations.filter(s => s.ville?.toLowerCase().includes((ville as string).toLowerCase()));
      }

      if (is24h === "true") {
        stations = stations.filter(s => s.is24h);
      }

      res.set('Cache-Control', 'public, max-age=3600');
      res.json(stations);
    } catch (error) {
      console.error("Erreur récupération stations:", error);
      res.status(500).json({ error: "Erreur lors de la récupération des stations" });
    }
  });

  app.get("/api/stations/stats", async (req, res) => {
    try {
      const { stationsService } = await import("./stationsService");
      const localStats = stationsService.getStats();
      
      // Compter les données OSM
      let osmCount = 0;
      try {
        const osmFuel = await overpassService.getPlaces({ placeType: "fuel" });
        const osmCarWash = await overpassService.getPlaces({ placeType: "car_wash" });
        osmCount = osmFuel.length + osmCarWash.length;
      } catch (e) {}
      
      res.json({
        ...localStats,
        total: localStats.total + osmCount,
        osmCount,
        source: "OSM + Local"
      });
    } catch (error) {
      console.error("Erreur stats stations:", error);
      res.status(500).json({ error: "Erreur lors de la récupération des statistiques" });
    }
  });

  app.post("/api/stations/refresh", async (req, res) => {
    try {
      const { stationsService } = await import("./stationsService");
      stationsService.markAsUpdated();
      const stats = stationsService.getStats();
      res.json({ 
        message: "Données des stations-service actualisées",
        ...stats
      });
    } catch (error) {
      console.error("Erreur actualisation stations:", error);
      res.status(500).json({ error: "Erreur lors de l'actualisation" });
    }
  });

  // ----------------------------------------
  // ROUTES LIEUX VÉRIFIÉS (OpenStreetMap)
  // ----------------------------------------
  app.get("/api/places", async (req, res) => {
    try {
      const { placeType, region, ville, search, verificationStatus, limit, offset } = req.query;
      
      const places = await overpassService.getPlaces({
        placeType: placeType as string,
        region: region as string,
        ville: ville as string,
        search: search as string,
        verificationStatus: verificationStatus as string,
        limit: limit ? parseInt(limit as string) : undefined,
        offset: offset ? parseInt(offset as string) : undefined,
      });

      res.set('Cache-Control', 'public, max-age=300');
      res.json(places);
    } catch (error) {
      console.error("Erreur récupération places:", error);
      res.status(500).json({ error: "Erreur lors de la récupération des lieux" });
    }
  });

  app.get("/api/places/stats", async (req, res) => {
    try {
      const stats = await overpassService.getStats();
      res.json(stats);
    } catch (error) {
      console.error("Erreur stats places:", error);
      res.status(500).json({ error: "Erreur lors de la récupération des statistiques" });
    }
  });

  app.get("/api/places/:id", async (req, res) => {
    try {
      const place = await overpassService.getPlaceById(req.params.id);
      if (!place) {
        return res.status(404).json({ error: "Lieu non trouvé" });
      }
      res.json(place);
    } catch (error) {
      console.error("Erreur récupération place:", error);
      res.status(500).json({ error: "Erreur lors de la récupération du lieu" });
    }
  });

  app.get("/api/places/:id/verifications", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.json({ confirmed: false, reported: false });
      }
      
      const verifications = await overpassService.getUserVerifications(req.params.id, userId);
      res.json(verifications);
    } catch (error) {
      console.error("Erreur récupération verifications:", error);
      res.status(500).json({ error: "Erreur lors de la récupération des vérifications" });
    }
  });

  app.post("/api/places/:id/confirm", async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub || null;
      const ipAddress = req.ip || req.connection?.remoteAddress || "unknown";
      
      const success = await overpassService.confirmPlace(req.params.id, userId, ipAddress);
      
      if (!success) {
        return res.status(400).json({ error: "Vous avez déjà confirmé ce lieu" });
      }
      
      res.json({ message: "Confirmation enregistrée", success: true });
    } catch (error) {
      console.error("Erreur confirmation place:", error);
      res.status(500).json({ error: "Erreur lors de la confirmation" });
    }
  });

  app.post("/api/places/:id/report", async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub || null;
      const ipAddress = req.ip || req.connection?.remoteAddress || "unknown";
      const { comment } = req.body;
      
      const success = await overpassService.reportPlace(req.params.id, userId, comment, ipAddress);
      
      if (!success) {
        return res.status(400).json({ error: "Vous avez déjà signalé ce lieu" });
      }
      
      res.json({ message: "Signalement enregistré", success: true });
    } catch (error) {
      console.error("Erreur signalement place:", error);
      res.status(500).json({ error: "Erreur lors du signalement" });
    }
  });

  app.post("/api/places/sync", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const user = await storage.getUser(userId);
      
      if (user?.role !== "admin") {
        return res.status(403).json({ error: "Accès non autorisé" });
      }

      overpassService.syncAllPlaces().catch(console.error);
      res.json({ message: "Synchronisation OpenStreetMap lancée en arrière-plan" });
    } catch (error) {
      console.error("Erreur sync places:", error);
      res.status(500).json({ error: "Erreur lors de la synchronisation" });
    }
  });

  // Extended fuel station sync - more thorough with region-based queries
  app.post("/api/stations/sync-extended", async (req: any, res) => {
    try {
      res.json({ message: "Synchronisation étendue des stations-service lancée en arrière-plan" });
      
      // Run in background
      overpassService.syncFuelStationsExtended().then(result => {
        console.log("⛽ Extended fuel sync result:", result);
      }).catch(console.error);
    } catch (error) {
      console.error("Erreur sync stations:", error);
      res.status(500).json({ error: "Erreur lors de la synchronisation" });
    }
  });

  // ----------------------------------------
  // ROUTES BULLETIN CITOYEN (RSS)
  // ----------------------------------------
  app.get("/api/bulletin-citoyen", async (req, res) => {
    try {
      const bulletins = await fetchBulletins();
      res.json(bulletins);
    } catch (error) {
      console.error("Erreur bulletin citoyen:", error);
      res.status(500).json({ error: "Erreur lors de la récupération des bulletins" });
    }
  });

  app.post("/api/bulletin-citoyen/refresh", async (req, res) => {
    try {
      clearCache();
      const bulletins = await fetchBulletins();
      res.json({ message: "Cache actualisé", count: bulletins.length });
    } catch (error) {
      console.error("Erreur actualisation bulletin:", error);
      res.status(500).json({ error: "Erreur lors de l'actualisation" });
    }
  });

  // ----------------------------------------
  // ROUTES BURKINA EVENTS
  // ----------------------------------------
  app.get("/api/events-burkina", async (req, res) => {
    try {
      const events = await fetchEvents();
      res.json(events);
    } catch (error) {
      console.error("Erreur events:", error);
      res.status(500).json({ error: "Erreur lors de la récupération des événements" });
    }
  });

  app.post("/api/events-burkina/refresh", async (req, res) => {
    try {
      clearEventsCache();
      const events = await fetchEvents();
      res.json({ message: "Cache actualisé", count: events.length });
    } catch (error) {
      console.error("Erreur actualisation events:", error);
      res.status(500).json({ error: "Erreur lors de l'actualisation" });
    }
  });

  // ----------------------------------------
  // ROUTES URGENCES
  // ----------------------------------------
  app.get("/api/urgences", async (req, res) => {
    try {
      const { urgenciesService } = await import("./urgenciesService");
      const { type, city, region, search } = req.query;

      let services;

      if (search) {
        services = urgenciesService.searchEmergencies(search as string);
      } else if (type) {
        services = urgenciesService.getEmergenciesByType(type as any);
      } else if (city) {
        services = urgenciesService.getEmergenciesByCity(city as string);
      } else if (region) {
        services = urgenciesService.getEmergenciesByRegion(region as string);
      } else {
        services = urgenciesService.getAllEmergencies();
      }

      res.set('Cache-Control', 'public, max-age=3600'); // Cache 1 heure
      res.json(services);
    } catch (error) {
      console.error("Erreur récupération urgences:", error);
      res.status(500).json({ error: "Erreur lors de la récupération des services d'urgence" });
    }
  });

  app.get("/api/urgences/stats", async (req, res) => {
    try {
      const { urgenciesService } = await import("./urgenciesService");
      const stats = urgenciesService.getStats();
      res.json(stats);
    } catch (error) {
      console.error("Erreur stats urgences:", error);
      res.status(500).json({ error: "Erreur lors de la récupération des statistiques" });
    }
  });

  app.post("/api/urgences/refresh", async (req, res) => {
    try {
      const { urgenciesService } = await import("./urgenciesService");
      urgenciesService.markAsUpdated();
      const stats = urgenciesService.getStats();
      res.json({ 
        message: "Données des urgences actualisées",
        ...stats
      });
    } catch (error) {
      console.error("Erreur actualisation urgences:", error);
      res.status(500).json({ error: "Erreur lors de l'actualisation" });
    }
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

  // ----------------------------------------
  // ROUTES STREETVIEW (Mode Anonyme)
  // ----------------------------------------

  // Récupérer le token Mapillary pour le frontend
  app.get("/api/config/mapillary-token", (req, res) => {
    const token = process.env.MAPILLARY_ACCESS_TOKEN;
    if (!token) {
      return res.status(500).json({ error: "Token Mapillary non configuré" });
    }
    res.json({ token });
  });

  // Récupérer tous les points streetview pour la carte
  app.get("/api/streetview/map-points", async (req, res) => {
    try {
      const points = await storage.getStreetviewPoints();
      // Ne renvoyer que les données nécessaires (sans imageData complète pour performance)
      const mapPoints = points.map(p => ({
        id: p.id,
        latitude: p.latitude,
        longitude: p.longitude,
        thumbnailData: p.thumbnailData,
        imageData: p.imageData,
        heading: p.heading,
        pitch: p.pitch,
        capturedAt: p.capturedAt,
      }));
      res.json(mapPoints);
    } catch (error) {
      console.error("Erreur récupération points streetview:", error);
      res.status(500).json({ error: "Erreur lors de la récupération des points" });
    }
  });

  // Upload d'une image streetview (anonyme - pas d'auth requise)
  app.post("/api/streetview/upload", async (req, res) => {
    try {
      const { imageData, thumbnailData, latitude, longitude, heading, pitch } = req.body;

      if (!imageData || !latitude || !longitude) {
        return res.status(400).json({ error: "Données manquantes (image, latitude, longitude)" });
      }

      // Validation des coordonnées
      const lat = parseFloat(latitude);
      const lng = parseFloat(longitude);
      if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        return res.status(400).json({ error: "Coordonnées invalides" });
      }

      // Limite taille image optimisée (max 2MB en base64 après compression)
      const imageSizeMB = imageData.length / (1024 * 1024);
      if (imageSizeMB > 2) {
        return res.status(400).json({ 
          error: `Image trop volumineuse (${imageSizeMB.toFixed(1)}MB). Maximum: 2MB. Utilisez la compression intégrée.` 
        });
      }

      // Vérifier que l'image est bien un JPEG compressé
      if (!imageData.startsWith('data:image/jpeg')) {
        return res.status(400).json({ error: "Format invalide. Utilisez JPEG uniquement." });
      }

      const point = await storage.createStreetviewPoint({
        imageData,
        thumbnailData: thumbnailData || null,
        latitude: latitude.toString(),
        longitude: longitude.toString(),
        heading: heading ? heading.toString() : null,
        pitch: pitch ? pitch.toString() : null,
        deviceInfo: null, // Aucune info device stockée pour anonymat
      });

      console.log(`✅ Photo streetview uploadée: ${point.id} (${imageSizeMB.toFixed(2)}MB)`);
      res.status(201).json({ success: true, id: point.id });
    } catch (error) {
      console.error("Erreur upload streetview:", error);
      res.status(500).json({ error: "Erreur lors de l'upload" });
    }
  });

  // ----------------------------------------
  // ROUTES VIRTUAL TOURS (Tours virtuels)
  // ----------------------------------------

  // Récupérer tous les tours virtuels
  app.get("/api/virtual-tours", async (req, res) => {
    try {
      const tours = await storage.getVirtualTours();
      res.json(tours);
    } catch (error) {
      console.error("Erreur récupération tours virtuels:", error);
      res.status(500).json({ error: "Erreur lors de la récupération des tours" });
    }
  });

  // Récupérer un tour avec ses photos
  app.get("/api/virtual-tours/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const tour = await storage.getVirtualTourWithPhotos(id);
      
      if (!tour) {
        return res.status(404).json({ error: "Tour non trouvé" });
      }

      // Incrémenter le compteur de vues
      await storage.incrementTourViewCount(id);
      
      res.json(tour);
    } catch (error) {
      console.error("Erreur récupération tour:", error);
      res.status(500).json({ error: "Erreur lors de la récupération du tour" });
    }
  });

  // Créer un nouveau tour virtuel avec ses photos (rate limited)
  app.post("/api/virtual-tours", signalementMutationLimiter, async (req, res) => {
    try {
      const { name, description, quartier, latitude, longitude, photos } = req.body;

      if (!name || !latitude || !longitude) {
        return res.status(400).json({ error: "Nom et coordonnées requis" });
      }

      if (!photos || !Array.isArray(photos) || photos.length === 0) {
        return res.status(400).json({ error: "Au moins une photo requise" });
      }

      // Limite du nombre de photos par tour
      const MAX_PHOTOS_PER_TOUR = 20;
      if (photos.length > MAX_PHOTOS_PER_TOUR) {
        return res.status(400).json({ 
          error: `Maximum ${MAX_PHOTOS_PER_TOUR} photos par tour` 
        });
      }

      // Vérifier la taille des images
      for (const photo of photos) {
        if (!photo.imageData || !photo.imageData.startsWith('data:image/')) {
          return res.status(400).json({ error: "Format d'image invalide" });
        }
        const sizeMB = photo.imageData.length / (1024 * 1024);
        if (sizeMB > 2) {
          return res.status(400).json({ 
            error: `Une image est trop volumineuse (${sizeMB.toFixed(1)}MB). Maximum: 2MB` 
          });
        }
      }

      // Préparer les photos pour la création
      const photoData = photos.map((photo: { imageData: string; thumbnailData?: string }) => ({
        imageData: photo.imageData,
        thumbnailData: photo.thumbnailData || null,
        latitude: latitude.toString(),
        longitude: longitude.toString(),
        heading: null,
        pitch: null,
        deviceInfo: null,
      }));

      const tour = await storage.createVirtualTour(
        {
          name: name.slice(0, 100), // Limiter le nom
          description: description ? description.slice(0, 500) : null,
          quartier: quartier ? quartier.slice(0, 100) : null,
          latitude: latitude.toString(),
          longitude: longitude.toString(),
          coverPhotoId: null,
          isPublished: true,
        },
        photoData
      );

      console.log(`✅ Tour virtuel créé: ${tour.id} - "${name}" (${photos.length} photos)`);
      res.status(201).json(tour);
    } catch (error) {
      console.error("Erreur création tour virtuel:", error);
      res.status(500).json({ error: "Erreur lors de la création du tour" });
    }
  });

  // ----------------------------------------
  // ROUTES OUAGA EN 3D
  // ----------------------------------------
  const { ouaga3dService } = await import("./services/ouaga3dService");

  app.get("/api/ouaga3d/stats", async (req, res) => {
    try {
      const stats = await ouaga3dService.getOuaga3dStats();
      res.json(stats);
    } catch (error) {
      console.error("Erreur stats Ouaga3D:", error);
      res.status(500).json({ error: "Erreur lors de la récupération des statistiques" });
    }
  });

  app.get("/api/ouaga3d/assets", async (req, res) => {
    try {
      const { limit, offset, source } = req.query;
      const assets = await ouaga3dService.getImageAssets({
        limit: limit ? parseInt(limit as string) : 100,
        offset: offset ? parseInt(offset as string) : 0,
        source: source as string | undefined
      });
      res.json(assets);
    } catch (error) {
      console.error("Erreur assets Ouaga3D:", error);
      res.status(500).json({ error: "Erreur lors de la récupération des assets" });
    }
  });

  app.get("/api/ouaga3d/coverage", async (req, res) => {
    try {
      const coverage = await ouaga3dService.getCoverageData();
      res.json(coverage);
    } catch (error) {
      console.error("Erreur coverage Ouaga3D:", error);
      res.status(500).json({ error: "Erreur lors de la récupération de la couverture" });
    }
  });

  app.get("/api/ouaga3d/jobs", async (req, res) => {
    try {
      const jobs = await ouaga3dService.getRecentJobs(10);
      res.json(jobs);
    } catch (error) {
      console.error("Erreur jobs Ouaga3D:", error);
      res.status(500).json({ error: "Erreur lors de la récupération des jobs" });
    }
  });

  app.get("/api/ouaga3d/zones", (req, res) => {
    res.json({
      bounds: ouaga3dService.OUAGADOUGOU_BOUNDS,
      zones: ouaga3dService.OUAGADOUGOU_ZONES
    });
  });

  app.post("/api/ouaga3d/trigger-ingestion", isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== "admin") {
        return res.status(403).json({ error: "Accès réservé aux administrateurs" });
      }

      const result = await ouaga3dService.triggerManualIngestion();
      res.json(result);
    } catch (error) {
      console.error("Erreur trigger ingestion:", error);
      res.status(500).json({ error: "Erreur lors du déclenchement de l'ingestion" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}