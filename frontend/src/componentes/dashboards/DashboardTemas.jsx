import React, { useState, useEffect } from 'react';
import { X, RotateCcw, Palette, Type, Layout, PaintBucket, Check } from 'lucide-react';

const PRESETS = {
  fundos: [
    { nome: 'Padrão Light', valor: '#f8fafc', tipo: 'cor' },
    { nome: 'Cinza Gelo', valor: '#f3f4f6', tipo: 'cor' },
    { nome: 'Padrão Dark', valor: '#0f172a', tipo: 'cor' },
    { nome: 'Midnight', valor: '#020617', tipo: 'cor' },
    { nome: 'Deep Forest', valor: '#052e16', tipo: 'cor' },
    { nome: 'Ocean', valor: 'linear-gradient(to right, #243949 0%, #517fa4 100%)', tipo: 'gradiente' },
    { nome: 'Sunset', valor: 'linear-gradient(to right, #fa709a 0%, #fee140 100%)', tipo: 'gradiente' },
    { nome: 'Royal', valor: 'linear-gradient(to right, #141e30 0%, #243b55 100%)', tipo: 'gradiente' },
  ],
  cards: [
    { nome: 'Automático', valor: '' }, 
    { nome: 'Branco Puro', valor: '#ffffff' },
    { nome: 'Glass Light', valor: 'rgba(255, 255, 255, 0.9)' },
    { nome: 'Dark Slate', valor: '#1e293b' },
    { nome: 'Glass Dark', valor: 'rgba(30, 41, 59, 0.9)' },
    { nome: 'Preto', valor: '#000000' },
  ],
  textos: [
    { nome: 'Automático', valor: '' },
    { nome: 'Escuro', valor: '#111827' },
    { nome: 'Claro', valor: '#f9fafb' },
    { nome: 'Cinza', valor: '#6b7280' },
    { nome: 'Indigo', valor: '#4f46e5' },
  ]
};

export default function DashboardTemas({ isOpen, onClose }) {
  const [abaAtiva, setAbaAtiva] = useState('fundo');
  const [config, setConfig] = useState({ bgFundo: '', bgCard: '', corTexto: '' });

  // Carregar ao abrir
  useEffect(() => {
    if (isOpen) {
      try {
        const salvo = localStorage.getItem('falezap_temas_config');
        if (salvo) setConfig(JSON.parse(salvo));
      } catch (e) {}
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const aplicarMudanca = (chave, valor) => {
    const novaConfig = { ...config, [chave]: valor };
    setConfig(novaConfig);
    localStorage.setItem('falezap_temas_config', JSON.stringify(novaConfig));
    // Dispara evento global
    window.dispatchEvent(new Event('themeChange'));
    // Dispara evento específico para o Dashboard
    window.dispatchEvent(new Event('falezap-tema-atualizado'));
  };

  const resetarTudo = () => {
    const padrao = { bgFundo: '', bgCard: '', corTexto: '' };
    setConfig(padrao);
    localStorage.setItem('falezap_temas_config', JSON.stringify(padrao));
    window.dispatchEvent(new Event('themeChange'));
    window.dispatchEvent(new Event('falezap-tema-atualizado'));
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-black/20 backdrop-blur-[1px]" onClick={onClose}>
      {/* Janela posicionada abaixo do botão de configurações */}
      <div 
        className="absolute top-16 right-4 w-80 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-slate-700 overflow-hidden flex flex-col animate-in fade-in slide-in-from-top-2 duration-200"
        onClick={e => e.stopPropagation()}
        style={{ maxHeight: 'calc(100vh - 100px)' }}
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center bg-gray-50/90 dark:bg-slate-800/90 backdrop-blur-md">
          <h3 className="font-bold text-gray-800 dark:text-white flex items-center gap-2 text-sm">
            <Palette className="w-4 h-4 text-indigo-500" /> Personalizar Visual
          </h3>
          <div className="flex gap-1">
            <button onClick={resetarTudo} title="Restaurar Padrão" className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors"><RotateCcw className="w-3.5 h-3.5" /></button>
            <button onClick={onClose} className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"><X className="w-3.5 h-3.5" /></button>
          </div>
        </div>

        {/* Abas */}
        <div className="flex border-b border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 sticky top-0 z-10">
          {['fundo', 'cards', 'texto'].map(aba => (
            <button key={aba} onClick={() => setAbaAtiva(aba)} className={`flex-1 py-3 text-[10px] uppercase font-bold flex items-center justify-center gap-1 border-b-2 transition-colors ${abaAtiva === aba ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-gray-400 hover:text-gray-600 dark:hover:text-slate-300'}`}>
              {aba === 'fundo' && <Layout className="w-3 h-3"/>}
              {aba === 'cards' && <PaintBucket className="w-3 h-3"/>}
              {aba === 'texto' && <Type className="w-3 h-3"/>}
              {aba}
            </button>
          ))}
        </div>

        {/* Conteúdo */}
        <div className="p-4 overflow-y-auto custom-scrollbar flex-1 bg-white dark:bg-slate-900">
          
          {abaAtiva === 'fundo' && (
            <div className="space-y-4">
              <div className="grid grid-cols-4 gap-2">
                {PRESETS.fundos.map((item, idx) => (
                  <button key={idx} onClick={() => aplicarMudanca('bgFundo', item.valor)} className="w-full aspect-square rounded-lg shadow-sm border border-gray-200 relative overflow-hidden hover:scale-105 transition-transform" style={{ background: item.valor }} title={item.nome}>
                    {config.bgFundo === item.valor && <div className="absolute inset-0 flex items-center justify-center bg-black/20"><Check className="w-4 h-4 text-white" /></div>}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-3 bg-gray-50 dark:bg-slate-800 p-2 rounded-xl border border-gray-200 dark:border-slate-700">
                <input type="color" value={config.bgFundo && !config.bgFundo.includes('gradient') ? config.bgFundo : '#ffffff'} onChange={(e) => aplicarMudanca('bgFundo', e.target.value)} className="w-8 h-8 rounded cursor-pointer border-none bg-transparent" />
                <span className="text-xs font-bold text-gray-600 dark:text-slate-300">Cor Personalizada</span>
              </div>
            </div>
          )}

          {abaAtiva === 'cards' && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-2">
                {PRESETS.cards.map((item, idx) => (
                  <button key={idx} onClick={() => aplicarMudanca('bgCard', item.valor)} className={`h-8 rounded text-[10px] border flex items-center justify-center ${config.bgCard === item.valor ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-gray-200 text-gray-600'}`}>{item.nome}</button>
                ))}
              </div>
              <div className="flex items-center gap-3 bg-gray-50 dark:bg-slate-800 p-2 rounded-xl border border-gray-200 dark:border-slate-700">
                <input type="color" value={config.bgCard || '#ffffff'} onChange={(e) => aplicarMudanca('bgCard', e.target.value)} className="w-8 h-8 rounded cursor-pointer border-none bg-transparent" />
                <span className="text-xs font-bold text-gray-600 dark:text-slate-300">Cor dos Cards</span>
              </div>
            </div>
          )}

          {abaAtiva === 'texto' && (
            <div className="space-y-4">
              <div className="p-3 bg-gray-50 dark:bg-slate-800 rounded border border-gray-200 dark:border-slate-700">
                <p className="text-xs font-medium" style={{ color: config.corTexto }}>Exemplo de texto.</p>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {PRESETS.textos.map((item, idx) => (
                  <button key={idx} onClick={() => aplicarMudanca('corTexto', item.valor)} className={`h-8 rounded text-[10px] border flex items-center justify-center ${config.corTexto === item.valor ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-gray-200 text-gray-600'}`} style={{ color: item.valor }}>{item.nome}</button>
                ))}
              </div>
              <div className="flex items-center gap-3 bg-gray-50 dark:bg-slate-800 p-2 rounded-xl border border-gray-200 dark:border-slate-700">
                <input type="color" value={config.corTexto || '#000000'} onChange={(e) => aplicarMudanca('corTexto', e.target.value)} className="w-8 h-8 rounded cursor-pointer border-none bg-transparent" />
                <span className="text-xs font-bold text-gray-600 dark:text-slate-300">Cor do Texto</span>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}