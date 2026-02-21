// frontend/src/componentes/mensagens/MensagemSistemaAnotacao.jsx - ✅ COMPLETO

import React from 'react';
import { StickyNote, Edit2, Trash2, Clock, Eye } from 'lucide-react';
import { CORES_ANOTACAO } from '../../constantes/mensagensConstantes';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function MensagemSistemaAnotacao({ mensagem, temaEscuro }) {
  if (!mensagem) return null;

  // Determinar o tipo de ação
  const ehApagada = mensagem.eventoTipo === 'ANOTACAO_APAGADA' || mensagem.apagada;
  const ehEditada = mensagem.eventoTipo === 'ANOTACAO_EDITADA';
  const ehCriada = mensagem.eventoTipo === 'ANOTACAO_CRIADA' || mensagem.tipo === 'ANOTACAO';

  // Configuração de cor
  const corMensagem = mensagem.formatacao?.cor || mensagem.cor || 'amarelo';
  const corConfig = ehApagada 
    ? CORES_ANOTACAO.apagada 
    : (CORES_ANOTACAO[corMensagem] || CORES_ANOTACAO.amarelo);

  const formatarData = (dataIso) => {
    if (!dataIso) return '';
    try {
      return format(new Date(dataIso), "HH:mm", { locale: ptBR });
    } catch (e) {
      return '';
    }
  };

  // Estilo base
  const estiloBase = {
    margin: '12px auto',
    maxWidth: '90%',
    padding: '12px',
    borderRadius: '12px',
    borderLeft: `4px solid ${corConfig.borda}`,
    backgroundColor: temaEscuro 
      ? (ehApagada ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)')
      : (ehApagada ? '#fef2f2' : '#ecfdf5'),
    fontSize: '13px',
    opacity: ehApagada ? 0.7 : 1,
    transition: 'all 0.2s'
  };

  return (
    <div style={estiloBase}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '8px',
        paddingBottom: '8px',
        borderBottom: `1px solid ${temaEscuro ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {ehApagada ? (
            <Trash2 size={14} color="#ef4444" />
          ) : ehEditada ? (
            <Edit2 size={14} color="#f59e0b" />
          ) : (
            <StickyNote size={14} color={corConfig.borda} />
          )}
          <span style={{ 
            fontWeight: 600, 
            color: temaEscuro ? '#e9edef' : '#334155'
          }}>
            {ehApagada ? '🗑️ Anotação removida' : ehEditada ? '✏️ Anotação editada' : '📝 Nova anotação'}
          </span>
        </div>
        
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          fontSize: '11px',
          color: temaEscuro ? '#8696a0' : '#94a3b8'
        }}>
          <Clock size={10} />
          {formatarData(mensagem.enviadaEm || mensagem.criadaEm || mensagem.timestamp)}
        </div>
      </div>

      {/* Conteúdo */}
      <div style={{
        color: temaEscuro ? '#d1d7db' : '#475569',
        lineHeight: '1.5',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
        textDecoration: ehApagada ? 'line-through' : 'none',
        padding: '8px',
        background: temaEscuro ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
        borderRadius: '8px',
        fontSize: '14px'
      }}>
        {mensagem.conteudo || mensagem.mensagem || mensagem.eventoSistema || 'Conteúdo não disponível'}
      </div>

      {/* Footer - Autor */}
      <div style={{
        marginTop: '8px',
        paddingTop: '8px',
        borderTop: `1px solid ${temaEscuro ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
        fontSize: '11px',
        color: temaEscuro ? '#8696a0' : '#94a3b8',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <span>
          {ehApagada ? (
            <>
              Removida por <strong style={{color: temaEscuro ? '#d1d7db' : '#475569'}}>
                {mensagem.apagadaPor || mensagem.remetenteNome || 'Usuário'}
              </strong>
            </>
          ) : (
            <>
              Por <strong style={{color: temaEscuro ? '#d1d7db' : '#475569'}}>
                {mensagem.remetenteNome || mensagem.usuario?.nome || 'Usuário'}
              </strong>
            </>
          )}
          {ehEditada && mensagem.atualizadoEm && (
            <> • {formatarData(mensagem.atualizadoEm)}</>
          )}
        </span>

        {/* Badge de "Apenas equipe" */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
          padding: '2px 8px',
          borderRadius: '12px',
          backgroundColor: temaEscuro ? '#2a3942' : '#e2e8f0',
          color: temaEscuro ? '#aebac1' : '#64748b',
          fontSize: '10px',
          fontWeight: 600
        }}>
          <Eye size={10} />
          Apenas equipe
        </div>
      </div>
    </div>
  );
}