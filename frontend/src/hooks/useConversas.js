// frontend/src/hooks/useConversas.js

import { useState, useEffect, useCallback } from 'react';
import api from '../servicos/api';

export const useConversas = () => {
  const [conversas, setConversas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState(null);
  const [filtro, setFiltro] = useState('TODAS');
  const [pesquisa, setPesquisa] = useState('');
  const [etiquetaSelecionada, setEtiquetaSelecionada] = useState(null);

  // Carregar conversas
  const carregarConversas = useCallback(async () => {
    try {
      setLoading(true);
      setErro(null);

      const params = {
        filtro,
        pesquisa
      };

      if (etiquetaSelecionada) {
        params.etiquetaId = etiquetaSelecionada;
      }

      const response = await api.get('/conversas', { params });

      if (response.data.sucesso) {
        setConversas(response.data.conversas);
      }
    } catch (error) {
      console.error('❌ Erro ao carregar conversas:', error);
      setErro(error.response?.data?.erro || 'Erro ao carregar conversas');
    } finally {
      setLoading(false);
    }
  }, [filtro, pesquisa, etiquetaSelecionada]);

  // Fixar/desfixar conversa
  const toggleFixar = async (conversaId) => {
    try {
      const response = await api.put(`/conversas/acao/${conversaId}`, {
        acao: 'fixar'
      });

      if (response.data.sucesso) {
        await carregarConversas();
        return { sucesso: true, mensagem: response.data.mensagem };
      }
    } catch (error) {
      console.error('❌ Erro ao fixar conversa:', error);
      return { 
        sucesso: false, 
        mensagem: error.response?.data?.erro || 'Erro ao fixar conversa' 
      };
    }
  };

  // Arquivar/desarquivar conversa
  const toggleArquivar = async (conversaId) => {
    try {
      const response = await api.put(`/conversas/acao/${conversaId}`, {
        acao: 'arquivar'
      });

      if (response.data.sucesso) {
        await carregarConversas();
        return { sucesso: true, mensagem: response.data.mensagem };
      }
    } catch (error) {
      console.error('❌ Erro ao arquivar conversa:', error);
      return { 
        sucesso: false, 
        mensagem: error.response?.data?.erro || 'Erro ao arquivar conversa' 
      };
    }
  };

  // Silenciar conversa
  const silenciarConversa = async (conversaId, duracao = '8h') => {
    try {
      const response = await api.put(`/conversas/acao/${conversaId}`, {
        acao: 'silenciar',
        duracao
      });

      if (response.data.sucesso) {
        await carregarConversas();
        return { sucesso: true, mensagem: response.data.mensagem };
      }
    } catch (error) {
      console.error('❌ Erro ao silenciar conversa:', error);
      return { 
        sucesso: false, 
        mensagem: error.response?.data?.erro || 'Erro ao silenciar conversa' 
      };
    }
  };

  // Marcar como não lida
  const marcarNaoLida = async (conversaId) => {
    try {
      const response = await api.put(`/conversas/acao/${conversaId}`, {
        acao: 'marcar_nao_lida'
      });

      if (response.data.sucesso) {
        await carregarConversas();
        return { sucesso: true, mensagem: response.data.mensagem };
      }
    } catch (error) {
      console.error('❌ Erro ao marcar como não lida:', error);
      return { 
        sucesso: false, 
        mensagem: error.response?.data?.erro || 'Erro ao marcar como não lida' 
      };
    }
  };

  // Favoritar conversa
  const toggleFavoritar = async (conversaId) => {
    try {
      const response = await api.put(`/conversas/acao/${conversaId}`, {
        acao: 'favoritar'
      });

      if (response.data.sucesso) {
        await carregarConversas();
        return { sucesso: true, mensagem: response.data.mensagem };
      }
    } catch (error) {
      console.error('❌ Erro ao favoritar conversa:', error);
      return { 
        sucesso: false, 
        mensagem: error.response?.data?.erro || 'Erro ao favoritar conversa' 
      };
    }
  };

  useEffect(() => {
    carregarConversas();
  }, [carregarConversas]);

  return {
    conversas,
    loading,
    erro,
    filtro,
    setFiltro,
    pesquisa,
    setPesquisa,
    etiquetaSelecionada,
    setEtiquetaSelecionada,
    carregarConversas,
    toggleFixar,
    toggleArquivar,
    silenciarConversa,
    marcarNaoLida,
    toggleFavoritar
  };
};