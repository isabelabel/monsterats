import { relations } from "drizzle-orm";
import {
  doublePrecision,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { user, session, account, verification } from "./auth-schema";

export { user, session, account, verification };

export const challenges = pgTable(
  "challenges",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    creatorId: text("creator_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    startDate: timestamp("start_date", { withTimezone: true, mode: "date" })
      .notNull(),
    endDate: timestamp("end_date", { withTimezone: true, mode: "date" })
      .notNull(),
    inviteCode: text("invite_code").notNull().unique(),
    maxCheckinsPerDay: integer("max_checkins_per_day").notNull().default(2),
    minCheckinDurationMin: integer("min_checkin_duration_min")
      .notNull()
      .default(30),
    secondCheckinMinTotalMin: integer("second_checkin_min_total_min"),
    scoringRules: jsonb("scoring_rules").$type<unknown[]>().notNull(),
    rankingWeights: jsonb("ranking_weights")
      .notNull()
      .$type<{ points: number; consistency: number }>(),
    timezone: text("timezone").notNull().default("America/Sao_Paulo"),
    /**
     * Local: file name only, served at /api/media/challenges/{file}.
     * Vercel Blob: full https URL.
     */
    coverImageFile: text("cover_image_file"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (t) => [index("challenges_creator_idx").on(t.creatorId)],
);

export const challengeMemberships = pgTable(
  "challenge_memberships",
  {
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    challengeId: text("challenge_id")
      .notNull()
      .references(() => challenges.id, { onDelete: "cascade" }),
    joinedAt: timestamp("joined_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.userId, t.challengeId] }),
  }),
);

export const checkIns = pgTable(
  "check_ins",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    challengeId: text("challenge_id")
      .notNull()
      .references(() => challenges.id, { onDelete: "cascade" }),
    activityType: text("activity_type").notNull(),
    durationMin: integer("duration_min").notNull(),
    distanceKm: doublePrecision("distance_km"),
    elevationM: doublePrecision("elevation_m"),
    photoUrl: text("photo_url").notNull(),
    description: text("description"),
    pointsEarned: doublePrecision("points_earned").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    index("check_ins_challenge_created_idx").on(t.challengeId, t.createdAt),
    index("check_ins_user_challenge_idx").on(t.userId, t.challengeId),
  ],
);

export const reactions = pgTable(
  "reactions",
  {
    id: text("id").primaryKey(),
    checkinId: text("checkin_id")
      .notNull()
      .references(() => checkIns.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    emoji: text("emoji").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    uniqueIndex("reactions_user_checkin_emoji").on(
      t.checkinId,
      t.userId,
      t.emoji,
    ),
  ],
);

export const comments = pgTable(
  "comments",
  {
    id: text("id").primaryKey(),
    checkinId: text("checkin_id")
      .notNull()
      .references(() => checkIns.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    text: text("text").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
  },
  (t) => [index("comments_checkin_idx").on(t.checkinId, t.createdAt)],
);

export const challengesRelations = relations(challenges, ({ one, many }) => ({
  creator: one(user, {
    fields: [challenges.creatorId],
    references: [user.id],
  }),
  memberships: many(challengeMemberships),
  checkIns: many(checkIns),
}));

export const challengeMembershipsRelations = relations(
  challengeMemberships,
  ({ one }) => ({
    user: one(user, {
      fields: [challengeMemberships.userId],
      references: [user.id],
    }),
    challenge: one(challenges, {
      fields: [challengeMemberships.challengeId],
      references: [challenges.id],
    }),
  }),
);

export const checkInsRelations = relations(checkIns, ({ one, many }) => ({
  user: one(user, {
    fields: [checkIns.userId],
    references: [user.id],
  }),
  challenge: one(challenges, {
    fields: [checkIns.challengeId],
    references: [challenges.id],
  }),
  reactions: many(reactions),
  comments: many(comments),
}));

export const reactionsRelations = relations(reactions, ({ one }) => ({
  checkIn: one(checkIns, {
    fields: [reactions.checkinId],
    references: [checkIns.id],
  }),
  user: one(user, {
    fields: [reactions.userId],
    references: [user.id],
  }),
}));

export const commentsRelations = relations(comments, ({ one }) => ({
  checkIn: one(checkIns, {
    fields: [comments.checkinId],
    references: [checkIns.id],
  }),
  user: one(user, {
    fields: [comments.userId],
    references: [user.id],
  }),
}));
