// backend/adicionar-numero-falezap.js
// 📱 Adicionar número FaleZap Principal

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function adicionarNumeroFaleZap() {
  try {
    console.log('\n📱 ===== ADICIONAR NÚMERO FALEZAP =====\n');

    // Buscar primeira conta
    const conta = await prisma.conta.findFirst();

    if (!conta) {
      console.error('❌ Nenhuma conta encontrada!');
      return;
    }

    console.log('✅ Conta encontrada:', conta.nomeFantasia || conta.nomeCompleto);

    // Verificar se já existe
    const existe = await prisma.conexaoWhatsApp.findFirst({
      where: {
        contaId: conta.id,
        numeroWhatsApp: '5511939205314'
      }
    });

    if (existe) {
      console.log('\n⚠️ Este número já está cadastrado!');
      console.log('🆔 ID:', existe.id);
      console.log('📱 Número:', existe.numeroWhatsApp);
      console.log('📊 Status:', existe.status);
      
      // Atualizar para CONECTADO
      await prisma.conexaoWhatsApp.update({
        where: { id: existe.id },
        data: { 
          status: 'CONECTADO',
          sessaoData: JSON.stringify({
            phoneNumberId: '1184060913629511',
            accessToken: 'EAAQ05aomOUcBP6HZBqt4M7Xe8dCZBCJjzNrzNuEsF7bdF2P3eVzMs5iN35s9en2YnIC6mRCPiZBR6SzyrMdxaAkwZCY5dMlR1ayZCKQUyZAaArTTEqZBCyiEGUNTZCIZC4crnmIWIDyABFxkwEJQrOcrq1Oe825MzzbLpGQV0SFBK3vhEJEaV011qdnf8hER9D2DZB8eVjl6MadH0Ls3kFXakAI3sfmO1oIsICk0mwQGZB4Fc2H8QZDZD',
            tipo: 'API_OFICIAL'
          })
        }
      });
      
      console.log('\n✅ Conexão atualizada para CONECTADO!');
      return;
    }

    // Buscar próxima instância
    const ultimaConexao = await prisma.conexaoWhatsApp.findFirst({
      where: { contaId: conta.id },
      orderBy: { instancia: 'desc' }
    });

    const proximaInstancia = ultimaConexao ? ultimaConexao.instancia + 1 : 1;

    // Criar conexão
    const conexao = await prisma.conexaoWhatsApp.create({
      data: {
        contaId: conta.id,
        instancia: proximaInstancia,
        nomeInstancia: 'FaleZap Principal',
        numeroWhatsApp: '5511939205314',
        nomeExibicao: 'FaleZap Sistemas',
        status: 'CONECTADO',
        corIdentificacao: '#25D366',
        sessaoData: JSON.stringify({
          phoneNumberId: '1184060913629511',
          accessToken: 'EAAQ05aomOUcBP6HZBqt4M7Xe8dCZBCJjzNrzNuEsF7bdF2P3eVzMs5iN35s9en2YnIC6mRCPiZBR6SzyrMdxaAkwZCY5dMlR1ayZCKQUyZAaArTTEqZBCyiEGUNTZCIZC4crnmIWIDyABFxkwEJQrOcrq1Oe825MzzbLpGQV0SFBK3vhEJEaV011qdnf8hER9D2DZB8eVjl6MadH0Ls3kFXakAI3sfmO1oIsICk0mwQGZB4Fc2H8QZDZD',
          tipo: 'API_OFICIAL'
        })
      }
    });

    console.log('\n✅ ===== NÚMERO ADICIONADO COM SUCESSO! =====\n');
    console.log('🆔 ID:', conexao.id);
    console.log('📱 Número:', conexao.numeroWhatsApp);
    console.log('📱 Phone Number ID: 1184060913629511');
    console.log('🏢 Nome:', conexao.nomeInstancia);
    console.log('📊 Status:', conexao.status);
    console.log('🎨 Cor:', conexao.corIdentificacao);
    console.log('📋 Instância:', conexao.instancia);
    console.log('\n🎉 Pronto! Agora você pode receber e enviar mensagens!\n');

  } catch (erro) {
    console.error('\n❌ ERRO:', erro.message);
    console.error('Stack:', erro.stack);
  } finally {
    await prisma.$disconnect();
  }
}

adicionarNumeroFaleZap();