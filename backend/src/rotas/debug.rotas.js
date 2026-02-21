// ========================================
// ARQUIVO: backend/src/rotas/debug.rotas.js
// ========================================
// Crie este arquivo temporário para testar o avatar

const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');

// Rota de debug para verificar se os arquivos existem
router.get('/debug/avatar/:filename', (req, res) => {
  const { filename } = req.params;
  const UPLOADS_DIR = path.join(__dirname, '../../uploads/avatars');
  const filePath = path.join(UPLOADS_DIR, filename);
  
  console.log('=== DEBUG AVATAR ===');
  console.log('📂 Pasta uploads:', UPLOADS_DIR);
  console.log('📄 Arquivo solicitado:', filename);
  console.log('🔗 Caminho completo:', filePath);
  console.log('✅ Arquivo existe?', fs.existsSync(filePath));
  
  if (fs.existsSync(filePath)) {
    console.log('📊 Tamanho do arquivo:', fs.statSync(filePath).size, 'bytes');
    
    // Lista TODOS os arquivos na pasta
    console.log('📁 Arquivos na pasta avatars:');
    const arquivos = fs.readdirSync(UPLOADS_DIR);
    arquivos.forEach(file => {
      const stats = fs.statSync(path.join(UPLOADS_DIR, file));
      console.log(`   - ${file} (${stats.size} bytes)`);
    });
    
    res.json({
      sucesso: true,
      arquivo: filename,
      existe: true,
      tamanho: fs.statSync(filePath).size,
      caminho: filePath,
      todosArquivos: arquivos
    });
  } else {
    res.status(404).json({
      sucesso: false,
      erro: 'Arquivo não encontrado',
      arquivo: filename,
      caminho: filePath,
      pastaExiste: fs.existsSync(UPLOADS_DIR),
      arquivosNaPasta: fs.existsSync(UPLOADS_DIR) 
        ? fs.readdirSync(UPLOADS_DIR) 
        : []
    });
  }
});

// Rota para testar o acesso direto ao arquivo
router.get('/debug/serve-avatar/:filename', (req, res) => {
  const { filename } = req.params;
  const UPLOADS_DIR = path.join(__dirname, '../../uploads/avatars');
  const filePath = path.join(UPLOADS_DIR, filename);
  
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).send('Arquivo não encontrado');
  }
});

module.exports = router;