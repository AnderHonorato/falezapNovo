// src/componentes/NotificacoesMensagens.jsx

import React, { useState, useEffect } from 'react';
import { Bell, X, MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTema } from '../contextos/TemaContexto';

export default function NotificacoesMensagens({ notificacoes, onDismiss, onClickNotificacao }) {
  const { tema } = useTema(); // MODIFIED: Corrigido para extrair 'tema'
  const navigate = useNavigate();
  const [mostrarLista, setMostrarLista] = useState(false);

  // ✅ Som de notificação
  const tocarSom = () => {
    try {
      const audio = new Audio('/sounds/notification.mp3');
      audio.volume = 0.5;
      audio.play().catch(err => console.log('Erro ao tocar som:', err));
    } catch (error) {
      console.log('Som de notificação não disponível');
    }
  };

  // ✅ Tocar som quando nova notificação chegar
  useEffect(() => {
    if (notificacoes.length > 0) {
      // ADDED: Toca som apenas se a lista não estiver visível
      if (!mostrarLista) {
        tocarSom();
      }
    }
  }, [notificacoes.length]); // MODIFIED: Dependência simplificada

  const handleClickNotificacao = (notif) => {
    if (onClickNotificacao) {
      onClickNotificacao(notif);
    }
    navigate('/mensagens');
    setMostrarLista(false);
  };
  
  // ADDED: Fecha o dropdown se clicar fora
  useEffect(() => {
    const handleClickFora = (event) => {
      // Esta lógica é simples e pode precisar de refs se o botão estiver em outro componente
      if (mostrarLista) {
        setMostrarLista(false);
      }
    };
    
    // MODIFIED: O overlay no JSX agora trata o fechamento
    // document.addEventListener('mousedown', handleClickFora);
    // return () => {
    //   document.removeEventListener('mousedown', handleClickFora);
    // };
  }, [mostrarLista]);

  const totalNaoLidas = notificacoes.length;

  return (
    <div className="relative">
      {/* Botão Principal */}
      <button
        onClick={() => setMostrarLista(!mostrarLista)}
        className="relative flex items-center gap-2 px-3 py-2 rounded-lg transition-all hover:scale-105"
        style={{
          backgroundColor: totalNaoLidas > 0 ? tema.verde : tema.hover,
          color: totalNaoLidas > 0 ? 'white' : tema.texto,
        }}
        title={`${totalNaoLidas} mensagem${totalNaoLidas !== 1 ? 'ns' : ''} nova${totalNaoLidas !== 1 ? 's' : ''}`}
      >
        <Bell className="w-5 h-5" />
        {totalNaoLidas > 0 && (
          <span className="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold animate-bounce" style={{ backgroundColor: '#ef4444', color: 'white' }}>
            {totalNaoLidas > 9 ? '9+' : totalNaoLidas}
          </span>
        )}
      </button>

      {/* Lista de Notificações */}
      {mostrarLista && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setMostrarLista(false)} 
          />
          <div
            className="absolute right-0 top-12 w-96 max-h-96 overflow-y-auto rounded-xl shadow-2xl z-50 animate-scale-in"
            style={{
              backgroundColor: tema.fundo,
              border: `1px solid ${tema.borda}`,
            }}
          >
            {/* Cabeçalho */}
            <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: tema.borda }}>
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" style={{ color: tema.verde }} />
                <h3 className="font-semibold" style={{ color: tema.texto }}>
                  Mensagens Novas ({totalNaoLidas})
                </h3>
              </div>
              {totalNaoLidas > 0 && (
                <button
                  onClick={() => notificacoes.forEach(n => onDismiss(n.id))}
                  className="text-xs px-2 py-1 rounded hover:bg-black/5 transition"
                  style={{ color: tema.textoSecundario }}
                >
                  Limpar tudo
                </button>
              )}
            </div>

            {/* Lista */}
            <div className="max-h-80 overflow-y-auto scrollbar-hide">
              {notificacoes.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8 text-center">
                  <Bell className="w-12 h-12 mb-3 opacity-20" style={{ color: tema.textoSecundario }} />
                  <p className="text-sm" style={{ color: tema.textoSecundario }}>
                    Nenhuma notificação nova
                  </p>
                </div>
              ) : (
                notificacoes.map((notif) => (
                  <div
                    key={notif.id}
                    onClick={() => handleClickNotificacao(notif)}
                    className="flex items-start gap-3 p-3 border-b cursor-pointer transition-all hover:scale-[1.02]"
                    style={{
                      borderColor: tema.borda,
                      backgroundColor: 'transparent',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = tema.hover}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: tema.verde }}>
                      {notif.foto ? (
                        <img src={notif.foto} alt={notif.nome} className="w-full h-full rounded-full object-cover" />
                      ) : (
                        <span className="text-white font-bold text-sm">
                          {(notif.nome || 'U')[0].toUpperCase()}
                        </span>
                      )}
                    </div>

                    {/* Conteúdo */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-semibold text-sm truncate" style={{ color: tema.texto }}>
                          {notif.nome || 'Usuário'}
                        </p>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDismiss(notif.id);
                          }}
                          className="p-1 rounded hover:bg-black/10 transition flex-shrink-0"
                        >
                          <X className="w-3 h-3" style={{ color: tema.textoSecundario }} />
                        </button>
                      </div>
                      <p className="text-xs truncate mt-1" style={{ color: tema.textoSecundario }}>
                        {notif.mensagem}
                      </p>
                      <p className="text-xs mt-1" style={{ color: tema.verde }}>
                        {notif.tempo}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
      {/* ADDED: Estilos que faltavam para animação e scrollbar */}
      <style jsx>{`
        @keyframes scale-in {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-scale-in {
          animation: scale-in 0.2s ease-out;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}