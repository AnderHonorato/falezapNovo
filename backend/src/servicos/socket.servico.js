// backend/src/servicos/socket.servico.js - ✅ VERSÃO COMPLETA ATUALIZADA

/**
 * Emite uma nova mensagem para todos os usuários da conta
 */
function emitirNovaMensagem(contaId, conversaId, mensagem, infoConversa = null) {
  if (!global.io) {
    console.warn('⚠️ Socket.IO não disponível');
    return false;
  }

  const sala = `conta:${contaId}`;
  
  console.log('\n📤 ==========================================');
  console.log('📤 [SOCKET SERVICO] EMITINDO NOVA MENSAGEM');
  console.log('==========================================');
  console.log('🏢 Sala:', sala);
  console.log('💬 Mensagem ID:', mensagem.id);
  console.log('📋 Conversa ID:', conversaId);

  const payload = {
    mensagem: {
      id: mensagem.id,
      whatsappId: mensagem.whatsappId,
      conteudo: mensagem.conteudo,
      mensagem: mensagem.conteudo, // Alias
      tipo: mensagem.tipo,
      direcao: mensagem.direcao,
      statusMensagem: mensagem.statusMensagem,
      status: mensagem.statusMensagem,
      timestamp: mensagem.timestamp,
      enviadaEm: mensagem.enviadaEm,
      enviadaPor: mensagem.enviadaPor,
      remetenteId: mensagem.usuarioId || mensagem.remetenteId,
      lida: mensagem.lida,
      conversaId: conversaId,
      fromMe: mensagem.direcao === 'ENVIADA'
    }
  };

  // Adicionar informações da conversa se fornecidas
  if (infoConversa) {
    payload.conversa = {
      id: infoConversa.id,
      numeroCliente: infoConversa.numeroCliente,
      nomeCliente: infoConversa.nomeCliente || infoConversa.nomeContato,
      naoLidas: infoConversa.naoLidas || 0,
      ultimaMensagemEm: infoConversa.ultimaMensagemEm,
      statusConversa: infoConversa.statusConversa,
      contaId: infoConversa.contaId
    };
  }

  console.log('📦 Payload:', JSON.stringify(payload, null, 2));

  global.io.to(sala).emit('nova_mensagem', payload);
  
  console.log('✅ Evento "nova_mensagem" emitido!');
  console.log('==========================================\n');

  return true;
}

/**
 * Emite atualização de status de mensagem
 */
function emitirStatusMensagem(contaId, conversaId, whatsappId, status, lida = false) {
  if (!global.io) {
    console.warn('⚠️ Socket.IO não disponível');
    return false;
  }

  const sala = `conta:${contaId}`;
  
  console.log('\n📊 ==========================================');
  console.log('📊 [SOCKET SERVICO] EMITINDO STATUS');
  console.log('==========================================');
  console.log('🏢 Sala:', sala);
  console.log('📝 WhatsApp ID:', whatsappId);
  console.log('✅ Status:', status);

  const payload = {
    conversaId,
    whatsappId,
    status,
    lida,
    timestamp: new Date()
  };

  console.log('📦 Payload:', JSON.stringify(payload, null, 2));

  global.io.to(sala).emit('mensagem_status_atualizada', payload);
  
  console.log('✅ Evento "mensagem_status_atualizada" emitido!');
  console.log('==========================================\n');

  return true;
}

/**
 * Emite atualização de conversa
 */
function emitirAtualizacaoConversa(contaId, conversaId, dados) {
  if (!global.io) {
    console.warn('⚠️ Socket.IO não disponível');
    return false;
  }

  const sala = `conta:${contaId}`;
  
  console.log('\n📝 ==========================================');
  console.log('📝 [SOCKET SERVICO] EMITINDO ATUALIZAÇÃO CONVERSA');
  console.log('==========================================');
  console.log('🏢 Sala:', sala);
  console.log('📋 Conversa ID:', conversaId);

  const payload = {
    conversaId,
    ...dados,
    timestamp: new Date()
  };

  console.log('📦 Payload:', JSON.stringify(payload, null, 2));

  global.io.to(sala).emit('conversa_atualizada', payload);
  
  console.log('✅ Evento "conversa_atualizada" emitido!');
  console.log('==========================================\n');

  return true;
}

module.exports = {
  emitirNovaMensagem,
  emitirStatusMensagem,
  emitirAtualizacaoConversa
};