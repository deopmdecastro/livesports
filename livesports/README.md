# 🏆 Live Sports - Plataforma de Streaming Desportivo

Uma plataforma completa de transmissão ao vivo de eventos desportivos com design premium em tema vermelho e preto.

## 🚀 Funcionalidades

### Frontend (Next.js 15)
- ✅ **Landing Page** premium com hero section animada, cards de jogos ao vivo
- ✅ **Autenticação** completa (login, registro, recuperação de senha, login social)
- ✅ **Dashboard Admin** com widgets de KPIs, gráficos e tabelas
- ✅ **Gestão de Lives** - CRUD completo de transmissões ao vivo
- ✅ **Gestão de Eventos** - Calendário de eventos futuros
- ✅ **Gestão de Utilizadores** - Lista, filtros, ações (suspender, banir)
- ✅ **Ads Manager** - Sistema completo de gestão de anúncios
- ✅ **CMS de Notícias** - Criar e gerir artigos
- ✅ **Player de Streaming** - Suporte HLS/M3U8 com chat ao vivo
- ✅ **Design Responsivo** - Mobile, Tablet, Desktop

### Backend (Express + TypeScript)
- ✅ **API REST** completa com autenticação JWT
- ✅ **Refresh Token** para sessões longas
- ✅ **Rate Limiting** para proteção contra ataques
- ✅ **CORS** configurado
- ✅ **Socket.IO** para funcionalidades em tempo real
- ✅ **Validação** com Zod
- ✅ **Segurança** com Helmet

### Banco de Dados (PostgreSQL)
- ✅ **Schema completo** com Prisma ORM
- ✅ **Migrations** SQL prontas
- ✅ **Seed inicial** com dados de exemplo

---

## 📁 Estrutura do Projeto

```
livesports/
├── src/                         # Frontend Next.js
│   ├── app/
│   │   ├── (public)/           # Páginas públicas
│   │   ├── (auth)/             # Login, Registro
│   │   ├── (watch)/            # Player de vídeo
│   │   └── admin/              # Dashboard administrativo
│   ├── components/
│   │   ├── layout/             # Navbar, Footer
│   │   ├── landing/            # Seções da homepage
│   │   ├── admin/              # Componentes do painel
│   │   └── player/             # Player de streaming
│   ├── lib/                    # Dados mock, configurações
│   ├── types/                  # TypeScript types
│   └── utils/                  # Funções utilitárias
├── backend/                     # API Express
│   ├── src/
│   │   ├── routes/             # Rotas da API
│   │   ├── middleware/         # Auth, rate limit
│   │   └── index.ts            # Entry point
│   └── prisma/
│       ├── schema.prisma       # Schema do banco
│       └── migrations/         # SQL migrations
├── docker/                      # Dockerfiles, Nginx
├── docker-compose.yml           # Orquestração
└── .env.example                 # Variáveis de ambiente
```

---

## 🛠️ Stack Tecnológica

| Camada | Tecnologia |
|--------|-----------|
| Frontend | Next.js 15, React 18, TypeScript |
| Estilização | Tailwind CSS, Framer Motion |
| Gráficos | Recharts |
| Estado | Zustand |
| Validação | Zod, React Hook Form |
| Backend | Express.js, TypeScript |
| Banco de Dados | PostgreSQL + Prisma |
| Cache | Redis |
| Real-time | Socket.IO |
| Streaming | HLS.js, M3U8 |
| Auth | JWT + Refresh Token |
| Deploy | Docker, Nginx |

---

## ⚡ Início Rápido

### Pré-requisitos
- Node.js 20+
- Docker + Docker Compose

### 1. Clonar e instalar

```bash
# Instalar dependências frontend
npm install --legacy-peer-deps

# Instalar dependências backend
cd backend && npm install
```

### 2. Configurar variáveis de ambiente

```bash
cp .env.example .env
# Edite o arquivo .env com suas configurações
```

### 3. Executar com Docker

```bash
docker-compose up -d
```

Ou executar manualmente:

```bash
# Frontend
npm run dev  # http://localhost:3000

# Backend
cd backend && npm run dev  # http://localhost:3001
```

---

## 🔐 Autenticação

### Credenciais Demo (Admin)
- **Email:** admin@livesports.com
- **Senha:** admin123

### Roles de Utilizadores
| Role | Permissões |
|------|-----------|
| `super_admin` | Acesso total |
| `admin` | Gestão de conteúdo e utilizadores |
| `moderator` | Moderação de comentários |
| `editor` | Criar e editar conteúdo |
| `user` | Visualização básica |

---

## 📡 API Endpoints

### Autenticação
```
POST   /api/auth/login          # Login
POST   /api/auth/register       # Registro
GET    /api/auth/me             # Perfil atual
POST   /api/auth/refresh        # Renovar token
POST   /api/auth/logout         # Logout
POST   /api/auth/forgot-password
```

### Lives
```
GET    /api/lives               # Listar todas
GET    /api/lives/live          # Ao vivo agora
GET    /api/lives/:id           # Detalhe
POST   /api/lives               # Criar (editor+)
PUT    /api/lives/:id           # Atualizar (editor+)
PATCH  /api/lives/:id/status    # Mudar status
DELETE /api/lives/:id           # Remover (admin)
```

### Utilizadores
```
GET    /api/users               # Listar (admin)
GET    /api/users/:id           # Detalhe
PUT    /api/users/:id           # Atualizar (admin)
PATCH  /api/users/:id/status    # Status (admin)
DELETE /api/users/:id           # Remover (admin)
```

### Ads
```
GET    /api/ads                 # Listar
POST   /api/ads                 # Criar (admin)
PUT    /api/ads/:id             # Atualizar (admin)
DELETE /api/ads/:id             # Remover (admin)
```

### Dashboard
```
GET    /api/dashboard/stats
GET    /api/dashboard/charts/views
GET    /api/dashboard/charts/devices
```

---

## 🗄️ Banco de Dados

### Tabelas Principais
- `users` - Utilizadores e autenticação
- `refresh_tokens` - Tokens de sessão
- `lives` - Transmissões ao vivo
- `events` - Eventos futuros
- `categories` - Categorias de desportos
- `ads` - Anúncios publicitários
- `news_articles` - Notícias e artigos
- `plans` - Planos de subscrição
- `subscriptions` - Subscrições de utilizadores
- `notifications` - Notificações
- `banners` - Banners promocionais
- `audit_logs` - Logs de auditoria

---

## 🎨 Design System

| Token | Valor |
|-------|-------|
| Fundo | `#0A0A0A` |
| Primário (vermelho) | `#E50914` |
| Vermelho escuro | `#B00000` |
| Card/Superfície | `#1A1A1A` |
| Borda | `#2A2A2A` |
| Texto muted | `#9CA3AF` |

---

## 🔒 Segurança

- JWT com refresh token rotation
- Rate limiting (100 req/15min, 10 login/15min)
- Helmet.js para headers de segurança
- CORS configurado
- Validação de entrada com Zod
- Senhas com bcrypt (cost 12)
- Proteção XSS via React
- Audit logs para ações críticas

---

## 📊 Funcionalidades do Admin

1. **Dashboard** - KPIs, gráficos de visualizações, dispositivos, anúncios
2. **Lives** - CRUD completo com filtros por status e desporto
3. **Eventos** - Gestão de eventos futuros
4. **Notícias** - CMS básico para artigos
5. **Utilizadores** - Gestão com bulk actions, filtros
6. **Ads Manager** - Sistema de publicidade com métricas
7. **Configurações** - Configurações gerais e de segurança

---

## 🚀 Deploy

### Cloudflare Pages (Frontend)
```bash
npm run build
# Fazer deploy da pasta .next
```

### Vercel (Frontend)
```bash
vercel deploy
```

### VPS/AWS (Backend + DB)
```bash
docker-compose up -d
```

---

## 📝 Licença

MIT License - Livre para uso comercial e pessoal.

---

*Desenvolvido com ❤️ para os amantes do desporto*
# livesports
