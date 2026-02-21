// backend/src/rotas/whatsapp.webhook.js - ✅ VERSÃO CORRIGIDA (REAÇÕES)

const express = require('express');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const whatsappOfficial = require('../servicos/whatsappOfficial.servico');

function criarWebhookRouter(io) {
  const router = express.Router();

  // ============================================
  // VERIFICAÇÃO DO WEBHOOK (GET)
  // ============================================
  router.get('/', (req, res) => {
    console.log('\n📡 ==========================================');
    console.log('📡 VERIFICAÇÃO DO WEBHOOK');
    console.log('==========================================');

    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    console.log('🔍 Mode:', mode);
    console.log('🔑 Token recebido:', token);
    console.log('🎯 Challenge:', challenge);

    if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
      console.log('✅ WEBHOOK VERIFICADO COM SUCESSO!');
      console.log('==========================================\n');
      res.status(200).send(challenge);
    } else {
      console.error('❌ VERIFICAÇÃO FALHOU!');
      console.log('==========================================\n');
      res.sendStatus(403);
    }
  });

  // ============================================
  // RECEBER MENSAGENS (POST)
  // ============================================
  router.post('/', async (req, res) => {
    try {
      console.log('\n📨 ==========================================');
      console.log('📨 WEBHOOK: Nova notificação recebida');
      console.log('==========================================');

      const body = req.body;

      if (!body) {
        console.warn('⚠️ Webhook body vazio');
        return res.sendStatus(200);
      }
      if (body.object !== 'whatsapp_business_account') {
        console.log('⚠️ Notificação ignorada: não é do WhatsApp Business');
        return res.sendStatus(200);
      }
      if (!Array.isArray(body.entry)) {
        console.warn('⚠️ Estrutura inesperada: "entry" não é um array');
        return res.sendStatus(200);
      }

      for (const entry of body.entry) {
        if (!entry.changes || !Array.isArray(entry.changes)) continue;

        for (const change of entry.changes) {
          if (change.field === 'messages') {
            const value = change.value || {};
            const metadata = value?.metadata || {};

            console.log('📱 Número do WhatsApp:', metadata.display_phone_number);
            console.log('🆔 Phone Number ID:', metadata.phone_number_id);

            if (Array.isArray(value.messages) && value.messages.length > 0) {
              for (const message of value.messages) {
                // ✅ CORREÇÃO: Detectar REAÇÃO antes de processar
                if (message.type === 'reaction') {
                  await processarReacao(message, metadata, io);
                } else {
                  await processarMensagemRecebida(message, metadata, io);
                }
              }
            }

            if (Array.isArray(value.statuses) && value.statuses.length > 0) {
              for (const status of value.statuses) {
                await processarStatusMensagem(status, io);
              }
            }
          }
        }
      }

      console.log('✅ Webhook processado com sucesso');
      console.log('==========================================\n');

      res.sendStatus(200);
    } catch (error) {
      console.error('❌ Erro ao processar webhook:', error);
      res.sendStatus(200); 
    }
  });

  // ============================================
  // ROTA DE TESTE
  // ============================================
  router.post('/webhook/test', (req, res) => {
    console.log('🧪 Teste de webhook recebido');
    console.log('Body:', JSON.stringify(req.body, null, 2));
    res.json({ success: true, message: 'Webhook de teste recebido' });
  });
  
  return router;
} 

// ============================================
// ✅ PROCESSAR REAÇÃO (NOVO)
// ============================================
async function processarReacao(message, metadata, io) {
  try {
    const { from: numeroCliente, reaction, timestamp } = message;
    const { message_id: whatsappIdOriginal, emoji } = reaction;

    console.log('\n😊 ─────────────────────────────────────────');
    console.log('😊 REAÇÃO RECEBIDA');
    console.log('─────────────────────────────────────────');
    console.log('👤 De:', numeroCliente);
    console.log('😀 Emoji:', emoji || '(removido)');
    console.log('📩 Mensagem ID:', whatsappIdOriginal);
    console.log('─────────────────────────────────────────');

    // ✅ Busca mensagem original
    const mensagemOriginal = await prisma.mensagem.findFirst({
      where: { whatsappId: whatsappIdOriginal },
      select: { 
        id: true, 
        conversaId: true, 
        contaId: true 
      }
    });

    if (!mensagemOriginal) {
      console.warn('⚠️ Mensagem original não encontrada para reação');
      return;
    }

    // ✅ CORREÇÃO: Busca TODAS as reações deste remetente nesta mensagem
    const reacoesExistentes = await prisma.reacao.findMany({
      where: {
        mensagemId: mensagemOriginal.id,
        numeroRemetente: numeroCliente
      }
    });

    if (emoji) {
      // ✅ Remove todas as reações antigas deste remetente
      if (reacoesExistentes.length > 0) {
        await prisma.reacao.deleteMany({
          where: {
            mensagemId: mensagemOriginal.id,
            numeroRemetente: numeroCliente
          }
        });
        console.log(`✅ ${reacoesExistentes.length} reação(ões) antiga(s) removida(s)`);
      }

      // ✅ Cria a nova reação
      await prisma.reacao.create({
        data: {
          mensagemId: mensagemOriginal.id,
          emoji: emoji,
          numeroRemetente: numeroCliente,
          nomeRemetente: numeroCliente
        }
      });
      console.log('✅ Nova reação criada');
    } else {
      // ✅ Remove todas as reações (quando emoji vem vazio)
      if (reacoesExistentes.length > 0) {
        await prisma.reacao.deleteMany({
          where: {
            mensagemId: mensagemOriginal.id,
            numeroRemetente: numeroCliente
          }
        });
        console.log('✅ Reação removida');
      }
    }

    // ✅ Emite via Socket
    if (io) {
      const sala = `conta:${mensagemOriginal.contaId}`;
      const payload = {
        mensagemId: mensagemOriginal.id,
        conversaId: mensagemOriginal.conversaId,
        emoji: emoji,
        remetente: numeroCliente,
        nomeRemetente: numeroCliente
      };
      io.to(sala).emit('reacao_atualizada', payload);
      console.log(`✅ Reação emitida via socket para sala: ${sala}`);
    }

    console.log('─────────────────────────────────────────\n');

  } catch (error) {
    console.error('❌ Erro ao processar reação:', error);
    console.error('Stack:', error.stack);
  }
}
// ============================================
// PROCESSAR MENSAGEM RECEBIDA
// ============================================
async function processarMensagemRecebida(message, metadata, io) {
  try {
    const {
      id: whatsappId,
      from: numeroCliente,
      timestamp,
      type: tipo,
      text,
      image,
      document,
      audio,
      video,
      location,
      contacts,
      context,
      button,
      interactive
    } = message;

    console.log('\n📥 ─────────────────────────────────────────');
    console.log('📥 MENSAGEM RECEBIDA');
    console.log('─────────────────────────────────────────');
    console.log('🆔 ID:', whatsappId);
    console.log('👤 De:', numeroCliente);
    console.log('📝 Tipo:', tipo);

    let conteudo = '';
    let midiaUrl = null;
    let midiaId = null;
    let midiaNomeOriginal = null; 

    // ✅ CORREÇÃO: Detectar respostas de botões/formulários
    if (tipo === 'button' && button) {
      conteudo = button.text || '[Botão]';
      console.log('🔘 Resposta de botão:', conteudo);
    } else if (tipo === 'interactive' && interactive) {
      if (interactive.type === 'button_reply') {
        conteudo = interactive.button_reply?.title || '[Resposta]';
      } else if (interactive.type === 'list_reply') {
        conteudo = interactive.list_reply?.title || '[Seleção de lista]';
      }
      console.log('🔄 Resposta interativa:', conteudo);
    } else {
      // Processamento normal de mensagens
      switch (tipo) {
        case 'text':
          conteudo = text?.body || '';
          break;
        case 'image':
          midiaId = image?.id;
          midiaUrl = image?.link;
          conteudo = image?.caption || '[Imagem]';
          break;
        case 'document':
          midiaId = document?.id;
          midiaUrl = document?.link;
          midiaNomeOriginal = document?.filename; 
          conteudo = document?.caption || document?.filename || '[Documento]';
          break;
        case 'audio':
          midiaId = audio?.id;
          midiaUrl = audio?.link;
          conteudo = '[Áudio]';
          break;
        case 'video':
          midiaId = video?.id;
          midiaUrl = video?.link;
          conteudo = video?.caption || '[Vídeo]';
          break;
        case 'location':
          conteudo = `📍 Localização: ${location?.latitude}, ${location?.longitude}`;
          break;
        case 'contacts':
          const nomeContato = contacts?.[0]?.name?.formatted_name || 'Contato';
          conteudo = `👤 ${nomeContato}`;
          break;
        default:
          conteudo = `[${tipo}]`;
      }
    }

    console.log('💬 Conteúdo:', conteudo);

    const phoneNumberId = metadata.phone_number_id;
    const numeroLimpo = (metadata.display_phone_number || '').replace(/\D/g, '');

    let conexao = null;
    if (numeroLimpo) {
      conexao = await prisma.conexaoWhatsApp.findFirst({
        where: {
          numeroWhatsApp: { contains: numeroLimpo },
          status: 'CONECTADO'
        }
      });
    }

    if (!conexao) {
      conexao = await prisma.conexaoWhatsApp.findFirst({
        where: { status: 'CONECTADO' },
        orderBy: { atualizadoEm: 'desc' }
      });
    }

    if (!conexao) {
      console.error('❌ Nenhuma conexão WhatsApp ativa encontrada!');
      return;
    }

    let conversa = await prisma.conversa.findFirst({
      where: {
        numeroCliente: numeroCliente,
        conexaoWhatsAppId: conexao.id
      },
      include: { conexaoWhatsApp: true }
    });

    if (!conversa) {
      console.log('...Criando nova conversa (webhook)...');
      conversa = await prisma.conversa.create({
        data: {
          numeroCliente: numeroCliente,
          nomeContato: numeroCliente, 
          contaId: conexao.contaId,
          conexaoWhatsAppId: conexao.id,
          statusConversa: 'CAIXA_ENTRADA',
          naoLidas: 0
        },
        include: { conexaoWhatsApp: true }
      });
      console.log('✅ Nova conversa criada:', conversa.id);
    }

    const tipoMap = {
      'text': 'TEXTO',
      'image': 'IMAGEM',
      'audio': 'AUDIO',
      'video': 'VIDEO',
      'document': 'DOCUMENTO',
      'contacts': 'CONTATO',
      'location': 'LOCALIZACAO',
      'sticker': 'FIGURINHA',
      'button': 'TEXTO',
      'interactive': 'TEXTO'
    };
    const tipoMensagem = tipoMap[tipo] || 'TEXTO';

    // ✅ Busca mensagem citada se houver context
    let replyParaId = null;
    if (context?.id) {
      const mensagemCitada = await prisma.mensagem.findFirst({
        where: { whatsappId: context.id },
        select: { id: true }
      });
      if (mensagemCitada) {
        replyParaId = mensagemCitada.id;
      }
    }

    const timestampDate = timestamp ? new Date(parseInt(timestamp) * 1000) : new Date();
    const mensagemSalva = await prisma.mensagem.create({
      data: {
        whatsappId: whatsappId,
        conversaId: conversa.id,
        contaId: conversa.contaId,
        conteudo: conteudo,
        tipo: tipoMensagem,
        direcao: 'RECEBIDA',
        statusMensagem: 'RECEBIDA',
        enviadaPor: numeroCliente,
        timestamp: timestampDate,
        enviadaEm: timestampDate,
        lida: false,
        ...(midiaUrl && { mediaUrl: midiaUrl }),
        ...(midiaId && { mediaId: midiaId }), 
        ...(midiaNomeOriginal && { mediaNome: midiaNomeOriginal }),
        ...(replyParaId && { replyParaId: replyParaId })
      }
    });

    console.log('✅ Mensagem salva no banco. ID:', mensagemSalva.id);

    const conversaAtualizada = await prisma.conversa.update({
      where: { id: conversa.id },
      data: {
        ultimaMensagemEm: new Date(),
        naoLidas: { increment: 1 }
      }
    });

    console.log('✅ Conversa atualizada. Não lidas:', conversaAtualizada.naoLidas);
    
    // ✅ BUSCAR DADOS DA MENSAGEM CITADA (SE HOUVER)
    let replyToObj = null;
    if (replyParaId) {
      const msgCitada = await prisma.mensagem.findUnique({
        where: { id: replyParaId },
        select: {
          id: true,
          conteudo: true,
          tipo: true,
          enviadaPor: true,
          direcao: true
        }
      });
      
      if (msgCitada) {
        replyToObj = {
          id: msgCitada.id,
          conteudo: msgCitada.conteudo || '',
          tipo: msgCitada.tipo,
          remetente: {
            nome: msgCitada.enviadaPor || 'Cliente'
          },
          ehMinha: msgCitada.direcao === 'ENVIADA'
        };
      }
    }
    
    try {
      if (!io) { 
        console.error('❌ [Webhook] Erro: Objeto IO não foi fornecido!');
      } else {
        const sala = `conta:${conversa.contaId}`;
        
        // ✅ PAYLOAD COMPLETO E NORMALIZADO
        const payload = {
          mensagem: {
            id: mensagemSalva.id,
            whatsappId: mensagemSalva.whatsappId,
            conteudo: mensagemSalva.conteudo,
            mensagem: mensagemSalva.conteudo, // Alias para compatibilidade
            tipo: mensagemSalva.tipo,
            direcao: 'RECEBIDA', 
            statusMensagem: 'RECEBIDA',
            timestamp: mensagemSalva.timestamp,
            enviadaEm: mensagemSalva.enviadaEm,
            criadaEm: mensagemSalva.enviadaEm, // ✅ CRÍTICO: frontend usa criadaEm
            enviadaPor: mensagemSalva.enviadaPor,
            remetenteNome: mensagemSalva.enviadaPor,
            lida: false, 
            conversaId: conversa.id,
            fromMe: false, 
            usuarioId: null,
            
            // ✅ MÍDIA
            mediaUrl: mensagemSalva.mediaUrl,
            mediaId: mensagemSalva.mediaId,
            mediaNome: mensagemSalva.mediaNome,
            
            // ✅ REPLY COMPLETO (não apenas o ID)
            replyTo: replyToObj,
            replyParaId: replyParaId,
            
            // ✅ OUTROS
            reacoes: [],
            favorita: false,
            fixada: false
          },
          conversa: {
            id: conversa.id,
            numeroCliente: conversa.numeroCliente,
            nomeCliente: conversa.nomeContato || conversa.numeroCliente,
            naoLidas: conversaAtualizada.naoLidas,
            ultimaMensagemEm: conversaAtualizada.ultimaMensagemEm,
            statusConversa: conversa.statusConversa,
            contaId: conversa.contaId,
            conexaoWhatsAppId: conversa.conexaoWhatsAppId
          }
        };
        
        io.to(sala).emit('nova_mensagem', payload); 
        console.log(`✅ [Webhook] Mensagem recebida emitida via socket para a sala: ${sala}`);
        console.log(`📦 [DEBUG] Payload emitido:`, {
          mensagemId: payload.mensagem.id,
          conteudo: payload.mensagem.conteudo,
          tipo: payload.mensagem.tipo,
          criadaEm: payload.mensagem.criadaEm, // ✅ Verificar se está presente
          conversaId: payload.mensagem.conversaId
        });
      }
    } catch (socketError) {
      console.error('❌ [Webhook] Erro ao emitir socket:', socketError);
    }

    if (process.env.WHATSAPP_AUTO_READ === 'true') {
      try {
        await whatsappOfficial.marcarComoLida(whatsappId);
        console.log('✅ Mensagem marcada como lida automaticamente');
      } catch (err) {
        console.warn('⚠️ Falha ao marcar como lida (não crítica):', err.message || err);
      }
    }

    console.log('─────────────────────────────────────────\n');
  } catch (error) {
    console.error('❌ Erro ao processar mensagem:', error);
    console.error('Stack:', error.stack);
  }
}

// ============================================
// PROCESSAR STATUS DE MENSAGEM
// ============================================
async function processarStatusMensagem(status, io) { 
  try {
    const {
      id: whatsappId,
      status: statusMensagem, 
      timestamp,
      recipient_id: numeroCliente
    } = status;

    console.log('\n📊 ─────────────────────────────────────────');
    console.log('📊 STATUS DE MENSAGEM');
    console.log('─────────────────────────────────────────');
    console.log('🆔 ID:', whatsappId);
    console.log('📱 Para:', numeroCliente);
    console.log('✅ Status:', statusMensagem);

    const statusMap = {
      'sent': 'ENVIADA',
      'delivered': 'ENTREGUE',
      'read': 'LIDA',
      'failed': 'ERRO'
    };

    let novoStatus = statusMap[statusMensagem] || (statusMensagem ? statusMensagem.toUpperCase() : 'DESCONHECIDO');

    if (novoStatus === 'ERRO' && status.errors && status.errors.length > 0) {
      const erroMeta = status.errors[0];
      if (erroMeta.code === 131047 || erroMeta.code === 131026) {
        novoStatus = 'FALHA_JANELA_24H';
        console.log(`⚠️ Erro detectado: Janela de 24h fechada (Code ${erroMeta.code})`);
      } else {
        console.log(`⚠️ Erro da Meta: Code ${erroMeta.code} - ${erroMeta.title}`);
      }
    }

    const mensagemAtualizada = await prisma.mensagem.updateMany({
      where: { whatsappId: whatsappId },
      data: {
        statusMensagem: novoStatus,
        ...(statusMensagem === 'read' && { lida: true })
      }
    });

    if (mensagemAtualizada.count > 0) {
      console.log('✅ Status atualizado no banco');

      const mensagemDb = await prisma.mensagem.findFirst({
        where: { whatsappId: whatsappId },
        select: { id: true, conversaId: true }
      });

      if (mensagemDb && mensagemDb.conversaId) {
        const conversa = await prisma.conversa.findUnique({
          where: { id: mensagemDb.conversaId },
          select: { contaId: true }
        });

        if (conversa && conversa.contaId) {
          try {
            if (io) { 
              const sala = `conta:${conversa.contaId}`;
              const payload = {
                id: mensagemDb.id,
                conversaId: mensagemDb.conversaId,
                whatsappId: whatsappId,
                status: novoStatus,
                lida: statusMensagem === 'read'
              };
              io.to(sala).emit('mensagem_status_atualizada', payload); 
              console.log(`✅ [Webhook] Status atualizado emitido via socket para a sala: ${sala}`);
            } else {
              console.error('❌ [Webhook] Erro: Objeto IO não foi fornecido para emitir status!');
            }
          } catch (socketError) {
            console.error('❌ [Webhook] Erro ao emitir status de socket:', socketError);
          }
        }
      }
    } else {
      console.log('⚠️ Mensagem não encontrada no banco para atualizar status');
    }

    console.log('─────────────────────────────────────────\n');
  } catch (error) {
    console.error('❌ Erro ao processar status:', error);
    console.error(error.stack);
  }
}

module.exports = criarWebhookRouter;