-- CreateTable
CREATE TABLE "favoritos_chat_interno" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "favoritoId" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "favoritos_chat_interno_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "favoritos_chat_interno_usuarioId_idx" ON "favoritos_chat_interno"("usuarioId");

-- CreateIndex
CREATE UNIQUE INDEX "favoritos_chat_interno_usuarioId_favoritoId_key" ON "favoritos_chat_interno"("usuarioId", "favoritoId");

-- AddForeignKey
ALTER TABLE "favoritos_chat_interno" ADD CONSTRAINT "favoritos_chat_interno_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favoritos_chat_interno" ADD CONSTRAINT "favoritos_chat_interno_favoritoId_fkey" FOREIGN KEY ("favoritoId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;
