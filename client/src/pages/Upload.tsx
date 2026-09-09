import { useState, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";
import { Upload as UploadIcon, FileJson, CheckCircle2, AlertCircle, ArrowLeft, Sparkles } from "lucide-react";
import { toast } from "sonner";

// Dados de exemplo reais da campanha "Caça Vazamento [LP] [Fundo de funil] [São Paulo]" — período 27/05 a 02/06/2026
const EXEMPLO_JSON = {
  campaign_name: "Caça Vazamento [LP] [Fundo de funil] [São Paulo]",
  period: { start_date: "2026-05-27", end_date: "2026-06-02" },
  summary: {
    clicks: 69,
    impressions: 828,
    ctr: 8.33,
    avg_cpc: 19.85,
    total_cost: 1369.88,
    conversions: 16,
    conversion_rate: 23.19,
    cost_per_conversion: 85.62,
    target_cpa_min: 60.00,
    target_cpa_max: 61.00,
    summary_text: "No período de 27/05 a 02/06, a campanha CV registrou 69 cliques, 828 impressões, R$ 1.369,88 de custo, CPC médio de R$ 19,85 e 16 conversões. O CTR ficou bom, mostrando boa atratividade dos anúncios, mas o CPA de R$ 85,62 ficou acima da meta desejada de R$ 60 a R$ 61.",
  },
  ad_groups: [
    {
      name: "Caça Vazamento [REFORMULADO]",
      status: "ativo",
      type: "padrão",
      clicks: 42,
      impressions: 538,
      ctr: 7.81,
      avg_cpc: 20.14,
      total_cost: 845.94,
      conversions: 10,
      conversion_rate: 23.81,
      cost_per_conversion: 84.59,
      note: "Grupo ativo. Mais volume de cliques e impressões, mas CPA acima da meta. Precisa de controle na qualidade dos termos e intenção de busca.",
    },
    {
      name: "Caça Vazamento",
      status: "pausado",
      type: "padrão",
      clicks: 27,
      impressions: 290,
      ctr: 9.31,
      avg_cpc: 19.41,
      total_cost: 523.94,
      conversions: 6,
      conversion_rate: 22.22,
      cost_per_conversion: 87.32,
      note: "Grupo antigo pausado. Mesmo pausado no período, ainda representou parte das conversões.",
    },
  ],
  keywords: [
    {
      keyword: '"caça vazamento"',
      match_type: "exata",
      ad_group: "Caça Vazamento [REFORMULADO]",
      status: "qualificada",
      clicks: 33,
      impressions: 448,
      ctr: 7.37,
      avg_cpc: 20.19,
      total_cost: 666.17,
      conversions: 8,
      conversion_rate: 24.24,
      cost_per_conversion: 83.27,
    },
    {
      keyword: "caça vazamento",
      match_type: "ampla modificada",
      ad_group: "Caça Vazamento",
      status: "nao_qualificada",
      status_note: "Grupo de anúncios pausado",
      clicks: 21,
      impressions: 234,
      ctr: 8.97,
      avg_cpc: 18.01,
      total_cost: 378.25,
      conversions: 6,
      conversion_rate: 28.57,
      cost_per_conversion: 63.04,
    },
    {
      keyword: '"caça vazamento zona sul"',
      match_type: "exata",
      ad_group: "Caça Vazamento [REFORMULADO]",
      status: "qualificada",
      clicks: 4,
      impressions: 34,
      ctr: 11.76,
      avg_cpc: 22.61,
      total_cost: 90.42,
      conversions: 2,
      conversion_rate: 50.00,
      cost_per_conversion: 45.21,
      note: "Melhor CPA do período — taxa de conversão de 50%. Termo altamente qualificado.",
    },
  ],
  search_terms_snapshot: {
    date: "2026-06-02",
    summary: { clicks: 44, impressions: 499, total_cost: 1037.25, conversions: 11, cost_per_conversion: 94.30 },
    good_terms: [
      "caça vazamento",
      "caça vazamentos",
      "caça vazamento de agua",
      "caça vazamento de água",
      "caca vazamento",
      "caca vazamentos",
      "caça vazamento zona sul",
      "caçador de vazamentos sp",
      "empresa que detecta vazamento",
      "empresas caça vazamentos",
      "detecta vazamento",
      "encontrar vazamento de água",
      "localizar vazamento de água",
      "minha conta de agua veio muito alta",
      "conta de agua veio muito alta",
      "conta de agua muito alta",
      "caça vazamento apartamento",
    ],
    bad_terms: [
      { term: "encanador", clicks: 1, cost: 26.14, conversions: 1, reason: "Gerou conversão com CPA baixo, mas foge do foco da campanha. A IA Max pode aprender com público errado — avaliar como negativa." },
      { term: "caça infiltração", clicks: 2, cost: 91.34, conversions: 1, reason: "Termo ambíguo — pode atrair buscas sobre impermeabilização, parede úmida, laje ou condomínio. Não é o público ideal." },
    ],
  },
  devices: [
    { device: "Smartphones", conversions_percent: 87.5, impressions_percent: 81.6, clicks_percent: 89.9 },
    { device: "Computadores", conversions_percent: 12.5, impressions_percent: 18.4, clicks_percent: 10.1 },
    { device: "Tablets", conversions_percent: 0, impressions_percent: 0, clicks_percent: 0, bid_adjustment: -100 },
  ],
  demographics: {
    age: [
      { range: "18-24", conversions: 0 },
      { range: "25-34", conversions: 1 },
      { range: "35-44", conversions: 3 },
      { range: "45-54", conversions: 5 },
      { range: "55-64", conversions: 2 },
      { range: "65+", conversions: 2 },
      { range: "Desconhecida", conversions: 3 },
    ],
    gender: [
      { gender: "Feminino", conversions: 8, percentage_known: 50.0 },
      { gender: "Masculino", conversions: 5, percentage_known: 31.25 },
      { gender: "Desconhecido", conversions: 3, percentage_known: 18.75 },
    ],
    gender_age: [
      { segment: "Feminino 45-54", conversions: 3 },
      { segment: "Feminino 35-44", conversions: 2 },
      { segment: "Masculino 45-54", conversions: 2 },
      { segment: "Feminino 55-64", conversions: 1 },
      { segment: "Masculino 35-44", conversions: 1 },
      { segment: "Masculino 65+", conversions: 1 },
    ],
    income: [
      { range: "10% maior renda", conversions: 6 },
      { range: "11% a 20%", conversions: 3 },
      { range: "21% a 30%", conversions: 0 },
      { range: "31% a 40%", conversions: 0 },
      { range: "41% a 50%", conversions: 0 },
      { range: "50% menor renda", conversions: 4 },
      { range: "Desconhecida", conversions: 3 },
    ],
    income_notes: [
      "Público de 10% com maior renda liderou com 6 conversões — reforça estratégia de público premium.",
      "Renda desconhecida gerou 3 conversões — analisar com cuidado, pode conter bons usuários não classificados.",
      "Grupo de 50% menor renda gerou 4 conversões — validar qualidade real dos leads no atendimento.",
    ],
  },
  time: {
    hours: [
      { hour: "00h", conversions: 1 }, { hour: "01h", conversions: 0 }, { hour: "02h", conversions: 0 },
      { hour: "03h", conversions: 0 }, { hour: "04h", conversions: 0 }, { hour: "05h", conversions: 0 },
      { hour: "06h", conversions: 0 }, { hour: "07h", conversions: 3 }, { hour: "08h", conversions: 2 },
      { hour: "09h", conversions: 0 }, { hour: "10h", conversions: 1 }, { hour: "11h", conversions: 2 },
      { hour: "12h", conversions: 4 }, { hour: "13h", conversions: 4 }, { hour: "14h", conversions: 0 },
      { hour: "15h", conversions: 2 }, { hour: "16h", conversions: 2 }, { hour: "17h", conversions: 1 },
      { hour: "18h", conversions: 0 }, { hour: "19h", conversions: 0 }, { hour: "20h", conversions: 2 },
      { hour: "21h", conversions: 0 }, { hour: "22h", conversions: 0 }, { hour: "23h", conversions: 0 },
    ],
    day_of_week: [
      { day: "Domingo",       conversions: 3 },
      { day: "Segunda-feira", conversions: 6 },
      { day: "Terça-feira",   conversions: 9 },
      { day: "Quarta-feira",  conversions: 4 },
      { day: "Quinta-feira",  conversions: 0 },
      { day: "Sexta-feira",   conversions: 0 },
      { day: "Sábado",        conversions: 0 },
    ],
  },
  locations: [
    { location: "Vila Mariana, SP",  clicks: 11, impressions: 82,  ctr: 13.41, total_cost: 266.37, conversions: 5, cost_per_conversion: 53.27,  status: "bom sinal" },
    { location: "Itaim Bibi, SP",    clicks: 6,  impressions: 67,  ctr: 8.96,  total_cost: 124.29, conversions: 2, cost_per_conversion: 62.14,  status: "bom sinal" },
    { location: "Jabaquara, SP",     clicks: 4,  impressions: 60,  ctr: 6.67,  total_cost: 105.27, conversions: 2, cost_per_conversion: 52.64,  status: "bom sinal" },
    { location: "Santa Cecília, SP", clicks: 3,  impressions: 21,  ctr: 14.29, total_cost: 85.55,  conversions: 2, cost_per_conversion: 42.77,  status: "bom sinal" },
    { location: "São Paulo, SP",     clicks: 14, impressions: 130, ctr: 10.77, total_cost: 190.33, conversions: 1, cost_per_conversion: 190.33, status: "atencao" },
    { location: "Santo Amaro, SP",   clicks: 9,  impressions: 77,  ctr: 11.69, total_cost: 184.98, conversions: 1, cost_per_conversion: 184.98, status: "atencao" },
    { location: "Saúde, SP",         clicks: 5,  impressions: 44,  ctr: 11.36, total_cost: 90.32,  conversions: 1, cost_per_conversion: 90.32,  status: "atencao" },
    { location: "Pinheiros, SP",     clicks: 4,  impressions: 40,  ctr: 10.00, total_cost: 81.88,  conversions: 1, cost_per_conversion: 81.88,  status: "atencao" },
    { location: "Liberdade, SP",     clicks: 1,  impressions: 20,  ctr: 5.00,  total_cost: 45.34,  conversions: 1, cost_per_conversion: 45.34,  status: "bom sinal" },
  ],
  insights: {
    positive: [
      "CTR bom de 8,33%, indicando boa atratividade dos anúncios.",
      "CPC médio de R$ 19,85, melhor do que períodos recentes com CPC acima de R$ 22.",
      "Campanha registrou 16 conversões no período.",
      "Smartphones seguem como principal dispositivo, com 89,9% dos cliques e 87,5% das conversões.",
      "Público feminino teve maior volume de conversões, com 8 conversões (50% do total).",
      "Faixa de 45 a 54 anos foi a mais forte por idade, com 5 conversões.",
      "Público de 10% com maior renda teve 6 conversões, reforçando a estratégia de público premium.",
    ],
    attention: [
      "CPA de R$ 85,62 ficou acima da meta desejada de R$ 60 a R$ 61.",
      "Custo total do período foi de R$ 1.369,88 para 16 conversões.",
      "Taxa de conversão foi de 23,19%, mas as conversões precisam ser validadas como leads reais.",
      "O grupo de 50% com menor renda gerou 4 conversões — cruzar com qualidade real do atendimento.",
      "Computadores geraram apenas 12,5% das conversões, mas ainda não devem ser cortados.",
      "Tablets seguem sem participação e com ajuste de -100%.",
      "Conversões representam eventos registrados no Google Ads — não tratar automaticamente como vendas ou leads reais sem validação.",
    ],
    executive_reading: "No período de 27/05 a 02/06, a campanha CV registrou 69 cliques, 828 impressões, R$ 1.369,88 de custo, CPC médio de R$ 19,85 e 16 conversões, resultando em CPA de R$ 85,62. O CTR ficou bom, mostrando que os anúncios atraíram cliques, e o CPC médio melhorou em relação a períodos anteriores. Porém, o CPA ainda está acima da meta desejada. Os melhores sinais de público vieram de smartphones, mulheres, faixa de 45 a 54 anos e 10% com maior renda. As conversões devem ser validadas com atendimento real para confirmar se viraram leads qualificados.",
    data_quality_note: "Estes dados consideram somente a base validada do período 27/05/2026 a 02/06/2026. Dados inconsistentes de relatórios com períodos diferentes foram ignorados. Conversões representam eventos registrados no Google Ads e não devem ser tratadas automaticamente como vendas ou leads reais sem validação.",
  },
  leilao: {
    impression_share: 24.93,
    top_of_page_rate: 82.44,
    first_position_rate: 36.65,
    reading: "Sua campanha teve a maior parcela de impressões visível, com 24,93%. A taxa de topo de página está forte: 82,44%. A taxa de primeira posição também está boa: 36,65%. O principal ponto não parece ser posição, e sim qualidade dos termos, controle de tráfego e validação das conversões.",
    competitors: [
      { domain: "cacavazam...",    impression_share: "< 10%", overlap: 7.35,  top_of_page: 72.53, first_position: 20.17, win_rate: 24.40 },
      { domain: "detectabras...",  impression_share: "< 10%", overlap: 8.54,  top_of_page: 57.01, first_position: 9.05,  win_rate: 24.46 },
      { domain: "essencialca...",  impression_share: "< 10%", overlap: 6.88,  top_of_page: 77.27, first_position: 28.41, win_rate: 24.11 },
      { domain: "lidervazame...",  impression_share: "< 10%", overlap: 4.51,  top_of_page: 86.92, first_position: 29.62, win_rate: 24.37 },
      { domain: "lidertecdes...",  impression_share: "< 10%", overlap: 5.93,  top_of_page: 75.33, first_position: 14.54, win_rate: 24.02 },
      { domain: "limpatecde...",   impression_share: "< 10%", overlap: 5.69,  top_of_page: 75.13, first_position: 29.02, win_rate: 23.87 },
      { domain: "decolarvaz...",   impression_share: "< 10%", overlap: 10.20, top_of_page: 75.00, first_position: 18.15, win_rate: 23.78 },
    ],
  },
};

export default function Upload() {
  const [, navigate] = useLocation();
  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [usingExample, setUsingExample] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const utils = trpc.useUtils();
  const uploadMutation = trpc.campanhas.upload.useMutation({
    onSuccess: (data) => {
      setStatus("success");
      utils.campanhas.list.invalidate();
      toast.success("Campanha importada com sucesso!");
      setTimeout(() => navigate(`/dashboard/${data.campanhaId}`), 1500);
    },
    onError: (err) => {
      setStatus("error");
      toast.error("Erro ao importar: " + err.message);
    },
  });

  const processFile = (f: File) => {
    if (!f.name.endsWith(".json")) {
      toast.error("Apenas arquivos .json são aceitos.");
      return;
    }
    setUsingExample(false);
    setFile(f);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const parsed = JSON.parse(text);
        setPreview(JSON.stringify(parsed, null, 2).slice(0, 600) + "\n...");
      } catch {
        toast.error("Arquivo JSON inválido.");
        setFile(null);
      }
    };
    reader.readAsText(f);
  };

  const handleUseExample = () => {
    setUsingExample(true);
    setFile(null);
    setStatus("idle");
    setPreview(JSON.stringify(EXEMPLO_JSON, null, 2).slice(0, 600) + "\n...");
    toast.info("Dados de exemplo carregados! Clique em Importar para salvar.");
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) processFile(f);
  };

  const handleSubmit = () => {
    setStatus("loading");
    if (usingExample) {
      uploadMutation.mutate(EXEMPLO_JSON);
      return;
    }
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        uploadMutation.mutate(data);
      } catch {
        setStatus("error");
        toast.error("Arquivo JSON inválido.");
      }
    };
    reader.readAsText(file);
  };

  const hasData = file !== null || usingExample;

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <Button variant="ghost" size="sm" onClick={() => navigate("/campanhas")} className="gap-2 text-muted-foreground">
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </Button>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Importar Campanha</h1>
        <p className="text-muted-foreground mt-1">Faça upload de um arquivo JSON ou use os dados de exemplo</p>
      </div>

      {/* Banner de dados de exemplo */}
      <div className="mb-5 rounded-2xl border border-orange-200 bg-gradient-to-r from-orange-50 to-amber-50 p-4 flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shrink-0 shadow">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-orange-900 text-sm">Experimente com dados reais</p>
          <p className="text-orange-700/80 text-xs mt-0.5 leading-relaxed">
            Use a campanha <strong>"Caça Vazamento [LP] [Fundo de funil] [São Paulo]"</strong> (27/05–02/06/2026): 16 conversões, R$ 1.369,88, 2 grupos, palavras-chave, termos bons/atenção, dispositivos, demográficos, 9 locais e insights completos incluindo análise de IA Max.
          </p>
        </div>
        <Button
          size="sm"
          onClick={handleUseExample}
          disabled={status === "loading" || status === "success"}
          className="shrink-0 gradient-primary text-white border-0 gap-1.5 text-xs"
        >
          <Sparkles className="w-3.5 h-3.5" />
          Usar exemplo
        </Button>
      </div>

      <Card className="border-2 border-dashed border-border hover:border-primary/50 transition-colors">
        <CardContent className="p-8">
          <div
            className={`flex flex-col items-center justify-center gap-4 py-8 rounded-xl cursor-pointer transition-all ${
              dragging ? "bg-primary/5 border-primary" : usingExample ? "bg-orange-50/60" : "bg-muted/30"
            }`}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => !usingExample && fileRef.current?.click()}
          >
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all ${hasData ? "gradient-primary" : "bg-muted"}`}>
              {usingExample ? (
                <Sparkles className="w-8 h-8 text-white" />
              ) : file ? (
                <FileJson className="w-8 h-8 text-white" />
              ) : (
                <UploadIcon className="w-8 h-8 text-muted-foreground" />
              )}
            </div>

            {usingExample ? (
              <div className="text-center">
                <div className="flex items-center gap-2 justify-center mb-1">
                  <p className="font-semibold text-foreground">Caça Vazamento [LP] [Fundo de funil] [São Paulo]</p>
                  <Badge className="bg-orange-100 text-orange-700 text-xs">Exemplo</Badge>
                </div>
                <p className="text-sm text-muted-foreground">27/05/2026 a 02/06/2026 · 16 conversões · R$ 1.369,88</p>
                <button
                  className="text-xs text-primary underline mt-2 hover:opacity-80"
                  onClick={(e) => { e.stopPropagation(); setUsingExample(false); setPreview(null); setStatus("idle"); }}
                >
                  Remover e usar arquivo próprio
                </button>
              </div>
            ) : file ? (
              <div className="text-center">
                <p className="font-semibold text-foreground">{file.name}</p>
                <p className="text-sm text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p>
              </div>
            ) : (
              <div className="text-center">
                <p className="font-semibold text-foreground">Arraste o arquivo aqui</p>
                <p className="text-sm text-muted-foreground">ou clique para selecionar</p>
                <p className="text-xs text-muted-foreground mt-1">Apenas arquivos .json</p>
              </div>
            )}

            <input
              ref={fileRef}
              type="file"
              accept=".json"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) processFile(f); }}
            />
          </div>

          {/* Preview */}
          {preview && (
            <div className="mt-4">
              <p className="text-xs font-medium text-muted-foreground mb-2">Pré-visualização:</p>
              <pre className="bg-muted rounded-lg p-3 text-xs overflow-auto max-h-40 text-foreground/80">{preview}</pre>
            </div>
          )}

          {/* Status feedback */}
          {status === "success" && (
            <div className="flex items-center gap-2 mt-4 text-green-600 bg-green-50 rounded-lg p-3">
              <CheckCircle2 className="w-5 h-5" />
              <span className="text-sm font-medium">Importado com sucesso! Redirecionando para a dashboard...</span>
            </div>
          )}
          {status === "error" && (
            <div className="flex items-center gap-2 mt-4 text-destructive bg-destructive/10 rounded-lg p-3">
              <AlertCircle className="w-5 h-5" />
              <span className="text-sm font-medium">Erro ao importar. Verifique o arquivo e tente novamente.</span>
            </div>
          )}

          <Button
            className="w-full mt-6 gradient-primary text-white border-0 gap-2 py-5 text-base font-semibold"
            onClick={handleSubmit}
            disabled={!hasData || status === "loading" || status === "success"}
          >
            {status === "loading" ? (
              <>
                <span className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full inline-block" />
                Importando...
              </>
            ) : (
              <>
                <UploadIcon className="w-5 h-5" />
                {usingExample ? "Importar dados de exemplo" : "Importar Campanha"}
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Formato esperado */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">Formato esperado do JSON</CardTitle>
          <CardDescription>O arquivo deve seguir o esquema v2 com campos em inglês</CardDescription>
        </CardHeader>
        <CardContent>
          <pre className="bg-muted rounded-lg p-4 text-xs overflow-auto text-foreground/80">{`{
  "campaign_name": "Nome da Campanha",
  "period": { "start_date": "2026-05-20", "end_date": "2026-05-26" },
  "summary": {
    "clicks": 102, "impressions": 1264, "ctr": 8.07,
    "avg_cpc": 22.49, "total_cost": 2293.99,
    "conversions": 39, "conversion_rate": 38.24,
    "cost_per_conversion": 58.82,
    "target_cpa_min": 60.0, "target_cpa_max": 61.0
  },
  "ad_groups": [{ "name": "...", "clicks": 0, ... }],
  "keywords": [{ "keyword": "...", "match_type": "exata", ... }],
  "search_terms_snapshot": {
    "good_terms": ["termo 1", ...],
    "bad_terms": [{ "term": "...", "reason": "..." }]
  },
  "devices": [{ "device": "Smartphones", "conversions_percent": 89.7, ... }],
  "demographics": {
    "age": [{ "range": "35-44", "conversions": 9 }],
    "gender": [{ "gender": "Masculino", "conversions": 18 }],
    "gender_age": [{ "segment": "Masculino 65+", "conversions": 7 }],
    "income_notes": ["Nota sobre renda..."]
  },
  "time": {
    "hours": [{ "hour": "11h", "conversions": 7 }],
    "day_of_week": [{ "day": "Quinta-feira", "conversions": 9 }]
  },
  "locations": [{ "location": "Jabaquara", "clicks": 15, "conversions": 10, "cost_per_conversion": 36.78, "status": "bom sinal" }],
  "insights": {
    "positive": ["Acerto 1", ...],
    "attention": ["Atenção 1", ...],
    "executive_reading": "Leitura executiva..."
  }
}`}</pre>
        </CardContent>
      </Card>
    </div>
  );
}
