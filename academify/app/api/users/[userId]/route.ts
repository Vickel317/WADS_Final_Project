import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// Mock user database
const mockUsers = [
  {
    id: "user_1",
    email: "john@example.com",
    name: "John Doe",
    role: "student",
    bio: "Computer Science student",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=john",
    createdAt: new Date("2026-01-15"),
    updatedAt: new Date("2026-03-10"),
  },
  {
    id: "user_2",
    email: "sarah@example.com",
    name: "Sarah Chen",
    role: "instructor",
    bio: "Mathematics Instructor",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=sarah",
    createdAt: new Date("2026-01-10"),
    updatedAt: new Date("2026-03-09"),
  },
];

function verifyToken(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.substring(7);
  try {
    return jwt.verify(token, JWT_SECRET) as { id: string; email: string };
  } catch {
    return null;
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params;

    const user = mockUsers.find((u) => u.id === userId);
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const { ...userWithoutPassword } = user;
    return NextResponse.json(userWithoutPassword, { status: 200 });
  } catch (error) {
    console.error("Get user error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    // Verify authentication
    const decoded = verifyToken(request);
    if (!decoded) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const { userId } = params;

    // Users can only update their own profile
    if (decoded.id !== userId) {
      return NextResponse.json(
        { error: "Forbidden: You can only update your own profile" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, bio, avatar } = body;

    const userIndex = mockUsers.findIndex((u) => u.id === userId);
    if (userIndex === -1) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Update user
    const updatedUser = {
      ...mockUsers[userIndex],
      ...(name && { name }),
      ...(bio !== undefined && { bio }),
      ...(avatar && { avatar }),
      updatedAt: new Date(),
    };

    mockUsers[userIndex] = updatedUser;

    return NextResponse.json(updatedUser, { status: 200 });
  } catch (error) {
    console.error("Update user error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    // Verify authentication
    const decoded = verifyToken(request);
    if (!decoded) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const { userId } = params;

    // Users can only delete their own account
    if (decoded.id !== userId) {
      return NextResponse.json(
        { error: "Forbidden: You can only delete your own account" },
        { status: 403 }
      );
    }

    const userIndex = mockUsers.findIndex((u) => u.id === userId);
    if (userIndex === -1) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Delete user
    mockUsers.splice(userIndex, 1);

    return NextResponse.json(
      { message: "Account deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Delete user error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
