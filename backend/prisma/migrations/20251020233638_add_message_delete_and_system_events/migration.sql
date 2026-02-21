-- AlterEnum
ALTER TYPE "TipoMensagem" ADD VALUE 'SISTEMA';

-- AlterTable
ALTER TABLE "mensagens" ADD COLUMN     "apagada" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "apagadaEm" TIMESTAMP(3),
ADD COLUMN     "apagadaParaTodos" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "apagadaPor" TEXT,
ADD COLUMN     "eventoTipo" TEXT;

-- CreateIndex
CREATE INDEX "mensagens_apagada_idx" ON "mensagens"("apagada");
