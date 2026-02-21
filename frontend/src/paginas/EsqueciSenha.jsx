import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, CheckCircle, ArrowLeft, Loader2, MessageSquare, Send } from 'lucide-react';
import api from '../servicos/api';
import toast from 'react-hot-toast';

export default function EsqueciSenha() {
  const [email, setEmail] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [sucesso, setSucesso] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setCarregando(true);
    try {
      await api.post('/auth/esqueci-senha', { email });
      setSucesso(true);
    } catch (error) { toast.error(error.response?.data?.erro || 'Erro ao processar'); } finally { setCarregando(false); }
  };

  return (
    <div className="h-screen w-full overflow-hidden bg-gradient-to-br from-emerald-950 via-emerald-900 to-teal-900 flex items-center justify-center p-4 relative font-sans">
      <div className="absolute top-0 left-0 w-full h-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] pointer-events-none z-0"></div>
      
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center z-10">
        <div className="flex flex-col justify-center text-white order-2 lg:order-1 animate-fadeIn">
          <div className="mb-6">
            <div className="inline-flex items-center gap-3 mb-2">
              <div className="bg-white/10 p-2 rounded-xl backdrop-blur-md border border-white/10 shadow-lg">
                <MessageSquare className="text-emerald-300 w-6 h-6" />
              </div>
              <span className="text-xl font-bold tracking-tight">FaleZap</span>
            </div>
            <h1 className="text-3xl lg:text-4xl font-extrabold leading-tight mb-2 tracking-tight text-emerald-50">Recupere sua senha.</h1>
            <p className="text-emerald-100/70 text-sm max-w-md mx-auto lg:mx-0 leading-relaxed">Não se preocupe, acontece com os melhores. Informe seu e-mail e enviaremos o link.</p>
          </div>
        </div>

        <div className="w-full max-w-md mx-auto order-1 lg:order-2">
          <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl rounded-3xl shadow-2xl shadow-black/20 p-6 lg:p-8 border border-white/20 animate-scaleIn">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-6 tracking-tight">Recuperar Senha</h2>

            {sucesso ? (
              <div className="text-center py-4 space-y-4 animate-scaleIn">
                <CheckCircle size={40} className="text-emerald-500 mx-auto" />
                <p className="text-xs text-gray-500 leading-relaxed">Instruções enviadas! Verifique sua caixa de entrada.</p>
                <Link to="/login" className="block w-full py-3 bg-emerald-600 text-white rounded-xl font-bold text-sm">Voltar ao Login</Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="relative group">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-emerald-500" />
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all dark:text-white" placeholder="seu@email.com" required />
                </div>
                <button type="submit" disabled={carregando} className="w-full py-3 bg-emerald-600 text-white rounded-xl font-bold text-sm shadow-lg flex justify-center items-center gap-2">{carregando ? <Loader2 className="animate-spin" size={16}/> : <Send size={16}/>} Enviar Link</button>
              </form>
            )}

            <div className="mt-6 pt-4 border-t text-center">
              <Link to="/login" className="text-xs text-gray-400 font-bold hover:text-emerald-600 transition-colors inline-flex items-center gap-1 uppercase tracking-widest"><ArrowLeft size={10}/> Voltar ao Login</Link>
            </div>
          </div>
        </div>
      </div>
      <style>{`
        @keyframes scaleIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        .animate-scaleIn { animation: scaleIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-fadeIn { animation: fadeIn 0.5s ease-out forwards; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}