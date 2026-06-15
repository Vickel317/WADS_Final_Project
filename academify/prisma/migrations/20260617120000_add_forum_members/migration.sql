-- CreateTable
CREATE TABLE "ForumMember" (
    "forumID" TEXT NOT NULL,
    "userID" TEXT NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ForumMember_pkey" PRIMARY KEY ("forumID","userID")
);

-- CreateIndex
CREATE INDEX "ForumMember_userID_idx" ON "ForumMember"("userID");

-- AddForeignKey
ALTER TABLE "ForumMember" ADD CONSTRAINT "ForumMember_forumID_fkey" FOREIGN KEY ("forumID") REFERENCES "ForumHub"("forumID") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ForumMember" ADD CONSTRAINT "ForumMember_userID_fkey" FOREIGN KEY ("userID") REFERENCES "User"("userID") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill members from existing activity
INSERT INTO "ForumMember" ("forumID", "userID", "joinedAt")
SELECT p."forumID", p."authorID", MIN(p."createdAt")
FROM "Post" p
GROUP BY p."forumID", p."authorID"
ON CONFLICT DO NOTHING;

INSERT INTO "ForumMember" ("forumID", "userID", "joinedAt")
SELECT po."forumID", c."authorID", MIN(c."createdAt")
FROM "Comment" c
JOIN "Post" po ON po."postID" = c."postID"
GROUP BY po."forumID", c."authorID"
ON CONFLICT DO NOTHING;

INSERT INTO "ForumMember" ("forumID", "userID", "joinedAt")
SELECT cs."forumID", sm."userID", MIN(sm."joinedAt")
FROM "SpaceMember" sm
JOIN "CollabSpace" cs ON cs."spaceID" = sm."spaceID"
GROUP BY cs."forumID", sm."userID"
ON CONFLICT DO NOTHING;
