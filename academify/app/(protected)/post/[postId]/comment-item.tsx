"use client";

import { useState } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import CommentForm from "./comment-form";
import CommentActions from "./comment-actions";
import CommentLikeButton from "./comment-like-button";
import { ReportButton } from "@/components/report-button";

type CommentData = {
  id: string;
  postId: string;
  content: string;
  authorId: string;
  authorName: string;
  parentId: string | null;
  createdAt: string;
  replies: CommentData[];
};

export default function CommentItem({
  comment,
  currentUserId,
  canModerate = false,
  depth = 0,
}: {
  comment: CommentData;
  currentUserId: string;
  canModerate?: boolean;
  depth?: number;
}) {
  const [replying, setReplying] = useState(false);
  const maxDepth = 3;

  const isAuthor = comment.authorId === currentUserId;
  const canEdit = isAuthor;
  const canDelete = isAuthor || canModerate;

  return (
    <div className={depth > 0 ? "ml-6 mt-3 border-l-2 border-gray-100 pl-4" : ""}>
      <div className="rounded-xl border border-gray-100 px-4 py-3">
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <Link
            href={`?profileId=${comment.authorId}`}
            className="font-medium text-gray-700 hover:text-teal-600 hover:underline"
          >
            {comment.authorName}
          </Link>
          <span>·</span>
          <span>{formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}</span>
        </div>
        <p className="mt-2 text-sm text-gray-700">{comment.content}</p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <CommentLikeButton commentId={comment.id} />
          {depth < maxDepth && (
            <button
              onClick={() => setReplying(!replying)}
              className="rounded border border-gray-200 px-2 py-1 text-[11px] font-semibold text-gray-700 hover:bg-gray-50"
            >
              Reply
            </button>
          )}
          {!isAuthor && (
            <ReportButton
              targetType="comment"
              targetId={comment.id}
              targetLabel={`Comment by ${comment.authorName}`}
              className="rounded border border-gray-200 px-2 py-1 text-[11px] font-medium text-gray-500 hover:border-red-200 hover:bg-red-50 hover:text-red-600 transition"
            />
          )}
          <CommentActions
            commentId={comment.id}
            initialContent={comment.content}
            canEdit={canEdit}
            canDelete={canDelete}
          />
        </div>
      </div>

      {replying && (
        <div className="mt-3 ml-6">
          <CommentForm
            postId={comment.postId}
            parentId={comment.id}
            replyTo={comment.authorName}
            onCancel={() => setReplying(false)}
          />
        </div>
      )}

      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-2">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              currentUserId={currentUserId}
              canModerate={canModerate}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}
