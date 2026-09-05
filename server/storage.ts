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
  type InsertStreetviewContribution,
  type StreetviewContribution,
  type InsertStreetviewProcessingJob,
  type StreetviewProcessingJob,
  type InsertOtpCode,
  type OtpCode,
  type SurveillanceCamera,
  type SurveillanceCameraSummary,
  type InsertSurveillanceCamera,
  type UpdateSurveillanceCamera,
  type CameraAgent,
  type AgentCameraBinding,
  type AgentMediaSession,
  magicLinks,
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
  streetviewContributions,
  streetviewProcessingJobs,
  places,
  otpCodes,
  insertSignalementSchema,
  insertCommentaireSchema,
  updateSignalementSchema,
  updateUserProfileSchema,
  insertLocationPointSchema,
  insertNotificationSchema,
  onlineSessions,
  surveillanceCameras,
  cameraAgents,
  agentCameraBindings,
  agentMediaSessions,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql, isNull, gt } from "drizzle-orm";

const baseSignalementSelection = {
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
};

let verificationColumnsAvailable: boolean | undefined;

async function hasSignalementVerificationColumns(): Promise<boolean> {
  if (verificationColumnsAvailable !== undefined) {
    return verificationColumnsAvailable;
  }

  const result = await db.execute(sql`
    SELECT COUNT(*)::int AS column_count
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'signalements'
      AND column_name IN ('reliability_score', 'verification_status', 'verification_mode')
  `);
  verificationColumnsAvailable = Number(result.rows[0]?.column_count) === 3;
  return verificationColumnsAvailable;
}

async function getSignalementSelection() {
  if (!(await hasSignalementVerificationColumns())) {
    return baseSignalementSelection;
  }

  return {
    ...baseSignalementSelection,
    reliabilityScore: signalements.reliabilityScore,
    verificationStatus: signalements.verificationStatus,
    verificationMode: signalements.verificationMode,
  };
}

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByPhone(phone: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  createOtpCode(data: InsertOtpCode): Promise<OtpCode>;
  getValidOtpCode(identifier: string, type: string): Promise<OtpCode | undefined>;
  consumeOtpCode(id: string): Promise<boolean>;
  deleteOtpCode(id: string): Promise<void>;
  deleteExpiredOtpCodes(identifier: string, type: string): Promise<void>;
  incrementOtpAttempts(id: string): Promise<void>;
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
  startPanicTrackingSession(userId: string): Promise<TrackingSession>;
  stopTrackingSession(sessionId: string): Promise<TrackingSession | undefined>; // Changed parameter to sessionId
  getActiveTrackingSession(userId: string): Promise<TrackingSession | undefined>;
  getTrackingSessionByShareToken(shareToken: string): Promise<TrackingSession | undefined>;
  addLocationPoint(locationPoint: InsertLocationPoint): Promise<LocationPoint>;
  getSessionLocationPoints(sessionId: string): Promise<LocationPoint[]>;
  getUserTrackingSessions(userId: string): Promise<TrackingSession[]>;
  deleteTrackingSession(sessionId: string): Promise<boolean>; // Added method

  // --- Surveillance cameras ---
  getSurveillanceCameras(ownerId: string): Promise<SurveillanceCameraSummary[]>;
  getSurveillanceCamera(ownerId: string, cameraId: string): Promise<SurveillanceCameraSummary | undefined>;
  getSurveillanceCameraForUpdate(ownerId: string, cameraId: string): Promise<SurveillanceCamera | undefined>;
  createSurveillanceCamera(camera: InsertSurveillanceCamera): Promise<SurveillanceCamera>;
  updateSurveillanceCamera(
    ownerId: string,
    cameraId: string,
    updates: UpdateSurveillanceCamera,
  ): Promise<SurveillanceCamera | undefined>;
  deleteSurveillanceCamera(ownerId: string, cameraId: string): Promise<boolean>;

  // --- Secure Camera Agents ---
  createCameraAgent(agent: typeof cameraAgents.$inferInsert): Promise<CameraAgent>;
  getCameraAgents(ownerId: string): Promise<CameraAgent[]>;
  getCameraAgent(ownerId: string, agentId: string): Promise<CameraAgent | undefined>;
  getCameraAgentById(agentId: string): Promise<CameraAgent | undefined>;
  claimCameraAgent(
    agentId: string,
    enrollmentHash: string,
    credentialHash: string,
    version?: string,
  ): Promise<CameraAgent | undefined>;
  authenticateCameraAgent(
    agentId: string,
    credentialHash: string,
    now: Date,
  ): Promise<CameraAgent | undefined>;
  updateCameraAgentVersion(agentId: string, version: string): Promise<void>;
  revokeCameraAgent(ownerId: string, agentId: string): Promise<CameraAgent | undefined>;
  createAgentCameraBinding(
    ownerId: string,
    agentId: string,
    cameraId: string,
  ): Promise<AgentCameraBinding>;
  deleteAgentCameraBinding(
    ownerId: string,
    agentId: string,
    cameraId: string,
  ): Promise<boolean>;
  getActiveAgentCameraBinding(
    agentId: string,
    cameraId: string,
  ): Promise<AgentCameraBinding | undefined>;
  createAgentMediaSession(
    session: typeof agentMediaSessions.$inferInsert,
  ): Promise<AgentMediaSession>;
  getActiveAgentMediaSession(
    agentId: string,
    pathName: string,
    credentialHash: string,
    now: Date,
  ): Promise<AgentMediaSession | undefined>;
  touchAgentMediaSession(sessionId: string, now: Date): Promise<void>;
  revokeAgentMediaSessionsForAgent(agentId: string): Promise<void>;
  revokeAgentMediaSessionsForBinding(agentId: string, cameraId: string): Promise<void>;
  getActiveAgentMediaSessionForCamera(
    ownerId: string,
    cameraId: string,
    now: Date,
  ): Promise<AgentMediaSession | undefined>;

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
  deleteEmergencyContact(contactId: string, userId?: string): Promise<boolean>;
  updateEmergencyContact(contactId: string, updates: Partial<InsertEmergencyContact>): Promise<EmergencyContact | undefined>;
  createPanicAlert(alert: InsertPanicAlert): Promise<PanicAlert>;
  getUserPanicAlerts(userId: string): Promise<PanicAlert[]>;

  // Méthodes pour les profils publics
  getUserById(userId: string): Promise<User | undefined>;
  getSignalementsByUserId(userId: string): Promise<Signalement[]>;

  // Méthodes pour le chatbot
  saveChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
  getChatHistory(sessionId: string, userId?: string | null): Promise<ChatMessage[]>;

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

  // --- StreetView video contributions ---
  createStreetviewContribution(data: InsertStreetviewContribution): Promise<StreetviewContribution>;
  getStreetviewContributionsByUser(userId: string): Promise<StreetviewContribution[]>;
  getStreetviewContribution(id: string, userId?: string): Promise<StreetviewContribution | undefined>;
  updateStreetviewContribution(
    id: string,
    updates: Partial<{
      status: string;
      progress: number;
      statusMessage: string | null;
      errorCode: string | null;
      originalFileName: string | null;
      mediaType: string | null;
      storageKey: string | null;
      thumbnailKey: string | null;
      fileSizeBytes: number | null;
      durationMs: number | null;
      width: number | null;
      height: number | null;
      orientation: string | null;
       capturedAt: Date | null;
       locationAccuracyM: string | null;
       altitudeM: string | null;
       locationSource: string | null;
       locationCapturedAt: Date | null;
       temporalVersion: string | null;
       qualityMetrics: Record<string, unknown> | null;
      clientMetadata: Record<string, unknown> | null;
      uploadedAt: Date | null;
      processedAt: Date | null;
      updatedAt: Date;
    }>,
  ): Promise<StreetviewContribution | undefined>;
  deleteStreetviewContribution(id: string, userId: string): Promise<StreetviewContribution | undefined>;
  createStreetviewProcessingJob(data: InsertStreetviewProcessingJob): Promise<StreetviewProcessingJob>;
  updateStreetviewProcessingJob(
    id: string,
    updates: Partial<{
      status: string;
      progress: number;
      attempts: number;
      maxAttempts: number;
      errorCode: string | null;
      errorMessage: string | null;
      availableAt: Date;
      startedAt: Date | null;
      completedAt: Date | null;
      lockedAt: Date | null;
      leaseUntil: Date | null;
      lockedBy: string | null;
      updatedAt: Date;
    }>,
  ): Promise<StreetviewProcessingJob | undefined>;
  claimNextStreetviewProcessingJob(
    workerId: string,
    leaseMs: number,
    now?: Date,
  ): Promise<StreetviewProcessingJob | undefined>;
  recoverAbandonedStreetviewProcessingJobs(now?: Date): Promise<{
    requeued: string[];
    failed: string[];
  }>;
  getStreetviewProcessingJobsForContribution(
    contributionId: string,
  ): Promise<StreetviewProcessingJob[]>;

  // --- Metadata methods for sync tracking ---
  getMetadata(key: string): Promise<string | undefined>;
  setMetadata(key: string, value: string): Promise<void>;
}

export class DbStorage implements IStorage {
  private metadata: Record<string, string> = {};

  async getMetadata(key: string): Promise<string | undefined> {
    return this.metadata[key];
  }

  async setMetadata(key: string, value: string): Promise<void> {
    this.metadata[key] = value;
  }

  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserById(id: string): Promise<User | undefined> {
    return this.getUser(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return result[0];
  }

  async getUserByPhone(phone: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.telephone, phone)).limit(1);
    return result[0];
  }

  async createOtpCode(data: InsertOtpCode): Promise<OtpCode> {
    const [otp] = await db.insert(otpCodes).values(data).returning();
    return otp;
  }

  async getValidOtpCode(identifier: string, type: string): Promise<OtpCode | undefined> {
    const [otp] = await db
      .select()
      .from(otpCodes)
      .where(
        and(
          eq(otpCodes.identifier, identifier),
          eq(otpCodes.type, type),
          eq(otpCodes.verified, false),
          sql`${otpCodes.expiresAt} > now()`
        )
      )
      .orderBy(desc(otpCodes.createdAt))
      .limit(1);
    return otp;
  }

  async consumeOtpCode(id: string): Promise<boolean> {
    const [otp] = await db
      .update(otpCodes)
      .set({ verified: true })
      .where(and(eq(otpCodes.id, id), eq(otpCodes.verified, false)))
      .returning({ id: otpCodes.id });
    return Boolean(otp);
  }

  async deleteOtpCode(id: string): Promise<void> {
    await db.delete(otpCodes).where(eq(otpCodes.id, id));
  }

  async deleteExpiredOtpCodes(identifier: string, type: string): Promise<void> {
    await db.delete(otpCodes).where(
      and(
        eq(otpCodes.identifier, identifier),
        eq(otpCodes.type, type)
      )
    );
  }

  async incrementOtpAttempts(id: string): Promise<void> {
    await db
      .update(otpCodes)
      .set({ attempts: sql`${otpCodes.attempts} + 1` })
      .where(eq(otpCodes.id, id));
  }

  async upsertUser(userData: any): Promise<User> {
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

  async createMagicLink(userId: string, email: string, token: string): Promise<void> {
    await db.insert(magicLinks).values({
      userId,
      email,
      token,
      expiresAt: new Date(Date.now() + 3600000), // 1 hour
    });
  }

  async getMagicLinkByToken(token: string): Promise<any | undefined> {
    const [link] = await db
      .select()
      .from(magicLinks)
      .where(and(eq(magicLinks.token, token), sql`${magicLinks.expiresAt} > now()`))
      .limit(1);
    return link;
  }

  async consumeMagicLink(token: string): Promise<void> {
    await db.delete(magicLinks).where(eq(magicLinks.token, token));
  }

  async associateEmailWithUser(userId: string, email: string): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({
        email,
        isAnonymous: false,
        role: "trusted",
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
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
    const signalementSelection = await getSignalementSelection();
    let query = db
      .select({
        ...signalementSelection,
        auteurFirstName: users.firstName,
        auteurLastName: users.lastName,
      } as any)
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

    return (await query) as unknown as SignalementWithAuthor[];
  }

  async getUserSignalements(userId: string): Promise<SignalementWithAuthor[]> {
    const signalementSelection = await getSignalementSelection();
    return (await db
      .select({
        ...signalementSelection,
        auteurFirstName: users.firstName,
        auteurLastName: users.lastName,
      } as any)
      .from(signalements)
      .leftJoin(users, eq(signalements.userId, users.id))
      .where(eq(signalements.userId, userId))
      .orderBy(desc(signalements.createdAt))) as unknown as SignalementWithAuthor[];
  }

  async getSignalement(id: string): Promise<Signalement | undefined> {
    const result = await db
      .select(await getSignalementSelection())
      .from(signalements)
      .where(eq(signalements.id, id))
      .limit(1);
    return result[0] as unknown as Signalement | undefined;
  }

  async createSignalement(insertSignalement: InsertSignalement): Promise<Signalement> {
    const values = {
      ...insertSignalement,
      medias: insertSignalement.medias || []
    };
    const result = await db
      .insert(signalements)
      .values(values)
      .returning(await getSignalementSelection());
    return result[0] as unknown as Signalement;
  }

  async updateSignalement(id: string, updates: UpdateSignalement | any): Promise<Signalement | undefined> {
    const verificationColumnsAvailable = await hasSignalementVerificationColumns();
    const persistedUpdates = verificationColumnsAvailable
      ? updates
      : Object.fromEntries(
          Object.entries(updates).filter(
            ([key]) =>
              key !== "reliabilityScore" &&
              key !== "verificationStatus" &&
              key !== "verificationMode",
          ),
        );

    if (Object.keys(persistedUpdates).length === 0) {
      return this.getSignalement(id);
    }

    const result = await db
      .update(signalements)
      .set(persistedUpdates)
      .where(eq(signalements.id, id))
      .returning(await getSignalementSelection());
    return result[0] as unknown as Signalement | undefined;
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
    const signalementSelection = await getSignalementSelection();
    return await db.transaction(async (tx) => {
      // Get the signalement before update to check if status is changing to "resolu"
      const [oldSignalement] = await tx
        .select(signalementSelection as any)
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
        .returning(signalementSelection as any);

      // Award points if status changed from non-resolu to resolu
      if (oldSignalement.statut !== 'resolu' && statut === 'resolu' && oldSignalement.userId && oldSignalement.userId !== "demo-user") {
        const { POINTS_CONFIG, calculateLevel } = await import("@shared/pointsSystem");

        const [author] = await tx
          .select()
          .from(users)
          .where(eq(users.id, oldSignalement.userId))
          .limit(1);

        if (!author) {
          console.warn(`Auteur ${oldSignalement.userId} introuvable, points non attribués`);
          return result as Signalement;
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

      return result as Signalement;
    });
  }

  async likeSignalement(signalementId: string, userId: string): Promise<{ signalement: Signalement | undefined; isLiked: boolean }> {
    const signalementSelection = await getSignalementSelection();
    try {
      return await db.transaction(async (tx) => {
        // Get the signalement to know its author
        const [signalement] = await tx
          .select(signalementSelection as any)
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
            .returning(signalementSelection as any);

          updated = result as Signalement;
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
            .returning(signalementSelection as any);

          updated = result as Signalement;
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
          .select(signalementSelection as any)
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
          signalement: signalement as Signalement | undefined,
          isLiked: existingLike.length > 0
        };
      }
      throw error;
    }
  }

  async shareSignalement(id: string): Promise<Signalement | undefined> {
    const signalementSelection = await getSignalementSelection();
    const [signalement] = await db
      .select(signalementSelection as any)
      .from(signalements)
      .where(eq(signalements.id, id))
      .limit(1);

    if (!signalement) return undefined;

    const [updated] = await db
      .update(signalements)
      .set({ sharesCount: sql`${signalements.sharesCount} + 1` })
      .where(eq(signalements.id, id))
      .returning(signalementSelection as any);

    return updated as Signalement | undefined;
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
    totalGares: number;
  }> {
    const [signalementsStats, usersResult, garesResult, onlineUsers] = await Promise.all([
      db
        .select({
          total: sql<number>`count(*)::int`,
          sosCount: sql<number>`count(*) filter (where ${signalements.isSOS} = true)::int`,
        })
        .from(signalements)
        .then((r) => r[0]),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(users)
        .then((r) => r[0]),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(places)
        .where(eq(places.placeType, "bus_station"))
        .then((r) => r[0]),
      this.countOnlineUsers(),
    ]);

    return {
      totalSignalements: signalementsStats?.total || 0,
      sosCount: signalementsStats?.sosCount || 0,
      totalUsers: usersResult?.count || 0,
      onlineUsers,
      totalGares: garesResult?.count || 0,
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

  async startPanicTrackingSession(userId: string): Promise<TrackingSession> {
    const activeSession = await this.getActiveTrackingSession(userId);
    if (activeSession) {
      await this.stopTrackingSession(activeSession.id);
    }

    // Generate a unique share token for public access
    const shareToken = crypto.randomUUID();

    const [session] = await db
      .insert(trackingSessions)
      .values({ 
        userId, 
        isPanicMode: true,
        shareToken 
      })
      .returning();
    
    console.log(`🚨 Session de tracking d'urgence démarrée pour l'utilisateur ${userId}`);
    return session;
  }

  async getTrackingSessionByShareToken(shareToken: string): Promise<TrackingSession | undefined> {
    const [session] = await db
      .select()
      .from(trackingSessions)
      .where(eq(trackingSessions.shareToken, shareToken))
      .limit(1);
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
  // SURVEILLANCE CAMERAS
  // ============================================

  async getSurveillanceCameras(
    ownerId: string,
  ): Promise<SurveillanceCameraSummary[]> {
    return db
      .select({
        id: surveillanceCameras.id,
        ownerId: surveillanceCameras.ownerId,
        name: surveillanceCameras.name,
        description: surveillanceCameras.description,
        connectionType: surveillanceCameras.connectionType,
        host: surveillanceCameras.host,
        port: surveillanceCameras.port,
        streamPath: surveillanceCameras.streamPath,
        status: surveillanceCameras.status,
        lastSeenAt: surveillanceCameras.lastSeenAt,
        createdAt: surveillanceCameras.createdAt,
        updatedAt: surveillanceCameras.updatedAt,
      })
      .from(surveillanceCameras)
      .where(eq(surveillanceCameras.ownerId, ownerId))
      .orderBy(desc(surveillanceCameras.createdAt));
  }

  async getSurveillanceCamera(
    ownerId: string,
    cameraId: string,
  ): Promise<SurveillanceCameraSummary | undefined> {
    const [camera] = await db
      .select({
        id: surveillanceCameras.id,
        ownerId: surveillanceCameras.ownerId,
        name: surveillanceCameras.name,
        description: surveillanceCameras.description,
        connectionType: surveillanceCameras.connectionType,
        host: surveillanceCameras.host,
        port: surveillanceCameras.port,
        streamPath: surveillanceCameras.streamPath,
        status: surveillanceCameras.status,
        lastSeenAt: surveillanceCameras.lastSeenAt,
        createdAt: surveillanceCameras.createdAt,
        updatedAt: surveillanceCameras.updatedAt,
      })
      .from(surveillanceCameras)
      .where(
        and(
          eq(surveillanceCameras.id, cameraId),
          eq(surveillanceCameras.ownerId, ownerId),
        ),
      )
      .limit(1);
    return camera;
  }

  async getSurveillanceCameraForUpdate(
    ownerId: string,
    cameraId: string,
  ): Promise<SurveillanceCamera | undefined> {
    const [camera] = await db
      .select()
      .from(surveillanceCameras)
      .where(
        and(
          eq(surveillanceCameras.id, cameraId),
          eq(surveillanceCameras.ownerId, ownerId),
        ),
      )
      .limit(1);
    return camera;
  }

  async createSurveillanceCamera(
    camera: InsertSurveillanceCamera,
  ): Promise<SurveillanceCamera> {
    const [createdCamera] = await db
      .insert(surveillanceCameras)
      .values(camera)
      .returning();
    return createdCamera;
  }

  async updateSurveillanceCamera(
    ownerId: string,
    cameraId: string,
    updates: UpdateSurveillanceCamera,
  ): Promise<SurveillanceCamera | undefined> {
    const [updatedCamera] = await db
      .update(surveillanceCameras)
      .set({ ...updates, updatedAt: new Date() })
      .where(
        and(
          eq(surveillanceCameras.id, cameraId),
          eq(surveillanceCameras.ownerId, ownerId),
        ),
      )
      .returning();
    return updatedCamera;
  }

  async deleteSurveillanceCamera(
    ownerId: string,
    cameraId: string,
  ): Promise<boolean> {
    const deleted = await db
      .delete(surveillanceCameras)
      .where(
        and(
          eq(surveillanceCameras.id, cameraId),
          eq(surveillanceCameras.ownerId, ownerId),
        ),
      )
      .returning({ id: surveillanceCameras.id });
    return deleted.length > 0;
  }

  // ============================================
  // SECURE CAMERA AGENTS
  // ============================================

  async createCameraAgent(
    agent: typeof cameraAgents.$inferInsert,
  ): Promise<CameraAgent> {
    const [created] = await db.insert(cameraAgents).values(agent).returning();
    return created;
  }

  async getCameraAgents(ownerId: string): Promise<CameraAgent[]> {
    return db
      .select()
      .from(cameraAgents)
      .where(eq(cameraAgents.ownerId, ownerId))
      .orderBy(desc(cameraAgents.createdAt));
  }

  async getCameraAgent(
    ownerId: string,
    agentId: string,
  ): Promise<CameraAgent | undefined> {
    const [agent] = await db
      .select()
      .from(cameraAgents)
      .where(and(eq(cameraAgents.ownerId, ownerId), eq(cameraAgents.id, agentId)))
      .limit(1);
    return agent;
  }

  async getCameraAgentById(agentId: string): Promise<CameraAgent | undefined> {
    const [agent] = await db
      .select()
      .from(cameraAgents)
      .where(eq(cameraAgents.id, agentId))
      .limit(1);
    return agent;
  }

  async claimCameraAgent(
    agentId: string,
    enrollmentHash: string,
    credentialHash: string,
    version?: string,
  ): Promise<CameraAgent | undefined> {
    const [claimed] = await db
      .update(cameraAgents)
      .set({
        status: "enrolled",
        credentialHash,
        version: version ?? null,
        enrollmentUsedAt: new Date(),
        enrolledAt: new Date(),
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(cameraAgents.id, agentId),
          eq(cameraAgents.enrollmentHash, enrollmentHash),
          eq(cameraAgents.status, "pending"),
          isNull(cameraAgents.enrollmentUsedAt),
          gt(cameraAgents.enrollmentExpiresAt, new Date()),
        ),
      )
      .returning();
    return claimed;
  }

  async authenticateCameraAgent(
    agentId: string,
    credentialHash: string,
    now: Date,
  ): Promise<CameraAgent | undefined> {
    const [authenticated] = await db
      .update(cameraAgents)
      .set({
        status: "online",
        lastSeenAt: now,
        updatedAt: now,
      })
      .where(
        and(
          eq(cameraAgents.id, agentId),
          eq(cameraAgents.credentialHash, credentialHash),
          isNull(cameraAgents.revokedAt),
        ),
      )
      .returning();
    return authenticated;
  }

  async updateCameraAgentVersion(
    agentId: string,
    version: string,
  ): Promise<void> {
    await db
      .update(cameraAgents)
      .set({ version, updatedAt: new Date() })
      .where(eq(cameraAgents.id, agentId));
  }

  async revokeCameraAgent(
    ownerId: string,
    agentId: string,
  ): Promise<CameraAgent | undefined> {
    const now = new Date();
    const [revoked] = await db
      .update(cameraAgents)
      .set({
        status: "revoked",
        revokedAt: now,
        updatedAt: now,
      })
      .where(and(eq(cameraAgents.ownerId, ownerId), eq(cameraAgents.id, agentId)))
      .returning();
    return revoked;
  }

  async createAgentCameraBinding(
    ownerId: string,
    agentId: string,
    cameraId: string,
  ): Promise<AgentCameraBinding> {
    const [binding] = await db
      .insert(agentCameraBindings)
      .values({ ownerId, agentId, cameraId, status: "active" })
      .returning();
    return binding;
  }

  async deleteAgentCameraBinding(
    ownerId: string,
    agentId: string,
    cameraId: string,
  ): Promise<boolean> {
    const deleted = await db
      .delete(agentCameraBindings)
      .where(
        and(
          eq(agentCameraBindings.ownerId, ownerId),
          eq(agentCameraBindings.agentId, agentId),
          eq(agentCameraBindings.cameraId, cameraId),
        ),
      )
      .returning({ id: agentCameraBindings.id });
    return deleted.length > 0;
  }

  async getActiveAgentCameraBinding(
    agentId: string,
    cameraId: string,
  ): Promise<AgentCameraBinding | undefined> {
    const [binding] = await db
      .select()
      .from(agentCameraBindings)
      .where(
        and(
          eq(agentCameraBindings.agentId, agentId),
          eq(agentCameraBindings.cameraId, cameraId),
          eq(agentCameraBindings.status, "active"),
        ),
      )
      .limit(1);
    return binding;
  }

  async createAgentMediaSession(
    session: typeof agentMediaSessions.$inferInsert,
  ): Promise<AgentMediaSession> {
    const [created] = await db
      .insert(agentMediaSessions)
      .values(session)
      .returning();
    return created;
  }

  async getActiveAgentMediaSession(
    agentId: string,
    pathName: string,
    credentialHash: string,
    now: Date,
  ): Promise<AgentMediaSession | undefined> {
    const [session] = await db
      .select()
      .from(agentMediaSessions)
      .where(
        and(
          eq(agentMediaSessions.agentId, agentId),
          eq(agentMediaSessions.pathName, pathName),
          eq(agentMediaSessions.credentialHash, credentialHash),
          isNull(agentMediaSessions.revokedAt),
          gt(agentMediaSessions.expiresAt, now),
        ),
      )
      .limit(1);
    return session;
  }

  async touchAgentMediaSession(sessionId: string, now: Date): Promise<void> {
    await db
      .update(agentMediaSessions)
      .set({ lastPublishedAt: now })
      .where(eq(agentMediaSessions.id, sessionId));
  }

  async revokeAgentMediaSessionsForAgent(agentId: string): Promise<void> {
    await db
      .update(agentMediaSessions)
      .set({ revokedAt: new Date() })
      .where(and(eq(agentMediaSessions.agentId, agentId), isNull(agentMediaSessions.revokedAt)));
  }

  async revokeAgentMediaSessionsForBinding(
    agentId: string,
    cameraId: string,
  ): Promise<void> {
    await db
      .update(agentMediaSessions)
      .set({ revokedAt: new Date() })
      .where(
        and(
          eq(agentMediaSessions.agentId, agentId),
          eq(agentMediaSessions.cameraId, cameraId),
          isNull(agentMediaSessions.revokedAt),
        ),
      );
  }

  async getActiveAgentMediaSessionForCamera(
    ownerId: string,
    cameraId: string,
    now: Date,
  ): Promise<AgentMediaSession | undefined> {
    const [session] = await db
      .select()
      .from(agentMediaSessions)
      .where(
        and(
          eq(agentMediaSessions.ownerId, ownerId),
          eq(agentMediaSessions.cameraId, cameraId),
          isNull(agentMediaSessions.revokedAt),
          gt(agentMediaSessions.expiresAt, now),
        ),
      )
      .orderBy(desc(agentMediaSessions.createdAt))
      .limit(1);
    return session;
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

  async deleteEmergencyContact(contactId: string, userId?: string): Promise<boolean> {
    const condition = userId
      ? and(eq(emergencyContacts.id, contactId), eq(emergencyContacts.userId, userId))
      : eq(emergencyContacts.id, contactId);
    const result = await db.delete(emergencyContacts).where(condition);
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
    const signalementSelection = await getSignalementSelection();
    return (await db
      .select(signalementSelection as any)
      .from(signalements)
      .where(eq(signalements.userId, userId))
      .orderBy(desc(signalements.createdAt))) as Signalement[];
  }

  // ============================================
  // CHATBOT
  // ============================================

  async saveChatMessage(message: InsertChatMessage): Promise<ChatMessage> {
    const [newMessage] = await db.insert(chatMessages).values(message).returning();
    return newMessage;
  }

  async getChatHistory(sessionId: string, userId?: string | null): Promise<ChatMessage[]> {
    const sessionFilter = userId === null
      ? isNull(chatMessages.userId)
      : userId
        ? eq(chatMessages.userId, userId)
        : undefined;

    return db
      .select()
      .from(chatMessages)
      .where(
        sessionFilter
          ? and(eq(chatMessages.sessionId, sessionId), sessionFilter)
          : eq(chatMessages.sessionId, sessionId),
      )
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
      .where(gt(users.userPoints, 0))
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

  // --- StreetView video contributions ---
  async createStreetviewContribution(
    data: InsertStreetviewContribution,
  ): Promise<StreetviewContribution> {
    const [created] = await db
      .insert(streetviewContributions)
      .values(data)
      .returning();
    return created;
  }

  async getStreetviewContributionsByUser(userId: string): Promise<StreetviewContribution[]> {
    return db
      .select()
      .from(streetviewContributions)
      .where(eq(streetviewContributions.userId, userId))
      .orderBy(desc(streetviewContributions.createdAt));
  }

  async getStreetviewContribution(
    id: string,
    userId?: string,
  ): Promise<StreetviewContribution | undefined> {
    const conditions = userId
      ? and(eq(streetviewContributions.id, id), eq(streetviewContributions.userId, userId))
      : eq(streetviewContributions.id, id);
    const [contribution] = await db
      .select()
      .from(streetviewContributions)
      .where(conditions)
      .limit(1);
    return contribution;
  }

  async updateStreetviewContribution(
    id: string,
    updates: Parameters<IStorage["updateStreetviewContribution"]>[1],
  ): Promise<StreetviewContribution | undefined> {
    const [updated] = await db
      .update(streetviewContributions)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(streetviewContributions.id, id))
      .returning();
    return updated;
  }

  async deleteStreetviewContribution(
    id: string,
    userId: string,
  ): Promise<StreetviewContribution | undefined> {
    const [deleted] = await db
      .delete(streetviewContributions)
      .where(and(eq(streetviewContributions.id, id), eq(streetviewContributions.userId, userId)))
      .returning();
    return deleted;
  }

  async createStreetviewProcessingJob(
    data: InsertStreetviewProcessingJob,
  ): Promise<StreetviewProcessingJob> {
    const configuredMaxAttempts = Number(process.env.STREETVIEW_MAX_ATTEMPTS);
    const maxAttempts = Number.isInteger(configuredMaxAttempts) && configuredMaxAttempts >= 1 && configuredMaxAttempts <= 10
      ? configuredMaxAttempts
      : 3;
    const [created] = await db
      .insert(streetviewProcessingJobs)
      .values({ ...data, maxAttempts })
      .returning();
    return created;
  }

  async updateStreetviewProcessingJob(
    id: string,
    updates: Parameters<IStorage["updateStreetviewProcessingJob"]>[1],
  ): Promise<StreetviewProcessingJob | undefined> {
    if (updates.status) {
      const [current] = await db
        .select({ status: streetviewProcessingJobs.status })
        .from(streetviewProcessingJobs)
        .where(eq(streetviewProcessingJobs.id, id))
        .limit(1);
      if (!current) return undefined;
      const allowed: Record<string, string[]> = {
        QUEUED: ["PROCESSING"],
        PROCESSING: ["QUEUED", "COMPLETED", "FAILED"],
        COMPLETED: [],
        FAILED: [],
      };
      if (current.status !== updates.status && !allowed[current.status]?.includes(updates.status)) {
        throw new Error(`Invalid StreetView job transition: ${current.status} -> ${updates.status}`);
      }
    }
    const [updated] = await db
      .update(streetviewProcessingJobs)
      .set({ ...updates, updatedAt: updates.updatedAt || new Date() })
      .where(eq(streetviewProcessingJobs.id, id))
      .returning();
    return updated;
  }

  async claimNextStreetviewProcessingJob(
    workerId: string,
    leaseMs: number,
    now = new Date(),
  ): Promise<StreetviewProcessingJob | undefined> {
    const result = await db.execute(sql`
      WITH candidate AS (
        SELECT id
        FROM streetview_processing_jobs
        WHERE attempts < max_attempts
          AND (
            (status = 'QUEUED' AND available_at <= ${now})
            OR (status = 'PROCESSING' AND lease_until IS NOT NULL AND lease_until < ${now})
          )
        ORDER BY created_at ASC
        FOR UPDATE SKIP LOCKED
        LIMIT 1
      )
      UPDATE streetview_processing_jobs AS job
      SET status = 'PROCESSING',
          attempts = job.attempts + 1,
          started_at = COALESCE(job.started_at, ${now}),
          locked_at = ${now},
          lease_until = ${new Date(now.getTime() + leaseMs)},
          locked_by = ${workerId},
          updated_at = ${now}
      FROM candidate
      WHERE job.id = candidate.id
      RETURNING
        job.id AS id,
        job.contribution_id AS "contributionId",
        job.type AS type,
        job.status AS status,
        job.progress AS progress,
        job.attempts AS attempts,
        job.max_attempts AS "maxAttempts",
        job.error_code AS "errorCode",
        job.error_message AS "errorMessage",
        job.available_at AS "availableAt",
        job.created_at AS "createdAt",
        job.started_at AS "startedAt",
        job.completed_at AS "completedAt",
        job.locked_at AS "lockedAt",
        job.lease_until AS "leaseUntil",
        job.locked_by AS "lockedBy",
        job.updated_at AS "updatedAt";
    `);
    return result.rows[0] as StreetviewProcessingJob | undefined;
  }

  async recoverAbandonedStreetviewProcessingJobs(now = new Date()): Promise<{
    requeued: string[];
    failed: string[];
  }> {
    const requeued = await db.execute(sql`
      UPDATE streetview_processing_jobs
      SET status = 'QUEUED',
          available_at = ${now},
          locked_at = NULL,
          lease_until = NULL,
          locked_by = NULL,
          updated_at = ${now}
      WHERE status = 'PROCESSING'
        AND lease_until IS NOT NULL
        AND lease_until < ${now}
        AND attempts < max_attempts
      RETURNING id;
    `);
    const failed = await db.execute(sql`
      UPDATE streetview_processing_jobs
      SET status = 'FAILED',
          progress = 100,
          error_code = 'WORKER_TIMEOUT',
          error_message = 'Le worker a perdu son bail avant la fin du traitement.',
          completed_at = ${now},
          locked_at = NULL,
          lease_until = NULL,
          locked_by = NULL,
          updated_at = ${now}
      WHERE status = 'PROCESSING'
        AND lease_until IS NOT NULL
        AND lease_until < ${now}
        AND attempts >= max_attempts
      RETURNING id, contribution_id;
    `);

    for (const row of failed.rows as Array<{ id: string; contribution_id: string }>) {
      await db
        .update(streetviewContributions)
        .set({
          status: "PROCESSING_FAILED",
          progress: 100,
          statusMessage: "Le traitement a été interrompu après plusieurs tentatives.",
          errorCode: "WORKER_TIMEOUT",
          updatedAt: now,
        })
        .where(eq(streetviewContributions.id, row.contribution_id));
    }

    return {
      requeued: (requeued.rows as Array<{ id: string }>).map((row) => row.id),
      failed: (failed.rows as Array<{ id: string }>).map((row) => row.id),
    };
  }

  async getStreetviewProcessingJobsForContribution(
    contributionId: string,
  ): Promise<StreetviewProcessingJob[]> {
    return db
      .select()
      .from(streetviewProcessingJobs)
      .where(eq(streetviewProcessingJobs.contributionId, contributionId))
      .orderBy(desc(streetviewProcessingJobs.createdAt));
  }

  async incrementTourReportCount(tourId: string): Promise<{ reportCount: number; status: string }> {
    const REPORT_THRESHOLD = 3;
    
    const [tour] = await db
      .select({ reportCount: virtualTours.reportCount, status: virtualTours.status })
      .from(virtualTours)
      .where(eq(virtualTours.id, tourId))
      .limit(1);
    
    if (!tour) {
      throw new Error("Tour not found");
    }
    
    const newReportCount = (tour.reportCount || 0) + 1;
    const newStatus = newReportCount >= REPORT_THRESHOLD ? "signale" : tour.status;
    
    await db
      .update(virtualTours)
      .set({ 
        reportCount: newReportCount,
        status: newStatus
      })
      .where(eq(virtualTours.id, tourId));
    
    return { reportCount: newReportCount, status: newStatus };
  }
}

export const storage = new DbStorage();