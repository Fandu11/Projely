-- CreateEnum
CREATE TYPE "StoryStatus" AS ENUM ('TODO', 'IN_PROGRESS', 'TO_REVIEW', 'DONE');

-- AlterTable
ALTER TABLE "Story" ADD COLUMN     "status" "StoryStatus" NOT NULL DEFAULT 'TODO';
