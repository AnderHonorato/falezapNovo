// backend/src/controladores/status.controlador.js

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Cache de status em memória
const statusCache = new Map();

// Função para atualizar status do usuário
const atualizarStatus = async (req, res) => {
  try {
    const { id: usuarioId } = req.usuario;
    const { status, paginaAtual } = req.body;

    if (!usuarioId) {
      return res.status(401).json({ erro: 'Não autenticado.' });
    }

    // Valida status
    const statusValidos = ['disponivel', 'ausente', 'almoco', 'fora_servico', 'offline'];
    if (status && !statusValidos.includes(status)) {
      return res.status(400).json({ erro: 'Status inválido.' });
    }

    // Prepara dados para atualização
    const dadosAtualizacao = {
      ultimoAcesso: new Date()
    };

    if (paginaAtual !== undefined) {
      dadosAtualizacao.paginaAtual = paginaAtual ? paginaAtual.substring(0, 100) : null;
    }

    // Atualiza no banco
    const usuarioAtualizado = await prisma.usuario.update({
      where: { id: usuarioId },
      data: dadosAtualizacao,
      select: {
        id: true,
        nome: true,
        email: true,
        avatar: true,
        foto_perfil: true,
        tipo: true,
        contaId: true,
        paginaAtual: true,
        ultimoAcesso: true
      }
    });

    // Atualiza cache de status
    const statusData = {
      usuarioId: usuarioId,
      nome: usuarioAtualizado.nome,
      email: usuarioAtualizado.email,
      foto_perfil: usuarioAtualizado.avatar || usuarioAtualizado.foto_perfil,
      tipo: usuarioAtualizado.tipo,
      contaId: usuarioAtualizado.contaId,
      status: status || 'disponivel',
      paginaAtual: usuarioAtualizado.paginaAtual,
      ultimoAcesso: usuarioAtualizado.ultimoAcesso,
      ultimaAtividade: new Date(),
      ultimaAlteracaoStatus: status ? new Date() : (statusCache.get(usuarioId)?.ultimaAlteracaoStatus || new Date())
    };

    statusCache.set(usuarioId, statusData);

    // Emite evento via Socket.IO
    try {
      const io = req.app.get('io');
      if (io) {
        // Emite para todos os usuários da mesma conta
        io.to(`conta:${usuarioAtualizado.contaId}`).emit('status_atualizado', statusData);
      }
    } catch (socketError) {
      console.error('Erro ao emitir evento de socket:', socketError);
    }

    res.json({ 
      sucesso: true, 
      mensagem: 'Status atualizado com sucesso.',
      status: statusData
    });

  } catch (erro) {
    console.error('Erro ao atualizar status:', erro);
    res.status(500).json({ erro: 'Erro ao atualizar status.' });
  }
};

// Função para obter equipe online
const obterEquipeOnline = async (req, res) => {
  try {
    const { contaId } = req.usuario;

    console.log('🔍 Buscando equipe online para conta:', contaId);

    if (!contaId) {
      return res.status(403).json({ erro: 'Usuário não vinculado a uma conta.' });
    }

    // Busca todos os usuários ATIVOS da conta
    const usuarios = await prisma.usuario.findMany({
      where: {
        contaId: contaId,
        status: 'ATIVO' // Status do cadastro, não de presença
      },
      select: {
        id: true,
        nome: true,
        email: true,
        avatar: true,
        foto_perfil: true,
        tipo: true,
        contaId: true,
        paginaAtual: true,
        ultimoAcesso: true,
        ultimaAtividade: true
      },
      orderBy: { nome: 'asc' }
    });

    console.log('📊 Total de usuários ATIVOS encontrados:', usuarios.length);

    // Combina dados do banco com cache de status
    const usuariosComStatus = usuarios.map(usuario => {
      const statusEmCache = statusCache.get(usuario.id);
      
      // Determina o status de presença
      let statusPresenca = 'offline';
      let ultimaAlteracaoStatus = null;
      
      if (statusEmCache) {
        // Verifica se o último acesso foi nos últimos 5 minutos
        const tempoDesdeUltimoAcesso = new Date() - new Date(statusEmCache.ultimaAtividade || statusEmCache.ultimoAcesso);
        const minutosInativos = tempoDesdeUltimoAcesso / 1000 / 60;
        
        if (minutosInativos <= 5) {
          statusPresenca = statusEmCache.status || 'disponivel';
          ultimaAlteracaoStatus = statusEmCache.ultimaAlteracaoStatus;
        }
      }

      return {
        usuarioId: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        foto_perfil: usuario.avatar || usuario.foto_perfil,
        tipo: usuario.tipo,
        contaId: usuario.contaId,
        status: statusPresenca, // Status de presença (online, offline, etc)
        paginaAtual: statusEmCache?.paginaAtual || usuario.paginaAtual,
        ultimoAcesso: usuario.ultimoAcesso,
        ultimaAtividade: statusEmCache?.ultimaAtividade || usuario.ultimoAcesso,
        ultimaAlteracaoStatus: ultimaAlteracaoStatus || statusEmCache?.ultimaAlteracaoStatus || usuario.ultimoAcesso
      };
    });

    console.log('✅ Usuários com status processados:', usuariosComStatus.length);
    console.log('📋 Status:', usuariosComStatus.map(u => ({ nome: u.nome, status: u.status })));

    res.json({ 
      sucesso: true,
      usuarios: usuariosComStatus,
      total: usuariosComStatus.length
    });

  } catch (erro) {
    console.error('❌ Erro ao obter equipe online:', erro);
    res.status(500).json({ erro: 'Erro ao obter equipe online.' });
  }
};

// Função para registrar atividade do usuário
const registrarAtividade = async (req, res) => {
  try {
    const { id: usuarioId, contaId } = req.usuario;

    if (!usuarioId) {
      return res.status(401).json({ erro: 'Não autenticado.' });
    }

    // Atualiza último acesso no banco
    await prisma.usuario.update({
      where: { id: usuarioId },
      data: { ultimoAcesso: new Date() }
    });

    // Atualiza cache
    const statusAtual = statusCache.get(usuarioId) || {};
    statusCache.set(usuarioId, {
      ...statusAtual,
      usuarioId: usuarioId,
      ultimaAtividade: new Date(),
      ultimoAcesso: new Date()
    });

    res.json({ sucesso: true });

  } catch (erro) {
    console.error('Erro ao registrar atividade:', erro);
    res.status(200).json({ sucesso: false }); // Retorna 200 para não bloquear o frontend
  }
};

// Função para limpar status inativos (executar periodicamente)
const limparStatusInativos = () => {
  const agora = new Date();
  const TEMPO_INATIVIDADE = 5 * 60 * 1000; // 5 minutos

  for (const [usuarioId, statusData] of statusCache.entries()) {
    const tempoInativo = agora - new Date(statusData.ultimaAtividade || statusData.ultimoAcesso);
    
    if (tempoInativo > TEMPO_INATIVIDADE) {
      // Marca como offline mas mantém no cache
      statusCache.set(usuarioId, {
        ...statusData,
        status: 'offline'
      });
    }
  }
};

// Executa limpeza a cada 2 minutos
setInterval(limparStatusInativos, 2 * 60 * 1000);

module.exports = {
  atualizarStatus,
  obterEquipeOnline,
  registrarAtividade
};