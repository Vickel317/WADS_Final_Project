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
