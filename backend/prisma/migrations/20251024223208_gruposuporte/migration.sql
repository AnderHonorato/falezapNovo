-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "TipoUsuario" ADD VALUE 'ENCARREGADO';
ALTER TYPE "TipoUsuario" ADD VALUE 'SUPORTE';

-- AlterTable
ALTER TABLE "mensagens_chat_interno" ADD COLUMN     "grupoId" TEXT;

-- CreateTable
CREATE TABLE "grupos_chat_interno" (
    "id" TEXT NOT NULL,
    "contaId" TEXT NOT NULL,
    "criadorId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "imagem" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "grupos_chat_interno_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "membros_grupo_chat_interno" (
    "id" TEXT NOT NULL,
    "grupoId" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "isAdmin" BOOLEAN NOT NULL DEFAULT false,
    "adicionadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "membros_grupo_chat_interno_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "grupos_chat_interno_contaId_nome_key" ON "grupos_chat_interno"("contaId", "nome");

-- CreateIndex
CREATE UNIQUE INDEX "membros_grupo_chat_interno_grupoId_usuarioId_key" ON "membros_grupo_chat_interno"("grupoId", "usuarioId");

-- CreateIndex
CREATE INDEX "mensagens_chat_interno_grupoId_idx" ON "mensagens_chat_interno"("grupoId");

-- AddForeignKey
ALTER TABLE "mensagens_chat_interno" ADD CONSTRAINT "mensagens_chat_interno_grupoId_fkey" FOREIGN KEY ("grupoId") REFERENCES "grupos_chat_interno"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grupos_chat_interno" ADD CONSTRAINT "grupos_chat_interno_contaId_fkey" FOREIGN KEY ("contaId") REFERENCES "contas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grupos_chat_interno" ADD CONSTRAINT "grupos_chat_interno_criadorId_fkey" FOREIGN KEY ("criadorId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "membros_grupo_chat_interno" ADD CONSTRAINT "membros_grupo_chat_interno_grupoId_fkey" FOREIGN KEY ("grupoId") REFERENCES "grupos_chat_interno"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "membros_grupo_chat_interno" ADD CONSTRAINT "membros_grupo_chat_interno_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;
