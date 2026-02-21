// backend/src/controladores/autenticacao.controlador.js - ARQUIVO COMPLETO

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { PrismaClient } = require('@prisma/client');
const servicoStatus = require('../servicos/status.servico');

const prisma = new PrismaClient();

// ============================================
// HELPER: Garantir Conexão WhatsApp Oficial
// ============================================
async function garantirConexaoWhatsApp(contaId) {
  try {
    console.log(`🔧 [AUTO-CONECTAR] Verificando conexão para conta: ${contaId}`);
    
    let conexao = await prisma.conexaoWhatsApp.findFirst({
      where: {
        contaId: contaId,
        instancia: 1,
        tipoParceiro: 'META'
      }
    });

    if (!conexao) {
      console.log(`   🆕 Criando nova conexão WhatsApp Oficial...`);
      
      conexao = await prisma.conexaoWhatsApp.create({
        data: {
          contaId: contaId,
          instancia: 1,
          tipoParceiro: 'META',
          phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
          numeroWhatsApp: process.env.WHATSAPP_PHONE_NUMBER || '5511939205314',
          nomeInstancia: 'WhatsApp Business API',
          nomeExibicao: 'WhatsApp Oficial',
          status: 'CONECTADO',
          corIdentificacao: '#25D366',
          ultimaConexao: new Date()
        }
      });
      
      console.log(`   ✅ Conexão WhatsApp Oficial criada automaticamente`);
      console.log(`      ID: ${conexao.id}`);
      console.log(`      Status: ${conexao.status}`);
      
    } else if (conexao.status !== 'CONECTADO') {
      console.log(`   🔄 Reconectando WhatsApp Oficial...`);
      
      conexao = await prisma.conexaoWhatsApp.update({
        where: { id: conexao.id },
        data: {
          phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
          numeroWhatsApp: process.env.WHATSAPP_PHONE_NUMBER || '5511939205314',
          status: 'CONECTADO',
          ultimaConexao: new Date(),
          atualizadoEm: new Date()
        }
      });
      
      console.log(`   ✅ Conexão WhatsApp Oficial reconectada`);
      console.log(`      Status: ${conexao.status}`);
      
    } else {
      console.log(`   ✅ Conexão WhatsApp Oficial já está CONECTADA`);
    }
    
    return conexao;
    
  } catch (erro) {
    console.error('⚠️ [AUTO-CONECTAR] Erro ao garantir conexão WhatsApp:', erro.message);
    return null;
  }
}

// ============================================
// Envio de email (simulado)
// ============================================
const enviarEmailResetSenha = async (emailDestinatario, nomeUsuario, token) => {
  console.log('------------------------------------');
  console.log('📧 SIMULANDO ENVIO DE EMAIL DE RESET');
  console.log(`   Para: ${emailDestinatario} (Usuário: ${nomeUsuario})`);
  const resetUrl = `http://localhost:5173/resetar-senha/${token}`;
  console.log(`   Link de Reset: ${resetUrl}`);
  console.log('------------------------------------');
  return Promise.resolve();
};

// ============================================
// Gerar token JWT
// ============================================
const gerarToken = (usuarioId) => {
  return jwt.sign({ usuarioId }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// ============================================
// LOGIN DUAL - Email OU Nickname
// ============================================
const login = async (req, res) => {
  try {
    const { email, nickname, senha, tipoLogin } = req.body;
    
    console.log(`\n🔐 LOGIN TENTATIVA:`, {
      email: email || 'não fornecido',
      nickname: nickname || 'não fornecido',
      tipoLogin: tipoLogin || 'não especificado'
    });

    if (!senha) {
      return res.status(400).json({ erro: 'Senha é obrigatória.' });
    }

    if (!email && !nickname) {
      return res.status(400).json({ erro: 'Email ou nickname são obrigatórios.' });
    }

    let usuario;
    if (email) {
      usuario = await prisma.usuario.findUnique({
        where: { email },
        include: { conta: true, setor: true, categoria: true }
      });
    } else if (nickname) {
      usuario = await prisma.usuario.findUnique({
        where: { nickname },
        include: { conta: true, setor: true, categoria: true }
      });
    }

    if (!usuario) {
      console.log(`   ❌ Usuário não encontrado.`);
      return res.status(401).json({ erro: 'Credenciais incorretas.' });
    }
    
    console.log(`   ✅ Usuário encontrado: ${usuario.id} (Tipo: ${usuario.tipo})`);

    if (tipoLogin === 'empresa') {
      console.log('   🔍 Validando login como EMPRESA...');
      if (usuario.tipo !== 'OWNER' && usuario.tipo !== 'CEO' && usuario.tipo !== 'ADMIN_EMPRESA') {
        console.log(`   ❌ Tentativa de login de ${usuario.tipo} no portal de empresa.`);
        return res.status(403).json({
          erro: 'Apenas contas de empresa podem acessar este portal. Use o login de colaborador.'
        });
      }
      
      if (!usuario.email) {
        return res.status(400).json({ erro: 'Conta de empresa requer email.' });
      }
      
      console.log('   ✅ Tipo de usuário válido para login de empresa.');
    } else if (tipoLogin === 'membro' || tipoLogin === 'colaborador') {
      console.log('   🔍 Validando login como COLABORADOR...');
      if (usuario.tipo === 'OWNER' || usuario.tipo === 'ADMIN_EMPRESA') {
        console.log(`   ❌ Tentativa de login de ${usuario.tipo} no portal de colaboradores.`);
        return res.status(403).json({
          erro: 'Administradores e donos de empresa devem usar o login de Empresa.'
        });
      }
      
      if (!usuario.nickname) {
        return res.status(400).json({ erro: 'Colaborador requer nickname.' });
      }
      if (!usuario.cpf) {
        return res.status(400).json({ erro: 'Colaborador requer CPF cadastrado.' });
      }
      
      console.log('   ✅ Tipo de usuário válido para login de colaborador.');
    }
    console.log('👤 USUÁRIO ENCONTRADO:', usuario ? usuario.email : null);
    console.log('   ⏳ Comparando senhas...');
    const senhaValida = await bcrypt.compare(senha, usuario.senha);
    console.log('🔑 SENHA VÁLIDA?', senhaValida);

    if (!senhaValida) {
      console.log(`   ❌ Senha incorreta.`);
      return res.status(401).json({ erro: 'Credenciais incorretas.' });
    }
    console.log('   ✅ Senha válida!');

    if (usuario.status === 'INATIVO') {
      console.log(`   ❌ Usuário INATIVO.`);
      return res.status(403).json({ erro: 'Usuário inativo. Contate o administrador.' });
    }
    if (usuario.status === 'PENDENTE') {
      console.log(`   ❌ Usuário PENDENTE de aprovação.`);
      return res.status(403).json({ erro: 'Usuário pendente de aprovação.' });
    }

    // ✅ GARANTIR CONEXÃO WHATSAPP OFICIAL AUTOMATICAMENTE
    if (usuario.contaId) {
      await garantirConexaoWhatsApp(usuario.contaId);
    }

    await prisma.usuario.update({
      where: { id: usuario.id },
      data: { ultimoAcesso: new Date() }
    });

    try {
      servicoStatus.setStatus(usuario.id, 'disponivel');
      console.log(`   🟢 Status 'disponível' definido para ${usuario.nome}`);
    } catch (statusError) {
      console.error("   ⚠️ Erro ao definir status:", statusError.message);
    }

    const token = gerarToken(usuario.id);
    const { senha: _, ...usuarioSemSenha } = usuario;

    console.log(`   🎉 Login bem-sucedido para ${usuario.nome} (${usuario.tipo})`);
    
    res.json({
      sucesso: true,
      token,
      usuario: usuarioSemSenha,
      empresa: usuarioSemSenha.conta
    });

  } catch (erro) {
    console.error('Erro GERAL no login:', erro);
    res.status(500).json({ erro: 'Erro ao realizar login.', detalhes: erro.message });
  }
};

// ============================================
// REGISTRAR
// ============================================
const registrar = async (req, res) => {
  try {
    const {
      tipoConta, documento, razaoSocial, nomeFantasia, nomeCompleto,
      email, telefone, nomeUsuario, emailUsuario, senhaUsuario, cpfUsuario
    } = req.body;

    if (!tipoConta || !documento || !email) {
      return res.status(400).json({ erro: 'Dados da conta obrigatórios.' });
    }
    if (!nomeUsuario || !emailUsuario || !senhaUsuario) {
      return res.status(400).json({ erro: 'Dados do administrador obrigatórios.' });
    }
    if (senhaUsuario.length < 6) {
      return res.status(400).json({ erro: 'Senha deve ter no mínimo 6 caracteres.' });
    }

    const [contaExistente, emailUserExistente] = await Promise.all([
      prisma.conta.findUnique({ where: { documento } }),
      prisma.usuario.findUnique({ where: { email: emailUsuario } })
    ]);

    if (contaExistente) {
      return res.status(400).json({ erro: 'Documento já cadastrado.' });
    }
    if (emailUserExistente) {
      return res.status(400).json({ erro: 'Email já em uso.' });
    }

    const senhaHash = await bcrypt.hash(senhaUsuario, 10);

    const resultado = await prisma.$transaction(async (tx) => {
      const novaConta = await tx.conta.create({
        data: {
          tipo: tipoConta,
          documento,
          razaoSocial: tipoConta === 'EMPRESA' ? razaoSocial : null,
          nomeFantasia: tipoConta === 'EMPRESA' ? nomeFantasia : null,
          nomeCompleto: tipoConta === 'INDIVIDUAL' ? nomeCompleto : null,
          email,
          telefone,
          ativo: true,
          limiteWhatsApps: 2
        }
      });

      // ✅ CRIAR CONEXÃO WHATSAPP OFICIAL AUTOMATICAMENTE
      console.log(`🔧 [REGISTRO] Criando conexão WhatsApp Oficial para nova conta: ${novaConta.id}`);
      
      await tx.conexaoWhatsApp.create({
        data: {
          contaId: novaConta.id,
          instancia: 1,
          tipoParceiro: 'META',
          phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
          numeroWhatsApp: process.env.WHATSAPP_PHONE_NUMBER || '5511939205314',
          nomeInstancia: 'WhatsApp Business API',
          nomeExibicao: 'WhatsApp Oficial',
          status: 'CONECTADO',
          corIdentificacao: '#25D366',
          ultimaConexao: new Date()
        }
      });
      
      console.log(`   ✅ Conexão WhatsApp Oficial criada para nova conta`);

      const categoriaDefault = await tx.categoria.create({
        data: {
          nome: 'Sem categoria',
          contaId: novaConta.id
        }
      });

      const novoUsuario = await tx.usuario.create({
        data: {
          nome: nomeUsuario,
          email: emailUsuario,
          nickname: null,
          senha: senhaHash,
          cpf: cpfUsuario,
          telefone: telefone,
          tipo: 'ADMIN_EMPRESA',
          status: 'PENDENTE',
          contaId: novaConta.id,
          categoriaId: categoriaDefault.id,
          podeEnviarMsg: true,
          podeReceberMsg: true,
          podeGerenciarBot: true,
          podeVerRelatorios: true,
          podeGerenciarConexoes: true
        }
      });

      await tx.setor.create({
        data: {
          nome: 'Geral',
          descricao: 'Setor padrão',
          contaId: novaConta.id,
          ativo: true
        }
      });

      return { conta: novaConta, usuario: novoUsuario };
    });

    const { senha: _, ...usuarioSemSenha } = resultado.usuario;

    res.status(201).json({
      sucesso: true,
      mensagem: 'Conta criada! Aguardando aprovação do administrador do sistema.',
      conta: resultado.conta,
      usuario: usuarioSemSenha
    });

  } catch (erro) {
    console.error('Erro ao registrar:', erro);
    res.status(500).json({ erro: 'Erro ao criar conta.', detalhes: erro.message });
  }
};

// ============================================
// VERIFICAR SESSAO
// ============================================
const verificarSessao = async (req, res) => {
  try {
    const { senha: _, ...usuarioSemSenha } = req.usuario;
    
    if (usuarioSemSenha.contaId) {
      await garantirConexaoWhatsApp(usuarioSemSenha.contaId);
    }
    
    try {
      const statusAtual = servicoStatus.getStatus(usuarioSemSenha.id);
      if (!statusAtual || statusAtual.status === 'offline') {
        servicoStatus.setStatus(usuarioSemSenha.id, 'disponivel');
        console.log(`🔄 Status 'disponível' ao verificar sessão para ${usuarioSemSenha.nome}`);
      }
    } catch (statusError) {
      console.error("⚠️ Erro ao verificar/atualizar status:", statusError.message);
    }
    
    res.json({ valido: true, usuario: usuarioSemSenha });
  } catch (erro) {
    console.error('Erro ao verificar sessão:', erro);
    res.status(500).json({ erro: 'Erro interno.' });
  }
};

// ============================================
// ESQUECI SENHA
// ============================================
const esqueciSenha = async (req, res) => {
  try {
    const { email, nickname } = req.body;
    
    if (!email && !nickname) {
      return res.status(400).json({ erro: 'Email ou nickname é obrigatório.' });
    }

    console.log(`🔑 Solicitação de reset para: ${email || nickname}`);
    
    let usuario;
    if (email) {
      usuario = await prisma.usuario.findUnique({ where: { email } });
    } else if (nickname) {
      usuario = await prisma.usuario.findUnique({ where: { nickname } });
    }

    if (!usuario || usuario.status !== 'ATIVO') {
      console.log(`   ⚠️ Usuário não encontrado ou inativo, retornando sucesso.`);
      return res.json({
        sucesso: true,
        mensagem: 'Se as credenciais estiverem cadastradas, um link foi enviado.'
      });
    }

    if (!usuario.email) {
      return res.status(400).json({
        erro: 'Colaboradores devem contatar o administrador para redefinir senha.'
      });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    const expiryDate = new Date();
    expiryDate.setHours(expiryDate.getHours() + 1);

    await prisma.usuario.update({
      where: { id: usuario.id },
      data: { tokenResetSenha: hashedToken, tokenResetSenhaExpira: expiryDate }
    });
    
    console.log(`   ✅ Token hash salvo para ${usuario.nome}`);

    try {
      await enviarEmailResetSenha(usuario.email, usuario.nome, resetToken);
      console.log(`   ✅ Email de reset enviado para ${usuario.email}`);
      res.json({
        sucesso: true,
        mensagem: 'Se as credenciais estiverem cadastradas, um link foi enviado.'
      });
    } catch (emailError) {
      console.error('❌ Erro ao enviar email:', emailError);
      await prisma.usuario.update({
        where: { id: usuario.id },
        data: { tokenResetSenha: null, tokenResetSenhaExpira: null }
      });
      res.status(500).json({ erro: 'Erro ao enviar email. Tente mais tarde.' });
    }
  } catch (erro) {
    console.error('Erro em esqueciSenha:', erro);
    res.status(500).json({ erro: 'Erro interno.', detalhes: erro.message });
  }
};

// ============================================
// RESETAR SENHA
// ============================================
const resetarSenha = async (req, res) => {
  try {
    const { token } = req.params;
    const { novaSenha, confirmarNovaSenha } = req.body;

    if (!novaSenha || !confirmarNovaSenha) {
      return res.status(400).json({ erro: 'Senhas obrigatórias.' });
    }
    if (novaSenha !== confirmarNovaSenha) {
      return res.status(400).json({ erro: 'Senhas não coincidem.' });
    }
    if (novaSenha.length < 6) {
      return res.status(400).json({ erro: 'Senha deve ter no mínimo 6 caracteres.' });
    }

    console.log(`🔑 Reset com token: ${token.substring(0, 10)}...`);
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const usuario = await prisma.usuario.findFirst({
      where: {
        tokenResetSenha: hashedToken,
        tokenResetSenhaExpira: { gte: new Date() }
      }
    });

    if (!usuario) {
      console.log(`   ❌ Token inválido/expirado.`);
      return res.status(400).json({ erro: 'Token inválido ou expirado.' });
    }
    
    if (usuario.status !== 'ATIVO') {
      console.log(`   ❌ Usuário ${usuario.nome} não está ativo.`);
      await prisma.usuario.update({
        where: { id: usuario.id },
        data: { tokenResetSenha: null, tokenResetSenhaExpira: null }
      });
      return res.status(400).json({ erro: 'Conta não está ativa.' });
    }

    console.log(`   ✅ Token válido para: ${usuario.nome}`);
    const novaSenhaHash = await bcrypt.hash(novaSenha, 10);

    await prisma.usuario.update({
      where: { id: usuario.id },
      data: {
        senha: novaSenhaHash,
        tokenResetSenha: null,
        tokenResetSenhaExpira: null
      }
    });

    console.log(`   ✅ Senha resetada para ${usuario.nome}`);
    res.json({
      sucesso: true,
      mensagem: 'Senha redefinida! Faça login com a nova senha.'
    });
  } catch (erro) {
    console.error('Erro em resetarSenha:', erro);
    res.status(500).json({ erro: 'Erro interno.', detalhes: erro.message });
  }
};

// ============================================
// VERIFICAR SENHA DO ADMIN LOGADO
// ============================================
const verificarSenhaAdmin = async (req, res) => {
  try {
    const { senha } = req.body;
    const adminId = req.usuario.id;

    if (!senha) {
      return res.status(400).json({ valido: false, erro: 'Senha é obrigatória.' });
    }

    const adminSenhaHash = req.usuario.senha;
    const senhaValida = await bcrypt.compare(senha, adminSenhaHash);

    if (!senhaValida) {
      return res.status(401).json({ valido: false, erro: 'Senha incorreta.' });
    }

    res.json({ valido: true });
  } catch (erro) {
    console.error('Erro ao verificar senha do admin:', erro);
    res.status(500).json({ valido: false, erro: 'Erro interno.' });
  }
};

// ============================================
// EXPORTAÇÕES
// ============================================
module.exports = {
  login,
  registrar,
  verificarSessao,
  esqueciSenha,
  resetarSenha,
  verificarSenhaAdmin
};