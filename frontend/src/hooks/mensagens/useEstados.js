// frontend/src/hooks/mensagens/useEstados.js - ✅ VERSÃO CORRIGIDA

import { useState, useRef, useEffect } from 'react';
import { TEMAS } from '../../constantes/mensagensConstantes';
import { LARGURA_SIDEBAR_PADRAO } from './constants';

export function useEstados() {
  // Conversas e Mensagens
  const [conversas, setConversas] = useState([]);
  const [conversaSelecionada, setConversaSelecionada] = useState(null);
  const [mensagens, setMensagens] = useState([]);
  const [reactions, setReactions] = useState([]);
  const [anotacoes, setAnotacoes] = useState([]);
  
  // Interface
  const [novaMensagem, setNovaMensagem] = useState('');
  const [pesquisa, setPesquisa] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('TODAS');
  const [replyingToMessage, setReplyingToMessage] = useState(null);
  const [reactionMenuOpen, setReactionMenuOpen] = useState(null);
  
  // Loading States
  const [carregando, setCarregando] = useState(false);
  const [carregandoMais, setCarregandoMais] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [enviandoMidia, setEnviandoMidia] = useState(false);
  const [sincronizando, setSincronizando] = useState(false);
  const [sincronizandoFotos, setSincronizandoFotos] = useState(false);
  const [carregandoAnotacoes, setCarregandoAnotacoes] = useState(false);
  
  // Paginação
  const [offset, setOffset] = useState(0);
  const [temMaisMensagens, setTemMaisMensagens] = useState(false);
  
  // ✅ Tema com persistência correta
  const [temaEscuro, setTemaEscuro] = useState(() => {
    try {
      const saved = localStorage.getItem('temaEscuro');
      return saved ? JSON.parse(saved) : true;
    } catch {
      return true;
    }
  });

  // ✅ Salva tema quando muda
  useEffect(() => {
    localStorage.setItem('temaEscuro', JSON.stringify(temaEscuro));
  }, [temaEscuro]);
  
  const [larguraSidebar, setLarguraSidebar] = useState(() => {
    const saved = localStorage.getItem('larguraSidebar');
    return saved ? parseInt(saved) : LARGURA_SIDEBAR_PADRAO;
  });
  const [redimensionando, setRedimensionando] = useState(false);
  
  // ✅ Escala de zoom
  const [escalaZoom, setEscalaZoom] = useState(() => {
    const saved = localStorage.getItem('escalaZoom');
    return saved ? parseFloat(saved) : 1.0;
  });

  useEffect(() => {
    localStorage.setItem('escalaZoom', escalaZoom.toString());
    document.documentElement.style.setProperty('--zoom-scale', escalaZoom);
  }, [escalaZoom]);
  
  // Mídia
  const [arquivoParaEnviar, setArquivoParaEnviar] = useState(null);
  const [legendaMidia, setLegendaMidia] = useState('');
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);
  const [viewingMedia, setViewingMedia] = useState(null);
  
  // Anotações
  const [modoAnotacao, setModoAnotacao] = useState(false);
  const [corAnotacao, setCorAnotacao] = useState('amarelo');
  const [painelAnotacoesAberto, setPainelAnotacoesAberto] = useState(false);
  const [anotacaoDestacada, setAnotacaoDestacada] = useState(null);
  const [modalConfirmacao, setModalConfirmacao] = useState({
    isOpen: false,
    anotacaoId: null,
    posicao: null,
  });
  
  // ✅ Pesquisa na conversa
  const [pesquisaNaConversa, setPesquisaNaConversa] = useState('');
  const [resultadosPesquisa, setResultadosPesquisa] = useState([]);
  const [indicePesquisaAtual, setIndicePesquisaAtual] = useState(0);
  
  // ✅ Mensagem fixada
  const [mensagemFixada, setMensagemFixada] = useState(null);
  
  // Menu e Navegação
  const [menuExpandido, setMenuExpandido] = useState(false);
  const [secaoAtiva, setSecaoAtiva] = useState('conversas');
  const [perfilAberto, setPerfilAberto] = useState(false);
  const [notificacoesAtivas, setNotificacoesAtivas] = useState(() => {
    const saved = localStorage.getItem('notificacoesAtivas');
    return saved ? JSON.parse(saved) : true;
  });
  
  // Refs
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const fileInputRef = useRef(null);
  const inputRef = useRef(null);
  const intervalRef = useRef(null);
  const messagesIntervalRef = useRef(null);
  const carregamentoInicialConcluidoRef = useRef(false);
  
  // ✅ CORREÇÃO CRÍTICA: conversasLidasRef deve ser um Set, não Map
  const conversasLidasRef = useRef(new Set());
  
  const carregandoMensagensRef = useRef(false);
  const scrollInicialFeitoParaConversaRef = useRef(null);

  const tema = temaEscuro ? TEMAS.escuro : TEMAS.claro;

  return {
    // Estados
    conversas, setConversas,
    conversaSelecionada, setConversaSelecionada,
    mensagens, setMensagens,
    reactions, setReactions,
    anotacoes, setAnotacoes,
    novaMensagem, setNovaMensagem,
    pesquisa, setPesquisa,
    filtroStatus, setFiltroStatus,
    replyingToMessage, setReplyingToMessage,
    reactionMenuOpen, setReactionMenuOpen,
    carregando, setCarregando,
    carregandoMais, setCarregandoMais,
    enviando, setEnviando,
    enviandoMidia, setEnviandoMidia,
    sincronizando, setSincronizando,
    sincronizandoFotos, setSincronizandoFotos,
    carregandoAnotacoes, setCarregandoAnotacoes,
    offset, setOffset,
    temMaisMensagens, setTemMaisMensagens,
    temaEscuro, setTemaEscuro,
    larguraSidebar, setLarguraSidebar,
    redimensionando, setRedimensionando,
    arquivoParaEnviar, setArquivoParaEnviar,
    legendaMidia, setLegendaMidia,
    showPreviewModal, setShowPreviewModal,
    isMediaModalOpen, setIsMediaModalOpen,
    viewingMedia, setViewingMedia,
    modoAnotacao, setModoAnotacao,
    corAnotacao, setCorAnotacao,
    painelAnotacoesAberto, setPainelAnotacoesAberto,
    anotacaoDestacada, setAnotacaoDestacada,
    modalConfirmacao, setModalConfirmacao,
    menuExpandido, setMenuExpandido,
    secaoAtiva, setSecaoAtiva,
    perfilAberto, setPerfilAberto,
    notificacoesAtivas, setNotificacoesAtivas,
    escalaZoom, setEscalaZoom,
    pesquisaNaConversa, setPesquisaNaConversa,
    resultadosPesquisa, setResultadosPesquisa,
    indicePesquisaAtual, setIndicePesquisaAtual,
    mensagemFixada, setMensagemFixada,
    tema,
    
    // Refs
    messagesEndRef,
    messagesContainerRef,
    fileInputRef,
    inputRef,
    intervalRef,
    messagesIntervalRef,
    carregamentoInicialConcluidoRef,
    conversasLidasRef,
    carregandoMensagensRef,
    scrollInicialFeitoParaConversaRef,
  };
}