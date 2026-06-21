const FIFA_TO_ISO: Record<string, string> = {
  BRA: "BR", ARG: "AR", POR: "PT", ESP: "ES", FRA: "FR", GER: "DE", ENG: "GB", USA: "US",
  MEX: "MX", NED: "NL", BEL: "BE", CRO: "HR", MAR: "MA", JPN: "JP", KOR: "KR", AUS: "AU",
  CAN: "CA", SRB: "RS", GHA: "GH", URU: "UY", COL: "CO", CHI: "CL", PER: "PE", ECU: "EC",
  SUI: "CH", DEN: "DK", SWE: "SE", NOR: "NO", POL: "PL", AUT: "AT", HUN: "HU", TUR: "TR",
  QAT: "QA", KSA: "SA", IRN: "IR", CRC: "CR", PAN: "PA", JAM: "JM", NGA: "NG", SEN: "SN",
  CMR: "CM", CIV: "CI", TUN: "TN", EGY: "EG", ALG: "DZ", PAR: "PY", BOL: "BO", VEN: "VE",
  RUS: "RU", UKR: "UA", WAL: "GB", SCO: "GB",
};

export function normalizeCountryCode(input?: string | null): string | null {
  if (!input?.trim()) return null;
  const raw = input.trim().toUpperCase();
  if (raw.length === 2) return raw;
  if (raw.length === 3) return FIFA_TO_ISO[raw] || null;
  return null;
}

export function extractCountryCodeFromCrest(crest?: string | null): string | null {
  if (!crest?.trim()) return null;
  const match = crest.match(/crests\.football-data\.org\/([A-Za-z]{2,3})/i);
  if (!match) return null;
  return normalizeCountryCode(match[1]);
}

function isDisplayableLogoValue(value?: string | null): boolean {
  const logo = value?.trim();
  if (!logo) return false;
  if (logo.includes('flagsapi.com')) return false;
  return /^(https?:|data:|blob:|\/)/.test(logo);
}

const FLAGS_API_SIZES = [16, 24, 32, 48, 64] as const;

function normalizeFlagSize(size = 64): number {
  const allowed = FLAGS_API_SIZES;
  const target = Math.max(allowed[0], Math.min(size, allowed[allowed.length - 1]));
  return allowed.reduce((best, current) =>
    Math.abs(current - target) < Math.abs(best - target) ? current : best,
  );
}

export function flagsApiUrl(countryCode: string, size = 64): string {
  const code = normalizeCountryCode(countryCode);
  if (!code) return "";
  return `https://flagsapi.com/${code}/shiny/${normalizeFlagSize(size)}.png`;
}

export function resolveTeamFlagUrl(options: {
  code?: string | null;
  crestOrLogo?: string | null;
}): string | null {
  if (isDisplayableLogoValue(options.crestOrLogo)) return options.crestOrLogo!.trim();

  const fromCode = options.code ? flagsApiUrl(options.code) : null;
  if (fromCode) return fromCode;

  const crestCode = extractCountryCodeFromCrest(options.crestOrLogo);
  if (crestCode) return flagsApiUrl(crestCode);

  return null;
}
