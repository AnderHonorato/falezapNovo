// src/componentes/mensagens/MenuReacao.jsx

import React, { useEffect, useRef, useState } from 'react';

// ✅ Emojis de reação rápida atualizados
const REACOES = ['❤️', '👍', '😂', '🔥', '🥰', '👏'];

export default function MenuReacao({ isOpen, posicao, onReact, onClose, tema }) {
  const menuRef = useRef(null);
  const [menuStyle, setMenuStyle] = useState({});

  useEffect(() => {
    if (isOpen && menuRef.current) {
      const menuRect = menuRef.current.getBoundingClientRect();
      const margin = 16;
      let newX = posicao.x;
      let newY = posicao.y;

      // Tenta posicionar acima do menu de contexto
      // A posição Y é passada já ajustada por MensagemItem.jsx
      // Vamos reajustar para ficar *acima* do menu de contexto (que está em posicao.y)
      newY = posicao.y - menuRect.height - margin;
      
      // Ajusta X
      if (posicao.x + menuRect.width > window.innerWidth - margin) {
        newX = window.innerWidth - menuRect.width - margin;
      }
      if (newX < margin) {
        newX = margin;
      }

      // Ajusta Y (fallback se não couber em cima)
      if (newY < margin) {
        newY = posicao.y + 40; // Posição de fallback (abaixo do clique)
      }
      
      setMenuStyle({ left: `${newX}px`, top: `${newY}px`, opacity: 1 });
    }
  }, [isOpen, posicao]);

  useEffect(() => {
    // Fechar é gerenciado pelo componente pai (MensagemItem)
    // para fechar ambos os menus
    const handleEscape = (event) => { 
      if (event.key === 'Escape') onClose(); 
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  const handleReacao = (emoji) => {
    onReact(emoji);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        ref={menuRef}
        className="fixed z-[1001] flex items-center gap-1.5 p-2 rounded-full shadow-2xl border-2 animate-scale-in"
        style={{
          ...menuStyle,
          backgroundColor: tema.fundo,
          borderColor: tema.borda,
          transition: 'opacity 0.15s ease-out, transform 0.15s ease-out, top 0.15s ease-out, left 0.15s ease-out'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {REACOES.map((emoji) => (
          <button
            key={emoji}
            onClick={() => handleReacao(emoji)}
            className="w-10 h-10 rounded-xl text-2xl transition-all duration-200 flex items-center justify-center emoji-reaction-btn"
            style={{ 
              backgroundColor: tema.hover
            }}
            title={`Reagir com ${emoji}`}
          >
            {emoji}
          </button>
        ))}
      </div>

      <style jsx>{`
        @keyframes scale-in {
          from { opacity: 0; transform: scale(0.8); }
          to { opacity: 1; transform: scale(1); }
        }
        
        @keyframes emoji-bounce {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.3); }
        }

        .animate-scale-in {
          animation: scale-in 0.15s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .emoji-reaction-btn:hover {
          animation: emoji-bounce 0.3s ease-in-out;
          transform: scale(1.3);
          background-color: ${tema.verde}20;
        }

        .emoji-reaction-btn:active {
          transform: scale(1.1);
        }
      `}</style>
    </>
  );
}