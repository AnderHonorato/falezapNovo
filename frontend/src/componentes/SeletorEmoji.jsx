// frontend/src/componentes/SeletorEmoji.jsx - CORRIGIDO (com estilos inline)

import React, { useState, useMemo } from 'react';
import { Search, Smile, Heart, Zap, X } from 'lucide-react';
// ✅ 1. Caminho do CSS corrigido (para layout, grid, etc.)
import './mensagens/css/SeletorEmoji.css';
import { useTema } from '../contextos/TemaContexto'; 

export default function SeletorEmoji({ isOpen, onSelectEmoji, onClose, position }) {
  const [categoriaAtiva, setCategoriaAtiva] = useState('rostos');
  const [busca, setBusca] = useState('');
  
  // ✅ 2. Usar o hook
  const { tema, temaEscuro } = useTema();

  const emojisFiltrados = useMemo(() => {
    // ... (lógica inalterada) ...
    if (!busca.trim()) {
      return CATEGORIAS[categoriaAtiva].emojis;
    }
    const termo = busca.toLowerCase();
    let resultados = [];
    Object.values(CATEGORIAS).forEach(categoria => {
      resultados = resultados.concat(categoria.emojis);
    });
    return resultados;
  }, [categoriaAtiva, busca]);

  if (!isOpen) return null;

  // ✅ 3. DEFINIR ESTILOS INLINE BASEADOS NO TEMA (aqui está a correção)
  // Estes estilos são baseados no seu arquivo SeletorEmoji.css
  const containerStyle = {
    ...position, // Adiciona top/left
    background: temaEscuro 
      ? 'linear-gradient(135deg, rgba(15, 23, 42, 0.98) 0%, rgba(30, 41, 59, 0.98) 100%)' 
      : 'linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(248, 250, 252, 0.98) 100%)',
    borderColor: temaEscuro ? 'rgba(148, 163, 184, 0.3)' : 'rgba(226, 232, 240, 0.8)',
    boxShadow: temaEscuro ? '0 20px 60px rgba(0, 0, 0, 0.5)' : '0 20px 60px rgba(0, 0, 0, 0.2)'
  };

  const headerStyle = {
    borderBottomColor: temaEscuro ? 'rgba(148, 163, 184, 0.15)' : 'rgba(226, 232, 240, 0.8)'
  };

  const inputStyle = {
    background: temaEscuro ? 'rgba(15, 23, 42, 0.5)' : '#f1f5f9',
    color: temaEscuro ? '#e2e8f0' : '#1e293b',
    borderColor: temaEscuro ? 'rgba(148, 163, 184, 0.15)' : 'rgba(226, 232, 240, 0.8)'
  };
  
  const iconStyle = {
    color: temaEscuro ? '#64748b' : '#64748b' // (Cor é a mesma nos dois temas no CSS)
  };

  const categoriasStyle = {
    borderBottomColor: temaEscuro ? 'rgba(148, 163, 184, 0.15)' : 'rgba(226, 232, 240, 0.8)'
  };

  const emojiBtnStyle = {
    backgroundColor: temaEscuro ? 'rgba(15, 23, 42, 0.5)' : '#f1f5f9'
  };

  const footerStyle = {
    borderTopColor: temaEscuro ? 'rgba(148, 163, 184, 0.15)' : 'rgba(226, 232, 240, 0.8)',
    backgroundColor: temaEscuro ? 'rgba(15, 23, 42, 0.8)' : '#ffffff'
  };
  
  const footerIconStyle = {
     color: '#64748b'
  };

  const fecharBtnStyle = {
    backgroundColor: temaEscuro ? 'rgba(148, 163, 184, 0.15)' : '#f1f5f9',
    color: temaEscuro ? '#e2e8f0' : '#1e293b'
  };

  return (
    <>
      {/* Overlay */}
      <div onClick={onClose} className="seletor-emoji-overlay" />
      
      {/* ✅ 4. Aplicar estilos inline - REMOVIDA A CLASSE 'light-theme' */}
      <div 
        className="seletor-emoji-container"
        style={containerStyle}
      >
        {/* Header com Busca */}
        <div className="seletor-emoji-header" style={headerStyle}>
          <div className="seletor-emoji-busca-wrapper">
            <Search className="seletor-emoji-busca-icon" style={iconStyle} />
            <input
              type="text"
              placeholder="Buscar emoji..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="seletor-emoji-busca-input"
              style={inputStyle}
            />
          </div>
        </div>

        {/* Categorias */}
        {!busca && (
          <div className="seletor-emoji-categorias" style={categoriasStyle}>
            {Object.entries(CATEGORIAS).map(([key, categoria]) => (
              <button
                key={key}
                onClick={() => setCategoriaAtiva(key)}
                className={`seletor-emoji-categoria-btn ${categoriaAtiva === key ? 'active' : ''}`}
                style={{
                  '--cor-ativa': categoriaAtiva === key ? `${tema.verde}20` : 'transparent'
                }}
                title={categoria.nome}
              >
                {categoria.icone}
              </button>
            ))}
          </div>
        )}

        {/* Grid de Emojis */}
        <div className="seletor-emoji-grid-container">
          <div className="seletor-emoji-grid">
            {emojisFiltrados.map((emoji, index) => (
              <button
                key={index}
                onClick={() => {
                  onSelectEmoji(emoji);
                  onClose();
                }}
                className="seletor-emoji-btn"
                style={emojiBtnStyle}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="seletor-emoji-footer" style={footerStyle}>
          <div className="seletor-emoji-footer-info">
            <Smile className="seletor-emoji-footer-icon" style={footerIconStyle} />
            <span className="seletor-emoji-footer-texto" style={footerIconStyle}>
              {emojisFiltrados.length} emoji{emojisFiltrados.length !== 1 ? 's' : ''}
            </span>
          </div>
          <button onClick={onClose} className="seletor-emoji-fechar-btn" style={fecharBtnStyle}>
            Fechar
          </button>
        </div>
      </div>
    </>
  );
}

// (Definições de CATEGORIAS completas, como no original)
const CATEGORIAS = {
  rostos: {
    nome: 'Rostos',
    icone: '😊',
    emojis: ['😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃', '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '😚', '😙', '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔', '🤐', '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '🤥', '😌', '😔', '😪', '🤤', '😴', '😷', '🤒', '🤕', '🤢', '🤮', '🤧', '🥵', '🥶', '😵', '🤯', '🤠', '🥳', '😎', '🤓', '🧐']
  },
  maos: {
    nome: 'Mãos',
    icone: '👍',
    emojis: ['👍', '👎', '👏', '🙌', '👐', '🤝', '🙏', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '👇', '☝️', '✋', '🤚', '🖐', '🖖', '👋', '🤛', '🤜', '✊', '👊', '🤏', '👌', '🤌', '💪']
  },
  coracoes: {
    nome: 'Corações',
    icone: '❤️',
    emojis: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❤️‍🔥', '❤️‍🩹', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '💌', '💋']
  },
  animais: {
    nome: 'Animais',
    icone: '🐶',
    emojis: ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🐔', '🐧', '🐦', '🐤', '🐣', '🦆', '🦅', '🦉', '🦇', '🐺', '🐗', '🐴', '🦄', '🐝', '🐛', '🦋', '🐌', '🐞', '🐜', '🦟', '🦗', '🕷', '🐢', '🐍', '🦎', '🐙', '🦑', '🦐', '🦀', '🐡', '🐠', '🐟', '🐬', '🐳', '🐋', '🦈']
  },
  comida: {
    nome: 'Comida',
    icone: '🍕',
    emojis: ['🍏', '🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🍈', '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🍆', '🥑', '🥦', '🥬', '🥒', '🌶', '🌽', '🥕', '🥔', '🍠', '🥐', '🥯', '🍞', '🥖', '🥨', '🧀', '🥚', '🍳', '🥞', '🥓', '🥩', '🍗', '🍖', '🌭', '🍔', '🍟', '🍕', '🥪', '🥙', '🌮', '🌯', '🥗', '🍝', '🍜', '🍲', '🍛', '🍣', '🍱', '🥟', '🍤', '🍙', '🍚', '🍘', '🍥', '🥠', '🍢', '🍡', '🍧', '🍨', '🍦', '🥧', '🍰', '🎂', '🍮', '🍭', '🍬', '🍫', '🍿', '🍩', '🍪', '🌰', '🥜', '🍯']
  },
  atividades: {
    nome: 'Atividades',
    icone: '⚽',
    emojis: ['⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱', '🏓', '🏸', '🏒', 'f_adj', '🥍', '🏏', '🥅', '⛳', '🏹', '🎣', '🤿', '🥊', '🥋', '🎽', '⛸', '🥌', '🛷', '🛹', '🎿', '⛷', '🏂', '🏋️', '🤼', '🤸', '🤺', '⛹️', '🤾', '🏌️', '🏇', '🧘', '🏊', '🤽', '🚣', '🧗', '🚴', '🚵', '🤹']
  },
  viagem: {
    nome: 'Viagem',
    icone: '✈️',
    emojis: ['🚗', '🚕', '🚙', '🚌', '🚎', '🏎', '🚓', '🚑', '🚒', '🚐', '🚚', '🚛', '🚜', '🛴', '🚲', '🛵', '🏍', '🚨', '🚔', '🚍', '🚘', '🚖', 'f_adj', '🚠', '🚟', '🚃', '🚋', '🚞', 'f_adj', '🚄', '🚅', '🚈', '🚂', '🚆', '🚇', '🚊', '🚉', '✈️', '🛫', '🛬', '🛩', '💺', '🛰', '🚀', '🛸', '🚁', '🛶', '⛵', '🚤', '🛥', '🛳', '⛴', '🚢']
  },
  objetos: {
    nome: 'Objetos',
    icone: '💡',
    emojis: ['⌚', '📱', '📲', '💻', '⌨️', '🖥', '🖨', '🖱', '🖲', '🕹', '🗜', '💽', '💾', '💿', '📀', '📼', '📷', '📸', '📹', '🎥', '📽', '🎞', '📞', '☎️', '📟', '📠', '📺', '📻', '🎙', '🎚', '🎛', '⏱', '⏲', '⏰', '🕰', '⌛', '⏳', '📡', '🔋', '🔌', '💡', '🔦', '🕯', '🪔', '🧯', '🛢', '💸', '💵', '💴', '💶', '💷', '💰', '💳', '💎', '⚖️', '🔧', '🔨', '⚒', '🛠', '⛏', '🔩', '⚙️', '⛓', '🔫', '💣', '🔪', '🗡', '⚔️', '🛡', '🚬', '⚰️', '⚱️', '🏺', '🔮', '📿']
  },
  simbolos: {
    nome: 'Símbolos',
    icone: '💯',
    emojis: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '☮️', '✝️', '☪️', '🕉', '☸️', '✡️', '🔯', '🕎', '☯️', '☦️', '🛐', '⛎', '♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓', '🆔', '⚛️', '🉑', '☢️', '☣️', '📴', '📳', '🈶', '🈚', '🈸', '🈺', '🈷️', '✴️', '🆚', '💮', '🉐', '㊙️', '㊗️', '🈴', '🈵', '🈹', '🈲', '🅰️', '🅱️', '🆎', '🆑', '🅾️', '🆘', '❌', '⭕', '🛑', '⛔', '📛', '🚫', '💯', '💢', '♨️', '🚷', '🚯', '🚳', '🚱', '🔞', '📵', '🚭', '❗', '❕', '❓', '❔', '‼️', '⁉️', '🔅', '🔆', '〽️', '⚠️', '🚸', '🔱', '⚜️', '🔰', '♻️', '✅', '🈯', '💹', '❇️', '✳️', '❎', '🌐', '💠', 'Ⓜ️', '🌀', '💤', '🏧', '🚾', '♿', '🅿️', '🈳', '🈂️', '🛂', '🛃', '🛄', '🛅', '🚹', '🚺', '🚼', '🚻', '🚮', '🎦', '📶', '🈁', '🔣', 'ℹ️', '🔤', '🔡', '🔠', '🆖', '🆗', '🆙', '🆒', '🆕', '🆓', '0️⃣', '1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟', '🔢', '#️⃣', '*️⃣', '⏏️', '▶️', '⏸', '⏯', '⏹', '⏺', '⏭', '⏮', '⏩', '⏪', '⏫', '⏬', '◀️', '🔼', '🔽', '➡️', '⬅️', '⬆️', '⬇️', '↗️', '↘️', '↙️', '↖️', '↕️', '↔️', '↪️', '↩️', '⤴️', '⤵️', '🔀', '🔁', '🔂', '🔄', '🔃', '🎵', '🎶', '➕', '➖', '➗', '✖️', '♾', '💲', '💱', '™️', '©️', '®️', '👁‍🗨', '🔚', '🔙', '🔛', '🔝', '🔜', '〰️', '➰', '➿', '✔️', '☑️', '🔘', '⚪', '⚫', '🔴', '🟠', '🟡', '🟢', '🔵', '🟣', '⚪', '⚫', '🟤', '🔺', '🔻', '🔸', '🔹', '🔶', '🔷', '🔳', '🔲', '▪️', '▫️', '◾', '◽', '◼️', '◻️', '⬛', '⬜', '🟥', '🟧', '🨨', '🟩', '🟦', '🟪', '🟫', '🔈', '🔇', '🔉', '🔊', '🔔', '🔕', '📣', '📢', '💬', '💭', '🗯', '♠️', '♣️', '♥️', '♦️', '🃏', '🎴', '🀄', '🕐', '🕑', '🕒', '🕓', '🕔', '🕕', '🕖', '🕗', '🕘', '🕙', '🕚', '🕛', '🕜', '🕝', '🕞', '🕟', '🕠', '🕡', '🕢', '🕣', '🕤', '🕥', '🕦', '🕧']
  }
};