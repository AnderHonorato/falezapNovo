-- AlterTable
ALTER TABLE "conversas" ADD COLUMN     "statusOnline" TEXT,
ADD COLUMN     "ultimoVisto" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "conversas_favorita_idx" ON "conversas"("favorita");
