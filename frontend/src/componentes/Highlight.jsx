// frontend/src/componentes/Highlight.jsx - ✅ COMPONENTE DE DESTAQUE DE BUSCA

import React from 'react';

export default function Highlight({ text, highlight }) {
  // Se não tem texto ou highlight, retorna o texto normal
  if (!text) return null;
  if (!highlight || !highlight.trim()) return <>{text}</>;

  try {
    // Divide o texto pelo termo de busca (case-insensitive)
    const parts = text.split(new RegExp(`(${highlight})`, 'gi'));
    
    return (
      <>
        {parts.map((part, index) => 
          part.toLowerCase() === highlight.toLowerCase() ? (
            <mark key={index}>{part}</mark>
          ) : (
            <span key={index}>{part}</span>
          )
        )}
      </>
    );
  } catch (error) {
    console.error('Erro no Highlight:', error);
    return <>{text}</>;
  }
}