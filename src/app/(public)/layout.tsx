import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import AdSlot from "@/components/ads/AdSlot";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-[#060609]">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100] focus:rounded-lg focus:bg-[#E50914] focus:px-4 focus:py-2.5 focus:text-sm focus:font-bold focus:text-white focus:shadow-xl"
      >
        Saltar para o conteúdo
      </a>
      <Navbar />
      {/* pt-7 for ticker + pt-14 for navbar = pt-21 */}
      <main id="main-content" className="flex-1 pt-[84px]">
        <div className="px-4 pt-3 lg:px-6">
          <AdSlot position="header" />
        </div>
        {children}
        <div className="px-4 pb-8 lg:px-6">
          <AdSlot position="footer" />
        </div>
        <AdSlot position="popup" variant="popup" />
      </main>
      <Footer />
    </div>
  );
}
