import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

const DEFAULT_PASSWORD = "better-auth-managed";

function buildUsername(email: string, userId: string) {
  const base = email.split("@")[0]?.replace(/[^a-zA-Z0-9_]/g, "").toLowerCase() || "user";
  return `${base}_${userId.slice(0, 8)}`;
}

async function ensureAppUser(userId: string, email: string, name?: string | null) {
  const existing =
    (await prisma.user.findUnique({ where: { userId } })) ||
    (await prisma.user.findUnique({ where: { email } }));

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

  const betterSession = await auth.api.getSession({ headers: requestHeaders });
  if (betterSession?.user?.id && betterSession.user.email) {
    const user = await ensureAppUser(
      betterSession.user.id,
      betterSession.user.email,
      betterSession.user.name
    );

    return { provider: "better-auth" as const, session: betterSession, user };
  }

  return null;
}
