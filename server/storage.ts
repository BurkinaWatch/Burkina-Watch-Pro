import {
  type User,
  type UpsertUser,
  type UpdateUserProfile,
  type Signalement,
  type SignalementWithAuthor,
  type InsertSignalement,
  type UpdateSignalement,
  type Commentaire,
  type InsertCommentaire,
  type TrackingSession,
  type InsertTrackingSession,
  type LocationPoint,
  type InsertLocationPoint,
  type InsertNotification,
  type Notification,
  type InsertEmergencyContact,
  type EmergencyContact,
  type InsertPanicAlert,
  type PanicAlert,
  type SignalementLike,
  type InsertChatMessage,
  type ChatMessage,
  type InsertAuditLog,
  type AuditLog,
  type InsertStreetviewPoint,
  type StreetviewPoint,
  type InsertVirtualTour,
  type VirtualTour,
  type VirtualTourWithPhotos,
  users,
  signalements,
  commentaires,
  trackingSessions,
  locationPoints,
  notifications,
  emergencyContacts,
  panicAlerts,
  signalementLikes,
  chatMessages,
  auditLogs,
  streetviewPoints,
  virtualTours,
  insertSignalementSchema,
  insertCommentaireSchema,
  updateSignalementSchema,
  updateUserProfileSchema,
  insertLocationPointSchema,
  insertNotificationSchema,
  onlineSessions,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql, isNull } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUserProfile(id: string, profile: UpdateUserProfile): Promise<User | undefined>;

  // Méthodes pour les signalements
  getSignalements(filters?: {
    categorie?: string;
    statut?: string;
    isSOS?: boolean;
    limit?: number;
  }): Promise<SignalementWithAuthor[]>;
  getUserSignalements(userId: string): Promise<SignalementWithAuthor[]>;
  getSignalement(id: string): Promise<Signalement | undefined>;
  createSignalement(signalement: InsertSignalement): Promise<Signalement>;
  updateSignalement(id: string, updates: UpdateSignalement): Promise<Signalement | undefined>;
  deleteSignalement(id: string): Promise<boolean>;
  updateSignalementStatut(id: string, statut: string): Promise<Signalement | undefined>;
  likeSignalement(signalementId: string, userId: string): Promise<{ signalement: Signalement | undefined; isLiked: boolean }>;
  shareSignalement(id: string): Promise<Signalement | undefined>;

  getCommentaires(signalementId: string): Promise<Commentaire[]>;
  createCommentaire(commentaire: InsertCommentaire): Promise<Commentaire>;

  getStats(): Promise<{
    totalSignalements: number;
    sosCount: number;
    totalUsers: number;
    onlineUsers: number; // Added for online users count
  }>;

  startTrackingSession(userId: string): Promise<TrackingSession>;
  stopTrackingSession(sessionId: string): Promise<TrackingSession | undefined>; // Changed parameter to sessionId
  getActiveTrackingSession(userId: string): Promise<TrackingSession | undefined>;
  addLocationPoint(locationPoint: InsertLocationPoint): Promise<LocationPoint>;
  getSessionLocationPoints(sessionId: string): Promise<LocationPoint[]>;
  getUserTrackingSessions(userId: string): Promise<TrackingSession[]>;
  deleteTrackingSession(sessionId: string): Promise<boolean>; // Added method

  // Méthodes pour les notifications
  createNotification(data: typeof insertNotificationSchema._type): Promise<any | undefined>;
  getUserNotifications(userId: string): Promise<any[]>;
  getUnreadNotificationsCount(userId: string): Promise<number>;
  markNotificationAsRead(notificationId: string): Promise<any | undefined>;
  markAllNotificationsAsRead(userId: string): Promise<void>;
  notifySignalementOwner(signalementId: string, type: string, title: string, description: string): Promise<void>;
  broadcastNotification(type: string, title: string, description: string, signalementId: string | null, excludeUserId?: string): Promise<void>;
  getNotificationById(notificationId: string): Promise<Notification | undefined>; // Added method
  deleteNotification(notificationId: string): Promise<boolean>; // Added method
  deleteAllUserNotifications(userId: string): Promise<void>; // Added method

  // Méthodes pour les contacts d'urgence et les alertes panique
  getEmergencyContacts(userId: string): Promise<EmergencyContact[]>;
  createEmergencyContact(contact: InsertEmergencyContact): Promise<EmergencyContact>;
  deleteEmergencyContact(contactId: string): Promise<boolean>;
  updateEmergencyContact(contactId: string, updates: Partial<InsertEmergencyContact>): Promise<EmergencyContact | undefined>;
  createPanicAlert(alert: InsertPanicAlert): Promise<PanicAlert>;
  getUserPanicAlerts(userId: string): Promise<PanicAlert[]>;

  // Méthodes pour les profils publics
  getUserById(userId: string): Promise<User | undefined>;
  getSignalementsByUserId(userId: string): Promise<Signalement[]>;

  // Méthodes pour le chatbot
  saveChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
  getChatHistory(sessionId: string): Promise<ChatMessage[]>;

  // Méthodes pour les points et le leaderboard
  awardPointsToUser(userId: string, points: number): Promise<{ user: User; levelChanged: boolean; newLevel: string }>;
  getTopUsersByPoints(limit?: number): Promise<Array<{ id: string; name: string | null; avatar: string | null; userPoints: number; userLevel: string }>>;
  syncUserPointsFromSignalements(userId: string): Promise<{ user: User; levelChanged: boolean; newLevel: string }>;

  // Méthode pour l'audit logging
  logAudit(data: {
    userId?: string;
    action: string;
    resourceType?: string;
    resourceId?: string;
    details?: Record<string, any>;
    ipAddress?: string;
    userAgent?: string;
    severity?: "info" | "warning" | "critical";
  }): Promise<AuditLog>;

  // --- New methods for online users ---
  userConnected(userId: string): Promise<void>;
  userDisconnected(userId: string): Promise<void>;
  countOnlineUsers(): Promise<number>;

  // --- StreetView Points ---
  getStreetviewPoints(): Promise<StreetviewPoint[]>;
  createStreetviewPoint(point: InsertStreetviewPoint): Promise<StreetviewPoint>;

  // --- Virtual Tours ---
  getVirtualTours(): Promise<VirtualTour[]>;
  getVirtualTourWithPhotos(tourId: string): Promise<VirtualTourWithPhotos | undefined>;
  createVirtualTour(tour: InsertVirtualTour, photos: InsertStreetviewPoint[]): Promise<VirtualTour>;
  incrementTourViewCount(tourId: string): Promise<void>;
}

export class DbStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return result[0];
  }

  async getUserById(userId: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    return result[0];
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async updateUserProfile(id: string, profile: UpdateUserProfile): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({
        ...profile,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  // Méthodes pour les signalements
  async getSignalements(filters?: {
    categorie?: string;
    statut?: string;
    isSOS?: boolean;
    limit?: number;
  }): Promise<SignalementWithAuthor[]> {
    let query = db
      .select({
        id: signalements.id,
        titre: signalements.titre,
        description: signalements.description,
        categorie: signalements.categorie,
        latitude: signalements.latitude,
        longitude: signalements.longitude,
        localisation: signalements.localisation,
        photo: signalements.photo,
        video: signalements.video,
        medias: signalements.medias,
        userId: signalements.userId,
        isAnonymous: signalements.isAnonymous,
        isSOS: signalements.isSOS,
        niveauUrgence: signalements.niveauUrgence,
        statut: signalements.statut,
        likes: signalements.likes,
        commentairesCount: signalements.commentairesCount,
        sharesCount: signalements.sharesCount,
        createdAt: signalements.createdAt,
        auteurFirstName: users.firstName,
        auteurLastName: users.lastName,
      })
      .from(signalements)
      .leftJoin(users, eq(signalements.userId, users.id));

    const conditions = [];
    if (filters?.categorie) {
      conditions.push(eq(signalements.categorie, filters.categorie));
    }
    if (filters?.statut) {
      conditions.push(eq(signalements.statut, filters.statut));
    }
    if (filters?.isSOS !== undefined) {
      conditions.push(eq(signalements.isSOS, filters.isSOS));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    query = query.orderBy(desc(signalements.createdAt)) as any;

    if (filters?.limit) {
      query = query.limit(filters.limit) as any;
    }

    return await query;
  }

  async getUserSignalements(userId: string): Promise<SignalementWithAuthor[]> {
    return await db
      .select({
        id: signalements.id,
        titre: signalements.titre,
        description: signalements.description,
        categorie: signalements.categorie,
        latitude: signalements.latitude,
        longitude: signalements.longitude,
        localisation: signalements.localisation,
        photo: signalements.photo,
        video: signalements.video,
        medias: signalements.medias,
        userId: signalements.userId,
        isAnonymous: signalements.isAnonymous,
        isSOS: signalements.isSOS,
        niveauUrgence: signalements.niveauUrgence,
        statut: signalements.statut,
        likes: signalements.likes,
        commentairesCount: signalements.commentairesCount,
        sharesCount: signalements.sharesCount,
        createdAt: signalements.createdAt,
        auteurFirstName: users.firstName,
        auteurLastName: users.lastName,
      })
      .from(signalements)
      .leftJoin(users, eq(signalements.userId, users.id))
      .where(eq(signalements.userId, userId))
      .orderBy(desc(signalements.createdAt));
  }

  async getSignalement(id: string): Promise<Signalement | undefined> {
    const result = await db.select().from(signalements).where(eq(signalements.id, id)).limit(1);
    return result[0];
  }

  async createSignalement(insertSignalement: InsertSignalement): Promise<Signalement> {
    const values = {
      ...insertSignalement,
      medias: insertSignalement.medias || []
    };
    const result = await db.insert(signalements).values(values).returning();
    return result[0];
  }

  async updateSignalement(id: string, updates: UpdateSignalement | any): Promise<Signalement | undefined> {
    const result = await db
      .update(signalements)
      .set(updates)
      .where(eq(signalements.id, id))
      .returning();
    return result[0];
  }

  async deleteSignalement(id: string): Promise<boolean> {
    try {
      // First delete all related notifications
      await db
        .delete(notifications)
        .where(eq(notifications.signalementId, id));

      // Then delete the signalement
      const result = await db
        .delete(signalements)
        .where(eq(signalements.id, id))
        .returning();

      return result.length > 0;
    } catch (error) {
      console.error("Error deleting signalement:", error);
      return false;
    }
  }

  async updateSignalementStatut(id: string, statut: string): Promise<Signalement | undefined> {
    return await db.transaction(async (tx) => {
      // Get the signalement before update to check if status is changing to "resolu"
      const [oldSignalement] = await tx
        .select()
        .from(signalements)
        .where(eq(signalements.id, id))
        .limit(1);

      if (!oldSignalement) {
        throw new Error("Signalement non trouvé");
      }

      // Update the signalement status
      const [result] = await tx
        .update(signalements)
        .set({ statut })
        .where(eq(signalements.id, id))
        .returning();

      // Award points if status changed from non-resolu to resolu
      if (oldSignalement.statut !== 'resolu' && statut === 'resolu' && oldSignalement.userId) {
        const { POINTS_CONFIG, calculateLevel } = await import("@shared/pointsSystem");

        const [author] = await tx
          .select()
          .from(users)
          .where(eq(users.id, oldSignalement.userId))
          .limit(1);

        if (!author) {
          // If author doesn't exist, we cannot award points -> rollback transaction
          throw new Error(`Impossible de résoudre le signalement : auteur ${oldSignalement.userId} introuvable`);
        }

        const newPoints = author.userPoints + POINTS_CONFIG.VERIFIED_SIGNALEMENT;
        const newLevel = calculateLevel(newPoints);

        await tx
          .update(users)
          .set({
            userPoints: newPoints,
            userLevel: newLevel,
          })
          .where(eq(users.id, oldSignalement.userId));

        console.log(`✅ Points attribués: +${POINTS_CONFIG.VERIFIED_SIGNALEMENT} points à l'utilisateur ${oldSignalement.userId} (signalement résolu)`);
      }

      return result;
    });
  }

  async likeSignalement(signalementId: string, userId: string): Promise<{ signalement: Signalement | undefined; isLiked: boolean }> {
    try {
      return await db.transaction(async (tx) => {
        // Get the signalement to know its author
        const [signalement] = await tx
          .select()
          .from(signalements)
          .where(eq(signalements.id, signalementId))
          .limit(1);

        if (!signalement) {
          throw new Error("Signalement non trouvé");
        }

        // Check if like already exists
        const existingLike = await tx
          .select()
          .from(signalementLikes)
          .where(and(
            eq(signalementLikes.signalementId, signalementId),
            eq(signalementLikes.userId, userId)
          ))
          .limit(1);

        let isLiked: boolean;
        let updated: Signalement | undefined;
        const { POINTS_CONFIG, calculateLevel } = await import("@shared/pointsSystem");

        if (existingLike.length > 0) {
          // Unlike: delete the like and decrement counter
          await tx
            .delete(signalementLikes)
            .where(and(
              eq(signalementLikes.signalementId, signalementId),
              eq(signalementLikes.userId, userId)
            ));

          const [result] = await tx
            .update(signalements)
            .set({ likes: sql`GREATEST(0, ${signalements.likes} - 1)` })
            .where(eq(signalements.id, signalementId))
            .returning();

          updated = result;
          isLiked = false;

          // Remove points from author (-5 points)
          if (signalement.userId && signalement.userId !== userId) {
            const [author] = await tx
              .select()
              .from(users)
              .where(eq(users.id, signalement.userId))
              .limit(1);

            if (author) {
              const newPoints = Math.max(0, author.userPoints - POINTS_CONFIG.CITIZEN_CONFIRMATION);
              const newLevel = calculateLevel(newPoints);

              await tx
                .update(users)
                .set({
                  userPoints: newPoints,
                  userLevel: newLevel,
                })
                .where(eq(users.id, signalement.userId));
            }
          }
        } else {
          // Like: insert like and increment counter
          await tx.insert(signalementLikes).values({
            signalementId,
            userId,
          });

          const [result] = await tx
            .update(signalements)
            .set({ likes: sql`${signalements.likes} + 1` })
            .where(eq(signalements.id, signalementId))
            .returning();

          updated = result;
          isLiked = true;

          // Award points to author (+5 points)
          if (signalement.userId && signalement.userId !== userId) {
            const [author] = await tx
              .select()
              .from(users)
              .where(eq(users.id, signalement.userId))
              .limit(1);

            if (author) {
              const newPoints = author.userPoints + POINTS_CONFIG.CITIZEN_CONFIRMATION;
              const newLevel = calculateLevel(newPoints);

              await tx
                .update(users)
                .set({
                  userPoints: newPoints,
                  userLevel: newLevel,
                })
                .where(eq(users.id, signalement.userId));
            }
          }
        }

        return { signalement: updated, isLiked };
      });
    } catch (error: any) {
      // Handle unique constraint violation
      if (error?.code === '23505' || error?.message?.includes('duplicate key')) {
        // Duplicate like attempt - treat as idempotent by returning current state
        const [signalement] = await db
          .select()
          .from(signalements)
          .where(eq(signalements.id, signalementId))
          .limit(1);

        const existingLike = await db
          .select()
          .from(signalementLikes)
          .where(and(
            eq(signalementLikes.signalementId, signalementId),
            eq(signalementLikes.userId, userId)
          ))
          .limit(1);

        return {
          signalement,
          isLiked: existingLike.length > 0
        };
      }
      throw error;
    }
  }

  async shareSignalement(id: string): Promise<Signalement | undefined> {
    const [signalement] = await db
      .select()
      .from(signalements)
      .where(eq(signalements.id, id))
      .limit(1);

    if (!signalement) return undefined;

    const [updated] = await db
      .update(signalements)
      .set({ sharesCount: sql`${signalements.sharesCount} + 1` })
      .where(eq(signalements.id, id))
      .returning();

    return updated;
  }

  async getCommentaires(signalementId: string): Promise<Commentaire[]> {
    return await db
      .select()
      .from(commentaires)
      .where(eq(commentaires.signalementId, signalementId))
      .orderBy(desc(commentaires.createdAt));
  }

  async createCommentaire(insertCommentaire: InsertCommentaire): Promise<Commentaire> {
    const result = await db.insert(commentaires).values(insertCommentaire).returning();

    await db
      .update(signalements)
      .set({ commentairesCount: sql`${signalements.commentairesCount} + 1` })
      .where(eq(signalements.id, insertCommentaire.signalementId));

    return result[0];
  }

  async getStats(): Promise<{
    totalSignalements: number;
    sosCount: number;
    totalUsers: number;
    onlineUsers: number;
  }> {
    const [totalSignalementsResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(signalements);

    const [sosCountResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(signalements)
      .where(eq(signalements.isSOS, true));

    const [totalUsersResult] = await db
      .select({ count: sql<number>`count(distinct email)::int` })
      .from(users);

    // Compter les utilisateurs en ligne
    const onlineUsers = await this.countOnlineUsers();

    return {
      totalSignalements: totalSignalementsResult?.count || 0,
      sosCount: sosCountResult?.count || 0,
      totalUsers: totalUsersResult?.count || 0,
      onlineUsers,
    };
  }

  async startTrackingSession(userId: string): Promise<TrackingSession> {
    const activeSession = await this.getActiveTrackingSession(userId);
    if (activeSession) {
      await this.stopTrackingSession(activeSession.id);
    }

    const [session] = await db
      .insert(trackingSessions)
      .values({ userId })
      .returning();
    return session;
  }

  async stopTrackingSession(sessionId: string): Promise<TrackingSession | undefined> {
    try {
      // D'abord, récupérer la session pour vérifier son état
      const [existingSession] = await db
        .select()
        .from(trackingSessions)
        .where(eq(trackingSessions.id, sessionId))
        .limit(1);

      if (!existingSession) {
        console.warn(`⚠️ Session ${sessionId} introuvable.`);
        return undefined;
      }

      // Si déjà arrêtée, renvoyer la session existante
      if (!existingSession.isActive) {
        console.log(`ℹ️ Session ${sessionId} déjà arrêtée.`);
        return existingSession;
      }

      // Arrêter la session
      const [session] = await db
        .update(trackingSessions)
        .set({ isActive: false, endTime: new Date() })
        .where(eq(trackingSessions.id, sessionId))
        .returning();

      if (session) {
        console.log(`✅ Session de tracking arrêtée: ${session.id}`);
      }

      return session;
    } catch (error) {
      console.error(`❌ Erreur lors de l'arrêt de la session de tracking ${sessionId}:`, error);
      return undefined;
    }
  }


  async getActiveTrackingSession(userId: string): Promise<TrackingSession | undefined> {
    const [session] = await db
      .select()
      .from(trackingSessions)
      .where(
        and(
          eq(trackingSessions.userId, userId),
          eq(trackingSessions.isActive, true)
        )
      )
      .limit(1);
    return session;
  }

  async addLocationPoint(locationPoint: InsertLocationPoint): Promise<LocationPoint> {
    const [point] = await db
      .insert(locationPoints)
      .values(locationPoint)
      .returning();
    return point;
  }

  async getSessionLocationPoints(sessionId: string): Promise<LocationPoint[]> {
    return db.select()
      .from(locationPoints)
      .where(eq(locationPoints.sessionId, sessionId))
      .orderBy(locationPoints.timestamp);
  }

  async getUserTrackingSessions(userId: string): Promise<TrackingSession[]> {
    return await db.select()
      .from(trackingSessions)
      .where(eq(trackingSessions.userId, userId))
      .orderBy(desc(trackingSessions.startTime));
  }

  async deleteTrackingSession(sessionId: string): Promise<boolean> {
    try {
      // Supprimer d'abord tous les points de localisation associés
      await db.delete(locationPoints).where(eq(locationPoints.sessionId, sessionId));

      // Ensuite supprimer la session
      const result = await db.delete(trackingSessions)
        .where(eq(trackingSessions.id, sessionId))
        .returning();

      return result.length > 0;
    } catch (error) {
      console.error("Error deleting tracking session:", error);
      return false;
    }
  }

  // ============================================
  // NOTIFICATIONS
  // ============================================

  async createNotification(data: typeof insertNotificationSchema._type) {
    const [notification] = await db.insert(notifications).values(data).returning();
    return notification;
  }

  async getUserNotifications(userId: string) {
    return db.select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt));
  }

  async getUnreadNotificationsCount(userId: string) {
    const result = await db.select({ count: sql<number>`count(*)::int` })
      .from(notifications)
      .where(and(
        eq(notifications.userId, userId),
        eq(notifications.read, false)
      ));
    return result[0]?.count || 0;
  }

  async markNotificationAsRead(notificationId: string): Promise<Notification | undefined> {
    const [notification] = await db
      .update(notifications)
      .set({ read: true })
      .where(eq(notifications.id, notificationId))
      .returning();
    return notification;
  }

  async markAllNotificationsAsRead(userId: string) {
    await db.update(notifications)
      .set({ read: true })
      .where(eq(notifications.userId, userId));
  }

  async getNotificationById(notificationId: string) {
    const result = await db.select()
      .from(notifications)
      .where(eq(notifications.id, notificationId))
      .limit(1);
    return result[0];
  }

  async deleteNotification(notificationId: string): Promise<boolean> {
    try {
      const result = await db.delete(notifications)
        .where(eq(notifications.id, notificationId))
        .returning();
      return result.length > 0;
    } catch (error) {
      console.error("Error deleting notification:", error);
      return false;
    }
  }

  async deleteAllUserNotifications(userId: string): Promise<void> {
    await db.delete(notifications)
      .where(eq(notifications.userId, userId));
  }

  async notifySignalementOwner(signalementId: string, type: string, title: string, description: string) {
    const signalement = await this.getSignalement(signalementId);
    if (!signalement || signalement.userId === "demo-user") return;

    await this.createNotification({
      userId: signalement.userId,
      type,
      title,
      description,
      signalementId,
      read: false,
    });
  }

  async getLocationPointsBySession(sessionId: string) {
    return await db.select().from(locationPoints)
      .where(eq(locationPoints.sessionId, sessionId))
      .orderBy(locationPoints.timestamp);
  }

  async broadcastNotification(type: string, title: string, description: string, signalementId: string | null, excludeUserId?: string) {
    // Fan-out notifications to all users asynchronously in batches
    setImmediate(async () => {
      try {
        const BATCH_SIZE = 200;
        let offset = 0;

        while (true) {
          // Fetch a batch of users
          const usersBatch = await db.select({ id: users.id })
            .from(users)
            .where(excludeUserId ? sql`${users.id} != ${excludeUserId}` : undefined)
            .limit(BATCH_SIZE)
            .offset(offset);

          if (usersBatch.length === 0) break;

          // Create notifications for this batch
          const notificationData = usersBatch
            .filter(user => user.id !== "demo-user") // Skip demo user
            .map(user => ({
              userId: user.id,
              type,
              title,
              description,
              signalementId,
              read: false,
            }));

          if (notificationData.length > 0) {
            await db.insert(notifications).values(notificationData);
          }

          offset += BATCH_SIZE;

          // Stop if we got less than a full batch
          if (usersBatch.length < BATCH_SIZE) break;
        }

        console.log(`Broadcast notification sent to users: ${title}`);
      } catch (error) {
        console.error('Error broadcasting notification:', error);
      }
    });
  }

  async sendTrackingEmailToUser(userId: string, sessionId: string, gpxContent: string) {
    try {
      // Récupérer l'email de l'utilisateur
      const user = await db.select().from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (!user[0]?.email) {
        console.log("Utilisateur sans email, impossible d'envoyer le fichier GPS");
        return;
      }

      const emailContent = `
Bonjour,

Votre session de localisation en direct (ID: ${sessionId}) s'est terminée.

Vous trouverez ci-joint le fichier GPX contenant votre parcours.

Cordialement,
L'équipe Burkina Watch
      `;

      // Note: Pour un vrai envoi d'email, vous devrez configurer un service SMTP
      // Par exemple avec nodemailer + un service comme SendGrid, Mailgun, etc.
      console.log(`[EMAIL] Envoi du fichier GPS à ${user[0].email}`);
      console.log(`[EMAIL] Contenu: ${emailContent}`);
      console.log(`[EMAIL] Fichier GPX (${gpxContent.length} caractères)`);

      // TODO: Implémenter l'envoi réel avec un service SMTP
      // const transporter = nodemailer.createTransport({ ... });
      // await transporter.sendMail({
      //   to: user[0].email,
      //   subject: 'Votre fichier de localisation GPS - Burkina Watch',
      //   text: emailContent,
      //   attachments: [{
      //     filename: `tracking-${sessionId}.gpx`,
      //     content: gpxContent
      //   }]
      // });

    } catch (error) {
      console.error("Erreur lors de l'envoi de l'email:", error);
    }
  }

  // ============================================
  // EMERGENCY CONTACTS & PANIC ALERTS
  // ============================================

  async getEmergencyContacts(userId: string): Promise<EmergencyContact[]> {
    return db
      .select()
      .from(emergencyContacts)
      .where(eq(emergencyContacts.userId, userId))
      .orderBy(desc(emergencyContacts.isPrimary), desc(emergencyContacts.createdAt));
  }

  async createEmergencyContact(contact: InsertEmergencyContact): Promise<EmergencyContact> {
    const [newContact] = await db.insert(emergencyContacts).values(contact).returning();
    return newContact;
  }

  async deleteEmergencyContact(contactId: string): Promise<boolean> {
    const result = await db.delete(emergencyContacts).where(eq(emergencyContacts.id, contactId));
    return result.rowCount !== null && result.rowCount > 0;
  }

  async updateEmergencyContact(contactId: string, updates: Partial<InsertEmergencyContact>): Promise<EmergencyContact | undefined> {
    const [updated] = await db
      .update(emergencyContacts)
      .set(updates)
      .where(eq(emergencyContacts.id, contactId))
      .returning();
    return updated;
  }

  async createPanicAlert(alert: InsertPanicAlert): Promise<PanicAlert> {
    const [newAlert] = await db.insert(panicAlerts).values(alert).returning();
    return newAlert;
  }

  async getUserPanicAlerts(userId: string): Promise<PanicAlert[]> {
    return db
      .select()
      .from(panicAlerts)
      .where(eq(panicAlerts.userId, userId))
      .orderBy(desc(panicAlerts.createdAt));
  }

  // Added methods for public profiles
  async getSignalementsByUserId(userId: string): Promise<Signalement[]> {
    return db
      .select()
      .from(signalements)
      .where(eq(signalements.userId, userId))
      .orderBy(desc(signalements.createdAt));
  }

  // ============================================
  // CHATBOT
  // ============================================

  async saveChatMessage(message: InsertChatMessage): Promise<ChatMessage> {
    const [newMessage] = await db.insert(chatMessages).values(message).returning();
    return newMessage;
  }

  async getChatHistory(sessionId: string): Promise<ChatMessage[]> {
    return db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.sessionId, sessionId))
      .orderBy(chatMessages.createdAt);
  }

  // ============================================
  // POINTS & LEADERBOARD
  // ============================================

  async awardPointsToUser(userId: string, points: number) {
    const user = await this.getUser(userId);
    if (!user) throw new Error("Utilisateur introuvable");

    const newPoints = user.userPoints + points;
    const { calculateLevel } = await import("@shared/pointsSystem");
    const newLevel = calculateLevel(newPoints);

    const levelChanged = newLevel !== user.userLevel;

    const [updatedUser] = await db
      .update(users)
      .set({
        userPoints: newPoints,
        userLevel: newLevel,
      })
      .where(eq(users.id, userId))
      .returning();

    return { user: updatedUser, levelChanged, newLevel };
  }

  async getTopUsersByPoints(limit: number = 50) {
    return db
      .select({
        id: users.id,
        name: sql<string>`COALESCE(${users.firstName} || ' ' || ${users.lastName}, ${users.email})`,
        avatar: users.profileImageUrl,
        userPoints: users.userPoints,
        userLevel: users.userLevel,
      })
      .from(users)
      .orderBy(desc(users.userPoints))
      .limit(limit);
  }

  async syncUserPointsFromSignalements(userId: string): Promise<{ user: User; levelChanged: boolean; newLevel: string }> {
    const user = await this.getUser(userId);
    if (!user) throw new Error("Utilisateur introuvable");

    // Get all user signalements
    const userSignalements = await this.getUserSignalements(userId);

    const { POINTS_CONFIG, calculateLevel } = await import("@shared/pointsSystem");

    // Calculate points based on signalements
    // +10 points per resolved signalement
    const resolvedCount = userSignalements.filter(s => s.statut === 'resolu').length;
    const resolvedPoints = resolvedCount * POINTS_CONFIG.VERIFIED_SIGNALEMENT;

    // +5 points per like received (sum of all likes on all signalements)
    const totalLikes = userSignalements.reduce((acc, s) => acc + (s.likes || 0), 0);
    const likesPoints = totalLikes * POINTS_CONFIG.CITIZEN_CONFIRMATION;

    const totalPoints = resolvedPoints + likesPoints;
    const newLevel = calculateLevel(totalPoints);
    const levelChanged = newLevel !== user.userLevel;

    const [updatedUser] = await db
      .update(users)
      .set({
        userPoints: totalPoints,
        userLevel: newLevel,
      })
      .where(eq(users.id, userId))
      .returning();

    console.log(`🔄 Synchronisation des points pour ${userId}: ${totalPoints} points (${resolvedCount} résolus × 10 + ${totalLikes} likes × 5)`);

    return { user: updatedUser, levelChanged, newLevel };
  }

  // ============================================
  // AUDIT LOGGING
  // ============================================

  async logAudit(data: {
    userId?: string;
    action: string;
    resourceType?: string;
    resourceId?: string;
    details?: Record<string, any>;
    ipAddress?: string;
    userAgent?: string;
    severity?: "info" | "warning" | "critical";
  }): Promise<AuditLog> {
    try {
      const [auditLog] = await db
        .insert(auditLogs)
        .values({
          userId: data.userId,
          action: data.action,
          resourceType: data.resourceType,
          resourceId: data.resourceId,
          details: data.details,
          ipAddress: data.ipAddress,
          userAgent: data.userAgent,
          severity: data.severity || "info",
        })
        .returning();
      return auditLog;
    } catch (error) {
      console.error("[AUDIT] Erreur lors de l'enregistrement du log:", error);
      throw error;
    }
  }

  // --- New methods for online users ---

  async userConnected(userId: string): Promise<void> {
    try {
      // Check if an active session already exists for this user
      const [existingSession] = await db
        .select()
        .from(onlineSessions)
        .where(and(eq(onlineSessions.userId, userId), isNull(onlineSessions.disconnectedAt)))
        .limit(1);

      if (existingSession) {
        console.log(`User ${userId} is already online.`);
        return;
      }

      // Insert a new online session record with explicit ID generation
      const sessionId = crypto.randomUUID();
      await db.insert(onlineSessions).values({
        id: sessionId,
        userId: userId,
        connectedAt: new Date(),
      });
      console.log(`User ${userId} connected with session ${sessionId}.`);
    } catch (error) {
      console.error(`Error connecting user ${userId}:`, error);
      throw error;
    }
  }

  async userDisconnected(userId: string): Promise<void> {
    // Find the active session for the user and mark it as disconnected
    const [updatedSession] = await db
      .update(onlineSessions)
      .set({ disconnectedAt: new Date() })
      .where(and(eq(onlineSessions.userId, userId), isNull(onlineSessions.disconnectedAt)))
      .returning();

    if (updatedSession) {
      console.log(`User ${userId} disconnected.`);
    } else {
      console.warn(`User ${userId} was not found as online.`);
    }
  }

  async countOnlineUsers(): Promise<number> {
    const result = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(onlineSessions)
      .where(isNull(onlineSessions.disconnectedAt));
    return result[0]?.count || 0;
  }

  // --- StreetView Points ---
  async getStreetviewPoints(): Promise<StreetviewPoint[]> {
    const result = await db
      .select()
      .from(streetviewPoints)
      .orderBy(desc(streetviewPoints.capturedAt))
      .limit(500);
    return result;
  }

  async createStreetviewPoint(point: InsertStreetviewPoint): Promise<StreetviewPoint> {
    const [created] = await db
      .insert(streetviewPoints)
      .values(point)
      .returning();
    return created;
  }

  // --- Virtual Tours ---
  async getVirtualTours(): Promise<VirtualTour[]> {
    const result = await db
      .select()
      .from(virtualTours)
      .where(eq(virtualTours.isPublished, true))
      .orderBy(desc(virtualTours.createdAt))
      .limit(100);
    return result;
  }

  async getVirtualTourWithPhotos(tourId: string): Promise<VirtualTourWithPhotos | undefined> {
    const [tour] = await db
      .select()
      .from(virtualTours)
      .where(eq(virtualTours.id, tourId))
      .limit(1);

    if (!tour) return undefined;

    const photos = await db
      .select()
      .from(streetviewPoints)
      .where(eq(streetviewPoints.tourId, tourId))
      .orderBy(streetviewPoints.orderIndex);

    return { ...tour, photos };
  }

  async createVirtualTour(tour: InsertVirtualTour, photos: InsertStreetviewPoint[]): Promise<VirtualTour> {
    const [createdTour] = await db
      .insert(virtualTours)
      .values({
        ...tour,
        photoCount: photos.length,
      })
      .returning();

    if (photos.length > 0) {
      const photosWithTourId = photos.map((photo, index) => ({
        ...photo,
        tourId: createdTour.id,
        orderIndex: index,
      }));

      await db.insert(streetviewPoints).values(photosWithTourId);

      const [firstPhoto] = await db
        .select({ id: streetviewPoints.id })
        .from(streetviewPoints)
        .where(eq(streetviewPoints.tourId, createdTour.id))
        .orderBy(streetviewPoints.orderIndex)
        .limit(1);

      if (firstPhoto) {
        const [updatedTour] = await db
          .update(virtualTours)
          .set({ coverPhotoId: firstPhoto.id })
          .where(eq(virtualTours.id, createdTour.id))
          .returning();
        return updatedTour;
      }
    }

    return createdTour;
  }

  async incrementTourViewCount(tourId: string): Promise<void> {
    await db
      .update(virtualTours)
      .set({ viewCount: sql`${virtualTours.viewCount} + 1` })
      .where(eq(virtualTours.id, tourId));
  }
}

export const storage = new DbStorage();