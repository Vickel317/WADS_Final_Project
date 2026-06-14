-- AlterTable
ALTER TABLE "Post" ADD COLUMN "summaryJson" JSONB;
ALTER TABLE "Post" ADD COLUMN "summaryAt" TIMESTAMP(3);
ALTER TABLE "Post" ADD COLUMN "summaryCommentCount" INTEGER;
