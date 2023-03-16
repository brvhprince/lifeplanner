-- AlterTable
ALTER TABLE "Wishlist" ADD COLUMN     "files" TEXT,
ADD COLUMN     "image_id" INTEGER;

-- AddForeignKey
ALTER TABLE "Wishlist" ADD CONSTRAINT "Wishlist_image_id_fkey" FOREIGN KEY ("image_id") REFERENCES "File"("id") ON DELETE SET NULL ON UPDATE SET NULL;
