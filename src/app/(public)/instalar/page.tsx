import type { Metadata } from "next";
import InstallPage from "@/components/install/InstallPage";

export const metadata: Metadata = {
  title: "Instalar a aplicação LiveSports",
  description: "Instale a aplicação web LiveSports no Android, iPhone ou iPad e acompanhe o desporto no seu telemóvel.",
  alternates: { canonical: "/instalar" },
};
export default function Page() { return <InstallPage />; }
