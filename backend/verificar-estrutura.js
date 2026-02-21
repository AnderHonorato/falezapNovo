// backend/verificar-estrutura.js
// Execute este script para verificar se a estrutura está correta

const fs = require('fs');
const path = require('path');

console.log('🔍 Verificando estrutura de controladores...\n');

const basePath = path.join(__dirname, 'src', 'controladores');
const whatsappPath = path.join(basePath, 'Whatsapp');

const arquivosNecessarios = [
  'whatsapp.controlador.js',
  'Whatsapp/conexao.controlador.js',
  'Whatsapp/mensagens.controlador.js',
  'Whatsapp/conversas.controlador.js',
  'Whatsapp/anotacoes.controlador.js',
  'Whatsapp/utils.controlador.js'
];

let todosOk = true;

// Verificar pasta Whatsapp
if (!fs.existsSync(whatsappPath)) {
  console.error('❌ Pasta "Whatsapp" não encontrada em:', basePath);
  console.log('   Crie com: mkdir', whatsappPath);
  todosOk = false;
} else {
  console.log('✅ Pasta "Whatsapp" existe');
}

// Verificar cada arquivo
console.log('\n📄 Verificando arquivos:\n');

arquivosNecessarios.forEach(arquivo => {
  const caminhoCompleto = path.join(basePath, arquivo);
  
  if (!fs.existsSync(caminhoCompleto)) {
    console.error(`❌ ${arquivo} - NÃO ENCONTRADO`);
    todosOk = false;
  } else {
    // Verificar se tem module.exports
    const conteudo = fs.readFileSync(caminhoCompleto, 'utf8');
    
    if (!conteudo.includes('module.exports')) {
      console.error(`❌ ${arquivo} - FALTA "module.exports"`);
      todosOk = false;
    } else {
      console.log(`✅ ${arquivo}`);
    }
  }
});

console.log('\n' + '='.repeat(50));

if (todosOk) {
  console.log('✅ Estrutura OK! Tudo pronto para usar.');
} else {
  console.log('❌ Problemas encontrados. Corrija os erros acima.');
}

console.log('='.repeat(50) + '\n');