// frontend/src/componentes/configuracoes/ConfiguracoesFundo.jsx - NOVO

import React, { useState, useEffect } from 'react';
import { Image, Palette, Upload, Trash2, Check } from 'lucide-react';
import Modal from '../comum/Modal';

export default function ConfiguracoesFundo({ 
  isOpen, 
  onClose, 
  onSalvar,
  fundoAtual,
  tema 
}) {
  const [tipoSelecionado, setTipoSelecionado] = useState('cor'); // 'cor' ou 'imagem'
  const [corSelecionada, setCorSelecionada] = useState(fundoAtual?.cor || '#f0f2f5');
  const [imagemSelecionada, setImagemSelecionada] = useState(fundoAtual?.imagem || null);
  const [previewImagem, setPreviewImagem] = useState(null);

  const coresPreDefinidas = [
    { nome: 'Padrão', cor: '#f0f2f5' },
    { nome: 'Branco', cor: '#ffffff' },
    { nome: 'Cinza Claro', cor: '#e5e7eb' },
    { nome: 'Azul Claro', cor: '#dbeafe' },
    { nome: 'Verde Claro', cor: '#d1fae5' },
    { nome: 'Rosa Claro', cor: '#fce7f3' },
    { nome: 'Roxo Claro', cor: '#ede9fe' },
    { nome: 'Amarelo Claro', cor: '#fef3c7' },
    { nome: 'Escuro', cor: '#1f2937' },
    { nome: 'Preto', cor: '#000000' }
  ];

  const handleUploadImagem = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validar tipo
      if (!file.type.startsWith('image/')) {
        alert('Por favor, selecione uma imagem válida');
        return;
      }

      // Validar tamanho (máx 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('A imagem deve ter no máximo 5MB');
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        setImagemSelecionada(file);
        setPreviewImagem(event.target.result);
        setTipoSelecionado('imagem');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSalvar = () => {
    const config = {
      tipo: tipoSelecionado,
      cor: tipoSelecionado === 'cor' ? corSelecionada : null,
      imagem: tipoSelecionado === 'imagem' ? previewImagem : null
    };

    // Salvar no localStorage
    localStorage.setItem('whatsapp_fundo_chat', JSON.stringify(config));
    
    onSalvar(config);
    onClose();
  };

  const handleRemoverImagem = () => {
    setImagemSelecionada(null);
    setPreviewImagem(null);
    setTipoSelecionado('cor');
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 animate-fade-in"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl rounded-2xl shadow-2xl animate-scale-in overflow-hidden"
        style={{ backgroundColor: tema.fundo }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div 
          className="flex items-center justify-between p-6 border-b"
          style={{ borderColor: tema.borda }}
        >
          <h2 className="text-xl font-semibold" style={{ color: tema.texto }}>
            Personalizar Fundo do Chat
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg transition-colors"
            style={{ color: tema.textoSecundario }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = tema.hover}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <X size={20} />
          </button>
        </div>

        {/* Conteúdo */}
        <div className="p-6 space-y-6">
          {/* Abas */}
          <div className="flex gap-2">
            <button
              onClick={() => setTipoSelecionado('cor')}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium transition-all"
              style={{
                backgroundColor: tipoSelecionado === 'cor' ? `${tema.verde}20` : tema.hover,
                color: tipoSelecionado === 'cor' ? tema.verde : tema.texto,
                border: tipoSelecionado === 'cor' ? `2px solid ${tema.verde}` : 'none'
              }}
            >
              <Palette size={20} />
              <span>Cor Sólida</span>
            </button>

            <button
              onClick={() => setTipoSelecionado('imagem')}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium transition-all"
              style={{
                backgroundColor: tipoSelecionado === 'imagem' ? `${tema.verde}20` : tema.hover,
                color: tipoSelecionado === 'imagem' ? tema.verde : tema.texto,
                border: tipoSelecionado === 'imagem' ? `2px solid ${tema.verde}` : 'none'
              }}
            >
              <Image size={20} />
              <span>Imagem de Fundo</span>
            </button>
          </div>

          {/* Conteúdo - Cores */}
          {tipoSelecionado === 'cor' && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-3 block" style={{ color: tema.texto }}>
                  Cores Predefinidas
                </label>
                <div className="grid grid-cols-5 gap-3">
                  {coresPreDefinidas.map((c) => (
                    <button
                      key={c.cor}
                      onClick={() => setCorSelecionada(c.cor)}
                      className="relative h-16 rounded-xl transition-all hover:scale-105"
                      style={{
                        backgroundColor: c.cor,
                        border: corSelecionada === c.cor ? `3px solid ${tema.verde}` : '1px solid #e5e7eb'
                      }}
                      title={c.nome}
                    >
                      {corSelecionada === c.cor && (
                        <div
                          className="absolute inset-0 flex items-center justify-center"
                          style={{ color: c.cor === '#000000' || c.cor === '#1f2937' ? 'white' : tema.verde }}
                        >
                          <Check size={24} strokeWidth={3} />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-3 block" style={{ color: tema.texto }}>
                  Cor Personalizada
                </label>
                <div className="flex gap-3 items-center">
                  <input
                    type="color"
                    value={corSelecionada}
                    onChange={(e) => setCorSelecionada(e.target.value)}
                    className="w-20 h-12 rounded-lg cursor-pointer"
                  />
                  <input
                    type="text"
                    value={corSelecionada}
                    onChange={(e) => setCorSelecionada(e.target.value)}
                    className="flex-1 px-4 py-2 rounded-lg outline-none"
                    style={{
                      backgroundColor: tema.inputBg,
                      color: tema.texto,
                      border: `1px solid ${tema.borda}`
                    }}
                    placeholder="#000000"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Conteúdo - Imagem */}
          {tipoSelecionado === 'imagem' && (
            <div className="space-y-4">
              {previewImagem ? (
                <div className="relative">
                  <div
                    className="w-full h-64 rounded-xl overflow-hidden"
                    style={{ border: `2px solid ${tema.borda}` }}
                  >
                    <img
                      src={previewImagem}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <button
                    onClick={handleRemoverImagem}
                    className="absolute top-3 right-3 p-2 rounded-lg bg-red-500 text-white transition-all hover:bg-red-600"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              ) : (
                <label
                  className="flex flex-col items-center justify-center w-full h-64 rounded-xl cursor-pointer transition-all"
                  style={{
                    border: `2px dashed ${tema.borda}`,
                    backgroundColor: tema.hover
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.borderColor = tema.verde}
                  onMouseLeave={(e) => e.currentTarget.style.borderColor = tema.borda}
                >
                  <Upload size={48} style={{ color: tema.textoSecundario }} />
                  <p className="mt-4 text-sm font-medium" style={{ color: tema.texto }}>
                    Clique para selecionar uma imagem
                  </p>
                  <p className="mt-2 text-xs" style={{ color: tema.textoSecundario }}>
                    PNG, JPG ou WEBP (máx. 5MB)
                  </p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleUploadImagem}
                    className="hidden"
                  />
                </label>
              )}

              <div 
                className="p-4 rounded-lg"
                style={{ backgroundColor: `${tema.verde}10` }}
              >
                <p className="text-sm" style={{ color: tema.texto }}>
                  💡 <strong>Dica:</strong> Para melhor visualização, use imagens com resolução mínima de 1920x1080px. A imagem será ajustada automaticamente sem distorção.
                </p>
              </div>
            </div>
          )}

          {/* Preview */}
          <div>
            <label className="text-sm font-medium mb-3 block" style={{ color: tema.texto }}>
              Prévia
            </label>
            <div
              className="w-full h-32 rounded-xl flex items-center justify-center"
              style={{
                backgroundColor: tipoSelecionado === 'cor' ? corSelecionada : undefined,
                backgroundImage: tipoSelecionado === 'imagem' && previewImagem 
                  ? `url(${previewImagem})` 
                  : undefined,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                border: `2px solid ${tema.borda}`
              }}
            >
              <div
                className="px-6 py-3 rounded-xl shadow-lg"
                style={{
                  backgroundColor: tema.mensagemRecebida,
                  maxWidth: '70%'
                }}
              >
                <p className="text-sm" style={{ color: tema.texto }}>
                  Exemplo de mensagem
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-end gap-3 p-6 border-t"
          style={{ borderColor: tema.borda }}
        >
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-lg font-medium transition-colors"
            style={{
              backgroundColor: tema.hover,
              color: tema.texto
            }}
          >
            Cancelar
          </button>
          <button
            onClick={handleSalvar}
            className="px-6 py-2 rounded-lg font-medium transition-colors text-white"
            style={{ backgroundColor: tema.verde }}
          >
            Aplicar Fundo
          </button>
        </div>
      </div>
    </div>
  );
}