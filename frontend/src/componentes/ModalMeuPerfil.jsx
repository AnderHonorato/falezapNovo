import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contextos/AuthContext';
import api from '../servicos/api';
import { 
  X, User, Mail, Phone, Save, Edit3, Lock, Loader2, Camera, 
  MessageSquare, Calendar, Crown, ShieldCheck, Tag, Shield, Globe, Briefcase,
  AlertCircle, EyeOff, Headset
} from 'lucide-react';
import toast from 'react-hot-toast';
import StatusIndicador from '../componentes/StatusIndicador'; 
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// --- HELPERS VISUAIS (Idênticos ao Blog para manter coerência) ---
const getRoleBadgeStyle = (usuario) => {
    if (!usuario) return 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400';
    // Adicionamos rounded-full explicitamente aqui se necessário, mas a classe externa já cuida disso
    if (usuario.tipo === 'OWNER') return 'bg-amber-100 text-amber-900 border-amber-200 ring-1 ring-amber-400/60 dark:bg-amber-900/40 dark:text-amber-200';
    if (usuario.tipo === 'CEO') return 'bg-orange-100 text-orange-900 border-orange-200 ring-1 ring-orange-400/60 dark:bg-orange-900/40 dark:text-orange-200';
    switch (usuario.tipo) {
        case 'SUPORTE': return 'bg-cyan-100 text-cyan-800 border-cyan-200 dark:bg-cyan-900/40 dark:text-cyan-300';
        case 'ADMIN': return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/40 dark:text-blue-300';
        case 'ADMIN_EMPRESA': return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-200';
        case 'COLABORADOR': return 'bg-gray-100 text-gray-700 border-gray-300 dark:bg-gray-800 dark:text-gray-300';
        default: return 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400';
    }
};

const getRoleInfo = (tipo) => {
    const p = { size: 10, strokeWidth: 2.5 };
    switch (tipo) {
        case 'OWNER': return { texto: 'Fundador', icon: <Crown {...p} fill="currentColor"/> };
        case 'CEO': return { texto: 'CEO', icon: <ShieldCheck {...p} fill="currentColor"/> };
        case 'SUPORTE': return { texto: 'Suporte', icon: <Headset {...p} fill="currentColor"/> };
        case 'ADMIN': return { texto: 'Encarregado', icon: <ShieldCheck {...p}/> };
        case 'ADMIN_EMPRESA': return { texto: 'Empresário', icon: <Briefcase {...p}/> };
        default: return { texto: 'Membro', icon: <User {...p}/> };
    }
};

export default function ModalMeuPerfil({ isOpen, onClose }) {
  const { usuario, atualizarUsuarioContexto } = useAuth(); 
  
  const [editando, setEditando] = useState(false);
  const [abaAtiva, setAbaAtiva] = useState('dados');

  // Dados do Formulário
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [recado, setRecado] = useState('');
  
  const [privacidade, setPrivacidade] = useState({
      email: true, telefone: true, cargo: true, foto: true, recado: true
  });

  const [avatarPreview, setAvatarPreview] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);
  
  const [senhaAntiga, setSenhaAntiga] = useState('');
  const [senhaNova, setSenhaNova] = useState('');
  const [confirmarSenhaNova, setConfirmarSenhaNova] = useState('');
  
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');
  const fileInputRef = useRef(null);

  // BANNER PARA O MODAL (MODO EDIÇÃO DADOS)
  const renderBannerSimple = () => {
    if (!usuario) return <div className="absolute inset-0 bg-gray-200"></div>;
    if (usuario.tipo === 'OWNER') return <div className="absolute inset-0 bg-gradient-to-r from-amber-400 to-yellow-500 overflow-hidden"><Crown className="absolute -bottom-4 -right-4 w-24 h-24 text-white/20 rotate-12"/></div>;
    if (usuario.tipo === 'SUPORTE') return <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-indigo-600 overflow-hidden"><Tag className="absolute top-2 left-2 w-16 h-16 text-white/10 -rotate-12"/></div>;
    return <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-500 overflow-hidden"></div>;
  };

  // BANNER PARA O PREVIEW (IDÊNTICO AO BLOG)
  const renderBannerPreview = () => {
    if (!usuario) return <div className="absolute inset-0 bg-gray-300"></div>;
    if (usuario.tipo === 'OWNER') return <div className="absolute inset-0 bg-gradient-to-r from-amber-400 to-orange-500 overflow-hidden"><Crown className="absolute top-[-20%] left-[-10%] w-24 h-24 text-white opacity-10 -rotate-12"/><Crown className="absolute bottom-[-10%] right-[-20%] w-32 h-32 text-white opacity-10 rotate-12"/></div>;
    if (usuario.tipo === 'SUPORTE') return <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-blue-600 overflow-hidden"><Headset className="absolute top-0 left-0 w-20 h-20 text-white opacity-10 -rotate-45"/></div>;
    return <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-600"></div>;
  };

  useEffect(() => {
    if (isOpen && usuario) {
      setNome(usuario.nome || '');
      setTelefone(usuario.telefone || '');
      setRecado(usuario.recado || '');
      
      let privCarregada = { email: true, telefone: true, cargo: true, foto: true, recado: true };
      if (usuario.privacidade) {
          try {
              const parsed = typeof usuario.privacidade === 'string' ? JSON.parse(usuario.privacidade) : usuario.privacidade;
              privCarregada = { ...privCarregada, ...parsed };
          } catch (e) { console.error(e); }
      }
      setPrivacidade(privCarregada);

      const avatarUrl = usuario.avatar ? `${API_URL}/uploads/avatars/${usuario.avatar}` : null;
      setAvatarPreview(avatarUrl);
      
      setAvatarFile(null);
      setSenhaAntiga(''); setSenhaNova(''); setConfirmarSenhaNova('');
      setEditando(false);
      setAbaAtiva('dados');
      setErro('');
    }
  }, [isOpen, usuario]);

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) return toast.error('Apenas imagens.');
      if (file.size > 5 * 1024 * 1024) return toast.error('Máximo 5MB.');
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setAvatarPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const togglePrivacidade = (campo) => {
      setPrivacidade(prev => ({ ...prev, [campo]: !prev[campo] }));
  };

  const handleSalvar = async (e) => {
    if(e) e.preventDefault();
    setErro('');

    if (senhaNova && !senhaAntiga) { setErro('Digite a senha antiga.'); return; }
    if (senhaNova && senhaNova !== confirmarSenhaNova) { setErro('Senhas não coincidem.'); return; }

    setCarregando(true);
    const formData = new FormData();
    formData.append('nome', nome.trim());
    formData.append('email', usuario.email);
    formData.append('telefone', telefone ? telefone.trim() : '');
    formData.append('recado', recado ? recado.trim() : '');
    formData.append('privacidade', JSON.stringify(privacidade));

    if (senhaNova) { formData.append('senhaAntiga', senhaAntiga); formData.append('senhaNova', senhaNova); }
    if (avatarFile) formData.append('avatar', avatarFile);

    try {
      const response = await api.put('/usuarios/perfil', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      const usuarioAtualizado = response.data.usuario;
      if (usuarioAtualizado.avatar) { setAvatarPreview(`${API_URL}/uploads/avatars/${usuarioAtualizado.avatar}?t=${Date.now()}`); }
      await atualizarUsuarioContexto(usuarioAtualizado);
      setEditando(false);
      setSenhaAntiga(''); setSenhaNova(''); setConfirmarSenhaNova(''); setAvatarFile(null);
      toast.success('Perfil atualizado!');
    } catch (error) { setErro(error.response?.data?.erro || 'Erro ao salvar.'); } finally { setCarregando(false); }
  };

  const handleCancelar = () => {
    setEditando(false);
    setNome(usuario.nome || '');
    setTelefone(usuario.telefone || '');
    setRecado(usuario.recado || '');
    if (usuario.privacidade) {
        const p = typeof usuario.privacidade === 'string' ? JSON.parse(usuario.privacidade) : usuario.privacidade;
        setPrivacidade({ email: true, telefone: true, cargo: true, foto: true, recado: true, ...p });
    }
    setErro('');
    setAbaAtiva('dados');
  };

  if (!isOpen) return null;
  if (!usuario) return null; // Proteção extra contra tela branca

  return (
    <>
      <div className="fixed inset-0 z-[190] bg-black/20 backdrop-blur-[2px] transition-opacity" onClick={onClose} />
      
      <div className="fixed top-0 right-0 h-full w-full sm:w-[380px] z-[200] bg-[#f8f9fa] dark:bg-[#0f172a] shadow-2xl border-l border-gray-200 dark:border-gray-800 flex flex-col animate-slide-in-right font-sans">
        
        {/* HEADER */}
        <div className="flex-shrink-0 px-5 py-3 bg-white dark:bg-[#1e293b] border-b border-gray-200 dark:border-gray-700 flex items-center justify-between shadow-sm z-20 relative">
          <div>
            <h2 className="text-base font-bold text-gray-800 dark:text-white leading-none">Meu Perfil</h2>
            <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">Gerenciar conta</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-500"><X className="w-4 h-4" /></button>
        </div>

        {/* NAV ABAS */}
        {editando && (
            <div className="flex bg-white dark:bg-[#1e293b] border-b border-gray-200 dark:border-gray-700 px-5 shadow-sm z-10">
                <button onClick={() => setAbaAtiva('dados')} className={`flex-1 py-2.5 text-[11px] font-bold uppercase tracking-wide border-b-2 transition-all ${abaAtiva === 'dados' ? 'border-blue-600 text-blue-600 dark:text-blue-400' : 'border-transparent text-gray-400'}`}>Dados</button>
                <button onClick={() => setAbaAtiva('privacidade')} className={`flex-1 py-2.5 text-[11px] font-bold uppercase tracking-wide border-b-2 transition-all ${abaAtiva === 'privacidade' ? 'border-blue-600 text-blue-600 dark:text-blue-400' : 'border-transparent text-gray-400'}`}>Privacidade</button>
            </div>
        )}

        {/* CONTEÚDO */}
        <div className="flex-1 overflow-y-auto custom-scrollbar relative">
          
          {(!editando || abaAtiva === 'dados') && (
            <>
              <div className="h-20 w-full relative">
                 {renderBannerSimple()}
              </div>

              <div className="px-5 pb-6 -mt-10 relative z-10">
                 <div className="flex flex-col items-center mb-6">
                     <div className="relative group">
                        <div className="w-20 h-20 rounded-full p-1 bg-white dark:bg-[#0f172a] shadow-md">
                           <div className="w-full h-full rounded-full bg-gray-100 overflow-hidden relative">
                              {avatarPreview ? <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center bg-gray-200"><User className="w-8 h-8 text-gray-400" /></div>}
                           </div>
                        </div>
                        
                        {editando && abaAtiva === 'dados' && (
                           <button onClick={() => fileInputRef.current?.click()} className="absolute bottom-0 right-0 bg-blue-600 text-white p-1.5 rounded-full shadow-sm hover:bg-blue-700 transition-transform hover:scale-110 border-2 border-white dark:border-[#0f172a]"><Camera className="w-3 h-3" /></button>
                        )}
                        {!editando && (
                            <div className="absolute bottom-1 right-1 border-2 border-white dark:border-[#0f172a] rounded-full">
                                <StatusIndicador status={usuario.status || 'offline'} tamanho="sm" />
                            </div>
                        )}
                        <input type="file" ref={fileInputRef} onChange={handleAvatarChange} accept="image/*" className="hidden" />
                     </div>

                     <h3 className="text-lg font-bold text-gray-900 dark:text-white mt-2 leading-tight">{nome || 'Usuário'}</h3>
                     <span className={`mt-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border flex items-center gap-1 ${getRoleBadgeStyle(usuario)}`}>
                        {getRoleInfo(usuario.tipo).icon} {getRoleInfo(usuario.tipo).texto}
                     </span>
                 </div>
                 
                 <div className="space-y-3">
                   {!editando && (
                     <>
                        {recado && (
                            <div className="bg-white dark:bg-[#1e293b] p-3 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm relative overflow-hidden">
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500"></div>
                                <p className="text-xs text-gray-600 dark:text-gray-300 italic pl-2">"{recado}"</p>
                            </div>
                        )}

                        <div className="bg-white dark:bg-[#1e293b] rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
                            <div className="px-3 py-2 bg-gray-50 dark:bg-slate-800/50 border-b border-gray-100 dark:border-gray-700 flex items-center gap-1.5">
                                <Briefcase className="w-3.5 h-3.5 text-gray-400" />
                                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">Dados de Contato</span>
                            </div>
                            <div className="p-3 space-y-3">
                                <div className="flex items-center gap-3 group">
                                    <div className="p-1.5 bg-blue-50 dark:bg-blue-900/20 rounded-md text-blue-600 dark:text-blue-400"><Mail className="w-3.5 h-3.5" /></div>
                                    <div className="min-w-0">
                                        <p className="text-[9px] text-gray-400 font-medium">Email</p>
                                        <p className="text-xs font-semibold text-gray-700 dark:text-gray-200 truncate">{usuario.email}</p>
                                    </div>
                                </div>
                                <div className="h-px bg-gray-50 dark:bg-gray-700/50"></div>
                                <div className="flex items-center gap-3 group">
                                    <div className="p-1.5 bg-green-50 dark:bg-green-900/20 rounded-md text-green-600 dark:text-green-400"><Phone className="w-3.5 h-3.5" /></div>
                                    <div>
                                        <p className="text-[9px] text-gray-400 font-medium">Telefone</p>
                                        <p className="text-xs font-semibold text-gray-700 dark:text-gray-200">{telefone || 'Não informado'}</p>
                                    </div>
                                </div>
                                <div className="h-px bg-gray-50 dark:bg-gray-700/50"></div>
                                <div className="flex items-center gap-3 group">
                                    <div className="p-1.5 bg-purple-50 dark:bg-purple-900/20 rounded-md text-purple-600 dark:text-purple-400"><Calendar className="w-3.5 h-3.5" /></div>
                                    <div>
                                        <p className="text-[9px] text-gray-400 font-medium">Desde</p>
                                        <p className="text-xs font-semibold text-gray-700 dark:text-gray-200">{usuario.criadoEm ? new Date(usuario.criadoEm).toLocaleDateString() : '-'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                     </>
                   )}

                   {editando && abaAtiva === 'dados' && (
                     <div className="bg-white dark:bg-[#1e293b] p-4 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm space-y-3">
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-gray-500 uppercase ml-1">Nome</label>
                            <input type="text" value={nome} onChange={e => setNome(e.target.value)} className="w-full h-9 px-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-gray-500 uppercase ml-1">Telefone</label>
                            <input type="tel" value={telefone} onChange={e => setTelefone(e.target.value)} className="w-full h-9 px-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-gray-500 uppercase ml-1">Recado</label>
                            <textarea value={recado} onChange={e => setRecado(e.target.value)} rows="2" className="w-full p-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all resize-none" />
                        </div>
                        
                        <div className="pt-3 border-t border-gray-100 dark:border-gray-700 mt-2">
                            <p className="text-[10px] font-bold text-gray-400 uppercase mb-2 flex items-center gap-1"><Lock className="w-3 h-3" /> Alterar Senha</p>
                            <div className="space-y-2">
                                <input type="password" value={senhaAntiga} onChange={e => setSenhaAntiga(e.target.value)} placeholder="Senha Atual" className="w-full h-9 px-3 rounded-lg border border-gray-300 bg-gray-50 text-sm focus:bg-white transition-colors" />
                                <div className="grid grid-cols-2 gap-2">
                                    <input type="password" value={senhaNova} onChange={e => setSenhaNova(e.target.value)} placeholder="Nova Senha" className="w-full h-9 px-3 rounded-lg border border-gray-300 bg-gray-50 text-sm focus:bg-white transition-colors" />
                                    <input type="password" value={confirmarSenhaNova} onChange={e => setConfirmarSenhaNova(e.target.value)} placeholder="Confirmar" className="w-full h-9 px-3 rounded-lg border border-gray-300 bg-gray-50 text-sm focus:bg-white transition-colors" />
                                </div>
                            </div>
                        </div>
                     </div>
                   )}
                 </div>
              </div>
            </>
          )}

          {editando && abaAtiva === 'privacidade' && (
             <div className="p-5 space-y-6">
                 
                 {/* PREVIEW DO CARD FLUTUANTE DO BLOG */}
                 <div className="bg-gray-100 dark:bg-slate-800/50 p-4 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
                    <p className="text-[10px] text-center font-bold text-gray-400 uppercase tracking-widest mb-3">Pré-visualização Pública</p>
                    
                    <div style={{ width: '100%', maxWidth: '380px' }} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 animate-fadeIn flex flex-row overflow-hidden relative mx-auto">
                        <div className="absolute w-3 h-3 bg-white dark:bg-gray-800 border-t border-l border-gray-200 dark:border-gray-700 transform rotate-45 -top-1.5 left-1/2 -translate-x-1/2 z-50"/>
                        <div className="absolute top-0 left-0 w-full h-16">{renderBannerPreview()}</div>
                        <div className="relative z-10 flex w-full">
                            <div className="w-[100px] pt-8 pl-3 flex flex-col items-center shrink-0">
                                <div className="w-16 h-16 rounded-full border-4 border-white dark:border-gray-800 bg-white shadow-md overflow-hidden flex items-center justify-center">
                                    {privacidade.foto ? (
                                        avatarPreview ? <img src={avatarPreview} className="w-full h-full object-cover"/> : <User size={24} className="text-gray-300"/>
                                    ) : (
                                        <div className="bg-gray-200 dark:bg-gray-700 w-full h-full flex items-center justify-center" title="Foto Oculta"><EyeOff size={18} className="text-gray-400"/></div>
                                    )}
                                </div>
                                <div className="mt-2 flex flex-col items-center gap-1">
                                    {privacidade.cargo ? (
                                        <div className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border text-center flex items-center justify-center gap-1 ${getRoleBadgeStyle(usuario)}`}>
                                            {getRoleInfo(usuario.tipo).icon} {getRoleInfo(usuario.tipo).texto}
                                        </div>
                                    ) : (
                                        <div className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border border-dashed border-gray-300 text-gray-400">Cargo Oculto</div>
                                    )}
                                </div>
                            </div>

                            <div className="flex-1 pt-20 pr-3 pb-3 pl-2">
                                <h3 className="text-sm font-bold leading-tight dark:text-white">{nome || 'Usuário'}</h3>
                                {privacidade.recado ? (
                                    recado && <p className="text-[10px] text-gray-500 dark:text-gray-400 italic mb-2 line-clamp-2">"{recado}"</p>
                                ) : (
                                    <div className="my-1 h-3 w-20 bg-gray-100 dark:bg-gray-700 rounded animate-pulse" title="Recado Oculto"></div>
                                )}
                                
                                <div className="space-y-1 pt-2 border-t border-gray-100 dark:border-gray-700 text-[10px] text-gray-500">
                                    <div className="flex items-center gap-1.5"><Calendar size={10} className="text-indigo-500"/> Desde {format(new Date(), 'MMM yyyy', { locale: ptBR })}</div>
                                    
                                    <div className={`flex items-center gap-1.5 ${!privacidade.email && 'opacity-40 line-through decoration-gray-400'}`}>
                                        <Mail size={10} className="text-blue-500"/> {privacidade.email ? usuario.email : 'Email Oculto'}
                                    </div>
                                    
                                    <div className={`flex items-center gap-1.5 ${!privacidade.telefone && 'opacity-40 line-through decoration-gray-400'}`}>
                                        <Phone size={10} className="text-green-500"/> {privacidade.telefone ? (telefone || 'Sem telefone') : 'Telefone Oculto'}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                 </div>

                 {/* LISTA DE CONTROLES */}
                 <div className="bg-white dark:bg-[#1e293b] rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
                    <div className="px-4 py-2.5 bg-gray-50 dark:bg-slate-800 border-b border-gray-200 dark:border-gray-700">
                        <p className="text-xs text-gray-500 dark:text-gray-300 flex items-center gap-1.5"><Globe className="w-3.5 h-3.5"/> Configurar Visibilidade</p>
                    </div>
                    <div className="divide-y divide-gray-100 dark:divide-gray-700">
                        {[
                            { id: 'email', label: 'Email', icon: Mail },
                            { id: 'telefone', label: 'Telefone', icon: Phone },
                            { id: 'cargo', label: 'Cargo', icon: Briefcase },
                            { id: 'recado', label: 'Recado', icon: MessageSquare },
                            { id: 'foto', label: 'Foto de Perfil', icon: User },
                        ].map((item) => (
                            <div key={item.id} className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-slate-800/30 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="text-gray-400"><item.icon className="w-4 h-4" /></div>
                                    <span className="text-xs font-semibold text-gray-700 dark:text-gray-200">{item.label}</span>
                                </div>
                                <button type="button" onClick={() => togglePrivacidade(item.id)} className={`relative w-9 h-5 rounded-full transition-colors duration-200 ease-in-out focus:outline-none ${privacidade[item.id] ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-600'}`}>
                                    <span className={`inline-block w-3.5 h-3.5 transform bg-white rounded-full shadow transition-transform duration-200 ease-in-out mt-0.5 ml-0.5 ${privacidade[item.id] ? 'translate-x-4' : 'translate-x-0'}`} />
                                </button>
                            </div>
                        ))}
                    </div>
                 </div>
             </div>
          )}

          {erro && (
             <div className="px-5 pb-4">
                 <div className="bg-red-50 text-red-600 p-2.5 rounded-lg border border-red-100 text-xs flex items-center gap-2 animate-shake">
                     <AlertCircle className="w-4 h-4 shrink-0" /> {erro}
                 </div>
             </div>
          )}

        </div>

        {/* FOOTER */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1e293b]">
           {!editando ? (
               <button onClick={() => { setEditando(true); setAbaAtiva('dados'); }} className="w-full h-10 bg-blue-600 text-white font-bold text-xs uppercase tracking-wide rounded-lg hover:bg-blue-700 transition-all flex items-center justify-center gap-2 shadow-sm hover:shadow active:scale-95">
                   <Edit3 className="w-3.5 h-3.5" /> Editar Perfil
               </button>
           ) : (
              <div className="flex gap-3">
                 <button type="button" onClick={handleCancelar} className="flex-1 h-10 border border-gray-300 text-gray-600 font-bold text-xs uppercase tracking-wide rounded-lg hover:bg-gray-50 transition-colors">Cancelar</button>
                 <button type="button" onClick={handleSalvar} disabled={carregando} className="flex-1 h-10 bg-green-600 text-white font-bold text-xs uppercase tracking-wide rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-70">
                    {carregando ? <Loader2 className="w-3.5 h-3.5 animate-spin"/> : <Save className="w-3.5 h-3.5" />} Salvar
                 </button>
              </div>
           )}
        </div>
      </div>

      <style jsx>{`
        @keyframes slideInRight { from { transform: translateX(100%); } to { transform: translateX(0); } }
        .animate-slide-in-right { animation: slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .animate-fade-in { animation: fadeIn 0.3s ease-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-2px); } 75% { transform: translateX(2px); } }
        .animate-shake { animation: shake 0.3s ease-in-out; }
      `}</style>
    </>
  );
}