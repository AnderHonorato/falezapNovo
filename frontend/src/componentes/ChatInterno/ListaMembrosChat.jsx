// frontend/src/componentes/chatInterno/ListaMembrosChat.jsx

import { useState, useEffect } from 'react';
import { X, MessageSquare, Star, Users, Search, Loader2 } from 'lucide-react';
import { useAuth } from '../../contextos/AuthContext';
import api from '../../servicos/api';
import toast from 'react-hot-toast';
// import StatusIndicador from '../StatusIndicador'; // Componente assumido

// Hierarquia para ordenação
const HIERARQUIA = {
  COLABORADOR: 1,
  ENCARREGADO: 2, 
  ADMIN: 3,
  ADMIN_EMPRESA: 3,
  OWNER: 4,
  SUPORTE: 5 
};

export default function ListaMembrosChat({ onClose, onSelecionarConversa }) {
  const { usuario } = useAuth();
  const [membros, setMembros] = useState([]);
  const [favoritos, setFavoritos] = useState([]);
  const [busca, setBusca] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [abaAtiva, setAbaAtiva] = useState('todos'); // todos, favoritos

  useEffect(() => {
    carregarMembros();
    // A chamada de favoritos será feita em carregarMembros para sincronia
  }, []);
  
  // 🆕 Função que usa o novo endpoint de membros + endpoint de status
  const carregarMembros = async () => {
    setCarregando(true);
    try {
      // 1. Tenta buscar TODOS os membros ativos da conta (NOVO ENDPOINT)
      const [membrosRes, statusRes, favoritosRes] = await Promise.all([
          api.get('/usuarios/equipe-membros').catch(e => {
              console.error("Erro ao buscar /usuarios/equipe-membros:", e.response?.data?.erro || e.message);
              return { data: { membros: [] } };
          }),
          // 2. Puxa status online para cor/presença
          api.get('/status/equipe-online').catch(() => ({ data: { usuarios: [] } })),
          api.get('/chat-interno/favoritos').catch(() => ({ data: { favoritos: [] } }))
      ]);

      const todosMembros = membrosRes.data?.membros || []; 
      const statusOnline = statusRes.data?.usuarios || [];
      const favoritosAtuais = favoritosRes.data?.favoritos || [];

      const statusMap = new Map(statusOnline.map(u => [u.usuarioId, u.status]));

      const membrosCombinados = todosMembros.map(u => ({
          id: u.id, 
          usuarioId: u.id, // Adicionado para padronizar com a lógica de favoritos/conversas
          nome: u.nome || 'Membro Desconhecido',
          email: u.email,
          foto_perfil: u.foto_perfil,
          tipo: u.tipo,
          nickname: u.nickname,
          status: statusMap.get(u.id) || 'offline', 
      }));
      
      const membrosOrdenados = membrosCombinados.sort((a, b) => {
        const hierarquiaA = HIERARQUIA[a.tipo] || HIERARQUIA.COLABORADOR;
        const hierarquiaB = HIERARQUIA[b.tipo] || HIERARQUIA.COLABORADOR;
        
        if (a.status === 'disponivel' && b.status !== 'disponivel') return -1;
        if (a.status !== 'disponivel' && b.status === 'disponivel') return 1;

        if (hierarquiaA > hierarquiaB) return -1;
        if (hierarquiaA < hierarquiaB) return 1;

        return a.nome.localeCompare(b.nome);
      });
      
      setMembros(membrosOrdenados);
      setFavoritos(favoritosAtuais); 
    } catch (error) {
      console.error('Erro geral ao carregar membros e status:', error);
      toast.error('Erro ao carregar membros da equipe.');
    } finally {
      setCarregando(false);
    }
  };


  const carregarFavoritos = async () => {
    try {
      const response = await api.get('/chat-interno/favoritos');
      setFavoritos(response.data.favoritos || []);
    } catch (error) {
      console.error('Erro ao carregar favoritos:', error);
    }
  };

const toggleFavorito = async (membroId, e) => {
    e.stopPropagation();
    const ehFavorito = favoritos.some(f => f.usuarioId === membroId);
    
    try {
      if (ehFavorito) {
        // ✅ CORREÇÃO: Usar a sintaxe correta para DELETE com parâmetro de rota
        await api.delete(`/chat-interno/favoritos/${membroId}`);
      } else {
        // ✅ CORREÇÃO: Usar a sintaxe correta para POST
        await api.post('/chat-interno/favoritos', { usuarioId: membroId });
      }
      toast.success(ehFavorito ? 'Removido dos favoritos' : 'Adicionado aos favoritos');
      carregarMembros(); 
    } catch (error) {
      console.error('Erro ao atualizar favorito:', error);
      // Mantendo o toast de erro para feedback
      toast.error(error.response?.data?.erro || 'Erro ao atualizar favorito');
    }
  };

  const iniciarConversa = (membro) => {
    // ✅ CORREÇÃO APLICADA AQUI: Garantir que o objeto destinatario tenha todos os campos esperados
    onSelecionarConversa({
      tipo: 'individual',
      destinatario: {
         usuarioId: membro.id, // O ID do usuário para o chat é o membro.id
         nome: membro.nome,
         email: membro.email,
         foto_perfil: membro.foto_perfil,
         nickname: membro.nickname
      },
      id: `individual-${membro.id}`
    });
    onClose();
  };

  const membrosFiltrados = membros.filter(m => {
    const matchBusca = !busca || 
      m.nome?.toLowerCase().includes(busca.toLowerCase()) ||
      m.email?.toLowerCase().includes(busca.toLowerCase()) ||
      m.nickname?.toLowerCase().includes(busca.toLowerCase());
    
    if (abaAtiva === 'favoritos') {
      return matchBusca && favoritos.some(f => f.usuarioId === m.id); 
    }
    
    return matchBusca;
  });

  const getStatusLabel = (status) => {
    const labels = {
      disponivel: 'Disponível',
      ausente: 'Ausente',
      almoco: 'Em almoço',
      fora_servico: 'Fora de serviço',
      offline: 'Offline'
    };
    return labels[status] || 'Offline';
  };

  const getRoleTag = (tipo) => {
      if (tipo === 'OWNER') return { text: 'Fundador', color: 'bg-error-container text-on-error-container' };
      if (tipo === 'SUPORTE') return { text: 'Suporte', color: 'bg-secondary-container text-on-secondary-container' };
      if (tipo === 'ADMIN_EMPRESA') return { text: 'Empresário', color: 'bg-tertiary-container text-on-tertiary-container' };
      if (tipo === 'ADMIN') return { text: 'Encarregado', color: 'bg-primary-container text-on-primary-container' };
      return { text: 'Colaborador', color: 'bg-surface-variant text-on-surface-variant' };
  };

  return (
    <div className="fixed inset-0 bg-scrim/60 flex items-center justify-center z-[60] p-4 animate-fadeIn">
      <div className="bg-surface-container rounded-[28px] max-w-2xl w-full shadow-elevation-3 animate-scaleIn max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-primary-container text-on-primary-container px-6 py-5 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center flex-shrink-0 shadow-elevation-1">
              <MessageSquare className="w-6 h-6 text-on-primary" />
            </div>
            <div>
              <h3 className="font-bold text-lg">Nova Conversa Individual</h3>
              <p className="text-xs opacity-90">Selecione um membro da equipe</p>
            </div>
          </div>
          <button onClick={onClose} className="w-9 h-9 hover:bg-on-primary-container/10 rounded-full transition-colors duration-150 flex items-center justify-center">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Abas */}
        <div className="flex border-b border-outline-variant bg-surface-container-high flex-shrink-0">
          <button
            onClick={() => setAbaAtiva('todos')}
            className={`flex-1 px-4 py-3 text-sm font-semibold transition-all ${
              abaAtiva === 'todos'
                ? 'text-primary border-b-2 border-primary bg-primary-container/20'
                : 'text-on-surface-variant hover:bg-surface-variant'
            }`}
          >
            Todos ({membros.length})
          </button>
          <button
            onClick={() => setAbaAtiva('favoritos')}
            className={`flex-1 px-4 py-3 text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
              abaAtiva === 'favoritos'
                ? 'text-primary border-b-2 border-primary bg-primary-container/20'
                : 'text-on-surface-variant hover:bg-surface-variant'
            }`}
          >
            <Star className="w-4 h-4" />
            Favoritos ({favoritos.length})
          </button>
        </div>

        {/* Busca */}
        <div className="px-4 py-3 border-b border-outline-variant bg-surface flex-shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant" />
            <input
              type="text"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar membro..."
              className="w-full pl-10 pr-4 py-2.5 border border-outline rounded-[12px] focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-sm bg-surface-container text-on-surface placeholder-on-surface-variant"
            />
          </div>
        </div>

        {/* Lista de Membros */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
          {carregando ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
          ) : membrosFiltrados.length === 0 ? (
            <div className="text-center py-20">
              <Users className="w-16 h-16 text-on-surface-variant mx-auto mb-3 opacity-50" />
              <p className="text-sm text-on-surface-variant font-medium">
                {busca ? 'Nenhum membro encontrado' : abaAtiva === 'favoritos' ? 'Nenhum favorito adicionado' : 'Nenhum membro disponível'}
              </p>
            </div>
          ) : (
            membrosFiltrados.map((membro) => {
              const ehFavorito = favoritos.some(f => f.usuarioId === membro.id); 
              const roleTag = getRoleTag(membro.tipo);
              
              return (
                <div
                  key={membro.id} 
                  onClick={() => iniciarConversa(membro)}
                  className="bg-surface-container-high rounded-[16px] p-4 hover:shadow-elevation-1 transition-all border border-outline-variant group cursor-pointer hover:scale-[1.01]"
                >
                  <div className="flex items-center gap-4">
                    {/* Avatar com Status */}
                    <div className="relative flex-shrink-0">
                      {membro.foto_perfil ? (
                        <img
                          src={membro.foto_perfil}
                          alt={membro.nome}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-primary-container rounded-full flex items-center justify-center text-on-primary-container text-base font-bold">
                          {membro.nome?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div className="absolute -bottom-1 -right-1">
                        {/* Simulação de StatusIndicador */}
                        <div className={`w-3 h-3 rounded-full border-2 border-surface-container ${
                            membro.status === 'disponivel' ? 'bg-secondary' :
                            membro.status === 'ausente' ? 'bg-tertiary' :
                            membro.status === 'almoco' ? 'bg-tertiary' :
                            membro.status === 'fora_servico' ? 'bg-error' :
                            'bg-on-surface-variant'
                        }`} />
                      </div>
                    </div>

                    {/* Informações */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-sm font-bold text-on-surface truncate">
                          {membro.nome}
                        </h4>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${roleTag.color}`}>
                            {roleTag.text}
                        </span>
                      </div>
                      <p className="text-xs text-on-surface-variant mb-1 truncate">
                        {membro.email || membro.nickname || 'Sem email'}
                      </p>
                      <p className="text-xs text-on-surface-variant flex items-center gap-1">
                        {getStatusLabel(membro.status)}
                      </p>
                    </div>

                    {/* Ações */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => toggleFavorito(membro.id, e)} 
                        className={`p-2 rounded-full transition-all hover:scale-110 ${
                          ehFavorito
                            ? 'bg-secondary-container text-on-secondary-container'
                            : 'bg-surface-container hover:bg-surface-variant text-on-surface-variant opacity-70 group-hover:opacity-100'
                        }`}
                        title={ehFavorito ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
                      >
                        <Star className={`w-4 h-4 ${ehFavorito ? 'fill-current' : ''}`} />
                      </button>
                      <div
                        className="p-2 bg-primary-container text-on-primary-container rounded-full transition-all shadow-sm group-hover:bg-primary group-hover:text-on-primary group-hover:scale-110"
                        title="Iniciar conversa"
                      >
                        <MessageSquare className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-surface-container-highest border-t border-outline-variant flex justify-between items-center flex-shrink-0">
          <p className="text-xs text-on-surface-variant">
            {membrosFiltrados.length} de {membros.length} membros
          </p>
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-primary text-on-primary rounded-full font-semibold hover:shadow-elevation-1 transition-all text-sm hover:scale-[1.02]"
          >
            Fechar
          </button>
        </div>
      </div>

      <style>{`
        @keyframes scaleIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .animate-scaleIn { animation: scaleIn 0.2s cubic-bezier(0.16, 1, 0.3, 1); }
        .animate-fadeIn { animation: fadeIn 0.2s ease-out; }
        
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: var(--md-sys-color-outline-variant); border-radius: 3px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: var(--md-sys-color-outline); }
        
        /* Cores Material Design 3 no contexto do arquivo */
        .text-error { color: #ba1a1a; }
        .bg-error-container { background-color: #ffdad6; }
        .text-on-error-container { color: #410002; }
        .bg-tertiary-container { background-color: #c9e8ff; }
        .text-on-tertiary-container { color: #001e30; }
        .bg-secondary-container { background-color: #d1e8df; }
        .text-on-secondary-container { color: #081f18; }
        .bg-primary-container { background-color: #92f7dc; }
        .text-on-primary-container { color: #00201a; }
        .bg-surface-variant { background-color: #dee4e1; }
        .text-on-surface-variant { color: #434a47; }
        .shadow-elevation-1 { box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.3), 0 1px 3px 1px rgba(0, 0, 0, 0.15); }
      `}</style>
    </div>
  );
}