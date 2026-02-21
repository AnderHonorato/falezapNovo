// backend/src/teste-templates.js

require('dotenv').config();
const { buscarTemplatesDaMeta } = require('./servicos/meta-templates.servico');

async function testar() {
  try {
    // Coloque o ID da sua conexão aqui
    const CONEXAO_ID = 'seu-conexao-id-aqui';
    
    console.log('🧪 Testando busca de templates...\n');
    
    const resultado = await buscarTemplatesDaMeta(CONEXAO_ID);
    
    console.log('\n✅ SUCESSO!');
    console.log('Templates encontrados:', resultado.total);
    
    resultado.templates.forEach(t => {
      console.log(`\n📋 ${t.nomeTemplate}`);
      console.log(`   - Categoria: ${t.categoria}`);
      console.log(`   - Status: ${t.status}`);
      console.log(`   - Componentes: ${t.componentes.length}`);
    });
    
  } catch (error) {
    console.error('\n❌ ERRO:', error.message);
  }
}

testar();