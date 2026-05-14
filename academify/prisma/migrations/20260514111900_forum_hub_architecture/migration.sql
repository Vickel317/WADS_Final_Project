/*
  Warnings:

  - You are about to drop the column `categoryID` on the `Post` table. All the data in the column will be lost.
  - You are about to drop the `Category` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `CategoryModerator` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `forumID` to the `Event` table without a default value. This is not possible if the table is not empty.
  - Added the required column `forumID` to the `Post` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "SpaceRole" AS ENUM ('MEMBER', 'MODERATOR', 'OWNER');

-- DropForeignKey
ALTER TABLE "CategoryModerator" DROP CONSTRAINT "CategoryModerator_categoryID_fkey";

-- DropForeignKey
ALTER TABLE "CategoryModerator" DROP CONSTRAINT "CategoryModerator_userID_fkey";

-- DropForeignKey
ALTER TABLE "Post" DROP CONSTRAINT "Post_categoryID_fkey";

-- DropIndex
DROP INDEX "Post_categoryID_idx";

-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "forumID" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Post" DROP COLUMN "categoryID",
ADD COLUMN     "forumID" TEXT NOT NULL;

-- DropTable
DROP TABLE "Category";

-- DropTable
DROP TABLE "CategoryModerator";

-- CreateTable
CREATE TABLE "ForumHub" (
    "forumID" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ForumHub_pkey" PRIMARY KEY ("forumID")
);

-- CreateTable
CREATE TABLE "ForumModerator" (
    "forumID" TEXT NOT NULL,
    "userID" TEXT NOT NULL,

    CONSTRAINT "ForumModerator_pkey" PRIMARY KEY ("forumID","userID")
);

-- CreateTable
CREATE TABLE "CollabSpace" (
    "spaceID" TEXT NOT NULL,
    "forumID" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CollabSpace_pkey" PRIMARY KEY ("spaceID")
);

-- CreateTable
CREATE TABLE "SpaceMember" (
    "spaceID" TEXT NOT NULL,
    "userID" TEXT NOT NULL,
    "role" "SpaceRole" NOT NULL DEFAULT 'MEMBER',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SpaceMember_pkey" PRIMARY KEY ("spaceID","userID")
);

-- CreateIndex
CREATE UNIQUE INDEX "ForumHub_name_key" ON "ForumHub"("name");

-- CreateIndex
CREATE INDEX "CollabSpace_forumID_idx" ON "CollabSpace"("forumID");

-- CreateIndex
CREATE INDEX "SpaceMember_userID_idx" ON "SpaceMember"("userID");

-- CreateIndex
CREATE INDEX "Event_forumID_idx" ON "Event"("forumID");

-- CreateIndex
CREATE INDEX "Post_forumID_idx" ON "Post"("forumID");

-- AddForeignKey
ALTER TABLE "ForumModerator" ADD CONSTRAINT "ForumModerator_forumID_fkey" FOREIGN KEY ("forumID") REFERENCES "ForumHub"("forumID") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ForumModerator" ADD CONSTRAINT "ForumModerator_userID_fkey" FOREIGN KEY ("userID") REFERENCES "User"("userID") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollabSpace" ADD CONSTRAINT "CollabSpace_forumID_fkey" FOREIGN KEY ("forumID") REFERENCES "ForumHub"("forumID") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpaceMember" ADD CONSTRAINT "SpaceMember_spaceID_fkey" FOREIGN KEY ("spaceID") REFERENCES "CollabSpace"("spaceID") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpaceMember" ADD CONSTRAINT "SpaceMember_userID_fkey" FOREIGN KEY ("userID") REFERENCES "User"("userID") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Post" ADD CONSTRAINT "Post_forumID_fkey" FOREIGN KEY ("forumID") REFERENCES "ForumHub"("forumID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_forumID_fkey" FOREIGN KEY ("forumID") REFERENCES "ForumHub"("forumID") ON DELETE CASCADE ON UPDATE CASCADE;
