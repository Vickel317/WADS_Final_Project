import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, normalizeRole } from "@/lib/auth-session";
import { prisma } from "@/lib/prisma";
import { apiError } from "@/lib/api-response";
import { parseJson, parseRequiredString } from "@/lib/validation";

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

const slugify = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

export async function GET() {
  try {
    const forums = await prisma.forumHub.findMany({
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(
      {
        categories: forums.map((forum) => ({
          id: forum.forumID,
          name: forum.name,
          description: forum.description ?? "",
          slug: slugify(forum.name),
          createdAt: forum.createdAt.toISOString(),
        })),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get categories error:", error);
    return apiError(500, "Internal server error", "INTERNAL_ERROR");
  }
}

export async function POST(request: NextRequest) {
  try {
    const sessionUser = await getSessionUser(request.headers);
    if (!sessionUser) {
      return apiError(401, "Not authenticated", "UNAUTHORIZED");
    }

    if (normalizeRole(sessionUser.user.role) !== "admin") {
      return apiError(403, "Forbidden: Admin access required", "FORBIDDEN");
    }

    const body = await parseJson<{
      name?: unknown;
      description?: unknown;
      slug?: unknown;
    }>(request);
    if (!body) {
      return apiError(400, "Invalid JSON", "BAD_REQUEST");
    }

    const errors = [] as Array<{ field?: string; message: string }>;
    const name = parseRequiredString(body.name);
    const description = parseRequiredString(body.description);
    const slug = parseRequiredString(body.slug);

    if (name.error) errors.push({ field: "name", message: `name ${name.error}` });
    if (description.error) {
      errors.push({ field: "description", message: `description ${description.error}` });
    }
    if (slug.error) errors.push({ field: "slug", message: `slug ${slug.error}` });

    if (errors.length) {
      return apiError(400, "Invalid request", "BAD_REQUEST", errors);
    }

    const exists = await prisma.forumHub.findFirst({
      where: { name: { equals: name, mode: "insensitive" } },
    });
    if (exists) {
      return apiError(
        409,
        "A category with this name already exists",
        "CONFLICT"
      );
    }

    const created = await prisma.forumHub.create({
      data: {
        name: name.value!,
        description: description.value!,
      },
    });

    const newCategory = {
      id: created.forumID,
      name: name.value!,
      description: description.value!,
      slug: slug.value!,
      createdAt: created.createdAt.toISOString(),
    };

    return NextResponse.json(
      { message: "Category created successfully", category: newCategory },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create category error:", error);
    return apiError(500, "Internal server error", "INTERNAL_ERROR");
  }
}
