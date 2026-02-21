// frontend/src/componentes/mensagens/CaixaTexto.jsx
// ✅ VISUAL ANOTAÇÃO CORRIGIDO & COMPACTO

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { 
  Send, Paperclip, Smile, Mic, StickyNote, X, Loader2, 
  Bold, Italic, Strikethrough, Code, 
  Check, FileText
} from 'lucide-react';
import SeletorEmoji from '../SeletorEmoji';
import SeletorAnexos from '../SeletorAnexos';
import ModalMidia from './ModalMidia';
import { CORES_ANOTACAO } from '../../constantes/mensagensConstantes';
import './css/CaixaTexto.css'; 
import { useTema, TemaContext } from '../../contextos/TemaContexto';
import toast from 'react-hot-toast';
import api from '../../servicos/api';

export default function CaixaTexto({
  valor,
  setValor,
  onEnviar,
  modoAnotacao,
  onToggleModoAnotacao,
  corAnotacao,
  setCorAnotacao,
  replyingTo,
  setReplyingTo,
  enviando,
  enviandoMidia,
  inputRef,
  fileInputRef,
  onCriarAnotacao,
  mostrarEmojis, setMostrarEmojis, anchorElEmoji, setAnchorElEmoji,
  mostrarAnexos, setMostrarAnexos, anchorElAnexos, setAnchorElAnexos,
  isFocused, setIsFocused,
  handleAbreAnexos, handleAbreEmoji, handleSelectTipoAnexo, handleEmojiSelect,
  onAbrirModalTemplate,
  conversaSelecionada
}) {
  const [selecao, setSelecao] = useState({ start: 0, end: 0 });
  const [mostrarFormatacao, setMostrarFormatacao] = useState(false);
  const [posicaoFormatacao, setPosicaoFormatacao] = useState({ x: 0, y: 0 });
  const [posicaoEmoji, setPosicaoEmoji] = useState({ top: 0, left: 0 });
  const [posicaoAnexo, setPosicaoAnexo] = useState({ top: 0, left: 0 });
  
  const [arquivoSelecionado, setArquivoSelecionado] = useState(null);
  const [legendaMidia, setLegendaMidia] = useState('');
  const [mostrarPreviewMidia, setMostrarPreviewMidia] = useState(false);
  
  const formatacaoRef = useRef(null);
  const resizeTimeoutRef = useRef(null);
  
  const temaContextValue = useTema(); 
  const { temaEscuro, tema } = temaContextValue;

  // Recupera cor selecionada para aplicar no visual
  const corAtual = CORES_ANOTACAO[corAnotacao] || CORES_ANOTACAO.amarelo;

  // Auto-resize
  useEffect(() => {
    if (!inputRef.current) return;
    if (resizeTimeoutRef.current) clearTimeout(resizeTimeoutRef.current);
    resizeTimeoutRef.current = setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.style.height = 'auto';
        const scrollHeight = inputRef.current.scrollHeight;
        const newHeight = Math.min(scrollHeight, 100);
        inputRef.current.style.height = `${newHeight}px`;
      }
    }, 50);
    return () => { if (resizeTimeoutRef.current) clearTimeout(resizeTimeoutRef.current); };
  }, [valor]); 

  const handleSelectionChange = useCallback(() => {
    if (!inputRef.current) return;
    const start = inputRef.current.selectionStart;
    const end = inputRef.current.selectionEnd;
    if (start !== end && !modoAnotacao) {
      setSelecao({ start, end });
      const textarea = inputRef.current;
      const rect = textarea.getBoundingClientRect();
      setPosicaoFormatacao({ x: rect.left + (rect.width / 2), y: rect.top - 50 });
      setMostrarFormatacao(true);
    } else {
      setMostrarFormatacao(false);
    }
  }, [inputRef, modoAnotacao]);

  const aplicarFormatacao = useCallback((tipo) => {
    const textoSelecionado = valor.substring(selecao.start, selecao.end);
    if (!textoSelecionado) return;
    let textoFormatado = '';
    switch(tipo) {
      case 'negrito': textoFormatado = `*${textoSelecionado}*`; break;
      case 'italico': textoFormatado = `_${textoSelecionado}_`; break;
      case 'riscado': textoFormatado = `~${textoSelecionado}~`; break;
      case 'monoespaco': textoFormatado = `\`\`\`${textoSelecionado}\`\`\``; break;
      default: return;
    }
    const novoTexto = valor.substring(0, selecao.start) + textoFormatado + valor.substring(selecao.end);
    setValor(novoTexto);
    setMostrarFormatacao(false);
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        const novaPosicao = selecao.start + textoFormatado.length;
        inputRef.current.setSelectionRange(novaPosicao, novaPosicao);
      }
    }, 0);
  }, [valor, selecao, setValor, inputRef]);

  const handleEnviar = useCallback(() => {
    if (!valor.trim() || enviando) return;
    if (modoAnotacao) onCriarAnotacao?.();
    else onEnviar();
    if (inputRef.current) inputRef.current.style.height = 'auto';
    setTimeout(() => inputRef.current?.focus(), 10);
  }, [valor, enviando, modoAnotacao, onCriarAnotacao, onEnviar, inputRef]);

  const handleKeyPress = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleEnviar();
    }
  }, [handleEnviar]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (formatacaoRef.current && !formatacaoRef.current.contains(e.target)) setMostrarFormatacao(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (mostrarEmojis && anchorElEmoji) {
      const rect = anchorElEmoji.getBoundingClientRect();
      setPosicaoEmoji({ top: Math.max(rect.top - 450 - 10, 10), left: Math.max(Math.min(rect.left, window.innerWidth - 380), 10) });
    }
  }, [mostrarEmojis, anchorElEmoji]);

  useEffect(() => {
    if (mostrarAnexos && anchorElAnexos) {
      const rect = anchorElAnexos.getBoundingClientRect();
      setPosicaoAnexo({ top: Math.max(rect.top - 250 - 10, 10), left: Math.max(Math.min(rect.left, window.innerWidth - 280), 10) });
    }
  }, [mostrarAnexos, anchorElAnexos]);

  const handleSelecionarArquivo = useCallback((tipo, accept) => {
    if (!conversaSelecionada) return toast.error('Selecione uma conversa primeiro');
    if (tipo === 'contato') return toast('Em desenvolvimento', { icon: '🚧' });
    const input = document.createElement('input');
    input.type = 'file'; input.accept = accept || '*';
    if (tipo === 'fotos-videos') input.multiple = false;
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      if (file.size > 16 * 1024 * 1024) return toast.error('Limite: 16MB');
      const tipoMidia = file.type.startsWith('image/') ? 'imagem' : file.type.startsWith('video/') ? 'video' : file.type.startsWith('audio/') ? 'audio' : 'documento';
      if (['imagem', 'video', 'audio'].includes(tipoMidia)) {
        setArquivoSelecionado(file); setLegendaMidia(''); setMostrarPreviewMidia(true);
      } else {
        await enviarArquivo(file, tipoMidia, '');
      }
    };
    input.click();
  }, [conversaSelecionada]);

  const enviarArquivo = async (file, tipo, legenda) => {
    if (!conversaSelecionada) return toast.error('Selecione uma conversa');
    const formData = new FormData();
    formData.append('numero', conversaSelecionada.numeroCliente);
    formData.append('conversaId', conversaSelecionada.id);
    if (legenda) formData.append('legenda', legenda);
    let endpoint = '', fileFieldName = '';
    switch (tipo) {
      case 'imagem': endpoint = '/mensagens/enviar-imagem'; fileFieldName = 'imagem'; break;
      case 'video': endpoint = '/mensagens/enviar-video'; fileFieldName = 'video'; break;
      case 'audio': endpoint = '/mensagens/enviar-audio'; fileFieldName = 'audio'; break;
      case 'documento': endpoint = '/mensagens/enviar-documento'; fileFieldName = 'documento'; break;
      default: return toast.error('Tipo não suportado');
    }
    formData.append(fileFieldName, file);
    try {
      toast.loading('Enviando...', { id: 'upload' });
      const response = await api.post(endpoint, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      if (response.data.sucesso) {
        toast.success('Enviado!', { id: 'upload' });
        setMostrarPreviewMidia(false); setArquivoSelecionado(null); setLegendaMidia('');
        setTimeout(() => inputRef.current?.focus(), 100);
      }
    } catch (error) {
      toast.error('Erro no envio', { id: 'upload' });
    }
  };

  const handleEnviarMidia = async () => {
    if (!arquivoSelecionado) return;
    const tipoMidia = arquivoSelecionado.type.startsWith('image/') ? 'imagem' : arquivoSelecionado.type.startsWith('video/') ? 'video' : 'audio';
    await enviarArquivo(arquivoSelecionado, tipoMidia, legendaMidia);
  };

  const enviandoStatus = enviando || enviandoMidia;

  return (
    <div className={`caixa-texto-container ${!temaEscuro ? 'light-theme' : ''}`}>
      
      {replyingTo && !modoAnotacao && (
        <div className="reply-block">
          <div className="reply-content">
            <p className="reply-label">Respondendo a {replyingTo.remetente?.nome || 'Usuário'}</p>
            <p className="reply-text">{replyingTo.conteudo || '[Mídia]'}</p>
          </div>
          <button onClick={() => setReplyingTo(null)} className="reply-close-btn"><X size={16} /></button>
        </div>
      )}

      {modoAnotacao && (
        <div 
          className="anotacao-mode-banner"
          style={{ 
            backgroundColor: corAtual.bg,
            borderLeftColor: corAtual.borda,
            color: corAtual.texto
          }}
        >
          <div className="anotacao-banner-content">
            <div className="anotacao-icon-box" style={{color: corAtual.borda}}>
              <StickyNote size={16} />
            </div>
            <div className="anotacao-info">
              {/* Texto com a cor forte da anotação para destacar */}
              <span className="anotacao-title" style={{color: corAtual.texto}}>
                Anotação Interna
              </span>
              <span className="anotacao-desc" style={{color: corAtual.texto}}>
                Visível apenas para equipe
              </span>
            </div>
          </div>
          
          <div className="anotacao-colors">
            {Object.entries(CORES_ANOTACAO)
              .filter(([nome]) => nome !== 'apagada')
              .map(([nome, config]) => (
                <button
                  key={nome}
                  onClick={() => setCorAnotacao(nome)}
                  className={`color-choice-btn ${corAnotacao === nome ? 'selected' : ''}`}
                  style={{ backgroundColor: config.bg, border: `1px solid ${config.borda}` }}
                  title={nome}
                />
              ))}
          </div>
        </div>
      )}

      {mostrarFormatacao && !modoAnotacao && (
        <div ref={formatacaoRef} className="format-menu" style={{ left: `${posicaoFormatacao.x}px`, top: `${posicaoFormatacao.y}px` }}>
          <button onClick={() => aplicarFormatacao('negrito')} className="format-btn"><Bold size={14} /></button>
          <button onClick={() => aplicarFormatacao('italico')} className="format-btn"><Italic size={14} /></button>
          <button onClick={() => aplicarFormatacao('riscado')} className="format-btn"><Strikethrough size={14} /></button>
          <button onClick={() => aplicarFormatacao('monoespaco')} className="format-btn"><Code size={14} /></button>
        </div>
      )}

      <div className="input-area">
        <div className="btn-group-left">
          <button onClick={handleAbreEmoji} className={`action-btn ${mostrarEmojis ? 'active' : ''}`} disabled={enviando || modoAnotacao}>
            <Smile />
          </button>
          {mostrarEmojis && createPortal(<TemaContext.Provider value={temaContextValue}><SeletorEmoji isOpen={mostrarEmojis} onSelectEmoji={handleEmojiSelect} onClose={() => { setMostrarEmojis(false); setAnchorElEmoji(null); }} position={posicaoEmoji} /></TemaContext.Provider>, document.body)}

          <button onClick={handleAbreAnexos} className={`action-btn ${mostrarAnexos ? 'active' : ''}`} disabled={enviando || enviandoMidia || modoAnotacao}>
            <Paperclip />
          </button>
          {mostrarAnexos && !modoAnotacao && createPortal(<TemaContext.Provider value={temaContextValue}><SeletorAnexos aberto={mostrarAnexos && !modoAnotacao} onFechar={() => { setMostrarAnexos(false); setAnchorElAnexos(null); }} onSelecionarArquivo={handleSelecionarArquivo} position={posicaoAnexo} /></TemaContext.Provider>, document.body)}

          <button onClick={onToggleModoAnotacao} className={`action-btn ${modoAnotacao ? 'anotacao-active' : ''}`} disabled={enviando}>
            <StickyNote />
          </button>
          <button onClick={onAbrirModalTemplate} className="action-btn" disabled={enviando || modoAnotacao || enviandoMidia}>
            <FileText />
          </button>
        </div>

        {/* INPUT COM COR DINÂMICA NO MODO ANOTAÇÃO */}
        <div 
          className={`textarea-wrapper ${modoAnotacao ? 'mode-anotacao' : ''}`}
          style={modoAnotacao ? { backgroundColor: corAtual.bg, borderColor: corAtual.borda } : {}}
        >
          <textarea
            ref={inputRef}
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            onKeyPress={handleKeyPress}
            onSelect={handleSelectionChange}
            onFocus={() => setIsFocused(true)}
            onBlur={() => { setIsFocused(false); setTimeout(() => { if (!document.activeElement?.closest('.format-menu')) setMostrarFormatacao(false); }, 200); }}
            placeholder={modoAnotacao ? "Escreva uma anotação..." : "Digite uma mensagem"}
            className="main-textarea"
            disabled={enviando}
          />
        </div>

        <div className="btn-group-right">
          {valor.trim() ? (
            <button onClick={handleEnviar} disabled={enviandoStatus} className="send-btn" style={modoAnotacao ? {color: corAtual.borda} : {}}>
              {enviandoStatus ? <Loader2 className="animate-spin" size={20} /> : <Send />}
            </button>
          ) : (
            <button className="action-btn" disabled={enviando} title="Gravar áudio"><Mic /></button>
          )}
        </div>
      </div>

      {mostrarPreviewMidia && arquivoSelecionado && createPortal(<ModalMidia arquivo={arquivoSelecionado} legenda={legendaMidia} setLegenda={setLegendaMidia} onEnviar={handleEnviarMidia} onCancelar={() => { setMostrarPreviewMidia(false); setArquivoSelecionado(null); setLegendaMidia(''); }} tema={tema} />, document.body)}
    </div>
  );
}