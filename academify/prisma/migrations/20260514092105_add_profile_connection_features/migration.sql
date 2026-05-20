-- CreateEnum
CREATE TYPE "AvailabilityStatus" AS ENUM ('AVAILABLE', 'BUSY', 'OFFLINE');

-- CreateEnum
CREATE TYPE "DMRestriction" AS ENUM ('ALL', 'CONNECTIONS', 'LECTURERS', 'NONE');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'WARNED', 'SUSPENDED', 'BANNED');

-- AlterEnum
ALTER TYPE "UserRole" ADD VALUE 'LECTURER';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "academicLevel" TEXT,
ADD COLUMN     "accountStatus" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN     "activeProjects" TEXT[],
ADD COLUMN     "askMeAbout" TEXT[],
ADD COLUMN     "availabilityStatus" "AvailabilityStatus" NOT NULL DEFAULT 'AVAILABLE',
ADD COLUMN     "consultationHours" TEXT,
ADD COLUMN     "department" TEXT,
ADD COLUMN     "dmRestriction" "DMRestriction" NOT NULL DEFAULT 'ALL',
ADD COLUMN     "isShadowBanned" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "portfolioLinks" TEXT[],
ADD COLUMN     "profileSetupComplete" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "showAcademicLevel" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "showEmail" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "showLastSeen" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "skillTags" TEXT[],
ADD COLUMN     "specializations" TEXT[],
ADD COLUMN     "verifiedPublications" TEXT[];

-- CreateTable
CREATE TABLE "Follow" (
    "followerId" TEXT NOT NULL,
    "followingId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Follow_pkey" PRIMARY KEY ("followerId","followingId")
);

-- CreateTable
CREATE TABLE "Endorsement" (
    "endorsementID" TEXT NOT NULL,
    "endorserID" TEXT NOT NULL,
    "endorsedID" TEXT NOT NULL,
    "skill" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Endorsement_pkey" PRIMARY KEY ("endorsementID")
);

-- CreateIndex
CREATE INDEX "Follow_followingId_idx" ON "Follow"("followingId");

-- CreateIndex
CREATE INDEX "Endorsement_endorsedID_idx" ON "Endorsement"("endorsedID");

-- CreateIndex
CREATE UNIQUE INDEX "Endorsement_endorserID_endorsedID_skill_key" ON "Endorsement"("endorserID", "endorsedID", "skill");

-- AddForeignKey
ALTER TABLE "Follow" ADD CONSTRAINT "Follow_followerId_fkey" FOREIGN KEY ("followerId") REFERENCES "User"("userID") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Follow" ADD CONSTRAINT "Follow_followingId_fkey" FOREIGN KEY ("followingId") REFERENCES "User"("userID") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Endorsement" ADD CONSTRAINT "Endorsement_endorserID_fkey" FOREIGN KEY ("endorserID") REFERENCES "User"("userID") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Endorsement" ADD CONSTRAINT "Endorsement_endorsedID_fkey" FOREIGN KEY ("endorsedID") REFERENCES "User"("userID") ON DELETE CASCADE ON UPDATE CASCADE;
