// backend/src/servidor.js - ✅ CÓDIGO COMPLETO + CORREÇÕES DE SOCKET E SANITIZAÇÃO

require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');
const prisma = new PrismaClient();
const app = express();
const server = http.createServer(app);
const reacoesRotas = require('./rotas/reacoes.rotas');
const relatorioRotas = require('./rotas/relatorio.rotas');

// ===== CONFIGURAÇÃO CORS PARA NGROK =====
const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost:5173',
      'http://localhost:3000',
      'http://localhost:5174',
      /^https:\/\/.*\.ngrok-free\.app$/, 
      /^https:\/\/.*\.ngrok\.io$/,       
      /^https:\/\/.*\.ngrok\.dev$/,       
      /^https:\/\/.*\.ngrok-free\.dev$/,  
      /^https:\/\/.*\.trycloudflare\.com$/,
      /^https:\/\/.*\.loca\.lt$/           
    ];
    
    const isAllowed = allowedOrigins.some(allowed => {
      if (allowed instanceof RegExp) {
        return allowed.test(origin);
      }
      return allowed === origin;
    });
    
    if (isAllowed) {
      console.log(`✅ CORS: Origem permitida - ${origin}`);
      callback(null, true);
    } else {
      console.warn(`⚠️ CORS: Origem bloqueada - ${origin}`);
      if (process.env.NODE_ENV === 'development') {
        console.log('🔓 Permitindo em modo desenvolvimento');
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization',
    'ngrok-skip-browser-warning', 
    'X-Requested-With',
    'Accept'
  ],
  exposedHeaders: ['Authorization']
};

app.use(cors(corsOptions));

app.use((req, res, next) => {
  if (process.env.NODE_ENV === 'development') {
    res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  }
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, ngrok-skip-browser-warning, X-Requested-With, Accept');
  next();
});

// ===== 🚨 PARSERS DE CORPO (CRUCIAL) =====
app.use(express.json({ limit: '50mb' })); 
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// ===== 🛡️ TRAVA DE SEGURANÇA (FIX ERRO UNDEFINED) =====
// Impede que o servidor caia se req.body for undefined
app.use((req, res, next) => {
    if (!req.body) {
        req.body = {}; 
    }
    next();
});

// ===== 🛡️ SANITIZAÇÃO DE DADOS =====
app.use((req, res, next) => {
    // Como garantimos acima que req.body existe, podemos acessar sem medo
    if (typeof req.body === 'object') {
        Object.keys(req.body).forEach(key => {
            if (req.body[key] === 'undefined') {
                req.body[key] = undefined;
            } else if (req.body[key] === 'null') {
                req.body[key] = null;
            }
        });
    }
    next();
});

const UPLOADS_PATH = path.resolve(__dirname, '../uploads'); 
console.log('📂 Pasta de uploads configurada em:', UPLOADS_PATH);

// Cria a pasta se não existir para evitar erro de inicialização
if (!fs.existsSync(UPLOADS_PATH)){
    fs.mkdirSync(UPLOADS_PATH, { recursive: true });
}

// ✅ FIX PARA AVATARES: Mapeia a URL virtual para a pasta física correta
// Se a pasta no disco chamar 'avatares' (plural pt-BR), mapeia para a rota '/uploads/avatars' (padrão do sistema)
const avatarsPath = path.join(UPLOADS_PATH, 'avatares');
if (fs.existsSync(avatarsPath)) {
    app.use('/uploads/avatars', express.static(avatarsPath));
} else {
    // Fallback: se não achar 'avatares', tenta 'avatars'
    app.use('/uploads/avatars', express.static(path.join(UPLOADS_PATH, 'avatars')));
}

// ✅ CONFIGURAÇÃO GERAL DE ARQUIVOS ESTÁTICOS
// Isso permite acessar qualquer arquivo em /uploads (ex: imagens do blog)
app.use('/uploads', express.static(UPLOADS_PATH, {
  maxAge: '1h', 
  setHeaders: (res, filePath) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  }
}));

// ===== LOG DE REQUISIÇÕES =====
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  const origin = req.headers.origin || 'sem-origin';
  console.log(`${timestamp} - ${req.method} ${req.path} [Origin: ${origin}]`);
  next();
});

// ===== INICIALIZAR SOCKET.IO COM CORS PARA NGROK =====
const io = new Server(server, {
  cors: {
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      
      const allowedOrigins = [
        'http://localhost:5173',
        'http://localhost:3000',
        /^https:\/\/.*\.ngrok-free\.app$/,
        /^https:\/\/.*\.ngrok\.io$/,
        /^https:\/\/.*\.ngrok\.dev$/,
        /^https:\/\/.*\.trycloudflare\.com$/
      ];
      
      const isAllowed = allowedOrigins.some(allowed => {
        if (allowed instanceof RegExp) return allowed.test(origin);
        return allowed === origin;
      });
      
      if (isAllowed || process.env.NODE_ENV === 'development') {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST']
  },
  transports: ['websocket', 'polling'],
  pingTimeout: 60000,
  pingInterval: 25000,
  allowEIO3: true 
});

// ===== 🚨 CORREÇÃO 2: INJEÇÃO DO SOCKET NO EXPRESS (Resolve erro Socket indisponível) =====
app.set('io', io); // ✅ Adiciona 'io' ao express globalmente

app.use((req, res, next) => {
    req.io = io; // ✅ Adiciona 'io' ao req para uso em middlewares/rotas
    next();
});

// ===== MIDDLEWARE DE AUTENTICAÇÃO DO SOCKET.IO =====
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    if (!token) {
      console.error('[Socket Auth] Token não fornecido');
      return next(new Error('Token não fornecido'));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const usuario = await prisma.usuario.findUnique({
      where: { id: decoded.id || decoded.usuarioId },
      include: { conta: true }
    });

    if (!usuario || usuario.status !== 'ATIVO') {
      console.error('[Socket Auth] Usuário inativo ou não encontrado');
      return next(new Error('Usuário não autorizado'));
    }

    socket.usuario = {
      id: usuario.id,
      contaId: usuario.contaId,
      nome: usuario.nome
    };
    
    next();
  } catch (error) {
    console.error('[Socket Auth] Erro na autenticação:', error.message);
    next(new Error('Falha na autenticação'));
  }
});

// ===== LÓGICA DE CONEXÃO DO SOCKET.IO =====
io.on('connection', async (socket) => {
  const { id, nome, contaId } = socket.usuario;
  
  console.log('\n🔌 ==========================================');
  console.log('🔌 SOCKET CONECTADO');
  console.log('==========================================');
  console.log('👤 Nome:', nome);
  console.log('🆔 User ID:', id);
  console.log('🔌 Socket ID:', socket.id);
  console.log('🏢 Conta ID:', contaId);
  
  const salaContaId = `conta:${contaId}`;
  socket.join(salaContaId);
  
  // ✅ ENTRAR NA SALA PESSOAL DO USUÁRIO (CRUCIAL PARA O CHAT INTERNO)
  const salaUsuario = `user:${id}`; 
  socket.join(salaUsuario);
  console.log(`✅ Entrou na sala pessoal: ${salaUsuario}`)
  
  const salas = Array.from(socket.rooms);
  console.log('✅ Salas do socket:', salas);
  console.log('✅ Está na sala da conta?', socket.rooms.has(salaContaId));
  console.log('==========================================\n');
  
  socket.emit('sala_conta_entrou', {
    sala: salaContaId,
    contaId: contaId,
    salas: salas,
    timestamp: new Date().toISOString()
  });

  socket.on('entrar_sala', (sala) => {
    socket.join(sala);
    console.log(`📥 [Socket] ${nome} entrou na sala:`, sala);
    
    const salasAtuais = Array.from(socket.rooms);
    console.log('   Salas atuais:', salasAtuais);
    socket.emit('sala_confirmada', { sala, salas: salasAtuais });
  });

  // Listener explícito para entrada em sala de usuário (Segurança extra)
  socket.on('join_user_room', ({ usuarioId }) => {
      if(usuarioId === id) {
          // ✅ CORREÇÃO: Garantir que o prefixo 'user:' é usado aqui também
          socket.join(`user:${usuarioId}`);
      }
  });
  
  socket.on('disconnect', (reason) => {
    console.log(`❌ [Socket] ${nome} desconectado:`, reason);
  });
});

// ✅ EXPOR GLOBALMENTE (Mantido, mas usar req.app.get('io') é o padrão Express)
global.io = io;
console.log('✅ Socket.IO inicializado e exposto globalmente');

// ============================================
// IMPORTAR ROTAS
// ============================================
const chatInternoRotas = require('./rotas/chatInterno.rotas');
const grupoChatInternoRotas = require('./rotas/grupoChatInterno.rotas');
const autenticacaoRotas = require('./rotas/autenticacao.rotas');
const usuarioRotas = require('./rotas/usuario.rotas');
const blogRotas = require('./rotas/blog.rotas');
const analyticsRotas = require('./rotas/analytics.rotas');
const categoriaRotas = require('./rotas/categoria.rotas');
const empresaRotas = require('./rotas/empresa.rotas');
const statusRotas = require('./rotas/status.rotas');
const whatsappRotas = require('./rotas/whatsapp.rotas');
const chatSuporteRotas = require('./rotas/chatSuporte.rotas');
const criarWhatsappWebhookRouter = require('./rotas/whatsapp.webhook');
const conversasRotas = require('./rotas/conversas.rotas');
const contatosRotas = require('./rotas/contato.rotas.js'); 
const mensagensRotas = require('./rotas/mensagens.rotas');
const interativasRotas = require('./rotas/interativas.rotas');
const debugRotas = require('./rotas/debug.rotas');
const suporteRotas = require('./rotas/suporte.rotas');
const anotacoesRotas = require('./rotas/anotacoes.rotas');
const templatesRotas = require('./rotas/templates.rotas');
const iaRotas = require('./rotas/ia.rotas');

// ============================================
// REGISTRAR ROTAS
// ============================================
app.use('/chat-interno', chatInternoRotas);
app.use('/chat-interno', grupoChatInternoRotas);
app.use('/ia', iaRotas);
app.use('/auth', autenticacaoRotas);
app.use('/usuarios', usuarioRotas);
app.use('/blog', blogRotas);
app.use('/analytics', analyticsRotas);
app.use('/categorias', categoriaRotas);
app.use('/empresas', empresaRotas);
app.use('/status', statusRotas);
app.use('/api/whatsapp/webhook', criarWhatsappWebhookRouter(io));
app.use('/whatsapp', whatsappRotas);
app.use('/chat-suporte', chatSuporteRotas);
app.use('/conversas', conversasRotas);
app.use('/contatos', contatosRotas); 
app.use('/mensagens', mensagensRotas);
app.use('/interativas', interativasRotas);
app.use('/debug', debugRotas);
app.use('/suporte', suporteRotas);
app.use('/anotacoes', anotacoesRotas);
app.use('/reacoes', reacoesRotas);
app.use('/templates', templatesRotas);
app.use('/relatorios', relatorioRotas);

console.log('\n✅ ==========================================');
console.log('✅ Rota /api/reacoes registrada com sucesso!');
console.log('✅ Rotas de Templates registradas!');
console.log('✅ GET    /templates - Listar templates');
console.log('✅ POST   /templates/sincronizar - Sincronizar');
console.log('✅ GET    /templates/:id - Buscar template');
console.log('==========================================\n');

// ============================================
// 🧪 ENDPOINTS DE TESTE (REMOVER EM PRODUÇÃO)
// ============================================

// Teste básico de conexões
app.get('/api/test/templates', async (req, res) => {
  try {
    const conexoes = await prisma.conexaoWhatsApp.findMany({
      select: {
        id: true,
        nomeInstancia: true,
        numeroWhatsApp: true,
        contaId: true,
        phoneNumberId: true
      }
    });
    
    res.json({
      sucesso: true,
      mensagem: 'Endpoint de templates funcionando!',
      conexoesDisponiveis: conexoes,
      config: {
        META_ACCESS_TOKEN: process.env.META_ACCESS_TOKEN ? '✅ Configurado' : '❌ Não configurado',
        WABA_ID: process.env.WABA_ID || process.env.WHATSAPP_BUSINESS_ACCOUNT_ID || '❌ Não configurado'
      }
    });
  } catch (error) {
    res.status(500).json({
      sucesso: false,
      erro: error.message
    });
  }
});

// Teste de templates da Meta API
app.get('/api/test/templates-meta', async (req, res) => {
  try {
    const axios = require('axios');
    
    const META_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN || process.env.META_ACCESS_TOKEN;
    const WABA_ID = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID || process.env.WABA_ID;
    const API_VERSION = process.env.WHATSAPP_API_VERSION || 'v21.0';
    
    console.log('🧪 TESTE - Buscando templates da Meta...');
    console.log('   WABA_ID:', WABA_ID);
    console.log('   Token:', META_ACCESS_TOKEN ? 'Configurado ✅' : 'Não configurado ❌');
    
    if (!META_ACCESS_TOKEN || !WABA_ID) {
      return res.json({
        sucesso: false,
        erro: 'Credenciais não configuradas',
        config: {
          META_ACCESS_TOKEN: META_ACCESS_TOKEN ? 'Configurado ✅' : 'Não configurado ❌',
          WABA_ID: WABA_ID || 'Não configurado ❌'
        }
      });
    }
    
    const url = `https://graph.facebook.com/${API_VERSION}/${WABA_ID}/message_templates`;
    
    const response = await axios.get(url, {
      headers: {
        'Authorization': `Bearer ${META_ACCESS_TOKEN}`
      },
      params: {
        fields: 'name,status,category,language,components,id',
        limit: 10
      },
      timeout: 30000
    });
    
    const templates = response.data.data || [];
    
    res.json({
      sucesso: true,
      mensagem: `${templates.length} templates encontrados na Meta`,
      templates: templates,
      config: {
        WABA_ID,
        API_VERSION,
        url
      }
    });
    
  } catch (error) {
    console.error('❌ Erro no teste:', error.response?.data || error.message);
    res.status(500).json({
      sucesso: false,
      erro: error.message,
      detalhes: error.response?.data
    });
  }
});

// Teste de templates do banco (SEM AUTENTICAÇÃO)
app.get('/api/test/templates-db', async (req, res) => {
  try {
    const { conexaoId } = req.query;
    
    console.log('🧪 [TESTE] Buscando templates do banco...');
    console.log('   conexaoId:', conexaoId);
    
    if (!conexaoId) {
      return res.json({
        sucesso: false,
        erro: 'Parâmetro conexaoId é obrigatório'
      });
    }
    
    // Buscar templates do banco
    const templates = await prisma.templateWhatsApp.findMany({
      where: {
        conexaoWhatsAppId: conexaoId
      },
      orderBy: {
        nomeTemplate: 'asc'
      }
    });
    
    console.log(`✅ ${templates.length} templates encontrados no banco`);
    
    // Se não houver templates, sincronizar
    if (templates.length === 0) {
      console.log('📦 Nenhum template no banco, sincronizando...');
      
      const { sincronizarTemplates } = require('./servicos/meta-templates.servico');
      const resultado = await sincronizarTemplates(conexaoId);
      
      return res.json({
        sucesso: true,
        mensagem: 'Templates sincronizados com sucesso',
        templates: resultado.templates,
        total: resultado.total
      });
    }
    
    res.json({
      sucesso: true,
      templates,
      total: templates.length
    });
    
  } catch (error) {
    console.error('❌ Erro no teste:', error);
    res.status(500).json({
      sucesso: false,
      erro: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// ===== ROTA DE TESTE DE SOCKET =====
app.post('/api/test/socket', (req, res) => {
  const { contaId, mensagem } = req.body;
  const io = req.app.get('io');
  
  if (!io) {
    return res.json({ sucesso: false, erro: 'Socket.IO não disponível' });
  }
  const sala = `conta:${contaId}`;
  console.log('\n🧪 ==========================================');
  console.log('🧪 TESTE DE SOCKET');
  console.log('==========================================');
  console.log('🏢 Sala:', sala);
  console.log('📝 Mensagem:', mensagem);
  const payload = {
    mensagem: {
      id: 'test-' + Date.now(),
      conteudo: mensagem,
      mensagem: mensagem,
      tipo: 'TEXTO',
      direcao: 'RECEBIDA',
      timestamp: new Date(),
      enviadaEm: new Date(),
      fromMe: false
    },
    conversa: {
      id: 'test-conversa',
      nomeCliente: 'Teste Socket',
      numeroCliente: '5511999999999',
      contaId: contaId
    }
  };
  console.log('📦 Payload:', JSON.stringify(payload, null, 2));
  const socketsNaSala = io.sockets.adapter.rooms.get(sala);
  const numClientes = socketsNaSala ? socketsNaSala.size : 0;
  console.log('👥 Clientes na sala:', numClientes);
  if (numClientes === 0) {
    console.warn('⚠️ ATENÇÃO: Nenhum cliente na sala!');
  }
  io.to(sala).emit('nova_mensagem', payload);
  console.log('✅ Evento emitido!');
  console.log('==========================================\n');
  res.json({ 
    sucesso: true, 
    sala,
    clientesNaSala: numClientes,
    payload 
  });
});

// ============================================
// ROTAS DE STATUS E HEALTH CHECK
// ============================================
app.get('/api', (req, res) => {
  const io = req.app.get('io');
  res.json({ 
    message: 'API FaleZap Sistema está online!', 
    version: '1.0.0',
    socketio: !!io ? 'Disponível' : 'Indisponível',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/health', (req, res) => {
  const io = req.app.get('io');
  res.json({ 
    status: 'OK', 
    message: 'Servidor funcionando',
    socketio: !!io ? 'Disponível' : 'Indisponível',
    database: 'Conectado',
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/socket/status', (req, res) => {
  const io = req.app.get('io');
  if (!io) return res.status(500).json({ erro: 'Socket.IO não disponível' });
  const sockets = io.sockets.sockets;
  const socketInfo = Array.from(sockets.values()).map(s => ({
    id: s.id,
    userId: s.usuario?.id,
    nome: s.usuario?.nome,
    salas: Array.from(s.rooms)
  }));
  res.json({
    conectados: sockets.size,
    sockets: socketInfo
  });
});

app.get('/', (req, res) => {
  res.send('Servidor FaleZap está online!');
});

// ===== MIDDLEWARE DE ERRO 404 =====
app.use((req, res, next) => {
  console.warn(`[404] ⚠️ Rota não encontrada: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ 
    erro: `A rota ${req.method} ${req.originalUrl} não existe.`,
    timestamp: new Date().toISOString()
  });
});

// ===== MIDDLEWARE DE ERRO GLOBAL =====
app.use((err, req, res, next) => {
  console.error('[Erro Inesperado no Servidor] ❌', err);
  const mensagemErro = process.env.NODE_ENV === 'development' 
    ? err.message 
    : 'Ocorreu um erro interno no servidor.';
  
  res.status(err.status || 500).json({ 
    erro: mensagemErro,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    timestamp: new Date().toISOString()
  });
});



// ============================================
// INICIALIZAÇÃO DO SERVIDOR
// ============================================
const { 
  garantirConexaoWhatsAppBusiness, 
  limparConexoesDuplicadas, 
  verificarSaudeConexoes 
} = require('./servicos/autoConectar.servico');

const PORT = process.env.PORT || 3000;

server.listen(PORT, async () => {
  console.log(`\n${'='.repeat(70)}`);
  console.log(`🚀 SERVIDOR FALEZAP INICIADO`);
  console.log(`${'='.repeat(70)}`);
  console.log(`📡 Porta: ${PORT}`);
  console.log(`🌐 URL Local: http://localhost:${PORT}`);
  console.log(`🌐 URL Ngrok: Configure o ngrok para expor esta porta`);
  console.log(`🔌 Socket.IO: ${!!global.io ? '✅ Ativo e Global' : '❌ Inativo'}`);
  console.log(`🔗 Frontend: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
  console.log(`📸 Uploads: http://localhost:${PORT}/uploads/`);
  console.log(`🏥 Health Check: http://localhost:${PORT}/api/health`);
  console.log(`🗄️ Database: ${prisma ? '✅ Conectado' : '❌ Desconectado'}`);
  console.log(`⚙️ Ambiente: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔓 CORS: Configurado para aceitar ngrok`);
  console.log(`${'='.repeat(70)}\n`);

  try {
    console.log('🔧 [INICIALIZAÇÃO] Configurando WhatsApp Business...');
    await limparConexoesDuplicadas();
    await garantirConexaoWhatsAppBusiness();
    await verificarSaudeConexoes();
    console.log('✅ [INICIALIZAÇÃO] WhatsApp Business configurado!\n');
  } catch (erro) {
    console.error('❌ [INICIALIZAÇÃO] Erro ao configurar WhatsApp:', erro.message);
  }

  try {
    console.log('📱 Iniciando sistema de auto-reconexão WhatsApp (Baileys)...');
    const whatsappServico = require('./servicos/baileys.servico');
    await whatsappServico.iniciarSessoesSalvas();
    console.log('✅ Sessões do Baileys iniciadas com sucesso!\n');
  } catch (erro) {
    console.error('❌ Erro ao iniciar sessões do Baileys:', erro.message);
  }
});

// ============================================
// GRACEFUL SHUTDOWN
// ============================================
const gracefulShutdown = async () => {
  console.log('\n[SERVIDOR] 🛑 Iniciando desligamento gracioso...');
  
  io.close(() => {
    console.log('[SOCKET] ✅ Todas as conexões Socket.IO fechadas');
  });
  
  server.close(async () => {
    console.log('[SERVIDOR] ✅ Servidor HTTP fechado');
    
    await prisma.$disconnect();
    console.log('[PRISMA] ✅ Conexão com banco de dados fechada');
    
    console.log('[SERVIDOR] 👋 Desligamento concluído');
    process.exit(0);
  });

  setTimeout(() => {
    console.log('❌ Encerramento forçado');
    process.exit(1);
  }, 10000);
};

process.on('unhandledRejection', (reason, promise) => {
  console.error('\n❌ UNHANDLED REJECTION ❌');
  console.error('Razão:', reason);
  console.error('Promise:', promise);
  console.error('\n');
});

process.on('uncaughtException', (error) => {
  console.error('\n❌ UNCAUGHT EXCEPTION ❌');
  console.error('Erro:', error);
  console.error('\n');
  gracefulShutdown();
});

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

module.exports = { app, server, io };