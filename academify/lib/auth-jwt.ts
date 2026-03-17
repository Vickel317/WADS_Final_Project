export function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    const err = new Error("Missing JWT_SECRET environment variable") as Error & {
      status?: number;
    };
    err.status = 500;
    throw err;
  }

  return secret;
}
