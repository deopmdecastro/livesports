"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

type Lang = "pt" | "en";

interface Translations {
  // Navbar
  nav_home: string;
  nav_football: string;
  nav_basketball: string;
  nav_tennis: string;
  nav_volleyball: string;
  nav_ufc: string;
  nav_f1: string;
  nav_worldcup: string;
  nav_more: string;
  nav_search_placeholder: string;
  nav_login: string;
  nav_register: string;
  nav_live_now: string;
  // Hero
  hero_live_now: string;
  hero_scheduled: string;
  hero_watch: string;
  hero_create_account: string;
  hero_starts_in: string;
  hero_next_broadcast: string;
  hero_alt_servers: string;
  // Sections
  section_featured: string;
  section_live_count: string;
  section_see_all: string;
  section_sports: string;
  section_worldcup: string;
  section_worldcup_sub: string;
  // Event Card
  card_live: string;
  card_event: string;
  card_opponent: string;
  // Benefits
  benefit_hd_title: string;
  benefit_hd_desc: string;
  benefit_quality_title: string;
  benefit_quality_desc: string;
  benefit_multi_title: string;
  benefit_multi_desc: string;
  benefit_notif_title: string;
  benefit_notif_desc: string;
  // CTA
  cta_title: string;
  cta_sub: string;
  cta_btn: string;
  cta_no_miss: string;
  cta_no_miss_sub: string;
  cta_watch: string;
  feat_no_interruption: string;
  feat_secure: string;
  feat_premium: string;
  feat_smarttv: string;
  // Footer
  footer_tagline: string;
  footer_sports: string;
  footer_company: string;
  footer_support: string;
  footer_legal: string;
  footer_about: string;
  footer_careers: string;
  footer_blog: string;
  footer_press: string;
  footer_partners: string;
  footer_help: string;
  footer_contact: string;
  footer_plans: string;
  footer_faq: string;
  footer_terms: string;
  footer_privacy: string;
  footer_cookies: string;
  footer_dmca: string;
  footer_rights: string;
  footer_made_with: string;
  // World Cup
  wc_title: string;
  wc_subtitle: string;
  wc_group_stage: string;
  wc_knockout: string;
  wc_final: string;
  wc_top_scorers: string;
  wc_standings: string;
  wc_matches: string;
  wc_host: string;
  wc_watch_live: string;
}

const pt: Translations = {
  nav_home: "Início",
  nav_football: "Futebol",
  nav_basketball: "Basquete",
  nav_tennis: "Tênis",
  nav_volleyball: "Vôlei",
  nav_ufc: "UFC",
  nav_f1: "F1",
  nav_worldcup: "Copa do Mundo",
  nav_more: "Mais",
  nav_search_placeholder: "Pesquisar jogos, ligas...",
  nav_login: "Entrar",
  nav_register: "Registar",
  nav_live_now: "AO VIVO",
  hero_live_now: "Ao Vivo Agora",
  hero_scheduled: "Agendado",
  hero_watch: "Ver Jogo",
  hero_create_account: "Criar Conta Grátis",
  hero_starts_in: "Começa em:",
  hero_next_broadcast: "Próxima transmissão",
  hero_alt_servers: "em alta qualidade e com servidores alternativos.",
  section_featured: "Eventos em Destaque",
  section_live_count: "ao vivo agora",
  section_see_all: "Ver todos",
  section_sports: "Principais Desportos",
  section_worldcup: "Copa do Mundo 2026",
  section_worldcup_sub: "EUA · Canadá · México — Acompanhe todos os jogos ao vivo",
  card_live: "AO VIVO",
  card_event: "EVENTO",
  card_opponent: "Adversário",
  benefit_hd_title: "Transmissões HD",
  benefit_hd_desc: "Cobertura ao vivo dos maiores eventos em HD e Full HD sem travamentos.",
  benefit_quality_title: "Alta Qualidade",
  benefit_quality_desc: "Vídeo em HD e Full HD em todos os seus dispositivos favoritos.",
  benefit_multi_title: "Multi Dispositivos",
  benefit_multi_desc: "Assista no celular, tablet, Smart TV ou computador. Em qualquer lugar.",
  benefit_notif_title: "Notificações",
  benefit_notif_desc: "Receba alertas dos jogos e eventos favoritos antes do início.",
  cta_title: "Pronto para viver a emoção do esporte?",
  cta_sub: "Crie sua conta gratuita e tenha acesso ilimitado a todos os jogos.",
  cta_btn: "CRIAR CONTA GRÁTIS",
  cta_no_miss: "Não perca nenhum lance!",
  cta_no_miss_sub: "Assista onde quiser, quando quiser. Transmissões em HD, sem travamentos.",
  cta_watch: "Registre-se Grátis",
  feat_no_interruption: "Sem interrupções",
  feat_secure: "100% Seguro",
  feat_premium: "Qualidade Premium",
  feat_smarttv: "Smart TV",
  footer_tagline: "A melhor plataforma de streaming esportivo ao vivo. Assista futebol, basquete, tênis, UFC e muito mais com qualidade HD.",
  footer_sports: "Desportos",
  footer_company: "Empresa",
  footer_support: "Suporte",
  footer_legal: "Legal",
  footer_about: "Sobre Nós",
  footer_careers: "Carreiras",
  footer_blog: "Blog",
  footer_press: "Imprensa",
  footer_partners: "Parceiros",
  footer_help: "Central de Ajuda",
  footer_contact: "Contato",
  footer_plans: "Planos",
  footer_faq: "FAQ",
  footer_terms: "Termos de Uso",
  footer_privacy: "Privacidade",
  footer_cookies: "Cookies",
  footer_dmca: "DMCA",
  footer_rights: "Todos os direitos reservados.",
  footer_made_with: "Feito com ❤️ para os amantes do desporto",
  wc_title: "Copa do Mundo FIFA 2026",
  wc_subtitle: "O maior espetáculo do futebol mundial",
  wc_group_stage: "Fase de Grupos",
  wc_knockout: "Eliminatórias",
  wc_final: "Final",
  wc_top_scorers: "Artilheiros",
  wc_standings: "Classificação",
  wc_matches: "Jogos",
  wc_host: "Sede: EUA, Canadá e México",
  wc_watch_live: "Assistir ao Vivo",
};

const en: Translations = {
  nav_home: "Home",
  nav_football: "Football",
  nav_basketball: "Basketball",
  nav_tennis: "Tennis",
  nav_volleyball: "Volleyball",
  nav_ufc: "UFC",
  nav_f1: "F1",
  nav_worldcup: "World Cup",
  nav_more: "More",
  nav_search_placeholder: "Search games, leagues...",
  nav_login: "Login",
  nav_register: "Sign Up",
  nav_live_now: "LIVE NOW",
  hero_live_now: "Live Now",
  hero_scheduled: "Scheduled",
  hero_watch: "Watch Game",
  hero_create_account: "Create Free Account",
  hero_starts_in: "Starts in:",
  hero_next_broadcast: "Next broadcast",
  hero_alt_servers: "in high quality with alternative servers.",
  section_featured: "Featured Events",
  section_live_count: "live now",
  section_see_all: "See all",
  section_sports: "Main Sports",
  section_worldcup: "World Cup 2026",
  section_worldcup_sub: "USA · Canada · Mexico — Watch all matches live",
  card_live: "LIVE",
  card_event: "EVENT",
  card_opponent: "Opponent",
  benefit_hd_title: "HD Streams",
  benefit_hd_desc: "Live coverage of the biggest events in HD and Full HD without buffering.",
  benefit_quality_title: "High Quality",
  benefit_quality_desc: "HD and Full HD video on all your favorite devices.",
  benefit_multi_title: "Multi Device",
  benefit_multi_desc: "Watch on mobile, tablet, Smart TV or computer. Anywhere.",
  benefit_notif_title: "Notifications",
  benefit_notif_desc: "Get alerts for your favorite games and events before they start.",
  cta_title: "Ready to feel the excitement of sports?",
  cta_sub: "Create your free account and get unlimited access to all games.",
  cta_btn: "CREATE FREE ACCOUNT",
  cta_no_miss: "Don't miss a single moment!",
  cta_no_miss_sub: "Watch wherever you want, whenever you want. HD streams, no buffering.",
  cta_watch: "Register Free",
  feat_no_interruption: "No interruptions",
  feat_secure: "100% Secure",
  feat_premium: "Premium Quality",
  feat_smarttv: "Smart TV",
  footer_tagline: "The best live sports streaming platform. Watch football, basketball, tennis, UFC and more in HD quality.",
  footer_sports: "Sports",
  footer_company: "Company",
  footer_support: "Support",
  footer_legal: "Legal",
  footer_about: "About Us",
  footer_careers: "Careers",
  footer_blog: "Blog",
  footer_press: "Press",
  footer_partners: "Partners",
  footer_help: "Help Center",
  footer_contact: "Contact",
  footer_plans: "Plans",
  footer_faq: "FAQ",
  footer_terms: "Terms of Use",
  footer_privacy: "Privacy",
  footer_cookies: "Cookies",
  footer_dmca: "DMCA",
  footer_rights: "All rights reserved.",
  footer_made_with: "Made with ❤️ for sports lovers",
  wc_title: "FIFA World Cup 2026",
  wc_subtitle: "The greatest show in world football",
  wc_group_stage: "Group Stage",
  wc_knockout: "Knockout Stage",
  wc_final: "Final",
  wc_top_scorers: "Top Scorers",
  wc_standings: "Standings",
  wc_matches: "Matches",
  wc_host: "Host: USA, Canada & Mexico",
  wc_watch_live: "Watch Live",
};

const LangContext = createContext<{
  lang: Lang;
  setLang: (l: Lang) => void;
  t: Translations;
}>({ lang: "pt", setLang: () => {}, t: pt });

export function LangProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("pt");

  useEffect(() => {
    const saved = localStorage.getItem("livesports.lang") as Lang;
    if (saved === "en" || saved === "pt") setLangState(saved);
  }, []);

  const setLang = (l: Lang) => {
    setLangState(l);
    localStorage.setItem("livesports.lang", l);
  };

  return (
    <LangContext.Provider value={{ lang, setLang, t: lang === "en" ? en : pt }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang() {
  return useContext(LangContext);
}
