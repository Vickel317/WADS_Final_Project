"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  Upload,
  Search,
  Download,
  Share2,
  MoreVertical,
  FileText,
  ChevronDown,
} from "lucide-react";


interface FileItem {
  id: string;
  name: string;
  type: "pdf" | "zip" | "pptx" | "png" | "docx";
  size: string;
  uploadedAt: string;
  downloads: number;
  sharedWith?: string;
  url: string;
}

interface CollaborationSpace {
  id: string;
  name: string;
  description: string | null;
  forumID: string;
  createdAt: string;
}
type FileApiRecord = {
  id: string;
  name: string;
  size: number;
  type: string;
  createdAt: string;
  spaceId?: string | null;
};

function formatFileSize(size: number) {
  if (size >= 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  if (size >= 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${size} B`;
}

function normalizeFileType(type: string): FileItem["type"] {
  if (type.includes("pdf")) return "pdf";
  if (type.includes("zip")) return "zip";
  if (type.includes("presentation")) return "pptx";
  if (type.includes("png")) return "png";
  return "docx";
}



function getFileIcon(type: FileItem["type"]) {
  const base = "w-8 h-8 flex items-center justify-center rounded text-xs font-bold";
  switch (type) {
    case "pdf":
      return (
        <div className={`${base} bg-red-100 text-red-600`} style={{ fontSize: 9 }}>
          PDF
        </div>
      );
    case "zip":
      return (
        <div className={`${base} bg-yellow-100 text-yellow-700`} style={{ fontSize: 9 }}>
          ZIP
        </div>
      );
    case "pptx":
      return (
        <div className={`${base} bg-purple-100 text-purple-600`} style={{ fontSize: 9 }}>
          PPTX
        </div>
      );
    case "png":
      return (
        <div className={`${base} bg-blue-100 text-blue-600`} style={{ fontSize: 9 }}>
          PNG
        </div>
      );
    case "docx":
      return (
        <div className={`${base} bg-indigo-100 text-indigo-600`} style={{ fontSize: 9 }}>
          DOCX
        </div>
      );
  }
}

function FileRow({ file, spaces, onDelete }: { file: FileItem; spaces: CollaborationSpace[]; onDelete: (id: string) => void }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [shareSpace, setShareSpace] = useState<string>("");
  const [shareEmail, setShareEmail] = useState<string>("");
  const [sharing, setSharing] = useState(false);

  const handleShare = async () => {
    if (!shareSpace) return;

    setSharing(true);
    try {
      const res = await fetch(`/api/files/${file.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ spaceId: shareSpace }),
      });

      if (!res.ok) {
        throw new Error("Unable to share file");
      }

      setShareOpen(false);
      setShareSpace("");
      alert("File shared to collaboration space");
    } catch {
      alert("Share failed");
    } finally {
      setSharing(false);
    }
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-3 px-4 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0 gap-3">
      <div className="flex items-center gap-3 min-w-0">
        {getFileIcon(file.type)}
        <div className="min-w-0">
          <p className="text-sm font-medium text-gray-800 truncate">{file.name}</p>
          <p className="text-xs text-gray-400">
            <span className="hidden sm:inline">{file.size} • </span>Uploaded {file.uploadedAt} • {file.downloads} downloads
            {file.sharedWith && (
              <span className="text-indigo-500"> • Shared by {file.sharedWith}</span>
            )}
          </p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2 shrink-0 sm:ml-4">
        <button
          onClick={() => {
            // Trigger native download/open
            try {
              const a = document.createElement('a');
              a.href = file.url;
              a.target = '_blank';
              a.download = file.name || '';
              document.body.appendChild(a);
              a.click();
              a.remove();
            } catch {
              window.open(file.url, '_blank');
            }
          }}
          className="flex items-center gap-1 px-3 py-1.5 text-xs border border-gray-200 rounded-md hover:bg-gray-100 text-gray-600 transition-colors"
        >
          <Download size={13} />
          Download
        </button>
        <button
          onClick={() => setShareOpen(true)}
          className="flex items-center gap-1 px-3 py-1.5 text-xs border border-gray-200 rounded-md hover:bg-gray-100 text-gray-600 transition-colors"
        >
          <Share2 size={13} />
          Share
        </button>
        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-1.5 rounded-md hover:bg-gray-100 text-gray-400 transition-colors"
          >
            <MoreVertical size={16} />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-8 z-10 bg-white border border-gray-200 rounded-lg shadow-lg py-1 w-36">
              <button className="w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-gray-50">
                Rename
              </button>
              <button className="w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-gray-50">
                Move to folder
              </button>
              <button
                onClick={async () => {
                  if (!confirm('Delete this file? This cannot be undone.')) return;
                  try {
                    const res = await fetch(`/api/files/${file.id}`, { method: 'DELETE', credentials: 'include' });
                    if (!res.ok) throw new Error('Delete failed');
                    onDelete(file.id);
                    alert('File deleted');
                  } catch {
                    alert('Failed to delete file');
                  }
                }}
                className="w-full text-left px-3 py-2 text-xs text-red-500 hover:bg-red-50"
              >
                Delete
              </button>
            </div>
          )}
        </div>
      </div>

      {shareOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h4 className="text-base font-semibold text-gray-900">Share file</h4>
            <p className="mt-1 text-sm text-gray-500">Attach this file to a collaboration space so other members can access it.</p>

            <label className="mt-4 block text-xs font-medium text-gray-600">Collaboration space</label>
            <select
              value={shareSpace}
              onChange={(e) => setShareSpace(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            >
              <option value="">Select a space...</option>
              {spaces.map((space) => (
                <option key={space.id} value={space.id}>
                  {space.name}
                </option>
              ))}
            </select>

            <label className="mt-3 block text-xs font-medium text-gray-600">Or share via email</label>
            <input
              type="email"
              placeholder="recipient@example.com"
              value={shareEmail}
              onChange={(e) => setShareEmail(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            />

            <div className="mt-5 flex gap-3">
              <button
                onClick={() => setShareOpen(false)}
                className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleShare}
                disabled={!shareSpace || sharing}
                className="flex-1 rounded-lg bg-teal-600 px-3 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                {sharing ? "Sharing..." : "Share"}
              </button>
              <button
                onClick={async () => {
                  if (!shareEmail) return alert('Enter recipient email');
                  setSharing(true);
                  try {
                    const res = await fetch(`/api/files/${file.id}/share`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ email: shareEmail }),
                      credentials: 'include',
                    });
                    if (!res.ok) throw new Error('Share by email failed');
                    setShareOpen(false);
                    setShareEmail('');
                    alert('File shared via email');
                  } catch {
                    alert('Share by email failed');
                  } finally {
                    setSharing(false);
                  }
                }}
                className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Share via email
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


export default function FilesPage() {
  const [activeTab, setActiveTab] = useState<"my" | "shared" | "recent">("my");
  const [searchQuery, setSearchQuery] = useState("");
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [selectedSpace, setSelectedSpace] = useState<string | "">("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [spaces, setSpaces] = useState<CollaborationSpace[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [filesResponse, spacesResponse] = await Promise.all([
          fetch("/api/files"),
          fetch("/api/collaboration"),
        ]);

        const filesPayload = await filesResponse.json().catch(() => ({}));
        const spacesPayload = await spacesResponse.json().catch(() => ({}));

        if (!filesResponse.ok) {
          throw new Error(filesPayload?.error?.message || "Failed to load files");
        }
        if (!spacesResponse.ok) {
          throw new Error(spacesPayload?.error?.message || "Failed to load collaboration spaces");
        }

        setFiles(
          (filesPayload.files || []).map((file: FileApiRecord) => ({
            id: file.id,
            name: file.name,
            type: normalizeFileType(file.type),
            size: formatFileSize(file.size),
            uploadedAt: new Date(file.createdAt).toLocaleDateString(),
            downloads: 0,
            sharedWith: file.spaceId ? `Space ${file.spaceId}` : undefined,
          }))
        );

        setSpaces(
          (spacesPayload.spaces || []).map((space: { spaceID: string; name: string; description: string | null; forumID: string; createdAt: string }) => ({
            id: space.spaceID,
            name: space.name,
            description: space.description,
            forumID: space.forumID,
            createdAt: space.createdAt,
          }))
        );
        setLoadError(null);
      } catch (error) {
        setLoadError(error instanceof Error ? error.message : "Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const tabFiles = files;

  const filteredFiles = tabFiles.filter((f) =>
    f.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const clearSelectedFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My uploads</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Your library of uploads — attach files from a thread or collab space when sharing.
          </p>
        </div>
        <button
          onClick={() => setShowUploadModal(true)}
          className="flex items-center justify-center sm:justify-start gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors w-full sm:w-auto"
          style={{ backgroundColor: "#0d9488" }}
        >
          <Upload size={16} />
          Upload File
        </button>
      </div>

      {/* Search + Stats */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1 bg-white rounded-xl border border-gray-200 flex items-center gap-3 px-4 py-3">
          <Search size={16} className="text-gray-400 shrink-0" />
          <input
            type="text"
            placeholder="Search files..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 text-sm text-gray-700 outline-none bg-transparent placeholder-gray-400"
          />
        </div>
        <div
          className="bg-white rounded-xl border border-gray-200 px-4 sm:px-6 py-3 flex flex-col items-center justify-center"
          style={{ minWidth: 120 }}
        >
          <span className="text-2xl font-bold text-gray-900">{files.length}</span>
          <span className="text-xs text-gray-400">Total Files</span>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.4fr_0.9fr] mb-5">
        <div
          className="relative overflow-hidden rounded-2xl border border-teal-100 p-5 text-white shadow-sm"
          style={{ backgroundImage: "linear-gradient(135deg, #0f766e, #14b8a6, #06b6d4)" }}
        >
          <div className="absolute -right-8 -top-10 h-28 w-28 rounded-full bg-white/10 blur-2xl" />
          <div className="relative flex flex-col gap-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-white/70">Collaboration Space</p>
                <h2 className="mt-1 text-xl font-bold">Keep files, notes, and team progress in one place</h2>
                <p className="mt-1.5 max-w-2xl text-sm text-white/80">
                  Build shared workspaces for assignments, track who is editing what, and keep every upload connected to the right team.
                </p>
              </div>
              <Link
                href="/collaboration"
                className="inline-flex items-center justify-center rounded-full border border-white/20 bg-white/15 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/25"
              >
                Open collaboration hub
              </Link>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {spaces.length ? (
                spaces.slice(0, 3).map((space) => (
                  <div key={space.id} className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur">
                    <p className="text-sm font-semibold">{space.name}</p>
                    <p className="mt-1 text-xs text-white/75">{space.description ?? "No description provided."}</p>
                    <p className="mt-3 text-[11px] uppercase tracking-[0.18em] text-white/70">
                      <span className="inline-block max-w-48 align-middle overflow-hidden whitespace-nowrap text-ellipsis truncate">Forum {space.forumID}</span>
                    </p>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-white/15 bg-white/10 p-4 text-sm text-white/75">
                  No collaboration spaces found.
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-800">Live collaboration feed</h3>
          <p className="text-xs text-gray-400 mt-1">Recent activity from shared spaces</p>

          <div className="mt-4 rounded-xl bg-gray-50 px-4 py-3 text-sm text-gray-600">
            Live activity is not seeded anymore. It will appear once collaboration events are connected.
          </div>
        </div>
      </div>

      {/* Tabs + File List */}
      <div className="bg-white rounded-xl border border-gray-200">
        {/* Tabs */}
        <div className="flex border-b border-gray-100 px-3 sm:px-4 overflow-x-auto">
          {(
            [
              { key: "my", label: "All Files" },
              { key: "shared", label: "Shared" },
              { key: "recent", label: "Recent" },
            ] as const
          ).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`py-3 px-3 sm:px-4 text-xs sm:text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.key
                  ? "border-teal-600 text-teal-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Files */}
        {loadError ? (
          <div className="py-12 text-center text-red-500">
            <p className="text-sm">{loadError}</p>
          </div>
        ) : loading ? (
          <div className="py-12 text-center text-gray-400">
            <p className="text-sm">Loading files...</p>
          </div>
        ) : filteredFiles.length > 0 ? (
          filteredFiles.map((file) => (
            <FileRow
              key={file.id}
              file={file}
              spaces={spaces}
              onDelete={(id) => setFiles((prev) => prev.filter((f) => f.id !== id))}
            />
          ))
        ) : (
          <div className="py-12 text-center text-gray-400">
            <FileText size={32} className="mx-auto mb-2 opacity-40" />
            <p className="text-sm">No files found</p>
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
          onClick={() => setShowUploadModal(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-5 sm:p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-gray-900 mb-1">Upload File</h3>
            <p className="text-sm text-gray-500 mb-5">
              Share a file with your community
            </p>

            {/* Drop zone */}
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
              className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center mb-4 transition-colors ${
                dragging
                  ? "border-teal-500 bg-teal-50"
                  : "border-gray-200 bg-gray-50"
              }`}
            >
              <Upload size={28} className="text-gray-400 mb-2" />
              <p className="text-sm font-medium text-gray-600">
                Drag & drop files here
              </p>
              <p className="text-xs text-gray-400 mt-1">or</p>
              <input
                type="file"
                ref={fileInputRef}
                onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
                className="mt-2"
              />
              {selectedFile && (
                <div className="mt-3 flex items-center justify-between gap-3 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-500">
                  <p className="min-w-0 truncate">
                    Selected: {selectedFile.name} ({formatFileSize(selectedFile.size)})
                  </p>
                  <button
                    type="button"
                    onClick={clearSelectedFile}
                    className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
                    aria-label="Remove selected file"
                    title="Remove selected file"
                  >
                    <span aria-hidden="true">×</span>
                  </button>
                </div>
              )}
              <p className="text-xs text-gray-400 mt-3">
                PDF, DOCX, PNG, ZIP, PPTX • Max 50 MB
              </p>
            </div>

            {/* Collaboration space select */}
            <div className="mb-4">
              <label className="text-xs font-medium text-gray-600 block mb-1">
                Attach to collaboration space (optional)
              </label>
              <div className="relative">
                <select
                  value={selectedSpace}
                  onChange={(e) => setSelectedSpace(e.target.value)}
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 appearance-none outline-none focus:border-teal-500 bg-white pr-8"
                >
                  <option value="">Select a space...</option>
                  {spaces.map((space) => (
                    <option key={space.id} value={space.id}>
                      {space.name}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={14}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowUploadModal(false)}
                className="flex-1 py-2 rounded-lg text-sm font-medium border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (!selectedFile) return alert('Please choose a file first');

                  setUploading(true);
                  try {
                    const presignRes = await fetch('/api/storage/presign', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      credentials: 'include',
                      body: JSON.stringify({ fileName: selectedFile.name, contentType: selectedFile.type }),
                    });

                    if (!presignRes.ok) {
                      const payload = await presignRes.json().catch(() => ({}));
                      throw new Error(payload?.error?.message || payload?.message || 'Failed to get upload URL');
                    }

                    const json = await presignRes.json().catch(() => ({}));
                    const uploadUrl = json?.url;
                    const objectKey = json?.key;
                    if (!uploadUrl || !objectKey) throw new Error('Invalid presign response');

                    const putRes = await fetch(uploadUrl, {
                      method: 'PUT',
                      body: selectedFile,
                      headers: { 'Content-Type': selectedFile.type || 'application/octet-stream' },
                    });

                    if (!putRes.ok) {
                      throw new Error('Storage upload failed. File was not saved.');
                    }

                    const createRes = await fetch('/api/files', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      credentials: 'include',
                      body: JSON.stringify({ objectKey, fileName: selectedFile.name, fileType: selectedFile.type, fileSize: selectedFile.size, spaceId: selectedSpace || null }),
                    });

                    const payload = await createRes.json().catch(() => ({}));
                    if (!createRes.ok) throw new Error(payload?.error?.message || payload?.message || 'Failed to save file metadata');

                    setShowUploadModal(false);
                    setSelectedFile(null);
                    setSelectedSpace('');

                    setFiles((prev) => [
                      {
                        id: payload?.file?.id ?? crypto.randomUUID(),
                        name: payload?.file?.name ?? selectedFile.name,
                        type: normalizeFileType(payload?.file?.type ?? selectedFile.type),
                        size: formatFileSize(payload?.file?.size ?? selectedFile.size),
                        uploadedAt: new Date(payload?.file?.createdAt ?? Date.now()).toLocaleDateString(),
                        downloads: 0,
                        sharedWith: payload?.file?.spaceId ? `Space ${payload.file.spaceId}` : undefined,
                        url: payload?.file?.url ?? '',
                      },
                      ...prev,
                    ]);
                  } catch (error) {
                    const message =
                      error instanceof Error
                        ? error.message
                        : 'Storage upload failed. File was not saved.';
                    alert(message);
                  } finally {
                    setUploading(false);
                  }
                }}
                disabled={uploading}
                className="flex-1 py-2 rounded-lg text-sm font-medium text-white transition-colors"
                style={{ backgroundColor: "#0d9488" }}
              >
                {uploading ? 'Uploading...' : 'Upload'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}