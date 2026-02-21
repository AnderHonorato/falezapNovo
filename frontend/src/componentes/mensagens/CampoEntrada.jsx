// frontend/src/componentes/mensagens/CampoEntrada.jsx - CORRIGIDO COM BOTÃO ANOTAÇÕES

import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, Paperclip, Smile, Mic, X, Image, Camera, FileText, User,
  Bold, Italic, Strikethrough, Code, StickyNote
} from 'lucide-react';
import { useTema } from '../../contextos/TemaContexto';
import './css/CampoEntrada.css';

export default function CampoEntrada({ 
  novaMensagem, 
  setNovaMensagem, 
  onEnviar, 
  enviando,
  replyingToMessage,
  setReplyingToMessage,
  onAnexar,
  // ✅ NOVAS PROPS para anotações
  onAbrirPainelAnotacoes
}) {
  const { temaEscuro } = useTema();
  const [emojiAberto, setEmojiAberto] = useState(false);
  const [anexoAberto, setAnexoAberto] = useState(false);
  const [formatarAberto, setFormatarAberto] = useState(false);
  const [posicaoFormatar, setPosicaoFormatar] = useState({ x: 0, y: 0 });
  const textareaRef = useRef(null);
  const emojiRef = useRef(null);
  const anexoRef = useRef(null);
  const formatarRef = useRef(null);

  const emojis = ['😀', '😂', '😍', '🥰', '😊', '😎', '🤔', '😢', '😭', '😡', '👍', '👎', '🙏', '❤️', '🔥', '⭐'];

  useEffect(() => {
    const handleClickFora = (e) => {
      if (emojiRef.current && !emojiRef.current.contains(e.target)) setEmojiAberto(false);
      if (anexoRef.current && !anexoRef.current.contains(e.target)) setAnexoAberto(false);
      if (formatarRef.current && !formatarRef.current.contains(e.target)) setFormatarAberto(false);
    };
    document.addEventListener('mousedown', handleClickFora);
    return () => document.removeEventListener('mousedown', handleClickFora);
  }, []);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 100) + 'px';
    }
  }, [novaMensagem]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (novaMensagem.trim() && !enviando) {
      onEnviar(e);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const inserirEmoji = (emoji) => {
    setNovaMensagem(prev => prev + emoji);
    setEmojiAberto(false);
    textareaRef.current?.focus();
  };

  const handleFormatarTexto = (tipo) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = novaMensagem.substring(start, end);
    
    if (!selectedText) {
      setFormatarAberto(false);
      return;
    }

    let formattedText = '';
    switch(tipo) {
      case 'bold':
        formattedText = `*${selectedText}*`;
        break;
      case 'italic':
        formattedText = `_${selectedText}_`;
        break;
      case 'strike':
        formattedText = `~${selectedText}~`;
        break;
      case 'code':
        formattedText = ` \`\`\`${selectedText}\`\`\` `;
        break;
      default:
        return;
    }

    const newText = novaMensagem.substring(0, start) + formattedText + novaMensagem.substring(end);
    setNovaMensagem(newText);
    setFormatarAberto(false);
    
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start, start + formattedText.length);
    }, 0);
  };

  const handleTextoSelecionado = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    
    if (start !== end) {
      const rect = textarea.getBoundingClientRect();
      setPosicaoFormatar({
        x: rect.left + (rect.width / 2),
        y: rect.top - 10
      });
      setFormatarAberto(true);
    } else {
      setFormatarAberto(false);
    }
  };

  return (
    <div className={`campo-entrada-container ${temaEscuro ? '' : 'light-theme'}`}>
      {/* Preview de Resposta */}
      {replyingToMessage && (
        <div className="reply-preview">
          <div className="reply-content">
            <div className="reply-bar" />
            <div className="reply-info">
              <p className="reply-author">
                {replyingToMessage.remetente?.nome || 'Você'}
              </p>
              <p className="reply-text">
                {replyingToMessage.conteudo || '[Mídia]'}
              </p>
            </div>
            <button 
              className="reply-close"
              onClick={() => setReplyingToMessage(null)}
            >
              <X size={18} />
            </button>
          </div>
        </div>
      )}

      {/* Área de Digitação */}
      <div className="entrada-wrapper">
        {/* Botão Emoji */}
        <div className="action-btn-wrapper" ref={emojiRef}>
          <button
            type="button"
            className={`action-btn ${emojiAberto ? 'active' : ''}`}
            onClick={() => setEmojiAberto(!emojiAberto)}
            title="Emoji"
          >
            <Smile size={22} />
          </button>

          {emojiAberto && (
            <>
              <div className="emoji-overlay" onClick={() => setEmojiAberto(false)} />
              <div className="emoji-panel">
                <div className="emoji-header">
                  <h4>Emojis</h4>
                </div>
                <div className="emoji-grid">
                  {emojis.map((emoji, idx) => (
                    <button
                      key={idx}
                      className="emoji-item"
                      onClick={() => inserirEmoji(emoji)}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Botão Anexar */}
        <div className="action-btn-wrapper" ref={anexoRef}>
          <button
            type="button"
            className={`action-btn ${anexoAberto ? 'active' : ''}`}
            onClick={() => setAnexoAberto(!anexoAberto)}
            title="Anexar"
          >
            <Paperclip size={22} />
          </button>

          {anexoAberto && (
            <>
              <div className="anexo-overlay" onClick={() => setAnexoAberto(false)} />
              <div className="anexo-panel">
                <button className="anexo-item" onClick={() => { onAnexar('foto'); setAnexoAberto(false); }}>
                  <div className="anexo-icon foto">
                    <Image size={22} />
                  </div>
                  Foto
                </button>
                <button className="anexo-item" onClick={() => { onAnexar('camera'); setAnexoAberto(false); }}>
                  <div className="anexo-icon camera">
                    <Camera size={22} />
                  </div>
                  Câmera
                </button>
                <button className="anexo-item" onClick={() => { onAnexar('documento'); setAnexoAberto(false); }}>
                  <div className="anexo-icon documento">
                    <FileText size={22} />
                  </div>
                  Documento
                </button>
                <button className="anexo-item" onClick={() => { onAnexar('contato'); setAnexoAberto(false); }}>
                  <div className="anexo-icon contato">
                    <User size={22} />
                  </div>
                  Contato
                </button>
              </div>
            </>
          )}
        </div>

        {/* ✅ BOTÃO DE ANOTAÇÕES - AGORA VISÍVEL */}
        {onAbrirPainelAnotacoes && (
          <button
            type="button"
            className="action-btn"
            onClick={onAbrirPainelAnotacoes}
            title="Anotações"
          >
            <StickyNote size={22} />
          </button>
        )}

        {/* Campo de Texto */}
        <div className="input-wrapper">
          <textarea
            ref={textareaRef}
            className="input-field"
            placeholder="Digite uma mensagem"
            value={novaMensagem}
            onChange={(e) => setNovaMensagem(e.target.value)}
            onKeyDown={handleKeyDown}
            onSelect={handleTextoSelecionado}
            disabled={enviando}
            rows={1}
          />
        </div>

        {/* Botão Enviar/Áudio */}
        <button
          type="button"
          className="send-btn"
          onClick={handleSubmit}
          disabled={enviando || !novaMensagem.trim()}
          title={novaMensagem.trim() ? 'Enviar' : 'Gravar áudio'}
        >
          {enviando ? (
            <div className="send-loading" />
          ) : novaMensagem.trim() ? (
            <Send size={20} />
          ) : (
            <Mic size={20} />
          )}
        </button>
      </div>

      {/* Menu de Formatação */}
      {formatarAberto && (
        <div 
          className="formatar-menu"
          ref={formatarRef}
          style={{
            left: `${posicaoFormatar.x}px`,
            top: `${posicaoFormatar.y}px`
          }}
        >
          <button className="formatar-btn" onClick={() => handleFormatarTexto('bold')} title="Negrito">
            <Bold size={16} />
          </button>
          <button className="formatar-btn" onClick={() => handleFormatarTexto('italic')} title="Itálico">
            <Italic size={16} />
          </button>
          <button className="formatar-btn" onClick={() => handleFormatarTexto('strike')} title="Tachado">
            <Strikethrough size={16} />
          </button>
          <button className="formatar-btn" onClick={() => handleFormatarTexto('code')} title="Código">
            <Code size={16} />
          </button>
        </div>
      )}
    </div>
  );
}