// backend/src/rotas/templates.rotas.js

const express = require('express');
const router = express.Router();
const templatesControlador = require('../controladores/templates.controlador');
const { verificarToken } = require('../middleware/autenticacao.middleware');

// Todas as rotas protegidas
router.use(verificarToken);

// Listar templates (com cache automático)
router.get('/', templatesControlador.listarTemplates);

// Sincronizar templates manualmente
router.post('/sincronizar', templatesControlador.sincronizarTemplatesManual);

// Buscar detalhes de um template
router.get('/:id', templatesControlador.buscarTemplate);

module.exports = router;