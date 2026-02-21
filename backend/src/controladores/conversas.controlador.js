// backend/src/controladores/conversas.controlador.js - ✅ VERSÃO COMPLETAMENTE CORRIGIDA

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const fs = require('fs');
const vcardParser = require('vcard-parser');

// ============================================
// FUNÇÕES AUXILIARES
// ============================================

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

// ============================================
// CLASSE DO CONTROLADOR
// ============================================

class ConversasControlador {
  
// ============================================
  // OBTER CONVERSAS (CHATS) OU CONTATOS
  // ============================================
  async obterConversas(req, res, tipoLista = 'CHATS') {
    try {
      const { contaId } = req.usuario;
      // ✅ ADICIONADO: searchParam para buscar por nome/número
      let { filtro = 'TODAS', limite = 50, offset = 0, searchParam } = req.query; 
      
      const takeValue = tipoLista === 'CONTATOS' ? undefined : parseInt(limite);

      console.log(`\n📋 [OBTER ${tipoLista}]`);
      console.log('   - contaId:', contaId);
      console.log('   - searchParam:', searchParam);

      let where = { contaId: contaId };

      // ✅ LÓGICA DE BUSCA ADICIONADA
      if (searchParam) {
        where.OR = [
          { nomeContato: { contains: searchParam, mode: 'insensitive' } }, // Busca por nome (case insensitive)
          { numeroCliente: { contains: searchParam } }, // Busca por número
          { email: { contains: searchParam, mode: 'insensitive' } } // Busca por email
        ];
      }

      if (tipoLista === 'CHATS') {
        if (filtro === 'TODAS') filtro = 'CAIXA_ENTRADA';

        // Mantém a lógica existente dos filtros de abas
        switch (filtro) {
          case 'NAO_LIDAS':
            where.naoLidas = { gt: 0 };
            where.arquivada = false;
            where.statusConversa = { not: 'SEM_CONVERSA_SALVA' };
            break;
          case 'FAVORITAS':
            where.favorita = true;
            where.arquivada = false;
            where.statusConversa = { not: 'SEM_CONVERSA_SALVA' };
            break;
          case 'ARQUIVADAS':
            where.statusConversa = 'ARQUIVADA';
            where.arquivada = true;
            break;
          case 'CAIXA_ENTRADA':
          default:
            // Se estiver buscando (searchParam), ignoramos o status para achar o contato em qualquer lugar
            if (!searchParam) {
                where.statusConversa = 'CAIXA_ENTRADA';
                where.arquivada = false;
            }
            break;
        }
      }

      const conversas = await prisma.conversa.findMany({
        where,
        include: {
          mensagens: {
            orderBy: { enviadaEm: 'desc' },
            take: 1
          },
          conexaoWhatsApp: {
            select: {
              id: true,
              nomeInstancia: true,
              numeroWhatsApp: true,
              corIdentificacao: true
            }
          }
        },
        orderBy: [
          { fixada: 'desc' },
          { ultimaMensagemEm: 'desc' } // Ordena por mais recente
        ],
        skip: parseInt(offset),
        take: takeValue
      });

      const total = await prisma.conversa.count({ where });

      res.json({
        sucesso: true,
        // ✅ Mantemos a chave 'conversas' pois é o padrão do seu sistema
        conversas: conversas.map(c => ({
          id: c.id,
          numeroCliente: c.numeroCliente,
          nomeCliente: c.nomeContato || c.numeroCliente, // Prioriza o nome salvo
          nomeContato: c.nomeContato, // Campo original
          email: c.email,
          fotoUrl: c.fotoUrl || c.foto_perfil,
          naoLidas: c.naoLidas || 0,
          statusConversa: c.statusConversa,
          ultimaMensagem: c.mensagens[0] || null,
          conexaoWhatsApp: c.conexaoWhatsApp
        })),
        total,
        temMais: takeValue ? (parseInt(offset) + parseInt(limite)) < total : false
      });
    } catch (error) {
      console.error(`❌ Erro ao obter ${tipoLista.toLowerCase()}:`, error);
      res.status(500).json({ sucesso: false, erro: error.message });
    }
  }

  // ============================================
  // CRIAR CONVERSA (Para a Caixa de Entrada)
  // ============================================
  async criarConversa(req, res) {
    try {
      const { numeroCliente, nomeContato, email, conexaoWhatsAppId } = req.body;
      const { contaId } = req.usuario;

      if (!numeroCliente) {
        return res.status(400).json({
          sucesso: false,
          erro: 'Número do cliente é obrigatório'
        });
      }

      let conversa = await prisma.conversa.findFirst({
        where: {
          numeroCliente: numeroCliente,
          contaId: contaId
        }
      });

      if (conversa) {
        conversa = await prisma.conversa.update({
          where: { id: conversa.id },
          data: {
            statusConversa: 'CAIXA_ENTRADA',
            arquivada: false,
            nomeContato: nomeContato !== undefined ? nomeContato : conversa.nomeContato,
            email: email !== undefined ? email : conversa.email
          },
          include: { conexaoWhatsApp: true }
        });
        
        console.log('✅ Conversa existente movida para Caixa de Entrada:', conversa.id);
        return res.json({
          sucesso: true,
          conversa: conversa,
          mensagem: 'Conversa movida para a caixa de entrada'
        });
      }
      
      let conexaoId = conexaoWhatsAppId;
      if (!conexaoId) {
        const conexao = await prisma.conexaoWhatsApp.findFirst({
          where: { contaId: contaId, status: 'CONECTADO' },
          orderBy: { atualizadoEm: 'desc' }
        });

        if (!conexao) {
          return res.status(400).json({
            sucesso: false,
            erro: 'Nenhuma conexão WhatsApp ativa'
          });
        }
        conexaoId = conexao.id;
      }

      const novaConversa = await prisma.conversa.create({
        data: {
          numeroCliente: numeroCliente,
          nomeContato: nomeContato !== undefined ? nomeContato : numeroCliente,
          email: email,
          contaId: contaId,
          conexaoWhatsAppId: conexaoId,
          statusConversa: 'CAIXA_ENTRADA'
        },
        include: {
          conexaoWhatsApp: true
        }
      });

      console.log('✅ Nova conversa criada:', novaConversa.id);

      res.json({
        sucesso: true,
        conversa: novaConversa,
        mensagem: 'Conversa criada com sucesso'
      });
    } catch (error) {
      console.error('❌ Erro ao criar conversa:', error);
      res.status(500).json({ sucesso: false, erro: error.message });
    }
  }

  // ============================================
  // CRIAR CONTATO (Salvo Invisível)
  // ============================================
  async criarContato(req, res) {
    try {
      const { numeroCliente, nomeContato, email, conexaoWhatsAppId } = req.body;
      const { contaId } = req.usuario;

      if (!numeroCliente) {
        return res.status(400).json({
          sucesso: false,
          erro: 'Número do cliente é obrigatório'
        });
      }

      const conversaExistente = await prisma.conversa.findFirst({
        where: {
          numeroCliente: numeroCliente,
          contaId: contaId
        }
      });

      if (conversaExistente) {
        return res.status(400).json({
          sucesso: false,
          erro: 'Um contato com este número já existe'
        });
      }

      let conexaoId = conexaoWhatsAppId;
      if (!conexaoId) {
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
            return res.status(400).json({
              sucesso: false,
              erro: 'Nenhuma conexão WhatsApp encontrada para associar o contato.'
            });
          }
          conexaoId = primeiraConexao.id;
        } else {
          conexaoId = conexao.id;
        }
      }

      const novoContato = await prisma.conversa.create({
        data: {
          numeroCliente: numeroCliente,
          nomeContato: nomeContato !== undefined ? nomeContato : numeroCliente,
          email: email,
          contaId: contaId,
          conexaoWhatsAppId: conexaoId,
          statusConversa: 'SEM_CONVERSA_SALVA',
          arquivada: false
        },
        include: {
          conexaoWhatsApp: true
        }
      });

      console.log('✅ Novo contato criado (status: SEM_CONVERSA_SALVA):', novoContato.id);

      res.json({
        sucesso: true,
        conversa: novoContato,
        mensagem: 'Contato criado com sucesso'
      });
    } catch (error) {
      console.error('❌ Erro ao criar contato:', error);
      res.status(500).json({ sucesso: false, erro: error.message });
    }
  }

  // ============================================
  // OBTER DETALHES DA CONVERSA
  // ============================================
  async obterDetalhesConversa(req, res) {
    try {
      const { conversaId } = req.params;
      const { contaId } = req.usuario;

      const conversa = await prisma.conversa.findFirst({
        where: {
          id: conversaId,
          contaId: contaId
        },
        include: {
          conexaoWhatsApp: true,
          mensagens: {
            orderBy: { enviadaEm: 'desc' },
            take: 1
          }
        }
      });

      if (!conversa) {
        return res.status(404).json({
          sucesso: false,
          erro: 'Conversa não encontrada'
        });
      }

      const totalMensagens = await prisma.mensagem.count({
        where: { conversaId: conversa.id }
      });

      res.json({
        sucesso: true,
        conversa: {
          ...conversa,
          totalMensagens
        }
      });
    } catch (error) {
      console.error('❌ Erro ao obter detalhes:', error);
      res.status(500).json({ sucesso: false, erro: error.message });
    }
  }

  // ============================================
  // DELETAR CONVERSA
  // ============================================
  async deletarConversa(req, res) {
    try {
      const { conversaId } = req.params;
      const { contaId } = req.usuario;

      const conversa = await prisma.conversa.findFirst({
        where: {
          id: conversaId,
          contaId: contaId
        }
      });

      if (!conversa) {
        return res.status(404).json({
          sucesso: false,
          erro: 'Conversa não encontrada'
        });
      }

      await prisma.mensagem.deleteMany({
        where: { conversaId: conversaId }
      });
      await prisma.conversa.delete({
        where: { id: conversaId }
      });

      console.log('✅ Conversa deletada:', conversaId);

      res.json({
        sucesso: true,
        mensagem: 'Conversa deletada com sucesso'
      });
    } catch (error) {
      console.error('❌ Erro ao deletar conversa:', error);
      res.status(500).json({ sucesso: false, erro: error.message });
    }
  }

  // ============================================
  // ATUALIZAR CONVERSA (Edição de Contato)
  // ============================================
  async atualizarConversa(req, res) {
    try {
      const { conversaId } = req.params;
      const { nomeContato, email, observacoes } = req.body;
      const { contaId } = req.usuario;

      const conversa = await prisma.conversa.findFirst({
        where: {
          id: conversaId,
          contaId: contaId
        }
      });

      if (!conversa) {
        return res.status(404).json({
          sucesso: false,
          erro: 'Conversa (contato) não encontrada'
        });
      }

      const atualizada = await prisma.conversa.update({
        where: { id: conversaId },
        data: {
          nomeContato: nomeContato !== undefined ? nomeContato : conversa.nomeContato,
          email: email !== undefined ? email : conversa.email,
          observacoes: observacoes !== undefined ? observacoes : conversa.observacoes
        }
      });

      res.json({
        sucesso: true,
        conversa: atualizada,
        mensagem: 'Conversa (contato) atualizada com sucesso'
      });
    } catch (error) {
      console.error('❌ Erro ao atualizar conversa:', error);
      res.status(500).json({ sucesso: false, erro: error.message });
    }
  }

  // ============================================
  // AÇÕES NA CONVERSA
  // ============================================
  async acaoConversa(req, res) {
    try {
      const { conversaId } = req.params;
      const { acao } = req.body;
      const { contaId } = req.usuario;

      const conversa = await prisma.conversa.findFirst({
        where: {
          id: conversaId,
          contaId: contaId
        }
      });

      if (!conversa) {
        return res.status(404).json({
          sucesso: false,
          erro: 'Conversa não encontrada'
        });
      }

      let dataUpdate = {};
      let mensagem = '';

      switch (acao) {
        case 'fixar':
          dataUpdate = { fixada: !conversa.fixada };
          mensagem = conversa.fixada ? 'Conversa desfixada' : 'Conversa fixada';
          break;
        case 'favoritar':
          dataUpdate = { favorita: !conversa.favorita };
          mensagem = conversa.favorita ? 'Removida dos favoritos' : 'Adicionada aos favoritos';
          break;
        case 'arquivar':
          if (conversa.statusConversa === 'SEM_CONVERSA_SALVA') {
            return res.status(400).json({
              sucesso: false,
              erro: 'Não é possível arquivar um contato que ainda não é uma conversa.'
            });
          }
          dataUpdate = {
            arquivada: true,
            dataArquivamento: new Date(),
            statusConversa: 'ARQUIVADA'
          };
          mensagem = 'Conversa arquivada';
          break;
        case 'desarquivar':
          dataUpdate = {
            arquivada: false,
            dataArquivamento: null,
            statusConversa: 'CAIXA_ENTRADA'
          };
          mensagem = 'Conversa desarquivada';
          break;
        case 'silenciar':
          dataUpdate = { silenciada: !conversa.silenciada };
          mensagem = conversa.silenciada ? 'Notificações ativadas' : 'Conversa silenciada';
          break;
        default:
          return res.status(400).json({
            sucesso: false,
            erro: 'Ação inválida'
          });
      }

      await prisma.conversa.update({
        where: { id: conversaId },
        data: dataUpdate
      });

      res.json({
        sucesso: true,
        mensagem
      });
    } catch (error) {
      console.error('❌ Erro ao executar ação:', error);
      res.status(500).json({ sucesso: false, erro: error.message });
    }
  }

  // ============================================
  // MARCAR COMO LIDA
  // ============================================
  async marcarComoLida(req, res) {
    try {
      const { conversaId } = req.params;
      const { contaId } = req.usuario;

      const conversa = await prisma.conversa.findFirst({
        where: {
          id: conversaId,
          contaId: contaId
        }
      });

      if (!conversa) {
        return res.status(404).json({
          sucesso: false,
          erro: 'Conversa não encontrada'
        });
      }

      await prisma.$transaction([
        prisma.conversa.update({
          where: { id: conversaId },
          data: { naoLidas: 0 }
        }),
        prisma.mensagem.updateMany({
          where: {
            conversaId: conversaId,
            direcao: 'RECEBIDA',
            lida: false
          },
          data: { lida: true }
        })
      ]);

      res.json({
        sucesso: true,
        mensagem: 'Conversa marcada como lida'
      });
    } catch (error) {
      console.error('❌ Erro ao marcar como lida:', error);
      res.status(500).json({ sucesso: false, erro: error.message });
    }
  }

  // ============================================
  // OBTER PERFIL DO CONTATO
  // ============================================
  async obterPerfilContato(req, res) {
    try {
      const { numero } = req.params;
      const { contaId } = req.usuario;

      const conversa = await prisma.conversa.findFirst({
        where: {
          numeroCliente: numero,
          contaId: contaId
        },
        include: {
          mensagens: {
            select: { id: true }
          }
        }
      });

      if (!conversa) {
        return res.status(404).json({
          sucesso: false,
          erro: 'Contato não encontrado'
        });
      }

      const totalMensagens = conversa.mensagens.length;

      res.json({
        sucesso: true,
        nomeCliente: conversa.nomeContato,
        numeroCliente: conversa.numeroCliente,
        fotoPerfil: conversa.fotoUrl || conversa.foto_perfil,
        email: conversa.email,
        observacoes: conversa.observacoes,
        totalMensagens: totalMensagens,
        criadoEm: conversa.criadaEm,
        ultimaMensagemEm: conversa.ultimaMensagemEm
      });
    } catch (error) {
      console.error('❌ Erro ao obter perfil:', error);
      res.status(500).json({ sucesso: false, erro: error.message });
    }
  }

  // ============================================
  // ATUALIZAR PERFIL DO CONTATO
  // ============================================
  async atualizarPerfilContato(req, res) {
    try {
      const { numero } = req.params;
      const { nomeContato, email, observacoes } = req.body;
      const { contaId } = req.usuario;

      const conversa = await prisma.conversa.findFirst({
        where: {
          numeroCliente: numero,
          contaId: contaId
        }
      });

      if (!conversa) {
        return res.status(404).json({
          sucesso: false,
          erro: 'Contato não encontrado'
        });
      }

      const atualizada = await prisma.conversa.update({
        where: { id: conversa.id },
        data: {
          nomeContato: nomeContato !== undefined ? nomeContato : conversa.nomeContato,
          email: email !== undefined ? email : conversa.email,
          observacoes: observacoes !== undefined ? observacoes : conversa.observacoes
        }
      });

      res.json({
        sucesso: true,
        conversa: atualizada,
        mensagem: 'Perfil atualizado com sucesso'
      });
    } catch (error) {
      console.error('❌ Erro ao atualizar perfil:', error);
      res.status(500).json({ sucesso: false, erro: error.message });
    }
  }

  // ============================================
  // ETIQUETAS (TAGS)
  // ============================================
  async listarEtiquetas(req, res) {
    try {
      const { contaId } = req.usuario;
      const etiquetas = await prisma.etiqueta.findMany({
        where: { contaId: contaId },
        orderBy: { nome: 'asc' }
      });
      res.json({ sucesso: true, etiquetas });
    } catch (error) {
      console.error('❌ Erro ao listar etiquetas:', error);
      res.status(500).json({ sucesso: false, erro: error.message });
    }
  }

  // ============================================
  // VERIFICAR CONTATO
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
    } catch (error) {
      console.error('❌ Erro ao verificar contato:', error);
      res.status(500).json({ sucesso: false, erro: error.message });
    }
  }

  // ============================================
  // EXPORTAR CONTATOS VCF
  // ============================================
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
    } catch (error) {
      console.error('❌ Erro ao exportar contatos VCF:', error);
      res.status(500).json({ sucesso: false, erro: error.message });
    }
  }
// ============================================
// ✅ IMPORTAR CONTATOS VCF - VERSÃO COM PARSE MANUAL
// ============================================
async importarContatosVCF(req, res) {
  try {
    const { contaId } = req.usuario;
    
    if (!req.file) {
      return res.status(400).json({ sucesso: false, erro: 'Nenhum arquivo .vcf enviado.' });
    }
    
    const filePath = req.file.path;
    let conexaoId;
    
    // Buscar conexão
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
        return res.status(400).json({
          sucesso: false,
          erro: 'Nenhuma conexão WhatsApp encontrada.'
        });
      }
      conexaoId = primeiraConexao.id;
    } else {
      conexaoId = conexao.id;
    }

    // ✅ Ler e dividir manualmente os vCards
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    
    // Divide o arquivo em vCards individuais
    const vcardBlocks = fileContent.split('BEGIN:VCARD').filter(block => block.trim());
    
    if (vcardBlocks.length === 0) {
      return res.status(400).json({ sucesso: false, erro: 'Nenhum contato encontrado no arquivo.' });
    }
    
    let contatosParaCriar = [];
    let ignorados = 0;
    
    console.log(`\n📥 Processando ${vcardBlocks.length} contato(s) do VCF...`);
    
    // ✅ Função para extrair campo do vCard
    const extrairCampo = (vcardText, campo) => {
      const regex = new RegExp(`^${campo}[;:](.*)$`, 'mi');
      const match = vcardText.match(regex);
      if (!match) return null;
      
      let valor = match[1].trim();
      
      // Remove encoding se houver
      if (valor.includes('ENCODING=QUOTED-PRINTABLE:')) {
        valor = valor.split('ENCODING=QUOTED-PRINTABLE:')[1];
      }
      
      // Limpa prefixos comuns
      valor = valor.replace(/^(PREF:|CELL:|HOME:|VOICE:|WORK:)/gi, '');
      
      return valor.trim();
    };
    
    // ✅ Função para validar número brasileiro
    const validarNumeroBrasileiro = (numero) => {
      if (!numero) return null;
      
      // Remove tudo que não é número
      let limpo = numero.toString().replace(/\D/g, '');
      
      // Ignora muito curtos ou muito longos
      if (limpo.length < 10 || limpo.length > 15) return null;
      
      // Remove prefixos
      if (limpo.startsWith('0055')) {
        limpo = limpo.substring(4);
      } else if (limpo.startsWith('55')) {
        limpo = limpo.substring(2);
      }
      
      // Remove zero inicial
      if (limpo.startsWith('0') && limpo.length === 11) {
        limpo = limpo.substring(1);
      }
      
      // Aceita APENAS 10 ou 11 dígitos
      if (limpo.length !== 10 && limpo.length !== 11) {
        return null;
      }
      
      // Valida DDD (11-99)
      const ddd = parseInt(limpo.substring(0, 2));
      if (ddd < 11 || ddd > 99) {
        return null;
      }
      
      // Se for 11 dígitos, deve começar com 9
      if (limpo.length === 11) {
        const primeiro = limpo[2];
        if (primeiro !== '9') {
          return null;
        }
      }
      
      return '55' + limpo;
    };
    
    // ✅ Processa cada bloco vCard
    for (let i = 0; i < vcardBlocks.length; i++) {
      try {
        const vcardText = 'BEGIN:VCARD' + vcardBlocks[i];
        
        // Extrai nome
        let nome = extrairCampo(vcardText, 'FN');
        if (!nome) {
          nome = extrairCampo(vcardText, 'N');
        }
        
        // Decodifica nome se estiver em QUOTED-PRINTABLE
        if (nome && nome.includes('=')) {
          try {
            // Decode simples de QUOTED-PRINTABLE
            nome = nome.replace(/=([0-9A-F]{2})/g, (match, hex) => {
              return String.fromCharCode(parseInt(hex, 16));
            });
          } catch (e) {
            // Mantém nome original se falhar
          }
        }
        
        // Extrai todos os telefones do vCard
        const telRegex = /^TEL[^:]*:(.+)$/gmi;
        const telefones = [];
        let telMatch;
        
        while ((telMatch = telRegex.exec(vcardText)) !== null) {
          const tel = telMatch[1].trim();
          if (tel) {
            telefones.push(tel);
          }
        }
        
        // Tenta validar cada telefone
        let numero = null;
        for (const tel of telefones) {
          const numeroValidado = validarNumeroBrasileiro(tel);
          if (numeroValidado) {
            numero = numeroValidado;
            break;
          }
        }
        
        // Se não tem número válido, ignora
        if (!numero) {
          ignorados++;
          continue;
        }
        
        // Extrai email
        let email = extrairCampo(vcardText, 'EMAIL');
        
        // Adiciona à lista
        contatosParaCriar.push({
          numeroCliente: numero,
          nomeContato: nome || numero,
          email: email || null,
          contaId: contaId,
          conexaoWhatsAppId: conexaoId,
          statusConversa: 'SEM_CONVERSA_SALVA',
          arquivada: false
        });
        
        console.log(`   ✅ [${i + 1}] ${nome || 'Sem nome'} - ${numero}`);
        
      } catch (error) {
        console.error(`   ❌ [${i + 1}] Erro:`, error.message);
        ignorados++;
      }
    }
    
    // Verifica resultado
    if (contatosParaCriar.length === 0) {
      console.log(`\n⚠️  Nenhum contato válido encontrado!`);
      console.log(`   - Total: ${vcardBlocks.length}`);
      console.log(`   - Ignorados: ${ignorados}`);
      
      return res.status(400).json({
        sucesso: false,
        erro: 'Nenhum número brasileiro válido encontrado',
        detalhes: {
          total: vcardBlocks.length,
          ignorados: ignorados
        }
      });
    }
    
    // Salva no banco
    console.log(`\n💾 Salvando ${contatosParaCriar.length} contato(s)...`);
    
    const resultado = await prisma.conversa.createMany({
      data: contatosParaCriar,
      skipDuplicates: true
    });
    
    const sucessoCount = resultado.count;
    const duplicados = contatosParaCriar.length - sucessoCount;
    
    console.log(`\n✅ Importação concluída:`);
    console.log(`   - Criados: ${sucessoCount}`);
    console.log(`   - Duplicados: ${duplicados}`);
    console.log(`   - Ignorados: ${ignorados}`);
    console.log(`   - Total: ${vcardBlocks.length}`);
    
    res.json({
      sucesso: true,
      mensagem: `${sucessoCount} contato(s) importado(s)!`,
      detalhes: {
        criados: sucessoCount,
        duplicados: duplicados,
        ignorados: ignorados,
        total: vcardBlocks.length
      }
    });
    
  } catch (error) {
    console.error('❌ Erro ao importar:', error);
    res.status(500).json({
      sucesso: false,
      erro: error.message
    });
  } finally {
    if (req.file && req.file.path) {
      try {
        fs.unlinkSync(req.file.path);
        console.log('🗑️  Arquivo removido\n');
      } catch (e) {
        console.error('⚠️  Erro ao remover:', e.message);
      }
    }
  }
}
}

module.exports = new ConversasControlador();