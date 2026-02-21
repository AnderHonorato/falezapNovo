// frontend/src/paginas/ResetarSenha.jsx - Material Design 3 Expressive
import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Lock, CheckCircle, ArrowLeft, Eye, EyeOff, Loader2, MessageSquare } from 'lucide-react';
import api from '../servicos/api';
import toast from 'react-hot-toast';

export default function ResetarSenha() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarNovaSenha, setConfirmarNovaSenha] = useState('');
  const [mostrarSenhas, setMostrarSenhas] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [sucesso, setSucesso] = useState('');

  useEffect(() => {
    if (!token || token.length < 64) {
      toast.error('Link de redefinição inválido ou expirado.');
      navigate('/esqueci-senha', { replace: true });
    }
  }, [token, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    toast.dismiss();

    if (novaSenha !== confirmarNovaSenha) {
      toast.error('As novas senhas não coincidem.');
      return;
    }
    if (novaSenha.length < 6) {
      toast.error('A nova senha deve ter no mínimo 6 caracteres.');
      return;
    }

    setCarregando(true);
    let toastId = toast.loading('Redefinindo senha...');

    try {
      const response = await api.post(`/auth/resetar-senha/${token}`, { 
        novaSenha, 
        confirmarNovaSenha 
      });
      setSucesso(response.data.mensagem);
      toast.success(response.data.mensagem, { id: toastId });
      setTimeout(() => navigate('/login'), 3000);
    } catch (error) {
      const erroMsg = error.response?.data?.erro || 'Não foi possível redefinir a senha.';
      toast.error(erroMsg, { id: toastId });
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4 overflow-hidden">
      <div className="max-w-md w-full animate-fadeIn">
        {/* Logo */}
        <div className="text-center mb-6">
          <Link 
            to="/"
            className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-3xl mb-4 shadow-lg shadow-green-500/30 hover:shadow-xl hover:shadow-green-500/40 transition-all duration-300 hover:scale-105 group"
          >
            <MessageSquare className="w-8 h-8 text-white group-hover:scale-110 transition-transform duration-300" />
          </Link>
          <h1 className="text-3xl font-bold gradient-text mb-1">FaleZap</h1>
          <p className="text-gray-600 text-sm font-medium">Redefinir senha</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-[28px] shadow-xl p-6 border border-gray-100 animate-scaleIn">
          <h2 className="text-2xl font-bold text-gray-900 mb-5 text-center tracking-tight">
            Crie uma Nova Senha
          </h2>

          {sucesso ? (
            <div className="text-center space-y-5 animate-scaleIn py-4">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-12 h-12 text-green-600" />
              </div>
              <p className="text-gray-600 text-sm leading-relaxed">
                {sucesso} Você será redirecionado para o login em breve.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Nova Senha */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-2 tracking-wide">
                  Nova Senha
                </label>
                <div className="relative group">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl flex items-center justify-center transition-all duration-200 group-focus-within:from-purple-500 group-focus-within:to-purple-600">
                    <Lock className="w-4 h-4 text-purple-600 group-focus-within:text-white transition-colors duration-200" />
                  </div>
                  <input
                    type={mostrarSenhas ? "text" : "password"}
                    value={novaSenha}
                    onChange={(e) => setNovaSenha(e.target.value)}
                    className="w-full pl-14 pr-12 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all duration-200 text-sm font-medium bg-gray-50 focus:bg-white"
                    placeholder="Mínimo 6 caracteres"
                    required 
                    minLength={6}
                  />
                  <button 
                    type="button" 
                    onClick={() => setMostrarSenhas(!mostrarSenhas)} 
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-2 rounded-lg hover:bg-gray-100"
                  >
                    {mostrarSenhas ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirmar Nova Senha */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-2 tracking-wide">
                  Confirme a Nova Senha
                </label>
                <div className="relative group">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl flex items-center justify-center transition-all duration-200 group-focus-within:from-purple-500 group-focus-within:to-purple-600">
                    <Lock className="w-4 h-4 text-purple-600 group-focus-within:text-white transition-colors duration-200" />
                  </div>
                  <input
                    type={mostrarSenhas ? "text" : "password"}
                    value={confirmarNovaSenha}
                    onChange={(e) => setConfirmarNovaSenha(e.target.value)}
                    className="w-full pl-14 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all duration-200 text-sm font-medium bg-gray-50 focus:bg-white"
                    placeholder="Digite a senha novamente"
                    required 
                    minLength={6}
                  />
                </div>
              </div>
              
              {/* Botão Submit */}
              <button
                type="submit"
                disabled={carregando}
                className="w-full py-3.5 rounded-xl font-bold text-white text-sm shadow-lg bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 shadow-purple-500/30 hover:shadow-purple-500/50 transition-all duration-300 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-6"
              >
                {carregando && <Loader2 className="w-5 h-5 animate-spin" />}
                {carregando ? 'Salvando...' : 'Salvar Nova Senha'}
              </button>
            </form>
          )}

          {/* Link para Login */}
          <div className="mt-5 text-center pt-5 border-t border-gray-200">
            <Link 
              to="/login" 
              className="text-sm text-gray-600 hover:text-gray-800 inline-flex items-center justify-center gap-2 font-medium transition-colors duration-200 hover:underline"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar para o Login
            </Link>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-500 mt-6 font-medium">
          © {new Date().getFullYear()} FaleZap. Todos os direitos reservados.
        </p>
      </div>

      {/* Estilos */}
      <style jsx>{`
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
        
        .animate-fadeIn { animation: fadeIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; opacity: 0; }
        .animate-scaleIn { animation: scaleIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; opacity: 0; }
        
        .gradient-text {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        
        .shadow-lg { box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); }
        .shadow-xl { box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05); }
      `}</style>
    </div>
  );
}