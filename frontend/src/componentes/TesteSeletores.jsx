// frontend/src/componentes/TesteSeleto res.jsx
// COMPONENTE DE TESTE PARA VERIFICAR SE OS SELETORES APARECEM

import React, { useState } from 'react';
import SeletorEmoji from './SeletorEmoji';
import SeletorAnexos from './SeletorAnexos';

export default function TesteSeletores() {
  const [mostrarEmojis, setMostrarEmojis] = useState(false);
  const [mostrarAnexos, setMostrarAnexos] = useState(false);
  const [posicaoEmoji, setPosicaoEmoji] = useState({ top: 200, left: 200 });
  const [posicaoAnexo, setPosicaoAnexo] = useState({ top: 200, left: 500 });

  const tema = {
    escuro: true,
    verde: '#10b981'
  };

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      background: '#1a1a1a',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '20px',
      position: 'relative'
    }}>
      
      <button
        onClick={() => setMostrarEmojis(!mostrarEmojis)}
        style={{
          padding: '12px 24px',
          background: '#10b981',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          fontSize: '16px',
          fontWeight: 'bold',
          cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(16, 185, 129, 0.4)'
        }}
      >
        {mostrarEmojis ? 'Fechar' : 'Abrir'} Emojis
      </button>

      <button
        onClick={() => setMostrarAnexos(!mostrarAnexos)}
        style={{
          padding: '12px 24px',
          background: '#3b82f6',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          fontSize: '16px',
          fontWeight: 'bold',
          cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(59, 130, 246, 0.4)'
        }}
      >
        {mostrarAnexos ? 'Fechar' : 'Abrir'} Anexos
      </button>

      {/* INFO DE DEBUG */}
      <div style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        background: 'rgba(0, 0, 0, 0.8)',
        padding: '20px',
        borderRadius: '12px',
        color: 'white',
        fontSize: '14px',
        fontFamily: 'monospace',
        maxWidth: '300px'
      }}>
        <h3 style={{ margin: '0 0 10px', color: '#10b981' }}>🔍 DEBUG</h3>
        <p>Emojis aberto: <strong>{mostrarEmojis ? '✅ SIM' : '❌ NÃO'}</strong></p>
        <p>Anexos aberto: <strong>{mostrarAnexos ? '✅ SIM' : '❌ NÃO'}</strong></p>
        <p>Posição Emoji: {posicaoEmoji.top}, {posicaoEmoji.left}</p>
        <p>Posição Anexo: {posicaoAnexo.top}, {posicaoAnexo.left}</p>
        <hr style={{ margin: '10px 0', border: '1px solid #333' }} />
        <p style={{ fontSize: '12px', color: '#888' }}>
          Se os seletores não aparecem, verifique:
        </p>
        <ul style={{ fontSize: '11px', margin: 0, paddingLeft: '20px', color: '#aaa' }}>
          <li>CSS importado corretamente</li>
          <li>Z-index no DevTools</li>
          <li>Position: fixed</li>
          <li>Console por erros</li>
        </ul>
      </div>

      {/* SELETORES */}
      <SeletorEmoji
        isOpen={mostrarEmojis}
        onSelectEmoji={(emoji) => {
          console.log('Emoji selecionado:', emoji);
          alert(`Emoji selecionado: ${emoji}`);
        }}
        onClose={() => setMostrarEmojis(false)}
        tema={tema}
        position={posicaoEmoji}
      />

      <SeletorAnexos
        aberto={mostrarAnexos}
        onFechar={() => setMostrarAnexos(false)}
        onSelecionarArquivo={(tipo, accept) => {
          console.log('Tipo selecionado:', tipo, accept);
          alert(`Tipo selecionado: ${tipo}`);
        }}
        tema={tema}
        position={posicaoAnexo}
      />

      {/* INSTRUÇÕES */}
      <div style={{
        position: 'fixed',
        bottom: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        background: 'rgba(16, 185, 129, 0.2)',
        border: '2px solid #10b981',
        padding: '15px 25px',
        borderRadius: '12px',
        color: 'white',
        textAlign: 'center'
      }}>
        <p style={{ margin: 0, fontSize: '14px', fontWeight: 'bold' }}>
          👆 Clique nos botões acima para testar os seletores
        </p>
        <p style={{ margin: '5px 0 0', fontSize: '12px', opacity: 0.8 }}>
          Abra o DevTools (F12) e veja a aba Elements para verificar o z-index
        </p>
      </div>
    </div>
  );
}