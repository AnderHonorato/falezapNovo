// frontend/src/componentes/ChatInterno/EditorPapelParede.jsx

import { useState, useEffect } from 'react';
import { Check, Palette, Grid, ArrowLeft, Trash2, Pipette } from 'lucide-react';
import toast from 'react-hot-toast';

// --- CORES PADRÃO ---
const CORES_SUGESTAO = [
    '#ffffff', '#efeae2', '#f0f2f5', // WhatsApp / Neutros
    '#fef2f2', '#fff7ed', '#f0fdf4', // Pasteis
    '#e0f2fe', '#eef2ff', '#faf5ff', 
    '#111b21', '#202c33' // Dark Mode
];

// --- DOODLES (SVG PATTERNS) ---
// Função geradora de CSS Url
const svgPattern = (color, path) => `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='${path}' fill='${encodeURIComponent(color)}' fill-opacity='0.4'/%3E%3C/svg%3E")`;

// ✅ Doodles Atualizados com Estilo "Mix Kids/WhatsApp" (Vários ícones em um path)
const DOODLE_PATHS = {
    // Mix: Lua, Estrela, Coração, Nota, Flor, Pata, Raio
    'mix': 'M15 15c-2 0-3 2-3 4s2 4 4 4 4-2 4-4-2-4-5-4zm30 10l5-8 5 8h8l-6 5 2 8-7-5-7 5 2-8-6-5h8zm40-5a5 5 0 1 0 0 10 5 5 0 0 0 0-10zm-60 40c0-5 4-9 9-9s9 4 9 9-4 9-9 9-9-4-9-9zm30 10l5-10h-10l5 10zm40 10c-3 0-5 3-5 6s3 5 6 5 5-3 5-6-2-5-6-5zm-70 10l3-5h-6l3 5zm-15-25l4-2 2 4-4 2-2-4zm80-30l-4 4-4-4 4-4 4 4z',
    
    // Formas Geométricas (Círculo, Quadrado, Triângulo espalhados)
    'geom': 'M10 10h10v10h-10z M40 10l5 10h-10z M70 15a5 5 0 1 0 10 0 5 5 0 0 0-10 0z M20 40h20v5h-20z M60 40l10 10l-10 10l-10-10z M10 70l5 5l5-5l5 5l5-5v5h-20z M80 80h10v10h-10z',
    
    // Estrelas e Luas
    'stars': 'M50 0L61 35H97L68 57L79 91L50 70L21 91L32 57L3 35H39L50 0Z M10 10a5 5 0 1 0 0 10 5 5 0 0 0 0-10z M80 80a5 5 0 1 0 0 10 5 5 0 0 0 0-10z', 
    
    // Zigue-zague denso
    'zigzag': 'M0 0L10 10L20 0L30 10L40 0L50 10L60 0L70 10L80 0L90 10L100 0V20L90 30L80 20L70 30L60 20L50 30L40 20L30 30L20 20L10 30L0 20Z M0 50L10 60L20 50L30 60L40 50L50 60L60 50L70 60L80 50L90 60L100 50V70L90 80L80 70L70 80L60 70L50 80L40 70L30 80L20 70L10 80L0 70Z',
    
    // Cruzadinhas
    'cross': 'M0 0H20V20H0V0ZM5 5H15V15H5V5Z M50 50H70V70H50V50ZM55 55H65V65H55V55Z M0 50H20V70H0V50ZM5 55H15V65H5V55Z M50 0H70V20H50V0ZM55 5H65V15H55V5Z',
};

export default function EditorPapelParede({ onSalvar, onFechar, currentWallpaper, headless = false }) {
    const [bgColor, setBgColor] = useState('#efeae2'); 
    const [doodleKey, setDoodleKey] = useState(null);
    const [doodleColor, setDoodleColor] = useState('#000000'); 
    const [tab, setTab] = useState('cores'); 

    // ✅ LÓGICA DE RESTAURAÇÃO
    useEffect(() => {
        if (!currentWallpaper) return;
        try {
            if (currentWallpaper.includes('url(')) {
                const parts = currentWallpaper.split(', #');
                if (parts.length > 1) {
                    const recoveredColor = '#' + parts[parts.length - 1].trim();
                    setBgColor(recoveredColor);
                }
                const urlPart = parts[0];
                const foundKey = Object.keys(DOODLE_PATHS).find(key => urlPart.includes(DOODLE_PATHS[key]));
                if (foundKey) setDoodleKey(foundKey);

                const fillMatch = decodeURIComponent(urlPart).match(/fill='([^']+)'/);
                if (fillMatch && fillMatch[1]) {
                    setDoodleColor(fillMatch[1]);
                }
            } else {
                setBgColor(currentWallpaper.trim());
                setDoodleKey(null);
            }
        } catch (e) {
            console.error("Erro ao restaurar papel de parede:", e);
        }
    }, [currentWallpaper]);

    const getPreviewStyle = () => {
        const style = { backgroundColor: bgColor };
        if (doodleKey && DOODLE_PATHS[doodleKey]) {
            style.backgroundImage = svgPattern(doodleColor, DOODLE_PATHS[doodleKey]);
            style.backgroundBlendMode = 'overlay';
            // ✅ TAMANHO PEQUENO PARA REPETIÇÃO (150px)
            // Como o viewBox é 100x100, 150px faz os ícones ficarem pequenos e se repetirem várias vezes
            style.backgroundSize = '150px'; 
            style.backgroundRepeat = 'repeat';
        }
        return style;
    };

    const handleSave = () => {
        const style = getPreviewStyle();
        let finalString = style.backgroundColor;
        if (style.backgroundImage) {
            finalString = `${style.backgroundImage}, ${style.backgroundColor}`;
        }
        onSalvar(finalString);
    };

    const handleRemover = () => {
        setBgColor('#ffffff');
        setDoodleKey(null);
    };

    return (
        <div className={`h-full flex flex-col bg-white ${headless ? '' : 'animate-fadeIn'}`}>
            
            {!headless && (
                <div className="h-[60px] px-4 border-b border-gray-100 flex items-center gap-3 shrink-0">
                    <button type="button" onClick={onFechar} className="p-1 hover:bg-gray-100 rounded-full text-gray-600 transition-colors">
                        <ArrowLeft size={20}/>
                    </button>
                    <h3 className="font-bold text-gray-800 text-sm">Papel de Parede</h3>
                </div>
            )}

            {/* PRÉVIA */}
            <div className="flex-1 bg-gray-100 relative overflow-hidden flex flex-col items-center justify-center p-4">
                <div className="w-full max-w-[280px] h-[400px] bg-white rounded-2xl shadow-lg overflow-hidden flex flex-col border border-gray-200 relative z-10 transition-all duration-300">
                     <div 
                        className="absolute inset-0 z-0 transition-all duration-300"
                        style={getPreviewStyle()}
                     ></div>

                     <div className="h-12 bg-white/90 backdrop-blur-sm border-b border-gray-100 flex items-center px-3 gap-2 relative z-10">
                        <div className="w-8 h-8 rounded-full bg-gray-300"></div>
                        <div className="h-3 w-24 bg-gray-200 rounded"></div>
                     </div>

                     <div className="flex-1 p-3 space-y-3 relative z-10 overflow-hidden flex flex-col justify-end">
                        <div className="flex flex-col items-start max-w-[80%]">
                            <div className="px-3 py-2 bg-white text-gray-800 rounded-2xl rounded-tl-none border border-gray-100 shadow-sm text-xs">
                                <p>Assim ficará seu chat.</p>
                            </div>
                        </div>
                        <div className="flex flex-col items-end max-w-[80%] self-end">
                            <div className="px-3 py-2 bg-[#d9fdd3] text-gray-800 rounded-2xl rounded-tr-none shadow-sm text-xs">
                                <p>Gostei das cores!</p>
                            </div>
                        </div>
                     </div>
                </div>
            </div>

            {/* CONTROLES */}
            <div className="bg-white border-t border-gray-100 p-4 shrink-0 z-20">
                <div className="flex gap-2 mb-4 overflow-x-auto no-scrollbar">
                    <button type="button" onClick={() => setTab('cores')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors ${tab === 'cores' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-50 text-gray-600'}`}><Palette size={14} className="inline mr-1"/> Fundo</button>
                    <button type="button" onClick={() => setTab('doodles')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors ${tab === 'doodles' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-50 text-gray-600'}`}><Grid size={14} className="inline mr-1"/> Doodles</button>
                </div>

                <div className="h-40 custom-scrollbar overflow-y-auto pr-1">
                    {tab === 'cores' && (
                        <div className="space-y-4 animate-fadeIn">
                            <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                                <label className="text-[10px] font-bold text-gray-500 uppercase mb-2 block flex items-center gap-2">
                                    <Pipette size={12}/> Seletor Personalizado
                                </label>
                                <div className="flex items-center gap-3">
                                    <div className="relative w-full h-10 rounded-lg overflow-hidden border border-gray-300 shadow-inner">
                                        <input 
                                            type="color" 
                                            value={bgColor} 
                                            onChange={(e) => setBgColor(e.target.value)}
                                            className="absolute -top-[50%] -left-[50%] w-[200%] h-[200%] cursor-pointer p-0 border-0"
                                        />
                                    </div>
                                    <span className="text-xs font-mono text-gray-500 w-16 text-center">{bgColor}</span>
                                </div>
                            </div>

                            <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase mb-2 block">Sugestões</label>
                                <div className="flex flex-wrap gap-2">
                                    {CORES_SUGESTAO.map(c => (
                                        <button 
                                            type="button" 
                                            key={c} 
                                            onClick={() => setBgColor(c)} 
                                            className={`w-8 h-8 rounded-full border shadow-sm hover:scale-110 transition-transform ${bgColor === c ? 'ring-2 ring-indigo-500 border-white' : 'border-gray-200'}`} 
                                            style={{ background: c }}
                                        ></button>
                                    ))}
                                </div>
                            </div>
                            
                            <button type="button" onClick={handleRemover} className="w-full text-center text-xs text-red-500 hover:bg-red-50 py-2 rounded-lg flex items-center justify-center gap-2 mt-2"><Trash2 size={12}/> Remover Personalização</button>
                        </div>
                    )}

                    {tab === 'doodles' && (
                        <div className="space-y-4 animate-fadeIn">
                            <div className="flex items-center justify-between mb-2">
                                <label className="text-[10px] text-gray-400 block">Padrão do Desenho</label>
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] text-gray-400">Cor da linha:</span>
                                    {['#000000', '#ffffff', '#cbd5e1'].map(c => (
                                        <button key={c} type="button" onClick={() => setDoodleColor(c)} className={`w-4 h-4 rounded-full border ${doodleColor===c ? 'border-indigo-500 ring-1 ring-indigo-200' : 'border-gray-300'}`} style={{background:c}}/>
                                    ))}
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-2">
                                <button 
                                    type="button" 
                                    onClick={() => setDoodleKey(null)}
                                    className={`h-12 rounded-lg border flex items-center justify-center text-xs text-gray-500 hover:bg-gray-50 ${!doodleKey ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200'}`}
                                >
                                    Sem Doodle
                                </button>
                                {Object.keys(DOODLE_PATHS).map(key => (
                                    <button 
                                        key={key} 
                                        type="button" 
                                        onClick={() => setDoodleKey(key)}
                                        className={`h-12 rounded-lg border transition-all ${doodleKey === key ? 'border-indigo-500 ring-1 ring-indigo-100' : 'border-gray-200 hover:border-gray-300'}`}
                                        style={{ 
                                            backgroundColor: bgColor, 
                                            backgroundImage: svgPattern(doodleColor, DOODLE_PATHS[key]),
                                            // Previa do botão:
                                            backgroundSize: '60px', 
                                            backgroundRepeat: 'repeat',
                                            backgroundBlendMode: 'overlay'
                                        }}
                                    ></button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <button 
                    type="button" 
                    onClick={handleSave} 
                    className="w-full mt-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
                >
                    <Check size={18} /> Aplicar ao Chat
                </button>
            </div>
        </div>
    );
}