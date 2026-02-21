// frontend/src/componentes/mensagens/DebugMensagens.jsx - VERSÃO MELHORADA

import React, { useState, useEffect } from 'react';
import { useSocket } from '../../contextos/SocketContext';
import { useAuth } from '../../contextos/AuthContext';
import { Bug, RefreshCw, Wifi, WifiOff, Zap, X, Minimize2, Maximize2 } from 'lucide-react';
import api from '../../servicos/api';

export default function DebugMensagens({ conversaSelecionada }) {
  const { socket } = useSocket();
  const { usuario } = useAuth();
  const [logs, setLogs] = useState([]);
  const [minimizado, setMinimizado] = useState(false);
  const [stats, setStats] = useState({
    socketConectado: false,
    socketId: null,
    conversas: 0,
    mensagens: 0,
    eventosSocket: 0,
    ultimaAtualizacao: null,
    sala: null
  });

  // Atualizar status do socket
  useEffect(() => {
    if (socket) {
      setStats(prev => ({ 
        ...prev, 
        socketConectado: true,
        socketId: socket.id,
        sala: usuario?.contaId ? `conta:${usuario.contaId}` : null
      }));
    } else {
      setStats(prev => ({ 
        ...prev, 
        socketConectado: false,
        socketId: null 
      }));
    }
  }, [socket, usuario]);

  const addLog = (tipo, mensagem) => {
    const timestamp = new Date().toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    });
    
    setLogs(prev => [...prev.slice(-20), {
      tipo,
      mensagem,
      timestamp
    }]);
  };

  // Escutar eventos do socket
  useEffect(() => {
    if (!socket) return;

    const handleNovaMensagem = (dados) => {
      addLog('success', `📨 Nova mensagem: ${dados.mensagem?.conteudo?.substring(0, 40) || '[sem conteúdo]'}...`);
      setStats(prev => ({ 
        ...prev, 
        mensagens: prev.mensagens + 1,
        eventosSocket: prev.eventosSocket + 1,
        ultimaAtualizacao: new Date() 
      }));
    };

    const handleConversaAtualizada = (dados) => {
      addLog('info', `🔄 Conversa atualizada: ${dados.numeroCliente || dados.id}`);
      setStats(prev => ({ 
        ...prev,
        eventosSocket: prev.eventosSocket + 1,
        ultimaAtualizacao: new Date() 
      }));
    };

    const handleMensagemStatus = (dados) => {
      addLog('info', `📊 Status: ${dados.status}`);
      setStats(prev => ({ 
        ...prev,
        eventosSocket: prev.eventosSocket + 1,
        ultimaAtualizacao: new Date() 
      }));
    };

    const handleConnect = () => {
      addLog('success', `✅ Socket conectado: ${socket.id}`);
      setStats(prev => ({ ...prev, socketConectado: true, socketId: socket.id }));
    };

    const handleDisconnect = () => {
      addLog('error', '❌ Socket desconectado');
      setStats(prev => ({ ...prev, socketConectado: false, socketId: null }));
    };

    socket.on('nova_mensagem', handleNovaMensagem);
    socket.on('conversa_atualizada', handleConversaAtualizada);
    socket.on('mensagem_status_atualizada', handleMensagemStatus);
    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);

    return () => {
      socket.off('nova_mensagem', handleNovaMensagem);
      socket.off('conversa_atualizada', handleConversaAtualizada);
      socket.off('mensagem_status_atualizada', handleMensagemStatus);
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
    };
  }, [socket]);

  const testarConexao = async () => {
    addLog('info', '🔍 Testando API...');
    try {
      const response = await api.get('/whatsapp/conversas');
      addLog('success', `✅ API OK: ${response.data.conversas?.length || 0} conversas`);
      setStats(prev => ({ ...prev, conversas: response.data.conversas?.length || 0 }));
    } catch (error) {
      addLog('error', `❌ Erro API: ${error.message}`);
    }
  };

  const testarSocket = () => {
    if (socket) {
      addLog('info', '🔌 Testando socket...');
      socket.emit('ping');
      addLog('success', '✅ Ping enviado');
      
      // Tentar entrar na sala novamente
      if (usuario?.contaId) {
        const sala = `conta:${usuario.contaId}`;
        socket.emit('entrar_sala', sala);
        addLog('info', `🚪 Tentando entrar na sala: ${sala}`);
      }
    } else {
      addLog('error', '❌ Socket não conectado');
    }
  };

  const limparLogs = () => {
    setLogs([]);
    setStats(prev => ({ ...prev, mensagens: 0, eventosSocket: 0 }));
  };

  if (minimizado) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setMinimizado(false)}
          className="bg-purple-600 text-white p-3 rounded-full shadow-2xl hover:bg-purple-700 transition-all hover:scale-110"
          title="Abrir Debug"
        >
          <Bug className="w-5 h-5" />
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 w-[420px] bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border-2 border-purple-200 dark:border-purple-800 z-50 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-700 p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
              <Bug className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">Debug WhatsApp Business</h3>
              <p className="text-xs text-purple-200">Modo Desenvolvedor</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={testarConexao}
              className="p-2 rounded-lg hover:bg-white/20 transition-colors"
              title="Atualizar"
            >
              <RefreshCw className="w-4 h-4 text-white" />
            </button>
            <button
              onClick={() => setMinimizado(true)}
              className="p-2 rounded-lg hover:bg-white/20 transition-colors"
              title="Minimizar"
            >
              <Minimize2 className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 max-h-[600px] overflow-y-auto">
        {/* Status Socket */}
        <div className={`rounded-xl p-4 mb-4 ${
          stats.socketConectado 
            ? 'bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-800' 
            : 'bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800'
        }`}>
          <div className="flex items-center gap-3">
            {stats.socketConectado ? (
              <>
                <Wifi className="w-6 h-6 text-green-600 dark:text-green-400" />
                <div className="flex-1">
                  <p className="font-bold text-sm text-green-800 dark:text-green-200">Socket Conectado</p>
                  <p className="text-xs text-green-600 dark:text-green-400 font-mono">{stats.socketId}</p>
                </div>
              </>
            ) : (
              <>
                <WifiOff className="w-6 h-6 text-red-600 dark:text-red-400" />
                <div className="flex-1">
                  <p className="font-bold text-sm text-red-800 dark:text-red-200">Socket Desconectado</p>
                  <p className="text-xs text-red-600 dark:text-red-400">Verificando conexão...</p>
                </div>
              </>
            )}
          </div>
          {stats.sala && (
            <div className="mt-2 pt-2 border-t border-green-200 dark:border-green-800">
              <p className="text-xs text-green-700 dark:text-green-300">
                🚪 Sala: <span className="font-mono font-bold">{stats.sala}</span>
              </p>
            </div>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3 border border-blue-200 dark:border-blue-800">
            <p className="text-xs text-blue-600 dark:text-blue-400 font-medium mb-1">Conversas</p>
            <p className="text-2xl font-bold text-blue-800 dark:text-blue-200">{stats.conversas}</p>
          </div>
          
          <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-3 border border-green-200 dark:border-green-800">
            <p className="text-xs text-green-600 dark:text-green-400 font-medium mb-1">Mensagens</p>
            <p className="text-2xl font-bold text-green-800 dark:text-green-200">{stats.mensagens}</p>
          </div>
          
          <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-3 border border-purple-200 dark:border-purple-800">
            <p className="text-xs text-purple-600 dark:text-purple-400 font-medium mb-1">Eventos Socket</p>
            <p className="text-2xl font-bold text-purple-800 dark:text-purple-200">{stats.eventosSocket}</p>
          </div>
          
          <div className="bg-orange-50 dark:bg-orange-900/20 rounded-xl p-3 border border-orange-200 dark:border-orange-800">
            <p className="text-xs text-orange-600 dark:text-orange-400 font-medium mb-1">Última</p>
            <p className="text-xs font-bold text-orange-800 dark:text-orange-200">
              {stats.ultimaAtualizacao?.toLocaleTimeString('pt-BR', { 
                hour: '2-digit', 
                minute: '2-digit',
                second: '2-digit'
              }) || '--:--:--'}
            </p>
          </div>
        </div>

        {/* Conversa Selecionada */}
        {conversaSelecionada && (
          <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-xl p-3 mb-4 border border-indigo-200 dark:border-indigo-800">
            <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium mb-2">📱 Conversa Atual:</p>
            <p className="text-sm font-bold text-indigo-900 dark:text-indigo-100 truncate">
              {conversaSelecionada.nomeCliente || conversaSelecionada.numeroCliente}
            </p>
            <p className="text-xs text-indigo-600 dark:text-indigo-400 font-mono truncate">
              {conversaSelecionada.numeroCliente}
            </p>
          </div>
        )}

        {/* Usuário */}
        {usuario && (
          <div className="bg-teal-50 dark:bg-teal-900/20 rounded-xl p-3 mb-4 border border-teal-200 dark:border-teal-800">
            <p className="text-xs text-teal-600 dark:text-teal-400 font-medium mb-2">👤 Usuário:</p>
            <p className="text-sm font-bold text-teal-900 dark:text-teal-100 truncate">{usuario.nome}</p>
            <p className="text-xs text-teal-600 dark:text-teal-400 font-mono truncate">
              Conta: {usuario.contaId}
            </p>
          </div>
        )}

        {/* Logs */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-bold text-gray-700 dark:text-gray-300">📋 Últimos Eventos:</p>
            <button
              onClick={limparLogs}
              className="text-xs text-red-600 hover:text-red-700 font-medium"
            >
              Limpar
            </button>
          </div>
          <div className="space-y-1.5 max-h-60 overflow-y-auto rounded-lg bg-gray-50 dark:bg-gray-800 p-2">
            {logs.length === 0 ? (
              <p className="text-xs text-gray-400 dark:text-gray-500 italic text-center py-4">
                Nenhum evento ainda... Envie uma mensagem para testar!
              </p>
            ) : (
              logs.map((log, index) => (
                <div
                  key={index}
                  className={`text-xs p-2 rounded-lg font-mono ${
                    log.tipo === 'success' 
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border border-green-200 dark:border-green-800' :
                    log.tipo === 'error' 
                      ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800' :
                    'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                  }`}
                >
                  <span className="opacity-70">[{log.timestamp}]</span>{' '}
                  <span className="font-medium">{log.mensagem}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Ações */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={testarConexao}
            className="px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl text-sm font-bold hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl hover:scale-105 flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Testar API
          </button>
          <button
            onClick={testarSocket}
            className="px-4 py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl text-sm font-bold hover:from-purple-600 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl hover:scale-105 flex items-center justify-center gap-2"
          >
            <Zap className="w-4 h-4" />
            Testar Socket
          </button>
        </div>
      </div>
    </div>
  );
}