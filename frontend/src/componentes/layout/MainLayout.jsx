import { useState, useEffect, useRef } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contextos/AuthContext';
import { useTema } from '../../contextos/TemaContexto';
import {
  MessageSquare, Users, Building2, LogOut, Smartphone, X,
  ArrowLeft, RefreshCw, ZoomIn, ZoomOut, Moon, Sun, UserCircle, 
  ChevronDown, BarChart3, Clock, Coffee, CircleDot,
  Wifi, WifiOff, LifeBuoy, ChevronUp, BellRing,
  MessageCircle, Menu, Brain, Sparkles, CheckCheck,
  Crown, ShieldCheck, Shield, Tag, User, Eye, EyeOff,
  Search, LayoutGrid, Settings, LayoutDashboard, Palette,
  ChevronRight, Quote, Zap, Headset, Briefcase
} from 'lucide-react';
import api from '../../servicos/api';
import StatusIndicador from '../StatusIndicador';
import SeletorStatus from '../SeletorStatus';
import { useStatus } from '../../hooks/useStatus';
import ModalMeuPerfil from '../ModalMeuPerfil';
import DashboardTemas from '../dashboards/DashboardTemas';
import toast from 'react-hot-toast';
import Modal from '../comum/Modal';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import './MainLayout.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const CORES = {
  light: {
    header: '#ffffff', 
    text: '#333333',
    button: '#f9f9f9',
    hover: '#f0f0f0',
    border: '#e0e0e0'
  },
  dark: {
    header: '#1f1f1f',
    text: '#f5f5f5',
    button: '#374151',
    hover: '#4b5563',
    border: '#333333'
  }
};

function throttle(func, limit) {
  let inThrottle;
  return function() {
    const args = arguments;
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  }
}

export default function MainLayout() {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const { status: statusFromHook, mudarStatus } = useStatus(usuario?.id);
  const statusVisual = statusFromHook === 'carregando' ? 'disponivel' : statusFromHook;

  const { tema, temaEscuro, setTemaEscuro } = useTema();
  
  const [mostrarModalTemas, setMostrarModalTemas] = useState(false);
  const [temasConfig, setTemasConfig] = useState(() => {
    try {
        const salvo = localStorage.getItem('falezap_temas_config');
        return salvo ? JSON.parse(salvo) : { bgFundo: '', bgCard: '' };
    } catch (e) {
        return { bgFundo: '', bgCard: '' };
    }
  });

  const atualizarTemas = (novoTema) => {
    setTemasConfig(novoTema);
    localStorage.setItem('falezap_temas_config', JSON.stringify(novoTema));
  };

  const [notificacoesBlog, setNotificacoesBlog] = useState([]);
  const [mostrarLidas, setMostrarLidas] = useState(false);
  const [mostrarAvisoNotificacao, setMostrarAvisoNotificacao] = useState(false);
  
  const [mostrarMenuUsuario, setMostrarMenuUsuario] = useState(false);
  const [mostrarMenuWhatsappStatus, setMostrarMenuWhatsappStatus] = useState(false);
  const [mostrarMenuBlogStatus, setMostrarMenuBlogStatus] = useState(false);
  const [mostrarMenuGerenciar, setMostrarMenuGerenciar] = useState(false);
  const [mostrarMenuFerramentas, setMostrarMenuFerramentas] = useState(false);
  const [mostrarMenuMobile, setMostrarMenuMobile] = useState(false);
  
  const [buscaExpandida, setBuscaExpandida] = useState(false);
  const inputBuscaRef = useRef(null);

  const menuHoverTimer = useRef(null);
  const whatsappHoverTimer = useRef(null);
  const blogHoverTimer = useRef(null);
  const gerenciarHoverTimer = useRef(null);
  
  const menuUsuarioRef = useRef(null);
  const menuWhatsappRef = useRef(null);
  const menuBlogRef = useRef(null);
  const gerenciarRef = useRef(null);
  const ferramentasRef = useRef(null);
  const menuMobileRef = useRef(null);

  const [whatsappConectados, setWhatsappConectados] = useState([]);
  const [modalPerfilAberto, setModalPerfilAberto] = useState(false);
  const [confirmLogoutModal, setConfirmLogoutModal] = useState(false);
  const [escalaZoom, setEscalaZoom] = useState(1.0);
  const [sincronizando, setSincronizando] = useState(false);
  
  const [notificacaoStatus, setNotificacaoStatus] = useState(null);
  const [menuVisivel, setMenuVisivel] = useState(true); 
  
  const notificacoesVisualizadas = useRef(new Set());
  const [paginaAtual, setPaginaAtual] = useState('Dashboard');

  const BLOG_LIDOS_KEY = 'falezap_blog_lidos';
  const [blogLidos, setBlogLidos] = useState(() => {
    try {
      const lidos = localStorage.getItem(BLOG_LIDOS_KEY);
      return lidos ? JSON.parse(lidos) : [];
    } catch (e) { return []; }
  });
  
  const [configuracaoStatus, setConfiguracaoStatus] = useState(null);

  // --- HELPERS DE ESTILO ---

  // 1. Estilo "Badge/Pílula" (Usado no Dropdown)
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

  // 2. Estilo "Texto Simples" (Usado no Cabeçalho)
  const getRoleTextColor = (tipo) => {
    switch (tipo) {
        case 'OWNER': return 'text-amber-600 dark:text-amber-400';
        case 'CEO': return 'text-orange-600 dark:text-orange-400';
        case 'SUPORTE': return 'text-cyan-600 dark:text-cyan-400';
        case 'ADMIN': return 'text-blue-600 dark:text-blue-400';
        case 'ADMIN_EMPRESA': return 'text-blue-600 dark:text-blue-400';
        default: return 'text-gray-500 dark:text-gray-400';
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

  const getStatusGlowStyle = (status) => {
    switch (status) {
      case 'disponivel': return 'bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.8)] animate-pulse';
      case 'ausente': return 'bg-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.8)]'; 
      case 'almoco': return 'bg-orange-500 shadow-[0_0_12px_rgba(249,115,22,0.8)]'; 
      case 'reuniao': return 'bg-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.8)]'; 
      case 'offline': default: return 'bg-gray-400 shadow-none'; 
    }
  };

  useEffect(() => {
    if (usuario?.configuracaoHorarios) setConfiguracaoStatus(usuario.configuracaoHorarios);
    else { const salvo = localStorage.getItem(`status_config_${usuario?.id}`); if (salvo) setConfiguracaoStatus(JSON.parse(salvo)); }
  }, [usuario]);

  useEffect(() => {
    if (!configuracaoStatus || !configuracaoStatus.ativo) return;
    const verificarStatusAutomatico = () => {
      const agora = new Date();
      const minutosAtuais = agora.getHours() * 60 + agora.getMinutes();
      const [hIni, mIni] = configuracaoStatus.inicio.split(':').map(Number);
      const inicioMin = hIni * 60 + mIni;
      const [hFim, mFim] = configuracaoStatus.fim.split(':').map(Number);
      const fimMin = hFim * 60 + mFim;
      if (minutosAtuais >= inicioMin && minutosAtuais < fimMin) {
        if (statusVisual !== configuracaoStatus.tipo) {
          mudarStatus(configuracaoStatus.tipo);
          toast(`Status alterado automaticamente para: ${configuracaoStatus.tipo}`, { icon: '⏰' });
        }
      }
    };
    verificarStatusAutomatico();
    const interval = setInterval(verificarStatusAutomatico, 30000);
    return () => clearInterval(interval);
  }, [configuracaoStatus, statusVisual, mudarStatus]);
  
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuUsuarioRef.current && !menuUsuarioRef.current.contains(event.target)) setMostrarMenuUsuario(false);
      if (menuWhatsappRef.current && !menuWhatsappRef.current.contains(event.target)) setMostrarMenuWhatsappStatus(false);
      if (menuBlogRef.current && !menuBlogRef.current.contains(event.target)) { setMostrarMenuBlogStatus(false); setMostrarAvisoNotificacao(false); }
      if (gerenciarRef.current && !gerenciarRef.current.contains(event.target)) setMostrarMenuGerenciar(false);
      if (ferramentasRef.current && !ferramentasRef.current.contains(event.target)) setMostrarMenuFerramentas(false);
      if (menuMobileRef.current && !menuMobileRef.current.contains(event.target)) setMostrarMenuMobile(false);
      if (inputBuscaRef.current && !inputBuscaRef.current.contains(event.target) && buscaExpandida) { setBuscaExpandida(false); }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [buscaExpandida]);

  useEffect(() => {
    setMostrarMenuMobile(false);
    setMostrarMenuUsuario(false);
    setMostrarMenuBlogStatus(false);
  }, [location.pathname]);

  const marcarBlogComoLido = async (postId) => {
    setBlogLidos(prevLidos => {
      let novosLidos = [...prevLidos];
      let mudou = false;
      if (postId === 'todos') {
        notificacoesBlog.forEach(n => { if (!novosLidos.includes(n.id)) { novosLidos.push(n.id); mudou = true; } });
        setNotificacoesBlog(prev => prev.map(n => ({ ...n, lida: true })));
      } else if (postId && !novosLidos.includes(postId)) {
        novosLidos.push(postId); mudou = true;
        setNotificacoesBlog(prev => prev.map(n => n.id === postId ? { ...n, lida: true } : n));
      }
      if (mudou) { try { localStorage.setItem(BLOG_LIDOS_KEY, JSON.stringify(novosLidos)); } catch (e) {} return novosLidos; }
      return prevLidos;
    });
    try {
        if (postId === 'todos') {
            const idsParaLer = notificacoesBlog.filter(n => !n.lida).map(n => n.id);
            if(idsParaLer.length > 0) await Promise.all(idsParaLer.map(id => api.post(`/blog/posts/${id}/ler`)));
        } else { await api.post(`/blog/posts/${postId}/ler`); }
    } catch (e) {}
  };

  const throttledActivityPing = useRef(throttle(async () => { try { if (usuario?.id) await api.post(`/status/${usuario.id}/atividade`); } catch (error) {} }, 60000)).current;

  useEffect(() => {
    const handleActivity = () => throttledActivityPing();
    const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart'];
    events.forEach(event => window.addEventListener(event, handleActivity));
    handleActivity();
    return () => events.forEach(event => window.removeEventListener(event, handleActivity));
  }, [throttledActivityPing]);

  useEffect(() => {
    if (usuario) {
      carregarWhatsappConectados(); carregarNotificacoesBlog(); iniciarMonitoramentoStatus();
      const intervalBlog = setInterval(carregarNotificacoesBlog, 60000);
      return () => clearInterval(intervalBlog);
    }
  }, [usuario]);

  useEffect(() => { if (usuario?.id) atualizarPaginaAtual(); }, [location.pathname, usuario?.id]);

  const exibirNotificacao = (mudanca) => {
    const chaveNotificacao = `${mudanca.usuarioId}-${mudanca.novoStatus}-${new Date(mudanca.horario).getTime()}`;
    if (notificacoesVisualizadas.current.has(chaveNotificacao)) return;
    notificacoesVisualizadas.current.add(chaveNotificacao);
    setNotificacaoStatus(mudanca);
    setTimeout(() => setNotificacaoStatus(null), 15000);
  };

  const iniciarMonitoramentoStatus = () => {
    const runPoll = async () => { 
      try {
        if (!usuario) return; 
        const response = await api.get('/status/mudancas-recentes');
        if (response.data?.mudancas && response.data.mudancas.length > 0) {
          const mudancasDaMesmaEmpresa = response.data.mudancas.filter(m => m.contaId === usuario.contaId && m.usuarioId !== usuario.id);
          mudancasDaMesmaEmpresa.forEach((mudanca) => exibirNotificacao(mudanca));
        }
      } catch (error) {}
    };
    runPoll(); 
    const interval = setInterval(runPoll, 10000); 
    return () => clearInterval(interval);
  };

  const atualizarPaginaAtual = async () => { try { const caminhoReal = location.pathname; const nomePagina = obterNomePagina(caminhoReal); setPaginaAtual(nomePagina); if (!usuario?.id) return; await api.post('/usuarios/atualizar-pagina', { usuarioId: usuario.id, paginaAtual: caminhoReal }); } catch (error) {} };

  const obterNomePagina = (pathname) => {
    if (pathname.includes('/ia-aprendizado')) return 'IA Aprendizado';
    if (pathname.includes('/mensagens')) return 'Conversas';
    if (pathname.includes('/chat-interno')) return 'Chat Interno';
    if (pathname.includes('/analytics')) return 'Analytics';
    if (pathname.includes('/whatsapp')) return 'WhatsApp';
    if (pathname.includes('/equipe')) return 'Colaboradores';
    if (pathname.includes('/usuarios')) return 'Usuários';
    if (pathname.includes('/empresas')) return 'Empresas';
    if (pathname.includes('/blog')) return 'Blog';
    if (pathname.includes('/suporte')) return 'Suporte';
    if (pathname === '/dashboard' || pathname === '/') return 'FaleZap';
    return 'Navegando';
  };

  const carregarNotificacoesBlog = async () => {
    try {
      const response = await api.get('/blog/posts-recentes');
      const posts = response.data?.posts || [];
      const lidosLocal = blogLidos; 
      const todasNotificacoes = posts.map(post => {
          const lidoBackend = post.lido === true; const lidoLocal = lidosLocal.includes(post.id);
          return { id: post.id, titulo: post.titulo, resumo: post.resumo || 'Nova publicação', slug: post.slug, data: post.criadoEm || post.data, imagemCapa: post.imagemCapa, lida: lidoBackend || lidoLocal };
      });
      setNotificacoesBlog(todasNotificacoes);
      const temNaoLida = todasNotificacoes.some(n => !n.lida);
      if (temNaoLida && !sessionStorage.getItem('avisoNotificacaoMostrado')) { setMostrarAvisoNotificacao(true); sessionStorage.setItem('avisoNotificacaoMostrado', 'true'); setTimeout(() => setMostrarAvisoNotificacao(false), 8000); }
    } catch (error) { setNotificacoesBlog([]); }
  };

  const carregarWhatsappConectados = async () => { try { const response = await api.get('/whatsapp/conectados'); setWhatsappConectados(Array.isArray(response.data?.clientes) ? response.data.clientes : []); } catch (error) { setWhatsappConectados([]); } };

  const handleLogout = (e) => { if (e) e.stopPropagation(); setMostrarMenuUsuario(false); setConfirmLogoutModal(true); };
  const confirmarLogout = () => { setConfirmLogoutModal(false); logout(); navigate('/login', { replace: true }); };
  const handleTrocarUsuario = (e) => { if (e) e.stopPropagation(); setMostrarMenuUsuario(false); logout(); navigate('/login', { replace: true }); };

  const isDashboard = location.pathname === '/dashboard' || location.pathname === '/';
  const isMensagens = location.pathname.includes('/mensagens');

  const handleZoomIn = () => { if (escalaZoom < 1.5) setEscalaZoom(prev => Math.min(prev + 0.1, 1.5)); };
  const handleZoomOut = () => { if (escalaZoom > 0.7) setEscalaZoom(prev => Math.max(prev - 0.1, 0.7)); };
  const handleResetZoom = () => setEscalaZoom(1.0);

  const handleToggleTema = () => { setTemaEscuro(!temaEscuro); toast.success(!temaEscuro ? '🌙 Tema escuro ativado!' : '☀️ Tema claro ativado!', { duration: 2000 }); };

  const handleSincronizar = async () => { if (sincronizando) return; setSincronizando(true); toast.loading('Sincronizando...', { id: 'sync' }); try { const instancia = parseInt(localStorage.getItem('instanciaAtiva') || '1'); const response = await api.post('/whatsapp/sincronizar-historico-completo', { instancia }); if (response.data.sucesso) { toast.success(`✅ Sincronizado!`, { id: 'sync' }); window.dispatchEvent(new CustomEvent('sincronizar-mensagens')); setTimeout(() => window.location.reload(), 2000); } } catch (erro) { toast.error('❌ Erro', { id: 'sync' }); } finally { setTimeout(() => setSincronizando(false), 3000); } };

  const handleGerenciarEnter = () => { clearTimeout(gerenciarHoverTimer.current); setMostrarMenuGerenciar(true); };
  const handleGerenciarLeave = () => { gerenciarHoverTimer.current = setTimeout(() => setMostrarMenuGerenciar(false), 300); };
  const handleWhatsappEnter = () => { clearTimeout(whatsappHoverTimer.current); setMostrarMenuWhatsappStatus(true); };
  const handleWhatsappLeave = () => { whatsappHoverTimer.current = setTimeout(() => setMostrarMenuWhatsappStatus(false), 300); };
  const handleBlogEnter = () => { clearTimeout(blogHoverTimer.current); setMostrarMenuBlogStatus(true); };
  const handleBlogLeave = () => { blogHoverTimer.current = setTimeout(() => setMostrarMenuBlogStatus(false), 300); };

  const naoLidasCount = notificacoesBlog.filter(n => !n.lida).length;
  const notificacoesExibidas = mostrarLidas ? notificacoesBlog : notificacoesBlog.filter(n => !n.lida);

  const coresTema = temaEscuro ? CORES.dark : CORES.light;

  const NavButton = ({ path, icon: Icon, label }) => {
    const isActive = location.pathname.includes(path);
    return (
      <button onClick={() => navigate(path)} title={label} className={`relative px-3 py-1.5 rounded-full flex items-center gap-2 transition-all duration-200 group ${isActive ? 'bg-gray-100 text-gray-900 font-bold dark:bg-white/10 dark:text-white' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-white'}`}>
        <Icon className={`w-4 h-4 transition-transform duration-300 ${isActive ? 'scale-105' : 'group-hover:scale-105'}`} strokeWidth={isActive ? 2.5 : 2} />
        <span className="text-xs tracking-wide">{label}</span>
      </button>
    );
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 relative ${temaEscuro ? 'dark' : ''} main-layout-container`} style={{ backgroundColor: temasConfig.bgFundo ? temasConfig.bgFundo : (temaEscuro ? '#0f172a' : '#ebebeb') }}>
      
      {!menuVisivel && (
        <div className="fixed top-0 left-0 w-full h-6 z-50 flex justify-center group pointer-events-none">
          <div className="w-full h-full pointer-events-auto cursor-pointer absolute top-0" onClick={() => setMenuVisivel(true)}></div>
          <button onClick={() => setMenuVisivel(true)} className="pointer-events-auto absolute top-2 mt-1 transform -translate-y-[150%] opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 ease-in-out bg-white dark:bg-slate-800 shadow-md border rounded-full px-5 py-2 flex items-center gap-2 text-gray-700 dark:text-white" style={{ borderColor: tema.borda }}><ChevronDown className="w-4 h-4" /><span className="text-xs font-bold">Mostrar Menu</span></button>
        </div>
      )}

      {/* --- HEADER --- */}
      <header className={`border-b sticky top-0 z-40 transition-all duration-300 w-full ${menuVisivel ? 'h-14 opacity-100' : 'h-0 opacity-0 overflow-hidden border-none'}`} style={{ backgroundColor: coresTema.header, borderColor: coresTema.border, boxShadow: menuVisivel ? '0 1px 2px rgba(0,0,0,0.05)' : 'none', color: coresTema.text }}>
        <div className="w-full px-4 h-full max-w-[1920px] mx-auto"> 
          <div className="flex justify-between items-center h-full gap-4">
            
            <div className="flex items-center gap-6">
                <button onClick={() => setMostrarMenuMobile(!mostrarMenuMobile)} className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">{mostrarMenuMobile ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}</button>
                <div className="flex items-center gap-2.5 cursor-pointer group" onClick={() => navigate('/dashboard')}>
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-indigo-600 shadow-md transition-transform group-hover:scale-105"><MessageSquare className="w-4 h-4 text-white" strokeWidth={2.5} /></div>
                    <div className="hidden md:flex flex-col"><h1 className="text-sm font-bold tracking-tight uppercase leading-none" style={{ color: coresTema.text }}>FaleZap</h1><span className="text-[9px] font-semibold tracking-wider opacity-60" style={{ color: coresTema.text }}>WORKSPACE</span></div>
                </div>
                <div className="hidden lg:block h-6 w-[1px] bg-gray-200 dark:bg-white/10 mx-1"></div>
                <div className="hidden lg:flex items-center gap-1">
                    <NavButton path="/dashboard" icon={LayoutDashboard} label="Dashboard" />
                    <NavButton path="/mensagens" icon={MessageSquare} label="Conversas" />
                    <NavButton path="/chat-interno" icon={MessageCircle} label="Interno" />
                    <NavButton path="/analytics" icon={BarChart3} label="Análises" />
                    <NavButton path="/blog" icon={Sparkles} label="Novidades" />
                </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <div className="flex items-center gap-1 pr-3 border-r border-gray-200 dark:border-white/10">
                <div className={`flex items-center justify-end transition-width duration-300 ease-in-out ${buscaExpandida ? 'w-64 mr-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700' : 'w-8 bg-transparent hover:bg-gray-100 dark:hover:bg-white/10 border border-transparent'} rounded-md overflow-hidden`} ref={inputBuscaRef}>
                   <input id="global-search" onBlur={() => { if(!document.getElementById('global-search').value) setBuscaExpandida(false); }} className={`border-none outline-none text-xs h-8 text-gray-700 dark:text-slate-200 placeholder-gray-400 transition-opacity duration-300 px-3 bg-transparent ${buscaExpandida ? 'opacity-100 w-full' : 'opacity-0 w-0 hidden'}`} placeholder="Buscar no sistema..." />
                   <button onClick={() => { setBuscaExpandida(true); setTimeout(() => document.getElementById('global-search')?.focus(), 100); }} className={`w-8 h-8 flex items-center justify-center shrink-0 text-gray-500 dark:text-gray-400`} title="Buscar (Ctrl+K)"><Search size={16} /></button>
                </div>

                {(usuario?.tipo === 'OWNER' || usuario?.tipo === 'ADMIN_EMPRESA') && (
                  <div className="relative" onMouseEnter={handleGerenciarEnter} onMouseLeave={handleGerenciarLeave} ref={gerenciarRef}>
                    <button title="Gerenciar Sistema" className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:bg-gray-100 dark:hover:bg-white/10 text-gray-600 dark:text-gray-300"><LayoutGrid className="w-4 h-4" strokeWidth={2} /></button>
                    {mostrarMenuGerenciar && (
                      <div className="absolute right-0 top-full mt-2 w-56 rounded-md shadow-lg border border-gray-200 dark:border-slate-700 overflow-hidden z-[60] animate-slide-down bg-white dark:bg-slate-800 p-1">
                           {(usuario?.tipo === 'OWNER' || usuario?.tipo === 'ADMIN_EMPRESA' || usuario?.podeGerenciarConexoes) && (<button onClick={() => { navigate('/whatsapp'); setMostrarMenuGerenciar(false); }} className="w-full px-3 py-2 text-left text-xs font-semibold flex items-center gap-3 rounded hover:bg-gray-100 dark:hover:bg-slate-700/50 group text-gray-700 dark:text-slate-200"><Smartphone className="w-4 h-4 text-gray-400 group-hover:text-green-600 transition-colors" /><span>Conexões</span></button>)}
                           {(usuario?.tipo === 'OWNER' || usuario?.tipo === 'CEO' || usuario?.tipo === 'ADMIN_EMPRESA' || usuario?.tipo === 'ADMIN') && (<button onClick={() => { navigate('/usuarios'); setMostrarMenuGerenciar(false); }} className="w-full px-3 py-2 text-left text-xs font-semibold flex items-center gap-3 rounded hover:bg-gray-100 dark:hover:bg-slate-700/50 group text-gray-700 dark:text-slate-200"><Users className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition-colors" /><span>Usuários</span></button>)}
                           {(usuario?.tipo === 'OWNER' || usuario?.tipo === 'CEO') && (<button onClick={() => { navigate('/empresas'); setMostrarMenuGerenciar(false); }} className="w-full px-3 py-2 text-left text-xs font-semibold flex items-center gap-3 rounded hover:bg-gray-100 dark:hover:bg-slate-700/50 group text-gray-700 dark:text-slate-200"><Building2 className="w-4 h-4 text-gray-400 group-hover:text-orange-600 transition-colors" /><span>Empresas</span></button>)}
                           {['OWNER', 'CEO', 'SUPORTE'].includes(usuario?.tipo) && (<button onClick={() => { navigate('/ia-aprendizado'); setMostrarMenuGerenciar(false); }} className="w-full px-3 py-2 text-left text-xs font-semibold flex items-center gap-3 rounded hover:bg-gray-100 dark:hover:bg-slate-700/50 group text-gray-700 dark:text-slate-200"><Brain className="w-4 h-4 text-gray-400 group-hover:text-purple-600 transition-colors" /><span>IA Aprendizado</span></button>)}
                      </div>
                    )}
                  </div>
                )}

                {(usuario?.tipo === 'OWNER' || usuario?.podeGerenciarConexoes) && (
                  <div className="relative" onMouseEnter={handleWhatsappEnter} onMouseLeave={handleWhatsappLeave} ref={menuWhatsappRef}>
                      <button title="Status Conexões" className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:bg-gray-100 dark:hover:bg-white/10 group relative text-gray-600 dark:text-gray-300">
                          {whatsappConectados.length > 0 ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4 text-red-600" />}
                          {whatsappConectados.length > 0 && <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-green-600 rounded-full border border-white dark:border-slate-800"></span>}
                      </button>
                      {mostrarMenuWhatsappStatus && (
                          <div className="absolute right-0 top-full mt-2 w-72 rounded-md shadow-lg border border-gray-100 dark:border-slate-700 overflow-hidden z-[60] animate-slide-down bg-white dark:bg-slate-800">
                              <div className="p-3 border-b border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-800"><p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-slate-400">WhatsApp Conectados</p></div>
                              <div className="p-2 max-h-60 overflow-y-auto min-h-[60px]">
                                  {whatsappConectados.length > 0 ? (
                                      whatsappConectados.map((w, i) => (<div key={i} className="flex items-center justify-between p-2.5 rounded hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors"><div className="flex items-center gap-3"><div className="w-2 h-2 rounded-full bg-green-500"></div><span className="text-sm font-medium dark:text-slate-200">{w.nome || w.numero}</span></div><Smartphone className="w-4 h-4 text-gray-400" /></div>))
                                  ) : <p className="p-4 text-center text-xs text-gray-400 italic">Nenhum dispositivo conectado.</p>}
                              </div>
                          </div>
                      )}
                  </div>
                )}
                
                <div className="relative" onMouseEnter={handleBlogEnter} onMouseLeave={handleBlogLeave} ref={menuBlogRef}>
                    <button title="Notificações" onClick={() => setMostrarMenuBlogStatus(!mostrarMenuBlogStatus)} className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:bg-gray-100 dark:hover:bg-white/10 group relative text-gray-600 dark:text-gray-300">
                        <BellRing className={`w-4 h-4 transition-colors ${naoLidasCount > 0 ? 'text-orange-600 animate-ring' : ''}`} />
                        {naoLidasCount > 0 && <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-600 rounded-full border border-white dark:border-slate-800"></span>}
                    </button>
                    {mostrarAvisoNotificacao && (
                      <div className="absolute top-10 right-0 w-max max-w-[200px] bg-indigo-600 text-white p-2.5 rounded-lg shadow-xl animate-fade-enter z-50 pointer-events-none origin-top-right">
                          <div className="absolute -top-1 right-3 w-3 h-3 bg-indigo-600 rotate-45"></div><p className="text-xs font-bold text-center">🔔 Você tem novas notificações!</p>
                      </div>
                    )}
                    {mostrarMenuBlogStatus && (
                      <div className="absolute right-0 top-full mt-2 w-80 rounded-md shadow-lg border border-gray-100 dark:border-slate-700 overflow-hidden z-[60] animate-slide-down bg-white dark:bg-slate-800">
                          <div className="p-2.5 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center bg-gray-50 dark:bg-slate-800">
                              <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-slate-400">Notificações</p>
                              <div className="flex gap-2 items-center">
                                  <button onClick={() => setMostrarLidas(!mostrarLidas)} className={`flex items-center gap-1.5 px-2 py-1 rounded transition-colors ${mostrarLidas ? 'bg-indigo-100 text-indigo-600' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'}`} title={mostrarLidas ? "Ocultar lidas" : "Ver lidas"}>
                                      {mostrarLidas ? <Eye size={12}/> : <EyeOff size={12}/>}<span className="text-[10px] font-bold">{mostrarLidas ? 'Ocultar' : 'Ver lidas'}</span>
                                  </button>
                                  <button onClick={() => marcarBlogComoLido('todos')} className="flex items-center gap-1.5 text-[10px] font-bold text-green-600 hover:text-green-700 hover:bg-green-50 px-2 py-1 rounded transition-colors" title="Marcar todas como lidas"><CheckCheck size={12}/><span>Ler todas</span></button>
                              </div>
                          </div>
                          <div className="max-h-[350px] overflow-y-auto p-1 bg-gray-50/50 dark:bg-slate-900/50">
                              {notificacoesExibidas.length > 0 ? (
                                  notificacoesExibidas.slice(0, 5).map((notif) => (
                                      <div key={notif.id} onClick={() => { marcarBlogComoLido(notif.id); navigate(`/blog/post/${notif.slug}`); }} className={`relative min-h-[5rem] mx-2 my-2 rounded-lg cursor-pointer group overflow-hidden shadow-sm transition-transform hover:scale-[1.02] border border-gray-200 dark:border-gray-700 ${notif.lida ? 'opacity-70 grayscale-[0.5]' : ''}`}>
                                          <div className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110" style={{ backgroundImage: `url(${notif.imagemCapa ? `${API_URL}${notif.imagemCapa.startsWith('/')?'':'/'}${notif.imagemCapa}` : 'https://images.unsplash.com/photo-1557683316-973673baf926?auto=format&fit=crop&w=500&q=60'})` }} />
                                          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-black/30 group-hover:via-black/70 transition-colors" />
                                          <div className="relative z-10 p-3 h-full flex flex-col justify-end">
                                              <div className="flex justify-between items-start mb-1">
                                                  {!notif.lida && <span className="bg-orange-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded shadow-sm">NOVO</span>}
                                                  {notif.lida && <span className="bg-gray-600 text-white text-[8px] font-bold px-1.5 py-0.5 rounded shadow-sm">LIDO</span>}
                                                  <span className="text-[9px] text-gray-300 ml-auto bg-black/40 px-1 rounded">{formatDistanceToNow(new Date(notif.data), { locale: ptBR, addSuffix: true })}</span>
                                              </div>
                                              <p className="text-xs font-bold text-white leading-snug line-clamp-2 mb-0.5 text-shadow">{notif.titulo}</p>
                                              <p className="text-[10px] text-gray-200 line-clamp-2 leading-tight opacity-90 font-medium">{notif.resumo}</p>
                                          </div>
                                      </div>
                                  ))
                              ) : (
                                  <div className="p-8 text-center flex flex-col items-center gap-2"><div className="p-3 bg-white dark:bg-slate-800 rounded-full shadow-sm"><Sparkles className="w-5 h-5 text-indigo-400"/></div><p className="text-xs text-gray-500">{mostrarLidas ? "Nenhuma notificação encontrada." : "Tudo lido por aqui! 😴"}</p></div>
                              )}
                          </div>
                          <div onClick={() => navigate('/blog')} className="p-2 text-center bg-white dark:bg-slate-800 border-t border-gray-100 dark:border-gray-700 cursor-pointer hover:bg-gray-50 transition-colors"><span className="text-xs font-bold text-indigo-600">Ver Central de Notícias</span></div>
                      </div>
                    )}
                </div>

                <div className="relative" ref={ferramentasRef}>
                  <button title="Configurações e Ferramentas" onClick={() => setMostrarMenuFerramentas(!mostrarMenuFerramentas)} className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:bg-gray-100 dark:hover:bg-white/10 group relative text-gray-600 dark:text-gray-300"><Settings className="w-4 h-4 group-hover:rotate-45 transition-all duration-300" /></button>
                  {mostrarMenuFerramentas && (
                      <div className="absolute right-0 top-full mt-2 w-64 rounded-md shadow-lg border border-gray-100 dark:border-slate-700 overflow-hidden z-[60] animate-slide-down bg-white dark:bg-slate-800 p-1">
                          {isMensagens && (<div className="p-3 border-b border-gray-100 dark:border-slate-700 mb-1"><p className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase mb-2">Zoom</p><div className="flex items-center justify-between bg-gray-50 dark:bg-slate-700/50 rounded p-1"><button onClick={handleZoomOut} disabled={escalaZoom <= 0.7} className="p-1.5 rounded hover:bg-white dark:hover:bg-slate-600 shadow-sm transition-all disabled:opacity-30"><ZoomOut className="w-4 h-4 dark:text-white"/></button><span className="text-xs font-bold dark:text-white">{Math.round(escalaZoom * 100)}%</span><button onClick={handleZoomIn} disabled={escalaZoom >= 1.5} className="p-1.5 rounded hover:bg-white dark:hover:bg-slate-600 shadow-sm transition-all disabled:opacity-30"><ZoomIn className="w-4 h-4 dark:text-white"/></button></div></div>)}
                          <button onClick={() => { setMostrarModalTemas(true); setMostrarMenuFerramentas(false); }} className="w-full px-3 py-2.5 text-left text-xs font-semibold flex items-center gap-3 rounded transition-all hover:bg-indigo-50 dark:hover:bg-indigo-900/20 text-gray-700 dark:text-slate-200"><div className="p-1.5 rounded bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400"><Palette className="w-4 h-4" /></div><span>Personalizar Dashboard</span></button>
                          <button onClick={handleToggleTema} className="w-full px-3 py-2.5 text-left text-xs font-semibold flex items-center gap-3 rounded transition-all hover:bg-gray-100 dark:hover:bg-slate-700/50 text-gray-700 dark:text-slate-200"><div className="p-1.5 rounded bg-yellow-100 dark:bg-slate-700 text-yellow-600 dark:text-slate-300">{temaEscuro ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}</div><span>Mudar Tema Geral</span></button>
                          <button onClick={handleSincronizar} disabled={sincronizando} className="w-full px-3 py-2.5 text-left text-xs font-semibold flex items-center gap-3 rounded transition-all hover:bg-blue-50 dark:hover:bg-blue-900/20 disabled:opacity-50 text-gray-700 dark:text-slate-200"><div className="p-1.5 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"><RefreshCw className={`w-4 h-4 ${sincronizando ? 'animate-spin' : ''}`} /></div><span>Sincronizar Dados</span></button>
                          <button onClick={() => setMenuVisivel(false)} className="w-full px-3 py-2.5 text-left text-xs font-semibold flex items-center gap-3 rounded transition-all hover:bg-gray-100 dark:hover:bg-slate-700/50 text-gray-500"><div className="p-1.5 rounded bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300"><ChevronUp className="w-4 h-4" /></div><span>Ocultar Menu</span></button>
                      </div>
                  )}
                </div>
              </div>

              {/* PERFIL */}
              <div className="relative" ref={menuUsuarioRef}>
                  <button title="Meu Perfil" onClick={() => setMostrarMenuUsuario(!mostrarMenuUsuario)} className="flex items-center gap-2.5 pl-1 pr-3 py-1 rounded-full border border-transparent hover:bg-gray-100 dark:hover:bg-white/10 transition-all group">
                      <div className="relative w-8 h-8">
                          <div className="w-full h-full rounded-full overflow-hidden border border-gray-200 dark:border-white/10 shadow-sm group-hover:scale-105 transition-transform">
                              {usuario?.avatar || usuario?.foto_perfil ? ( <img src={`${API_URL}/uploads/avatars/${usuario.avatar || usuario.foto_perfil}`} className="w-full h-full object-cover" onError={(e) => { e.target.style.display = 'none'; }} /> ) : ( <div className="w-full h-full bg-gray-100 dark:bg-slate-700 flex items-center justify-center"><UserCircle className="w-5 h-5 text-gray-400" /></div> )}
                          </div>
                          
                          {/* INDICADOR DE STATUS */}
                          <div className={`absolute -bottom-1 -right-1 w-2 h-2 rounded-full transition-all duration-500 ${getStatusGlowStyle(statusVisual)}`}></div>
                      </div>
                      <div className="hidden xl:flex flex-col items-start">
                          <p className="text-xs font-bold leading-tight" style={{ color: coresTema.text }}>{usuario?.nome?.split(' ')[0]}</p>
                          <div className={`flex items-center gap-1 mt-0.5 text-[10px] font-bold uppercase tracking-wider ${getRoleTextColor(usuario?.tipo)}`}>
                             {getRoleInfo(usuario?.tipo).icon} <span>{getRoleInfo(usuario?.tipo).texto}</span>
                          </div>
                      </div>
                      <ChevronDown className="w-3 h-3 text-gray-500 group-hover:text-gray-700 dark:text-gray-400 transition-colors" />
                  </button>

                  {mostrarMenuUsuario && (
                      <div className="absolute right-0 top-full mt-3 w-80 rounded-xl shadow-xl border border-gray-100 dark:border-slate-700 overflow-hidden z-[60] animate-slide-down bg-white dark:bg-slate-800">
                          
                          <div className="p-5 border-b border-gray-100 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-800/50">
                              <div className="flex items-center gap-3 mb-4">
                                  <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white dark:border-slate-700 shadow-md shrink-0">
                                      {usuario?.avatar || usuario?.foto_perfil ? ( <img src={`${API_URL}/uploads/avatars/${usuario.avatar || usuario.foto_perfil}`} className="w-full h-full object-cover" /> ) : ( <div className="w-full h-full bg-gray-200 flex items-center justify-center"><UserCircle className="w-6 h-6 text-gray-400" /></div> )}
                                  </div>
                                  <div className="overflow-hidden">
                                      <h4 className="font-bold text-gray-900 dark:text-white truncate text-base">{usuario?.nome}</h4>
                                      <p className="text-xs text-gray-500 dark:text-slate-400 truncate mb-1">{usuario?.email}</p>
                                      {/* AQUI NO DROPDOWN MANTÉM A PÍLULA (BADGE) */}
                                      <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold border ${getRoleBadgeStyle(usuario?.tipo)}`}>{getRoleInfo(usuario?.tipo).icon} {getRoleInfo(usuario?.tipo).texto}</div>
                                  </div>
                              </div>
                              
                              {/* RECADO DO USUÁRIO */}
                              {usuario?.recado && (
                                <div className="mb-4 bg-white dark:bg-slate-700/50 p-3 rounded-lg border border-gray-100 dark:border-slate-600 relative overflow-hidden shadow-sm">
                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500"></div>
                                    <p className="text-xs text-gray-600 dark:text-gray-300 italic pl-2 leading-tight">"{usuario.recado}"</p>
                                </div>
                              )}
                              
                              <div className="grid grid-cols-3 gap-2">
                                  <button onClick={() => { setMostrarMenuUsuario(false); setModalPerfilAberto(true); }} className="flex flex-col items-center justify-center gap-1 p-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors border border-indigo-100 dark:border-indigo-900/30"><User className="w-4 h-4" /><span className="text-[10px] font-bold">Perfil</span></button>
                                  <button onClick={handleTrocarUsuario} className="flex flex-col items-center justify-center gap-1 p-2 bg-gray-50 dark:bg-slate-700 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-600 transition-colors border border-gray-100 dark:border-gray-600"><Users className="w-4 h-4" /><span className="text-[10px] font-bold">Trocar</span></button>
                                  <button onClick={handleLogout} className="flex flex-col items-center justify-center gap-1 p-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors border border-red-100 dark:border-red-900/30"><LogOut className="w-4 h-4" /><span className="text-[10px] font-bold">Sair</span></button>
                              </div>
                          </div>

                          <div className="p-4 bg-white dark:bg-slate-800">
                              <SeletorStatus statusAtual={statusVisual} onMudarStatus={mudarStatus} />
                          </div>
                      </div>
                  )}
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className={`overflow-y-auto transition-all duration-300 ${menuVisivel ? 'h-[calc(100vh-56px)]' : 'h-screen'}`}>
        <Outlet context={{ temaEscuro, setTemaEscuro, escalaZoom, setEscalaZoom, handleZoomIn, handleZoomOut, handleResetZoom, paginaAtual, temasConfig }} />
      </main>

      <DashboardTemas isOpen={mostrarModalTemas} onClose={() => setMostrarModalTemas(false)} configuracaoAtual={temasConfig} onAtualizarConfiguracao={atualizarTemas} />
      {modalPerfilAberto && <ModalMeuPerfil isOpen={modalPerfilAberto} onClose={() => setModalPerfilAberto(false)} />}
      <Modal isOpen={confirmLogoutModal} onClose={() => setConfirmLogoutModal(false)} onConfirm={confirmarLogout} titulo="Sair do Sistema" mensagem="Deseja realmente sair do FaleZap?" tipo="info" textoBotaoConfirmar="Sim, sair" textoBotaoCancelar="Cancelar" />

    </div>
  );
}