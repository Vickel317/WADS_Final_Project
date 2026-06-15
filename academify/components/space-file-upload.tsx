"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Upload } from "lucide-react";

export default function SpaceFileUpload({
  spaceId,
  spaceName,
  canUpload,
}: {
  spaceId: string;
  spaceName: string;
  canUpload: boolean;
}) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);

  if (!canUpload) return null;

  const resetModal = () => {
    setShowModal(false);
    setSelectedFile(null);
    setDragging(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      alert("Please choose a file first");
      return;
    }

    setUploading(true);
    try {
      const uploadFd = new FormData();
      uploadFd.append("file", selectedFile);

      const uploadRes = await fetch("/api/storage/upload", {
        method: "POST",
        credentials: "include",
        body: uploadFd,
      });

      const uploadPayload = await uploadRes.json().catch(() => ({}));
      if (!uploadRes.ok) {
        throw new Error(
          uploadPayload?.error?.message ||
            uploadPayload?.message ||
            "Failed to upload file to storage"
        );
      }

      const objectKey = uploadPayload?.key;
      if (!objectKey) throw new Error("Invalid upload response");

      const createRes = await fetch("/api/files", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          objectKey,
          fileName: selectedFile.name,
          fileType: selectedFile.type || "application/octet-stream",
          fileSize: selectedFile.size,
          spaceId,
        }),
      });

      const payload = await createRes.json().catch(() => ({}));
      if (!createRes.ok) {
        throw new Error(payload?.error?.message || payload?.message || "Failed to save file");
      }

      resetModal();
      router.refresh();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Upload failed. Please try again.";
      alert(message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setShowModal(true)}
        className="inline-flex items-center gap-1.5 rounded-full bg-teal-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-teal-700"
      >
        <Upload size={14} />
        Upload
      </button>

      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center overflow-y-auto bg-black/40 p-3 sm:items-center sm:p-4"
          onClick={resetModal}
        >
          <div
            className="my-auto flex max-h-[min(90dvh,calc(100dvh-1.5rem))] w-full max-w-md flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="shrink-0 border-b border-gray-100 px-5 py-4">
              <h3 className="text-lg font-bold text-gray-900">Upload to {spaceName}</h3>
              <p className="text-sm text-gray-500">Files uploaded here are visible to all space members</p>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragging(false);
                  setSelectedFile(e.dataTransfer.files?.[0] ?? null);
                }}
                className={`mb-4 flex w-full flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 transition-colors sm:p-8 ${
                  dragging ? "border-teal-500 bg-teal-50" : "border-gray-200 bg-gray-50"
                }`}
              >
                <Upload size={28} className="mb-2 text-gray-400" />
                <p className="text-sm font-medium text-gray-600">Drag & drop files here</p>
                <p className="mt-1 text-xs text-gray-400">or</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept=".pdf,.docx,.png,.zip,.pptx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/png,application/zip,application/vnd.openxmlformats-officedocument.presentationml.presentation"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-2 text-sm font-medium text-teal-600 hover:text-teal-700"
                >
                  Browse files
                </button>
                {selectedFile && (
                  <p className="mt-3 text-center text-sm text-gray-700">
                    {selectedFile.name} ({(selectedFile.size / (1024 * 1024)).toFixed(1)} MB)
                  </p>
                )}
                <p className="mt-2 text-xs text-gray-400">PDF, DOCX, PNG, ZIP, PPTX • Max 50 MB</p>
              </div>
            </div>

            <div className="shrink-0 border-t border-gray-100 px-5 py-4">
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={resetModal}
                  className="flex-1 rounded-lg border border-gray-200 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleUpload}
                  disabled={uploading}
                  className="flex-1 rounded-lg bg-teal-600 py-2 text-sm font-medium text-white transition hover:bg-teal-700 disabled:opacity-60"
                >
                  {uploading ? "Uploading..." : "Upload"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
