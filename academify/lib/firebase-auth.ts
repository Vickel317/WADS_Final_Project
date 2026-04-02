type FirebaseAuthError = {
  error?: {
    message?: string;
  };
};

export type FirebaseSignInResponse = {
  localId: string;
  email: string;
  idToken: string;
  refreshToken: string;
  expiresIn: string;
  displayName?: string;
};

export type FirebaseRefreshResponse = {
  idToken: string;
  refreshToken: string;
  userId: string;
  expiresIn: string;
};

type FirebaseLookupResponse = {
  users?: Array<{
    localId?: string;
    email?: string;
    displayName?: string;
  }>;
};

function getApiKey() {
  const apiKey = process.env.FIREBASE_WEB_API_KEY;
  if (!apiKey) {
    throw new Error("Missing FIREBASE_WEB_API_KEY environment variable");
  }
  return apiKey;
}

function mapFirebaseError(errorMessage: string) {
  switch (errorMessage) {
    case "EMAIL_EXISTS":
      return { status: 400, message: "User already exists" };
    case "EMAIL_NOT_FOUND":
      return { status: 404, message: "User not found" };
    case "INVALID_PASSWORD":
    case "INVALID_LOGIN_CREDENTIALS":
      return { status: 401, message: "Invalid credentials" };
    case "USER_DISABLED":
      return { status: 403, message: "User account is disabled" };
    case "WEAK_PASSWORD : Password should be at least 6 characters":
      return { status: 400, message: "Weak password: minimum 6 characters" };
    case "TOKEN_EXPIRED":
    case "INVALID_ID_TOKEN":
      return { status: 401, message: "Invalid or expired token" };
    case "INVALID_REFRESH_TOKEN":
      return { status: 401, message: "Invalid refresh token" };
    default:
      return { status: 400, message: errorMessage || "Firebase auth error" };
  }
}

async function postToIdentityToolkit<T>(path: string, payload: object): Promise<T> {
  const apiKey = getApiKey();
  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/${path}?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }
  );

  const data = (await response.json()) as T & FirebaseAuthError;
  if (!response.ok) {
    const firebaseMessage = data?.error?.message || "Firebase auth request failed";
    const mapped = mapFirebaseError(firebaseMessage);
    const err = new Error(mapped.message) as Error & { status?: number };
    err.status = mapped.status;
    throw err;
  }

  return data;
}

export async function firebaseSignUp(email: string, password: string) {
  return postToIdentityToolkit<FirebaseSignInResponse>("accounts:signUp", {
    email,
    password,
    returnSecureToken: true,
  });
}

export async function firebaseSignIn(email: string, password: string) {
  return postToIdentityToolkit<FirebaseSignInResponse>(
    "accounts:signInWithPassword",
    {
      email,
      password,
      returnSecureToken: true,
    }
  );
}

export async function firebaseUpdateProfile(idToken: string, displayName: string) {
  return postToIdentityToolkit<{
    localId?: string;
    email?: string;
    displayName?: string;
    idToken?: string;
    refreshToken?: string;
    expiresIn?: string;
  }>("accounts:update", {
    idToken,
    displayName,
    returnSecureToken: true,
  });
}

export async function firebaseDeleteAccount(idToken: string) {
  return postToIdentityToolkit<{ kind?: string }>("accounts:delete", {
    idToken,
  });
}

export async function firebaseRefresh(refreshToken: string): Promise<FirebaseRefreshResponse> {
  const apiKey = getApiKey();
  const response = await fetch(
    `https://securetoken.googleapis.com/v1/token?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: refreshToken,
      }),
    }
  );

  const data = (await response.json()) as
    | {
        id_token: string;
        refresh_token: string;
        user_id: string;
        expires_in: string;
        error?: { message?: string };
      }
    | FirebaseAuthError;

  if (!response.ok || !("id_token" in data)) {
    const firebaseMessage = data?.error?.message || "Firebase refresh failed";
    const mapped = mapFirebaseError(firebaseMessage);
    const err = new Error(mapped.message) as Error & { status?: number };
    err.status = mapped.status;
    throw err;
  }

  return {
    idToken: data.id_token,
    refreshToken: data.refresh_token,
    userId: data.user_id,
    expiresIn: data.expires_in,
  };
}

export async function firebaseLookupByIdToken(idToken: string) {
  const result = await postToIdentityToolkit<FirebaseLookupResponse>(
    "accounts:lookup",
    { idToken }
  );

  return result.users?.[0] || null;
}
