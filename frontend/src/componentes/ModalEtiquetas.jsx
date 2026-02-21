// frontend/src/components/ModalEtiquetas.jsx

import React, { useState } from 'react';
import { FiX, FiPlus, FiCheck, FiEdit2, FiTrash2 } from 'react-icons/fi';
import { useEtiquetas } from '../hooks/useEtiquetas';

const ModalEtiquetas = ({ conversa, onFechar, onAtualizar }) => {
  const {
    etiquetas,
    criarEtiqueta,
    atualizarEtiqueta,
    deletarEtiqueta,
    adicionarEtiquetaConversa,
    removerEtiquetaConversa
  } = useEtiquetas();

  const [criandoNova, setCriandoNova] = useState(false);
  const [nomeNova, setNomeNova] = useState('');
  const [corNova, setCorNova] = useState('#25D366');
  const [editando, setEditando] = useState(null);

  const coresDisponiveis = [
    '#25D366', // Verde WhatsApp
    '#FF9800', // Laranja
    '#4CAF50', // Verde
    '#2196F3', // Azul
    '#9C27B0', // Roxo
    '#F44336', // Vermelho
    '#FF5722', // Laranja escuro
    '#607D8B', // Cinza azulado
    '#795548', // Marrom
    '#E91E63'  // Rosa
  ];

  const etiquetasConversa = conversa.etiquetas?.map(e => e.id) || [];

  const handleCriarEtiqueta = async () => {
    if (!nomeNova.trim()) return;

    const resultado = await criarEtiqueta(nomeNova, corNova);
    
    if (resultado.sucesso) {
      setNomeNova('');
      setCorNova('#25D366');
      setCriandoNova(false);
    }
  };

  const handleToggleEtiqueta = async (etiquetaId) => {
    if (etiquetasConversa.includes(etiquetaId)) {
      await removerEtiquetaConversa(conversa.id, etiquetaId);
    } else {
      await adicionarEtiquetaConversa(conversa.id, etiquetaId);
    }
    onAtualizar();
  };

  const handleDeletarEtiqueta = async (etiquetaId) => {
    if (window.confirm('Deseja realmente deletar esta etiqueta?')) {
      await deletarEtiqueta(etiquetaId);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Gerenciar Etiquetas
          </h3>
          <button
            onClick={onFechar}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
          >
            <FiX size={20} className="text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        {/* Conteúdo */}
        <div className="p-4 max-h-96 overflow-y-auto">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Selecione as etiquetas para: <strong>{conversa.nomeCliente}</strong>
          </p>

          {/* Lista de etiquetas */}
          <div className="space-y-2">
            {etiquetas.map(etiqueta => {
              const estaSelecionada = etiquetasConversa.includes(etiqueta.id);
              const estaEditando = editando === etiqueta.id;

              return (
                <div
                  key={etiqueta.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-700"
                >
                  {estaEditando ? (
                    <div className="flex-1 flex items-center gap-2">
                      <input
                        type="text"
                        defaultValue={etiqueta.nome}
                        className="flex-1 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded
                                 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                      <button
                        onClick={() => setEditando(null)}
                        className="text-green-500 hover:text-green-600"
                      >
                        <FiCheck size={18} />
                      </button>
                    </div>
                  ) : (
                    <>
                      <button
                        onClick={() => handleToggleEtiqueta(etiqueta.id)}
                        className="flex items-center gap-3 flex-1"
                      >
                        <div
                          className={`
                            w-5 h-5 rounded border-2 flex items-center justify-center
                            ${estaSelecionada ? 'bg-green-500 border-green-500' : 'border-gray-300 dark:border-gray-600'}
                          `}
                        >
                          {estaSelecionada && (
                            <FiCheck size={14} className="text-white" />
                          )}
                        </div>

                        <div
                          className="px-3 py-1 rounded-full text-sm"
                          style={{ 
                            backgroundColor: `${etiqueta.cor}20`,
                            color: etiqueta.cor 
                          }}
                        >
                          {etiqueta.nome}
                        </div>

                        <span className="text-xs text-gray-500">
                          ({etiqueta._count?.conversas || 0})
                        </span>
                      </button>

                      <div className="flex gap-1">
                        <button
                          onClick={() => setEditando(etiqueta.id)}
                          className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                        >
                          <FiEdit2 size={14} className="text-gray-600 dark:text-gray-400" />
                        </button>
                        <button
                          onClick={() => handleDeletarEtiqueta(etiqueta.id)}
                          className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/20 rounded transition-colors"
                        >
                          <FiTrash2 size={14} className="text-red-600" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>

          {/* Criar nova etiqueta */}
          {criandoNova ? (
            <div className="mt-4 p-3 border border-gray-300 dark:border-gray-600 rounded-lg">
              <input
                type="text"
                placeholder="Nome da etiqueta"
                value={nomeNova}
                onChange={(e) => setNomeNova(e.target.value)}
                className="w-full px-3 py-2 mb-3 border border-gray-300 dark:border-gray-600 rounded
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />

              <div className="flex gap-2 mb-3 flex-wrap">
                {coresDisponiveis.map(cor => (
                  <button
                    key={cor}
                    onClick={() => setCorNova(cor)}
                    className={`
                      w-8 h-8 rounded-full transition-transform
                      ${corNova === cor ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : ''}
                    `}
                    style={{ backgroundColor: cor }}
                  />
                ))}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleCriarEtiqueta}
                  className="flex-1 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
                >
                  Criar
                </button>
                <button
                  onClick={() => {
                    setCriandoNova(false);
                    setNomeNova('');
                    setCorNova('#25D366');
                  }}
                  className="flex-1 py-2 border border-gray-300 dark:border-gray-600 rounded
                           hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setCriandoNova(true)}
              className="mt-4 w-full py-2 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg
                       hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-900/10
                       text-gray-600 dark:text-gray-400 hover:text-green-500
                       transition-colors flex items-center justify-center gap-2"
            >
              <FiPlus size={18} />
              Nova Etiqueta
            </button>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onFechar}
            className="w-full py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
          >
            Concluir
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalEtiquetas;