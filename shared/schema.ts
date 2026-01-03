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
  photo: text("photo"),
  video: text("video"),
  medias: text("medias").array(),
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

export const places = pgTable("places", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  osmId: text("osm_id").notNull(),
  osmType: text("osm_type").notNull(),
  placeType: text("place_type").notNull(),
  name: text("name").notNull(),
  latitude: text("latitude").notNull(),
  longitude: text("longitude").notNull(),
  address: text("address"),
  quartier: text("quartier"),
  ville: text("ville"),
  region: text("region"),
  telephone: text("telephone"),
  email: text("email"),
  website: text("website"),
  horaires: text("horaires"),
  tags: jsonb("tags"),
  source: text("source").default("OSM"),
  confidenceScore: decimal("confidence_score", { precision: 3, scale: 2 }).default("0.5"),
  lastSyncedAt: timestamp("last_synced_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  osmIdIdx: uniqueIndex("osm_id_idx").on(table.osmId, table.osmType),
  placeTypeIdx: index("place_type_idx").on(table.placeType),
  villeIdx: index("ville_idx").on(table.ville),
  regionIdx: index("region_idx").on(table.region),
}));

export const insertPlaceSchema = createInsertSchema(places).omit({
  id: true,
  lastSyncedAt: true,
  updatedAt: true,
});

export type Place = typeof places.$inferSelect;
export type InsertPlace = z.infer<typeof insertPlaceSchema>;

export const DataSources = {
  OSM: "OSM",
  MANUAL: "MANUAL",
  GOVERNMENT: "GOVERNMENT",
} as const;

export const PlaceTypes = {
  PHARMACY: "pharmacy",
  HOSPITAL: "hospital",
  BANK: "bank",
  ATM: "atm",
  POLICE: "police",
  CAISSE: "caisses_populaires",
} as const;

export const VerificationStatuses = {
  PENDING: "pending",
  VERIFIED: "verified",
  REJECTED: "rejected",
} as const;

export const placeVerifications = pgTable("place_verifications", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  placeId: text("place_id").notNull().references(() => places.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  status: text("status").notNull().default("pending"),
  comment: text("comment"),
  createdAt: timestamp("created_at").defaultNow(),
});
