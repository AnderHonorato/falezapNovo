// apagarTudo.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function apagarTudo() {
  try {
    // Apaga todas as mensagens
    await prisma.mensagem.deleteMany({});
    console.log('✅ Todas as mensagens apagadas');

    // Apaga todas as conversas
    await prisma.conversa.deleteMany({});
    console.log('✅ Todas as conversas apagadas');

    console.log('🎯 Histórico completamente zerado!');
  } catch (error) {
    console.error('❌ Erro ao apagar histórico:', error);
  } finally {
    await prisma.$disconnect();
  }
}

apagarTudo();
