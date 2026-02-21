const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixarConexao() {
  const contaId = '1605747f-cd5b-48b9-a0b1-3b2d9250f3e8';
  
  console.log('🔍 Buscando conexão para conta:', contaId);
  
  let conexao = await prisma.conexaoWhatsApp.findFirst({
    where: { contaId }
  });
  
  if (conexao) {
    console.log('✅ Conexão encontrada:', conexao.id);
    console.log('   Status atual:', conexao.status);
    
    if (conexao.status !== 'CONECTADO') {
      await prisma.conexaoWhatsApp.update({
        where: { id: conexao.id },
        data: { 
          status: 'CONECTADO',
          atualizadoEm: new Date()
        }
      });
      console.log('✅ Status atualizado para CONECTADO');
    } else {
      console.log('✅ Conexão já está CONECTADA');
    }
  } else {
    console.log('⚠️ Nenhuma conexão encontrada. Criando...');
    
    conexao = await prisma.conexaoWhatsApp.create({
      data: {
        contaId: contaId,
        status: 'CONECTADO',
        numeroWhatsApp: '557799512937',
        instancia: 1,
        nomeInstancia: 'WhatsApp Principal',
        corIdentificacao: '#25D366'
      }
    });
    
    console.log('✅ Conexão criada:', conexao.id);
  }
  
  console.log('\n📋 Detalhes da conexão:');
  console.log('   ID:', conexao.id);
  console.log('   Conta ID:', conexao.contaId);
  console.log('   Status:', conexao.status);
  console.log('   Número:', conexao.numeroWhatsApp);
  console.log('   Instância:', conexao.instancia);
  console.log('   Nome:', conexao.nomeInstancia);
  
  await prisma.$disconnect();
  console.log('\n✅ Concluído!');
}

fixarConexao().catch(err => {
  console.error('❌ Erro:', err);
  process.exit(1);
});