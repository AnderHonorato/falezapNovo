// backend/src/controladores/mensagens.controlador.js - ✅ ADICIONADO MÉTODO DE TEMPLATE

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const whatsappOfficial = require('../servicos/whatsappOfficial.servico');
const midiaServico = require('../servicos/midia.servico');
const { obterTipoMidia, moverParaMedia, deletarArquivo } = require('../config/upload');
const socketServico = require('../servicos/socket.servico'); 
const path = require('path');
const fs = require('fs'); 
const vcardParser = require('vcard-parser');

// ✅ 1. VERIFIQUE ESTE CAMINHO
const baileysServico = require('../servicos/baileys.servico'); 
// (Seu serviço Baileys que contém 'getConexaoPorConta' e 'enviarTexto')

// ============================================
// FUNÇÕES AUXILIARES
// ============================================
// ... (garantirConversa, emitirSocket) ...
async function garantirConversa(contaId, numeroCliente, conversaIdParam = null) {
  let conversa;
  if (conversaIdParam) {
    conversa = await prisma.conversa.findFirst({
      where: { id: conversaIdParam, contaId: contaId },
      include: { conexaoWhatsApp: true }
    });
    if (conversa) return conversa;
  }
  conversa = await prisma.conversa.findFirst({
    where: { contaId: contaId, numeroCliente: numeroCliente },
    include: { conexaoWhatsApp: true }
  });
  if (conversa) return conversa;

  let conexao = await prisma.conexaoWhatsApp.findFirst({
    where: { contaId: contaId, status: 'CONECTADO' },
    orderBy: { atualizadoEm: 'desc' }
  });
  if (!conexao) {
    conexao = await prisma.conexaoWhatsApp.findFirst({
      where: { contaId: contaId },
      orderBy: { atualizadoEm: 'desc' }
    });
  }
  if (!conexao) {
    throw new Error('Nenhuma Conexão WhatsApp encontrada para esta conta.');
  }

  conversa = await prisma.conversa.create({
    data: {
      contaId: contaId,
      numeroCliente: numeroCliente,
      nomeContato: numeroCliente, 
      conexaoWhatsAppId: conexao.id,
      statusConversa: 'CAIXA_ENTRADA',
      naoLidas: 0
    },
    include: { conexaoWhatsApp: true }
  });
  return conversa;
}

function emitirSocket(sala, evento, payload) {
  if (!global.io) {
    console.error('❌ global.io NÃO EXISTE! Socket não pode ser emitido.');
    return;
  }
  const socketsNaSala = global.io.sockets.adapter.rooms.get(sala);
  const numClientes = socketsNaSala ? socketsNaSala.size : 0;
  console.log(`📡 Emitindo [${evento}] para sala [${sala}] (${numClientes} clientes)`);
  global.io.to(sala).emit(evento, payload);
}

// ============================================
// CLASSE DO CONTROLADOR
// ============================================

class MensagensControlador {

  // ============================================
  // ENVIAR MENSAGEM (API OFICIAL)
  // ============================================
  async enviarMensagem(req, res) {
    const { numero, mensagem, quotedMsgId, formatacoes, conversaId } = req.body;
    const { contaId, id: usuarioId, nome: nomeUsuario } = req.usuario;
    let mensagemSalva = null; 

    try {
      console.log('\n📤 ==========================================');
      console.log('📤 [CONTROLADOR] ENVIANDO MENSAGEM (OFICIAL)');
      console.log('==========================================');
      console.log('   - contaId:', contaId);
      console.log('   - numero:', numero);

      if (!contaId || !numero || !mensagem) {
        return res.status(400).json({ sucesso: false, erro: 'Conta, número e mensagem obrigatórios' });
      }
      
      const conversa = await garantirConversa(contaId, numero, conversaId);
      console.log('✅ Conversa OK:', conversa.id);

      let mensagemCitada = null;
      if (quotedMsgId) {
        mensagemCitada = await prisma.mensagem.findFirst({
          where: { whatsappId: quotedMsgId }
        });
      }

      mensagemSalva = await prisma.mensagem.create({
        data: {
          whatsappId: null, 
          contaId: contaId,
          conversaId: conversa.id,
          usuarioId: usuarioId,
          conteudo: mensagem,
          tipo: 'TEXTO',
          direcao: 'ENVIADA',
          enviadaPor: nomeUsuario || 'Sistema',
          enviadaEm: new Date(),
          timestamp: new Date(),
          statusMensagem: 'ENVIANDO', 
          lida: true,
          formatacao: formatacoes ? JSON.stringify(formatacoes) : null,
          replyParaId: mensagemCitada?.id || null,
          mensagemCitadaAutor: mensagemCitada?.remetenteNome || null,
          mensagemCitadaConteudo: mensagemCitada?.conteudo || null
        }
      });
      console.log('✅ Mensagem pré-salva:', mensagemSalva.id);

      let textoFormatado = mensagem;
      if (formatacoes && formatacoes.length > 0) {
        textoFormatado = whatsappOfficial.aplicarFormatacao(mensagem, formatacoes);
      }
      
      const resultado = await whatsappOfficial.enviarTexto(numero, textoFormatado, quotedMsgId);

      if (!resultado.success) {
        if (resultado.erro && resultado.erro.includes('janela de 24h')) {
          throw new Error('FALHA_JANELA_24H');
        }
        throw new Error(resultado.error || 'Falha ao enviar pelo WhatsApp');
      }
      console.log('✅ WhatsApp API OK:', resultado.messageId);

      const mensagemAtualizada = await prisma.mensagem.update({
        where: { id: mensagemSalva.id },
        data: {
          whatsappId: resultado.messageId,
          statusMensagem: 'ENVIADA'
        }
      });

      await prisma.conversa.update({
        where: { id: conversa.id },
        data: { 
          ultimaMensagemEm: new Date(),
          arquivada: false,
          statusConversa: 'CAIXA_ENTRADA'
        }
      });
      console.log('✅ Conversa atualizada e desarquivada');

      const sala = `conta:${contaId}`;
      const payload = {
        mensagem: {
          ...mensagemAtualizada,
          mensagem: mensagemAtualizada.conteudo, 
          fromMe: true
        },
        conversa: {
          id: conversa.id,
          numeroCliente: conversa.numeroCliente,
          nomeCliente: conversa.nomeContato, 
          contaId: conversa.contaId
        }
      };
      emitirSocket(sala, 'nova_mensagem', payload);

      console.log('==========================================\n');

      res.json({
        sucesso: true,
        mensagem: mensagemAtualizada,
        whatsappMessageId: resultado.messageId
      });

    } catch (erro) {
      console.error('❌ ERRO AO ENVIAR MENSAGEM:', erro.message);
      
      let statusErroFinal = 'ERRO';
      if(erro.message.includes('FALHA_JANELA_24H') || erro.message.includes('132001')) {
              statusErroFinal = 'FALHA_JANELA_24H';
            }

      if (mensagemSalva && mensagemSalva.id) {
        const msgErro = await prisma.mensagem.update({
          where: { id: mensagemSalva.id },
          data: { statusMensagem: statusErroFinal }
        });
        
        emitirSocket(`conta:${contaId}`, 'mensagem_status_atualizada', {
            conversaId: msgErro.conversaId,
            whatsappId: msgErro.whatsappId,
            id: msgErro.id, 
            status: statusErroFinal,
            lida: false
        });
      }
      res.status(500).json({ sucesso: false, erro: erro.message });
    }
  }
  
  // ==================================================
  // ✅ FUNÇÃO: ENVIAR PELA ALTERNATIVA (BAILEYS)
  // ==================================================
async enviarMensagemAlternativa(req, res) {
  const { numero, mensagem, conversaId, mensagemIdAntiga } = req.body;
  const { contaId, id: usuarioId, nome: nomeUsuario } = req.usuario;

  let mensagemSalva = null;

  try {
    console.log('\n📤 ==========================================');
    console.log('📤 [CONTROLADOR] ENVIANDO MENSAGEM (ALTERNATIVA)');
    console.log('==========================================');

    if (!contaId || !numero || !mensagem || !conversaId) {
      return res.status(400).json({ sucesso: false, erro: 'Conta, número, ID da conversa e mensagem obrigatórios' });
    }
    
    // ✅ CORREÇÃO: Obter conversa para pegar a instância correta
    const conversa = await prisma.conversa.findUnique({
      where: { id: conversaId },
      include: { conexaoWhatsApp: true }
    });
    
    if (!conversa || !conversa.conexaoWhatsApp) {
      throw new Error('Conversa ou conexão WhatsApp não encontrada');
    }
    
    const instancia = conversa.conexaoWhatsApp.instancia || 1;
    
    // ✅ CORREÇÃO: Verificar se o Baileys está conectado
    const chave = baileysServico.gerarChaveCliente(contaId, instancia);
    const clienteBaileys = baileysServico.clientes[chave];
    
    if (!clienteBaileys || clienteBaileys.estado !== 'conectado') {
      throw new Error('Conexão alternativa (Baileys) não encontrada ou não conectada.');
    }
    
    console.log(`✅ Baileys conectado: ${chave}`);

    mensagemSalva = await prisma.mensagem.create({
      data: {
        contaId: contaId,
        conversaId: conversaId,
        usuarioId: usuarioId,
        conteudo: mensagem,
        tipo: 'TEXTO',
        direcao: 'ENVIADA',
        enviadaPor: nomeUsuario || 'Sistema',
        enviadaEm: new Date(),
        timestamp: new Date(),
        statusMensagem: 'ENVIANDO', 
        lida: true,
      }
    });
    console.log('✅ Mensagem (Alternativa) pré-salva:', mensagemSalva.id);

    // ✅ CORREÇÃO: Chamar função correta do Baileys
    const numeroFormatado = numero.includes('@s.whatsapp.net') ? numero : `${numero}@s.whatsapp.net`;
    
    const resultado = await baileysServico.enviarMensagem(
      contaId,
      instancia,
      numeroFormatado,
      mensagem,
      null // quotedMsgId
    );
    
    if (!resultado.sucesso) {
      throw new Error(resultado.erro || 'Falha ao enviar pelo Baileys');
    }
    
    console.log('✅ Baileys API OK:', resultado.messageId);

    const mensagemAtualizada = await prisma.mensagem.update({
      where: { id: mensagemSalva.id },
      data: {
        whatsappId: resultado.messageId, 
        statusMensagem: 'ENVIADA'
      }
    });

    await prisma.conversa.update({
      where: { id: conversaId },
      data: { 
        ultimaMensagemEm: new Date(),
        arquivada: false,
        statusConversa: 'CAIXA_ENTRADA'
      }
    });
    console.log('✅ Conversa (Alternativa) atualizada e desarquivada');

    // ✅ Deletar mensagem antiga com erro
    if (mensagemIdAntiga) {
      await prisma.mensagem.delete({
        where: { id: mensagemIdAntiga }
      }).catch(err => console.log('⚠️ Mensagem antiga já foi deletada:', err.message));
      console.log('✅ Mensagem antiga com falha deletada:', mensagemIdAntiga);
    }

    const sala = `conta:${contaId}`;
    const payload = {
      mensagem: {
        ...mensagemAtualizada,
        mensagem: mensagemAtualizada.conteudo, 
        fromMe: true
      },
      conversa: {
        id: conversa.id,
        numeroCliente: conversa.numeroCliente,
        nomeCliente: conversa.nomeContato, 
        contaId: conversa.contaId
      }
    };
    emitirSocket(sala, 'nova_mensagem', payload);
    
    if (mensagemIdAntiga) {
      emitirSocket(sala, 'mensagem_deletada', { id: mensagemIdAntiga, conversaId: conversaId });
    }

    res.json({
      sucesso: true,
      mensagem: mensagemAtualizada,
      whatsappMessageId: resultado.messageId
    });

  } catch (erro) {
    console.error('❌ ERRO AO ENVIAR MENSAGEM (ALTERNATIVA):', erro.message);
    if (mensagemSalva && mensagemSalva.id) {
      await prisma.mensagem.update({
        where: { id: mensagemSalva.id },
        data: { statusMensagem: 'ERRO' }
      });
    }
    res.status(500).json({ sucesso: false, erro: erro.message });
  }
}

// ============================================
  // ✅ FUNÇÃO CORRIGIDA: ENVIAR TEMPLATE
  // ============================================
  async enviarMensagemTemplate(req, res) {
    // ✅ 1. RECEBER OS CAMPOS CORRETOS ENVIADOS PELO FRONTEND
    const { 
      numero, 
      conversaId, 
      nomeTemplate, 
      templateId, // O frontend está enviando isso
      variaveis   // O frontend está enviando isso (como um array)
    } = req.body;
    const { contaId, id: usuarioId, nome: nomeUsuario } = req.usuario;
    let mensagemSalva = null;

    try {
      console.log('\n📤 ==========================================');
      console.log('📤 [CONTROLADOR] ENVIANDO TEMPLATE');
      console.log('==========================================');
      console.log('   - Template:', nomeTemplate);
      console.log('   - Para:', numero);
      console.log('   - Variaveis Recebidas:', variaveis);

      // ✅ 2. ATUALIZAR A VALIDAÇÃO
      if (!numero || !conversaId || !nomeTemplate || !variaveis) {
        return res.status(400).json({ 
          sucesso: false, 
          erro: 'Campos obrigatórios ausentes (numero, conversaId, nomeTemplate, variaveis)' 
        });
      }

      // ✅ 3. VALIDAR SE 'variaveis' É UM ARRAY
      if (!Array.isArray(variaveis)) {
        return res.status(400).json({ 
          sucesso: false, 
          erro: 'O campo "variaveis" deve ser um array.' 
        });
      }

      const conversa = await garantirConversa(contaId, numero, conversaId);
      console.log('✅ Conversa OK:', conversa.id);

      // ✅ 4. USAR O ARRAY 'variaveis' DIRETAMENTE
      const parametrosBody = variaveis;
      const componentes = [
        whatsappOfficial.criarComponenteBody(parametrosBody)
      ];
      
     let estruturaCompleta = null;
    try {
      const templateDB = await prisma.template.findFirst({
        where: { nomeTemplate: nomeTemplate }
      });
      
      if (templateDB && templateDB.componentes) {
        const componentes = typeof templateDB.componentes === 'string' 
          ? JSON.parse(templateDB.componentes) 
          : templateDB.componentes;
        
        // Aplicar variáveis nos componentes
        const componentesPreenchidos = componentes.map(comp => {
          if (comp.type === 'BODY' && comp.text) {
            let texto = comp.text;
            variaveis.forEach((valor, index) => {
              texto = texto.replace(`{{${index + 1}}}`, valor);
            });
            return { ...comp, text: texto };
          }
          return comp;
        });
        
        estruturaCompleta = {
          nomeTemplate: nomeTemplate,
          componentes: componentesPreenchidos
        };
      }
    } catch (e) {
      console.warn('⚠️ Não foi possível buscar estrutura do template:', e.message);
    }

    // Salvar como JSON se tiver estrutura, senão como texto simples
    const conteudoMsg = estruturaCompleta 
      ? JSON.stringify(estruturaCompleta)
      : `Template: ${nomeTemplate}\nValores: ${variaveis.join(', ')}`;

    mensagemSalva = await prisma.mensagem.create({
      data: {
        whatsappId: null,
        contaId: contaId,
        conversaId: conversa.id,
        usuarioId: usuarioId,
        conteudo: conteudoMsg,
        tipo: 'TEMPLATE',
          direcao: 'ENVIADA',
          enviadaPor: nomeUsuario || 'Sistema',
          enviadaEm: new Date(),
          timestamp: new Date(),
          statusMensagem: 'ENVIANDO',
          lida: true,
        }
      });
      console.log('✅ Mensagem (Template) pré-salva:', mensagemSalva.id);

      // 3. Enviar pela API Oficial
      const resultado = await whatsappOfficial.enviarTemplate(
        numero,
        nomeTemplate,
        'en_US', // Ou o idioma do seu template
        componentes
      );

      if (!resultado.success || !resultado.messageId) {
        throw new Error(resultado.error || 'Falha ao enviar template pelo WhatsApp');
      }
      console.log('✅ WhatsApp API OK:', resultado.messageId);

      // 4. Atualizar mensagem no banco com o ID
      const mensagemAtualizada = await prisma.mensagem.update({
        where: { id: mensagemSalva.id },
        data: {
          whatsappId: resultado.messageId,
          statusMensagem: 'ENVIADA'
        }
      });

      // 5. Atualizar conversa (desarquivar, etc.)
      await prisma.conversa.update({
        where: { id: conversa.id },
        data: {
          ultimaMensagemEm: new Date(),
          arquivada: false,
          statusConversa: 'CAIXA_ENTRADA'
        }
      });
      console.log('✅ Conversa atualizada e desarquivada');

      // 6. Emitir Socket
      const sala = `conta:${contaId}`;
      const payload = {
        mensagem: {
          ...mensagemAtualizada,
          mensagem: mensagemAtualizada.conteudo,
          fromMe: true
        },
        conversa: {
          id: conversa.id,
          numeroCliente: conversa.numeroCliente,
          nomeCliente: conversa.nomeContato,
          contaId: conversa.contaId
        }
      };
      emitirSocket(sala, 'nova_mensagem', payload);

      console.log('==========================================\n');

      res.json({
        sucesso: true,
        mensagem: mensagemAtualizada,
        whatsappMessageId: resultado.messageId
      });

    } catch (erro) {
      console.error('❌ ERRO AO ENVIAR TEMPLATE:', erro.message);
      
      if (mensagemSalva && mensagemSalva.id) {
        await prisma.mensagem.update({
          where: { id: mensagemSalva.id },
          data: { statusMensagem: 'ERRO' }
        });
      }
      res.status(500).json({ sucesso: false, erro: erro.message });
    }
  }

  // ============================================
  // FUNÇÕES DE LEITURA E AÇÃO (Sem alterações)
  // ============================================
  async obterMensagensConversa(req, res) {
    try {
      const { conversaId } = req.params;
      const { limite, offset = 0 } = req.query; 
      const { contaId } = req.usuario;
      const conversa = await prisma.conversa.findFirst({
        where: { id: conversaId, contaId: contaId }
      });
      if (!conversa) {
        return res.status(404).json({ sucesso: false, erro: 'Conversa não encontrada' });
      }
      const findOptions = {
        where: { conversaId: conversaId, apagada: false },
        orderBy: [{ timestamp: 'asc' }, { enviadaEm: 'asc' }],
        skip: parseInt(offset),
        include: {
          reacoes: { include: { usuario: { select: { id: true, nome: true, avatar: true } } } },
          usuario: { select: { id: true, nome: true, avatar: true } },
        }
      };
      if (limite) {
        findOptions.take = parseInt(limite);
      }
      const [mensagens, total] = await Promise.all([
        prisma.mensagem.findMany(findOptions),
        prisma.mensagem.count({ where: { conversaId: conversaId, apagada: false } })
      ]);
      const mensagensProcessadas = mensagens.map(msg => ({
        ...msg,
        formatacao: msg.formatacao ? JSON.parse(msg.formatacao) : null
      }));
      res.json({
        sucesso: true,
        mensagens: mensagensProcessadas,
        total: total,
        temMais: limite ? (parseInt(offset) + mensagens.length) < total : false
      });
    } catch (erro) {
      console.error('❌ Erro ao obter mensagens:', erro);
      res.status(500).json({ sucesso: false, erro: erro.message });
    }
  }

  async marcarComoLida(req, res) {
    try {
      const { conversaId } = req.params;
      const mensagensNaoLidas = await prisma.mensagem.findMany({
        where: { conversaId: conversaId, direcao: 'RECEBIDA', lida: false },
        select: { id: true, whatsappId: true }
      });
      for (const msg of mensagensNaoLidas) {
        if (msg.whatsappId) {
          whatsappOfficial.marcarComoLida(msg.whatsappId)
            .catch(err => console.error(`[MarkRead] Erro ao marcar ${msg.whatsappId} na API:`, err.message));
        }
      }
      const resultado = await prisma.mensagem.updateMany({
        where: { conversaId: conversaId, direcao: 'RECEBIDA', lida: false },
        data: { lida: true, lidaEm: new Date(), statusMensagem: 'LIDA' }
      });
      await prisma.conversa.update({
        where: { id: conversaId },
        data: { naoLidas: 0 }
      });
      res.json({ sucesso: true, mensagem: 'Mensagens marcadas como lidas', total: resultado.count });
    } catch (erro) {
      console.error('❌ Erro ao marcar como lida:', erro);
      res.status(500).json({ sucesso: false, erro: erro.message });
    }
  }

  async enviarReacao(req, res) {
    try {
      const { mensagemId, emoji } = req.body;
      const { contaId, id: usuarioId } = req.usuario;
      const mensagem = await prisma.mensagem.findFirst({
        where: { id: mensagemId, contaId: contaId },
        include: { conversa: true }
      });
      if (!mensagem) {
        return res.status(404).json({ sucesso: false, erro: 'Mensagem não encontrada' });
      }
      if (mensagem.whatsappId) {
        await whatsappOfficial.enviarReacao(mensagem.conversa.numeroCliente, mensagem.whatsappId, emoji);
      }
      const reacaoExistente = await prisma.reacao.findFirst({
        where: { mensagemId: mensagemId, usuarioId: usuarioId }
      });
      if (reacaoExistente) {
        await prisma.reacao.update({ where: { id: reacaoExistente.id }, data: { emoji: emoji } });
      } else {
        await prisma.reacao.create({ data: { mensagemId: mensagemId, usuarioId: usuarioId, emoji: emoji } });
      }
      res.json({ sucesso: true, mensagem: 'Reação enviada' });
    } catch (erro) {
      console.error('❌ Erro ao enviar reação:', erro);
      res.status(500).json({ sucesso: false, erro: erro.message });
    }
  }

  async removerReacao(req, res) {
    try {
      const { mensagemId } = req.params;
      const { contaId, id: usuarioId } = req.usuario;
      const mensagem = await prisma.mensagem.findFirst({
        where: { id: mensagemId, contaId: contaId },
        include: { conversa: true }
      });
      if (!mensagem) {
        return res.status(404).json({ sucesso: false, erro: 'Mensagem não encontrada' });
      }
      if (mensagem.whatsappId) {
        await whatsappOfficial.removerReacao(mensagem.conversa.numeroCliente, mensagem.whatsappId);
      }
      await prisma.reacao.deleteMany({
        where: { mensagemId: mensagemId, usuarioId: usuarioId }
      });
      res.json({ sucesso: true, mensagem: 'Reação removida' });
    } catch (erro) {
      console.error('❌ Erro ao remover reação:', erro);
      res.status(500).json({ sucesso: false, erro: erro.message });
    }
  }

  async pesquisarMensagens(req, res) {
    try {
      const { termo, conversaId } = req.query;
      const { contaId } = req.usuario;
      if (!termo || termo.trim().length < 2) {
        return res.status(400).json({ sucesso: false, erro: 'Termo de pesquisa deve ter pelo menos 2 caracteres' });
      }
      const where = {
        contaId: contaId,
        conteudo: { contains: termo, mode: 'insensitive' },
        apagada: false
      };
      if (conversaId) {
        where.conversaId = conversaId;
      }
      const mensagens = await prisma.mensagem.findMany({
        where,
        include: { conversa: { select: { id: true, nomeContato: true, numeroCliente: true, foto_perfil: true } } },
        orderBy: { enviadaEm: 'desc' },
        take: 100
      });
      res.json({ sucesso: true, mensagens: mensagens, total: mensagens.length });
    } catch (erro) {
      console.error('❌ Erro ao pesquisar mensagens:', erro);
      res.status(500).json({ sucesso: false, erro: erro.message });
    }
  }

  async obterStatusLeitura(req, res) {
    try {
      const { mensagemId } = req.params;
      const mensagem = await prisma.mensagem.findUnique({
        where: { id: mensagemId },
        select: { statusMensagem: true, lida: true, lidaEm: true }
      });
      if (!mensagem) {
        return res.status(404).json({ sucesso: false, erro: 'Mensagem não encontrada' });
      }
      res.json({ sucesso: true, status: mensagem.statusMensagem, lida: mensagem.lida, lidaEm: mensagem.lidaEm });
    } catch (erro) {
      console.error('❌ Erro ao obter status:', erro);
      res.status(500).json({ sucesso: false, erro: erro.message });
    }
  }

  async deletarMensagem(req, res) {
    try {
      const { mensagemId } = req.params;
      const { paraQuem } = req.body;
      const { contaId } = req.usuario;
      const mensagem = await prisma.mensagem.findUnique({
        where: { id: mensagemId },
        include: { conversa: true }
      });
      if (!mensagem) {
        return res.status(404).json({ sucesso: false, erro: 'Mensagem não encontrada' });
      }
      if (mensagem.conversa.contaId !== contaId) {
        return res.status(403).json({ sucesso: false, erro: 'Sem permissão' });
      }
      if (paraQuem === 'todos') {
        const agora = new Date();
        const enviadaEm = new Date(mensagem.enviadaEm);
        const diferencaHoras = (agora - enviadaEm) / (1000 * 60 * 60);
        if (diferencaHoras > 48 || mensagem.direcao !== 'ENVIADA') {
          return res.status(400).json({ sucesso: false, erro: 'Só é possível deletar para todos dentro de 48h e mensagens enviadas' });
        }
        await prisma.mensagem.update({
          where: { id: mensagemId },
          data: { apagada: true, apagadaParaTodos: true, apagadaEm: new Date(), conteudo: 'Esta mensagem foi apagada', tipo: 'SISTEMA' }
        });
      } else {
        await prisma.mensagem.update({
          where: { id: mensagemId },
          data: { apagada: true, apagadaEm: new Date() }
        });
      }
      res.json({ sucesso: true, mensagem: paraQuem === 'todos' ? 'Mensagem deletada para todos' : 'Mensagem deletada para você' });
    } catch (erro) {
      console.error('❌ Erro ao deletar mensagem:', erro);
      res.status(500).json({ sucesso: false, erro: erro.message });
    }
  }

  async editarMensagem(req, res) {
    try {
      const { mensagemId } = req.params;
      const { novoConteudo } = req.body;
      const { contaId } = req.usuario;
      const mensagem = await prisma.mensagem.findUnique({
        where: { id: mensagemId },
        include: { conversa: true }
      });
      if (!mensagem) {
        return res.status(404).json({ sucesso: false, erro: 'Mensagem não encontrada' });
      }
      if (mensagem.conversa.contaId !== contaId) {
        return res.status(403).json({ sucesso: false, erro: 'Sem permissão' });
      }
      if (mensagem.direcao !== 'ENVIADA') {
        return res.status(400).json({ sucesso: false, erro: 'Só é possível editar mensagens enviadas' });
      }
      const agora = new Date();
      const enviadaEm = new Date(mensagem.enviadaEm);
      const diferencaMinutos = (agora - enviadaEm) / (1000 * 60);
      if (diferencaMinutos > 15) {
        return res.status(400).json({ sucesso: false, erro: 'Só é possível editar mensagens dentro de 15 minutos' });
      }
      await prisma.mensagem.update({
        where: { id: mensagemId },
        data: { conteudo: novoConteudo, editada: true, editadaEm: new Date() }
      });
      res.json({ sucesso: true, mensagem: 'Mensagem editada com sucesso' });
    } catch (erro) {
      console.error('❌ Erro ao editar mensagem:', erro);
      res.status(500).json({ sucesso: false, erro: erro.message });
    }
  }

  async fixarMensagem(req, res) {
    try {
      const { mensagemId } = req.params;
      const { contaId } = req.usuario;
      const mensagem = await prisma.mensagem.findUnique({
        where: { id: mensagemId },
        include: { conversa: true }
      });
      if (!mensagem) {
        return res.status(404).json({ sucesso: false, erro: 'Mensagem não encontrada' });
      }
      if (mensagem.conversa.contaId !== contaId) {
        return res.status(403).json({ sucesso: false, erro: 'Sem permissão' });
      }
      await prisma.mensagem.update({
        where: { id: mensagemId },
        data: { fixada: !mensagem.fixada, fixadaEm: !mensagem.fixada ? new Date() : null }
      });
      res.json({ sucesso: true, mensagem: mensagem.fixada ? 'Mensagem desfixada' : 'Mensagem fixada' });
    } catch (erro) {
      console.error('❌ Erro ao fixar mensagem:', erro);
      res.status(500).json({ sucesso: false, erro: erro.message });
    }
  }
  
  async favoritarMensagem(req, res) {
    try {
      const { mensagemId } = req.params;
      const { contaId } = req.usuario;
      const mensagem = await prisma.mensagem.findFirst({
        where: { id: mensagemId, contaId: contaId }
      });
      if (!mensagem) {
        return res.status(404).json({ sucesso: false, erro: 'Mensagem não encontrada ou sem permissão' });
      }
      const mensagemAtualizada = await prisma.mensagem.update({
        where: { id: mensagemId },
        data: { favorita: !mensagem.favorita }
      });
      res.json({ sucesso: true, mensagem: mensagemAtualizada.favorita ? 'Mensagem favoritada' : 'Mensagem desfavoritada', favorita: mensagemAtualizada.favorita });
    } catch (erro) {
      console.error('❌ Erro ao favoritar mensagem:', erro);
      res.status(500).json({ sucesso: false, erro: erro.message });
    }
  }

  // ============================================
  // FUNÇÕES DE ENVIO DE MÍDIA (Com Correção de Desarquivar)
  // ============================================

async enviarImagem(req, res) {
    const { numero, legenda } = req.body;
    const { contaId, id: usuarioId, nome: nomeUsuario } = req.usuario;
    const arquivo = req.file;
    let mensagemSalva = null;
    let caminhoProcessado = null;
    let caminhoThumb = null;
    // ✅ PASSO 1: Precisa da 'conversa' no escopo
    let conversa = null; 
    try {
      if (!numero || !arquivo) {
        if (arquivo) deletarArquivo(arquivo.path); 
        return res.status(400).json({ sucesso: false, erro: 'Número e imagem são obrigatórios' });
      }
      caminhoProcessado = arquivo.path; 
      
      // ✅ PASSO 2: Atribui a 'conversa'
      conversa = await garantirConversa(contaId, numero);

      mensagemSalva = await prisma.mensagem.create({
        // ... (dados da mensagem) ...
        data: {
          contaId: contaId,
          conversaId: conversa.id,
          usuarioId: usuarioId,
          conteudo: legenda || null,
          tipo: 'IMAGEM',
          direcao: 'ENVIADA',
          enviadaPor: nomeUsuario || 'Sistema',
          enviadaEm: new Date(),
          timestamp: new Date(),
          statusMensagem: 'ENVIANDO',
          lida: true,
          mediaNome: arquivo.originalname,
          mediaMimeType: arquivo.mimetype,
          mediaSize: arquivo.size,
          legendaImagem: legenda || null
        }
      });
      // ... (processamento de imagem e envio para a Meta) ...
      const imgProc = await midiaServico.processarImagem(caminhoProcessado, arquivo.filename);
      caminhoProcessado = imgProc.caminhoProcessado; 
      caminhoThumb = imgProc.caminhoThumb;
      const urlImagem = midiaServico.obterUrlPublica(path.basename(caminhoProcessado));
      const urlThumb = midiaServico.obterUrlPublica(path.basename(caminhoThumb));
      
      const resultado = await whatsappOfficial.enviarImagem(numero, urlImagem, legenda || '');
      if (!resultado.success) {
        throw new Error(resultado.error || 'Erro ao enviar imagem pelo WhatsApp');
      }

      const mensagemAtualizada = await prisma.mensagem.update({
        // ... (atualização da mensagem) ...
        where: { id: mensagemSalva.id },
        data: {
          whatsappId: resultado.messageId,
          statusMensagem: 'ENVIADA',
          mediaUrl: urlImagem,
          mediaThumbUrl: urlThumb,
          mediaSize: imgProc.tamanho,
          mediaLargura: imgProc.largura,
          mediaAltura: imgProc.altura,
        }
      });
      await prisma.conversa.update({
        // ... (atualização da conversa) ...
        where: { id: conversa.id },
        data: { 
          ultimaMensagemEm: new Date(),
          arquivada: false,
          statusConversa: 'CAIXA_ENTRADA'
        }
      });

      // ✅ PASSO 3: ADICIONAR O EMITTERSOCKET AQUI
      const sala = `conta:${contaId}`;
      const payload = {
        mensagem: {
          ...mensagemAtualizada,
          mensagem: mensagemAtualizada.conteudo,
          fromMe: true
        },
        conversa: {
          id: conversa.id,
          numeroCliente: conversa.numeroCliente,
          nomeCliente: conversa.nomeContato, 
          contaId: conversa.contaId
        }
      };
      emitirSocket(sala, 'nova_mensagem', payload);
      // ✅ FIM DA ADIÇÃO

      res.json({ sucesso: true, mensagem: mensagemAtualizada });
    } catch (erro) {
      // ... (catch block) ...
      console.error('❌ Erro ao enviar imagem:', erro.message);
      if (mensagemSalva) {
        await prisma.mensagem.update({ where: { id: mensagemSalva.id }, data: { statusMensagem: 'ERRO' } });
      }
      if (caminhoProcessado && caminhoProcessado !== arquivo.path) deletarArquivo(caminhoProcessado);
      if (caminhoThumb) deletarArquivo(caminhoThumb);
      if (arquivo) deletarArquivo(arquivo.path); 
      res.status(500).json({ sucesso: false, erro: erro.message });
    }
  }

  async enviarVideo(req, res) {
    const { numero, legenda } = req.body;
    const { contaId, id: usuarioId, nome: nomeUsuario } = req.usuario;
    const arquivo = req.file;
    let mensagemSalva = null;
    let caminhoProcessado = null;
    let caminhoThumb = null;
    try {
      if (!numero || !arquivo) {
        if (arquivo) deletarArquivo(arquivo.path);
        return res.status(400).json({ sucesso: false, erro: 'Número e vídeo são obrigatórios' });
      }
      caminhoProcessado = arquivo.path; 
      const conversa = await garantirConversa(contaId, numero);
      mensagemSalva = await prisma.mensagem.create({
        data: {
          contaId: contaId,
          conversaId: conversa.id,
          usuarioId: usuarioId,
          conteudo: legenda || null,
          tipo: 'VIDEO',
          direcao: 'ENVIADA',
          enviadaPor: nomeUsuario || 'Sistema',
          enviadaEm: new Date(),
          timestamp: new Date(),
          statusMensagem: 'ENVIANDO',
          lida: true,
          mediaNome: arquivo.originalname,
          mediaMimeType: arquivo.mimetype,
          mediaSize: arquivo.size,
        }
      });
      caminhoProcessado = moverParaMedia(caminhoProcessado, arquivo.filename); 
      const vidProc = await midiaServico.processarVideo(caminhoProcessado, arquivo.filename);
      caminhoThumb = vidProc.caminhoThumb;
      if (vidProc.tamanho > 16 * 1024 * 1024) {
        throw new Error('Vídeo muito grande. Limite: 16MB');
      }
      const urlVideo = midiaServico.obterUrlPublica(path.basename(caminhoProcessado));
      const urlThumb = caminhoThumb ? midiaServico.obterUrlPublica(path.basename(caminhoThumb)) : null;
      
      const resultado = await whatsappOfficial.enviarVideo(numero, urlVideo, legenda || '');
      if (!resultado.success) {
        throw new Error(resultado.error || 'Erro ao enviar vídeo pelo WhatsApp');
      }

      const mensagemAtualizada = await prisma.mensagem.update({
        where: { id: mensagemSalva.id },
        data: {
          whatsappId: resultado.messageId,
          statusMensagem: 'ENVIADA',
          mediaUrl: urlVideo,
          mediaThumbUrl: urlThumb,
          mediaSize: vidProc.tamanho,
          mediaLargura: vidProc.largura,
          mediaAltura: vidProc.altura,
          mediaDuracao: vidProc.duracao,
        }
      });
      await prisma.conversa.update({
        where: { id: conversa.id },
        data: { 
          ultimaMensagemEm: new Date(),
          arquivada: false,
          statusConversa: 'CAIXA_ENTRADA'
        }
      });
      res.json({ sucesso: true, mensagem: mensagemAtualizada });
    } catch (erro) {
      console.error('❌ Erro ao enviar vídeo:', erro.message);
      if (mensagemSalva) {
        await prisma.mensagem.update({ where: { id: mensagemSalva.id }, data: { statusMensagem: 'ERRO' } });
      }
      if (caminhoProcessado && caminhoProcessado !== arquivo.path) deletarArquivo(caminhoProcessado);
      if (caminhoThumb) deletarArquivo(caminhoThumb);
      if (arquivo) deletarArquivo(arquivo.path);
      res.status(500).json({ sucesso: false, erro: erro.message });
    }
  }

  async enviarAudio(req, res) {
    const { numero } = req.body;
    const { contaId, id: usuarioId, nome: nomeUsuario } = req.usuario;
    const arquivo = req.file;
    let mensagemSalva = null;
    let caminhoProcessado = null;
    try {
      if (!numero || !arquivo) {
        if (arquivo) deletarArquivo(arquivo.path);
        return res.status(400).json({ sucesso: false, erro: 'Número e áudio são obrigatórios' });
      }
      caminhoProcessado = arquivo.path; 
      const conversa = await garantirConversa(contaId, numero);
      mensagemSalva = await prisma.mensagem.create({
        data: {
          contaId: contaId,
          conversaId: conversa.id,
          usuarioId: usuarioId,
          tipo: 'AUDIO',
          direcao: 'ENVIADA',
          enviadaPor: nomeUsuario || 'Sistema',
          enviadaEm: new Date(),
          timestamp: new Date(),
          statusMensagem: 'ENVIANDO',
          lida: true,
          mediaNome: arquivo.originalname,
          mediaMimeType: arquivo.mimetype,
          mediaSize: arquivo.size,
        }
      });
      if (!arquivo.mimetype.includes('ogg')) {
        caminhoProcessado = await midiaServico.converterParaOgg(caminhoProcessado, arquivo.filename);
      } else {
        caminhoProcessado = moverParaMedia(caminhoProcessado, arquivo.filename);
      }
      const audProc = await midiaServico.processarAudio(caminhoProcessado);
      const urlAudio = midiaServico.obterUrlPublica(path.basename(caminhoProcessado));
      
      const resultado = await whatsappOfficial.enviarAudio(numero, urlAudio);
      if (!resultado.success) {
        throw new Error(resultado.error || 'Erro ao enviar áudio pelo WhatsApp');
      }

      const mensagemAtualizada = await prisma.mensagem.update({
        where: { id: mensagemSalva.id },
        data: {
          whatsappId: resultado.messageId,
          statusMensagem: 'ENVIADA',
          mediaUrl: urlAudio,
          mediaMimeType: 'audio/ogg',
          mediaSize: audProc.tamanho,
          mediaDuracao: audProc.duracao,
        }
      });
      await prisma.conversa.update({
        where: { id: conversa.id },
        data: { 
          ultimaMensagemEm: new Date(),
          arquivada: false,
          statusConversa: 'CAIXA_ENTRADA'
        }
      });
      res.json({ sucesso: true, mensagem: mensagemAtualizada });
    } catch (erro) {
      console.error('❌ Erro ao enviar áudio:', erro.message);
      if (mensagemSalva) {
        await prisma.mensagem.update({ where: { id: mensagemSalva.id }, data: { statusMensagem: 'ERRO' } });
      }
      if (caminhoProcessado && caminhoProcessado !== arquivo.path) deletarArquivo(caminhoProcessado);
      if (arquivo) deletarArquivo(arquivo.path);
      res.status(500).json({ sucesso: false, erro: erro.message });
    }
  }

  async enviarDocumento(req, res) {
    const { numero, legenda } = req.body;
    const { contaId, id: usuarioId, nome: nomeUsuario } = req.usuario;
    const arquivo = req.file;
    let mensagemSalva = null;
    let caminhoProcessado = null;
    try {
      if (!numero || !arquivo) {
        if (arquivo) deletarArquivo(arquivo.path);
        return res.status(400).json({ sucesso: false, erro: 'Número e documento são obrigatórios' });
      }
      caminhoProcessado = arquivo.path; 
      const conversa = await garantirConversa(contaId, numero);
      mensagemSalva = await prisma.mensagem.create({
        data: {
          contaId: contaId,
          conversaId: conversa.id,
          usuarioId: usuarioId,
          conteudo: legenda || null,
          tipo: 'DOCUMENTO',
          direcao: 'ENVIADA',
          enviadaPor: nomeUsuario || 'Sistema',
          enviadaEm: new Date(),
          timestamp: new Date(),
          statusMensagem: 'ENVIANDO',
          lida: true,
          mediaNome: arquivo.originalname,
          mediaMimeType: arquivo.mimetype,
          mediaSize: arquivo.size,
        }
      });
      caminhoProcessado = moverParaMedia(caminhoProcessado, arquivo.filename);
      const urlDocumento = midiaServico.obterUrlPublica(path.basename(caminhoProcessado));
      
      const resultado = await whatsappOfficial.enviarDocumento(
        numero,
        urlDocumento,
        arquivo.originalname,
        legenda || ''
      );
      if (!resultado.success) {
        throw new Error(resultado.error || 'Erro ao enviar documento pelo WhatsApp');
      }

      const mensagemAtualizada = await prisma.mensagem.update({
        where: { id: mensagemSalva.id },
        data: {
          whatsappId: resultado.messageId,
          statusMensagem: 'ENVIADA',
          mediaUrl: urlDocumento,
        }
      });
      await prisma.conversa.update({
        where: { id: conversa.id },
        data: { 
          ultimaMensagemEm: new Date(),
          arquivada: false,
          statusConversa: 'CAIXA_ENTRADA'
        }
      });
      res.json({ sucesso: true, mensagem: mensagemAtualizada });
    } catch (erro) {
      console.error('❌ Erro ao enviar documento:', erro.message);
      if (mensagemSalva) {
        await prisma.mensagem.update({ where: { id: mensagemSalva.id }, data: { statusMensagem: 'ERRO' } });
      }
      if (caminhoProcessado && caminhoProcessado !== arquivo.path) deletarArquivo(caminhoProcessado);
      if (arquivo) deletarArquivo(arquivo.path);
      res.status(500).json({ sucesso: false, erro: erro.message });
    }
  }

  async enviarLocalizacao(req, res) {
    const { numero, latitude, longitude, nome, endereco } = req.body;
    const { contaId, id: usuarioId, nome: nomeUsuario } = req.usuario;
    let mensagemSalva = null;
    try {
      if (!numero || !latitude || !longitude) {
        return res.status(400).json({ sucesso: false, erro: 'Número, latitude e longitude obrigatórios' });
      }
      const conversa = await garantirConversa(contaId, numero);
      mensagemSalva = await prisma.mensagem.create({
        data: {
          contaId: contaId,
          conversaId: conversa.id,
          usuarioId: usuarioId,
          tipo: 'LOCALIZACAO',
          direcao: 'ENVIADA',
          enviadaPor: nomeUsuario || 'Sistema',
          enviadaEm: new Date(),
          timestamp: new Date(),
          statusMensagem: 'ENVIANDO',
          lida: true,
          conteudo: JSON.stringify({ latitude, longitude, nome, endereco })
        }
      });
      
      const resultado = await whatsappOfficial.enviarLocalizacao(numero, latitude, longitude, nome || 'Localização', endereco || '');
      if (!resultado.success) {
        throw new Error(resultado.error || 'Erro ao enviar localização');
      }

      const mensagemAtualizada = await prisma.mensagem.update({
        where: { id: mensagemSalva.id },
        data: {
          whatsappId: resultado.messageId,
          statusMensagem: 'ENVIADA'
        }
      });
      await prisma.conversa.update({
        where: { id: conversa.id },
        data: { 
          ultimaMensagemEm: new Date(),
          arquivada: false,
          statusConversa: 'CAIXA_ENTRADA'
        }
      });
      res.json({ sucesso: true, mensagem: mensagemAtualizada, whatsappMessageId: resultado.messageId });
    } catch (erro) {
      console.error('❌ Erro ao enviar localização:', erro.message);
      if (mensagemSalva) {
        await prisma.mensagem.update({ where: { id: mensagemSalva.id }, data: { statusMensagem: 'ERRO' } });
      }
      res.status(500).json({ sucesso: false, erro: erro.message });
    }
  }

  async enviarContato(req, res) {
    const { numero, contatos } = req.body;
    const { contaId, id: usuarioId, nome: nomeUsuario } = req.usuario;
    let mensagemSalva = null;
    try {
      if (!numero || !contatos || contatos.length === 0) {
        return res.status(400).json({ sucesso: false, erro: 'Número e contatos são obrigatórios' });
      }
      const conversa = await garantirConversa(contaId, numero);
      mensagemSalva = await prisma.mensagem.create({
        data: {
          contaId: contaId,
          conversaId: conversa.id,
          usuarioId: usuarioId,
          tipo: 'CONTATO',
          direcao: 'ENVIADA',
          enviadaPor: nomeUsuario || 'Sistema',
          enviadaEm: new Date(),
          timestamp: new Date(),
          statusMensagem: 'ENVIANDO',
          lida: true,
          conteudo: JSON.stringify(contatos)
        }
      });
      
      const resultado = await whatsappOfficial.enviarContato(numero, contatos);
      if (!resultado.success) {
        throw new Error(resultado.error || 'Erro ao enviar contato');
      }

      const mensagemAtualizada = await prisma.mensagem.update({
        where: { id: mensagemSalva.id },
        data: {
          whatsappId: resultado.messageId,
          statusMensagem: 'ENVIADA'
        }
      });
      await prisma.conversa.update({
        where: { id: conversa.id },
        data: { 
          ultimaMensagemEm: new Date(),
          arquivada: false,
          statusConversa: 'CAIXA_ENTRADA'
        }
      });
      res.json({ sucesso: true, mensagem: mensagemAtualizada, whatsappMessageId: resultado.messageId });
    } catch (erro) {
      console.error('❌ Erro ao enviar contato:', erro.message);
      if (mensagemSalva) {
        await prisma.mensagem.update({ where: { id: mensagemSalva.id }, data: { statusMensagem: 'ERRO' } });
      }
      res.status(500).json({ sucesso: false, erro: erro.message });
    }
  }

  // ============================================
  // MÉTODOS DE IMPORTAÇÃO (Sem alterações)
  // ============================================

  async verificarContato(req, res) {
    try {
      const { numero } = req.params;
      const { contaId } = req.usuario;
      if (!numero) {
        return res.status(400).json({ sucesso: false, erro: 'Número é obrigatório' });
      }
      const numeroLimpo = numero.replace(/\D/g, '');
      const contato = await prisma.conversa.findFirst({
        where: { numeroCliente: numeroLimpo, contaId: contaId },
        select: { id: true }
      });
      res.json({ sucesso: true, existe: !!contato });
    } catch (erro) {
      console.error('❌ Erro ao verificar contato:', erro);
      res.status(500).json({ sucesso: false, erro: erro.message });
    }
  }

  async exportarContatosVCF(req, res) {
    try {
      const { contaId } = req.usuario;
      const contatos = await prisma.conversa.findMany({
        where: { contaId: contaId },
        select: { nomeContato: true, numeroCliente: true, email: true }
      });
      if (contatos.length === 0) {
        return res.status(404).json({ sucesso: false, erro: 'Nenhum contato para exportar' });
      }
      let vcfString = '';
      for (const contato of contatos) {
        const nome = contato.nomeContato || contato.numeroCliente;
        const numero = contato.numeroCliente;
        const email = contato.email;
        vcfString += 'BEGIN:VCARD\r\n';
        vcfString += 'VERSION:3.0\r\n';
        if (contato.nomeContato) {
          vcfString += `FN:${nome}\r\n`;
        } else {
          vcfString += `FN:${numero}\r\n`;
        }
        vcfString += `TEL;TYPE=CELL:${numero}\r\n`;
        if (email) {
          vcfString += `EMAIL:${email}\r\n`;
        }
        vcfString += 'END:VCARD\r\n';
      }
      res.setHeader('Content-Type', 'text/vcard; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="contatos.vcf"');
      res.status(200).send(vcfString);
    } catch (erro) {
      console.error('❌ Erro ao exportar contatos VCF:', erro);
      res.status(500).json({ sucesso: false, erro: erro.message });
    }
  }
  
  async importarContatosVCF(req, res) {
    try {
      const { contaId } = req.usuario;
      if (!req.file) {
        return res.status(400).json({ sucesso: false, erro: 'Nenhum arquivo .vcf enviado.' });
      }
      const filePath = req.file.path;
      let conexaoId;
      const conexao = await prisma.conexaoWhatsApp.findFirst({
        where: { contaId: contaId, status: 'CONECTADO' },
        orderBy: { atualizadoEm: 'desc' }
      });
      if (!conexao) {
         const primeiraConexao = await prisma.conexaoWhatsApp.findFirst({
            where: { contaId: contaId },
            orderBy: { criadaEm: 'asc' }
         });
         if (!primeiraConexao) {
            return res.status(400).json({ sucesso: false, erro: 'Nenhuma conexão WhatsApp ativa encontrada para associar os contatos.' });
         }
         conexaoId = primeiraConexao.id;
      } else {
         conexaoId = conexao.id;
      }

      const fileContent = fs.readFileSync(filePath, 'utf-8');
      const vcards = vcardParser.parse(fileContent);
      if (!vcards || vcards.length === 0) {
        return res.status(400).json({ sucesso: false, erro: 'Arquivo .vcf vazio ou inválido.' });
      }
      let contatosParaCriar = [];
      let falhas = 0;
      for (const vcard of vcards) {
        const nome = vcard.fn; 
        const telEntry = Array.isArray(vcard.tel) ? vcard.tel[0] : vcard.tel;
        const numero = telEntry?.value;
        const emailEntry = Array.isArray(vcard.email) ? vcard.email[0] : vcard.email;
        const email = emailEntry?.value;
        if (!nome || !numero) {
          falhas++;
          continue;
        }
        let numeroLimpo = numero.replace(/\D/g, '');
        if (numeroLimpo.startsWith('55') && (numeroLimpo.length === 12 || numeroLimpo.length === 13)) {
        } else if (numeroLimpo.length === 11) {
          numeroLimpo = '55' + numeroLimpo;
        } else if (numeroLimpo.length === 10) {
          numeroLimpo = '55' + numeroLimpo;
        } else {
          falhas++;
          continue;
        }
        contatosParaCriar.push({
          numeroCliente: numeroLimpo,
          nomeContato: nome,
          email: email || null,
          contaId: contaId,
          conexaoWhatsAppId: conexaoId,
          statusConversa: 'SEM_CONVERSA_SALVA',
          arquivada: false
        });
      }
      const resultado = await prisma.conversa.createMany({
        data: contatosParaCriar,
        skipDuplicates: true 
      });
      const sucessoCount = resultado.count;
      const duplicados = contatosParaCriar.length - sucessoCount;
      res.json({
        sucesso: true,
        mensagem: `${sucessoCount} contatos importados, ${falhas} inválidos, ${duplicados} já existiam.`
      });
    } catch (erro) {
      console.error('❌ Erro ao importar contatos VCF:', erro);
      res.status(500).json({ sucesso: false, erro: erro.message });
    } finally {
      if (req.file && req.file.path) {
        fs.unlinkSync(req.file.path);
      }
    }
  }

}

module.exports = new MensagensControlador();