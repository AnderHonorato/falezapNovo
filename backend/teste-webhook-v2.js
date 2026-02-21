// backend/teste-webhook.js
// 🧪 Testar se o webhook está recebendo mensagens

const axios = require('axios');

async function testarWebhook() {
  try {
    console.log('\n🧪 ===== TESTE DO WEBHOOK =====\n');
    
    // Simular payload que o Meta envia
    const payload = {
      object: 'whatsapp_business_account',
      entry: [{
        id: 'WABA_ID',
        changes: [{
          value: {
            messaging_product: 'whatsapp',
            metadata: {
              display_phone_number: '15556452732',
              phone_number_id: '822336220965826'
            },
            messages: [{
              from: '5511999999999',
              id: 'wamid.TESTE123456789',
              timestamp: Math.floor(Date.now() / 1000).toString(),
              type: 'text',
              text: {
                body: '🧪 Mensagem de teste do webhook'
              }
            }]
          },
          field: 'messages'
        }]
      }]
    };

    console.log('📤 Enviando POST para webhook...\n');
    
    const response = await axios.post(
      'http://localhost:3000/api/whatsapp/webhook',
      payload,
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ Webhook respondeu:', response.status);
    console.log('\n📋 Verifique o terminal do backend!');
    console.log('   Deve aparecer:');
    console.log('   📨 WEBHOOK: Nova notificação recebida');
    console.log('   📥 MENSAGEM RECEBIDA\n');
    console.log('=========================================\n');

  } catch (error) {
    console.error('\n❌ ERRO:');
    if (error.response) {
      console.error('📛 Status:', error.response.status);
      console.error('📛 Dados:', JSON.stringify(error.response.data, null, 2));
    } else if (error.request) {
      console.error('📛 Requisição não obteve resposta');
      console.error('📛 Verifique se o backend está rodando!');
      console.error('📛 Execute: npm start (em outro terminal)');
    } else {
      console.error('📛 Erro:', error.message);
      console.error('📛 Stack:', error.stack);
    }
    console.log('=========================================\n');
  }
}

testarWebhook();