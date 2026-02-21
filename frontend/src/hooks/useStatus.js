// frontend/src/hooks/useStatus.js

import { useState, useEffect, useCallback } from 'react';
import api from '../servicos/api';
import toast from 'react-hot-toast';

export function useStatus(usuarioId) {
  const [status, setStatus] = useState('offline');
  const [configuracao, setConfiguracao] = useState(null);
  const [carregandoStatusInicial, setCarregandoStatusInicial] = useState(true);

  const carregarStatus = useCallback(async () => {
    if (!usuarioId) {
        setCarregandoStatusInicial(false);
        return;
    };
    try {
      // ✅ URL CORRETA (sem /api)
      const response = await api.get(`/status/${usuarioId}`);
      setStatus(response.data.status || 'offline');
      setConfiguracao(response.data.configuracao);
    } catch (error) {
      console.error(`Erro ao carregar status para ${usuarioId}:`, error);
      setStatus('offline');
    } finally {
        setCarregandoStatusInicial(false);
    }
  }, [usuarioId]);

   const atualizarAtividade = useCallback(async () => {
       if (!usuarioId) return;
       try {
           // ✅ URL CORRETA (sem /api)
           await api.post(`/status/${usuarioId}/atividade`);
       } catch (error) {
           if (error.response?.status !== 404) {
               console.error(`Erro ao atualizar atividade para ${usuarioId}:`, error);
           }
       }
   }, [usuarioId]);


  useEffect(() => {
    if (!usuarioId) return;

    carregarStatus();

    const intervalAtividade = setInterval(() => {
      atualizarAtividade();
    }, 30 * 1000);

    const intervalRecarregar = setInterval(() => {
        carregarStatus();
    }, 2 * 60 * 1000);

    return () => {
        clearInterval(intervalAtividade);
        clearInterval(intervalRecarregar);
    };
  }, [usuarioId, carregarStatus, atualizarAtividade]);

  const mudarStatus = useCallback(async (novoStatus, novaConfiguracao = null) => {
    if (!usuarioId) return;
    const statusAnterior = status;
    setStatus(novoStatus);
    try {
      // MODIFIED: Removido /api do início da URL
      const response = await api.post(`/status/${usuarioId}`, { // <<<<< CORREÇÃO APLICADA AQUI
        status: novoStatus,
        configuracao: novaConfiguracao,
      });
      toast.success(`Status alterado para ${novoStatus}!`);
      // Opcional: Se o backend retornar a config atualizada no POST, descomente:
      // if (response.data.configuracao) {
      //    setConfiguracao(response.data.configuracao);
      // }
    } catch (error) {
      console.error('Erro ao mudar status:', error);
      const errorMsg = error.response?.data?.erro || error.response?.data?.mensagem || error.message;
      toast.error(`Erro ao alterar status: ${errorMsg}`);
      setStatus(statusAnterior); // Rollback
    }
  }, [usuarioId, status]);

  return {
    status: carregandoStatusInicial ? 'carregando' : status,
    configuracao,
    mudarStatus,
    atualizarAtividade,
  };
}