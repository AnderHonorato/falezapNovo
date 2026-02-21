import { useState, useEffect } from 'react';
import { 
  Clock, Coffee, Moon, Settings, X, Loader2, HelpCircle, 
  ChevronDown, CheckCircle2, Disc, Zap, Save 
} from 'lucide-react';
import api from '../servicos/api';
import { useAuth } from '../contextos/AuthContext';
import toast from 'react-hot-toast';

export default function SeletorStatus({ statusAtual, onMudarStatus }) {
  const { usuario } = useAuth();
  
  // Estados
  const [mostrarConfig, setMostrarConfig] = useState(false);
  const [salvandoConfig, setSalvandoConfig] = useState(false);
  const [carregandoConfig, setCarregandoConfig] = useState(false);
  const [mostrarInfo, setMostrarInfo] = useState(false);

  // Estado Inicial contendo AMBOS: Almoço e Trabalho (Expediente)
  const [horarios, setHorarios] = useState({
    horarioAlmoco: { inicio: '12:00', fim: '13:00', ativo: false },
    horarioTrabalho: { inicio: '08:00', fim: '18:00', ativo: false }
  });

  const opcoesStatus = [
    { 
      valor: 'disponivel', label: 'Disponível', icon: CheckCircle2, 
      color: 'text-emerald-500', 
      glow: 'shadow-[0_0_15px_-3px_rgba(16,185,129,0.4)]', 
      bgActive: 'bg-emerald-50 dark:bg-emerald-900/20'
    },
    { 
      valor: 'ausente', label: 'Ausente', icon: Clock, 
      color: 'text-amber-500', 
      glow: 'shadow-[0_0_15px_-3px_rgba(245,158,11,0.4)]', 
      bgActive: 'bg-amber-50 dark:bg-amber-900/20'
    },
    { 
      valor: 'almoco', label: 'Almoço', icon: Coffee, 
      color: 'text-orange-500', 
      glow: 'shadow-[0_0_15px_-3px_rgba(249,115,22,0.4)]', 
      bgActive: 'bg-orange-50 dark:bg-orange-900/20'
    },
    { 
      valor: 'reuniao', label: 'Reunião', icon: Disc, 
      color: 'text-blue-500', 
      glow: 'shadow-[0_0_15px_-3px_rgba(59,130,246,0.4)]', 
      bgActive: 'bg-blue-50 dark:bg-blue-900/20'
    },
    { 
      valor: 'offline', label: 'Invisível', icon: Moon, 
      color: 'text-slate-400', 
      glow: 'shadow-none', 
      bgActive: 'bg-slate-100 dark:bg-slate-800'
    },
  ];

  // Bloqueia scroll ao abrir modal
  useEffect(() => {
    if (mostrarConfig) { document.body.style.overflow = 'hidden'; } else { document.body.style.overflow = 'unset'; }
    return () => { document.body.style.overflow = 'unset'; };
  }, [mostrarConfig]);

  // Carrega configurações ao abrir
  useEffect(() => {
    const carregar = async () => {
        if (mostrarConfig && usuario?.id) {
            setCarregandoConfig(true);
            try {
                const res = await api.get(`/status/${usuario.id}`);
                const conf = res.data.configuracao;
                
                if (conf) {
                    setHorarios({
                        horarioAlmoco: { 
                            inicio: conf.horarioAlmoco?.inicio || '12:00', 
                            fim: conf.horarioAlmoco?.fim || '13:00', 
                            ativo: !!conf.horarioAlmoco 
                        },
                        horarioTrabalho: {
                            inicio: conf.horarioTrabalho?.inicio || '08:00',
                            fim: conf.horarioTrabalho?.fim || '18:00',
                            ativo: !!conf.horarioTrabalho
                        }
                    });
                }
            } catch (e) { 
                console.error(e);
                toast.error("Erro ao carregar configurações."); 
            } finally { 
                setCarregandoConfig(false); 
            }
        }
    };
    carregar();
  }, [mostrarConfig, usuario?.id]);

  const handleSalvar = async () => {
    setSalvandoConfig(true);
    try {
      const payload = {}; 
      const validarHora = (hora) => /^(?:[01]\d|2[0-3]):(?:[0-5]\d)$/.test(hora);

      // --- ALMOÇO ---
      if (horarios.horarioAlmoco.ativo) {
          if (!validarHora(horarios.horarioAlmoco.inicio) || !validarHora(horarios.horarioAlmoco.fim)) {
             toast.error("Horários de almoço inválidos.");
             setSalvandoConfig(false);
             return;
          }
          payload.horarioAlmoco = { inicio: horarios.horarioAlmoco.inicio, fim: horarios.horarioAlmoco.fim };
      } else {
          payload.horarioAlmoco = null;
      }

      // --- EXPEDIENTE (FORA DE SERVIÇO) ---
      if (horarios.horarioTrabalho.ativo) {
        if (!validarHora(horarios.horarioTrabalho.inicio) || !validarHora(horarios.horarioTrabalho.fim)) {
           toast.error("Horários de expediente inválidos.");
           setSalvandoConfig(false);
           return;
        }
        payload.horarioTrabalho = { inicio: horarios.horarioTrabalho.inicio, fim: horarios.horarioTrabalho.fim };
      } else {
        payload.horarioTrabalho = null;
      }

      await api.post(`/status/${usuario.id}/configurar-horarios`, payload);
      setMostrarConfig(false);
      toast.success('Configurações salvas!');
    } catch (e) { 
        toast.error('Erro ao salvar.'); 
    } finally { 
        setSalvandoConfig(false); 
    }
  };

  return (
    <div className="w-full">
      
      {/* BARRA DE ÍCONES (DOCK) - Visual Original Mantido */}
      <div className="flex items-center bg-white dark:bg-slate-800 p-1.5 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm relative">
        
        <div className="flex justify-between items-center flex-1 gap-1">
          {opcoesStatus.map((opcao) => {
            const Icon = opcao.icon;
            const isAtivo = statusAtual === opcao.valor;
            
            return (
              <button
                key={opcao.valor}
                onClick={() => onMudarStatus && onMudarStatus(opcao.valor)}
                disabled={statusAtual === 'carregando'}
                title={opcao.label}
                className={`
                  relative group flex items-center justify-center w-9 h-9 rounded-xl transition-all duration-300 ease-out
                  ${isAtivo 
                    ? `${opcao.bgActive} ${opcao.glow} scale-100 z-10` 
                    : 'hover:bg-gray-50 dark:hover:bg-slate-700 hover:scale-110 text-gray-400 dark:text-gray-500'
                  }
                `}
              >
                <Icon 
                  className={`w-4 h-4 transition-colors duration-300 ${isAtivo ? opcao.color : 'group-hover:text-gray-600 dark:group-hover:text-gray-300'}`} 
                  strokeWidth={isAtivo ? 2.5 : 2}
                />
                
                {/* Tooltip */}
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] py-1.5 px-2.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none whitespace-nowrap shadow-xl transform translate-y-1 group-hover:translate-y-0 font-bold z-20">
                  {opcao.label}
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45"></div>
                </div>

                {isAtivo && (
                   <span className={`absolute -bottom-1 w-1 h-1 rounded-full ${opcao.color.replace('text-', 'bg-')}`}></span>
                )}
              </button>
            );
          })}
        </div>

        <div className="w-px h-6 bg-gray-200 dark:bg-slate-600 mx-2"></div>

        {/* Botão Configuração */}
        <button 
          onClick={() => setMostrarConfig(true)}
          className="w-9 h-9 flex items-center justify-center rounded-xl text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all duration-300 group"
          title="Automação de Status"
        >
           <Settings className="w-4 h-4 group-hover:rotate-90 transition-transform duration-500" strokeWidth={2} />
        </button>

      </div>

      {/* DRAWER DE CONFIGURAÇÃO */}
      {mostrarConfig && (
        <>
            <div className="fixed inset-0 z-[250] bg-black/20 backdrop-blur-[2px] transition-opacity" onClick={() => setMostrarConfig(false)} />
            
            <div className="fixed top-0 right-0 h-full w-full sm:w-[380px] z-[260] bg-[#f8f9fa] dark:bg-[#0f172a] shadow-2xl border-l border-gray-200 dark:border-gray-800 flex flex-col animate-slide-in-right font-sans">
                
                {/* Header */}
                <div className="flex-shrink-0 px-5 py-3 bg-white dark:bg-[#1e293b] border-b border-gray-200 dark:border-gray-700 flex items-center justify-between shadow-sm z-20">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600"><Zap className="w-4 h-4" /></div>
                        <h2 className="text-base font-bold text-gray-800 dark:text-white">Status Automático</h2>
                    </div>
                    <button onClick={() => setMostrarConfig(false)} className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-500"><X className="w-4 h-4" /></button>
                </div>

                {/* Conteúdo */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-4">
                    {carregandoConfig ? (
                        <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
                    ) : (
                        <>
                            {/* Explicação */}
                            <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800 rounded-lg overflow-hidden">
                                <button onClick={() => setMostrarInfo(!mostrarInfo)} className="w-full flex items-center justify-between p-3 text-left">
                                    <span className="text-xs font-bold text-blue-700 dark:text-blue-300 flex items-center gap-2"><HelpCircle className="w-3.5 h-3.5"/> Como funciona?</span>
                                    <ChevronDown className={`w-3.5 h-3.5 text-blue-500 transition-transform ${mostrarInfo ? 'rotate-180' : ''}`} />
                                </button>
                                {mostrarInfo && (
                                    <div className="px-3 pb-3 text-[10px] text-blue-800 dark:text-blue-200 opacity-80 border-t border-blue-200 dark:border-blue-800/30 pt-2">
                                        <p>O sistema altera seu status automaticamente:</p>
                                        <ul className="list-disc pl-4 mt-1 space-y-0.5">
                                            <li><strong>Almoço:</strong> Status "Almoço".</li>
                                            <li><strong>Expediente:</strong> Status "Invisível" fora do horário.</li>
                                        </ul>
                                    </div>
                                )}
                            </div>

                            {/* Card Almoço */}
                            {horarios?.horarioAlmoco && (
                                <div className={`bg-white dark:bg-[#1e293b] p-4 rounded-lg border shadow-sm transition-all ${horarios.horarioAlmoco.ativo ? 'border-orange-200 dark:border-orange-900/50' : 'border-gray-200 dark:border-gray-700'}`}>
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-lg ${horarios.horarioAlmoco.ativo ? 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400' : 'bg-gray-100 text-gray-400 dark:bg-gray-800'}`}>
                                                <Coffee className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-sm text-gray-800 dark:text-gray-200">Horário de Almoço</h4>
                                                <p className="text-[10px] text-gray-500 dark:text-gray-400">Ativa o status "Em almoço"</p>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => setHorarios(prev => ({ ...prev, horarioAlmoco: { ...prev.horarioAlmoco, ativo: !prev.horarioAlmoco.ativo } }))}
                                            className={`w-10 h-5 rounded-full transition-colors relative ${horarios.horarioAlmoco.ativo ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`}
                                        >
                                            <div className={`absolute top-1 left-1 w-3 h-3 bg-white rounded-full transition-transform shadow-sm ${horarios.horarioAlmoco.ativo ? 'translate-x-5' : 'translate-x-0'}`} />
                                        </button>
                                    </div>

                                    {horarios.horarioAlmoco.ativo && (
                                        <div className="grid grid-cols-2 gap-3 pt-2 animate-fade-in border-t border-gray-100 dark:border-gray-700 mt-2">
                                            <div>
                                                <label className="text-[10px] font-bold uppercase mb-1 block text-gray-400">Início</label>
                                                <input type="time" value={horarios.horarioAlmoco.inicio || ''} onChange={(e) => setHorarios(prev => ({ ...prev, horarioAlmoco: { ...prev.horarioAlmoco, inicio: e.target.value } }))} className="w-full px-2 h-9 border rounded-lg text-sm outline-none focus:border-orange-500 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-white" />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-bold uppercase mb-1 block text-gray-400">Fim</label>
                                                <input type="time" value={horarios.horarioAlmoco.fim || ''} onChange={(e) => setHorarios(prev => ({ ...prev, horarioAlmoco: { ...prev.horarioAlmoco, fim: e.target.value } }))} className="w-full px-2 h-9 border rounded-lg text-sm outline-none focus:border-orange-500 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-white" />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Card Expediente (Fora de Serviço) - ADICIONADO AQUI */}
                            {horarios?.horarioTrabalho && (
                                <div className={`bg-white dark:bg-[#1e293b] p-4 rounded-lg border shadow-sm transition-all ${horarios.horarioTrabalho.ativo ? 'border-purple-200 dark:border-purple-900/50' : 'border-gray-200 dark:border-gray-700'}`}>
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-lg ${horarios.horarioTrabalho.ativo ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400' : 'bg-gray-100 text-gray-400 dark:bg-gray-800'}`}>
                                                <Moon className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-sm text-gray-800 dark:text-gray-200">Expediente</h4>
                                                <p className="text-[10px] text-gray-500 dark:text-gray-400">Status "Invisível" fora do horário</p>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => setHorarios(prev => ({ ...prev, horarioTrabalho: { ...prev.horarioTrabalho, ativo: !prev.horarioTrabalho.ativo } }))}
                                            className={`w-10 h-5 rounded-full transition-colors relative ${horarios.horarioTrabalho.ativo ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`}
                                        >
                                            <div className={`absolute top-1 left-1 w-3 h-3 bg-white rounded-full transition-transform shadow-sm ${horarios.horarioTrabalho.ativo ? 'translate-x-5' : 'translate-x-0'}`} />
                                        </button>
                                    </div>

                                    {horarios.horarioTrabalho.ativo && (
                                        <div className="grid grid-cols-2 gap-3 pt-2 animate-fade-in border-t border-gray-100 dark:border-gray-700 mt-2">
                                            <div>
                                                <label className="text-[10px] font-bold uppercase mb-1 block text-gray-400">Início</label>
                                                <input type="time" value={horarios.horarioTrabalho.inicio || ''} onChange={(e) => setHorarios(prev => ({ ...prev, horarioTrabalho: { ...prev.horarioTrabalho, inicio: e.target.value } }))} className="w-full px-2 h-9 border rounded-lg text-sm outline-none focus:border-purple-500 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-white" />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-bold uppercase mb-1 block text-gray-400">Fim</label>
                                                <input type="time" value={horarios.horarioTrabalho.fim || ''} onChange={(e) => setHorarios(prev => ({ ...prev, horarioTrabalho: { ...prev.horarioTrabalho, fim: e.target.value } }))} className="w-full px-2 h-9 border rounded-lg text-sm outline-none focus:border-purple-500 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-white" />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1e293b] flex gap-2">
                    <button onClick={() => setMostrarConfig(false)} className="flex-1 h-9 border rounded-lg text-xs font-bold text-gray-600 hover:bg-gray-50">Cancelar</button>
                    <button onClick={handleSalvar} disabled={salvandoConfig} className="flex-1 h-9 bg-green-600 text-white rounded-lg text-xs font-bold hover:bg-green-700 flex items-center justify-center gap-1">{salvandoConfig ? <Loader2 className="w-3 h-3 animate-spin"/> : <Save className="w-3.5 h-3.5"/>} Salvar</button>
                </div>
            </div>
        </>
      )}
    </div>
  );
}