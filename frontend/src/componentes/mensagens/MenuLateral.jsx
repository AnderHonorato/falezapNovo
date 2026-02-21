// frontend/src/componentes/mensagens/MenuLateral.jsx - ✅ VERSÃO FINAL ATUALIZADA (TEMA ESCURO)

import React, { useRef, useState, useEffect } from 'react';
import {
  MessageSquare,
  Users,
  Archive,
  Star,
  Settings,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  UserPlus
} from 'lucide-react';
import { useTema } from '../../contextos/TemaContexto';
import './css/MenuLateral.css';

// Hook para detectar clique fora
function useOnClickOutside(ref, handler, isEnabled) {
  useEffect(() => {
    if (!isEnabled) return;

    const listener = (event) => {
      if (!ref.current || ref.current.contains(event.target)) return;
      handler(event);
    };

    document.addEventListener('mousedown', listener);
    document.addEventListener('touchstart', listener);

    return () => {
      document.removeEventListener('mousedown', listener);
      document.removeEventListener('touchstart', listener);
    };
  }, [ref, handler, isEnabled]);
}

export default function MenuLateral({ secaoAtiva, setSecaoAtiva, onMenuAction }) {
  const { temaEscuro } = useTema();
  const [expandido, setExpandido] = useState(false);
  const menuRef = useRef();

  // Fecha o menu ao clicar fora
  useOnClickOutside(menuRef, () => setExpandido(false), expandido);

  const menuItemsMain = [
    { id: 'conversas', icon: MessageSquare, label: 'Conversas', cor: '#10b981' },
    { id: 'grupos', icon: Users, label: 'Grupos', cor: '#3b82f6' },
    { id: 'arquivadas', icon: Archive, label: 'Arquivadas', cor: '#8b5cf6' },
    { id: 'favoritas', icon: Star, label: 'Favoritas', cor: '#f59e0b' }
  ];

  const menuItemsBottom = [
    { id: 'contatos', icon: UserPlus, label: 'Contatos', cor: '#ec4899', isAction: true },
    { id: 'configuracoes', icon: Settings, label: 'Configurações', cor: '#6b7280', isAction: true }
  ];

  const handleItemClick = (item) => {
    if (item.isAction) {
      if (onMenuAction) onMenuAction(item.id);
    } else {
      setSecaoAtiva(item.id);
    }
  };

  const renderItem = (item) => {
    const Icon = item.icon;
    const isAtivo = !item.isAction && secaoAtiva === item.id;

    return (
      <button
        key={item.id}
        data-id={item.id} 
        onClick={() => handleItemClick(item)}
        className={`menu-item-btn ${isAtivo ? 'ativo' : ''}`}
        title={!expandido ? item.label : ''}
      >
        <div
          className="menu-item-icon-wrapper"
          style={{
            // Ajuste sutil na opacidade para dark mode
            backgroundColor: isAtivo 
              ? (temaEscuro ? item.cor + '25' : item.cor + '15') 
              : undefined // Deixa o CSS controlar o background inativo
          }}
        >
          <Icon
            className="w-5 h-5"
            style={{
              color: isAtivo ? item.cor : undefined // Deixa o CSS controlar a cor inativa
            }}
          />
        </div>

        {expandido && (
          <span className="menu-item-label">
            {item.label}
          </span>
        )}
      </button>
    );
  };

  return (
    <div
      ref={menuRef}
      // ✅ APLICA A CLASSE 'tema-escuro' QUANDO ATIVO
      className={`menu-lateral-container ${expandido ? 'expandido' : 'recolhido'} ${temaEscuro ? 'tema-escuro' : ''}`}
    >
      {/* HEADER */}
      <div className="menu-lateral-header">
        {expandido ? (
          <>
            <div className="menu-lateral-logo-wrapper">
              <div className="menu-lateral-logo">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <h2 className="menu-lateral-titulo">FaleZap</h2>
            </div>
            
            <button
              className="menu-toggle-btn"
              onClick={() => setExpandido(false)}
              title="Recolher menu"
            >
              <ChevronLeft size={18} />
            </button>
          </>
        ) : (
          <button
            className="menu-toggle-btn"
            onClick={() => setExpandido(true)}
            title="Expandir menu"
          >
            <ChevronRight size={18} />
          </button>
        )}
      </div>

      {/* BODY */}
      <div className="menu-lateral-body">
        <div className="menu-lateral-items-top">
          {menuItemsMain.map(item => renderItem(item))}
        </div>

        <div className="menu-spacer"></div>

        <div className="menu-lateral-items-bottom">
          {menuItemsBottom.map(item => renderItem(item))}
        </div>
      </div>

      {/* FOOTER */}
      {expandido && (
        <div className="menu-lateral-footer">
          <p>© 2025 FaleZap</p>
        </div>
      )}
    </div>
  );
}