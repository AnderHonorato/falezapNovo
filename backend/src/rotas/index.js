// backend/src/rotas/index.js - REGISTRO COMPLETO DE ROTAS

const express = require('express');
const router = express.Router();

// ============================================================
// IMPORTAÇÃO DE TODAS AS ROTAS
// ============================================================

// 🔐 Autenticação
const authRotas = require('./autenticacao.rotas');

// 💬 WhatsApp e Mensagens
const whatsappRotas = require('./whatsapp.rotas');
const mensagensRotas = require('./mensagens.rotas');
const conversasRotas = require('./conversas.rotas');
const webhookRotas = require('./whatsapp.webhook');

// 📝 ANOTAÇÕES (CRÍTICO)
const anotacoesRotas = require('./anotacoes.rotas');

// 👥 Usuários e Empresas
const usuariosRotas = require('./usuarios.rotas');
const empresasRotas = require('./empresa.rotas');
const categoriaRotas = require('./categoria.rotas');

// 📰 Blog
const blogRotas = require('./blog.rotas');

// 💬 Chat Interno
const chatInternoRotas = require('./chat-interno.rotas');
const gruposChatInternoRotas = require('./grupoChatInterno.rotas');

// 📊 Status e Analytics
const statusRotas = require('./status.rotas');
const analyticsRotas = require('./analytics.rotas');

// 🆘 Suporte
const suporteRotas = require('./suporte.rotas');

// 🔧 Debug (opcional, pode remover em produção)
// const debugRotas = require('./debug.rotas');

// ============================================================
// REGISTRO DAS ROTAS COM PREFIXOS
// ============================================================

// 🔐 Autenticação
router.use('/auth', authRotas);

// 💬 WhatsApp
router.use('/whatsapp', whatsappRotas);
router.use('/whatsapp', webhookRotas); // Webhook /whatsapp/webhook
router.use('/mensagens', mensagensRotas);
router.use('/conversas', conversasRotas);

// 📝 ANOTAÇÕES (ROTA CRÍTICA)
router.use('/anotacoes', anotacoesRotas);

// 👥 Usuários e Empresas
router.use('/usuarios', usuariosRotas);
router.use('/empresas', empresasRotas);
router.use('/categorias', categoriaRotas);

// 📰 Blog
router.use('/blog', blogRotas);

// 💬 Chat Interno
router.use('/chat-interno', chatInternoRotas);
router.use('/chat-interno', gruposChatInternoRotas);

// 📊 Status e Analytics
router.use('/status', statusRotas);
router.use('/analytics', analyticsRotas);

// 🆘 Suporte
router.use('/suporte', suporteRotas);

// 🔧 Debug (descomente se precisar)
// router.use('/debug', debugRotas);

// ============================================================
// ROTA DE HEALTH CHECK
// ============================================================

router.get('/health', (req, res) => {
  res.json({
    status: '✅ API Online',
    timestamp: new Date().toISOString(),
    version: '2.0.0',
    rotas_disponiveis: {
      autenticacao: '/auth',
      whatsapp: '/whatsapp',
      webhook: '/whatsapp/webhook',
      mensagens: '/mensagens',
      conversas: '/conversas',
      anotacoes: '/anotacoes', // ✅ CONFIRMADO
      usuarios: '/usuarios',
      empresas: '/empresas',
      categorias: '/categorias',
      blog: '/blog',
      chatInterno: '/chat-interno',
      grupos: '/chat-interno/grupos',
      status: '/status',
      analytics: '/analytics',
      suporte: '/suporte'
    }
  });
});

// ============================================================
// ROTA 404
// ============================================================

router.use('*', (req, res) => {
  res.status(404).json({
    erro: '❌ Rota não encontrada',
    caminho: req.originalUrl,
    metodo: req.method,
    dica: 'Verifique /api/health para ver rotas disponíveis'
  });
});

module.exports = router;