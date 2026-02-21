-- AlterTable
ALTER TABLE "mensagens" ADD COLUMN     "formatacao" JSONB,
ADD COLUMN     "mediaAltura" INTEGER,
ADD COLUMN     "mediaDuracao" INTEGER,
ADD COLUMN     "mediaId" TEXT,
ADD COLUMN     "mediaLargura" INTEGER,
ADD COLUMN     "mediaMimeType" TEXT,
ADD COLUMN     "mediaNome" TEXT,
ADD COLUMN     "mediaSize" INTEGER,
ADD COLUMN     "mediaThumbUrl" TEXT;
