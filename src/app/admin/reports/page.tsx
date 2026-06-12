import { BarChart3 } from "lucide-react";
import AdminContentPage from "@/components/admin/AdminContentPage";

export default function ReportsPage() {
  return (
    <AdminContentPage
      title="Relatorios"
      description="Consolide desempenho de audiencias, receita de anuncios e disponibilidade das transmissoes."
      icon={BarChart3}
      primaryAction="Exportar XLSX"
      metrics={[
        { label: "Visualizacoes", value: "1.2M", helper: "+16%", tone: "green" },
        { label: "Receita ads", value: "R$ 45.6K", helper: "+18%", tone: "red" },
        { label: "Uptime", value: "99.8%", helper: "SLA", tone: "blue" },
        { label: "Relatorios", value: "14", helper: "gerados", tone: "yellow" },
      ]}
      rows={[
        { title: "Resumo mensal de audiencia", subtitle: "Visao por esporte, live e dispositivo", status: "Publicado", meta: "Maio 2026" },
        { title: "Receita por campanha", subtitle: "Impressao, clique, CTR e faturamento", status: "Publicado", meta: "Maio 2026" },
        { title: "Saude das transmissoes", subtitle: "Erros de player, buffering e uptime", status: "Em analise", meta: "Atualizando" },
      ]}
    />
  );
}
