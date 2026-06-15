"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

export default function EventBannerUpload({
  eventId,
  isHost,
}: {
  eventId: string;
  isHost: boolean;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  if (!isHost) return null;

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch(`/api/storage/upload-entity-banner/event/${eventId}`, {
        method: "POST",
        body: fd,
      });
      if (res.ok) {
        router.refresh();
      }
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
      <button
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="absolute top-3 right-3 px-3 py-1.5 rounded-lg bg-black/40 backdrop-blur-sm text-white text-xs font-medium hover:bg-black/60 transition disabled:opacity-50 z-10"
      >
        {uploading ? "Uploading..." : "Change banner"}
      </button>
    </>
  );
}
