import { Bell } from "lucide-react";
import AdminContentPage from "@/components/admin/AdminContentPage";

export default function NotificationsPage() {
  return (
    <AdminContentPage
      title="Notificacoes"
      description="Monitore alertas enviados a utilizadores e notificacoes internas da equipe."
      icon={Bell}
      primaryAction="Criar Notificacao"
      metrics={[
        { label: "Enviadas", value: "38.2K", helper: "7 dias", tone: "green" },
        { label: "Abertura", value: "42%", helper: "+6%", tone: "blue" },
        { label: "Falhas", value: "31", helper: "baixo", tone: "yellow" },
        { label: "Nao lidas", value: "2", helper: "admin", tone: "red" },
      ]}
      rows={[
        { title: "Nova live iniciada", subtitle: "Manchester United vs Liverpool", status: "Publicado", meta: "2 min atras" },
        { title: "Relatorio mensal disponivel", subtitle: "Resumo de audiencia e receita", status: "Publicado", meta: "3h atras" },
        { title: "Campanha atingiu limite", subtitle: "Anuncio #002 precisa de ajuste", status: "Pendente", meta: "Hoje" },
      ]}
    />
  );
}
