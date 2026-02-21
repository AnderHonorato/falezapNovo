// frontend/src/componentes/mensagens/ModalPerfil.jsx

import React from 'react';
import { X, User, Mail, Phone, Building, Briefcase, Calendar } from 'lucide-react';
import { useTema } from '../../contextos/TemaContexto';
import './css/ModalPerfil.css';

export default function ModalPerfil({ isOpen, onClose, usuario }) {
  const { temaEscuro } = useTema();

  if (!isOpen || !usuario) return null;

  const getTipoUsuario = (tipo) => {
    switch(tipo) {
      case 'OWNER': return 'Proprietário';
      case 'ADMIN_EMPRESA': return 'Administrador';
      case 'USUARIO': return 'Colaborador';
      default: return 'Usuário';
    }
  };

  // Ícones simplificados e labels claras
  const infos = [
    { icone: Mail, label: 'E-mail', valor: usuario.email },
    { icone: Phone, label: 'Telefone', valor: usuario.telefone || 'Não informado' },
    { icone: Building, label: 'Empresa', valor: usuario.empresa?.nome || 'Sem empresa' },
    { icone: Briefcase, label: 'Cargo', valor: usuario.cargo || 'Não informado' },
    {
      icone: Calendar,
      label: 'Membro desde',
      valor: usuario.criadoEm ? new Date(usuario.criadoEm).toLocaleDateString('pt-BR', {
        month: 'short', year: 'numeric'
      }) : 'N/A',
    },
  ];

  return (
    <div className="modal-perfil-overlay" onClick={onClose}>
      <div 
        className={`modal-perfil-container ${temaEscuro ? 'tema-escuro' : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div className="modal-perfil-header">
          <button onClick={onClose} className="modal-perfil-close" title="Fechar">
            <X size={20} />
          </button>
          
          <div className="perfil-avatar-wrapper">
            {usuario.foto || usuario.avatar ? (
              <img 
                src={usuario.foto || usuario.avatar} 
                alt={usuario.nome} 
                className="perfil-avatar-img"
              />
            ) : (
              <div className="perfil-avatar-placeholder">
                <User size={40} />
              </div>
            )}
          </div>
          
          <h3 className="perfil-nome">{usuario.nome}</h3>
          <span className="perfil-role-badge">{getTipoUsuario(usuario.tipo)}</span>
        </div>

        {/* LISTA DE INFORMAÇÕES */}
        <div className="modal-perfil-content">
          {infos.map((info, idx) => (
            <div key={idx} className="perfil-info-item">
              <div className="perfil-icon-box">
                <info.icone size={18} />
              </div>
              <div className="perfil-info-data">
                <p className="perfil-label">{info.label}</p>
                <p className="perfil-value">{info.valor}</p>
              </div>
            </div>
          ))}
        </div>

        {/* FOOTER */}
        <div className="modal-perfil-footer">
          <button onClick={onClose} className="perfil-btn-close">
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}