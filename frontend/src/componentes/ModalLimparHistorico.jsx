// frontend/src/componentes/ModalLimparHistorico.jsx

import React from 'react';
import { X, Trash2, AlertTriangle } from 'lucide-react';
import { useTema } from '../contextos/TemaContexto';
import './mensagens/css/Modais.css';

export default function ModalLimparHistorico({ isOpen, onClose, onConfirm, nomeContato }) {
  const { temaEscuro } = useTema();

  if (!isOpen) return null;

  return (
    <div className="modal-confirm-overlay" onClick={onClose}>
      <div 
        className={`modal-confirm-container ${temaEscuro ? '' : 'light-theme'}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-confirm-header">
          <div className="modal-confirm-icon danger">
            <Trash2 size={20} />
          </div>
          <div className="modal-confirm-text">
            <h3 className="modal-confirm-title">Limpar Mensagens</h3>
            <p className="modal-confirm-message">
              Todas as mensagens da conversa com <strong>{nomeContato}</strong> serão permanentemente excluídas. Esta ação não pode ser revertida.
            </p>
          </div>
        </div>

        <div className="modal-confirm-actions">
          <button className="modal-confirm-btn cancel" onClick={onClose}>
            Cancelar
          </button>
          <button className="modal-confirm-btn confirm-danger" onClick={onConfirm}>
            <Trash2 size={14} />
            Sim, limpar tudo
          </button>
        </div>
      </div>
    </div>
  );
}