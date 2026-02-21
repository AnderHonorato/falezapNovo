// src/componentes/comum/ModalConfirmacaoSenha.jsx
import { useState } from 'react';
import { AlertTriangle, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';

export default function ModalConfirmacaoSenha({
  isOpen,
  onClose,
  onConfirm,
  titulo = "Confirmar Ação",
  mensagem = "Para prosseguir, por favor, confirme sua senha.",
  textoBotaoConfirmar = "Confirmar",
  textoBotaoCancelar = "Cancelar",
  isLoading = false,
  tipo = "warning", // 'warning', 'danger', 'info'
}) {
  const [senha, setSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (senha) {
      onConfirm(senha); // Passa a senha para a função de confirmação
    } else {
      // Poderia adicionar um toast aqui se preferir
      alert("Por favor, digite sua senha.");
    }
  };

  const getIconColor = () => {
    switch (tipo) {
      case 'danger': return 'text-red-500';
      case 'info': return 'text-blue-500';
      case 'warning':
      default: return 'text-yellow-500';
    }
  };

  const getButtonColor = () => {
    switch (tipo) {
      case 'danger': return 'bg-red-600 hover:bg-red-700 focus:ring-red-500';
      case 'info': return 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500';
      case 'warning':
      default: return 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 p-4 transition-opacity duration-300 ease-in-out">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md transform transition-all duration-300 ease-in-out scale-100">
        <div className="p-6">
          <div className="flex items-start space-x-4">
            <div className={`flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full ${getIconColor().replace('text-', 'bg-').replace('-500', '-100')} sm:mx-0 sm:h-10 sm:w-10`}>
              <AlertTriangle className={`h-6 w-6 ${getIconColor()}`} aria-hidden="true" />
            </div>
            <div className="mt-0 text-left flex-1">
              <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                {titulo}
              </h3>
              <div className="mt-2">
                <p className="text-sm text-gray-500">{mensagem}</p>
              </div>

              {/* Input de Senha */}
              <div className="mt-4">
                <label htmlFor="senha-confirmacao" className="block text-sm font-medium text-gray-700 mb-1">
                  Sua Senha
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    id="senha-confirmacao"
                    type={mostrarSenha ? 'text' : 'password'}
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="Digite sua senha atual"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setMostrarSenha(!mostrarSenha)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5 text-gray-500 hover:text-gray-700"
                  >
                    {mostrarSenha ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse rounded-b-lg">
          <button
            type="button"
            disabled={isLoading || !senha}
            className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 text-base font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 ${getButtonColor()}`}
            onClick={handleConfirm}
          >
            {isLoading ? <Loader2 className="animate-spin h-5 w-5 mr-2" /> : null}
            {isLoading ? 'Verificando...' : textoBotaoConfirmar}
          </button>
          <button
            type="button"
            disabled={isLoading}
            className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
            onClick={onClose}
          >
            {textoBotaoCancelar}
          </button>
        </div>
      </div>
    </div>
  );
}