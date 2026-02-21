// frontend/src/contextos/AuthContext.jsx - CORRIGIDO (REVERTIDO)

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../servicos/api';

const AuthContext = createContext({});

// Helper para formatar data/hora
const formatarDataHoraSimples = (dataIso) => {
    if (!dataIso) return 'data desconhecida';
    try {
      const data = new Date(dataIso);
      if (isNaN(data.getTime())) {
         throw new Error("Data inválida recebida");
      }
      return `${data.toLocaleDateString('pt-BR')} às ${data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
    } catch (e) {
      console.error("Erro ao formatar data:", dataIso, e);
      return 'data inválida';
    }
};


export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    verificarAutenticacao();
  }, []);

  const verificarAutenticacao = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setCarregando(false);
      return;
    }
    try {
      const response = await api.get('/auth/verificar-sessao');
      
      if (response.data.valido && response.data.usuario?.status !== 'INATIVO' && response.data.usuario?.statusSistema !== 'INATIVO') {
        setUsuario(response.data.usuario);
        localStorage.setItem('usuario', JSON.stringify(response.data.usuario));
      } else {
         console.warn("Sessão inválida ou usuário inativo, deslogando.");
        localStorage.removeItem('token');
        localStorage.removeItem('usuario');
        setUsuario(null);
      }
    } catch (error) {
      console.error('Erro ao verificar autenticação (pode ser normal se o token expirou):', error.message);
      if (error.response?.status !== 401) { 
        localStorage.removeItem('token');
        localStorage.removeItem('usuario');
      }
      setUsuario(null);
    } finally {
      setCarregando(false);
    }
  };

  const login = async (credentials) => {
    const { tipoLogin } = credentials; 
    try {
      const response = await api.post('/auth/login', credentials);
      const usuarioLogado = response.data.usuario;
      const token = response.data.token;

       if (!usuarioLogado) {
          return { sucesso: false, mensagem: response.data.erro || 'Usuário não encontrado.' };
       }

      if (tipoLogin === 'empresa' && usuarioLogado.tipo === 'COLABORADOR') {
        return { sucesso: false, mensagem: 'Colaboradores devem usar o "Login Colaborador".' };
      }
      if (tipoLogin === 'colaborador' && usuarioLogado.tipo !== 'COLABORADOR') {
        return { sucesso: false, mensagem: 'Este login é apenas para Colaboradores.' };
      }

      if (usuarioLogado.status === 'INATIVO' || usuarioLogado.statusSistema === 'INATIVO') {
        const dataInativacao = usuarioLogado.inativadoEm ? formatarDataHoraSimples(usuarioLogado.inativadoEm) : 'data desconhecida';
        return {
          sucesso: false,
          mensagem: `Conta inativa desde ${dataInativacao}. Contate o administrador.`
        };
      }

      if (response.data.sucesso && token) {
        localStorage.setItem('token', token);
        localStorage.setItem('usuario', JSON.stringify(usuarioLogado));
        setUsuario(usuarioLogado);
        return { sucesso: true, usuario: usuarioLogado };
      }

      return { sucesso: false, mensagem: response.data.erro || 'Credenciais inválidas ou erro desconhecido.' };

    } catch (error) {
      console.error('Erro detalhado no login (AuthContext):', error);
      if (error.response?.data?.erro) {
        return { sucesso: false, mensagem: error.response.data.erro };
      }
      if (error.response) {
        return { sucesso: false, mensagem: `Erro do servidor: ${error.response.status}` };
      } else if (error.request) {
        return { sucesso: false, mensagem: 'Não foi possível conectar ao servidor. Tente novamente.' };
      } else {
        return { sucesso: false, mensagem: 'Ocorreu um erro inesperado durante o login. Tente novamente.' };
      }
    }
  };

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    sessionStorage.clear();
    setUsuario(null);
    window.location.href = '/login';
  }, []);

  // Esta função é chamada pelo AuthSocketListener
  const atualizarUsuarioContexto = useCallback((dadosAtualizados) => {
    setUsuario((usuarioAtual) => {
      if (usuarioAtual) {
        const usuarioNovo = { ...usuarioAtual, ...dadosAtualizados };
        localStorage.setItem('usuario', JSON.stringify(usuarioNovo)); // Atualiza no LS também
        return usuarioNovo;
      }
      return null;
    });
  }, []);

  return (
    <AuthContext.Provider value={{
        usuario,
        carregandoAutenticacao: carregando,
        login,
        logout,
        atualizarUsuarioContexto, // A função continua aqui
        estaLogado: !!usuario
        }}>
      {!carregando && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
     throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
}
