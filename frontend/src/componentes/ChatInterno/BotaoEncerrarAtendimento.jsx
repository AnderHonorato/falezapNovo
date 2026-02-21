// frontend/src/componentes/chatInterno/BotaoEncerrarAtendimento.jsx - CORRIGIDO

import { useState } from 'react';
import { XCircle } from 'lucide-react';
import api from '../../servicos/api';
import toast from 'react-hot-toast';
import ConfirmacaoEncerramento from './ConfirmacaoEncerramento'; // ✅ IMPORT CORRETO

export default function BotaoEncerrarAtendimento({ 
  conversaAtual, 
  usuarioAtual, 
  onEncerrado 
}) {
  const [confirmacao, setConfirmacao] = useState({
    mostrar: false,
    posicao: null
  });
  const [encerrando, setEncerrando] = useState(false);

  const isSuporteOuOwner = ['OWNER', 'SUPORTE'].includes(usuarioAtual?.tipo);
  
  if (!isSuporteOuOwner || !conversaAtual || conversaAtual.tipo !== 'suporte') {
    return null;
  }

  const handleAbrirConfirmacao = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setConfirmacao({
      mostrar: true,
      posicao: { x: rect.left + rect.width / 2, y: rect.top - 10 }
    });
  };

  const encerrarAtendimento = async () => {
    setEncerrando(true);
    try {
      const response = await api.get(`/suporte/solicitacoes?status=EM_ATENDIMENTO`);
      const chamadoAtivo = response.data.solicitacoes?.find(
        s => s.solicitanteId === conversaAtual.solicitacao?.solicitanteId
      );

      if (!chamadoAtivo) {
        toast.error('Nenhum atendimento ativo encontrado para esta conversa.');
        setConfirmacao({ mostrar: false, posicao: null });
        return;
      }

      await api.post(`/suporte/solicitacoes/${chamadoAtivo.id}/encerrar`, {
        observacao: 'Atendimento concluído via chat.'
      });

      toast.success('Atendimento encerrado com sucesso!');
      setConfirmacao({ mostrar: false, posicao: null });
      
      if (onEncerrado) onEncerrado();
    } catch (error) {
      console.error('Erro ao encerrar atendimento:', error);
      toast.error(error.response?.data?.erro || 'Erro ao encerrar atendimento.');
    } finally {
      setEncerrando(false);
    }
  };

  return (
    <>
      <button
        onClick={handleAbrirConfirmacao}
        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl font-semibold text-sm hover:shadow-lg transition-all"
        title="Encerrar atendimento"
      >
        <XCircle className="w-4 h-4" />
        Encerrar Atendimento
      </button>

      {/* ✅ USA O COMPONENTE ConfirmacaoEncerramento */}
      {confirmacao.mostrar && confirmacao.posicao && (
        <ConfirmacaoEncerramento
          mensagem="Ao encerrar este atendimento, o chamado será marcado como finalizado e o cliente será notificado para avaliar. Esta ação não pode ser desfeita."
          onConfirmar={encerrarAtendimento}
          onCancelar={() => setConfirmacao({ mostrar: false, posicao: null })}
          posicao={confirmacao.posicao}
          carregando={encerrando}
        />
      )}
    </>
  );
}