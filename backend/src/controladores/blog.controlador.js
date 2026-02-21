const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const fs = require('fs');
const path = require('path');
const { subDays } = require('date-fns');

const gerarSlug = (titulo) => {
  return titulo.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''); 
};

// ================= GESTÃO DE CONFIGURAÇÕES (GLOBAL) =================
const CONFIG_FILE = path.join(__dirname, 'blog-settings.json');

const lerConfiguracoes = () => {
    try {
        if (fs.existsSync(CONFIG_FILE)) {
            const data = fs.readFileSync(CONFIG_FILE, 'utf8');
            return JSON.parse(data);
        }
    } catch (error) {
        console.error("Erro ao ler config:", error);
    }
    return {
        linksUteis: [
            { id: 1, title: 'Intranet', sub: 'Acesso Interno', url: 'https://google.com', color: 'blue' }
        ],
        dica: { titulo: 'Dica do RH', texto: 'Mantenha seus dados sempre atualizados.' }
    };
};

// ✅ DEFINIÇÃO PADRÃO DE CAMPOS DO AUTOR (Para reutilizar e não esquecer nada)
const selectAutorCompleto = {
    id: true, 
    nome: true, 
    avatar: true, 
    tipo: true, 
    podeModerarBlog: true,
    email: true,      // Importante
    telefone: true,   // Importante
    recado: true,     // Importante
    privacidade: true,// Importante
    criadoEm: true,
    contaId: true
};

exports.obterConfiguracoesBlog = async (req, res) => {
    const config = lerConfiguracoes();
    res.json(config);
};

exports.salvarConfiguracoesBlog = async (req, res) => {
    try {
        const { linksUteis, dica } = req.body;
        const configAtual = lerConfiguracoes();
        
        const novaConfig = {
            linksUteis: linksUteis || configAtual.linksUteis,
            dica: dica || configAtual.dica
        };

        fs.writeFileSync(CONFIG_FILE, JSON.stringify(novaConfig, null, 2));
        res.json({ mensagem: "Configurações atualizadas com sucesso!", config: novaConfig });
    } catch (error) {
        res.status(500).json({ erro: 'Erro ao salvar configurações.' });
    }
};

// ================= LEITURA DE POSTS =================

exports.listarPostsRecentes = async (req, res) => {
  try {
    const posts = await prisma.blogPost.findMany({
      where: { arquivado: false },
      take: 3,
      orderBy: { criadoEm: 'desc' },
      select: {
        id: true, titulo: true, resumo: true, slug: true,
        criadoEm: true, imagemCapa: true, categoria: true, visualizacoes: true
      }
    });
    res.json({ posts });
  } catch (error) { res.status(500).json({ erro: 'Erro ao buscar posts.' }); }
};

exports.listarPosts = async (req, res) => {
  try {
    const { busca, categoria, tag, apenasSalvos } = req.query;
    const { tipo, id: usuarioId } = req.usuario || {}; 

    const where = {};
    if (tipo !== 'OWNER' && tipo !== 'CEO') where.arquivado = false;

    if (busca) {
      where.OR = [
        { titulo: { contains: busca, mode: 'insensitive' } },
        { resumo: { contains: busca, mode: 'insensitive' } }
      ];
    }
    if (categoria) where.categoria = categoria;
    
    if (tag) {
        where.tags = { array_contains: tag }; 
    }

    if (apenasSalvos === 'true' && usuarioId) {
        where.salvos = { some: { usuarioId } };
    }

    const posts = await prisma.blogPost.findMany({
      where,
      orderBy: { criadoEm: 'desc' },
      include: {
        autor: { select: { nome: true, avatar: true } },
        _count: { select: { comentarios: true, likes: true } },
        salvos: usuarioId ? { where: { usuarioId }, select: { id: true } } : false,
        comentarios: {
            where: { deletado: false },
            take: 1,
            orderBy: [
                { likes: { _count: 'desc' } }, 
                { criadoEm: 'desc' }
            ],
            select: {
                texto: true,
                autor: { select: { nome: true, avatar: true } }
            }
        }
      }
    });

    const formatados = posts.map(p => ({
        ...p,
        likes: p._count.likes,
        numComentarios: p._count.comentarios,
        topComentario: p.comentarios[0] || null,
        salvoPorMim: p.salvos && p.salvos.length > 0
    }));

    res.json({ posts: formatados });
  } catch (error) { res.status(500).json({ erro: 'Erro ao listar posts' }); }
};

exports.obterPostPorSlug = async (req, res) => {
  const { slug } = req.params; 
  const usuarioId = req.usuario ? req.usuario.id : null;

  try {
    let whereClause = { slug };
    let post = await prisma.blogPost.findUnique({
      where: whereClause,
      include: {
        autor: { select: selectAutorCompleto }, // ✅ Usa o select completo
        _count: { select: { likes: true, comentarios: true } }, 
        likes: usuarioId ? { where: { usuarioId }, select: { id: true } } : false,
        salvos: usuarioId ? { where: { usuarioId }, select: { id: true } } : false 
      }
    });

    if (!post) {
        post = await prisma.blogPost.findUnique({
            where: { id: slug },
            include: {
                autor: { select: selectAutorCompleto },
                _count: { select: { likes: true, comentarios: true } },
                likes: usuarioId ? { where: { usuarioId }, select: { id: true } } : false,
                salvos: usuarioId ? { where: { usuarioId }, select: { id: true } } : false
            }
        });
    }

    if (!post) return res.status(404).json({ erro: 'Post não encontrado' });

    const isStaff = req.usuario && (req.usuario.tipo === 'OWNER' || req.usuario.tipo === 'CEO');
    if (post.arquivado && !isStaff) return res.status(404).json({ erro: 'Post indisponível' });

    const postFormatado = {
      ...post,
      likes: post._count.likes,
      numComentarios: post._count.comentarios,
      curtidoPeloUsuario: post.likes && post.likes.length > 0,
      salvoPorMim: post.salvos && post.salvos.length > 0,
      atualizadoEm: post.atualizadoEm 
    };

    res.json({ post: postFormatado });
  } catch (error) { res.status(500).json({ erro: 'Erro ao buscar post' }); }
};

exports.listarRecomendados = async (req, res) => {
  try {
    const dataCorte = subDays(new Date(), 60); 
    const { ignorarId } = req.query; 

    const posts = await prisma.blogPost.findMany({
      where: {
        arquivado: false, 
        id: ignorarId ? { not: ignorarId } : undefined,
        OR: [
          { destaque: true }, 
          { criadoEm: { gte: dataCorte } } 
        ]
      },
      select: { 
          id: true, slug: true, titulo: true, imagemCapa: true, 
          resumo: true, criadoEm: true, categoria: true,
          autor: { select: { nome: true, avatar: true } }
      },
      orderBy: [
        { destaque: 'desc' }, 
        { visualizacoes: 'desc' }, 
        { criadoEm: 'desc' } 
      ],
      take: 3
    });

    res.json({ posts });
  } catch (error) { res.status(500).json({ erro: 'Erro ao buscar recomendados.' }); }
};

exports.listarTags = async (req, res) => {
    try {
        const posts = await prisma.blogPost.findMany({
            where: { arquivado: false },
            select: { tags: true }
        });
        
        const todasTags = new Set();
        posts.forEach(p => {
            if (Array.isArray(p.tags)) {
                p.tags.forEach(t => todasTags.add(t));
            } else if (typeof p.tags === 'string') {
                try { JSON.parse(p.tags).forEach(t => todasTags.add(t)); } catch(e){}
            }
        });

        res.json({ tags: Array.from(todasTags).sort() });
    } catch (e) { res.status(500).json({ erro: 'Erro ao listar tags' }); }
};

// ================= INTERAÇÕES =================

exports.incrementarVisualizacao = async (req, res) => {
    const { id } = req.params;
    try {
        await prisma.blogPost.update({
            where: { id },
            data: { visualizacoes: { increment: 1 } }
        });
        res.status(200).send();
    } catch (e) { res.status(500).json({ erro: 'Erro ao incrementar view' }); }
};

exports.toggleSalvarPost = async (req, res) => { 
    const { id } = req.params;
    const usuarioId = req.usuario.id;
    try {
        const salvo = await prisma.postSalvo.findUnique({
            where: { usuarioId_postId: { usuarioId, postId: id } }
        });

        if (salvo) {
            await prisma.postSalvo.delete({ where: { id: salvo.id } });
            return res.json({ salvo: false });
        } else {
            await prisma.postSalvo.create({ data: { usuarioId, postId: id } });
            return res.json({ salvo: true });
        }
    } catch (e) { res.status(500).json({ erro: 'Erro ao salvar post.' }); }
};

// ================= GESTÃO & EDIÇÃO =================

exports.editarPost = async (req, res) => {
  try {
    const { id } = req.params;
    const { titulo, conteudo, resumo, categoria, autorFrase, destaque, tags } = req.body;
    const editorId = req.usuario.id;

    const postAtual = await prisma.blogPost.findUnique({ where: { id } });
    if (!postAtual) return res.status(404).json({ erro: 'Post não encontrado' });

    await prisma.historicoPost.create({
        data: {
            postId: id,
            editorId,
            titulo: postAtual.titulo,
            conteudo: postAtual.conteudo,
            resumo: postAtual.resumo,
            tags: postAtual.tags
        }
    });

    const dados = { 
        titulo, conteudo, resumo, categoria, autorFrase, 
        destaque: destaque === 'true' || destaque === true,
        tags: tags ? JSON.parse(tags) : undefined 
    };
    if (req.file) dados.imagemCapa = `/uploads/temp/${req.file.filename}`;

    const post = await prisma.blogPost.update({ where: { id }, data: dados });
    res.json(post);
  } catch (error) { res.status(500).json({ erro: 'Erro ao editar post' }); }
};

exports.editarComentario = async (req, res) => {
    const { id } = req.params;
    const { texto } = req.body;
    const usuarioId = req.usuario.id;
    try {
      const comentario = await prisma.comentarioBlog.findUnique({ where: { id } });
      if (!comentario) return res.status(404).json({ erro: 'Não encontrado' });
      if (comentario.deletado) return res.status(400).json({ erro: 'Comentário apagado.' });
      if (comentario.autorId !== usuarioId) return res.status(403).json({ erro: 'Sem permissão.' });
  
      await prisma.historicoComentario.create({
          data: {
              comentarioId: id,
              editorId: usuarioId,
              texto: comentario.texto
          }
      });

      const atualizado = await prisma.comentarioBlog.update({ where: { id }, data: { texto: texto.trim() } });
      res.json({ comentario: atualizado });
    } catch (error) { res.status(500).json({ erro: 'Erro ao editar' }); }
};

exports.criarPost = async (req, res) => {
  try {
    const { titulo, conteudo, resumo, categoria, autorFrase, destaque, tags } = req.body;
    const autorId = req.usuario.id;
    let imagemCapa = null;
    if (req.file) imagemCapa = `/uploads/temp/${req.file.filename}`;

    const post = await prisma.blogPost.create({
      data: {
        titulo,
        slug: gerarSlug(titulo) + '-' + Date.now(),
        conteudo,
        resumo,
        categoria,
        imagemCapa,
        autorId,
        autorFrase,
        destaque: destaque === 'true' || destaque === true,
        tags: tags ? JSON.parse(tags) : undefined
      }
    });
    res.status(201).json(post);
  } catch (error) { res.status(500).json({ erro: 'Erro ao criar post' }); }
};

exports.excluirPost = async (req, res) => { 
    try {
        const { id } = req.params;
        const post = await prisma.blogPost.findUnique({ where: { id }});
        if (post && post.imagemCapa) {
            const caminho = path.join(__dirname, '../../', post.imagemCapa);
            if (fs.existsSync(caminho)) fs.unlinkSync(caminho);
        }
        await prisma.blogPost.delete({ where: { id } });
        res.json({ mensagem: 'Post excluído' });
    } catch (error) { res.status(500).json({ erro: 'Erro ao excluir post' }); }
};
exports.arquivarPost = async (req, res) => { 
    const { id } = req.params;
    try {
        const post = await prisma.blogPost.findUnique({ where: { id } });
        const atualizado = await prisma.blogPost.update({ where: { id }, data: { arquivado: !post.arquivado } });
        res.json(atualizado);
    } catch (e) { res.status(500).json({ erro: 'Erro ao arquivar.' }); }
};
exports.destacarPost = async (req, res) => { 
    const { id } = req.params;
    try {
        const post = await prisma.blogPost.findUnique({ where: { id } });
        const atualizado = await prisma.blogPost.update({ where: { id }, data: { destaque: !post.destaque } });
        res.json(atualizado);
    } catch (e) { res.status(500).json({ erro: 'Erro ao destacar.' }); }
};
exports.toggleLike = async (req, res) => { 
    const { postId } = req.params;
    const usuarioId = req.usuario.id;
    try {
        const like = await prisma.likeBlog.findUnique({ where: { usuarioId_postId: { usuarioId, postId } } });
        if (like) { await prisma.likeBlog.delete({ where: { id: like.id } }); res.json({ curtido: false }); } 
        else { await prisma.likeBlog.create({ data: { usuarioId, postId } }); res.json({ curtido: true }); }
    } catch (error) { res.status(500).json({ erro: 'Erro no like' }); }
};

// ✅ FUNÇÃO CORRIGIDA: Agora busca o autor completo nos comentários também
exports.listarComentarios = async (req, res) => { 
    const { postId } = req.params;
    const usuarioId = req.usuario ? req.usuario.id : null;
    try {
        const comentarios = await prisma.comentarioBlog.findMany({
            where: { postId }, orderBy: { criadoEm: 'desc' },
            include: { 
                autor: { select: selectAutorCompleto }, // ✅ Usa o select completo para ter email/telefone
                _count: { select: { likes: true } }, 
                likes: usuarioId ? { where: { usuarioId }, select: { id: true } } : false 
            }
        });
        
        const formatados = comentarios.map(c => ({ 
            ...c, 
            likes: c._count.likes, 
            curtidoPorMim: c.likes && c.likes.length > 0, 
            texto: c.deletado ? '' : c.texto, 
            autor: c.deletado ? null : c.autor,
            criadoEm: c.criadoEm, 
            atualizadoEm: c.atualizadoEm 
        }));
        
        res.json({ comentarios: formatados });
    } catch (error) { res.status(500).json({ erro: 'Erro ao buscar comentários' }); }
};

// ✅ FUNÇÃO CORRIGIDA: Retorna autor completo ao criar
exports.criarComentario = async (req, res) => { 
    const { postId } = req.params; const { texto, parentId } = req.body; const usuarioId = req.usuario.id;
    try {
        const comentario = await prisma.comentarioBlog.create({ 
            data: { texto: texto.trim(), autorId: usuarioId, postId, parentId: parentId || null }, 
            include: { 
                autor: { select: selectAutorCompleto } // ✅ Retorna dados completos
            } 
        });
        res.status(201).json({ comentario: { ...comentario, likes: 0, curtidoPorMim: false, filhos: [] } });
    } catch (error) { res.status(500).json({ erro: 'Erro ao criar comentário' }); }
};

exports.excluirComentario = async (req, res) => { 
    const { id } = req.params; const { motivo } = req.body; const usuarioSolicitante = req.usuario; 
    try {
        const comentario = await prisma.comentarioBlog.findUnique({ where: { id }, include: { autor: { select: { id: true, tipo: true } } } });
        if (!comentario) return res.status(404).json({ erro: 'Não encontrado' });
        const ehAutor = comentario.autorId === usuarioSolicitante.id;
        const temPermissaoBasica = ehAutor || ['OWNER', 'CEO'].includes(usuarioSolicitante.tipo) || usuarioSolicitante.podeModerarBlog === true;
        if (!temPermissaoBasica) return res.status(403).json({ erro: 'Sem permissão' });
        if (!ehAutor && (comentario.autor.tipo === 'OWNER' || (comentario.autor.tipo === 'CEO' && usuarioSolicitante.tipo !== 'OWNER'))) return res.status(403).json({ erro: 'Hierarquia insuficiente.' });
        await prisma.comentarioBlog.update({ where: { id }, data: { deletado: true, texto: '', motivoExclusao: motivo || null } });
        res.json({ mensagem: 'Comentário removido', id });
    } catch (error) { res.status(500).json({ erro: 'Erro ao excluir comentário' }); }
};
exports.toggleLikeComentario = async (req, res) => { 
    const { id } = req.params; const usuarioId = req.usuario.id;
    try {
        const comentario = await prisma.comentarioBlog.findUnique({ where: { id } });
        if (!comentario || comentario.deletado) return res.status(404).json({ erro: "Indisponível" });
        const like = await prisma.likeComentario.findUnique({ where: { usuarioId_comentarioId: { usuarioId, comentarioId: id } } });
        if (like) { await prisma.likeComentario.delete({ where: { id: like.id } }); return res.json({ curtido: false }); } 
        else { await prisma.likeComentario.create({ data: { usuarioId, comentarioId: id } }); return res.json({ curtido: true }); }
    } catch (error) { res.status(500).json({ erro: 'Erro no like' }); }
};