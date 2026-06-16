import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  images: {
    domains: [
      'images.unsplash.com',
      'via.placeholder.com',
      'picsum.photos',
      'i.imgur.com',
      'upload.wikimedia.org',
      'i.pravatar.cc',
      'media.api-sports.io',
      'crests.football-data.org',
      'logos-world.net',
    ],
    remotePatterns: [
      { protocol: 'https', hostname: '**' }
    ]
  },
  experimental: {
    optimizePackageImports: ['lucide-react', 'recharts']
  }
};

export default nextConfig;
