// frontend/src/hooks/mensagens/index.js - COM SOCKET LISTENER

import { useEstados } from './useEstados';
import { useConversas } from '../useConversas';
import { useMensagensConversa } from './useMensagensConversa';
import { useAnotacoes } from './useAnotacoes';
import { useMediaHandlers } from './useMediaHandlers';
import { useNavegacao } from './useNavegacao';
import { useSocketListener } from '../useSocketListener'; // ✅ ADICIONAR

export default function useMensagens(usuario) {
  // 1. Estados
  const estados = useEstados();
  
  // 2. Conversas
  const conversasHook = useConversas(usuario, estados);
  
  // 3. Mensagens (depende de conversas)
  const mensagensHook = useMensagensConversa(usuario, estados, conversasHook);
  
  // 4. Anotações (depende de conversas e mensagens)
  const anotacoesHook = useAnotacoes(usuario, estados, {
    ...conversasHook,
    ...mensagensHook,
  });
  
  // 5. Mídia (depende de conversas e mensagens)
  const mediaHook = useMediaHandlers(estados, {
    ...conversasHook,
    ...mensagensHook,
  });
  
  // 6. Navegação
  const navegacaoHook = useNavegacao(estados);
  
  // ✅ 7. Socket Listener (NOVO)
  useSocketListener(estados);
  
  // 8. Retorna tudo combinado
  return {
    // Estados básicos
    conversas: conversasHook.conversas,
    conversaSelecionada: estados.conversaSelecionada,
    mensagens: estados.mensagens,
    reactions: estados.reactions,
    anotacoes: estados.anotacoes,
    novaMensagem: estados.novaMensagem,
    pesquisa: estados.pesquisa,
    filtroStatus: estados.filtroStatus,
    replyingToMessage: estados.replyingToMessage,
    reactionMenuOpen: estados.reactionMenuOpen,
    carregando: estados.carregando,
    carregandoMais: estados.carregandoMais,
    enviando: estados.enviando,
    enviandoMidia: estados.enviandoMidia,
    sincronizando: estados.sincronizando,
    sincronizandoFotos: estados.sincronizandoFotos,
    temMaisMensagens: estados.temMaisMensagens,
    temaEscuro: estados.temaEscuro,
    larguraSidebar: estados.larguraSidebar,
    arquivoParaEnviar: estados.arquivoParaEnviar,
    legendaMidia: estados.legendaMidia,
    showPreviewModal: estados.showPreviewModal,
    isMediaModalOpen: estados.isMediaModalOpen,
    viewingMedia: estados.viewingMedia,
    modoAnotacao: estados.modoAnotacao,
    corAnotacao: estados.corAnotacao,
    painelAnotacoesAberto: estados.painelAnotacoesAberto,
    anotacaoDestacada: estados.anotacaoDestacada,
    modalConfirmacao: estados.modalConfirmacao,
    menuExpandido: estados.menuExpandido,
    secaoAtiva: estados.secaoAtiva,
    perfilAberto: estados.perfilAberto,
    notificacoesAtivas: estados.notificacoesAtivas,
    tema: estados.tema,
    escalaZoom: estados.escalaZoom,
    pesquisaNaConversa: estados.pesquisaNaConversa,
    resultadosPesquisa: estados.resultadosPesquisa,
    indicePesquisaAtual: estados.indicePesquisaAtual,
    mensagemFixada: estados.mensagemFixada,
    
    // Setters
    setNovaMensagem: estados.setNovaMensagem,
    setPesquisa: estados.setPesquisa,
    setFiltroStatus: estados.setFiltroStatus,
    setReplyingToMessage: estados.setReplyingToMessage,
    setReactionMenuOpen: estados.setReactionMenuOpen,
    setTemaEscuro: estados.setTemaEscuro,
    setLegendaMidia: estados.setLegendaMidia,
    setShowPreviewModal: estados.setShowPreviewModal,
    setCorAnotacao: estados.setCorAnotacao,
    setModoAnotacao: estados.setModoAnotacao,
    setPainelAnotacoesAberto: estados.setPainelAnotacoesAberto,
    setNotificacoesAtivas: estados.setNotificacoesAtivas,
    setConversaSelecionada: estados.setConversaSelecionada,
    setMensagens: estados.setMensagens,
    setReactions: estados.setReactions,
    setEscalaZoom: estados.setEscalaZoom,
    setPesquisaNaConversa: estados.setPesquisaNaConversa,
    setResultadosPesquisa: estados.setResultadosPesquisa,
    setIndicePesquisaAtual: estados.setIndicePesquisaAtual,
    setMensagemFixada: estados.setMensagemFixada,
    
    // Refs
    messagesEndRef: estados.messagesEndRef,
    messagesContainerRef: estados.messagesContainerRef,
    fileInputRef: estados.fileInputRef,
    inputRef: estados.inputRef,
    
    // Funções de Conversas
    carregarConversas: conversasHook.carregarConversas,
    selecionarConversa: conversasHook.selecionarConversa,
    toggleFixarConversa: conversasHook.toggleFixarConversa,
    toggleFavoritar: conversasHook.toggleFavoritar,
    alterarStatusConversa: conversasHook.alterarStatusConversa,
    sincronizarHistorico: conversasHook.sincronizarHistorico,
    sincronizarFotos: conversasHook.sincronizarFotos,
    marcarConversaComoLida: conversasHook.marcarConversaComoLida,
    marcarComoNaoLida: conversasHook.marcarComoNaoLida,
    
    // Funções de Mensagens
    handleScroll: mensagensHook.handleScroll,
    carregarMaisAntigas: mensagensHook.carregarMaisAntigas,
    enviarMensagem: mensagensHook.enviarMensagem,
    handleReact: mensagensHook.handleReact,
    scrollParaBaixo: mensagensHook.scrollParaBaixo,
    scrollParaPrimeiraNaoLida: mensagensHook.scrollParaPrimeiraNaoLida,
    carregarMensagensConversa: mensagensHook.carregarMensagensConversa,
    
    // Funções de Anotações
    criarAnotacao: anotacoesHook.criarAnotacao,
    deletarAnotacao: anotacoesHook.deletarAnotacao,
    abrirModalDeletar: anotacoesHook.abrirModalDeletar,
    cancelarDeletar: anotacoesHook.cancelarDeletar,
    confirmarDeletar: anotacoesHook.confirmarDeletar,
    ativarModoAnotacao: anotacoesHook.ativarModoAnotacao,
    scrollParaAnotacao: anotacoesHook.scrollParaAnotacao,
    togglePainelAnotacoes: anotacoesHook.togglePainelAnotacoes,
    carregarAnotacoes: anotacoesHook.carregarAnotacoes,
    
    // Funções de Mídia
    handleFileChange: mediaHook.handleFileChange,
    enviarArquivoMidia: () => mediaHook.enviarArquivoMidia(usuario),
    openMediaModal: mediaHook.openMediaModal,
    closeMediaModal: mediaHook.closeMediaModal,
    downloadMedia: mediaHook.downloadMedia,
    replyToMedia: mediaHook.replyToMedia,
    forwardMedia: mediaHook.forwardMedia,
    
    // Funções de Navegação
    iniciarRedimensionamento: navegacaoHook.iniciarRedimensionamento,
    toggleMenuExpandido: navegacaoHook.toggleMenuExpandido,
    selecionarSecao: navegacaoHook.selecionarSecao,
    abrirPerfil: navegacaoHook.abrirPerfil,
    fecharPerfil: navegacaoHook.fecharPerfil,
    limparHistorico: conversasHook.limparHistorico,
  };
}