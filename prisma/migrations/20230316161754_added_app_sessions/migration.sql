-- CreateEnum
CREATE TYPE "AppPlatform" AS ENUM ('mobile', 'web', 'desktop', 'tablet', 'other');

-- CreateTable
CREATE TABLE "AppSession" (
    "id" SERIAL NOT NULL,
    "user_id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "platform" "AppPlatform" NOT NULL,
    "platform_details" JSONB,
    "expires_at" TIMESTAMP NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AppSession_pkey" PRIMARY KEY ("id")
);
