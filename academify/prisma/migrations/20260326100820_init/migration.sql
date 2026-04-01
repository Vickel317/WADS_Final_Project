-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('STUDENT', 'MODERATOR', 'ADMIN');

-- CreateEnum
CREATE TYPE "ModerationStatus" AS ENUM ('PENDING', 'APPROVED', 'FLAGGED', 'BLOCKED');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('PENDING', 'UNDER_REVIEW', 'RESOLVED', 'DISMISSED');

-- CreateEnum
CREATE TYPE "ActionType" AS ENUM ('DELETE_POST', 'DELETE_COMMENT', 'APPROVE_POST', 'FLAG_POST', 'WARN_USER', 'SUSPEND_USER', 'BAN_USER', 'UNBAN_USER');

-- CreateTable
CREATE TABLE "User" (
    "userID" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'STUDENT',
    "major" TEXT,
    "bio" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("userID")
);

-- CreateTable
CREATE TABLE "Category" (
    "categoryID" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("categoryID")
);

-- CreateTable
CREATE TABLE "Post" (
    "postID" TEXT NOT NULL,
    "authorID" TEXT NOT NULL,
    "categoryID" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "moderationStatus" "ModerationStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Post_pkey" PRIMARY KEY ("postID")
);

-- CreateTable
CREATE TABLE "Comment" (
    "commentID" TEXT NOT NULL,
    "postID" TEXT NOT NULL,
    "authorID" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Comment_pkey" PRIMARY KEY ("commentID")
);

-- CreateTable
CREATE TABLE "Event" (
    "eventID" TEXT NOT NULL,
    "creatorID" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "dateTime" TIMESTAMP(3) NOT NULL,
    "location" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("eventID")
);

-- CreateTable
CREATE TABLE "EventAttendee" (
    "eventID" TEXT NOT NULL,
    "userID" TEXT NOT NULL,

    CONSTRAINT "EventAttendee_pkey" PRIMARY KEY ("eventID","userID")
);

-- CreateTable
CREATE TABLE "File" (
    "fileID" TEXT NOT NULL,
    "postID" TEXT NOT NULL,
    "uploadedByID" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "File_pkey" PRIMARY KEY ("fileID")
);

-- CreateTable
CREATE TABLE "Message" (
    "messageID" TEXT NOT NULL,
    "senderID" TEXT NOT NULL,
    "receiverID" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("messageID")
);

-- CreateTable
CREATE TABLE "ReportReview" (
    "reportreviewID" TEXT NOT NULL,
    "reporterID" TEXT NOT NULL,
    "reportedUserID" TEXT,
    "reportedPostID" TEXT,
    "reportedCommentID" TEXT,
    "reason" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" "ReportStatus" NOT NULL DEFAULT 'PENDING',
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReportReview_pkey" PRIMARY KEY ("reportreviewID")
);

-- CreateTable
CREATE TABLE "ModerationActionLog" (
    "ModaiID" TEXT NOT NULL,
    "modID" TEXT NOT NULL,
    "targetUserID" TEXT,
    "targetPostID" TEXT,
    "targetCommentID" TEXT,
    "relatedReportID" TEXT,
    "actionType" "ActionType" NOT NULL,
    "reason" TEXT NOT NULL,
    "details" TEXT,
    "duration" INTEGER,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ModerationActionLog_pkey" PRIMARY KEY ("ModaiID")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Category_name_key" ON "Category"("name");

-- CreateIndex
CREATE INDEX "Post_authorID_idx" ON "Post"("authorID");

-- CreateIndex
CREATE INDEX "Post_categoryID_idx" ON "Post"("categoryID");

-- CreateIndex
CREATE INDEX "Post_createdAt_idx" ON "Post"("createdAt");

-- CreateIndex
CREATE INDEX "Comment_postID_idx" ON "Comment"("postID");

-- CreateIndex
CREATE INDEX "Comment_authorID_idx" ON "Comment"("authorID");

-- CreateIndex
CREATE INDEX "Event_creatorID_idx" ON "Event"("creatorID");

-- CreateIndex
CREATE INDEX "Event_dateTime_idx" ON "Event"("dateTime");

-- CreateIndex
CREATE UNIQUE INDEX "File_postID_key" ON "File"("postID");

-- CreateIndex
CREATE INDEX "File_uploadedByID_idx" ON "File"("uploadedByID");

-- CreateIndex
CREATE INDEX "Message_senderID_idx" ON "Message"("senderID");

-- CreateIndex
CREATE INDEX "Message_receiverID_idx" ON "Message"("receiverID");

-- CreateIndex
CREATE INDEX "Message_sentAt_idx" ON "Message"("sentAt");

-- CreateIndex
CREATE INDEX "ReportReview_reporterID_idx" ON "ReportReview"("reporterID");

-- CreateIndex
CREATE INDEX "ReportReview_status_idx" ON "ReportReview"("status");

-- CreateIndex
CREATE INDEX "ModerationActionLog_modID_idx" ON "ModerationActionLog"("modID");

-- CreateIndex
CREATE INDEX "ModerationActionLog_timestamp_idx" ON "ModerationActionLog"("timestamp");

-- AddForeignKey
ALTER TABLE "Post" ADD CONSTRAINT "Post_authorID_fkey" FOREIGN KEY ("authorID") REFERENCES "User"("userID") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Post" ADD CONSTRAINT "Post_categoryID_fkey" FOREIGN KEY ("categoryID") REFERENCES "Category"("categoryID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_postID_fkey" FOREIGN KEY ("postID") REFERENCES "Post"("postID") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_authorID_fkey" FOREIGN KEY ("authorID") REFERENCES "User"("userID") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_creatorID_fkey" FOREIGN KEY ("creatorID") REFERENCES "User"("userID") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventAttendee" ADD CONSTRAINT "EventAttendee_eventID_fkey" FOREIGN KEY ("eventID") REFERENCES "Event"("eventID") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventAttendee" ADD CONSTRAINT "EventAttendee_userID_fkey" FOREIGN KEY ("userID") REFERENCES "User"("userID") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "File" ADD CONSTRAINT "File_postID_fkey" FOREIGN KEY ("postID") REFERENCES "Post"("postID") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "File" ADD CONSTRAINT "File_uploadedByID_fkey" FOREIGN KEY ("uploadedByID") REFERENCES "User"("userID") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_senderID_fkey" FOREIGN KEY ("senderID") REFERENCES "User"("userID") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_receiverID_fkey" FOREIGN KEY ("receiverID") REFERENCES "User"("userID") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportReview" ADD CONSTRAINT "ReportReview_reporterID_fkey" FOREIGN KEY ("reporterID") REFERENCES "User"("userID") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportReview" ADD CONSTRAINT "ReportReview_reportedUserID_fkey" FOREIGN KEY ("reportedUserID") REFERENCES "User"("userID") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportReview" ADD CONSTRAINT "ReportReview_reportedPostID_fkey" FOREIGN KEY ("reportedPostID") REFERENCES "Post"("postID") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportReview" ADD CONSTRAINT "ReportReview_reportedCommentID_fkey" FOREIGN KEY ("reportedCommentID") REFERENCES "Comment"("commentID") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModerationActionLog" ADD CONSTRAINT "ModerationActionLog_modID_fkey" FOREIGN KEY ("modID") REFERENCES "User"("userID") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModerationActionLog" ADD CONSTRAINT "ModerationActionLog_targetPostID_fkey" FOREIGN KEY ("targetPostID") REFERENCES "Post"("postID") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModerationActionLog" ADD CONSTRAINT "ModerationActionLog_targetCommentID_fkey" FOREIGN KEY ("targetCommentID") REFERENCES "Comment"("commentID") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModerationActionLog" ADD CONSTRAINT "ModerationActionLog_relatedReportID_fkey" FOREIGN KEY ("relatedReportID") REFERENCES "ReportReview"("reportreviewID") ON DELETE SET NULL ON UPDATE CASCADE;
