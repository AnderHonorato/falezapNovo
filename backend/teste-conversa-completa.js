// backend/teste-conversa-completa.js
// 🧪 Simular uma conversa completa: receber + responder

require('dotenv').config();
const axios = require('axios');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const numeroTeste = '5511999999999'; // Número fictício para teste

async function limparDadosTeste() {
  console.log('🧹 Limpando dados de teste anteriores...');
  
  // Buscar conversa de teste
  const conversa = await prisma.conversa.findFirst({
    where: { numeroCliente: numeroTeste }
  });
  
  if (conversa) {
    // Deletar mensagens da conversa
    await prisma.mensagem.deleteMany({
      where: { conversaId: conversa.id }
    });
    
    // Deletar a conversa
    await prisma.conversa.delete({
      where: { id: conversa.id }
    });
    
    console.log('✅ Conversa e mensagens antigas removidas!');
  } else {
    console.log('✅ Nenhuma conversa anterior encontrada');
  }
  
  console.log('');
}

async function simularMensagemRecebida() {
  console.log('\n📥 ===== SIMULANDO MENSAGEM RECEBIDA =====\n');
  
  const payload = {
    object: 'whatsapp_business_account',
    entry: [{
      id: 'WABA_ID',
      changes: [{
        value: {
          messaging_product: 'whatsapp',
          metadata: {
            display_phone_number: '15556452732',
            phone_number_id: '822336220965826'
          },
          contacts: [{
            profile: { name: 'Cliente Teste' },
            wa_id: numeroTeste
          }],
          messages: [{
            from: numeroTeste,
            id: 'wamid.TESTE_RECEBIDA_' + Date.now(),
            timestamp: Math.floor(Date.now() / 1000).toString(),
            type: 'text',
            text: {
              body: '🧪 Olá! Preciso de ajuda com meu pedido.'
            }
          }]
        },
        field: 'messages'
      }]
    }]
  };

  const response = await axios.post(
    'http://localhost:3000/api/whatsapp/webhook',
    payload,
    { headers: { 'Content-Type': 'application/json' } }
  );

  console.log('✅ Mensagem recebida processada! Status:', response.status);
  
  // Aguardar 1 segundo
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Verificar se foi salva
  const conversa = await prisma.conversa.findFirst({
    where: { numeroCliente: numeroTeste }
  });
  
  if (!conversa) {
    console.log('❌ Conversa NÃO foi criada!');
    return null;
  }
  
  const mensagem = await prisma.mensagem.findFirst({
    where: { conversaId: conversa.id },
    orderBy: { timestamp: 'desc' }
  });
  
  if (mensagem) {
    console.log('✅ Mensagem salva no banco!');
    console.log('   📝 Conteúdo:', mensagem.mensagem || mensagem.conteudo);
    console.log('   📍 Direção:', mensagem.direcao);
    console.log('   👤 fromMe:', mensagem.fromMe);
  } else {
    console.log('❌ Mensagem NÃO foi salva!');
  }
  
  return mensagem;
}

async function simularRespostaEnviada(mensagemRecebida) {
  console.log('\n📤 ===== SIMULANDO RESPOSTA ENVIADA =====\n');
  
  // Buscar usuário para simular
  const usuario = await prisma.usuario.findFirst({
    where: { tipo: 'ADMIN' },
    include: { conta: true }
  });
  
  if (!usuario) {
    console.log('❌ Nenhum usuário encontrado para teste');
    return;
  }
  
  console.log('👤 Usando usuário:', usuario.nome);
  
  // Buscar conexão
  const conexao = await prisma.conexaoWhatsApp.findFirst({
    where: { 
      contaId: usuario.contaId,
      status: 'CONECTADO'
    }
  });
  
  if (!conexao) {
    console.log('❌ Nenhuma conexão encontrada');
    console.log('⚠️ Crie uma conexão manualmente no banco para este teste');
    return;
  }
  
  console.log('📱 Usando conexão:', conexao.nomeInstancia);
  
  // Buscar conversa
  const conversa = await prisma.conversa.findFirst({
    where: { numeroCliente: numeroTeste }
  });
  
  if (!conversa) {
    console.log('❌ Conversa não encontrada');
    return;
  }
  
  // Criar mensagem de resposta
  const mensagemEnviada = await prisma.mensagem.create({
    data: {
      whatsappId: 'wamid.TESTE_ENVIADA_' + Date.now(),
      conversaId: conversa.id,
      contaId: usuario.contaId,
      conexaoWhatsAppId: conexao.id,
      
      de: conexao.numeroWhatsApp || 'sistema',
      para: numeroTeste,
      
      mensagem: '🧪 Olá! Claro, vou te ajudar. Qual é o número do seu pedido?',
      conteudo: '🧪 Olá! Claro, vou te ajudar. Qual é o número do seu pedido?',
      
      direcao: 'ENVIADA',
      fromMe: true,
      
      tipo: 'TEXTO',
      statusMensagem: 'ENVIADA',
      enviadaPor: usuario.nome,
      timestamp: new Date(),
      lida: true,
      
      usuarioId: usuario.id
    }
  });
  
  console.log('✅ Resposta simulada criada no banco!');
  console.log('   📝 Conteúdo:', mensagemEnviada.mensagem || mensagemEnviada.conteudo);
  console.log('   📍 Direção:', mensagemEnviada.direcao);
  console.log('   👤 fromMe:', mensagemEnviada.fromMe);
  
  return mensagemEnviada;
}

async function verificarConversa() {
  console.log('\n💬 ===== VERIFICANDO CONVERSA =====\n');
  
  const conversa = await prisma.conversa.findFirst({
    where: { numeroCliente: numeroTeste },
    include: {
      _count: {
        select: { mensagens: true }
      }
    }
  });
  
  if (conversa) {
    console.log('✅ Conversa criada!');
    console.log('   🆔 ID:', conversa.id);
    console.log('   📊 Status:', conversa.statusConversa);
    console.log('   📨 Total de mensagens:', conversa._count.mensagens);
    
    const mensagens = await prisma.mensagem.findMany({
      where: { conversaId: conversa.id },
      orderBy: { timestamp: 'asc' }
    });
    
    console.log('\n📜 Histórico de mensagens:');
    mensagens.forEach((msg, i) => {
      const emoji = msg.direcao === 'RECEBIDA' ? '📥' : '📤';
      const lado = msg.fromMe ? 'DIREITA' : 'ESQUERDA';
      const conteudo = msg.mensagem || msg.conteudo || '';
      console.log(`   ${i + 1}. ${emoji} [${lado}] ${conteudo.substring(0, 50)}...`);
    });
  } else {
    console.log('❌ Conversa não foi criada');
  }
}

async function testarCompleto() {
  try {
    console.log('\n🧪 =============================================');
    console.log('🧪 TESTE COMPLETO DE CONVERSA');
    console.log('🧪 =============================================\n');
    
    // 1. Limpar dados antigos
    await limparDadosTeste();
    
    // 2. Simular mensagem recebida
    const mensagemRecebida = await simularMensagemRecebida();
    
    if (!mensagemRecebida) {
      console.log('\n❌ Teste interrompido - mensagem não foi salva');
      return;
    }
    
    // 3. Simular resposta enviada
    await simularRespostaEnviada(mensagemRecebida);
    
    // 4. Verificar conversa
    await verificarConversa();
    
    console.log('\n✅ =============================================');
    console.log('✅ TESTE COMPLETO FINALIZADO!');
    console.log('✅ =============================================\n');
    
    console.log('📋 PRÓXIMOS PASSOS:');
    console.log('   1. Abra o sistema no navegador');
    console.log('   2. Vá para a página de Mensagens');
    console.log('   3. Procure pela conversa com número:', numeroTeste);
    console.log('   4. Verifique se as 2 mensagens aparecem');
    console.log('   5. Mensagem recebida deve estar à ESQUERDA');
    console.log('   6. Mensagem enviada deve estar à DIREITA\n');
    
  } catch (erro) {
    console.error('\n❌ ERRO:', erro.message);
    console.error('Stack:', erro.stack);
  } finally {
    await prisma.$disconnect();
  }
}

testarCompleto();