// src/componentes/mensagens/BlocoReacoes.jsx

import React, { useState } from 'react';
import { Plus, Users } from 'lucide-react';
// Caminho relativo correto
import './css/BlocoReacoes.css'; 
import { useTema } from '../../contextos/TemaContexto'; // 1. Importar o hook

// 2. Remover 'tema' das props
export default function BlocoReacoes({ reacoes = [], onClickReacao, usuarioAtualId }) {
  const [tooltipVisivel, setTooltipVisivel] = useState(null);
  // 3. Usar o hook (pegar 'tema' para as cores e 'temaEscuro' para o booleano)
  const { tema, temaEscuro } = useTema();

  if (!reacoes || reacoes.length === 0) return null;

  // Agrupa reações por emoji (lógica mantida)
  const reacoesAgrupadas = reacoes.reduce((acc, reacao) => {
    const emoji = reacao.emoji || reacao.reacao;
    if (!acc[emoji]) {
      acc[emoji] = { 
        emoji, 
        count: 0, 
        usuarios: [],
        euReagi: false
      };
    }
    acc[emoji].count++;
    const nomeUsuario = reacao.usuario || reacao.nomeUsuario || 'Usuário';
    acc[emoji].usuarios.push(nomeUsuario);
    
    if (reacao.usuarioId === usuarioAtualId || reacao.usuario_id === usuarioAtualId) {
      acc[emoji].euReagi = true;
    }
    
    return acc;
  }, {});

  const arrayReacoes = Object.values(reacoesAgrupadas);

  return (
    // 4. Corrigir a checagem do tema
    <div className={`bloco-reacoes-container ${!temaEscuro ? 'light-theme' : ''}`}>
      {arrayReacoes.map((reacao, index) => (
        <div
          key={index}
          className="reacao-grupo-wrapper"
          onMouseEnter={() => setTooltipVisivel(index)}
          onMouseLeave={() => setTooltipVisivel(null)}
        >
          <button
            onClick={(e) => { 
              e.stopPropagation(); 
              onClickReacao?.(reacao.emoji); 
            }}
            className={`reacao-grupo ${reacao.euReagi ? 'eu-reagi' : ''}`}
            style={{
              // 5. 'tema' agora vem do hook e está sempre correto
              borderColor: reacao.euReagi ? tema.verde : tema.borda,
              '--reacao-cor': reacao.euReagi ? tema.verde : tema.texto,
            }}
            title={reacao.usuarios.join(', ')}
          >
            {/* Emoji */}
            <span className="reacao-emoji">
              {reacao.emoji}
            </span>
            
            {/* Contador */}
            {reacao.count > 1 && (
              <span 
                className="reacao-contador"
                style={{ color: reacao.euReagi ? tema.verde : tema.texto }}
              >
                {reacao.count > 99 ? '99+' : reacao.count}
              </span>
            )}

            {/* Indicador de múltiplos usuários */}
            {reacao.count > 1 && (
              <Users 
                className="reacao-multi-user"
                style={{ color: reacao.euReagi ? tema.verde : tema.textoSecundario }} 
              />
            )}
          </button>

          {/* Tooltip com lista de usuários */}
          {tooltipVisivel === index && reacao.usuarios.length > 0 && (
            <div 
              className="reacao-tooltip"
              style={{
                backgroundColor: tema.fundo,
                borderColor: tema.borda,
              }}
            >
              <div className="tooltip-header" style={{ color: tema.texto }}>
                {reacao.emoji} {reacao.count} {reacao.count === 1 ? 'reação' : 'reações'}
              </div>
              <div className="tooltip-lista-usuarios" style={{ color: tema.textoSecundario }}>
                {reacao.usuarios.slice(0, 5).map((usuario, idx) => (
                  <div key={idx} className="tooltip-usuario">
                    <div 
                      className="tooltip-usuario-dot"
                      style={{ backgroundColor: tema.verde }}
                    />
                    {usuario}
                  </div>
                ))}
                {reacao.usuarios.length > 5 && (
                  <div className="tooltip-mais-usuarios" style={{ color: tema.verde }}>
                    <Plus className="tooltip-mais-usuarios-icon" />
                    mais {reacao.usuarios.length - 5}
                  </div>
                )}
              </div>
              
              {/* Seta do tooltip */}
              <div 
                className="tooltip-seta"
                style={{ borderTopColor: tema.borda }}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}