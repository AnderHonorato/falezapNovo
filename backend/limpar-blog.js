// limpar-blog.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🗑️ Iniciando limpeza cirúrgica do Blog...');

  try {
    // 1. Apagar tabelas filhas primeiro (Comentários e Likes)
    // Usamos SQL puro para garantir que funcione mesmo se o Prisma estiver confuso
    await prisma.$executeRawUnsafe(`DELETE FROM "comentarios_blog";`);
    console.log('✅ Comentários apagados.');

    await prisma.$executeRawUnsafe(`DELETE FROM "likes_blog";`);
    console.log('✅ Likes apagados.');

    // 2. Apagar tabela pai (Posts antigos)
    // O nome antigo da tabela era "posts_blog" ou "Post" dependendo da versão anterior
    try {
        await prisma.$executeRawUnsafe(`DELETE FROM "posts_blog";`);
        console.log('✅ Posts antigos apagados.');
    } catch (e) {
        console.log('ℹ️ Tabela posts_blog já estava vazia ou não existe.');
    }

    console.log('🎉 Limpeza concluída! Agora você pode rodar o db push.');
  } catch (error) {
    console.error('❌ Erro ao limpar:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();