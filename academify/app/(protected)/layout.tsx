import Sidebar from "@/components/sidebar";
import Topbar from "@/components/topbar";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const mod = await import("@/lib/auth");
	const auth = await mod.getAuth();
  const session = await auth.api.getSession({ headers: await headers() });

      if (!session) {
    console.log("[LAYOUT] No session found, redirecting to /login");
    redirect("/login");
  }

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