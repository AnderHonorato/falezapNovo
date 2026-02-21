// backend/src/servicos/baileys.servico.js - PARTE 1/2

const { PrismaClient } = require('@prisma/client');
const path = require('path');
const ConexaoHandler = require('./baileys/conexao.handler');
const MensagensHandler = require('./baileys/mensagens.handler');
const MidiaHandler = require('./baileys/midia.handler');

const prisma = new PrismaClient();

class BaileysServico {
  constructor() {
    this.clientes = {};
    this.tentativasReconexao = {};
    this.clientesWS = {};
    
    const uploadsDir = path.join(__dirname, '..', '..', 'uploads');
    
    this.conexaoHandler = new ConexaoHandler(this, prisma);
    this.mensagensHandler = new MensagensHandler(this, prisma, uploadsDir);
    this.midiaHandler = new MidiaHandler(this, prisma, uploadsDir);
    
    console.log('✅ [BAILEYS] Serviço inicializado');
  }

  // ============================================
  // GERADORES DE CHAVE
  // ============================================

  gerarChaveCliente(contaId, instancia) {
    return `${contaId}_${instancia}`;
  }

  obterCaminhoAutenticacao(contaId, instancia) {
    return path.join(__dirname, '..', '..', 'sessions', `conta_${contaId}_inst_${instancia}`);
  }

  // ============================================
  // CONEXÃO
  // ============================================

  async conectarWhatsApp(contaId, instancia) {
    console.log(`\n🔌 [BAILEYS] Iniciando conexão: Conta ${contaId}, Instância ${instancia}`);
    
    // ✅ Verifica se é uma instância Baileys
    const conexao = await prisma.conexaoWhatsApp.findUnique({
      where: {
        contaId_instancia: {
          contaId: contaId,
          instancia: instancia
        }
      }
    });

    if (!conexao) {
      throw new Error('Conexão não encontrada no banco de dados');
    }

    if (conexao.tipoParceiro !== 'BAILEYS') {
      throw new Error(`Esta instância não é do tipo BAILEYS (é ${conexao.tipoParceiro})`);
    }

    return await this.conexaoHandler.conectar(contaId, instancia);
  }

  async desconectar(contaId, instancia) {
    console.log(`\n🔌 [BAILEYS] Desconectando: Conta ${contaId}, Instância ${instancia}`);
    return await this.conexaoHandler.desconectar(contaId, instancia);
  }

  async reconectar(contaId, instancia, tentativa = 0) {
    const delay = Math.min(1000 * Math.pow(2, tentativa), 30000);
    console.log(`⏳ [BAILEYS] Aguardando ${delay}ms antes de reconectar...`);
    
    await new Promise(resolve => setTimeout(resolve, delay));
    
    console.log(`🔄 [BAILEYS] Tentativa de reconexão ${tentativa + 1}/3 - Instância ${instancia}`);
    
    try {
      await this.conectarWhatsApp(contaId, instancia);
    } catch (erro) {
      console.error(`❌ [BAILEYS] Erro na reconexão:`, erro.message);
    }
  }

  async iniciarSessoesSalvas() {
    return await this.conexaoHandler.iniciarSessoesSalvas();
  }

  // ============================================
  // STATUS
  // ============================================

  obterStatus(contaId, instancia) {
    const chave = this.gerarChaveCliente(contaId, instancia);
    const cliente = this.clientes[chave];
    
    if (!cliente) {
      return { conectado: false, estado: 'desconectado' };
    }
    
    return {
      conectado: cliente.estado === 'conectado',
      estado: cliente.estado,
      numero: cliente.numero,
      nome: cliente.nome,
      conectadoEm: cliente.conectadoEm
    };
  }

  listarConexoesAtivas() {
    return Object.entries(this.clientes).map(([chave, cliente]) => ({
      chave,
      contaId: cliente.contaId,
      instancia: cliente.instancia,
      estado: cliente.estado,
      numero: cliente.numero,
      nome: cliente.nome
    }));
  }

listarConexoesAtivas() {
    return Object.entries(this.clientes).map(([chave, cliente]) => ({
      chave,
      contaId: cliente.contaId,
      instancia: cliente.instancia,
      estado: cliente.estado,
      numero: cliente.numero,
      nome: cliente.nome
    }));
  }

  // ============================================
  // ENVIOS E AÇÕES
  // ============================================

  async enviarMensagem(contaId, instancia, numero, mensagem, quotedMsgId = null) {
    const chave = this.gerarChaveCliente(contaId, instancia);
    const cliente = this.clientes[chave];

    if (!cliente || cliente.estado !== 'conectado') {
      throw new Error(`[BAILEYS] Instância não conectada: ${chave}`);
    }

    return this.mensagensHandler.enviarMensagem(cliente.socket, contaId, instancia, numero, mensagem, quotedMsgId);
  }

  async enviarMidia(contaId, instancia, numero, arquivo, legenda = '') {
    const chave = this.gerarChaveCliente(contaId, instancia);
    const cliente = this.clientes[chave];

    if (!cliente || cliente.estado !== 'conectado') {
      throw new Error(`[BAILEYS] Instância não conectada: ${chave}`);
    }

    return this.midiaHandler.enviarMidia(cliente.socket, contaId, instancia, numero, arquivo, legenda);
  }

  async obterMensagensConversa(contaId, numeroCliente, limite = 100, offset = 0, instancia = null) {
    // Este método provavelmente será um delegador para um `ConversasHandler`
    // ou acessará o banco de dados diretamente, mas mantemos o formato para consistência.
    // Assumindo que a instância é requerida para filtrar as mensagens no banco, se houver mais de uma.
    // Se instancia for null, a lógica deve buscar em todas as instâncias da conta.
    console.log(`🔍 [BAILEYS] Buscando mensagens para ${numeroCliente} na Conta ${contaId} (Instância: ${instancia || 'Todas'})`);
    // **NOTA:** A implementação real desta lógica de BD não está aqui, apenas o contrato de função.
    // Em um sistema real, você teria um `MensagensServico` ou delegaria para `mensagensHandler.obterMensagensConversa`.
    throw new Error('Método obterMensagensConversa não implementado neste contexto.');
  }

  // ============================================
  // DELEGAÇÃO PARA HANDLERS
  // ============================================
  
  // Métodos para o Webhook/Sistema chamar os Handlers
  
  // Exemplo de delegação para MidiaHandler
  getExtensaoPorTipo(tipo, msg) {
    return this.midiaHandler.getExtensaoPorTipo(tipo, msg);
  }
  
  // Exemplo de delegação para MensagensHandler
  async atualizarStatusMensagens(updates) {
    return this.mensagensHandler.atualizarStatusMensagens(updates);
  }

  // Adicione aqui mais delegações conforme necessário (Conversas, etc.)

  // ============================================
  // WS (WEBSOCKET)
  // ============================================

  registrarClienteWS(contaId, instancia, res) {
    const chave = this.gerarChaveCliente(contaId, instancia);
    console.log(`📡 [BAILEYS] Cliente WS registrado: ${chave}`);
    this.clientesWS[chave] = res;
  }

  enviarQRCodeParaCliente(contaId, instancia, qrDataURL) {
    const chave = this.gerarChaveCliente(contaId, instancia);
    const res = this.clientesWS[chave];
    
    if (res && !res.headersSent) {
      console.log(`📤 [BAILEYS] Enviando QR Code para ${chave}`);
      try {
        res.json({
          sucesso: true,
          qrCode: qrDataURL,
          mensagem: 'Escaneie o QR Code',
          instancia: instancia
        });
      } catch (e) {
        console.error('❌ [BAILEYS] Erro ao enviar QR Code:', e.message);
      }
      delete this.clientesWS[chave]; // Remove o cliente após o envio
    }
  }
}

module.exports = new BaileysServico();