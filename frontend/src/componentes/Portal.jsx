// frontend/src/componentes/Portal.jsx

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

// ID do elemento global no body onde o menu será anexado
const PORTAL_ROOT_ID = 'chat-portal-root';

/**
 * Componente que "teletransporta" o conteúdo (menu) para fora da hierarquia DOM
 * para garantir que não fique preso por `overflow: hidden` ou `transform`.
 */
const Portal = ({ children }) => {
  // Estado para armazenar o nó DOM onde o conteúdo será montado
  const [wrapperElement, setWrapperElement] = useState(null);

  useEffect(() => {
    // 1. Encontra ou cria o container principal (portal-root) no body
    let portalRoot = document.getElementById(PORTAL_ROOT_ID);
    if (!portalRoot) {
      portalRoot = document.createElement('div');
      portalRoot.id = PORTAL_ROOT_ID;
      document.body.appendChild(portalRoot);
    }
    
    // 2. Cria um wrapper para este Portal específico
    const wrapper = document.createElement('div');
    portalRoot.appendChild(wrapper); 
    setWrapperElement(wrapper);

    // 3. Limpeza: remove o wrapper ao desmontar
    return () => {
      if (portalRoot && wrapper) {
        portalRoot.removeChild(wrapper);
      }
    };
  }, []); // Executa apenas na montagem

  // Não renderiza nada até que o nó DOM esteja pronto
  if (wrapperElement === null) {
    return null;
  }

  // 4. Usa createPortal para renderizar os filhos (o menu) no elemento do body
  return createPortal(children, wrapperElement);
};

export default Portal;