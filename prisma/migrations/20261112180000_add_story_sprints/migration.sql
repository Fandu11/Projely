-- AlterTable
ALTER TABLE "Story" ADD COLUMN "sprintId" TEXT;

-- CreateIndex
CREATE INDEX "Story_sprintId_idx" ON "Story"("sprintId");

-- AddForeignKey
ALTER TABLE "Story"
ADD CONSTRAINT "Story_sprintId_fkey"
FOREIGN KEY ("sprintId") REFERENCES "Sprint"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
