-- CreateTable
CREATE TABLE "mensagens_suporte" (
    "id" TEXT NOT NULL,
    "solicitacaoId" TEXT NOT NULL,
    "remetenteId" TEXT NOT NULL,
    "conteudo" TEXT NOT NULL,
    "tipo" TEXT NOT NULL DEFAULT 'texto',
    "criadaEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mensagens_suporte_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "mensagens_suporte_solicitacaoId_idx" ON "mensagens_suporte"("solicitacaoId");

-- CreateIndex
CREATE INDEX "mensagens_suporte_remetenteId_idx" ON "mensagens_suporte"("remetenteId");

-- AddForeignKey
ALTER TABLE "mensagens_suporte" ADD CONSTRAINT "mensagens_suporte_solicitacaoId_fkey" FOREIGN KEY ("solicitacaoId") REFERENCES "solicitacoes_ajuda_chat_interno"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mensagens_suporte" ADD CONSTRAINT "mensagens_suporte_remetenteId_fkey" FOREIGN KEY ("remetenteId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;
