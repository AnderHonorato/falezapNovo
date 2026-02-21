// backend/src/rotas/reacoes.rotas.js - ✅ VERSÃO FINAL COMPLETA

const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { verificarToken } = require('../middleware/autenticacao.middleware');

const prisma = new PrismaClient();
const router = express.Router();

// ✅ Reagir a uma mensagem
router.post('/', verificarToken, async (req, res) => {
  try {
    const { mensagemId, emoji } = req.body;
    const usuarioId = req.usuario.id;

    console.log('\n😊 ==========================================');
    console.log('😊 [API Reações] NOVA REQUISIÇÃO');
    console.log('==========================================');
    console.log('📋 Dados recebidos:');
    console.log('   Mensagem ID:', mensagemId);
    console.log('   Emoji:', emoji || '(removendo)');
    console.log('   Usuário:', req.usuario.nome);
    console.log('   Usuário ID:', usuarioId);
    console.log('   Conta ID:', req.usuario.contaId);
    console.log('==========================================\n');

    if (!mensagemId) {
      return res.status(400).json({ 
        sucesso: false, 
        erro: 'mensagemId é obrigatório' 
      });
    }

    // ✅ Busca mensagem
    const mensagem = await prisma.mensagem.findUnique({
      where: { id: mensagemId },
      select: { id: true, contaId: true, conversaId: true }
    });

    if (!mensagem) {
      console.error('❌ [API Reações] Mensagem não encontrada:', mensagemId);
      return res.status(404).json({ 
        sucesso: false, 
        erro: 'Mensagem não encontrada' 
      });
    }

    console.log('✅ [API Reações] Mensagem encontrada:');
    console.log('   Conversa ID:', mensagem.conversaId);
    console.log('   Conta ID:', mensagem.contaId);

    // ✅ Remove TODAS as reações antigas deste usuário nesta mensagem
    const reacoesRemovidas = await prisma.reacao.deleteMany({
      where: {
        mensagemId: mensagemId,
        usuarioId: usuarioId
      }
    });

    console.log(`🗑️ [API Reações] ${reacoesRemovidas.count} reação(ões) antiga(s) removida(s)`);

    if (emoji) {
      // ✅ Cria nova reação
      const novaReacao = await prisma.reacao.create({
        data: {
          mensagemId: mensagemId,
          usuarioId: usuarioId,
          emoji: emoji
        },
        include: {
          usuario: {
            select: { id: true, nome: true }
          }
        }
      });

      console.log('✅ [API Reações] Nova reação criada:');
      console.log('   Reação ID:', novaReacao.id);
      console.log('   Emoji:', novaReacao.emoji);
      console.log('   Usuário:', novaReacao.usuario.nome);

      // ✅ Emite via Socket
      if (global.io) {
        const sala = `conta:${mensagem.contaId}`;
        const payload = {
          mensagemId: mensagem.id,
          conversaId: mensagem.conversaId,
          emoji: emoji,
          usuarioId: usuarioId,
          nomeUsuario: novaReacao.usuario.nome
        };
        
        console.log('📡 [API Reações] Preparando emissão socket:');
        console.log('   Sala:', sala);
        console.log('   Evento: reacao_atualizada');
        console.log('   Payload:', JSON.stringify(payload, null, 2));
        
        global.io.to(sala).emit('reacao_atualizada', payload);
        
        console.log('✅ [API Reações] Socket emitido com sucesso!');
      } else {
        console.error('❌ [API Reações] ERRO: global.io não está disponível!');
        console.error('   O socket não foi configurado corretamente no server.js');
      }

      console.log('==========================================\n');

      return res.json({ 
        sucesso: true, 
        reacao: novaReacao,
        mensagem: 'Reação adicionada' 
      });
    } else {
      // ✅ Emoji vazio = apenas remover reação
      console.log('✅ [API Reações] Reação removida (sem criar nova)');

      // ✅ Emite via Socket (remoção)
      if (global.io) {
        const sala = `conta:${mensagem.contaId}`;
        const payload = {
          mensagemId: mensagem.id,
          conversaId: mensagem.conversaId,
          emoji: null,
          usuarioId: usuarioId,
          nomeUsuario: req.usuario.nome
        };
        
        console.log('📡 [API Reações] Emitindo remoção via socket:');
        console.log('   Sala:', sala);
        console.log('   Payload:', JSON.stringify(payload, null, 2));
        
        global.io.to(sala).emit('reacao_atualizada', payload);
        
        console.log('✅ [API Reações] Socket de remoção emitido!');
      } else {
        console.error('❌ [API Reações] ERRO: global.io não disponível para remoção!');
      }

      console.log('==========================================\n');

      return res.json({ 
        sucesso: true, 
        mensagem: 'Reação removida' 
      });
    }

  } catch (error) {
    console.error('\n❌ ==========================================');
    console.error('❌ [API Reações] ERRO CRÍTICO');
    console.error('==========================================');
    console.error('Erro:', error.message);
    console.error('Stack:', error.stack);
    console.error('==========================================\n');
    
    res.status(500).json({ 
      sucesso: false, 
      erro: 'Erro ao processar reação' 
    });
  }
});

module.exports = router;