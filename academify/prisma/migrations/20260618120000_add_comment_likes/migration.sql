-- CreateTable
CREATE TABLE "CommentLike" (
    "commentID" TEXT NOT NULL,
    "userID" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommentLike_pkey" PRIMARY KEY ("commentID","userID")
);

-- CreateIndex
CREATE INDEX "CommentLike_commentID_idx" ON "CommentLike"("commentID");

-- CreateIndex
CREATE INDEX "CommentLike_userID_idx" ON "CommentLike"("userID");

-- AddForeignKey
ALTER TABLE "CommentLike" ADD CONSTRAINT "CommentLike_commentID_fkey" FOREIGN KEY ("commentID") REFERENCES "Comment"("commentID") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommentLike" ADD CONSTRAINT "CommentLike_userID_fkey" FOREIGN KEY ("userID") REFERENCES "User"("userID") ON DELETE CASCADE ON UPDATE CASCADE;
