// frontend/src/componentes/ChatInterno/MensagemBalao.jsx

import { useState } from 'react';
import { MoreVertical, Copy, Trash2, Check, CheckCheck, Sparkles, Star, Loader2, LifeBuoy } from 'lucide-react'; 
import { format } from 'date-fns';
import ReactMarkdown from 'react-markdown';
import api from '../../servicos/api'; 
import toast from 'react-hot-toast'; 
import VisualizadorArquivos from './VisualizadorArquivos';
import ConfirmacaoExclusao from './ConfirmacaoExclusao'; 

const API_URL_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// --- SUBCOMPONENTES ---
function AvaliacaoIA({ conversaId, onAvaliado, valorSalvo }) {
    const [avaliacaoLocal, setAvaliacaoLocal] = useState(0);
    const [comentario, setComentario] = useState(''); // Novo estado
    const [enviando, setEnviando] = useState(false);
    const [mostrarInput, setMostrarInput] = useState(false); // Controla visualização

    const notaFinal = avaliacaoLocal > 0 ? avaliacaoLocal : (valorSalvo || 0);

    const handleClickEstrela = (score) => {
        setAvaliacaoLocal(score);
        setMostrarInput(true); // Abre o campo de comentário ao clicar
    };

    const handleEnviarAvaliacao = async () => {
        if (!conversaId) return toast.error('Erro de ID.');
        
        setEnviando(true);
        try {
            await api.post(`/ia/avaliar-conversa/${conversaId}`, { 
                avaliacao: avaliacaoLocal, 
                comentario: comentario // Envia o texto
            });
            
            toast.success('Feedback enviado! Obrigado.');
            if (onAvaliado) onAvaliado(avaliacaoLocal);
            setMostrarInput(false); // Fecha após enviar

        } catch (error) {
            toast.error('Erro ao salvar.');
        } finally {
            setEnviando(false);
        }
    };

    // Se já foi salvo (vem do banco ou acabou de salvar)
    if (valorSalvo > 0 && !mostrarInput) {
        return (
            <div className="text-xs text-orange-500 mt-2 font-bold animate-fadeIn border-t border-orange-100 pt-2 flex items-center gap-1">
                <Star size={12} fill="currentColor" />
                Avaliado com {valorSalvo} estrela{valorSalvo > 1 ? 's' : ''}.
            </div>
        );
    }

    return (
        <div className="mt-2 pt-2 border-t border-gray-200/50 animate-fadeIn">
            {/* Estrelas */}
            <div className="flex gap-2 justify-center mt-1">
                {[1, 2, 3, 4, 5].map((star) => (
                    <button 
                        key={star} 
                        onClick={() => handleClickEstrela(star)} 
                        disabled={enviando || (notaFinal > 0 && !mostrarInput)} 
                        className={`hover:scale-125 transition-transform p-1 ${avaliacaoLocal >= star ? 'text-yellow-400' : 'text-gray-300'}`}
                    >
                        <Star size={20} fill={avaliacaoLocal >= star ? "currentColor" : "none"} />
                    </button>
                ))}
            </div>

            {/* Campo de Comentário (Aparece ao clicar na estrela) */}
            {mostrarInput && (
                <div className="mt-3 animate-fadeIn">
                    <textarea 
                        value={comentario}
                        onChange={(e) => setComentario(e.target.value)}
                        placeholder="Conte-nos o que achou (opcional)..."
                        className="w-full text-xs p-2 border border-gray-200 rounded-lg bg-gray-50 focus:bg-white outline-none focus:border-indigo-300 transition-all resize-none"
                        rows={2}
                        disabled={enviando}
                    />
                    <button 
                        onClick={handleEnviarAvaliacao}
                        disabled={enviando}
                        className="w-full mt-2 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
                    >
                        {enviando ? <Loader2 size={12} className="animate-spin"/> : <Send size={12}/>}
                        Confirmar Avaliação
                    </button>
                </div>
            )}
        </div>
    );
}

function BotoesTriagem({ conversaId, onTriagem }) {
    const [loading, setLoading] = useState(null); 
    const handleAcao = async (acao) => {
        setLoading(acao);
        try { await onTriagem(acao); } catch(e) { console.error(e); } finally { setLoading(null); }
    };

    return (
        <div className="mt-3 flex gap-2 flex-wrap">
            <button onClick={() => handleAcao('abrir_suporte')} disabled={loading} className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 transition-colors flex items-center gap-1 disabled:opacity-50">
               {loading==='abrir_suporte' ? <Loader2 size={12} className="animate-spin"/> : <LifeBuoy size={12}/>} Falar com Suporte
            </button>
            <button onClick={() => handleAcao('encerrar')} disabled={loading} className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded-lg text-xs font-bold hover:bg-gray-300 transition-colors flex items-center gap-1 disabled:opacity-50">
               {loading==='encerrar' ? <Loader2 size={12} className="animate-spin"/> : <Check size={12}/>} Resolver
            </button>
        </div>
    );
}

export default function MensagemBalao({ 
    mensagem, 
    isMeu, 
    proximaDoMesmo, 
    mostrarRemetente,
    onTriagemIA, 
    conversaIdIA,
    avaliacaoConcluida, // ✅ Recebe do pai
    onAvaliarIA         // ✅ Callback para atualizar pai
}) {
    const [mostrarMenu, setMostrarMenu] = useState(false);
    const [arquivoParaVisualizar, setArquivoParaVisualizar] = useState(null);
    const [confirmacaoExclusao, setConfirmacaoExclusao] = useState(null);
    const [excluidaLocal, setExcluidaLocal] = useState(false);

    if (excluidaLocal) return null;

    const isMessageFromIA = mensagem.remetente?.tipo === 'ia' || mensagem.role === 'assistant' || mensagem.role === 'model';
    const isSystemMessage = mensagem.tipo === 'sistema';
    
    // ✅ FALLBACK DE ID (Prioridade: ID direto > ID no payload > ID passado pelo pai)
    const idParaAvaliar = mensagem.conversaId || mensagem.payload?.conversaId || conversaIdIA;

    const deveMostrarAvaliacao = isMessageFromIA && (
        mensagem.solicitarAvaliacao === true || 
        mensagem.payload?.acao === 'solicitar_avaliacao'
    );

    const arquivos = mensagem.arquivos || (mensagem.caminhoArquivo ? [{ tipo: mensagem.tipoArquivo || 'file', caminho: mensagem.caminhoArquivo, nomeOriginal: mensagem.nomeOriginal || 'Arquivo' }] : []);

    const handleDelete = (e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        setConfirmacaoExclusao({ x: rect.left, y: rect.bottom + 5 }); 
        setMostrarMenu(false);
    };

    const confirmarExclusao = async () => {
        try {
            await api.delete(`/chat-interno/mensagens/${mensagem.id}`);
            toast.success('Mensagem excluída');
            setExcluidaLocal(true);
        } catch (error) {
            toast.error('Erro ao excluir mensagem');
        } finally {
            setConfirmacaoExclusao(null);
        }
    };

    const renderStatusIcon = () => {
        if (!isMeu) return null;
        if (mensagem.lidaEm || mensagem.lida) return <CheckCheck size={15} className="text-[#53bdeb]" />; 
        if (mensagem.entregue) return <CheckCheck size={15} className="text-gray-400" />;
        return <Check size={15} className="text-gray-400" />;
    };

    if (isSystemMessage) {
        return (
            <div className="flex justify-center my-4 opacity-75">
                <span className="bg-[#e9edef] text-gray-600 text-[11px] px-3 py-1 rounded-lg shadow-sm font-medium uppercase tracking-wide">
                    {mensagem.conteudo}
                </span>
            </div>
        );
    }

    return (
        <div className={`flex w-full mb-0.5 group relative ${isMeu ? 'justify-end' : 'justify-start'}`}>
            {!isMeu && mostrarRemetente && (
                <div className="flex-shrink-0 mr-2 mt-1 self-start select-none">
                    {isMessageFromIA ? (
                        <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white shadow-sm border border-white">
                           <Sparkles size={14} className="text-yellow-300"/>
                        </div>
                    ) : (
                        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 overflow-hidden border border-gray-100 shadow-sm cursor-pointer hover:opacity-80 transition-opacity">
                             {mensagem.remetente?.foto_perfil ? <img src={`${API_URL_BASE}/uploads/avatars/${mensagem.remetente.foto_perfil}`} className="w-full h-full object-cover"/> : <span className="text-xs font-bold">{mensagem.remetente?.nome?.[0]}</span>}
                        </div>
                    )}
                </div>
            )}

            <div className={`relative max-w-[85%] px-2 py-1.5 text-[14.2px] leading-[19px] shadow-[0_1px_0.5px_rgba(11,20,26,0.13)] break-words ${isMeu ? 'bg-[#d9fdd3] text-[#111b21] rounded-l-lg rounded-br-lg rounded-tr-none ml-auto' : 'bg-white text-[#111b21] rounded-r-lg rounded-bl-lg rounded-tl-none mr-auto'} ${proximaDoMesmo ? 'mb-[2px]' : 'mb-2'}`}>
                {!isMeu && mostrarRemetente && !isMessageFromIA && (
                    <p className={`text-[12.5px] font-medium leading-[22px] mb-0.5 hover:underline cursor-pointer select-none ${['text-[#e542a3]', 'text-[#c63f17]', 'text-[#4760cf]', 'text-[#d66f07]'][Math.abs(mensagem.remetente?.id?.charCodeAt(0) || 0) % 4]}`}>{mensagem.remetente?.nome}</p>
                )}

                <div className="markdown-body" style={{ color: 'inherit', fontFamily: 'inherit' }}>
                    {arquivos.length > 0 && (
                        <div className="space-y-1 mb-1">
                            {arquivos.map((arq, idx) => (
                                <div key={idx} onClick={() => setArquivoParaVisualizar(arq)} className="cursor-pointer p-2 rounded bg-black/5 hover:bg-black/10 transition-colors flex items-center gap-2 border border-black/5">
                                     <div className="w-8 h-8 bg-white rounded flex items-center justify-center text-xl">📄</div>
                                     <span className="truncate text-xs font-medium">{arq.nomeOriginal || 'Documento'}</span>
                                </div>
                            ))}
                        </div>
                    )}
                    
                    <ReactMarkdown components={{ p: ({node, ...props}) => <p {...props} className="mb-2 last:mb-0 leading-relaxed whitespace-pre-wrap" />, a: ({node, ...props}) => <a {...props} className="text-[#027eb5] hover:underline" target="_blank" rel="noopener noreferrer" />, code: ({node, inline, ...props}) => inline ? <code {...props} className="bg-black/10 px-1 rounded text-sm font-mono" /> : <pre className="bg-black/5 p-2 rounded text-xs overflow-x-auto"><code {...props} /></pre> }}>
                        {mensagem.conteudo}
                    </ReactMarkdown>
                    
                    {/* Botões de Triagem */}
                    {isMessageFromIA && mensagem.payload?.tipo === 'triagem' && onTriagemIA && <BotoesTriagem conversaId={idParaAvaliar} onTriagem={onTriagemIA} />}
                    
                    {/* Estrelas de Avaliação */}
                    {deveMostrarAvaliacao && (
                        <AvaliacaoIA 
                            conversaId={idParaAvaliar} 
                            valorSalvo={avaliacaoConcluida} 
                            onAvaliado={onAvaliarIA} />
                    )}
                </div>

                <div className="float-right ml-2 flex items-center gap-0.5 h-4 select-none relative -bottom-[3px]">
                    <span className={`text-[11px] ${isMeu ? 'text-[#111b21]/60' : 'text-[#667781]'}`}>{format(new Date(mensagem.criadaEm), 'HH:mm')}</span>
                    {isMeu && <span className="ml-0.5">{renderStatusIcon()}</span>}
                </div>
            </div>

            {isMeu && !isMessageFromIA && <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute top-0 -left-8 h-full flex items-start pt-1"><button onClick={() => setMostrarMenu(!mostrarMenu)} className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"><MoreVertical size={16}/></button></div>}
            
            {mostrarMenu && (
                <div className="absolute top-6 right-full mr-2 bg-white shadow-[0_2px_5px_0_rgba(11,20,26,0.26),0_2px_10px_0_rgba(11,20,26,0.16)] rounded-lg py-1 w-32 animate-fadeIn overflow-hidden z-[50]">
                    <button className="w-full text-left px-4 py-2.5 text-[14.5px] text-[#3b4a54] hover:bg-[#f5f6f6] flex items-center gap-3 transition-colors" onClick={() => { navigator.clipboard.writeText(mensagem.conteudo); setMostrarMenu(false); }}><Copy size={16}/> Copiar</button>
                    <button className="w-full text-left px-4 py-2.5 text-[14.5px] text-red-500 hover:bg-[#f5f6f6] flex items-center gap-3 transition-colors" onClick={handleDelete}><Trash2 size={16}/> Apagar</button>
                </div>
            )}

            {arquivoParaVisualizar && <VisualizadorArquivos arquivo={arquivoParaVisualizar} onClose={() => setArquivoParaVisualizar(null)} />}
            {confirmacaoExclusao && <ConfirmacaoExclusao mensagem="Apagar esta mensagem para todos?" onConfirmar={confirmarExclusao} onCancelar={() => setConfirmacaoExclusao(null)} posicao={confirmacaoExclusao} />}
        </div>
    );
}