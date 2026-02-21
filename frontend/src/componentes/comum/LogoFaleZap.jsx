// frontend/src/componentes/comum/LogoFaleZap.jsx

import React from 'react';
import { MessageCircle, Zap } from 'lucide-react';

export default function LogoFaleZap({ tamanho = 'md', comTexto = true, className = '' }) {
  const tamanhos = {
    sm: { container: 'w-8 h-8', icone: 16, texto: 'text-sm' },
    md: { container: 'w-10 h-10', icone: 20, texto: 'text-base' },
    lg: { container: 'w-12 h-12', icone: 24, texto: 'text-lg' },
    xl: { container: 'w-16 h-16', icone: 32, texto: 'text-xl' },
  };

  const config = tamanhos[tamanho] || tamanhos.md;

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Logo */}
      <div className="relative">
        {/* Círculo externo com gradiente */}
        <div
          className={`${config.container} rounded-2xl flex items-center justify-center relative overflow-hidden shadow-lg`}
          style={{
            background: 'linear-gradient(135deg, #00d95f 0%, #00b84d 50%, #00a844 100%)',
          }}
        >
          {/* Efeito de brilho */}
          <div
            className="absolute inset-0 opacity-30"
            style={{
              background:
                'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.8) 0%, transparent 60%)',
            }}
          />

          {/* Ícones sobrepostos */}
          <div className="relative flex items-center justify-center">
            <MessageCircle
              size={config.icone}
              className="text-white absolute"
              strokeWidth={2.5}
              style={{ transform: 'translateX(-2px)' }}
            />
            <Zap
              size={config.icone * 0.6}
              className="text-yellow-300 relative z-10 drop-shadow-lg"
              strokeWidth={3}
              fill="currentColor"
              style={{ transform: 'translateX(4px) translateY(2px)' }}
            />
          </div>

          {/* Borda interna brilhante */}
          <div
            className="absolute inset-0 rounded-2xl"
            style={{
              border: '2px solid rgba(255,255,255,0.3)',
            }}
          />
        </div>

        {/* Efeito de pulsação sutil */}
        <div
          className={`${config.container} rounded-2xl absolute inset-0 animate-ping opacity-20`}
          style={{
            background: 'linear-gradient(135deg, #00d95f 0%, #00a844 100%)',
            animationDuration: '3s',
          }}
        />
      </div>

      {/* Texto */}
      {comTexto && (
        <div className="flex flex-col">
          <h1
            className={`${config.texto} font-bold leading-none`}
            style={{
              background: 'linear-gradient(135deg, #00d95f 0%, #00a844 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            FaleZap
          </h1>
          {tamanho !== 'sm' && (
            <p className="text-xs text-gray-500 leading-none mt-0.5">
              Mensagens Inteligentes
            </p>
          )}
        </div>
      )}
    </div>
  );
}