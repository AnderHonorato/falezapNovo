// backend/src/rotas/status.rotas.js

const express = require('express');
const router = express.Router();
const servicoStatus = require('../servicos/status.servico');
const { verificarToken } = require('../middleware/autenticacao.middleware');

console.log("===> Arquivo status.rotas.js (PASSO 2 - Middleware Restaurado) carregado");

// Todas as rotas abaixo precisam de autenticação
router.use(verificarToken);

// =======================================================
// Rota /mudancas-recentes (Mantida)
// =======================================================
router.get('/mudancas-recentes', async (req, res) => {
  try {
    const mudancas = await servicoStatus.buscarMudancasRecentes();
    // console.log(`[API /mudancas-recentes] Retornando ${mudancas.length} mudanças.`);
    res.json({ mudancas: mudancas });
  } catch (erro) {
    console.error("Erro em /status/mudancas-recentes:", erro);
    res.status(500).json({ erro: "Erro interno ao buscar mudanças de status", detalhes: erro.message });
  }
});

// =======================================================
// Rotas com :usuarioId
// =======================================================

// Definir status de um usuário
router.post('/:usuarioId', async (req, res) => {
  // Log movido para DENTRO do try para só logar se o middleware passar
  // console.log(`===> ROTA ALCANÇADA (Passo 2): POST /api/status/${req.params.usuarioId}`);
  try {
    // ADDED: Log para confirmar que o middleware passou e temos req.usuario
    console.log(`===> ROTA ALCANÇADA (Passo 2 com Token): POST /api/status/${req.params.usuarioId} por usuário ${req.usuario?.id || 'ID N/A'}`);

    const { usuarioId } = req.params;
    const { status, configuracao } = req.body;

    // ADDED: Validação - Usuário só pode mudar o próprio status (a menos que seja admin/owner)
    if (req.usuario.id !== usuarioId && req.usuario.tipo !== 'OWNER' && req.usuario.tipo !== 'ADMIN_EMPRESA') {
         console.warn(`   -> Tentativa negada: Usuário ${req.usuario.id} tentando mudar status de ${usuarioId}.`);
         return res.status(403).json({ erro: 'Você só pode alterar seu próprio status.' });
    }


    if (!status) {
      console.log("   -> Erro: Status não fornecido no corpo da requisição.");
      return res.status(400).json({ erro: 'Status é obrigatório' });
    }
    console.log(`   -> Chamando servicoStatus.setStatus(${usuarioId}, ${status})...`);
    const resultado = await servicoStatus.setStatus(usuarioId, status, configuracao);
    console.log(`   -> servicoStatus.setStatus concluído.`);

    res.json({
      sucesso: true,
      mensagem: 'Status atualizado', // Mensagem simplificada
      ...resultado
    });
  } catch (erro) {
    console.error(`❌ Erro DENTRO da rota POST /api/status/${req.params.usuarioId} (APÓS TOKEN):`, erro);
    res.status(500).json({
      erro: 'Erro ao definir status',
      detalhes: erro.message
    });
  }
});

// --- Outras rotas mantidas como antes (com verificarToken onde já estava) ---
router.get('/:usuarioId', async (req, res) => {
    /* ... */ try { const { usuarioId } = req.params; const status = await servicoStatus.getStatus(usuarioId); res.json({ sucesso: true, ...status }); } catch(e){ console.error(`Erro GET /api/status/${req.params.usuarioId}:`, e); res.status(500).json({erro:e.message}); }
});
router.post('/:usuarioId/atividade', async (req, res) => {
    /* ... */ try { const { usuarioId } = req.params; await servicoStatus.atualizarAtividade(usuarioId); res.json({ sucesso: true, mensagem: 'Atividade atualizada' }); } catch(e){ console.error(`Erro POST /api/status/${req.params.usuarioId}/atividade:`, e); res.status(500).json({erro:e.message}); }
});
// MODIFIED: (Req 3) Rota de configurar-horarios
router.post('/:usuarioId/configurar-horarios', (req, res) => {
    /* ... */ try { 
        const { usuarioId } = req.params; 
        const { horarioAlmoco, horarioTrabalho } = req.body; 
        const h={}; 
        
        // MODIFIED: (Req 3) Verifica se a chave existe no body (para aceitar null)
        if(req.body.hasOwnProperty('horarioAlmoco')) {
            h.horarioAlmoco = horarioAlmoco; // Pode ser {obj} ou null
        }
        if(req.body.hasOwnProperty('horarioTrabalho')) {
            h.horarioTrabalho = horarioTrabalho; // Pode ser {obj} ou null
        }
        
        const c=servicoStatus.configurarHorarios(usuarioId, h); 
        res.json({sucesso:true,msg:'Horários config.',configuracao:c}); 
    } catch(e){ 
        console.error(`Erro POST /api/status/${req.params.usuarioId}/configurar-horarios:`, e); 
        res.status(500).json({erro:e.message}); 
    }
});
router.delete('/:usuarioId/configuracao', async (req, res) => {
    /* ... */ try { const { usuarioId } = req.params; await servicoStatus.removerConfiguracao(usuarioId); res.json({ sucesso: true, mensagem: 'Configuração removida' }); } catch(e){ console.error(`Erro DELETE /api/status/${req.params.usuarioId}/configuracao:`, e); res.status(500).json({erro:e.message}); }
 });
router.delete('/:usuarioId', async (req, res) => {
    /* ... */ try { const { usuarioId } = req.params; await servicoStatus.limparStatus(usuarioId); res.json({ sucesso: true, mensagem: 'Status limpo (logout)' }); } catch(e){ console.error(`Erro DELETE /api/status/${req.params.usuarioId}:`, e); res.status(500).json({erro:e.message}); }
});

// =======================================================
// ROTA PRINCIPAL DO CHAT INTERNO: LISTAR EQUIPE ONLINE
// =======================================================
// Substituída pela chamada de controlador com importação dinâmica
router.get('/equipe-online', async (req, res, next) => {
    try {
        // Importação dinâmica para evitar o ciclo de dependência
        const usuarioControlador = require('../controladores/usuario.controlador');
        // Chama a função correta
        return usuarioControlador.listarEquipeOnline(req, res, next);
    } catch (error) {
        console.error('Erro ao carregar controlador na rota /equipe-online:', error);
        res.status(500).json({ erro: 'Erro interno ao listar equipe.' });
    }
});


// Rota antiga de listar todos os status (Mantida por compatibilidade)
router.get('/', async (req, res) => {
    /* ... */ try { const lista = await servicoStatus.listarTodosComInfo(); res.json({ sucesso: true, total: lista.length, usuarios: lista }); } catch (erro) { console.error('Erro ao listar status da equipe:', erro); res.status(500).json({ erro: 'Erro ao listar status da equipe', detalhes: erro.message }); }
});


module.exports = router;