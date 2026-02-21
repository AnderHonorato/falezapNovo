import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Save, Shield, ShieldCheck, CheckCircle, 
  Lock, AlertTriangle, Crown, BarChart3, MessageSquare, 
  Users, Smartphone, Headset, Briefcase, LayoutDashboard, 
  Activity, ChevronDown, ChevronRight, User, Loader2
} from 'lucide-react';
import api from '../servicos/api';
import { useAuth } from '../contextos/AuthContext';
import toast from 'react-hot-toast';

// --- HIERARQUIA ---
const HIERARQUIA = {
  COLABORADOR: 1,
  ENCARREGADO: 2,
  ADMIN: 3,
  ADMIN_EMPRESA: 3,
  CEO: 4,
  SUPORTE: 5,
  OWNER: 6
};

// --- ESTRUTURA DE PERMISSÕES ---
const ESTRUTURA_PERMISSOES = [
  {
    id: 'dashboard',
    titulo: 'Página Dashboard',
    icone: <BarChart3 className="w-5 h-5 text-blue-500" />,
    descricao: 'Controle de visualização dos cards e métricas.',
    permissaoAcessoPagina: 'podeAcessarDashboard',
    permissoesFilhas: [
       { key: 'podeVerCardMensagensDia', label: 'Ver Card: Mensagens Hoje' },
       { key: 'podeVerCardAnalyticsResumo', label: 'Ver Card: Resumo Analytics' },
       { key: 'podeVerCardUsuariosOnline', label: 'Ver Card: Usuários Online' },
       { key: 'podeVerCardTMR', label: 'Ver Card: Tempo Médio (TMR)' },
       { key: 'podeVerGraficos', label: 'Ver Gráfico: Fluxo Global' },
       { key: 'podeVerFunil', label: 'Ver Gráfico: Funil' },
       { key: 'podeVerHeatmap', label: 'Ver Gráfico: Mapa de Calor' },
       { key: 'podeVerCardConexoes', label: 'Ver Card: Conexões WhatsApp' },
       { key: 'podeVerAlertas', label: 'Ver Alertas do Sistema' }
    ]
  },
  {
    id: 'mensagens',
    titulo: 'Página Mensagens',
    icone: <MessageSquare className="w-5 h-5 text-green-500" />,
    descricao: 'Acesso ao chat de atendimento multicanal.',
    permissaoAcessoPagina: 'podeAcessarMensagens',
    permissoesFilhas: [
       { key: 'podeEnviarMsg', label: 'Pode Enviar Mensagens' },
       { key: 'podeReceberMsg', label: 'Pode Receber Mensagens' }
    ]
  },
  {
    id: 'usuarios',
    titulo: 'Página Usuários & Equipe',
    icone: <Users className="w-5 h-5 text-orange-500" />,
    descricao: 'Gestão de membros e visualização de equipe.',
    permissaoAcessoPagina: 'podeAcessarEmpresasUsuarios',
    temPermissaoPai: true, 
    permissoesFilhas: [
       { key: 'podeAcessarEquipe', label: 'Acessar Aba/Tela Equipe (Visualização)' },
       { key: 'podeGerenciarEquipe', label: 'Adicionar/Remover Membros' },
       { key: 'podeGerenciarUsuarios', label: 'Criar/Editar Usuários (CRUD)' }
    ]
  },
  {
    id: 'whatsapp',
    titulo: 'Página Conexões',
    icone: <Smartphone className="w-5 h-5 text-teal-500" />,
    descricao: 'Gerenciamento de instâncias do WhatsApp.',
    permissaoAcessoPagina: 'podeAcessarWhatsApp',
    permissoesFilhas: [
       { key: 'podeGerenciarConexoes', label: 'Criar/Deletar Conexões e QRCodes' },
       { key: 'podeGerenciarBot', label: 'Configurar Robô de Atendimento' }
    ]
  },
  {
    id: 'admin_blog',
    titulo: 'Admin & Relatórios',
    icone: <ShieldCheck className="w-5 h-5 text-red-500" />,
    descricao: 'Acesso a áreas administrativas e analíticas.',
    permissaoAcessoPagina: 'podeAcessarAnalytics', 
    permissoesFilhas: [
       { key: 'podeVerResumoKpis', label: 'Ver KPIs Principais (Topo)' },
       { key: 'podeVerGraficosAvancados', label: 'Ver Gráficos Detalhados' },
       { key: 'podeVerRankingEquipe', label: 'Ver Ranking de Equipe' },
       { key: 'podeUsarIAAnalytics', label: 'Usar Insighta IA' },
       { key: 'podeBaixarRelatorios', label: 'Baixar Relatórios (Excel/PDF)' },
       { key: 'podeAcessarBlog', label: 'Acessar Blog / Novidades' },
       { key: 'podeCriarPost', label: 'Criar Postagens no Blog' },
       { key: 'podeModerarBlog', label: 'Moderador (Apagar Comentários) - Restrito' },
       { key: 'podeGerenciarEmpresas', label: 'Gerenciar Empresas (CRUD) - Restrito' }
    ]
  },
  {
    id: 'suporte',
    titulo: 'Página Suporte & Chat Interno',
    icone: <Headset className="w-5 h-5 text-purple-500" />,
    descricao: 'Acesso ao suporte técnico e comunicação interna.',
    permissaoAcessoPagina: 'podeAcessarSuporte',
    permissoesFilhas: [
       { key: 'podeAcessarChatInterno', label: 'Acessar Chat Interno' },
       { key: 'podeVerSolicitacoesAjuda', label: 'Ver Tickets de Ajuda' }
    ]
  }
];

// Componente Interno do Acordeão
const AccordionPermissao = ({ grupo, formData, onChange, usuarioLogado }) => {
    const [aberto, setAberto] = useState(false);
    const temAcessoPagina = formData[grupo.permissaoAcessoPagina];
    const isOwnerLogado = usuarioLogado?.tipo === 'OWNER';
    const disabledPai = !isOwnerLogado && !usuarioLogado[grupo.permissaoAcessoPagina];

    return (
        <div className="border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 mb-4 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between p-5 bg-white dark:bg-gray-800 cursor-pointer select-none" onClick={() => setAberto(!aberto)}>
                <div className="flex items-center gap-4">
                    <div className="p-2.5 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-100 dark:border-gray-600">{grupo.icone}</div>
                    <div>
                        <h4 className="font-bold text-gray-800 dark:text-gray-200 text-sm">{grupo.titulo}</h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{grupo.descricao}</p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex flex-col items-end" onClick={e => e.stopPropagation()}>
                        <label className={`flex items-center gap-2 cursor-pointer group ${disabledPai ? 'opacity-50 cursor-not-allowed' : ''}`}>
                            <span className="text-[10px] font-bold uppercase text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors">Acessar Página</span>
                            <div className={`w-10 h-5 rounded-full p-0.5 transition-colors duration-300 ${temAcessoPagina ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`}>
                                <input type="checkbox" name={grupo.permissaoAcessoPagina} checked={!!temAcessoPagina} onChange={disabledPai ? undefined : onChange} disabled={disabledPai} className="hidden" />
                                <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-300 ${temAcessoPagina ? 'translate-x-5' : 'translate-x-0'}`} />
                            </div>
                        </label>
                    </div>
                    {aberto ? <ChevronDown size={20} className="text-gray-400"/> : <ChevronRight size={20} className="text-gray-400"/>}
                </div>
            </div>

            {aberto && (
                <div className="p-5 border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/20 animate-fadeIn">
                    {grupo.temPermissaoPai && isOwnerLogado && (
                        <div className="mb-5 p-4 bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800 rounded-xl flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-yellow-100 dark:bg-yellow-800 rounded-lg">
                                    <Crown size={18} className="text-yellow-700 dark:text-yellow-200"/>
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-yellow-900 dark:text-yellow-100">Permissão Pai (Gerente)</p>
                                    <p className="text-xs text-yellow-700 dark:text-yellow-300 leading-tight">Permite que este usuário conceda permissões a outros.</p>
                                </div>
                            </div>
                            <label className="cursor-pointer relative">
                                <input type="checkbox" name="podeGerenciarUsuarios" checked={!!formData.podeGerenciarUsuarios} onChange={onChange} className="sr-only peer" />
                                <div className="w-9 h-5 bg-gray-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-yellow-300 dark:peer-focus:ring-yellow-800 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-yellow-500"></div>
                            </label>
                        </div>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {grupo.permissoesFilhas.map(p => {
                            let disabled = !temAcessoPagina;
                            if (!isOwnerLogado && !usuarioLogado[p.key]) disabled = true;
                            
                            return (
                                <label key={p.key} className={`flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer ${formData[p.key] ? 'border-indigo-200 bg-white dark:bg-gray-800 shadow-sm' : 'border-gray-100 dark:border-gray-700 bg-transparent hover:bg-white dark:hover:bg-gray-800'} ${disabled ? 'opacity-50 cursor-not-allowed grayscale bg-gray-100 dark:bg-gray-900' : ''}`}>
                                    <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${formData[p.key] ? 'bg-indigo-600 border-indigo-600' : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-500'}`}>
                                        {formData[p.key] && <CheckCircle size={12} className="text-white" />}
                                    </div>
                                    <input type="checkbox" name={p.key} checked={!!formData[p.key]} onChange={onChange} disabled={disabled} className="hidden" />
                                    <span className={`text-sm font-medium ${formData[p.key] ? 'text-indigo-900 dark:text-indigo-200' : 'text-gray-600 dark:text-gray-400'}`}>{p.label}</span>
                                    {disabled && !isOwnerLogado && !usuarioLogado[p.key] && <Lock size={12} className="ml-auto text-gray-400"/>}
                                </label>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

export default function PermissoesUsuario() {
  const { id } = useParams(); // ID do usuário alvo
  const navigate = useNavigate();
  const { usuario: usuarioLogado } = useAuth();
  
  const [usuarioAlvo, setUsuarioAlvo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    carregarUsuarioAlvo();
  }, [id, usuarioLogado]);

  const carregarUsuarioAlvo = async () => {
    setLoading(true);
    try {
        // Como não temos endpoint "get /:id", listamos todos e filtramos (workaround seguro)
        // O ideal seria criar um endpoint GET /usuarios/:id no backend
        const res = await api.get('/usuarios'); 
        const usuarios = Array.isArray(res.data.usuarios) ? res.data.usuarios : [];
        const alvo = usuarios.find(u => u.id === id);

        if (!alvo) {
            toast.error('Usuário não encontrado.');
            navigate('/usuarios');
            return;
        }

        // Verificação de segurança frontend
        if (!podeGerenciar(usuarioLogado, alvo) && usuarioLogado.id !== alvo.id) {
             toast.error('Você não tem permissão para gerenciar este usuário.');
             navigate('/usuarios');
             return;
        }

        setUsuarioAlvo(alvo);
        
        // Popula formData com as permissões do usuário
        const permissoesIniciais = {};
        
        // Permissão Pai Global
        permissoesIniciais['podeGerenciarUsuarios'] = alvo.podeGerenciarUsuarios === true;

        // Permissões das Páginas
        ESTRUTURA_PERMISSOES.forEach(grupo => {
            permissoesIniciais[grupo.permissaoAcessoPagina] = alvo[grupo.permissaoAcessoPagina] === true;
            grupo.permissoesFilhas.forEach(p => {
                permissoesIniciais[p.key] = alvo[p.key] === true;
            });
        });

        setFormData(permissoesIniciais);

    } catch (error) {
        console.error(error);
        toast.error('Erro ao carregar dados do usuário.');
        navigate('/usuarios');
    } finally {
        setLoading(false);
    }
  };

  const podeGerenciar = (usuarioLogado, alvo) => {
    if (!usuarioLogado) return false;
    if (usuarioLogado.tipo === 'OWNER' || usuarioLogado.tipo === 'SUPORTE') return true;
    if (usuarioLogado.podeGerenciarUsuarios) {
        const nivelLogado = HIERARQUIA[usuarioLogado.tipo] || 0;
        const tipoAlvo = alvo?.tipo;
        const nivelAlvo = HIERARQUIA[tipoAlvo] || 0;
        return nivelLogado >= nivelAlvo;
    }
    return false;
  };

  const handleChange = (e) => {
      const { name, checked } = e.target;
      setFormData(prev => ({ ...prev, [name]: checked }));
  };

  const handleSalvar = async () => {
      setSaving(true);
      const tId = toast.loading('Salvando permissões...');
      try {
          await api.put(`/usuarios/${id}`, formData);
          toast.success('Permissões atualizadas com sucesso!', { id: tId });
      } catch (error) {
          console.error(error);
          const msg = error.response?.data?.erro || 'Erro ao salvar permissões.';
          toast.error(msg, { id: tId });
      } finally {
          setSaving(false);
      }
  };

  if (loading) {
      return (
          <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
              <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mb-4" />
              <p className="text-gray-500 font-medium">Carregando permissões...</p>
          </div>
      );
  }

  return (
    <div className="min-h-screen bg-[#f8f9fa] dark:bg-gray-900 flex flex-col font-sans">
        
        {/* Header Fixo */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 sticky top-0 z-30 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-4">
                <button onClick={() => navigate('/usuarios')} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors text-gray-500">
                    <ArrowLeft size={20} />
                </button>
                <div>
                    <h1 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
                        <ShieldCheck className="text-indigo-600" size={20}/> 
                        Permissões: <span className="text-gray-500 font-normal">{usuarioAlvo?.nome}</span>
                    </h1>
                    <p className="text-xs text-gray-400 dark:text-gray-500 hidden sm:block">Gerencie detalhadamente o acesso deste usuário.</p>
                </div>
            </div>
            <div className="flex gap-3">
                 <button onClick={() => navigate('/usuarios')} className="px-4 py-2 border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 rounded-lg text-sm font-bold hover:bg-gray-50 transition-colors">Cancelar</button>
                 <button onClick={handleSalvar} disabled={saving} className="px-6 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-500/30 flex items-center gap-2 disabled:opacity-70 transition-all">
                    {saving ? <Loader2 size={16} className="animate-spin"/> : <Save size={16}/>}
                    Salvar Alterações
                 </button>
            </div>
        </div>

        {/* Conteúdo */}
        <div className="flex-1 max-w-4xl mx-auto w-full p-6 animate-fade-in">
            
            {/* Aviso de Hierarquia */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-xl p-4 mb-6 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                <div>
                    <h4 className="text-sm font-bold text-blue-800 dark:text-blue-200">Modo de Edição Seguro</h4>
                    <p className="text-xs text-blue-700 dark:text-blue-300 mt-1 leading-relaxed">
                        Você só pode conceder ou revogar permissões que <b>você também possui</b>. Permissões que você não tem aparecem bloqueadas com um cadeado.
                    </p>
                </div>
            </div>

            {/* Lista de Grupos */}
            <div className="space-y-4">
                {ESTRUTURA_PERMISSOES.map(grupo => (
                    <AccordionPermissao 
                        key={grupo.id}
                        grupo={grupo}
                        formData={formData}
                        onChange={handleChange}
                        usuarioLogado={usuarioLogado}
                    />
                ))}
            </div>
        </div>
    </div>
  );
}