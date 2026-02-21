// frontend/src/components/MenuContexto.jsx

import React, { useEffect, useRef, useState } from 'react';
import { FiChevronRight } from 'react-icons/fi';

const MenuContexto = ({ opcoes, onFechar, x, y }) => {
  const menuRef = useRef(null);
  const [submenuAberto, setSubmenuAberto] = useState(null);
  const [posicao, setPosicao] = useState({ x: 0, y: 0, opacity: 0 });

  useEffect(() => {
    if (menuRef.current) {
      const rect = menuRef.current.getBoundingClientRect();
      const screenW = window.innerWidth;
      const screenH = window.innerHeight;

      let posX = x;
      let posY = y;

      // Ajusta para não sair da tela
      if (x + rect.width > screenW - 16) {
        posX = x - rect.width;
      }
      if (y + rect.height > screenH - 16) {
        posY = y - rect.height;
      }

      setPosicao({ x: posX, y: posY, opacity: 1 });
    }
  }, [x, y]);

  useEffect(() => {
    const handleClickFora = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        onFechar();
      }
    };

    document.addEventListener('mousedown', handleClickFora);
    document.addEventListener('contextmenu', handleClickFora); // Fecha em outro clique direito
    return () => {
      document.removeEventListener('mousedown', handleClickFora);
      document.removeEventListener('contextmenu', handleClickFora);
    };
  }, [onFechar]);

  return (
    <div
      ref={menuRef}
      className="menu-contexto-container"
      style={{
        top: `${posicao.y}px`,
        left: `${posicao.x}px`,
        opacity: posicao.opacity
      }}
    >
      {opcoes.map((opcao, index) => (
        <div key={index} className="relative">
          <button
            onClick={() => {
              if (opcao.submenu) {
                setSubmenuAberto(submenuAberto === index ? null : index);
              } else {
                opcao.onClick();
                onFechar();
              }
            }}
            className={`menu-contexto-item ${opcao.className || ''}`}
          >
            {opcao.icon && <opcao.icon size={16} />}
            <span className="flex-1">{opcao.label}</span>
            {opcao.submenu && <FiChevronRight size={16} />}
          </button>

          {/* Submenu (estilizado) */}
          {opcao.submenu && submenuAberto === index && (
            <div className="menu-contexto-submenu">
              {opcao.submenu.map((subOpcao, subIndex) => (
                <button
                  key={subIndex}
                  onClick={() => {
                    subOpcao.onClick();
                    onFechar();
                  }}
                  className="menu-contexto-item"
                >
                  {subOpcao.label}
                </button>
              ))}
            </div>
          )}
        </div>
      ))}

      {/* Estilos CSS Injetados para o Menu */}
      <style>{`
        .menu-contexto-container {
          position: fixed;
          z-index: 1000;
          min-width: 220px;
          background-color: #233138; /* Cor escura */
          border-radius: 1rem; /* ✅ 16px (2xl) */
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
          padding: 8px;
          border: 1px solid #2a3942;
          animation: scaleIn 0.15s cubic-bezier(0.16, 1, 0.3, 1);
          transition: opacity 0.1s ease;
        }

        .light-theme .menu-contexto-container {
          background-color: #ffffff;
          border-color: #e9edef;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
        }

        .menu-contexto-item {
          width: 100%;
          padding: 10px 16px;
          border-radius: 8px;
          border: none;
          background: transparent;
          color: #e9edef;
          font-size: 14px;
          font-weight: 500;
          text-align: left;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 12px;
          transition: background-color 0.1s ease;
        }

        .light-theme .menu-contexto-item {
          color: #111b21;
        }

        .menu-contexto-item:hover {
          background-color: #182229;
        }

        .light-theme .menu-contexto-item:hover {
          background-color: #f5f6f6;
        }
        
        .menu-contexto-item.text-red-500 {
          color: #ef4444;
        }
        .menu-contexto-item.text-red-500:hover {
          background-color: rgba(239, 68, 68, 0.1);
        }

        .menu-contexto-submenu {
          position: absolute;
          left: 100%;
          top: -8px; /* Alinha com o item pai */
          margin-left: 8px;
          min-width: 160px;
          background-color: #233138;
          border-radius: 1rem;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
          padding: 8px;
          border: 1px solid #2a3942;
          animation: slideIn 0.15s ease-out;
        }

        .light-theme .menu-contexto-submenu {
          background-color: #ffffff;
          border-color: #e9edef;
        }

        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }

        @keyframes slideIn {
          from { opacity: 0; transform: translateX(-10px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  );
};

export default MenuContexto;