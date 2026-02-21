// backend/src/controladores/Whatsapp/utils.controlador.js - VERSÃO COMPLETA

const servicoWhatsApp = require('../../servicos/baileys.servico');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class UtilsController {
  
  // ============================================================================
  // DEBUG
  // ============================================================================
  
  static async debugMensagens(req, res) {
    try {
      const { usuarioId, numeroCliente } = req.params;
      
      console.log('🔍 ===== DEBUG DE MENSAGENS =====');
      console.log(`   usuarioId: ${usuarioId}`);
      console.log(`   numeroCliente: ${numeroCliente}`);
      
      const usuario = await prisma.usuario.findUnique({ 
        where: { id: usuarioId },
        include: { conta: true }
      });
      
      if (!usuario) {
        return res.json({ 
          erro: 'Usuário não encontrado',
          usuarioId: usuarioId
        });
      }
      
      console.log(`   ✅ Usuário: ${usuario.nome}`);
      console.log(`   ✅ Conta: ${usuario.conta.email} (ID: ${usuario.contaId})`);
      
      const conversa = await prisma.conversa.findFirst({
        where: { 
          contaId: usuario.contaId, 
          numeroCliente: decodeURIComponent(numeroCliente)
        }
      });
      
      if (!conversa) {
        console.log(`   ❌ Conversa NÃO encontrada`);
        
        const todasConversas = await prisma.conversa.findMany({
          where: { contaId: usuario.contaId },
          select: { 
            id: true, 
            numeroCliente: true, 
            nomeCliente: true,
            isGrupo: true,
            _count: { select: { mensagens: true } }
          },
          take: 20
        });
        
        console.log(`   📋 Conversas disponíveis (${todasConversas.length}):`);
        todasConversas.forEach(c => {
          console.log(`       - ${c.numeroCliente} (${c.nomeCliente}) - ${c._count.mensagens} msgs`);
        });
        
        return res.json({ 
          erro: 'Conversa não encontrada',
          buscado: decodeURIComponent(numeroCliente),
          conversasDisponiveis: todasConversas.map(c => ({
            numeroCliente: c.numeroCliente,
            nomeCliente: c.nomeCliente,
            isGrupo: c.isGrupo,
            totalMensagens: c._count.mensagens
          }))
        });
      }
      
      console.log(`   ✅ Conversa: ${conversa.nomeCliente} (ID: ${conversa.id})`);
      
      const totalMensagens = await prisma.mensagem.count({
        where: { conversaId: conversa.id }
      });
      
      console.log(`   📊 Total de mensagens no banco: ${totalMensagens}`);
      
      const mensagens = await prisma.mensagem.findMany({
        where: { conversaId: conversa.id },
        orderBy: { enviadaEm: 'desc' },
        take: 20,
        select: {
          id: true,
          whatsappId: true,
          tipo: true,
          direcao: true,
          conteudo: true,
          enviadaEm: true,
          remetenteNome: true,
          fixada: true
        }
      });
      
      console.log(`   📨 Últimas 20 mensagens carregadas`);
      
      const porTipo = {};
      const porDirecao = {};
      
      await prisma.mensagem.findMany({
        where: { conversaId: conversa.id },
        select: { tipo: true, direcao: true }
      }).then(msgs => {
        msgs.forEach(m => {
          porTipo[m.tipo] = (porTipo[m.tipo] || 0) + 1;
          porDirecao[m.direcao] = (porDirecao[m.direcao] || 0) + 1;
        });
      });
      
      const primeiraMensagem = await prisma.mensagem.findFirst({
        where: { conversaId: conversa.id },
        orderBy: { enviadaEm: 'asc' },
        select: { enviadaEm: true }
      });
      
      const ultimaMensagem = await prisma.mensagem.findFirst({
        where: { conversaId: conversa.id },
        orderBy: { enviadaEm: 'desc' },
        select: { enviadaEm: true }
      });
      
      const resultado = {
        sucesso: true,
        usuario: {
          id: usuario.id,
          nome: usuario.nome,
          contaId: usuario.contaId,
          conta: usuario.conta.email
        },
        conversa: {
          id: conversa.id,
          numeroCliente: conversa.numeroCliente,
          nomeCliente: conversa.nomeCliente,
          isGrupo: conversa.isGrupo
        },
        estatisticas: {
          totalMensagens: totalMensagens,
          porTipo: porTipo,
          porDirecao: porDirecao,
          primeiraData: primeiraMensagem?.enviadaEm,
          ultimaData: ultimaMensagem?.enviadaEm
        },
        mensagensAmostra: mensagens.map(m => ({
          id: m.id,
          whatsappId: m.whatsappId,
          tipo: m.tipo,
          direcao: m.direcao,
          remetenteNome: m.remetenteNome,
          conteudo: m.conteudo?.substring(0, 100),
          enviadaEm: m.enviadaEm,
          fixada: m.fixada
        }))
      };
      
      console.log('   ✅ Debug completo!');
      
      res.json(resultado);
      
    } catch (erro) {
      console.error('❌ Erro no debug:', erro);
      res.status(500).json({ 
        erro: erro.message, 
        stack: erro.stack 
      });
    }
  }

  // ============================================================================
  // SINCRONIZAÇÃO BÁSICA
  // ============================================================================

  static async sincronizarHistorico(req, res) {
    try {
      const { usuarioId } = req.params;
      console.log('🔄 Sincronizando histórico:', usuarioId);
      
      const resultado = await servicoWhatsApp.sincronizarHistoricoManual(usuarioId);
      res.json({
        sucesso: true,
        mensagem: 'Sincronização iniciada',
        ...resultado
      });
    } catch (erro) {
      console.error('❌ Erro:', erro);
      res.status(500).json({
        sucesso: false,
        erro: 'Erro ao sincronizar histórico',
        detalhes: erro.message
      });
    }
  }

  // ============================================================================
  // 📥 SINCRONIZAÇÃO COMPLETA DE HISTÓRICO
  // ============================================================================

  static async sincronizarHistoricoCompleto(req, res) {
    try {
      const contaId = req.usuario?.contaId;
      const { instancia } = req.body;

      if (!contaId) {
        return res.status(400).json({ erro: 'Conta não identificada' });
      }

      console.log('\n📥 [SINCRONIZAR HISTÓRICO] Iniciando...');
      console.log(`   - Conta: ${contaId}`);
      console.log(`   - Instância: ${instancia || 'padrão'}`);

      // Buscar conexão ativa
      const conexao = await prisma.conexaoWhatsApp.findFirst({
        where: {
          contaId: contaId,
          instancia: instancia || 'padrao',
          status: 'CONECTADO'
        }
      });

      if (!conexao) {
        return res.status(400).json({ erro: 'WhatsApp não conectado' });
      }

      const chave = servicoWhatsApp.gerarChaveCliente(contaId, conexao.instancia);
      const cliente = servicoWhatsApp.clientes[chave];

      if (!cliente || cliente.estado !== 'conectado') {
        return res.status(400).json({ erro: 'Cliente não está conectado' });
      }

      const socket = cliente.socket;
      let totalSincronizadas = 0;
      let totalConversas = 0;
      let erros = 0;

      // Buscar todos os chats
      const chats = await socket.groupFetchAllParticipating().catch(() => ({}));
      const chatList = Object.values(chats);

      console.log(`📋 Total de chats encontrados: ${chatList.length}`);

      for (const chat of chatList) {
        try {
          const jid = chat.id;
          const isGrupo = jid.endsWith('@g.us');
          
          // ✅ FORMATAÇÃO CORRETA DO NÚMERO
          const numeroCliente = jid
            .replace('@s.whatsapp.net', '')
            .replace('@g.us', '')
            .replace(/\D/g, '');

          console.log(`\n🔄 Sincronizando: ${chat.name || numeroCliente}`);

          // Criar ou atualizar conversa
          const conversa = await prisma.conversa.upsert({
            where: {
              contaId_numeroCliente: {
                contaId: contaId,
                numeroCliente: numeroCliente
              }
            },
            update: {
              nomeCliente: chat.name || chat.subject || numeroCliente,
              fotoPerfil: chat.imgUrl || null,
              isGrupo: isGrupo,
              statusConversa: 'CAIXA_ENTRADA'
            },
            create: {
              contaId: contaId,
              numeroCliente: numeroCliente,
              nomeCliente: chat.name || chat.subject || numeroCliente,
              fotoPerfil: chat.imgUrl || null,
              isGrupo: isGrupo,
              statusConversa: 'CAIXA_ENTRADA',
              naoLidas: 0
            }
          });

          totalConversas++;

          // 📥 BUSCAR MENSAGENS ANTIGAS
          let mensagensSincronizadas = 0;
          let cursor = undefined;
          const LIMITE = 50;
          const MAX_LOTES = 100;

          for (let i = 0; i < MAX_LOTES; i++) {
            try {
              const historico = await socket.fetchMessageHistory(
                LIMITE,
                jid,
                cursor
              );

              if (!historico || historico.messages.length === 0) {
                break;
              }

              // Processar mensagens em lote
              for (const msg of historico.messages) {
                try {
                  const msgData = msg.message;
                  if (!msgData) continue;

                  // Extrair conteúdo
                  let conteudo = '';
                  let tipo = 'TEXTO';
                  let mediaUrl = null;

                  if (msgData.conversation) {
                    conteudo = msgData.conversation;
                  } else if (msgData.extendedTextMessage) {
                    conteudo = msgData.extendedTextMessage.text;
                  } else if (msgData.imageMessage) {
                    tipo = 'IMAGEM';
                    conteudo = msgData.imageMessage.caption || '[Imagem]';
                    mediaUrl = msgData.imageMessage.url;
                  } else if (msgData.videoMessage) {
                    tipo = 'VIDEO';
                    conteudo = msgData.videoMessage.caption || '[Vídeo]';
                    mediaUrl = msgData.videoMessage.url;
                  } else if (msgData.audioMessage) {
                    tipo = 'AUDIO';
                    conteudo = '[Áudio]';
                    mediaUrl = msgData.audioMessage.url;
                  } else if (msgData.documentMessage) {
                    tipo = 'DOCUMENTO';
                    conteudo = msgData.documentMessage.fileName || '[Documento]';
                    mediaUrl = msgData.documentMessage.url;
                  } else if (msgData.stickerMessage) {
                    tipo = 'FIGURINHA';
                    conteudo = '[Figurinha]';
                    mediaUrl = msgData.stickerMessage.url;
                  } else if (msgData.viewOnceMessage || msgData.viewOnceMessageV2) {
                    tipo = 'VIEW_ONCE';
                    conteudo = '[Visualização única]';
                  }

                  // ✅ FORMATAÇÃO DO REMETENTE
                  let remetenteNumero = msg.key.participant || msg.key.remoteJid;
                  if (remetenteNumero) {
                    remetenteNumero = remetenteNumero
                      .replace('@s.whatsapp.net', '')
                      .replace('@g.us', '')
                      .replace(/\D/g, '');
                  }

                  // Verificar se mensagem já existe
                  const existente = await prisma.mensagem.findFirst({
                    where: {
                      whatsappId: msg.key.id,
                      conversaId: conversa.id
                    }
                  });

                  if (existente) continue;

                  // Criar mensagem
                  await prisma.mensagem.create({
                    data: {
                      conversaId: conversa.id,
                      contaId: contaId,
                      whatsappId: msg.key.id,
                      mensagem: conteudo,
                      tipo: tipo,
                      direcao: msg.key.fromMe ? 'ENVIADA' : 'RECEBIDA',
                      timestamp: new Date(msg.messageTimestamp * 1000),
                      lida: true,
                      fromMe: msg.key.fromMe || false,
                      mediaUrl: mediaUrl,
                      remetenteNumero: remetenteNumero,
                      status: 'ENTREGUE'
                    }
                  });

                  mensagensSincronizadas++;
                  totalSincronizadas++;

                } catch (errMsg) {
                  console.error(`❌ Erro ao processar mensagem: ${errMsg.message}`);
                }
              }

              cursor = historico.cursor;
              console.log(`   ✅ ${mensagensSincronizadas} mensagens sincronizadas`);

            } catch (errLote) {
              console.error(`❌ Erro ao buscar lote: ${errLote.message}`);
              break;
            }
          }

        } catch (errConversa) {
          console.error(`❌ Erro na conversa ${chat.id}: ${errConversa.message}`);
          erros++;
        }
      }

      console.log('\n✅ [SINCRONIZAÇÃO CONCLUÍDA]');
      console.log(`   - Conversas: ${totalConversas}`);
      console.log(`   - Mensagens: ${totalSincronizadas}`);
      console.log(`   - Erros: ${erros}`);

      res.json({
        sucesso: true,
        conversas: totalConversas,
        mensagens: totalSincronizadas,
        erros: erros
      });

    } catch (erro) {
      console.error('❌ Erro ao sincronizar histórico:', erro);
      res.status(500).json({
        erro: 'Erro ao sincronizar histórico',
        detalhes: erro.message
      });
    }
  }

  // ============================================================================
  // 🔄 SINCRONIZAR CONVERSA ESPECÍFICA
  // ============================================================================

  static async sincronizarConversaEspecifica(req, res) {
    try {
      const contaId = req.usuario?.contaId;
      const { numeroCliente } = req.params;
      const { limite = 100 } = req.body;

      console.log(`\n🔄 Sincronizando conversa: ${numeroCliente}`);

      const conexao = await prisma.conexaoWhatsApp.findFirst({
        where: { contaId, status: 'CONECTADO' }
      });

      if (!conexao) {
        return res.status(400).json({ erro: 'WhatsApp não conectado' });
      }

      const chave = servicoWhatsApp.gerarChaveCliente(contaId, conexao.instancia);
      const cliente = servicoWhatsApp.clientes[chave];

      if (!cliente) {
        return res.status(400).json({ erro: 'Cliente não encontrado' });
      }

      const jid = numeroCliente.includes('@') 
        ? numeroCliente 
        : `${numeroCliente}@s.whatsapp.net`;

      const historico = await cliente.socket.fetchMessageHistory(limite, jid);

      let sincronizadas = 0;

      if (historico && historico.messages) {
        for (const msg of historico.messages) {
          sincronizadas++;
        }
      }

      res.json({
        sucesso: true,
        mensagens: sincronizadas
      });

    } catch (erro) {
      console.error('❌ Erro:', erro);
      res.status(500).json({ erro: erro.message });
    }
  }

  // ============================================================================
  // ESTATÍSTICAS
  // ============================================================================

  static async obterEstatisticas(req, res) {
    try {
      const { usuarioId } = req.params;
      console.log('📊 Buscando estatísticas:', usuarioId);
      
      if (typeof servicoWhatsApp.obterEstatisticas !== 'function') {
        return res.status(501).json({ 
          sucesso: false, 
          erro: 'Funcionalidade não implementada' 
        });
      }
      
      const estatisticas = await servicoWhatsApp.obterEstatisticas(usuarioId);
      res.json({
        sucesso: true,
        ...estatisticas
      });
    } catch (erro) {
      console.error('❌ Erro:', erro);
      res.status(500).json({
        sucesso: false,
        erro: 'Erro ao obter estatísticas',
        detalhes: erro.message
      });
    }
  }

  static async obterEstatisticasMensagens(req, res) {
    try {
      const usuarioId = req.usuario.id;
      const contaId = req.usuario.contaId;
      
      console.log(`📊 Buscando estatísticas de mensagens para usuário ${usuarioId} (Conta: ${contaId})`);

      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);
      const fimHoje = new Date();
      fimHoje.setHours(23, 59, 59, 999);

      const conversas = await prisma.conversa.findMany({
        where: { contaId: contaId },
        select: { id: true }
      });

      const conversaIds = conversas.map(c => c.id);

      if (conversaIds.length === 0) {
        console.log('   ⚠️ Nenhuma conversa encontrada para esta conta');
        return res.json({
          mensagensHoje: 0,
          mensagensTotal: 0,
          mensagensRecebidas: 0,
          mensagensEnviadas: 0,
          conversasAtivas: 0
        });
      }

      const mensagensHoje = await prisma.mensagem.count({
        where: {
          conversaId: { in: conversaIds },
          enviadaEm: {
            gte: hoje,
            lte: fimHoje
          }
        }
      });

      const mensagensTotal = await prisma.mensagem.count({
        where: { conversaId: { in: conversaIds } }
      });

      const mensagensRecebidas = await prisma.mensagem.count({
        where: {
          conversaId: { in: conversaIds },
          direcao: 'RECEBIDA',
          enviadaEm: {
            gte: hoje,
            lte: fimHoje
          }
        }
      });

      const mensagensEnviadas = await prisma.mensagem.count({
        where: {
          conversaId: { in: conversaIds },
          direcao: 'ENVIADA',
          enviadaEm: {
            gte: hoje,
            lte: fimHoje
          }
        }
      });

      const conversasAtivas = await prisma.conversa.count({
        where: {
          contaId: contaId,
          mensagens: {
            some: {
              enviadaEm: {
                gte: hoje,
                lte: fimHoje
              }
            }
          }
        }
      });

      console.log(`   ✅ Estatísticas: ${mensagensHoje} mensagens hoje (${mensagensRecebidas} recebidas, ${mensagensEnviadas} enviadas)`);

      res.json({
        sucesso: true,
        mensagensHoje,
        mensagensTotal,
        mensagensRecebidas,
        mensagensEnviadas,
        conversasAtivas,
        data: hoje.toISOString()
      });

    } catch (error) {
      console.error('❌ Erro ao obter estatísticas de mensagens:', error);
      res.status(500).json({ 
        sucesso: false,
        erro: 'Erro ao buscar estatísticas de mensagens',
        detalhes: error.message,
        mensagensHoje: 0
      });
    }
  }

  // ============================================================================
  // WEBHOOK
  // ============================================================================

  static async webhook(req, res) {
    try {
      const { usuarioId, tipo, dados } = req.body;
      console.log('📨 Webhook recebido:', { usuarioId, tipo });
      
      res.json({
        sucesso: true,
        mensagem: 'Webhook recebido'
      });
    } catch (erro) {
      console.error('❌ Erro:', erro);
      res.status(500).json({
        sucesso: false,
        erro: 'Erro ao processar webhook',
        detalhes: erro.message
      });
    }
  }
}

module.exports = UtilsController;