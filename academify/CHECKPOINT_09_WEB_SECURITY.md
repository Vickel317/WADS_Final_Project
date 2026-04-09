# Weekly Checkpoint 09 - Web Security + Security Testing

## Project
Academify (WADS Final Project)

## Scope
This checkpoint focuses on:
- Input Validation
- Middleware Security Controls
- Error Handling
- Security Testing

## 1) Input Validation
Input validation is implemented through shared validators in `lib/security.ts` and applied across multiple API routes.

Validated routes include:
- `POST /api/posts`
- `PUT /api/posts/[postId]`
- `POST /api/posts/[postId]/comments`
- `PUT /api/comments/[commentId]`
- `POST /api/categories`
- `POST /api/events`
- `POST /api/messages/[userId]`
- `POST /api/reports`
- `POST /api/reports/[reportId]/action`
- `PUT /api/reports/[reportId]/review`
- `PATCH /api/users/[userId]` and `PUT /api/users/[userId]`
- `PUT /api/admin/users/[userId]/role`
- `POST /api/moderation/warn/[userId]`
- `POST /api/moderation/ban/[userId]`
- `POST /api/moderation/suspend/[userId]`
- `POST /api/moderation/delete/[postId]`
- `POST /api/auth/firebase`
- `POST /api/files`

Main controls:
- Required field checks
- String trimming and null-byte removal
- Length constraints for titles, descriptions, content, reasons, and IDs
- Enum and allowed-value checks for roles, actions, and report targets
- Numeric range checks for durations and attendee limits

Security value:
- Prevents malformed payloads and business-logic abuse
- Reduces the chance of invalid database writes or runtime errors

## 2) Middleware Security Controls
Global security middleware is implemented in `middleware.ts`.

Controls added:
- Security headers:
  - `X-Frame-Options: DENY`
  - `X-Content-Type-Options: nosniff`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Permissions-Policy`
  - `Cross-Origin-Resource-Policy`
  - `Cross-Origin-Opener-Policy`
- Basic API rate limiting per client key
- Origin validation for mutating API requests
- Content-Type enforcement for non-file mutating API endpoints

Security value:
- Adds baseline hardening for clickjacking, MIME sniffing, and excessive requests
- Blocks suspicious cross-origin write attempts

## 3) Error Handling
Centralized error response helper:
- `lib/error-handler.ts`

Applied to key routes so internal failures return a consistent 500 response without leaking stack traces.

Security value:
- Prevents leaking internal details in API responses
- Keeps error format consistent and easier to monitor

## 4) Security Testing
Added Jest test suites:
- `__tests__/security-validation.test.ts`
- `__tests__/middleware-security.test.ts`

Current test result (targeted security run):
- 2 suites passed
- 19 tests passed
- Command used:

```bash
npm test -- __tests__/security-validation.test.ts __tests__/middleware-security.test.ts
```

Coverage by threat/control area (mapped to implemented tests):

| Threat/Control Area | Covered By Tests |
| --- | --- |
| Input tampering / malformed payloads | Required field, type, length, and enum validation tests across events, posts, categories, comments, messages, reports, roles, and profile updates |
| Injection-like input abuse | Path traversal filename rejection (`../`), invalid MIME rejection, and sanitization-oriented validation cases |
| Unauthorized cross-origin writes (CSRF hardening) | Middleware test that blocks cross-origin mutating requests (403) |
| Content-type bypass | Middleware test that enforces JSON for mutating non-file APIs (415) and allows multipart for file upload route |
| DoS / request flooding | Middleware rate-limit threshold test (429) and window-reset behavior test |
| Security header hardening | Middleware test for frame, content-type sniffing, and referrer policy headers |
| Role/authorization payload integrity | Role update validator tests and report action/review payload validation tests |

Run command:
```bash
npm test -- __tests__/security-validation.test.ts __tests__/middleware-security.test.ts
```

## Conclusion
Checkpoint 09 security objectives are implemented with practical controls at request validation, middleware, and error-handling layers, and the validation logic is applied across several major API routes rather than a single endpoint.
