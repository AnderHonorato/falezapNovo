/*
  Warnings:

  - The values [FIGURINHA] on the enum `TipoMensagem` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the `configuracoes_bot` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterEnum
ALTER TYPE "StatusConexao" ADD VALUE 'PARELHANDO';

-- AlterEnum
BEGIN;
CREATE TYPE "TipoMensagem_new" AS ENUM ('TEXTO', 'IMAGEM', 'AUDIO', 'VIDEO', 'DOCUMENTO', 'CONTATO', 'LOCALIZACAO', 'FIGURINA', 'ANOTACAO', 'REACAO', 'EVENTO', 'SISTEMA', 'ENQUETE', 'DESCONHECIDO');
ALTER TABLE "public"."mensagens" ALTER COLUMN "tipo" DROP DEFAULT;
ALTER TABLE "mensagens" ALTER COLUMN "tipo" TYPE "TipoMensagem_new" USING ("tipo"::text::"TipoMensagem_new");
ALTER TYPE "TipoMensagem" RENAME TO "TipoMensagem_old";
ALTER TYPE "TipoMensagem_new" RENAME TO "TipoMensagem";
DROP TYPE "public"."TipoMensagem_old";
ALTER TABLE "mensagens" ALTER COLUMN "tipo" SET DEFAULT 'TEXTO';
COMMIT;

-- DropForeignKey
ALTER TABLE "public"."anotacoes" DROP CONSTRAINT "anotacoes_usuarioId_fkey";

-- DropIndex
DROP INDEX "public"."mensagens_conversaId_idx";

-- AlterTable
ALTER TABLE "anotacoes" ALTER COLUMN "cor" SET DEFAULT 'yellow';

-- AlterTable
ALTER TABLE "mensagens" ADD COLUMN     "eventoSistema" TEXT;

-- AlterTable
ALTER TABLE "usuarios" ADD COLUMN     "paginaAtual" TEXT;

-- DropTable
DROP TABLE "public"."configuracoes_bot";

-- CreateIndex
CREATE INDEX "conversas_ultimaMensagemEm_idx" ON "conversas"("ultimaMensagemEm");

-- CreateIndex
CREATE INDEX "mensagens_conversaId_enviadaEm_idx" ON "mensagens"("conversaId", "enviadaEm");

-- AddForeignKey
ALTER TABLE "mensagens" ADD CONSTRAINT "mensagens_fixadaPor_fkey" FOREIGN KEY ("fixadaPor") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "anotacoes" ADD CONSTRAINT "anotacoes_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;
