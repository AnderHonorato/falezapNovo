// ========================================
// backend/src/controladores/empresa.controlador.js
// ========================================

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Listar todas as empresas (contas)
 */
const listarEmpresas = async (req, res) => {
  try {
    const usuarioLogado = req.usuario;
    
    // Se não for OWNER, só pode ver a própria conta
    let where = {};
    if (usuarioLogado.tipo !== 'OWNER') {
      where.id = usuarioLogado.contaId;
    }

    const empresas = await prisma.conta.findMany({
      where,
      include: {
        _count: {
          select: {
            usuarios: true,
            conversas: true
          }
        }
      },
      orderBy: { criadoEm: 'desc' }
    });

    const empresasFormatadas = empresas.map(empresa => ({
      id: empresa.id,
      tipo: empresa.tipo,
      documento: empresa.documento,
      razaoSocial: empresa.razaoSocial,
      nomeFantasia: empresa.nomeFantasia,
      nomeCompleto: empresa.nomeCompleto,
      email: empresa.email,
      telefone: empresa.telefone,
      ativo: empresa.ativo,
      criadoEm: empresa.criadoEm,
      totalUsuarios: empresa._count.usuarios,
      totalConversas: empresa._count.conversas
    }));

    res.json({
      sucesso: true,
      empresas: empresasFormatadas,
      total: empresasFormatadas.length
    });

  } catch (erro) {
    console.error('Erro ao listar empresas:', erro);
    res.status(500).json({ 
      sucesso: false, 
      erro: 'Erro ao listar empresas.' 
    });
  }
};

/**
 * Obter uma empresa específica por ID
 */
const obterEmpresaPorId = async (req, res) => {
  try {
    const { id } = req.params;
    const usuarioLogado = req.usuario;

    // Verificar permissão
    if (usuarioLogado.tipo !== 'OWNER' && usuarioLogado.contaId !== id) {
      return res.status(403).json({ 
        sucesso: false, 
        erro: 'Sem permissão para acessar esta empresa.' 
      });
    }

    const empresa = await prisma.conta.findUnique({
      where: { id },
      include: {
        usuarios: {
          select: {
            id: true,
            nome: true,
            email: true,
            tipo: true,
            status: true
          }
        },
        _count: {
          select: {
            conversas: true,
            conexoesWhatsApp: true
          }
        }
      }
    });

    if (!empresa) {
      return res.status(404).json({ 
        sucesso: false, 
        erro: 'Empresa não encontrada.' 
      });
    }

    res.json({
      sucesso: true,
      empresa: {
        ...empresa,
        totalConversas: empresa._count.conversas,
        totalConexoes: empresa._count.conexoesWhatsApp
      }
    });

  } catch (erro) {
    console.error('Erro ao obter empresa:', erro);
    res.status(500).json({ 
      sucesso: false, 
      erro: 'Erro ao obter empresa.' 
    });
  }
};

/**
 * Criar nova empresa
 */
const criarEmpresa = async (req, res) => {
  try {
    const {
      tipo,
      documento,
      razaoSocial,
      nomeFantasia,
      nomeCompleto,
      email,
      telefone
    } = req.body;

    // Validações
    if (!tipo || !documento || !email) {
      return res.status(400).json({ 
        sucesso: false, 
        erro: 'Tipo, documento e email são obrigatórios.' 
      });
    }

    if (tipo === 'EMPRESA' && !razaoSocial) {
      return res.status(400).json({ 
        sucesso: false, 
        erro: 'Razão social é obrigatória para empresas.' 
      });
    }

    if (tipo === 'INDIVIDUAL' && !nomeCompleto) {
      return res.status(400).json({ 
        sucesso: false, 
        erro: 'Nome completo é obrigatório para pessoa física.' 
      });
    }

    // Verificar duplicação
    const empresaExistente = await prisma.conta.findUnique({
      where: { documento }
    });

    if (empresaExistente) {
      return res.status(400).json({ 
        sucesso: false, 
        erro: 'Documento já cadastrado.' 
      });
    }

    const novaEmpresa = await prisma.conta.create({
      data: {
        tipo,
        documento,
        razaoSocial: tipo === 'EMPRESA' ? razaoSocial : null,
        nomeFantasia: tipo === 'EMPRESA' ? nomeFantasia : null,
        nomeCompleto: tipo === 'INDIVIDUAL' ? nomeCompleto : null,
        email,
        telefone,
        ativo: true
      }
    });

    res.status(201).json({
      sucesso: true,
      mensagem: 'Empresa criada com sucesso!',
      empresa: novaEmpresa
    });

  } catch (erro) {
    console.error('Erro ao criar empresa:', erro);
    
    if (erro.code === 'P2002') {
      return res.status(400).json({ 
        sucesso: false, 
        erro: 'Documento já cadastrado.' 
      });
    }

    res.status(500).json({ 
      sucesso: false, 
      erro: 'Erro ao criar empresa.' 
    });
  }
};

/**
 * Atualizar empresa
 */
const atualizarEmpresa = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      razaoSocial,
      nomeFantasia,
      nomeCompleto,
      email,
      telefone,
      ativo
    } = req.body;

    const usuarioLogado = req.usuario;

    // Verificar permissão
    if (usuarioLogado.tipo !== 'OWNER' && usuarioLogado.contaId !== id) {
      return res.status(403).json({ 
        sucesso: false, 
        erro: 'Sem permissão.' 
      });
    }

    const empresa = await prisma.conta.findUnique({
      where: { id }
    });

    if (!empresa) {
      return res.status(404).json({ 
        sucesso: false, 
        erro: 'Empresa não encontrada.' 
      });
    }

    const dadosAtualizacao = {};

    if (razaoSocial !== undefined) dadosAtualizacao.razaoSocial = razaoSocial;
    if (nomeFantasia !== undefined) dadosAtualizacao.nomeFantasia = nomeFantasia;
    if (nomeCompleto !== undefined) dadosAtualizacao.nomeCompleto = nomeCompleto;
    if (email !== undefined) dadosAtualizacao.email = email;
    if (telefone !== undefined) dadosAtualizacao.telefone = telefone;
    if (ativo !== undefined && usuarioLogado.tipo === 'OWNER') {
      dadosAtualizacao.ativo = ativo;
    }

    const empresaAtualizada = await prisma.conta.update({
      where: { id },
      data: dadosAtualizacao
    });

    res.json({
      sucesso: true,
      mensagem: 'Empresa atualizada com sucesso!',
      empresa: empresaAtualizada
    });

  } catch (erro) {
    console.error('Erro ao atualizar empresa:', erro);
    res.status(500).json({ 
      sucesso: false, 
      erro: 'Erro ao atualizar empresa.' 
    });
  }
};

/**
 * Deletar empresa
 */
const deletarEmpresa = async (req, res) => {
  try {
    const { id } = req.params;
    const usuarioLogado = req.usuario;

    // Apenas OWNER pode deletar
    if (usuarioLogado.tipo !== 'OWNER') {
      return res.status(403).json({ 
        sucesso: false, 
        erro: 'Apenas OWNER pode deletar empresas.' 
      });
    }

    const empresa = await prisma.conta.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            usuarios: true,
            conversas: true
          }
        }
      }
    });

    if (!empresa) {
      return res.status(404).json({ 
        sucesso: false, 
        erro: 'Empresa não encontrada.' 
      });
    }

    // Verificar se há usuários ou conversas
    if (empresa._count.usuarios > 0) {
      return res.status(400).json({ 
        sucesso: false, 
        erro: `Existem ${empresa._count.usuarios} usuário(s) vinculados. Delete os usuários primeiro.` 
      });
    }

    if (empresa._count.conversas > 0) {
      return res.status(400).json({ 
        sucesso: false, 
        erro: `Existem ${empresa._count.conversas} conversa(s) vinculadas. Delete as conversas primeiro.` 
      });
    }

    await prisma.conta.delete({
      where: { id }
    });

    res.status(204).send();

  } catch (erro) {
    console.error('Erro ao deletar empresa:', erro);

    if (erro.code === 'P2003') {
      return res.status(409).json({ 
        sucesso: false, 
        erro: 'Empresa possui registros vinculados.' 
      });
    }

    res.status(500).json({ 
      sucesso: false, 
      erro: 'Erro ao deletar empresa.' 
    });
  }
};

module.exports = {
  listarEmpresas,
  obterEmpresaPorId,
  criarEmpresa,
  atualizarEmpresa,
  deletarEmpresa
};

// ========================================
// backend/src/rotas/empresa.rotas.js (CORRETO)
// ========================================

const express = require('express');
const router = express.Router();
const {
  listarEmpresas,
  criarEmpresa,
  atualizarEmpresa,
  deletarEmpresa,
  obterEmpresaPorId
} = require('../controladores/empresa.controlador');

const { verificarToken } = require('../middleware/autenticacao.middleware');
const { verificarAdmin } = require('../permissoes');

// Todas as rotas protegidas e restritas a administradores
router.use(verificarToken, verificarAdmin);

// Rotas CRUD
router.get('/', listarEmpresas);              // GET /api/empresas
router.get('/:id', obterEmpresaPorId);        // GET /api/empresas/:id
router.post('/', criarEmpresa);               // POST /api/empresas
router.put('/:id', atualizarEmpresa);         // PUT /api/empresas/:id
router.delete('/:id', deletarEmpresa);        // DELETE /api/empresas/:id

module.exports = router;