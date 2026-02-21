// backend/teste-debug-webhook.js
// 🔍 Debug detalhado do webhook

require('dotenv').config();
const axios = require('axios');

async function testarWebhookDetalhado() {
  console.log('\n🔍 ===== DEBUG DETALHADO DO WEBHOOK =====\n');

  const payload = {
    object: 'whatsapp_business_account',
    entry: [{
      id: 'WABA_ID_TEST',
      changes: [{
        value: {
          messaging_product: 'whatsapp',
          metadata: {
            display_phone_number: '15556452732',
            phone_number_id: '822336220965826'
          },
          contacts: [{
            profile: { name: 'Cliente Teste Debug' },
            wa_id: '5511999999999'
          }],
          messages: [{
            from: '5511999999999',
            id: 'wamid.DEBUG_' + Date.now(),
            timestamp: Math.floor(Date.now() / 1000).toString(),
            type: 'text',
            text: {
              body: '🔍 TESTE DEBUG - ' + new Date().toLocaleTimeString()
            }
          }]
        },
        field: 'messages'
      }]
    }]
  };

  console.log('📤 Payload que será enviado:');
  console.log(JSON.stringify(payload, null, 2));
  console.log('\n⏳ Enviando para webhook...\n');

  try {
    const response = await axios.post(
      'http://localhost:3000/api/whatsapp/webhook',
      payload,
      {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 10000
      }
    );

    console.log('✅ Webhook respondeu:', response.status);
    console.log('\n📋 AGORA OLHE O TERMINAL DO BACKEND!');
    console.log('   Deve aparecer:');
    console.log('   📨 WEBHOOK: Nova notificação recebida');
    console.log('   📥 MENSAGEM RECEBIDA');
    console.log('   🔍 Processando mensagem...');
    console.log('   ✅ Mensagem salva no banco');
    console.log('\n⚠️ SE NÃO APARECER NADA NO TERMINAL DO BACKEND:');
    console.log('   → O webhook não está registrado corretamente');
    console.log('   → Verifique se o arquivo whatsapp.webhook.js existe em src/rotas/');
    console.log('   → Verifique se está registrado no servidor.js\n');

  } catch (error) {
    console.error('\n❌ ERRO ao chamar webhook:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Dados:', error.response.data);
    } else if (error.request) {
      console.error('Sem resposta do servidor');
      console.error('Verifique se o backend está rodando!');
    } else {
      console.error('Erro:', error.message);
    }
  }
}

testarWebhookDetalhado();