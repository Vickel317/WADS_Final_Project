import {
  validateCreateCategoryPayload,
  validateCreateCommentPayload,
  validateCreateEventPayload,
  validateCreateMessagePayload,
  validateCreatePostPayload,
  validateCreateReportPayload,
  validateFileUpload,
  validateFirebaseSyncPayload,
  validateModerationReasonPayload,
  validateProfileUpdatePayload,
  validateReportActionPayload,
  validateRoleUpdatePayload,
  validateUpdateCategoryPayload,
  validateUpdateCommentPayload,
  validateUpdateEventPayload,
  validateUpdatePostPayload,
} from "@/lib/security";

describe("shared security validators", () => {
  it("accepts valid create payloads", () => {
    expect(
      validateCreateEventPayload({
        title: "Secure Coding Meetup",
        description: "OWASP review",
        date: "2026-12-01T10:00:00.000Z",
        duration: 90,
        location: "Room A",
        category: "Workshop",
        maxAttendees: 25,
      }).ok
    ).toBe(true);

    expect(
      validateCreatePostPayload({
        title: "Best resources for React?",
        content: "Looking for learning resources.",
        categoryId: "tech",
      }).ok
    ).toBe(true);

    expect(
      validateCreateCategoryPayload({
        name: "Technology",
        description: "Tech discussions",
        slug: "technology",
      }).ok
    ).toBe(true);
  });

  it("rejects invalid event payloads", () => {
    expect(
      validateCreateEventPayload({
        title: "Go",
        description: "Short",
        date: "invalid-date",
        duration: 5,
        location: "A",
        category: "Workshop",
        maxAttendees: 1,
      }).ok
    ).toBe(false);
  });

  it("rejects invalid category slugs and empty updates", () => {
    expect(
      validateCreateCategoryPayload({
        name: "Technology",
        description: "Tech discussions",
        slug: "Bad Slug",
      }).ok
    ).toBe(false);

    expect(validateUpdateCategoryPayload({}).ok).toBe(false);
  });

  it("validates update payloads", () => {
    expect(validateUpdatePostPayload({ title: "Updated title" }).ok).toBe(true);
    expect(validateUpdateEventPayload({ location: "Library" }).ok).toBe(true);
    expect(validateUpdateCategoryPayload({ slug: "new-slug" }).ok).toBe(true);
    expect(validateUpdateCommentPayload({ content: "Nice update" }).ok).toBe(true);
  });

  it("rejects invalid post and comment payloads", () => {
    expect(
      validateCreatePostPayload({
        title: "Bad",
        content: "Too short",
        categoryId: "tech",
      }).ok
    ).toBe(false);

    expect(validateUpdatePostPayload({ content: "short" }).ok).toBe(false);
    expect(validateCreateCommentPayload({ content: "x" }).ok).toBe(false);
  });

  it("rejects missing or malformed content", () => {
    expect(validateCreateCommentPayload({ content: "" }).ok).toBe(false);
    expect(validateCreateMessagePayload({ content: "", receiverId: "user2" }).ok).toBe(false);
    expect(validateCreateReportPayload({ targetType: "post", targetId: "", reason: "spam" }).ok).toBe(false);
  });

  it("validates message and report payload edge cases", () => {
    expect(
      validateCreateMessagePayload({
        content: "Hello there",
        receiverId: "user2",
      }).ok
    ).toBe(true);

    expect(
      validateCreateReportPayload({
        targetType: "group",
        targetId: "1",
        reason: "Spam content",
      }).ok
    ).toBe(false);

    expect(
      validateReportActionPayload({
        action: "resolve",
        note: "Handled by moderator",
      }).ok
    ).toBe(true);
  });

  it("validates profile, report, role, firebase, and moderation payloads", () => {
    expect(validateProfileUpdatePayload({ name: "  Harris  " }).ok).toBe(true);
    expect(validateReportActionPayload({ action: "resolve", note: "Done" }).ok).toBe(true);
    expect(validateFirebaseSyncPayload({ idToken: "token-value" }).ok).toBe(true);
    expect(validateRoleUpdatePayload({ role: "moderator" }, ["student", "instructor", "moderator", "admin"]).ok).toBe(true);
    expect(validateModerationReasonPayload({ reason: "Too noisy", durationDays: 7 }).ok).toBe(true);
  });

  it("rejects invalid profile, moderation, firebase, and role payloads", () => {
    expect(validateProfileUpdatePayload({}).ok).toBe(false);
    expect(validateModerationReasonPayload({ reason: "bad", durationDays: 0 }).ok).toBe(false);
    expect(validateFirebaseSyncPayload({}).ok).toBe(false);
    expect(validateRoleUpdatePayload({ role: "guest" }, ["student", "moderator", "admin"]).ok).toBe(false);
  });

  it("validates file upload payloads", () => {
    expect(validateFileUpload("slides.pdf", "application/pdf", 2048).ok).toBe(true);
  });

  it("rejects invalid values", () => {
    expect(validateUpdatePostPayload({ title: "bad" }).ok).toBe(false);
    expect(validateUpdateCategoryPayload({ slug: "Bad Slug" }).ok).toBe(false);
    expect(validateReportActionPayload({ action: "archive" }).ok).toBe(false);
    expect(validateRoleUpdatePayload({ role: "guest" }, ["student", "moderator", "admin"]).ok).toBe(false);
  });

  it("covers file upload validation and sanitization", () => {
    expect(
      validateFileUpload("notes.pdf", "application/pdf", 1024).ok
    ).toBe(true);

    expect(
      validateFileUpload("../secret.txt", "text/plain", 10).ok
    ).toBe(false);

    expect(
      validateFileUpload("notes.pdf", "application/x-msdownload", 1024).ok
    ).toBe(false);
  });
});
