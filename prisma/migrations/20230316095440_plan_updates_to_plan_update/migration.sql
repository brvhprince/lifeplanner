/*
  Warnings:

  - You are about to drop the `FuturePlanUpdates` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "FuturePlanUpdates" DROP CONSTRAINT "FuturePlanUpdates_plan_id_fkey";

-- DropTable
DROP TABLE "FuturePlanUpdates";

-- CreateTable
CREATE TABLE "FuturePlanUpdate" (
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

    CONSTRAINT "FuturePlanUpdate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FuturePlanUpdate_update_id_key" ON "FuturePlanUpdate"("update_id");

-- CreateIndex
CREATE UNIQUE INDEX "FuturePlanUpdate_hash_key" ON "FuturePlanUpdate"("hash");

-- AddForeignKey
ALTER TABLE "FuturePlanUpdate" ADD CONSTRAINT "FuturePlanUpdate_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "FuturePlan"("plan_id") ON DELETE CASCADE ON UPDATE CASCADE;
