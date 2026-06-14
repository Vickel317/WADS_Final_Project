const OLLAMA_BASE = process.env.OLLAMA_API_BASE ?? "https://ollama.csbihub.id";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL ?? "llama3.1:8b";
const OLLAMA_TIMEOUT = Number(process.env.OLLAMA_TIMEOUT_MS ?? 60000);
const OLLAMA_RETRY_MAX = Number(process.env.OLLAMA_RETRY_MAX ?? 2);
const OLLAMA_RETRY_BASE_MS = Number(process.env.OLLAMA_RETRY_BASE_MS ?? 300);

export function getOllamaConfig() {
  return {
    baseUrl: OLLAMA_BASE,
    model: OLLAMA_MODEL,
    timeoutMs: OLLAMA_TIMEOUT,
  };
}

export interface OllamaOptions {
  model?: string;
  timeoutMs?: number;
  maxRetries?: number;
}

const sleep = (ms: number) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

const isRetryableError = (error: unknown) => {
  if (!(error instanceof Error)) return false;
  const message = error.message.toLowerCase();
  return (
    message.includes("aborted") ||
    message.includes("timeout") ||
    message.includes("network") ||
    message.includes("fetch failed") ||
    message.includes("ollama error 5")
  );
};

/**
 * Call Ollama /api/generate and return the parsed JSON response body.
 * Always pass `format: "json"` so the model is constrained to JSON output.
 */
export async function ollamaGenerate(
  prompt: string,
  options: OllamaOptions = {}
): Promise<unknown> {
  const model = options.model ?? OLLAMA_MODEL;
  const timeoutMs = options.timeoutMs ?? OLLAMA_TIMEOUT;
  const maxRetries = Math.max(0, options.maxRetries ?? OLLAMA_RETRY_MAX);

  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(`${OLLAMA_BASE}/api/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model, prompt, stream: false, format: "json" }),
        signal: controller.signal,
      });

      if (!res.ok) {
        throw new Error(`Ollama error ${res.status}: ${await res.text()}`);
      }

      const raw = (await res.json()) as { response?: string };
      if (!raw.response) throw new Error("Ollama returned empty response");

      return JSON.parse(raw.response);
    } catch (error) {
      lastError = error;
      const shouldRetry = attempt < maxRetries && isRetryableError(error);
      if (!shouldRetry) throw error;
      const delay = OLLAMA_RETRY_BASE_MS * 3 ** attempt;
      await sleep(delay);
    } finally {
      clearTimeout(timer);
    }
  }

  throw lastError instanceof Error ? lastError : new Error("Ollama request failed");
}
