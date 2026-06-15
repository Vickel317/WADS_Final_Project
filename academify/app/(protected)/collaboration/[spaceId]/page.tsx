import Link from "next/link";
import { format } from "date-fns";
import { redirect } from "next/navigation";
import JoinSpaceButton from "@/components/join-space-button";
import SpaceBannerUpload from "@/components/space-banner-upload";
import SpaceFileUpload from "@/components/space-file-upload";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/get-session";
import { getPresignedGetUrl } from "@/lib/storage";

type SpaceMemberRow = {
  user: { userId: string; name: string };
  role: string;
};

type SpaceFileRow = {
  fileID: string;
  fileName: string;
  fileUrl: string;
  updatedAt: Date;
  uploadedBy?: { name: string };
};

function formatFileSize(size: number) {
  if (size >= 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  if (size >= 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${size} B`;
}

export default async function SpacePage({ params }: { params: Promise<{ spaceId: string }> }) {
  const { spaceId } = await params;

  const session = await getSession();
  if (!session) redirect("/login");
  const currentUserId = session.user.userId;

  const space = await prisma.collabSpace.findUnique({
    where: { spaceID: spaceId },
    include: {
      members: { include: { user: { select: { userId: true, name: true } } } },
      files: {
        select: {
          fileID: true,
          fileName: true,
          fileUrl: true,
          fileType: true,
          fileSize: true,
          updatedAt: true,
          uploadedBy: { select: { name: true } },
        },
        orderBy: { updatedAt: "desc" },
      },
      forum: { select: { name: true } },
    },
  });
  if (!space) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-bold">Space not found</h1>
        <p className="text-sm text-gray-500">This collaboration space does not exist or could not be loaded.</p>
        <Link
          href="/collaboration"
          className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 hover:border-teal-300 hover:text-teal-700 transition"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to spaces
        </Link>
      </div>
    );
  }

  const isMember = space.members.some((m) => m.user.userId === currentUserId);
  const isOwner = space.members.some((m) => m.user.userId === currentUserId && m.role === "OWNER");

  const filesWithUrls = await Promise.all(
    (space.files ?? []).map(async (f: SpaceFileRow & { fileType: string; fileSize: number }) => ({
      ...f,
      downloadUrl: await getPresignedGetUrl(f.fileUrl),
    }))
  );

  const bannerImageUrl = space.bannerUrl
    ? space.bannerUrl.startsWith("http")
      ? space.bannerUrl
      : await getPresignedGetUrl(space.bannerUrl)
    : null;

  const bannerStyle = bannerImageUrl
    ? {
        backgroundImage: `url(${bannerImageUrl})`,
        backgroundSize: "cover" as const,
        backgroundPosition: "center" as const,
      }
    : { background: "linear-gradient(135deg, #065f46, #059669, #10b981)" };

  return (
    <div className="p-6">
      <Link
        href="/collaboration"
        className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 hover:border-teal-300 hover:text-teal-700 transition mb-4"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to spaces
      </Link>

      <div className="relative h-40 rounded-2xl overflow-hidden mb-6" style={bannerStyle}>
        <div className="absolute inset-0 bg-black/20" />
        <SpaceBannerUpload spaceId={spaceId} isOwner={isOwner} />
        <div className="absolute bottom-4 left-6 right-6 flex items-end justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">{space.name}</h1>
            <p className="text-sm text-white/80 mt-1">{space.description ?? "No description provided."}</p>
            <p className="text-xs text-white/60 mt-1">Forum {space.forum?.name ?? "Unknown"}</p>
          </div>
          <JoinSpaceButton spaceId={spaceId} isMember={isMember} />
        </div>
      </div>

      {isMember && (
        <div className="mb-6">
          <Link
            href={`/messages/space-${spaceId}`}
            className="inline-flex items-center gap-2 rounded-xl border border-teal-200 bg-teal-50 px-4 py-2.5 text-sm font-medium text-teal-700 hover:bg-teal-100 transition"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
            Open space chat
          </Link>
        </div>
      )}

      <section className="mb-6">
        <h2 className="text-lg font-semibold">Members</h2>
        <div className="mt-3 grid gap-2 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {space.members?.length ? (
            space.members.map((m: SpaceMemberRow) => (
              <div key={m.user.userId} className="rounded-lg border p-3">
                <div className="text-sm font-medium">{m.user.name}</div>
                <div className="text-xs text-gray-500">{m.role}</div>
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-500">No members</p>
          )}
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">Files in this space</h2>
          <SpaceFileUpload spaceId={spaceId} spaceName={space.name} canUpload={isMember} />
        </div>
        <div className="mt-3 space-y-3">
          {filesWithUrls.length ? (
            filesWithUrls.map((f) => (
              <div key={f.fileID} className="rounded-lg border p-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">{f.fileName}</div>
                  <div className="text-xs text-gray-500">
                    Uploaded by {f.uploadedBy?.name ?? "Unknown"} • {format(new Date(f.updatedAt), "PPP")} • {formatFileSize(f.fileSize)}
                  </div>
                </div>
                <a
                  href={f.downloadUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 rounded-full border border-teal-200 px-3 py-1.5 text-sm font-medium text-teal-700 hover:bg-teal-50 transition"
                >
                  Download
                </a>
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-500">No files attached to this space.</p>
          )}
        </div>
      </section>
    </div>
  );
}
