// frontend/src/hooks/useUploadArquivo.js

import { useState } from 'react';
import api from '../servicos/api';

export const useUploadArquivo = () => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [erro, setErro] = useState(null);

  const enviarImagem = async (numero, arquivo, legenda = '') => {
    try {
      setUploading(true);
      setErro(null);
      setProgress(0);

      const formData = new FormData();
      formData.append('numero', numero);
      formData.append('imagem', arquivo);
      if (legenda) formData.append('legenda', legenda);

      const response = await api.post('/mensagens/enviar-imagem', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setProgress(percentCompleted);
        }
      });

      if (response.data.sucesso) {
        return { sucesso: true, mensagem: response.data.mensagem };
      } else {
        throw new Error(response.data.erro || 'Erro ao enviar imagem');
      }
    } catch (error) {
      console.error('❌ Erro ao enviar imagem:', error);
      setErro(error.response?.data?.erro || error.message);
      return { sucesso: false, erro: error.response?.data?.erro || error.message };
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const enviarVideo = async (numero, arquivo, legenda = '') => {
    try {
      setUploading(true);
      setErro(null);
      setProgress(0);

      const formData = new FormData();
      formData.append('numero', numero);
      formData.append('video', arquivo);
      if (legenda) formData.append('legenda', legenda);

      const response = await api.post('/mensagens/enviar-video', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setProgress(percentCompleted);
        }
      });

      if (response.data.sucesso) {
        return { sucesso: true, mensagem: response.data.mensagem };
      } else {
        throw new Error(response.data.erro || 'Erro ao enviar vídeo');
      }
    } catch (error) {
      console.error('❌ Erro ao enviar vídeo:', error);
      setErro(error.response?.data?.erro || error.message);
      return { sucesso: false, erro: error.response?.data?.erro || error.message };
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const enviarAudio = async (numero, arquivo) => {
    try {
      setUploading(true);
      setErro(null);
      setProgress(0);

      const formData = new FormData();
      formData.append('numero', numero);
      formData.append('audio', arquivo);

      const response = await api.post('/mensagens/enviar-audio', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setProgress(percentCompleted);
        }
      });

      if (response.data.sucesso) {
        return { sucesso: true, mensagem: response.data.mensagem };
      } else {
        throw new Error(response.data.erro || 'Erro ao enviar áudio');
      }
    } catch (error) {
      console.error('❌ Erro ao enviar áudio:', error);
      setErro(error.response?.data?.erro || error.message);
      return { sucesso: false, erro: error.response?.data?.erro || error.message };
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const enviarDocumento = async (numero, arquivo, legenda = '') => {
    try {
      setUploading(true);
      setErro(null);
      setProgress(0);

      const formData = new FormData();
      formData.append('numero', numero);
      formData.append('documento', arquivo);
      if (legenda) formData.append('legenda', legenda);

      const response = await api.post('/mensagens/enviar-documento', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setProgress(percentCompleted);
        }
      });

      if (response.data.sucesso) {
        return { sucesso: true, mensagem: response.data.mensagem };
      } else {
        throw new Error(response.data.erro || 'Erro ao enviar documento');
      }
    } catch (error) {
      console.error('❌ Erro ao enviar documento:', error);
      setErro(error.response?.data?.erro || error.message);
      return { sucesso: false, erro: error.response?.data?.erro || error.message };
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  return {
    uploading,
    progress,
    erro,
    enviarImagem,
    enviarVideo,
    enviarAudio,
    enviarDocumento
  };
};