// backend/src/rotas/chatSuporte.rotas.js
const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// ✅ IMPORTAÇÕES CORRIGIDAS
const { verificarToken } = require('../middleware/autenticacao.middleware');

const autenticar = verificarToken;

// ===== LISTAR MENSAGENS DO SUPORTE =====
router.get('/mensagens/:solicitacaoId', autenticar, async (req, res) => {
  try {
    const { solicitacaoId } = req.params;
    const { id: usuarioId } = req.usuario;

    const solicitacao = await prisma.solicitacaoAjudaChatInterno.findUnique({
      where: { id: solicitacaoId },
      include: {
        solicitante: true,
        atendidoPor: true
      }
    });

    if (!solicitacao) {
      return res.status(404).json({ erro: 'Solicitação não encontrada.' });
    }

    // Verificar permissão
    const isOwnerOrSupport = ['OWNER', 'SUPORTE'].includes(req.usuario.tipo);
    const isSolicitante = solicitacao.solicitanteId === usuarioId;
    const isAtendente = solicitacao.atendidoPorId === usuarioId;

    if (!isOwnerOrSupport && !isSolicitante && !isAtendente) {
      return res.status(403).json({ erro: 'Você não tem permissão para ver estas mensagens.' });
    }

    const mensagens = await prisma.mensagemSuporte.findMany({
      where: { solicitacaoId: solicitacaoId },
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
      },
      orderBy: { criadaEm: 'asc' }
    });

    res.json({ sucesso: true, mensagens });
  } catch (error) {
    console.error('[CHAT SUPORTE] Erro ao listar mensagens:', error);
    res.status(500).json({ erro: 'Erro ao carregar mensagens.' });
  }
});

// ===== ENVIAR MENSAGEM DE SUPORTE (QUALQUER PARTE) =====
router.post('/mensagens/:solicitacaoId', autenticar, async (req, res) => {
  try {
    const { solicitacaoId } = req.params;
    const { conteudo, tipo, dados } = req.body;
    const { id: remetenteId } = req.usuario;

    const solicitacao = await prisma.solicitacaoAjudaChatInterno.findUnique({
      where: { id: solicitacaoId },
      include: {
        solicitante: { select: { id: true } },
        atendidoPor: { select: { id: true } }
      }
    });

    if (!solicitacao) {
      return res.status(404).json({ erro: 'Solicitação não encontrada.' });
    }

    // Verificar permissão
    const isOwnerOrSupport = ['OWNER', 'SUPORTE'].includes(req.usuario.tipo);
    const isSolicitante = solicitacao.solicitanteId === remetenteId;
    const isAtendente = solicitacao.atendidoPorId === remetenteId;

    if (!isOwnerOrSupport && !isSolicitante && !isAtendente) {
      return res.status(403).json({ erro: 'Você não pode enviar mensagens aqui.' });
    }
    
    if (solicitacao.status === 'ENCERRADO' && !isOwnerOrSupport) {
       return res.status(403).json({ erro: 'Este chamado está encerrado.' });
    }

    // Cria a mensagem
    const novaMensagem = await prisma.mensagemSuporte.create({
      data: {
        solicitacaoId,
        remetenteId,
        conteudo,
        tipo: tipo || 'texto',
        // ✅ Adiciona dados da avaliação se for do tipo 'avaliacao'
        avaliacao: (tipo === 'avaliacao' && dados?.avaliacao) ? parseInt(dados.avaliacao) : null,
        comentarioAvaliacao: (tipo === 'avaliacao' && dados?.comentario) ? dados.comentario : null,
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

    // Emite o evento via Socket.IO
    const io = req.app.get('io');
    if (io) {
      const mensagemComDados = {
        ...novaMensagem,
        protocolo: solicitacao.protocolo
      };

      // 1. Emitir para o SOLICITANTE (se não for ele quem enviou)
      if (remetenteId !== solicitacao.solicitanteId) {
        io.to(`user:${solicitacao.solicitanteId}`).emit('nova_mensagem_suporte', {
          mensagem: mensagemComDados,
          solicitacaoId
        });
        
        io.to(`user:${solicitacao.solicitanteId}`).emit('nova_mensagem', {
          mensagem: mensagemComDados,
          conversaInfo: {
            tipo: 'suporte',
            solicitacaoId,
            protocolo: solicitacao.protocolo
          }
        });
        
        console.log(`[CHAT SUPORTE] ✅ Mensagem emitida para solicitante: ${solicitacao.solicitanteId}`);
      }

      // 2. Emitir para o ATENDENTE (se existir e não for ele quem enviou)
      if (solicitacao.atendidoPorId && remetenteId !== solicitacao.atendidoPorId) {
        io.to(`user:${solicitacao.atendidoPorId}`).emit('nova_mensagem_suporte', {
          mensagem: mensagemComDados,
          solicitacaoId
        });
        
        io.to(`user:${solicitacao.atendidoPorId}`).emit('nova_mensagem', {
          mensagem: mensagemComDados,
          conversaInfo: {
            tipo: 'suporte',
            solicitacaoId,
            protocolo: solicitacao.protocolo
          }
        });
        
        console.log(`[CHAT SUPORTE] ✅ Mensagem emitida para atendente: ${solicitacao.atendidoPorId}`);
      }
    } else {
      console.error('[CHAT SUPORTE] ⚠️ Socket.IO não disponível!');
    }

    res.status(201).json({ sucesso: true, mensagem: novaMensagem });
  } catch (error) {
    console.error('[CHAT SUPORTE] ❌ Erro ao enviar mensagem:', error);
    res.status(500).json({ erro: 'Erro ao enviar mensagem.' });
  }
});

module.exports = router;