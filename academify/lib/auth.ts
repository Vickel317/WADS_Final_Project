const envBaseURL = process.env.BETTER_AUTH_URL;
const trustedOrigins = [process.env.NEXT_PUBLIC_BETTER_AUTH_URL].filter(
  (origin): origin is string => Boolean(origin)
);

let _auth: any = null;

export async function getAuth() {
  console.log(`[auth.ts] getAuth called at ${Date.now()}`);
  if (_auth) {
    console.log(`[auth.ts] Returning cached auth`);
    return _auth;
  }

  console.log(`[auth.ts] Dynamic imports starting...`);
  const [{ prismaAdapter }, { betterAuth }, { nextCookies }, prismaModule] = await Promise.all([
    import("@better-auth/prisma-adapter"),
    import("better-auth"),
    import("better-auth/next-js"),
    import("@/lib/prisma"),
  ]);
  console.log(`[auth.ts] Dynamic imports finished!`);

  const prisma = (prismaModule as any).prisma;

  console.log(`[auth.ts] Configuring betterAuth...`);
  const options: any = {
    trustedOrigins,
    user: { modelName: "AuthUser" },
    session: { modelName: "AuthSession" },
    account: { modelName: "AuthAccount" },
    verification: { modelName: "AuthVerification" },
    database: prismaAdapter(prisma, { provider: "postgresql" }),
    emailAndPassword: { enabled: true, autoSignIn: false },
    plugins: [nextCookies()],
  };

  if (envBaseURL) options.baseURL = envBaseURL;

  _auth = betterAuth(options) as any;
  console.log(`[auth.ts] betterAuth initialized!`);

  return _auth;
}