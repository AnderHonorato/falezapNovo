// backend/src/controladores/ChatInternoController.js - ✅ CORREÇÃO DE SALA SOCKET (user: vs usuario_)

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const path = require('path');
const fs = require('fs').promises;

class ChatInternoController {
  
  // Listar Conversas (Mantido)
  async listarConversas(req, res) {
    try {
      const { contaId, id: usuarioId } = req.usuario;

      // 1. Identificar todos os contatos com quem houve interação
      const mensagens = await prisma.mensagemChatInterno.findMany({
        where: {
          contaId,
          grupoId: null,
          OR: [
            { remetenteId: usuarioId },
            { destinatarioId: usuarioId }
          ],
          exclusosPara: {
            none: { usuarioId }
          }
        },
        orderBy: { criadaEm: 'desc' },
        select: { 
          remetenteId: true, 
          destinatarioId: true,
          criadaEm: true
        }
      });

      const contatosMap = new Map();
      mensagens.forEach(m => {
        const outroId = m.remetenteId === usuarioId ? m.destinatarioId : m.remetenteId;
        if (outroId && !contatosMap.has(outroId)) {
          contatosMap.set(outroId, m.criadaEm);
        }
      });

      const contatosIds = Array.from(contatosMap.keys());

      // 2. Montar dados de cada conversa
      const conversasPromises = contatosIds.map(async (contatoId) => {
        const contato = await prisma.usuario.findUnique({
          where: { id: contatoId },
          select: { id: true, nome: true, foto_perfil: true, status: true, email: true, nickname: true }
        });

        if (!contato) return null;

        // Buscar a ÚLTIMA mensagem real para o preview
        const ultimaMensagem = await prisma.mensagemChatInterno.findFirst({
          where: {
            contaId,
            grupoId: null,
            OR: [
              { remetenteId: usuarioId, destinatarioId: contatoId },
              { remetenteId: contatoId, destinatarioId: usuarioId }
            ],
            exclusosPara: { none: { usuarioId } }
          },
          orderBy: { criadaEm: 'desc' },
          include: { visualizacoes: { where: { usuarioId: contatoId } } }
        });

        // Contagem de Não Lidas
        const naoLidas = await prisma.mensagemChatInterno.count({
          where: {
            contaId,
            grupoId: null,
            remetenteId: contatoId,
            destinatarioId: usuarioId,
            excluida: false,
            visualizacoes: { none: { usuarioId } }
          }
        });

        // Verificar se é FIXADA
        const favorito = await prisma.favoritoChatInterno.findUnique({
           where: { usuarioId_favoritoId: { usuarioId, favoritoId: contatoId } }
        });

        let statusMensagem = null;
        if (ultimaMensagem && ultimaMensagem.remetenteId === usuarioId) {
            // ✅ CORREÇÃO VISUAL: Checa se há visualização do destinatário
            statusMensagem = ultimaMensagem.visualizacoes.some(v => v.usuarioId === contatoId) ? 'lida' : 'enviada'; 
        }

        return {
          usuarioId: contato.id,
          nome: contato.nome,
          foto_perfil: contato.foto_perfil,
          status: contato.status,
          email: contato.email,
          nickname: contato.nickname,
          ultimaMensagem: ultimaMensagem ? {
             id: ultimaMensagem.id,
             conteudo: ultimaMensagem.conteudo,
             tipo: ultimaMensagem.tipo,
             data: ultimaMensagem.criadaEm,
             remetenteId: ultimaMensagem.remetenteId,
             status: statusMensagem
          } : null,
          naoLidas,
          fixada: !!favorito
        };
      });

      let conversas = (await Promise.all(conversasPromises)).filter(Boolean);

      // Ordenação: Fixadas primeiro, depois por data
      conversas.sort((a, b) => {
        if (a.fixada && !b.fixada) return -1;
        if (!a.fixada && b.fixada) return 1;
        
        const dateA = a.ultimaMensagem?.data ? new Date(a.ultimaMensagem.data) : new Date(0);
        const dateB = b.ultimaMensagem?.data ? new Date(b.ultimaMensagem.data) : new Date(0);
        return dateB - dateA;
      });

      res.json({ conversas });
    } catch (error) {
      console.error('Erro ao listar conversas:', error);
      res.status(500).json({ erro: 'Erro ao listar histórico de conversas.' });
    }
  }

// ✅ Marcar Conversa Inteira como Lida (BULK ACTION)
  async marcarConversaComoLida(req, res) {
    try {
        const { usuarioId: contatoId, grupoId } = req.body;
        const { id: meuId, contaId } = req.usuario;

        let where = {
            contaId,
            excluida: false,
            // A visualização é determinada pela ausência do registro VisualizacaoMensagemChatInterno
            visualizacoes: { none: { usuarioId: meuId } }
        };

        if (grupoId) {
            where.grupoId = grupoId;
            // Para grupos, só queremos as mensagens que não são minhas (que eu enviei)
            where.remetenteId = { not: meuId };
            where.destinatarioId = null; // Ignora mensagens individuais se for grupo
        } else if (contatoId) {
            where.remetenteId = contatoId;
            where.destinatarioId = meuId;
            where.grupoId = null;
        } else {
            return res.status(400).json({ erro: 'ID do contato ou grupo obrigatório' });
        }
        
        // 1. Busca mensagens que não foram visualizadas por mim
        const mensagensNaoLidas = await prisma.mensagemChatInterno.findMany({
            where,
            select: { id: true, remetenteId: true }
        });

        if (mensagensNaoLidas.length === 0) {
            return res.json({ sucesso: true, count: 0 });
        }
        
        // 2. Cria os registros de visualização
        await prisma.visualizacaoMensagemChatInterno.createMany({
            data: mensagensNaoLidas.map(m => ({
                mensagemId: m.id,
                usuarioId: meuId,
                visualizadaEm: new Date()
            })),
            skipDuplicates: true
        });

        // 3. Socket para atualizar UIs (ListaConversas ouvirá este evento para zerar o badge)
        const io = req.app.get('io') || req.io;
        if (io) {
            // Notifica minhas próprias sessões para zerar o contador na lista
            // ✅ CORREÇÃO DE SALA
            io.to(`user:${meuId}`).emit('chat_interno_conversa_lida', { 
                leitorId: meuId,
                conversaId: contatoId || grupoId, // <--- ID correto do item da lista
                ehGrupo: !!grupoId
            });

            if (contatoId) {
                // Notifica o outro usuário (individual) para ver o check azul
                // ✅ CORREÇÃO DE SALA
                io.to(`user:${contatoId}`).emit('chat_interno_conversa_lida', {
                    leitorId: meuId,
                    conversaId: meuId // Enviamos o meuId para que ele atualize as mensagens que ele recebeu de mim
                });
            }
        }

        res.json({ sucesso: true, count: mensagensNaoLidas.length });

    } catch (error) {
        console.error('Erro ao marcar conversa como lida:', error);
        res.status(500).json({ erro: 'Erro ao atualizar status de leitura.' });
    }
  }

  // Marcar como NÃO lida (Mantido)
  async marcarConversaNaoLida(req, res) {
     try {
        const { usuarioId: contatoId } = req.params;
        const { id: meuId } = req.usuario;

        const ultimaRecebida = await prisma.mensagemChatInterno.findFirst({
            where: { remetenteId: contatoId, destinatarioId: meuId },
            orderBy: { criadaEm: 'desc' }
        });

        if (ultimaRecebida) {
            // ⚠️ CORREÇÃO: Deletar todos os registros de visualização de mensagens recebidas deste contato (para garantir que funcione)
            const mensagensRecebidas = await prisma.mensagemChatInterno.findMany({
                where: { remetenteId: contatoId, destinatarioId: meuId },
                select: { id: true }
            });
            const mensagensIds = mensagensRecebidas.map(m => m.id);

            await prisma.visualizacaoMensagemChatInterno.deleteMany({
                where: { mensagemId: { in: mensagensIds }, usuarioId: meuId }
            });
        }

        res.json({ sucesso: true });
     } catch (error) {
         console.error(error);
         res.status(500).json({ erro: 'Erro ao marcar como não lida' });
     }
  }

  // 🔴 OTIMIZAÇÃO: Lista apenas as últimas 100 mensagens
  async listarMensagens(req, res) {
    try {
      const { limite = 100, destinatarioId, grupoId } = req.query; 
      
      const where = {
        contaId: req.usuario.contaId,
        excluida: false
      };

      if (destinatarioId) {
        where.OR = [
          { remetenteId: req.usuario.id, destinatarioId: destinatarioId },
          { remetenteId: destinatarioId, destinatarioId: req.usuario.id }
        ];
      }
      
      if (grupoId) {
        where.grupoId = grupoId;
        delete where.OR;
      }

      where.exclusosPara = {
        none: { usuarioId: req.usuario.id }
      };

      const mensagens = await prisma.mensagemChatInterno.findMany({
        where,
        take: parseInt(limite),
        orderBy: { criadaEm: 'desc' }, 
      });

      // Mapeia e inverte no JS para exibir em ordem cronológica ASC
      const mensagensOtimizadas = mensagens.reverse(); 

      // Re-inclui relacionamentos (mantendo a estrutura original da resposta)
      const mensagensComRelacionamentos = await Promise.all(mensagensOtimizadas.map(async msg => {
          
          const remetente = await prisma.usuario.findUnique({
              where: { id: msg.remetenteId },
              select: { id: true, nome: true, foto_perfil: true, tipo: true, nickname: true }
          });
          
          const visualizacoes = await prisma.visualizacaoMensagemChatInterno.findMany({
              where: { mensagemId: msg.id },
              include: { usuario: { select: { id: true, nome: true } } }
          });
          
          const arquivos = await prisma.arquivoMensagemChatInterno.findMany({
              where: { mensagemId: msg.id }
          });
          
          const destinatario = await prisma.usuario.findUnique({
              where: { id: msg.destinatarioId },
              select: { id: true, nome: true, foto_perfil: true, email: true, nickname: true }
          });

          // Define a propriedade 'lida' (para o frontend)
          const lida = visualizacoes.some(v => v.usuarioId === req.usuario.id);

          return {
              ...msg,
              remetente: remetente,
              destinatario: destinatario, 
              visualizacoes: visualizacoes,
              // ✅ CORREÇÃO: Adiciona 'lida' que o frontend espera (mesmo que seja visualizadaEm no DB)
              lida: lida, 
              // Garante que o frontend possa checar a visualização
              visualizadaEm: visualizacoes.length > 0 ? visualizacoes[0].visualizadaEm : null,
              arquivos: arquivos,
          };
      }));

      res.json({ mensagens: mensagensComRelacionamentos });
    } catch (error) {
      console.error('Erro ao listar mensagens:', error);
      res.status(500).json({ erro: 'Erro ao carregar mensagens.' });
    }
  }

  // Enviar Mensagem (Corrigido para Socket)
  async enviarMensagem(req, res) {
    try {
      const { id: remetenteId, contaId } = req.usuario;
      const { conteudo, destinatarioId, grupoId, respostaAId, mencoes } = req.body;

      if (!conteudo?.trim() && (!req.files || req.files.length === 0)) {
        return res.status(400).json({ erro: 'Mensagem vazia.' });
      }

      if (!grupoId && (!destinatarioId || destinatarioId === 'undefined')) {
        return res.status(400).json({ erro: 'Destinatário ou grupo é obrigatório.' });
      }

      const mensagemData = {
        contaId,
        remetenteId,
        conteudo: conteudo || '',
        tipo: req.files && req.files.length > 0 ? 'arquivo' : 'texto'
      };

      if (destinatarioId && destinatarioId !== 'undefined') mensagemData.destinatarioId = destinatarioId;
      if (grupoId) mensagemData.grupoId = grupoId;
      if (respostaAId) mensagemData.respostaAId = respostaAId;

      const novaMensagem = await prisma.mensagemChatInterno.create({
        data: mensagemData,
        include: {
          remetente: { select: { id: true, nome: true, email: true, nickname: true, foto_perfil: true, tipo: true } },
          destinatario: { select: { id: true, nome: true, email: true, nickname: true, foto_perfil: true } },
          grupo: { select: { id: true, nome: true, imagem: true } },
          respostaA: { select: { id: true, conteudo: true, remetente: { select: { id: true, nome: true } } } },
          curtidas: true,
          visualizacoes: true,
          arquivos: true
        }
      });

      if (req.files && req.files.length > 0) {
        const arquivosPromises = req.files.map(async (file) => {
          return prisma.arquivoMensagemChatInterno.create({
            data: {
              mensagemId: novaMensagem.id,
              nomeOriginal: file.originalname,
              nomeArquivo: file.filename,
              caminho: file.path,
              tamanho: file.size,
              tipo: file.mimetype
            }
          });
        });
        novaMensagem.arquivos = await Promise.all(arquivosPromises);
      }

      if (mencoes && Array.isArray(mencoes) && mencoes.length > 0) {
        const mencoesPromises = mencoes.map(async (usuarioId) => {
          const usuarioMencionado = await prisma.usuario.findFirst({ where: { id: usuarioId, contaId, status: 'ATIVO' } });
          if (usuarioMencionado) return prisma.mencaoMensagemChatInterno.create({ data: { mensagemId: novaMensagem.id, usuarioId } });
        });
        novaMensagem.mencoes = (await Promise.all(mencoesPromises)).filter(Boolean);
      }

      const io = req.app.get('io') || req.io;
      if (io) {
        if (destinatarioId && destinatarioId !== 'undefined') {
          // Destinatário
          io.to(`user:${destinatarioId}`).emit('chat_interno_nova_mensagem', { // ✅ CORREÇÃO DE SALA
              mensagem: novaMensagem,
              conversaInfo: { tipo: 'individual', destinatarioId: remetenteId }
          });
          // Remetente (Echo)
          io.to(`user:${remetenteId}`).emit('chat_interno_nova_mensagem', { // ✅ CORREÇÃO DE SALA
              mensagem: novaMensagem,
              conversaInfo: { tipo: 'individual', destinatarioId: destinatarioId }
          });
        }

        if (grupoId) {
          const grupoFull = await prisma.grupoChatInterno.findUnique({ where: { id: grupoId }, include: { membros: true }});
          if(grupoFull) {
              grupoFull.membros.forEach(m => {
                  io.to(`user:${m.usuarioId}`).emit('chat_interno_nova_mensagem', { // ✅ CORREÇÃO DE SALA
                      mensagem: novaMensagem,
                      conversaInfo: { tipo: 'grupo', grupoId }
                  });
              });
          }
        }
      }

      res.status(201).json({ mensagem: novaMensagem });
    } catch (error) {
      console.error('[CHAT-INTERNO] ❌ Erro ao enviar mensagem:', error);
      res.status(500).json({ erro: 'Erro ao enviar mensagem.' });
    }
  }

  async editarMensagem(req, res) {
    try {
      const { id } = req.params;
      const { conteudo } = req.body;

      const mensagem = await prisma.mensagemChatInterno.findUnique({ where: { id } });

      if (!mensagem) return res.status(404).json({ erro: 'Mensagem não encontrada.' });
      if (mensagem.remetenteId !== req.usuario.id) return res.status(403).json({ erro: 'Não permitido.' });

      const tempoDecorrido = Date.now() - new Date(mensagem.criadaEm).getTime();
      if (tempoDecorrido > 15 * 60 * 1000) return res.status(400).json({ erro: 'Tempo limite excedido.' });

      const atualizada = await prisma.mensagemChatInterno.update({
        where: { id },
        data: { conteudo, editada: true, editadaEm: new Date() },
        include: { remetente: true, destinatario: true, grupo: true, curtidas: true, mencoes: true, arquivos: true, visualizacoes: true }
      });

      const io = req.app.get('io') || req.io;
      if (io) {
        if (mensagem.destinatarioId) {
          io.to(`user:${mensagem.destinatarioId}`).emit('mensagem_editada_chat_interno', atualizada); // ✅ CORREÇÃO DE SALA
          io.to(`user:${mensagem.remetenteId}`).emit('mensagem_editada_chat_interno', atualizada); // ✅ CORREÇÃO DE SALA
        }
        if (mensagem.grupoId) {
           const grupo = await prisma.grupoChatInterno.findUnique({ where: { id: mensagem.grupoId }, include: { membros: true } });
           if(grupo) grupo.membros.forEach(m => io.to(`user_${m.usuarioId}`).emit('mensagem_editada_chat_interno', atualizada)); // ✅ CORREÇÃO DE SALA
        }
      }

      res.json({ mensagem: atualizada });
    } catch (error) {
      console.error('Erro ao editar mensagem:', error);
      res.status(500).json({ erro: 'Erro ao editar mensagem.' });
    }
  }

  async excluirMensagem(req, res) {
    try {
      const { id } = req.params;
      const { paraTodos } = req.query;

      const mensagem = await prisma.mensagemChatInterno.findUnique({ where: { id }, include: { arquivos: true } });

      if (!mensagem) return res.status(404).json({ erro: 'Mensagem não encontrada.' });

      const isAdmin = ['OWNER', 'ADMIN', 'ADMIN_EMPRESA'].includes(req.usuario.tipo);
      const isOwner = mensagem.remetenteId === req.usuario.id;

      if (paraTodos === 'true') {
        if (!isOwner && !isAdmin) return res.status(403).json({ erro: 'Proibido.' });

        const tempoDecorrido = Date.now() - new Date(mensagem.criadaEm).getTime();
        if (tempoDecorrido > 30 * 60 * 1000 && !isAdmin) return res.status(400).json({ erro: 'Tempo limite excedido.' });

        if (mensagem.arquivos && mensagem.arquivos.length > 0) {
          for (const arquivo of mensagem.arquivos) {
            try { await fs.unlink(arquivo.caminho); } catch (err) {}
          }
        }

        await prisma.mensagemChatInterno.update({
          where: { id },
          data: { excluida: true, exclusaoGlobal: true, conteudo: '[Mensagem excluída]' }
        });

        const io = req.app.get('io') || req.io;
        if (io) {
          const evento = { id, global: true };
          if (mensagem.destinatarioId) {
            io.to(`user:${mensagem.destinatarioId}`).emit('mensagem_excluida_chat_interno', evento); // ✅ CORREÇÃO DE SALA
            io.to(`user:${mensagem.remetenteId}`).emit('mensagem_excluida_chat_interno', evento); // ✅ CORREÇÃO DE SALA
          }
          if (mensagem.grupoId) {
             const grupo = await prisma.grupoChatInterno.findUnique({ where: { id: mensagem.grupoId }, include: { membros: true } });
             if(grupo) grupo.membros.forEach(m => io.to(`user:${m.usuarioId}`).emit('mensagem_excluida_chat_interno', evento)); // ✅ CORREÇÃO DE SALA
          }
        }

        res.json({ sucesso: true, global: true });
      } else {
        await prisma.exclusaoMensagemChatInterno.create({
          data: { mensagemId: id, usuarioId: req.usuario.id }
        });
        res.json({ sucesso: true, global: false });
      }
    } catch (error) {
      console.error('Erro ao excluir mensagem:', error);
      res.status(500).json({ erro: 'Erro ao excluir mensagem.' });
    }
  }

  async curtirMensagem(req, res) {
    try {
      const { id } = req.params;
      const curtidaExistente = await prisma.curtidaMensagemChatInterno.findUnique({
        where: { mensagemId_usuarioId: { mensagemId: id, usuarioId: req.usuario.id } }
      });

      const io = req.app.get('io') || req.io;

      if (curtidaExistente) {
        await prisma.curtidaMensagemChatInterno.delete({ where: { id: curtidaExistente.id } });
        if (io) {
          const mensagem = await prisma.mensagemChatInterno.findUnique({ where: { id } });
          const evento = { mensagemId: id, usuarioId: req.usuario.id };
          if (mensagem.destinatarioId) {
            io.to(`user:${mensagem.destinatarioId}`).emit('curtida_removida_chat_interno', evento); // ✅ CORREÇÃO DE SALA
            io.to(`user:${mensagem.remetenteId}`).emit('curtida_removida_chat_interno', evento); // ✅ CORREÇÃO DE SALA
          }
          if (mensagem.grupoId) {
             const grupo = await prisma.grupoChatInterno.findUnique({ where: { id: mensagem.grupoId }, include: { membros: true } });
             if(grupo) grupo.membros.forEach(m => io.to(`user:${m.usuarioId}`).emit('curtida_removida_chat_interno', evento)); // ✅ CORREÇÃO DE SALA
          }
        }
        res.json({ curtido: false });
      } else {
        const curtida = await prisma.curtidaMensagemChatInterno.create({
          data: { mensagemId: id, usuarioId: req.usuario.id },
          include: { usuario: { select: { id: true, nome: true, foto_perfil: true } } }
        });
        if (io) {
          const mensagem = await prisma.mensagemChatInterno.findUnique({ where: { id } });
          const evento = { mensagemId: id, curtida };
          if (mensagem.destinatarioId) {
            io.to(`user:${mensagem.destinatarioId}`).emit('curtida_adicionada_chat_interno', evento); // ✅ CORREÇÃO DE SALA
            io.to(`user:${mensagem.remetenteId}`).emit('curtida_adicionada_chat_interno', evento); // ✅ CORREÇÃO DE SALA
          }
          if (mensagem.grupoId) {
             const grupo = await prisma.grupoChatInterno.findUnique({ where: { id: mensagem.grupoId }, include: { membros: true } });
             if(grupo) grupo.membros.forEach(m => io.to(`user:${m.usuarioId}`).emit('curtida_adicionada_chat_interno', evento)); // ✅ CORREÇÃO DE SALA
          }
        }
        res.json({ curtido: true, curtida });
      }
    } catch (error) {
      console.error('Erro ao curtir mensagem:', error);
      res.status(500).json({ erro: 'Erro ao processar curtida.' });
    }
  }

  async marcarComoVisualizada(req, res) {
    try {
      const { id } = req.params;
      const visualizacaoExistente = await prisma.visualizacaoMensagemChatInterno.findUnique({
        where: { mensagemId_usuarioId: { mensagemId: id, usuarioId: req.usuario.id } }
      });

      if (visualizacaoExistente) return res.json({ sucesso: true });

      await prisma.visualizacaoMensagemChatInterno.create({
        data: { mensagemId: id, usuarioId: req.usuario.id }
      });

      res.json({ sucesso: true });
    } catch (error) {
      console.error('Erro ao marcar como visualizada:', error);
      res.status(500).json({ erro: 'Erro ao marcar mensagem como visualizada.' });
    }
  }

  // FAVORITOS
  async adicionarFavorito(req, res) {
    try {
      const { usuarioId } = req.body;
      if (!usuarioId) return res.status(400).json({ erro: 'ID do usuário é obrigatório.' });

      const existe = await prisma.favoritoChatInterno.findUnique({
        where: { usuarioId_favoritoId: { usuarioId: req.usuario.id, favoritoId: usuarioId } }
      });

      if (existe) return res.status(400).json({ erro: 'Usuário já está nos favoritos.' });

      const favorito = await prisma.favoritoChatInterno.create({
        data: { usuarioId: req.usuario.id, favoritoId: usuarioId },
        include: { favorito: { select: { id: true, nome: true, email: true, nickname: true, foto_perfil: true, tipo: true } } }
      });

      res.status(201).json({ sucesso: true, favorito, mensagem: 'Favorito adicionado!' });
    } catch (error) {
      console.error('Erro ao adicionar favorito:', error);
      res.status(500).json({ erro: 'Erro ao adicionar favorito.' });
    }
  }

  async removerFavorito(req, res) {
    try {
      const { usuarioId } = req.params;
      const favorito = await prisma.favoritoChatInterno.findUnique({
        where: { usuarioId_favoritoId: { usuarioId: req.usuario.id, favoritoId: usuarioId } }
      });

      if (!favorito) return res.status(404).json({ erro: 'Favorito não encontrado.' });

      await prisma.favoritoChatInterno.delete({ where: { id: favorito.id } });
      res.json({ sucesso: true, mensagem: 'Favorito removido!' });
    } catch (error) {
      console.error('Erro ao remover favorito:', error);
      res.status(500).json({ erro: 'Erro ao remover favorito.' });
    }
  }

  async listarFavoritos(req, res) {
    try {
      const { id: usuarioId } = req.usuario;
      const favoritos = await prisma.favoritoChatInterno.findMany({
        where: { usuarioId },
        include: { favorito: { select: { id: true, nome: true, email: true, nickname: true, foto_perfil: true, tipo: true, status: true } } },
        orderBy: { criadoEm: 'desc' }
      });

      const favoritosFormatados = favoritos.map(f => ({
        id: f.favorito.id,
        nome: f.favorito.nome,
        email: f.favorito.email,
        nickname: f.favorito.nickname,
        foto_perfil: f.favorito.foto_perfil,
        tipo: f.favorito.tipo,
        status: f.favorito.status,
        favoritoEm: f.criadoEm
      }));

      res.json({ favoritos: favoritosFormatados });
    } catch (error) {
      console.error('Erro ao listar favoritos:', error);
      res.status(500).json({ erro: 'Erro ao buscar favoritos.' });
    }
  }

  // ALERTAS
  async enviarAlerta(req, res) {
    try {
      const { titulo, mensagem, destinatarios } = req.body;
      if (!titulo || !mensagem || !destinatarios || destinatarios.length === 0) return res.status(400).json({ erro: 'Dados inválidos.' });

      const alerta = await prisma.alertaChatInterno.create({
        data: { contaId: req.usuario.contaId, remetenteId: req.usuario.id, titulo, mensagem },
        include: { remetente: { select: { id: true, nome: true, foto_perfil: true } } }
      });

      for (const usuarioId of destinatarios) {
        await prisma.destinatarioAlertaChatInterno.create({ data: { alertaId: alerta.id, usuarioId } });
      }

      const alertaCompleto = await prisma.alertaChatInterno.findUnique({
        where: { id: alerta.id },
        include: {
          remetente: { select: { id: true, nome: true, foto_perfil: true } },
          destinatarios: { include: { usuario: { select: { id: true, nome: true } } } },
          respostas: { include: { usuario: { select: { id: true, nome: true } } } }
        }
      });

      const io = req.app.get('io') || req.io;
      if (io) {
        destinatarios.forEach(usuarioId => io.to(`user:${usuarioId}`).emit('novo_alerta_chat_interno', alertaCompleto)); // ✅ CORREÇÃO DE SALA
      }

      res.status(201).json({ alerta: alertaCompleto });
    } catch (error) {
      console.error('Erro ao enviar alerta:', error);
      res.status(500).json({ erro: 'Erro ao enviar alerta.' });
    }
  }

  async responderAlerta(req, res) {
    try {
      const { id } = req.params;
      const { resposta } = req.body;

      if (!['entendido', 'nao_concordo'].includes(resposta)) return res.status(400).json({ erro: 'Resposta inválida.' });

      const respostaExistente = await prisma.respostaAlertaChatInterno.findUnique({
        where: { alertaId_usuarioId: { alertaId: id, usuarioId: req.usuario.id } }
      });

      if (respostaExistente) return res.status(400).json({ erro: 'Já respondeu.' });

      const novaResposta = await prisma.respostaAlertaChatInterno.create({
        data: { alertaId: id, usuarioId: req.usuario.id, resposta },
        include: { usuario: { select: { id: true, nome: true, foto_perfil: true } } }
      });

      const alerta = await prisma.alertaChatInterno.findUnique({ where: { id } });
      const io = req.app.get('io') || req.io;
      if (io) {
        io.to(`user:${alerta.remetenteId}`).emit('resposta_alerta_chat_interno', { alertaId: id, resposta: novaResposta }); // ✅ CORREÇÃO DE SALA
      }

      res.json({ resposta: novaResposta });
    } catch (error) {
      console.error('Erro ao responder alerta:', error);
      res.status(500).json({ erro: 'Erro ao responder alerta.' });
    }
  }

  async listarRespostasAlerta(req, res) {
    try {
      const { id } = req.params;
      const respostas = await prisma.respostaAlertaChatInterno.findMany({
        where: { alertaId: id },
        include: { usuario: { select: { id: true, nome: true, foto_perfil: true, tipo: true } } },
        orderBy: { criadaEm: 'asc' }
      });
      res.json({ respostas });
    } catch (error) {
      console.error('Erro ao listar respostas:', error);
      res.status(500).json({ erro: 'Erro ao listar respostas do alerta.' });
    }
  }

  async listarMeusAlertas(req, res) {
    try {
      const alertas = await prisma.alertaChatInterno.findMany({
        where: { remetenteId: req.usuario.id },
        include: {
          destinatarios: { include: { usuario: { select: { id: true, nome: true, foto_perfil: true } } } },
          respostas: { include: { usuario: { select: { id: true, nome: true, foto_perfil: true } } } }
        },
        orderBy: { criadaEm: 'desc' }
      });
      res.json({ alertas });
    } catch (error) {
      console.error('Erro ao listar alertas:', error);
      res.status(500).json({ erro: 'Erro ao listar alertas.' });
    }
  }

  // SOLICITAÇÕES DE AJUDA
  async solicitarAjuda(req, res) {
    try {
      const { tipo, descricao } = req.body;
      if (!tipo || !descricao) return res.status(400).json({ erro: 'Dados incompletos.' });

      const protocolo = `SUP-${Date.now().toString().slice(-6)}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

      const solicitacao = await prisma.solicitacaoAjudaChatInterno.create({
        data: { contaId: req.usuario.contaId, solicitanteId: req.usuario.id, protocolo, tipo, descricao, status: 'PENDENTE' },
        include: { solicitante: { select: { id: true, nome: true, email: true, nickname: true, foto_perfil: true, avatar: true, tipo: true } } }
      });

      const mensagemInicial = await prisma.mensagemSuporte.create({
        data: { solicitacaoId: solicitacao.id, remetenteId: req.usuario.id, tipo: 'sistema', conteudo: `Chamado ${protocolo} criado.` },
        include: { remetente: true }
      });

      const io = req.app.get('io') || req.io;
      if (io) {
        const admins = await prisma.usuario.findMany({ where: { tipo: { in: ['OWNER', 'SUPORTE'] }, contaId: req.usuario.contaId } });
        admins.forEach(ad => io.to(`user:${ad.id}`).emit('nova_solicitacao_ajuda', solicitacao)); // ✅ CORREÇÃO DE SALA
      }
      res.status(201).json({ solicitacao, protocolo, mensagemInicial });
    } catch (error) {
      console.error('Erro ao criar solicitação de ajuda:', error);
      res.status(500).json({ erro: 'Erro ao enviar solicitação.' });
    }
  }

  async listarSolicitacoesAjuda(req, res) {
    try {
      if (!['OWNER', 'SUPORTE'].includes(req.usuario.tipo)) return res.status(403).json({ erro: 'Acesso negado.' });
      
      const { status } = req.query;
      const where = {};
      if (status && status !== 'TODOS') where.status = status;

      const solicitacoes = await prisma.solicitacaoAjudaChatInterno.findMany({
        where,
        include: {
          solicitante: { select: { id: true, nome: true, email: true, nickname: true, foto_perfil: true, avatar: true, tipo: true } },
          atendidoPor: { select: { id: true, nome: true, foto_perfil: true, avatar: true } }
        },
        orderBy: [{ status: 'asc' }, { criadaEm: 'desc' }]
      });
      res.json({ solicitacoes });
    } catch (error) {
      console.error('Erro ao listar solicitações:', error);
      res.status(500).json({ erro: 'Erro ao carregar solicitações.' });
    }
  }

  async atenderSolicitacao(req, res) {
    try {
      const { id } = req.params;
      if (!['OWNER', 'SUPORTE'].includes(req.usuario.tipo)) return res.status(403).json({ erro: 'Acesso negado.' });

      const solicitacao = await prisma.solicitacaoAjudaChatInterno.findUnique({ where: { id } });
      if (!solicitacao) return res.status(404).json({ erro: 'Não encontrada.' });
      if (solicitacao.status !== 'PENDENTE') return res.status(400).json({ erro: 'Já atendida.' });

      const atualizada = await prisma.solicitacaoAjudaChatInterno.update({
        where: { id },
        data: { status: 'EM_ATENDIMENTO', atendidoPorId: req.usuario.id, atendidaEm: new Date() },
        include: { solicitante: true, atendidoPor: true }
      });

      const io = req.app.get('io') || req.io;
      if (io) {
        io.to(`user:${solicitacao.solicitanteId}`).emit('atendimento_iniciado', { solicitacao: atualizada, atendente: req.usuario }); // ✅ CORREÇÃO DE SALA
      }

      res.json({ sucesso: true, solicitacao: atualizada });
    } catch (error) {
      console.error('Erro ao atender solicitação:', error);
      res.status(500).json({ erro: 'Erro ao iniciar atendimento.' });
    }
  }

  async limparChat(req, res) {
    try {
      const mensagens = await prisma.mensagemChatInterno.findMany({
        where: { contaId: req.usuario.contaId, OR: [{ remetenteId: req.usuario.id }, { destinatarioId: req.usuario.id }] }
      });

      for (const mensagem of mensagens) {
        await prisma.exclusaoMensagemChatInterno.upsert({
          where: { mensagemId_usuarioId: { mensagemId: mensagem.id, usuarioId: req.usuario.id } },
          create: { mensagemId: mensagem.id, usuarioId: req.usuario.id },
          update: {}
        });
      }
      res.json({ sucesso: true, mensagem: 'Chat limpo com sucesso.' });
    } catch (error) {
      console.error('Erro ao limpar chat:', error);
      res.status(500).json({ erro: 'Erro ao limpar o chat.' });
    }
  }

  async obterEstatisticas(req, res) {
    try {
      const [totalMensagens, mensagensHoje, gruposAtivos, usuariosAtivos] = await Promise.all([
        prisma.mensagemChatInterno.count({ where: { contaId: req.usuario.contaId } }),
        prisma.mensagemChatInterno.count({ where: { contaId: req.usuario.contaId, criadaEm: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } } }),
        prisma.grupoChatInterno.count({ where: { contaId: req.usuario.contaId } }),
        prisma.usuario.count({ where: { contaId: req.usuario.contaId, status: 'ATIVO' } })
      ]);
      res.json({ totalMensagens, mensagensHoje, gruposAtivos, usuariosAtivos });
    } catch (error) {
      console.error('Erro ao obter estatísticas:', error);
      res.status(500).json({ erro: 'Erro ao carregar estatísticas.' });
    }
  }
}

module.exports = new ChatInternoController();