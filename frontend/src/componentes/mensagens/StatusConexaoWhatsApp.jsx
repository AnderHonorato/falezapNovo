// frontend/src/componentes/mensagens/StatusConexaoWhatsApp.jsx

import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, AlertCircle, RefreshCw, QrCode, X } from 'lucide-react';
import api from '../../servicos/api';
import { useSocket } from '../../contextos/SocketContext';
import toast from 'react-hot-toast';

export default function StatusConexaoWhatsApp({ tema }) {
  const { socket } = useSocket();
  const [status, setStatus] = useState('checking');
  const [detalhes, setDetalhes] = useState(null);
  const [verificando, setVerificando] = useState(false);
  const [mostrarQR, setMostrarQR] = useState(false);
  const [qrCode, setQrCode] = useState(null);
  const [reconectando, setReconectando] = useState(false);

  // VERIFICAR STATUS
  const verificarStatus = async () => {
    setVerificando(true);
    try {
      const response = await api.get('/whatsapp/status');
      const statusConexao = response.data.conectado ? 'conectado' : 'desconectado';
      setStatus(statusConexao);
      
      setDetalhes({
        instancia: response.data.instancia || 'Principal',
        numero: response.data.numero || 'Não conectado',
        status: response.data.status,
        ultimaAtualizacao: new Date().toLocaleTimeString()
      });

      if (response.data.qrCode) {
        setQrCode(response.data.qrCode);
      }
    } catch (error) {
      console.error('❌ Erro ao verificar status:', error);
      setStatus('erro');
      setDetalhes(null);
    } finally {
      setVerificando(false);
    }
  };

  // RECONECTAR
  const handleReconectar = async () => {
    setReconectando(true);
    setMostrarQR(true);
    try {
      const response = await api.post('/whatsapp/reconectar');
      setQrCode(response.data.qrCode);
      setStatus('aguardando_qr');
      toast.success('QR Code gerado! Escaneie com seu WhatsApp.');
    } catch (error) {
      console.error('❌ Erro ao reconectar:', error);
      toast.error('Erro ao gerar QR Code');
      setMostrarQR(false);
    } finally {
      setReconectando(false);
    }
  };

  // SOCKET.IO - ESCUTAR STATUS
  useEffect(() => {
    if (!socket) return;
    const handleStatusChange = (dados) => {
      if (dados.status === 'CONECTADO') {
        setStatus('conectado');
        setMostrarQR(false);
        toast.success('WhatsApp conectado com sucesso!');
        verificarStatus();
      } else if (dados.status === 'DESCONECTADO') {
        setStatus('desconectado');
        toast.error('WhatsApp desconectado');
      } else if (dados.status === 'AGUARDANDO_QR') {
        setStatus('aguardando_qr');
        if (dados.qrCode) {
          setQrCode(dados.qrCode);
          setMostrarQR(true);
        }
      }
    };
    socket.on('whatsapp_status', handleStatusChange);
    return () => {
      socket.off('whatsapp_status', handleStatusChange);
    };
  }, [socket]);

  // VERIFICAR STATUS INICIAL E POLLING
  useEffect(() => {
    verificarStatus();
    const interval = setInterval(verificarStatus, 30000); // A cada 30s
    return () => clearInterval(interval);
  }, []);

  // CONFIGURAÇÃO DE EXIBIÇÃO
  const getStatusConfig = () => {
    switch (status) {
      case 'conectado':
        return {
          cor: '#10B981',
          icone: Wifi,
          texto: 'WhatsApp Conectado',
          bg: 'rgba(16, 185, 129, 0.1)'
        };
      case 'desconectado':
        return {
          cor: '#EF4444',
          icone: WifiOff,
          texto: 'WhatsApp Desconectado',
          bg: 'rgba(239, 68, 68, 0.1)'
        };
      case 'aguardando_qr':
        return {
          cor: '#F59E0B',
          icone: QrCode,
          texto: 'Aguardando QR Code',
          bg: 'rgba(245, 158, 11, 0.1)'
        };
      case 'erro':
        return {
          cor: '#F59E0B',
          icone: AlertCircle,
          texto: 'Erro na Conexão',
          bg: 'rgba(245, 158, 11, 0.1)'
        };
      default:
        return {
          cor: '#6B7280',
          icone: RefreshCw,
          texto: 'Verificando...',
          bg: 'rgba(107, 114, 128, 0.1)'
        };
    }
  };

  const config = getStatusConfig();
  const Icone = config.icone;

  return (
    <>
      {/* INDICADOR COMPACTO */}
      <div className="fixed top-4 right-4 z-50 animate-fadeIn">
        <div
          className="flex items-center gap-3 px-4 py-3 rounded-2xl shadow-lg transition-all"
          style={{
            backgroundColor: config.bg,
            border: `1px solid ${config.cor}40`
          }}
        >
          <div className="relative">
            <Icone
              className={`w-5 h-5 ${status === 'checking' ? 'animate-spin' : ''}`}
              style={{ color: config.cor }}
            />
            {status === 'conectado' && (
              <div
                className="absolute -top-1 -right-1 w-3 h-3 rounded-full animate-pulse"
                style={{ backgroundColor: config.cor }}
              />
            )}
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold" style={{ color: config.cor }}>
              {config.texto}
            </span>
            {detalhes && status === 'conectado' && (
              <span className="text-xs opacity-70" style={{ color: config.cor }}>
                {detalhes.numero} • {detalhes.ultimaAtualizacao}
              </span>
            )}
          </div>
          <button
            onClick={verificarStatus}
            disabled={verificando}
            className="ml-2 p-1.5 rounded-lg hover:bg-white/20 transition-all"
            style={{ color: config.cor }}
            title="Verificar status"
          >
            <RefreshCw className={`w-4 h-4 ${verificando ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* AÇÕES RÁPIDAS */}
        {status === 'desconectado' && (
          <div
            className="mt-2 px-4 py-3 rounded-2xl shadow-lg animate-slideUp"
            style={{
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)'
            }}
          >
            <p className="text-sm font-medium mb-2" style={{ color: '#EF4444' }}>
              Ação necessária:
            </p>
            <button
              className="w-full px-3 py-2 bg-red-500 text-white text-sm font-semibold rounded-lg hover:bg-red-600 transition-all disabled:opacity-50"
              onClick={handleReconectar}
              disabled={reconectando}
            >
              {reconectando ? (
                <span className="flex items-center justify-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Gerando QR Code...
                </span>
              ) : (
                'Reconectar WhatsApp'
              )}
            </button>
          </div>
        )}
      </div>

      {/* MODAL DO QR CODE */}
      {mostrarQR && qrCode && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/65 animate-fadeIn"
          onClick={() => setMostrarQR(false)}
        >
          <div 
            className="rounded-3xl shadow-2xl p-6 max-w-md w-full mx-4 animate-scaleIn"
            style={{ backgroundColor: tema.fundo }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* HEADER */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div 
                  className="w-12 h-12 rounded-2xl flex items-center justify-center"
                  style={{ backgroundColor: `${tema.verde}20` }}
                >
                  <QrCode className="w-6 h-6" style={{ color: tema.verde }} />
                </div>
                <div>
                  <h3 className="text-lg font-bold" style={{ color: tema.texto }}>
                    Conectar WhatsApp
                  </h3>
                  <p className="text-sm" style={{ color: tema.textoSecundario }}>
                    Escaneie o QR Code
                  </p>
                </div>
              </div>
              <button
                onClick={() => setMostrarQR(false)}
                className="p-2 rounded-lg transition-all hover:scale-110"
                style={{ backgroundColor: tema.hover, color: tema.textoSecundario }}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* QR CODE */}
            <div className="bg-white p-4 rounded-xl mb-4 flex items-center justify-center">
              <img 
                src={qrCode} 
                alt="QR Code WhatsApp" 
                className="w-64 h-64"
              />
            </div>

            {/* INSTRUÇÕES */}
            <div 
              className="p-4 rounded-xl mb-4"
              style={{ backgroundColor: `${tema.verde}10` }}
            >
              <p className="text-sm font-medium mb-2" style={{ color: tema.texto }}>
                Como conectar:
              </p>
              <ol className="text-sm space-y-1" style={{ color: tema.textoSecundario }}>
                <li>1. Abra o WhatsApp no seu celular</li>
                <li>2. Toque em Mais opções → Dispositivos conectados</li>
                <li>3. Toque em Conectar um dispositivo</li>
                <li>4. Aponte seu celular para esta tela</li>
              </ol>
            </div>

            {/* BOTÕES */}
            <div className="flex gap-3">
              <button
                onClick={() => setMostrarQR(false)}
                className="flex-1 px-4 py-3 rounded-xl font-semibold transition-all hover:scale-[1.02]"
                style={{ 
                  backgroundColor: tema.hover,
                  color: tema.texto
                }}
              >
                Fechar
              </button>
              <button
                onClick={handleReconectar}
                disabled={reconectando}
                className="flex-1 px-4 py-3 rounded-xl font-semibold text-white transition-all disabled:opacity-50 hover:scale-[1.02]"
                style={{ backgroundColor: tema.verde }}
              >
                {reconectando ? 'Gerando...' : 'Gerar Novo QR'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Estilos CSS embutidos */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }
        .animate-scaleIn {
          animation: scaleIn 0.2s ease-out;
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
        .animate-pulse {
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </>
  );
}