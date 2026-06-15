import { betterAuth, type BetterAuthOptions } from "better-auth";
import { prismaAdapter } from "@better-auth/prisma-adapter";
import { nextCookies } from "better-auth/next-js";
import { prisma } from "@/lib/prisma";

const envBaseURL = process.env.BETTER_AUTH_URL;
const publicAuthUrl = process.env.NEXT_PUBLIC_BETTER_AUTH_URL;
const trustedOrigins = [publicAuthUrl, envBaseURL, "http://localhost:3000", "http://127.0.0.1:3000"].filter(
  (origin, index, list): origin is string => Boolean(origin) && list.indexOf(origin) === index
);

const isProd = process.env.NODE_ENV === "production";
const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;

const options: BetterAuthOptions = {
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
      // lax is required for OAuth — strict drops state cookies on Google redirect back
      sameSite: "lax",
      secure: isProd,
    },
  },
};

if (googleClientId && googleClientSecret) {
  options.socialProviders = {
    google: {
      clientId: googleClientId,
      clientSecret: googleClientSecret,
    },
  };
}

if (envBaseURL) {
  options.baseURL = envBaseURL;
  options.onAPIError = {
    errorURL: `${envBaseURL.replace(/\/$/, "")}/login`,
  };
}

export const auth = betterAuth(options);
export const isGoogleAuthEnabled = Boolean(googleClientId && googleClientSecret);
