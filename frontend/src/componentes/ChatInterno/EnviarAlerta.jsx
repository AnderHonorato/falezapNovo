// frontend/src/componentes/chatInterno/EnviarAlerta.jsx

import { useState, useEffect } from 'react';
import { 
  X, Megaphone, Users, Loader2, Send, 
  Sparkles, CheckCircle, Search, ChevronRight 
} from 'lucide-react';
import { useAuth } from '../../contextos/AuthContext';
import api from '../../servicos/api';
import toast from 'react-hot-toast';

const API_URL_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default function EnviarAlerta({ onClose, onEnviar, embedded = false }) {
  const { usuario } = useAuth();
  const [titulo, setTitulo] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [destinatarios, setDestinatarios] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [todosSelecionados, setTodosSelecionados] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [busca, setBusca] = useState('');

  // Carregar usuários
  useEffect(() => {
    let isMounted = true;
    const carregarUsuarios = async () => {
      setCarregando(true);
      try {
        const response = await api.get('/usuarios?status=ATIVO');
        if (!isMounted) return;

        const todosUsuarios = Array.isArray(response.data) ? response.data : response.data?.usuarios || [];
        // Filtra para não enviar para si mesmo
        const usuariosFiltrados = todosUsuarios.filter(
          u => u.id !== usuario?.id && u.contaId === usuario?.contaId
        );
        
        setUsuarios(usuariosFiltrados);
        setDestinatarios(usuariosFiltrados.map(u => u.id)); // Padrão: todos selecionados
        setTodosSelecionados(true);

      } catch (error) {
        console.error('Erro ao carregar usuários:', error);
        toast.error('Não foi possível carregar a lista de usuários.');
      } finally {
        if (isMounted) setCarregando(false);
      }
    };
    carregarUsuarios();
    return () => { isMounted = false };
  }, [usuario?.id, usuario?.contaId]);

  // Lógica de seleção
  const toggleDestinatario = (usuarioId) => {
    setDestinatarios(prev => {
      const selecionado = prev.includes(usuarioId);
      const novaLista = selecionado ? prev.filter(id => id !== usuarioId) : [...prev, usuarioId];
      // Verifica se todos estão selecionados (exceto os filtrados pela busca, mas a lógica ideal é sobre o total)
      setTodosSelecionados(novaLista.length === usuarios.length);
      return novaLista;
    });
  };

  const toggleTodos = () => {
    const novoEstado = !todosSelecionados;
    setDestinatarios(novoEstado ? usuarios.map(u => u.id) : []);
    setTodosSelecionados(novoEstado);
  };

  const usuariosFiltrados = usuarios.filter(u => 
      u.nome?.toLowerCase().includes(busca.toLowerCase()) || 
      u.email?.toLowerCase().includes(busca.toLowerCase())
  );

  // Envio
  const handleEnviar = async (e) => {
    e.preventDefault();
    if (!titulo.trim() || !mensagem.trim()) {
      toast.error('Título e mensagem são obrigatórios.');
      return;
    }
    if (destinatarios.length === 0) {
      toast.error('Selecione ao menos um destinatário.');
      return;
    }

    setEnviando(true);
    try {
      await api.post('/chat-interno/alertas', { titulo, mensagem, destinatarios });
      toast.success('Alerta enviado com sucesso!'); 
      onClose();
      if (onEnviar) onEnviar();
    } catch (error) {
      console.error('Erro ao enviar alerta:', error);
      toast.error(error.response?.data?.erro || 'Falha ao enviar o alerta.');
    } finally {
      setEnviando(false);
    }
  };

  if (embedded) {
    return (
      <div className="embedded-panel bg-white h-full flex flex-col">
        
        {/* HEADER PADRÃO (60px) - Alinhado */}
        <div className="embedded-panel-header bg-white border-b border-gray-100 px-4 flex justify-between items-center shrink-0 z-10 h-[60px]">
           <h3 className="font-bold text-gray-800 flex items-center gap-2 text-sm">
             <Megaphone className="text-red-600" size={20}/>
             Novo Alerta
           </h3>
           <button 
             onClick={onClose} 
             className="p-1.5 hover:bg-gray-100 rounded-full text-gray-500 transition-colors"
           >
             <X size={20}/>
           </button>
        </div>
        
        {/* CONTEÚDO SCROLLÁVEL */}
        <form onSubmit={handleEnviar} className="flex-1 overflow-y-auto custom-scrollbar p-6 flex flex-col gap-6 bg-gray-50/50">
           
           {/* HERO BANNER (Vermelho/Rosa para Alerta) */}
           <div className="relative bg-gradient-to-r from-red-600 to-rose-600 p-5 rounded-2xl shadow-lg shadow-red-500/20 overflow-hidden shrink-0">
               <div className="absolute right-0 top-0 p-4 opacity-10 pointer-events-none">
                  <Megaphone size={80} strokeWidth={1.5} />
               </div>
               <div className="relative z-10">
                   <h3 className="font-bold text-white text-lg flex items-center gap-2">
                     <Sparkles size={18} className="text-yellow-300" /> 
                     Comunicado Importante
                   </h3>
                   <p className="text-red-100 text-xs mt-1.5 leading-relaxed max-w-[90%]">
                     Envie avisos urgentes ou informativos para toda a equipe ou membros específicos.
                   </p>
               </div>
           </div>

           {/* SEÇÃO 1: CONTEÚDO */}
           <div>
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 block ml-1">
                Conteúdo do Alerta
              </label>
              
              <div className="space-y-3">
                  <input
                    type="text"
                    value={titulo}
                    onChange={(e) => setTitulo(e.target.value)}
                    placeholder="Título do Alerta (Ex: Manutenção do Sistema)"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-red-500 focus:ring-4 focus:ring-red-500/10 outline-none text-sm font-bold text-gray-800 placeholder:font-normal transition-all bg-white"
                    required 
                    maxLength={100}
                  />
                  
                  <textarea
                    value={mensagem}
                    onChange={(e) => setMensagem(e.target.value)}
                    placeholder="Digite a mensagem detalhada aqui..."
                    className="w-full p-4 border border-gray-200 rounded-2xl text-sm focus:border-red-500 focus:ring-4 focus:ring-red-500/10 outline-none resize-none bg-white transition-all placeholder:text-gray-300"
                    rows={4} 
                    required 
                    maxLength={500}
                    style={{ minHeight: '100px' }}
                  />
              </div>
           </div>

           {/* SEÇÃO 2: DESTINATÁRIOS */}
           <div className="flex-1 flex flex-col min-h-0">
              <div className="flex items-center justify-between mb-3 ml-1">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                    Quem deve receber?
                  </label>
                  <button
                    type="button"
                    onClick={toggleTodos}
                    disabled={carregando || usuarios.length === 0}
                    className="text-xs font-bold text-red-600 hover:text-red-700 transition-colors disabled:opacity-50 flex items-center gap-1"
                  >
                    {todosSelecionados ? <CheckCircle size={14} className="fill-current"/> : <div className="w-3.5 h-3.5 border-2 border-current rounded-full"/>}
                    {todosSelecionados ? 'Desmarcar Todos' : 'Selecionar Todos'}
                  </button>
              </div>

              {/* Lista de Usuários Estilizada */}
              <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm flex flex-col flex-1 min-h-[200px]">
                 {/* Busca Interna */}
                 <div className="p-3 border-b border-gray-100 bg-gray-50/50">
                    <div className="relative">
                       <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                       <input 
                         type="text" 
                         value={busca}
                         onChange={(e) => setBusca(e.target.value)}
                         placeholder="Buscar na lista..."
                         className="w-full pl-9 pr-4 py-2 text-xs bg-white border border-gray-200 rounded-lg focus:border-red-400 outline-none transition-all"
                       />
                    </div>
                 </div>

                 {carregando ? (
                    <div className="flex-1 flex items-center justify-center">
                       <Loader2 className="w-6 h-6 text-red-500 animate-spin" />
                    </div>
                 ) : usuarios.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-6">
                       <Users className="w-8 h-8 mb-2 opacity-50" />
                       <p className="text-xs">Nenhum usuário disponível.</p>
                    </div>
                 ) : (
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-1">
                        {usuariosFiltrados.map(u => {
                           const isSelected = destinatarios.includes(u.id);
                           return (
                             <label 
                               key={u.id} 
                               className={`flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition-all ${
                                   isSelected 
                                   ? 'bg-red-50 border border-red-100' 
                                   : 'hover:bg-gray-50 border border-transparent'
                               }`}
                             >
                                <div className="relative">
                                    <input
                                      type="checkbox"
                                      checked={isSelected}
                                      onChange={() => toggleDestinatario(u.id)}
                                      className="peer sr-only"
                                    />
                                    <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                                        isSelected 
                                        ? 'bg-red-500 border-red-500 text-white' 
                                        : 'border-gray-300 bg-white'
                                    }`}>
                                        <CheckCircle size={12} className={isSelected ? 'block' : 'hidden'} fill="white" color="transparent"/>
                                    </div>
                                </div>
                                
                                <div className="w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center font-bold text-xs flex-shrink-0 border border-red-50 overflow-hidden">
                                  {u.foto_perfil ? (
                                    <img src={`${API_URL_BASE}/uploads/avatars/${u.foto_perfil}`} alt={u.nome} className="w-full h-full object-cover"/>
                                  ) : (
                                    u.nome?.charAt(0)?.toUpperCase()
                                  )}
                                </div>
                                
                                <div className="flex-1 min-w-0">
                                  <p className={`text-xs font-bold truncate ${isSelected ? 'text-red-900' : 'text-gray-700'}`}>
                                      {u.nome}
                                  </p>
                                  <p className="text-[10px] text-gray-400 truncate">{u.email}</p>
                                </div>
                             </label>
                           );
                        })}
                        {usuariosFiltrados.length === 0 && (
                            <p className="text-xs text-center py-4 text-gray-400">Ninguém encontrado.</p>
                        )}
                    </div>
                 )}
                 
                 {/* Contador no rodapé da lista */}
                 <div className="bg-gray-50 px-3 py-2 border-t border-gray-100 flex justify-between items-center text-[10px] text-gray-500 font-medium">
                     <span>{destinatarios.length} selecionados</span>
                     <span>Total: {usuarios.length}</span>
                 </div>
              </div>
           </div>
        </form>

        {/* FOOTER FIXO */}
        <div className="p-4 bg-white border-t border-gray-100 shrink-0">
           <button
              onClick={handleEnviar}
              disabled={enviando || !titulo.trim() || !mensagem.trim() || destinatarios.length === 0}
              className="w-full py-3.5 bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-xl font-bold hover:shadow-lg hover:shadow-red-200 hover:-translate-y-0.5 transition-all flex justify-center items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none text-sm tracking-wide"
            >
              {enviando ? (
                  <>
                    <Loader2 className="animate-spin w-5 h-5" />
                    <span>Enviando...</span>
                  </>
              ) : (
                  <>
                    <Megaphone className="w-4 h-4" />
                    <span>Enviar Alerta</span>
                  </>
              )}
            </button>
        </div>
      </div>
    );
  }

  // Fallback Modal (se não for embedded)
  return <div/>;
}