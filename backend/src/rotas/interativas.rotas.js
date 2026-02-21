// backend/src/rotas/interativas.rotas.js

const express = require('express');
const router = express.Router();
const interativasControlador = require('../controladores/interativas.controlador');
const { verificarToken } = require('../middleware/autenticacao.middleware');

// ✅ Middleware de autenticação
router.use(verificarToken);

// ============================================================
// BLOCO 4: MENSAGENS INTERATIVAS
// ============================================================

// Enviar mensagem com botões
router.post('/enviar-botoes', interativasControlador.enviarBotoes);

// Enviar lista interativa
router.post('/enviar-lista', interativasControlador.enviarLista);

// Enviar template
router.post('/enviar-template', interativasControlador.enviarTemplate);

module.exports = router;