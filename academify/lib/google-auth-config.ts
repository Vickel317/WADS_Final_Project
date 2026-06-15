export function getAuthBaseUrl() {
  const base =
    process.env.BETTER_AUTH_URL ||
    process.env.NEXT_PUBLIC_BETTER_AUTH_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "http://localhost:3000";
  return base.replace(/\/$/, "");
}

export function getGoogleCallbackUrl() {
  return `${getAuthBaseUrl()}/api/auth/callback/google`;
}

/** Server-only config for /api/auth/config — do not import @/lib/auth here (pulls Prisma into client bundles). */
export function getGoogleAuthPublicConfig() {
  const googleEnabled = Boolean(
    process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
  );
  return {
    googleEnabled,
    googleCallbackUrl: getGoogleCallbackUrl(),
    authBaseUrl: getAuthBaseUrl(),
  };
}

export function mapOAuthErrorMessage(error: string, description?: string | null) {
  const combined = `${error} ${description ?? ""}`.toLowerCase();

  if (combined.includes("redirect_uri_mismatch")) {
    return {
      title: "Google redirect URI mismatch",
      message:
        "The redirect URI in Google Cloud Console must match exactly. Add this URI under Credentials → your OAuth client → Authorized redirect URIs:",
      callbackUrl: getGoogleCallbackUrl(),
    };
  }

  if (combined.includes("provider_not_found") || combined.includes("oauth_provider_not_found")) {
    const isDev = process.env.NODE_ENV !== "production";
    return {
      title: "Google sign-in not configured",
      message: isDev
        ? "Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env.local, then restart the dev server."
        : "Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in deployment secrets, redeploy the app, then try again.",
    };
  }

  if (combined.includes("access_denied")) {
    return {
      title: "Google sign-in cancelled",
      message: "You closed the Google consent screen or denied access. Try again when ready.",
    };
  }

  if (combined.includes("invalid_code") || combined.includes("no_code")) {
    return {
      title: "Google sign-in expired",
      message: "The authorization code was invalid or expired. Click Continue with Google again.",
    };
  }

  if (combined.includes("state_mismatch") || combined.includes("state mismatch")) {
    return {
      title: "Google sign-in session expired",
      message:
        "OAuth state did not match. Use http://localhost:3000 (not 127.0.0.1), clear site cookies for localhost, then try again in one tab.",
    };
  }

  return {
    title: "Google sign-in failed",
    message: description?.trim() || error.replace(/_/g, " "),
  };
}
