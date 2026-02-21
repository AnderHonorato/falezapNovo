// frontend/src/componentes/ModalConfirmacao.jsx

import React from 'react';
import { AlertTriangle, Trash2, Ban, Check, X } from 'lucide-react';
import { useTema } from '../contextos/TemaContexto';
import './mensagens/css/Modais.css';

export default function ModalConfirmacao({ 
  isOpen, 
  onClose, 
  onConfirm, 
  titulo, 
  mensagem, 
  tipo = 'danger', // 'danger' ou 'warning'
  textoBotaoConfirmar = 'Confirmar',
  textoBotaoCancelar = 'Cancelar'
}) {
  const { temaEscuro } = useTema();

  if (!isOpen) return null;

  const getIcone = () => {
    if (tipo === 'danger') {
      return <Trash2 className="w-5 h-5" />;
    }
    return <AlertTriangle className="w-5 h-5" />;
  };

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <div className="modal-confirm-overlay" onClick={onClose}>
      <div 
        className={`modal-confirm-container ${temaEscuro ? '' : 'light-theme'}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header com ícone */}
        <div className="modal-confirm-header">
          <div className={`modal-confirm-icon ${tipo}`}>
            {getIcone()}
          </div>
          <div className="modal-confirm-text">
            <h3 className="modal-confirm-title">{titulo}</h3>
            <p className="modal-confirm-message">{mensagem}</p>
          </div>
        </div>

        {/* Botões de ação */}
        <div className="modal-confirm-actions">
          <button 
            onClick={onClose}
            className="modal-confirm-btn cancel"
          >
            <X className="w-4 h-4" />
            {textoBotaoCancelar}
          </button>
          
          <button 
            onClick={handleConfirm}
            className={`modal-confirm-btn confirm-${tipo}`}
          >
            <Check className="w-4 h-4" />
            {textoBotaoConfirmar}
          </button>
        </div>
      </div>
    </div>
  );
}