// backend/src/controladores/interativas.controlador.js

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const whatsappOfficial = require('../servicos/whatsappOfficial.servico');

class InterativasControlador {

  // ===== BLOCO 4: ENVIAR MENSAGEM COM BOTÕES =====
  async enviarBotoes(req, res) {
    try {
      const { numero, texto, botoes, header, footer } = req.body;
      const { contaId, id: usuarioId, nome: nomeUsuario } = req.usuario;

      console.log('\n🔘 [INTERATIVAS] Enviando botões:');
      console.log(`   - numero: ${numero}`);
      console.log(`   - botões: ${botoes.length}`);

      if (!numero || !texto || !botoes || botoes.length === 0) {
        return res.status(400).json({
          sucesso: false,
          erro: 'Número, texto e botões são obrigatórios'
        });
      }

      if (botoes.length > 3) {
        return res.status(400).json({
          sucesso: false,
          erro: 'Máximo de 3 botões permitido'
        });
      }

      // Enviar via API
      const resultado = await whatsappOfficial.enviarBotoes(
        numero,
        texto,
        botoes,
        header,
        footer
      );

      if (!resultado.success) {
        return res.status(500).json({
          sucesso: false,
          erro: resultado.error || 'Erro ao enviar botões'
        });
      }

      // Buscar ou criar conversa
      const conexao = await prisma.conexaoWhatsApp.findFirst({
        where: { contaId: contaId, status: 'CONECTADO' },
        orderBy: { atualizadoEm: 'desc' }
      });

      let conversa = await prisma.conversa.findFirst({
        where: { contaId: contaId, numeroCliente: numero }
      });

      if (!conversa && conexao) {
        conversa = await prisma.conversa.create({
          data: {
            contaId: contaId,
            numeroCliente: numero,
            nomeContato: numero,
            conexaoWhatsAppId: conexao.id,
            statusConversa: 'CAIXA_ENTRADA',
            naoLidas: 0
          }
        });
      }

      // Salvar mensagem
      if (conversa) {
        const mensagemSalva = await prisma.mensagem.create({
          data: {
            whatsappId: resultado.messageId,
            contaId: contaId,
            conversaId: conversa.id,
            usuarioId: usuarioId,
            conteudo: texto,
            tipo: 'TEXTO', // Pode criar um tipo 'INTERATIVA' depois
            direcao: 'ENVIADA',
            enviadaPor: nomeUsuario || 'Sistema',
            enviadaEm: new Date(),
            timestamp: new Date(),
            statusMensagem: 'ENVIADA',
            lida: true,
            // Guardar botões em JSON
            formatacao: JSON.stringify({
              tipo: 'botoes',
              botoes: botoes,
              header: header,
              footer: footer
            })
          }
        });

        await prisma.conversa.update({
          where: { id: conversa.id },
          data: { ultimaMensagemEm: new Date() }
        });

        return res.json({
          sucesso: true,
          mensagem: mensagemSalva,
          whatsappMessageId: resultado.messageId
        });
      }

      res.json({
        sucesso: true,
        whatsappMessageId: resultado.messageId,
        aviso: 'Botões enviados mas não foi possível salvar no banco'
      });

    } catch (erro) {
      console.error('❌ Erro ao enviar botões:', erro);
      res.status(500).json({ sucesso: false, erro: erro.message });
    }
  }

  // ===== BLOCO 4: ENVIAR LISTA INTERATIVA =====
  async enviarLista(req, res) {
    try {
      const { numero, texto, botaoTexto, secoes, header, footer } = req.body;
      const { contaId, id: usuarioId, nome: nomeUsuario } = req.usuario;

      console.log('\n📋 [INTERATIVAS] Enviando lista:');
      console.log(`   - numero: ${numero}`);
      console.log(`   - seções: ${secoes.length}`);

      if (!numero || !texto || !botaoTexto || !secoes || secoes.length === 0) {
        return res.status(400).json({
          sucesso: false,
          erro: 'Número, texto, botaoTexto e seções são obrigatórios'
        });
      }

      // Enviar via API
      const resultado = await whatsappOfficial.enviarLista(
        numero,
        texto,
        botaoTexto,
        secoes,
        header,
        footer
      );

      if (!resultado.success) {
        return res.status(500).json({
          sucesso: false,
          erro: resultado.error || 'Erro ao enviar lista'
        });
      }

      // Buscar conversa
      const conexao = await prisma.conexaoWhatsApp.findFirst({
        where: { contaId: contaId, status: 'CONECTADO' },
        orderBy: { atualizadoEm: 'desc' }
      });

      let conversa = await prisma.conversa.findFirst({
        where: { contaId: contaId, numeroCliente: numero }
      });

      if (!conversa && conexao) {
        conversa = await prisma.conversa.create({
          data: {
            contaId: contaId,
            numeroCliente: numero,
            nomeContato: numero,
            conexaoWhatsAppId: conexao.id,
            statusConversa: 'CAIXA_ENTRADA',
            naoLidas: 0
          }
        });
      }

      // Salvar mensagem
      if (conversa) {
        const mensagemSalva = await prisma.mensagem.create({
          data: {
            whatsappId: resultado.messageId,
            contaId: contaId,
            conversaId: conversa.id,
            usuarioId: usuarioId,
            conteudo: texto,
            tipo: 'TEXTO',
            direcao: 'ENVIADA',
            enviadaPor: nomeUsuario || 'Sistema',
            enviadaEm: new Date(),
            timestamp: new Date(),
            statusMensagem: 'ENVIADA',
            lida: true,
            formatacao: JSON.stringify({
              tipo: 'lista',
              botaoTexto: botaoTexto,
              secoes: secoes,
              header: header,
              footer: footer
            })
          }
        });

        await prisma.conversa.update({
          where: { id: conversa.id },
          data: { ultimaMensagemEm: new Date() }
        });

        return res.json({
          sucesso: true,
          mensagem: mensagemSalva,
          whatsappMessageId: resultado.messageId
        });
      }

      res.json({
        sucesso: true,
        whatsappMessageId: resultado.messageId,
        aviso: 'Lista enviada mas não foi possível salvar no banco'
      });

    } catch (erro) {
      console.error('❌ Erro ao enviar lista:', erro);
      res.status(500).json({ sucesso: false, erro: erro.message });
    }
  }

  // ===== BLOCO 4: ENVIAR TEMPLATE =====
  async enviarTemplate(req, res) {
    try {
      const { numero, nomeTemplate, languageCode, parametros } = req.body;
      const { contaId, id: usuarioId, nome: nomeUsuario } = req.usuario;

      console.log('\n📄 [INTERATIVAS] Enviando template:');
      console.log(`   - numero: ${numero}`);
      console.log(`   - template: ${nomeTemplate}`);

      if (!numero || !nomeTemplate) {
        return res.status(400).json({
          sucesso: false,
          erro: 'Número e nome do template são obrigatórios'
        });
      }

      // Criar componentes
      const componentes = [];

      if (parametros && parametros.length > 0) {
        componentes.push(whatsappOfficial.criarComponenteBody(parametros));
      }

      // Enviar via API
      const resultado = await whatsappOfficial.enviarTemplate(
        numero,
        nomeTemplate,
        languageCode || 'pt_BR',
        componentes
      );

      if (!resultado.success) {
        return res.status(500).json({
          sucesso: false,
          erro: resultado.error || 'Erro ao enviar template'
        });
      }

      // Buscar conversa
      const conexao = await prisma.conexaoWhatsApp.findFirst({
        where: { contaId: contaId, status: 'CONECTADO' },
        orderBy: { atualizadoEm: 'desc' }
      });

      let conversa = await prisma.conversa.findFirst({
        where: { contaId: contaId, numeroCliente: numero }
      });

      if (!conversa && conexao) {
        conversa = await prisma.conversa.create({
          data: {
            contaId: contaId,
            numeroCliente: numero,
            nomeContato: numero,
            conexaoWhatsAppId: conexao.id,
            statusConversa: 'CAIXA_ENTRADA',
            naoLidas: 0
          }
        });
      }

      // Salvar mensagem
      if (conversa) {
        const mensagemSalva = await prisma.mensagem.create({
          data: {
            whatsappId: resultado.messageId,
            contaId: contaId,
            conversaId: conversa.id,
            usuarioId: usuarioId,
            conteudo: `Template: ${nomeTemplate}`,
            tipo: 'TEXTO',
            direcao: 'ENVIADA',
            enviadaPor: nomeUsuario || 'Sistema',
            enviadaEm: new Date(),
            timestamp: new Date(),
            statusMensagem: 'ENVIADA',
            lida: true,
            formatacao: JSON.stringify({
              tipo: 'template',
              nomeTemplate: nomeTemplate,
              parametros: parametros
            })
          }
        });

        await prisma.conversa.update({
          where: { id: conversa.id },
          data: { ultimaMensagemEm: new Date() }
        });

        return res.json({
          sucesso: true,
          mensagem: mensagemSalva,
          whatsappMessageId: resultado.messageId
        });
      }

      res.json({
        sucesso: true,
        whatsappMessageId: resultado.messageId,
        aviso: 'Template enviado mas não foi possível salvar no banco'
      });

    } catch (erro) {
      console.error('❌ Erro ao enviar template:', erro);
      res.status(500).json({ sucesso: false, erro: erro.message });
    }
  }

}

module.exports = new InterativasControlador();
