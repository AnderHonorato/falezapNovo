const fs = require("fs");
const path = require("path");

function calcularPontuacao(texto, pergunta) {
  let pontos = 0;

  const termos = pergunta
    .toLowerCase()
    .split(/\s+/)
    .filter(t => t.length > 2);

  for (const termo of termos) {
    if (texto.toLowerCase().includes(termo)) {
      pontos++;
    }
  }

  return pontos;
}

function buscarContextoPorTexto(pergunta, limite = 6) {
  const basePath = path.resolve(__dirname, "../../rag-chunks.json");
  const chunks = JSON.parse(fs.readFileSync(basePath, "utf-8"));

  const resultados = chunks
    .map(chunk => ({
      ...chunk,
      pontuacao: calcularPontuacao(chunk.conteudo, pergunta)
    }))
    .filter(r => r.pontuacao > 0)
    .sort((a, b) => b.pontuacao - a.pontuacao)
    .slice(0, limite);

  return resultados;
}

module.exports = { buscarContextoPorTexto };
