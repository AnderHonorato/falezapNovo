// backend/src/controladores/analytics.controlador.js
// ✅ VERSÃO FINAL CORRIGIDA

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Função principal para buscar todos os dados de análise
const getAnalyticsData = async (req, res) => {
  try {
    const usuarioLogado = req.usuario;
    
    // Verificar se o usuário tem permissão para ver relatórios
    if (usuarioLogado.tipo === 'USUARIO' && !usuarioLogado.podeVerRelatorios) {
      return res.status(403).json({
        sucesso: false,
        erro: 'Você não tem permissão para acessar relatórios.'
      });
    }

    const contaId = usuarioLogado.contaId;

    // Período de análise (últimos 7 dias)
    const dataInicio = new Date();
    dataInicio.setDate(dataInicio.getDate() - 7);
    dataInicio.setHours(0, 0, 0, 0);

    // Executar todas as consultas em paralelo para melhor performance
    const [
      contagensGerais,
      mensagensPorDia,
      atendimentosPorUsuario,
      conversasFinalizadasHoje
    ] = await Promise.all([
      getContagensGerais(contaId),
      getMensagensPorDia(contaId, dataInicio),
      getAtendimentosPorUsuario(contaId, dataInicio),
      getConversasFinalizadasHoje(contaId)
    ]);

    res.json({
      sucesso: true,
      dados: {
        contagensGerais,
        mensagensPorDia,
        atendimentosPorUsuario,
        conversasFinalizadasHoje
      }
    });

  } catch (error) {
    console.error("❌ Erro ao buscar dados de analytics:", error);
    res.status(500).json({ 
      sucesso: false, 
      erro: 'Erro ao buscar dados de análise.' 
    });
  }
};

// --- Funções Auxiliares ---

/**
 * Busca contagens gerais (KPIs principais)
 * @param {string} contaId - ID da conta
 * @returns {Promise<Object>} Objeto com totais
 */
async function getContagensGerais(contaId) {
  const [totalConversas, totalMensagens, totalUsuarios] = await Promise.all([
    prisma.conversa.count({ 
      where: { contaId } 
    }),
    prisma.mensagem.count({ 
      where: { contaId } 
    }),
    prisma.usuario.count({ 
      where: { 
        contaId,
        status: 'ATIVO' 
      } 
    })
  ]);

  return {
    totalConversas,
    totalMensagens,
    totalUsuarios
  };
}

/**
 * Agrupa mensagens por dia nos últimos 7 dias
 * Separa entre enviadas e recebidas
 * @param {string} contaId - ID da conta
 * @param {Date} dataInicio - Data inicial do período
 * @returns {Promise<Array>} Array com dados formatados para gráfico
 */
async function getMensagensPorDia(contaId, dataInicio) {
  // ✅ USAR enviadaEm ao invés de criadaEm
  const [enviadas, recebidas] = await Promise.all([
    prisma.mensagem.findMany({
      where: {
        contaId,
        enviadaEm: { gte: dataInicio }, // ✅ CORRIGIDO
        direcao: 'ENVIADA'
      },
      select: { enviadaEm: true } // ✅ CORRIGIDO
    }),
    prisma.mensagem.findMany({
      where: {
        contaId,
        enviadaEm: { gte: dataInicio }, // ✅ CORRIGIDO
        direcao: 'RECEBIDA'
      },
      select: { enviadaEm: true } // ✅ CORRIGIDO
    })
  ]);

  // Criar objeto para armazenar contagens por dia
  const dadosPorDia = {};

  // Processar mensagens enviadas
  enviadas.forEach(msg => {
    // ✅ VALIDAÇÃO: Verifica se enviadaEm existe e é válida
    if (!msg.enviadaEm) return;
    
    try {
      const data = new Date(msg.enviadaEm);
      if (isNaN(data.getTime())) return; // ✅ Ignora datas inválidas
      
      const dataString = data.toISOString().split('T')[0];
      if (!dadosPorDia[dataString]) {
        dadosPorDia[dataString] = { enviadas: 0, recebidas: 0 };
      }
      dadosPorDia[dataString].enviadas++;
    } catch (erro) {
      console.warn('⚠️ Data inválida ignorada:', msg.enviadaEm);
    }
  });

  // Processar mensagens recebidas
  recebidas.forEach(msg => {
    // ✅ VALIDAÇÃO: Verifica se enviadaEm existe e é válida
    if (!msg.enviadaEm) return;
    
    try {
      const data = new Date(msg.enviadaEm);
      if (isNaN(data.getTime())) return; // ✅ Ignora datas inválidas
      
      const dataString = data.toISOString().split('T')[0];
      if (!dadosPorDia[dataString]) {
        dadosPorDia[dataString] = { enviadas: 0, recebidas: 0 };
      }
      dadosPorDia[dataString].recebidas++;
    } catch (erro) {
      console.warn('⚠️ Data inválida ignorada:', msg.enviadaEm);
    }
  });

  // Criar array para os últimos 7 dias (garantir que todos os dias apareçam)
  const grafico = [];
  for (let i = 0; i < 7; i++) {
    const data = new Date(dataInicio);
    data.setDate(data.getDate() + i);
    const dataString = data.toISOString().split('T')[0];
    const diaFormatado = data.toLocaleDateString('pt-BR', { 
      day: '2-digit', 
      month: '2-digit' 
    });
    
    grafico.push({
      name: diaFormatado,
      enviadas: dadosPorDia[dataString]?.enviadas || 0,
      recebidas: dadosPorDia[dataString]?.recebidas || 0
    });
  }

  return grafico;
}

/**
 * Conta quantas conversas cada usuário finalizou no período
 * @param {string} contaId - ID da conta
 * @param {Date} dataInicio - Data inicial do período
 * @returns {Promise<Array>} Array com nome e quantidade de atendimentos
 */
async function getAtendimentosPorUsuario(contaId, dataInicio) {
  // Agrupar conversas finalizadas por usuário
  const conversasFinalizadas = await prisma.conversa.groupBy({
    by: ['usuarioResponsavelId'],
    where: {
      contaId,
      statusConversa: 'FINALIZADA',
      finalizadaEm: {
        gte: dataInicio
      },
      usuarioResponsavelId: {
        not: null
      }
    },
    _count: {
      id: true
    }
  });

  // Se não houver conversas finalizadas, retornar array vazio
  if (conversasFinalizadas.length === 0) {
    return [];
  }

  // Extrair IDs dos usuários
  const idsUsuarios = conversasFinalizadas.map(item => item.usuarioResponsavelId);
  
  // Buscar os nomes dos usuários
  const usuarios = await prisma.usuario.findMany({
    where: { 
      id: { in: idsUsuarios } 
    },
    select: { 
      id: true, 
      nome: true 
    }
  });
  
  // Criar um mapa de ID -> Nome para acesso rápido
  const mapaNomes = new Map(usuarios.map(u => [u.id, u.nome]));

  // Formatar dados para o gráfico de pizza/tabela
  return conversasFinalizadas
    .map(item => ({
      name: mapaNomes.get(item.usuarioResponsavelId) || 'Usuário Desconhecido',
      value: item._count.id
    }))
    .sort((a, b) => b.value - a.value); // Ordenar do maior para o menor
}

/**
 * Conta conversas finalizadas hoje
 * @param {string} contaId - ID da conta
 * @returns {Promise<number>} Quantidade de conversas finalizadas hoje
 */
async function getConversasFinalizadasHoje(contaId) {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  
  return await prisma.conversa.count({
    where: {
      contaId,
      statusConversa: 'FINALIZADA',
      finalizadaEm: {
        gte: hoje
      }
    }
  });
}

// Exportar funções
module.exports = {
  getAnalyticsData
};