// frontend/src/contextos/SocketContext.jsx - ✅ COM DEBUG GLOBAL

import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext(null);

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) throw new Error('useSocket deve ser usado dentro de SocketProvider');
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [conectado, setConectado] = useState(false);
  const [salas, setSalas] = useState([]); // ✅ ADICIONAR
  const socketRef = useRef(null);
  const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');

  useEffect(() => {
    if (!usuario?.id || !usuario?.contaId || socketRef.current) {
      console.warn('⚠️ [SocketContext] Aguardando usuário ou socket já existe');
      return;
    }

    console.log('\n🔌 ==========================================');
    console.log('🔌 INICIALIZANDO SOCKET.IO');
    console.log('==========================================');
    console.log('👤 Usuário ID:', usuario.id);
    console.log('🏢 Conta ID:', usuario.contaId);

    const novoSocket = io(import.meta.env.VITE_API_URL || 'http://localhost:3000', {
      auth: { 
        token: localStorage.getItem('token'),
        contaId: usuario.contaId
      },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
      transports: ['websocket', 'polling'],
    });

    socketRef.current = novoSocket;
    window.__SOCKET__ = novoSocket;
    window.__SOCKET_SALAS__ = []; // ✅ ADICIONAR

    // Logger geral
    novoSocket.onAny((event, payload) => {
      console.log('🔔 [Socket] Evento recebido:', event, payload);
    });

    // Conexão
    novoSocket.on('connect', () => {
      console.log('✅ [SOCKET] Conectado!');
      console.log('   - Socket ID:', novoSocket.id);
      setConectado(true);
      setSocket(novoSocket);
      
      const salaContaId = `conta:${usuario.contaId}`;
      console.log('📥 [Socket] Entrando na sala:', salaContaId);
      novoSocket.emit('entrar_sala', salaContaId);
    });

    // ✅ CONFIRMAÇÃO DE ENTRADA NA SALA
    novoSocket.on('sala_conta_entrou', (data) => {
      console.log('✅ [Socket] Confirmação de entrada:', data);
      console.log('   - Sala:', data.sala);
      console.log('   - Salas:', data.salas);
      setSalas(data.salas || []);
      window.__SOCKET_SALAS__ = data.salas || [];
    });

    // ✅ CONFIRMAÇÃO APÓS entrar_sala
    novoSocket.on('sala_confirmada', (data) => {
      console.log('✅ [Socket] Sala confirmada:', data);
      setSalas(data.salas || []);
      window.__SOCKET_SALAS__ = data.salas || [];
    });

    // Desconexão
    novoSocket.on('disconnect', (reason) => {
      console.log('❌ [SOCKET] Desconectado:', reason);
      setConectado(false);
      setSalas([]);
    });

    // Erro
    novoSocket.on('connect_error', (erro) => {
      console.error('❌ [SOCKET] Erro de conexão:', erro.message);
      setConectado(false);
    });

    console.log('==========================================\n');

    return () => {
      console.log('🧹 [SocketContext] Limpando socket...');
      if (socketRef.current) {
        socketRef.current.removeAllListeners();
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      delete window.__SOCKET__;
      delete window.__SOCKET_SALAS__;
    };
  }, [usuario?.id, usuario?.contaId]);

  const value = {
    socket,
    conectado,
    salas // ✅ ADICIONAR
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};