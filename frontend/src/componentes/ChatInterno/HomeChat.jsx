import { Sparkles, MessageSquare, Clock, HelpCircle, Zap, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../contextos/AuthContext';

export default function HomeChat({ onNavegar }) {
    const { usuario } = useAuth();
    const primeiroNome = usuario?.nome?.split(' ')[0] || 'Visitante';

    return (
        <div className="flex flex-col h-full bg-gray-50 overflow-y-auto custom-scrollbar">
            {/* Header / Boas Vindas */}
            <div className="p-6 bg-white border-b border-gray-100">
                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    Olá, {primeiroNome}! <span className="animate-pulse">👋</span>
                </h2>
                <p className="text-gray-500 text-sm mt-1">
                    Bem-vindo à sua central de comunicação da sua equipe. O que vamos resolver hoje?
                </p>
            </div>

            <div className="p-6 space-y-6">
                
                {/* Cards de Ação Rápida */}
                <div className="grid grid-cols-2 gap-3">
                    <button 
                        onClick={() => onNavegar('conversas')}
                        className="p-4 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md hover:border-indigo-300 transition-all text-left group"
                    >
                        <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                            <MessageSquare size={20} />
                        </div>
                        <h3 className="font-bold text-gray-800 text-sm">Minhas Conversas</h3>
                        <p className="text-xs text-gray-500 mt-1">Acesse seus chats privados e histórico.</p>
                    </button>

                    <button 
                        onClick={() => onNavegar('ia')}
                        className="p-4 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md hover:border-purple-300 transition-all text-left group relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 p-2 opacity-10">
                            <Sparkles size={60} />
                        </div>
                        <div className="w-10 h-10 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center mb-3 group-hover:bg-purple-600 group-hover:text-white transition-colors relative z-10">
                            <Zap size={20} />
                        </div>
                        <h3 className="font-bold text-gray-800 text-sm relative z-10">FaleZap IA</h3>
                        <p className="text-xs text-gray-500 mt-1 relative z-10">Automação e ajuda inteligente.</p>
                    </button>
                </div>

                {/* Resumo / Dicas */}
                <div className="bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl p-5 text-white shadow-lg shadow-blue-200 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-20">
                        <ShieldCheck size={100} />
                    </div>
                    <h3 className="font-bold text-lg mb-2 relative z-10">Dica de Segurança</h3>
                    <p className="text-blue-50 text-sm leading-relaxed relative z-10 mb-4">
                        Nunca compartilhe senhas ou dados sensíveis através do chat. Utilize os canais oficiais para troca de informações críticas.
                    </p>
                    <button 
                        onClick={() => onNavegar('ajuda')}
                        className="bg-white/20 hover:bg-white/30 text-white text-xs font-bold py-2 px-4 rounded-lg transition-colors backdrop-blur-sm"
                    >
                        Central de Ajuda
                    </button>
                </div>

                {/* Atalhos Secundários */}
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                    <h4 className="font-bold text-gray-700 text-sm mb-3 flex items-center gap-2">
                        <Clock size={16} className="text-gray-400"/> Recentes & Utilidades
                    </h4>
                    <ul className="space-y-2">
                        <li 
                            onClick={() => onNavegar('grupos')}
                            className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors"
                        >
                            <span className="text-sm text-gray-600">Grupos da Equipe</span>
                            <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Ver todos</span>
                        </li>
                        <li 
                            onClick={() => onNavegar('suporte')}
                            className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors"
                        >
                            <span className="text-sm text-gray-600">Chamados de Suporte</span>
                            <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Status</span>
                        </li>
                    </ul>
                </div>
                
                <div className="text-center pt-4">
                    <p className="text-[10px] text-gray-400">FaleZap Chat v1.0.0 | Desenvolvido por Anderson Honorato • <span className="hover:text-indigo-500 cursor-pointer" onClick={() => onNavegar('ajuda')}>Precisa de ajuda?</span></p>
                </div>

            </div>
        </div>
    );
}