// frontend/src/componentes/ChatInterno/GerenciarGrupos.jsx

import { useState, useEffect, useMemo } from 'react';
import { 
  X, Users, Plus, Settings, Trash2, Check, ArrowLeft, 
  Search, Camera, CheckCircle, Loader2, Sparkles, Edit2 
} from 'lucide-react';
import { useAuth } from '../../contextos/AuthContext';
import api from '../../servicos/api';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const extrairNomeArquivo = (caminhoCompleto) => {
  if (!caminhoCompleto) return null;
  let nomeArquivo = caminhoCompleto;
  nomeArquivo = nomeArquivo.replace(/^(https?:\/\/[^\/]+)?\/uploads\/grupos\//, '');
  return nomeArquivo.split('/').pop();
};

export default function GerenciarGrupos({ onClose, onSelecionarGrupo, grupoEditar = null, embedded = false, onVoltar }) {
  const { usuario } = useAuth();
  
  const [etapa, setEtapa] = useState(grupoEditar ? 'editar' : 'lista');
  const [grupos, setGrupos] = useState([]);
  
  // Estados do Formulário
  const [membrosDisponiveis, setMembrosDisponiveis] = useState([]);
  const [membrosSelecionados, setMembrosSelecionados] = useState([]);
  const [nomeGrupo, setNomeGrupo] = useState('');
  const [descricaoGrupo, setDescricaoGrupo] = useState('');
  const [imagemGrupo, setImagemGrupo] = useState(null);
  const [previewImagem, setPreviewImagem] = useState(null);
  const [busca, setBusca] = useState('');
  
  // Controle
  const [carregando, setCarregando] = useState(false);
  const [processando, setProcessando] = useState(false);
  const [grupoSelecionadoId, setGrupoSelecionadoId] = useState(null);

  const grupoEditarId = useMemo(() => grupoEditar?.id, [grupoEditar?.id]);

  useEffect(() => {
    if (etapa === 'lista') {
      carregarGrupos();
    } else {
      carregarMembrosDisponiveis();
    }
  }, [etapa]);

  useEffect(() => {
    if (grupoEditarId && etapa === 'editar') {
      carregarDadosGrupo(grupoEditarId);
    }
  }, [grupoEditarId, etapa]);

  const carregarGrupos = async () => {
    setCarregando(true);
    try {
      const response = await api.get('/chat-interno/grupos');
      let gruposData = response.data.grupos || [];
      gruposData = gruposData.map(grupo => ({ ...grupo, imagem: extrairNomeArquivo(grupo.imagem) }));
      setGrupos(gruposData);
    } catch (error) { toast.error('Erro ao carregar grupos'); } finally { setCarregando(false); }
  };

  const carregarMembrosDisponiveis = async () => {
    try {
      const response = await api.get('/usuarios/equipe-membros').catch(() => api.get('/usuarios?status=ATIVO'));
      const todos = response.data.membros || response.data.usuarios || [];
      const validos = todos.filter(u => u.id !== usuario?.id && (u.contaId === usuario?.contaId));
      setMembrosDisponiveis(validos);
    } catch (e) { console.error(e); }
  };

  const carregarDadosGrupo = async (id) => {
    try {
      const response = await api.get(`/chat-interno/grupos/${id}`);
      const dados = response.data.grupo;
      setGrupoSelecionadoId(dados.id);
      setNomeGrupo(dados.nome);
      setDescricaoGrupo(dados.descricao || '');
      setMembrosSelecionados(dados.membros?.map(m => m.usuarioId) || []);
      setPreviewImagem(dados.imagem ? extrairNomeArquivo(dados.imagem) : null);
    } catch (e) { 
        toast.error('Erro ao carregar dados'); 
        if(!onVoltar) setEtapa('lista'); 
    }
  };

  const salvarGrupo = async () => {
    if (!nomeGrupo.trim()) return toast.error('Nome obrigatório');
    if (membrosSelecionados.length === 0) return toast.error('Selecione membros');

    setProcessando(true);
    const formData = new FormData();
    formData.append('nome', nomeGrupo);
    formData.append('descricao', descricaoGrupo);
    formData.append('membros', JSON.stringify(membrosSelecionados));
    if (imagemGrupo) formData.append('imagem', imagemGrupo);

    try {
      if (etapa === 'editar' && grupoSelecionadoId) {
        await api.patch(`/chat-interno/grupos/${grupoSelecionadoId}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
        toast.success('Grupo atualizado!');
      } else {
        await api.post('/chat-interno/grupos', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
        toast.success('Grupo criado!');
      }
      
      if (onVoltar) {
          onVoltar();
      } else {
          setEtapa('lista');
          limparFormulario();
      }
    } catch (error) { 
        toast.error('Erro ao salvar'); 
    } finally { 
        setProcessando(false); 
    }
  };

  const excluirGrupo = async (grupoId, e) => {
    e.stopPropagation();
    if (!window.confirm('Excluir permanentemente este grupo?')) return;
    try { 
        await api.delete(`/chat-interno/grupos/${grupoId}`); 
        toast.success('Grupo excluído'); 
        carregarGrupos(); 
    } catch (e) { 
        toast.error('Erro ao excluir'); 
    }
  };

  const limparFormulario = () => {
    setNomeGrupo(''); setDescricaoGrupo(''); setMembrosSelecionados([]);
    setImagemGrupo(null); setPreviewImagem(null); setGrupoSelecionadoId(null); setBusca('');
  };

  const toggleMembro = (id) => {
    setMembrosSelecionados(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
  };

  const handleVoltar = () => {
      if (onVoltar) onVoltar();
      else { setEtapa('lista'); limparFormulario(); }
  };

  // --- RENDERIZAÇÃO DA LISTA DE GRUPOS ---
  const renderLista = () => {
    const filtrados = grupos.filter(g => g.nome.toLowerCase().includes(busca.toLowerCase()));

    return (
      <div className="flex flex-col h-full bg-gray-50/50">
         {/* HEADER LISTA */}
         <div className="embedded-panel-header bg-white border-b border-gray-100 px-4 flex justify-between items-center shrink-0 z-10 h-[60px]">
            <h3 className="font-bold text-gray-800 flex items-center gap-2 text-sm">
                <Users size={20} className="text-purple-600"/> Grupos
            </h3>
            <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-full text-gray-500 transition-colors">
                <X size={20}/>
            </button>
         </div>

         <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
            {/* HERO BANNER LISTA */}
            <div className="relative bg-gradient-to-r from-purple-600 to-indigo-600 p-5 rounded-2xl shadow-lg shadow-purple-500/20 overflow-hidden shrink-0 mb-6">
               <div className="absolute right-0 top-0 p-4 opacity-10 pointer-events-none">
                  <Users size={80} strokeWidth={1.5} />
               </div>
               <div className="relative z-10">
                   <h3 className="font-bold text-white text-lg flex items-center gap-2">
                     <Sparkles size={18} className="text-yellow-300" /> 
                     Espaços de Equipe
                   </h3>
                   <p className="text-purple-100 text-xs mt-1.5 leading-relaxed max-w-[90%]">
                     Gerencie seus grupos, crie novos espaços ou entre em conversas existentes.
                   </p>
               </div>
            </div>

            {/* BUSCA E NOVO */}
            <div className="flex gap-2 mb-4 sticky top-0 z-10 bg-gray-50/95 backdrop-blur-sm p-1 rounded-xl">
               <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"/>
                  <input 
                     type="text" 
                     value={busca}
                     onChange={(e) => setBusca(e.target.value)}
                     placeholder="Buscar grupos..." 
                     className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-xs focus:border-purple-500 outline-none transition-all shadow-sm"
                  />
               </div>
               <button 
                  onClick={() => { limparFormulario(); setEtapa('criar'); }}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-2"
               >
                  <Plus size={16}/> Novo
               </button>
            </div>

            {/* LISTAGEM */}
            {carregando ? (
               <div className="flex justify-center py-10"><Loader2 className="animate-spin text-purple-600 w-8 h-8"/></div>
            ) : filtrados.length === 0 ? (
               <div className="flex flex-col items-center justify-center py-12 opacity-50">
                  <Users className="w-12 h-12 text-gray-300 mb-2"/>
                  <p className="text-sm text-gray-400">Nenhum grupo encontrado.</p>
               </div>
            ) : (
               <div className="grid gap-3">
                  {filtrados.map(g => (
                     <div key={g.id} 
                        onClick={() => { onSelecionarGrupo({ tipo: 'grupo', grupo: g }); onClose(); }}
                        className="group bg-white p-3 rounded-2xl border border-gray-100 hover:border-purple-200 hover:shadow-lg hover:shadow-purple-500/5 transition-all cursor-pointer relative overflow-hidden flex items-center gap-3"
                     >
                        {/* Avatar */}
                        <div className="relative shrink-0 w-12 h-12">
                           <div className="w-full h-full rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold overflow-hidden border border-purple-100 group-hover:border-purple-200 transition-colors">
                              {g.imagem ? (
                                 <img src={`${API_URL}/uploads/grupos/${g.imagem}`} className="w-full h-full object-cover"/>
                              ) : (
                                 <Users size={20}/>
                              )}
                           </div>
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                           <h4 className="font-bold text-gray-800 text-sm truncate group-hover:text-purple-700 transition-colors">{g.nome}</h4>
                           <p className="text-xs text-gray-500 truncate">{g.totalMembros} participantes</p>
                        </div>

                        {/* Ações (Só criador) */}
                        {g.criadorId === usuario?.id && (
                           <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity translate-x-4 group-hover:translate-x-0 duration-200">
                              <button 
                                 onClick={(e) => { e.stopPropagation(); carregarDadosGrupo(g.id); setEtapa('editar'); }} 
                                 className="p-2 bg-gray-50 hover:bg-purple-50 text-gray-400 hover:text-purple-600 rounded-lg transition-colors"
                                 title="Editar"
                              >
                                 <Settings size={14}/>
                              </button>
                              <button 
                                 onClick={(e) => excluirGrupo(g.id, e)} 
                                 className="p-2 bg-gray-50 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-lg transition-colors"
                                 title="Excluir"
                              >
                                 <Trash2 size={14}/>
                              </button>
                           </div>
                        )}
                     </div>
                  ))}
               </div>
            )}
         </div>
      </div>
    );
  };

  // --- RENDERIZAÇÃO DO FORMULÁRIO (CRIAR/EDITAR) ---
  const renderFormulario = () => {
    const isEditing = etapa === 'editar';
    const membrosFiltrados = membrosDisponiveis.filter(m => m.nome?.toLowerCase().includes(busca.toLowerCase()));
    
    return (
      <div className="flex flex-col h-full bg-white relative">
         {/* HEADER FORM */}
         <div className="embedded-panel-header bg-white border-b border-gray-100 px-4 flex justify-between items-center shrink-0 z-10 h-[60px]">
            <div className="flex items-center gap-2">
                <button onClick={handleVoltar} className="p-1.5 hover:bg-gray-100 rounded-full text-gray-500 transition-colors">
                    <ArrowLeft size={20}/>
                </button>
                <h3 className="font-bold text-gray-800 text-sm">
                    {isEditing ? 'Editar Grupo' : 'Novo Grupo'}
                </h3>
            </div>
            {!onVoltar && (
                <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-full text-gray-500 transition-colors">
                    <X size={20}/>
                </button>
            )}
         </div>

         <div className="flex-1 overflow-y-auto custom-scrollbar p-6 bg-gray-50/50">
            {/* 1. UPLOAD IMAGEM E NOME */}
            <div className="flex flex-col items-center mb-8">
               <div className="relative group cursor-pointer mb-4">
                  <div className="w-24 h-24 rounded-full bg-white border-4 border-white shadow-lg flex items-center justify-center overflow-hidden relative">
                     {previewImagem ? (
                         <img src={previewImagem.startsWith('blob:') ? previewImagem : `${API_URL}/uploads/grupos/${previewImagem}`} className="w-full h-full object-cover"/>
                     ) : (
                         <div className="w-full h-full bg-purple-50 flex items-center justify-center text-purple-300">
                             <Users size={32}/>
                         </div>
                     )}
                     
                     {/* Overlay Camera */}
                     <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                         <Camera className="text-white w-8 h-8"/>
                     </div>
                  </div>
                  
                  {/* Botão flutuante de edit */}
                  <div className="absolute bottom-0 right-0 bg-purple-600 text-white p-1.5 rounded-full shadow-md border-2 border-white">
                      <Edit2 size={12}/>
                  </div>

                  <input 
                     type="file" 
                     accept="image/*" 
                     className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                     onChange={(e) => {
                        if(e.target.files[0]) { 
                            setImagemGrupo(e.target.files[0]); 
                            setPreviewImagem(URL.createObjectURL(e.target.files[0])); 
                        }
                     }} 
                  />
               </div>

               <div className="w-full max-w-sm space-y-3">
                  <input 
                     type="text" 
                     value={nomeGrupo} 
                     onChange={e => setNomeGrupo(e.target.value)} 
                     placeholder="Nome do Grupo"
                     className="w-full px-4 py-2 text-center font-bold text-lg bg-transparent border-b-2 border-gray-200 focus:border-purple-500 outline-none transition-colors placeholder:font-normal placeholder:text-gray-300"
                  />
                  <input 
                     type="text" 
                     value={descricaoGrupo} 
                     onChange={e => setDescricaoGrupo(e.target.value)} 
                     placeholder="Adicione uma descrição (opcional)"
                     className="w-full px-4 py-1 text-center text-sm bg-transparent outline-none text-gray-500 placeholder:text-gray-300"
                  />
               </div>
            </div>

            {/* 2. SELEÇÃO DE MEMBROS */}
            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm flex flex-col min-h-[300px]">
               <div className="p-3 border-b border-gray-100 bg-gray-50/50 flex items-center gap-3">
                   <Search size={16} className="text-gray-400 ml-2"/>
                   <input 
                      type="text" 
                      value={busca} 
                      onChange={e => setBusca(e.target.value)} 
                      placeholder="Adicionar participantes..." 
                      className="flex-1 bg-transparent text-xs outline-none py-1"
                   />
                   <span className="text-[10px] font-bold bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                      {membrosSelecionados.length}
                   </span>
               </div>

               <div className="flex-1 overflow-y-auto custom-scrollbar p-1 max-h-[250px]">
                   {membrosFiltrados.map(m => {
                      const isSel = membrosSelecionados.includes(m.id);
                      return (
                         <div key={m.id} onClick={() => toggleMembro(m.id)} 
                            className={`flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition-all ${
                                isSel 
                                ? 'bg-purple-50 border border-purple-100' 
                                : 'hover:bg-gray-50 border border-transparent'
                            }`}
                         >
                            <div className="relative">
                                <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${isSel ? 'bg-purple-500 border-purple-500' : 'border-gray-300 bg-white'}`}>
                                    <Check size={12} className={`text-white ${isSel ? 'block' : 'hidden'}`}/>
                                </div>
                            </div>

                            <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-bold text-xs flex-shrink-0">
                               {m.foto_perfil ? <img src={m.foto_perfil} className="w-full h-full rounded-full object-cover"/> : m.nome[0]}
                            </div>
                            
                            <div className="flex-1 min-w-0">
                               <h4 className={`text-xs font-bold truncate ${isSel ? 'text-purple-900' : 'text-gray-700'}`}>{m.nome}</h4>
                               <p className="text-[10px] text-gray-400 truncate">{m.email}</p>
                            </div>
                         </div>
                      )
                   })}
               </div>
            </div>
            
            {/* Espaço para o botão fixo não cobrir conteúdo */}
            <div className="h-20"></div>
         </div>

         {/* FOOTER FIXO FORM */}
         <div className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100 z-20">
            <button 
               onClick={salvarGrupo} 
               disabled={processando || !nomeGrupo.trim() || membrosSelecionados.length === 0}
               className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-bold hover:shadow-lg hover:shadow-purple-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:shadow-none"
            >
               {processando ? <Loader2 className="animate-spin w-5 h-5"/> : <CheckCircle size={18}/>}
               {isEditing ? 'Salvar Alterações' : 'Criar Grupo'}
            </button>
         </div>
      </div>
    );
  };

  if (embedded) return <div className="embedded-panel h-full w-full bg-white">{etapa === 'lista' ? renderLista() : renderFormulario()}</div>;

  // Fallback Modal
  return <div/>;
}