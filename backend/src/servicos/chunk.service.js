function dividirTextoEmChunks(texto, tamanho = 800, sobreposicao = 150) {
  const chunks = [];
  let inicio = 0;

  while (inicio < texto.length) {
    const fim = inicio + tamanho;
    const chunk = texto.slice(inicio, fim);

    chunks.push(chunk);
    inicio += tamanho - sobreposicao;
  }

  return chunks;
}

function gerarChunks(documentos, tamanho = 400, overlap = 80) {
  const chunks = [];

  for (const doc of documentos) {
    const texto = doc.content;

    for (let i = 0; i < texto.length; i += (tamanho - overlap)) {
      chunks.push({
        path: doc.path,
        content: texto.slice(i, i + tamanho)
      });
    }
  }

  return chunks;
}

module.exports = { gerarChunks };



//executar: npm run rag:chunks