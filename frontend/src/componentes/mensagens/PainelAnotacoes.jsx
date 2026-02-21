// frontend/src/componentes/mensagens/PainelAnotacoes.jsx

import React, { useState, useEffect } from 'react';
import { 
  X, Search, StickyNote, Plus, Loader2, FileText, 
  Trash2, Edit2, History, User 
} from 'lucide-react';
import { useTema } from '../../contextos/TemaContexto';
import api from '../../servicos/api';
import toast from 'react-hot-toast';
import EditorAnotacao from './EditorAnotacao';
import './css/PainelAnotacoes.css';

// ✅ Sub-componente para gerenciar o "Ver mais" de cada item
const ItemAnotacao = ({ anotacao, abaAtiva, onEditar, onDeletar, formatarData }) => {
  const [expandido, setExpandido] = useState(false);
  
  // Define o limite de caracteres antes de cortar
  const LIMITE_CARACTERES = 120;
  const texto = anotacao.conteudo || anotacao.mensagem || '';
  const deveCortar = texto.length > LIMITE_CARACTERES;
  
  const textoExibido = !expandido && deveCortar 
    ? `${texto.substring(0, LIMITE_CARACTERES)}...` 
    : texto;

  // Verifica se foi editado (diferença maior que 1 minuto entre criação e atualização)
  const foiEditado = !anotacao.apagada && anotacao.atualizadoEm && 
    new Date(anotacao.atualizadoEm).getTime() > new Date(anotacao.criadaEm).getTime() + 60000;

  return (
    <div 
      className={`pa-item-customizado ${anotacao.apagada ? 'apagada' : ''}`}
      style={{
        borderLeft: `4px solid ${
          anotacao.cor === 'amarelo' ? '#fbbf24' : 
          anotacao.cor === 'vermelho' ? '#ef4444' : 
          anotacao.cor === 'azul' ? '#3b82f6' : 
          anotacao.apagada ? '#9ca3af' : '#10b981'
        }`
      }}
    >
      {/* Header do Item */}
      <div className="pa-item-header">
        <div className="pa-item-meta">
          <User size={12} />
          <span className="font-bold">{anotacao.usuario?.nome || 'Sistema'}</span>
          <span className="text-gray-300">•</span>
          <span title={formatarData(anotacao.criadaEm)}>
            {new Date(anotacao.criadaEm).toLocaleDateString()}
          </span>
        </div>
        
        {/* Ações: Editar/Excluir (Apenas se não apagada e na aba 'Ativas') */}
        {!anotacao.apagada && abaAtiva === 'ativas' && (
          <div className="pa-item-actions">
            <button onClick={() => onEditar(anotacao)} title="Editar">
              <Edit2 size={14} />
            </button>
            <button onClick={() => onDeletar(anotacao.id)} title="Apagar" className="delete-btn">
              <Trash2 size={14} />
            </button>
          </div>
        )}

        {/* Badge se estiver apagada */}
        {anotacao.apagada && (
          <div className="pa-item-apagada-badge" title="Item apagado">
            <Trash2 size={14} />
          </div>
        )}
      </div>

      {/* Conteúdo com Lógica de "Ver Mais" */}
      <div className="pa-item-conteudo">
        {textoExibido}
        {deveCortar && (
          <button 
            className="pa-btn-ver-mais"
            onClick={() => setExpandido(!expandido)}
          >
            {expandido ? 'Ver menos' : 'Ver mais...'}
          </button>
        )}
      </div>

      {/* Footer com informações de Edição e Exclusão */}
      <div className="pa-item-footer-info">
        {foiEditado && (
          <div className="pa-info-editado">
             <Edit2 size={10} />
             Editado em {formatarData(anotacao.atualizadoEm)}
          </div>
        )}

        {anotacao.apagada && (
          <div className="pa-info-apagado">
             <Trash2 size={10} />
             Apagado por {anotacao.apagadaPor || 'Usuário'} em {formatarData(anotacao.apagadaEm)}
          </div>
        )}
      </div>
    </div>
  );
};

export default function PainelAnotacoes({ 
  aberto, 
  onFechar, 
  conversaSelecionada, 
  usuarioAtual
}) {
  const { temaEscuro } = useTema();
  const [anotacoes, setAnotacoes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [busca, setBusca] = useState('');
  
  // Estados de controle
  const [modoEditor, setModoEditor] = useState(false);
  const [anotacaoEmEdicao, setAnotacaoEmEdicao] = useState(null);
  const [abaAtiva, setAbaAtiva] = useState('ativas');

  useEffect(() => {
    if (aberto && conversaSelecionada) {
      carregarAnotacoes();
      setModoEditor(false); 
      setAnotacaoEmEdicao(null);
      setAbaAtiva('ativas');
    }
  }, [aberto, conversaSelecionada]);

  useEffect(() => {
    if (aberto && conversaSelecionada) {
      carregarAnotacoes();
    }
  }, [abaAtiva]);

  const carregarAnotacoes = async () => {
    if (!conversaSelecionada?.id) return;
    setLoading(true);
    try {
      // Busca todas (incluindo apagadas se for histórico) para filtrar no front
      const incluirApagadas = abaAtiva === 'historico';
      const { data } = await api.get(`/anotacoes/conversa/${conversaSelecionada.id}?incluirApagadas=true`);
      
      let lista = data.anotacoes || [];
      
      if (abaAtiva === 'ativas') {
        // Aba Ativas: Apenas as não apagadas
        lista = lista.filter(a => !a.apagada);
      } else {
        // ✅ Aba Histórico: Apenas APAGADAS ou EDITADAS
        lista = lista.filter(a => {
          const foiEditada = !a.apagada && a.atualizadoEm && 
            new Date(a.atualizadoEm).getTime() > new Date(a.criadaEm).getTime() + 60000;
          return a.apagada || foiEditada;
        });
        
        // Ordena histórico da mais recente para a mais antiga
        lista = lista.sort((a, b) => new Date(b.atualizadoEm || b.apagadaEm || b.criadaEm) - new Date(a.atualizadoEm || a.apagadaEm || a.criadaEm));
      }

      setAnotacoes(lista);
    } catch (error) {
      console.error(error);
      toast.error('Erro ao carregar anotações');
    } finally {
      setLoading(false);
    }
  };

  const handleSalvarAnotacao = async (dados) => {
    try {
      if (anotacaoEmEdicao) {
        // Editar
        await api.put(`/anotacoes/${anotacaoEmEdicao.id}`, dados);
        toast.success('Anotação atualizada');
      } else {
        // Criar
        await api.post('/anotacoes', {
          ...dados,
          conversaId: conversaSelecionada.id
        });
        toast.success('Anotação criada');
      }
      // Recarrega a lista para garantir sincronia
      carregarAnotacoes();
      setModoEditor(false);
      setAnotacaoEmEdicao(null);
    } catch (error) {
      console.error(error);
      toast.error('Erro ao salvar anotação');
    }
  };

  const handleDeletar = async (id) => {
    if (!window.confirm("Tem certeza que deseja apagar?")) return;
    try {
      await api.delete(`/anotacoes/${id}`);
      toast.success('Anotação removida');
      carregarAnotacoes(); // Recarrega para atualizar listas
    } catch (error) {
      console.error(error);
      toast.error('Erro ao remover');
    }
  };

  const handleEditar = (anotacao) => {
    setAnotacaoEmEdicao(anotacao);
    setModoEditor(true);
  };

  const anotacoesFiltradas = anotacoes.filter(a => 
    (a.conteudo || a.mensagem || '').toLowerCase().includes(busca.toLowerCase())
  );

  const formatarData = (dataStr) => {
    if (!dataStr) return '';
    return new Date(dataStr).toLocaleString('pt-BR', { 
      day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' 
    });
  };

  if (!aberto) return null;

  return (
    <div className={`pa-container ${aberto ? 'aberto' : ''} ${temaEscuro ? 'tema-escuro' : ''}`}>
      {/* HEADER */}
      <div className="pa-header">
        <div className="flex items-center gap-2">
          <StickyNote size={20} className="text-emerald-500" />
          <h3>Anotações</h3>
        </div>
        <button onClick={onFechar} className="pa-close-btn" title="Fechar">
          <X size={20} />
        </button>
      </div>

      {/* NAVEGAÇÃO DE ABAS */}
      <div className="flex border-b border-gray-200 dark:border-gray-700 w-full">
        <button 
          onClick={() => setAbaAtiva('ativas')}
          className={`flex-1 py-2 text-sm font-medium transition-colors relative ${
            abaAtiva === 'ativas' 
              ? 'text-emerald-600 dark:text-emerald-400' 
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
          }`}
        >
          Ativas
          {abaAtiva === 'ativas' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-emerald-500"></div>}
        </button>
        <button 
          onClick={() => setAbaAtiva('historico')}
          className={`flex-1 py-2 text-sm font-medium transition-colors relative flex items-center justify-center gap-1 ${
            abaAtiva === 'historico' 
              ? 'text-emerald-600 dark:text-emerald-400' 
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
          }`}
        >
          <History size={14} />
          Histórico
          {abaAtiva === 'historico' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-emerald-500"></div>}
        </button>
      </div>

      {/* BUSCA & ADD */}
      <div className="pa-search-wrapper">
        <div className="pa-search-container">
          <Search className="pa-search-icon" />
          <input
            type="text"
            placeholder="Buscar..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="pa-search-input"
          />
        </div>
        
        {abaAtiva === 'ativas' && (
          <button 
            className="pa-add-btn" 
            onClick={() => {
              setAnotacaoEmEdicao(null);
              setModoEditor(!modoEditor);
            }}
            title={modoEditor ? "Cancelar" : "Nova anotação"}
          >
            {modoEditor ? <X size={20} /> : <Plus size={20} />}
          </button>
        )}
      </div>

      {/* LISTA */}
      <div className="pa-lista">
        {modoEditor && (
          <EditorAnotacao
            anotacao={anotacaoEmEdicao}
            onSalvar={handleSalvarAnotacao}
            onCancelar={() => {
              setModoEditor(false);
              setAnotacaoEmEdicao(null);
            }}
          />
        )}

        {loading ? (
          <div className="pa-state">
            <Loader2 size={32} className="animate-spin text-emerald-500"/>
            <span>Carregando...</span>
          </div>
        ) : anotacoesFiltradas.length === 0 && !modoEditor ? (
          <div className="pa-state">
            <FileText size={48} className="text-gray-300 mb-2"/>
            <h4>{abaAtiva === 'historico' ? 'Histórico vazio' : 'Nenhuma anotação'}</h4>
            <p>{abaAtiva === 'historico' ? 'Nenhuma anotação editada ou excluída.' : 'Crie anotações para organizar este atendimento.'}</p>
          </div>
        ) : (
          anotacoesFiltradas.map((anotacao) => (
            <ItemAnotacao
              key={anotacao.id}
              anotacao={anotacao}
              abaAtiva={abaAtiva}
              onEditar={handleEditar}
              onDeletar={handleDeletar}
              formatarData={formatarData}
            />
          ))
        )}
      </div>

      <style>{`
        .pa-item-customizado {
          background: white;
          border-radius: 8px;
          padding: 12px;
          margin-bottom: 10px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          transition: all 0.2s;
        }
        .tema-escuro .pa-item-customizado {
          background: #1f2937;
          border-bottom: 1px solid #374151;
        }
        .pa-item-customizado.apagada {
          opacity: 0.75;
          background: #f3f4f6;
          filter: grayscale(1);
        }
        .tema-escuro .pa-item-customizado.apagada {
          background: #111827;
        }
        .pa-item-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }
        .pa-item-meta {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.75rem;
          color: #6b7280;
        }
        .pa-item-actions {
          display: flex;
          gap: 4px;
        }
        .pa-item-actions button {
          padding: 4px;
          border-radius: 4px;
          color: #6b7280;
          transition: background 0.2s;
        }
        .pa-item-actions button:hover {
          background: #f3f4f6;
          color: #3b82f6;
        }
        .pa-item-actions button.delete-btn:hover {
          color: #ef4444;
        }
        .pa-item-conteudo {
          font-size: 0.875rem;
          white-space: pre-wrap;
          color: #374151;
          line-height: 1.5;
        }
        .tema-escuro .pa-item-conteudo {
          color: #e5e7eb;
        }
        .pa-btn-ver-mais {
          display: block;
          margin-top: 4px;
          font-size: 0.75rem;
          color: #3b82f6;
          font-weight: 500;
          cursor: pointer;
          background: none;
          border: none;
          padding: 0;
        }
        .pa-btn-ver-mais:hover {
          text-decoration: underline;
        }
        .pa-item-footer-info {
          margin-top: 8px;
          padding-top: 8px;
          border-top: 1px dashed #e5e7eb;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .tema-escuro .pa-item-footer-info {
           border-top-color: #374151;
        }
        .pa-info-editado, .pa-info-apagado {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 0.7rem;
        }
        .pa-info-editado { color: #f59e0b; }
        .pa-info-apagado { color: #ef4444; font-weight: 500; }
      `}</style>
    </div>
  );
}