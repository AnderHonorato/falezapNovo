// src/hooks/usePerfilWhatsApp.js - Hook para buscar perfil do WhatsApp

import { useState, useEffect } from 'react';
import api from '../servicos/api';

export const usePerfilWhatsApp = (numero) => {
  const [perfil, setPerfil] = useState({
    nome: null,
    foto: null,
    sobre: null,
    carregando: true,
    erro: null
  });

  useEffect(() => {
    if (!numero) {
      setPerfil(prev => ({ ...prev, carregando: false }));
      return;
    }

    let cancelado = false;

    const buscarPerfil = async () => {
      try {
        setPerfil(prev => ({ ...prev, carregando: true, erro: null }));
        
        // Limpar número (remover formatação)
        const numeroLimpo = numero.replace(/\D/g, '');
        
        const response = await api.get(`/whatsapp/perfil/${numeroLimpo}`);
        
        if (!cancelado) {
          setPerfil({
            nome: response.data.nome || null,
            foto: response.data.foto || null,
            sobre: response.data.sobre || null,
            carregando: false,
            erro: null
          });
        }
      } catch (error) {
        if (!cancelado) {
          console.error('Erro ao buscar perfil WhatsApp:', error);
          setPerfil({
            nome: null,
            foto: null,
            sobre: null,
            carregando: false,
            erro: error.message
          });
        }
      }
    };

    buscarPerfil();

    return () => {
      cancelado = true;
    };
  }, [numero]);

  return perfil;
};

export default usePerfilWhatsApp;