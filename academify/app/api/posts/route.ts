import { NextRequest, NextResponse } from "next/server";
import { ModerationStatus } from "@prisma/client";
import { getSessionUser } from "@/lib/auth-session";
import { prisma } from "@/lib/prisma";
import { apiError } from "@/lib/api-response";
import { parseJson, parseRequiredString } from "@/lib/validation";

const slugify = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

const resolveForum = async (value: string) => {
  const direct = await prisma.forumHub.findFirst({
    where: {
      OR: [
        { forumID: value },
        { name: { equals: value, mode: "insensitive" as const } },
      ],
    },
  });

  if (direct) return direct;

  const forums = await prisma.forumHub.findMany();
  return forums.find((forum: any) => slugify(forum.name) === value.toLowerCase()) ?? null;
};

const toForumName = (value: string) =>
  value
    .trim()
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((part) => `${part[0]?.toUpperCase() ?? ""}${part.slice(1)}`)
    .join(" ");

/**
 * @swagger
 * /api/posts:
 *   get:
 *     summary: Get all forum threads
 *     tags: [Forums]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: forumId
 *         schema:
 *           type: string
 *         description: Filter threads by forum ID
 *       - in: query
 *         name: forum
 *         schema:
 *           type: string
 *         description: Filter threads by forum name or slug
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of results to return
 *       - in: query
 *         name: trending
 *         schema:
 *           type: boolean
 *         description: Return trending threads
 *     responses:
 *       200:
 *         description: List of threads
 *       500:
 *         description: Internal server error
 *   post:
 *     summary: Create a new thread
 *     tags: [Forums]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, content, forumId]
 *             properties:
 *               title:
 *                 type: string
 *                 example: Best resources for learning React?
 *               content:
 *                 type: string
 *                 example: Looking for good React learning resources.
 *               forumId:
 *                 type: string
 *                 example: forum_cuid
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [title, content, forum]
 *             properties:
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *               forum:
 *                 type: string
 *                 description: Forum name or slug
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Thread created successfully
 *       400:
 *         description: Missing required fields
 *       500:
 *         description: Internal server error
 */

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get("categoryId");
    const forumId = searchParams.get("forumId");
    const category = searchParams.get("category");
    const forum = searchParams.get("forum");
    const limit = parseInt(searchParams.get("limit") || "10");
    const trending = searchParams.get("trending") === "true";

    const forumQuery = forumId || categoryId || forum || category;
    const resolvedForum = forumQuery ? await resolveForum(forumQuery) : null;

    const where = resolvedForum
      ? {
          forumID: resolvedForum.forumID,
        }
      : {};

    const result = await prisma.post.findMany({
      where,
      include: {
        author: { select: { name: true } },
        forum: { select: { forumID: true, name: true } },
        _count: { select: { comments: true } },
      },
      orderBy: trending ? { comments: { _count: 'desc' } } : { createdAt: 'desc' } as any,
      take: Number.isFinite(limit) ? limit : 10,
    });

    return NextResponse.json(
      {
        threads: result.map((post: any) => ({
          id: post.postID,
          title: post.title,
          content: post.content,
          forumId: post.forumID,
          forumName: post.forum.name,
          forumSlug: slugify(post.forum.name),
          author: post.author.name,
          replyCount: post._count.comments,
          replies: post._count.comments,
          views: 0,
          likes: 0,
          createdAt: post.createdAt.toISOString(),
          updatedAt: post.updatedAt.toISOString(),
          status: post.moderationStatus.toLowerCase(),
        })),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get threads error:", error);
    return apiError(500, "Internal server error", "INTERNAL_ERROR");
  }
}

export async function POST(request: NextRequest) {
  try {
    const sessionUser = await getSessionUser(request.headers);
    if (!sessionUser) {
      return apiError(401, "Not authenticated", "UNAUTHORIZED");
    }

    const contentType = request.headers.get("content-type") || "";
    const isMultipart = contentType.includes("multipart/form-data");

    let body: {
      title?: unknown;
      content?: unknown;
      forumId?: unknown;
      categoryId?: unknown;
      forum?: unknown;
      category?: unknown;
      file?: File | null;
    } | null = null;

    if (isMultipart) {
      const formData = await request.formData();
      body = {
        title: formData.get("title"),
        content: formData.get("content"),
        forumId: formData.get("forumId"),
        categoryId: formData.get("categoryId"),
        forum: formData.get("forum"),
        category: formData.get("category"),
        file: (formData.get("file") as File | null) ?? null,
      };
    } else {
      body = await parseJson<{
        title?: unknown;
        content?: unknown;
        forumId?: unknown;
        categoryId?: unknown;
        forum?: unknown;
        category?: unknown;
      }>(request);
    }

    if (!body) {
      return apiError(400, "Invalid JSON", "BAD_REQUEST");
    }

    const errors = [] as Array<{ field?: string; message: string }>;
    const title = parseRequiredString(body.title);
    const content = parseRequiredString(body.content);
    const forumField =
      body.forumId ?? body.categoryId ?? body.forum ?? body.category ?? "";
    const forumId = parseRequiredString(forumField);

    if (title.error) errors.push({ field: "title", message: `title ${title.error}` });
    if (content.error) {
      errors.push({ field: "content", message: `content ${content.error}` });
    }
    if (forumId.error) {
      errors.push({ field: "forumId", message: `forumId ${forumId.error}` });
    }

    if (errors.length) {
      return apiError(400, "Invalid request", "BAD_REQUEST", errors);
    }

    let forum = await resolveForum(forumId.value!);
    if (!forum) {
      forum = await prisma.forumHub.create({
        data: {
          name: toForumName(forumId.value!),
          description: "Auto-created forum",
        },
      });
    }

    const created = await prisma.post.create({
      data: {
        title: title.value!,
        content: content.value!,
        forumID: forum.forumID,
        authorID: sessionUser.user.userId,
        moderationStatus: ModerationStatus.PENDING,
      },
      include: {
        author: { select: { name: true } },
      },
    });

    const file = body.file ?? null;
    if (file && file.size > 0) {
      await prisma.file.create({
        data: {
          postID: created.postID,
          uploadedByID: sessionUser.user.userId,
          fileName: file.name,
          fileUrl: `/uploads/${file.name}`,
          fileType: file.type || "application/octet-stream",
          fileSize: file.size,
        },
      });
    }

    return NextResponse.json(
      {
        message: "Thread created successfully",
        thread: {
          id: created.postID,
          title: created.title,
          content: created.content,
          forumId: created.forumID,
          author: created.author.name,
          status: created.moderationStatus.toLowerCase(),
          createdAt: created.createdAt.toISOString(),
          updatedAt: created.updatedAt.toISOString(),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create thread error:", error);
    return apiError(500, "Internal server error", "INTERNAL_ERROR");
  }
}


