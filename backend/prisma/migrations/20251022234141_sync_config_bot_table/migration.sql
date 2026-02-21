/*
  Warnings:

  - The values [FIGURINA] on the enum `TipoMensagem` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "TipoMensagem_new" AS ENUM ('TEXTO', 'IMAGEM', 'AUDIO', 'VIDEO', 'DOCUMENTO', 'CONTATO', 'LOCALIZACAO', 'FIGURINHA', 'ANOTACAO', 'REACAO', 'EVENTO', 'SISTEMA', 'ENQUETE', 'DESCONHECIDO');
ALTER TABLE "public"."mensagens" ALTER COLUMN "tipo" DROP DEFAULT;
ALTER TABLE "mensagens" ALTER COLUMN "tipo" TYPE "TipoMensagem_new" USING ("tipo"::text::"TipoMensagem_new");
ALTER TYPE "TipoMensagem" RENAME TO "TipoMensagem_old";
ALTER TYPE "TipoMensagem_new" RENAME TO "TipoMensagem";
DROP TYPE "public"."TipoMensagem_old";
ALTER TABLE "mensagens" ALTER COLUMN "tipo" SET DEFAULT 'TEXTO';
COMMIT;

-- CreateTable
CREATE TABLE "configuracoes_bot" (
    "id" TEXT NOT NULL,
    "mensagemBoasVindas" TEXT NOT NULL,
    "mensagemForaHorario" TEXT,
    "horarioInicio" TEXT,
    "horarioFim" TEXT,
    "diasSemana" TEXT[],
    "tempoEsperaBot" INTEGER NOT NULL DEFAULT 30,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,
    "contatoNome" TEXT,
    "contatoNumero" TEXT,
    "contatoVcard" TEXT,

    CONSTRAINT "configuracoes_bot_pkey" PRIMARY KEY ("id")
);
