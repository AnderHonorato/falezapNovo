// backend/src/rotas/grupoChatInterno.rotas.js - VERSÃO COMPLETAMENTE CORRIGIDA

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { verificarToken } = require('../middleware/autenticacao.middleware');
const GrupoChatInternoController = require('../controladores/GrupoChatInternoController');

const autenticar = verificarToken;

// Configuração do Multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/grupos/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'grupo-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb(new Error('Apenas imagens são permitidas (jpeg, jpg, png, gif, webp)'));
    }
};

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: fileFilter
});

// ===== ROTAS DE GRUPOS =====
router.get('/grupos', autenticar, GrupoChatInternoController.listarGrupos.bind(GrupoChatInternoController));
router.get('/grupos/:id', autenticar, GrupoChatInternoController.buscarGrupo.bind(GrupoChatInternoController));
router.post('/grupos', autenticar, upload.single('imagem'), GrupoChatInternoController.criarGrupo.bind(GrupoChatInternoController));
router.patch('/grupos/:id', autenticar, upload.single('imagem'), GrupoChatInternoController.atualizarGrupo.bind(GrupoChatInternoController));
router.delete('/grupos/:id', autenticar, GrupoChatInternoController.excluirGrupo.bind(GrupoChatInternoController));

// Rotas de Membros
router.post('/grupos/:id/membros', autenticar, GrupoChatInternoController.adicionarMembro.bind(GrupoChatInternoController));
router.delete('/grupos/:id/membros/:usuarioId', autenticar, GrupoChatInternoController.removerMembro.bind(GrupoChatInternoController));
router.post('/grupos/:id/sair', autenticar, GrupoChatInternoController.sairGrupo.bind(GrupoChatInternoController));

// ===== ✅ NOVA ROTA: MENSAGENS NÃO LIDAS DE GRUPO =====
router.get('/mensagens/grupo/:grupoId/nao-lidas', autenticar, async (req, res) => {
  try {
    const { grupoId } = req.params;
    
    // Verificar se o usuário é membro do grupo
    const membro = await prisma.membroGrupoChatInterno.findFirst({
      where: {
        grupoId: grupoId,
        usuarioId: req.usuario.id
      }
    });
    
    if (!membro) {
      return res.status(403).json({ erro: 'Você não é membro deste grupo.', count: 0 });
    }
    
    // Contar mensagens não lidas
    const count = await prisma.mensagemChatInterno.count({
      where: {
        grupoId: grupoId,
        remetenteId: { not: req.usuario.id },
        excluida: false,
        visualizacoes: {
          none: {
            usuarioId: req.usuario.id
          }
        }
      }
    });
    
    res.json({ count });
  } catch (error) {
    console.error('[GRUPOS] Erro ao contar mensagens não lidas:', error);
    res.status(500).json({ erro: 'Erro ao contar mensagens não lidas.', count: 0 });
  }
});

// ===== ✅ ROTA: MENSAGENS DE GRUPO =====
router.get('/mensagens/grupo/:grupoId', autenticar, async (req, res) => {
  try {
    const { grupoId } = req.params;
    const { limite = 100 } = req.query;
    
    console.log(`[GRUPOS] Buscando mensagens do grupo: ${grupoId}`);
    
    // Verifica se o usuário é membro do grupo
    const membro = await prisma.membroGrupoChatInterno.findFirst({
      where: {
        grupoId: grupoId,
        usuarioId: req.usuario.id
      }
    });
    
    if (!membro) {
      return res.status(403).json({ erro: 'Você não é membro deste grupo.' });
    }
    
    // Busca mensagens do grupo
    const mensagens = await prisma.mensagemChatInterno.findMany({
      where: {
        grupoId: grupoId,
        excluida: false
      },
      take: parseInt(limite),
      orderBy: { criadaEm: 'asc' },
      include: {
        remetente: {
          select: {
            id: true,
            nome: true,
            foto_perfil: true,
            avatar: true,
            tipo: true,
            nickname: true
          }
        },
        respostaA: {
          include: {
            remetente: {
              select: {
                id: true,
                nome: true
              }
            }
          }
        },
        curtidas: {
          include: {
            usuario: {
              select: {
                id: true,
                nome: true,
                foto_perfil: true,
                avatar: true
              }
            }
          }
        },
        mencoes: {
          include: {
            usuario: {
              select: {
                id: true,
                nome: true
              }
            }
          }
        },
        arquivos: true,
        visualizacoes: {
          include: {
            usuario: {
              select: {
                id: true,
                nome: true
              }
            }
          }
        }
      }
    });
    
    // Marcar mensagens como visualizadas
    await prisma.visualizacaoMensagemChatInterno.createMany({
      data: mensagens
        .filter(m => m.remetenteId !== req.usuario.id)
        .map(m => ({
          mensagemId: m.id,
          usuarioId: req.usuario.id
        })),
      skipDuplicates: true
    });
    
    console.log(`[GRUPOS] ✅ ${mensagens.length} mensagens retornadas`);
    
    res.json({ mensagens });
  } catch (error) {
    console.error('[GRUPOS] Erro ao buscar mensagens do grupo:', error);
    res.status(500).json({ erro: 'Erro ao carregar mensagens do grupo.' });
  }
});

module.exports = router;