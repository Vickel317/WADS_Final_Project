import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyFirebaseIdToken } from "@/lib/firebase-admin";

const DEFAULT_PASSWORD = "firebase-managed";

function buildUsername(email: string, userId: string) {
  const base = email.split("@")[0]?.replace(/[^a-zA-Z0-9_]/g, "").toLowerCase() || "user";
  return `${base}_${userId.slice(0, 8)}`;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const idToken = body?.idToken as string | undefined;

    if (!idToken) {
      return NextResponse.json({ error: "idToken is required" }, { status: 400 });
    }

    const decoded = await verifyFirebaseIdToken(idToken);
    if (!decoded?.uid || !decoded.email) {
      return NextResponse.json(
        { error: "Firebase admin env is missing or token is invalid" },
        { status: 401 }
      );
    }

    await prisma.authUser.upsert({
      where: { id: decoded.uid },
      update: {
        email: decoded.email,
        name: decoded.name || decoded.email.split("@")[0] || "User",
      },
      create: {
        id: decoded.uid,
        email: decoded.email,
        name: decoded.name || decoded.email.split("@")[0] || "User",
        emailVerified: !!decoded.email_verified,
      },
    });

    const appUser = await prisma.user.findFirst({
      where: {
        OR: [{ userId: decoded.uid }, { email: decoded.email }],
      },
    });

    if (!appUser) {
      await prisma.user.create({
        data: {
          userId: decoded.uid,
          email: decoded.email,
          password: DEFAULT_PASSWORD,
          username: buildUsername(decoded.email, decoded.uid),
          name: decoded.name || decoded.email.split("@")[0] || "User",
        },
      });
    }

    return NextResponse.json({ message: "Firebase user synced" });
  } catch {
    return NextResponse.json({ error: "Failed to sync Firebase user" }, { status: 500 });
  }
}
