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
  // Archives
  "application/zip",
  "application/x-zip-compressed",
  "application/gzip",
  // Code / data
  "application/json",
  "text/csv",
]);

const DANGEROUS_FILE_EXTENSIONS = new Set([
  "exe",
  "dll",
  "bat",
  "cmd",
  "com",
  "scr",
  "ps1",
  "vbs",
  "js",
  "jar",
  "msi",
  "lnk",
  "sh",
  "cpl",
  "svg",
  "html",
  "htm",
  "xhtml",
  "php",
  "phtml",
  "phar",
  "asp",
  "aspx",
  "jsp",
  "jspx",
]);

const EMBEDDED_SUSPICIOUS_EXTENSIONS = new Set([
  "exe",
  "dll",
  "bat",
  "cmd",
  "com",
  "scr",
  "ps1",
  "vbs",
  "js",
  "jar",
  "msi",
  "lnk",
  "sh",
  "cpl",
  "svg",
  "html",
  "htm",
  "xhtml",
  "php",
  "phtml",
  "phar",
  "asp",
  "aspx",
  "jsp",
  "jspx",
]);

const CONTROL_CHAR_PATTERN = /[\u0000-\u001f\u007f]/;

function getFileExtension(fileName: string) {
  const baseName = fileName.split(/[\\/]/).pop() ?? fileName;
  const lastDot = baseName.lastIndexOf(".");
  if (lastDot < 0 || lastDot === baseName.length - 1) return "";
  return baseName.slice(lastDot + 1).toLowerCase();
}

function hasDangerousDoubleExtension(fileName: string) {
  const parts = fileName.toLowerCase().split(".");
  if (parts.length <= 2) return false;

  return parts.slice(0, -1).some((part) => EMBEDDED_SUSPICIOUS_EXTENSIONS.has(part));
}

export function validateUploadFileName(fileName: string) {
  const trimmed = fileName.trim();
  if (!trimmed) {
    return { ok: false, error: "fileName is required" } as const;
  }

  if (trimmed.length > 255) {
    return { ok: false, error: "fileName is too long" } as const;
  }

  if (
    CONTROL_CHAR_PATTERN.test(trimmed) ||
    trimmed.includes("\\") ||
    trimmed.includes("/") ||
    trimmed.includes("..")
  ) {
    return { ok: false, error: "fileName contains invalid characters" } as const;
  }

  if (hasDangerousDoubleExtension(trimmed)) {
    return { ok: false, error: "fileName uses a dangerous extension" } as const;
  }

  const ext = getFileExtension(trimmed);
  if (DANGEROUS_FILE_EXTENSIONS.has(ext)) {
    return { ok: false, error: `File extension ".${ext}" is not allowed` } as const;
  }

  return { ok: true, value: trimmed } as const;
}

export function validateUploadObjectKey(objectKey: string) {
  const trimmed = objectKey.trim();
  if (!trimmed) {
    return { ok: false, error: "objectKey is required" } as const;
  }

  if (
    trimmed.startsWith("/") ||
    trimmed.includes("..") ||
    trimmed.includes("\\") ||
    CONTROL_CHAR_PATTERN.test(trimmed)
  ) {
    return { ok: false, error: "objectKey contains invalid characters" } as const;
  }

  return { ok: true, value: trimmed } as const;
}

export type ValidatedFileUpload = {
  objectKey: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  spaceId?: string;
};

export function validateUploadedFile(file: { name: string; type: string; size: number }) {
  const fileName = validateUploadFileName(file.name);
  if (!fileName.ok) {
    return { ok: false as const, error: fileName.error };
  }

  const fileType = file.type?.trim() || "application/octet-stream";
  if (!ALLOWED_MIME_TYPES.has(fileType)) {
    return { ok: false as const, error: `File type "${fileType}" is not allowed` };
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return { ok: false as const, error: "File exceeds the 50 MB limit" };
  }

  return {
    ok: true as const,
    value: {
      fileName: fileName.value,
      fileType,
      fileSize: file.size,
    },
  };
}

export function validateFileUpload(body: unknown):
  | { ok: true; data: ValidatedFileUpload }
  | { ok: false; error: string } {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { ok: false, error: "Request body must be a JSON object" };
  }

  const b = body as Record<string, unknown>;

  if (typeof b.objectKey !== "string") {
    return { ok: false, error: "objectKey is required" };
  }
  const objectKey = validateUploadObjectKey(b.objectKey);
  if (!objectKey.ok) {
    return { ok: false, error: objectKey.error };
  }

  if (typeof b.fileName !== "string") {
    return { ok: false, error: "fileName is required" };
  }
  const fileName = validateUploadFileName(b.fileName);
  if (!fileName.ok) {
    return { ok: false, error: fileName.error };
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
      objectKey: objectKey.value,
      fileName: fileName.value,
      fileType,
      fileSize,
      spaceId,
    },
  };
}
