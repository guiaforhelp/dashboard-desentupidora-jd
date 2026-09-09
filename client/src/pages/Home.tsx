import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { getLoginUrl } from "@/const";
import { useLocation } from "wouter";
import { BarChart3, Upload, TrendingUp, Shield, Zap, Users } from "lucide-react";
import { useEffect } from "react";

export default function Home() {
  const { isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!loading && isAuthenticated) {
      navigate("/campanhas");
    }
  }, [isAuthenticated, loading]);

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(135deg, oklch(0.18 0.08 285) 0%, oklch(0.25 0.12 295) 50%, oklch(0.20 0.10 310) 100%)" }}>
      {/* Header */}
      <header className="flex items-center justify-between px-8 py-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-lg">
            <BarChart3 className="w-6 h-6 text-white" />
          </div>
          <span className="text-white font-bold text-xl tracking-tight">Desentupidora JD</span>
        </div>
        <Button
          onClick={() => (window.location.href = getLoginUrl())}
          className="bg-white text-purple-700 hover:bg-purple-50 font-semibold px-6"
          disabled={loading}
        >
          {loading ? "Carregando..." : "Entrar"}
        </Button>
      </header>

      {/* Hero */}
      <main className="flex flex-col items-center justify-center text-center px-6 pt-20 pb-32">
        <div className="inline-flex items-center gap-2 bg-white/10 text-white/80 text-sm px-4 py-2 rounded-full mb-8 border border-white/20">
          <Zap className="w-4 h-4" />
          Dashboard de Campanhas de Anúncios
        </div>

        <h1 className="text-5xl md:text-6xl font-extrabold text-white leading-tight max-w-3xl mb-6">
          Analise suas campanhas com{" "}
          <span style={{ background: "linear-gradient(90deg, #c084fc, #f0abfc)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            inteligência
          </span>
        </h1>

        <p className="text-white/70 text-lg max-w-xl mb-10 leading-relaxed">
          Importe seus dados de campanha em JSON, visualize métricas completas, gráficos interativos e tome decisões baseadas em dados reais.
        </p>

        <Button
          size="lg"
          onClick={() => (window.location.href = getLoginUrl())}
          className="gradient-primary text-white border-0 px-10 py-6 text-lg font-semibold shadow-2xl hover:opacity-90 transition-opacity"
          disabled={loading}
        >
          Começar agora — é gratuito
        </Button>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-24 max-w-4xl w-full">
          {[
            { icon: Upload, title: "Upload de JSON", desc: "Importe dados de campanhas do Google Ads em segundos com suporte a múltiplos períodos." },
            { icon: TrendingUp, title: "Gráficos Interativos", desc: "Visualize desempenho por grupo, dispositivo, faixa etária, sexo, hora e dia da semana." },
            { icon: Shield, title: "Acesso Seguro", desc: "Autenticação via Manus OAuth. Seus dados são privados e protegidos por usuário." },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6 text-left">
              <div className="w-10 h-10 bg-purple-500/30 rounded-xl flex items-center justify-center mb-4">
                <Icon className="w-5 h-5 text-purple-200" />
              </div>
              <h3 className="text-white font-semibold text-lg mb-2">{title}</h3>
              <p className="text-white/60 text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
