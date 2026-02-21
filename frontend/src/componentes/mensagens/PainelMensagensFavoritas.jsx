// frontend/src/componentes/mensagens/PainelMensagensFavoritas.jsx

import React, { useState, useEffect } from 'react';
import { X, Search, Heart, Clock, User, Loader2 } from 'lucide-react';
import { useTema } from '../../contextos/TemaContexto';
import api from '../../servicos/api';
import toast from 'react-hot-toast';
import './css/PainelMensagensFavoritas.css'; // ✅ CSS Novo

export default function PainelMensagensFavoritas({ 
  aberto, 
  onFechar, 
  conversaSelecionada,
  onMensagemClick
}) {
  const { temaEscuro } = useTema();
  const [mensagensFavoritas, setMensagensFavoritas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [busca, setBusca] = useState('');

  useEffect(() => {
    if (aberto && conversaSelecionada) {
      carregarMensagensFavoritas();
    }
  }, [aberto, conversaSelecionada]);

  const carregarMensagensFavoritas = async () => {
    if (!conversaSelecionada?.id) return;
    
    setLoading(true);
    try {
      const response = await api.get(`/mensagens/favoritas/${conversaSelecionada.id}`);
      if (response.data.sucesso) {
        setMensagensFavoritas(response.data.mensagens || []);
      }
    } catch (error) {
      console.error('❌ Erro ao carregar favoritas:', error);
      toast.error('Erro ao carregar mensagens favoritas');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoverFavorita = async (mensagemId) => {
    try {
      const response = await api.patch(`/mensagens/${mensagemId}/favoritar`);
      if (response.data.sucesso) {
        toast.success('Removido dos favoritos');
        setMensagensFavoritas(prev => prev.filter(m => m.id !== mensagemId));
      }
    } catch (error) {
      console.error('❌ Erro ao remover favorita:', error);
      toast.error('Erro ao remover dos favoritos');
    }
  };

  const handleClickMensagem = (mensagem) => {
    if (onMensagemClick) {
      onMensagemClick(mensagem.id);
    }
  };

  // ✅ Função aprimorada para recuperar o nome
  const getSenderName = (msg) => {
    if (msg.fromMe) return 'Você';
    
    // Tenta várias propriedades comuns em APIs de WhatsApp/Ticket
    return msg.remetente?.nome || 
           msg.remetente?.name || 
           msg.contact?.name || 
           msg.contact?.nome || 
           msg.sender?.name || 
           msg.remetenteNome || 
           msg.enviadaPor || 
           msg.ticket?.contact?.name ||
           'Contato Desconhecido';
  };

  const formatDateTime = (date) => {
    if (!date) return '';
    const d = new Date(date);
    return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  };

  const renderConteudoMensagem = (mensagem) => {
    const tipo = mensagem.tipo?.toUpperCase();
    const texto = mensagem.conteudo || mensagem.mensagem || mensagem.body || '';

    if (tipo === 'IMAGEM' || tipo === 'IMAGE') return '📷 [Imagem]';
    if (tipo === 'VIDEO') return '🎥 [Vídeo]';
    if (tipo === 'AUDIO') return '🎵 [Áudio]';
    if (tipo === 'DOCUMENTO' || tipo === 'DOCUMENT') return '📄 [Documento]';
    if (tipo === 'FIGURINHA' || tipo === 'STICKER') return '🎭 [Figurinha]';
    
    if (texto.length > 150) {
      return texto.substring(0, 150) + '...';
    }
    
    return texto || '[Mensagem sem conteúdo]';
  };

  const mensagensFiltradas = mensagensFavoritas.filter(m => 
    (m.conteudo || m.mensagem || '').toLowerCase().includes(busca.toLowerCase())
  );

  // Se não estiver aberto, não renderiza (comportamento de gaveta controlada por classe CSS é possível, mas aqui usamos render condicional + CSS)
  if (!aberto) return null;

  return (
    <div className={`pmf-container ${aberto ? 'aberto' : ''} ${temaEscuro ? 'tema-escuro' : ''}`}>
      
      {/* HEADER */}
      <div className="pmf-header">
        <div className="pmf-header-title">
          <Heart size={20} className="text-red-500" fill="currentColor" />
          <h3>
            Favoritas
            {mensagensFavoritas.length > 0 && (
              <span className="pmf-contador">{mensagensFavoritas.length}</span>
            )}
          </h3>
        </div>
        <button onClick={onFechar} className="pmf-close-btn" title="Fechar">
          <X size={20} />
        </button>
      </div>

      {/* BUSCA */}
      <div className="pmf-search-wrapper">
        <div className="pmf-search-container">
          <Search className="pmf-search-icon" />
          <input
            type="text"
            placeholder="Buscar nas favoritas..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="pmf-search-input"
          />
          {busca && (
            <button onClick={() => setBusca('')} className="pmf-search-clear">
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* LISTA */}
      <div className="pmf-lista">
        {loading ? (
          <div className="pmf-state">
            <Loader2 size={32} className="animate-spin text-emerald-500"/>
            <span>Carregando...</span>
          </div>
        ) : mensagensFavoritas.length === 0 ? (
          <div className="pmf-state">
            <Heart size={48} className="text-gray-300 mb-2"/>
            <h4>Nenhuma favorita</h4>
            <p>Clique em "Favoritar" nas mensagens para vê-las aqui.</p>
          </div>
        ) : mensagensFiltradas.length === 0 ? (
          <div className="pmf-state">
            <Search size={48} className="text-gray-300 mb-2"/>
            <h4>Não encontrado</h4>
            <p>Nenhuma mensagem corresponde à busca.</p>
          </div>
        ) : (
          mensagensFiltradas.map((mensagem) => (
            <div 
              key={mensagem.id} 
              className="pmf-item group"
              onClick={() => handleClickMensagem(mensagem)}
            >
              {/* Header do Item: Remetente e Data */}
              <div className="pmf-item-header">
                <span className="pmf-sender">
                  <User size={12} strokeWidth={2.5}/>
                  {/* Chama a nova função de nome aqui */}
                  {getSenderName(mensagem)}
                </span>
                <span className="pmf-date">
                  <Clock size={10} />
                  {formatDateTime(mensagem.enviadaEm || mensagem.criadaEm)}
                </span>
              </div>

              {/* Conteúdo */}
              <div className="pmf-content">
                {renderConteudoMensagem(mensagem)}
              </div>

              {/* Ação (Desfavoritar) */}
              <button
                className="pmf-action-btn"
                title="Remover dos favoritos"
                onClick={(e) => {
                  e.stopPropagation(); // Evita abrir a mensagem ao clicar no botão
                  handleRemoverFavorita(mensagem.id);
                }}
              >
                <Heart size={14} fill="currentColor" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}