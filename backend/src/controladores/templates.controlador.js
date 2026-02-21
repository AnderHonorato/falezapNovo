// backend/src/controladores/templates.controlador.js

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { 
  buscarTemplatesLocais, 
  sincronizarTemplates 
} = require('../servicos/meta-templates.servico');

/**
 * ✅ LISTAR TEMPLATES (COM CACHE)
 */
async function listarTemplates(req, res) {
  try {
    console.log('\n📋 ==========================================');
    console.log('📋 [CONTROLADOR] listarTemplates chamado');
    console.log('==========================================');
    
    const contaId = req.usuario?.contaId;
    const { conexaoId } = req.query;

    console.log('👤 Conta ID:', contaId);
    console.log('🔌 Conexão ID:', conexaoId);

    if (!conexaoId) {
      console.log('❌ conexaoId não fornecido');
      return res.status(400).json({
        sucesso: false,
        erro: 'conexaoId é obrigatório'
      });
    }

    // Verificar se a conexão pertence à conta
    const conexao = await prisma.conexaoWhatsApp.findFirst({
      where: {
        id: conexaoId,
        contaId
      }
    });

    if (!conexao) {
      console.log('❌ Conexão não encontrada ou não pertence à conta');
      return res.status(404).json({
        sucesso: false,
        erro: 'Conexão não encontrada'
      });
    }

    console.log('✅ Conexão encontrada:', conexao.nomeInstancia);
    console.log('🔍 Buscando templates...');

    const templates = await buscarTemplatesLocais(conexaoId);

    console.log(`✅ ${templates.length} templates encontrados`);
    console.log('==========================================\n');

    return res.status(200).json({
      sucesso: true,
      templates,
      total: templates.length
    });

  } catch (error) {
    console.error('\n❌ ==========================================');
    console.error('❌ [CONTROLADOR] Erro ao listar templates');
    console.error('==========================================');
    console.error('Erro:', error.message);
    console.error('Stack:', error.stack);
    console.error('==========================================\n');
    
    return res.status(500).json({
      sucesso: false,
      erro: error.message || 'Erro ao listar templates'
    });
  }
}

/**
 * ✅ SINCRONIZAR TEMPLATES MANUALMENTE
 */
async function sincronizarTemplatesManual(req, res) {
  try {
    console.log('\n🔄 ==========================================');
    console.log('🔄 [CONTROLADOR] sincronizarTemplatesManual chamado');
    console.log('==========================================');
    
    const contaId = req.usuario?.contaId;
    const { conexaoId } = req.body;

    console.log('👤 Conta ID:', contaId);
    console.log('🔌 Conexão ID:', conexaoId);

    if (!conexaoId) {
      console.log('❌ conexaoId não fornecido');
      return res.status(400).json({
        sucesso: false,
        erro: 'conexaoId é obrigatório'
      });
    }

    const conexao = await prisma.conexaoWhatsApp.findFirst({
      where: {
        id: conexaoId,
        contaId
      }
    });

    if (!conexao) {
      console.log('❌ Conexão não encontrada');
      return res.status(404).json({
        sucesso: false,
        erro: 'Conexão não encontrada'
      });
    }

    console.log('✅ Conexão encontrada:', conexao.nomeInstancia);
    console.log('🔄 Iniciando sincronização...');

    const resultado = await sincronizarTemplates(conexaoId);

    console.log(`✅ ${resultado.total} templates sincronizados`);
    console.log('==========================================\n');

    return res.status(200).json({
      sucesso: true,
      mensagem: `${resultado.total} templates sincronizados com sucesso`,
      templates: resultado.templates
    });

  } catch (error) {
    console.error('\n❌ ==========================================');
    console.error('❌ [CONTROLADOR] Erro ao sincronizar templates');
    console.error('==========================================');
    console.error('Erro:', error.message);
    console.error('Stack:', error.stack);
    console.error('==========================================\n');
    
    return res.status(500).json({
      sucesso: false,
      erro: error.message || 'Erro ao sincronizar templates'
    });
  }
}

/**
 * ✅ BUSCAR DETALHES DE UM TEMPLATE
 */
async function buscarTemplate(req, res) {
  try {
    const { id } = req.params;
    const contaId = req.usuario?.contaId;

    console.log(`🔍 [CONTROLADOR] Buscando template ${id} para conta ${contaId}`);

    const template = await prisma.templateWhatsApp.findFirst({
      where: {
        id,
        contaId
      }
    });

    if (!template) {
      console.log('❌ Template não encontrado');
      return res.status(404).json({
        sucesso: false,
        erro: 'Template não encontrado'
      });
    }

    console.log('✅ Template encontrado:', template.nomeTemplate);

    return res.status(200).json({
      sucesso: true,
      template
    });

  } catch (error) {
    console.error('❌ [CONTROLADOR] Erro ao buscar template:', error.message);
    return res.status(500).json({
      sucesso: false,
      erro: error.message || 'Erro ao buscar template'
    });
  }
}

// ✅ EXPORTAÇÃO CORRETA
module.exports = {
  listarTemplates,
  sincronizarTemplatesManual,
  buscarTemplate
};