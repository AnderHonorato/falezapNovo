// frontend/src/componentes/ListaConversas.jsx

import React, { useState, useEffect, useRef } from 'react';
import {
  Search, MessageSquare, Star, Users, 
  Archive, X, Check, Pin, Bell, BellOff, Trash2, 
  ExternalLink, MessageCirclePlus, // ✅ Ícone atualizado para nova conversa
  Heart
} from 'lucide-react';
import ConversaItem from './ConversaItem';
import { useTema } from '../contextos/TemaContexto';
import { useSocket } from '../contextos/SocketContext';
import api from '../servicos/api';
import toast from 'react-hot-toast';
import './mensagens/css/ListaConversas.css';

const ListaConversas = ({ 
  conversaSelecionada, 
  onSelecionarConversa, 
  onNovaConversa, // ✅ Nova prop para abrir o modal de busca simples
  conversas,
  loading,
  carregarConversas,
  filtroAtivo = 'conversas',
  setFiltroAtivo
}) => {
  const [pesquisa, setPesquisa] = useState('');
  const [menuContextoAberto, setMenuContextoAberto] = useState(null);
  const { temaEscuro } = useTema();
  const { socket, conectado } = useSocket();
  const menuContextoRef = useRef(null);

  const filtros = [
    { id: 'conversas', label: 'Tudo' },
    { id: 'nao-lidas', label: 'Não lidas' },
    { id: 'favoritas', label: 'Favoritas' },
    { id: 'grupos', label: 'Grupos' }
  ];

  // ============================================
  // SOCKET.IO - TEMPO REAL
  // ============================================
  useEffect(() => {
    if (!socket || !conectado) return;

    const handleNovaMensagem = () => carregarConversas();
    const handleMensagemAtualizada = () => carregarConversas();
    const handleConversaAtualizada = () => carregarConversas();

    socket.on('nova_mensagem', handleNovaMensagem);
    socket.on('mensagem_status_atualizada', handleMensagemAtualizada);
    socket.on('conversa_atualizada', handleConversaAtualizada);

    return () => {
      socket.off('nova_mensagem', handleNovaMensagem);
      socket.off('mensagem_status_atualizada', handleMensagemAtualizada);
      socket.off('conversa_atualizada', handleConversaAtualizada);
    };
  }, [socket, conectado, carregarConversas]); 

  // ============================================
  // FILTROS LÓGICA
  // ============================================
  const conversasFiltradas = conversas
    .filter(c => {
      const matchPesquisa = c.nomeCliente?.toLowerCase().includes(pesquisa.toLowerCase()) ||
                            c.numeroCliente?.includes(pesquisa);
      if (!matchPesquisa) return false;

      if (filtroAtivo === 'arquivadas') {
        return c.arquivada === true || c.statusConversa === 'ARQUIVADA';
      }
      
      if (c.arquivada === true || c.statusConversa === 'ARQUIVADA') {
        return false;
      }
      
      if (filtroAtivo === 'nao-lidas') return c.naoLidas > 0;
      if (filtroAtivo === 'favoritas') return c.favorita === true;
      if (filtroAtivo === 'grupos') return c.isGrupo === true;
      
      return true;
    })
    .sort((a, b) => {
      if (a.fixada && !b.fixada) return -1;
      if (!a.fixada && b.fixada) return 1;
      
      const dataA = new Date(a.ultimaMensagemEm || 0);
      const dataB = new Date(b.ultimaMensagemEm || 0);
      return dataB - dataA;
    });

  // ============================================
  // MENU DE CONTEXTO
  // ============================================
  useEffect(() => {
    const handleClickFora = (e) => {
      if (menuContextoRef.current && !menuContextoRef.current.contains(e.target)) {
        setMenuContextoAberto(null);
      }
    };
    document.addEventListener('mousedown', handleClickFora);
    return () => document.removeEventListener('mousedown', handleClickFora);
  }, []);

  const handleContextMenu = (e, conversa) => {
    e.preventDefault();
    e.stopPropagation();
    
    const menuWidth = 220;
    const windowWidth = window.innerWidth;
    let x = e.clientX;
    let y = e.clientY;
    
    if (x + menuWidth > windowWidth) x = windowWidth - menuWidth - 10;
    
    setMenuContextoAberto({ x, y, conversa });
  };

  const handleAcaoContexto = async (acao, conversa) => {
    try {
      let response;
      switch (acao) {
        case 'favoritar':
          response = await api.put(`/conversas/acao/${conversa.id}`, { acao: 'favoritar' });
          if (response.data.sucesso) {
            toast.success(conversa.favorita ? 'Removido dos favoritos' : 'Adicionado aos favoritos');
            await carregarConversas();
          }
          break;
        case 'arquivar':
          response = await api.put(`/conversas/acao/${conversa.id}`, { acao: 'arquivar' });
          if (response.data.sucesso) {
            toast.success(conversa.arquivada ? 'Conversa desarquivada' : 'Conversa arquivada');
            await carregarConversas();
            if (conversaSelecionada?.id === conversa.id && !conversa.arquivada) {
              onSelecionarConversa(null);
            }
          }
          break;
        case 'silenciar':
          response = await api.put(`/conversas/acao/${conversa.id}`, { acao: 'silenciar' });
          if (response.data.sucesso) {
            toast.success(conversa.silenciada ? 'Notificações ativadas' : 'Conversa silenciada');
            await carregarConversas();
          }
          break;
        case 'fixar':
          response = await api.put(`/conversas/acao/${conversa.id}`, { acao: 'fixar' });
          if (response.data.sucesso) {
            toast.success(conversa.fixada ? 'Conversa desfixada' : 'Conversa fixada');
            await carregarConversas();
          }
          break;
        case 'limpar':
          if (!window.confirm("Limpar todas as mensagens?")) {
            setMenuContextoAberto(null);
            return;
          }
          response = await api.delete(`/mensagens/conversa/${conversa.id}`);
          if (response.data.sucesso) {
            toast.success('Histórico limpo');
            await carregarConversas();
          }
          break;
        case 'sair-grupo':
          if (!window.confirm("Sair deste grupo?")) {
            setMenuContextoAberto(null);
            return;
          }
          response = await api.post(`/conversas/${conversa.id}/sair-grupo`);
          if (response.data.sucesso) {
            toast.success('Você saiu do grupo');
            await carregarConversas();
          }
          break;
        default: break;
      }
    } catch (error) {
      console.error('❌ Erro:', error);
      toast.error('Erro ao executar ação');
    } finally {
      setMenuContextoAberto(null);
    }
  };

  const aplicarFiltro = (filtroId) => {
    if (setFiltroAtivo) setFiltroAtivo(filtroId);
  };

  return (
    <div className={`lista-conversas ${temaEscuro ? 'tema-escuro' : 'tema-claro'}`}>
      {/* HEADER */}
      <header className="lista-conversas-header">
        <div className="header-content">
          <h1 className="header-titulo">Conversas</h1>
          <div className="header-actions">
            <div className="connection-status" title={conectado ? 'Conectado' : 'Desconectado'}>
              <div className={`status-dot ${conectado ? 'connected' : 'disconnected'}`} />
            </div>
            
            {/* ✅ Botão Nova Conversa - Abre o modal simplificado de busca */}
            <button 
              className="header-btn" 
              onClick={onNovaConversa} 
              title="Iniciar Nova Conversa"
            >
              <MessageCirclePlus size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* SEARCH BAR */}
      <div className="lista-conversas-search">
        <div className="search-wrapper">
          <Search className="search-icon" size={16} />
          <input
            type="text"
            className="search-input"
            placeholder="Pesquisar..."
            value={pesquisa}
            onChange={(e) => setPesquisa(e.target.value)}
          />
          {pesquisa && (
            <button onClick={() => setPesquisa('')} className="search-clear">
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* FILTROS EM PÍLULAS */}
      <div className="lista-conversas-filtros">
        {filtros.map((filtro) => (
          <button
            key={filtro.id}
            className={`filtro-pill ${filtroAtivo === filtro.id ? 'active' : ''}`}
            onClick={() => aplicarFiltro(filtro.id)}
          >
            {filtro.label}
          </button>
        ))}
      </div>

      {/* LISTA DE CONVERSAS */}
      <div className="lista-conversas-scroll">
        {loading ? (
          <div className="lista-conversas-loading">
            <div className="spinner" />
            <p>Carregando...</p>
          </div>
        ) : conversasFiltradas.length === 0 ? (
          <div className="lista-conversas-empty">
            {filtroAtivo === 'arquivadas' ? <Archive size={40} /> : <MessageSquare size={40} />}
            <p className="empty-title">
              {pesquisa ? 'Nenhuma conversa encontrada' : 'Nenhuma conversa'}
            </p>
            <p className="empty-subtitle">
              {filtroAtivo === 'conversas' && !pesquisa ? 'Inicie uma nova conversa' : `Filtro: ${filtros.find(f=>f.id === filtroAtivo)?.label || filtroAtivo}`}
            </p>
          </div>
        ) : (
          conversasFiltradas.map((conversa) => (
            <ConversaItem
              key={conversa.id}
              conversa={conversa}
              selecionada={conversaSelecionada?.id === conversa.id}
              onSelecionar={onSelecionarConversa}
              onContextMenu={(e) => handleContextMenu(e, conversa)}
            />
          ))
        )}
      </div>

      {/* MENU DE CONTEXTO */}
      {menuContextoAberto && (
        <div 
          ref={menuContextoRef}
          className="menu-contexto"
          style={{ top: `${menuContextoAberto.y}px`, left: `${menuContextoAberto.x}px` }}
        >
          <button className="menu-item" onClick={() => handleAcaoContexto('fixar', menuContextoAberto.conversa)}>
            <Pin size={14} /> <span>{menuContextoAberto.conversa.fixada ? 'Desafixar' : 'Fixar'}</span>
          </button>
          <button className="menu-item" onClick={() => handleAcaoContexto('favoritar', menuContextoAberto.conversa)}>
            <Heart size={14} /> <span>{menuContextoAberto.conversa.favorita ? 'Desfavoritar' : 'Favoritar'}</span>
          </button>
          <button className="menu-item" onClick={() => handleAcaoContexto('silenciar', menuContextoAberto.conversa)}>
            {menuContextoAberto.conversa.silenciada ? <Bell size={14} /> : <BellOff size={14} />}
            <span>{menuContextoAberto.conversa.silenciada ? 'Ativar som' : 'Silenciar'}</span>
          </button>
          <button className="menu-item" onClick={() => handleAcaoContexto('arquivar', menuContextoAberto.conversa)}>
            <Archive size={14} /> <span>{menuContextoAberto.conversa.arquivada ? 'Desarquivar' : 'Arquivar'}</span>
          </button>
          <div className="menu-divider" />
          <button className="menu-item danger" onClick={() => handleAcaoContexto('limpar', menuContextoAberto.conversa)}>
            <Trash2 size={14} /> <span>Limpar conversa</span>
          </button>
          {menuContextoAberto.conversa.isGrupo && (
            <button className="menu-item danger" onClick={() => handleAcaoContexto('sair-grupo', menuContextoAberto.conversa)}>
              <X size={14} /> <span>Sair do grupo</span>
            </button>
          )}
          <button className="menu-item" onClick={() => { window.open(`/mensagens/${menuContextoAberto.conversa.id}`, '_blank'); setMenuContextoAberto(null); }}>
            <ExternalLink size={14} /> <span>Abrir nova janela</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default ListaConversas;