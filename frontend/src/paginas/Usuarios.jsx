import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Users, Plus, Edit2, Trash2, Search, Shield, ShieldCheck,
  Crown, User, Tag, X, Loader2, AlertCircle, UserCheck, UserX,
  CheckCircle, Smartphone, MessageSquare, BarChart3,
  HelpCircle, ShieldAlert, Briefcase, Headset, Filter, Building2,
  Mail, Phone, Calendar, Download, FileSpreadsheet, ChevronDown,
  Lock
} from 'lucide-react';
import api from '../servicos/api';
import { useAuth } from '../contextos/AuthContext';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import './paginas_css/Usuarios.css';

// --- HIERARQUIA DE PERMISSÕES (FRONTEND) ---
const HIERARQUIA = {
  COLABORADOR: 1,
  ENCARREGADO: 2,
  ADMIN: 3,
  ADMIN_EMPRESA: 3,
  CEO: 4,
  SUPORTE: 5,
  OWNER: 6
};

// --- COMPONENTES AUXILIARES ---

const ActionButton = ({ children, onClick, tooltip, colorClass = "text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700" }) => (
    <div className="relative group inline-flex">
      <button onClick={(e) => { e.stopPropagation(); onClick && onClick(e); }} className={`p-1.5 rounded-lg transition-colors ${colorClass}`}>{children}</button>
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-[10px] font-bold rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-[9999] shadow-lg">{tooltip}<div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div></div>
    </div>
);

const Drawer = ({ isOpen, onClose, title, children, footer, width = 'sm:w-[450px]' }) => {
    if (!isOpen) return null;
    return (
        <>
            <div className="fixed inset-0 z-[250] bg-black/20 backdrop-blur-[2px] transition-opacity" onClick={onClose} />
            <div className={`fixed top-0 right-0 h-full w-full ${width} z-[260] bg-[#f8f9fa] dark:bg-[#0f172a] shadow-2xl border-l border-gray-200 dark:border-gray-700 flex flex-col animate-slide-in-right font-sans`}>
                <div className="flex-shrink-0 px-5 py-4 bg-white dark:bg-[#1e293b] border-b border-gray-200 dark:border-gray-700 flex items-center justify-between shadow-sm z-20">
                    <h2 className="text-base font-bold text-gray-800 dark:text-white leading-tight truncate pr-4">{title}</h2>
                    <button onClick={onClose} className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-500 flex-shrink-0"><X className="w-5 h-5" /></button>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar relative p-0">
                    {children}
                </div>
                {footer && (
                    <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1e293b] shrink-0 z-30">
                        {footer}
                    </div>
                )}
            </div>
        </>
    );
};

const SimpleConfirmModal = ({ isOpen, onClose, onConfirm, titulo, mensagem, processando, tipo = 'warning', confirmText }) => {
  if (!isOpen) return null;
  const iconColor = tipo === 'warning' ? 'text-red-600' : (tipo === 'info' ? 'text-blue-600' : 'text-green-600');
  const bgColor = tipo === 'warning' ? 'bg-red-100' : (tipo === 'info' ? 'bg-blue-100' : 'bg-green-100');
  const buttonColor = tipo === 'warning' ? 'bg-red-600 hover:bg-red-700' : (tipo === 'info' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-green-600 hover:bg-green-700');
  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-[2px] z-[9999] flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-sm w-full p-6 border border-gray-200 dark:border-gray-700 transform transition-all scale-100">
        <div className="text-center">
          <div className={`w-14 h-14 ${bgColor} dark:bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4`}>
            {tipo === 'warning' ? <AlertCircle className={`w-7 h-7 ${iconColor}`} /> : <UserCheck className={`w-7 h-7 ${iconColor}`} />}
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{titulo}</h2>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-8 text-center leading-relaxed" dangerouslySetInnerHTML={{ __html: mensagem }} />
        <div className="flex gap-3">
          <button onClick={onClose} disabled={processando} className="flex-1 h-11 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 font-bold text-sm transition-colors disabled:opacity-50">Cancelar</button>
          <button onClick={onConfirm} disabled={processando} className={`flex-1 h-11 ${buttonColor} text-white rounded-xl font-bold text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg`}>
            {processando && <Loader2 className="w-4 h-4 animate-spin" />}
            {confirmText || (tipo === 'warning' ? 'Deletar' : 'Confirmar')}
          </button>
        </div>
      </div>
    </div>
  );
};

// Helpers de Estilo
const getRoleBadgeStyle = (tipo) => {
    switch (tipo) {
        case 'OWNER': return 'bg-amber-100 text-amber-900 border-amber-200 ring-1 ring-amber-400/60 dark:bg-amber-900/40 dark:text-amber-200';
        case 'CEO': return 'bg-orange-100 text-orange-900 border-orange-200 ring-1 ring-orange-400/60 dark:bg-orange-900/40 dark:text-orange-200';
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
        case 'COLABORADOR': return { texto: 'Colaborador', icon: <User {...p}/> };
        default: return { texto: 'Membro', icon: <User {...p}/> };
    }
};

const formatarTelefone = (v) => {
  if (!v) return '';
  v = v.replace(/\D/g, '');
  if (v.length > 11) return v.replace(/^(\d\d)(\d{5})(\d{4}).*/, '($1) $2-$3');
  if (v.length > 10) return v.replace(/^(\d\d)(\d{5})(\d{4})/, '($1) $2-$3');
  return v;
};

// Verifica hierarquia para edição
const podeGerenciar = (usuarioLogado, alvo) => {
  if (!usuarioLogado) return false;
  if (usuarioLogado.tipo === 'OWNER' || usuarioLogado.tipo === 'SUPORTE') return true;
  // Se eu tenho a permissão de gerenciar usuários, posso gerenciar quem tem hierarquia menor
  if (usuarioLogado.podeGerenciarUsuarios) {
      const nivelLogado = HIERARQUIA[usuarioLogado.tipo] || 0;
      const tipoAlvo = typeof alvo === 'string' ? alvo : alvo?.tipo;
      const nivelAlvo = HIERARQUIA[tipoAlvo] || 0;
      return nivelLogado >= nivelAlvo;
  }
  return false;
};

const RenderBannerProfile = ({ usuario }) => {
    if (!usuario) return <div className="absolute inset-0 bg-gray-300"></div>;
    if (usuario.tipo === 'OWNER') return <div className="absolute inset-0 bg-gradient-to-r from-amber-400 to-orange-500 overflow-hidden"><Crown className="absolute top-[-20%] left-[-10%] w-24 h-24 text-white opacity-10 -rotate-12"/><Crown className="absolute bottom-[-10%] right-[-20%] w-32 h-32 text-white opacity-10 rotate-12"/></div>;
    if (usuario.tipo === 'SUPORTE') return <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-blue-600 overflow-hidden"><Headset className="absolute top-0 left-0 w-20 h-20 text-white opacity-10 -rotate-45"/></div>;
    return <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-600"></div>;
};

export default function UsuariosPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { usuario: usuarioLogado, carregando: authCarregando } = useAuth();
  
  const [usuarios, setUsuarios] = useState([]);
  const [empresas, setEmpresas] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [carregando, setCarregando] = useState(true);
  
  // Filtros Header
  const [busca, setBusca] = useState('');
  const [filtroCargo, setFiltroCargo] = useState('');
  const [filtroEmpresa, setFiltroEmpresa] = useState('');
  const [menuExportarAberto, setMenuExportarAberto] = useState(false);
  const exportarRef = useRef(null);

  // Modais e Estados
  const [mostrarModal, setMostrarModal] = useState(false);
  const [mostrarModalCategoria, setMostrarModalCategoria] = useState(false);
  const [usuarioEditando, setUsuarioEditando] = useState(null);
  const [usuarioVisualizando, setUsuarioVisualizando] = useState(null);
  const [confirmDeletarUsuario, setConfirmDeletarUsuario] = useState(null);
  const [confirmDeletarCategoria, setConfirmDeletarCategoria] = useState(null);
  const [processandoDelecao, setProcessandoDelecao] = useState(false);
  
  const [formData, setFormData] = useState({});
  const [novaCategoria, setNovaCategoria] = useState('');
  const [salvandoCategoria, setSalvandoCategoria] = useState(false);
  
  const estadoInicialForm = {
    nome: '', email: '', nickname: '', senha: '', cpf: '', telefone: '',
    tipo: 'COLABORADOR', contaId: '', categoriaId: '', status: 'ATIVO'
  };

  useEffect(() => { setFormData(estadoInicialForm); }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
        if (exportarRef.current && !exportarRef.current.contains(event.target)) setMenuExportarAberto(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if(location.state?.filtroEmpresa){
        setFiltroEmpresa(location.state.filtroEmpresa);
        window.history.replaceState({}, document.title);
        toast(`Filtro aplicado: ${location.state.nomeEmpresa || 'Empresa selecionada'}`, { icon: '🔍', id: 'filtro-empresa' });
    }
  }, [location.state]);

  useEffect(() => {
    if (!authCarregando) {
      if (usuarioLogado) {
        // Verifica permissão para acessar a página
        const podeAcessar = usuarioLogado.podeAcessarEmpresasUsuarios || usuarioLogado.tipo === 'OWNER';

        if (!podeAcessar) {
            navigate('/bloqueio', { 
                state: { 
                    pagina: 'Gestão de Usuários', 
                    motivo: 'Seu perfil não possui permissão para visualizar a lista de usuários.' 
                } 
            });
            return;
        }

        if (usuarioLogado.tipo !== 'OWNER' && usuarioLogado.contaId) {
          setFormData(prev => ({ ...prev, contaId: usuarioLogado.contaId }));
        }
        carregarDados();
      }
    }
  }, [usuarioLogado, authCarregando, navigate]);

  const carregarDados = async () => {
    setCarregando(true);
    try {
      let empresasPromise;
      if (['OWNER', 'CEO', 'SUPORTE'].includes(usuarioLogado.tipo)) { 
          empresasPromise = api.get('/empresas'); 
      } else if (usuarioLogado.conta) { 
          empresasPromise = Promise.resolve({ data: [usuarioLogado.conta] }); 
      } else { 
          empresasPromise = api.get(`/empresas/${usuarioLogado.contaId}`).then(res => ({ data: [res.data] })); 
      }

      const [usuariosRes, empresasRes, categoriasRes] = await Promise.allSettled([
          api.get('/usuarios'), empresasPromise, api.get('/categorias')
      ]);

      let usuariosRecebidos = [];
      if (usuariosRes.status === 'fulfilled') {
        usuariosRecebidos = Array.isArray(usuariosRes.value.data?.usuarios) ? usuariosRes.value.data.usuarios : (Array.isArray(usuariosRes.value.data) ? usuariosRes.value.data : []);
      }
      if (empresasRes.status === 'fulfilled') {
          const d = empresasRes.value.data;
          setEmpresas(Array.isArray(d) ? d : (d.data || d.empresas || []));
      }
      if (categoriasRes.status === 'fulfilled') {
          setCategorias(Array.isArray(categoriasRes.value.data) ? categoriasRes.value.data : []);
      }
      usuariosRecebidos.sort((a, b) => {
        const statusA = a.status === 'INATIVO' ? 1 : 0;
        const statusB = b.status === 'INATIVO' ? 1 : 0;
        if (statusA !== statusB) return statusA - statusB;
        return (a.nome || '').localeCompare(b.nome || '');
      });
      setUsuarios(usuariosRecebidos);
    } catch (e) { toast.error('Erro ao carregar dados.'); } finally { setCarregando(false); }
  };

  const handleSubmit = async (e) => { e.preventDefault(); salvarDados(); };
  
  const salvarDados = async () => {
      const tId = toast.loading('Salvando...');
      try {
          const payload = { ...formData };
          if(payload.tipo==='COLABORADOR'||payload.tipo==='ADMIN') payload.email = null; else { payload.nickname=null; payload.cpf=null; }
          
          if(!usuarioEditando) delete payload.status;
          
          if(usuarioEditando) {
              if(!payload.senha) delete payload.senha;
              await api.put(`/usuarios/${usuarioEditando.id}`, payload);
              toast.success('Atualizado!', {id:tId});
          } else {
              await api.post('/usuarios', payload);
              toast.success('Criado!', {id:tId});
          }
          setMostrarModal(false); resetForm(); await carregarDados();
      } catch(e) { toast.error(e.response?.data?.erro || 'Erro ao salvar', {id:tId}); }
  };

  const preencherFormulario = (u) => {
      if(!u) return;
      setUsuarioEditando(u);
      const d = { 
          nome: u.nome||'', email: u.email||'', nickname: u.nickname||'', senha: '', cpf: u.cpf||'', telefone: u.telefone||'', 
          tipo: u.tipo||'COLABORADOR', contaId: u.conta?.id||u.contaId||'', categoriaId: u.categoria?.id||'', status: u.status||'ATIVO' 
      };
      setFormData(d); 
  };

  const handleEditar = (u) => { 
      if (!podeGerenciar(usuarioLogado, u) && usuarioLogado.id !== u.id) {
          return toast.error("Sem permissão hierárquica para editar este usuário.");
      }
      preencherFormulario(u); setMostrarModal(true); 
  };

  // ✅ REDIRECIONA PARA A NOVA PÁGINA DE PERMISSÕES
  const handleEditarPermissoes = (u) => { 
      if (!podeGerenciar(usuarioLogado, u)) return toast.error("Sem permissão hierárquica.");
      navigate(`/usuarios/${u.id}/permissoes`);
  };

  const handleDeletar = (id) => { 
      const u = usuarios.find(x => x.id === id);
      if (!podeGerenciar(usuarioLogado, u)) {
          return toast.error("Sem permissão hierárquica para deletar.");
      }
      setConfirmDeletarUsuario(u); 
  };

  const resetForm = () => { 
      setFormData({...estadoInicialForm, contaId: usuarioLogado?.contaId||''}); 
      setUsuarioEditando(null); 
  };

  const executarDelecaoUsuario = async () => { 
      if(!confirmDeletarUsuario) return; 
      setProcessandoDelecao(true); 
      const tId = toast.loading('Deletando...');
      try { 
          await api.delete(`/usuarios/${confirmDeletarUsuario.id}`); 
          toast.success('Deletado', {id: tId}); 
          setConfirmDeletarUsuario(null); 
          await carregarDados(); 
      } catch (e) { 
          toast.error(e.response?.data?.erro || 'Erro ao deletar', {id: tId}); 
      } finally { 
          setProcessandoDelecao(false); 
      } 
  };
  
  const handleCriarCategoria = async () => { 
      if(!novaCategoria.trim()) return toast.error('Digite o nome');
      setSalvandoCategoria(true);
      const tId = toast.loading('Criando...');
      try { 
          await api.post('/categorias', {nome:novaCategoria}); 
          setNovaCategoria(''); 
          toast.success('Categoria criada!', {id: tId});
          await carregarDados(); 
      } catch(e){
          toast.error('Erro ao criar', {id: tId});
      } finally {
          setSalvandoCategoria(false);
      }
  };

  const handleDeletarCategoria = async (c) => { if(c.membros>0) return toast.error('Tem membros'); setConfirmDeletarCategoria(c); };
  
  const executarDelecaoCategoria = async () => { 
      if(!confirmDeletarCategoria) return; 
      setProcessandoDelecao(true);
      const tId = toast.loading('Deletando...');
      try { 
          await api.delete(`/categorias/${confirmDeletarCategoria.id}`); 
          setConfirmDeletarCategoria(null); 
          toast.success('Deletada', {id: tId});
          await carregarDados(); 
      } catch(e){
          toast.error('Erro', {id: tId});
      } finally {
          setProcessandoDelecao(false);
      }
  };

  const usuariosFiltrados = (() => {
    let f = usuarios || [];
    if(busca) { const b=busca.toLowerCase(); f = f.filter(u => (u.nome||'').toLowerCase().includes(b) || (u.email||'').toLowerCase().includes(b) || (u.nickname||'').toLowerCase().includes(b)); }
    if(filtroCargo) f = f.filter(u => u.tipo === filtroCargo);
    if(filtroEmpresa && usuarioLogado?.tipo === 'OWNER') f = f.filter(u => u.contaId === filtroEmpresa);
    return f;
  })();

  const handleExportarExcel = () => {
    if (usuariosFiltrados.length === 0) return toast.error('Nenhum usuário para exportar.');
    let csvContent = "data:text/csv;charset=utf-8,\ufeffNome;Email/Login;Tipo;Empresa;Status;Categoria\n";
    usuariosFiltrados.forEach(u => {
        csvContent += `${u.nome};${u.email || u.nickname};${u.tipo};${u.conta?.nomeFantasia || '-'};${u.status};${u.categoria?.nome || '-'}\n`;
    });
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", `Usuarios_${format(new Date(), 'dd-MM-yyyy')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setMenuExportarAberto(false);
    toast.success("Lista exportada!");
  };

  const tipoRequerEmail = formData && ['CEO','ADMIN_EMPRESA','OWNER','SUPORTE'].includes(formData.tipo);
  const tipoRequerNickname = formData && ['COLABORADOR','ADMIN'].includes(formData.tipo);

  // Renderiza a lista de Skeleton Loader
  const renderSkeletonTable = () => Array(5).fill(0).map((_, i) => (
      <tr key={i} className="animate-pulse">
        <td className="px-4 py-3"><div className="flex items-center gap-3"><div className="w-9 h-9 rounded-full bg-gray-200 dark:bg-gray-700"></div><div className="flex-1 space-y-2"><div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-24"></div><div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-16"></div></div></div></td>
        <td className="px-4 py-3"><div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-full"></div></td>
        <td className="px-4 py-3"><div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded-full"></div></td>
        <td className="px-4 py-3"><div className="h-2 w-10 bg-gray-200 dark:bg-gray-700 rounded"></div></td>
        <td className="px-4 py-3"><div className="h-6 w-6 bg-gray-200 dark:bg-gray-700 rounded-full"></div></td>
        <td className="px-4 py-3"><div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded"></div></td>
        <td className="px-4 py-3"><div className="h-6 w-16 bg-gray-200 dark:bg-gray-700 rounded ml-auto"></div></td>
      </tr>
  ));

  if(!formData) return null;

  return (
    <div className="dashboard-container flex flex-col h-full bg-[#f8f9fa] dark:bg-gray-900 relative overflow-hidden font-sans">
        
        {/* HEADER */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 shadow-sm z-10 shrink-0">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex flex-col gap-1">
                    <h1 className="text-xl font-bold flex gap-2 items-center text-gray-800 dark:text-white">
                        <Users size={20} className="text-purple-600"/> Gestão de Usuários
                    </h1>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Gerencie acessos, permissões e categorias.</p>
                </div>

                <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                    <div className="relative group"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 group-focus-within:text-purple-500 transition-colors"/><input placeholder="Buscar usuário..." value={busca} onChange={e=>setBusca(e.target.value)} className="pl-9 pr-4 py-1.5 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-full text-xs outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/20 w-40 transition-all dark:text-white"/></div>
                    
                    <div className="relative"><Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400"/><select value={filtroCargo} onChange={e=>setFiltroCargo(e.target.value)} className="pl-9 pr-8 py-1.5 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-full text-xs outline-none cursor-pointer appearance-none hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors dark:text-white"><option value="">Todos Cargos</option><option value="ADMIN_EMPRESA">Empresário</option><option value="ADMIN">Encarregado</option><option value="COLABORADOR">Colaborador</option></select><ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none"/></div>
                    
                    {['OWNER', 'CEO', 'SUPORTE'].includes(usuarioLogado?.tipo) && (
                        <div className="relative">
                            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400"/>
                            <select value={filtroEmpresa} onChange={e=>setFiltroEmpresa(e.target.value)} className="pl-9 pr-8 py-1.5 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-full text-xs outline-none cursor-pointer appearance-none hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors max-w-[150px] truncate dark:text-white"><option value="">Todas Empresas</option>{empresas.map(e=><option key={e.id} value={e.id}>{e.razaoSocial||e.nomeFantasia}</option>)}</select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none"/>
                        </div>
                    )}
                    <div className="h-6 w-px bg-gray-200 dark:bg-gray-700 mx-1 hidden md:block"></div>
                    <div className="relative" ref={exportarRef}><button onClick={() => setMenuExportarAberto(!menuExportarAberto)} className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 shadow-sm transition-all"><Download size={14} /> <span className="hidden sm:inline">Exportar</span></button>{menuExportarAberto && (<div className="absolute right-0 top-full mt-2 w-40 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 z-50 p-2 animate-scale-in"><button onClick={handleExportarExcel} className="w-full text-left px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg text-xs flex items-center gap-2 text-gray-700 dark:text-gray-200"><FileSpreadsheet size={14} className="text-green-600"/> Excel (CSV)</button></div>)}</div>
                    
                    {(podeGerenciar(usuarioLogado, 'ADMIN')) && (
                        <>
                            <button onClick={()=>setMostrarModalCategoria(true)} className="flex items-center gap-1.5 px-3 py-1.5 border border-blue-200 bg-blue-50 text-blue-700 rounded-lg text-xs font-bold hover:bg-blue-100 transition-colors shadow-sm dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-300"><Tag size={14}/> <span className="hidden sm:inline">Categorias</span></button>
                            <button onClick={()=>{resetForm();setMostrarModal(true)}} className="flex items-center gap-1.5 px-4 py-1.5 bg-purple-600 text-white rounded-lg text-xs font-bold hover:bg-purple-700 transition-colors shadow-md"><Plus size={14}/> <span className="hidden sm:inline">Novo Usuário</span></button>
                        </>
                    )}
                </div>
            </div>
        </div>
        
        {/* TABELA */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
            <div className="max-w-[1600px] mx-auto">
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <div className="overflow-x-auto custom-scrollbar">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700"><tr><th className="p-4 text-[10px] font-bold text-gray-400 uppercase">Usuário</th><th className="p-4 text-[10px] font-bold text-gray-400 uppercase">Login</th><th className="p-4 text-[10px] font-bold text-gray-400 uppercase">Status</th><th className="p-4 text-[10px] font-bold text-gray-400 uppercase">Cargo</th><th className="p-4 text-[10px] font-bold text-gray-400 uppercase">Categoria</th>{usuarioLogado?.tipo==='OWNER'&&<th className="p-4 text-[10px] font-bold text-gray-400 uppercase">Empresa</th>}<th className="p-4 text-right text-[10px] font-bold text-gray-400 uppercase">Ações</th></tr></thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                {carregando ? renderSkeletonTable() : usuariosFiltrados.length === 0 ? (
                                    <tr><td colSpan={7} className="p-8 text-center text-gray-400 text-sm">Nenhum usuário encontrado.</td></tr>
                                ) : usuariosFiltrados.map(u => (
                                    <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                                            <td className="p-4">
                                                <div className="inline-flex items-center gap-3 cursor-pointer group" onClick={() => setUsuarioVisualizando(u)}>
                                                    <div className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center border border-gray-200 dark:border-gray-600 font-bold text-xs group-hover:border-purple-300 transition-colors overflow-hidden">
                                                        {u.avatar ? <img src={`${import.meta.env.VITE_API_URL}/uploads/avatars/${u.avatar}`} className="w-full h-full object-cover"/> : u.nome?.charAt(0)}
                                                    </div>
                                                    <span className="text-sm font-bold text-gray-700 dark:text-gray-200 group-hover:text-purple-600 transition-colors">{u.nome}</span>
                                                </div>
                                            </td>
                                            <td className="p-4 text-xs text-gray-600 dark:text-gray-400"><p>{u.email || u.nickname}</p>{u.cpf && <span className="text-[10px] text-gray-400">CPF: {u.cpf}</span>}</td>
                                            <td className="p-4">{u.status === 'ATIVO' ? <span className="text-green-600 bg-green-50 dark:bg-green-900/20 px-2 py-0.5 rounded text-[10px] font-bold uppercase border border-green-100 dark:border-green-800">Ativo</span> : <span className="text-red-600 bg-red-50 dark:bg-red-900/20 px-2 py-0.5 rounded text-[10px] font-bold uppercase border border-red-100 dark:border-red-800">Inativo</span>}</td>
                                            <td className="p-4">
                                                <div className="flex flex-col items-start gap-1">
                                                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border flex w-fit gap-1 ${getRoleBadgeStyle(u.tipo)}`}>{getRoleInfo(u.tipo).icon} {getRoleInfo(u.tipo).texto}</span>
                                                    {u.podeModerarBlog && <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded border border-indigo-200 bg-indigo-50 text-indigo-700 text-[9px] font-bold uppercase tracking-wider"><ShieldAlert size={10} /> Moderador</span>}
                                                </div>
                                            </td>
                                            <td className="p-4 text-xs text-gray-500 dark:text-gray-400">{u.categoria?.nome || '-'}</td>
                                            {usuarioLogado?.tipo === 'OWNER' && <td className="p-4 text-xs text-gray-500 dark:text-gray-400">{u.conta?.nomeFantasia || '-'}</td>}
                                            <td className="p-4 text-right">
                                                <div className="flex justify-end gap-1">
                                                    {podeGerenciar(usuarioLogado, u) && (
                                                        <ActionButton onClick={()=>handleEditarPermissoes(u)} tooltip="Permissões" colorClass="text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20"><Shield size={14}/></ActionButton>
                                                    )}
                                                    {(podeGerenciar(usuarioLogado, u) || usuarioLogado.id === u.id) && (
                                                        <ActionButton onClick={()=>handleEditar(u)} tooltip="Editar"><Edit2 size={14}/></ActionButton>
                                                    )}
                                                    {podeGerenciar(usuarioLogado, u) && usuarioLogado.id !== u.id && (
                                                        <ActionButton onClick={()=>handleDeletar(u.id)} tooltip="Excluir"><Trash2 size={14}/></ActionButton>
                                                    )}
                                                </div>
                                            </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>

        {/* GAVETA DE VISUALIZAÇÃO */}
        <Drawer isOpen={!!usuarioVisualizando} onClose={() => setUsuarioVisualizando(null)} title={`Perfil: ${usuarioVisualizando?.nome}`}>
            {usuarioVisualizando && (
                <>
                   <div className="h-24 w-full relative">
                        <RenderBannerProfile usuario={usuarioVisualizando} />
                   </div>
                   <div className="px-5 pb-6 -mt-12 relative z-10">
                        <div className="flex flex-col items-center mb-6">
                            <div className="w-24 h-24 rounded-full p-1 bg-white dark:bg-[#0f172a] shadow-md relative">
                                <div className="w-full h-full rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden flex items-center justify-center">
                                    {usuarioVisualizando.avatar ? <img src={`${import.meta.env.VITE_API_URL}/uploads/avatars/${usuarioVisualizando.avatar}`} className="w-full h-full object-cover" /> : <User className="w-8 h-8 text-gray-400" />}
                                </div>
                            </div>
                            <h3 className="text-xl font-bold mt-3 text-gray-900 dark:text-white text-center">{usuarioVisualizando.nome}</h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">{usuarioVisualizando.email || usuarioVisualizando.nickname}</p>
                            <div className={`px-3 py-1 rounded-full text-[10px] font-bold border flex items-center gap-1.5 shadow-sm ${getRoleBadgeStyle(usuarioVisualizando.tipo)}`}>
                                {getRoleInfo(usuarioVisualizando.tipo).icon} {getRoleInfo(usuarioVisualizando.tipo).texto}
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3 w-full mb-6">
                            <div className="bg-gray-50 dark:bg-gray-700/30 p-3 rounded-xl border border-gray-100 dark:border-gray-700/50 hover:bg-white dark:hover:bg-gray-700/50 transition-colors shadow-sm">
                                <span className="text-[9px] font-bold text-gray-400 uppercase block mb-1">Telefone</span>
                                <div className="flex items-center gap-2"><Phone size={14} className="text-purple-500" /><p className="text-xs font-semibold text-gray-700 dark:text-gray-200">{formatarTelefone(usuarioVisualizando.telefone) || '-'}</p></div>
                            </div>
                            <div className="bg-gray-50 dark:bg-gray-700/30 p-3 rounded-xl border border-gray-100 dark:border-gray-700/50 hover:bg-white dark:hover:bg-gray-700/50 transition-colors shadow-sm">
                                <span className="text-[9px] font-bold text-gray-400 uppercase block mb-1">Entrou em</span>
                                <div className="flex items-center gap-2"><Calendar size={14} className="text-blue-500" /><p className="text-xs font-semibold text-gray-700 dark:text-gray-200">{usuarioVisualizando.criadoEm ? format(new Date(usuarioVisualizando.criadoEm), 'dd/MM/yyyy') : '-'}</p></div>
                            </div>
                            <div className="bg-gray-50 dark:bg-gray-700/30 p-3 rounded-xl border border-gray-100 dark:border-gray-700/50 hover:bg-white dark:hover:bg-gray-700/50 transition-colors shadow-sm col-span-2">
                                <span className="text-[9px] font-bold text-gray-400 uppercase block mb-1">Documento (CPF)</span>
                                <div className="flex items-center gap-2"><ShieldCheck size={14} className="text-green-500" /><p className="text-xs font-semibold text-gray-700 dark:text-gray-200">{usuarioVisualizando.cpf || 'Não informado'}</p></div>
                            </div>
                        </div>
                        {usuarioVisualizando.recado && (
                            <div className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-gray-800 dark:to-gray-800/50 p-4 rounded-2xl border border-purple-100 dark:border-gray-700 relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-2 opacity-10"><MessageSquare size={40} className="text-purple-600"/></div>
                                <span className="text-[9px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider mb-1 block flex items-center gap-1"><MessageSquare size={10}/> Bio / Recado</span>
                                <p className="text-xs text-gray-600 dark:text-gray-300 italic leading-relaxed relative z-10">"{usuarioVisualizando.recado}"</p>
                            </div>
                        )}
                   </div>
                </>
            )}
        </Drawer>

        {/* MODAL EDIÇÃO/CRIAÇÃO - Completo */}
        <Drawer 
            isOpen={mostrarModal} 
            onClose={()=>{setMostrarModal(false);resetForm()}} 
            title={usuarioEditando ? `Editar: ${usuarioEditando.nome}` : "Novo Usuário"}
            width="sm:w-[450px]"
            footer={
                <div className="flex gap-3">
                    <button type="button" onClick={()=>{setMostrarModal(false);resetForm()}} className="flex-1 h-10 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800 font-bold">Cancelar</button>
                    <button onClick={handleSubmit} className="flex-1 h-10 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-bold shadow-md">Salvar</button>
                </div>
            }
        >
            <form className="space-y-5 px-5 py-2">
                <div><label className="text-xs font-bold block mb-1.5 text-gray-500 dark:text-gray-400">Nome Completo</label><input required className="w-full border dark:border-gray-600 rounded-xl p-3 text-sm bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 outline-none focus:ring-2 focus:ring-purple-500/20" value={formData.nome} onChange={e=>setFormData({...formData,nome:e.target.value})}/></div>
                
                {usuarioEditando && usuarioEditando.id !== usuarioLogado?.id && (
                    <div>
                        <label className="text-xs font-bold block mb-1.5 text-gray-500 dark:text-gray-400">Status</label>
                        <div className="flex items-center gap-3 p-3 border dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                            <label className="flex items-center gap-2 cursor-pointer"><input type="radio" name="status" value="ATIVO" checked={formData.status === 'ATIVO'} onChange={(e) => setFormData({ ...formData, status: e.target.value })} className="text-green-600 focus:ring-green-500" disabled={usuarioEditando?.tipo === 'OWNER'} /><span className="text-sm font-medium text-green-700 dark:text-green-400 flex items-center gap-1"><UserCheck size={14}/> Ativo</span></label>
                            <label className="flex items-center gap-2 cursor-pointer"><input type="radio" name="status" value="INATIVO" checked={formData.status === 'INATIVO'} onChange={(e) => setFormData({ ...formData, status: e.target.value })} className="text-red-600 focus:ring-red-500" disabled={usuarioEditando?.tipo === 'OWNER'} /><span className="text-sm font-medium text-red-700 dark:text-red-400 flex items-center gap-1"><UserX size={14}/> Inativo</span></label>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                    <div><label className="text-xs font-bold block mb-1.5 text-gray-500 dark:text-gray-400">Tipo de Acesso</label><select className="w-full border dark:border-gray-600 rounded-xl p-3 text-sm bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 outline-none" value={formData.tipo} onChange={e=>{const nt=e.target.value; setFormData({...formData, tipo:nt});}}><option value="COLABORADOR">Colaborador</option><option value="ADMIN">Encarregado</option><option value="ADMIN_EMPRESA">Empresário</option>{['OWNER', 'CEO'].includes(usuarioLogado.tipo) && <option value="CEO">CEO</option>}</select></div>
                    {['OWNER', 'CEO', 'SUPORTE'].includes(usuarioLogado?.tipo) && (
                        <div><label className="text-xs font-bold block mb-1.5 text-gray-500 dark:text-gray-400">Empresa</label><select className="w-full border dark:border-gray-600 rounded-xl p-3 text-sm bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 outline-none" value={formData.contaId} onChange={e=>setFormData({...formData,contaId:e.target.value,categoriaId:''})} disabled={!!usuarioEditando}><option value="">Selecione...</option>{empresas.map(e=><option key={e.id} value={e.id}>{e.razaoSocial||e.nomeFantasia}</option>)}</select></div>
                    )}
                </div>

                {tipoRequerEmail && <div><label className="text-xs font-bold block mb-1.5 text-gray-500 dark:text-gray-400">Email</label><input required type="email" className="w-full border dark:border-gray-600 rounded-xl p-3 text-sm bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200" value={formData.email} onChange={e=>setFormData({...formData,email:e.target.value})}/></div>}
                
                {tipoRequerNickname && <div className="grid grid-cols-2 gap-4"><div><label className="text-xs font-bold block mb-1.5 text-gray-500 dark:text-gray-400">Nickname</label><input required className="w-full border dark:border-gray-600 rounded-xl p-3 text-sm bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200" value={formData.nickname} onChange={e=>setFormData({...formData,nickname:e.target.value.toLowerCase().replace(/\s/g,'')})}/></div><div><label className="text-xs font-bold block mb-1.5 text-gray-500 dark:text-gray-400">CPF</label><input required className="w-full border dark:border-gray-600 rounded-xl p-3 text-sm bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200" value={formData.cpf} onChange={e=>setFormData({...formData,cpf:e.target.value})}/></div></div>}
                
                <div className="grid grid-cols-2 gap-4">
                    <div><label className="text-xs font-bold block mb-1.5 text-gray-500 dark:text-gray-400">Categoria</label><select className="w-full border dark:border-gray-600 rounded-xl p-3 text-sm bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 outline-none" value={formData.categoriaId} onChange={e=>setFormData({...formData,categoriaId:e.target.value})} disabled={!formData.contaId}><option value="">Selecione...</option>{categorias.filter(c=>c.contaId===formData.contaId).map(c=><option key={c.id} value={c.id}>{c.nome}</option>)}</select></div>
                    <div><label className="text-xs font-bold block mb-1.5 text-gray-500 dark:text-gray-400">Senha</label><input type="password" className="w-full border dark:border-gray-600 rounded-xl p-3 text-sm bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200" placeholder={usuarioEditando?"Opcional":"Mínimo 6 dígitos"} value={formData.senha} onChange={e=>setFormData({...formData,senha:e.target.value})}/></div>
                </div>
            </form>
        </Drawer>

        <Drawer isOpen={mostrarModalCategoria} onClose={()=>setMostrarModalCategoria(false)} title="Categorias de Usuário">
            <div className="space-y-4 px-5 py-2">
                <div className="flex gap-2"><input className="border rounded-lg p-2.5 flex-1 text-sm" placeholder="Nova categoria..." value={novaCategoria} onChange={e=>setNovaCategoria(e.target.value)}/><button onClick={handleCriarCategoria} className="bg-blue-600 text-white px-4 rounded-lg text-sm font-bold hover:bg-blue-700">{salvandoCategoria ? <Loader2 className="w-4 h-4 animate-spin"/> : 'Adicionar'}</button></div>
                <div className="space-y-2 max-h-[400px] overflow-y-auto">{categorias.length === 0 ? <p className="text-gray-400 text-center text-sm py-4">Nenhuma categoria.</p> : categorias.map(c=>(<div key={c.id} className="flex justify-between items-center border p-3 rounded-lg"><span className="text-sm font-medium">{c.nome}</span><button onClick={()=>handleDeletarCategoria(c)} className="text-red-500 hover:bg-red-50 p-1.5 rounded-md"><Trash2 size={14}/></button></div>))}</div>
            </div>
        </Drawer>

        <SimpleConfirmModal isOpen={!!confirmDeletarUsuario} onClose={()=>setConfirmDeletarUsuario(null)} onConfirm={executarDelecaoUsuario} titulo="Deletar Usuário" mensagem={`Tem certeza que deseja remover o usuário <b>${confirmDeletarUsuario?.nome}</b>?`} processando={processandoDelecao} />
        <SimpleConfirmModal isOpen={!!confirmDeletarCategoria} onClose={()=>setConfirmDeletarCategoria(null)} onConfirm={executarDelecaoCategoria} titulo="Deletar Categoria" mensagem="Confirmar exclusão da categoria?" processando={processandoDelecao} />
    </div>
  );
}