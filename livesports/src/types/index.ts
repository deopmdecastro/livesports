// ==================== USER TYPES ====================
export type UserRole = 'super_admin' | 'admin' | 'moderator' | 'editor' | 'user';
export type UserStatus = 'active' | 'suspended' | 'banned' | 'pending';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: UserRole;
  status: UserStatus;
  country?: string;
  phone?: string;
  twoFactorEnabled: boolean;
  emailVerified: boolean;
  subscriptionId?: string;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
}

export interface AuthUser extends User {
  accessToken: string;
  refreshToken: string;
}

// ==================== LIVE STREAM TYPES ====================
export type LiveStatus = 'scheduled' | 'live' | 'ended' | 'cancelled';
export type SportCategory = 'football' | 'basketball' | 'tennis' | 'ufc' | 'f1' | 'volleyball' | 'baseball' | 'other';

export interface LiveStreamServer {
  id: string;
  name: string;
  url: string;
  quality?: string;
  latency?: string;
}

export interface Live {
  id: string;
  title: string;
  description?: string;
  thumbnail?: string;
  banner?: string;
  sport: SportCategory;
  league?: string;
  leagueLogo?: string;
  teamA?: string;
  teamALogo?: string;
  teamB?: string;
  teamBLogo?: string;
  scoreA?: number;
  scoreB?: number;
  streamUrl?: string;
  hlsUrl?: string;
  m3u8Url?: string;
  streamServers?: LiveStreamServer[];
  status: LiveStatus;
  featured: boolean;
  viewerCount: number;
  totalViews: number;
  likeCount?: number;
  shareCount?: number;
  commentCount?: number;
  scheduledAt: string;
  startedAt?: string;
  endedAt?: string;
  createdAt: string;
  updatedAt: string;
  matchTime?: string;
  tags?: string[];
}

export interface LiveComment {
  id: string;
  liveId: string;
  clientId?: string;
  userName: string;
  message: string;
  admin: boolean;
  createdAt: string;
}

export interface LiveEngagement {
  totalViews: number;
  viewerCount: number;
  likeCount: number;
  shareCount: number;
  commentCount: number;
  liked: boolean;
}

// ==================== EVENT TYPES ====================
export type CompetitionStatus = 'active' | 'draft' | 'completed';
export type CompetitionFormat = 'groups' | 'league' | 'knockout';

export interface CompetitionGroupTeam {
  id: string;
  name: string;
  code: string;
  flag?: string;
  group: string;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  gf: number;
  ga: number;
  points: number;
}

export interface CompetitionGroup {
  group: string;
  teams: CompetitionGroupTeam[];
}

export interface Competition {
  id: string;
  name: string;
  slug: string;
  season?: string;
  sport?: SportCategory;
  description?: string;
  thumbnail?: string;
  banner?: string;
  startDate?: string;
  endDate?: string;
  status: CompetitionStatus;
  format?: CompetitionFormat;
  createdAt: string;
  updatedAt: string;
  heroBadge?: string;
  heroBadgeIcon?: string;
  heroTitleLine1?: string;
  heroTitleLine2?: string;
  heroDescription?: string;
  statTeams?: number;
  statGames?: number;
  statHostCountries?: number;
  statStadiums?: number;
  hostCountries?: string;
  sectionTitle?: string;
  ctaTitle?: string;
  ctaDescription?: string;
  ctaButtonText?: string;
  groupsData?: CompetitionGroup[] | null;
  themeColor?: string;
}

export interface PublicCompetitionEvent {
  id: string;
  title: string;
  teamA?: string;
  teamB?: string;
  teamACode?: string;
  teamBCode?: string;
  teamALogo?: string;
  teamBLogo?: string;
  scoreA?: number;
  scoreB?: number;
  status: Event['status'];
  scheduledAt: string;
  stage?: string | null;
  groupName?: string | null;
  venue?: string | null;
  matchTime?: string | null;
}

export interface PublicCompetitionPage {
  competition: Competition;
  events: PublicCompetitionEvent[];
  groups: CompetitionGroup[];
}

export interface PublicCompetitionSummary {
  id: string;
  name: string;
  slug: string;
  season?: string;
  format?: CompetitionFormat;
  sport?: SportCategory;
  heroBadge?: string;
  heroBadgeIcon?: string;
  hostCountries?: string;
  sectionTitle?: string;
  thumbnail?: string;
  themeColor?: string;
}

// ==================== EVENT TYPES ====================
export interface Event {
  id: string;
  title: string;
  description?: string;
  thumbnail?: string;

  sport: SportCategory;

  competitionId?: string;
  stage?: string;
  roundNumber?: number;
  groupName?: string;
  matchNumber?: number;

  league?: string;
  leagueLogo?: string;
  teamA?: string;
  teamACode?: string;
  teamALogo?: string;
  teamB?: string;
  teamBCode?: string;
  teamBLogo?: string;
  scoreA?: number;
  scoreB?: number;
  matchTime?: string;
  viewerCount?: number;
  venue?: string;
  scheduledAt: string;
  status: 'upcoming' | 'live' | 'finished' | 'cancelled';
  createdAt: string;
  updatedAt?: string;
}


// ==================== ADS TYPES ====================
export type AdPosition = 'header' | 'sidebar' | 'footer' | 'in_content' | 'player' | 'popup' | 'live_preroll';
export type AdFormat = 'banner' | 'video' | 'html' | 'script';
export type AdStatus = 'active' | 'paused' | 'expired' | 'draft';

export interface Ad {
  id: string;
  title: string;
  campaign?: string;
  position: AdPosition;
  format: AdFormat;
  content: string;
  imageUrl?: string;
  videoUrl?: string;
  clickUrl?: string;
  width?: number;
  height?: number;
  impressions: number;
  clicks: number;
  ctr: number;
  revenue: number;
  status: AdStatus;
  startDate?: string;
  endDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdCampaign {
  id: string;
  name: string;
  advertiser: string;
  budget: number;
  spent: number;
  impressions: number;
  clicks: number;
  conversions: number;
  ctr: number;
  status: AdStatus;
  startDate: string;
  endDate: string;
  ads: Ad[];
  createdAt: string;
}

// ==================== NEWS TYPES ====================
export interface NewsArticle {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  content: string;
  thumbnail?: string;
  sport?: SportCategory;
  tags?: string[];
  author: Partial<User>;
  published: boolean;
  featured: boolean;
  views: number;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
  seo?: {
    metaTitle?: string;
    metaDescription?: string;
    ogImage?: string;
  };
}

// ==================== SUBSCRIPTION TYPES ====================
export type PlanType = 'free' | 'basic' | 'premium' | 'enterprise';
export type SubscriptionStatus = 'active' | 'cancelled' | 'expired' | 'trial';

export interface Plan {
  id: string;
  name: string;
  type: PlanType;
  price: number;
  currency: string;
  interval: 'monthly' | 'yearly';
  features: string[];
  maxDevices: number;
  hdQuality: boolean;
  adsRemoved: boolean;
}

export interface Subscription {
  id: string;
  userId: string;
  planId: string;
  plan: Plan;
  status: SubscriptionStatus;
  startDate: string;
  endDate: string;
  autoRenew: boolean;
  createdAt: string;
}

// ==================== DASHBOARD TYPES ====================
export interface DashboardStats {
  totalUsers: number;
  totalUsersGrowth: number;
  livesTransmitted: number;
  livesGrowth: number;
  totalViews: number;
  viewsGrowth: number;
  adsRevenue: number;
  revenueGrowth: number;
}

export interface ViewsChartData {
  date: string;
  views: number;
  revenue: number;
}

export interface DeviceStats {
  mobile: number;
  desktop: number;
  smartTv: number;
  tablet: number;
}

// ==================== API RESPONSE TYPES ====================
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  pagination?: Pagination;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: Pagination;
}

// ==================== FORM TYPES ====================
export interface LoginForm {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterForm {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  country?: string;
  acceptTerms: boolean;
}

export interface CreateLiveForm {
  title: string;
  description?: string;
  sport: SportCategory;
  league?: string;
  leagueLogo?: string;
  teamA?: string;
  teamALogo?: string;
  teamB?: string;
  teamBLogo?: string;
  streamUrl?: string;
  hlsUrl?: string;
  m3u8Url?: string;
  streamServers?: LiveStreamServer[];
  scheduledAt: string;
  featured?: boolean;
  thumbnail?: File | string;
  banner?: File | string;
}

export interface CreateAdForm {
  title: string;
  campaign?: string;
  position: AdPosition;
  format: AdFormat;
  content: string;
  imageUrl?: string;
  videoUrl?: string;
  clickUrl?: string;
  startDate?: string;
  endDate?: string;
}

// ==================== NOTIFICATION TYPES ====================
export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'live';
  read: boolean;
  actionUrl?: string;
  createdAt: string;
}

// ==================== AUDIT LOG TYPES ====================
export interface AuditLog {
  id: string;
  userId: string;
  user: Partial<User>;
  action: string;
  resource: string;
  resourceId?: string;
  details?: Record<string, unknown>;
  ip?: string;
  userAgent?: string;
  createdAt: string;
}

// ==================== CATEGORY TYPES ====================
export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  sport: SportCategory;
  color?: string;
  livesCount: number;
  eventsCount: number;
  createdAt: string;
}

// ==================== BANNER TYPES ====================
export interface Banner {
  id: string;
  title: string;
  imageUrl: string;
  linkUrl?: string;
  position: 'hero' | 'sidebar' | 'in-content';
  active: boolean;
  startDate?: string;
  endDate?: string;
  createdAt: string;
}
