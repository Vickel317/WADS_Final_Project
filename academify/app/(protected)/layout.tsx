import Sidebar from "@/components/sidebar";
import Topbar from "@/components/topbar";

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50" style={{ fontFamily: "'DM Sans', 'Segoe UI', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Serif+Display&display=swap');`}</style>
      <Sidebar />
      <Topbar />
      <main className="md:ml-56 pt-16 md:pt-20 min-h-screen p-4 md:p-6 transition-all duration-300">
        {children}
      </main>
    </div>
  );
}