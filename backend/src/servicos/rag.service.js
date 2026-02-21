const fs = require("fs");
const path = require("path");

/**
 * Extensões que vão entrar no RAG
 */
const EXTENSOES_PERMITIDAS = [
  ".js",
  ".ts",
  ".json",
  ".md",
  ".txt"
];

/**
 * Pastas que devem ser ignoradas
 */
const PASTAS_IGNORADAS = [
  "node_modules",
  ".git",
  "dist",
  "build",
  ".next"
];

/**
 * Função recursiva que lê todos os arquivos
 */
function lerArquivosRecursivo(diretorioBase) {
  let documentos = [];

  const arquivos = fs.readdirSync(diretorioBase);

  for (const arquivo of arquivos) {
    const caminhoCompleto = path.join(diretorioBase, arquivo);
    const stat = fs.statSync(caminhoCompleto);

    // Ignorar pastas indesejadas
    if (stat.isDirectory()) {
      if (PASTAS_IGNORADAS.includes(arquivo)) continue;

      documentos = documentos.concat(
        lerArquivosRecursivo(caminhoCompleto)
      );
    } 
    else {
      const extensao = path.extname(arquivo);

      if (!EXTENSOES_PERMITIDAS.includes(extensao)) continue;

      const conteudo = fs.readFileSync(caminhoCompleto, "utf-8");

      documentos.push({
        path: caminhoCompleto,
        content: conteudo
      });
    }
  }

  return documentos;
}

/**
 * Serviço principal do RAG
 */
function gerarDocumentacaoRAG() {
  const caminhoProjeto =
    "Z:/Programação/Backup/MultiWhatsapp/falezap-sistema/backend/src";

  const documentos = lerArquivosRecursivo(caminhoProjeto);

  return documentos;
}

// Exportando a função
module.exports = { gerarDocumentacaoRAG };
