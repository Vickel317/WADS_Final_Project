# Google OAuth with Better Auth — Step-by-step

Academify uses [Better Auth](https://www.better-auth.com/) for email/password and optional **Google** sign-in.

## 1. Google Cloud Console

1. Open [Google Cloud Console](https://console.cloud.google.com/)
2. Create or select a project (e.g. `academify-prod`)
3. Go to **APIs & Services → OAuth consent screen**
   - User type: **External** (or Internal if Workspace)
   - Fill app name, support email, developer contact
   - Scopes: default `email`, `profile`, `openid` are enough
4. Go to **APIs & Services → Credentials → Create credentials → OAuth client ID**
   - Application type: **Web application**
   - Name: `Academify`
 
## 2. Authorized redirect URIs

Add **both** (local + production):

```
http://localhost:3000/api/auth/callback/google
https://e2526-wads-b4ac-02.csbihub.id/api/auth/callback/google
```

Replace the production host with your real domain if different.

**Authorized JavaScript origins** (optional but recommended):

```
http://localhost:3000
https://e2526-wads-b4ac-02.csbihub.id
```

5. Copy **Client ID** and **Client secret**

## 3. Local environment (`.env.local`)

```env
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret

BETTER_AUTH_URL=http://localhost:3000
NEXT_PUBLIC_BETTER_AUTH_URL=http://localhost:3000
BETTER_AUTH_SECRET=your-long-random-secret
```

Restart `npm run dev` after changing env.

## 4. Production / GitHub Secrets

In GitHub → **Settings → Secrets and variables → Actions**, add:

| Secret | Value |
|--------|-------|
| `GOOGLE_CLIENT_ID` | From Google Console |
| `GOOGLE_CLIENT_SECRET` | From Google Console |

These are written into `.env.production` during deploy (see `.github/workflows/cicd.yml`).

Also ensure these exist:

- `BETTER_AUTH_URL` = `https://your-production-domain`
- `NEXT_PUBLIC_BETTER_AUTH_URL` = same as above
- `BETTER_AUTH_SECRET` = strong random string

Redeploy after adding secrets.

## 5. How it works in code

- `lib/auth.ts` — registers `socialProviders.google` when both env vars are set
- `lib/google-auth-config.ts` — callback URL helper + OAuth error messages
- `GET /api/auth/config` — returns `googleEnabled` and `googleCallbackUrl` for debugging
- `components/google-sign-in-button.tsx` — calls `authClient.signIn.social({ provider: "google" })`
- `components/oauth-error-notice.tsx` — shows errors on `/login` and `/register`
- Login page: **Continue with Google**
- Register page: **Sign up with Google** → redirects to `/setup` for profile completion
- `lib/get-session.ts` — `ensureAppUser()` creates a `User` row on first Google login

## 6. Test Google login

1. Start app locally with env vars set
2. Open `/login` → click **Continue with Google**
3. Complete Google consent → should land on `/dashboard` or `/setup` if profile incomplete

## 7. Troubleshooting

| Problem | Fix |
|---------|-----|
| `redirect_uri_mismatch` | Add the **exact** callback URL from `/api/auth/config` to Google Console → Credentials → Authorized redirect URIs |
| Button does nothing | Open `/api/auth/config` — `googleEnabled` must be `true`. Restart dev server after editing `.env.local` |
| User has no forum access | Complete the `/setup` profile flow (role, major/department, forums) |
| Works locally, not prod | Add production callback URL in Google Console, set GitHub secrets, redeploy |

### Quick checks

1. **Verify env is loaded**
   ```bash
   curl http://localhost:3000/api/auth/config
   ```
   Expected:
   ```json
   {
     "googleEnabled": true,
     "googleCallbackUrl": "http://localhost:3000/api/auth/callback/google",
     "authBaseUrl": "http://localhost:3000"
   }
   ```

2. **`redirect_uri_mismatch`**
   - Copy `googleCallbackUrl` from the response above (or the dev hint under the Google button).
   - Google Cloud Console → **APIs & Services → Credentials** → your OAuth client.
   - Under **Authorized redirect URIs**, paste that URL exactly — no trailing slash, correct port (`3000` vs `3002`).

3. **Button does nothing / no redirect**
   - Browser DevTools → Network: `POST /api/auth/sign-in/social` should return `{ "url": "...", "redirect": true }`.
   - If `googleEnabled` is `false`, both `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are missing or the server was not restarted.
   - Ensure `BETTER_AUTH_URL` and `NEXT_PUBLIC_BETTER_AUTH_URL` match your browser origin (e.g. `http://localhost:3000`).

4. **Signed in but no forums / empty dashboard**
   - Google creates an account on first login; you still need **`/setup`** (major, role, etc.) before full access.
   - Register with Google uses `callbackURL=/setup`; login uses `/dashboard` and the app redirects to `/setup` if the profile is incomplete.

5. **Works locally, fails in production**
   - Add production redirect URI: `https://YOUR_DOMAIN/api/auth/callback/google`
   - GitHub Actions secrets: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `BETTER_AUTH_URL`, `NEXT_PUBLIC_BETTER_AUTH_URL`, `BETTER_AUTH_SECRET`
   - Redeploy after updating secrets.

OAuth errors are redirected to `/login?error=...` with a readable message on the login page.

## 8. Remove Firebase (already done in codebase)

You do **not** need Firebase. Remove these from local `.env` and GitHub Secrets if still present:

- `FIREBASE_WEB_API_KEY`
- All `NEXT_PUBLIC_FIREBASE_*` variables

Auth is 100% Better Auth + PostgreSQL.
