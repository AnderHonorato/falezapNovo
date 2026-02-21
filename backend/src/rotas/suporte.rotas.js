// Z:\Programação\Backup\MultiWhatsapp\falezap-sistema\backend\src\rotas\suporte.rotas.js

const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { verificarToken } = require('../middleware/autenticacao.middleware');

const autenticar = verificarToken;

// ===== LISTAR SOLICITAÇÕES =====
router.get('/solicitacoes', autenticar, async (req, res) => {
  try {
    const { status } = req.query;
    const where = {};
    
    // Se não for OWNER/SUPORTE, mostrar apenas as próprias
    if (!['OWNER', 'SUPORTE'].includes(req.usuario.tipo)) {
      where.solicitanteId = req.usuario.id;
    }
    
    if (status && status !== 'TODOS') {
      where.status = status;
    }

    const solicitacoes = await prisma.solicitacaoAjudaChatInterno.findMany({
      where,
      include: {
        solicitante: {
          select: {
            id: true,
            nome: true,
            email: true,
            nickname: true,
            foto_perfil: true,
            avatar: true,
            tipo: true
          }
        },
        atendidoPor: {
          select: {
            id: true,
            nome: true,
            foto_perfil: true,
            avatar: true
          }
        }
      },
      orderBy: [
        { status: 'asc' },
        { criadaEm: 'desc' }
      ]
    });

    res.json({ solicitacoes });
  } catch (error) {
    console.error('[SUPORTE] Erro ao listar solicitações:', error);
    res.status(500).json({ erro: 'Erro ao carregar solicitações.' });
  }
});

// ===== MINHAS SOLICITAÇÕES =====
router.get('/minhas-solicitacoes', autenticar, async (req, res) => {
  try {
    const solicitacoes = await prisma.solicitacaoAjudaChatInterno.findMany({
      where: {
        solicitanteId: req.usuario.id
      },
      include: {
        solicitante: {
          select: {
            id: true,
            nome: true,
            email: true,
            nickname: true,
            foto_perfil: true,
            avatar: true,
            tipo: true
          }
        },
        atendidoPor: {
          select: {
            id: true,
            nome: true,
            foto_perfil: true,
            avatar: true
          }
        }
      },
      orderBy: [
        { status: 'asc' },
        { criadaEm: 'desc' }
      ]
    });

    res.json({ solicitacoes });
  } catch (error) {
    console.error('[SUPORTE] Erro ao listar minhas solicitações:', error);
    res.status(500).json({ erro: 'Erro ao carregar solicitações.' });
  }
});

// ===== ATENDER SOLICITAÇÃO =====
router.post('/solicitacoes/:id/atender', autenticar, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verificar permissão
    if (!['OWNER', 'SUPORTE'].includes(req.usuario.tipo)) {
      return res.status(403).json({ erro: 'Sem permissão para atender.' });
    }

    const solicitacao = await prisma.solicitacaoAjudaChatInterno.findUnique({
      where: { id },
      include: {
        solicitante: {
          select: {
            id: true,
            nome: true,
            email: true,
            nickname: true,
            foto_perfil: true,
            avatar: true
          }
        }
      }
    });

    if (!solicitacao) {
      return res.status(404).json({ erro: 'Solicitação não encontrada.' });
    }

    if (solicitacao.status !== 'PENDENTE') {
      return res.status(400).json({ erro: 'Esta solicitação já foi atendida.' });
    }

    // Atualizar status
    const atualizada = await prisma.solicitacaoAjudaChatInterno.update({
      where: { id },
      data: {
        status: 'EM_ATENDIMENTO',
        atendidoPorId: req.usuario.id,
        atendidaEm: new Date()
      },
      include: {
        solicitante: {
          select: {
            id: true,
            nome: true,
            email: true,
            nickname: true,
            foto_perfil: true,
            avatar: true
          }
        },
        atendidoPor: {
          select: {
            id: true,
            nome: true,
            foto_perfil: true,
            avatar: true
          }
        }
      }
    });

    // ✅ CRIAR MENSAGEM DE SISTEMA
    const mensagemSistema = await prisma.mensagemSuporte.create({
      data: {
        solicitacaoId: id,
        remetenteId: req.usuario.id,
        tipo: 'sistema',
        conteudo: `🟢 **${req.usuario.nome}** entrou na conversa e iniciou o atendimento.`
      },
      include: {
        remetente: {
          select: {
            id: true,
            nome: true,
            foto_perfil: true,
            avatar: true,
            tipo: true
          }
        }
      }
    });

    // Emitir eventos via Socket.IO
    const io = global.io;
    if (io) {
      // Notificar o solicitante
      io.to(`user:${solicitacao.solicitanteId}`).emit('atendimento_iniciado', {
        solicitacao: atualizada,
        atendente: req.usuario
      });

      // Enviar mensagem de sistema
      io.to(`user:${solicitacao.solicitanteId}`).emit('nova_mensagem_suporte', {
        mensagem: mensagemSistema,
        solicitacaoId: id
      });

      console.log('[SUPORTE] ✅ Eventos emitidos para:', solicitacao.solicitanteId);
    }

    res.json({ 
      sucesso: true, 
      solicitacao: atualizada,
      mensagemSistema
    });
  } catch (error) {
    console.error('[SUPORTE] Erro ao atender solicitação:', error);
    res.status(500).json({ erro: 'Erro ao iniciar atendimento.' });
  }
});

// ===== ENCERRAR ATENDIMENTO =====
router.post('/solicitacoes/:id/encerrar', autenticar, async (req, res) => {
  try {
    const { id } = req.params;
    const { observacao } = req.body;
    
    // Verificar permissão
    if (!['OWNER', 'SUPORTE'].includes(req.usuario.tipo)) {
      return res.status(403).json({ erro: 'Sem permissão para encerrar.' });
    }

    const solicitacao = await prisma.solicitacaoAjudaChatInterno.findUnique({
      where: { id },
      include: {
        solicitante: {
          select: {
            id: true,
            nome: true
          }
        }
      }
    });

    if (!solicitacao) {
      return res.status(404).json({ erro: 'Solicitação não encontrada.' });
    }

    if (solicitacao.status === 'ENCERRADO') {
      return res.status(400).json({ erro: 'Solicitação já está encerrada.' });
    }

    // Encerrar
    const atualizada = await prisma.solicitacaoAjudaChatInterno.update({
      where: { id },
      data: {
        status: 'ENCERRADO',
        encerradaEm: new Date(),
        observacao: observacao || null
      },
      include: {
        solicitante: {
          select: {
            id: true,
            nome: true,
            email: true,
            foto_perfil: true,
            avatar: true
          }
        },
        atendidoPor: {
          select: {
            id: true,
            nome: true,
            foto_perfil: true,
            avatar: true
          }
        }
      }
    });

    // ✅ CRIAR MENSAGEM DE SISTEMA
    const mensagemSistema = await prisma.mensagemSuporte.create({
      data: {
        solicitacaoId: id,
        remetenteId: req.usuario.id,
        tipo: 'sistema',
        conteudo: `🔒 **A conversa foi finalizada.** Não é mais possível enviar mensagens.\n\nObrigado por entrar em contato!`
      },
      include: {
        remetente: {
          select: {
            id: true,
            nome: true,
            foto_perfil: true,
            avatar: true,
            tipo: true
          }
        }
      }
    });

    // Emitir eventos
    const io = global.io;
    if (io) {
      // Notificar solicitante
      io.to(`user:${solicitacao.solicitanteId}`).emit('solicitacao_encerrada', {
        solicitacaoId: id
      });

      // Enviar mensagem de sistema
      io.to(`user:${solicitacao.solicitanteId}`).emit('nova_mensagem_suporte', {
        mensagem: mensagemSistema,
        solicitacaoId: id
      });

      // Solicitar avaliação após 2 segundos
      setTimeout(() => {
        io.to(`user:${solicitacao.solicitanteId}`).emit('solicitar_avaliacao_atendimento', {
          solicitacaoId: id,
          protocolo: solicitacao.protocolo
        });
      }, 2000);

      console.log('[SUPORTE] ✅ Eventos de encerramento emitidos');
    }

    res.json({ 
      sucesso: true, 
      solicitacao: atualizada,
      mensagemSistema
    });
  } catch (error) {
    console.error('[SUPORTE] Erro ao encerrar solicitação:', error);
    res.status(500).json({ erro: 'Erro ao encerrar atendimento.' });
  }
});

// ===== AVALIAR ATENDIMENTO =====
router.post('/solicitacoes/:id/avaliar', autenticar, async (req, res) => {
  try {
    const { id } = req.params;
    const { avaliacao, comentario } = req.body;

    if (!avaliacao || avaliacao < 1 || avaliacao > 5) {
      return res.status(400).json({ erro: 'Avaliação deve ser entre 1 e 5.' });
    }

    const solicitacao = await prisma.solicitacaoAjudaChatInterno.findUnique({
      where: { id }
    });

    if (!solicitacao) {
      return res.status(404).json({ erro: 'Solicitação não encontrada.' });
    }

    if (solicitacao.solicitanteId !== req.usuario.id) {
      return res.status(403).json({ erro: 'Você não pode avaliar esta solicitação.' });
    }

    if (solicitacao.avaliacao) {
      return res.status(400).json({ erro: 'Esta solicitação já foi avaliada.' });
    }

    // Atualizar avaliação
    const atualizada = await prisma.solicitacaoAjudaChatInterno.update({
      where: { id },
      data: {
        avaliacao: parseInt(avaliacao),
        comentarioAvaliacao: comentario || null
      }
    });

    res.json({ 
      sucesso: true, 
      solicitacao: atualizada 
    });
  } catch (error) {
    console.error('[SUPORTE] Erro ao avaliar:', error);
    res.status(500).json({ erro: 'Erro ao salvar avaliação.' });
  }
});

// ===== CONTAR NOTIFICAÇÕES =====
router.get('/notificacoes/contar', autenticar, async (req, res) => {
  try {
    let count = 0;

    if (['OWNER', 'SUPORTE'].includes(req.usuario.tipo)) {
      // OWNER/SUPORTE: contar solicitações pendentes
      count = await prisma.solicitacaoAjudaChatInterno.count({
        where: {
          status: 'PENDENTE'
        }
      });
    } else {
      // Usuários comuns: contar solicitações não visualizadas
      count = await prisma.solicitacaoAjudaChatInterno.count({
        where: {
          solicitanteId: req.usuario.id,
          status: 'EM_ATENDIMENTO'
          // Aqui você pode adicionar lógica de mensagens não lidas
        }
      });
    }

    res.json({ count });
  } catch (error) {
    console.error('[SUPORTE] Erro ao contar notificações:', error);
    res.json({ count: 0 });
  }
});

module.exports = router;