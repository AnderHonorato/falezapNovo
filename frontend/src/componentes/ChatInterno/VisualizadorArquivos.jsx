// frontend/src/componentes/chatInterno/VisualizadorArquivos.jsx

import { X, Download, FileText, Music } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default function VisualizadorArquivos({ arquivo, onClose }) {
  if (!arquivo) return null;

  const tipo = arquivo.tipo.split('/')[0];
  const urlArquivo = `${API_URL}/${arquivo.caminho}`;

  const renderConteudo = () => {
    switch (tipo) {
      case 'image':
        return (
          <img
            src={urlArquivo}
            alt={arquivo.nomeOriginal}
            className="max-w-full max-h-[80vh] object-contain rounded-[16px]"
          />
        );
      case 'video':
        return (
          <video
            src={urlArquivo}
            controls
            autoPlay
            className="max-w-full max-h-[80vh] object-contain rounded-[16px]"
          >
            Seu navegador não suporta este vídeo.
          </video>
        );
      case 'audio':
        return (
          <div className="p-8 bg-surface-container rounded-[16px]">
            <Music className="w-24 h-24 text-on-surface mx-auto mb-4" />
            <p className="text-on-surface text-center mb-4">{arquivo.nomeOriginal}</p>
            <audio
              src={urlArquivo}
              controls
              autoPlay
              className="w-full"
            >
              Seu navegador não suporta este áudio.
            </audio>
          </div>
        );
      default:
        return (
          <div className="p-12 bg-surface-container rounded-[16px] flex flex-col items-center">
            <FileText className="w-24 h-24 text-on-surface mb-4" />
            <p className="text-on-surface text-center text-lg mb-2">{arquivo.nomeOriginal}</p>
            <p className="text-on-surface-variant text-sm mb-6">Não é possível pré-visualizar este arquivo.</p>
            <a
              href={urlArquivo}
              download={arquivo.nomeOriginal}
              className="px-6 py-3 bg-primary text-on-primary rounded-full font-semibold hover:shadow-elevation-1 transition-all flex items-center gap-2"
            >
              <Download className="w-5 h-5" />
              Baixar Arquivo
            </a>
          </div>
        );
    }
  };

  return (
    <div
      className="fixed inset-0 bg-scrim/80 flex items-center justify-center z-50 p-4 animate-fadeIn"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 w-12 h-12 bg-surface-container/80 hover:bg-surface-container rounded-full flex items-center justify-center transition-all z-10 backdrop-blur-sm"
      >
        <X className="w-7 h-7 text-on-surface" />
      </button>

      <div className="relative" onClick={(e) => e.stopPropagation()}>
        {renderConteudo()}
      </div>

      {(tipo === 'image' || tipo === 'video' || tipo === 'audio') && (
        <a 
          href={urlArquivo}
          download={arquivo.nomeOriginal}
          className="absolute bottom-6 right-6 px-5 py-3 bg-surface-container text-on-surface rounded-full font-semibold hover:bg-surface-variant transition-all flex items-center gap-2 shadow-elevation-2"
        >
          <Download className="w-4 h-4" />
          Baixar
        </a>
      )}
      
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
      `}</style>
    </div>
  );
}
