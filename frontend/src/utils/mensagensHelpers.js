// frontend/src/utils/mensagensHelpers.js

/**
 * Formata um número de telefone do WhatsApp para exibição
 * @param {string} numero - Número no formato do WhatsApp
 * @returns {string} Número formatado
 */
export const formatarNumero = (numero) => {
  if (!numero || numero === 'eu') return 'Você';
  
  const limpo = numero
    .replace('@s.whatsapp.net', '')
    .replace('@g.us', '')
    .replace(/:.*$/, '');
  
  // Formato brasileiro: +55 (XX) XXXXX-XXXX
  if (limpo.length >= 12) {
    return `+${limpo.slice(0, 2)} (${limpo.slice(2, 4)}) ${limpo.slice(4, 9)}-${limpo.slice(9)}`;
  }
  
  return limpo;
};

/**
 * Formata a hora de uma data
 * @param {string|Date} data - Data a ser formatada
 * @returns {string} Hora formatada (HH:MM)
 */
export const formatarHora = (data) => {
  return new Date(data).toLocaleTimeString('pt-BR', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
};

/**
 * Formata uma data para exibição relativa (Hoje, Ontem, ou data completa)
 * @param {string|Date} data - Data a ser formatada
 * @returns {string} Data formatada
 */
export const formatarData = (data) => {
  const hoje = new Date();
  const dataMsg = new Date(data);
  
  if (!data || isNaN(dataMsg.getTime())) return '';
  
  // Verifica se é hoje
  if (dataMsg.toDateString() === hoje.toDateString()) {
    return 'Hoje';
  }
  
  // Verifica se foi ontem
  const ontem = new Date(hoje);
  ontem.setDate(ontem.getDate() - 1);
  if (dataMsg.toDateString() === ontem.toDateString()) {
    return 'Ontem';
  }
  
  // Retorna data completa
  return dataMsg.toLocaleDateString('pt-BR');
};

/**
 * Agrupa reações por emoji, mantendo apenas a mais recente de cada autor
 * @param {Array} reactions - Array de reações
 * @param {string} msgId - ID da mensagem
 * @returns {Object} Objeto com reações agrupadas por emoji
 */
export const agruparReacoes = (reactions, msgId) => {
  try {
    if (!Array.isArray(reactions)) return {};

    // 1. Filtra reações para esta mensagem
    const reacoesMsg = reactions.filter(r => r.reactionToWhatsappId === msgId);
    
    if (reacoesMsg.length === 0) return {};

    // 2. Mantém apenas a reação mais recente de cada autor
    const ultimasPorAutor = new Map();
    
    // Ordena da mais antiga para a mais recente
    reacoesMsg
      .sort((a, b) => new Date(a.data) - new Date(b.data))
      .forEach(r => {
        // ID único do autor (prioriza participant para grupos)
        const autorId = r.participant || r.de || r.internalId;
        ultimasPorAutor.set(autorId, r);
      });

    // 3. Agrupa por emoji
    const agrupadas = {};
    
    Array.from(ultimasPorAutor.values()).forEach(r => {
      const emoji = r.mensagem || '?';
      const autorNome = r.participantNome || r.remetenteNome || formatarNumero(r.de) || 'Usuário';
      
      if (!agrupadas[emoji]) {
        agrupadas[emoji] = { count: 0, authors: [] };
      }
      
      agrupadas[emoji].count += 1;
      
      // Evita duplicatas de autores
      if (!agrupadas[emoji].authors.includes(autorNome)) {
        agrupadas[emoji].authors.push(autorNome);
      }
    });

    return agrupadas;
  } catch (error) {
    console.error('Erro ao agrupar reações:', error);
    return {};
  }
};

/**
 * Verifica se deve mostrar a data separadora entre mensagens
 * @param {number} index - Índice da mensagem atual
 * @param {Array} mensagens - Array de todas as mensagens
 * @returns {boolean} Se deve mostrar a data
 */
export const deveMostrarData = (index, mensagens) => {
  if (index === 0) return true;
  
  const msgAtual = mensagens[index];
  const msgAnterior = mensagens[index - 1];
  
  return formatarData(msgAnterior?.data) !== formatarData(msgAtual?.data);
};

/**
 * Verifica se a conversa está na parte inferior da área de scroll
 * @param {HTMLElement} container - Elemento container das mensagens
 * @param {number} threshold - Distância da base para considerar "no fundo" (padrão: 150px)
 * @returns {boolean} Se está próximo do final
 */
export const estaNoFundoDoScroll = (container, threshold = 150) => {
  if (!container) return false;
  return container.scrollHeight - container.scrollTop - container.clientHeight < threshold;
};

/**
 * Converte tamanho de arquivo em bytes para formato legível
 * @param {number} bytes - Tamanho em bytes
 * @returns {string} Tamanho formatado (ex: "2.5 MB")
 */
export const formatarTamanhoArquivo = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const tamanhos = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + tamanhos[i];
};

/**
 * Obtém o tipo de mídia a partir do tipo MIME
 * @param {string} mimeType - Tipo MIME do arquivo
 * @returns {string} Tipo simplificado (imagem, video, audio, documento)
 */
export const obterTipoMidia = (mimeType) => {
  if (!mimeType) return 'documento';
  
  if (mimeType.startsWith('image/')) return 'imagem';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  
  return 'documento';
};

/**
 * Cria um ID temporário único para mensagens otimistas
 * @param {string} prefixo - Prefixo do ID (padrão: 'temp')
 * @returns {string} ID temporário único
 */
export const gerarIdTemporario = (prefixo = 'temp') => {
  return `${prefixo}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Verifica se uma mensagem é própria (enviada pelo usuário atual)
 * @param {Object} msg - Objeto da mensagem
 * @returns {boolean} Se a mensagem foi enviada pelo usuário
 */
export function eMensagemPropria(msg) {  
  // ✅ CRITICAL: Verifica se a mensagem foi ENVIADA por você    
  // Método 1: Verifica o campo 'direcao'  
  if (msg.direcao === 'ENVIADA') {    
    return true;  
  }    

  // Método 2: Verifica se foi enviada "de você"  
  if (msg.de === 'eu' || msg.enviadaPor === 'eu') {    
    return true;  
  }    

  // Método 3: Verifica se tem o campo fromMe  
  if (msg.fromMe === true) {    
    return true;  
  }    

  // Se nenhum dos casos acima, é mensagem recebida  
  return false;
}

/**
 * Integra anotações no array de mensagens
 * @param {Array} mensagens - Array de mensagens
 * @param {Array} anotacoes - Array de anotações
 * @returns {Array} Array combinado e ordenado
 */
export const integrarAnotacoes = (mensagens, anotacoes) => {
  // Mapeia anotações para formato de mensagem
  const anotacoesComoMsgs = anotacoes.map(anotacao => ({
  	id: `anotacao-${anotacao.id}`,
  	tipo: 'anotacao',
  	mensagem: anotacao.conteudo || 'Anotação Apagada',
  	cor: anotacao.apagada ? 'apagada' : anotacao.cor,
  	data: anotacao.criadaEm,
  	direcao: 'INTERNA',
  	anotacaoId: anotacao.id,
  	usuario: anotacao.usuario,
  	apagada: anotacao.apagada,
  	de: 'anotacao',
  }));

  // Remove anotações antigas das mensagens
  const msgsNaoAnotacoes = mensagens.filter(m => m.tipo !== 'anotacao');

  // Combina e ordena por data
  const todasMsgs = [...msgsNaoAnotacoes, ...anotacoesComoMsgs].sort(
    (a, b) => new Date(a.data).getTime() - new Date(b.data).getTime()
  );

  return todasMsgs;
};

/**
 * Filtra mensagens novas que ainda não existem no array atual
 * @param {Array} mensagensAtuais - Mensagens atuais
 * @param {Array} novasMensagens - Novas mensagens recebidas
 * @returns {Array} Apenas mensagens realmente novas
 */
export const filtrarMensagensNovas = (mensagensAtuais, novasMensagens) => {
  const idsExistentes = new Set(mensagensAtuais.map(m => m.id));
  return novasMensagens.filter(m => !idsExistentes.has(m.id));
};

/**
 * ✅ FUNÇÃO FALTANDO: Agrupa mensagens por data
 * @param {Array} mensagens - Array de mensagens
 * @returns {Array} Array de objetos com data e mensagens agrupadas
 */
export const agruparMensagensPorData = (mensagens) => {
  if (!mensagens || !Array.isArray(mensagens)) return [];
  
  const grupos = {};
  
  mensagens.forEach(mensagem => {
    const data = mensagem.data || mensagem.timestamp || mensagem.createdAt;
    if (!data) return;
    
    try {
      const dataFormatada = formatarData(data);
      
      if (!grupos[dataFormatada]) {
        grupos[dataFormatada] = {
          data: dataFormatada,
          mensagens: []
        };
      }
      
      grupos[dataFormatada].mensagens.push(mensagem);
    } catch (error) {
      console.error('Erro ao agrupar mensagem:', error);
    }
  });
  
  // Converter objeto em array e ordenar por data
  return Object.values(grupos).sort((a, b) => {
    const dateA = new Date(a.mensagens[0]?.data || 0);
    const dateB = new Date(b.mensagens[0]?.data || 0);
    return dateA - dateB;
  });
};