/*
  Warnings:

  - A unique constraint covering the columns `[tokenResetSenha]` on the table `usuarios` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "usuarios" ADD COLUMN     "tokenResetSenha" TEXT,
ADD COLUMN     "tokenResetSenhaExpira" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_tokenResetSenha_key" ON "usuarios"("tokenResetSenha");
