// frontend/src/componentes/chatInterno/ModalConfirmacaoEncerrar.jsx

import { X, AlertTriangle, XCircle } from 'lucide-react';

export default function ModalConfirmacaoEncerrar({ onConfirmar, onCancelar, mostrar }) {
  if (!mostrar) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[70] p-4 animate-fadeIn">
      <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl max-w-md w-full animate-scaleIn overflow-hidden">
        
        {/* Header */}
        <div className="bg-gradient-to-br from-red-500 via-red-600 to-rose-600 text-white px-8 py-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer"></div>
          
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-xl rounded-2xl flex items-center justify-center">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold">Encerrar Atendimento?</h3>
            </div>
            
            <button
              onClick={onCancelar}
              className="w-9 h-9 hover:bg-white/20 rounded-full transition-all duration-200 flex items-center justify-center hover:rotate-90"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Conteúdo */}
        <div className="p-8">
          <div className="text-center mb-6">
            <div className="w-20 h-20 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircle className="w-10 h-10 text-red-600 dark:text-red-400" />
            </div>
            
            <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
              Tem certeza que deseja encerrar?
            </h4>
            
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
              Ao encerrar este atendimento, o chamado será marcado como finalizado e o cliente será notificado. 
              Esta ação não pode ser desfeita.
            </p>
          </div>

          {/* Botões */}
          <div className="flex gap-3">
            <button
              onClick={onCancelar}
              className="flex-1 px-5 py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:bg-gray-200 dark:hover:bg-gray-700 transition-all text-sm"
            >
              Cancelar
            </button>
            
            <button
              onClick={onConfirmar}
              className="flex-1 px-5 py-3 bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-xl font-semibold hover:shadow-xl hover:scale-105 transition-all flex items-center justify-center gap-2 text-sm"
            >
              <XCircle className="w-5 h-5" />
              Sim, Encerrar
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