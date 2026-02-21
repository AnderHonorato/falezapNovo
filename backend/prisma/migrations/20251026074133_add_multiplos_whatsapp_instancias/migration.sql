/*
  Warnings:

  - A unique constraint covering the columns `[contaId,instancia]` on the table `conexoes_whatsapp` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[cnpj]` on the table `contas` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[emailPrincipal]` on the table `contas` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[conexaoWhatsAppId,numeroCliente]` on the table `conversas` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[protocolo]` on the table `solicitacoes_ajuda_chat_interno` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `atualizadoEm` to the `alertas_chat_interno` table without a default value. This is not possible if the table is not empty.
  - Added the required column `atualizadaEm` to the `solicitacoes_ajuda_chat_interno` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."anotacoes" DROP CONSTRAINT "anotacoes_usuarioId_fkey";

-- DropForeignKey
ALTER TABLE "public"."comentarios_blog" DROP CONSTRAINT "comentarios_blog_postId_fkey";

-- DropForeignKey
ALTER TABLE "public"."membros_grupo_chat_interno" DROP CONSTRAINT "membros_grupo_chat_interno_usuarioId_fkey";

-- DropForeignKey
ALTER TABLE "public"."posts_blog" DROP CONSTRAINT "posts_blog_autorId_fkey";

-- DropIndex
DROP INDEX "public"."conexoes_whatsapp_numeroWhatsApp_key";

-- DropIndex
DROP INDEX "public"."conversas_contaId_numeroCliente_key";

-- AlterTable
ALTER TABLE "alertas_chat_interno" ADD COLUMN     "atualizadoEm" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "prioridade" TEXT NOT NULL DEFAULT 'MEDIA',
ADD COLUMN     "resolvido" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "tipo" TEXT NOT NULL DEFAULT 'INFORMATIVO',
ADD COLUMN     "visualizado" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "conexoes_whatsapp" ADD COLUMN     "corIdentificacao" TEXT NOT NULL DEFAULT '#25D366',
ADD COLUMN     "instancia" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "nomeInstancia" TEXT,
ALTER COLUMN "numeroWhatsApp" DROP NOT NULL;

-- AlterTable
ALTER TABLE "contas" ADD COLUMN     "bairro" TEXT,
ADD COLUMN     "cep" TEXT,
ADD COLUMN     "cidade" TEXT,
ADD COLUMN     "cnpj" TEXT,
ADD COLUMN     "complemento" TEXT,
ADD COLUMN     "dataAssinatura" TIMESTAMP(3),
ADD COLUMN     "dataVencimento" TIMESTAMP(3),
ADD COLUMN     "emailPrincipal" TEXT,
ADD COLUMN     "estado" TEXT,
ADD COLUMN     "inscricaoEstadual" TEXT,
ADD COLUMN     "inscricaoMunicipal" TEXT,
ADD COLUMN     "limiteWhatsApps" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "logradouro" TEXT,
ADD COLUMN     "numero" TEXT,
ADD COLUMN     "plano" TEXT,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'ATIVO',
ADD COLUMN     "telefonePrincipal" TEXT,
ADD COLUMN     "telefoneSecundario" TEXT;

-- AlterTable
ALTER TABLE "favoritos_chat_interno" ADD COLUMN     "favoritoUsuarioId" TEXT;

-- AlterTable
ALTER TABLE "grupos_chat_interno" ADD COLUMN     "tipo" TEXT NOT NULL DEFAULT 'PRIVADO';

-- AlterTable
ALTER TABLE "membros_grupo_chat_interno" ADD COLUMN     "papel" TEXT NOT NULL DEFAULT 'MEMBRO';

-- AlterTable
ALTER TABLE "mensagens_suporte" ADD COLUMN     "visualizada" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "respostas_alerta_chat_interno" ADD COLUMN     "mensagem" TEXT;

-- AlterTable
ALTER TABLE "solicitacoes_ajuda_chat_interno" ADD COLUMN     "atualizadaEm" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "avaliacao" INTEGER,
ADD COLUMN     "comentarioAvaliacao" TEXT,
ADD COLUMN     "encerradaEm" TIMESTAMP(3),
ADD COLUMN     "observacao" TEXT,
ADD COLUMN     "prioridade" TEXT NOT NULL DEFAULT 'NORMAL';

-- AlterTable
ALTER TABLE "usuarios" ADD COLUMN     "cargo" TEXT,
ADD COLUMN     "dataAdmissao" TIMESTAMP(3),
ADD COLUMN     "dataNascimento" TIMESTAMP(3),
ADD COLUMN     "departamento" TEXT,
ADD COLUMN     "empresaId" TEXT;

-- CreateTable
CREATE TABLE "empresas" (
    "id" TEXT NOT NULL,
    "contaId" TEXT NOT NULL,
    "razaoSocial" TEXT NOT NULL,
    "nomeFantasia" TEXT,
    "cnpj" TEXT NOT NULL,
    "inscricaoEstadual" TEXT,
    "inscricaoMunicipal" TEXT,
    "emailEmpresa" TEXT,
    "telefoneEmpresa" TEXT,
    "cep" TEXT,
    "logradouro" TEXT,
    "numero" TEXT,
    "complemento" TEXT,
    "bairro" TEXT,
    "cidade" TEXT,
    "estado" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ATIVO',
    "criadaEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadaEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "empresas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "whatsapp_instancias" (
    "id" TEXT NOT NULL,
    "contaId" TEXT NOT NULL,
    "empresaId" TEXT,
    "usuarioId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "numero" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DESCONECTADO',
    "qrCode" TEXT,
    "conectadoEm" TIMESTAMP(3),
    "desconectadoEm" TIMESTAMP(3),
    "criadaEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadaEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "whatsapp_instancias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contatos_whatsapp" (
    "id" TEXT NOT NULL,
    "instanciaId" TEXT NOT NULL,
    "usuarioResponsavelId" TEXT,
    "numero" TEXT NOT NULL,
    "nome" TEXT,
    "pushname" TEXT,
    "fotoPerfil" TEXT,
    "isGroup" BOOLEAN NOT NULL DEFAULT false,
    "ultimaMensagemEm" TIMESTAMP(3),
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contatos_whatsapp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mensagens_whatsapp" (
    "id" TEXT NOT NULL,
    "instanciaId" TEXT NOT NULL,
    "contatoId" TEXT NOT NULL,
    "usuarioId" TEXT,
    "messageId" TEXT NOT NULL,
    "fromMe" BOOLEAN NOT NULL,
    "body" TEXT,
    "type" TEXT NOT NULL,
    "timestamp" BIGINT NOT NULL,
    "status" TEXT,
    "hasMedia" BOOLEAN NOT NULL DEFAULT false,
    "mediaUrl" TEXT,
    "mimetype" TEXT,
    "filename" TEXT,
    "isForwarded" BOOLEAN NOT NULL DEFAULT false,
    "quotedMsgId" TEXT,
    "vCardList" JSONB,
    "criadaEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mensagens_whatsapp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categorias_atendimento" (
    "id" TEXT NOT NULL,
    "contaId" TEXT NOT NULL,
    "instanciaId" TEXT,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "cor" TEXT NOT NULL DEFAULT '#3B82F6',
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "criadaEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadaEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "categorias_atendimento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "status_atendimento" (
    "id" TEXT NOT NULL,
    "contaId" TEXT NOT NULL,
    "instanciaId" TEXT,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "cor" TEXT NOT NULL DEFAULT '#10B981',
    "tipo" TEXT NOT NULL DEFAULT 'EM_ANDAMENTO',
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "status_atendimento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "status_historico" (
    "id" TEXT NOT NULL,
    "contatoNumero" TEXT NOT NULL,
    "statusId" TEXT NOT NULL,
    "usuarioId" TEXT,
    "observacao" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "status_historico_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comentarios" (
    "id" TEXT NOT NULL,
    "postId" TEXT,
    "autorId" TEXT NOT NULL,
    "conteudo" TEXT NOT NULL,
    "aprovado" BOOLEAN NOT NULL DEFAULT false,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "comentarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analises" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT,
    "tipo" TEXT NOT NULL,
    "pagina" TEXT,
    "acao" TEXT,
    "categoria" TEXT,
    "label" TEXT,
    "valor" INTEGER,
    "metadados" JSONB,
    "userAgent" TEXT,
    "ip" TEXT,
    "criadaEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "analises_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "empresas_cnpj_key" ON "empresas"("cnpj");

-- CreateIndex
CREATE INDEX "empresas_contaId_idx" ON "empresas"("contaId");

-- CreateIndex
CREATE INDEX "whatsapp_instancias_contaId_idx" ON "whatsapp_instancias"("contaId");

-- CreateIndex
CREATE INDEX "whatsapp_instancias_empresaId_idx" ON "whatsapp_instancias"("empresaId");

-- CreateIndex
CREATE INDEX "whatsapp_instancias_usuarioId_idx" ON "whatsapp_instancias"("usuarioId");

-- CreateIndex
CREATE INDEX "contatos_whatsapp_instanciaId_idx" ON "contatos_whatsapp"("instanciaId");

-- CreateIndex
CREATE INDEX "contatos_whatsapp_usuarioResponsavelId_idx" ON "contatos_whatsapp"("usuarioResponsavelId");

-- CreateIndex
CREATE UNIQUE INDEX "contatos_whatsapp_instanciaId_numero_key" ON "contatos_whatsapp"("instanciaId", "numero");

-- CreateIndex
CREATE UNIQUE INDEX "mensagens_whatsapp_messageId_key" ON "mensagens_whatsapp"("messageId");

-- CreateIndex
CREATE INDEX "mensagens_whatsapp_instanciaId_idx" ON "mensagens_whatsapp"("instanciaId");

-- CreateIndex
CREATE INDEX "mensagens_whatsapp_contatoId_idx" ON "mensagens_whatsapp"("contatoId");

-- CreateIndex
CREATE INDEX "mensagens_whatsapp_usuarioId_idx" ON "mensagens_whatsapp"("usuarioId");

-- CreateIndex
CREATE INDEX "mensagens_whatsapp_timestamp_idx" ON "mensagens_whatsapp"("timestamp");

-- CreateIndex
CREATE INDEX "categorias_atendimento_contaId_idx" ON "categorias_atendimento"("contaId");

-- CreateIndex
CREATE INDEX "categorias_atendimento_instanciaId_idx" ON "categorias_atendimento"("instanciaId");

-- CreateIndex
CREATE INDEX "status_atendimento_contaId_idx" ON "status_atendimento"("contaId");

-- CreateIndex
CREATE INDEX "status_atendimento_instanciaId_idx" ON "status_atendimento"("instanciaId");

-- CreateIndex
CREATE INDEX "status_historico_contatoNumero_idx" ON "status_historico"("contatoNumero");

-- CreateIndex
CREATE INDEX "status_historico_statusId_idx" ON "status_historico"("statusId");

-- CreateIndex
CREATE INDEX "status_historico_usuarioId_idx" ON "status_historico"("usuarioId");

-- CreateIndex
CREATE INDEX "comentarios_autorId_idx" ON "comentarios"("autorId");

-- CreateIndex
CREATE INDEX "comentarios_postId_idx" ON "comentarios"("postId");

-- CreateIndex
CREATE INDEX "analises_usuarioId_idx" ON "analises"("usuarioId");

-- CreateIndex
CREATE INDEX "analises_tipo_idx" ON "analises"("tipo");

-- CreateIndex
CREATE INDEX "analises_pagina_idx" ON "analises"("pagina");

-- CreateIndex
CREATE INDEX "analises_criadaEm_idx" ON "analises"("criadaEm");

-- CreateIndex
CREATE INDEX "conexoes_whatsapp_contaId_idx" ON "conexoes_whatsapp"("contaId");

-- CreateIndex
CREATE INDEX "conexoes_whatsapp_status_idx" ON "conexoes_whatsapp"("status");

-- CreateIndex
CREATE UNIQUE INDEX "conexoes_whatsapp_contaId_instancia_key" ON "conexoes_whatsapp"("contaId", "instancia");

-- CreateIndex
CREATE UNIQUE INDEX "contas_cnpj_key" ON "contas"("cnpj");

-- CreateIndex
CREATE UNIQUE INDEX "contas_emailPrincipal_key" ON "contas"("emailPrincipal");

-- CreateIndex
CREATE INDEX "conversas_conexaoWhatsAppId_idx" ON "conversas"("conexaoWhatsAppId");

-- CreateIndex
CREATE UNIQUE INDEX "conversas_conexaoWhatsAppId_numeroCliente_key" ON "conversas"("conexaoWhatsAppId", "numeroCliente");

-- CreateIndex
CREATE UNIQUE INDEX "solicitacoes_ajuda_chat_interno_protocolo_key" ON "solicitacoes_ajuda_chat_interno"("protocolo");

-- CreateIndex
CREATE INDEX "solicitacoes_ajuda_chat_interno_solicitanteId_idx" ON "solicitacoes_ajuda_chat_interno"("solicitanteId");

-- CreateIndex
CREATE INDEX "solicitacoes_ajuda_chat_interno_atendidoPorId_idx" ON "solicitacoes_ajuda_chat_interno"("atendidoPorId");

-- CreateIndex
CREATE INDEX "usuarios_empresaId_idx" ON "usuarios"("empresaId");

-- AddForeignKey
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "empresas" ADD CONSTRAINT "empresas_contaId_fkey" FOREIGN KEY ("contaId") REFERENCES "contas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "anotacoes" ADD CONSTRAINT "anotacoes_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "posts_blog" ADD CONSTRAINT "posts_blog_autorId_fkey" FOREIGN KEY ("autorId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comentarios_blog" ADD CONSTRAINT "comentarios_blog_postId_fkey" FOREIGN KEY ("postId") REFERENCES "posts_blog"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "membros_grupo_chat_interno" ADD CONSTRAINT "membros_grupo_chat_interno_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "whatsapp_instancias" ADD CONSTRAINT "whatsapp_instancias_contaId_fkey" FOREIGN KEY ("contaId") REFERENCES "contas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "whatsapp_instancias" ADD CONSTRAINT "whatsapp_instancias_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "whatsapp_instancias" ADD CONSTRAINT "whatsapp_instancias_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contatos_whatsapp" ADD CONSTRAINT "contatos_whatsapp_instanciaId_fkey" FOREIGN KEY ("instanciaId") REFERENCES "whatsapp_instancias"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contatos_whatsapp" ADD CONSTRAINT "contatos_whatsapp_usuarioResponsavelId_fkey" FOREIGN KEY ("usuarioResponsavelId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mensagens_whatsapp" ADD CONSTRAINT "mensagens_whatsapp_instanciaId_fkey" FOREIGN KEY ("instanciaId") REFERENCES "whatsapp_instancias"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mensagens_whatsapp" ADD CONSTRAINT "mensagens_whatsapp_contatoId_fkey" FOREIGN KEY ("contatoId") REFERENCES "contatos_whatsapp"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mensagens_whatsapp" ADD CONSTRAINT "mensagens_whatsapp_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "categorias_atendimento" ADD CONSTRAINT "categorias_atendimento_contaId_fkey" FOREIGN KEY ("contaId") REFERENCES "contas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "categorias_atendimento" ADD CONSTRAINT "categorias_atendimento_instanciaId_fkey" FOREIGN KEY ("instanciaId") REFERENCES "whatsapp_instancias"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "status_atendimento" ADD CONSTRAINT "status_atendimento_contaId_fkey" FOREIGN KEY ("contaId") REFERENCES "contas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "status_atendimento" ADD CONSTRAINT "status_atendimento_instanciaId_fkey" FOREIGN KEY ("instanciaId") REFERENCES "whatsapp_instancias"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "status_historico" ADD CONSTRAINT "status_historico_statusId_fkey" FOREIGN KEY ("statusId") REFERENCES "status_atendimento"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "status_historico" ADD CONSTRAINT "status_historico_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comentarios" ADD CONSTRAINT "comentarios_postId_fkey" FOREIGN KEY ("postId") REFERENCES "posts_blog"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comentarios" ADD CONSTRAINT "comentarios_autorId_fkey" FOREIGN KEY ("autorId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "analises" ADD CONSTRAINT "analises_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
