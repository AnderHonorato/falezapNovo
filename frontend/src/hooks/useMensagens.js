// frontend/src/hooks/useMensagens.js

import { useState, useEffect, useCallback, useRef } from 'react';
import api from '../servicos/api';

export const useMensagens = (conversaId) => {
  const [mensagens, setMensagens] = useState([]);
  const [loading, setLoading] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState(null);
  const [temMais, setTemMais] = useState(false);
  const [offset, setOffset] = useState(0);
  const mensagensRef = useRef(null);

  const limite = 50;

  // Carregar mensagens
  const carregarMensagens = useCallback(async (novoOffset = 0) => {
    if (!conversaId) return;

    try {
      setLoading(true);
      setErro(null);

      const response = await api.get(`/mensagens/conversa/${conversaId}`, {
        params: {
          limite,
          offset: novoOffset
        }
      });

      if (response.data.sucesso) {
        if (novoOffset === 0) {
          setMensagens(response.data.mensagens);
        } else {
          setMensagens(prev => [...response.data.mensagens, ...prev]);
        }
        setTemMais(response.data.temMais);
        setOffset(novoOffset);
      }
    } catch (error) {
      console.error('❌ Erro ao carregar mensagens:', error);
      setErro(error.response?.data?.erro || 'Erro ao carregar mensagens');
    } finally {
      setLoading(false);
    }
  }, [conversaId, limite]);

  // Carregar mais mensagens (scroll infinito)
  const carregarMais = useCallback(() => {
    if (temMais && !loading) {
      carregarMensagens(offset + limite);
    }
  }, [temMais, loading, offset, limite, carregarMensagens]);

  // Enviar mensagem de texto
  const enviarMensagem = async (numero, texto, quotedMsgId = null, formatacoes = null) => {
    try {
      setEnviando(true);
      setErro(null);

      const response = await api.post('/mensagens/enviar', {
        numero,
        mensagem: texto,
        quotedMsgId,
        formatacoes
      });

      if (response.data.sucesso) {
        // Adicionar mensagem enviada à lista
        setMensagens(prev => [...prev, response.data.mensagem]);
        
        // Rolar para o final
        setTimeout(() => {
          if (mensagensRef.current) {
            mensagensRef.current.scrollTop = mensagensRef.current.scrollHeight;
          }
        }, 100);

        return { sucesso: true, mensagem: response.data.mensagem };
      }
    } catch (error) {
      console.error('❌ Erro ao enviar mensagem:', error);
      setErro(error.response?.data?.erro || 'Erro ao enviar mensagem');
      return { 
        sucesso: false, 
        erro: error.response?.data?.erro || 'Erro ao enviar mensagem' 
      };
    } finally {
      setEnviando(false);
    }
  };

  // Enviar reação
  const enviarReacao = async (mensagemId, emoji) => {
    try {
      const response = await api.post('/mensagens/reacao', {
        mensagemId,
        emoji
      });

      if (response.data.sucesso) {
        // Atualizar mensagem com a reação
        setMensagens(prev => prev.map(msg => {
          if (msg.id === mensagemId) {
            const reacaoExistente = msg.reacoes?.find(r => r.usuarioId === msg.usuarioId);
            
            if (reacaoExistente) {
              return {
                ...msg,
                reacoes: msg.reacoes.map(r => 
                  r.usuarioId === msg.usuarioId ? { ...r, emoji } : r
                )
              };
            } else {
              return {
                ...msg,
                reacoes: [...(msg.reacoes || []), { emoji, usuarioId: msg.usuarioId }]
              };
            }
          }
          return msg;
        }));

        return { sucesso: true };
      }
    } catch (error) {
      console.error('❌ Erro ao enviar reação:', error);
      return { 
        sucesso: false, 
        erro: error.response?.data?.erro || 'Erro ao enviar reação' 
      };
    }
  };

  // Remover reação
  const removerReacao = async (mensagemId) => {
    try {
      const response = await api.delete(`/mensagens/reacao/${mensagemId}`);

      if (response.data.sucesso) {
        // Remover reação da mensagem
        setMensagens(prev => prev.map(msg => {
          if (msg.id === mensagemId) {
            return {
              ...msg,
              reacoes: msg.reacoes?.filter(r => r.usuarioId !== msg.usuarioId)
            };
          }
          return msg;
        }));

        return { sucesso: true };
      }
    } catch (error) {
      console.error('❌ Erro ao remover reação:', error);
      return { sucesso: false };
    }
  };

  // Marcar como lida
  const marcarComoLida = async () => {
    if (!conversaId) return;

    try {
      await api.put(`/mensagens/marcar-lida/${conversaId}`);
      
      // Atualizar mensagens localmente
      setMensagens(prev => prev.map(msg => ({
        ...msg,
        lida: msg.direcao === 'RECEBIDA' ? true : msg.lida
      })));
    } catch (error) {
      console.error('❌ Erro ao marcar como lida:', error);
    }
  };

  // Deletar mensagem
  const deletarMensagem = async (mensagemId, paraQuem = 'mim') => {
    try {
      const response = await api.delete(`/mensagens/${mensagemId}`, {
        data: { paraQuem }
      });

      if (response.data.sucesso) {
        if (paraQuem === 'todos') {
          // Atualizar a mensagem para mostrar "Esta mensagem foi apagada"
          setMensagens(prev => prev.map(msg => 
            msg.id === mensagemId 
              ? { ...msg, apagada: true, conteudo: 'Esta mensagem foi apagada', tipo: 'SISTEMA' }
              : msg
          ));
        } else {
          // Remover da lista
          setMensagens(prev => prev.filter(msg => msg.id !== mensagemId));
        }

        return { sucesso: true, mensagem: response.data.mensagem };
      }
    } catch (error) {
      console.error('❌ Erro ao deletar mensagem:', error);
      return { 
        sucesso: false, 
        erro: error.response?.data?.erro || 'Erro ao deletar mensagem' 
      };
    }
  };

  // Editar mensagem
  const editarMensagem = async (mensagemId, novoConteudo) => {
    try {
      const response = await api.put(`/mensagens/${mensagemId}/editar`, {
        novoConteudo
      });

      if (response.data.sucesso) {
        // Atualizar mensagem na lista
        setMensagens(prev => prev.map(msg => 
          msg.id === mensagemId 
            ? { ...msg, conteudo: novoConteudo, editada: true, editadaEm: new Date() }
            : msg
        ));

        return { sucesso: true };
      }
    } catch (error) {
      console.error('❌ Erro ao editar mensagem:', error);
      return { 
        sucesso: false, 
        erro: error.response?.data?.erro || 'Erro ao editar mensagem' 
      };
    }
  };

  // Fixar mensagem
  const fixarMensagem = async (mensagemId) => {
    try {
      const response = await api.put(`/mensagens/${mensagemId}/fixar`);

      if (response.data.sucesso) {
        setMensagens(prev => prev.map(msg => 
          msg.id === mensagemId 
            ? { ...msg, fixada: !msg.fixada, fixadaEm: !msg.fixada ? new Date() : null }
            : msg
        ));

        return { sucesso: true, mensagem: response.data.mensagem };
      }
    } catch (error) {
      console.error('❌ Erro ao fixar mensagem:', error);
      return { sucesso: false };
    }
  };

  // Adicionar mensagem recebida (via WebSocket)
  const adicionarMensagem = useCallback((novaMensagem) => {
    setMensagens(prev => {
      // Verificar se já existe
      const existe = prev.some(m => m.id === novaMensagem.id);
      if (existe) return prev;

      return [...prev, novaMensagem];
    });

    // Rolar para o final
    setTimeout(() => {
      if (mensagensRef.current) {
        mensagensRef.current.scrollTop = mensagensRef.current.scrollHeight;
      }
    }, 100);
  }, []);

  // Atualizar status de mensagem
  const atualizarStatusMensagem = useCallback((mensagemId, novoStatus) => {
    setMensagens(prev => prev.map(msg => 
      msg.whatsappId === mensagemId || msg.id === mensagemId
        ? { ...msg, statusMensagem: novoStatus }
        : msg
    ));
  }, []);

  // Carregar ao montar
  useEffect(() => {
    if (conversaId) {
      carregarMensagens(0);
    }
  }, [conversaId, carregarMensagens]);

  // Marcar como lida ao abrir conversa
  useEffect(() => {
    if (conversaId && mensagens.length > 0) {
      marcarComoLida();
    }
  }, [conversaId, mensagens.length]);

  return {
    mensagens,
    loading,
    enviando,
    erro,
    temMais,
    mensagensRef,
    carregarMensagens,
    carregarMais,
    enviarMensagem,
    enviarReacao,
    removerReacao,
    marcarComoLida,
    deletarMensagem,
    editarMensagem,
    fixarMensagem,
    adicionarMensagem,
    atualizarStatusMensagem
  };
};