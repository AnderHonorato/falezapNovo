// backend/src/controladores/Whatsapp/anotacoes.controlador.js - ✅ CORRIGIDO

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class AnotacoesController {
  
    // ✅ CORRIGIDO: Usar numeroCliente direto, sem usuarioId
  async criar(req, res) {
    try {
      const { conversaId, conteudo, cor, mensagemId } = req.body;
      const { id: usuarioId, nome } = req.usuario;

      const anotacao = await prisma.anotacao.create({
        data: {
          conversaId: parseInt(conversaId),
          usuarioId: usuarioId,
          mensagem: conteudo,
          cor: cor || 'amarelo',
          mensagemRespostaId: mensagemId ? parseInt(mensagemId) : null
        },
        include: {
          usuario: {
            select: {
              id: true,
              nome: true
            }
          }
        }
      });

      res.json({
        sucesso: true,
        anotacao: {
          ...anotacao,
          usuario: {
            nome: nome
          }
        }
      });
    } catch (erro) {
      console.error('Erro ao criar anotação:', erro);
      res.status(500).json({ sucesso: false, erro: erro.message });
    }
  }
  // Corrigir método listar
  async listar(req, res) {
    try {
      const { conversaId } = req.params;
      const { id: usuarioId } = req.usuario;

      const anotacoes = await prisma.anotacao.findMany({
        where: {
          conversaId: parseInt(conversaId),
          usuarioId: usuarioId // APENAS ANOTAÇÕES DO USUÁRIO
        },
        include: {
          usuario: {
            select: {
              id: true,
              nome: true
            }
          },
          mensagemResposta: {
            select: {
              conteudo: true,
              tipo: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      res.json({ sucesso: true, anotacoes });
    } catch (erro) {
      res.status(500).json({ sucesso: false, erro: erro.message });
    }
  }
  // ✅ CORRIGIDO: Usar numeroCliente direto, sem usuarioId
  static async listarAnotacoes(req, res) {
    try {
      const { numeroCliente } = req.params; // ✅ Removido usuarioId
      const { incluirApagadas } = req.query;
      const contaId = req.usuario.contaId; // ✅ Do token JWT

      console.log('📋 Listando anotações:', { contaId, numeroCliente });

      // ✅ Buscar conversa pelo numeroCliente e contaId
      const conversa = await prisma.conversa.findFirst({
        where: {
          contaId: contaId,
          numeroCliente: decodeURIComponent(numeroCliente)
        }
      });

      if (!conversa) {
        return res.status(404).json({ erro: 'Conversa não encontrada' });
      }

      const where = { conversaId: conversa.id };
      
      if (incluirApagadas !== 'true') {
        where.apagada = false;
      }

      const anotacoes = await prisma.anotacao.findMany({
        where: where,
        include: {
          usuario: {
            select: { id: true, nome: true, email: true }
          }
        },
        orderBy: { criadaEm: 'asc' }
      });

      console.log(`✅ Encontradas ${anotacoes.length} anotações`);

      res.json({
        sucesso: true,
        total: anotacoes.length,
        anotacoes: anotacoes.map(a => ({
          id: a.id,
          conteudo: a.conteudo,
          cor: a.cor,
          apagada: a.apagada,
          apagadaPor: a.apagadaPor,
          apagadaEm: a.apagadaEm,
          criadaEm: a.criadaEm,
          atualizadoEm: a.atualizadoEm,
          mensagemCitadaConteudo: a.mensagemCitadaConteudo,
          mensagemCitadaAutor: a.mensagemCitadaAutor,
          usuario: a.usuario
        }))
      });

    } catch (erro) {
      console.error('❌ Erro:', erro);
      res.status(500).json({ 
        erro: 'Erro ao listar anotações',
        detalhes: erro.message 
      });
    }
  }

  static async atualizarAnotacao(req, res) {
    try {
      const { anotacaoId } = req.params;
      const { conteudo, cor } = req.body;

      console.log('✏️ Atualizando anotação:', anotacaoId);

      if (!conteudo || !conteudo.trim()) {
        return res.status(400).json({ 
          erro: 'Conteúdo é obrigatório' 
        });
      }

      const anotacaoExiste = await prisma.anotacao.findUnique({
        where: { id: anotacaoId }
      });

      if (!anotacaoExiste) {
        return res.status(404).json({ erro: 'Anotação não encontrada' });
      }

      const anotacao = await prisma.anotacao.update({
        where: { id: anotacaoId },
        data: {
          conteudo: conteudo.trim(),
          ...(cor && { cor })
        },
        include: {
          usuario: {
            select: { id: true, nome: true, email: true }
          }
        }
      });

      console.log(`✅ Anotação atualizada`);

      res.json({
        sucesso: true,
        anotacao: {
          id: anotacao.id,
          conteudo: anotacao.conteudo,
          cor: anotacao.cor,
          criadaEm: anotacao.criadaEm,
          atualizadoEm: anotacao.atualizadoEm,
          usuario: anotacao.usuario
        }
      });

    } catch (erro) {
      console.error('❌ Erro:', erro);
      res.status(500).json({ 
        erro: 'Erro ao atualizar anotação',
        detalhes: erro.message 
      });
    }
  }

  static async deletarAnotacao(req, res) {
    try {
      const { anotacaoId } = req.params;
      const { apagadaPor } = req.body;
      const nomeUsuario = req.usuario.nome; // ✅ Do token JWT

      console.log('🗑️ Deletando anotação:', anotacaoId);

      const anotacaoExiste = await prisma.anotacao.findUnique({
        where: { id: anotacaoId }
      });

      if (!anotacaoExiste) {
        return res.status(404).json({ erro: 'Anotação não encontrada' });
      }

      const anotacao = await prisma.anotacao.update({
        where: { id: anotacaoId },
        data: {
          apagada: true,
          apagadaPor: apagadaPor || nomeUsuario || 'Usuário',
          apagadaEm: new Date()
        },
        include: {
          usuario: {
            select: { id: true, nome: true, email: true }
          }
        }
      });

      console.log(`✅ Anotação marcada como apagada`);

      res.json({
        sucesso: true,
        mensagem: 'Anotação removida',
        anotacao: {
          id: anotacao.id,
          conteudo: anotacao.conteudo,
          cor: anotacao.cor,
          apagada: anotacao.apagada,
          apagadaPor: anotacao.apagadaPor,
          apagadaEm: anotacao.apagadaEm,
          criadaEm: anotacao.criadaEm,
          atualizadoEm: anotacao.atualizadoEm,
          usuario: anotacao.usuario
        }
      });

    } catch (erro) {
      console.error('❌ Erro:', erro);
      res.status(500).json({ 
        erro: 'Erro ao deletar anotação',
        detalhes: erro.message 
      });
    }
  }
}

module.exports = AnotacoesController;
