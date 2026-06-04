import "@testing-library/jest-dom";
import { TextEncoder, TextDecoder } from "util";

// Intercept better-auth server-side ESM (used by lib/auth.ts → lib/get-session.ts)
jest.mock("@/lib/auth", () => ({
  auth: {
    handler: jest.fn(),
    api: {
      getSession: jest.fn().mockResolvedValue(null),
    },
  },
}));

jest.mock("@/lib/get-session", () => ({
  getSession: jest.fn().mockResolvedValue({
    user: {
      userId: "test-user-id",
      id: "test-user-id",
      name: "Test User",
      email: "test@test.com",
      role: "student",
    },
  }),
}));

// Intercept better-auth ESM and prisma before any test module can load them
jest.mock("@/lib/auth-client", () => ({
  authClient: {
    signIn: { email: jest.fn(), social: jest.fn() },
    signUp: { email: jest.fn() },
    signOut: jest.fn(),
    useSession: jest.fn(() => ({ data: null, isPending: false })),
    getSession: jest.fn().mockResolvedValue({ data: null }),
  },
}));

// Avoid MinIO env requirement when API routes import lib/storage at module load
jest.mock("@/lib/storage", () => ({
  isMinioEnabled: jest.fn(() => true),
  getPresignedPutUrl: jest.fn().mockResolvedValue("https://example.com/upload"),
  getPresignedGetUrl: jest.fn().mockResolvedValue("https://example.com/download"),
  generateObjectKey: jest.fn((name: string) => `test-key-${name}`),
  deleteObject: jest.fn().mockResolvedValue(undefined),
  default: {},
}));

jest.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: jest.fn().mockResolvedValue({ name: "Test User", userId: "test-user-id" }),
      findMany: jest.fn().mockResolvedValue([]),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn().mockResolvedValue(0),
    },
    post: { findUnique: jest.fn(), findMany: jest.fn().mockResolvedValue([]), create: jest.fn(), update: jest.fn(), delete: jest.fn(), count: jest.fn().mockResolvedValue(0) },
    comment: { findUnique: jest.fn(), findMany: jest.fn().mockResolvedValue([]), create: jest.fn(), update: jest.fn(), delete: jest.fn(), count: jest.fn().mockResolvedValue(0) },
    file: { findUnique: jest.fn(), findMany: jest.fn().mockResolvedValue([]), create: jest.fn(), update: jest.fn(), delete: jest.fn(), count: jest.fn().mockResolvedValue(0) },
    space: { findUnique: jest.fn(), findMany: jest.fn().mockResolvedValue([]), create: jest.fn(), update: jest.fn(), delete: jest.fn(), count: jest.fn().mockResolvedValue(0) },
    category: { findUnique: jest.fn(), findMany: jest.fn().mockResolvedValue([]), create: jest.fn(), update: jest.fn(), delete: jest.fn(), count: jest.fn().mockResolvedValue(0) },
    report: { findUnique: jest.fn(), findMany: jest.fn().mockResolvedValue([]), create: jest.fn(), update: jest.fn(), delete: jest.fn(), count: jest.fn().mockResolvedValue(0) },
    message: { findUnique: jest.fn(), findMany: jest.fn().mockResolvedValue([]), create: jest.fn(), update: jest.fn(), delete: jest.fn(), count: jest.fn().mockResolvedValue(0) },
    notification: { findUnique: jest.fn(), findMany: jest.fn().mockResolvedValue([]), create: jest.fn(), update: jest.fn(), delete: jest.fn(), count: jest.fn().mockResolvedValue(0) },
    event: { findUnique: jest.fn(), findMany: jest.fn().mockResolvedValue([]), create: jest.fn(), update: jest.fn(), delete: jest.fn(), count: jest.fn().mockResolvedValue(0) },
    moderationActionLog: { findUnique: jest.fn(), findMany: jest.fn().mockResolvedValue([]), create: jest.fn(), update: jest.fn(), delete: jest.fn(), count: jest.fn().mockResolvedValue(0) },
    moderationLog: { findUnique: jest.fn(), findMany: jest.fn().mockResolvedValue([]), create: jest.fn(), update: jest.fn(), delete: jest.fn(), count: jest.fn().mockResolvedValue(0) },
    eventAttendee: { findUnique: jest.fn(), findMany: jest.fn().mockResolvedValue([]), create: jest.fn(), update: jest.fn(), delete: jest.fn(), count: jest.fn().mockResolvedValue(0) },
    follow: { findUnique: jest.fn(), findMany: jest.fn().mockResolvedValue([]), create: jest.fn(), update: jest.fn(), delete: jest.fn(), count: jest.fn().mockResolvedValue(0) },
    $transaction: jest.fn(),
    $connect: jest.fn(),
    $disconnect: jest.fn(),
  },
}));

// Polyfill TextEncoder/TextDecoder for pg and other Node-only libs in jsdom
if (typeof global.TextEncoder === "undefined") {
  global.TextEncoder = TextEncoder as unknown as typeof global.TextEncoder;
  global.TextDecoder = TextDecoder as unknown as typeof global.TextDecoder;
}

// Polyfill fetch for components that call it at render time
if (typeof global.fetch === "undefined") {
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => ({}),
  }) as unknown as typeof global.fetch;
}

// Mock next/navigation globally so any component using useRouter/usePathname
// doesn't throw "invariant expected app router to be mounted"
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
  }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({}),
  redirect: jest.fn((url: string) => {
    const err = new Error(`NEXT_REDIRECT:${url}`);
    throw err;
  }),
}));

// Silence noisy React "not wrapped in act(...)" warnings in tests.
// These are non-failing warnings that appear when components perform
// asynchronous state updates during their effects. We filter them
// to keep test logs clean; real fixes should wrap test interactions
// with `act()` or use `waitFor`/`findBy` in specific tests.
const _origConsoleError = console.error;
console.error = (...args: unknown[]) => {
  try {
    const msg = String(args[0] ?? "");
    if (msg.includes("not wrapped in act(") || msg.includes("An update to") && msg.includes("inside a test was not wrapped in act")) {
      return; // ignore this specific React act warning
    }
  } catch {
    // fall through to default
  }
  return _origConsoleError.apply(console, args as never[]);
};
