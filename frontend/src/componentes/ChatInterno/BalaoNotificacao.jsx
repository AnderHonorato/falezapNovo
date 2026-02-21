// frontend/src/componentes/ChatInterno/BalaoNotificacao.jsx - VISUAL MODERNO ELEGANTE

import { X, MessageCircle, Sparkles } from 'lucide-react';
import { useAuth } from '../../contextos/AuthContext';

const API_URL_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default function BalaoNotificacao({ 
  mensagem, 
  onClose, 
  onClick,
  style = {} 
}) {
  const { usuario } = useAuth();

  const isMensagemSuporte = mensagem.tipo === 'suporte' || mensagem.solicitacaoId;
  const remetente = mensagem.remetente || mensagem.usuario || {};
  const ehMinhaMensagem = remetente.id === usuario?.id;

  if (ehMinhaMensagem) return null;

  return (
    <div
      onClick={onClick}
      style={style}
      className="fixed z-[60] cursor-pointer group animate-slideInBounce"
    >
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl hover:shadow-[0_25px_60px_rgba(0,0,0,0.2)] dark:hover:shadow-[0_25px_60px_rgba(0,0,0,0.5)] p-5 max-w-sm transition-all duration-300 hover:scale-105 border border-gray-100 dark:border-gray-700 backdrop-blur-xl relative overflow-hidden">
        
        {/* Gradiente de fundo sutil */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-transparent to-indigo-50 dark:from-blue-900/10 dark:via-transparent dark:to-indigo-900/10 opacity-50"></div>
        
        <div className="relative flex items-start gap-4">
          {/* Avatar com efeito de brilho */}
          <div className="relative flex-shrink-0">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-500 rounded-full blur-lg opacity-40 animate-pulse"></div>
            
            {remetente.foto_perfil ? (
              <img
                src={`${API_URL_BASE}/uploads/avatars/${remetente.foto_perfil}`}
                alt={remetente.nome}
                className="relative w-14 h-14 rounded-full object-cover border-2 border-white dark:border-gray-700 shadow-xl ring-2 ring-blue-100 dark:ring-blue-900"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextElementSibling.style.display = 'flex';
                }}
              />
            ) : null}
            
            <div
              className="relative w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold text-xl shadow-xl"
              style={{ display: remetente.foto_perfil ? 'none' : 'flex' }}
            >
              {isMensagemSuporte ? '🎫' : remetente.nome?.charAt(0)?.toUpperCase() || '?'}
            </div>
            
            {/* Indicador de status online */}
            <div className="absolute bottom-0 right-0">
              <div className="w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-gray-800 shadow-lg"></div>
              <div className="absolute inset-0 bg-green-500 rounded-full animate-ping opacity-75"></div>
            </div>
          </div>

          {/* Conteúdo */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-bold text-gray-900 dark:text-white text-sm truncate flex items-center gap-2">
                {isMensagemSuporte ? (
                  <>
                    <span className="text-lg">🎫</span>
                    <span className="bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                      Suporte
                    </span>
                  </>
                ) : (
                  remetente.nome
                )}
              </h4>
              
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onClose();
                }}
                className="w-7 h-7 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100 hover:scale-110"
              >
                <X className="w-4 h-4 text-red-500" />
              </button>
            </div>
            
            <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2 leading-relaxed mb-3">
              {mensagem.conteudo?.substring(0, 80)}
              {mensagem.conteudo?.length > 80 ? '...' : ''}
            </p>
            
            {isMensagemSuporte && mensagem.protocolo && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full shadow-lg">
                <Sparkles className="w-3 h-3 text-white" />
                <span className="text-xs text-white font-bold">
                  {mensagem.protocolo}
                </span>
              </div>
            )}

            {/* Indicador de nova mensagem */}
            <div className="mt-3 flex items-center gap-2">
              <div className="flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 font-semibold">
                <MessageCircle className="w-3.5 h-3.5" />
                <span>Nova mensagem</span>
              </div>
              <div className="flex-1 h-px bg-gradient-to-r from-blue-200 via-blue-300 to-transparent dark:from-blue-700 dark:via-blue-600 dark:to-transparent"></div>
            </div>
          </div>
        </div>

        {/* Barra de destaque animada */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 rounded-t-2xl">
          <div className="h-full bg-gradient-to-r from-transparent via-white to-transparent opacity-30 animate-shimmer"></div>
        </div>
      </div>

      <style>{`
        @keyframes slideInBounce {
          0% {
            opacity: 0;
            transform: translateX(100px) scale(0.85) rotate(3deg);
          }
          60% {
            opacity: 1;
            transform: translateX(-15px) scale(1.05) rotate(-1deg);
          }
          100% {
            opacity: 1;
            transform: translateX(0) scale(1) rotate(0deg);
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
        
        .animate-slideInBounce {
          animation: slideInBounce 0.6s cubic-bezier(0.16, 1, 0.3, 1);
        }
        
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
      `}</style>
    </div>
  );
}