const axios = require("axios");

async function perguntarParaSpider(texto) {
  const response = await axios.post(
    `https://api.spiderx.com.br/api/ai/gemini?api_key=${process.env.SPIDER_API_TOKEN}`,
    {
      text: texto
    },
    {
      headers: {
        "Content-Type": "application/json"
      }
    }
  );

  if (!response.data.success) {
    throw new Error("Erro ao obter resposta da IA Spider");
  }

  return response.data.response;
}

module.exports = { perguntarParaSpider };
