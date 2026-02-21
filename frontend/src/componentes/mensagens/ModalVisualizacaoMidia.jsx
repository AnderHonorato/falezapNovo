// src/componentes/mensagens/ModalVisualizacaoMidia.jsx - ATUALIZADO MD3

import React, { useState, useEffect } from 'react';
import { X, Download, CornerDownRight, Share2, ZoomIn, ZoomOut, RotateCw, Music } from 'lucide-react'; // Adicionado Music

export default function ModalVisualizacaoMidia({ midia, isOpen, onClose, onReply, onDownload, onForward, tema }) {
  const [zoom, setZoom] = useState(1);
  const [rotacao, setRotacao] = useState(0);

  // Reseta zoom e rotação quando o modal abre ou a mídia muda
  useEffect(() => {
    if (isOpen) {
      setZoom(1);
      setRotacao(0);
    }
  }, [isOpen, midia]);

  if (!isOpen || !midia) return null;

  const handleZoomIn = (e) => { e.stopPropagation(); setZoom(prev => Math.min(prev + 0.25, 3)); };
  const handleZoomOut = (e) => { e.stopPropagation(); setZoom(prev => Math.max(prev - 0.25, 0.5)); };
  const handleRotate = (e) => { e.stopPropagation(); setRotacao(prev => (prev + 90) % 360); };
  const handleDownloadClick = (e) => { e.stopPropagation(); onDownload?.(); };
  const handleReplyClick = (e) => { e.stopPropagation(); onReply?.(); onClose(); }; // Fecha ao responder
  const handleForwardClick = (e) => { e.stopPropagation(); onForward?.(); onClose(); }; // Fecha ao encaminhar

  const renderMidia = () => {
    const urlMidia = midia.midiaUrl || midia.mediaUrl;
    const isImage = midia.tipo === 'imagem';
    const isVideo = midia.tipo === 'video';
    const isAudio = midia.tipo === 'audio';

    if (isImage) {
      return (
        <img
          src={urlMidia}
          alt={midia.legendaImagem || 'Imagem'}
          className="max-h-full max-w-full object-contain transition-transform duration-300 ease-in-out block" // Adicionado block
          style={{ transform: `scale(${zoom}) rotate(${rotacao}deg)` }}
        />
      );
    }

    if (isVideo) {
      return (
        <video
          src={urlMidia}
          controls autoPlay // Adicionado autoPlay
          className="max-h-full max-w-full rounded-lg block" // Adicionado block
          style={{ maxHeight: '85vh', maxWidth: '85vw' }} // Limites maiores
        />
      );
    }

    if (isAudio) {
      return (
        <div className="flex flex-col items-center gap-4 p-8 bg-surface-container rounded-[20px] shadow-elevation-1 border border-outline-variant"> {/* Estilo Card */}
          <div className="w-24 h-24 rounded-full flex items-center justify-center bg-primary-container"> {/* Fundo container */}
            <Music className="w-12 h-12 text-on-primary-container" /> {/* Ícone Música */}
          </div>
          <audio src={urlMidia} controls autoPlay className="w-full max-w-md mt-4" /> {/* Controles abaixo */}
        </div>
      );
    }

    // Fallback para tipos não suportados
    return (
      <div className="text-center p-8 bg-surface-container rounded-[20px] text-on-surface-variant">
        <p>Tipo de mídia não suportado para visualização</p>
      </div>
    );
  };

  const ehImagem = midia.tipo === 'imagem';

  // Aplica cores do tema às variáveis MD3
  const estiloTemaMD3 = {
      '--md3-primary': tema.verde,
      '--md3-primary-container': `${tema.verde}20`,
      '--md3-surface-container': tema.fundo,
      '--md3-surface-variant': tema.hover,
      '--md3-outline-variant': tema.borda,
      '--md3-on-surface': tema.texto,
      '--md3-on-surface-variant': tema.textoSecundario,
      '--md3-scrim': 'rgba(0, 0, 0, 0.85)', // Fundo mais escuro
      '--md3-inverse-surface': '#F0F0F0', // Fundo claro para botões
      '--md3-inverse-on-surface': '#333333', // Texto escuro para botões
  };


  // Classe base para botões do modal de mídia
  const mediaModalButtonClass = "md3-icon-button bg-inverse-surface/80 text-inverse-on-surface backdrop-blur-sm hover:bg-inverse-surface/95 shadow-elevation-1";

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center animate-fade-in" // z-index maior
      style={{ ...estiloTemaMD3, backgroundColor: 'var(--md3-scrim)' }}
      onClick={onClose} // Fecha ao clicar no fundo
    >
      {/* Botões Superiores (Zoom, Rotação, Download, Fechar) */}
      <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
        {ehImagem && (
          <>
            <button onClick={handleZoomOut} className={mediaModalButtonClass} title="Diminuir zoom"><ZoomOut className="w-5 h-5" /></button>
            <button onClick={handleZoomIn} className={mediaModalButtonClass} title="Aumentar zoom"><ZoomIn className="w-5 h-5" /></button>
            <button onClick={handleRotate} className={mediaModalButtonClass} title="Girar"><RotateCw className="w-5 h-5" /></button>
          </>
        )}
        <button onClick={handleDownloadClick} className={mediaModalButtonClass} title="Baixar"><Download className="w-5 h-5" /></button>
        <button onClick={onClose} className={`${mediaModalButtonClass} bg-error-container/80 text-on-error-container hover:bg-error-container/95`} title="Fechar"><X className="w-5 h-5" /></button> {/* Botão fechar destacado */}
      </div>

      {/* Botões Inferiores (Responder, Encaminhar) */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center gap-2 z-10">
        <button onClick={handleReplyClick} className={mediaModalButtonClass} title="Responder"><CornerDownRight className="w-5 h-5" /></button>
        <button onClick={handleForwardClick} className={mediaModalButtonClass} title="Encaminhar"><Share2 className="w-5 h-5" /></button>
      </div>

      {/* Conteúdo da Mídia */}
      <div
        className="relative flex items-center justify-center w-auto h-auto max-w-[90vw] max-h-[90vh] p-4 md:p-8" // Padding para não colar nas bordas
        onClick={(e) => e.stopPropagation()} // Impede que clique na mídia feche o modal
      >
        {renderMidia()}
      </div>

      {/* Legenda (se houver) */}
      {midia.legendaImagem && (
        <div
          className="absolute bottom-[calc(4rem+1rem)] left-1/2 transform -translate-x-1/2 max-w-xl w-fit px-4 py-2 rounded-full shadow-lg z-10" // Posicionado acima dos botões inferiores
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)', backdropFilter: 'blur(8px)', color: 'white' }}
        >
          <p className="text-sm text-center">{midia.legendaImagem}</p>
        </div>
      )}
    </div>
  );
}