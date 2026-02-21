// frontend/src/componentes/ChatInterno/VisualizarPerfilGrupo.jsx

import { useState } from 'react';
import { X, Users, LogOut, Trash2, Edit2, Shield, Calendar, Info, Quote } from 'lucide-react';
import { useAuth } from '../../contextos/AuthContext';
import api from '../../servicos/api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default function VisualizarPerfilGrupo({ grupo, onClose, onEditar, onSairOuExcluir, isParticipante }) {
  const { usuario } = useAuth();
  const [processando, setProcessando] = useState(false);

  const isAdmin = grupo.criadorId === usuario.id;

  // Formatação de data
  const dataCriacao = grupo.criadoEm ? format(new Date(grupo.criadoEm), 'dd/MM/yyyy') : 'N/A';

  const handleSairGrupo = async () => {
    if (!window.confirm('Tem certeza que deseja sair deste grupo?')) return;
    setProcessando(true);
    try {
      await api.post(`/chat-interno/grupos/${grupo.id}/sair`);
      toast.success('Você saiu do grupo.');
      if (onSairOuExcluir) onSairOuExcluir('saiu');
      onClose();
    } catch (error) {
      console.error(error);
      toast.error('Erro ao sair do grupo.');
    } finally {
      setProcessando(false);
    }
  };

  const handleExcluirGrupoLocal = () => {
     if (onSairOuExcluir) onSairOuExcluir('excluir_local');
  };

  return (
    <div className="embedded-panel bg-white h-full flex flex-col">
      {/* Header - Igual Perfil Usuário */}
      <div className="embedded-panel-header bg-white border-b border-gray-100 px-4 py-3 flex justify-between items-center shadow-sm z-10">
        <h3 className="font-bold text-gray-800 flex items-center gap-2 text-sm">
            <Users size={18} className="text-indigo-600"/> 
            Dados do Grupo
        </h3>
        <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-full text-gray-500 transition-colors">
          <X size={20} />
        </button>
      </div>

      {/* Conteúdo Scrollável */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
        
        {/* Avatar e Nome - Igual Perfil Usuário */}
        <div className="flex flex-col items-center text-center mb-6">
            <div className="relative mb-3">
                <div className="w-24 h-24 rounded-full p-1 border-2 border-gray-100 bg-white shadow-sm overflow-hidden">
                    {grupo.imagem ? (
                        <img src={`${API_URL}/uploads/grupos/${grupo.imagem}`} className="w-full h-full object-cover rounded-full" onError={(e) => e.target.style.display='none'}/>
                    ) : (
                        <div className="w-full h-full bg-gray-100 rounded-full flex items-center justify-center text-gray-400">
                            <Users size={40} />
                        </div>
                    )}
                </div>
            </div>
            
            <h2 className="text-xl font-bold text-gray-900">{grupo.nome}</h2>
            <p className="text-sm text-gray-500 mb-3">
                {grupo.membros ? `${grupo.membros.length} participantes` : 'Grupo da Equipe'}
            </p>

            {isAdmin && (
                <span className="px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 shadow-sm bg-green-50 text-green-600 border-green-200">
                    <Shield size={12} /> Você é Admin
                </span>
            )}
        </div>

        <hr className="border-gray-100 mb-6" />

        {/* Descrição (Estilo Recado do Perfil) */}
        {grupo.descricao && (
            <div className="mb-6">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">Descrição</label>
                <div className="p-4 rounded-xl border-l-4 bg-gray-50 border-gray-200 border-l-indigo-500 italic text-gray-600 text-sm leading-relaxed">
                    <div className="flex items-start gap-2">
                        <Quote className="w-4 h-4 opacity-40 mt-0.5 flex-shrink-0" />
                        <p>"{grupo.descricao}"</p>
                    </div>
                </div>
            </div>
        )}

        {/* Informações Detalhadas (Cards Iguais Perfil) */}
        <div className="space-y-5 mb-6">
            <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">Criado em</label>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
                        <Calendar size={16} />
                    </div>
                    <span className="text-sm font-medium text-gray-700">{dataCriacao}</span>
                </div>
            </div>
        </div>

        {/* Lista de Participantes */}
        <div>
            <div className="flex justify-between items-center mb-3">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Participantes</label>
                <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">{grupo.membros?.length || 0}</span>
            </div>
            
            <div className="space-y-2">
                {grupo.membros && grupo.membros.map((membro) => {
                    const dadosUsuario = membro.usuario || membro;
                    const isGroupAdmin = membro.isAdmin || dadosUsuario.id === grupo.criadorId;
                    
                    return (
                        <div key={dadosUsuario.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-xl transition-colors border border-transparent hover:border-gray-100">
                            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-sm overflow-hidden flex-shrink-0">
                                {dadosUsuario.foto_perfil ? <img src={`${API_URL}/uploads/avatars/${dadosUsuario.foto_perfil}`} className="w-full h-full object-cover"/> : dadosUsuario.nome[0]}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h5 className="text-sm font-bold text-gray-800 truncate">
                                    {dadosUsuario.id === usuario.id ? 'Você' : dadosUsuario.nome}
                                </h5>
                                <p className="text-xs text-gray-500 truncate">{dadosUsuario.email}</p>
                            </div>
                            {isGroupAdmin && (
                                <span className="text-[10px] bg-green-100 text-green-700 px-2 py-1 rounded-full font-bold">Admin</span>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
      </div>

      {/* Ações do Rodapé */}
      <div className="p-4 bg-white border-t border-gray-100 space-y-2">
         {isParticipante ? (
             <>
                {isAdmin && (
                    <button 
                        onClick={onEditar}
                        className="w-full py-3 bg-white border-2 border-indigo-50 text-indigo-600 rounded-xl font-bold text-sm hover:bg-indigo-50 hover:border-indigo-100 transition-colors flex items-center justify-center gap-2"
                    >
                        <Edit2 size={16}/> Editar Grupo
                    </button>
                )}
                
                <button 
                    onClick={handleSairGrupo}
                    disabled={processando}
                    className="w-full py-3 bg-red-50 text-red-600 rounded-xl font-bold text-sm hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
                >
                    <LogOut size={16}/> Sair do Grupo
                </button>
             </>
         ) : (
             <button 
                onClick={handleExcluirGrupoLocal}
                className="w-full py-3 bg-red-600 text-white rounded-xl font-bold text-sm hover:bg-red-700 transition-colors flex items-center justify-center gap-2 shadow-md shadow-red-200"
             >
                <Trash2 size={16}/> Apagar Conversa
             </button>
         )}
      </div>
    </div>
  );
}