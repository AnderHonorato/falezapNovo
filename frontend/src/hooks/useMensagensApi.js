// frontend/src/hooks/useMensagensApi.js

import { useState } from 'react';
import api from '../servicos/api';

export function useMensagensApi() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const apagarMensagem = async (mensagemId, usuarioId, apagarParaTodos = false) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.delete(`/whatsapp/mensagem/${mensagemId}`, {
        data: { usuarioId, apagarParaTodos }
      });
      return response.data;
    } catch (err) {
      setError(err.response?.data?.erro || 'Erro ao apagar mensagem');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const fixarMensagem = async (usuarioId, numeroCliente, mensagemId) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.post(
        `/whatsapp/conversa/${usuarioId}/${encodeURIComponent(numeroCliente)}/mensagem/${mensagemId}/fixar`
      );
      return response.data;
    } catch (err) {
      setError(err.response?.data?.erro || 'Erro ao fixar mensagem');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const desafixarMensagem = async (usuarioId, numeroCliente) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.delete(
        `/whatsapp/conversa/${usuarioId}/${encodeURIComponent(numeroCliente)}/mensagem/desafixar`
      );
      return response.data;
    } catch (err) {
      setError(err.response?.data?.erro || 'Erro ao desafixar mensagem');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const criarEventoSistema = async (usuarioId, numeroCliente, eventoTipo, nomeUsuario) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.post(
        `/whatsapp/conversa/${usuarioId}/${encodeURIComponent(numeroCliente)}/evento-sistema`,
        { eventoTipo, nomeUsuario }
      );
      return response.data;
    } catch (err) {
      setError(err.response?.data?.erro || 'Erro ao criar evento');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    apagarMensagem,
    fixarMensagem,
    desafixarMensagem,
    criarEventoSistema,
    loading,
    error
  };
}