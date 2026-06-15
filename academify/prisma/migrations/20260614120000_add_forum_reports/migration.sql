-- AlterTable
ALTER TABLE "ReportReview" ADD COLUMN "reportedForumID" TEXT;

-- CreateIndex
CREATE INDEX "ReportReview_reportedForumID_idx" ON "ReportReview"("reportedForumID");

-- AddForeignKey
ALTER TABLE "ReportReview" ADD CONSTRAINT "ReportReview_reportedForumID_fkey" FOREIGN KEY ("reportedForumID") REFERENCES "ForumHub"("forumID") ON DELETE CASCADE ON UPDATE CASCADE;
