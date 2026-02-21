// backend/src/servicos/baileys/midia.handler.js

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

class MidiaHandler {
  constructor(servico, prisma, uploadsDir) {
    this.servico = servico;
    this.prisma = prisma;
    this.uploadsDir = uploadsDir;
  }

  getExtensaoPorTipo(tipo, msg) {
    const msgPrincipal = msg?.message;
    let mimetype = msgPrincipal?.imageMessage?.mimetype ||
      msgPrincipal?.videoMessage?.mimetype ||
      msgPrincipal?.audioMessage?.mimetype ||
      msgPrincipal?.documentMessage?.mimetype ||
      msgPrincipal?.stickerMessage?.mimetype;

    if (mimetype) {
      const parts = mimetype.split('/');
      const subtype = parts[1]?.split(';')[0];
      if (subtype === 'jpeg') return '.jpg';
      if (subtype === 'png') return '.png';
      if (subtype === 'webp') return '.webp';
      if (subtype === 'mp4') return '.mp4';
      if (subtype === 'ogg' || subtype === 'oga') return '.ogg';
      if (mimetype.startsWith('audio/aac')) return '.aac';
      if (subtype === 'mpeg') return '.mp3';
      if (subtype === 'pdf') return '.pdf';
      if (subtype === 'vnd.openxmlformats-officedocument.wordprocessingml.document') return '.docx';
      if (subtype === 'vnd.openxmlformats-officedocument.spreadsheetml.sheet') return '.xlsx';
      if (subtype === 'vnd.openxmlformats-officedocument.presentationml.presentation') return '.pptx';
      if (subtype === 'msword') return '.doc';
      if (subtype === 'vnd.ms-excel') return '.xls';
      if (subtype === 'vnd.ms-powerpoint') return '.ppt';
      if (subtype === 'plain') return '.txt';

      if (['gif', 'tiff', 'avi', 'mov', 'wav', 'zip', 'rar'].includes(subtype)) return `.${subtype}`;
    }

    switch (tipo) {
      case 'IMAGEM': return '.jpg';
      case 'VIDEO': return '.mp4';
      case 'AUDIO': return '.ogg';
      case 'DOCUMENTO': return '';
      case 'FIGURINHA': return '.webp';
      default: return '';
    }
  }

  async enviarMidia(usuarioId, numero, arquivo, legenda) {
    try {
      const cliente = this.servico.clientes[usuarioId];
      if (!cliente || cliente.estado !== 'conectado') {
        throw new Error('WhatsApp não conectado');
      }

      let jid = numero;
      let numeroFormatado = '';
      let isGrupo = numero.endsWith('@g.us');

      if (!numero.includes('@')) {
        numeroFormatado = numero.replace(/\D/g, '');
        if (!numeroFormatado.startsWith('55') && numeroFormatado.length > 8) {
          numeroFormatado = '55' + numeroFormatado;
        }
        jid = numeroFormatado + '@s.whatsapp.net';
        isGrupo = false;
      } else {
        numeroFormatado = jid.split('@')[0];
      }

      console.log(`📤 Enviando mídia para ${jid} (Grupo: ${isGrupo})`);

      const tipo = arquivo.mimetype.split('/')[0];
      let mensagemOpcoes = {};
      let tipoMensagemPrisma = 'DOCUMENTO';

      if (!arquivo || !Buffer.isBuffer(arquivo.buffer)) {
        throw new Error("O buffer do arquivo está inválido ou ausente.");
      }

      let mediaUrl = null;
      let nomeArquivoSalvo = null;
      try {
        const extensao = path.extname(arquivo.originalname) || this.getExtensaoPorTipo(tipo.toUpperCase(), { message: null });
        nomeArquivoSalvo = `${crypto.randomBytes(16).toString('hex')}${extensao}`;
        const caminhoArquivo = path.join(this.uploadsDir, nomeArquivoSalvo);
        await fs.promises.writeFile(caminhoArquivo, arquivo.buffer);
        const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 3000}`;
        mediaUrl = `${baseUrl}/uploads/${nomeArquivoSalvo}`;
        console.log(`✅ Mídia enviada salva: ${mediaUrl}`);
      } catch (saveError) {
        console.error(`❌ Erro ao salvar mídia enviada:`, saveError);
      }

      if (tipo === 'image') {
        mensagemOpcoes = { image: arquivo.buffer, caption: legenda || undefined };
        tipoMensagemPrisma = 'IMAGEM';
      } else if (tipo === 'video') {
        mensagemOpcoes = { video: arquivo.buffer, caption: legenda || undefined };
        tipoMensagemPrisma = 'VIDEO';
      } else if (tipo === 'audio') {
        mensagemOpcoes = { audio: arquivo.buffer, mimetype: arquivo.mimetype };
        tipoMensagemPrisma = 'AUDIO';
      } else {
        mensagemOpcoes = { document: arquivo.buffer, fileName: arquivo.originalname, mimetype: arquivo.mimetype };
        tipoMensagemPrisma = 'DOCUMENTO';
      }

      const resultado = await cliente.socket.sendMessage(jid, mensagemOpcoes);
      const timestampMsg = resultado.messageTimestamp ?
        (typeof resultado.messageTimestamp === 'bigint' ?
          resultado.messageTimestamp :
          BigInt(resultado.messageTimestamp.low)
        ) : BigInt(Date.now() / 1000);
      const dataMensagem = new Date(Number(timestampMsg) * 1000);

      const usuario = await this.prisma.usuario.findUnique({ where: { id: usuarioId } });
      if (usuario) {
        const contaId = usuario.contaId;
        const conexao = await this.prisma.conexaoWhatsApp.findFirst({
          where: { contaId: contaId, numeroWhatsApp: cliente.numero }
        });

        if (conexao) {
          let conversa = await this.prisma.conversa.findFirst({
            where: { contaId: contaId, numeroCliente: jid }
          });

          if (!conversa) {
            let nomeClienteInicial = isGrupo ? jid.split('@')[0] : numeroFormatado;
            conversa = await this.prisma.conversa.create({
              data: {
                numeroCliente: jid,
                nomeCliente: nomeClienteInicial,
                isGrupo: isGrupo,
                statusConversa: 'CAIXA_ENTRADA',
                conexaoWhatsAppId: conexao.id,
                contaId: contaId
              }
            });
          }

          await this.prisma.mensagem.create({
            data: {
              whatsappId: resultado.key.id,
              conteudo: legenda || `📎 ${arquivo.originalname}`,
              tipo: tipoMensagemPrisma,
              direcao: 'ENVIADA',
              lida: true,
              statusMensagem: 'enviada',
              mediaUrl: mediaUrl,
              midiaNome: arquivo.originalname,
              legendaImagem: tipoMensagemPrisma === 'IMAGEM' || tipoMensagemPrisma === 'VIDEO' ? legenda : null,
              usuarioId: usuarioId,
              timestamp: dataMensagem,
              conversaId: conversa.id,
              contaId: contaId,
              enviadaEm: dataMensagem,
              enviadaPor: cliente.numero || 'Sistema'
            }
          });

          await this.prisma.conversa.update({
            where: { id: conversa.id },
            data: { ultimaMensagemEm: dataMensagem }
          });
        }
      }

      return {
        sucesso: true,
        id: resultado.key.id,
        status: 'enviada',
        timestamp: dataMensagem.toISOString()
      };
    } catch (erro) {
      console.error('❌ Erro geral em enviarMidia:', erro.message);
      throw erro;
    }
  }
}

module.exports = MidiaHandler;