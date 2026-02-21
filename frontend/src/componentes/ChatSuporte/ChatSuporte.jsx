// frontend/src/componentes/ChatSuporte/ChatSuporte.jsx - VISUAL MODERNO ELEGANTE

import { useState, useEffect, useRef } from 'react';
import { X, Send, Loader2, LifeBuoy, User, Sparkles, CheckCircle } from 'lucide-react';
import { useAuth } from '../../contextos/AuthContext';
import api from '../../servicos/api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import io from 'socket.io-client';

const API_URL_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const SOCKET_URL = API_URL_BASE.replace('/api', '');

export default function ChatSuporte({ solicitacao, onFechar }) {
  const { usuario } = useAuth();
  const [mensagens, setMensagens] = useState([]);
  const [conteudo, setConteudo] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [socket, setSocket] = useState(null);
  const mensagensRef = useRef(null);

  const isSolicitante = usuario.id === solicitacao.solicitanteId;
  const isAtendente = usuario.id === solicitacao.atendidoPorId;

  useEffect(() => {
    carregarMensagens();
  }, [solicitacao.id]);

  useEffect(() => {
    const socketInstance = io(SOCKET_URL, {
      auth: { token: localStorage.getItem('token') },
      transports: ['websocket', 'polling']
    });

    socketInstance.on('connect', () => {
      console.log('[CHAT SUPORTE] Socket conectado');
      socketInstance.emit('join_user_room', { usuarioId: usuario.id });
    });

    socketInstance.on('nova_mensagem_suporte', ({ mensagem, solicitacaoId }) => {
      if (solicitacaoId === solicitacao.id) {
        setMensagens(prev => [...prev, mensagem]);
        rolarParaFinal();
      }
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [solicitacao.id, usuario.id]);

  const carregarMensagens = async () => {
    setCarregando(true);
    try {
      const response = await api.get(`/chat-suporte/mensagens/${solicitacao.id}`);
      setMensagens(response.data.mensagens || []);
      setTimeout(rolarParaFinal, 100);
    } catch (error) {
      console.error('[CHAT SUPORTE] Erro ao carregar mensagens:', error);
      toast.error('Erro ao carregar mensagens.');
    } finally {
      setCarregando(false);
    }
  };

  const enviarMensagem = async (e) => {
    e?.preventDefault();
    if (!conteudo.trim() || enviando) return;

    setEnviando(true);
    try {
      await api.post(`/chat-suporte/mensagens/${solicitacao.id}`, {
        conteudo: conteudo.trim()
      });
      setConteudo('');
    } catch (error) {
      console.error('[CHAT SUPORTE] Erro ao enviar mensagem:', error);
      toast.error('Erro ao enviar mensagem.');
    } finally {
      setEnviando(false);
    }
  };

  const rolarParaFinal = () => {
    if (mensagensRef.current) {
      mensagensRef.current.scrollTop = mensagensRef.current.scrollHeight;
    }
  };

  const getOutraParte = () => {
    if (isSolicitante) {
      return solicitacao.atendidoPor || { nome: 'Atendente', foto_perfil: null };
    }
    return solicitacao.solicitante;
  };

  const outraParte = getOutraParte();

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col animate-scaleIn overflow-hidden">
        
        {/* Header com Gradiente */}
        <div className="bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 text-white px-8 py-5 flex items-center justify-between flex-shrink-0 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer"></div>
          
          <div className="flex items-center gap-4 relative z-10">
            <div className="relative">
              <div className="w-14 h-14 bg-white/20 backdrop-blur-xl rounded-2xl overflow-hidden">
                {outraParte.foto_perfil ? (
                  <img
                    src={`${API_URL_BASE}/uploads/avatars/${outraParte.foto_perfil}`}
                    alt={outraParte.nome}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.parentElement.innerHTML = `
                        <div class="w-full h-full bg-white/20 flex items-center justify-center">
                          <span class="text-xl font-bold">${outraParte.nome.charAt(0)}</span>
                        </div>
                      `;
                    }}
                  />
                ) : (
                  <div className="w-full h-full bg-white/20 flex items-center justify-center text-xl font-bold">
                    {outraParte.nome.charAt(0)}
                  </div>
                )}
              </div>
              
              {/* Status Online */}
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white"></div>
            </div>
            
            <div>
              <h2 className="text-xl font-bold flex items-center gap-2">
                {outraParte.nome}
                <Sparkles className="w-5 h-5 animate-pulse" />
              </h2>
              <p className="text-sm text-blue-100 flex items-center gap-2 font-medium">
                <LifeBuoy className="w-4 h-4" />
                {solicitacao.protocolo}
                {solicitacao.status === 'ENCERRADO' && (
                  <span className="ml-2 px-2 py-0.5 bg-white/20 rounded-full text-xs">
                    Encerrado
                  </span>
                )}
              </p>
            </div>
          </div>
          
          <button
            onClick={onFechar}
            className="w-10 h-10 hover:bg-white/20 rounded-full transition-all flex items-center justify-center relative z-10 hover:rotate-90"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Área de Mensagens */}
        <div 
          ref={mensagensRef}
          className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50 dark:bg-gray-800"
        >
          {carregando ? (
            <div className="flex flex-col items-center justify-center h-full">
              <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
              <p className="text-gray-600 dark:text-gray-400">Carregando mensagens...</p>
            </div>
          ) : mensagens.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-8">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-full flex items-center justify-center mb-6">
                <LifeBuoy className="w-12 h-12 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Nenhuma mensagem ainda
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Envie a primeira mensagem para iniciar o atendimento
              </p>
            </div>
          ) : (
            mensagens.map((msg) => {
              const ehMinha = msg.remetenteId === usuario.id;
              
              return (
                <div
                  key={msg.id}
                  className={`flex ${ehMinha ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex items-end gap-3 max-w-[75%] ${ehMinha ? 'flex-row-reverse' : 'flex-row'}`}>
                    {/* Avatar */}
                    <div className="w-10 h-10 flex-shrink-0 relative">
                      {msg.remetente.foto_perfil ? (
                        <img
                          src={`${API_URL_BASE}/uploads/avatars/${msg.remetente.foto_perfil}`}
                          alt={msg.remetente.nome}
                          className="w-full h-full rounded-full object-cover ring-2 ring-white dark:ring-gray-700"
                        />
                      ) : (
                        <div className={`w-full h-full rounded-full flex items-center justify-center text-white text-sm font-bold shadow-lg ${
                          ehMinha ? 'bg-gradient-to-br from-blue-500 to-indigo-600' : 'bg-gradient-to-br from-gray-500 to-gray-600'
                        }`}>
                          {msg.remetente.nome.charAt(0)}
                        </div>
                      )}
                    </div>
                    
                    {/* Balão da Mensagem */}
                    <div>
                      <div
                        className={`px-5 py-3 rounded-2xl shadow-md ${
                          ehMinha
                            ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white'
                            : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600'
                        }`}
                      >
                        <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                          {msg.conteudo}
                        </p>
                      </div>
                      
                      <div className={`flex items-center gap-2 mt-1.5 text-xs ${
                        ehMinha ? 'justify-end text-blue-600 dark:text-blue-400' : 'justify-start text-gray-500 dark:text-gray-400'
                      }`}>
                        <span>{format(new Date(msg.criadaEm), 'HH:mm', { locale: ptBR })}</span>
                        {ehMinha && (
                          <>
                            <span>•</span>
                            <CheckCircle className="w-3 h-3" />
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Área de Input */}
        <div className="px-6 py-5 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
          <form onSubmit={enviarMensagem} className="flex items-end gap-3">
            <textarea
              value={conteudo}
              onChange={(e) => setConteudo(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  enviarMensagem();
                }
              }}
              placeholder="Digite sua mensagem..."
              className="flex-1 px-5 py-3 border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none resize-none max-h-32 text-sm transition-all"
              rows={1}
              disabled={enviando}
            />
            
            <button
              type="submit"
              disabled={enviando || !conteudo.trim()}
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-2xl font-semibold hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 hover:scale-105"
            >
              {enviando ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Enviar
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      <style>{`
        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
        
        .animate-scaleIn {
          animation: scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
        
        .animate-shimmer {
          animation: shimmer 3s infinite;
        }
      `}</style>
    </div>
  );
}