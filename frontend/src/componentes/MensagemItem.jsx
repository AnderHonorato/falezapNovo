// frontend/src/componentes/MensagemItem.jsx

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Check, CheckCheck, Clock, ChevronDown, Smile, AlertCircle,
  Reply, Forward, Copy, Star, Pin, Trash2, Share2, CheckSquare,
  Download, Play, Pause, FileText, Edit2, Zap,
  X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Lock
} from 'lucide-react';
import { useTema } from '../contextos/TemaContexto';
import './mensagens/css/MensagemItem.css';
import Highlight from './Highlight';
import SeletorEmojiReacao from './SeletorEmojiReacao';
import TemplateMensagem from './mensagens/TemplateMensagem';
import api from '../servicos/api';
import toast from 'react-hot-toast';
import Portal from './Portal';

const EMOJIS_RAPIDOS = ['👍', '❤️', '😂', '😮', '😢', '🙏'];
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default function MensagemItem({ 
  mensagem, 
  ehMinha, 
  usuario, 
  onReply, 
  onDelete,
  onReenviar,
  onForward,
  onPin,
  onFavorite,
  onEdit,
  onReact,
  onSelect,
  onShare,
  searchTerm = '',
  isHighlighted = false,
  onReenviarAlternativa,
  conversaSelecionada,
  todasMensagens = [] 
}) {
  const { temaEscuro } = useTema();
  const [menuAberto, setMenuAberto] = useState(false);
  const [seletorEmojiAberto, setSeletorEmojiAberto] = useState(false);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [posicaoMenu, setPosicaoMenu] = useState({ x: 0, y: 0 });
  const [posicaoEmojiSeletor, setPosicaoEmojiSeletor] = useState({ x: 0, y: 0 });
  const mensagemRef = useRef(null);
  const bolhaRef = useRef(null);
  const audioRef = useRef(null);

  // ✅ Estados para controlar o Lightbox avançado
  const [lightboxAberto, setLightboxAberto] = useState(false);
  const [midiaAtual, setMidiaAtual] = useState(null);
  const [indiceAtual, setIndiceAtual] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [midiasDaConversa, setMidiasDaConversa] = useState([]);
  const lightboxContentRef = useRef(null);

  useEffect(() => {
    if (temaEscuro) {
      document.body.setAttribute('data-theme', 'dark');
      document.body.classList.remove('light-theme');
    } else {
      document.body.setAttribute('data-theme', 'light');
      document.body.classList.add('light-theme');
    }
  }, [temaEscuro]);

  // ✅ Extrair todas as mídias (imagens e vídeos) da conversa para navegação do lightbox
  useEffect(() => {
    if (todasMensagens && todasMensagens.length > 0) {
      const midias = todasMensagens
        .filter(msg => {
          const tipo = msg.tipo?.toUpperCase();
          return (tipo === 'IMAGEM' || tipo === 'IMAGE' || tipo === 'VIDEO') && 
                 (msg.mediaUrl || msg.midia);
        })
        .map(msg => ({
          id: msg.id,
          tipo: msg.tipo?.toUpperCase(),
          url: obterUrlMidia(msg.mediaUrl || msg.midia),
          thumbUrl: msg.tipo?.toUpperCase().includes('IMAG') 
            ? obterUrlMidia(msg.mediaThumbUrl) || obterUrlMidia(msg.mediaUrl || msg.midia)
            : obterUrlMidia(msg.mediaUrl || msg.midia),
          legenda: msg.conteudo || msg.legendaImagem,
          enviadaEm: msg.enviadaEm || msg.timestamp || msg.criadaEm
        }));
      
      setMidiasDaConversa(midias);
    }
  }, [todasMensagens]);

  // ✅ Função para abrir o lightbox
  const abrirLightbox = useCallback((url, tipo) => {
    const indice = midiasDaConversa.findIndex(m => m.url === url);
    if (indice !== -1) {
      setIndiceAtual(indice);
      setMidiaAtual(midiasDaConversa[indice]);
    } else {
      setMidiaAtual({ url, tipo, thumbUrl: url });
      setIndiceAtual(0);
    }
    setLightboxAberto(true);
    setZoom(1);
  }, [midiasDaConversa]);

  // ✅ Navegação entre mídias
  const irParaProxima = useCallback(() => {
    if (midiasDaConversa.length === 0) return;
    const novoIndice = (indiceAtual + 1) % midiasDaConversa.length;
    setIndiceAtual(novoIndice);
    setMidiaAtual(midiasDaConversa[novoIndice]);
    setZoom(1);
  }, [indiceAtual, midiasDaConversa]);

  const irParaAnterior = useCallback(() => {
    if (midiasDaConversa.length === 0) return;
    const novoIndice = (indiceAtual - 1 + midiasDaConversa.length) % midiasDaConversa.length;
    setIndiceAtual(novoIndice);
    setMidiaAtual(midiasDaConversa[novoIndice]);
    setZoom(1);
  }, [indiceAtual, midiasDaConversa]);

  // ✅ Controle de zoom com scroll
  useEffect(() => {
    const handleWheel = (e) => {
      if (lightboxAberto && lightboxContentRef.current) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        setZoom(prev => Math.max(0.5, Math.min(3, prev + delta)));
      }
    };

    if (lightboxAberto) {
      window.addEventListener('wheel', handleWheel, { passive: false });
      return () => window.removeEventListener('wheel', handleWheel);
    }
  }, [lightboxAberto]);

  // ✅ Atalhos de teclado
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!lightboxAberto) return;
      
      if (e.key === 'Escape') {
        setLightboxAberto(false);
      } else if (e.key === 'ArrowRight') {
        irParaProxima();
      } else if (e.key === 'ArrowLeft') {
        irParaAnterior();
      }
    };

    if (lightboxAberto) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [lightboxAberto, irParaProxima, irParaAnterior]);

  if (!mensagem) {
    console.error('❌ [MensagemItem] Mensagem é null/undefined!');
    return null;
  }

  useEffect(() => {
    if (isHighlighted && mensagemRef.current) {
      mensagemRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [isHighlighted]);

  useEffect(() => {
    if (bolhaRef.current) {
      const textoElement = bolhaRef.current.querySelector('.mensagem-texto');
      if (textoElement) {
        const lineHeight = parseInt(window.getComputedStyle(textoElement).lineHeight);
        const height = textoElement.offsetHeight;
        const lines = Math.round(height / lineHeight);
        
        if (lines > 1) {
          bolhaRef.current.classList.add('multilinha');
        } else {
          bolhaRef.current.classList.remove('multilinha');
        }
      }
    }
  }, [mensagem.conteudo, mensagem.mensagem]);
  
  const obterUrlMidia = useCallback((url) => {
    if (!url) return null;
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    if (url.startsWith('/uploads') || url.startsWith('uploads')) {
      const path = url.startsWith('/') ? url : `/${url}`;
      return `${API_URL}${path}`;
    }
    return `${API_URL}/uploads/media/${url}`;
  }, []);

  const formatarHorario = () => {
    if (!mensagem.enviadaEm && !mensagem.timestamp && !mensagem.criadaEm) return '';
    const data = new Date(mensagem.enviadaEm || mensagem.timestamp || mensagem.criadaEm);
    return data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  const renderStatusIcon = () => {
    if (!ehMinha) return null;
    const status = mensagem.statusMensagem || mensagem.status;
    if (status === 'FALHA_JANELA_24H') {
      return (
        <span className="status-icon erro-janela" title="Envio recusado pela Meta. Tente de outra forma.">
          <AlertCircle size={16} />
        </span>
      );
    }
    if ((mensagem.erro || status === 'ERRO') && !mensagem.temporaria) {
      return (
        <span className="status-icon erro" title="Erro ao enviar - Clique para reenviar" onClick={() => onReenviar && onReenviar(mensagem)} style={{ cursor: 'pointer' }}>
          <AlertCircle size={16} />
        </span>
      );
    }
    if (status === 'ENVIANDO' || mensagem.temporaria) {
      return (
        <span className="status-icon enviando" title="Enviando...">
          <Clock size={16} className="pulse" />
        </span>
      );
    }
    if (status === 'LIDA' || status === 'READ' || mensagem.lida) {
      return (
        <span className="status-icon lida" title="Lida">
          <CheckCheck size={16} />
        </span>
      );
    }
    if (status === 'ENTREGUE' || status === 'DELIVERED') {
      return (
        <span className="status-icon entregue" title="Entregue">
          <CheckCheck size={16} />
        </span>
      );
    }
    if (status === 'ENVIADA' || status === 'SENT') {
      return (
        <span className="status-icon enviada" title="Enviada">
          <Check size={16} />
        </span>
      );
    }
    return <Clock size={16} className="status-icon pending" />;
  };

  const renderMensagemCitada = () => {
    if (!mensagem.replyTo && !mensagem.mensagemCitada) return null;
    const citada = mensagem.replyTo || mensagem.mensagemCitada;
    const autorCitado = citada.remetente?.nome || citada.autor || citada.enviadaPor || citada.remetenteNome || (citada.ehMinha ? 'Você' : 'Contato');
    const getConteudoCitado = () => {
      const tipo = citada.tipo?.toUpperCase();
      if (tipo === 'IMAGEM' || tipo === 'IMAGE') return '📷 Imagem';
      if (tipo === 'VIDEO') return '🎥 Vídeo';
      if (tipo === 'AUDIO') return '🎵 Áudio';
      if (tipo === 'DOCUMENTO' || tipo === 'DOCUMENT') return '📄 Documento';
      if (tipo === 'FIGURINHA' || tipo === 'STICKER') return '🎭 Figurinha';
      if (tipo === 'CONTATO') return '👤 Contato';
      const texto = citada.conteudo || citada.mensagem || citada.body || '';
      if (texto.length > 100) {
        return texto.substring(0, 100) + '...';
      }
      return texto || '[Mensagem]';
    };
    const handleClickCitada = () => {
      const elementoCitado = document.querySelector(`[data-message-id="${citada.id}"]`);
      if (elementoCitado) {
        elementoCitado.scrollIntoView({ behavior: 'smooth', block: 'center' });
        elementoCitado.classList.add('highlighted');
        setTimeout(() => elementoCitado.classList.remove('highlighted'), 3000);
      }
    };
    return (
      <div className="mensagem-citada" onClick={handleClickCitada}>
        <div className="citada-conteudo">
          <p className="citada-autor">{autorCitado}</p>
          <p className="citada-texto">
            {searchTerm ? (<Highlight text={getConteudoCitado()} highlight={searchTerm} />) : (getConteudoCitado())}
          </p>
        </div>
      </div>
    );
  };

  const abrirMenu = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const { innerWidth, innerHeight } = window;
    const menuWidth = 220;
    const menuHeight = 450;
    let x = e.clientX;
    let y = e.clientY - menuHeight - 8;
    if (y < 10) {
      y = e.clientY + 8;
      if (y + menuHeight > innerHeight) {
        y = innerHeight - menuHeight - 10;
      }
    }
    if (x + menuWidth > innerWidth) x = innerWidth - menuWidth - 10;
    if (x < 10) x = 10;
    setPosicaoMenu({ x, y });
    setMenuAberto(true);
  };

  const handleMenuClick = (e) => {
    e.stopPropagation();
    if (menuAberto) {
      setMenuAberto(false);
    } else {
      abrirMenu(e);
    }
  };

  const handleContextMenu = (e) => {
    abrirMenu(e);
  };

  const handleAbrirSeletorEmoji = (e) => {
    e.stopPropagation();
    const { innerWidth, innerHeight } = window;
    const seletorWidth = 350;
    const seletorHeight = 450;
    let x = e.clientX;
    let y = e.clientY - seletorHeight - 8;
    if (y < 10) y = e.clientY + 8;
    if (x + seletorWidth > innerWidth) x = innerWidth - seletorWidth - 10;
    if (x < 10) x = 10;
    setPosicaoEmojiSeletor({ x, y });
    setSeletorEmojiAberto(true);
    setMenuAberto(false);
  };

  const handleEmojiRapido = async (emoji) => {
    if (!usuario?.id) {
      console.warn('⚠️ Usuário não autenticado');
      toast.error('Faça login para reagir');
      return;
    }

    console.log('😊 [Reação] Processando:', emoji);
    const minhaReacao = mensagem.reacoes?.find(r => r.usuarioId === usuario.id);
    const jaReagiu = minhaReacao?.emoji === emoji;
    
    try {
      const response = await api.post('/reacoes', {
        mensagemId: mensagem.id,
        emoji: jaReagiu ? null : emoji
      });

      if (response.data.sucesso) {
        console.log('✅ [Reação] Sucesso:', response.data.mensagem);
        toast.success(response.data.mensagem);
        if (onReact) {
          onReact(mensagem.id, jaReagiu ? null : emoji);
        }
      }
    } catch (error) {
      console.error('❌ [Reação] Erro:', error);
      toast.error('Erro ao processar reação');
    }
    setMenuAberto(false);
  };

  const handleSelecionarEmoji = async (emoji) => {
    await handleEmojiRapido(emoji);
    setSeletorEmojiAberto(false);
  };

  const handleAcao = async (acao) => {
    console.log('🔧 Ação:', acao);
    switch(acao) {
      case 'responder':
        if (onReply) {
          const mensagemParaResponder = {
            id: mensagem.id,
            conteudo: mensagem.conteudo || mensagem.mensagem || mensagem.body,
            tipo: mensagem.tipo,
            remetente: {
              nome: mensagem.remetente?.nome || mensagem.remetenteNome || mensagem.enviadaPor || 'Contato'
            },
            ehMinha: ehMinha,
            whatsappId: mensagem.whatsappId
          };
          onReply(mensagemParaResponder);
          console.log('✅ Resposta ativada para:', mensagemParaResponder);
        }
        break;
      case 'copiar':
        const texto = mensagem.conteudo || mensagem.mensagem || '';
        if (texto) {
          try {
            await navigator.clipboard.writeText(texto);
            console.log('✅ Copiado');
            toast.success('Texto copiado!');
          } catch (err) {
            console.error('❌ Erro:', err);
            toast.error('Erro ao copiar');
          }
        } else {
          toast.error('Sem texto');
        }
        break;
      case 'encaminhar':
        if (onForward) {
          onForward(mensagem);
        } else {
          toast('Em desenvolvimento', { icon: '🚧' });
        }
        break;
      case 'fixar':
        try {
          const response = await api.put(`/mensagens/${mensagem.id}/fixar`);
          if (response.data.sucesso) {
            toast.success(mensagem.fixada ? 'Desafixada!' : 'Fixada!');
            if (onPin) onPin(mensagem.id);
          }
        } catch (error) {
          console.error('❌ Erro ao fixar:', error);
          toast.error('Erro ao fixar');
        }
        break;
      case 'favoritar':
        try {
          const response = await api.patch(`/mensagens/${mensagem.id}/favoritar`);
          if (response.data.sucesso) {
            toast.success(response.data.mensagem); 
            if (onFavorite) onFavorite(mensagem.id, response.data.favorita); 
          }
        } catch (error) {
          console.error('❌ Erro ao favoritar:', error);
          toast.error('Erro ao favoritar');
        }
        break;
      case 'editar':
        if (ehMinha) {
          if (onEdit) {
            onEdit(mensagem);
          } else {
            toast('Em desenvolvimento', { icon: '🚧' });
          }
        } else {
          toast.error('Não pode editar');
        }
        break;
      case 'apagar':
        try {
          await api.delete(`/mensagens/${mensagem.id}`); 
          toast.success('Envio cancelado');
          if (onDelete) onDelete(mensagem.id);
        } catch (error) {
          console.error('❌ Erro:', error);
          toast.error('Erro ao cancelar');
        }
        break;
      case 'reenviar':
        if (onReenviar) {
          onReenviar(mensagem);
        }
        break;
      case 'compartilhar':
        const txt = mensagem.conteudo || mensagem.mensagem || '';
        if (navigator.share) {
          try {
            await navigator.share({ text: txt, title: 'Mensagem' });
          } catch (err) {
            console.log('Compartilhamento cancelado');
          }
        } else {
          await navigator.clipboard.writeText(txt);
          toast.success('Copiado!');
        }
        break;
      case 'selecionar':
        if (onSelect) {
          onSelect(mensagem.id);
        } else {
          toast('Em desenvolvimento', { icon: '🚧' });
        }
        break;
      case 'baixar':
        const url = obterUrlMidia(mensagem.mediaUrl || mensagem.midia);
        if (url) {
          const link = document.createElement('a');
          link.href = url;
          link.download = mensagem.mediaNome || 'arquivo';
          link.target = '_blank';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          toast.success('Download iniciado!');
        } else {
          toast.error('Sem mídia');
        }
        break;
    }
    setMenuAberto(false);
  };

  const handlePlayPauseAudio = () => {
    if (audioRef.current) {
      if (audioPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setAudioPlaying(!audioPlaying);
    }
  };

  const renderReacoes = () => {
    if (!mensagem.reacoes || mensagem.reacoes.length === 0) return null;
    const reacoesAgrupadas = mensagem.reacoes.reduce((acc, reacao) => {
      if (!acc[reacao.emoji]) {
        acc[reacao.emoji] = {
          emoji: reacao.emoji,
          count: 0,
          usuarios: [],
          ehMinha: false
        };
      }
      const usuarioJaAdicionado = acc[reacao.emoji].usuarios.some(u => u === (reacao.usuario || reacao.usuarioNome));
      if (!usuarioJaAdicionado) {
        acc[reacao.emoji].count++;
        acc[reacao.emoji].usuarios.push(reacao.usuario || reacao.usuarioNome);
        if (reacao.usuarioId === usuario?.id) {
          acc[reacao.emoji].ehMinha = true;
        }
      }
      return acc;
    }, {});

    return (
      <div className={`mensagem-reacoes ${ehMinha ? 'minhas' : 'deles'}`}>
        {Object.values(reacoesAgrupadas).map((reacao, index) => (
          <div
            key={index}
            className={`reacao-item ${reacao.ehMinha ? 'minha-reacao' : ''}`}
            onClick={() => handleEmojiRapido(reacao.emoji)}
            title={reacao.usuarios.join(', ')}
          >
            <span className="reacao-emoji">{reacao.emoji}</span>
            {reacao.count > 1 && <span className="reacao-contador">{reacao.count}</span>}
          </div>
        ))}
      </div>
    );
  };

  const renderConteudo = () => {
    const tipo = mensagem.tipo?.toUpperCase();
    const texto = mensagem.conteudo || mensagem.mensagem || mensagem.body || '';

    // ✅ VISUAL POST-IT PARA ANOTAÇÕES
    // Verifica se é do tipo ANOTACAO, SISTEMA ou se tem eventoTipo relacionado a anotação
    if (tipo === 'ANOTACAO' || tipo === 'SISTEMA' || (mensagem.eventoTipo && mensagem.eventoTipo.includes('ANOTACAO'))) {
      const isApagada = mensagem.eventoTipo === 'ANOTACAO_APAGADA';
      
      return (
        <div className={`postit-container ${isApagada ? 'postit-apagada' : ''}`}>
          <div className="postit-header">
            {isApagada ? <Trash2 size={16} /> : <Lock size={16} />}
            <span>{isApagada ? 'Anotação Apagada' : 'Nota Interna (Post-it)'}</span>
          </div>
          
          <div className="postit-content">
            {texto}
          </div>

          <div className="postit-footer">
            <span className="postit-author">
              {mensagem.eventoSistema ? mensagem.eventoSistema.split(' por ')[1] || 'Sistema' : mensagem.remetenteNome || 'Usuário'}
            </span>
            <span className="postit-time">
              {new Date(mensagem.timestamp || mensagem.criadaEm).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
            </span>
          </div>
        </div>
      );
    }
    
    if (tipo === 'TEMPLATE') {
      return (
        <>
          <TemplateMensagem 
            mensagem={mensagem} 
            conversaSelecionada={conversaSelecionada}
          />
          <div className="mensagem-footer">
            <span className="mensagem-horario">{formatarHorario()}</span>
            {renderStatusIcon()}
          </div>
        </>
      );
    }
    
    const ehMensagemBotao = texto === '["button"]' || texto.includes('button_reply') || mensagem.buttonText || mensagem.selectedButton;
    if (ehMensagemBotao) {
      const buttonText = mensagem.buttonText || mensagem.selectedButton || 'Botão selecionado';
      return (
        <>
          <div className="mensagem-button-response">
            <span className="button-icon">✓</span>
            <span className="mensagem-texto">{buttonText}</span>
          </div>
          <div className="mensagem-footer">
            <span className="mensagem-horario">{formatarHorario()}</span>
            {renderStatusIcon()}
          </div>
        </>
      );
    }
    
    if (!texto && !mensagem.mediaUrl && !mensagem.midia && tipo === 'TEXTO') {
      return (
        <>
          <span className="mensagem-texto">[Mensagem vazia]</span>
          <div className="mensagem-footer">
            <span className="mensagem-horario">{formatarHorario()}</span>
            {renderStatusIcon()}
          </div>
        </>
      );
    }

    switch(tipo) {
      case 'IMAGEM':
      case 'IMAGE':
        const urlImagem = obterUrlMidia(mensagem.mediaUrl || mensagem.midia);
        const thumbnailUrl = obterUrlMidia(mensagem.mediaThumbUrl) || urlImagem;
        return (
          <div className="mensagem-midia">
            {urlImagem ? (
              <img 
                src={thumbnailUrl}
                alt="Imagem" 
                className="midia-img" 
                loading="lazy"
                onClick={() => abrirLightbox(urlImagem, 'IMAGE')}
                onError={(e) => {
                  console.error('❌ Erro ao carregar imagem:', thumbnailUrl);
                  e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23ddd"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3E📷%3C/text%3E%3C/svg%3E';
                }}
              />
            ) : (
              <div className="midia-placeholder">📷 Imagem não disponível</div>
            )}
            {(mensagem.conteudo || mensagem.legendaImagem) && (
              <p className="midia-legenda">
                {searchTerm ? <Highlight text={mensagem.conteudo || mensagem.legendaImagem} highlight={searchTerm} /> : (mensagem.conteudo || mensagem.legendaImagem)}
              </p>
            )}
            <div className="mensagem-footer">
              <span className="mensagem-horario">{formatarHorario()}</span>
              {renderStatusIcon()}
            </div>
          </div>
        );
        
      case 'VIDEO':
        const urlVideo = obterUrlMidia(mensagem.mediaUrl || mensagem.midia);
        return (
          <div className="mensagem-midia">
            {urlVideo ? (
              <video 
                src={urlVideo} 
                className="midia-video"
                preload="metadata"
                onClick={() => abrirLightbox(urlVideo, 'VIDEO')}
                onError={(e) => {
                  console.error('❌ Erro ao carregar vídeo:', urlVideo);
                }}
              />
            ) : (
              <div className="midia-placeholder">🎥 Vídeo não disponível</div>
            )}
            {(mensagem.conteudo || mensagem.legendaImagem) && (
              <p className="midia-legenda">
                {searchTerm ? <Highlight text={mensagem.conteudo || mensagem.legendaImagem} highlight={searchTerm} /> : (mensagem.conteudo || mensagem.legendaImagem)}
              </p>
            )}
            <div className="mensagem-footer">
              <span className="mensagem-horario">{formatarHorario()}</span>
              {renderStatusIcon()}
            </div>
          </div>
        );
        
      case 'AUDIO':
        const urlAudio = obterUrlMidia(mensagem.mediaUrl || mensagem.midia);
        return (
          <>
            <div className="mensagem-audio">
              <button className="audio-play-btn" onClick={handlePlayPauseAudio}>
                {audioPlaying ? <Pause size={18} /> : <Play size={18} />}
              </button>
              <div className="audio-waveform">
                <div className="audio-progress" style={{ width: audioPlaying ? '50%' : '0%' }} />
              </div>
              <span className="audio-duracao">{mensagem.mediaDuracao || '0:00'}</span>
              {urlAudio && (
                <audio 
                  ref={audioRef}
                  src={urlAudio}
                  onEnded={() => setAudioPlaying(false)}
                  onError={(e) => {
                    console.error('❌ Erro ao carregar áudio:', urlAudio);
                    setAudioPlaying(false);
                    toast.error('Erro ao reproduzir áudio');
                  }}
                />
              )}
            </div>
            <div className="mensagem-footer">
              <span className="mensagem-horario">{formatarHorario()}</span>
              {renderStatusIcon()}
            </div>
          </>
        );
        
      case 'DOCUMENTO':
      case 'DOCUMENT':
        return (
          <>
            <div className="mensagem-documento">
              <div className="documento-icon"><FileText size={20} /></div>
              <div className="documento-info">
                <span className="documento-nome">{mensagem.mediaNome || mensagem.filename || 'Documento'}</span>
                <span className="documento-tamanho">
                  {mensagem.mediaSize ? `${(mensagem.mediaSize / 1024 / 1024).toFixed(2)} MB` : ''}
                </span>
              </div>
              <button className="documento-download" onClick={() => handleAcao('baixar')}>
                <Download size={20} />
              </button>
            </div>
            <div className="mensagem-footer">
              <span className="mensagem-horario">{formatarHorario()}</span>
              {renderStatusIcon()}
            </div>
          </>
        );
        
      case 'FIGURINHA':
      case 'STICKER':
        const urlFigurinha = obterUrlMidia(mensagem.mediaUrl || mensagem.midia);
        return (
          <div className="mensagem-midia">
            {urlFigurinha ? (
              <img 
                src={urlFigurinha} 
                alt="Figurinha" 
                className="midia-figurinha" 
                style={{ maxWidth: '200px', borderRadius: '12px' }}
                loading="lazy"
                onError={(e) => {
                  console.error('❌ Erro ao carregar figurinha:', urlFigurinha);
                  e.target.style.display = 'none';
                }}
              />
            ) : (
              <div className="midia-placeholder">🎭 Figurinha</div>
            )}
            <div className="mensagem-footer">
              <span className="mensagem-horario">{formatarHorario()}</span>
              {renderStatusIcon()}
            </div>
          </div>
        );
        
      default:
        if (searchTerm) {
          return (
            <div style={{ position: 'relative' }}>
              <span className="mensagem-texto">
                <Highlight text={texto} highlight={searchTerm} />
              </span>
              <span className="mensagem-footer">
                <span className="mensagem-horario">{formatarHorario()}</span>
                {renderStatusIcon()}
              </span>
            </div>
          );
        }
        return (
          <div style={{ position: 'relative' }}>
            <span 
              className="mensagem-texto" 
              dangerouslySetInnerHTML={{ 
                __html: texto
                  .replace(/\*([^*]+)\*/g, '<strong>$1</strong>')
                  .replace(/_([^_]+)_/g, '<em>$1</em>')
                  .replace(/~([^~]+)~/g, '<del>$1</del>')
                  .replace(/```([^`]+)```/g, '<span class="code-format">$1</span>')
                  .replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer" class="link-format">$1</a>')
              }} 
            />
            <span className="mensagem-footer">
              <span className="mensagem-horario">{formatarHorario()}</span>
              {renderStatusIcon()}
            </span>
          </div>
        );
    }
  };

  const temMidia = ['IMAGEM', 'VIDEO', 'DOCUMENTO', 'AUDIO', 'FIGURINHA'].includes(mensagem.tipo?.toUpperCase());
  const status = mensagem.statusMensagem || mensagem.status;
  const mostrarErroJanela = status === 'FALHA_JANELA_24H';
  const mostrarErroGenerico = (mensagem.erro || status === 'ERRO') && !mostrarErroJanela && !mensagem.temporaria;
  const obterUrlAvatar = () => {
    const foto = mensagem.remetente?.foto_perfil || mensagem.fotoRemetente;
    if (!foto) return null;
    if (foto.startsWith('http://') || foto.startsWith('https://')) {
      return foto;
    }
    if (foto.startsWith('/uploads')) {
      return `${API_URL}${foto}`;
    }
    return `${API_URL}/uploads/avatars/${foto}`;
  };

  // ✅ Verificação se é Anotação/Sistema para renderização condicional do layout
  const isAnotacaoOuSistema = mensagem.tipo === 'ANOTACAO' || mensagem.tipo === 'SISTEMA' || (mensagem.eventoTipo && mensagem.eventoTipo.includes('ANOTACAO'));

  return (
    <>
      <div 
        ref={mensagemRef}
        className={`mensagem-wrapper ${ehMinha ? 'minha' : 'deles'} ${temaEscuro ? '' : 'light-theme'} ${isHighlighted ? 'highlighted' : ''} ${mostrarErroGenerico || mostrarErroJanela ? 'com-erro' : ''} ${mensagem.temporaria ? 'temporaria' : ''} ${isAnotacaoOuSistema ? 'wrapper-anotacao' : ''}`}
        data-message-id={mensagem.id}
      >
        {/* ✅ Layout Centralizado para Anotações/Sistema (Post-it) */}
        {isAnotacaoOuSistema ? (
           <div className="w-full flex justify-center py-2">
             <div className="max-w-[80%] min-w-[300px]">
                {renderConteudo()}
             </div>
           </div>
        ) : (
        <div className="mensagem-layout-flex">
          {!ehMinha && (
            <div className="mensagem-avatar">
              {obterUrlAvatar() ? (
                <img 
                  src={obterUrlAvatar()} 
                  alt={mensagem.remetente?.nome || mensagem.remetenteNome || 'Usuário'}
                  onError={(e) => {
                    console.error('❌ Erro ao carregar avatar');
                    e.target.style.display = 'none';
                    e.target.parentElement.innerHTML = `<div class="mensagem-avatar-placeholder">${(mensagem.remetente?.nome || mensagem.remetenteNome || '?').charAt(0).toUpperCase()}</div>`;
                  }}
                />
              ) : (
                <div className="mensagem-avatar-placeholder">
                  {(mensagem.remetente?.nome || mensagem.remetenteNome || mensagem.enviadaPor || '?').charAt(0).toUpperCase()}
                </div>
              )}
            </div>
          )}

          <div className="mensagem-conteudo-wrapper">
            <div 
              ref={bolhaRef}
              className={`mensagem-bolha ${ehMinha ? 'minha' : 'deles'}`}
              onContextMenu={handleContextMenu}
            >
              <div className="mensagem-hover-actions">
                <button className="hover-btn" onClick={handleAbrirSeletorEmoji} title="Reagir">
                  <Smile size={14} />
                </button>
                <button className="hover-btn" onClick={handleMenuClick} title="Mais opções">
                  <ChevronDown size={14} />
                </button>
              </div>

              {renderMensagemCitada()}
              {renderConteudo()}
            </div>

            {ehMinha && mostrarErroJanela && (
              <div className="mensagem-erro-container">
                <span className="mensagem-erro-texto">Por motivos de segurança, a Meta não permite o envio </span>
                <span className="mensagem-erro-texto">direto da primeira mensagem para novos contatos.</span>
                <span className="mensagem-erro-texto">Use o modelo padrão verificado pela Meta ou envie primeiro</span>
                <span className="mensagem-erro-texto">do seu Smartphone.</span>
                <div className="mensagem-erro-botoes">
                  <button className="mensagem-erro-botao-alternativa" onClick={() => onReenviarAlternativa(mensagem)}>
                    <Zap size={12} />
                    Enviar modelo padrão
                  </button>
                  <button className="mensagem-erro-botao-cancelar" onClick={() => handleAcao('apagar')}>
                    Cancelar
                  </button>
                </div>
              </div>
            )}
            
            {renderReacoes()}
          </div>
        </div>
        )}

        {menuAberto && (
          <Portal>
            <div className="menu-overlay" onClick={() => setMenuAberto(false)} />
            <div 
              className={`menu-contexto ${temaEscuro ? '' : 'light-theme'}`}
              style={{ left: `${posicaoMenu.x}px`, top: `${posicaoMenu.y}px` }}
              onClick={(e) => e.stopPropagation()}
            >
              <button className="menu-item" onClick={() => handleAcao('responder')}><Reply size={18} />Responder</button>
              <button className="menu-item" onClick={() => handleAcao('copiar')}><Copy size={18} />Copiar</button>
              <button className="menu-item" onClick={() => handleAcao('encaminhar')}><Forward size={18} />Encaminhar</button>
              <button className="menu-item" onClick={() => handleAcao('favoritar')}><Star size={18} />Favoritar</button>
              <button className="menu-item" onClick={() => handleAcao('fixar')}><Pin size={18} />{mensagem.fixada ? 'Desafixar' : 'Fixar'}</button>
              {ehMinha && (<button className="menu-item" onClick={() => handleAcao('editar')}><Edit2 size={18} />Editar</button>)}
              {temMidia && (<button className="menu-item" onClick={() => handleAcao('baixar')}><Download size={18} />Baixar mídia</button>)}
              {ehMinha && mostrarErroGenerico && (<button className="menu-item primary" onClick={() => handleAcao('reenviar')}><Reply size={18} />Reenviar mensagem</button>)}
              {ehMinha && (<button className="menu-item danger" onClick={() => handleAcao('apagar')}><Trash2 size={18} />Apagar para mim</button>)}
              <button className="menu-item" onClick={() => handleAcao('selecionar')}><CheckSquare size={18} />Selecionar</button>
              <button className="menu-item" onClick={() => handleAcao('compartilhar')}><Share2 size={18} />Compartilhar</button>
              <div className="menu-emojis">
                {EMOJIS_RAPIDOS.map((emoji) => (
                  <button key={emoji} className="emoji-btn" onClick={() => handleEmojiRapido(emoji)} title={`Reagir com ${emoji}`}>
                    {emoji}
                  </button>
                ))}
                <button className="emoji-btn emoji-btn-mais" onClick={handleAbrirSeletorEmoji} title="Mais emojis">
                  +
                </button>
              </div>
            </div>
          </Portal>
        )}

        {seletorEmojiAberto && (
          <SeletorEmojiReacao
            isOpen={seletorEmojiAberto}
            onSelectEmoji={handleSelecionarEmoji}
            onClose={() => setSeletorEmojiAberto(false)}
            position={posicaoEmojiSeletor}
          />
        )}
      </div>
      
      {/* ✅ LIGHTBOX AVANÇADO COM ZOOM E NAVEGAÇÃO */}
      {lightboxAberto && midiaAtual && (
        <Portal>
          <div className="lightbox-overlay" onClick={() => setLightboxAberto(false)}>
            {/* Botão fechar */}
            <button className="lightbox-close-btn" onClick={() => setLightboxAberto(false)}>
              <X size={36} />
            </button>

            {/* Controles de zoom */}
            <div className="lightbox-zoom-controls">
              <button 
                className="lightbox-zoom-btn" 
                onClick={(e) => {
                  e.stopPropagation();
                  setZoom(prev => Math.max(0.5, prev - 0.2));
                }}
                title="Diminuir zoom"
              >
                <ZoomOut size={20} />
              </button>
              <span className="lightbox-zoom-level">{Math.round(zoom * 100)}%</span>
              <button 
                className="lightbox-zoom-btn" 
                onClick={(e) => {
                  e.stopPropagation();
                  setZoom(prev => Math.min(3, prev + 0.2));
                }}
                title="Aumentar zoom"
              >
                <ZoomIn size={20} />
              </button>
              <button 
                className="lightbox-zoom-btn" 
                onClick={(e) => {
                  e.stopPropagation();
                  setZoom(1);
                }}
                title="Resetar zoom"
              >
                1:1
              </button>
            </div>

            {/* Navegação anterior/próxima */}
            {midiasDaConversa.length > 1 && (
              <>
                <button 
                  className="lightbox-nav-btn lightbox-nav-prev" 
                  onClick={(e) => {
                    e.stopPropagation();
                    irParaAnterior();
                  }}
                  title="Anterior"
                >
                  <ChevronLeft size={36} />
                </button>
                <button 
                  className="lightbox-nav-btn lightbox-nav-next" 
                  onClick={(e) => {
                    e.stopPropagation();
                    irParaProxima();
                  }}
                  title="Próxima"
                >
                  <ChevronRight size={36} />
                </button>
              </>
            )}

            {/* Conteúdo principal */}
            <div 
              ref={lightboxContentRef}
              className="lightbox-content" 
              onClick={(e) => e.stopPropagation()}
              style={{ transform: `scale(${zoom})` }}
            >
              {midiaAtual.tipo === 'VIDEO' ? (
                <video 
                  src={midiaAtual.url} 
                  controls 
                  autoPlay 
                  preload="auto"
                />
              ) : (
                <img src={midiaAtual.url} alt="Visualização em tela cheia" />
              )}
            </div>

            {/* Legenda da mídia */}
            {midiaAtual.legenda && (
              <div className="lightbox-caption">
                {midiaAtual.legenda}
              </div>
            )}

            {/* Galeria de miniaturas */}
            {midiasDaConversa.length > 1 && (
              <div className="lightbox-thumbnails">
                <div className="lightbox-thumbnails-scroll">
                  {midiasDaConversa.map((midia, idx) => (
                    <div
                      key={midia.id}
                      className={`lightbox-thumb ${idx === indiceAtual ? 'active' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setIndiceAtual(idx);
                        setMidiaAtual(midia);
                        setZoom(1);
                      }}
                    >
                      {midia.tipo === 'VIDEO' ? (
                        <>
                          <video src={midia.thumbUrl} preload="metadata" />
                          <div className="lightbox-thumb-play">▶</div>
                        </>
                      ) : (
                        <img src={midia.thumbUrl} alt="" loading="lazy" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Portal>
      )}

      {/* CSS INLINE PARA O POST-IT E LAYOUT */}
      <style>{`
        /* ESTILO POST-IT (AMARELO E CENTRALIZADO) */
        .postit-container {
          background-color: #fef3c7; /* Amarelo suave */
          border-left: 5px solid #d97706; /* Laranja forte */
          color: #78350f; /* Marrom texto */
          padding: 12px 16px;
          border-radius: 4px;
          box-shadow: 2px 2px 5px rgba(0,0,0,0.1);
          font-family: 'Segoe UI', sans-serif;
          position: relative;
        }

        .dark .postit-container {
          background-color: #451a03;
          border-left-color: #f59e0b;
          color: #fcd34d;
        }

        .postit-header {
          display: flex;
          align-items: center;
          gap: 6px;
          font-weight: bold;
          text-transform: uppercase;
          font-size: 0.75rem;
          margin-bottom: 6px;
          opacity: 0.8;
        }

        .postit-content {
          font-size: 0.95rem;
          line-height: 1.5;
          font-style: italic;
          white-space: pre-wrap;
        }

        .postit-footer {
          margin-top: 8px;
          padding-top: 6px;
          border-top: 1px dashed rgba(0,0,0,0.1);
          font-size: 0.75rem;
          display: flex;
          justify-content: space-between;
          opacity: 0.7;
        }

        /* Estilo para Anotação Apagada */
        .postit-apagada {
          background-color: #e5e7eb;
          border-left-color: #9ca3af;
          color: #6b7280;
          text-decoration: line-through;
          opacity: 0.8;
        }
        
        .dark .postit-apagada {
          background-color: #1f2937;
          border-left-color: #4b5563;
          color: #9ca3af;
        }

        .wrapper-anotacao {
          margin: 15px 0;
        }
      `}</style>
    </>
  );
}