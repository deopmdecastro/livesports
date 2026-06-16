import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import { LangProvider } from "@/lib/lang";

export const metadata: Metadata = {
  title: {
    default: "LiveSports – Transmissões Desportivas ao Vivo | Live Sports Streams",
    template: "%s | LiveSports",
  },
  description:
    "Assista aos melhores jogos ao vivo! Futebol, Basquete, Tênis e muito mais. Copa do Mundo 2026. Watch the best live sports — Football, Basketball, Tennis and more.",
  keywords: [
    "live sports", "streaming esportivo", "futebol ao vivo", "copa do mundo 2026",
    "world cup 2026", "basquete", "tênis", "UFC", "Fórmula 1", "transmissão ao vivo",
    "live football", "live stream", "watch sports online",
  ],
  authors: [{ name: "LiveSports" }],
  creator: "LiveSports",
  metadataBase: new URL("https://livesports.com"),
  openGraph: {
    type: "website",
    locale: "pt_BR",
    alternateLocale: ["en_US"],
    url: "https://livesports.com",
    title: "LiveSports – Transmissões ao Vivo",
    description: "Assista aos melhores jogos ao vivo! Copa do Mundo 2026 e muito mais.",
    siteName: "LiveSports",
    images: [{ url: "/og-image.jpg", width: 1200, height: 630, alt: "LiveSports" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "LiveSports – Transmissões ao Vivo",
    description: "Assista aos melhores jogos ao vivo!",
    images: ["/og-image.jpg"],
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
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className="dark">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,300;0,14..32,400;0,14..32,500;0,14..32,600;0,14..32,700;0,14..32,800;0,14..32,900&family=Rajdhani:wght@400;500;600;700&family=Barlow+Condensed:wght@400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-[#060609] text-white antialiased">
        <LangProvider>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
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
