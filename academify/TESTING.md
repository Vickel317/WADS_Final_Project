# Academify — Testing Documentation

This document satisfies the **COMP6703001** requirement for structured testing documentation, including AI feature tests.

## Test layers (how testing is organized)

| Layer | Tool | What it tests | Location |
|-------|------|---------------|----------|
| **Unit** | Jest | Pure functions, helpers, AI mappers | `__tests__/*.test.ts` |
| **Component / page** | Jest + React Testing Library | UI rendering, forms, interactions | `__tests__/*.test.tsx` |
| **API (mocked DB)** | Jest + `NextRequest` | Route handlers, auth guards, validation | `__tests__/api-*.test.ts`, `security-critical.test.ts` |
| **Integration (real DB)** | Jest + PostgreSQL | API ↔ Prisma ↔ PostgreSQL | `__tests__/integration/*.int.test.ts` |
| **E2E** | Playwright | Full browser smoke tests on running app | `e2e/*.spec.ts` |

### E2E vs Playwright — what are they?

- **E2E (end-to-end)** means testing the **whole application** as a user would: browser → Next.js server → API → database.
- **Playwright** is the tool that automates a real browser (Chromium) to click, type, and assert on pages.
- E2E is **slower** and runs against a **live server** (`npm run dev` or production). Unit/integration tests are faster and run in Node.

We use Playwright for **smoke tests** (pages load, no 500 errors). Deeper authenticated E2E flows can be added later.

### Is there a test for every page/component?

**Not yet.** Current coverage (~66% statements) focuses on critical paths:

- Auth pages, dashboard, forums, profile, files, messages, collaboration
- Security, authorization, AI moderation/summarize/recommend
- Integration tests for categories, comments, visibility

See the **coverage matrix** below for per-area status. Expand integration tests by copying patterns in `__tests__/integration/`.

---

## Running tests

```bash
# Unit + component + mocked API tests
npm test

# With coverage report
npm run test:coverage

# Real database integration (requires TEST_DATABASE_URL)
npm run test:integration

# E2E smoke tests (starts dev server automatically)
npm run test:e2e
```

For integration tests locally:

```bash
createdb academify_test   # once
TEST_DATABASE_URL=postgresql://user:pass@localhost:5432/academify_test npx prisma migrate deploy
npm run test:integration
```

---

## 10.1 Frontend testing

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

---

## 10.2 Backend & API testing

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

---

## 10.3 Security testing

| ID | Attack / case | Expected behavior | Test file | Status |
|----|---------------|-------------------|-----------|--------|
| SEC-01 | XSS in message body | Tags stripped before save | `security-critical.test.ts` | Pass |
| SEC-02 | XSS in comment body | Tags stripped (integration) | `integration/post-comments.int.test.ts` | Pass |
| SEC-03 | Dangerous upload filename | Rejected | `security-critical.test.ts` | Pass |
| SEC-04 | Restricted user creates post | 403 | `security-critical.test.ts` | Pass |
| SEC-05 | Non-author views pending post | Denied | `integration/post-visibility.int.test.ts` | Pass |
| SEC-06 | AI rate limit exceeded | 429 | `ai-rate-limit.test.ts` | Pass |
| SEC-07 | Input sanitization helper | HTML escaped | `security-critical.test.ts` | Pass |

---

## 10.4 AI functionality testing (mandatory)

### AI Feature 1: Content moderation (Ollama + heuristics)

| ID | Input | Expected output | Test file | Status |
|----|-------|-----------------|-----------|--------|
| AI-MOD-01 | Clean academic text | APPROVED | `ai-moderation.test.ts` | Pass |
| AI-MOD-02 | Profanity / slurs | FLAGGED or BLOCKED | `ai-moderation.test.ts` | Pass |
| AI-MOD-03 | Ollama timeout / failure | Heuristic fallback | `ai-moderation.test.ts` | Pass |
| AI-MOD-04 | Malformed model JSON | Safe fallback status | `ai-moderation.test.ts` | Pass |

**Failure handling:** `lib/ai/post-moderation.ts` falls back to profanity heuristics when Ollama is unavailable.

### AI Feature 2: Thread summarization

| ID | Input | Expected output | Test file | Status |
|----|-------|-----------------|-----------|--------|
| AI-SUM-01 | Valid post + comments | Summary JSON | `ai-summarize.test.ts` | Pass |
| AI-SUM-02 | Unauthenticated request | 401 | `ai-summarize.test.ts` | Pass |
| AI-SUM-03 | Hidden / pending post (non-author) | 404 | `ai-summarize.test.ts` | Pass |
| AI-SUM-04 | Rate limit exceeded | 429 | `ai-summarize.test.ts` | Pass |

**Failure handling:** Returns cached summary when available; surfaces 503 when Ollama fails and no cache exists.

### AI Feature 3: Forum & thread recommendations

| ID | Input | Expected output | Test file | Status |
|----|-------|-----------------|-----------|--------|
| AI-REC-01 | User with profile | Ranked suggestions | `ai-recommend-forums.test.ts` | Pass |
| AI-REC-02 | Ollama failure | Heuristic fallback list | `ai-recommend-forums.test.ts` | Pass |

### AI Feature 4: Comment sorting by engagement

| ID | Input | Expected output | Test file | Status |
|----|-------|-----------------|-----------|--------|
| AI-SORT-01 | Comments with like counts | Sorted by likes desc | `comment-sort.test.ts` | Pass |

---

## Coverage matrix (expand over time)

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

---

## CI/CD test pipeline

On push to `main` / `master`:

1. **Lint & Test** — `npm run lint`, `npm run build`, `npm test --coverage`
2. **Integration Tests** — Postgres service + `npm run test:integration`
3. **Docker build & deploy** — only if jobs 1–2 pass

---

## How to add a new integration test

1. Create `__tests__/integration/<feature>.int.test.ts`
2. Use `/** @jest-environment node */` at the top
3. Create test data with unique names (`Date.now()` marker)
4. Call real API handlers or Prisma directly
5. Clean up in `afterAll`
6. Run `npm run test:integration` against a **dedicated test database** (never production)

---

## Manual test checklist (demo / submission)

Run these in the browser on **localhost** and on **production** (`https://e2526-wads-b4ac-02.csbihub.id`). Tick when verified.

### Auth & onboarding
- [ ] Register with email/password → redirected to `/setup`
- [ ] Complete setup (education level + skills) → lands on `/dashboard`
- [ ] Google sign-in (if configured) → session works, no `state mismatch`
- [ ] Logout → protected routes redirect to login

### Forums & posts
- [ ] Browse forums, open a forum hub (Threads / Events / Collab tabs)
- [ ] Create thread, comment, like post/comment
- [ ] Moderator: edit forum description + banner (not name)
- [ ] Pending post hidden from other users; author can still view

### Events
- [ ] Create event from forum Events tab or `/events`
- [ ] RSVP / cancel RSVP; attendee count updates
- [ ] Past vs upcoming filter behaves correctly

### Files & collaboration
- [ ] Upload file in a collab space; file appears in space + Files page
- [ ] Rename file, move to another space (if member)
- [ ] Download via presigned URL works

### Messages & realtime
- [ ] DM another user; messages persist after refresh
- [ ] Socket server running (`npm run dev:all` or prod port **3100**)

### Moderation & admin
- [ ] Submit report on a post; mod/admin sees it in queue
- [ ] Admin analytics page loads (admin account only)
- [ ] AI moderation flags obvious profanity on new post

### AI features (document in demo)
- [ ] Thread summarize on a post with comments
- [ ] Forum recommendations on dashboard/profile
- [ ] Show fallback when Ollama is offline (heuristic still works)

### Deploy / infra
- [ ] `npm run build` passes
- [ ] MinIO uploads on prod (port **3099** / configured endpoint)
- [ ] Swagger UI at `/api-docs`

Export Postman collection or paste sample responses into the API tables above for grader evidence.

---

## How to document manual tests (Postman / demo)

For submission, export Postman collection or add rows to the tables above with:

- Request URL + method
- Sample JSON body
- Screenshot or pasted response
- Pass/Fail from manual run

Link Swagger UI: `/api-docs` on deployed app.
