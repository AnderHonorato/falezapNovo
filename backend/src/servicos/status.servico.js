// backend/src/servicos/status.servico.js

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class ServicoStatus {
  constructor() {
    this.statusUsuarios = new Map();
    this.configuracoesHorario = new Map();
    this.historicoMudancasRecentes = [];
    this.notificacoesEnviadas = new Map(); // NOVO: Rastreia notificações já enviadas por sessão
    this.TEMPO_MAX_HISTORICO_SEGUNDOS = 60;
    this.INTERVALO_BUSCA_RECENTES_SEGUNDOS = 30;
    this.iniciarVerificacaoAutomatica();
    this.iniciarLimpezaHistorico();
  }

  async logarMudancaStatus(usuarioId, novoStatus) {
    try {
      const usuario = await prisma.usuario.findUnique({
        where: { id: usuarioId },
        select: { nome: true, contaId: true }
      });

      if (!usuario) {
        console.warn(`[logarMudancaStatus] Usuário ${usuarioId} não encontrado no DB para logar mudança.`);
        return;
      }

      const evento = {
        usuarioId: usuarioId,
        contaId: usuario.contaId,
        nomeUsuario: usuario.nome,
        novoStatus: novoStatus,
        horario: new Date(),
        sessaoId: Date.now() // NOVO: ID único para cada mudança
      };

      this.historicoMudancasRecentes.push(evento);
      console.log(`[Histórico Status] Logado: ${usuario.nome} (${usuarioId}) -> ${novoStatus} às ${evento.horario.toLocaleTimeString()}`); 

    } catch (error) {
      console.error(`[logarMudancaStatus] Erro ao buscar dados do usuário ${usuarioId}:`, error);
    }
  }

  async setStatus(usuarioId, status, configuracao = null, motivo = 'manual') {
    const statusValidos = ['disponivel', 'ausente', 'almoco', 'fora_servico', 'offline'];
    if (!statusValidos.includes(status)) {
      console.error(`Tentativa de definir status inválido '${status}' para ${usuarioId}`);
      throw new Error('Status inválido');
    }

    const agora = new Date();
    const dadosAntigos = this.statusUsuarios.get(usuarioId);
    const statusAntigo = dadosAntigos?.status;

    const dadosStatus = {
      status: status,
      motivo: motivo,
      ultimaAtividade: agora,
      dataInicio: agora
    };
    this.statusUsuarios.set(usuarioId, dadosStatus);

    let configParaSalvar = this.configuracoesHorario.get(usuarioId) || null;

    if (configuracao) {
      this.configuracoesHorario.set(usuarioId, configuracao);
      configParaSalvar = configuracao;
      console.log(`[setStatus] Configuração de horário (via param) definida para ${usuarioId}:`, configuracao);
    } 
    else if (motivo === 'manual' && (status === 'disponivel' || status === 'ausente')) {
      if (this.configuracoesHorario.has(usuarioId)) {
        this.configuracoesHorario.delete(usuarioId);
        console.log(`[setStatus] Configuração de horário removida para ${usuarioId} ao definir status ${status}.`);
      }
      configParaSalvar = null;
    }

    try {
      await prisma.usuario.update({
        where: { id: usuarioId },
        data: { configuracaoHorarios: configParaSalvar } 
      });
      console.log(`[setStatus] Configuração de ${usuarioId} persistida no DB como:`, configParaSalvar);
    } catch (error) {
      console.error(`[setStatus] FALHA ao persistir config de ${usuarioId} no DB:`, error);
    }

    console.log(`✅ Status [${usuarioId}] -> ${status} (Motivo: ${motivo})`);

    // CRÍTICO: Sempre loga a mudança, mesmo se for o mesmo status
    if (statusAntigo !== status) {
      await this.logarMudancaStatus(usuarioId, status);
      console.log(`[setStatus] 🔔 Mudança logada no histórico: ${usuarioId} -> ${status}`);
    } else {
      console.log(`[setStatus] ℹ️ Status não mudou (${statusAntigo} -> ${status}), não logando.`);
    }

    return { ...dadosStatus, configuracao: this.configuracoesHorario.get(usuarioId) || null, usuarioId };
  }

  async getStatus(usuarioId) {
    let dadosStatus = this.statusUsuarios.get(usuarioId);
    let configuracao = this.configuracoesHorario.get(usuarioId);

    if (!configuracao && usuarioId) {
      try {
        const usuarioDb = await prisma.usuario.findUnique({
          where: { id: usuarioId },
          select: { configuracaoHorarios: true } 
        });

        if (usuarioDb && usuarioDb.configuracaoHorarios) {
          configuracao = usuarioDb.configuracaoHorarios;
          this.configuracoesHorario.set(usuarioId, configuracao);
          console.log(`[getStatus] Configuração de ${usuarioId} carregada do DB para memória.`);
        }
      } catch (error) {
        console.error(`[getStatus] Erro ao buscar config do DB para ${usuarioId}:`, error);
      }
    }

    if (!dadosStatus) {
      dadosStatus = {
        status: 'offline',
        motivo: 'manual',
        ultimaAtividade: null,
        dataInicio: new Date()
      };
    }

    // MODIFICADO: Verifica status automático SEMPRE que houver configuração
    if (configuracao) {
      const statusAtualMemoria = dadosStatus?.status || 'offline';
      const statusAutomatico = await this.verificarStatusAutomatico(usuarioId, configuracao, statusAtualMemoria); 
      
      if (statusAutomatico && statusAutomatico !== statusAtualMemoria) {
        console.log(`[getStatus] Aplicando status automático para ${usuarioId}: ${statusAutomatico}`);
        return { 
          ...dadosStatus, 
          status: statusAutomatico, 
          configuracao, 
          usuarioId 
        };
      }
    }
    
    return { ...dadosStatus, configuracao: configuracao || null, usuarioId };
  }

  async atualizarAtividade(usuarioId) {
    const dadosStatus = this.statusUsuarios.get(usuarioId) || {
      status: 'disponivel', 
      motivo: 'manual',
      dataInicio: new Date()
    };

    let statusFinal = dadosStatus.status;
    let motivoFinal = dadosStatus.motivo;

    if (dadosStatus.status === 'ausente' && dadosStatus.motivo === 'inatividade') {
      const config = this.configuracoesHorario.get(usuarioId);
      const statusAutomatico = await this.verificarStatusAutomatico(usuarioId, config, dadosStatus.status);
      
      if (!statusAutomatico) {
        statusFinal = 'disponivel';
        motivoFinal = 'manual';
      }
    }

    this.statusUsuarios.set(usuarioId, {
      ...dadosStatus,
      status: statusFinal,
      motivo: motivoFinal,
      ultimaAtividade: new Date(),
    });

    if (dadosStatus.status !== statusFinal) {
      await this.logarMudancaStatus(usuarioId, statusFinal);
    }
  }

  async verificarStatusAutomatico(usuarioId, config, statusAtualMemoria) {
    if (!config) return null;

    const agora = new Date();
    const horaAtual = agora.getHours() + agora.getMinutes() / 60;

    const parseHora = (str) => {
      if (!str || !str.includes(':')) return 0;
      const [h, m] = str.split(':').map(Number);
      return h + m / 60;
    };

    let novoStatus = null;

    // 1. Verifica Almoço (prioridade máxima)
    if (config.horarioAlmoco?.ativo && config.horarioAlmoco?.inicio && config.horarioAlmoco?.fim) {
      const inicioAlmoco = parseHora(config.horarioAlmoco.inicio);
      const fimAlmoco = parseHora(config.horarioAlmoco.fim);
      
      if (horaAtual >= inicioAlmoco && horaAtual < fimAlmoco) {
        novoStatus = 'almoco';
        console.log(`[AutoStatus] ${usuarioId} está no horário de almoço (${config.horarioAlmoco.inicio} - ${config.horarioAlmoco.fim})`);
      }
    }

    // 2. Verifica Fora de Serviço (só se não estiver em almoço)
    if (!novoStatus && config.horarioTrabalho?.ativo && config.horarioTrabalho?.inicio && config.horarioTrabalho?.fim) {
      const inicioTrabalho = parseHora(config.horarioTrabalho.inicio);
      const fimTrabalho = parseHora(config.horarioTrabalho.fim);
      
      if (horaAtual < inicioTrabalho || horaAtual >= fimTrabalho) {
        novoStatus = 'fora_servico';
        console.log(`[AutoStatus] ${usuarioId} está fora do horário de trabalho (${config.horarioTrabalho.inicio} - ${config.horarioTrabalho.fim})`);
      }
    }
    
    // Se detectou um status automático diferente do atual
    if (novoStatus && statusAtualMemoria !== novoStatus) {
      console.log(`[AutoStatus] Mudando ${usuarioId}: ${statusAtualMemoria} -> ${novoStatus}`);
      await this.setStatus(usuarioId, novoStatus, config, 'automatico'); 
      return novoStatus;
    }
    
    // Se estava em status automático e agora não está mais (voltou ao horário normal)
    if (!novoStatus && (statusAtualMemoria === 'almoco' || statusAtualMemoria === 'fora_servico')) {
      console.log(`[AutoStatus] ${usuarioId} voltando para 'disponivel' (horário automático encerrou)`);
      await this.setStatus(usuarioId, 'disponivel', config, 'automatico'); 
      return 'disponivel';
    }
    
    return novoStatus; // Retorna o status que deve estar ativo, ou null
  }

  async verificarInatividade(usuarioId) {
    const dadosStatus = this.statusUsuarios.get(usuarioId);
    if (!dadosStatus || dadosStatus.status !== 'disponivel') {
      return; 
    }

    const agora = new Date();
    const minutosInativo = (agora.getTime() - dadosStatus.ultimaAtividade.getTime()) / 60000;

    if (minutosInativo > 10) {
      console.log(`[Inatividade] ${usuarioId} ficou ausente por inatividade.`);
      const config = this.configuracoesHorario.get(usuarioId);
      await this.setStatus(usuarioId, 'ausente', config, 'inatividade');
    }
  }

  iniciarVerificacaoAutomatica() {
    console.log('⏰ Iniciando verificação automática de status (a cada 60s)...');
    setInterval(async () => {
      
      // Verifica configurações de horário
      const usuariosParaVerificarConfig = Array.from(this.configuracoesHorario.keys());
      for (const usuarioId of usuariosParaVerificarConfig) {
        const config = this.configuracoesHorario.get(usuarioId);
        const dadosStatus = this.statusUsuarios.get(usuarioId);
        const statusAtualMemoria = dadosStatus?.status || 'offline';
        
        if (config) {
          await this.verificarStatusAutomatico(usuarioId, config, statusAtualMemoria); 
        }
      }

      // Verifica inatividade
      const usuariosAtivos = Array.from(this.statusUsuarios.keys());
      for (const usuarioId of usuariosAtivos) {
        await this.verificarInatividade(usuarioId); 
      }
    }, 60000);
  }

  iniciarLimpezaHistorico() {
    const intervaloLimpeza = this.TEMPO_MAX_HISTORICO_SEGUNDOS * 1.5 * 1000; 
    console.log(`🧹 Iniciando limpeza periódica do histórico de status (a cada ${intervaloLimpeza / 1000} segundos)...`);
    setInterval(() => {
      const agora = Date.now();
      const tempoLimite = agora - this.TEMPO_MAX_HISTORICO_SEGUNDOS * 1000;
      const tamanhoAntes = this.historicoMudancasRecentes.length;

      this.historicoMudancasRecentes = this.historicoMudancasRecentes.filter(evento =>
        evento.horario.getTime() >= tempoLimite
      );

      const tamanhoDepois = this.historicoMudancasRecentes.length;
      if (tamanhoAntes > tamanhoDepois) {
        console.log(`[Limpeza Histórico] Removidos ${tamanhoAntes - tamanhoDepois} eventos > ${this.TEMPO_MAX_HISTORICO_SEGUNDOS}s. Restantes: ${tamanhoDepois}`);
      }

      // NOVO: Limpa notificações antigas (mais de 5 minutos)
      const tempoLimiteNotif = agora - 5 * 60 * 1000;
      for (const [chave, timestamp] of this.notificacoesEnviadas.entries()) {
        if (timestamp < tempoLimiteNotif) {
          this.notificacoesEnviadas.delete(chave);
        }
      }
    }, intervaloLimpeza);
  }

  async listarTodosComInfo() {
    try {
      const usuariosDoBanco = await prisma.usuario.findMany({
        where: {
          status: 'ATIVO'
        },
        select: {
          id: true,
          nome: true,
          contaId: true,
        },
        orderBy: {
          nome: 'asc'
        }
      });
      
      const listaFinal = usuariosDoBanco.map(usuarioDb => {
        const statusInfoMemoria = this.statusUsuarios.get(usuarioDb.id);
        const statusAtual = statusInfoMemoria?.status || 'offline';
        const ultimaAtividade = statusInfoMemoria?.ultimaAtividade || null;

        return {
          usuarioId: usuarioDb.id,
          nome: usuarioDb.nome,
          contaId: usuarioDb.contaId,
          status: statusAtual,
          ultimaAtividade: ultimaAtividade,
          paginaAtual: null 
        };
      });
      
      return listaFinal;

    } catch (error) {
      console.error("[listarTodosComInfo] Erro ao buscar usuários no banco:", error);
      return [];
    }
  }

  async configurarHorarios(usuarioId, horarios) {
    if (!usuarioId || !horarios) {
      console.error('[configurarHorarios] ID do usuário ou horários inválidos.');
      return;
    }

    this.configuracoesHorario.set(usuarioId, horarios);
    console.log(`[configurarHorarios] Configuração em memória atualizada para ${usuarioId}:`, horarios);

    try {
      await prisma.usuario.update({
        where: { id: usuarioId },
        data: { configuracaoHorarios: horarios } 
      });
      console.log(`[configurarHorarios] Configuração de ${usuarioId} persistida no DB.`);
    } catch (error) {
      console.error(`[configurarHorarios] FALHA ao persistir config de ${usuarioId} no DB:`, error);
    }

    // NOVO: Verifica e aplica status automático IMEDIATAMENTE
    const dadosStatus = this.statusUsuarios.get(usuarioId);
    const statusAtual = dadosStatus?.status || 'offline';
    
    console.log(`[configurarHorarios] Verificando status automático para ${usuarioId} (status atual: ${statusAtual})`);
    
    // Força a verificação mesmo que o usuário não esteja em um status automático
    const statusAutomatico = await this.verificarStatusAutomatico(usuarioId, horarios, statusAtual);
    
    if (statusAutomatico) {
      console.log(`[configurarHorarios] ✅ Status automático aplicado: ${statusAutomatico}`);
    } else {
      console.log(`[configurarHorarios] ℹ️ Nenhum status automático se aplica no momento.`);
    }

    return this.configuracoesHorario.get(usuarioId);
  }

  async removerConfiguracao(usuarioId) {
    this.configuracoesHorario.delete(usuarioId);
    try {
      await prisma.usuario.update({
        where: { id: usuarioId },
        data: { configuracaoHorarios: null }
      });
      console.log(`[removerConfiguracao] Configuração de ${usuarioId} removida do DB.`);
    } catch (error) {
      console.error(`[removerConfiguracao] FALHA ao remover config de ${usuarioId} do DB:`, error);
    }
    console.log(`Configuração removida para ${usuarioId}`);
    await this.setStatus(usuarioId, 'disponivel', null);
  }

  async limparStatus(usuarioId) {
    this.statusUsuarios.delete(usuarioId);
    this.configuracoesHorario.delete(usuarioId); 
    await this.logarMudancaStatus(usuarioId, 'offline');
    console.log(`Status e configuração limpos para ${usuarioId} (logout)`);
  }

  // MODIFICADO: Retorna apenas mudanças que ainda não foram notificadas
  async buscarMudancasRecentes() {
    const agora = Date.now();
    const tempoLimite = agora - this.INTERVALO_BUSCA_RECENTES_SEGUNDOS * 1000;
    
    const recentes = this.historicoMudancasRecentes.filter(evento => {
      const ehRecente = evento.horario.getTime() >= tempoLimite;
      return ehRecente; // REMOVIDO o filtro de "já notificado" aqui
    });

    console.log(`[buscarMudancasRecentes] Encontrados ${recentes.length} eventos no histórico recente (últimos ${this.INTERVALO_BUSCA_RECENTES_SEGUNDOS}s).`);
    
    // Retorna TODAS as mudanças recentes, o frontend decide quais mostrar
    return recentes;
  }

  // NOVO: Método para marcar notificação como enviada
  marcarNotificacaoEnviada(usuarioId, status) {
    const chave = `${usuarioId}-${status}`;
    this.notificacoesEnviadas.set(chave, Date.now());
    console.log(`[Notificação] Marcada como enviada: ${chave}`);
  }
}

module.exports = new ServicoStatus();