/*
  Warnings:

  - You are about to drop the `Endorsement` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Endorsement" DROP CONSTRAINT "Endorsement_endorsedID_fkey";

-- DropForeignKey
ALTER TABLE "Endorsement" DROP CONSTRAINT "Endorsement_endorserID_fkey";

-- DropTable
DROP TABLE "Endorsement";
