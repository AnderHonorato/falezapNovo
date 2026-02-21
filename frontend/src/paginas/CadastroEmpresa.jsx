import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Building2, Mail, Phone, FileText, User, Lock,
  CheckCircle, ArrowLeft, Loader2, MessageSquare,
  Shield, Zap, Users, Clock, Check, CheckCircle2, ArrowRight, Info, ShieldCheck
} from 'lucide-react';
import api from '../servicos/api';
import toast from 'react-hot-toast';

export default function CadastroEmpresa() {
  const navigate = useNavigate();
  const [etapa, setEtapa] = useState(1);
  const [carregando, setCarregando] = useState(false);

  // Estados originais mantidos integralmente
  const [tipoConta, setTipoConta] = useState('EMPRESA');
  const [nomeEmpresa, setNomeEmpresa] = useState('');
  const [nomeFantasia, setNomeFantasia] = useState('');
  const [documento, setDocumento] = useState('');
  const [emailEmpresa, setEmailEmpresa] = useState('');
  const [telefoneEmpresa, setTelefoneEmpresa] = useState('');
  const [nomeCompleto, setNomeCompleto] = useState('');
  const [nomeAdmin, setNomeAdmin] = useState('');
  const [emailAdmin, setEmailAdmin] = useState('');
  const [senhaAdmin, setSenhaAdmin] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [cpfAdmin, setCpfAdmin] = useState('');

  const proximaEtapa = () => {
    if (etapa === 1) {
      if (tipoConta === 'EMPRESA') {
        if (!nomeEmpresa.trim() || !documento.trim() || !emailEmpresa.trim() || !telefoneEmpresa.trim()) {
          toast.error('Preencha todos os campos obrigatórios (*)');
          return;
        }
      } else {
        if (!nomeCompleto.trim() || !documento.trim() || !emailEmpresa.trim() || !telefoneEmpresa.trim()) {
          toast.error('Preencha todos os campos obrigatórios (*)');
          return;
        }
      }
    }
    setEtapa(etapa + 1);
  };

  const etapaAnterior = () => setEtapa(etapa - 1);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (senhaAdmin !== confirmarSenha) return toast.error('As senhas não coincidem');
    if (senhaAdmin.length < 6) return toast.error('A senha deve ter no mínimo 6 caracteres');

    setCarregando(true);
    try {
      await api.post('/auth/registrar', {
        tipoConta, documento, razaoSocial: nomeEmpresa, nomeFantasia, nomeCompleto,
        email: emailEmpresa, telefone: telefoneEmpresa, nomeUsuario: nomeAdmin,
        emailUsuario: emailAdmin, senhaUsuario: senhaAdmin, cpfUsuario: cpfAdmin
      });
      setEtapa(3);
    } catch (error) {
      toast.error(error.response?.data?.erro || 'Erro no cadastro');
    } finally { setCarregando(false); }
  };

  return (
    <div className="h-screen w-full overflow-hidden bg-gradient-to-br from-emerald-950 via-emerald-900 to-teal-900 flex items-center justify-center p-4 relative font-sans">
      <div className="absolute top-0 left-0 w-full h-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] pointer-events-none z-0"></div>
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-emerald-600 rounded-full mix-blend-multiply filter blur-[100px] opacity-30 animate-pulse"></div>
      
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center z-10">
        
        {/* LADO ESQUERDO: BRANDING E DICAS EM GLASSMOPHISM */}
        <div className="flex flex-col justify-center text-white order-2 lg:order-1 animate-fadeIn">
          <div className="mb-8 text-center lg:text-left">
            <div className="inline-flex items-center gap-3 mb-4">
              <div className="bg-white/10 p-2.5 rounded-xl backdrop-blur-md border border-white/10 shadow-lg">
                <MessageSquare className="text-emerald-300 w-6 h-6" />
              </div>
              <span className="text-xl font-bold tracking-tight">FaleZap</span>
            </div>
            <h1 className="text-3xl lg:text-4xl font-extrabold leading-tight mb-4 tracking-tight text-white">
              A solução definitiva para <br/> 
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-200 to-teal-200">o seu negócio.</span>
            </h1>
            <p className="text-emerald-100/70 text-sm max-w-md mx-auto lg:mx-0 leading-relaxed mb-8">
              Registre sua empresa e descubra como a Inteligência Artificial pode escalar o seu atendimento ao cliente.
            </p>
          </div>

          {/* Cards Transparentes (Dicas) */}
          <div className="hidden sm:grid grid-cols-1 gap-3 max-w-sm mx-auto lg:mx-0">
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 shadow-2xl flex gap-4 items-start">
              <div className="p-2 bg-emerald-500/20 rounded-lg shrink-0 h-fit">
                <Clock className="text-emerald-300" size={20}/>
              </div>
              <div>
                <h4 className="text-sm font-bold text-emerald-50">Análise em 24h</h4>
                <p className="text-[10px] text-emerald-100/60 mt-0.5 leading-relaxed">Nossa equipe analisa cada cadastro para garantir a integridade da plataforma.</p>
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 shadow-2xl flex gap-4 items-start">
              <div className="p-2 bg-blue-500/20 rounded-lg shrink-0 h-fit">
                <ShieldCheck className="text-blue-300" size={20}/>
              </div>
              <div>
                <h4 className="text-sm font-bold text-emerald-50">Privacidade Garantida</h4>
                <p className="text-[10px] text-emerald-100/60 mt-0.5 leading-relaxed">Seus dados e de seus clientes estão protegidos sob os mais rígidos protocolos de segurança.</p>
              </div>
            </div>
          </div>
        </div>

        {/* LADO DIREITO: FORMULÁRIO */}
        <div className="w-full max-w-md mx-auto order-1 lg:order-2">
          <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl rounded-3xl shadow-2xl shadow-black/20 p-6 lg:p-8 border border-white/20 animate-scaleIn">
            
            {etapa !== 3 && (
              <div className="text-center mb-6">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white tracking-tight">
                  {etapa === 1 ? 'Dados da Empresa' : 'Dados do Admin'}
                </h2>
                <div className="flex justify-center gap-2 mt-3">
                   {[1, 2].map(i => <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${etapa >= i ? 'w-8 bg-emerald-500' : 'w-2 bg-gray-200'}`} />)}
                </div>
              </div>
            )}

            {etapa === 1 && (
              <div className="space-y-4 animate-fadeIn">
                <div className="bg-gray-100 dark:bg-gray-800 p-1 rounded-xl flex h-10 shadow-inner">
                  <button onClick={() => setTipoConta('EMPRESA')} className={`flex-1 text-[10px] font-bold rounded-lg transition-all ${tipoConta === 'EMPRESA' ? 'bg-white shadow-sm text-emerald-700' : 'text-gray-500'}`}>PJ (EMPRESA)</button>
                  <button onClick={() => setTipoConta('INDIVIDUAL')} className={`flex-1 text-[10px] font-bold rounded-lg transition-all ${tipoConta === 'INDIVIDUAL' ? 'bg-white shadow-sm text-emerald-700' : 'text-gray-500'}`}>PF (INDIVIDUAL)</button>
                </div>

                <div className="space-y-3 max-h-[320px] overflow-y-auto custom-scrollbar pr-1">
                  {tipoConta === 'EMPRESA' ? (
                    <>
                      <input type="text" placeholder="Razão Social *" value={nomeEmpresa} onChange={e => setNomeEmpresa(e.target.value)} className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all dark:text-white" />
                      <input type="text" placeholder="Nome Fantasia" value={nomeFantasia} onChange={e => setNomeFantasia(e.target.value)} className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all dark:text-white" />
                    </>
                  ) : (
                    <input type="text" placeholder="Nome Completo *" value={nomeCompleto} onChange={e => setNomeCompleto(e.target.value)} className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all dark:text-white" />
                  )}
                  <input type="text" placeholder={tipoConta === 'EMPRESA' ? "CNPJ *" : "CPF *"} value={documento} onChange={e => setDocumento(e.target.value)} className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all dark:text-white" />
                  <div className="grid grid-cols-2 gap-3">
                    <input type="email" placeholder="Email Empresa *" value={emailEmpresa} onChange={e => setEmailEmpresa(e.target.value)} className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all dark:text-white" />
                    <input type="tel" placeholder="Telefone *" value={telefoneEmpresa} onChange={e => setTelefoneEmpresa(e.target.value)} className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all dark:text-white" />
                  </div>
                </div>
                <button onClick={proximaEtapa} className="w-full py-3 bg-emerald-600 text-white rounded-xl font-bold text-sm shadow-lg flex items-center justify-center gap-2 hover:bg-emerald-700 active:scale-[0.98] transition-all">Próxima Etapa <ArrowRight size={16}/></button>
              </div>
            )}

            {etapa === 2 && (
              <form onSubmit={handleSubmit} className="space-y-4 animate-fadeIn">
                <div className="space-y-3">
                  <input type="text" placeholder="Nome do Responsável *" value={nomeAdmin} onChange={e => setNomeAdmin(e.target.value)} className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all dark:text-white" required />
                  <input type="email" placeholder="Email de Acesso *" value={emailAdmin} onChange={e => setEmailAdmin(e.target.value)} className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all dark:text-white" required />
                  <input type="text" placeholder="CPF do Admin" value={cpfAdmin} onChange={e => setCpfAdmin(e.target.value)} className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all dark:text-white" />
                  <div className="grid grid-cols-2 gap-3">
                    <input type="password" placeholder="Senha *" value={senhaAdmin} onChange={e => setSenhaAdmin(e.target.value)} className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all dark:text-white" required />
                    <input type="password" placeholder="Confirmar *" value={confirmarSenha} onChange={e => setConfirmarSenha(e.target.value)} className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all dark:text-white" required />
                  </div>
                </div>
                <div className="flex gap-3">
                  <button type="button" onClick={etapaAnterior} className="flex-1 py-3 bg-gray-100 text-gray-500 rounded-xl font-bold text-xs">Voltar</button>
                  <button type="submit" disabled={carregando} className="flex-[2] py-3 bg-emerald-600 text-white rounded-xl font-bold text-xs shadow-lg flex items-center justify-center gap-2 active:scale-[0.98] transition-all">
                    {carregando ? <Loader2 className="animate-spin" size={14}/> : <CheckCircle2 size={14}/>} Finalizar
                  </button>
                </div>
              </form>
            )}

            {etapa === 3 && (
              <div className="text-center py-6 animate-scaleIn">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4"><CheckCircle size={32} className="text-emerald-600" /></div>
                <h2 className="text-xl font-bold text-gray-800">Solicitação Recebida!</h2>
                <p className="text-xs text-gray-500 leading-relaxed px-4">Analisaremos seus dados e enviaremos uma confirmação para seu e-mail em breve.</p>
                <button onClick={() => navigate('/login')} className="w-full py-3 bg-emerald-600 text-white rounded-xl font-bold text-sm mt-6">Ir para o Login</button>
              </div>
            )}

            {etapa !== 3 && (
              <div className="mt-6 text-center border-t border-gray-100 pt-4">
                <Link to="/login" className="text-[11px] text-gray-400 font-bold hover:text-emerald-600 transition-colors uppercase tracking-widest inline-flex items-center gap-1"><ArrowLeft size={10}/> Voltar para o Login</Link>
              </div>
            )}
          </div>
        </div>
      </div>
      <style>{`
        @keyframes scaleIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        .animate-scaleIn { animation: scaleIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-fadeIn { animation: fadeIn 0.5s ease-out forwards; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes shake { 10%, 90% { transform: translate3d(-1px, 0, 0); } 20%, 80% { transform: translate3d(2px, 0, 0); } 30%, 50%, 70% { transform: translate3d(-4px, 0, 0); } 40%, 60% { transform: translate3d(4px, 0, 0); } }
        .animate-shake { animation: shake 0.4s cubic-bezier(.36,.07,.19,.97) both; }
        .custom-scrollbar::-webkit-scrollbar { width: 3px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(0,0,0,0.05); }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.1); border-radius: 10px; }
      `}</style>
    </div>
  );
}