// frontend/src/componentes/ChatInterno/ListaMembros.jsx

import { useState, useEffect } from 'react';
import { 
  X, Search, Loader2, User, MessageSquare, 
  Users, Sparkles, ChevronRight, BookUser 
} from 'lucide-react';
import { useAuth } from '../../contextos/AuthContext';
import api from '../../servicos/api';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default function ListaMembros({ onClose, onSelecionarMembro, onVerPerfil, embedded = false }) {
  const { usuario } = useAuth();
  const [membros, setMembros] = useState([]);
  const [busca, setBusca] = useState('');
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    const load = async () => {
       try {
         const res = await api.get('/usuarios/equipe-membros'); 
         const lista = (res.data.membros || []).filter(m => m.id !== usuario?.id && m.status === 'ATIVO');
         setMembros(lista);
       } catch (e) { console.error(e); } finally { setCarregando(false); }
    };
    load();
  }, [usuario?.id]);

  const filtrados = membros.filter(m => m.nome?.toLowerCase().includes(busca.toLowerCase()));

  const Content = () => (
     <div className="flex flex-col h-full bg-gray-50/50">
        {/* HERO BANNER (Apenas no modo embedded para dar destaque) */}
        {embedded && (
            <div className="relative bg-gradient-to-r from-cyan-600 to-blue-600 p-5 rounded-2xl shadow-lg shadow-cyan-500/20 overflow-hidden shrink-0 mx-6 mt-6 mb-2">
               <div className="absolute right-0 top-0 p-4 opacity-10 pointer-events-none">
                  <Users size={80} strokeWidth={1.5} />
               </div>
               <div className="relative z-10">
                   <h3 className="font-bold text-white text-lg flex items-center gap-2">
                     <Sparkles size={18} className="text-yellow-300" /> 
                     Sua Equipe
                   </h3>
                   <p className="text-cyan-50 text-xs mt-1.5 leading-relaxed max-w-[90%]">
                     Encontre seus colegas de trabalho para conversar ou visualizar o perfil.
                   </p>
               </div>
            </div>
        )}

        {/* BUSCA STICKY */}
        <div className="px-6 py-4 bg-gray-50/95 backdrop-blur-sm sticky top-0 z-10">
           <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-cyan-600 transition-colors"/>
              <input 
                 type="text" 
                 value={busca} 
                 onChange={e => setBusca(e.target.value)} 
                 placeholder="Buscar contato..." 
                 className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 outline-none transition-all shadow-sm placeholder:text-gray-400"
              />
           </div>
           
           <div className="flex justify-between items-center mt-3 px-1">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Membros Disponíveis
              </span>
              <span className="text-[10px] font-bold bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">
                  {filtrados.length}
              </span>
           </div>
        </div>

        {/* LISTA DE MEMBROS */}
        <div className="flex-1 overflow-y-auto custom-scrollbar px-6 pb-6">
           {carregando ? (
               <div className="flex justify-center py-10">
                   <Loader2 className="animate-spin text-cyan-600 w-8 h-8"/>
               </div>
           ) : filtrados.length === 0 ? (
               <div className="flex flex-col items-center justify-center py-10 opacity-50">
                   <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mb-3">
                       <User size={32} className="text-gray-400"/>
                   </div>
                   <p className="text-sm text-gray-500 font-medium">Nenhum contato encontrado.</p>
               </div>
           ) : (
               <div className="grid gap-3">
                  {filtrados.map(m => (
                     <div 
                        key={m.id} 
                        className="group bg-white p-3 rounded-2xl border border-gray-100 hover:border-cyan-200 hover:shadow-lg hover:shadow-cyan-500/5 transition-all duration-300 flex items-center gap-3 cursor-pointer relative overflow-hidden"
                        onClick={() => onVerPerfil && onVerPerfil(m)}
                     >
                        {/* Efeito Hover Fundo */}
                        <div className="absolute inset-0 bg-gradient-to-r from-cyan-50/0 via-cyan-50/30 to-cyan-50/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 translate-x-[-100%] group-hover:translate-x-[100%] pointer-events-none" />

                        {/* Avatar */}
                        <div className="relative shrink-0">
                            <div className="w-12 h-12 rounded-full p-0.5 border-2 border-gray-100 group-hover:border-cyan-200 transition-colors">
                                {m.foto_perfil ? (
                                    <img src={m.foto_perfil} className="w-full h-full rounded-full object-cover"/>
                                ) : (
                                    <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center text-gray-500 font-bold text-lg">
                                        {m.nome[0]}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                           <h4 className="font-bold text-gray-800 text-sm truncate group-hover:text-cyan-700 transition-colors">
                               {m.nome}
                           </h4>
                           <p className="text-xs text-gray-500 truncate flex items-center gap-1">
                               {m.email}
                           </p>
                        </div>

                        {/* Botão Chat */}
                        <button 
                            onClick={(e) => {
                                e.stopPropagation();
                                onSelecionarMembro(m);
                            }}
                            className="p-2.5 rounded-xl bg-gray-50 text-gray-400 border border-gray-100 hover:bg-cyan-500 hover:text-white hover:border-cyan-500 hover:shadow-md hover:shadow-cyan-200 transition-all active:scale-95 z-10 flex items-center gap-2 group/btn"
                            title="Iniciar conversa"
                        >
                            <MessageSquare size={18} />
                            <span className="text-[10px] font-bold max-w-0 overflow-hidden group-hover/btn:max-w-[40px] transition-all duration-300">Chat</span>
                        </button>
                     </div>
                  ))}
               </div>
           )}
        </div>
     </div>
  );

  if (embedded) {
     return (
        <div className="embedded-panel bg-white h-full flex flex-col">
           {/* HEADER PADRÃO (60px) */}
           <div className="embedded-panel-header bg-white border-b border-gray-100 px-4 flex justify-between items-center shrink-0 z-10 h-[60px]">
              <h3 className="font-bold text-gray-800 flex items-center gap-2 text-sm">
                  <BookUser className="text-cyan-600" size={20} />
                  Contatos
              </h3>
              <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-full text-gray-500 transition-colors">
                  <X size={20}/>
              </button>
           </div>
           
           {/* CONTEÚDO */}
           <div className="flex-1 overflow-hidden relative">
               <Content />
           </div>
        </div>
     );
  }

  // Modal Fallback (Mantido funcional mas com estilo atualizado)
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4 animate-fadeIn">
       <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-scaleIn">
          <div className="px-6 py-4 bg-white border-b border-gray-100 flex justify-between items-center">
             <h3 className="font-bold text-gray-800 flex items-center gap-2">
                 <Users className="text-cyan-600"/> Selecionar Contato
             </h3>
             <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full"><X size={20}/></button>
          </div>
          <div className="flex-1 overflow-hidden">
             <Content />
          </div>
       </div>
    </div>
  );
}