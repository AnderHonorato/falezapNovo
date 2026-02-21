import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contextos/AuthContext';
import {
  Building2, Plus, Edit2, Trash2, Search, Users, 
  CheckCircle, Loader2, Mail, Phone, Filter, 
  X, Download, FileSpreadsheet, ChevronDown, UserCog,
  Calendar, ShieldCheck, MessageSquare, AlertCircle
} from 'lucide-react';
import api from '../servicos/api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import './paginas_css/Empresas.css';

const ActionButton = ({ children, onClick, tooltip, colorClass = "text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700" }) => (
  <div className="relative group inline-flex">
    <button onClick={(e) => { e.stopPropagation(); onClick && onClick(e); }} className={`p-1.5 rounded-lg transition-colors ${colorClass}`}>{children}</button>
    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-[10px] font-bold rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-[9999] shadow-lg">{tooltip}<div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div></div>
  </div>
);

const Drawer = ({ isOpen, onClose, title, children, footer, width = 'sm:w-[380px]' }) => {
    if (!isOpen) return null;
    return (
        <>
            <div className="fixed inset-0 z-[250] bg-black/10 backdrop-blur-[1px] transition-opacity" onClick={onClose} />
            <div className={`fixed top-0 right-0 h-full w-full ${width} z-[260] bg-[#f8f9fa] dark:bg-[#0f172a] shadow-2xl border-l border-gray-200 dark:border-gray-700 flex flex-col animate-slide-in-right font-sans`}>
                <div className="flex-shrink-0 px-5 py-3 bg-white dark:bg-[#1e293b] border-b border-gray-200 dark:border-gray-700 flex items-center justify-between shadow-sm z-20">
                    <h2 className="text-base font-bold text-gray-800 dark:text-white leading-tight truncate pr-4">{title}</h2>
                    <button onClick={onClose} className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-500 flex-shrink-0"><X className="w-4 h-4" /></button>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar relative">
                    {children}
                </div>
                {footer && (
                    <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1e293b]">
                        {footer}
                    </div>
                )}
            </div>
        </>
    );
};

const SimpleConfirmModal = ({ isOpen, onClose, onConfirm, titulo, mensagem, processando }) => {
    if(!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black/20 z-[250] flex items-center justify-center backdrop-blur-[1px] animate-fade-in">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl max-w-sm w-full shadow-2xl border border-gray-200 dark:border-gray-700">
                <div className="text-center">
                    <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AlertCircle className="w-6 h-6 text-red-600" />
                    </div>
                    <h3 className="font-bold text-lg mb-2 text-gray-900 dark:text-white">{titulo}</h3>
                </div>
                <div className="text-sm mb-6 text-gray-600 dark:text-gray-400 text-center" dangerouslySetInnerHTML={{__html: mensagem}} />
                <div className="flex justify-end gap-2">
                    <button onClick={onClose} disabled={processando} className="flex-1 h-10 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 font-semibold text-xs transition-colors">Cancelar</button>
                    <button onClick={onConfirm} disabled={processando} className="flex-1 h-10 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold text-xs transition-all flex items-center justify-center gap-2 shadow-md">{processando ? <Loader2 className="w-3.5 h-3.5 animate-spin"/> : 'Confirmar'}</button>
                </div>
            </div>
        </div>
    );
}

export default function Empresas() {
  const { usuario, carregando: authCarregando } = useAuth();
  const navigate = useNavigate();
  const [empresas, setEmpresas] = useState([]);
  const [carregandoDados, setCarregandoDados] = useState(true);
  
  // Filtros Header
  const [busca, setBusca] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('');

  // Exportação
  const [menuExportarAberto, setMenuExportarAberto] = useState(false);
  const exportarRef = useRef(null);

  const [mostrarModal, setMostrarModal] = useState(false);
  const [empresaEditando, setEmpresaEditando] = useState(null);
  const [empresaVisualizando, setEmpresaVisualizando] = useState(null); 
  const [formData, setFormData] = useState({ nome: '', documento: '', telefone: '', email: '', tipo: 'EMPRESA' });
  const [salvando, setSalvando] = useState(false);
  const [confirmDeleteModal, setConfirmDeleteModal] = useState({ isOpen: false, empresaId: null, empresaNome: '' });
  const [processandoDelecao, setProcessandoDelecao] = useState(false);
  
  useEffect(() => {
    const handleClickOutside = (event) => {
        if (exportarRef.current && !exportarRef.current.contains(event.target)) setMenuExportarAberto(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Lógica de Bloqueio para não autorizados
  useEffect(() => { 
      if (!authCarregando) {
          // Permissão para: OWNER, CEO, SUPORTE
          if (usuario && ['OWNER', 'CEO', 'SUPORTE'].includes(usuario.tipo)) {
              carregarEmpresas();
          } else if (usuario) {
              navigate('/bloqueio', { 
                  state: { 
                      pagina: 'Gestão de Empresas', 
                      motivo: 'Apenas a diretoria e suporte possuem acesso ao cadastro de empresas.' 
                  } 
              });
          }
      }
  }, [usuario, authCarregando, navigate]);
  
  const carregarEmpresas = async () => { 
    setCarregandoDados(true); 
    try { 
        const r = await api.get('/empresas'); 
        // Verificação robusta de array
        let l = [];
        if (Array.isArray(r.data)) l = r.data;
        else if (r.data && Array.isArray(r.data.data)) l = r.data.data;
        else if (r.data && Array.isArray(r.data.empresas)) l = r.data.empresas;

        setEmpresas(l.map(e => ({
            ...e, 
            userCount: (e._count && typeof e._count.usuarios === 'number') ? e._count.usuarios : (e.usuarios?.length || 0) 
        }))); 
    } catch { 
        toast.error('Erro ao carregar empresas'); 
    } finally { 
        setCarregandoDados(false); 
    } 
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSalvando(true);
    const tId = toast.loading('Salvando...');
    try {
        const pl = { razaoSocial: formData.tipo==='EMPRESA'?formData.nome:null, nomeCompleto: formData.tipo==='INDIVIDUAL'?formData.nome:null, documento: formData.documento, telefone: formData.telefone, email: formData.email, tipo: formData.tipo, ativo: true };
        if(empresaEditando) await api.put(`/empresas/${empresaEditando.id}`, pl); else await api.post('/empresas', pl);
        toast.success('Salvo!', {id:tId}); setMostrarModal(false); resetForm(); await carregarEmpresas();
    } catch { toast.error('Erro', {id:tId}); } finally { setSalvando(false); }
  };

  const handleEditar = (e) => { setEmpresaEditando(e); setFormData({ nome: e.tipo==='EMPRESA'?(e.razaoSocial||''):(e.nomeCompleto||''), documento: e.documento||'', telefone: e.telefone||'', email: e.email||'', tipo: e.tipo||'EMPRESA' }); setMostrarModal(true); };
  const resetForm = () => { setFormData({ nome:'', documento:'', telefone:'', email:'', tipo:'EMPRESA' }); setEmpresaEditando(null); };
  const handleDeletar = (id) => { const e = empresas.find(x=>x.id===id); if(e) setConfirmDeleteModal({ isOpen:true, empresaId:id, empresaNome: e.razaoSocial||e.nomeCompleto }); };
  
  const executarDelecao = async () => {
      setProcessandoDelecao(true);
      const tId = toast.loading('Excluindo...');
      try {
          await api.delete(`/empresas/${confirmDeleteModal.empresaId}`);
          toast.success('Excluído', {id:tId});
          setConfirmDeleteModal({ isOpen: false, empresaId: null, empresaNome: '' });
          await carregarEmpresas();
      } catch (e) {
          toast.error('Erro ao excluir', {id:tId});
      } finally {
          setProcessandoDelecao(false);
      }
  };

  const handleGoToUsers = (empresa) => { navigate('/usuarios', { state: { filtroEmpresa: empresa.id, nomeEmpresa: empresa.razaoSocial || empresa.nomeFantasia } }); };
  const empresasFiltradas = empresas.filter(e => { const matchBusca = (e.razaoSocial||e.nomeCompleto||'').toLowerCase().includes(busca.toLowerCase()); const matchTipo = filtroTipo ? e.tipo === filtroTipo : true; const matchStatus = filtroStatus ? (filtroStatus==='ATIVO' ? e.ativo : !e.ativo) : true; return matchBusca && matchTipo && matchStatus; });
  const handleExportarExcel = () => { /* Mesma lógica anterior */ };
  const UserCountCell = ({ empresa, onClickDetails }) => ( <div className="relative group/usercell inline-block"><button onClick={(e) => { e.stopPropagation(); onClickDetails(empresa); }} className="flex items-center gap-1.5 text-xs font-bold text-gray-600 bg-gray-100 hover:bg-purple-100 hover:text-purple-700 px-2 py-1 rounded-lg transition-colors border border-transparent hover:border-purple-200"><Users className="w-3.5 h-3.5" /><span>{empresa.userCount} usuários</span></button></div> );

  return (
    <div className="dashboard-container flex flex-col h-full bg-[#f8f9fa] dark:bg-gray-900 relative overflow-hidden font-sans">
      
      {/* HEADER */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 shadow-sm z-10 shrink-0">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="flex flex-col gap-1">
                  <h1 className="text-xl font-bold flex gap-2 items-center text-gray-800 dark:text-white"><Building2 size={20} className="text-blue-600"/> Gestão de Empresas</h1>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Gerencie contas, cadastros e status.</p>
              </div>
              <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                  <div className="relative group"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 group-focus-within:text-blue-500 transition-colors"/><input placeholder="Buscar empresa..." value={busca} onChange={e=>setBusca(e.target.value)} className="pl-9 pr-4 py-1.5 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-full text-xs outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 w-40 transition-all dark:text-white"/></div>
                  <div className="relative"><Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400"/><select value={filtroStatus} onChange={e=>setFiltroStatus(e.target.value)} className="pl-9 pr-8 py-1.5 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-full text-xs outline-none cursor-pointer appearance-none hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors dark:text-white"><option value="">Status</option><option value="ATIVO">Ativa</option><option value="INATIVO">Inativa</option></select><ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none"/></div>
                  <div className="relative"><Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400"/><select value={filtroTipo} onChange={e=>setFiltroTipo(e.target.value)} className="pl-9 pr-8 py-1.5 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-full text-xs outline-none cursor-pointer appearance-none hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors dark:text-white"><option value="">Tipo</option><option value="EMPRESA">Jurídica</option><option value="INDIVIDUAL">Física</option></select><ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none"/></div>
                  <div className="h-6 w-px bg-gray-200 dark:bg-gray-700 mx-1 hidden md:block"></div>
                  <div className="relative" ref={exportarRef}><button onClick={() => setMenuExportarAberto(!menuExportarAberto)} className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 shadow-sm transition-all"><Download size={14} /> <span className="hidden sm:inline">Exportar</span></button>{menuExportarAberto && (<div className="absolute right-0 top-full mt-2 w-40 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 z-50 p-2 animate-scale-in"><button onClick={handleExportarExcel} className="w-full text-left px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg text-xs flex items-center gap-2 text-gray-700 dark:text-gray-200"><FileSpreadsheet size={14} className="text-green-600"/> Excel (CSV)</button></div>)}</div>
                  <button onClick={() => navigate('/usuarios')} className="flex items-center gap-1.5 px-3 py-1.5 border border-purple-200 bg-purple-50 text-purple-700 rounded-lg text-xs font-bold hover:bg-purple-100 transition-colors shadow-sm dark:bg-purple-900/20 dark:border-purple-800 dark:text-purple-300">
                      <UserCog size={14}/> <span className="hidden sm:inline">Gerenciar Usuários</span>
                  </button>
                  <button onClick={() => { resetForm(); setMostrarModal(true); }} className="px-4 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold shadow-md hover:bg-blue-700 flex items-center gap-1.5 transition-colors">
                      <Plus size={14}/> <span className="hidden sm:inline">Nova Empresa</span>
                  </button>
              </div>
          </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          <div className="max-w-[1600px] mx-auto space-y-6">
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                  <div className="overflow-x-auto custom-scrollbar">
                      <table className="w-full text-left">
                          <thead className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700"><tr><th className="p-4 text-[10px] font-bold text-gray-400 uppercase">Empresa</th><th className="p-4 text-[10px] font-bold text-gray-400 uppercase">Documento</th><th className="p-4 text-[10px] font-bold text-gray-400 uppercase">Contato</th><th className="p-4 text-[10px] font-bold text-gray-400 uppercase">Usuários</th><th className="p-4 text-[10px] font-bold text-gray-400 uppercase">Status</th><th className="p-4 text-right text-[10px] font-bold text-gray-400 uppercase">Ações</th></tr></thead>
                          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                              {empresasFiltradas.length === 0 ? (
                                  <tr><td colSpan={6} className="p-8 text-center text-gray-400 text-sm">Nenhuma empresa encontrada.</td></tr>
                              ) : empresasFiltradas.map(emp => (
                                  <tr key={emp.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                                      <td className="p-4">
                                          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setEmpresaVisualizando(emp)}>
                                              <div className="w-9 h-9 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/40 transition-colors">
                                                  <Building2 size={16}/>
                                              </div>
                                              <p className="text-sm font-bold text-gray-800 dark:text-gray-200 group-hover:text-blue-600 transition-colors">{emp.razaoSocial || emp.nomeCompleto}</p>
                                          </div>
                                      </td>
                                      <td className="p-4 font-mono text-xs text-gray-600 dark:text-gray-400">{emp.documento}</td>
                                      <td className="p-4 text-xs text-gray-600 dark:text-gray-400">
                                          <div>{emp.email}</div>
                                          <div className="text-gray-400 dark:text-gray-500">{emp.telefone}</div>
                                      </td>
                                      <td className="p-4"><UserCountCell empresa={emp} onClickDetails={handleGoToUsers} /></td>
                                      <td className="p-4">{emp.ativo ? <span className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 px-2 py-0.5 rounded text-[10px] font-bold border border-green-200 dark:border-green-800">ATIVA</span> : <span className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 px-2 py-0.5 rounded text-[10px] font-bold border border-red-200 dark:border-red-800">INATIVA</span>}</td>
                                      <td className="p-4 text-right">
                                          <div className="flex justify-end gap-1">
                                              <ActionButton onClick={()=>handleEditar(emp)} tooltip="Editar"><Edit2 size={14}/></ActionButton>
                                              <ActionButton onClick={()=>handleDeletar(emp.id)} tooltip="Excluir"><Trash2 size={14}/></ActionButton>
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

      {/* GAVETA VISUALIZAR - IDÊNTICA AO MODALMEUPERFIL */}
      <Drawer 
          isOpen={!!empresaVisualizando} 
          onClose={() => setEmpresaVisualizando(null)} 
          title="Perfil da Empresa"
      >
          {empresaVisualizando && (
              <>
                   <div className="h-24 w-full relative">
                        {/* Banner Estilo Perfil */}
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-cyan-500 overflow-hidden">
                            <Building2 className="absolute top-[-10%] right-[-10%] w-32 h-32 text-white opacity-10 -rotate-12"/>
                        </div>
                   </div>

                   <div className="px-5 pb-6 -mt-12 relative z-10">
                        {/* Avatar e Nome */}
                        <div className="flex flex-col items-center mb-6">
                            <div className="w-24 h-24 rounded-full p-1 bg-white dark:bg-gray-800 border-2 border-blue-100 dark:border-gray-700 relative z-10 shadow-xl">
                                <div className="w-full h-full rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
                                    <Building2 size={32}/>
                                </div>
                            </div>
                            <h3 className="text-xl font-bold mt-3 text-gray-900 dark:text-white text-center text-center leading-tight">
                                {empresaVisualizando.razaoSocial || empresaVisualizando.nomeCompleto}
                            </h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">{empresaVisualizando.email}</p>
                            <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase border bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800">
                                {empresaVisualizando.tipo}
                            </span>
                        </div>

                        {/* Grid de Informações */}
                        <div className="grid grid-cols-2 gap-3 w-full mb-6">
                            <div className="bg-gray-50 dark:bg-gray-700/30 p-3 rounded-xl border border-gray-100 dark:border-gray-700/50 hover:bg-white dark:hover:bg-gray-700/50 transition-colors shadow-sm">
                                <span className="text-[9px] font-bold text-gray-400 uppercase block mb-1">Telefone</span>
                                <div className="flex items-center gap-2">
                                    <Phone size={14} className="text-purple-500" />
                                    <p className="text-xs font-semibold text-gray-700 dark:text-gray-200">{empresaVisualizando.telefone || '-'}</p>
                                </div>
                            </div>
                            <div className="bg-gray-50 dark:bg-gray-700/30 p-3 rounded-xl border border-gray-100 dark:border-gray-700/50 hover:bg-white dark:hover:bg-gray-700/50 transition-colors shadow-sm">
                                <span className="text-[9px] font-bold text-gray-400 uppercase block mb-1">Criada em</span>
                                <div className="flex items-center gap-2">
                                    <Calendar size={14} className="text-blue-500" />
                                    <p className="text-xs font-semibold text-gray-700 dark:text-gray-200">{empresaVisualizando.criadoEm ? format(new Date(empresaVisualizando.criadoEm), 'dd/MM/yyyy') : '-'}</p>
                                </div>
                            </div>
                            <div className="bg-gray-50 dark:bg-gray-700/30 p-3 rounded-xl border border-gray-100 dark:border-gray-700/50 hover:bg-white dark:hover:bg-gray-700/50 transition-colors shadow-sm col-span-2">
                                <span className="text-[9px] font-bold text-gray-400 uppercase block mb-1">Documento</span>
                                <div className="flex items-center gap-2">
                                    <ShieldCheck size={14} className="text-green-500" />
                                    <p className="text-xs font-semibold text-gray-700 dark:text-gray-200 font-mono">{empresaVisualizando.documento}</p>
                                </div>
                            </div>
                        </div>

                        {/* Estatísticas */}
                        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-800/50 p-4 rounded-2xl border border-blue-100 dark:border-gray-700 relative overflow-hidden flex items-center justify-between">
                            <div>
                                <span className="text-[9px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-1 block">Total de Usuários</span>
                                <p className="text-2xl font-bold text-gray-800 dark:text-white">{empresaVisualizando.userCount}</p>
                            </div>
                            <div className="p-3 bg-white dark:bg-gray-700/50 rounded-full text-blue-500">
                                <Users size={24}/>
                            </div>
                        </div>
                   </div>
              </>
          )}
      </Drawer>

      {/* GAVETA EDITAR/CRIAR */}
      <Drawer 
          isOpen={mostrarModal} 
          onClose={()=>{setMostrarModal(false);resetForm()}} 
          title={empresaEditando ? `Editar: ${empresaEditando.razaoSocial || empresaEditando.nomeCompleto}` : "Nova Empresa"}
          width="sm:w-[450px]"
          footer={
              <div className="flex gap-3">
                  <button type="button" onClick={()=>{setMostrarModal(false);resetForm()}} className="flex-1 h-10 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-600 hover:bg-gray-50 font-bold dark:text-gray-300 dark:hover:bg-gray-700">Cancelar</button>
                  <button onClick={handleSubmit} className="flex-1 h-10 bg-blue-600 text-white rounded-lg text-sm font-bold shadow-md hover:bg-blue-700 transition-colors">Salvar</button>
              </div>
          }
      >
          <form className="space-y-4">
              <div><label className="text-xs font-bold block mb-1 text-gray-500 dark:text-gray-400">Tipo</label><select value={formData.tipo} onChange={e=>setFormData({...formData, tipo:e.target.value})} className="w-full border dark:border-gray-600 rounded-lg p-2.5 text-sm bg-white dark:bg-gray-800 outline-none text-gray-800 dark:text-gray-200"><option value="EMPRESA">Jurídica</option><option value="INDIVIDUAL">Física</option></select></div>
              <div><label className="text-xs font-bold block mb-1 text-gray-500 dark:text-gray-400">{formData.tipo==='EMPRESA'?'Razão Social':'Nome'}</label><input value={formData.nome} onChange={e=>setFormData({...formData, nome:e.target.value})} className="w-full border dark:border-gray-600 rounded-lg p-2.5 text-sm bg-white dark:bg-gray-800 outline-none text-gray-800 dark:text-gray-200" required/></div>
              <div><label className="text-xs font-bold block mb-1 text-gray-500 dark:text-gray-400">Documento</label><input value={formData.documento} onChange={e=>setFormData({...formData, documento:e.target.value})} className="w-full border dark:border-gray-600 rounded-lg p-2.5 text-sm bg-white dark:bg-gray-800 outline-none text-gray-800 dark:text-gray-200" required/></div>
              <div className="grid grid-cols-2 gap-4">
                  <div><label className="text-xs font-bold block mb-1 text-gray-500 dark:text-gray-400">Email</label><input type="email" value={formData.email} onChange={e=>setFormData({...formData, email:e.target.value})} className="w-full border dark:border-gray-600 rounded-lg p-2.5 text-sm bg-white dark:bg-gray-800 outline-none text-gray-800 dark:text-gray-200" required/></div>
                  <div><label className="text-xs font-bold block mb-1 text-gray-500 dark:text-gray-400">Telefone</label><input value={formData.telefone} onChange={e=>setFormData({...formData, telefone:e.target.value})} className="w-full border dark:border-gray-600 rounded-lg p-2.5 text-sm bg-white dark:bg-gray-800 outline-none text-gray-800 dark:text-gray-200"/></div>
              </div>
          </form>
      </Drawer>

      <SimpleConfirmModal 
          isOpen={confirmDeleteModal.isOpen} 
          onClose={()=>setConfirmDeleteModal({isOpen:false})} 
          onConfirm={()=>{/*executarDelecao*/}} 
          titulo="Excluir Empresa" 
          mensagem={`Confirma exclusão da empresa <b>${confirmDeleteModal.empresaNome}</b>?`} 
      />
    </div>
  );
}