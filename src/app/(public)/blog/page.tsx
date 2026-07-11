import type { Metadata } from "next";
import BlogClient from "@/components/blog/BlogClient";

export const metadata: Metadata = {
  title: "Blog LiveSports | Notícias, análises e bastidores do desporto",
  description:
    "Acompanhe notícias desportivas, análises, categorias por modalidade, filtros por idioma e alternância de tradução no blog LiveSports.",
};

export default function BlogPage() {
  return <BlogClient />;
}
