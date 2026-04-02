import { cookies, headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { verifyFirebaseSessionCookie } from "@/lib/firebase-admin";

const DEFAULT_PASSWORD = "better-auth-managed";

function buildUsername(email: string, userId: string) {
  const base = email.split("@")[0]?.replace(/[^a-zA-Z0-9_]/g, "").toLowerCase() || "user";
  return `${base}_${userId.slice(0, 8)}`;
}

async function ensureAppUser(userId: string, email: string, name?: string | null) {
  const existing = await prisma.user.findFirst({
    where: {
      OR: [{ userId }, { email }],
    },
  });

  if (existing) {
    return existing;
  }

  const username = buildUsername(email, userId);

  return prisma.user.create({
    data: {
      userId,
      email,
      password: DEFAULT_PASSWORD,
      username,
      name: name?.trim() || email.split("@")[0] || "User",
    },
  });
}

export async function getSession() {
  const requestHeaders = await headers();
  const cookieStore = await cookies();

  const betterSession = await auth.api.getSession({ headers: requestHeaders });
  if (betterSession?.user?.id && betterSession.user.email) {
    const user = await ensureAppUser(
      betterSession.user.id,
      betterSession.user.email,
      betterSession.user.name
    );

    return { provider: "better-auth" as const, session: betterSession, user };
  }

  const firebaseCookie = cookieStore.get("__session")?.value;
  if (!firebaseCookie) {
    return null;
  }

  const decoded = await verifyFirebaseSessionCookie(firebaseCookie);
  if (!decoded?.uid || !decoded?.email) {
    return null;
  }

  const user = await ensureAppUser(decoded.uid, decoded.email, decoded.name);

  return {
    provider: "firebase" as const,
    session: { user: { id: decoded.uid, email: decoded.email, name: decoded.name } },
    user,
  };
}
