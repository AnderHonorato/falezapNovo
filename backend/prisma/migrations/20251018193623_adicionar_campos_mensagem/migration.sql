/*
  Warnings:

  - A unique constraint covering the columns `[midWhatsapp]` on the table `mensagens` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "mensagens" ADD COLUMN     "direcao" TEXT,
ADD COLUMN     "legendaImagem" TEXT,
ADD COLUMN     "lida" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "mensagemCitadaAutor" TEXT,
ADD COLUMN     "mensagemCitadaConteudo" TEXT,
ADD COLUMN     "midiaNome" TEXT,
ADD COLUMN     "participant" TEXT,
ADD COLUMN     "participantNome" TEXT,
ADD COLUMN     "reactionToWhatsappId" TEXT,
ADD COLUMN     "remetenteNome" TEXT,
ADD COLUMN     "replyParaId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "mensagens_midWhatsapp_key" ON "mensagens"("midWhatsapp");

-- CreateIndex
CREATE INDEX "mensagens_midWhatsapp_idx" ON "mensagens"("midWhatsapp");

-- CreateIndex
CREATE INDEX "mensagens_replyParaId_idx" ON "mensagens"("replyParaId");

-- CreateIndex
CREATE INDEX "mensagens_reactionToWhatsappId_idx" ON "mensagens"("reactionToWhatsappId");
