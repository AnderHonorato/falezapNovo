// src/paginas/Equipe.jsx - SISTEMA DE PERMISSÕES COMPLETO

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contextos/AuthContext';
import {
    Users, Plus, Edit2, Trash2, Search, Shield,
    User, Loader2, UserPlus, Mail, Lock, Eye, EyeOff,
    CheckCircle, Smartphone, Briefcase, Settings, MessageSquare,
    BarChart3, FileText, Megaphone, Zap, DollarSign, Building2,
    HelpCircle, AlertTriangle, Newspaper
} from 'lucide-react';
import api from '../servicos/api';
import toast from 'react-hot-toast';
import ModalConfirmacaoSenha from '../componentes/comum/ModalConfirmacaoSenha';
import Modal from '../componentes/comum/Modal';

// Componente auxiliar para renderizar cada permissão
const PermissionItem = ({ icon, label, name, checked, onChange, description }) => (
    <div>
        <label className="flex items-center justify-between gap-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
            <div className="flex items-center gap-3">
                {icon}
                <span className="text-sm text-gray-700">{label}</span>
            </div>
            <input
                type="checkbox"
                name={name}
                checked={checked}
                onChange={onChange}
                className="w-5 h-5 text-orange-600 rounded focus:ring-orange-500 flex-shrink-0"
            />
        </label>
        {description && <p className="text-xs text-gray-500 mt-1 pl-3">{description}</p>}
    </div>
);

// PERFIS PRÉ-DEFINIDOS (Baseados nas rotas reais do App.jsx)
const PERFIS_PERMISSOES = {
    CEO: {
        nome: 'CEO / Diretor',
        descricao: 'Acesso total exceto funcionalidades de OWNER',
        permissoes: {
            // Acesso a Páginas
            podeAcessarDashboard: true,
            podeAcessarMensagens: true,
            podeAcessarWhatsApp: true,
            podeAcessarEmpresasUsuarios: true,
            podeAcessarBlog: true,
            podeAcessarAnalytics: true,
            podeAcessarEquipe: true,
            podeAcessarSuporte: false,
            podeAcessarChatInterno: true,
            
            // Funcionalidades Específicas
            podeEnviarMsg: true,
            podeReceberMsg: true,
            podeGerenciarConexoes: true,
            podeGerenciarBot: true,
            podeVerRelatorios: true,
            podeGerenciarEquipe: true,
            podeGerenciarUsuarios: true,
            podeVerSolicitacoesAjuda: true,
            podeVerAlertas: true,
            
            // Permissões Administrativas
            podeCriarPost: false, // Apenas OWNER
            podeGerenciarEmpresas: false, // Apenas OWNER
        }
    },
    GERENTE: {
        nome: 'Gerente',
        descricao: 'Gerencia operações e equipe',
        permissoes: {
            // Acesso a Páginas
            podeAcessarDashboard: true,
            podeAcessarMensagens: true,
            podeAcessarWhatsApp: true,
            podeAcessarEmpresasUsuarios: true,
            podeAcessarBlog: true,
            podeAcessarAnalytics: true,
            podeAcessarEquipe: true,
            podeAcessarSuporte: false,
            podeAcessarChatInterno: true,
            
            // Funcionalidades Específicas
            podeEnviarMsg: true,
            podeReceberMsg: true,
            podeGerenciarConexoes: false,
            podeGerenciarBot: true,
            podeVerRelatorios: true,
            podeGerenciarEquipe: true,
            podeGerenciarUsuarios: true,
            podeVerSolicitacoesAjuda: true,
            podeVerAlertas: true,
            
            // Permissões Administrativas
            podeCriarPost: false,
            podeGerenciarEmpresas: false,
        }
    },
    SUPERVISOR: {
        nome: 'Supervisor',
        descricao: 'Supervisiona atendimento e monitora equipe',
        permissoes: {
            // Acesso a Páginas
            podeAcessarDashboard: true,
            podeAcessarMensagens: true,
            podeAcessarWhatsApp: true,
            podeAcessarEmpresasUsuarios: true,
            podeAcessarBlog: true,
            podeAcessarAnalytics: true,
            podeAcessarEquipe: false,
            podeAcessarSuporte: false,
            podeAcessarChatInterno: false,
            
            // Funcionalidades Específicas
            podeEnviarMsg: true,
            podeReceberMsg: true,
            podeGerenciarConexoes: false,
            podeGerenciarBot: false,
            podeVerRelatorios: true,
            podeGerenciarEquipe: false,
            podeGerenciarUsuarios: false,
            podeVerSolicitacoesAjuda: false,
            podeVerAlertas: false,
            
            // Permissões Administrativas
            podeCriarPost: false,
            podeGerenciarEmpresas: false,
        }
    },
    ATENDENTE: {
        nome: 'Atendente',
        descricao: 'Atende clientes e gerencia conversas',
        permissoes: {
            // Acesso a Páginas
            podeAcessarDashboard: true,
            podeAcessarMensagens: true,
            podeAcessarWhatsApp: false,
            podeAcessarEmpresasUsuarios: false,
            podeAcessarBlog: true,
            podeAcessarAnalytics: false,
            podeAcessarEquipe: false,
            podeAcessarSuporte: false,
            podeAcessarChatInterno: false,
            
            // Funcionalidades Específicas
            podeEnviarMsg: true,
            podeReceberMsg: true,
            podeGerenciarConexoes: false,
            podeGerenciarBot: false,
            podeVerRelatorios: false,
            podeGerenciarEquipe: false,
            podeGerenciarUsuarios: false,
            podeVerSolicitacoesAjuda: false,
            podeVerAlertas: false,
            
            // Permissões Administrativas
            podeCriarPost: false,
            podeGerenciarEmpresas: false,
        }
    },
    SUPORTE: {
        nome: 'Suporte Técnico',
        descricao: 'Acesso a chat interno e solicitações',
        permissoes: {
            // Acesso a Páginas
            podeAcessarDashboard: true,
            podeAcessarMensagens: false,
            podeAcessarWhatsApp: false,
            podeAcessarEmpresasUsuarios: true,
            podeAcessarBlog: true,
            podeAcessarAnalytics: false,
            podeAcessarEquipe: false,
            podeAcessarSuporte: true,
            podeAcessarChatInterno: true,
            
            // Funcionalidades Específicas
            podeEnviarMsg: false,
            podeReceberMsg: false,
            podeGerenciarConexoes: false,
            podeGerenciarBot: false,
            podeVerRelatorios: false,
            podeGerenciarEquipe: false,
            podeGerenciarUsuarios: false,
            podeVerSolicitacoesAjuda: true,
            podeVerAlertas: true,
            
            // Permissões Administrativas
            podeCriarPost: false,
            podeGerenciarEmpresas: false,
        }
    },
    PERSONALIZADO: {
        nome: 'Personalizado',
        descricao: 'Configure manualmente as permissões',
        permissoes: null // Usuário define manualmente
    }
};

// CATEGORIAS: Simulação de dados iniciais
const CATEGORIAS_MEMBROS_DEFAULT = [
    { id: 'c1', nome: 'Sem categoria', membros: 0 },
];

export default function Equipe() {
    const { usuario: usuarioLogado } = useAuth();
    const navigate = useNavigate();
    const [membros, setMembros] = useState([]);
    const [carregando, setCarregando] = useState(true);
    const [busca, setBusca] = useState('');
    const [mostrarModal, setMostrarModal] = useState(false);
    const [membroEditando, setMembroEditando] = useState(null);
    const [mostrarSenha, setMostrarSenha] = useState(false);

    // Estado para perfil de permissões selecionado
    const [perfilSelecionado, setPerfilSelecionado] = useState('PERSONALIZADO');

    // ESTADOS PARA GESTÃO DE CATEGORIAS
    const [categoriasAtivas, setCategoriasAtivas] = useState(CATEGORIAS_MEMBROS_DEFAULT);
    const [mostrarModalCategorias, setMostrarModalCategorias] = useState(false);
    const [mostrarModalCategoriaEdit, setMostrarModalCategoriaEdit] = useState(false);
    const [categoriaEditando, setCategoriaEditando] = useState(null);
    const [formCategoria, setFormCategoria] = useState({ id: null, nome: '' });
    const [confirmDeleteCategoria, setConfirmDeleteCategoria] = useState({ isOpen: false, categoria: null });

    // Estados para o Modal de Deleção de Membro
    const [showConfirmDeleteModal, setShowConfirmDeleteModal] = useState(false);
    const [userIdToDelete, setUserIdToDelete] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const estadoInicialForm = {
        nome: '',
        email: '',
        senha: '',
        tipo: 'USUARIO',
        // Acesso a Páginas
        podeAcessarDashboard: true,
        podeAcessarMensagens: true,
        podeAcessarWhatsApp: false,
        podeAcessarEmpresasUsuarios: false,
        podeAcessarBlog: true,
        podeAcessarAnalytics: false,
        podeAcessarEquipe: false,
        podeAcessarSuporte: false,
        podeAcessarChatInterno: false,
        // Funcionalidades Específicas
        podeEnviarMsg: true,
        podeReceberMsg: true,
        podeGerenciarConexoes: false,
        podeGerenciarBot: false,
        podeVerRelatorios: false,
        podeGerenciarEquipe: false,
        podeGerenciarUsuarios: false,
        podeVerSolicitacoesAjuda: false,
        podeVerAlertas: false,
        // Permissões Administrativas
        podeCriarPost: false,
        podeGerenciarEmpresas: false,
        categoria: ''
    };

    const [formData, setFormData] = useState(estadoInicialForm);

    useEffect(() => {
        carregarUsuarios();
        carregarCategorias();
    }, []);

    const carregarCategorias = async () => {
        try {
            const categoriasComContagem = CATEGORIAS_MEMBROS_DEFAULT.map(cat => ({
                ...cat, 
                membros: membros.filter(m => m.categoria === cat.nome).length 
            }));
            setCategoriasAtivas(categoriasComContagem);
        } catch (error) {
            console.error('Erro ao carregar categorias:', error);
            toast.error('Não foi possível carregar as categorias da equipe.');
            setCategoriasAtivas(CATEGORIAS_MEMBROS_DEFAULT);
        }
    };

    const carregarUsuarios = async () => {
        setCarregando(true);
        try {
            const response = await api.get('/usuarios');
            const usuariosDaMinhaConta = (response.data.usuarios || []).filter(u => u.contaId === usuarioLogado?.contaId);
            setMembros(usuariosDaMinhaConta);
            setCategoriasAtivas(prev => prev.map(cat => ({
                ...cat,
                membros: usuariosDaMinhaConta.filter(m => m.categoria === cat.nome).length
            })));
        } catch (error) {
            console.error('Erro ao carregar equipe:', error);
            toast.error('Não foi possível carregar a equipe.');
            setMembros([]);
        } finally {
            setCarregando(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!membroEditando && formData.senha.length < 6) {
            toast.error('A senha deve ter no mínimo 6 caracteres.');
            return;
        }
        if (membroEditando && formData.senha && formData.senha.length < 6) {
            toast.error('A nova senha deve ter no mínimo 6 caracteres.');
            return;
        }
        if (!formData.categoria) {
            toast.error('Por favor, selecione uma categoria para o membro.');
            return;
        }

        setIsSubmitting(true);
        const toastId = toast.loading(membroEditando ? 'Atualizando membro...' : 'Criando membro...');

        try {
            const payload = {
                nome: formData.nome,
                email: formData.email,
                tipo: formData.tipo,
                // Acesso a Páginas
                podeAcessarDashboard: formData.podeAcessarDashboard,
                podeAcessarMensagens: formData.podeAcessarMensagens,
                podeAcessarWhatsApp: formData.podeAcessarWhatsApp,
                podeAcessarEmpresasUsuarios: formData.podeAcessarEmpresasUsuarios,
                podeAcessarBlog: formData.podeAcessarBlog,
                podeAcessarAnalytics: formData.podeAcessarAnalytics,
                podeAcessarEquipe: formData.podeAcessarEquipe,
                podeAcessarSuporte: formData.podeAcessarSuporte,
                podeAcessarChatInterno: formData.podeAcessarChatInterno,
                // Funcionalidades
                podeEnviarMsg: formData.podeEnviarMsg,
                podeReceberMsg: formData.podeReceberMsg,
                podeGerenciarConexoes: formData.podeGerenciarConexoes,
                podeGerenciarBot: formData.podeGerenciarBot,
                podeVerRelatorios: formData.podeVerRelatorios,
                podeGerenciarEquipe: formData.podeGerenciarEquipe,
                podeGerenciarUsuarios: formData.podeGerenciarUsuarios,
                podeVerSolicitacoesAjuda: formData.podeVerSolicitacoesAjuda,
                podeVerAlertas: formData.podeVerAlertas,
                // Administrativas
                podeCriarPost: formData.podeCriarPost,
                podeGerenciarEmpresas: formData.podeGerenciarEmpresas,
                categoriaNome: formData.categoria
            };

            if (!membroEditando || (membroEditando && formData.senha)) {
                payload.senha = formData.senha;
            }

            if (membroEditando) {
                await api.put(`/usuarios/${membroEditando.id}`, payload);
            } else {
                payload.contaId = usuarioLogado.contaId;
                await api.post('/usuarios', payload);
            }

            toast.success(membroEditando ? 'Membro atualizado com sucesso!' : 'Membro criado com sucesso!', { id: toastId });
            setMostrarModal(false);
            setFormData(estadoInicialForm);
            setMembroEditando(null);
            setPerfilSelecionado('PERSONALIZADO');
            carregarUsuarios();
        } catch (error) {
            console.error('Erro ao salvar membro:', error);
            const erroMsg = error.response?.data?.erro || error.response?.data?.mensagem || 'Erro ao salvar membro.';
            toast.error(erroMsg, { id: toastId });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEditar = (membro) => {
        setMembroEditando(membro);
        setFormData({
            nome: membro.nome || '',
            email: membro.email || '',
            senha: '',
            tipo: membro.tipo || 'USUARIO',
            // Acesso a Páginas
            podeAcessarDashboard: membro.podeAcessarDashboard === true,
            podeAcessarMensagens: membro.podeAcessarMensagens === true,
            podeAcessarWhatsApp: membro.podeAcessarWhatsApp === true,
            podeAcessarEmpresasUsuarios: membro.podeAcessarEmpresasUsuarios === true,
            podeAcessarBlog: membro.podeAcessarBlog === true,
            podeAcessarAnalytics: membro.podeAcessarAnalytics === true,
            podeAcessarEquipe: membro.podeAcessarEquipe === true,
            podeAcessarSuporte: membro.podeAcessarSuporte === true,
            podeAcessarChatInterno: membro.podeAcessarChatInterno === true,
            // Funcionalidades
            podeEnviarMsg: membro.podeEnviarMsg === true,
            podeReceberMsg: membro.podeReceberMsg === true,
            podeGerenciarConexoes: membro.podeGerenciarConexoes === true,
            podeGerenciarBot: membro.podeGerenciarBot === true,
            podeVerRelatorios: membro.podeVerRelatorios === true,
            podeGerenciarEquipe: membro.podeGerenciarEquipe === true,
            podeGerenciarUsuarios: membro.podeGerenciarUsuarios === true,
            podeVerSolicitacoesAjuda: membro.podeVerSolicitacoesAjuda === true,
            podeVerAlertas: membro.podeVerAlertas === true,
            // Administrativas
            podeCriarPost: membro.podeCriarPost === true,
            podeGerenciarEmpresas: membro.podeGerenciarEmpresas === true,
            categoria: membro.categoria || ''
        });
        setPerfilSelecionado('PERSONALIZADO');
        setMostrarModal(true);
    };

    const handlePermissaoChange = (e) => {
        const { name, checked } = e.target;
        setFormData(prev => ({ ...prev, [name]: checked }));
        setPerfilSelecionado('PERSONALIZADO');
    };

    const aplicarPerfil = (perfilKey) => {
        setPerfilSelecionado(perfilKey);
        const perfil = PERFIS_PERMISSOES[perfilKey];
        
        if (perfil.permissoes) {
            setFormData(prev => ({
                ...prev,
                ...perfil.permissoes
            }));
            toast.success(`Perfil "${perfil.nome}" aplicado!`);
        }
    };

    // Funções CRUD Categorias (mantidas como antes)
    const handleAbrirCriacaoCategoria = () => { 
        setMostrarModalCategorias(false); 
        setCategoriaEditando(null); 
        setFormCategoria({ id: null, nome: '' }); 
        setMostrarModalCategoriaEdit(true);  
    };
    
    const handleAbrirEdicaoCategoria = (categoria) => { 
        setMostrarModalCategorias(false); 
        setCategoriaEditando(categoria); 
        setFormCategoria({ id: categoria.id, nome: categoria.nome }); 
        setMostrarModalCategoriaEdit(true); 
    };
    
    const handleSubmitCategoria = async () => {
        const nomeLimpo = formCategoria.nome.trim();
        if (!nomeLimpo) { 
            toast.error('O nome da categoria não pode ser vazio.'); 
            return false; 
        }
        const toastId = toast.loading(categoriaEditando ? 'Salvando categoria...' : 'Criando categoria...');
        try {
            if (categoriaEditando) {
                await api.put(`/categorias/${categoriaEditando.id}`, { nome: nomeLimpo });
                toast.success(`Categoria "${nomeLimpo}" atualizada!`, { id: toastId });
            } else {
                await api.post(`/categorias`, { nome: nomeLimpo, contaId: usuarioLogado.contaId });
                toast.success(`Categoria "${nomeLimpo}" criada!`, { id: toastId });
            }
            await carregarCategorias();
            await carregarUsuarios();
            setMostrarModalCategoriaEdit(false);
            setMostrarModalCategorias(true);
            return true;
        } catch (error) {
            toast.error(error.response?.data?.erro || 'Erro ao salvar categoria.', { id: toastId });
            return false;
        }
    };
    
    const handleConfirmarRemocao = (categoria) => {
        if (categoria.membros > 0) {
            toast.error(`Não é possível excluir "${categoria.nome}". Há ${categoria.membros} membro(s) nela.`);
            return;
        }
        setConfirmDeleteCategoria({ isOpen: true, categoria });
    };
    
    const handleRemoverCategoria = async () => {
        const categoria = confirmDeleteCategoria.categoria;
        if (!categoria) return;
        const toastId = toast.loading(`Excluindo categoria "${categoria.nome}"...`);
        try {
            await api.delete(`/categorias/${categoria.id}`);
            toast.success(`Categoria "${categoria.nome}" removida!`, { id: toastId });
            await carregarCategorias();
            setConfirmDeleteCategoria({ isOpen: false, categoria: null });
            setMostrarModalCategorias(true);
        } catch (error) {
            toast.error(error.response?.data?.erro || 'Erro ao excluir categoria.', { id: toastId });
            setConfirmDeleteCategoria({ isOpen: false, categoria: null });
        }
    };

    // Funções de Deleção
    const handleDeletar = (id) => { 
        setUserIdToDelete(id); 
        setShowConfirmDeleteModal(true); 
    };
    
    const confirmarDelecaoComSenha = async (senhaAdmin) => {
        if (!userIdToDelete) return;
        setIsDeleting(true);
        const toastId = toast.loading('Verificando senha e excluindo...');
        try {
            if (usuarioLogado?.tipo !== 'ADMIN_EMPRESA' && usuarioLogado?.tipo !== 'OWNER') {
                toast.error('Você não tem permissão para excluir membros.', { id: toastId });
                setShowConfirmDeleteModal(false); 
                setIsDeleting(false); 
                return;
            }
            await api.post('/auth/verificar-senha-admin', { senha: senhaAdmin, usuarioId: usuarioLogado.id });
            await api.delete(`/usuarios/${userIdToDelete}`);
            toast.success('Membro deletado com sucesso!', { id: toastId });
            setShowConfirmDeleteModal(false); 
            setUserIdToDelete(null);
            carregarUsuarios();
        } catch (error) {
            console.error("Erro ao deletar:", error);
            const erroMsg = error.response?.data?.erro || 'Senha incorreta ou erro ao excluir.';
            toast.error(erroMsg, { id: toastId });
            if (error.response?.status !== 401 && error.response?.status !== 403) {
                setShowConfirmDeleteModal(false); 
                setUserIdToDelete(null);
            }
        } finally {
            setIsDeleting(false);
        }
    };

    const getTipoLabel = (tipo) => {
        switch (tipo) {
            case 'ADMIN_EMPRESA': return 'Administrador';
            case 'USUARIO': return 'Usuário';
            case 'OWNER': return 'Proprietário';
            default: return tipo || 'Desconhecido';
        }
    };

    const membrosFiltrados = membros.filter((membro) =>
        (membro.nome && membro.nome.toLowerCase().includes(busca.toLowerCase())) ||
        (membro.email && membro.email.toLowerCase().includes(busca.toLowerCase()))
    );

    return (
        <div className="min-h-screen bg-gray-50">
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* DESCRIÇÃO DE AJUDA */}
                <div className="mb-6 p-4 bg-white rounded-xl border border-gray-200 shadow-sm">
                    <h2 className="text-lg font-semibold text-gray-900 mb-2">Gerenciar Equipe</h2>
                    <p className="text-sm text-gray-600">
                        Adicione, edite ou remova membros da sua equipe. Defina permissões granulares de acesso às páginas e funcionalidades do sistema.
                    </p>
                </div>

                {/* BARRA DE AÇÕES */}
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Buscar membro por nome ou email..."
                            value={busca}
                            onChange={(e) => setBusca(e.target.value)}
                            className="w-full pl-11 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                        />
                    </div>
                    <button
                        onClick={() => setMostrarModalCategorias(true)}
                        className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
                    >
                        <Settings className="w-5 h-5" />
                        Categorias ({categoriasAtivas.length})
                    </button>
                    <button
                        onClick={() => {
                            setMembroEditando(null);
                            setFormData(estadoInicialForm);
                            setPerfilSelecionado('PERSONALIZADO');
                            setMostrarModal(true);
                        }}
                        className="flex items-center justify-center gap-2 px-4 py-2.5 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition"
                    >
                        <UserPlus className="w-5 h-5" />
                        Novo Membro
                    </button>
                </div>

                {/* LISTA DE MEMBROS */}
                {carregando ? (
                    <div className="text-center py-12">
                        <Loader2 className="w-12 h-12 text-orange-500 animate-spin mx-auto" />
                    </div>
                ) : membrosFiltrados.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
                        <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600">
                            {busca ? `Nenhum membro encontrado para "${busca}"` : 'Nenhum membro cadastrado'}
                        </p>
                        {!busca && <p className="text-sm text-gray-500 mt-2">Clique em "Novo Membro" para começar.</p>}
                    </div>
                ) : (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nome</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Categoria</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {membrosFiltrados.map((membro) => (
                                        <tr key={membro.id} className="hover:bg-gray-50 transition">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <p className="font-medium text-gray-900">{membro.nome}</p>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <p className="text-sm text-gray-600">{membro.email}</p>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="text-sm text-gray-900">{getTipoLabel(membro.tipo)}</span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="text-sm text-gray-700">{membro.categoria || '-'}</span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                                    membro.status === 'ATIVO' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                                }`}>
                                                    {membro.status === 'ATIVO' ? 'Ativo' : (membro.status || 'Pendente')}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button 
                                                        onClick={() => handleEditar(membro)} 
                                                        className="p-2 hover:bg-gray-100 rounded-lg transition" 
                                                        title="Editar"
                                                    >
                                                        <Edit2 className="w-4 h-4 text-gray-600" />
                                                    </button>
                                                    {(membro.id !== usuarioLogado.id && membro.tipo !== 'OWNER') && (
                                                        <button 
                                                            onClick={() => handleDeletar(membro.id)} 
                                                            className="p-2 hover:bg-red-50 rounded-lg transition" 
                                                            title="Deletar"
                                                        >
                                                            <Trash2 className="w-4 h-4 text-red-600" />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </main>

            {/* MODAL CRIAR/EDITAR MEMBRO */}
            {mostrarModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
                    <div className="bg-white rounded-2xl max-w-4xl w-full p-6 my-8 max-h-[90vh] overflow-y-auto scrollbar-thin">
                        <h2 className="text-2xl font-bold text-gray-900 mb-6">
                            {membroEditando ? 'Editar Membro' : 'Novo Membro'}
                        </h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Campos Básicos */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo *</label>
                                    <div className="relative">
                                        <User className="input-icon" />
                                        <input 
                                            type="text" 
                                            value={formData.nome} 
                                            onChange={(e) => setFormData({ ...formData, nome: e.target.value })} 
                                            className="input-field pl-10" 
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
                                            required 
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Senha {membroEditando ? '(deixe vazio para não alterar)' : '*'}
                                    </label>
                                    <div className="relative">
                                        <Lock className="input-icon" />
                                        <input 
                                            type={mostrarSenha ? 'text' : 'password'} 
                                            value={formData.senha} 
                                            onChange={(e) => setFormData({ ...formData, senha: e.target.value })} 
                                            className="input-field pl-10 pr-10" 
                                            required={!membroEditando} 
                                            minLength={6} 
                                            placeholder="Mínimo 6 caracteres"
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
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Tipo *</label>
                                    <div className="relative">
                                        <Shield className="input-icon" />
                                        <select 
                                            value={formData.tipo} 
                                            onChange={(e) => setFormData({ ...formData, tipo: e.target.value })} 
                                            className="input-field pl-10 appearance-none bg-white" 
                                            required
                                        >
                                            <option value="USUARIO">Usuário</option>
                                            <option value="ADMIN_EMPRESA">Administrador</option>
                                        </select>
                                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                                            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                                                <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                                            </svg>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Campo Categoria */}
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
                                        <option value="" disabled>Selecione...</option>
                                        {categoriasAtivas.map((cat) => (
                                            <option key={cat.id} value={cat.nome}>{cat.nome}</option>
                                        ))}
                                    </select>
                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                                        <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                                            <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                                        </svg>
                                    </div>
                                </div>
                            </div>

                            {/* Seletor de Perfil de Permissões */}
                            <div className="border-t pt-4 mt-6">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Perfil de Permissões
                                </label>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-4">
                                    {Object.entries(PERFIS_PERMISSOES).map(([key, perfil]) => (
                                        <button
                                            key={key}
                                            type="button"
                                            onClick={() => aplicarPerfil(key)}
                                            className={`p-3 border rounded-lg text-sm font-medium transition ${
                                                perfilSelecionado === key
                                                    ? 'border-orange-500 bg-orange-50 text-orange-700'
                                                    : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                                            }`}
                                        >
                                            <div className="font-semibold">{perfil.nome}</div>
                                            {perfil.descricao && (
                                                <div className="text-xs opacity-75 mt-1">{perfil.descricao}</div>
                                            )}
                                        </button>
                                    ))}
                                </div>
                                {perfilSelecionado !== 'PERSONALIZADO' && (
                                    <p className="text-xs text-blue-600 bg-blue-50 p-2 rounded">
                                        💡 Perfil "{PERFIS_PERMISSOES[perfilSelecionado].nome}" aplicado. 
                                        Altere qualquer permissão abaixo para personalizar.
                                    </p>
                                )}
                            </div>

                            {/* Seção de Permissões */}
                            <div className="border-t pt-4 mt-4">
                                <h3 className="text-base font-medium text-gray-900 mb-4">Permissões Detalhadas</h3>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* COLUNA 1 */}
                                    <div className="space-y-5">
                                        {/* GRUPO: Acesso a Páginas Principais */}
                                        <div>
                                            <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                                <div className="w-1 h-4 bg-blue-500 rounded"></div>
                                                Acesso a Páginas
                                            </h4>
                                            <div className="space-y-2 pl-3">
                                                <PermissionItem
                                                    icon={<BarChart3 className="w-5 h-5 text-gray-500" />}
                                                    label="Dashboard"
                                                    name="podeAcessarDashboard"
                                                    checked={formData.podeAcessarDashboard}
                                                    onChange={handlePermissaoChange}
                                                    description="Página inicial com visão geral."
                                                />
                                                <PermissionItem
                                                    icon={<MessageSquare className="w-5 h-5 text-gray-500" />}
                                                    label="Mensagens"
                                                    name="podeAcessarMensagens"
                                                    checked={formData.podeAcessarMensagens}
                                                    onChange={handlePermissaoChange}
                                                    description="Conversar com contatos."
                                                />
                                                <PermissionItem
                                                    icon={<Smartphone className="w-5 h-5 text-gray-500" />}
                                                    label="WhatsApp"
                                                    name="podeAcessarWhatsApp"
                                                    checked={formData.podeAcessarWhatsApp}
                                                    onChange={handlePermissaoChange}
                                                    description="Gerenciar conexões WhatsApp."
                                                />
                                                <PermissionItem
                                                    icon={<Building2 className="w-5 h-5 text-gray-500" />}
                                                    label="Empresas/Usuários"
                                                    name="podeAcessarEmpresasUsuarios"
                                                    checked={formData.podeAcessarEmpresasUsuarios}
                                                    onChange={handlePermissaoChange}
                                                    description="Visualizar empresas e usuários."
                                                />
                                                <PermissionItem
                                                    icon={<Newspaper className="w-5 h-5 text-gray-500" />}
                                                    label="Blog"
                                                    name="podeAcessarBlog"
                                                    checked={formData.podeAcessarBlog}
                                                    onChange={handlePermissaoChange}
                                                    description="Acessar conteúdo do blog."
                                                />
                                            </div>
                                        </div>

                                        {/* GRUPO: Páginas Administrativas */}
                                        <div>
                                            <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                                <div className="w-1 h-4 bg-purple-500 rounded"></div>
                                                Administrativo
                                            </h4>
                                            <div className="space-y-2 pl-3">
                                                <PermissionItem
                                                    icon={<BarChart3 className="w-5 h-5 text-gray-500" />}
                                                    label="Analytics"
                                                    name="podeAcessarAnalytics"
                                                    checked={formData.podeAcessarAnalytics}
                                                    onChange={handlePermissaoChange}
                                                    description="Visualizar métricas e análises."
                                                />
                                                <PermissionItem
                                                    icon={<Users className="w-5 h-5 text-gray-500" />}
                                                    label="Equipe"
                                                    name="podeAcessarEquipe"
                                                    checked={formData.podeAcessarEquipe}
                                                    onChange={handlePermissaoChange}
                                                    description="Gerenciar membros da equipe."
                                                />
                                                <PermissionItem
                                                    icon={<HelpCircle className="w-5 h-5 text-gray-500" />}
                                                    label="Suporte"
                                                    name="podeAcessarSuporte"
                                                    checked={formData.podeAcessarSuporte}
                                                    onChange={handlePermissaoChange}
                                                    description="Página exclusiva de suporte técnico."
                                                />
                                                <PermissionItem
                                                    icon={<MessageSquare className="w-5 h-5 text-gray-500" />}
                                                    label="Chat Interno"
                                                    name="podeAcessarChatInterno"
                                                    checked={formData.podeAcessarChatInterno}
                                                    onChange={handlePermissaoChange}
                                                    description="Solicitações de ajuda e alertas."
                                                />
                                            </div>
                                        </div>

                                        {/* GRUPO: Funcionalidades de Mensagens */}
                                        <div>
                                            <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                                <div className="w-1 h-4 bg-green-500 rounded"></div>
                                                Mensagens
                                            </h4>
                                            <div className="space-y-2 pl-3">
                                                <PermissionItem
                                                    icon={<CheckCircle className="w-5 h-5 text-gray-500" />}
                                                    label="Enviar Mensagens"
                                                    name="podeEnviarMsg"
                                                    checked={formData.podeEnviarMsg}
                                                    onChange={handlePermissaoChange}
                                                    description="Iniciar e responder conversas."
                                                />
                                                <PermissionItem
                                                    icon={<CheckCircle className="w-5 h-5 text-gray-500" />}
                                                    label="Receber Mensagens"
                                                    name="podeReceberMsg"
                                                    checked={formData.podeReceberMsg}
                                                    onChange={handlePermissaoChange}
                                                    description="Ver e receber notificações."
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* COLUNA 2 */}
                                    <div className="space-y-5">
                                        {/* GRUPO: Gestão e Configurações */}
                                        <div>
                                            <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                                <div className="w-1 h-4 bg-orange-500 rounded"></div>
                                                Gestão
                                            </h4>
                                            <div className="space-y-2 pl-3">
                                                <PermissionItem
                                                    icon={<Smartphone className="w-5 h-5 text-gray-500" />}
                                                    label="Gerenciar Conexões"
                                                    name="podeGerenciarConexoes"
                                                    checked={formData.podeGerenciarConexoes}
                                                    onChange={handlePermissaoChange}
                                                    description="Conectar/desconectar WhatsApp."
                                                />
                                                <PermissionItem
                                                    icon={<Zap className="w-5 h-5 text-gray-500" />}
                                                    label="Gerenciar Bot"
                                                    name="podeGerenciarBot"
                                                    checked={formData.podeGerenciarBot}
                                                    onChange={handlePermissaoChange}
                                                    description="Configurar bot de atendimento."
                                                />
                                                <PermissionItem
                                                    icon={<Users className="w-5 h-5 text-gray-500" />}
                                                    label="Gerenciar Equipe"
                                                    name="podeGerenciarEquipe"
                                                    checked={formData.podeGerenciarEquipe}
                                                    onChange={handlePermissaoChange}
                                                    description="Adicionar/editar membros."
                                                />
                                                <PermissionItem
                                                    icon={<Users className="w-5 h-5 text-gray-500" />}
                                                    label="Gerenciar Usuários"
                                                    name="podeGerenciarUsuarios"
                                                    checked={formData.podeGerenciarUsuarios}
                                                    onChange={handlePermissaoChange}
                                                    description="CRUD completo de usuários."
                                                />
                                            </div>
                                        </div>

                                        {/* GRUPO: Relatórios e Monitoramento */}
                                        <div>
                                            <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                                <div className="w-1 h-4 bg-yellow-500 rounded"></div>
                                                Relatórios
                                            </h4>
                                            <div className="space-y-2 pl-3">
                                                <PermissionItem
                                                    icon={<FileText className="w-5 h-5 text-gray-500" />}
                                                    label="Ver Relatórios"
                                                    name="podeVerRelatorios"
                                                    checked={formData.podeVerRelatorios}
                                                    onChange={handlePermissaoChange}
                                                    description="Acessar relatórios e estatísticas."
                                                />
                                                <PermissionItem
                                                    icon={<HelpCircle className="w-5 h-5 text-gray-500" />}
                                                    label="Ver Solicitações de Ajuda"
                                                    name="podeVerSolicitacoesAjuda"
                                                    checked={formData.podeVerSolicitacoesAjuda}
                                                    onChange={handlePermissaoChange}
                                                    description="Visualizar tickets de suporte."
                                                />
                                                <PermissionItem
                                                    icon={<AlertTriangle className="w-5 h-5 text-gray-500" />}
                                                    label="Ver Alertas"
                                                    name="podeVerAlertas"
                                                    checked={formData.podeVerAlertas}
                                                    onChange={handlePermissaoChange}
                                                    description="Monitorar alertas do sistema."
                                                />
                                            </div>
                                        </div>

                                        {/* GRUPO: Permissões Especiais (OWNER) */}
                                        <div>
                                            <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                                <div className="w-1 h-4 bg-red-500 rounded"></div>
                                                Especiais (Apenas OWNER)
                                            </h4>
                                            <div className="space-y-2 pl-3">
                                                <PermissionItem
                                                    icon={<Newspaper className="w-5 h-5 text-gray-500" />}
                                                    label="Criar Posts no Blog"
                                                    name="podeCriarPost"
                                                    checked={formData.podeCriarPost}
                                                    onChange={handlePermissaoChange}
                                                    description="Publicar artigos no blog."
                                                />
                                                <PermissionItem
                                                    icon={<Building2 className="w-5 h-5 text-gray-500" />}
                                                    label="Gerenciar Empresas"
                                                    name="podeGerenciarEmpresas"
                                                    checked={formData.podeGerenciarEmpresas}
                                                    onChange={handlePermissaoChange}
                                                    description="Acesso total às empresas."
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Botões */}
                            <div className="flex gap-3 pt-6 border-t mt-6">
                                <button 
                                    type="button" 
                                    onClick={() => setMostrarModal(false)} 
                                    className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition" 
                                    disabled={isSubmitting}
                                >
                                    Cancelar
                                </button>
                                <button 
                                    type="submit" 
                                    className="flex-1 px-4 py-2.5 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition disabled:opacity-50 flex items-center justify-center gap-2" 
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                                    {isSubmitting ? 'Salvando...' : (membroEditando ? 'Salvar Alterações' : 'Criar Membro')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL CONFIRMAÇÃO DELEÇÃO */}
            <ModalConfirmacaoSenha
                isOpen={showConfirmDeleteModal}
                onClose={() => { 
                    if (!isDeleting) { 
                        setShowConfirmDeleteModal(false); 
                        setUserIdToDelete(null); 
                    } 
                }}
                onConfirm={confirmarDelecaoComSenha}
                titulo="Confirmar Exclusão"
                mensagem="Para excluir este membro, insira sua senha de administrador."
                textoBotaoConfirmar="Excluir Membro"
                textoBotaoCancelar="Cancelar"
                isLoading={isDeleting}
                tipo="danger"
            />

            {/* MODAL GESTÃO CATEGORIAS (LISTA) */}
            <Modal
                isOpen={mostrarModalCategorias}
                onClose={() => setMostrarModalCategorias(false)}
                titulo="Gerenciar Categorias da Equipe"
                className="max-w-md"
            >
                <div>
                    <div className="flex justify-end mb-4">
                        <button
                            onClick={handleAbrirCriacaoCategoria}
                            className="flex items-center gap-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm"
                        >
                            <Plus className="w-4 h-4" /> Nova Categoria
                        </button>
                    </div>

                    <ul className="space-y-2 max-h-80 overflow-y-auto pr-2 scrollbar-thin">
                        {categoriasAtivas.length === 0 ? (
                            <p className="text-center text-gray-500 py-4">Nenhuma categoria cadastrada.</p>
                        ) : (
                            categoriasAtivas.map((cat) => (
                                <li key={cat.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                                    <div>
                                        <span className="font-medium text-gray-800">{cat.nome}</span>
                                        <span className="ml-2 text-xs text-gray-500">({cat.membros || 0} membros)</span>
                                    </div>
                                    <div className="flex gap-1">
                                        <button
                                            onClick={() => handleAbrirEdicaoCategoria(cat)}
                                            className="p-1 text-blue-600 hover:bg-blue-100 rounded-lg transition" 
                                            title="Editar"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleConfirmarRemocao(cat)}
                                            disabled={(cat.membros || 0) > 0}
                                            className={`p-1 rounded-lg transition ${
                                                (cat.membros || 0) > 0 
                                                    ? 'text-gray-400 cursor-not-allowed' 
                                                    : 'text-red-600 hover:bg-red-100'
                                            }`}
                                            title={(cat.membros || 0) > 0 ? `Remova os ${cat.membros} membros primeiro` : 'Excluir categoria'}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </li>
                            ))
                        )}
                    </ul>
                </div>
            </Modal>

            {/* MODAL EDIÇÃO/CRIAÇÃO CATEGORIA */}
            <Modal
                isOpen={mostrarModalCategoriaEdit}
                onClose={() => { 
                    setMostrarModalCategoriaEdit(false); 
                    setMostrarModalCategorias(true); 
                }}
                titulo={categoriaEditando ? `Editar: ${categoriaEditando.nome}` : 'Nova Categoria'}
                textoBotaoConfirmar={categoriaEditando ? 'Salvar' : 'Criar'}
                onConfirm={handleSubmitCategoria}
                className="max-w-sm"
            >
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nome da Categoria *</label>
                    <input
                        type="text"
                        value={formCategoria.nome}
                        onChange={(e) => setFormCategoria({ ...formCategoria, nome: e.target.value })}
                        placeholder="Ex: Vendas"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                        required
                    />
                </div>
            </Modal>

            {/* MODAL CONFIRMAÇÃO DELEÇÃO CATEGORIA */}
            <Modal
                isOpen={confirmDeleteCategoria.isOpen}
                onClose={() => setConfirmDeleteCategoria({ isOpen: false, categoria: null })}
                onConfirm={handleRemoverCategoria}
                titulo="Confirmar Exclusão"
                mensagem={`Excluir a categoria "${confirmDeleteCategoria.categoria?.nome}"? A ação não pode ser desfeita.`}
                textoBotaoConfirmar="Sim, Excluir"
                textoBotaoCancelar="Cancelar"
                tipo="danger"
            />

            {/* ESTILOS GLOBAIS */}
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
                    padding-top: 0.625rem; 
                    padding-bottom: 0.625rem; 
                    padding-right: 1rem; 
                    border: 1px solid #d1d5db; 
                    border-radius: 0.5rem; 
                    outline: none; 
                    transition: ring 0.15s ease-in-out; 
                }
                .input-field:focus { 
                    ring: 2px; 
                    ring-color: #f97316; 
                    border-color: transparent; 
                }
                .input-field.pl-10 { 
                    padding-left: 2.75rem; 
                }
                .input-field.pl-11 { 
                    padding-left: 3rem; 
                }
                .scrollbar-thin::-webkit-scrollbar { 
                    width: 6px; 
                }
                .scrollbar-thin::-webkit-scrollbar-track { 
                    background: transparent; 
                }
                .scrollbar-thin::-webkit-scrollbar-thumb { 
                    background: #ccc; 
                    border-radius: 3px; 
                }
                .scrollbar-thin::-webkit-scrollbar-thumb:hover { 
                    background: #aaa; 
                }
            `}</style>
        </div>
    );
}