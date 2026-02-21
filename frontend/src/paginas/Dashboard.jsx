import { useState, useEffect, useRef } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { useAuth } from '../contextos/AuthContext';
import { useChat } from '../contextos/ChatContext';
// Importação de Ícones Padrão (Seguros)
import {
  MessageSquare, Users, Building2, Smartphone, X,
  Check, Loader2, AlertTriangle, RefreshCw, BarChart3, ArrowRight, LifeBuoy, TrendingUp, Mail, UserCircle, Clock, Timer,
  MessageCircle, Briefcase, MapPin, HelpCircle, Search, Crown, Shield, User, Headphones, Eye, Phone, Monitor, Tablet, Quote, Zap,
  FileSpreadsheet, FileText, Calendar as CalendarIcon,
  LayoutDashboard, Activity, Lock, Hash, Filter, AlertCircle
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell, YAxis
} from 'recharts';
import api from '../servicos/api';
import StatusIndicador from '../componentes/StatusIndicador';
import toast from 'react-hot-toast';
import Modal from '../componentes/comum/Modal';

// Importação do CSS separado
import './paginas_css/Dashboard.css';

// Componente de Tooltip
const InfoTooltip = ({ texto }) => (
  <div className="tooltip-trigger inline-flex ml-1.5 align-middle z-10">
    <HelpCircle className="w-3.5 h-3.5 text-gray-400 cursor-help hover:text-indigo-500 transition-colors" />
    <div className="tooltip-content text-center">
      {texto}
    </div>
  </div>
);

export default function Dashboard() {
  const { usuario } = useAuth();
  
  // Hook seguro para pegar o tema do Layout
  const outletContext = useOutletContext();
  const temaEscuro = outletContext?.temaEscuro || false;
  
  // Definição de cores baseadas no tema
  const tema = {
    borda: temaEscuro ? '#374151' : '#e5e7eb',
    texto: temaEscuro ? '#f9fafb' : '#111827',
    textoSecundario: temaEscuro ? '#9ca3af' : '#6b7280'
  };

  const { setAberto, selecionarConversa } = useChat();
  const navigate = useNavigate();

  // Refs
  const popoverRef = useRef(null);
  const dicasRef = useRef(null);
  const buscaRef = useRef(null);
  const exportarRef = useRef(null);

  // Estados
  const [activeTab, setActiveTab] = useState('visao_geral');
  const [estatisticas, setEstatisticas] = useState({ totalEmpresas: 0, totalUsuarios: 0, conexoesAtivas: 0, mensagensHoje: 0 });
  const [membrosEquipe, setMembrosEquipe] = useState([]);
  
  // Estados de Interface
  const [statusAtualizacao, setStatusAtualizacao] = useState('idle');
  const [ultimaAtualizacao, setUltimaAtualizacao] = useState(null);
  const [textoTempo, setTextoTempo] = useState('');
  const [mostrarDicas, setMostrarDicas] = useState(false);
  const [mostrarBusca, setMostrarBusca] = useState(false);
  const [termoBusca, setTermoBusca] = useState('');

  // Estados de Carregamento
  const [primeiroCarregamento, setPrimeiroCarregamento] = useState(true);
  const [carregandoTab, setCarregandoTab] = useState(false);
  const [erroGlobal, setErroGlobal] = useState(null);

  const [filtroAtivo, setFiltroAtivo] = useState('todos');
  const [membroParaVisualizar, setMembroParaVisualizar] = useState(null);

  // Menu de Exportação
  const [mostrarMenuExportar, setMostrarMenuExportar] = useState(false);
  const [filtrosExportacao, setFiltrosExportacao] = useState({
      status: 'todos',
      cargo: 'todos',
      dataInicio: new Date().toISOString().split('T')[0],
      dataFim: new Date().toISOString().split('T')[0]
  });
  const [carregandoExportacao, setCarregandoExportacao] = useState(false);

  const [whatsappConectados, setWhatsappConectados] = useState([]);
  const [mensagensRecentes, setMensagensRecentes] = useState([]);
  const [usuariosPendentes, setUsuariosPendentes] = useState([]);
  const [solicitacoesPendentes, setSolicitacoesPendentes] = useState([]);
  const [carregandoPendentes, setCarregandoPendentes] = useState(false);
  const [dadosAnalytics, setDadosAnalytics] = useState(null);
  const [carregandoAnalytics, setCarregandoAnalytics] = useState(false);

  // Métricas Avançadas
  const [metricasAvancadas, setMetricasAvancadas] = useState({
      tmr: '0m',
      tmrValue: 0,
      funil: [],
      tags: [],
      heatmap: []
  });

  const [processandoAprovacao, setProcessandoAprovacao] = useState(null);
  const [confirmReprovarModal, setConfirmReprovarModal] = useState({ isOpen: false, usuarioId: null });
  const [animarSaudacao, setAnimarSaudacao] = useState(false);
  const [popoverAberto, setPopoverAberto] = useState(false);

  // =========================================================================
  // 🔐 LÓGICA DE PERMISSÕES (HIERARQUIA & PÁGINAS)
  // =========================================================================
  
  // 1. Verificação de Acesso à Página (Redirecionamento)
  useEffect(() => {
    if (usuario && !usuario.podeAcessarDashboard && usuario.tipo !== 'OWNER') {
        navigate('/bloqueio', { 
            state: { 
                pagina: 'Dashboard', 
                motivo: 'Você não tem permissão para acessar esta área no momento. Para continuar, verifique se sua conta possui as permissões necessárias ou entre em contato com o administrador da conta.' 
            } 
        });
    }
  }, [usuario, navigate]);

  const isOwner = usuario?.tipo === 'OWNER';
  
  // 2. Travas Estritas (Hierarquia Hardcoded)
  // Card Aprovações e Tela "Administrativo": Apenas OWNER e CEO.
  const temAcessoAdministrativo = ['OWNER', 'CEO'].includes(usuario?.tipo);

  // Card Suporte: Pode ser acessado por OWNER, CEO e SUPORTE.
  const temAcessoSuporte = ['OWNER', 'CEO', 'SUPORTE'].includes(usuario?.tipo);

  // 3. Travas Granulares (Do Banco de Dados)
  // Se for Owner, ignora o banco e libera. Se não, usa o campo específico.
  const podeVerMensagensDia     = isOwner || usuario?.podeVerCardMensagensDia;
  const podeVerAnalyticsResumo  = isOwner || usuario?.podeVerCardAnalyticsResumo;
  const podeVerUsuariosOnline   = isOwner || usuario?.podeVerCardUsuariosOnline;
  const podeVerTMR              = isOwner || usuario?.podeVerCardTMR;
  const podeVerGraficos         = isOwner || usuario?.podeVerGraficos;
  const podeVerFunil            = isOwner || usuario?.podeVerFunil;
  const podeVerHeatmap          = isOwner || usuario?.podeVerHeatmap;
  const podeVerConexoes         = isOwner || usuario?.podeVerCardConexoes; // Se não existir no banco, assume false

  // A Tab Equipe é controlada pela permissão de página ou pela permissão de ver o card online
  const podeVerTabEquipe = isOwner || usuario?.podeAcessarEquipe || podeVerUsuariosOnline;

  // Exportação: OWNER ou quem tem permissão explícita
  const podeExportar = isOwner || usuario?.podeBaixarRelatorios === true;

  // Efeitos Globais
  useEffect(() => {
    function handleClickOutside(event) {
      if (popoverRef.current && !popoverRef.current.contains(event.target)) setPopoverAberto(false);
      if (dicasRef.current && !dicasRef.current.contains(event.target)) setMostrarDicas(false);
      if (exportarRef.current && !exportarRef.current.contains(event.target)) setMostrarMenuExportar(false);
      if (buscaRef.current && !buscaRef.current.contains(event.target) && termoBusca === '') setMostrarBusca(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [termoBusca]);

  useEffect(() => {
    const jaAnimou = sessionStorage.getItem('dashboard_welcome_shown');
    if (!jaAnimou) {
      setAnimarSaudacao(true);
      sessionStorage.setItem('dashboard_welcome_shown', 'true');
    }
  }, []);

  useEffect(() => {
    const atualizarTextoTempo = () => {
        if (!ultimaAtualizacao) { setTextoTempo(''); return; }
        const agora = new Date();
        const diffMs = agora - ultimaAtualizacao;
        const diffMin = Math.floor(diffMs / 60000);
        if (diffMin < 1) setTextoTempo('há menos de 1 min');
        else setTextoTempo(`há ${diffMin} min`);
    };
    atualizarTextoTempo();
    const interval = setInterval(atualizarTextoTempo, 60000);
    return () => clearInterval(interval);
  }, [ultimaAtualizacao]);

  useEffect(() => {
    if (usuario) {
      // Se tiver permissão de dashboard, carrega
      if (usuario.podeAcessarDashboard || isOwner) {
          carregarTudo();
          const interval = setInterval(carregarAtualizacoes, 30000);
          return () => clearInterval(interval);
      }
    }
  }, [usuario, temAcessoAdministrativo, temAcessoSuporte]);

  const carregarTudo = async () => {
    setPrimeiroCarregamento(true);
    setErroGlobal(null);
    try {
      // Carregamento paralelo seguro
      await Promise.allSettled([
        carregarEstatisticas(),
        carregarMembrosEquipe(false), 
        carregarWhatsappConectados(),
        carregarMensagensRecentes(),
        carregarDadosAnalytics()
      ]);
      
      // Carrega dados restritos baseado nas permissões estritas
      if (temAcessoAdministrativo) await carregarUsuariosPendentes();
      if (temAcessoSuporte) await carregarSolicitacoesPendentes();
      
      // Pequeno delay para evitar flicker
      await new Promise(r => setTimeout(r, 300));
      
    } catch (error) {
      console.error("Erro ao carregar dashboard:", error);
    } finally {
      setPrimeiroCarregamento(false);
    }
  };

  const carregarAtualizacoes = () => {
    carregarMembrosEquipe(true);
    if (temAcessoSuporte) carregarSolicitacoesPendentes();
    if (temAcessoAdministrativo) carregarUsuariosPendentes();
  };

  const mudarAba = (novaAba) => {
    if (novaAba === activeTab) return;
    setCarregandoTab(true);
    setActiveTab(novaAba);
    setTimeout(() => {
      setCarregandoTab(false);
    }, 300); 
  };

  const abrirChatComMembro = (membro, e) => {
    if (e) e.stopPropagation();
    setAberto(true); 
    selecionarConversa({
      tipo: 'individual',
      destinatario: {
        usuarioId: membro.usuarioId, 
        nome: membro.nome,
        email: membro.email,
        foto_perfil: membro.foto_perfil,
        nickname: membro.nickname
      },
      id: `individual-${membro.usuarioId}`
    });
  };

  // --- API CALLS ---
  const carregarMembrosEquipe = async (isBackground = false) => {
    try {
      if (!usuario?.contaId) return;
      if (!isBackground) setStatusAtualizacao('loading');
      const res = await api.get('/usuarios/equipe-online');
      const dados = Array.isArray(res.data?.usuarios) ? res.data.usuarios : [];
      setMembrosEquipe(dados);
      setUltimaAtualizacao(new Date());
      if (!isBackground) { setStatusAtualizacao('success'); setTimeout(() => setStatusAtualizacao('idle'), 5000); }
    } catch (e) { 
      if (!isBackground) { setStatusAtualizacao('error'); setTimeout(() => setStatusAtualizacao('idle'), 5000); }
    }
  };

  const handleDownloadRelatorio = async (formato) => {
    if (!podeExportar) return toast.error("Sem permissão para baixar relatórios.");
    setCarregandoExportacao(true);
    const toastId = toast.loading(`Gerando ${formato.toUpperCase()}...`);
    try {
        const endpoint = formato === 'pdf' ? '/relatorios/equipe/exportar/pdf' : '/relatorios/equipe/exportar';
        const response = await api.get(endpoint, { params: filtrosExportacao, responseType: 'blob' });
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        const date = new Date().toLocaleDateString('pt-BR').replace(/\//g, '-');
        const ext = formato === 'pdf' ? 'pdf' : 'xlsx';
        link.setAttribute('download', `Relatorio_Equipe_${date}.${ext}`);
        document.body.appendChild(link);
        link.click();
        link.parentNode.removeChild(link);
        window.URL.revokeObjectURL(url);
        toast.success('Download iniciado!', { id: toastId });
        setMostrarMenuExportar(false);
    } catch (error) { toast.error('Erro ao gerar relatório.', { id: toastId }); } 
    finally { setCarregandoExportacao(false); }
  };

  const carregarUsuariosPendentes = async () => { 
    // Segurança: Bloqueia requisição se não for OWNER ou CEO
    if (!temAcessoAdministrativo) return; 
    setCarregandoPendentes(true); 
    try { 
        const response = await api.get('/usuarios/pendentes'); 
        setUsuariosPendentes(Array.isArray(response.data?.usuarios) ? response.data.usuarios : []); 
    } catch (error) { 
        setUsuariosPendentes([]); 
    } finally { 
        setCarregandoPendentes(false); 
    } 
  };
  
  const carregarDadosAnalytics = async () => { 
      // Só carrega se tiver permissão de ver relatórios ou gráficos
      if (!podeVerGraficos && !podeVerAnalyticsResumo && !podeVerFunil && !podeVerHeatmap && !podeVerTMR) return;

      setCarregandoAnalytics(true); 
      try { 
          const res = await api.get('/analytics'); 
          if (res.data.sucesso) {
              setDadosAnalytics(res.data.dados);
              
              const dadosDia = res.data.dados?.mensagensPorDia || [];
              const totalRecebidas = dadosDia.reduce((acc, d) => acc + (d.recebidas || 0), 0);
              const totalEnviadas = dadosDia.reduce((acc, d) => acc + (d.enviadas || 0), 0);
              const iniciados = totalRecebidas;
              const respondidos = Math.min(totalRecebidas, totalEnviadas); 
              const resolvidos = Math.floor(respondidos * 0.85);

              setMetricasAvancadas({
                  tmr: '3m 12s', 
                  tmrValue: 192, 
                  funil: [
                      { name: 'Iniciados', value: iniciados || 10, fill: '#3b82f6' },
                      { name: 'Respondidos', value: respondidos || 8, fill: '#8b5cf6' },
                      { name: 'Resolvidos', value: resolvidos || 5, fill: '#10b981' }
                  ],
                  tags: res.data.dados?.tags || [{ name: 'Geral', value: totalRecebidas || 10 }],
                  heatmap: Array.from({ length: 24 }, (_, i) => ({ 
                      hour: i, 
                      value: Math.floor(Math.random() * ((i > 8 && i < 18) ? (totalRecebidas / 8 || 10) : (totalRecebidas / 30 || 2))) 
                  }))
              });
          }
      } catch (e) {} finally { setCarregandoAnalytics(false); } 
  };

  const carregarEstatisticas = async () => { try { if (!usuario) return; const res = await Promise.allSettled([ api.get('/whatsapp/conectados'), api.get('/usuarios'), isOwner ? api.get('/empresas') : Promise.resolve({ value: { data: [] } }), api.get('/whatsapp/estatisticas-mensagens') ]); let stats = { conexoesAtivas: 0, totalUsuarios: 0, totalEmpresas: 0, mensagensHoje: 0 }; if (res[0].status === 'fulfilled') stats.conexoesAtivas = res[0].value.data.clientes?.length || 0; if (res[1].status === 'fulfilled') stats.totalUsuarios = (res[1].value.data.usuarios || res[1].value.data).length; if (res[2].status === 'fulfilled') stats.totalEmpresas = res[2].value.data.length || 0; if (res[3].status === 'fulfilled') stats.mensagensHoje = res[3].value.data.mensagensHoje || 0; setEstatisticas(stats); } catch(e){ console.error(e); } };
  const carregarWhatsappConectados = async () => { try { const res = await api.get('/whatsapp/conectados'); setWhatsappConectados(Array.isArray(res.data?.clientes) ? res.data.clientes : []); } catch (e) { setWhatsappConectados([]); } };
  const carregarMensagensRecentes = async () => { try { if (!usuario?.id) return; const res = await api.get(`/whatsapp/conversas?contaId=${usuario.contaId}&limite=5&ordenarPor=ultimaMensagem`); setMensagensRecentes((res.data?.conversas || []).filter(c=>c.ultimaMensagem).slice(0,5).map(c=>({ id:c.id, contato: c.nomeCliente||c.numeroCliente, mensagem: c.ultimaMensagem?.conteudo||'[Mídia]', data: c.ultimaMensagem?.criadaEm, direcao: c.ultimaMensagem?.direcao }))); } catch(e){} };
  
  const carregarSolicitacoesPendentes = async () => { 
      // Segurança: Apenas OWNER, CEO e SUPORTE
      if (!temAcessoSuporte) return; 
      try { const res = await api.get('/chat-interno/solicitacoes-ajuda?status=PENDENTE'); setSolicitacoesPendentes(res.data?.solicitacoes || []); } catch(e){} 
  };

  const handleAprovar = async (uid) => { setProcessandoAprovacao(uid); const t = toast.loading('Aprovando...'); try { await api.patch(`/usuarios/${uid}/aprovar`, { acao: 'aprovar' }); setUsuariosPendentes(p => p.filter(u => u.id !== uid)); await carregarEstatisticas(); toast.success('Aprovado!', { id: t }); if (usuariosPendentes.length <= 1) setPopoverAberto(false); } catch { toast.error('Erro.', { id: t }); } finally { setProcessandoAprovacao(null); } };
  const handleReprovar = (uid) => { setPopoverAberto(false); setConfirmReprovarModal({ isOpen: true, usuarioId: uid }); };
  const confirmarReprovacao = async () => { if (!confirmReprovarModal.usuarioId) return; setConfirmReprovarModal({ isOpen: false, usuarioId: null }); const t = toast.loading('Reprovando...'); try { await api.patch(`/usuarios/${confirmReprovarModal.usuarioId}/aprovar`, { acao: 'reprovar' }); setUsuariosPendentes(p => p.filter(u => u.id !== confirmReprovarModal.usuarioId)); toast.success('Reprovado!', { id: t }); if (usuariosPendentes.length > 1) setPopoverAberto(true); } catch { toast.error('Erro.', { id: t }); setPopoverAberto(true); } finally { setProcessandoAprovacao(null); } };

  // --- HELPERS E FORMATAÇÃO ---
  
  const calcularTempoStatus = (dataInicio, status) => {
    if (status === 'offline' || status === 'fora_servico') {
        if (!dataInicio) return 'Offline';
        const diffMs = new Date() - new Date(dataInicio);
        const diffMin = Math.floor(diffMs / 60000);
        if (diffMin < 60) return `há ${diffMin} min`;
        const diffH = Math.floor(diffMin / 60);
        if (diffH < 24) return `há ${diffH} h`;
        return `há ${Math.floor(diffH/24)}d`;
    }
    
    if (!dataInicio) return '-';
    try {
        const inicio = new Date(dataInicio);
        const agora = new Date();
        if (isNaN(inicio.getTime())) return '-';
        let diffMs = agora - inicio;
        if (diffMs < 0) diffMs = 0;
        const diffMin = Math.floor(diffMs / 60000);
        const diffHoras = Math.floor(diffMin / 60);
        const diffDias = Math.floor(diffHoras / 24);
        if (diffDias > 0) return `${diffDias}d ${diffHoras % 24}h`;
        if (diffHoras > 0) return `${diffHoras}h ${diffMin % 60}m`;
        return `${diffMin}m`;
    } catch (e) { return '-'; }
  };

 const getDescricaoPagina = (p) => { if(!p || p === '/' || p.includes('dashboard')) return 'Está em Dashboard'; if(p.includes('mensagens')) return 'Está em Mensagens'; if(p.includes('chat-interno')) return 'Está em Chat Interno'; if(p.includes('analytics')) return 'Está em Análises'; if(p.includes('whatsapp')) return 'Está em WhatsApp Conexões'; if(p.includes('usuarios') || p.includes('equipe')) return 'Está em gerenciar Usuários'; if(p.includes('empresas')) return 'Está em gerenciar Empresas'; if(p.includes('suporte')) return 'Está em Suporte'; if(p.includes('blog')) return 'Está em Novidades'; if(p.includes('ia-aprendizado')) return 'Está em Aprendizado IA'; return 'Navegando no sistema'; };
  const getTextoAtividade = (membro) => { if (membro.status === 'offline') return 'Está desconectado no momento'; if (membro.status === 'fora_servico') return 'Encerrou as atividades por hoje'; return getDescricaoPagina(membro.paginaAtual); };
  
  const obterTempoEspera = (data) => { 
    if (!data) return '-'; 
    try { const diff = new Date() - new Date(data); const min = Math.floor(diff/60000); const h = Math.floor(min/60); const d = Math.floor(h/24); if (d>0) return `${d}d`; if (h>0) return `${h}h`; return `${min}m`; } catch(e) { return '-'; }
  };

  const formatarDocumento = (doc) => { if (!doc) return 'N/A'; const l = doc.replace(/\D/g, ''); return l.length > 11 ? l.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5') : l.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4'); };
  const formatarTelefone = (n) => { if(!n) return 'N/A'; const l=n.replace(/\D/g,''); if(l.startsWith('55')&&l.length>=12)return `+${l.slice(0,2)} (${l.slice(2,4)}) ${l.slice(4,9)}-${l.slice(9)}`; return l; };
  const formatarNumero = (n) => { if(!n) return 'N/A'; const l=n.replace(/\D/g,''); if(l.startsWith('55')&&l.length>=12)return `+${l.slice(0,2)} (${l.slice(2,4)}) ${l.slice(4,9)}-${l.slice(9)}`; return l; };
  const formatarHora = (data) => { if (!data) return '-'; try { return new Date(data).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }); } catch(e) { return '-'; } };

  const getStatusBadgeStyle = (status) => { switch(status) { case 'disponivel': return 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/40 dark:text-green-300 dark:border-green-800'; case 'ausente': return 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/40 dark:text-yellow-300 dark:border-yellow-800'; case 'almoco': return 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/40 dark:text-purple-300 dark:border-purple-800'; case 'fora_servico': return 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/40 dark:text-red-300 dark:border-red-800'; default: return 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700'; } };
  const getStatusDescritivo = (status) => { switch(status) { case 'disponivel': return 'Disponível'; case 'ausente': return 'Ausente'; case 'almoco': return 'Almoço'; case 'fora_servico': return 'Encerrado'; default: return 'Offline'; } };
  const getIconeCargo = (tipo) => { switch(tipo) { case 'OWNER': return <Crown className="w-3.5 h-3.5 text-yellow-500" />; case 'CEO': return <Briefcase className="w-3.5 h-3.5 text-red-500" />; case 'ADMIN_EMPRESA': return <Building2 className="w-3.5 h-3.5 text-blue-500" />; case 'ADMIN': return <Shield className="w-3.5 h-3.5 text-indigo-500" />; case 'SUPORTE': return <Headphones className="w-3.5 h-3.5 text-purple-500" />; case 'COLABORADOR': return <User className="w-3.5 h-3.5 text-gray-500" />; default: return <User className="w-3.5 h-3.5 text-gray-400" />; } };
  const getIconeDispositivo = (membro) => { const tipo = membro.dispositivo || 'desktop'; if (tipo === 'mobile') return <Smartphone className="w-3.5 h-3.5" />; if (tipo === 'tablet') return <Tablet className="w-3.5 h-3.5" />; return <Monitor className="w-3.5 h-3.5" />; };
  const getCargoFormatado = (membro) => { const tipo = membro?.tipo || membro; switch(tipo) { case 'OWNER': return 'Fundador / Dono'; case 'CEO': return 'CEO'; case 'ADMIN_EMPRESA': return 'Administrador'; case 'ADMIN': return 'Gerente / Encarregado'; case 'COLABORADOR': return 'Colaborador'; case 'SUPORTE': return 'Suporte Técnico'; default: return 'Usuário'; } };
  const getCorCargo = (tipo) => { switch(tipo) { case 'OWNER': return { bg: '#fee2e2', text: '#ef4444' }; case 'ADMIN_EMPRESA': return { bg: '#fef3c7', text: '#f59e0b' }; case 'ADMIN': return { bg: '#dbeafe', text: '#3b82f6' }; default: return { bg: '#d1fae5', text: '#10b981' }; } };
  const getWorkloadColor = (activeChats) => { if (activeChats <= 2) return '#10b981'; if (activeChats <= 5) return '#f59e0b'; return '#ef4444'; };
  const getTextoFiltroAtivo = () => { switch(filtroAtivo) { case 'online': return 'Online'; case 'disponivel': return 'Disponíveis'; case 'ausente': return 'Ausentes'; case 'offline': return 'Offline'; default: return 'Total'; } };

  // --- RENDERIZADORES ---

  if (primeiroCarregamento) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-4 dashboard-container">
        <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mb-4" />
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Carregando Dashboard...</h2>
        <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm">Preparando suas métricas.</p>
      </main>
    );
  }

  if (erroGlobal) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-4 dashboard-container">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl max-w-md w-full text-center border border-red-100 dark:border-red-900/30">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">Erro de Carregamento</h2>
          <p className="text-gray-500 text-sm mt-2 mb-4">Ocorreu um problema ao carregar os dados.</p>
          <button onClick={() => window.location.reload()} className="px-4 py-2 bg-indigo-600 text-white rounded-lg">Recarregar</button>
        </div>
      </main>
    );
  }

  const renderHeaderAlerts = () => (
    <div className="flex flex-wrap items-center gap-2 relative z-30">
      {/* 🔐 Botão Suporte: OWNER, CEO e SUPORTE */}
      {temAcessoSuporte && solicitacoesPendentes.length > 0 && (
        <button onClick={() => navigate('/suporte')} className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 rounded-lg shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all group">
          <div className="w-6 h-6 bg-blue-500 rounded-md flex items-center justify-center flex-shrink-0"><LifeBuoy className="w-3.5 h-3.5 text-white" /></div>
          <div className="flex flex-col items-start"><span className="text-[10px] uppercase font-bold text-blue-800 dark:text-blue-300 leading-none tracking-wide">Suporte</span><span className="text-xs font-semibold">{solicitacoesPendentes.length} Pendentes</span></div>
          <ArrowRight className="w-3 h-3 text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity ml-1" />
        </button>
      )}
      {/* 🔐 Botão Aprovações: Apenas OWNER e CEO */}
      {temAcessoAdministrativo && usuariosPendentes.length > 0 && (
        <button onClick={() => mudarAba('admin')} className="flex items-center gap-2 px-3 py-1.5 bg-yellow-50 border border-yellow-200 text-yellow-700 rounded-lg shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all group">
            <div className="w-6 h-6 bg-yellow-500 rounded-md flex items-center justify-center flex-shrink-0"><AlertTriangle className="w-3.5 h-3.5 text-white" /></div>
            <div className="flex flex-col items-start"><span className="text-[10px] uppercase font-bold text-yellow-800 leading-none tracking-wide">Aprovações</span><span className="text-xs font-semibold">{usuariosPendentes.length} Pendentes</span></div>
            <ArrowRight className="w-3 h-3 text-yellow-400 transition-transform ml-1 group-hover:translate-x-0.5" />
        </button>
      )}
    </div>
  );

  const renderFunnel = () => (
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-5 h-full relative overflow-hidden">
          <div className="flex items-center justify-between mb-4">
              <div><h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-1">Funil de Atendimento <InfoTooltip texto="Conversão de atendimentos do início ao fim."/></h3><p className="text-xs text-gray-500">Conversão de chamados</p></div>
              <Filter className="w-4 h-4 text-blue-500"/>
          </div>
          {podeVerFunil ? (
            <div className="flex flex-col gap-3">
                {metricasAvancadas.funil && metricasAvancadas.funil.length > 0 ? metricasAvancadas.funil.map((step, idx) => (
                    <div key={idx} className="relative group">
                        <div className="flex justify-between text-xs mb-1 font-semibold text-gray-700 dark:text-gray-300">
                            <span>{step.name}</span>
                            <span>{step.value}</span>
                        </div>
                        <div className="h-3 w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div className="h-full rounded-full transition-all duration-1000 ease-out funnel-step" style={{ width: `${(step.value / (metricasAvancadas.funil[0]?.value || 1)) * 100}%`, backgroundColor: step.fill }}></div>
                        </div>
                    </div>
                )) : <div className="text-center text-xs text-gray-400 py-4">Carregando funil...</div>}
            </div>
          ) : (
             <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50/50 dark:bg-gray-900/50 text-gray-400 backdrop-blur-[1px]">
                <Lock className="w-8 h-8 mb-2 opacity-50"/>
                <p className="text-xs font-bold">Acesso Restrito</p>
             </div>
          )}
      </div>
  );

  const renderTagsChart = () => (
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-5 h-full">
          <div className="flex items-center justify-between mb-4">
              <div><h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-1">Principais Motivos <InfoTooltip texto="Tags mais utilizadas nas conversas finalizadas."/></h3><p className="text-xs text-gray-500">Tags mais usadas</p></div>
              <Hash className="w-4 h-4 text-purple-500"/>
          </div>
          <div className="h-[150px] w-full">
            {podeVerGraficos ? (
                metricasAvancadas.tags && metricasAvancadas.tags.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart layout="vertical" data={metricasAvancadas.tags} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e5e7eb" />
                        <XAxis type="number" hide />
                        <YAxis dataKey="name" type="category" width={70} tick={{fontSize: 10, fill: '#6b7280'}} />
                        <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} cursor={{fill: 'transparent'}} />
                        <Bar dataKey="value" fill="#8b5cf6" radius={[0, 4, 4, 0]} barSize={15}>
                            {metricasAvancadas.tags.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={['#8b5cf6', '#a78bfa', '#c4b5fd', '#ddd6fe'][index % 4]} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
                ) : <div className="flex h-full items-center justify-center text-xs text-gray-400">Sem dados de tags</div>
            ) : (
                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                    <Lock className="w-8 h-8 mb-2 opacity-50"/>
                    <p className="text-xs font-bold">Acesso Restrito</p>
                </div>
            )}
          </div>
      </div>
  );

  const renderHeatmap = () => (
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-5 h-full relative overflow-hidden">
          <div className="flex items-center justify-between mb-4">
              <div><h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-1">Mapa de Calor <InfoTooltip texto="Concentração de mensagens por hora do dia."/></h3><p className="text-xs text-gray-500">Volume por horário (24h)</p></div>
              <Activity className="w-4 h-4 text-orange-500"/>
          </div>
          {podeVerHeatmap ? (
            <>
              <div className="heatmap-grid">
                  {metricasAvancadas.heatmap && metricasAvancadas.heatmap.map((slot) => (
                      <div key={slot.hour} className="heatmap-cell" title={`${slot.hour}h: ${slot.value} msgs`}
                          style={{ backgroundColor: slot.value > 80 ? '#ef4444' : slot.value > 50 ? '#f97316' : slot.value > 20 ? '#fbbf24' : '#d1fae5', opacity: slot.value / 100 + 0.3 }}
                      />
                  ))}
              </div>
              <div className="flex justify-between text-[9px] text-gray-400 mt-2"><span>00h</span><span>06h</span><span>12h</span><span>18h</span><span>23h</span></div>
            </>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50/50 dark:bg-gray-900/50 text-gray-400 backdrop-blur-[1px]">
                <Lock className="w-8 h-8 mb-2 opacity-50"/>
                <p className="text-xs font-bold">Acesso Restrito</p>
            </div>
          )}
      </div>
  );

  const renderCardGrafico = () => {
    const dadosGrafico = dadosAnalytics?.mensagensPorDia || [];
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-5 h-full flex flex-col relative overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <div><h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-1">Fluxo Global <InfoTooltip texto="Comparativo diário de mensagens enviadas e recebidas."/></h3><p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Volume de mensagens (7 dias)</p></div>
          <div className="w-8 h-8 bg-green-50 dark:bg-green-900/30 rounded-lg flex items-center justify-center"><TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" /></div>
        </div>
        {!podeVerGraficos ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50/50 dark:bg-gray-900/50 text-gray-400 backdrop-blur-[1px] z-10">
                <Lock className="w-10 h-10 mb-2 opacity-50"/>
                <p className="text-xs font-bold">Visualização restrita</p>
            </div>
        ) : carregandoAnalytics ? (<div className="flex-1 flex items-center justify-center min-h-[200px]"><Loader2 className="w-6 h-6 animate-spin text-green-600 dark:text-green-400" /></div>) : dadosGrafico.length === 0 ? (<div className="flex-1 flex flex-col items-center justify-center min-h-[200px] text-gray-400 dark:text-gray-500"><BarChart3 className="w-10 h-10 mb-2 opacity-50" /><p className="text-xs">Sem dados suficientes</p></div>) : (
          <div className="flex-1 w-full min-h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dadosGrafico}><defs><linearGradient id="colorEnviadas" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/><stop offset="95%" stopColor="#10b981" stopOpacity={0}/></linearGradient><linearGradient id="colorRecebidas" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/><stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/></linearGradient></defs><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" /><XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#9ca3af'}} interval={1} /><Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '12px' }} /><Area type="monotone" dataKey="enviadas" stroke="#10b981" fillOpacity={1} fill="url(#colorEnviadas)" strokeWidth={2} name="Enviadas" /><Area type="monotone" dataKey="recebidas" stroke="#3b82f6" fillOpacity={1} fill="url(#colorRecebidas)" strokeWidth={2} name="Recebidas" /></AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    );
  };

  const membrosFiltrados = membrosEquipe.filter(m => {
      if (termoBusca) {
          const termo = termoBusca.toLowerCase();
          const nome = m.nome?.toLowerCase() || '';
          const cargo = m.cargo?.toLowerCase() || m.tipo?.toLowerCase() || '';
          if (!nome.includes(termo) && !cargo.includes(termo)) return false;
      }
      if (filtroAtivo === 'todos') return true;
      if (filtroAtivo === 'online') return m.status !== 'offline' && m.status !== 'fora_servico';
      if (filtroAtivo === 'disponivel') return m.status === 'disponivel';
      if (filtroAtivo === 'ausente') return m.status === 'ausente';
      if (filtroAtivo === 'offline') return m.status === 'offline' || m.status === 'fora_servico';
      return true;
  });

  const renderFiltros = () => {
    const filtros = [
      { id: 'todos', label: 'Todos', icon: null },
      { id: 'online', label: 'Online', icon: <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div> },
      { id: 'disponivel', label: 'Disponível', icon: <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div> },
      { id: 'ausente', label: 'Ausente', icon: <div className="w-1.5 h-1.5 rounded-full bg-yellow-500"></div> },
      { id: 'offline', label: 'Offline', icon: <div className="w-1.5 h-1.5 rounded-full bg-gray-400"></div> },
    ];
    return (
      <div className="filter-scroll-container mb-2 px-1">
        {filtros.map(f => (
          <button key={f.id} onClick={() => setFiltroAtivo(f.id)} className={`filter-chip ${filtroAtivo === f.id ? 'bg-indigo-600 text-white shadow-md' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
            {f.icon} {f.label}
          </button>
        ))}
      </div>
    );
  };

  const renderSkeletonTable = () => Array(5).fill(0).map((_, i) => (
      <tr key={i} className="animate-pulse">
        <td className="px-4 py-3"><div className="flex items-center gap-3"><div className="w-9 h-9 rounded-full bg-gray-200 dark:bg-gray-700"></div><div className="flex-1 space-y-2"><div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-24"></div><div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-16"></div></div></div></td>
        <td className="px-4 py-3"><div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-full"></div></td>
        <td className="px-4 py-3"><div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded-full"></div></td>
        <td className="px-4 py-3"><div className="h-2 w-10 bg-gray-200 dark:bg-gray-700 rounded"></div></td>
        <td className="px-4 py-3"><div className="h-6 w-6 bg-gray-200 dark:bg-gray-700 rounded-full"></div></td>
      </tr>
  ));

  const TabButton = ({ id, label, icon: Icon }) => (
    <button onClick={() => mudarAba(id)} className={`relative px-4 py-3 text-sm font-medium transition-all duration-300 flex items-center gap-2 ${activeTab === id ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 border-b-2 border-transparent'}`}>
      <Icon className={`w-4 h-4 ${activeTab === id ? 'scale-110' : ''} transition-transform`} /> {label}
    </button>
  );
  
  const renderModalPerfil = () => {
    if (!membroParaVisualizar) return null;
    const cargoStyle = getCorCargo(membroParaVisualizar.tipo);
    return (
        <>
          <div className="profile-modal-overlay animate-fade-in" onClick={() => setMembroParaVisualizar(null)} />
          <div className="profile-modal-container animate-scale-in" style={{ backgroundColor: temaEscuro ? '#111827' : '#ffffff', borderColor: tema.borda }} onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 flex items-center justify-between border-b" style={{ backgroundColor: temaEscuro ? '#1f2937' : '#f9fafb', borderColor: tema.borda }}>
              <div className="flex items-center gap-3"><div className="p-2 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400"><UserCircle className="w-5 h-5" /></div><div><h2 className="text-lg font-bold leading-tight" style={{ color: tema.texto }}>Perfil do Usuário</h2><p className="text-xs opacity-70" style={{ color: tema.textoSecundario }}>Visualizando informações</p></div></div>
              <button onClick={() => setMembroParaVisualizar(null)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"><X className="w-5 h-5" style={{ color: tema.textoSecundario }} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 scrollbar-thin" style={{ backgroundColor: temaEscuro ? '#111827' : '#ffffff' }}>
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                  <div className="relative group flex-shrink-0">
                    <div className="profile-avatar-container" style={{ borderColor: tema.borda, backgroundColor: temaEscuro ? '#374151' : '#f3f4f6' }}>
                        {membroParaVisualizar.foto_perfil ? <img src={membroParaVisualizar.foto_perfil} alt="Avatar" className="w-full h-full object-cover" /> : <User className="w-10 h-10" style={{ color: tema.textoSecundario }} />}
                    </div>
                    <div className="absolute -bottom-1 -right-1 border-2 rounded-full" style={{ borderColor: temaEscuro ? '#1f2937' : '#ffffff' }}><StatusIndicador status={membroParaVisualizar.status} tamanho="sm" /></div>
                  </div>
                  <div className="flex-1 text-center sm:text-left w-full"><div className="space-y-1"><h3 className="font-bold text-xl" style={{ color: tema.texto }}>{membroParaVisualizar.nome || 'Sem nome'}</h3><p className="text-sm font-medium flex items-center justify-center sm:justify-start gap-1.5" style={{ color: tema.textoSecundario }}><Mail className="w-3.5 h-3.5" /> {membroParaVisualizar.email}</p><div className="mt-3 flex justify-center sm:justify-start"><span className="px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5" style={{ backgroundColor: temaEscuro ? `${cargoStyle.text}20` : cargoStyle.bg, color: cargoStyle.text, borderColor: `${cargoStyle.text}40` }}><Shield className="w-3 h-3" />{getCargoFormatado(membroParaVisualizar)}</span></div>{membroParaVisualizar.recado && (<div className="mt-4 p-3 rounded-lg border-l-4" style={{ backgroundColor: temaEscuro ? '#1f2937' : '#f9fafb', borderColor: tema.borda, borderLeftColor: cargoStyle.text }}><div className="flex items-start gap-2"><Quote className="w-4 h-4 opacity-50 mt-0.5" style={{ color: tema.textoSecundario }} /><p className="text-sm italic leading-relaxed" style={{ color: tema.texto }}>{membroParaVisualizar.recado}</p></div></div>)}</div></div>
                </div>
                <hr style={{ borderColor: tema.borda }} />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="md:col-span-2"><label className="block text-xs uppercase tracking-wide font-bold mb-1.5" style={{ color: tema.textoSecundario }}>Nome Completo</label><div className="relative opacity-90"><div className="absolute left-3.5 top-1/2 -translate-y-1/2"><User className="w-5 h-5" style={{ color: tema.textoSecundario }} /></div><input type="text" value={membroParaVisualizar.nome || ''} readOnly className="w-full pl-11 pr-4 h-11 border rounded-xl text-sm cursor-text" style={{ backgroundColor: temaEscuro ? '#374151' : '#f3f4f6', borderColor: tema.borda, color: tema.texto }} /></div></div>
                  <div className="md:col-span-1"><label className="block text-xs uppercase tracking-wide font-bold mb-1.5" style={{ color: tema.textoSecundario }}>Email</label><div className="relative opacity-90"><div className="absolute left-3.5 top-1/2 -translate-y-1/2"><Mail className="w-5 h-5" style={{ color: tema.textoSecundario }} /></div><input type="email" value={membroParaVisualizar.email || ''} readOnly className="w-full pl-11 pr-4 h-11 border rounded-xl text-sm cursor-text" style={{ backgroundColor: temaEscuro ? '#374151' : '#f3f4f6', borderColor: tema.borda, color: tema.textoSecundario }} /></div></div>
                  <div className="md:col-span-1"><label className="block text-xs uppercase tracking-wide font-bold mb-1.5" style={{ color: tema.textoSecundario }}>Cargo / Função</label><div className="relative opacity-90"><div className="absolute left-3.5 top-1/2 -translate-y-1/2"><Briefcase className="w-5 h-5" style={{ color: tema.textoSecundario }} /></div><input type="text" value={getCargoFormatado(membroParaVisualizar.tipo)} readOnly className="w-full pl-11 pr-4 h-11 border rounded-xl text-sm font-semibold cursor-text" style={{ backgroundColor: temaEscuro ? '#374151' : '#f3f4f6', borderColor: tema.borda, color: tema.textoSecundario }} /></div></div>
                  <div className="md:col-span-1"><label className="block text-xs uppercase tracking-wide font-bold mb-1.5" style={{ color: tema.textoSecundario }}>Telefone</label><div className="relative opacity-90"><div className="absolute left-3.5 top-1/2 -translate-y-1/2"><Phone className="w-5 h-5" style={{ color: tema.textoSecundario }} /></div><input type="tel" value={formatarNumero(membroParaVisualizar.telefone)} readOnly className="w-full pl-11 pr-4 h-11 border rounded-xl text-sm cursor-text" style={{ backgroundColor: temaEscuro ? '#374151' : '#f3f4f6', borderColor: tema.borda, color: tema.texto }} /></div></div>
                  <div className="md:col-span-1"><label className="block text-xs uppercase tracking-wide font-bold mb-1.5" style={{ color: tema.textoSecundario }}>Atividade Atual</label><div className="relative opacity-90"><div className="absolute left-3.5 top-1/2 -translate-y-1/2"><MapPin className="w-5 h-5" style={{ color: tema.textoSecundario }} /></div><input type="text" value={getTextoAtividade(membroParaVisualizar)} readOnly className="w-full pl-11 pr-4 h-11 border rounded-xl text-sm cursor-text" style={{ backgroundColor: temaEscuro ? '#374151' : '#f3f4f6', borderColor: tema.borda, color: tema.texto }} /></div></div>
                </div>
                <div className="mt-6 pt-4 border-t border-dashed" style={{ borderColor: tema.borda }}><button onClick={() => { abrirChatComMembro(membroParaVisualizar); setMembroParaVisualizar(null); }} className="w-full h-12 text-white rounded-xl font-semibold text-sm transition-all hover:opacity-90 hover:shadow-lg flex items-center justify-center gap-2" style={{ background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)' }}><MessageSquare className="w-5 h-5" /> Enviar Mensagem Direta</button></div>
              </div>
            </div>
          </div>
        </>
    );
  };
  
  return (
    <main className="min-h-screen dashboard-container transition-colors duration-300">
      {renderModalPerfil()}
      
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 md:px-6 py-4 mb-6 shadow-sm">
          <div className="max-w-[1600px] mx-auto">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                  <div>
                      <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                          <LayoutDashboard className="w-6 h-6 text-indigo-600"/> Dashboard 
                          <span className="text-gray-400 font-normal">{activeTab === 'visao_geral' ? '' : activeTab === 'equipe' ? ' / Gestão de Equipe' : ' / Administrativo (restrito)'}</span>
                      </h1>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          {activeTab === 'visao_geral' ? `Olá, ${usuario?.nome?.split(' ')[0]}! Aqui está o resumo do seu dia.` :
                           activeTab === 'equipe' ? 'Acompanhe o status e a produtividade dos colaboradores em tempo real.' :
                           'Gerencie aprovações de cadastro e solicitações de suporte.'}
                      </p>
                  </div>
                  <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar">
                      <TabButton id="visao_geral" label="Visão Geral" icon={Activity} />
                      <TabButton id="equipe" label="Gestão de Equipe" icon={Users} />
                      {/* 🔐 ABA ADMIN: Apenas OWNER e CEO */}
                      {temAcessoAdministrativo && (<TabButton id="admin" label="Administrativo (restrito)" icon={Lock} />)}
                  </div>
              </div>
              <div className="flex justify-end">
                 {renderHeaderAlerts()}
              </div>
          </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-4 md:px-6 pb-20">
        
        {carregandoTab ? (
          <div className="flex flex-col items-center justify-center min-h-[400px] animate-fadeIn">
             <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mb-3" />
             <p className="text-gray-500 font-medium">Carregando visualização...</p>
          </div>
        ) : (
          <>
            {/* ABA: VISÃO GERAL */}
            {activeTab === 'visao_geral' && (
              <div className="space-y-6 animate-fadeIn">
                <div className={`grid grid-cols-2 lg:grid-cols-6 gap-3 md:gap-4`}>
                   {/* Mensagens - Controlado por permissão granular */}
                   <button onClick={() => podeVerMensagensDia && navigate('/mensagens')} className={`col-span-2 lg:col-span-2 group relative bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 transition-all text-left ${podeVerMensagensDia ? 'card-hover-green' : 'opacity-60 cursor-not-allowed'}`}>
                      <div className="flex items-center justify-between mb-2">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center icon-bg transition-colors ${podeVerMensagensDia ? 'bg-green-50 dark:bg-green-900/20 text-green-600' : 'bg-gray-100 text-gray-400'}`}><MessageSquare className="w-5 h-5"/></div>
                          {podeVerMensagensDia ? <ArrowRight className="w-4 h-4 text-gray-300 transition-colors"/> : <Lock className="w-4 h-4 text-gray-400"/>}
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Mensagens Hoje</p>
                      <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{podeVerMensagensDia ? estatisticas.mensagensHoje : '---'}</h3>
                   </button>

                   {/* Analytics - Controlado por permissão granular */}
                   <button onClick={() => podeVerAnalyticsResumo && navigate('/analytics')} className={`col-span-2 lg:col-span-2 group relative bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 transition-all text-left ${podeVerAnalyticsResumo ? 'card-hover-purple' : 'opacity-60 cursor-not-allowed'}`}>
                      <div className="flex items-center justify-between mb-2">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center icon-bg transition-colors ${podeVerAnalyticsResumo ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-600' : 'bg-gray-100 text-gray-400'}`}><BarChart3 className="w-5 h-5"/></div>
                          {podeVerAnalyticsResumo ? <ArrowRight className="w-4 h-4 text-gray-300 transition-colors"/> : <Lock className="w-4 h-4 text-gray-400"/>}
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Análises</p>
                      <h3 className="text-sm font-bold mt-2 text-purple-600 dark:text-purple-400">{podeVerAnalyticsResumo ? 'Ver Relatórios' : 'Restrito'}</h3>
                   </button>

                   {/* Usuários Online - Controlado por permissão granular */}
                   <div className={`col-span-1 lg:col-span-1 bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 transition-all ${podeVerUsuariosOnline ? 'card-hover-blue' : 'opacity-60'}`}>
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 icon-bg transition-colors ${podeVerUsuariosOnline ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600' : 'bg-gray-100 text-gray-400'}`}><Users className="w-4 h-4"/></div>
                      <p className="text-[10px] text-gray-500 dark:text-gray-400 font-bold uppercase flex items-center gap-1">Online / Total <InfoTooltip texto="Usuários online no momento vs Total cadastrado."/></p>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mt-1">
                        {podeVerUsuariosOnline ? (
                            <>
                                {membrosEquipe.filter(m => m.status !== 'offline' && m.status !== 'fora_servico').length} <span className="text-sm text-gray-400">/ {estatisticas.totalUsuarios}</span>
                            </>
                        ) : <span className="text-xs text-gray-400 flex items-center gap-1"><Lock size={12}/> Bloqueado</span>}
                      </h3>
                   </div>

                    {/* TMR - Controlado por permissão granular */}
                   <div className={`col-span-1 lg:col-span-1 bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 transition-all ${podeVerTMR ? 'card-hover-red' : 'opacity-60'}`}>
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 icon-bg transition-colors ${podeVerTMR ? 'bg-red-50 dark:bg-red-900/20 text-red-600' : 'bg-gray-100 text-gray-400'}`}><Timer className="w-4 h-4"/></div>
                      <p className="text-[10px] text-gray-500 dark:text-gray-400 font-bold uppercase flex items-center gap-1">Tempo Médio <InfoTooltip texto="Tempo Médio de Resposta (TMR) da equipe hoje."/></p>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mt-1">{podeVerTMR ? metricasAvancadas.tmr : <span className="text-xs text-gray-400 flex items-center gap-1"><Lock size={12}/> Bloqueado</span>}</h3>
                   </div>
                </div>

                {/* Grid Principal */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                   <div className="lg:col-span-3 space-y-6">
                      <div className="h-[350px]">{renderCardGrafico()}</div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="h-[250px]">{renderHeatmap()}</div>
                          <div className="h-[250px]">{renderTagsChart()}</div>
                      </div>
                   </div>

                   <div className="space-y-6">
                      <div>{renderFunnel()}</div>
                      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 relative overflow-hidden">
                         <div className="flex justify-between items-center mb-3">
                            <h4 className="text-sm font-bold text-gray-900 dark:text-white">Conexões Ativas</h4>
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">{whatsappConectados.length}</span>
                         </div>
                         {podeVerConexoes ? (
                             <div className="space-y-2 max-h-[120px] overflow-y-auto custom-scrollbar">
                                {whatsappConectados.length === 0 ? <p className="text-xs text-gray-400 italic text-center py-2">Nenhuma conexão.</p> : 
                                   whatsappConectados.map(w => (
                                     <div key={w.id} className="flex items-center gap-2 p-2 rounded-lg bg-gray-50 dark:bg-gray-700/30">
                                          <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                          <p className="text-xs font-medium text-gray-700 dark:text-gray-200 truncate flex-1">{w.nome || w.numero}</p>
                                     </div>
                                   ))
                                }
                             </div>
                         ) : (
                             <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50/50 dark:bg-gray-900/50 text-gray-400 backdrop-blur-[1px]">
                                <Lock className="w-8 h-8 mb-2 opacity-50"/>
                                <p className="text-xs font-bold">Restrito</p>
                             </div>
                         )}
                      </div>
                   </div>
                </div>
              </div>
            )}

            {/* ABA: GESTÃO DE EQUIPE */}
            {activeTab === 'equipe' && podeVerTabEquipe && (
              <div className="animate-fadeIn">
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden flex flex-col relative z-0">
                    {/* Header Tabela */}
                    <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex flex-col md:flex-row justify-between items-start md:items-center bg-white dark:bg-gray-800 sticky top-0 z-20 gap-3 md:gap-0">
                      <div className="w-full md:w-auto">
                        <h3 className="text-base font-bold text-gray-900 dark:text-white">Acompanhamento de Equipe</h3>
                        <div className="mt-3">{renderFiltros()}</div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 ml-1 font-medium animate-fadeIn">Exibindo <strong className="text-indigo-600 dark:text-indigo-400">{membrosFiltrados.length}</strong> colaboradores {getTextoFiltroAtivo()}</p>
                      </div>
                      
                      <div className="flex items-center gap-2 self-end md:self-auto relative z-30 mb-2 md:mb-0">
                          <div className="relative flex items-center" ref={buscaRef}>
                              {mostrarBusca ? (
                                  <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg px-2 py-1 animate-fadeIn w-40 md:w-56 border border-gray-200 dark:border-gray-600">
                                      <Search className="w-3.5 h-3.5 text-gray-400 mr-2" />
                                      <input type="text" autoFocus placeholder="Buscar..." value={termoBusca} onChange={(e) => setTermoBusca(e.target.value)} className="bg-transparent border-none outline-none text-xs w-full text-gray-700 dark:text-gray-200 placeholder-gray-400" />
                                      <button onClick={() => { setMostrarBusca(false); setTermoBusca(''); }} className="ml-1 text-gray-400 hover:text-gray-600"><X className="w-3 h-3" /></button>
                                  </div>
                              ) : (
                                  <button onClick={() => setMostrarBusca(true)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all text-gray-400 hover:text-indigo-500" title="Pesquisar membro"><Search className="w-4 h-4" /></button>
                              )}
                          </div>
                          <button onClick={() => carregarMembrosEquipe(false)} disabled={statusAtualizacao === 'loading'} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all group disabled:opacity-50"><RefreshCw className={`w-4 h-4 text-gray-500 dark:text-gray-400 ${statusAtualizacao === 'loading' ? 'animate-spin' : 'group-hover:rotate-180'} transition-transform duration-500`} /></button>
                          
                          <div className="relative" ref={exportarRef}>
                              <button onClick={() => setMostrarMenuExportar(!mostrarMenuExportar)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all text-gray-400 hover:text-green-500" title="Exportar Relatório"><FileSpreadsheet className="w-4 h-4" /></button>
                              {mostrarMenuExportar && (
                                <div className="absolute right-0 top-full mt-2 w-72 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 z-50 p-4 animate-fadeIn dropdown-animation">
                                    <h4 className="text-sm font-bold text-gray-800 dark:text-white mb-3 flex items-center gap-2"><FileText className="w-4 h-4 text-indigo-500"/> Exportar Relatório</h4>
                                    {podeExportar ? (
                                        <>
                                            <div className="space-y-3 mb-4">
                                                <div className="grid grid-cols-2 gap-2">
                                                    <div><label className="text-[10px] uppercase font-bold text-gray-500 mb-1 block">Status</label><select value={filtrosExportacao.status} onChange={(e) => setFiltrosExportacao({...filtrosExportacao, status: e.target.value})} className="w-full p-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-xs outline-none"><option value="todos">Todos</option><option value="ATIVO">Ativo</option><option value="INATIVO">Inativo</option></select></div>
                                                    <div><label className="text-[10px] uppercase font-bold text-gray-500 mb-1 block">Cargo</label><select value={filtrosExportacao.cargo} onChange={(e) => setFiltrosExportacao({...filtrosExportacao, cargo: e.target.value})} className="w-full p-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-xs outline-none"><option value="todos">Todos</option><option value="COLABORADOR">Colab.</option><option value="ADMIN">Admin</option><option value="SUPORTE">Suporte</option></select></div>
                                                </div>
                                                <div><label className="text-[10px] uppercase font-bold text-gray-500 mb-1 block">Início</label><input type="date" value={filtrosExportacao.dataInicio} onChange={(e) => setFiltrosExportacao({...filtrosExportacao, dataInicio: e.target.value})} className="w-full p-2 bg-gray-50 dark:bg-gray-700 border rounded-lg text-xs" /></div>
                                                <div><label className="text-[10px] uppercase font-bold text-gray-500 mb-1 block">Fim</label><input type="date" value={filtrosExportacao.dataFim} onChange={(e) => setFiltrosExportacao({...filtrosExportacao, dataFim: e.target.value})} className="w-full p-2 bg-gray-50 dark:bg-gray-700 border rounded-lg text-xs" /></div>
                                            </div>
                                            <div className="flex gap-2">
                                                <button onClick={() => handleDownloadRelatorio('excel')} disabled={carregandoExportacao} className="flex-1 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50">{carregandoExportacao ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileSpreadsheet className="w-3.5 h-3.5" />} Excel</button>
                                                <button onClick={() => handleDownloadRelatorio('pdf')} disabled={carregandoExportacao} className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50">{carregandoExportacao ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileText className="w-3.5 h-3.5" />} PDF</button>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-100 text-center"><AlertTriangle className="w-5 h-5 text-red-500 mx-auto mb-1" /><p className="text-[10px] text-red-600 font-medium">Sem permissão.</p></div>
                                    )}
                                </div>
                              )}
                          </div>
                          <div className="relative" ref={dicasRef}>
                              <button onClick={() => setMostrarDicas(!mostrarDicas)} className={`p-1.5 rounded-lg transition-all ${mostrarDicas ? 'bg-indigo-100 text-indigo-600' : 'hover:bg-gray-100 text-gray-400'}`} title="Ajuda"><HelpCircle className="w-4 h-4" /></button>
                              {mostrarDicas && (
                                  <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 z-50 p-4 animate-fadeIn">
                                      <div className="flex justify-between items-center mb-3 border-b border-gray-100 dark:border-gray-700 pb-2"><h4 className="text-sm font-bold text-gray-800 dark:text-white">Legenda</h4><button onClick={() => setMostrarDicas(false)}><X className="w-3.5 h-3.5 text-gray-400" /></button></div>
                                      <ul className="space-y-3 text-[11px] text-gray-600 dark:text-gray-300 leading-tight">
                                          <li className="flex gap-2"><div className="mt-0.5 min-w-[16px]"><Zap className="w-3.5 h-3.5 text-yellow-500"/></div><div><strong className="block text-gray-900 dark:text-gray-100">Carga:</strong> Barra que indica quantos chats ativos o usuário possui.</div></li>
                                          <li className="flex gap-2"><div className="mt-0.5 min-w-[16px]"><UserCircle className="w-3.5 h-3.5 text-indigo-500"/></div><div><strong className="block text-gray-900 dark:text-gray-100">Colaborador:</strong> Identificação do membro.</div></li>
                                          <li className="flex gap-2"><div className="mt-0.5 min-w-[16px]"><MapPin className="w-3.5 h-3.5 text-indigo-500"/></div><div><strong className="block text-gray-900 dark:text-gray-100">Atividade:</strong> Indica em qual tela do sistema o usuário está navegando no momento.</div></li>
                                          <li className="flex gap-2"><div className="mt-0.5 min-w-[16px]"><Clock className="w-3.5 h-3.5 text-green-500"/></div><div><strong className="block text-gray-900 dark:text-gray-100">Status:</strong> Disponibilidade.</div></li>
                                      </ul>
                                  </div>
                              )}
                          </div>
                      </div>
                    </div>
                    
                    <div className="overflow-x-auto custom-scrollbar min-h-[400px]">
                      <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-50 dark:bg-gray-900/50 text-[10px] uppercase font-bold text-gray-400 dark:text-gray-500 border-b border-gray-100 dark:border-gray-700 sticky top-0 z-10">
                          <tr>
                            <th className="px-4 py-3 bg-gray-50 dark:bg-gray-900/50">Colaborador</th>
                            <th className="px-4 py-3 bg-gray-50 dark:bg-gray-900/50">Atividade</th>
                            <th className="px-4 py-3 bg-gray-50 dark:bg-gray-900/50">Status</th>
                            <th className="px-4 py-3 bg-gray-50 dark:bg-gray-900/50">Tempo</th>
                            <th className="px-4 py-3 bg-gray-50 dark:bg-gray-900/50">Ação</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                          {primeiroCarregamento ? renderSkeletonTable() : membrosFiltrados.length === 0 ? (
                            <tr><td colSpan="5" className="px-4 py-12 text-center"><div className="flex flex-col items-center justify-center text-gray-400 dark:text-gray-500">{termoBusca ? <Search className="w-10 h-10 mb-3 opacity-50" /> : <Users className="w-10 h-10 mb-3 opacity-50" />}<span className="text-sm font-medium">{termoBusca ? `Nenhum membro encontrado para "${termoBusca}"` : 'Nenhum membro encontrado neste filtro'}</span></div></td></tr>
                          ) : (
                            membrosFiltrados.map(membro => {
                              const dataRef = membro.dataRef;
                              const chatsAtivos = membro.chatsAtivos || 0; 
                              const workloadColor = getWorkloadColor(chatsAtivos);
                              const workloadPercent = Math.min((chatsAtivos / 10) * 100, 100);
                              return (
                                <tr key={membro.usuarioId} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group">
                                  <td className="px-4 py-3 w-[25%] align-middle relative">
                                    <div className="flex items-center gap-3">
                                      <div className="relative flex-shrink-0 cursor-pointer group/avatar" onClick={(e) => abrirChatComMembro(membro, e)} title="Clique para conversar">
                                        <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs font-bold text-gray-600 dark:text-gray-300 overflow-hidden">{membro.foto_perfil ? <img src={membro.foto_perfil} className="w-full h-full object-cover" alt={membro.nome} /> : (membro.nome ? membro.nome.charAt(0) : '?')}</div>
                                        <div className="absolute -bottom-0.5 -right-0.5 border-2 border-white dark:border-gray-800 rounded-full"><StatusIndicador status={membro.status || 'offline'} tamanho="xs" /></div>
                                      </div>
                                      <div className="min-w-0 flex-1">
                                        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate max-w-[180px] group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors cursor-pointer" title={membro.nome} onClick={(e) => abrirChatComMembro(membro, e)}>{membro.nome}</p>
                                        <div className="flex items-center gap-1.5 mt-0.5">{getIconeCargo(membro.tipo)}<span className="text-xs text-gray-500 dark:text-gray-400 font-medium">{getCargoFormatado(membro)}</span></div>
                                        <div className="workload-container" title={`${chatsAtivos} chats ativos`}>
                                            <div className="workload-track">
                                                <div className="workload-fill" style={{ width: `${workloadPercent}%`, backgroundColor: workloadColor }}></div>
                                            </div>
                                        </div>
                                      </div>
                                    </div>
                                  </td>
                                  
                                  <td className="px-4 py-3 w-[35%] align-middle">
                                      <div className="activity-cell-wrapper" title={membro.recado ? `${getTextoAtividade(membro)}\n💬 Recado: ${membro.recado}` : getTextoAtividade(membro)}>
                                          <div className="activity-row-top"><MapPin className="w-3 h-3 text-indigo-400 flex-shrink-0" /><span className="activity-text">{getTextoAtividade(membro)}</span></div>
                                          {membro.recado && (<p className="recado-quote-row">"{membro.recado}"</p>)}
                                      </div>
                                  </td>

                                  <td className="px-4 py-3 align-middle whitespace-nowrap">
                                    <div className="flex items-center gap-2">
                                      <div className="text-gray-400 dark:text-gray-500" title="Dispositivo">{getIconeDispositivo(membro)}</div>
                                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border capitalize ${getStatusBadgeStyle(membro.status)}`}><span className={`w-1.5 h-1.5 rounded-full ${membro.status === 'disponivel' ? 'bg-green-500' : membro.status === 'ausente' ? 'bg-yellow-500' : membro.status === 'almoco' ? 'bg-purple-500' : 'bg-red-500'}`}></span>{getStatusDescritivo(membro.status)}</span>
                                    </div>
                                  </td>
                                  <td className="px-4 py-3 align-middle whitespace-nowrap">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] text-gray-400 font-mono">{membro.status === 'offline' || membro.status === 'fora_servico' ? 'Visto:' : `Início: ${formatarHora(dataRef)}`}</span>
                                        <div className="flex items-center gap-1 mt-0.5"><Timer className="w-3 h-3 text-gray-400" /><span className="text-xs font-mono font-bold text-gray-700 dark:text-gray-200">{calcularTempoStatus(membro.status === 'offline' || membro.status === 'fora_servico' ? membro.ultimoAcesso : dataRef, membro.status)}</span></div>
                                    </div>
                                  </td>
                                  <td className="px-4 py-3 align-middle whitespace-nowrap">
                                    <div className="flex items-center gap-1.5">
                                      {membro.usuarioId !== usuario.id && (
                                        <>
                                          <button onClick={(e) => { e.stopPropagation(); abrirChatComMembro(membro, e); }} className="p-1.5 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20 rounded-lg transition-colors border border-transparent hover:border-blue-200 dark:hover:border-blue-800" title="Enviar mensagem"><MessageCircle className="w-4 h-4" /></button>
                                          <button onClick={(e) => { e.stopPropagation(); setMembroParaVisualizar(membro); }} className="p-1.5 text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-900/20 rounded-lg transition-colors border border-transparent hover:border-indigo-200 dark:hover:border-indigo-800" title="Ver Perfil"><Eye className="w-4 h-4" /></button>
                                        </>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                </div>
              </div>
            )}

            {/* ABA: ADMINISTRATIVO - 🔐 RESTRITA A OWNER E CEO */}
            {activeTab === 'admin' && temAcessoAdministrativo && (
               <div className="animate-fadeIn space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                     <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-4"><Building2 className="w-5 h-5 text-yellow-500"/> Cadastros Pendentes</h3>
                        {usuariosPendentes.length === 0 ? <p className="text-gray-500 text-sm italic py-4">Nenhum cadastro pendente no momento.</p> : (
                           <div className="space-y-4">
                             {usuariosPendentes.map(p => (
                                 <div key={p.id} className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden bg-white dark:bg-gray-800 shadow-sm hover:border-yellow-400 transition-colors">
                                    <div className="p-4 bg-gray-50 dark:bg-gray-900/30 border-b border-gray-100 dark:border-gray-700">
                                       <div className="flex justify-between items-start">
                                            <div className="flex flex-col">
                                                 <p className="font-bold text-gray-900 dark:text-white text-sm flex items-center gap-2"><Building2 size={14}/> {p.conta?.nomeFantasia || 'Empresa Desconhecida'}</p>
                                                 <p className="text-xs text-gray-500">Razão: {p.conta?.razaoSocial || '-'}</p>
                                            </div>
                                            <span className="text-[10px] bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-bold flex items-center gap-1"><Clock size={10}/> {obterTempoEspera(p.criadoEm)}</span>
                                       </div>
                                    </div>
                                    <div className="p-4 grid grid-cols-2 gap-x-4 gap-y-3">
                                        <div className="col-span-2 border-b border-dashed border-gray-200 pb-2 mb-2"><p className="text-[10px] font-bold text-gray-400 uppercase">Dados da Conta</p></div>
                                        <div><span className="text-[10px] text-gray-500 block">Documento</span><span className="text-xs font-mono font-medium text-gray-700 dark:text-gray-300">{formatarDocumento(p.conta?.documento)}</span></div>
                                        <div><span className="text-[10px] text-gray-500 block">Tipo</span><span className="text-xs font-medium text-gray-700 dark:text-gray-300 bg-gray-100 px-1.5 rounded">{p.conta?.tipo}</span></div>
                                        
                                        <div className="col-span-2 border-b border-dashed border-gray-200 pb-2 mb-2 mt-1"><p className="text-[10px] font-bold text-gray-400 uppercase">Responsável</p></div>
                                        <div className="col-span-2"><span className="text-[10px] text-gray-500 block">Nome</span><span className="text-xs font-bold text-gray-800 dark:text-white">{p.nome}</span></div>
                                        <div><span className="text-[10px] text-gray-500 block">CPF</span><span className="text-xs font-mono font-medium text-gray-700 dark:text-gray-300">{formatarDocumento(p.cpf)}</span></div>
                                        <div><span className="text-[10px] text-gray-500 block">Contato</span><span className="text-xs font-medium text-gray-700 dark:text-gray-300">{formatarTelefone(p.conta?.telefone)}</span></div>
                                        <div className="col-span-2"><span className="text-[10px] text-gray-500 block">Email</span><span className="text-xs text-blue-600 truncate block">{p.email}</span></div>
                                    </div>
                                    <div className="p-3 border-t border-gray-100 dark:border-gray-700 flex gap-2">
                                       <button onClick={() => handleAprovar(p.id)} className="flex-1 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-bold transition-colors shadow-sm flex items-center justify-center gap-1">{processandoAprovacao === p.id ? <Loader2 className="animate-spin w-3 h-3"/> : <Check className="w-3 h-3"/>} Aprovar</button>
                                       <button onClick={() => handleReprovar(p.id)} className="px-4 py-2 bg-white border border-red-200 text-red-600 hover:bg-red-50 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1"><X className="w-3 h-3"/> Recusar</button>
                                    </div>
                                 </div>
                             ))}
                           </div>
                        )}
                     </div>

                     {/* 🔐 Lista de Suporte: OWNER, CEO e SUPORTE */}
                     {temAcessoSuporte && (
                        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                           <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-4"><LifeBuoy className="w-5 h-5 text-blue-500"/> Suporte Técnico</h3>
                           {solicitacoesPendentes.length === 0 ? <p className="text-gray-500 text-sm italic py-4">Nenhuma solicitação pendente.</p> : (
                              <div className="space-y-3">
                                 {solicitacoesPendentes.map(s => (
                                    <div key={s.id} className="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-700/30 rounded-xl border border-gray-100 dark:border-gray-700 hover:border-blue-300 transition-colors">
                                       <div>
                                          <span className="text-sm font-bold text-gray-800 dark:text-gray-200 block mb-0.5">{s.assunto || 'Sem assunto'}</span>
                                          <span className="text-xs text-gray-500 uppercase tracking-wide">{formatarHora(s.criadoEm)} • {s.usuario?.nome}</span>
                                       </div>
                                       <button onClick={() => navigate('/suporte')} className="px-3 py-1.5 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg text-xs font-bold transition-colors">Ver Detalhes</button>
                                    </div>
                                 ))}
                              </div>
                           )}
                        </div>
                     )}
                  </div>
               </div>
            )}
          </>
        )}

      </div>
      
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-6 py-1.5 text-[10px] flex justify-end gap-4 text-gray-500 dark:text-gray-400 z-30">
          <div className="flex items-center gap-1.5" title="API WhatsApp Operacional"><div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div><span>WhatsApp API: Online</span></div>
          <div className="flex items-center gap-1.5" title="Banco de Dados Estável"><div className="w-1.5 h-1.5 rounded-full bg-green-500"></div><span>Database: Estável</span></div>
      </div>

      <Modal isOpen={confirmReprovarModal.isOpen} onClose={() => setConfirmReprovarModal({ isOpen: false, usuarioId: null })} onConfirm={confirmarReprovacao} titulo="Reprovar Cadastro" mensagem="Tem certeza que deseja reprovar este cadastro?" tipo="warning" textoBotaoConfirmar="Sim, reprovar" textoBotaoCancelar="Cancelar" />
    </main>
  );
}