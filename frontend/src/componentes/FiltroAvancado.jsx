// frontend/src/components/FiltroAvancado.jsx

import React, { useState } from 'react';
import { FiFilter, FiX, FiTag } from 'react-icons/fi';
import { useEtiquetas } from '../hooks/useEtiquetas';

const FiltroAvancado = ({ 
  filtroAtual, 
  onAplicarFiltro, 
  etiquetaSelecionada,
  onSelecionarEtiqueta 
}) => {
  const [aberto, setAberto] = useState(false);
  const { etiquetas } = useEtiquetas();

  const filtrosDisponiveis = [
    { 
      id: 'status',
      nome: 'Status',
      opcoes: [
        { valor: 'TODAS', label: 'Todas' },
        { valor: 'NAO_LIDAS', label: 'Não lidas' },
        { valor: 'FAVORITAS', label: 'Favoritas' },
        { valor: 'FIXADAS', label: 'Fixadas' }
      ]
    },
    {
      id: 'tipo',
      nome: 'Tipo',
      opcoes: [
        { valor: 'TODAS', label: 'Todas' },
        { valor: 'GRUPOS', label: 'Grupos' },
        { valor: 'INDIVIDUAIS', label: 'Individuais' }
      ]
    },
    {
      id: 'arquivo',
      nome: 'Arquivo',
      opcoes: [
        { valor: 'NAO_ARQUIVADAS', label: 'Ativas' },
        { valor: 'ARQUIVADA', label: 'Arquivadas' }
      ]
    }
  ];

  const temFiltroAtivo = filtroAtual !== 'TODAS' || etiquetaSelecionada;

  return (
    <div className="relative">
      {/* Botão de filtro */}
      <button
        onClick={() => setAberto(!aberto)}
        className={`
          flex items-center gap-2 px-3 py-2 rounded-lg transition-colors
          ${temFiltroAtivo 
            ? 'bg-green-500 text-white' 
            : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
          }
        `}
      >
        <FiFilter size={16} />
        <span className="text-sm font-medium">
          Filtros
        </span>
        {temFiltroAtivo && (
          <span className="w-5 h-5 bg-white text-green-500 rounded-full text-xs flex items-center justify-center font-bold">
            !
          </span>
        )}
      </button>

      {/* Painel de filtros */}
      {aberto && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setAberto(false)}
          />

          {/* Painel */}
          <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-xl 
                        border border-gray-200 dark:border-gray-700 z-50 max-h-96 overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Filtros Avançados
              </h3>
              <button
                onClick={() => setAberto(false)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
              >
                <FiX size={18} />
              </button>
            </div>

            {/* Conteúdo */}
            <div className="p-4 space-y-4">
              {/* Filtros de status */}
              {filtrosDisponiveis.map(categoria => (
                <div key={categoria.id}>
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {categoria.nome}
                  </h4>
                  <div className="space-y-1">
                    {categoria.opcoes.map(opcao => (
                      <button
                        key={opcao.valor}
                        onClick={() => {
                          onAplicarFiltro(opcao.valor);
                          if (opcao.valor === 'TODAS') {
                            setAberto(false);
                          }
                        }}
                        className={`
                          w-full text-left px-3 py-2 rounded-lg text-sm transition-colors
                          ${filtroAtual === opcao.valor
                            ? 'bg-green-500 text-white'
                            : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                          }
                        `}
                      >
                        {opcao.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}

              {/* Filtro de etiquetas */}
              {etiquetas.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                    <FiTag size={14} />
                    Etiquetas
                  </h4>
                  <div className="space-y-1">
                    <button
                      onClick={() => {
                        onSelecionarEtiqueta(null);
                      }}
                      className={`
                        w-full text-left px-3 py-2 rounded-lg text-sm transition-colors
                        ${!etiquetaSelecionada
                          ? 'bg-blue-500 text-white'
                          : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                        }
                      `}
                    >
                      Todas as etiquetas
                    </button>

                    {etiquetas.map(etiqueta => (
                      <button
                        key={etiqueta.id}
                        onClick={() => onSelecionarEtiqueta(etiqueta.id)}
                        className={`
                          w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center gap-2
                          ${etiquetaSelecionada === etiqueta.id
                            ? 'ring-2 ring-offset-2'
                            : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                          }
                        `}
                        style={{
                          backgroundColor: etiquetaSelecionada === etiqueta.id 
                            ? etiqueta.cor 
                            : `${etiqueta.cor}15`,
                          color: etiquetaSelecionada === etiqueta.id 
                            ? '#fff' 
                            : etiqueta.cor,
                          borderColor: etiqueta.cor
                        }}
                      >
                        <span className="flex-1">{etiqueta.nome}</span>
                        <span className="text-xs opacity-75">
                          ({etiqueta._count?.conversas || 0})
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            {temFiltroAtivo && (
              <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => {
                    onAplicarFiltro('TODAS');
                    onSelecionarEtiqueta(null);
                    setAberto(false);
                  }}
                  className="w-full py-2 text-sm text-red-600 dark:text-red-400 
                           hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                >
                  Limpar todos os filtros
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default FiltroAvancado;