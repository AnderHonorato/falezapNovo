// frontend/src/componentes/ConversaItem.jsx - VERSÃO COMPLETA CORRIGIDA

import React from 'react';
import { Pin, Volume2, VolumeX, Star, Check, CheckCheck, Clock, Image, Video, FileText, Mic } from 'lucide-react';
import { useTema } from '../contextos/TemaContexto';

export default function ConversaItem({ conversa, selecionada, onSelecionar, onContextMenu }) {
  const { temaEscuro } = useTema();

  const formatarHorario = () => {
    if (!conversa.ultimaMensagemEm) return '';
    const data = new Date(conversa.ultimaMensagemEm);
    const hoje = new Date();
    
    if (data.toDateString() === hoje.toDateString()) {
      return data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    }
    
    const ontem = new Date(hoje);
    ontem.setDate(ontem.getDate() - 1);
    
    if (data.toDateString() === ontem.toDateString()) {
      return 'Ontem';
    }
    
    return data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  };

  const renderPreviewMensagem = () => {
    if (!conversa.ultimaMensagem) return 'Nenhuma mensagem ainda';
    
    const msg = conversa.ultimaMensagem;
    const tipo = msg.tipo ? msg.tipo.toUpperCase() : 'TEXTO';
    
    const prefixo = msg.direcao === 'ENVIADA' ? (
      <span className="preview-voce">Você: </span>
    ) : null;
    
    switch(tipo) {
      case 'IMAGEM':
      case 'IMAGE':
        return <><Image size={14} className="preview-icon" /> {prefixo}Foto</>;
      case 'VIDEO':
        return <><Video size={14} className="preview-icon" /> {prefixo}Vídeo</>;
      case 'AUDIO':
        return <><Mic size={14} className="preview-icon" /> {prefixo}Áudio</>;
      case 'DOCUMENTO':
      case 'DOCUMENT':
        return <><FileText size={14} className="preview-icon" /> {prefixo}Documento</>;
      default:
        return <>{prefixo}{msg.conteudo || msg.mensagem || 'Mensagem'}</>;
    }
  };

  const renderStatusIcon = () => {
    if (!conversa.ultimaMensagem || conversa.ultimaMensagem.direcao !== 'ENVIADA') return null;
    
    const status = conversa.ultimaMensagem.statusMensagem || conversa.ultimaMensagem.status;
    
    if (status === 'LIDA' || status === 'READ') {
      return <CheckCheck size={18} className="status-icon read" />;
    }
    if (status === 'ENTREGUE' || status === 'DELIVERED') {
      return <CheckCheck size={18} className="status-icon delivered" />;
    }
    if (status === 'ENVIADA' || status === 'SENT') {
      return <Check size={18} className="status-icon sent" />;
    }
    return <Clock size={18} className="status-icon pending" />;
  };

  return (
    <div
      className={`conversa-item ${selecionada ? 'selecionada' : ''} ${temaEscuro ? '' : 'light-theme'}`}
      onClick={() => onSelecionar(conversa)}
      onContextMenu={(e) => onContextMenu(e, conversa)}
    >
      {/* Avatar */}
      <div className="conversa-avatar-wrapper">
        {conversa.fotoPerfil ? (
          <img src={conversa.fotoPerfil} alt={conversa.nomeCliente} className="conversa-avatar" />
        ) : (
          <div className="conversa-avatar-placeholder">
            {conversa.tipo === 'GRUPO' ? '👥' : '👤'}
          </div>
        )}
        {conversa.online && <div className="avatar-status-dot" />}
      </div>

      {/* Conteúdo */}
      <div className="conversa-content">
        <div className="conversa-header">
          <div className="conversa-nome-wrapper">
            {conversa.fixada && <Pin size={12} className="icon-fixada" />}
            <h3 className="conversa-nome">
              {conversa.nomeCliente || conversa.numeroCliente}
            </h3>
            {/* ✅ CORREÇÃO: favorita ao invés de favorito */}
            {conversa.favorita && <Star size={12} className="icon-favorito" fill="currentColor" />}
          </div>
          <span className="conversa-horario">{formatarHorario()}</span>
        </div>

        <div className="conversa-footer">
          <div className="conversa-preview">
            {renderStatusIcon()}
            <span className="preview-texto">{renderPreviewMensagem()}</span>
          </div>
          
          <div className="conversa-badges">
            {conversa.silenciada && <VolumeX size={14} className="badge-icon muted" />}
            {conversa.naoLidas > 0 && (
              <span className="badge-contador">{conversa.naoLidas > 99 ? '99+' : conversa.naoLidas}</span>
            )}
          </div>
        </div>
      </div>

      {/* Estilos */}
      {/* ✅ CORREÇÃO: Removido o atributo 'jsx' da tag <style> */}
      <style>{`
        .conversa-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 12px;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
          position: relative;
          overflow: hidden;
        }

        .conversa-item::before {
          content: '';
          position: absolute;
          left: 0;
          top: 0;
          width: 3px;
          height: 100%;
          background: linear-gradient(180deg, #10b981 0%, #059669 100%);
          transform: scaleY(0);
          transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .conversa-item.selecionada::before {
          transform: scaleY(1);
        }

        .conversa-item:hover {
          background: linear-gradient(90deg, rgba(16, 185, 129, 0.08) 0%, rgba(16, 185, 129, 0.03) 100%);
          transform: translateX(3px);
        }

        .conversa-item.selecionada {
          background: linear-gradient(90deg, rgba(16, 185, 129, 0.15) 0%, rgba(16, 185, 129, 0.08) 100%);
        }

        .light-theme.conversa-item:hover {
          background: linear-gradient(90deg, rgba(16, 185, 129, 0.06) 0%, rgba(16, 185, 129, 0.02) 100%);
        }

        .light-theme.conversa-item.selecionada {
          background: linear-gradient(90deg, rgba(16, 185, 129, 0.12) 0%, rgba(16, 185, 129, 0.06) 100%);
        }

        .conversa-avatar-wrapper {
          position: relative;
          flex-shrink: 0;
        }

        .conversa-avatar {
          width: 44px; 
          height: 44px;
          border-radius: 50%;
          object-fit: cover;
          border: 2px solid transparent;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .conversa-item.selecionada .conversa-avatar {
          border-color: #10b981;
          box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.2);
        }

        .conversa-avatar-placeholder {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: linear-gradient(135deg, #374151 0%, #4b5563 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          border: 2px solid transparent;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .light-theme .conversa-avatar-placeholder {
          background: linear-gradient(135deg, #e5e7eb 0%, #d1d5db 100%);
        }

        .avatar-status-dot {
          position: absolute;
          bottom: 1px;
          right: 1px;
          width: 10px;
          height: 10px;
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          border: 2px solid #111b21;
          border-radius: 50%;
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(0.95); }
        }

        .light-theme .avatar-status-dot {
          border-color: #ffffff;
        }

        .conversa-content {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .conversa-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
        }

        .conversa-nome-wrapper {
          display: flex;
          align-items: center;
          gap: 4px;
          flex: 1;
          min-width: 0;
        }

        .icon-fixada {
          color: #10b981;
          flex-shrink: 0;
          transform: rotate(45deg);
        }

        .conversa-nome {
          font-size: 14px; 
          font-weight: 600;
          color: #e9edef;
          margin: 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .light-theme .conversa-nome {
          color: #111b21;
        }

        .icon-favorito {
          color: #f59e0b;
          flex-shrink: 0;
        }

        .conversa-horario {
          font-size: 11px;
          font-weight: 500;
          color: #8696a0;
          white-space: nowrap;
          flex-shrink: 0;
        }

        .light-theme .conversa-horario {
          color: #667781;
        }

        .conversa-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
        }

        .conversa-preview {
          display: flex;
          align-items: center;
          gap: 4px;
          flex: 1;
          min-width: 0;
        }

        .status-icon {
          flex-shrink: 0;
          color: #8696a0;
          width: 16px;
          height: 16px;
        }

        .status-icon.read {
          color: #53bdeb;
        }

        .preview-icon {
          flex-shrink: 0;
          color: #8696a0;
          width: 12px;
          height: 12px;
        }

        .light-theme .preview-icon {
          color: #667781;
        }

        .preview-voce {
          color: #10b981;
          font-weight: 600;
        }

        .preview-texto {
          font-size: 12px; 
          color: #8696a0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .light-theme .preview-texto {
          color: #667781;
        }

        .conversa-badges {
          display: flex;
          align-items: center;
          gap: 6px;
          flex-shrink: 0;
        }

        .badge-icon {
          color: #8696a0;
          width: 14px;
          height: 14px;
        }

        .badge-icon.muted {
          color: #6b7280;
        }

        .badge-contador {
          min-width: 18px;
          height: 18px;
          padding: 0 5px;
          background: #10b981;
          color: #ffffff;
          font-size: 10px;
          font-weight: 700;
          border-radius: 9px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 6px rgba(16, 185, 129, 0.4);
          animation: badgePulse 2s ease-in-out infinite;
        }

        @keyframes badgePulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }

        @media (max-width: 768px) {
          .conversa-item {
            padding: 8px 12px;
            gap: 10px;
          }

          .conversa-avatar,
          .conversa-avatar-placeholder {
            width: 44px;
            height: 44px;
          }

          .conversa-nome {
            font-size: 14px;
          }

          .preview-texto {
            font-size: 12px;
          }
        }
      `}</style>
    </div>
  );
}