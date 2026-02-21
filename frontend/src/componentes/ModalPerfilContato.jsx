// frontend/src/componentes/ModalPerfilContato.jsx - ✅ VERSÃO FINAL SIDEBAR FOOTER

import React, { useState } from 'react';
import {
  X, Phone, Mail, User, Users, Star, Archive, Bell, BellOff, Trash2, Ban,
  Info, Image as ImageIcon, FileText, Link as LinkIcon, Lock, Wrench
} from 'lucide-react';
import { useTema } from '../contextos/TemaContexto';
import api from '../servicos/api';
import toast from 'react-hot-toast';
import ModalConfirmacao from './ModalConfirmacaoPerfilContato';
import './mensagens/css/ModalPerfilContato.css';

export default function ModalPerfilContato({ isOpen, onClose, contato, onAtualizarContato }) {
  const { temaEscuro } = useTema();
  const [tabAtiva, setTabAtiva] = useState('visao-geral');
  const [processando, setProcessando] = useState(false);
  const [modalConfirmacao, setModalConfirmacao] = useState({
    isOpen: false,
    tipo: 'danger',
    titulo: '',
    mensagem: '',
    onConfirm: () => {}
  });

  if (!isOpen || !contato) return null;

  const ehGrupo = contato.tipo === 'GRUPO' || contato.isGrupo;

  const formatarTelefone = (numero) => {
    if (!numero) return 'Não informado';
    const limpo = numero.replace(/\D/g, '');
    if (limpo.startsWith('55') && limpo.length >= 12) {
      return `+${limpo.slice(0, 2)} (${limpo.slice(2, 4)}) ${limpo.slice(4, 9)}-${limpo.slice(9)}`;
    }
    return numero;
  };

  const formatarData = (data) => {
    if (!data) return 'N/A';
    return new Date(data).toLocaleDateString('pt-BR');
  };

  const abrirConfirmacao = (tipo, titulo, mensagem, onConfirm) => {
    setModalConfirmacao({ isOpen: true, tipo, titulo, mensagem, onConfirm });
  };

  const handleAcaoRapida = async (acao) => {
    setProcessando(true);
    try {
      let response;
      switch (acao) {
        case 'favoritar':
          response = await api.put(`/conversas/acao/${contato.id}`, { acao: 'favoritar' });
          if (response.data.sucesso) {
            toast.success(contato.favorita ? 'Removido' : 'Favoritado');
            if (onAtualizarContato) onAtualizarContato({ ...contato, favorita: !contato.favorita });
          }
          break;
        case 'arquivar':
          response = await api.put(`/conversas/acao/${contato.id}`, { acao: 'arquivar' });
          if (response.data.sucesso) {
            toast.success('Arquivada');
            if (onAtualizarContato) onAtualizarContato({ ...contato, arquivada: true });
            onClose();
          }
          break;
        case 'silenciar':
          response = await api.put(`/conversas/acao/${contato.id}`, { acao: 'silenciar' });
          if (response.data.sucesso) {
            toast.success(contato.silenciada ? 'Ativado som' : 'Silenciado');
            if (onAtualizarContato) onAtualizarContato({ ...contato, silenciada: !contato.silenciada });
          }
          break;
        case 'bloquear':
          abrirConfirmacao('warning', 'Bloquear Contato', `Deseja bloquear ${contato.nomeCliente}?`, async () => {
            const resp = await api.post(`/conversas/${contato.id}/bloquear`);
            if (resp.data.sucesso) {
              toast.success('Bloqueado');
              onClose();
            }
          });
          return;
        case 'limpar':
          abrirConfirmacao('danger', 'Limpar Conversa', 'Isso apagará todas as mensagens desta conversa.', async () => {
            await api.delete(`/mensagens/conversa/${contato.id}`);
            toast.success('Histórico limpo');
          });
          return;
        default: break;
      }
    } catch (error) {
      toast.error('Erro na ação');
    } finally {
      setProcessando(false);
    }
  };

  const renderPlaceholder = (titulo, icone = Wrench) => {
    const Icon = icone;
    return (
      <div className="mpc-placeholder-tab">
        <Icon className="mpc-placeholder-icon" />
        <p className="mpc-placeholder-text">{titulo}</p>
        <p className="mpc-placeholder-sub">Em desenvolvimento</p>
      </div>
    );
  };

  const renderConteudo = () => {
    switch (tabAtiva) {
      case 'visao-geral':
        return (
          <div className="mpc-overview-content">
            <div className="mpc-profile-avatar">
              {contato.fotoPerfil || contato.foto_perfil ? (
                <img src={contato.fotoPerfil || contato.foto_perfil} alt={contato.nomeCliente} />
              ) : (
                <div className="mpc-profile-avatar-placeholder">
                  {ehGrupo ? <Users size={56} /> : <User size={56} />}
                </div>
              )}
            </div>
            
            <div className="mpc-profile-info">
              <h2 className="mpc-profile-name">{contato.nomeCliente || contato.numeroCliente}</h2>
              <p className="mpc-profile-phone">{formatarTelefone(contato.numeroCliente)}</p>
            </div>

            <div className="mpc-actions-row">
              <button 
                className={`mpc-action-item btn-fav ${contato.favorita ? 'active' : ''}`}
                onClick={() => handleAcaoRapida('favoritar')}
                title="Favoritar conversa"
              >
                <Star size={20} fill={contato.favorita ? "currentColor" : "none"} />
                <span>Favoritar</span>
              </button>
              
              <button 
                className={`mpc-action-item btn-mute ${contato.silenciada ? 'active' : ''}`}
                onClick={() => handleAcaoRapida('silenciar')}
                title="Silenciar notificações"
              >
                {contato.silenciada ? <BellOff size={20} /> : <Bell size={20} />}
                <span>Silenciar</span>
              </button>

              <button 
                className="mpc-action-item btn-archive"
                onClick={() => handleAcaoRapida('arquivar')}
                title="Arquivar conversa"
              >
                <Archive size={20} />
                <span>Arquivar</span>
              </button>
            </div>

            <div className="mpc-section">
              <p className="mpc-section-label">Recado</p>
              <p className="mpc-section-value">{contato.email || 'Disponível'}</p>
            </div>

            <div className="mpc-section">
              <p className="mpc-section-label">Início da conversa</p>
              <p className="mpc-section-value">{formatarData(contato.criadoEm || contato.criadaEm)}</p>
            </div>
          </div>
        );

      case 'midia': return renderPlaceholder('Mídia', ImageIcon);
      case 'arquivos': return renderPlaceholder('Arquivos', FileText);
      case 'links': return renderPlaceholder('Links', LinkIcon);
      case 'criptografia': return renderPlaceholder('Criptografia', Lock);
      case 'grupos': return renderPlaceholder('Grupos em Comum', Users);
      default: return null;
    }
  };

  // ✅ Prepara o nome curto para o botão de bloquear
  const getNomeCurto = () => {
    const nome = contato.nomeCliente || contato.nomeContato || 'Contato';
    return nome.split(' ')[0]; // Pega só o primeiro nome para não quebrar layout
  };

  return (
    <>
      <div className="modal-perfil-contato-overlay" onClick={onClose}>
        <div 
          className={`modal-perfil-contato-container ${temaEscuro ? 'tema-escuro' : ''}`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* SIDEBAR */}
          <div className="mpc-sidebar">
            <div className="mpc-sidebar-nav">
              <button className={`mpc-sidebar-btn ${tabAtiva === 'visao-geral' ? 'active' : ''}`} onClick={() => setTabAtiva('visao-geral')}>
                <Info className="mpc-sidebar-icon" /> Visão geral
              </button>
              <button className={`mpc-sidebar-btn ${tabAtiva === 'midia' ? 'active' : ''}`} onClick={() => setTabAtiva('midia')}>
                <ImageIcon className="mpc-sidebar-icon" /> Mídia
              </button>
              <button className={`mpc-sidebar-btn ${tabAtiva === 'arquivos' ? 'active' : ''}`} onClick={() => setTabAtiva('arquivos')}>
                <FileText className="mpc-sidebar-icon" /> Arquivos
              </button>
              <button className={`mpc-sidebar-btn ${tabAtiva === 'links' ? 'active' : ''}`} onClick={() => setTabAtiva('links')}>
                <LinkIcon className="mpc-sidebar-icon" /> Links
              </button>
              <button className={`mpc-sidebar-btn ${tabAtiva === 'criptografia' ? 'active' : ''}`} onClick={() => setTabAtiva('criptografia')}>
                <Lock className="mpc-sidebar-icon" /> Criptografia
              </button>
              <button className={`mpc-sidebar-btn ${tabAtiva === 'grupos' ? 'active' : ''}`} onClick={() => setTabAtiva('grupos')}>
                <Users className="mpc-sidebar-icon" /> Grupos
              </button>
            </div>

            {/* ✅ RODAPÉ DA SIDEBAR (Ações de Perigo) */}
            <div className="mpc-sidebar-footer">
              {!ehGrupo && (
                <button 
                  className="mpc-sidebar-danger-btn" 
                  onClick={() => handleAcaoRapida('bloquear')}
                  title={`Bloquear ${contato.nomeCliente}`}
                >
                  <Ban className="mpc-sidebar-danger-icon" />
                  Bloquear {getNomeCurto()}
                </button>
              )}
              
              <button 
                className="mpc-sidebar-danger-btn" 
                onClick={() => handleAcaoRapida('limpar')}
                title="Limpar mensagens"
              >
                <Trash2 className="mpc-sidebar-danger-icon" />
                Limpar conversa
              </button>
            </div>
          </div>

          {/* CONTEÚDO */}
          <div className="mpc-content-area">
            <button className="mpc-close-btn-absolute" onClick={onClose} title="Fechar">
              <X size={20} />
            </button>
            {renderConteudo()}
          </div>
        </div>
      </div>

      <ModalConfirmacao
        isOpen={modalConfirmacao.isOpen}
        onClose={() => setModalConfirmacao({ ...modalConfirmacao, isOpen: false })}
        onConfirm={modalConfirmacao.onConfirm}
        tipo={modalConfirmacao.tipo}
        titulo={modalConfirmacao.titulo}
        mensagem={modalConfirmacao.mensagem}
        textoBotaoConfirmar="Confirmar"
        textoBotaoCancelar="Cancelar"
      />
    </>
  );
}