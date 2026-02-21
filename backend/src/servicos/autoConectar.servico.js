// backend/src/servicos/autoConectar.servico.js
// ✅ Serviço para garantir que a conexão WhatsApp Business API esteja sempre ativa

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * 🔄 Garantir que todas as contas tenham conexão WhatsApp Business
 */
async function garantirConexaoWhatsAppBusiness() {
  try {
    console.log('\n🔧 [AUTO-CONECTAR] Iniciando verificação...');

    // 1. Buscar TODAS as contas (não apenas ativas)
    const contas = await prisma.conta.findMany({
      select: {
        id: true,
        razaoSocial: true,
        nomeFantasia: true,
        nomeCompleto: true,
        email: true,
        ativo: true,
        status: true
      }
    });

    if (contas.length === 0) {
      console.log('⚠️ [AUTO-CONECTAR] Nenhuma conta encontrada');
      return;
    }

    console.log(`📋 [AUTO-CONECTAR] Processando ${contas.length} conta(s)...`);

    // 2. Para cada conta, garantir conexão
    for (const conta of contas) {
      const nomeConta = conta.razaoSocial || conta.nomeFantasia || 'Sem nome';
      
      console.log(`\n🔍 [AUTO-CONECTAR] Verificando: ${nomeConta}`);

      // Verificar se já existe conexão
      let conexao = await prisma.conexaoWhatsApp.findFirst({
        where: {
          contaId: conta.id,
          instancia: 1
        }
      });

      if (conexao) {
        // Conexão existe - apenas atualizar para CONECTADO
        console.log('   ✓ Conexão existente encontrada');
        
        if (conexao.status !== 'CONECTADO') {
          conexao = await prisma.conexaoWhatsApp.update({
            where: { id: conexao.id },
            data: {
              status: 'CONECTADO',
              numeroWhatsApp: process.env.WHATSAPP_PHONE_NUMBER || '5511939205314',
              phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
              nomeInstancia: 'WhatsApp Business API',
              nomeExibicao: 'WhatsApp Oficial',
              ultimaConexao: new Date(),
              atualizadoEm: new Date()
            }
          });
          
          console.log('   ✅ Status atualizado para CONECTADO');
        } else {
          console.log('   ✅ Já está CONECTADO');
        }
      } else {
        // Conexão não existe - criar nova
        console.log('   🆕 Criando nova conexão...');
        
        conexao = await prisma.conexaoWhatsApp.create({
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
        
        console.log('   ✅ Conexão criada com sucesso');
      }

      console.log(`   📱 Número: ${conexao.numeroWhatsApp}`);
      console.log(`   🔌 Status: ${conexao.status}`);
      console.log(`   🆔 ID: ${conexao.id}`);
    }

    console.log('\n✅ [AUTO-CONECTAR] Verificação concluída!\n');

    return true;

  } catch (erro) {
    console.error('❌ [AUTO-CONECTAR] Erro:', erro.message);
    console.error(erro);
    return false;
  }
}

/**
 * 🧹 Limpar conexões duplicadas (opcional - para manutenção)
 */
async function limparConexoesDuplicadas() {
  try {
    console.log('\n🧹 [LIMPEZA] Verificando duplicatas...');

    const contas = await prisma.conta.findMany({
      where: { ativo: true },
      select: { id: true }
    });

    for (const conta of contas) {
      // Buscar todas as conexões da instância 1
      const conexoes = await prisma.conexaoWhatsApp.findMany({
        where: {
          contaId: conta.id,
          instancia: 1
        },
        orderBy: { criadoEm: 'desc' }
      });

      if (conexoes.length > 1) {
        console.log(`⚠️ [LIMPEZA] ${conexoes.length} duplicatas encontradas para conta ${conta.id}`);
        
        // Manter apenas a mais recente
        const [maisRecente, ...duplicatas] = conexoes;
        
        console.log(`   ✓ Mantendo: ${maisRecente.id} (${maisRecente.criadoEm})`);
        
        for (const duplicata of duplicatas) {
          console.log(`   🗑️ Removendo: ${duplicata.id} (${duplicata.criadoEm})`);
          
          // Deletar conversas e mensagens associadas
          await prisma.conversa.deleteMany({
            where: { conexaoWhatsAppId: duplicata.id }
          });
          
          // Deletar conexão duplicada
          await prisma.conexaoWhatsApp.delete({
            where: { id: duplicata.id }
          });
        }
        
        console.log(`   ✅ ${duplicatas.length} duplicata(s) removida(s)`);
      }
    }

    console.log('✅ [LIMPEZA] Verificação concluída\n');
    return true;

  } catch (erro) {
    console.error('❌ [LIMPEZA] Erro:', erro.message);
    return false;
  }
}

/**
 * 📊 Verificar saúde das conexões
 */
async function verificarSaudeConexoes() {
  try {
    const conexoes = await prisma.conexaoWhatsApp.findMany({
      where: { status: 'CONECTADO' },
      include: {
        conta: {
          select: {
            razaoSocial: true,
            nomeFantasia: true
          }
        },
        _count: {
          select: {
            conversas: true
          }
        }
      }
    });

    console.log('\n📊 [STATUS] Conexões Ativas:');
    console.log('═'.repeat(60));

    if (conexoes.length === 0) {
      console.log('⚠️ Nenhuma conexão ativa encontrada!');
      console.log('💡 Execute: node scripts/criarConexaoWhatsApp.js');
    } else {
      conexoes.forEach(c => {
        const nomeConta = c.conta.razaoSocial || c.conta.nomeFantasia;
        console.log(`\n✓ ${c.nomeInstancia}`);
        console.log(`  Conta: ${nomeConta}`);
        console.log(`  Número: ${c.numeroWhatsApp}`);
        console.log(`  Status: ${c.status}`);
        console.log(`  Conversas: ${c._count.conversas}`);
        console.log(`  Phone ID: ${c.phoneNumberId || 'Não definido'}`);
      });
    }

    console.log('\n' + '═'.repeat(60) + '\n');

    return conexoes;

  } catch (erro) {
    console.error('❌ [STATUS] Erro:', erro.message);
    return [];
  }
}

module.exports = {
  garantirConexaoWhatsAppBusiness,
  limparConexoesDuplicadas,
  verificarSaudeConexoes
};