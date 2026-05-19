-- AlterTable
ALTER TABLE "File" ADD COLUMN     "spaceID" TEXT,
ALTER COLUMN "postID" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "File_spaceID_idx" ON "File"("spaceID");

-- AddForeignKey
ALTER TABLE "File" ADD CONSTRAINT "File_spaceID_fkey" FOREIGN KEY ("spaceID") REFERENCES "CollabSpace"("spaceID") ON DELETE CASCADE ON UPDATE CASCADE;
