import { UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const DEFAULT_PASSWORD = "better-auth-managed";

function buildUsername(email: string, userId: string) {
  const base = email.split("@")[0]?.replace(/[^a-zA-Z0-9_]/g, "").toLowerCase() || "user";
  return `${base}_${userId.slice(0, 8)}`;
}

async function createAppUser(sessionUser: { id: string; email: string; name?: string | null }) {
  const username = buildUsername(sessionUser.email, sessionUser.id);

  try {
    return await prisma.user.create({
      data: {
        userId: sessionUser.id,
        email: sessionUser.email,
        password: DEFAULT_PASSWORD,
        username,
        name: sessionUser.name?.trim() || sessionUser.email.split("@")[0] || "User",
        role: UserRole.STUDENT,
      },
    });
  } catch {
    const existing =
      (await prisma.user.findUnique({ where: { userId: sessionUser.id } })) ||
      (await prisma.user.findUnique({ where: { email: sessionUser.email } }));

    if (existing) {
      return existing;
    }

    throw new Error("Unable to create application user record");
  }
}

import { auth } from "@/lib/auth";

export async function getSessionUser(headers: Headers) {
  const session = await auth.api.getSession({ headers });
  if (!session?.user?.id || !session.user.email) {
    return null;
  }

  const existingUser =
    (await prisma.user.findUnique({ where: { userId: session.user.id } })) ||
    (await prisma.user.findUnique({ where: { email: session.user.email } }));

  const user = existingUser || (await createAppUser(session.user));

  return { session, user };
}

export function normalizeRole(role: string) {
  return role.toLowerCase();
}

export async function verifyToken(request: import("next/server").NextRequest) {
  const sessionUser = await getSessionUser(request.headers);
  if (!sessionUser) {
    return null;
  }

  return {
    id: sessionUser.user.userId,
    email: sessionUser.user.email,
    role: normalizeRole(sessionUser.user.role),
  };
}

export function hasRole(role: string, allowedRoles: string[]) {
  return allowedRoles.includes(normalizeRole(role));
}
