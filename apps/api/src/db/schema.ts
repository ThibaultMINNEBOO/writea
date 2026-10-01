import { relations, sql } from "drizzle-orm";
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

const id = () =>
  text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID());

const createdAt = () =>
  integer("created_at", { mode: "timestamp_ms" }).notNull().default(sql`(unixepoch() * 1000)`);

const updatedAt = () =>
  integer("updated_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch() * 1000)`)
    .$onUpdate(() => new Date());

export const user = sqliteTable("user", {
  id: id(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: integer("email_verified", { mode: "boolean" }).notNull().default(false),
  image: text("image"),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const session = sqliteTable(
  "session",
  {
    id: id(),
    expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
    token: text("token").notNull().unique(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("session_user_idx").on(t.userId)],
);

export const account = sqliteTable(
  "account",
  {
    id: id(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: integer("access_token_expires_at", { mode: "timestamp_ms" }),
    refreshTokenExpiresAt: integer("refresh_token_expires_at", { mode: "timestamp_ms" }),
    scope: text("scope"),
    password: text("password"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("account_user_idx").on(t.userId)],
);

export const verification = sqliteTable(
  "verification",
  {
    id: id(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("verification_identifier_idx").on(t.identifier)],
);

export const works = sqliteTable(
  "works",
  {
    id: id(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    subtitle: text("subtitle"),
    author: text("author").notNull(),
    synopsis: text("synopsis"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("works_user_idx").on(t.userId)],
);

export const chapters = sqliteTable(
  "chapters",
  {
    id: id(),
    workId: text("work_id")
      .notNull()
      .references(() => works.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    content: text("content").notNull().default(""),
    position: integer("position").notNull(),
    wordCount: integer("word_count").notNull().default(0),
    wordGoal: integer("word_goal"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("chapters_work_idx").on(t.workId, t.position)],
);

export const chapterVersions = sqliteTable(
  "chapter_versions",
  {
    id: id(),
    chapterId: text("chapter_id")
      .notNull()
      .references(() => chapters.id, { onDelete: "cascade" }),
    label: text("label").notNull(),
    title: text("title").notNull(),
    content: text("content").notNull(),
    wordCount: integer("word_count").notNull(),
    createdAt: createdAt(),
  },
  (t) => [index("chapter_versions_chapter_idx").on(t.chapterId)],
);

export const shareLinks = sqliteTable(
  "share_links",
  {
    token: text("token").primaryKey(),
    versionId: text("version_id")
      .notNull()
      .references(() => chapterVersions.id, { onDelete: "cascade" }),
    createdAt: createdAt(),
    revokedAt: integer("revoked_at", { mode: "timestamp_ms" }),
  },
  (t) => [index("share_links_version_idx").on(t.versionId)],
);

export const reviewComments = sqliteTable(
  "review_comments",
  {
    id: id(),
    versionId: text("version_id")
      .notNull()
      .references(() => chapterVersions.id, { onDelete: "cascade" }),
    reviewerName: text("reviewer_name").notNull(),
    quote: text("quote").notNull(),
    startOffset: integer("start_offset").notNull(),
    endOffset: integer("end_offset").notNull(),
    body: text("body").notNull(),
    createdAt: createdAt(),
    resolvedAt: integer("resolved_at", { mode: "timestamp_ms" }),
  },
  (t) => [index("review_comments_version_idx").on(t.versionId)],
);

export const thesaurus = sqliteTable(
  "thesaurus",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    key: text("key").notNull(),
    word: text("word").notNull(),
    partOfSpeech: text("part_of_speech"),
    synonyms: text("synonyms", { mode: "json" }).$type<string[]>().notNull(),
  },
  (t) => [index("thesaurus_key_idx").on(t.key)],
);

export const worksRelations = relations(works, ({ many }) => ({
  chapters: many(chapters),
}));

export const chaptersRelations = relations(chapters, ({ one, many }) => ({
  work: one(works, { fields: [chapters.workId], references: [works.id] }),
  versions: many(chapterVersions),
}));

export const chapterVersionsRelations = relations(chapterVersions, ({ one, many }) => ({
  chapter: one(chapters, { fields: [chapterVersions.chapterId], references: [chapters.id] }),
  shareLinks: many(shareLinks),
  comments: many(reviewComments),
}));

export const shareLinksRelations = relations(shareLinks, ({ one }) => ({
  version: one(chapterVersions, {
    fields: [shareLinks.versionId],
    references: [chapterVersions.id],
  }),
}));

export const reviewCommentsRelations = relations(reviewComments, ({ one }) => ({
  version: one(chapterVersions, {
    fields: [reviewComments.versionId],
    references: [chapterVersions.id],
  }),
}));
