-- AlterTable
ALTER TABLE "Wishlist" ADD COLUMN     "message" TEXT,
ADD COLUMN     "status" "Status" NOT NULL DEFAULT 'active';
