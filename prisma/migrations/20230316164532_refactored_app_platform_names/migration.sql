/*
  Warnings:

  - The values [mobile,desktop,tablet] on the enum `AppPlatform` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "AppPlatform_new" AS ENUM ('android', 'ios', 'web', 'mac', 'windows', 'linux', 'other');
ALTER TABLE "AppSession" ALTER COLUMN "platform" TYPE "AppPlatform_new" USING ("platform"::text::"AppPlatform_new");
ALTER TYPE "AppPlatform" RENAME TO "AppPlatform_old";
ALTER TYPE "AppPlatform_new" RENAME TO "AppPlatform";
DROP TYPE "AppPlatform_old";
COMMIT;
