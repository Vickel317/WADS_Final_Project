-- CreateEnum
CREATE TYPE "EventRole" AS ENUM ('GUEST', 'CO_HOST');

-- AlterTable
ALTER TABLE "EventAttendee" ADD COLUMN     "role" "EventRole" NOT NULL DEFAULT 'GUEST';
