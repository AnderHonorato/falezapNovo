-- AlterTable
ALTER TABLE "anotacoes" ADD COLUMN     "mensagemCitadaAutor" TEXT,
ADD COLUMN     "mensagemCitadaConteudo" TEXT,
ADD COLUMN     "replyParaId" TEXT;

-- AlterTable
ALTER TABLE "mensagens" ADD COLUMN     "fixada" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "fixadaEm" TIMESTAMP(3),
ADD COLUMN     "fixadaPor" TEXT;

-- CreateIndex
CREATE INDEX "anotacoes_apagada_idx" ON "anotacoes"("apagada");

-- CreateIndex
CREATE INDEX "conversas_fixada_idx" ON "conversas"("fixada");

-- CreateIndex
CREATE INDEX "mensagens_fixada_idx" ON "mensagens"("fixada");
