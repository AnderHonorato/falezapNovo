// frontend/src/hooks/useEtiquetas.js

import { useState, useEffect, useCallback } from 'react';
import api from '../servicos/api';

export const useEtiquetas = () => {
  const [etiquetas, setEtiquetas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState(null);

  // Carregar etiquetas
  const carregarEtiquetas = useCallback(async () => {
    try {
      setLoading(true);
      setErro(null);

      const response = await api.get('/conversas/etiquetas/listar');

      if (response.data.sucesso) {
        setEtiquetas(response.data.etiquetas);
      }
    } catch (error) {
      console.error('❌ Erro ao carregar etiquetas:', error);
      setErro(error.response?.data?.erro || 'Erro ao carregar etiquetas');
    } finally {
      setLoading(false);
    }
  }, []);

  // Criar etiqueta
  const criarEtiqueta = async (nome, cor) => {
    try {
      const response = await api.post('/conversas/etiquetas', {
        nome,
        cor
      });

      if (response.data.sucesso) {
        await carregarEtiquetas();
        return { sucesso: true, etiqueta: response.data.etiqueta };
      }
    } catch (error) {
      console.error('❌ Erro ao criar etiqueta:', error);
      return { 
        sucesso: false, 
        mensagem: error.response?.data?.erro || 'Erro ao criar etiqueta' 
      };
    }
  };

  // Atualizar etiqueta
  const atualizarEtiqueta = async (etiquetaId, nome, cor) => {
    try {
      const response = await api.put(`/conversas/etiquetas/${etiquetaId}`, {
        nome,
        cor
      });

      if (response.data.sucesso) {
        await carregarEtiquetas();
        return { sucesso: true };
      }
    } catch (error) {
      console.error('❌ Erro ao atualizar etiqueta:', error);
      return { 
        sucesso: false, 
        mensagem: error.response?.data?.erro || 'Erro ao atualizar etiqueta' 
      };
    }
  };

  // Deletar etiqueta
  const deletarEtiqueta = async (etiquetaId) => {
    try {
      const response = await api.delete(`/conversas/etiquetas/${etiquetaId}`);

      if (response.data.sucesso) {
        await carregarEtiquetas();
        return { sucesso: true };
      }
    } catch (error) {
      console.error('❌ Erro ao deletar etiqueta:', error);
      return { 
        sucesso: false, 
        mensagem: error.response?.data?.erro || 'Erro ao deletar etiqueta' 
      };
    }
  };

  // Adicionar etiqueta à conversa
  const adicionarEtiquetaConversa = async (conversaId, etiquetaId) => {
    try {
      const response = await api.post(`/conversas/${conversaId}/etiquetas/${etiquetaId}`);

      if (response.data.sucesso) {
        return { sucesso: true };
      }
    } catch (error) {
      console.error('❌ Erro ao adicionar etiqueta:', error);
      return { 
        sucesso: false, 
        mensagem: error.response?.data?.erro || 'Erro ao adicionar etiqueta' 
      };
    }
  };

  // Remover etiqueta da conversa
  const removerEtiquetaConversa = async (conversaId, etiquetaId) => {
    try {
      const response = await api.delete(`/conversas/${conversaId}/etiquetas/${etiquetaId}`);

      if (response.data.sucesso) {
        return { sucesso: true };
      }
    } catch (error) {
      console.error('❌ Erro ao remover etiqueta:', error);
      return { 
        sucesso: false, 
        mensagem: error.response?.data?.erro || 'Erro ao remover etiqueta' 
      };
    }
  };

  useEffect(() => {
    carregarEtiquetas();
  }, [carregarEtiquetas]);

  return {
    etiquetas,
    loading,
    erro,
    carregarEtiquetas,
    criarEtiqueta,
    atualizarEtiqueta,
    deletarEtiqueta,
    adicionarEtiquetaConversa,
    removerEtiquetaConversa
  };
};