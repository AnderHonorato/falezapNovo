// frontend/src/hooks/mensagens/useMediaHandlers.js
import api from '../../servicos/api';

export function useMediaHandlers(estados, conversasHook) {
  const {
    conversaSelecionada,
    arquivoParaEnviar, setArquivoParaEnviar,
    legendaMidia, setLegendaMidia,
    showPreviewModal, setShowPreviewModal,
    isMediaModalOpen, setIsMediaModalOpen,
    viewingMedia, setViewingMedia,
    enviandoMidia, setEnviandoMidia,
    setMensagens,
    inputRef,
    setReplyingToMessage,
  } = estados;

  const { scrollParaBaixo, carregarConversas } = conversasHook;

  // Abrir arquivo
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && conversaSelecionada) {
      setArquivoParaEnviar(file);
      setShowPreviewModal(true);
      setLegendaMidia('');
    }
    e.target.value = null;
  };

  // Enviar mídia
  const enviarArquivoMidia = async (usuario) => {
    if (!arquivoParaEnviar || enviandoMidia || !conversaSelecionada) return;
    
    setEnviandoMidia(true);
    setShowPreviewModal(false);

    const formData = new FormData();
    formData.append('usuarioId', usuario.id);
    formData.append('numero', conversaSelecionada.contato);
    formData.append('arquivo', arquivoParaEnviar);
    if (legendaMidia.trim()) formData.append('legenda', legendaMidia.trim());

    const tipoOtimista = arquivoParaEnviar.type.startsWith('image/')
      ? 'imagem'
      : arquivoParaEnviar.type.startsWith('video/')
      ? 'video'
      : arquivoParaEnviar.type.startsWith('audio/')
      ? 'audio'
      : 'documento';

    const mensagemTemp = {
      id: `temp-media-${Date.now()}`,
      whatsappId: `temp-media-${Date.now()}`,
      de: 'eu',
      mensagem: `Enviando ${tipoOtimista}...`,
      data: new Date().toISOString(),
      tipo: tipoOtimista,
      status: 'enviando',
      direcao: 'ENVIADA',
      lida: true,
      legendaImagem: legendaMidia.trim() || null,
      midiaNome: arquivoParaEnviar.name,
    };

    setMensagens((prev) => [...prev, mensagemTemp]);
    if (scrollParaBaixo) scrollParaBaixo();

    try {
      const response = await api.post('/whatsapp/enviar-midia', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setMensagens((prev) =>
        prev.map((msg) =>
          msg.id === mensagemTemp.id
            ? {
                ...msg,
                status: 'enviada',
                id: response.data.internalId || response.data.id || msg.id,
                whatsappId: response.data.id,
                data: new Date(response.data.timestamp || Date.now()).toISOString(),
              }
            : msg
        )
      );

      if (carregarConversas) setTimeout(() => carregarConversas(), 500);
    } catch (error) {
      console.error('❌ Erro ao enviar mídia:', error);
      setMensagens((prev) =>
        prev.map((msg) =>
          msg.id === mensagemTemp.id ? { ...msg, status: 'erro' } : msg
        )
      );
      alert('Erro ao enviar mídia');
    } finally {
      setEnviandoMidia(false);
      setArquivoParaEnviar(null);
      setLegendaMidia('');
    }
  };

  // Modal de visualização
  const openMediaModal = (mediaMsg) => {
    setViewingMedia(mediaMsg);
    setIsMediaModalOpen(true);
  };

  const closeMediaModal = () => {
    setIsMediaModalOpen(false);
    setViewingMedia(null);
  };

  // Ações de mídia
  const downloadMedia = () => {
    if (viewingMedia?.midiaUrl) {
      const link = document.createElement('a');
      link.href = viewingMedia.midiaUrl;
      link.download = viewingMedia.midiaNome || 'download';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const replyToMedia = () => {
    if (viewingMedia) {
      setReplyingToMessage(viewingMedia);
      closeMediaModal();
      inputRef.current?.focus();
    }
  };

  const forwardMedia = () => {
    if (viewingMedia) {
      alert('Funcionalidade de encaminhar ainda não implementada.');
      closeMediaModal();
    }
  };

  return {
    handleFileChange,
    enviarArquivoMidia,
    openMediaModal,
    closeMediaModal,
    downloadMedia,
    replyToMedia,
    forwardMedia,
  };
}