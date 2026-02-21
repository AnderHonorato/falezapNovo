// inserir-dados-FINAL.js
// Execute: node inserir-dados-FINAL.js

const { Client } = require('pg');

const config = {
  host: 'localhost',
  port: 5432,
  database: 'zapbox_db',
  user: 'postgres',
  password: '@honoratoann.23',
};

async function inserirDados() {
  const client = new Client(config);

  console.log('\n========================================');
  console.log('🚀 INSERINDO DADOS DE TESTE');
  console.log(`   Database: ${config.database}`);
  console.log('========================================\n');

  try {
    await client.connect();
    console.log('✅ Conectado ao PostgreSQL\n');

    // 1. Verificar/Criar conta
    let contaId;
    const { rows: contas } = await client.query('SELECT id FROM contas LIMIT 1');
    
    if (contas.length > 0) {
      contaId = contas[0].id;
      console.log('📦 Usando conta existente:', contaId);
    } else {
      const result = await client.query(`
        INSERT INTO contas (id, tipo, documento, email, ativo, "criadoEm", "atualizadoEm")
        VALUES (gen_random_uuid(), 'EMPRESA', '12345678000100', 'teste@empresa.com', true, NOW(), NOW())
        RETURNING id
      `);
      contaId = result.rows[0].id;
      console.log('✅ Conta criada:', contaId);
    }

    // 2. Verificar/Criar conexão
    let conexaoId;
    const { rows: conexoes } = await client.query(
      'SELECT id FROM conexoes_whatsapp WHERE "contaId" = $1 LIMIT 1',
      [contaId]
    );
    
    if (conexoes.length > 0) {
      conexaoId = conexoes[0].id;
      console.log('📱 Usando conexão existente:', conexaoId);
    } else {
      const result = await client.query(`
        INSERT INTO conexoes_whatsapp (id, "numeroWhatsapp", status, "contaId", "criadoEm", "atualizadoEm")
        VALUES (gen_random_uuid(), '5511999999999', 'CONECTADO', $1, NOW(), NOW())
        RETURNING id
      `, [contaId]);
      conexaoId = result.rows[0].id;
      console.log('✅ Conexão criada:', conexaoId);
    }

    console.log('\n📝 Processando conversas...');

    // 3. Inserir/Verificar conversas (SEM DUPLICAR)
    const conversasData = [
      { numero: '5511988888888', nome: 'João Silva', favorita: false, status: 'CAIXA_ENTRADA', naoLidas: 3 },
      { numero: '5511977777777', nome: 'Maria Santos', favorita: true, status: 'CAIXA_ENTRADA', naoLidas: 1 },
      { numero: '5511966666666', nome: 'Pedro Costa', favorita: false, status: 'FINALIZADA', naoLidas: 0 },
      { numero: '5511955555555', nome: 'Ana Paula', favorita: true, status: 'CAIXA_ENTRADA', naoLidas: 5 },
      { numero: '5511944444444', nome: 'Carlos Silva', favorita: false, status: 'ARQUIVADA', naoLidas: 0 },
    ];

    const conversasIds = [];

    for (const conv of conversasData) {
      // Verifica se já existe
      const { rows: existing } = await client.query(
        `SELECT id FROM conversas WHERE "contaId" = $1 AND "numeroCliente" = $2`,
        [contaId, conv.numero]
      );

      if (existing.length > 0) {
        conversasIds.push({ id: existing[0].id, ...conv });
        console.log(`   ⏭️  ${conv.nome} já existe`);
      } else {
        const result = await client.query(`
          INSERT INTO conversas (
            id, "numeroCliente", "nomeCliente", "conexaoWhatsAppId", "contaId",
            favorita, "statusConversa", "criadaEm", "atualizadaEm", "ultimaMensagemEm", "naoLidas"
          ) VALUES (
            gen_random_uuid(), $1, $2, $3, $4, $5, $6, NOW(), NOW(), NOW(), $7
          )
          RETURNING id
        `, [conv.numero, conv.nome, conexaoId, contaId, conv.favorita, conv.status, conv.naoLidas]);
        
        conversasIds.push({ id: result.rows[0].id, ...conv });
        console.log(`   ✅ ${conv.nome} criada`);
      }
    }

    console.log('\n💬 Processando mensagens...');

    // 4. Inserir mensagens (verificando duplicatas)
    const mensagensData = [
      { conversaIdx: 0, conteudo: 'Olá, tudo bem?', enviado: 'cliente', direcao: 'RECEBIDA', lida: false },
      { conversaIdx: 0, conteudo: 'Sim! Como posso ajudar?', enviado: 'atendente', direcao: 'ENVIADA', lida: true },
      { conversaIdx: 0, conteudo: 'Preciso de informações', enviado: 'cliente', direcao: 'RECEBIDA', lida: false },
      { conversaIdx: 1, conteudo: 'Oi! Gostaria de fazer um pedido', enviado: 'cliente', direcao: 'RECEBIDA', lida: false },
      { conversaIdx: 1, conteudo: 'Claro! Qual produto?', enviado: 'atendente', direcao: 'ENVIADA', lida: true },
      { conversaIdx: 2, conteudo: 'Obrigado!', enviado: 'cliente', direcao: 'RECEBIDA', lida: true },
    ];

    let msgInseridas = 0;
    let msgExistentes = 0;

    for (const msg of mensagensData) {
      const conversaId = conversasIds[msg.conversaIdx].id;

      // Verifica se mensagem já existe
      const { rows: existing } = await client.query(
        `SELECT id FROM mensagens WHERE "conversaId" = $1 AND conteudo = $2`,
        [conversaId, msg.conteudo]
      );

      if (existing.length === 0) {
        await client.query(`
          INSERT INTO mensagens (
            id, conteudo, "conversaId", "contaId", tipo, "enviadaPor",
            "criadaEm", "atualizadaEm", "enviadaEm", direcao, lida
          ) VALUES (
            gen_random_uuid(), $1, $2, $3, 'TEXTO', $4, NOW(), NOW(), NOW(), $5, $6
          )
        `, [
          msg.conteudo,
          conversaId,
          contaId,
          msg.enviado,
          msg.direcao,
          msg.lida
        ]);
        msgInseridas++;
      } else {
        msgExistentes++;
      }
    }

    console.log(`   ✅ ${msgInseridas} novas mensagens inseridas`);
    if (msgExistentes > 0) {
      console.log(`   ⏭️  ${msgExistentes} mensagens já existiam`);
    }

    // Verificar totais
    const { rows: [totalConv] } = await client.query('SELECT COUNT(*) FROM conversas');
    const { rows: [totalMsg] } = await client.query('SELECT COUNT(*) FROM mensagens');

    console.log('\n========================================');
    console.log('✅ PROCESSO CONCLUÍDO!');
    console.log('========================================');
    console.log(`📊 Total de conversas no banco: ${totalConv.count}`);
    console.log(`💬 Total de mensagens no banco: ${totalMsg.count}\n`);

    // Mostrar conversas
    const { rows: conversasList } = await client.query(`
      SELECT "numeroCliente", "nomeCliente", favorita, "statusConversa", "naoLidas"
      FROM conversas 
      ORDER BY "criadaEm" DESC 
      LIMIT 10
    `);

    console.log('📋 Conversas no sistema:');
    conversasList.forEach((c, i) => {
      const favIcon = c.favorita ? '⭐' : '  ';
      const statusIcon = c.statusConversa === 'CAIXA_ENTRADA' ? '📥' : 
                        c.statusConversa === 'FINALIZADA' ? '✅' : '📁';
      console.log(`   ${i + 1}. ${favIcon} ${statusIcon} ${c.nomeCliente} (${c.numeroCliente}) - ${c.naoLidas} não lidas`);
    });

    console.log('\n🔄 Próximos passos:');
    console.log('   1. Atualize a página no navegador (F5)');
    console.log('   2. As conversas devem aparecer');
    console.log('   3. Clique em uma conversa para ver as mensagens\n');

  } catch (error) {
    console.error('\n❌ ERRO:', error.message);
    console.error('\n📋 Verifique se o Prisma migrate foi executado:');
    console.error('   npx prisma migrate dev\n');
  } finally {
    await client.end();
  }
}

inserirDados();