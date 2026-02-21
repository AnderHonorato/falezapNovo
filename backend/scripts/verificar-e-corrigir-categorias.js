// backend/scripts/verificar-e-corrigir-categorias.js

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verificarECorrigirCategorias() {
  console.log('🔍 Iniciando verificação e correção de categorias...\n');

  try {
    // 1. Listar todos os usuários e suas categorias
    console.log('📋 LISTANDO USUÁRIOS E CATEGORIAS:');
    console.log('='.repeat(60));
    
    const usuarios = await prisma.usuario.findMany({
      include: {
        categoria: true,
        conta: true
      }
    });

    usuarios.forEach(user => {
      console.log(`\n👤 ${user.nome} (${user.email})`);
      console.log(`   Conta: ${user.conta?.email || 'N/A'}`);
      console.log(`   Categoria: ${user.categoria?.nome || '❌ SEM CATEGORIA'}`);
      console.log(`   ID Categoria: ${user.categoriaId || 'null'}`);
    });

    console.log('\n' + '='.repeat(60));
    console.log('\n🔧 CORRIGINDO USUÁRIOS SEM CATEGORIA:\n');

    // 2. Para cada conta, garantir que tem categoria SAC
    const contas = await prisma.conta.findMany();

    for (const conta of contas) {
      console.log(`\n📦 Processando conta: ${conta.email}`);

      // Verificar se já existe categoria SAC
      let categoriaSAC = await prisma.categoria.findFirst({
        where: {
          contaId: conta.id,
          nome: 'SAC'
        }
      });

      // Se não existir, criar
      if (!categoriaSAC) {
        categoriaSAC = await prisma.categoria.create({
          data: {
            nome: 'SAC',
            contaId: conta.id
          }
        });
        console.log(`   ✅ Categoria SAC criada (ID: ${categoriaSAC.id})`);
      } else {
        console.log(`   ℹ️  Categoria SAC já existe (ID: ${categoriaSAC.id})`);
      }

      // 3. Vincular todos os usuários sem categoria a SAC
      const usuariosSemCategoria = await prisma.usuario.findMany({
        where: {
          contaId: conta.id,
          categoriaId: null
        }
      });

      if (usuariosSemCategoria.length > 0) {
        console.log(`   🔗 Vinculando ${usuariosSemCategoria.length} usuário(s) ao SAC...`);

        for (const user of usuariosSemCategoria) {
          await prisma.usuario.update({
            where: { id: user.id },
            data: { categoriaId: categoriaSAC.id }
          });
          console.log(`      → ${user.nome} vinculado`);
        }
      } else {
        console.log(`   ℹ️  Todos os usuários já têm categoria`);
      }
    }

    // 4. Verificação final
    console.log('\n' + '='.repeat(60));
    console.log('✅ VERIFICAÇÃO FINAL:');
    console.log('='.repeat(60));

    const usuariosAtualizados = await prisma.usuario.findMany({
      include: {
        categoria: true
      }
    });

    const semCategoria = usuariosAtualizados.filter(u => !u.categoriaId);

    if (semCategoria.length === 0) {
      console.log('\n🎉 SUCESSO! Todos os usuários têm categoria definida!\n');
    } else {
      console.log(`\n⚠️  ATENÇÃO: ${semCategoria.length} usuário(s) ainda sem categoria:`);
      semCategoria.forEach(u => {
        console.log(`   → ${u.nome} (${u.email})`);
      });
      console.log('');
    }

    // 5. Resumo
    console.log('📊 RESUMO:');
    console.log(`   Total de usuários: ${usuariosAtualizados.length}`);
    console.log(`   Com categoria: ${usuariosAtualizados.filter(u => u.categoriaId).length}`);
    console.log(`   Sem categoria: ${semCategoria.length}`);
    console.log('');

  } catch (erro) {
    console.error('❌ Erro durante a verificação:', erro);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar o script
verificarECorrigirCategorias()
  .then(() => {
    console.log('✅ Script finalizado!');
    process.exit(0);
  })
  .catch((erro) => {
    console.error('❌ Erro fatal:', erro);
    process.exit(1);
  });