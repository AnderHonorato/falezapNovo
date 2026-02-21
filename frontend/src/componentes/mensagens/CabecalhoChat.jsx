// frontend/src/componentes/mensagens/CabecalhoChat.jsx

import React, { useState, useRef, useEffect } from 'react';
import {
  Search, MoreVertical, Star, StarOff, Archive,
  Bell, BellOff, Trash2, X, StickyNote, ExternalLink, UserX, LogOut,
  ChevronUp, ChevronDown, Calendar, UserPlus, Heart
} from 'lucide-react';
import { useTema } from '../../contextos/TemaContexto';
import api from '../../servicos/api';
import toast from 'react-hot-toast';
import './css/CabecalhoChat.css';

export default function CabecalhoChat({
  conversa,
  totalMensagens,
  totalAnotacoes,
  totalFavoritas = 0,
  onAbrirPerfil,
  onFecharConversa,
  onAbrirPainelAnotacoes,
  onAbrirPainelFavoritas,
  onLimparHistorico,
  onSearchSubmit,
  onSearchNavigate,
  onSearchClose,
  searchResults,
  onToggleDatePicker,
  onAdicionarContato
}) {
  const { temaEscuro } = useTema();
  const [menuAberto, setMenuAberto] = useState(false);
  const [buscaAberta, setBuscaAberta] = useState(false);
  const [termoBusca, setTermoBusca] = useState('');
  const menuRef = useRef(null);
  const buscaInputRef = useRef(null);

  useEffect(() => {
    const handleClickFora = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuAberto(false);
      }
    };
    document.addEventListener('mousedown', handleClickFora);
    return () => document.removeEventListener('mousedown', handleClickFora);
  }, []);

  useEffect(() => {
    if (buscaAberta) {
      setTimeout(() => {
        buscaInputRef.current?.focus();
      }, 100);
    }
  }, [buscaAberta]);

  const formatarStatus = () => {
    if (!conversa) return '';
    
    if (conversa.online) {
      return (
        <>
          <span className="status-dot" />
          online
        </>
      );
    }
    
    if (conversa.ultimoVisto) {
      const data = new Date(conversa.ultimoVisto);
      const hoje = new Date();
      const ontem = new Date(hoje);
      ontem.setDate(ontem.getDate() - 1);

      if (data.toDateString() === hoje.toDateString()) {
        return `visto hoje às ${data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
      } else if (data.toDateString() === ontem.toDateString()) {
        return `visto ontem às ${data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
      } else {
        return `visto em ${data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })}`;
      }
    }
    
    return 'Toque para dados do contato';
  };

  const handleAcaoMenu = async (acao) => {
    setMenuAberto(false);
    
    try {
      switch (acao) {
        case 'favoritar':
          await api.patch(`/conversas/${conversa.id}/favorito`);
          toast.success(conversa.favorito ? 'Removido dos favoritos' : 'Adicionado aos favoritos');
          break;
        case 'silenciar':
          await api.patch(`/conversas/${conversa.id}/silenciar`);
          toast.success(conversa.silenciada ? 'Notificações ativadas' : 'Conversa silenciada');
          break;
        case 'arquivar':
          await api.patch(`/conversas/${conversa.id}/arquivar`);
          toast.success('Conversa arquivada');
          break;
        case 'limpar':
          if (onLimparHistorico) onLimparHistorico();
          break;
        case 'fechar':
          if (onFecharConversa) onFecharConversa();
          break;
        case 'bloquear':
          await api.post(`/conversas/${conversa.id}/bloquear`);
          toast.success('Contato bloqueado');
          break;
        case 'sair-grupo':
          await api.post(`/conversas/${conversa.id}/sair-grupo`);
          toast.success('Você saiu do grupo');
          break;
        case 'abrir-janela':
          window.open(`/mensagens/${conversa.id}`, '_blank');
          break;
        default: break;
      }
    } catch (error) {
      toast.error('Erro ao executar ação');
    }
  };

  const handleCloseSearch = () => {
    setBuscaAberta(false);
    setTermoBusca('');
    if (onSearchClose) onSearchClose();
  };

  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter' && termoBusca.trim()) {
      if (onSearchSubmit) onSearchSubmit(termoBusca.trim());
    }
    if (e.key === 'Escape') {
      handleCloseSearch();
    }
  };

  const handleNavigate = (direcao) => {
    if (onSearchNavigate) onSearchNavigate(direcao);
  };

  const handleAdicionarContato = () => {
    if (onAdicionarContato) onAdicionarContato(conversa);
  };
  
  if (!conversa) return null;

  const ehGrupo = conversa.tipo === 'GRUPO' || conversa.isGrupo;
  const totalResultados = searchResults?.total || 0;
  const currentResultado = searchResults?.current || 0;
  const temContatoSalvo = conversa.nomeContato || conversa.nomeCliente !== conversa.numeroCliente;

  return (
    <header className={`cabecalho-chat ${temaEscuro ? 'tema-escuro' : 'light-theme'}`}>
      
      {/* CONTEÚDO NORMAL DO CABEÇALHO */}
      <div className="cabecalho-content">
        <div className="cabecalho-info" onClick={onAbrirPerfil}>
          <div className="cabecalho-avatar">
            {conversa.fotoPerfil || conversa.foto_perfil ? (
              <img src={conversa.fotoPerfil || conversa.foto_perfil} alt={conversa.nomeCliente} />
            ) : (
              <div className="avatar-placeholder">
                {ehGrupo ? '👥' : '👤'}
              </div>
            )}
          </div>
          
          <div className="cabecalho-texto">
            <h2 className="cabecalho-nome">
              {conversa.nomeCliente || conversa.numeroCliente}
            </h2>
            <p className="cabecalho-status">
              {formatarStatus()}
            </p>
          </div>
        </div>

        <div className="cabecalho-acoes">
          <button 
            className={`cabecalho-btn ${buscaAberta ? 'active' : ''}`}
            title="Pesquisar"
            onClick={() => setBuscaAberta(true)}
          >
            <Search size={20} />
          </button>

          <button 
            className="cabecalho-btn" 
            title="Mensagens Favoritas"
            onClick={onAbrirPainelFavoritas}
          >
            <Heart size={20} />
            {totalFavoritas > 0 && (
              <span className="badge-favoritas">{totalFavoritas}</span>
            )}
          </button>

          <button 
            className="cabecalho-btn" 
            title="Anotações"
            onClick={onAbrirPainelAnotacoes}
          >
            <StickyNote size={20} />
            {totalAnotacoes > 0 && (
              <span className="badge-anotacoes">{totalAnotacoes}</span>
            )}
          </button>

          {!temContatoSalvo && !ehGrupo && (
            <button 
              className="cabecalho-btn cabecalho-btn-adicionar" 
              title="Adicionar aos Contatos"
              onClick={handleAdicionarContato}
            >
              <UserPlus size={20} />
            </button>
          )}

          <div className="menu-wrapper" ref={menuRef}>
            <button 
              className={`cabecalho-btn ${menuAberto ? 'active' : ''}`}
              onClick={() => setMenuAberto(!menuAberto)}
              title="Mais opções"
            >
              <MoreVertical size={20} />
            </button>

            {menuAberto && (
              <>
                <div className="menu-overlay" onClick={() => setMenuAberto(false)} />
                <div className="cabecalho-menu">
                  <button className="menu-item" onClick={() => handleAcaoMenu('favoritar')}>
                    {conversa.favorito ? <StarOff size={16} /> : <Star size={16} />}
                    <span>{conversa.favorito ? 'Remover dos favoritos' : 'Favoritar'}</span>
                  </button>
                  <button className="menu-item" onClick={() => handleAcaoMenu('silenciar')}>
                    {conversa.silenciada ? <Bell size={16} /> : <BellOff size={16} />}
                    <span>{conversa.silenciada ? 'Ativar notificações' : 'Silenciar'}</span>
                  </button>
                  <button className="menu-item" onClick={() => handleAcaoMenu('arquivar')}>
                    <Archive size={16} />
                    <span>Arquivar</span>
                  </button>
                  <div className="menu-divider" />
                  <button className="menu-item" onClick={() => handleAcaoMenu('limpar')}>
                    <Trash2 size={16} />
                    <span>Limpar mensagens</span>
                  </button>
                  {!ehGrupo && (
                    <button className="menu-item" onClick={() => handleAcaoMenu('bloquear')}>
                      <UserX size={16} />
                      <span>Bloquear contato</span>
                    </button>
                  )}
                  {ehGrupo && (
                    <button className="menu-item" onClick={() => handleAcaoMenu('sair-grupo')}>
                      <LogOut size={16} />
                      <span>Sair do grupo</span>
                    </button>
                  )}
                  <button className="menu-item" onClick={() => handleAcaoMenu('fechar')}>
                    <X size={16} />
                    <span>Fechar conversa</span>
                  </button>
                  <div className="menu-divider" />
                  <button className="menu-item" onClick={() => handleAcaoMenu('abrir-janela')}>
                    <ExternalLink size={16} />
                    <span>Abrir em nova janela</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      
      {/* BARRA DE BUSCA (Sobrepõe o conteúdo quando ativa) */}
      {buscaAberta && (
        <div className="cabecalho-busca-container">
          <input
            ref={buscaInputRef}
            type="text"
            className="busca-input-novo"
            placeholder="Pesquisar..."
            value={termoBusca}
            onChange={(e) => setTermoBusca(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            autoFocus
          />
          
          {totalResultados > 0 && (
            <span className="busca-results-count">
              {currentResultado} / {totalResultados}
            </span>
          )}

          <button 
            className="busca-nav-btn" 
            title="Anterior"
            onClick={() => handleNavigate('prev')}
            disabled={totalResultados === 0}
          >
            <ChevronUp size={18} />
          </button>
          <button 
            className="busca-nav-btn" 
            title="Próximo"
            onClick={() => handleNavigate('next')}
            disabled={totalResultados === 0}
          >
            <ChevronDown size={18} />
          </button>
          <button 
            className="busca-nav-btn" 
            title="Buscar por data"
            onClick={onToggleDatePicker}
          >
            <Calendar size={16} />
          </button>

          <button 
            className="busca-close-btn"
            title="Fechar busca"
            onClick={handleCloseSearch}
          >
            <X size={18} />
          </button>
        </div>
      )}
    </header>
  );
}