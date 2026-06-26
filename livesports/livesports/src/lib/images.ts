/**
 * Image utilities for LiveSports platform
 *
 * Size recommendations:
 * ┌─────────────────┬──────────────┬────────────┬──────────┐
 * │ Type            │ Dimensions   │ Format     │ Max Size │
 * ├─────────────────┼──────────────┼────────────┼──────────┤
 * │ Avatar          │ 512×512 px   │ WebP/JPEG  │ 200 KB   │
 * │ Shield/Escudo   │ 512×512 px   │ SVG/WebP   │ 200 KB   │
 * │ League Logo     │ 512×512 px   │ SVG/WebP   │ 200 KB   │
 * │ Country Flag    │ 320×240 px   │ SVG/WebP   │ 50 KB    │
 * │ Main Banner     │ 1920×600 px  │ WebP/JPEG  │ 400 KB   │
 * │ News Image      │ 1280×720 px  │ WebP/JPEG  │ 300 KB   │
 * │ Live Thumbnail  │ 1280×720 px  │ WebP/JPEG  │ 300 KB   │
 * │ Sponsor Logo    │ 400×200 px   │ SVG/WebP   │ 100 KB   │
 * └─────────────────┴──────────────┴────────────┴──────────┘
 */

// ─── Size Constants ────────────────────────────────────────────────────────────

export const IMAGE_SIZES = {
  avatar: { width: 512, height: 512, maxSizeKB: 200 },
  shield: { width: 512, height: 512, maxSizeKB: 200 },
  leagueLogo: { width: 512, height: 512, maxSizeKB: 200 },
  flag: { width: 320, height: 240, maxSizeKB: 50 },
  banner: { width: 1920, height: 600, maxSizeKB: 400 },
  news: { width: 1280, height: 720, maxSizeKB: 300 },
  thumbnail: { width: 1280, height: 720, maxSizeKB: 300 },
  sponsorLogo: { width: 400, height: 200, maxSizeKB: 100 },
} as const;

export type ImageType = keyof typeof IMAGE_SIZES;

// ─── Accepted MIME types ───────────────────────────────────────────────────────

export const ACCEPTED_IMAGE_TYPES = {
  vector: ['image/svg+xml'],
  raster: ['image/webp', 'image/jpeg', 'image/jpg', 'image/png'],
  all: ['image/svg+xml', 'image/webp', 'image/jpeg', 'image/jpg', 'image/png', 'image/gif'],
} as const;

// ─── URL Helpers ───────────────────────────────────────────────────────────────

/**
 * Returns true if the URL is an actual loadable image URL (http/https, data:, blob:, or root-relative).
 */
export function isValidImageUrl(url?: string | null): boolean {
  if (!url) return false;
  return /^(https?:|data:|blob:|\/(?!\/))/.test(url);
}

/**
 * Returns a fallback image URL for a given type when no image is provided.
 */
export function getFallbackImage(type: ImageType): string {
  const fallbacks: Record<ImageType, string> = {
    avatar: '/images/fallback/avatar.svg',
    shield: '/images/fallback/shield.svg',
    leagueLogo: '/images/fallback/league.svg',
    flag: '/images/fallback/flag.svg',
    banner: '/images/fallback/banner.svg',
    news: '/images/fallback/news.svg',
    thumbnail: '/images/fallback/thumbnail.svg',
    sponsorLogo: '/images/fallback/sponsor.svg',
  };
  return fallbacks[type];
}

/**
 * Resolves image URL with fallback. Returns the image URL or a fallback.
 */
export function resolveImage(url?: string | null, type: ImageType = 'shield'): string {
  return isValidImageUrl(url) ? url! : getFallbackImage(type);
}

// ─── Validation helpers ────────────────────────────────────────────────────────

export interface ImageValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Client-side image file validation (size + type).
 */
export function validateImageFile(
  file: File,
  type: ImageType,
  acceptVector = false,
): ImageValidationResult {
  const errors: string[] = [];
  const spec = IMAGE_SIZES[type];
  const maxBytes = spec.maxSizeKB * 1024;
  const accepted = [
    ...ACCEPTED_IMAGE_TYPES.raster,
    ...(acceptVector ? ACCEPTED_IMAGE_TYPES.vector : []),
  ];

  if (!accepted.includes(file.type as any)) {
    errors.push(
      `Formato não suportado: ${file.type}. Use: ${accepted.map((t) => t.split('/')[1]).join(', ')}`,
    );
  }

  if (file.size > maxBytes) {
    errors.push(
      `Ficheiro muito grande: ${(file.size / 1024).toFixed(0)} KB. Máximo: ${spec.maxSizeKB} KB`,
    );
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Returns image dimensions from a File (browser only).
 */
export function getImageDimensions(
  file: File,
): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Could not load image'));
    };
    img.src = url;
  });
}

/**
 * Client-side canvas resize + compress to WebP.
 * Useful before uploading to reduce bandwidth.
 *
 * @param file - Original image file
 * @param type - Target image type (determines output dimensions)
 * @param quality - WebP quality 0-1 (default 0.82)
 * @returns Compressed Blob (WebP) and its object URL
 */
export async function compressImage(
  file: File,
  type: ImageType,
  quality = 0.82,
): Promise<{ blob: Blob; url: string; width: number; height: number }> {
  const spec = IMAGE_SIZES[type];
  const targetW = spec.width;
  const targetH = spec.height;

  const dims = await getImageDimensions(file);
  const scale = Math.min(targetW / dims.width, targetH / dims.height, 1);
  const outW = Math.round(dims.width * scale);
  const outH = Math.round(dims.height * scale);

  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    canvas.width = outW;
    canvas.height = outH;
    const ctx = canvas.getContext('2d');
    if (!ctx) { reject(new Error('Canvas not supported')); return; }

    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, 0, 0, outW, outH);
      canvas.toBlob(
        (blob) => {
          if (!blob) { reject(new Error('Compression failed')); return; }
          resolve({ blob, url: URL.createObjectURL(blob), width: outW, height: outH });
        },
        'image/webp',
        quality,
      );
    };
    img.onerror = () => reject(new Error('Could not load image for compression'));
    img.src = URL.createObjectURL(file);
  });
}

// ─── Next.js Image helper ─────────────────────────────────────────────────────

/**
 * Returns width/height props for a Next.js <Image> based on type + optional multiplier.
 */
export function nextImageProps(
  type: ImageType,
  scale = 1,
): { width: number; height: number } {
  const spec = IMAGE_SIZES[type];
  return {
    width: Math.round(spec.width * scale),
    height: Math.round(spec.height * scale),
  };
}

// ─── Wikipedia / Open-source logo helpers ────────────────────────────────────

const WIKI_SVG_BASE = 'https://upload.wikimedia.org/wikipedia/commons';
const OPEN_SPORTS_API = 'https://media.api-sports.io';

export function wikiSvgUrl(path: string): string {
  return `${WIKI_SVG_BASE}/${path}`;
}

export function sportApiLogoUrl(type: 'teams' | 'leagues' | 'countries', id: number): string {
  return `${OPEN_SPORTS_API}/${type}/${id}.png`;
}
