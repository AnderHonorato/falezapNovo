require("dotenv").config();
const fs = require("fs");
const path = require("path");

const { gerarDocumentacaoRAG } = require("./servicos/rag.service");
const { gerarChunks } = require("./servicos/chunk.service");
const { gerarEmbedding } = require("./servicos/embedding.service");

(async () => {
  console.log("📚 Lendo arquivos...");
  const documentos = gerarDocumentacaoRAG();

  console.log("✂️ Gerando chunks...");
  const chunks = gerarChunks(documentos);

  console.log("🧠 Gerando embeddings...");
  const baseVetorial = [];

  for (const chunk of chunks) {
    const embedding = await gerarEmbedding(chunk.content);

    baseVetorial.push({
      id: chunk.id,
      path: chunk.path,
      content: chunk.content,
      embedding
    });
  }

  const output = path.resolve(__dirname, "../rag-vectors.json");

  fs.writeFileSync(output, JSON.stringify(baseVetorial, null, 2));

  console.log("✅ Base vetorial criada:", output);
})();
