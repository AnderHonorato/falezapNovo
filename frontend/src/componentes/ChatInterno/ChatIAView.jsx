// frontend/src/componentes/ChatInterno/ChatIAView.jsx

import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Loader2, Brain, Plus, Trash2, Sparkles, Star, X, AlertTriangle, XCircle, CheckCircle, Bot } from 'lucide-react'; 
import { useAuth } from '../../contextos/AuthContext';
import api from '../../servicos/api';
import toast from 'react-hot-toast';
import ReactMarkdown from 'react-markdown'; 
import ConfirmacaoExclusao from './ConfirmacaoExclusao';
import ConfirmacaoEncerramento from './ConfirmacaoEncerramento'; 
import { format, isToday } from 'date-fns'; 

// ✅ Helper para definir o emoji baseado na nota
const getEmojiPorNota = (nota) => {
    switch (nota) {
        case 1: return '😡'; // Raiva / Péssimo
        case 2: return '😞'; // Triste / Ruim
        case 3: return '😐'; // Neutro / Regular
        case 4: return '😊'; // Feliz / Bom
        case 5: return '🤩'; // Muito Feliz / Excelente
        default: return '🤔'; // Aguardando
    }
};

// ✅ Helper para texto de apoio
const getTextoPorNota = (nota) => {
    switch (nota) {
        case 1: return 'Péssimo';
        case 2: return 'Ruim';
        case 3: return 'Regular';
        case 4: return 'Muito Bom';
        case 5: return 'Excelente!';
        default: return 'Avalie seu atendimento';
    }
};

export default function ChatIAView({ 
    conversaAtiva, 
    listaConversas,
    onSelecionarConversa,
    onUpdateConversa,
    onAddMensagem,
    setIsTypingIA,
    isTypingIA,
    carregarConversasIA,
    onVoltarParaLista,
    wallpaperStyle
}) {
    const { usuario } = useAuth();
    const [input, setInput] = useState('');
    const [enviando, setEnviando] = useState(false);
    const [isThinkingIA, setIsThinkingIA] = useState(false); 
    const [statusConversaIA, setStatusConversaIA] = useState('ATIVA'); 
    const [avaliacaoIA, setAvaliacaoIA] = useState(0); 
    const [mostrarModalEncerramento, setMostrarModalEncerramento] = useState(null); 

    // ✅ ESTADO DO MODAL DE AVALIAÇÃO
    const [modalAvaliacao, setModalAvaliacao] = useState({
        aberto: false,
        nota: 0,
        comentario: ''
    });

    const [confirmacao, setConfirmacao] = useState({
        mostrar: false,
        tipo: null, 
        id: null,
        mensagem: '',
        posicao: null, 
    });
    
    const mensagensRef = useRef(null);
    const fimMensagensRef = useRef(null);
    const textareaRef = useRef(null);
    const timerAvisoRef = useRef(null);
    const timerEncerramentoRef = useRef(null);
    
    const THINKING_DELAY_MS = 3000;
    const TYPING_DELAY_MS = 2000;
    const TEMPO_AVISO_MS = 5 * 60 * 1000; 
    const TEMPO_ENCERRAMENTO_MS = 2 * 60 * 1000; 

    // Sincronizar status
    useEffect(() => {
        if (conversaAtiva) {
            setStatusConversaIA(conversaAtiva.status || 'ATIVA');
            setAvaliacaoIA(conversaAtiva.avaliacao || 0);
        }
    }, [conversaAtiva]);

    // Mensagem inicial de boas-vindas
    useEffect(() => {
        if (conversaAtiva && conversaAtiva.id.startsWith('temp-') && conversaAtiva.historico.length === 0) {
            const hora = new Date().getHours();
            let saudacao = 'Olá';
            if (hora >= 6 && hora < 12) saudacao = 'Bom dia';
            else if (hora >= 12 && hora < 18) saudacao = 'Boa tarde';
            else saudacao = 'Boa noite';
            
            const primeiroNome = usuario.nome.split(' ')[0];
            
            setIsTypingIA(true);
            
            setTimeout(() => {
                setIsTypingIA(false);
                const mensagemBoasVindas = {
                    id: `ia-welcome-${Date.now()}`,
                    remetenteId: 'IA_GEMINI',
                    conteudo: `${saudacao}, **${primeiroNome}**! Que bom te ver por aqui. 👋\n\nSou sua copiloto virtual. Conte comigo para tirar dúvidas ou automatizar aquelas tarefas chatas.\n\nPor onde vamos começar hoje?`,
                    criadaEm: new Date().toISOString(),
                };
                onAddMensagem(conversaAtiva.id, mensagemBoasVindas);
            }, 2000); 
        }
        return () => setIsTypingIA(false);
    }, [conversaAtiva?.id]);

    // --- FUNÇÕES AUXILIARES DA TELA INICIAL ---
    const formatarDataLista = (dataString) => {
        if (!dataString) return '';
        const data = new Date(dataString);
        if (isToday(data)) return format(data, 'HH:mm'); 
        return format(data, 'dd/MM/yy'); 
    };

    const selecionarConversaIA = async (conversa) => {
        if (conversa === null) {
            const novaConversa = {
                id: `temp-${Date.now()}`, 
                tipo: 'ia',
                nome: `Novo Chat ${listaConversas.length + 1}`,
                historico: [],
                status: 'ATIVA', 
                avaliacao: 0,
                criadaEm: new Date().toISOString()
            };
            setStatusConversaIA('ATIVA');
            setAvaliacaoIA(0); 
            onSelecionarConversa(novaConversa);
            return;
        }

        if (conversa && !conversa.id.startsWith('temp-')) {
            try {
                const res = await api.get(`/ia/mensagens-ia/${conversa.id}`); 
                setStatusConversaIA(res.data.status || 'ATIVA');
                setAvaliacaoIA(res.data.avaliacao || 0);
                conversa.historico = res.data.mensagens;
                onSelecionarConversa(conversa); 
            } catch (e) {
                console.error('[IA VIEW] ❌ Erro ao carregar mensagens na seleção:', e);
                toast.error('Erro ao carregar mensagens.');
                onSelecionarConversa(null);
            }
        } else {
            setStatusConversaIA(conversa.status || 'ATIVA');
            setAvaliacaoIA(conversa.avaliacao || 0);
            onSelecionarConversa(conversa);
        }
    };

    // --- LÓGICA DE INATIVIDADE ---
    const verificarInatividadeAoCarregar = async () => {
        if (!conversaAtiva || conversaAtiva.id.startsWith('temp-') || statusConversaIA !== 'ATIVA') return;
        const ultimaMsg = conversaAtiva.historico[conversaAtiva.historico.length - 1];
        if (!ultimaMsg) return;
        const tempoInativoMs = Date.now() - new Date(ultimaMsg.criadaEm).getTime();
        const tempoTotalLimite = TEMPO_AVISO_MS + TEMPO_ENCERRAMENTO_MS;

        if (tempoInativoMs > tempoTotalLimite) {
            await encerrarPorInatividade();
        } else if (tempoInativoMs > TEMPO_AVISO_MS) {
            await enviarAvisoInatividade();
            const tempoRestante = tempoTotalLimite - tempoInativoMs;
            if (timerEncerramentoRef.current) clearTimeout(timerEncerramentoRef.current);
            timerEncerramentoRef.current = setTimeout(encerrarPorInatividade, Math.max(1000, tempoRestante));
        } else {
            resetarTimersInatividade(tempoInativoMs); 
        }
    };

    const resetarTimersInatividade = (tempoJaPassado = 0) => {
        if (timerAvisoRef.current) clearTimeout(timerAvisoRef.current);
        if (timerEncerramentoRef.current) clearTimeout(timerEncerramentoRef.current);
        if (!conversaAtiva || conversaAtiva.id.startsWith('temp-') || statusConversaIA !== 'ATIVA') return;
        const tempoParaAviso = Math.max(0, TEMPO_AVISO_MS - tempoJaPassado);
        timerAvisoRef.current = setTimeout(async () => {
            await enviarAvisoInatividade();
            timerEncerramentoRef.current = setTimeout(async () => {
                await encerrarPorInatividade();
            }, TEMPO_ENCERRAMENTO_MS);
        }, tempoParaAviso);
    };

    const enviarAvisoInatividade = async () => {
        try {
            await api.post('/ia/aviso-inatividade', { conversaId: conversaAtiva.id });
            const res = await api.get(`/ia/mensagens-ia/${conversaAtiva.id}`);
            onUpdateConversa(conversaAtiva.id, { historico: res.data.mensagens });
            setTimeout(rolarParaFinal, 100);
        } catch (e) { console.error('Erro aviso:', e); }
    };

    const encerrarPorInatividade = async () => {
        try {
            await api.post(`/ia/encerrar-conversa/${conversaAtiva.id}`, { motivo: 'inatividade' });
            const res = await api.get(`/ia/mensagens-ia/${conversaAtiva.id}`);
            setStatusConversaIA('ENCERRADA');
            setAvaliacaoIA(0);
            onUpdateConversa(conversaAtiva.id, { 
                status: 'ENCERRADA', 
                encerradaEm: new Date().toISOString(),
                historico: res.data.mensagens,
                avaliacao: 0
            });
            toast.info('Chat encerrado por ausência de interação.', { icon: '💤' });
        } catch (e) { console.error('Erro encerramento auto:', e); }
    };

    useEffect(() => {
        if (conversaAtiva && statusConversaIA === 'ATIVA') {
            verificarInatividadeAoCarregar();
        }
        return () => {
            if (timerAvisoRef.current) clearTimeout(timerAvisoRef.current);
            if (timerEncerramentoRef.current) clearTimeout(timerEncerramentoRef.current);
        };
    }, [conversaAtiva?.id]); 

    const rolarParaFinal = () => {
        if (fimMensagensRef.current) {
            fimMensagensRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    };
    
    useEffect(() => {
        rolarParaFinal();
    }, [conversaAtiva?.historico, isTypingIA, isThinkingIA, confirmacao.mostrar]);

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
        }
    }, [input]);

    const handleTriagemCompleta = (solicitacao, conversaIAId) => {
        onVoltarParaLista(); 
        if (typeof onSelecionarConversa === 'function') {
            onSelecionarConversa({
                tipo: 'suporte',
                solicitacao,
                protocolo: solicitacao.protocolo,
                id: `suporte-${solicitacao.id}`,
            }); 
        }
        onUpdateConversa(conversaIAId, { status: 'ENCERRADA', encerradaEm: new Date().toISOString() });
    };

    const handleAbrirModalAvaliacao = useCallback((score) => {
        setTimeout(() => {
            setModalAvaliacao({
                aberto: true,
                nota: score,
                comentario: ''
            });
        }, 50);
    }, []);

    const handleEnviarAvaliacaoFinal = async () => {
        if (!conversaAtiva) return;
        try {
            setEnviando(true);
            await api.post(`/ia/avaliar-conversa/${conversaAtiva.id}`, {
                avaliacao: modalAvaliacao.nota,
                comentario: modalAvaliacao.comentario
            });

            setAvaliacaoIA(modalAvaliacao.nota);
            onUpdateConversa(conversaAtiva.id, { avaliacao: modalAvaliacao.nota });

            toast.success('Avaliação enviada com sucesso!');
            setModalAvaliacao({ aberto: false, nota: 0, comentario: '' }); 

            const res = await api.get(`/ia/mensagens-ia/${conversaAtiva.id}`);
            onUpdateConversa(conversaAtiva.id, { historico: res.data.mensagens });
        } catch (error) {
            console.error('Erro ao avaliar:', error);
            toast.error('Erro ao enviar avaliação.');
        } finally {
            setEnviando(false);
        }
    };
    
    const handleEnviar = async (e) => {
        e.preventDefault();
        const conteudo = input.trim();
        if (!conteudo || enviando || statusConversaIA !== 'ATIVA') return;

        const inputRef = textareaRef.current;
        resetarTimersInatividade(); 

        const novaMsgUsuario = { 
            id: `user-${Date.now()}`, 
            remetenteId: usuario.id, 
            conteudo, 
            criadaEm: new Date().toISOString() 
        };
        onAddMensagem(conversaAtiva.id, novaMsgUsuario);
        setInput('');
        
        setEnviando(true);
        setIsThinkingIA(true); 
        
        await new Promise(resolve => setTimeout(resolve, THINKING_DELAY_MS));
        setIsThinkingIA(false); 
        setIsTypingIA(true); 
        
        const typingTimeout = setTimeout(() => {}, TYPING_DELAY_MS);

        try {
            const res = await api.post('/ia/chat', {
                prompt: conteudo,
                conversaId: conversaAtiva.id.startsWith('temp-') ? null : conversaAtiva.id, 
            });
            clearTimeout(typingTimeout); 
            const { resposta, conversaId: novoIdDB, payload } = res.data; 
            const novaMsgIA = {
                id: `ia-${Date.now()}`,
                remetenteId: 'IA_GEMINI', 
                conteudo: resposta,
                criadaEm: new Date().toISOString(),
                payload: payload || undefined
            };
            onAddMensagem(conversaAtiva.id, novaMsgIA, novoIdDB, payload);
        } catch (error) {
            clearTimeout(typingTimeout); 
            if (error.response?.data?.erro?.includes('encerrada')) {
                setStatusConversaIA('ENCERRADA');
                toast.error('Esta conversa foi encerrada.', { icon: '🛑' });
                return;
            }
            const msgErro = {
                id: `erro-${Date.now()}`,
                remetenteId: 'IA_GEMINI', 
                conteudo: `❌ Erro de comunicação. (${error.message})`,
                tipo: 'sistema',
                criadaEm: new Date().toISOString()
            };
            onAddMensagem(conversaAtiva.id, msgErro);
        } finally {
            setEnviando(false);
            setIsTypingIA(false); 
            setIsThinkingIA(false); 
            setTimeout(rolarParaFinal, 100);
            setTimeout(() => { if (inputRef) inputRef.focus(); }, 10);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleEnviar(e);
        }
    };

    const handleSolicitarExclusaoMensagem = (mensagemId, posicao) => { 
        setConfirmacao({ mostrar: true, tipo: 'mensagem', id: mensagemId, mensagem: 'Tem certeza que deseja apagar esta mensagem?', posicao });
    };

    const handleSolicitarExclusaoConversa = (conversaId, posicao) => { 
        setConfirmacao({ mostrar: true, tipo: 'conversa', id: conversaId, mensagem: 'Excluir permanentemente esta conversa?', posicao });
    };

    const handleConfirmarExclusao = async () => {
        const { id, tipo } = confirmacao;
        setConfirmacao({ mostrar: false, tipo: null, id: null, mensagem: '', posicao: null }); 
        try {
            if (tipo === 'mensagem') {
                await api.delete(`/ia/mensagens-ia/${id}`); 
                toast.success('Mensagem apagada.');
                onUpdateConversa(conversaAtiva.id, {
                    historico: conversaAtiva.historico.map(msg => msg.id === id ? { ...msg, conteudo: '[Mensagem excluída]', remetenteId: 'IA_GEMINI', tipo: 'sistema' } : msg)
                });
            } else if (tipo === 'conversa') {
                await api.delete(`/ia/conversas-ia/${id}`);
                toast.success('Chat excluído!');
                await carregarConversasIA(); 
                onVoltarParaLista(); 
            }
        } catch (e) { toast.error(`Falha ao apagar.`); }
    };

    const handleEncerrarManual = async () => {
        setMostrarModalEncerramento(null);
        setEnviando(true);
        try {
            await api.post(`/ia/encerrar-conversa/${conversaAtiva.id}`);
            const res = await api.get(`/ia/mensagens-ia/${conversaAtiva.id}`);
            setStatusConversaIA('ENCERRADA');
            setAvaliacaoIA(0);
            onUpdateConversa(conversaAtiva.id, { status: 'ENCERRADA', encerradaEm: new Date().toISOString(), historico: res.data.mensagens, avaliacao: 0 });
            await carregarConversasIA(); 
            setTimeout(() => rolarParaFinal(), 100);
        } catch (e) { toast.error('Erro ao encerrar.'); } finally { setEnviando(false); }
    };
    
    // TELA INICIAL (Sem conversa ativa)
    if (!conversaAtiva) {
        return (
            <div className="flex flex-col h-full bg-gray-50/50 relative"> 
                <div className="relative bg-gradient-to-r from-indigo-500 to-purple-500 p-4 rounded-xl shadow-lg shadow-indigo-500/20 overflow-hidden shrink-0 mx-4 mt-4">
                    <div className="absolute right-0 top-0 p-4 opacity-10 pointer-events-none"><Sparkles size={80} strokeWidth={1.5} className='text-yellow-300'/></div>
                    <div className="relative z-10">
                        <h3 className="font-bold text-white text-lg flex items-center gap-2"><Sparkles size={18} className="text-yellow-300" /> Inicie uma nova conversa</h3>
                        <p className="text-indigo-100 text-xs mt-1.5 leading-relaxed max-w-[90%]">Pergunte sobre seus dados, crie resumos ou obtenha ajuda com o sistema.</p>
                    </div>
                </div>
                <div className="p-4 pt-6 flex-1 overflow-y-auto custom-scrollbar">
                    <button onClick={() => selecionarConversaIA(null)} className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:shadow-lg transition-all flex items-center justify-center gap-2 mb-6 hover:-translate-y-0.5"><Plus size={18}/> Nova Conversa</button>
                    {listaConversas.length > 0 && (
                        <>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Histórico de Conversas</p>
                            <div className="space-y-3">
                                {listaConversas.map(c => {
                                    const ultimaMsg = c.historico[c.historico.length - 1];
                                    const isEncerrada = c.status === 'ENCERRADA';
                                    return (
                                        <div key={c.id} onClick={() => selecionarConversaIA(c)} className={`group p-4 rounded-xl shadow-sm border border-gray-100 hover:border-indigo-200 cursor-pointer transition-all duration-300 flex items-center gap-4 ${isEncerrada ? 'bg-gray-50 opacity-80' : 'bg-white hover:bg-indigo-50/50'}`}>
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${isEncerrada ? 'bg-red-100 text-red-600' : 'bg-indigo-100 text-indigo-600'}`}>
                                                {isEncerrada ? <X size={16}/> : <Sparkles size={16}/>}
                                            </div>
                                            <div className="flex-1 min-w-0 overflow-hidden">
                                                <span className="font-bold text-sm text-gray-800 truncate group-hover:text-indigo-800 block">{c.nome}</span>
                                                {ultimaMsg && <p className="text-xs text-gray-500 truncate mt-0.5">{ultimaMsg.remetenteId === usuario.id ? 'Você' : 'IA'}: {ultimaMsg.conteudo.substring(0, 40)}</p>}
                                            </div>
                                            <div className="flex flex-col items-end text-xs text-gray-400 flex-shrink-0 min-w-[50px]">
                                                <span>{formatarDataLista(c.criadaEm)}</span> 
                                                <button onClick={(e) => { e.stopPropagation(); const rect = e.currentTarget.getBoundingClientRect(); handleSolicitarExclusaoConversa(c.id, { x: rect.right, y: rect.top }); }} className="p-1.5 ml-2 bg-gray-100 text-gray-400 rounded-full hover:bg-red-100 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 mt-1"><Trash2 size={14} /></button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </>
                    )}
                </div>
                {confirmacao.mostrar && confirmacao.tipo === 'conversa' && <ConfirmacaoExclusao mensagem={confirmacao.mensagem} onConfirmar={handleConfirmarExclusao} onCancelar={() => setConfirmacao({mostrar:false})} posicao={confirmacao.posicao} />}
            </div>
        );
    }

    // RENDERIZAÇÃO DA CONVERSA ATIVA
    return (
        <div className="flex flex-col h-full w-full relative bg-[#f8f9fa] dark:bg-gray-900 transition-colors"> 
            
            {/* Header Flutuante de Encerramento (Caso queira) */}
            {statusConversaIA === 'ATIVA' && !isTypingIA && !isThinkingIA && !conversaAtiva.id.startsWith('temp-') && (
                <div className='absolute top-2 right-2 z-20'>
                    <button onClick={(e) => { const rect = e.currentTarget.getBoundingClientRect(); setMostrarModalEncerramento({ posicao: { x: rect.right, y: rect.bottom + 5 } }); }} disabled={enviando} className='text-[10px] text-red-500 hover:text-white bg-red-50 hover:bg-red-500 font-bold flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-all shadow-sm border border-red-100 hover:border-red-500 disabled:opacity-50 disabled:cursor-not-allowed'>
                         <XCircle size={12}/> Finalizar
                    </button>
                </div>
            )}
            
            {/* LISTA DE MENSAGENS - Estilo IAAprendizado */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar" ref={mensagensRef} style={wallpaperStyle}>
                {conversaAtiva.historico.map((msg, index) => {
                    const isUser = msg.remetenteId === usuario.id;
                    const isIA = msg.remetenteId === 'IA_GEMINI';
                    const dataMsg = msg.criadaEm ? new Date(msg.criadaEm) : new Date();
                    const isLastItem = index === conversaAtiva.historico.length - 1;

                    return (
                        <div key={msg.id} className="flex flex-col gap-2">
                        <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} group relative`}>
                            
                            {/* Ícone Avatar (Apenas para IA) */}
                            {!isUser && (
                                <div className="mr-2 mt-1 flex-shrink-0">
                                    <div className="p-1.5 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg text-white shadow-sm">
                                        <Bot size={14} />
                                    </div>
                                </div>
                            )}

                            {/* Balão de Mensagem */}
                            <div className={`relative max-w-[85%] rounded-2xl px-3 py-2 text-xs leading-relaxed shadow-sm ${
                                isUser 
                                ? 'bg-indigo-600 text-white rounded-br-none' 
                                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 rounded-bl-none border border-gray-200 dark:border-gray-700'
                            }`}>
                                {/* Conteúdo */}
                                <div className="markdown-body">
                                    <ReactMarkdown>{msg.conteudo}</ReactMarkdown>
                                </div>

                                {/* Data e Status */}
                                <div className={`flex items-center justify-end gap-1 mt-1 ${isUser ? 'text-indigo-200' : 'text-gray-400'}`}>
                                    <span className="text-[9px]">{format(dataMsg, 'HH:mm')}</span>
                                    {isUser && <CheckCircle size={8} />}
                                </div>

                                {/* Ações (Hover) - Apenas Exclusão para usuário */}
                                {isUser && (
                                    <div className={`absolute top-0 -left-8 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-1`}>
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); const rect = e.currentTarget.getBoundingClientRect(); handleSolicitarExclusaoMensagem(msg.id, { x: rect.right, y: rect.top }); }}
                                            className="p-1 text-gray-400 hover:text-red-500 bg-white/50 hover:bg-white rounded-full shadow-sm transition-all"
                                            title="Apagar"
                                        >
                                            <Trash2 size={12} />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* ✅ ÁREA DE AVALIAÇÃO - SÓ APARECE SE STATUS == ENCERRADA */}
                        {!isUser && isLastItem && avaliacaoIA === 0 && statusConversaIA === 'ENCERRADA' && (
                            <div className="ml-10 max-w-[85%] animate-fadeIn">
                                <div className="p-3 bg-white dark:bg-gray-800 border border-indigo-100 dark:border-gray-700 rounded-xl shadow-sm flex flex-col gap-2">
                                    <span className="text-[11px] font-semibold text-indigo-800 dark:text-indigo-300 flex items-center gap-1.5">
                                        ⭐ Por favor, avalie sua experiência com o assistente clicando nas estrelas abaixo.
                                    </span>
                                    <div className="flex justify-center gap-2 pt-1">
                                        {[1, 2, 3, 4, 5].map((s) => (
                                            <button
                                                key={s}
                                                onClick={() => handleAbrirModalAvaliacao(s)}
                                                className="p-1 transition-transform hover:scale-125 focus:outline-none"
                                                title={`Avaliar com ${s} estrelas`}
                                            >
                                                <Star size={20} className="text-gray-300 dark:text-gray-600 hover:text-amber-400 hover:fill-amber-400 transition-colors" />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                        </div>
                    );
                })}
                
                {/* Indicadores de Status */}
                {isThinkingIA && (
                    <div className="flex justify-start">
                         <div className="mr-2 mt-1 flex-shrink-0"><div className="p-1.5 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg text-white shadow-sm"><Brain size={14} /></div></div>
                         <div className="bg-white dark:bg-gray-800 rounded-2xl rounded-bl-none px-3 py-2 border border-gray-100 dark:border-gray-700 shadow-sm flex items-center gap-2">
                            <span className="text-xs text-purple-600 font-semibold">Pensando...</span>
                            <div className="typing-indicator thinking"><span></span><span></span><span></span></div>
                        </div>
                    </div>
                )}
                {isTypingIA && (
                    <div className="flex justify-start">
                         <div className="mr-2 mt-1 flex-shrink-0"><div className="p-1.5 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg text-white shadow-sm"><Brain size={14} /></div></div>
                         <div className="bg-white dark:bg-gray-800 rounded-2xl rounded-bl-none px-3 py-2 border border-gray-100 dark:border-gray-700 shadow-sm flex items-center gap-2">
                            <span className="text-xs text-indigo-600 font-semibold">Digitando...</span>
                            <div className="typing-indicator typing"><span></span><span></span><span></span></div>
                        </div>
                    </div>
                )}
                <div ref={fimMensagensRef} />
            </div>

            {/* Input e Footer - ESTILO CÁPSULA (IAAprendizado) */}
            <div className="p-2 border-t border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800">
                {statusConversaIA !== 'ATIVA' ? (
                    <div className="bg-gray-50 dark:bg-gray-900/50 p-3 rounded-xl text-center text-xs text-gray-500 border border-gray-200 dark:border-gray-700 flex flex-col items-center gap-1">
                        <div className="flex items-center gap-2 font-bold text-gray-700 dark:text-gray-300">
                             <AlertTriangle size={14} className='text-amber-500'/> Conversa encerrada
                        </div>
                        <span>Precisa de mais ajuda? <button onClick={onVoltarParaLista} className='text-indigo-600 dark:text-indigo-400 font-bold hover:underline'>Iniciar novo chat</button>.</span>
                    </div>
                ) : (
                    <form onSubmit={handleEnviar} className="relative flex items-end bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus-within:ring-1 focus-within:ring-indigo-500 focus-within:border-indigo-500 transition-all">
                        <textarea 
                            ref={textareaRef} 
                            value={input} 
                            onChange={(e) => setInput(e.target.value)} 
                            onKeyDown={handleKeyDown} 
                            placeholder="Pergunte sobre os dados..." 
                            className="w-full pl-3 pr-10 py-2.5 bg-transparent border-none text-xs text-gray-800 dark:text-white outline-none resize-none custom-scrollbar placeholder:text-gray-400"
                            rows={1}
                            style={{ minHeight: '40px', maxHeight: '100px' }}
                            disabled={enviando || isThinkingIA || isTypingIA} 
                            autoFocus
                        />
                        <div className="absolute right-1 bottom-1">
                            <button 
                                type="submit" 
                                disabled={enviando || !input.trim() || isThinkingIA || isTypingIA} 
                                className="p-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg disabled:opacity-50 disabled:bg-gray-400 transition-colors shadow-sm flex items-center justify-center"
                            >
                                {enviando || isThinkingIA || isTypingIA ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                            </button>
                        </div>
                    </form>
                )}
            </div>

            {/* ✅ MODAL BLINDADO - COM EMOJI DINÂMICO DE AVALIAÇÃO */}
            {modalAvaliacao.aberto && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fadeIn" onClick={(e) => e.stopPropagation()}>
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 w-[90%] max-w-sm transform scale-100 transition-all border border-gray-100 dark:border-gray-700 relative">
                        <div className="flex justify-between items-center mb-1">
                            <h3 className="font-bold text-gray-800 dark:text-white text-lg flex items-center gap-2">Avaliar Atendimento</h3>
                            <button onClick={() => setModalAvaliacao({ ...modalAvaliacao, aberto: false })} className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500"><X size={20}/></button>
                        </div>
                        
                        {/* 🌟 EMOJI DINÂMICO E TEXTO DE APOIO 🌟 */}
                        <div className="flex flex-col items-center justify-center my-4">
                            <div className="text-5xl mb-2 transition-all transform animate-bounce-short">
                                {getEmojiPorNota(modalAvaliacao.nota)}
                            </div>
                            <span className={`text-sm font-bold ${
                                modalAvaliacao.nota <= 2 ? 'text-red-500' : 
                                modalAvaliacao.nota === 3 ? 'text-gray-500' : 
                                'text-green-600'
                            }`}>
                                {getTextoPorNota(modalAvaliacao.nota)}
                            </span>
                        </div>
                        
                        <div className="flex justify-center gap-2 mb-6">
                            {[1, 2, 3, 4, 5].map((s) => (
                                <button key={s} type="button" onClick={() => setModalAvaliacao({...modalAvaliacao, nota: s})} className="transition-transform hover:scale-110 focus:outline-none">
                                    <Star size={32} fill={s <= modalAvaliacao.nota ? "#FBBF24" : "none"} stroke={s <= modalAvaliacao.nota ? "#FBBF24" : "#D1D5DB"} strokeWidth={1.5} />
                                </button>
                            ))}
                        </div>
                        
                        <div className="mb-4">
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Comentário (Opcional)</label>
                            <textarea
                                value={modalAvaliacao.comentario}
                                onChange={(e) => setModalAvaliacao({ ...modalAvaliacao, comentario: e.target.value })}
                                placeholder="Conte como foi sua experiência..."
                                className="w-full border border-gray-300 dark:border-gray-600 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[80px] resize-none bg-white dark:bg-gray-900 dark:text-white"
                            />
                        </div>
                        
                        <div className="flex gap-2">
                            <button onClick={() => setModalAvaliacao({...modalAvaliacao, aberto: false})} className="flex-1 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-200 rounded-xl font-semibold text-sm hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">Cancelar</button>
                            <button onClick={handleEnviarAvaliacaoFinal} disabled={enviando} className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl font-semibold text-sm hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-70">
                                {enviando ? <Loader2 size={16} className="animate-spin"/> : <><CheckCircle size={16}/> Enviar</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {mostrarModalEncerramento && <ConfirmacaoEncerramento mensagem="Ao encerrar esta conversa, você será solicitado a avaliar a experiência." onConfirmar={handleEncerrarManual} onCancelar={() => setMostrarModalEncerramento(null)} posicao={mostrarModalEncerramento.posicao} carregando={enviando} />}
            {confirmacao.mostrar && <ConfirmacaoExclusao mensagem={confirmacao.mensagem} onConfirmar={handleConfirmarExclusao} onCancelar={() => setConfirmacao({mostrar:false})} posicao={confirmacao.posicao} />}
        </div>
    );
}