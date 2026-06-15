import type { Config } from "jest";
import nextJest from "next/jest.js";

const createJestConfig = nextJest({ dir: "./" });

const config: Config = {
  displayName: "integration",
  coverageProvider: "v8",
  testTimeout: 30_000,
  testEnvironment: "node",
  setupFilesAfterEnv: ["<rootDir>/jest.integration.setup.ts"],
  testMatch: ["**/__tests__/integration/**/*.test.ts"],
  modulePathIgnorePatterns: ["<rootDir>/.next/"],
  transformIgnorePatterns: ["/node_modules/(?!(better-auth|@better-auth)/)"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
  },
};

export default createJestConfig(config);
