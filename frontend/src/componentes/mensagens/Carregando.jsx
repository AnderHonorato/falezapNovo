// src/componentes/mensagens/Carregando.jsx

import React from 'react';
import { Loader2, MessageCircle } from 'lucide-react';

export default function Carregando({ tema, mensagem = "Carregando mensagens..." }) {
  return (
    <div className="flex flex-col justify-center items-center py-12 animate-fadeIn">
      {/* Container com gradiente */}
      <div 
        className="relative p-8 rounded-3xl shadow-lg border"
        style={{
          backgroundColor: tema?.fundo || '#ffffff',
          borderColor: tema?.borda || '#e5e7eb'
        }}
      >
        {/* Efeito de brilho de fundo */}
        <div 
          className="absolute inset-0 rounded-3xl opacity-20 animate-pulse-slow"
          style={{
            background: `radial-gradient(circle at center, ${tema?.verde || '#10b981'} 0%, transparent 70%)`
          }}
        />

        {/* Ícone principal girando */}
        <div className="relative flex flex-col items-center gap-4">
          <div 
            className="relative w-16 h-16 rounded-2xl flex items-center justify-center shadow-md"
            style={{ backgroundColor: `${tema?.verde || '#10b981'}15` }}
          >
            <Loader2 
              className="w-8 h-8 animate-spin" 
              style={{ color: tema?.verde || '#10b981' }} 
            />
            
            {/* Ícone de mensagem no fundo */}
            <div className="absolute inset-0 flex items-center justify-center opacity-20">
              <MessageCircle className="w-10 h-10" style={{ color: tema?.verde || '#10b981' }} />
            </div>
          </div>

          {/* Texto de carregamento */}
          <div className="text-center">
            <p 
              className="text-sm font-semibold mb-1" 
              style={{ color: tema?.texto || '#1f2937' }}
            >
              {mensagem}
            </p>
            <p 
              className="text-xs font-medium animate-pulse" 
              style={{ color: tema?.textoSecundario || '#6b7280' }}
            >
              Aguarde um momento
            </p>
          </div>

          {/* Animação de pontos */}
          <div className="flex gap-2">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-2 h-2 rounded-full dot-bounce"
                style={{ 
                  backgroundColor: tema?.verde || '#10b981',
                  animationDelay: `${i * 0.15}s`
                }}
              />
            ))}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes pulse-slow {
          0%, 100% {
            opacity: 0.2;
          }
          50% {
            opacity: 0.4;
          }
        }

        @keyframes dot-bounce {
          0%, 80%, 100% {
            transform: translateY(0);
            opacity: 0.5;
          }
          40% {
            transform: translateY(-8px);
            opacity: 1;
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }

        .animate-pulse-slow {
          animation: pulse-slow 2s ease-in-out infinite;
        }

        .dot-bounce {
          animation: dot-bounce 1.4s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}