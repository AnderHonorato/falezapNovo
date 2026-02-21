// frontend/src/paginas/chatInterno/AdminSolicitacoesAjuda.jsx - VISUAL MODERNO ELEGANTE

import { useState, useEffect } from 'react';
import { useAuth } from '../contextos/AuthContext';
import { useChat } from '../contextos/ChatContext';
import { useNavigate } from "react-router-dom";
import { 
  HelpCircle, Clock, CheckCircle, User, MessageSquare, 
  Loader2, AlertCircle, RefreshCw, Sparkles, TrendingUp, Award
} from 'lucide-react';
import api from '../servicos/api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function AdminSolicitacoesAjuda() {
  const { usuario } = useAuth();
  const { abrirChatComMencao } = useChat();
  const navigate = useNavigate();
  const [solicitacoes, setSolicitacoes] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [atendendo, setAtendendo] = useState(null);

  const isAdmin = ['OWNER', 'ADMIN', 'ADMIN_EMPRESA'].includes(usuario?.tipo);

  useEffect(() => {
    if (!isAdmin) {
      navigate('/dashboard');
      return;
    }
    carregarSolicitacoes();
  }, [isAdmin, navigate]);

  const carregarSolicitacoes = async () => {
    setCarregando(true);
    try {
      const response = await api.get('/chat-interno/solicitacoes-ajuda');
      setSolicitacoes(response.data.solicitacoes || []);
    } catch (error) {
      console.error('Erro ao carregar solicitações:', error);
      toast.error('Erro ao carregar solicitações');
    } finally {
      setCarregando(false);
    }
  };

  const atenderSolicitacao = async (id) => {
    setAtendendo(id);
    const solicitacaoAtendida = solicitacoes.find(s => s.id === id);

    try {
      await api.patch(`/chat-interno/solicitacoes-ajuda/${id}/atender`);
      setSolicitacoes(prev => prev.filter(s => s.id !== id));
      toast.success('Solicitação atendida!', { icon: '✅' });

      if (solicitacaoAtendida) {
        abrirChatComMencao(solicitacaoAtendida.solicitante);
      }
    } catch (error) {
      console.error('Erro ao atender solicitação:', error);
      toast.error('Erro ao atender solicitação');
    } finally {
      setAtendendo(null);
    }
  };

  const getTipoInfo = (tipo) => {
    const tipos = {
      tecnico: { 
        label: 'Problema Técnico', 
        cor: 'red',
        bgGradient: 'from-red-500 to-rose-600',
        bg: 'bg-red-50 dark:bg-red-900/20',
        text: 'text-red-700 dark:text-red-300',
        border: 'border-red-200 dark:border-red-800'
      },
      duvida: { 
        label: 'Dúvida', 
        cor: 'blue',
        bgGradient: 'from-blue-500 to-indigo-600',
        bg: 'bg-blue-50 dark:bg-blue-900/20',
        text: 'text-blue-700 dark:text-blue-300',
        border: 'border-blue-200 dark:border-blue-800'
      },
      problema: { 
        label: 'Problema Geral', 
        cor: 'yellow',
        bgGradient: 'from-yellow-500 to-orange-600',
        bg: 'bg-yellow-50 dark:bg-yellow-900/20',
        text: 'text-yellow-700 dark:text-yellow-300',
        border: 'border-yellow-200 dark:border-yellow-800'
      },
      outro: { 
        label: 'Outro', 
        cor: 'purple',
        bgGradient: 'from-purple-500 to-pink-600',
        bg: 'bg-purple-50 dark:bg-purple-900/20',
        text: 'text-purple-700 dark:text-purple-300',
        border: 'border-purple-200 dark:border-purple-800'
      }
    };
    return tipos[tipo] || tipos.outro;
  };

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-6xl mx-auto">
        
        {/* Header Moderno */}
        <div className="mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl p-8 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-5">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-xl relative">
                  <HelpCircle className="w-8 h-8 text-white" />
                  <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-2xl"></div>
                </div>
                
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                    Solicitações de Ajuda
                    {solicitacoes.length > 0 && (
                      <span className="px-3 py-1 bg-gradient-to-r from-red-500 to-rose-600 text-white text-base rounded-full shadow-lg animate-pulse">
                        {solicitacoes.length}
                      </span>
                    )}
                  </h1>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    {solicitacoes.length === 0 ? 'Todas atendidas!' : `${solicitacoes.length} pendente${solicitacoes.length > 1 ? 's' : ''}`}
                  </p>
                </div>
              </div>

              <button
                onClick={carregarSolicitacoes}
                disabled={carregando}
                className="p-4 bg-gray-100 dark:bg-gray-700 rounded-2xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-all border border-gray-200 dark:border-gray-600 disabled:opacity-50 hover:scale-105"
              >
                <RefreshCw className={`w-6 h-6 text-gray-700 dark:text-gray-300 ${carregando ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Conteúdo */}
        {carregando ? (
          <div className="flex flex-col items-center justify-center py-32">
            <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
            <p className="text-gray-600 dark:text-gray-400">Carregando solicitações...</p>
          </div>
        ) : solicitacoes.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-16 text-center shadow-xl border border-gray-200 dark:border-gray-700">
            <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/20 dark:to-emerald-900/20 rounded-full flex items-center justify-center">
              <CheckCircle className="w-12 h-12 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
              Nenhuma solicitação pendente
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Todas as solicitações foram atendidas! 🎉
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {solicitacoes.map(solicitacao => {
              const tipoInfo = getTipoInfo(solicitacao.tipo);
              
              return (
                <div
                  key={solicitacao.id}
                  className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-lg hover:shadow-2xl transition-all border border-gray-200 dark:border-gray-700 group hover:scale-[1.02]"
                >
                  <div className="flex items-start gap-5">
                    
                    {/* Avatar */}
                    <div className="flex-shrink-0 relative">
                      {solicitacao.solicitante.foto_perfil ? (
                        <img
                          src={solicitacao.solicitante.foto_perfil}
                          alt={solicitacao.solicitante.nome}
                          className="w-16 h-16 rounded-2xl object-cover ring-4 ring-gray-100 dark:ring-gray-700"
                        />
                      ) : (
                        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                          {solicitacao.solicitante.nome.charAt(0).toUpperCase()}
                        </div>
                      )}
                      
                      {/* Indicador de urgência */}
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full border-2 border-white dark:border-gray-800 animate-pulse"></div>
                    </div>

                    {/* Conteúdo */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-3 flex-wrap">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                          {solicitacao.solicitante.nome}
                        </h3>
                        
                        <span className={`px-4 py-1.5 rounded-full text-xs font-bold shadow-lg ${tipoInfo.bg} ${tipoInfo.text} ${tipoInfo.border} border`}>
                          {tipoInfo.label}
                        </span>
                        
                        <div className="ml-auto">
                          <span className="px-3 py-1 bg-gradient-to-r from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30 text-amber-700 dark:text-amber-300 rounded-full text-xs font-bold flex items-center gap-1.5">
                            <Clock className="w-3 h-3" />
                            Urgente
                          </span>
                        </div>
                      </div>

                      <p className="text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">
                        {solicitacao.descricao}
                      </p>

                      <div className="flex items-center gap-5 text-xs text-gray-500 dark:text-gray-400">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          {format(new Date(solicitacao.criadaEm), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4" />
                          {solicitacao.solicitante.email || solicitacao.solicitante.nickname}
                        </div>
                      </div>
                    </div>

                    {/* Botão de Ação */}
                    <div className="flex-shrink-0">
                      <button
                        onClick={() => atenderSolicitacao(solicitacao.id)}
                        disabled={atendendo === solicitacao.id}
                        className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-2xl font-semibold hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2.5 hover:scale-105"
                      >
                        {atendendo === solicitacao.id ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Atendendo...
                          </>
                        ) : (
                          <>
                            <MessageSquare className="w-5 h-5" />
                            Atender
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}