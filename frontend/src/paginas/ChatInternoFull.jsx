// frontend/src/paginas/ChatInternoFull.jsx - PARTE 1: Imports e Estados

import { useState, useEffect, useRef } from 'react';
import { 
  X, Search, Settings, HelpCircle, Megaphone, Plus,
  Loader2, MessageCircle, Users, LifeBuoy, Send,
  ArrowLeft, Menu, Maximize2, Minimize2, Bell,
  Star, UserPlus, Phone, Video, Info, MoreVertical,
  Image as ImageIcon, Paperclip, Smile, Check
} from 'lucide-react';
import { useAuth } from '../contextos/AuthContext';
import api from '../servicos/api';
import toast from 'react-hot-toast';
import io from 'socket.io-client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import ReactMarkdown from 'react-markdown';

// Componentes do Chat
import EditorMensagem from '../componentes/ChatInterno/EditorMensagem';
import MensagemBalao from '../componentes/ChatInterno/MensagemBalao';
import GerenciarGrupos from '../componentes/ChatInterno/GerenciarGrupos';
import SolicitarAjuda from '../componentes/ChatInterno/SolicitarAjuda';
import EnviarAlerta from '../componentes/ChatInterno/EnviarAlerta';
import NotificacaoSuporte from '../componentes/ChatInterno/NotificacaoSuporte';
import BotaoEncerrarAtendimento from '../componentes/ChatInterno/BotaoEncerrarAtendimento';

const API_URL_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const SOCKET_URL = API_URL_BASE.replace('/api', '');

const HIERARQUIA = {
  COLABORADOR: 1,
  ENCARREGADO: 2, 
  ADMIN: 3,
  ADMIN_EMPRESA: 3,
  OWNER: 4,
  SUPORTE: 5 
};

export default function ChatInternoFull() {
  const { usuario } = useAuth();

  // Estados principais
  const [conversaAtual, setConversaAtual] = useState(null);
  const [mensagens, setMensagens] = useState([]);
  const [membros, setMembros] = useState([]);
  const [grupos, setGrupos] = useState([]);
  const [solicitacoes, setSolicitacoes] = useState([]);
  const [favoritos, setFavoritos] = useState([]);

  // Estados de UI
  const [busca, setBusca] = useState('');
  const [abaAtiva, setAbaAtiva] = useState('conversas'); // conversas, grupos, suporte
  const [carregando, setCarregando] = useState(true);
  const [carregandoMensagens, setCarregandoMensagens] = useState(false);
  const [mostrarSidebar, setMostrarSidebar] = useState(true);
  const [mostrarDetalhes, setMostrarDetalhes] = useState(false);
  const [telaCheia, setTelaCheia] = useState(false);

  // Modais
  const [mostrarGerenciarGrupos, setMostrarGerenciarGrupos] = useState(false);
  const [mostrarSolicitarAjuda, setMostrarSolicitarAjuda] = useState(false);
  const [mostrarEnviarAlerta, setMostrarEnviarAlerta] = useState(false);
  const [solicitacaoParaAvaliar, setSolicitacaoParaAvaliar] = useState(null);

  // Notificações
  const [notificacoesSuporte, setNotificacoesSuporte] = useState(0);
  const [notificacoesGrupos, setNotificacoesGrupos] = useState({});
  const [totalNotificacoes, setTotalNotificacoes] = useState(0);

  // Refs
  const mensagensRef = useRef(null);
  const socketRef = useRef(null);

  // Permissões
  const isSuporteOuOwner = ['OWNER', 'SUPORTE'].includes(usuario?.tipo);
  const isAdminOrSupervisor = ['OWNER', 'ADMIN', 'ADMIN_EMPRESA', 'ENCARREGADO'].includes(usuario?.tipo);

  // Função auxiliar para extrair nome de arquivo
  const extrairNomeArquivo = (caminhoCompleto) => {
    if (!caminhoCompleto) return null;
    let nomeArquivo = caminhoCompleto;
    nomeArquivo = nomeArquivo.replace(/^(https?:\/\/[^\/]+)?\/uploads\/grupos\//, '');
    return nomeArquivo.split('/').pop();
  };

// PARTE 2: Socket.IO e Funções de Carregamento

  // ===== SOCKET.IO =====
  useEffect(() => {
    if (!usuario?.id) return;

    const socket = io(SOCKET_URL, {
      auth: { token: localStorage.getItem('token') },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: Infinity
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('[CHAT FULL] ✅ Socket conectado:', socket.id);
      socket.emit('join_user_room', { usuarioId: usuario.id });
      
      if (conversaAtual) {
        carregarMensagens();
      }
    });

    socket.on('disconnect', (reason) => {
      console.warn('[CHAT FULL] ⚠️ Socket desconectado:', reason);
      if (reason === 'io server disconnect') {
        socket.connect();
      }
    });

    // Mensagens do chat interno
    socket.on('chat_interno_nova_mensagem', ({ mensagem, conversaInfo }) => {
      console.log('[CHAT FULL] 📨 Nova mensagem:', mensagem);
      
      if (conversaAtual) {
        const ehDaConversaAtual = 
          (conversaInfo.tipo === 'individual' && conversaInfo.destinatarioId === conversaAtual.destinatario?.usuarioId) ||
          (conversaInfo.tipo === 'grupo' && conversaInfo.grupoId === conversaAtual.grupo?.id) ||
          (conversaInfo.tipo === 'geral' && conversaAtual.tipo === 'geral');

        if (ehDaConversaAtual) {
          setMensagens(prev => [...prev, mensagem]);
          setTimeout(() => rolarParaFinal(), 100);
          return;
        }
      }
      
      if (mensagem.remetenteId !== usuario.id) {
        setTotalNotificacoes(prev => prev + 1);
      }
    });

    // Mensagens de suporte
    socket.on('nova_mensagem_suporte', ({ mensagem, solicitacaoId }) => {
      console.log('[CHAT FULL] 🎫 Nova mensagem de suporte:', mensagem);
      
      if (conversaAtual?.tipo === 'suporte') {
        const conversaSolicitacaoId = conversaAtual.solicitacao?.id || conversaAtual.id?.replace('suporte-', '');
        
        if (conversaSolicitacaoId === solicitacaoId) {
          setMensagens(prev => [...prev, mensagem]);
          setTimeout(() => rolarParaFinal(), 100);
          return;
        }
      }
      
      if (mensagem.remetenteId !== usuario.id) {
        setTotalNotificacoes(prev => prev + 1);
      }
    });

    // Atendimento iniciado
    socket.on('atendimento_iniciado', ({ solicitacao, atendente }) => {
      console.log('[CHAT FULL] ✅ Atendimento iniciado por:', atendente.nome);
      
      toast.success(`${atendente.nome} aceitou seu chamado!`, {
        duration: 5000,
        icon: '✅'
      });
      
      if (conversaAtual?.tipo === 'suporte') {
        const conversaSolicitacaoId = conversaAtual.solicitacao?.id || conversaAtual.id?.replace('suporte-', '');
        if (conversaSolicitacaoId === solicitacao.id) {
          const mensagemSistema = {
            id: `sistema-${Date.now()}`,
            tipo: 'sistema',
            conteudo: `🟢 **${atendente.nome}** entrou na conversa e iniciou o atendimento.`,
            criadaEm: new Date().toISOString(),
            remetente: { nome: 'Sistema' }
          };
          setMensagens(prev => [...prev, mensagemSistema]);
          carregarMensagens();
        }
      }
    });

    // Solicitação encerrada
    socket.on('solicitacao_encerrada', ({ solicitacaoId }) => {
      console.log('[CHAT FULL] 🔒 Solicitação encerrada:', solicitacaoId);
      
      if (conversaAtual?.tipo === 'suporte') {
        const conversaSolicitacaoId = conversaAtual.solicitacao?.id || conversaAtual.id?.replace('suporte-', '');
        if (conversaSolicitacaoId === solicitacaoId) {
          const mensagemSistema = {
            id: `sistema-${Date.now()}`,
            tipo: 'sistema',
            conteudo: '🔒 **A conversa foi finalizada.** Não é mais possível enviar mensagens.\n\nObrigado por entrar em contato!',
            criadaEm: new Date().toISOString(),
            remetente: { nome: 'Sistema' }
          };
          setMensagens(prev => [...prev, mensagemSistema]);
          
          carregarMensagens().then(() => {
            setConversaAtual({
              ...conversaAtual,
              solicitacao: {
                ...conversaAtual.solicitacao,
                status: 'ENCERRADO'
              }
            });
            
            setTimeout(() => {
              setSolicitacaoParaAvaliar({
                ...conversaAtual.solicitacao,
                status: 'ENCERRADO'
              });
            }, 2000);
          });
        }
      }
    });

    // Solicitar avaliação
    socket.on('solicitar_avaliacao_atendimento', ({ solicitacaoId, protocolo }) => {
      console.log('[CHAT FULL] ⭐ Solicitação de avaliação:', protocolo);
      
      if (conversaAtual?.tipo === 'suporte') {
        const conversaSolicitacaoId = conversaAtual.solicitacao?.id || conversaAtual.id?.replace('suporte-', '');
        if (conversaSolicitacaoId === solicitacaoId) {
          setSolicitacaoParaAvaliar({
            ...conversaAtual.solicitacao,
            status: 'ENCERRADO'
          });
        }
      }
    });

    // Nova solicitação de ajuda
    socket.on('nova_solicitacao_ajuda', (solicitacao) => {
      console.log('[CHAT FULL] 🆕 Nova solicitação de ajuda:', solicitacao.protocolo);
      
      if (isSuporteOuOwner) {
        toast.success(`Nova solicitação: ${solicitacao.protocolo}`, {
          duration: 5000,
          icon: '🎫'
        });
        setTotalNotificacoes(prev => prev + 1);
      }
    });

    return () => {
      console.log('[CHAT FULL] 🧹 Desconectando socket');
      socket.disconnect();
      socketRef.current = null;
    };
  }, [usuario?.id, conversaAtual?.id, conversaAtual?.tipo, isSuporteOuOwner]);

  // ===== CARREGAMENTO DE DADOS =====
  useEffect(() => {
    carregarDados();
    
    if (abaAtiva !== 'suporte') {
      contarNotificacoesSuporte();
      const interval = setInterval(contarNotificacoesSuporte, 10000);
      return () => clearInterval(interval);
    }
  }, [abaAtiva]);

  useEffect(() => {
    if (conversaAtual) {
      carregarMensagens();
    }
  }, [conversaAtual?.id]);

  const carregarDados = async () => {
    setCarregando(true);
    try {
      if (abaAtiva === 'conversas') {
        const [membrosRes, favoritosRes] = await Promise.all([
          api.get('/status/equipe-online'),
          api.get('/chat-interno/favoritos').catch(() => ({ data: { favoritos: [] } }))
        ]);

        const todosUsuarios = Array.isArray(membrosRes.data?.usuarios) ? membrosRes.data.usuarios : [];
        
        const membrosDaConta = todosUsuarios.filter(u => 
          u.contaId === usuario?.contaId && 
          u.usuarioId !== usuario?.id &&
          u.statusSistema === 'ATIVO'
        );
        
        const membrosOrdenados = membrosDaConta.sort((a, b) => {
          const aEhFav = favoritosRes.data.favoritos.some(f => f.usuarioId === a.usuarioId);
          const bEhFav = favoritosRes.data.favoritos.some(f => f.usuarioId === b.usuarioId);
          const hierarquiaA = HIERARQUIA[a.tipo] || HIERARQUIA.COLABORADOR;
          const hierarquiaB = HIERARQUIA[b.tipo] || HIERARQUIA.COLABORADOR;
          
          if (a.status === 'disponivel' && b.status !== 'disponivel') return -1;
          if (a.status !== 'disponivel' && b.status === 'disponivel') return 1;

          if (aEhFav && !bEhFav) return -1;
          if (!aEhFav && bEhFav) return 1;

          if (hierarquiaA > hierarquiaB) return -1;
          if (hierarquiaA < hierarquiaB) return 1;

          return a.nome.localeCompare(b.nome);
        });
        
        setMembros(membrosOrdenados);
        setFavoritos(favoritosRes.data.favoritos);
        
      } else if (abaAtiva === 'grupos') {
        const gruposRes = await api.get('/chat-interno/grupos').catch(() => ({ data: { grupos: [] } }));
        
        const gruposLimpados = (gruposRes.data.grupos || []).map(grupo => ({ 
          ...grupo, 
          imagem: extrairNomeArquivo(grupo.imagem) 
        }));
        setGrupos(gruposLimpados);
        carregarNotificacoesGrupos(gruposLimpados);
        
      } else if (abaAtiva === 'suporte') {
        try {
          if (isSuporteOuOwner) {
            const response = await api.get('/suporte/solicitacoes?status=TODOS');
            setSolicitacoes(response.data.solicitacoes || []);
          } else {
            const response = await api.get('/suporte/minhas-solicitacoes');
            setSolicitacoes(response.data.solicitacoes || []);
          }
        } catch (error) {
          console.error('Erro ao carregar solicitações:', error);
          setSolicitacoes([]);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar dados do chat:', error);
      if (error.response?.status !== 404) {
        toast.error('Falha ao carregar a lista de conversas.');
      }
    } finally {
      setCarregando(false);
    }
  };

// PARTE 3: Funções Auxiliares

  const carregarMensagens = async () => {
    if (!conversaAtual) return;

    setCarregandoMensagens(true);
    try {
      let endpoint = '';
      
      console.log('[CHAT FULL] Carregando mensagens para:', conversaAtual);
      
      if (conversaAtual.tipo === 'suporte') {
        const solicitacaoId = conversaAtual.solicitacao?.id || conversaAtual.id?.replace('suporte-', '');
        if (!solicitacaoId) {
          throw new Error('ID da solicitação não encontrado');
        }
        endpoint = `/chat-suporte/mensagens/${solicitacaoId}`;
      } else if (conversaAtual.tipo === 'individual') {
        endpoint = `/chat-interno/mensagens/individual/${conversaAtual.destinatario.usuarioId}`;
      } else if (conversaAtual.tipo === 'grupo') {
        endpoint = `/chat-interno/mensagens/grupo/${conversaAtual.grupo.id}`;
      } else if (conversaAtual.tipo === 'geral') {
        endpoint = `/chat-interno/mensagens/geral`;
      }

      console.log('[CHAT FULL] Endpoint:', endpoint);

      const response = await api.get(endpoint);
      setMensagens(response.data.mensagens || []);
      setTimeout(() => rolarParaFinal(), 100);
    } catch (error) {
      console.error('[CHAT FULL] ❌ Erro ao carregar mensagens:', error);
      toast.error('Erro ao carregar mensagens');
      setMensagens([]);
    } finally {
      setCarregandoMensagens(false);
    }
  };

  const contarNotificacoesSuporte = async () => {
    try {
      const response = await api.get('/suporte/notificacoes/contar');
      setNotificacoesSuporte(response.data.count || 0);
    } catch (error) {
      console.error('Erro ao contar notificações:', error);
    }
  };

  const carregarNotificacoesGrupos = async (gruposLista) => {
    try {
      const contadores = {};
      
      for (const grupo of gruposLista) {
        const response = await api.get(`/chat-interno/mensagens/grupo/${grupo.id}/nao-lidas`).catch(() => ({ data: { count: 0 } }));
        contadores[grupo.id] = response.data.count || 0;
      }
      
      setNotificacoesGrupos(contadores);
    } catch (error) {
      console.error('Erro ao carregar notificações de grupos:', error);
    }
  };

  const rolarParaFinal = () => {
    if (mensagensRef.current) {
      mensagensRef.current.scrollTop = mensagensRef.current.scrollHeight;
    }
  };

  const selecionarConversa = (conversa) => {
    setConversaAtual(conversa);
    setMostrarDetalhes(false);
  };

  const iniciarConversaIndividual = (membro) => {
    selecionarConversa({
      tipo: 'individual',
      destinatario: membro,
      id: `individual-${membro.usuarioId}`
    });
  };
  
  const selecionarSuporte = (solicitacao) => {
    console.log('[CHAT FULL] Selecionando SUPORTE:', solicitacao.protocolo);
    selecionarConversa({
      tipo: 'suporte',
      solicitacao: solicitacao,
      protocolo: solicitacao.protocolo,
      id: `suporte-${solicitacao.id}`
    });
  };

  const selecionarGrupo = (grupo) => {
    console.log('[CHAT FULL] Selecionando GRUPO:', grupo.nome);
    selecionarConversa({
      tipo: 'grupo',
      grupo: grupo,
      id: `grupo-${grupo.id}`
    });
  };

  const getInfoConversa = () => {
    if (!conversaAtual) return { titulo: 'Conversa Interna', subtitulo: usuario?.nome || '' };

    if (conversaAtual.tipo === 'suporte') {
      return {
        titulo: `🎫 ${conversaAtual.protocolo || conversaAtual.solicitacao?.protocolo || 'Suporte'}`,
        subtitulo: conversaAtual.solicitacao?.status === 'ENCERRADO' ? 'Encerrado' : 'Ativo'
      };
    }

    if (conversaAtual.tipo === 'grupo') {
      return {
        titulo: conversaAtual.grupo?.nome || 'Grupo',
        subtitulo: `${conversaAtual.grupo?.membros?.length || conversaAtual.grupo?.totalMembros || 0} membros`
      };
    }

    if (conversaAtual.tipo === 'individual') {
      return {
        titulo: conversaAtual.destinatario?.nome || 'Usuário',
        subtitulo: conversaAtual.destinatario?.status || 'Offline'
      };
    }

    if (conversaAtual.tipo === 'geral') {
      return {
        titulo: 'Chat Geral',
        subtitulo: 'Toda a equipe'
      };
    }

    return { titulo: 'Chat', subtitulo: '' };
  };

  const itensFiltrados = () => {
    const termo = busca.toLowerCase();
    
    if (abaAtiva === 'conversas') {
      return membros.filter(membro => {
        const nomeMembro = membro.nome?.toLowerCase();
        const emailMembro = membro.email?.toLowerCase();
        return nomeMembro?.includes(termo) || emailMembro?.includes(termo);
      });
    } else if (abaAtiva === 'grupos') {
      return grupos.filter(grupo => {
        const nomeGrupo = grupo.nome?.toLowerCase();
        const descricaoGrupo = grupo.descricao?.toLowerCase();
        return nomeGrupo?.includes(termo) || descricaoGrupo?.includes(termo);
      });
    } else if (abaAtiva === 'suporte') {
      return solicitacoes.filter(solicitacao => {
        const protocolo = solicitacao.protocolo?.toLowerCase();
        const descricao = solicitacao.descricao?.toLowerCase();
        return protocolo?.includes(termo) || descricao?.includes(termo);
      });
    }
    return [];
  };

  const handleBotaoAcao = () => {
    if (abaAtiva === 'conversas') {
      // Abrir modal de nova conversa (implementar se necessário)
    } else if (abaAtiva === 'grupos') {
      setMostrarGerenciarGrupos(true);
    } else if (abaAtiva === 'suporte') {
      setMostrarSolicitarAjuda(true);
    }
  };

  const getTituloBotao = () => {
    if (abaAtiva === 'conversas') return 'Nova Conversa';
    if (abaAtiva === 'grupos') return 'Gerenciar Grupos';
    if (abaAtiva === 'suporte') return 'Solicitar Ajuda';
    return 'Ação';
  };

  const getIconeBotao = () => {
    if (abaAtiva === 'conversas') return <Plus size={20} />;
    if (abaAtiva === 'grupos') return <Users size={20} />;
    if (abaAtiva === 'suporte') return <LifeBuoy size={20} />;
    return <Plus size={20} />;
  };

  const infoConversa = getInfoConversa();
  const itensLista = itensFiltrados();

// PARTE 4: Renderização da Sidebar

  const renderItemLista = (item) => {
    if (abaAtiva === 'suporte') {
      const statusInfo = {
        PENDENTE: { cor: 'bg-yellow-500', texto: 'Aguardando' },
        EM_ATENDIMENTO: { cor: 'bg-blue-500', texto: 'Em Atendimento' },
        ENCERRADO: { cor: 'bg-green-500', texto: 'Encerrado' }
      };
      
      const info = statusInfo[item.status] || statusInfo.PENDENTE;
      
      return (
        <button 
          key={`s-${item.id}`}
          className="w-full flex items-center gap-2.5 p-2 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all rounded-lg border-b border-gray-100 dark:border-gray-800 last:border-0"
          onClick={() => selecionarSuporte(item)}
        >
          <div className="relative flex-shrink-0">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-sm shadow-md">
              🎫
            </div>
            <div className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 ${info.cor} rounded-full border-2 border-white dark:border-gray-900`} />
          </div>
          
          <div className="flex-1 min-w-0 text-left">
            <h4 className="font-bold text-gray-900 dark:text-white truncate text-xs leading-none mb-1">
              {item.protocolo}
            </h4>
            <p className="text-[10px] text-gray-600 dark:text-gray-400 truncate mb-0.5">
              {item.descricao}
            </p>
            <span className={`text-[9px] font-semibold ${
              item.status === 'PENDENTE' ? 'text-yellow-600 dark:text-yellow-400' :
              item.status === 'EM_ATENDIMENTO' ? 'text-blue-600 dark:text-blue-400' :
              'text-green-600 dark:text-green-400'
            }`}>
              {info.texto}
            </span>
          </div>
          
          {item.naoLidas > 0 && (
            <div className="flex-shrink-0">
              <div className="min-w-[18px] h-5 px-1.5 bg-red-500 text-white rounded-full flex items-center justify-center text-[9px] font-bold">
                {item.naoLidas > 9 ? '9+' : item.naoLidas}
              </div>
            </div>
          )}
        </button>
      );
    }
    
    if (abaAtiva === 'conversas') {
      const ehFavorito = favoritos.some(f => f.usuarioId === item.usuarioId);
      const isOnline = item.status && item.status !== 'offline';
      
      return (
        <button 
          key={`m-${item.usuarioId}`}
          className="w-full flex items-center gap-2.5 p-2 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all rounded-lg border-b border-gray-100 dark:border-gray-800 last:border-0"
          onClick={() => iniciarConversaIndividual(item)}
        >
          <div className="relative flex-shrink-0">
            {item.foto_perfil ? (
              <img 
                src={item.foto_perfil} 
                alt={item.nome} 
                className="w-9 h-9 rounded-full object-cover ring-2 ring-gray-100 dark:ring-gray-700"
                onError={(e) => { e.target.onerror = null; e.target.src = '' }}
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white text-xs font-bold shadow-md">
                {item.nome?.charAt(0)?.toUpperCase()}
              </div>
            )}
            <div className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border-2 border-white dark:border-gray-900 ${
              item.status === 'disponivel' ? 'bg-green-500' :
              item.status === 'ausente' ? 'bg-yellow-500' :
              item.status === 'almoco' ? 'bg-orange-500' :
              item.status === 'fora_servico' ? 'bg-red-500' :
              'bg-gray-400'
            }`} />
          </div>
          
          <div className="flex-1 min-w-0 text-left">
            <div className="flex items-center gap-1.5 mb-0.5">
              <h4 className="font-bold text-gray-900 dark:text-white truncate text-xs leading-none">
                {item.nome}
              </h4>
              {ehFavorito && <Star className="w-3 h-3 fill-yellow-400 text-yellow-400 flex-shrink-0" />}
            </div>
            <p className="text-[10px] text-gray-600 dark:text-gray-400 truncate">
              {isOnline ? 'Ativo agora' : 'Offline'}
            </p>
          </div>
        </button>
      );
    }
    
    if (abaAtiva === 'grupos') {
      const totalMembros = item.totalMembros || item.membros?.length || 0;
      const naoLidas = notificacoesGrupos[item.id] || 0;
      
      return (
        <button 
          key={`g-${item.id}`}
          className="w-full flex items-center gap-2.5 p-2 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all rounded-lg border-b border-gray-100 dark:border-gray-800 last:border-0"
          onClick={() => selecionarGrupo(item)}
        >
          <div className="flex-shrink-0">
            {item.imagem ? (
              <img 
                src={`${API_URL_BASE}/uploads/grupos/${item.imagem}`} 
                alt={item.nome} 
                className="w-9 h-9 rounded-full object-cover ring-2 ring-gray-100 dark:ring-gray-700"
                onError={(e) => { e.target.onerror = null; e.target.src = '' }}
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-md">
                <Users className="w-5 h-5" />
              </div>
            )}
          </div>
          
          <div className="flex-1 min-w-0 text-left">
            <h4 className="font-bold text-gray-900 dark:text-white truncate text-xs leading-none mb-1">
              {item.nome}
            </h4>
            <p className="text-[10px] text-gray-600 dark:text-gray-400 truncate">
              {totalMembros} membros
            </p>
          </div>
          
          {naoLidas > 0 && (
            <div className="flex-shrink-0">
              <div className="min-w-[18px] h-5 px-1.5 bg-red-500 text-white rounded-full flex items-center justify-center text-[9px] font-bold">
                {naoLidas > 9 ? '9+' : naoLidas}
              </div>
            </div>
          )}
        </button>
      );
    }
  };

// PARTE 5: JSX Principal - VERSÃO COMPACTA

  return (
    <div className={`h-screen flex flex-col bg-gray-50 dark:bg-gray-900 ${telaCheia ? 'fixed inset-0 z-50' : ''}`}>
      
      {/* HEADER PRINCIPAL - COMPACTO */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-2 flex items-center justify-between flex-shrink-0 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMostrarSidebar(!mostrarSidebar)}
            className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all lg:hidden"
          >
            <Menu className="w-5 h-5 text-gray-700 dark:text-gray-300" />
          </button>
          
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-md">
              <MessageCircle className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold text-gray-900 dark:text-white leading-none">
                Chat Interno
              </h1>
              <p className="text-[10px] text-gray-600 dark:text-gray-400">
                {usuario?.nome}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {totalNotificacoes > 0 && (
            <div className="relative">
              <Bell className="w-5 h-5 text-gray-700 dark:text-gray-300" />
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center text-[9px] font-bold">
                {totalNotificacoes > 9 ? '9+' : totalNotificacoes}
              </div>
            </div>
          )}
          
          <button
            onClick={() => setTelaCheia(!telaCheia)}
            className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all"
            title={telaCheia ? 'Sair de tela cheia' : 'Tela cheia'}
          >
            {telaCheia ? (
              <Minimize2 className="w-4 h-4 text-gray-700 dark:text-gray-300" />
            ) : (
              <Maximize2 className="w-4 h-4 text-gray-700 dark:text-gray-300" />
            )}
          </button>
        </div>
      </header>

      {/* CONTEÚDO PRINCIPAL */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* SIDEBAR - LISTA DE CONVERSAS - COMPACTA */}
        <aside className={`bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col transition-all duration-300 ${
          mostrarSidebar ? 'w-72' : 'w-0'
        } overflow-hidden`}>
          
          {/* Busca e Botão de Ação - COMPACTO */}
          <div className="p-2 border-b border-gray-200 dark:border-gray-700 space-y-2">
            <div className="flex gap-1.5">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  placeholder={
                    abaAtiva === 'conversas' ? 'Buscar...' :
                    abaAtiva === 'grupos' ? 'Buscar grupos...' :
                    'Buscar...'
                  }
                  className="w-full pl-7 pr-2 py-1.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-xs"
                />
              </div>
              
              <button
                onClick={handleBotaoAcao}
                className="p-1.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:shadow-lg transition-all flex-shrink-0"
                title={getTituloBotao()}
              >
                {getIconeBotao()}
              </button>
            </div>
          </div>

          {/* Abas - COMPACTAS */}
          <div className="flex border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
            <button
              onClick={() => setAbaAtiva('conversas')}
              className={`flex-1 px-2 py-2 text-[11px] font-semibold transition-all flex items-center justify-center gap-1 ${
                abaAtiva === 'conversas'
                  ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>Individual</span>
            </button>
            
            <button
              onClick={() => setAbaAtiva('grupos')}
              className={`flex-1 px-2 py-2 text-[11px] font-semibold transition-all flex items-center justify-center gap-1 ${
                abaAtiva === 'grupos'
                  ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Grupos</span>
              {Object.values(notificacoesGrupos).reduce((a, b) => a + b, 0) > 0 && (
                <span className="px-1.5 py-0.5 bg-red-500 text-white rounded-full text-[9px] font-bold">
                  {Object.values(notificacoesGrupos).reduce((a, b) => a + b, 0) > 9 ? '9+' : Object.values(notificacoesGrupos).reduce((a, b) => a + b, 0)}
                </span>
              )}
            </button>
            
            <button
              onClick={() => setAbaAtiva('suporte')}
              className={`flex-1 px-2 py-2 text-[11px] font-semibold transition-all flex items-center justify-center gap-1 ${
                abaAtiva === 'suporte'
                  ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <LifeBuoy className="w-3.5 h-3.5" />
              <span>Suporte</span>
              {notificacoesSuporte > 0 && (
                <span className="px-1.5 py-0.5 bg-red-500 text-white rounded-full text-[9px] font-bold">
                  {notificacoesSuporte > 9 ? '9+' : notificacoesSuporte}
                </span>
              )}
            </button>
          </div>

          {/* Lista - COMPACTA */}
          <div className="flex-1 overflow-y-auto">
            {carregando ? (
              <div className="flex flex-col items-center justify-center h-48">
                <Loader2 className="w-6 h-6 text-blue-600 animate-spin mb-2" />
                <p className="text-xs text-gray-600 dark:text-gray-400">Carregando...</p>
              </div>
            ) : itensLista.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-center px-4">
                {abaAtiva === 'conversas' && <MessageCircle className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-3" />}
                {abaAtiva === 'grupos' && <Users className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-3" />}
                {abaAtiva === 'suporte' && <LifeBuoy className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-3" />}
                <p className="text-xs font-semibold text-gray-900 dark:text-white mb-1">
                  {abaAtiva === 'conversas' && 'Nenhum membro'}
                  {abaAtiva === 'grupos' && 'Nenhum grupo'}
                  {abaAtiva === 'suporte' && 'Nenhuma solicitação'}
                </p>
                <p className="text-[10px] text-gray-600 dark:text-gray-400">
                  {abaAtiva === 'conversas' && 'Clique no + para iniciar'}
                  {abaAtiva === 'grupos' && 'Clique no + para gerenciar'}
                  {abaAtiva === 'suporte' && 'Clique no + para solicitar'}
                </p>
              </div>
            ) : (
              <div className="p-1.5">
                {itensLista.map(renderItemLista)}
              </div>
            )}
          </div>
        </aside>

        {/* ÁREA PRINCIPAL DE CONVERSA */}
        <main className="flex-1 flex flex-col bg-white dark:bg-gray-800">
          
          {!conversaAtual ? (
            // Estado vazio - Nenhuma conversa selecionada
            <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-full flex items-center justify-center mb-4">
                <MessageCircle className="w-10 h-10 text-blue-600 dark:text-blue-400" />
              </div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                Bem-vindo ao Chat Interno
              </h2>
              <p className="text-xs text-gray-600 dark:text-gray-400 max-w-sm">
                Selecione uma conversa na barra lateral para começar
              </p>
            </div>
          ) : (
            <>
              {/* Header da Conversa - COMPACTO */}
              <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-4 py-2.5 flex items-center justify-between shadow-md">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setConversaAtual(null)}
                    className="p-1.5 hover:bg-white/20 rounded-lg transition-all lg:hidden"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  
                  {/* Avatar - COMPACTO */}
                  <div className="relative flex-shrink-0">
                    <div className="w-9 h-9 bg-white/20 backdrop-blur-xl rounded-full overflow-hidden">
                      {conversaAtual.destinatario?.foto_perfil || conversaAtual.grupo?.imagem ? (
                        <img
                          src={
                            conversaAtual.destinatario?.foto_perfil ||
                            `${API_URL_BASE}/uploads/grupos/${conversaAtual.grupo?.imagem}`
                          }
                          alt={infoConversa.titulo}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextElementSibling.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div
                        className="w-full h-full bg-white/20 flex items-center justify-center text-sm font-bold"
                        style={{ display: (conversaAtual.destinatario?.foto_perfil || conversaAtual.grupo?.imagem) ? 'none' : 'flex' }}
                      >
                        {infoConversa.titulo.charAt(0)}
                      </div>
                    </div>
                    
                    {conversaAtual.tipo === 'individual' && (
                      <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white"></div>
                    )}
                  </div>
                  
                  {/* Info - COMPACTO */}
                  <div>
                    <h3 className="font-bold text-sm leading-none mb-0.5">{infoConversa.titulo}</h3>
                    <p className="text-[10px] text-blue-100">{infoConversa.subtitulo}</p>
                  </div>
                </div>
                
                {/* Ações - COMPACTAS */}
                <div className="flex items-center gap-1">
                  {conversaAtual.tipo === 'individual' && (
                    <>
                      <button className="p-1.5 hover:bg-white/20 rounded-lg transition-all" title="Ligação">
                        <Phone className="w-4 h-4" />
                      </button>
                      <button className="p-1.5 hover:bg-white/20 rounded-lg transition-all" title="Vídeo">
                        <Video className="w-4 h-4" />
                      </button>
                    </>
                  )}
                  
                  <button
                    onClick={() => setMostrarDetalhes(!mostrarDetalhes)}
                    className="p-1.5 hover:bg-white/20 rounded-lg transition-all"
                    title="Informações"
                  >
                    <Info className="w-4 h-4" />
                  </button>
                  
                  <button className="p-1.5 hover:bg-white/20 rounded-lg transition-all" title="Mais">
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Área de Mensagens - OTIMIZADA */}
              <div 
                ref={mensagensRef}
                className="flex-1 overflow-y-auto p-3 space-y-1.5 bg-gray-50 dark:bg-gray-900"
                style={{ scrollbarWidth: 'thin' }}
              >
                {carregandoMensagens ? (
                  <div className="flex flex-col items-center justify-center h-full">
                    <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-3" />
                    <p className="text-xs text-gray-600 dark:text-gray-400">Carregando mensagens...</p>
                  </div>
                ) : mensagens.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center px-6">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-full flex items-center justify-center mb-3">
                      <MessageCircle className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                    </div>
                    <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1">
                      Nenhuma mensagem ainda
                    </h3>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Envie a primeira mensagem
                    </p>
                  </div>
                ) : (
                  mensagens.map((msg, index) => (
                    <MensagemBalao
                      key={msg.id || index}
                      mensagem={msg}
                      isMeu={msg.remetenteId === usuario.id}
                      proximaDoMesmo={mensagens[index + 1]?.remetenteId === msg.remetenteId}
                      isGrupoOuGeral={conversaAtual.tipo === 'grupo' || conversaAtual.tipo === 'geral' || conversaAtual.tipo === 'suporte'}
                      mostrarRemetente={conversaAtual.tipo !== 'individual' || msg.tipo === 'sistema'}
                    />
                  ))
                )}
              </div>

              {/* Editor de Mensagem - COMPACTO */}
              <div className="p-2.5 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex-shrink-0 space-y-2">
                {isSuporteOuOwner && conversaAtual.tipo === 'individual' && (
                  <BotaoEncerrarAtendimento
                    conversaAtual={conversaAtual}
                    usuarioAtual={usuario}
                    onEncerrado={() => {
                      toast.success('Atendimento encerrado!');
                      carregarMensagens();
                    }}
                  />
                )}

                {conversaAtual.tipo === 'suporte' && conversaAtual.solicitacao?.status === 'ENCERRADO' ? (
                  <div className="text-center py-2">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-50 dark:bg-green-900/20 rounded-full">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                      <p className="text-xs text-green-700 dark:text-green-400 font-semibold">
                        Atendimento Encerrado
                      </p>
                    </div>
                  </div>
                ) : (
                  <EditorMensagem
                    conversaAtual={conversaAtual}
                    rolarParaFinal={rolarParaFinal}
                    onMensagemEnviada={(novaMensagem) => {
                      setMensagens(prev => [...prev, novaMensagem]);
                      setTimeout(() => rolarParaFinal(), 100);
                    }}
                  />
                )}
              </div>
            </>
          )}
        </main>

        {/* PAINEL DE DETALHES - COMPACTO */}
        {mostrarDetalhes && conversaAtual && (
          <aside className="w-64 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 flex flex-col overflow-y-auto">
            <div className="p-3 space-y-3">
              
              {/* Cabeçalho do Painel */}
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                  Detalhes
                </h3>
                <button
                  onClick={() => setMostrarDetalhes(false)}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all"
                >
                  <X className="w-4 h-4 text-gray-700 dark:text-gray-300" />
                </button>
              </div>

              {/* Informações da Conversa */}
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-2 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                  {conversaAtual.destinatario?.foto_perfil || conversaAtual.grupo?.imagem ? (
                    <img
                      src={
                        conversaAtual.destinatario?.foto_perfil ||
                        `${API_URL_BASE}/uploads/grupos/${conversaAtual.grupo?.imagem}`
                      }
                      alt={infoConversa.titulo}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-white text-xl font-bold">
                      {infoConversa.titulo.charAt(0)}
                    </span>
                  )}
                </div>
                
                <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-0.5">
                  {infoConversa.titulo}
                </h4>
                <p className="text-[10px] text-gray-600 dark:text-gray-400">
                  {infoConversa.subtitulo}
                </p>
              </div>

              {/* Ações Rápidas */}
              {conversaAtual.tipo === 'individual' && (
                <div className="grid grid-cols-3 gap-2">
                  <button className="flex flex-col items-center gap-1.5 p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-all">
                    <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                      <Phone className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <span className="text-[9px] font-medium text-gray-700 dark:text-gray-300">
                      Ligar
                    </span>
                  </button>
                  
                  <button className="flex flex-col items-center gap-1.5 p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-all">
                    <div className="w-8 h-8 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                      <Video className="w-4 h-4 text-green-600 dark:text-green-400" />
                    </div>
                    <span className="text-[9px] font-medium text-gray-700 dark:text-gray-300">
                      Vídeo
                    </span>
                  </button>
                  
                  <button className="flex flex-col items-center gap-1.5 p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-all">
                    <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center">
                      <UserPlus className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    </div>
                    <span className="text-[9px] font-medium text-gray-700 dark:text-gray-300">
                      Grupo
                    </span>
                  </button>
                </div>
              )}

              {/* Seção de Membros (para grupos) */}
              {conversaAtual.tipo === 'grupo' && conversaAtual.grupo?.membros && (
                <div>
                  <h5 className="text-xs font-bold text-gray-900 dark:text-white mb-2">
                    Membros ({conversaAtual.grupo.membros.length})
                  </h5>
                  
                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    {conversaAtual.grupo.membros.map((membro) => (
                      <div
                        key={membro.usuarioId}
                        className="flex items-center gap-2 p-1.5 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-all"
                      >
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-[10px] font-bold">
                          {membro.nome?.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-gray-900 dark:text-white truncate leading-none">
                            {membro.nome}
                          </p>
                          <p className="text-[9px] text-gray-600 dark:text-gray-400 truncate">
                            {membro.email}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Arquivos Compartilhados */}
              <div>
                <h5 className="text-xs font-bold text-gray-900 dark:text-white mb-2">
                  Arquivos Compartilhados
                </h5>
                <div className="text-center py-6">
                  <ImageIcon className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-1.5" />
                  <p className="text-[10px] text-gray-600 dark:text-gray-400">
                    Nenhum arquivo
                  </p>
                </div>
              </div>
            </div>
          </aside>
        )}
      </div>

      {/* MODAIS */}
      {mostrarGerenciarGrupos && (
        <GerenciarGrupos 
          onClose={() => setMostrarGerenciarGrupos(false)}
          onSelecionarGrupo={(grupo) => {
            selecionarGrupo(grupo);
            setMostrarGerenciarGrupos(false);
          }}
        />
      )}

      {mostrarSolicitarAjuda && (
        <SolicitarAjuda 
          onClose={() => setMostrarSolicitarAjuda(false)}
          onEnviar={() => {
            setMostrarSolicitarAjuda(false);
            carregarDados();
          }}
        />
      )}

      {mostrarEnviarAlerta && (
        <EnviarAlerta 
          onClose={() => setMostrarEnviarAlerta(false)}
        />
      )}

      {solicitacaoParaAvaliar && (
        <NotificacaoSuporte
          solicitacao={solicitacaoParaAvaliar}
          onClose={() => setSolicitacaoParaAvaliar(null)}
          onAvaliar={() => {
            setSolicitacaoParaAvaliar(null);
            if (conversaAtual?.solicitacao?.id === solicitacaoParaAvaliar.id) {
              carregarMensagens();
            }
          }}
        />
      )}

      {/* ESTILOS CUSTOMIZADOS - OTIMIZADOS */}
      <style>{`
        /* Scrollbar personalizada - mais fina */
        ::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        
        ::-webkit-scrollbar-track {
          background: transparent;
        }
        
        ::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 3px;
        }
        
        ::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
        
        .dark ::-webkit-scrollbar-thumb {
          background: #475569;
        }
        
        .dark ::-webkit-scrollbar-thumb:hover {
          background: #64748b;
        }

        /* Transições suaves */
        * {
          transition-property: background-color, border-color, color, fill, stroke, opacity, box-shadow, transform;
          transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
          transition-duration: 150ms;
        }

        /* Animações */
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }

        .animate-slideUp {
          animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .animate-scaleIn {
          animation: scaleIn 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }

        /* Otimização de texto */
        body {
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }

        /* Compactar botões */
        button {
          user-select: none;
          -webkit-tap-highlight-color: transparent;
        }

        /* Melhorar performance de scroll */
        .overflow-y-auto {
          overflow-y: auto;
          overscroll-behavior-y: contain;
          -webkit-overflow-scrolling: touch;
        }
      `}</style>
    </div>
  );
}