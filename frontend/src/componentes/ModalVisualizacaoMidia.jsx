// frontend/src/components/ModalVisualizacaoMidia.jsx

import React, { useState } from 'react';
import { FiX, FiDownload, FiChevronLeft, FiChevronRight } from 'react-icons/fi';

const ModalVisualizacaoMidia = ({ mensagem, onFechar, onAnterior, onProxima }) => {
  const [loading, setLoading] = useState(true);

  if (!mensagem) return null;

  const { tipo, mediaUrl, mediaNome, mediaSize } = mensagem;

  const handleDownload = async () => {
    try {
      const response = await fetch(mediaUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = mediaNome || 'arquivo';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('❌ Erro ao baixar arquivo:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/95 z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-black/50">
        <div className="flex-1">
          <h3 className="text-white font-medium truncate">
            {mediaNome || 'Mídia'}
          </h3>
          <p className="text-gray-400 text-sm">
            {mensagem.enviadaEm && new Date(mensagem.enviadaEm).toLocaleString('pt-BR')}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Botão de download */}
          <button
            onClick={handleDownload}
            className="p-3 hover:bg-white/10 rounded-full transition-colors"
            title="Baixar"
          >
            <FiDownload size={20} className="text-white" />
          </button>

          {/* Botão de fechar */}
          <button
            onClick={onFechar}
            className="p-3 hover:bg-white/10 rounded-full transition-colors"
            title="Fechar"
          >
            <FiX size={24} className="text-white" />
          </button>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="flex-1 flex items-center justify-center relative p-4">
        {/* Botão anterior */}
        {onAnterior && (
          <button
            onClick={onAnterior}
            className="absolute left-4 p-3 bg-black/50 hover:bg-black/70 rounded-full 
                     transition-colors z-10"
          >
            <FiChevronLeft size={24} className="text-white" />
          </button>
        )}

        {/* Mídia */}
        <div className="max-w-full max-h-full flex items-center justify-center">
          {tipo === 'IMAGEM' && (
            <img
              src={mediaUrl}
              alt={mediaNome}
              className="max-w-full max-h-[calc(100vh-200px)] object-contain"
              onLoad={() => setLoading(false)}
            />
          )}

          {tipo === 'VIDEO' && (
            <video
              src={mediaUrl}
              controls
              autoPlay
              className="max-w-full max-h-[calc(100vh-200px)]"
              onLoadedData={() => setLoading(false)}
            />
          )}

          {tipo === 'AUDIO' && (
            <div className="bg-gray-800 p-8 rounded-lg">
              <div className="w-64 h-64 bg-gray-700 rounded-lg flex items-center justify-center mb-4">
                <FiDownload size={64} className="text-gray-500" />
              </div>
              <audio
                src={mediaUrl}
                controls
                autoPlay
                className="w-full"
                onLoadedData={() => setLoading(false)}
              />
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>

        {/* Botão próxima */}
        {onProxima && (
          <button
            onClick={onProxima}
            className="absolute right-4 p-3 bg-black/50 hover:bg-black/70 rounded-full 
                     transition-colors z-10"
          >
            <FiChevronRight size={24} className="text-white" />
          </button>
        )}
      </div>

      {/* Legenda/Info */}
      {(mensagem.legendaImagem || mensagem.conteudo) && (
        <div className="p-4 bg-black/50">
          <p className="text-white text-center">
            {mensagem.legendaImagem || mensagem.conteudo}
          </p>
        </div>
      )}
    </div>
  );
};

export default ModalVisualizacaoMidia;