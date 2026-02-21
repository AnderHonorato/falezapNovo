// backend/forcar-status.js

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function forcar() {
  try {
    console.log('\n🔧 FORÇANDO STATUS NO BANCO\n');

    const contaId = '1605747f-cd5b-48b9-a0b1-3b2d9250f3e8';

    // SQL direto para garantir
    await prisma.$executeRaw`
      UPDATE conexoes_whatsapp 
      SET 
        status = 'CONECTADO',
        "phoneNumberId" = '822336220965826',
        "numeroWhatsApp" = '5511939205314',
        "ultimaConexao" = NOW()
      WHERE "contaId" = ${contaId}
    `;

    console.log('✅ UPDATE executado via SQL direto\n');

    // Verificar
    const conexoes = await prisma.$queryRaw`
      SELECT * FROM conexoes_whatsapp 
      WHERE "contaId" = ${contaId}
    `;

    console.log('📋 Resultado:');
    console.log(JSON.stringify(conexoes, null, 2));

    console.log('\n✅ PRONTO! Reinicie o servidor agora.\n');

  } catch (erro) {
    console.error('❌ ERRO:', erro);
  } finally {
    await prisma.$disconnect();
  }
}

forcar();