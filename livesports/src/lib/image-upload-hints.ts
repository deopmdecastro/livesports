export interface ImageSizeHint {
  width: number;
  height: number;
  formats?: string[];
  ratio?: string;
  maxSizeKB?: number;
  notes?: string;
}

export const IMAGE_SIZE_PRESETS = {
  competitionLogo: {
    width: 400,
    height: 400,
    formats: ["PNG", "SVG", "WebP"],
    ratio: "1:1",
    maxSizeKB: 200,
    notes: "Logotipo com fundo transparente, se possível.",
  },
  competitionBanner: {
    width: 1920,
    height: 640,
    formats: ["JPG", "WebP", "PNG"],
    ratio: "3:1",
    maxSizeKB: 400,
    notes: "Imagem larga para o topo da página da competição.",
  },
  eventThumbnail: {
    width: 1280,
    height: 720,
    formats: ["JPG", "WebP", "PNG"],
    ratio: "16:9",
    maxSizeKB: 300,
    notes: "Capa ou miniatura do evento/jogo.",
  },
  teamLogo: {
    width: 256,
    height: 256,
    formats: ["PNG", "SVG", "WebP"],
    ratio: "1:1",
    maxSizeKB: 200,
    notes: "Escudo ou bandeira da equipa.",
  },
  leagueLogo: {
    width: 512,
    height: 512,
    formats: ["PNG", "SVG", "WebP"],
    ratio: "1:1",
    maxSizeKB: 200,
    notes: "Logotipo da liga ou competição.",
  },
  liveThumbnail: {
    width: 1280,
    height: 720,
    formats: ["JPG", "WebP", "PNG"],
    ratio: "16:9",
    maxSizeKB: 300,
    notes: "Capa da transmissão ao vivo.",
  },
  adBanner: {
    width: 1100,
    height: 90,
    formats: ["JPG", "PNG", "WebP", "GIF"],
    ratio: "~12:1",
    maxSizeKB: 150,
  },
  newsThumbnail: {
    width: 1200,
    height: 675,
    formats: ["JPG", "WebP", "PNG"],
    ratio: "16:9",
    maxSizeKB: 300,
    notes: "Imagem de destaque da notícia.",
  },
  siteBanner: {
    width: 1920,
    height: 840,
    formats: ["JPG", "WebP", "PNG"],
    ratio: "16:7",
    maxSizeKB: 400,
    notes: "Banner largo para posições hero ou sidebar.",
  },
} as const satisfies Record<string, ImageSizeHint>;

export function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  return `${(bytes / 1024).toFixed(0)} KB`;
}

export function formatSizeHint(hint: ImageSizeHint) {
  const formats = hint.formats?.join(", ") || "JPG, PNG, WebP";
  const ratio = hint.ratio ? ` · ${hint.ratio}` : "";
  const maxSize = hint.maxSizeKB ? ` · máx. ${hint.maxSizeKB} KB` : "";
  return `${hint.width}×${hint.height}px · ${formats}${ratio}${maxSize}`;
}

export function validateImageFileSize(file: File, hint: ImageSizeHint) {
  if (!hint.maxSizeKB) return { valid: true as const };

  const maxBytes = hint.maxSizeKB * 1024;
  if (file.size > maxBytes) {
    return {
      valid: false as const,
      error: `Ficheiro muito grande: ${formatFileSize(file.size)}. Máximo: ${hint.maxSizeKB} KB`,
    };
  }

  return { valid: true as const };
}

export function checkImageDimensions(
  width: number,
  height: number,
  hint: ImageSizeHint,
  tolerance = 0.15
) {
  const targetRatio = hint.width / hint.height;
  const actualRatio = width / height;
  const ratioDiff = Math.abs(targetRatio - actualRatio) / targetRatio;

  const widthOk = width >= hint.width * (1 - tolerance);
  const heightOk = height >= hint.height * (1 - tolerance);
  const ratioOk = ratioDiff <= tolerance;

  return {
    ok: widthOk && heightOk && ratioOk,
    widthOk,
    heightOk,
    ratioOk,
  };
}
