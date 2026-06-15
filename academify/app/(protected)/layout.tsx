import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/get-session";
import { ProtectedShell } from "@/components/protected-shell";
import { CurrentUserProvider } from "@/components/current-user-context";
import { resolveAvatarUrl } from "@/lib/avatar-url";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const sessionData = await getSession();
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") || "";

  if (!sessionData) {
    console.log("[LAYOUT] No session found, redirecting to /login");
    redirect("/login");
  }

  const { user } = sessionData;
  const currentUser = {
    userId: user.userId,
    name: user.name,
    avatarUrl: resolveAvatarUrl(user.userId, user.avatarUrl),
    role: user.role.toLowerCase(),
  };

  // Intercept for forced profile setup
  const isSetupRoute = pathname === "/setup";
  if (!user.profileSetupComplete && !isSetupRoute) {
    console.log("[LAYOUT] Profile setup incomplete, redirecting to /setup");
    redirect("/setup");
  }

  return (
    <div className="min-h-screen bg-gray-50" style={{ fontFamily: "'DM Sans', 'Segoe UI', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Serif+Display&display=swap');`}</style>

      <CurrentUserProvider user={currentUser}>
        {!isSetupRoute ? (
          <ProtectedShell>{children}</ProtectedShell>
        ) : (
          <main className="min-h-screen pt-8 p-4 md:p-6">{children}</main>
        )}
      </CurrentUserProvider>
    </div>
  );
}
