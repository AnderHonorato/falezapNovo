// ✅ CRIE UM ARQUIVO: backend/scripts/verificar-conexoes.js

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verificarConexoes() {
  try {
    console.log('\n📋 ==========================================');
    console.log('📋 VERIFICANDO CONEXÕES WHATSAPP');
    console.log('==========================================\n');

    const conexoes = await prisma.conexaoWhatsApp.findMany({
      select: {
        id: true,
        nomeInstancia: true,
        numeroWhatsApp: true,
        status: true,
        phoneNumberId: true,
        contaId: true,
        criadoEm: true
      },
      orderBy: {
        criadoEm: 'desc'
      }
    });

    if (conexoes.length === 0) {
      console.log('❌ NENHUMA CONEXÃO ENCONTRADA!');
      console.log('\nVocê precisa criar uma conexão WhatsApp primeiro.');
      console.log('Verifique em: http://localhost:5173/whatsapp\n');
      return;
    }

    console.log(`✅ ${conexoes.length} CONEXÃO(ÕES) ENCONTRADA(S):\n`);

    conexoes.forEach((conexao, index) => {
      console.log(`[${index + 1}] ==========================================`);
      console.log(`   ID: ${conexao.id}`);
      console.log(`   Nome: ${conexao.nomeInstancia || 'Sem nome'}`);
      console.log(`   Número: ${conexao.numeroWhatsApp || 'Não conectado'}`);
      console.log(`   Status: ${conexao.status}`);
      console.log(`   Phone Number ID: ${conexao.phoneNumberId || 'Não configurado'}`);
      console.log(`   Conta ID: ${conexao.contaId}`);
      console.log(`   Criado em: ${conexao.criadoEm}`);
      console.log('');
    });

    console.log('==========================================');
    console.log('📝 PARA TESTAR OS TEMPLATES, USE UM DOS IDS ACIMA');
    console.log('==========================================\n');

    // Verificar conversas com essa conexão
    console.log('💬 VERIFICANDO CONVERSAS...\n');

    for (const conexao of conexoes) {
      const conversas = await prisma.conversa.findMany({
        where: { conexaoWhatsAppId: conexao.id },
        take: 5,
        select: {
          id: true,
          nomeContato: true,
          numeroCliente: true,
          conexaoWhatsAppId: true
        }
      });

      console.log(`Conexão: ${conexao.nomeInstancia || conexao.id}`);
      console.log(`   - ${conversas.length} conversa(s) encontrada(s)`);
      
      if (conversas.length > 0) {
        conversas.forEach(conv => {
          console.log(`     • ${conv.nomeContato || conv.numeroCliente} (ID: ${conv.id})`);
        });
      }
      console.log('');
    }

    console.log('==========================================');
    console.log('✅ VERIFICAÇÃO CONCLUÍDA!');
    console.log('==========================================\n');

  } catch (error) {
    console.error('❌ ERRO:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

verificarConexoes();