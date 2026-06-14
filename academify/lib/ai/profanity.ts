import type { ModerationResult } from "@/lib/ai/schemas";

const PROFANITY_WORDS = [
  "fuck",
  "fucking",
  "fucker",
  "shit",
  "shitty",
  "bitch",
  "bastard",
  "asshole",
  "dick",
  "damn",
  "crap",
  "piss",
  "whore",
  "slut",
  "retard",
  "nigger",
  "faggot",
];

const PROFANITY_PATTERNS = [
  /\bf+[\W_]*u+[\W_]*c+[\W_]*k+/i,
  /\bs+[\W_]*h+[\W_]*i+[\W_]*t+/i,
  /\bb+[\W_]*i+[\W_]*t+[\W_]*c+[\W_]*h+/i,
  /\ba+[\W_]*s+[\W_]*s+[\W_]*h+[\W_]*o+[\W_]*l+[\W_]*e+/i,
];

function normalizeForScan(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, " ");
}

export function containsProfanity(text: string) {
  const normalized = normalizeForScan(text);
  const tokens = normalized.split(/\s+/).filter(Boolean);

  if (PROFANITY_WORDS.some((word) => tokens.includes(word))) {
    return true;
  }

  if (PROFANITY_WORDS.some((word) => normalized.includes(` ${word} `) || normalized.startsWith(`${word} `) || normalized.endsWith(` ${word}`))) {
    return true;
  }

  return PROFANITY_PATTERNS.some((pattern) => pattern.test(text));
}

/** Same JSON shape as AI moderation output for fallback pipelines. */
export function buildProfanityModerationResult(text: string): ModerationResult | null {
  if (!containsProfanity(text)) {
    return null;
  }

  return {
    decision: "flag",
    toxicity: 0.75,
    spam: 0.1,
    labels: ["profanity", "fallback"],
    reason: "Potential profanity detected by fallback filter",
  };
}
