import type { NextConfig } from "next";

const imageHostnames = [
  "images.unsplash.com",
  "via.placeholder.com",
  "picsum.photos",
  "i.imgur.com",
  "upload.wikimedia.org",
  "i.pravatar.cc",
  "media.api-sports.io",
  "crests.football-data.org",
  "flagsapi.com",
  "logos-world.net",
];

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    remotePatterns: imageHostnames.map((hostname) => ({
      protocol: "https",
      hostname,
    })),
  },
  turbopack: {
    root: process.cwd(),
  },
  experimental: {
    optimizePackageImports: ["lucide-react", "recharts"],
  },
};

export default nextConfig;
