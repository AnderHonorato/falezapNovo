// frontend/src/componentes/RotaProtegida.jsx

import { Navigate } from 'react-router-dom';
import { useAuth } from '../contextos/AuthContext';
import { Loader2 } from 'lucide-react';

export default function RotaProtegida({ children, tiposPermitidos = [] }) {
  const { usuario, carregando } = useAuth();

  // Mostra loading enquanto verifica autenticação
  if (carregando) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-green-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  // Se não está autenticado, redireciona para login
  if (!usuario) {
    return <Navigate to="/login" replace />;
  }

  // Se há tipos permitidos e o usuário não está na lista, redireciona
  if (tiposPermitidos.length > 0 && !tiposPermitidos.includes(usuario.tipo)) {
    return <Navigate to="/dashboard" replace />;
  }

  // Se passou em todas as validações, renderiza o componente filho
  return children;
}