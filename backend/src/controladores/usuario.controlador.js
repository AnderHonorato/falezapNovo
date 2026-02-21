const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');

// Tenta importar o serviço de status, se falhar cria um mock para não quebrar
let servicoStatus = { setStatus: () => {}, getStatus: () => ({ status: 'offline' }) };
try {
    servicoStatus = require('../servicos/status.servico');
} catch (e) {
    console.warn("Aviso: servicoStatus não encontrado em usuario.controlador");
}

const prisma = new PrismaClient();
const AVATARS_UPLOADS_DIR = path.join(__dirname, '../../uploads/avatars'); 

// Garante que a pasta de uploads existe
if (!fs.existsSync(AVATARS_UPLOADS_DIR)) {
  fs.mkdirSync(AVATARS_UPLOADS_DIR, { recursive: true });
}

// FUNÇÃO AUXILIAR: Deleta arquivo do disco
const deletarArquivoAvatar = (filename) => {
    if (!filename) return;
    const filePath = path.join(AVATARS_UPLOADS_DIR, filename);
    if (fs.existsSync(filePath)) {
        try {
            fs.unlinkSync(filePath);
        } catch (err) {
            console.error(`Falha ao deletar arquivo: ${filePath}`, err);
        }
    }
};

// ============================================================
// ✅ LISTA MESTRA DE CAMPOS (ATUALIZADA)
// ============================================================
const SELECT_USUARIO_COMPLETO = {
  id: true, nome: true, email: true, nickname: true, cpf: true,
  telefone: true, tipo: true, status: true, avatar: true, foto_perfil: true,
  recado: true, dispositivo: true, contaId: true, paginaAtual: true,
  ultimoAcesso: true, criadoEm: true, inativadoEm: true,
  
  // Permissões de Acesso a Páginas
  podeAcessarDashboard: true,
  podeAcessarMensagens: true,
  podeAcessarWhatsApp: true,
  podeAcessarEmpresasUsuarios: true,
  podeAcessarBlog: true,
  podeAcessarAnalytics: true,
  podeAcessarEquipe: true,
  podeAcessarSuporte: true,
  podeAcessarChatInterno: true,
  
  // Funcionalidades Específicas
  podeEnviarMsg: true,
  podeReceberMsg: true,
  podeGerenciarConexoes: true,
  podeGerenciarBot: true,
  podeVerRelatorios: true,
  podeBaixarRelatorios: true, 
  podeGerenciarEquipe: true,
  podeGerenciarUsuarios: true,
  podeVerSolicitacoesAjuda: true,
  podeVerAlertas: true,
  podeCriarPost: true,
  podeModerarBlog: true,
  podeGerenciarEmpresas: true,
  
  // ✅ Permissões Granulares Dashboard
  podeVerCardMensagensDia: true, 
  podeVerCardAnalyticsResumo: true, 
  podeVerCardUsuariosOnline: true,
  podeVerCardTMR: true, 
  podeVerGraficos: true, 
  podeVerFunil: true, 
  podeVerHeatmap: true, 
  podeVerCardConexoes: true,

  // ✅ Permissões Granulares Analytics
  podeVerResumoKpis: true, 
  podeVerGraficosAvancados: true, 
  podeVerRankingEquipe: true, 
  podeUsarIAAnalytics: true,

  // Relacionamentos
  conta: { select: { id: true, nomeFantasia: true, razaoSocial: true, nomeCompleto: true } },
  categoria: { select: { id: true, nome: true } }
};

// LISTA DE TODAS AS PERMISSÕES (Para validação de delegação)
const TODAS_PERMISSOES = [
  'podeAcessarDashboard', 'podeAcessarMensagens', 'podeAcessarWhatsApp',
  'podeAcessarEmpresasUsuarios', 'podeAcessarBlog', 'podeAcessarAnalytics',
  'podeAcessarEquipe', 'podeAcessarSuporte', 'podeAcessarChatInterno',
  'podeEnviarMsg', 'podeReceberMsg', 'podeGerenciarConexoes',
  'podeGerenciarBot', 'podeVerRelatorios', 'podeBaixarRelatorios',
  'podeGerenciarEquipe', 'podeGerenciarUsuarios', 'podeVerSolicitacoesAjuda',
  'podeVerAlertas', 'podeCriarPost', 'podeModerarBlog', 'podeGerenciarEmpresas',
  'podeVerCardMensagensDia', 'podeVerCardAnalyticsResumo', 'podeVerCardUsuariosOnline',
  'podeVerCardTMR', 'podeVerGraficos', 'podeVerFunil', 'podeVerHeatmap', 'podeVerCardConexoes',
  'podeVerResumoKpis', 'podeVerGraficosAvancados', 'podeVerRankingEquipe', 'podeUsarIAAnalytics'
];

/**
 * 🛡️ FUNÇÃO DE SEGURANÇA: Valida se o usuário logado pode conceder as permissões solicitadas.
 */
const validarDelegacaoPermissoes = (usuarioLogado, body) => {
  if (usuarioLogado.tipo === 'OWNER') return null; // Owner pode tudo

  for (const perm of TODAS_PERMISSOES) {
    // Se o usuário está tentando ativar uma permissão (true)
    if (body[perm] === true) {
      // Verifica se ele mesmo tem essa permissão
      if (!usuarioLogado[perm]) {
        return `Você não possui a permissão '${perm}' e portanto não pode concedê-la a outros usuários.`;
      }
    }
  }
  return null;
};

// ============================================================
// FUNÇÕES DO CONTROLADOR
// ============================================================

// ✅ LISTAR USUÁRIOS
const listarUsuarios = async (req, res) => {
  try {
    const { id: usuarioLogadoId, tipo, contaId } = req.usuario;

    let filtro = { status: { not: 'PENDENTE' } };

    if (tipo !== 'OWNER') {
      filtro.contaId = contaId;
    }

    const usuarios = await prisma.usuario.findMany({
      where: filtro,
      select: SELECT_USUARIO_COMPLETO,
      orderBy: [
          { status: 'asc' },
          { nome: 'asc' },
      ],
    });

    res.json({ usuarios, total: usuarios.length });
  } catch (erro) {
    console.error('Erro ao listar usuários:', erro);
    res.status(500).json({ erro: 'Erro ao listar usuários.' });
  }
};

// ✅ LISTAR MEMBROS DA EQUIPE (Para selects)
const listarMembrosDaEquipe = async (req, res) => {
    try {
        const { id: usuarioLogadoId, contaId } = req.usuario;

        if (!contaId) {
            return res.status(403).json({ erro: 'Usuário não vinculado a uma conta.' });
        }

        const membros = await prisma.usuario.findMany({
            where: {
                contaId: contaId,
                status: 'ATIVO', 
                id: { not: usuarioLogadoId }
            },
            select: {
                id: true, nome: true, email: true, nickname: true, cpf: true,
                telefone: true, tipo: true, status: true, avatar: true, foto_perfil: true,
                recado: true,
                contaId: true,
                categoria: { select: { id: true, nome: true } } 
            },
            orderBy: { nome: 'asc' },
        });

        res.json({ membros, total: membros.length });

    } catch (erro) {
        console.error('Erro ao listar membros da equipe:', erro);
        res.status(500).json({ erro: 'Erro ao listar membros da equipe.' });
    }
};

// ✅ LISTAR EQUIPE ONLINE (Com status e contagem de chats)
const listarEquipeOnline = async (req, res) => {
    try {
        const { contaId } = req.usuario;

        if (!contaId) {
            return res.status(403).json({ erro: 'Usuário não vinculado a uma conta.' });
        }

        const usuarios = await prisma.usuario.findMany({
            where: { contaId: contaId, status: 'ATIVO' },
            select: {
                id: true, nome: true, email: true, avatar: true, foto_perfil: true,
                tipo: true, cargo: true, recado: true, dispositivo: true,
                contaId: true, paginaAtual: true, ultimoAcesso: true, atualizadoEm: true,
                _count: { select: { conversasResponsavel: { where: { statusConversa: { notIn: ['FINALIZADA', 'ARQUIVADA'] } } } } }
            },
            orderBy: { nome: 'asc' }
        });

        const usuariosComStatus = await Promise.all(
            usuarios.map(async (usuario) => {
                let statusInfo = { status: 'offline' };
                try { statusInfo = await servicoStatus.getStatus(usuario.id); } catch (e) {}

                const isOffline = !statusInfo.status || statusInfo.status === 'offline';
                const dataRef = isOffline ? (usuario.ultimoAcesso || usuario.atualizadoEm) : (statusInfo.dataInicio || usuario.ultimoAcesso);

                return {
                    usuarioId: usuario.id, nome: usuario.nome, email: usuario.email,
                    foto_perfil: usuario.avatar || usuario.foto_perfil,
                    tipo: usuario.tipo, cargo: usuario.cargo, recado: usuario.recado,
                    dispositivo: usuario.dispositivo, contaId: usuario.contaId,
                    status: statusInfo.status || 'offline', paginaAtual: usuario.paginaAtual,
                    dataRef: dataRef, chatsAtivos: usuario._count.conversasResponsavel 
                };
            })
        );

        res.json({ sucesso: true, usuarios: usuariosComStatus, total: usuariosComStatus.length });

    } catch (erro) {
        console.error('❌ [listarEquipeOnline] Erro:', erro);
        res.status(500).json({ erro: 'Erro ao listar equipe online.' });
    }
};

// ✅ LISTAR USUÁRIOS PENDENTES
const listarUsuariosPendentes = async (req, res) => {
  if (req.usuario.tipo !== 'OWNER' && req.usuario.tipo !== 'CEO') {
    return res.status(403).json({ erro: 'Acesso negado.' });
  }
  
  try {
    const usuariosPendentes = await prisma.usuario.findMany({
      where: { status: 'PENDENTE' },
      include: { conta: true },
      orderBy: { criadoEm: 'asc' }
    });
    
    res.json({ usuarios: usuariosPendentes, total: usuariosPendentes.length });
  } catch (erro) {
    console.error('Erro ao listar pendentes:', erro);
    res.status(500).json({ erro: 'Erro ao listar usuários pendentes.' });
  }
};

// ✅ CRIAR USUÁRIO
const criarUsuario = async (req, res) => {
  try {
    const usuarioLogado = req.usuario;
    const body = req.body;

    // 1. Validações básicas
    if (!body.nome || !body.senha) return res.status(400).json({ erro: 'Nome e senha são obrigatórios.' });
    if (body.senha.length < 6) return res.status(400).json({ erro: 'Senha mínima 6 caracteres.' });

    // 2. Validação Hierárquica de Tipo
    const tipoFinal = body.tipo || 'COLABORADOR';
    if ((tipoFinal === 'OWNER' || tipoFinal === 'CEO' || tipoFinal === 'ADMIN_EMPRESA' || tipoFinal === 'SUPORTE') && usuarioLogado.tipo !== 'OWNER') {
      return res.status(403).json({ erro: 'Apenas OWNER pode criar este tipo de usuário.' });
    }

    // 3. 🛡️ Validação de Delegação de Permissões
    const erroPermissao = validarDelegacaoPermissoes(usuarioLogado, body);
    if (erroPermissao) {
      return res.status(403).json({ erro: erroPermissao });
    }

    // 4. Validação Email/Nickname/CPF
    if (tipoFinal === 'COLABORADOR' || tipoFinal === 'ADMIN') {
      if (!body.nickname || !body.cpf) return res.status(400).json({ erro: 'Nickname e CPF obrigatórios.' });
      if (/\s/.test(body.nickname)) return res.status(400).json({ erro: 'Nickname sem espaços.' });
      const [nExist, cExist] = await Promise.all([
        prisma.usuario.findUnique({ where: { nickname: body.nickname } }),
        prisma.usuario.findUnique({ where: { cpf: body.cpf } })
      ]);
      if (nExist || cExist) return res.status(400).json({ erro: 'Nickname ou CPF em uso.' });
    } else {
      if (!body.email) return res.status(400).json({ erro: 'Email obrigatório.' });
      const eExist = await prisma.usuario.findUnique({ where: { email: body.email } });
      if (eExist) return res.status(400).json({ erro: 'Email em uso.' });
    }

    // 5. Conta e Categoria
    const contaFinalId = (usuarioLogado.tipo === 'OWNER' && body.contaId) ? body.contaId : usuarioLogado.contaId;
    if (!contaFinalId) return res.status(400).json({ erro: 'Conta não definida.' });

    let categoriaFinalId = body.categoriaId;
    if (!categoriaFinalId) {
        const catDefault = await prisma.categoria.findFirst({ where: { nome: 'Geral', contaId: contaFinalId } });
        if (catDefault) categoriaFinalId = catDefault.id;
        else {
            try { const novaCat = await prisma.categoria.create({ data: { nome: 'Geral', contaId: contaFinalId } }); categoriaFinalId = novaCat.id; }
            catch(e) { categoriaFinalId = null; }
        }
    }

    const senhaHash = await bcrypt.hash(body.senha, 10);

    // 6. Preparar dados
    const dadosCriacao = {
      nome: body.nome, email: body.email || null, nickname: body.nickname || null, senha: senhaHash,
      cpf: body.cpf || null, telefone: body.telefone, recado: body.recado || null, dispositivo: body.dispositivo || null,
      tipo: tipoFinal, status: 'ATIVO', contaId: contaFinalId, setorId: body.setorId || null,
      categoriaId: categoriaFinalId
    };

    // Aplica permissões validadas (se presente no body)
    TODAS_PERMISSOES.forEach(perm => {
      if (body[perm] !== undefined) dadosCriacao[perm] = !!body[perm];
    });
    
    const novoUsuario = await prisma.usuario.create({
      data: dadosCriacao,
      select: SELECT_USUARIO_COMPLETO
    });

    res.status(201).json({ mensagem: 'Usuário criado!', usuario: novoUsuario });
  } catch (erro) {
    console.error('Erro criarUsuario:', erro);
    res.status(500).json({ erro: 'Erro ao criar usuário.', detalhes: erro.message });
  }
};

// ✅ ATUALIZAR USUÁRIO
const atualizarUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    const usuarioLogado = req.usuario;
    const body = req.body;

    const usuario = await prisma.usuario.findUnique({ where: { id } });
    if (!usuario) return res.status(404).json({ erro: 'Usuário não encontrado.' });

    // 1. Segurança Hierárquica
    if (usuarioLogado.tipo !== 'OWNER' && usuario.contaId !== usuarioLogado.contaId) return res.status(403).json({ erro: 'Sem permissão.' });
    if (usuario.tipo === 'OWNER' && usuario.id !== usuarioLogado.id) return res.status(403).json({ erro: 'Apenas OWNER se edita.' });

    // 2. 🛡️ Validação de Delegação
    const erroPermissao = validarDelegacaoPermissoes(usuarioLogado, body);
    if (erroPermissao) {
      return res.status(403).json({ erro: erroPermissao });
    }

    const dadosAtualizacao = {};
    if (body.nome) dadosAtualizacao.nome = body.nome.trim();
    if (body.telefone !== undefined) dadosAtualizacao.telefone = body.telefone;
    if (body.recado !== undefined) dadosAtualizacao.recado = body.recado;
    if (body.dispositivo !== undefined) dadosAtualizacao.dispositivo = body.dispositivo;
    if (body.setorId !== undefined) dadosAtualizacao.setorId = body.setorId || null;
    if (body.categoriaId !== undefined) dadosAtualizacao.categoriaId = body.categoriaId || null;

    if (body.email && body.email !== usuario.email) {
        const check = await prisma.usuario.findFirst({ where: { email: body.email, id: { not: id } } });
        if (check) return res.status(400).json({ erro: 'Email em uso.' });
        dadosAtualizacao.email = body.email;
    }
    if (body.senha) dadosAtualizacao.senha = await bcrypt.hash(body.senha, 10);

    if (body.status && body.status !== usuario.status) {
       if (id === usuarioLogado.id && body.status === 'INATIVO') {
         return res.status(400).json({ erro: 'Não pode inativar a própria conta.' });
       }
       dadosAtualizacao.status = body.status;
       dadosAtualizacao.inativadoEm = body.status === 'INATIVO' ? new Date() : null;
    }

    // 3. Atualização de Permissões
    // Se o usuário logado tem permissão de gerenciar, ele pode atualizar as permissões do alvo
    if (['OWNER', 'CEO', 'ADMIN_EMPRESA', 'ADMIN'].includes(usuarioLogado.tipo) || usuarioLogado.podeGerenciarUsuarios) {
      TODAS_PERMISSOES.forEach(perm => {
        if (body[perm] !== undefined) dadosAtualizacao[perm] = !!body[perm];
      });
    }

    const usuarioAtualizado = await prisma.usuario.update({
      where: { id },
      data: dadosAtualizacao,
      select: SELECT_USUARIO_COMPLETO
    });

    // Socket IO: Emite evento
    try {
      const io = req.app.get('io');
      if (io) io.to(`user:${id}`).emit('permissoes_atualizadas', { usuario: usuarioAtualizado });
    } catch (e) {}

    res.json({ mensagem: 'Usuário atualizado!', usuario: usuarioAtualizado });
  } catch (erro) {
    console.error('Erro atualizarUsuario:', erro);
    res.status(500).json({ erro: 'Erro ao atualizar.' });
  }
};

// ✅ ALTERAR STATUS
const alterarStatusUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const usuarioLogado = req.usuario;

    if (status !== 'ATIVO' && status !== 'INATIVO') return res.status(400).json({ erro: 'Status inválido.' });

    const usuario = await prisma.usuario.findUnique({ where: { id } });
    if (!usuario) return res.status(404).json({ erro: 'Usuário não encontrado.' });

    if (usuarioLogado.tipo !== 'OWNER' && usuario.contaId !== usuarioLogado.contaId) return res.status(403).json({ erro: 'Sem permissão.' });
    if (usuario.tipo === 'OWNER') return res.status(403).json({ erro: 'OWNER não pode ser inativado.' });
    if (id === usuarioLogado.id) return res.status(400).json({ erro: 'Não pode inativar a própria conta.' });

    const dadosAtualizacao = { status: status, inativadoEm: status === 'INATIVO' ? new Date() : null };

    const usuarioAtualizado = await prisma.usuario.update({
      where: { id }, data: dadosAtualizacao,
      select: { id: true, status: true, inativadoEm: true }
    });

    res.json({ mensagem: `Usuário ${status.toLowerCase()} com sucesso!`, usuario: usuarioAtualizado });
  } catch (erro) {
    console.error('Erro ao alterar status:', erro);
    res.status(500).json({ erro: 'Erro ao alterar status.' });
  }
};

// ✅ APROVAR/REPROVAR USUÁRIO PENDENTE
const aprovarReprovarUsuario = async (req, res) => {
    const { id } = req.params;
    const { acao } = req.body;
    const usuarioLogado = req.usuario;

    if (usuarioLogado.tipo !== 'OWNER' && usuarioLogado.tipo !== 'CEO') return res.status(403).json({ erro: 'Apenas OWNER ou CEO pode aprovar.' });
    if (acao !== 'aprovar' && acao !== 'reprovar') return res.status(400).json({ erro: 'Ação inválida.' });

    try {
        const usuarioPendente = await prisma.usuario.findUnique({ where: { id: id, status: 'PENDENTE' }, include: { conta: true }});
        if (!usuarioPendente) return res.status(404).json({ erro: 'Usuário pendente não encontrado.' });

        if (acao === 'aprovar') {
            await prisma.usuario.update({ where: { id: id }, data: { status: 'ATIVO' } });
            return res.status(200).json({ mensagem: 'Usuário aprovado!' });
        } else {
            await prisma.$transaction(async (tx) => {
                await tx.usuario.delete({ where: { id: id } });
                if (usuarioPendente.contaId) {
                    const outrosUsuariosNaConta = await tx.usuario.count({ where: { contaId: usuarioPendente.contaId, id: { not: id } } });
                    if (outrosUsuariosNaConta === 0) {
                        await tx.conta.delete({ where: { id: usuarioPendente.contaId } });
                    }
                }
            });
            return res.status(200).json({ mensagem: 'Usuário reprovado e removido.' });
        }
    } catch (error) {
        console.error(`Erro ao ${acao} usuário ${id}:`, error);
        res.status(500).json({ erro: `Erro interno ao ${acao} usuário.` });
    }
};

// ✅ DELETAR USUÁRIO
const deletarUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    const usuarioLogado = req.usuario;

    const usuario = await prisma.usuario.findUnique({ where: { id } });
    if (!usuario) return res.status(404).json({ erro: 'Usuário não encontrado.' });

    if (usuarioLogado.tipo !== 'OWNER' && usuario.contaId !== usuarioLogado.contaId) return res.status(403).json({ erro: 'Sem permissão.' });
    if (usuario.tipo === 'OWNER') return res.status(403).json({ erro: 'Não pode deletar o OWNER.' });
    if (id === usuarioLogado.id) return res.status(400).json({ erro: 'Não pode deletar a própria conta.' });

    if (usuario.avatar) {
        deletarArquivoAvatar(usuario.avatar);
    }

    await prisma.usuario.delete({ where: { id } });
    res.status(204).send();
  } catch (erro) {
    console.error('Erro ao deletar usuário:', erro);
    if (erro.code === 'P2025') return res.status(404).json({ erro: 'Usuário não encontrado.' });
    if (erro.code === 'P2003') return res.status(409).json({ erro: 'Não é possível excluir. Existem registros vinculados.' });
    res.status(500).json({ erro: 'Erro ao deletar usuário.' });
  }
};

// ✅ OBTER PERFIL
const obterPerfil = async (req, res) => {
  try {
    const usuarioId = req.usuario.id;
    const usuario = await prisma.usuario.findUnique({
      where: { id: usuarioId },
      select: SELECT_USUARIO_COMPLETO
    });

    if (!usuario) return res.status(404).json({ erro: 'Usuário não encontrado.' });

    const usuarioResposta = {
      ...usuario,
      avatar: usuario.avatar || usuario.foto_perfil,
    };
    res.json(usuarioResposta);
  } catch (erro) {
    console.error('[obterPerfil] Erro:', erro);
    res.status(500).json({ erro: 'Erro ao buscar perfil.' });
  }
};

// ✅ ATUALIZAR PERFIL (PRÓPRIO)
const atualizarPerfil = async (req, res) => {
  try {
    const usuarioId = req.usuario.id;
    const { 
        nome, telefone, senhaAntiga, senhaNova, 
        removerAvatar, recado, dispositivo, privacidade 
    } = req.body;

    const usuarioAtual = await prisma.usuario.findUnique({
      where: { id: usuarioId },
      select: { id: true, senha: true, avatar: true, foto_perfil: true }
    });

    if (!usuarioAtual) return res.status(404).json({ erro: 'Usuário não encontrado.' });

    if (senhaNova) {
      if (!senhaAntiga) return res.status(400).json({ erro: 'Senha antiga obrigatória.' });
      const senhaValida = await bcrypt.compare(senhaAntiga, usuarioAtual.senha);
      if (!senhaValida) return res.status(400).json({ erro: 'Senha antiga incorreta.' });
      if (senhaNova.length < 6) return res.status(400).json({ erro: 'Nova senha muito curta.' });
    }

    let avatarFinal = usuarioAtual.avatar || usuarioAtual.foto_perfil;
    if (req.file) {
      if (avatarFinal) {
        const caminhoAntigo = path.join(__dirname, '../../uploads/avatars', avatarFinal);
        if (fs.existsSync(caminhoAntigo)) fs.unlinkSync(caminhoAntigo);
      }
      avatarFinal = req.file.filename;
    } else if (removerAvatar === 'true') {
      if (avatarFinal) {
        const caminhoAntigo = path.join(__dirname, '../../uploads/avatars', avatarFinal);
        if (fs.existsSync(caminhoAntigo)) fs.unlinkSync(caminhoAntigo);
      }
      avatarFinal = null;
    }

    const dadosAtualizacao = {
      nome: nome.trim(),
      telefone: telefone ? telefone.trim() : null,
      recado: recado !== undefined ? recado : undefined,
      dispositivo: dispositivo !== undefined ? dispositivo : undefined,
      avatar: avatarFinal,
      foto_perfil: avatarFinal,
    };

    if (privacidade) {
        try {
            const privObj = typeof privacidade === 'string' ? JSON.parse(privacidade) : privacidade;
            dadosAtualizacao.privacidade = privObj;
        } catch (e) {}
    }

    if (senhaNova) {
      dadosAtualizacao.senha = await bcrypt.hash(senhaNova, 10);
    }

    const usuarioAtualizado = await prisma.usuario.update({
      where: { id: usuarioId },
      data: dadosAtualizacao,
      select: SELECT_USUARIO_COMPLETO
    });

    const usuarioResposta = {
      ...usuarioAtualizado,
      avatar: usuarioAtualizado.avatar || usuarioAtualizado.foto_perfil,
    };

    res.json({
      sucesso: true,
      mensagem: 'Perfil atualizado com sucesso.',
      usuario: usuarioResposta
    });

  } catch (erro) {
    console.error('[atualizarPerfil] Erro:', erro);
    res.status(500).json({ erro: 'Erro ao atualizar perfil.' });
  }
};

// ✅ ATUALIZAR PÁGINA ATUAL
const atualizarPaginaAtualUsuario = async (req, res) => {
  const usuarioId = req.usuario?.id;
  const { paginaAtual } = req.body;
  if (!usuarioId) return res.status(401).json({ erro: 'Não autenticado.' });
  try {
    await prisma.usuario.update({
      where: { id: usuarioId },
      data: { paginaAtual: paginaAtual ? paginaAtual.substring(0, 100) : null, ultimoAcesso: new Date() }
    });
    res.status(200).json({ sucesso: true, mensagem: 'Página atualizada.' });
  } catch (error) {
    console.error(`Erro ao atualizar página:`, error);
    res.status(200).json({ sucesso: false, mensagem: 'Erro interno.' });
  }
};

module.exports = {
  listarUsuarios,
  listarMembrosDaEquipe,
  listarEquipeOnline,
  listarUsuariosPendentes,
  criarUsuario,
  atualizarUsuario,
  alterarStatusUsuario,
  aprovarReprovarUsuario,
  deletarUsuario,
  obterPerfil,
  atualizarPerfil,
  atualizarPaginaAtualUsuario
};