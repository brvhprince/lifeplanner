-- AlterTable
ALTER TABLE "AccountTransfer" ADD COLUMN     "fee" DOUBLE PRECISION NOT NULL DEFAULT 0.00;

-- CreateTable
CREATE TABLE "Verification" (
    "id" SERIAL NOT NULL,
    "code" INTEGER NOT NULL,
    "value" TEXT NOT NULL,
    "expires" TIMESTAMP NOT NULL,

    CONSTRAINT "Verification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Verification_code_key" ON "Verification"("code");
