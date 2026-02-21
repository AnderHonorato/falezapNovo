// frontend/src/componentes/mensagens/HistoricoAnotacoes.jsx - ✅ NOVO

import React, { useState, useEffect } from 'react';
import { Clock, Edit2, Trash2, FileText, Loader2 } from 'lucide-react';
import { CORES_ANOTACAO } from '../../constantes/mensagensConstantes';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import api from '../../servicos/api';

export default function HistoricoAnotacoes({ conversaId, temaEscuro }) {
  const [historico, setHistorico] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (conversaId) {
      carregarHistorico();
    }
  }, [conversaId]);

  const carregarHistorico = async () => {
    if (!conversaId) return;
    setLoading(true);
    try {
      // Busca todas as anotações, incluindo apagadas
      const { data } = await api.get(`/anotacoes/${conversaId}?incluirApagadas=true`);
      
      // Filtra apenas as apagadas ou editadas
      const itensHistorico = data.anotacoes
        .filter(a => a.apagada || (a.atualizadoEm && a.atualizadoEm !== a.criadaEm))
        .sort((a, b) => {
          const dataA = new Date(a.apagadaEm || a.atualizadoEm || a.criadaEm);
          const dataB = new Date(b.apagadaEm || b.atualizadoEm || b.criadaEm);
          return dataB - dataA; // Mais recentes primeiro
        });
      
      setHistorico(itensHistorico);
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatarData = (dataIso) => {
    if (!dataIso) return '';
    try {
      return format(new Date(dataIso), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
    } catch (e) {
      return '';
    }
  };

  if (loading) {
    return (
      <div className="pa-lista">
        <div className="pa-state">
          <Loader2 size={32} className="animate-spin text-emerald-500"/>
          <span>Carregando histórico...</span>
        </div>
      </div>
    );
  }

  if (historico.length === 0) {
    return (
      <div className="pa-lista">
        <div className="pa-state">
          <FileText size={48} className="text-gray-300 mb-2"/>
          <h4>Nenhum histórico</h4>
          <p>Anotações editadas ou removidas aparecerão aqui.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pa-lista">
      {historico.map((item) => {
        const corConfig = item.apagada 
          ? CORES_ANOTACAO.apagada 
          : (CORES_ANOTACAO[item.cor] || CORES_ANOTACAO.amarelo);
        
        const foiApagada = item.apagada;
        const foiEditada = !foiApagada && item.atualizadoEm && item.atualizadoEm !== item.criadaEm;

        return (
          <div
            key={item.id}
            className="pa-historico-item"
            style={{
              borderLeft: `4px solid ${corConfig.borda}`,
              backgroundColor: foiApagada ? '#fef2f2' : '#f8fafc',
              opacity: foiApagada ? 0.7 : 1
            }}
          >
            {/* Header do item */}
            <div className="pa-historico-header">
              <div className="flex items-center gap-2">
                {foiApagada ? (
                  <Trash2 size={14} color="#ef4444" />
                ) : (
                  <Edit2 size={14} color="#f59e0b" />
                )}
                <span className="font-semibold text-sm">
                  {foiApagada ? 'Anotação removida' : 'Anotação editada'}
                </span>
              </div>
              
              <div className="text-xs text-gray-500 flex items-center gap-1">
                <Clock size={10} />
                {formatarData(foiApagada ? item.apagadaEm : item.atualizadoEm)}
              </div>
            </div>

            {/* Conteúdo */}
            <div className="pa-historico-content">
              <div 
                className="text-sm"
                style={{
                  textDecoration: foiApagada ? 'line-through' : 'none',
                  color: foiApagada ? '#6b7280' : '#475569',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word'
                }}
              >
                {item.conteudo || item.mensagem}
              </div>
            </div>

            {/* Footer - Quem fez a ação */}
            <div className="pa-historico-footer">
              <span className="text-xs text-gray-600">
                {foiApagada ? (
                  <>Por: <strong>{item.apagadaPor || item.usuario?.nome}</strong></>
                ) : (
                  <>Por: <strong>{item.usuario?.nome}</strong></>
                )}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}