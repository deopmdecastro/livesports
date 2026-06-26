import { Megaphone } from "lucide-react";
import AdminContentPage from "@/components/admin/AdminContentPage";

export default function CampaignsPage() {
  return (
    <AdminContentPage
      title="Campanhas"
      description="Acompanhe campanhas comerciais, patrocinadores, periodo de veiculacao e entrega contratada."
      icon={Megaphone}
      primaryAction="Nova Campanha"
      metrics={[
        { label: "Campanhas", value: "12", helper: "8 ativas", tone: "green" },
        { label: "Orcamento", value: "R$ 84K", helper: "mensal", tone: "blue" },
        { label: "Entrega", value: "76%", helper: "no prazo", tone: "red" },
        { label: "Receita", value: "R$ 46K", helper: "+18%", tone: "yellow" },
      ]}
      rows={[
        { title: "Nike Summer 2024", subtitle: "Banners de topo e mid-roll", status: "Ativo", meta: "245.678 impressoes" },
        { title: "Adidas Pro Series", subtitle: "Sidebar e cards patrocinados", status: "Ativo", meta: "180.543 impressoes" },
        { title: "ESPN Subscription", subtitle: "Campanha em conteudo", status: "Pausado", meta: "Revisar criativos" },
      ]}
    />
  );
}
