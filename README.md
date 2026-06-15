# Final Project – Web Application Development and Security

Course Code: COMP6703001
Course Name: Web Application Development and Security
Institution: BINUS University International

# ----- Academify -----

## 1. Project Information

Project Title: Academify
Project Domain: Student Community & Collaboration Platform
Class: L4AC
Group Members:

| Name | ID | Role | GitHub Username |
|------|-----|------|-----------------|
| Vickelsteins August Santoso | 2802505941 | Fullstack Programmer | Vickel317 |
| Harris Ekaputra Suryadi | 2802400502 | Fullstack Programmer | HES2209 |
| Kevin Makmur Kurniawan | 2802547553 | Fullstack Programmer | kevMkr |

## 2. Instructor & Repository Access

This repository must be shared with:

- Instructor: Ida Bagus Kerthyayana Manuaba -> Email: imanuaba@binus.edu, GitHub: bagzcode
- Instructor Assistant: Juwono -> Email: juwono@binus.edu, GitHub: Juwono136

## 3. Project Overview

Academify is an AI-powered academic social platform designed to connect students, enabling collaboration, discussion, and knowledge sharing in a unified environment.

**Problem Statement:**

Students usually have trouble finding an environment that supports collaboration. Some platforms are incompatible or require payment to collaborate with each other, which can be difficult for students. Most websites or applications only support 1 or 2 kinds of files for collaboration. Thus, this web application targets people with an academic background who have an interest in sharing their projects, collaborating, and accessing more information from experienced academic people. Allowing people to collaborate with various file types without changing or moving to another platform.

Main features:

- Discussion Forums with category filtering and search
- Secure File Sharing (PDF, PNG, JPG, JPEG, DOCX)
- Event & Study Session Scheduling
- User Profiles & Authentication
- Asynchronous Messaging System
- Role-Based Access Control (Student, Moderator, Admin)

## 4. Technology Stack (MANDATORY)

| Layer | Technology |
|-------|------------|
| Frontend | Next.js |
| Backend | Node.js / Next.js API Routes |
| API | REST API |
| Database | PostgreSQL (Neon) |
| ORM | Prisma |
| Authentication | Better Auth |
| Real-time | Socket.IO |
| Object Storage | MinIO (S3-compatible) |
| AI | Ollama (local LLM) |
| Containerization | Docker |
| Deployment | Cloudflare |
| Version Control | GitHub |

## 5. System Architecture

### 5.1 Architecture Diagram

![ArchitectureDesignDiagram](images/ArchitectureDesignDiagram.png)

### 5.2 Architecture Explanation

Our application is built on a **client-server architecture** utilizing the Next.js framework. The platform provides a multi-feature academic social experience: Students can participate in discussion forums, share files, schedule events, and collaborate in real-time through messaging, while Moderators and Admins maintain community standards and platform integrity.

**Layered Architecture Model**

The system follows a layered architecture to ensure separation of responsibilities:

1. **Frontend**: User interface rendering, client-side validation, and user interaction. Constructed using Next.js and React, running in the user's browser.
2. **Backend**: Authentication, authorization, business rules, AI integration, and API routing. Implemented via Next.js API Routes (Route Handlers).
3. **Database Layer**: Persistent storage and data integrity using PostgreSQL managed through Prisma ORM.

### 5.3 System Component Breakdown

- **Frontend**
    - Framework Ecosystem: Built on Next.js and React, utilizing industry-standard design patterns to deliver a responsive and interactive user interface.
    - Dynamic Rendering: Utilizes dynamically rendered components for real-time state updates such as notifications and messaging.
    - Isolation of Concerns: The frontend operates with strict isolation from the data layer. It holds zero direct access to the database, communicating exclusively with the backend via structured API endpoints.

- **Backend & API Layer**
    - API Architecture: Implemented via Next.js API Routes (Route Handlers), serving as the central orchestration layer for business logic.
    - Authentication & Authorization: Built on top of Better Auth, providing a flexible, secure authentication layer. All protected endpoints are intercepted by middleware that verifies session tokens and injects user credentials into the route context.
    - AI Integration: Orchestrates AI-driven features by acting as a secure proxy to the locally hosted Ollama instance. The AI engine has no exposure to environment secrets, API keys, or direct database access.

- **Database & Infrastructure Layer**
    - Persistence & ORM: Employs a PostgreSQL relational database managed through the Prisma ORM. Prisma enforces type safety, streamlines migrations, and mitigates SQL injection risks.
    - Object Storage: MinIO (S3-compatible) for file uploads including images, documents, and collaboration files.
    - Real-time Communication: Socket.IO server for real-time notifications and messaging features.

- **Security & Validation Architecture**
    - Input Validation: Shared validators on API bodies and `sanitizeText()` on messages, posts, and comments to prevent XSS attacks.
    - File Upload Security: MIME allowlist, size caps, and dangerous filename blocking.
    - Rate Limiting: Global IP-based limits on all `/api/*` routes; per-user cooldown on AI routes.

## 6. API Design (MANDATORY)

**All API's begin with /api/.**

### Endpoints for Authentication

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| /auth/sign-in/email | POST | Log-in with email and password | No |
| /auth/sign-up/email | POST | Register a new account | No |
| /auth/sign-out | POST | Log out current user | Yes |
| /auth/me | GET | Retrieve current user session | Yes |

### Endpoints for User Management

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| /users/ | GET | Retrieve all users | Yes |
| /users/{userId} | GET | Retrieve a specific user's profile | Yes |
| /users/{userId}/posts | GET | Retrieve posts by a specific user | Yes |
| /users/{userId}/events | GET | Retrieve events by a specific user | Yes |
| /users/{userId}/avatar | PUT | Update user avatar | Yes |
| /users/{userId}/banner | PUT | Update user banner | Yes |
| /users/{userId}/follow | POST | Follow a user | Yes |
| /users/connections | GET | Retrieve user connections | Yes |
| /profile/setup | POST | Complete profile setup | Yes |

### Endpoints for Forum & Posts

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| /posts/ | GET | Retrieve all posts | Yes |
| /posts/ | POST | Create a new post | Yes |
| /posts/{postId} | GET | Retrieve a specific post | Yes |
| /posts/{postId} | PATCH | Update a post | Yes |
| /posts/{postId} | DELETE | Delete a post | Yes |
| /posts/{postId}/like | POST | Like/unlike a post | Yes |
| /posts/{postId}/comments | GET | Retrieve comments for a post | Yes |
| /posts/{postId}/comments | POST | Add a comment to a post | Yes |
| /comments/{commentId} | GET | Retrieve a specific comment | Yes |
| /comments/{commentId} | PATCH | Update a comment | Yes |
| /comments/{commentId} | DELETE | Delete a comment | Yes |
| /comments/{commentId}/like | POST | Like/unlike a comment | Yes |

### Endpoints for Categories & Forums

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| /categories/ | GET | Retrieve all categories | Yes |
| /categories/{id} | GET | Retrieve a specific category | Yes |
| /forums/{forumId}/members | GET | Retrieve forum members | Yes |
| /forums/{forumId}/membership | POST | Join/leave a forum | Yes |

### Endpoints for Events

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| /events/ | GET | Retrieve all events | Yes |
| /events/ | POST | Create a new event | Yes |
| /events/{eventId} | GET | Retrieve a specific event | Yes |
| /events/{eventId} | PATCH | Update an event | Yes |
| /events/{eventId} | DELETE | Delete an event | Yes |
| /events/{eventId}/rsvp | POST | RSVP to an event | Yes |
| /events/{eventId}/attendees | GET | Retrieve event attendees | Yes |

### Endpoints for Messaging

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| /messages/ | GET | Retrieve user's messages | Yes |
| /messages/ | POST | Send a new message | Yes |
| /messages/{userId} | GET | Retrieve conversation with user | Yes |
| /messages/space/{spaceId} | GET | Retrieve space messages | Yes |

### Endpoints for File Management

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| /files/ | GET | Retrieve user's files | Yes |
| /files/ | POST | Upload a file | Yes |
| /files/{fileId} | GET | Retrieve a specific file | Yes |
| /files/{fileId} | DELETE | Delete a file | Yes |
| /files/{fileId}/share | POST | Share a file | Yes |
| /files/scan | POST | Scan file for malware | Yes |
| /storage/upload | POST | Upload to object storage | Yes |
| /storage/presign | POST | Get presigned upload URL | Yes |
| /storage/delete | POST | Delete from object storage | Yes |

### Endpoints for Moderation & Admin

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| /admin/users | GET | Retrieve all users (admin) | Yes (Admin) |
| /admin/users/{userId} | GET | Retrieve user details (admin) | Yes (Admin) |
| /admin/users/{userId}/role | PATCH | Update user role | Yes (Admin) |
| /admin/analytics | GET | Retrieve platform analytics | Yes (Admin) |
| /reports/ | GET | Retrieve all reports | Yes (Moderator) |
| /reports/{reportId} | GET | Retrieve a specific report | Yes (Moderator) |
| /reports/{reportId}/review | POST | Review a report | Yes (Moderator) |
| /reports/{reportId}/action | POST | Take action on report | Yes (Moderator) |
| /moderation/queue | GET | Retrieve moderation queue | Yes (Moderator) |
| /moderation/approve/{postId} | POST | Approve a post | Yes (Moderator) |
| /moderation/delete/{postId} | POST | Delete flagged content | Yes (Moderator) |
| /moderation/revert/{postId} | POST | Revert moderation action | Yes (Moderator) |
| /moderation/warn/{userId} | POST | Warn a user | Yes (Moderator) |
| /moderation/suspend/{userId} | POST | Suspend a user | Yes (Moderator) |
| /moderation/ban/{userId} | POST | Ban a user | Yes (Moderator) |
| /moderation/logs | GET | Retrieve moderation logs | Yes (Moderator) |

### Endpoints for AI Features

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| /ai/moderate | POST | AI content moderation | Yes |
| /ai/summarize/{postId} | POST | Summarize a post | Yes |
| /ai/recommend | GET | AI topic recommendations | Yes |
| /ai/recommend/forums | GET | AI forum recommendations | Yes |
| /ai/health | GET | Check AI service health | Yes |

### Endpoints for Collaboration

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| /collaboration/ | GET | Retrieve collaboration spaces | Yes |
| /collaboration/ | POST | Create a collaboration space | Yes |
| /collaboration/{spaceId} | GET | Retrieve a specific space | Yes |
| /collaboration/{spaceId} | PATCH | Update a space | Yes |
| /collaboration/{spaceId} | DELETE | Delete a space | Yes |

### Miscellaneous Endpoints

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| /search/ | GET | Search posts, users, forums | Yes |
| /swagger/ | GET | API documentation | No |

Example: **POST /api/posts**

- Request JSON

```json
{
  "title": "How to implement RBAC in Next.js?",
  "content": "I'm looking for best practices on role-based access control...",
  "forumId": "clxyz123..."
}
```

- Response JSON

```json
{
  "success": true,
  "data": {
    "postID": "clxyz456...",
    "title": "How to implement RBAC in Next.js?",
    "content": "I'm looking for best practices on role-based access control...",
    "moderationStatus": "PENDING",
    "createdAt": "2026-06-16T10:00:00.000Z"
  }
}
```

## 7. Database Design

The database schema consists of the following key models:

- **User**: Core user profile with role-based attributes (Student, Lecturer, Admin), privacy settings, and collaboration metadata.
- **ForumHub**: Discussion forums with moderators and members.
- **Post**: Forum posts with moderation status, AI scoring, and summaries.
- **Comment**: Nested comments on posts with like support.
- **Event**: Scheduled events with RSVP and attendee tracking.
- **File**: File attachments linked to posts or collaboration spaces.
- **Message**: Direct messaging between users and within collaboration spaces.
- **CollabSpace**: Collaboration spaces within forums with role-based access.
- **ReportReview**: User-submitted reports for content moderation.
- **ModerationActionLog**: Audit log for all moderation actions taken.
- **AuthUser / AuthSession / AuthAccount**: Better Auth tables for authentication.

## 8. AI Features (MANDATORY)

### 8.1 AI Features List

- **AI Dependencies:**
    - Ollama (Local LLM Provider)

| AI Feature | Purpose | AI Type |
|------------|---------|---------|
| AI Content Moderation | Automatically detect and flag inappropriate content, spam, harassment, and policy violations in real-time before publication | NLP |
| Smart Topic Recommendation | Personalize the user's feed with topics and discussions that match their academic interests and engagement patterns using semantic similarity | NLP |
| Thread Summarization | Generate concise summaries of discussion threads to help users quickly understand lengthy conversations | NLP |

### 8.2 AI Integration Flow

- **AI Content Moderation**
    - All posts, comments, and messages are sent to the local Ollama instance for moderation analysis before publication. Content is analyzed for policy violations, spam, and harassment. Flagged content enters a moderation queue for human review.
- **Smart Topic Recommendation**
    - User interests and forum metadata are processed through the Ollama instance to compute semantic similarity and rank relevant forums. Recommendations are personalized based on the user's academic interests and engagement patterns.
- **Thread Summarization**
    - Approved posts and their comments are sent to the Ollama instance to generate concise summaries. Summaries are cached and updated when new comments are added.

## 9. Security Implementation (MANDATORY)

- **Input Sanitization: Prisma ORM** Prisma automatically sanitizes all inputs to its methods, and scrubs them of possible SQL injection attempts.
- **Input Validation: Shared Validators** API body validators ensure user input stays in-line with expectations and database schema. `sanitizeText()` is applied on messages, posts, and comments to prevent XSS attacks.
- **AI: Ollama (Local LLM)** All AI features run against a locally hosted Ollama instance. No user data is sent to external AI services. Per-user cooldown on AI routes prevents abuse.
- **Authentication & Authorization: Better Auth** All routes requiring auth uses a wrapper function that verifies the session token, decodes the authentication context, and injects user credentials directly into the route context. Role-based authorization distinguishes students, moderators, and admins.
- **File Upload Security** MIME allowlist, size caps, and dangerous filename blocking. ClamAV integration for virus scanning in production.
- **Rate Limiting** Global IP-based limits on all `/api/*` routes via `proxy.ts`; per-user cooldown on AI routes.
- **Security Headers** HSTS, CSP, X-Frame-Options, nosniff on pages and API routes via `proxy.ts`.

## 10\. Testing Documentation (VERY IMPORTANT)

### 10.1 Frontend Testing

Frontend tests use Jest with React Testing Library for unit tests and Playwright for end-to-end tests.

Run tests:

```bash
npm test              # Unit tests
npm run test:integration  # Integration tests
npm run test:e2e      # End-to-end tests
```

### 10.2 Backend Testing

Backend API tests are written using Jest. All relevant test files are available in the `__tests__` directory.

| Test File | What It Verifies |
|-----------|------------------|
| `security-critical.test.ts` | Dangerous filenames, message/post/comment XSS sanitization, restricted users |
| `api-authorization.test.ts` | RBAC on admin, posts, moderation routes |
| `files-authorization.test.ts` | File access authorization |
| `categories-authorization.test.ts` | Forum creation restricted to lecturers/admins |
| `ai-rate-limit.test.ts` | AI route per-user cooldown |
| `rate-limit.test.ts` | Global API rate limit presets |
| `ai-moderation.test.ts` | AI moderation pipeline |
| `ai-summarize.test.ts` | AI thread summarization |
| `ai-recommend-forums.test.ts` | AI forum recommendations |
| `message-access.test.ts` | Message access control |
| `forum-access.test.ts` | Forum access permissions |
| `post-like.test.ts` | Post like functionality |
| `post-comments.test.ts` | Post comment functionality |
| `comment-sort.test.ts` | Comment sorting |
| `api-search.test.ts` | Search functionality |
| `api-reports.test.ts` | Report system |
| `api-events.test.ts` | Event management |
| `profile-education.test.ts` | Profile education features |

### 10.3 Security Testing

Security tests were run to test for XSS, IDOR, and authorization bypass scenarios.

| Test Case | Attack Type | Expected Behaviour | Result |
|-----------|-------------|-------------------|--------|
| SEC-01 | XSS | Inserting `<script>alert(1)</script>` into post content | Sanitized by `sanitizeText()`, no alert pop up |
| SEC-02 | IDOR / Auth Bypass | Accessing another user's data by modifying request parameters | Only shows results for the current user |
| SEC-03 | File Upload | Uploading malicious file types | Blocked by MIME allowlist |
| SEC-04 | Rate Limiting | Exceeding rate limits on AI routes | Returns `429 RATE_LIMITED` |

### 10.4 AI Functionality Testing (MANDATORY)

For **each AI feature**, complete the table below.

*AI Feature: Content Moderation*

| Test Case | Input | Expected Output | Actual Result | Status |
|-----------|-------|-----------------|---------------|--------|
| AI-01 | Valid input (appropriate post content) | Correct response (content approved) | Content approved and published | Pass |
| AI-02 | Invalid input (post with profanity/spam) | Error / fallback (content flagged for moderation) | Content flagged, enters moderation queue | Pass |
| AI-03 | Prompt injection (malicious content designed to bypass moderation) | Sanitized (flagged by moderation pipeline) | Content flagged regardless of injection attempt | Pass |

*AI Feature: Topic Recommendation*

| Test Case | Input | Expected Output | Actual Result | Status |
|-----------|-------|-----------------|---------------|--------|
| AI-01 | Valid input (user with defined interests) | Correct response (relevant forums returned) | Relevant forums ranked by similarity returned | Pass |
| AI-02 | Invalid input (user with no interests set) | Error / fallback (generic popular forums) | Fallback to popular forums returned | Pass |
| AI-03 | Prompt injection (manipulated interest data) | Sanitized (input ignored, default behavior) | System ignores malformed data gracefully | Pass |

*AI Feature: Thread Summarization*

| Test Case | Input | Expected Output | Actual Result | Status |
|-----------|-------|-----------------|---------------|--------|
| AI-01 | Valid input (approved post with comments) | Correct response (concise summary) | Summary generated covering key points | Pass |
| AI-02 | Invalid input (post with no comments) | Error / fallback (minimal summary from title only) | Fallback summary generated from available data | Pass |
| AI-03 | Prompt injection (manipulated post content) | Sanitized (content processed safely) | Summary generated without executing injected commands | Pass |

**Failure Handling:**

- What happens if AI is unavailable?
    - If the Ollama AI service is unavailable, the system falls back to profanity-based filtering for moderation, returns generic popular forums for recommendations, and generates minimal summaries from available metadata. Users are not blocked from using the platform.
- How is timeout handled?
    - Timeout is handled by the system with a configurable maximum wait time. If the AI does not respond within the timeout window, the fallback behavior is triggered and the request proceeds without AI enhancement.

## 11\. Deployment & Production Setup

### 11.1 Docker Setup

**Dockerfile:**

```dockerfile
FROM node:22-bookworm-slim AS base
WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

ENV NEXT_TELEMETRY_DISABLED=1

FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN DATABASE_URL=postgresql://build:build@127.0.0.1:5432/build?sslmode=disable \
  npx prisma generate

ARG NEXT_PUBLIC_APP_URL
ARG NEXT_PUBLIC_API_DOCS_ENABLED
ARG NEXT_PUBLIC_BETTER_AUTH_URL
ARG NEXT_PUBLIC_SOCKET_URL

ENV NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL}
ENV NEXT_PUBLIC_API_DOCS_ENABLED=${NEXT_PUBLIC_API_DOCS_ENABLED}
ENV NEXT_PUBLIC_BETTER_AUTH_URL=${NEXT_PUBLIC_BETTER_AUTH_URL}
ENV NEXT_PUBLIC_SOCKET_URL=${NEXT_PUBLIC_SOCKET_URL}

RUN DATABASE_URL=postgresql://build:build@127.0.0.1:5432/build?sslmode=disable \
  BETTER_AUTH_SECRET=ci-docker-build-placeholder-not-used-at-runtime \
  npm run build

FROM base AS migrator
COPY package.json package-lock.json ./
RUN npm ci
COPY prisma ./prisma
COPY prisma.config.ts ./
RUN DATABASE_URL=postgresql://migrate:migrate@127.0.0.1:5432/migrate?sslmode=disable \
  npx prisma generate
CMD ["npx", "prisma", "migrate", "deploy"]

FROM base AS socket
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY tsconfig.server.json ./
COPY socket-server ./socket-server
RUN npx tsc -p tsconfig.server.json \
  && mv socket-server/index.js socket-server/index.cjs

ENV NODE_ENV=production
ENV SOCKET_PORT=3100
EXPOSE 3100
CMD ["node", "socket-server/index.cjs"]

FROM base AS runner

RUN apt-get update \
  && apt-get install -y --no-install-recommends clamav \
  && freshclam \
  && chmod -R o+rX /var/lib/clamav \
  && rm -rf /var/lib/apt/lists/*

LABEL org.opencontainers.image.title="academify"
LABEL org.opencontainers.image.url="e2526-wads-b4ac-02.csbihub.id"

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 --ingroup nodejs nextjs \
  && usermod -aG clamav nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3011
ENV NODE_ENV=production
ENV PORT=3011
ENV HOSTNAME=0.0.0.0

CMD ["node", "server.js"]
```

**docker-compose.yml:**

```yaml
name: academify

services:
  app:
    image: ${DOCKER_USERNAME:-local}/academify:latest
    build:
      context: .
      dockerfile: Dockerfile
      target: runner
      args:
        NEXT_PUBLIC_APP_URL: ${NEXT_PUBLIC_APP_URL:-https://e2526-wads-b4ac-02.csbihub.id}
        NEXT_PUBLIC_API_DOCS_ENABLED: ${NEXT_PUBLIC_API_DOCS_ENABLED:-true}
        NEXT_PUBLIC_BETTER_AUTH_URL: ${NEXT_PUBLIC_BETTER_AUTH_URL:-https://e2526-wads-b4ac-02.csbihub.id}
        NEXT_PUBLIC_SOCKET_URL: ${NEXT_PUBLIC_SOCKET_URL:-https://socket-e2526-wads-b4ac-02.csbihub.id}
    env_file:
      - .env.production
    environment:
      MINIO_ENDPOINT: http://minio:9000
      MINIO_PUBLIC_ENDPOINT: ${MINIO_PUBLIC_ENDPOINT:-https://minio-e2526-wads-b4ac-02.csbihub.id}
      SOCKET_SERVER_URL: http://socket:3100
      SOCKET_EMIT_SECRET: ${SOCKET_EMIT_SECRET}
    ports:
      - "3011:3011"
    depends_on:
      - minio
      - socket
    restart: unless-stopped

  socket:
    image: ${DOCKER_USERNAME:-local}/academify-socket:latest
    build:
      context: .
      dockerfile: Dockerfile
      target: socket
    env_file:
      - .env.production
    environment:
      SOCKET_PORT: "3100"
      SOCKET_EMIT_SECRET: ${SOCKET_EMIT_SECRET}
    ports:
      - "3100:3100"
    restart: unless-stopped

  minio:
    image: minio/minio:latest
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: ${MINIO_ACCESS_KEY:-minioadmin}
      MINIO_ROOT_PASSWORD: ${MINIO_SECRET_KEY:-minioadmin}
    volumes:
      - minio_data:/data
    ports:
      - "3099:9000"
    restart: unless-stopped

  db-schema-sync:
    profiles: ["migrate"]
    image: ${DOCKER_USERNAME:-local}/academify-migrator:latest
    build:
      context: .
      dockerfile: Dockerfile
      target: migrator
    env_file:
      - .env.production
    restart: "no"

volumes:
  minio_data:
```

### 11.2 Production Environment

**.env.example:**

```
# Better Auth
BETTER_AUTH_SECRET=
BETTER_AUTH_URL=

# Database (PostgreSQL on Neon)
DATABASE_URL=
DIRECT_URL=

# MinIO / S3 Object Storage
MINIO_ACCESS_KEY=
MINIO_SECRET_KEY=
MINIO_PUBLIC_ENDPOINT=

# Next.js
NEXT_PUBLIC_APP_URL=
NEXT_PUBLIC_API_DOCS_ENABLED=
NEXT_PUBLIC_BETTER_AUTH_URL=
NEXT_PUBLIC_SOCKET_URL=

# Socket.IO
SOCKET_EMIT_SECRET=

# AI (Ollama)
OLLAMA_BASE_URL=
```

- Production secrets are handled using GitHub Secrets and deployed within Docker containers which are automatically updated via GitHub Actions.

### 11.3 Live Application URL

| Environment | URL |
|-------------|-----|
| Production | https://e2526-wads-b4ac-02.csbihub.id |
| Local development | http://localhost:3000 |

## 12\. GitHub Contribution Summary (INDIVIDUAL)

Each student must list **their own contribution**.

Student Name: Vickelsteins August Santoso

- Features implemented:
    - Backend API Routes for Posts, Comments, Forums, Categories
    - File Upload and Management System
    - Forum Membership and Access Control
    - Post Like and Comment Like functionality
    - Search functionality
    - ClamAV integration for file scanning
- API endpoints handled:
    - /posts/, /posts/{postId}, /posts/{postId}/like, /posts/{postId}/comments
    - /comments/{commentId}, /comments/{commentId}/like
    - /categories/, /categories/{id}
    - /files/, /files/{fileId}, /files/{fileId}/share, /files/scan
    - /forums/{forumId}/members, /forums/{forumId}/membership
    - /storage/upload, /storage/presign, /storage/delete
    - /search/
- Tests written:
    - Unit tests for posts, comments, files, forums, categories
    - Integration tests for post visibility and comments
- Security work:
    - File upload security (MIME validation, size limits)
    - Input sanitization implementation
    - XSS prevention testing
- AI-related work:
    - AI content moderation integration
    - AI thread summarization

Student Name: Harris Ekaputra Suryadi

- Features implemented:
    - Event Management System (CRUD, RSVP, attendees)
    - User Profile Management (avatar, banner, settings)
    - Follow/Connection System
    - Collaboration Spaces
    - Socket.IO real-time notification server
- API endpoints handled:
    - /events/, /events/{eventId}, /events/{eventId}/rsvp, /events/{eventId}/attendees
    - /users/{userId}, /users/{userId}/avatar, /users/{userId}/banner, /users/{userId}/follow, /users/{userId}/events
    - /users/connections
    - /collaboration/, /collaboration/{spaceId}
    - /users/
- Tests written:
    - Unit tests for events, profiles, collaboration
    - Integration tests for events and collaboration
- Security work:
    - Rate limiting implementation
    - Socket emit authentication
    - Security headers via proxy.ts
- AI-related work:
    - AI forum recommendations
    - AI topic recommendations

Student Name: Kevin Makmur Kurniawan

- Features implemented:
    - Authentication System (Better Auth integration)
    - Messaging System (DMs, space messages)
    - Moderation System (queue, approve, delete, revert)
    - Report System (submit, review, action)
    - Admin Dashboard (user management, analytics)
    - Role-Based Access Control
- API endpoints handled:
    - /auth/sign-in/email, /auth/sign-up/email, /auth/sign-out, /auth/me
    - /messages/, /messages/{userId}, /messages/space/{spaceId}
    - /moderation/queue, /moderation/approve/{postId}, /moderation/delete/{postId}, /moderation/revert/{postId}, /moderation/warn/{userId}, /moderation/suspend/{userId}, /moderation/ban/{userId}, /moderation/logs
    - /reports/, /reports/{reportId}, /reports/{reportId}/review, /reports/{reportId}/action
    - /admin/users, /admin/users/{userId}, /admin/users/{userId}/role, /admin/analytics
    - /ai/moderate, /ai/summarize/{postId}, /ai/recommend, /ai/recommend/forums, /ai/health
- Tests written:
    - Unit tests for messages, moderation, reports, admin
    - Integration tests for profile setup and categories
- Security work:
    - RBAC implementation and testing
    - Authorization bypass prevention
    - AI rate limiting
- AI-related work:
    - AI moderation pipeline
    - AI health check endpoint

> Contributions must match GitHub commit history.

## 13\. AI Usage Disclosure (MANDATORY)

**All usage of AI code was tested and reviewed prior to being committed to the repository.**

- AI Tool Used: Claude, Cursor
    - Purpose: Used for refactoring code, applying industry best practices, and consultation regarding API structure and security patterns.
    - Specific usage:
        - Authentication and authorization flow design
        - Moderation system architecture
        - Socket.IO integration patterns

## 14\. Known Limitations & Future Improvements

- Known Technical Limitations:
    - Search is text-only; no semantic/vector search implemented.
        - Possible improvement using AI embeddings for semantic search across posts and forums.
    - File storage relies on MinIO; no CDN integration for large file delivery.
        - Possible improvement using Cloudflare R2 or AWS S3 with CloudFront.
    - Real-time features limited to notifications; no live chat or real-time collaboration editing.
        - Possible improvement using WebSockets with operational transforms for collaborative editing.
    - Limited sign-in options (email/password only).
        - Should be easy to implement using Better Auth's multi-provider support.
- AI Limitations:
    - AI moderation is text-only; images are not scanned for inappropriate content.
        - Possible improvement integrating image classification models.
    - Thread summarization may lose nuance in highly technical discussions.
        - Possible improvement with domain-specific fine-tuning.
    - Recommendations are based on forum metadata only; no deep content analysis.
        - Possible improvement using embeddings for content-based recommendations.

## 15\. Final Declaration

We declare that:

- This project is our own work
- AI usage is disclosed honestly
- All group members understand the system

Signed by Group Members:
Vickelsteins August Santoso - 2802505941
Harris Ekaputra Suryadi - 2802400502
Kevin Makmur Kurniawan - 2802547553

## 16\. SETUP

1. Clone and install modules.

```bash
git clone https://github.com/your-repo/academify.git
cd academify
npm install
```

2. Setup `.env` by copying `.env.example` and renaming it `.env.local` then insert the needed keys.

3. Initialize database

```bash
npx prisma migrate dev
```

4. Run via Docker (Recommended)

```bash
docker-compose up --build
```

Webapp accessible at [http://localhost:3011](http://localhost:3011)

5. Run locally (Development)

```bash
npm run dev:all
```

Webapp accessible at [http://localhost:3000](http://localhost:3000)
