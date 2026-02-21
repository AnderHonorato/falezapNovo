// backend/src/rotas/whatsapp.rotas.js - VERSÃO FINAL CORRIGIDA

const express = require('express');
const router = express.Router();
const ControladorWhatsApp = require('../controladores/whatsapp.controlador');
const ConversasControlador = require('../controladores/conversas.controlador');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { verificarToken } = require('../middleware/autenticacao.middleware');

console.log('\n✅ Carregando rotas WhatsApp...');

// ============================================================
// ROTAS DE CONEXÃO E INSTÂNCIAS
// ============================================================

router.post('/gerar-qr-code', verificarToken, (req, res) => ControladorWhatsApp.gerarQRCode(req, res));
router.get('/status/:instancia', verificarToken, (req, res) => ControladorWhatsApp.verificarStatus(req, res));
router.post('/desconectar/:instancia', verificarToken, (req, res) => ControladorWhatsApp.desconectar(req, res));
router.get('/conectados', verificarToken, (req, res) => ControladorWhatsApp.listarConectados(req, res));
router.post('/criar-instancia', verificarToken, (req, res) => ControladorWhatsApp.criarInstancia(req, res));
router.get('/instancias', verificarToken, (req, res) => ControladorWhatsApp.listarInstancias(req, res));
router.get('/instancias/:instancia', verificarToken, (req, res) => ControladorWhatsApp.obterDetalhesInstancia(req, res));
router.put('/instancia/:instancia', verificarToken, (req, res) => ControladorWhatsApp.atualizarInstancia(req, res));
router.delete('/instancia/:instancia', verificarToken, (req, res) => ControladorWhatsApp.deletarInstancia(req, res));
router.get('/limite', verificarToken, (req, res) => ControladorWhatsApp.obterLimite(req, res));
router.get('/dashboard', verificarToken, (req, res) => ControladorWhatsApp.obterDashboard(req, res));

// ✅ CORREÇÃO: Usar rota inline ao invés do controlador
router.get('/perfil/:numero', verificarToken, async (req, res) => {
  try {
    const { numero } = req.params;
    const { contaId } = req.usuario;

    const conversa = await prisma.conversa.findFirst({
      where: {
        numeroCliente: numero,
        contaId: contaId
      },
      include: {
        mensagens: {
          select: { id: true }
        }
      }
    });

    if (!conversa) {
      return res.status(404).json({ sucesso: false, erro: 'Contato não encontrado' });
    }

    const totalMensagens = conversa.mensagens.length;

    res.json({
      sucesso: true,
      nomeCliente: conversa.nomeContato,
      numeroCliente: conversa.numeroCliente,
      fotoPerfil: conversa.fotoUrl || conversa.foto_perfil,
      email: conversa.email,
      observacoes: conversa.observacoes,
      totalMensagens: totalMensagens,
      criadoEm: conversa.criadaEm,
      ultimaMensagemEm: conversa.ultimaMensagemEm
    });
  } catch (erro) {
    console.error('❌ Erro ao obter perfil:', erro);
    res.status(500).json({ sucesso: false, erro: erro.message });
  }
});

// ============================================================
// ✅ ROTA TEMPORÁRIA: CRIAR CONEXÃO WHATSAPP BUSINESS API
// ============================================================
router.post('/criar-conexao-business-api', verificarToken, async (req, res) => {
  try {
    const contaId = req.usuario?.contaId;

    if (!contaId) {
      return res.status(400).json({ erro: 'Conta não identificada' });
    }

    console.log('\n🔧 [CRIAR CONEXÃO] Iniciando...');
    console.log('📋 ContaId:', contaId);

    const conexaoExistente = await prisma.conexaoWhatsApp.findFirst({
      where: {
        contaId: contaId,
        instancia: 1
      }
    });

    if (conexaoExistente) {
      console.log('⚠️ Conexão já existe, atualizando...');

      const conexaoAtualizada = await prisma.conexaoWhatsApp.update({
        where: { id: conexaoExistente.id },
        data: {
          status: 'CONECTADO',
          numeroWhatsApp: process.env.WHATSAPP_PHONE_NUMBER || 'N/A',
          nomeInstancia: 'WhatsApp Business API',
          nomeExibicao: 'WhatsApp Business',
          atualizadoEm: new Date()
        }
      });

      console.log('✅ Conexão atualizada:', conexaoAtualizada.id);

      return res.json({
        sucesso: true,
        mensagem: 'Conexão atualizada com sucesso',
        conexao: {
          id: conexaoAtualizada.id,
          instancia: conexaoAtualizada.instancia,
          numeroWhatsApp: conexaoAtualizada.numeroWhatsApp,
          nomeInstancia: conexaoAtualizada.nomeInstancia,
          status: conexaoAtualizada.status,
          contaId: conexaoAtualizada.contaId
        }
      });
    }

    console.log('🆕 Criando nova conexão...');

    const novaConexao = await prisma.conexaoWhatsApp.create({
      data: {
        instancia: 1,
        numeroWhatsApp: process.env.WHATSAPP_PHONE_NUMBER || 'N/A',
        nomeInstancia: 'WhatsApp Business API',
        nomeExibicao: 'WhatsApp Business',
        status: 'CONECTADO',
        contaId: contaId,
        corIdentificacao: '#128C7E'
      }
    });

    console.log('✅ Conexão WhatsApp Business API criada:', novaConexao.id);

    res.json({
      sucesso: true,
      mensagem: 'Conexão criada com sucesso',
      conexao: {
        id: novaConexao.id,
        instancia: novaConexao.instancia,
        numeroWhatsApp: novaConexao.numeroWhatsApp,
        nomeInstancia: novaConexao.nomeInstancia,
        status: novaConexao.status,
        contaId: novaConexao.contaId
      }
    });

  } catch (erro) {
    console.error('❌ Erro ao criar/atualizar conexão Business API:', erro);
    res.status(500).json({
      sucesso: false,
      erro: 'Erro ao configurar conexão Business API',
      detalhes: process.env.NODE_ENV === 'development' ? erro.message : undefined
    });
  }
});

// ============================================================
// ROTAS DE MENSAGENS
// ============================================================

router.post('/enviar-mensagem', verificarToken, (req, res) => ControladorWhatsApp.enviarMensagem(req, res));
router.post('/enviar-reacao', verificarToken, (req, res) => ControladorWhatsApp.enviarReacao(req, res));
router.post('/enviar-midia', verificarToken, (req, res) => ControladorWhatsApp.enviarMidia(req, res));
router.get('/conversa/:numeroCliente/mensagens', verificarToken, (req, res) => ControladorWhatsApp.obterMensagensConversa(req, res));
router.get('/mensagens/:numeroCliente/buscar', verificarToken, (req, res) => ControladorWhatsApp.buscarMensagensConversa(req, res));
router.get('/estatisticas-mensagens', verificarToken, (req, res) => ControladorWhatsApp.obterEstatisticasMensagens(req, res));

// Ações em mensagens individuais
router.delete('/mensagem/:mensagemId', verificarToken, (req, res) => ControladorWhatsApp.deletarMensagem(req, res));
router.post('/conversa/:numeroCliente/mensagem/:mensagemId/fixar', verificarToken, (req, res) => ControladorWhatsApp.fixarMensagem(req, res));
router.delete('/mensagem/fixar/:mensagemId', verificarToken, (req, res) => ControladorWhatsApp.desafixarMensagem(req, res));
router.get('/contato/:numero/foto', verificarToken, (req, res) => ControladorWhatsApp.obterFotoContato(req, res));

// ============================================================
// ROTAS DE CONVERSAS
// ============================================================

router.get('/conversas', verificarToken, (req, res) => ControladorWhatsApp.obterConversas(req, res));
router.get('/conversas/buscar', verificarToken, (req, res) => ControladorWhatsApp.buscarConversas(req, res));
router.put('/conversa/:numeroCliente/status', verificarToken, (req, res) => ControladorWhatsApp.atualizarStatusConversa(req, res));
router.put('/conversa/:numeroCliente/lida', verificarToken, (req, res) => ControladorWhatsApp.marcarComoLida(req, res));

// PATCH alternativo para marcar como lida
router.patch('/conversa/:numeroCliente/marcar-lida', verificarToken, async (req, res) => {
  try {
    const { numeroCliente } = req.params;
    const contaId = req.usuario?.contaId;

    console.log(`\n✅ [MARCAR LIDA - PATCH] Requisição:`);
    console.log(`   - contaId: ${contaId}`);
    console.log(`   - numeroCliente: ${numeroCliente}`);

    if (!contaId) {
      return res.status(400).json({ erro: 'Conta não identificada' });
    }

    const conversa = await prisma.conversa.findFirst({
      where: {
        contaId: contaId,
        numeroCliente: numeroCliente
      }
    });

    if (!conversa) {
      return res.status(404).json({
        sucesso: false,
        erro: 'Conversa não encontrada'
      });
    }

    await prisma.$transaction([
      prisma.conversa.update({
        where: { id: conversa.id },
        data: { naoLidas: 0 }
      }),
      prisma.mensagem.updateMany({
        where: {
          conversaId: conversa.id,
          direcao: 'RECEBIDA',
          lida: false
        },
        data: { lida: true }
      })
    ]);

    console.log(`✅ Conversa marcada como lida (via PATCH)`);

    res.json({
      sucesso: true,
      mensagem: 'Conversa marcada como lida'
    });

  } catch (erro) {
    console.error('❌ Erro ao marcar como lida (PATCH):', erro);
    res.status(500).json({
      sucesso: false,
      erro: 'Erro ao marcar conversa como lida'
    });
  }
});

router.put('/conversa/:numeroCliente/fixar', verificarToken, (req, res) => ControladorWhatsApp.toggleFixarConversa(req, res));
router.put('/conversa/:numeroCliente/favoritar', verificarToken, (req, res) => ControladorWhatsApp.toggleFavoritar(req, res));
router.put('/conversa/:numeroCliente/nao-lida', verificarToken, (req, res) => ControladorWhatsApp.marcarComoNaoLida(req, res));
router.put('/conversa/:numeroCliente/arquivar', verificarToken, (req, res) => ControladorWhatsApp.arquivarConversa(req, res));
router.put('/conversa/:numeroCliente/desarquivar', verificarToken, (req, res) => ControladorWhatsApp.desarquivarConversa(req, res));
router.put('/conversa/:numeroCliente/atribuir', verificarToken, (req, res) => ControladorWhatsApp.atribuirConversa(req, res));

// ============================================================
// ROTAS DE ANOTAÇÕES
// ============================================================

router.post('/conversa/:numeroCliente/anotacao', verificarToken, (req, res) => ControladorWhatsApp.criarAnotacao(req, res));
router.get('/conversa/:numeroCliente/anotacoes', verificarToken, (req, res) => ControladorWhatsApp.listarAnotacoes(req, res));
router.put('/anotacao/:anotacaoId', verificarToken, (req, res) => ControladorWhatsApp.atualizarAnotacao(req, res));
router.delete('/anotacao/:anotacaoId', verificarToken, (req, res) => ControladorWhatsApp.deletarAnotacao(req, res));

// ============================================================
// ROTAS DE SINCRONIZAÇÃO
// ============================================================

router.post('/sincronizar', verificarToken, (req, res) => ControladorWhatsApp.sincronizarHistorico(req, res));
router.post('/sincronizar-historico-completo', verificarToken, (req, res) => ControladorWhatsApp.sincronizarHistoricoCompleto(req, res));
router.post('/conversa/:numeroCliente/sincronizar', verificarToken, (req, res) => ControladorWhatsApp.sincronizarConversaEspecifica(req, res));
router.get('/estatisticas', verificarToken, (req, res) => ControladorWhatsApp.obterEstatisticas(req, res));

// ============================================================
// ROTAS DE EVENTOS DO SISTEMA
// ============================================================

router.post('/conversa/:numeroCliente/evento-sistema', verificarToken, (req, res) => ControladorWhatsApp.criarEventoSistema(req, res));

// ============================================================
// ROTAS DE PERFIL E CONTATO
// ============================================================

router.get('/contato/:numero', verificarToken, async (req, res) => {
  try {
    const { numero } = req.params;
    const contaId = req.usuario?.contaId;

    if (!contaId) {
      return res.status(400).json({ erro: 'Conta não identificada' });
    }

    const numeroLimpo = numero.replace(/\D/g, '');

    const conversa = await prisma.conversa.findFirst({
      where: {
        contaId: contaId,
        numeroCliente: { contains: numeroLimpo }
      },
      include: {
        conexaoWhatsApp: {
          select: {
            instancia: true,
            nomeInstancia: true,
            numeroWhatsApp: true
          }
        },
        mensagens: {
          take: 1,
          orderBy: { timestamp: 'desc' }
        }
      }
    });

    const totalMensagens = conversa ? await prisma.mensagem.count({
      where: { conversaId: conversa.id }
    }) : 0;

    let contatoInfo = null;
    if (!conversa?.nomeContato) {
      contatoInfo = await prisma.contatoWhatsApp.findFirst({
        where: { numero: { contains: numeroLimpo }, instancia: { contaId: contaId } },
        select: { nome: true, pushname: true, fotoPerfil: true }
      });
    }

    const dadosCompletos = {
      nome: conversa?.nomeContato || contatoInfo?.nome || contatoInfo?.pushname || null,
      telefone: numeroLimpo,
      fotoPerfil: conversa?.fotoUrl || conversa?.foto_perfil || contatoInfo?.fotoPerfil || null,
      isGrupo: conversa?.isGrupo || false,
      totalMensagens: totalMensagens,
      ultimaMensagem: conversa?.mensagens[0]?.timestamp || null,
      statusConversa: conversa?.statusConversa || null,
      instancia: conversa?.conexaoWhatsApp || null
    };

    res.json(dadosCompletos);

  } catch (error) {
    console.error('❌ Erro ao buscar dados do contato:', error);
    res.status(500).json({ erro: 'Erro ao buscar informações do contato' });
  }
});

router.get('/conversa/:numero/foto', verificarToken, async (req, res) => {
  try {
    const { numero } = req.params;
    const contaId = req.usuario?.contaId;

    if (!contaId) {
      return res.status(400).json({ erro: 'Conta não identificada' });
    }

    const numeroLimpo = numero.replace(/\D/g, '');

    const conversa = await prisma.conversa.findFirst({
      where: {
        contaId: contaId,
        numeroCliente: { contains: numeroLimpo }
      },
      select: { fotoUrl: true, foto_perfil: true }
    });

    if (conversa?.fotoUrl || conversa?.foto_perfil) {
      return res.json({
        fotoPerfil: conversa.fotoUrl || conversa.foto_perfil,
        origem: 'sistema'
      });
    }

    const contato = await prisma.contatoWhatsApp.findFirst({
      where: { numero: { contains: numeroLimpo }, instancia: { contaId: contaId }},
      select: { fotoPerfil: true }
    });

    if (contato?.fotoPerfil) {
      return res.json({ fotoPerfil: contato.fotoPerfil, origem: 'contato_whatsapp'});
    }

    res.json({
      fotoPerfil: null,
      origem: null
    });

  } catch (error) {
    console.error('❌ Erro ao buscar foto:', error);
    res.status(500).json({ erro: 'Erro ao buscar foto de perfil' });
  }
});

router.post('/sincronizar-fotos', verificarToken, async (req, res) => {
  try {
    const contaId = req.usuario?.contaId;
    
    if (!contaId) {
      return res.status(400).json({ erro: 'Conta não identificada' });
    }

    const conexoes = await prisma.conexaoWhatsApp.findMany({
      where: {
        contaId: contaId,
        status: 'CONECTADO'
      }
    });

    if (conexoes.length === 0) {
      return res.status(400).json({ erro: 'Nenhum WhatsApp conectado' });
    }

    let sincronizadas = 0;
    let erros = 0;

    const conversas = await prisma.conversa.findMany({
      where: { contaId: contaId },
      select: { id: true, numeroCliente: true, conexaoWhatsAppId: true }
    });

    for (const conv of conversas) {
      try {
        sincronizadas++;
      } catch (error) {
        erros++;
      }
    }

    console.log(`Sincronização de fotos concluída: ${sincronizadas} sucesso, ${erros} erros.`);
    res.json({
      sucesso: true,
      sincronizadas,
      erros,
      total: conversas.length
    });

  } catch (error) {
    console.error('❌ Erro GERAL ao sincronizar fotos:', error);
    res.status(500).json({ erro: 'Erro geral ao sincronizar fotos de perfil' });
  }
});

// ============================================================
// DEBUG
// ============================================================

router.get('/debug-mensagens/:numeroCliente', verificarToken, async (req, res) => {
  try {
    const { numeroCliente } = req.params;
    const contaId = req.usuario?.contaId;

    if (!contaId) {
      return res.status(400).json({ erro: 'Conta não identificada' });
    }

    const conversa = await prisma.conversa.findFirst({
      where: {
        contaId: contaId,
        numeroCliente: numeroCliente
      },
      include: {
        conexaoWhatsApp: true,
        mensagens: {
          take: 10,
          orderBy: { timestamp: 'desc' }
        }
      }
    });

    if (!conversa) {
      return res.status(404).json({ sucesso: false, erro: 'Conversa não encontrada para debug.'});
    }

    res.json({
      sucesso: true,
      conversa: conversa,
      totalMensagens: conversa.mensagens.length
    });

  } catch (erro) {
    console.error('❌ Erro no debug de mensagens:', erro);
    res.status(500).json({ erro: erro.message });
  }
});

router.get('/debug-conexoes', verificarToken, async (req, res) => {
  try {
    const contaId = req.usuario?.contaId;

    if (!contaId) {
      return res.status(400).json({ erro: 'Conta não identificada' });
    }

    const conexoes = await prisma.conexaoWhatsApp.findMany({
      where: { contaId: contaId },
      orderBy: { atualizadoEm: 'desc' }
    });

    console.log('\n🔍 [DEBUG CONEXÕES]');
    console.log('ContaId:', contaId);
    console.log('Total de conexões:', conexoes.length);

    conexoes.forEach(c => {
      console.log(`\n- ID: ${c.id}`);
      console.log(`  Instância: ${c.instancia}`);
      console.log(`  Número: ${c.numeroWhatsApp || 'Não definido'}`);
      console.log(`  Status: ${c.status}`);
      console.log(`  Nome: ${c.nomeInstancia || 'Sem nome'}`);
    });

    res.json({
      sucesso: true,
      contaId: contaId,
      total: conexoes.length,
      conexoes: conexoes.map(c => ({
        id: c.id,
        instancia: c.instancia,
        numeroWhatsApp: c.numeroWhatsApp,
        nomeInstancia: c.nomeInstancia,
        status: c.status,
        criadoEm: c.criadoEm,
        atualizadoEm: c.atualizadoEm
      }))
    });

  } catch (erro) {
    console.error('❌ Erro no debug de conexões:', erro);
    res.status(500).json({ erro: erro.message });
  }
});

// ============================================================
// LIMPAR HISTÓRICO DE MENSAGENS
// ============================================================

router.delete('/conversa/:numeroCliente/limpar-historico', verificarToken, async (req, res) => {
  try {
    const { numeroCliente } = req.params;
    const { periodo } = req.query;
    const contaId = req.usuario?.contaId;

    if (!contaId) {
      return res.status(400).json({ erro: 'Conta não identificada' });
    }

    console.log(`\n🗑️ [LIMPAR HISTÓRICO]`);
    console.log(`   - contaId: ${contaId}`);
    console.log(`   - numeroCliente: ${numeroCliente}`);
    console.log(`   - periodo: ${periodo}`);

    const conversa = await prisma.conversa.findFirst({
      where: {
        contaId: contaId,
        numeroCliente: numeroCliente
      }
    });

    if (!conversa) {
      return res.status(404).json({
        sucesso: false,
        erro: 'Conversa não encontrada'
      });
    }

    let dataLimite = null;
    const agora = new Date();
    const dataCalculo = new Date(agora);

    switch (periodo) {
      case 'hoje':
        dataLimite = new Date(dataCalculo.setHours(0, 0, 0, 0));
        break;
      case '7dias':
        dataLimite = new Date(dataCalculo.setDate(dataCalculo.getDate() - 7));
        break;
      case '30dias':
        dataLimite = new Date(dataCalculo.setDate(dataCalculo.getDate() - 30));
        break;
      case 'tudo':
        dataLimite = null;
        break;
      default:
        return res.status(400).json({
          sucesso: false,
          erro: "Período inválido. Use: 'hoje', '7dias', '30dias', 'tudo'"
        });
    }

    console.log(`   - Data limite calculada: ${dataLimite ? dataLimite.toISOString() : 'Nenhuma (tudo)'}`);

    const whereCondition = {
      conversaId: conversa.id,
    };
    if (dataLimite) {
      whereCondition.timestamp = { gte: dataLimite };
    }

    const resultado = await prisma.mensagem.deleteMany({
      where: whereCondition
    });

    console.log(`✅ ${resultado.count} mensagens deletadas`);

    if (periodo === 'tudo' || !dataLimite) {
      await prisma.conversa.update({
        where: { id: conversa.id },
        data: { ultimaMensagemEm: new Date() }
      });
    }

    res.json({
      sucesso: true,
      mensagem: `${resultado.count} mensagens deletadas`,
      deletadas: resultado.count
    });

  } catch (erro) {
    console.error('❌ Erro ao limpar histórico:', erro);
    res.status(500).json({
      sucesso: false,
      erro: 'Erro ao limpar histórico de mensagens'
    });
  }
});

console.log('✅ Rotas WhatsApp registradas com sucesso!\n');

module.exports = router;