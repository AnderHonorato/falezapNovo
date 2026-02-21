// frontend/src/contextos/ChatCacheContext.jsx
import { createContext, useContext, useState, useCallback, useEffect } from 'react';

const ChatCacheContext = createContext();

export const useChatCache = () => {
  const context = useContext(ChatCacheContext);
  if (!context) throw new Error('useChatCache deve ser usado dentro de ChatCacheProvider');
  return context;
};

export const ChatCacheProvider = ({ children }) => {
  // Cache de mensagens por conversa
  const [mensagensCache, setMensagensCache] = useState(() => {
    try {
      const saved = localStorage.getItem('chat_mensagens_cache');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Cache de conversas
  const [conversasCache, setConversasCache] = useState(() => {
    try {
      const saved = localStorage.getItem('chat_conversas_cache');
      return saved ? JSON.parse(saved) : { conversas: [], grupos: [], suporte: [] };
    } catch {
      return { conversas: [], grupos: [], suporte: [] };
    }
  });

  // Cache de membros
  const [membrosCache, setMembrosCache] = useState(() => {
    try {
      const saved = localStorage.getItem('chat_membros_cache');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Timestamp da última atualização
  const [ultimaAtualizacao, setUltimaAtualizacao] = useState(() => {
    try {
      const saved = localStorage.getItem('chat_ultima_atualizacao');
      return saved ? JSON.parse(saved) : { conversas: 0, grupos: 0, suporte: 0 };
    } catch {
      return { conversas: 0, grupos: 0, suporte: 0 };
    }
  });

  // Salvar mensagens no cache
  const salvarMensagens = useCallback((conversaId, mensagens) => {
    setMensagensCache(prev => {
      const updated = { ...prev, [conversaId]: mensagens };
      localStorage.setItem('chat_mensagens_cache', JSON.stringify(updated));
      return updated;
    });
  }, []);

  // Obter mensagens do cache
  const obterMensagens = useCallback((conversaId) => {
    return mensagensCache[conversaId] || null;
  }, [mensagensCache]);

  // Adicionar nova mensagem ao cache
  const adicionarMensagem = useCallback((conversaId, mensagem) => {
    setMensagensCache(prev => {
      const mensagensAtuais = prev[conversaId] || [];
      
      // Evitar duplicatas
      if (mensagensAtuais.some(m => m.id === mensagem.id)) {
        return prev;
      }
      
      const updated = {
        ...prev,
        [conversaId]: [...mensagensAtuais, mensagem]
      };
      
      localStorage.setItem('chat_mensagens_cache', JSON.stringify(updated));
      return updated;
    });
  }, []);

  // Atualizar mensagem no cache (para marcar como lida, etc)
  const atualizarMensagem = useCallback((conversaId, mensagemId, updates) => {
    setMensagensCache(prev => {
      const mensagensAtuais = prev[conversaId] || [];
      const updated = {
        ...prev,
        [conversaId]: mensagensAtuais.map(m => 
          m.id === mensagemId ? { ...m, ...updates } : m
        )
      };
      
      localStorage.setItem('chat_mensagens_cache', JSON.stringify(updated));
      return updated;
    });
  }, []);

  // Marcar todas as mensagens de uma conversa como lidas
  const marcarTodasComoLidas = useCallback((conversaId) => {
    setMensagensCache(prev => {
      const mensagensAtuais = prev[conversaId] || [];
      const updated = {
        ...prev,
        [conversaId]: mensagensAtuais.map(m => ({ ...m, lida: true, lidaEm: new Date().toISOString() }))
      };
      
      localStorage.setItem('chat_mensagens_cache', JSON.stringify(updated));
      return updated;
    });
  }, []);

  // Salvar lista de conversas
  const salvarConversas = useCallback((tipo, lista) => {
    setConversasCache(prev => {
      const updated = { ...prev, [tipo]: lista };
      localStorage.setItem('chat_conversas_cache', JSON.stringify(updated));
      return updated;
    });
    
    setUltimaAtualizacao(prev => {
      const updated = { ...prev, [tipo]: Date.now() };
      localStorage.setItem('chat_ultima_atualizacao', JSON.stringify(updated));
      return updated;
    });
  }, []);

  // Obter conversas do cache
  const obterConversas = useCallback((tipo) => {
    return conversasCache[tipo] || [];
  }, [conversasCache]);

  // Atualizar contadores de não lidas em conversa
  const atualizarContadorNaoLidas = useCallback((tipo, conversaId, novoContador) => {
    setConversasCache(prev => {
      const lista = prev[tipo] || [];
      const updated = {
        ...prev,
        [tipo]: lista.map(item => {
          const itemId = tipo === 'conversas' ? item.usuarioId : 
                        tipo === 'grupos' ? item.id : 
                        item.id;
          
          return itemId === conversaId ? { ...item, naoLidas: novoContador } : item;
        })
      };
      
      localStorage.setItem('chat_conversas_cache', JSON.stringify(updated));
      return updated;
    });
  }, []);

  // Salvar membros
  const salvarMembros = useCallback((membros) => {
    setMembrosCache(membros);
    localStorage.setItem('chat_membros_cache', JSON.stringify(membros));
  }, []);

  // Verificar se precisa atualizar (15 segundos)
  const precisaAtualizar = useCallback((tipo) => {
    const ultima = ultimaAtualizacao[tipo] || 0;
    return (Date.now() - ultima) > 15000; // 15 segundos
  }, [ultimaAtualizacao]);

  // Limpar cache
  const limparCache = useCallback(() => {
    setMensagensCache({});
    setConversasCache({ conversas: [], grupos: [], suporte: [] });
    setMembrosCache([]);
    setUltimaAtualizacao({ conversas: 0, grupos: 0, suporte: 0 });
    
    localStorage.removeItem('chat_mensagens_cache');
    localStorage.removeItem('chat_conversas_cache');
    localStorage.removeItem('chat_membros_cache');
    localStorage.removeItem('chat_ultima_atualizacao');
  }, []);

  // Limpar cache ao fazer logout
  useEffect(() => {
    const handleLogout = () => limparCache();
    window.addEventListener('logout', handleLogout);
    return () => window.removeEventListener('logout', handleLogout);
  }, [limparCache]);

  const value = {
    // Mensagens
    salvarMensagens,
    obterMensagens,
    adicionarMensagem,
    atualizarMensagem,
    marcarTodasComoLidas,
    
    // Conversas
    salvarConversas,
    obterConversas,
    atualizarContadorNaoLidas,
    
    // Membros
    salvarMembros,
    membrosCache,
    
    // Utilidades
    precisaAtualizar,
    limparCache,
  };

  return (
    <ChatCacheContext.Provider value={value}>
      {children}
    </ChatCacheContext.Provider>
  );
};