// backend/src/permissoes/verificadores.js

const { HIERARQUIA_PERMISSOES } = require('./hierarquia');

/**
 * Verifica se o usuário é OWNER.
 * Bloqueia qualquer outro tipo.
 */
const verificarOwner = (req, res, next) => {
  if (req.usuario.tipo !== 'OWNER') {
    return res.status(403).json({ 
      erro: 'Acesso negado. Apenas o OWNER pode acessar.' 
    });
  }
  next();
};

/**
 * Verifica se o usuário é CEO ou superior (OWNER, SUPORTE).
 * Nível hierárquico 4+.
 */
const verificarCEO = (req, res, next) => {
  const hierarquiaUsuario = HIERARQUIA_PERMISSOES[req.usuario.tipo] || 0;
  
  if (hierarquiaUsuario < 4) {
    return res.status(403).json({ 
      erro: 'Acesso negado. Apenas CEO ou OWNER podem acessar.' 
    });
  }
  next();
};

/**
 * Verifica se o usuário é Admin ou superior (ADMIN, EMPRESARIO, CEO, OWNER, SUPORTE).
 * Nível hierárquico 3+.
 */
const verificarAdmin = (req, res, next) => {
  const hierarquiaUsuario = HIERARQUIA_PERMISSOES[req.usuario.tipo] || 0;
  
  if (hierarquiaUsuario < 3) {
    return res.status(403).json({ 
      erro: 'Acesso negado. Apenas administradores podem acessar.' 
    });
  }
  next();
};

/**
 * Verifica se o usuário é Encarregado ou superior.
 * Nível hierárquico 2+.
 */
const verificarEncarregado = (req, res, next) => {
  const hierarquiaUsuario = HIERARQUIA_PERMISSOES[req.usuario.tipo] || 0;
  
  if (hierarquiaUsuario < 2) {
    const tiposPermitidos = Object.keys(HIERARQUIA_PERMISSOES)
      .filter(tipo => HIERARQUIA_PERMISSOES[tipo] >= 2)
      .join(', ');
      
    return res.status(403).json({ 
      erro: `Você não tem permissão. Tipos permitidos: ${tiposPermitidos}`,
      seuTipo: req.usuario.tipo,
      suaHierarquia: hierarquiaUsuario,
      necessaria: 2
    });
  }
  next();
};

/**
 * Verifica se o usuário tem a permissão granular 'podeVerRelatorios'
 * ou se é de um tipo que sempre pode ver (Admin+).
 */
const verificarRelatorios = (req, res, next) => {
  const usuario = req.usuario;

  if (!usuario) {
    return res.status(401).json({ 
      erro: 'Usuário não autenticado.' 
    });
  }

  // OWNER, CEO e ADMIN_EMPRESA sempre podem
  if (usuario.tipo === 'OWNER' || usuario.tipo === 'CEO' || usuario.tipo === 'ADMIN_EMPRESA') {
    return next();
  }

  // Outros usuários precisam da permissão específica
  if (usuario.podeVerRelatorios) {
    return next();
  }

  return res.status(403).json({ 
    erro: 'Você não tem permissão para acessar relatórios.' 
  });
};

/**
 * Factory de middleware: Verifica permissão genérica (aceita array de tipos OU campo boolean).
 * @param {string[] | string} permissao - Array de tipos (ex: ['OWNER', 'ADMIN']) ou string de permissão (ex: 'podeGerenciarBot')
 */
const verificarPermissao = (permissao) => {
  return (req, res, next) => {
    const usuario = req.usuario;

    // OWNER sempre tem acesso total
    if (usuario.tipo === 'OWNER') {
      return next();
    }

    // Se for array de tipos permitidos
    if (Array.isArray(permissao)) {
      if (permissao.includes(usuario.tipo)) {
        return next();
      }
      return res.status(403).json({ 
        erro: `Acesso negado. Tipos permitidos: ${permissao.join(', ')}` 
      });
    }

    // Se for string (nome de campo de permissão)
    if (typeof permissao === 'string') {
      // Verifica se o usuário tem essa permissão ativada
      if (usuario[permissao] === true) {
        return next();
      }
      return res.status(403).json({ 
        erro: `Você não tem a permissão: ${permissao}` 
      });
    }

    return res.status(403).json({ 
      erro: 'Permissão não reconhecida.' 
    });
  };
};

/**
 * Verifica permissão para enviar alertas (Admin, Suporte, etc.)
 */
const verificarPermissaoAlerta = (req, res, next) => {
  const tiposPermitidos = ['ADMIN', 'ADMIN_EMPRESA', 'EMPRESARIO', 'CEO', 'OWNER', 'SUPORTE', 'ENCARREGADO'];
  
  if (!tiposPermitidos.includes(req.usuario.tipo)) {
    return res.status(403).json({ 
      erro: `Apenas ${tiposPermitidos.join(', ')} podem enviar alertas.`,
      seuTipo: req.usuario.tipo
    });
  }
  
  next();
};

/**
 * Factory de middleware: Verifica hierarquia mínima.
 * @param {number} hierarquiaMinima - Nível mínimo da HIERARQUIA_PERMISSOES
 */
const verificarHierarquia = (hierarquiaMinima) => {
  return (req, res, next) => {
    const hierarquiaUsuario = HIERARQUIA_PERMISSOES[req.usuario.tipo] || 0;
    
    if (hierarquiaUsuario < hierarquiaMinima) {
      const tiposPermitidos = Object.keys(HIERARQUIA_PERMISSOES)
        .filter(tipo => HIERARQUIA_PERMISSOES[tipo] >= hierarquiaMinima)
        .join(', ');
      
      return res.status(403).json({ 
        erro: `Você não tem permissão. Tipos permitidos: ${tiposPermitidos}`,
        seuTipo: req.usuario.tipo,
        suaHierarquia: hierarquiaUsuario,
        necessaria: hierarquiaMinima
      });
    }
    
    next();
  };
};

/**
 * Factory de middleware: Verifica permissão de acesso a uma página específica.
 * @param {string} nomePagina - Chave da página (ex: 'mensagens', 'analytics')
 */
const verificarAcessoPagina = (nomePagina) => {
  return (req, res, next) => {
    const usuario = req.usuario;

    // OWNER sempre tem acesso
    if (usuario.tipo === 'OWNER') {
      return next();
    }

    // Mapeia nomes de páginas para campos de permissão
    const mapaPaginas = {
      'dashboard': 'podeAcessarDashboard',
      'mensagens': 'podeAcessarMensagens',
      'whatsapp': 'podeAcessarWhatsApp',
      'empresas': 'podeAcessarEmpresasUsuarios',
      'usuarios': 'podeAcessarEmpresasUsuarios',
      'blog': 'podeAcessarBlog',
      'analytics': 'podeAcessarAnalytics',
      'equipe': 'podeAcessarEquipe',
      'suporte': 'podeAcessarSuporte',
      'chat-interno': 'podeAcessarChatInterno',
    };

    const campoPermissao = mapaPaginas[nomePagina];

    if (!campoPermissao) {
      console.warn(`⚠️ Página desconhecida no middleware: ${nomePagina}`);
      return next(); // Permite por padrão se não reconhecer
    }

    if (usuario[campoPermissao] === true) {
      return next();
    }

    return res.status(403).json({ 
      erro: `Você não tem permissão para acessar: ${nomePagina}`,
      permissaoNecessaria: campoPermissao
    });
  };
};

/**
 * Factory de middleware: Verifica se o usuário tem PELO MENOS UMA (OR) das permissões.
 * @param  {...string|string[]} permissoes - Permissões (ex: 'podeGerenciarBot', ['OWNER', 'CEO'])
 */
const verificarQualquerPermissao = (...permissoes) => {
  return (req, res, next) => {
    const usuario = req.usuario;

    // OWNER sempre passa
    if (usuario.tipo === 'OWNER') {
      return next();
    }

    // Verifica se tem QUALQUER UMA das permissões
    const temPermissao = permissoes.some(perm => {
      if (Array.isArray(perm)) {
        return perm.includes(usuario.tipo);
      }
      if (typeof perm === 'string') {
        return usuario[perm] === true;
      }
      return false;
    });

    if (temPermissao) {
      return next();
    }

    return res.status(403).json({ 
      erro: 'Você não tem nenhuma das permissões necessárias.',
      permissoesNecessarias: permissoes
    });
  };
};

/**
 * Factory de middleware: Verifica se o usuário tem TODAS (AND) as permissões.
 * @param  {...string|string[]} permissoes - Permissões
 */
const verificarTodasPermissoes = (...permissoes) => {
  return (req, res, next) => {
    const usuario = req.usuario;

    // OWNER sempre passa
    if (usuario.tipo === 'OWNER') {
      return next();
    }

    // Verifica se tem TODAS as permissões
    const temTodasPermissoes = permissoes.every(perm => {
      if (Array.isArray(perm)) {
        return perm.includes(usuario.tipo);
      }
      if (typeof perm === 'string') {
        return usuario[perm] === true;
      }
      return false;
    });

    if (temTodasPermissoes) {
      return next();
    }

    return res.status(403).json({ 
      erro: 'Você não tem todas as permissões necessárias.',
      permissoesNecessarias: permissoes
    });
  };
};

module.exports = {
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
};