// backend/src/rotas/usuario.rotas.js
const express = require('express');
const router = express.Router();
const {
  listarUsuarios,
  listarMembrosDaEquipe,
  listarEquipeOnline, // ✅ ADICIONADO: A função nova que criamos
  listarUsuariosPendentes,
  criarUsuario,
  atualizarUsuario,
  alterarStatusUsuario,
  aprovarReprovarUsuario,
  deletarUsuario,
  obterPerfil,
  atualizarPerfil,
  atualizarPaginaAtualUsuario
} = require('../controladores/usuario.controlador');
const { verificarToken } = require('../middleware/autenticacao.middleware');
const { verificarAdmin } = require('../permissoes/verificadores');

const uploadAvatar = require('../middleware/uploadAvatar');

// Rotas Protegidas (exigem login, mas qualquer nível de usuário)
router.use(verificarToken);

// GET /api/usuarios/perfil - Obter o próprio perfil
router.get('/perfil', obterPerfil);

// PUT /api/usuarios/perfil - Atualizar o próprio perfil
router.put('/perfil', uploadAvatar.single('avatar'), atualizarPerfil);

// POST /api/usuarios/atualizar-pagina - Atualizar página atual
router.post('/atualizar-pagina', atualizarPaginaAtualUsuario);

// GET /api/usuarios/equipe-membros - Listar membros (para select/chat)
router.get('/equipe-membros', listarMembrosDaEquipe);

// ✅ NOVA ROTA (DASHBOARD):
// Esta rota precisa estar AQUI, antes das administrativas.
// Ela permite que qualquer usuário logado veja quem está online.
router.get('/equipe-online', listarEquipeOnline);

// --- Rotas Administrativas (Daqui para baixo, só Admin vê) ---

// GET /api/usuarios - Listar todos os usuários (Admin+)
router.get('/', verificarAdmin, listarUsuarios);

// GET /api/usuarios/pendentes - Listar usuários pendentes (Admin+)
router.get('/pendentes', verificarAdmin, listarUsuariosPendentes);

// POST /api/usuarios - Criar novo usuário (Admin+)
router.post('/', verificarAdmin, criarUsuario);

// PUT /api/usuarios/:id - Atualizar usuário (Admin+)
router.put('/:id', verificarAdmin, atualizarUsuario);

// PATCH /api/usuarios/:id/status - Ativar/Inativar (Admin+)
router.patch('/:id/status', verificarAdmin, alterarStatusUsuario);

// PATCH /api/usuarios/:id/aprovar - Aprovar/Reprovar (Admin+)
router.patch('/:id/aprovar', verificarAdmin, aprovarReprovarUsuario);

// DELETE /api/usuarios/:id - Deletar usuário (Admin+)
router.delete('/:id', verificarAdmin, deletarUsuario);

module.exports = router;