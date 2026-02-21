-- AlterTable
ALTER TABLE "mensagens" ADD COLUMN     "editada" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "editadaEm" TIMESTAMP(3),
ADD COLUMN     "lidaEm" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "reacoes" (
    "id" TEXT NOT NULL,
    "mensagemId" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "emoji" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reacoes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "reacoes_mensagemId_idx" ON "reacoes"("mensagemId");

-- CreateIndex
CREATE INDEX "reacoes_usuarioId_idx" ON "reacoes"("usuarioId");

-- CreateIndex
CREATE UNIQUE INDEX "reacoes_mensagemId_usuarioId_key" ON "reacoes"("mensagemId", "usuarioId");

-- CreateIndex
CREATE INDEX "mensagens_timestamp_idx" ON "mensagens"("timestamp");

-- AddForeignKey
ALTER TABLE "reacoes" ADD CONSTRAINT "reacoes_mensagemId_fkey" FOREIGN KEY ("mensagemId") REFERENCES "mensagens"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reacoes" ADD CONSTRAINT "reacoes_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;
