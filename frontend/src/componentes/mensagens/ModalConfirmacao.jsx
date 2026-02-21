// src/componentes/mensagens/ModalConfirmacao.jsx

import React from 'react';
import { AlertTriangle, X, Info, CheckCircle } from 'lucide-react';

export default function ModalConfirmacao({
  isOpen,
  titulo = 'Confirmar ação',
  mensagem = 'Tem certeza que deseja continuar?',
  textoBotaoConfirmar = 'Confirmar',
  textoBotaoCancelar = 'Cancelar',
  tipo = 'warning', // 'warning' | 'danger' | 'info' | 'success'
  onConfirmar,
  onCancelar,
  tema
}) {
  if (!isOpen) return null;

  const configTipo = {
    warning: { cor: '#f59e0b', corBg: 'rgba(245, 158, 11, 0.1)', icone: AlertTriangle },
    danger: { cor: '#ef4444', corBg: 'rgba(239, 68, 68, 0.1)', icone: AlertTriangle },
    info: { cor: tema.verde, corBg: `${tema.verde}15`, icone: Info },
    success: { cor: tema.verde, corBg: `${tema.verde}15`, icone: CheckCircle }
  };

  const config = configTipo[tipo] || configTipo.warning;
  const Icone = config.icone;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-[110] animate-fade-in backdrop-blur-sm"
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
        onClick={onCancelar}
      />

      {/* Modal */}
      <div
        className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[111] w-full max-w-md rounded-3xl shadow-2xl animate-scale-in border-2 overflow-hidden"
        style={{ 
          backgroundColor: tema.fundo,
          borderColor: tema.borda
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Ícone no Topo */}
        <div className="pt-8 px-6 flex justify-center">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg"
            style={{ backgroundColor: config.corBg }}
          >
            <Icone className="w-8 h-8" style={{ color: config.cor }} />
          </div>
        </div>

        {/* Título */}
        <div className="pt-5 px-6 text-center">
          <h2 className="font-bold text-2xl" style={{ color: tema.texto }}>
            {titulo}
          </h2>
        </div>

        {/* Conteúdo */}
        <div className="pt-4 px-6 pb-6">
          <p className="text-sm leading-relaxed text-center font-medium" style={{ color: tema.textoSecundario }}>
            {mensagem}
          </p>
        </div>

        {/* Botões */}
        <div
          className="flex gap-3 p-6 justify-end border-t"
          style={{ borderColor: tema.borda }}
        >
          <button
            onClick={onCancelar}
            className="px-6 py-3 rounded-xl font-bold text-sm transition-all duration-300 hover:scale-105"
            style={{ 
              backgroundColor: tema.hover,
              color: tema.textoSecundario 
            }}
          >
            {textoBotaoCancelar}
          </button>
          <button
            onClick={() => { onConfirmar(); onCancelar(); }}
            className="px-6 py-3 rounded-xl font-bold text-sm text-white transition-all duration-300 hover:scale-105 shadow-lg"
            style={{ backgroundColor: config.cor }}
          >
            {textoBotaoConfirmar}
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scale-in {
          from { opacity: 0; transform: translate(-50%, -50%) scale(0.9); }
          to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        }
        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }
        .animate-scale-in {
          animation: scale-in 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
      `}</style>
    </>
  );
}