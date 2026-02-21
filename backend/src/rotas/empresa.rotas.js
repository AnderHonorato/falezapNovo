// ========================================
// backend/src/rotas/empresa.rotas.js
// ========================================

const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// ✅ IMPORTAÇÕES CORRIGIDAS
const { verificarToken } = require('../middleware/autenticacao.middleware');
// MUITO IMPORTANTE: Usar verificarPermissao, pois verificarOwner bloqueia o CEO
const { verificarPermissao } = require('../permissoes'); 

// ===================================================
// FUNÇÃO AUXILIAR: ALTERAR STATUS DA EMPRESA E SEUS USUÁRIOS
// ===================================================
const alterarStatusEmpresaEUsuarios = async (req, res) => {
  const { id } = req.params;
  const { ativo } = req.body;

  console.log(`\n🔄 [EMPRESA] Alterar status:`);
  console.log(`   - empresaId: ${id}`);
  console.log(`   - novoStatus: ${ativo ? 'ATIVO' : 'INATIVO'}`);

  // Validação
  if (typeof ativo !== 'boolean') {
    return res.status(400).json({ 
      erro: 'O campo "ativo" (booleano) é obrigatório.' 
    });
  }

  try {
    const conta = await prisma.conta.findUnique({ 
      where: { id },
      include: {
        _count: {
          select: { usuarios: true }
        }
      }
    });

    if (!conta) {
      return res.status(404).json({ erro: 'Empresa não encontrada.' });
    }

    console.log(`   - Total de usuários: ${conta._count.usuarios}`);

    // Transaction para garantir atomicidade
    await prisma.$transaction(async (tx) => {
      // 1. Atualizar status da empresa
      await tx.conta.update({
        where: { id },
        data: { 
          ativo: ativo,
          status: ativo ? 'ATIVO' : 'INATIVO',
          inativadaEm: ativo ? null : new Date()
        }
      });
      
      // 2. Atualizar status de TODOS os usuários desta empresa
      await tx.usuario.updateMany({
        where: { contaId: id },
        data: { 
          status: ativo ? 'ATIVO' : 'INATIVO',
          inativadoEm: ativo ? null : new Date()
        }
      });
    });

    console.log(`   ✅ Empresa e ${conta._count.usuarios} usuários atualizados`);

    res.json({ 
      sucesso: true, 
      mensagem: `Empresa e todos os usuários foram ${ativo ? 'ativados' : 'inativados'}.`,
      totalUsuariosAfetados: conta._count.usuarios
    });

  } catch (error) {
    console.error(`❌ Erro ao alterar status da conta ${id}:`, error);
    res.status(500).json({ 
      erro: 'Erro interno ao alterar status.',
      detalhes: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ===================================================
// ROTAS CRUD DE EMPRESAS
// ===================================================

/**
 * GET /api/empresas
 * Listar todas as empresas
 * ✅ PERMISSÃO: Quem tiver 'podeGerenciarEmpresas' (CEO ou OWNER)
 */
router.get('/', verificarToken, verificarPermissao('podeGerenciarEmpresas'), async (req, res) => {
  try {
    console.log('\n📋 [EMPRESA] Listar todas');

    const empresas = await prisma.conta.findMany({
      include: { 
        _count: { 
          select: { 
            usuarios: true,
            conversas: true,
            conexoesWhatsApp: true
          } 
        } 
      },
      orderBy: { criadoEm: 'desc' }
    });

    const empresasFormatadas = empresas.map(emp => ({
      id: emp.id,
      tipo: emp.tipo,
      documento: emp.documento,
      razaoSocial: emp.razaoSocial,
      nomeFantasia: emp.nomeFantasia,
      nomeCompleto: emp.nomeCompleto,
      email: emp.email,
      telefone: emp.telefone,
      ativo: emp.ativo,
      status: emp.status,
      limiteWhatsApps: emp.limiteWhatsApps,
      criadoEm: emp.criadoEm,
      inativadaEm: emp.inativadaEm,
      // Contadores
      totalUsuarios: emp._count.usuarios,
      totalConversas: emp._count.conversas,
      totalConexoes: emp._count.conexoesWhatsApp
    }));

    console.log(`   ✅ ${empresasFormatadas.length} empresas encontradas`);

    res.json({
      sucesso: true,
      empresas: empresasFormatadas,
      total: empresasFormatadas.length
    });

  } catch (error) {
    console.error('❌ Erro ao listar empresas:', error);
    res.status(500).json({ 
      erro: 'Erro ao listar empresas',
      detalhes: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * GET /api/empresas/:id
 * Buscar uma empresa específica
 * ✅ PERMISSÃO: Quem tiver 'podeGerenciarEmpresas'
 */
router.get('/:id', verificarToken, verificarPermissao('podeGerenciarEmpresas'), async (req, res) => {
  try {
    const { id } = req.params;

    console.log(`\n🔍 [EMPRESA] Buscar: ${id}`);

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
      return res.status(404).json({ erro: 'Empresa não encontrada' });
    }

    console.log(`   ✅ Empresa encontrada: ${empresa.razaoSocial || empresa.nomeCompleto}`);

    res.json({
      sucesso: true,
      empresa: {
        ...empresa,
        totalConversas: empresa._count.conversas,
        totalConexoes: empresa._count.conexoesWhatsApp
      }
    });

  } catch (error) {
    console.error('❌ Erro ao buscar empresa:', error);
    res.status(500).json({ 
      erro: 'Erro ao buscar empresa',
      detalhes: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * POST /api/empresas
 * Criar nova empresa
 * ✅ PERMISSÃO: Quem tiver 'podeGerenciarEmpresas'
 */
router.post('/', verificarToken, verificarPermissao('podeGerenciarEmpresas'), async (req, res) => {
  try {
    const { 
      razaoSocial, 
      nomeFantasia, 
      nomeCompleto, 
      documento, 
      email, 
      telefone, 
      tipo 
    } = req.body;

    console.log('\n➕ [EMPRESA] Criar nova');
    console.log(`   - tipo: ${tipo}`);

    // Validações
    if (!documento || !email) {
      return res.status(400).json({ 
        erro: 'Documento e Email são obrigatórios' 
      });
    }

    if (tipo === 'EMPRESA' && !razaoSocial) {
      return res.status(400).json({ 
        erro: 'Razão Social é obrigatória para empresas' 
      });
    }

    if (tipo === 'INDIVIDUAL' && !nomeCompleto) {
      return res.status(400).json({ 
        erro: 'Nome Completo é obrigatório para pessoa física' 
      });
    }

    // Verificar duplicação
    const existente = await prisma.conta.findUnique({
      where: { documento }
    });

    if (existente) {
      return res.status(409).json({ 
        erro: 'Documento já cadastrado' 
      });
    }

    const novaEmpresa = await prisma.conta.create({
      data: {
        tipo: tipo,
        documento: documento,
        razaoSocial: razaoSocial || null,
        nomeFantasia: nomeFantasia || null,
        nomeCompleto: nomeCompleto || null,
        email: email,
        telefone: telefone || null,
        ativo: true,
        status: 'ATIVO',
        limiteWhatsApps: 1
      }
    });

    console.log(`   ✅ Empresa criada: ${novaEmpresa.id}`);

    res.status(201).json({
      sucesso: true,
      mensagem: 'Empresa criada com sucesso!',
      empresa: novaEmpresa
    });

  } catch (error) {
    console.error('❌ Erro ao criar empresa:', error);

    if (error.code === 'P2002') {
      return res.status(409).json({ 
        erro: 'Documento ou Email já cadastrado' 
      });
    }

    res.status(500).json({ 
      erro: 'Erro interno ao criar empresa',
      detalhes: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * PUT /api/empresas/:id
 * Atualizar dados da empresa
 * ✅ PERMISSÃO: Quem tiver 'podeGerenciarEmpresas'
 */
router.put('/:id', verificarToken, verificarPermissao('podeGerenciarEmpresas'), async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      razaoSocial, 
      nomeFantasia, 
      nomeCompleto, 
      documento, 
      email, 
      telefone, 
      tipo,
      limiteWhatsApps
    } = req.body;

    console.log(`\n✏️ [EMPRESA] Atualizar: ${id}`);

    // Verificar se existe
    const empresa = await prisma.conta.findUnique({ where: { id } });

    if (!empresa) {
      return res.status(404).json({ erro: 'Empresa não encontrada' });
    }

    // Validações
    if (!documento || !email) {
      return res.status(400).json({ 
        erro: 'Documento e Email são obrigatórios' 
      });
    }

    if (tipo === 'EMPRESA' && !razaoSocial) {
      return res.status(400).json({ 
        erro: 'Razão Social é obrigatória' 
      });
    }

    if (tipo === 'INDIVIDUAL' && !nomeCompleto) {
      return res.status(400).json({ 
        erro: 'Nome Completo é obrigatório' 
      });
    }

    const empresaAtualizada = await prisma.conta.update({
      where: { id },
      data: {
        tipo: tipo,
        documento: documento,
        razaoSocial: razaoSocial || null,
        nomeFantasia: nomeFantasia || null,
        nomeCompleto: nomeCompleto || null,
        email: email,
        telefone: telefone || null,
        limiteWhatsApps: limiteWhatsApps || empresa.limiteWhatsApps
      }
    });

    console.log(`   ✅ Empresa atualizada`);

    res.json({
      sucesso: true,
      mensagem: 'Empresa atualizada com sucesso!',
      empresa: empresaAtualizada
    });

  } catch (error) {
    console.error('❌ Erro ao atualizar empresa:', error);

    if (error.code === 'P2002') {
      return res.status(409).json({ 
        erro: 'Documento ou Email já cadastrado' 
      });
    }

    if (error.code === 'P2025') {
      return res.status(404).json({ 
        erro: 'Empresa não encontrada' 
      });
    }

    res.status(500).json({ 
      erro: 'Erro interno ao atualizar empresa',
      detalhes: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * PUT /api/empresas/:id/status
 * Ativar/Inativar empresa e seus usuários
 * ✅ PERMISSÃO: Quem tiver 'podeGerenciarEmpresas'
 */
router.put('/:id/status', verificarToken, verificarPermissao('podeGerenciarEmpresas'), alterarStatusEmpresaEUsuarios);

/**
 * DELETE /api/empresas/:id
 * Deletar empresa
 * ✅ PERMISSÃO: Quem tiver 'podeGerenciarEmpresas'
 */
router.delete('/:id', verificarToken, verificarPermissao('podeGerenciarEmpresas'), async (req, res) => {
  try {
    const { id } = req.params;

    console.log(`\n🗑️ [EMPRESA] Deletar: ${id}`);

    // Verificar se existe
    const empresa = await prisma.conta.findUnique({ 
      where: { id },
      include: {
        _count: {
          select: {
            usuarios: true,
            conversas: true,
            conexoesWhatsApp: true
          }
        }
      }
    });

    if (!empresa) {
      return res.status(404).json({ erro: 'Empresa não encontrada' });
    }

    // Verificar vínculos
    if (empresa._count.usuarios > 0) {
      return res.status(409).json({ 
        erro: `Não é possível deletar. Existem ${empresa._count.usuarios} usuário(s) vinculados.` 
      });
    }

    if (empresa._count.conversas > 0) {
      return res.status(409).json({ 
        erro: `Não é possível deletar. Existem ${empresa._count.conversas} conversa(s) vinculadas.` 
      });
    }

    if (empresa._count.conexoesWhatsApp > 0) {
      return res.status(409).json({ 
        erro: `Não é possível deletar. Existem ${empresa._count.conexoesWhatsApp} conexão(ões) vinculada(s).` 
      });
    }

    await prisma.conta.delete({ where: { id } });

    console.log(`   ✅ Empresa deletada`);

    res.status(204).send();

  } catch (error) {
    console.error('❌ Erro ao deletar empresa:', error);

    if (error.code === 'P2025') {
      return res.status(404).json({ erro: 'Empresa não encontrada' });
    }

    if (error.code === 'P2003') {
      return res.status(409).json({ 
        erro: 'Não é possível excluir. Existem registros vinculados.' 
      });
    }

    res.status(500).json({ 
      erro: 'Erro interno ao deletar empresa',
      detalhes: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;