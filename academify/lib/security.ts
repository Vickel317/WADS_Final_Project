/**
 * Comprehensive Input Validation & Sanitization for all API endpoints
 * This is the single source of truth for data validation across the application
 */

// ============================================================================
// Utility Functions
// ============================================================================

function sanitizeText(value: string): string {
  return value.replace(/\0/g, "").trim();
}

function toInteger(value: unknown): number | null {
  const num = Number(value);
  return Number.isInteger(num) ? num : null;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isValidISODate(value: string): boolean {
  const date = new Date(value);
  return !Number.isNaN(date.getTime()) && value === date.toISOString();
}

// ============================================================================
// Validation Result Types
// ============================================================================

export type ValidationError = {
  ok: false;
  error: string;
};

// ============================================================================
// 1. EVENT VALIDATION
// ============================================================================

export type ValidatedEventPayload = {
  title: string;
  description: string;
  date: Date;
  duration: number;
  location: string;
  category: string;
  maxAttendees: number;
};

export function validateCreateEventPayload(
  payload: unknown
): { ok: true; data: ValidatedEventPayload } | ValidationError {
  if (!payload || typeof payload !== "object") {
    return { ok: false, error: "Invalid request body" };
  }

  const body = payload as Record<string, unknown>;
  const title = typeof body.title === "string" ? sanitizeText(body.title) : "";
  const location = typeof body.location === "string" ? sanitizeText(body.location) : "";
  const descriptionRaw =
    typeof body.description === "string" ? sanitizeText(body.description) : "";
  const categoryRaw = typeof body.category === "string" ? sanitizeText(body.category) : "General";

  if (!title || !location || !body.date) {
    return { ok: false, error: "Missing required fields: title, date, location" };
  }

  if (title.length < 3 || title.length > 120) {
    return { ok: false, error: "Title must be between 3 and 120 characters" };
  }

  if (location.length < 2 || location.length > 120) {
    return { ok: false, error: "Location must be between 2 and 120 characters" };
  }

  if (descriptionRaw.length > 500) {
    return { ok: false, error: "Description cannot exceed 500 characters" };
  }

  if (categoryRaw.length > 50) {
    return { ok: false, error: "Category cannot exceed 50 characters" };
  }

  const parsedDate = new Date(String(body.date));
  if (Number.isNaN(parsedDate.getTime())) {
    return { ok: false, error: "Date must be a valid date" };
  }

  const minDuration = 15;
  const maxDuration = 480;
  const durationCandidate = body.duration === undefined ? 60 : toInteger(body.duration);
  if (!durationCandidate || durationCandidate < minDuration || durationCandidate > maxDuration) {
    return {
      ok: false,
      error: `Duration must be an integer between ${minDuration} and ${maxDuration} minutes`,
    };
  }

  const minAttendees = 2;
  const maxAttendeesLimit = 500;
  const maxAttendeesCandidate =
    body.maxAttendees === undefined ? 30 : toInteger(body.maxAttendees);
  if (
    !maxAttendeesCandidate ||
    maxAttendeesCandidate < minAttendees ||
    maxAttendeesCandidate > maxAttendeesLimit
  ) {
    return {
      ok: false,
      error: `maxAttendees must be an integer between ${minAttendees} and ${maxAttendeesLimit}`,
    };
  }

  return {
    ok: true,
    data: {
      title,
      description: descriptionRaw,
      date: parsedDate,
      duration: durationCandidate,
      location,
      category: categoryRaw || "General",
      maxAttendees: maxAttendeesCandidate,
    },
  };
}

// ============================================================================
// 2. CATEGORY VALIDATION
// ============================================================================

export type ValidatedCategoryPayload = {
  name: string;
  description: string;
  slug: string;
};

export function validateCreateCategoryPayload(
  payload: unknown
): { ok: true; data: ValidatedCategoryPayload } | ValidationError {
  if (!isPlainObject(payload)) {
    return { ok: false, error: "Invalid request body" };
  }

  const body = payload as Record<string, unknown>;
  const name = typeof body.name === "string" ? sanitizeText(body.name) : "";
  const description = typeof body.description === "string" ? sanitizeText(body.description) : "";
  const slug = typeof body.slug === "string" ? sanitizeText(body.slug) : "";

  if (!name || !description || !slug) {
    return { ok: false, error: "name, description, and slug are required" };
  }

  if (name.length < 2 || name.length > 100) {
    return { ok: false, error: "Category name must be between 2 and 100 characters" };
  }

  if (description.length < 5 || description.length > 500) {
    return { ok: false, error: "Description must be between 5 and 500 characters" };
  }

  if (slug.length < 2 || slug.length > 50) {
    return { ok: false, error: "Slug must be between 2 and 50 characters" };
  }

  // Slug must be lowercase alphanumeric with hyphens
  if (!/^[a-z0-9-]+$/.test(slug)) {
    return { ok: false, error: "Slug must be lowercase alphanumeric with hyphens only" };
  }

  return {
    ok: true,
    data: { name, description, slug },
  };
}

export type ValidatedUpdateCategoryPayload = Partial<ValidatedCategoryPayload>;

export function validateUpdateCategoryPayload(
  payload: unknown
): { ok: true; data: ValidatedUpdateCategoryPayload } | ValidationError {
  if (!isPlainObject(payload)) {
    return { ok: false, error: "Invalid request body" };
  }

  const body = payload as Record<string, unknown>;
  const data: ValidatedUpdateCategoryPayload = {};

  if (body.name !== undefined) {
    if (typeof body.name !== "string") {
      return { ok: false, error: "name must be a string" };
    }
    const name = sanitizeText(body.name);
    if (!name) return { ok: false, error: "name cannot be empty" };
    data.name = name;
  }

  if (body.description !== undefined) {
    if (typeof body.description !== "string") {
      return { ok: false, error: "description must be a string" };
    }
    const description = sanitizeText(body.description);
    data.description = description;
  }

  if (body.slug !== undefined) {
    if (typeof body.slug !== "string") {
      return { ok: false, error: "slug must be a string" };
    }
    const slug = sanitizeText(body.slug);
    if (!slug) return { ok: false, error: "slug cannot be empty" };
    if (!/^[a-z0-9-]+$/.test(slug)) {
      return { ok: false, error: "Slug must be lowercase alphanumeric with hyphens only" };
    }
    data.slug = slug;
  }

  if (Object.keys(data).length === 0) {
    return { ok: false, error: "No valid fields to update" };
  }

  return { ok: true, data };
}

// ============================================================================
// 3. POST/THREAD VALIDATION
// ============================================================================

export type ValidatedPostPayload = {
  title: string;
  content: string;
  categoryId: string;
};

export function validateCreatePostPayload(
  payload: unknown
): { ok: true; data: ValidatedPostPayload } | ValidationError {
  if (!isPlainObject(payload)) {
    return { ok: false, error: "Invalid request body" };
  }

  const body = payload as Record<string, unknown>;
  const title = typeof body.title === "string" ? sanitizeText(body.title) : "";
  const content = typeof body.content === "string" ? sanitizeText(body.content) : "";
  const categoryId = typeof body.categoryId === "string" ? sanitizeText(body.categoryId) : "";

  if (!title || !content || !categoryId) {
    return { ok: false, error: "title, content, and categoryId are required" };
  }

  if (title.length < 5 || title.length > 200) {
    return { ok: false, error: "Title must be between 5 and 200 characters" };
  }

  if (content.length < 10 || content.length > 5000) {
    return { ok: false, error: "Content must be between 10 and 5000 characters" };
  }

  if (categoryId.length < 1 || categoryId.length > 100) {
    return { ok: false, error: "Category ID must be between 1 and 100 characters" };
  }

  return {
    ok: true,
    data: { title, content, categoryId },
  };
}

export type ValidatedUpdatePostPayload = Partial<Omit<ValidatedPostPayload, "categoryId">>;

export function validateUpdatePostPayload(
  payload: unknown
): { ok: true; data: ValidatedUpdatePostPayload } | ValidationError {
  if (!isPlainObject(payload)) {
    return { ok: false, error: "Invalid request body" };
  }

  const body = payload as Record<string, unknown>;
  const data: ValidatedUpdatePostPayload = {};

  if (body.title !== undefined) {
    if (typeof body.title !== "string") {
      return { ok: false, error: "Title must be a string" };
    }
    const title = sanitizeText(body.title);
    if (title.length < 5 || title.length > 200) {
      return { ok: false, error: "Title must be between 5 and 200 characters" };
    }
    data.title = title;
  }

  if (body.content !== undefined) {
    if (typeof body.content !== "string") {
      return { ok: false, error: "Content must be a string" };
    }
    const content = sanitizeText(body.content);
    if (content.length < 10 || content.length > 5000) {
      return { ok: false, error: "Content must be between 10 and 5000 characters" };
    }
    data.content = content;
  }

  if (Object.keys(data).length === 0) {
    return { ok: false, error: "At least one field (title or content) is required" };
  }

  return { ok: true, data };
}

// ============================================================================
// 4. COMMENT VALIDATION
// ============================================================================

export type ValidatedCommentPayload = {
  content: string;
};

export function validateCreateCommentPayload(
  payload: unknown
): { ok: true; data: ValidatedCommentPayload } | ValidationError {
  if (!isPlainObject(payload)) {
    return { ok: false, error: "Invalid request body" };
  }

  const body = payload as Record<string, unknown>;
  const content = typeof body.content === "string" ? sanitizeText(body.content) : "";

  if (!content) {
    return { ok: false, error: "Content is required" };
  }

  if (content.length < 2 || content.length > 2000) {
    return { ok: false, error: "Comment must be between 2 and 2000 characters" };
  }

  return {
    ok: true,
    data: { content },
  };
}

export function validateUpdateCommentPayload(
  payload: unknown
): { ok: true; data: ValidatedCommentPayload } | ValidationError {
  const result = validateCreateCommentPayload(payload);
  if (!result.ok) {
    return result;
  }
  return result;
}

export type ValidatedProfileUpdatePayload = {
  name?: string;
  major?: string;
  bio?: string;
};

export function validateProfileUpdatePayload(
  payload: unknown
): { ok: true; data: ValidatedProfileUpdatePayload } | ValidationError {
  if (!isPlainObject(payload)) {
    return { ok: false, error: "Invalid request body" };
  }

  const body = payload as Record<string, unknown>;
  const data: ValidatedProfileUpdatePayload = {};

  if (body.name !== undefined) {
    if (typeof body.name !== "string") return { ok: false, error: "name must be a string" };
    const name = sanitizeText(body.name);
    if (!name) return { ok: false, error: "name cannot be empty" };
    data.name = name;
  }

  if (body.major !== undefined) {
    if (typeof body.major !== "string") return { ok: false, error: "major must be a string" };
    data.major = sanitizeText(body.major);
  }

  if (body.bio !== undefined) {
    if (typeof body.bio !== "string") return { ok: false, error: "bio must be a string" };
    const bio = sanitizeText(body.bio);
    if (bio.length > 500) {
      return { ok: false, error: "bio cannot exceed 500 characters" };
    }
    data.bio = bio;
  }

  if (Object.keys(data).length === 0) {
    return { ok: false, error: "No valid fields to update" };
  }

  return { ok: true, data };
}

// ============================================================================
// 5. MESSAGE VALIDATION
// ============================================================================

export type ValidatedMessagePayload = {
  content: string;
  receiverId: string;
};

export function validateCreateMessagePayload(
  payload: unknown
): { ok: true; data: ValidatedMessagePayload } | ValidationError {
  if (!isPlainObject(payload)) {
    return { ok: false, error: "Invalid request body" };
  }

  const body = payload as Record<string, unknown>;
  const content = typeof body.content === "string" ? sanitizeText(body.content) : "";
  const receiverId = typeof body.receiverId === "string" ? sanitizeText(body.receiverId) : "";

  if (!content || !receiverId) {
    return { ok: false, error: "content and receiverId are required" };
  }

  if (content.length < 1 || content.length > 5000) {
    return { ok: false, error: "Message must be between 1 and 5000 characters" };
  }

  if (receiverId.length < 1 || receiverId.length > 100) {
    return { ok: false, error: "Receiver ID must be between 1 and 100 characters" };
  }

  return {
    ok: true,
    data: { content, receiverId },
  };
}

export type ValidatedModerationReasonPayload = {
  reason: string;
  durationDays?: number;
};

export function validateModerationReasonPayload(
  payload: unknown
): { ok: true; data: ValidatedModerationReasonPayload } | ValidationError {
  if (!isPlainObject(payload)) {
    return { ok: false, error: "Invalid request body" };
  }

  const body = payload as Record<string, unknown>;
  const reason = typeof body.reason === "string" ? sanitizeText(body.reason) : "";
  if (!reason) {
    return { ok: false, error: "Reason is required" };
  }
  if (reason.length < 5 || reason.length > 1000) {
    return { ok: false, error: "Reason must be between 5 and 1000 characters" };
  }

  const result: ValidatedModerationReasonPayload = { reason };
  if (body.durationDays !== undefined) {
    const durationDays = toInteger(body.durationDays);
    if (durationDays === null || durationDays < 1 || durationDays > 3650) {
      return { ok: false, error: "durationDays must be an integer between 1 and 3650" };
    }
    result.durationDays = durationDays;
  }

  return { ok: true, data: result };
}

export type ValidatedEventUpdatePayload = {
  title?: string;
  description?: string;
  date?: Date;
  duration?: number;
  location?: string;
  category?: string;
  maxAttendees?: number;
  status?: string;
};

export function validateUpdateEventPayload(
  payload: unknown
): { ok: true; data: ValidatedEventUpdatePayload } | ValidationError {
  if (!isPlainObject(payload)) {
    return { ok: false, error: "Invalid request body" };
  }

  const body = payload as Record<string, unknown>;
  const data: ValidatedEventUpdatePayload = {};

  if (body.title !== undefined) {
    if (typeof body.title !== "string") return { ok: false, error: "title must be a string" };
    const title = sanitizeText(body.title);
    if (title.length < 3 || title.length > 120) {
      return { ok: false, error: "Title must be between 3 and 120 characters" };
    }
    data.title = title;
  }

  if (body.description !== undefined) {
    if (typeof body.description !== "string") {
      return { ok: false, error: "description must be a string" };
    }
    data.description = sanitizeText(body.description);
  }

  if (body.date !== undefined) {
    const parsedDate = new Date(String(body.date));
    if (Number.isNaN(parsedDate.getTime())) {
      return { ok: false, error: "Date must be a valid date" };
    }
    data.date = parsedDate;
  }

  if (body.duration !== undefined) {
    const duration = toInteger(body.duration);
    if (duration === null || duration < 15 || duration > 480) {
      return { ok: false, error: "Duration must be an integer between 15 and 480 minutes" };
    }
    data.duration = duration;
  }

  if (body.location !== undefined) {
    if (typeof body.location !== "string") {
      return { ok: false, error: "location must be a string" };
    }
    const location = sanitizeText(body.location);
    if (location.length < 2 || location.length > 120) {
      return { ok: false, error: "Location must be between 2 and 120 characters" };
    }
    data.location = location;
  }

  if (body.category !== undefined) {
    if (typeof body.category !== "string") {
      return { ok: false, error: "category must be a string" };
    }
    const category = sanitizeText(body.category);
    if (category.length > 50) {
      return { ok: false, error: "Category cannot exceed 50 characters" };
    }
    data.category = category;
  }

  if (body.maxAttendees !== undefined) {
    const maxAttendees = toInteger(body.maxAttendees);
    if (maxAttendees === null || maxAttendees < 2 || maxAttendees > 500) {
      return {
        ok: false,
        error: "maxAttendees must be an integer between 2 and 500",
      };
    }
    data.maxAttendees = maxAttendees;
  }

  if (body.status !== undefined) {
    if (typeof body.status !== "string") {
      return { ok: false, error: "status must be a string" };
    }
    data.status = sanitizeText(body.status);
  }

  if (Object.keys(data).length === 0) {
    return { ok: false, error: "No valid fields to update" };
  }

  return { ok: true, data };
}

// ============================================================================
// 6. REPORT VALIDATION
// ============================================================================

export type ValidatedReportPayload = {
  targetType: "post" | "comment" | "user";
  targetId: string;
  reason: string;
};

export function validateCreateReportPayload(
  payload: unknown
): { ok: true; data: ValidatedReportPayload } | ValidationError {
  if (!isPlainObject(payload)) {
    return { ok: false, error: "Invalid request body" };
  }

  const body = payload as Record<string, unknown>;
  const targetType = body.targetType as string | undefined;
  const targetId = typeof body.targetId === "string" ? sanitizeText(body.targetId) : "";
  const reason = typeof body.reason === "string" ? sanitizeText(body.reason) : "";

  if (!targetType || !targetId || !reason) {
    return { ok: false, error: "targetType, targetId, and reason are required" };
  }

  const validTargetTypes: Array<"post" | "comment" | "user"> = ["post", "comment", "user"];
  if (!validTargetTypes.includes(targetType as any)) {
    return { ok: false, error: "targetType must be 'post', 'comment', or 'user'" };
  }

  if (targetId.length < 1 || targetId.length > 100) {
    return { ok: false, error: "Target ID must be between 1 and 100 characters" };
  }

  if (reason.length < 5 || reason.length > 1000) {
    return { ok: false, error: "Reason must be between 5 and 1000 characters" };
  }

  return {
    ok: true,
    data: {
      targetType: targetType as "post" | "comment" | "user",
      targetId,
      reason,
    },
  };
}

export type ValidatedReportActionPayload = {
  action: "resolve" | "dismiss";
  note?: string;
};

export function validateReportActionPayload(
  payload: unknown
): { ok: true; data: ValidatedReportActionPayload } | ValidationError {
  if (!isPlainObject(payload)) {
    return { ok: false, error: "Invalid request body" };
  }

  const body = payload as Record<string, unknown>;
  const action = typeof body.action === "string" ? sanitizeText(body.action) : "";
  if (!action || !["resolve", "dismiss"].includes(action)) {
    return { ok: false, error: "action must be 'resolve' or 'dismiss'" };
  }

  const note = typeof body.note === "string" ? sanitizeText(body.note) : undefined;
  if (note !== undefined && note.length > 1000) {
    return { ok: false, error: "note cannot exceed 1000 characters" };
  }

  return { ok: true, data: { action: action as "resolve" | "dismiss", note } };
}

export function validateReviewReportPayload(
  payload: unknown
): { ok: true; data: { reviewNote?: string } } | ValidationError {
  if (!isPlainObject(payload)) {
    return { ok: true, data: {} };
  }

  const body = payload as Record<string, unknown>;
  if (body.reviewNote === undefined) {
    return { ok: true, data: {} };
  }

  if (typeof body.reviewNote !== "string") {
    return { ok: false, error: "reviewNote must be a string" };
  }

  const reviewNote = sanitizeText(body.reviewNote);
  if (reviewNote.length > 1000) {
    return { ok: false, error: "reviewNote cannot exceed 1000 characters" };
  }

  return { ok: true, data: { reviewNote } };
}

export function validateFirebaseSyncPayload(
  payload: unknown
): { ok: true; data: { idToken: string } } | ValidationError {
  if (!isPlainObject(payload)) {
    return { ok: false, error: "Invalid request body" };
  }

  const body = payload as Record<string, unknown>;
  const idToken = typeof body.idToken === "string" ? sanitizeText(body.idToken) : "";
  if (!idToken) {
    return { ok: false, error: "idToken is required" };
  }

  return { ok: true, data: { idToken } };
}

export function validateRoleUpdatePayload(
  payload: unknown,
  allowedRoles: string[]
): { ok: true; data: { role: string } } | ValidationError {
  if (!isPlainObject(payload)) {
    return { ok: false, error: "Invalid request body" };
  }

  const body = payload as Record<string, unknown>;
  const role = typeof body.role === "string" ? sanitizeText(body.role).toLowerCase() : "";
  if (!role || !allowedRoles.includes(role)) {
    return {
      ok: false,
      error: `Role must be one of: ${allowedRoles.join(", ")}`,
    };
  }

  return { ok: true, data: { role } };
}

// ============================================================================
// 7. FILE UPLOAD VALIDATION
// ============================================================================

export type ValidatedFilePayload = {
  filename: string;
  mimetype: string;
  size: number;
};

export function validateFileUpload(
  filename: unknown,
  mimetype: unknown,
  size: unknown
): { ok: true; data: ValidatedFilePayload } | ValidationError {
  const filenameStr = typeof filename === "string" ? sanitizeText(filename) : "";
  const mimetypeStr = typeof mimetype === "string" ? sanitizeText(mimetype) : "";
  const sizeNum = typeof size === "number" ? size : -1;

  if (!filenameStr || !mimetypeStr || sizeNum < 0) {
    return { ok: false, error: "filename, mimetype, and size are required" };
  }

  if (filenameStr.length < 1 || filenameStr.length > 255) {
    return { ok: false, error: "Filename must be between 1 and 255 characters" };
  }

  // Prevent path traversal
  if (filenameStr.includes("../") || filenameStr.includes("..\\")) {
    return { ok: false, error: "Filename cannot contain path traversal sequences" };
  }

  // Max 50MB
  const MAX_FILE_SIZE = 50 * 1024 * 1024;
  if (sizeNum > MAX_FILE_SIZE) {
    return { ok: false, error: "File size cannot exceed 50MB" };
  }

  // Whitelist allowed MIME types
  const allowedMimes = [
    "application/pdf",
    "image/png",
    "image/jpeg",
    "image/gif",
    "image/webp",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/zip",
  ];

  if (!allowedMimes.includes(mimetypeStr)) {
    return {
      ok: false,
      error: `MIME type '${mimetypeStr}' is not allowed. Allowed types: PDF, images, Office documents, ZIP`,
    };
  }

  return {
    ok: true,
    data: {
      filename: filenameStr,
      mimetype: mimetypeStr,
      size: sizeNum,
    },
  };
}

// ============================================================================
// 8. USER ROLE VALIDATION (for admin endpoints)
// ============================================================================

export function validateUserRole(
  role: unknown,
  requiredRole: "admin" | "moderator"
): { ok: true } | ValidationError {
  const roleStr = typeof role === "string" ? role.toLowerCase().trim() : "";

  if (requiredRole === "admin" && roleStr !== "admin") {
    return { ok: false, error: "Admin access required" };
  }

  if (requiredRole === "moderator" && !["admin", "moderator"].includes(roleStr)) {
    return { ok: false, error: "Moderator or Admin access required" };
  }

  return { ok: true };
}

// Export a version map for debugging
export const ValidatorMap = {
  events: "validateCreateEventPayload",
  categories: "validateCreateCategoryPayload",
  posts: "validateCreatePostPayload",
  comments: "validateCreateCommentPayload",
  messages: "validateCreateMessagePayload",
  reports: "validateCreateReportPayload",
  files: "validateFileUpload",
  roles: "validateUserRole",
} as const;
