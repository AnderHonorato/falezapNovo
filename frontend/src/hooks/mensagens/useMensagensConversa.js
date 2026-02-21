// frontend/src/hooks/mensagens/useMensagensConversa.js - ✅ CORRIGIDO COMPLETO

import { useEffect, useCallback } from 'react';
import { useSocket } from '../../contextos/SocketContext';
import api from '../../servicos/api';
import { INTERVALO_MENSAGENS, LIMITE_MENSAGENS } from './constants';
import { estaNoFundoDoScroll } from '../../utils/mensagensHelpers';
import toast from 'react-hot-toast';

export function useMensagensConversa(usuario, estados, conversasHook) {
  const { socket } = useSocket();
  
  const {
    conversaSelecionada,
    mensagens, setMensagens,
    reactions, setReactions,
    offset, setOffset,
    temMaisMensagens, setTemMaisMensagens,
    carregando, setCarregando,
    carregandoMais, setCarregandoMais,
    enviando, setEnviando,
    novaMensagem, setNovaMensagem,
    replyingToMessage, setReplyingToMessage,
    messagesEndRef,
    messagesContainerRef,
    messagesIntervalRef,
    carregandoMensagensRef,
    scrollInicialFeitoParaConversaRef,
    conversasLidasRef,
  } = estados;

  const { marcarConversaComoLida, carregarConversas } = conversasHook;

  // ============================================================================
  // SCROLL
  // ============================================================================
  const scrollParaBaixo = useCallback((behavior = 'smooth') => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior, block: 'end' });
    }, 100);
  }, [messagesEndRef]);

  const scrollParaPrimeiraNaoLida = useCallback((behavior = 'auto') => {
    const container = messagesContainerRef.current;
    if (!container) return false;
    
    const primeiroNaoLidaEl = container.querySelector('.unread-message');
    
    if (primeiroNaoLidaEl) {
      setTimeout(() => {
        primeiroNaoLidaEl.scrollIntoView({ behavior, block: 'center' });
      }, 100);
      return true;
    }
    return false;
  }, [messagesContainerRef]);

  const handleScroll = useCallback((e) => {
    const container = e.target;
    
    if (container.scrollTop === 0 && temMaisMensagens && !carregandoMais) {
      carregarMaisAntigas();
    }
  }, [temMaisMensagens, carregandoMais]);

  // ============================================================================
  // CARREGAR MENSAGENS (WhatsApp Business API)
  // ============================================================================
  const carregarMensagensConversa = useCallback(async (
    numeroCliente,
    offsetParam = 0,
    adicionar = false,
    silencioso = false
  ) => {
    if (!numeroCliente) return;
    
    if (carregandoMensagensRef.current && !silencioso) {
      return;
    }

    const container = messagesContainerRef.current;
    const estavaNoFundo = container ? estaNoFundoDoScroll(container) : true;

    try {
      if (!silencioso) {
        carregandoMensagensRef.current = true;
        if (!adicionar) setCarregando(true);
        else setCarregandoMais(true);
      }

      const response = await api.get(`/whatsapp/conversa/${encodeURIComponent(numeroCliente)}/mensagens`, { 
        params: { 
          limite: LIMITE_MENSAGENS, 
          offset: offsetParam
        } 
      });

      if (!response.data.sucesso) {
        console.error('❌ Erro na resposta:', response.data);
        return;
      }

      const { 
        mensagens: mensagensServidor = [], 
        temMais: temMaisNoServidor 
      } = response.data;

      // ============================================================================
      // NORMALIZAR MENSAGENS (WhatsApp Business formato)
      // ============================================================================
      const novasMensagens = [];
      const novasReacoes = [];
      
      mensagensServidor.forEach(m => {
        const tipoNormalizado = (m.tipo || 'TEXTO').toUpperCase();
        
        const mensagemNormalizada = {
          ...m,
          id: m.id || m.whatsappId,
          whatsappId: m.whatsappId || m.id,
          tipo: tipoNormalizado,
          mensagem: m.conteudo || m.mensagem || m.body || '',
          conteudo: m.conteudo || m.mensagem || m.body || '',
          mediaUrl: m.mediaUrl || m.midiaUrl,
          midiaUrl: m.mediaUrl || m.midiaUrl,
          
          direcao: m.direcao || 'RECEBIDA',
          fromMe: m.direcao === 'ENVIADA',
          
          remetenteNome: m.enviadaPor || m.remetenteNome || 'Desconhecido',
          remetenteNumero: m.enviadaPor,
          fotoRemetente: m.fotoRemetente || null,
          
          statusMensagem: m.statusMensagem || 'RECEBIDA',
          status: m.statusMensagem || 'RECEBIDA',
          lida: m.lida || false,
          
          timestamp: m.timestamp || m.criadaEm || new Date().toISOString(),
        };
        
        if (tipoNormalizado === 'REACAO') {
          novasReacoes.push(mensagemNormalizada);
        } else {
          novasMensagens.push(mensagemNormalizada);
        }
      });

      novasMensagens.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
      novasReacoes.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

      console.log(`📊 ${novasMensagens.length} mensagens, ${novasReacoes.length} reações`);

      const foiLidaLocalmente = conversasLidasRef.current.has(numeroCliente);

      // ============================================================================
      // ATUALIZAR ESTADO
      // ============================================================================
      if (adicionar) {
        setMensagens((prev) => {
          const novasIds = new Set(novasMensagens.map(m => m.whatsappId || m.id));
          const prevFiltradas = prev.filter(m => !novasIds.has(m.whatsappId || m.id));
          return [...novasMensagens, ...prevFiltradas];
        });
        
        setReactions((prev) => [...novasReacoes, ...prev]);
        setTemMaisMensagens(temMaisNoServidor === true);
        setOffset(offsetParam + LIMITE_MENSAGENS);
        
      } else if (silencioso) {
        setMensagens((prev) => {
          const mapaExistentes = new Map(prev.map(m => [m.whatsappId || m.id, m]));
          const mensagensReaisNovas = novasMensagens.filter(m => !mapaExistentes.has(m.whatsappId || m.id));
          
          if (mensagensReaisNovas.length > 0) {
            console.log(`📨 ${mensagensReaisNovas.length} novas mensagens via polling`);
            
            const resultado = [...prev, ...mensagensReaisNovas];
            
            if (estavaNoFundo || !container) {
              setTimeout(() => scrollParaBaixo('smooth'), 100);
            }
            
            if ((estavaNoFundo || !container) && !foiLidaLocalmente) {
              marcarConversaComoLida(numeroCliente);
            }
            
            return resultado;
          }
          
          return prev;
        });

        setReactions((prev) => {
          const idsExistentes = new Set(prev.map(r => r.whatsappId || r.id));
          const reacoesNovas = novasReacoes.filter(r => !idsExistentes.has(r.whatsappId || r.id));
          
          if (reacoesNovas.length > 0) {
            return [...prev, ...reacoesNovas];
          }
          
          return prev;
        });
        
      } else {
        setMensagens(novasMensagens);
        setReactions(novasReacoes);
        setTemMaisMensagens(temMaisNoServidor === true);
        setOffset(LIMITE_MENSAGENS);
        
        const temNaoLidas = novasMensagens.some(m => !m.lida && m.direcao === 'RECEBIDA');
        
        if (scrollInicialFeitoParaConversaRef.current !== numeroCliente) {
          scrollInicialFeitoParaConversaRef.current = numeroCliente;
          
          setTimeout(() => {
            if (temNaoLidas && !foiLidaLocalmente) {
              const scrollou = scrollParaPrimeiraNaoLida('auto');
              if (!scrollou) scrollParaBaixo('auto');
              setTimeout(() => marcarConversaComoLida(numeroCliente), 500);
            } else {
              scrollParaBaixo('auto');
            }
          }, 300);
        }
      }
      
    } catch (error) {
      console.error('❌ Erro ao carregar mensagens:', error);
      if (!silencioso) {
        toast.error('Erro ao carregar mensagens');
      }
    } finally {
      setCarregando(false);
      setCarregandoMais(false);
      if (!silencioso) carregandoMensagensRef.current = false;
    }
  }, [
    setMensagens,
    setReactions,
    setTemMaisMensagens,
    setOffset,
    setCarregando,
    setCarregandoMais,
    messagesContainerRef,
    scrollParaBaixo,
    scrollParaPrimeiraNaoLida,
    marcarConversaComoLida,
    conversasLidasRef,
    scrollInicialFeitoParaConversaRef,
    carregandoMensagensRef
  ]);

  // ============================================================================
  // CARREGAR MAIS ANTIGAS
  // ============================================================================
  const carregarMaisAntigas = useCallback(() => {
    if (!carregandoMais && temMaisMensagens && conversaSelecionada) {
      const container = messagesContainerRef.current;
      const scrollPos = container?.scrollHeight || 0;
      
      carregarMensagensConversa(conversaSelecionada.numeroCliente, offset, true);
      
      setTimeout(() => {
        if (container) {
          const newScrollHeight = container.scrollHeight;
          container.scrollTop = newScrollHeight - scrollPos;
        }
      }, 150);
    }
  }, [carregandoMais, temMaisMensagens, conversaSelecionada, offset, messagesContainerRef, carregarMensagensConversa]);

  // ============================================================================
  // ENVIAR MENSAGEM (WhatsApp Business API) - ✅ CORRIGIDO
  // ============================================================================
  const enviarMensagem = useCallback(async () => {
    if (!novaMensagem.trim() || !conversaSelecionada || enviando) return;
    
    const mensagemTexto = novaMensagem.trim();
    const numeroCliente = conversaSelecionada.numeroCliente || conversaSelecionada.contato;
    
    if (!numeroCliente) {
      console.error('❌ Número do cliente não encontrado');
      toast.error('Erro: número do cliente não encontrado');
      return;
    }

    console.log('📤 Enviando mensagem para:', numeroCliente);
    
    setNovaMensagem('');
    setEnviando(true);

    // ✅ Mensagem temporária (otimista)
    const tempId = `temp-${Date.now()}`;
    const mensagemTemp = {
      id: tempId,
      whatsappId: tempId,
      mensagem: mensagemTexto,
      conteudo: mensagemTexto,
      timestamp: new Date().toISOString(),
      tipo: 'TEXTO',
      status: 'enviando',
      statusMensagem: 'ENVIANDO',
      direcao: 'ENVIADA',
      fromMe: true,
      lida: true,
      remetenteNome: 'Você',
      enviadaPor: usuario?.id || 'sistema',
    };

    // ✅ CORREÇÃO: Adicionar mensagem temporária ao estado
    setMensagens((prev) => [...prev, mensagemTemp]);
    scrollParaBaixo();

    setReplyingToMessage(null);

    try {
      const payload = {
        numero: numeroCliente,
        mensagem: mensagemTexto,
      };

      if (conversaSelecionada.instanciaId) {
        payload.instanciaId = conversaSelecionada.instanciaId;
      } else if (conversaSelecionada.conexaoWhatsApp?.instancia) {
        payload.instancia = conversaSelecionada.conexaoWhatsApp.instancia;
      }

      console.log('📤 Payload de envio:', payload);

      const response = await api.post('/whatsapp/enviar-mensagem', payload);

      console.log('✅ Mensagem enviada:', response.data);

      // ✅ CORREÇÃO: Atualizar mensagem temporária com dados reais
      setMensagens((prev) =>
        prev.map((msg) =>
          msg.id === tempId
            ? {
                ...msg,
                id: response.data.mensagemId || response.data.id || msg.id,
                whatsappId: response.data.mensagemId || response.data.whatsappId || msg.whatsappId,
                status: 'enviada',
                statusMensagem: 'ENVIADA',
              }
            : msg
        )
      );

      // ✅ CORREÇÃO: Atualizar lista de conversas para mostrar preview
      if (carregarConversas) {
        setTimeout(() => carregarConversas(), 500);
      }

      toast.success('Mensagem enviada');
      
    } catch (error) {
      console.error('❌ Erro ao enviar:', error);
      console.error('❌ Detalhes:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      
      const mensagemErro = error.response?.data?.erro || 
                          error.response?.data?.mensagem || 
                          'Erro ao enviar mensagem';
      
      // ✅ CORREÇÃO: Marcar mensagem como erro
      setMensagens((prev) =>
        prev.map((msg) =>
          msg.id === tempId 
            ? { ...msg, status: 'erro', statusMensagem: 'ERRO' } 
            : msg
        )
      );
      
      toast.error(mensagemErro);
    } finally {
      setEnviando(false);
    }
  }, [
    novaMensagem, 
    conversaSelecionada, 
    enviando, 
    usuario,
    setNovaMensagem, 
    setMensagens, 
    setEnviando, 
    setReplyingToMessage, 
    scrollParaBaixo,
    carregarConversas
  ]);

  // ============================================================================
  // REAGIR (WhatsApp Business API)
  // ============================================================================
  const handleReact = useCallback(async (mensagemId, emoji) => {
    if (!conversaSelecionada) return;

    try {
      const reacaoTemp = {
        id: `temp-reaction-${Date.now()}`,
        whatsappId: `temp-reaction-${Date.now()}`,
        tipo: 'REACAO',
        mensagem: emoji,
        direcao: 'ENVIADA',
        fromMe: true,
        reactionToWhatsappId: mensagemId,
        timestamp: new Date().toISOString(),
      };
      
      setReactions((prev) => [...prev, reacaoTemp]);
      
      const response = await api.post('/whatsapp/enviar-reacao', {
        numero: conversaSelecionada.numeroCliente,
        mensagemId: mensagemId,
        reacao: emoji,
        instancia: conversaSelecionada.conexaoWhatsApp?.instancia || 1
      });
      
      setReactions((prev) =>
        prev.map((r) =>
          r.id === reacaoTemp.id
            ? { ...r, id: response.data.id, whatsappId: response.data.id }
            : r
        )
      );
      
      toast.success('Reação enviada');
      
    } catch (error) {
      console.error('❌ Erro ao reagir:', error);
      setReactions((prev) => prev.filter(r => r.id !== reacaoTemp.id));
      toast.error('Erro ao enviar reação');
    }
  }, [conversaSelecionada, setReactions]);

  // ============================================================================
  // SOCKET.IO - ESCUTAR NOVAS MENSAGENS
  // ============================================================================
  useEffect(() => {
    if (!socket || !usuario?.contaId) {
      console.log('⚠️ Socket não conectado');
      return;
    }

    console.log('🔌 Registrando listeners do Socket.IO para mensagens...');

    const handleNovaMensagem = (dados) => {
      console.log('📨 Nova mensagem recebida via Socket:', dados);
      
      const { mensagem, conversa } = dados;

      // Se é da conversa atual, adicionar
      if (conversaSelecionada && 
          (conversa.numeroCliente === conversaSelecionada.numeroCliente || 
           conversa.id === conversaSelecionada.id)) {
        
        setMensagens(prev => {
          // Evitar duplicatas
          if (prev.some(m => m.whatsappId === mensagem.whatsappId || m.id === mensagem.id)) {
            return prev;
          }
          
          console.log('➕ Adicionando mensagem na conversa atual');
          return [...prev, mensagem];
        });

        // Scroll se estava no fundo
        const container = messagesContainerRef.current;
        if (container && estaNoFundoDoScroll(container)) {
          setTimeout(() => scrollParaBaixo('smooth'), 100);
          marcarConversaComoLida(conversa.numeroCliente);
        }

        // Som de notificação
        try {
          const audio = new Audio('/notification.mp3');
          audio.volume = 0.5;
          audio.play().catch(() => {});
        } catch (e) {}
      }

      // ✅ CORREÇÃO: Sempre atualizar a lista de conversas
      if (carregarConversas) {
        setTimeout(() => carregarConversas(), 500);
      }
    };

    const handleMensagemStatus = (dados) => {
      console.log('📊 Status atualizado:', dados);
      
      setMensagens(prev => prev.map(msg => 
        msg.whatsappId === dados.whatsappId
          ? { ...msg, statusMensagem: dados.status, status: dados.status, lida: dados.lida }
          : msg
      ));
    };

    socket.on('nova_mensagem', handleNovaMensagem);
    socket.on('mensagem_status_atualizada', handleMensagemStatus);

    const salaContaId = `conta:${usuario.contaId}`;
    socket.emit('entrar_sala', salaContaId);
    console.log('🚪 Entrou na sala:', salaContaId);

    console.log('✅ Listeners do Socket.IO registrados com sucesso!');

    return () => {
      console.log('🔌 Removendo listeners do Socket.IO...');
      socket.off('nova_mensagem', handleNovaMensagem);
      socket.off('mensagem_status_atualizada', handleMensagemStatus);
      socket.emit('sair_sala', salaContaId);
    };
  }, [socket, usuario?.contaId, conversaSelecionada, setMensagens, scrollParaBaixo, marcarConversaComoLida, messagesContainerRef, carregarConversas]);

  // ============================================================================
  // POLLING (fallback se socket falhar)
  // ============================================================================
  useEffect(() => {
    if (messagesIntervalRef.current) {
      clearInterval(messagesIntervalRef.current);
      messagesIntervalRef.current = null;
    }

    if (conversaSelecionada?.numeroCliente) {
      const numeroCliente = conversaSelecionada.numeroCliente;
      
      carregarMensagensConversa(numeroCliente, 0, false, false);
      
      const intervalId = setInterval(() => {
        carregarMensagensConversa(numeroCliente, 0, false, true);
      }, INTERVALO_MENSAGENS);
      
      messagesIntervalRef.current = intervalId;
    }

    return () => {
      if (messagesIntervalRef.current) {
        clearInterval(messagesIntervalRef.current);
        messagesIntervalRef.current = null;
      }
    };
  }, [conversaSelecionada?.numeroCliente, carregarMensagensConversa, messagesIntervalRef]);

  return {
    scrollParaBaixo,
    scrollParaPrimeiraNaoLida,
    handleScroll,
    carregarMensagensConversa,
    carregarMaisAntigas,
    enviarMensagem,
    handleReact,
  };
}