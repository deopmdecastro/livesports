import { MapPin } from "lucide-react";
import AdminContentPage from "@/components/admin/AdminContentPage";

const positions = [
  {
    title: "Topo global",
    subtitle: "Banner horizontal abaixo da navegacao nas paginas publicas. Aceita imagem, HTML ou script.",
    status: "Ativo",
    meta: "header",
  },
  {
    title: "Sidebar direita",
    subtitle: "Bloco lateral para desktop em paginas de listagem e conteudo.",
    status: "Ativo",
    meta: "sidebar",
  },
  {
    title: "Meio do conteudo",
    subtitle: "Insercao entre secoes, cards e listas de eventos.",
    status: "Ativo",
    meta: "in_content",
  },
  {
    title: "Player pre-roll",
    subtitle: "Video ou imagem exibido antes da transmissao. Pode pular apos 5 segundos.",
    status: "Ativo",
    meta: "player",
  },
  {
    title: "Popup/flutuante",
    subtitle: "Campanha destacada sobre a pagina, com controlo de fecho.",
    status: "Ativo",
    meta: "popup",
  },
  {
    title: "Rodape global",
    subtitle: "Banner horizontal no fim das paginas publicas.",
    status: "Ativo",
    meta: "footer",
  },
];

export default function AdPositionsPage() {
  return (
    <AdminContentPage
      title="Posicoes de Ads"
      description="Inventario preparado para o site: topo, sidebar, meio do conteudo, player pre-roll, popup e rodape."
      icon={MapPin}
      primaryAction="Nova Posicao"
      metrics={[
        { label: "Posicoes", value: String(positions.length), helper: "ativas", tone: "green" },
        { label: "Video", value: "1", helper: "pre-roll", tone: "blue" },
        { label: "Display", value: "5", helper: "slots", tone: "red" },
        { label: "Formatos", value: "4", helper: "banner/video/html/script", tone: "yellow" },
      ]}
      rows={positions}
    />
  );
}
