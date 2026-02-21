// frontend/src/componentes/ProtectedRoute.jsx

import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contextos/AuthContext';
import { Loader2 } from 'lucide-react';

/**
 * Componente de Rota Protegida
 * @param {object} props
 * @param {React.ReactNode} props.children - O componente da página a ser renderizado.
 * @param {string[]} [props.requiredRoles=[]] - Lista de 'tipos' de usuário que podem acessar (ex: ['OWNER', 'ADMIN']).
 * @param {string} [props.requiredPermission=null] - A permissão granular específica necessária (ex: 'podeAcessarAnalytics').
 * @param {boolean} [props.requireAdmin=false] - (Legado) Verifica se o usuário é ADMIN ou superior.
 * @param {boolean} [props.requireOwner=false] - (Legado) Verifica se o usuário é OWNER.
 */
export default function ProtectedRoute({ 
  children, 
  requiredRoles = [], 
  requiredPermission = null,
  requireAdmin = false, // <-- Adiciona a prop antiga
  requireOwner = false  // <-- Adiciona a prop antiga
}) {
  const { usuario, carregandoAutenticacao } = useAuth();
  const location = useLocation();

  // 1. Mostrar Loading
  if (carregandoAutenticacao) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 dark:text-blue-400 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Verificando acesso...</p>
        </div>
      </div>
    );
  }

  // 2. Redirecionar se não estiver logado
  if (!usuario) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  // Bypass universal para OWNER
  if (usuario.tipo === 'OWNER') {
    return children;
  }

  // 3. ✅ LÓGICA DE VERIFICAÇÃO UNIFICADA

  // 3a. Verifica permissão de OWNER (legado)
  if (requireOwner) {
    // O bypass do OWNER já tratou o OWNER, então qualquer um aqui NÃO é owner
    console.warn(`Acesso negado (requireOwner) para ${usuario.email} na rota ${location.pathname}`);
    return <AcessoNegadoPage />;
  }

  // 3b. Verifica permissão de ADMIN (legado)
  // ✅ CORREÇÃO AQUI: Adicionado 'CEO' à lista de admin
  const isAdminOrHigher = ['CEO', 'ADMIN', 'ADMIN_EMPRESA'].includes(usuario.tipo);
  if (requireAdmin && !isAdminOrHigher) {
    console.warn(`Acesso negado (requireAdmin) para ${usuario.email} na rota ${location.pathname}`);
    return <AcessoNegadoPage />;
  }
  
  // 3c. Verifica por Papel (Role)
  if (requiredRoles.length > 0 && !requiredRoles.includes(usuario.tipo)) {
    console.warn(`Acesso negado (ROLE required: ${requiredRoles.join(',')}) para ${usuario.email} na rota ${location.pathname}`);
    return <AcessoNegadoPage />;
  }

  // 3d. Verifica por Permissão Granular
  if (requiredPermission && !usuario[requiredPermission]) {
    console.warn(`Acesso negado (PERMISSION required: ${requiredPermission}) para ${usuario.email} na rota ${location.pathname}`);
    return <AcessoNegadoPage />;
  }
  
  // 4. Se passou por todas as verificações, permite o acesso
  return children;
}

// Componente interno para a tela de Acesso Negado
function AcessoNegadoPage() {
  const navigateTo = (path) => {
    // Usar window.location para navegação fora do contexto do Router, se necessário
    window.location.href = path;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
      <div className="text-center max-w-md bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg">
        <div className="bg-red-100 dark:bg-red-900/30 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-5 border-4 border-red-200 dark:border-red-800/50">
          <span className="text-3xl">🚫</span>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Acesso Negado</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Você não possui permissão para acessar esta página. Caso necessário, solicite ao superior o acesso.
        </p>
        <button
          onClick={() => window.history.length > 1 ? window.history.back() : navigateTo('/dashboard')}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-150 ease-in-out font-medium"
        >
          Voltar
        </button>
      </div>
    </div>
  );
}


