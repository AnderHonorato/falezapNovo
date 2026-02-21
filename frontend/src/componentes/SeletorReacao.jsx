// frontend/src/components/SeletorReacao.jsx

import React, { useRef, useEffect } from 'react';
import { FiPlus } from 'react-icons/fi';
import './mensagens/css/SeletorReacao.css'; // Importa o novo CSS
import { useTema } from '../contextos/TemaContexto'; // 1. Importar o hook

const SeletorReacao = ({ onSelecionar, onFechar, onMaisEmojis }) => { // 2. Remover 'tema' das props
  const containerRef = useRef(null);
  const { temaEscuro } = useTema(); // 3. Usar o hook para obter o booleano

  // Fechar ao clicar fora
  useEffect(() => {
    const handleClickFora = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        onFechar();
      }
    };

    document.addEventListener('mousedown', handleClickFora);
    return () => document.removeEventListener('mousedown', handleClickFora);
  }, [onFechar]);

  // Reações mais comuns
  const reacoesComuns = [
    '👍', '❤️', '😂', '😮', '😢', '🙏', '👏', '🔥'
  ];

  return (
    <div
      ref={containerRef}
      // 4. A lógica agora funciona com o booleano correto
      className={`seletor-reacao-container ${!temaEscuro ? 'light-theme' : ''}`}
    >
      {reacoesComuns.map((emoji, index) => (
        <button
          key={index}
          onClick={() => onSelecionar(emoji)}
          className="reacao-btn reacao-btn-emoji"
          title={`Reagir com ${emoji}`}
        >
          {emoji}
        </button>
      ))}

      {onMaisEmojis && (
        <>
          <div className="reacao-divider" />
          <button
            onClick={onMaisEmojis}
            className="reacao-btn reacao-btn-mais"
            title="Mais emojis"
          >
            <FiPlus size={22} />
          </button>
        </>
      )}
    </div>
  );
};

export default SeletorReacao;