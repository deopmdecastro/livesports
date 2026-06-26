import { Key } from "lucide-react";
import AdminContentPage from "@/components/admin/AdminContentPage";

export default function PermissionsPage() {
  return (
    <AdminContentPage
      title="Permissoes"
      description="Controle o acesso a modulos sensiveis como anuncios, utilizadores, lives e configuracoes."
      icon={Key}
      primaryAction="Nova Permissao"
      metrics={[
        { label: "Permissoes", value: "24", helper: "mapeadas", tone: "green" },
        { label: "Modulos", value: "9", helper: "admin", tone: "blue" },
        { label: "Restritas", value: "7", helper: "criticas", tone: "red" },
        { label: "Pendentes", value: "2", helper: "revisao", tone: "yellow" },
      ]}
      rows={[
        { title: "lives.manage", subtitle: "Criar, editar e encerrar transmissoes", status: "Ativo", meta: "Admin, Editor" },
        { title: "ads.manage", subtitle: "Gerenciar campanhas e posicoes", status: "Ativo", meta: "Admin" },
        { title: "settings.write", subtitle: "Alterar configuracoes globais", status: "Bloqueado", meta: "Super admin" },
      ]}
    />
  );
}
