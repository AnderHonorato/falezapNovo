-- CreateTable
CREATE TABLE "mensagens_chat_interno" (
    "id" TEXT NOT NULL,
    "contaId" TEXT NOT NULL,
    "remetenteId" TEXT NOT NULL,
    "conteudo" TEXT NOT NULL,
    "tipo" TEXT NOT NULL DEFAULT 'texto',
    "respostaAId" TEXT,
    "excluida" BOOLEAN NOT NULL DEFAULT false,
    "exclusaoGlobal" BOOLEAN NOT NULL DEFAULT false,
    "editada" BOOLEAN NOT NULL DEFAULT false,
    "editadaEm" TIMESTAMP(3),
    "criadaEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mensagens_chat_interno_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "curtidas_mensagem_chat_interno" (
    "id" TEXT NOT NULL,
    "mensagemId" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "criadaEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "curtidas_mensagem_chat_interno_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mencoes_mensagem_chat_interno" (
    "id" TEXT NOT NULL,
    "mensagemId" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,

    CONSTRAINT "mencoes_mensagem_chat_interno_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "arquivos_mensagem_chat_interno" (
    "id" TEXT NOT NULL,
    "mensagemId" TEXT NOT NULL,
    "nomeOriginal" TEXT NOT NULL,
    "nomeArquivo" TEXT NOT NULL,
    "caminho" TEXT NOT NULL,
    "tamanho" INTEGER NOT NULL,
    "tipo" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "arquivos_mensagem_chat_interno_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "visualizacoes_mensagem_chat_interno" (
    "id" TEXT NOT NULL,
    "mensagemId" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "visualizadaEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "visualizacoes_mensagem_chat_interno_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exclusoes_mensagem_chat_interno" (
    "id" TEXT NOT NULL,
    "mensagemId" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "excluidaEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "exclusoes_mensagem_chat_interno_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alertas_chat_interno" (
    "id" TEXT NOT NULL,
    "contaId" TEXT NOT NULL,
    "remetenteId" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "mensagem" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "alertas_chat_interno_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "destinatarios_alerta_chat_interno" (
    "id" TEXT NOT NULL,
    "alertaId" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,

    CONSTRAINT "destinatarios_alerta_chat_interno_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "respostas_alerta_chat_interno" (
    "id" TEXT NOT NULL,
    "alertaId" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "resposta" TEXT NOT NULL,
    "criadaEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "respostas_alerta_chat_interno_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "solicitacoes_ajuda_chat_interno" (
    "id" TEXT NOT NULL,
    "contaId" TEXT NOT NULL,
    "solicitanteId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDENTE',
    "atendidoPorId" TEXT,
    "atendidaEm" TIMESTAMP(3),
    "criadaEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "solicitacoes_ajuda_chat_interno_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "mensagens_chat_interno_contaId_idx" ON "mensagens_chat_interno"("contaId");

-- CreateIndex
CREATE INDEX "mensagens_chat_interno_remetenteId_idx" ON "mensagens_chat_interno"("remetenteId");

-- CreateIndex
CREATE INDEX "mensagens_chat_interno_criadaEm_idx" ON "mensagens_chat_interno"("criadaEm");

-- CreateIndex
CREATE INDEX "curtidas_mensagem_chat_interno_mensagemId_idx" ON "curtidas_mensagem_chat_interno"("mensagemId");

-- CreateIndex
CREATE UNIQUE INDEX "curtidas_mensagem_chat_interno_mensagemId_usuarioId_key" ON "curtidas_mensagem_chat_interno"("mensagemId", "usuarioId");

-- CreateIndex
CREATE INDEX "mencoes_mensagem_chat_interno_usuarioId_idx" ON "mencoes_mensagem_chat_interno"("usuarioId");

-- CreateIndex
CREATE UNIQUE INDEX "mencoes_mensagem_chat_interno_mensagemId_usuarioId_key" ON "mencoes_mensagem_chat_interno"("mensagemId", "usuarioId");

-- CreateIndex
CREATE INDEX "arquivos_mensagem_chat_interno_mensagemId_idx" ON "arquivos_mensagem_chat_interno"("mensagemId");

-- CreateIndex
CREATE INDEX "visualizacoes_mensagem_chat_interno_mensagemId_idx" ON "visualizacoes_mensagem_chat_interno"("mensagemId");

-- CreateIndex
CREATE UNIQUE INDEX "visualizacoes_mensagem_chat_interno_mensagemId_usuarioId_key" ON "visualizacoes_mensagem_chat_interno"("mensagemId", "usuarioId");

-- CreateIndex
CREATE UNIQUE INDEX "exclusoes_mensagem_chat_interno_mensagemId_usuarioId_key" ON "exclusoes_mensagem_chat_interno"("mensagemId", "usuarioId");

-- CreateIndex
CREATE INDEX "alertas_chat_interno_contaId_idx" ON "alertas_chat_interno"("contaId");

-- CreateIndex
CREATE UNIQUE INDEX "destinatarios_alerta_chat_interno_alertaId_usuarioId_key" ON "destinatarios_alerta_chat_interno"("alertaId", "usuarioId");

-- CreateIndex
CREATE UNIQUE INDEX "respostas_alerta_chat_interno_alertaId_usuarioId_key" ON "respostas_alerta_chat_interno"("alertaId", "usuarioId");

-- CreateIndex
CREATE INDEX "solicitacoes_ajuda_chat_interno_contaId_idx" ON "solicitacoes_ajuda_chat_interno"("contaId");

-- CreateIndex
CREATE INDEX "solicitacoes_ajuda_chat_interno_status_idx" ON "solicitacoes_ajuda_chat_interno"("status");

-- AddForeignKey
ALTER TABLE "mensagens_chat_interno" ADD CONSTRAINT "mensagens_chat_interno_contaId_fkey" FOREIGN KEY ("contaId") REFERENCES "contas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mensagens_chat_interno" ADD CONSTRAINT "mensagens_chat_interno_remetenteId_fkey" FOREIGN KEY ("remetenteId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mensagens_chat_interno" ADD CONSTRAINT "mensagens_chat_interno_respostaAId_fkey" FOREIGN KEY ("respostaAId") REFERENCES "mensagens_chat_interno"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "curtidas_mensagem_chat_interno" ADD CONSTRAINT "curtidas_mensagem_chat_interno_mensagemId_fkey" FOREIGN KEY ("mensagemId") REFERENCES "mensagens_chat_interno"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "curtidas_mensagem_chat_interno" ADD CONSTRAINT "curtidas_mensagem_chat_interno_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mencoes_mensagem_chat_interno" ADD CONSTRAINT "mencoes_mensagem_chat_interno_mensagemId_fkey" FOREIGN KEY ("mensagemId") REFERENCES "mensagens_chat_interno"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mencoes_mensagem_chat_interno" ADD CONSTRAINT "mencoes_mensagem_chat_interno_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "arquivos_mensagem_chat_interno" ADD CONSTRAINT "arquivos_mensagem_chat_interno_mensagemId_fkey" FOREIGN KEY ("mensagemId") REFERENCES "mensagens_chat_interno"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "visualizacoes_mensagem_chat_interno" ADD CONSTRAINT "visualizacoes_mensagem_chat_interno_mensagemId_fkey" FOREIGN KEY ("mensagemId") REFERENCES "mensagens_chat_interno"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "visualizacoes_mensagem_chat_interno" ADD CONSTRAINT "visualizacoes_mensagem_chat_interno_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exclusoes_mensagem_chat_interno" ADD CONSTRAINT "exclusoes_mensagem_chat_interno_mensagemId_fkey" FOREIGN KEY ("mensagemId") REFERENCES "mensagens_chat_interno"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exclusoes_mensagem_chat_interno" ADD CONSTRAINT "exclusoes_mensagem_chat_interno_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alertas_chat_interno" ADD CONSTRAINT "alertas_chat_interno_contaId_fkey" FOREIGN KEY ("contaId") REFERENCES "contas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alertas_chat_interno" ADD CONSTRAINT "alertas_chat_interno_remetenteId_fkey" FOREIGN KEY ("remetenteId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "destinatarios_alerta_chat_interno" ADD CONSTRAINT "destinatarios_alerta_chat_interno_alertaId_fkey" FOREIGN KEY ("alertaId") REFERENCES "alertas_chat_interno"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "destinatarios_alerta_chat_interno" ADD CONSTRAINT "destinatarios_alerta_chat_interno_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "respostas_alerta_chat_interno" ADD CONSTRAINT "respostas_alerta_chat_interno_alertaId_fkey" FOREIGN KEY ("alertaId") REFERENCES "alertas_chat_interno"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "respostas_alerta_chat_interno" ADD CONSTRAINT "respostas_alerta_chat_interno_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solicitacoes_ajuda_chat_interno" ADD CONSTRAINT "solicitacoes_ajuda_chat_interno_contaId_fkey" FOREIGN KEY ("contaId") REFERENCES "contas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solicitacoes_ajuda_chat_interno" ADD CONSTRAINT "solicitacoes_ajuda_chat_interno_solicitanteId_fkey" FOREIGN KEY ("solicitanteId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solicitacoes_ajuda_chat_interno" ADD CONSTRAINT "solicitacoes_ajuda_chat_interno_atendidoPorId_fkey" FOREIGN KEY ("atendidoPorId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
