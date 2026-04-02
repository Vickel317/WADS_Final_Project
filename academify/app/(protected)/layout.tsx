import Sidebar from "@/components/sidebar";
import Topbar from "@/components/topbar";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ACCESS_TOKEN_COOKIE, verifyAccessToken } from "@/lib/auth-jwt";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const token = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value;
  const decoded = token ? verifyAccessToken(token) : null;

  if (!decoded) {
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