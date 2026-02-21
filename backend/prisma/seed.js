// backend/prisma/seed.js
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

dotenv.config();

// Inicializa o Prisma Client
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed do banco de dados FaleZap...');

  // 1. DADOS DE TESTE
  const OWNER_EMAIL = 'honoratoann@gmail.com';
  const OWNER_NOME = 'Anderson (Owner)';
  const OWNER_SENHA = '@honoratoann.23';
  const CNPJ_DUMMY = '00.000.000/0001-00';
  const TELEFONE_PRINCIPAL = '77999512937';

  // Gerar hash da senha
  const senhaHash = await bcrypt.hash(OWNER_SENHA, 10);

  // 2. CRIAR CONTA DO OWNER (EMPRESA)
  try {
    const contaOwner = await prisma.conta.upsert({
      where: { email: OWNER_EMAIL }, // Usar email como chave de busca para ser mais robusto
      update: {},
      create: {
        tipo: 'EMPRESA',
        // Campos Mínimos/Chaves Únicas:
        documento: CNPJ_DUMMY,
        email: OWNER_EMAIL,
        
        // Campos Obrigatórios (se não tiver default no schema) ou importantes:
        razaoSocial: 'Empresa Administradora',
        nomeFantasia: 'FaleZap Admin',
        telefone: TELEFONE_PRINCIPAL,
        ativo: true,
        
        // Novos campos (Se forem NOT NULL no DB, precisam de valor aqui)
        emailPrincipal: OWNER_EMAIL,
        telefonePrincipal: TELEFONE_PRINCIPAL,
        cep: '99999-999',
        logradouro: 'Rua do Admin',
        numero: '100',
        bairro: 'Centro',
        cidade: 'Cidade Admin',
        estado: 'RS',
        status: 'ATIVO',
      },
    });
    console.log(`✅ Conta OWNER (${contaOwner.id}) criada/atualizada: ${contaOwner.email}`);
  
    // 3. CRIAR USUÁRIO OWNER
    const usuarioOwner = await prisma.usuario.upsert({
      where: { email: OWNER_EMAIL },
      update: {},
      create: {
        nome: OWNER_NOME,
        email: OWNER_EMAIL,
        senha: senhaHash,
        tipo: 'OWNER',
        status: 'ATIVO',
        contaId: contaOwner.id,
        
        // Permissões originais
        podeEnviarMsg: true,
        podeReceberMsg: true,
        podeGerenciarBot: true,
        podeVerRelatorios: true,
        podeGerenciarConexoes: true,

        // Novos campos (Se o DB for sincronizado, estes são necessários)
        cargo: 'CEO', 
        departamento: 'TI',
      },
    });
    console.log(`✅ Usuário OWNER (${usuarioOwner.id}) criado/atualizado: ${usuarioOwner.email}`);
  
    // 4. CRIAR CONFIGURAÇÃO PADRÃO DO BOT
    const configBot = await prisma.configuracaoBot.upsert({
      where: { id: 'default-config' },
      update: {},
      create: {
        id: 'default-config',
        mensagemBoasVindas: 'Olá! Bem-vindo ao atendimento FaleZap. Como posso ajudar você hoje?',
        mensagemForaHorario:
          'Nosso horário de atendimento é de segunda a sexta, das 8h às 18h. Deixe sua mensagem e retornaremos assim que possível!',
        horarioInicio: '08:00',
        horarioFim: '18:00',
        diasSemana: ['SEG', 'TER', 'QUA', 'QUI', 'SEX'],
        tempoEsperaBot: 30,
        ativo: true,
      },
    });
    console.log('✅ Configuração padrão do bot criada');
  
    console.log('\n🎉 Seed do FaleZap concluído com sucesso!');
    console.log(`\n📧 Email do OWNER: ${OWNER_EMAIL}`);
    console.log(`🔑 Senha do OWNER: ${OWNER_SENHA}`);
    console.log('\n⚠️ IMPORTANTE: Altere a senha após o primeiro login!\n');

  } catch (e) {
    console.error('❌ Erro durante o seed do banco de dados:', e);
    // Verificar se o erro é P2002 (Unique constraint failed) ou P2022 (Coluna inexistente)
    if (e.code === 'P2002') {
        console.error('=> DICA: Um registro único (e.g., email ou documento) já existe. O upsert deveria ter evitado isso, verifique o campo "where".');
    } else if (e.code === 'P2022' || e.message.includes('column') && e.message.includes('does not exist')) {
        console.error('=> DICA: Sua tabela de banco de dados está desatualizada. Execute "npx prisma db push --force-reset" (se puder perder dados) ou "npx prisma migrate dev" (se tiver feito as correções manuais do SQL).');
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();