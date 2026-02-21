// src/componentes/StatusOnlineMembros.jsx

import React, { useState, useEffect } from 'react';
import { Users, Circle } from 'lucide-react';
import { useTema } from '../contextos/TemaContexto';
import api from '../servicos/api';

const STATUS_CORES = {
  ONLINE: '#4ade80',
  AUSENTE: '#fbbf24',
  OCUPADO: '#ef4444',
  OFFLINE: '#9ca3af'
};

export default function StatusOnlineMembros({ usuarioLogado }) {
  const tema = useTema();
  const [membros, setMembros] = useState([]);
  const [mostrarLista, setMostrarLista] = useState(false);
  const [ultimaAtualizacao, setUltimaAtualizacao] = useState(null);

  // ✅ Som de alerta
  const tocarAlerta = () => {
    try {
      const audio = new Audio('/sounds/status-change.mp3');
      audio.volume = 0.3;
      audio.play().catch(err => console.log('Erro ao tocar som:', err));
    } catch (error) {
      console.log('Som de alerta não disponível');
    }
  };

  // ✅ Efeito de piscada visual
  const [piscando, setPiscando] = useState(false);
  
  const ativarPiscada = () => {
    setPiscando(true);
    setTimeout(() => setPiscando(false), 2000);
  };

  // ✅ Carregar membros da empresa
  const carregarMembros = async () => {
    try {
      const response = await api.get('/usuarios/membros-empresa');
      const novosMembros = response.data || [];
      
      // Detectar mudanças de status
      if (membros.length > 0) {
        novosMembros.forEach(novoMembro => {
          const membroAntigo = membros.find(m => m.id === novoMembro.id);
          if (membroAntigo && membroAntigo.status !== novoMembro.status) {
            tocarAlerta();
            ativarPiscada();
          }
        });
      }
      
      setMembros(novosMembros);
      setUltimaAtualizacao(new Date());
    } catch (error) {
      console.error('Erro ao carregar membros:', error);
    }
  };

  // ✅ Polling de status a cada 30 segundos
  useEffect(() => {
    carregarMembros();
    const interval = setInterval(carregarMembros, 30000);
    return () => clearInterval(interval);
  }, []);

  const membrosOnline = membros.filter(m => m.status === 'ONLINE');
  const totalMembros = membros.length;

  return (
    <div className="relative">
      {/* Botão Principal com Animação */}
      <button
        onClick={() => setMostrarLista(!mostrarLista)}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${piscando ? 'animate-pulse' : ''}`}
        style={{
          backgroundColor: membrosOnline.length > 0 ? tema.verde : tema.hover,
          color: membrosOnline.length > 0 ? 'white' : tema.texto,
        }}
        title={`${membrosOnline.length} de ${totalMembros} online`}
      >
        <Users className="w-5 h-5" />
        <span className="text-sm font-medium">
          {membrosOnline.length}/{totalMembros}
        </span>
        {membrosOnline.length > 0 && (
          <Circle className="w-2 h-2 fill-current animate-pulse" />
        )}
      </button>

      {/* Lista de Membros */}
      {mostrarLista && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setMostrarLista(false)} 
          />
          <div
            className="absolute right-0 top-12 w-80 max-h-96 overflow-y-auto rounded-xl shadow-2xl z-50 animate-scale-in"
            style={{
              backgroundColor: tema.fundo,
              border: `1px solid ${tema.borda}`,
            }}
          >
            {/* Cabeçalho */}
            <div className="p-4 border-b" style={{ borderColor: tema.borda }}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5" style={{ color: tema.verde }} />
                  <h3 className="font-semibold" style={{ color: tema.texto }}>
                    Membros da Equipe
                  </h3>
                </div>
                <span className="text-xs px-2 py-1 rounded-full" style={{ backgroundColor: tema.hover, color: tema.textoSecundario }}>
                  {totalMembros} total
                </span>
              </div>
              {ultimaAtualizacao && (
                <p className="text-xs" style={{ color: tema.textoSecundario }}>
                  Atualizado: {ultimaAtualizacao.toLocaleTimeString('pt-BR')}
                </p>
              )}
            </div>

            {/* Lista */}
            <div className="max-h-80 overflow-y-auto scrollbar-hide">
              {membros.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8 text-center">
                  <Users className="w-12 h-12 mb-3 opacity-20" style={{ color: tema.textoSecundario }} />
                  <p className="text-sm" style={{ color: tema.textoSecundario }}>
                    Nenhum membro encontrado
                  </p>
                </div>
              ) : (
                membros.map((membro) => {
                  const corStatus = STATUS_CORES[membro.status] || STATUS_CORES.OFFLINE;
                  const isOnline = membro.status === 'ONLINE';

                  return (
                    <div
                      key={membro.id}
                      className="flex items-center gap-3 p-3 border-b transition-all"
                      style={{
                        borderColor: tema.borda,
                        backgroundColor: isOnline ? `${tema.verde}10` : 'transparent',
                      }}
                    >
                      {/* Avatar com Indicador de Status */}
                      <div className="relative flex-shrink-0">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: tema.avatar }}>
                          {membro.fotoPerfil ? (
                            <img src={membro.fotoPerfil} alt={membro.nome} className="w-full h-full rounded-full object-cover" />
                          ) : (
                            <span className="text-white font-bold text-sm">
                              {membro.nome[0].toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div 
                          className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 ${isOnline ? 'animate-pulse' : ''}`}
                          style={{ 
                            backgroundColor: corStatus,
                            borderColor: tema.fundo
                          }}
                        />
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate" style={{ color: tema.texto }}>
                          {membro.nome}
                          {membro.id === usuarioLogado?.id && (
                            <span className="ml-2 text-xs" style={{ color: tema.textoSecundario }}>(Você)</span>
                          )}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs font-medium" style={{ color: corStatus }}>
                            {membro.status === 'ONLINE' && '● Online'}
                            {membro.status === 'AUSENTE' && '○ Ausente'}
                            {membro.status === 'OCUPADO' && '⦿ Ocupado'}
                            {membro.status === 'OFFLINE' && '○ Offline'}
                          </span>
                          {membro.categoria && (
                            <>
                              <span style={{ color: tema.borda }}>•</span>
                              <span className="text-xs truncate" style={{ color: tema.textoSecundario }}>
                                {membro.categoria.nome}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}