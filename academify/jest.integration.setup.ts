/**
 * Integration test setup — uses a REAL PostgreSQL database.
 * Set TEST_DATABASE_URL or DATABASE_URL before running `npm run test:integration`.
 */

import { config as loadEnv } from "dotenv";

loadEnv({ path: ".env.local" });
loadEnv();

const dbUrl = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL;
if (!dbUrl) {
  throw new Error(
    "Integration tests require TEST_DATABASE_URL or DATABASE_URL pointing to a test database."
  );
}

process.env.DATABASE_URL = dbUrl;
process.env.DIRECT_URL = process.env.DIRECT_URL || dbUrl;

jest.mock("@/lib/storage", () => ({
  isMinioEnabled: jest.fn(() => false),
  getPresignedPutUrl: jest.fn().mockResolvedValue("https://example.com/upload"),
  getPresignedGetUrl: jest.fn().mockResolvedValue("https://example.com/download"),
  generateObjectKey: jest.fn((name: string) => `test-key-${name}`),
  putObjectBytes: jest.fn().mockResolvedValue(undefined),
  deleteObject: jest.fn().mockResolvedValue(undefined),
  default: {},
}));

jest.setTimeout(30_000);
