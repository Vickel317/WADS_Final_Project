import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth-session";
import { apiError } from "@/lib/api-response";
import { ollamaGenerate } from "@/lib/ollama";
import { buildModerationPrompt } from "@/lib/ai/prompts";
import { ModerationResultSchema } from "@/lib/ai/schemas";
import { z } from "zod";

const BodySchema = z.object({
  title: z.string().min(1).max(300),
  content: z.string().min(1).max(5000),
  forum: z.string().default("General"),
});

/**
 * POST /api/ai/moderate
 * Analyse a post for toxicity and spam, return a moderation decision.
 * Requires authentication.
 */
export async function POST(request: NextRequest) {
  const decoded = await verifyToken(request);
  if (!decoded) return apiError(401, "Not authenticated", "UNAUTHORIZED");

  const body = await request.json().catch(() => null);
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return apiError(400, "Invalid request body", "BAD_REQUEST");
  }

  const { title, content, forum } = parsed.data;

  try {
    const raw = await ollamaGenerate(buildModerationPrompt(title, content, forum));
    const result = ModerationResultSchema.safeParse(raw);

    if (!result.success) {
      console.error("[AI moderate] schema mismatch", raw);
      return NextResponse.json(
        {
          decision: "flag",
          toxicity: 0,
          spam: 0,
          labels: [],
          reason: "AI response could not be parsed; routed to manual review",
          aiUnavailable: true,
        },
        { status: 200 }
      );
    }

    return NextResponse.json(result.data, { status: 200 });
  } catch (err) {
    console.error("[AI moderate] Ollama error:", err);
    return NextResponse.json(
      {
        decision: "flag",
        toxicity: 0,
        spam: 0,
        labels: [],
        reason: "AI service unavailable; routed to manual review",
        aiUnavailable: true,
      },
      { status: 200 }
    );
  }
}
