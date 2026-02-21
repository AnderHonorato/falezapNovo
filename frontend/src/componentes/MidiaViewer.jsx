// frontend/src/components/MidiaViewer.jsx

import React from 'react';
import { FiDownload, FiFile, FiPlay } from 'react-icons/fi';

const MidiaViewer = ({ mensagem, onClick }) => {
  const { tipo, mediaUrl, mediaThumbUrl, mediaNome, mediaSize, mediaDuracao } = mensagem;

  // Formatar tamanho do arquivo
  const formatarTamanho = (bytes) => {
    if (!bytes) return '';
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  // Formatar duração (segundos para MM:SS)
  const formatarDuracao = (segundos) => {
    if (!segundos) return '';
    const mins = Math.floor(segundos / 60);
    const secs = segundos % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Renderizar imagem
  if (tipo === 'IMAGEM') {
    return (
      <div
        className="relative cursor-pointer group max-w-sm"
        onClick={onClick}
      >
        <img
          src={mediaUrl}
          alt={mediaNome || 'Imagem'}
          className="rounded-lg w-full h-auto"
          loading="lazy"
        />

        {/* Overlay no hover */}
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 
                        transition-opacity rounded-lg flex items-center justify-center">

          {/* CORRIGIDO: Adicionada a tag <a> de abertura aqui */}
          <a
            href={mediaUrl}
            download={mediaNome}
            onClick={(e) => e.stopPropagation()} // Impede que o clique no download abra o modal
            className="p-3 bg-white/20 rounded-full hover:bg-white/30 transition-colors"
          >
            <FiDownload size={24} className="text-white" />
          </a>
        </div>

        {/* Legenda se houver */}
        {mensagem.legendaImagem && (
          <p className="text-sm mt-2 text-gray-700 dark:text-gray-300">
            {mensagem.legendaImagem}
          </p>
        )}
      </div>
    );
  }

  // Renderizar vídeo
  if (tipo === 'VIDEO') {
    return (
      <div className="relative max-w-sm">
        <div
          className="relative cursor-pointer group"
          onClick={onClick}
        >
          {mediaThumbUrl ? (
            <img
              src={mediaThumbUrl}
              alt="Video thumbnail"
              className="rounded-lg w-full h-auto"
            />
          ) : (
            <div className="bg-gray-800 rounded-lg w-full aspect-video flex items-center justify-center">
              <FiPlay size={48} className="text-white" />
            </div>
          )}

          {/* Ícone de play */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="p-4 bg-black/50 rounded-full">
              <FiPlay size={32} className="text-white" />
            </div>
          </div>

          {/* Duração */}
          {mediaDuracao && (
            <div className="absolute bottom-2 right-2 bg-black/70 px-2 py-1 rounded text-white text-xs">
              {formatarDuracao(mediaDuracao)}
            </div>
          )}
        </div>

        {/* Legenda se houver */}
        {mensagem.conteudo && (
          <p className="text-sm mt-2 text-gray-700 dark:text-gray-300">
            {mensagem.conteudo}
          </p>
        )}
      </div>
    );
  }

  // Renderizar áudio
  if (tipo === 'AUDIO') {
    return (
      <div className="flex items-center gap-3 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg max-w-sm">
        <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
          <FiPlay size={20} className="text-white" />
        </div>

        <div className="flex-1 min-w-0">
          <audio
            controls
            src={mediaUrl}
            className="w-full"
            controlsList="nodownload"
          />
          {mediaDuracao && (
            <p className="text-xs text-gray-500 mt-1">
              {formatarDuracao(mediaDuracao)}
            </p>
          )}
        </div>
      </div>
    );
  }

  // Renderizar documento
  if (tipo === 'DOCUMENTO') {
    return (
      <div className="max-w-sm">

        {/* CORRIGIDO: Adicionada a tag <a> de abertura aqui */}
        <a
          href={mediaUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 p-4 bg-gray-100 dark:bg-gray-700 rounded-lg 
                     hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
        >
          <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
            <FiFile size={24} className="text-white" />
          </div>

          <div className="flex-1 min-w-0">
            <p className="font-medium text-gray-900 dark:text-white truncate">
              {mediaNome || 'Documento'}
            </p>
            {mediaSize && (
              <p className="text-sm text-gray-500">
                {formatarTamanho(mediaSize)}
              </p>
            )}
          </div>

          <FiDownload size={20} className="text-gray-600 dark:text-gray-400 flex-shrink-0" />
        </a>

        {/* Legenda se houver */}
        {mensagem.conteudo && (
          <p className="text-sm mt-2 text-gray-700 dark:text-gray-300">
            {mensagem.conteudo}
          </p>
        )}
      </div>
    );
  }

  return null;
};

export default MidiaViewer;