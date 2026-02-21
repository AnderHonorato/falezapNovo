// frontend/src/componentes/mensagens/ModalMidia.jsx
// ✅ CORRIGIDO - z-index aumentado e tamanho reduzido

import React, { useState, useEffect } from 'react';
import { X, Send, Image, Video, FileText, Headphones } from 'lucide-react';

export default function ModalMidia({ arquivo, legenda, setLegenda, onEnviar, onCancelar, tema }) {
  const [visualizacao, setVisualizacao] = useState(null);

  useEffect(() => {
    let objectUrl = null;
    if (arquivo) {
      objectUrl = URL.createObjectURL(arquivo);
      setVisualizacao(objectUrl);
    } else {
      setVisualizacao(null);
    }
    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [arquivo]);

  if (!arquivo || !visualizacao) return null;

  const tipoArquivo = arquivo.type.split('/')[0];
  const nomeArquivo = arquivo.name;
  const tamanhoKB = (arquivo.size / 1024).toFixed(1);

  const renderPreview = () => {
    if (tipoArquivo === 'image') {
      return (
        <img 
          src={visualizacao} 
          alt="Preview" 
          className="max-h-[55vh] max-w-full object-contain rounded-2xl block shadow-2xl" // ✅ MUDANÇA (Altura Imagem)
        />
      );
    }
    if (tipoArquivo === 'video') {
      return (
        <video 
          src={visualizacao} 
          controls 
          autoPlay 
          className="max-h-[55vh] max-w-full rounded-2xl block shadow-2xl" // ✅ MUDANÇA (Altura Vídeo)
        />
      );
    }
    if (tipoArquivo === 'audio') {
      return (
        <div 
          className="flex flex-col items-center gap-4 p-8 rounded-3xl shadow-2xl border-2 w-full max-w-md"
          style={{ 
            backgroundColor: tema.hover,
            borderColor: tema.borda
          }}
        >
          <div 
            className="w-20 h-20 rounded-2xl flex items-center justify-center shadow-lg"
            style={{ backgroundColor: `${tema.verde}20` }}
          >
            <Headphones className="w-10 h-10" style={{ color: tema.verde }} />
          </div>
          <p className="text-sm font-bold text-center truncate w-full" style={{ color: tema.texto }} title={nomeArquivo}>
            {nomeArquivo}
          </p>
          <audio src={visualizacao} controls autoPlay className="w-full mt-2" />
          <p className="text-xs font-semibold" style={{ color: tema.textoSecundario }}>
            {tamanhoKB} KB
          </p>
        </div>
      );
    }
    return (
      <div 
        className="flex flex-col items-center gap-4 p-8 rounded-3xl shadow-2xl border-2 w-full max-w-md"
        style={{ 
          backgroundColor: tema.hover,
          borderColor: tema.borda
        }}
      >
        <div 
          className="w-20 h-20 rounded-2xl flex items-center justify-center shadow-lg"
          style={{ backgroundColor: `${tema.verde}20` }}
        >
          <FileText className="w-10 h-10" style={{ color: tema.verde }} />
        </div>
        <p className="text-sm font-bold text-center truncate w-full" style={{ color: tema.texto }} title={nomeArquivo}>
          {nomeArquivo}
        </p>
        <p className="text-xs font-semibold" style={{ color: tema.textoSecundario }}>
          {tamanhoKB} KB
        </p>
      </div>
    );
  };

  return (
    <div
      className="fixed inset-0 z-[1050] flex items-center justify-center p-4 animate-fade-in" // ✅ MUDANÇA (z-index)
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.85)' }}
      onClick={onCancelar}
    >
      {/* Container do Modal */}
      <div
        className="relative flex flex-col max-w-xl w-full mx-auto rounded-3xl overflow-hidden shadow-2xl animate-scale-in border-2" // ✅ MUDANÇA (Largura)
        style={{
          backgroundColor: tema.fundo,
          borderColor: tema.borda,
          maxHeight: '80vh' // ✅ MUDANÇA (Altura Modal)
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabeçalho */}
        <div
          className="flex items-center justify-between px-6 py-5 border-b flex-shrink-0"
          style={{ 
            background: `linear-gradient(135deg, ${tema.verde}15 0%, ${tema.verde}05 100%)`,
            borderColor: tema.borda 
          }}
        >
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div 
              className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-md"
              style={{ backgroundColor: `${tema.verde}20` }}
            >
              {tipoArquivo === 'image' && <Image className="w-6 h-6" style={{ color: tema.verde }} />}
              {tipoArquivo === 'video' && <Video className="w-6 h-6" style={{ color: tema.verde }} />}
              {tipoArquivo === 'audio' && <Headphones className="w-6 h-6" style={{ color: tema.verde }} />}
              {tipoArquivo !== 'image' && tipoArquivo !== 'video' && tipoArquivo !== 'audio' && (
                <FileText className="w-6 h-6" style={{ color: tema.verde }} />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-lg truncate" style={{ color: tema.texto }}>
                Enviar arquivo
              </h3>
              <p className="text-xs truncate font-medium" style={{ color: tema.textoSecundario }} title={nomeArquivo}>
                {nomeArquivo} ({tamanhoKB} KB)
              </p>
            </div>
          </div>

          <button 
            onClick={onCancelar}
            className="w-10 h-10 rounded-xl transition-all duration-300 hover:scale-105 flex items-center justify-center ml-3"
            style={{ 
              backgroundColor: tema.hover,
              color: tema.textoSecundario 
            }}
            title="Cancelar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Preview */}
        <div
          className="flex-1 flex items-center justify-center p-6 overflow-auto custom-scrollbar"
          style={{ backgroundColor: tema.bg }}
        >
          {renderPreview()}
        </div>

        {/* Campo de Legenda e Envio */}
        <div 
          className="p-5 border-t flex-shrink-0"
          style={{ borderColor: tema.borda }}
        >
          <div className="flex gap-3 items-center">
            <input
              type="text"
              placeholder="Adicionar legenda... (opcional)"
              value={legenda}
              onChange={(e) => setLegenda(e.target.value)}
              className="flex-1 px-4 py-3 rounded-xl text-sm font-medium focus:outline-none transition-all duration-200 border-2"
              style={{
                backgroundColor: tema.input,
                color: tema.texto,
                borderColor: tema.borda
              }}
              onFocus={(e) => e.target.style.borderColor = tema.verde}
              onBlur={(e) => e.target.style.borderColor = tema.borda}
              onKeyPress={(e) => { 
                if (e.key === 'Enter' && !e.shiftKey) { 
                  e.preventDefault(); 
                  onEnviar(); 
                } 
              }}
              autoFocus
            />

            <button
              onClick={onEnviar}
              className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-white transition-all duration-300 hover:scale-105 shadow-lg text-sm"
              style={{ backgroundColor: tema.verde }}
            >
              <Send className="w-4 h-4" />
              <span>Enviar</span>
            </button>
          </div>

          <p className="text-xs mt-3 font-medium" style={{ color: tema.textoSecundario }}>
            Shift+Enter para quebra de linha
          </p>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scale-in {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }
        .animate-scale-in {
          animation: scale-in 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: ${tema.borda};
          border-radius: 3px;
        }
      `}</style>
    </div>
  );
}