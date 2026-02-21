// frontend/src/componentes/BolhaMensagem.jsx

import React, { useState } from 'react';
import { 
  Check, CheckCheck, Clock, MoreVertical,
  Reply, Forward, Copy, Trash2, Download
} from 'lucide-react';
import { useTema } from '../contextos/TemaContexto';

export default function BolhaMensagem({ mensagem, ehMinha, onReply, onDelete }) {
  const [menuAberto, setMenuAberto] = useState(false);
  const { tema, temaEscuro } = useTema();

  const formatarHorario = (data) => {
    if (!data) return '';
    const date = new Date(data);
    return date.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const renderStatusIcon = () => {
    if (!ehMinha) return null;

    const status = mensagem.statusMensagem || mensagem.status;
    
    if (status === 'LIDA' || status === 'READ') {
      return <CheckCheck className="w-4 h-4 text-blue-500" />;
    }
    
    if (status === 'ENTREGUE' || status === 'DELIVERED') {
      return <CheckCheck className="w-4 h-4" style={{ color: tema.textoSecundario }} />;
    }
    
    if (status === 'ENVIADA' || status === 'SENT') {
      return <Check className="w-4 h-4" style={{ color: tema.textoSecundario }} />;
    }

    return <Clock className="w-4 h-4" style={{ color: tema.textoSecundario }} />;
  };

  const renderConteudo = () => {
    const tipo = mensagem.tipo?.toUpperCase();

    switch (tipo) {
      case 'IMAGEM':
      case 'IMAGE':
        return (
          <div className="mb-2">
            <img 
              src={mensagem.mediaUrl || mensagem.midia} 
              alt="Imagem"
              className="max-w-full rounded-lg"
              style={{ maxHeight: '300px' }}
            />
            {mensagem.conteudo && (
              <p className="mt-2 text-sm">{mensagem.conteudo}</p>
            )}
          </div>
        );

      case 'VIDEO':
        return (
          <div className="mb-2">
            <video 
              src={mensagem.mediaUrl || mensagem.midia}
              controls
              className="max-w-full rounded-lg"
              style={{ maxHeight: '300px' }}
            />
            {mensagem.conteudo && (
              <p className="mt-2 text-sm">{mensagem.conteudo}</p>
            )}
          </div>
        );

      case 'DOCUMENTO':
      case 'DOCUMENT':
        return (
          <div className="flex items-center gap-3 mb-2">
            <div 
              className="w-12 h-12 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: tema.hover }}
            >
              <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor">
                <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm4 18H6V4h7v5h5v11z"/>
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">
                {mensagem.mediaNome || 'Documento'}
              </p>
              <p className="text-xs" style={{ color: tema.textoSecundario }}>
                {mensagem.mediaSize ? `${(mensagem.mediaSize / 1024 / 1024).toFixed(2)} MB` : ''}
              </p>
            </div>
            <button 
              className="p-2 rounded-lg transition-all hover:scale-110"
              style={{ backgroundColor: tema.hover }}
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        );

      default:
        return (
          <p className="text-sm whitespace-pre-wrap break-words">
            {mensagem.conteudo || mensagem.mensagem}
          </p>
        );
    }
  };

  return (
    <div 
      className={`flex ${ehMinha ? 'justify-end' : 'justify-start'} mb-2 group`}
    >
      <div 
        className={`relative max-w-[70%] px-4 py-2 rounded-2xl shadow-sm ${temaEscuro ? '' : 'light-theme'}`}
        style={{
          backgroundColor: ehMinha ? tema.balaoEnviada : tema.balaoRecebida,
          color: tema.texto,
          borderTopRightRadius: ehMinha ? '4px' : '16px',
          borderTopLeftRadius: ehMinha ? '16px' : '4px'
        }}
      >
        {/* Mensagem Citada */}
        {mensagem.replyTo && (
          <div 
            className="mb-2 pl-3 border-l-4 py-1"
            style={{ 
              borderColor: tema.verde,
              backgroundColor: 'rgba(0,0,0,0.05)'
            }}
          >
            <p 
              className="text-xs font-semibold mb-0.5"
              style={{ color: tema.verde }}
            >
              {mensagem.replyTo.remetente?.nome || 'Você'}
            </p>
            <p 
              className="text-xs truncate"
              style={{ color: tema.textoSecundario }}
            >
              {mensagem.replyTo.conteudo}
            </p>
          </div>
        )}

        {/* Conteúdo */}
        {renderConteudo()}

        {/* Footer com horário e status */}
        <div className="flex items-center justify-end gap-1 mt-1">
          <span 
            className="text-[10px] font-medium"
            style={{ color: tema.textoSecundario }}
          >
            {formatarHorario(mensagem.enviadaEm || mensagem.timestamp || mensagem.criadaEm)}
          </span>
          {renderStatusIcon()}
        </div>

        {/* Menu de opções (visível no hover) */}
        <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => setMenuAberto(!menuAberto)}
            className="p-1.5 rounded-lg transition-all hover:scale-110"
            style={{ backgroundColor: 'rgba(0,0,0,0.1)' }}
          >
            <MoreVertical className="w-3.5 h-3.5" />
          </button>

          {menuAberto && (
            <>
              <div 
                className="fixed inset-0 z-40"
                onClick={() => setMenuAberto(false)}
              />
              
              <div
                className="absolute top-full right-0 mt-1 z-50 rounded-xl shadow-2xl border overflow-hidden animate-scaleIn"
                style={{
                  minWidth: '180px',
                  backgroundColor: tema.fundo,
                  borderColor: tema.borda
                }}
              >
                <button
                  onClick={() => {
                    onReply(mensagem);
                    setMenuAberto(false);
                  }}
                  className="w-full px-4 py-2.5 text-left text-sm font-semibold flex items-center gap-3 transition-all hover:scale-[1.02]"
                  style={{ color: tema.texto }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = tema.hover}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <Reply className="w-4 h-4" />
                  Responder
                </button>

                <button
                  className="w-full px-4 py-2.5 text-left text-sm font-semibold flex items-center gap-3 transition-all hover:scale-[1.02]"
                  style={{ color: tema.texto }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = tema.hover}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <Forward className="w-4 h-4" />
                  Encaminhar
                </button>

                <button
                  className="w-full px-4 py-2.5 text-left text-sm font-semibold flex items-center gap-3 transition-all hover:scale-[1.02]"
                  style={{ color: tema.texto }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = tema.hover}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <Copy className="w-4 h-4" />
                  Copiar
                </button>

                {ehMinha && (
                  <>
                    <div 
                      className="h-px"
                      style={{ backgroundColor: tema.borda }}
                    />
                    
                    <button
                      onClick={() => {
                        onDelete(mensagem.id);
                        setMenuAberto(false);
                      }}
                      className="w-full px-4 py-2.5 text-left text-sm font-semibold flex items-center gap-3 transition-all hover:scale-[1.02]"
                      style={{ color: '#ef4444' }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <Trash2 className="w-4 h-4" />
                      Apagar
                    </button>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      <style>{`
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }

        .animate-scaleIn {
          animation: scaleIn 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }
      `}</style>
    </div>
  );
}