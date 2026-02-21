// frontend/src/componentes/ChatInterno/NotificacaoAlerta.jsx - VISUAL IGUAL SUPORTE

import { useState } from 'react';
import { X, CheckCircle, XCircle, Sparkles, Megaphone } from 'lucide-react';
import api from '../../servicos/api';
import toast from 'react-hot-toast';

const API_URL_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default function NotificacaoAlerta({ alerta, onClose, onResponder }) {
  const [resposta, setResposta] = useState(null);
  const [comentario, setComentario] = useState('');
  const [enviando, setEnviando] = useState(false);

  const enviarResposta = async () => {
    if (!resposta) {
      toast.error('Por favor, selecione uma resposta');
      return;
    }

    setEnviando(true);
    
    try {
      await api.post(`/chat-interno/alertas/${alerta.id}/responder`, {
        resposta,
        mensagem: comentario.trim() || null
      });

      toast.success('Resposta enviada com sucesso!', {
        icon: '✅',
        duration: 4000
      });
      
      if (onResponder) onResponder();
      onClose();
    } catch (error) {
      console.error('Erro ao responder alerta:', error);
      toast.error('Erro ao enviar resposta');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[70] p-4 animate-fadeIn">
      <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl max-w-lg w-full animate-scaleIn overflow-hidden">
        
        {/* Header */}
        <div className="bg-gradient-to-br from-orange-500 via-orange-600 to-red-600 text-white px-8 py-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer"></div>
          
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-xl rounded-2xl flex items-center justify-center">
                <Megaphone className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold">Alerta da Equipe</h3>
            </div>
            
            <button
              onClick={onClose}
              className="w-9 h-9 hover:bg-white/20 rounded-full transition-all duration-200 flex items-center justify-center hover:rotate-90"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Conteúdo */}
        <div className="p-8">
          {/* Remetente */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-3 px-4 py-2 bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-full border border-orange-200 dark:border-orange-800">
              {alerta.remetente.foto_perfil ? (
                <img
                  src={`${API_URL_BASE}/uploads/avatars/${alerta.remetente.foto_perfil}`}
                  alt={alerta.remetente.nome}
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center text-white text-sm font-bold">
                  {alerta.remetente.nome.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="text-left">
                <p className="text-xs text-gray-600 dark:text-gray-400">Enviado por:</p>
                <p className="text-sm font-bold text-gray-900 dark:text-white">{alerta.remetente.nome}</p>
              </div>
            </div>
          </div>

          {/* Título */}
          <div className="mb-6">
            <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-3 text-center">
              {alerta.titulo}
            </h4>
            
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                {alerta.mensagem}
              </p>
            </div>
          </div>

          {/* Opções de Resposta */}
          <div className="mb-6">
            <label className="block text-sm font-bold text-gray-900 dark:text-white mb-3">
              Como você responde a este alerta?
            </label>
            
            <div className="flex gap-3">
              <button
                onClick={() => setResposta('entendido')}
                className={`flex-1 px-5 py-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
                  resposta === 'entendido'
                    ? 'bg-green-500 text-white shadow-lg scale-105'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                <CheckCircle className="w-5 h-5" />
                Entendido
              </button>
              
              <button
                onClick={() => setResposta('nao_concordo')}
                className={`flex-1 px-5 py-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
                  resposta === 'nao_concordo'
                    ? 'bg-red-500 text-white shadow-lg scale-105'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                <XCircle className="w-5 h-5" />
                Não concordo
              </button>
            </div>
          </div>

          {/* Comentário Opcional */}
          <div className="mb-6">
            <label className="block text-sm font-bold text-gray-900 dark:text-white mb-3">
              Deixe um comentário (opcional)
            </label>
            
            <textarea
              value={comentario}
              onChange={(e) => setComentario(e.target.value)}
              placeholder="Adicione suas observações..."
              className="w-full px-5 py-4 border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-2xl focus:ring-4 focus:ring-orange-500/20 focus:border-orange-500 outline-none resize-none transition-all text-sm"
              rows={3}
              maxLength={500}
            />
            
            <p className="text-xs text-gray-500 dark:text-gray-400 text-right mt-2">
              {comentario.length}/500 caracteres
            </p>
          </div>

          {/* Botões de Ação */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-5 py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:bg-gray-200 dark:hover:bg-gray-700 transition-all text-sm"
            >
              Agora não
            </button>
            
            <button
              onClick={enviarResposta}
              disabled={enviando || !resposta}
              className="flex-1 px-5 py-3 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-xl font-semibold hover:shadow-xl hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2 text-sm"
            >
              {enviando ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Enviando...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Enviar Resposta
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