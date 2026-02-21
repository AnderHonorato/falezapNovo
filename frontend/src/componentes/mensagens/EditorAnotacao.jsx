// frontend/src/componentes/mensagens/EditorAnotacao.jsx

import React, { useState, useEffect } from 'react';
import { Save } from 'lucide-react';
import { CORES_ANOTACAO } from '../../constantes/mensagensConstantes';

export default function EditorAnotacao({ anotacao, onSalvar, onCancelar }) {
  const [texto, setTexto] = useState('');
  // Padrão amarelo se não tiver cor definida
  const [cor, setCor] = useState('amarelo');
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (anotacao) {
      setTexto(anotacao.mensagem || anotacao.conteudo || '');
      setCor(anotacao.cor || 'amarelo');
    } else {
      setTexto('');
      setCor('amarelo');
    }
  }, [anotacao]);

  const handleSubmit = async () => {
    if (!texto.trim()) return;
    setSalvando(true);
    await onSalvar({ mensagem: texto, cor });
    setSalvando(false);
  };

  return (
    <div className="pa-editor-container">
      <textarea
        className="pa-editor-textarea"
        placeholder="Escreva sua anotação..."
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        autoFocus
        disabled={salvando}
        // Opcional: muda a borda do textarea conforme a cor escolhida
        style={{ borderColor: CORES_ANOTACAO[cor]?.borda }}
      />

      <div className="pa-editor-footer">
        {/* Seletor de Cores */}
        <div className="pa-editor-colors">
          {Object.entries(CORES_ANOTACAO)
            .filter(([chave]) => chave !== 'apagada')
            .map(([chave, valor]) => (
            <div
              key={chave}
              className={`pa-color-dot ${cor === chave ? 'selected' : ''}`}
              style={{ 
                backgroundColor: valor.bg, 
                border: `1px solid ${valor.borda}`,
                // Destaca a seleção
                transform: cor === chave ? 'scale(1.2)' : 'scale(1)',
                boxShadow: cor === chave ? '0 2px 4px rgba(0,0,0,0.2)' : 'none'
              }}
              onClick={() => setCor(chave)}
              title={`Cor ${chave}`}
            />
          ))}
        </div>

        <div className="pa-editor-actions">
          <button 
            className="pa-btn pa-btn-cancel" 
            onClick={onCancelar}
            disabled={salvando}
          >
            Cancelar
          </button>
          <button 
            className="pa-btn pa-btn-save" 
            onClick={handleSubmit}
            disabled={salvando || !texto.trim()}
            // Botão salvar na cor da nota
            style={{ 
              backgroundColor: CORES_ANOTACAO[cor]?.borda, 
              color: CORES_ANOTACAO[cor]?.texto === '#333333' ? '#000' : '#fff' 
            }}
          >
            <Save size={14} style={{marginRight: 4}} />
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
}