"use client";

import { useState } from "react";

type Summary = {
  summary: string;
  keyPoints: string[];
  openQuestions: string[];
  model?: string;
  cached?: boolean;
};

export function AiSummary({ postId }: { postId: string }) {
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [data, setData] = useState<Summary | null>(null);
  const [error, setError] = useState("");

  const load = async () => {
    setState("loading");
    try {
      const res = await fetch(`/api/ai/summarize/${postId}`);
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.error?.message ?? "AI unavailable");
      setData(json as Summary);
      setState("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
      setState("error");
    }
  };

  if (state === "idle") {
    return (
      <button
        onClick={load}
        className="mt-4 flex items-center gap-1.5 rounded-lg border border-violet-200 px-3 py-1.5 text-xs font-medium text-violet-700 hover:bg-violet-50 transition"
      >
        <span>✦</span> AI Summary
      </button>
    );
  }

  if (state === "loading") {
    return (
      <div className="mt-4 rounded-xl border border-violet-100 bg-violet-50 p-4">
        <p className="text-xs text-violet-600 animate-pulse">Generating summary…</p>
      </div>
    );
  }

  if (state === "error") {
    return (
      <div className="mt-4 rounded-xl border border-red-100 bg-red-50 p-3 text-xs text-red-600">
        {error}
      </div>
    );
  }

  return (
    <div className="mt-4 rounded-xl border border-violet-100 bg-violet-50 p-4 space-y-3">
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-violet-600 text-xs font-bold">✦ AI SUMMARY</span>
        {data?.model && (
          <span className="rounded bg-violet-200 px-1.5 py-0.5 text-[10px] text-violet-800">
            {data.model}
          </span>
        )}
        {data?.cached && (
          <span className="rounded bg-gray-200 px-1.5 py-0.5 text-[10px] text-gray-600">cached</span>
        )}
      </div>
      <p className="text-sm text-gray-700">{data?.summary}</p>
      {(data?.keyPoints ?? []).length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-500 mb-1">Key points</p>
          <ul className="list-disc list-inside space-y-0.5">
            {data!.keyPoints.map((p, i) => (
              <li key={i} className="text-xs text-gray-600">{p}</li>
            ))}
          </ul>
        </div>
      )}
      {(data?.openQuestions ?? []).length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-500 mb-1">Open questions</p>
          <ul className="list-disc list-inside space-y-0.5">
            {data!.openQuestions.map((q, i) => (
              <li key={i} className="text-xs text-gray-600">{q}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
