import { describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock db module — v2 schema
vi.mock("./db", () => ({
  getDb: vi.fn().mockResolvedValue({
    delete: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue(undefined) }),
  }),
  upsertUser: vi.fn().mockResolvedValue(undefined),
  getUserByOpenId: vi.fn().mockResolvedValue(undefined),
  listCampanhas: vi.fn().mockResolvedValue([
    {
      id: 1,
      campaignName: "Caça Vazamento — Desentupidora JD",
      startDate: "2026-05-20",
      endDate: "2026-05-26",
      clicks: 102,
      impressions: 1264,
      ctr: 8.07,
      avgCpc: 22.49,
      totalCost: 2293.99,
      conversions: 39,
      conversionRate: 38.24,
      costPerConversion: 58.82,
      targetCpaMin: 60.0,
      targetCpaMax: 61.0,
      createdAt: new Date("2026-05-27"),
    },
  ]),
  getFullCampanha: vi.fn().mockResolvedValue({
    campanha: {
      id: 1,
      campaignName: "Caça Vazamento — Desentupidora JD",
      startDate: "2026-05-20",
      endDate: "2026-05-26",
      clicks: 102,
      impressions: 1264,
      ctr: 8.07,
      avgCpc: 22.49,
      totalCost: 2293.99,
      conversions: 39,
      conversionRate: 38.24,
      costPerConversion: 58.82,
      targetCpaMin: 60.0,
      targetCpaMax: 61.0,
      createdAt: new Date("2026-05-27"),
    },
    adGroups: [],
    keywords: [],
    terms: [],
    devices: [],
    demographics: [],
    hours: [],
    days: [],
    locations: [],
    insights: [],
  }),
  insertFullCampanha: vi.fn().mockResolvedValue(42),
}));

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };
  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

const samplePayload = {
  campaign_name: "Caça Vazamento — Desentupidora JD",
  period: { start_date: "2026-05-20", end_date: "2026-05-26" },
  summary: {
    clicks: 102,
    impressions: 1264,
    ctr: 8.07,
    avg_cpc: 22.49,
    total_cost: 2293.99,
    conversions: 39,
    conversion_rate: 38.24,
    cost_per_conversion: 58.82,
    target_cpa_min: 60.0,
    target_cpa_max: 61.0,
  },
};

describe("campanhas.upload", () => {
  it("insere campanha e retorna campanhaId", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.campanhas.upload(samplePayload);
    expect(result.campanhaId).toBe(42);
  });
});

describe("campanhas.list", () => {
  it("retorna lista de campanhas", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.campanhas.list();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(1);
    expect(result[0].campaignName).toBe("Caça Vazamento — Desentupidora JD");
    expect(result[0].conversions).toBe(39);
  });
});

describe("campanhas.get", () => {
  it("retorna dados completos da campanha v2", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.campanhas.get({ id: 1 });
    expect(result.campanha.id).toBe(1);
    expect(result.campanha.campaignName).toBe("Caça Vazamento — Desentupidora JD");
    expect(result.adGroups).toEqual([]);
    expect(result.locations).toEqual([]);
    expect(result.insights).toEqual([]);
  });

  it("lança erro quando campanha não encontrada", async () => {
    const { getFullCampanha } = await import("./db");
    vi.mocked(getFullCampanha).mockResolvedValueOnce(null);
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.campanhas.get({ id: 999 })).rejects.toThrow("Campanha não encontrada");
  });
});

describe("campanhas.delete", () => {
  it("deleta campanha e retorna sucesso", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.campanhas.delete({ id: 1 });
    expect(result.success).toBe(true);
  });
});
