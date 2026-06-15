"use client";

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import CommentForm from "./comment-form";
import CommentActions from "./comment-actions";

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
  currentRole,
  depth = 0,
}: {
  comment: CommentData;
  currentUserId: string;
  currentRole: string;
  depth?: number;
}) {
  const [replying, setReplying] = useState(false);
  const maxDepth = 3;

  const isModOrAdmin = currentRole === "admin" || currentRole === "moderator";
  const isAuthor = comment.authorId === currentUserId;
  const canEdit = isAuthor;
  const canDelete = isAuthor || isModOrAdmin;

  return (
    <div className={depth > 0 ? "ml-6 mt-3 border-l-2 border-gray-100 pl-4" : ""}>
      <div className="rounded-xl border border-gray-100 px-4 py-3">
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <span className="font-medium text-gray-700">{comment.authorName}</span>
          <span>·</span>
          <span>{formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}</span>
        </div>
        <p className="mt-2 text-sm text-gray-700">{comment.content}</p>
        <div className="mt-2 flex items-center gap-2">
          {depth < maxDepth && (
            <button
              onClick={() => setReplying(!replying)}
              className="rounded border border-gray-200 px-2 py-1 text-[11px] font-semibold text-gray-700 hover:bg-gray-50"
            >
              Reply
            </button>
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
              currentRole={currentRole}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}
