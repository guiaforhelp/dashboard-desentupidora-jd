import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useLocation } from "wouter";
import { BarChart3, Trash2, Eye, Upload, Calendar, TrendingUp, MousePointerClick, DollarSign } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

export default function Campanhas() {
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();
  const { data: campanhas, isLoading } = trpc.campanhas.list.useQuery();
  const deleteMutation = trpc.campanhas.delete.useMutation({
    onSuccess: () => {
      utils.campanhas.list.invalidate();
      toast.success("Campanha deletada com sucesso!");
    },
    onError: () => toast.error("Erro ao deletar campanha."),
  });

  const [deletingId, setDeletingId] = useState<number | null>(null);

  const handleDelete = (id: number) => {
    if (!confirm("Tem certeza que deseja deletar esta campanha?")) return;
    setDeletingId(id);
    deleteMutation.mutate({ id }, { onSettled: () => setDeletingId(null) });
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Campanhas</h1>
          <p className="text-muted-foreground mt-1">Gerencie e visualize suas campanhas importadas</p>
        </div>
        <Button onClick={() => navigate("/upload")} className="gradient-primary text-white border-0 gap-2">
          <Upload className="w-4 h-4" />
          Importar JSON
        </Button>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader><Skeleton className="h-6 w-3/4" /></CardHeader>
              <CardContent><Skeleton className="h-4 w-1/2 mb-2" /><Skeleton className="h-4 w-1/3" /></CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && (!campanhas || campanhas.length === 0) && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-20 h-20 rounded-2xl gradient-primary flex items-center justify-center mb-6 shadow-lg">
            <BarChart3 className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-xl font-semibold text-foreground mb-2">Nenhuma campanha importada</h2>
          <p className="text-muted-foreground mb-6 max-w-sm">
            Importe seu primeiro arquivo JSON com dados de campanha para começar a analisar.
          </p>
          <Button onClick={() => navigate("/upload")} className="gradient-primary text-white border-0 gap-2">
            <Upload className="w-4 h-4" />
            Importar agora
          </Button>
        </div>
      )}

      {/* Campanhas grid */}
      {!isLoading && campanhas && campanhas.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {campanhas.map((c) => (
            <Card key={c.id} className="border border-border shadow-sm hover:shadow-md transition-shadow group">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base font-semibold text-foreground truncate">{c.campaignName}</CardTitle>
                    {c.startDate && (
                      <div className="flex items-center gap-1.5 mt-1 text-muted-foreground text-sm">
                        <Calendar className="w-3.5 h-3.5" />
                        {c.startDate} a {c.endDate}
                      </div>
                    )}
                  </div>
                  <Badge variant="secondary" className="shrink-0 bg-purple-100 text-purple-700">
                    {new Date(c.createdAt).toLocaleDateString("pt-BR")}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {/* Métricas resumidas */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="flex items-center gap-2 bg-muted/50 rounded-lg p-2.5">
                    <MousePointerClick className="w-4 h-4 text-purple-500" />
                    <div>
                      <p className="text-xs text-muted-foreground">Cliques</p>
                      <p className="text-sm font-semibold">{c.clicks?.toLocaleString("pt-BR") ?? "—"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 bg-muted/50 rounded-lg p-2.5">
                    <TrendingUp className="w-4 h-4 text-green-500" />
                    <div>
                      <p className="text-xs text-muted-foreground">Conversões</p>
                      <p className="text-sm font-semibold">{c.conversions?.toLocaleString("pt-BR") ?? "—"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 bg-muted/50 rounded-lg p-2.5">
                    <DollarSign className="w-4 h-4 text-amber-500" />
                    <div>
                      <p className="text-xs text-muted-foreground">Custo Total</p>
                      <p className="text-sm font-semibold">{c.totalCost != null ? `R$ ${c.totalCost.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : "—"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 bg-muted/50 rounded-lg p-2.5">
                    <BarChart3 className="w-4 h-4 text-blue-500" />
                    <div>
                      <p className="text-xs text-muted-foreground">CTR</p>
                      <p className="text-sm font-semibold">{c.ctr != null ? `${c.ctr.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}%` : "—"}</p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    className="flex-1 gradient-primary text-white border-0 gap-2"
                    size="sm"
                    onClick={() => navigate(`/dashboard/${c.id}`)}
                  >
                    <Eye className="w-4 h-4" />
                    Visualizar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive hover:bg-destructive/10 border-destructive/30"
                    onClick={() => handleDelete(c.id)}
                    disabled={deletingId === c.id}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
