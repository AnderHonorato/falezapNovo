// backend/src/rotas/autenticacao.rotas.js

const express = require('express');
const router = express.Router();

const {
  login,
  registrar,
  verificarSessao,
  esqueciSenha,    // ✅ Importar nova função
  resetarSenha,     // ✅ Importar nova função
  verificarSenhaAdmin // ✅ Importar nova função
} = require('../controladores/autenticacao.controlador');
const { verificarToken } = require('../middleware/autenticacao.middleware');

// Rotas existentes
router.post('/registro', registrar); // Mantido por compatibilidade, mas /registrar é preferível
router.post('/registrar', registrar);
router.post('/login', login);
router.get('/validar-token', verificarToken, verificarSessao); // Alias para verificar-sessao
router.get('/verificar-sessao', verificarToken, verificarSessao);

// ✅ Novas Rotas para Recuperação de Senha
router.post('/esqueci-senha', esqueciSenha); // Rota para solicitar o email de reset
router.post('/resetar-senha/:token', resetarSenha); // Rota para definir nova senha com o token

// ✅ Nova Rota para Verificar Senha do Admin Logado
router.post('/verificar-senha-admin', verificarToken, verificarSenhaAdmin);

module.exports = router;