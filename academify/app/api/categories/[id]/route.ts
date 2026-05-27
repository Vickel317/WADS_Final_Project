import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth-session";
import { apiError } from "@/lib/api-response";
import { parseJson, parseOptionalString } from "@/lib/validation";

const slugify = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");




/**
 * @swagger
 * /api/categories/{id}:
 *   get:
 *     summary: Get a single category
 *     tags: [Categories]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Category details
 *       404:
 *         description: Category not found
 *       500:
 *         description: Internal server error
 *   put:
 *     summary: Update a category (Admin only)
 *     tags: [Categories]
 *     security:
 *       - sessionCookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               slug:
 *                 type: string
 *     responses:
 *       200:
 *         description: Category updated successfully
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Forbidden - Admin only
 *       404:
 *         description: Category not found
 *       500:
 *         description: Internal server error
 *   delete:
 *     summary: Delete a category (Admin only)
 *     tags: [Categories]
 *     security:
 *       - sessionCookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Category deleted successfully
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Forbidden - Admin only
 *       404:
 *         description: Category not found
 *       500:
 *         description: Internal server error
 */

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id  } = await params;
    const category = await prisma.forumHub.findFirst({
      where: {
        OR: [
          { forumID: id },
          { name: { equals: id, mode: "insensitive" } },
        ],
      },
    });

    if (!category) {
      return apiError(404, "Category not found", "NOT_FOUND");
    }
    return NextResponse.json(
      {
        category: {
          id: category.forumID,
          name: category.name,
          description: category.description ?? "",
          slug: slugify(category.name),
          createdAt: category.createdAt.toISOString(),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get category error:", error);
    return apiError(500, "Internal server error", "INTERNAL_ERROR");
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const decoded = await verifyToken(request);
    if (!decoded) {
      return apiError(401, "Not authenticated", "UNAUTHORIZED");
    }

    if (decoded.role !== "admin" && decoded.role !== "ADMIN") {
      return apiError(403, "Forbidden: Admin access required", "FORBIDDEN");
    }

    const { id  } = await params;
    const existing = await prisma.forumHub.findUnique({
      where: { forumID: id },
    });
    if (!existing) {
      return apiError(404, "Category not found", "NOT_FOUND");
    }

    const body = await parseJson<{
      name?: unknown;
      description?: unknown;
      slug?: unknown;
    }>(request);
    if (!body) {
      return apiError(400, "Invalid JSON", "BAD_REQUEST");
    }

    const name = parseOptionalString(body.name);
    const description = parseOptionalString(body.description);
    const slug = parseOptionalString(body.slug);
    const errors = [] as Array<{ field?: string; message: string }>;

    if (name.error) errors.push({ field: "name", message: `name ${name.error}` });
    if (description.error) {
      errors.push({ field: "description", message: `description ${description.error}` });
    }
    if (slug.error) errors.push({ field: "slug", message: `slug ${slug.error}` });

    if (errors.length) {
      return apiError(400, "Invalid request", "BAD_REQUEST", errors);
    }

    if (!name.value && !description.value && !slug.value) {
      return apiError(400, "No valid fields to update", "BAD_REQUEST");
    }

    const updated = await prisma.forumHub.update({
      where: { forumID: id },
      data: {
        ...(name.value ? { name: name.value } : {}),
        ...(description.value !== undefined ? { description: description.value } : {}),
        ...(slug.value && !name.value ? { name: slug.value.replace(/[-_]+/g, " ") } : {}),
      },
    });

    return NextResponse.json(
      {
        message: "Category updated successfully",
        category: {
          id: updated.forumID,
          name: updated.name,
          description: updated.description ?? "",
          slug: slugify(updated.name),
          createdAt: updated.createdAt.toISOString(),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Update category error:", error);
    return apiError(500, "Internal server error", "INTERNAL_ERROR");
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const decoded = await verifyToken(request);
    if (!decoded) {
      return apiError(401, "Not authenticated", "UNAUTHORIZED");
    }

    if (decoded.role !== "admin" && decoded.role !== "ADMIN") {
      return apiError(403, "Forbidden: Admin access required", "FORBIDDEN");
    }

    const { id  } = await params;
    const existing = await prisma.forumHub.findUnique({
      where: { forumID: id },
    });
    if (!existing) {
      return apiError(404, "Category not found", "NOT_FOUND");
    }

    await prisma.forumHub.delete({ where: { forumID: id } });

    return NextResponse.json(
      { message: "Category deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Delete category error:", error);
    return apiError(500, "Internal server error", "INTERNAL_ERROR");
  }
}





