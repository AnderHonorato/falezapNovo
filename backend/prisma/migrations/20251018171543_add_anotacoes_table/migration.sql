-- CreateTable
CREATE TABLE "anotacoes" (
    "id" TEXT NOT NULL,
    "conteudo" TEXT NOT NULL,
    "cor" TEXT DEFAULT 'amarelo',
    "conversaId" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "criadaEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadaEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "anotacoes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "anotacoes_conversaId_idx" ON "anotacoes"("conversaId");

-- CreateIndex
CREATE INDEX "anotacoes_usuarioId_idx" ON "anotacoes"("usuarioId");

-- AddForeignKey
ALTER TABLE "anotacoes" ADD CONSTRAINT "anotacoes_conversaId_fkey" FOREIGN KEY ("conversaId") REFERENCES "conversas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "anotacoes" ADD CONSTRAINT "anotacoes_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
