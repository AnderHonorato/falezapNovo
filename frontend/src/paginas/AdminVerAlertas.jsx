// frontend/src/paginas/chatInterno/AdminVerAlertas.jsx

import { useState, useEffect } from 'react';
import { useAuth } from '../contextos/AuthContext';
import { useNavigate } from "react-router-dom";
import { Megaphone, Users, Clock, CheckCircle, XCircle, Loader2, RefreshCw, Eye, X } from 'lucide-react';
import api from '../servicos/api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function AdminVerAlertas() {
  const { usuario } = useAuth();
  const navigate = useNavigate();
  const [alertas, setAlertas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [alertaSelecionado, setAlertaSelecionado] = useState(null);
  const [respostasAlerta, setRespostasAlerta] = useState([]);
  const [carregandoRespostas, setCarregandoRespostas] = useState(false);
  const [modalAberto, setModalAberto] = useState(false);

  const isAdmin = ['OWNER', 'ADMIN', 'ADMIN_EMPRESA'].includes(usuario?.tipo);

  useEffect(() => {
    if (!isAdmin) {
      navigate('/dashboard');
      return;
    }
    carregarAlertas();
  }, [isAdmin, navigate]);

  const carregarAlertas = async () => {
    setCarregando(true);
    try {
      const response = await api.get('/chat-interno/alertas/meus');
      setAlertas(response.data.alertas || []);
    } catch (error) {
      console.error('Erro ao carregar alertas:', error);
      toast.error('Erro ao carregar alertas enviados');
      if (error.response?.data?.erro) {
         console.error("Detalhe do erro:", error.response.data.erro);
      }
    } finally {
      setCarregando(false);
    }
  };

  const carregarRespostas = async (alerta) => {
    setAlertaSelecionado(alerta);
    setModalAberto(true);
    setCarregandoRespostas(true);
    setRespostasAlerta([]);
    try {
      const response = await api.get(`/chat-interno/alertas/${alerta.id}/respostas`);
      setRespostasAlerta(response.data.respostas || []);
    } catch (error) {
      console.error('Erro ao carregar respostas:', error);
      toast.error('Erro ao carregar respostas do alerta');
      setModalAberto(false);
      setAlertaSelecionado(null);
    } finally {
      setCarregandoRespostas(false);
    }
  };

  const fecharModal = () => {
    setModalAberto(false);
    setAlertaSelecionado(null);
    setRespostasAlerta([]);
  }

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-surface p-6">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-tertiary-container rounded-[16px] flex items-center justify-center shadow-elevation-1">
                <Megaphone className="w-7 h-7 text-on-tertiary-container" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-on-surface">Alertas Enviados</h1>
                <p className="text-sm text-on-surface-variant">Histórico de alertas e respostas ({alertas.length})</p>
              </div>
            </div>
            <button
              onClick={carregarAlertas}
              disabled={carregando}
              className="p-3 bg-surface-container rounded-full hover:bg-surface-variant transition-all border border-outline disabled:opacity-50"
            >
              <RefreshCw className={`w-5 h-5 text-on-surface-variant ${carregando ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {carregando ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-tertiary animate-spin" />
          </div>
        ) : alertas.length === 0 ? (
          <div className="bg-surface-container rounded-[28px] p-12 text-center shadow-elevation-1">
            <Megaphone className="w-16 h-16 text-on-surface-variant mx-auto mb-4" />
            <h3 className="text-lg font-bold text-on-surface mb-2">Nenhum alerta enviado</h3>
            <p className="text-sm text-on-surface-variant">Você ainda não enviou nenhum alerta para a equipe.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {alertas.map(alerta => (
              <div
                key={alerta.id}
                className="bg-surface-container rounded-[28px] p-6 shadow-elevation-1 border border-outline-variant hover:shadow-elevation-2 transition-shadow duration-200"
              >
                <div className="flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                      <h3 className="text-lg font-bold text-on-surface truncate flex-shrink mr-4" title={alerta.titulo}>
                        {alerta.titulo}
                      </h3>
                      <span className="text-xs text-on-surface-variant flex items-center gap-1 flex-shrink-0">
                        <Clock className="w-3 h-3" />
                        {format(new Date(alerta.criadoEm), "dd/MM/yy 'às' HH:mm", { locale: ptBR })}
                      </span>
                    </div>
                    <p className="text-sm text-on-surface-variant mb-4 leading-relaxed line-clamp-2" title={alerta.mensagem}>
                      {alerta.mensagem}
                    </p>
                    <div className="flex items-center justify-between flex-wrap gap-2">
                       <div className="flex items-center gap-1 text-xs text-on-surface-variant">
                         <Users className="w-4 h-4" />
                         {alerta.totalDestinatarios || 0} destinatários
                         <span className="mx-1">•</span>
                         {alerta.totalRespostas || 0} respostas
                       </div>
                       <button
                         onClick={() => carregarRespostas(alerta)}
                         className="px-4 py-2 bg-tertiary-container text-on-tertiary-container rounded-full text-xs font-semibold hover:bg-tertiary-container/80 transition-all flex items-center gap-1.5"
                       >
                         <Eye className="w-4 h-4" />
                         Ver Respostas ({alerta.totalRespostas || 0})
                       </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {modalAberto && alertaSelecionado && (
        <div className="fixed inset-0 bg-scrim/60 flex items-center justify-center z-[60] p-4 animate-fadeIn">
          <div className="bg-surface-container rounded-[28px] max-w-lg w-full shadow-elevation-3 max-h-[80vh] flex flex-col">
            <div className="px-6 py-4 border-b border-outline-variant">
              <div className="flex items-center justify-between mb-1">
                 <h3 className="font-bold text-lg text-on-surface">Respostas ao Alerta</h3>
                 <button
                   onClick={fecharModal}
                   className="p-2 text-on-surface-variant hover:text-on-surface rounded-full hover:bg-surface-variant transition-all"
                 >
                   <X className="w-5 h-5" />
                 </button>
              </div>
              <p className="text-sm text-on-surface-variant truncate" title={alertaSelecionado.titulo}>
                "{alertaSelecionado.titulo}"
              </p>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-3 custom-scrollbar">
              {carregandoRespostas ? (
                 <div className="flex items-center justify-center py-10">
                   <Loader2 className="w-6 h-6 text-primary animate-spin" />
                 </div>
              ) : respostasAlerta.length === 0 ? (
                <p className="text-sm text-on-surface-variant text-center py-10">Nenhuma resposta recebida ainda.</p>
              ) : (
                respostasAlerta.map(resp => (
                  <div key={resp.id} className="flex items-center gap-3 p-4 bg-surface-container-high rounded-[16px] border border-outline-variant">
                     {resp.usuario.foto_perfil ? (
                       <img src={resp.usuario.foto_perfil} alt={resp.usuario.nome} className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                     ) : (
                       <div className="w-10 h-10 bg-primary-container rounded-full flex items-center justify-center text-on-primary-container text-sm font-bold flex-shrink-0">
                         {resp.usuario.nome.charAt(0).toUpperCase()}
                       </div>
                     )}
                     <div className="flex-1 min-w-0">
                       <p className="text-sm font-semibold text-on-surface truncate">{resp.usuario.nome}</p>
                       <p className="text-xs text-on-surface-variant">
                         {format(new Date(resp.criadaEm), "dd/MM/yy HH:mm", { locale: ptBR })}
                       </p>
                     </div>
                     {resp.resposta === 'entendido' ? (
                       <span className="flex items-center gap-1 text-xs font-semibold text-on-secondary-container bg-secondary-container px-3 py-1.5 rounded-full flex-shrink-0">
                         <CheckCircle className="w-3.5 h-3.5" /> Entendido
                       </span>
                     ) : (
                       <span className="flex items-center gap-1 text-xs font-semibold text-on-error-container bg-error-container px-3 py-1.5 rounded-full flex-shrink-0">
                         <XCircle className="w-3.5 h-3.5" /> Não concordo
                       </span>
                     )}
                  </div>
                ))
              )}
            </div>
             <div className="px-6 py-4 bg-surface-container-highest border-t border-outline-variant text-right">
                <button
                   onClick={fecharModal}
                   className="px-5 py-2.5 bg-primary text-on-primary rounded-full font-semibold hover:shadow-elevation-1 transition-all text-sm"
                 >
                   Fechar
                 </button>
             </div>
          </div>
        </div>
      )}

      <style>{`
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: var(--md-sys-color-outline-variant);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: var(--md-sys-color-outline);
        }
      `}</style>
    </div>
  );
}