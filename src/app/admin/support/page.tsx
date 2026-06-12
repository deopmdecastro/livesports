import { HeadphonesIcon } from "lucide-react";
import AdminContentPage from "@/components/admin/AdminContentPage";

export default function SupportPage() {
  return (
    <AdminContentPage
      title="Suporte"
      description="Acompanhe chamados de utilizadores, incidentes de streaming e pedidos comerciais."
      icon={HeadphonesIcon}
      primaryAction="Novo Ticket"
      metrics={[
        { label: "Abertos", value: "18", helper: "fila", tone: "yellow" },
        { label: "Resolvidos", value: "142", helper: "30 dias", tone: "green" },
        { label: "SLA", value: "94%", helper: "dentro", tone: "blue" },
        { label: "Criticos", value: "2", helper: "agora", tone: "red" },
      ]}
      rows={[
        { title: "Erro no player HLS", subtitle: "Utilizador relata falha ao abrir /watch/3", status: "Aberto", meta: "Prioridade alta" },
        { title: "Duvida sobre plano premium", subtitle: "Pergunta sobre dispositivos simultaneos", status: "Pendente", meta: "Aguardando resposta" },
        { title: "Notificacao nao recebida", subtitle: "Alerta de jogo nao disparou no mobile", status: "Resolvido", meta: "Hoje 17:20" },
      ]}
    />
  );
}
