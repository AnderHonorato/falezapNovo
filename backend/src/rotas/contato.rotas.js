//Z:\Programação\Backup\MultiWhatsapp\falezap-sistema\backend\src\rotas\contato.rotas.js
const express = require('express');
const router = express.Router();
const ConversasControlador = require('../controladores/conversas.controlador.js');
const { verificarToken } = require('../middleware/autenticacao.middleware');

// ✅ 1. Importar o middleware de upload
const upload = require('../middleware/uploadcontato.middleware');

console.log('✅ Carregando rotas de contatos...');

// ===================================================
// ROTAS DE CONTATO
// ===================================================

// GET /api/contatos
router.get(
  '/',
  verificarToken,
  (req, res) => {
    ConversasControlador.obterConversas(req, res, 'CONTATOS');
  }
);

// GET /api/contatos/verificar/:numero
router.get(
  '/verificar/:numero',
  verificarToken,
  (req, res) => {
    ConversasControlador.verificarContato(req, res);
  }
);

// GET /api/contatos/exportar/vcf
router.get(
  '/exportar/vcf',
  verificarToken,
  (req, res) => {
    ConversasControlador.exportarContatosVCF(req, res);
  }
);

// POST /api/contatos
router.post(
  '/', 
  verificarToken, 
  (req, res) => {
    ConversasControlador.criarContato(req, res);
  }
);

// PUT /api/contatos/:id
router.put(
  '/:id', 
  verificarToken, 
  (req, res) => {
    req.params.conversaId = req.params.id;
    ConversasControlador.atualizarConversa(req, res);
  }
);

// ✅ 2. NOVA ROTA: POST /api/contatos/importar
// Usamos 'upload.single('arquivo')' para processar o arquivo
router.post(
  '/importar',
  verificarToken,
  upload.single('arquivo'), // O nome 'arquivo' deve bater com o FormData do frontend
  (req, res) => {
    ConversasControlador.importarContatosVCF(req, res);
  }
);

console.log('✅ Rotas de contatos carregadas com sucesso!');

module.exports = router;