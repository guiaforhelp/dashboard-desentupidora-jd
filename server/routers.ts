import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import {
  listCampanhas, getCampanhaById, getFullCampanha, insertFullCampanha,
} from "./db";
import { getDb } from "./db";
import { weeklyCampaignSummary } from "../drizzle/schema";
import { eq } from "drizzle-orm";

// ─── JSON payload schema (novo formato v2) ────────────────────────────────────
const JsonPayloadSchema = z.object({
  campaign_name: z.string(),
  period: z.object({ start_date: z.string(), end_date: z.string() }),
  summary: z.object({
    clicks: z.number(),
    impressions: z.number(),
    ctr: z.number(),
    avg_cpc: z.number(),
    total_cost: z.number(),
    conversions: z.number(),
    conversion_rate: z.number(),
    cost_per_conversion: z.number(),
    target_cpa_min: z.number().optional(),
    target_cpa_max: z.number().optional(),
  }),
  ad_groups: z.array(z.object({
    name: z.string(),
    clicks: z.number(),
    impressions: z.number(),
    ctr: z.number(),
    avg_cpc: z.number(),
    total_cost: z.number(),
    conversions: z.number(),
    conversion_rate: z.number(),
    cost_per_conversion: z.number(),
  })).optional().default([]),
  keywords: z.array(z.object({
    keyword: z.string(),
    match_type: z.string().optional(),
    ad_group: z.string().optional(),
    clicks: z.number().optional(),
    impressions: z.number().optional(),
    total_cost: z.number().optional(),
    conversions: z.number().optional(),
    cost_per_conversion: z.number().optional(),
    note: z.string().optional(),
  })).optional().default([]),
  search_terms_snapshot: z.object({
    date: z.string().optional(),
    summary: z.object({
      clicks: z.number().optional(),
      impressions: z.number().optional(),
      total_cost: z.number().optional(),
      conversions: z.number().optional(),
      cost_per_conversion: z.number().optional(),
    }).optional(),
    good_terms: z.array(z.string()).optional().default([]),
    bad_terms: z.array(z.object({
      term: z.string(),
      clicks: z.number().optional(),
      cost: z.number().optional(),
      conversions: z.number().optional(),
      reason: z.string().optional(),
    })).optional().default([]),
  }).optional(),
  devices: z.array(z.object({
    device: z.string(),
    conversions_percent: z.number(),
    impressions_percent: z.number(),
    clicks_percent: z.number(),
    bid_adjustment: z.number().optional(),
  })).optional().default([]),
  demographics: z.object({
    age: z.array(z.object({ range: z.string(), conversions: z.number() })).optional().default([]),
    gender: z.array(z.object({ gender: z.string(), conversions: z.number(), percentage_known: z.number().optional() })).optional().default([]),
    gender_age: z.array(z.object({ segment: z.string(), conversions: z.number() })).optional().default([]),
    income_notes: z.array(z.string()).optional().default([]),
  }).optional(),
  time: z.object({
    hours: z.array(z.object({ hour: z.string(), conversions: z.number() })).optional().default([]),
    day_of_week: z.array(z.object({ day: z.string(), conversions: z.number() })).optional().default([]),
    notes: z.array(z.string()).optional().default([]),
  }).optional(),
  locations: z.array(z.object({
    location: z.string(),
    clicks: z.number(),
    conversions: z.number(),
    cost_per_conversion: z.number().optional(),
    status: z.string().optional(),
  })).optional().default([]),
  insights: z.object({
    positive: z.array(z.string()).optional().default([]),
    attention: z.array(z.string()).optional().default([]),
    executive_reading: z.string().optional(),
  }).optional(),
  leilao: z.object({
    impression_share: z.number(),
    top_of_page_rate: z.number(),
    first_position_rate: z.number(),
    reading: z.string().optional(),
    competitors: z.array(z.object({
      domain: z.string(),
      impression_share: z.string(),
      overlap: z.number(),
      top_of_page: z.number(),
      first_position: z.number(),
      win_rate: z.number(),
    })).optional().default([]),
  }).optional(),
});

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  campanhas: router({
    // Listar todas as campanhas
    list: protectedProcedure.query(async () => {
      return listCampanhas();
    }),

    // Buscar campanha completa por ID
    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const data = await getFullCampanha(input.id);
        if (!data) throw new Error("Campanha não encontrada");
        // Buscar dados de leilão armazenados nos insights com type='leilao'
        const leilaoInsight = data.insights.find((i: any) => i.type === "leilao");
        let leilao = null;
        if (leilaoInsight?.description) {
          try { leilao = JSON.parse(leilaoInsight.description); } catch {}
        }
        return { ...data, leilao };
      }),

    // Upload de JSON e persistência no banco
    upload: protectedProcedure
      .input(JsonPayloadSchema)
      .mutation(async ({ input }) => {
        const dem = input.demographics;
        const demographics: { segmentType: "age" | "gender" | "gender_age" | "income"; segmentName: string; conversions?: number; percentage?: number; notes?: string }[] = [];

        (dem?.age ?? []).forEach(a => demographics.push({ segmentType: "age", segmentName: a.range, conversions: a.conversions }));
        (dem?.gender ?? []).forEach(g => demographics.push({ segmentType: "gender", segmentName: g.gender, conversions: g.conversions, percentage: g.percentage_known }));
        (dem?.gender_age ?? []).forEach(ga => demographics.push({ segmentType: "gender_age", segmentName: ga.segment, conversions: ga.conversions }));
        (dem?.income_notes ?? []).forEach((note, i) => demographics.push({ segmentType: "income", segmentName: `Nota ${i + 1}`, notes: note }));

        const normalizeStatus = (s?: string): "bom sinal" | "atencao" | "sem conversao" => {
          if (!s) return "atencao";
          if (s.includes("bom")) return "bom sinal";
          if (s.includes("sem")) return "sem conversao";
          return "atencao";
        };

        const campanhaId = await insertFullCampanha({
          summary: {
            campaignName: input.campaign_name,
            startDate: input.period.start_date,
            endDate: input.period.end_date,
            clicks: input.summary.clicks,
            impressions: input.summary.impressions,
            ctr: input.summary.ctr,
            avgCpc: input.summary.avg_cpc,
            totalCost: input.summary.total_cost,
            conversions: input.summary.conversions,
            conversionRate: input.summary.conversion_rate,
            costPerConversion: input.summary.cost_per_conversion,
            targetCpaMin: input.summary.target_cpa_min,
            targetCpaMax: input.summary.target_cpa_max,
          },
          adGroups: input.ad_groups.map(g => ({
            adGroupName: g.name,
            clicks: g.clicks,
            impressions: g.impressions,
            ctr: g.ctr,
            avgCpc: g.avg_cpc,
            totalCost: g.total_cost,
            conversions: g.conversions,
            conversionRate: g.conversion_rate,
            costPerConversion: g.cost_per_conversion,
          })),
          keywords: input.keywords.map(k => ({
            keyword: k.keyword,
            matchType: k.match_type,
            adGroupName: k.ad_group,
            clicks: k.clicks,
            impressions: k.impressions,
            totalCost: k.total_cost,
            conversions: k.conversions,
            costPerConversion: k.cost_per_conversion,
            note: k.note,
          })),
          searchTermsGood: input.search_terms_snapshot?.good_terms ?? [],
          searchTermsBad: (input.search_terms_snapshot?.bad_terms ?? []).map(t => ({
            term: t.term,
            clicks: t.clicks,
            cost: t.cost,
            conversions: t.conversions,
            reason: t.reason,
          })),
          searchTermsSnapshotDate: input.search_terms_snapshot?.date,
          devices: input.devices.map(d => ({
            device: d.device,
            clicksPercent: d.clicks_percent,
            impressionsPercent: d.impressions_percent,
            conversionsPercent: d.conversions_percent,
            bidAdjustment: d.bid_adjustment,
          })),
          demographics,
          hours: (input.time?.hours ?? []).map(h => ({ hour: h.hour, conversions: h.conversions })),
          days: (input.time?.day_of_week ?? []).map(d => ({ dayName: d.day, conversions: d.conversions })),
          locations: input.locations.map(l => ({
            locationName: l.location,
            clicks: l.clicks,
            conversions: l.conversions,
            costPerConversion: l.cost_per_conversion,
            status: normalizeStatus(l.status),
          })),
          insightPositive: input.insights?.positive ?? [],
          insightAttention: input.insights?.attention ?? [],
          executiveReading: input.insights?.executive_reading ?? "",
          // Dados de leilão armazenados como insight especial (type='leilao')
          leilaoData: input.leilao ? JSON.stringify({
            impressionShare: input.leilao.impression_share,
            topOfPageRate: input.leilao.top_of_page_rate,
            firstPositionRate: input.leilao.first_position_rate,
            reading: input.leilao.reading ?? "",
            competitors: (input.leilao.competitors ?? []).map(c => ({
              domain: c.domain,
              impressionShare: c.impression_share,
              overlap: c.overlap,
              topOfPage: c.top_of_page,
              firstPosition: c.first_position,
              winRate: c.win_rate,
            })),
          }) : null,
        });

        return { campanhaId };
      }),

    // Deletar campanha
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        await db.delete(weeklyCampaignSummary).where(eq(weeklyCampaignSummary.id, input.id));
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
