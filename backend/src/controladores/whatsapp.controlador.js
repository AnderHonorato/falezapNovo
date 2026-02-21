// backend/src/controladores/whatsapp.controlador.js - PARTE 1

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const whatsappService = require('../servicos/whatsappOfficial.servico');
const baileysServico = require('../servicos/baileys.servico');
const path = require('path');
const fs = require('fs').promises;

class WhatsAppControlador {
  
  // ============================================
  // CONEXÃO E INSTÂNCIAS
  // ============================================
  
  async gerarQRCode(req, res) {
    try {
      const { instancia } = req.body;
      const { contaId } = req.usuario;

      console.log('📱 [WHATSAPP] Gerando QR Code para instância:', instancia);

      const conexao = await prisma.conexaoWhatsApp.findFirst({
        where: {
          contaId: contaId,
          instancia: parseInt(instancia)
        }
      });

      if (!conexao) {
        return res.status(404).json({
          sucesso: false,
          erro: 'Instância não encontrada'
        });
      }

      // ✅ Se for META (instância 1), não gera QR Code
      if (conexao.tipoParceiro === 'META') {
        return res.json({
          sucesso: false,
          erro: 'WhatsApp Business API não usa QR Code',
          mensagem: 'Esta instância já está conectada via API Oficial'
        });
      }

      // ✅ Se for BAILEYS (instância 2+), gera QR Code
      if (conexao.tipoParceiro === 'BAILEYS') {
        console.log('✅ Gerando QR Code Baileys para instância:', instancia);
        
        baileysServico.registrarClienteWS(contaId, instancia, res);
        await baileysServico.conectarWhatsApp(contaId, instancia);
        return;
      }

      res.status(400).json({
        sucesso: false,
        erro: 'Tipo de parceiro desconhecido'
      });

    } catch (erro) {
      console.error('❌ Erro ao gerar QR Code:', erro);
      res.status(500).json({ sucesso: false, erro: erro.message });
    }
  }

  async verificarStatus(req, res) {
    try {
      const { instancia } = req.params;
      const { contaId } = req.usuario;

      const conexao = await prisma.conexaoWhatsApp.findFirst({
        where: {
          contaId: contaId,
          instancia: parseInt(instancia)
        }
      });

      if (!conexao) {
        return res.status(404).json({
          sucesso: false,
          erro: 'Instância não encontrada'
        });
      }

      // ✅ Se for Baileys, verifica status no serviço
      if (conexao.tipoParceiro === 'BAILEYS') {
        const statusBaileys = baileysServico.obterStatus(contaId, parseInt(instancia));
        
        return res.json({
          sucesso: true,
          conectado: statusBaileys.conectado,
          status: conexao.status,
          numeroWhatsApp: conexao.numeroWhatsApp,
          tipoParceiro: 'BAILEYS'
        });
      }

      const saude = await whatsappService.verificarSaude();

      res.json({
        sucesso: true,
        conectado: conexao.status === 'CONECTADO',
        status: conexao.status,
        numeroWhatsApp: conexao.numeroWhatsApp,
        saudeAPI: saude,
        tipoParceiro: 'META'
      });
    } catch (erro) {
      console.error('❌ Erro ao verificar status:', erro);
      res.status(500).json({ sucesso: false, erro: erro.message });
    }
  }

  async desconectar(req, res) {
    try {
      const { instancia } = req.params;
      const { contaId } = req.usuario;

      const conexao = await prisma.conexaoWhatsApp.findFirst({
        where: {
          contaId: contaId,
          instancia: parseInt(instancia)
        }
      });

      if (!conexao) {
        return res.status(404).json({
          sucesso: false,
          erro: 'Instância não encontrada'
        });
      }

      // ✅ Se for Baileys, desconecta via serviço
      if (conexao.tipoParceiro === 'BAILEYS') {
        await baileysServico.desconectar(contaId, parseInt(instancia));
      }

      await prisma.conexaoWhatsApp.update({
        where: { id: conexao.id },
        data: {
          status: 'DESCONECTADO',
          qrCode: null,
          numeroWhatsApp: null
        }
      });

      res.json({
        sucesso: true,
        mensagem: 'WhatsApp desconectado'
      });
    } catch (erro) {
      console.error('❌ Erro ao desconectar:', erro);
      res.status(500).json({ sucesso: false, erro: erro.message });
    }
  }

  async listarConectados(req, res) {
    try {
      const { contaId } = req.usuario;

      const conexoes = await prisma.conexaoWhatsApp.findMany({
        where: {
          contaId: contaId,
          status: 'CONECTADO'
        },
        orderBy: { instancia: 'asc' }
      });

      res.json({
        sucesso: true,
        conexoes: conexoes
      });
    } catch (erro) {
      console.error('❌ Erro ao listar conectados:', erro);
      res.status(500).json({ sucesso: false, erro: erro.message });
    }
  }

  async criarInstancia(req, res) {
    try {
      const { nomeInstancia, corIdentificacao } = req.body;
      const { contaId } = req.usuario;

      const conta = await prisma.conta.findUnique({
        where: { id: contaId },
        select: { limiteWhatsApps: true }
      });

      const totalInstancias = await prisma.conexaoWhatsApp.count({
        where: { contaId: contaId }
      });

      if (totalInstancias >= (conta?.limiteWhatsApps || 2)) {
        return res.status(400).json({
          sucesso: false,
          erro: 'Limite de instâncias atingido'
        });
      }

      const ultimaInstancia = await prisma.conexaoWhatsApp.findFirst({
        where: { contaId: contaId },
        orderBy: { instancia: 'desc' }
      });

      const novoNumeroInstancia = ultimaInstancia ? ultimaInstancia.instancia + 1 : 2;

      const novaConexao = await prisma.conexaoWhatsApp.create({
        data: {
          instancia: novoNumeroInstancia,
          tipoParceiro: 'BAILEYS',
          nomeInstancia: nomeInstancia || `Baileys ${novoNumeroInstancia}`,
          corIdentificacao: corIdentificacao || '#0088CC',
          status: 'DESCONECTADO',
          contaId: contaId
        }
      });

      res.json({
        sucesso: true,
        conexao: novaConexao,
        mensagem: 'Instância Baileys criada com sucesso'
      });
    } catch (erro) {
      console.error('❌ Erro ao criar instância:', erro);
      res.status(500).json({ sucesso: false, erro: erro.message });
    }
  }

  async listarInstancias(req, res) {
    try {
      const { contaId } = req.usuario;

      const instancias = await prisma.conexaoWhatsApp.findMany({
        where: { contaId: contaId },
        orderBy: { instancia: 'asc' }
      });

      const conta = await prisma.conta.findUnique({
        where: { id: contaId },
        select: { limiteWhatsApps: true }
      });

      res.json({
        sucesso: true,
        instancias: instancias,
        limite: {
          limite: conta?.limiteWhatsApps || 2,
          usado: instancias.length,
          disponivel: (conta?.limiteWhatsApps || 2) - instancias.length
        }
      });
    } catch (erro) {
      console.error('❌ Erro ao listar instâncias:', erro);
      res.status(500).json({ sucesso: false, erro: erro.message });
    }
  }

  async obterDetalhesInstancia(req, res) {
    try {
      const { instancia } = req.params;
      const { contaId } = req.usuario;

      const conexao = await prisma.conexaoWhatsApp.findFirst({
        where: {
          contaId: contaId,
          instancia: parseInt(instancia)
        }
      });

      if (!conexao) {
        return res.status(404).json({
          sucesso: false,
          erro: 'Instância não encontrada'
        });
      }

      res.json({
        sucesso: true,
        instancia: conexao
      });
    } catch (erro) {
      console.error('❌ Erro ao obter detalhes:', erro);
      res.status(500).json({ sucesso: false, erro: erro.message });
    }
  }

  async atualizarInstancia(req, res) {
    try {
      const { instancia } = req.params;
      const { nomeInstancia, corIdentificacao } = req.body;
      const { contaId } = req.usuario;

      const conexao = await prisma.conexaoWhatsApp.findFirst({
        where: {
          contaId: contaId,
          instancia: parseInt(instancia)
        }
      });

      if (!conexao) {
        return res.status(404).json({
          sucesso: false,
          erro: 'Instância não encontrada'
        });
      }

      const atualizada = await prisma.conexaoWhatsApp.update({
        where: { id: conexao.id },
        data: {
          nomeInstancia: nomeInstancia || conexao.nomeInstancia,
          corIdentificacao: corIdentificacao || conexao.corIdentificacao
        }
      });

      res.json({
        sucesso: true,
        instancia: atualizada,
        mensagem: 'Instância atualizada'
      });
    } catch (erro) {
      console.error('❌ Erro ao atualizar instância:', erro);
      res.status(500).json({ sucesso: false, erro: erro.message });
    }
  }

  async deletarInstancia(req, res) {
    try {
      const { instancia } = req.params;
      const { contaId } = req.usuario;

      const conexao = await prisma.conexaoWhatsApp.findFirst({
        where: {
          contaId: contaId,
          instancia: parseInt(instancia)
        }
      });

      if (!conexao) {
        return res.status(404).json({
          sucesso: false,
          erro: 'Instância não encontrada'
        });
      }

      if (conexao.instancia === 1) {
        return res.status(400).json({
          sucesso: false,
          erro: 'Não é possível deletar a instância oficial'
        });
      }

      if (conexao.tipoParceiro === 'BAILEYS') {
        await baileysServico.desconectar(contaId, parseInt(instancia));
      }

      await prisma.conexaoWhatsApp.delete({
        where: { id: conexao.id }
      });

      res.json({
        sucesso: true,
        mensagem: 'Instância deletada'
      });
    } catch (erro) {
      console.error('❌ Erro ao deletar instância:', erro);
      res.status(500).json({ sucesso: false, erro: erro.message });
    }
  }

  async obterLimite(req, res) {
    try {
      const { contaId } = req.usuario;

      const conta = await prisma.conta.findUnique({
        where: { id: contaId },
        select: { limiteWhatsApps: true }
      });

      const totalInstancias = await prisma.conexaoWhatsApp.count({
        where: { contaId: contaId }
      });

      res.json({
        sucesso: true,
        limite: conta?.limiteWhatsApps || 2,
        usado: totalInstancias,
        disponivel: (conta?.limiteWhatsApps || 2) - totalInstancias
      });
    } catch (erro) {
      console.error('❌ Erro ao obter limite:', erro);
      res.status(500).json({ sucesso: false, erro: erro.message });
    }
  }

  async obterDashboard(req, res) {
    try {
      const { contaId } = req.usuario;

      const [conexoes, conversas, mensagensHoje] = await Promise.all([
        prisma.conexaoWhatsApp.count({ where: { contaId: contaId, status: 'CONECTADO' } }),
        prisma.conversa.count({ where: { contaId: contaId } }),
        prisma.mensagem.count({
          where: {
            contaId: contaId,
            timestamp: { gte: new Date(new Date().setHours(0, 0, 0, 0)) }
          }
        })
      ]);

      res.json({
        sucesso: true,
        dashboard: {
          conexoesAtivas: conexoes,
          totalConversas: conversas,
          mensagensHoje: mensagensHoje
        }
      });
    } catch (erro) {
      console.error('❌ Erro ao obter dashboard:', erro);
      res.status(500).json({ sucesso: false, erro: erro.message });
    }
  }

  async obterEstatisticas(req, res) {
    try {
      const { contaId } = req.usuario;

      const [
        totalConversas,
        conversasAtivas,
        mensagensHoje,
        mensagensTotal
      ] = await Promise.all([
        prisma.conversa.count({ where: { contaId: contaId } }),
        prisma.conversa.count({
          where: {
            contaId: contaId,
            statusConversa: 'CAIXA_ENTRADA'
          }
        }),
        prisma.mensagem.count({
          where: {
            contaId: contaId,
            timestamp: { gte: new Date(new Date().setHours(0, 0, 0, 0)) }
          }
        }),
        prisma.mensagem.count({ where: { contaId: contaId } })
      ]);

      res.json({
        sucesso: true,
        estatisticas: {
          totalConversas,
          totalConversasAtivas: conversasAtivas,
          totalMensagensHoje: mensagensHoje,
          tempoMedioResposta: 0,
          taxaResposta: 0
        }
      });
    } catch (erro) {
      console.error('❌ Erro ao obter estatísticas:', erro);
      res.status(500).json({ sucesso: false, erro: erro.message });
    }
  }

  // ============================================
  // MENSAGENS (continuação no próximo bloco)
  // ============================================

  async enviarMensagem(req, res) {
    try {
      const { numero, mensagem, quotedMsgId, formatacoes, instancia } = req.body;
      const { contaId } = req.usuario;

      if (!numero || !mensagem) {
        return res.status(400).json({
          sucesso: false,
          erro: 'Número e mensagem são obrigatórios'
        });
      }

      const conexao = await prisma.conexaoWhatsApp.findFirst({
        where: {
          contaId: contaId,
          status: 'CONECTADO',
          ...(instancia && { instancia: parseInt(instancia) })
        },
        orderBy: { atualizadoEm: 'desc' }
      });

      if (!conexao) {
        return res.status(400).json({
          sucesso: false,
          erro: 'Nenhum WhatsApp conectado'
        });
      }

      let textoFinal = mensagem;
      if (formatacoes && Array.isArray(formatacoes)) {
        textoFinal = whatsappService.aplicarFormatacao(mensagem, formatacoes);
      }

      const resultado = await whatsappService.enviarTexto(numero, textoFinal, quotedMsgId);

      if (!resultado.success) {
        throw new Error('Falha ao enviar mensagem');
      }

      let conversa = await prisma.conversa.findFirst({
        where: {
          numeroCliente: numero,
          conexaoWhatsAppId: conexao.id
        }
      });

      if (!conversa) {
        conversa = await prisma.conversa.create({
          data: {
            numeroCliente: numero,
            nomeContato: numero,
            contaId: contaId,
            conexaoWhatsAppId: conexao.id,
            statusConversa: 'CAIXA_ENTRADA'
          }
        });
      }

      const mensagemSalva = await prisma.mensagem.create({
        data: {
          whatsappId: resultado.messageId,
          conversaId: conversa.id,
          contaId: contaId,
          conteudo: textoFinal,
          tipo: 'TEXTO',
          direcao: 'ENVIADA',
          statusMensagem: 'ENVIADA',
          enviadaPor: req.usuario.id,
          timestamp: new Date(),
          enviadaEm: new Date(),
          lida: true,
          ...(quotedMsgId && { replyParaId: quotedMsgId })
        }
      });

      await prisma.conversa.update({
        where: { id: conversa.id },
        data: { ultimaMensagemEm: new Date() }
      });

      res.json({
        sucesso: true,
        mensagemId: mensagemSalva.id,
        whatsappId: resultado.messageId,
        mensagem: 'Mensagem enviada com sucesso'
      });
    } catch (erro) {
      console.error('❌ Erro ao enviar mensagem:', erro);
      res.status(500).json({ sucesso: false, erro: erro.message });
    }
  }

  async enviarReacao(req, res) {
    try {
      const { numero, mensagemId, reacao } = req.body;
      const { contaId } = req.usuario;

      const resultado = await whatsappService.enviarReacao(numero, mensagemId, reacao);

      if (!resultado.success) {
        throw new Error('Falha ao enviar reação');
      }

      res.json({
        sucesso: true,
        mensagem: 'Reação enviada'
      });
    } catch (erro) {
      console.error('❌ Erro ao enviar reação:', erro);
      res.status(500).json({ sucesso: false, erro: erro.message });
    }
  }

  async enviarMidia(req, res) {
    try {
      const { numero, legenda, tipo } = req.body;
      const { contaId } = req.usuario;

      if (!req.file) {
        return res.status(400).json({
          sucesso: false,
          erro: 'Nenhum arquivo enviado'
        });
      }

      const caminhoArquivo = req.file.path;
      let resultado;

      switch (tipo) {
        case 'imagem':
          resultado = await whatsappService.enviarImagem(numero, caminhoArquivo, legenda);
          break;
        case 'documento':
          resultado = await whatsappService.enviarDocumento(numero, caminhoArquivo, req.file.originalname, legenda);
          break;
        case 'audio':
          resultado = await whatsappService.enviarAudio(numero, caminhoArquivo);
          break;
        default:
          throw new Error('Tipo de mídia não suportado');
      }

      await fs.unlink(caminhoArquivo);

      res.json({
        sucesso: true,
        mensagemId: resultado.messageId,
        mensagem: 'Mídia enviada com sucesso'
      });
    } catch (erro) {
      console.error('❌ Erro ao enviar mídia:', erro);
      res.status(500).json({ sucesso: false, erro: erro.message });
    }
  }

  async obterMensagensConversa(req, res) {
    try {
      const { numeroCliente } = req.params;
      const { limite = 50, offset = 0 } = req.query;
      const { contaId } = req.usuario;

      const conversa = await prisma.conversa.findFirst({
        where: {
          numeroCliente: numeroCliente,
          contaId: contaId
        }
      });

      if (!conversa) {
        return res.json({
          sucesso: true,
          mensagens: [],
          temMais: false,
          total: 0
        });
      }

      const mensagens = await prisma.mensagem.findMany({
        where: { conversaId: conversa.id },
        orderBy: { enviadaEm: 'asc' },
        skip: parseInt(offset),
        take: parseInt(limite)
      });

      const total = await prisma.mensagem.count({
        where: { conversaId: conversa.id }
      });

      res.json({
        sucesso: true,
        mensagens: mensagens,
        temMais: (parseInt(offset) + parseInt(limite)) < total,
        total: total
      });
    } catch (erro) {
      console.error('❌ Erro ao obter mensagens:', erro);
      res.status(500).json({ sucesso: false, erro: erro.message });
    }
  }

  async buscarMensagensConversa(req, res) {
    try {
      const { numeroCliente } = req.params;
      const { termo } = req.query;
      const { contaId } = req.usuario;

      const conversa = await prisma.conversa.findFirst({
        where: {
          numeroCliente: numeroCliente,
          contaId: contaId
        }
      });

      if (!conversa) {
        return res.json({
          sucesso: true,
          mensagens: []
        });
      }

      const mensagens = await prisma.mensagem.findMany({
        where: {
          conversaId: conversa.id,
          conteudo: {
            contains: termo,
            mode: 'insensitive'
          }
        },
        orderBy: { enviadaEm: 'desc' },
        take: 50
      });

      res.json({
        sucesso: true,
        mensagens: mensagens
      });
    } catch (erro) {
      console.error('❌ Erro ao buscar mensagens:', erro);
      res.status(500).json({ sucesso: false, erro: erro.message });
    }
  }

  async obterEstatisticasMensagens(req, res) {
    try {
      const { contaId } = req.usuario;

      const [enviadas, recebidas] = await Promise.all([
        prisma.mensagem.count({
          where: { contaId: contaId, direcao: 'ENVIADA' }
        }),
        prisma.mensagem.count({
          where: { contaId: contaId, direcao: 'RECEBIDA' }
        })
      ]);

      res.json({
        sucesso: true,
        estatisticas: {
          enviadas,
          recebidas,
          total: enviadas + recebidas
        }
      });
    } catch (erro) {
      console.error('❌ Erro ao obter estatísticas:', erro);
      res.status(500).json({ sucesso: false, erro: erro.message });
    }
  }

  async deletarMensagem(req, res) {
    try {
      const { mensagemId } = req.params;
      const { contaId } = req.usuario;

      const mensagem = await prisma.mensagem.findFirst({
        where: {
          id: mensagemId,
          contaId: contaId
        }
      });

      if (!mensagem) {
        return res.status(404).json({
          sucesso: false,
          erro: 'Mensagem não encontrada'
        });
      }

      await prisma.mensagem.delete({
        where: { id: mensagemId }
      });

      res.json({
        sucesso: true,
        mensagem: 'Mensagem deletada'
      });
    } catch (erro) {
      console.error('❌ Erro ao deletar mensagem:', erro);
      res.status(500).json({ sucesso: false, erro: erro.message });
    }
  }

  async fixarMensagem(req, res) {
    try {
      const { mensagemId } = req.params;
      const { contaId } = req.usuario;

      const mensagem = await prisma.mensagem.findFirst({
        where: {
          id: mensagemId,
          contaId: contaId
        }
      });

      if (!mensagem) {
        return res.status(404).json({
          sucesso: false,
          erro: 'Mensagem não encontrada'
        });
      }

      await prisma.mensagem.update({
        where: { id: mensagemId },
        data: {
          fixada: true,
          fixadaEm: new Date(),
          fixadaPor: req.usuario.id
        }
      });

      res.json({
        sucesso: true,
        mensagem: 'Mensagem fixada'
      });
    } catch (erro) {
      console.error('❌ Erro ao fixar mensagem:', erro);
      res.status(500).json({ sucesso: false, erro: erro.message });
    }
  }

  async desafixarMensagem(req, res) {
    try {
      const { mensagemId } = req.params;
      const { contaId } = req.usuario;

      const mensagem = await prisma.mensagem.findFirst({
        where: {
          id: mensagemId,
          contaId: contaId
        }
      });

      if (!mensagem) {
        return res.status(404).json({
          sucesso: false,
          erro: 'Mensagem não encontrada'
        });
      }

      await prisma.mensagem.update({
        where: { id: mensagemId },
        data: {
          fixada: false,
          fixadaEm: null,
          fixadaPor: null
        }
      });

      res.json({
        sucesso: true,
        mensagem: 'Mensagem desafixada'
      });
    } catch (erro) {
      console.error('❌ Erro ao desafixar mensagem:', erro);
      res.status(500).json({ sucesso: false, erro: erro.message });
    }
  }

  async obterFotoContato(req, res) {
    try {
      const { numero } = req.params;
      const { contaId } = req.usuario;

      const conversa = await prisma.conversa.findFirst({
        where: {
          numeroCliente: numero,
          contaId: contaId
        }
      });

      res.json({
        sucesso: true,
        fotoPerfil: conversa?.fotoUrl || conversa?.foto_perfil || null
      });
    } catch (erro) {
      console.error('❌ Erro ao obter foto:', erro);
      res.status(500).json({ sucesso: false, erro: erro.message });
    }
  }

  // ============================================
  // CONVERSAS
  // ============================================

  async obterConversas(req, res) {
    try {
      const { contaId } = req.usuario;
      const { filtro = 'TODAS' } = req.query;

      let where = { contaId: contaId };

      if (filtro === 'NAO_LIDAS') {
        where.naoLidas = { gt: 0 };
      } else if (filtro === 'FAVORITAS') {
        where.favorita = true;
      } else if (filtro === 'ARQUIVADAS') {
        where.arquivada = true;
      }

      const conversas = await prisma.conversa.findMany({
        where,
        include: {
          mensagens: {
            orderBy: { enviadaEm: 'desc' },
            take: 1
          },
          conexaoWhatsApp: true
        },
        orderBy: { ultimaMensagemEm: 'desc' }
      });

      res.json({
        sucesso: true,
        conversas: conversas
      });
    } catch (erro) {
      console.error('❌ Erro ao obter conversas:', erro);
      res.status(500).json({ sucesso: false, erro: erro.message });
    }
  }

  async buscarConversas(req, res) {
    try {
      const { termo } = req.query;
      const { contaId } = req.usuario;

      const conversas = await prisma.conversa.findMany({
        where: {
          contaId: contaId,
          OR: [
            { nomeContato: { contains: termo, mode: 'insensitive' } },
            { numeroCliente: { contains: termo } }
          ]
        },
        include: {
          mensagens: {
            orderBy: { enviadaEm: 'desc' },
            take: 1
          }
        }
      });

      res.json({
        sucesso: true,
        conversas: conversas
      });
    } catch (erro) {
      console.error('❌ Erro ao buscar conversas:', erro);
      res.status(500).json({ sucesso: false, erro: erro.message });
    }
  }

  async atualizarStatusConversa(req, res) {
    try {
      const { numeroCliente } = req.params;
      const { status } = req.body;
      const { contaId } = req.usuario;

      const conversa = await prisma.conversa.findFirst({
        where: {
          numeroCliente: numeroCliente,
          contaId: contaId
        }
      });

      if (!conversa) {
        return res.status(404).json({
          sucesso: false,
          erro: 'Conversa não encontrada'
        });
      }

      await prisma.conversa.update({
        where: { id: conversa.id },
        data: { statusConversa: status }
      });

      res.json({
        sucesso: true,
        mensagem: 'Status atualizado'
      });
    } catch (erro) {
      console.error('❌ Erro ao atualizar status:', erro);
      res.status(500).json({ sucesso: false, erro: erro.message });
    }
  }

  async marcarComoLida(req, res) {
    try {
      const { numeroCliente } = req.params;
      const { contaId } = req.usuario;

      const conversa = await prisma.conversa.findFirst({
        where: {
          numeroCliente: numeroCliente,
          contaId: contaId
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

      res.json({
        sucesso: true,
        mensagem: 'Conversa marcada como lida'
      });
    } catch (erro) {
      console.error('❌ Erro ao marcar como lida:', erro);
      res.status(500).json({ sucesso: false, erro: erro.message });
    }
  }

  async toggleFixarConversa(req, res) {
    try {
      const { numeroCliente } = req.params;
      const { contaId } = req.usuario;

      const conversa = await prisma.conversa.findFirst({
        where: {
          numeroCliente: numeroCliente,
          contaId: contaId
        }
      });

      if (!conversa) {
        return res.status(404).json({
          sucesso: false,
          erro: 'Conversa não encontrada'
        });
      }

      await prisma.conversa.update({
        where: { id: conversa.id },
        data: { fixada: !conversa.fixada }
      });

      res.json({
        sucesso: true,
        mensagem: conversa.fixada ? 'Conversa desfixada' : 'Conversa fixada'
      });
    } catch (erro) {
      console.error('❌ Erro ao fixar conversa:', erro);
      res.status(500).json({ sucesso: false, erro: erro.message });
    }
  }

  async toggleFavoritar(req, res) {
    try {
      const { numeroCliente } = req.params;
      const { contaId } = req.usuario;

      const conversa = await prisma.conversa.findFirst({
        where: {
          numeroCliente: numeroCliente,
          contaId: contaId
        }
      });

      if (!conversa) {
        return res.status(404).json({
          sucesso: false,
          erro: 'Conversa não encontrada'
        });
      }

      await prisma.conversa.update({
        where: { id: conversa.id },
        data: { favorita: !conversa.favorita }
      });

      res.json({
        sucesso: true,
        mensagem: conversa.favorita ? 'Removida dos favoritos' : 'Adicionada aos favoritos'
      });
    } catch (erro) {
      console.error('❌ Erro ao favoritar:', erro);
      res.status(500).json({ sucesso: false, erro: erro.message });
    }
  }

  async marcarComoNaoLida(req, res) {
    try {
      const { numeroCliente } = req.params;
      const { contaId } = req.usuario;

      const conversa = await prisma.conversa.findFirst({
        where: {
          numeroCliente: numeroCliente,
          contaId: contaId
        }
      });

      if (!conversa) {
        return res.status(404).json({
          sucesso: false,
          erro: 'Conversa não encontrada'
        });
      }

      const ultimaMensagemRecebida = await prisma.mensagem.findFirst({
        where: {
          conversaId: conversa.id,
          direcao: 'RECEBIDA'
        },
        orderBy: { enviadaEm: 'desc' }
      });

      if (ultimaMensagemRecebida) {
        await prisma.mensagem.update({
          where: { id: ultimaMensagemRecebida.id },
          data: { lida: false }
        });
      }

      res.json({
        sucesso: true,
        mensagem: 'Conversa marcada como não lida'
      });
    } catch (erro) {
      console.error('❌ Erro ao marcar como não lida:', erro);
      res.status(500).json({ sucesso: false, erro: erro.message });
    }
  }

  async arquivarConversa(req, res) {
    try {
      const { numeroCliente } = req.params;
      const { contaId } = req.usuario;

      const conversa = await prisma.conversa.findFirst({
        where: {
          numeroCliente: numeroCliente,
          contaId: contaId
        }
      });

      if (!conversa) {
        return res.status(404).json({
          sucesso: false,
          erro: 'Conversa não encontrada'
        });
      }

      await prisma.conversa.update({
        where: { id: conversa.id },
        data: {
          arquivada: true,
          dataArquivamento: new Date()
        }
      });

      res.json({
        sucesso: true,
        mensagem: 'Conversa arquivada'
      });
    } catch (erro) {
      console.error('❌ Erro ao arquivar:', erro);
      res.status(500).json({ sucesso: false, erro: erro.message });
    }
  }

  async desarquivarConversa(req, res) {
    try {
      const { numeroCliente } = req.params;
      const { contaId } = req.usuario;

      const conversa = await prisma.conversa.findFirst({
        where: {
          numeroCliente: numeroCliente,
          contaId: contaId
        }
      });

      if (!conversa) {
        return res.status(404).json({
          sucesso: false,
          erro: 'Conversa não encontrada'
        });
      }

      await prisma.conversa.update({
        where: { id: conversa.id },
        data: {
          arquivada: false,
          dataArquivamento: null
        }
      });

      res.json({
        sucesso: true,
        mensagem: 'Conversa desarquivada'
      });
    } catch (erro) {
      console.error('❌ Erro ao desarquivar:', erro);
      res.status(500).json({ sucesso: false, erro: erro.message });
    }
  }

  async atribuirConversa(req, res) {
    try {
      const { numeroCliente } = req.params;
      const { usuarioId, setorId } = req.body;
      const { contaId } = req.usuario;

      const conversa = await prisma.conversa.findFirst({
        where: {
          numeroCliente: numeroCliente,
          contaId: contaId
        }
      });

      if (!conversa) {
        return res.status(404).json({
          sucesso: false,
          erro: 'Conversa não encontrada'
        });
      }

      await prisma.conversa.update({
        where: { id: conversa.id },
        data: {
          usuarioResponsavelId: usuarioId || null
        }
      });

      if (setorId) {
        await prisma.conversaAtribuida.upsert({
          where: {
            conversaId_setorId: {
              conversaId: conversa.id,
              setorId: setorId
            }
          },
          create: {
            conversaId: conversa.id,
            setorId: setorId
          },
          update: {}
        });
      }

      res.json({
        sucesso: true,
        mensagem: 'Conversa atribuída'
      });
    } catch (erro) {
      console.error('❌ Erro ao atribuir:', erro);
      res.status(500).json({ sucesso: false, erro: erro.message });
    }
  }

  // ============================================
  // ANOTAÇÕES
  // ============================================

  async criarAnotacao(req, res) {
    try {
      const { numeroCliente } = req.params;
      const { conteudo, cor } = req.body;
      const { contaId } = req.usuario;

      const conversa = await prisma.conversa.findFirst({
        where: {
          numeroCliente: numeroCliente,
          contaId: contaId
        }
      });

      if (!conversa) {
        return res.status(404).json({
          sucesso: false,
          erro: 'Conversa não encontrada'
        });
      }

      const anotacao = await prisma.anotacao.create({
        data: {
          conteudo: conteudo,
          cor: cor || 'amarelo',
          conversaId: conversa.id,
          usuarioId: req.usuario.id
        }
      });

      res.json({
        sucesso: true,
        anotacao: anotacao,
        mensagem: 'Anotação criada'
      });
    } catch (erro) {
      console.error('❌ Erro ao criar anotação:', erro);
      res.status(500).json({ sucesso: false, erro: erro.message });
    }
  }

  async listarAnotacoes(req, res) {
    try {
      const { numeroCliente } = req.params;
      const { contaId } = req.usuario;

      const conversa = await prisma.conversa.findFirst({
        where: {
          numeroCliente: numeroCliente,
          contaId: contaId
        }
      });

      if (!conversa) {
        return res.json({
          sucesso: true,
          anotacoes: []
        });
      }

      const anotacoes = await prisma.anotacao.findMany({
        where: {
          conversaId: conversa.id,
          apagada: false
        },
        include: {
          usuario: {
            select: {
              id: true,
              nome: true,
              foto_perfil: true
            }
          }
        },
        orderBy: { criadaEm: 'desc' }
      });

      res.json({
        sucesso: true,
        anotacoes: anotacoes
      });
    } catch (erro) {
      console.error('❌ Erro ao listar anotações:', erro);
      res.status(500).json({ sucesso: false, erro: erro.message });
    }
  }

  async atualizarAnotacao(req, res) {
    try {
      const { anotacaoId } = req.params;
      const { conteudo, cor } = req.body;
      const { contaId } = req.usuario;

      const anotacao = await prisma.anotacao.findFirst({
        where: {
          id: anotacaoId,
          conversa: { contaId: contaId }
        }
      });

      if (!anotacao) {
        return res.status(404).json({
          sucesso: false,
          erro: 'Anotação não encontrada'
        });
      }

      const atualizada = await prisma.anotacao.update({
        where: { id: anotacaoId },
        data: {
          conteudo: conteudo || anotacao.conteudo,
          cor: cor || anotacao.cor
        }
      });

      res.json({
        sucesso: true,
        anotacao: atualizada,
        mensagem: 'Anotação atualizada'
      });
    } catch (erro) {
      console.error('❌ Erro ao atualizar anotação:', erro);
      res.status(500).json({ sucesso: false, erro: erro.message });
    }
  }

  async deletarAnotacao(req, res) {
    try {
      const { anotacaoId } = req.params;
      const { contaId } = req.usuario;

      const anotacao = await prisma.anotacao.findFirst({
        where: {
          id: anotacaoId,
          conversa: { contaId: contaId }
        }
      });

      if (!anotacao) {
        return res.status(404).json({
          sucesso: false,
          erro: 'Anotação não encontrada'
        });
      }

      await prisma.anotacao.update({
        where: { id: anotacaoId },
        data: {
          apagada: true,
          apagadaEm: new Date(),
          apagadaPor: req.usuario.id
        }
      });

      res.json({
        sucesso: true,
        mensagem: 'Anotação deletada'
      });
    } catch (erro) {
      console.error('❌ Erro ao deletar anotação:', erro);
      res.status(500).json({ sucesso: false, erro: erro.message });
    }
  }

  // ============================================
  // SINCRONIZAÇÃO
  // ============================================

  async sincronizarHistorico(req, res) {
    try {
      res.json({
        sucesso: true,
        mensagem: 'Sincronização não implementada para WhatsApp Business API'
      });
    } catch (erro) {
      console.error('❌ Erro ao sincronizar:', erro);
      res.status(500).json({ sucesso: false, erro: erro.message });
    }
  }

  async sincronizarHistoricoCompleto(req, res) {
    try {
      res.json({
        sucesso: true,
        mensagem: 'Sincronização completa não implementada'
      });
    } catch (erro) {
      console.error('❌ Erro:', erro);
      res.status(500).json({ sucesso: false, erro: erro.message });
    }
  }

  async sincronizarConversaEspecifica(req, res) {
    try {
      res.json({
        sucesso: true,
        mensagem: 'Sincronização específica não implementada'
      });
    } catch (erro) {
      console.error('❌ Erro:', erro);
      res.status(500).json({ sucesso: false, erro: erro.message });
    }
  }

  async criarEventoSistema(req, res) {
    try {
      const { numeroCliente } = req.params;
      const { tipo, descricao } = req.body;
      const { contaId } = req.usuario;

      const conversa = await prisma.conversa.findFirst({
        where: {
          numeroCliente: numeroCliente,
          contaId: contaId
        }
      });

      if (!conversa) {
        return res.status(404).json({
          sucesso: false,
          erro: 'Conversa não encontrada'
        });
      }

      const evento = await prisma.mensagem.create({
        data: {
          conversaId: conversa.id,
          contaId: contaId,
          tipo: 'SISTEMA',
          eventoTipo: tipo,
          conteudo: descricao,
          direcao: 'SISTEMA',
          enviadaPor: 'SISTEMA',
          timestamp: new Date(),
          enviadaEm: new Date()
        }
      });

      res.json({
        sucesso: true,
        evento: evento,
        mensagem: 'Evento criado'
      });
    } catch (erro) {
      console.error('❌ Erro ao criar evento:', erro);
      res.status(500).json({ sucesso: false, erro: erro.message });
    }
  }
}

module.exports = new WhatsAppControlador();