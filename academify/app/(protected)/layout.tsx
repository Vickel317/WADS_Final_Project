import Sidebar from "@/components/sidebar";
import Topbar from "@/components/topbar";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/get-session";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const mod = await import("@/lib/auth");
	const auth = await mod.getAuth();
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect("/login");
  }

  const currentHeaders = await headers();
  const pathname = currentHeaders.get("x-pathname") || "";
  const profileSession = await getSession();
  const profileUser = profileSession?.user;

  const isProfileComplete = Boolean(
    profileUser?.name?.trim() &&
      profileUser?.major?.trim() &&
      profileUser?.bio?.trim()
  );
  const isProfileEditRoute = pathname.startsWith("/profile/edit");

  if (!isProfileComplete && !isProfileEditRoute) {
    redirect("/profile/edit");
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