import { prismaAdapter } from "@better-auth/prisma-adapter";
import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { prisma } from "@/lib/prisma";

const baseURL = process.env.BETTER_AUTH_URL || "http://localhost:3000";
const trustedOrigins = [process.env.NEXT_PUBLIC_BETTER_AUTH_URL].filter(
  (origin): origin is string => Boolean(origin)
);

export const auth = betterAuth({
  baseURL,
  trustedOrigins,
  user: {
    modelName: "AuthUser",
  },
  session: {
    modelName: "AuthSession",
  },
  account: {
    modelName: "AuthAccount",
  },
  verification: {
    modelName: "AuthVerification",
  },
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
    autoSignIn: false,
  },
  plugins: [nextCookies()],
});