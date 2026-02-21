// frontend/src/componentes/SeletorAnexos.jsx - CORRIGIDO (com estilos inline)

import React from 'react';
import { Image, Video, FileText, User, X } from 'lucide-react';
// ✅ 1. CSS importado para layout (caminho corrigido)
import './mensagens/css/SeletorEmoji.css'; 
import { useTema } from '../contextos/TemaContexto'; 

export default function SeletorAnexos({ aberto, onFechar, onSelecionarArquivo, position }) {
  // ✅ 2. Usar o hook
  const { temaEscuro } = useTema(); 

  if (!aberto) return null;

  const opcoes = [
    { 
      tipo: 'fotos-videos', 
      icone: Image, 
      label: 'Fotos e vídeos', 
      cor: '#8b5cf6',
      accept: 'image/*,video/*'
    },
    { 
      tipo: 'documento', 
      icone: FileText, 
      label: 'Documento', 
      cor: '#3b82f6',
      accept: '.pdf,.doc,.docx,.xls,.xlsx,.txt,.zip'
    },
    { 
      tipo: 'contato', 
      icone: User, 
      label: 'Contato', 
      cor: '#10b981',
      accept: null // Contato não usa input file
    }
  ];

  // ✅ 3. DEFINIR ESTILOS INLINE BASEADOS NO TEMA
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
  
  const tituloStyle = {
    color: temaEscuro ? '#e2e8f0' : '#1e293b'
  };
  
  const labelStyle = {
     color: temaEscuro ? '#e2e8f0' : '#1e293b'
  };
  
  const fecharBtnStyle = {
      background: temaEscuro ? 'rgba(148, 163, 184, 0.1)' : 'rgba(226, 232, 240, 0.5)',
      color: temaEscuro ? '#94a3b8' : '#64748b'
  };


  return (
    <>
      {/* Overlay */}
      <div onClick={onFechar} style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1040,
        background: 'transparent'
      }} />
      
      {/* ✅ 4. Aplicar estilos inline - REMOVIDA A CLASSE 'light-theme' */}
      <div
        className="anexos-container"
        style={containerStyle}
      >
        {/* Header */}
        <div className="anexos-header" style={headerStyle}>
          <span className="anexos-titulo" style={tituloStyle}>Selecionar anexo</span>
          <button onClick={onFechar} className="anexos-fechar-btn" style={fecharBtnStyle}>
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Lista de Opções */}
        <div className="anexos-opcoes-lista">
          {opcoes.map((opcao) => {
            const Icone = opcao.icone;
            return (
              <button
                key={opcao.tipo}
                onClick={() => {
                  onSelecionarArquivo(opcao.tipo, opcao.accept);
                  onFechar();
                }}
                className="anexos-opcao-btn"
              >
                <div 
                  className="anexos-icon-wrapper"
                  style={{ '--cor-base': opcao.cor }}
                >
                  <Icone size={20} />
                </div>
                <span className="anexos-label" style={labelStyle}>{opcao.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}