// frontend/src/componentes/ChatInterno/ChatFlutuante.jsx

import { useState, useEffect, useRef } from 'react';
import { 
  X, Search, Settings, HelpCircle, Megaphone, Plus,
  Loader2, MessageCircle, Users, MessageSquare, LifeBuoy,
  LogOut, ArrowLeft, Menu, UserCircle, Minus, ArrowDown,
  Sparkles, Home 
} from 'lucide-react';
import { useAuth } from '../../contextos/AuthContext';
import { useChat } from '../../contextos/ChatContext';
import { useChatCache } from './contextos/ChatCacheContext'; 
import api from '../../servicos/api';
import toast from 'react-hot-toast';
import io from 'socket.io-client';

import ListaConversas from './ListaConversas';
import MensagemBalao from './MensagemBalao';
import EditorMensagem from './EditorMensagem';
import ListaMembros from './ListaMembros';
import GerenciarGrupos from './GerenciarGrupos';
import VisualizarPerfilGrupo from './VisualizarPerfilGrupo';
import SolicitarAjuda from './SolicitarAjuda';
import EnviarAlerta from './EnviarAlerta';
import BalaoNotificacao from './BalaoNotificacao';
import NotificacaoSuporte from './NotificacaoSuporte';
import BotaoEncerrarAtendimento from './BotaoEncerrarAtendimento';
import VisualizarPerfil from './VisualizarPerfil';
import ChatIAView from './ChatIAView'; 
import VisualizarPerfilIA from './VisualizarPerfilIA'; 
import HomeChat from './HomeChat'; 
import PainelConfiguracoes from './PainelConfiguracoes'; 

import useAudio from '../../hooks/useAudio'; 
import NotificacaoAlerta from './NotificacaoAlerta'; 

import './css.chatinterno/ChatInterno.css';

const API_URL_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const SOCKET_URL = API_URL_BASE.replace('/api', '');

// ✅ NOVO PADRÃO "WHATSAPP STYLE" (Múltiplos ícones em um único path para repetição)
// Contém: Lua, Estrela, Coração, Nota Musical, Flor, Pata, Raio espalhados.
const DEFAULT_DOODLE = "M15 15c-2 0-3 2-3 4s2 4 4 4 4-2 4-4-2-4-5-4zm30 10l5-8 5 8h8l-6 5 2 8-7-5-7 5 2-8-6-5h8zm40-5a5 5 0 1 0 0 10 5 5 0 0 0 0-10zm-60 40c0-5 4-9 9-9s9 4 9 9-4 9-9 9-9-4-9-9zm30 10l5-10h-10l5 10zm40 10c-3 0-5 3-5 6s3 5 6 5 5-3 5-6-2-5-6-5zm-70 10l3-5h-6l3 5zm-15-25l4-2 2 4-4 2-2-4zm80-30l-4 4-4-4 4-4 4 4z";
const DEFAULT_BG_COLOR = "#efeae2";

// Configura o background padrão
const DEFAULT_WALLPAPER_CSS = `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='${DEFAULT_DOODLE}' fill='%23000000' fill-opacity='0.06'/%3E%3C/svg%3E"), ${DEFAULT_BG_COLOR}`;

export default function ChatFlutuante() {
  const { usuario, atualizarUsuario } = useAuth();
  const { aberto, setAberto, conversaAtual, selecionarConversa } = useChat();
  const cache = useChatCache(); 

  const [abaAtiva, setAbaAtiva] = useState('home'); 
  const [painelLateral, setPainelLateral] = useState(null); 
  const [sidebarExpandida, setSidebarExpandida] = useState(false);
  
  const [mensagens, setMensagens] = useState([]);
  const [carregandoMensagens, setCarregandoMensagens] = useState(false);
  const [baloes, setBaloes] = useState([]);
  const [totalNotificacoes, setTotalNotificacoes] = useState(0);
  const [statusMap, setStatusMap] = useState({}); 
  const [primeiraCarga, setPrimeiraCarga] = useState(true);
  const [participanteAtivo, setParticipanteAtivo] = useState(true);
  const [botaoScrollVisible, setBotaoScrollVisible] = useState(false);

  const [solicitacaoParaAvaliar, setSolicitacaoParaAvaliar] = useState(null);
  const [alertaParaResponder, setAlertaParaResponder] = useState(null); 
  const [membroPerfil, setMembroPerfil] = useState(null); 
  const [grupoParaEditar, setGrupoParaEditar] = useState(null); 

  const [conversasIA, setConversasIA] = useState([]); 
  const [chatIAAtivo, setChatIAAtivo] = useState(null); 
  const [isTypingIA, setIsTypingIA] = useState(false); 

  const [posicaoY, setPosicaoY] = useState(() => {
    try {
        const saved = localStorage.getItem('chat_dock_pos_y');
        const parsed = parseInt(saved);
        if (isNaN(parsed)) return window.innerHeight / 2 - 45;
        return Math.max(0, Math.min(parsed, window.innerHeight - 100));
    } catch {
        return window.innerHeight / 2 - 45;
    }
  });

  const [isDragging, setIsDragging] = useState(false);
  
  const mensagensRef = useRef(null);
  const fimMensagensRef = useRef(null);
  const socketRef = useRef(null);
  const dragStartY = useRef(0);
  
  const playSomReceber = useAudio('RECEBER'); 
  const playSomAlerta = useAudio('ALERTA'); 

  const isSuporteOuOwner = ['OWNER', 'SUPORTE'].includes(usuario?.tipo);
  const isAdminOrSupervisor = ['OWNER', 'ADMIN', 'ADMIN_EMPRESA', 'ENCARREGADO'].includes(usuario?.tipo);

  // --- FUNÇÕES AUXILIARES ---

  const getConversaIdFromCurrent = (conversa) => {
    if (!conversa) return null;
    if (conversa.tipo === 'ia') return conversa.id; 
    if (conversa.tipo === 'individual') return `individual-${conversa.destinatario?.usuarioId}`;
    if (conversa.tipo === 'grupo') return `grupo-${conversa.grupo?.id}`;
    if (conversa.tipo === 'suporte') return `suporte-${conversa.solicitacao?.id}`;
    return null;
  };

  const checkPertenceConversa = (info, atual) => {
    if (!atual) return false;
    if (info.tipo === 'individual' && 
       ((info.destinatarioId === atual.destinatario?.usuarioId && info.destinatarioId !== usuario.id) || 
        (info.destinatarioId === usuario.id && atual.destinatario?.usuarioId === info.destinatarioId)
       )
    ) return true;
    if (info.tipo === 'grupo' && info.grupoId === atual.grupo?.id) return true;
    if (info.tipo === 'suporte' && info.solicitacaoId === atual.solicitacao?.id) return true;
    return false;
  };

  const adicionarBalao = (msg, info) => {
    setBaloes(p => [...p, { id: Date.now(), mensagem: msg, conversaInfo: info }]);
    setTotalNotificacoes(p => p + 1);
  };

  // --- LÓGICA DE WALLPAPER (PERSISTÊNCIA NO BD) ---

  const updateWallpaper = async (newWallpaper) => {
      try {
          await api.put(`/usuarios/${usuario.id}`, { wallpaper: newWallpaper });
          if (atualizarUsuario) {
              const usuarioAtualizado = { ...usuario, wallpaper: newWallpaper };
              atualizarUsuario(usuarioAtualizado);
          } else {
             usuario.wallpaper = newWallpaper;
          }
          toast.success('Fundo salvo com sucesso!');
      } catch (error) {
          console.error("Erro ao salvar wallpaper:", error);
          toast.error("Erro ao salvar configuração.");
      }
  };

  const getCurrentWallpaper = () => {
      return usuario?.wallpaper || DEFAULT_WALLPAPER_CSS;
  };

  // ✅ CORREÇÃO: BACKGROUND PARADO E TAMANHO CORRETO DOS DOODLES
  const getWallpaperStyle = () => {
      const wp = getCurrentWallpaper();
      const isImageOrDoodle = wp.includes('url(') || wp.startsWith('http');
      
      if (isImageOrDoodle) {
          return {
              background: wp, 
              backgroundBlendMode: 'overlay', 
              backgroundSize: wp.includes('data:image') ? '150px' : 'cover', // ✅ 150px para repetir os ícones pequenos
              backgroundRepeat: wp.includes('data:image') ? 'repeat' : 'no-repeat', // ✅ Repetir para preencher tudo
              backgroundPosition: 'center',
              backgroundAttachment: 'fixed' // ✅ FUNDO PARADO (não rola com o chat)
          };
      } else {
          return { background: wp };
      }
  };

  // --- OUTRAS FUNÇÕES ---

  const handleProfileClick = () => {
      abrirPerfil(usuario);
  };

  const togglePainel = (painel) => { 
      setPainelLateral(painelLateral === painel ? null : painel); 
      setMembroPerfil(null); 
  };
  
  const abrirPerfil = (membro) => { setMembroPerfil(membro); setPainelLateral('perfil'); };

  useEffect(() => {
    if (aberto && primeiraCarga) {
      carregarDadosIniciais();
      setPrimeiraCarga(false);
    }
  }, [aberto, primeiraCarga]);

  const carregarDadosIniciais = async () => {
    try {
      const [statusRes, membrosRes] = await Promise.all([
          api.get('/usuarios/equipe-online').catch(() => ({ data: {} })),
          api.get('/usuarios/equipe-membros').catch(() => ({ data: {} })),
          carregarConversasIA()
      ]);
      const map = {};
      if (statusRes.data?.usuarios) {
        statusRes.data.usuarios.forEach(u => {
          const id = u.usuarioId || u.id;
          if (id) map[id] = u.status;
        });
      }
      setStatusMap(map);
      if (cache.membrosCache.length === 0 && membrosRes.data?.membros) {
        cache.salvarMembros(membrosRes.data.membros || []);
      }
    } catch (e) { console.error('❌ Erro dados iniciais:', e); }
  };
  
  const carregarConversasIA = async () => {
      try {
          const res = await api.get('/ia/conversas-ia');
          if (res.data?.sucesso) {
              setConversasIA(res.data.conversas.sort((a, b) => new Date(b.criadaEm) - new Date(a.criadaEm)));
          }
      } catch (e) { console.error('Erro ao carregar histórico IA:', e); }
  };

  const goToIAHome = () => {
      selecionarConversa(null); 
      setAbaAtiva('ia');
      setPainelLateral(null);
      setChatIAAtivo(null); 
      carregarConversasIA(); 
  }

  const selecionarConversaIA = async (conversa) => {
      selecionarConversa(null); 
      setAbaAtiva('ia');
      setPainelLateral(null);
      
      if (conversa && !conversa.id.startsWith('temp-')) {
          try {
              const res = await api.get(`/ia/mensagens-ia/${conversa.id}`); 
              conversa.historico = res.data.mensagens;
              setChatIAAtivo(conversa);
          } catch (e) {
              toast.error('Erro ao carregar mensagens.');
              setChatIAAtivo(null); 
          }
      } else {
          const novaConversa = {
              id: `temp-${Date.now()}`, type: 'ia', nome: `Novo Chat ${conversasIA.length + 1}`, historico: [], criadaEm: new Date().toISOString()
          };
          setChatIAAtivo(novaConversa);
      }
  };
  
  const atualizarConversaIA = (conversaId, updates) => {
      setConversasIA(prev => prev.map(c => c.id === conversaId ? { ...c, ...updates } : c).sort((a, b) => new Date(b.criadaEm) - new Date(a.criadaEm)));
      if (chatIAAtivo?.id === conversaId) setChatIAAtivo(prev => ({ ...prev, ...updates }));
  };
  
  const adicionarMensagemIA = (conversaId, mensagem, novoIdDB = null, acao = null) => {
      if (acao?.tipo === 'abrir_suporte') {
           const { solicitacao } = acao.dados;
           toast.success(`Chamado #${solicitacao.protocolo} aberto!`);
           selecionarConversa({ tipo: 'suporte', solicitacao, protocolo: solicitacao.protocolo, id: `suporte-${solicitacao.id}` });
           setAbaAtiva('suporte');
           setChatIAAtivo(null);
           return;
      }
      setConversasIA(prev => {
          let found = false;
          const newList = prev.map(c => {
              if (c.id === conversaId) {
                  found = true;
                  const updatedId = novoIdDB && c.id.startsWith('temp-') ? novoIdDB : c.id;
                  return { ...c, id: updatedId, historico: [...(c.historico || []), mensagem], criadaEm: new Date().toISOString() };
              }
              return c;
          });
          if (!found && novoIdDB) {
             const newChat = { id: novoIdDB, tipo: 'ia', nome: mensagem.conteudo.substring(0, 30), historico: [mensagem], criadaEm: new Date().toISOString() };
             return [newChat, ...newList]; 
          }
          return newList.sort((a, b) => new Date(b.criadaEm) - new Date(a.criadaEm));
      });
      if (chatIAAtivo?.id === conversaId) {
          setChatIAAtivo(prev => {
              const updatedId = novoIdDB && prev.id.startsWith('temp-') ? novoIdDB : prev.id;
              return { ...prev, id: updatedId, historico: [...(prev.historico || []), mensagem], criadaEm: new Date().toISOString() };
          });
      }
  };
  
  const voltarParaListaIA = () => { setChatIAAtivo(null); setPainelLateral(null); carregarConversasIA(); };
  const handleAbrirPerfilIAWrapper = () => { setPainelLateral('iaPerfil'); };

  useEffect(() => {
    if (conversaAtual && conversaAtual.tipo === 'grupo') {
        if (conversaAtual.grupo && conversaAtual.grupo.membros) {
            const souMembro = conversaAtual.grupo.membros.some(m => m.usuarioId === usuario.id);
            setParticipanteAtivo(souMembro);
        } else { setParticipanteAtivo(true); }
    } else { setParticipanteAtivo(true); }
  }, [conversaAtual, usuario.id]);

  useEffect(() => {
    if (!aberto) return;
    const fetchStatus = async () => {
        try {
            const res = await api.get('/usuarios/equipe-online'); 
            const map = {};
            if(res.data?.usuarios) res.data.usuarios.forEach(u => map[u.usuarioId || u.id] = u.status);
            setStatusMap(map);
        } catch (e) { console.error("Erro status:", e); }
    };
    fetchStatus();
    const interval = setInterval(fetchStatus, 30000); 
    return () => clearInterval(interval);
  }, [aberto]);

  useEffect(() => {
    if (conversaAtual && aberto) {
       carregarMensagens();
       setChatIAAtivo(null);
       setPainelLateral(null);
       setMembroPerfil(null); 
       setBotaoScrollVisible(false);
    }
  }, [conversaAtual?.id, aberto]);

  const marcarComoLida = async (mensagemId) => { try { await api.post(`/chat-interno/mensagens/${mensagemId}/ler`); } catch (e) { console.error(e); } };

  const carregarMensagens = async () => {
    if (!conversaAtual || conversaAtual.tipo === 'ia') return; 
    
    setCarregandoMensagens(true);
    try {
       let url = '';
       if(conversaAtual.tipo === 'suporte') url = `/chat-suporte/mensagens/${conversaAtual.solicitacao?.id || conversaAtual.id.replace('suporte-', '')}`;
       else if(conversaAtual.tipo === 'individual') url = `/chat-interno/mensagens/individual/${conversaAtual.destinatario.usuarioId}`;
       else if(conversaAtual.tipo === 'grupo') url = `/chat-interno/mensagens/grupo/${conversaAtual.grupo.id}`;
       
       const res = await api.get(url);
       const msgs = res.data.mensagens || [];
       setMensagens(msgs);
       setTimeout(rolarParaFinal, 100);
    } catch(e) { console.error(e); } 
    finally { setCarregandoMensagens(false); }
  };

  useEffect(() => {
     if (!usuario?.id) return;
     const socket = io(SOCKET_URL, { auth: { token: localStorage.getItem('token') }, transports: ['websocket', 'polling'] });
     socketRef.current = socket;
     socket.on('connect', () => { socket.emit('join_user_room', { usuarioId: usuario.id }); });
     
     socket.on('chat_interno_nova_mensagem', ({ mensagem, conversaInfo }) => {
          if (mensagem.remetenteId !== usuario.id) {
                playSomReceber();
                if (aberto && conversaAtual && checkPertenceConversa(conversaInfo, conversaAtual)) {
                    setMensagens(prev => {
                        if (prev.some(m => m.id === mensagem.id)) return prev;
                        return [...prev, mensagem];
                    });
                    setTimeout(rolarParaFinal, 100);
                    marcarComoLida(mensagem.id);
                } else { 
                    adicionarBalao(mensagem, conversaInfo); 
                }
          } else if (conversaAtual && checkPertenceConversa(conversaInfo, conversaAtual)) {
               setMensagens(prev => {
                   if (prev.some(m => m.id === mensagem.id)) return prev;
                   return [...prev, mensagem];
               });
          }
     });

     return () => socket.disconnect();
  }, [usuario?.id, conversaAtual, aberto]);

  const rolarParaFinal = () => { if(fimMensagensRef.current) fimMensagensRef.current.scrollIntoView({ behavior: 'smooth' }); };
  const handleScroll = () => { 
      if (mensagensRef.current) {
          const { scrollTop, scrollHeight, clientHeight } = mensagensRef.current;
          const isBottom = scrollHeight - scrollTop - clientHeight < 100;
          setBotaoScrollVisible(!isBottom);
      }
  };

  const handleMouseDown = (e) => { if (e.button !== 0) return; setIsDragging(true); dragStartY.current = e.clientY - posicaoY; e.preventDefault(); };
  const handleMouseMove = (e) => { if (!isDragging) return; const newTop = e.clientY - dragStartY.current; const maxTop = window.innerHeight - 90; setPosicaoY(Math.max(0, Math.min(newTop, maxTop))); };
  const handleMouseUp = () => setIsDragging(false);
  useEffect(() => { if (isDragging) { window.addEventListener('mousemove', handleMouseMove); window.addEventListener('mouseup', handleMouseUp); return () => { window.removeEventListener('mousemove', handleMouseMove); window.removeEventListener('mouseup', handleMouseUp); }; } }, [isDragging]);
  
  const getWindowStyle = () => {
      const CHAT_HEIGHT = 650; 
      const MARGIN = 20; 
      const screenHeight = window.innerHeight;
      let finalTop = posicaoY;
      
      if (finalTop + CHAT_HEIGHT > screenHeight - MARGIN) finalTop = screenHeight - CHAT_HEIGHT - MARGIN;
      if (finalTop < MARGIN) finalTop = MARGIN;
      
      return { 
          top: `${finalTop}px`, 
          width: sidebarExpandida ? '580px' : '480px', 
          transition: 'width 0.3s ease, top 0.3s ease' 
      };
  };
  const windowStyle = getWindowStyle();
  
  const handleHeaderClick = () => {
    if(isIAActive && chatIAAtivo) handleAbrirPerfilIAWrapper();
    else if(conversaAtual?.tipo === 'individual' && headerInfo.objeto) abrirPerfil({ ...headerInfo.objeto, id: headerInfo.objeto.usuarioId });
    else if (conversaAtual?.tipo === 'grupo') setPainelLateral('perfil_grupo');
  };

  const getHeaderInfo = () => {
    if (abaAtiva === 'home') return { title: 'Início', sub: 'Bem-vindo ao FaleZap Chat', img: null, statusClass: 'hidden' };
    if (abaAtiva === 'ia') return chatIAAtivo ? { title: chatIAAtivo.nome, sub: 'IA Assistente', img: null } : { title: 'Assistente IA', sub: '' };
    if (!conversaAtual) return { title: abaAtiva === 'conversas' ? 'Minhas Conversas' : 'Suporte', sub: '' };
    
    const dados = conversaAtual.destinatario || conversaAtual.grupo || {};
    const nome = dados.nome || conversaAtual.protocolo;
    const img = dados.foto_perfil || dados.imagem;
    
    let sub = '';
    let statusClass = 'bg-gray-400';
    
    if (conversaAtual.tipo === 'individual') {
        const uid = conversaAtual.destinatario?.usuarioId;
        const status = statusMap[uid] || 'offline';
        sub = status === 'disponivel' ? 'Online' : 'Offline';
        statusClass = status === 'disponivel' ? 'bg-green-500' : 'bg-gray-400';
    } else if (conversaAtual.tipo === 'grupo') {
        sub = `${conversaAtual.grupo?.totalMembros || 0} membros`;
    }
    return { title: nome, sub, img, statusClass, objeto: dados };
  };

  const headerInfo = getHeaderInfo();
  const isIAActive = abaAtiva === 'ia'; 
  const isHomeActive = abaAtiva === 'home';

  const handleMensagemEnviada = (m) => {
      setMensagens(p => {
          if (p.some(msg => msg.id === m.id)) return p;
          return [...p, m];
      });
      setTimeout(rolarParaFinal, 100);
  };

  return (
    <>
      {!aberto && (
        <div className="chat-dock-tab" style={{ top: `${posicaoY}px` }} onMouseDown={handleMouseDown} onClick={() => !isDragging && setAberto(true)}>
          <div className="chat-dock-indicator"></div>
          <div className="chat-dock-content"><MessageSquare className="w-5 h-5 text-white" /><span className="chat-dock-text">Chat Interno</span></div>
          {totalNotificacoes > 0 && <div className="dock-badge">{totalNotificacoes > 99 ? '99+' : totalNotificacoes}</div>}
        </div>
      )}

      {aberto && (
        <div className="chat-window" style={{ left: '30px', top: windowStyle.top, width: windowStyle.width }}>
           
           <div className={`chat-sidebar ${sidebarExpandida ? 'sidebar-expanded' : ''}`}>
              <div className="w-full flex justify-center mb-2 mt-2">
                  <button onClick={() => setSidebarExpandida(!sidebarExpandida)} className="p-2 text-gray-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors"><Menu size={20}/></button>
              </div>
              
              <button onClick={() => { setAbaAtiva('home'); selecionarConversa(null); setChatIAAtivo(null); setPainelLateral(null); }} className={`chat-sidebar-btn mb-1 ${abaAtiva === 'home' ? 'active' : ''}`}>
                 <Home size={20}/> {sidebarExpandida && <span>Início</span>}
              </button>
              
              <div className="chat-divider"/>

              <button onClick={() => { setAbaAtiva('conversas'); selecionarConversa(null); setChatIAAtivo(null); setPainelLateral(null); }} className={`chat-sidebar-btn ${abaAtiva === 'conversas' && !conversaAtual && !isIAActive && !isHomeActive ? 'active' : ''}`}>
                  <MessageCircle size={20}/> {sidebarExpandida && <span>Conversas</span>}
              </button>
              
              <button onClick={goToIAHome} className={`chat-sidebar-btn ${isIAActive ? 'active' : ''}`}>
                 <Sparkles size={20} className='text-purple-600'/> {sidebarExpandida && <span>Chat IA</span>}
              </button>

              <button onClick={() => { setAbaAtiva('suporte'); selecionarConversa(null); setChatIAAtivo(null); setPainelLateral(null); }} className={`chat-sidebar-btn ${abaAtiva === 'suporte' && !conversaAtual && !isIAActive && !isHomeActive ? 'active' : ''}`}>
                  <LifeBuoy size={20}/> {sidebarExpandida && <span>Suporte</span>}
              </button>
              
              <div className="flex-1"/>
              
              <button onClick={() => togglePainel('ajuda')} className={`chat-sidebar-btn ${painelLateral === 'ajuda' ? 'active' : ''}`}>
                  <HelpCircle size={20}/> {sidebarExpandida && <span>Ajuda</span>}
              </button>
              
              {isAdminOrSupervisor && (
                  <button onClick={() => togglePainel('alerta')} className={`chat-sidebar-btn ${painelLateral === 'alerta' ? 'active' : ''}`}>
                      <Megaphone size={20}/> {sidebarExpandida && <span>Alerta</span>}
                  </button>
              )}

              <div className="chat-divider"/>
              
              <button onClick={() => togglePainel('configuracoes')} className={`chat-sidebar-btn mb-1 ${painelLateral === 'configuracoes' ? 'active' : ''}`}>
                  <Settings size={20}/> {sidebarExpandida && <span>Ajustes</span>}
              </button>

              <button onClick={handleProfileClick} className="chat-sidebar-btn mb-2 profile-btn">
                 <div className="w-6 h-6 rounded-full overflow-hidden border border-gray-300 flex items-center justify-center bg-gray-100">{usuario.foto_perfil ? <img src={`${API_URL_BASE}/uploads/avatars/${usuario.foto_perfil}`} className="w-full h-full object-cover"/> : <UserCircle size={20} className="text-gray-500"/>}</div>
                 {sidebarExpandida && <span className="truncate text-xs font-bold">{usuario.nome?.split(' ')[0]}</span>}
              </button>
           </div>
           
           <div className="chat-main-area relative">
              <div className="chat-header-compact">
                 <div className="chat-header-title-row">
                    {(conversaAtual || chatIAAtivo) && <button onClick={isIAActive ? voltarParaListaIA : () => { selecionarConversa(null); if(abaAtiva === 'home') setAbaAtiva('conversas'); }} className="mr-2 hover:bg-gray-100 p-1.5 rounded-full text-gray-500 transition-colors"><ArrowLeft size={18}/></button>}
                    
                    {isIAActive ? (
                        <div className="relative cursor-pointer" onClick={chatIAAtivo ? handleAbrirPerfilIAWrapper : undefined}>
                            <div className={`w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-sm mr-3 flex-shrink-0`}>
                                <Sparkles size={20} className='text-yellow-300'/>
                            </div>
                        </div>
                    ) : isHomeActive ? (
                        <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-sm mr-3 flex-shrink-0"><Home size={20}/></div>
                    ) : (
                       <div className="relative cursor-pointer" onClick={handleHeaderClick}>
                           {conversaAtual && headerInfo.img ? <img src={conversaAtual.tipo === 'grupo' ? `${API_URL_BASE}/uploads/grupos/${headerInfo.img}` : `${API_URL_BASE}/uploads/avatars/${headerInfo.img}`} className="w-10 h-10 rounded-full object-cover mr-3 border border-gray-200"/> : conversaAtual ? <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-sm mr-3">{headerInfo.title?.[0]}</div> : null}
                           {conversaAtual && <div className={`absolute bottom-0 right-3 w-3 h-3 rounded-full border-2 border-white ${headerInfo.statusClass}`}></div>}
                       </div>
                    )}
                    
                    <div className="cursor-pointer" onClick={handleHeaderClick}><h3>{headerInfo.title}</h3>{<p className="text-xs text-gray-500">{headerInfo.sub}</p>}</div>
                 </div>
                 <div className="flex gap-2 items-center">
                    {(!conversaAtual && !isIAActive && !isHomeActive && abaAtiva === 'conversas') && (
                        <button onClick={() => togglePainel('novo_chat')} className="p-2 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors" title="Nova Conversa ou Grupo">
                            <Plus size={20}/>
                        </button>
                    )}
                    <button onClick={() => { setAberto(false); setPainelLateral(null); setChatIAAtivo(null); }} className="p-2 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"><Minus size={20}/></button>
                 </div>
              </div>

              {/* ✅ APLICAÇÃO DO PAPEL DE PAREDE E ESTRUTURA GERAL */}
              <div 
                  className={`chat-content-scroll custom-scrollbar ${conversaAtual || isIAActive ? 'messages-bg' : ''}`} 
                  style={{ 
                      padding: '0', 
                      display: 'flex', 
                      flexDirection: 'column' 
                  }}
              >
                 {isHomeActive ? (
                     <HomeChat onNavegar={(aba) => { setAbaAtiva(aba); if(aba === 'ia') goToIAHome(); }} />
                 ) : isIAActive ? (
                      <ChatIAView 
                          conversaAtiva={chatIAAtivo}
                          listaConversas={conversasIA}
                          onSelecionarConversa={selecionarConversaIA}
                          onUpdateConversa={atualizarConversaIA}
                          onAddMensagem={adicionarMensagemIA}
                          setIsTypingIA={setIsTypingIA}
                          isTypingIA={isTypingIA}
                          carregarConversasIA={carregarConversasIA} 
                          onVoltarParaLista={voltarParaListaIA}
                          wallpaperStyle={getWallpaperStyle()} 
                      />
                 ) : !conversaAtual ? (
                    <div className="p-4 h-full bg-white/80 backdrop-blur-sm"> 
                        <ListaConversas 
                           abaAtivaExterna={abaAtiva}
                           onSelecionarConversa={selecionarConversa}
                           statusMap={statusMap}
                           socket={socketRef.current}
                        />
                    </div>
                 ) : (
                    <div className="flex flex-col h-full w-full relative">
                       {/* ✅ AQUI APLICAMOS O WALLPAPER PARA CHATS INDIVIDUAIS/GRUPO/SUPORTE */}
                       <div 
                           className="flex-1 space-y-1 p-4 w-full overflow-y-auto" 
                           ref={mensagensRef} 
                           onScroll={handleScroll}
                           style={getWallpaperStyle()} 
                       >
                          {carregandoMensagens && <div className="flex justify-center p-4"><Loader2 className="animate-spin text-indigo-500"/></div>}
                          {!carregandoMensagens && mensagens.length === 0 && <div className="text-center py-20 flex flex-col items-center bg-white/40 p-4 rounded-xl backdrop-blur-sm mx-10 mt-10"><MessageSquare className="w-12 h-12 text-gray-500 mb-2"/><span className="text-sm text-gray-600 font-medium">Nenhuma mensagem ainda</span></div>}
                          
                          {mensagens.map((msg, i) => (
                             <div key={msg.id || i}>
                               <MensagemBalao mensagem={msg} isMeu={msg.remetenteId === usuario.id} proximaDoMesmo={mensagens[i + 1]?.remetenteId === msg.remetenteId} mostrarRemetente={conversaAtual.tipo !== 'individual'}/>
                             </div>
                          ))}
                          <div ref={fimMensagensRef} />
                       </div>

                       {botaoScrollVisible && <button onClick={rolarParaFinal} className="absolute bottom-20 right-4 bg-white p-2 rounded-full shadow-lg border border-gray-100 text-gray-500 hover:text-indigo-600 animate-bounce z-20"><ArrowDown size={20} /></button>}
                       
                       <div className="chat-editor-area sticky bottom-0 w-full z-10">
                          {isSuporteOuOwner && conversaAtual.tipo === 'suporte' && conversaAtual.solicitacao?.status !== 'ENCERRADO' && <BotaoEncerrarAtendimento conversaAtual={conversaAtual} usuarioAtual={usuario} />}
                          {conversaAtual.tipo === 'suporte' && conversaAtual.solicitacao?.status === 'ENCERRADO' ? <div className="text-center text-xs text-gray-500 bg-gray-100 py-2 rounded-lg">Este atendimento foi encerrado.</div> : conversaAtual.tipo === 'grupo' && !participanteAtivo ? <div className="bg-gray-100 p-4 text-center text-sm text-gray-500 border-t border-gray-200 w-full">Você não é mais participante deste grupo.</div> : <EditorMensagem conversaAtual={conversaAtual} rolarParaFinal={rolarParaFinal} onMensagemEnviada={handleMensagemEnviada} />}
                       </div>
                    </div>
                 )}
              </div>

              {painelLateral && (
                  <div className="chat-overlay-panel animate-fadeIn">
                     {painelLateral === 'ajuda' && <SolicitarAjuda onClose={() => setPainelLateral(null)} embedded={true} />}
                     {painelLateral === 'alerta' && <EnviarAlerta onClose={() => setPainelLateral(null)} embedded={true} />}
                     
                     {painelLateral === 'grupos' || painelLateral === 'editar_grupo' || painelLateral === 'criar_grupo' ? (
                        <GerenciarGrupos onClose={() => setPainelLateral(null)} embedded={true} grupoEditar={painelLateral === 'editar_grupo' ? grupoParaEditar : null} onSelecionarGrupo={g => { selecionarConversa({ tipo:'grupo', grupo:g, id:`grupo-${g.id}` }); setPainelLateral(null); }} onVoltar={() => { if(painelLateral==='criar_grupo') setPainelLateral('novo_chat'); else if(painelLateral==='editar_grupo') setPainelLateral('perfil_grupo'); else setPainelLateral(null); }} />
                     ) : null}
                     
                     {painelLateral === 'novo_chat' && (
                         <div className="embedded-panel bg-white h-full flex flex-col">
                             <div className="embedded-panel-header bg-white border-b border-gray-100 px-4 flex justify-between items-center shrink-0 z-10 h-[60px]">
                                <h3 className="font-bold text-gray-800 flex items-center gap-2 text-sm">Nova Conversa</h3>
                                <button onClick={() => setPainelLateral(null)} className="p-1.5 hover:bg-gray-100 rounded-full text-gray-500 transition-colors"><X size={20}/></button>
                             </div>
                             <div className="p-4 bg-gray-50">
                                 <button onClick={() => setPainelLateral('criar_grupo')} className="w-full py-3 bg-white border border-gray-200 rounded-xl flex items-center gap-3 px-4 hover:border-indigo-300 hover:shadow-sm transition-all group">
                                     <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors"><Users size={20}/></div>
                                     <div className="text-left"><span className="block font-bold text-gray-800 text-sm">Criar Novo Grupo</span><span className="text-xs text-gray-500">Reúna a equipe em um só lugar</span></div>
                                 </button>
                             </div>
                             <div className="flex-1 overflow-hidden relative">
                                 <ListaMembros onClose={() => setPainelLateral(null)} embedded={true} onSelecionarMembro={(m) => { selecionarConversa({ tipo:'individual', destinatario:m, id:`individual-${m.usuarioId}`}); setPainelLateral(null); }} />
                             </div>
                         </div>
                     )}

                     {painelLateral === 'iaPerfil' && <VisualizarPerfilIA onClose={() => setPainelLateral(null)} />}
                     {painelLateral === 'perfil' && membroPerfil && <VisualizarPerfil membro={membroPerfil} onClose={() => setPainelLateral(null)} isMe={membroPerfil.id === usuario.id} onMessage={(m) => { selecionarConversa({ tipo:'individual', destinatario:m, id:`individual-${m.usuarioId}`}); setPainelLateral(null); }} />}
                     {painelLateral === 'perfil_grupo' && conversaAtual?.tipo === 'grupo' && <VisualizarPerfilGrupo grupo={conversaAtual.grupo} onClose={() => setPainelLateral(null)} isParticipante={participanteAtivo} onEditar={() => { setGrupoParaEditar(conversaAtual.grupo); setPainelLateral('editar_grupo'); }} onSairOuExcluir={(acao) => { if (acao === 'saiu') setParticipanteAtivo(false); if (acao === 'excluir_local') { selecionarConversa(null); setPainelLateral(null); } }} />}
                     
                     {painelLateral === 'configuracoes' && (
                        <PainelConfiguracoes 
                            onClose={() => setPainelLateral(null)} 
                            conversaAtual={chatIAAtivo || conversaAtual} 
                            currentWallpaper={getCurrentWallpaper()} 
                            onUpdateWallpaper={updateWallpaper} 
                        />
                     )}
                  </div>
              )}
           </div>
        </div>
      )}

      {baloes.map((b, i) => (
         <BalaoNotificacao key={b.id} mensagem={b.mensagem} onClose={() => setBaloes(p => p.filter(x => x.id !== b.id))} onClick={() => { setAberto(true); selecionarConversa(b.conversaInfo); setBaloes(p => p.filter(x => x.id !== b.id)); }} style={{ bottom: `${posicaoY + 100 + (i*90)}px`, left: '300px' }} />
      ))}
      {solicitacaoParaAvaliar && <NotificacaoSuporte solicitacao={solicitacaoParaAvaliar} onClose={() => setSolicitacaoParaAvaliar(null)} />}
      {alertaParaResponder && <NotificacaoAlerta alerta={alertaParaResponder} onClose={() => setAlertaParaResponder(null)} onResponder={() => setAlertaParaResponder(null)} />}
    </>
  );
}