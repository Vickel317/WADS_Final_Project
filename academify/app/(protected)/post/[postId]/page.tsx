import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/get-session";
import CommentForm from "./comment-form";
import LikeButton from "./like-button";
import { AiSummary } from "@/components/ai-summary";
import PostActions from "./post-actions";
import CommentItem from "./comment-item";
import { slugify } from "@/lib/slugify";
import { ReportButton } from "@/components/report-button";

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
  const role = String(session.user.role || "").toLowerCase();
  const canSeeHidden = role === "admin" || role === "moderator" || post.authorID === session.user.userId;
  if (post.moderationStatus !== "APPROVED" && !canSeeHidden) {
    notFound();
  }

	const [author, forum, file, topLevelComments, allComments] = await Promise.all([
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
			where: { postID: post.postID, parentId: null },
			include: {
				author: { select: { name: true } },
				replies: {
					include: { author: { select: { name: true } } },
					orderBy: { createdAt: "asc" },
				},
			},
			orderBy: { createdAt: "asc" },
		}),
		prisma.comment.count({ where: { postID: post.postID } }),
	]);
  const isModOrAdmin = role === "admin" || role === "moderator";
  const isAuthor = post.authorID === session.user.userId;
  const canDeletePost = isAuthor || isModOrAdmin;
  const isNonPublic = post.moderationStatus !== "APPROVED";
  const canEditPost = isAuthor && !isNonPublic;

	return (
		<div className="space-y-6">
      <div>
        <Link
          href={`/forums/${slugify(forum?.name ?? "")}`}
          className="inline-flex items-center rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
        >
          ← Back to forum
        </Link>
      </div>
			<div className={`rounded-2xl border border-gray-100 bg-white p-6 ${isNonPublic ? "opacity-70" : ""}`}>
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
              {new Date(post.updatedAt).getTime() - new Date(post.createdAt).getTime() > 1000 && (
                <>
                  <span>•</span>
                  <span className="font-semibold text-gray-500">edited</span>
                </>
              )}
							<span>•</span>
							<span className={`uppercase ${isNonPublic ? "text-amber-600 font-semibold" : ""}`}>{post.moderationStatus}</span>
						</div>
					</div>
					<div className="flex flex-col items-start gap-2 text-xs text-gray-400 sm:items-end">
						<LikeButton postId={post.postID} />
						{post.authorID !== session.user.userId && (
							<ReportButton
								targetType="post"
								targetId={post.postID}
								targetLabel={post.title}
								label="Report"
							/>
						)}
						<span>
							Updated {formatDistanceToNow(new Date(post.updatedAt), { addSuffix: true })}
						</span>
            <PostActions
              postId={post.postID}
              title={post.title}
              content={post.content}
              canDelete={canDeletePost}
              canEdit={canEditPost}
              showEditLockedNotice={isAuthor && isNonPublic}
            />
					</div>
				</div>

			<div className="mt-5 whitespace-pre-wrap text-sm text-gray-700">
				{post.content}
			</div>

			<AiSummary postId={post.postID} />

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
					Comments ({allComments})
				</h2>
				<div className="mt-4">
					<CommentForm postId={post.postID} />
				</div>
				<div className="mt-4 space-y-4">
					{topLevelComments.length === 0 ? (
						<p className="text-sm text-gray-400">No comments yet.</p>
					) : (
						topLevelComments.map((comment) => (
							<CommentItem
								key={comment.commentID}
								comment={{
									id: comment.commentID,
									postId: comment.postID,
									content: comment.content,
									authorId: comment.authorID,
									authorName: comment.author.name,
									parentId: comment.parentId,
									createdAt: comment.createdAt.toISOString(),
									replies: (comment.replies ?? []).map((r) => ({
										id: r.commentID,
										postId: r.postID,
										content: r.content,
										authorId: r.authorID,
										authorName: r.author.name,
										parentId: r.parentId,
										createdAt: r.createdAt.toISOString(),
										replies: [],
									})),
								}}
								currentUserId={session.user.userId}
								currentRole={role}
							/>
						))
					)}
				</div>
			</div>
		</div>
	);
}
