// backend/src/permissoes/hierarquia.js

/**
 * Define a hierarquia de poder para cada tipo de usuário.
 * Números maiores têm mais privilégios.
 */
const HIERARQUIA_PERMISSOES = {
  COLABORADOR: 1,
  ENCARREGADO: 2,
  ADMIN: 3,
  EMPRESARIO: 3, // Alias para ADMIN_EMPRESA
  ADMIN_EMPRESA: 3,
  CEO: 4,
  OWNER: 5,
  SUPORTE: 5 // Suporte tem hierarquia alta para ver tudo
};

module.exports = {
  HIERARQUIA_PERMISSOES
};