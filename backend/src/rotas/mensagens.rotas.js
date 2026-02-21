// backend/src/rotas/mensagens.rotas.js - ✅ VERSÃO CORRIGIDA (AGORA COM OS MIDDLEWARES CERTOS)

const express = require('express');
const router = express.Router();
const mensagensControlador = require('../controladores/mensagens.controlador.js'); 
const { verificarToken } = require('../middleware/autenticacao.middleware');
const { PrismaClient } = require('@prisma/client');

// ✅ PASSO 1: Importar os DOIS middlewares
const uploadContato = require('../middleware/uploadcontato.middleware'); // Para .vcf
const uploadMidia = require('../middleware/uploadMidia.middleware');     // Para imagens, vídeos, etc.

const prisma = new PrismaClient();

console.log('✅ Carregando rotas de mensagens...');

// ✅ MIDDLEWARE DE AUTENTICAÇÃO GLOBAL
router.use(verificarToken);

// ============================================================
// TEXTO E MENSAGENS BÁSICAS
// ============================================================

router.post('/enviar', mensagensControlador.enviarMensagem);
router.post('/enviar-alternativa', mensagensControlador.enviarMensagemAlternativa);
router.post('/enviar-template', mensagensControlador.enviarMensagemTemplate);
router.get('/conversa/:conversaId', mensagensControlador.obterMensagensConversa);
router.put('/conversa/:conversaId/marcar-lida', mensagensControlador.marcarComoLida);
router.get('/pesquisar', mensagensControlador.pesquisarMensagens);
router.get('/status/:mensagemId', mensagensControlador.obterStatusLeitura);

// ============================================================
// REAÇÕES
// ============================================================

router.post('/reacao', mensagensControlador.enviarReacao);
router.delete('/reacao/:mensagemId', mensagensControlador.removerReacao);

// ============================================================
// AÇÕES EM MENSAGENS
// ============================================================

router.delete('/:mensagemId', mensagensControlador.deletarMensagem);
router.put('/:mensagemId/editar', mensagensControlador.editarMensagem);
router.put('/:mensagemId/fixar', mensagensControlador.fixarMensagem);
router.patch('/:mensagemId/favoritar', mensagensControlador.favoritarMensagem);

// ============================================================
// ENVIO DE MÍDIAS (✅ CORRIGIDO - usando uploadMidia)
// ============================================================

router.post('/enviar-imagem', uploadMidia.single('imagem'), mensagensControlador.enviarImagem);
router.post('/enviar-video', uploadMidia.single('video'), mensagensControlador.enviarVideo);
router.post('/enviar-audio', uploadMidia.single('audio'), mensagensControlador.enviarAudio);
router.post('/enviar-documento', uploadMidia.single('documento'), mensagensControlador.enviarDocumento);

// ============================================================
// ENVIO DE LOCALIZAÇÃO E CONTATO
// ============================================================

router.post('/enviar-localizacao', mensagensControlador.enviarLocalizacao);
// Quando for implementar o envio de contato, você usará o 'uploadContato'
router.post('/enviar-contato', /* uploadContato.single('contato'), */ mensagensControlador.enviarContato);

// ============================================================
// ✅ MENSAGENS FAVORITAS
// ============================================================

router.get('/favoritas/:conversaId', async (req, res) => {
  try {
    const { conversaId } = req.params;
    const { contaId } = req.usuario;

    const conversa = await prisma.conversa.findFirst({
      where: { id: conversaId, contaId: contaId }
    });

    if (!conversa) {
      return res.status(404).json({ sucesso: false, erro: 'Conversa não encontrada' });
    }

    const mensagens = await prisma.mensagem.findMany({
      where: {
        conversaId: conversaId,
        favorita: true,
        apagada: false
      },
      orderBy: { enviadaEm: 'desc' },
      include: {
        usuario: {
          select: { id: true, nome: true, avatar: true }
        },
        reacoes: {
          include: {
            usuario: { select: { id: true, nome: true } }
          }
        }
      }
    });

    res.json({
      sucesso: true,
      mensagens: mensagens
    });
  } catch (erro) {
    console.error('❌ Erro ao obter favoritas:', erro);
    res.status(500).json({ sucesso: false, erro: erro.message });
  }
});

module.exports = router;