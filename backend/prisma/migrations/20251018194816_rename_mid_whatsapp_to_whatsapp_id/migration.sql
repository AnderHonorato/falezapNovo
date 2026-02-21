/*
  Warnings:

  - You are about to drop the column `midWhatsapp` on the `mensagens` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[whatsappId]` on the table `mensagens` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "public"."mensagens_midWhatsapp_idx";

-- DropIndex
DROP INDEX "public"."mensagens_midWhatsapp_key";

-- AlterTable
ALTER TABLE "mensagens" DROP COLUMN "midWhatsapp",
ADD COLUMN     "whatsappId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "mensagens_whatsappId_key" ON "mensagens"("whatsappId");

-- CreateIndex
CREATE INDEX "mensagens_whatsappId_idx" ON "mensagens"("whatsappId");
