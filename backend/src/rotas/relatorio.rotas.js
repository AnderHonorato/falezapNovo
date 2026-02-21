const express = require('express');
const router = express.Router();
const RelatorioControlador = require('../controladores/relatorio.controlador');
let authMiddleware = require('../middleware/autenticacao.middleware');

if (typeof authMiddleware !== 'function' && typeof authMiddleware === 'object') {
    const keys = Object.keys(authMiddleware);
    if (keys.length > 0 && typeof authMiddleware[keys[0]] === 'function') {
        authMiddleware = authMiddleware[keys[0]];
    }
}

// Rotas
router.get('/equipe/exportar', authMiddleware, RelatorioControlador.exportarRelatorioEquipe);
router.get('/equipe/exportar/pdf', authMiddleware, RelatorioControlador.exportarRelatorioEquipePDF); // ✅ Nova Rota

module.exports = router;