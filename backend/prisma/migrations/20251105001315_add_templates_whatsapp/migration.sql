-- AlterEnum
ALTER TYPE "TipoMensagem" ADD VALUE 'TEMPLATE';

-- CreateTable
CREATE TABLE "templates_whatsapp" (
    "id" TEXT NOT NULL,
    "contaId" TEXT NOT NULL,
    "conexaoWhatsAppId" TEXT NOT NULL,
    "nomeTemplate" TEXT NOT NULL,
    "namespace" TEXT NOT NULL,
    "linguagem" TEXT NOT NULL DEFAULT 'pt_BR',
    "categoria" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "componentes" JSONB NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,
    "ultimaSincEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "templates_whatsapp_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "templates_whatsapp_contaId_idx" ON "templates_whatsapp"("contaId");

-- CreateIndex
CREATE INDEX "templates_whatsapp_status_idx" ON "templates_whatsapp"("status");

-- CreateIndex
CREATE UNIQUE INDEX "templates_whatsapp_conexaoWhatsAppId_nomeTemplate_key" ON "templates_whatsapp"("conexaoWhatsAppId", "nomeTemplate");

-- AddForeignKey
ALTER TABLE "templates_whatsapp" ADD CONSTRAINT "templates_whatsapp_contaId_fkey" FOREIGN KEY ("contaId") REFERENCES "contas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "templates_whatsapp" ADD CONSTRAINT "templates_whatsapp_conexaoWhatsAppId_fkey" FOREIGN KEY ("conexaoWhatsAppId") REFERENCES "conexoes_whatsapp"("id") ON DELETE CASCADE ON UPDATE CASCADE;
