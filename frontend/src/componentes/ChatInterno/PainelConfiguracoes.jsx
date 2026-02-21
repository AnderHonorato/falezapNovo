// frontend/src/componentes/ChatInterno/PainelConfiguracoes.jsx

import { useState } from 'react';
import { X, Image, Bell, Moon, Monitor, ArrowLeft } from 'lucide-react';
import EditorPapelParede from './EditorPapelParede';
import { useAuth } from '../../contextos/AuthContext';

export default function PainelConfiguracoes({ onClose, conversaAtual, currentWallpaper, onUpdateWallpaper }) {
  const { usuario } = useAuth();
  const [secao, setSecao] = useState('menu'); // menu, wallpaper

  return (
    <div className="flex flex-col h-full bg-white relative">
      {/* ✅ HEADER PADRONIZADO (60px altura) */}
      <div className="flex items-center justify-between px-4 border-b border-gray-100 shrink-0 h-[60px]">
        <div className="flex items-center gap-3">
            {secao !== 'menu' && (
                <button 
                    onClick={() => setSecao('menu')} 
                    className="p-1 hover:bg-gray-100 rounded-full text-gray-600 transition-colors"
                    title="Voltar"
                >
                    <ArrowLeft size={20} />
                </button>
            )}
            <h3 className="font-bold text-gray-800 text-sm">
            {secao === 'wallpaper' ? 'Papel de Parede' : 'Configurações'}
            </h3>
        </div>
        
        <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-full text-gray-500 transition-colors">
          <X size={20} />
        </button>
      </div>

      {/* Conteúdo */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        
        {secao === 'menu' && (
          <div className="p-4 space-y-6 animate-fadeIn">
            
            <div className="space-y-3">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Aparência</label>
              
              <button 
                onClick={() => setSecao('wallpaper')}
                className="w-full flex items-center gap-3 p-3 bg-gray-50 hover:bg-indigo-50 border border-gray-200 hover:border-indigo-200 rounded-xl transition-all group"
              >
                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm text-indigo-600 group-hover:scale-110 transition-transform">
                  <Image size={20} />
                </div>
                <div className="text-left flex-1">
                  <span className="block text-sm font-semibold text-gray-800">Papel de Parede</span>
                  <span className="text-xs text-gray-500">Personalize o fundo do chat</span>
                </div>
              </button>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Preferências</label>
              
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl flex items-center justify-between opacity-60 cursor-not-allowed" title="Em breve">
                <div className="flex items-center gap-3">
                   <Bell size={20} className="text-gray-500"/>
                   <span className="text-sm font-medium text-gray-700">Sons de Notificação</span>
                </div>
                <div className="w-10 h-5 bg-indigo-500 rounded-full relative"><div className="absolute right-1 top-1 w-3 h-3 bg-white rounded-full"></div></div>
              </div>

               <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl flex items-center justify-between opacity-60 cursor-not-allowed" title="Em breve">
                <div className="flex items-center gap-3">
                   <Moon size={20} className="text-gray-500"/>
                   <span className="text-sm font-medium text-gray-700">Modo Escuro</span>
                </div>
                <div className="w-10 h-5 bg-gray-300 rounded-full relative"><div className="absolute left-1 top-1 w-3 h-3 bg-white rounded-full"></div></div>
              </div>
            </div>

            <div className="mt-8 p-4 bg-blue-50 rounded-xl border border-blue-100">
               <div className="flex items-center gap-2 text-blue-800 mb-2">
                  <Monitor size={16} />
                  <span className="text-xs font-bold">Informações da Sessão</span>
               </div>
               <p className="text-xs text-blue-600">
                  Conectado como <strong>{usuario.nome}</strong><br/>
                  Perfil: {usuario.tipo}
               </p>
            </div>

          </div>
        )}

        {secao === 'wallpaper' && (
           <EditorPapelParede 
              conversaAtual={conversaAtual} 
              onSalvar={(wp) => {
                  onUpdateWallpaper(wp);
                  // Opcional: voltar ao menu ou ficar na tela
              }}
              onFechar={() => setSecao('menu')}
              currentWallpaper={currentWallpaper}
              headless={true} 
           />
        )}

      </div>
    </div>
  );
}