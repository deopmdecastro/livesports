import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import { LangProvider } from "@/lib/lang";

// ─── Site-wide metadata ────────────────────────────────────────────────────────

export const metadata: Metadata = {
  title: {
    default: "LiveSports – Transmissoes Desportivas ao Vivo | Live Sports Streams",
    template: "%s | LiveSports",
  },
  description:
    "Assista aos melhores jogos ao vivo! Futebol, Basquete, Tenis e muito mais. Copa do Mundo 2026. Watch the best live sports — Football, Basketball, Tennis and more.",
  keywords: [
    "live sports", "streaming esportivo", "futebol ao vivo", "copa do mundo 2026",
    "world cup 2026", "basquete", "tenis", "UFC", "Formula 1", "transmissao ao vivo",
    "live football", "live stream", "watch sports online", "livesports", "ao vivo",
    "premier league", "la liga", "brasileirao", "champions league",
  ],
  authors: [{ name: "LiveSports" }],
  creator: "LiveSports",
  publisher: "LiveSports",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://livesports.com"),
  alternates: {
    canonical: "/",
    languages: {
      "pt-BR": "/",
      "en-US": "/en",
    },
  },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    alternateLocale: ["en_US"],
    url: "/",
    title: "LiveSports – Transmissoes ao Vivo",
    description: "Assista aos melhores jogos ao vivo! Copa do Mundo 2026 e muito mais.",
    siteName: "LiveSports",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "LiveSports – Transmissoes ao Vivo",
        type: "image/jpeg",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "LiveSports – Transmissoes ao Vivo",
    description: "Assista aos melhores jogos ao vivo! Copa do Mundo 2026 e muito mais.",
    images: ["/og-image.jpg"],
    creator: "@livesports",
    site: "@livesports",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon-16x16.svg",
    apple: "/favicon.svg",
  },
  manifest: "/site.webmanifest",
  category: "sports",
  // Performance hints
  other: {
    "theme-color": "#060609",
    "color-scheme": "dark",
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "black-translucent",
  },
};

// ─── JSON-LD structured data ──────────────────────────────────────────────────

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "LiveSports",
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://livesports.com",
  logo: `${process.env.NEXT_PUBLIC_SITE_URL || "https://livesports.com"}/logo.png`,
  sameAs: [],
};

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "LiveSports",
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://livesports.com",
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: `${process.env.NEXT_PUBLIC_SITE_URL || "https://livesports.com"}/search?q={search_term_string}`,
    },
    "query-input": "required name=search_term_string",
  },
};

// ─── Root Layout ──────────────────────────────────────────────────────────────

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className="dark" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />

        {/* Preconnect to external resources for performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://upload.wikimedia.org" />
        <link rel="dns-prefetch" href="https://media.api-sports.io" />
        <link rel="dns-prefetch" href="https://flagsapi.com" />

        {/* Fonts — display=swap for CLS optimisation */}
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,300;0,14..32,400;0,14..32,500;0,14..32,600;0,14..32,700;0,14..32,800;0,14..32,900&family=Rajdhani:wght@400;500;600;700&family=Barlow+Condensed:wght@400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />

        {/* JSON-LD Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
      </head>
      <body className="bg-[#060609] text-white antialiased" suppressHydrationWarning>
        <LangProvider>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: "#111118",
                color: "#FFFFFF",
                border: "1px solid #1E1E2A",
                borderRadius: "10px",
                fontSize: "14px",
              },
              success: {
                iconTheme: { primary: "#22C55E", secondary: "#FFFFFF" },
              },
              error: {
                iconTheme: { primary: "#E50914", secondary: "#FFFFFF" },
              },
            }}
          />
        </LangProvider>
      </body>
    </html>
  );
}
