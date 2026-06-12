import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "react-hot-toast";

export const metadata: Metadata = {
  title: {
    default: "Live Sports - Transmissões Desportivas ao Vivo",
    template: "%s | Live Sports",
  },
  description:
    "Assista aos melhores jogos ao vivo! Futebol, Basquete, Tênis e muito mais. Transmissões de alta qualidade 24h por dia.",
  keywords: [
    "live sports",
    "streaming esportivo",
    "futebol ao vivo",
    "basquete",
    "tênis",
    "UFC",
    "Fórmula 1",
    "transmissão ao vivo",
  ],
  authors: [{ name: "Live Sports" }],
  creator: "Live Sports",
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: "https://livesports.com",
    title: "Live Sports - Transmissões Desportivas ao Vivo",
    description: "Assista aos melhores jogos ao vivo!",
    siteName: "Live Sports",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Live Sports",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Live Sports - Transmissões Desportivas ao Vivo",
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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Poppins:wght@400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-[#0A0A0A] text-white antialiased">
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: "#1A1A1A",
              color: "#FFFFFF",
              border: "1px solid #2A2A2A",
            },
            success: {
              iconTheme: {
                primary: "#22C55E",
                secondary: "#FFFFFF",
              },
            },
            error: {
              iconTheme: {
                primary: "#E50914",
                secondary: "#FFFFFF",
              },
            },
          }}
        />
      </body>
    </html>
  );
}
