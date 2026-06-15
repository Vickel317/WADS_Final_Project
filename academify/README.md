# Final Project – Web Application Development and Security

**Course Code:** COMP6703001  
**Course Name:** Web Application Development and Security  
**Institution:** BINUS University International  
**Project:** Academify — Student Community & Collaboration Platform

---

## 1. Project Information

| Field | Value |
|-------|-------|
| **Project Title** | Academify |
| **Project Domain** | Option 8 — Student Community & Collaboration Platform |
| **Class** | [FILL IN — e.g. L4AC] |
| **Live URL** | https://e2526-wads-b4ac-02.csbihub.id |
| **API Docs** | `/api-docs` on live URL (Swagger UI) |

### Group Members (max 3 — same class)

| Name | Student ID | Role | GitHub Username |
|------|------------|------|-----------------|
| [FILL IN] | [FILL IN] | [FILL IN] | [FILL IN] |
| [FILL IN] | [FILL IN] | [FILL IN] | [FILL IN] |
| [FILL IN] | [FILL IN] | [FILL IN] | [FILL IN] |

---

## 2. Instructor & Repository Access

Share this repository with:

- **Instructor:** Ida Bagus Kerthyayana Manuaba — imanuaba@binus.edu — GitHub: `bagzcode`
- **Lab Assistant:** Juwono — juwono@binus.edu — GitHub: `Juwono136`

---

## 3. Project Overview

### 3.1 Problem Statement

University students need a single place to discuss coursework, join subject communities, collaborate on projects, share files, schedule study events, and message peers — without scattered WhatsApp groups and unmoderated spam.

**Target users:** Students and lecturers at BINUS (extensible to any academic community).

### 3.2 Solution Overview

Academify is a full-stack web platform where users:

- Join **forums** (subject communities) and post **threads** with comments and likes
- Use **real-time chat** (DMs + collaboration space channels via Socket.IO)
- Share **files** with upload validation and optional virus scanning
- Schedule and RSVP to **events**
- Get **AI-assisted** moderation, recommendations, and thread summaries

**AI is core:** post moderation, forum/thread recommendations, and discussion summarization — all with documented automated tests (see [TESTING.md](./TESTING.md)).

---

## 4. Technology Stack (mandatory)

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 16 (App Router), React 19, Tailwind CSS |
| Backend | Node.js via Next.js API routes + Socket.IO server |
| API | RESTful JSON API, documented with Swagger |
| Database | PostgreSQL + Prisma ORM |
| Auth | Better Auth (email/password + optional Google OAuth) |
| Storage | MinIO (S3-compatible) |
| AI | Ollama (self-hosted LLM) with heuristic fallbacks |
| Containerization | Docker multi-stage Dockerfile + docker-compose |
| CI/CD | GitHub Actions → Docker Hub → VPS deploy |
| Version Control | GitHub |

> **Note:** Firebase is **not used**. Auth is handled entirely by Better Auth + PostgreSQL.

---

## 5. System Architecture

### 5.1 Architecture diagram

```
┌─────────────┐     HTTPS      ┌──────────────────┐
│   Browser   │ ◄────────────► │  Next.js (app)   │
│  (React UI) │                │  API routes      │
└──────┬──────┘                └────────┬─────────┘
       │                                │
       │ WebSocket                      │ Prisma
       ▼                                ▼
┌─────────────┐                ┌──────────────────┐
│ Socket.IO   │                │   PostgreSQL     │
│  server     │                │   (Neon / VPS)   │
└─────────────┘                └──────────────────┘
       ▲                                ▲
       │                                │
       └──────── emit secret ───────────┤
                                        │
                               ┌────────┴────────┐
                               │ MinIO (files)   │
                               │ Ollama (AI)     │
                               └─────────────────┘
```

### 5.2 Architecture explanation

- **Frontend:** Next.js App Router with server components (data fetching) and client components (interactivity).
- **API:** REST handlers in `app/api/**` return JSON; business logic in `lib/**`.
- **Database:** Prisma only — never accessed directly from the browser.
- **Security:** Session cookies (HTTP-only), middleware proxy, role checks in API routes, input sanitization.
- **AI:** Server-side calls to Ollama; rate-limited; fallbacks when AI is down.

---

## 6. API Design (mandatory)

### 6.1 Sample endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/auth/sign-up/email` | Register | No |
| POST | `/api/auth/sign-in/email` | Login | No |
| GET | `/api/auth/get-session` | Current session | Cookie |
| GET | `/api/categories` | List forums | No |
| POST | `/api/posts` | Create thread | Yes |
| GET | `/api/posts` | List threads | Yes |
| POST | `/api/posts/:id/comments` | Add comment | Yes |
| GET | `/api/ai/summarize/:postId` | AI thread summary | Yes |
| GET | `/api/ai/recommend` | AI thread suggestions | Yes |
| GET | `/api/ai/recommend/forums` | AI forum suggestions | Yes |
| POST | `/api/ai/moderate` | AI content moderation | Yes |
| GET | `/api/moderation/queue` | Mod queue | Mod/Admin |
| POST | `/api/reports` | Report content | Yes |
| GET | `/api/files` | List uploads | Yes |

Full list: Swagger at **`/api-docs`** or see [API_DOCS.md](./API_DOCS.md).

### 6.2 Example: create post

```http
POST /api/posts
Content-Type: application/json
Cookie: better-auth.session_token=...

{
  "title": "Study group for WADS",
  "content": "Anyone free Thursday?",
  "forumId": "..."
}
```

```json
{
  "thread": {
    "id": "...",
    "status": "pending"
  }
}
```

---

## 7. Database Design

### 7.1 Database choice

**PostgreSQL** — relational data (users, forums, posts, comments, events, messages, moderation logs) with strong consistency and Prisma migrations.

### 7.2 Schema

Key models: `User`, `ForumHub`, `ForumMember`, `ForumModerator`, `Post`, `Comment`, `CommentLike`, `Message`, `Event`, `File`, `CollabSpace`, `ReportReview`, `ModerationActionLog`, plus Better Auth tables (`AuthUser`, `AuthSession`, `AuthAccount`).

ERD: generate with `npx prisma generate` and your preferred diagram tool from `prisma/schema.prisma`, or export from Neon/Prisma Studio.

---

## 8. AI Features (mandatory)

### 8.1 AI feature list

| AI Feature | Purpose | Type |
|------------|---------|------|
| Content moderation | Auto-approve/flag/block new posts | NLP classification |
| Thread summarization | Key points + open questions from discussion | NLP generation |
| Thread recommendations | Suggest posts based on profile & activity | Recommendation |
| Forum recommendations | Suggest forums to join | Recommendation |

### 8.2 AI integration flow

```
User submits post
    → lib/ai/post-moderation.ts
    → Ollama prompt (or profanity heuristic fallback)
    → moderationStatus stored on Post
    → Visible per visibility rules

User opens thread
    → GET /api/ai/summarize/:postId
    → Top 20 comments by likes + post body → Ollama
    → Cached JSON on Post when unchanged
```

Detailed test cases: **[TESTING.md](./TESTING.md)** §10.4.

---

## 9. Security Implementation (mandatory)

| Control | Implementation |
|---------|----------------|
| Authentication | Better Auth session cookies (`lib/auth.ts`), HTTP-only, `secure` in production |
| Authorization | Roles: `student`, `lecturer`, `admin`; per-forum moderators via `ForumModerator` |
| Input validation | `lib/validation.ts` on API bodies |
| XSS mitigation | `lib/sanitization.ts` — HTML stripped from user text |
| SQL injection | Prisma parameterized queries only |
| CSRF | SameSite cookies + same-origin API calls |
| Rate limiting | `lib/ai/rate-limit.ts`, `lib/rate-limit.ts` on AI endpoints |
| File security | Extension/MIME checks, size limits, ClamAV scan hook |
| API keys | Ollama/MinIO secrets in env only — never in client bundle |
| Moderation audit | `ModerationActionLog` table |

---

## 10. Testing Documentation

**Full tables (FE / API / SEC / AI):** [TESTING.md](./TESTING.md)

```bash
npm test                 # 125+ unit/component/API tests (mocked DB)
npm run test:integration # Real PostgreSQL integration tests
npm run test:e2e         # Playwright browser smoke tests
npm run test:coverage    # Coverage report → coverage/
```

CI runs lint, build, unit tests, and integration tests on every push to `main`.

---

## 11. Deployment & Production Setup

### 11.1 Docker setup

- `Dockerfile` — multi-stage: `runner` (Next.js), `socket`, `migrator`
- `docker-compose.yml` — `app`, `socket`, `minio`, optional `db-schema-sync` profile

```bash
docker compose --env-file .env.production up -d app socket minio
```

### 11.2 Production environment

Secrets via `.env.production` (reconstructed from GitHub Secrets in CI). See [.env.example](./.env.example).

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` / `DIRECT_URL` | PostgreSQL (Neon) |
| `BETTER_AUTH_SECRET` | Session signing |
| `BETTER_AUTH_URL` | Server auth base URL |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Optional Google OAuth |
| `OLLAMA_API_BASE` | AI server |
| `MINIO_*` | File storage |
| `SOCKET_EMIT_SECRET` | Socket relay auth |

### 11.3 Live application URL

https://e2526-wads-b4ac-02.csbihub.id

---

## 12. GitHub Contribution Summary (individual)

> Each member: copy this block, fill in, and ensure it matches commit history.

**Student Name:** [FILL IN]

- Features implemented: [FILL IN]
- API endpoints handled: [FILL IN]
- Tests written: [FILL IN]
- Security work: [FILL IN]
- AI-related work: [FILL IN]

---

## 13. AI Usage Disclosure (mandatory)

Example (edit for your team):

> ChatGPT / GitHub Copilot / Cursor were used to assist with boilerplate API routes, UI components, test scaffolding, and Docker/CI configuration. All code was reviewed, tested, and modified by the team. We can explain authentication, moderation, and AI fallback logic in presentation.

**Tools used:** [FILL IN]  
**Purpose:** [FILL IN]  
**Parts assisted:** [FILL IN]

---

## 14. Known Limitations & Future Improvements

- Ollama quality depends on host GPU/CPU; heuristics used when offline
- E2E tests are smoke-level only (authenticated flows not fully automated)
- Reports inbox is primarily platform-admin scoped
- Email verification not enabled for Better Auth email provider

---

## 15. Final Declaration

We declare that:

- This project is our own work
- AI usage is disclosed honestly
- All group members understand the system

Signed: [FILL IN] · [FILL IN] · [FILL IN]

---

## 16. SETUP (local development)

### Prerequisites

- Node.js 22+
- PostgreSQL (local or Neon)
- Optional: Ollama, MinIO, Docker

### Steps

```bash
git clone <repo-url>
cd academify
cp .env.example .env.local
# Edit .env.local — set DATABASE_URL, BETTER_AUTH_*, etc.

npm ci
npx prisma migrate deploy
npx prisma generate

# Terminal 1 — Next.js + Socket
npm run dev:all

# Open http://localhost:3000
```

### Google OAuth (optional)

See [docs/GOOGLE_OAUTH.md](./docs/GOOGLE_OAUTH.md) for step-by-step setup.

---

## 17. DEPLOYMENT INSTRUCTIONS

1. Push to `main` → GitHub Actions runs lint, test, build, integration tests
2. On success: Docker images pushed to Docker Hub
3. Self-hosted runner on VPS: `prisma migrate deploy` + `docker compose up -d`
4. Ensure GitHub Secrets match `.env.example` (no Firebase secrets needed)

### Remove old Firebase secrets from GitHub

Delete these repository secrets if present (no longer used):

- `FIREBASE_WEB_API_KEY`
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`

Add instead (for Google login):

- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`

---

## Related docs

- [TESTING.md](./TESTING.md) — test case tables
- [API_DOCS.md](./API_DOCS.md) — API reference
- [docs/GOOGLE_OAUTH.md](./docs/GOOGLE_OAUTH.md) — Google sign-in setup
