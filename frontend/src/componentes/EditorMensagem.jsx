// frontend/src/components/EditorMensagem.jsx

import React, { useState, useRef, useEffect } from 'react';
import { 
  FiSmile,
  FiPaperclip,
  FiMic,
  FiSend,
  FiX,
  FiPlus
} from 'react-icons/fi';
import { BsEmojiSmile } from 'react-icons/bs';
import { useTema } from '../contextos/TemaContexto';
import './mensagens/css/EditorMensagem.css';

const EditorMensagem = ({ onEnviar, enviando = false }) => {
  const [texto, setTexto] = useState('');
  const [menuAnexoAberto, setMenuAnexoAberto] = useState(false);
  const [emojiAberto, setEmojiAberto] = useState(false);
  const textareaRef = useRef(null);
  const { temaEscuro } = useTema();

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [texto]);

  const handleEnviar = async () => {
    if (!texto.trim() || enviando) return;

    const sucesso = await onEnviar(texto, []);
    
    if (sucesso) {
      setTexto('');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleEnviar();
    }
  };

  const emojisComuns = ['😀', '😂', '❤️', '😍', '🤔', '👍', '🙏', '😊', '🎉', '✨', '🔥', '💪', '👏', '🙌', '💯', '✅'];

  return (
    <footer className={`editor-mensagem ${temaEscuro ? '' : 'light-theme'}`}>
      <div className="editor-container">
        {/* Botão Emoji */}
        <div className="editor-btn-wrapper">
          <button 
            className="editor-btn"
            onClick={() => setEmojiAberto(!emojiAberto)}
            title="Emoji"
          >
            <BsEmojiSmile size={26} />
          </button>

          {/* Painel de Emojis */}
          {emojiAberto && (
            <>
              <div className="emoji-overlay" onClick={() => setEmojiAberto(false)} />
              <div className="emoji-picker">
                <div className="emoji-header">
                  <h4>Emojis</h4>
                </div>
                <div className="emoji-grid">
                  {emojisComuns.map((emoji, index) => (
                    <button
                      key={index}
                      className="emoji-item"
                      onClick={() => {
                        setTexto(prev => prev + emoji);
                        setEmojiAberto(false);
                        textareaRef.current?.focus();
                      }}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Botão Anexo */}
        <div className="editor-btn-wrapper">
          <button 
            className="editor-btn"
            onClick={() => setMenuAnexoAberto(!menuAnexoAberto)}
            title="Anexar"
          >
            {menuAnexoAberto ? <FiX size={26} /> : <FiPaperclip size={24} />}
          </button>

          {/* Menu de Anexos */}
          {menuAnexoAberto && (
            <>
              <div className="anexo-overlay" onClick={() => setMenuAnexoAberto(false)} />
              <div className="anexo-menu">
                <button className="anexo-item">
                  <div className="anexo-icon foto">
                    <svg viewBox="0 0 24 24" height="24" width="24">
                      <path fill="currentColor" d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
                    </svg>
                  </div>
                  <span>Fotos e vídeos</span>
                </button>

                <button className="anexo-item">
                  <div className="anexo-icon camera">
                    <svg viewBox="0 0 24 24" height="24" width="24">
                      <path fill="currentColor" d="M12 15.2c-2.4 0-4.4-2-4.4-4.4s2-4.4 4.4-4.4 4.4 2 4.4 4.4-2 4.4-4.4 4.4z"/>
                      <path fill="currentColor" d="M20 7c0-1.1-.9-2-2-2h-3l-1.2-1.6c-.4-.5-1-.9-1.7-.9h-2.2c-.7 0-1.3.4-1.7.9L7 5H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V7zm-8 10.5c-3.6 0-6.5-2.9-6.5-6.5S8.4 4.5 12 4.5s6.5 2.9 6.5 6.5-2.9 6.5-6.5 6.5z"/>
                    </svg>
                  </div>
                  <span>Câmera</span>
                </button>

                <button className="anexo-item">
                  <div className="anexo-icon documento">
                    <svg viewBox="0 0 24 24" height="24" width="24">
                      <path fill="currentColor" d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm4 18H6V4h7v5h5v11z"/>
                    </svg>
                  </div>
                  <span>Documento</span>
                </button>

                <button className="anexo-item">
                  <div className="anexo-icon contato">
                    <svg viewBox="0 0 24 24" height="24" width="24">
                      <path fill="currentColor" d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                    </svg>
                  </div>
                  <span>Contato</span>
                </button>
              </div>
            </>
          )}
        </div>

        {/* Campo de Texto */}
        <div className="editor-input-wrapper">
          <textarea
            ref={textareaRef}
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Escreva uma mensagem"
            disabled={enviando}
            className="editor-input"
            rows={1}
          />
        </div>

        {/* Botão de Enviar ou Gravar Áudio */}
        {texto.trim() ? (
          <button 
            className="editor-btn editor-btn-send"
            onClick={handleEnviar}
            disabled={enviando}
            title="Enviar"
          >
            {enviando ? (
              <div className="editor-loading" />
            ) : (
              <FiSend size={20} />
            )}
          </button>
        ) : (
          <button 
            className="editor-btn"
            title="Gravar áudio"
          >
            <FiMic size={24} />
          </button>
        )}
      </div>
    </footer>
  );
};

export default EditorMensagem;