// src/paginas/Login.jsx - CORRIGIDO
import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { MessageSquare, Mail, Lock, AlertCircle, User, Loader2, Rss, Info, MailCheck } from 'lucide-react';
import { useAuth } from '../contextos/AuthContext';
import api from '../servicos/api';

// Componente simples para item de notícia
const NoticiaItem = ({ titulo, resumo, slug }) => (
  <Link
    to={`/blog/post/${slug}`}
    className="block mb-3 pb-3 border-b border-gray-200 last:border-b-0 hover:bg-white/50 p-2 rounded-xl transition-all duration-300 group"
  >
    <h4 className="font-semibold text-sm text-gray-800 mb-1 group-hover:text-emerald-700 transition-colors duration-200 line-clamp-1">
      {titulo}
    </h4>
    {resumo && <p className="text-xs text-gray-600 line-clamp-1">{resumo}</p>}
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

  useEffect(() => { 
    if (usuarioLogado) navigate('/dashboard', { replace: true }); 
  }, [usuarioLogado, navigate]);

  useEffect(() => {
    const buscarNoticias = async () => {
      setCarregandoNoticias(true);
      try {
        console.log('🔍 Buscando posts do blog...');
        let response;
        try {
          response = await api.get('/blog/posts-recentes', {
            headers: { 'Authorization': '' }
          });
          console.log('📦 Resposta posts-recentes:', response.data);
        } catch (err) {
          console.log('⚠️ Rota posts-recentes não existe, tentando /blog/posts');
          response = await api.get('/blog/posts', {
            headers: { 'Authorization': '' }
          });
          console.log('📦 Resposta /blog/posts:', response.data);
        }
        
        const posts = response.data?.posts || response.data || [];
        console.log('📰 Posts encontrados:', posts);
        const postsRecentes = Array.isArray(posts) ? posts.slice(0, 3) : [];
        console.log('✅ Posts para exibir:', postsRecentes);
        setNoticias(postsRecentes);
      } catch (error) { 
        console.error('❌ Erro ao carregar notícias do blog:', error);
        setNoticias([]); 
      } finally { 
        setCarregandoNoticias(false); 
      }
    };
    buscarNoticias();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro('');
    setCarregando(true);
    
    try {
      console.log('🔐 Iniciando login...');
      
      // Monta as credenciais conforme o tipo de login
      const credentials = tipoLogin === 'empresa' 
        ? { email, senha }
        : { nickname, senha };
      
      console.log('📤 Enviando credenciais:', { ...credentials, senha: '***' });
      
      const res = await api.post('/auth/login', credentials);
      
      console.log('📥 Resposta do servidor:', res.data);
      
      // ✅ CORREÇÃO PRINCIPAL - Verifica múltiplos campos de sucesso
      if (res.data.sucesso || res.data.success || res.status === 200) {
        console.log('✅ Login bem-sucedido!');
        
        // Armazena o token
        const token = res.data.token || res.data.data?.token;
        if (token) {
          localStorage.setItem('token', token);
          console.log('💾 Token armazenado');
        }
        
        // Armazena dados do usuário se disponível
        const usuario = res.data.usuario || res.data.user || res.data.data?.usuario;
        if (usuario) {
          localStorage.setItem('user', JSON.stringify(usuario));
          console.log('💾 Dados do usuário armazenados');
        }
        
        // Chama a função login do contexto se disponível
        if (login && typeof login === 'function') {
          try {
            await login(res.data);
            console.log('✅ Contexto de autenticação atualizado');
          } catch (contextError) {
            console.warn('⚠️ Erro ao atualizar contexto:', contextError);
          }
        }
        
        // ✅ REDIRECIONAMENTO FORÇADO
        console.log('🔄 Redirecionando para dashboard...');
        
        // Tenta múltiplas formas de redirecionamento
        setTimeout(() => {
          navigate('/dashboard', { replace: true });
        }, 100);
        
        // Fallback se navigate não funcionar
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 500);
        
      } else {
        // Login falhou
        const mensagemErro = res.data.mensagem || res.data.message || res.data.erro || 'Credenciais inválidas.';
        console.error('❌ Login falhou:', mensagemErro);
        setErro(mensagemErro);
        setCarregando(false);
      }
      
    } catch (error) {
      console.error('❌ Erro na requisição:', error);
      const mensagemErro = error.response?.data?.erro 
        || error.response?.data?.mensagem 
        || error.response?.data?.message 
        || error.message 
        || 'Erro ao fazer login. Tente novamente.';
      setErro(mensagemErro);
      setCarregando(false);
    }
  };

  if (usuarioLogado) return null;

  return (
    <div className="h-screen flex bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
      {/* Coluna Esquerda: Informações - Compacta */}
      <div className="w-1/2 hidden lg:flex flex-col justify-between p-8 bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 relative overflow-hidden">
        {/* Decorativos de fundo */}
        <div className="absolute -top-20 -left-20 w-64 h-64 bg-gradient-to-br from-green-200 to-emerald-300 rounded-full opacity-20 blur-3xl pointer-events-none animate-float" />
        <div className="absolute top-1/3 -right-24 w-72 h-72 bg-gradient-to-br from-teal-200 to-green-300 rounded-full opacity-15 blur-3xl pointer-events-none animate-float-delayed" />

        <div className="relative z-10">
          {/* Logo e Tagline - Compacto */}
          <div className="mb-6 animate-fadeIn">
            <Link 
              to="/" 
              className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-3xl mb-4 shadow-lg shadow-green-500/30 hover:shadow-xl hover:shadow-green-500/40 transition-all duration-300 hover:scale-105 group"
            >
              <MessageSquare className="w-8 h-8 text-white group-hover:scale-110 transition-transform duration-300" />
            </Link>
            <h1 className="text-3xl font-bold text-gray-900 mb-2 tracking-tight leading-tight">
              Bem-vindo ao <span className="gradient-text">FaleZap</span>
            </h1>
            <p className="text-base text-gray-600 font-medium">
              Plataforma completa de atendimento multi-empresas.
            </p>
          </div>

          {/* Seção de Notícias - Compacta */}
          <div className="mb-6 animate-scaleIn" style={{ animationDelay: '0.2s' }}>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-100 to-emerald-200 rounded-2xl flex items-center justify-center shadow-sm">
                <Rss className="w-5 h-5 text-emerald-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-800">Últimas Notícias</h3>
            </div>
            
            <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 shadow-md border border-white/50">
              <div className="max-h-36 overflow-y-auto pr-1 custom-scrollbar">
                {carregandoNoticias ? (
                  <div className="flex flex-col items-center justify-center h-24 gap-2">
                    <Loader2 className="w-6 h-6 text-emerald-500 animate-spin" />
                    <p className="text-xs text-gray-600">Carregando...</p>
                  </div>
                ) : noticias.length > 0 ? (
                  noticias.map(n => (
                    <NoticiaItem 
                      key={n.id} 
                      titulo={n.titulo} 
                      resumo={n.resumo} 
                      slug={n.slug}
                    />
                  ))
                ) : (
                  <div className="text-center py-6">
                    <Rss className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                    <p className="text-xs text-gray-500 italic">Sem notícias no momento.</p>
                  </div>
                )}
              </div>
              {!carregandoNoticias && noticias.length > 0 && (
                <Link 
                  to="/blog" 
                  className="inline-flex items-center gap-1 mt-3 px-4 py-2 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-full transition-all duration-200 group"
                >
                  Ver todas
                  <span className="group-hover:translate-x-1 transition-transform duration-200">→</span>
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Links Úteis - Compacto */}
        <div className="relative z-10 space-y-3 animate-fadeIn" style={{ animationDelay: '0.4s' }}>
          <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Precisa de Ajuda?</h4>
          <div className="flex flex-col space-y-2">
            <Link 
              to="/suporte" 
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-emerald-700 transition-all duration-200 group p-2 rounded-xl hover:bg-white/50"
            >
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm group-hover:shadow-md transition-all duration-200">
                <Info className="w-4 h-4 text-emerald-600" />
              </div>
              <span className="font-semibold">Central de Ajuda</span>
            </Link>
            <a 
              href="mailto:suporte@falezap.com" 
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-emerald-700 transition-all duration-200 group p-2 rounded-xl hover:bg-white/50"
            >
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm group-hover:shadow-md transition-all duration-200">
                <MailCheck className="w-4 h-4 text-emerald-600" />
              </div>
              <span className="font-semibold">Contatar Suporte</span>
            </a>
          </div>
          <div className="pt-3 mt-3 border-t border-gray-300/50">
            <p className="text-xs text-gray-500 font-medium">© {new Date().getFullYear()} FaleZap - Todos os direitos reservados.</p>
          </div>
        </div>
      </div>

      {/* Coluna Direita: Formulário - Centralizado Verticalmente */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 animate-fadeIn">
        <div className="max-w-md w-full">
          {/* Logo Mobile */}
          <div className="text-center mb-6 lg:hidden">
            <Link 
              to="/" 
              className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-3xl mb-4 shadow-lg shadow-green-500/30"
            >
              <MessageSquare className="w-8 h-8 text-white" />
            </Link>
            <h1 className="text-3xl font-bold gradient-text">FaleZap</h1>
          </div>

          {/* Card Login - Compacto */}
          <div className="bg-white rounded-[28px] shadow-xl p-6 border border-gray-100 animate-scaleIn">
            {/* Toggle Tipo Login */}
            <div className="relative bg-gradient-to-r from-gray-50 to-gray-100 rounded-[20px] p-1.5 mb-6 shadow-inner">
              <div 
                className={`absolute top-1.5 h-[calc(100%-12px)] bg-white rounded-[18px] shadow-lg transition-all duration-300 ease-out ${
                  tipoLogin === 'empresa' ? 'left-1.5 w-[calc(50%-6px)]' : 'left-[calc(50%+1.5px)] w-[calc(50%-6px)]'
                }`}
              />
              <div className="relative z-10 flex">
                <button 
                  type="button" 
                  onClick={() => { setTipoLogin('empresa'); setErro(''); }} 
                  className={`flex-1 py-3 px-4 text-sm font-bold rounded-[18px] transition-all duration-300 ${
                    tipoLogin === 'empresa' ? 'text-green-700' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Empresa
                </button>
                <button 
                  type="button" 
                  onClick={() => { setTipoLogin('colaborador'); setErro(''); }} 
                  className={`flex-1 py-3 px-4 text-sm font-bold rounded-[18px] transition-all duration-300 ${
                    tipoLogin === 'colaborador' ? 'text-blue-700' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Colaborador
                </button>
              </div>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-5 text-center tracking-tight">
              Acesse sua Conta
            </h2>

            {/* Erro */}
            {erro && (
              <div className="mb-5 p-4 bg-red-50 border-l-4 border-red-500 rounded-xl flex items-start gap-3 animate-shake shadow-sm">
                <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <AlertCircle className="w-4 h-4 text-red-600" />
                </div>
                <p className="text-sm text-red-700 font-semibold flex-1 mt-1">{erro}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {tipoLogin === 'empresa' ? (
                <div className="animate-fadeIn">
                  <label className="block text-xs font-bold text-gray-700 mb-2 tracking-wide">Email</label>
                  <div className="relative group">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-gradient-to-br from-green-100 to-green-200 rounded-xl flex items-center justify-center transition-all duration-200 group-focus-within:from-green-500 group-focus-within:to-green-600">
                      <Mail className="w-4 h-4 text-green-600 group-focus-within:text-white transition-colors duration-200" />
                    </div>
                    <input 
                      type="email" 
                      value={email} 
                      onChange={(e) => setEmail(e.target.value)} 
                      className="w-full pl-14 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-green-500/20 focus:border-green-500 outline-none transition-all duration-200 text-sm font-medium bg-gray-50 focus:bg-white" 
                      placeholder="seu@email.com" 
                      required 
                    />
                  </div>
                </div>
              ) : (
                <div className="animate-fadeIn">
                  <label className="block text-xs font-bold text-gray-700 mb-2 tracking-wide">Nickname</label>
                  <div className="relative group">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center transition-all duration-200 group-focus-within:from-blue-500 group-focus-within:to-blue-600">
                      <User className="w-4 h-4 text-blue-600 group-focus-within:text-white transition-colors duration-200" />
                    </div>
                    <input 
                      type="text" 
                      value={nickname} 
                      onChange={(e) => setNickname(e.target.value.toLowerCase().replace(/\s/g, ''))} 
                      className="w-full pl-14 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all duration-200 text-sm font-medium bg-gray-50 focus:bg-white" 
                      placeholder="seunickname" 
                      required 
                    />
                  </div>
                </div>
              )}

              <div className="animate-fadeIn" style={{ animationDelay: '0.1s' }}>
                <label className="block text-xs font-bold text-gray-700 mb-2 tracking-wide">Senha</label>
                <div className="relative group">
                  <div className={`absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-gradient-to-br rounded-xl flex items-center justify-center transition-all duration-200 ${
                    tipoLogin === 'empresa' 
                      ? 'from-green-100 to-green-200 group-focus-within:from-green-500 group-focus-within:to-green-600' 
                      : 'from-blue-100 to-blue-200 group-focus-within:from-blue-500 group-focus-within:to-blue-600'
                  }`}>
                    <Lock className={`w-4 h-4 transition-colors duration-200 ${
                      tipoLogin === 'empresa' 
                        ? 'text-green-600 group-focus-within:text-white' 
                        : 'text-blue-600 group-focus-within:text-white'
                    }`} />
                  </div>
                  <input 
                    type="password" 
                    value={senha} 
                    onChange={(e) => setSenha(e.target.value)} 
                    className={`w-full pl-14 pr-4 py-3 border-2 border-gray-200 rounded-xl outline-none transition-all duration-200 text-sm font-medium bg-gray-50 focus:bg-white ${
                      tipoLogin === 'empresa' 
                        ? 'focus:ring-4 focus:ring-green-500/20 focus:border-green-500' 
                        : 'focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500'
                    }`}
                    placeholder="••••••••" 
                    required 
                    minLength={6} 
                  />
                </div>
              </div>

              {tipoLogin === 'empresa' && (
                <div className="text-right animate-fadeIn" style={{ animationDelay: '0.2s' }}>
                  <Link 
                    to="/esqueci-senha" 
                    className="text-xs font-bold text-green-600 hover:text-green-700 transition-colors duration-200 hover:underline"
                  >
                    Esqueci minha senha
                  </Link>
                </div>
              )}

              <button 
                type="submit" 
                disabled={carregando} 
                className={`w-full py-3.5 rounded-xl font-bold text-white text-sm shadow-lg transition-all duration-300 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-5 animate-fadeIn ${
                  tipoLogin === 'empresa' 
                    ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 shadow-green-500/30 hover:shadow-green-500/50' 
                    : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-blue-500/30 hover:shadow-blue-500/50'
                }`}
                style={{ animationDelay: '0.3s' }}
              >
                {carregando && <Loader2 className="w-5 h-5 animate-spin" />}
                <span>{carregando ? 'Entrando...' : 'Entrar'}</span>
              </button>
            </form>

            {tipoLogin === 'empresa' && (
              <div className="mt-5 text-center pt-5 border-t border-gray-200 animate-fadeIn" style={{ animationDelay: '0.4s' }}>
                <p className="text-sm text-gray-600 font-medium">
                  Não tem conta?{' '}
                  <Link 
                    to="/cadastro-empresa" 
                    className="text-green-600 font-bold hover:text-green-700 transition-colors duration-200 hover:underline"
                  >
                    Cadastre-se
                  </Link>
                </p>
              </div>
            )}

            {tipoLogin === 'colaborador' && (
              <div className="mt-5 pt-5 border-t border-gray-200 animate-fadeIn" style={{ animationDelay: '0.4s' }}>
                <p className="text-xs text-gray-500 text-center font-medium">
                  Esqueceu a senha? Contate o administrador.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Estilos */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Roboto+Flex:wght@400;500;600;700;800&display=swap');
        * { font-family: 'Roboto Flex', system-ui, -apple-system, sans-serif; }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
          20%, 40%, 60%, 80% { transform: translateX(5px); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px) scale(1); }
          50% { transform: translateY(-20px) scale(1.05); }
        }
        
        .animate-fadeIn { animation: fadeIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; opacity: 0; }
        .animate-scaleIn { animation: scaleIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; opacity: 0; }
        .animate-shake { animation: shake 0.5s cubic-bezier(0.36, 0.07, 0.19, 0.97); }
        .animate-float { animation: float 8s ease-in-out infinite; }
        .animate-float-delayed { animation: float 10s ease-in-out infinite; animation-delay: 2s; }
        
        .custom-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; border-radius: 2px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 2px; transition: background 0.2s; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
        
        .gradient-text {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        
        .line-clamp-1 { display: -webkit-box; -webkit-line-clamp: 1; -webkit-box-orient: vertical; overflow: hidden; }
        .shadow-md { box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05), 0 1px 3px 1px rgba(0, 0, 0, 0.1); }
        .shadow-lg { box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); }
        .shadow-xl { box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05); }
      `}</style>
    </div>
  );
}