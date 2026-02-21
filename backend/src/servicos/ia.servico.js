const axios = require('axios');
const fs = require('fs');
const path = require('path');

const SPIDER_API_TOKEN = process.env.SPIDER_API_TOKEN;
const SPIDER_API_BASE_URL = 'https://api.spiderx.com.br/api/ai/gemini';

if (!SPIDER_API_TOKEN) {
  console.error('❌ SPIDER_API_TOKEN não configurado.');
}

/* ======================================================
   🔐 PROMPT BASE BLINDADO
====================================================== */
function gerarPromptBase(nomeUsuario, primeiraMensagem) {
  const saudacao = primeiraMensagem
    ? `Inicie a conversa com uma saudação curta usando o nome do usuário: "Olá, ${nomeUsuario}!".`
    : `NÃO se apresente novamente e NÃO repita saudações.`;

  return `
Você é a FaleZap IA, assistente virtual oficial do sistema FaleZap.

${saudacao}

MISSÃO:
- Ajudar usuários do sistema FaleZap com suas dúvidas e problemas
- Fornecer informações claras e úteis sobre o sistema
- Explicar apenas funcionalidades disponíveis no sistema
- Orientar uso do sistema
- Fornecer suporte básico
- Encaminhar para suporte humano quando necessário

FUNCIONALIDADES DO CHAT FLUTUANTE:
- Chat em Tempo Real: Mensagens instantâneas individuais e em grupo
- Respostas inteligentes, histórico de contexto e triagem automática para suporte
- Editor de Mensagem: Suporte a emojis, menções (@) e formatação de texto (negrito, itálico, etc.).
- Personalização Visual: Definição de papel de parede (cores, gradientes ou fotos) com editor integrado (recorte, zoom e brilho).
- Gestão de Suporte: Abertura de chamados via IA e opção de encerrar atendimentos.
- Interface: Janela flutuante, menu lateral retrátil e Dashboard inicial com atalhos.
- Administrativo: Envio de alertas (broadcast) para usuários.

REGRAS DE SEGURANÇA (OBRIGATÓRIO):
- Nunca explique backend, código, banco de dados, APIs ou lógica interna
- Nunca cite arquivos, rotas ou serviços internos
- Se perguntarem algo interno, diga que não é possível responder isso e pergunte se tem mais alguma dúvida sobre o uso do sistema
- Nunca peça dados sensíveis ou privados
- Nunca sugira ações inseguras ou ilegais


ESTILO DE RESPOSTA:
- Português brasileiro
- Linguagem simples e profissional
- Respostas CURTAS e OBJETIVAS
- No máximo 3 parágrafos
- Use listas quando possível
- Use emojis de forma moderada para humanizar a conversa
`.trim();
}

/* ======================================================
   🔀 MODOS DE OPERAÇÃO
====================================================== */
function obterPromptModo(modo) {
  switch (modo) {
    case 'FAQ':
      return `
MODO FAQ:
Explique funcionalidades visíveis.
Responda de forma direta.
`.trim();

    case 'SUPORTE':
      return `
MODO SUPORTE:
Ajude a resolver problemas comuns.
Se necessário, oriente abrir chamado pedindo pra ele digitar "abrir chamado".
`.trim();

    case 'COMERCIAL':
      return `
MODO COMERCIAL:
Destaque benefícios e valor.
Linguagem clara e persuasiva.
`.trim();

    default:
      return `
MODO CONVERSA:
Responda de forma natural e objetiva.
`.trim();
  }
}

/* ======================================================
   🧠 RAG – CONTEXTO INTERNO (NÃO EXPOSTO)
====================================================== */
function buscarContextoRAG(pergunta, limite = 3) {
  // 🛡️ Blindagem absoluta
  if (!pergunta || typeof pergunta !== 'string') {
    return [];
  }

  const caminho = path.resolve(__dirname, '../../rag-chunks.json');
  if (!fs.existsSync(caminho)) return [];

  const chunks = JSON.parse(fs.readFileSync(caminho, 'utf-8'));

  const termos = pergunta
    .toLowerCase()
    .split(/\s+/)
    .filter(t => t.length > 2);

  return chunks
    .map(c => {
      let score = 0;
      const conteudo = typeof c.conteudo === 'string' ? c.conteudo.toLowerCase() : '';

      for (const termo of termos) {
        if (conteudo.includes(termo)) score++;
      }

      return { ...c, score };
    })
    .filter(c => c.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limite);
}

/* ======================================================
   ✂️ LIMITADOR DE PROMPT (2048)
====================================================== */
function limitarTexto(texto, limite = 2048) {
  if (texto.length <= limite) return texto;
  return texto.substring(0, limite - 100) + '\n[Conteúdo resumido automaticamente]';
}

/* ======================================================
   ⏳ DELAY UTILITÁRIO
====================================================== */
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}


/* ======================================================
   🤖 CHAMADA SPIDERX COM RETRY INTELIGENTE
====================================================== */
async function chamarSpiderX(prompt, tentativasMax = 10) {
  const url = `${SPIDER_API_BASE_URL}?api_key=${SPIDER_API_TOKEN}`;

  let ultimaFalha = null;

  for (let tentativa = 1; tentativa <= tentativasMax; tentativa++) {
    try {
      const response = await axios.post(
        url,
        { text: prompt },
        { headers: { 'Content-Type': 'application/json' }, timeout: 25000 }
      );

      if (!response.data?.response) {
        throw new Error('Resposta vazia da IA');
      }

      return response.data.response;

    } catch (error) {
      ultimaFalha = error;
      console.warn(`⚠️ SpiderX falhou (${tentativa}/${tentativasMax})`);

      // backoff progressivo
      await delay(500 * tentativa);
    }
  }

  throw ultimaFalha;
}


/* ======================================================
   🧠 FUNÇÃO FINAL (USADA NA ROTA)
====================================================== */
async function perguntarAoSistemaComRAG({
  perguntaUsuario,
  nomeUsuario = 'usuário',
  modo = 'CONVERSA',
  primeiraMensagem = false
}) {

  // 🛡️ BLINDAGEM – evita erro de undefined.toLowerCase
  if (!perguntaUsuario || typeof perguntaUsuario !== 'string') {
    return 'Não entendi sua pergunta. Pode reformular de forma mais clara?';
  }

  // ⚠️ NUNCA usar respostas anteriores da IA
  const contextos = buscarContextoRAG(perguntaUsuario);


  const contextoTexto = contextos.length
    ? contextos.map(c => c.conteudo).join('\n')
    : '';

  const promptFinal = `
${gerarPromptBase(nomeUsuario, primeiraMensagem)}

${obterPromptModo(modo)}

CONTEXTO INTERNO (APENAS PARA REFERÊNCIA):
${contextoTexto}

PERGUNTA DO USUÁRIO:
${perguntaUsuario}
`.trim();

  const promptSeguro = limitarTexto(promptFinal, 2048);

  try {
  return await chamarSpiderX(promptSeguro, 10);
    } catch (error) {
    console.error('❌ SpiderX indisponível após várias tentativas:', error.message);
    return respostaFallbackLocal(perguntaUsuario);
    }
}

// ✅ NOVA FUNÇÃO EXPORTADA: Permite chamadas diretas com prompt livre
async function chamarSpiderXDireto(prompt) {
  return await chamarSpiderX(prompt, 3); // 3 tentativas
}

/**
 * Analisa o sentimento e classifica o feedback em tags
 */
async function analisarFeedbackIA(comentario, nota) {
  const prompt = `
    Analise o seguinte feedback de usuário (Nota: ${nota}/5):
    "${comentario}"
    
    Responda APENAS em formato JSON:
    {
      "sentimento": "POSITIVO" | "NEGATIVO" | "NEUTRO",
      "tags": ["Tag1", "Tag2"],
      "resumo_curto": "string"
    }
    Tags sugeridas: Suporte, Interface, Financeiro, Bug, Elogio, Lentidão.
  `.trim();

  try {
    const resposta = await chamarSpiderXDireto(prompt);
    return JSON.parse(resposta.replace(/```json|```/g, ''));
  } catch (error) {
    return { sentimento: nota >= 4 ? "POSITIVO" : "NEGATIVO", tags: [] };
  }
}

/**
 * Gera resumo semanal dos pontos de dor
 */
async function gerarResumoExecutivoIA(avaliacoes) {
  const corpo = avaliacoes.map(a => `Nota ${a.avaliacao}: ${a.comentarioAvaliacao}`).join('\n');
  const prompt = `
    Baseado nestas avaliações recentes:
    ${corpo}
    
    Gere um resumo executivo para o gerente:
    1. Principais pontos de dor (reclamações)
    2. O que os usuários mais elogiaram
    3. Sugestão de ação imediata.
    Seja direto e use bullet points.
  `.trim();

  return await chamarSpiderXDireto(prompt);
}

/* ======================================================
   🛟 FALLBACK LOCAL (SEM IA EXTERNA)
====================================================== */
function respostaFallbackLocal(pergunta) {
  const perguntaLower = pergunta.toLowerCase();

  if (perguntaLower.includes('preço') || perguntaLower.includes('plano')) {
    return 'Para informações sobre planos e valores, fale com nosso time comercial. Eles vão te orientar da melhor forma 😉';
  }

  if (perguntaLower.includes('erro') || perguntaLower.includes('problema')) {
    return 'Entendo, isso pode acontecer às vezes. O ideal é abrir um chamado para que nosso time técnico possa te ajudar rapidamente.';
  }

  if (perguntaLower.includes('como') || perguntaLower.includes('funciona')) {
    return 'Posso te explicar sim 😊 Me diga exatamente o que você quer fazer dentro do sistema.';
  }

  return 'No momento não consegui acessar todas as informações, mas posso te ajudar de outra forma. Pode reformular sua pergunta?';
}

module.exports = {
  perguntarAoSistemaComRAG,
  chamarSpiderXDireto,
  analisarFeedbackIA,
  gerarResumoExecutivoIA
};
