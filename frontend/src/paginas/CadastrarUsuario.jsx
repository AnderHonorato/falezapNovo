// src/paginas/CadastrarUsuario.jsx - CORRIGIDO: Select de empresas para fundadores

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contextos/AuthContext';
import {
  User, Mail, Lock, ArrowLeft, Eye, EyeOff,
  Loader2, UserPlus, Shield, Building2, Smartphone, Briefcase
} from 'lucide-react';
import api from '../servicos/api';
import toast from 'react-hot-toast';
import LogoFaleZap from '../componentes/comum/LogoFaleZap';

// Definição das categorias (pode ser importada de outro arquivo)
const CATEGORIAS_MEMBRO = [
  'SAC', 'FATURAMENTO', 'ADMINISTRADOR', 'DESENVOLVEDOR', 'RH', 'OUTRO',
];

export default function CadastrarUsuario() {
  const { usuario: usuarioLogado } = useAuth();
  const navigate = useNavigate();
  const [carregando, setCarregando] = useState(false);
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [empresas, setEmpresas] = useState([]);

  const estadoInicialForm = {
    nome: '',
    email: '',
    senha: '',
    cpf: '',
    telefone: '',
    tipo: 'USUARIO',
    contaId: usuarioLogado?.contaId || '',
    podeEnviarMsg: true,
    podeReceberMsg: true,
    podeGerenciarBot: false,
    podeVerRelatorios: false,
    podeGerenciarConexoes: false,
    categoria: ''
  };

  const [formData, setFormData] = useState(estadoInicialForm);

  useEffect(() => {
    // ✅ CORREÇÃO: Tipos que podem selecionar empresa manualmente
    const tiposComAcessoEmpresas = ['OWNER', 'CEO', 'SUPORTE'];
    
    console.log('🔍 Verificando tipo de usuário:', usuarioLogado?.tipo);
    
    if (usuarioLogado && tiposComAcessoEmpresas.includes(usuarioLogado.tipo)) {
      console.log('✅ Usuário pode selecionar empresas, carregando lista...');
      carregarEmpresas();
    } else if (usuarioLogado?.contaId) {
      console.log('📌 Usuário vinculado à empresa:', usuarioLogado.contaId);
      setFormData(prev => ({ ...prev, contaId: usuarioLogado.contaId }));
    } else {
      console.warn('⚠️ Usuário sem contaId definida');
    }
  }, [usuarioLogado]);

  const carregarEmpresas = async () => {
    try {
      console.log('📡 Buscando empresas...');
      const response = await api.get('/empresas');
      console.log('📦 Empresas recebidas (bruto):', response.data);

      // Normalização da resposta
      let listaDeEmpresas = [];
      if (Array.isArray(response.data)) {
        listaDeEmpresas = response.data;
      } else if (response.data && Array.isArray(response.data.data)) {
        listaDeEmpresas = response.data.data;
      } else if (response.data && Array.isArray(response.data.empresas)) {
        listaDeEmpresas = response.data.empresas;
      }

      console.log('✅ Empresas processadas:', listaDeEmpresas.length, 'encontradas');
      setEmpresas(listaDeEmpresas);

      // Define a primeira empresa como padrão se houver apenas uma
      if (listaDeEmpresas.length === 1) {
        setFormData(prev => ({ ...prev, contaId: listaDeEmpresas[0].id }));
      }

    } catch (error) {
      console.error('❌ Erro ao carregar empresas:', error);
      toast.error('Erro ao carregar empresas');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validação
    if (!formData.contaId) {
      toast.error('Por favor, selecione uma empresa');
      return;
    }

    setCarregando(true);
    const toastId = toast.loading('Criando membro...');

    try {
      const payload = {
        nome: formData.nome,
        email: formData.email,
        senha: formData.senha,
        cpf: formData.cpf || null,
        telefone: formData.telefone || null,
        tipo: formData.tipo,
        contaId: formData.contaId,
        podeEnviarMsg: formData.podeEnviarMsg,
        podeReceberMsg: formData.podeReceberMsg,
        podeGerenciarBot: formData.podeGerenciarBot,
        podeVerRelatorios: formData.podeVerRelatorios,
        podeGerenciarConexoes: formData.podeGerenciarConexoes,
        categoria: formData.categoria || null,
      };

      console.log('📤 Enviando payload:', payload);

      await api.post('/usuarios', payload);
      
      toast.success('Membro cadastrado com sucesso!', { id: toastId });
      navigate(usuarioLogado?.tipo === 'OWNER' ? '/usuarios' : '/equipe');
      
    } catch (error) {
      console.error('❌ Erro ao cadastrar:', error);
      toast.error(
        error.response?.data?.erro || 'Erro ao cadastrar membro', 
        { id: toastId }
      );
    } finally {
      setCarregando(false);
    }
  };

  // Função auxiliar para o switch de permissão
  const handlePermissaoChange = (e) => {
    const { name, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: checked }));
  };

  // ✅ Verifica se deve mostrar o select de empresas
  const mostrarSelectEmpresa = ['OWNER', 'CEO', 'SUPORTE'].includes(usuarioLogado?.tipo);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(usuarioLogado?.tipo === 'OWNER' ? '/usuarios' : '/equipe')}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <LogoFaleZap tamanho="md" />
            </div>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <UserPlus className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Cadastrar Novo Membro</h2>
              <p className="text-sm text-gray-600">
                Preencha os dados e defina as permissões
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Campos Nome, Email, Senha */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo *</label>
              <div className="relative">
                <User className="input-icon" />
                <input
                  type="text"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  className="input-field pl-10"
                  placeholder="Nome do membro"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
              <div className="relative">
                <Mail className="input-icon" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="input-field pl-10"
                  placeholder="email@exemplo.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Senha *</label>
              <div className="relative">
                <Lock className="input-icon" />
                <input
                  type={mostrarSenha ? 'text' : 'password'}
                  value={formData.senha}
                  onChange={(e) => setFormData({ ...formData, senha: e.target.value })}
                  className="input-field pl-10 pr-10"
                  placeholder="Mínimo 6 caracteres"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setMostrarSenha(!mostrarSenha)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {mostrarSenha ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* ✅ CORREÇÃO: Empresa (apenas para OWNER, CEO, SUPORTE) */}
            {mostrarSelectEmpresa && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Empresa * 
                  <span className="text-xs text-gray-500 ml-2">
                    ({empresas.length} disponíveis)
                  </span>
                </label>
                <div className="relative">
                  <Building2 className="input-icon" />
                  <select
                    value={formData.contaId}
                    onChange={(e) => setFormData({ ...formData, contaId: e.target.value })}
                    className="input-field pl-10 appearance-none bg-white"
                    required
                  >
                    <option value="">Selecione uma empresa</option>
                    {empresas.map((empresa) => (
                      <option key={empresa.id} value={empresa.id}>
                        {empresa.razaoSocial || empresa.nomeFantasia || empresa.nomeCompleto || `Empresa ${empresa.id}`}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                      <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                    </svg>
                  </div>
                </div>
              </div>
            )}

            {/* Tipo de Usuário */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Usuário *</label>
              <div className="relative">
                <Shield className="input-icon" />
                <select
                  value={formData.tipo}
                  onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                  className="input-field pl-10 appearance-none bg-white"
                  required
                >
                  <option value="USUARIO">Usuário</option>
                  <option value="ADMIN_EMPRESA">Administrador da Empresa</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                  <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                    <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                  </svg>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {formData.tipo === 'ADMIN_EMPRESA'
                  ? 'Pode gerenciar membros e configurações da empresa.'
                  : 'Acesso padrão para atendimento.'}
              </p>
            </div>

            {/* Campo Categoria (Departamento) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Categoria *</label>
              <div className="relative">
                <Briefcase className="input-icon" />
                <select
                  value={formData.categoria}
                  onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                  className="input-field pl-10 appearance-none bg-white"
                  required
                >
                  <option value="" disabled>Selecione uma categoria...</option>
                  {CATEGORIAS_MEMBRO.map((cat) => (
                    <option key={cat} value={cat}>{cat.replace('_', ' ')}</option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                  <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                    <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                  </svg>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1">Função ou departamento do membro.</p>
            </div>

            {/* Seção de Permissões */}
            <div className="border-t pt-5">
              <h3 className="text-base font-medium text-gray-900 mb-3">Permissões Iniciais</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Permissão Gerenciar Conexões */}
                <label className="flex items-center justify-between gap-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                  <div className="flex items-center gap-3">
                    <Smartphone className="w-5 h-5 text-gray-500" />
                    <span className="text-sm text-gray-700">Gerenciar Conexões</span>
                  </div>
                  <input
                    type="checkbox"
                    name="podeGerenciarConexoes"
                    checked={formData.podeGerenciarConexoes}
                    onChange={handlePermissaoChange}
                    className="w-5 h-5 text-green-600 rounded focus:ring-green-500"
                  />
                </label>
                <p className="text-xs text-gray-500 col-span-2 -mt-2 mb-3">
                  Permite que o membro conecte e desconecte novos números de WhatsApp.
                </p>

                {/* Outras permissões */}
                <label className="flex items-center justify-between gap-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                  <span className="text-sm text-gray-700">Enviar Mensagens</span>
                  <input
                    type="checkbox"
                    name="podeEnviarMsg"
                    checked={formData.podeEnviarMsg}
                    onChange={handlePermissaoChange}
                    className="w-5 h-5 text-green-600 rounded"
                  />
                </label>
                <p className="text-xs text-gray-500 col-span-2 -mt-2 mb-3">
                  Pode iniciar e responder conversas com clientes.
                </p>

                <label className="flex items-center justify-between gap-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                  <span className="text-sm text-gray-700">Receber Mensagens</span>
                  <input
                    type="checkbox"
                    name="podeReceberMsg"
                    checked={formData.podeReceberMsg}
                    onChange={handlePermissaoChange}
                    className="w-5 h-5 text-green-600 rounded"
                  />
                </label>
                <p className="text-xs text-gray-500 col-span-2 -mt-2 mb-3">
                  Permite que o membro veja e seja notificado sobre novas mensagens.
                </p>

                <label className="flex items-center justify-between gap-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                  <span className="text-sm text-gray-700">Gerenciar Bot</span>
                  <input
                    type="checkbox"
                    name="podeGerenciarBot"
                    checked={formData.podeGerenciarBot}
                    onChange={handlePermissaoChange}
                    className="w-5 h-5 text-green-600 rounded"
                  />
                </label>
                <p className="text-xs text-gray-500 col-span-2 -mt-2 mb-3">
                  Acesso total às configurações do Bot de Atendimento Automático.
                </p>

                <label className="flex items-center justify-between gap-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                  <span className="text-sm text-gray-700">Ver Relatórios</span>
                  <input
                    type="checkbox"
                    name="podeVerRelatorios"
                    checked={formData.podeVerRelatorios}
                    onChange={handlePermissaoChange}
                    className="w-5 h-5 text-green-600 rounded"
                  />
                </label>
                <p className="text-xs text-gray-500 col-span-2 -mt-2 mb-3">
                  Permite visualizar relatórios de performance e estatísticas.
                </p>
              </div>
            </div>

            {/* Botões */}
            <div className="flex gap-3 pt-4 border-t mt-4">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={carregando}
                className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {carregando
                  ? (<><Loader2 className="w-5 h-5 animate-spin" /> Criando...</>)
                  : (<><UserPlus className="w-5 h-5" /> Criar Membro</>)
                }
              </button>
            </div>
          </form>
        </div>
      </main>

      {/* Estilos globais */}
      <style jsx global>{`
        .input-icon {
          position: absolute;
          left: 0.75rem;
          top: 50%;
          transform: translateY(-50%);
          width: 1.25rem;
          height: 1.25rem;
          color: #9ca3af;
        }
        .input-field {
          width: 100%;
          padding-top: 0.75rem;
          padding-bottom: 0.75rem;
          padding-right: 1rem;
          border: 1px solid #d1d5db;
          border-radius: 0.5rem;
          outline: none;
          transition: ring 0.15s ease-in-out;
        }
        .input-field:focus {
          ring: 2px;
          ring-color: #10b981;
          border-color: transparent;
        }
      `}</style>
    </div>
  );
}