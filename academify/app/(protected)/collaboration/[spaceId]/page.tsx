import Link from "next/link";
import { format } from "date-fns";
import JoinSpaceButton from "@/components/join-space-button";

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

  const payload = await res.json().catch(() => ({}));
  const space = payload.space;
  const isMember = Boolean(payload.isMember);

  return (
    <div className="p-6">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">{space.name}</h1>
          <p className="text-sm text-gray-600 mt-1">{space.description ?? "No description provided."}</p>
          <p className="text-xs text-gray-400 mt-2">Forum {space.forumID}</p>
        </div>
        <div className="flex flex-col items-end gap-2 text-right">
          <Link href="/collaboration" className="text-sm text-gray-500">Back to spaces</Link>
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
