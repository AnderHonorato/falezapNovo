// frontend/src/componentes/ModalFecharConversa.jsx

import React from 'react';
import { X, LogOut, AlertTriangle } from 'lucide-react';
import { useTema } from '../contextos/TemaContexto';
import './mensagens/css/Modais.css';

export default function ModalFecharConversa({ isOpen, onClose, onConfirm, nomeContato }) {
  const { temaEscuro } = useTema();

  if (!isOpen) return null;

  return (
    <div className="modal-confirm-overlay" onClick={onClose}>
      <div 
        className={`modal-confirm-container ${temaEscuro ? '' : 'light-theme'}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-confirm-header">
          <div className="modal-confirm-icon warning">
            <LogOut size={20} />
          </div>
          <div className="modal-confirm-text">
            <h3 className="modal-confirm-title">Fechar Conversa</h3>
            <p className="modal-confirm-message">
              Tem certeza que deseja fechar a conversa com <strong>{nomeContato}</strong>?
            </p>
          </div>
        </div>

        <div className="modal-confirm-actions">
          <button className="modal-confirm-btn cancel" onClick={onClose}>
            Cancelar
          </button>
          <button className="modal-confirm-btn confirm-warning" onClick={onConfirm}>
            <LogOut size={14} />
            Sim, fechar
          </button>
        </div>
      </div>
    </div>
  );
}