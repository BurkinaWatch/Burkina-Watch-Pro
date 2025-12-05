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
});

export const onlineSessions = pgTable("online_sessions", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
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
  latitude: z.union([z.string(), z.number()]).transform(val => String(val)),
  longitude: z.union([z.string(), z.number()]).transform(val => String(val)),
  localisation: z.string().optional(),
  niveauUrgence: z.string().optional(),
  statut: z.enum(["en_attente", "en_cours", "resolu", "rejete"]).optional(),
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