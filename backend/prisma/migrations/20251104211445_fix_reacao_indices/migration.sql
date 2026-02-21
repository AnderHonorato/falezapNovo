-- DropIndex
DROP INDEX "public"."reacoes_mensagemId_numeroRemetente_key";

-- DropIndex
DROP INDEX "public"."reacoes_mensagemId_usuarioId_key";

-- CreateIndex
CREATE INDEX "reacoes_mensagemId_usuarioId_idx" ON "reacoes"("mensagemId", "usuarioId");

-- CreateIndex
CREATE INDEX "reacoes_mensagemId_numeroRemetente_idx" ON "reacoes"("mensagemId", "numeroRemetente");
