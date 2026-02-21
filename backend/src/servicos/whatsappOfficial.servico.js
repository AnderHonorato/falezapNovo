// backend/src/servicos/whatsappOfficial.servico.js - ARQUIVO COMPLETO

const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class WhatsAppOfficialService {
  
  constructor() {
    this.apiUrl = process.env.WHATSAPP_API_URL || 'https://graph.facebook.com/v21.0';
    this.phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    this.accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
    this.timeout = parseInt(process.env.WHATSAPP_API_TIMEOUT) || 30000;
    this.maxRetries = parseInt(process.env.WHATSAPP_MAX_RETRIES) || 3;
    this.debugMode = process.env.WHATSAPP_DEBUG_MODE === 'true';
    this.defaultTemplate = process.env.WHATSAPP_DEFAULT_TEMPLATE_NAME || 'inicio_atendimento';

    if (!this.phoneNumberId || !this.accessToken) {
      console.error('❌ ERRO: Credenciais do WhatsApp não configuradas!');
      console.error('Configure WHATSAPP_PHONE_NUMBER_ID e WHATSAPP_ACCESS_TOKEN no .env');
    } else {
      console.log('✅ WhatsApp Official API inicializado');
      console.log(`📱 Phone ID: ${this.phoneNumberId}`);
      console.log(`🌐 API URL: ${this.apiUrl}`);
    }
  }

  // ============================================
  // ✅ VERIFICADOR DE JANELA DE 24H
  // ============================================

  async estaNaJanelaDe24h(numero) {
    try {
      const numeroLimpo = this.formatarNumero(numero);
      
      const conversa = await prisma.conversa.findFirst({
        where: { numeroCliente: numeroLimpo },
        select: {
          mensagens: {
            where: { direcao: 'RECEBIDA' },
            orderBy: { enviadaEm: 'desc' },
            take: 1,
            select: { enviadaEm: true }
          }
        }
      });

      if (!conversa || conversa.mensagens.length === 0) {
        console.log(`[Janela 24h] FECHADA para ${numero} (sem mensagens recebidas)`);
        return false;
      }

      const ultimaMensagemRecebida = conversa.mensagens[0].enviadaEm;
      const agora = new Date();
      const diffMs = agora.getTime() - new Date(ultimaMensagemRecebida).getTime();
      const diffHoras = diffMs / (1000 * 60 * 60);

      if (diffHoras < 24) {
        console.log(`[Janela 24h] ABERTA para ${numero} (última msg há ${diffHoras.toFixed(1)}h)`);
        return true;
      } else {
        console.log(`[Janela 24h] FECHADA para ${numero} (última msg há ${diffHoras.toFixed(1)}h)`);
        return false;
      }

    } catch (error) {
      console.error('❌ Erro ao checar janela de 24h:', error.message);
      return false;
    }
  }

  // ============================================
  // ✅ ENVIAR TEXTO (COM LÓGICA DE JANELA)
  // ============================================

  async enviarTexto(numero, mensagem, quotedMsgId = null) {
    try {
      const url = `${this.apiUrl}/${this.phoneNumberId}/messages`;
      
      const janelaAberta = await this.estaNaJanelaDe24h(numero);

      let payload;

      if (janelaAberta) {
        console.log(`[Envio] Janela aberta, enviando texto normal para ${numero}`);
        payload = {
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: this.formatarNumero(numero),
          type: 'text',
          text: {
            preview_url: true,
            body: mensagem
          }
        };

        if (quotedMsgId) {
          payload.context = {
            message_id: quotedMsgId
          };
        }
      } else {
        console.warn(`[Envio] Janela fechada, enviando TEMPLATE para ${numero}`);
        
        if (quotedMsgId) {
          console.warn('[Envio] Resposta (quotedMsgId) removida, pois não é suportada com templates.');
        }

        const componentes = [this.criarComponenteBody([mensagem])];
        
        payload = {
          messaging_product: 'whatsapp',
          to: this.formatarNumero(numero),
          type: 'template',
          template: {
            name: this.defaultTemplate,
            language: { code: 'pt_BR' },
            components: componentes
          }
        };
      }

      const response = await this.fazerRequisicao('POST', url, payload);

      if (this.debugMode) {
        console.log('✅ Mensagem enviada:', {
          para: numero,
          mensagemId: response.messages?.[0]?.id,
          status: response.messages?.[0]?.message_status
        });
      }

      return {
        success: true,
        key: {
          id: response.messages?.[0]?.id,
          fromMe: true
        },
        messageId: response.messages?.[0]?.id,
        timestamp: Date.now()
      };

    } catch (error) {
      console.error('❌ Erro ao enviar texto:', error.message);
      throw this.tratarErro(error);
    }
  }

  // ============================================
  // FORMATAÇÃO DE TEXTO
  // ============================================

  formatarTexto(texto, formato) {
    const formatadores = {
      negrito: (t) => `*${t}*`,
      italico: (t) => `_${t}_`,
      riscado: (t) => `~${t}~`,
      monoespacado: (t) => `\`\`\`${t}\`\`\``
    };

    return formatadores[formato] ? formatadores[formato](texto) : texto;
  }

  aplicarFormatacao(texto, formatacoes) {
    if (!formatacoes || formatacoes.length === 0) {
      return texto;
    }

    const formatacoesOrdenadas = [...formatacoes].sort((a, b) => b.inicio - a.inicio);
    let textoFormatado = texto;

    formatacoesOrdenadas.forEach(fmt => {
      const { inicio, fim, tipo } = fmt;
      const antes = textoFormatado.substring(0, inicio);
      const parte = textoFormatado.substring(inicio, fim);
      const depois = textoFormatado.substring(fim);
      
      const parteFormatada = this.formatarTexto(parte, tipo);
      textoFormatado = antes + parteFormatada + depois;
    });

    return textoFormatado;
  }

  // ============================================
  // ENVIAR MÍDIA
  // ============================================

  async enviarImagem(numero, urlOuCaminho, legenda = '') {
    try {
      const url = `${this.apiUrl}/${this.phoneNumberId}/messages`;
      
      let mediaId;
      
      if (urlOuCaminho.startsWith('/') || urlOuCaminho.startsWith('C:')) {
        mediaId = await this.uploadMidia(urlOuCaminho, 'image/jpeg');
      }

      const payload = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: this.formatarNumero(numero),
        type: 'image',
        image: mediaId 
          ? { id: mediaId }
          : { link: urlOuCaminho }
      };

      if (legenda) {
        payload.image.caption = legenda;
      }

      const response = await this.fazerRequisicao('POST', url, payload);

      return {
        success: true,
        key: { id: response.messages?.[0]?.id },
        messageId: response.messages?.[0]?.id
      };

    } catch (error) {
      console.error('❌ Erro ao enviar imagem:', error.message);
      throw this.tratarErro(error);
    }
  }

  async enviarDocumento(numero, urlOuCaminho, nomeArquivo, legenda = '') {
    try {
      const url = `${this.apiUrl}/${this.phoneNumberId}/messages`;
      
      let mediaId;
      
      if (urlOuCaminho.startsWith('/') || urlOuCaminho.startsWith('C:')) {
        const mimeType = this.getMimeType(nomeArquivo);
        mediaId = await this.uploadMidia(urlOuCaminho, mimeType);
      }

      const payload = {
        messaging_product: 'whatsapp',
        to: this.formatarNumero(numero),
        type: 'document',
        document: mediaId 
          ? { id: mediaId, filename: nomeArquivo }
          : { link: urlOuCaminho, filename: nomeArquivo }
      };

      if (legenda) {
        payload.document.caption = legenda;
      }

      const response = await this.fazerRequisicao('POST', url, payload);

      return {
        success: true,
        key: { id: response.messages?.[0]?.id },
        messageId: response.messages?.[0]?.id
      };

    } catch (error) {
      console.error('❌ Erro ao enviar documento:', error.message);
      throw this.tratarErro(error);
    }
  }

  async enviarAudio(numero, urlOuCaminho) {
    try {
      const url = `${this.apiUrl}/${this.phoneNumberId}/messages`;
      
      let mediaId;
      
      if (urlOuCaminho.startsWith('/') || urlOuCaminho.startsWith('C:')) {
        mediaId = await this.uploadMidia(urlOuCaminho, 'audio/ogg');
      }

      const payload = {
        messaging_product: 'whatsapp',
        to: this.formatarNumero(numero),
        type: 'audio',
        audio: mediaId 
          ? { id: mediaId }
          : { link: urlOuCaminho }
      };

      const response = await this.fazerRequisicao('POST', url, payload);

      return {
        success: true,
        key: { id: response.messages?.[0]?.id },
        messageId: response.messages?.[0]?.id
      };

    } catch (error) {
      console.error('❌ Erro ao enviar áudio:', error.message);
      throw this.tratarErro(error);
    }
  }

  // ============================================
  // REAÇÕES
  // ============================================

  async enviarReacao(numero, mensagemId, emoji) {
    try {
      const url = `${this.apiUrl}/${this.phoneNumberId}/messages`;
      
      const payload = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: this.formatarNumero(numero),
        type: 'reaction',
        reaction: {
          message_id: mensagemId,
          emoji: emoji
        }
      };

      const response = await this.fazerRequisicao('POST', url, payload);

      return {
        success: true,
        key: { id: response.messages?.[0]?.id },
        messageId: response.messages?.[0]?.id
      };

    } catch (error) {
      console.error('❌ Erro ao enviar reação:', error.message);
      throw this.tratarErro(error);
    }
  }

  async removerReacao(numero, mensagemId) {
    return this.enviarReacao(numero, mensagemId, '');
  }

  // ============================================
  // MARCAR COMO LIDA
  // ============================================

  async marcarComoLida(mensagemId) {
    try {
      const url = `${this.apiUrl}/${this.phoneNumberId}/messages`;
      
      const payload = {
        messaging_product: 'whatsapp',
        status: 'read',
        message_id: mensagemId
      };

      await this.fazerRequisicao('POST', url, payload);

      if (this.debugMode) {
        console.log('✅ Mensagem marcada como lida:', mensagemId);
      }

      return { success: true };

    } catch (error) {
      console.error('❌ Erro ao marcar como lida:', error.message);
      return { success: false, error: error.message };
    }
  }

  // ============================================
  // UPLOAD DE MÍDIA
  // ============================================

  async uploadMidia(caminhoArquivo, mimeType) {
    try {
      const url = `${this.apiUrl}/${this.phoneNumberId}/media`;
      
      const form = new FormData();
      form.append('messaging_product', 'whatsapp');
      form.append('file', fs.createReadStream(caminhoArquivo), {
        contentType: mimeType
      });

      const response = await axios.post(url, form, {
        headers: {
          ...form.getHeaders(),
          'Authorization': `Bearer ${this.accessToken}`
        },
        timeout: this.timeout
      });

      console.log('✅ Mídia enviada. ID:', response.data.id);
      return response.data.id;

    } catch (error) {
      console.error('❌ Erro ao fazer upload de mídia:', error.message);
      throw error;
    }
  }

  async baixarMidia(mediaId) {
    try {
      const urlInfo = `${this.apiUrl}/${mediaId}`;
      const infoResponse = await this.fazerRequisicao('GET', urlInfo);
      
      const mediaUrl = infoResponse.url;
      const mimeType = infoResponse.mime_type;

      const response = await axios.get(mediaUrl, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`
        },
        responseType: 'arraybuffer',
        timeout: this.timeout
      });

      return {
        data: response.data,
        mimeType: mimeType,
        extension: this.getExtensaoDoMimeType(mimeType)
      };

    } catch (error) {
      console.error('❌ Erro ao baixar mídia:', error.message);
      throw error;
    }
  }

  // ============================================
  // MÉTODOS AUXILIARES
  // ============================================

  async fazerRequisicao(method, url, data = null, tentativa = 1) {
    try {
      const config = {
        method,
        url,
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        },
        timeout: this.timeout
      };

      if (data) {
        config.data = data;
      }

      const response = await axios(config);
      return response.data;

    } catch (error) {
      if (tentativa < this.maxRetries && this.deveRetentar(error)) {
        console.log(`⏳ Tentativa ${tentativa}/${this.maxRetries} falhou. Retentando...`);
        await this.delay(1000 * tentativa);
        return this.fazerRequisicao(method, url, data, tentativa + 1);
      }

      throw error;
    }
  }

  formatarNumero(numero) {
    let numeroLimpo = numero.replace(/\D/g, '');
    numeroLimpo = numeroLimpo.replace(/@.*$/, '');

    if (!numeroLimpo.startsWith('55') && numeroLimpo.length === 11) {
      numeroLimpo = '55' + numeroLimpo;
    }
    
    if (!numeroLimpo.startsWith('55') && numeroLimpo.length === 10) {
      numeroLimpo = '55' + numeroLimpo;
    }

    return numeroLimpo;
  }

  getMimeType(nomeArquivo) {
    const ext = nomeArquivo.split('.').pop().toLowerCase();
    const mimeTypes = {
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'pdf': 'application/pdf',
      'doc': 'application/msword',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'xls': 'application/vnd.ms-excel',
      'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'mp3': 'audio/mpeg',
      'ogg': 'audio/ogg',
      'mp4': 'video/mp4'
    };
    return mimeTypes[ext] || 'application/octet-stream';
  }

  getExtensaoDoMimeType(mimeType) {
    const extensoes = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/gif': 'gif',
      'application/pdf': 'pdf',
      'audio/ogg': 'ogg',
      'audio/mpeg': 'mp3',
      'video/mp4': 'mp4'
    };
    return extensoes[mimeType] || 'bin';
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  deveRetentar(error) {
    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      return true;
    }
    
    const status = error.response?.status;
    return status >= 500 && status < 600;
  }

  tratarErro(error) {
    const errorData = error.response?.data?.error;
    
    if (errorData) {
      const errorMessage = `WhatsApp API Error: ${errorData.message} (Code: ${errorData.code})`;
      console.error('❌', errorMessage);
      
      return new Error(errorMessage);
    }

    return error;
  }

  async verificarSaude() {
    try {
      const url = `${this.apiUrl}/${this.phoneNumberId}`;
      const response = await this.fazerRequisicao('GET', url);
      
      console.log('✅ API WhatsApp está saudável');
      console.log('📱 Número verificado:', response.display_phone_number);
      
      return {
        healthy: true,
        phoneNumber: response.display_phone_number,
        qualityRating: response.quality_rating
      };

    } catch (error) {
      console.error('❌ API WhatsApp não está respondendo:', error.message);
      return {
        healthy: false,
        error: error.message
      };
    }
  }

  // ============================================
  // LOCALIZAÇÃO E CONTATOS
  // ============================================

  async enviarLocalizacao(numero, latitude, longitude, nome = '', endereco = '') {
    try {
      const url = `${this.apiUrl}/${this.phoneNumberId}/messages`;
      
      const payload = {
        messaging_product: 'whatsapp',
        to: this.formatarNumero(numero),
        type: 'location',
        location: {
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude),
          name: nome,
          address: endereco
        }
      };

      const response = await this.fazerRequisicao('POST', url, payload);

      return {
        success: true,
        key: { id: response.messages?.[0]?.id },
        messageId: response.messages?.[0]?.id
      };

    } catch (error) {
      console.error('❌ Erro ao enviar localização:', error.message);
      throw this.tratarErro(error);
    }
  }

  async enviarContato(numero, contatos) {
    try {
      const url = `${this.apiUrl}/${this.phoneNumberId}/messages`;
      
      const contatosFormatados = contatos.map(contato => ({
        name: {
          formatted_name: contato.nome || contato.formatted_name,
          first_name: contato.primeiroNome || contato.first_name || contato.nome,
          last_name: contato.sobrenome || contato.last_name || ''
        },
        phones: contato.telefones ? contato.telefones.map(tel => ({
          phone: tel.numero || tel.phone || tel,
          type: tel.tipo || tel.type || 'CELL',
          wa_id: tel.whatsappId || tel.wa_id || null
        })) : [{
          phone: contato.telefone || contato.phone,
          type: 'CELL'
        }],
        emails: contato.emails ? contato.emails.map(email => ({
          email: email.endereco || email.email || email,
          type: email.tipo || email.type || 'WORK'
        })) : []
      }));

      const payload = {
        messaging_product: 'whatsapp',
        to: this.formatarNumero(numero),
        type: 'contacts',
        contacts: contatosFormatados
      };

      const response = await this.fazerRequisicao('POST', url, payload);

      return {
        success: true,
        key: { id: response.messages?.[0]?.id },
        messageId: response.messages?.[0]?.id
      };

    } catch (error) {
      console.error('❌ Erro ao enviar contato:', error.message);
      throw this.tratarErro(error);
    }
  }

  async deletarMensagem(mensagemId) {
    try {
      const url = `${this.apiUrl}/${this.phoneNumberId}/messages/${mensagemId}`;
      
      await this.fazerRequisicao('DELETE', url);

      if (this.debugMode) {
        console.log('✅ Mensagem deletada:', mensagemId);
      }

      return { success: true };

    } catch (error) {
      console.error('❌ Erro ao deletar mensagem:', error.message);
      return { success: false, error: error.message };
    }
  }

  // ============================================
  // MENSAGENS INTERATIVAS
  // ============================================

  async enviarBotoes(numero, texto, botoes, header = null, footer = null) {
    try {
      const url = `${this.apiUrl}/${this.phoneNumberId}/messages`;

      if (botoes.length > 3) {
        throw new Error('Máximo de 3 botões permitido');
      }

      const botoesFormatados = botoes.map((botao, index) => ({
        type: 'reply',
        reply: {
          id: botao.id || `btn_${index}`,
          title: botao.titulo.substring(0, 20) 
        }
      }));

      const payload = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: this.formatarNumero(numero),
        type: 'interactive',
        interactive: {
          type: 'button',
          body: {
            text: texto
          },
          action: {
            buttons: botoesFormatados
          }
        }
      };

      if (header) {
        payload.interactive.header = {
          type: 'text',
          text: header
        };
      }

      if (footer) {
        payload.interactive.footer = {
          text: footer
        };
      }

      const response = await this.fazerRequisicao('POST', url, payload);

      if (this.debugMode) {
        console.log('✅ Mensagem com botões enviada:', {
          para: numero,
          botoes: botoes.length,
          mensagemId: response.messages?.[0]?.id
        });
      }

      return {
        success: true,
        key: { id: response.messages?.[0]?.id },
        messageId: response.messages?.[0]?.id
      };

    } catch (error) {
      console.error('❌ Erro ao enviar botões:', error.message);
      throw this.tratarErro(error);
    }
  }

  async enviarLista(numero, texto, botaoTexto, secoes, header = null, footer = null) {
    try {
      const url = `${this.apiUrl}/${this.phoneNumberId}/messages`;

      if (secoes.length > 10) {
        throw new Error('Máximo de 10 seções permitido');
      }

      if (botaoTexto.length > 20) {
        throw new Error('Texto do botão deve ter no máximo 20 caracteres');
      }

      const secoesFormatadas = secoes.map(secao => {
        if (secao.rows.length > 10) {
          throw new Error('Máximo de 10 itens por seção');
        }

        return {
          title: secao.titulo.substring(0, 24), 
          rows: secao.rows.map(row => ({
            id: row.id || `row_${Math.random().toString(36).substr(2, 9)}`,
            title: row.titulo.substring(0, 24), 
            description: row.descricao ? row.descricao.substring(0, 72) : undefined 
          }))
        };
      });

      const payload = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: this.formatarNumero(numero),
        type: 'interactive',
        interactive: {
          type: 'list',
          body: {
            text: texto
          },
          action: {
            button: botaoTexto,
            sections: secoesFormatadas
          }
        }
      };

      if (header) {
        payload.interactive.header = {
          type: 'text',
          text: header
        };
      }

      if (footer) {
        payload.interactive.footer = {
          text: footer
        };
      }

      const response = await this.fazerRequisicao('POST', url, payload);

      if (this.debugMode) {
        console.log('✅ Lista interativa enviada:', {
          para: numero,
          secoes: secoes.length,
          mensagemId: response.messages?.[0]?.id
        });
      }

      return {
        success: true,
        key: { id: response.messages?.[0]?.id },
        messageId: response.messages?.[0]?.id
      };

    } catch (error) {
      console.error('❌ Erro ao enviar lista:', error.message);
      throw this.tratarErro(error);
    }
  }

  // ============================================
  // TEMPLATES
  // ============================================

  async enviarTemplate(numero, nomeTemplate, languageCode, componentes = []) {
    try {
      const url = `${this.apiUrl}/${this.phoneNumberId}/messages`;

      const payload = {
        messaging_product: 'whatsapp',
        to: this.formatarNumero(numero),
        type: 'template',
        template: {
          name: nomeTemplate,
          language: {
            code: languageCode 
          },
          components: componentes
        }
      };

      const response = await this.fazerRequisicao('POST', url, payload);

      if (this.debugMode) {
        console.log('✅ Template enviado:', {
          para: numero,
          template: nomeTemplate,
          mensagemId: response.messages?.[0]?.id
        });
      }

      return {
        success: true,
        key: { id: response.messages?.[0]?.id },
        messageId: response.messages?.[0]?.id
      };

    } catch (error) {
      console.error('❌ Erro ao enviar template:', error.message);
      throw this.tratarErro(error);
    }
  }

  criarComponenteBody(parametros) {
    return {
      type: 'body',
      parameters: parametros.map(param => ({
        type: 'text',
        text: param
      }))
    };
  }

  criarComponenteHeaderMidia(tipo, urlOuId) {
    const tipoMidia = tipo === 'image' ? 'image' : tipo === 'video' ? 'video' : 'document';
    
    return {
      type: 'header',
      parameters: [{
        type: tipoMidia,
        [tipoMidia]: {
          link: urlOuId.startsWith('http') ? urlOuId : undefined,
          id: !urlOuId.startsWith('http') ? urlOuId : undefined
        }
      }]
    };
  }

  criarComponenteBotao(index, parametros) {
    return {
      type: 'button',
      sub_type: 'url',
      index: index.toString(),
      parameters: parametros.map(param => ({
        type: 'text',
        text: param
      }))
    };
  }
}

module.exports = new WhatsAppOfficialService();