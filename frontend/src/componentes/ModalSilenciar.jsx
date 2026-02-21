// frontend/src/components/ModalSilenciar.jsx

import React, { useState } from 'react';
import { FiX, FiBellOff } from 'react-icons/fi';

const ModalSilenciar = ({ conversa, onConfirmar, onFechar }) => {
  const [duracao, setDuracao] = useState('8h');

  const opcoesDuracao = [
    { valor: '8h', label: '8 horas' },
    { valor: '1w', label: '1 semana' },
    { valor: 'sempre', label: 'Sempre' }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-full">
              <FiBellOff size={20} className="text-gray-600 dark:text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Silenciar Notificações
            </h3>
          </div>
          <button
            onClick={onFechar}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
          >
            <FiX size={20} className="text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        {/* Conteúdo */}
        <div className="p-6">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Silenciar notificações de: <strong className="text-gray-900 dark:text-white">{conversa.nomeCliente}</strong>
          </p>

          <div className="space-y-2">
            {opcoesDuracao.map(opcao => (
              <label
                key={opcao.valor}
                className={`
                  flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all
                  ${duracao === opcao.valor 
                    ? 'border-green-500 bg-green-50 dark:bg-green-900/20' 
                    : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                  }
                `}
              >
                <input
                  type="radio"
                  name="duracao"
                  value={opcao.valor}
                  checked={duracao === opcao.valor}
                  onChange={(e) => setDuracao(e.target.value)}
                  className="w-4 h-4 text-green-500 focus:ring-green-500"
                />
                <div className="flex-1">
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {opcao.label}
                  </span>
                  {opcao.valor !== 'sempre' && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Notificações serão reativadas automaticamente
                    </p>
                  )}
                </div>
              </label>
            ))}
          </div>

          <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
            <p className="text-sm text-yellow-800 dark:text-yellow-300">
              💡 Você ainda receberá as mensagens, mas sem notificações sonoras ou visuais.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onFechar}
            className="flex-1 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                     hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors
                     text-gray-700 dark:text-gray-300"
          >
            Cancelar
          </button>
          <button
            onClick={() => {
              onConfirmar(duracao);
              onFechar();
            }}
            className="flex-1 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
          >
            Silenciar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalSilenciar;