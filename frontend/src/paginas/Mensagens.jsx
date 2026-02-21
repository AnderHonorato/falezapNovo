// frontend/src/paginas/Mensagens.jsx - ✅ VERSÃO FINAL ATUALIZADA

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../contextos/AuthContext';
import { useTema } from '../contextos/TemaContexto';
import { useSocket } from '../contextos/SocketContext';
import api from '../servicos/api';
import toast from 'react-hot-toast';
import { MessageSquare, Sparkles, Search } from 'lucide-react';

// Componentes
import MenuLateral from '../componentes/mensagens/MenuLateral';
import ListaConversas from '../componentes/ListaConversas';
import CabecalhoChat from '../componentes/mensagens/CabecalhoChat';
import AreaMensagens from '../componentes/AreaMensagens';
import CaixaTexto from '../componentes/mensagens/CaixaTexto'; 
import PainelAnotacoes from '../componentes/mensagens/PainelAnotacoes';
import PainelMensagensFavoritas from '../componentes/mensagens/PainelMensagensFavoritas';
import ModalPerfilContato from '../componentes/ModalPerfilContato';
import ModalFecharConversa from '../componentes/ModalFecharConversa';
import ModalLimparHistorico from '../componentes/ModalLimparHistorico';
import ModalContatos from '../componentes/ModalContatos';
import ModalEnviarTemplate from '../componentes/mensagens/ModalEnviarTemplate';
import ModalNovaConversa from '../componentes/mensagens/ModalNovaConversa'; // ✅ Importando novo Modal

import './Mensagens.css';

function ordenarMensagensCronologicamente(msgs) {
  if (!msgs || msgs.length === 0) return [];
  return [...msgs].sort((a, b) => {
    const getTimestamp = (msg) => {
      const ts = msg.criadaEm || msg.enviadaEm || msg.timestamp;
      if (!ts) return 0;
      const date = new Date(ts);
      return isNaN(date.getTime()) ? 0 : date.getTime();
    };
    return getTimestamp(a) - getTimestamp(b);
  });
}

export default function Mensagens() {
  const { usuario } = useAuth(); 
  const { tema, temaEscuro } = useTema();
  const { socket, conectado } = useSocket();
  const [conversas, setConversas] = useState([]);
  const [loadingConversas, setLoadingConversas] = useState(true);
  const [conversaSelecionada, setConversaSelecionada] = useState(null);
  const [novaMensagem, setNovaMensagem] = useState('');
  const [anotacoes, setAnotacoes] = useState([]);
  const [mensagens, setMensagens] = useState([]);
  const [allMensagens, setAllMensagens] = useState([]);
  const [loadingMensagens, setLoadingMensagens] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [currentResultIndex, setCurrentResultIndex] = useState(-1);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dateRange, setDateRange] = useState([
    { startDate: null, endDate: null, key: 'selection' }
  ]);
  const [filtroAtivo, setFiltroAtivo] = useState('conversas');
  const [painelAnotacoesAberto, setPainelAnotacoesAberto] = useState(false);
  const [painelFavoritasAberto, setPainelFavoritasAberto] = useState(false);
  const [modalPerfilAberto, setModalPerfilAberto] = useState(false);
  const [modalFecharAberto, setModalFecharAberto] = useState(false);
  const [modalLimparAberto, setModalLimparAberto] = useState(false);
  
  // ✅ Estados de Modais de Contato/Conversa
  const [modalContatosAberto, setModalContatosAberto] = useState(false); // Gerenciamento
  const [modalContatosProposito, setModalContatosProposito] = useState('apenas_gerenciar'); 
  const [modalNovaConversaAberto, setModalNovaConversaAberto] = useState(false); // ✅ Seleção Simples
  
  const [replyingToMessage, setReplyingToMessage] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [modoAnotacao, setModoAnotacao] = useState(false);
  const [corAnotacao, setCorAnotacao] = useState('verde');
  const [enviandoMidia, setEnviandoMidia] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);
  const [mostrarEmojis, setMostrarEmojis] = useState(false);
  const [anchorElEmoji, setAnchorElEmoji] = useState(null);
  const [mostrarAnexos, setMostrarAnexos] = useState(false);
  const [anchorElAnexos, setAnchorElAnexos] = useState(null);
  const mensagensTemporariasRef = useRef(new Map());
  const [totalFavoritas, setTotalFavoritas] = useState(0);

  // Estados Template
  const [modalTemplateAberto, setModalTemplateAberto] = useState(false);
  const [enviandoTemplate, setEnviandoTemplate] = useState(false);

  // ✅ HANDLER PARA O MENU LATERAL (Botão de Gerenciar Contatos)
  const handleMenuLateralAction = (actionId) => {
    if (actionId === 'contatos') {
      setModalContatosProposito('apenas_gerenciar');
      setModalContatosAberto(true);
    } else if (actionId === 'configuracoes') {
      toast('Configurações: funcionalidade em breve.');
    }
  };

  // ✅ HANDLER PARA O MODAL "NOVA CONVERSA" (Lista Simples)
  const handleIniciarNovaConversa = (contato) => {
    // Verifica se já existe na lista visível
    const conversaExistente = conversas.find(c => 
      c.id === contato.id || c.numeroCliente === contato.numero
    );

    if (conversaExistente) {
      selecionarConversa(conversaExistente);
    } else {
      // Seleciona o contato como uma conversa (o backend deve lidar ou criar a sessão ao enviar msg)
      selecionarConversa(contato);
      // Opcional: Adicionar visualmente à lista
      setConversas(prev => {
        const existe = prev.some(c => c.id === contato.id);
        return existe ? prev : [contato, ...prev];
      });
    }
    toast.success(`Conversando com ${contato.nome || contato.nomeCliente}`);
  };

  const handleAbrirModalTemplate = () => {
    setModalTemplateAberto(true);
  };

  const mensagemJaExiste = useCallback((novaMensagem, listaMensagens) => {
    return listaMensagens.some(m => {
      if (m.id === novaMensagem.id) return true;
      if (m.whatsappId && novaMensagem.whatsappId && m.whatsappId === novaMensagem.whatsappId) return true;
      if (!m.temporaria && m.conteudo === novaMensagem.conteudo && m.fromMe === novaMensagem.fromMe) {
        const diffMs = Math.abs(
          new Date(m.timestamp || m.enviadaEm || m.criadaEm) - 
          new Date(novaMensagem.timestamp || novaMensagem.enviadaEm || novaMensagem.criadaEm)
        );
        if (diffMs < 5000) return true;
      }
      return false;
    });
  }, []);

  const carregarConversas = useCallback(async () => {
    setLoadingConversas(true);
    try {
      const response = await api.get('/conversas');
      if (response.data.sucesso) {
        setConversas(response.data.conversas || []);
      }
    } catch (error) {
      console.error('❌ [Conversas] Erro ao carregar:', error);
    } finally {
      setLoadingConversas(false);
    }
  }, []); 

  // ============================================
  // ✅ SOCKET LISTENERS
  // ============================================
  useEffect(() => {
    if (!socket || !conectado) return;

    const handleNovaMensagem = (data) => {
      const mensagemNova = data.mensagem;
      if (!mensagemNova) return;

      if (conversaSelecionada && mensagemNova.conversaId === conversaSelecionada.id) {
        setMensagens(prev => {
          if (mensagemJaExiste(mensagemNova, prev)) return prev;
          
          const isFromMeEcho = mensagemNova.direcao === 'ENVIADA' || mensagemNova.fromMe;
          const semTemporarias = isFromMeEcho 
            ? prev.filter(m => !(m.temporaria && m.whatsappId === mensagemNova.whatsappId))
            : prev;

          // ✅ INCLUI MENSAGENS DE SISTEMA/ANOTAÇÃO
          return ordenarMensagensCronologicamente([...semTemporarias, { 
            ...mensagemNova, 
            criadaEm: mensagemNova.enviadaEm || mensagemNova.timestamp || new Date().toISOString() 
          }]);
        });
      }
      carregarConversas();
    };
    
    const handleMensagemAtualizada = (payload) => {
      if (conversaSelecionada && payload.conversaId === conversaSelecionada.id) {
        setMensagens(prev =>
          prev.map(m => {
            if (m.id === payload.id || (m.whatsappId && m.whatsappId === payload.whatsappId)) {
              return { ...m, statusMensagem: payload.status, lida: payload.lida };
            }
            return m;
          })
        );
      }
      carregarConversas();
    };
    
    const handleMensagemDeletada = (payload) => {
       if (conversaSelecionada && payload.conversaId === conversaSelecionada.id) {
          setMensagens(prev => prev.filter(m => m.id !== payload.id));
       }
    };

    const handleReacaoAtualizada = (payload) => {
      if (usuario && payload.usuarioId === usuario.id) return;

      if (conversaSelecionada && payload.conversaId === conversaSelecionada.id) {
        setMensagens(prev =>
          prev.map(msg => {
            if (msg.id === payload.mensagemId) {
              let reacoesAtualizadas = [...(msg.reacoes || [])];
              const idReator = payload.usuarioId || payload.remetente;

              if (!idReator) return msg;

              reacoesAtualizadas = reacoesAtualizadas.filter(r => r.id !== idReator);
              
              if (payload.emoji) {
                reacoesAtualizadas.push({
                  id: idReator, 
                  emoji: payload.emoji,
                  numeroRemetente: payload.remetente || null,
                  nomeRemetente: payload.nomeRemetente || payload.nomeUsuario || 'Usuário',
                  usuarioId: payload.usuarioId || null,
                  usuario: payload.nomeUsuario ? { nome: payload.nomeUsuario } : null
                });
              }
              
              return { ...msg, reacoes: reacoesAtualizadas };
            }
            return msg;
          })
        );
      }
    };

    socket.on('nova_mensagem', handleNovaMensagem);
    socket.on('mensagem_status_atualizada', handleMensagemAtualizada);
    socket.on('mensagem_deletada', handleMensagemDeletada);
    socket.on('reacao_atualizada', handleReacaoAtualizada);

    return () => {
      socket.off('nova_mensagem', handleNovaMensagem);
      socket.off('mensagem_status_atualizada', handleMensagemAtualizada);
      socket.off('mensagem_deletada', handleMensagemDeletada);
      socket.off('reacao_atualizada', handleReacaoAtualizada);
    };
  }, [socket, conectado, conversaSelecionada, mensagemJaExiste, carregarConversas, usuario, setMensagens]);

  useEffect(() => {
    carregarConversas();
  }, [carregarConversas]);

  useEffect(() => {
    if (conversaSelecionada && conversas.length > 0) {
      const idSelecionado = conversaSelecionada.id;
      const conversaAtualizada = conversas.find(c => c.id === idSelecionado);
      
      if (conversaAtualizada) {
        if (JSON.stringify(conversaSelecionada) !== JSON.stringify(conversaAtualizada)) {
          setConversaSelecionada(conversaAtualizada);
        }
      } else {
        setConversaSelecionada(null);
      }
    }
  }, [conversas, conversaSelecionada]);

  const carregarMensagensDaConversa = useCallback(async (conversaId) => {
    if (!conversaId) {
      setMensagens([]);
      setAllMensagens([]);
      setLoadingMensagens(false);
      return;
    }
    
    setLoadingMensagens(true);
    handleSearchClose();
    mensagensTemporariasRef.current.clear();
    
    try {
      const response = await api.get(`/mensagens/conversa/${conversaId}`);
      if (response.data.sucesso) {
        const msgs = response.data.mensagens || [];
        const mensagensOrdenadas = ordenarMensagensCronologicamente(msgs);
        setMensagens(mensagensOrdenadas);
        setAllMensagens(mensagensOrdenadas);
        
        const favoritasCount = msgs.filter(m => m.favorita).length;
        setTotalFavoritas(favoritasCount);
      } else {
        toast.error('Erro ao carregar mensagens');
      }
    } catch (error) {
      toast.error('Erro ao carregar mensagens');
    } finally {
      setLoadingMensagens(false);
    }
  }, []);

  const carregarAnotacoes = async (conversaId) => {
    try {
      // ✅ Carrega a versão completa sem filtros iniciais
      const response = await api.get(`/anotacoes/conversa/${conversaId}`);
      if (response.data.sucesso) {
        setAnotacoes(response.data.anotacoes || []);
      }
    } catch (error) {
      console.error('❌ [Anotações] Erro ao carregar:', error);
    }
  };

  const selecionarConversa = (conversa) => {
    setConversaSelecionada(conversa);
    carregarAnotacoes(conversa.id);
    carregarMensagensDaConversa(conversa.id); 
    
    if (conversa.naoLidas > 0) {
      setConversas(prevConversas => 
        prevConversas.map(c => 
          c.id === conversa.id ? { ...c, naoLidas: 0 } : c
        )
      );
    }
    
    setModoAnotacao(false);
    setNovaMensagem('');
    setReplyingToMessage(null);
  };

const enviarMensagem = async (e) => {
  if (e) e.preventDefault();
  if (!novaMensagem.trim() || enviando || !conversaSelecionada) return;
  
  setEnviando(true);
  
  const textoParaEnviar = novaMensagem.trim();
  const replyPara = replyingToMessage;
  const tempId = `temp-${Date.now()}-${Math.random()}`;
  const agora = new Date().toISOString();
  
  const mensagemTemporaria = {
    id: tempId,
    conteudo: textoParaEnviar,
    mensagem: textoParaEnviar,
    tipo: 'TEXTO',
    direcao: 'ENVIADA',
    statusMensagem: 'ENVIANDO',
    timestamp: agora,
    enviadaEm: agora,
    criadaEm: agora,
    enviadaPor: usuario?.nome || 'Você',
    lida: false,
    conversaId: conversaSelecionada.id,
    fromMe: true,
    usuarioId: usuario?.id,
    temporaria: true,
    replyTo: replyPara ? {
      id: replyPara.id,
      conteudo: replyPara.conteudo,
      tipo: replyPara.tipo,
      remetente: replyPara.remetente,
      ehMinha: replyPara.ehMinha
    } : null
  };
  
  mensagensTemporariasRef.current.set(tempId, mensagemTemporaria);
  setMensagens(prev => [...prev, mensagemTemporaria]);
  setNovaMensagem('');
  setReplyingToMessage(null); 
  
  try {
    const payload = {
      conversaId: conversaSelecionada.id,
      numero: conversaSelecionada.numeroCliente,
      mensagem: textoParaEnviar,
      tipo: 'TEXTO',
      quotedMsgId: replyPara?.whatsappId || null
    };
    
    const response = await api.post('/mensagens/enviar', payload);
    
    if (!response.data.sucesso) {
      throw new Error(response.data.erro || 'Erro desconhecido no envio');
    } else {
      
      const mensagemReal = {
        ...response.data.mensagem,
        fromMe: true,
        mensagem: response.data.mensagem.conteudo,
        criadaEm: response.data.mensagem.enviadaEm || response.data.mensagem.timestamp,
        replyTo: response.data.mensagem.replyTo || (replyPara ? {
          id: replyPara.id,
          conteudo: replyPara.conteudo,
          tipo: replyPara.tipo,
          remetente: replyPara.remetente,
          ehMinha: replyPara.ehMinha
        } : null)
      };
      
      setMensagens(prev => {
        const semTemporaria = prev.filter(m => m.id !== tempId);
        if (mensagemJaExiste(mensagemReal, semTemporaria)) {
          return semTemporaria;
        }
        return [...semTemporaria, mensagemReal];
      });
      mensagensTemporariasRef.current.delete(tempId);
    }
    
  } catch (error) {
    console.error('❌ [Envio] Erro ao enviar:', error);
    
    setMensagens(prev => 
      prev.map(m => 
        m.id === tempId 
          ? { ...m, statusMensagem: 'ERRO', erro: true }
          : m
      )
    );
  } finally {
    setEnviando(false);
    setTimeout(() => inputRef.current?.focus(), 50);
  }
};


  const handleEnviarTemplate = async ({ templateId, nomeTemplate, variaveis }) => {
    if (!conversaSelecionada) {
      toast.error('Nenhuma conversa selecionada');
      return;
    }
    try {
      setEnviandoTemplate(true);
      const response = await api.post('/mensagens/enviar-template', {
        numero: conversaSelecionada.numeroCliente,
        conversaId: conversaSelecionada.id,
        templateId: templateId, 
        nomeTemplate,
        variaveis
      });

      if (response.data.sucesso) {
        toast.success('Template enviado com sucesso!');
        setModalTemplateAberto(false);
        carregarMensagensDaConversa(conversaSelecionada.id);
        carregarConversas();
      }
    } catch (error) {
      console.error('❌ Erro ao enviar template:', error);
      toast.error(error.response?.data?.erro || 'Erro ao enviar template');
    } finally {
      setEnviandoTemplate(false);
    }
  };

  const reenviarMensagem = async (mensagemComErro) => {
    setMensagens(prev => prev.filter(m => m.id !== mensagemComErro.id));
    setNovaMensagem(mensagemComErro.conteudo);
    setTimeout(() => enviarMensagem(), 100);
  };
  
  const handleReenviarAlternativa = async (mensagem) => {
    setMensagens(prev => 
      prev.map(m => 
        m.id === mensagem.id ? { ...m, statusMensagem: 'ENVIANDO' } : m
      )
    );
    
    try {
      const payload = {
        conversaId: mensagem.conversaId,
        numero: conversaSelecionada.numeroCliente,
        mensagem: mensagem.conteudo,
        mensagemIdAntiga: mensagem.id 
      };

      const response = await api.post('/mensagens/enviar-alternativa', payload);

      if (!response.data.sucesso) {
         throw new Error(response.data.erro || 'Erro ao enviar pela alternativa');
      }
      
      toast.success('Mensagem enviada pela alternativa!');

    } catch (error) {
      toast.error(error.message || 'Falha ao reenviar');
      setMensagens(prev => 
        prev.map(m => 
          m.id === mensagem.id ? { ...m, statusMensagem: 'FALHA_JANELA_24H' } : m
        )
      );
    }
  };
  
  const handleReact = useCallback((mensagemId, emoji) => {
    if (!usuario) return;

    setMensagens(listaAntiga => {
      return listaAntiga.map(msg => {
        if (msg.id === mensagemId) {
          let reacoesAtuais = [...(msg.reacoes || [])];

          const minhaReacaoAntigaIndex = reacoesAtuais.findIndex(
            r => r.id === usuario.id
          );

          let cliqueiNoMesmoEmoji = false;
          if (minhaReacaoAntigaIndex > -1) {
            cliqueiNoMesmoEmoji = reacoesAtuais[minhaReacaoAntigaIndex].emoji === emoji;
          }

          reacoesAtuais = reacoesAtuais.filter(r => r.id !== usuario.id);

          if (!cliqueiNoMesmoEmoji) {
            reacoesAtuais.push({
              id: usuario.id, 
              emoji: emoji,
              numeroRemetente: null, 
              nomeRemetente: usuario.nome, 
              usuarioId: usuario.id,
              usuario: { nome: usuario.nome } 
            });
          }

          return { ...msg, reacoes: reacoesAtuais };
        }
        return msg;
      });
    });
  }, [usuario]);

  const handleFavorite = useCallback((mensagemId, favorita) => {
    setMensagens(prev => 
      prev.map(m => 
        m.id === mensagemId ? { ...m, favorita } : m
      )
    );
    
    setMensagens(prev => {
      const count = prev.filter(m => m.favorita).length;
      setTotalFavoritas(count);
      return prev;
    });
  }, []);

  const handleRolarParaMensagem = (mensagemId) => {
    setPainelFavoritasAberto(false);
    
    setTimeout(() => {
      const elemento = document.querySelector(`[data-message-id="${mensagemId}"]`);
      if (elemento) {
        elemento.scrollIntoView({ behavior: 'smooth', block: 'center' });
        elemento.classList.add('highlighted');
        setTimeout(() => elemento.classList.remove('highlighted'), 3000);
      }
    }, 300);
  };

  const salvarAnotacao = async (texto, cor = 'verde', anotacaoId = null) => {
    try {
      if (anotacaoId) {
        const response = await api.put(`/anotacoes/${anotacaoId}`, { texto, cor });
        if (response.data.sucesso) {
          setAnotacoes(prev => 
            prev.map(a => a.id === anotacaoId ? response.data.anotacao : a)
          );
          toast.success('Anotação atualizada!');
        }
      } else {
        const response = await api.post('/anotacoes', {
          conversaId: conversaSelecionada.id,
          texto,
          cor
        });
        if (response.data.sucesso) {
          setAnotacoes(prev => [response.data.anotacao, ...prev]); 
          toast.success('Anotação criada!');
          
          // O Socket deve cuidar de mostrar a mensagem no chat, mas podemos forçar um refresh se necessário
          // carregarMensagensDaConversa(conversaSelecionada.id); 
        }
      }
    } catch (error) {
      toast.error('Erro ao salvar anotação');
    }
  };

  const deletarAnotacao = async (anotacaoId) => {
    try {
      const response = await api.delete(`/anotacoes/${anotacaoId}`);
      if (response.data.sucesso) {
        setAnotacoes(prev => prev.filter(a => a.id !== anotacaoId));
        toast.success('Anotação deletada!');
      }
    } catch (error) {
      toast.error('Erro ao deletar anotação');
    }
  };

  const fecharConversa = async () => {
    try {
      const response = await api.post(`/conversas/${conversaSelecionada.id}/fechar`);
      if (response.data.sucesso) {
        toast.success('Conversa encerrada!');
        setModalFecharAberto(false);
        setConversaSelecionada(null);
        carregarConversas();
      }
    } catch (error) {
      toast.error('Erro ao fechar conversa');
    }
  };
  
  const limparHistorico = async () => {
    if (!conversaSelecionada) return;
    try {
      setMensagens([]);
      setAllMensagens([]);
      toast.success('Histórico limpo!');
      setModalLimparAberto(false);
    } catch (error) {
      toast.error('Erro ao limpar histórico');
    }
  };

  const handleAnexar = (tipo) => {
    toast.info(`Anexando ${tipo}... (em desenvolvimento)`);
  };
  
  const onToggleModoAnotacao = () => {
    setModoAnotacao(prev => !prev);
    setReplyingToMessage(null);
    setTimeout(() => inputRef.current?.focus(), 50);
  };
  
  const onCriarAnotacao = () => {
    if (!novaMensagem.trim() || !conversaSelecionada || enviando) return;
    setEnviando(true);
    salvarAnotacao(novaMensagem, corAnotacao, null)
      .finally(() => {
        setEnviando(false);
        setNovaMensagem('');
        setTimeout(() => inputRef.current?.focus(), 50);
      });
  };
  
  const handleAbreEmoji = (e) => {
    setAnchorElEmoji(e.currentTarget);
    setMostrarEmojis(true);
  };
  
  const handleAbreAnexos = (e) => {
    setAnchorElAnexos(e.currentTarget);
    setMostrarAnexos(true);
  };
  
  const handleEmojiSelect = (emoji) => {
    const emojiChar = emoji.native || emoji;
    setNovaMensagem(val => val + emojiChar);
    setMostrarEmojis(false);
    setAnchorElEmoji(null);
    inputRef.current?.focus();
  };
  
  const handleSelectTipoAnexo = (tipo) => {
    handleAnexar(tipo);
    setMostrarAnexos(false);
    setAnchorElAnexos(null);
    inputRef.current?.focus();
  };
  
  const handleSearchSubmit = (termo) => {
    setSearchTerm(termo);
    const resultados = [];
    mensagens.forEach(msg => {
      if (msg.conteudo && (msg.tipo === 'TEXTO' || !msg.tipo || msg.tipo === 'IMAGEM' || msg.tipo === 'VIDEO')) {
        if (msg.conteudo.toLowerCase().includes(termo.toLowerCase())) {
          resultados.push(msg.id);
        }
      }
    });
    setSearchResults(resultados);
    setCurrentResultIndex(resultados.length > 0 ? 0 : -1);
  };
  
  const handleSearchNavigate = (direcao) => {
    if (searchResults.length === 0) return;
    let novoIndex = currentResultIndex;
    if (direcao === 'next') {
      novoIndex = (currentResultIndex + 1) % searchResults.length;
    } else if (direcao === 'prev') {
      novoIndex = (currentResultIndex - 1 + searchResults.length) % searchResults.length;
    }
    setCurrentResultIndex(novoIndex);
  };
  
  const handleSearchClose = () => {
    setSearchTerm('');
    setSearchResults([]);
    setCurrentResultIndex(-1);
  };
  
  const handleToggleDatePicker = () => {
    if (!showDatePicker) {
        setMensagens(allMensagens);
        setDateRange([{ startDate: null, endDate: null, key: 'selection' }]);
    }
    setShowDatePicker(!showDatePicker);
  }
  
  const handleDateSelect = (ranges) => {
    const selection = ranges.selection || ranges[0];
    setDateRange([selection]); 
    const filtradas = allMensagens.filter(msg => {
      const msgDate = new Date(msg.criadaEm || msg.createdAt);
      const startDate = selection.startDate;
      const endDate = selection.endDate;
      if (startDate) startDate.setHours(0, 0, 0, 0);
      if (endDate) endDate.setHours(23, 59, 59, 999);
      if (startDate && endDate) {
         return msgDate >= startDate && msgDate <= endDate;
      }
      return true;
    });
    setMensagens(filtradas);
    handleSearchClose();
  };

  const handleAdicionarContatoCabecalho = (conversa) => {
    setModalContatosProposito('apenas_gerenciar'); 
    setModalContatosAberto(true);
    toast('Adicione este contato na lista abaixo.');
  };

  const handleAtualizarConversa = (conversaAtualizada) => {
    setConversaSelecionada(conversaAtualizada);
    setConversas(prev => 
      prev.map(c => c.id === conversaAtualizada.id ? conversaAtualizada : c)
    );
    carregarConversas();
  };

  const highlightedId = searchResults[currentResultIndex] || null;

  return (
    <div 
      className={`mensagens-container ${temaEscuro ? '' : 'light-theme'}`}
    >
      <MenuLateral
        secaoAtiva={filtroAtivo}
        setSecaoAtiva={setFiltroAtivo}
        onMenuAction={handleMenuLateralAction} // ✅ Gerencia Contatos aqui
      />

      <div className="mensagens-sidebar-lista">
        <ListaConversas
          conversaSelecionada={conversaSelecionada}
          onSelecionarConversa={selecionarConversa}
          conversas={conversas} 
          loading={loadingConversas}
          carregarConversas={carregarConversas}
          filtroAtivo={filtroAtivo}
          setFiltroAtivo={setFiltroAtivo}
          onAbrirContatos={() => {
            // Callback legado caso necessário, mas o botão usa onNovaConversa agora
            setModalContatosProposito('apenas_gerenciar');
            setModalContatosAberto(true);
          }}
          onNovaConversa={() => setModalNovaConversaAberto(true)} // ✅ Abre o modal simplificado
        />
      </div>

      <div className="mensagens-main">
        {conversaSelecionada ? (
          <>
            <CabecalhoChat
              conversa={conversaSelecionada}
              totalMensagens={mensagens.length}
              totalAnotacoes={anotacoes.length}
              totalFavoritas={totalFavoritas}
              onAbrirPerfil={() => setModalPerfilAberto(true)}
              onFecharConversa={() => setModalFecharAberto(true)}
              onAbrirPainelAnotacoes={() => setPainelAnotacoesAberto(true)}
              onAbrirPainelFavoritas={() => setPainelFavoritasAberto(true)}
              onLimparHistorico={() => setModalLimparAberto(true)}
              onSearchSubmit={handleSearchSubmit}
              onSearchNavigate={handleSearchNavigate}
              onSearchClose={handleSearchClose}
              searchResults={{ 
                current: currentResultIndex + 1, 
                total: searchResults.length 
              }}
              onToggleDatePicker={handleToggleDatePicker}
              onAdicionarContato={handleAdicionarContatoCabecalho}
            />
            
            {showDatePicker && (
               <div style={{ 
                 position: 'absolute', 
                 zIndex: 102, 
                 top: 64,
                 right: 16,
                 border: '1px solid #ccc',
                 boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
               }}>
                <div style={{ padding: 20, background: 'white', color: 'black' }}>
                   Seu DateRangePicker vai aqui.
                   <button onClick={() => setShowDatePicker(false)}>Fechar</button>
                </div>
              </div>
            )}

            <AreaMensagens
              conversa={conversaSelecionada}
              usuario={usuario}
              mensagens={mensagens}
              loading={loadingMensagens} 
              searchTerm={searchTerm}
              highlightedId={highlightedId}
              onReply={setReplyingToMessage}
              onDelete={deletarAnotacao}
              carregarConversas={() => carregarMensagensDaConversa(conversaSelecionada?.id)}
              onReenviar={reenviarMensagem}
              onReact={handleReact}
              onFavorite={handleFavorite}
              onReenviarAlternativa={handleReenviarAlternativa} 
            />

            <CaixaTexto
              valor={novaMensagem}
              setValor={setNovaMensagem}
              onEnviar={enviarMensagem}
              modoAnotacao={modoAnotacao}
              onToggleModoAnotacao={onToggleModoAnotacao}
              corAnotacao={corAnotacao}
              setCorAnotacao={setCorAnotacao}
              replyingTo={replyingToMessage}
              setReplyingTo={setReplyingToMessage}
              enviando={enviando}
              enviandoMidia={enviandoMidia}
              tema={tema} 
              inputRef={inputRef}
              fileInputRef={fileInputRef}
              onCriarAnotacao={onCriarAnotacao}
              mostrarEmojis={mostrarEmojis}
              setMostrarEmojis={setMostrarEmojis}
              anchorElEmoji={anchorElEmoji}
              setAnchorElEmoji={setAnchorElEmoji}
              mostrarAnexos={mostrarAnexos}
              setMostrarAnexos={setMostrarAnexos}
              anchorElAnexos={anchorElAnexos}
              setAnchorElAnexos={setAnchorElAnexos}
              isFocused={isFocused}
              setIsFocused={setIsFocused}
              handleAbreAnexos={handleAbreAnexos}
              handleAbreEmoji={handleAbreEmoji}
              handleSelectTipoAnexo={handleSelectTipoAnexo}
              handleEmojiSelect={handleEmojiSelect}
              onAbrirModalTemplate={handleAbrirModalTemplate}
              conversaSelecionada={conversaSelecionada}
            />
          </>
        ) : (
          <div className="mensagens-empty">
            <div className="mensagens-empty-content">
              <div className="mensagens-empty-icon">
                <div className="mensagens-empty-icon-wrapper">
                  <MessageSquare />
                </div>
              </div>
              <h2>FaleZap Web</h2>
              <p>
                Selecione uma conversa para começar a enviar mensagens ou inicie uma nova conversa com seus clientes.
              </p>
              <div className="mensagens-empty-actions">
                {/* ✅ Botão de Estado Vazio também chama o Modal Simplificado */}
                <button 
                  className="mensagens-empty-btn mensagens-empty-btn-primary"
                  onClick={() => setModalNovaConversaAberto(true)}
                >
                  <Sparkles className="w-5 h-5" />
                  Nova Conversa
                </button>
                <button 
                  className="mensagens-empty-btn mensagens-empty-btn-secondary"
                  onClick={() => toast('Funcionalidade em desenvolvimento')}
                >
                  <Search className="w-5 h-5" />
                  Buscar Conversas
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <PainelAnotacoes
        aberto={painelAnotacoesAberto}
        onFechar={() => setPainelAnotacoesAberto(false)}
        anotacoes={anotacoes}
        onSalvarAnotacao={salvarAnotacao}
        onDeletarAnotacao={deletarAnotacao}
        conversaSelecionada={conversaSelecionada}
        usuarioAtual={usuario}
      />

      <PainelMensagensFavoritas
        aberto={painelFavoritasAberto}
        onFechar={() => setPainelFavoritasAberto(false)}
        conversaSelecionada={conversaSelecionada}
        onMensagemClick={handleRolarParaMensagem}
      />

      {modalPerfilAberto && (
        <ModalPerfilContato
          isOpen={modalPerfilAberto}
          onClose={() => setModalPerfilAberto(false)}
          contato={conversaSelecionada}
          onAtualizarContato={handleAtualizarConversa}
        />
      )}
      
      {modalFecharAberto && (
        <ModalFecharConversa
          isOpen={modalFecharAberto}
          onClose={() => setModalFecharAberto(false)}
          onConfirm={fecharConversa}
          nomeContato={conversaSelecionada?.nomeCliente}
        />
      )}
      
      {modalLimparAberto && (
        <ModalLimparHistorico
          isOpen={modalLimparAberto}
          onClose={() => setModalLimparAberto(false)}
          onConfirm={limparHistorico}
          nomeContato={conversaSelecionada?.nomeCliente}
        />
      )}
      
      {/* Modal de Gerenciamento de Contatos (Aberto pelo Menu Lateral) */}
      {modalContatosAberto && (
        <ModalContatos
          isOpen={modalContatosAberto}
          onClose={() => setModalContatosAberto(false)}
          proposito={modalContatosProposito}
          onContatoCriado={(contato) => {
            setConversas(prev => [contato, ...prev]);
          }}
          onContatoSelecionado={(contato) => {
            toast.success(`Iniciando conversa com ${contato.nomeContato || contato.nomeCliente}`);
            setConversas(prev => {
              const existe = prev.some(c => c.id === contato.id);
              return existe ? prev.map(c => c.id === contato.id ? contato : c) : [contato, ...prev];
            });
            selecionarConversa(contato);
          }}
        />
      )}

      {/* ✅ Modal de Nova Conversa (Lista Simples) */}
      {modalNovaConversaAberto && (
        <ModalNovaConversa
          isOpen={modalNovaConversaAberto}
          onClose={() => setModalNovaConversaAberto(false)}
          onConversar={handleIniciarNovaConversa}
        />
      )}

      <ModalEnviarTemplate
        isOpen={modalTemplateAberto}
        onClose={() => setModalTemplateAberto(false)}
        onEnviar={handleEnviarTemplate}
        enviando={enviandoTemplate}
        conversaSelecionada={conversaSelecionada}
      />

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Roboto+Flex:wght@400;500;600;700;800&display=swap');
        * {
          font-family: 'Roboto Flex', system-ui, -apple-system, sans-serif;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }
        body {
          overflow: hidden;
        }
      `}</style>
    </div>
  );
}