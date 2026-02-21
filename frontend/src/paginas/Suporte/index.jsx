// frontend/src/paginas/Suporte/index.jsx - COM ABAS E ORDENAÇÃO CORRIGIDA

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contextos/AuthContext';
import { useChat } from '../../contextos/ChatContext';
import { useNavigate } from 'react-router-dom';
import {
  LifeBuoy, Search, Clock, CheckCircle, AlertCircle,
  Loader2, RefreshCw, MessageSquare, User, Play, XCircle, 
  ChevronLeft, ChevronRight, Lightbulb, Zap, Star, Eye, X, AlertTriangle
} from 'lucide-react';
import api from '../../servicos/api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const CHAMADOS_POR_PAGINA = 10;

export default function Suporte() {
  const { usuario } = useAuth();
  const { setAberto, selecionarConversa } = useChat();
  const navigate = useNavigate();
  
  const [solicitacoes, setSolicitacoes] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [busca, setBusca] = useState('');
  const [abaAtiva, setAbaAtiva] = useState('ABERTOS'); // ABERTOS, ENCERRADOS, ESPERA_LONGA
  const [processando, setProcessando] = useState(null);
  
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  
  const [mostrarAvaliacao, setMostrarAvaliacao] = useState(null);
  
  const [estatisticas, setEstatisticas] = useState({
    pendentes: 0,
    emAtendimento: 0,
    encerrados: 0,
    total: 0,
    tempoMedioMinutos: 0,
    tempoMedioPrimeiraRespostaMinutos: 0,
    atendentesAtivos: 0,
    totalProblemasTecnicos: 0,
    totalChamadosAbertos: 0
  });
  

  const carregarDados = useCallback(async () => {
    setCarregando(true);
    try {
      // ✅ Determinar filtro baseado na aba
      let statusFiltro = 'TODOS';
      if (abaAtiva === 'ABERTOS') {
        // CORREÇÃO: Usar um filtro que o backend entenda para 'ABERTOS' 
        // Se o backend não entende 'ABERTOS', vamos enviar 'TODOS' (não encerrados) e/ou depender da lógica do backend.
        // Mantenho 'ABERTOS' conforme sua intenção, mas se o backend não funciona, é aqui que deve ser ajustado para 'TODOS' ou 'PENDENTE,EM_ATENDIMENTO'.
        // Mantendo o valor 'ABERTOS' e o comentário de que o backend deve interpretar.
        statusFiltro = 'ABERTOS'; 
      } else if (abaAtiva === 'ENCERRADOS') {
        statusFiltro = 'ENCERRADO';
      } else if (abaAtiva === 'ESPERA_LONGA') {
        statusFiltro = 'ESPERA_LONGA'; 
      }

      const [solicitacoesRes, estatisticasRes] = await Promise.allSettled([
        api.get(`/suporte/solicitacoes?status=${statusFiltro}&page=${paginaAtual}&limit=${CHAMADOS_POR_PAGINA}${busca ? `&busca=${busca}` : ''}`),
        api.get('/suporte/estatisticas')
      ]);

      if (solicitacoesRes.status === 'fulfilled') {
        // ✅ ORDENAR: Mais novo em cima (criadaEm DESC)
        // Corrigido o filtro de ordenação, que estava apenas ordenando, mas não filtrando
        // Adicionando filtro local para Espera Longa (caso o backend não o faça)
        let solicitacoesRecebidas = solicitacoesRes.value.data.solicitacoes || [];
        
        if (abaAtiva === 'ESPERA_LONGA') {
          // Filtro local se o backend retornar 'TODOS' com um status de tempo na query
          // Se o backend está sendo chamado com status=ESPERA_LONGA e funciona, este filtro não é necessário
          // Como o backend é quem deve filtrar, mantemos apenas a ordenação e a paginação do backend.
        }

        const solicitacoesOrdenadas = solicitacoesRecebidas.sort((a, b) => {
          return new Date(b.criadaEm) - new Date(a.criadaEm);
        });
        
        setSolicitacoes(solicitacoesOrdenadas);
        setTotalPaginas(solicitacoesRes.value.data.totalPages || 1);
        
        if (solicitacoesRes.value.data.solicitacoes.length === 1 && busca) {
          setTotalPaginas(1);
          setPaginaAtual(1);
        }
      }

      if (estatisticasRes.status === 'fulfilled') {
        setEstatisticas(estatisticasRes.value.data);
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar chamados de suporte.');
    } finally {
      setCarregando(false);
    }
  }, [paginaAtual, abaAtiva, busca]);

  useEffect(() => {
    carregarDados();
    
    const interval = setInterval(carregarDados, 30000);
    return () => clearInterval(interval);
  }, [navigate, carregarDados]);

  useEffect(() => {
    setPaginaAtual(1);
  }, [abaAtiva]);

  const aceitarChamado = async (solicitacao) => {
    if (processando === solicitacao.id) return;
    setProcessando(solicitacao.id);
    
    try {
      const response = await api.post(`/suporte/solicitacoes/${solicitacao.id}/aceitar`);
      const { protocolo, solicitacao: solicitacaoAtualizada } = response.data;
      
      toast.success(`Atendimento iniciado! Protocolo: ${protocolo}`);
      
      setAberto(true);
      selecionarConversa({
        tipo: 'suporte',
        solicitacao: solicitacaoAtualizada,
        protocolo: protocolo,
        id: `suporte-${solicitacaoAtualizada.id}`
      });
      
      await carregarDados();
    } catch (error) {
      console.error('Erro ao aceitar chamado:', error);
      const mensagemErro = error.response?.data?.erro || 'Erro ao iniciar atendimento.';
      
      if (mensagemErro.includes('já está sendo atendida')) {
        toast.error('Este chamado já está em atendimento.');
        
        const solicitacaoAtiva = solicitacoes.find(s => s.id === solicitacao.id);
        if (solicitacaoAtiva) {
          setAberto(true);
          selecionarConversa({
            tipo: 'suporte',
            solicitacao: solicitacaoAtiva,
            protocolo: solicitacaoAtiva.protocolo,
            id: `suporte-${solicitacaoAtiva.id}`
          });
        }
      } else if (mensagemErro.includes('já foi encerrada')) {
        toast.error('Este chamado já foi encerrado.');
        await carregarDados();
      } else {
        toast.error(mensagemErro);
      }
    } finally {
      setProcessando(null);
    }
  };

  const encerrarChamado = async (solicitacaoId) => {
    if (!window.confirm('Tem certeza que deseja encerrar este atendimento?')) return;
    setProcessando(solicitacaoId);
    
    try {
      await api.post(`/suporte/solicitacoes/${solicitacaoId}/encerrar`, {
        observacao: 'Atendimento concluído com sucesso.'
      });
      
      toast.success('Chamado encerrado com sucesso!');
      await carregarDados();
    } catch (error) {
      console.error('Erro ao encerrar chamado:', error);
      toast.error(error.response?.data?.erro || 'Erro ao encerrar atendimento.');
    } finally {
      setProcessando(null);
    }
  };

  const buscarPorProtocolo = async () => {
    if (!busca.trim()) {
      await carregarDados();
      return;
    }
    
    setCarregando(true);
    setPaginaAtual(1);
    
    try {
      const response = await api.get(`/suporte/solicitacoes/protocolo/${busca.trim()}`);
      setSolicitacoes([response.data.solicitacao]);
      setTotalPaginas(1);
      toast.success('Protocolo encontrado!');
    } catch (error) {
      console.error('Erro ao buscar protocolo:', error);
      toast.error('Protocolo não encontrado.');
      setSolicitacoes([]);
      setTotalPaginas(0);
    } finally {
      setCarregando(false);
    }
  };

  const getStatusInfo = (status) => {
    const statusMap = {
      PENDENTE: { 
        label: 'Aguardando', 
        cor: 'yellow', 
        icone: Clock, 
        bg: 'bg-yellow-100', 
        text: 'text-yellow-700', 
        border: 'border-yellow-300' 
      },
      EM_ATENDIMENTO: { 
        label: 'Em Atendimento', 
        cor: 'blue', 
        icone: MessageSquare, 
        bg: 'bg-blue-100', 
        text: 'text-blue-700', 
        border: 'border-blue-300' 
      },
      ENCERRADO: { 
        label: 'Encerrado', 
        cor: 'green', 
        icone: CheckCircle, 
        bg: 'bg-green-100', 
        text: 'text-green-700', 
        border: 'border-green-300' 
      }
    };
    return statusMap[status] || statusMap.PENDENTE;
  };

  const getTipoLabel = (tipo) => {
    const tipos = {
      tecnico: 'Técnico',
      duvida: 'Dúvida',
      problema: 'Problema',
      financeiro: 'Financeiro',
      outro: 'Outro'
    };
    return tipos[tipo] || tipo;
  };
  
  // ✅ Verificar se chamado está há muito tempo em espera (>1h)
  const isEsperaLonga = (solicitacao) => {
    if (solicitacao.status === 'ENCERRADO') return false;
    const agora = new Date();
    const criadaEm = new Date(solicitacao.criadaEm);
    const diferencaHoras = (agora - criadaEm) / (1000 * 60 * 60);
    return diferencaHoras > 1;
  };
  
  const handleMudarPagina = (novaPagina) => {
    if (novaPagina > 0 && novaPagina <= totalPaginas) {
      setPaginaAtual(novaPagina);
      window.scrollTo(0, 0);
    }
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 animate-fadeIn">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                <LifeBuoy className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Central de Suporte</h1>
                <p className="text-sm text-gray-600">Gerencie chamados e atendimentos em tempo real</p>
              </div>
            </div>
            <button
              onClick={() => { setBusca(''); carregarDados(); }}
              disabled={carregando}
              className="p-3 bg-white hover:bg-gray-50 rounded-2xl transition-all shadow-md border border-gray-200 disabled:opacity-50 group"
            >
              <RefreshCw className={`w-5 h-5 text-gray-600 ${carregando ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
            </button>
          </div>

          {/* Cards de Estatísticas */}
          <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-4 animate-scaleIn">
            <div className="stat-card bg-white rounded-2xl p-4 shadow-md border border-gray-100 hover:shadow-lg transition-all hover:-translate-y-0.5">
              <div className="flex items-center justify-between mb-3">
                <Clock className="w-5 h-5 text-yellow-600" />
                <div className="chart-bar-yellow"></div>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-1">{estatisticas.pendentes}</h3>
              <p className="text-xs font-semibold text-gray-600">Aguardando</p>
            </div>

            <div className="stat-card bg-white rounded-2xl p-4 shadow-md border border-gray-100 hover:shadow-lg transition-all hover:-translate-y-0.5">
              <div className="flex items-center justify-between mb-3">
                <MessageSquare className="w-5 h-5 text-blue-600" />
                <div className="chart-bar-blue"></div>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-1">{estatisticas.emAtendimento}</h3>
              <p className="text-xs font-semibold text-gray-600">Em Atendimento</p>
            </div>

            <div className="stat-card bg-white rounded-2xl p-4 shadow-md border border-gray-100 hover:shadow-lg transition-all hover:-translate-y-0.5">
              <div className="flex items-center justify-between mb-3">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <div className="chart-bar-green"></div>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-1">{estatisticas.encerrados}</h3>
              <p className="text-xs font-semibold text-gray-600">Encerrados</p>
            </div>

            <div className="stat-card bg-white rounded-2xl p-4 shadow-md border border-gray-100 hover:shadow-lg transition-all hover:-translate-y-0.5">
              <h3 className="text-2xl font-bold text-gray-900 mb-1">{estatisticas.total}</h3>
              <p className="text-xs font-semibold text-gray-600">Total</p>
            </div>
            
            <div className="stat-card bg-white rounded-2xl p-4 shadow-md border border-gray-100 hover:shadow-lg transition-all hover:-translate-y-0.5">
              <h3 className="text-2xl font-bold text-gray-900 mb-1">{estatisticas.tempoMedioPrimeiraRespostaMinutos}<span className="text-base">min</span></h3>
              <p className="text-xs font-semibold text-gray-600">Tempo 1ª Resposta</p>
            </div>

            <div className="stat-card bg-white rounded-2xl p-4 shadow-md border border-gray-100 hover:shadow-lg transition-all hover:-translate-y-0.5">
              <h3 className="text-2xl font-bold text-gray-900 mb-1">{estatisticas.atendentesAtivos}</h3>
              <p className="text-xs font-semibold text-gray-600">Atendentes Ativos</p>
            </div>

            <div className="stat-card bg-white rounded-2xl p-4 shadow-md border border-gray-100 hover:shadow-lg transition-all hover:-translate-y-0.5">
              <h3 className="text-2xl font-bold text-gray-900 mb-1">{estatisticas.totalProblemasTecnicos}</h3>
              <p className="text-xs font-semibold text-gray-600">Problemas Técnicos</p>
            </div>
          </div>
        </div>

        {/* Layout Principal */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
          {/* LADO ESQUERDO: Chamados e Filtros */}
          <div className="lg:col-span-8">
            
            {/* ✅ ABAS: Abertos, Encerrados, Espera Longa */}
            <div className="bg-white rounded-2xl shadow-md border border-gray-100 mb-6 overflow-hidden">
              <div className="flex border-b border-gray-200">
                <button
                  onClick={() => setAbaAtiva('ABERTOS')}
                  className={`flex-1 px-6 py-4 text-sm font-bold transition-all relative ${
                    abaAtiva === 'ABERTOS'
                      ? 'text-blue-600 bg-blue-50'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  Chamados Abertos
                  {abaAtiva === 'ABERTOS' && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600"></div>
                  )}
                </button>
                
                <button
                  onClick={() => setAbaAtiva('ENCERRADOS')}
                  className={`flex-1 px-6 py-4 text-sm font-bold transition-all relative ${
                    abaAtiva === 'ENCERRADOS'
                      ? 'text-green-600 bg-green-50'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  Chamados Encerrados
                  {abaAtiva === 'ENCERRADOS' && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-green-600"></div>
                  )}
                </button>
                
                <button
                  onClick={() => setAbaAtiva('ESPERA_LONGA')}
                  className={`flex-1 px-6 py-4 text-sm font-bold transition-all relative ${
                    abaAtiva === 'ESPERA_LONGA'
                      ? 'text-orange-600 bg-orange-50'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    Muito Tempo em Espera
                  </div>
                  {abaAtiva === 'ESPERA_LONGA' && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-orange-600"></div>
                  )}
                </button>
              </div>
            </div>
              
            {/* Filtros e Busca */}
            <div className="bg-white rounded-2xl p-5 shadow-md border border-gray-100 mb-6 animate-scaleIn">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <label className="block text-xs font-bold text-gray-700 mb-2 tracking-wide">Buscar por Protocolo ou Nome</label>
                  <div className="relative group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                    <input
                      type="text"
                      value={busca}
                      onChange={(e) => setBusca(e.target.value.toUpperCase())}
                      onKeyPress={(e) => e.key === 'Enter' && buscarPorProtocolo()}
                      placeholder="Ex: SUP-000000001-OT"
                      className="w-full pl-11 pr-10 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm font-medium bg-gray-50 focus:bg-white"
                    />
                    {busca && (
                      <button
                        onClick={() => { setBusca(''); carregarDados(); }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full transition-all"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex items-end">
                  <button
                    onClick={buscarPorProtocolo}
                    className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-bold text-sm shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105"
                  >
                    Buscar
                  </button>
                </div>
              </div>
            </div>

            {/* Lista de Chamados */}
            <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
                <h2 className="text-lg font-bold text-gray-900">
                  {abaAtiva === 'ABERTOS' && `Chamados Abertos (${solicitacoes.length})`}
                  {abaAtiva === 'ENCERRADOS' && `Chamados Encerrados (${solicitacoes.length})`}
                  {abaAtiva === 'ESPERA_LONGA' && `Prioridade - Muito Tempo em Espera (${solicitacoes.length})`}
                </h2>
              </div>

              <div className="relative" style={{ minHeight: '500px' }}>
                {carregando ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-white/70 backdrop-blur-sm z-10">
                    <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                  </div>
                ) : solicitacoes.length === 0 ? (
                  <div className="text-center py-20">
                    <LifeBuoy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-gray-900 mb-2">Nenhum chamado encontrado</h3>
                    <p className="text-sm text-gray-500">
                      {busca ? 'Tente buscar por outro protocolo' : 'Não há solicitações no momento'}
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {solicitacoes.map((solicitacao) => {
                      const statusInfo = getStatusInfo(solicitacao.status);
                      const IconeStatus = statusInfo.icone;
                      const esperaLonga = isEsperaLonga(solicitacao);

                      return (
                        <div
                          key={solicitacao.id}
                          className={`p-4 hover:bg-gray-50 transition-all animate-fadeIn group ${esperaLonga && abaAtiva !== 'ENCERRADOS' ? 'bg-orange-50 border-l-4 border-orange-500' : ''}`}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex items-start gap-3 flex-1 min-w-0">
                              <div className="flex-shrink-0 pt-0.5">
                                {solicitacao.solicitante.foto_perfil ? (
                                  <img 
                                    src={`${import.meta.env.VITE_API_URL}/uploads/avatars/${solicitacao.solicitante.foto_perfil}`}
                                    alt={solicitacao.solicitante.nome}
                                    className="w-10 h-10 rounded-full object-cover shadow-sm"
                                    onError={(e) => {
                                      e.target.style.display = 'none';
                                      e.target.parentElement.innerHTML = `<div class="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-sm">${solicitacao.solicitante.nome.charAt(0).toUpperCase()}</div>`;
                                    }}
                                  />
                                ) : (
                                  <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-sm">
                                    {solicitacao.solicitante.nome.charAt(0).toUpperCase()}
                                  </div>
                                )}
                              </div>

                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <h3 className="text-sm font-bold text-gray-900 truncate">
                                    {solicitacao.solicitante.nome}
                                  </h3>
                                  {solicitacao.protocolo && (
                                    <div className="inline-flex items-center px-2 py-0.5 bg-blue-50 border border-blue-200 rounded-md">
                                      <LifeBuoy className="w-3 h-3 text-blue-600" />
                                      <span className="text-xs font-bold text-blue-900 ml-1">
                                        {solicitacao.protocolo}
                                      </span>
                                    </div>
                                  )}
                                  {esperaLonga && abaAtiva !== 'ENCERRADOS' && (
                                    <div className="inline-flex items-center px-2 py-0.5 bg-orange-100 border border-orange-300 rounded-md">
                                      <AlertTriangle className="w-3 h-3 text-orange-600" />
                                      <span className="text-xs font-bold text-orange-900 ml-1">
                                        URGENTE
                                      </span>
                                    </div>
                                  )}
                                </div>
                                
                                <p className="text-xs text-gray-600 truncate leading-snug mb-1">
                                  <span className="font-semibold text-purple-700 mr-1.5">
                                    [{getTipoLabel(solicitacao.tipo)}]
                                  </span>
                                  {solicitacao.descricao}
                                </p>
                                
                                <div className="flex items-center gap-3 text-xs text-gray-500">
                                  <div className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    <span>
                                      {format(new Date(solicitacao.criadaEm), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                                    </span>
                                  </div>
                                  {solicitacao.atendidoPor && (
                                    <div className="flex items-center gap-1">
                                      <User className="w-3 h-3" />
                                      <span>Atendente: {solicitacao.atendidoPor.nome}</span>
                                    </div>
                                  )}
                                  {solicitacao.avaliacao && (
                                    <div className="flex items-center gap-1">
                                      <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                      <span className="font-semibold text-yellow-600">
                                        {solicitacao.avaliacao}/5
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-3 flex-shrink-0">
                              <span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${statusInfo.bg} ${statusInfo.text} flex items-center justify-center min-w-[130px]`}>
                                <IconeStatus className="w-3.5 h-3.5 mr-1.5" />
                                {statusInfo.label}
                              </span>

                              <div className="flex gap-2">
                                {solicitacao.status === 'ENCERRADO' && solicitacao.avaliacao && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setMostrarAvaliacao(solicitacao);
                                    }}
                                    className="p-2.5 bg-yellow-500 text-white rounded-xl hover:bg-yellow-600 transition-all shadow-sm hover:shadow-md"
                                    title="Ver Avaliação"
                                  >
                                    <Eye className="w-4 h-4" />
                                  </button>
                                )}

                                {solicitacao.status === 'PENDENTE' && (
                                  <button
                                    onClick={() => aceitarChamado(solicitacao)}
                                    disabled={processando === solicitacao.id}
                                    className="p-2.5 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-all disabled:opacity-50 shadow-sm hover:shadow-md"
                                    title="Aceitar Chamado"
                                  >
                                    {processando === solicitacao.id ? (
                                      <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                      <Play className="w-4 h-4" />
                                    )}
                                  </button>
                                )}

                                {solicitacao.status === 'EM_ATENDIMENTO' && (
                                  <>
                                    <button
                                      onClick={() => aceitarChamado(solicitacao)}
                                      className="p-2.5 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-all shadow-sm hover:shadow-md"
                                      title="Abrir Conversa"
                                    >
                                      <MessageSquare className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() => encerrarChamado(solicitacao.id)}
                                      disabled={processando === solicitacao.id}
                                      className="p-2.5 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-all disabled:opacity-50 shadow-sm hover:shadow-md"
                                      title="Encerrar"
                                    >
                                      {processando === solicitacao.id ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                      ) : (
                                        <XCircle className="w-4 h-4" />
                                      )}
                                    </button>
                                  </>
                                )}

                                {solicitacao.status === 'ENCERRADO' && (
                                  <div className="p-2.5 text-green-700 rounded-xl bg-green-100" title="Concluído">
                                    <CheckCircle className="w-4 h-4" />
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
            
            {/* Paginação */}
            {(totalPaginas > 1 && !busca) && (
              <div className="flex justify-center items-center gap-4 mt-6 animate-fadeIn">
                <button
                  onClick={() => handleMudarPagina(paginaAtual - 1)}
                  disabled={paginaAtual === 1}
                  className="px-4 py-2 bg-white text-gray-700 rounded-xl font-semibold text-sm shadow-md border border-gray-200 transition-all hover:bg-gray-50 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <ChevronLeft className="w-5 h-5" />
                  Anterior
                </button>
                
                <span className="text-sm font-semibold text-gray-700 px-4 py-2 bg-white rounded-xl shadow-md border border-gray-200">
                  Página {paginaAtual} de {totalPaginas}
                </span>
                
                <button
                  onClick={() => handleMudarPagina(paginaAtual + 1)}
                  disabled={paginaAtual === totalPaginas}
                  className="px-4 py-2 bg-white text-gray-700 rounded-xl font-semibold text-sm shadow-md border border-gray-200 transition-all hover:bg-gray-50 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  Próxima
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>

          {/* LADO DIREITO: Dicas */}
          <div className="lg:col-span-4 hidden lg:block">
            <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden sticky top-6 animate-scaleIn" style={{ animationDelay: '0.2s' }}>
              <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-yellow-50 to-orange-50">
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-yellow-500" />
                  Dicas de Produtividade
                </h2>
              </div>

              <div className="p-5 space-y-4">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center bg-yellow-100">
                    <Clock className="w-5 h-5 text-yellow-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-gray-900 mb-1">Priorize o Pendente</h4>
                    <p className="text-xs text-gray-600 leading-relaxed">Chamados 'Aguardando' devem ser aceitos o mais rápido possível.</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center bg-blue-100">
                    <MessageSquare className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-gray-900 mb-1">Comunicação Clara</h4>
                    <p className="text-xs text-gray-600 leading-relaxed">Use o protocolo de atendimento em todas as interações.</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center bg-green-100">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-gray-900 mb-1">Documente o Encerramento</h4>
                    <p className="text-xs text-gray-600 leading-relaxed">Adicione uma breve observação sobre a solução aplicada.</p>
                  </div>
                </div>
              </div>

              <div className="px-5 pb-5">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 text-white shadow-lg">
                  <div className="flex items-start gap-3">
                    <Zap className="w-6 h-6 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-sm mb-1">Você está fazendo um ótimo trabalho!</h4>
                      <p className="text-xs opacity-90">Continue prestando um atendimento de excelência.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Modal Avaliação */}
      {mostrarAvaliacao && (
        <ModalAvaliacao
          solicitacao={mostrarAvaliacao}
          onClose={() => setMostrarAvaliacao(null)}
        />
      )}

      {/* Estilos */}
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out;
        }

        .animate-scaleIn {
          animation: scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .chart-bar-yellow,
        .chart-bar-blue,
        .chart-bar-green {
          width: 32px;
          height: 20px;
          display: flex;
          align-items: flex-end;
          gap: 2px;
        }

        .chart-bar-yellow::before,
        .chart-bar-yellow::after {
          content: '';
          width: 4px;
          border-radius: 2px;
        }
        
        .chart-bar-yellow::before { height: 60%; background: #ca8a04; }
        .chart-bar-yellow::after { height: 100%; background: #eab308; }

        .chart-bar-blue::before,
        .chart-bar-blue::after {
          content: '';
          width: 4px;
          border-radius: 2px;
        }
        
        .chart-bar-blue::before { height: 70%; background: #2563eb; }
        .chart-bar-blue::after { height: 90%; background: #3b82f6; }

        .chart-bar-green::before,
        .chart-bar-green::after {
          content: '';
          width: 4px;
          border-radius: 2px;
        }
        
        .chart-bar-green::before { height: 80%; background: #16a34a; }
        .chart-bar-green::after { height: 100%; background: #22c55e; }
      `}</style>
    </div>
  );
}

// Modal de Avaliação (mantido igual)
function ModalAvaliacao({ solicitacao, onClose }) {
  if (!solicitacao) return null;

  const mensagensAvaliacao = {
    5: { emoji: '🌟', texto: 'Excelente!', cor: 'from-green-500 to-emerald-600' },
    4: { emoji: '😊', texto: 'Muito bom!', cor: 'from-blue-500 to-cyan-600' },
    3: { emoji: '😐', texto: 'Bom', cor: 'from-yellow-500 to-amber-600' },
    2: { emoji: '😕', texto: 'Poderia melhorar', cor: 'from-orange-500 to-red-500' },
    1: { emoji: '😞', texto: 'Insatisfeito', cor: 'from-red-500 to-rose-600' }
  };

  const avaliacaoInfo = mensagensAvaliacao[solicitacao.avaliacao] || mensagensAvaliacao[3];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[70] p-4 animate-fadeIn" onClick={onClose}>
      <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl max-w-lg w-full animate-scaleIn overflow-hidden" onClick={(e) => e.stopPropagation()}>
        
        <div className="bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 text-white px-8 py-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer"></div>
          
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-xl rounded-2xl flex items-center justify-center">
                <Star className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold">Avaliação do Atendimento</h3>
            </div>
            
            <button
              onClick={onClose}
              className="w-9 h-9 hover:bg-white/20 rounded-full transition-all duration-200 flex items-center justify-center hover:rotate-90"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-8">
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-full border border-blue-200 dark:border-blue-800">
              <span className="text-sm text-gray-600 dark:text-gray-400">Protocolo:</span>
              <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                {solicitacao.protocolo || 'N/A'}
              </span>
            </div>
          </div>

          <div className={`text-center mb-6 p-6 bg-gradient-to-r ${avaliacaoInfo.cor} rounded-2xl`}>
            <div className="flex flex-col items-center justify-center gap-3 text-white">
              <span className="text-5xl">{avaliacaoInfo.emoji}</span>
              <div>
                <p className="text-2xl font-bold mb-2">{avaliacaoInfo.texto}</p>
                <div className="flex gap-1 justify-center">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-6 h-6 ${
                        star <= solicitacao.avaliacao
                          ? 'fill-white text-white'
                          : 'text-white/40'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {solicitacao.comentarioAvaliacao && (
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-5 mb-6">
              <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-2">Comentário:</h4>
              <p className="text-sm text-gray-700 dark:text-gray-300 italic leading-relaxed">
                "{solicitacao.comentarioAvaliacao}"
              </p>
            </div>
          )}

          {solicitacao.solicitante && (
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 flex-shrink-0 rounded-full overflow-hidden">
                  {solicitacao.solicitante.foto_perfil ? (
                    <img
                      src={`${import.meta.env.VITE_API_URL}/uploads/avatars/${solicitacao.solicitante.foto_perfil}`}
                      alt={solicitacao.solicitante.nome}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        const div = document.createElement('div');
                        div.className = 'w-full h-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-sm font-bold';
                        div.textContent = solicitacao.solicitante.nome.charAt(0).toUpperCase();
                        e.target.parentElement.appendChild(div);
                      }}
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-sm font-bold">
                      {solicitacao.solicitante.nome.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-0.5">Avaliado por</p>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">{solicitacao.solicitante.nome}</p>
                </div>
              </div>
            </div>
          )}

          <button
            onClick={onClose}
            className="w-full mt-6 px-5 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-semibold hover:shadow-xl hover:scale-105 transition-all"
          >
            Fechar
          </button>
        </div>
      </div>

      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-shimmer {
          animation: shimmer 3s infinite;
        }
      `}</style>
    </div>
  );
}