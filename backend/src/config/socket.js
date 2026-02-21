// backend/src/config/socket.js - ✅ CORRIGIDO

const socketIO = require('socket.io');
const jwt = require('jsonwebtoken');

let io;

const inicializarSocket = (servidor) => {
  io = socketIO(servidor, {
    cors: {
      origin: ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'],
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      credentials: true,
      allowedHeaders: ['Content-Type', 'Authorization']
    },
    transports: ['websocket', 'polling'],
    pingTimeout: 60000,
    pingInterval: 25000
  });

  // ============================================
  // ✅ MIDDLEWARE DE AUTENTICAÇÃO
  // ============================================
  
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        console.error('❌ [SOCKET] Token não fornecido');
        return next(new Error('Autenticação necessária'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.usuario = decoded;
      
      console.log('✅ [SOCKET] Autenticação bem-sucedida:', {
        usuarioId: decoded.id,
        contaId: decoded.contaId
      });
      
      next();
    } catch (erro) {
      console.error('❌ [SOCKET] Erro de autenticação:', erro.message);
      next(new Error('Token inválido'));
    }
  });

  // ============================================
  // ✅ HANDLERS DE CONEXÃO
  // ============================================
  
  io.on('connection', (socket) => {
    const { id: usuarioId, contaId } = socket.usuario;
    
    console.log('\n🔌 ==========================================');
    console.log('🔌 [SOCKET] NOVA CONEXÃO');
    console.log('==========================================');
    console.log('🆔 Socket ID:', socket.id);
    console.log('👤 Usuário ID:', usuarioId);
    console.log('🏢 Conta ID:', contaId);

    // ✅ ENTRAR AUTOMATICAMENTE NA SALA DA CONTA
    const salaContaId = `conta:${contaId}`;
    socket.join(salaContaId);
    console.log(`✅ [SOCKET] Usuário entrou na sala: ${salaContaId}`);
    
    // Emitir confirmação
    socket.emit('sala_conta_entrou', {
      sala: salaContaId,
      contaId: contaId,
      timestamp: new Date().toISOString()
    });
    console.log('==========================================\n');

    // ============================================
    // ✅ HANDLER EXPLÍCITO PARA ENTRAR NA SALA
    // ============================================
    
    socket.on('entrar_sala_conta', (data) => {
      console.log('📥 [SOCKET] Solicitação para entrar na sala:', data);
      
      const sala = `conta:${data.contaId}`;
      socket.join(sala);
      
      console.log(`✅ [SOCKET] Confirmado: Entrou na sala ${sala}`);
      
      socket.emit('sala_conta_entrou', {
        sala: sala,
        contaId: data.contaId,
        timestamp: new Date().toISOString()
      });
    });

    // ============================================
    // ✅ PING/PONG PARA MANTER CONEXÃO
    // ============================================
    
    const pingInterval = setInterval(() => {
      socket.emit('ping', { timestamp: Date.now() });
    }, 30000);

    socket.on('pong', (data) => {
      console.log('🏓 [SOCKET] Pong recebido de', socket.id);
    });

    // ============================================
    // ✅ DESCONEXÃO
    // ============================================
    
    socket.on('disconnect', (razao) => {
      clearInterval(pingInterval);
      console.log('❌ [SOCKET] Desconectado:', {
        socketId: socket.id,
        usuarioId: usuarioId,
        razao: razao
      });
    });

    socket.on('error', (erro) => {
      console.error('❌ [SOCKET] Erro:', erro);
    });
  });

  // ============================================
  // ✅ EXPOR GLOBALMENTE
  // ============================================
  
  global.io = io;
  console.log('✅ [SOCKET] Socket.IO inicializado e exposto globalmente');

  return io;
};

// ============================================
// ✅ FUNÇÃO AUXILIAR PARA EMITIR EVENTOS
// ============================================

const emitirParaConta = (contaId, evento, dados) => {
  if (!io) {
    console.error('❌ Socket.IO não inicializado');
    return false;
  }

  const sala = `conta:${contaId}`;
  
  console.log(`📤 [SOCKET] Emitindo "${evento}" para sala: ${sala}`);
  console.log('📦 Dados:', JSON.stringify(dados, null, 2));
  
  io.to(sala).emit(evento, dados);
  
  return true;
};

module.exports = {
  inicializarSocket,
  emitirParaConta,
  obterIO: () => io
};