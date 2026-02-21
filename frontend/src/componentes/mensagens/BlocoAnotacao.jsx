// frontend/src/componentes/mensagens/BlocoAnotacao.jsx - ✅ TOTALMENTE CORRIGIDO

import React, { useState, useRef, useEffect } from 'react';
import { StickyNote, Trash2, Edit2, Clock, MessageSquareReply, ChevronDown, ChevronUp, X } from 'lucide-react';
import { CORES_ANOTACAO } from '../../constantes/mensagensConstantes';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function BlocoAnotacao({ 
  anotacao, 
  onDeletar, 
  onEditar,
  onClickMensagem,
  usuarioAtual
}) {
  const [expandida, setExpandida] = useState(false);
  const [deletando, setDeletando] = useState(false);
  const [precisaExpandir, setPrecisaExpandir] = useState(false);
  const conteudoRef = useRef(null);
  
  if (!anotacao) return null;

  // ✅ CONFIGURAÇÃO DE COR
  const corConfig = CORES_ANOTACAO[anotacao.cor] || CORES_ANOTACAO.amarelo;
  
  // ✅ VERIFICAÇÃO DE PERMISSÃO (SUPER ROBUSTA)
  const idDono = String(anotacao.usuarioId || anotacao.usuario?.id || '');
  const idEu = String(usuarioAtual?.id || '');
  
  const emailDono = anotacao.usuario?.email;
  const emailEu = usuarioAtual?.email;

  const ehMinha = (idEu && idDono === idEu) || (emailEu && emailDono === emailEu);

  // DEBUG - Descomente para ver no console
  console.log(`Nota ${anotacao.id}: Dono=${idDono} | Eu=${idEu} | Minha? ${ehMinha}`);

  // ✅ LÓGICA DE TEXTO
  const temMensagemVinculada = Boolean(
    anotacao.mensagemRespostaId || 
    anotacao.mensagemId || 
    anotacao.mensagemCitadaConteudo
  );
  const conteudo = anotacao.conteudo || anotacao.mensagem || '';
  
  // ✅ VERIFICAR SE PRECISA EXPANDIR (usando ref para medir altura real)
  useEffect(() => {
    if (conteudoRef.current && conteudo) {
      const linhas = conteudo.split('\n').length;
      const scrollHeight = conteudoRef.current.scrollHeight;
      const clientHeight = conteudoRef.current.clientHeight;
      
      // Se tem mais de 3 linhas OU o conteúdo está sendo cortado OU é muito longo
      if (linhas > 3 || scrollHeight > clientHeight + 5 || conteudo.length > 150) {
        setPrecisaExpandir(true);
      } else {
        setPrecisaExpandir(false);
      }
    }
  }, [conteudo]);

  const formatarData = (dataIso) => {
    if (!dataIso) return '';
    try {
      return format(new Date(dataIso), "dd/MM 'às' HH:mm", { locale: ptBR });
    } catch (e) {
      return '';
    }
  };

  const handleDeletarClick = (e) => {
    e.stopPropagation();
    if (!deletando) {
      setDeletando(true);
    } else {
      if (onDeletar) onDeletar(anotacao.id);
    }
  };

  return (
    <div
      className={`pa-bloco ${deletando ? 'deletando' : ''}`}
      style={{ 
        borderLeftColor: deletando ? '#ef4444' : corConfig.borda,
        backgroundColor: deletando ? undefined : (corConfig.bg ? `${corConfig.bg}20` : '#ffffff')
      }}
      onClick={() => {
        if (!deletando && temMensagemVinculada && onClickMensagem) {
          onClickMensagem(anotacao);
        }
      }}
    >
      {/* Header */}
      <div className="pa-bloco-header">
        <div className="pa-bloco-user">
          <StickyNote size={14} color={corConfig.borda} style={{marginRight: 4}} />
          <span className="truncate max-w-[140px]" title={anotacao.usuario?.nome}>
            {anotacao.usuario?.nome || 'Usuário'}
          </span>
          {ehMinha && <span style={{fontSize: '10px', opacity: 0.6, marginLeft: 4}}>(Você)</span>}
        </div>
        
        <div className="pa-bloco-date">
          <Clock size={11} style={{marginRight: 3}}/>
          {formatarData(anotacao.criadaEm || anotacao.createdAt || anotacao.data)}
        </div>
      </div>

      {/* Conteúdo */}
      <div className="pa-bloco-content">
        {temMensagemVinculada && (
          <div className="pa-bloco-reply">
             <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4, fontWeight: 'bold', fontSize: 11 }}>
               <MessageSquareReply size={12} />
               Resposta
             </div>
             <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', opacity: 0.8, fontStyle: 'italic', fontSize: 11 }}>
               "{anotacao.mensagemCitadaConteudo || '...'}"
             </div>
          </div>
        )}

        {/* Texto com controle de expansão */}
        <div 
          ref={conteudoRef}
          className={!expandida && precisaExpandir ? 'line-clamp-3' : ''}
          style={{
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            overflowWrap: 'break-word'
          }}
        >
          {conteudo}
        </div>

        {/* ✅ BOTÃO VER MAIS - SEMPRE VISÍVEL QUANDO NECESSÁRIO */}
        {precisaExpandir && (
          <button 
            className="pa-ver-mais"
            onClick={(e) => {
              e.stopPropagation();
              setExpandida(!expandida);
            }}
            title={expandida ? "Ver menos" : "Ver mais"}
          >
            {expandida ? (
              <>Ver menos <ChevronUp size={14} style={{marginLeft:4}}/></>
            ) : (
              <>Ver mais <ChevronDown size={14} style={{marginLeft:4}}/></>
            )}
          </button>
        )}

        {/* ✅ INFO DE EDIÇÃO (se foi editada) */}
        {anotacao.atualizadoEm && anotacao.atualizadoEm !== anotacao.criadaEm && (
          <div style={{
            fontSize: 10,
            color: '#94a3b8',
            marginTop: 6,
            fontStyle: 'italic',
            display: 'flex',
            alignItems: 'center',
            gap: 4
          }}>
            <Edit2 size={10} />
            Editada em {formatarData(anotacao.atualizadoEm)}
          </div>
        )}
      </div>

      {/* ✅ AÇÕES - SEMPRE VISÍVEL SE FOR O DONO */}
      {ehMinha && !deletando && (
        <div className="pa-bloco-actions">
          <button 
            className="pa-action-btn"
            onClick={(e) => {
              e.stopPropagation();
              if (onEditar) onEditar(anotacao);
            }}
            title="Editar"
          >
            <Edit2 size={15} />
          </button>
          
          <button 
            className="pa-action-btn del"
            onClick={handleDeletarClick}
            title="Deletar"
          >
            <Trash2 size={15} />
          </button>
        </div>
      )}

      {/* Overlay de Confirmação */}
      {deletando && (
        <>
          <div 
            className="pa-confirm-overlay"
            onClick={handleDeletarClick}
          >
            <Trash2 size={24} style={{ marginBottom: 8, animation: 'bounce 1s infinite' }} />
            <span style={{ fontWeight: 'bold', fontSize: 14 }}>Confirmar exclusão?</span>
            <span style={{ fontSize: 12, opacity: 0.9, marginTop: 4 }}>Toque para apagar</span>
          </div>
          
          {/* Botão Cancelar Exclusão */}
          <div 
            style={{
              position: 'absolute', 
              top: 8, 
              right: 8, 
              zIndex: 20, 
              cursor: 'pointer',
              background: 'rgba(0,0,0,0.2)',
              borderRadius: '50%',
              padding: 4,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            onClick={(e) => { 
              e.stopPropagation(); 
              setDeletando(false); 
            }}
            title="Cancelar"
          >
            <X size={16} color="white" />
          </div>
        </>
      )}
    </div>
  );
}