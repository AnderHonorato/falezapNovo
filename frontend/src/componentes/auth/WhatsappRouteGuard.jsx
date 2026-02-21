// src/componentes/auth/WhatsappRouteGuard.jsx
import { useAuth } from '../../contextos/AuthContext';
import { Navigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function WhatsappRouteGuard({ children }) {
  const { usuario, carregando } = useAuth();

  if (carregando) {
    // Pode adicionar um componente de <Loading /> aqui
    return <div>Carregando...</div>;
  }

  if (!usuario) {
    return <Navigate to="/login" replace />;
  }
  
  const temPermissao = 
    usuario.tipo === 'OWNER' || 
    usuario.tipo === 'ADMIN_EMPRESA' || 
    usuario.podeGerenciarConexoes;
    
  if (temPermissao) {
    return children;
  } else {
    // Não tem permissão, volta pro dashboard e avisa
    toast.error("Você não tem permissão para gerenciar conexões.");
    return <Navigate to="/dashboard" replace />;
  }
}