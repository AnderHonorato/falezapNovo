// frontend/src/paginas/WhatsApp.jsx - VERSÃO COM ANALYTICS, MODAL DE NOMEAÇÃO E CARD DE ADICIONAR

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contextos/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  Smartphone, QrCode, Loader2, CheckCircle2, XCircle,
  RefreshCw, Power, AlertCircle, Wifi, WifiOff, Phone,
  MessageSquare, Clock, Zap, ChevronRight, Settings,
  Plus, Search, MoreVertical, Link2, Signal, Crown,
  Users, TrendingUp, Inbox, Activity, BarChart3,
  Target, Sparkles, Lightbulb, Rocket, Edit3, X
} from 'lucide-react';
import api from '../servicos/api';
import toast from 'react-hot-toast';

export default function WhatsApp() {
  const { usuario } = useAuth();
  const navigate = useNavigate();

  const [instancias, setInstancias] = useState([]);
  const [limite, setLimite] = useState({ limite: 1, usado: 0, disponivel: 1 });
  const [carregando, setCarregando] = useState(true);
  const [processando, setProcessando] = useState(null);
  const [qrCodeAtivo, setQrCodeAtivo] = useState(null);
  const [qrCodeData, setQrCodeData] = useState(null);
  const [filtro, setFiltro] = useState('');

  // ✅ NOVO: Modal de nomeação
  const [modalNomeacao, setModalNomeacao] = useState({ aberto: false, instancia: null });
  const [nomeInstancia, setNomeInstancia] = useState('');
  const [corInstancia, setCorInstancia] = useState('#25D366');

  // ✅ NOVO: Estatísticas
  const [estatisticas, setEstatisticas] = useState({
    totalMensagensHoje: 0,
    totalConversasAtivas: 0,
    tempoMedioResposta: 0,
    taxaResposta: 0
  });

  const intervalRef = useRef(null);

  const coresPredefinidas = [
    { cor: '#25D366', nome: 'Verde WhatsApp' },
    { cor: '#0088CC', nome: 'Azul' },
    { cor: '#FF6B6B', nome: 'Vermelho' },
    { cor: '#9C27B0', nome: 'Roxo' },
    { cor: '#FF9800', nome: 'Laranja' },
    { cor: '#E91E63', nome: 'Rosa' },
    { cor: '#00BCD4', nome: 'Ciano' },
    { cor: '#4CAF50', nome: 'Verde' },
  ];

  useEffect(() => {
    carregarInstancias();
    carregarLimite();
    carregarEstatisticas();

    intervalRef.current = setInterval(() => {
      carregarInstancias(true);
      carregarEstatisticas(true);
    }, 10000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [usuario]);

  const carregarInstancias = async (silencioso = false) => {
    if (!silencioso) setCarregando(true);

    try {
      const response = await api.get('/whatsapp/instancias');

      if (response.data?.sucesso) {
        setInstancias(response.data.instancias || []);
        if (response.data.limite) {
          setLimite(response.data.limite);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar instâncias:', error);
      if (!silencioso) {
        toast.error('Erro ao carregar conexões');
      }
    } finally {
      if (!silencioso) setCarregando(false);
    }
  };

  const carregarLimite = async () => {
    try {
      const response = await api.get('/whatsapp/limite');
      if (response.data?.sucesso) {
        setLimite(response.data);
      }
    } catch (error) {
      console.error('Erro ao carregar limite:', error);
    }
  };

  const carregarEstatisticas = async (silencioso = false) => {
    try {
      const response = await api.get('/whatsapp/estatisticas-mensagens');
      if (response.data?.sucesso) {
        setEstatisticas(response.data.estatisticas || estatisticas);
      }
    } catch (error) {
      if (!silencioso) {
        console.error('Erro ao carregar estatísticas:', error);
      }
    }
  };

  // ✅ ABRIR MODAL DE NOMEAÇÃO
  const abrirModalNomeacao = (instancia) => {
    setModalNomeacao({ aberto: true, instancia: instancia.instancia });
    setNomeInstancia(instancia.nomeInstancia || `WhatsApp ${instancia.instancia}`);
    setCorInstancia(instancia.corIdentificacao || '#25D366');
  };

  // ✅ SALVAR NOME E COR
  const salvarNomeECor = async () => {
    if (!nomeInstancia.trim()) {
      toast.error('Digite um nome para a instância');
      return;
    }

    try {
      await api.put(`/whatsapp/instancia/${modalNomeacao.instancia}`, {
        nomeInstancia: nomeInstancia.trim(),
        corIdentificacao: corInstancia
      });

      toast.success('Nome e cor salvos com sucesso!');
      setModalNomeacao({ aberto: false, instancia: null });
      carregarInstancias();
    } catch (error) {
      console.error('Erro ao salvar:', error);
      toast.error('Erro ao salvar configurações');
    }
  };

  const gerarQRCode = async (instancia) => {
    setProcessando(instancia);
    setQrCodeAtivo(instancia);
    setQrCodeData(null);

    const toastId = toast.loading('Gerando QR Code...');

    try {
      const response = await api.post('/whatsapp/gerar-qr-code', {
        instancia: instancia
      });

      if (response.data?.qrCode) {
        setQrCodeData(response.data.qrCode);
        toast.success('QR Code gerado! Escaneie com seu WhatsApp.', { id: toastId });

        const checkInterval = setInterval(async () => {
          try {
            const statusRes = await api.get(`/whatsapp/status/${instancia}`);

            if (statusRes.data?.conectado) {
              clearInterval(checkInterval);
              setQrCodeAtivo(null);
              setQrCodeData(null);
              toast.success('Conectado com sucesso!');
              carregarInstancias();
            }
          } catch (error) {
            console.error('Erro ao verificar status:', error);
          }
        }, 3000);

        setTimeout(() => {
          clearInterval(checkInterval);
          if (qrCodeAtivo === instancia) {
            setQrCodeAtivo(null);
            setQrCodeData(null);
            toast.error('QR Code expirado. Tente novamente.', { id: toastId });
          }
        }, 120000); // 2 minutos
      } else {
         // Se não veio QR code na resposta
         toast.error(response.data?.erro || 'Não foi possível gerar o QR Code.', { id: toastId });
         setQrCodeAtivo(null);
         setQrCodeData(null);
      }
    } catch (error) {
      console.error('Erro ao gerar QR Code:', error);
      toast.error(error.response?.data?.erro || 'Erro ao gerar QR Code', { id: toastId });
      setQrCodeAtivo(null);
      setQrCodeData(null);
    } finally {
      setProcessando(null);
    }
  };

  const desconectar = async (instancia) => {
    if (!window.confirm('Tem certeza que deseja desconectar esta instância?')) {
      return;
    }

    setProcessando(instancia);
    const toastId = toast.loading('Desconectando...');

    try {
      await api.post(`/whatsapp/desconectar/${instancia}`);
      toast.success('Desconectado com sucesso!', { id: toastId });
      carregarInstancias();
    } catch (error) {
      console.error('Erro ao desconectar:', error);
      toast.error(error.response?.data?.erro || 'Erro ao desconectar da instância atual', { id: toastId });
    } finally {
      setProcessando(null);
    }
  };

  // ================================================
  // ✅ FUNÇÃO NOVA PARA CRIAR INSTÂNCIA
  // ================================================
  const handleCriarInstancia = async () => {
    if (processando) return; // Evita clique duplo
    setProcessando('criar_nova');

    const toastId = toast.loading('Criando nova conexão...');

    try {
      // Chama a API para criar um novo "slot" de instância
      await api.post('/whatsapp/criar-instancia');

      toast.success('Conexão criada! Agora gere o QR Code.', { id: toastId });

      // Atualiza a lista para mostrar o novo card
      await carregarInstancias(true);
      await carregarLimite();

    } catch (error) {
      console.error('Erro ao criar instância:', error);
      toast.error(error.response?.data?.erro || 'Erro ao criar conexão', { id: toastId });
    } finally {
      setProcessando(null);
    }
  };

  const formatarNumero = (numero) => {
    if (!numero) return 'Não conectado';

    let limpo = numero.split('@')[0];
    limpo = limpo.split(':')[0];
    limpo = limpo.replace(/\D/g, '');

    // Formatação específica para números brasileiros com 9º dígito
    if (limpo.startsWith('55') && limpo.length === 13) {
      return `+${limpo.slice(0, 2)} (${limpo.slice(2, 4)}) ${limpo.slice(4, 9)}-${limpo.slice(9, 13)}`;
    }
    // Formatação específica para números brasileiros sem 9º dígito (fixos ou antigos)
    if (limpo.startsWith('55') && limpo.length === 12) {
      return `+${limpo.slice(0, 2)} (${limpo.slice(2, 4)}) ${limpo.slice(4, 8)}-${limpo.slice(8, 12)}`;
    }
    // Tentativa genérica para outros números brasileiros
    if (limpo.startsWith('55') && limpo.length >= 12) {
      const codigo = limpo.slice(0, 2);
      const ddd = limpo.slice(2, 4);
      const resto = limpo.slice(4); // Pega todo o resto

      if (resto.length === 9) { // Celular com 9 dígitos
        return `+${codigo} (${ddd}) ${resto.slice(0, 5)}-${resto.slice(5)}`;
      } else if (resto.length === 8) { // Fixo com 8 dígitos
        return `+${codigo} (${ddd}) ${resto.slice(0, 4)}-${resto.slice(4)}`;
      }
    }

    // Retorno genérico se não for brasileiro
    return `+${limpo}`;
  };

  const formatarTempo = (timestamp) => {
    if (!timestamp) return 'Nunca';
    const diff = Date.now() - new Date(timestamp).getTime();
    const minutos = Math.floor(diff / 60000);
    const horas = Math.floor(minutos / 60);
    const dias = Math.floor(horas / 24);

    if (dias > 0) return `há ${dias}d`;
    if (horas > 0) return `há ${horas}h`;
    if (minutos > 0) return `há ${minutos}m`;
    return 'agora';
  };

  const instanciasFiltradas = instancias.filter(inst => {
    const nome = inst.nomeInstancia || `WhatsApp ${inst.instancia}`;
    const numero = inst.numeroWhatsApp || '';
    return nome.toLowerCase().includes(filtro.toLowerCase()) ||
           numero.includes(filtro);
  });

  const instanciasConectadas = instancias.filter(i => i.status === 'CONECTADO').length;

  if (carregando) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-green-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 font-semibold">Carregando conexões...</p>
        </div>
        {/* Estilos */}
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Roboto+Flex:wght@400;500;600;700;800&display=swap'); * { font-family: 'Roboto Flex', system-ui, -apple-system, sans-serif; }`}</style>
      </div>
    );
  }

  // Lógica de limite ajustada para permitir 1 Baileys extra (failover)
  const slotsOcupados = instancias.length;
  const limiteTotalComBaileysExtra = limite.limite + 1;
  const slotsDisponiveis = limiteTotalComBaileysExtra - slotsOcupados;
  const podeAdicionar = (usuario.tipo === 'OWNER' || usuario.podeGerenciarConexoes) && 
                        (slotsOcupados < limiteTotalComBaileysExtra);

  const slotsDisponiveisMsg = slotsDisponiveis > 0 
    ? `Você tem ${slotsDisponiveis} ${slotsDisponiveis === 1 ? 'conexão disponível' : 'conexões disponíveis'}.`
    : 'Limite de conexões atingido.';

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 p-6">
      {/* Header com Estatísticas */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-green-100">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Smartphone className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-black text-gray-900 mb-1">
                  Conexões
                </h1>
                <p className="text-gray-600 font-medium">
                  Gerencie suas instâncias dos mensageiros
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-gradient-to-r from-green-50 to-emerald-50 px-6 py-3 rounded-xl border-2 border-green-200">
              <Crown className="w-6 h-6 text-yellow-500" />
              <div>
                <p className="text-xs text-gray-600 font-bold uppercase tracking-wide mb-0.5">
                  Plano Atual
                </p>
                <p className="text-lg font-black text-gray-900">
                  {instanciasConectadas} / {limite.limite}
                  <span className="text-sm font-semibold text-gray-500 ml-1">
                    conectados
                  </span>
                </p>
              </div>
            </div>
          </div>

          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar conexão..."
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent font-medium text-gray-900 placeholder-gray-400"
            />
          </div>
        </div>
      </div>

      {/* Cards de Estatísticas */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl shadow-md p-5 border border-gray-100 animate-slideInUp">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-green-600" />
              </div>
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
            <h3 className="text-2xl font-black text-gray-900 mb-1">
              {estatisticas.totalMensagensHoje || 0}
            </h3>
            <p className="text-sm font-semibold text-gray-600">
              Mensagens Hoje
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-md p-5 border border-gray-100 animate-slideInUp" style={{ animationDelay: '0.1s' }}>
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <Activity className="w-5 h-5 text-blue-500" />
             </div>
            <h3 className="text-2xl font-black text-gray-900 mb-1">
              {estatisticas.totalConversasAtivas || 0}
            </h3>
            <p className="text-sm font-semibold text-gray-600">
              Conversas Ativas
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-md p-5 border border-gray-100 animate-slideInUp" style={{ animationDelay: '0.2s' }}>
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <Clock className="w-6 h-6 text-purple-600" />
              </div>
              <Zap className="w-5 h-5 text-purple-500" />
            </div>
            <h3 className="text-2xl font-black text-gray-900 mb-1">
              {estatisticas.tempoMedioResposta || 0}min
            </h3>
            <p className="text-sm font-semibold text-gray-600">
              Tempo Médio
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-md p-5 border border-gray-100 animate-slideInUp" style={{ animationDelay: '0.3s' }}>
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                <Target className="w-6 h-6 text-orange-600" />
              </div>
              <BarChart3 className="w-5 h-5 text-orange-500" />
            </div>
            <h3 className="text-2xl font-black text-gray-900 mb-1">
              {estatisticas.taxaResposta || 0}%
            </h3>
            <p className="text-sm font-semibold text-gray-600">
              Taxa de Resposta
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Grid de Instâncias */}
          <div className="lg:col-span-3">
            {(() => {
              // 1. Lógica de verificação ajustada para permitir 1 Baileys extra
              if (instanciasFiltradas.length === 0 && !podeAdicionar) {
                return (
                  <div className="bg-white rounded-2xl shadow-lg p-12 text-center border border-gray-100">
                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Inbox className="w-10 h-10 text-gray-400" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      Nenhuma conexão encontrada
                    </h3>
                    <p className="text-gray-600">
                      {filtro ? 'Tente ajustar sua busca' : 'Você não tem conexões ativas ou limite para criar.'}
                    </p>
                  </div>
                );
              }

              // 2. Mostra a grade de instâncias e o card de adicionar
              return (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                  {/* Cards de Instâncias Existentes */}
                  {instanciasFiltradas.map((instancia) => {
                    const conectado = instancia.status === 'CONECTADO';
                    const estaProcessando = processando === instancia.instancia;
                    const temQRCode = qrCodeAtivo === instancia.instancia && qrCodeData;
                    const cor = instancia.corIdentificacao || '#25D366';

                    return (
                      <div
                        key={instancia.id}
                        className="bg-white rounded-2xl shadow-lg border-2 border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 animate-scaleIn"
                        style={{ borderTopColor: cor, borderTopWidth: '4px' }}
                      >
                        <div className="p-6 bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3 flex-1">
                              <div
                                className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg relative"
                                style={{ backgroundColor: cor }}
                              >
                                <Phone className="w-7 h-7 text-white" />
                                {conectado && (
                                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white animate-pulse" />
                                )}
                                {/* ✅ Indicador de Parceiro (Baileys/WABA) */}
                                {instancia.tipoParceiro && (
                                  <span className={`absolute bottom-0 right-0 px-1.5 py-0.5 rounded-br-xl rounded-tl-xl text-xs font-black text-white uppercase ${
                                    instancia.tipoParceiro === 'BAILEYS' ? 'bg-orange-500' : 'bg-blue-600'
                                  }`}>
                                    {instancia.tipoParceiro === 'BAILEYS' ? 'B' : 'W'}
                                  </span>
                                )}
                              </div>

                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <h3 className="text-lg font-bold text-gray-900 truncate">
                                    {instancia.nomeInstancia || `WhatsApp ${instancia.instancia}`}
                                  </h3>
                                  <span
                                    className="px-2 py-0.5 rounded-full text-xs font-bold text-white"
                                    style={{ backgroundColor: cor }}
                                  >
                                    #{instancia.instancia}
                                  </span>
                                </div>
                                <p className="text-sm text-gray-600 font-medium mb-1">
                                  {formatarNumero(instancia.numeroWhatsApp)}
                                </p>
                                {conectado ? (
                                  <div className="flex items-center gap-1.5">
                                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                                    <span className="text-xs font-semibold text-green-600">
                                      Conectado {instancia.ultimaConexao && `• ${formatarTempo(instancia.ultimaConexao)}`}
                                    </span>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-1.5">
                                    <div className="w-2 h-2 bg-gray-400 rounded-full" />
                                    <span className="text-xs font-semibold text-gray-500">
                                      Desconectado
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>

                            <button
                              onClick={() => abrirModalNomeacao(instancia)}
                              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                              title="Editar nome e cor"
                            >
                              <Edit3 className="w-5 h-5 text-gray-600" />
                            </button>
                          </div>
                        </div>

                        <div className="p-6">
                          {temQRCode ? (
                            <div className="text-center animate-scaleIn">
                              <div className="bg-white p-4 rounded-2xl border-2 border-green-200 shadow-lg mb-4 inline-block">
                                <img
                                  src={qrCodeData}
                                  alt="QR Code"
                                  className="w-48 h-48 mx-auto"
                                />
                              </div>
                              <div className="flex items-center justify-center gap-2 text-green-600 mb-2">
                                <Signal className="w-4 h-4 animate-pulse" />
                                <p className="text-sm font-semibold">Aguardando leitura...</p>
                              </div>
                              <p className="text-xs text-gray-600">
                                Escaneie o QR Code com seu WhatsApp
                              </p>
                            </div>
                          ) : (
                            <div className="space-y-3">
                              {conectado ? (
                                <>
                                  <button
                                    onClick={() => navigate('/mensagens')}
                                    className="w-full py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 group"
                                  >
                                    <MessageSquare className="w-5 h-5" />
                                    Abrir Conversas
                                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                  </button>
                                  <button
                                    onClick={() => desconectar(instancia.instancia)}
                                    disabled={estaProcessando}
                                    className="w-full py-3 bg-red-50 text-red-600 rounded-xl font-bold border-2 border-red-200 hover:bg-red-100 hover:border-red-300 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    {estaProcessando ? (
                                      <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Desconectando...
                                      </>
                                    ) : (
                                      <>
                                        <Power className="w-5 h-5" />
                                        Desconectar
                                      </>
                                    )}
                                  </button>
                                </>
                              ) : (
                                <button
                                  onClick={() => gerarQRCode(instancia.instancia)}
                                  disabled={estaProcessando}
                                  className="w-full py-3.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed group"
                                >
                                  {estaProcessando ? (
                                    <>
                                      <Loader2 className="w-5 h-5 animate-spin" />
                                      Gerando QR Code...
                                    </>
                                  ) : (
                                    <>
                                      <QrCode className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                      Gerar QR Code
                                    </>
                                  )}
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })} {/* Fim do map */}

                  {/* Card Adicionar Nova Conexão */}
                  {podeAdicionar && (
                    <div
                      onClick={slotsDisponiveis > 0 ? handleCriarInstancia : undefined}
                      className={`bg-white rounded-2xl shadow-lg border-2 border-dashed overflow-hidden transition-all duration-300 animate-scaleIn ${
                        slotsDisponiveis > 0 
                          ? 'cursor-pointer border-green-300 hover:border-green-500 hover:bg-green-50 group' 
                          : 'cursor-not-allowed border-gray-300 opacity-60'
                      }`}
                    >
                      <div className="p-6 h-full flex flex-col items-center justify-center text-center" style={{ minHeight: '370px' }}>
                        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 ${
                          slotsDisponiveis > 0 ? 'bg-gray-100 group-hover:bg-green-100' : 'bg-gray-200'
                        } transition-colors`}>
                          {processando === 'criar_nova' ? (
                            <Loader2 className="w-8 h-8 text-green-600 animate-spin" />
                          ) : (
                            <Plus className={`w-8 h-8 ${slotsDisponiveis > 0 ? 'text-gray-500 group-hover:text-green-600' : 'text-gray-400'} transition-colors`} />
                          )}
                        </div>
                        <h3 className={`text-lg font-bold text-gray-900 transition-colors ${slotsDisponiveis > 0 ? 'group-hover:text-green-600' : ''}`}>
                          Adicionar Nova Conexão
                        </h3>
                        <p className="text-sm text-gray-600 font-medium mt-1">
                          {slotsDisponiveisMsg}
                        </p>
                        {slotsDisponiveis === 1 && limite.limite >= 1 && (
                          <p className="text-xs text-orange-500 mt-2 font-semibold bg-orange-50 p-1.5 rounded-lg">
                            Slot Baileys (Failover)
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
          {/* Dicas Laterais */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden sticky top-6 animate-slideInRight">
              <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-yellow-50 to-orange-50">
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-yellow-500" />
                  Dicas & Boas Práticas
                </h2>
              </div>

              <div className="p-5 space-y-4">
                <div className="flex items-start gap-3 animate-fadeIn">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center bg-green-100">
                    <Sparkles className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-gray-900 mb-1">Nomeie suas Instâncias</h4>
                    <p className="text-xs text-gray-600 leading-relaxed">Use nomes descritivos como "Vendas", "Suporte" ou "Marketing" para facilitar a identificação.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 animate-fadeIn" style={{ animationDelay: '0.1s' }}>
                  <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center bg-blue-100">
                    <Target className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-gray-900 mb-1">Use Cores Distintas</h4>
                    <p className="text-xs text-gray-600 leading-relaxed">Atribua cores diferentes para cada instância e identifique rapidamente de onde vêm as mensagens.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 animate-fadeIn" style={{ animationDelay: '0.2s' }}>
                  <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center bg-purple-100">
                    <Rocket className="w-5 h-5 text-purple-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-gray-900 mb-1">Mantenha Conectado</h4>
                    <p className="text-xs text-gray-600 leading-relaxed">Instâncias conectadas recebem mensagens em tempo real e mantêm o histórico sincronizado.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 animate-fadeIn" style={{ animationDelay: '0.3s' }}>
                  <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center bg-orange-100">
                    <Activity className="w-5 h-5 text-orange-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-gray-900 mb-1">Monitore Performance</h4>
                    <p className="text-xs text-gray-600 leading-relaxed">Acompanhe as estatísticas de cada instância para otimizar seus atendimentos.</p>
                  </div>
                </div>
              </div>

              <div className="px-5 pb-5">
                <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl p-4 text-white shadow-lg">
                  <div className="flex items-start gap-3">
                    <Zap className="w-6 h-6 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-sm mb-1">Upgrade Disponível!</h4>
                      <p className="text-xs opacity-90">Conecte mais instâncias fazendo upgrade do seu plano.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Nomeação */}
      {modalNomeacao.aberto && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full animate-scaleIn">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Edit3 className="w-6 h-6 text-green-600" />
                  Personalizar
                </h3>
                <button
                  onClick={() => setModalNomeacao({ aberto: false, instancia: null })}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">
                  Nome da Instância
                </label>
                <input
                  type="text"
                  value={nomeInstancia}
                  onChange={(e) => setNomeInstancia(e.target.value)}
                  placeholder="Ex: WhatsApp Vendas"
                  className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent font-medium text-gray-900"
                  maxLength={30}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {nomeInstancia.length}/30 caracteres
                </p>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-900 mb-3">
                  Cor de Identificação
                </label>
                <div className="grid grid-cols-4 gap-3">
                  {coresPredefinidas.map((item) => (
                    <button
                      key={item.cor}
                      onClick={() => setCorInstancia(item.cor)}
                      className={`w-full h-12 rounded-xl transition-all ${
                        corInstancia === item.cor
                          ? 'ring-4 ring-green-500 ring-offset-2 scale-110'
                          : 'hover:scale-105'
                      }`}
                      style={{ backgroundColor: item.cor }}
                      title={item.nome}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex gap-3">
              <button
                onClick={() => setModalNomeacao({ aberto: false, instancia: null })}
                className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={salvarNomeECor}
                className="flex-1 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all"
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Estilos */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Roboto+Flex:wght@400;500;600;700;800&display=swap');

        * {
          font-family: 'Roboto Flex', system-ui, -apple-system, sans-serif;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
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

        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out;
        }

        .animate-scaleIn {
          animation: scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .animate-slideInUp {
          animation: slideInUp 0.5s ease-out;
        }

        .animate-slideInRight {
          animation: slideInRight 0.5s ease-out;
        }
      `}</style>
    </div>
  );
}