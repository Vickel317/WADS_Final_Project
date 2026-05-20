/*
  Warnings:

  - The values [CO_HOST] on the enum `EventRole` will be removed. If these variants are still used in the database, this will fail.
  - The values [MODERATOR] on the enum `UserRole` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "EventRole_new" AS ENUM ('GUEST', 'HOST');
ALTER TABLE "public"."EventAttendee" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "EventAttendee" ALTER COLUMN "role" TYPE "EventRole_new" USING ("role"::text::"EventRole_new");
ALTER TYPE "EventRole" RENAME TO "EventRole_old";
ALTER TYPE "EventRole_new" RENAME TO "EventRole";
DROP TYPE "public"."EventRole_old";
ALTER TABLE "EventAttendee" ALTER COLUMN "role" SET DEFAULT 'GUEST';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "UserRole_new" AS ENUM ('STUDENT', 'LECTURER', 'ADMIN');
ALTER TABLE "public"."User" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "User" ALTER COLUMN "role" TYPE "UserRole_new" USING ("role"::text::"UserRole_new");
ALTER TYPE "UserRole" RENAME TO "UserRole_old";
ALTER TYPE "UserRole_new" RENAME TO "UserRole";
DROP TYPE "public"."UserRole_old";
ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'STUDENT';
COMMIT;

-- CreateTable
CREATE TABLE "CategoryModerator" (
    "categoryID" TEXT NOT NULL,
    "userID" TEXT NOT NULL,

    CONSTRAINT "CategoryModerator_pkey" PRIMARY KEY ("categoryID","userID")
);

-- AddForeignKey
ALTER TABLE "CategoryModerator" ADD CONSTRAINT "CategoryModerator_categoryID_fkey" FOREIGN KEY ("categoryID") REFERENCES "Category"("categoryID") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CategoryModerator" ADD CONSTRAINT "CategoryModerator_userID_fkey" FOREIGN KEY ("userID") REFERENCES "User"("userID") ON DELETE CASCADE ON UPDATE CASCADE;
