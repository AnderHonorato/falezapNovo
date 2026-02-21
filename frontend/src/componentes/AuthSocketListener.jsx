// frontend/src/componentes/AuthSocketListener.jsx
// (Este é um novo arquivo que você precisa criar)

import { useEffect } from 'react';
import { useSocket } from '../contextos/SocketContext';
import { useAuth } from '../contextos/AuthContext';
import { toast } from 'react-hot-toast';

/**
 * Este componente não renderiza nada.
 * Sua única função é "ouvir" eventos do socket e atualizar o AuthContext.
 * Ele deve ser renderizado como filho do AuthProvider e do SocketProvider.
 */
export default function AuthSocketListener() {
  const { socket } = useSocket();
  const { atualizarUsuarioContexto } = useAuth();

  useEffect(() => {
    // Só executa se o socket estiver conectado E a função de atualização existir
    if (socket && atualizarUsuarioContexto) {
      
      const handlePermissoesAtualizadas = (dados) => {
        if (dados && dados.usuario) {
          console.log('Permissões atualizadas recebidas via socket:', dados.usuario);
          
          // Atualiza o contexto (que também atualiza o localStorage)
          atualizarUsuarioContexto(dados.usuario);

          // Notifica o usuário de forma não intrusiva
          toast.info('Suas permissões foram atualizadas por um administrador.', {
            duration: 6000,
            position: 'top-right'
          });
        }
      };

      // "Ouve" o evento vindo do backend
      // (O nome 'permissoes_atualizadas' deve ser o mesmo que você usou no controlador)
      socket.on('permissoes_atualizadas', handlePermissoesAtualizadas);

      // Função de "limpeza" do useEffect: para de ouvir quando o componente desmontar
      return () => {
        socket.off('permissoes_atualizadas', handlePermissoesAtualizadas);
      };
    }
  }, [socket, atualizarUsuarioContexto]); // Dependências do hook

  return null; // Não renderiza nada na tela
}
