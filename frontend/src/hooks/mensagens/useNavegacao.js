// frontend/src/hooks/mensagens/useNavegacao.js
import { useEffect } from 'react';
import { LARGURA_SIDEBAR_MIN, LARGURA_SIDEBAR_MAX } from './constants';

export function useNavegacao(estados) {
  const {
    menuExpandido, setMenuExpandido,
    secaoAtiva, setSecaoAtiva,
    perfilAberto, setPerfilAberto,
    redimensionando, setRedimensionando,
    larguraSidebar, setLarguraSidebar,
  } = estados;

  // Menu
  const toggleMenuExpandido = () => {
    setMenuExpandido(prev => !prev);
  };

  const selecionarSecao = (secao) => {
    setSecaoAtiva(secao);
  };

  // Perfil
  const abrirPerfil = () => {
    setPerfilAberto(true);
  };

  const fecharPerfil = () => {
    setPerfilAberto(false);
  };

  // Redimensionamento
  const iniciarRedimensionamento = () => {
    setRedimensionando(true);
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (redimensionando) {
        const novaLargura = e.clientX;
        if (novaLargura >= LARGURA_SIDEBAR_MIN && novaLargura <= LARGURA_SIDEBAR_MAX) {
          setLarguraSidebar(novaLargura);
        }
      }
    };

    const handleMouseUp = () => {
      setRedimensionando(false);
    };

    if (redimensionando) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [redimensionando]);

  return {
    toggleMenuExpandido,
    selecionarSecao,
    abrirPerfil,
    fecharPerfil,
    iniciarRedimensionamento,
  };
}