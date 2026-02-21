// backend/scripts/criarConexaoTodasContas.js
// ✅ Criar conexão WhatsApp Business para TODAS as contas

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function criarConexaoParaTodasContas() {
  try {
    console.log('\n🔧 ============================================');
    console.log('🔧 CRIAR CONEXÕES PARA TODAS AS CONTAS');
    console.log('============================================\n');

    // 1. Buscar TODAS as contas (mesmo inativas)
    const contas = await prisma.conta.findMany({
      select: {
        id: true,
        tipo: true,
        razaoSocial: true,
        nomeFantasia: true,
        nomeCompleto: true,
        email: true,
        ativo: true,
        status: true
      },
      orderBy: { criadoEm: 'asc' }
    });

    if (contas.length === 0) {
      console.error('❌ Nenhuma conta encontrada no banco!');
      console.log('💡 Crie uma conta primeiro.');
      process.exit(1);
    }

    console.log(`📋 Encontradas ${contas.length} conta(s):\n`);

    // 2. Listar todas
    contas.forEach((conta, index) => {
      const nome = conta.razaoSocial || conta.nomeFantasia || conta.nomeCompleto || 'Sem nome';
      const statusIcon = conta.ativo ? '✅' : '❌';
      
      console.log(`${index + 1}. ${statusIcon} ${nome}`);
      console.log(`   Email: ${conta.email}`);
      console.log(`   ID: ${conta.id}`);
      console.log(`   Status: ${conta.status}`);
      console.log('');
    });

    console.log('━'.repeat(60));
    console.log('🔄 Processando conexões...\n');

    // 3. Criar/atualizar conexão para cada conta
    let criadasOuAtualizadas = 0;
    let jaExistentes = 0;

    for (const conta of contas) {
      const nome = conta.razaoSocial || conta.nomeFantasia || conta.nomeCompleto || 'Sem nome';
      
      console.log(`\n🔍 Processando: ${nome}`);
      console.log(`   ID da Conta: ${conta.id}`);

      // Verificar se já existe conexão
      const conexaoExistente = await prisma.conexaoWhatsApp.findFirst({
        where: {
          contaId: conta.id,
          instancia: 1
        }
      });

      if (conexaoExistente) {
        // Atualizar para CONECTADO
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

        console.log('   ✅ Conexão ATUALIZADA:');
        console.log(`      ID: ${conexaoAtualizada.id}`);
        console.log(`      Status: ${conexaoAtualizada.status}`);
        console.log(`      Número: ${conexaoAtualizada.numeroWhatsApp}`);
        
        criadasOuAtualizadas++;

      } else {
        // Criar nova conexão
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

        console.log('   ✅ Conexão CRIADA:');
        console.log(`      ID: ${novaConexao.id}`);
        console.log(`      Status: ${novaConexao.status}`);
        console.log(`      Número: ${novaConexao.numeroWhatsApp}`);
        
        criadasOuAtualizadas++;
      }
    }

    console.log('\n' + '━'.repeat(60));
    console.log('\n✅ PROCESSO CONCLUÍDO!\n');
    console.log(`📊 Estatísticas:`);
    console.log(`   - Total de contas: ${contas.length}`);
    console.log(`   - Criadas/Atualizadas: ${criadasOuAtualizadas}`);
    console.log('');

    // 4. Mostrar resumo final
    const todasConexoes = await prisma.conexaoWhatsApp.findMany({
      include: {
        conta: {
          select: {
            razaoSocial: true,
            nomeFantasia: true,
            nomeCompleto: true,
            email: true
          }
        }
      },
      orderBy: { criadoEm: 'asc' }
    });

    console.log('━'.repeat(60));
    console.log('📊 RESUMO DE TODAS AS CONEXÕES:\n');

    todasConexoes.forEach((c, index) => {
      const nomeConta = c.conta.razaoSocial || c.conta.nomeFantasia || c.conta.nomeCompleto;
      const statusIcon = c.status === 'CONECTADO' ? '🟢' : '🔴';
      
      console.log(`${index + 1}. ${statusIcon} ${c.nomeInstancia}`);
      console.log(`   Conta: ${nomeConta}`);
      console.log(`   Email: ${c.conta.email}`);
      console.log(`   Status: ${c.status}`);
      console.log(`   Número: ${c.numeroWhatsApp}`);
      console.log(`   Phone ID: ${c.phoneNumberId || 'Não definido'}`);
      console.log(`   Conta ID: ${c.contaId}`);
      console.log('');
    });

    console.log('━'.repeat(60));
    console.log('\n✅ TODAS AS CONTAS AGORA TÊM CONEXÃO WHATSAPP!\n');

  } catch (erro) {
    console.error('\n❌ ERRO:', erro.message);
    console.error(erro);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar
criarConexaoParaTodasContas();