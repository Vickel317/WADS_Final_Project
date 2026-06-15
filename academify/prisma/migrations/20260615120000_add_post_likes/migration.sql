-- CreateTable
CREATE TABLE "PostLike" (
    "postID" TEXT NOT NULL,
    "userID" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PostLike_pkey" PRIMARY KEY ("postID","userID")
);

-- CreateIndex
CREATE INDEX "PostLike_postID_idx" ON "PostLike"("postID");

-- CreateIndex
CREATE INDEX "PostLike_userID_idx" ON "PostLike"("userID");

-- AddForeignKey
ALTER TABLE "PostLike" ADD CONSTRAINT "PostLike_postID_fkey" FOREIGN KEY ("postID") REFERENCES "Post"("postID") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostLike" ADD CONSTRAINT "PostLike_userID_fkey" FOREIGN KEY ("userID") REFERENCES "User"("userID") ON DELETE CASCADE ON UPDATE CASCADE;
