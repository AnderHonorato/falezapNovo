// backend/src/controladores/Whatsapp/mensagens.controlador.js
// 🚀 VERSÃO CORRIGIDA - SOCKET.IO FUNCIONANDO

const whatsappOfficial = require('../../servicos/whatsappOfficial.servico');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class MensagensController {
  
  static async enviarMensagem(req, res) {
    try {
      console.log('\n📤 [ENVIAR MENSAGEM] =====================================');
      console.log('📦 Body recebido:', JSON.stringify(req.body, null, 2));
      console.log('👤 Usuário:', {
        id: req.usuario?.id,
        nome: req.usuario?.nome,
        contaId: req.usuario?.contaId
      });

      const { numero, mensagem, quotedMsgId } = req.body;
      const contaId = req.usuario?.contaId;
      const usuarioId = req.usuario?.id;

      // ✅ Validações básicas
      if (!contaId) {
        console.log('❌ Conta não identificada');
        return res.status(400).json({
          sucesso: false,
          erro: 'Conta não identificada. Faça login novamente.'
        });
      }

      if (!numero || !mensagem) {
        console.log('❌ Dados incompletos:', { numero: !!numero, mensagem: !!mensagem });
        return res.status(400).json({
          sucesso: false,
          erro: 'Número e mensagem são obrigatórios'
        });
      }

      console.log('✅ Validações passadas');
      console.log('📤 Enviando mensagem via API Oficial do WhatsApp...');

      // 🚀 ENVIAR PELA API OFICIAL
      const resultado = await whatsappOfficial.enviarTexto(
        numero,
        mensagem,
        quotedMsgId
      );

      if (!resultado.success) {
        console.error('❌ Falha no envio pela API');
        return res.status(500).json({
          sucesso: false,
          erro: 'Erro ao enviar mensagem pelo WhatsApp'
        });
      }

      console.log('✅ Mensagem enviada pela API:', resultado.messageId);

      // ✅ Buscar conexão para salvar no banco
      const conexao = await prisma.conexaoWhatsApp.findFirst({
        where: { 
          contaId: contaId,
          status: 'CONECTADO'
        },
        orderBy: { atualizadoEm: 'desc' }
      });

      if (!conexao) {
        console.warn('⚠️ Nenhuma conexão encontrada para salvar');
        return res.json({
          sucesso: true,
          ...resultado,
          aviso: 'Mensagem enviada mas não foi possível salvar no banco'
        });
      }

      // ✅ BUSCAR OU CRIAR CONVERSA PRIMEIRO
      let conversa = await prisma.conversa.findFirst({
        where: {
          contaId: contaId,
          numeroCliente: numero
        }
      });

      if (!conversa) {
        conversa = await prisma.conversa.create({
          data: {
            contaId: contaId,
            numeroCliente: numero,
            nomeCliente: numero,
            conexaoWhatsAppId: conexao.id,
            statusConversa: 'CAIXA_ENTRADA',
            naoLidas: 0
          }
        });
        console.log('✅ Nova conversa criada:', conversa.id);
      }

      // ✅ SALVAR NO BANCO (agora com conversaId)
      const mensagemSalva = await prisma.mensagem.create({
        data: {
          whatsappId: resultado.key.id,
          conversaId: conversa.id,
          contaId: contaId,
          
          // Conteúdo
          conteudo: mensagem,
          
          // ✅ DIREÇÃO CORRETA
          direcao: 'ENVIADA',
          
          // Metadados
          tipo: 'TEXTO',
          statusMensagem: 'ENVIADA',
          enviadaPor: req.usuario?.nome || 'Sistema',
          timestamp: new Date(),
          enviadaEm: new Date(),
          lida: false,
          
          // Citação
          ...(quotedMsgId && { replyParaId: quotedMsgId }),
          
          // Usuário
          usuarioId: usuarioId
        }
      });

      console.log('✅ Mensagem salva no banco:', mensagemSalva.id);

      // ✅ Atualizar conversa com última mensagem
      const conversaAtualizada = await prisma.conversa.update({
        where: { id: conversa.id },
        data: {
          ultimaMensagemEm: new Date()
        }
      });

      // ✅ EMITIR VIA SOCKET.IO - ESTRUTURA CORRETA
      const io = global.io;
      if (io) {
        const salaContaId = `conta:${contaId}`;
        
        const payload = {
          mensagem: {
            id: mensagemSalva.id,
            whatsappId: mensagemSalva.whatsappId,
            conversaId: mensagemSalva.conversaId,
            conteudo: mensagemSalva.conteudo,
            tipo: mensagemSalva.tipo,
            direcao: mensagemSalva.direcao,
            statusMensagem: mensagemSalva.statusMensagem,
            timestamp: mensagemSalva.timestamp,
            enviadaEm: mensagemSalva.enviadaEm,
            enviadaPor: mensagemSalva.enviadaPor,
            lida: mensagemSalva.lida,
            usuarioId: mensagemSalva.usuarioId,
            criadaEm: mensagemSalva.criadaEm
          },
          conversa: {
            id: conversa.id,
            numeroCliente: conversa.numeroCliente,
            nomeCliente: conversa.nomeCliente,
            ultimaMensagemEm: conversaAtualizada.ultimaMensagemEm,
            naoLidas: conversa.naoLidas,
            statusConversa: conversa.statusConversa,
            contaId: conversa.contaId
          }
        };

        console.log('📤 Emitindo nova_mensagem para:', salaContaId);
        console.log('📦 Payload:', JSON.stringify(payload, null, 2));
        
        io.to(salaContaId).emit('nova_mensagem', payload);
        
        console.log('✅ Evento emitido com sucesso!');
      } else {
        console.error('❌ Socket.IO não disponível (global.io)');
      }

      console.log('======================================================\n');

      // ✅ RETORNAR RESPOSTA COMPLETA
      res.json({ 
        sucesso: true,
        mensagem: {
          id: mensagemSalva.id,
          whatsappId: mensagemSalva.whatsappId,
          conversaId: mensagemSalva.conversaId,
          conteudo: mensagemSalva.conteudo,
          tipo: mensagemSalva.tipo,
          direcao: mensagemSalva.direcao,
          statusMensagem: mensagemSalva.statusMensagem,
          timestamp: mensagemSalva.timestamp,
          enviadaEm: mensagemSalva.enviadaEm,
          enviadaPor: mensagemSalva.enviadaPor,
          lida: mensagemSalva.lida,
          usuarioId: mensagemSalva.usuarioId,
          criadaEm: mensagemSalva.criadaEm
        },
        conversa: {
          id: conversa.id,
          numeroCliente: conversa.numeroCliente,
          nomeCliente: conversa.nomeCliente,
          ultimaMensagemEm: conversaAtualizada.ultimaMensagemEm
        }
      });

    } catch (erro) {
      console.error('❌ ERRO AO ENVIAR MENSAGEM:', erro);
      console.error('Stack:', erro.stack);
      console.log('======================================================\n');
      
      res.status(500).json({
        sucesso: false,
        erro: 'Erro ao enviar mensagem',
        detalhes: erro.message
      });
    }
  }

  static async enviarReacao(req, res) {
    try {
      const { numero, mensagemId, emoji } = req.body;
      const contaId = req.usuario?.contaId;

      console.log('👍 Enviando reação:', { contaId, numero, emoji });
      
      if (!contaId || !numero || !mensagemId || !emoji) {
        return res.status(400).json({
          sucesso: false,
          erro: 'Dados incompletos'
        });
      }

      // 🚀 ENVIAR PELA API OFICIAL
      const resultado = await whatsappOfficial.enviarReacao(
        numero,
        mensagemId,
        emoji
      );

      if (!resultado.success) {
        return res.status(500).json({
          sucesso: false,
          erro: 'Erro ao enviar reação'
        });
      }

      // ✅ Salvar no banco
      const conexao = await prisma.conexaoWhatsApp.findFirst({
        where: { 
          contaId: contaId,
          status: 'CONECTADO'
        }
      });

      if (conexao) {
        const conversa = await prisma.conversa.findFirst({
          where: {
            contaId: contaId,
            numeroCliente: numero
          }
        });

        if (conversa) {
          await prisma.mensagem.create({
            data: {
              whatsappId: resultado.messageId,
              conversaId: conversa.id,
              contaId: contaId,
              tipo: 'REACAO',
              conteudo: emoji,
              direcao: 'ENVIADA',
              timestamp: new Date(),
              enviadaEm: new Date(),
              reactionToWhatsappId: mensagemId,
              usuarioId: req.usuario?.id
            }
          });
        }
      }

      res.json({
        sucesso: true,
        id: resultado.messageId,
        mensagem: 'Reação enviada'
      });

    } catch (erro) {
      console.error('❌ Erro ao enviar reação:', erro);
      res.status(500).json({
        sucesso: false,
        erro: erro.message
      });
    }
  }

  static async enviarMidia(req, res) {
    try {
      const { numero, legenda } = req.body;
      const contaId = req.usuario?.contaId;
      const arquivo = req.file;
      
      console.log('📎 Enviando mídia:', { contaId, numero });

      if (!contaId || !arquivo) {
        return res.status(400).json({
          sucesso: false,
          erro: 'Dados incompletos'
        });
      }

      const conexao = await prisma.conexaoWhatsApp.findFirst({
        where: { 
          contaId: contaId,
          status: 'CONECTADO'
        }
      });

      if (!conexao) {
        return res.status(400).json({
          sucesso: false,
          erro: 'WhatsApp não conectado'
        });
      }

      let resultado;
      const caminhoArquivo = arquivo.path;

      // 🚀 ENVIAR PELA API OFICIAL baseado no tipo
      if (arquivo.mimetype.startsWith('image/')) {
        resultado = await whatsappOfficial.enviarImagem(numero, caminhoArquivo, legenda);
      } else if (arquivo.mimetype.startsWith('audio/')) {
        resultado = await whatsappOfficial.enviarAudio(numero, caminhoArquivo);
      } else {
        resultado = await whatsappOfficial.enviarDocumento(numero, caminhoArquivo, arquivo.originalname, legenda);
      }

      if (!resultado.success) {
        return res.status(500).json({
          sucesso: false,
          erro: 'Erro ao enviar mídia'
        });
      }

      // ✅ Salvar no banco
      const conversa = await prisma.conversa.findFirst({
        where: {
          contaId: contaId,
          numeroCliente: numero
        }
      });

      if (conversa) {
        await prisma.mensagem.create({
          data: {
            whatsappId: resultado.messageId,
            conversaId: conversa.id,
            contaId: contaId,
            tipo: arquivo.mimetype.split('/')[0].toUpperCase(),
            conteudo: legenda || '[Mídia]',
            direcao: 'ENVIADA',
            timestamp: new Date(),
            enviadaEm: new Date(),
            mediaUrl: `/uploads/${arquivo.filename}`,
            usuarioId: req.usuario?.id
          }
        });
      }

      res.json({
        sucesso: true,
        id: resultado.messageId,
        mensagem: 'Mídia enviada'
      });

    } catch (erro) {
      console.error('❌ Erro ao enviar mídia:', erro);
      res.status(500).json({
        sucesso: false,
        erro: erro.message
      });
    }
  }

  static async obterMensagensConversa(req, res) {
    try {
      const { numeroCliente } = req.params;
      const contaId = req.usuario?.contaId;
      const { limite = 50, offset = 0 } = req.query;

      console.log('📥 Buscando mensagens:', { contaId, numeroCliente, limite, offset });

      if (!contaId) {
        return res.status(400).json({
          sucesso: false,
          erro: 'Conta não identificada'
        });
      }

      // ✅ BUSCAR CONVERSA PRIMEIRO
      const conversa = await prisma.conversa.findFirst({
        where: {
          contaId: contaId,
          numeroCliente: decodeURIComponent(numeroCliente)
        }
      });

      if (!conversa) {
        return res.json({
          sucesso: true,
          mensagens: [],
          total: 0,
          temMais: false
        });
      }

      // ✅ BUSCAR MENSAGENS DA CONVERSA
      const mensagens = await prisma.mensagem.findMany({
        where: {
          conversaId: conversa.id
        },
        orderBy: { timestamp: 'desc' },
        take: parseInt(limite),
        skip: parseInt(offset)
      });

      const total = await prisma.mensagem.count({
        where: {
          conversaId: conversa.id
        }
      });

      console.log(`✅ Encontradas ${mensagens.length} mensagens de ${total} total`);

      return res.json({
        sucesso: true,
        mensagens: mensagens.reverse(), // Inverter para ordem cronológica
        total,
        temMais: (parseInt(offset) + mensagens.length) < total
      });

    } catch (erro) {
      console.error('❌ Erro ao buscar mensagens:', erro);
      return res.status(500).json({
        sucesso: false,
        erro: 'Erro ao buscar mensagens',
        detalhes: erro.message
      });
    }
  }

  static async obterStatusLeitura(req, res) {
    try {
      const { mensagemId } = req.params;
      
      const mensagem = await prisma.mensagem.findUnique({
        where: { id: mensagemId },
        select: {
          statusMensagem: true,
          lida: true,
          lidaEm: true
        }
      });

      res.json({
        sucesso: true,
        status: mensagem.statusMensagem,
        lida: mensagem.lida,
        lidaEm: mensagem.lidaEm
      });
    } catch (erro) {
      res.status(500).json({ sucesso: false, erro: erro.message });
    }
  }

  static async marcarComoLida(req, res) {
    try {
      const { conversaId } = req.params;
      const { contaId } = req.usuario;

      await prisma.mensagem.updateMany({
        where: {
          conversaId: conversaId,
          direcao: 'RECEBIDA',
          lida: false
        },
        data: {
          lida: true,
          lidaEm: new Date(),
          statusMensagem: 'LIDA'
        }
      });

      res.json({ sucesso: true });
    } catch (erro) {
      res.status(500).json({ sucesso: false, erro: erro.message });
    }
  }

  static async fixarMensagem(req, res) {
    try {
      const { numeroCliente, mensagemId } = req.params;
      const { usuarioNome } = req.body;
      const contaId = req.usuario?.contaId;
      
      console.log('📌 Fixando mensagem:', { contaId, numeroCliente, mensagemId });

      if (!contaId) {
        return res.status(400).json({ 
          sucesso: false,
          erro: 'Conta não identificada' 
        });
      }

      const conversa = await prisma.conversa.findFirst({
        where: {
          contaId: contaId,
          numeroCliente: decodeURIComponent(numeroCliente)
        }
      });

      if (!conversa) {
        return res.status(404).json({ 
          sucesso: false,
          erro: 'Conversa não encontrada' 
        });
      }

      await prisma.mensagem.updateMany({
        where: {
          conversaId: conversa.id,
          fixada: true
        },
        data: {
          fixada: false,
          fixadaEm: null,
          fixadaPor: null
        }
      });

      const mensagemFixada = await prisma.mensagem.update({
        where: { id: mensagemId },
        data: {
          fixada: true,
          fixadaEm: new Date(),
          fixadaPor: usuarioNome
        }
      });

      console.log('✅ Mensagem fixada com sucesso');

      res.json({
        sucesso: true,
        mensagem: 'Mensagem fixada',
        fixada: mensagemFixada
      });

    } catch (erro) {
      console.error('❌ Erro ao fixar mensagem:', erro);
      res.status(500).json({
        sucesso: false,
        erro: 'Erro ao fixar mensagem',
        detalhes: erro.message
      });
    }
  }

  static async desafixarMensagem(req, res) {
    try {
      const { numeroCliente } = req.params;
      const contaId = req.usuario?.contaId;
      
      console.log('📌 Desafixando mensagem:', { contaId, numeroCliente });

      if (!contaId) {
        return res.status(400).json({ 
          sucesso: false,
          erro: 'Conta não identificada' 
        });
      }

      const conversa = await prisma.conversa.findFirst({
        where: {
          contaId: contaId,
          numeroCliente: decodeURIComponent(numeroCliente)
        }
      });

      if (!conversa) {
        return res.status(404).json({ 
          sucesso: false,
          erro: 'Conversa não encontrada' 
        });
      }

      await prisma.mensagem.updateMany({
        where: {
          conversaId: conversa.id,
          fixada: true
        },
        data: {
          fixada: false,
          fixadaEm: null,
          fixadaPor: null
        }
      });

      console.log('✅ Mensagem desfixada com sucesso');

      res.json({
        sucesso: true,
        mensagem: 'Mensagem desfixada'
      });

    } catch (erro) {
      console.error('❌ Erro ao desafixar mensagem:', erro);
      res.status(500).json({
        sucesso: false,
        erro: 'Erro ao desafixar mensagem',
        detalhes: erro.message
      });
    }
  }

  static async apagarMensagem(req, res) {
    try {
      const { mensagemId } = req.params;
      const { apagarParaTodos } = req.body;
      const contaId = req.usuario?.contaId;
      const usuarioNome = req.usuario?.nome;

      console.log('🗑️ Apagando mensagem:', { mensagemId, apagarParaTodos });

      if (!contaId) {
        return res.status(400).json({ 
          sucesso: false,
          erro: 'Conta não identificada' 
        });
      }

      const mensagem = await prisma.mensagem.findUnique({
        where: { id: mensagemId },
        include: {
          conversa: {
            select: { numeroCliente: true }
          }
        }
      });

      if (!mensagem) {
        return res.status(404).json({ 
          sucesso: false,
          erro: 'Mensagem não encontrada' 
        });
      }

      const mensagemApagada = await prisma.mensagem.update({
        where: { id: mensagemId },
        data: {
          apagada: true,
          apagadaEm: new Date(),
          apagadaPor: usuarioNome,
          apagadaParaTodos: apagarParaTodos || false,
          conteudo: apagarParaTodos ? 'Mensagem apagada' : mensagem.conteudo
        }
      });

      console.log('✅ Mensagem marcada como apagada');

      res.json({
        sucesso: true,
        mensagem: 'Mensagem apagada',
        dados: mensagemApagada
      });

    } catch (erro) {
      console.error('❌ Erro ao apagar mensagem:', erro);
      res.status(500).json({
        sucesso: false,
        erro: 'Erro ao apagar mensagem',
        detalhes: erro.message
      });
    }
  }

  static async criarEventoSistema(req, res) {
    try {
      const { numeroCliente } = req.params;
      const { eventoTipo } = req.body;
      const contaId = req.usuario?.contaId;
      const usuarioNome = req.usuario?.nome;

      console.log('📋 Criando evento de sistema:', { eventoTipo, contaId, numeroCliente });

      if (!contaId) {
        return res.status(400).json({ 
          sucesso: false,
          erro: 'Conta não identificada' 
        });
      }

      const conversa = await prisma.conversa.findFirst({
        where: {
          contaId: contaId,
          numeroCliente: decodeURIComponent(numeroCliente)
        }
      });

      if (!conversa) {
        return res.status(404).json({ 
          sucesso: false,
          erro: 'Conversa não encontrada' 
        });
      }

      const agora = new Date();
      const dataFormatada = agora.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      let conteudoEvento = '';
      if (eventoTipo === 'CHAMADO_FINALIZADO') {
        conteudoEvento = `Chamado finalizado por ${usuarioNome} em ${dataFormatada}`;
      } else if (eventoTipo === 'CHAMADO_REABERTO') {
        conteudoEvento = `Chamado reaberto por ${usuarioNome} em ${dataFormatada}`;
      }

      const eventoMensagem = await prisma.mensagem.create({
        data: {
          conteudo: conteudoEvento,
          tipo: 'SISTEMA',
          eventoTipo: eventoTipo,
          direcao: 'SISTEMA',
          lida: true,
          statusMensagem: 'sistema',
          conversaId: conversa.id,
          contaId: contaId,
          enviadaEm: agora,
          enviadaPor: 'Sistema',
          timestamp: agora
        }
      });

      console.log('✅ Evento de sistema criado');

      res.json({
        sucesso: true,
        evento: eventoMensagem
      });

    } catch (erro) {
      console.error('❌ Erro ao criar evento de sistema:', erro);
      res.status(500).json({
        sucesso: false,
        erro: 'Erro ao criar evento de sistema',
        detalhes: erro.message
      });
    }
  }
}

module.exports = MensagensController;