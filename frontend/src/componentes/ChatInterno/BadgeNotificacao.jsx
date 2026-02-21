// frontend/src/componentes/ChatInterno/BadgeNotificacao.jsx

export default function BadgeNotificacao({ count, className = '' }) {
  if (!count || count === 0) return null;

  return (
    <div
      className={`min-w-[20px] h-5 px-1.5 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-full text-xs font-bold flex items-center justify-center shadow-lg animate-bounce ${className}`}
    >
      {count > 99 ? '99+' : count}
    </div>
  );
}