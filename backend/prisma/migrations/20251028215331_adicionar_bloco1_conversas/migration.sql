/*
  Warnings:

  - You are about to drop the column `nomeCliente` on the `conversas` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "conversas" DROP COLUMN "nomeCliente",
ADD COLUMN     "arquivada" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "dataArquivamento" TIMESTAMP(3),
ADD COLUMN     "nomeContato" TEXT,
ADD COLUMN     "ordemFixacao" INTEGER,
ADD COLUMN     "silenciada" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "silenciadaAte" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "etiquetas" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "cor" TEXT NOT NULL,
    "contaId" TEXT NOT NULL,
    "criadaEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "etiquetas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversas_etiquetas" (
    "conversaId" TEXT NOT NULL,
    "etiquetaId" TEXT NOT NULL,
    "atribuidaEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "conversas_etiquetas_pkey" PRIMARY KEY ("conversaId","etiquetaId")
);

-- CreateIndex
CREATE UNIQUE INDEX "etiquetas_contaId_nome_key" ON "etiquetas"("contaId", "nome");

-- CreateIndex
CREATE INDEX "conversas_arquivada_idx" ON "conversas"("arquivada");

-- AddForeignKey
ALTER TABLE "etiquetas" ADD CONSTRAINT "etiquetas_contaId_fkey" FOREIGN KEY ("contaId") REFERENCES "contas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversas_etiquetas" ADD CONSTRAINT "conversas_etiquetas_conversaId_fkey" FOREIGN KEY ("conversaId") REFERENCES "conversas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversas_etiquetas" ADD CONSTRAINT "conversas_etiquetas_etiquetaId_fkey" FOREIGN KEY ("etiquetaId") REFERENCES "etiquetas"("id") ON DELETE CASCADE ON UPDATE CASCADE;
