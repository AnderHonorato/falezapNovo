// frontend/src/paginas/IAAprendizado.jsx

import { useState, useEffect, useMemo, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';
import { 
    Brain, Star, Search, MessageSquare, Calendar as CalendarIcon, 
    User, X, Filter, Loader2, Info, TrendingUp, 
    AlertTriangle, CheckCircle, Activity, ArrowUpRight, 
    FileSpreadsheet, Download, UserCircle, Shield, 
    Smartphone, Monitor, Tablet, ChevronDown, Send, Bot, Quote, Phone,
    RefreshCw, ToggleLeft, ToggleRight, Clock, SlidersHorizontal, LayoutList,
    Copy, Sparkles, Maximize2, Minimize2, Lightbulb, MessageCircle, 
    Tag, History, ArrowDownRight, FileText
} from 'lucide-react';
import api from '../servicos/api';
import toast from 'react-hot-toast';
import { format, isWithinInterval, startOfDay, endOfDay, parseISO, isSameDay, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import StatusIndicador from '../componentes/StatusIndicador';
import ReactMarkdown from 'react-markdown';
import { useAuth } from '../contextos/AuthContext'; 
import React from 'react';

// --- CLASSE DE PREVENÇÃO DE ERROS ---
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

// --- UTILITÁRIOS ---
const formatarTelefone = (n) => { 
    if(!n) return 'N/A'; 
    const l=n.replace(/\D/g,''); 
    if(l.startsWith('55')&&l.length>=12)return `+${l.slice(0,2)} (${l.slice(2,4)}) ${l.slice(4,9)}-${l.slice(9)}`; 
    return l; 
};

const getCargoFormatado = (tipo) => {
    switch(tipo) {
      case 'OWNER': return 'Dono';
      case 'CEO': return 'CEO';
      case 'ADMIN_EMPRESA': return 'Admin';
      case 'ADMIN': return 'Gerente';
      case 'COLABORADOR': return 'Colab.';
      case 'SUPORTE': return 'Suporte';
      default: return 'Usuário';
    }
};

const getEmojiPorNota = (nota) => {
    switch (nota) {
        case 1: return '😡';
        case 2: return '😞';
        case 3: return '😐';
        case 4: return '😊';
        case 5: return '🤩';
        default: return '🤔';
    }
};

const getSentimentoBadge = (sentimento) => {
    switch(sentimento) {
        case 'POSITIVO': return <span className="px-2 py-0.5 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-full text-[8px] font-bold">POSITIVO</span>;
        case 'NEGATIVO': return <span className="px-2 py-0.5 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded-full text-[8px] font-bold">NEGATIVO</span>;
        default: return <span className="px-2 py-0.5 bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 rounded-full text-[8px] font-bold">NEUTRO</span>;
    }
};

// --- COMPONENTES DE ESQUELETO ---
const SkeletonRow = () => (
    <tr className="animate-pulse border-b border-gray-100 dark:border-gray-700">
        <td className="px-3 py-4"><div className="h-6 w-6 bg-gray-200 dark:bg-gray-700 rounded-md mx-auto"></div></td>
        <td className="px-3 py-4"><div className="flex items-center gap-2"><div className="w-5 h-5 rounded-full bg-gray-200 dark:bg-gray-700"></div><div className="h-3 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div></div></td>
        <td className="px-3 py-4"><div className="h-3 w-16 bg-gray-200 dark:bg-gray-700 rounded font-mono"></div></td>
        <td className="px-3 py-4"><div className="h-3 w-full bg-gray-100 dark:border-gray-700/50 rounded"></div></td>
        <td className="px-3 py-4 text-right"><div className="h-5 w-5 bg-gray-200 dark:bg-gray-700 rounded ml-auto"></div></td>
    </tr>
);

const StatCardHeader = ({ titulo, valor, icone: Icon, cor, loading, tendencia, volume }) => {
    const iconColors = { yellow: "text-amber-500", purple: "text-purple-500", green: "text-emerald-500", red: "text-rose-500" };
    return (
        <div className="flex flex-col items-center px-4 border-r border-gray-100 dark:border-gray-700 last:border-r-0 min-w-[90px]">
            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">{titulo}</span>
            <div className="flex items-center gap-1.5">
                <Icon size={12} className={iconColors[cor]} strokeWidth={3} />
                {loading ? <div className="h-4 w-6 bg-gray-200 dark:bg-gray-700 animate-pulse rounded"></div> : <span className="text-sm font-black text-gray-700 dark:text-gray-200">{valor}</span>}
            </div>
            {!loading && (
                <div className="flex items-center gap-2 mt-0.5">
                    {volume !== undefined && <span className="text-[8px] font-bold text-gray-400">Vol: {volume}</span>}
                    {tendencia !== undefined && (
                        <div className={`flex items-center text-[8px] font-bold ${tendencia >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                            {tendencia >= 0 ? <ArrowUpRight size={8}/> : <ArrowDownRight size={8}/>}
                            {Math.abs(tendencia)}%
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

// --- COMPONENTE ANALISTA IA ---
const AnalistaIA = ({ metricas, dados, loadingGeral, onExpand, isExpanded }) => {
    const { usuario } = useAuth(); 
    const [mensagens, setMensagens] = useState([]); 
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0, visible: false });
    const [perfilAberto, setPerfilAberto] = useState(false);
    const scrollRef = useRef(null);
    const textareaRef = useRef(null);
    const popoverRef = useRef(null);

    const sugestoes = [
        "Quais as principais críticas?",
        "Resuma o sentimento geral",
        "Destaque elogios recentes"
    ];

    useEffect(() => {
        if (usuario?.nome && mensagens.length === 0) {
            const hora = new Date().getHours();
            let saudacao = hora < 12 ? 'Bom dia' : hora < 18 ? 'Boa tarde' : 'Boa noite';
            const primeiroNome = usuario.nome.split(' ')[0];
            setMensagens([{
                id: 'msg-inicial',
                role: 'model',
                texto: `${saudacao}, **${primeiroNome}**. Tudo bem? 😄\n\nMeu nome é **Analyzr IA**. Estou aqui para ajudar a interpretar os dados do seu dashboard de avaliações.`
            }]);
        }
    }, [usuario, mensagens.length]);

    useEffect(() => {
        if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }, [mensagens]);

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 100)}px`;
        }
    }, [input]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (popoverRef.current && !popoverRef.current.contains(event.target)) setPerfilAberto(false);
        };
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
            const criticos = dados.filter(d => d.avaliacao <= 3 && d.comentarioAvaliacao).slice(0, 5).map(d => `Nota ${d.avaliacao}: "${d.comentarioAvaliacao.substring(0, 60)}..."`).join(' | ');
            const res = await api.post('/ia/analise-dashboard', { 
                pergunta: textoUsuario,
                contexto: JSON.stringify({ kpis: { media: metricas.media, nps: metricas.npsLike, total: metricas.total }, criticos_recentes: criticos || "Nenhum" }),
                historico: mensagens.slice(-6).map(m => ({ role: m.role, content: m.texto }))
            });
            setMensagens(prev => [...prev, { id: Date.now() + 1, role: 'model', texto: res.data.resposta }]);
        } catch (error) {
            setMensagens(prev => [...prev, { id: Date.now() + 1, role: 'model', texto: '⚠️ Erro ao processar análise.' }]);
        } finally { setLoading(false); }
    };

    return (
        <div className={`flex flex-col h-full bg-white dark:bg-gray-800 rounded-t-2xl md:rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden relative transition-all duration-300 ${isExpanded ? 'fixed inset-4 md:inset-10 z-[300] shadow-2xl' : 'relative'}`}>
            {mousePos.visible && <div className="fixed z-[400] pointer-events-none bg-indigo-600 text-white text-[10px] font-bold px-2 py-1 rounded shadow-lg animate-bounce" style={{ left: mousePos.x, top: mousePos.y - 30 }}>Copiado!</div>}

            <div className="p-3 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 flex items-center justify-between shrink-0 relative">
                <div className="flex items-center gap-2 cursor-pointer group" onClick={() => setPerfilAberto(!perfilAberto)}>
                    <div className="p-1.5 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg text-white shadow-sm group-hover:scale-105 transition-transform"><Bot size={16} /></div>
                    <div>
                        <h3 className="text-xs font-bold text-gray-800 dark:text-white leading-none">Analyzr IA</h3>
                        <div className="flex items-center gap-1 mt-1"><span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span><p className="text-[10px] text-gray-500 dark:text-gray-400">Pronto para analisar</p></div>
                    </div>
                </div>
                <button onClick={onExpand} className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg text-gray-500 transition-colors">{isExpanded ? <Minimize2 size={16}/> : <Maximize2 size={16}/>}</button>

                {perfilAberto && (
                    <div ref={popoverRef} className="absolute top-full left-3 mt-2 w-64 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 z-[310] p-4 animate-scale-in">
                        <div className="flex flex-col items-center text-center">
                            <div className="w-16 h-16 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-full flex items-center justify-center text-white mb-3 shadow-lg"><Bot size={32} /></div>
                            <h4 className="text-sm font-bold text-gray-900 dark:text-white">Analyzr IA</h4>
                            <span className="text-[9px] px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 rounded-full font-bold uppercase tracking-wider mb-2">Beta v1.0.0</span>
                            <p className="text-[12px] text-gray-600 dark:text-gray-400 leading-relaxed">Especialista em inteligência de dados e análise de sentimentos para feedback.</p>
                            <p className="text-[11px] text-gray-600 dark:text-gray-400 leading-relaxed">A Analyzr pode cometer erros. Por isso, é bom checar as respostas.</p>
                            <div className="w-full h-[1px] bg-gray-100 dark:bg-gray-700 my-3"></div>
                            <div className="flex flex-col gap-1 w-full text-left">
                                <div className="flex justify-between text-[10px]"><span className="text-gray-400">Modelo:</span> <span className="font-mono text-gray-700 dark:text-gray-200">Gemini 1.5 Flash</span></div>
                                <div className="flex justify-between text-[10px]"><span className="text-gray-400">Modo:</span> <span className="font-mono text-gray-700 dark:text-gray-200">Análise Preditiva</span></div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-[#f8f9fa] dark:bg-gray-900/20" ref={scrollRef}>
                {mensagens.map(msg => (
                    <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} group relative`}>
                        <div className={`relative max-w-[85%] rounded-2xl px-3 py-2 text-xs leading-relaxed shadow-sm transition-all ${msg.role === 'user' ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-bl-none border border-gray-200 dark:border-gray-600'}`}>
                            <ReactMarkdown>{msg.texto}</ReactMarkdown>
                            {msg.role === 'model' && <button onClick={(e) => handleCopy(e, msg.texto)} className="absolute -right-2 -top-2 opacity-0 group-hover:opacity-100 p-1.5 bg-indigo-500 text-white rounded-full shadow-lg hover:scale-110 transition-all z-10"><Copy size={10}/></button>}
                        </div>
                    </div>
                ))}
                {loading && <div className="flex justify-start"><div className="bg-white dark:bg-gray-700 rounded-2xl px-3 py-2 border border-gray-100 dark:border-gray-600 shadow-sm"><Loader2 size={14} className="animate-spin text-gray-400" /></div></div>}
            </div>

            <div className="px-3 py-2 flex gap-1.5 overflow-x-auto no-scrollbar bg-white dark:bg-gray-800 border-t border-gray-50 shrink-0">
                {sugestoes.map((s, i) => (
                    <button key={i} onClick={() => handleEnviar(null, s)} className="whitespace-nowrap px-2.5 py-1 bg-gray-50 dark:bg-gray-700 hover:bg-indigo-50 text-[10px] text-gray-600 dark:text-gray-300 rounded-full border border-gray-200 transition-colors flex items-center gap-1">
                        <Sparkles size={10} className="text-amber-500" /> {s}
                    </button>
                ))}
            </div>

            <div className="p-2 border-t border-gray-100 bg-white dark:bg-gray-800 shrink-0">
                <form onSubmit={handleEnviar} className="relative flex items-end gap-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 rounded-xl px-2.5 py-2">
                    <textarea ref={textareaRef} rows="1" value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleEnviar(e); } }} placeholder="Pergunte sobre os dados..." className="flex-1 bg-transparent border-none outline-none text-xs dark:text-white placeholder:text-gray-400 resize-none py-0.5 custom-scrollbar" />
                    <button type="submit" disabled={!input.trim() || loading} className="p-1.5 bg-indigo-600 text-white rounded-lg active:scale-95 disabled:opacity-50 shrink-0"><Send size={12} /></button>
                </form>
            </div>
        </div>
    );
};

// --- COMPONENTE PRINCIPAL ---
function IAAprendizadoContent() {
    const { temaEscuro } = useOutletContext() || { temaEscuro: false };
    const [avaliacoes, setAvaliacoes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filtroNota, setFiltroNota] = useState('todas');
    const [filtroBusca, setFiltroBusca] = useState(''); 
    const [filtroData, setFiltroData] = useState('');
    const [conversaSelecionada, setConversaSelecionada] = useState(null);
    const [membroParaVisualizar, setMembroParaVisualizar] = useState(null);
    const [autoSync, setAutoSync] = useState(true);
    const [ultimaAtualizacao, setUltimaAtualizacao] = useState(new Date());
    const [sincronizando, setSincronizando] = useState(false);
    const [menuExportarAberto, setMenuExportarAberto] = useState(false);
    const [timerSinc, setTimerSinc] = useState(0);
    const [filtrosExportacao, setFiltrosExportacao] = useState({ notaMinima: 'todas', dataInicio: new Date().toISOString().split('T')[0], dataFim: new Date().toISOString().split('T')[0] });
    const [visaoMobile, setVisaoMobile] = useState('chat');
    const [isChatExpanded, setIsChatExpanded] = useState(false);
    const [resumoIA, setResumoIA] = useState(null);
    const [gerandoResumo, setGerandoResumo] = useState(false);
    const exportarRef = useRef(null);

    const carregarDados = async (silencioso = false) => {
        try {
            if (!silencioso) setLoading(true);
            else setSincronizando(true);
            const res = await api.get('/ia/avaliacoes-geral');
            setAvaliacoes(res.data.avaliacoes || []);
            setUltimaAtualizacao(new Date());
            setTimerSinc(0);
        } catch (error) { toast.error('Erro ao carregar dados.'); } finally { setLoading(false); setSincronizando(false); }
    };

    useEffect(() => {
        carregarDados();
        let interval;
        if (autoSync) interval = setInterval(() => { carregarDados(true); }, 30000);
        return () => clearInterval(interval);
    }, [autoSync]);

    useEffect(() => {
        if (!autoSync) return;
        const interval = setInterval(() => setTimerSinc(prev => prev >= 100 ? 0 : prev + (100 / 30)), 1000);
        return () => clearInterval(interval);
    }, [autoSync]);

    const handleGerarResumo = async () => {
        setGerandoResumo(true);
        try {
            const res = await api.get('/ia/relatorio-ia-executivo');
            setResumoIA(res.data.resumo);
        } catch (error) { toast.error('Falha ao gerar relatório inteligente.'); } finally { setGerandoResumo(false); }
    };

    const handleUpdateStatus = async (id, status) => {
        try {
            await api.patch(`/ia/status-tratativa/${id}`, { statusTratativa: status });
            setAvaliacoes(prev => prev.map(a => a.id === id ? {...a, statusTratativa: status} : a));
            toast.success('Status de tratativa atualizado.');
        } catch (e) { toast.error('Erro ao atualizar status.'); }
    };

    const handleExportarExcel = () => {
        const dadosParaExportar = avaliacoes.filter(item => {
            const dataItem = new Date(item.atualizadoEm);
            const inicio = startOfDay(parseISO(filtrosExportacao.dataInicio));
            const fim = endOfDay(parseISO(filtrosExportacao.dataFim));
            const matchData = isWithinInterval(dataItem, { start: inicio, end: fim });
            const matchNota = filtrosExportacao.notaMinima === 'todas' || item.avaliacao >= parseInt(filtrosExportacao.notaMinima);
            return matchData && matchNota;
        });
        if (dadosParaExportar.length === 0) return toast.error('Nenhum dado encontrado para exportação.');
        let csvContent = "data:text/csv;charset=utf-8,\ufeffData;Hora;Usuário;Email;Nota;Sentimento;Status;Comentário\n"; 
        dadosParaExportar.forEach(row => {
            csvContent += `${format(new Date(row.atualizadoEm), "dd/MM/yyyy")};${format(new Date(row.atualizadoEm), "HH:mm")};${row.usuario?.nome || 'Anônimo'};${row.usuario?.email || '-'};${row.avaliacao};${row.sentimento || 'NEUTRO'};${row.statusTratativa || 'PENDENTE'};"${(row.comentarioAvaliacao || '').replace(/"/g, '""')}"\n`;
        });
        const link = document.createElement("a");
        link.setAttribute("href", encodeURI(csvContent));
        link.setAttribute("download", `Relatorio_Qualidade_IA_${format(new Date(), 'dd-MM-yyyy')}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setMenuExportarAberto(false);
        toast.success(`CSV baixado com ${dadosParaExportar.length} registros.`);
    };

    const metricas = useMemo(() => {
        const total = avaliacoes.length;
        if (total === 0) return { media: 0, npsLike: 0, positivos: 0, negativos: 0, total: 0, tendMedia: 0, tendPos: 0 };
        const somaNotas = avaliacoes.reduce((acc, cur) => acc + (cur.avaliacao || 0), 0);
        const positivos = avaliacoes.filter(a => a.avaliacao >= 4).length;
        const negativos = avaliacoes.filter(a => a.avaliacao <= 2).length;
        
        const semanaPassada = subDays(new Date(), 7);
        const avSemana = avaliacoes.filter(a => new Date(a.atualizadoEm) >= semanaPassada);
        const mediaSemana = avSemana.length ? (avSemana.reduce((a,c) => a+c.avaliacao,0)/avSemana.length) : 0;
        const totalMedia = somaNotas / total;
        const tendMedia = mediaSemana > 0 ? ((mediaSemana - totalMedia) / totalMedia * 100).toFixed(1) : 0;

        return { 
            media: totalMedia.toFixed(1), 
            npsLike: ((positivos / total) * 100 - (negativos / total) * 100).toFixed(0), 
            positivos, negativos, total, tendMedia,
            volumePos: positivos, volumeNeg: negativos, volumeTotal: total
        };
    }, [avaliacoes]);

    const dadosFiltrados = avaliacoes.filter(item => {
        const matchNota = filtroNota === 'todas' || String(item.avaliacao) === filtroNota;
        const searchLow = filtroBusca.toLowerCase();
        const matchBusca = filtroBusca === '' || item.usuario?.nome.toLowerCase().includes(searchLow) || item.comentarioAvaliacao?.toLowerCase().includes(searchLow);
        const matchData = filtroData === '' || isSameDay(new Date(item.atualizadoEm), parseISO(filtroData));
        return matchNota && matchBusca && matchData;
    });

    return (
        <div className="flex flex-col h-full bg-[#f8f9fa] dark:bg-gray-900 transition-colors relative overflow-hidden">
            {autoSync && <div className="absolute top-0 left-0 w-full h-0.5 bg-gray-100 dark:bg-gray-800 z-[100]"><div className="h-full bg-indigo-500 transition-all duration-1000 ease-linear" style={{ width: `${timerSinc}%` }}></div></div>}
            
            <button onClick={() => setVisaoMobile(visaoMobile === 'chat' ? 'tabela' : 'chat')} className="md:hidden fixed bottom-6 right-6 z-[100] p-4 bg-indigo-600 text-white rounded-full shadow-2xl flex items-center justify-center transition-all active:scale-90">{visaoMobile === 'chat' ? <LayoutList size={24} /> : <MessageSquare size={24} />}</button>

            {/* HEADER COM CARDS E EXPORTAÇÃO */}
            <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 md:px-6 py-4 shadow-sm z-10 shrink-0">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2"><Brain className="text-purple-600" size={24} /> Aprendizado da IA</h1>
                        <p className="text-gray-500 dark:text-gray-400 text-xs mt-0.5">Monitoramento de satisfação e qualidade das respostas da IA.</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 md:gap-6 w-full md:w-auto">
                        <div className="flex flex-1 md:flex-none justify-around bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-100 dark:border-gray-700 p-1 overflow-x-auto">
                            <StatCardHeader titulo="Média" valor={metricas.media} icone={Star} cor="yellow" loading={loading} tendencia={metricas.tendMedia} />
                            <StatCardHeader titulo="NPS Score" valor={metricas.npsLike} icone={Activity} cor="purple" loading={loading} />
                            <StatCardHeader titulo="Positivas" valor={metricas.positivos} icone={CheckCircle} cor="green" loading={loading} volume={metricas.volumePos} />
                            <StatCardHeader titulo="Críticas" valor={metricas.negativos} icone={AlertTriangle} cor="red" loading={loading} volume={metricas.volumeNeg} />
                        </div>

                        <div className="flex items-center gap-3 ml-auto md:ml-0">
                             <div className="hidden sm:flex items-center gap-2 mr-2">
                                <button onClick={() => carregarDados()} disabled={sincronizando || loading} className="flex items-center gap-1.5 px-3 py-1 bg-white dark:bg-gray-700 border border-gray-200 rounded-md text-[10px] font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-50 transition-all"><RefreshCw size={12} className={sincronizando ? 'animate-spin' : ''} /> {sincronizando ? 'Sinc...' : 'Sincronizar'}</button>
                                <span className="text-[10px] text-gray-400 font-mono"><Clock size={10} className="inline mr-1"/>{format(ultimaAtualizacao, "HH:mm:ss")}</span>
                             </div>

                             <button onClick={handleGerarResumo} disabled={gerandoResumo || loading} className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-xl text-xs font-bold shadow-md hover:bg-purple-700 transition-all">
                                {gerandoResumo ? <Loader2 size={14} className="animate-spin"/> : <Sparkles size={14}/>} <span className="hidden sm:inline">{gerandoResumo ? 'Gerando...' : 'Resumo IA'}</span>
                             </button>

                             <div className="relative" ref={exportarRef}>
                                <button onClick={() => setMenuExportarAberto(!menuExportarAberto)} className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold shadow-md hover:bg-indigo-700 transition-colors"><Download size={14} /> <span className="hidden sm:inline">Exportar</span> <ChevronDown size={12} /></button>
                                {menuExportarAberto && (
                                    <div className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 z-50 p-4 animate-slide-down">
                                        <h4 className="text-xs font-bold text-gray-800 dark:text-white mb-3 flex items-center gap-1.5"><FileSpreadsheet size={14} className="text-green-600"/> Filtros de Exportação</h4>
                                        <div className="space-y-3 mb-4">
                                            <div className="grid grid-cols-2 gap-2">
                                                <div><label className="text-[9px] uppercase font-bold text-gray-500 block mb-1">Início</label><input type="date" value={filtrosExportacao.dataInicio} onChange={(e) => setFiltrosExportacao({...filtrosExportacao, dataInicio: e.target.value})} className="w-full p-1.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 rounded text-xs outline-none dark:text-white" /></div>
                                                <div><label className="text-[9px] uppercase font-bold text-gray-500 block mb-1">Fim</label><input type="date" value={filtrosExportacao.dataFim} onChange={(e) => setFiltrosExportacao({...filtrosExportacao, dataFim: e.target.value})} className="w-full p-1.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 rounded text-xs outline-none dark:text-white" /></div>
                                            </div>
                                            <div><label className="text-[9px] uppercase font-bold text-gray-500 block mb-1">Nota Mínima</label><select value={filtrosExportacao.notaMinima} onChange={(e) => setFiltrosExportacao({...filtrosExportacao, notaMinima: e.target.value})} className="w-full p-1.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 rounded text-xs outline-none dark:text-white"><option value="todas">Todas</option><option value="4">4+ Estrelas</option><option value="1">Abaixo de 3</option></select></div>
                                        </div>
                                        <button onClick={handleExportarExcel} className="w-full py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2"><Download size={12}/> Baixar CSV</button>
                                    </div>
                                )}
                             </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex-1 flex flex-col md:flex-row overflow-hidden p-4 gap-4 relative">
                <div className={`flex-[1.4] ${visaoMobile === 'chat' ? 'hidden md:flex' : 'flex'} flex-col gap-4 overflow-hidden`}>
                    
                    {/* FILTROS INTEGRADOS ACIMA DA TABELA */}
                    <div className="flex flex-wrap items-center gap-3 bg-white dark:bg-gray-800 p-3 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm shrink-0">
                        <button onClick={() => { setFiltroNota('todas'); setFiltroBusca(''); setFiltroData(''); }} className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-[10px] font-bold border transition-all ${filtroNota === 'todas' && !filtroBusca ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' : 'bg-white dark:bg-gray-800 text-gray-500 border-gray-200 hover:border-indigo-300'}`}><LayoutList size={14}/> TUDO</button>
                        <div className="flex items-center bg-gray-50 dark:bg-gray-900 rounded-full border border-gray-200 p-1">{[5, 4, 3, 2, 1].map(n => <button key={n} onClick={() => setFiltroNota(String(n))} className={`px-3 py-1 rounded-full text-[10px] font-bold transition-all ${filtroNota === String(n) ? 'bg-indigo-100 text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}>{n}★</button>)}</div>
                        <div className="relative flex-1 min-w-[180px]"><Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"/><input type="text" placeholder="Buscar usuário ou comentário..." value={filtroBusca} onChange={e => setFiltroBusca(e.target.value)} className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 rounded-full text-xs outline-none focus:ring-2 focus:ring-indigo-500/20 dark:text-white" /></div>
                        <div className="relative"><CalendarIcon size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"/><input type="date" value={filtroData} onChange={e => setFiltroData(e.target.value)} className="pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 rounded-full text-xs outline-none dark:text-white" /></div>
                    </div>

                    <div className="flex-1 flex flex-col bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                        <div className="flex-1 overflow-y-auto custom-scrollbar overflow-x-auto">
                            <table className="w-full text-left border-collapse min-w-[700px]">
                                <thead className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 sticky top-0 z-20 text-[10px] font-bold text-gray-400 uppercase">
                                    <tr>
                                        <th className="px-4 py-4 w-20 text-center">IA</th>
                                        <th className="px-4 py-4 w-56">Usuário</th>
                                        <th className="px-4 py-4">Feedback / Comentário</th>
                                        <th className="px-4 py-4 w-28 text-center">Tratativa</th>
                                        <th className="px-4 py-4 text-right w-16">Hist.</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                    {loading ? Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />) : dadosFiltrados.map((item) => (
                                        <tr key={item.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-all group">
                                            <td className="px-4 py-3.5 text-center">
                                                <div className="flex flex-col items-center gap-1">
                                                    <span className="text-sm">{getEmojiPorNota(item.avaliacao)}</span>
                                                    {getSentimentoBadge(item.sentimento)}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3.5">
                                                <div className="flex items-center gap-3 cursor-pointer group/user" onClick={() => setMembroParaVisualizar(item.usuario)}>
                                                    <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden shrink-0 border border-gray-100">{item.usuario?.foto_perfil ? <img src={`${import.meta.env.VITE_API_URL}/uploads/avatars/${item.usuario.foto_perfil}`} className="w-full h-full object-cover"/> : <User size={14} className="m-auto mt-2 text-gray-400"/>}</div>
                                                    <div className="flex flex-col"><span className="text-[11px] font-bold text-gray-700 dark:text-gray-200 group-hover/user:text-indigo-500 truncate max-w-[130px]">{item.usuario?.nome}</span><span className="text-[9px] text-gray-400 flex items-center gap-1 font-mono">{item.dispositivo === 'Mobile' ? <Smartphone size={8}/> : <Monitor size={8}/>} {format(new Date(item.atualizadoEm), "dd MMM HH:mm")}</span></div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3.5">
                                                <p className="text-[11px] text-gray-600 dark:text-gray-300 leading-snug line-clamp-2 italic mb-1.5">"{item.comentarioAvaliacao || 'Sem feedback escrito.'}"</p>
                                                <div className="flex flex-wrap gap-1">{item.tags?.map((t, i) => <span key={i} className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 text-[8px] font-bold text-gray-500 rounded flex items-center gap-1 uppercase"><Tag size={8}/>{t}</span>)}</div>
                                            </td>
                                            <td className="px-4 py-3.5">
                                                <select value={item.statusTratativa || 'PENDENTE'} onChange={(e) => handleUpdateStatus(item.id, e.target.value)} className={`w-full text-[9px] font-black uppercase rounded-lg px-2 py-1 border-none focus:ring-0 cursor-pointer ${item.statusTratativa === 'RESOLVIDO' ? 'bg-green-100 text-green-700' : item.statusTratativa === 'EM_ANALISE' ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'}`}>
                                                    <option value="PENDENTE">🔴 Pendente</option><option value="EM_ANALISE">🟠 Análise</option><option value="RESOLVIDO">🟢 Resolvido</option>
                                                </select>
                                            </td>
                                            <td className="px-4 py-3.5 text-right">
                                                <button onClick={() => setConversaSelecionada(item)} className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all border border-transparent hover:border-indigo-100"><MessageSquare size={16} /></button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <div className={`flex-1 h-full min-h-0 ${visaoMobile === 'tabela' ? 'hidden md:block' : 'block'}`}>
                    <AnalistaIA metricas={metricas} dados={avaliacoes} loadingGeral={loading} onExpand={() => setIsChatExpanded(!isChatExpanded)} isExpanded={isChatExpanded} />
                </div>
            </div>

            {/* MODAIS RESTAURADOS E MELHORADOS */}
            {resumoIA && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[400] flex items-center justify-center p-4 animate-fadeIn" onClick={() => setResumoIA(null)}>
                    <div className="bg-white dark:bg-gray-800 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-700 flex flex-col max-h-[80vh]" onClick={e => e.stopPropagation()}>
                        <div className="p-4 border-b border-gray-100 bg-gray-50 dark:bg-gray-900/50 flex justify-between items-center shrink-0">
                            <div className="flex items-center gap-2"><div className="p-2 bg-purple-100 text-purple-600 rounded-lg"><Lightbulb size={18}/></div><h3 className="font-bold text-sm dark:text-white uppercase tracking-tight">Relatório de Inteligência Semanal</h3></div>
                            <button onClick={() => setResumoIA(null)} className="p-2 hover:bg-gray-200 rounded-full transition-colors"><X size={18}/></button>
                        </div>
                        <div className="p-6 overflow-y-auto custom-scrollbar prose prose-sm dark:prose-invert max-w-none"><ReactMarkdown>{resumoIA}</ReactMarkdown></div>
                    </div>
                </div>
            )}

            {conversaSelecionada && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[250] flex justify-end animate-fadeIn" onClick={() => setConversaSelecionada(null)}>
                    <div className="w-full max-w-md h-full bg-white dark:bg-gray-900 shadow-2xl flex flex-col animate-slideInRight" onClick={e => e.stopPropagation()}>
                        <div className="px-4 py-3 border-b bg-gray-50 dark:bg-gray-800 flex justify-between items-center shrink-0">
                            <div className="flex items-center gap-3"><div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600"><Brain size={16} /></div><div><h3 className="font-bold text-gray-800 dark:text-white text-sm">Histórico com a IA</h3><p className="text-[10px] text-gray-500">{conversaSelecionada.usuario?.nome}</p></div></div>
                            <button onClick={() => setConversaSelecionada(null)} className="p-1.5 hover:bg-gray-200 rounded-md"><X size={18}/></button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#f8f9fa] dark:bg-gray-900 custom-scrollbar">
                            {conversaSelecionada.mensagens?.map((msg) => (
                                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-[11px] shadow-sm ${msg.role === 'user' ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 rounded-bl-none border border-gray-100 dark:border-gray-700'}`}>
                                        <ReactMarkdown>{msg.conteudo}</ReactMarkdown>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="p-3 border-t bg-gray-50 dark:bg-gray-900 shrink-0">
                            <div className="bg-white dark:bg-gray-800 border border-gray-200 rounded-lg p-3">
                                <div className="flex justify-between items-center mb-1"><span className="text-[10px] font-bold text-gray-400 uppercase">Avaliação do Usuário</span><div className="flex gap-0.5">{[1,2,3,4,5].map(s => <Star key={s} size={10} fill={conversaSelecionada.avaliacao >= s ? "#f59e0b" : "none"} className={conversaSelecionada.avaliacao >= s ? "text-amber-500" : "text-gray-300"} />)}</div></div>
                                <p className="text-xs text-gray-700 dark:text-gray-300 italic">"{conversaSelecionada.comentarioAvaliacao || 'Sem comentário.'}"</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {membroParaVisualizar && <ModalPerfilUsuario membro={membroParaVisualizar} onClose={() => setMembroParaVisualizar(null)} />}
        </div>
    );
}

const ModalPerfilUsuario = ({ membro, onClose }) => {
    if (!membro) return null;
    return (<> <div className="fixed inset-0 bg-black/50 z-[400] animate-fade-in backdrop-blur-sm" onClick={onClose} /> <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 z-[410] animate-scale-in overflow-hidden" onClick={e => e.stopPropagation()}> <div className="px-5 py-3 flex items-center justify-between border-b border-gray-100 bg-gray-50 dark:bg-gray-900/50"> <h2 className="text-sm font-bold text-gray-900 dark:text-white">Perfil do Membro</h2> <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-200 transition-colors"><X className="w-4 h-4 text-gray-500" /></button> </div> <div className="p-5 flex flex-col items-center"> <div className="w-20 h-20 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden border-4 border-white mb-3 shadow-md"> {membro.foto_perfil ? <img src={`${import.meta.env.VITE_API_URL}/uploads/avatars/${membro.foto_perfil}`} className="w-full h-full object-cover"/> : <User className="w-10 h-10 m-auto mt-4 text-gray-400"/>} </div> <h3 className="text-lg font-bold dark:text-white">{membro.nome}</h3> <p className="text-xs text-gray-500 mb-4">{membro.email}</p> <div className="grid grid-cols-2 gap-3 w-full"> <div className="bg-gray-50 dark:bg-gray-700/30 p-2.5 rounded-xl border border-gray-100"> <span className="text-[9px] font-bold text-gray-400 uppercase block mb-0.5">Telefone</span> <p className="text-xs font-semibold dark:text-gray-200">{formatarTelefone(membro.telefone)}</p> </div> <div className="bg-gray-50 dark:bg-gray-700/30 p-2.5 rounded-xl border border-gray-100"> <span className="text-[9px] font-bold text-gray-400 uppercase block mb-0.5">Cargo</span> <p className="text-xs font-semibold dark:text-gray-200">{getCargoFormatado(membro.tipo)}</p> </div> </div> </div> </div> </> ); };

export default function IAAprendizado() {
    return (
        <ErrorBoundary>
            <IAAprendizadoContent />
        </ErrorBoundary>
    );
}