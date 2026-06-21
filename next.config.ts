import type { NextConfig } from "next";

// SECURITY: next/image's optimizer fetches and proxies whatever URL is passed to
// it. A wildcard `hostname: '**'` lets anyone make this server fetch arbitrary
// HTTPS URLs (SSRF / cache-abuse risk, and Next.js has had several image-optimizer
// CVEs that compound this). We list the concrete hosts the app actually uses
// instead. If admins need to host images elsewhere, add the host here explicitly.
const ALLOWED_IMAGE_HOSTS = [
  'images.unsplash.com',
  'picsum.photos',
  'i.imgur.com',
  'upload.wikimedia.org',
  'i.pravatar.cc',
  'media.api-sports.io',
  'crests.football-data.org',
  'flagsapi.com',
  'logos-world.net',
  'peach.blender.org',
  'commondatastorage.googleapis.com',
];

const nextConfig: NextConfig = {
  output: 'standalone',
  images: {
    remotePatterns: ALLOWED_IMAGE_HOSTS.map((hostname) => ({
      protocol: 'https' as const,
      hostname,
    })),
  },
  experimental: {
    optimizePackageImports: ['lucide-react', 'recharts']
  }
};

export default nextConfig;
