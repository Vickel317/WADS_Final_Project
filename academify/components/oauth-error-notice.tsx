"use client";

import { useSearchParams } from "next/navigation";
import { useMemo } from "react";
import { mapOAuthErrorMessage } from "@/lib/google-auth-config";

export default function OAuthErrorNotice() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  const notice = useMemo(() => {
    if (!error) return null;
    return mapOAuthErrorMessage(error, errorDescription);
  }, [error, errorDescription]);

  if (!notice) return null;

  return (
    <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
      <p className="font-semibold">{notice.title}</p>
      <p className="mt-1">{notice.message}</p>
      {"callbackUrl" in notice && notice.callbackUrl && (
        <code className="mt-2 block break-all rounded-lg bg-white/80 px-2 py-1.5 text-xs text-red-800">
          {notice.callbackUrl}
        </code>
      )}
    </div>
  );
}
