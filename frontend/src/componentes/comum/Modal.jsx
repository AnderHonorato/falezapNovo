// frontend/src/componentes/comum/Modal.jsx

import React from 'react';
import { X, AlertTriangle, CheckCircle, Info, XCircle } from 'lucide-react';

export default function Modal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  titulo, 
  mensagem, 
  tipo = 'confirm', 
  textoBotaoConfirmar = 'Confirmar',
  textoBotaoCancelar = 'Cancelar',
  tema,
  children // ✅ Adicionado prop children
}) {
  if (!isOpen) return null;

  const temaAtual = tema || {
    sidebar: '#ffffff',
    bg: '#f0f2f5',
    hover: '#f5f6f6',
    borda: '#e9edef',
    texto: '#111b21',
    textoSecundario: '#667781',
    verde: '#00a884',
    verdeHover: '#06cf9c'
  };

  const icones = {
    confirm: <AlertTriangle className="w-6 h-6" style={{ color: '#f59e0b' }} />,
    warning: <AlertTriangle className="w-6 h-6" style={{ color: '#f59e0b' }} />,
    alert: <AlertTriangle className="w-6 h-6" style={{ color: '#ef4444' }} />,
    success: <CheckCircle className="w-6 h-6" style={{ color: '#10b981' }} />,
    error: <XCircle className="w-6 h-6" style={{ color: '#ef4444' }} />,
    info: <Info className="w-6 h-6" style={{ color: '#3b82f6' }} />
  };

  // Verifica se o modal é de layout/conteúdo (sem mensagem e sem onConfirm)
  const isContentModal = children && !mensagem && !onConfirm;

  return (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 animate-fade-in"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md rounded-2xl shadow-2xl animate-scale-in"
        style={{ backgroundColor: temaAtual.sidebar }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: temaAtual.borda }}>
          <div className="flex items-center gap-3">
            {icones[tipo]}
            <h3 className="text-lg font-semibold" style={{ color: temaAtual.texto }}>
              {titulo}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg transition-colors"
            style={{ color: temaAtual.textoSecundario }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = temaAtual.hover}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {children || ( // ✅ Se CHILDREN existe, renderiza CHILDREN primeiro
            typeof mensagem === 'string' ? (
              <p className="text-sm leading-relaxed" style={{ color: temaAtual.textoSecundario }}>
                {mensagem}
              </p>
            ) : (
              <div style={{ color: temaAtual.textoSecundario }}>
                {mensagem}
              </div>
            )
          )}
        </div>

        {/* Footer - Renderiza APENAS se não for um Modal de Conteúdo/Layout */}
        {!isContentModal && ( // ✅ Esconde o Footer se for um Modal de Conteúdo Customizado
          <div className="flex items-center justify-end gap-3 p-4 border-t" style={{ borderColor: temaAtual.borda }}>
            {(tipo === 'confirm' || tipo === 'warning') && (
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-lg font-medium transition-colors"
                style={{ 
                  color: temaAtual.texto,
                  backgroundColor: temaAtual.hover 
                }}
                onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
                onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
              >
                {textoBotaoCancelar}
              </button>
            )}
            <button
              onClick={() => {
                if (onConfirm) onConfirm();
                onClose();
              }}
              className="px-4 py-2 rounded-lg font-medium transition-colors text-white"
              style={{ 
                backgroundColor: tipo === 'error' || tipo === 'alert' ? '#ef4444' : 
                                  tipo === 'warning' ? '#f59e0b' : 
                                  temaAtual.verde 
              }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
              onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
            >
              {textoBotaoConfirmar}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}