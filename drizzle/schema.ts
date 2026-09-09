import {
  int, mysqlEnum, mysqlTable, text, timestamp, varchar, double
} from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── 1. weekly_campaign_summary ───────────────────────────────────────────────
export const weeklyCampaignSummary = mysqlTable("weekly_campaign_summary", {
  id: int("id").autoincrement().primaryKey(),
  campaignName: varchar("campaign_name", { length: 255 }).notNull(),
  startDate: varchar("start_date", { length: 20 }).notNull(),
  endDate: varchar("end_date", { length: 20 }).notNull(),
  clicks: int("clicks"),
  impressions: int("impressions"),
  ctr: double("ctr"),
  avgCpc: double("avg_cpc"),
  totalCost: double("total_cost"),
  conversions: int("conversions"),
  conversionRate: double("conversion_rate"),
  costPerConversion: double("cost_per_conversion"),
  targetCpaMin: double("target_cpa_min"),
  targetCpaMax: double("target_cpa_max"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── 2. ad_group_performance ──────────────────────────────────────────────────
export const adGroupPerformance = mysqlTable("ad_group_performance", {
  id: int("id").autoincrement().primaryKey(),
  weeklySummaryId: int("weekly_summary_id").notNull(),
  adGroupName: varchar("ad_group_name", { length: 255 }).notNull(),
  clicks: int("clicks"),
  impressions: int("impressions"),
  ctr: double("ctr"),
  avgCpc: double("avg_cpc"),
  totalCost: double("total_cost"),
  conversions: int("conversions"),
  conversionRate: double("conversion_rate"),
  costPerConversion: double("cost_per_conversion"),
});

// ─── 3. keyword_performance ───────────────────────────────────────────────────
export const keywordPerformance = mysqlTable("keyword_performance", {
  id: int("id").autoincrement().primaryKey(),
  weeklySummaryId: int("weekly_summary_id").notNull(),
  keyword: varchar("keyword", { length: 255 }).notNull(),
  matchType: varchar("match_type", { length: 50 }),
  adGroupName: varchar("ad_group_name", { length: 255 }),
  clicks: int("clicks"),
  impressions: int("impressions"),
  totalCost: double("total_cost"),
  conversions: int("conversions"),
  costPerConversion: double("cost_per_conversion"),
  note: text("note"),
});

// ─── 4. search_terms ──────────────────────────────────────────────────────────
export const searchTerms = mysqlTable("search_terms", {
  id: int("id").autoincrement().primaryKey(),
  weeklySummaryId: int("weekly_summary_id").notNull(),
  snapshotDate: varchar("snapshot_date", { length: 20 }),
  searchTerm: varchar("search_term", { length: 255 }).notNull(),
  adGroupName: varchar("ad_group_name", { length: 255 }),
  clicks: int("clicks"),
  impressions: int("impressions"),
  totalCost: double("total_cost"),
  conversions: int("conversions"),
  classification: mysqlEnum("classification", ["bom", "ruim", "neutro"]).default("neutro"),
  notes: text("notes"),
});

// ─── 5. device_performance ────────────────────────────────────────────────────
export const devicePerformance = mysqlTable("device_performance", {
  id: int("id").autoincrement().primaryKey(),
  weeklySummaryId: int("weekly_summary_id").notNull(),
  device: varchar("device", { length: 100 }).notNull(),
  clicksPercent: double("clicks_percent"),
  impressionsPercent: double("impressions_percent"),
  conversionsPercent: double("conversions_percent"),
  bidAdjustment: double("bid_adjustment"),
});

// ─── 6. demographic_performance ───────────────────────────────────────────────
export const demographicPerformance = mysqlTable("demographic_performance", {
  id: int("id").autoincrement().primaryKey(),
  weeklySummaryId: int("weekly_summary_id").notNull(),
  segmentType: mysqlEnum("segment_type", ["age", "gender", "gender_age", "income"]).notNull(),
  segmentName: varchar("segment_name", { length: 100 }).notNull(),
  conversions: int("conversions"),
  percentage: double("percentage"),
  notes: text("notes"),
});

// ─── 7. hour_performance ──────────────────────────────────────────────────────
export const hourPerformance = mysqlTable("hour_performance", {
  id: int("id").autoincrement().primaryKey(),
  weeklySummaryId: int("weekly_summary_id").notNull(),
  hour: varchar("hour", { length: 10 }).notNull(),
  conversions: int("conversions"),
});

// ─── 8. day_performance ───────────────────────────────────────────────────────
export const dayPerformance = mysqlTable("day_performance", {
  id: int("id").autoincrement().primaryKey(),
  weeklySummaryId: int("weekly_summary_id").notNull(),
  dayName: varchar("day_name", { length: 20 }).notNull(),
  conversions: int("conversions"),
});

// ─── 9. location_performance ──────────────────────────────────────────────────
export const locationPerformance = mysqlTable("location_performance", {
  id: int("id").autoincrement().primaryKey(),
  weeklySummaryId: int("weekly_summary_id").notNull(),
  locationName: varchar("location_name", { length: 255 }).notNull(),
  clicks: int("clicks"),
  conversions: int("conversions"),
  costPerConversion: double("cost_per_conversion"),
  status: mysqlEnum("status", ["bom sinal", "atencao", "sem conversao"]).default("atencao"),
  notes: text("notes"),
});

// ─── 10. insights ─────────────────────────────────────────────────────────────
export const insights = mysqlTable("insights", {
  id: int("id").autoincrement().primaryKey(),
  weeklySummaryId: int("weekly_summary_id").notNull(),
  type: mysqlEnum("type", ["positive", "attention", "executive", "leilao"]).notNull(),
  title: varchar("title", { length: 255 }),
  description: text("description").notNull(),
  severity: mysqlEnum("severity", ["low", "medium", "high"]).default("medium"),
});
