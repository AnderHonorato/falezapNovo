// frontend/src/componentes/ChatInterno/ConfirmacaoEncerramento.jsx

import { X, XCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react'; 

export default function ConfirmacaoEncerramento({ 
    mensagem, 
    onConfirmar, 
    onCancelar, 
    posicao, // Recebe {x, y} do clique (coordenadas da tela)
    carregando = false
}) {
    const popoverRef = useRef(null);
    const [style, setStyle] = useState(null); 
    const [animationClasses, setAnimationClasses] = useState('opacity-0 scale-90'); 

    useEffect(() => {
        if (!posicao) return;

        const timerMeasurement = setTimeout(() => {
            if (!popoverRef.current) return;
            
            const { x, y } = posicao;
            const cardWidth = popoverRef.current.offsetWidth;
            const cardHeight = popoverRef.current.offsetHeight;
            const windowWidth = window.innerWidth;
            const windowHeight = window.innerHeight;
            const margin = 10; 
    
            let newX = x;
            let newY = y;
    
            // Lógica de Reposicionamento X
            let leftPosition = x - cardWidth - margin;
            if (leftPosition < margin) {
                newX = x + margin;
                if (newX + cardWidth > windowWidth - margin) {
                    newX = windowWidth - cardWidth - margin;
                }
            } else {
                 newX = leftPosition;
            }
    
            // Lógica de Reposicionamento Y
            if (y + cardHeight > windowHeight - margin) {
                newY = y - cardHeight - 5; 
                if (newY < margin) {
                     newY = margin;
                }
            } else {
                 newY = y;
            }
            
            setStyle({ 
                top: `${newY}px`, 
                left: `${newX}px`, 
                position: 'fixed',
                visibility: 'visible'
            });
            
            setTimeout(() => {
                 setAnimationClasses('opacity-100 scale-100');
            }, 50); 
            
        }, 0);

        return () => clearTimeout(timerMeasurement);
    }, [posicao]);
    
    if (!posicao) return null; 

    return (
        <div 
            className="fixed inset-0 z-[1000] pointer-events-none" 
            onClick={onCancelar} 
            style={{ pointerEvents: 'auto' }} 
        >
            <div 
                ref={popoverRef} 
                className={`bg-white p-4 rounded-xl shadow-2xl max-w-xs ring-1 ring-red-100 transform transition-all duration-200 ease-out ${animationClasses}`}
                onClick={(e) => e.stopPropagation()} 
                style={style || { position: 'fixed', top: 0, left: 0, visibility: 'hidden' }}
            >
                <div className="flex items-start gap-2 border-b pb-2 mb-3">
                    <AlertTriangle size={18} className="text-red-600 flex-shrink-0 mt-0.5" />
                    <h4 className="font-bold text-sm text-gray-800">Encerrar a conversa</h4>
                    <button 
                        onClick={onCancelar} 
                        disabled={carregando}
                        className="ml-auto p-1 text-gray-400 hover:text-gray-600 transition-colors rounded-full hover:bg-gray-100 flex-shrink-0 disabled:opacity-50"
                    >
                        <X size={16} />
                    </button>
                </div>

                <p className="text-xs text-gray-700 mb-4">
                    {mensagem}
                </p>

                <div className="flex justify-end gap-2">
                    <button 
                        onClick={() => {
                            console.log('[Confirmação] ❌ Cancelar clicado');
                            onCancelar();
                        }}
                        disabled={carregando}
                        className="px-3 py-1.5 text-xs font-semibold text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Cancelar
                    </button>
                    <button 
                        onClick={() => {
                            console.log('[Confirmação] ✅ Encerrar clicado, chamando onConfirmar...');
                            onConfirmar();
                        }}
                        disabled={carregando}
                        className="px-3 py-1.5 text-xs font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors flex items-center gap-1 shadow-md shadow-red-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {carregando ? (
                            <>
                                <Loader2 size={14} className="animate-spin" /> Encerrando...
                            </>
                        ) : (
                            <>
                                <XCircle size={14} /> Finalizar
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}