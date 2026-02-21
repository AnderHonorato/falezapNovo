import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';
import { 
    BarChart3, Activity, MessageSquare, CheckCircle2, 
    User, X, Loader2, TrendingUp, AlertTriangle, 
    CheckCircle, ArrowUpRight, ArrowDownRight, 
    Download, RefreshCw, Clock, Hourglass,
    Maximize2, Minimize2, Sparkles, Copy, 
    Send, PieChart, Users, Trophy, Award, Crown,
    ChevronRight, Calendar, Filter, ChevronDown,
    Smile, Star, AlertOctagon, HelpCircle, Tag,
    FileSpreadsheet, FileText, Lightbulb, ListFilter
} from 'lucide-react';
import {
    LineChart, Line, PieChart as RechartsPie, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer
} from 'recharts';
import api from '../servicos/api';
import toast from 'react-hot-toast';
import { 
    format, isSameDay, subMonths, startOfMonth, endOfMonth, 
    isWithinInterval, parseISO, startOfDay, endOfDay, 
    differenceInMinutes, subDays, isValid, getDay, getHours, 
    startOfWeek, endOfWeek, subYears 
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import ReactMarkdown from 'react-markdown';
import { useAuth } from '../contextos/AuthContext'; 
import StatusIndicador from '../componentes/StatusIndicador';

// --- CORES & CONSTANTES ---
const CORES = {
    enviadas: '#00a884',
    recebidas: '#0088FE',
    usuarios: ['#00a884', '#0088FE', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#8dd1e1'],
    tags: ['#f472b6', '#22d3ee', '#a78bfa', '#fbbf24', '#34d399', '#f87171']
};

// --- COMPONENTES AUXILIARES ---

// Esqueleto SEM PULSAR
const StaticSkeleton = ({ className }) => (
    <div className={`bg-gray-200 dark:bg-gray-700 rounded-md ${className}`}></div>
);

class ErrorBoundary extends React.Component {
    constructor(props) { super(props); this.state = { hasError: false }; }
    static getDerivedStateFromError(error) { return { hasError: true }; }
    render() {
        if (this.state.hasError) {
            return (
                <div className="flex flex-col items-center justify-center h-full p-10 text-center bg-white dark:bg-gray-900">
                    <AlertTriangle size={48} className="text-red-500 mb-4" />
                    <h2 className="text-lg font-bold dark:text-white">Algo deu errado nesta seção.</h2>
                    <button onClick={() => window.location.reload()} className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm">Recarregar Página</button>
                </div>
            );
        }
        return this.props.children;
    }
}

// KPI Card
const StatCardHeader = ({ titulo, valor, icone: Icon, cor, loading, volume, onClick, activeId, id, comparativo }) => {
    const iconColors = { yellow: "text-amber-500", purple: "text-purple-500", green: "text-emerald-500", red: "text-rose-500", blue: "text-blue-500", cyan: "text-cyan-500" };
    const isActive = activeId === id;
    const isPositive = comparativo >= 0;
    
    const valorExibido = (valor === undefined || valor === null) ? 0 : valor;
    
    return (
        <div 
            id={`kpi-${id}`}
            onClick={(e) => onClick && onClick(e, id)}
            className={`flex flex-col items-center px-4 border-r border-gray-100 dark:border-gray-700 last:border-r-0 min-w-[110px] transition-all duration-200 relative ${onClick ? 'cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700/50' : ''} ${isActive ? 'bg-gray-100 dark:bg-gray-800' : ''}`}
        >
            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                {titulo} {onClick && <ChevronRight size={10} className={`transition-transform duration-300 ${isActive ? 'rotate-90' : ''}`} />}
            </span>
            <div className="flex items-center gap-1.5 mt-1">
                <Icon size={14} className={iconColors[cor] || "text-gray-500"} strokeWidth={2.5} />
                {loading ? (
                    <StaticSkeleton className="h-5 w-12" />
                ) : (
                    <span className="text-base font-black text-gray-700 dark:text-gray-200">{valorExibido}</span>
                )}
            </div>
            
            <div className="flex items-center gap-2 mt-0.5 min-h-[12px]">
                 {loading ? <StaticSkeleton className="h-2 w-10 mt-1" /> : (
                    comparativo !== undefined ? (
                        <div className={`flex items-center gap-0.5 text-[8px] font-bold ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                            {isPositive ? <ArrowUpRight size={8}/> : <ArrowDownRight size={8}/>}
                            {Math.abs(comparativo)}%
                        </div>
                    ) : volume !== undefined && (
                      <span className="text-[8px] font-bold text-gray-400">Total: {volume}</span>
                    )
                 )}
            </div>
            {isActive && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3 h-3 bg-white dark:bg-gray-800 border-t border-l border-gray-200 dark:border-gray-700 rotate-45 translate-y-1.5 z-20"></div>}
        </div>
    );
};

// IA Analista
const AnalistaDados = ({ contextoCompleto, loadingGeral, onExpand, isExpanded }) => {
    const { usuario } = useAuth(); 
    const [mensagens, setMensagens] = useState([]); 
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0, visible: false });
    const [perfilAberto, setPerfilAberto] = useState(false);
    const scrollRef = useRef(null);
    const popoverRef = useRef(null);
    const textareaRef = useRef(null); 

    const sugestoes = ["Quem está online?", "Qual o TMA da equipe?", "Resuma o volume de hoje"];

    useEffect(() => {
        if (usuario?.nome && mensagens.length === 0) {
            const primeiroNome = usuario.nome.split(' ')[0];
            setMensagens([{ id: 'msg-inicial', role: 'model', texto: `Olá, **${primeiroNome}**. Tudo bem? 😄\n\nSou a **Insighta IA**. Especializada em análise de dados de atendimento. O que deseja analisar agora? 📊` }]);
        }
    }, [usuario, mensagens.length]);

    useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [mensagens]);
    
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 100)}px`;
        }
    }, [input]);

    useEffect(() => {
        const handleClickOutside = (event) => { if (popoverRef.current && !popoverRef.current.contains(event.target)) setPerfilAberto(false); };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleCopy = (e, texto) => {
        e.stopPropagation();
        navigator.clipboard.writeText(texto);
        setMousePos({ x: e.clientX, y: e.clientY, visible: true });
        setTimeout(() => setMousePos(prev => ({ ...prev, visible: false })), 1500);
    };

const handleEnviar = async (e, sugestao = null) => {
        if(e) e.preventDefault();
        const textoUsuario = sugestao || input;
        if (!textoUsuario.trim() || loading) return;
        
        setInput('');
        setMensagens(prev => [...prev, { id: Date.now(), role: 'user', texto: textoUsuario }]);
        setLoading(true);
        
        try {
            // --- OTIMIZAÇÃO CRÍTICA DO PAYLOAD ---
            // Cria uma versão "leve" do contexto, removendo objetos pesados que causam erro de conexão
            const contextoLeve = {
                kpis: contextoCompleto.kpis,
                // Mapeia equipe apenas com nome e status, removendo fotos e dados extras
                equipe_online: (contextoCompleto.breakdowns?.equipe || []).map(u => ({ nome: u.nome, status: u.status })),
                // Mapeia ranking simplificado
                ranking_resumo: (contextoCompleto.ranking_top5 || []).map(u => ({ nome: u.nome, atendimentos: u.atendimentos, tma: u.tma })),
                // Resumo de volumes
                conversas_status: contextoCompleto.breakdowns?.conversas,
                tags_principais: contextoCompleto.tags
            };

            const contextoString = JSON.stringify(contextoLeve);
            
            // Envia apenas o contexto leve e as últimas 4 mensagens de histórico
            const res = await api.post('/ia/analise-analytics', { 
                pergunta: textoUsuario, 
                contexto: contextoString, 
                historico: mensagens.slice(-4).map(m => ({ role: m.role, content: m.texto })) 
            });
            
            setMensagens(prev => [...prev, { id: Date.now() + 1, role: 'model', texto: res.data.resposta }]);
        } catch (error) {
            console.error("Erro IA Analytics:", error);
            setMensagens(prev => [...prev, { id: Date.now() + 1, role: 'model', texto: '⚠️ Tive um problema de conexão. Tente ser mais específico.' }]);
        } finally { setLoading(false); }
    };

    return (
        <div className={`flex flex-col h-full bg-white dark:bg-gray-800 rounded-t-2xl md:rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden relative transition-all duration-300 ${isExpanded ? 'fixed inset-4 md:inset-10 z-[300] shadow-2xl' : 'relative'}`}>
            {mousePos.visible && <div className="fixed z-[400] pointer-events-none bg-indigo-600 text-white text-[10px] font-bold px-2 py-1 rounded shadow-lg animate-bounce" style={{ left: mousePos.x, top: mousePos.y - 30 }}>Copiado!</div>}

            <div className="p-3 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 flex items-center justify-between shrink-0 relative">
                <div className="flex items-center gap-2 cursor-pointer group" onClick={() => setPerfilAberto(!perfilAberto)}>
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-full flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform"><Activity size={16} /></div>
                    <div><h3 className="text-xs font-bold text-gray-800 dark:text-white leading-none">Insighta IA</h3><div className="flex items-center gap-1 mt-1"><span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span><p className="text-[10px] text-gray-500 dark:text-gray-400">Online - Pronto para analisar</p></div></div>
                </div>
                <button onClick={onExpand} className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg text-gray-500 transition-colors">{isExpanded ? <Minimize2 size={16}/> : <Maximize2 size={16}/>}</button>
                
                {perfilAberto && (
                    <div ref={popoverRef} className="absolute top-full left-3 mt-2 w-64 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 z-[310] p-4 animate-scaleIn">
                        <div className="flex flex-col items-center text-center">
                            <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-full flex items-center justify-center text-white mb-3 shadow-lg"><Activity size={32} /></div>
                            <h4 className="text-sm font-bold text-gray-900 dark:text-white">Insighta IA</h4>
                            <span className="text-[9px] px-2 py-0.5 bg-blue-100 dark:bg-blue-900/40 text-blue-600 rounded-full font-bold uppercase tracking-wider mb-2">Beta v1.0.0</span>
                            <p className="text-[11px] text-gray-600 dark:text-gray-400 leading-relaxed">Especialista em inteligência de dados.</p>
                            <p className="text-[11px] text-gray-600 dark:text-gray-400 leading-relaxed">A Insighta pode cometer erros. Por isso, é bom checar as respostas.</p>
                        </div>
                    </div>
                )}
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-[#f8f9fa] dark:bg-gray-900/20" ref={scrollRef}>
                {mensagens.map(msg => (
                    <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} group relative`}>
                        <div className={`relative max-w-[85%] rounded-2xl px-3 py-2 text-xs leading-relaxed shadow-sm transition-all ${msg.role === 'user' ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-bl-none border border-gray-200 dark:border-gray-600'}`}>
                            {/* FIX: Componentes customizados para forçar espaçamento entre parágrafos */}
                            <ReactMarkdown components={{
                                p: ({node, ...props}) => <p className="mb-2 last:mb-0" {...props} />
                            }}>
                                {msg.texto}
                            </ReactMarkdown>
                            {msg.role === 'model' && <button onClick={(e) => handleCopy(e, msg.texto)} className="absolute -right-2 -top-2 opacity-0 group-hover:opacity-100 p-1.5 bg-indigo-500 text-white rounded-full shadow-lg hover:scale-110 transition-all z-10"><Copy size={10}/></button>}
                        </div>
                    </div>
                ))}
                {loading && <div className="flex justify-start"><div className="bg-white dark:bg-gray-700 rounded-2xl px-3 py-2 border border-gray-100 dark:border-gray-600 shadow-sm"><Loader2 size={14} className="animate-spin text-gray-400" /></div></div>}
            </div>
            
            <div className="px-3 py-2 flex gap-1.5 overflow-x-auto no-scrollbar bg-white dark:bg-gray-800 border-t border-gray-50 shrink-0">
                {sugestoes.map((s, i) => (
                    <button key={i} onClick={() => handleEnviar(null, s)} className="whitespace-nowrap px-2.5 py-1 bg-gray-50 dark:bg-gray-700 hover:bg-indigo-50 text-[10px] text-gray-600 dark:text-gray-300 rounded-full border border-gray-200 transition-colors flex items-center gap-1"><Sparkles size={10} className="text-amber-500" /> {s}</button>
                ))}
            </div>

            <div className="p-2 border-t border-gray-100 bg-white dark:bg-gray-800 shrink-0">
                <form onSubmit={handleEnviar} className="relative flex items-end gap-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 rounded-xl px-2.5 py-2">
                    <textarea 
                        ref={textareaRef}
                        rows="1" 
                        value={input} 
                        onChange={e => setInput(e.target.value)} 
                        onKeyDown={e => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleEnviar(e); } }} 
                        placeholder="Pergunte sobre os gráficos..." 
                        className="flex-1 bg-transparent border-none outline-none text-xs dark:text-white placeholder:text-gray-400 resize-none py-0.5 custom-scrollbar max-h-24" 
                    />
                    <button type="submit" disabled={!input.trim() || loading} className="p-1.5 bg-indigo-600 text-white rounded-lg active:scale-95 disabled:opacity-50 shrink-0"><Send size={12} /></button>
                </form>
            </div>
        </div>
    );
};

// Tutorial Overlay
const TutorialOverlay = ({ steps, activeStep, onClose, onNext, onPrev }) => {
    const currentStep = steps[activeStep];
    const [position, setPosition] = useState(null);

    useEffect(() => {
        if (!currentStep) return;
        const element = document.getElementById(currentStep.targetId);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            setTimeout(() => {
                const rect = element.getBoundingClientRect();
                let top = rect.bottom + 15;
                let left = rect.left;
                if (top + 200 > window.innerHeight) top = rect.top - 210; 
                if (left + 300 > window.innerWidth) left = window.innerWidth - 320; 
                if (left < 10) left = 10;
                setPosition({ rect, balloon: { top, left } });
            }, 100);
        }
    }, [activeStep, steps]);

    if (!position || !currentStep) return null;

    return (
        <div className="fixed inset-0 z-[9999] overflow-hidden">
            <div className="absolute inset-0 bg-black/50 transition-all duration-300"></div>
            <div className="absolute border-2 border-white rounded-xl shadow-[0_0_0_9999px_rgba(0,0,0,0.5)] transition-all duration-300 ease-in-out" style={{ top: position.rect.top - 4, left: position.rect.left - 4, width: position.rect.width + 8, height: position.rect.height + 8, zIndex: 10 }}>
                <span className="absolute -top-1 -right-1 flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500"></span></span>
            </div>
            <div className="absolute bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-2xl max-w-sm w-full animate-scaleIn" style={{ top: position.balloon.top, left: position.balloon.left, zIndex: 20 }}>
                <div className="flex justify-between items-start mb-2"><span className="bg-indigo-100 text-indigo-700 text-[10px] font-bold px-2 py-0.5 rounded-full">DICA {activeStep + 1}/{steps.length}</span><button onClick={onClose}><X size={16} className="text-gray-400"/></button></div>
                <h3 className="font-bold text-sm text-gray-800 dark:text-white mb-1">{currentStep.title}</h3>
                <p className="text-xs text-gray-500 leading-relaxed mb-3">{currentStep.content}</p>
                <div className="flex justify-between"><button onClick={onPrev} disabled={activeStep===0} className="text-xs font-bold text-gray-400 disabled:opacity-30">Voltar</button><button onClick={onNext} className="bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold">{activeStep === steps.length-1 ? 'Concluir' : 'Próximo'}</button></div>
            </div>
        </div>
    );
};

// --- COMPONENTE PRINCIPAL ---
function AnalyticsContent() {
    const { usuario } = useAuth();
    const { temaEscuro } = useOutletContext() || { temaEscuro: false };
    
    // Estados básicos
    const [dados, setDados] = useState({ mensagensPorDia: [] });
    const [rankingUsuarios, setRankingUsuarios] = useState([]);
    const [todasConversasCache, setTodasConversasCache] = useState([]); 
    const [equipeOnline, setEquipeOnline] = useState([]);
    const [loading, setLoading] = useState(true);
    const [atualizando, setAtualizando] = useState(false);
    const [isChatExpanded, setIsChatExpanded] = useState(false);
    const [autoSync, setAutoSync] = useState(true);
    const [timerSinc, setTimerSinc] = useState(0);
    const [ultimaAtualizacao, setUltimaAtualizacao] = useState(new Date());
    
    // Filtros e Visualização
    const [filtroUsuario, setFiltroUsuario] = useState(null);
    const [filtroPeriodo, setFiltroPeriodo] = useState('mes_atual');
    const [customDate, setCustomDate] = useState({ inicio: format(subDays(new Date(), 7), 'yyyy-MM-dd'), fim: format(new Date(), 'yyyy-MM-dd') });
    
    // Tour e Popovers
    const [tourAtivo, setTourAtivo] = useState(false);
    const [tourStep, setTourStep] = useState(0);
    const [popoverState, setPopoverState] = useState({ activeId: null, position: { top: 0, left: 0 }, align: 'left' });
    const popoverRef = useRef(null);

    // Resumo IA
    const [resumoIA, setResumoIA] = useState(null);
    const [gerandoResumo, setGerandoResumo] = useState(false);
    
    const tourSteps = [
        { targetId: 'tour-header', title: 'Painel de Controle', content: 'Controles de data, sincronização e exportação.' },
        { targetId: 'kpi-conversas', title: 'KPIs e Detalhes', content: 'Clique nos cards (Conversas, Equipe, etc) para ver os balões com dados detalhados.' },
        { targetId: 'main-content', title: 'Gráficos e Tags', content: 'Visão de volume e assuntos.' },
        { targetId: 'tour-ranking', title: 'Ranking Interativo', content: 'Clique em um usuário para filtrar todo o painel pelos dados dele (Drill-down).' },
    ];

    // Helper de Datas
    const getIntervaloDatas = (tipo) => {
        const hoje = new Date();
        switch(tipo) {
            case 'hoje': return { inicio: startOfDay(hoje), fim: endOfDay(hoje) };
            case 'semana': return { inicio: startOfWeek(hoje, { weekStartsOn: 1 }), fim: endOfWeek(hoje, { weekStartsOn: 1 }) };
            case 'mes_atual': return { inicio: startOfMonth(hoje), fim: endOfMonth(hoje) };
            case 'mes_passado': return { inicio: startOfMonth(subMonths(hoje, 1)), fim: endOfMonth(subMonths(hoje, 1)) };
            case '3_meses': return { inicio: subMonths(hoje, 3), fim: hoje };
            case '6_meses': return { inicio: subMonths(hoje, 6), fim: hoje };
            case 'ano': return { inicio: subYears(hoje, 1), fim: hoje };
            case 'personalizado': 
                return { 
                    inicio: customDate.inicio ? parseISO(customDate.inicio) : subDays(hoje, 7), 
                    fim: customDate.fim ? parseISO(customDate.fim) : hoje 
                };
            default: return { inicio: startOfMonth(hoje), fim: endOfMonth(hoje) };
        }
    };

    const periodos = [
        { id: 'hoje', label: 'Hoje' },
        { id: 'semana', label: 'Esta semana' },
        { id: 'mes_atual', label: 'Este mês' },
        { id: 'mes_passado', label: 'Mês passado' },
        { id: 'personalizado', label: 'Personalizado' }
    ];

    const carregarTudo = async (silencioso = false) => {
        if (!usuario?.contaId) return;

        if (!silencioso) setLoading(true); else setAtualizando(true);
        try {
            const { inicio, fim } = getIntervaloDatas(filtroPeriodo);
            const params = { inicio: inicio.toISOString(), fim: fim.toISOString() };

            const resAnalytics = await api.get('/analytics', { params });
            if (resAnalytics.data?.dados) setDados(resAnalytics.data.dados);

            const resConversas = await api.get('/conversas', { params: { contaId: usuario.contaId, itensPorPagina: 5000, semPaginacao: true } });
            const conversas = resConversas.data?.conversas || [];
            
            const conversasNoPeriodo = conversas.filter(c => {
                const dataStr = c.criadaEm || c.ultimaMensagemEm;
                if (!dataStr) return false;
                const dataConv = new Date(dataStr);
                if (!isValid(dataConv)) return false;
                return isWithinInterval(dataConv, { start: inicio, end: fim });
            });
            
            setTodasConversasCache(conversasNoPeriodo);

            const resEquipe = await api.get('/usuarios/equipe-online');
            const equipeDados = Array.isArray(resEquipe.data?.usuarios) ? resEquipe.data.usuarios : [];
            setEquipeOnline(equipeDados);

            const finalizadas = conversasNoPeriodo.filter(c => c.contaId === usuario.contaId && c.statusConversa === 'FINALIZADA' && c.usuarioResponsavelId);
            const stats = {};
            
            finalizadas.forEach(c => {
                const uid = c.usuarioResponsavelId;
                if (!stats[uid]) stats[uid] = { count: 0, somaTma: 0 };
                stats[uid].count++;
                if (c.criadaEm && c.finalizadaEm) {
                    const inicioC = new Date(c.criadaEm);
                    const fimC = new Date(c.finalizadaEm);
                    if (isValid(inicioC) && isValid(fimC)) {
                        const diff = differenceInMinutes(fimC, inicioC);
                        if (diff > 0 && diff < 480) stats[uid].somaTma += diff;
                    }
                }
            });

            const resUsers = await api.get(`/usuarios?contaId=${usuario.contaId}`);
            const users = resUsers.data || [];
            
            setRankingUsuarios(users.map(u => ({
                ...u, 
                atendimentos: stats[u.id]?.count || 0,
                tma: stats[u.id]?.count ? Math.round(stats[u.id].somaTma / stats[u.id].count) : 0
            })).sort((a,b) => b.atendimentos - a.atendimentos));

            setUltimaAtualizacao(new Date());
            setTimerSinc(0);

        } catch (error) { 
            console.error('Erro Analytics:', error); 
            if (!dados.mensagensPorDia.length) setDados({ mensagensPorDia: [] });
        } finally { 
            setLoading(false); 
            setAtualizando(false); 
        }
    };

    useEffect(() => { carregarTudo(); }, [usuario?.contaId, filtroPeriodo, customDate.inicio, customDate.fim]); 
    useEffect(() => { if (autoSync) { const i = setInterval(() => carregarTudo(true), 60000); return () => clearInterval(i); } }, [autoSync, usuario]);
    useEffect(() => { if (autoSync) { const i = setInterval(() => setTimerSinc(p => p >= 100 ? 0 : p + (100 / 60)), 1000); return () => clearInterval(i); } }, [autoSync]);

    useEffect(() => {
        const handleClickOutside = (e) => { if (popoverRef.current && !popoverRef.current.contains(e.target)) setPopoverState(prev => ({ ...prev, activeId: null })); };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const dadosFiltrados = useMemo(() => {
        if (!todasConversasCache) return [];
        return todasConversasCache.filter(c => {
            if (filtroUsuario && c.usuarioResponsavelId !== filtroUsuario.id) return false;
            return true;
        });
    }, [todasConversasCache, filtroUsuario]);

    const graficoData = useMemo(() => {
        return dados?.mensagensPorDia || [];
    }, [dados]);
    
    const breakdowns = useMemo(() => {
        return {
            conversas: {
                abertas: dadosFiltrados.filter(c => c.statusConversa === 'ABERTA' || c.statusConversa === 'EM_ATENDIMENTO').length,
                finalizadas: dadosFiltrados.filter(c => c.statusConversa === 'FINALIZADA').length,
                pendentes: dadosFiltrados.filter(c => c.statusConversa === 'PENDENTE' || c.statusConversa === 'AGUARDANDO').length
            },
            mensagens: {
                enviadas: graficoData.reduce((acc, curr) => acc + (curr.enviadas || 0), 0),
                recebidas: graficoData.reduce((acc, curr) => acc + (curr.recebidas || 0), 0)
            },
            equipe: equipeOnline
        };
    }, [dadosFiltrados, graficoData, equipeOnline]);

    const kpis = useMemo(() => {
        let somaTMA = 0, countTMA = 0;
        const finalizadas = dadosFiltrados.filter(c => c.statusConversa === 'FINALIZADA');
        finalizadas.forEach(c => {
            if(c.criadaEm && c.finalizadaEm) {
                const inicio = new Date(c.criadaEm);
                const fim = new Date(c.finalizadaEm);
                if(isValid(inicio) && isValid(fim)) {
                    const diff = differenceInMinutes(fim, inicio);
                    if(diff > 0 && diff < 480) { somaTMA += diff; countTMA++; }
                }
            }
        });
        const tmaValor = countTMA ? Math.round(somaTMA / countTMA) : 0;
        return {
            totalMsgs: breakdowns.mensagens.enviadas + breakdowns.mensagens.recebidas,
            totalUsers: breakdowns.equipe.length,
            conversas: dadosFiltrados.length,
            finalizadasHoje: breakdowns.conversas.finalizadas,
            tma: tmaValor,
            tme: Math.round(tmaValor * 0.2)
        };
    }, [breakdowns, dadosFiltrados]);

    const fullContext = useMemo(() => ({
        kpis,
        breakdowns,
        tags: [{ name: 'Suporte', value: 45 }, { name: 'Vendas', value: 30 }, { name: 'Financeiro', value: 15 }, { name: 'Outros', value: 10 }], 
        ranking_top5: rankingUsuarios.slice(0, 5)
    }), [kpis, breakdowns, rankingUsuarios]);

    const handleTriggerClick = (e, id, align = 'left') => {
        e.stopPropagation();
        if (popoverState.activeId === id) setPopoverState({ activeId: null, position: {top:0, left:0}, align: 'left' });
        else {
            const rect = e.currentTarget.getBoundingClientRect();
            setPopoverState({ activeId: id, position: { top: rect.bottom + 8, left: rect.left, right: rect.right }, align });
        }
    };

    const handleGerarResumo = async () => {
        setGerandoResumo(true);
        try {
            const contextoString = JSON.stringify(fullContext);
            const res = await api.post('/ia/analise-analytics', { 
                pergunta: "Gere um resumo executivo completo sobre estes dados de performance.", 
                contexto: contextoString,
                historico: [] 
            });
            setResumoIA(res.data.resposta);
        } catch (error) { toast.error('Falha ao gerar relatório inteligente.'); } finally { setGerandoResumo(false); }
    };

    const handleExportarExcel = () => {
        if (!dadosFiltrados || dadosFiltrados.length === 0) return toast.error('Sem dados para exportar.');
        let csvContent = "data:text/csv;charset=utf-8,\ufeffData;Cliente;Responsável;Status;Tempo(min)\n";
        dadosFiltrados.forEach(c => {
             const dataFmt = c.criadaEm ? format(new Date(c.criadaEm), "dd/MM/yyyy HH:mm") : '-';
             const resp = rankingUsuarios.find(u => u.id === c.usuarioResponsavelId)?.nome || 'N/A';
             const tma = (c.finalizadaEm && c.criadaEm) ? differenceInMinutes(new Date(c.finalizadaEm), new Date(c.criadaEm)) : 0;
             csvContent += `${dataFmt};${c.nomeContato || c.numeroCliente};${resp};${c.statusConversa};${tma}\n`;
        });
        const link = document.createElement("a");
        link.setAttribute("href", encodeURI(csvContent));
        link.setAttribute("download", `Analytics_Export_${format(new Date(), 'dd-MM-yyyy')}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setPopoverState({activeId:null});
        toast.success("CSV exportado com sucesso.");
    };
    
    const handlePrint = () => {
        window.print();
        setPopoverState({activeId:null});
    };

    const renderFloatingPopover = () => {
        if (!popoverState.activeId) return null;
        const { activeId, position, align } = popoverState;
        let conteudo = null;
        let largura = 'w-[300px]';

        if (activeId === 'conversas') {
            conteudo = (
                <div className="grid grid-cols-3 gap-2">
                    <div className="bg-gray-50 p-2 rounded text-center"><span className="text-[9px] block text-gray-400 font-bold uppercase">Abertas</span><span className="font-bold text-gray-800 text-lg">{breakdowns.conversas.abertas}</span></div>
                    <div className="bg-green-50 p-2 rounded text-center"><span className="text-[9px] block text-green-600 font-bold uppercase">Finaliz.</span><span className="font-bold text-green-700 text-lg">{breakdowns.conversas.finalizadas}</span></div>
                    <div className="bg-yellow-50 p-2 rounded text-center"><span className="text-[9px] block text-yellow-600 font-bold uppercase">Penden.</span><span className="font-bold text-yellow-700 text-lg">{breakdowns.conversas.pendentes}</span></div>
                </div>
            );
        } else if (activeId === 'mensagens') {
            conteudo = (
                <div className="grid grid-cols-2 gap-2">
                    <div className="bg-green-50 p-2 rounded text-center"><span className="text-green-600 font-bold text-xs">Enviadas</span><br/><span className="font-black text-green-700 text-lg">{breakdowns.mensagens.enviadas}</span></div>
                    <div className="bg-blue-50 p-2 rounded text-center"><span className="text-blue-600 font-bold text-xs">Recebidas</span><br/><span className="font-black text-blue-700 text-lg">{breakdowns.mensagens.recebidas}</span></div>
                </div>
            );
        } else if (activeId === 'equipe') {
            conteudo = (
                <div className="max-h-[200px] overflow-y-auto custom-scrollbar">
                    {breakdowns.equipe.length > 0 ? breakdowns.equipe.map(u => (
                        <div key={u.id} className="flex justify-between items-center p-2 border-b last:border-0 hover:bg-gray-50">
                            <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-[10px] font-bold">{u.nome?.charAt(0)}</div>
                                <span className="text-xs font-bold text-gray-700">{u.nome}</span>
                            </div>
                            <StatusIndicador status={u.status} tamanho="sm"/>
                        </div>
                    )) : <p className="text-center text-xs text-gray-400 py-2">Nenhum membro online.</p>}
                </div>
            );
        } else if (activeId === 'tma' || activeId === 'tme') {
            conteudo = <div className="p-2 text-center text-xs text-gray-500">Média calculada com base nas conversas finalizadas no período. <br/><strong>Meta: 45m</strong></div>;
        } else if (activeId === 'exportar') {
            largura = 'w-[280px]';
            conteudo = (
                <div className="space-y-2">
                    <div className="bg-gray-50 p-2 rounded mb-2">
                        <p className="text-[10px] text-gray-500 mb-1 font-bold">DADOS SELECIONADOS:</p>
                        <p className="text-xs font-mono">{format(getIntervaloDatas(filtroPeriodo).inicio, 'dd/MM/yyyy')} - {format(getIntervaloDatas(filtroPeriodo).fim, 'dd/MM/yyyy')}</p>
                    </div>
                    <button onClick={handleExportarExcel} className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded text-xs font-bold flex justify-center gap-2 transition-colors"><FileSpreadsheet size={14}/> Baixar CSV (Excel)</button>
                    <button onClick={handlePrint} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded text-xs font-bold flex justify-center gap-2 transition-colors"><FileText size={14}/> Imprimir / Salvar PDF</button>
                </div>
            );
        }

        const style = { top: position.top, left: align === 'left' ? position.left : 'auto', right: align === 'right' ? window.innerWidth - position.right : 'auto' };
        return <div ref={popoverRef} className={`fixed z-[999] bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 ${largura} animate-scaleIn p-3`} style={style}>{conteudo}</div>;
    };

    const alertaSmart = kpis.tma > 60 ? { msg: 'Alerta: TMA alto detectado no período', color: 'bg-red-500' } : null;

    return (
        <div className="flex flex-col h-full bg-[#f8f9fa] dark:bg-gray-900 relative overflow-hidden">
            {autoSync && <div className="absolute top-0 left-0 w-full h-0.5 bg-gray-100 z-[100]"><div className="h-full bg-blue-500 transition-all duration-1000 ease-linear" style={{ width: `${timerSinc}%` }}></div></div>}
            
            {alertaSmart && (
                <div className={`absolute top-0 left-0 right-0 z-50 px-4 py-2 text-xs font-bold text-white flex justify-center items-center gap-2 animate-slide-down ${alertaSmart.color}`}>
                    <AlertOctagon size={14}/> {alertaSmart.msg}
                    <button onClick={() => {}} className="ml-4 hover:bg-white/20 rounded-full p-0.5"><X size={12}/></button>
                </div>
            )}

            {/* HEADER */}
            <div id="tour-header" className="bg-white dark:bg-gray-800 border-b px-4 py-4 shadow-sm z-10 shrink-0 relative">
                <div className="flex flex-col gap-4">
                    {/* Linha Superior: Título e Ações */}
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                        <div>
                            <h1 className="text-xl font-bold flex items-center gap-2 dark:text-white"><BarChart3 className="text-blue-600" size={24} />Análises</h1>
                             <p className="text-gray-500 dark:text-gray-400 text-xs mt-0.5">Visão geral de métricas, volume de mensagens e produtividade da equipe.</p>
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                             {/* Cards de KPI */}
                             <div className="flex bg-gray-50 dark:bg-gray-900/50 rounded-xl border p-1 hidden lg:flex">
                                <StatCardHeader id="conversas" activeId={popoverState.activeId} titulo="Conversas" valor={kpis.conversas} icone={MessageSquare} cor="purple" loading={loading} onClick={(e, id) => handleTriggerClick(e, id)} />
                                <StatCardHeader id="mensagens" activeId={popoverState.activeId} titulo="Mensagens" valor={kpis.totalMsgs} icone={Activity} cor="blue" loading={loading} onClick={(e, id) => handleTriggerClick(e, id)} />
                                <StatCardHeader id="tma" activeId={popoverState.activeId} titulo="TMA" valor={`${kpis.tma}m`} icone={Clock} cor="cyan" loading={loading} onClick={(e, id) => handleTriggerClick(e, id)} comparativo={-2} />
                                <StatCardHeader id="tme" activeId={popoverState.activeId} titulo="TME" valor={`${kpis.tme}m`} icone={Hourglass} cor="yellow" loading={loading} onClick={(e, id) => handleTriggerClick(e, id)} comparativo={5} />
                                <StatCardHeader id="equipe" activeId={popoverState.activeId} titulo="Equipe" valor={kpis.totalUsers} icone={Users} cor="yellow" loading={loading} onClick={(e, id) => handleTriggerClick(e, id)} />
                             </div>
                             
                             {/* Botão de Ajuda ao lado dos KPIs (fora do container) */}
                             <button onClick={() => setTourAtivo(true)} className="p-2 bg-blue-50 text-blue-600 rounded-full hover:bg-blue-100 transition-colors mr-2"><HelpCircle size={16}/></button>

                             {/* Botão Atualizar com Hora */}
                             <div className="flex items-center gap-2">
                                 <button onClick={() => carregarTudo()} disabled={atualizando || loading} className="flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-gray-700 border border-gray-200 rounded-xl text-[10px] font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-50 transition-all shadow-sm">
                                    <RefreshCw size={12} className={atualizando ? 'animate-spin' : ''} /> {atualizando ? 'Sinc...' : 'Atualizar'}
                                    <span className="text-gray-400 font-mono ml-1">| {format(ultimaAtualizacao, "HH:mm")}</span>
                                 </button>
                             </div>

                             {/* Resumo IA ao lado do Exportar */}
                             <button onClick={handleGerarResumo} disabled={gerandoResumo || loading} className="bg-purple-600 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg hover:bg-purple-700 transition-colors">
                                {gerandoResumo ? <Loader2 size={14} className="animate-spin"/> : <Sparkles size={14}/>} <span className="hidden sm:inline">Resumo IA</span>
                             </button>
                        </div>
                    </div>
                </div>
                {/* KPIs Mobile */}
                <div className="flex bg-gray-50 dark:bg-gray-900/50 rounded-xl border p-1 mt-3 overflow-x-auto lg:hidden">
                    <StatCardHeader id="conversas" activeId={popoverState.activeId} titulo="Conversas" valor={kpis.conversas} icone={MessageSquare} cor="purple" loading={loading} onClick={(e, id) => handleTriggerClick(e, id)} />
                    <StatCardHeader id="mensagens" activeId={popoverState.activeId} titulo="Mensagens" valor={kpis.totalMsgs} icone={Activity} cor="blue" loading={loading} onClick={(e, id) => handleTriggerClick(e, id)} />
                    <StatCardHeader id="tma" activeId={popoverState.activeId} titulo="TMA" valor={`${kpis.tma}m`} icone={Clock} cor="cyan" loading={loading} onClick={(e, id) => handleTriggerClick(e, id)} />
                    <StatCardHeader id="equipe" activeId={popoverState.activeId} titulo="Equipe" valor={kpis.totalUsers} icone={Users} cor="yellow" loading={loading} onClick={(e, id) => handleTriggerClick(e, id)} />
                </div>
            </div>

            {renderFloatingPopover()}

            <div id="main-content" className="flex-1 flex flex-col md:flex-row overflow-hidden p-4 gap-4 relative">
                <div className={`flex-[1.4] flex flex-col gap-4 overflow-hidden`}>

                     {/* FILTROS TIPO BOTÃO (PÍLULA) - ESTILO IAAprendizado */}
                     <div className="flex flex-wrap items-center gap-2 bg-white dark:bg-gray-800 p-3 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm shrink-0 mb-0">
                         <span className="text-[10px] font-bold text-gray-500 uppercase flex items-center gap-1 mr-2"><ListFilter size={14}/> Período:</span>
                         
                         {/* Botões de Período Mapeados */}
                         {periodos.map(p => (
                            <button 
                                key={p.id}
                                onClick={() => setFiltroPeriodo(p.id)}
                                className={`px-3 py-1.5 rounded-full text-[10px] font-bold border transition-all ${
                                    filtroPeriodo === p.id 
                                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' 
                                    : 'bg-white dark:bg-gray-900 text-gray-500 border-gray-200 dark:border-gray-600 hover:border-indigo-300 dark:text-gray-300'
                                }`}
                            >
                                {p.label}
                            </button>
                         ))}

                        {filtroPeriodo === 'personalizado' && (
                            <div className="flex items-center gap-2 animate-fadeIn ml-2 bg-gray-50 dark:bg-gray-900 p-1 rounded-lg border border-gray-100 dark:border-gray-700">
                                <input type="date" value={customDate.inicio} onChange={e=>setCustomDate({...customDate, inicio:e.target.value})} className="py-1 px-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-md text-[10px] outline-none dark:text-white" />
                                <span className="text-[9px] text-gray-400">até</span>
                                <input type="date" value={customDate.fim} onChange={e=>setCustomDate({...customDate, fim:e.target.value})} className="py-1 px-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-md text-[10px] outline-none dark:text-white" />
                            </div>
                        )}

                        {filtroUsuario && (
                            <span className="ml-2 text-indigo-600 font-bold bg-indigo-50 border border-indigo-100 px-3 py-1.5 rounded-full flex items-center gap-1 text-[10px] cursor-pointer hover:bg-indigo-100 transition-colors animate-scaleIn" onClick={()=>setFiltroUsuario(null)}>
                                <User size={12}/> {filtroUsuario.nome} <X size={12}/>
                            </span>
                        )}

                        {/* Exportar - MOVIDO PARA O CANTO DIREITO DOS FILTROS */}
                        <div className="ml-auto">
                            <button onClick={(e) => handleTriggerClick(e, 'exportar', 'right')} className="bg-indigo-600 text-white px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-md hover:bg-indigo-700 transition-colors">
                                <Download size={14}/> <span className="hidden sm:inline">Exportar</span>
                            </button>
                        </div>
                     </div>

                     <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4">
                        
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            <div className="bg-white rounded-xl p-3 border shadow-sm h-[250px] flex flex-col">
                                <h4 className="text-xs font-bold text-gray-700 mb-2">Volume de Mensagens</h4>
                                <div className="flex-1 text-xs">
                                    {loading ? (
                                        <div className="w-full h-full flex items-center justify-center"><StaticSkeleton className="w-full h-full"/></div>
                                    ) : graficoData.length > 0 ? (
                                        <ResponsiveContainer><LineChart data={graficoData}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="name"/><YAxis/><RechartsTooltip/><Line type="monotone" dataKey="enviadas" stroke="#00a884"/><Line type="monotone" dataKey="recebidas" stroke="#0088FE"/></LineChart></ResponsiveContainer>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center h-full text-gray-400 text-xs">
                                            <BarChart3 size={32} className="mb-2 opacity-50"/>
                                            <p>Sem dados para este período</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="bg-white rounded-xl p-3 border shadow-sm h-[250px] flex flex-col">
                                <h4 className="text-xs font-bold text-gray-700 mb-2">Distribuição por Tags</h4>
                                <div className="flex-1 text-xs">
                                    <ResponsiveContainer><RechartsPie><Pie data={fullContext.tags} cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={5} dataKey="value">{fullContext.tags.map((e,i)=><Cell key={i} fill={CORES.tags[i%CORES.tags.length]}/>)}</Pie><Legend/><RechartsTooltip/></RechartsPie></ResponsiveContainer>
                                </div>
                            </div>
                        </div>

                        <div id="tour-ranking" className="bg-white rounded-xl border shadow-sm overflow-hidden">
                             <div className="bg-gray-50 px-4 py-2 border-b flex justify-between"><h4 className="text-xs font-bold text-gray-600">Ranking (Drill-down)</h4></div>
                             <table className="w-full text-left text-xs">
                                 <tbody>
                                     {loading ? (
                                        [1,2,3].map(i => <tr key={i}><td colSpan="4" className="p-3"><StaticSkeleton className="h-6 w-full"/></td></tr>)
                                     ) : rankingUsuarios.length > 0 ? (
                                         rankingUsuarios.map((u, i) => (
                                             <tr key={u.id} onClick={() => setFiltroUsuario(u)} className={`cursor-pointer hover:bg-indigo-50 ${filtroUsuario?.id === u.id ? 'bg-indigo-50' : ''}`}>
                                                 <td className="px-4 py-3 font-bold text-center w-8">{i+1}</td>
                                                 <td className="px-4 py-3">{u.nome}</td>
                                                 <td className="px-4 py-3 text-right">{u.tma}m TMA</td>
                                                 <td className="px-4 py-3 text-right"><span className="bg-green-100 text-green-800 px-2 py-0.5 rounded font-bold">{u.atendimentos}</span></td>
                                             </tr>
                                         ))
                                     ) : (
                                        <tr><td colSpan="4" className="text-center py-4 text-gray-400">Nenhum atendimento registrado no período.</td></tr>
                                     )}
                                 </tbody>
                             </table>
                        </div>
                        
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                             <div className="bg-white rounded-xl p-3 border shadow-sm">
                                 <h4 className="text-[10px] font-bold text-gray-400 uppercase mb-2 flex items-center gap-1"><Tag size={12}/> Assuntos Mais Falados</h4>
                                 <div className="flex flex-wrap gap-2">
                                     {['Financeiro', 'Boleto', 'Suporte', 'Erro Login', 'Pix', 'Planos'].map(t => (
                                         <span key={t} className="px-3 py-1 bg-indigo-50 text-indigo-600 text-xs font-bold rounded-full border border-indigo-100">{t}</span>
                                     ))}
                                 </div>
                             </div>
                             
                             <div className="bg-white rounded-xl p-3 border shadow-sm flex items-center justify-between px-6">
                                 <div>
                                     <h4 className="text-[10px] font-bold text-gray-400 uppercase mb-1">Satisfação (CSAT)</h4>
                                     <div className="flex text-yellow-400 gap-1"><Star size={14} fill="currentColor"/><Star size={14} fill="currentColor"/><Star size={14} fill="currentColor"/><Star size={14} fill="currentColor"/><Star size={14} fill="currentColor" className="text-gray-200"/></div>
                                 </div>
                                 <div className="text-right">
                                     <span className="text-3xl font-black text-gray-800">4.8</span>
                                     <span className="text-[9px] text-gray-400 block">NPS: 75</span>
                                 </div>
                             </div>
                        </div>

                     </div>
                </div>

                <div className="hidden md:block flex-1">
                    {/* IA AGORA RECEBE O CONTEXTO COMPLETO E EXPANSÍVEL */}
                    <AnalistaDados contextoCompleto={fullContext} loadingGeral={loading} onExpand={() => setIsChatExpanded(!isChatExpanded)} isExpanded={isChatExpanded} />
                </div>
            </div>

            {/* MODAL DE RESUMO DA IA */}
            {resumoIA && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[400] flex items-center justify-center p-4 animate-fadeIn" onClick={() => setResumoIA(null)}>
                    <div className="bg-white dark:bg-gray-800 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-700 flex flex-col max-h-[80vh]" onClick={e => e.stopPropagation()}>
                        <div className="p-4 border-b border-gray-100 bg-gray-50 dark:bg-gray-900/50 flex justify-between items-center shrink-0">
                            <div className="flex items-center gap-2"><div className="p-2 bg-purple-100 text-purple-600 rounded-lg"><Lightbulb size={18}/></div><h3 className="font-bold text-sm dark:text-white uppercase tracking-tight">Resumo Completo da Análise</h3></div>
                            <button onClick={() => setResumoIA(null)} className="p-2 hover:bg-gray-200 rounded-full transition-colors"><X size={18}/></button>
                        </div>
                        <div className="p-6 overflow-y-auto custom-scrollbar prose prose-sm dark:prose-invert max-w-none text-xs"><ReactMarkdown>{resumoIA}</ReactMarkdown></div>
                    </div>
                </div>
            )}

            {tourAtivo && <TutorialOverlay steps={tourSteps} activeStep={tourStep} onClose={() => { setTourAtivo(false); setTourStep(0); }} onNext={() => setTourStep(prev => Math.min(prev + 1, tourSteps.length - 1))} onPrev={() => setTourStep(prev => Math.max(prev - 1, 0))} />}
            <style>{`@media print { body * { visibility: hidden; } #main-content, #tour-header, #main-content * { visibility: visible; } #tour-header button, .no-print { display: none; } * { -webkit-print-color-adjust: exact; } }`}</style>
        </div>
    );
}

export default function Analytics() {
    return (
        <ErrorBoundary>
            <AnalyticsContent />
        </ErrorBoundary>
    );
}