import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, boolean, integer, decimal, jsonb, index, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  email: text("email").unique().notNull(),
  password: text("password"),
  authProvider: text("auth_provider").default("email"),
  googleId: text("google_id"),
  facebookId: text("facebook_id"),
  firstName: text("first_name"),
  lastName: text("last_name"),
  profileImageUrl: text("profile_image_url"),
  telephone: text("telephone"),
  bio: text("bio"),
  ville: text("ville"),
  metier: text("metier"),
  role: text("role").default("citoyen"),
  emailTrackingEnabled: boolean("email_tracking_enabled").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  userPoints: integer("user_points").default(0).notNull(),
  userLevel: text("user_level").default("sentinelle").notNull(),
});

export const signalements = pgTable("signalements", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  titre: text("titre").notNull(),
  description: text("description").notNull(),
  categorie: text("categorie").notNull(),
  latitude: decimal("latitude", { precision: 10, scale: 7 }).notNull(),
  longitude: decimal("longitude", { precision: 10, scale: 7 }).notNull(),
  localisation: text("localisation"),
  photo: text("photo"), // Base64 encoded (deprecated - use medias)
  video: text("video"), // Base64 encoded or URL (deprecated - use medias)
  medias: text("medias").array(), // Array of base64 encoded images/videos
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  isAnonymous: boolean("is_anonymous").default(false),
  isSOS: boolean("is_sos").default(false),
  niveauUrgence: text("niveau_urgence"),
  statut: text("statut").default("en_attente"),
  likes: integer("likes").default(0),
  commentairesCount: integer("commentaires_count").default(0),
  sharesCount: integer("shares_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const commentaires = pgTable("commentaires", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  signalementId: text("signalement_id").notNull().references(() => signalements.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  contenu: text("contenu").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const trackingSessions = pgTable("tracking_sessions", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  startTime: timestamp("started_at").notNull().defaultNow(),
  endTime: timestamp("ended_at"),
  isActive: boolean("is_active").notNull().default(true),
  isPanicMode: boolean("is_panic_mode").default(false),
  shareToken: text("share_token"),
});

export const onlineSessions = pgTable("online_sessions", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  connectedAt: timestamp("connected_at").notNull().defaultNow(),
  disconnectedAt: timestamp("disconnected_at"),
});

export const locationPoints = pgTable("location_points", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: text("session_id").references(() => trackingSessions.id, { onDelete: "cascade" }).notNull(),
  userId: text("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  latitude: decimal("latitude", { precision: 10, scale: 7 }).notNull(),
  longitude: decimal("longitude", { precision: 10, scale: 7 }).notNull(),
  accuracy: decimal("accuracy", { precision: 10, scale: 2 }),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export const notifications = pgTable("notifications", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // "urgence", "resolu", "info", "comment", "like"
  title: text("title").notNull(),
  description: text("description").notNull(),
  signalementId: text("signalement_id").references(() => signalements.id, { onDelete: "cascade" }),
  read: boolean("read").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const emergencyContacts = pgTable("emergency_contacts", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  email: text("email"),
  isPrimary: boolean("is_primary").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const panicAlerts = pgTable("panic_alerts", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  latitude: text("latitude").notNull(),
  longitude: text("longitude").notNull(),
  address: text("address"),
  sentTo: text("sent_to").array().notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const signalementLikes = pgTable("signalement_likes", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  signalementId: text("signalement_id").notNull().references(() => signalements.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  uniqueUserSignalement: uniqueIndex("signalement_likes_user_signalement_idx").on(table.userId, table.signalementId),
}));

export const chatMessages = pgTable("chat_messages", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: text("session_id").notNull(),
  userId: text("user_id").references(() => users.id, { onDelete: "cascade" }),
  role: text("role").notNull(), // "user" | "assistant"
  content: text("content").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  sessionIdIdx: index("chat_messages_session_id_idx").on(table.sessionId),
  userIdIdx: index("chat_messages_user_id_idx").on(table.userId),
}));

export const chatHistory = pgTable("chat_history", {
  id: text("id").primaryKey(),
  sessionId: text("session_id").notNull(),
  role: text("role").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const moderationLogs = pgTable("moderation_logs", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull(),
  contentType: text("content_type").notNull(), // signalement, commentaire, sos
  content: text("content").notNull(),
  severity: text("severity").notNull(), // safe, warning, blocked
  isApproved: boolean("is_approved").notNull(),
  flaggedWords: text("flagged_words").array(),
  reason: text("reason"),
  suggestion: text("suggestion"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const auditLogs = pgTable("audit_logs", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").references(() => users.id, { onDelete: "cascade" }),
  action: text("action").notNull(), // "CREATE_SIGNALEMENT", "UPDATE_STATUS", "DELETE", "LOGIN", "LOGOUT", "ADMIN_ACTION", etc.
  resourceType: text("resource_type"), // "signalement", "user", "comment", etc.
  resourceId: text("resource_id"),
  details: jsonb("details"), // Informations supplémentaires (IP, user-agent, etc.)
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  severity: text("severity").default("info"), // "info", "warning", "critical"
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  userIdIdx: index("audit_logs_user_id_idx").on(table.userId),
  actionIdx: index("audit_logs_action_idx").on(table.action),
  createdAtIdx: index("audit_logs_created_at_idx").on(table.createdAt),
}));

export const refreshTokens = pgTable("refresh_tokens", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  revokedAt: timestamp("revoked_at"),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
}, (table) => ({
  tokenIdx: index("refresh_tokens_token_idx").on(table.token),
  userIdIdx: index("refresh_tokens_user_id_idx").on(table.userId),
}));

export const pushSubscriptions = pgTable("push_subscriptions", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").references(() => users.id, { onDelete: "cascade" }),
  endpoint: text("endpoint").notNull().unique(),
  p256dh: text("p256dh").notNull(),
  auth: text("auth").notNull(),
  latitude: decimal("latitude", { precision: 10, scale: 7 }),
  longitude: decimal("longitude", { precision: 10, scale: 7 }),
  radiusKm: integer("radius_km").default(5),
  alertCategories: text("alert_categories").array(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  userIdIdx: index("push_subscriptions_user_id_idx").on(table.userId),
  locationIdx: index("push_subscriptions_location_idx").on(table.latitude, table.longitude),
}));

export const insertPushSubscriptionSchema = createInsertSchema(pushSubscriptions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertPushSubscription = z.infer<typeof insertPushSubscriptionSchema>;
export type PushSubscription = typeof pushSubscriptions.$inferSelect;


export const upsertUserSchema = createInsertSchema(users).omit({
  createdAt: true,
  updatedAt: true,
  role: true,
});

export const updateUserProfileSchema = createInsertSchema(users).omit({
  id: true,
  email: true,
  createdAt: true,
  updatedAt: true,
  role: true,
}).partial();

export const insertSignalementSchema = createInsertSchema(signalements, {
  latitude: z.union([z.string(), z.number()]).transform(val => String(val)),
  longitude: z.union([z.string(), z.number()]).transform(val => String(val)),
  medias: z.array(z.string()).optional(),
  localisation: z.string().optional(),
  niveauUrgence: z.string().optional(),
}).omit({
  id: true,
  createdAt: true,
  likes: true,
  commentairesCount: true,
  sharesCount: true,
  statut: true,
  photo: true,
  video: true,
});

export const updateSignalementSchema = createInsertSchema(signalements, {
  latitude: z.union([z.string(), z.number()]).transform(val => String(val)).optional(),
  longitude: z.union([z.string(), z.number()]).transform(val => String(val)).optional(),
  localisation: z.string().optional(),
  niveauUrgence: z.string().optional(),
  statut: z.enum(["en_attente", "en_cours", "resolu", "rejete"]).optional(),
  medias: z.array(z.string()).optional(),
}).omit({
  id: true,
  createdAt: true,
  likes: true,
  commentairesCount: true,
  sharesCount: true,
  userId: true,
  isAnonymous: true,
  isSOS: true,
  photo: true,
  video: true,
}).partial();

export const insertCommentaireSchema = createInsertSchema(commentaires).omit({
  id: true,
  createdAt: true,
});

export const insertTrackingSessionSchema = createInsertSchema(trackingSessions).omit({
  id: true,
  startTime: true,
  isActive: true,
});

export const insertOnlineSessionSchema = createInsertSchema(onlineSessions).omit({
  id: true,
  connectedAt: true,
  disconnectedAt: true,
});

export const insertLocationPointSchema = createInsertSchema(locationPoints, {
  latitude: z.union([z.string(), z.number()]).transform(val => String(val)),
  longitude: z.union([z.string(), z.number()]).transform(val => String(val)),
  accuracy: z.union([z.string(), z.number()]).transform(val => String(val)).optional(),
}).omit({
  id: true,
  timestamp: true,
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
});

export const insertEmergencyContactSchema = createInsertSchema(emergencyContacts).omit({
  id: true,
  createdAt: true,
});

export const insertPanicAlertSchema = createInsertSchema(panicAlerts).omit({
  id: true,
  createdAt: true,
});

export const insertSignalementLikeSchema = createInsertSchema(signalementLikes).omit({
  id: true,
  createdAt: true,
});

export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({
  id: true,
  createdAt: true,
});

export const insertAuditLogSchema = createInsertSchema(auditLogs).omit({
  id: true,
  createdAt: true,
});

export const selectNotificationSchema = createSelectSchema(notifications);
export const selectEmergencyContactSchema = createSelectSchema(emergencyContacts);
export const selectPanicAlertSchema = createSelectSchema(panicAlerts);
export const selectSignalementLikeSchema = createSelectSchema(signalementLikes);
export const selectChatMessageSchema = createSelectSchema(chatMessages);
export const selectAuditLogSchema = createSelectSchema(auditLogs);


export type UpsertUser = z.infer<typeof upsertUserSchema>;
export type UpdateUserProfile = z.infer<typeof updateUserProfileSchema>;
export type User = typeof users.$inferSelect;
export type InsertSignalement = z.infer<typeof insertSignalementSchema>;
export type UpdateSignalement = z.infer<typeof updateSignalementSchema>;
export type Signalement = typeof signalements.$inferSelect;
export type InsertCommentaire = z.infer<typeof insertCommentaireSchema>;
export type Commentaire = typeof commentaires.$inferSelect;
export type InsertTrackingSession = z.infer<typeof insertTrackingSessionSchema>;
export type TrackingSession = typeof trackingSessions.$inferSelect;
export type InsertOnlineSession = z.infer<typeof insertOnlineSessionSchema>;
export type OnlineSession = typeof onlineSessions.$inferSelect;
export type InsertLocationPoint = z.infer<typeof insertLocationPointSchema>;
export type LocationPoint = typeof locationPoints.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notifications.$inferSelect;
export type InsertEmergencyContact = z.infer<typeof insertEmergencyContactSchema>;
export type EmergencyContact = typeof emergencyContacts.$inferSelect;
export type InsertPanicAlert = z.infer<typeof insertPanicAlertSchema>;
export type PanicAlert = typeof panicAlerts.$inferSelect;
export type InsertSignalementLike = z.infer<typeof insertSignalementLikeSchema>;
export type SignalementLike = typeof signalementLikes.$inferSelect;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;
export type AuditLog = typeof auditLogs.$inferSelect;


export type SignalementWithAuthor = Signalement & {
  auteurFirstName?: string | null;
  auteurLastName?: string | null;
};

export type TrackingSessionWithTrajectory = TrackingSession & {
  trajectoryUrl: string | null;
  pointCount: number;
};

export const categories = ["urgence", "securite", "sante", "environnement", "corruption", "infrastructure", "personne_recherchee"] as const;
export const statuts = ["en_attente", "en_cours", "resolu", "rejete"] as const;
export const niveauxUrgence = ["faible", "moyen", "critique"] as const;

export type Categorie = typeof categories[number];
export type Statut = typeof statuts[number];
export type NiveauUrgence = typeof niveauxUrgence[number];

// ============================================
// VIRTUAL TOURS / STREETVIEW - Contributions citoyennes
// ============================================

// Statuts des tours virtuels
export const virtualTourStatuses = ["en_traitement", "disponible", "signale"] as const;
export type VirtualTourStatus = typeof virtualTourStatuses[number];

// Tours virtuels (séries de photos d'un lieu)
export const virtualTours = pgTable("virtual_tours", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  quartier: text("quartier"),
  latitude: decimal("latitude", { precision: 10, scale: 7 }).notNull(),
  longitude: decimal("longitude", { precision: 10, scale: 7 }).notNull(),
  photoCount: integer("photo_count").notNull().default(0),
  coverPhotoId: text("cover_photo_id"),
  isPublished: boolean("is_published").notNull().default(true),
  status: text("status").notNull().default("disponible"), // en_traitement, disponible, signale
  viewCount: integer("view_count").notNull().default(0),
  reportCount: integer("report_count").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// StreetView Points - photos capturées anonymement
export const streetviewPoints = pgTable("streetview_points", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  tourId: text("tour_id").references(() => virtualTours.id, { onDelete: "cascade" }),
  latitude: decimal("latitude", { precision: 10, scale: 7 }).notNull(),
  longitude: decimal("longitude", { precision: 10, scale: 7 }).notNull(),
  imageData: text("image_data").notNull(),
  thumbnailData: text("thumbnail_data"),
  heading: decimal("heading", { precision: 5, scale: 2 }),
  pitch: decimal("pitch", { precision: 5, scale: 2 }),
  orderIndex: integer("order_index").default(0),
  capturedAt: timestamp("captured_at").notNull().defaultNow(),
  deviceInfo: text("device_info"),
});

export const insertVirtualTourSchema = createInsertSchema(virtualTours).omit({
  id: true,
  photoCount: true,
  viewCount: true,
  createdAt: true,
  updatedAt: true,
});

export const insertStreetviewPointSchema = createInsertSchema(streetviewPoints).omit({
  id: true,
  capturedAt: true,
});

export type InsertVirtualTour = z.infer<typeof insertVirtualTourSchema>;
export type VirtualTour = typeof virtualTours.$inferSelect;
export type InsertStreetviewPoint = z.infer<typeof insertStreetviewPointSchema>;
export type StreetviewPoint = typeof streetviewPoints.$inferSelect;

export type VirtualTourWithPhotos = VirtualTour & {
  photos: StreetviewPoint[];
};

// ============================================
// OUAGA EN 3D - Modèles de données
// ============================================

// Sources d'images disponibles
export const imageSourceProviders = ["mapillary", "openstreetcam", "wikimedia", "citizen"] as const;
export type ImageSourceProvider = typeof imageSourceProviders[number];

// Statuts des jobs de reconstruction
export const reconstructionJobStatuses = ["pending", "processing", "completed", "failed"] as const;
export type ReconstructionJobStatus = typeof reconstructionJobStatuses[number];

// Niveaux de détail (LOD) pour les tuiles 3D
export const lodLevels = [0, 1, 2, 3] as const;
export type LodLevel = typeof lodLevels[number];

// Table des assets images collectés
export const ouaga3dImageAssets = pgTable("ouaga3d_image_assets", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  source: text("source").notNull(), // mapillary, openstreetcam, wikimedia, citizen
  sourceAssetId: text("source_asset_id").notNull(), // ID original de la source
  latitude: decimal("latitude", { precision: 10, scale: 7 }).notNull(),
  longitude: decimal("longitude", { precision: 10, scale: 7 }).notNull(),
  altitude: decimal("altitude", { precision: 10, scale: 2 }),
  heading: decimal("heading", { precision: 5, scale: 2 }), // Orientation 0-360
  pitch: decimal("pitch", { precision: 5, scale: 2 }),
  captureDate: timestamp("capture_date"),
  license: text("license"), // CC-BY-SA, public domain, etc.
  imageUrl: text("image_url"), // URL de l'image originale
  thumbnailUrl: text("thumbnail_url"),
  providerMeta: jsonb("provider_meta"), // Métadonnées spécifiques au provider
  usedInSceneId: text("used_in_scene_id"), // Référence à la scène 3D
  addedAt: timestamp("added_at").notNull().defaultNow(),
}, (table) => ({
  sourceAssetIdx: uniqueIndex("ouaga3d_source_asset_idx").on(table.source, table.sourceAssetId),
  locationIdx: index("ouaga3d_location_idx").on(table.latitude, table.longitude),
  sourceIdx: index("ouaga3d_source_idx").on(table.source),
}));

// Table des tuiles de scènes 3D
export const ouaga3dSceneTiles = pgTable("ouaga3d_scene_tiles", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  quadkey: text("quadkey").notNull(), // Clé de tuile géographique
  lodLevel: integer("lod_level").notNull().default(0), // 0=haute résolution, 3=basse
  tileUrl: text("tile_url"), // URL du fichier 3D (glTF, 3D Tiles)
  boundingBox: jsonb("bounding_box"), // {minLat, maxLat, minLng, maxLng}
  vertexCount: integer("vertex_count"), // Nombre de sommets pour stats
  textureCount: integer("texture_count"),
  status: text("status").notNull().default("pending"), // pending, processing, completed, failed
  imageAssetIds: text("image_asset_ids").array(), // Images utilisées
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  quadkeyLodIdx: uniqueIndex("ouaga3d_quadkey_lod_idx").on(table.quadkey, table.lodLevel),
  statusIdx: index("ouaga3d_scene_status_idx").on(table.status),
}));

// Table des jobs de reconstruction 3D
export const ouaga3dReconstructionJobs = pgTable("ouaga3d_reconstruction_jobs", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  jobDate: timestamp("job_date").notNull().defaultNow(),
  status: text("status").notNull().default("pending"),
  quadkey: text("quadkey"), // Zone ciblée
  imagesProcessed: integer("images_processed").default(0),
  imagesTotal: integer("images_total").default(0),
  tilesGenerated: integer("tiles_generated").default(0),
  errorMessage: text("error_message"),
  statsJson: jsonb("stats_json"), // Statistiques détaillées
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  statusIdx: index("ouaga3d_job_status_idx").on(table.status),
  jobDateIdx: index("ouaga3d_job_date_idx").on(table.jobDate),
}));

// Table de suivi de la couverture géographique
export const ouaga3dCoverage = pgTable("ouaga3d_coverage", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  quadkey: text("quadkey").notNull().unique(),
  centerLat: decimal("center_lat", { precision: 10, scale: 7 }).notNull(),
  centerLng: decimal("center_lng", { precision: 10, scale: 7 }).notNull(),
  imageCount: integer("image_count").notNull().default(0),
  lastUpdated: timestamp("last_updated").notNull().defaultNow(),
  hasSceneTile: boolean("has_scene_tile").notNull().default(false),
  coveragePercent: integer("coverage_percent").default(0), // 0-100
});

// Table pour le suivi des exécutions du scheduler
export const ouaga3dSchedulerRuns = pgTable("ouaga3d_scheduler_runs", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  runDate: timestamp("run_date").notNull().defaultNow(),
  provider: text("provider").notNull(), // mapillary, openstreetcam, etc.
  imagesFound: integer("images_found").default(0),
  imagesAdded: integer("images_added").default(0),
  imagesDuplicate: integer("images_duplicate").default(0),
  success: boolean("success").notNull().default(false),
  errorMessage: text("error_message"),
  durationMs: integer("duration_ms"),
});

// Schemas d'insertion
export const insertOuaga3dImageAssetSchema = createInsertSchema(ouaga3dImageAssets).omit({
  id: true,
  addedAt: true,
});

export const insertOuaga3dSceneTileSchema = createInsertSchema(ouaga3dSceneTiles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertOuaga3dReconstructionJobSchema = createInsertSchema(ouaga3dReconstructionJobs).omit({
  id: true,
  createdAt: true,
});

export const insertOuaga3dCoverageSchema = createInsertSchema(ouaga3dCoverage).omit({
  id: true,
});

export const insertOuaga3dSchedulerRunSchema = createInsertSchema(ouaga3dSchedulerRuns).omit({
  id: true,
});

// Types
export type InsertOuaga3dImageAsset = z.infer<typeof insertOuaga3dImageAssetSchema>;
export type Ouaga3dImageAsset = typeof ouaga3dImageAssets.$inferSelect;
export type InsertOuaga3dSceneTile = z.infer<typeof insertOuaga3dSceneTileSchema>;
export type Ouaga3dSceneTile = typeof ouaga3dSceneTiles.$inferSelect;
export type InsertOuaga3dReconstructionJob = z.infer<typeof insertOuaga3dReconstructionJobSchema>;
export type Ouaga3dReconstructionJob = typeof ouaga3dReconstructionJobs.$inferSelect;
export type InsertOuaga3dCoverage = z.infer<typeof insertOuaga3dCoverageSchema>;
export type Ouaga3dCoverage = typeof ouaga3dCoverage.$inferSelect;
export type InsertOuaga3dSchedulerRun = z.infer<typeof insertOuaga3dSchedulerRunSchema>;
export type Ouaga3dSchedulerRun = typeof ouaga3dSchedulerRuns.$inferSelect;

// Type pour les statistiques de couverture
export type Ouaga3dStats = {
  totalImages: number;
  totalScenes: number;
  coveragePercent: number;
  lastUpdate: string | null;
  imagesBySource: Record<string, number>;
  jobsCompleted: number;
  jobsPending: number;
};

// ============================================================================
// SYSTÈME DE LIEUX VÉRIFIÉS (OpenStreetMap + Crowdsourced Verification)
// ============================================================================

// Table des lieux (pharmacies, restaurants, stations-service, marchés, boutiques)
export const places = pgTable("places", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  osmId: text("osm_id").notNull(), // OpenStreetMap ID
  osmType: text("osm_type").notNull(), // node, way, relation
  placeType: text("place_type").notNull(), // pharmacy, restaurant, fuel, marketplace, shop
  name: text("name").notNull(),
  latitude: decimal("latitude", { precision: 10, scale: 7 }).notNull(),
  longitude: decimal("longitude", { precision: 10, scale: 7 }).notNull(),
  address: text("address"),
  quartier: text("quartier"),
  ville: text("ville"),
  region: text("region"),
  telephone: text("telephone"),
  email: text("email"),
  website: text("website"),
  horaires: text("horaires"),
  imageUrl: text("image_url"), // URL de l'image (source externe ou stockée)
  tags: jsonb("tags"), // All OSM tags for this place
  // Nouveaux champs pour la migration OSM
  source: text("source").notNull().default("OSM"), // OSM, COMMUNAUTE, OFFICIEL
  confidenceScore: decimal("confidence_score", { precision: 3, scale: 2 }).notNull().default("0.5"), // 0.0 - 1.0
  confirmations: integer("confirmations").notNull().default(0),
  reports: integer("reports").notNull().default(0),
  verificationStatus: text("verification_status").notNull().default("pending"), // pending, verified, needs_review
  lastSyncedAt: timestamp("last_synced_at").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  osmIdTypeIdx: uniqueIndex("places_osm_id_type_idx").on(table.osmId, table.osmType),
  placeTypeIdx: index("places_place_type_idx").on(table.placeType),
  villeIdx: index("places_ville_idx").on(table.ville),
  regionIdx: index("places_region_idx").on(table.region),
  verificationStatusIdx: index("places_verification_status_idx").on(table.verificationStatus),
  sourceIdx: index("places_source_idx").on(table.source),
}));

// Table des vérifications de lieux (confirmations et signalements)
export const placeVerifications = pgTable("place_verifications", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  placeId: text("place_id").notNull().references(() => places.id, { onDelete: "cascade" }),
  userId: text("user_id").references(() => users.id, { onDelete: "set null" }),
  action: text("action").notNull(), // confirm, report
  comment: text("comment"),
  ipAddress: text("ip_address"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  placeIdIdx: index("place_verifications_place_id_idx").on(table.placeId),
  userIdIdx: index("place_verifications_user_id_idx").on(table.userId),
  ipIdx: index("place_verifications_ip_idx").on(table.ipAddress),
}));

// Schemas d'insertion pour les lieux
export const insertPlaceSchema = createInsertSchema(places, {
  latitude: z.union([z.string(), z.number()]).transform(val => String(val)),
  longitude: z.union([z.string(), z.number()]).transform(val => String(val)),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  confirmations: true,
  reports: true,
  verificationStatus: true,
});

export const insertPlaceVerificationSchema = createInsertSchema(placeVerifications).omit({
  id: true,
  createdAt: true,
});

// Types pour les lieux
export type InsertPlace = z.infer<typeof insertPlaceSchema>;
export type Place = typeof places.$inferSelect;
export type InsertPlaceVerification = z.infer<typeof insertPlaceVerificationSchema>;
export type PlaceVerification = typeof placeVerifications.$inferSelect;

// Enum pour les types de lieux
export const PlaceTypes = {
  PHARMACY: "pharmacy",
  RESTAURANT: "restaurant",
  FUEL: "fuel",
  MARKETPLACE: "marketplace",
  SHOP: "shop",
} as const;

export type PlaceType = typeof PlaceTypes[keyof typeof PlaceTypes];

// Enum pour les statuts de vérification
export const VerificationStatuses = {
  PENDING: "pending",
  VERIFIED: "verified",
  NEEDS_REVIEW: "needs_review",
} as const;

export type VerificationStatus = typeof VerificationStatuses[keyof typeof VerificationStatuses];

// Enum pour les sources de données
export const DataSources = {
  OSM: "OSM",
  COMMUNAUTE: "COMMUNAUTE", 
  OFFICIEL: "OFFICIEL",
} as const;

export type DataSource = typeof DataSources[keyof typeof DataSources];