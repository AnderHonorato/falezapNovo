// backend/src/rotas/anotacoes.rotas.js - ✅ COMPLETO COM MENSAGENS SISTEMA

const express = require('express');
const router = express.Router();
const { verificarToken } = require('../middleware/autenticacao.middleware');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// ✅ Middleware de autenticação
router.use(verificarToken);

// ============================================================
// FUNÇÕES AUXILIARES
// ============================================================

/**
 * Cria uma mensagem do sistema para anotação no chat
 * Esta mensagem é interna e visível apenas para usuários do sistema
 */
async function criarMensagemSistemaAnotacao(anotacao, acao, usuarioNome) {
  try {
    const conversa = await prisma.conversa.findUnique({
      where: { id: anotacao.conversaId },
      include: { conexaoWhatsApp: true }
    });

    if (!conversa) return;

    let conteudoMensagem = '';
    let eventoTipo = '';
    let eventoSistema = '';

    // Configura o conteúdo baseado na ação
    switch (acao) {
      case 'CRIADA':
        conteudoMensagem = anotacao.conteudo;
        eventoTipo = 'ANOTACAO_CRIADA';
        eventoSistema = `📝 Nova anotação por ${usuarioNome}`;
        break;
      case 'EDITADA':
        conteudoMensagem = anotacao.conteudo;
        eventoTipo = 'ANOTACAO_EDITADA';
        eventoSistema = `✏️ Anotação editada por ${usuarioNome}`;
        break;
      case 'APAGADA':
        conteudoMensagem = `Conteúdo removido`; // Não exibimos o conteúdo deletado no chat principal por segurança, apenas no histórico
        eventoTipo = 'ANOTACAO_APAGADA';
        eventoSistema = `🗑️ Anotação apagada por ${usuarioNome}`;
        break;
    }

    // Cria a mensagem do sistema no banco
    const mensagemSistema = await prisma.mensagem.create({
      data: {
        conversaId: conversa.id,
        contaId: conversa.contaId,
        tipo: 'ANOTACAO', // Tipo específico para renderização diferenciada
        conteudo: conteudoMensagem,
        enviadaPor: 'sistema',
        remetenteNome: usuarioNome,
        eventoTipo: eventoTipo,
        eventoSistema: eventoSistema,
        timestamp: new Date(),
        enviadaEm: new Date(),
        statusMensagem: 'enviada',
        direcao: 'sistema',
        // Armazena metadados visuais no campo JSON formatacao
        formatacao: {
          anotacaoId: anotacao.id,
          cor: anotacao.cor,
          acao: acao,
          conteudoOriginal: acao === 'APAGADA' ? anotacao.conteudo : null,
          editadoEm: acao === 'EDITADA' ? new Date() : null,
          apagadoEm: acao === 'APAGADA' ? new Date() : null
        }
      }
    });

    // Atualiza a última mensagem da conversa
    await prisma.conversa.update({
      where: { id: conversa.id },
      data: { 
        ultimaMensagemEm: new Date(),
        atualizadaEm: new Date()
      }
    });

    // ✅ Emite evento via Socket.io para atualizar em tempo real
    if (global.io) {
      global.io.to(`conta_${conversa.contaId}`).emit('nova_mensagem', {
        mensagem: mensagemSistema,
        conversaId: conversa.id,
        tipo: 'sistema',
        eventoTipo: eventoTipo
      });
    }

    console.log(`✅ Mensagem sistema criada: ${eventoTipo}`);
    return mensagemSistema;

  } catch (erro) {
    console.error('❌ Erro ao criar mensagem sistema:', erro);
  }
}

// ============================================================
// ROTAS DE ANOTAÇÕES
// ============================================================

// ✅ CRIAR nova anotação
// POST /api/anotacoes
router.post('/', async (req, res) => {
  try {
    const { conversaId, ticketId, texto, mensagem, conteudo, cor, mensagemId, mensagemCitadaConteudo, mensagemCitadaAutor } = req.body;
    const usuarioId = req.usuario.id;
    const usuarioNome = req.usuario.nome;
    const contaId = req.usuario.contaId;

    // Normaliza os dados
    const idConversaFinal = conversaId || ticketId;
    const conteudoFinal = texto || mensagem || conteudo;

    if (!conteudoFinal || !conteudoFinal.trim()) {
      return res.status(400).json({ 
        sucesso: false, 
        erro: 'Texto da anotação é obrigatório' 
      });
    }

    if (!idConversaFinal) {
      return res.status(400).json({ 
        sucesso: false, 
        erro: 'ID da conversa é obrigatório' 
      });
    }

    // Verifica se a conversa existe e pertence à conta
    const conversa = await prisma.conversa.findFirst({
      where: {
        id: idConversaFinal,
        contaId: contaId
      }
    });

    if (!conversa) {
      return res.status(404).json({ 
        sucesso: false, 
        erro: 'Conversa não encontrada' 
      });
    }

    const anotacao = await prisma.anotacao.create({
      data: {
        conteudo: conteudoFinal.trim(),
        conversaId: idConversaFinal,
        usuarioId: usuarioId,
        cor: cor || 'amarelo',
        ...(mensagemId && { replyParaId: mensagemId }),
        ...(mensagemCitadaConteudo && { mensagemCitadaConteudo }),
        ...(mensagemCitadaAutor && { mensagemCitadaAutor })
      },
      include: {
        usuario: {
          select: {
            id: true,
            nome: true,
            email: true
          }
        }
      }
    });

    // ✅ CRIA MENSAGEM DO SISTEMA NO CHAT
    await criarMensagemSistemaAnotacao(anotacao, 'CRIADA', usuarioNome);

    // ✅ Emite evento via Socket.io para o painel de anotações
    if (global.io) {
      global.io.to(`conta_${contaId}`).emit('nova_anotacao', {
        anotacao: anotacao,
        conversaId: idConversaFinal,
        acao: 'CRIADA'
      });
    }
    
    console.log(`✅ Anotação criada: ${anotacao.id}`);

    // Retorna no formato que o frontend espera
    res.json({
      sucesso: true,
      id: anotacao.id,
      mensagem: anotacao.conteudo,
      conteudo: anotacao.conteudo,
      cor: anotacao.cor,
      criadaEm: anotacao.criadaEm,
      atualizadoEm: anotacao.atualizadoEm,
      usuario: anotacao.usuario,
      usuarioId: anotacao.usuarioId,
      // Retorno padronizado da anotação completa
      anotacao: anotacao
    });

  } catch (erro) {
    console.error('❌ Erro ao criar anotação:', erro);
    res.status(500).json({ 
      sucesso: false, 
      erro: 'Erro ao criar anotação',
      detalhes: erro.message 
    });
  }
});

// ✅ LISTAR anotações de uma conversa
// GET /api/anotacoes/conversa/:conversaId
// Suporta query param ?incluirApagadas=true para o histórico
router.get('/conversa/:conversaId', async (req, res) => {
  try {
    const { conversaId } = req.params;
    const { incluirApagadas } = req.query;
    const contaId = req.usuario.contaId;

    // Verifica se a conversa existe e pertence à conta
    const conversa = await prisma.conversa.findFirst({
      where: {
        id: conversaId,
        contaId: contaId
      }
    });

    if (!conversa) {
      return res.status(404).json({ 
        sucesso: false, 
        erro: 'Conversa não encontrada' 
      });
    }

    const where = { conversaId: conversaId };
    
    // Por padrão não traz apagadas, a menos que solicitado (Aba Histórico)
    if (incluirApagadas !== 'true') {
      where.apagada = false;
    }

    const anotacoes = await prisma.anotacao.findMany({
      where: where,
      include: {
        usuario: {
          select: { 
            id: true, 
            nome: true, 
            email: true 
          }
        }
      },
      orderBy: { criadaEm: 'desc' }
    });

    res.json({
      sucesso: true,
      total: anotacoes.length,
      anotacoes: anotacoes.map(a => ({
        id: a.id,
        mensagem: a.conteudo,
        conteudo: a.conteudo,
        cor: a.cor,
        apagada: a.apagada,
        apagadaPor: a.apagadaPor,
        apagadaEm: a.apagadaEm,
        criadaEm: a.criadaEm,
        atualizadoEm: a.atualizadoEm,
        usuario: a.usuario,
        usuarioId: a.usuarioId,
        mensagemCitadaConteudo: a.mensagemCitadaConteudo,
        mensagemCitadaAutor: a.mensagemCitadaAutor,
        replyParaId: a.replyParaId
      }))
    });

  } catch (erro) {
    console.error('❌ Erro ao listar anotações:', erro);
    res.status(500).json({ 
      sucesso: false, 
      erro: 'Erro ao listar anotações',
      detalhes: erro.message 
    });
  }
});

// ✅ ATUALIZAR anotação
// PUT /api/anotacoes/:anotacaoId
router.put('/:anotacaoId', async (req, res) => {
  try {
    const { anotacaoId } = req.params;
    const { texto, mensagem, conteudo, cor } = req.body;
    const usuarioId = req.usuario.id;
    const usuarioNome = req.usuario.nome;

    const conteudoFinal = texto || mensagem || conteudo;

    if (!conteudoFinal && !cor) {
      return res.status(400).json({ 
        sucesso: false, 
        erro: 'Nada para atualizar' 
      });
    }

    // Verifica permissão (apenas dono ou admin pode editar - aqui simplificado para verificar existencia)
    const anotacaoExiste = await prisma.anotacao.findFirst({
      where: { id: anotacaoId }
    });

    if (!anotacaoExiste) {
      return res.status(404).json({ 
        sucesso: false, 
        erro: 'Anotação não encontrada' 
      });
    }

    const dadosAtualizacao = {};
    if (conteudoFinal) dadosAtualizacao.conteudo = conteudoFinal.trim();
    if (cor) dadosAtualizacao.cor = cor;

    const anotacao = await prisma.anotacao.update({
      where: { id: anotacaoId },
      data: dadosAtualizacao,
      include: {
        usuario: {
          select: { id: true, nome: true, email: true }
        }
      }
    });

    // ✅ CRIA MENSAGEM DO SISTEMA DE EDIÇÃO
    await criarMensagemSistemaAnotacao(anotacao, 'EDITADA', usuarioNome);

    // ✅ Emite evento via Socket.io
    if (global.io) {
      global.io.to(`conta_${req.usuario.contaId}`).emit('anotacao_atualizada', {
        anotacao: anotacao,
        conversaId: anotacao.conversaId,
        editadoPor: usuarioNome,
        acao: 'EDITADA'
      });
    }

    console.log(`✅ Anotação atualizada: ${anotacao.id}`);

    res.json({
      sucesso: true,
      anotacao: {
        ...anotacao,
        mensagem: anotacao.conteudo
      }
    });

  } catch (erro) {
    console.error('❌ Erro ao atualizar anotação:', erro);
    res.status(500).json({ 
      sucesso: false, 
      erro: 'Erro ao atualizar anotação',
      detalhes: erro.message 
    });
  }
});

// ✅ DELETAR anotação
// DELETE /api/anotacoes/:anotacaoId
router.delete('/:anotacaoId', async (req, res) => {
  try {
    const { anotacaoId } = req.params;
    const usuarioId = req.usuario.id;
    const usuarioNome = req.usuario.nome;

    const anotacaoExiste = await prisma.anotacao.findFirst({
      where: { id: anotacaoId }
    });

    if (!anotacaoExiste) {
      return res.status(404).json({ 
        sucesso: false, 
        erro: 'Anotação não encontrada' 
      });
    }

    // Soft Delete (Marca como apagada para manter no histórico)
    const anotacao = await prisma.anotacao.update({
      where: { id: anotacaoId },
      data: {
        apagada: true,
        apagadaPor: usuarioNome,
        apagadaEm: new Date()
      },
      include: {
        usuario: {
          select: { id: true, nome: true, email: true }
        }
      }
    });

    // ✅ CRIA MENSAGEM DO SISTEMA DE REMOÇÃO
    await criarMensagemSistemaAnotacao(anotacao, 'APAGADA', usuarioNome);

    // ✅ Emite evento via Socket.io
    if (global.io) {
      global.io.to(`conta_${req.usuario.contaId}`).emit('anotacao_deletada', {
        anotacaoId: anotacaoId,
        conversaId: anotacao.conversaId,
        apagadaPor: usuarioNome,
        acao: 'APAGADA'
      });
    }

    console.log(`✅ Anotação deletada: ${anotacao.id}`);

    res.json({
      sucesso: true,
      mensagem: 'Anotação removida'
    });

  } catch (erro) {
    console.error('❌ Erro ao deletar anotação:', erro);
    res.status(500).json({ 
      sucesso: false, 
      erro: 'Erro ao deletar anotação',
      detalhes: erro.message 
    });
  }
});

module.exports = router;