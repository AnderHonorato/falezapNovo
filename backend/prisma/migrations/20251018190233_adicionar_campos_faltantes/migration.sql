/*
  Warnings:

  - You are about to drop the column `apagada` on the `mensagens` table. All the data in the column will be lost.
  - You are about to drop the column `corAnotacao` on the `mensagens` table. All the data in the column will be lost.
  - You are about to drop the column `direcao` on the `mensagens` table. All the data in the column will be lost.
  - You are about to drop the column `encaminhada` on the `mensagens` table. All the data in the column will be lost.
  - You are about to drop the column `entregue` on the `mensagens` table. All the data in the column will be lost.
  - You are about to drop the column `enviada` on the `mensagens` table. All the data in the column will be lost.
  - You are about to drop the column `enviadaEm` on the `mensagens` table. All the data in the column will be lost.
  - You are about to drop the column `favoritada` on the `mensagens` table. All the data in the column will be lost.
  - You are about to drop the column `isAnotacao` on the `mensagens` table. All the data in the column will be lost.
  - You are about to drop the column `latitude` on the `mensagens` table. All the data in the column will be lost.
  - You are about to drop the column `legendaImagem` on the `mensagens` table. All the data in the column will be lost.
  - You are about to drop the column `lida` on the `mensagens` table. All the data in the column will be lost.
  - You are about to drop the column `longitude` on the `mensagens` table. All the data in the column will be lost.
  - You are about to drop the column `mensagemCitadaAutor` on the `mensagens` table. All the data in the column will be lost.
  - You are about to drop the column `mensagemCitadaConteudo` on the `mensagens` table. All the data in the column will be lost.
  - You are about to drop the column `midiaMimetype` on the `mensagens` table. All the data in the column will be lost.
  - You are about to drop the column `midiaNome` on the `mensagens` table. All the data in the column will be lost.
  - You are about to drop the column `midiaTamanho` on the `mensagens` table. All the data in the column will be lost.
  - You are about to drop the column `midiaUrl` on the `mensagens` table. All the data in the column will be lost.
  - You are about to drop the column `nomeUsuario` on the `mensagens` table. All the data in the column will be lost.
  - You are about to drop the column `participant` on the `mensagens` table. All the data in the column will be lost.
  - You are about to drop the column `participantNome` on the `mensagens` table. All the data in the column will be lost.
  - You are about to drop the column `reactionToWhatsappId` on the `mensagens` table. All the data in the column will be lost.
  - You are about to drop the column `remetenteNome` on the `mensagens` table. All the data in the column will be lost.
  - You are about to drop the column `replyParaId` on the `mensagens` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `mensagens` table. All the data in the column will be lost.
  - You are about to drop the column `whatsappId` on the `mensagens` table. All the data in the column will be lost.
  - The `timestamp` column on the `mensagens` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - A unique constraint covering the columns `[conversaId,usuarioId]` on the table `conversas_atribuidas` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[conversaId,setorId]` on the table `conversas_atribuidas` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "public"."mensagens" DROP CONSTRAINT "mensagens_replyParaId_fkey";

-- DropIndex
DROP INDEX "public"."mensagens_whatsappId_idx";

-- DropIndex
DROP INDEX "public"."mensagens_whatsappId_key";

-- AlterTable
ALTER TABLE "mensagens" DROP COLUMN "apagada",
DROP COLUMN "corAnotacao",
DROP COLUMN "direcao",
DROP COLUMN "encaminhada",
DROP COLUMN "entregue",
DROP COLUMN "enviada",
DROP COLUMN "enviadaEm",
DROP COLUMN "favoritada",
DROP COLUMN "isAnotacao",
DROP COLUMN "latitude",
DROP COLUMN "legendaImagem",
DROP COLUMN "lida",
DROP COLUMN "longitude",
DROP COLUMN "mensagemCitadaAutor",
DROP COLUMN "mensagemCitadaConteudo",
DROP COLUMN "midiaMimetype",
DROP COLUMN "midiaNome",
DROP COLUMN "midiaTamanho",
DROP COLUMN "midiaUrl",
DROP COLUMN "nomeUsuario",
DROP COLUMN "participant",
DROP COLUMN "participantNome",
DROP COLUMN "reactionToWhatsappId",
DROP COLUMN "remetenteNome",
DROP COLUMN "replyParaId",
DROP COLUMN "status",
DROP COLUMN "whatsappId",
ADD COLUMN     "criadaEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "mediaUrl" TEXT,
ADD COLUMN     "midWhatsapp" TEXT,
ADD COLUMN     "statusMensagem" TEXT NOT NULL DEFAULT 'enviada',
ALTER COLUMN "conteudo" DROP NOT NULL,
DROP COLUMN "timestamp",
ADD COLUMN     "timestamp" TIMESTAMP(3),
ALTER COLUMN "atualizadaEm" DROP DEFAULT,
ALTER COLUMN "enviadaPor" DROP DEFAULT;

-- CreateIndex
CREATE UNIQUE INDEX "conversas_atribuidas_conversaId_usuarioId_key" ON "conversas_atribuidas"("conversaId", "usuarioId");

-- CreateIndex
CREATE UNIQUE INDEX "conversas_atribuidas_conversaId_setorId_key" ON "conversas_atribuidas"("conversaId", "setorId");
