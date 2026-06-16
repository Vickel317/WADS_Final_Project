import {
  AI_BLOCK_RISK_THRESHOLD,
  mapAiResultToModerationStatus,
} from "@/lib/ai/moderation";
import { buildProfanityModerationResult, containsProfanity } from "@/lib/ai/profanity";
import { ModerationResultSchema } from "@/lib/ai/schemas";
import { MODERATION_QUEUE_STATUSES } from "@/lib/moderation";
import { ModerationStatus } from "@prisma/client";

describe("ModerationResultSchema", () => {
  it("accepts valid AI moderation payloads", () => {
    const parsed = ModerationResultSchema.safeParse({
      decision: "approve",
      toxicity: 0.1,
      spam: 0.05,
      labels: ["safe"],
      reason: "Looks fine",
    });

    expect(parsed.success).toBe(true);
  });

  it("rejects invalid decision values", () => {
    const parsed = ModerationResultSchema.safeParse({
      decision: "ban",
      toxicity: 0.1,
      spam: 0.05,
      labels: [],
      reason: "Nope",
    });

    expect(parsed.success).toBe(false);
  });
});

describe("containsProfanity", () => {
  it("flags known profanity in fallback moderation", () => {
    expect(containsProfanity("this is shit")).toBe(true);
  });

  it("flags obfuscated profanity patterns", () => {
    expect(containsProfanity("you f.u.c.k off")).toBe(true);
  });

  it("allows clean text", () => {
    expect(containsProfanity("hello study group")).toBe(false);
  });
});

describe("buildProfanityModerationResult", () => {
  it("returns AI-shaped moderation JSON for profane text", () => {
    const result = buildProfanityModerationResult("what the shit");
    expect(result?.decision).toBe("flag");
    expect(result?.labels).toContain("profanity");
  });
});

describe("MODERATION_QUEUE_STATUSES", () => {
  it("includes blocked posts in the moderation queue", () => {
    expect(MODERATION_QUEUE_STATUSES).toContain(ModerationStatus.BLOCKED);
    expect(MODERATION_QUEUE_STATUSES).toContain(ModerationStatus.FLAGGED);
    expect(MODERATION_QUEUE_STATUSES).toContain(ModerationStatus.PENDING);
  });
});

describe("mapAiResultToModerationStatus", () => {
  it("maps approve to APPROVED", () => {
    const result = mapAiResultToModerationStatus({
      decision: "approve",
      toxicity: 0.1,
      spam: 0.05,
      labels: ["safe"],
      reason: "Looks fine",
    });
    expect(result.status).toBe(ModerationStatus.APPROVED);
    expect(result.aiScore).toBe(0.1);
  });

  it("maps flag to FLAGGED", () => {
    const result = mapAiResultToModerationStatus({
      decision: "flag",
      toxicity: 0.5,
      spam: 0.2,
      labels: ["spam"],
      reason: "Suspicious",
    });
    expect(result.status).toBe(ModerationStatus.FLAGGED);
  });

  it("downgrades low-risk off-topic-only flags to APPROVED", () => {
    const result = mapAiResultToModerationStatus({
      decision: "flag",
      toxicity: 0.5,
      spam: 0.2,
      labels: ["off_topic"],
      reason: "Request seems off-topic; clarify relevance",
    });
    expect(result.status).toBe(ModerationStatus.APPROVED);
    expect(result.aiLabel).toContain("downgraded_off_topic");
  });

  it("maps reject with high risk to BLOCKED", () => {
    const result = mapAiResultToModerationStatus({
      decision: "reject",
      toxicity: 0.95,
      spam: 0.1,
      labels: ["hate"],
      reason: "Severe violation",
    });
    expect(result.status).toBe(ModerationStatus.BLOCKED);
    expect(result.aiScore).toBe(0.95);
  });

  it("downgrades reject below threshold to FLAGGED", () => {
    const result = mapAiResultToModerationStatus({
      decision: "reject",
      toxicity: 0.7,
      spam: 0.4,
      labels: ["rude"],
      reason: "Borderline",
    });
    expect(result.status).toBe(ModerationStatus.FLAGGED);
    expect(result.aiLabel).toContain("downgraded_reject");
    expect(result.aiReason).toContain("below block threshold");
  });

  it("blocks at exactly the threshold", () => {
    const result = mapAiResultToModerationStatus({
      decision: "reject",
      toxicity: AI_BLOCK_RISK_THRESHOLD,
      spam: 0,
      labels: [],
      reason: "High risk",
    });
    expect(result.status).toBe(ModerationStatus.BLOCKED);
  });
});
