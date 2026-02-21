// backend/corrigir-conexao.js - FORÇAR STATUS CONECTADO

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function corrigir() {
  try {
    console.log('\n🔧 FORÇANDO STATUS CONECTADO\n');

    const contaId = '1605747f-cd5b-48b9-a0b1-3b2d9250f3e8';

    // Buscar TODAS as conexões da conta
    const conexoes = await prisma.conexaoWhatsApp.findMany({
      where: { contaId: contaId }
    });

    console.log(`📊 Total de conexões encontradas: ${conexoes.length}\n`);

    conexoes.forEach((c, i) => {
      console.log(`${i + 1}. Conexão:`);
      console.log(`   - ID: ${c.id}`);
      console.log(`   - Instância: ${c.instancia}`);
      console.log(`   - Status: ${c.status}`);
      console.log(`   - Phone ID: ${c.phoneNumberId || 'null'}`);
      console.log(`   - Número: ${c.numeroWhatsApp || 'null'}`);
      console.log('');
    });

    // Atualizar TODAS para CONECTADO
    console.log('🔄 Atualizando todas para CONECTADO...\n');

    const resultado = await prisma.conexaoWhatsApp.updateMany({
      where: {
        contaId: contaId
      },
      data: {
        status: 'CONECTADO',
        phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
        numeroWhatsApp: process.env.WHATSAPP_PHONE_NUMBER || '5511939205314',
        ultimaConexao: new Date()
      }
    });

    console.log(`✅ ${resultado.count} conexão(ões) atualizada(s)!\n`);

    // Verificar resultado
    const verificacao = await prisma.conexaoWhatsApp.findMany({
      where: { contaId: contaId }
    });

    console.log('📋 STATUS APÓS ATUALIZAÇÃO:\n');
    verificacao.forEach((c, i) => {
      console.log(`${i + 1}. Conexão:`);
      console.log(`   - ID: ${c.id}`);
      console.log(`   - Instância: ${c.instancia}`);
      console.log(`   - Status: ${c.status} ✅`);
      console.log(`   - Phone ID: ${c.phoneNumberId}`);
      console.log('');
    });

    console.log('='.repeat(50));
    console.log('✅ CORREÇÃO CONCLUÍDA!');
    console.log('='.repeat(50));
    console.log('\n📝 PRÓXIMOS PASSOS:');
    console.log('   1. NÃO precisa reiniciar o servidor');
    console.log('   2. Tente enviar uma mensagem agora');
    console.log('   3. Deve funcionar imediatamente!\n');

  } catch (erro) {
    console.error('\n❌ ERRO:', erro.message);
    console.error(erro.stack);
  } finally {
    await prisma.$disconnect();
  }
}

corrigir();