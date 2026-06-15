import Link from "next/link";
import { format } from "date-fns";
import { redirect } from "next/navigation";
import JoinSpaceButton from "@/components/join-space-button";
import SpaceBannerUpload from "@/components/space-banner-upload";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/get-session";

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
          updatedAt: true,
          uploadedBy: { select: { name: true } },
        },
      },
      forum: { select: { name: true } },
    },
  });
  if (!space) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-bold">Space not found</h1>
        <p className="text-sm text-gray-500">This collaboration space does not exist or could not be loaded.</p>
        <Link href="/collaboration" className="mt-4 inline-block text-teal-600">Back to spaces</Link>
      </div>
    );
  }

  const isMember = space.members.some((m) => m.user.userId === currentUserId);
  const isOwner = space.members.some((m) => m.user.userId === currentUserId && m.role === "OWNER");

  return (
    <div className="p-6">
      <Link
        href="/collaboration"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-teal-600 transition mb-4"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to spaces
      </Link>

      <div
        className="relative h-40 rounded-2xl overflow-hidden mb-6"
        style={
          // bannerUrl is not part of the current prisma include/select, so use fallback gradient
          { background: "linear-gradient(135deg, #065f46, #059669, #10b981)" }
        }
      >
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
        <h2 className="text-lg font-semibold">Files in this space</h2>
        <div className="mt-3 space-y-3">
          {space.files?.length ? (
            space.files.map((f: SpaceFileRow) => (
              <div key={f.fileID} className="rounded-lg border p-3 flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium">{f.fileName}</div>
                  <div className="text-xs text-gray-500">Uploaded by {f.uploadedBy?.name ?? 'Unknown'} • {format(new Date(f.updatedAt), 'PPP')}</div>
                </div>
                <a href={f.fileUrl} className="text-sm text-teal-600">Download</a>
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
