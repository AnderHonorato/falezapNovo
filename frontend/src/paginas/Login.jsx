// src/paginas/Login.jsx

import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  MessageSquare, Mail, Lock, AlertCircle, User, Loader2, 
  Rss, Info, MailCheck, ArrowRight, CheckCircle2 
} from 'lucide-react';
import { useAuth } from '../contextos/AuthContext';
import api from '../servicos/api';

// Componente de Item de Notícia Compacto (Glassmorphism)
const NoticiaItem = ({ titulo, resumo, slug }) => (
  <Link
    to={`/blog/post/${slug}`}
    className="group block p-2.5 mb-2 bg-white/10 hover:bg-white/20 border border-white/10 hover:border-white/30 rounded-lg transition-all duration-300"
  >
    <div className="flex justify-between items-start gap-2">
      <h4 className="font-bold text-xs text-white group-hover:text-emerald-200 transition-colors line-clamp-1 leading-snug">
        {titulo}
      </h4>
      <ArrowRight size={10} className="text-white/50 group-hover:text-white opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-1 shrink-0 mt-0.5" />
    </div>
    {resumo && <p className="text-[9px] text-emerald-100/70 line-clamp-1 mt-0.5">{resumo}</p>}
  </Link>
);

export default function Login() {
  const [tipoLogin, setTipoLogin] = useState('empresa');
  const [email, setEmail] = useState('');
  const [nickname, setNickname] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);
  
  const navigate = useNavigate();
  const { login, usuario: usuarioLogado } = useAuth();
  
  const [noticias, setNoticias] = useState([]);
  const [carregandoNoticias, setCarregandoNoticias] = useState(true);

  // Redireciona se já estiver logado
  useEffect(() => { 
    if (usuarioLogado) navigate('/dashboard', { replace: true }); 
  }, [usuarioLogado, navigate]);

  // Busca notícias
  useEffect(() => {
    const buscarNoticias = async () => {
      setCarregandoNoticias(true);
      try {
        let response;
        try {
          response = await api.get('/blog/posts-recentes');
        } catch (err) {
          response = await api.get('/blog/posts');
        }
        const posts = response.data?.posts || response.data || [];
        // Pega apenas 2 posts para não poluir a tela de login
        setNoticias(Array.isArray(posts) ? posts.slice(0, 3) : []);
      } catch (error) { 
        console.error('Erro notícias:', error);
        setNoticias([]); 
      } finally { 
        setCarregandoNoticias(false); 
      }
    };
    buscarNoticias();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setErro('');
    setCarregando(true);
    
    try {
      const credentials = {
        tipoLogin,
        senha,
        ...(tipoLogin === 'empresa' ? { email } : { nickname })
      };
      
      const resultado = await login(credentials);
      
      if (resultado.sucesso) {
        navigate('/dashboard', { replace: true });
      } else {
        setErro(resultado.mensagem || 'Erro ao fazer login.');
        setCarregando(false);
      }
    } catch (error) {
      setErro('Erro inesperado ao fazer login.');
      setCarregando(false);
    }
  };

  if (usuarioLogado) return null;

  return (
    <div className="h-screen w-full overflow-hidden bg-gradient-to-br from-emerald-950 via-emerald-900 to-teal-900 flex items-center justify-center p-4 relative font-sans">
      
      {/* Background Effects (Efeitos sutis de fundo) */}
      <div className="absolute top-0 left-0 w-full h-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] pointer-events-none z-0"></div>
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-emerald-600 rounded-full mix-blend-multiply filter blur-[100px] opacity-30 animate-pulse"></div>
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-teal-600 rounded-full mix-blend-multiply filter blur-[120px] opacity-20"></div>

      {/* Container Principal Centralizado */}
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center z-10">
        
        {/* --- LADO ESQUERDO: BRANDING & NEWS (Visível em Desktop, Compacto em Mobile) --- */}
        <div className="flex flex-col justify-center text-white order-2 lg:order-1">
          
          <div className="mb-6 lg:mb-8 text-center lg:text-left">
             <div className="inline-flex items-center gap-3 mb-2">
                <div className="bg-white/10 p-2 rounded-xl backdrop-blur-md border border-white/10 shadow-lg">
                   <MessageSquare className="text-emerald-300 w-6 h-6" />
                </div>
                <span className="text-xl font-bold tracking-tight">FaleZap</span>
             </div>
             <h1 className="text-3xl lg:text-4xl font-extrabold leading-tight mb-2 tracking-tight">
               Centralize seu <br className="hidden lg:block"/>
               <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-200 to-teal-200">atendimento inteligente.</span>
             </h1>
             <p className="text-emerald-100/70 text-sm max-w-md mx-auto lg:mx-0 leading-relaxed hidden sm:block">
               Gerencie múltiplos canais, utilize IA para respostas automáticas e acompanhe métricas em tempo real.
             </p>
          </div>

          {/* WIDGET DE NOTÍCIAS (GLASS) */}
          {/* Oculto em telas muito pequenas (height < 600px) para não quebrar o login */}
          <div className="hidden sm:block bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 w-full max-w-sm mx-auto lg:mx-0 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-emerald-400 to-teal-500 opacity-50"></div>
            
            <div className="flex items-center justify-between mb-3 px-1">
               <div className="flex items-center gap-2">
                 <Rss size={14} className="text-emerald-300"/>
                 <span className="text-[10px] font-bold text-emerald-100 uppercase tracking-widest">Atualizações</span>
               </div>
               <Link to="/blog" className="text-[10px] text-emerald-200 hover:text-white transition-colors">Ver blog →</Link>
            </div>

            <div className="space-y-1 max-h-[140px] overflow-y-auto custom-scrollbar pr-1">
              {carregandoNoticias ? (
                <div className="py-4 flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-white/30"/></div>
              ) : noticias.length > 0 ? (
                noticias.map(n => <NoticiaItem key={n.id} {...n} />)
              ) : (
                 <p className="text-xs text-white/30 italic py-2 text-center">Nenhuma novidade recente.</p>
              )}
            </div>
          </div>
          
          {/* Footer Links Desktop */}
          <div className="hidden lg:flex gap-4 text-emerald-200/50 text-[10px] font-medium mt-6">
             <Link to="/suporte" className="hover:text-white transition-colors flex items-center gap-1"><Info size={10}/> Ajuda?</Link>
             <span>•</span>
             <span>© 2025 FaleZap Inc.</span>
          </div>
        </div>

        {/* --- LADO DIREITO: LOGIN FORM --- */}
        <div className="w-full max-w-md mx-auto order-1 lg:order-2">
           <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl rounded-3xl shadow-2xl shadow-black/20 p-6 lg:p-8 border border-white/20 animate-scaleIn">
              
              <div className="text-center mb-6">
                 <h2 className="text-xl font-bold text-gray-800 dark:text-white">Acesse sua conta</h2>
                 <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Bem-vindo de volta!</p>
              </div>

              {/* Toggle Switch */}
              <div className="bg-gray-100 dark:bg-gray-800 p-1 rounded-xl mb-6 flex relative h-10">
                 <div 
                    className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-white dark:bg-gray-700 rounded-lg shadow-sm transition-all duration-300 ease-out ${
                        tipoLogin === 'empresa' ? 'left-1' : 'left-[calc(50%+0px)]'
                    }`}
                 ></div>
                 <button 
                    onClick={() => { setTipoLogin('empresa'); setErro(''); }}
                    className={`flex-1 relative z-10 text-xs font-bold transition-colors ${tipoLogin === 'empresa' ? 'text-emerald-700 dark:text-white' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}
                 >
                    Empresa
                 </button>
                 <button 
                    onClick={() => { setTipoLogin('colaborador'); setErro(''); }}
                    className={`flex-1 relative z-10 text-xs font-bold transition-colors ${tipoLogin === 'colaborador' ? 'text-indigo-700 dark:text-white' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}
                 >
                    Colaborador
                 </button>
              </div>

              {/* Erro */}
              {erro && (
                 <div className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-lg p-2.5 flex items-center gap-2 animate-shake">
                    <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                    <p className="text-xs text-red-600 dark:text-red-400 font-bold">{erro}</p>
                 </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                 {tipoLogin === 'empresa' ? (
                    <div className="space-y-1">
                       <label className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider ml-1">Email</label>
                       <div className="relative group">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-emerald-500 transition-colors" />
                          <input 
                             type="email" 
                             value={email}
                             onChange={e => setEmail(e.target.value)}
                             className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all dark:text-white placeholder:text-gray-400"
                             placeholder="ex: admin@empresa.com"
                             required
                          />
                       </div>
                    </div>
                 ) : (
                    <div className="space-y-1">
                       <label className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider ml-1">Nickname</label>
                       <div className="relative group">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                          <input 
                             type="text" 
                             value={nickname}
                             onChange={e => setNickname(e.target.value.toLowerCase().replace(/\s/g, ''))}
                             className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all dark:text-white placeholder:text-gray-400"
                             placeholder="ex: joao.silva"
                             required
                          />
                       </div>
                    </div>
                 )}

                 <div className="space-y-1">
                    <div className="flex justify-between items-center px-1">
                       <label className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Senha</label>
                       {tipoLogin === 'empresa' && (
                          <Link to="/esqueci-senha" className="text-[10px] font-bold text-emerald-600 hover:text-emerald-700 hover:underline">Esqueceu?</Link>
                       )}
                    </div>
                    <div className="relative group">
                       <Lock className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 transition-colors ${tipoLogin === 'empresa' ? 'group-focus-within:text-emerald-500' : 'group-focus-within:text-indigo-500'}`} />
                       <input 
                          type="password" 
                          value={senha}
                          onChange={e => setSenha(e.target.value)}
                          className={`w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm outline-none transition-all dark:text-white placeholder:text-gray-400 ${
                             tipoLogin === 'empresa' 
                             ? 'focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500' 
                             : 'focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500'
                          }`}
                          placeholder="••••••••"
                          required
                          minLength={6}
                       />
                    </div>
                 </div>

                 <button 
                    type="submit" 
                    disabled={carregando}
                    className={`w-full py-3 rounded-xl font-bold text-white text-sm shadow-lg hover:shadow-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2 mt-2 ${
                       tipoLogin === 'empresa' 
                       ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-emerald-500/20' 
                       : 'bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 shadow-indigo-500/20'
                    } disabled:opacity-70 disabled:cursor-not-allowed`}
                 >
                    {carregando ? <Loader2 className="w-4 h-4 animate-spin"/> : <CheckCircle2 className="w-4 h-4" />}
                    {carregando ? 'Validando...' : 'Acessar Painel'}
                 </button>
              </form>

              <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-800 text-center">
                 {tipoLogin === 'empresa' ? (
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                       Ainda não tem conta?{' '}
                       <Link to="/cadastro-empresa" className="text-emerald-600 font-bold hover:underline transition-colors">Criar agora</Link>
                    </p>
                 ) : (
                    <p className="text-[10px] text-gray-400 italic">
                       Problemas de acesso? Contate seu gestor.
                    </p>
                 )}
              </div>

           </div>
        </div>
      </div>

      <style>{`
        @keyframes scaleIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        @keyframes shake { 10%, 90% { transform: translate3d(-1px, 0, 0); } 20%, 80% { transform: translate3d(2px, 0, 0); } 30%, 50%, 70% { transform: translate3d(-4px, 0, 0); } 40%, 60% { transform: translate3d(4px, 0, 0); } }
        .animate-scaleIn { animation: scaleIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-shake { animation: shake 0.4s cubic-bezier(.36,.07,.19,.97) both; }
        
        .custom-scrollbar::-webkit-scrollbar { width: 3px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(255,255,255,0.05); }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.4); }
      `}</style>
    </div>
  );
}