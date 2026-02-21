// frontend/src/componentes/ChatInterno/ListaConversas.jsx

import { useState, useEffect, useMemo } from 'react';
import { Search, Loader2, Users, CheckCheck, Pin, Trash2, Mail, Filter } from 'lucide-react';
import { useAuth } from '../../contextos/AuthContext';
import api from '../../servicos/api';
import toast from 'react-hot-toast';
import { format, isToday, isYesterday } from 'date-fns';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const extrairNomeArquivo = (caminho) => {
  if (!caminho) return null;
  return caminho.replace(/^(https?:\/\/[^\/]+)?\/uploads\/grupos\//, '').split('/').pop();
};

const formatarData = (dataIso) => {
    if (!dataIso) return '';
    const data = new Date(dataIso);
    if (isToday(data)) return format(data, 'HH:mm');
    if (isYesterday(data)) return 'Ontem';
    return format(data, 'dd/MM/yyyy');
};

export default function ListaConversas({ 
  abaAtivaExterna, 
  onSelecionarConversa, 
  statusMap = {},
  socket 
}) {
  const { usuario } = useAuth();
  const [listaUnificada, setListaUnificada] = useState([]);
  const [busca, setBusca] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [filtroPill, setFiltroPill] = useState('todos'); // todos, naolidas, favoritas, grupos
  const [menuContexto, setMenuContexto] = useState({ visivel: false, x: 0, y: 0, item: null });

  useEffect(() => {
    carregarDados();
  }, [abaAtivaExterna]);

  useEffect(() => {
    const handleClick = () => setMenuContexto({ ...menuContexto, visivel: false });
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  const carregarDados = async () => {
    setCarregando(true);
    try {
      if (abaAtivaExterna === 'conversas') {
        // ✅ CARREGA CONVERSAS E GRUPOS SIMULTANEAMENTE
        const [resConversas, resGrupos] = await Promise.all([
            api.get('/chat-interno/conversas').catch(() => ({ data: { conversas: [] } })),
            api.get('/chat-interno/grupos').catch(() => ({ data: { grupos: [] } }))
        ]);

        const individuais = (resConversas.data.conversas || []).map(c => ({ ...c, tipoObj: 'individual' }));
        const grupos = (resGrupos.data.grupos || []).map(g => ({ ...g, tipoObj: 'grupo', fixada: false })); // Grupos geralmente não tem flag fixada no backend atual, assumindo false ou ajustando conforme necessario

        // Unifica e Ordena por data da última mensagem
        const unificados = [...individuais, ...grupos].sort((a, b) => {
            if (a.fixada && !b.fixada) return -1;
            if (!a.fixada && b.fixada) return 1;
            
            const dataA = new Date(a.ultimaMensagemEm || a.criadaEm || 0);
            const dataB = new Date(b.ultimaMensagemEm || b.criadaEm || 0);
            return dataB - dataA;
        });

        setListaUnificada(unificados);

      } else if (abaAtivaExterna === 'suporte') {
        const isSuporte = ['OWNER', 'SUPORTE'].includes(usuario.tipo);
        const res = await api.get(isSuporte ? '/suporte/solicitacoes?status=TODOS' : '/suporte/minhas-solicitacoes');
        const solicitacoesFormatadas = (res.data.solicitacoes || []).map(s => ({
             ...s, 
             id: s.id, 
             nome: s.protocolo,
             ultimaMensagemEm: s.atualizadaEm || s.criadaEm,
             tipoObj: 'suporte',
             naoLidas: s.status === 'PENDENTE' && s.solicitanteId !== usuario.id ? 1 : 0 
        }));
        setListaUnificada(solicitacoesFormatadas);
      }
    } catch (error) { console.error(error); } finally { setCarregando(false); }
  };

  // ✅ FILTRAGEM VIA FRONTEND (PILLS)
  const listaFiltrada = useMemo(() => {
      let dados = listaUnificada;

      // 1. Filtro de Pílulas
      if (filtroPill === 'naolidas') dados = dados.filter(i => i.naoLidas > 0);
      else if (filtroPill === 'favoritas') dados = dados.filter(i => i.fixada);
      else if (filtroPill === 'grupos') dados = dados.filter(i => i.tipoObj === 'grupo');

      // 2. Filtro de Busca
      if (busca) {
          const termo = busca.toLowerCase();
          dados = dados.filter(i => (i.nome || i.protocolo || '').toLowerCase().includes(termo));
      }

      return dados;
  }, [listaUnificada, filtroPill, busca]);

  // Socket Logic (simplificado para atualização de estado local)
  useEffect(() => {
      if (!socket || abaAtivaExterna !== 'conversas') return;
      
      const handleNovaMensagem = ({ mensagem }) => {
          carregarDados(); // Recarrega para garantir ordem e contadores corretos
      };
      
      const handleLida = () => carregarDados();

      socket.on('chat_interno_nova_mensagem', handleNovaMensagem);
      socket.on('chat_interno_conversa_lida', handleLida);
      return () => {
          socket.off('chat_interno_nova_mensagem', handleNovaMensagem);
          socket.off('chat_interno_conversa_lida', handleLida);
      };
  }, [socket, abaAtivaExterna]);

  const handleContextMenu = (e, item) => {
      e.preventDefault();
      if (item.tipoObj !== 'individual') return; // Menu apenas para individuais por enquanto
      setMenuContexto({ visivel: true, x: e.clientX, y: e.clientY, item });
  };

  const handleAcaoMenu = async (acao, item) => {
      setMenuContexto({ ...menuContexto, visivel: false });
      try {
          if (acao === 'fixar') {
             if (item.fixada) await api.delete(`/chat-interno/favoritos/${item.usuarioId}`);
             else await api.post('/chat-interno/favoritos', { usuarioId: item.usuarioId });
             toast.success(item.fixada ? 'Conversa desafixada' : 'Conversa fixada');
             carregarDados();
          }
          if (acao === 'nao_lida') {
             await api.post(`/chat-interno/conversas/${item.usuarioId}/nao-lida`);
             toast.success('Marcada como não lida');
             carregarDados();
          }
          if (acao === 'limpar') {
              if(window.confirm('Apagar histórico local?')) {
                  await api.delete('/chat-interno/limpar-chat', { data: { usuarioId: item.usuarioId }}); 
                  carregarDados();
              }
          }
      } catch (e) { toast.error('Erro na ação'); }
  };

  const renderChecks = (msg) => {
      if (!msg || msg.remetenteId !== usuario.id) return null;
      if (msg.status === 'lida') return <CheckCheck size={14} className="text-blue-500" />;
      return <CheckCheck size={14} className="text-gray-400" />;
  };

  return (
    <div className="flex flex-col h-full bg-white relative">
      {/* HEADER DE BUSCA E FILTROS */}
      <div className="p-3 border-b border-gray-100 flex-shrink-0 bg-white sticky top-0 z-10">
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar..." className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500 transition-all"/>
        </div>
        
        {abaAtivaExterna === 'conversas' && (
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                {[
                    { id: 'todos', label: 'Todos' },
                    { id: 'naolidas', label: 'Não lidas' },
                    { id: 'favoritas', label: 'Favoritas' },
                    { id: 'grupos', label: 'Grupos' }
                ].map(p => (
                    <button 
                        key={p.id}
                        onClick={() => setFiltroPill(p.id)}
                        className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors border ${
                            filtroPill === p.id 
                            ? 'bg-indigo-100 text-indigo-700 border-indigo-200' 
                            : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                        }`}
                    >
                        {p.label}
                    </button>
                ))}
            </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
        {carregando ? <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-indigo-500" /></div> : listaFiltrada.length === 0 ? <div className="text-center py-10 text-gray-400 text-sm">Nenhum resultado</div> : 
          <div className="space-y-1">
            {listaFiltrada.map((item, idx) => {
              // RENDERIZAÇÃO INDIVIDUAL
              if (item.tipoObj === 'individual') {
                const status = statusMap[item.usuarioId] || item.status || 'offline';
                const isOnline = status === 'disponivel';
                const ultimaMsg = item.ultimaMensagem;
                const conteudoPreview = ultimaMsg ? (ultimaMsg.tipo === 'texto' ? ultimaMsg.conteudo : `📷 ${ultimaMsg.tipo}`) : 'Nova conversa';
                
                return (
                  <div key={`ind-${item.usuarioId}`} onClick={() => onSelecionarConversa({ tipo: 'individual', destinatario: item, id: `individual-${item.usuarioId}` })} onContextMenu={(e) => handleContextMenu(e, item)} className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors group relative ${item.fixada ? 'bg-gray-50' : 'hover:bg-gray-50'}`}>
                    <div className="relative w-12 h-12 flex-shrink-0">
                       {item.foto_perfil ? <img src={`${API_URL}/uploads/avatars/${item.foto_perfil}`} className="w-full h-full rounded-full object-cover"/> : <div className="w-full h-full rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-sm">{item.nome?.[0]}</div>}
                       <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${isOnline ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                    </div>
                    <div className="flex-1 min-w-0">
                       <div className="flex justify-between items-center mb-0.5"><h4 className="text-sm font-bold text-gray-800 truncate">{item.nome}</h4>{ultimaMsg && <span className="text-[10px] text-gray-400">{formatarData(ultimaMsg.data)}</span>}</div>
                       <div className="flex justify-between items-center"><p className="text-xs text-gray-500 truncate flex items-center gap-1 max-w-[80%]">{renderChecks(ultimaMsg)}{conteudoPreview}</p><div className="flex items-center gap-1">{item.fixada && <Pin size={12} className="text-gray-400 transform rotate-45" />}{item.naoLidas > 0 && <span className="min-w-[18px] h-[18px] flex items-center justify-center bg-green-500 text-white text-[10px] font-bold rounded-full px-1">{item.naoLidas}</span>}</div></div>
                    </div>
                  </div>
                );
              }
              // RENDERIZAÇÃO GRUPO
              if (item.tipoObj === 'grupo') {
                  const imgGrupo = extrairNomeArquivo(item.imagem);
                  const ultimaMsg = item.ultimaMensagem;
                  const conteudoPreview = ultimaMsg ? `${ultimaMsg.remetenteId === usuario.id ? 'Você' : 'Alguém'}: ${ultimaMsg.tipo === 'texto' ? ultimaMsg.conteudo : 'Mídia'}` : 'Grupo criado';
                  return (
                      <div key={`grp-${item.id}`} onClick={() => onSelecionarConversa({ tipo: 'grupo', grupo: item, id: `grupo-${item.id}` })} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                        <div className="w-12 h-12 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-bold flex-shrink-0 overflow-hidden border border-purple-50">{imgGrupo ? <img src={`${API_URL}/uploads/grupos/${imgGrupo}`} className="w-full h-full object-cover"/> : <Users size={20}/>}</div>
                        <div className="flex-1 min-w-0">
                           <div className="flex justify-between items-center mb-0.5"><h4 className="text-sm font-bold text-gray-800 truncate">{item.nome}</h4>{ultimaMsg && <span className="text-[10px] text-gray-400">{formatarData(ultimaMsg.data)}</span>}</div>
                           <div className="flex justify-between items-center"><p className="text-xs text-gray-500 truncate w-full pr-2 max-w-[85%]">{conteudoPreview}</p>{item.naoLidas > 0 && <span className="min-w-[18px] h-[18px] flex items-center justify-center bg-green-500 text-white text-[10px] font-bold rounded-full px-1 flex-shrink-0">{item.naoLidas}</span>}</div>
                        </div>
                      </div>
                  );
              }
              // RENDERIZAÇÃO SUPORTE
              if (item.tipoObj === 'suporte') {
                const statusColor = item.status === 'PENDENTE' ? 'text-yellow-600 bg-yellow-50' : 'text-green-600';
                return (
                  <div key={`sup-${item.id}`} onClick={() => onSelecionarConversa({ tipo: 'suporte', solicitacao: item, protocolo: item.protocolo, id: `suporte-${item.id}` })} className="p-3 rounded-lg border border-gray-100 hover:bg-gray-50 cursor-pointer transition-all mb-2">
                    <div className="flex justify-between items-start mb-1"><span className="text-xs font-bold text-gray-700">{item.protocolo}</span><span className={`text-[10px] font-bold ${statusColor}`}>{item.status}</span></div>
                    <p className="text-xs text-gray-600 line-clamp-1">{item.descricao}</p>
                  </div>
                );
              }
              return null;
            })}
          </div>
        }
      </div>
      {menuContexto.visivel && <div className="fixed bg-white rounded-lg shadow-xl border border-gray-100 py-1 z-[100] w-48 animate-fadeIn" style={{ top: menuContexto.y, left: menuContexto.x }} onClick={(e) => e.stopPropagation()}><button onClick={() => handleAcaoMenu('nao_lida', menuContexto.item)} className="w-full text-left px-4 py-2.5 text-xs hover:bg-gray-50 flex items-center gap-2 text-gray-700"><Mail size={14}/> Marcar como não lida</button><button onClick={() => handleAcaoMenu('fixar', menuContexto.item)} className="w-full text-left px-4 py-2.5 text-xs hover:bg-gray-50 flex items-center gap-2 text-gray-700"><Pin size={14}/> {menuContexto.item.fixada ? 'Desafixar conversa' : 'Fixar conversa'}</button><div className="h-px bg-gray-100 my-1"/><button onClick={() => handleAcaoMenu('limpar', menuContexto.item)} className="w-full text-left px-4 py-2.5 text-xs hover:bg-red-50 flex items-center gap-2 text-red-600"><Trash2 size={14}/> Apagar conversa</button></div>}
    </div>
  );
}