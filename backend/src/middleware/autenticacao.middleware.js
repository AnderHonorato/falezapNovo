// backend/src/middleware/autenticacao.middleware.js - APENAS AUTENTICAÇÃO

const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// ✅ Verificar se usuário está autenticado
const verificarToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ 
        erro: 'Token não fornecido. Acesso negado.' 
      });
    }

    const decodificado = jwt.verify(token, process.env.JWT_SECRET);

    const usuario = await prisma.usuario.findUnique({
      where: { id: decodificado.usuarioId },
      include: {
        conta: true,
        setor: true,
        // ✅ Incluir categoria para uso nas permissões
        categoria: true 
      }
    });

    if (!usuario) {
      return res.status(401).json({ 
        erro: 'Usuário não encontrado.' 
      });
    }

    if (usuario.status !== 'ATIVO') {
      return res.status(403).json({ 
        erro: 'Usuário inativo ou pendente de aprovação.' 
      });
    }

    // ✅ Anexa o usuário completo ao request
    req.usuario = usuario;
    next();

  } catch (erro) {
    console.error('Erro ao verificar token:', erro);
    return res.status(401).json({ 
      erro: 'Token inválido ou expirado.' 
    });
  }
};

// ✅ Middleware opcional - não bloqueia se token for inválido
const verificarTokenOpcional = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (token) {
      const decodificado = jwt.verify(token, process.env.JWT_SECRET);
      const usuario = await prisma.usuario.findUnique({
        where: { id: decodificado.usuarioId }
      });
      
      if (usuario && usuario.status === 'ATIVO') {
        req.usuario = usuario;
      }
    }
    
    next();
  } catch (erro) {
    // Ignora erro de token inválido e continua
    next();
  }
};

module.exports = {
  verificarToken,
  verificarTokenOpcional,
  // As outras funções foram movidas para 'backend/src/permissoes/verificadores.js'
};