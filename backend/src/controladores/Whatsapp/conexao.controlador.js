// backend/src/controladores/Whatsapp/conexao.controlador.js - MÚLTIPLAS INSTÂNCIAS

const servicoWhatsApp = require('../../servicos/baileys.servico');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class ConexaoController {
  
  static async gerarQRCode(req, res) {
    try {
      const { id: usuarioId, contaId, tipo } = req.usuario;
      const { instancia } = req.body; // ✅ NOVO: Recebe instância

      if (tipo !== 'OWNER' && tipo !== 'ADMIN_EMPRESA') {
        console.log(`❌ Acesso negado: Usuário ${usuarioId} (tipo: ${tipo}) tentou gerar QR Code.`);
        return res.status(403).json({
          sucesso: false,
          erro: 'Você não tem permissão para conectar o WhatsApp.',
        });
      }

      // ✅ NOVO: Verifica limite de WhatsApps
      const limite = await servicoWhatsApp.verificarLimiteWhatsApps(contaId);
      
      if (!limite.podeConectar) {
        return res.status(403).json({
          sucesso: false,
          erro: `Limite de WhatsApps atingido (${limite.limite}). Faça upgrade do plano para conectar mais.`,
          limite: limite
        });
      }
      
      console.log(`📱 Gerando QR Code - Conta: ${contaId}, Instância: ${instancia || 1}`);
      
      servicoWhatsApp.registrarClienteWS(contaId, instancia || 1, res);
      await servicoWhatsApp.conectarWhatsApp(contaId, instancia || 1);
      
    } catch (erro) {
      console.error('❌ Erro:', erro);
      if (!res.headersSent) {
        res.status(500).json({ 
          sucesso: false, 
          erro: 'Erro ao gerar QR Code', 
          detalhes: erro.message 
        });
      }
    }
  }

  static async verificarStatus(req, res) {
    try {
      const { contaId } = req.usuario;
      const { instancia } = req.params;
      
      console.log(`🔍 Verificando status - Conta: ${contaId}, Instância: ${instancia}`);
      
      const resultado = servicoWhatsApp.obterStatus(contaId, parseInt(instancia));
      res.json({ sucesso: true, ...resultado });
    } catch (erro) {
      console.error('❌ Erro:', erro);
      res.status(500).json({
        sucesso: false,
        erro: 'Erro ao verificar status',
        detalhes: erro.message
      });
    }
  }

  static async desconectar(req, res) {
    try {
      const { contaId } = req.usuario;
      const { instancia } = req.params;
      
      console.log(`🔌 Desconectando - Conta: ${contaId}, Instância: ${instancia}`);
      
      const resultado = await servicoWhatsApp.desconectar(contaId, parseInt(instancia));
      res.json({ sucesso: true, ...resultado });
    } catch (erro) {
      console.error('❌ Erro:', erro);
      res.status(500).json({
        sucesso: false,
        erro: 'Erro ao desconectar',
        detalhes: erro.message
      });
    }
  }

  static async listarConectados(req, res) {
    try {
      const usuarioLogado = req.usuario;
      
      if (!usuarioLogado || !usuarioLogado.contaId) {
        console.error('❌ Erro: req.usuario.contaId não encontrado.');
        return res.status(401).json({ 
          sucesso: false, 
          erro: 'Informação de conta do usuário ausente.' 
        });
      }

      console.log(`📋 Listando conectados para conta: ${usuarioLogado.contaId}`);
      const resultado = servicoWhatsApp.listarClientesConectados(usuarioLogado.contaId);

      res.json({ sucesso: true, clientes: resultado });
    } catch (erro) {
      console.error('❌ Erro ao listar conectados:', erro);
      res.status(500).json({
        sucesso: false,
        erro: 'Erro ao listar conectados',
        detalhes: erro.message
      });
    }
  }

  // ✅ NOVO: Listar todas as instâncias disponíveis
  static async listarInstancias(req, res) {
    try {
      const { contaId } = req.usuario;

      console.log(`📋 Listando instâncias para conta: ${contaId}`);

      // Busca todas as instâncias configuradas
      const instancias = await prisma.conexaoWhatsApp.findMany({
        where: { contaId: contaId },
        orderBy: { instancia: 'asc' },
        select: {
          id: true,
          instancia: true,
          nomeInstancia: true,
          corIdentificacao: true,
          status: true,
          numeroWhatsApp: true,
          nomeExibicao: true,
          ultimaConexao: true
        }
      });

      // Busca informações de limite
      const conta = await prisma.conta.findUnique({
        where: { id: contaId },
        select: { limiteWhatsApps: true }
      });

      const limite = await servicoWhatsApp.verificarLimiteWhatsApps(contaId);

      res.json({
        sucesso: true,
        instancias: instancias,
        total: instancias.length,
        limite: limite
      });

    } catch (erro) {
      console.error('❌ Erro ao listar instâncias:', erro);
      res.status(500).json({
        sucesso: false,
        erro: 'Erro ao listar instâncias',
        detalhes: erro.message
      });
    }
  }

  // ✅ NOVO: Obter limite de WhatsApps
  static async obterLimite(req, res) {
    try {
      const { contaId } = req.usuario;
      
      const limite = await servicoWhatsApp.verificarLimiteWhatsApps(contaId);
      
      res.json({
        sucesso: true,
        ...limite
      });
      
    } catch (erro) {
      console.error('❌ Erro ao obter limite:', erro);
      res.status(500).json({
        sucesso: false,
        erro: 'Erro ao obter limite',
        detalhes: erro.message
      });
    }
  }

  // ✅ NOVO: Atualizar nome e cor da instância
  static async atualizarInstancia(req, res) {
    try {
      const { contaId } = req.usuario;
      const { instancia } = req.params;
      const { nomeInstancia, corIdentificacao } = req.body;

      console.log(`✏️ Atualizando instância ${instancia} - Nome: ${nomeInstancia}, Cor: ${corIdentificacao}`);

      const conexaoAtualizada = await prisma.conexaoWhatsApp.update({
        where: {
          contaId_instancia: {
            contaId: contaId,
            instancia: parseInt(instancia)
          }
        },
        data: {
          nomeInstancia: nomeInstancia,
          corIdentificacao: corIdentificacao
        }
      });

      res.json({
        sucesso: true,
        conexao: conexaoAtualizada
      });

    } catch (erro) {
      console.error('❌ Erro ao atualizar instância:', erro);
      res.status(500).json({
        sucesso: false,
        erro: 'Erro ao atualizar instância',
        detalhes: erro.message
      });
    }
  }

  // ✅ NOVA FUNÇÃO PARA CRIAR A INSTÂNCIA NO BANCO
  static async criarInstancia(req, res) {
    try {
      const { id: usuarioId, contaId, tipo, podeGerenciarConexoes } = req.usuario;

      // 1. Verificar Permissão (OWNER ou permissão específica)
      if (tipo !== 'OWNER' && !podeGerenciarConexoes) {
         console.log(`❌ Acesso negado: Usuário ${usuarioId} (tipo: ${tipo}) tentou criar instância sem permissão.`);
         return res.status(403).json({
           sucesso: false,
           erro: 'Você não tem permissão para criar novas conexões WhatsApp.',
         });
       }


      // 2. Verificar Limite do Plano
      const limite = await servicoWhatsApp.verificarLimiteWhatsApps(contaId);
      if (!limite.podeConectar) {
        return res.status(403).json({
          sucesso: false,
          erro: `Limite de WhatsApps atingido (${limite.limite}). Faça upgrade do plano para criar mais.`,
          limite: limite
        });
      }

      // 3. Determinar o próximo número de instância disponível
      const ultimaInstancia = await prisma.conexaoWhatsApp.findFirst({
        where: { contaId: contaId },
        orderBy: { instancia: 'desc' },
        select: { instancia: true }
      });
      const proximaInstanciaNum = (ultimaInstancia?.instancia || 0) + 1;

      console.log(`➕ Criando instância ${proximaInstanciaNum} para Conta: ${contaId}`);

      // 4. Criar o registo na base de dados
      const novaConexao = await prisma.conexaoWhatsApp.create({
        data: {
          contaId: contaId,
          instancia: proximaInstanciaNum,
          status: 'DESCONECTADO', // Estado inicial
          nomeInstancia: `WhatsApp ${proximaInstanciaNum}`, // Nome padrão
          // Pode adicionar cor padrão se quiser
        }
      });

      res.status(201).json({
        sucesso: true,
        mensagem: 'Instância criada com sucesso. Agora pode gerar o QR Code.',
        conexao: novaConexao
      });

    } catch (erro) {
      console.error('❌ Erro ao criar instância:', erro);
      res.status(500).json({
        sucesso: false,
        erro: 'Erro interno ao criar instância',
        detalhes: erro.message
      });
    }
  }
}

module.exports = ConexaoController;