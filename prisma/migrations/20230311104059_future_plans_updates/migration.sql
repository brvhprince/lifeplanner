/*
  Warnings:

  - A unique constraint covering the columns `[memory_id]` on the table `Memories` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `memory_id` to the `Memories` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Memories" ADD COLUMN     "memory_id" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "FuturePlanUpdates" (
    "id" SERIAL NOT NULL,
    "update_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "plan_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "metadata" JSONB,
    "files" TEXT,
    "hash" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FuturePlanUpdates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FuturePlanUpdates_update_id_key" ON "FuturePlanUpdates"("update_id");

-- CreateIndex
CREATE UNIQUE INDEX "FuturePlanUpdates_hash_key" ON "FuturePlanUpdates"("hash");

-- CreateIndex
CREATE UNIQUE INDEX "Memories_memory_id_key" ON "Memories"("memory_id");

-- AddForeignKey
ALTER TABLE "FuturePlanUpdates" ADD CONSTRAINT "FuturePlanUpdates_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "FuturePlan"("plan_id") ON DELETE CASCADE ON UPDATE CASCADE;
