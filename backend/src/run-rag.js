const fs = require("fs");
const path = require("path");
const { gerarDocumentacaoRAG } = require("./servicos/rag.service");

const documentos = gerarDocumentacaoRAG();

const outputPath = path.resolve(
  __dirname,
  "../rag-output.json"
);

fs.writeFileSync(
  outputPath,
  JSON.stringify(documentos, null, 2),
  "utf-8"
);

console.log("📚 Arquivos lidos:", documentos.length);
console.log("💾 Documentação RAG salva em:", outputPath);
