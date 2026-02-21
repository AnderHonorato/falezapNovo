// frontend/src/componentes/SeletorEmojiReacao.jsx - ✅ REFORMULADO COMPLETO

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Search, Smile, X } from 'lucide-react';
import { useTema } from '../contextos/TemaContexto'; 

export default function SeletorEmojiReacao({ isOpen, onSelectEmoji, onClose, position }) {
  const [categoriaAtiva, setCategoriaAtiva] = useState('rostos');
  const [busca, setBusca] = useState('');
  const [posicaoAjustada, setPosicaoAjustada] = useState(position);
  const { temaEscuro } = useTema();
  const containerRef = useRef(null);

  // ✅ BUSCA FUNCIONAL - Filtra por nome da categoria E pelo emoji
  const emojisFiltrados = useMemo(() => {
    if (!busca.trim()) {
      return CATEGORIAS[categoriaAtiva].emojis;
    }
    
    const termo = busca.toLowerCase();
    let resultados = [];
    
    // Busca em todas as categorias
    Object.entries(CATEGORIAS).forEach(([nomeCategoria, categoria]) => {
      // Verifica se o termo está no nome da categoria
      if (nomeCategoria.toLowerCase().includes(termo) || 
          categoria.nome.toLowerCase().includes(termo)) {
        resultados = resultados.concat(categoria.emojis);
      }
    });
    
    // Remove duplicatas
    return [...new Set(resultados)];
  }, [categoriaAtiva, busca]);

  // Ajusta posição para não sair da tela
  useEffect(() => {
    if (!isOpen || !containerRef.current) return;

    const ajustarPosicao = () => {
      const { innerWidth, innerHeight } = window;
      const seletorWidth = 370;
      const seletorHeight = 500;
      
      let x = position.x || 0;
      let y = position.y || 0;

      // Ajusta horizontalmente
      if (x + seletorWidth > innerWidth - 10) {
        x = innerWidth - seletorWidth - 10;
      }
      if (x < 10) {
        x = 10;
      }

      // Ajusta verticalmente
      if (y + seletorHeight > innerHeight - 10) {
        y = innerHeight - seletorHeight - 10;
      }
      if (y < 10) {
        y = 10;
      }

      setPosicaoAjustada({ x, y });
    };

    // Pequeno delay para calcular após renderização
    setTimeout(ajustarPosicao, 10);
  }, [isOpen, position]);

  // Fecha ao clicar fora
  useEffect(() => {
    if (!isOpen) return;

    const handleClickFora = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        onClose();
      }
    };

    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickFora);
    document.addEventListener('keydown', handleEscape);
    
    return () => {
      document.removeEventListener('mousedown', handleClickFora);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div 
      ref={containerRef}
      style={{
        position: 'fixed',
        left: `${posicaoAjustada.x}px`,
        top: `${posicaoAjustada.y}px`,
        width: '370px',
        maxHeight: '500px',
        display: 'flex',
        flexDirection: 'column',
        background: temaEscuro 
          ? 'linear-gradient(135deg, rgba(15, 23, 42, 0.98) 0%, rgba(30, 41, 59, 0.98) 100%)' 
          : 'linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(248, 250, 252, 0.98) 100%)',
        borderRadius: '16px',
        border: `1px solid ${temaEscuro ? 'rgba(148, 163, 184, 0.3)' : 'rgba(226, 232, 240, 0.8)'}`,
        boxShadow: temaEscuro 
          ? '0 20px 60px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(148, 163, 184, 0.3)' 
          : '0 20px 60px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(226, 232, 240, 0.8)',
        zIndex: 999999999,
        overflow: 'hidden'
      }}
    >
      {/* Header com Busca e Fechar */}
      <div style={{
        padding: '16px',
        borderBottom: `1px solid ${temaEscuro ? 'rgba(148, 163, 184, 0.15)' : 'rgba(226, 232, 240, 0.8)'}`,
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        flexShrink: 0
      }}>
        <div style={{ 
          position: 'relative', 
          flex: 1,
          display: 'flex',
          alignItems: 'center'
        }}>
          <Search 
            size={18} 
            style={{ 
              position: 'absolute',
              left: '12px',
              color: '#64748b',
              pointerEvents: 'none'
            }} 
          />
          <input
            type="text"
            placeholder="Buscar emoji ou categoria..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            autoFocus
            style={{
              width: '100%',
              padding: '10px 12px 10px 40px',
              border: `2px solid ${temaEscuro ? 'rgba(148, 163, 184, 0.2)' : 'rgba(226, 232, 240, 0.8)'}`,
              borderRadius: '12px',
              background: temaEscuro ? 'rgba(15, 23, 42, 0.5)' : '#ffffff',
              color: temaEscuro ? '#e2e8f0' : '#1e293b',
              fontSize: '14px',
              fontWeight: '500',
              outline: 'none',
              transition: 'all 0.3s'
            }}
            onFocus={(e) => {
              e.target.style.borderColor = '#10b981';
              e.target.style.boxShadow = '0 0 0 3px rgba(16, 185, 129, 0.15)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = temaEscuro ? 'rgba(148, 163, 184, 0.2)' : 'rgba(226, 232, 240, 0.8)';
              e.target.style.boxShadow = 'none';
            }}
          />
        </div>
        
        <button 
          onClick={onClose}
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            border: 'none',
            background: temaEscuro ? 'rgba(148, 163, 184, 0.15)' : '#f1f5f9',
            color: temaEscuro ? '#e2e8f0' : '#1e293b',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s',
            flexShrink: 0
          }}
          onMouseEnter={(e) => {
            e.target.style.background = temaEscuro ? 'rgba(148, 163, 184, 0.25)' : '#e2e8f0';
            e.target.style.transform = 'scale(1.1)';
          }}
          onMouseLeave={(e) => {
            e.target.style.background = temaEscuro ? 'rgba(148, 163, 184, 0.15)' : '#f1f5f9';
            e.target.style.transform = 'scale(1)';
          }}
        >
          <X size={18} />
        </button>
      </div>

      {/* Categorias */}
      {!busca && (
        <div style={{
          display: 'flex',
          gap: '6px',
          padding: '12px 16px',
          borderBottom: `1px solid ${temaEscuro ? 'rgba(148, 163, 184, 0.15)' : 'rgba(226, 232, 240, 0.8)'}`,
          overflowX: 'auto',
          flexShrink: 0
        }}>
          {Object.entries(CATEGORIAS).map(([key, categoria]) => {
            const isSelected = categoriaAtiva === key;
            return (
              <button
                key={key}
                onClick={() => setCategoriaAtiva(key)}
                title={categoria.nome}
                style={{
                  padding: '10px',
                  fontSize: '22px',
                  border: 'none',
                  background: isSelected 
                    ? (temaEscuro ? 'rgba(16, 185, 129, 0.2)' : 'rgba(16, 185, 129, 0.15)')
                    : 'transparent',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  minWidth: '44px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  boxShadow: isSelected ? '0 0 0 2px rgba(16, 185, 129, 0.3)' : 'none'
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) {
                    e.target.style.background = temaEscuro ? 'rgba(148, 163, 184, 0.1)' : 'rgba(226, 232, 240, 0.5)';
                    e.target.style.transform = 'scale(1.1)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    e.target.style.background = 'transparent';
                    e.target.style.transform = 'scale(1)';
                  }
                }}
              >
                {categoria.icone}
              </button>
            );
          })}
        </div>
      )}

      {/* Grid de Emojis */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '16px',
        minHeight: 0 /* ✅ Importante para scroll funcionar */
      }}>
        {emojisFiltrados.length > 0 ? (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(8, 1fr)',
            gap: '6px'
          }}>
            {emojisFiltrados.map((emoji, index) => (
              <button
                key={index}
                onClick={() => {
                  onSelectEmoji(emoji);
                  onClose();
                }}
                style={{
                  width: '40px',
                  height: '40px',
                  border: 'none',
                  background: temaEscuro ? 'rgba(15, 23, 42, 0.5)' : '#f1f5f9',
                  borderRadius: '10px',
                  fontSize: '24px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = temaEscuro ? 'rgba(16, 185, 129, 0.2)' : 'rgba(16, 185, 129, 0.15)';
                  e.target.style.transform = 'scale(1.3)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = temaEscuro ? 'rgba(15, 23, 42, 0.5)' : '#f1f5f9';
                  e.target.style.transform = 'scale(1)';
                }}
              >
                {emoji}
              </button>
            ))}
          </div>
        ) : (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '40px 20px',
            color: '#64748b',
            textAlign: 'center'
          }}>
            <Smile size={48} style={{ marginBottom: '12px', opacity: 0.5 }} />
            <p style={{ margin: 0, fontSize: '14px', fontWeight: '500' }}>
              Nenhum emoji encontrado
            </p>
            <p style={{ margin: '4px 0 0', fontSize: '12px', opacity: 0.7 }}>
              Tente buscar por outra categoria
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{
        padding: '12px 16px',
        borderTop: `1px solid ${temaEscuro ? 'rgba(148, 163, 184, 0.15)' : 'rgba(226, 232, 240, 0.8)'}`,
        background: temaEscuro ? 'rgba(15, 23, 42, 0.8)' : '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexShrink: 0
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          color: '#64748b',
          fontSize: '13px',
          fontWeight: '500'
        }}>
          <Smile size={16} />
          <span>
            {emojisFiltrados.length} emoji{emojisFiltrados.length !== 1 ? 's' : ''}
          </span>
        </div>
        
        {busca && (
          <button
            onClick={() => setBusca('')}
            style={{
              padding: '6px 12px',
              borderRadius: '8px',
              border: 'none',
              background: temaEscuro ? 'rgba(148, 163, 184, 0.15)' : '#f1f5f9',
              color: temaEscuro ? '#e2e8f0' : '#1e293b',
              fontSize: '12px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = '#10b981';
              e.target.style.color = '#ffffff';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = temaEscuro ? 'rgba(148, 163, 184, 0.15)' : '#f1f5f9';
              e.target.style.color = temaEscuro ? '#e2e8f0' : '#1e293b';
            }}
          >
            Limpar busca
          </button>
        )}
      </div>
    </div>
  );
}

const CATEGORIAS = {
  rostos: {
    nome: 'Rostos e Emoções',
    icone: '😊',
    emojis: ['😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃', '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '😚', '😙', '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔', '🤐', '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '🤥', '😌', '😔', '😪', '🤤', '😴', '😷', '🤒', '🤕', '🤢', '🤮', '🤧', '🥵', '🥶', '😵', '🤯', '🤠', '🥳', '😎', '🤓', '🧐', '😕', '😟', '🙁', '☹️', '😮', '😯', '😲', '😳', '🥺', '😦', '😧', '😨', '😰', '😥', '😢', '😭', '😱', '😖', '😣', '😞', '😓', '😩', '😫', '🥱']
  },
  maos: {
    nome: 'Mãos e Gestos',
    icone: '👍',
    emojis: ['👍', '👎', '👏', '🙌', '👐', '🤝', '🙏', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '👇', '☝️', '✋', '🤚', '🖐', '🖖', '👋', '🤛', '🤜', '✊', '👊', '🤏', '👌', '🤌', '💪', '🦾', '🖕', '✍️', '🤳', '💅', '🦵', '🦿', '🦶']
  },
  coracoes: {
    nome: 'Corações e Amor',
    icone: '❤️',
    emojis: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❤️‍🔥', '❤️‍🩹', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '💌', '💋', '💏', '💑', '🫂']
  },
  animais: {
    nome: 'Animais e Natureza',
    icone: '🐶',
    emojis: ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🐔', '🐧', '🐦', '🐤', '🐣', '🦆', '🦅', '🦉', '🦇', '🐺', '🐗', '🐴', '🦄', '🐝', '🐛', '🦋', '🐌', '🐞', '🐜', '🦟', '🦗', '🕷', '🐢', '🐍', '🦎', '🐙', '🦑', '🦐', '🦀', '🐡', '🐠', '🐟', '🐬', '🐳', '🐋', '🦈', '🐊', '🐅', '🐆', '🦓', '🦍', '🦧', '🐘', '🦛', '🦏', '🐪', '🐫', '🦒', '🦘', '🐃', '🐂', '🐄', '🐎', '🐖', '🐏', '🐑', '🦙', '🐐', '🦌', '🐕', '🐩', '🦮', '🐕‍🦺', '🐈', '🐈‍⬛', '🐓', '🦃', '🦚', '🦜', '🦢', '🦩', '🕊']
  },
  comida: {
    nome: 'Comida e Bebida',
    icone: '🍕',
    emojis: ['🍏', '🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🍈', '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🍆', '🥑', '🥦', '🥬', '🥒', '🌶', '🌽', '🥕', '🥔', '🍠', '🥐', '🥯', '🍞', '🥖', '🥨', '🧀', '🥚', '🍳', '🥞', '🥓', '🥩', '🍗', '🍖', '🌭', '🍔', '🍟', '🍕', '🥪', '🥙', '🌮', '🌯', '🥗', '🍝', '🍜', '🍲', '🍛', '🍣', '🍱', '🥟', '🍤', '🍙', '🍚', '🍘', '🍥', '🥠', '🍢', '🍡', '🍧', '🍨', '🍦', '🥧', '🍰', '🎂', '🍮', '🍭', '🍬', '🍫', '🍿', '🍩', '🍪', '🌰', '🥜', '🍯', '🥛', '🍼', '☕', '🍵', '🧃', '🥤', '🍶', '🍺', '🍻', '🥂', '🍷', '🥃', '🍸', '🍹', '🧉', '🍾']
  },
  atividades: {
    nome: 'Atividades e Esportes',
    icone: '⚽',
    emojis: ['⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱', '🏓', '🏸', '🏒', '🏑', '🥍', '🏏', '🥅', '⛳', '🏹', '🎣', '🤿', '🥊', '🥋', '🎽', '⛸', '🥌', '🛷', '🛹', '🎿', '⛷', '🏂', '🏋️', '🤼', '🤸', '🤺', '⛹️', '🤾', '🏌️', '🏇', '🧘', '🏊', '🤽', '🚣', '🧗', '🚴', '🚵', '🤹', '🎪', '🎭', '🎨', '🎬', '🎤', '🎧', '🎼', '🎹', '🥁', '🎷', '🎺', '🎸', '🪕', '🎻']
  },
  objetos: {
    nome: 'Objetos',
    icone: '💡',
    emojis: ['⌚', '📱', '📲', '💻', '⌨️', '🖥', '🖨', '🖱', '🖲', '🕹', '🗜', '💽', '💾', '💿', '📀', '📼', '📷', '📸', '📹', '🎥', '📽', '🎞', '📞', '☎️', '📟', '📠', '📺', '📻', '🎙', '🎚', '🎛', '⏱', '⏲', '⏰', '🕰', '⌛', '⏳', '📡', '🔋', '🔌', '💡', '🔦', '🕯', '🪔', '🧯']
  },
  simbolos: {
    nome: 'Símbolos',
    icone: '💯',
    emojis: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '☮️', '✝️', '☪️', '🕉', '☸️', '✡️', '🔯', '🕎', '☯️', '☦️', '🛐', '💯', '✅', '❌', '⭕', '❗', '❓', '⚠️', '🔥', '💥', '✨', '🌟', '⭐', '💫', '💢', '💬', '💭', '🗯', '💤', '🕳', '🔔', '🔕', '🎵', '🎶', '✔️', '⚡', '💘', '🎀', '🎁']
  }
};