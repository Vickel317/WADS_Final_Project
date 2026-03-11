"use client";

import { useState } from "react";
import {
  Upload,
  Search,
  Download,
  Share2,
  MoreVertical,
  FolderOpen,
  FileText,
  Archive,
  Presentation,
  ImageIcon,
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
}

interface Folder {
  name: string;
  count: number;
  color: string;
  bgColor: string;
}
const FOLDERS: Folder[] = [
  { name: "Computer Science", count: 24, color: "#6366f1", bgColor: "#eef2ff" },
  { name: "Mathematics", count: 18, color: "#8b5cf6", bgColor: "#f5f3ff" },
  { name: "Projects", count: 12, color: "#06b6d4", bgColor: "#ecfeff" },
  { name: "Study Materials", count: 31, color: "#10b981", bgColor: "#ecfdf5" },
];

const MY_FILES: FileItem[] = [
  {
    id: "1",
    name: "Data_Structures_Notes.pdf",
    type: "pdf",
    size: "2.4 MB",
    uploadedAt: "Feb 20, 2026",
    downloads: 45,
  },
  {
    id: "2",
    name: "Machine_Learning_Project.zip",
    type: "zip",
    size: "15.8 MB",
    uploadedAt: "Feb 18, 2026",
    downloads: 12,
  },
  {
    id: "3",
    name: "Algorithm_Analysis_Slides.pptx",
    type: "pptx",
    size: "5.2 MB",
    uploadedAt: "Feb 15, 2026",
    downloads: 28,
  },
  {
    id: "4",
    name: "Database_Design_Diagram.png",
    type: "png",
    size: "1.1 MB",
    uploadedAt: "Feb 12, 2026",
    downloads: 9,
  },
];

const SHARED_FILES: FileItem[] = [
  {
    id: "5",
    name: "Linear_Algebra_Notes.pdf",
    type: "pdf",
    size: "3.7 MB",
    uploadedAt: "Feb 19, 2026",
    downloads: 67,
    sharedWith: "Sarah K.",
  },
  {
    id: "6",
    name: "Web_Dev_Project.zip",
    type: "zip",
    size: "22.3 MB",
    uploadedAt: "Feb 14, 2026",
    downloads: 34,
    sharedWith: "Alex M.",
  },
  {
    id: "7",
    name: "OS_Concepts_Slides.pptx",
    type: "pptx",
    size: "8.9 MB",
    uploadedAt: "Feb 10, 2026",
    downloads: 51,
    sharedWith: "Group - CS401",
  },
];

const RECENT_FILES: FileItem[] = [
  ...MY_FILES.slice(0, 2),
  SHARED_FILES[0],
].sort(() => Math.random() - 0.5);



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

function getFolderIcon(color: string, bgColor: string) {
  return (
    <div
      className="w-10 h-10 flex items-center justify-center rounded-lg"
      style={{ backgroundColor: bgColor }}
    >
      <FolderOpen size={20} style={{ color }} />
    </div>
  );
}


function FileRow({ file }: { file: FileItem }) {
  const [menuOpen, setMenuOpen] = useState(false);

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
        <button className="flex items-center gap-1 px-3 py-1.5 text-xs border border-gray-200 rounded-md hover:bg-gray-100 text-gray-600 transition-colors">
          <Download size={13} />
          Download
        </button>
        <button className="flex items-center gap-1 px-3 py-1.5 text-xs border border-gray-200 rounded-md hover:bg-gray-100 text-gray-600 transition-colors">
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
              <button className="w-full text-left px-3 py-2 text-xs text-red-500 hover:bg-red-50">
                Delete
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


export default function FilesPage() {
  const [activeTab, setActiveTab] = useState<"my" | "shared" | "recent">("my");
  const [searchQuery, setSearchQuery] = useState("");
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [dragging, setDragging] = useState(false);

  const tabFiles =
    activeTab === "my"
      ? MY_FILES
      : activeTab === "shared"
      ? SHARED_FILES
      : RECENT_FILES;

  const filteredFiles = tabFiles.filter((f) =>
    f.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">File Sharing</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Share and collaborate on files with your community
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
        <div className="bg-white rounded-xl border border-gray-200 px-4 sm:px-6 py-3 flex flex-col items-center justify-center sm:min-w-[120px]">
          <span className="text-2xl font-bold text-gray-900">142</span>
          <span className="text-xs text-gray-400">Total Files</span>
        </div>
      </div>

      {/* Folders */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">Folders</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {FOLDERS.map((folder) => (
            <button
              key={folder.name}
              className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all text-left"
            >
              {getFolderIcon(folder.color, folder.bgColor)}
              <div>
                <p className="text-sm font-medium text-gray-800 leading-tight">
                  {folder.name}
                </p>
                <p className="text-xs text-gray-400">{folder.count} files</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Tabs + File List */}
      <div className="bg-white rounded-xl border border-gray-200">
        {/* Tabs */}
        <div className="flex border-b border-gray-100 px-3 sm:px-4 overflow-x-auto">
          {(
            [
              { key: "my", label: "My Files" },
              { key: "shared", label: "Shared with Me" },
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
        {filteredFiles.length > 0 ? (
          filteredFiles.map((file) => <FileRow key={file.id} file={file} />)
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
                // handle file drop
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
              <p className="text-xs text-gray-400 mt-1">
                or{" "}
                <span className="text-teal-600 cursor-pointer font-medium">
                  browse files
                </span>
              </p>
              <p className="text-xs text-gray-400 mt-3">
                PDF, DOCX, PNG, ZIP, PPTX • Max 50 MB
              </p>
            </div>

            {/* Folder select */}
            <div className="mb-4">
              <label className="text-xs font-medium text-gray-600 block mb-1">
                Save to folder
              </label>
              <div className="relative">
                <select className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 appearance-none outline-none focus:border-teal-500 bg-white pr-8">
                  <option>Select a folder...</option>
                  {FOLDERS.map((f) => (
                    <option key={f.name}>{f.name}</option>
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
                className="flex-1 py-2 rounded-lg text-sm font-medium text-white transition-colors"
                style={{ backgroundColor: "#0d9488" }}
              >
                Upload
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
