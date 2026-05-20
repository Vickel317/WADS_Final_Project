import type { NextRequest } from "next/server";

export async function parseJson<T>(request: NextRequest): Promise<T | null> {
  try {
    return (await request.json()) as T;
  } catch {
    return null;
  }
}

export function parseRequiredString(value: unknown) {
  if (typeof value !== "string") {
    return { value: undefined, error: "must be a string" };
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return { value: undefined, error: "is required" };
  }
  return { value: trimmed, error: null };
}

export function parseOptionalString(value: unknown) {
  if (value === undefined || value === null) {
    return { value: undefined, error: null };
  }
  if (typeof value !== "string") {
    return { value: undefined, error: "must be a string" };
  }
  return { value: value.trim(), error: null };
}

export function parseOptionalNumber(value: unknown) {
  if (value === undefined || value === null) {
    return { value: undefined, error: null };
  }
  const num = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(num)) {
    return { value: undefined, error: "must be a number" };
  }
  return { value: num, error: null };
}

export function parseRequiredDate(value: unknown) {
  if (value === undefined || value === null) {
    return { value: undefined, error: "is required" };
  }
  if (typeof value !== "string" && !(value instanceof Date)) {
    return { value: undefined, error: "must be a valid date" };
  }
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return { value: undefined, error: "must be a valid date" };
  }
  return { value: date, error: null };
}

export function parseOptionalDate(value: unknown) {
  if (value === undefined || value === null) {
    return { value: undefined, error: null };
  }
  if (typeof value !== "string" && !(value instanceof Date)) {
    return { value: undefined, error: "must be a valid date" };
  }
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return { value: undefined, error: "must be a valid date" };
  }
  return { value: date, error: null };
}

// ---------------------------------------------------------------------------
// File upload validation
// ---------------------------------------------------------------------------

const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50 MB

const ALLOWED_MIME_TYPES = new Set([
  // Documents
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "text/plain",
  // Images
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/svg+xml",
  // Archives
  "application/zip",
  "application/x-zip-compressed",
  "application/gzip",
  // Code / data
  "application/json",
  "text/csv",
]);

export type ValidatedFileUpload = {
  objectKey: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  spaceId?: string;
};

export function validateFileUpload(body: unknown):
  | { ok: true; data: ValidatedFileUpload }
  | { ok: false; error: string } {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { ok: false, error: "Request body must be a JSON object" };
  }

  const b = body as Record<string, unknown>;

  if (typeof b.objectKey !== "string" || !b.objectKey.trim()) {
    return { ok: false, error: "objectKey is required" };
  }
  if (typeof b.fileName !== "string" || !b.fileName.trim()) {
    return { ok: false, error: "fileName is required" };
  }

  const fileType =
    typeof b.fileType === "string" && b.fileType.trim()
      ? b.fileType.trim()
      : "application/octet-stream";

  const fileSize = typeof b.fileSize === "number" ? b.fileSize : Number(b.fileSize ?? 0);

  if (!Number.isFinite(fileSize) || fileSize < 0) {
    return { ok: false, error: "fileSize must be a non-negative number" };
  }
  if (fileSize > MAX_FILE_SIZE_BYTES) {
    return { ok: false, error: `File exceeds the 50 MB limit` };
  }
  if (!ALLOWED_MIME_TYPES.has(fileType)) {
    return { ok: false, error: `File type "${fileType}" is not allowed` };
  }

  const spaceId =
    typeof b.spaceId === "string" && b.spaceId.trim() ? b.spaceId.trim() : undefined;

  return {
    ok: true,
    data: {
      objectKey: b.objectKey.trim(),
      fileName: b.fileName.trim(),
      fileType,
      fileSize,
      spaceId,
    },
  };
}
