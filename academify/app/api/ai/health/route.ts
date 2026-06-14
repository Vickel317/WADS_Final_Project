import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth-session";
import { apiError } from "@/lib/api-response";
import { getOllamaConfig, ollamaGenerate } from "@/lib/ollama";

/**
 * GET /api/ai/health
 * Quick check that Ollama is reachable and the configured model responds.
 */
export async function GET(request: NextRequest) {
  const decoded = await verifyToken(request);
  if (!decoded) return apiError(401, "Not authenticated", "UNAUTHORIZED");

  const config = getOllamaConfig();
  const started = Date.now();

  try {
    const tagsRes = await fetch(`${config.baseUrl}/api/tags`, {
      signal: AbortSignal.timeout(5000),
    });

    if (!tagsRes.ok) {
      return NextResponse.json(
        {
          ok: false,
          ...config,
          error: `Ollama tags request failed (${tagsRes.status})`,
        },
        { status: 503 }
      );
    }

    const tags = (await tagsRes.json()) as { models?: Array<{ name: string }> };
    const availableModels = tags.models?.map((model) => model.name) ?? [];
    const modelAvailable = availableModels.some(
      (name) => name === config.model || name.startsWith(`${config.model}:`)
    );

    await ollamaGenerate(
      'Return JSON only: {"status":"ok"}',
      { timeoutMs: 12000, maxRetries: 0 }
    );

    return NextResponse.json({
      ok: true,
      ...config,
      modelAvailable,
      availableModels,
      latencyMs: Date.now() - started,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        ...config,
        latencyMs: Date.now() - started,
        error: error instanceof Error ? error.message : "Ollama health check failed",
        hint:
          "Use a smaller model such as llama3.1:8b. gemma4:26b is often too slow for short API timeouts.",
      },
      { status: 503 }
    );
  }
}
