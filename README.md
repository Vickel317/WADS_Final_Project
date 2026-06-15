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
| **Class** | L4AC |
| **Live URL** | https://e2526-wads-b4ac-02.csbihub.id |
| **API Docs** | `/api-docs` on live URL (Swagger UI) |

### Group Members (max 3 — same class)

| Name | Student ID | Role | GitHub Username |
|------|------------|------|-----------------|
| Vickelsteins August Santoso | 2802505941	 | Full Stack | Vickel317 |
| Harris Ekaputra Suryadi | 2802400502	 | Full Stack | HES2209 |
| Kevin Makmur Kurniawan | 2802547553 | Full Stack | kevMkr |

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

**AI is core:** post moderation, forum/thread recommendations, and discussion summarization — all with documented automated tests (see §10).

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

![Alternative Text](/images/ArchitectureDesignDiagram.png)

### 5.2 Architecture explanation

- **Frontend:** Next.js App Router with server components (data fetching) and client components (interactivity).
- **API:** REST handlers in `app/api/**` return JSON; business logic in `lib/**`.
- **Realtime:** Browser connects to a separate Socket.IO server (`socket-server/`, `lib/socket-client.ts`) for DMs and collab-space typing. Set `NEXT_PUBLIC_SOCKET_URL` in env (port **3100** in Docker/prod).
- **Database:** Prisma only — never accessed directly from the browser.
- **Security:** Session cookies (HTTP-only), middleware proxy, role checks in API routes, input sanitization.
- **AI:** Server-side calls to Ollama; rate-limited; fallbacks when AI is down.

---

## 6. API Design (MANDATORY)

All API's begin with `/api/`.

### 6.1 API Endpoints

#### Authentication Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | /auth/sign-up/email | Register a new account | No |
| POST | /auth/sign-in/email | Log in with email and password | No |
| POST | /auth/sign-out | Log out current user | Yes |
| GET | /auth/me | Retrieve current user session | Yes |

#### User Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | /users/ | Retrieve all users | Yes |
| GET | /users/{userId} | Retrieve a specific user's profile | Yes |
| GET | /users/{userId}/posts | Retrieve posts by a specific user | Yes |
| GET | /users/{userId}/events | Retrieve events by a specific user | Yes |
| PUT | /users/{userId}/avatar | Update user avatar | Yes |
| PUT | /users/{userId}/banner | Update user banner | Yes |
| POST | /users/{userId}/follow | Follow/unfollow a user | Yes |
| GET | /users/connections | Retrieve user connections | Yes |
| POST | /profile/setup | Complete profile setup | Yes |

#### Post & Comment Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | /posts/ | Retrieve all posts | Yes |
| POST | /posts/ | Create a new post | Yes |
| GET | /posts/{postId} | Retrieve a specific post | Yes |
| PATCH | /posts/{postId} | Update a post | Yes |
| DELETE | /posts/{postId} | Delete a post | Yes |
| POST | /posts/{postId}/like | Like/unlike a post | Yes |
| GET | /posts/{postId}/comments | Retrieve comments for a post | Yes |
| POST | /posts/{postId}/comments | Add a comment to a post | Yes |
| GET | /comments/{commentId} | Retrieve a specific comment | Yes |
| PATCH | /comments/{commentId} | Update a comment | Yes |
| DELETE | /comments/{commentId} | Delete a comment | Yes |
| POST | /comments/{commentId}/like | Like/unlike a comment | Yes |

#### Forum & Category Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | /categories/ | Retrieve all categories | Yes |
| GET | /categories/{id} | Retrieve a specific category | Yes |
| GET | /forums/{forumId}/members | Retrieve forum members | Yes |
| POST | /forums/{forumId}/membership | Join/leave a forum | Yes |

#### Event Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | /events/ | Retrieve all events | Yes |
| POST | /events/ | Create a new event | Yes |
| GET | /events/{eventId} | Retrieve a specific event | Yes |
| PATCH | /events/{eventId} | Update an event | Yes |
| DELETE | /events/{eventId} | Delete an event | Yes |
| POST | /events/{eventId}/rsvp | RSVP to an event | Yes |
| GET | /events/{eventId}/attendees | Retrieve event attendees | Yes |

#### Messaging Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | /messages/ | Retrieve user's messages | Yes |
| POST | /messages/ | Send a new message | Yes |
| GET | /messages/{userId} | Retrieve conversation with user | Yes |
| GET | /messages/space/{spaceId} | Retrieve space messages | Yes |

#### File Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | /files/ | Retrieve user's files | Yes |
| POST | /files/ | Upload a file | Yes |
| GET | /files/{fileId} | Retrieve a specific file | Yes |
| DELETE | /files/{fileId} | Delete a file | Yes |
| POST | /files/{fileId}/share | Share a file | Yes |
| POST | /files/scan | Scan file for malware | Yes |
| POST | /storage/upload | Upload to object storage | Yes |
| POST | /storage/presign | Get presigned upload URL | Yes |
| POST | /storage/delete | Delete from object storage | Yes |

#### Moderation & Admin Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | /admin/users | Retrieve all users (admin) | Yes (Admin) |
| GET | /admin/users/{userId} | Retrieve user details (admin) | Yes (Admin) |
| PATCH | /admin/users/{userId}/role | Update user role | Yes (Admin) |
| GET | /admin/analytics | Retrieve platform analytics | Yes (Admin) |
| GET | /reports/ | Retrieve all reports | Yes (Moderator) |
| GET | /reports/{reportId} | Retrieve a specific report | Yes (Moderator) |
| POST | /reports/{reportId}/review | Review a report | Yes (Moderator) |
| POST | /reports/{reportId}/action | Take action on report | Yes (Moderator) |
| GET | /moderation/queue | Retrieve moderation queue | Yes (Moderator) |
| POST | /moderation/approve/{postId} | Approve a post | Yes (Moderator) |
| POST | /moderation/delete/{postId} | Delete flagged content | Yes (Moderator) |
| POST | /moderation/revert/{postId} | Revert moderation action | Yes (Moderator) |
| POST | /moderation/warn/{userId} | Warn a user | Yes (Moderator) |
| POST | /moderation/suspend/{userId} | Suspend a user | Yes (Moderator) |
| POST | /moderation/ban/{userId} | Ban a user | Yes (Moderator) |
| GET | /moderation/logs | Retrieve moderation logs | Yes (Moderator) |

#### AI Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | /ai/moderate | AI content moderation | Yes |
| POST | /ai/summarize/{postId} | Summarize a post | Yes |
| GET | /ai/recommend | AI topic recommendations | Yes |
| GET | /ai/recommend/forums | AI forum recommendations | Yes |
| GET | /ai/health | Check AI service health | Yes |

#### Collaboration Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | /collaboration/ | Retrieve collaboration spaces | Yes |
| POST | /collaboration/ | Create a collaboration space | Yes |
| GET | /collaboration/{spaceId} | Retrieve a specific space | Yes |
| PATCH | /collaboration/{spaceId} | Update a space | Yes |
| DELETE | /collaboration/{spaceId} | Delete a space | Yes |

#### Miscellaneous Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | /search/ | Search posts, users, forums | Yes |
| GET | /swagger/ | API documentation | No |

### 6.2 API Documentation

- **Swagger / Postman link (if available)**
    - Interactive Documentation: Visit [https://e2526-wads-b4ac-02.csbihub.id/api-docs](https://e2526-wads-b4ac-02.csbihub.id/api-docs) to explore the API with Swagger UI
    - OpenAPI Spec: [/public/swagger.json](/public/swagger.json)
    - Base URL: `https://e2526-wads-b4ac-02.csbihub.id/api`
- **Example request & response (JSON)**

Example: **POST /api/auth/sign-in/email**

Request JSON:
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

Response JSON:
```json
{
  "success": true,
  "user": {
    "id": "user_123",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "STUDENT"
  }
}
```

---

## 7. Database Design

### 7.1 Database Choice

Explain why you chose:

- **PostgreSQL** — We chose PostgreSQL because our application requires strong relational integrity for complex data relationships between users, forums, posts, comments, events, messages, and moderation logs. PostgreSQL provides ACID compliance, robust indexing, and mature support for the relational queries our platform demands. Combined with Prisma ORM, we get type-safe database access, automatic migrations, and protection against SQL injection. Hosting on Neon provides serverless scaling with connection pooling for production reliability.

### 7.2 Schema / Data Structure

Insert ERD or data structure diagram.

Key models in our schema:

| Model | Description |
|-------|-------------|
| `User` | Core user profile with role-based attributes (STUDENT, LECTURER, ADMIN), privacy settings, and collaboration metadata |
| `ForumHub` | Discussion forums with moderators and members |
| `ForumMember` | Many-to-many relationship between users and forums |
| `ForumModerator` | Moderator assignments per forum |
| `Post` | Forum posts with moderation status, AI scoring, and summaries |
| `Comment` | Nested comments on posts with like support |
| `CommentLike` | Like tracking for comments |
| `PostLike` | Like tracking for posts |
| `Event` | Scheduled events with RSVP and attendee tracking |
| `EventAttendee` | Event participation with roles (GUEST, HOST) |
| `File` | File attachments linked to posts or collaboration spaces |
| `Message` | Direct messaging between users and within collaboration spaces |
| `CollabSpace` | Collaboration spaces within forums with role-based access |
| `SpaceMember` | Membership in collaboration spaces |
| `ReportReview` | User-submitted reports for content moderation |
| `ModerationActionLog` | Audit log for all moderation actions taken |
| `Follow` | User follow relationships |
| `AuthUser` | Better Auth user table |
| `AuthSession` | Better Auth session table |
| `AuthAccount` | Better Auth account/provider table |

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

### 8.2 AI Integration Flow

Explain:

**Content Moderation:**
- Input → AI processing → Output
    - User submits a post or comment → Text is sent to local Ollama instance for classification → AI returns moderation decision (APPROVED, FLAGGED, or BLOCKED) → Result stored in `moderationStatus` field on the Post → Content visibility enforced based on status
- How AI results are used in the system
    - Posts with `PENDING` status are held for review. `APPROVED` posts are immediately visible. `FLAGGED` posts enter the moderation queue for moderator action. If Ollama is unavailable, profanity-based heuristic fallback is used.

**Thread Summarization:**
- Input → AI processing → Output
    - User opens a thread → Top 20 comments by likes + post body are collected → Text sent to Ollama for summarization → AI returns key points and open questions → Summary cached as JSON on the Post model
- How AI results are used in the system
    - Cached summaries are displayed at the top of thread views. Summaries are regenerated only when comment count changes significantly, reducing unnecessary AI calls.

**Topic & Forum Recommendations:**
- Input → AI processing → Output
    - User's profile interests + forum metadata are collected → Semantic similarity computed via Ollama → Ranked list of relevant forums returned → Personalized feed filtered by engagement patterns
- How AI results are used in the system
    - Recommendations appear in the sidebar and "Recommended for You" section. Results are personalized per user and refreshed on each session.

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
| File security | Extension/MIME checks, size limits, ClamAV (`clamscan` + `freshclam` in Docker) |
| API keys | Ollama/MinIO secrets in env only — never in client bundle |
| Realtime chat | Socket.IO over WebSocket; CORS on socket server; `NEXT_PUBLIC_SOCKET_URL` for client |
| Moderation audit | `ModerationActionLog` table |

---

## 10. Testing Documentation

### Test layers

| Layer | Tool | What it tests | Location |
|-------|------|---------------|----------|
| **Unit** | Jest | Pure functions, helpers, AI mappers | `__tests__/*.test.ts` |
| **Component / page** | Jest + React Testing Library | UI rendering, forms, interactions | `__tests__/*.test.tsx` |
| **API (mocked DB)** | Jest + `NextRequest` | Route handlers, auth guards, validation | `__tests__/api-*.test.ts`, `security-critical.test.ts` |
| **Integration (real DB)** | Jest + PostgreSQL | API ↔ Prisma ↔ PostgreSQL | `__tests__/integration/*.int.test.ts` |
| **E2E** | Playwright | Full browser smoke tests on running app | `e2e/*.spec.ts` |

**E2E** tests the whole stack (browser → Next.js → API → DB). **Playwright** automates Chromium. E2E is slower and runs against a live server; unit/integration tests run in Node.

Current coverage (~66% statements) focuses on critical paths. See the **coverage matrix** below.

### Running tests

```bash
npm test                 # Unit + component + mocked API tests
npm run test:coverage    # Coverage report → coverage/
npm run test:integration # Real PostgreSQL integration tests
npm run test:e2e         # Playwright browser smoke tests
```

For integration tests locally:

```bash
createdb academify_test   # once
TEST_DATABASE_URL=postgresql://user:pass@localhost:5432/academify_test npx prisma migrate deploy
npm run test:integration
```

CI runs lint, build, unit tests, and integration tests on every push to `main` / `master`.

### 10.1 Frontend testing

| ID | Scenario | Expected result | Automated test | Status |
|----|----------|-----------------|----------------|--------|
| FE-01 | Login with invalid email | Inline validation error | `__tests__/login.test.tsx` | Pass |
| FE-02 | Login with empty password | Inline validation error | `__tests__/login.test.tsx` | Pass |
| FE-03 | Register password mismatch | Error shown | `__tests__/register.test.tsx` | Pass |
| FE-04 | Register without terms | Error shown | `__tests__/register.test.tsx` | Pass |
| FE-05 | Dashboard renders for session | Main sections visible | `__tests__/dashboard.test.tsx` | Pass |
| FE-06 | Forums list renders | Forum cards / heading | `__tests__/forums.test.tsx` | Pass |
| FE-07 | Profile edit validation | Field errors | `__tests__/profile-edit.test.tsx` | Pass |
| FE-08 | Topbar search mount | No hydration crash | `__tests__/topbar.test.tsx` | Pass |
| FE-09 | Login page E2E smoke | Page loads in browser | `e2e/smoke.spec.ts` | Pass |
| FE-10 | Register page E2E smoke | Page loads in browser | `e2e/smoke.spec.ts` | Pass |
| FE-11 | Events page renders | Calendar + create button | `__tests__/events.test.tsx` | Pass |
| FE-12 | Profile setup (student) | Education dropdown + skills | `__tests__/profile-setup.test.tsx` | Pass |
| FE-13 | Admin panel | Stats or forbidden message | `__tests__/admin.test.tsx` | Pass |
| FE-14 | Protected routes E2E smoke | No 500 on key pages | `e2e/smoke.spec.ts` | Pass |

### 10.2 Backend & API testing

| ID | Endpoint / area | Input / case | Expected output | Test file | Status |
|----|-----------------|--------------|-----------------|-----------|--------|
| API-01 | `POST /api/posts` | Unauthenticated | 401 | `api-authorization.test.ts` | Pass |
| API-02 | `PUT /api/categories/:id` | Non-admin/non-mod | 403 | `categories-authorization.test.ts` | Pass |
| API-03 | `GET /api/files/:id` | Non-owner | 403/404 | `files-authorization.test.ts` | Pass |
| API-04 | `POST /api/posts/:id/like` | Toggle like | 200 + count | `post-like.test.ts` | Pass |
| API-05 | `GET /api/categories` | List forums | 200 + JSON | `integration/categories.int.test.ts` | Pass |
| API-06 | `POST /api/posts/:id/comments` | XSS in body | Sanitized in DB | `integration/post-comments.int.test.ts` | Pass |
| API-07 | `GET /api/ai/summarize/:id` | Unauthenticated | 401 | `ai-summarize.test.ts` | Pass |
| API-08 | `GET /api/ai/recommend/forums` | Authenticated | 200 + forums | `ai-recommend-forums.test.ts` | Pass |
| API-09 | `POST /api/events` | Unauthenticated | 401 | `api-events.test.ts` | Pass |
| API-10 | `GET /api/reports` | Student role | 403 | `api-reports.test.ts` | Pass |
| API-11 | `GET /api/events` | Upcoming list | 200 + DB rows | `integration/events.int.test.ts` | Pass |
| API-12 | `POST /api/collaboration` | Create space | 201 + owner row | `integration/collaboration.int.test.ts` | Pass |
| API-13 | `POST /api/profile/setup` | Student education | `profileSetupComplete` | `integration/profile-setup.int.test.ts` | Pass |

### 10.3 Security testing

| ID | Attack / case | Expected behavior | Test file | Status |
|----|---------------|-------------------|-----------|--------|
| SEC-01 | XSS in message body | Tags stripped before save | `security-critical.test.ts` | Pass |
| SEC-02 | XSS in comment body | Tags stripped (integration) | `integration/post-comments.int.test.ts` | Pass |
| SEC-03 | Dangerous upload filename | Rejected | `security-critical.test.ts` | Pass |
| SEC-04 | Restricted user creates post | 403 | `security-critical.test.ts` | Pass |
| SEC-05 | Non-author views pending post | Denied | `integration/post-visibility.int.test.ts` | Pass |
| SEC-06 | AI rate limit exceeded | 429 | `ai-rate-limit.test.ts` | Pass |
| SEC-07 | Input sanitization helper | HTML escaped | `security-critical.test.ts` | Pass |

### 10.4 AI functionality testing (mandatory)

#### AI Feature 1: Content moderation (Ollama + heuristics)

| ID | Input | Expected output | Test file | Status |
|----|-------|-----------------|-----------|--------|
| AI-MOD-01 | Clean academic text | APPROVED | `ai-moderation.test.ts` | Pass |
| AI-MOD-02 | Profanity / slurs | FLAGGED or BLOCKED | `ai-moderation.test.ts` | Pass |
| AI-MOD-03 | Ollama timeout / failure | Heuristic fallback | `ai-moderation.test.ts` | Pass |
| AI-MOD-04 | Malformed model JSON | Safe fallback status | `ai-moderation.test.ts` | Pass |

**Failure handling:** `lib/ai/post-moderation.ts` falls back to profanity heuristics when Ollama is unavailable.

#### AI Feature 2: Thread summarization

| ID | Input | Expected output | Test file | Status |
|----|-------|-----------------|-----------|--------|
| AI-SUM-01 | Valid post + comments | Summary JSON | `ai-summarize.test.ts` | Pass |
| AI-SUM-02 | Unauthenticated request | 401 | `ai-summarize.test.ts` | Pass |
| AI-SUM-03 | Hidden / pending post (non-author) | 404 | `ai-summarize.test.ts` | Pass |
| AI-SUM-04 | Rate limit exceeded | 429 | `ai-summarize.test.ts` | Pass |

#### AI Feature 3: Forum & thread recommendations

| ID | Input | Expected output | Test file | Status |
|----|-------|-----------------|-----------|--------|
| AI-REC-01 | User with profile | Ranked suggestions | `ai-recommend-forums.test.ts` | Pass |
| AI-REC-02 | Ollama failure | Heuristic fallback list | `ai-recommend-forums.test.ts` | Pass |

#### AI Feature 4: Comment sorting by engagement

| ID | Input | Expected output | Test file | Status |
|----|-------|-----------------|-----------|--------|
| AI-SORT-01 | Comments with like counts | Sorted by likes desc | `comment-sort.test.ts` | Pass |

### Coverage matrix

| Area | Unit/component | Integration | E2E |
|------|----------------|-------------|-----|
| Auth (login/register/setup) | ✅ | ✅ setup | ✅ smoke |
| Forums / threads | ✅ | ✅ categories | ✅ smoke |
| Posts / comments | ✅ | ✅ comments + visibility | ✅ smoke |
| Messages / chat | ✅ partial | ⬜ | ✅ smoke |
| Events | ✅ | ✅ list | ✅ smoke |
| Files / uploads | ✅ partial | ⬜ | ✅ smoke |
| Collaboration | ✅ | ✅ create space | ✅ smoke |
| Moderation / reports | ✅ partial | ⬜ | ⬜ |
| Admin | ✅ | ⬜ | ✅ smoke |
| AI endpoints | ✅ | ⬜ | ⬜ |

**Legend:** ✅ covered · ⬜ add next · partial = some paths only

### Manual test checklist (demo / submission)

Run these in the browser on **localhost** and on **production** (`https://e2526-wads-b4ac-02.csbihub.id`). Tick when verified.

#### Auth & onboarding
- [✅] Register with email/password → redirected to `/setup`
- [✅] Complete setup (education level + skills) → lands on `/dashboard`
- [✅] Google sign-in (if configured) → session works, no `state mismatch`
- [✅] Logout → protected routes redirect to login

#### Forums & posts
- [✅] Browse forums, open a forum hub (Threads / Events / Collab tabs)
- [✅] Create thread, comment, like post/comment
- [✅] Moderator: edit forum description + banner (not name)
- [✅] Pending post hidden from other users; author can still view

#### Events
- [✅] Create event from forum Events tab or `/events`
- [✅] RSVP / cancel RSVP; attendee count updates
- [✅] Past vs upcoming filter behaves correctly

#### Files & collaboration
- [✅] Upload file in a collab space; file appears in space + Files page
- [✅] Rename file, move to another space (if member)
- [✅] Download via presigned URL works

#### Messages & realtime
- [✅] DM another user; messages persist after refresh
- [✅] Socket server running (`npm run dev:all` or prod port **3100**)

#### Moderation & admin
- [✅] Submit report on a post; mod/admin sees it in queue
- [✅] Admin analytics page loads (admin account only)
- [✅] AI moderation flags obvious profanity on new post

#### AI features (document in demo)
- [✅] Thread summarize on a post with comments
- [✅] Forum recommendations on dashboard/profile
- [✅] Show fallback when Ollama is offline (heuristic still works)

#### Deploy / infra
- [✅] `npm run build` passes
- [✅] MinIO uploads on prod (port **3099** / configured endpoint)
- [✅] Swagger UI at `/api-docs`

Export Postman collection or paste sample responses into the API tables above for grader evidence.

### How to document manual tests (Postman / demo)

For submission, export Postman collection or add rows to the tables above with:

- Request URL + method
- Sample JSON body
- Screenshot or pasted response
- Pass/Fail from manual run

Link Swagger UI: `/api-docs` on deployed app.

### CI/CD test pipeline

On push to `main` / `master`:

1. **Lint & Test** — `npm run lint`, `npm run build`, `npm test --coverage`
2. **Integration Tests** — Postgres service + `npm run test:integration`
3. **Docker build & deploy** — only if jobs 1–2 pass

### How to add a new integration test

1. Create `__tests__/integration/<feature>.int.test.ts`
2. Use `/** @jest-environment node */` at the top
3. Create test data with unique names (`Date.now()` marker)
4. Call real API handlers or Prisma directly
5. Clean up in `afterAll`
6. Run `npm run test:integration` against a **dedicated test database** (never production)

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
| `NEXT_PUBLIC_SOCKET_URL` | Browser Socket.IO endpoint (e.g. `https://socket-…` or `http://localhost:3100`) |
| `OLLAMA_API_BASE` | AI server |
| `MINIO_*` | File storage |

### 11.3 Live application URL

https://e2526-wads-b4ac-02.csbihub.id

---

## 12. GitHub Contribution Summary (individual)

> Each member: copy this block, fill in, and ensure it matches commit history.

**Student Name:** HES2209 (Harris Ekaputra Suryadi)

- Features implemented: Project bootstrap (Next.js app structure, login/register pages, navbar, early dashboard), file sharing & collab spaces (collab pages/API, files library, MinIO Docker setup, presigned uploads, file share via DM), profile media (avatar upload/proxy + storage delete), auth migration (Better Auth integration + Firebase bridge route), Prisma/schema alignment (Category → ForumHub, enum/orderBy fixes, collab roles), upload reliability fixes (avatar/banner/files), collab-space chat UI bug fix, moderation logging + admin analytics enrichment.
- API endpoints handled:
  - Posts: GET/POST /api/posts, GET/PATCH/DELETE /api/posts/{postId}, GET/POST /api/posts/{postId}/comments
  - Messages: GET/POST /api/messages, GET/POST /api/messages/{userId}
  - Files: GET/POST /api/files, GET/DELETE /api/files/{fileId}, POST /api/files/{fileId}/share, POST /api/files/scan
  - Collaboration: GET/POST /api/collaboration, GET/POST/DELETE /api/collaboration/{spaceId}
  - Storage: POST /api/storage/presign, avatar upload + storage delete
  - Users: GET /api/users/{userId}/avatar
  - Moderation hardening (approve/delete/warn/suspend/ban/queue/logs): implemented under /api/moderation/* and /api/reports/* with admin hooks under /api/admin/*
  - Admin: analytics enhancements under /api/admin/*
  - Broad security pass across routes under /api/forums, /api/events, /api/categories, /api/posts, /api/comments, /api/messages, /api/users
- Tests written: Security and authorization test coverage and updates across middleware/security-critical paths; updated collaboration/files/messages/profile-edit tests (plus rate-limit and authz tests).
- Security work: Primary security owner.
  - `lib/security.ts` — centralized security utilities (~800 lines)
  - `middleware.ts` / `proxy.ts` — security headers + route protection
  - `lib/sanitization.ts` — HTML stripping / XSS mitigation
  - `lib/validation.ts` — request body validation and upload filename/MIME/size checks
  - `lib/rate-limit.ts` — API rate limiting (write/auth/read buckets)
  - ClamAV virus scanning: `lib/clamav.ts`, POST /api/files/scan, plus Docker/compose integration
  - Moderation guards: restricted-account checks for posts/messages/comments
  - Socket server: security additions in `socket-server/index.ts`
  - Security documentation: `CHECKPOINT_09_WEB_SECURITY.md`
- AI-related work: None identified in Harris’s commits (AI moderation/recommend/summarize implemented by Vickel’s work in shared commits).

**Student Name:** kevMkr (Kevin Makmur Kurniawan)

- Features implemented: Events (events list/detail pages, RSVP actions, event creation flow, event API extensions, dashboard calendar widget, event banner upload, and forum–event integration); Forums UI (forum list/detail, new thread page, comment + like buttons on thread pages, forum seed script); Files UI (early files page shell); Public profiles (public profile page /profile/[userId], profile banner display, report-user modal/button); Profile UX (profile stabilization, profile edit improvements, chat profile popover); Landing & layout (login entry, responsive layouts, sidebar/topbar polish); Admin & roles (admin users page updates, role-aware forums/connections UI, admin role API tweaks); Notifications (initial in-app notification model and topbar notification UI); Storage/banners (profile banner upload, user banner serving, entity banner upload for events/collab spaces/forums).
- API endpoints handled:
  - Authentication (legacy, pre–Better Auth): POST /api/auth/login, /api/auth/register, /api/auth/logout, /api/auth/refresh, GET /api/auth/me
  - Events: GET/POST /api/events, GET/PUT/DELETE /api/events/{eventId}, POST/DELETE /api/events/{eventId}/rsvp, GET /api/events/{eventId}/attendees
  - Users: GET/PATCH /api/users/{userId}, GET /api/users/{userId}/posts, GET /api/users/{userId}/events
  - Forums/categories: GET/POST /api/categories, category detail routes, forum-related post routes
  - Messages: DM route tweaks + GET /api/notifications
  - Storage/banners: POST /api/storage/upload-banner, GET /api/users/{userId}/banner, POST /api/storage/upload-entity-banner/{type}/{id}
  - Admin role management: PATCH /api/admin/users/{userId}/role
- Tests written: No major dedicated test suites authored by Kevin in git history (only minor test/line-fix commits). Main test coverage for his areas was added by others (e.g. events.test.tsx, api-events.test.ts).
- Security work:
  - Report user from profile (UI + report-profile modal)
  - Admin role management UI/API alignment
  - Not the primary security implementer; auth/events routes were later hardened by Harris and Vickel.
- AI-related work: None identified in Kevin’s commits.

**Student Name:** Vickel317 (Vickelsteins August Santoso)

- Features implemented:
  - Auth & onboarding: Migrated from Firebase to Better Auth (email/password + Google OAuth), unified API auth layer, profile setup flow, lecturer profile edit aligned with setup, mock OAuth for tests, OAuth error fixes
  - Dashboard & posts: Personalized dashboard with real connection counts, admin/user post CRUD, post likes, post visibility rules (pending/blocked), comment likes, comment tree sorting by engagement
  - Forums & moderation: Neon/Prisma ORM for forums/categories/comments, forum access control (only admins/lecturers create forums), moderator forum settings & member management, admin reports page + report modal, forum/thread/user reporting in DB and admin panel, streamlined admin nav (removed admin edit on posts/comments)
  - AI-powered UX: Async post moderation with profanity fallback, staff revert of AI decisions, thread summarization with DB cache, forum & thread recommendations with heuristic fallback, AI recommend UI, Reddit-style sidebar + polished navbar/topbar
  - Realtime messaging: Standalone Socket.IO server for DMs and collab chat, typing indicators, online status, message search modal, reconnect handling, group chat typing in collab spaces
  - Files & storage: MinIO upload routes (server + presigned), files UI, collab space file upload, avatar/banner/entity banner uploads, file sharing
  - Profiles & social: User profile/connections schema, follow model, privacy settings page, profile education fields, public profile view button, DM restriction rules (ALL, CONNECTIONS, LECTURERS, NONE)
  - Search: Global search across users, forums, and threads
  - Events & collaboration: Collab space API/UI polish, events UI integration (alongside teammates’ event work)
  - DevOps & docs: Docker + GitHub Actions CI/CD (app + socket server), deployment compose fixes, project overview/README/technology stack, full Swagger UI at /api-docs with OpenAPI spec for all endpoints, freshclam for ClamAV in Docker
  - UI polish: Thread/comment edit placement, admin/forums/files/collab/events UI refinements, removed notification feature (later cleanup)

- API endpoints handled (high-level, implemented/extended under `app/api/**`):
  - Auth: POST /api/auth/sign-up/email, /api/auth/sign-in/email, /api/auth/sign-out, GET /api/auth/get-session, plus `/api/auth/[...all]`
  - Users & profile: GET/PATCH/PUT/DELETE /api/users/{userId}, /api/users, /api/users/connections, /api/users/{userId}/follow, /api/users/{userId}/posts, /api/users/{userId}/events, /api/users/{userId}/avatar, /api/users/{userId}/banner, POST /api/profile/setup
  - Search: GET /api/search
  - Forums: GET/POST/DELETE /api/forums/{forumId}/membership, GET/PUT /api/forums/{forumId}/members
  - Categories: GET/POST /api/categories, GET/PATCH/DELETE /api/categories/{id}
  - Posts/comments: GET/POST /api/posts, GET/PATCH/DELETE /api/posts/{postId}, GET/POST /api/posts/{postId}/comments, /api/posts/{postId}/like, GET/PATCH/DELETE /api/comments/{commentId}, /api/comments/{commentId}/like
  - Messages: GET/POST /api/messages, /api/messages/{userId}, /api/messages/space/{spaceId}
  - Events: GET/POST /api/events, GET/PUT/DELETE /api/events/{eventId}, RSVP + attendees endpoints
  - Files/storage: GET/POST/DELETE /api/files, /api/files/{fileId}, /api/files/{fileId}/share, POST /api/files/scan, storage upload/presign/delete/avatar/banner/entity-banner
  - Collaboration: GET/POST /api/collaboration, GET/POST/DELETE /api/collaboration/{spaceId}
  - AI: GET /api/ai/health, POST /api/ai/moderate, GET /api/ai/recommend, /api/ai/recommend/forums, GET /api/ai/summarize/{postId}
  - Moderation: queue/logs and approve/delete/revert/warn/suspend/ban
  - Reports: GET/POST /api/reports, GET/PATCH /api/reports/{reportId}, review + action
  - Admin: GET /api/admin/analytics, user management + role assignment
  - Docs: GET /api/swagger

- Tests written:
  - Unit/component (Jest): login, register, profile, profile-edit, profile-setup, profile-education, admin, dashboard, forums, files, messages, collaboration, events, sidebar, topbar, post-comments, post-like, comment-sort, avatar-url, forum-access, categories-authorization, files-authorization, message-access, api-authorization, api-events, api-reports, api-search, rate-limit, security-critical
  - AI tests: ai-moderation, ai-summarize, ai-recommend-forums, ai-rate-limit
  - Integration (DB): categories, post-comments, post-visibility, profile-setup, collaboration, events
  - E2E (Playwright): e2e/smoke.spec.ts, e2e/login.spec.ts, e2e/register.spec.ts
  - CI: Jest + Playwright wired into GitHub Actions; Playwright artifacts ignored from git

- Security work:
  - Unified Better Auth session cookies (httpOnly, sameSite: lax, secure in prod)
  - Role-based authorization (student/lecturer/admin + per-forum moderators) with tests in api-authorization.test.ts, categories-authorization.test.ts, files-authorization.test.ts
  - Input validation (lib/validation.ts) and XSS sanitization (lib/sanitization.ts) on messages, posts, and comments — covered in security-critical.test.ts
  - Rate limiting on write/auth/read and AI endpoints (lib/rate-limit.ts, lib/ai/rate-limit.ts)
  - Upload security: dangerous filename rejection, extension/MIME checks, size limits
  - ClamAV integration: freshclam in Docker (your commit); virus scan route (POST /api/files/scan)
  - Account restrictions: blocked/banned/shadow-banned users prevented from messaging and commenting
  - DM privacy: canSendDirectMessage rules by restriction setting
  - Removed hardcoded mock identity; API keys/secrets env-only
  - (Teammate Harris also contributed dedicated security commits: “Security Critical Feature Done” and virus scan.)

- AI-related work:
  - Content moderation: Ollama-based async post moderation (lib/ai/post-moderation.ts), profanity heuristic fallback, moderation queue statuses, staff revert via POST /api/moderation/revert/{postId}
  - Thread summarization: GET /api/ai/summarize/{postId} with DB cache, refresh=1 bypass, model name from env (not hardcoded)
  - Recommendations: GET /api/ai/recommend (threads) and /api/ai/recommend/forums with heuristic fallback when Ollama is down or rate-limited
  - Prompts & schemas: lib/ai/prompts.ts, lib/ai/schemas.ts, ModerationResultSchema validation
  - Rate limits: per-route AI throttling (checkAiRateLimit)
  - Health check: GET /api/ai/health for Ollama availability
  - UI: AI recommend components, moderation status on posts, summary display on threads


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
# Edit .env.local — set DATABASE_URL, BETTER_AUTH_*, NEXT_PUBLIC_SOCKET_URL, etc.

npm ci
npx prisma migrate deploy
npx prisma generate

# Next.js + Socket.IO (one command)
npm run dev:all

# Or two terminals:
#   npm run dev
#   SOCKET_PORT=3100 npm run dev:socket

# Open http://localhost:3000
```

**Realtime chat:** set `NEXT_PUBLIC_SOCKET_URL=http://localhost:3100` in `.env.local` and run the socket server on the same port (`SOCKET_PORT=3100`). Messages are still saved via REST; Socket.IO delivers live updates.

### Google OAuth (optional)

1. In [Google Cloud Console](https://console.cloud.google.com/), create a **Web application** OAuth client.
2. Add authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google`
   - `https://e2526-wads-b4ac-02.csbihub.id/api/auth/callback/google`
3. Set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in `.env.local` (and GitHub Secrets for deploy).
4. Ensure `BETTER_AUTH_URL` matches the site origin (no trailing slash).

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
