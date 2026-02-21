-- AlterTable
ALTER TABLE "mensagens_chat_interno" ADD COLUMN     "destinatarioId" TEXT;

-- CreateIndex
CREATE INDEX "mensagens_chat_interno_destinatarioId_idx" ON "mensagens_chat_interno"("destinatarioId");

-- AddForeignKey
ALTER TABLE "mensagens_chat_interno" ADD CONSTRAINT "mensagens_chat_interno_destinatarioId_fkey" FOREIGN KEY ("destinatarioId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;
