// src/componentes/mensagens/StatusMensagem.jsx

import React from 'react';
import { Loader2, Check, CheckCheck, AlertCircle } from 'lucide-react';

export default function StatusMensagem({ status, tema }) {
  const getStatus = () => {
    // Garante que o status seja uma string e em maiúsculas para unificar a lógica
    const statusNormalizado = String(status || '').toUpperCase();

    switch(statusNormalizado) {
      case 'ENVIANDO':
      case 'PENDING':
        return {
          icon: <Loader2 className="w-4 h-4 animate-spin" />, // 'animate-spin' é do Tailwind
          color: tema.textoSecundario,
          label: 'Enviando'
        };
      case 'SENT':
      case 'ENVIADA':
        return {
          icon: <Check className="w-4 h-4" />,
          color: tema.textoSecundario,
          label: 'Enviada'
        };
      case 'DELIVERED':
      case 'ENTREGUE':
        return {
          icon: <CheckCheck className="w-4 h-4" />,
          color: tema.textoSecundario,
          label: 'Entregue'
        };
      case 'READ':
      case 'LIDA':
        return {
          // ✅ Usa a animação customizada 'animate-pulse-subtle'
          icon: <CheckCheck className="w-4 h-4 animate-pulse-subtle" />, 
          color: tema.verde,
          label: 'Lida'
        };
      case 'ERRO':
      case 'ERROR':
        return {
          icon: <AlertCircle className="w-4 h-4" />,
          color: '#ef4444', // Vermelho (tailwind red-500)
          label: 'Erro ao enviar'
        };
      default:
        // Não retorna nada se o status for nulo, indefinido ou não reconhecido
        return null; 
    }
  };

  const statusInfo = getStatus();
  if (!statusInfo) return null;

  return (
    <div  
      className="inline-flex items-center gap-1 transition-all duration-300"
      style={{ color: statusInfo.color }}
      title={statusInfo.label} // Tooltip para acessibilidade
    >
      {statusInfo.icon}
    </div>
  );
}


// --- ✅ LÓGICA DE ESTILOS ADICIONADA ---
// Injeta as animações customizadas que não fazem parte do Tailwind

const styles = `
  /* Animação para o status 'LIDA' */
  @keyframes pulse-subtle {
    0%, 100% {
      opacity: 1;
      filter: drop-shadow(0 0 1px currentColor);
    }
    50% {
      opacity: 0.8;
      filter: drop-shadow(0 0 3px currentColor);
    }
  }

  .animate-pulse-subtle {
    animation: pulse-subtle 1.5s ease-in-out infinite;
  }
`;

// Adiciona estilos ao <head> do documento
if (typeof document !== 'undefined') {
  const styleTagId = 'falezap-status-mensagem-styles';
  if (!document.getElementById(styleTagId)) {
    const styleSheet = document.createElement("style");
    styleSheet.id = styleTagId;
    styleSheet.innerText = styles;
    document.head.appendChild(styleSheet);
  }
}