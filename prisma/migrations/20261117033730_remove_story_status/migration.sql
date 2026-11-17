-- Remove the persisted story status so it is derived from its tasks again.
ALTER TABLE "Story" DROP COLUMN "status";

DROP TYPE "StoryStatus";
