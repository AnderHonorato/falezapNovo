/*
  Warnings:

  - The `statusConversa` column on the `conversas` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `tipo` column on the `mensagens` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - A unique constraint covering the columns `[contaId,numeroCliente]` on the table `conversas` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[whatsappId]` on the table `mensagens` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `contaId` to the `conversas` table without a default value. This is not possible if the table is not empty.
  - Added the required column `whatsappId` to the `mensagens` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "StatusConversa" AS ENUM ('CAIXA_ENTRADA', 'ESPERANDO', 'FINALIZADA', 'ARQUIVADA');

-- CreateEnum
CREATE TYPE "TipoMensagem" AS ENUM ('TEXTO', 'IMAGEM', 'AUDIO', 'VIDEO', 'DOCUMENTO', 'CONTATO', 'LOCALIZACAO', 'FIGURINHA', 'ANOTACAO');

-- AlterTable
ALTER TABLE "conversas" ADD COLUMN     "contaId" TEXT NOT NULL,
ADD COLUMN     "fixada" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "fotoUrl" TEXT,
ADD COLUMN     "isGrupo" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "naoLidas" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "nomeGrupo" TEXT,
ADD COLUMN     "ultimaMensagemEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "usuarioResponsavelId" TEXT,
DROP COLUMN "statusConversa",
ADD COLUMN     "statusConversa" "StatusConversa" NOT NULL DEFAULT 'CAIXA_ENTRADA';

-- AlterTable
ALTER TABLE "mensagens" ADD COLUMN     "apagada" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "corAnotacao" TEXT,
ADD COLUMN     "encaminhada" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "entregue" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "enviada" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "favoritada" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isAnotacao" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "latitude" DOUBLE PRECISION,
ADD COLUMN     "legendaImagem" TEXT,
ADD COLUMN     "longitude" DOUBLE PRECISION,
ADD COLUMN     "midiaMimetype" TEXT,
ADD COLUMN     "midiaNome" TEXT,
ADD COLUMN     "midiaTamanho" INTEGER,
ADD COLUMN     "midiaUrl" TEXT,
ADD COLUMN     "participante" TEXT,
ADD COLUMN     "participanteNome" TEXT,
ADD COLUMN     "remetenteNome" TEXT,
ADD COLUMN     "replyParaId" TEXT,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'enviada',
ADD COLUMN     "timestamp" BIGINT,
ADD COLUMN     "whatsappId" TEXT NOT NULL,
DROP COLUMN "tipo",
ADD COLUMN     "tipo" "TipoMensagem" NOT NULL DEFAULT 'TEXTO';

-- CreateIndex
CREATE INDEX "conversas_contaId_statusConversa_idx" ON "conversas"("contaId", "statusConversa");

-- CreateIndex
CREATE INDEX "conversas_usuarioResponsavelId_idx" ON "conversas"("usuarioResponsavelId");

-- CreateIndex
CREATE UNIQUE INDEX "conversas_contaId_numeroCliente_key" ON "conversas"("contaId", "numeroCliente");

-- CreateIndex
CREATE UNIQUE INDEX "mensagens_whatsappId_key" ON "mensagens"("whatsappId");

-- CreateIndex
CREATE INDEX "mensagens_conversaId_idx" ON "mensagens"("conversaId");

-- CreateIndex
CREATE INDEX "mensagens_contaId_idx" ON "mensagens"("contaId");

-- CreateIndex
CREATE INDEX "mensagens_whatsappId_idx" ON "mensagens"("whatsappId");

-- AddForeignKey
ALTER TABLE "conversas" ADD CONSTRAINT "conversas_contaId_fkey" FOREIGN KEY ("contaId") REFERENCES "contas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversas" ADD CONSTRAINT "conversas_usuarioResponsavelId_fkey" FOREIGN KEY ("usuarioResponsavelId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mensagens" ADD CONSTRAINT "mensagens_replyParaId_fkey" FOREIGN KEY ("replyParaId") REFERENCES "mensagens"("id") ON DELETE SET NULL ON UPDATE CASCADE;
