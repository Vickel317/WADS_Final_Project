import { notFound, redirect } from "next/navigation";
import PostEditForm from "@/components/post-edit-form";
import { getSession } from "@/lib/get-session";
import { prisma } from "@/lib/prisma";

export default async function EditPostPage({
  params,
}: {
  params: Promise<{ postId: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { postId } = await params;
  if (!postId) notFound();

  const post = await prisma.post.findUnique({
    where: { postID: postId },
    select: {
      postID: true,
      title: true,
      content: true,
      authorID: true,
      moderationStatus: true,
    },
  });

  if (!post) notFound();

  const isAuthor = post.authorID === session.user.userId;
  const canEdit = isAuthor && post.moderationStatus === "APPROVED";
  if (!canEdit) {
    redirect(`/post/${postId}`);
  }

  return <PostEditForm postId={post.postID} title={post.title} content={post.content} />;
}
