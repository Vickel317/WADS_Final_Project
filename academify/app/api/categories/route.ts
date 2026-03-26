import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

function verifyToken(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
  const token = authHeader.substring(7);
  try {
    return jwt.verify(token, JWT_SECRET) as {
      id: string;
      email: string;
      role?: string;
    };
  } catch {
    return null;
  }
}

/**
 * @swagger
 * /api/categories:
 *   get:
 *     summary: Get all categories
 *     tags: [Categories]
 *     responses:
 *       200:
 *         description: List of categories
 *       500:
 *         description: Internal server error
 *   post:
 *     summary: Create a new category (Admin only)
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, description, slug]
 *             properties:
 *               name:
 *                 type: string
 *                 example: Technology
 *               description:
 *                 type: string
 *                 example: Discussions about tech topics
 *               slug:
 *                 type: string
 *                 example: tech
 *     responses:
 *       201:
 *         description: Category created successfully
 *       400:
 *         description: Missing required fields
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Forbidden - Admin only
 *       500:
 *         description: Internal server error
 */

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(
      {
        categories: categories.map((c) => ({
          id: c.categoryID,
          name: c.name,
          description: c.description ?? "",
          slug: c.name.toLowerCase(),
          createdAt: c.createdAt.toISOString(),
        })),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get categories error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const decoded = verifyToken(request);
    if (!decoded) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    if (decoded.role !== "admin" && decoded.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Forbidden: Admin access required" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, description, slug } = body;

    if (!name || !description || !slug) {
      return NextResponse.json(
        { error: "name, description, and slug are required" },
        { status: 400 }
      );
    }

    const exists = await prisma.category.findFirst({
      where: { name: { equals: name, mode: "insensitive" } },
    });
    if (exists) {
      return NextResponse.json(
        { error: "A category with this name already exists" },
        { status: 409 }
      );
    }

    const created = await prisma.category.create({
      data: {
        name,
        description,
      },
    });

    const newCategory = {
      id: created.categoryID,
      name,
      description,
      slug,
      createdAt: created.createdAt.toISOString(),
    };

    return NextResponse.json(
      { message: "Category created successfully", category: newCategory },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create category error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
