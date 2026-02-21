// backend/src/rotas/conversas.rotas.js - CORRIGIDO E COMPLETO

const express = require('express');
const router = express.Router();
const ConversasControlador = require('../controladores/conversas.controlador.js'); 
const { verificarToken } = require('../middleware/autenticacao.middleware');

console.log('✅ Carregando rotas de conversas...');

// ===================================================
// ROTAS DE CONVERSA
// ===================================================

// GET /api/conversas
router.get(
  '/', 
  verificarToken, 
  // ✅ CORREÇÃO: Passa 'CHATS' para o controlador
  (req, res) => ConversasControlador.obterConversas(req, res, 'CHATS')
);

// POST /api/conversas
// (Rota principal para criar)
router.post(
  '/', 
  verificarToken, 
  (req, res) => ConversasControlador.criarConversa(req, res)
);

// ✅ CORREÇÃO: Rota "alias" para POST /api/conversas/criar que estava faltando
router.post(
  '/criar',
  verificarToken,
  (req, res) => ConversasControlador.criarConversa(req, res)
);
// ===================================================
// FIM DA CORREÇÃO
// ===================================================

// GET /api/conversas/:conversaId
router.get(
  '/:conversaId', 
  verificarToken, 
  (req, res) => ConversasControlador.obterDetalhesConversa(req, res)
);

// DELETE /api/conversas/:conversaId
router.delete(
  '/:conversaId', 
  verificarToken, 
  (req, res) => ConversasControlador.deletarConversa(req, res)
);

// PATCH /api/conversas/:conversaId
router.patch(
  '/:conversaId',
  verificarToken,
  (req, res) => ConversasControlador.atualizarConversa(req, res)
);

// PUT /api/conversas/acao/:conversaId
router.put(
  '/acao/:conversaId', 
  verificarToken, 
  (req, res) => ConversasControlador.acaoConversa(req, res)
);

// PUT /api/conversas/marcar-lida/:conversaId
router.put(
  '/marcar-lida/:conversaId', 
  verificarToken, 
  (req, res) => ConversasControlador.marcarComoLida(req, res)
);

// ===================================================
// ROTAS DE CONTATO/PERFIL
// ===================================================

// GET /api/conversas/perfil/:numero
router.get(
  '/perfil/:numero', 
  verificarToken, 
  (req, res) => ConversasControlador.obterPerfilContato(req, res)
);

// PUT /api/conversas/perfil/:numero
router.put(
  '/perfil/:numero', 
  verificarToken, 
  (req, res) => ConversasControlador.atualizarPerfilContato(req, res)
);

// ===================================================
// ROTAS DE ETIQUETAS (TAGS)
// ===================================================
// (Todas as rotas de etiquetas continuam aqui...)

// GET /api/conversas/etiquetas/listar
router.get(
  '/etiquetas/listar',
  verificarToken,
  (req, res) => ConversasControlador.listarEtiquetas(req, res)
);

// POST /api/conversas/etiquetas
router.post(
  '/etiquetas',
  verificarToken,
  (req, res) => ConversasControlador.criarEtiqueta(req, res)
);

// PUT /api/conversas/etiquetas/:etiquetaId
router.put(
  '/etiquetas/:etiquetaId',
  verificarToken,
  (req, res) => ConversasControlador.atualizarEtiqueta(req, res)
);

// DELETE /api/conversas/etiquetas/:etiquetaId
router.delete(
  '/etiquetas/:etiquetaId',
  verificarToken,
  (req, res) => ConversasControlador.deletarEtiqueta(req, res)
);

// POST /api/conversas/:conversaId/etiquetas/:etiquetaId
router.post(
  '/:conversaId/etiquetas/:etiquetaId',
  verificarToken,
  (req, res) => ConversasControlador.adicionarEtiqueta(req, res)
);

// DELETE /api/conversas/:conversaId/etiquetas/:etiquetaId
router.delete(
  '/:conversaId/etiquetas/:etiquetaId',
  verificarToken,
  (req, res) => ConversasControlador.removerEtiqueta(req, res)
);

console.log('✅ Rotas de conversas carregadas com sucesso!');

module.exports = router;