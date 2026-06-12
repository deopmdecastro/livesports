import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import AdSlot from "@/components/ads/AdSlot";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-[#0A0A0A]">
      <Navbar />
      <main className="flex-1 pt-16">
        <div className="px-4 pt-4 lg:px-6">
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
