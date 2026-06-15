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

![Alternative Text](path-to-your-image)

### 5.2 Architecture explanation

- **Frontend:** Next.js App Router with server components (data fetching) and client components (interactivity).
- **API:** REST handlers in `app/api/**` return JSON; business logic in `lib/**`.
- **Realtime:** Browser connects to a separate Socket.IO server (`socket-server/`, `lib/socket-client.ts`) for DMs and collab-space typing. Set `NEXT_PUBLIC_SOCKET_URL` in env (port **3100** in Docker/prod).
- **Database:** Prisma only — never accessed directly from the browser.
- **Security:** Session cookies (HTTP-only), middleware proxy, role checks in API routes, input sanitization.
- **AI:** Server-side calls to Ollama; rate-limited; fallbacks when AI is down.

---

## 6. API Reference (full)

Interactive documentation: **`/api-docs`** (Swagger UI). Machine-readable spec: **`/api/swagger`**.

### 6.1 Quick links

- **Interactive Documentation**: Visit [http://localhost:3000/api-docs](http://localhost:3000/api-docs) to explore the API with Swagger UI
- **OpenAPI Spec**: [/public/swagger.json](/public/swagger.json)

### 6.2 Base URL

```
http://localhost:3000/api
```

### 6.3 Authentication

The API uses [Better Auth](https://www.better-auth.com/) with **HTTP-only session cookies**. After signing in through `/api/auth/*`, the browser automatically sends the session cookie on same-origin requests. Protected endpoints reject unauthenticated callers with `401 Unauthorized`.

### Session Cookie

Better Auth sets an HTTP-only session cookie (configured in `lib/auth.ts`):

- `httpOnly: true` — not accessible to JavaScript
- `sameSite: "lax"` — mitigates CSRF for cross-site POST requests while allowing top-level navigation
- `secure: true` in production — HTTPS only

For same-origin browser clients, no manual `Authorization` header is required. API route handlers read the session via `getSessionUser()` / `verifyToken()`.

### 6.4 API endpoints

### Authentication Endpoints

Better Auth handles registration, login, logout, and session management. Primary routes:

```
POST /api/auth/sign-up/email
POST /api/auth/sign-in/email
POST /api/auth/sign-out
GET  /api/auth/get-session
```

#### 1. Register a New Account (legacy reference)
```
POST /api/auth/register
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "name": "John Doe"
}
```

**Success Response (201):**
```json
{
  "id": "user_123",
  "email": "user@example.com",
  "name": "John Doe",
  "createdAt": "2026-03-11T10:00:00Z"
}
```

#### 2. Login
```
POST /api/auth/login
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

**Success Response (200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user_123",
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

**Note:** The response includes an HTTP-only `auth_token` cookie.

#### 3. Get Current User
```
GET /api/auth/me
```

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Success Response (200):**
```json
{
  "id": "user_123",
  "email": "user@example.com",
  "name": "John Doe",
  "role": "student",
  "createdAt": "2026-03-11T10:00:00Z",
  "updatedAt": "2026-03-11T15:00:00Z"
}
```

#### 4. Logout
```
POST /api/auth/logout
```

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Success Response (200):**
```json
{
  "message": "Logged out successfully"
}
```

**Note:** The `auth_token` cookie is cleared automatically.

#### 5. Refresh Access Token
```
POST /api/auth/refresh
```

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Success Response (200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 3600
}
```

### User Endpoints

#### 1. Get User Profile
```
GET /api/users/:userId
```

**Parameters:**
- `userId` (path, required): User ID (e.g., "user_1")

**Success Response (200):**
```json
{
  "id": "user_1",
  "email": "john@example.com",
  "name": "John Doe",
  "role": "student",
  "bio": "Computer Science student",
  "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=john",
  "createdAt": "2026-01-15T10:00:00Z",
  "updatedAt": "2026-03-10T15:00:00Z"
}
```

#### 2. Update Own Profile
```
PUT /api/users/:userId
```

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Request Body:**
```json
{
  "name": "John Doe Updated",
  "bio": "Updated bio text",
  "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=newavatar"
}
```

**Note:** Users can only update their own profile. The `userId` in the URL must match the authenticated user's ID.

**Success Response (200):**
```json
{
  "id": "user_1",
  "email": "john@example.com",
  "name": "John Doe Updated",
  "role": "student",
  "bio": "Updated bio text",
  "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=newavatar",
  "createdAt": "2026-01-15T10:00:00Z",
  "updatedAt": "2026-03-11T12:00:00Z"
}
```

#### 3. Delete Own Account
```
DELETE /api/users/:userId
```

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Note:** Users can only delete their own account. The `userId` in the URL must match the authenticated user's ID.

**Success Response (200):**
```json
{
  "message": "Account deleted successfully"
}
```

#### 4. Get User's Posts
```
GET /api/users/:userId/posts
```

**Parameters:**
- `userId` (path, required): User ID

**Success Response (200):**
```json
{
  "data": [
    {
      "id": "post_1",
      "userId": "user_1",
      "title": "Advanced JavaScript Patterns",
      "content": "A comprehensive guide to design patterns...",
      "category": "Technology",
      "createdAt": "2026-03-05T10:00:00Z",
      "updatedAt": "2026-03-05T10:00:00Z",
      "likes": 42,
      "comments": 8
    }
  ],
  "total": 1,
  "userId": "user_1"
}
```

#### 5. Get User's Events
```
GET /api/users/:userId/events
```

**Parameters:**
- `userId` (path, required): User ID
- `status` (query, optional): Filter by status - "scheduled", "completed", or "cancelled"

**Query Example:**
```
GET /api/users/user_1/events?status=scheduled
```

**Success Response (200):**
```json
{
  "data": [
    {
      "id": "event_1",
      "userId": "user_1",
      "title": "JavaScript Study Session",
      "description": "Advanced JavaScript patterns and best practices discussion",
      "date": "2026-03-15T14:00:00Z",
      "duration": 120,
      "location": "Library - Room 301",
      "category": "Study Session",
      "participants": ["user_1", "user_3", "user_4"],
      "status": "scheduled"
    }
  ],
  "total": 1,
  "userId": "user_1"
}
```

### Event Endpoints

#### 1. List Events
```
GET /api/events
```

**Query Parameters:**
- `filter` (optional): "upcoming" or "past" - Filter events by date
- `page` (optional): Page number (default: 1)

**Query Examples:**
```
GET /api/events
GET /api/events?filter=upcoming
GET /api/events?filter=upcoming&page=2
```

**Success Response (200):**
```json
{
  "data": [
    {
      "id": "event_1",
      "userId": "user_1",
      "title": "JavaScript Study Session",
      "description": "Advanced JavaScript patterns discussion",
      "date": "2026-03-15T14:00:00Z",
      "duration": 120,
      "location": "Library - Room 301",
      "category": "Study Session",
      "maxAttendees": 20,
      "attendees": ["user_1", "user_3", "user_4"],
      "status": "scheduled",
      "createdAt": "2026-03-10T10:00:00Z",
      "updatedAt": "2026-03-10T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 10,
    "total": 5,
    "totalPages": 1
  }
}
```

#### 2. Get Event Details with Attendees
```
GET /api/events/:eventId
```

**Parameters:**
- `eventId` (path, required): Event ID

**Success Response (200):**
```json
{
  "id": "event_1",
  "userId": "user_1",
  "title": "JavaScript Study Session",
  "description": "Advanced JavaScript patterns discussion",
  "date": "2026-03-15T14:00:00Z",
  "duration": 120,
  "location": "Library - Room 301",
  "category": "Study Session",
  "maxAttendees": 20,
  "attendees": ["user_1", "user_3", "user_4"],
  "status": "scheduled",
  "createdAt": "2026-03-10T10:00:00Z",
  "updatedAt": "2026-03-10T10:00:00Z"
}
```

#### 3. Create New Event
```
POST /api/events
```

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Request Body:**
```json
{
  "title": "Python Workshop",
  "description": "Interactive Python programming workshop",
  "date": "2026-03-25T18:00:00Z",
  "duration": 180,
  "location": "Computer Lab - Building A",
  "category": "Workshop",
  "maxAttendees": 30
}
```

**Success Response (201):**
```json
{
  "id": "event_999",
  "userId": "user_1",
  "title": "Python Workshop",
  "description": "Interactive Python programming workshop",
  "date": "2026-03-25T18:00:00Z",
  "duration": 180,
  "location": "Computer Lab - Building A",
  "category": "Workshop",
  "maxAttendees": 30,
  "attendees": ["user_1"],
  "status": "scheduled",
  "createdAt": "2026-03-11T10:00:00Z",
  "updatedAt": "2026-03-11T10:00:00Z"
}
```

#### 4. Update Own Event
```
PUT /api/events/:eventId
```

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Parameters:**
- `eventId` (path, required): Event ID (must be creator's event)

**Request Body:**
```json
{
  "title": "JavaScript Study Session - Updated",
  "description": "Updated description",
  "maxAttendees": 25,
  "status": "completed"
}
```

**Note:** Users can only update their own events.

**Success Response (200):**
```json
{
  "id": "event_1",
  "userId": "user_1",
  "title": "JavaScript Study Session - Updated",
  "description": "Updated description",
  "date": "2026-03-15T14:00:00Z",
  "duration": 120,
  "location": "Library - Room 301",
  "category": "Study Session",
  "maxAttendees": 25,
  "attendees": ["user_1", "user_3", "user_4"],
  "status": "completed",
  "createdAt": "2026-03-10T10:00:00Z",
  "updatedAt": "2026-03-11T12:00:00Z"
}
```

#### 5. Delete Own Event
```
DELETE /api/events/:eventId
```

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Parameters:**
- `eventId` (path, required): Event ID (must be creator's event)

**Note:** Users can only delete their own events.

**Success Response (200):**
```json
{
  "message": "Event deleted successfully"
}
```

#### 6. RSVP to Event
```
POST /api/events/:eventId/rsvp
```

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Parameters:**
- `eventId` (path, required): Event ID to attend

**Success Response (200):**
```json
{
  "message": "Successfully RSVP'd to event",
  "event": {
    "id": "event_1",
    "userId": "user_1",
    "title": "JavaScript Study Session",
    "description": "Advanced JavaScript patterns discussion",
    "date": "2026-03-15T14:00:00Z",
    "duration": 120,
    "location": "Library - Room 301",
    "category": "Study Session",
    "maxAttendees": 20,
    "attendees": ["user_1", "user_3", "user_4", "user_6"],
    "status": "scheduled",
    "createdAt": "2026-03-10T10:00:00Z",
    "updatedAt": "2026-03-11T12:00:00Z"
  }
}
```

**Error Scenarios:**
- **400**: Already attending or event at full capacity
- **404**: Event not found
- **401**: Not authenticated

#### 7. Cancel RSVP
```
DELETE /api/events/:eventId/rsvp
```

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Parameters:**
- `eventId` (path, required): Event ID to cancel attendance

**Success Response (200):**
```json
{
  "message": "Successfully cancelled RSVP",
  "event": {
    "id": "event_1",
    "userId": "user_1",
    "title": "JavaScript Study Session",
    "description": "Advanced JavaScript patterns discussion",
    "date": "2026-03-15T14:00:00Z",
    "duration": 120,
    "location": "Library - Room 301",
    "category": "Study Session",
    "maxAttendees": 20,
    "attendees": ["user_1", "user_3", "user_4"],
    "status": "scheduled",
    "createdAt": "2026-03-10T10:00:00Z",
    "updatedAt": "2026-03-11T12:00:00Z"
  }
}
```

**Error Scenarios:**
- **400**: Not attending this event
- **404**: Event not found
- **401**: Not authenticated

#### 8. Get Attendee List
```
GET /api/events/:eventId/attendees
```

**Parameters:**
- `eventId` (path, required): Event ID

**Success Response (200):**
```json
{
  "eventId": "event_1",
  "eventTitle": "JavaScript Study Session",
  "totalAttendees": 3,
  "maxAttendees": 20,
  "attendees": [
    {
      "id": "user_1",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "student",
      "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=john"
    },
    {
      "id": "user_3",
      "name": "Mike Johnson",
      "email": "mike@example.com",
      "role": "student",
      "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=mike"
    },
    {
      "id": "user_4",
      "name": "Emma Wilson",
      "email": "emma@example.com",
      "role": "student",
      "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=emma"
    }
  ]
}
```

### 6.5 Error responses

All error responses follow a consistent format:

```json
{
  "error": "Error message describing what went wrong"
}
```

### Common HTTP Status Codes

- **200 OK**: Request successful
- **201 Created**: Resource created successfully
- **400 Bad Request**: Invalid request body or missing required fields
- **401 Unauthorized**: Missing or invalid authentication token
- **404 Not Found**: Resource not found
- **500 Internal Server Error**: Server-side error

### 6.6 Rate limiting

Global API rate limiting is enforced in `proxy.ts` (Next.js middleware) using client IP:

| Traffic type | Default limit | Applies to |
|--------------|---------------|------------|
| Read (`GET`, etc.) | 120 requests / minute | All `/api/*` read routes |
| Write (`POST`, `PUT`, `PATCH`, `DELETE`) | 30 requests / minute | All `/api/*` write routes |
| Auth (`/api/auth/*`) | 10 requests / minute | Login, registration, session |

When exceeded, the API returns `429 Too Many Requests` with `Retry-After` and error code `RATE_LIMITED`.

AI-specific routes (`/api/ai/recommend`, `/api/ai/summarize`) additionally enforce a per-user cooldown (default 15 seconds) via `lib/ai/rate-limit.ts`.

Limits are configurable through environment variables: `RATE_LIMIT_READ_MAX`, `RATE_LIMIT_WRITE_MAX`, `RATE_LIMIT_AUTH_MAX`, and corresponding `*_WINDOW_MS` values.

### 6.7 CORS policy

The API accepts requests from:
- `http://localhost:3000` (development)
- `https://academify.example.com` (production)

### 6.8 Testing the API

### Using cURL

```bash
# Register
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePassword123!",
    "name": "John Doe"
  }'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePassword123!"
  }'

# Get current user (replace TOKEN with your JWT)
curl -X GET http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer TOKEN"

# Get user profile
curl -X GET http://localhost:3000/api/users/user_1

# Update user profile (replace TOKEN with your JWT)
curl -X PUT http://localhost:3000/api/users/user_1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{
    "name": "John Doe Updated",
    "bio": "Updated bio",
    "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=newavatar"
  }'

# Get user's posts
curl -X GET http://localhost:3000/api/users/user_1/posts

# Get user's events
curl -X GET http://localhost:3000/api/users/user_1/events

# Get user's scheduled events only
curl -X GET http://localhost:3000/api/users/user_1/events?status=scheduled

# Delete user account (replace TOKEN with your JWT)
curl -X DELETE http://localhost:3000/api/users/user_1 \
  -H "Authorization: Bearer TOKEN"

# List all upcoming events
curl -X GET http://localhost:3000/api/events?filter=upcoming

# Get specific event details
curl -X GET http://localhost:3000/api/events/event_1

# Create a new event (replace TOKEN with your JWT)
curl -X POST http://localhost:3000/api/events \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{
    "title": "Python Workshop",
    "description": "Interactive Python programming workshop",
    "date": "2026-03-25T18:00:00Z",
    "duration": 180,
    "location": "Computer Lab",
    "category": "Workshop",
    "maxAttendees": 30
  }'

# Update an event (replace TOKEN and event_1 with your JWT and event ID)
curl -X PUT http://localhost:3000/api/events/event_1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{
    "maxAttendees": 25,
    "status": "completed"
  }'

# RSVP to an event (replace TOKEN with your JWT)
curl -X POST http://localhost:3000/api/events/event_1/rsvp \
  -H "Authorization: Bearer TOKEN"

# Cancel RSVP (replace TOKEN with your JWT)
curl -X DELETE http://localhost:3000/api/events/event_1/rsvp \
  -H "Authorization: Bearer TOKEN"

# Get attendee list for an event
curl -X GET http://localhost:3000/api/events/event_1/attendees

# Delete an event (replace TOKEN and event_1 with your JWT and event ID)
curl -X DELETE http://localhost:3000/api/events/event_1 \
  -H "Authorization: Bearer TOKEN"
```

### Using Swagger UI

1. Navigate to [http://localhost:3000/api-docs](http://localhost:3000/api-docs)
2. Click on an endpoint to expand it
3. Click "Try it out" button
4. Fill in the required parameters
5. Click "Execute" to send the request

### 6.9 Security considerations

1. **Session-based auth (Better Auth)**: Sessions are stored server-side; cookies are HTTP-only and cannot be read by client JavaScript.
2. **Password hashing**: Passwords are hashed by Better Auth before storage.
3. **CSRF mitigation**: Session cookies use `SameSite=Lax`. All state-changing requests are same-origin from the Next.js frontend, which prevents cross-site cookie submission on unsafe methods.
4. **Input sanitization**: Messages, posts, and comments are sanitized server-side via `sanitizeText()` before persistence (HTML entity escaping).
5. **RBAC**: Role checks on admin, moderation, post, and file routes.
6. **File upload validation**: MIME allowlist, 50 MB size cap, and dangerous filename blocking via `validateUploadFileName()`.
7. **Security headers**: HSTS (HTTPS), `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, and Content-Security-Policy on page routes — applied via `proxy.ts` for both pages and API routes.
8. **Rate limiting**: Global IP-based limits on all API routes; additional per-user cooldown on AI routes.
9. **Realtime transport**: Socket.IO server (`socket-server/index.ts`) with CORS restricted to app origins; clients connect via `NEXT_PUBLIC_SOCKET_URL` (no server-to-server emit relay).
10. **Known limitations**:
    - **Virus/malware scanning**: Production Docker images run `clamscan` with definitions from `freshclam` at build time. Local dev skips scanning when `clamscan` is not installed.
    - **Image moderation**: Text content is AI-moderated; image attachments and avatars are not scanned for explicit content.

### 6.10 Additional endpoints

Forums, threads, posts, comments, messages, files, collaboration spaces, moderation, reports, AI routes, and admin APIs are implemented — explore them in Swagger UI at `/api-docs` or via route handlers under `app/api/`.

### 6.11 Support

For API issues or questions, please contact: support@academify.com

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

Detailed test cases: **§10.4** below.

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
- [ ] Register with email/password → redirected to `/setup`
- [ ] Complete setup (education level + skills) → lands on `/dashboard`
- [ ] Google sign-in (if configured) → session works, no `state mismatch`
- [ ] Logout → protected routes redirect to login

#### Forums & posts
- [ ] Browse forums, open a forum hub (Threads / Events / Collab tabs)
- [ ] Create thread, comment, like post/comment
- [ ] Moderator: edit forum description + banner (not name)
- [ ] Pending post hidden from other users; author can still view

#### Events
- [ ] Create event from forum Events tab or `/events`
- [ ] RSVP / cancel RSVP; attendee count updates
- [ ] Past vs upcoming filter behaves correctly

#### Files & collaboration
- [ ] Upload file in a collab space; file appears in space + Files page
- [ ] Rename file, move to another space (if member)
- [ ] Download via presigned URL works

#### Messages & realtime
- [ ] DM another user; messages persist after refresh
- [ ] Socket server running (`npm run dev:all` or prod port **3100**)

#### Moderation & admin
- [ ] Submit report on a post; mod/admin sees it in queue
- [ ] Admin analytics page loads (admin account only)
- [ ] AI moderation flags obvious profanity on new post

#### AI features (document in demo)
- [ ] Thread summarize on a post with comments
- [ ] Forum recommendations on dashboard/profile
- [ ] Show fallback when Ollama is offline (heuristic still works)

#### Deploy / infra
- [ ] `npm run build` passes
- [ ] MinIO uploads on prod (port **3099** / configured endpoint)
- [ ] Swagger UI at `/api-docs`

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

**Student Name:** kevMk (Kevin Makmur Kurniawan)


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
