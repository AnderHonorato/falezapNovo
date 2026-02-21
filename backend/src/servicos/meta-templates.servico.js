// backend/src/servicos/meta-templates.servico.js

const axios = require('axios');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * ✅ BUSCAR TEMPLATES DA META API
 */
async function buscarTemplatesDaMeta(conexaoId) {
  try {
    console.log('🔍 ==========================================');
    console.log('🔍 [META] Buscando templates da API...');
    console.log('==========================================');
    
    const conexao = await prisma.conexaoWhatsApp.findUnique({
      where: { id: conexaoId }
    });

    if (!conexao) {
      throw new Error('Conexão WhatsApp não encontrada');
    }

    console.log('✅ Conexão encontrada:', conexao.nomeInstancia || conexao.id);

    // 🔥 USAR AS VARIÁVEIS DO SEU .ENV
    const META_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN || process.env.META_ACCESS_TOKEN;
    const WABA_ID = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID || process.env.WABA_ID;
    const API_VERSION = process.env.WHATSAPP_API_VERSION || 'v21.0';

    if (!META_ACCESS_TOKEN) {
      throw new Error('WHATSAPP_ACCESS_TOKEN não configurado no .env');
    }

    if (!WABA_ID) {
      throw new Error('WHATSAPP_BUSINESS_ACCOUNT_ID não configurado no .env');
    }

    console.log('📡 Chamando Meta API...');
    console.log('   - WABA ID:', WABA_ID);
    console.log('   - API Version:', API_VERSION);

    // 🔥 BUSCAR TEMPLATES DA CONTA
    const url = `https://graph.facebook.com/${API_VERSION}/${WABA_ID}/message_templates`;
    
    const response = await axios.get(url, {
      headers: {
        'Authorization': `Bearer ${META_ACCESS_TOKEN}`
      },
      params: {
        fields: 'name,status,category,language,components,id',
        limit: 100
      },
      timeout: 30000
    });

    const templates = response.data.data || [];
    console.log(`✅ ${templates.length} templates encontrados na Meta`);

    if (templates.length === 0) {
      console.log('⚠️  Nenhum template encontrado. Verifique:');
      console.log('   1. Se você criou templates no Meta Business Suite');
      console.log('   2. Se o WABA_ID está correto');
      console.log('   3. Se o token tem permissão "whatsapp_business_management"');
    }

    // 🔥 SINCRONIZAR COM O BANCO
    const templatesSincronizados = [];

    for (const template of templates) {
      try {
        console.log(`\n📋 Template: ${template.name}`);
        console.log(`   - Status: ${template.status}`);
        console.log(`   - Categoria: ${template.category}`);
        console.log(`   - Linguagem: ${template.language}`);

        // Apenas templates APROVADOS
        if (template.status !== 'APPROVED') {
          console.log(`   ⏭️  Pulando (não aprovado)`);
          continue;
        }

        const templateData = {
          contaId: conexao.contaId,
          conexaoWhatsAppId: conexaoId,
          nomeTemplate: template.name,
          namespace: template.id,
          linguagem: template.language,
          categoria: template.category,
          status: template.status,
          componentes: template.components || [],
          ultimaSincEm: new Date()
        };

        // Upsert (cria ou atualiza)
        const templateSalvo = await prisma.templateWhatsApp.upsert({
          where: {
            conexaoWhatsAppId_nomeTemplate: {
              conexaoWhatsAppId: conexaoId,
              nomeTemplate: template.name
            }
          },
          update: {
            status: template.status,
            componentes: template.components || [],
            categoria: template.category,
            linguagem: template.language,
            namespace: template.id,
            ultimaSincEm: new Date()
          },
          create: templateData
        });

        templatesSincronizados.push(templateSalvo);
        console.log(`   ✅ Sincronizado no banco`);

      } catch (error) {
        console.error(`   ❌ Erro ao sincronizar "${template.name}":`, error.message);
      }
    }

    console.log('\n==========================================');
    console.log(`✅ Sincronização concluída: ${templatesSincronizados.length} templates`);
    console.log('==========================================\n');

    return {
      sucesso: true,
      total: templatesSincronizados.length,
      templates: templatesSincronizados
    };

  } catch (error) {
    console.error('\n❌ ==========================================');
    console.error('❌ ERRO AO BUSCAR TEMPLATES DA META');
    console.error('==========================================');
    
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Dados:', JSON.stringify(error.response.data, null, 2));
      
      if (error.response.status === 401) {
        console.error('\n⚠️  Token inválido ou expirado!');
        console.error('   Gere um novo token em: https://business.facebook.com/settings/system-users');
      }
      
      if (error.response.status === 403) {
        console.error('\n⚠️  Sem permissão!');
        console.error('   Verifique se o token tem a permissão "whatsapp_business_management"');
      }
    } else {
      console.error('Erro:', error.message);
    }
    
    console.error('==========================================\n');
    throw error;
  }
}

/**
 * ✅ BUSCAR TEMPLATES DO BANCO (COM CACHE)
 */
async function buscarTemplatesLocais(conexaoId) {
  try {
    const templates = await prisma.templateWhatsApp.findMany({
      where: {
        conexaoWhatsAppId: conexaoId,
        status: 'APPROVED'
      },
      orderBy: {
        nomeTemplate: 'asc'
      }
    });

    console.log(`📦 [CACHE] ${templates.length} templates no banco`);

    // Se não houver templates ou última sinc foi há mais de 1 hora, sincronizar
    const precisaSincronizar = templates.length === 0 || 
      templates.some(t => {
        const umHoraAtras = new Date(Date.now() - 60 * 60 * 1000);
        return new Date(t.ultimaSincEm) < umHoraAtras;
      });

    if (precisaSincronizar) {
      console.log('⏰ Cache expirado ou vazio, sincronizando...');
      const resultado = await buscarTemplatesDaMeta(conexaoId);
      return resultado.templates;
    }

    return templates;

  } catch (error) {
    console.error('❌ Erro ao buscar templates locais:', error.message);
    throw error;
  }
}

/**
 * ✅ FORÇAR SINCRONIZAÇÃO MANUAL
 */
async function sincronizarTemplates(conexaoId) {
  return await buscarTemplatesDaMeta(conexaoId);
}

module.exports = {
  buscarTemplatesDaMeta,
  buscarTemplatesLocais,
  sincronizarTemplates
};