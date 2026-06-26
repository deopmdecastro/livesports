import { Shield } from "lucide-react";
import AdminContentPage from "@/components/admin/AdminContentPage";

export default function RolesPage() {
  return (
    <AdminContentPage
      title="Funcoes"
      description="Defina perfis operacionais para administradores, editores, moderadores e suporte."
      icon={Shield}
      primaryAction="Nova Funcao"
      metrics={[
        { label: "Funcoes", value: "5", helper: "ativas", tone: "green" },
        { label: "Admins", value: "4", helper: "equipe", tone: "red" },
        { label: "Editores", value: "7", helper: "conteudo", tone: "blue" },
        { label: "Suporte", value: "3", helper: "turnos", tone: "yellow" },
      ]}
      rows={[
        { title: "Super Admin", subtitle: "Acesso completo a todos os modulos", status: "Ativo", meta: "2 usuarios" },
        { title: "Editor", subtitle: "Gerencia lives, eventos, noticias e banners", status: "Ativo", meta: "7 usuarios" },
        { title: "Moderador", subtitle: "Acompanha chat, denuncias e suporte inicial", status: "Ativo", meta: "5 usuarios" },
      ]}
    />
  );
}
