import { betterAuth } from "better-auth";
import { prismaAdapter } from "@better-auth/prisma-adapter";
import { nextCookies } from "better-auth/next-js";
import { prisma } from "@/lib/prisma";

const envBaseURL = process.env.BETTER_AUTH_URL;
const trustedOrigins = [process.env.NEXT_PUBLIC_BETTER_AUTH_URL].filter(
  (origin): origin is string => Boolean(origin)
);

const isProd = process.env.NODE_ENV === "production";
const options: any = {
  trustedOrigins,
  user: { modelName: "AuthUser" },
  session: { modelName: "AuthSession" },
  account: { modelName: "AuthAccount" },
  verification: { modelName: "AuthVerification" },
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  emailAndPassword: { enabled: true, autoSignIn: false },
  plugins: [nextCookies()],
  advanced: {
    useSecureCookies: isProd,
    defaultCookieAttributes: {
      httpOnly: true,
      sameSite: "lax",
      secure: isProd,
    },
  },
};

if (envBaseURL) options.baseURL = envBaseURL;

export const auth = betterAuth(options);
