export type FlagStyle = "flat" | "shiny";

const FIFA_TO_ISO: Record<string, string> = {
  AFG: "AF", ALB: "AL", ALG: "DZ", AND: "AD", ANG: "AO", ARG: "AR", ARM: "AM", AUS: "AU",
  AUT: "AT", AZE: "AZ", BAH: "BS", BHR: "BH", BAN: "BD", BLR: "BY", BEL: "BE", BEN: "BJ",
  BOL: "BO", BIH: "BA", BRA: "BR", BUL: "BG", CAM: "CM", CAN: "CA", CHI: "CL", CHN: "CN",
  COL: "CO", CRC: "CR", CRO: "HR", CUB: "CU", CYP: "CY", CZE: "CZ", DEN: "DK", ECU: "EC",
  EGY: "EG", ENG: "GB", ESP: "ES", EST: "EE", FIN: "FI", FRA: "FR", GAB: "GA", GEO: "GE",
  GER: "DE", GHA: "GH", GRE: "GR", GUA: "GT", HAI: "HT", HON: "HN", HUN: "HU", ISL: "IS",
  IND: "IN", IDN: "ID", IRN: "IR", IRQ: "IQ", IRL: "IE", ISR: "IL", ITA: "IT", JAM: "JM",
  JPN: "JP", JOR: "JO", KAZ: "KZ", KEN: "KE", KOR: "KR", KUW: "KW", LAT: "LV", LBN: "LB",
  LBY: "LY", LTU: "LT", LUX: "LU", MAR: "MA", MEX: "MX", MDA: "MD", MNE: "ME", NED: "NL",
  NGA: "NG", MKD: "MK", NIR: "GB", NOR: "NO", NZL: "NZ", OMA: "OM", PAN: "PA", PAR: "PY",
  PER: "PE", POL: "PL", POR: "PT", QAT: "QA", ROU: "RO", RUS: "RU", KSA: "SA", SCO: "GB",
  SEN: "SN", SRB: "RS", SVK: "SK", SVN: "SI", RSA: "ZA", SUI: "CH", SWE: "SE", THA: "TH",
  TUN: "TN", TUR: "TR", UKR: "UA", UAE: "AE", URU: "UY", USA: "US", UZB: "UZ", VEN: "VE",
  WAL: "GB", YEM: "YE", ZAM: "ZM", ZIM: "ZW",
};

const NAME_TO_ISO: Record<string, string> = {
  brasil: "BR", brazil: "BR", argentina: "AR", portugal: "PT", espanha: "ES", spain: "ES",
  franca: "FR", france: "FR", alemanha: "DE", germany: "DE", italia: "IT", italy: "IT",
  inglaterra: "GB", england: "GB", estadosunidos: "US", unitedstates: "US",
  mexico: "MX", holanda: "NL", netherlands: "NL", belgica: "BE", belgium: "BE", croacia: "HR",
  croatia: "HR", marrocos: "MA", morocco: "MA", japao: "JP", japan: "JP", coreiadosul: "KR",
  southkorea: "KR", australia: "AU", canada: "CA", servia: "RS", serbia: "RS", gana: "GH",
  ghana: "GH", uruguai: "UY", uruguay: "UY", colombia: "CO", chile: "CL", peru: "PE",
  equador: "EC", ecuador: "EC", suica: "CH", switzerland: "CH", dinamarca: "DK", denmark: "DK",
  suecia: "SE", sweden: "SE", noruega: "NO", norway: "NO", polonia: "PL", poland: "PL",
  austria: "AT", hungria: "HU", hungary: "HU", turquia: "TR", turkey: "TR", catar: "QA",
  qatar: "QA", arabiasaudita: "SA", saudiarabia: "SA", irao: "IR", iran: "IR", costarica: "CR",
  panama: "PA", jamaica: "JM", nigeria: "NG", senegal: "SN", camarao: "CM",
  cameroon: "CM", costadomarfim: "CI", ivorycoast: "CI", tunisia: "TN",
  egito: "EG", egypt: "EG", argelia: "DZ", algeria: "DZ", paraguai: "PY", paraguay: "PY",
  bolivia: "BO", venezuela: "VE", russia: "RU", ucrania: "UA", ukraine: "UA",
  gales: "GB", wales: "GB", escocia: "GB", scotland: "GB",
};

function normalizeNameKey(name: string) {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "");
}

export function normalizeCountryCode(input?: string | null): string | null {
  if (!input?.trim()) return null;

  const raw = input.trim().toUpperCase();
  const crestMatch = raw.match(/CRESTS\.FOOTBALL-DATA\.ORG\/([A-Z]{2,3})/i);
  if (crestMatch) {
    const crestCode = crestMatch[1].toUpperCase();
    return FIFA_TO_ISO[crestCode] || (crestCode.length === 2 ? crestCode : null);
  }

  if (raw.length === 2) return raw;
  if (raw.length === 3) return FIFA_TO_ISO[raw] || null;
  return null;
}

export function countryCodeFromName(name?: string | null): string | null {
  if (!name?.trim()) return null;
  return NAME_TO_ISO[normalizeNameKey(name)] || null;
}

export function extractCountryCodeFromLogo(logo?: string | null): string | null {
  if (!logo?.trim()) return null;
  const crestMatch = logo.match(/crests\.football-data\.org\/([A-Za-z]{2,3})/i);
  if (crestMatch) return normalizeCountryCode(crestMatch[1]);
  return null;
}

function isDisplayableLogoValue(logo?: string | null): boolean {
  const value = logo?.trim();
  if (!value) return false;
  if (value.includes("flagsapi.com")) return false;
  if (value.includes("/images/fallback/")) return false;
  return /^(https?:|data:|blob:|\/)/.test(value);
}

const FLAGS_API_SIZES = [16, 24, 32, 48, 64] as const;

/** flagsapi.com only serves a fixed set of sizes; others return HTTP 500. */
export function normalizeFlagSize(size = 64): number {
  const allowed = FLAGS_API_SIZES;
  const target = Math.max(allowed[0], Math.min(size, allowed[allowed.length - 1]));
  return allowed.reduce((best, current) =>
    Math.abs(current - target) < Math.abs(best - target) ? current : best,
  );
}

export function flagsApiUrl(
  countryCode: string,
  style: FlagStyle = "shiny",
  size = 64,
): string {
  const code = normalizeCountryCode(countryCode);
  if (!code) return "";
  return `https://flagsapi.com/${code}/${style}/${normalizeFlagSize(size)}.png`;
}

export function resolveCountryFlagUrl(options: {
  code?: string | null;
  name?: string | null;
  logo?: string | null;
  style?: FlagStyle;
  size?: number;
}): string | null {
  const { code, name, logo, style = "shiny", size = 64 } = options;
  const normalizedSize = normalizeFlagSize(size);
  const logoValue = logo?.trim() || "";

  if (logoValue.includes("flagsapi.com")) {
    return logoValue.replace(
      /\/(flat|shiny)\/\d+\.png$/,
      `/${style}/${normalizedSize}.png`,
    );
  }

  if (isDisplayableLogoValue(logoValue)) {
    return logoValue;
  }

  const candidates = [
    code,
    extractCountryCodeFromLogo(logoValue),
    countryCodeFromName(name),
  ];

  for (const candidate of candidates) {
    const normalized = candidate ? normalizeCountryCode(candidate) : null;
    if (normalized) return flagsApiUrl(normalized, style, normalizedSize);
  }

  return null;
}
