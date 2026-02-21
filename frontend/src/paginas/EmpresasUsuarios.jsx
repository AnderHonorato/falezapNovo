// src/paginas/EmpresasUsuarios.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contextos/AuthContext';
import {
  Building2,
  Plus,
  Edit2,
  Trash2,
  ArrowLeft,
  Search,
  Users,
  CheckCircle,
  XCircle,
  Settings,
  UserPlus,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Shield,
  User as UserIcon,
  Loader2 // ADDED
} from 'lucide-react';
import api from '../servicos/api';

export default function EmpresasUsuarios() {
  const { usuario } = useAuth();
  const navigate = useNavigate();
  const [empresas, setEmpresas] = useState([]);
  const [empresaSelecionada, setEmpresaSelecionada] = useState(null);
  const [usuarios, setUsuarios] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [busca, setBusca] = useState('');
  const [mostrarModalEmpresa, setMostrarModalEmpresa] = useState(false);
  const [mostrarModalUsuario, setMostrarModalUsuario] = useState(false);
  const [empresaEditando, setEmpresaEditando] = useState(null);
  const [usuarioEditando, setUsuarioEditando] = useState(null);
  const [mostrarSenha, setMostrarSenha] = useState(false);
  
  // ADDED: Estados de carregamento para modais
  const [salvandoEmpresa, setSalvandoEmpresa] = useState(false);
  const [salvandoUsuario, setSalvandoUsuario] = useState(false);

  const [formEmpresa, setFormEmpresa] = useState({
    nome: '',
    cnpj: '',
    telefone: '',
    email: '',
  });

  const [formUsuario, setFormUsuario] = useState({
    nome: '',
    email: '',
    senha: '',
    tipo: 'USUARIO',
    ativo: true,
  });

  useEffect(() => {
    // ADDED: Redireciona se não for OWNER
    if (usuario && usuario.tipo !== 'OWNER') {
      navigate('/dashboard');
    } else {
      carregarEmpresas();
    }
  }, [usuario, navigate]);

  useEffect(() => {
    if (empresaSelecionada) {
      carregarUsuariosDaEmpresa(empresaSelecionada.id);
    }
  }, [empresaSelecionada]);

  const carregarEmpresas = async () => {
      try {
        const response = await api.get('/empresas');
        console.log("EmpresasUsuarios (bruto):", response.data); // Log

        // --- INÍCIO DA CORREÇÃO ---
        let listaDeEmpresas = [];
        if (Array.isArray(response.data)) {
          listaDeEmpresas = response.data;
        } else if (response.data && Array.isArray(response.data.data)) {
          listaDeEmpresas = response.data.data;
        } else if (response.data && Array.isArray(response.data.empresas)) {
          listaDeEmpresas = response.data.empresas;
        }
        // --- FIM DA CORREÇÃO ---
        
        setEmpresas(listaDeEmpresas);
        
        // Se não tem empresa selecionada e tem empresas, seleciona a primeira
        if (!empresaSelecionada && listaDeEmpresas.length > 0) {
          setEmpresaSelecionada(listaDeEmpresas[0]);
        }
      } catch (error) {
        console.error('Erro ao carregar empresas:', error);
      } finally {
        setCarregando(false);
      }
    };

  const carregarUsuariosDaEmpresa = async (empresaId) => {
    try {
      const response = await api.get(`/empresas/${empresaId}/usuarios`);
      setUsuarios(response.data || []);
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
      setUsuarios([]);
    }
  };

  const handleSubmitEmpresa = async (e) => {
    e.preventDefault();
    setSalvandoEmpresa(true); // ADDED
    try {
      if (empresaEditando) {
        await api.put(`/empresas/${empresaEditando.id}`, formEmpresa);
      } else {
        await api.post('/empresas', formEmpresa);
      }
      setMostrarModalEmpresa(false);
      setFormEmpresa({ nome: '', cnpj: '', telefone: '', email: '' });
      setEmpresaEditando(null);
      carregarEmpresas();
    } catch (error) {
      console.error('Erro ao salvar empresa:', error);
      alert(error.response?.data?.mensagem || 'Erro ao salvar empresa');
    } finally {
      setSalvandoEmpresa(false); // ADDED
    }
  };

  const handleSubmitUsuario = async (e) => {
    e.preventDefault();
    setSalvandoUsuario(true); // ADDED
    try {
      const dadosUsuario = {
        ...formUsuario,
        contaId: empresaSelecionada.id,
        status: formUsuario.ativo ? 'ATIVO' : 'INATIVO'
      };

      if (usuarioEditando) {
        // Se não preencheu senha, remove do objeto
        if (!dadosUsuario.senha) {
          delete dadosUsuario.senha;
        }
        await api.put(`/usuarios/${usuarioEditando.id}`, dadosUsuario);
      } else {
        await api.post('/usuarios', dadosUsuario);
      }
      
      setMostrarModalUsuario(false);
      setFormUsuario({ nome: '', email: '', senha: '', tipo: 'USUARIO', ativo: true });
      setUsuarioEditando(null);
      carregarUsuariosDaEmpresa(empresaSelecionada.id);
    } catch (error) {
      console.error('Erro ao salvar usuário:', error);
      alert(error.response?.data?.mensagem || 'Erro ao salvar usuário');
    } finally {
      setSalvandoUsuario(false); // ADDED
    }
  };

  const handleEditarEmpresa = (empresa) => {
    setEmpresaEditando(empresa);
    setFormEmpresa({
      nome: empresa.nome,
      cnpj: empresa.cnpj || '',
      telefone: empresa.telefone || '',
      email: empresa.email || '',
    });
    setMostrarModalEmpresa(true);
  };

  const handleEditarUsuario = (user) => {
    setUsuarioEditando(user);
    setFormUsuario({
      nome: user.nome,
      email: user.email,
      senha: '',
      tipo: user.tipo,
      ativo: user.status === 'ATIVO',
    });
    setMostrarModalUsuario(true);
  };

  const handleDeletarEmpresa = async (id) => {
    if (!confirm('Tem certeza que deseja deletar esta empresa? Todos os usuários vinculados serão removidos.')) return;
    try {
      await api.delete(`/empresas/${id}`);
      if (empresaSelecionada?.id === id) {
        setEmpresaSelecionada(null);
      }
      carregarEmpresas();
    } catch (error) {
      console.error('Erro ao deletar empresa:', error);
      alert(error.response?.data?.mensagem || 'Erro ao deletar empresa');
    }
  };

  const handleDeletarUsuario = async (id) => {
    if (!confirm('Tem certeza que deseja deletar este usuário?')) return;
    try {
      await api.delete(`/usuarios/${id}`);
      carregarUsuariosDaEmpresa(empresaSelecionada.id);
    } catch (error) {
      console.error('Erro ao deletar usuário:', error);
      alert(error.response?.data?.mensagem || 'Erro ao deletar usuário');
    }
  };

  const handleAlterarStatusUsuario = async (id, novoStatus) => {
    try {
      await api.patch(`/usuarios/${id}/status`, { status: novoStatus });
      carregarUsuariosDaEmpresa(empresaSelecionada.id);
    } catch (error) {
      console.error('Erro ao alterar status:', error);
      alert('Erro ao alterar status do usuário');
    }
  };

  const empresasFiltradas = empresas.filter((empresa) =>
    empresa.nome.toLowerCase().includes(busca.toLowerCase())
  );

  const usuariosFiltrados = usuarios.filter((user) =>
    user.nome.toLowerCase().includes(busca.toLowerCase()) ||
    user.email.toLowerCase().includes(busca.toLowerCase())
  );

  const getTipoLabel = (tipo) => {
    switch(tipo) {
      case 'OWNER': return 'Proprietário';
      case 'ADMIN_EMPRESA': return 'Administrador';
      case 'USUARIO': return 'Usuário';
      default: return tipo;
    }
  };

  const getTipoIcon = (tipo) => {
    switch(tipo) {
      case 'OWNER': return <Shield className="w-4 h-4 text-yellow-600" />;
      case 'ADMIN_EMPRESA': return <Shield className="w-4 h-4 text-blue-600" />;
      default: return <UserIcon className="w-4 h-4 text-gray-600" />;
    }
  };

  // ADDED: Se o usuário não for owner (ou estiver carregando), não renderiza nada
  if (!usuario || usuario.tipo !== 'OWNER') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - REMOVIDO (Está no MainLayout) */}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Lista de Empresas */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Empresas</h2>
                {usuario?.tipo === 'OWNER' && (
                  <button
                    onClick={() => {
                      setEmpresaEditando(null);
                      setFormEmpresa({ nome: '', cnpj: '', telefone: '', email: '' });
                      setMostrarModalEmpresa(true);
                    }}
                    className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Search */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar empresa..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>

              {carregando ? (
                <div className="text-center py-8">
                  <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                </div>
              ) : empresasFiltradas.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Building2 className="w-12 h-12 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Nenhuma empresa encontrada</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {empresasFiltradas.map((empresa) => (
                    <div
                      key={empresa.id}
                      onClick={() => setEmpresaSelecionada(empresa)}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition ${
                        empresaSelecionada?.id === empresa.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 truncate">{empresa.nome}</h3>
                          <p className="text-sm text-gray-500 mt-1">
                            {empresa._count?.usuarios || 0} usuários
                          </p>
                        </div>
                        {usuario?.tipo === 'OWNER' && (
                          <div className="flex gap-1 ml-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditarEmpresa(empresa);
                              }}
                              className="p-1.5 hover:bg-white rounded transition"
                            >
                              <Edit2 className="w-4 h-4 text-gray-600" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeletarEmpresa(empresa.id);
                              }}
                              className="p-1.5 hover:bg-red-50 rounded transition"
                            >
                              <Trash2 className="w-4 h-4 text-red-600" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Usuários da Empresa Selecionada */}
          <div className="lg:col-span-2">
            {!empresaSelecionada ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
                <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Selecione uma empresa
                </h3>
                <p className="text-gray-500">
                  Escolha uma empresa na lista ao lado para visualizar e gerenciar seus usuários
                </p>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                {/* Header da Empresa */}
                <div className="p-6 border-b border-gray-100">
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="text-xl font-bold text-gray-900 mb-1">
                        {empresaSelecionada.nome}
                      </h2>
                      <p className="text-sm text-gray-500">
                        {empresaSelecionada.email || 'Sem email cadastrado'}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setUsuarioEditando(null);
                        setFormUsuario({ nome: '', email: '', senha: '', tipo: 'USUARIO', ativo: true });
                        setMostrarModalUsuario(true);
                      }}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                    >
                      <UserPlus className="w-4 h-4" />
                      Novo Usuário
                    </button>
                  </div>
                </div>

                {/* Lista de Usuários */}
                <div className="p-6">
                  {usuariosFiltrados.length === 0 ? (
                    <div className="text-center py-12">
                      <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        Nenhum usuário cadastrado
                      </h3>
                      <p className="text-gray-500 mb-4">
                        Adicione o primeiro membro para esta empresa
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {usuariosFiltrados.map((user) => (
                        <div
                          key={user.id}
                          className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
                        >
                          <div className="flex items-center gap-4 flex-1">
                            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                              {getTipoIcon(user.tipo)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-semibold text-gray-900 truncate">
                                  {user.nome}
                                </h3>
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                  user.status === 'ATIVO'
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-red-100 text-red-700'
                                }`}>
                                  {user.status === 'ATIVO' ? 'Ativo' : 'Inativo'}
                                </span>
                              </div>
                              <p className="text-sm text-gray-500">{user.email}</p>
                              <p className="text-xs text-gray-400 mt-1">
                                {getTipoLabel(user.tipo)}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {user.tipo !== 'OWNER' && (
                              <>
                                <button
                                  onClick={() => handleAlterarStatusUsuario(
                                    user.id,
                                    user.status === 'ATIVO' ? 'INATIVO' : 'ATIVO'
                                  )}
                                  className="p-2 hover:bg-gray-100 rounded-lg transition"
                                  title={user.status === 'ATIVO' ? 'Inativar' : 'Ativar'}
                                >
                                  {user.status === 'ATIVO' ? (
                                    <XCircle className="w-5 h-5 text-red-600" />
                                  ) : (
                                    <CheckCircle className="w-5 h-5 text-green-600" />
                                  )}
                                </button>
                                <button
                                  onClick={() => handleEditarUsuario(user)}
                                  className="p-2 hover:bg-gray-100 rounded-lg transition"
                                >
                                  <Edit2 className="w-4 h-4 text-gray-600" />
                                </button>
                                <button
                                  onClick={() => handleDeletarUsuario(user.id)}
                                  className="p-2 hover:bg-red-50 rounded-lg transition"
                                >
                                  <Trash2 className="w-4 h-4 text-red-600" />
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Modal Empresa */}
      {mostrarModalEmpresa && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              {empresaEditando ? 'Editar Empresa' : 'Nova Empresa'}
            </h2>

            <form onSubmit={handleSubmitEmpresa} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome da Empresa *
                </label>
                <input
                  type="text"
                  value={formEmpresa.nome}
                  onChange={(e) => setFormEmpresa({ ...formEmpresa, nome: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  CNPJ
                </label>
                <input
                  type="text"
                  value={formEmpresa.cnpj}
                  onChange={(e) => setFormEmpresa({ ...formEmpresa, cnpj: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="00.000.000/0000-00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Telefone
                </label>
                <input
                  type="text"
                  value={formEmpresa.telefone}
                  onChange={(e) => setFormEmpresa({ ...formEmpresa, telefone: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="(00) 00000-0000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={formEmpresa.email}
                  onChange={(e) => setFormEmpresa({ ...formEmpresa, email: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="contato@empresa.com"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setMostrarModalEmpresa(false);
                    setEmpresaEditando(null);
                  }}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                  disabled={salvandoEmpresa} // ADDED
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2" // MODIFIED
                  disabled={salvandoEmpresa} // ADDED
                >
                  {/* ADDED: Feedback de carregamento */}
                  {salvandoEmpresa && <Loader2 className="w-4 h-4 animate-spin" />}
                  {salvandoEmpresa ? 'Salvando...' : (empresaEditando ? 'Salvar' : 'Criar')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Usuário */}
      {mostrarModalUsuario && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              {usuarioEditando ? 'Editar Usuário' : 'Novo Usuário'}
            </h2>

            <form onSubmit={handleSubmitUsuario} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  value={formUsuario.nome}
                  onChange={(e) => setFormUsuario({ ...formUsuario, nome: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    value={formUsuario.email}
                    onChange={(e) => setFormUsuario({ ...formUsuario, email: e.target.value })}
                    className="w-full pl-11 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Senha {usuarioEditando && '(deixe vazio para não alterar)'}
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type={mostrarSenha ? 'text' : 'password'}
                    value={formUsuario.senha}
                    onChange={(e) => setFormUsuario({ ...formUsuario, senha: e.target.value })}
                    className="w-full pl-11 pr-11 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                    required={!usuarioEditando}
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setMostrarSenha(!mostrarSenha)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {mostrarSenha ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Usuário *
                </label>
                <select
                  value={formUsuario.tipo}
                  onChange={(e) => setFormUsuario({ ...formUsuario, tipo: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                  required
                >
                  <option value="USUARIO">Usuário</option>
                  <option value="ADMIN_EMPRESA">Administrador da Empresa</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  {formUsuario.tipo === 'ADMIN_EMPRESA' 
                    ? 'Pode gerenciar usuários da empresa'
                    : 'Acesso apenas ao chat de mensagens'}
                </p>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium text-gray-700">Usuário Ativo</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formUsuario.ativo}
                    onChange={(e) => setFormUsuario({ ...formUsuario, ativo: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setMostrarModalUsuario(false);
                    setUsuarioEditando(null);
                  }}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                  disabled={salvandoUsuario} // ADDED
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center justify-center gap-2" // MODIFIED
                  disabled={salvandoUsuario} // ADDED
                >
                  {/* ADDED: Feedback de carregamento */}
                  {salvandoUsuario && <Loader2 className="w-4 h-4 animate-spin" />}
                  {salvandoUsuario ? 'Salvando...' : (usuarioEditando ? 'Salvar' : 'Criar')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}