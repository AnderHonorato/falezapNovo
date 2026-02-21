// frontend/src/componentes/AreaMensagens.jsx - ✅ VERSÃO FINAL CORRIGIDA

import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown } from 'lucide-react';
import { useTema } from '../contextos/TemaContexto';
import MensagemItem from './MensagemItem';
import './mensagens/css/AreaMensagens.css';

export default function AreaMensagens({ 
  conversa, 
  usuario,
  mensagens = [],
  loading,   
  searchTerm,    
  highlightedId, 
  onReply,       
  onDelete,
  carregarMensagens,
  onReenviar,
  onReact,
  onPin,
  onFavorite,
  onReenviarAlternativa 
}) {
  const { temaEscuro } = useTema();
  const [mostrarBotaoRolar, setMostrarBotaoRolar] = useState(false);
  const scrollRef = useRef(null);
  const ultimaMensagemRef = useRef(null);

  useEffect(() => {
    console.log('🎨 [AreaMensagens] Mensagens atualizadas!');
    console.log('   Total:', mensagens.length);
    
    if (mensagens.length > 0) {
      console.log('   Primeira (mais antiga):');
      console.log('      ', mensagens[0]?.conteudo?.substring(0, 30));
      console.log('      ', new Date(mensagens[0]?.criadaEm || mensagens[0]?.timestamp).toLocaleString('pt-BR'));
      
      console.log('   Última (mais nova):');
      const ultima = mensagens[mensagens.length - 1];
      console.log('      ', ultima?.conteudo?.substring(0, 30));
      console.log('      ', new Date(ultima?.criadaEm || ultima?.timestamp).toLocaleString('pt-BR'));
    }
  }, [mensagens]);

  // Lógica de scroll
  useEffect(() => {
    const scrollElement = scrollRef.current;
    if (!scrollElement) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = scrollElement;
      const distanciaDoFundo = scrollHeight - scrollTop - clientHeight;
      setMostrarBotaoRolar(distanciaDoFundo > 300);
    };

    scrollElement.addEventListener('scroll', handleScroll);
    return () => scrollElement.removeEventListener('scroll', handleScroll);
  }, []);
  
  useEffect(() => {
    if (!highlightedId && !loading && mensagens.length > 0) {
      setTimeout(() => {
        rolarParaBaixo(true);
      }, 100);
    }
  }, [mensagens.length, highlightedId, loading]);

  const rolarParaBaixo = (forcado = false) => {
    if (ultimaMensagemRef.current) {
      ultimaMensagemRef.current.scrollIntoView({ 
        behavior: forcado ? 'auto' : 'smooth',
        block: 'end'
      });
    }
  };

  const agruparMensagensPorData = () => {
    if (!mensagens || mensagens.length === 0) {
      return [];
    }
    console.log('🔧 [Agrupamento] Iniciando com', mensagens.length, 'mensagens');

    const grupos = [];
    let grupoAtual = null;
    let chaveAtual = null;

    mensagens.forEach((mensagem, msgIndex) => {
      let dataValida = null;
      const possiveisTimestamps = [
        mensagem.criadaEm,
        mensagem.enviadaEm, 
        mensagem.timestamp,
        mensagem.data
      ];

      for (const ts of possiveisTimestamps) {
        if (ts) {
          const tentativa = new Date(ts);
          if (!isNaN(tentativa.getTime())) {
            dataValida = tentativa;
            break;
          }
        }
      }
      const data = dataValida || new Date();
      
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);
      const ontem = new Date(hoje);
      ontem.setDate(ontem.getDate() - 1);
      const dataMsg = new Date(data);
      dataMsg.setHours(0, 0, 0, 0);

      let chave;
      if (dataMsg.getTime() === hoje.getTime()) {
        chave = 'HOJE';
      } else if (dataMsg.getTime() === ontem.getTime()) {
        chave = 'ONTEM';
      } else {
        chave = data.toLocaleDateString('pt-BR', { 
          day: '2-digit', 
          month: '2-digit', 
          year: 'numeric' 
        });
      }

      if (chave !== chaveAtual) {
        if (grupoAtual && grupoAtual.mensagens.length > 0) {
          grupos.push(grupoAtual);
          console.log(`   ✅ Grupo "${chaveAtual}" fechado com ${grupoAtual.mensagens.length} msgs`);
        }
        grupoAtual = { chave, mensagens: [] };
        chaveAtual = chave;
        console.log(`   🆕 Novo grupo "${chave}" criado (msg ${msgIndex + 1})`);
      }
      
      grupoAtual.mensagens.push(mensagem);
    });

    if (grupoAtual && grupoAtual.mensagens.length > 0) {
      grupos.push(grupoAtual);
      console.log(`   ✅ Último grupo "${chaveAtual}" fechado com ${grupoAtual.mensagens.length} msgs`);
    }

    console.log('🔧 [Agrupamento] Concluído:', grupos.length, 'grupos criados');
    grupos.forEach((g, i) => {
      console.log(`   Grupo ${i + 1}: "${g.chave}" com ${g.mensagens.length} mensagens`);
    });

    return grupos;
  };

  if (!conversa) return null;

  const gruposMensagens = agruparMensagensPorData();

  return (
    <div className={`area-mensagens ${temaEscuro ? '' : 'light-theme'}`}>
      <div className="area-mensagens-background" />

      <div className="area-mensagens-container">
        <div className="area-mensagens-scroll" ref={scrollRef}>
          {loading ? (
            <div className="area-mensagens-loading">
              <div className="spinner" />
              <p>Carregando mensagens...</p>
            </div>
          ) : mensagens.length === 0 ? (
            <div className="area-mensagens-empty">
              <div className="empty-icon">💬</div>
              <p className="empty-text">
                Nenhuma mensagem ainda. Comece a conversa!
              </p>
            </div>
          ) : (
            <>
              {gruposMensagens.map((grupo, grupoIndex) => (
                <React.Fragment key={`${grupo.chave}-${grupoIndex}`}>
                  <div className="mensagem-separador-data">
                    <span className="data-badge">{grupo.chave}</span>
                  </div>

                  {grupo.mensagens.map((mensagem, index) => (
                    <MensagemItem
                      key={mensagem.id || `msg-${grupoIndex}-${index}`}
                      mensagem={mensagem}
                      ehMinha={
                        mensagem.fromMe === true || 
                        mensagem.direcao === 'ENVIADA' || 
                        mensagem.remetenteId === usuario?.id
                      }
                      usuario={usuario}
                      onReply={onReply}
                      onDelete={onDelete}
                      onReenviar={onReenviar}
                      searchTerm={searchTerm}
                      isHighlighted={mensagem.id === highlightedId}
                      onReact={onReact}
                      onPin={onPin}
                      onFavorite={onFavorite}
                      onReenviarAlternativa={onReenviarAlternativa}
                      conversaSelecionada={conversa}
                      todasMensagens={mensagens}
                    />
                  ))}
                </React.Fragment>
              ))}
              
              <div ref={ultimaMensagemRef} style={{ height: 1 }} />
            </>
          )}
        </div>

        {mostrarBotaoRolar && !loading && (
          <button 
            className="botao-rolar-baixo"
            onClick={() => rolarParaBaixo(false)}
            title="Rolar para baixo"
          >
            <ChevronDown size={20} />
          </button>
        )}
      </div>
    </div>
  );
}