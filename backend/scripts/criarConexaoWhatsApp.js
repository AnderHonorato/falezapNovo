// backend/scripts/criarConexaoWhatsApp.js
// ✅ Script para criar conexão WhatsApp Business API

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function criarConexaoWhatsApp() {
  try {
    console.log('\n🔧 ============================================');
    console.log('🔧 CRIAR CONEXÃO WHATSAPP BUSINESS API');
    console.log('============================================\n');

    // 1. Buscar todas as contas
    const contas = await prisma.conta.findMany({
      select: {
        id: true,
        razaoSocial: true,
        nomeFantasia: true,
        email: true
      }
    });

    if (contas.length === 0) {
      console.error('❌ Nenhuma conta encontrada no banco!');
      console.log('💡 Crie uma conta primeiro antes de criar a conexão WhatsApp.');
      process.exit(1);
    }

    console.log(`📋 Encontradas ${contas.length} conta(s):\n`);
    
    contas.forEach((conta, index) => {
      console.log(`${index + 1}. ${conta.razaoSocial || conta.nomeFantasia} (${conta.email})`);
      console.log(`   ID: ${conta.id}\n`);
    });

    // 2. Para cada conta, criar/atualizar conexão
    for (const conta of contas) {
      console.log(`\n🔄 Processando conta: ${conta.razaoSocial || conta.nomeFantasia}`);
      
      // Verificar se já existe
      const conexaoExistente = await prisma.conexaoWhatsApp.findFirst({
        where: {
          contaId: conta.id,
          instancia: 1
        }
      });

      if (conexaoExistente) {
        console.log('⚠️  Conexão já existe! Atualizando...');
        
        const conexaoAtualizada = await prisma.conexaoWhatsApp.update({
          where: { id: conexaoExistente.id },
          data: {
            phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
            numeroWhatsApp: process.env.WHATSAPP_PHONE_NUMBER || '5511939205314',
            nomeInstancia: 'WhatsApp Business API',
            nomeExibicao: 'WhatsApp Oficial',
            status: 'CONECTADO', // ✅ CRÍTICO!
            corIdentificacao: '#25D366',
            ultimaConexao: new Date(),
            atualizadoEm: new Date()
          }
        });

        console.log('✅ Conexão atualizada:');
        console.log(`   ID: ${conexaoAtualizada.id}`);
        console.log(`   Status: ${conexaoAtualizada.status}`);
        console.log(`   Número: ${conexaoAtualizada.numeroWhatsApp}`);
        
      } else {
        console.log('🆕 Criando nova conexão...');
        
        const novaConexao = await prisma.conexaoWhatsApp.create({
          data: {
            contaId: conta.id,
            instancia: 1,
            phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
            numeroWhatsApp: process.env.WHATSAPP_PHONE_NUMBER || '5511939205314',
            nomeInstancia: 'WhatsApp Business API',
            nomeExibicao: 'WhatsApp Oficial',
            status: 'CONECTADO', // ✅ CRÍTICO!
            corIdentificacao: '#25D366',
            ultimaConexao: new Date()
          }
        });

        console.log('✅ Conexão criada:');
        console.log(`   ID: ${novaConexao.id}`);
        console.log(`   Status: ${novaConexao.status}`);
        console.log(`   Número: ${novaConexao.numeroWhatsApp}`);
      }
    }

    console.log('\n✅ ============================================');
    console.log('✅ PROCESSO CONCLUÍDO COM SUCESSO!');
    console.log('============================================\n');

    // Verificar conexões criadas
    const todasConexoes = await prisma.conexaoWhatsApp.findMany({
      include: {
        conta: {
          select: {
            razaoSocial: true,
            nomeFantasia: true
          }
        }
      }
    });

    console.log('📊 RESUMO DAS CONEXÕES:\n');
    todasConexoes.forEach(c => {
      console.log(`✓ ${c.nomeInstancia}`);
      console.log(`  Conta: ${c.conta.razaoSocial || c.conta.nomeFantasia}`);
      console.log(`  Status: ${c.status}`);
      console.log(`  Número: ${c.numeroWhatsApp}`);
      console.log(`  Instância: ${c.instancia}`);
      console.log('');
    });

  } catch (error) {
    console.error('\n❌ ERRO:', error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar
criarConexaoWhatsApp();