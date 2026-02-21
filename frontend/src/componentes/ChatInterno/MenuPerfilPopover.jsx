// frontend/src/componentes/ChatInterno/MenuPerfilPopover.jsx
import { User, Settings, LogOut } from 'lucide-react';

export default function MenuPerfilPopover({ visivel, posicao, onClose, onOpcaoSelecionada }) {
  if (!visivel) return null;

  return (
    <>
      <div className="fixed inset-0 z-[60]" onClick={onClose}></div>
      <div 
        className="fixed z-[70] bg-white rounded-xl shadow-xl border border-gray-100 w-48 py-2 animate-fadeIn"
        style={{ left: posicao.x + 10, bottom: 20 }} // Ajuste conforme a posição do botão na sidebar
      >
        <button 
            onClick={() => onOpcaoSelecionada('perfil')}
            className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors"
        >
            <User size={18} className="text-gray-500"/>
            Meu Perfil
        </button>
        
        <button 
            onClick={() => onOpcaoSelecionada('configuracoes')}
            className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors"
        >
            <Settings size={18} className="text-gray-500"/>
            Configurações
        </button>
        
        <div className="h-px bg-gray-100 my-1"></div>
        
        <button 
            onClick={() => onOpcaoSelecionada('sair')}
            className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 flex items-center gap-3 transition-colors"
        >
            <LogOut size={18}/>
            Sair
        </button>
      </div>
    </>
  );
}