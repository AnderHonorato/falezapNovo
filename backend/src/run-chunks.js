require("dotenv").config();
const fs = require("fs");
const path = require("path");

const { gerarDocumentacaoRAG } = require("./servicos/rag.service");
const { gerarChunks } = require("./servicos/chunk.service");

console.log("📚 Lendo arquivos do sistema...");
const documentos = gerarDocumentacaoRAG();

console.log("✂️ Gerando chunks de texto...");
const chunks = gerarChunks(documentos);

const caminhoSaida = path.resolve(__dirname, "../rag-chunks.json");

fs.writeFileSync(caminhoSaida, JSON.stringify(chunks, null, 2));

console.log("✅ Chunks salvos com sucesso!");
console.log("📦 Total de chunks:", chunks.length);
console.log("📄 Arquivo:", caminhoSaida);
