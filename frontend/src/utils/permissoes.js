// frontend/src/utils/permissoes.js

export const HIERARQUIA = {
  COLABORADOR: 1,
  ENCARREGADO: 2, // ou ADMIN no seu sistema antigo
  ADMIN: 3,       // Encarregado
  ADMIN_EMPRESA: 3, // Empresário
  CEO: 4,
  SUPORTE: 5,
  OWNER: 5
};

/**
 * Verifica se o usuário logado tem hierarquia superior ou igual ao alvo.
 * @param {object} usuarioLogado - Objeto do usuário logado
 * @param {string|object} alvo - Tipo do alvo (string) ou objeto do usuário alvo
 * @returns {boolean}
 */
export const podeGerenciar = (usuarioLogado, alvo) => {
  if (!usuarioLogado) return false;
  
  // OWNER e SUPORTE podem tudo
  if (usuarioLogado.tipo === 'OWNER' || usuarioLogado.tipo === 'SUPORTE') return true;

  const nivelLogado = HIERARQUIA[usuarioLogado.tipo] || 0;
  
  let tipoAlvo = typeof alvo === 'string' ? alvo : alvo?.tipo;
  const nivelAlvo = HIERARQUIA[tipoAlvo] || 0;

  // CEO (4) pode gerenciar ADMIN_EMPRESA (3) e abaixo
  return nivelLogado > nivelAlvo;
};

/**
 * Verifica se o usuário tem acesso a uma funcionalidade baseada em nível mínimo
 */
export const temNivel = (usuarioLogado, nivelMinimoStr) => {
    if (!usuarioLogado) return false;
    const nivelLogado = HIERARQUIA[usuarioLogado.tipo] || 0;
    const nivelNecessario = HIERARQUIA[nivelMinimoStr] || 0;
    return nivelLogado >= nivelNecessario;
};