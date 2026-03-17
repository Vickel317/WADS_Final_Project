import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { getJwtSecret } from "@/lib/auth-jwt";
import {
  firebaseDeleteAccount,
  firebaseLookupByIdToken,
  firebaseUpdateProfile,
} from "@/lib/firebase-auth";

type DecodedToken = {
  id: string;
  email: string;
  role?: string;
  name?: string;
};

function verifyToken(request: NextRequest): DecodedToken | null {
  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.substring(7);

  try {
    return jwt.verify(token, getJwtSecret()) as DecodedToken;
  } catch {
    return null;
  }
}

function getProfilePayload(decoded: DecodedToken, overrides?: { name?: string }) {
  const name = overrides?.name ?? decoded.name ?? "";
  const seed = encodeURIComponent(decoded.email || decoded.id);

  return {
    id: decoded.id,
    email: decoded.email,
    name,
    role: decoded.role || "student",
    bio: "",
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`,
    createdAt: null,
    updatedAt: new Date().toISOString(),
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> | { userId: string } }
) {
  try {
    const { userId } = await Promise.resolve(params);

    // Public profile read is allowed. If the requester is the owner,
    // return token-derived identity details.
    const decoded = verifyToken(request);
    if (decoded && decoded.id === userId) {
      return NextResponse.json(getProfilePayload(decoded), { status: 200 });
    }

    // Without a database yet, return a deterministic public profile shape.
    return NextResponse.json(
      {
        id: userId,
        name: "User",
        role: "student",
        bio: "",
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(
          userId
        )}`,
        createdAt: null,
        updatedAt: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get user error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> | { userId: string } }
) {
  try {
    const decoded = verifyToken(request);
    if (!decoded) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { userId } = await Promise.resolve(params);
    const isOwnerPath = userId === decoded.id || userId === "me";
    if (!isOwnerPath) {
      return NextResponse.json(
        {
          error:
            "Forbidden: use your own userId (or 'me') in path when updating profile",
          expectedUserId: decoded.id,
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, bio, avatar, firebaseIdToken } = body as {
      name?: string;
      bio?: string;
      avatar?: string;
      firebaseIdToken?: string;
    };

    if (!firebaseIdToken) {
      return NextResponse.json(
        {
          error:
            "firebaseIdToken is required for profile updates until database integration is added",
        },
        { status: 400 }
      );
    }

    const firebaseUser = await firebaseLookupByIdToken(firebaseIdToken);
    if (!firebaseUser || firebaseUser.localId !== decoded.id) {
      return NextResponse.json(
        { error: "Invalid firebaseIdToken for this user" },
        { status: 401 }
      );
    }

    const updatedName = typeof name === "string" ? name.trim() : decoded.name || "";
    const updateResult = await firebaseUpdateProfile(firebaseIdToken, updatedName);

    return NextResponse.json(
      {
        ...getProfilePayload(decoded, { name: updatedName }),
        bio: typeof bio === "string" ? bio : "",
        avatar:
          typeof avatar === "string" && avatar.length > 0
            ? avatar
            : getProfilePayload(decoded, { name: updatedName }).avatar,
        firebaseIdToken: updateResult.idToken,
        refreshToken: updateResult.refreshToken,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Update user error:", error);
    const status =
      typeof error === "object" && error && "status" in error
        ? Number((error as { status?: number }).status)
        : 500;
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json(
      { error: message || "Internal server error" },
      { status: status || 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> | { userId: string } }
) {
  try {
    const decoded = verifyToken(request);
    if (!decoded) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { userId } = await Promise.resolve(params);
    const isOwnerPath = userId === decoded.id || userId === "me";
    if (!isOwnerPath) {
      return NextResponse.json(
        {
          error:
            "Forbidden: use your own userId (or 'me') in path when deleting account",
          expectedUserId: decoded.id,
        },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const firebaseIdTokenFromBody = (body as { firebaseIdToken?: string }).firebaseIdToken;
    const firebaseIdTokenFromHeader =
      request.headers.get("x-firebase-id-token") || undefined;
    const firebaseIdToken = firebaseIdTokenFromBody || firebaseIdTokenFromHeader;

    if (!firebaseIdToken) {
      return NextResponse.json(
        {
          error:
            "firebaseIdToken is required to delete account (send in JSON body or x-firebase-id-token header)",
        },
        { status: 400 }
      );
    }

    const firebaseUser = await firebaseLookupByIdToken(firebaseIdToken);
    if (!firebaseUser || firebaseUser.localId !== decoded.id) {
      return NextResponse.json(
        { error: "Invalid firebaseIdToken for this user" },
        { status: 401 }
      );
    }

    await firebaseDeleteAccount(firebaseIdToken);

    return NextResponse.json({ message: "Account deleted successfully" }, { status: 200 });
  } catch (error) {
    console.error("Delete user error:", error);
    const status =
      typeof error === "object" && error && "status" in error
        ? Number((error as { status?: number }).status)
        : 500;
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json(
      { error: message || "Internal server error" },
      { status: status || 500 }
    );
  }
}
