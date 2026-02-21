// backend/src/servicos/baileys/conversas.handler.js - VERSÃO FINAL CORRIGIDA

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class ConversasHandler {
  constructor(servico, prismaInstance) {
    this.servico = servico;
    this.prisma = prismaInstance || prisma;
  }

  // ✅ CORRIGIDO: Obter conversas usando contaId
  async obterConversas(contaId, filtro = 'TODAS', pesquisa = '', instancia = null) {
    try {
      console.log(`\n${'='.repeat(40)}`);
      console.log(`🔍 [CONVERSAS] INÍCIO - Identificação Robusta`);
      console.log(`${'='.repeat(40)}`);
      console.log(`📥 Parâmetros:`, { contaId, filtro, pesquisa });

      if (!contaId) {
        console.log(`❌ contaId não fornecido`);
        return { conversas: [], total: 0 };
      }

      console.log(`✅ Conta ID: ${contaId}`);

      // ✅ Buscar conexões ativas
      const conexoesAtivas = await this.prisma.conexaoWhatsApp.findMany({
        where: {
          contaId: contaId,
          status: 'CONECTADO'
        },
        select: {
          id: true,
          numeroWhatsApp: true,
          nomeInstancia: true,
          instancia: true
        }
      });

      console.log(`📱 Conexões ativas encontradas: ${conexoesAtivas.length}`);
      conexoesAtivas.forEach((conn, idx) => {
        console.log(`   ${idx + 1}. ${conn.numeroWhatsApp} (${conn.nomeInstancia}) - Status: CONECTADO`);
      });

      if (conexoesAtivas.length === 0) {
        console.log(`⚠️ Nenhuma conexão ativa encontrada`);
        return { conversas: [], total: 0 };
      }

      // ✅ Construir filtro base
      const filtroBase = {
        contaId: contaId,
        conexaoWhatsAppId: {
          in: conexoesAtivas.map(c => c.id)
        }
      };

      // ✅ Aplicar filtro de status
      if (filtro === 'TODAS') {
        filtroBase.statusConversa = { not: 'ARQUIVADA' };
      } else if (filtro === 'NAO_LIDAS') {
        filtroBase.statusConversa = { not: 'ARQUIVADA' };
        filtroBase.naoLidas = { gt: 0 };
      } else if (filtro === 'FAVORITAS') {
        filtroBase.statusConversa = { not: 'ARQUIVADA' };
        filtroBase.favorita = true;
      } else if (filtro === 'GRUPOS') {
        filtroBase.statusConversa = { not: 'ARQUIVADA' };
        filtroBase.isGrupo = true;
      } else if (filtro === 'ARQUIVADA') {
        filtroBase.statusConversa = 'ARQUIVADA';
      }

      // ✅ Aplicar pesquisa se houver
      if (pesquisa && pesquisa.trim()) {
        filtroBase.OR = [
          { nomeCliente: { contains: pesquisa, mode: 'insensitive' } },
          { numeroCliente: { contains: pesquisa } }
        ];
      }

      console.log(`🔧 Filtro aplicado:`, JSON.stringify(filtroBase, null, 2));

      // ✅ Buscar conversas
      const conversas = await this.prisma.conversa.findMany({
        where: filtroBase,
        include: {
          conexaoWhatsApp: {
            select: {
              numeroWhatsApp: true,
              nomeInstancia: true,
              corIdentificacao: true
            }
          },
          mensagens: {
            take: 1,
            orderBy: { timestamp: 'desc' },
            select: {
              id: true,
              conteudo: true,
              tipo: true,
              timestamp: true,
              direcao: true,
              lida: true,
              statusMensagem: true
            }
          }
        },
        orderBy: [
          { fixada: 'desc' },
          { ultimaMensagemEm: 'desc' }
        ]
      });

      console.log(`📊 Total de conversas encontradas: ${conversas.length}`);

      if (conversas.length === 0) {
        console.log(`\n⚠️ NENHUMA CONVERSA ENCONTRADA!`);
        console.log(`Possíveis causas:`);
        console.log(`   1. Não há conversas para as conexões ativas`);
        console.log(`   2. Filtro muito restritivo`);
        console.log(`   3. Mensagens não foram sincronizadas`);
      } else {
        console.log(`\n✅ Conversas encontradas (primeiras 5):`);
        conversas.slice(0, 5).forEach((conv, idx) => {
          console.log(`   ${idx + 1}. ${conv.nomeCliente || conv.numeroCliente}`);
          console.log(`      - Número: ${conv.numeroCliente}`);
          console.log(`      - Preview: ${conv.mensagens[0]?.conteudo?.substring(0, 30) || 'Sem mensagens'}`);
          console.log(`      - Não lidas: ${conv.naoLidas || 0}`);
          console.log(`      - Conexão: ${conv.conexaoWhatsApp?.numeroWhatsApp} (${conv.conexaoWhatsApp?.nomeInstancia})`);
        });
      }

      // ✅ Formatar conversas para retorno
      const conversasFormatadas = conversas.map(conv => ({
        id: conv.id,
        numeroCliente: conv.numeroCliente,
        nomeCliente: conv.nomeCliente || conv.numeroCliente,
        fotoPerfil: conv.fotoPerfil,
        isGrupo: conv.isGrupo || false,
        nomeGrupo: conv.nomeGrupo,
        statusConversa: conv.statusConversa,
        fixada: conv.fixada || false,
        favorita: conv.favorita || false,
        naoLidas: conv.naoLidas || 0,
        ultimaMensagemEm: conv.ultimaMensagemEm,
        mensagemPreview: conv.mensagens[0]?.conteudo || '',
        tipoPreview: conv.mensagens[0]?.tipo || 'TEXTO',
        direcaoPreview: conv.mensagens[0]?.direcao || 'RECEBIDA',
        statusMensagem: conv.mensagens[0]?.statusMensagem,
        conexaoWhatsApp: {
          numero: conv.conexaoWhatsApp?.numeroWhatsApp,
          nome: conv.conexaoWhatsApp?.nomeInstancia,
          cor: conv.conexaoWhatsApp?.corIdentificacao
        }
      }));

      console.log(`\n${'='.repeat(40)}`);
      console.log(`✅ [CONVERSAS] SUCESSO`);
      console.log(`📤 Retornando: ${conversasFormatadas.length} conversas`);
      console.log(`${'='.repeat(40)}\n`);

      return {
        conversas: conversasFormatadas,
        total: conversasFormatadas.length
      };

    } catch (erro) {
      console.error(`\n❌ [CONVERSAS] ERRO:`, erro);
      console.error(`Stack:`, erro.stack);
      return { conversas: [], total: 0 };
    }
  }

  // ✅ Processar chats iniciais do WhatsApp
  async processarChatsIniciais(contaId, instancia, chats, socket) {
    try {
      console.log(`\n💬 Processando ${chats.length} chats iniciais - Instância ${instancia}`);

      const conexao = await this.prisma.conexaoWhatsApp.findUnique({
        where: {
          contaId_instancia: {
            contaId: contaId,
            instancia: instancia
          }
        }
      });

      if (!conexao) {
        console.log(`⚠️ Conexão não encontrada para instância ${instancia}`);
        return;
      }

      let criadas = 0;
      let atualizadas = 0;

      for (const chat of chats) {
        try {
          const jid = chat.id;
          const isGrupo = jid.endsWith('@g.us');
          
          // ✅ Buscar nome do grupo se necessário
          let nomeChat = chat.name || jid.split('@')[0];
          if (isGrupo && !chat.name) {
            try {
              const metadata = await socket.groupMetadata(jid);
              nomeChat = metadata.subject;
            } catch (e) {
              console.log(`⚠️ Erro ao buscar metadata do grupo ${jid}`);
            }
          }

          const ultimaMensagemTimestamp = chat.conversationTimestamp 
            ? new Date(Number(chat.conversationTimestamp) * 1000)
            : new Date();

          const conversaExistente = await this.prisma.conversa.findFirst({
            where: {
              numeroCliente: jid,
              contaId: contaId,
              conexaoWhatsAppId: conexao.id
            }
          });

          if (conversaExistente) {
            // Atualizar conversa existente
            await this.prisma.conversa.update({
              where: { id: conversaExistente.id },
              data: {
                nomeCliente: nomeChat,
                nomeGrupo: isGrupo ? nomeChat : null,
                naoLidas: chat.unreadCount || 0,
                ultimaMensagemEm: ultimaMensagemTimestamp,
                fixada: chat.pinned || false
              }
            });
            atualizadas++;
          } else {
            // Criar nova conversa
            await this.prisma.conversa.create({
              data: {
                numeroCliente: jid,
                nomeCliente: nomeChat,
                nomeGrupo: isGrupo ? nomeChat : null,
                isGrupo: isGrupo,
                statusConversa: 'CAIXA_ENTRADA',
                naoLidas: chat.unreadCount || 0,
                ultimaMensagemEm: ultimaMensagemTimestamp,
                fixada: chat.pinned || false,
                conexaoWhatsAppId: conexao.id,
                contaId: contaId
              }
            });
            criadas++;
          }

        } catch (erro) {
          console.error(`❌ Erro ao processar chat ${chat.id}:`, erro.message);
        }
      }

      console.log(`✅ Chats processados: ${criadas} criadas, ${atualizadas} atualizadas`);

    } catch (erro) {
      console.error(`❌ Erro ao processar chats iniciais:`, erro);
    }
  }

  // ✅ Marcar como lida
  async marcarComoLida(contaId, numeroCliente) {
    try {
      const conversa = await this.prisma.conversa.findFirst({
        where: {
          contaId: contaId,
          numeroCliente: numeroCliente
        }
      });

      if (!conversa) {
        return { sucesso: false, erro: 'Conversa não encontrada' };
      }

      await this.prisma.conversa.update({
        where: { id: conversa.id },
        data: { naoLidas: 0 }
      });

      await this.prisma.mensagem.updateMany({
        where: {
          conversaId: conversa.id,
          lida: false
        },
        data: { lida: true }
      });

      return { sucesso: true, mensagem: 'Conversa marcada como lida' };
    } catch (erro) {
      console.error('❌ Erro ao marcar como lida:', erro);
      throw erro;
    }
  }

  // ✅ Marcar como não lida
  async marcarComoNaoLida(contaId, numeroCliente) {
    try {
      const conversa = await this.prisma.conversa.findFirst({
        where: {
          contaId: contaId,
          numeroCliente: numeroCliente
        }
      });

      if (!conversa) {
        return { sucesso: false, erro: 'Conversa não encontrada' };
      }

      await this.prisma.conversa.update({
        where: { id: conversa.id },
        data: { naoLidas: 1 }
      });

      return { sucesso: true, mensagem: 'Conversa marcada como não lida' };
    } catch (erro) {
      console.error('❌ Erro ao marcar como não lida:', erro);
      throw erro;
    }
  }

  // ✅ Toggle fixar conversa
  async toggleFixarConversa(contaId, numeroCliente) {
    try {
      const conversa = await this.prisma.conversa.findFirst({
        where: {
          contaId: contaId,
          numeroCliente: numeroCliente
        }
      });

      if (!conversa) {
        return { sucesso: false, erro: 'Conversa não encontrada' };
      }

      const novoEstado = !conversa.fixada;

      await this.prisma.conversa.update({
        where: { id: conversa.id },
        data: { fixada: novoEstado }
      });

      return {
        sucesso: true,
        fixada: novoEstado,
        mensagem: novoEstado ? 'Conversa fixada' : 'Conversa desfixada'
      };
    } catch (erro) {
      console.error('❌ Erro ao fixar conversa:', erro);
      throw erro;
    }
  }

  // ✅ Atualizar status da conversa
  async atualizarStatusConversa(contaId, numeroCliente, novoStatus) {
    try {
      const conversa = await this.prisma.conversa.findFirst({
        where: {
          contaId: contaId,
          numeroCliente: numeroCliente
        }
      });

      if (!conversa) {
        return { sucesso: false, erro: 'Conversa não encontrada' };
      }

      await this.prisma.conversa.update({
        where: { id: conversa.id },
        data: { statusConversa: novoStatus }
      });

      return {
        sucesso: true,
        status: novoStatus,
        mensagem: 'Status atualizado'
      };
    } catch (erro) {
      console.error('❌ Erro ao atualizar status:', erro);
      throw erro;
    }
  }

  // ✅ Processar anotação interna
  async processarAnotacaoInterna(contaId, numeroCliente, conteudo, cor, replyParaId) {
    try {
      const conversa = await this.prisma.conversa.findFirst({
        where: {
          contaId: contaId,
          numeroCliente: numeroCliente
        }
      });

      if (!conversa) {
        throw new Error('Conversa não encontrada');
      }

      const anotacao = await this.prisma.mensagem.create({
        data: {
          conteudo: conteudo,
          tipo: 'ANOTACAO',
          direcao: 'ANOTACAO',
          lida: true,
          statusMensagem: 'anotacao',
          corAnotacao: cor || 'amarelo',
          replyParaId: replyParaId || null,
          conversaId: conversa.id,
          contaId: contaId,
          timestamp: new Date(),
          enviadaEm: new Date(),
          enviadaPor: 'Sistema'
        }
      });

      return {
        sucesso: true,
        anotacao: anotacao
      };
    } catch (erro) {
      console.error('❌ Erro ao criar anotação:', erro);
      throw erro;
    }
  }
}

module.exports = ConversasHandler;