// frontend/src/componentes/comum/TemaWrapper.jsx
// ✅ Componente que FORÇA o tema em toda a aplicação

import { useEffect } from 'react';
import { useTema } from '../../contextos/TemaContexto.jsx';

export default function TemaWrapper({ children }) {
  const { tema, temaAtual } = useTema();

  useEffect(() => {
    // Aplica o tema globalmente
    const root = document.getElementById('root');
    const body = document.body;
    const html = document.documentElement;

    // Define data-tema
    body.setAttribute('data-tema', temaAtual);
    html.setAttribute('data-tema', temaAtual);
    if (root) root.setAttribute('data-tema', temaAtual);

    // Aplica estilos inline para garantir
    const estilos = {
      backgroundColor: tema.fundo,
      color: tema.texto,
      minHeight: '100vh',
      height: '100%',
      overflow: 'hidden'
    };

    Object.assign(body.style, estilos);
    Object.assign(html.style, {
      backgroundColor: tema.fundo,
      height: '100%',
      overflow: 'hidden'
    });
    
    if (root) {
      Object.assign(root.style, estilos);
    }

  }, [tema, temaAtual]);

  return (
    <div
      className="theme-wrapper"
      style={{
        backgroundColor: tema.fundo,
        color: tema.texto,
        minHeight: '100vh',
        height: '100%',
        width: '100%',
        overflow: 'hidden'
      }}
    >
      {children}
    </div>
  );
}