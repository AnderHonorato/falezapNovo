// frontend/src/componentes/ChatInterno/SolicitarAjuda.jsx

import { useState } from 'react';
import { 
  X, HelpCircle, Loader2, Wrench, FileQuestion, 
  ShieldAlert, LifeBuoy, ChevronRight, Sparkles, CheckCircle 
} from 'lucide-react';
import { useAuth } from '../../contextos/AuthContext';
import { useChat } from '../../contextos/ChatContext';
import api from '../../servicos/api';
import toast from 'react-hot-toast';

export default function SolicitarAjuda({ onClose, onEnviar, embedded = false }) {
  const { setAberto, selecionarConversa } = useChat();
  const [tipo, setTipo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [enviando, setEnviando] = useState(false);

  const tiposAjuda = [
    { 
        id: 'tecnico', 
        nome: 'Técnico', 
        icone: Wrench, 
        activeClass: 'border-red-500 bg-red-50 ring-1 ring-red-500',
        iconColor: 'text-red-600',
        bgIcon: 'bg-red-100',
        desc: 'Falhas, erros ou lentidão.' 
    },
    { 
        id: 'duvida', 
        nome: 'Dúvidas', 
        icone: HelpCircle, 
        activeClass: 'border-blue-500 bg-blue-50 ring-1 ring-blue-500',
        iconColor: 'text-blue-600',
        bgIcon: 'bg-blue-100',
        desc: 'Como usar o sistema.' 
    },
    { 
        id: 'acesso', 
        nome: 'Acesso', 
        icone: ShieldAlert, 
        activeClass: 'border-orange-500 bg-orange-50 ring-1 ring-orange-500',
        iconColor: 'text-orange-600',
        bgIcon: 'bg-orange-100',
        desc: 'Login, senha ou permissão.' 
    },
    { 
        id: 'sugestao', 
        nome: 'Outros', 
        icone: FileQuestion, 
        activeClass: 'border-purple-500 bg-purple-50 ring-1 ring-purple-500',
        iconColor: 'text-purple-600',
        bgIcon: 'bg-purple-100',
        desc: 'Sugestões ou diversos.' 
    }
  ];

  const handleEnviar = async (e) => {
    e.preventDefault();
    if (!tipo || !descricao.trim()) { toast.error('Preencha os campos obrigatórios'); return; }
    setEnviando(true);
    try {
      // ✅ Envio normal (sem a flag 'solicitadoVia')
      const response = await api.post('/chat-interno/solicitacoes-ajuda', { tipo, descricao: descricao.trim() });
      const { protocolo, solicitacao } = response.data;
      toast.success(`Solicitação enviada!`);
      onClose();
      if(!embedded) {
          setTimeout(() => { 
            setAberto(true); 
            // ✅ CORRIGIDO: Passa o objeto solicitacao completo
            selecionarConversa({ 
                tipo: 'suporte', 
                solicitacao, 
                protocolo, 
                id: `suporte-${solicitacao.id}` 
            }); 
          }, 300);
      }
      if (onEnviar) onEnviar();
    } catch (error) { toast.error('Erro ao enviar'); } 
    finally { setEnviando(false); }
  };

  const tipoSelecionadoInfo = tiposAjuda.find(t => t.id === tipo);

  if (embedded) {
    return (
      <div className="embedded-panel bg-white h-full flex flex-col">
        
        {/* HEADER PADRÃO (60px) */}
        <div className="embedded-panel-header bg-white border-b border-gray-100 px-4 flex justify-between items-center shrink-0 z-10 h-[60px]">
           <h3 className="font-bold text-gray-800 flex items-center gap-2 text-sm">
             <LifeBuoy className="text-blue-600" size={20}/> 
             Suporte
           </h3>
           <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-full text-gray-500 transition-colors">
             <X size={20}/>
           </button>
        </div>
        
        {/* CONTEÚDO SCROLLÁVEL */}
        <form onSubmit={handleEnviar} className="flex-1 overflow-y-auto custom-scrollbar p-6 flex flex-col gap-6 bg-gray-50/50">
           
           {/* HERO BANNER (Azul/Indigo) */}
           <div className="relative bg-gradient-to-r from-blue-600 to-indigo-600 p-5 rounded-2xl shadow-lg shadow-blue-500/20 overflow-hidden shrink-0">
               <div className="absolute right-0 top-0 p-4 opacity-10 pointer-events-none">
                  <LifeBuoy size={80} strokeWidth={1.5} />
               </div>
               <div className="relative z-10">
                   <h3 className="font-bold text-white text-lg flex items-center gap-2">
                     <Sparkles size={18} className="text-yellow-300" /> 
                     Como podemos ajudar?
                   </h3>
                   <p className="text-blue-100 text-xs mt-1.5 leading-relaxed max-w-[90%]">
                     Abra um chamado para nossa equipe técnica ou tire suas dúvidas sobre o sistema.
                   </p>
               </div>
           </div>

           {/* SEÇÃO 1: CATEGORIA */}
           <div>
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 block ml-1">
                Categoria do chamado
              </label>
              
              <div className="grid grid-cols-2 gap-3">
                 {tiposAjuda.map(t => {
                    const isSelected = tipo === t.id;
                    return (
                        <button 
                           key={t.id} 
                           type="button" 
                           onClick={() => setTipo(t.id)}
                           className={`relative group flex flex-col items-center justify-center p-4 rounded-2xl border transition-all duration-300 ease-out bg-white ${
                               isSelected 
                               ? `${t.activeClass} shadow-md scale-[1.02]` 
                               : 'border-gray-200 hover:border-blue-300 hover:shadow-lg hover:shadow-blue-500/5'
                           }`}
                        >
                           <div className={`p-2.5 rounded-xl mb-2 transition-colors duration-300 ${isSelected ? t.bgIcon : 'bg-gray-50 group-hover:bg-blue-50'}`}>
                               <t.icone size={22} className={isSelected ? t.iconColor : 'text-gray-400 group-hover:text-blue-500'} />
                           </div>
                           <span className={`text-xs font-bold transition-colors ${isSelected ? 'text-gray-800' : 'text-gray-500 group-hover:text-gray-700'}`}>
                               {t.nome}
                           </span>
                           
                           {isSelected && (
                             <div className="absolute top-2 right-2">
                                <CheckCircle size={14} className="text-blue-500 fill-blue-50"/>
                             </div>
                           )}
                        </button>
                    );
                 })}
              </div>
              
              {/* Descrição Dinâmica */}
              <div className="mt-3 min-h-[24px] px-1">
                  {tipoSelecionadoInfo ? (
                      <div className="flex items-center gap-2 text-xs text-blue-700 bg-blue-50 px-3 py-1.5 rounded-lg animate-fadeIn inline-flex border border-blue-100">
                          <span className="font-bold">Info:</span> {tipoSelecionadoInfo.desc}
                      </div>
                  ) : (
                      <span className="text-xs text-gray-400 italic pl-1 flex items-center gap-1">
                         Selecione uma opção acima
                      </span>
                  )}
              </div>
           </div>

           {/* SEÇÃO 2: DESCRIÇÃO */}
           <div className="flex-1 flex flex-col min-h-0">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 block ml-1">
                Detalhes do problema
              </label>
              <textarea 
                value={descricao} 
                onChange={e => setDescricao(e.target.value)} 
                className="flex-1 w-full p-4 border border-gray-200 rounded-2xl text-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none resize-none bg-white shadow-sm transition-all placeholder:text-gray-300"
                placeholder="Descreva o que está acontecendo..."
                style={{ minHeight: '120px' }}
              />
           </div>
        </form>

        {/* FOOTER FIXO */}
        <div className="p-4 bg-white border-t border-gray-100 shrink-0">
           <button 
             onClick={handleEnviar}
             disabled={enviando} 
             className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold hover:shadow-lg hover:shadow-blue-200 hover:-translate-y-0.5 transition-all flex justify-center items-center gap-2 disabled:opacity-70 disabled:hover:translate-y-0 disabled:hover:shadow-none text-sm tracking-wide"
           >
              {enviando ? (
                  <>
                    <Loader2 className="animate-spin w-5 h-5"/>
                    <span>Criando Chamado...</span>
                  </>
              ) : (
                  <>
                    <span>Enviar Solicitação</span>
                    <ChevronRight className="w-4 h-4 opacity-80" />
                  </>
              )}
           </button>
        </div>
      </div>
    );
  }

  // Fallback Modal
  return <div/>;
}