// frontend/src/componentes/ChatInterno/VisualizarPerfilIA.jsx

import { X, Brain, Zap, Mail, MessageSquare, Code, Info, Sparkles, Database } from 'lucide-react';
import StatusIndicador from '../StatusIndicador'; 

// Informações estáticas para o perfil da IA
const INFO_IA = {
    nome: "Assistente FaleZap",
    versao: "1.0 do sistema",
    email: "IA_FALEZAP@system",
    status: "online",
    recado: "Estou aqui para otimizar seu tempo. Pergunte sobre seus dados, crie resumos ou automatize tarefas no sistema.",
    capacidades: [
        { label: "Análise Contextual", icon: <Info size={16} />, text: "Entendimento profundo do contexto e da linguagem natural." },
        { label: "Acesso a Dados", icon: <Database size={16} />, text: "Pode interagir com seus arquivos no Drive e e-mails no Gmail (se permitido)." },
        { label: "Geração de Conteúdo", icon: <Code size={16} />, text: "Auxílio em redação, resumo de documentos e criação de respostas." },
        { label: "Automatização", icon: <Zap size={16} />, text: "Capacidade de sugerir e executar ações simples no sistema (futuro)." },
    ]
};


export default function VisualizarPerfilIA({ onClose }) {
  
  const cargoStyle = { bg: '#eef2ff', text: '#4f46e5', border: '#e0e7ff' }; // Indigo Light

  return (
    <div className="embedded-panel bg-white h-full flex flex-col">
      {/* Header */}
      <div className="embedded-panel-header bg-white border-b border-gray-100 px-4 py-3 flex justify-between items-center shadow-sm z-10">
        <h3 className="font-bold text-gray-800 flex items-center gap-2">
            <Sparkles size={18} className="text-indigo-600"/> 
            Perfil da IA
        </h3>
        <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-full text-gray-500 transition-colors">
          <X size={20} />
        </button>
      </div>

      {/* Conteúdo Scrollável */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
        
        {/* Avatar e Nome */}
        <div className="flex flex-col items-center text-center mb-6">
            <div className="relative mb-3">
                <div className="w-24 h-24 rounded-full p-1 border-2 border-indigo-200 bg-white shadow-lg">
                    {/* 🧠 NOVO AVATAR: Sparkles no lugar de Brain */}
                    <div className="w-full h-full bg-indigo-600 rounded-full flex items-center justify-center text-yellow-300">
                        <Sparkles size={40} strokeWidth={1.5} />
                    </div>
                </div>
                <div className="absolute bottom-1 right-1 border-2 border-white rounded-full">
                    {/* Mantido o StatusIndicador, mas a IA é sempre 'online' */}
                    <StatusIndicador status={INFO_IA.status} tamanho="md" /> 
                </div>
            </div>
            
            <h2 className="text-xl font-bold text-gray-900">{INFO_IA.nome}</h2>
            <p className="text-sm text-gray-500 mb-3">Modelo {INFO_IA.versao}</p>

            <span 
                className="px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 shadow-sm" 
                style={{ backgroundColor: cargoStyle.bg, color: cargoStyle.text, borderColor: cargoStyle.border }}
            >
                <MessageSquare size={14} />
                Inteligência Artificial
            </span>
        </div>

        <hr className="border-gray-100 mb-6" />

        {/* Recado */}
        <div className="mb-6">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">Recado e Objetivo</label>
            <div 
                className="p-4 rounded-xl border-l-4 bg-gray-50 border-gray-200 italic text-gray-600 text-sm leading-relaxed"
                style={{ borderLeftColor: cargoStyle.text }}
            >
                <div className="flex items-start gap-2">
                    <Sparkles className="w-4 h-4 opacity-70 mt-0.5 flex-shrink-0 text-indigo-500" />
                    <p>"{INFO_IA.recado}"</p>
                </div>
            </div>
        </div>

        {/* Dicas e Capacidades */}
        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">Dicas e Capacidades Principais</label>
        <div className="space-y-4">
            {INFO_IA.capacidades.map((cap, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600 flex-shrink-0">
                        {cap.icon}
                    </div>
                    <div>
                        <span className="text-sm font-semibold text-gray-800 block">{cap.label}</span>
                        <p className="text-xs text-gray-600 mt-0.5">{cap.text}</p>
                    </div>
                </div>
            ))}
        </div>
      </div>

      {/* Footer Fixo */}
      <div className="p-4 bg-white border-t border-gray-100">
        <p className="text-xs text-gray-500 text-center">
            Esse assistente usa o Gemini API do Google para fornecer respostas inteligentes e contextuais e pode cometer erros. Por isso, é bom checar as respostas.
        </p>
      </div>
    </div>
  );
}