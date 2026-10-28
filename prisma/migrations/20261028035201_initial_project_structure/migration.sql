/*
  Warnings:

  - You are about to drop the column `sprintId` on the `Story` table. All the data in the column will be lost.
  - You are about to drop the column `storyId` on the `Task` table. All the data in the column will be lost.
  - Added the required column `projectId` to the `Task` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Story" DROP CONSTRAINT "Story_sprintId_fkey";

-- DropForeignKey
ALTER TABLE "Task" DROP CONSTRAINT "Task_storyId_fkey";

-- DropIndex
DROP INDEX "Story_sprintId_idx";

-- DropIndex
DROP INDEX "Task_storyId_status_idx";

-- AlterTable
ALTER TABLE "Story" DROP COLUMN "sprintId";

-- AlterTable
ALTER TABLE "Task" DROP COLUMN "storyId",
ADD COLUMN     "projectId" TEXT NOT NULL,
ADD COLUMN     "sprintId" TEXT;

-- CreateIndex
CREATE INDEX "Task_projectId_status_idx" ON "Task"("projectId", "status");

-- CreateIndex
CREATE INDEX "Task_sprintId_idx" ON "Task"("sprintId");

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_sprintId_fkey" FOREIGN KEY ("sprintId") REFERENCES "Sprint"("id") ON DELETE SET NULL ON UPDATE CASCADE;
