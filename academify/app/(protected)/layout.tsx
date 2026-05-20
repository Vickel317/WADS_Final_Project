import Sidebar from "@/components/sidebar";
import Topbar from "@/components/topbar";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/get-session";
import { ProfileModalProvider } from "@/components/profile-modal-provider";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const sessionData = await getSession();
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") || "";

  if (!sessionData) {
    console.log("[LAYOUT] No session found, redirecting to /login");
    redirect("/login");
  }

  const { user } = sessionData;

  // Intercept for forced profile setup
  const isSetupRoute = pathname === "/setup";
  if (!user.profileSetupComplete && !isSetupRoute) {
    console.log("[LAYOUT] Profile setup incomplete, redirecting to /setup");
    redirect("/setup");
  }

  return (
    <div className="min-h-screen bg-gray-50" style={{ fontFamily: "'DM Sans', 'Segoe UI', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Serif+Display&display=swap');`}</style>
      
      {!isSetupRoute && <Sidebar />}
      {!isSetupRoute && <Topbar />}
      {!isSetupRoute && <ProfileModalProvider />}
      
      <main className={`${!isSetupRoute ? "md:ml-56 pt-16 md:pt-20" : "pt-8"} min-h-screen p-4 md:p-6 transition-all duration-300`}>
        {children}
      </main>
    </div>
  );
}