// frontend/src/componentes/StatusIndicador.jsx

import React from 'react';

export default function StatusIndicador({ status, tamanho = 'md' }) {
  const cores = {
    disponivel: '#25d366',
    ausente: '#f59e0b',
    almoco: '#f97316',
    fora_servico: '#ef4444',
    offline: '#6b7280'
  };

  const tamanhos = {
    sm: { width: 8, height: 8 },
    md: { width: 10, height: 10 },
    lg: { width: 12, height: 12 }
  };

  const cor = cores[status] || cores.offline;
  const dimensao = tamanhos[tamanho] || tamanhos.md;

  return (
    <div
      style={{
        width: dimensao.width,
        height: dimensao.height,
        borderRadius: '50%',
        backgroundColor: cor,
        border: '2px solid #ffffff',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.2)',
        flexShrink: 0
      }}
    />
  );
}