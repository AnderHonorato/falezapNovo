const express = require('express');
const router = express.Router();
const uploadMidia = require('../middleware/uploadMidia.middleware');

const {
  criarPost,
  listarPosts,
  obterPostPorSlug,
  editarPost,
  excluirPost,
  toggleLike,
  listarComentarios,
  criarComentario,
  listarPostsRecentes,
  toggleLikeComentario,
  editarComentario,
  excluirComentario,
  listarRecomendados,
  arquivarPost,
  destacarPost,
  incrementarVisualizacao,
  toggleSalvarPost,
  listarTags,
  // ✅ Novas Importações de Configuração
  obterConfiguracoesBlog,
  salvarConfiguracoesBlog
} = require('../controladores/blog.controlador');

const { verificarToken, verificarTokenOpcional } = require('../middleware/autenticacao.middleware');
const { verificarAdmin } = require('../permissoes');

// --- Rotas Públicas (Leitura) ---
router.get('/', verificarTokenOpcional, listarPosts);
router.get('/posts-recentes', verificarTokenOpcional, listarPostsRecentes);
router.get('/recomendados', verificarTokenOpcional, listarRecomendados);
router.get('/tags', verificarTokenOpcional, listarTags); 
router.get('/config', verificarTokenOpcional, obterConfiguracoesBlog); // ✅ Busca Config Global
router.get('/:slug', verificarTokenOpcional, obterPostPorSlug);
router.get('/:postId/comentarios', verificarTokenOpcional, listarComentarios);

router.patch('/posts/:id/view', incrementarVisualizacao);

// --- Rotas Protegidas (Interação) ---
router.post('/comentarios/:id/like', verificarToken, toggleLikeComentario);
router.put('/comentarios/:id', verificarToken, editarComentario);
router.delete('/comentarios/:id', verificarToken, excluirComentario);

router.post('/:postId/like', verificarToken, toggleLike);
router.post('/:postId/comentarios', verificarToken, criarComentario);
router.post('/:id/salvar', verificarToken, toggleSalvarPost); 

// --- Rotas Administrativas ---
router.post('/', verificarToken, verificarAdmin, uploadMidia.single('imagem'), criarPost);
router.put('/posts/:id', verificarToken, verificarAdmin, uploadMidia.single('imagem'), editarPost);
router.delete('/posts/:id', verificarToken, verificarAdmin, excluirPost);
router.patch('/posts/:id/arquivar', verificarToken, arquivarPost); 
router.patch('/posts/:id/destaque', verificarToken, destacarPost); 

// ✅ Rota de salvar configurações (Admin/Owner)
router.post('/config', verificarToken, verificarAdmin, salvarConfiguracoesBlog);

module.exports = router;