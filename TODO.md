# Task: Hero fallback para carrossel de ads

- [x] Identificar position adequada para o Hero (`header` / `live_preroll`)
- [x] Alterar `src/components/landing/HeroSection.tsx` para buscar ads quando não houver lives
- [x] Renderizar carrossel com imagens publicitárias (sem dados de live)
- [x] Manter animação/controls do carrossel existente
- [x] Garantir que o layout do Hero não quebre quando o slide for ad

---

## UX / UI polish (2026-11-24)

- [x] Skip-to-content link (acessibilidade teclado / leitores de ecrã)
- [x] Estilos `sr-only` + focus-visible no design system
- [x] Melhor feedback de hover / focus / active nos cards de Live Now
- [x] Fechar menus (search, user, mobile, more) com tecla Escape

## Mobile polish (2026-11-25)

- [x] Menu mobile: scroll lock, pesquisa com resultados, badge ao vivo, idioma, safe-area
- [x] Fechar menu ao mudar de rota
- [x] Hero: tipografia e CTAs full-width no telemóvel
- [x] Live Now: cards adaptativos + scroll touch
- [x] Safe-area utilities + footer pb-safe
- [x] SportQuickStrip espaçamento mobile

## Banners & notícias (2026-11-25)

- [x] PromoBannerStrip: carrossel (auto-rotação, pausa em hover/foco, swipe, setas, indicadores)
- [x] Respeita `prefers-reduced-motion`; rótulo "Publicidade"; `rel="sponsored"` em links externos
- [x] Promoções da própria plataforma quando não há banners patrocinados (slot nunca fica vazio)
- [x] Fallback de imagem quebrada em banners e miniaturas de notícias reais
