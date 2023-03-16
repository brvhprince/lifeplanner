/*
  Warnings:

  - A unique constraint covering the columns `[session_id]` on the table `AppSession` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "AppSession_session_id_key" ON "AppSession"("session_id");
