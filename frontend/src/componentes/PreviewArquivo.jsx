// frontend/src/components/PreviewArquivo.jsx

import React, { useState, useEffect } from 'react';
import { FiX, FiFile, FiSend } from 'react-icons/fi';

const PreviewArquivo = ({ arquivo, tipo, onEnviar, onCancelar }) => {
  const [preview, setPreview] = useState(null);
  const [legenda, setLegenda] = useState('');
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (!arquivo) return;

    // Gerar preview para imagens e vídeos
    if (tipo === 'imagem' || tipo === 'video') {
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target.result);
      reader.readAsDataURL(arquivo);
    }

    return () => {
      if (preview) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [arquivo, tipo]);

  const handleEnviar = async () => {
    setEnviando(true);
    await onEnviar(arquivo, legenda);
    setEnviando(false);
  };

  const formatarTamanho = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-white">
            Preview do arquivo
          </h3>
          <button
            onClick={onCancelar}
            disabled={enviando}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors
                     disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FiX size={20} className="text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        {/* Preview */}
        <div className="flex-1 overflow-auto p-4 bg-gray-50 dark:bg-gray-900">
          {tipo === 'imagem' && preview && (
            <img 
              src={preview} 
              alt="Preview" 
              className="max-w-full max-h-[60vh] mx-auto rounded-lg"
            />
          )}

          {tipo === 'video' && preview && (
            <video 
              src={preview} 
              controls 
              className="max-w-full max-h-[60vh] mx-auto rounded-lg"
            />
          )}

          {tipo === 'audio' && (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="w-24 h-24 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FiFile size={40} className="text-white" />
                </div>
                <p className="text-gray-900 dark:text-white font-medium">
                  {arquivo.name}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {formatarTamanho(arquivo.size)}
                </p>
              </div>
            </div>
          )}

          {tipo === 'documento' && (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="w-24 h-24 bg-blue-500 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <FiFile size={40} className="text-white" />
                </div>
                <p className="text-gray-900 dark:text-white font-medium">
                  {arquivo.name}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {formatarTamanho(arquivo.size)}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Campo de legenda */}
        {(tipo === 'imagem' || tipo === 'video' || tipo === 'documento') && (
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <input
              type="text"
              placeholder="Adicionar legenda..."
              value={legenda}
              onChange={(e) => setLegenda(e.target.value)}
              disabled={enviando}
              className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg
                       text-gray-900 dark:text-white
                       focus:outline-none focus:ring-2 focus:ring-green-500
                       disabled:opacity-50 disabled:cursor-not-allowed"
              maxLength={1024}
            />
          </div>
        )}

        {/* Footer com botões */}
        <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onCancelar}
            disabled={enviando}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 
                     dark:hover:bg-gray-700 rounded-lg transition-colors
                     disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancelar
          </button>
          
          <button
            onClick={handleEnviar}
            disabled={enviando}
            className="px-6 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg
                     transition-colors flex items-center gap-2
                     disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {enviando ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Enviando...</span>
              </>
            ) : (
              <>
                <FiSend size={18} />
                <span>Enviar</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PreviewArquivo;