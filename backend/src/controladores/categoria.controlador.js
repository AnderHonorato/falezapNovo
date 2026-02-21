// backend/src/controladores/categoria.controlador.js - COMPLETO E CORRIGIDO

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// ✅ LISTAR CATEGORIAS (GET /categorias)
const listarCategorias = async (req, res) => {
  let whereClause = {};
  // Filtra por conta se o usuário logado não for OWNER
  if (req.usuario.tipo !== 'OWNER') {
    whereClause.contaId = req.usuario.contaId;
  }
  // Se for OWNER, whereClause fica vazio e lista todas (ou ajuste se precisar de outro comportamento)

  try {
    const categorias = await prisma.categoria.findMany({
      where: whereClause,
      orderBy: { nome: 'asc' }
    });

    // Conta membros de cada categoria
    const categoriasComContagem = await Promise.all(
      categorias.map(async (categoria) => {
        const membros = await prisma.usuario.count({
          where: { categoriaId: categoria.id } // Conta todos na categoria
        });
        return {
          id: categoria.id,
          nome: categoria.nome,
          membros: membros,
          contaId: categoria.contaId // Retorna contaId
        };
      })
    );
    res.status(200).json(categoriasComContagem);
  } catch (erro) {
    console.error('Erro ao listar categorias:', erro);
    res.status(500).json({ erro: 'Erro ao listar categorias.' });
  }
};

// ✅ CRIAR CATEGORIA (POST /categorias)
const criarCategoria = async (req, res) => {
  const { nome } = req.body;
  const contaIdLogada = req.usuario.contaId;

  if (!contaIdLogada) return res.status(400).json({ erro: 'Conta não identificada.' });
  if (!nome || nome.trim() === '') return res.status(400).json({ erro: 'Nome obrigatório.' });

  try {
    const nomeNormalizado = nome.trim();
    const existente = await prisma.categoria.findFirst({
        where: { nome: { equals: nomeNormalizado, mode: 'insensitive' }, contaId: contaIdLogada }
    });
    if (existente) return res.status(409).json({ erro: 'Nome já existe nesta empresa.' });

    const novaCategoria = await prisma.categoria.create({ data: { nome: nomeNormalizado, contaId: contaIdLogada } });
    res.status(201).json(novaCategoria);
  } catch (erro) {
    if (erro.code === 'P2002') return res.status(409).json({ erro: 'Nome já existe nesta empresa.' });
    console.error('Erro ao criar categoria:', erro);
    res.status(500).json({ erro: 'Erro ao criar categoria.' });
  }
};

// ✅ ATUALIZAR CATEGORIA (PUT /categorias/:id)
const atualizarCategoria = async (req, res) => {
  const { id } = req.params;
  const { nome } = req.body;
  const contaIdLogada = req.usuario.contaId;

  if (!nome || nome.trim() === '') return res.status(400).json({ erro: 'Nome obrigatório.' });

  try {
    const categoriaExistente = await prisma.categoria.findFirst({ where: { id, contaId: contaIdLogada } });
    if (!categoriaExistente) return res.status(404).json({ erro: 'Categoria não encontrada ou não pertence à sua conta.' });

    const nomeNormalizado = nome.trim();
    const nomeDuplicado = await prisma.categoria.findFirst({ where: { nome: { equals: nomeNormalizado, mode: 'insensitive' }, contaId: contaIdLogada, id: { not: id } } });
    if (nomeDuplicado) return res.status(409).json({ erro: 'Já existe outra categoria com este nome.' });

    const categoriaAtualizada = await prisma.categoria.update({ where: { id }, data: { nome: nomeNormalizado } });
    res.status(200).json(categoriaAtualizada);
  } catch (erro) {
    if (erro.code === 'P2002') return res.status(409).json({ erro: 'Já existe outra categoria com este nome.' });
    console.error('Erro ao atualizar categoria:', erro);
    res.status(500).json({ erro: 'Erro ao atualizar categoria.' });
  }
};

// ✅ DELETAR CATEGORIA (DELETE /categorias/:id)
const deletarCategoria = async (req, res) => {
  const { id } = req.params;
  const contaIdLogada = req.usuario.contaId;

  try {
    const categoria = await prisma.categoria.findFirst({
      where: { id, contaId: contaIdLogada }, include: { _count: { select: { usuarios: true } } }
    });
    if (!categoria) return res.status(404).json({ erro: 'Categoria não encontrada ou não pertence à sua conta.' });
    if (categoria._count.usuarios > 0) return res.status(409).json({ erro: `Existem ${categoria._count.usuarios} membro(s) vinculados.` });

    await prisma.categoria.delete({ where: { id } });
    res.status(204).send();
  } catch (erro) {
    console.error('Erro ao deletar categoria:', erro);
    if (error.code === 'P2014' || error.code === 'P2003') return res.status(409).json({ erro: 'Categoria em uso.' });
    res.status(500).json({ erro: 'Erro ao deletar categoria.' });
  }
};

module.exports = { listarCategorias, criarCategoria, atualizarCategoria, deletarCategoria };