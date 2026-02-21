// src/componentes/mensagens/PainelConfiguracoes.jsx

import React, { useState } from 'react';
import {
  Bell, BellOff, Volume2, VolumeX, Eye, EyeOff, Download, Upload,
  Trash2, Info, ChevronRight, Check, Sun, Settings as SettingsIcon,
  Sparkles, Zap, Shield
} from 'lucide-react';

export default function PainelConfiguracoes({
  notificacoesAtivas,
  setNotificacoesAtivas,
  tema
}) {
  const [somAtivo, setSomAtivo] = useState(true);
  const [visualizacaoImagens, setVisualizacaoImagens] = useState(true);
  const [downloadAutomatico, setDownloadAutomatico] = useState(false);
  const [confirmacoesLeitura, setConfirmacoesLeitura] = useState(true);
  const [ultimaVisualizacao, setUltimaVisualizacao] = useState(true);

  const ToggleSwitch = ({ ativo, onChange, disabled = false }) => (
    <button
      onClick={() => !disabled && onChange(!ativo)}
      className={`relative w-11 h-6 rounded-full transition-all duration-300 ${
        disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
      }`}
      style={{
        backgroundColor: ativo ? tema.verde : tema.borda
      }}
      disabled={disabled}
    >
      <div
        className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-all duration-300 ${
          ativo ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  );

  const SecaoConfiguracao = ({ titulo, icone: Icone, children, cor }) => (
    <div
      className="mb-3 rounded-xl overflow-hidden shadow-sm border animate-slideIn"
      style={{
        backgroundColor: tema.fundo,
        borderColor: tema.borda
      }}
    >
      <div
        className="px-3 py-2 border-b font-bold text-xs flex items-center gap-2"
        style={{
          borderColor: tema.borda,
          background: `linear-gradient(135deg, ${cor || tema.verde}15 0%, ${cor || tema.verde}05 100%)`
        }}
      >
        <div 
          className="w-6 h-6 rounded-lg flex items-center justify-center shadow-sm"
          style={{ backgroundColor: `${cor || tema.verde}20` }}
        >
          <Icone className="w-3.5 h-3.5" style={{ color: cor || tema.verde }} />
        </div>
        <span style={{ color: tema.texto }}>{titulo}</span>
      </div>
      <div>{children}</div>
    </div>
  );

  const ItemConfiguracao = ({ icon: Icon, titulo, descricao, children, onClick, cor, badge }) => (
    <div
      className="px-3 py-2.5 border-b last:border-b-0 flex items-center gap-2 transition-all cursor-pointer grupo-config"
      style={{ borderColor: tema.borda }}
      onClick={onClick}
    >
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm transition-all duration-300"
        style={{ backgroundColor: `${cor || tema.verde}20` }}
      >
        <Icon className="w-4 h-4" style={{ color: cor || tema.verde }} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="font-semibold text-xs" style={{ color: tema.texto }}>
            {titulo}
          </p>
          {badge && (
            <span 
              className="px-1.5 py-0.5 rounded text-[9px] font-bold shadow-sm"
              style={{
                backgroundColor: `${tema.verde}20`,
                color: tema.verde
              }}
            >
              {badge}
            </span>
          )}
        </div>
        {descricao && (
          <p className="text-[10px] mt-0.5 font-medium" style={{ color: tema.textoSecundario }}>
            {descricao}
          </p>
        )}
      </div>

      {children}

      <style jsx>{`
        .grupo-config:hover {
          background-color: ${tema.hover};
          transform: translateX(3px);
        }

        .grupo-config:hover > div:first-child {
          transform: scale(1.1);
        }
      `}</style>
    </div>
  );

  return (
    <div 
      className="h-full overflow-y-auto p-3 scrollbar-visible"
      style={{ backgroundColor: tema.bg }}
    >
      <div className="max-w-4xl mx-auto pb-6">
        {/* Cabeçalho Compacto */}
        <div className="mb-3 animate-fadeIn">
          <div className="flex items-center gap-3 mb-2">
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center shadow-md"
              style={{ 
                background: `linear-gradient(135deg, ${tema.verde} 0%, ${tema.verdeHover || tema.verde} 100%)`
              }}
            >
              <SettingsIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold" style={{ color: tema.texto }}>
                Configurações
              </h1>
              <p className="text-xs font-medium" style={{ color: tema.textoSecundario }}>
                Personalize sua experiência
              </p>
            </div>
          </div>
        </div>

        {/* Aparência */}
        <SecaoConfiguracao titulo="Aparência" icone={Sun} cor="#f59e0b">
          <ItemConfiguracao
            icon={Sun}
            titulo="Tema"
            descricao="Modo claro ativo (Tema estático do sistema)"
            cor="#f59e0b"
            badge="Padrão"
          >
            <span className="text-sm font-semibold" style={{ color: tema.textoSecundario }}>
              Claro
            </span>
          </ItemConfiguracao>
        </SecaoConfiguracao>

        {/* Notificações */}
        <SecaoConfiguracao titulo="Notificações" icone={Bell} cor="#3b82f6">
          <ItemConfiguracao
            icon={notificacoesAtivas ? Bell : BellOff}
            titulo="Notificações"
            descricao="Receber alertas de novas mensagens"
            cor={notificacoesAtivas ? tema.verde : '#ef4444'}
          >
            <ToggleSwitch ativo={notificacoesAtivas} onChange={setNotificacoesAtivas} />
          </ItemConfiguracao>

          <ItemConfiguracao
            icon={somAtivo ? Volume2 : VolumeX}
            titulo="Som de notificação"
            descricao="Reproduzir som ao receber mensagens"
            cor={somAtivo ? tema.verde : '#6b7280'}
          >
            <ToggleSwitch ativo={somAtivo} onChange={setSomAtivo} />
          </ItemConfiguracao>
        </SecaoConfiguracao>

        {/* Mídia e Arquivos */}
        <SecaoConfiguracao titulo="Mídia e Arquivos" icone={Download} cor="#8b5cf6">
          <ItemConfiguracao
            icon={visualizacaoImagens ? Eye : EyeOff}
            titulo="Pré-visualização de mídia"
            descricao="Carregar imagens e vídeos automaticamente"
            cor={visualizacaoImagens ? tema.verde : '#6b7280'}
          >
            <ToggleSwitch ativo={visualizacaoImagens} onChange={setVisualizacaoImagens} />
          </ItemConfiguracao>

          <ItemConfiguracao
            icon={downloadAutomatico ? Download : Upload}
            titulo="Download automático"
            descricao="Baixar mídias automaticamente"
            cor={downloadAutomatico ? tema.verde : '#6b7280'}
          >
            <ToggleSwitch ativo={downloadAutomatico} onChange={setDownloadAutomatico} />
          </ItemConfiguracao>
        </SecaoConfiguracao>

        {/* Privacidade */}
        <SecaoConfiguracao titulo="Privacidade e Segurança" icone={Shield} cor="#10b981">
          <ItemConfiguracao
            icon={Check}
            titulo="Confirmações de leitura"
            descricao="Enviar confirmação quando ler mensagens"
            cor="#3b82f6"
          >
            <ToggleSwitch ativo={confirmacoesLeitura} onChange={setConfirmacoesLeitura} />
          </ItemConfiguracao>

          <ItemConfiguracao
            icon={Eye}
            titulo="Última visualização"
            descricao="Mostrar quando você esteve online pela última vez"
            cor="#8b5cf6"
          >
            <ToggleSwitch ativo={ultimaVisualizacao} onChange={setUltimaVisualizacao} />
          </ItemConfiguracao>
        </SecaoConfiguracao>

        {/* Armazenamento */}
        <SecaoConfiguracao titulo="Armazenamento" icone={Trash2} cor="#ef4444">
          <ItemConfiguracao
            icon={Trash2}
            titulo="Limpar cache"
            descricao="Liberar espaço removendo arquivos temporários"
            onClick={() => {
              if (confirm('Deseja realmente limpar o cache?')) {
                alert('Cache limpo com sucesso!');
              }
            }}
            cor="#ef4444"
          >
            <ChevronRight className="w-5 h-5" style={{ color: tema.textoSecundario }} />
          </ItemConfiguracao>

          <ItemConfiguracao
            icon={Info}
            titulo="Uso de armazenamento"
            descricao="Ver quanto espaço está sendo usado"
            onClick={() => alert('Funcionalidade em desenvolvimento')}
            cor="#0088cc"
            badge="Em breve"
          >
            <ChevronRight className="w-5 h-5" style={{ color: tema.textoSecundario }} />
          </ItemConfiguracao>
        </SecaoConfiguracao>

        {/* Sobre Compacto */}
        <div
          className="rounded-xl shadow-sm border p-4 text-center animate-slideIn"
          style={{
            backgroundColor: tema.fundo,
            borderColor: tema.borda
          }}
        >
          <div
            className="w-12 h-12 rounded-xl mx-auto mb-2 flex items-center justify-center shadow-md"
            style={{ 
              background: `linear-gradient(135deg, ${tema.verde} 0%, ${tema.verdeHover || tema.verde} 100%)`
            }}
          >
            <span className="text-2xl">💬</span>
          </div>
          <h3 className="font-bold text-sm mb-1" style={{ color: tema.texto }}>
            FaleZap
          </h3>
          <p className="text-xs font-semibold mb-1" style={{ color: tema.textoSecundario }}>
            Versão 1.0.0
          </p>
          <p className="text-[10px] font-medium" style={{ color: tema.textoSecundario }}>
            © 2025 • Todos os direitos reservados
          </p>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.4s ease-out;
        }

        .animate-slideIn {
          animation: slideIn 0.4s ease-out;
        }

        .scrollbar-visible {
          scrollbar-width: thin;
          scrollbar-color: ${tema.borda} transparent;
        }

        .scrollbar-visible::-webkit-scrollbar {
          width: 10px;
        }

        .scrollbar-visible::-webkit-scrollbar-track {
          background: ${tema.hover};
          border-radius: 5px;
          margin: 4px 0;
        }

        .scrollbar-visible::-webkit-scrollbar-thumb {
          background: ${tema.borda};
          border-radius: 5px;
          border: 2px solid ${tema.hover};
        }

        .scrollbar-visible::-webkit-scrollbar-thumb:hover {
          background: ${tema.textoSecundario};
        }

        .scrollbar-visible::-webkit-scrollbar-thumb:active {
          background: ${tema.verde};
        }
      `}</style>
    </div>
  );
}