/*
  Warnings:

  - A unique constraint covering the columns `[mensagemId,numeroRemetente]` on the table `reacoes` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "reacoes" ADD COLUMN     "nomeRemetente" TEXT,
ADD COLUMN     "numeroRemetente" TEXT;

-- CreateIndex
CREATE INDEX "reacoes_numeroRemetente_idx" ON "reacoes"("numeroRemetente");

-- CreateIndex
CREATE UNIQUE INDEX "reacoes_mensagemId_numeroRemetente_key" ON "reacoes"("mensagemId", "numeroRemetente");
