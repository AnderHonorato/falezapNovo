// frontend/src/contextos/TemaContexto.jsx

import React, { createContext, useContext, useState, useEffect } from 'react';

// O Contexto é exportado (correto)
export const TemaContext = createContext();

export const useTema = () => {
  const context = useContext(TemaContext);
  if (!context) {
    throw new Error('useTema deve ser usado dentro de TemaProvider');
  }
  return context;
};

// ... (definições de temaClaro e temaEscuroObj permanecem inalteradas) ...
const temaClaro = {
  // Backgrounds
  bg: '#f0f2f5',
  fundo: '#ffffff',
  sidebar: '#ffffff',
  hover: '#f5f6f6',
  input: '#ffffff',
  inputBg: '#f0f2f5',
  
  // Bordas e Divisores
  borda: '#e9edef',
  divisor: '#e9edef',
  
  // Textos
  texto: '#111b21',
  textoSecundario: '#667781',
  textoTerciario: '#8696a0',
  
  // Balões de Mensagem
  balaoEnviada: '#d9fdd3',
  balaoRecebida: '#ffffff',
  
  // Cores Principais
  verde: '#00a884',
  verdeHover: '#008f72',
  verdeClaro: '#d1f4e0',
  azulLeitura: '#53bdeb',
  
  // Avatar
  avatar: '#dfe5e7',
  avatarTexto: '#667781',
  
  // Sombras Material Design 3
  sombra1: '0 1px 2px rgba(0,0,0,0.08)',
  sombra2: '0 2px 4px rgba(0,0,0,0.08)',
  sombra3: '0 4px 8px rgba(0,0,0,0.08)',
  sombra4: '0 8px 16px rgba(0,0,0,0.08)',
  
  // Elevação
  elevacao1: '0 1px 3px rgba(0,0,0,0.04)',
  elevacao2: '0 2px 8px rgba(0,0,0,0.06)',
  elevacao3: '0 4px 12px rgba(0,0,0,0.08)',
  
  // Badge e Status
  badgeVerde: '#25d366',
  badgeVermelho: '#f44336',
  badgeAmarelo: '#ffc107',
  
  // Hover States
  hoverChat: '#f5f6f6',
  hoverBotao: '#f0f2f5',
  
  // Ripple Effect
  ripple: 'rgba(0, 0, 0, 0.1)'
};

const temaEscuroObj = {
  // Backgrounds
  bg: '#0b141a',
  fundo: '#111b21',
  sidebar: '#111b21',
  hover: '#2a3942',
  input: '#2a3942',
  inputBg: '#2a3942',
  
  // Bordas e Divisores
  borda: '#2a3942',
  divisor: '#2a3942',
  
  // Textos
  texto: '#e9edef',
  textoSecundario: '#8696a0',
  textoTerciario: '#667781',
  
  // Balões de Mensagem
  balaoEnviada: '#005c4b',
  balaoRecebida: '#202c33',
  
  // Cores Principais
  verde: '#00a884',
  verdeHover: '#06cf9c',
  verdeClaro: '#005c4b',
  azulLeitura: '#53bdeb',
  
  // Avatar
  avatar: '#3b4a54',
  avatarTexto: '#d1d7db',
  
  // Sombras Material Design 3 (mais intensas no escuro)
  sombra1: '0 1px 2px rgba(0,0,0,0.3)',
  sombra2: '0 2px 4px rgba(0,0,0,0.3)',
  sombra3: '0 4px 8px rgba(0,0,0,0.4)',
  sombra4: '0 8px 16px rgba(0,0,0,0.4)',
  
  // Elevação
  elevacao1: '0 1px 3px rgba(0,0,0,0.3)',
  elevacao2: '0 2px 8px rgba(0,0,0,0.4)',
  elevacao3: '0 4px 12px rgba(0,0,0,0.5)',
  
  // Badge e Status
  badgeVerde: '#25d366',
  badgeVermelho: '#f44336',
  badgeAmarelo: '#ffc107',
  
  // Hover States
  hoverChat: '#2a3942',
  hoverBotao: '#182229',
  
  // Ripple Effect
  ripple: 'rgba(255, 255, 255, 0.1)'
};


export const TemaProvider = ({ children }) => {
  const [temaEscuro, setTemaEscuro] = useState(() => {
    const saved = localStorage.getItem('falezap-tema-escuro');
    // ✅ MUDANÇA: O padrão agora é 'false' (tema claro)
    return saved ? JSON.parse(saved) : false;
  });

  useEffect(() => {
    localStorage.setItem('falezap-tema-escuro', JSON.stringify(temaEscuro));
  }, [temaEscuro]);

  const tema = temaEscuro ? temaEscuroObj : temaClaro;

  return (
    <TemaContext.Provider value={{ tema, temaEscuro, setTemaEscuro }}>
      {children}
    </TemaContext.Provider>
  );
};