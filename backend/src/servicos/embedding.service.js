const axios = require("axios");

const SPIDER_API_URL = "https://api.spider.cloud/v1/embeddings";

async function gerarEmbedding(texto) {
  const response = await axios.post(
    SPIDER_API_URL,
    {
      model: "text-embedding-3-large",
      input: texto
    },
    {
      headers: {
        "Authorization": `Bearer ${process.env.SPIDER_API_TOKEN}`,
        "Content-Type": "application/json"
      }
    }
  );

  return response.data.data[0].embedding;
}

module.exports = { gerarEmbedding };
