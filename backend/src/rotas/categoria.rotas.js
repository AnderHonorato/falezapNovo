// backend/src/rotas/categoria.rotas.js
const express = require('express');
const router = express.Router();
const {
  listarCategorias,
  criarCategoria,
  atualizarCategoria,
  deletarCategoria
} = require('../controladores/categoria.controlador');
const { verificarToken } = require('../middleware/autenticacao.middleware');
// ✅ IMPORTAÇÃO CORRIGIDA
const { verificarAdmin } = require('../permissoes/verificadores');

// Todas as rotas protegidas e restritas a administradores
router.use(verificarToken, verificarAdmin);

// Rotas CRUD
router.get('/', listarCategorias);        // GET /api/categorias
router.post('/', criarCategoria);         // POST /api/categorias
router.put('/:id', atualizarCategoria);   // PUT /api/categorias/:id
router.delete('/:id', deletarCategoria);  // DELETE /api/categorias/:id

module.exports = router;