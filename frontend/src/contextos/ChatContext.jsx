// frontend/src/contextos/ChatContext.jsx - VERSÃO FINAL CORRIGIDA

import { createContext, useContext, useState, useCallback } from 'react';

const ChatContext = createContext();

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat deve ser usado dentro de ChatProvider');
  }
  return context;
};

export const ChatProvider = ({ children }) => {
  const [aberto, setAberto] = useState(false);
  const [conversaAtual, setConversaAtual] = useState(null);
  const [forcarAberturaComMencao, setForcarAberturaComMencao] = useState(null);
  const [posicaoBotao, setPosicaoBotao] = useState({ left: 24, bottom: 24 });

  const selecionarConversa = useCallback((conversa) => {
    console.log('[CHAT-CONTEXT] Selecionando conversa:', conversa);
    setConversaAtual(conversa);
    
    // Se conversa é null, manter chat aberto na lista
    if (!conversa) {
      setAberto(true);
    }
  }, []);

  const selecionarConversaIndividual = useCallback((usuario) => {
    console.log('[CHAT-CONTEXT] Selecionando conversa individual:', usuario);
    
    if (!usuario || !usuario.id) {
      console.error('[CHAT-CONTEXT] Usuário inválido:', usuario);
      return;
    }
    
    const conversa = {
      tipo: 'individual',
      destinatario: {
        usuarioId: usuario.id,
        nome: usuario.nome,
        email: usuario.email || '',
        nickname: usuario.nickname || '',
        foto_perfil: usuario.foto_perfil || null
      }
    };
    
    setConversaAtual(conversa);
    setAberto(true);
    
    console.log('[CHAT-CONTEXT] Conversa individual configurada:', conversa);
  }, []);

  const abrirChatComMencao = useCallback((usuario) => {
    console.log('[CHAT-CONTEXT] Abrindo chat com menção:', usuario);
    setForcarAberturaComMencao({
      id: usuario.id,
      nome: usuario.nome
    });
    setAberto(true);
  }, []);

  const limparForcarAbertura = useCallback(() => {
    setForcarAberturaComMencao(null);
  }, []);

  const atualizarPosicaoBotao = useCallback((novaPosicao) => {
    setPosicaoBotao(novaPosicao);
  }, []);

  const value = {
    aberto,
    setAberto,
    conversaAtual,
    selecionarConversa,
    selecionarConversaIndividual,
    forcarAberturaComMencao,
    abrirChatComMencao,
    limparForcarAbertura,
    posicaoBotao,
    atualizarPosicaoBotao
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};