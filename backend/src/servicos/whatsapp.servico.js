// backend/src/servicos/whatsapp.servico.js - SERVIÇO COMPLETO COM META API E AUTO-RECONEXÃO

const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

class ServicoWhatsApp {
  constructor() {
    this.clientes = new Map(); // Map de clientes ativos (whatsapp-web.js)
    this.sessoesPersistentes = new Map(); // Sessões salvas
    this.tentativasReconexao = new Map(); // Contador de tentativas
    this.MAX_TENTATIVAS = 3;
    this.INTERVALO_RECONEXAO = 10000; // 10 segundos
    
    console.log('🟢 ServiçoWhatsApp inicializado');
    this.iniciarVerificacaoSessoes();
    this.carregarSessoesExistentes();
  }

  /**
   * Carrega todas as sessões existentes na pasta .wwebjs_auth
   * e tenta reconectar automaticamente
   */
  async carregarSessoesExistentes() {
    console.log('\n📂 Verificando sessões existentes...\n');
    
    const authPath = path.join(__dirname, '../../.wwebjs_auth');
    
    if (!fs.existsSync(authPath)) {
      console.log('⚠️ Pasta de autenticação não existe ainda');
      return;
    }

    try {
      const sessions = fs.readdirSync(authPath).filter(dir => 
        dir.startsWith('session-') && fs.statSync(path.join(authPath, dir)).isDirectory()
      );

      console.log(`✅ Encontradas ${sessions.length} sessões salvas\n`);

      for (const sessionDir of sessions) {
        const usuarioId = sessionDir.replace('session-', '');
        
        console.log(`🔄 Reconectando sessão: ${usuarioId}`);
        
        try {
          // Busca informações do usuário no banco
          const usuario = await prisma.usuario.findUnique({
            where: { id: usuarioId },
            include: { conta: true }
          });

          if (!usuario || usuario.status !== 'ATIVO') {
            console.log(`⚠️ Usuário ${usuarioId} inativo ou não encontrado, pulando...`);
            continue;
          }

          // Reconecta automaticamente
          await this.inicializarCliente(usuarioId, true);
          
          console.log(`✅ Sessão ${usuarioId} reconectada com sucesso!\n`);
          
          // Pequeno delay entre reconexões para não sobrecarregar
          await new Promise(resolve => setTimeout(resolve, 2000));
          
        } catch (error) {
          console.error(`❌ Erro ao reconectar sessão ${usuarioId}:`, error.message);
        }
      }
      
      console.log('\n✅ Processo de reconexão automática concluído!\n');
      
    } catch (error) {
      console.error('❌ Erro ao carregar sessões:', error);
    }
  }

  /**
   * Inicializa um cliente WhatsApp
   */
  async inicializarCliente(usuarioId, autoReconnect = false) {
    // Se já existe um cliente ativo, retorna ele
    if (this.clientes.has(usuarioId)) {
      const clienteExistente = this.clientes.get(usuarioId);
      if (clienteExistente.isReady) {
        console.log(`ℹ️ Cliente ${usuarioId} já está conectado`);
        return clienteExistente;
      }
    }

    console.log(`\n${'='.repeat(60)}`);
    console.log(`🔌 Inicializando cliente WhatsApp: ${usuarioId}`);
    console.log(`📍 Modo: ${autoReconnect ? 'Auto-Reconexão' : 'Nova Conexão'}`);
    console.log(`${'='.repeat(60)}\n`);

    const client = new Client({
      authStrategy: new LocalAuth({
        clientId: usuarioId,
        dataPath: path.join(__dirname, '../../.wwebjs_auth')
      }),
      puppeteer: {
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu'
        ]
      },
      qrMaxRetries: 5
    });

    // Estado do cliente
    const clienteInfo = {
      client,
      usuarioId,
      isReady: false,
      qrCode: null,
      numero: null,
      conectadoEm: null,
      tentativasReconexao: 0
    };

    this.clientes.set(usuarioId, clienteInfo);

    // ===== EVENTOS =====

    client.on('qr', async (qr) => {
      console.log(`📱 QR Code gerado para ${usuarioId}`);
      try {
        const qrCodeData = await qrcode.toDataURL(qr);
        clienteInfo.qrCode = qrCodeData;
        
        // Emite via Socket.IO se disponível
        const io = global.io;
        if (io) {
          io.to(`user:${usuarioId}`).emit('whatsapp_qr_code', {
            usuarioId,
            qrCode: qrCodeData
          });
        }
      } catch (error) {
        console.error(`❌ Erro ao gerar QR Code para ${usuarioId}:`, error);
      }
    });

    client.on('authenticated', () => {
      console.log(`✅ Autenticado: ${usuarioId}`);
      clienteInfo.tentativasReconexao = 0; // Reseta tentativas
      this.sessoesPersistentes.set(usuarioId, true);
    });

    client.on('auth_failure', (error) => {
      console.error(`❌ Falha na autenticação ${usuarioId}:`, error);
      this.tentarReconectar(usuarioId);
    });

    client.on('ready', async () => {
      console.log(`\n${'✅'.repeat(30)}`);
      console.log(`🎉 WhatsApp PRONTO: ${usuarioId}`);
      
      const info = client.info;
      clienteInfo.isReady = true;
      clienteInfo.numero = info.wid.user;
      clienteInfo.conectadoEm = new Date();
      clienteInfo.qrCode = null;
      clienteInfo.tentativasReconexao = 0;

      console.log(`📱 Número: ${info.wid.user}`);
      console.log(`👤 Nome: ${info.pushname}`);
      console.log(`${'✅'.repeat(30)}\n`);

      // Salva no banco
      try {
        await prisma.usuario.update({
          where: { id: usuarioId },
          data: {
            whatsappConectado: true,
            numeroWhatsApp: info.wid.user,
            ultimaConexaoWhatsapp: new Date()
          }
        });
      } catch (error) {
        console.error('❌ Erro ao atualizar DB:', error);
      }

      // Emite via Socket.IO
      const io = global.io;
      if (io) {
        io.to(`user:${usuarioId}`).emit('whatsapp_conectado', {
          usuarioId,
          numero: info.wid.user,
          nome: info.pushname,
          conectadoEm: clienteInfo.conectadoEm
        });
      }
    });

    client.on('disconnected', async (reason) => {
      console.log(`\n${'❌'.repeat(30)}`);
      console.log(`🔴 WhatsApp DESCONECTADO: ${usuarioId}`);
      console.log(`📋 Razão: ${reason}`);
      console.log(`${'❌'.repeat(30)}\n`);

      clienteInfo.isReady = false;
      clienteInfo.qrCode = null;

      // Atualiza DB
      try {
        await prisma.usuario.update({
          where: { id: usuarioId },
          data: {
            whatsappConectado: false
          }
        });
      } catch (error) {
        console.error('❌ Erro ao atualizar DB:', error);
      }

      // Emite via Socket.IO
      const io = global.io;
      if (io) {
        io.to(`user:${usuarioId}`).emit('whatsapp_desconectado', {
          usuarioId,
          razao: reason
        });
      }

      // Tenta reconectar se for desconexão inesperada
      if (reason !== 'LOGOUT') {
        this.tentarReconectar(usuarioId);
      } else {
        // Se foi logout intencional, remove a sessão
        this.clientes.delete(usuarioId);
        this.sessoesPersistentes.delete(usuarioId);
      }
    });

    client.on('message', async (message) => {
      // Lógica de recebimento de mensagens
      await this.processarMensagemRecebida(usuarioId, message);
    });

    client.on('message_create', async (message) => {
      // Mensagens enviadas
      await this.processarMensagemEnviada(usuarioId, message);
    });

    // Inicializa o cliente
    try {
      await client.initialize();
      console.log(`🚀 Cliente ${usuarioId} inicializado`);
    } catch (error) {
      console.error(`❌ Erro ao inicializar cliente ${usuarioId}:`, error);
      this.clientes.delete(usuarioId);
      throw error;
    }

    return clienteInfo;
  }

  /**
   * Tenta reconectar automaticamente
   */
  async tentarReconectar(usuarioId) {
    const tentativas = this.tentativasReconexao.get(usuarioId) || 0;
    
    if (tentativas >= this.MAX_TENTATIVAS) {
      console.log(`⚠️ Máximo de tentativas atingido para ${usuarioId}`);
      this.tentativasReconexao.delete(usuarioId);
      return;
    }

    this.tentativasReconexao.set(usuarioId, tentativas + 1);
    
    console.log(`🔄 Tentativa ${tentativas + 1}/${this.MAX_TENTATIVAS} de reconexão: ${usuarioId}`);
    
    setTimeout(async () => {
      try {
        // Remove cliente antigo
        const clienteAntigo = this.clientes.get(usuarioId);
        if (clienteAntigo?.client) {
          try {
            await clienteAntigo.client.destroy();
          } catch (e) {
            console.error('Erro ao destruir cliente antigo:', e);
          }
        }
        this.clientes.delete(usuarioId);

        // Tenta reconectar
        await this.inicializarCliente(usuarioId, true);
      } catch (error) {
        console.error(`❌ Erro na tentativa de reconexão ${usuarioId}:`, error);
      }
    }, this.INTERVALO_RECONEXAO);
  }

  /**
   * Verifica periodicamente as sessões e reconecta se necessário
   */
  iniciarVerificacaoSessoes() {
    setInterval(() => {
      console.log('\n🔍 Verificando sessões ativas...');
      
      let ativas = 0;
      let inativas = 0;

      for (const [usuarioId, clienteInfo] of this.clientes.entries()) {
        if (clienteInfo.isReady) {
          ativas++;
        } else {
          inativas++;
          console.log(`⚠️ Cliente ${usuarioId} está inativo`);
          
          // Tenta reconectar clientes inativos que deveriam estar ativos
          if (this.sessoesPersistentes.has(usuarioId)) {
            this.tentarReconectar(usuarioId);
          }
        }
      }

      console.log(`📊 Status: ${ativas} ativas | ${inativas} inativas\n`);
    }, 5 * 60 * 1000); // A cada 5 minutos
  }

  /**
   * Obtém um cliente ativo
   */
  obterCliente(usuarioId) {
    const clienteInfo = this.clientes.get(usuarioId);
    
    if (!clienteInfo || !clienteInfo.isReady) {
      throw new Error('Cliente WhatsApp não está conectado');
    }

    return clienteInfo;
  }

  /**
   * Desconecta um cliente
   */
  async desconectar(usuarioId) {
    const clienteInfo = this.clientes.get(usuarioId);
    
    if (!clienteInfo) {
      throw new Error('Cliente não encontrado');
    }

    console.log(`🔌 Desconectando cliente: ${usuarioId}`);

    try {
      await clienteInfo.client.logout();
      await clienteInfo.client.destroy();
      
      // Remove sessão persistente
      this.sessoesPersistentes.delete(usuarioId);
      this.clientes.delete(usuarioId);
      this.tentativasReconexao.delete(usuarioId);

      // Remove pasta de autenticação
      const authPath = path.join(__dirname, '../../.wwebjs_auth', `session-${usuarioId}`);
      if (fs.existsSync(authPath)) {
        fs.rmSync(authPath, { recursive: true, force: true });
        console.log(`🗑️ Sessão removida: ${usuarioId}`);
      }

      // Atualiza DB
      await prisma.usuario.update({
        where: { id: usuarioId },
        data: {
          whatsappConectado: false,
          numeroWhatsApp: null
        }
      });

      console.log(`✅ Cliente ${usuarioId} desconectado com sucesso`);
    } catch (error) {
      console.error(`❌ Erro ao desconectar ${usuarioId}:`, error);
      throw error;
    }
  }

  /**
   * Lista todos os clientes conectados
   */
  listarConectados() {
    const conectados = [];

    for (const [usuarioId, clienteInfo] of this.clientes.entries()) {
      conectados.push({
        usuarioId,
        numero: clienteInfo.numero,
        isReady: clienteInfo.isReady,
        conectadoEm: clienteInfo.conectadoEm
      });
    }

    return conectados;
  }

  /**
   * Processa mensagem recebida
   */
  async processarMensagemRecebida(usuarioId, message) {
    try {
      const contato = await message.getContact();
      const chat = await message.getChat();

      // Salva no banco de dados
      await prisma.mensagemWhatsApp.create({
        data: {
          usuarioId,
          messageId: message.id._serialized,
          from: message.from,
          to: message.to,
          body: message.body,
          timestamp: new Date(message.timestamp * 1000),
          hasMedia: message.hasMedia,
          isForwarded: message.isForwarded,
          isStatus: message.isStatus,
          type: message.type,
          nomeContato: contato.pushname || contato.name,
          numeroContato: contato.number
        }
      });

      // Emite via Socket.IO
      const io = global.io;
      if (io) {
        io.to(`user:${usuarioId}`).emit('nova_mensagem_whatsapp', {
          usuarioId,
          mensagem: {
            id: message.id._serialized,
            from: message.from,
            to: message.to,
            body: message.body,
            timestamp: message.timestamp,
            contato: {
              nome: contato.pushname || contato.name,
              numero: contato.number
            }
          }
        });
      }

      console.log(`📥 Mensagem recebida [${usuarioId}]: ${contato.pushname || contato.number}`);
    } catch (error) {
      console.error('❌ Erro ao processar mensagem recebida:', error);
    }
  }

  /**
   * Processa mensagem enviada
   */
  async processarMensagemEnviada(usuarioId, message) {
    try {
      if (!message.fromMe) return;

      const contato = await message.getContact();

      // Salva no banco
      await prisma.mensagemWhatsApp.create({
        data: {
          usuarioId,
          messageId: message.id._serialized,
          from: message.from,
          to: message.to,
          body: message.body,
          timestamp: new Date(message.timestamp * 1000),
          hasMedia: message.hasMedia,
          type: message.type,
          fromMe: true,
          nomeContato: contato.pushname || contato.name,
          numeroContato: contato.number
        }
      });

      console.log(`📤 Mensagem enviada [${usuarioId}]: ${contato.pushname || contato.number}`);
    } catch (error) {
      console.error('❌ Erro ao processar mensagem enviada:', error);
    }
  }

  /**
   * Envia uma mensagem (whatsapp-web.js)
   */
  async enviarMensagem(usuarioId, numero, mensagem) {
    const clienteInfo = this.obterCliente(usuarioId);
    
    const numeroFormatado = numero.includes('@') ? numero : `${numero}@c.us`;
    
    try {
      const msg = await clienteInfo.client.sendMessage(numeroFormatado, mensagem);
      console.log(`📤 Mensagem enviada para ${numero}`);
      return msg;
    } catch (error) {
      console.error('❌ Erro ao enviar mensagem:', error);
      throw error;
    }
  }

  // ===================================================================
  // ✅ FUNÇÕES PARA META API (WHATSAPP BUSINESS CLOUD API)
  // ===================================================================

  /**
   * ✅ ENVIAR TEMPLATE VIA META API
   */
  async enviarTemplate(conexaoId, numero, nomeTemplate, componentes, linguagem = 'pt_BR') {
    try {
      console.log('\n📤 ==========================================');
      console.log('📤 [ENVIO TEMPLATE] Iniciando...');
      console.log('==========================================');
      
      const conexao = await prisma.conexaoWhatsApp.findUnique({
        where: { id: conexaoId }
      });

      if (!conexao) {
        throw new Error('Conexão WhatsApp não encontrada');
      }

      // 🔥 USAR AS VARIÁVEIS DO .ENV
      const META_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN || process.env.META_ACCESS_TOKEN;
      const PHONE_NUMBER_ID = conexao.phoneNumberId || process.env.WHATSAPP_PHONE_NUMBER_ID;
      const API_VERSION = process.env.WHATSAPP_API_VERSION || 'v21.0';

      if (!META_ACCESS_TOKEN) {
        throw new Error('WHATSAPP_ACCESS_TOKEN não configurado');
      }

      if (!PHONE_NUMBER_ID) {
        throw new Error('Phone Number ID não configurado na conexão');
      }

      const numeroFormatado = numero.replace(/\D/g, '');
      
      console.log('   - Template:', nomeTemplate);
      console.log('   - Para:', numeroFormatado);
      console.log('   - Linguagem:', linguagem);
      console.log('   - Componentes:', componentes.length);

      // Montar payload da Meta API
      const payload = {
        messaging_product: 'whatsapp',
        to: numeroFormatado,
        type: 'template',
        template: {
          name: nomeTemplate,
          language: {
            code: linguagem
          },
          components: componentes.map(comp => {
            const componenteFormatado = {
              type: comp.type.toLowerCase()
            };

            // HEADER com parâmetros
            if (comp.type === 'HEADER') {
              if (comp.parameters && comp.parameters.length > 0) {
                componenteFormatado.parameters = comp.parameters;
              }
            }

            // BODY com parâmetros
            if (comp.type === 'BODY' && comp.parameters && comp.parameters.length > 0) {
              componenteFormatado.parameters = comp.parameters;
            }

            // BUTTONS com parâmetros
            if (comp.type === 'BUTTONS' && comp.parameters && comp.parameters.length > 0) {
              componenteFormatado.parameters = comp.parameters;
            }

            return componenteFormatado;
          }).filter(comp => comp.parameters || comp.type === 'button')
        }
      };

      console.log('\n📡 Payload:', JSON.stringify(payload, null, 2));

      const url = `https://graph.facebook.com/${API_VERSION}/${PHONE_NUMBER_ID}/messages`;
      
      const response = await axios.post(url, payload, {
        headers: {
          'Authorization': `Bearer ${META_ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      });

      console.log('\n✅ Template enviado com sucesso!');
      console.log('   - Message ID:', response.data.messages?.[0]?.id);
      console.log('==========================================\n');

      return {
        sucesso: true,
        messageId: response.data.messages?.[0]?.id
      };

    } catch (error) {
      console.error('\n❌ ==========================================');
      console.error('❌ ERRO AO ENVIAR TEMPLATE');
      console.error('==========================================');
      
      if (error.response) {
        console.error('Status:', error.response.status);
        console.error('Dados:', JSON.stringify(error.response.data, null, 2));
      } else {
        console.error('Erro:', error.message);
      }
      
      console.error('==========================================\n');
      throw error;
    }
  }

  /**
   * ✅ ENVIAR MENSAGEM DE TEXTO VIA META API
   */
  async enviarMensagemMeta(conexaoId, numero, texto) {
    try {
      const conexao = await prisma.conexaoWhatsApp.findUnique({
        where: { id: conexaoId }
      });

      if (!conexao) {
        throw new Error('Conexão não encontrada');
      }

      const META_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
      const PHONE_NUMBER_ID = conexao.phoneNumberId || process.env.WHATSAPP_PHONE_NUMBER_ID;
      const API_VERSION = process.env.WHATSAPP_API_VERSION || 'v21.0';

      const numeroFormatado = numero.replace(/\D/g, '');

      const payload = {
        messaging_product: 'whatsapp',
        to: numeroFormatado,
        type: 'text',
        text: {
          body: texto
        }
      };

      const url = `https://graph.facebook.com/${API_VERSION}/${PHONE_NUMBER_ID}/messages`;

      const response = await axios.post(url, payload, {
        headers: {
          'Authorization': `Bearer ${META_ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      });

      return {
        sucesso: true,
        messageId: response.data.messages?.[0]?.id
      };

    } catch (error) {
      console.error('❌ Erro ao enviar mensagem via Meta:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * ✅ ENVIAR MÍDIA VIA META API
   */
  async enviarMidiaMeta(conexaoId, numero, tipoMidia, urlMidia, legenda = null) {
    try {
      const conexao = await prisma.conexaoWhatsApp.findUnique({
        where: { id: conexaoId }
      });

      if (!conexao) {
        throw new Error('Conexão não encontrada');
      }

      const META_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
      const PHONE_NUMBER_ID = conexao.phoneNumberId || process.env.WHATSAPP_PHONE_NUMBER_ID;
      const API_VERSION = process.env.WHATSAPP_API_VERSION || 'v21.0';

      const numeroFormatado = numero.replace(/\D/g, '');

      const payload = {
        messaging_product: 'whatsapp',
        to: numeroFormatado,
        type: tipoMidia, // image, video, document, audio
        [tipoMidia]: {
          link: urlMidia
        }
      };

      // Adicionar legenda se fornecida e tipo suportar
      if (legenda && ['image', 'video', 'document'].includes(tipoMidia)) {
        payload[tipoMidia].caption = legenda;
      }

      const url = `https://graph.facebook.com/${API_VERSION}/${PHONE_NUMBER_ID}/messages`;

      const response = await axios.post(url, payload, {
        headers: {
          'Authorization': `Bearer ${META_ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      });

      return {
        sucesso: true,
        messageId: response.data.messages?.[0]?.id
      };

    } catch (error) {
      console.error('❌ Erro ao enviar mídia via Meta:', error.response?.data || error.message);
      throw error;
    }
  }
}

// Exporta instância única
module.exports = new ServicoWhatsApp();