// src/componentes/mensagens/GravadorAudio.jsx

import React, { useState, useEffect, useRef } from 'react';
import { Mic, X, Send, Pause, Play } from 'lucide-react';

export default function GravadorAudio({ onStop, onCancel, tema }) {
  const [tempo, setTempo] = useState(0);
  const [pausado, setPausado] = useState(false);
  const [amplitude, setAmplitude] = useState(0);
  const mediaRecorder = useRef(null);
  const audioContext = useRef(null);
  const analyser = useRef(null);
  const chunks = useRef([]);
  const intervalo = useRef(null);
  const animationFrame = useRef(null);

  useEffect(() => {
    iniciarGravacao();
    return () => pararGravacao();
  }, []);

  const iniciarGravacao = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Configura análise de áudio para animação
      audioContext.current = new (window.AudioContext || window.webkitAudioContext)();
      analyser.current = audioContext.current.createAnalyser();
      const source = audioContext.current.createMediaStreamSource(stream);
      source.connect(analyser.current);
      analyser.current.fftSize = 256;
      
      // Inicia animação de amplitude
      const dataArray = new Uint8Array(analyser.current.frequencyBinCount);
      const updateAmplitude = () => {
        analyser.current.getByteFrequencyData(dataArray);
        const avg = dataArray.reduce((a, b) => a + b) / dataArray.length;
        setAmplitude(Math.min(avg / 128, 1));
        animationFrame.current = requestAnimationFrame(updateAmplitude);
      };
      updateAmplitude();

      mediaRecorder.current = new MediaRecorder(stream);
      
      mediaRecorder.current.ondataavailable = (e) => {
        chunks.current.push(e.data);
      };

      mediaRecorder.current.onstop = () => {
        const blob = new Blob(chunks.current, { type: 'audio/ogg; codecs=opus' });
        onStop(blob);
      };

      mediaRecorder.current.start();
      
      intervalo.current = setInterval(() => {
        setTempo(prev => prev + 1);
      }, 1000);
    } catch (error) {
      console.error('Erro ao acessar microfone:', error);
      alert('Erro ao acessar microfone. Verifique as permissões.');
      onCancel();
    }
  };

  const pararGravacao = () => {
    if (mediaRecorder.current && mediaRecorder.current.state !== 'inactive') {
      mediaRecorder.current.stop();
      mediaRecorder.current.stream.getTracks().forEach(track => track.stop());
    }
    if (intervalo.current) {
      clearInterval(intervalo.current);
    }
    if (animationFrame.current) {
      cancelAnimationFrame(animationFrame.current);
    }
    if (audioContext.current) {
      audioContext.current.close();
    }
  };

  const togglePausar = () => {
    if (pausado) {
      mediaRecorder.current.resume();
      intervalo.current = setInterval(() => {
        setTempo(prev => prev + 1);
      }, 1000);
    } else {
      mediaRecorder.current.pause();
      clearInterval(intervalo.current);
    }
    setPausado(!pausado);
  };

  const formatarTempo = (seg) => {
    const mins = Math.floor(seg / 60);
    const secs = seg % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div 
      className="absolute inset-0 z-50 flex items-center justify-center backdrop-blur-md animate-fadeIn"
      style={{ backgroundColor: `${tema.fundo}f5` }}
    >
      <div 
        className="relative flex flex-col items-center gap-6 p-8 rounded-3xl shadow-2xl border-2 max-w-md w-full mx-4 animate-scaleIn"
        style={{ 
          backgroundColor: tema.fundo,
          borderColor: tema.verde
        }}
      >
        {/* Indicador visual de gravação */}
        <div className="relative">
          {/* Círculo de pulso */}
          <div 
            className={`absolute inset-0 rounded-full ${pausado ? '' : 'animate-ping-slow'}`}
            style={{ 
              backgroundColor: '#ef4444',
              opacity: 0.3
            }}
          />
          
          {/* Ícone do microfone */}
          <div 
            className="relative w-24 h-24 rounded-full flex items-center justify-center shadow-xl z-10"
            style={{ 
              backgroundColor: '#ef4444',
              transform: `scale(${1 + amplitude * 0.2})`
            }}
          >
            <Mic className="w-12 h-12 text-white" />
          </div>

          {/* Badge de status */}
          <div 
            className="absolute -top-2 -right-2 px-3 py-1 rounded-full shadow-lg border-2 text-xs font-bold"
            style={{
              backgroundColor: tema.fundo,
              borderColor: pausado ? '#f59e0b' : '#ef4444',
              color: pausado ? '#f59e0b' : '#ef4444'
            }}
          >
            {pausado ? 'PAUSADO' : 'GRAVANDO'}
          </div>
        </div>

        {/* Visualizador de ondas */}
        <div className="flex items-center justify-center gap-1 h-12">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="w-1 bg-red-500 rounded-full transition-all duration-100"
              style={{
                height: pausado ? '8px' : `${8 + Math.random() * amplitude * 32}px`,
                opacity: 0.3 + amplitude * 0.7
              }}
            />
          ))}
        </div>

        {/* Timer */}
        <div className="text-center">
          <div 
            className="text-5xl font-mono font-bold mb-2"
            style={{ color: tema.texto }}
          >
            {formatarTempo(tempo)}
          </div>
          <p 
            className="text-sm font-semibold"
            style={{ color: tema.textoSecundario }}
          >
            {pausado ? 'Gravação pausada' : 'Gravando áudio...'}
          </p>
        </div>

        {/* Controles */}
        <div className="flex items-center gap-4 w-full justify-center">
          {/* Cancelar */}
          <button
            onClick={() => {
              pararGravacao();
              onCancel();
            }}
            className="w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 shadow-lg"
            style={{ backgroundColor: '#ef4444' }}
            title="Cancelar"
          >
            <X className="w-6 h-6 text-white" />
          </button>

          {/* Pausar/Retomar */}
          <button
            onClick={togglePausar}
            className="w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 shadow-lg"
            style={{ backgroundColor: '#f59e0b' }}
            title={pausado ? 'Retomar' : 'Pausar'}
          >
            {pausado ? (
              <Play className="w-7 h-7 text-white" />
            ) : (
              <Pause className="w-7 h-7 text-white" />
            )}
          </button>

          {/* Enviar */}
          <button
            onClick={pararGravacao}
            className="w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 shadow-lg"
            style={{ backgroundColor: tema.verde }}
            title="Enviar"
          >
            <Send className="w-6 h-6 text-white" />
          </button>
        </div>

        {/* Dica */}
        <p 
          className="text-xs font-medium text-center"
          style={{ color: tema.textoSecundario }}
        >
          Clique em <span style={{ color: tema.verde }}>✓</span> para enviar ou <span style={{ color: '#ef4444' }}>✕</span> para cancelar
        </p>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes ping-slow {
          0% {
            transform: scale(1);
            opacity: 0.3;
          }
          50% {
            transform: scale(1.3);
            opacity: 0;
          }
          100% {
            transform: scale(1);
            opacity: 0;
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }

        .animate-scaleIn {
          animation: scaleIn 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .animate-ping-slow {
          animation: ping-slow 2s cubic-bezier(0, 0, 0.2, 1) infinite;
        }
      `}</style>
    </div>
  );
}