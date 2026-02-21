/*
  Warnings:

  - The values [USUARIO] on the enum `TipoUsuario` will be removed. If these variants are still used in the database, this will fail.
  - A unique constraint covering the columns `[nickname]` on the table `usuarios` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "TipoUsuario_new" AS ENUM ('OWNER', 'ADMIN_EMPRESA', 'ADMIN', 'COLABORADOR');
ALTER TABLE "public"."usuarios" ALTER COLUMN "tipo" DROP DEFAULT;
ALTER TABLE "usuarios" ALTER COLUMN "tipo" TYPE "TipoUsuario_new" USING ("tipo"::text::"TipoUsuario_new");
ALTER TYPE "TipoUsuario" RENAME TO "TipoUsuario_old";
ALTER TYPE "TipoUsuario_new" RENAME TO "TipoUsuario";
DROP TYPE "public"."TipoUsuario_old";
ALTER TABLE "usuarios" ALTER COLUMN "tipo" SET DEFAULT 'COLABORADOR';
COMMIT;

-- AlterTable
ALTER TABLE "usuarios" ADD COLUMN     "nickname" TEXT,
ALTER COLUMN "email" DROP NOT NULL,
ALTER COLUMN "tipo" SET DEFAULT 'COLABORADOR';

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_nickname_key" ON "usuarios"("nickname");
