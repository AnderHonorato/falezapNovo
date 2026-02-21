-- AlterTable: mensagens - adicionar campos com valores padrão
ALTER TABLE "mensagens" 
ADD COLUMN IF NOT EXISTS "atualizadaEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS "enviadaPor" TEXT NOT NULL DEFAULT 'cliente';

-- AlterTable: conversas - adicionar campo favorita
ALTER TABLE "conversas" 
ADD COLUMN IF NOT EXISTS "favorita" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable: anotacoes - adicionar campos de exclusão lógica
ALTER TABLE "anotacoes" 
ADD COLUMN IF NOT EXISTS "apagada" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "apagadaPor" TEXT,
ADD COLUMN IF NOT EXISTS "apagadaEm" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "mensagens_conversaId_idx" ON "mensagens"("conversaId");
CREATE INDEX IF NOT EXISTS "mensagens_usuarioId_idx" ON "mensagens"("usuarioId");
CREATE INDEX IF NOT EXISTS "mensagens_contaId_idx" ON "mensagens"("contaId");

CREATE INDEX IF NOT EXISTS "conversas_atribuidas_conversaId_idx" ON "conversas_atribuidas"("conversaId");
CREATE INDEX IF NOT EXISTS "conversas_atribuidas_usuarioId_idx" ON "conversas_atribuidas"("usuarioId");
CREATE INDEX IF NOT EXISTS "conversas_atribuidas_setorId_idx" ON "conversas_atribuidas"("setorId");

CREATE INDEX IF NOT EXISTS "anotacoes_conversaId_idx" ON "anotacoes"("conversaId");
CREATE INDEX IF NOT EXISTS "anotacoes_usuarioId_idx" ON "anotacoes"("usuarioId");