/*
  Warnings:

  - You are about to drop the column `tag` on the `RelationshipEntry` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "RelationshipEntry" DROP COLUMN "tag",
ADD COLUMN     "tag_id" TEXT;

-- AddForeignKey
ALTER TABLE "RelationshipEntry" ADD CONSTRAINT "RelationshipEntry_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "RelationshipTag"("tag_id") ON DELETE SET NULL ON UPDATE SET NULL;
