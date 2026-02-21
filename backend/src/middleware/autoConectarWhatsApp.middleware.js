// backend/src/middleware/autoConectarWhatsApp.middleware.js
// ✅ Middleware para garantir conexão WhatsApp ao fazer login

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Middleware que verifica e cria conexão WhatsApp automaticamente
 * Deve ser chamado APÓS a autenticação bem-sucedida
 */
async function garantirConexaoAposLogin(req, res, next) {
  try {
    const contaId = req.usuario?.contaId;

    if (!contaId) {
      return next(); // Sem conta, pula
    }

    // Verificar se já existe conexão CONECTADA
    const conexaoExistente = await prisma.conexaoWhatsApp.findFirst({
      where: {
        contaId: contaId,
        instancia: 1,
        status: 'CONECTADO'
      }
    });

    if (conexaoExistente) {
      // Já tem conexão ativa, segue o fluxo
      return next();
    }

    // Não tem conexão ou está desconectada - criar/atualizar
    console.log(`🔧 [AUTO-CONECTAR] Criando conexão para conta: ${contaId}`);

    const conexao = await prisma.conexaoWhatsApp.findFirst({
      where: {
        contaId: contaId,
        instancia: 1
      }
    });

    if (conexao) {
      // Atualizar existente
      await prisma.conexaoWhatsApp.update({
        where: { id: conexao.id },
        data: {
          phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
          numeroWhatsApp: process.env.WHATSAPP_PHONE_NUMBER || '5511939205314',
          nomeInstancia: 'WhatsApp Business API',
          nomeExibicao: 'WhatsApp Oficial',
          status: 'CONECTADO',
          corIdentificacao: '#25D366',
          ultimaConexao: new Date()
        }
      });
      
      console.log(`✅ [AUTO-CONECTAR] Conexão atualizada para CONECTADO`);
    } else {
      // Criar nova
      await prisma.conexaoWhatsApp.create({
        data: {
          contaId: contaId,
          instancia: 1,
          phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
          numeroWhatsApp: process.env.WHATSAPP_PHONE_NUMBER || '5511939205314',
          nomeInstancia: 'WhatsApp Business API',
          nomeExibicao: 'WhatsApp Oficial',
          status: 'CONECTADO',
          corIdentificacao: '#25D366',
          ultimaConexao: new Date()
        }
      });
      
      console.log(`✅ [AUTO-CONECTAR] Nova conexão criada`);
    }

    // Segue o fluxo normalmente
    next();

  } catch (erro) {
    console.error('❌ [AUTO-CONECTAR] Erro:', erro.message);
    // Mesmo com erro, deixa o usuário continuar
    next();
  }
}

module.exports = { garantirConexaoAposLogin };