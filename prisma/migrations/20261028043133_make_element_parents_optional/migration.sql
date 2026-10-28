-- DropForeignKey
ALTER TABLE "Story" DROP CONSTRAINT "Story_epicId_fkey";

-- DropForeignKey
ALTER TABLE "Task" DROP CONSTRAINT "Task_storyId_fkey";

-- AlterTable
ALTER TABLE "Story" ALTER COLUMN "epicId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Task" ALTER COLUMN "storyId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Story" ADD CONSTRAINT "Story_epicId_fkey" FOREIGN KEY ("epicId") REFERENCES "Epic"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_storyId_fkey" FOREIGN KEY ("storyId") REFERENCES "Story"("id") ON DELETE SET NULL ON UPDATE CASCADE;
