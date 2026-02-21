// src/componentes/mensagens/BarraFerramentasTexto.jsx

import React, { useState } from 'react';
import { Bold, Italic, Strikethrough, Code, Type, Sparkles } from 'lucide-react';

export default function BarraFerramentasTexto({ 
  onFormatarTexto, 
  tema,
  inputRef 
}) {
  const [formatoAtivo, setFormatoAtivo] = useState({
    bold: false,
    italic: false,
    strikethrough: false,
    code: false
  });

  const [mostrarDica, setMostrarDica] = useState(null);

  const aplicarFormatacao = (tipo) => {
    if (!inputRef?.current) return;

    const textarea = inputRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const textoSelecionado = textarea.value.substring(start, end);

    if (!textoSelecionado) {
      let marcadores = '';
      switch (tipo) {
        case 'bold':
          marcadores = '**';
          break;
        case 'italic':
          marcadores = '_';
          break;
        case 'strikethrough':
          marcadores = '~';
          break;
        case 'code':
          marcadores = '```';
          break;
        default:
          return;
      }

      const novoTexto = 
        textarea.value.substring(0, start) + 
        marcadores + 
        marcadores + 
        textarea.value.substring(end);

      onFormatarTexto(novoTexto);
      
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + marcadores.length, start + marcadores.length);
      }, 0);

      return;
    }

    let textoFormatado = '';
    let novaPosicaoCursor = end;

    switch (tipo) {
      case 'bold':
        textoFormatado = `*${textoSelecionado}*`; 
        novaPosicaoCursor = end + 2;
        break;
      case 'italic':
        textoFormatado = `_${textoSelecionado}_`;
        novaPosicaoCursor = end + 2;
        break;
      case 'strikethrough':
        textoFormatado = `~${textoSelecionado}~`;
        novaPosicaoCursor = end + 2;
        break;
      case 'code':
        textoFormatado = `\`\`\`${textoSelecionado}\`\`\``;
        novaPosicaoCursor = end + 6;
        break;
      default:
        return;
    }

    const novoTexto = 
      textarea.value.substring(0, start) + 
      textoFormatado + 
      textarea.value.substring(end);

    onFormatarTexto(novoTexto);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start, novaPosicaoCursor);
    }, 0);

    // Feedback visual
    setFormatoAtivo(prev => ({
      ...prev,
      [tipo]: true
    }));

    setTimeout(() => {
      setFormatoAtivo(prev => ({
        ...prev,
        [tipo]: false
      }));
    }, 300);
  };

  const botoes = [
    { tipo: 'bold', icone: Bold, titulo: 'Negrito', atalho: 'Ctrl+B', cor: '#ef4444' },
    { tipo: 'italic', icone: Italic, titulo: 'Itálico', atalho: 'Ctrl+I', cor: '#3b82f6' },
    { tipo: 'strikethrough', icone: Strikethrough, titulo: 'Riscado', atalho: 'Ctrl+Shift+X', cor: '#f59e0b' },
    { tipo: 'code', icone: Code, titulo: 'Código', atalho: 'Ctrl+E', cor: '#8b5cf6' }
  ];

  return (
    <div 
      className="flex items-center gap-1.5 px-3 py-2 rounded-xl shadow-md border animate-slideUp"
      style={{ 
        backgroundColor: tema.hover,
        borderColor: tema.borda
      }}
    >
      {/* Ícone decorativo */}
      <div 
        className="w-7 h-7 rounded-lg flex items-center justify-center mr-1 shadow-sm"
        style={{ backgroundColor: `${tema.verde}20` }}
      >
        <Type className="w-4 h-4" style={{ color: tema.verde }} />
      </div>

      {/* Separador */}
      <div 
        className="w-px h-6 mx-1"
        style={{ backgroundColor: tema.borda }}
      />

      {/* Botões de formatação */}
      {botoes.map(({ tipo, icone: Icone, titulo, atalho, cor }) => (
        <div key={tipo} className="relative">
          <button
            onClick={() => aplicarFormatacao(tipo)}
            onMouseEnter={() => setMostrarDica(tipo)}
            onMouseLeave={() => setMostrarDica(null)}
            className={`p-2 rounded-lg transition-all duration-300 grupo-botao ${
              formatoAtivo[tipo] ? 'scale-110' : 'hover:scale-105'
            }`}
            style={{
              color: formatoAtivo[tipo] ? cor : tema.textoSecundario,
              backgroundColor: formatoAtivo[tipo] ? `${cor}20` : 'transparent',
              boxShadow: formatoAtivo[tipo] ? `0 0 0 2px ${cor}30` : 'none'
            }}
            title={`${titulo} (${atalho})`}
          >
            <Icone className="w-4 h-4 transition-transform duration-200" />
            
            {/* Efeito de brilho ao ativar */}
            {formatoAtivo[tipo] && (
              <div 
                className="absolute inset-0 rounded-lg animate-ping-once"
                style={{ backgroundColor: cor, opacity: 0.3 }}
              />
            )}
          </button>

          {/* Tooltip */}
          {mostrarDica === tipo && (
            <div 
              className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2.5 py-1.5 rounded-lg shadow-xl border whitespace-nowrap animate-fadeIn z-50"
              style={{
                backgroundColor: tema.fundo,
                borderColor: tema.borda
              }}
            >
              <div className="text-xs font-bold mb-0.5" style={{ color: tema.texto }}>
                {titulo}
              </div>
              <div 
                className="text-[10px] font-semibold px-1.5 py-0.5 rounded inline-block"
                style={{ 
                  backgroundColor: tema.hover,
                  color: tema.textoSecundario 
                }}
              >
                {atalho}
              </div>
              
              {/* Seta do tooltip */}
              <div 
                className="absolute top-full left-1/2 transform -translate-x-1/2"
                style={{
                  width: 0,
                  height: 0,
                  borderLeft: '5px solid transparent',
                  borderRight: '5px solid transparent',
                  borderTop: `5px solid ${tema.borda}`
                }}
              />
            </div>
          )}
        </div>
      ))}

      {/* Separador */}
      <div 
        className="w-px h-6 mx-1"
        style={{ backgroundColor: tema.borda }}
      />

      {/* Badge de dica */}
      <div 
        className="flex items-center gap-1.5 px-2 py-1 rounded-lg transition-all duration-300 hover:scale-105 cursor-help ml-1"
        style={{ backgroundColor: `${tema.verde}15` }}
        title="Selecione texto para formatar"
      >
        <Sparkles className="w-3.5 h-3.5" style={{ color: tema.verde }} />
        <span className="text-[10px] font-bold" style={{ color: tema.verde }}>
          Formatar
        </span>
      </div>

      <style jsx>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(5px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes ping-once {
          0% {
            opacity: 0.3;
            transform: scale(1);
          }
          100% {
            opacity: 0;
            transform: scale(1.5);
          }
        }

        .animate-slideUp {
          animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }

        .animate-ping-once {
          animation: ping-once 0.5s ease-out;
        }

        .grupo-botao:hover {
          transform: translateY(-1px);
        }

        .grupo-botao:active {
          transform: scale(0.95) translateY(0);
        }
      `}</style>
    </div>
  );
}