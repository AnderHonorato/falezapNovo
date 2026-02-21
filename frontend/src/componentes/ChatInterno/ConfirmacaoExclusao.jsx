// frontend/src/componentes/ChatInterno/ConfirmacaoExclusao.jsx - 🧠 CORREÇÃO FINAL: ANIMAÇÃO DE ZOOM-IN

import { X, Trash2, AlertTriangle } from 'lucide-react';
import { useEffect, useRef, useState } from 'react'; 

export default function ConfirmacaoExclusao({ 
    mensagem, 
    onConfirmar, 
    onCancelar, 
    posicao // Recebe {x, y} do clique (coordenadas da tela)
}) {
    const popoverRef = useRef(null);
    const [style, setStyle] = useState(null); 
    
    // 🧠 ESTADO: Controla as classes de animação (inicia oculto e pequeno)
    const [animationClasses, setAnimationClasses] = useState('opacity-0 scale-90'); 

    // EFEITO DE POSICIONAMENTO E ANIMAÇÃO
    useEffect(() => {
        if (!posicao) return;

        // O cálculo é feito com um timeout para garantir que o popoverRef exista
        // e que o React tenha tido tempo de medir o elemento.
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
    
            // Lógica de Reposicionamento X (Mantida para aparecer à esquerda do clique)
            let leftPosition = x - cardWidth - margin;
            if (leftPosition < margin) {
                newX = x + margin;
                if (newX + cardWidth > windowWidth - margin) {
                    newX = windowWidth - cardWidth - margin;
                }
            } else {
                 newX = leftPosition;
            }
    
            // Lógica de Reposicionamento Y (Mantida)
            if (y + cardHeight > windowHeight - margin) {
                newY = y - cardHeight - 5; 
                if (newY < margin) {
                     newY = margin;
                }
            } else {
                 newY = y;
            }
            
            // 1. Aplica os estilos FIXED calculados
            // Tornamos o elemento visível, mas ainda em escala reduzida/opaca.
            setStyle({ 
                top: `${newY}px`, 
                left: `${newX}px`, 
                position: 'fixed',
                visibility: 'visible' // Agora visível no DOM
            });
            
            // 2. Inicia a transição de zoom-in (surgindo para frente)
            // Agendamos a transição para 0ms após a aplicação do estilo de posicionamento
            // para que a transição ocorra de forma suave.
            setTimeout(() => {
                 setAnimationClasses('opacity-100 scale-100');
            }, 50); 
            
        }, 0); // Inicia o cálculo imediatamente na montagem

        return () => clearTimeout(timerMeasurement);
    }, [posicao]);
    
    // Condição de Renderização: Garante que o elemento seja renderizado no DOM para medição
    if (!posicao) return null; 

    return (
        // Wrapper principal: FIXO, sem escurecimento de tela e com Z-index alto
        <div 
            className="fixed inset-0 z-[1000] pointer-events-none" 
            onClick={onCancelar} 
            style={{ pointerEvents: 'auto' }} 
        >
            {/* O Modal/Card de Confirmação em si */}
            <div 
                ref={popoverRef} 
                // ✅ ANIMAÇÃO: Combina o transform e opacity inicial com as classes de transição.
                className={`bg-white p-4 rounded-xl shadow-2xl max-w-xs ring-1 ring-red-100 transform transition-all duration-200 ease-out ${animationClasses}`}
                onClick={(e) => e.stopPropagation()} 
                
                // 🧠 ESTILO INICIAL: Se style for null, ele existe no DOM mas está oculto (visibility: hidden)
                // permitindo a medição correta do offsetWidth e offsetHeight.
                style={style || { position: 'fixed', top: 0, left: 0, visibility: 'hidden' }}
            >
                <div className="flex items-start gap-2 border-b pb-2 mb-3">
                    <AlertTriangle size={18} className="text-red-600 flex-shrink-0 mt-0.5" />
                    <h4 className="font-bold text-sm text-gray-800">Confirmação de Exclusão</h4>
                    <button 
                        onClick={onCancelar} 
                        className="ml-auto p-1 text-gray-400 hover:text-gray-600 transition-colors rounded-full hover:bg-gray-100 flex-shrink-0"
                    >
                        <X size={16} />
                    </button>
                </div>

                <p className="text-xs text-gray-700 mb-4">
                    {mensagem}
                </p>

                <div className="flex justify-end gap-2">
                    <button 
                        onClick={onCancelar} 
                        className="px-3 py-1.5 text-xs font-semibold text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                        Cancelar
                    </button>
                    <button 
                        onClick={onConfirmar} 
                        className="px-3 py-1.5 text-xs font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors flex items-center gap-1 shadow-md shadow-red-500/30"
                    >
                        <Trash2 size={14} /> Excluir
                    </button>
                </div>
            </div>
        </div>
    );
}