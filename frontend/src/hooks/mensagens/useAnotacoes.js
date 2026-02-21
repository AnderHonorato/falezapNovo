// frontend/src/hooks/mensagens/useAnotacoes.js - ✅ CORRIGIDO DEFINITIVO

import { useEffect } from 'react';
import api from '../../servicos/api';

export function useAnotacoes(usuario, estados, conversasHook) {
  const {
    conversaSelecionada,
    anotacoes, setAnotacoes,
    novaMensagem, setNovaMensagem,
    corAnotacao, setCorAnotacao,
    carregandoAnotacoes, setCarregandoAnotacoes,
    painelAnotacoesAberto, setPainelAnotacoesAberto,
    anotacaoDestacada, setAnotacaoDestacada,
    modalConfirmacao, setModalConfirmacao,
    modoAnotacao, setModoAnotacao,
    mensagens, setMensagens,
    replyingToMessage, setReplyingToMessage,
  } = estados;

  const { scrollParaBaixo } = conversasHook;

  // ============ CARREGAR ANOTAÇÕES - ✅ CORRIGIDO ============
  const carregarAnotacoes = async (numeroCliente) => {
    if (!numeroCliente) return; // ✅ Removido validação de usuario?.id
    
    try {
      setCarregandoAnotacoes(true);
      
      // ✅ CORREÇÃO CRÍTICA: Removido usuario.id da URL
      const response = await api.get(
        `/whatsapp/conversa/${encodeURIComponent(numeroCliente)}/anotacoes?incluirApagadas=true`
      );
      
      setAnotacoes(response.data.anotacoes || []);
      console.log(`✅ Carregadas ${response.data.anotacoes?.length || 0} anotações`);
    } catch (error) {
      console.error('❌ Erro ao carregar anotações:', error);
      setAnotacoes([]);
    } finally {
      setCarregandoAnotacoes(false);
    }
  };

  // ============ CRIAR ANOTAÇÃO - ✅ CORRIGIDO ============
  const criarAnotacao = async () => {
    if (!novaMensagem.trim() || !conversaSelecionada) return;
    
    try {
      console.log('📝 Criando anotação...');
      
      const payload = {
        conteudo: novaMensagem.trim(),
        cor: corAnotacao
      };

      if (replyingToMessage) {
        payload.replyParaId = replyingToMessage.internalId || replyingToMessage.id;
      }

      // ✅ CORREÇÃO CRÍTICA: Removido usuario.id da URL
      const response = await api.post(
        `/whatsapp/conversa/${encodeURIComponent(conversaSelecionada.contato)}/anotacao`,
        payload
      );
      
      const novaAnotacao = response.data.anotacao;
      
      setAnotacoes(prev => [...prev, novaAnotacao]);
      
      const anotacaoComoMensagem = {
        id: `anotacao-${novaAnotacao.id}`,
        whatsappId: `anotacao-${novaAnotacao.id}`,
        anotacaoId: novaAnotacao.id,
        tipo: 'anotacao',
        mensagem: novaAnotacao.conteudo,
        cor: novaAnotacao.cor,
        data: novaAnotacao.criadaEm,
        direcao: 'ANOTACAO',
        usuario: novaAnotacao.usuario,
        apagada: false,
        mensagemCitadaAutor: novaAnotacao.mensagemCitadaAutor,
        mensagemCitadaConteudo: novaAnotacao.mensagemCitadaConteudo,
      };
      
      setMensagens(prev => [...prev, anotacaoComoMensagem]);
      
      setNovaMensagem('');
      setCorAnotacao('amarelo');
      setModoAnotacao(false);
      setReplyingToMessage(null);
      
      if (scrollParaBaixo) {
        setTimeout(() => scrollParaBaixo(), 100);
      }
      
      console.log('✅ Anotação criada!');
    } catch (error) {
      console.error('❌ Erro ao criar anotação:', error);
      alert('Erro ao criar anotação. Tente novamente.');
    }
  };

  // ============ DELETAR ANOTAÇÃO - ✅ JÁ CORRETO ============
  const deletarAnotacao = async (anotacaoId) => {
    try {
      console.log('🗑️ Deletando anotação:', anotacaoId);
      
      // ✅ Esta rota já está correta (sem usuarioId)
      await api.delete(`/whatsapp/anotacao/${anotacaoId}`, {
        data: { apagadaPor: usuario?.nome || 'Usuário' }
      });
      
      const anotacaoAtualizada = {
        apagada: true,
        conteudo: 'Anotação Apagada',
        cor: 'apagada',
        apagadaPor: usuario?.nome,
        apagadaEm: new Date().toISOString(),
      };
      
      setAnotacoes(prev => prev.map(a => 
        a.id === anotacaoId ? { ...a, ...anotacaoAtualizada } : a
      ));
      
      setMensagens(prev => prev.map(msg => {
        if (msg.tipo === 'anotacao' && msg.anotacaoId === anotacaoId) {
          return {
            ...msg,
            mensagem: 'Anotação Apagada',
            apagada: true,
            cor: 'apagada',
            apagadaPor: usuario?.nome,
            apagadaEm: new Date().toISOString(),
          };
        }
        return msg;
      }));
      
      setModalConfirmacao({ isOpen: false, anotacaoId: null, posicao: null });
      
      console.log('✅ Anotação deletada!');
    } catch (error) {
      console.error('❌ Erro ao deletar anotação:', error);
      alert('Erro ao deletar anotação');
    }
  };

  const abrirModalDeletar = (anotacaoId, event) => {
    event?.stopPropagation();
    setModalConfirmacao({ isOpen: true, anotacaoId: anotacaoId });
  };

  const cancelarDeletar = () => {
    setModalConfirmacao({ isOpen: false, anotacaoId: null });
  };

  const confirmarDeletar = () => {
    if (modalConfirmacao.anotacaoId) {
      deletarAnotacao(modalConfirmacao.anotacaoId);
    }
  };

  const scrollParaAnotacao = (anotacaoId) => {
    const elemento = document.getElementById(`anotacao-${anotacaoId}`);
    
    if (elemento) {
      setPainelAnotacoesAberto(false);
      setAnotacaoDestacada(anotacaoId);
      elemento.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => setAnotacaoDestacada(null), 3000);
    } else {
      alert('Anotação não encontrada na conversa atual. Carregue mais mensagens se necessário.');
    }
  };

  const togglePainelAnotacoes = () => {
    setModoAnotacao(false);
    setPainelAnotacoesAberto(prev => !prev);
  };

  const ativarModoAnotacao = () => {
    setPainelAnotacoesAberto(false);
    setModoAnotacao(true);
    setNovaMensagem('');
  };

  useEffect(() => {
    if (conversaSelecionada?.contato) {
      carregarAnotacoes(conversaSelecionada.contato);
    } else {
      setAnotacoes([]);
    }
  }, [conversaSelecionada?.contato]);

  return {
    carregarAnotacoes,
    criarAnotacao,
    deletarAnotacao,
    abrirModalDeletar,
    cancelarDeletar,
    confirmarDeletar,
    scrollParaAnotacao,
    togglePainelAnotacoes,
    ativarModoAnotacao,
  };
}