import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  users, InsertUser,
  weeklyCampaignSummary, adGroupPerformance, keywordPerformance,
  searchTerms, devicePerformance, demographicPerformance,
  hourPerformance, dayPerformance, locationPerformance, insights,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ─── Users ────────────────────────────────────────────────────────────────────
export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) { console.warn("[Database] Cannot upsert user: database not available"); return; }

  try {
    const values: InsertUser = { openId: user.openId };
    const updateSet: Record<string, unknown> = {};
    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];
    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };
    textFields.forEach(assignNullable);
    if (user.lastSignedIn !== undefined) { values.lastSignedIn = user.lastSignedIn; updateSet.lastSignedIn = user.lastSignedIn; }
    if (user.role !== undefined) { values.role = user.role; updateSet.role = user.role; }
    else if (user.openId === ENV.ownerOpenId) { values.role = "admin"; updateSet.role = "admin"; }
    if (!values.lastSignedIn) values.lastSignedIn = new Date();
    if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
    await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ─── Campanhas ────────────────────────────────────────────────────────────────
export async function listCampanhas() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(weeklyCampaignSummary).orderBy(weeklyCampaignSummary.createdAt);
}

export async function getCampanhaById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(weeklyCampaignSummary).where(eq(weeklyCampaignSummary.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function getFullCampanha(id: number) {
  const db = await getDb();
  if (!db) return null;
  const [campanha, adGroups, keywords, terms, devices, demographics, hours, days, locations, insightRows] = await Promise.all([
    db.select().from(weeklyCampaignSummary).where(eq(weeklyCampaignSummary.id, id)).limit(1),
    db.select().from(adGroupPerformance).where(eq(adGroupPerformance.weeklySummaryId, id)),
    db.select().from(keywordPerformance).where(eq(keywordPerformance.weeklySummaryId, id)),
    db.select().from(searchTerms).where(eq(searchTerms.weeklySummaryId, id)),
    db.select().from(devicePerformance).where(eq(devicePerformance.weeklySummaryId, id)),
    db.select().from(demographicPerformance).where(eq(demographicPerformance.weeklySummaryId, id)),
    db.select().from(hourPerformance).where(eq(hourPerformance.weeklySummaryId, id)),
    db.select().from(dayPerformance).where(eq(dayPerformance.weeklySummaryId, id)),
    db.select().from(locationPerformance).where(eq(locationPerformance.weeklySummaryId, id)),
    db.select().from(insights).where(eq(insights.weeklySummaryId, id)),
  ]);
  if (!campanha[0]) return null;
  return { campanha: campanha[0], adGroups, keywords, terms, devices, demographics, hours, days, locations, insights: insightRows };
}

export async function insertFullCampanha(data: {
  summary: typeof weeklyCampaignSummary.$inferInsert;
  adGroups: Omit<typeof adGroupPerformance.$inferInsert, "weeklySummaryId">[];
  keywords: Omit<typeof keywordPerformance.$inferInsert, "weeklySummaryId">[];
  searchTermsGood: string[];
  searchTermsBad: { term: string; clicks?: number; cost?: number; conversions?: number; reason?: string }[];
  searchTermsSnapshotDate?: string;
  searchTermsSummary?: { clicks?: number; impressions?: number; totalCost?: number; conversions?: number; costPerConversion?: number };
  devices: Omit<typeof devicePerformance.$inferInsert, "weeklySummaryId">[];
  demographics: Omit<typeof demographicPerformance.$inferInsert, "weeklySummaryId">[];
  hours: Omit<typeof hourPerformance.$inferInsert, "weeklySummaryId">[];
  days: Omit<typeof dayPerformance.$inferInsert, "weeklySummaryId">[];
  locations: Omit<typeof locationPerformance.$inferInsert, "weeklySummaryId">[];
  insightPositive: string[];
  insightAttention: string[];
  executiveReading: string;
  leilaoData?: string | null;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [summaryResult] = await db.insert(weeklyCampaignSummary).values(data.summary);
  const sid = (summaryResult as any).insertId as number;

  const inserts: Promise<unknown>[] = [];

  if (data.adGroups.length > 0)
    inserts.push(db.insert(adGroupPerformance).values(data.adGroups.map(g => ({ ...g, weeklySummaryId: sid }))));

  if (data.keywords.length > 0)
    inserts.push(db.insert(keywordPerformance).values(data.keywords.map(k => ({ ...k, weeklySummaryId: sid }))));

  const allTerms: typeof searchTerms.$inferInsert[] = [
    ...data.searchTermsGood.map(t => ({
      weeklySummaryId: sid,
      searchTerm: t,
      snapshotDate: data.searchTermsSnapshotDate,
      classification: "bom" as const,
    })),
    ...data.searchTermsBad.map(t => ({
      weeklySummaryId: sid,
      searchTerm: t.term,
      snapshotDate: data.searchTermsSnapshotDate,
      clicks: t.clicks,
      totalCost: t.cost,
      conversions: t.conversions,
      classification: "ruim" as const,
      notes: t.reason,
    })),
  ];
  if (allTerms.length > 0) inserts.push(db.insert(searchTerms).values(allTerms));

  if (data.devices.length > 0)
    inserts.push(db.insert(devicePerformance).values(data.devices.map(d => ({ ...d, weeklySummaryId: sid }))));

  if (data.demographics.length > 0)
    inserts.push(db.insert(demographicPerformance).values(data.demographics.map(d => ({ ...d, weeklySummaryId: sid }))));

  if (data.hours.length > 0)
    inserts.push(db.insert(hourPerformance).values(data.hours.map(h => ({ ...h, weeklySummaryId: sid }))));

  if (data.days.length > 0)
    inserts.push(db.insert(dayPerformance).values(data.days.map(d => ({ ...d, weeklySummaryId: sid }))));

  if (data.locations.length > 0)
    inserts.push(db.insert(locationPerformance).values(data.locations.map(l => ({ ...l, weeklySummaryId: sid }))));

  const allInsights: typeof insights.$inferInsert[] = [
    ...data.insightPositive.map(d => ({ weeklySummaryId: sid, type: "positive" as const, description: d, severity: "low" as const })),
    ...data.insightAttention.map(d => ({ weeklySummaryId: sid, type: "attention" as const, description: d, severity: "medium" as const })),
    { weeklySummaryId: sid, type: "executive" as const, description: data.executiveReading, severity: "low" as const },
    ...(data.leilaoData ? [{ weeklySummaryId: sid, type: "leilao" as const, description: data.leilaoData, severity: "low" as const }] : []),
  ];
  if (allInsights.length > 0) inserts.push(db.insert(insights).values(allInsights));

  await Promise.all(inserts);
  return sid;
}
