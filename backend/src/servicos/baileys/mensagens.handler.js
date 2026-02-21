// backend/src/servicos/baileys/mensagens.handler.js - ARQUIVO COMPLETO COM BLOQUEIO

const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');

class MensagensHandler {
  constructor(servico, prisma, uploadsDir) {
    this.servico = servico;
    this.prisma = prisma;
    this.uploadsDir = uploadsDir;
  }

  // ✅ Download de mídia
  async downloadMedia(msg) {
    try {
      const { downloadMediaMessage } = require('@whiskeysockets/baileys');
      return await downloadMediaMessage(msg, 'buffer', {});
    } catch (erro) {
      console.error('❌ Erro ao fazer download da mídia:', erro.message);
      return null;
    }
  }

  // ✅ Salvar mídia
  async salvarMidia(buffer, tipo, msg) {
    try {
      const extensao = this.servico.midiaHandler.getExtensaoPorTipo(tipo, msg);
      const nomeArquivo = `${crypto.randomBytes(16).toString('hex')}${extensao}`;
      const caminhoArquivo = path.join(this.uploadsDir, nomeArquivo);

      await fs.writeFile(caminhoArquivo, buffer);

      const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 3000}`;
      return `${baseUrl}/uploads/${nomeArquivo}`;
    } catch (erro) {
      console.error('❌ Erro ao salvar mídia:', erro.message);
      return null;
    }
  }

  // ✅ Extrair conteúdo com tratamento de eventos
  extrairConteudoMensagem(msg) {
    const msgPrincipal = msg.message;
    
    if (!msgPrincipal) return { tipo: 'TEXTO', conteudo: '' };

    // ✅ MENSAGEM DE VISUALIZAÇÃO ÚNICA
    if (msgPrincipal.viewOnceMessage || msgPrincipal.viewOnceMessageV2 || msgPrincipal.viewOnceMessageV2Extension) {
      return {
        tipo: 'VISUALIZACAO_UNICA',
        conteudo: '🔒 Mensagem de visualização única',
        mensagemCompleta: '🔒 Você recebeu uma mensagem de visualização única. Por motivos de privacidade, você só pode abrir essa mensagem no seu celular.'
      };
    }

    // ✅ EVENTOS DE GRUPO
    if (msgPrincipal.protocolMessage) {
      const protocol = msgPrincipal.protocolMessage;
      
      if (protocol.type === 0) {
        return {
          tipo: 'SISTEMA',
          eventoTipo: 'MENSAGEM_APAGADA',
          conteudo: '🗑️ Esta mensagem foi apagada'
        };
      }
    }

    // ✅ NOTIFICAÇÕES DE GRUPO
    if (msg.messageStubType) {
      return this.tratarEventoGrupo(msg);
    }

    // Mensagem de texto
    if (msgPrincipal.conversation) {
      return { tipo: 'TEXTO', conteudo: msgPrincipal.conversation };
    }

    if (msgPrincipal.extendedTextMessage?.text) {
      return { tipo: 'TEXTO', conteudo: msgPrincipal.extendedTextMessage.text };
    }

    // Imagem
    if (msgPrincipal.imageMessage) {
      return {
        tipo: 'IMAGEM',
        conteudo: msgPrincipal.imageMessage.caption || '📷 Imagem',
        legenda: msgPrincipal.imageMessage.caption
      };
    }

    // Vídeo
    if (msgPrincipal.videoMessage) {
      return {
        tipo: 'VIDEO',
        conteudo: msgPrincipal.videoMessage.caption || '🎥 Vídeo',
        legenda: msgPrincipal.videoMessage.caption
      };
    }

    // Áudio
    if (msgPrincipal.audioMessage) {
      const isVoice = msgPrincipal.audioMessage.ptt;
      return {
        tipo: 'AUDIO',
        conteudo: isVoice ? '🎤 Áudio' : '🎵 Áudio'
      };
    }

    // Documento
    if (msgPrincipal.documentMessage) {
      const fileName = msgPrincipal.documentMessage.fileName || 'documento';
      return {
        tipo: 'DOCUMENTO',
        conteudo: `📄 ${fileName}`,
        nomeArquivo: fileName
      };
    }

    // ✅ Sticker/Figurinha
    if (msgPrincipal.stickerMessage) {
      return {
        tipo: 'FIGURINHA',
        conteudo: '🎭 Figurinha'
      };
    }

    // Contato
    if (msgPrincipal.contactMessage || msgPrincipal.contactsArrayMessage) {
      return {
        tipo: 'CONTATO',
        conteudo: '👤 Contato compartilhado'
      };
    }

    // Localização
    if (msgPrincipal.locationMessage) {
      return {
        tipo: 'LOCALIZACAO',
        conteudo: '📍 Localização compartilhada'
      };
    }

    // Reação
    if (msgPrincipal.reactionMessage) {
      return {
        tipo: 'REACAO',
        conteudo: msgPrincipal.reactionMessage.text || '👍'
      };
    }

    return { tipo: 'TEXTO', conteudo: '' };
  }

  // ✅ Tratar eventos de grupo
  tratarEventoGrupo(msg) {
    const stubType = msg.messageStubType;
    const stubParams = msg.messageStubParameters || [];
    const participant = msg.participant?.split('@')[0] || 'Alguém';
    
    let conteudo = '';
    let eventoTipo = 'GRUPO_EVENTO';

    switch (stubType) {
      case 27:
        conteudo = stubParams.length > 0 
          ? `➕ ${stubParams[0].split('@')[0]} foi adicionado ao grupo`
          : `➕ Um membro foi adicionado ao grupo`;
        eventoTipo = 'MEMBRO_ADICIONADO';
        break;

      case 28:
        conteudo = stubParams.length > 0 
          ? `➖ ${stubParams[0].split('@')[0]} foi removido do grupo`
          : `➖ Um membro foi removido do grupo`;
        eventoTipo = 'MEMBRO_REMOVIDO';
        break;

      case 32:
        conteudo = `👋 ${participant} saiu do grupo`;
        eventoTipo = 'MEMBRO_SAIU';
        break;

      case 29:
        conteudo = stubParams.length > 0 
          ? `⭐ ${stubParams[0].split('@')[0]} agora é administrador`
          : `⭐ Um membro foi promovido a administrador`;
        eventoTipo = 'ADMIN_PROMOVIDO';
        break;

      case 30:
        conteudo = stubParams.length > 0 
          ? `⬇️ ${stubParams[0].split('@')[0]} não é mais administrador`
          : `⬇️ Um administrador foi removido`;
        eventoTipo = 'ADMIN_REMOVIDO';
        break;

      case 20:
        conteudo = `🎉 Grupo criado por ${participant}`;
        eventoTipo = 'GRUPO_CRIADO';
        break;

      case 21:
        conteudo = stubParams.length > 0 
          ? `✏️ ${participant} alterou o nome do grupo para "${stubParams[0]}"`
          : `✏️ O nome do grupo foi alterado`;
        eventoTipo = 'GRUPO_NOME_ALTERADO';
        break;

      case 22:
        conteudo = `📝 ${participant} alterou a descrição do grupo`;
        eventoTipo = 'GRUPO_DESCRICAO_ALTERADA';
        break;

      case 1:
        conteudo = `📞 Chamada de voz perdida`;
        eventoTipo = 'CHAMADA_PERDIDA';
        break;

      case 2:
        conteudo = `📹 Chamada de vídeo perdida`;
        eventoTipo = 'CHAMADA_PERDIDA';
        break;

      default:
        conteudo = `ℹ️ Evento no grupo`;
        eventoTipo = 'EVENTO_DESCONHECIDO';
    }

    return {
      tipo: 'SISTEMA',
      eventoTipo: eventoTipo,
      conteudo: conteudo
    };
  }

  // ✅ PROCESSAR MENSAGENS RECEBIDAS (COM BLOQUEIO DE DUPLICAÇÃO)
  async processarMensagensRecebidas(contaId, instancia, messages, socket, isSincronizacao = false) {
    try {
      console.log(`\n📨 [BAILEYS] Processando ${messages.length} mensagens - Instância ${instancia}`);

      const conexao = await this.prisma.conexaoWhatsApp.findUnique({
        where: {
          contaId_instancia: { contaId: contaId, instancia: instancia }
        }
      });

      if (!conexao) {
        console.log(`⚠️ Conexão não encontrada`);
        return;
      }

      // ✅ BLOQUEIO CRÍTICO: Se for Baileys, IGNORA mensagens enviadas (fromMe)
      if (conexao.tipoParceiro === 'BAILEYS') {
        console.log('🛡️ [BAILEYS] Aplicando filtro anti-duplicação...');
        
        const mensagensOriginais = messages.length;
        messages = messages.filter(msg => {
          if (msg.key.fromMe) {
            console.log(`   ⏭️ [BLOQUEIO] Ignorando mensagem ENVIADA: ${msg.key.id}`);
            return false;
          }
          return true;
        });
        
        const mensagensFiltradas = messages.length;
        console.log(`   ✅ Filtradas: ${mensagensOriginais} → ${mensagensFiltradas} (${mensagensOriginais - mensagensFiltradas} bloqueadas)`);
        
        if (messages.length === 0) {
          console.log('✅ Todas as mensagens eram enviadas (fromMe), nada a processar');
          return;
        }
      }

      for (const msg of messages) {
        try {
          if (!msg.key || !msg.key.remoteJid) continue;

          const jid = msg.key.remoteJid;
          const isGrupo = jid.endsWith('@g.us');
          const fromMe = msg.key.fromMe;
          const whatsappId = msg.key.id;

          // ✅ PROTEÇÃO CONTRA DUPLICATAS NO BANCO
          const existe = await this.prisma.mensagem.findUnique({
            where: { whatsappId: whatsappId }
          });

          if (existe) {
            console.log(`   ⏭️ Já existe no banco: ${whatsappId}`);
            continue;
          }

          // Extrair conteúdo
          const { tipo, conteudo, eventoTipo, legenda, nomeArquivo, mensagemCompleta } = this.extrairConteudoMensagem(msg);

          // Buscar/criar conversa
          let conversa = await this.prisma.conversa.findFirst({
            where: {
              numeroCliente: jid,
              contaId: contaId,
              conexaoWhatsAppId: conexao.id
            }
          });

          if (!conversa) {
            let nomeCliente = jid.split('@')[0];
            
            if (isGrupo) {
              try {
                const metadata = await socket.groupMetadata(jid);
                nomeCliente = metadata.subject;
              } catch (e) {
                console.log(`⚠️ Erro ao buscar metadata do grupo`);
              }
            } else {
              const pushname = msg.pushName || msg.verifiedBizName;
              if (pushname) nomeCliente = pushname;
            }

            conversa = await this.prisma.conversa.create({
              data: {
                numeroCliente: jid,
                nomeCliente: nomeCliente,
                nomeContato: nomeCliente,
                nomeGrupo: isGrupo ? nomeCliente : null,
                isGrupo: isGrupo,
                statusConversa: 'CAIXA_ENTRADA',
                conexaoWhatsAppId: conexao.id,
                contaId: contaId
              }
            });
          }

          // Timestamp
          const timestamp = msg.messageTimestamp
            ? new Date(Number(msg.messageTimestamp) * 1000)
            : new Date();

          // ✅ Nome do remetente
          let remetenteNome = 'Desconhecido';
          let participant = null;
          let participantNome = null;
          let fotoRemetente = null;

          if (isGrupo && !fromMe && msg.participant) {
            participant = msg.participant;
            participantNome = msg.pushName || participant.split('@')[0];
            remetenteNome = participantNome;
            
            try {
              fotoRemetente = await socket.profilePictureUrl(participant, 'image');
            } catch (e) {}
          } else if (fromMe) {
            remetenteNome = conexao.nomeExibicao || 'Você';
          } else {
            remetenteNome = msg.pushName || conversa.nomeCliente || jid.split('@')[0];
            
            try {
              fotoRemetente = await socket.profilePictureUrl(jid, 'image');
            } catch (e) {}
          }

          // ✅ Resposta/Quote
          let replyParaId = null;
          let mensagemCitadaAutor = null;
          let mensagemCitadaConteudo = null;

          if (msg.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
            const quotedId = msg.message.extendedTextMessage.contextInfo.stanzaId;
            replyParaId = quotedId;
            
            const citada = await this.prisma.mensagem.findUnique({
              where: { whatsappId: quotedId }
            });

            if (citada) {
              mensagemCitadaAutor = citada.remetenteNome;
              mensagemCitadaConteudo = citada.conteudo;
            }
          }

          // ✅ Processar mídia
          let mediaUrl = null;
          if (['IMAGEM', 'VIDEO', 'AUDIO', 'DOCUMENTO', 'FIGURINHA'].includes(tipo)) {
            try {
              const buffer = await this.downloadMedia(msg);
              if (buffer) {
                mediaUrl = await this.salvarMidia(buffer, tipo, msg);
              }
            } catch (erro) {
              console.error(`❌ Erro ao baixar mídia:`, erro.message);
            }
          }

          // ✅ Criar mensagem NO BANCO
          try {
            await this.prisma.mensagem.create({
              data: {
                whatsappId: whatsappId,
                conteudo: mensagemCompleta || conteudo || '',
                tipo: tipo,
                eventoTipo: eventoTipo || null,
                direcao: fromMe ? 'ENVIADA' : 'RECEBIDA',
                lida: fromMe || isSincronizacao,
                statusMensagem: fromMe ? 'enviada' : 'recebida',
                mediaUrl: mediaUrl,
                legendaImagem: legenda || null,
                midiaNome: nomeArquivo || null,
                remetenteNome: remetenteNome,
                participant: participant,
                participantNome: participantNome,
                fotoRemetente: fotoRemetente,
                replyParaId: replyParaId,
                mensagemCitadaAutor: mensagemCitadaAutor,
                mensagemCitadaConteudo: mensagemCitadaConteudo,
                timestamp: timestamp,
                conversaId: conversa.id,
                contaId: contaId,
                enviadaEm: timestamp,
                enviadaPor: remetenteNome
              }
            });

            const logIcon = tipo === 'SISTEMA' ? 'ℹ️' : 
                           tipo === 'IMAGEM' ? '📷' :
                           tipo === 'VIDEO' ? '🎥' :
                           tipo === 'AUDIO' ? '🎤' :
                           tipo === 'FIGURINHA' ? '🎭' : '💬';

            console.log(`   ${logIcon} ${fromMe ? '📤' : '📥'} ${remetenteNome}: ${conteudo.substring(0, 40)}`);

            // Atualizar conversa
            if (!fromMe && !isSincronizacao) {
              await this.prisma.conversa.update({
                where: { id: conversa.id },
                data: {
                  naoLidas: { increment: 1 },
                  ultimaMensagemEm: timestamp
                }
              });
            } else {
              await this.prisma.conversa.update({
                where: { id: conversa.id },
                data: { ultimaMensagemEm: timestamp }
              });
            }

          } catch (erroCreate) {
            if (erroCreate.code === 'P2002') {
              console.log(`   ⚠️ Duplicata detectada: ${whatsappId}`);
            } else {
              throw erroCreate;
            }
          }

        } catch (erro) {
          console.error(`❌ Erro ao processar mensagem individual:`, erro.message);
        }
      }

      console.log(`✅ [BAILEYS] Processamento concluído\n`);

    } catch (erro) {
      console.error(`❌ [BAILEYS] Erro geral no processamento:`, erro);
    }
  }

  // ✅ OBTER MENSAGENS (DESC para paginação)
  async obterMensagensConversa(contaId, numeroCliente, limite = 50, offset = 0) {
    try {
      const conversa = await this.prisma.conversa.findFirst({
        where: {
          contaId: contaId,
          numeroCliente: numeroCliente
        }
      });

      if (!conversa) {
        return { mensagens: [], total: 0, temMais: false };
      }

      const total = await this.prisma.mensagem.count({
        where: { conversaId: conversa.id }
      });

      const mensagens = await this.prisma.mensagem.findMany({
        where: { conversaId: conversa.id },
        orderBy: { timestamp: 'desc' },
        take: limite,
        skip: offset
      });

      return {
        mensagens: mensagens,
        total: total,
        temMais: (offset + limite) < total
      };

    } catch (erro) {
      console.error(`❌ Erro ao obter mensagens:`, erro);
      return { mensagens: [], total: 0, temMais: false };
    }
  }

  // ✅ ENVIAR MENSAGEM (usado pelo botão "Reenviar pela alternativa")
  async enviarMensagem(contaId, instancia, numero, mensagem, quotedMsgId) {
    try {
      const chave = this.servico.gerarChaveCliente(contaId, instancia);
      const cliente = this.servico.clientes[chave];

      if (!cliente || cliente.estado !== 'conectado') {
        throw new Error('WhatsApp Baileys não conectado');
      }

      let jid = numero;
      if (!numero.includes('@')) {
        const numeroFormatado = numero.replace(/\D/g, '');
        jid = numeroFormatado + '@s.whatsapp.net';
      }

      const opcoesMensagem = { text: mensagem };

      if (quotedMsgId) {
        const citada = await this.prisma.mensagem.findUnique({
          where: { whatsappId: quotedMsgId }
        });

        if (citada) {
          opcoesMensagem.quoted = {
            key: {
              remoteJid: jid,
              id: quotedMsgId,
              fromMe: citada.direcao === 'ENVIADA'
            }
          };
        }
      }

      console.log(`📤 [BAILEYS] Enviando mensagem via instância ${instancia}...`);
      const resultado = await cliente.socket.sendMessage(jid, opcoesMensagem);

      const conexao = await this.prisma.conexaoWhatsApp.findUnique({
        where: {
          contaId_instancia: { contaId: contaId, instancia: instancia }
        }
      });

      if (conexao) {
        let conversa = await this.prisma.conversa.findFirst({
          where: {
            contaId: contaId,
            numeroCliente: jid,
            conexaoWhatsAppId: conexao.id
          }
        });

        if (!conversa) {
          conversa = await this.prisma.conversa.create({
            data: {
              numeroCliente: jid,
              nomeCliente: jid.split('@')[0],
              nomeContato: jid.split('@')[0],
              isGrupo: jid.endsWith('@g.us'),
              statusConversa: 'CAIXA_ENTRADA',
              conexaoWhatsAppId: conexao.id,
              contaId: contaId
            }
          });
        }

        const timestamp = new Date();

        // ✅ Salva mensagem enviada NO BANCO
        await this.prisma.mensagem.create({
          data: {
            whatsappId: resultado.key.id,
            conteudo: mensagem,
            tipo: 'TEXTO',
            direcao: 'ENVIADA',
            lida: true,
            statusMensagem: 'enviada',
            replyParaId: quotedMsgId || null,
            timestamp: timestamp,
            conversaId: conversa.id,
            contaId: contaId,
            enviadaEm: timestamp,
            enviadaPor: cliente.nome || 'Você',
            remetenteNome: cliente.nome || 'Você'
          }
        });

        await this.prisma.conversa.update({
          where: { id: conversa.id },
          data: { ultimaMensagemEm: timestamp }
        });
      }

      console.log(`✅ [BAILEYS] Mensagem enviada com sucesso!`);

      return {
        sucesso: true,
        id: resultado.key.id,
        status: 'enviada',
        timestamp: new Date().toISOString()
      };

    } catch (erro) {
      console.error('❌ [BAILEYS] Erro ao enviar mensagem:', erro.message);
      throw erro;
    }
  }

  // ✅ ATUALIZAR STATUS DE MENSAGENS
  async atualizarStatusMensagens(updates) {
    try {
      for (const update of updates) {
        const { key, update: status } = update;

        if (status.status) {
          let novoStatus = 'enviada';
          
          if (status.status === 3) novoStatus = 'lida';
          else if (status.status === 2) novoStatus = 'entregue';
          else if (status.status === 1) novoStatus = 'enviada';

          await this.prisma.mensagem.updateMany({
            where: { whatsappId: key.id },
            data: { statusMensagem: novoStatus }
          });
        }
      }
    } catch (erro) {
      console.error('❌ Erro ao atualizar status:', erro);
    }
  }
}

module.exports = MensagensHandler;