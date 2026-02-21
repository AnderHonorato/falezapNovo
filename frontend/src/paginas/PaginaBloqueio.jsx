import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ShieldAlert, Lock, LayoutDashboard, AlertTriangle } from 'lucide-react';

export default function PaginaBloqueio() {
  const location = useLocation();
  const navigate = useNavigate();
  
  const { 
    pagina = 'Área Restrita', 
    motivo = 'Você não possui as permissões necessárias para visualizar este conteúdo.' 
  } = location.state || {};

  return (
    // Container principal ocupando a altura disponível do MainLayout (h-full)
    <div className="h-full w-full bg-[#f3f4f6] dark:bg-[#0f172a] flex items-center justify-center p-6 font-sans transition-colors duration-300 overflow-hidden">
      
      {/* Card Retangular Largo (Horizontal) */}
      <div className="w-full max-w-3xl bg-white dark:bg-[#1e293b] rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 flex flex-col md:flex-row overflow-hidden animate-fade-in">
        
        {/* Lado Esquerdo: Ícone e Status */}
        <div className="w-full md:w-[240px] bg-gray-50 dark:bg-[#252f3e] flex flex-col items-center justify-center p-8 border-b md:border-b-0 md:border-r border-gray-100 dark:border-gray-700">
            <div className="relative mb-4">
                <div className="w-20 h-20 bg-white dark:bg-[#1e293b] rounded-2xl flex items-center justify-center border border-gray-200 dark:border-gray-600 shadow-sm">
                   <ShieldAlert className="w-9 h-9 text-red-500" strokeWidth={1.5} />
                </div>
                <div className="absolute -bottom-2 -right-2 bg-gray-100 dark:bg-gray-700 p-1.5 rounded-xl border-2 border-white dark:border-[#252f3e]">
                   <Lock className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />
                </div>
            </div>
            <span className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                Acesso Negado
            </span>
        </div>

        {/* Lado Direito: Conteúdo e Ação */}
        <div className="flex-1 p-8 md:p-10 flex flex-col justify-center">
            
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
                    Acesso não autorizado
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Você tentou acessar: <strong className="text-gray-800 dark:text-gray-200 font-semibold">{pagina}</strong>
                </p>
            </div>

            {/* Caixa de Motivo */}
            <div className="bg-red-50 dark:bg-red-900/10 border-l-4 border-red-500 p-4 rounded-r-lg mb-8">
                <div className="flex gap-3">
                    <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed font-medium">
                      {motivo}
                    </p>
                </div>
            </div>

            <div className="flex items-center justify-between mt-auto pt-2">
                <p className="text-[10px] text-gray-300 dark:text-gray-600 font-mono select-none hidden sm:block">
                  Código do erro: 403 — Permissão insuficiente
                </p>

                {/* Botão com Hover Azul */}
                <button 
                  onClick={() => navigate('/dashboard')} 
                  className="group flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-white dark:bg-transparent hover:bg-blue-600 hover:border-blue-600 hover:text-white dark:hover:bg-blue-600 dark:hover:border-blue-600 dark:hover:text-white transition-all duration-200 shadow-sm text-sm font-bold w-full sm:w-auto"
                >
                  <LayoutDashboard className="w-4 h-4 text-gray-500 group-hover:text-white transition-colors" />
                  Voltar ao Início
                </button>
            </div>

        </div>

      </div>

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: scale(0.98); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fade-in { animation: fade-in 0.3s ease-out; }
      `}</style>
    </div>
  );
}