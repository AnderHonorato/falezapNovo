/*
  Warnings:

  - You are about to drop the column `participante` on the `mensagens` table. All the data in the column will be lost.
  - You are about to drop the column `participanteNome` on the `mensagens` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "mensagens" DROP COLUMN "participante",
DROP COLUMN "participanteNome",
ADD COLUMN     "mensagemCitadaAutor" TEXT,
ADD COLUMN     "mensagemCitadaConteudo" TEXT,
ADD COLUMN     "participant" TEXT,
ADD COLUMN     "participantNome" TEXT;
