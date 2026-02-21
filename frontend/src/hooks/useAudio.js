// frontend/src/hooks/useAudio.js

import { useCallback } from 'react';

// URLs de áudio (Substitua por suas URLs reais)
const AUDIO_URLS = {
  RECEBER: 'https://jumpshare.com/s/fybiqkvYf1LPyrapYPO2',
  ENVIAR: 'https://jumpshare.com/share/wGChGansJRRdevVxFATV',
  ALERTA: 'https://jumpshare.com/share/zclOcFGrGzB6Tt2kkOCw',
  NOTIFICACAO: 'https://jumpshare.com/s/fybiqkvYf1LPyrapYPO2',
};

const useAudio = (tipo) => {
  const url = AUDIO_URLS[tipo.toUpperCase()] || AUDIO_URLS.NOTIFICACAO;
  
  // Cria uma instância de Audio na primeira chamada e memoriza
  // Nota: Browsers modernos podem exigir interação do usuário para tocar áudio.
  const play = useCallback(() => {
    if (url) {
      const audio = new Audio(url);
      audio.currentTime = 0; // Reinicia o áudio
      audio.volume = 0.5; // Ajuste o volume se necessário
      audio.play().catch(e => {
        // console.warn(`[Audio] Falha ao tocar ${tipo}:`, e.message);
      });
    }
  }, [url]);

  return play;
};

export default useAudio;