import { UserCircle } from "lucide-react";
import AdminContentPage from "@/components/admin/AdminContentPage";

export default function AdminProfilePage() {
  return (
    <AdminContentPage
      title="Perfil"
      description="Dados do administrador autenticado, preferencias de acesso e historico recente."
      icon={UserCircle}
      primaryAction="Editar Perfil"
      metrics={[
        { label: "Sessao", value: "Ativa", helper: "segura", tone: "green" },
        { label: "Funcao", value: "Admin", helper: "full", tone: "red" },
        { label: "2FA", value: "On", helper: "email", tone: "blue" },
        { label: "Acessos", value: "18", helper: "30 dias", tone: "yellow" },
      ]}
      rows={[
        { title: "Administrador", subtitle: "admin@livesports.com", status: "Online", meta: "Lisboa" },
        { title: "Ultimo login", subtitle: "Painel administrativo", status: "Aprovado", meta: "Hoje 21:00" },
        { title: "Permissoes principais", subtitle: "Lives, anuncios, utilizadores e relatorios", status: "Ativo", meta: "Admin" },
      ]}
    />
  );
}
