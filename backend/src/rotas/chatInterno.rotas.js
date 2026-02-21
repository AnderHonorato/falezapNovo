// backend/src/rotas/chatInterno.rotas.js - CORRIGIDO FLUXO DE ALERTA

const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// ✅ IMPORTAÇÕES CORRIGIDAS
const { verificarToken } = require('../middleware/autenticacao.middleware');
const { 
  verificarPermissao, 
  verificarPermissaoAlerta 
} = require('../permissoes/verificadores'); 

const ChatInternoController = require('../controladores/ChatInternoController');
const upload = require('../middleware/upload');

const autenticar = verificarToken;
const adminOrSupport = verificarPermissao(['OWNER', 'ADMIN', 'ADMIN_EMPRESA', 'EMPRESARIO', 'ENCARREGADO', 'SUPORTE']);

// Wrapper seguro
const usarControlador = (metodo) => {
    if (!ChatInternoController || typeof ChatInternoController[metodo] !== 'function') {
        console.error(`❌ ERRO DE ROTA: Controlador ou método "${metodo}" não encontrado.`);
        return (req, res) => res.status(500).json({ erro: `Controlador indisponível: Método ${metodo} ausente.` });
    }
    return ChatInternoController[metodo].bind(ChatInternoController);
};

// ===== LISTAR CONVERSAS =====
router.get('/conversas', autenticar, usarControlador('listarConversas'));

// ===== AÇÕES DE CONVERSA (Novo) =====
router.post('/conversas/:usuarioId/nao-lida', autenticar, usarControlador('marcarConversaNaoLida'));

// ✅ ROTA CRUCIAL: Marcar conversa inteira como lida
router.post('/conversas/ler-tudo', autenticar, usarControlador('marcarConversaComoLida'));

// ===== ROTAS DE MENSAGENS =====
router.get('/mensagens', autenticar, usarControlador('listarMensagens'));

// ROTA: Mensagens individuais (Sua lógica original inline)
router.get('/mensagens/individual/:usuarioId', autenticar, async (req, res) => {
  try {
    const { usuarioId } = req.params;
    const { limite = 100 } = req.query;
    
    console.log(`[CHAT-INTERNO] Buscando mensagens com usuário: ${usuarioId}`);
    
    const mensagens = await prisma.mensagemChatInterno.findMany({
      where: {
        contaId: req.usuario.contaId,
        excluida: false,
        grupoId: null,
        OR: [
          { 
            remetenteId: req.usuario.id, 
            destinatarioId: usuarioId 
          },
          { 
            remetenteId: usuarioId, 
            destinatarioId: req.usuario.id 
          }
        ],
        exclusosPara: {
          none: {
            usuarioId: req.usuario.id
          }
        }
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
        destinatario: {
          select: {
            id: true,
            nome: true,
            foto_perfil: true,
            avatar: true,
            email: true,
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
    
    // Marcar como visualizadas
    await prisma.visualizacaoMensagemChatInterno.createMany({
      data: mensagens
        .filter(m => m.remetenteId !== req.usuario.id)
        .map(m => ({
          mensagemId: m.id,
          usuarioId: req.usuario.id
        })),
      skipDuplicates: true
    });
    
    console.log(`[CHAT-INTERNO] ✅ ${mensagens.length} mensagens retornadas`);
    
    res.json({ mensagens });
  } catch (error) {
    console.error('[CHAT-INTERNO] Erro ao buscar mensagens individuais:', error);
    res.status(500).json({ erro: 'Erro ao carregar mensagens.' });
  }
});

// ROTA: Mensagens gerais (Sua lógica original inline)
router.get('/mensagens/geral', autenticar, async (req, res) => {
  try {
    const { limite = 100 } = req.query;
    
    console.log('[CHAT-INTERNO] Buscando mensagens do chat geral');
    
    const mensagens = await prisma.mensagemChatInterno.findMany({
      where: {
        contaId: req.usuario.contaId,
        excluida: false,
        grupoId: null,
        destinatarioId: null,
        exclusosPara: {
          none: {
            usuarioId: req.usuario.id
          }
        }
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
    
    // Marcar como visualizadas
    await prisma.visualizacaoMensagemChatInterno.createMany({
      data: mensagens
        .filter(m => m.remetenteId !== req.usuario.id)
        .map(m => ({
          mensagemId: m.id,
          usuarioId: req.usuario.id
        })),
      skipDuplicates: true
    });
    
    console.log(`[CHAT-INTERNO] ✅ ${mensagens.length} mensagens gerais retornadas`);
    
    res.json({ mensagens });
  } catch (error) {
    console.error('[CHAT-INTERNO] Erro ao buscar mensagens gerais:', error);
    res.status(500).json({ erro: 'Erro ao carregar mensagens gerais.' });
  }
});

router.post('/mensagens', autenticar, upload.array('arquivos', 5), usarControlador('enviarMensagem'));
router.patch('/mensagens/:id', autenticar, usarControlador('editarMensagem'));
router.delete('/mensagens/:id', autenticar, usarControlador('excluirMensagem'));
router.post('/mensagens/:id/curtir', autenticar, usarControlador('curtirMensagem'));

// ✅ CORREÇÃO: Adicionada a rota '/ler' que o frontend chama
router.post('/mensagens/:id/ler', autenticar, usarControlador('marcarComoVisualizada'));
router.post('/mensagens/:id/visualizar', autenticar, usarControlador('marcarComoVisualizada'));

// ===== ROTAS DE FAVORITOS =====
router.post('/favoritos', autenticar, usarControlador('adicionarFavorito'));
router.delete('/favoritos/:usuarioId', autenticar, usarControlador('removerFavorito'));
router.get('/favoritos', autenticar, usarControlador('listarFavoritos'));

// ===== ROTAS DE ALERTAS =====
router.post('/alertas', autenticar, verificarPermissaoAlerta, async (req, res) => { // 🚨 ALTERAÇÃO AQUI
  const io = req.app.get('io');
  const { titulo, mensagem, destinatarios } = req.body;
  const { id: remetenteId, contaId } = req.usuario;

  if (!titulo || !mensagem || !destinatarios || destinatarios.length === 0) {
      return res.status(400).json({ erro: 'Título, mensagem e destinatários são obrigatórios.' });
  }

  try {
      // 1. Cria o Alerta
      const novoAlerta = await prisma.alertaChatInterno.create({
          data: {
              contaId,
              remetenteId,
              titulo,
              mensagem,
              prioridade: 'ALTA', // Alertas enviados pela equipe são ALTA
              tipo: 'URGENTE',
              destinatarios: {
                  createMany: {
                      data: destinatarios.map(usuarioId => ({ usuarioId }))
                  }
              }
          },
          include: {
              remetente: {
                  select: { id: true, nome: true, foto_perfil: true }
              }
          }
      });
      
      // 2. Cria uma mensagem no Chat Geral para persistência visível
      const mensagemNoChat = await prisma.mensagemChatInterno.create({
          data: {
              contaId,
              remetenteId,
              conteudo: `🚨 ALERTA: ${titulo} - ${mensagem.substring(0, 100)}...`,
              tipo: 'alerta_sistema',
              destinatarioId: null, // Chat Geral
          }
      });
      
      // 3. Emite o evento Socket.IO (Prioritário)
      if (io) {
          destinatarios.forEach(usuarioId => {
              // ⚠️ CORREÇÃO: Usa 'user:' no padrão
              io.to(`user:${usuarioId}`).emit('chat_interno_novo_alerta', {
                  alerta: novoAlerta,
                  mensagemChatId: mensagemNoChat.id 
              });
          });
          console.log(`[ALERTA] ✅ Alerta emitido para ${destinatarios.length} usuários.`);
      }

      res.status(201).json({ 
          sucesso: true, 
          alerta: novoAlerta,
          mensagemChat: mensagemNoChat,
          destinatariosEnviados: destinatarios.length 
      });

  } catch (error) {
      console.error('[ALERTA] ❌ Erro ao enviar alerta:', error);
      res.status(500).json({ erro: 'Falha ao enviar o alerta prioritário.' });
  }
});
router.post('/alertas/:id/responder', autenticar, usarControlador('responderAlerta'));
router.get('/alertas/:id/respostas', autenticar, adminOrSupport, usarControlador('listarRespostasAlerta'));
router.get('/alertas/meus', autenticar, adminOrSupport, usarControlador('listarMeusAlertas'));

// ===== ROTAS DE SOLICITAÇÕES DE AJUDA =====
router.post('/solicitacoes-ajuda', autenticar, async (req, res) => {
  try {
    // ✅ NOVO: Pega o campo solicitadoVia (pode ser 'IA' ou 'null/undefined')
    const { tipo, descricao, solicitadoVia } = req.body; 

    if (!tipo || !descricao) {
      return res.status(400).json({ erro: 'Tipo e descrição são obrigatórios.' });
    }

    const gerarProtocolo = () => {
      const prefixo = solicitadoVia === 'IA' ? 'AIA' : 'SUP'; // 🚨 Identifica a origem no protocolo
      const timestamp = Date.now().toString().slice(-8);
      const random = Math.random().toString(36).substring(2, 6).toUpperCase();
      return `${prefixo}-${timestamp}-${random}`;
    };

    const protocolo = gerarProtocolo();

    console.log('[CHAT-INTERNO] Criando solicitação de ajuda:', { tipo, protocolo, solicitadoVia });

    const solicitacao = await prisma.solicitacaoAjudaChatInterno.create({
      data: {
        contaId: req.usuario.contaId,
        solicitanteId: req.usuario.id,
        protocolo,
        tipo,
        descricao,
        status: 'PENDENTE'
      },
      include: {
        solicitante: {
          select: {
            id: true,
            nome: true,
            email: true,
            nickname: true,
            foto_perfil: true,
            avatar: true,
            tipo: true
          }
        }
      }
    });

    // 🚨 MODIFICADO: Lógica da Mensagem Inicial (Identifica a origem IA)
    let conteudoMensagem = `🎫 **Chamado nº ${protocolo}**\n\n`;
    
    if (solicitadoVia === 'IA') {
        conteudoMensagem += `Olá **${req.usuario.nome}**! Recebemos sua solicitação iniciada pelo **Assistente de IA**.\n\n`
    } else {
        conteudoMensagem += `Olá **${req.usuario.nome}**! Recebemos sua solicitação.\n\n`
    }
    
    conteudoMensagem += `**Enquanto você aguarda o atendimento, descreva com detalhes o que você precisa.**\n\n` +
                        `⏱️ Tempo médio de resposta: *10 minutos*\n\n` +
                        `_Um atendente irá aceitar seu chamado em breve. Aguarde..._`;


    const mensagemInicial = await prisma.mensagemSuporte.create({
      data: {
        solicitacaoId: solicitacao.id,
        remetenteId: req.usuario.id,
        tipo: 'sistema',
        conteudo: conteudoMensagem
      },
      include: {
        remetente: {
          select: {
            id: true,
            nome: true,
            foto_perfil: true,
            avatar: true,
            tipo: true
          }
        }
      }
    });

    console.log('[CHAT-INTERNO] ✅ Mensagem inicial criada:', mensagemInicial.id);

    // Notificar OWNER e SUPORTE
    const usuariosSuporteOwner = await prisma.usuario.findMany({
      where: {
        tipo: { in: ['OWNER', 'SUPORTE'] },
        status: 'ATIVO'
      },
      select: { id: true, nome: true }
    });

    const io = req.app.get('io');
    if (io) {
      usuariosSuporteOwner.forEach(usuarioSuporte => {
        io.to(`user:${usuarioSuporte.id}`).emit('nova_solicitacao_ajuda', solicitacao);
      });
      
      console.log('[CHAT-INTERNO] ✅ Notificações enviadas para', usuariosSuporteOwner.length, 'usuários de suporte');
    }

    res.status(201).json({ 
      sucesso: true, 
      solicitacao,
      protocolo,
      mensagemInicial,
      mensagem: 'Solicitação enviada para a equipe de suporte!'
    });
  } catch (error) {
    console.error('[CHAT-INTERNO] ❌ Erro ao criar solicitação de ajuda:', error);
    res.status(500).json({ erro: 'Erro ao enviar solicitação.' });
  }
});

router.get('/solicitacoes-ajuda', autenticar, adminOrSupport, async (req, res) => {
  try {
    const { status } = req.query;
    const where = {};
    
    if (status && status !== 'TODOS') {
      where.status = status;
    }

    const solicitacoes = await prisma.solicitacaoAjudaChatInterno.findMany({
      where,
      include: {
        solicitante: {
          select: {
            id: true,
            nome: true,
            email: true,
            nickname: true,
            foto_perfil: true,
            avatar: true,
            tipo: true
          }
        },
        atendidoPor: {
          select: {
            id: true,
            nome: true,
            foto_perfil: true,
            avatar: true
          }
        }
      },
      orderBy: [
        { status: 'asc' },
        { criadaEm: 'desc' }
      ]
    });

    res.json({ solicitacoes });
  } catch (error) {
    console.error('[CHAT-INTERNO] Erro ao listar solicitações:', error);
    res.status(500).json({ erro: 'Erro ao carregar solicitações.' });
  }
});

router.patch('/solicitacoes-ajuda/:id/atender', autenticar, adminOrSupport, async (req, res) => {
  try {
    const { id } = req.params;

    const solicitacao = await prisma.solicitacaoAjudaChatInterno.findUnique({
      where: { id },
      include: {
        solicitante: {
          select: {
            id: true,
            nome: true,
            email: true,
            nickname: true,
            foto_perfil: true,
            avatar: true
          }
        }
      }
    });

    if (!solicitacao) {
      return res.status(404).json({ erro: 'Solicitação não encontrada.' });
    }

    if (solicitacao.status !== 'PENDENTE') {
      return res.status(400).json({ erro: 'Esta solicitação já foi atendida.' });
    }

    const atualizada = await prisma.solicitacaoAjudaChatInterno.update({
      where: { id },
      data: {
        status: 'EM_ATENDIMENTO',
        atendidoPorId: req.usuario.id,
        atendidaEm: new Date()
      },
      include: {
        solicitante: {
          select: {
            id: true,
            nome: true,
            email: true,
            nickname: true,
            foto_perfil: true,
            avatar: true
          }
        },
        atendidoPor: {
          select: {
            id: true,
            nome: true,
            foto_perfil: true,
            avatar: true
          }
        }
      }
    });

    // Emitir evento
    const io = req.app.get('io');
    if (io) {
      io.to(`user:${solicitacao.solicitanteId}`).emit('atendimento_iniciado', {
        solicitacao: atualizada,
        atendente: req.usuario
      });
    }

    res.json({ 
      sucesso: true, 
      solicitacao: atualizada 
    });
  } catch (error) {
    console.error('[CHAT-INTERNO] Erro ao atender solicitação:', error);
    res.status(500).json({ erro: 'Erro ao iniciar atendimento.' });
  }
});

// ===== OUTRAS ROTAS =====
router.delete('/limpar-chat', autenticar, usarControlador('limparChat'));
router.get('/estatisticas', autenticar, usarControlador('obterEstatisticas'));

module.exports = router;