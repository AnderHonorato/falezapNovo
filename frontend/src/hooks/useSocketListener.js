// frontend/src/hooks/useSocketListener.js - ✅ AGUARDA CONEXÃO

import { useEffect } from 'react';
import { useSocket } from '../contextos/SocketContext';
import { useAuth } from '../contextos/AuthContext';

export function useSocketListener(estados) {
  const { socket } = useSocket();
  const { usuario } = useAuth();
  
  const {
    conversaSelecionada,
    setMensagens,
    setConversas,
    messagesContainerRef,
  } = estados;

  useEffect(() => {
    // ✅ VALIDAÇÃO INICIAL
    if (!socket || !usuario?.contaId) {
      console.warn('⚠️ [SOCKET] Socket ou usuário não disponível ainda');
      return;
    }

    // ✅ AGUARDAR CONEXÃO DO SOCKET
    if (!socket.connected) {
      console.log('⏳ [SOCKET] Aguardando conexão...');
      
      const handleConnect = () => {
        console.log('✅ [SOCKET] Conectado! Registrando listeners...');
        setupListeners();
      };

      socket.once('connect', handleConnect);

      return () => {
        socket.off('connect', handleConnect);
      };
    }

    // ✅ JÁ ESTÁ CONECTADO
    console.log('🔌 [SOCKET] Já conectado, registrando listeners...');
    setupListeners();

    // ============================================
    // FUNÇÃO PARA CONFIGURAR LISTENERS
    // ============================================
    function setupListeners() {
      const salaContaId = `conta:${usuario.contaId}`;
      
      console.log('🔌 [SOCKET] Configurando listeners globais...');
      console.log(`🚪 [SOCKET] Entrando na sala: ${salaContaId}`);

      // Entrar na sala da conta
      socket.emit('entrar_sala', salaContaId);

      // ============================================
      // HANDLER: NOVA MENSAGEM
      // ============================================
      const handleNovaMensagem = (dados) => {
        console.log('\n📨 [SOCKET] Nova mensagem recebida:', dados);
        
        const { mensagem, conversa } = dados;

        if (!mensagem || !conversa) {
          console.error('❌ [SOCKET] Dados incompletos:', { mensagem, conversa });
          return;
        }

        // 1. Atualizar lista de conversas
        setConversas(prev => {
          const index = prev.findIndex(c => 
            c.id === conversa.id || 
            c.numeroCliente === conversa.numeroCliente
          );
          
          if (index >= 0) {
            // Atualizar existente
            const novasConversas = [...prev];
            novasConversas[index] = {
              ...novasConversas[index],
              ...conversa,
              ultimaMensagemEm: new Date(conversa.ultimaMensagemEm),
              naoLidas: conversa.naoLidas
            };
            
            // Mover para o topo
            const [conversaAtualizada] = novasConversas.splice(index, 1);
            return [conversaAtualizada, ...novasConversas];
          } else {
            // Adicionar nova conversa
            console.log('➕ [SOCKET] Nova conversa adicionada');
            return [conversa, ...prev];
          }
        });

        // 2. Se é a conversa atual, adicionar mensagem
        if (conversaSelecionada && 
            (conversa.numeroCliente === conversaSelecionada.numeroCliente ||
             conversa.id === conversaSelecionada.id)) {
          
          console.log('➕ [SOCKET] Adicionando mensagem na conversa atual');
          
          setMensagens(prev => {
            // Evitar duplicatas
            const existe = prev.some(m => 
              m.whatsappId === mensagem.whatsappId || 
              m.id === mensagem.id
            );
            
            if (existe) {
              console.log('⚠️ [SOCKET] Mensagem duplicada, ignorando');
              return prev;
            }
            
            // Adicionar no final
            const novasMensagens = [...prev, mensagem];
            
            // Scroll para o final
            setTimeout(() => {
              messagesContainerRef.current?.scrollTo({
                top: messagesContainerRef.current.scrollHeight,
                behavior: 'smooth'
              });
            }, 100);
            
            return novasMensagens;
          });

          // Tocar som
          try {
            const audio = new Audio('/notification.mp3');
            audio.volume = 0.3;
            audio.play().catch(() => {});
          } catch (e) {
            console.warn('⚠️ Não foi possível tocar som');
          }
        } else {
          console.log('ℹ️ [SOCKET] Mensagem de outra conversa');
        }
      };

      // ============================================
      // HANDLER: STATUS ATUALIZADO
      // ============================================
      const handleMensagemStatus = (dados) => {
        console.log('📊 [SOCKET] Status atualizado:', dados);
        
        setMensagens(prev => prev.map(msg => 
          msg.whatsappId === dados.whatsappId
            ? { 
                ...msg, 
                statusMensagem: dados.status, 
                lida: dados.lida 
              }
            : msg
        ));
      };

      // ============================================
      // HANDLER: CONVERSA ATUALIZADA
      // ============================================
      const handleConversaAtualizada = (conversa) => {
        console.log('🔄 [SOCKET] Conversa atualizada:', conversa);
        
        setConversas(prev => prev.map(c => 
          c.numeroCliente === conversa.numeroCliente ? conversa : c
        ));
      };

      // ============================================
      // REGISTRAR LISTENERS
      // ============================================
      socket.on('nova_mensagem', handleNovaMensagem);
      socket.on('mensagem_status_atualizada', handleMensagemStatus);
      socket.on('conversa_atualizada', handleConversaAtualizada);

      console.log('✅ [SOCKET] Listeners registrados com sucesso!');

      // ============================================
      // CLEANUP
      // ============================================
      return () => {
        console.log('🔌 [SOCKET] Removendo listeners...');
        socket.off('nova_mensagem', handleNovaMensagem);
        socket.off('mensagem_status_atualizada', handleMensagemStatus);
        socket.off('conversa_atualizada', handleConversaAtualizada);
        socket.emit('sair_sala', salaContaId);
        console.log(`🚪 [SOCKET] Saiu da sala: ${salaContaId}`);
      };
    }

  }, [socket, socket?.connected, usuario?.contaId, conversaSelecionada, setMensagens, setConversas, messagesContainerRef]);
}

export default useSocketListener;