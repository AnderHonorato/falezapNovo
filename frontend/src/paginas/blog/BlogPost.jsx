import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contextos/AuthContext';
import api from '../../servicos/api';
import { 
  ArrowLeft, Calendar, User, Clock, ThumbsUp, MessageSquare, 
  Send, Loader2, Heart, Reply, Crown, ShieldCheck, Headset, 
  Mail, Flame, Info, Share2, Briefcase, Link as LinkIcon, 
  MoreVertical, Trash2, Edit2, Smile, ArrowUp, X, Ban, Phone,
  AlertTriangle, ShieldAlert, Instagram, Copy, Check, Quote, Bookmark, Eye, MessageCircle, Edit
} from 'lucide-react';
import { formatDistanceToNow, format, isValid, differenceInMinutes } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import toast from 'react-hot-toast';
import BlogLayout from './BlogLayout';
import 'react-quill-new/dist/quill.snow.css';

// --- CONFIGURAÇÕES ---
const MAX_CHARS = 2200; 
const CHAR_LIMIT_DISPLAY = 280; 

// --- COMPONENTE DE PROTEÇÃO ---
class PostErrorBoundary extends React.Component {
  state = { hasError: false };
  static getDerivedStateFromError(error) { return { hasError: true }; }
  componentDidCatch(error, info) { console.error("Erro Crítico no Blog:", error, info); }
  render() { 
    if (this.state.hasError) return (
      <div className="flex flex-col items-center justify-center p-20 bg-[#fdfbf7] rounded-3xl shadow-xl">
        <h2 className="text-xl font-bold text-gray-800">Ops! Algo deu errado.</h2>
        <button onClick={() => window.location.reload()} className="mt-4 px-6 py-2 bg-indigo-600 text-white rounded-full font-bold">Recarregar Página</button>
      </div>
    ); 
    return this.props.children; 
  }
}

const safeDate = (date) => { if (!date) return null; try { const p = new Date(date); return isValid(p) ? p : null; } catch { return null; } };

const getRoleBadgeStyle = (usuario) => {
    if (!usuario) return 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400';
    if (usuario.tipo === 'OWNER') return 'bg-amber-100 text-amber-900 border-amber-200 ring-1 ring-amber-400/60 dark:bg-amber-900/40 dark:text-amber-200';
    if (usuario.tipo === 'CEO') return 'bg-orange-100 text-orange-900 border-orange-200 ring-1 ring-orange-400/60 dark:bg-orange-900/40 dark:text-orange-200';
    if (usuario.podeModerarBlog) return 'bg-indigo-100 text-indigo-800 border-indigo-200 ring-1 ring-indigo-400/50 dark:bg-indigo-900/40 dark:text-indigo-300';
    switch (usuario.tipo) {
        case 'SUPORTE': return 'bg-cyan-100 text-cyan-800 border-cyan-200 dark:bg-cyan-900/40 dark:text-cyan-300';
        case 'ADMIN': return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/40 dark:text-blue-300';
        case 'ADMIN_EMPRESA': return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-200';
        case 'COLABORADOR': return 'bg-gray-100 text-gray-700 border-gray-300 dark:bg-gray-800 dark:text-gray-300';
        default: return 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400';
    }
};

const getRoleInfo = (tipo) => {
    const p = { size: 9, strokeWidth: 2.5 };
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

const ComentarioItem = (props) => {
  const { 
      comentario, nivel = 0, onResponderClick, onLike, onDelete, onEdit, 
      getAvatarUrl, activeReplyId, submitResposta, 
      usuarioLogado, checkPrivacidade, handleMouseEnter, handleMouseLeave 
  } = props;

  if (!comentario) return null;

  const isDeleted = comentario.deletado === true;
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(comentario.texto || '');
  const [showMenu, setShowMenu] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [expanded, setExpanded] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteReason, setDeleteReason] = useState('');

  const autorExibicao = isDeleted ? { nome: 'Desconhecido', tipo: 'USER' } : (comentario.autor || {});
  const isOwner = autorExibicao.tipo === 'OWNER';
  const isMe = usuarioLogado?.id === comentario.autorId;
  const isPopular = (comentario.likes || 0) >= 3 && !isDeleted;

  const dataCriacao = safeDate(comentario.criadoEm);
  const dataAtualizacao = safeDate(comentario.atualizadoEm);
  const foiEditado = !isDeleted && dataCriacao && dataAtualizacao && 
                     dataAtualizacao.getTime() > (dataCriacao.getTime() + 2000); 

  const podeVerFoto = !isDeleted && checkPrivacidade(autorExibicao, 'foto');
  const podeVerCargo = !isDeleted && checkPrivacidade(autorExibicao, 'cargo');

  const isModeratorUser = (u) => u && (u.podeModerarBlog === true || u.tipo === 'OWNER' || u.tipo === 'CEO');
  const usuarioLogadoEhModerador = isModeratorUser(usuarioLogado);
  const autorEhModerador = isModeratorUser(autorExibicao);

  const canDelete = useMemo(() => {
      if (isMe) return true;
      if (!usuarioLogadoEhModerador) return false;
      const targetRole = autorExibicao.tipo;
      const myRole = usuarioLogado?.tipo;
      if (targetRole === 'OWNER') return false;
      if (targetRole === 'CEO' && myRole !== 'OWNER') return false;
      return true;
  }, [isMe, usuarioLogadoEhModerador, autorExibicao.tipo, usuarioLogado]);

  const handleConfirmDelete = () => {
      onDelete(comentario.id, deleteReason);
      setShowDeleteConfirm(false);
      setDeleteReason('');
      setShowMenu(false);
  };

  const getBordaClass = () => {
      if (isDeleted) return 'border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800/40 text-gray-400';
      if (podeVerCargo) {
          if (autorExibicao.tipo === 'OWNER') return 'border-l-4 border-amber-500 bg-amber-50/40 dark:bg-amber-900/10';
          if (autorExibicao.tipo === 'CEO') return 'border-l-4 border-orange-500 bg-orange-50/40 dark:bg-orange-900/10';
          if (autorExibicao.podeModerarBlog) return 'border-l-4 border-indigo-500 bg-indigo-50/30 dark:bg-indigo-900/10';
          if (autorExibicao.tipo === 'SUPORTE') return 'border-l-4 border-cyan-500 bg-cyan-50/40 dark:bg-cyan-900/10';
      }
      return 'border border-gray-200 dark:border-gray-700 bg-[#f9f9f9] dark:bg-gray-800/60';
  };

  const roleInfo = getRoleInfo(autorExibicao.tipo);
  const textoCompleto = comentario.texto || '';
  const deveTruncar = textoCompleto.length > CHAR_LIMIT_DISPLAY;
  const textoExibido = !deveTruncar || expanded ? textoCompleto : `${textoCompleto.slice(0, CHAR_LIMIT_DISPLAY)}...`;

  return (
    <div className={`relative ${nivel > 0 ? (nivel < 4 ? 'ml-8' : 'ml-2') : ''} mt-4 group animate-fadeIn`}>
      {nivel > 0 && <div className="absolute -left-4 -top-4 w-4 h-8 border-l-2 border-b-2 border-gray-300 dark:border-gray-600 rounded-bl-xl opacity-50 pointer-events-none"></div>}
      <div className="flex gap-3">
        <div className="shrink-0 relative mt-1" onMouseEnter={!isDeleted ? (e)=>handleMouseEnter(e, autorExibicao) : undefined} onMouseLeave={handleMouseLeave}>
           <div className={`w-9 h-9 rounded-full overflow-hidden border shadow-sm flex items-center justify-center transition-all ${isDeleted ? 'bg-gray-200 border-gray-300 dark:bg-gray-800 dark:border-gray-700' : (podeVerCargo && isOwner ? 'ring-2 ring-amber-400 cursor-pointer hover:opacity-80' : 'border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-100')}`}>
              {isDeleted ? <User size={16} className="text-gray-400"/> : (podeVerFoto && autorExibicao.avatar ? <img src={getAvatarUrl(autorExibicao.avatar)} className="w-full h-full object-cover" /> : <div className="text-[10px] font-bold text-gray-400">{autorExibicao.nome?.charAt(0) || '?'}</div>)}
           </div>
        </div>
        <div className="flex-1 min-w-0">
            <div className={`p-3.5 rounded-2xl rounded-tl-none shadow-sm text-xs relative transition-all ${getBordaClass()}`}>
                {!isDeleted && (
                    <div className="flex justify-between items-start mb-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-gray-900 dark:text-white cursor-pointer text-sm px-2 py-0.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-all" onMouseEnter={(e)=>handleMouseEnter(e, autorExibicao)} onMouseLeave={handleMouseLeave}>{autorExibicao.nome}</span>
                            {isPopular && <span className="flex items-center gap-0.5 text-[9px] text-rose-600 bg-white px-2 py-0.5 rounded-full font-bold uppercase border border-rose-200 shadow-sm"><Flame size={10} fill="currentColor"/> Trend</span>}
                            {podeVerCargo && roleInfo.texto !== 'Membro' && (
                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border flex items-center gap-1 ${getRoleBadgeStyle(autorExibicao)}`}>
                                    {roleInfo.icon} {roleInfo.texto}
                                </span>
                            )}
                            {podeVerCargo && autorEhModerador && (
                                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border flex items-center gap-1 bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-900/40 dark:text-indigo-300">
                                    <ShieldAlert size={9} strokeWidth={2.5}/> Moderador
                                </span>
                            )}
                        </div>
                        
                        <div className="flex items-center gap-2">
                            <span className="text-[9px] text-gray-500 dark:text-gray-400 whitespace-nowrap">
                                {safeDate(comentario.criadoEm) ? formatDistanceToNow(new Date(comentario.criadoEm), { locale: ptBR, addSuffix: true }) : ''}
                            </span>
                            
                            {foiEditado && (
                                <span 
                                    className="text-[9px] text-gray-400 italic cursor-help border-b border-dotted border-gray-300 whitespace-nowrap flex items-center"
                                    title={`Editado em: ${format(dataAtualizacao, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`}
                                >
                                    (Editado)
                                </span>
                            )}

                            {(canDelete || isMe) && (
                                <div className="relative flex items-center">
                                    <button onClick={() => setShowMenu(!showMenu)} className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"><MoreVertical size={12}/></button>
                                    {showMenu && (
                                        <div className="absolute right-0 top-full mt-1 w-32 bg-white dark:bg-gray-800 rounded-lg shadow-xl border z-20 py-1">
                                            {isMe && <button onClick={() => { setIsEditing(true); setShowMenu(false); }} className="w-full text-left px-3 py-2 text-xs hover:bg-gray-50 flex items-center gap-2"><Edit2 size={12} className="text-gray-500"/> Editar</button>}
                                            {canDelete && <button onClick={() => { setShowDeleteConfirm(true); setShowMenu(false); }} className="w-full text-left px-3 py-2 text-xs hover:bg-red-50 text-red-600 flex items-center gap-2"><Trash2 size={12}/> Excluir</button>}
                                        </div>
                                    )}
                                    {showDeleteConfirm && (
                                        <div className="absolute right-0 top-8 z-50 w-64 bg-white dark:bg-gray-800 p-3 rounded-xl shadow-2xl border dark:border-gray-700 animate-fadeIn">
                                            <div className="flex items-center gap-2 text-red-600 font-bold text-xs mb-2"><AlertTriangle size={14}/> Confirmar exclusão?</div>
                                            {usuarioLogadoEhModerador && !isMe && <input type="text" placeholder="Motivo (opcional)" value={deleteReason} onChange={(e) => setDeleteReason(e.target.value)} className="w-full text-xs p-2 border rounded-lg mb-2 dark:bg-gray-900 dark:border-gray-700 dark:text-white focus:ring-1 ring-red-200 outline-none" autoFocus/>}
                                            <div className="flex gap-2"><button onClick={() => setShowDeleteConfirm(false)} className="flex-1 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-xs font-bold text-gray-600">Cancelar</button><button onClick={handleConfirmDelete} className="flex-1 py-1.5 bg-red-600 hover:bg-red-700 rounded-lg text-xs font-bold text-white flex justify-center items-center gap-1"><Trash2 size={10}/> Apagar</button></div>
                                            <div className="absolute -top-1 right-2 w-2 h-2 bg-white dark:bg-gray-800 border-t border-l border-gray-200 dark:border-gray-700 rotate-45"></div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )}
                {isDeleted ? (
                    <div className="flex flex-col gap-1 py-1 select-none">
                        <div className="flex items-center gap-2"><Ban size={14} className="text-gray-400" /><span className="italic text-gray-500 dark:text-gray-500 font-medium">{comentario.motivoExclusao ? 'Mensagem apagada pelo moderador.' : 'Mensagem apagada pelo usuário.'}</span></div>
                        {comentario.motivoExclusao && <div className="ml-6 text-[11px] text-red-500/80 font-medium bg-red-50 inline-block px-2 py-0.5 rounded-md border border-red-100 max-w-fit">Motivo: {comentario.motivoExclusao}</div>}
                    </div>
                ) : (
                    isEditing ? (
                        <div className="mb-2">
                            <textarea value={editText} maxLength={MAX_CHARS} onChange={e=>setEditText(e.target.value)} className="w-full bg-white border rounded-lg p-2 text-xs mb-1 resize-none focus:ring-2 focus:ring-indigo-500 outline-none" rows={3}/>
                            <div className={`text-[10px] text-right mb-2 ${editText.length >= MAX_CHARS ? 'text-red-500 font-bold' : 'text-gray-400'}`}>{editText.length}/{MAX_CHARS}</div>
                            <div className="flex gap-2"><button onClick={() => { onEdit(comentario.id, editText); setIsEditing(false); }} disabled={editText.length === 0} className="px-2 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600 disabled:opacity-50">Salvar</button><button onClick={()=>setIsEditing(false)} className="px-2 py-1 bg-gray-200 text-gray-700 rounded text-xs hover:bg-gray-300">Cancelar</button></div>
                        </div>
                    ) : (
                        <div className="text-gray-800 dark:text-gray-200 leading-relaxed mb-3 whitespace-pre-wrap font-medium text-[13px]">
                            {textoExibido}
                            {deveTruncar && (
                                <button onClick={() => setExpanded(!expanded)} className="ml-1 text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 font-bold text-xs hover:underline focus:outline-none">{expanded ? 'Ler menos' : 'Ler mais'}</button>
                            )}
                        </div>
                    )
                )}
                {!isDeleted && (
                    <div className="flex items-center gap-4 border-t border-black/5 dark:border-white/5 pt-2">
                        <button onClick={() => onLike(comentario.id, comentario.curtidoPorMim)} className={`flex items-center gap-1 text-[11px] font-bold transition-colors ${comentario.curtidoPorMim ? 'text-pink-600' : 'text-gray-500 hover:text-pink-600'}`}><Heart size={13} className={comentario.curtidoPorMim ? "fill-current" : ""}/> {comentario.likes > 0 ? comentario.likes : ''} {comentario.curtidoPorMim ? 'Curtida' : 'Curtir'}</button>
                        <button onClick={() => onResponderClick(comentario.id)} className="flex items-center gap-1 text-[11px] font-bold text-gray-500 hover:text-indigo-600"><Reply size={13}/> Responder</button>
                    </div>
                )}
            </div>
            {activeReplyId === comentario.id && !isDeleted && (
                <div className="mt-3 ml-2 flex gap-2 animate-fadeIn flex-col">
                    <div className="flex gap-2 w-full">
                        <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden shrink-0 mt-1">{usuarioLogado?.avatar ? <img src={getAvatarUrl(usuarioLogado.avatar)} className="w-full h-full object-cover"/> : <User size={14} className="m-auto mt-1.5 text-gray-400"/>}</div>
                        <form onSubmit={(e) => { e.preventDefault(); submitResposta(e, comentario.id, replyText); setReplyText(''); }} className="flex-1 relative">
                            <textarea autoFocus value={replyText} maxLength={MAX_CHARS} onChange={(e) => setReplyText(e.target.value)} placeholder={`Respondendo...`} className="w-full bg-[#fdfbf7] dark:bg-gray-800 border border-indigo-300 rounded-xl p-3 pr-10 text-xs focus:ring-2 outline-none resize-none min-h-[50px] shadow-sm dark:text-white"/>
                            <button type="submit" disabled={!replyText.trim()} className="absolute bottom-2 right-2 p-1.5 bg-indigo-600 text-white rounded-lg disabled:opacity-50 hover:bg-indigo-700 transition-colors"><Send size={12}/></button>
                        </form>
                    </div>
                    <div className={`text-[10px] text-right pr-2 ${replyText.length >= MAX_CHARS ? 'text-red-500 font-bold' : 'text-gray-400'}`}>{replyText.length}/{MAX_CHARS}</div>
                </div>
            )}
        </div>
      </div>
      {comentario.filhos && comentario.filhos.length > 0 && comentario.filhos.map(filho => <ComentarioItem key={filho.id} {...props} comentario={filho} nivel={nivel + 1} />)}
    </div>
  );
};

const BlogPost = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { usuario } = useAuth();
  
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [likes, setLikes] = useState(0);
  const [curtido, setCurtido] = useState(false);
  const [salvo, setSalvo] = useState(false); 
  const [comentarios, setComentarios] = useState([]);
  const [relatedPosts, setRelatedPosts] = useState([]);
  const [comentariosVisiveis, setComentariosVisiveis] = useState(10);
  const [novoComentarioPrincipal, setNovoComentarioPrincipal] = useState('');
  const [activeReplyId, setActiveReplyId] = useState(null); 
  const [enviandoComentario, setEnviandoComentario] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [perfilSelecionado, setPerfilSelecionado] = useState(null);
  const [posicaoModal, setPosicaoModal] = useState({ top: 0, left: 0 });
  const [ladoModal, setLadoModal] = useState('direita'); 
  const closeTimeoutRef = useRef(null);
  const [copiedLink, setCopiedLink] = useState(false);

  const getAvatarUrl = (p) => {
    if (!p) return null;
    if (p.startsWith('http')) return p;
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    const baseUrl = new URL(apiUrl).origin;
    return `${baseUrl}/uploads/avatars/${p.startsWith('/') ? p.substring(1) : p}`;
  };

  const getImageUrl = (u) => {
      if (!u) return null;
      if (u.startsWith('http') || u.startsWith('data:')) return u;
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const baseUrl = new URL(apiUrl).origin;
      return `${baseUrl}${u.startsWith('/')?'':'/'}${u}`;
  };

  const formatarDataCompleta = (d) => { 
      const data = d ? new Date(d) : null;
      return (data && isValid(data)) ? format(data, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }) : 'Data indisponível'; 
  };
  const checkPrivacidade = (a, c) => {
      if (!a) return false;
      if (usuario && (['OWNER', 'SUPORTE', 'ADMIN', 'CEO'].includes(usuario.tipo) || usuario.id === a.id)) return true;
      let p = a.privacidade;
      if (typeof p === 'string') try { p = JSON.parse(p); } catch { p = {}; }
      if (!p) return true; // Default true if not defined
      return p[c] !== false;
  };

  const isModeratorUser = (u) => u && (u.podeModerarBlog === true || u.tipo === 'OWNER' || u.tipo === 'CEO');

  const arvoreComentarios = useMemo(() => {
    if (!comentarios || !Array.isArray(comentarios)) return [];
    const mapa = {};
    const raiz = [];
    const copia = JSON.parse(JSON.stringify(comentarios)); 
    copia.forEach(c => { mapa[c.id] = { ...c, filhos: [] }; });
    copia.forEach(c => { if (c.parentId && mapa[c.parentId]) { mapa[c.parentId].filhos.push(mapa[c.id]); } else { raiz.push(mapa[c.id]); } });
    raiz.sort((a,b) => { 
        const isADeleted = a.deletado === true;
        const isBDeleted = b.deletado === true;
        const sA = isADeleted ? 0 : ((a.likes || 0) + (a.filhos.length * 2)); 
        const sB = isBDeleted ? 0 : ((b.likes || 0) + (b.filhos.length * 2)); 
        if (sA >= 3 || sB >= 3) return sB - sA; 
        return new Date(b.criadoEm) - new Date(a.criadoEm); 
    });
    return raiz;
  }, [comentarios]);

  useEffect(() => {
    const handleScroll = () => setShowScrollTop(window.scrollY > 400);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const carregar = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/blog/${slug}`);
        const p = res.data.post || res.data;
        setPost(p);
        setLikes(p.likes || 0);
        setCurtido(p.curtidoPeloUsuario || false);
        setSalvo(p.salvoPorMim || false); 

        // Incrementa view
        try { await api.patch(`/blog/posts/${p.id}/view`); } catch (err) { console.error("Erro ao incrementar view", err); }

        if (p.id) {
            const resCom = await api.get(`/blog/${p.id}/comentarios`);
            setComentarios(resCom.data.comentarios || []);
        }
        
        const resRel = await api.get('/blog/recomendados?ignorarId=' + p.id);
        setRelatedPosts(resRel.data.posts || []);

      } catch (e) { toast.error("Erro ao carregar post."); } 
      finally { setLoading(false); }
    };
    if (slug) carregar();
  }, [slug]);

  const handleLikePost = async () => { 
      if (!post || !post.id) return; 
      const estadoAnterior = curtido;
      const likesAnterior = likes;
      setCurtido(!estadoAnterior); 
      setLikes(prev => !estadoAnterior ? prev + 1 : prev - 1); 
      try { await api.post(`/blog/${post.id}/like`); } catch (err) { 
          setCurtido(estadoAnterior); 
          setLikes(likesAnterior); 
          console.error("Erro no like:", err);
          toast.error("Não foi possível curtir.");
      } 
  };
  
  const handleSalvarPost = async () => {
    if (!post || !post.id) return;
    const estadoAnterior = salvo;
    setSalvo(!estadoAnterior);
    try {
        await api.post(`/blog/${post.id}/salvar`);
        if (!estadoAnterior) toast.success("Salvo em 'Meus Itens Salvos'");
        else toast('Removido dos salvos', { icon: '🗑️' });
    } catch (e) {
        setSalvo(estadoAnterior);
        toast.error("Erro ao salvar.");
    }
  };

  const handleLikeComentario = async (id, ja) => { 
      setComentarios(prev => prev.map(c => c.id === id ? { ...c, curtidoPorMim: !ja, likes: ja ? (c.likes - 1) : (c.likes + 1) } : c));
      try { await api.post(`/blog/comentarios/${id}/like`); } catch { /* silencia */ } 
  };

  const handleEnviar = async (e, pId = null, textoOverride = null) => {
    if(e) e.preventDefault();
    const texto = textoOverride || novoComentarioPrincipal;
    if (!texto.trim() || enviandoComentario) return;
    setEnviandoComentario(true);
    try {
        const res = await api.post(`/blog/${post.id}/comentarios`, { texto, parentId: pId });
        const novo = res.data.comentario;
        if (!novo.autor && usuario) novo.autor = { ...usuario };
        novo.filhos = [];
        setComentarios(prev => [novo, ...prev]);
        if(!pId) setNovoComentarioPrincipal('');
        setActiveReplyId(null);
        toast.success("Comentário enviado!");
    } catch { toast.error("Erro ao enviar."); } finally { setEnviandoComentario(false); }
  };

  const handleDeleteComment = async (id, motivo) => {
      setComentarios(prev => prev.map(c => c.id === id ? { ...c, deletado: true, texto: '', autor: null, motivoExclusao: motivo || null } : c));
      try { await api.delete(`/blog/comentarios/${id}`, { data: { motivo } }); toast.success("Comentário apagado."); } 
      catch (error) { toast.error(error.response?.data?.erro || "Erro ao apagar."); }
  };

  const handleEditComment = async (id, texto) => {
      try { 
          await api.put(`/blog/comentarios/${id}`, { texto }); 
          setComentarios(prev => prev.map(c => c.id === id ? { ...c, texto, atualizadoEm: new Date().toISOString() } : c)); 
          toast.success("Editado com sucesso."); 
      } 
      catch { toast.error("Erro ao editar."); }
  };

  const handleMouseEnter = (e, u) => { 
      if(closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current); 
      const mw = 420; const gap = 15; const ww = window.innerWidth;
      let x = e.clientX + gap; let lado = 'direita';
      if (x + mw > ww) { x = e.clientX - mw - gap; lado = 'esquerda'; }
      let y = e.clientY - 60; 
      setLadoModal(lado); setPosicaoModal({ top: y, left: x }); setPerfilSelecionado(u); 
  };

  const renderBannerBackground = () => {
    if (!perfilSelecionado) return <div className="absolute inset-0 bg-gray-300"></div>;
    const visivel = checkPrivacidade(perfilSelecionado, 'cargo');
    if (visivel && perfilSelecionado.tipo === 'OWNER') return <div className="absolute inset-0 bg-gradient-to-r from-amber-400 to-orange-500 overflow-hidden"><Crown className="absolute top-[-20%] left-[-10%] w-32 h-32 text-white opacity-10 -rotate-12"/><Crown className="absolute bottom-[-10%] right-[-20%] w-40 h-40 text-white opacity-10 rotate-12"/></div>;
    if (visivel && perfilSelecionado.tipo === 'SUPORTE') return <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-blue-600 overflow-hidden"><Headset className="absolute top-0 left-0 w-28 h-28 text-white opacity-10 -rotate-45"/></div>;
    return <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-600"></div>;
  };

  const handleShareWhatsApp = () => {
      const text = encodeURIComponent(`Confira este post: ${post.titulo}`);
      const url = encodeURIComponent(window.location.href);
      window.open(`https://wa.me/?text=${text}%20${url}`, '_blank');
  };

  const handleShareCopy = () => {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      toast.success("Link copiado para a área de transferência!");
      setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleShareInstagram = () => {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Link copiado! Cole no seu Story ou Direct.", { icon: '📸' });
      setTimeout(() => {
          window.open('https://instagram.com', '_blank');
      }, 1500);
  };

  const handleEditarPost = () => {
      navigate(`/blog/editar/${post.id}`);
  };

  if (loading) return <div className="flex justify-center items-center h-screen"><Loader2 className="animate-spin text-indigo-600" size={32}/></div>;
  if (!post) return <div className="p-20 text-center">Publicação não encontrada.</div>;

  const roleInfoAutorPost = post.autor ? getRoleInfo(post.autor.tipo) : null;
  const isAutorModerator = isModeratorUser(post.autor);
  const foiEditado = post.atualizadoEm && post.criadoEm && differenceInMinutes(new Date(post.atualizadoEm), new Date(post.criadoEm)) > 1;
  const podeEditar = usuario && (usuario.id === post.autorId || usuario.tipo === 'OWNER' || usuario.tipo === 'CEO' || usuario.tipo === 'ADMIN');

  return (
    <PostErrorBoundary>
      <BlogLayout 
        sidebarContent={
            <div className="space-y-6 sticky top-24">
                <div className="bg-[#fdfbf7] dark:bg-gray-800 rounded-3xl border border-gray-200 dark:border-gray-700 shadow-sm p-5">
                    <h3 className="font-bold text-sm mb-4 flex items-center gap-2 text-gray-800 dark:text-white border-b border-gray-100 dark:border-gray-700 pb-2"><Info size={16} className="text-indigo-500"/> Autor</h3>
                    
                    <div className="flex items-center gap-3 mb-4 group cursor-pointer" onMouseEnter={(e)=>handleMouseEnter(e, post.autor)} onMouseLeave={()=>closeTimeoutRef.current = setTimeout(()=>setPerfilSelecionado(null), 300)}>
                        <div className={`shrink-0 w-12 h-12 rounded-full overflow-hidden border shadow-sm flex items-center justify-center transition-all ${checkPrivacidade(post.autor, 'cargo') && post.autor?.tipo === 'OWNER' ? 'ring-2 ring-amber-400' : 'border-gray-200 dark:border-gray-700'}`}>
                            {checkPrivacidade(post.autor, 'foto') && post.autor?.avatar ? <img src={getAvatarUrl(post.autor.avatar)} className="w-full h-full object-cover transition-transform group-hover:scale-110"/> : <User size={24} className="text-gray-400"/>}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-gray-900 dark:text-white leading-tight mb-1 truncate group-hover:text-indigo-600 transition-colors">{post.autor?.nome}</p>
                            <div className="flex flex-wrap gap-1">
                                {checkPrivacidade(post.autor, 'cargo') && roleInfoAutorPost && roleInfoAutorPost.texto !== 'Membro' && (
                                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border flex items-center gap-1 w-fit ${getRoleBadgeStyle(post.autor)}`}>
                                        {roleInfoAutorPost.icon} {roleInfoAutorPost.texto}
                                    </span>
                                )}
                                {checkPrivacidade(post.autor, 'cargo') && isAutorModerator && (
                                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border flex items-center gap-1 bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-900/40 dark:text-indigo-300 w-fit">
                                        <ShieldAlert size={9} strokeWidth={2.5}/> Moderador
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {post.autorFrase && (
                        <div className="relative mb-4 animate-fadeIn">
                            <span className="absolute -top-2 left-2 bg-[#fdfbf7] dark:bg-gray-800 px-1 z-10">
                                <Quote size={12} className="text-indigo-500 fill-indigo-500/20"/>
                            </span>
                            <div className="p-3 pt-4 rounded-xl border border-indigo-100 dark:border-indigo-900/50 bg-indigo-50/50 dark:bg-indigo-900/20">
                                <p className="text-xs italic text-gray-600 dark:text-gray-300 text-center leading-relaxed">
                                    "{post.autorFrase}"
                                </p>
                            </div>
                        </div>
                    )}

                    <button onClick={() => navigate('/blog')} className="w-full py-2 border border-gray-200 dark:border-gray-600 rounded-xl text-xs font-bold hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-white transition-all flex items-center justify-center gap-2"><ArrowLeft size={14}/> Voltar para o Blog</button>
                </div>

                <div className="p-5 bg-[#fdfbf7] dark:bg-gray-800 rounded-3xl border border-gray-200 dark:border-gray-700 shadow-sm">
                    <h3 className="font-bold text-sm mb-3 flex items-center gap-2 text-blue-500"><Share2 size={16}/> Compartilhar</h3>
                    <div className="grid grid-cols-3 gap-2">
                        <button onClick={handleShareWhatsApp} className="p-3 bg-green-100 hover:bg-green-200 text-green-700 rounded-xl flex justify-center items-center transition-colors" title="WhatsApp">
                            <MessageSquare size={18} />
                        </button>
                        <button onClick={handleShareInstagram} className="p-3 bg-pink-100 hover:bg-pink-200 text-pink-700 rounded-xl flex justify-center items-center transition-colors" title="Instagram (Copiar + Abrir)">
                            <Instagram size={18} />
                        </button>
                        <button onClick={handleShareCopy} className={`p-3 rounded-xl flex justify-center items-center transition-colors ${copiedLink ? 'bg-gray-800 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`} title="Copiar Link">
                            {copiedLink ? <Check size={18}/> : <Copy size={18} />}
                        </button>
                    </div>
                </div>
            </div>
        }
    >
        {perfilSelecionado && (
            <div style={{ position: 'fixed', top: posicaoModal.top, left: posicaoModal.left }} className="z-[9999] w-[420px] bg-white dark:bg-gray-800 rounded-xl shadow-2xl border dark:border-gray-700 animate-fadeIn flex flex-row overflow-hidden" onMouseLeave={() => setPerfilSelecionado(null)}>
                <div className={`absolute w-4 h-4 bg-white dark:bg-gray-800 border-t border-l border-gray-200 dark:border-gray-700 transform rotate-45 top-12 z-50 ${ladoModal === 'direita' ? '-left-2' : '-right-2 border-t-0 border-l-0 border-r border-b'}`}/>
                <div className="absolute top-0 left-0 w-full h-20">{renderBannerBackground()}</div>
                <div className="relative z-10 flex w-full">
                    <div className="w-[120px] pt-10 pl-4 flex flex-col items-center shrink-0">
                        <div className="w-20 h-20 rounded-full border-4 border-white dark:border-gray-800 bg-white shadow-md overflow-hidden flex items-center justify-center">
                            {checkPrivacidade(perfilSelecionado, 'foto') && perfilSelecionado.avatar ? <img src={getAvatarUrl(perfilSelecionado.avatar)} className="w-full h-full object-cover"/> : <User size={32} className="text-gray-300"/>}
                        </div>
                        
                        <div className="mt-2 flex flex-col items-center gap-1">
                            {checkPrivacidade(perfilSelecionado, 'cargo') && (
                                <div className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border text-center flex items-center justify-center gap-1 ${getRoleBadgeStyle(perfilSelecionado)}`}>
                                    {getRoleInfo(perfilSelecionado.tipo).icon} {getRoleInfo(perfilSelecionado.tipo).texto}
                                </div>
                            )}
                            
                            {checkPrivacidade(perfilSelecionado, 'cargo') && isModeratorUser(perfilSelecionado) && (
                                <div className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border text-center flex items-center justify-center gap-1 bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-900/40 dark:text-indigo-300">
                                    <ShieldAlert size={9} strokeWidth={2.5}/> Moderador
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="flex-1 pt-24 pr-4 pb-4 pl-3">
                        <h3 className="text-lg font-bold leading-tight dark:text-white">{perfilSelecionado.nome}</h3>
                        {checkPrivacidade(perfilSelecionado, 'recado') && <p className="text-xs text-gray-500 dark:text-gray-400 italic mb-2">"{perfilSelecionado.recado || 'Sem recado'}"</p>}
                        
                        {/* ✅ CORREÇÃO AQUI: Exibição segura de email e telefone */}
                        <div className="space-y-1.5 pt-2 border-t dark:border-gray-700 text-xs text-gray-500">
                            <div className="flex items-center gap-2"><Calendar size={12} className="text-indigo-500"/> Desde {format(safeDate(perfilSelecionado.criadoEm) || new Date(), 'MMM yyyy', { locale: ptBR })}</div>
                            
                            {checkPrivacidade(perfilSelecionado, 'email') && perfilSelecionado.email && (
                                <div className="flex items-center gap-2"><Mail size={12} className="text-blue-500"/> {perfilSelecionado.email}</div>
                            )}
                            
                            {checkPrivacidade(perfilSelecionado, 'telefone') && perfilSelecionado.telefone && (
                                <div className="flex items-center gap-2"><Phone size={12} className="text-green-500"/> {perfilSelecionado.telefone}</div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        )}

        <div className="max-w-4xl mx-auto space-y-6 pb-20">
            <div className="flex items-center gap-4">
                <button onClick={() => navigate('/blog')} className="p-2 bg-[#fdfbf7] dark:bg-gray-800 border dark:border-gray-700 rounded-xl hover:bg-gray-50 transition-colors shadow-sm dark:text-white"><ArrowLeft size={18}/></button>
                <div className="flex-1">
                    <h1 className="text-2xl font-black text-gray-900 dark:text-white leading-tight">{post.titulo}</h1>
                    <div className="flex items-center gap-3 text-xs text-gray-500 mt-1 flex-wrap">
                        <div className="flex items-center gap-1.5 font-bold cursor-pointer hover:text-indigo-600 transition-colors" onMouseEnter={(e)=>handleMouseEnter(e, post.autor)} onMouseLeave={()=>closeTimeoutRef.current = setTimeout(()=>setPerfilSelecionado(null), 300)}>
                            {checkPrivacidade(post.autor, 'foto') && post.autor?.avatar ? <img src={getAvatarUrl(post.autor.avatar)} className="w-5 h-5 rounded-full object-cover"/> : <User size={14}/>} <span className="dark:text-gray-300">{post.autor?.nome}</span>
                        </div>
                        <span className="flex items-center gap-1"><Clock size={12}/> {formatarDataCompleta(post.criadoEm || post.createdAt)}</span>
                        
                        {foiEditado && post.atualizadoEm && (
                            <span 
                                className="bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded text-[10px] italic text-gray-500 dark:text-gray-400 cursor-help"
                                title={`Editado em: ${format(new Date(post.atualizadoEm), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`}
                            >
                                (Editado)
                            </span>
                        )}

                        <span>•</span><span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-[10px] font-bold uppercase">{post.categoria || 'Geral'}</span>
                        {(usuario?.tipo === 'OWNER' || usuario?.tipo === 'CEO') && (
                            <>
                                <span>•</span><span className="flex items-center gap-1 text-gray-500"><Eye size={12}/> {post.visualizacoes || 0}</span>
                            </>
                        )}
                        <span>•</span><span className="flex items-center gap-1 text-gray-500"><Heart size={12}/> {post.likes || 0}</span>
                        <span>•</span><span className="flex items-center gap-1 text-gray-500"><MessageCircle size={12}/> {post.numComentarios || 0}</span>

                        {podeEditar && (
                            <button onClick={handleEditarPost} className="ml-2 flex items-center gap-1 px-2 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg hover:bg-indigo-100 transition-colors text-[10px] font-bold">
                                <Edit size={12}/> Editar
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <article className="bg-[#fdfbf7] dark:bg-gray-800 rounded-3xl shadow-sm border dark:border-gray-700 p-8 md:p-10 overflow-hidden">
                {post.imagemCapa && <img src={getImageUrl(post.imagemCapa)} className="w-full h-auto max-h-[400px] object-cover rounded-2xl mb-8 shadow-sm" />}
                
                <div 
                    className="prose prose-base dark:prose-invert max-w-none ql-editor !p-0 [&_p]:mb-4 [&_p]:leading-relaxed [&_ul]:mb-4 [&_ol]:mb-4 [&_li]:mb-1 [&_h1]:mt-6 [&_h1]:mb-4 [&_h2]:mt-6 [&_h2]:mb-4 [&_h3]:mt-4 [&_h3]:mb-2" 
                    dangerouslySetInnerHTML={{ __html: post.conteudo }} 
                />
                
                <div className="mt-10 pt-6 border-t dark:border-gray-700 flex items-center justify-between">
                    <button onClick={handleLikePost} className={`flex items-center gap-2 px-6 py-2.5 rounded-full font-bold transition-all shadow-sm ${curtido ? 'bg-indigo-600 text-white shadow-indigo-200' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200'}`}>
                        <ThumbsUp size={16} className={curtido ? 'fill-current' : ''}/> {likes} {curtido ? 'Curtida' : 'Curtir'}
                    </button>

                    <button onClick={handleSalvarPost} className={`flex items-center gap-2 px-6 py-2.5 rounded-full font-bold transition-all shadow-sm ${salvo ? 'bg-yellow-100 text-yellow-800 border-yellow-300' : 'bg-white border border-gray-200 hover:bg-gray-50'}`}>
                        <Bookmark size={16} fill={salvo ? "currentColor" : "none"}/> {salvo ? 'Salvo' : 'Salvar'}
                    </button>
                </div>
            </article>

            {relatedPosts.length > 0 && (
                <div className="bg-[#fdfbf7] dark:bg-gray-800 rounded-3xl shadow-sm border dark:border-gray-700 p-6">
                    <h3 className="font-bold text-gray-800 dark:text-white mb-4 text-xs uppercase tracking-widest flex items-center gap-2"><Flame size={14} className="text-orange-500"/> Leia também</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {relatedPosts.map(rel => (
                            <div key={rel.id} onClick={()=>navigate(`/blog/post/${rel.slug}`)} className="cursor-pointer group flex flex-col gap-2 p-2 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-all border border-transparent hover:border-gray-200">
                                <div className="w-full h-32 bg-gray-100 dark:bg-gray-700 rounded-xl overflow-hidden shrink-0 relative">
                                    {rel.imagemCapa ? <img src={getImageUrl(rel.imagemCapa)} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"/> : <div className="w-full h-full flex items-center justify-center text-gray-300"><Briefcase/></div>}
                                    <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black/80 to-transparent p-2">
                                         <p className="text-[9px] text-white font-bold">{formatarDataCompleta(rel.criadoEm).split('às')[0]}</p>
                                    </div>
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold text-gray-800 dark:text-gray-200 line-clamp-2 group-hover:text-indigo-600 transition-colors leading-tight mb-1">{rel.titulo}</h4>
                                    <p className="text-[10px] text-gray-500 dark:text-gray-400 line-clamp-2">{rel.resumo || 'Clique para ler o conteúdo completo.'}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="bg-[#fdfbf7] dark:bg-gray-800 rounded-3xl shadow-sm border dark:border-gray-700 p-6 md:p-8">
                <h3 className="font-bold text-gray-800 dark:text-white flex items-center gap-2 mb-6 text-sm uppercase tracking-wider border-b dark:border-gray-700 pb-3"><MessageSquare size={16} className="text-indigo-600"/> Discussão ({comentarios.length})</h3>
                <form onSubmit={handleEnviar} className="mb-10 flex gap-4">
                    <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 border dark:border-gray-700">{usuario?.avatar ? <img src={getAvatarUrl(usuario.avatar)} className="w-full h-full object-cover"/> : <div className="w-full h-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-500"><User size={20}/></div>}</div>
                    <div className="flex-1 relative"><textarea value={novoComentarioPrincipal} maxLength={MAX_CHARS} onChange={(e) => setNovoComentarioPrincipal(e.target.value)} placeholder="Deixe um comentário..." className="w-full bg-gray-50 dark:bg-gray-900 dark:text-white border dark:border-gray-700 rounded-2xl p-4 pr-14 text-sm focus:ring-2 outline-none resize-none min-h-[60px] shadow-inner transition-all"/><button type="submit" disabled={enviandoComentario || !novoComentarioPrincipal.trim()} className="absolute bottom-3 right-3 p-2 bg-indigo-600 text-white rounded-xl shadow-md disabled:opacity-50 hover:bg-indigo-700 transition-colors">{enviandoComentario ? <Loader2 className="animate-spin" size={16}/> : <Send size={16}/>}</button></div>
                </form>
                <div className={`text-xs text-right mt-1 mr-1 mb-6 ${novoComentarioPrincipal.length >= MAX_CHARS ? 'text-red-500 font-bold' : 'text-gray-400'}`}>{novoComentarioPrincipal.length}/{MAX_CHARS}</div>

                <div className="space-y-4">
                    {arvoreComentarios.slice(0, comentariosVisiveis).map((com) => (
                        <ComentarioItem 
                            key={com.id} 
                            comentario={com} 
                            nivel={0} 
                            onResponderClick={setActiveReplyId} 
                            onLike={handleLikeComentario} 
                            onDelete={handleDeleteComment} 
                            onEdit={handleEditComment}
                            getAvatarUrl={getAvatarUrl} 
                            activeReplyId={activeReplyId} 
                            submitResposta={handleEnviar} 
                            usuarioLogado={usuario} 
                            checkPrivacidade={checkPrivacidade}
                            handleMouseEnter={handleMouseEnter}
                            handleMouseLeave={()=>closeTimeoutRef.current = setTimeout(()=>setPerfilSelecionado(null), 300)}
                        />
                    ))}
                    {arvoreComentarios.length > comentariosVisiveis && (
                        <button onClick={()=>setComentariosVisiveis(v => v + 10)} className="w-full py-4 text-xs font-bold text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-2xl transition-all border border-dashed border-indigo-200 dark:border-indigo-800 mt-4">Ver mais comentários ({arvoreComentarios.length - comentariosVisiveis})</button>
                    )}
                    {comentarios.length === 0 && <div className="text-center py-10 text-gray-400 text-sm italic">Nenhum comentário ainda. Seja o primeiro a comentar!</div>}
                </div>
            </div>
        </div>

        {showScrollTop && (
            <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="fixed bottom-8 right-8 p-4 bg-indigo-600 text-white rounded-full shadow-2xl hover:bg-indigo-700 transition-all z-50 animate-bounce">
                <ArrowUp size={20} strokeWidth={3} />
            </button>
        )}
      </BlogLayout>
    </PostErrorBoundary>
  );
};

export default BlogPost;