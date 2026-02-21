import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTema } from '../contextos/TemaContexto';

export default function ToggleTema() {
  const { tema, temaEscuro, toggleTema } = useTema();

  return (
    <button
      onClick={toggleTema}
      className="flex items-center gap-2 px-3 py-2 rounded-lg transition-all hover:scale-105"
      style={{
        backgroundColor: tema.hover,
        color: tema.texto,
      }}
      title={temaEscuro ? 'Ativar tema claro' : 'Ativar tema escuro'}
    >
      {temaEscuro ? (
        <Sun className="w-5 h-5" />
      ) : (
        <Moon className="w-5 h-5" />
      )}
    </button>
  );
}