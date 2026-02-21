import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contextos/AuthContext';
import api from '../../servicos/api';
import { 
  User, Clock, ImageOff, Share2, Layout, ArrowUp, ArrowDown, 
  ChevronLeft, ChevronRight, Edit, Trash2, Info, Link as LinkIcon, 
  Archive, ArchiveRestore, Star, EyeOff, Save, Tag, Bookmark, Eye, Heart, Flame, MessageCircle, Quote
} from 'lucide-react';
import { formatDistanceToNow, format, isValid, subDays, isAfter } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import toast from 'react-hot-toast';
import BlogLayout from './BlogLayout';

class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { hasError: false }; }
  static getDerivedStateFromError(error) { return { hasError: true }; }
  render() { if (this.state.hasError) return <div className="p-10 text-center text-red-500">Erro ao carregar. Recarregue.</div>; return this.props.children; }
}

const BlogPrincipal = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { usuario } = useAuth();
  
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [termoBusca, setTermoBusca] = useState('');
  const [indiceCarousel, setIndiceCarousel] = useState(0);
  const [abaAtiva, setAbaAtiva] = useState('noticias');
  
  const [secoes, setSecoes] = useState(['destaque', 'lista']); 
  const [modoEdicao, setModoEdicao] = useState(false);
  const [verArquivados, setVerArquivados] = useState(false);
  const [apenasSalvos, setApenasSalvos] = useState(false); 
  
  const [linksUteis, setLinksUteis] = useState([]);
  const [novoLink, setNovoLink] = useState({ title: '', sub: '', url: '' });
  const [dica, setDica] = useState({ titulo: 'Dica', texto: 'Carregando...' });

  const [tagsDisponiveis, setTagsDisponiveis] = useState([]); 
  const [tagSelecionada, setTagSelecionada] = useState(null); 

  const safeDate = (d) => { if (!d) return null; try { return isValid(new Date(d)) ? new Date(d) : null; } catch { return null; } };
  
  const formatarDataCompleta = (d) => { 
      const data = safeDate(d); 
      return data ? format(data, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }) : 'Data indisponível'; 
  };

  const safeString = (s) => (typeof s === 'string' ? s : '');
  const getAutorNome = (p) => p?.autor?.nome || 'Redação';
  const getCategoria = (p) => p?.categoria?.nome || p?.categoria || 'Geral';
  
  const getAvatarUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    const baseUrl = new URL(apiUrl).origin;
    return `${baseUrl}/uploads/avatars/${path}`;
  };

  const getResumo = (post) => post.resumo?.trim() || (post.conteudo ? post.conteudo.replace(/<[^>]*>?/gm, '').substring(0, 120) + '...' : '...');

  const abrirLink = (url) => {
      if (!url) return;
      let finalUrl = url.trim();
      if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
          finalUrl = `https://${finalUrl}`;
      }
      window.open(finalUrl, '_blank', 'noopener,noreferrer');
  };

  useEffect(() => {
    if (location.state && location.state.abaInicial) {
      setAbaAtiva(location.state.abaInicial);
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  // Carrega posts, tags e configurações
  const carregar = async () => {
    setLoading(true);
    try {
      // 1. Posts
      const params = new URLSearchParams();
      if (apenasSalvos) params.append('apenasSalvos', 'true');
      if (tagSelecionada) params.append('tag', tagSelecionada);
      if (abaAtiva !== 'noticias') params.append('categoria', abaAtiva);

      const res = await api.get(`/blog?${params.toString()}`);
      const lista = res.data.posts || [];
      if (Array.isArray(lista)) setPosts(lista);

      // 2. Tags
      const resTags = await api.get('/blog/tags');
      setTagsDisponiveis(resTags.data.tags || []);

      // 3. Configurações Globais (Backend)
      const resConfig = await api.get('/blog/config');
      if (resConfig.data) {
          if (resConfig.data.linksUteis) setLinksUteis(resConfig.data.linksUteis);
          if (resConfig.data.dica) setDica(resConfig.data.dica);
      }

    } catch (e) { console.error(e); } 
    finally { setLoading(false); }
  };

  useEffect(() => {
    carregar();
  }, [apenasSalvos, tagSelecionada, abaAtiva]); 

  // Salvar Configurações no Backend
  const salvarConfiguracoesBackend = async (novosLinks, novaDica) => {
      try {
          await api.post('/blog/config', {
              linksUteis: novosLinks || linksUteis,
              dica: novaDica || dica
          });
          toast.success("Configurações salvas para todos!");
      } catch (e) {
          toast.error("Erro ao salvar config global.");
      }
  };

  useEffect(() => {
    try {
        const savedOrder = localStorage.getItem('blog_layout_order');
        if (savedOrder) setSecoes(JSON.parse(savedOrder));
    } catch(e){}
  }, []);

  const salvarDica = () => {
      salvarConfiguracoesBackend(null, dica);
  };

  useEffect(() => {
    const postsAtivos = posts.filter(p => !p.arquivado);
    if (postsAtivos.slice(0, 5).length <= 1) return;
    
    // ✅ ALTERAÇÃO: Tempo aumentado para 12000ms (12 segundos) para dar tempo de ler
    const timer = setInterval(() => setIndiceCarousel(p => (p + 1) % Math.min(postsAtivos.length, 5)), 12000);
    return () => clearInterval(timer);
  }, [posts.length]);

  const nextSlide = (e) => { e.stopPropagation(); setIndiceCarousel(p => (p + 1) % 5); };
  const prevSlide = (e) => { e.stopPropagation(); setIndiceCarousel(p => (p - 1 + 5) % 5); };

  const moverSecao = (index, direcao) => {
    const novaOrdem = [...secoes];
    const [item] = novaOrdem.splice(index, 1);
    novaOrdem.splice(index + direcao, 0, item);
    setSecoes(novaOrdem);
    localStorage.setItem('blog_layout_order', JSON.stringify(novaOrdem));
  };

  const handleArquivar = async (e, id) => {
      e.stopPropagation();
      if(!window.confirm("Alterar status de arquivamento?")) return;
      try {
          await api.patch(`/blog/posts/${id}/arquivar`);
          toast.success("Status atualizado!");
          carregar();
      } catch (err) { toast.error("Erro ao arquivar."); }
  };

  const handleExcluir = async (e, id) => {
      e.stopPropagation();
      if(!window.confirm("ATENÇÃO: Exclusão permanente! Continuar?")) return;
      try {
          await api.delete(`/blog/posts/${id}`);
          toast.success("Post excluído.");
          carregar();
      } catch (err) { toast.error("Erro ao excluir."); }
  };

  const handleDestacarManual = async (e, id) => {
      e.stopPropagation();
      try {
          await api.patch(`/blog/posts/${id}/destaque`);
          toast.success("Lista de 'Leia Também' atualizada!");
          carregar(); 
      } catch (err) { toast.error("Erro ao destacar."); }
  };

  const postsFiltrados = posts.filter(p => {
      if (!verArquivados && p.arquivado) return false;
      if (termoBusca && !safeString(p.titulo).toLowerCase().includes(termoBusca.toLowerCase()) && !safeString(p.resumo).toLowerCase().includes(termoBusca.toLowerCase())) return false;
      return true;
  });

  // Lógica de Destaque do Dia (Maior engajamento nos ultimos 7 dias)
  const destaqueDoDia = React.useMemo(() => {
      if (postsFiltrados.length === 0) return null;
      const dataLimite = subDays(new Date(), 7); 
      
      const candidatos = postsFiltrados.filter(p => !p.arquivado && isAfter(new Date(p.criadoEm), dataLimite));
      if (candidatos.length === 0) return null;

      // Score: Visualização (1pt) + Like (2pts)
      const ordenados = [...candidatos].sort((a, b) => {
          const scoreA = (a.visualizacoes || 0) + ((a.likes || 0) * 2);
          const scoreB = (b.visualizacoes || 0) + ((b.likes || 0) * 2);
          return scoreB - scoreA;
      });

      const melhor = ordenados[0];
      if ((melhor.visualizacoes || 0) + (melhor.likes || 0) > 0) return melhor;
      return null;
  }, [postsFiltrados]);
  
  const slides = postsFiltrados.filter(p => !p.arquivado).slice(0, 5);
  const atual = slides[indiceCarousel] || slides[0];

  const renderCapa = (post, isHero) => {
    let src = post?.imagemCapa;
    if (src && !src.startsWith('http')) {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
        const baseUrl = new URL(apiUrl).origin;
        src = `${baseUrl}${src.startsWith('/')?'':'/'}${src}`;
    }
    if (src) return <img src={src} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" onError={(e)=>{e.target.style.display='none'}}/>;
    return <div className={`w-full h-full flex items-center justify-center bg-gray-800`}>{!isHero && <ImageOff size={18} className="text-gray-500 opacity-50"/>}</div>;
  };

  const BotoesAcao = ({ post }) => (
    (modoEdicao && (usuario?.tipo === 'OWNER' || usuario?.tipo === 'CEO')) ? (
        <div className="flex gap-2 z-20">
            <button 
                onClick={(e) => handleDestacarManual(e, post.id)} 
                className={`p-1.5 rounded-lg shadow-sm border transition-all ${post.destaque ? 'bg-yellow-100 text-yellow-600 border-yellow-300' : 'bg-white text-gray-300 border-gray-200 hover:text-yellow-400'}`}
                title="Selecionar para 'Leia Também'"
            >
                <Star size={14} fill={post.destaque ? "currentColor" : "none"} />
            </button>
            <button onClick={(e) => handleArquivar(e, post.id)} className="p-1.5 bg-white text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-100 shadow-sm" title={post.arquivado ? "Desarquivar" : "Arquivar"}>
                {post.arquivado ? <ArchiveRestore size={14}/> : <Archive size={14}/>}
            </button>
            <button onClick={(e) => handleExcluir(e, post.id)} className="p-1.5 bg-white text-red-500 border border-red-100 rounded-lg hover:bg-red-50 shadow-sm" title="Excluir Permanente">
                <Trash2 size={14}/>
            </button>
        </div>
    ) : null
  );

  const ComponenteDestaque = () => (
    (apenasSalvos || tagSelecionada) ? null : ( 
    <div className="relative bg-black rounded-3xl overflow-hidden shadow-lg group h-[260px] cursor-pointer border border-gray-200 dark:border-gray-800 mb-8 transition-transform hover:scale-[1.01]" onClick={() => navigate(`/blog/post/${atual?.slug || atual?.id}`)}>
      {atual ? (
        <>
          <div className="absolute inset-0 opacity-80">{renderCapa(atual, true)}</div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent"></div>
          
          <button onClick={prevSlide} className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white/20 hover:bg-white/40 text-white rounded-full backdrop-blur-md transition-all z-20 opacity-0 group-hover:opacity-100"><ChevronLeft size={20}/></button>
          <button onClick={nextSlide} className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white/20 hover:bg-white/40 text-white rounded-full backdrop-blur-md transition-all z-20 opacity-0 group-hover:opacity-100"><ChevronRight size={20}/></button>

          <div className="absolute top-4 right-4 z-50" onClick={e => e.stopPropagation()}>
              <BotoesAcao post={atual} />
          </div>

          {/* PRÉVIA DO COMENTÁRIO DESTAQUE NO BANNER */}
          {atual.topComentario && (
            <div className="absolute right-6 top-1/2 -translate-y-1/2 hidden md:block max-w-xs animate-fadeIn" onClick={e => e.stopPropagation()}>
                <div className="bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-xl shadow-2xl relative">
                    <Quote size={20} className="absolute -top-3 -left-2 text-white/80 fill-white/20"/>
                    <div className="flex items-center gap-2 mb-2">
                        {atual.topComentario.autor?.avatar ? (
                            <img src={getAvatarUrl(atual.topComentario.autor.avatar)} className="w-6 h-6 rounded-full border border-white/30 object-cover"/>
                        ) : (
                            <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-[10px] text-white font-bold">{atual.topComentario.autor?.nome?.charAt(0)}</div>
                        )}
                        <span className="text-xs font-bold text-white shadow-sm">{atual.topComentario.autor?.nome}</span>
                    </div>
                    <p className="text-xs text-white/90 italic leading-relaxed line-clamp-3">"{atual.topComentario.texto}"</p>
                    <div className="mt-2 text-[10px] text-white/60 font-bold flex items-center gap-1 justify-end">
                        <MessageCircle size={10} className="text-indigo-300"/> Comentário em destaque
                    </div>
                </div>
            </div>
          )}

          <div className="absolute bottom-0 left-0 w-full p-6 z-10">
            <span className="bg-indigo-600 text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase mb-2 inline-block shadow-sm">{safeString(getCategoria(atual))}</span>
            <h2 className="text-2xl md:text-3xl font-black text-white mb-2 leading-tight line-clamp-1 max-w-2xl">{safeString(atual.titulo)}</h2>
            <div className="flex items-center gap-4 text-[10px] text-gray-300 font-medium">
               <div className="flex items-center gap-2">
                 {atual.autor?.avatar ? <img src={getAvatarUrl(atual.autor.avatar)} className="w-5 h-5 rounded-full object-cover border border-white/20" /> : <User size={14}/>}
                 {getAutorNome(atual)}
               </div>
               <span className="flex items-center gap-1"><Clock size={12}/> {formatarDataCompleta(atual.criadoEm)}</span>
               <span className="flex items-center gap-1 bg-black/30 px-2 py-0.5 rounded-full"><Eye size={12}/> {atual.visualizacoes || 0}</span>
               <span className="flex items-center gap-1 bg-black/30 px-2 py-0.5 rounded-full"><Heart size={12}/> {atual.likes || 0}</span>
               <span className="flex items-center gap-1 bg-black/30 px-2 py-0.5 rounded-full"><MessageCircle size={12}/> {atual.numComentarios || 0}</span>
            </div>
          </div>
          
          <div className="absolute top-4 right-1/2 translate-x-1/2 flex gap-1.5 z-20">
            {slides.map((_, i) => (<div key={i} onClick={(e)=>{e.stopPropagation();setIndiceCarousel(i)}} className={`w-2 h-2 rounded-full cursor-pointer transition-all ${i===indiceCarousel ? 'bg-indigo-500 w-4' : 'bg-white/40 hover:bg-white'}`}/>))}
          </div>
        </>
      ) : <div className="flex flex-col items-center justify-center h-full text-white/50"><Share2 size={32}/><p className="text-sm mt-2">Sem destaques</p></div>}
    </div>
    )
  );

  const ComponenteLista = () => {
    let listaParaExibir = postsFiltrados; 
    
    // ✅ ALTERAÇÃO: Removida a lógica de slice para não restringir posts na lista
    // if (!apenasSalvos && !tagSelecionada) {
    //     listaParaExibir = postsFiltrados.slice(5);
    // }

    if (destaqueDoDia) {
        listaParaExibir = listaParaExibir.filter(p => p.id !== destaqueDoDia.id);
        listaParaExibir.unshift(destaqueDoDia);
    }

    return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-gray-800 dark:text-white text-lg flex items-center gap-2">
            {apenasSalvos ? <Bookmark size={18} className="text-indigo-500"/> : (tagSelecionada ? <Tag size={18} className="text-indigo-500"/> : <Clock size={18} className="text-indigo-500"/>)}
            {apenasSalvos ? 'Meus Itens Salvos' : (tagSelecionada ? `Posts com #${tagSelecionada}` : 'Últimas Notícias')}
        </h3>
        {(apenasSalvos || tagSelecionada) && (
            <button onClick={() => { setApenasSalvos(false); setTagSelecionada(null); }} className="text-xs text-red-500 font-bold hover:underline">Limpar filtros</button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3">
        {listaParaExibir.length === 0 ? <p className="text-gray-500 text-sm italic py-4">Nenhum post encontrado.</p> :
        listaParaExibir.map(post => {
          const isDestaqueDoDia = destaqueDoDia && post.id === destaqueDoDia.id;
          
          return (
          <div 
             key={post.id} 
             onClick={() => navigate(`/blog/post/${post.slug || post.id}`)} 
             className={`flex flex-col md:flex-row rounded-2xl border p-3 gap-4 hover:shadow-lg transition-all cursor-pointer group 
                ${post.arquivado ? 'border-red-200 opacity-60 bg-red-50' : 
                  isDestaqueDoDia ? 'bg-gradient-to-r from-indigo-50 to-white dark:from-indigo-900/20 dark:to-gray-800 border-indigo-200 dark:border-indigo-700 shadow-md transform scale-[1.02]' : 
                  'bg-[#fdfbf7] dark:bg-gray-800 border-gray-200 dark:border-gray-700'}`
             }
          >
            <div className="w-full md:w-48 h-32 bg-gray-100 dark:bg-gray-900 rounded-xl overflow-hidden shrink-0 relative border border-gray-100 dark:border-gray-700 shadow-inner">
              {renderCapa(post)}
              <div className="absolute top-2 left-2 bg-black/60 backdrop-blur px-2 py-0.5 rounded-md text-[9px] font-bold text-white uppercase">{safeString(getCategoria(post))}</div>
              {post.salvoPorMim && <div className="absolute top-2 right-2 bg-yellow-400 text-yellow-900 p-1 rounded-full shadow-sm"><Bookmark size={12} fill="currentColor"/></div>}
              {post.arquivado && <div className="absolute inset-0 bg-white/50 flex items-center justify-center font-bold text-red-600 border-2 border-red-500 rounded-xl m-2"><EyeOff className="mr-2"/> ARQUIVADO</div>}
            </div>
            
            <div className="flex-1 flex flex-col justify-center min-w-0 relative">
              <div className="absolute top-0 right-0 z-20" onClick={e => e.stopPropagation()}>
                 <BotoesAcao post={post} />
              </div>

              <div className="flex items-center gap-2 mb-1 text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wide flex-wrap">
                {isDestaqueDoDia && (
                    <span className="bg-orange-500 text-white px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm mr-1 animate-pulse"><Flame size={10} fill="currentColor"/> Destaque do Dia</span>
                )}
                <div className="flex items-center gap-1.5">
                   {post.autor?.avatar ? <img src={getAvatarUrl(post.autor.avatar)} className="w-4 h-4 rounded-full object-cover"/> : <User size={12}/>}
                   {getAutorNome(post)}
                </div>
                <span className="text-gray-400">•</span>
                {formatarDataCompleta(post.criadoEm)}
                <span className="text-gray-400">•</span>
                <span className="flex items-center gap-1 text-gray-500"><Eye size={10}/> {post.visualizacoes || 0}</span>
                <span className="flex items-center gap-1 text-gray-500"><Heart size={10}/> {post.likes || 0}</span>
                <span className="flex items-center gap-1 text-gray-500"><MessageCircle size={10}/> {post.numComentarios || 0}</span>
                
                {post.destaque && <span className="bg-yellow-100 text-yellow-700 px-1.5 rounded border border-yellow-200 flex items-center gap-1 ml-1"><Star size={8} fill="currentColor"/> Destaque</span>}
              </div>
              <h4 className="text-base font-bold text-gray-900 dark:text-white leading-tight mb-1 group-hover:text-indigo-500 transition-colors line-clamp-1">{safeString(post.titulo)}</h4>
              <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">{getResumo(post)}</p>
              {post.tags && (
                  <div className="flex gap-1 mt-2 flex-wrap">
                      {typeof post.tags === 'string' ? JSON.parse(post.tags).map(t=><span key={t} className="text-[9px] bg-indigo-50 text-indigo-600 px-1.5 rounded">#{t}</span>) : post.tags.map(t=><span key={t} className="text-[9px] bg-indigo-50 text-indigo-600 px-1.5 rounded">#{t}</span>)}
                  </div>
              )}
            </div>

            {/* ✅ PRÉVIA DO COMENTÁRIO EM "DESTAQUE DO DIA" NA LISTA */}
            {isDestaqueDoDia && post.topComentario && (
                <div className="hidden lg:flex w-64 shrink-0 flex-col justify-center border-l border-indigo-100 dark:border-gray-700 pl-4">
                     <div className="bg-white/50 dark:bg-gray-700/50 p-3 rounded-xl border border-indigo-50 dark:border-gray-600 relative hover:bg-white dark:hover:bg-gray-700 transition-colors">
                         <Quote className="absolute -top-2 -left-2 text-indigo-200 dark:text-indigo-800 fill-indigo-100 dark:fill-indigo-900" size={16}/>
                         <div className="flex items-center gap-2 mb-1">
                             {post.topComentario.autor?.avatar ? (
                                <img src={getAvatarUrl(post.topComentario.autor.avatar)} className="w-5 h-5 rounded-full object-cover"/>
                             ) : (
                                <div className="w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center text-[9px] text-indigo-600 font-bold">{post.topComentario.autor?.nome?.charAt(0)}</div>
                             )}
                             <span className="text-[10px] font-bold text-gray-700 dark:text-gray-200 truncate">{post.topComentario.autor?.nome}</span>
                         </div>
                         <p className="text-[10px] text-gray-500 dark:text-gray-400 italic leading-relaxed line-clamp-3">"{post.topComentario.texto}"</p>
                     </div>
                </div>
            )}
          </div>
        )})}
      </div>
    </div>
  )};

  const abas = [{ id: 'noticias', label: 'Notícias' }, { id: 'comunicados', label: 'Comunicados' }, { id: 'eventos', label: 'Eventos' }];

  if (loading && !posts.length) return <div className="flex justify-center items-center h-screen bg-[#e2e4e7] dark:bg-[#0b0f19]"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>;

  // SIDEBAR
  const sidebarJsx = (
    <>
      <div className="bg-[#fdfbf7] dark:bg-gray-800 rounded-3xl border border-gray-200 dark:border-gray-700 shadow-sm p-5">
        <div className="flex justify-between items-center mb-4 pb-3 border-b border-gray-100 dark:border-gray-700">
            <h3 className="font-bold text-sm text-gray-800 dark:text-white flex items-center gap-2"><Info size={16} className="text-indigo-500"/> Acesso Rápido</h3>
            {usuario?.tipo === 'OWNER' && <button onClick={()=>setModoEdicao(!modoEdicao)} className={`p-1.5 rounded hover:bg-gray-100 ${modoEdicao?'text-green-500':'text-gray-400'}`}><Edit size={14}/></button>}
        </div>
        
        {/* BOTÃO MEUS SALVOS NA LATERAL */}
        <button 
            onClick={() => { setApenasSalvos(!apenasSalvos); setTagSelecionada(null); }} 
            className={`w-full flex items-center gap-3 p-2.5 rounded-xl transition-all border mb-3 ${
                apenasSalvos 
                ? 'bg-yellow-100 text-yellow-800 border-yellow-300 shadow-sm' 
                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
            }`}
        >
            <Bookmark size={16} fill={apenasSalvos ? "currentColor" : "none"}/>
            <span className="text-xs font-bold">Meus Itens Salvos</span>
        </button>

        {modoEdicao && (
            <div className="mb-4 bg-gray-50 dark:bg-gray-700/30 p-3 rounded-xl border border-dashed border-gray-300 dark:border-gray-600">
                <input placeholder="Título (ex: Intranet)" value={novoLink.title} onChange={e=>setNovoLink(prev => ({...prev, title:e.target.value}))} className="w-full mb-2 p-2 text-xs rounded border dark:bg-gray-800 dark:border-gray-600 dark:text-white"/>
                <input placeholder="Subtítulo (ex: Acesso)" value={novoLink.sub} onChange={e=>setNovoLink(prev => ({...prev, sub:e.target.value}))} className="w-full mb-2 p-2 text-xs rounded border dark:bg-gray-800 dark:border-gray-600 dark:text-white"/>
                <input placeholder="Link (ex: google.com)" value={novoLink.url} onChange={e=>setNovoLink(prev => ({...prev, url:e.target.value}))} className="w-full mb-2 p-2 text-xs rounded border dark:bg-gray-800 dark:border-gray-600 dark:text-white"/>
                <button onClick={() => { 
                    if(!novoLink.title || !novoLink.url) return toast.error("Título e Link obrigatórios"); 
                    const novos = [...linksUteis, { id: Date.now(), ...novoLink, color:'indigo' }]; 
                    setLinksUteis(novos); 
                    salvarConfiguracoesBackend(novos, null); // Salva no backend
                    setNovoLink({ title:'', sub:'', url:'' }); 
                }} className="w-full bg-indigo-600 text-white text-xs py-2 rounded font-bold">Adicionar Link</button>
            </div>
        )}

        <div className="space-y-3">
          {linksUteis.map((l) => (
            <div key={l.id} className="flex justify-between items-center p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700/50 cursor-pointer transition-all border border-transparent hover:border-gray-200 dark:hover:border-gray-600 group" onClick={()=>!modoEdicao && abrirLink(l.url)}>
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg bg-${l.color || 'blue'}-100 dark:bg-${l.color || 'blue'}-900/30 text-${l.color || 'blue'}-600 dark:text-${l.color || 'blue'}-400`}><LinkIcon size={16}/></div>
                    <div><p className="text-xs font-bold text-gray-700 dark:text-gray-200">{l.title}</p><p className="text-[10px] text-gray-400 dark:text-gray-500">{l.sub}</p></div>
                </div>
                {modoEdicao && <button onClick={(e)=>{ 
                    e.stopPropagation(); 
                    const novos = linksUteis.filter(li => li.id !== l.id); 
                    setLinksUteis(novos); 
                    salvarConfiguracoesBackend(novos, null); // Salva no backend
                }} className="text-red-400 hover:text-red-600 p-1"><Trash2 size={14}/></button>}
            </div>
          ))}
        </div>
      </div>

      <div className="bg-[#fdfbf7] dark:bg-gray-800 rounded-3xl border border-gray-200 dark:border-gray-700 shadow-sm p-5 mt-6">
          <h3 className="font-bold text-sm mb-3 flex items-center gap-2 text-gray-800 dark:text-white"><Tag size={16} className="text-indigo-500"/> Nuvem de Tags</h3>
          <div className="flex flex-wrap gap-2">
              {tagsDisponiveis.map(tag => (
                  <button 
                      key={tag} 
                      onClick={() => setTagSelecionada(tag === tagSelecionada ? null : tag)}
                      className={`text-[10px] font-bold px-2 py-1 rounded-lg transition-colors border ${
                          tag === tagSelecionada 
                          ? 'bg-indigo-600 text-white border-indigo-600' 
                          : 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600'
                      }`}
                  >
                      #{tag}
                  </button>
              ))}
              {tagsDisponiveis.length === 0 && <p className="text-xs text-gray-400 italic">Nenhuma tag cadastrada.</p>}
          </div>
      </div>

      <div className="p-5 bg-gradient-to-br from-indigo-600 to-purple-700 rounded-3xl text-white shadow-lg relative overflow-hidden mt-6">
          {usuario?.tipo === 'OWNER' && modoEdicao ? (
              <div className="relative z-10 space-y-2">
                  <div className="flex items-center gap-2 mb-2">
                      <Share2 size={16}/> 
                      <input value={dica.titulo} onChange={e=>setDica(prev => ({...prev, titulo: e.target.value}))} className="bg-white/20 text-white text-sm font-bold p-1 rounded w-full placeholder-white/50 border-none outline-none"/>
                  </div>
                  <textarea value={dica.texto} onChange={e=>setDica(prev => ({...prev, texto: e.target.value}))} className="bg-white/20 text-white text-xs p-2 rounded w-full h-20 placeholder-white/50 border-none outline-none resize-none"/>
                  <button onClick={salvarDica} className="w-full bg-white text-indigo-700 text-xs py-1.5 rounded font-bold flex items-center justify-center gap-2"><Save size={12}/> Salvar Dica</button>
              </div>
          ) : (
              <>
                <h3 className="font-bold text-sm mb-3 flex items-center gap-2 relative z-10"><Share2 size={16}/> {dica.titulo}</h3>
                <p className="text-xs opacity-90 leading-relaxed font-medium relative z-10">{dica.texto}</p>
              </>
          )}
      </div>
    </>
  );

  return (
    <ErrorBoundary>
      <BlogLayout 
        termoBusca={termoBusca} 
        setTermoBusca={setTermoBusca}
        abas={abas}
        abaAtiva={abaAtiva}
        setAbaAtiva={setAbaAtiva}
        showCreateBtn={usuario?.tipo === 'OWNER'}
        onCreate={() => navigate('/blog/novo')}
        sidebarContent={sidebarJsx}
      >
        {/* BARRA DE GESTÃO - SÓ APARECE SE TIVER PERMISSÃO */}
        {(usuario?.tipo === 'OWNER' || usuario?.tipo === 'CEO') && (
            <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between bg-[#fdfbf7] dark:bg-gray-800 p-3 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 gap-4">
                 <div className="flex items-center gap-4 flex-wrap">
                    <span className="text-xs font-bold text-gray-500 uppercase flex items-center gap-2"><Layout size={14}/> Gestão</span>
                    <label className="flex items-center gap-2 cursor-pointer bg-gray-50 px-2 py-1 rounded-lg border border-gray-200">
                        <input type="checkbox" checked={modoEdicao} onChange={() => setModoEdicao(!modoEdicao)} className="w-3 h-3 text-indigo-600 rounded focus:ring-indigo-500" />
                        <span className={`text-xs font-bold ${modoEdicao ? 'text-indigo-600' : 'text-gray-400'}`}>Edição</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer bg-gray-50 px-2 py-1 rounded-lg border border-gray-200">
                        <input type="checkbox" checked={verArquivados} onChange={() => setVerArquivados(!verArquivados)} className="w-3 h-3 text-orange-600 rounded focus:ring-orange-500" />
                        <span className={`text-xs font-bold ${verArquivados ? 'text-orange-600' : 'text-gray-400'}`}>Arquivados</span>
                    </label>
                 </div>
            </div>
        )}

        <div className="space-y-8">
          {secoes.map((tipo, index) => (
            <div key={tipo} className="relative group/section">
              {usuario?.tipo === 'OWNER' && modoEdicao && (
                <div className="absolute -left-12 top-0 flex flex-col gap-2 z-30">
                  <button onClick={() => moverSecao(index, -1)} disabled={index === 0} className="p-2 bg-white shadow rounded-full"><ArrowUp size={16} /></button>
                  <button onClick={() => moverSecao(index, 1)} disabled={index === secoes.length - 1} className="p-2 bg-white shadow rounded-full"><ArrowDown size={16} /></button>
                </div>
              )}
              {tipo === 'destaque' ? <ComponenteDestaque/> : <ComponenteLista/>}
            </div>
          ))}
        </div>
      </BlogLayout>
    </ErrorBoundary>
  );
};

export default BlogPrincipal;