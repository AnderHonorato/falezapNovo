import React, { useState, useEffect } from 'react';
import { X, Search, MessageCircle, User, Phone, AlertCircle, ChevronRight } from 'lucide-react';
import api from '../../servicos/api';
import toast from 'react-hot-toast';
import { useTema } from '../../contextos/TemaContexto'; // ✅ Importar Contexto
import './css/ModalNovaConversa.css';

export default function ModalNovaConversa({ isOpen, onClose, onConversar }) {
  const { temaEscuro } = useTema(); // ✅ Pegar estado do tema
  const [busca, setBusca] = useState('');
  const [contatos, setContatos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setBusca('');
      setContatos([]);
      fetchContatos('');
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const delayDebounceFn = setTimeout(() => {
      fetchContatos(busca);
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [busca]);

  const fetchContatos = async (termo) => {
    try {
      setLoading(true);
      if (termo) setSearching(true);

      const { data } = await api.get('/contatos', {
        params: {
          searchParam: termo,
          limit: 20
        },
      });

      let lista = [];
      if (data.conversas) lista = data.conversas;
      else if (data.contatos) lista = data.contatos;
      else if (Array.isArray(data)) lista = data;

      setContatos(lista);

    } catch (err) {
      console.error('Erro ao buscar contatos:', err);
      if (termo) toast.error('Erro ao carregar contatos');
    } finally {
      setLoading(false);
      setSearching(false);
    }
  };

  const handleSelecionar = (contato) => {
    const contatoNormalizado = {
      ...contato,
      id: contato.id,
      nomeCliente: contato.nomeCliente || contato.nomeContato || 'Sem Nome',
      numeroCliente: contato.numeroCliente,
      profilePicUrl: contato.fotoUrl || contato.profilePicUrl
    };
    onConversar(contatoNormalizado);
    onClose();
  };

  const getIniciais = (nome) => {
    if (!nome) return '?';
    const partes = nome.split(' ');
    if (partes.length === 1) return partes[0].charAt(0).toUpperCase();
    return (partes[0].charAt(0) + partes[partes.length - 1].charAt(0)).toUpperCase();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-nova-conversa-overlay" onClick={onClose}>
      {/* ✅ Adicionada classe condicional 'tema-escuro' */}
      <div 
        className={`modal-nova-conversa-container ${temaEscuro ? 'tema-escuro' : ''}`} 
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* HEADER */}
        <div className="mnc-header">
          <div className="mnc-header-title">
            {/* Ícone muda de cor no CSS agora */}
            <MessageCircle size={20} className="mnc-icon-header" />
            <h3>Nova Conversa</h3>
          </div>
          <button onClick={onClose} className="mnc-close-btn" title="Fechar (Esc)">
            <X size={20} />
          </button>
        </div>

        {/* INPUT */}
        <div className="mnc-search-wrapper">
          <div className="mnc-input-container">
            <Search className={`mnc-search-icon ${searching ? 'animate-pulse' : ''}`} size={18} />
            <input 
              type="text" 
              placeholder="Pesquise por nome ou número..." 
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="mnc-search-input"
              autoFocus
            />
          </div>
        </div>

        {/* LISTA */}
        <div className="mnc-lista">
          {loading && contatos.length === 0 ? (
            <div className="mnc-loading">
              <div className="spinner-simples"></div>
              <span>Buscando...</span>
            </div>
          ) : contatos.length === 0 ? (
            <div className="mnc-empty">
              {busca ? (
                <>
                  <AlertCircle size={32} strokeWidth={1.5} />
                  <p>Nenhum resultado para "<strong>{busca}</strong>"</p>
                </>
              ) : (
                <>
                  <User size={32} strokeWidth={1.5} />
                  <p>Digite para buscar...</p>
                </>
              )}
            </div>
          ) : (
            contatos.map((contato) => {
              const nome = contato.nomeCliente || contato.nomeContato || 'Desconhecido';
              const numero = contato.numeroCliente || '';
              const imgUrl = contato.fotoUrl || contato.profilePicUrl;

              return (
                <div 
                  key={contato.id} 
                  className="mnc-item" 
                  onClick={() => handleSelecionar(contato)}
                >
                  <div className="mnc-avatar">
                    {imgUrl ? (
                      <img src={imgUrl} alt={nome} className="mnc-avatar-img" />
                    ) : (
                      <span>{getIniciais(nome)}</span>
                    )}
                  </div>
                  
                  <div className="mnc-info">
                    <span className="mnc-nome">{nome}</span>
                    <div className="mnc-detalhe">
                      <Phone size={12} />
                      <span className="mnc-numero">{numero}</span>
                    </div>
                  </div>

                  <button className="mnc-btn-acao">
                    Conversar
                  </button>
                  
                  <ChevronRight size={16} className="text-gray-400 md:hidden" />
                </div>
              );
            })
          )}
        </div>
        
        <div className="mnc-footer">
           <small>Exibindo {contatos.length} resultados</small>
        </div>

      </div>
    </div>
  );
}