// ========================================
// backend/src/permissoes/index.js
// ========================================

const { HIERARQUIA_PERMISSOES } = require('./hierarquia');
const {
  verificarOwner,
  verificarCEO,
  verificarAdmin,
  verificarRelatorios,
  verificarPermissao,
  verificarPermissaoAlerta,
  verificarHierarquia,
  verificarEncarregado,
  verificarAcessoPagina,
  verificarQualquerPermissao,
  verificarTodasPermissoes,
} = require('./verificadores');

module.exports = {
  HIERARQUIA_PERMISSOES,
  verificarOwner,
  verificarCEO,
  verificarAdmin,
  verificarEncarregado,
  verificarRelatorios,
  verificarPermissaoAlerta,
  verificarPermissao,
  verificarHierarquia,
  verificarAcessoPagina,
  verificarQualquerPermissao,
  verificarTodasPermissoes,
};