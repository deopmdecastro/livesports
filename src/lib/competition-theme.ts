export interface CompetitionTheme {
  primary: string;
  onPrimary: string;
  glow: string;
  border: string;
  softBg: string;
  badgeBg: string;
}

const SLUG_THEME_DEFAULTS: Record<string, string> = {
  'copa-do-mundo': '#FFD700',
  'premier-league': '#3D195B',
  'fa-cup': '#BB0000',
  'efl-cup': '#00A650',
  'la-liga': '#EE8707',
  'copa-del-rey': '#C60C30',
  'supercopa-espana': '#C60C30',
  bundesliga: '#D20515',
  'dfb-pokal': '#FFCC00',
  'serie-a': '#008FD7',
  'coppa-italia': '#008FD7',
  'ligue-1': '#DAE025',
  'coupe-de-france': '#002654',
  'liga-portugal': '#00A859',
  'taca-portugal': '#00A859',
  'taca-liga': '#00A859',
  brasileirao: '#009C3B',
  'copa-brasil': '#009C3B',
  'supercopa-brasil': '#009C3B',
  'champions-league': '#0A1D56',
  'europa-league': '#FF6900',
  'conference-league': '#00BF8F',
  'uefa-super-cup': '#0A1D56',
  euro: '#003399',
  'nations-league': '#003399',
  eredivisie: '#FF6600',
  'liga-belgica': '#1A1A6E',
  'super-lig': '#E30613',
  'scottish-premiership': '#003DA5',
};

function normalizeHex(color?: string | null): string | null {
  if (!color) return null;
  const trimmed = color.trim();
  if (!/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(trimmed)) return null;
  if (trimmed.length === 4) {
    return `#${trimmed[1]}${trimmed[1]}${trimmed[2]}${trimmed[2]}${trimmed[3]}${trimmed[3]}`.toUpperCase();
  }
  return trimmed.toUpperCase();
}

function hexToRgb(hex: string) {
  const value = hex.replace('#', '');
  return {
    r: parseInt(value.slice(0, 2), 16),
    g: parseInt(value.slice(2, 4), 16),
    b: parseInt(value.slice(4, 6), 16),
  };
}

function withAlpha(hex: string, alpha: number) {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function isLightColor(hex: string) {
  const { r, g, b } = hexToRgb(hex);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.62;
}

export function getCompetitionTheme(competition?: {
  themeColor?: string | null;
  slug?: string | null;
} | null): CompetitionTheme {
  const primary =
    normalizeHex(competition?.themeColor) ||
    (competition?.slug ? SLUG_THEME_DEFAULTS[competition.slug] : null) ||
    '#FFD700';

  const onPrimary = isLightColor(primary) ? '#111111' : '#FFFFFF';

  return {
    primary,
    onPrimary,
    glow: withAlpha(primary, 0.18),
    border: withAlpha(primary, 0.35),
    softBg: withAlpha(primary, 0.1),
    badgeBg: withAlpha(primary, 0.14),
  };
}

export function competitionThemeStyle(competition?: {
  themeColor?: string | null;
  slug?: string | null;
} | null): Record<string, string> {
  const theme = getCompetitionTheme(competition);
  return {
    '--comp-color': theme.primary,
    '--comp-on-color': theme.onPrimary,
    '--comp-glow': theme.glow,
    '--comp-border': theme.border,
    '--comp-soft-bg': theme.softBg,
    '--comp-badge-bg': theme.badgeBg,
  } as Record<string, string>;
}

export { SLUG_THEME_DEFAULTS };
