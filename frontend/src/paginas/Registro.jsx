import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { MessageSquare, Lock, Mail, User, AlertCircle, CheckCircle, Loader2, ArrowLeft, CheckCircle2, ShieldCheck, Zap } from 'lucide-react';
import api from '../servicos/api';

export default function Registro() {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro('');
    if (senha !== confirmarSenha) return setErro('As senhas não coincidem');
    if (senha.length < 6) return setErro('A senha deve ter no mínimo 6 caracteres');

    setCarregando(true);
    try {
      await api.post('/auth/registrar', { nome, email, senha });
      setSucesso(true);
      setTimeout(() => navigate('/login'), 2000);
    } catch (error) {
      setErro(error.response?.data?.mensagem || 'Erro ao criar conta');
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
            <div className="inline-flex items-center gap-3 mb-2">
              <div className="bg-white/10 p-2 rounded-xl backdrop-blur-md border border-white/10 shadow-lg">
                <MessageSquare className="text-emerald-300 w-6 h-6" />
              </div>
              <span className="text-xl font-bold tracking-tight">FaleZap</span>
            </div>
            <h1 className="text-3xl lg:text-4xl font-extrabold leading-tight mb-2 tracking-tight">
              Faça parte da nossa <br className="hidden lg:block"/> 
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-200 to-teal-200">comunidade inteligente.</span>
            </h1>
            <p className="text-emerald-100/70 text-sm max-w-md mx-auto lg:mx-0 leading-relaxed hidden sm:block">
              Crie sua conta pessoal e tenha acesso a todas as ferramentas de produtividade e comunicação interna.
            </p>
          </div>

          <div className="hidden sm:grid grid-cols-1 gap-3 max-w-sm mx-auto lg:mx-0">
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 shadow-2xl flex gap-4 items-start">
              <div className="p-2 bg-emerald-500/20 rounded-lg shrink-0 h-fit">
                <ShieldCheck className="text-emerald-300" size={20}/>
              </div>
              <div>
                <h4 className="text-sm font-bold text-emerald-50">Segurança em Primeiro Lugar</h4>
                <p className="text-[10px] text-emerald-100/60 mt-0.5 leading-relaxed">Sua senha é criptografada e seus dados nunca são compartilhados sob nenhuma circunstância.</p>
              </div>
            </div>
          </div>
        </div>

        {/* LADO DIREITO: FORMULÁRIO */}
        <div className="w-full max-w-md mx-auto order-1 lg:order-2">
          <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl rounded-3xl shadow-2xl shadow-black/20 p-6 lg:p-8 border border-white/20 animate-scaleIn">
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold text-gray-800 dark:text-white tracking-tight">Cadastre-se</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Insira seus dados para começar.</p>
            </div>

            {erro && (
              <div className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-xl p-2.5 flex items-center gap-2 animate-shake">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                <p className="text-xs text-red-600 dark:text-red-400 font-bold">{erro}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider ml-1">Nome Completo</label>
                <div className="relative group">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-emerald-500 transition-colors" />
                  <input type="text" value={nome} onChange={e => setNome(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all dark:text-white placeholder:text-gray-400" placeholder="Seu nome" required />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider ml-1">E-mail</label>
                <div className="relative group">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-emerald-500 transition-colors" />
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all dark:text-white placeholder:text-gray-400" placeholder="seu@email.com" required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider ml-1">Senha</label>
                  <input type="password" value={senha} onChange={e => setSenha(e.target.value)} className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none dark:text-white placeholder:text-gray-400" placeholder="••••••" required />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider ml-1">Confirmar</label>
                  <input type="password" value={confirmarSenha} onChange={e => setConfirmarSenha(e.target.value)} className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none dark:text-white placeholder:text-gray-400" placeholder="••••••" required />
                </div>
              </div>
              <button type="submit" disabled={carregando || sucesso} className="w-full py-3 rounded-xl font-bold text-white text-sm shadow-lg hover:shadow-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2 mt-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 disabled:opacity-70">
                {carregando ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                <span>Finalizar Cadastro</span>
              </button>
            </form>

            <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-800 text-center">
              <Link to="/login" className="text-xs text-gray-400 hover:text-emerald-600 transition-colors inline-flex items-center gap-1 font-bold"><ArrowLeft size={12}/> Voltar para o Login</Link>
            </div>
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
      `}</style>
    </div>
  );
}