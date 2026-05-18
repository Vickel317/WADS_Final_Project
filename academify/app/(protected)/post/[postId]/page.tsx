import { formatDistanceToNow } from "date-fns";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/get-session";

export default async function PostDetailPage({
	params,
}: {
	params: Promise<{ postId: string }>;
}) {
	const session = await getSession();
	if (!session) redirect("/login");

	const resolvedParams = await params;
	const postId = typeof resolvedParams?.postId === "string" ? resolvedParams.postId : "";
	if (!postId) notFound();

	const post = await prisma.post.findUnique({
		where: { postID: postId },
		select: {
			postID: true,
			title: true,
			content: true,
			forumID: true,
			authorID: true,
			moderationStatus: true,
			createdAt: true,
			updatedAt: true,
		},
	});

	if (!post) notFound();

	const [author, forum, file, comments] = await Promise.all([
		prisma.user.findUnique({
			where: { userId: post.authorID },
			select: { name: true },
		}),
		prisma.forumHub.findUnique({
			where: { forumID: post.forumID },
			select: { forumID: true, name: true },
		}),
		prisma.file.findUnique({
			where: { postID: post.postID },
		}),
		prisma.comment.findMany({
			where: { postID: post.postID },
			include: { author: { select: { name: true } } },
			orderBy: { createdAt: "asc" },
		}),
	]);

	return (
		<div className="space-y-6">
			<div className="rounded-2xl border border-gray-100 bg-white p-6">
				<div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
					<div>
						<span className="inline-flex items-center rounded-full bg-teal-50 px-3 py-1 text-xs font-medium text-teal-700">
							{forum?.name ?? "Forum"}
						</span>
						<h1 className="mt-3 text-2xl font-semibold text-gray-900">
							{post.title}
						</h1>
						<div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-gray-400">
							  <span>by {author?.name ?? "Unknown"}</span>
							<span>•</span>
							<span>
								{formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
							</span>
							<span>•</span>
							<span className="uppercase">{post.moderationStatus}</span>
						</div>
					</div>
					<div className="text-xs text-gray-400">
						Updated {formatDistanceToNow(new Date(post.updatedAt), { addSuffix: true })}
					</div>
				</div>

				<div className="mt-5 whitespace-pre-wrap text-sm text-gray-700">
					{post.content}
				</div>

				{file && (
					<div className="mt-6 rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600">
						<div className="flex flex-wrap items-center gap-2">
							<span className="font-medium">Attachment:</span>
							<a
								href={file.fileUrl}
								className="text-teal-600 hover:underline"
							>
								{file.fileName}
							</a>
							<span className="text-xs text-gray-400">
								({Math.ceil(file.fileSize / 1024)} KB)
							</span>
						</div>
					</div>
				)}
			</div>

			<div className="rounded-2xl border border-gray-100 bg-white p-6">
				<h2 className="text-sm font-semibold text-gray-700">
					Comments ({comments.length})
				</h2>
				<div className="mt-4 space-y-4">
					{comments.length === 0 ? (
						<p className="text-sm text-gray-400">No comments yet.</p>
					) : (
						comments.map((comment) => (
							<div key={comment.commentID} className="rounded-xl border border-gray-100 px-4 py-3">
								<div className="flex items-center gap-2 text-xs text-gray-400">
									<span className="font-medium text-gray-700">
										{comment.author.name}
									</span>
									<span>•</span>
									<span>
										{formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
									</span>
								</div>
								<p className="mt-2 text-sm text-gray-700">{comment.content}</p>
							</div>
						))
					)}
				</div>
			</div>
		</div>
	);
}
