// backend/src/servicos/baileys/conexao.handler.js - ARQUIVO COMPLETO

const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion, makeCacheableSignalKeyStore, isJidBroadcast } = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const fs = require('fs');
const pino = require('pino');
const NodeCache = require('node-cache');
const QRCode = require('qrcode');

class ConexaoHandler {
  constructor(servico, prisma) {
    this.servico = servico;
    this.prisma = prisma;
  }

  async conectar(contaId, instancia) {
    try {
      const chave = this.servico.gerarChaveCliente(contaId, instancia);
      
      console.log(`\n${'='.repeat(60)}`);
      console.log(`📱 [BAILEYS] Conectando WhatsApp`);
      console.log(`   Conta: ${contaId}`);
      console.log(`   Instância: ${instancia}`);
      console.log(`   Chave: ${chave}`);
      console.log(`${'='.repeat(60)}\n`);

      const conexaoDB = await this.prisma.conexaoWhatsApp.findUnique({
        where: {
          contaId_instancia: {
            contaId: contaId,
            instancia: instancia
          }
        }
      });

      if (!conexaoDB) {
        throw new Error(`Conexão não encontrada para instância ${instancia}`);
      }

      // ✅ BLOQUEIO: Só conecta se for BAILEYS
      if (conexaoDB.tipoParceiro !== 'BAILEYS') {
        throw new Error(`Instância ${instancia} não é do tipo BAILEYS (é ${conexaoDB.tipoParceiro})`);
      }

      const caminhoAuth = this.servico.obterCaminhoAutenticacao(contaId, instancia);

      if (!fs.existsSync(caminhoAuth)) {
        fs.mkdirSync(caminhoAuth, { recursive: true });
      }

      if (this.servico.clientes[chave]) {
        try {
          await this.servico.clientes[chave].socket?.end();
          await this.servico.clientes[chave].socket?.ws?.close();
        } catch (e) {
          console.log('⚠️ Limpando conexão anterior...');
        }
        delete this.servico.clientes[chave];
      }

      const { state, saveCreds } = await useMultiFileAuthState(caminhoAuth);
      const { version } = await fetchLatestBaileysVersion();

      console.log(`📱 Baileys versão: ${version.join('.')}`);

      const msgRetryCounterCache = new NodeCache();

      const socket = makeWASocket({
        version,
        logger: pino({ level: 'silent' }),
        printQRInTerminal: false,
        browser: ['FaleZap Baileys', 'Chrome', '120.0.0'],
        auth: {
          creds: state.creds,
          keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'silent' })),
        },
        markOnlineOnConnect: true,
        syncFullHistory: false,
        generateHighQualityLinkPreview: false,
        shouldIgnoreJid: (jid) => isJidBroadcast(jid),
        emitOwnEvents: false,
        getMessage: async (key) => {
          const msg = await this.prisma.mensagem.findUnique({
            where: { whatsappId: key.id }
          });
          return msg ? { message: { conversation: msg.conteudo } } : undefined;
        },
        msgRetryCounterCache,
        defaultQueryTimeoutMs: undefined,
        connectTimeoutMs: undefined,
        keepAliveIntervalMs: 10000,
        retryRequestDelayMs: 250,
        maxRetries: 10,
        qrTimeout: 60000
      });

      console.log(`✅ Socket Baileys criado`);

      socket.ev.on('creds.update', saveCreds);

      let qrEnviado = false;
      let qrCount = 0;

      socket.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr && !qrEnviado) {
          qrCount++;
          console.log(`\n✨ [BAILEYS] QR CODE GERADO! (${qrCount}) - Instância ${instancia}`);

          try {
            const qrDataURL = await QRCode.toDataURL(qr, {
              errorCorrectionLevel: 'H',
              type: 'image/png',
              width: 400,
              margin: 2,
              color: {
                dark: '#000000',
                light: '#FFFFFF'
              }
            });

            this.servico.clientes[chave] = {
              socket: socket,
              estado: 'aguardando_qr',
              contaId: contaId,
              instancia: instancia,
              nomeInstancia: conexaoDB.nomeInstancia,
              corIdentificacao: conexaoDB.corIdentificacao,
              qrGerado: new Date(),
            };

            this.servico.enviarQRCodeParaCliente(contaId, instancia, qrDataURL);
            qrEnviado = true;
            console.log(`✅ [BAILEYS] QR Code enviado para instância ${instancia}`);

          } catch (erro) {
            console.error(`❌ Erro ao converter QR:`, erro.message);
          }
        }

        if (connection === 'connecting') {
          console.log(`🔄 [BAILEYS] Conectando instância ${instancia}...`);
        }

        if (connection === 'open') {
          console.log(`\n${'='.repeat(60)}`);
          console.log(`✅ [BAILEYS] WHATSAPP CONECTADO!`);
          console.log(`   Instância: ${instancia} (${conexaoDB.nomeInstancia})`);
          console.log(`   Número: ${socket.user?.id || 'Desconhecido'}`);
          console.log(`${'='.repeat(60)}\n`);

          qrEnviado = false;
          qrCount = 0;
          delete this.servico.tentativasReconexao[chave];

          this.servico.clientes[chave] = {
            socket: socket,
            estado: 'conectado',
            contaId: contaId,
            instancia: instancia,
            nomeInstancia: conexaoDB.nomeInstancia,
            corIdentificacao: conexaoDB.corIdentificacao,
            conectadoEm: new Date(),
            numero: socket.user?.id || 'desconhecido',
            nome: socket.user?.name || 'Sem nome',
          };

          await this.prisma.conexaoWhatsApp.update({
            where: { id: conexaoDB.id },
            data: {
              status: 'CONECTADO',
              numeroWhatsApp: socket.user?.id,
              nomeExibicao: socket.user?.name,
              ultimaConexao: new Date()
            }
          });

          try {
            await socket.sendPresenceUpdate('available');
          } catch (e) {
            console.log('⚠️ Erro ao atualizar presença:', e.message);
          }

          console.log('📋 [BAILEYS] Preparando conversas...');
          await this.sincronizarHistorico(contaId, instancia, socket);
        }

        if (connection === 'close') {
          const statusCode = new Boom(lastDisconnect?.error)?.output?.statusCode;
          const shouldReconnect = statusCode !== DisconnectReason.loggedOut && statusCode !== 500;

          console.log(`\n⚠️ [BAILEYS] Desconectado - Instância ${instancia} - Código: ${statusCode}`);

          delete this.servico.clientes[chave];

          await this.prisma.conexaoWhatsApp.update({
            where: { id: conexaoDB.id },
            data: { status: 'DESCONECTADO' }
          });

          if (statusCode === DisconnectReason.loggedOut) {
            console.log(`🔴 [BAILEYS] Logout detectado - Instância ${instancia}`);
            try {
              fs.rmSync(caminhoAuth, { recursive: true, force: true });
            } catch (e) {
              console.error('⚠️ Erro ao limpar:', e.message);
            }
            delete this.servico.tentativasReconexao[chave];
          }
          else if (statusCode === 500) {
            console.log(`🛑 [BAILEYS] Erro interno (500) - Instância ${instancia}`);
            delete this.servico.tentativasReconexao[chave];
          }
          else if (shouldReconnect && statusCode !== DisconnectReason.timedOut) {
            const tentativas = this.servico.tentativasReconexao[chave] || 0;

            if (tentativas < 3) {
              this.servico.tentativasReconexao[chave] = tentativas + 1;
              await this.servico.reconectar(contaId, instancia, tentativas);
            } else {
              console.log(`❌ [BAILEYS] Máximo de tentativas atingido - Instância ${instancia}`);
              delete this.servico.tentativasReconexao[chave];
            }
          }
        }
      });

      // ✅ EVENTOS DE MENSAGENS (COM FILTRO ANTI-DUPLICAÇÃO)
      socket.ev.on('messages.upsert', async ({ messages, type }) => {
        if (messages.length > 0) {
          console.log(`\n📨 [BAILEYS] Evento messages.upsert - ${messages.length} mensagens`);
          await this.servico.processarMensagensRecebidas(contaId, instancia, messages, socket, false);
        }
      });

      socket.ev.on('messages.update', async (updates) => {
        await this.servico.atualizarStatusMensagens(updates);
      });

      socket.ev.on('chats.set', async ({ chats }) => {
        console.log(`💬 [BAILEYS] chats.set: ${chats.length} conversas - Instância ${instancia}`);
        await this.servico.processarChatsIniciais(contaId, instancia, chats, socket);
      });

      socket.ev.on('chats.upsert', async (chats) => {
        console.log(`💬 [BAILEYS] chats.upsert: ${chats.length} conversas - Instância ${instancia}`);
        await this.servico.processarChatsIniciais(contaId, instancia, chats, socket);
      });

      return socket;

    } catch (erro) {
      console.error(`❌ [BAILEYS] Erro ao conectar instância ${instancia}:`, erro.message);
      const chave = this.servico.gerarChaveCliente(contaId, instancia);
      delete this.servico.clientes[chave];
      throw erro;
    }
  }

  async sincronizarHistorico(contaId, instancia, socket) {
    try {
      console.log(`\n🔄 [BAILEYS] Sincronizando histórico - Instância ${instancia}`);

      const conexao = await this.prisma.conexaoWhatsApp.findUnique({
        where: {
          contaId_instancia: {
            contaId: contaId,
            instancia: instancia
          }
        }
      });

      if (!conexao) {
        console.log(`⚠️ [BAILEYS] Conexão não encontrada - Instância ${instancia}`);
        return;
      }

      const conversasExistentes = await this.prisma.conversa.findMany({
        where: { 
          contaId: contaId,
          conexaoWhatsAppId: conexao.id
        },
        select: {
          id: true,
          numeroCliente: true,
          nomeCliente: true,
          isGrupo: true
        }
      });

      console.log(`✅ [BAILEYS] ${conversasExistentes.length} conversas encontradas - Instância ${instancia}`);
      console.log(`✅ [BAILEYS] Sincronização completa!\n`);

    } catch (erro) {
      console.error(`❌ [BAILEYS] Erro na sincronização - Instância ${instancia}:`, erro);
    }
  }

  async desconectar(contaId, instancia) {
    try {
      const chave = this.servico.gerarChaveCliente(contaId, instancia);
      const cliente = this.servico.clientes[chave];
      
      if (!cliente) {
        return { sucesso: false, mensagem: 'Cliente não encontrado' };
      }

      console.log(`🔌 [BAILEYS] Desconectando instância ${instancia}...`);

      try {
        await cliente.socket?.logout();
        await cliente.socket?.ws?.close();
      } catch (e) {
        console.log('⚠️ Erro ao fazer logout:', e.message);
      }

      const caminhoAuth = this.servico.obterCaminhoAutenticacao(contaId, instancia);

      try {
        fs.rmSync(caminhoAuth, { recursive: true, force: true });
        console.log(`✅ [BAILEYS] Sessão removida - Instância ${instancia}`);
      } catch (e) {
        console.error('⚠️ Erro ao remover sessão:', e.message);
      }

      const conexao = await this.prisma.conexaoWhatsApp.findUnique({
        where: {
          contaId_instancia: {
            contaId: contaId,
            instancia: instancia
          }
        }
      });

      if (conexao) {
        await this.prisma.conexaoWhatsApp.update({
          where: { id: conexao.id },
          data: { status: 'DESCONECTADO', numeroWhatsApp: null }
        });
      }

      delete this.servico.clientes[chave];
      delete this.servico.tentativasReconexao[chave];

      return { sucesso: true, mensagem: 'Desconectado' };
    } catch (erro) {
      console.error(`❌ [BAILEYS] Erro ao desconectar instância ${instancia}:`, erro.message);
      const chave = this.servico.gerarChaveCliente(contaId, instancia);
      delete this.servico.clientes[chave];
      throw erro;
    }
  }

  async iniciarSessoesSalvas() {
    try {
      console.log('\n🔄 [BAILEYS] Verificando sessões salvas...');

      const conexoes = await this.prisma.conexaoWhatsApp.findMany({
        where: { 
          status: 'CONECTADO',
          tipoParceiro: 'BAILEYS' // ✅ Só reconecta Baileys
        },
        include: { conta: true }
      });

      if (conexoes.length === 0) {
        console.log('ℹ️ [BAILEYS] Nenhuma sessão Baileys salva encontrada');
        return;
      }

      console.log(`📱 [BAILEYS] Encontradas ${conexoes.length} sessões Baileys para reconectar`);

      for (const conexao of conexoes) {
        try {
          const caminhoAuth = this.servico.obterCaminhoAutenticacao(conexao.contaId, conexao.instancia);

          if (fs.existsSync(caminhoAuth)) {
            console.log(`🔄 [BAILEYS] Reconectando ${conexao.nomeInstancia || `Instância ${conexao.instancia}`}...`);

            this.conectar(conexao.contaId, conexao.instancia).catch(erro => {
              console.error(`❌ [BAILEYS] Erro ao reconectar instância ${conexao.instancia}:`, erro.message);
            });

            await new Promise(resolve => setTimeout(resolve, 2000));
          } else {
            console.log(`⚠️ [BAILEYS] Sessão não encontrada - Instância ${conexao.instancia}`);

            await this.prisma.conexaoWhatsApp.update({
              where: { id: conexao.id },
              data: { status: 'DESCONECTADO' }
            });
          }

        } catch (erro) {
          console.error(`❌ [BAILEYS] Erro ao processar conexão instância ${conexao.instancia}:`, erro.message);
        }
      }

      console.log('✅ [BAILEYS] Processo de reconexão iniciado\n');

    } catch (erro) {
      console.error('❌ [BAILEYS] Erro ao iniciar sessões salvas:', erro.message);
    }
  }
}

module.exports = ConexaoHandler;