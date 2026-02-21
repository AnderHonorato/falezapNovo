-- AlterTable
ALTER TABLE "conversas" ADD COLUMN     "foto_perfil" TEXT;

-- AlterTable
ALTER TABLE "usuarios" ADD COLUMN     "cidade" TEXT,
ADD COLUMN     "empresa" TEXT,
ADD COLUMN     "endereco" TEXT,
ADD COLUMN     "estado" TEXT,
ADD COLUMN     "foto_perfil" TEXT;
