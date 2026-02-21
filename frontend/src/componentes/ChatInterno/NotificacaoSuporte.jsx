// frontend/src/componentes/ChatInterno/NotificacaoSuporte.jsx - CORRIGIDO PARA ENVIAR MENSAGEM

import { useState } from 'react';
import { X, Star, Send, Sparkles } from 'lucide-react';
import api from '../../servicos/api';
import toast from 'react-hot-toast';

export default function NotificacaoSuporte({ solicitacao, onClose, onAvaliar }) {
  const [avaliacao, setAvaliacao] = useState(0);
  const [comentario, setComentario] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [hover, setHover] = useState(0);

  const enviarAvaliacao = async () => {
    if (avaliacao === 0) {
      toast.error('Por favor, selecione uma avaliação');
      return;
    }

    setEnviando(true);
    
    try {
      // 1. Enviar avaliação para o backend
      await api.post(`/suporte/solicitacoes/${solicitacao.id}/avaliar`, {
        avaliacao,
        comentario: comentario.trim() || null
      });

      // ✅ 2. CRIAR MENSAGEM DE AVALIAÇÃO NO CHAT
      await api.post(`/chat-suporte/mensagens/${solicitacao.id}`, {
        conteudo: `⭐ Avaliação: ${avaliacao}/5${comentario.trim() ? `\n\n"${comentario.trim()}"` : ''}`,
        tipo: 'avaliacao',
        dados: {
          avaliacao,
          comentario: comentario.trim() || null
        }
      });

      toast.success('Obrigado pela sua avaliação!', {
        icon: '⭐',
        duration: 4000
      });
      
      if (onAvaliar) onAvaliar();
      onClose();
    } catch (error) {
      console.error('Erro ao avaliar:', error);
      toast.error('Erro ao enviar avaliação');
    } finally {
      setEnviando(false);
    }
  };

  const mensagensAvaliacao = {
    5: { emoji: '🌟', texto: 'Excelente!', cor: 'from-green-500 to-emerald-600' },
    4: { emoji: '😊', texto: 'Muito bom!', cor: 'from-blue-500 to-cyan-600' },
    3: { emoji: '😐', texto: 'Bom', cor: 'from-yellow-500 to-amber-600' },
    2: { emoji: '😕', texto: 'Poderia melhorar', cor: 'from-orange-500 to-red-500' },
    1: { emoji: '😞', texto: 'Insatisfeito', cor: 'from-red-500 to-rose-600' }
  };

  const avaliacaoInfo = mensagensAvaliacao[avaliacao];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[70] p-4 animate-fadeIn">
      <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl max-w-lg w-full animate-scaleIn overflow-hidden">
        
        <div className="bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 text-white px-8 py-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer"></div>
          
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-xl rounded-2xl flex items-center justify-center">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold">Como foi seu atendimento?</h3>
            </div>
            
            <button
              onClick={onClose}
              className="w-9 h-9 hover:bg-white/20 rounded-full transition-all duration-200 flex items-center justify-center hover:rotate-90"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-8">
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-full border border-blue-200 dark:border-blue-800">
              <span className="text-sm text-gray-600 dark:text-gray-400">Protocolo:</span>
              <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                {solicitacao.protocolo}
              </span>
            </div>
          </div>

          <div className="flex justify-center gap-3 mb-6">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => setAvaliacao(star)}
                onMouseEnter={() => setHover(star)}
                onMouseLeave={() => setHover(0)}
                className="transition-all duration-200 hover:scale-125 active:scale-110 group"
              >
                <Star
                  className={`w-12 h-12 transition-all ${
                    star <= (hover || avaliacao)
                      ? 'fill-yellow-400 text-yellow-400 drop-shadow-lg'
                      : 'text-gray-300 dark:text-gray-600 group-hover:text-gray-400 dark:group-hover:text-gray-500'
                  }`}
                />
              </button>
            ))}
          </div>

          {avaliacao > 0 && avaliacaoInfo && (
            <div className={`text-center mb-6 p-4 bg-gradient-to-r ${avaliacaoInfo.cor} rounded-2xl animate-scaleIn`}>
              <div className="flex items-center justify-center gap-2 text-white">
                <span className="text-3xl">{avaliacaoInfo.emoji}</span>
                <span className="text-lg font-bold">{avaliacaoInfo.texto}</span>
              </div>
            </div>
          )}

          <div className="mb-6">
            <label className="block text-sm font-bold text-gray-900 dark:text-white mb-3">
              Deixe um comentário (opcional)
            </label>
            
            <textarea
              value={comentario}
              onChange={(e) => setComentario(e.target.value)}
              placeholder="Conte-nos mais sobre sua experiência..."
              className="w-full px-5 py-4 border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none resize-none transition-all text-sm"
              rows={4}
              maxLength={500}
            />
            
            <p className="text-xs text-gray-500 dark:text-gray-400 text-right mt-2">
              {comentario.length}/500 caracteres
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-5 py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:bg-gray-200 dark:hover:bg-gray-700 transition-all text-sm"
            >
              Agora não
            </button>
            
            <button
              onClick={enviarAvaliacao}
              disabled={enviando || avaliacao === 0}
              className="flex-1 px-5 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-semibold hover:shadow-xl hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2 text-sm"
            >
              {enviando ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Enviar Avaliação
                </>
              )}
            </button>
          </div>
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
          animation: scaleIn 0.2s cubic-bezier(0.16, 1, 0.3, 1);
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