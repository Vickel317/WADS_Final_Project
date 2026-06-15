import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth-session";
import { canCreateForum } from "@/lib/forum-access";
import { prisma } from "@/lib/prisma";
import { apiError } from "@/lib/api-response";
import { parseJson, parseRequiredString } from "@/lib/validation";
import { slugify } from "@/lib/slugify";
import { generateObjectKey, getPresignedGetUrl, isMinioEnabled, putObjectBytes } from "@/lib/storage";

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
    const categories = await prisma.forumHub.findMany({
      orderBy: { createdAt: "asc" },
      include: {
        _count: { select: { members: true } },
      },
    });

    const mapped = await Promise.all(
      categories.map(async (category) => {
        let imageUrl = category.imageUrl ?? null;
        if (imageUrl && !imageUrl.startsWith("http") && !imageUrl.startsWith("data:") && !imageUrl.startsWith("/")) {
          try {
            imageUrl = await getPresignedGetUrl(imageUrl);
          } catch {
            imageUrl = category.imageUrl ?? null;
          }
        }

        return {
          id: category.forumID,
          name: category.name,
          description: category.description ?? "",
          imageUrl,
          slug: slugify(category.name),
          createdAt: category.createdAt.toISOString(),
          memberCount: category._count.members,
        };
      })
    );

    return NextResponse.json(
      {
        categories: mapped,
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

    if (!canCreateForum(sessionUser.user.role)) {
      return apiError(403, "Only lecturers and admins can create forums", "FORBIDDEN");
    }

    const contentType = request.headers.get("content-type") || "";
    const formData = contentType.includes("multipart/form-data") ? await request.formData().catch(() => null) : null;
    const jsonBody = formData ? null : await parseJson<{ name?: unknown; description?: unknown; slug?: unknown }>(request);
    const body = formData
      ? {
          name: formData.get("name"),
          description: formData.get("description"),
          slug: formData.get("slug"),
          imageFile: formData.get("imageFile"),
        }
      : jsonBody;

    if (!body) {
      return apiError(400, "Invalid request", "BAD_REQUEST");
    }

    const errors = [] as Array<{ field?: string; message: string }>;
    const name = parseRequiredString(body.name);
    const description = parseRequiredString(body.description);
    const slug = body.slug ? parseRequiredString(body.slug) : { value: slugify(String(name.value ?? "")), error: null as string | null };

    if (name.error) errors.push({ field: "name", message: `name ${name.error}` });
    if (description.error) {
      errors.push({ field: "description", message: `description ${description.error}` });
    }
    if (slug.error) errors.push({ field: "slug", message: `slug ${slug.error}` });

    if (name.value && name.value.length < 2) {
      errors.push({ field: "name", message: "name must be at least 2 characters" });
    }
    if (name.value && name.value.length > 100) {
      errors.push({ field: "name", message: "name must be 100 characters or fewer" });
    }
    if (name.value && !/^[a-zA-Z0-9\s&'-]+$/.test(name.value)) {
      errors.push({ field: "name", message: "name can only contain letters, numbers, spaces, hyphens, apostrophes, and ampersands" });
    }

    if (errors.length) {
      return apiError(400, "Invalid request", "BAD_REQUEST", errors);
    }

    const exists = await prisma.forumHub.findFirst({
      where: { name: { equals: name.value, mode: "insensitive" } },
    });
    if (exists) {
      return apiError(
        409,
        "A category with this name already exists",
        "CONFLICT"
      );
    }

    let imageUrl: string | null = null;
    const rawFile = formData?.get("imageFile") ?? null;
    if (rawFile instanceof File && rawFile.size > 0) {
      if (!rawFile.type.startsWith("image/")) {
        return apiError(400, "Forum image must be an image file", "BAD_REQUEST");
      }

      const key = generateObjectKey(rawFile.name);
      const buffer = Buffer.from(await rawFile.arrayBuffer());

      try {
        if (isMinioEnabled()) {
          await putObjectBytes(key, buffer, rawFile.type || "application/octet-stream");
          imageUrl = key;
        } else {
          imageUrl = `data:${rawFile.type || "application/octet-stream"};base64,${buffer.toString("base64")}`;
        }
      } catch (storageError) {
        console.warn("Forum image upload failed, falling back to inline image storage:", storageError);
        imageUrl = `data:${rawFile.type || "application/octet-stream"};base64,${buffer.toString("base64")}`;
      }
    }

    const created = await prisma.forumHub.create({
      data: {
        name: name.value!,
        description: description.value!,
        imageUrl,
      },
    });

    const newCategory = {
      id: created.forumID,
      name: name.value!,
      description: description.value!,
      imageUrl,
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
