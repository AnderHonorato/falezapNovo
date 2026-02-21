import { useEffect, useState } from 'react';
import { MessageCircle } from 'lucide-react';
import api from '../../servicos/api';

// Dentro do componente:
const [solicitacoesPendentes, setSolicitacoesPendentes] = useState(0);

useEffect(() => {
  if (usuario?.tipo && ['OWNER', 'ADMIN', 'ADMIN_EMPRESA'].includes(usuario.tipo)) {
    carregarSolicitacoesPendentes();
    const interval = setInterval(carregarSolicitacoesPendentes, 30000); // A cada 30s
    return () => clearInterval(interval);
  }
}, [usuario]);

const carregarSolicitacoesPendentes = async () => {
  try {
    const response = await api.get('/chat-interno/solicitacoes-ajuda');
    setSolicitacoesPendentes(response.data?.solicitacoes?.length || 0);
  } catch (error) {
    console.error('Erro ao carregar solicitações:', error);
  }
};

// No menu (exemplo):
{isAdmin && (
  <Link
    to="/chat-interno/solicitacoes"
    className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-100 transition-all relative"
  >
    <MessageCircle className="w-5 h-5" />
    <span>Solicitações de Ajuda</span>
    {solicitacoesPendentes > 0 && (
      <span className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
        {solicitacoesPendentes}
      </span>
    )}
  </Link>
)}