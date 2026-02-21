// frontend/src/componentes/ChatInterno/VisualizarPerfil.jsx

import { X, User, Mail, Briefcase, Phone, MapPin, Shield, Crown, Headphones, Building2, Quote, MessageSquare } from 'lucide-react';
import StatusIndicador from '../StatusIndicador'; 

export default function VisualizarPerfil({ membro, onClose, onMessage, isMe }) {
  if (!membro) return null;

  // Lógica idêntica ao Dashboard para Cores e Cargos
  const getCorCargo = (tipo) => {
    switch(tipo) {
      case 'OWNER': return { bg: '#fee2e2', text: '#ef4444', border: '#fecaca' }; // Red
      case 'CEO': return { bg: '#fee2e2', text: '#ef4444', border: '#fecaca' };
      case 'ADMIN_EMPRESA': return { bg: '#fef3c7', text: '#f59e0b', border: '#fde68a' }; // Amber
      case 'ADMIN': return { bg: '#dbeafe', text: '#3b82f6', border: '#bfdbfe' }; // Blue
      case 'SUPORTE': return { bg: '#f3e8ff', text: '#a855f7', border: '#e9d5ff' }; // Purple
      default: return { bg: '#d1fae5', text: '#10b981', border: '#a7f3d0' }; // Emerald
    }
  };

  const getCargoFormatado = (tipo) => {
    switch (tipo) {
      case 'OWNER': return 'Fundador / Dono';
      case 'CEO': return 'CEO';
      case 'ADMIN_EMPRESA': return 'Administrador';
      case 'ADMIN': return 'Gerente / Encarregado';
      case 'COLABORADOR': return 'Colaborador';
      case 'SUPORTE': return 'Suporte Técnico';
      default: return 'Usuário';
    }
  };

  const getIconeCargo = (tipo) => {
    switch(tipo) {
        case 'OWNER': return <Crown size={14} />;
        case 'CEO': return <Briefcase size={14} />;
        case 'ADMIN_EMPRESA': return <Building2 size={14} />;
        case 'ADMIN': return <Shield size={14} />;
        case 'SUPORTE': return <Headphones size={14} />;
        default: return <User size={14} />;
    }
  };

  const formatarTelefone = (n) => { 
    if(!n) return 'N/A'; 
    const l=n.replace(/\D/g,''); 
    if(l.startsWith('55')&&l.length>=12) return `+${l.slice(0,2)} (${l.slice(2,4)}) ${l.slice(4,9)}-${l.slice(9)}`; 
    return l; 
  };

  const cargoStyle = getCorCargo(membro.tipo);

  return (
    <div className="embedded-panel bg-white h-full flex flex-col">
      {/* Header */}
      <div className="embedded-panel-header bg-white border-b border-gray-100 px-4 py-3 flex justify-between items-center shadow-sm z-10">
        <h3 className="font-bold text-gray-800 flex items-center gap-2">
            <User size={18} className="text-indigo-600"/> 
            {isMe ? 'Meu Perfil' : 'Perfil do Usuário'}
        </h3>
        <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-full text-gray-500 transition-colors">
          <X size={20} />
        </button>
      </div>

      {/* Conteúdo Scrollável */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
        
        {/* Avatar e Nome */}
        <div className="flex flex-col items-center text-center mb-6">
            <div className="relative mb-3">
                <div className="w-24 h-24 rounded-full p-1 border-2 border-gray-100 bg-white shadow-sm">
                    {membro.foto_perfil ? (
                        <img src={membro.foto_perfil} alt={membro.nome} className="w-full h-full object-cover rounded-full" />
                    ) : (
                        <div className="w-full h-full bg-gray-100 rounded-full flex items-center justify-center text-gray-400">
                            <User size={40} />
                        </div>
                    )}
                </div>
                <div className="absolute bottom-1 right-1 border-2 border-white rounded-full">
                    <StatusIndicador status={membro.status || 'offline'} tamanho="md" />
                </div>
            </div>
            
            <h2 className="text-xl font-bold text-gray-900">{membro.nome}</h2>
            <p className="text-sm text-gray-500 mb-3">{membro.email}</p>

            <span 
                className="px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 shadow-sm" 
                style={{ backgroundColor: cargoStyle.bg, color: cargoStyle.text, borderColor: cargoStyle.border }}
            >
                {getIconeCargo(membro.tipo)}
                {getCargoFormatado(membro.tipo)}
            </span>
        </div>

        <hr className="border-gray-100 mb-6" />

        {/* Recado (Igual Dashboard) */}
        {membro.recado && (
            <div className="mb-6">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">Recado</label>
                <div 
                    className="p-4 rounded-xl border-l-4 bg-gray-50 border-gray-200 italic text-gray-600 text-sm leading-relaxed"
                    style={{ borderLeftColor: cargoStyle.text }}
                >
                    <div className="flex items-start gap-2">
                        <Quote className="w-4 h-4 opacity-40 mt-0.5 flex-shrink-0" />
                        <p>"{membro.recado}"</p>
                    </div>
                </div>
            </div>
        )}

        {/* Informações Detalhadas */}
        <div className="space-y-5">
            <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">Telefone / WhatsApp</label>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center text-green-600">
                        <Phone size={16} />
                    </div>
                    <span className="text-sm font-medium text-gray-700">{formatarTelefone(membro.telefone)}</span>
                </div>
            </div>

            <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">Email Corporativo</label>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600">
                        <Mail size={16} />
                    </div>
                    <span className="text-sm font-medium text-gray-700 truncate">{membro.email}</span>
                </div>
            </div>

            <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">Setor / Departamento</label>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center text-orange-600">
                        <MapPin size={16} />
                    </div>
                    <span className="text-sm font-medium text-gray-700">{membro.setor || 'Geral'}</span>
                </div>
            </div>
        </div>
      </div>

      {/* Botão de Ação (Apenas se não for eu mesmo) */}
      {!isMe && (
          <div className="p-4 bg-white border-t border-gray-100">
            <button 
              onClick={() => onMessage(membro)}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-md shadow-indigo-200 transition-all flex items-center justify-center gap-2"
            >
              <MessageSquare size={18} />
              Enviar Mensagem
            </button>
          </div>
      )}
    </div>
  );
}