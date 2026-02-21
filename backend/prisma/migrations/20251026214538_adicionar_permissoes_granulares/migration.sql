/*
  Warnings:

  - You are about to drop the column `atualizadoEm` on the `status_atendimento` table. All the data in the column will be lost.
  - Added the required column `atualizadaEm` to the `status_atendimento` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "status_atendimento" DROP COLUMN "atualizadoEm",
ADD COLUMN     "atualizadaEm" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "usuarios" ADD COLUMN     "podeAcessarAnalytics" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "podeAcessarBlog" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "podeAcessarChatInterno" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "podeAcessarDashboard" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "podeAcessarEmpresasUsuarios" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "podeAcessarEquipe" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "podeAcessarMensagens" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "podeAcessarSuporte" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "podeAcessarWhatsApp" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "podeCriarPost" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "podeGerenciarEmpresas" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "podeGerenciarEquipe" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "podeGerenciarUsuarios" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "podeVerAlertas" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "podeVerSolicitacoesAjuda" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "podeEnviarMsg" SET DEFAULT true,
ALTER COLUMN "podeReceberMsg" SET DEFAULT true;
