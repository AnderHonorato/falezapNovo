// src/componentes/mensagens/MensagemSistema.jsx

import React from 'react';
import {
  UserPlus, UserMinus, Users, Crown, Settings,
  Lock, Unlock, Archive, Star, Pin, Paperclip, Info,
  Shield, CheckCircle, AlertCircle, MessageSquare
} from 'lucide-react';
import { formatarHora } from '../../utils/mensagensHelpers';

const ICONES_EVENTOS = {
  'MEMBRO_ADICIONADO': UserPlus,
  'MEMBRO_REMOVIDO': UserMinus,
  'GRUPO_CRIADO': Users,
  'ADMIN_PROMOVIDO': Crown,
  'ADMIN_REMOVIDO': Settings,
  'CONVERSA_FINALIZADA': Lock,
  'CONVERSA_REABERTA': Unlock,
  'CONVERSA_ARQUIVADA': Archive,
  'FAVORITO_ADICIONADO': Star,
  'MENSAGEM_FIXADA': Pin,
  'MIDIA_COMPARTILHADA': Paperclip,
  'CHAMADO_INICIADO': MessageSquare,
  'CHAMADO_FINALIZADO': CheckCircle,
  'SEGURANCA_ATIVADA': Shield,
  'PADRAO': Info,
};

const CORES_EVENTOS = {
  'MEMBRO_ADICIONADO': '#10b981',
  'MEMBRO_REMOVIDO': '#ef4444',
  'GRUPO_CRIADO': '#3b82f6',
  'ADMIN_PROMOVIDO': '#f59e0b',
  'ADMIN_REMOVIDO': '#6b7280',
  'CONVERSA_FINALIZADA': '#ef4444',
  'CONVERSA_REABERTA': '#10b981',
  'CONVERSA_ARQUIVADA': '#6b7280',
  'FAVORITO_ADICIONADO': '#fbbf24',
  'MENSAGEM_FIXADA': '#3b82f6',
  'MIDIA_COMPARTILHADA': '#8b5cf6',
  'CHAMADO_INICIADO': '#10b981',
  'CHAMADO_FINALIZADO': '#3b82f6',
  'SEGURANCA_ATIVADA': '#f59e0b',
};

export default function MensagemSistema({ mensagem, tema }) {
  const texto = mensagem.mensagem || mensagem.texto || mensagem.body || 'Evento do sistema';
  const tipo = mensagem.tipoEvento || mensagem.tipo || 'PADRAO';
  const hora = mensagem.data || mensagem.timestamp || mensagem.createdAt || mensagem.criadaEm;

  const IconeEvento = ICONES_EVENTOS[tipo] || ICONES_EVENTOS['PADRAO'];
  const corEvento = CORES_EVENTOS[tipo] || tema.verde;

  return (
    <div className="flex items-center justify-center my-4 px-4 animate-fadeIn">
      <div
        className="grupo-mensagem-sistema flex items-center gap-3 px-5 py-3 rounded-2xl max-w-md shadow-sm border transition-all duration-300 hover:scale-[1.02]"
        style={{
          backgroundColor: tema.hover,
          borderColor: tema.borda
        }}
      >
        {/* Ícone com fundo colorido */}
        <div 
          className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm icon-container"
          style={{ backgroundColor: `${corEvento}20` }}
        >
          <IconeEvento className="w-4 h-4" style={{ color: corEvento }} />
        </div>

        {/* Conteúdo */}
        <div className="flex-1 min-w-0">
          <span className="text-sm text-center font-medium block break-words" style={{ color: tema.texto }}>
            {texto}
          </span>
        </div>

        {/* Hora */}
        {hora && (
          <span 
            className="text-[10px] font-bold flex-shrink-0 whitespace-nowrap" 
            style={{ color: tema.textoSecundario, opacity: 0.7 }}
          >
            {formatarHora(hora)}
          </span>
        )}
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.4s ease-out;
        }

        .grupo-mensagem-sistema:hover .icon-container {
          transform: scale(1.1);
          transition: transform 0.2s ease-out;
        }

        .icon-container {
          transition: transform 0.2s ease-out;
        }
      `}</style>
    </div>
  );
}