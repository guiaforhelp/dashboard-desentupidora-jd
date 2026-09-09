import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Info, TrendingUp, AlertTriangle, CheckCircle, MapPin,
  Users, Smartphone, Target, DollarSign, MousePointerClick, Eye, Percent, ArrowLeft, Gavel
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line,
} from "recharts";

const ORANGE = "#ff6737";
const BLUE   = "#203c50";
const COLORS  = [ORANGE, BLUE, "#22c55e", "#f59e0b", "#8b5cf6", "#06b6d4", "#ec4899"];

const fmt = (n?: number | null, dec = 2) =>
  n == null ? "—" : n.toLocaleString("pt-BR", { minimumFractionDigits: dec, maximumFractionDigits: dec });
const fmtBRL = (n?: number | null) => n == null ? "—" : `R$ ${fmt(n)}`;
const fmtPct = (n?: number | null) => n == null ? "—" : `${fmt(n)}%`;

function KpiCard({ icon: Icon, label, value, sub, tooltip, accent = false }: {
  icon: React.ElementType; label: string; value: string; sub?: string; tooltip?: string; accent?: boolean;
}) {
  return (
    <div className={`rounded-xl p-5 shadow-sm flex flex-col gap-2 ${accent ? "gradient-primary text-white" : "bg-white"}`}>
      <div className="flex items-center justify-between">
        <span className={`text-xs font-semibold uppercase tracking-wide ${accent ? "text-white/80" : "text-muted-foreground"}`}>{label}</span>
        <div className="flex items-center gap-1">
          <Icon className={`w-4 h-4 ${accent ? "text-white/70" : "text-primary"}`} />
          {tooltip && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className={`w-3.5 h-3.5 cursor-help ${accent ? "text-white/60" : "text-muted-foreground"}`} />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs text-sm">{tooltip}</TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>
      <div className={`text-2xl font-bold ${accent ? "text-white" : "text-foreground"}`}>{value}</div>
      {sub && <div className={`text-xs ${accent ? "text-white/70" : "text-muted-foreground"}`}>{sub}</div>}
    </div>
  );
}

function SectionHeader({ title, subtitle, icon: Icon }: { title: string; subtitle?: string; icon?: React.ElementType }) {
  return (
    <div className="flex items-start gap-3 mb-5">
      {Icon && (
        <div className="w-9 h-9 rounded-lg gradient-primary flex items-center justify-center flex-shrink-0">
          <Icon className="w-5 h-5 text-white" />
        </div>
      )}
      <div>
        <h2 className="text-lg font-bold text-foreground">{title}</h2>
        {subtitle && <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
}

function MetricLabel({ label, tooltip }: { label: string; tooltip: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex items-center gap-1 cursor-help border-b border-dashed border-muted-foreground/40">
          {label} <Info className="w-3 h-3 text-muted-foreground/60" />
        </span>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs text-sm">{tooltip}</TooltipContent>
    </Tooltip>
  );
}

export default function Dashboard() {
  const params = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const id = parseInt(params.id ?? "0", 10);

  const { data, isLoading, error } = trpc.campanhas.get.useQuery({ id }, { enabled: !!id });

  if (isLoading) return (
    <div className="p-6 space-y-4">
      {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-32 w-full rounded-xl" />)}
    </div>
  );

  if (error || !data) return (
    <div className="p-6 flex flex-col items-center gap-4">
      <AlertTriangle className="w-12 h-12 text-destructive" />
      <p className="text-muted-foreground">Campanha não encontrada.</p>
      <button onClick={() => navigate("/campanhas")} className="text-primary underline text-sm">Voltar</button>
    </div>
  );

  const { campanha: c, adGroups, keywords, terms, devices, demographics, hours, days, locations, insights: insightRows } = data;

  const ageData = demographics.filter(d => d.segmentType === "age").map(d => ({ name: d.segmentName, conversoes: d.conversions ?? 0 }));
  const genderRaw = demographics.filter(d => d.segmentType === "gender");
  const genderTotal = genderRaw.reduce((sum, d) => sum + (d.conversions ?? 0), 0);
  const genderHasConversions = genderTotal > 0;
  // Se não há conversões por sexo, usa percentage (impressões) como fallback
  const genderData = genderRaw
    .filter(d => d.segmentName !== "Desconhecido" || (genderHasConversions ? (d.conversions ?? 0) > 0 : (d.percentage ?? 0) > 0))
    .map(d => ({
      name: d.segmentName,
      value: genderHasConversions ? (d.conversions ?? 0) : (d.percentage ?? 0),
      pct: genderHasConversions
        ? Math.round(((d.conversions ?? 0) / genderTotal) * 100)
        : Math.round(d.percentage ?? 0),
      isImpressions: !genderHasConversions,
    }));
  const genderAgeData = demographics.filter(d => d.segmentType === "gender_age").map(d => ({ name: d.segmentName, conversoes: d.conversions ?? 0 }));
  const incomeNotes = demographics.filter(d => d.segmentType === "income").map(d => d.notes ?? "");

  const hoursData = hours.map(h => ({ hora: h.hour, conversoes: h.conversions ?? 0 }));
  const daysData = days.map(d => ({ dia: d.dayName.replace("-feira","").replace("Sábado","Sáb").replace("Domingo","Dom"), conversoes: d.conversions ?? 0 }));

  const goodTerms = terms.filter(t => t.classification === "bom");
  const badTerms  = terms.filter(t => t.classification === "ruim");
  const snapshotDate = terms.length > 0 ? (data as any).snapshotDate : null;

  const goodLocations = locations.filter(l => l.status === "bom sinal");
  const badLocations  = locations.filter(l => l.status !== "bom sinal");

  const positiveInsights  = insightRows.filter(i => i.type === "positive");
  const attentionInsights = insightRows.filter(i => i.type === "attention");
  const executive         = insightRows.find(i => i.type === "executive");

  const cpaAboveMeta = c.targetCpaMax != null && (c.costPerConversion ?? 0) > c.targetCpaMax;

  // Dados de leilão — vêm do campo extra retornado pelo router
  const leilao = (data as any).leilao as {
    impressionShare: number;
    topOfPageRate: number;
    firstPositionRate: number;
    reading: string;
    competitors: Array<{
      domain: string;
      impressionShare: string;
      overlap: number;
      topOfPage: number;
      firstPosition: number;
      winRate: number;
    }>;
  } | null;

  return (
    <div className="p-4 md:p-6 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate("/campanhas")} className="p-2 rounded-lg hover:bg-muted transition-colors">
          <ArrowLeft className="w-5 h-5 text-muted-foreground" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">{c.campaignName}</h1>
          <p className="text-sm text-muted-foreground">{c.startDate} a {c.endDate}</p>
        </div>
      </div>

      {/* BLOCO 1 — RESUMO GERAL */}
      <section>
        <SectionHeader title="Resumo Geral" subtitle="Métricas principais do período" icon={Target} />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3">
          <KpiCard icon={MousePointerClick} label="Cliques" value={fmt(c.clicks, 0)} tooltip="Total de cliques nos anúncios no período." />
          <KpiCard icon={Eye} label="Impressões" value={fmt(c.impressions, 0)} tooltip="Quantas vezes o anúncio foi exibido." />
          <KpiCard icon={Percent} label="CTR" value={fmtPct(c.ctr)} tooltip="Taxa de cliques: cliques ÷ impressões. Quanto maior, mais atrativo o anúncio." />
          <KpiCard icon={DollarSign} label="CPC Médio" value={fmtBRL(c.avgCpc)} tooltip="Custo médio por clique recebido." />
          <KpiCard icon={DollarSign} label="Custo Total" value={fmtBRL(c.totalCost)} tooltip="Valor total investido no período." />
          <KpiCard icon={TrendingUp} label="Conversões" value={fmt(c.conversions, 0)} tooltip="Cliques no botão de WhatsApp. Atenção: clique no WhatsApp não confirma conversa enviada." />
          <KpiCard icon={Target} label="Custo/Conv." value={fmtBRL(c.costPerConversion)} tooltip="Custo por conversão (CPA). Meta: R$ 60–61." accent={!cpaAboveMeta} />
        </div>
        {c.targetCpaMin != null && c.targetCpaMax != null && (
          <div className={`mt-3 flex items-start gap-2 rounded-lg px-4 py-3 text-sm ${cpaAboveMeta ? "bg-amber-50 border border-amber-200 text-amber-800" : "bg-green-50 border border-green-200 text-green-800"}`}>
            {cpaAboveMeta ? <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" /> : <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />}
            <span>{cpaAboveMeta ? `CPA de ${fmtBRL(c.costPerConversion)} está acima da meta de ${fmtBRL(c.targetCpaMin)}–${fmtBRL(c.targetCpaMax)}.` : `CPA de ${fmtBRL(c.costPerConversion)} está dentro da meta de ${fmtBRL(c.targetCpaMin)}–${fmtBRL(c.targetCpaMax)}.`}</span>
          </div>
        )}
        <div className="mt-2 flex items-start gap-2 rounded-lg px-4 py-3 text-sm bg-blue-50 border border-blue-200 text-blue-800">
          <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>As conversões registradas representam cliques no WhatsApp. Clique no WhatsApp não confirma conversa enviada — os dados devem ser lidos como desempenho de mídia, não como confirmação de vendas.</span>
        </div>
      </section>

      {/* BLOCO 2 — GRUPOS + PALAVRAS-CHAVE + TERMOS */}
      {(adGroups.length > 0 || keywords.length > 0 || terms.length > 0) && (
        <section>
          <SectionHeader title="Grupos, Palavras-chave e Termos" subtitle="Desempenho por grupo e análise de termos de pesquisa" icon={TrendingUp} />
          {adGroups.length > 0 && (
            <div className="bg-white rounded-xl p-5 shadow-sm mb-4">
              <h3 className="text-sm font-semibold text-foreground mb-4">Desempenho por Grupo de Anúncios</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={adGroups.map(g => ({ nome: (g.adGroupName ?? "").replace("Caça Vazamento","CaçaVaz"), cliques: g.clicks ?? 0, conversoes: g.conversions ?? 0 }))} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="nome" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <RTooltip />
                  <Legend />
                  <Bar dataKey="cliques" name="Cliques" fill={BLUE} radius={[4,4,0,0]} />
                  <Bar dataKey="conversoes" name="Conversões" fill={ORANGE} radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
          {adGroups.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-4">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/50 text-muted-foreground text-xs uppercase tracking-wide">
                      <th className="text-left px-4 py-3">Grupo</th>
                      <th className="text-right px-4 py-3">Cliques</th>
                      <th className="text-right px-4 py-3">Impressões</th>
                      <th className="text-right px-4 py-3">CTR</th>
                      <th className="text-right px-4 py-3">CPC Médio</th>
                      <th className="text-right px-4 py-3">Custo</th>
                      <th className="text-right px-4 py-3">Conv.</th>
                      <th className="text-right px-4 py-3">Taxa Conv.</th>
                      <th className="text-right px-4 py-3 text-primary font-bold">Custo/Conv.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {adGroups.map((g, i) => (
                      <tr key={i} className="border-t border-border hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3 font-medium">{g.adGroupName}</td>
                        <td className="px-4 py-3 text-right">{fmt(g.clicks, 0)}</td>
                        <td className="px-4 py-3 text-right">{fmt(g.impressions, 0)}</td>
                        <td className="px-4 py-3 text-right">{fmtPct(g.ctr)}</td>
                        <td className="px-4 py-3 text-right">{fmtBRL(g.avgCpc)}</td>
                        <td className="px-4 py-3 text-right">{fmtBRL(g.totalCost)}</td>
                        <td className="px-4 py-3 text-right">{fmt(g.conversions, 0)}</td>
                        <td className="px-4 py-3 text-right">{fmtPct(g.conversionRate)}</td>
                        <td className="px-4 py-3 text-right font-bold text-primary">{fmtBRL(g.costPerConversion)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          {keywords.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-4">
              <div className="px-4 py-3 border-b border-border"><h3 className="text-sm font-semibold">Palavras-chave</h3></div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/50 text-muted-foreground text-xs uppercase tracking-wide">
                      <th className="text-left px-4 py-3">Palavra-chave</th>
                      <th className="text-left px-4 py-3">Corresp.</th>
                      <th className="text-left px-4 py-3">Grupo</th>
                      <th className="text-right px-4 py-3">Cliques</th>
                      <th className="text-right px-4 py-3">Custo</th>
                      <th className="text-right px-4 py-3">Conv.</th>
                      <th className="text-right px-4 py-3">Custo/Conv.</th>
                      <th className="text-left px-4 py-3">Nota</th>
                    </tr>
                  </thead>
                  <tbody>
                    {keywords.map((k, i) => (
                      <tr key={i} className="border-t border-border hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3 font-medium">{k.keyword}</td>
                        <td className="px-4 py-3"><Badge variant="outline" className="text-xs">{k.matchType ?? "—"}</Badge></td>
                        <td className="px-4 py-3 text-muted-foreground text-xs">{k.adGroupName ?? "—"}</td>
                        <td className="px-4 py-3 text-right">{fmt(k.clicks, 0)}</td>
                        <td className="px-4 py-3 text-right">{fmtBRL(k.totalCost)}</td>
                        <td className="px-4 py-3 text-right">{fmt(k.conversions, 0)}</td>
                        <td className="px-4 py-3 text-right font-semibold text-primary">{fmtBRL(k.costPerConversion)}</td>
                        <td className="px-4 py-3 text-xs text-muted-foreground max-w-xs">{k.note ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          {(goodTerms.length > 0 || badTerms.length > 0) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {snapshotDate && (
                <div className="col-span-full mb-1 text-xs text-muted-foreground flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5" /> Snapshot de termos coletado em: <strong>{snapshotDate}</strong>
                </div>
              )}
              {goodTerms.length > 0 && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                  <h3 className="text-sm font-semibold text-green-800 mb-3 flex items-center gap-2"><CheckCircle className="w-4 h-4" /> Termos Relevantes</h3>
                  <div className="flex flex-wrap gap-2">
                    {goodTerms.map((t, i) => <Badge key={i} className="bg-green-100 text-green-800 border-green-300">{t.searchTerm}</Badge>)}
                  </div>
                </div>
              )}
              {badTerms.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                  <h3 className="text-sm font-semibold text-red-800 mb-3 flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> Termos Irrelevantes</h3>
                  <div className="space-y-2">
                    {badTerms.map((t, i) => (
                      <div key={i} className="flex flex-col gap-1 border border-red-200 rounded-lg bg-white px-3 py-2">
                        <span className="text-sm font-semibold text-red-800">{t.searchTerm}</span>
                        {t.notes && <span className="text-xs text-red-600 leading-snug">{t.notes}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </section>
      )}

      {/* BLOCO 3 — DISPOSITIVOS */}
      {devices.length > 0 && (
        <section>
          <SectionHeader title="Dispositivos" subtitle="Distribuição de cliques, impressões e conversões por dispositivo" icon={Smartphone} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl p-5 shadow-sm">
              <h3 className="text-sm font-semibold mb-4">Conversões por Dispositivo (%)</h3>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={devices.map(d => ({ name: d.device, value: d.conversionsPercent ?? 0 }))} cx="50%" cy="50%" innerRadius={55} outerRadius={90} dataKey="value" nameKey="name" label={({ name, value }) => `${name}: ${value}%`} labelLine={false}>
                    {devices.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <RTooltip formatter={(v: number) => [`${v}%`, "Conversões"]} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/50 text-muted-foreground text-xs uppercase tracking-wide">
                    <th className="text-left px-4 py-3">Dispositivo</th>
                    <th className="text-right px-4 py-3">Cliques %</th>
                    <th className="text-right px-4 py-3">Impressões %</th>
                    <th className="text-right px-4 py-3">Conversões %</th>
                  </tr>
                </thead>
                <tbody>
                  {devices.map((d, i) => (
                    <tr key={i} className="border-t border-border hover:bg-muted/30">
                      <td className="px-4 py-3 font-medium flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                        {d.device}
                        {d.bidAdjustment === -100 && <Badge variant="outline" className="text-xs text-red-600 border-red-200 ml-1">Excluído</Badge>}
                      </td>
                      <td className="px-4 py-3 text-right">{fmtPct(d.clicksPercent)}</td>
                      <td className="px-4 py-3 text-right">{fmtPct(d.impressionsPercent)}</td>
                      <td className="px-4 py-3 text-right font-semibold">{fmtPct(d.conversionsPercent)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          {/* Gráfico de barras agrupadas: cliques % vs impressões % vs conversões % */}
          <div className="bg-white rounded-xl p-5 shadow-sm mt-4">
            <h3 className="text-sm font-semibold mb-4">Comparativo por Dispositivo (Cliques % · Impressões % · Conversões %)</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={devices.map(d => ({ nome: d.device, cliques: d.clicksPercent ?? 0, impressoes: d.impressionsPercent ?? 0, conversoes: d.conversionsPercent ?? 0 }))} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="nome" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 10 }} unit="%" />
                <RTooltip formatter={(v: number) => `${v}%`} />
                <Legend />
                <Bar dataKey="cliques" name="Cliques %" fill={BLUE} radius={[4,4,0,0]} />
                <Bar dataKey="impressoes" name="Impressões %" fill="#64748b" radius={[4,4,0,0]} />
                <Bar dataKey="conversoes" name="Conversões %" fill={ORANGE} radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}

      {/* BLOCO 4 — DEMOGRÁFICOS + HORÁRIOS + DIAS */}
      {(ageData.length > 0 || genderData.length > 0 || hoursData.length > 0 || daysData.length > 0) && (
        <section>
          <SectionHeader title="Público, Horários e Dias" subtitle="Conversões por faixa etária, sexo, horário e dia da semana" icon={Users} />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
            {ageData.length > 0 && (
              <div className="bg-white rounded-xl p-5 shadow-sm">
                <h3 className="text-sm font-semibold mb-4">
                  <MetricLabel label="Conversões por Faixa Etária" tooltip="Público +65 precisa ser cruzado com conversa real no atendimento antes de confirmar como lead." />
                </h3>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={ageData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <RTooltip />
                    <Bar dataKey="conversoes" name="Conversões" fill={ORANGE} radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
            {genderData.length > 0 && (
              <div className="bg-white rounded-xl p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-sm font-semibold">{genderHasConversions ? "Conversões por Sexo" : "Impressões por Sexo"}</h3>
                </div>
                {!genderHasConversions && (
                  <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded px-2 py-1 mb-3">
                    ⚠️ Sem dados de conversão por sexo neste período. Exibindo distribuição de impressões.
                  </p>
                )}
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={genderData}
                      cx="50%" cy="50%"
                      outerRadius={80}
                      dataKey="pct"
                      nameKey="name"
                      label={({ name, pct }) => `${name}: ${pct}%`}
                      labelLine
                    >
                      {genderData.map((_, i) => <Cell key={i} fill={i === 0 ? BLUE : ORANGE} />)}
                    </Pie>
                    <RTooltip formatter={(v: number, _: string, entry: any) => [
                      genderHasConversions
                        ? `${v}% (${entry.payload.value} conv.)`
                        : `${v}% das impressões`,
                      entry.payload.name
                    ]} />
                    <Legend formatter={(value, entry: any) => `${value}: ${entry.payload.pct}%`} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
          {genderAgeData.length > 0 && (
            <div className="bg-white rounded-xl p-5 shadow-sm mb-4">
              <h3 className="text-sm font-semibold mb-4">Conversões por Sexo + Faixa Etária (Top segmentos)</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={genderAgeData.slice(0, 10)} layout="vertical" margin={{ top: 5, right: 20, left: 100, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis type="number" tick={{ fontSize: 10 }} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={95} />
                  <RTooltip />
                  <Bar dataKey="conversoes" name="Conversões" fill={BLUE} radius={[0,4,4,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
          {incomeNotes.length > 0 && (
            <div className="bg-white rounded-xl p-5 shadow-sm mb-4">
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2"><DollarSign className="w-4 h-4 text-primary" /> Renda Familiar</h3>
              <ul className="space-y-2">
                {incomeNotes.map((note, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />{note}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {hoursData.length > 0 && (
              <div className="bg-white rounded-xl p-5 shadow-sm">
                <h3 className="text-sm font-semibold mb-1">
                  <MetricLabel label="Conversões por Hora" tooltip="Conversões após 18h concentraram ~30,8% do total. Parte pode ser clique no WhatsApp sem conversa real." />
                </h3>
                <p className="text-xs text-muted-foreground mb-4">11h–13h: pico principal. Pós-18h: atenção redobrada.</p>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={hoursData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="hora" tick={{ fontSize: 9 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <RTooltip />
                    <Line type="monotone" dataKey="conversoes" name="Conversões" stroke={ORANGE} strokeWidth={2} dot={{ fill: ORANGE, r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
                <div className="mt-3 flex items-start gap-2 text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-2 border border-amber-200">
                  <AlertTriangle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                  Conversões após 18h precisam de atenção — podem representar cliques no WhatsApp sem conversa real.
                </div>
              </div>
            )}
            {daysData.length > 0 && (
              <div className="bg-white rounded-xl p-5 shadow-sm">
                <h3 className="text-sm font-semibold mb-1">Conversões por Dia da Semana</h3>
                {daysData.every(d => d.conversoes === 0) ? (
                  <p className="text-xs text-amber-600 mb-4 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Dados parciais — recorte não confirmado para este período.</p>
                ) : daysData.some(d => d.conversoes === 0 && daysData.reduce((s,x) => s+x.conversoes,0) < 10) ? (
                  <p className="text-xs text-amber-600 mb-4 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Dados parciais — apenas o recorte legível está exibido.</p>
                ) : (
                  <p className="text-xs text-muted-foreground mb-4">Distribuição de conversões ao longo da semana.</p>
                )}
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={daysData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="dia" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <RTooltip />
                    <Bar dataKey="conversoes" name="Conversões" fill={BLUE} radius={[4,4,0,0]}>
                      {daysData.map((d, i) => <Cell key={i} fill={d.conversoes === 0 ? "#e5e7eb" : BLUE} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </section>
      )}

      {/* BLOCO 5 — LOCAIS */}
      {locations.length > 0 && (
        <section>
          <SectionHeader title="Locais" subtitle="Ranking por conversões e custo por conversão" icon={MapPin} />
          <div className="mb-4 flex items-start gap-2 rounded-lg px-4 py-3 text-sm bg-blue-50 border border-blue-200 text-blue-800">
            <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
            Local bom no Google Ads precisa ser validado com lead real no atendimento.
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {goodLocations.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="px-4 py-3 border-b border-green-100 bg-green-50">
                  <h3 className="text-sm font-semibold text-green-800 flex items-center gap-2"><CheckCircle className="w-4 h-4" /> Locais com Bom Sinal</h3>
                </div>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/30 text-muted-foreground text-xs uppercase tracking-wide">
                      <th className="text-left px-4 py-2">Local</th>
                      <th className="text-right px-4 py-2">Cliques</th>
                      <th className="text-right px-4 py-2">Conv.</th>
                      <th className="text-right px-4 py-2 text-primary">Custo/Conv.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {goodLocations.map((l, i) => (
                      <tr key={i} className="border-t border-border hover:bg-green-50/50 transition-colors">
                        <td className="px-4 py-2.5 font-medium">{l.locationName}</td>
                        <td className="px-4 py-2.5 text-right">{fmt(l.clicks, 0)}</td>
                        <td className="px-4 py-2.5 text-right">{fmt(l.conversions, 0)}</td>
                        <td className="px-4 py-2.5 text-right font-bold text-green-700">{fmtBRL(l.costPerConversion)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {badLocations.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="px-4 py-3 border-b border-amber-100 bg-amber-50">
                  <h3 className="text-sm font-semibold text-amber-800 flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> Locais em Atenção</h3>
                </div>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/30 text-muted-foreground text-xs uppercase tracking-wide">
                      <th className="text-left px-4 py-2">Local</th>
                      <th className="text-right px-4 py-2">Cliques</th>
                      <th className="text-right px-4 py-2">Conv.</th>
                      <th className="text-right px-4 py-2 text-primary">Custo/Conv.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {badLocations.map((l, i) => (
                      <tr key={i} className={`border-t border-border hover:bg-amber-50/50 transition-colors ${(l.conversions ?? 0) === 0 ? "opacity-70" : ""}`}>
                        <td className="px-4 py-2.5 font-medium">
                          <span className="flex items-center gap-1.5">
                            {l.locationName}
                            {(l.conversions ?? 0) === 0 && <Badge variant="outline" className="text-xs text-red-600 border-red-200">Sem conv.</Badge>}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-right">{fmt(l.clicks, 0)}</td>
                        <td className="px-4 py-2.5 text-right">{fmt(l.conversions, 0)}</td>
                        <td className="px-4 py-2.5 text-right font-bold text-amber-700">{(l.conversions ?? 0) === 0 ? "—" : fmtBRL(l.costPerConversion)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm mt-4">
            <h3 className="text-sm font-semibold mb-4">Conversões por Local</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={locations.map(l => ({ nome: l.locationName, conversoes: l.conversions ?? 0 }))} margin={{ top: 5, right: 20, left: 0, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="nome" tick={{ fontSize: 10 }} angle={-35} textAnchor="end" interval={0} />
                <YAxis tick={{ fontSize: 10 }} />
                <RTooltip />
                <Bar dataKey="conversoes" name="Conversões" radius={[4,4,0,0]}>
                  {locations.map((l, i) => <Cell key={i} fill={l.status === "bom sinal" ? ORANGE : l.status === "sem conversao" ? "#e5e7eb" : "#f59e0b"} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}

      {/* BLOCO 7 — LEILÃO */}
      {leilao && (
        <section>
          <SectionHeader title="Informações do Leilão" subtitle="Posicionamento da campanha e concorrentes no leilão do Google Ads" icon={Gavel} />

          {/* Métricas da campanha */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
            <div className="bg-white rounded-xl p-5 shadow-sm text-center">
              <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
                <MetricLabel label="Parcela de Impressões" tooltip="Percentual de impressões que sua campanha recebeu em relação ao total de impressões disponíveis no leilão para seus termos." />
              </div>
              <div className="text-3xl font-bold text-primary">{fmtPct(leilao.impressionShare)}</div>
              <div className="text-xs text-muted-foreground mt-1">do total disponível</div>
            </div>
            <div className="bg-white rounded-xl p-5 shadow-sm text-center">
              <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
                <MetricLabel label="Taxa Parte Superior" tooltip="Percentual de vezes que seu anúncio apareceu na parte superior da página de resultados (acima dos resultados orgânicos)." />
              </div>
              <div className="text-3xl font-bold" style={{ color: ORANGE }}>{fmtPct(leilao.topOfPageRate)}</div>
              <div className="text-xs text-muted-foreground mt-1">no topo da página</div>
            </div>
            <div className="bg-white rounded-xl p-5 shadow-sm text-center">
              <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
                <MetricLabel label="Taxa 1ª Posição" tooltip="Percentual de vezes que seu anúncio apareceu na primeira posição absoluta da página, acima de todos os outros anúncios." />
              </div>
              <div className="text-3xl font-bold" style={{ color: BLUE }}>{fmtPct(leilao.firstPositionRate)}</div>
              <div className="text-xs text-muted-foreground mt-1">na 1ª posição</div>
            </div>
          </div>

          {/* Leitura rápida */}
          {leilao.reading && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl px-5 py-4 mb-4 text-sm text-blue-900 leading-relaxed">
              <span className="font-semibold">Leitura do leilão: </span>{leilao.reading}
            </div>
          )}

          {/* Tabela de concorrentes */}
          {leilao.competitors.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b bg-muted/30">
                <h3 className="text-sm font-semibold text-foreground">Concorrentes no Leilão</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/20 text-muted-foreground text-xs uppercase tracking-wide">
                      <th className="text-left px-4 py-2">Domínio</th>
                      <th className="text-right px-4 py-2">
                        <MetricLabel label="Parcela Impr." tooltip="Parcela de impressões estimada do concorrente no mesmo leilão." />
                      </th>
                      <th className="text-right px-4 py-2">
                        <MetricLabel label="Sobreposição" tooltip="Percentual de vezes que o anúncio do concorrente apareceu ao mesmo tempo que o seu." />
                      </th>
                      <th className="text-right px-4 py-2">
                        <MetricLabel label="Topo Pág." tooltip="Percentual de impressões do concorrente que foram na parte superior da página." />
                      </th>
                      <th className="text-right px-4 py-2">
                        <MetricLabel label="1ª Pos." tooltip="Percentual de impressões do concorrente que foram na primeira posição." />
                      </th>
                      <th className="text-right px-4 py-2">
                        <MetricLabel label="Parcela Vitórias" tooltip="Percentual de vezes que seu anúncio apareceu em posição mais alta que o do concorrente, quando ambos estavam no mesmo leilão." />
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {leilao.competitors.map((c, i) => (
                      <tr key={i} className="border-t border-border hover:bg-muted/20 transition-colors">
                        <td className="px-4 py-2.5 font-medium text-foreground">{c.domain}</td>
                        <td className="px-4 py-2.5 text-right text-muted-foreground">{c.impressionShare}</td>
                        <td className="px-4 py-2.5 text-right">{fmtPct(c.overlap)}</td>
                        <td className="px-4 py-2.5 text-right">{fmtPct(c.topOfPage)}</td>
                        <td className="px-4 py-2.5 text-right">{fmtPct(c.firstPosition)}</td>
                        <td className="px-4 py-2.5 text-right font-semibold text-primary">{fmtPct(c.winRate)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>
      )}

      {/* BLOCO 6 — INSIGHTS */}
      {(positiveInsights.length > 0 || attentionInsights.length > 0 || executive) && (
        <section>
          <SectionHeader title="Insights do Período" subtitle="Acertos, pontos de atenção e leitura executiva" icon={TrendingUp} />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
            {positiveInsights.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="px-4 py-3 border-b border-green-100 bg-green-50">
                  <h3 className="text-sm font-semibold text-green-800 flex items-center gap-2"><CheckCircle className="w-4 h-4" /> Acertos</h3>
                </div>
                <div className="p-4 space-y-2">
                  {positiveInsights.map((ins, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm">
                      <span className="w-5 h-5 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">{i+1}</span>
                      <span className="text-foreground">{ins.description}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {attentionInsights.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="px-4 py-3 border-b border-amber-100 bg-amber-50">
                  <h3 className="text-sm font-semibold text-amber-800 flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> Pontos de Atenção</h3>
                </div>
                <div className="p-4 space-y-2">
                  {attentionInsights.map((ins, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm">
                      <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">{i+1}</span>
                      <span className="text-foreground">{ins.description}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          {executive && (
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-blue-100 bg-blue-50">
                <h3 className="text-sm font-semibold text-blue-800 flex items-center gap-2"><Eye className="w-4 h-4" /> Leitura Executiva</h3>
              </div>
              <div className="p-5">
                <p className="text-sm text-foreground leading-relaxed italic">"{executive.description}"</p>
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
